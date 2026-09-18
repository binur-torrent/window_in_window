import { LiveEmbed } from "./embed/LiveEmbed";
import "./page.css";

export default function App() {
  return (
    <main className="page">
      <section className="page-hero">
        <span className="page-eyebrow">Live component</span>
        <h1>
          A website running <em>inside</em> your website.
        </h1>
        <p>
          The panel below is not a screenshot or a video. It is a complete fake
          product rendered as real DOM, laid out at a fixed design size and
          scaled to fit with a single transform — so it stays sharp, instant,
          and interactive at any viewport.
        </p>
      </section>

      <LiveEmbed height="min(72vh, 660px)" />

      <section className="page-notes">
        <div>
          <h2>Fixed design surface</h2>
          <p>
            The inner app is built at 1280×800 and never reflows. A
            <code>ResizeObserver</code> writes one CSS variable, and the
            container scales on the compositor.
          </p>
        </div>
        <div>
          <h2>Scripted, not simulated</h2>
          <p>
            The agent run plays from a mock timeline. One timer is pending at a
            time, and it pauses entirely when scrolled out of view.
          </p>
        </div>
        <div>
          <h2>Really interactive</h2>
          <p>
            Click anywhere inside to take over — the script pauses and you can
            work the mode switcher, expand the file list, or type in the
            composer.
          </p>
        </div>
      </section>
    </main>
  );
}
