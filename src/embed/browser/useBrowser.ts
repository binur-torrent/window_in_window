import { useCallback, useEffect, useRef, useState } from "react";
import { getDocument, getHref, isSameOrigin } from "./automation";

export type FrameStatus = "loading" | "ready" | "external" | "blocked";

export type BrowserState = {
  url: string;
  title: string;
  status: FrameStatus;
  canGoBack: boolean;
  canGoForward: boolean;
  sameOrigin: boolean;
};

/**
 * Drives a real iframe: its own history stack, plus detection of navigations
 * the visitor triggers by clicking links inside the embedded page.
 *
 * The history is kept here rather than delegated to the frame's own
 * `history.back()` because a cross-origin frame exposes nothing we can read,
 * and even same-origin frames would leave the URL bar guessing.
 */
export function useBrowser(initialUrl: string) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  const [entries, setEntries] = useState<string[]>([initialUrl]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<FrameStatus>("loading");
  const [title, setTitle] = useState("");
  const [sameOrigin, setSameOrigin] = useState(true);

  /* The displayed URL is tracked separately: a link click inside the frame
     changes the real location before our stack knows about it. */
  const [url, setUrl] = useState(initialUrl);
  const blockTimer = useRef<number | undefined>(undefined);

  const armBlockDetection = useCallback(() => {
    window.clearTimeout(blockTimer.current);
    setStatus("loading");
    /* A frame that refuses to be embedded never fires a usable load, so an
       unanswered navigation after this long is reported as blocked. */
    blockTimer.current = window.setTimeout(() => setStatus("blocked"), 8000);
  }, []);

  /** Points the frame at a URL without touching the parent's history. */
  const load = useCallback(
    (target: string) => {
      const frame = frameRef.current;
      if (!frame) return;

      armBlockDetection();
      setUrl(target);

      /* Preferred path: `location.replace` navigates without adding an entry to
         the parent page's joint session history, so the browser's own Back
         button keeps working normally. Only same-origin frames allow it. */
      if (isSameOrigin(frame) && frame.contentWindow) {
        frame.contentWindow.location.replace(target);
        return;
      }

      /* Fallback for cross-origin frames, where only the attribute is
         reachable. Assigning the value it already holds would be a no-op, so
         blank it first and set the target once that has committed. */
      if (frame.getAttribute("src") === target) {
        frame.src = "about:blank";
        requestAnimationFrame(() => {
          if (frameRef.current) frameRef.current.src = target;
        });
        return;
      }

      frame.src = target;
    },
    [armBlockDetection],
  );

  const navigate = useCallback(
    (target: string) => {
      setEntries((current) => [...current.slice(0, index + 1), target]);
      setIndex((current) => current + 1);
      load(target);
    },
    [index, load],
  );

  const back = useCallback(() => {
    if (index === 0) return;
    const next = index - 1;
    setIndex(next);
    load(entries[next]);
  }, [entries, index, load]);

  const forward = useCallback(() => {
    if (index >= entries.length - 1) return;
    const next = index + 1;
    setIndex(next);
    load(entries[next]);
  }, [entries, index, load]);

  const reload = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return;
    armBlockDetection();
    if (isSameOrigin(frame) && frame.contentWindow) {
      frame.contentWindow.location.reload();
    } else {
      frame.src = entries[index];
    }
  }, [armBlockDetection, entries, index]);

  /* Reads whatever the frame will tell us after each load, and records
     navigations that originated inside the page. */
  const handleLoad = useCallback(() => {
    window.clearTimeout(blockTimer.current);
    const frame = frameRef.current;
    const href = getHref(frame);

    if (href === null) {
      setSameOrigin(false);
      setStatus("external");
      setTitle("");
      return;
    }

    setSameOrigin(true);
    setStatus("ready");
    setTitle(getDocument(frame)?.title ?? "");
    setUrl(href);

    setEntries((current) => {
      if (current[index] === href) return current;
      const next = [...current.slice(0, index + 1), href];
      setIndex(next.length - 1);
      return next;
    });
  }, [index]);

  useEffect(() => () => window.clearTimeout(blockTimer.current), []);

  const state: BrowserState = {
    url,
    title,
    status,
    sameOrigin,
    canGoBack: index > 0,
    canGoForward: index < entries.length - 1,
  };

  return {
    frameRef,
    state,
    initialUrl,
    navigate,
    back,
    forward,
    reload,
    handleLoad,
  };
}
