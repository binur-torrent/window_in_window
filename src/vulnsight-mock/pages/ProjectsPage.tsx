import { useMemo, useState, type FormEvent, type MouseEvent } from "react";
import {
  categoryLabel,
  createProject,
  deleteProject,
  getProjectDetail,
  listProjects,
  timeAgo,
  verifyProject,
  type Finding,
  type Project,
} from "../store";
import { useStore } from "../useStore";

type FilterTab = "all" | "verified" | "connected" | "scanned" | "pending";
type View = "list" | "detail" | "finding";

export function ProjectsPage({ openId }: { openId?: string }) {
  useStore();
  const [view, setView] = useState<View>(openId ? "detail" : "list");
  const [target, setTarget] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(openId ?? null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  const projects = listProjects();
  const selected = selectedId ? getProjectDetail(selectedId) : null;

  const visible = useMemo(
    () =>
      projects.filter((project) => {
        if (filter === "verified") return project.status === "verified";
        if (filter === "connected") return project.status === "connected";
        if (filter === "scanned") return project.lastScannedAt != null;
        if (filter === "pending") return project.status === "pending";
        return true;
      }),
    [projects, filter],
  );

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!target.trim()) return;
    const project = createProject(target.trim());
    setTarget("");
    setSelectedId(project.id);
    setView("detail");
  }

  function handleVerify(project: Project, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    verifyProject(project.id);
  }

  function handleDelete(project: Project, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    deleteProject(project.id);
    if (selectedId === project.id) {
      setSelectedId(null);
      setView("list");
    }
  }

  if (view === "finding" && selectedFinding && selected) {
    return (
      <FindingView
        finding={selectedFinding}
        projectName={selected.name}
        onBack={() => {
          setSelectedFinding(null);
          setView("detail");
        }}
        onHome={() => {
          setSelectedFinding(null);
          setSelectedId(null);
          setView("list");
        }}
      />
    );
  }

  if (view === "detail" && selected) {
    return (
      <DetailView
        project={selected}
        onBack={() => {
          setSelectedId(null);
          setView("list");
        }}
        onOpenFinding={(finding) => {
          setSelectedFinding(finding);
          setView("finding");
        }}
      />
    );
  }

  return (
    <div className="vs-wrap">
      <h1 className="vs-title">Projects</h1>
      <p className="vs-lede">
        Add a website or repository, then click any project to see its scans and vulnerabilities.
      </p>

      <form className="vs-card vs-card-pad vs-row" onSubmit={handleAdd}>
        <input
          className="vs-input"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          placeholder="example.com or owner/repo"
        />
        <button className="vs-btn vs-btn-primary" type="submit" disabled={!target.trim()}>
          Add target
        </button>
      </form>

      <div className="vs-filters">
        {(
          [
            ["all", "All"],
            ["verified", "Verified"],
            ["connected", "Connected"],
            ["scanned", "Scanned"],
            ["pending", "Pending"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className="vs-chip"
            data-active={filter === key}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="vs-grid">
        {visible.map((project) => (
          <button
            key={project.id}
            type="button"
            className="vs-project"
            onClick={() => {
              setSelectedId(project.id);
              setView("detail");
            }}
          >
            <div className="vs-project-top">
              <div className="vs-project-id">
                <span className="vs-project-kind" aria-hidden="true">
                  {project.type === "domain" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77 5.44 5.44 0 0 0 3.5 8.55c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                    </svg>
                  )}
                </span>
                <div>
                  <h3 className="vs-project-name">{project.name}</h3>
                  <p className="vs-project-type">{project.type}</p>
                </div>
              </div>
              <StatusBadge status={project.status} />
            </div>
            <div className="vs-stats">
              <div>
                <p className="vs-stat-value">{project.findingsCount}</p>
                <p className="vs-stat-label">Findings</p>
              </div>
              <div>
                <p className="vs-stat-value vs-danger">{project.criticalCount}</p>
                <p className="vs-stat-label">Critical</p>
              </div>
              <div>
                <p className="vs-stat-value" style={{ color: "var(--finding-high)" }}>
                  {project.highCount}
                </p>
                <p className="vs-stat-label">High</p>
              </div>
              <div>
                <p className="vs-stat-value">{project.mediumCount + project.lowCount}</p>
                <p className="vs-stat-label">Other</p>
              </div>
            </div>
            <div className="vs-project-foot">
              <span>
                {project.lastScannedAt
                  ? `Scanned ${timeAgo(project.lastScannedAt)}`
                  : "Not scanned yet"}
              </span>
              <span
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                {project.status === "pending" && project.type === "domain" && (
                  <button
                    type="button"
                    className="vs-btn vs-btn-ghost"
                    onClick={(event) => handleVerify(project, event)}
                  >
                    Verify
                  </button>
                )}
              </span>
            </div>
            <button
              type="button"
              className="vs-icon-btn"
              style={{ position: "absolute", top: 8, right: 8, opacity: 0.35 }}
              onClick={(event) => handleDelete(project, event)}
            >
              ×
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}

function DetailView({
  project,
  onBack,
  onOpenFinding,
}: {
  project: NonNullable<ReturnType<typeof getProjectDetail>>;
  onBack: () => void;
  onOpenFinding: (finding: Finding) => void;
}) {
  return (
    <div className="vs-wrap">
      <button type="button" className="vs-link" onClick={onBack}>
        ← Back to projects
      </button>

      <div className="vs-header-row" style={{ marginTop: 16 }}>
        <div>
          <h1 className="vs-title">{project.name}</h1>
          <p className="vs-lede" style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ textTransform: "capitalize" }}>{project.type}</span>
            <StatusBadge status={project.status} />
            <span>Open target</span>
          </p>
        </div>
        <a
          className="vs-btn vs-btn-primary"
          href={`/scans/new?${project.type === "domain" ? "domain_id" : "repo_id"}=${project.id}`}
        >
          New scan
        </a>
      </div>

      <div className="vs-summary" style={{ marginTop: 24 }}>
        <div className="vs-summary-card">
          <p>{project.findingsCount}</p>
          <p>Total</p>
        </div>
        <div className="vs-summary-card">
          <p className="vs-danger">{project.criticalCount}</p>
          <p>Critical</p>
        </div>
        <div className="vs-summary-card">
          <p style={{ color: "var(--finding-high)" }}>{project.highCount}</p>
          <p>High</p>
        </div>
        <div className="vs-summary-card">
          <p style={{ color: "var(--finding-medium)" }}>{project.mediumCount}</p>
          <p>Medium</p>
        </div>
        <div className="vs-summary-card">
          <p style={{ color: "var(--finding-low)" }}>{project.lowCount}</p>
          <p>Low</p>
        </div>
      </div>

      <section className="vs-section">
        <h3>Scan history</h3>
        {project.scans.length === 0 ? (
          <p className="vs-muted">No scans yet for this project.</p>
        ) : (
          project.scans.map((scan) => (
            <a key={scan.id} className="vs-scan-row" href={`/scans/${scan.id}`} style={{ textDecoration: "none" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 500 }}>{scan.scan_type.replace(/_/g, " ")}</p>
                <p className="vs-muted" style={{ margin: "4px 0 0" }}>
                  {scan.status} • {scan.findings_count} findings
                </p>
              </div>
              <span className={scan.status === "completed" ? "vs-success" : "vs-primary"}>
                {scan.status}
              </span>
            </a>
          ))
        )}
      </section>

      <section className="vs-section">
        <h3>Vulnerability categories</h3>
        {project.findings.length === 0 ? (
          <p className="vs-muted">No findings yet.</p>
        ) : (
          <p className="vs-muted">All findings</p>
        )}
      </section>

      <section className="vs-section">
        <h3>All findings</h3>
        {project.findings.length === 0 ? (
          <p className="vs-muted">No findings in this category.</p>
        ) : (
          project.findings.map((finding) => (
            <button
              key={finding.id}
              type="button"
              className="vs-finding-row"
              onClick={() => onOpenFinding(finding)}
            >
              <div>
                <strong>{finding.title}</strong>
                <span className={`vs-badge vs-badge-${finding.severity}`} style={{ marginLeft: 8 }}>
                  {finding.severity}
                </span>
                <p className="vs-muted">{finding.description}</p>
              </div>
            </button>
          ))
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: Project["status"] }) {
  const verified = status === "verified" || status === "connected";
  return (
    <span className={`vs-status-pill ${verified ? "is-verified" : "is-pending"}`}>
      {verified ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3 4 7v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-4Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m12 3 9 16H3L12 3Z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      )}
      {status}
    </span>
  );
}

function FindingView({
  finding,
  projectName,
  onBack,
  onHome,
}: {
  finding: Finding;
  projectName: string;
  onBack: () => void;
  onHome: () => void;
}) {
  return (
    <div className="vs-wrap-narrow">
      <div className="vs-header-row">
        <button type="button" className="vs-link" onClick={onBack}>
          ← Back to findings
        </button>
        <button type="button" className="vs-link" onClick={onHome}>
          Projects
        </button>
      </div>
      <h2 className="vs-title">{finding.title}</h2>
      <p className="vs-lede">
        Found in {projectName} via {finding.source.replace(/_/g, " ")} · {categoryLabel(finding.category)}
      </p>
      <div className="vs-card vs-card-pad">
        <h3 style={{ marginTop: 0 }}>Description</h3>
        <p className="vs-muted">{finding.description}</p>
      </div>
      {finding.remediation && (
        <div className="vs-card vs-card-pad" style={{ marginTop: 12 }}>
          <h3 className="vs-success" style={{ marginTop: 0 }}>
            Solution / Remediation
          </h3>
          <p className="vs-muted">{finding.remediation}</p>
        </div>
      )}
    </div>
  );
}
