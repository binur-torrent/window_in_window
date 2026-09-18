import { EmbedStage } from "../EmbedStage";
import { useInView } from "../hooks";
import { BrowserApp } from "./BrowserApp";

export type BrowserEmbedProps = {
  height?: number | string;
  className?: string;
};

/**
 * The real variant: the same scaled window, but what is inside it is an actual
 * browser driving an actual iframe rather than a mock.
 */
export function BrowserEmbed({ height = 660, className }: BrowserEmbedProps) {
  const [rootRef, inView] = useInView<HTMLDivElement>(0.25);

  return (
    <EmbedStage
      height={height}
      className={className}
      rootRef={rootRef}
      aria-label="Embedded live browser"
    >
      <BrowserApp autoRun={inView} />
    </EmbedStage>
  );
}
