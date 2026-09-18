# Window in Window

A live product-demo component: a framed "window inside the window" on your page,
scaled to fit with a single CSS transform. It ships in two variants.

| Variant | What is inside the window | Content |
| ------- | ------------------------- | ------- |
| **Real site** (`BrowserEmbed`) | A browser — tabs, back/forward/reload, address bar — wrapping a genuine `<iframe>` | A real multi-page site in `public/site/`, driven by a real automation script |
| **Scripted mock** (`LiveEmbed`) | A fake desktop agent app rendered as DOM | A mock timeline in `src/embed/mock.ts` |

```bash
npm install
npm run dev
```

---

## The same-origin constraint (read this first)

The "Real site" variant navigates a real page and **types real values into real
form fields**. That is only possible because the embedded site is served from
the app's own origin. What you may do to an iframe depends entirely on origin,
and this is a browser security boundary, not a library limitation:

| | Same origin (`/site/…`) | Cross-origin (`https://other.com`) |
| --- | --- | --- |
| Render it | Yes | Only if the site permits framing |
| Read its URL and title | Yes | No — throws `SecurityError` |
| Navigate it programmatically | Yes | Only by reassigning `src` |
| **Read or fill its DOM** | **Yes** | **Never** |

Two separate things block third-party sites:

1. **`X-Frame-Options` / `frame-ancestors`.** Most large sites refuse framing
   outright, so nothing renders. The component detects the silent failure and
   shows a "refused to be embedded" panel.
2. **Same-origin policy.** Even when a cross-origin site *does* render, reading
   or writing its document is forbidden. The component reports
   "Cross-origin — view only" and the automation refuses to run.

Type any external URL into the address bar to see both behaviours.

**If you need automation against a site you do not control**, the browser cannot
do it alone. That requires a backend: either an HTML-rewriting proxy that
re-serves the site on your origin, or a headless browser (Playwright,
Browserbase, CDP screencast) streaming frames with input injected server-side.

---

## How the window scales

The interface inside is laid out at a **fixed design size** (1280×800) and
scaled to fit:

```
--fit = min(frameWidth / 1280, frameHeight / 800)
```

`useFitScale` observes the frame and writes that one CSS variable, so resizing
the page is a single compositor operation. Nothing inside reflows or re-renders,
which is why it stays pixel-exact at any viewport.

Two details this depends on:

- The canvas is **absolutely positioned**. In normal flow it would stretch the
  very element being measured, pinning `--fit` at 1 and overflowing.
- It is centred with `transform: scale(f) translate(-50%, -50%)` and
  `transform-origin: 0 0`. Scaling *before* translating puts the −50% shift in
  scaled space. `margin: auto` cannot do this — over-constrained absolute
  positioning discards it.

Anything measuring DOM inside the canvas must use `offsetWidth` / `offsetHeight`,
never `getBoundingClientRect()`, which returns values multiplied by `--fit`.

---

## How the automation works

`src/embed/browser/automation.ts` reaches into the same-origin frame and does
genuine DOM work. Nothing is faked in the parent page:

- Values are written through the **native prototype setters**, then real
  `input` and `change` events are dispatched — so the embedded page reacts
  exactly as it would to a human, whatever framework it uses.
- Those prototypes are taken from **the frame's own realm**
  (`frame.contentWindow.HTMLInputElement`). `instanceof` is false across
  realms, so the parent's constructors would never match.
- A pointer dot is injected into the frame and glides to each control, so you
  can watch it work.

`waitForNavigation` compares **document identity**, not the URL string. That
matters because navigating to the page you are already on, or reloading,
creates a new document while `location.href` never changes — a URL comparison
would hang forever.

The script lives in `src/embed/browser/script.ts` as a list of steps
(`navigate`, `click`, `type`, `select`, `check`, `verify`, `pause`). It opens the
site, follows a link, fills five controls, submits the form, and confirms the
saved record. The result is a real entry in the embedded site's
`localStorage`.

---

## Keeping it smooth

Steady state is **8.3 ms median frame time** — a locked 120 Hz, identical to the
variant with no iframe at all. Getting there was mostly about what *not* to
animate. Each of these was measured, not guessed:

- **Never animate `transform` on a blurred layer.** Chrome re-runs the blur
  every frame instead of caching it. The drifting `filter: blur(22px)` ribbon
  cost ~7 ms/frame by itself; `will-change: transform` did not help. It is now
  static.
- **Radial gradients do not need `blur()`.** The glow blobs had
  `filter: blur(90px)` over an already-smooth `radial-gradient` — pure cost,
  zero visual gain. Removed.
- **A `backdrop-filter` *inside* the iframe wrecked the *host* page.** The
  embedded site's sticky header used `backdrop-filter: blur(10px)`, which
  re-evaluated whenever the embed's backdrop animation repainted behind it:
  16.5 ms versus 8.3 ms. The header is now opaque.
- **Only one animated backdrop layer.** Two concurrent ones measured 16.3 ms
  against 8.3 ms for either alone, so the dash tracing animates and the focus
  rings stay still.
- Playback in the mock variant keeps **one pending timer**, stopped entirely by
  an `IntersectionObserver` when off screen.
- The typewriter is a single `requestAnimationFrame` loop mutating one text
  node — no per-character React state.
- `prefers-reduced-motion` collapses every animation.

Measure it yourself in the console; note that an unfocused window throttles
`requestAnimationFrame` and will report 16.7 ms or 25 ms (exact vsync multiples)
regardless of the code.

---

## Dropping it into an existing project

Dependency-free apart from React, with its own plain CSS. Copy `src/embed/`
across, plus `public/site/` if you want the demo target:

```tsx
import { BrowserEmbed } from "./embed/browser/BrowserEmbed";
import { LiveEmbed } from "./embed/LiveEmbed";

<BrowserEmbed height="min(76vh, 700px)" />;
<LiveEmbed height={620} />;
```

Both take `height` and `className`. Stylesheets are imported by the components
themselves. Classes are namespaced — `hm-` for the stage, `bw-` for the browser,
`nq-` for the mock app — and the inner styles reset their own typography and
buttons, so nothing inherits from or leaks into your design system.

### Files

| File | Role |
| --- | --- |
| `EmbedStage.tsx` | Shared window: backdrop, measured frame, fit-scaling |
| `MotionBackdrop.tsx` | Decorative background |
| `hooks.ts` | `useFitScale`, `useInView`, `usePlayback`, typewriter, autoscroll |
| `browser/BrowserEmbed.tsx` | Real-site variant entry point |
| `browser/BrowserApp.tsx` | Browser chrome, iframe, agent step panel |
| `browser/useBrowser.ts` | History stack, load/blocked/cross-origin detection |
| `browser/automation.ts` | The driver that fills the real page |
| `browser/script.ts` | **The steps the agent performs** |
| `LiveEmbed.tsx`, `DemoApp.tsx`, `Sidebar.tsx`, `Conversation.tsx` | Mock variant |
| `mock.ts` | Design size, and the mock script |
| `public/site/` | The real embedded site (3 pages, a form, `localStorage`) |

## Pointing it at your own app

Change `SITE_HOME` in `browser/script.ts` to any path **on your origin**, then
rewrite `SCRIPT` with the selectors and values for your own forms. If your app
runs on a different port in development, proxy it to the same origin in
`vite.config.ts` — the automation needs one origin, not one server.
