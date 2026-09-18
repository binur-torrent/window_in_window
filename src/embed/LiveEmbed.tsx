import { useState } from "react";
import { DemoApp } from "./DemoApp";
import { EmbedStage } from "./EmbedStage";
import { useInView, usePlayback } from "./hooks";
import { BEATS } from "./mock";
import "./app.css";

const HOLDS = BEATS.map((beat) => beat.hold);

export type LiveEmbedProps = {
  height?: number | string;
  className?: string;
};

/**
 * The scripted variant: a fake product playing a mock agent run from
 * `mock.ts`. Nothing here is loaded over the network.
 */
export function LiveEmbed({ height = 620, className }: LiveEmbedProps) {
  const [rootRef, inView] = useInView<HTMLDivElement>(0.2);

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
    <EmbedStage
      height={height}
      className={className}
      rootRef={rootRef}
      aria-label="Scripted product interface preview"
      onPointerDown={() => setPaused(true)}
      onFocusCapture={() => setPaused(true)}
      controls={
        <>
          <span
            className="hm-badge"
            data-live={!finished && !paused ? true : undefined}
          >
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
        </>
      }
    >
      <DemoApp step={step} />
    </EmbedStage>
  );
}
