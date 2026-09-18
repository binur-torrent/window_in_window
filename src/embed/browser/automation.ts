/**
 * A tiny automation driver for a *same-origin* iframe.
 *
 * Everything here reaches into the embedded document and performs genuine DOM
 * work: focusing real controls, setting real values through the native property
 * setters, dispatching real `input`/`change` events, and clicking real buttons.
 * None of it is simulated in the parent page.
 *
 * All of it depends on the frame being same-origin. Touching a cross-origin
 * document throws a `SecurityError`, which `getDocument` converts to `null`.
 */

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function getDocument(frame: HTMLIFrameElement | null) {
  if (!frame) return null;
  try {
    return frame.contentDocument ?? null;
  } catch {
    return null;
  }
}

export function getHref(frame: HTMLIFrameElement | null) {
  if (!frame) return null;
  try {
    return frame.contentWindow?.location.href ?? null;
  } catch {
    return null;
  }
}

/** Same-origin frames expose a readable location; cross-origin ones throw. */
export function isSameOrigin(frame: HTMLIFrameElement | null) {
  return getHref(frame) !== null;
}

/* ------------------------------------------------------------- injected UI */

const OVERLAY_STYLE = `
.__agent-cursor {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 2147483647;
  width: 18px;
  height: 18px;
  margin: -9px 0 0 -9px;
  border-radius: 50%;
  background: rgba(116, 201, 127, 0.28);
  box-shadow: 0 0 0 1.5px #74c97f, 0 0 18px rgba(116, 201, 127, 0.55);
  pointer-events: none;
  opacity: 0;
  transition:
    transform 0.5s cubic-bezier(0.22, 0.68, 0, 1),
    opacity 0.25s ease;
}
.__agent-cursor[data-visible="true"] { opacity: 1; }
.__agent-cursor[data-press="true"] { transform: var(--at) scale(0.55); }
.__agent-focus {
  outline: 2px solid #74c97f !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 5px rgba(116, 201, 127, 0.16) !important;
  transition: outline-color 0.2s ease, box-shadow 0.2s ease;
}
@media (prefers-reduced-motion: reduce) {
  .__agent-cursor { transition: none; }
}
`;

function ensureOverlay(doc: Document) {
  if (!doc.getElementById("__agent-style")) {
    const style = doc.createElement("style");
    style.id = "__agent-style";
    style.textContent = OVERLAY_STYLE;
    doc.head.appendChild(style);
  }

  let cursor = doc.getElementById("__agent-cursor");
  if (!cursor) {
    cursor = doc.createElement("div");
    cursor.id = "__agent-cursor";
    cursor.className = "__agent-cursor";
    doc.body.appendChild(cursor);
  }
  return cursor;
}

/** Glides the pointer dot to the centre of an element, in viewport space. */
async function moveCursorTo(doc: Document, element: Element) {
  const cursor = ensureOverlay(doc);
  const box = element.getBoundingClientRect();
  const x = Math.round(box.left + box.width / 2);
  const y = Math.round(box.top + box.height / 2);
  const at = `translate3d(${x}px, ${y}px, 0)`;

  cursor.style.setProperty("--at", at);
  cursor.style.transform = at;
  cursor.dataset.visible = "true";
  await sleep(520);
}

async function pressCursor(doc: Document) {
  const cursor = ensureOverlay(doc);
  cursor.dataset.press = "true";
  await sleep(150);
  cursor.dataset.press = "false";
}

export function hideCursor(doc: Document | null) {
  if (!doc) return;
  const cursor = doc.getElementById("__agent-cursor");
  if (cursor) cursor.dataset.visible = "false";
}

function focusRing(element: Element, on: boolean) {
  element.classList.toggle("__agent-focus", on);
}

/* ---------------------------------------------------------------- querying */

export async function waitForSelector(
  frame: HTMLIFrameElement,
  selector: string,
  timeout = 6000,
) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const doc = getDocument(frame);
    const element = doc?.querySelector(selector);
    if (element && doc?.readyState !== "loading") return element;
    await sleep(70);
  }

  throw new Error(`Timed out waiting for "${selector}"`);
}

/**
 * Resolves once the frame has finished loading a *different document* than the
 * one passed in.
 *
 * Comparing document identity rather than the URL string matters: navigating
 * to the page you are already on — or reloading — produces a brand new
 * document while `location.href` never changes, so a URL comparison would wait
 * forever.
 */
