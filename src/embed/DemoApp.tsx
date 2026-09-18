import {
  AttachIcon,
  ChevronDownIcon,
  CodeModeIcon,
  DotsIcon,
  FolderIcon,
  MicIcon,
  PanelBottomIcon,
  PanelRightIcon,
  PlusIcon,
  RocketIcon,
  SendIcon,
  ShieldCheckIcon,
  TaskMonitorIcon,
  BranchIcon,
  PanelLeftIcon,
} from "./icons";
import { Sidebar } from "./Sidebar";
import { Conversation } from "./Conversation";
import { BEATS, BRANCH, SESSION_TITLE, WORKSPACE } from "./mock";
import { useAutoScroll } from "./hooks";

function SessionHeader() {
  return (
    <header className="nq-session-header">
      <div className="nq-session-title">
        <RocketIcon size={14} />
        <h1>{SESSION_TITLE}</h1>
        <button type="button" aria-label="Session actions">
          <DotsIcon size={15} />
        </button>
      </div>
      <div className="nq-session-header-actions">
        <button type="button" aria-label="Task monitor">
          <TaskMonitorIcon size={15} />
        </button>
        <button type="button" aria-label="Toggle bottom panel">
          <PanelBottomIcon size={15} />
        </button>
        <button type="button" aria-label="Toggle right panel">
          <PanelRightIcon size={15} />
        </button>
      </div>
    </header>
  );
}

function Composer() {
  return (
    <div className="nq-composer-wrap">
      <div className="nq-composer">
        <div className="nq-composer-handle" />
        <textarea
          aria-label="Continue this session"
          placeholder="Continue this session…"
          rows={2}
        />
        <div className="nq-composer-toolbar">
          <button type="button" className="nq-tool-button is-outlined" aria-label="Add">
            <PlusIcon size={15} />
          </button>
          <button type="button" className="nq-tool-button" aria-label="Attach">
            <AttachIcon size={15} />
          </button>
          <button type="button" className="nq-composer-select">
            <ShieldCheckIcon size={14} />
            <span>Ask for approval</span>
            <ChevronDownIcon size={12} />
          </button>
          <span className="nq-toolbar-spacer" />
          <button type="button" className="nq-composer-select">
            <CodeModeIcon size={14} />
            <span>Auto</span>
            <ChevronDownIcon size={12} />
          </button>
          <button type="button" className="nq-tool-button" aria-label="Voice input">
            <MicIcon size={15} />
          </button>
          <button type="button" className="nq-send-button" aria-label="Send">
            <SendIcon size={14} />
          </button>
        </div>
      </div>

      <div className="nq-context-strip">
        <span>
          <FolderIcon size={13} />
          {WORKSPACE}
        </span>
        <span>
          <PanelLeftIcon size={13} />
          Local
        </span>
        <span>
          <BranchIcon size={13} />
          {BRANCH}
        </span>
        <div className="nq-credit-usage" aria-label="28% credits used">
          <span className="nq-credit-meter" aria-hidden="true">
            <i style={{ width: "28%" }} />
          </span>
          <span>28%</span>
        </div>
      </div>
    </div>
  );
}

/**
 * The whole fake product, laid out at the fixed design size. It knows nothing
 * about the page around it — the parent scales it.
 */
export function DemoApp({ step }: { step: number }) {
  const scrollRef = useAutoScroll(step);
  const running = step < BEATS.length;

  return (
    <div className="nq-app">
      <Sidebar running={running} />
      <main className="nq-main">
        <SessionHeader />
        <Conversation beats={BEATS} step={step} scrollRef={scrollRef} />
        <Composer />
      </main>
    </div>
  );
}
