import { useState } from "react";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  CopyIcon,
  DiffIcon,
  DotsIcon,
  MarkdownIcon,
  ShareIcon,
  ThumbDownIcon,
  ThumbUpIcon,
} from "./icons";
import type { Beat, ChangedFile } from "./mock";
import { useTypewriter } from "./hooks";

function Disclosure({ open }: { open?: boolean }) {
  return (
    <span className={`nq-disclosure${open ? " is-open" : ""}`} aria-hidden="true">
      <ArrowRightIcon size={12} />
    </span>
  );
}

function AssistantMessage({ text, fresh }: { text: string; fresh: boolean }) {
  const ref = useTypewriter(text, true, 120);
  return (
    <p className="nq-assistant-message">
      {fresh ? <span ref={ref} /> : text}
    </p>
  );
}

function FileRow({ file }: { file: ChangedFile }) {
  return (
    <button type="button" title={file.path}>
      <span>{file.path}</span>
      <i>
        <b>+{file.added}</b>
        <em>−{file.removed}</em>
      </i>
    </button>
  );
}

function FileChangesCard({
  files,
  added,
  removed,
}: {
  files: ChangedFile[];
  added: number;
  removed: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? files : files.slice(0, 3);
  const hidden = files.length - visible.length;

  return (
    <section className="nq-file-changes-card" aria-label="Files changed">
      <header>
        <span className="nq-file-changes-icon">
          <DiffIcon size={18} />
        </span>
        <span className="nq-file-changes-title">
          <strong>Edited {files.length} files</strong>
          <small>
            <b>+{added}</b>
            <i>−{removed}</i>
          </small>
        </span>
        <span className="nq-file-changes-actions">
          <button type="button">Undo</button>
          <button type="button" className="is-outline">
            Review
          </button>
        </span>
      </header>
      <div className="nq-file-list">
        {visible.map((file) => (
          <FileRow key={file.path} file={file} />
        ))}
        {hidden > 0 && (
          <button
            type="button"
            className="nq-show-more-files"
            aria-expanded={expanded}
            onClick={() => setExpanded(true)}
          >
            <span>Show {hidden} more files</span>
            <ChevronDownIcon size={15} />
          </button>
        )}
      </div>
    </section>
  );
}

function ResponseActions() {
  return (
    <div className="nq-response-actions" aria-label="Response actions">
      <button type="button" aria-label="Copy response">
        <CopyIcon size={15} />
      </button>
      <button type="button" aria-label="Helpful">
        <ThumbUpIcon size={15} />
      </button>
      <button type="button" aria-label="Not helpful">
        <ThumbDownIcon size={15} />
      </button>
      <button type="button" aria-label="Share response">
        <ShareIcon size={15} />
      </button>
      <button type="button" aria-label="More actions">
        <DotsIcon size={15} />
      </button>
    </div>
  );
}

function BeatNode({ beat, fresh }: { beat: Beat; fresh: boolean }) {
  switch (beat.kind) {
    case "user":
      return (
        <div className="nq-user-message">
          <p>{beat.text}</p>
        </div>
      );

    case "processed":
      return (
        <button type="button" className="nq-activity-group-summary">
          <Disclosure />
          <span>{beat.label}</span>
        </button>
      );

    case "assistant":
      return <AssistantMessage text={beat.text} fresh={fresh} />;

    case "activity":
      return (
        <div className="nq-timeline-activity">
          <Disclosure />
          <span>{beat.label}</span>
          <i>·</i>
          <span>{beat.duration}</span>
          {beat.failed ? (
            <>
              <i>·</i>
              <span className="is-failed">{beat.failed} failed</span>
            </>
          ) : null}
        </div>
      );

    case "note":
      return (
        <p
          className="nq-timeline-message"
          dangerouslySetInnerHTML={{ __html: beat.html }}
        />
      );

    case "group":
      return (
        <div className="nq-timeline-group">
          <div className="nq-timeline-activity">
            <Disclosure open />
            <span>{beat.label}</span>
          </div>
          <div className="nq-timeline-group-items">
            {beat.items.map((item) => (
              <div key={item}>
                <CheckCircleIcon size={12} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "thinking":
      return (
        <div className="nq-timeline-status">
          <i aria-hidden="true" />
          <span>{beat.label}</span>
          <em className="nq-ellipsis" aria-hidden="true">
            <b />
            <b />
            <b />
          </em>
        </div>
      );

    case "result":
      return (
        <section className="nq-completed-result" aria-label="Task result">
          <p>
            {beat.summary} <code>{beat.branch}</code>, commit{" "}
            <code>{beat.commit}</code> ({beat.files.length} files,{" "}
            <span className="is-addition">+{beat.added}</span>{" "}
            <span className="is-deletion">−{beat.removed}</span>, branched from
            main).
          </p>

          <h2>Deliverables</h2>
          <ul>
            {beat.deliverables.map((item) => (
              <li key={item} dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </ul>

          <h2>Verification evidence</h2>
          <ul>
            {beat.evidence.map((item) => (
              <li key={item} dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </ul>

          <p
            className="nq-result-next"
            dangerouslySetInnerHTML={{ __html: beat.next }}
          />

          <div className="nq-output-file-wrap">
            <button
              type="button"
              className="nq-output-file-card"
              aria-label={`Open ${beat.artifact}`}
            >
              <span className="nq-output-file-cover" aria-hidden="true">
                <MarkdownIcon size={22} />
              </span>
              <span className="nq-output-file-copy">
                <strong>{beat.artifact}</strong>
                <small>MD</small>
              </span>
            </button>
            <button type="button" aria-label="Artifact actions" className="nq-output-more">
              <DotsIcon size={15} />
            </button>
          </div>

          <FileChangesCard
            files={beat.files}
            added={beat.added}
            removed={beat.removed}
          />

          <ResponseActions />
        </section>
      );
  }
}

/**
 * Beats are rendered in timeline order. Only the newest one gets the enter
 * animation and the typewriter, so replaying the script never re-animates the
 * whole history.
 */
export function Conversation({
  beats,
  step,
  scrollRef,
}: {
  beats: Beat[];
  step: number;
  scrollRef: React.Ref<HTMLElement>;
}) {
  const visible = beats.slice(0, step);

  return (
    <section
      className="nq-conversation"
      aria-label="Current task conversation"
      ref={scrollRef as React.Ref<HTMLElement>}
    >
      <div className="nq-conversation-inner">
        {visible.map((beat, index) => (
          <div
            key={beat.id}
            className="nq-beat"
            data-fresh={index === visible.length - 1 || undefined}
          >
            <BeatNode beat={beat} fresh={index === visible.length - 1} />
          </div>
        ))}
      </div>
    </section>
  );
}
