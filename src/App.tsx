import { useState } from "react";
import { LiveEmbed } from "./embed/LiveEmbed";
import { BrowserEmbed } from "./embed/browser/BrowserEmbed";
import { PentestEmbed } from "./embed/pentest/PentestEmbed";
import "./page.css";

type Variant = "real" | "mock" | "pentest";

export default function App() {
  const [variant, setVariant] = useState<Variant>("real");

  return (
    <main className="page">
      <section className="page-hero">
        <span className="page-eyebrow">Live component</span>
        <h1>
          A website running <em>inside</em> your website.
        </h1>
        <p>
          The panel below is a window within the window: an interface laid out
          at a fixed design size and scaled to fit with a single transform, so
          it stays sharp and instant at any viewport.
        </p>

        <div className="page-switch" role="tablist" aria-label="Embed variant">
          <button
            type="button"
            role="tab"
            aria-selected={variant === "real"}
            onClick={() => setVariant("real")}
          >
            Real site
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={variant === "mock"}
            onClick={() => setVariant("mock")}
          >
            Scripted mock
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={variant === "pentest"}
            onClick={() => setVariant("pentest")}
          >
            Pentest
          </button>
        </div>
      </section>

      {variant === "real" ? (
        <BrowserEmbed height="min(76vh, 700px)" />
      ) : variant === "pentest" ? (
        <PentestEmbed height="min(76vh, 700px)" />
      ) : (
        <LiveEmbed height="min(76vh, 700px)" />
      )}

      {variant === "real" ? (
        <section className="page-notes">
          <div>
            <h2>A genuine iframe</h2>
            <p>
              The viewport holds a real <code>&lt;iframe&gt;</code> loading a
              real multi-page site from <code>/site/</code>, with a working
              history stack, address bar, and reload.
            </p>
          </div>
          <div>
            <h2>Real values, really entered</h2>
            <p>
              The agent focuses actual controls and writes through the native
              value setters, dispatching real <code>input</code> and{" "}
              <code>change</code> events. The saved brief is a real record.
            </p>
          </div>
          <div>
            <h2>Why it must be same-origin</h2>
            <p>
              Reading or filling a cross-origin frame is forbidden by the
              browser, and most sites refuse framing outright. Try another URL
              in the address bar to see it.
            </p>
          </div>
        </section>
      ) : variant === "mock" ? (
        <section className="page-notes">
          <div>
            <h2>Fixed design surface</h2>
            <p>
              The inner app is built at 1280×800 and never reflows. A{" "}
              <code>ResizeObserver</code> writes one CSS variable, and the
              container scales on the compositor.
            </p>
          </div>
          <div>
            <h2>Scripted, not simulated</h2>
            <p>
              The agent run plays from a mock timeline. One timer is pending at
              a time, and it pauses entirely when scrolled out of view.
            </p>
          </div>
          <div>
            <h2>Really interactive</h2>
            <p>
              Click anywhere inside to take over — the script pauses and you
              can work the mode switcher, expand the file list, or type in the
              composer.
            </p>
          </div>
        </section>
      ) : (
        <section className="page-notes page-notes-pentest">
          <div>
            <h2>Three realistic scan paths</h2>
            <p>Watch a repository run SAST, a web target run DAST, then a combined project run the full assessment.</p>
          </div>
          <div>
            <h2>Findings become fixes</h2>
            <p>The walkthrough follows live scan progress into a finding, a proposed patch, and a ready-to-review pull request.</p>
          </div>
          <div>
            <h2>Safe mock data</h2>
            <p>Every repository, domain, vulnerability, and pull request in this preview is fictional and stays in the browser.</p>
          </div>
        </section>
      )}
    </main>
  );
}
