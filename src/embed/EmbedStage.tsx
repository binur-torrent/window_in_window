import type { ReactNode, Ref } from "react";
import { MotionBackdrop } from "./MotionBackdrop";
import { useFitScale } from "./hooks";
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "./mock";
import "./embed.css";

export type EmbedStageProps = {
  /** Height of the stage. Whatever is inside scales to fit it. */
  height?: number | string;
  className?: string;
  designWidth?: number;
  designHeight?: number;
  rootRef?: Ref<HTMLDivElement>;
  controls?: ReactNode;
  children: ReactNode;
  "aria-label"?: string;
  onPointerDown?: () => void;
  onFocusCapture?: () => void;
};

/**
 * The reusable "window inside the window": decorative backdrop, a measured
 * frame, and a fixed-size canvas scaled to fit with a single transform.
 *
 * Whatever is rendered inside is laid out at the design size and never has to
 * be responsive, so a page resize costs one compositor operation.
 */
export function EmbedStage({
  height = 620,
  className,
  designWidth = DESIGN_WIDTH,
  designHeight = DESIGN_HEIGHT,
  rootRef,
  controls,
  children,
  onPointerDown,
  onFocusCapture,
  ...rest
}: EmbedStageProps) {
  const frameRef = useFitScale(designWidth, designHeight);

  return (
    <div
      ref={rootRef}
      className={`hm-root${className ? ` ${className}` : ""}`}
      style={{ height }}
      onPointerDown={onPointerDown}
      onFocusCapture={onFocusCapture}
      {...rest}
    >
      <MotionBackdrop />

      <div className="hm-stage">
        <div className="hm-frame" ref={frameRef}>
          <div
            className="hm-canvas"
            style={{ width: designWidth, height: designHeight }}
          >
            {children}
          </div>
        </div>
      </div>

      {controls ? <div className="hm-controls">{controls}</div> : null}
    </div>
  );
}
