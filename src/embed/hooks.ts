import { useEffect, useRef, useState } from "react";

/**
 * Scales a fixed-size design surface to fit its container using a single CSS
 * custom property. The value is written straight to the DOM node instead of
 * going through state, so a resize never triggers a React render or a reflow
 * of the app rendered inside.
 */
export function useFitScale(
  designWidth: number,
  designHeight: number,
  maxScale = 1,
) {
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    let raf = 0;
    let last = -1;

    const apply = (width: number, height: number) => {
      const next = Math.min(
        maxScale,
        width / designWidth,
        height / designHeight,
      );
      if (Math.abs(next - last) < 0.0005) return;
      last = next;
      frame.style.setProperty("--fit", String(next));
    };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const box = entry.contentBoxSize?.[0];
      const width = box ? box.inlineSize : entry.contentRect.width;
      const height = box ? box.blockSize : entry.contentRect.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => apply(width, height));
    });

    observer.observe(frame);
    apply(frame.clientWidth, frame.clientHeight);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [designWidth, designHeight, maxScale]);

  return frameRef;
}

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** True while at least `ratio` of the element is on screen. */
export function useInView<T extends HTMLElement>(ratio = 0.25) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: ratio },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ratio]);

  return [ref, inView] as const;
}

type PlaybackOptions = {
  holds: number[];
  running: boolean;
  loopDelay?: number;
  speed?: number;
};

/**
 * Reveals a scripted sequence one step at a time, then loops. A single pending
 * timer exists at any moment, so an off-screen or paused embed costs nothing.
 */
export function usePlayback({
  holds,
  running,
  loopDelay = 3200,
  speed = 1,
}: PlaybackOptions) {
  const [step, setStep] = useState(0);
  const total = holds.length;

  useEffect(() => {
    if (!running) return;

    if (step >= total) {
      const timer = setTimeout(() => setStep(0), loopDelay);
      return () => clearTimeout(timer);
    }

    const wait = Math.max(120, (holds[step] ?? 600) / speed);
    const timer = setTimeout(() => setStep((current) => current + 1), wait);
    return () => clearTimeout(timer);
  }, [step, running, total, loopDelay, speed, holds]);

  return { step, replay: () => setStep(0) };
}

/**
 * Character-by-character reveal driven by a single rAF loop that mutates one
 * text node. No per-character state updates, so long strings stay free.
 */
export function useTypewriter(text: string, active: boolean, cps = 85) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (!active) {
      node.textContent = "";
      return;
    }

    if (prefersReducedMotion()) {
      node.textContent = text;
      return;
    }

    let raf = 0;
    let start = 0;
    let shown = -1;

    const tick = (now: number) => {
      if (!start) start = now;
      const count = Math.min(
        text.length,
        Math.floor(((now - start) / 1000) * cps),
      );
      if (count !== shown) {
        shown = count;
        node.textContent = text.slice(0, count);
      }
      if (count < text.length) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, active, cps]);

  return ref;
}

/**
 * Keeps a scroll container pinned to the bottom as content streams in, using an
 * eased rAF loop rather than `scroll-behavior: smooth` so it can be retargeted
 * mid-flight without stuttering.
 */
export function useAutoScroll(dependency: number) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (prefersReducedMotion()) {
      node.scrollTop = node.scrollHeight;
      return;
    }

    let raf = 0;
    const tick = () => {
      const target = node.scrollHeight - node.clientHeight;
      const delta = target - node.scrollTop;
      if (Math.abs(delta) < 0.5) {
        node.scrollTop = target;
        return;
      }
      node.scrollTop += delta * 0.18;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dependency]);

  return ref;
}
