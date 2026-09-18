import { useState } from "react";
import { DemoApp } from "./DemoApp";
import { MotionBackdrop } from "./MotionBackdrop";
import { useFitScale, useInView, usePlayback } from "./hooks";
import { BEATS, DESIGN_HEIGHT, DESIGN_WIDTH } from "./mock";
import "./embed.css";
import "./app.css";

const HOLDS = BEATS.map((beat) => beat.hold);

export type LiveEmbedProps = {
  /** Height of the stage. The app inside scales to fit it. */
  height?: number | string;
  className?: string;
};

/**
 * A product demo that runs as real DOM inside the page — a window within the
 * window. The app is laid out at a fixed design size and scaled with one
 * transform, so resizing the page costs a single compositor operation instead
 * of re-laying-out the interface inside.
 */
export function LiveEmbed({ height = 620, className }: LiveEmbedProps) {
  const [rootRef, inView] = useInView<HTMLDivElement>(0.2);
  const frameRef = useFitScale(DESIGN_WIDTH, DESIGN_HEIGHT);

  /* Hovering only reveals the controls. The script keeps running until the
     visitor actually engages with the app, so the demo never freezes just
     because the cursor happened to cross it. */
  const [paused, setPaused] = useState(false);

  const { step, replay } = usePlayback({
    holds: HOLDS,
    running: inView && !paused,
  });

  const finished = step >= BEATS.length;

  return (
    <div
      ref={rootRef}
      className={`hm-root${className ? ` ${className}` : ""}`}
      style={{ height }}
      aria-label="Product interface preview"
      onPointerDown={() => setPaused(true)}
      onFocusCapture={() => setPaused(true)}
    >
      <MotionBackdrop />

      <div className="hm-stage">
        <div className="hm-frame" ref={frameRef}>
          <div
            className="hm-canvas"
            style={{ width: DESIGN_WIDTH, height: DESIGN_HEIGHT }}
          >
            <DemoApp step={step} />
          </div>
        </div>
      </div>

      <div className="hm-controls">
        <span className="hm-badge" data-live={!finished && !paused ? true : undefined}>
          <i />
          {paused
            ? "Paused — yours to explore"
            : finished
              ? "Task complete"
              : "Agent running"}
        </span>
        {paused && (
          <button type="button" onClick={() => setPaused(false)}>
            Resume
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            replay();
            setPaused(false);
          }}
        >
          Replay
        </button>
      </div>
    </div>
  );
}