export async function waitForNavigation(
  frame: HTMLIFrameElement,
  previous: Document | null,
  timeout = 8000,
) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const doc = getDocument(frame);
    if (doc && doc !== previous && doc.readyState === "complete" && doc.body) {
      return getHref(frame);
    }
    await sleep(60);
  }

  throw new Error("Timed out waiting for navigation");
}

/* ----------------------------------------------------------------- actions */

/** The embedded frame's own realm, with its own constructors and prototypes. */
type FrameWindow = Window & typeof globalThis;

function frameWindow(frame: HTMLIFrameElement) {
  return (frame.contentWindow as FrameWindow | null) ?? null;
}

/**
 * React and other frameworks track an input's value on the DOM node, so
 * assigning `.value` directly can be swallowed. Going through the prototype's
 * native setter and then dispatching the events keeps it honest for any
 * framework the embedded page happens to use.
 *
 * The prototypes come from the frame's realm, not ours — `instanceof` across
 * realms is false, so the parent page's constructors would never match.
 */
function setNativeValue(win: FrameWindow, element: Element, value: string) {
  const prototype =
    element instanceof win.HTMLTextAreaElement
      ? win.HTMLTextAreaElement.prototype
      : element instanceof win.HTMLSelectElement
        ? win.HTMLSelectElement.prototype
        : win.HTMLInputElement.prototype;

  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  if (setter) setter.call(element, value);
  else (element as HTMLInputElement).value = value;
}

function fire(win: FrameWindow, element: Element, type: string) {
  element.dispatchEvent(new win.Event(type, { bubbles: true }));
}

export async function typeInto(
  frame: HTMLIFrameElement,
  selector: string,
  value: string,
  charDelay = 26,
) {
  const element = (await waitForSelector(frame, selector)) as HTMLElement;
  const doc = getDocument(frame);
  const win = frameWindow(frame);
  if (!doc || !win) throw new Error("Frame is not accessible");

  element.scrollIntoView({ block: "center", behavior: "smooth" });
  await moveCursorTo(doc, element);
  focusRing(element, true);
  (element as HTMLInputElement).focus();
  setNativeValue(win, element, "");

  for (let index = 1; index <= value.length; index += 1) {
    setNativeValue(win, element, value.slice(0, index));
    fire(win, element, "input");
    await sleep(charDelay);
  }

  fire(win, element, "change");
  focusRing(element, false);
  return value;
}

export async function selectOption(
  frame: HTMLIFrameElement,
  selector: string,
  value: string,
) {
  const element = (await waitForSelector(frame, selector)) as HTMLSelectElement;
  const doc = getDocument(frame);
  const win = frameWindow(frame);
  if (!doc || !win) throw new Error("Frame is not accessible");

  element.scrollIntoView({ block: "center", behavior: "smooth" });
  await moveCursorTo(doc, element);
  focusRing(element, true);
  element.focus();
  await sleep(180);

  setNativeValue(win, element, value);
  fire(win, element, "input");
  fire(win, element, "change");

  await sleep(220);
  focusRing(element, false);
  return element.options[element.selectedIndex]?.textContent ?? value;
}

export async function setChecked(
  frame: HTMLIFrameElement,
  selector: string,
  checked: boolean,
) {
  const element = (await waitForSelector(frame, selector)) as HTMLInputElement;
  const doc = getDocument(frame);
  const win = frameWindow(frame);
  if (!doc || !win) throw new Error("Frame is not accessible");

  element.scrollIntoView({ block: "center", behavior: "smooth" });
  await moveCursorTo(doc, element);
  focusRing(element, true);

  if (element.checked !== checked) {
    await pressCursor(doc);
    element.click();
  }

  await sleep(200);
  focusRing(element, false);
  return element.checked;
}

export async function clickElement(
  frame: HTMLIFrameElement,
  selector: string,
) {
  const element = (await waitForSelector(frame, selector)) as HTMLElement;
  const doc = getDocument(frame);
  if (!doc) throw new Error("Frame is not accessible");

  element.scrollIntoView({ block: "center", behavior: "smooth" });
  await moveCursorTo(doc, element);
  focusRing(element, true);
  await pressCursor(doc);
  focusRing(element, false);

  element.click();
}
