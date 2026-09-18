import { useLayoutEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  AutomationIcon,
  BookIcon,
  CodeModeIcon,
  ExtensionIcon,
  GaugeIcon,
  GeneralModeIcon,
  NewTaskIcon,
  PanelLeftIcon,
  PlusIcon,
  RocketIcon,
  SearchIcon,
  SettingsIcon,
} from "./icons";
import { RECENT_CONVERSATIONS, SESSION_TITLE, WORKSPACE } from "./mock";

const MODES = [
  { id: "coding", label: "Coding", Icon: CodeModeIcon },
  { id: "general", label: "General", Icon: GeneralModeIcon },
] as const;

type ModeId = (typeof MODES)[number]["id"];

/**
 * The pill switcher measures its labels once, then animates only `transform`
 * and `width` on a single indicator element. The inactive option collapses to
 * its icon, which is how the original reads as a native control.
 */
function ModeSwitcher() {
  const [active, setActive] = useState<ModeId>("coding");
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const [labelWidths, setLabelWidths] = useState<number[]>([44, 50]);

  useLayoutEffect(() => {
    const node = measureRef.current;
    if (!node) return;
    /* offsetWidth, not getBoundingClientRect: this subtree lives inside a
       scaled canvas, and a rect would come back multiplied by that scale. */
    const widths = Array.from(node.children).map(
      (child) => (child as HTMLElement).offsetWidth,
    );
    if (widths.length) setLabelWidths(widths);
  }, []);

  const ICON_SLOT = 28;
  const GAP = 4;

  const widths = MODES.map((mode, index) =>
    mode.id === active ? ICON_SLOT + labelWidths[index] + 16 : ICON_SLOT,
  );

  const offsets: number[] = [];
  widths.forEach((_, index) => {
    offsets.push(index === 0 ? 1 : offsets[index - 1] + widths[index - 1] + GAP);
  });

  const trackWidth = offsets[offsets.length - 1] + widths[widths.length - 1] + 1;
  const activeIndex = MODES.findIndex((mode) => mode.id === active);

  return (
    <div className="nq-mode-switcher-wrap">
      <div
        className="nq-mode-switcher"
        role="group"
        aria-label="Mode switcher"
        style={{ inlineSize: trackWidth }}
      >
        <span
          className="nq-mode-indicator"
          aria-hidden="true"
          style={{
            transform: `translate3d(${offsets[activeIndex]}px,0,0)`,
            inlineSize: widths[activeIndex],
          }}
        />
        {MODES.map((mode, index) => (
          <button
            key={mode.id}
            type="button"
            title={mode.label}
            aria-pressed={mode.id === active}
            className={`nq-mode-option${mode.id === active ? " is-active" : ""}`}
            onClick={() => setActive(mode.id)}
            style={{
              insetInlineStart: offsets[index],
              inlineSize: widths[index],
            }}
          >
            <span className="nq-mode-icon" aria-hidden="true">
              <mode.Icon size={15} />
            </span>
            <span
              className="nq-mode-label"
              aria-hidden="true"
              style={{
                inlineSize: mode.id === active ? labelWidths[index] : 0,
              }}
            >
              {mode.label}
            </span>
          </button>
        ))}
        <span className="nq-mode-measure" aria-hidden="true" ref={measureRef}>
          {MODES.map((mode) => (
            <span key={mode.id}>{mode.label}</span>
          ))}
        </span>
      </div>
    </div>
  );
}

function ActivityBars() {
  return (
    <i className="nq-activity-bars" aria-hidden="true">
      {Array.from({ length: 9 }, (_, index) => (
        <b key={index} style={{ animationDelay: `${index * 90}ms` }} />
      ))}
    </i>
  );
}

export function Sidebar({ running }: { running: boolean }) {
  return (
    <aside className="nq-sidebar">
      <div className="nq-window-bar">
        <div className="nq-traffic-lights" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <button type="button" aria-label="Toggle sidebar">
          <PanelLeftIcon size={15} />
        </button>
        <button type="button" aria-label="Back">
          <ArrowLeftIcon size={13} />
        </button>
        <button type="button" aria-label="Forward" className="is-muted">
          <ArrowRightIcon size={13} />
        </button>
      </div>

      <ModeSwitcher />

      <nav className="nq-primary-nav" aria-label="Qoder">
        <button type="button">
          <NewTaskIcon size={14} />
          <span>New Task</span>
        </button>
        <button type="button">
          <SearchIcon size={14} />
          <span>Search</span>
        </button>
      </nav>

      <div className="nq-sidebar-section">
        <div className="nq-sidebar-heading">
          <span>Folders</span>
          <button type="button" aria-label="Add folder">
            <PlusIcon size={13} />
          </button>
        </div>

        <div className="nq-active-workspace">
          <div className="nq-workspace-name">
            <RocketIcon size={13} />
            <span>{WORKSPACE}</span>
          </div>
          <button
            type="button"
            aria-current="page"
            className="nq-active-session"
            data-running={running || undefined}
          >
            <span>{SESSION_TITLE}</span>
            <ActivityBars />
          </button>
        </div>

        <h3>Recent conversations</h3>
        {RECENT_CONVERSATIONS.map((item) => (
          <button type="button" key={item} className="nq-history-item">
            {item}
          </button>
        ))}
      </div>

      <div className="nq-sidebar-footer">
        <div className="nq-footer-links">
          <button type="button">
            <BookIcon size={14} />
            <span>Knowledge Center</span>
          </button>
          <button type="button">
            <AutomationIcon size={14} />
            <span>Automations</span>
          </button>
          <button type="button">
            <ExtensionIcon size={14} />
            <span>Extensions</span>
          </button>
        </div>
        <div className="nq-account-row">
          <span className="nq-account-logo" aria-label="Qoder">
            <RocketIcon size={14} />
            <b>Qoder</b>
          </span>
          <span className="nq-account-spacer" />
          <button type="button" aria-label="Usage">
            <GaugeIcon size={15} />
          </button>
          <button type="button" aria-label="Settings">
            <SettingsIcon size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
