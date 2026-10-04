import { categoryLabel, getFinding, listFindings, requestFix } from "../store";
import { useStore } from "../useStore";

export function FindingsPage() {
  useStore();
  const selectedId = new URLSearchParams(window.location.search).get("selected");
  const findings = listFindings();
  const selected = selectedId ? getFinding(selectedId) : null;

  return (
    <div className="vs-wrap">
      <h1 className="vs-title">Findings</h1>
      <p className="vs-lede">Vulnerabilities discovered across your scans</p>

      {selected && (
        <div className="vs-card vs-card-pad" style={{ marginBottom: 20 }}>
          <div className="vs-header-row">
            <h2 className="vs-title" style={{ fontSize: 20, margin: 0 }}>
              Finding Details
            </h2>
            <a className="vs-btn vs-btn-ghost" href="/findings">
              Close
            </a>
          </div>
          <h3>{selected.title}</h3>
          <p>
            <span className={`vs-badge vs-badge-${selected.severity}`}>{selected.severity}</span>{" "}
            <span className="vs-badge">{categoryLabel(selected.category)}</span>
          </p>
          <p className="vs-muted">{selected.description}</p>
          {selected.file_path && (
            <p className="vs-muted">
              {selected.file_path}
              {selected.line_start ? `:${selected.line_start}` : ""}
            </p>
          )}
          {selected.code_snippet && <pre className="vs-pre">{selected.code_snippet}</pre>}
          {selected.remediation && (
            <p className="vs-muted">
              <span className="vs-success">Solution:</span> {selected.remediation}
            </p>
          )}
          <div style={{ marginTop: 16 }}>
            {selected.pr_status === "created" && selected.pr_number ? (
              <a href={selected.pr_url} target="_blank" rel="noreferrer">
                PR #{selected.pr_number}
              </a>
            ) : selected.fix_available ? (
              <button type="button" className="vs-btn vs-btn-primary" onClick={() => requestFix(selected.id)}>
                Create Fix PR
              </button>
            ) : (
              <span className="vs-muted">No fix available</span>
            )}
          </div>
        </div>
      )}

      <div className="vs-card">
        <table className="vs-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Title</th>
              <th>Agent</th>
              <th>Category</th>
              <th>Status</th>
              <th>Fix</th>
            </tr>
          </thead>
          <tbody>
            {findings.map((finding) => (
              <tr key={finding.id}>
                <td>
                  <span className={`vs-badge vs-badge-${finding.severity}`}>{finding.severity}</span>
                </td>
                <td>
                  <a href={`/findings?selected=${finding.id}`}>{finding.title}</a>
                </td>
                <td>{finding.agent}</td>
                <td>{finding.category}</td>
                <td>{finding.status}</td>
                <td>{finding.fix_available ? "Available" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
