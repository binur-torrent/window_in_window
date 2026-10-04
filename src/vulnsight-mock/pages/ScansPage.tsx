import { listScans, scanTarget, scanTypeLabel, timeAgo } from "../store";
import { useStore } from "../useStore";

export function ScansPage() {
  useStore();
  const scans = listScans();

  return (
    <div className="vs-wrap">
      <div className="vs-header-row">
        <div>
          <h1 className="vs-title">Scans</h1>
          <p className="vs-lede">Manage active, queued, and historical security scans.</p>
        </div>
        <a className="vs-btn vs-btn-primary" href="/scans/new">
          New Scan
        </a>
      </div>

      {scans.length === 0 ? (
        <p className="vs-muted">
          No scans yet. Start your first scan to see live terminal logs and findings.
        </p>
      ) : (
        <div className="vs-grid">
          {scans.map((scan) => (
            <a key={scan.id} className="vs-scan-card" href={`/scans/${scan.id}`}>
              <div className="vs-scan-card-head">
                <div>
                  <h3>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3 4 7v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-4Z" />
                    </svg>
                    {scanTypeLabel(scan.scan_type)}
                  </h3>
                  <p className="vs-muted">{scanTarget(scan)}</p>
                </div>
                <span className="vs-badge">{scan.findings_count} findings</span>
              </div>

              {scan.status === "running" && (
                <div className="vs-progress">
                  <div className="vs-progress-meta">
                    <span>{scan.status}</span>
                    <span>{scan.progress}%</span>
                  </div>
                  <div className="vs-progress-track">
                    <i style={{ width: `${scan.progress}%` }} />
                  </div>
                </div>
              )}

              <div className="vs-scan-severities">
                <div>
                  <p className="vs-danger">{scan.critical_count}</p>
                  <p>Critical</p>
                </div>
                <div>
                  <p style={{ color: "var(--finding-high)" }}>{scan.high_count}</p>
                  <p>High</p>
                </div>
                <div>
                  <p style={{ color: "var(--finding-medium)" }}>{scan.medium_count}</p>
                  <p>Medium</p>
                </div>
                <div>
                  <p style={{ color: "var(--finding-low)" }}>{scan.low_count}</p>
                  <p>Low</p>
                </div>
              </div>

              <div className="vs-scan-card-foot">
                <span>{timeAgo(scan.created_at)}</span>
                <span className={`vs-status-label vs-status-${scan.status}`}>{scan.status}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
