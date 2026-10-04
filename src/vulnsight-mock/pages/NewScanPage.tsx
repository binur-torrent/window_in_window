import { useMemo, useState, type FormEvent } from "react";
import { navigate } from "../nav";
import { createScan, listDomains, listRepos, type ScanType } from "../store";
import { useStore } from "../useStore";

const TYPES: { id: ScanType; label: string; note: string }[] = [
  { id: "full_assessment", label: "Full Assessment", note: "SAST + DAST" },
  { id: "code_scan", label: "Code Scan", note: "SAST only" },
  { id: "web_pentest", label: "Web Pentest", note: "DAST only" },
];

export function NewScanPage() {
  useStore();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [scanType, setScanType] = useState<ScanType>("full_assessment");
  const [domainId, setDomainId] = useState(params.get("domain_id") ?? "");
  const [repoId, setRepoId] = useState(params.get("repo_id") ?? "");
  const [error, setError] = useState<string | null>(null);

  const domains = listDomains();
  const repos = listRepos();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!domainId && !repoId) {
      setError("Choose a domain or repository.");
      return;
    }
    const scan = createScan({
      scan_type: scanType,
      domain_id: domainId || undefined,
      repo_id: repoId || undefined,
    });
    navigate(`/scans/${scan.id}`);
  }

  return (
    <div className="vs-wrap-narrow">
      <a className="vs-link" href="/pentester-live/">
        ← Back to projects
      </a>
      <h1 className="vs-title" style={{ marginTop: 16 }}>
        Start New Scan
      </h1>
      <p className="vs-lede">Launch Agent Alpha, Beta, and Gamma against your targets.</p>

      <div className="vs-card vs-card-pad">
        <div>Scan Configuration</div>
        <form onSubmit={handleSubmit}>
          <span className="vs-label">Scan Type</span>
          <div className="vs-choices">
            {TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                className="vs-choice"
                data-active={scanType === type.id}
                onClick={() => setScanType(type.id)}
              >
                <strong>{type.label}</strong>
                <div className="vs-muted">{type.note}</div>
              </button>
            ))}
          </div>

          <span className="vs-label">Target Domain</span>
          <div className="vs-choices">
            {domains.map((domain) => (
              <button
                key={domain.id}
                type="button"
                className="vs-choice"
                data-active={domainId === domain.id}
                onClick={() => setDomainId(domain.id)}
              >
                {domain.domain} ({domain.verification_status})
              </button>
            ))}
          </div>

          <span className="vs-label">Repository</span>
          <div className="vs-choices">
            {repos.map((repo) => (
              <button
                key={repo.id}
                type="button"
                className="vs-choice"
                data-active={repoId === repo.id}
                onClick={() => setRepoId(repo.id)}
              >
                {repo.full_name}
              </button>
            ))}
          </div>

          {error && <p className="vs-msg vs-msg-error">{error}</p>}

          <button
            className="vs-btn vs-btn-primary"
            type="submit"
            disabled={!domainId && !repoId}
            style={{ width: "100%", marginTop: 18 }}
          >
            Launch Scan
          </button>
        </form>
      </div>
    </div>
  );
}
