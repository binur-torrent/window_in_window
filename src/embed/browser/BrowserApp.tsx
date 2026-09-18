import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  GlobeIcon,
  LockIcon,
  PlayIcon,
  ReloadIcon,
  RestartIcon,
  StopIcon,
} from "../icons";
import { useBrowser } from "./useBrowser";
import { SCRIPT, SITE_HOME, runScript, type StepState } from "./script";
import { getDocument, hideCursor, isSameOrigin } from "./automation";
import "./browser.css";

const STORE_KEY = "harness-studio.briefs";

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") return <CheckCircleIcon size={13} />;
  if (state === "failed") return <AlertIcon size={13} />;
  if (state === "running") return <span className="bw-spinner" />;
  return <span className="bw-dot" />;
}

export function BrowserApp({ autoRun }: { autoRun: boolean }) {
  const { frameRef, state, initialUrl, navigate, back, forward, reload, handleLoad } =
    useBrowser(SITE_HOME);

  const [steps, setSteps] = useState<StepState[]>(() =>
    SCRIPT.map(() => "pending"),
  );
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const cancelled = useRef(false);
  const started = useRef(false);

  /* The address bar tracks the frame, except while the visitor is editing it.
     Tagging the draft with the URL it was typed against lets navigation reset
     it during render, with no synchronising effect. */
  const [draft, setDraft] = useState({ base: state.url, value: state.url });
  const address = draft.base === state.url ? draft.value : state.url;

  const start = useCallback(async () => {
    const frame = frameRef.current;
    if (!frame || running) return;

    if (!isSameOrigin(frame)) {
      setError(
        "This page is cross-origin, so the browser forbids reading or filling it. Load a page from this origin to run the script.",
      );
      return;
    }

    cancelled.current = false;
    setError(null);
    setRunning(true);
    setSteps(SCRIPT.map(() => "pending"));

    await runScript(
      { frame, navigate, cancelled: () => cancelled.current },
      (index, next, message) => {
        setSteps((current) => {
          const copy = [...current];
          copy[index] = next;
          return copy;
        });
        if (message) setError(message);
      },
    );

    hideCursor(getDocument(frame));
    setRunning(false);
  }, [frameRef, navigate, running]);

  const stop = useCallback(() => {
    cancelled.current = true;
    setRunning(false);
    hideCursor(getDocument(frameRef.current));
  }, [frameRef]);

  /** Clears the records the script created and returns to the first page. */
  const reset = useCallback(() => {
    cancelled.current = true;
    setRunning(false);
    setError(null);
    setSteps(SCRIPT.map(() => "pending"));

    const frame = frameRef.current;
    try {
      frame?.contentWindow?.localStorage.removeItem(STORE_KEY);
    } catch {
      /* Cross-origin frame: nothing of ours to clear. */
    }
    navigate(SITE_HOME);
  }, [frameRef, navigate]);

  /* `start` is rebuilt whenever the frame loads, so it cannot go in the deps of
     the auto-run effect: the re-run's cleanup would cancel the pending timer
     before it ever fired. A ref keeps the effect depending only on visibility. */
  const startRef = useRef(start);
  useEffect(() => {
    startRef.current = start;
  });

  /* Run once, the first time the embed is on screen. `started` is only set when
     the timer actually fires, so an early cleanup simply reschedules. */
  useEffect(() => {
    if (!autoRun || started.current) return;
    const timer = window.setTimeout(() => {
      started.current = true;
      startRef.current();
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [autoRun]);

  useEffect(() => () => {
    cancelled.current = true;
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = address.trim();
    if (!value) return;
    navigate(
      /^https?:\/\//.test(value) || value.startsWith("/")
        ? value
        : `https://${value}`,
    );
  };

  const completed = steps.filter((step) => step === "done").length;

  const statusLabel = useMemo(() => {
    if (state.status === "blocked") return "Refused to connect";
    if (state.status === "loading") return "Loading…";
    if (state.status === "external") return "Cross-origin — view only";
    return state.title || "Ready";
  }, [state.status, state.title]);

  return (
    <div className="bw-app">
      <aside className="bw-panel">
        <header className="bw-panel-head">
          <h2>Agent</h2>
          <span className="bw-progress-count">
            {completed}/{SCRIPT.length}
          </span>
        </header>

        <p className="bw-panel-lede">
          Each step below performs real DOM work inside the embedded page —
          focusing genuine controls, typing genuine values, clicking genuine
          buttons.
        </p>

        <ol className="bw-steps">
          {SCRIPT.map((step, index) => (
            <li key={step.id} data-state={steps[index]}>
              <span className="bw-step-icon">
                <StepIcon state={steps[index]} />
              </span>
              <span className="bw-step-label">{step.label}</span>
            </li>
          ))}
        </ol>

        {error && (
          <p className="bw-error">
            <AlertIcon size={13} />
            <span>{error}</span>
          </p>
        )}

        <div className="bw-panel-actions">
          {running ? (
            <button type="button" className="bw-btn" onClick={stop}>
              <StopIcon size={13} />
              Stop
            </button>
          ) : (
            <button type="button" className="bw-btn bw-btn-primary" onClick={start}>
              <PlayIcon size={13} />
              Run script
            </button>
          )}
          <button type="button" className="bw-btn" onClick={reset}>
            <RestartIcon size={13} />
            Reset
          </button>
        </div>
      </aside>

      <main className="bw-browser">
        <div className="bw-tabbar">
          <span className="bw-lights" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="bw-tab">
            <GlobeIcon size={12} />
            <b>{state.title || "Harness Studio"}</b>
          </span>
        </div>

        <div className="bw-toolbar">
          <button
            type="button"
            aria-label="Back"
            disabled={!state.canGoBack}
            onClick={back}
          >
            <ArrowLeftIcon size={14} />
          </button>
          <button
            type="button"
            aria-label="Forward"
            disabled={!state.canGoForward}
            onClick={forward}
          >
            <ArrowRightIcon size={14} />
          </button>
          <button type="button" aria-label="Reload" onClick={reload}>
            <ReloadIcon size={14} />
          </button>

          <form className="bw-urlbar" onSubmit={submit}>
            {state.sameOrigin ? <LockIcon size={12} /> : <GlobeIcon size={12} />}
            <input
              value={address}
              onChange={(event) =>
                setDraft({ base: state.url, value: event.target.value })
              }
              spellCheck={false}
              aria-label="Address"
            />
          </form>
        </div>

        <div className="bw-viewport" data-status={state.status}>
          <span className="bw-loadbar" data-active={state.status === "loading"} />

          <iframe
            ref={frameRef}
            src={initialUrl}
            title="Embedded site"
            onLoad={handleLoad}
            /* No sandbox: same-origin access is exactly what makes real
               navigation and form filling possible here. */
          />

          {state.status === "blocked" && (
            <div className="bw-blocked">
              <AlertIcon size={22} />
              <h3>This site refused to be embedded</h3>
              <p>
                It sends <code>X-Frame-Options</code> or a{" "}
                <code>frame-ancestors</code> policy that forbids framing. Only
                the site itself can change that.
              </p>
            </div>
          )}
        </div>

        <div className="bw-statusbar">
          <span data-status={state.status}>{statusLabel}</span>
          <span className="bw-statusbar-url">{state.url}</span>
        </div>
      </main>
    </div>
  );
}
