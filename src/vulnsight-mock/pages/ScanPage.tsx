import { useState } from "react";
import {
  getScan,
  getScanFindings,
  getScanLogs,
} from "../store";
import { useStore } from "../useStore";

const FILTERS = ["all", "orchestrator", "alpha", "beta", "gamma", "strix"] as const;

export function ScanPage({ scanId }: { scanId: string }) {
  useStore();
  const [agent, setAgent] = useState<string>("all");
  const scan = getScan(scanId);
  const logs = getScanLogs(scanId);
  const findings = getScanFindings(scanId);
  const visible = logs.filter((entry) => agent === "all" || entry.agent === agent);

  if (!scan) {
    return (
      <div className="vs-wrap">
        <p className="vs-danger">Scan not found</p>
      </div>
    );
  }

  return (
    <div className="vs-wrap">
      <a className="vs-link" href="/scans">
        ← Back to scans
      </a>
      <div className="vs-header-row" style={{ marginTop: 12 }}>
        <div>
          <h2 className="vs-title">Scan {scan.id.slice(0, 8)}</h2>
          <p className="vs-lede" style={{ marginBottom: 0 }}>
            {scan.scan_type.replace(/_/g, " ")} · {scan.status}
          </p>
        </div>
      </div>

      <div className="vs-split" style={{ marginTop: 20 }}>
        <div className="vs-stack">
          <div className="vs-card vs-card-pad">
            <h3 style={{ marginTop: 0 }}>Scan Details</h3>
            <p className="vs-muted">
              Status <strong style={{ color: "var(--ink)" }}>{scan.status}</strong>
            </p>
            <p className="vs-muted">
              Progress <span>{scan.progress}%</span>
            </p>
            <p className="vs-muted">Findings {scan.findings_count}</p>
          </div>
          <div className="vs-card vs-card-pad">
            <h3 style={{ marginTop: 0 }}>Findings ({findings.length})</h3>
            {findings.length === 0 ? (
              <p className="vs-muted">No findings yet.</p>
            ) : (
              findings.map((finding) => (
                <a
                  key={finding.id}
                  href={`/findings?selected=${finding.id}`}
                  className="vs-finding-row"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <span>{finding.title}</span>
                  <span className={`vs-badge vs-badge-${finding.severity}`}>{finding.severity}</span>
                </a>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="vs-filters">
            {FILTERS.map((name) => (
              <button
                key={name}
                type="button"
                className="vs-chip"
                data-active={agent === name}
                onClick={() => setAgent(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="vs-terminal">
            <div className="vs-terminal-bar">
              <span>Live Terminal</span>
              <span className="vs-dot" data-off={scan.status !== "running"} />
            </div>
            <div className="vs-terminal-body">
              {visible.length === 0 && <p className="vs-muted">Waiting for scan logs...</p>}
              {visible.map((entry) => (
                <div key={entry.id}>
                  <span className="vs-log-time">
                    [{new Date(entry.created_at).toLocaleTimeString()}]
                  </span>{" "}
                  <span className={entry.agent === "beta" ? "vs-log-beta" : "vs-log-alpha"}>
                    [{entry.agent.toUpperCase()}]
                  </span>{" "}
                  <span
                    className={
                      entry.level === "error"
                        ? "vs-log-error"
                        : entry.level === "warning"
                          ? "vs-log-warning"
                          : entry.level === "success"
                            ? "vs-log-success"
                            : "vs-muted"
                    }
                  >
                    [{entry.level.toUpperCase()}]
                  </span>{" "}
                  <span>{entry.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
