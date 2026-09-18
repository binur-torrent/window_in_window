# Window in Window

A live product-demo component: a complete fake desktop app rendered as **real DOM
inside your page**, like the interface preview on the Qoder homepage. No
screenshots, no video, no iframe, no backend — just a scripted mock timeline that
plays, loops, and hands control to the visitor when they click into it.

```bash
npm install
npm run dev
```

## How it works

The whole illusion rests on one idea: **the inner app is laid out at a fixed
design size and scaled to fit with a single transform.**

```
.hm-root          the stage (your section on the page)
├── backdrop      decorative ribbons, tracing dashes, breathing focus rings
└── .hm-frame     the measured box
    └── .hm-canvas  1280×800, out of flow, transform: scale(var(--fit))
        └── .nq-app  the fake product
```

`useFitScale` observes the frame and writes a single CSS variable:

```
--fit = min(frameWidth / 1280, frameHeight / 800)
```

That means resizing the page is **one compositor operation**. The app inside
never reflows, never re-renders, and never has to be responsive — it is always
laid out at exactly 1280×800, so every padding and font size stays pixel-exact
at any viewport.

Two details make this work reliably:

- The canvas is **absolutely positioned**. An in-flow child at design size would
  stretch the very element being measured, pinning `--fit` at 1 and overflowing.
- It is centred with `transform: scale(f) translate(-50%, -50%)` and
  `transform-origin: 0 0`. Scaling *before* translating puts the −50% shift in
  scaled space, so it stays exactly centred at every scale — `margin: auto`
  cannot do this, because over-constrained absolute positioning drops it.

Anything measuring DOM inside the canvas must use `offsetWidth` / `offsetHeight`
rather than `getBoundingClientRect()`, which comes back multiplied by `--fit`.

## Keeping it smooth

Measured at a locked 8.3 ms median frame time (120 Hz), zero frames over 20 ms:

- Only `transform`, `opacity` and `stroke-dashoffset` are animated. Nothing that
  animates touches layout.
- Blurred backdrop layers are promoted with `will-change: transform`, so the
  blur is rasterised once instead of every frame.
- Playback is **one pending timer at a time**, and an `IntersectionObserver`
  stops it entirely when the embed scrolls out of view.
- The typewriter is a single `requestAnimationFrame` loop mutating one text
  node — no per-character React state.
- Auto-scroll is an eased rAF loop instead of `scroll-behavior: smooth`, so it
  can be retargeted mid-flight while new content streams in.
- Only the newest revealed beat animates, so looping never re-animates history.
- `prefers-reduced-motion` collapses every animation.

## Dropping it into an existing project

The component is dependency-free (React only) and ships its own plain CSS, so
copy the `src/embed/` folder across and render it:

```tsx
import { LiveEmbed } from "./embed/LiveEmbed";

<LiveEmbed height="min(72vh, 660px)" />;
```

| Prop        | Default | Notes                                              |
| ----------- | ------- | -------------------------------------------------- |
| `height`    | `620`   | Stage height. The app inside scales to fit it.     |
| `className` | —       | Appended to the root, for your own layout wrapper. |

The stylesheets are imported by `LiveEmbed.tsx` itself. Every class is namespaced
(`hm-` for the stage, `nq-` for the app) and all inner styling is scoped under
`.nq-app`, which also resets its own typography and buttons — so it will not
inherit from or leak into your design system.

### Files

| File                | Role                                                      |
| ------------------- | --------------------------------------------------------- |
| `LiveEmbed.tsx`     | Public component: stage, fit-scaling, playback, controls  |
| `MotionBackdrop.tsx`| Decorative animated background                            |
| `DemoApp.tsx`       | The fake product shell (header, conversation, composer)   |
| `Sidebar.tsx`       | Sidebar with the animated mode switcher                   |
| `Conversation.tsx`  | Renders each timeline beat type                           |
| `hooks.ts`          | `useFitScale`, `usePlayback`, `useTypewriter`, autoscroll  |
| `mock.ts`           | **All content lives here** — design size and the script   |
| `embed.css`         | Stage, backdrop, framing, controls                        |
| `app.css`           | The fake product's interface                              |

## Changing the content

Everything shown is data in `src/embed/mock.ts`. Edit the `BEATS` array to
script a different run — each beat has a `hold` in milliseconds controlling how
long before the next appears. Beat kinds: `user`, `processed`, `assistant`,
`activity`, `note`, `group`, `thinking`, `result`.

To show your own product instead, replace `DemoApp` with your interface and keep
the stage. Change `DESIGN_WIDTH` / `DESIGN_HEIGHT` to match whatever size you
design it at.

## Interaction

The script keeps running while the cursor merely passes over the panel — it
pauses only when the visitor actually clicks or tabs into it, so it never
freezes unexpectedly. From there the app is genuinely usable: the mode switcher
animates, the file list expands, the composer accepts typing. `Resume` and
`Replay` sit in the bottom-right corner.
