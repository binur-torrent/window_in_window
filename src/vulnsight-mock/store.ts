/**
 * In-browser VulnSight data. The pentest stage never talks to the real
 * product or its API — every project, scan, finding, and setting lives here.
 */

const STORE_KEY = "vulnsight.frontend-mock.v1";
export const SCAN_DURATION_MS = 26000;

export type ScanType = "full_assessment" | "code_scan" | "web_pentest";
export type ScanStatus =
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "stopped";

export type Domain = {
  id: string;
  domain: string;
  verification_status: "pending" | "verified";
  last_scanned_at: string | null;
  created_at: string;
};

export type Repo = {
  id: string;
  full_name: string;
  is_connected: boolean;
  last_scanned_at: string | null;
  created_at: string;
};

export type Scan = {
  id: string;
  domain_id: string | null;
  repo_id: string | null;
  scan_type: ScanType;
  status: ScanStatus;
  progress: number;
  launched_at?: number;
  started_at: string;
  completed_at: string | null;
  findings_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  created_at: string;
};

export type Finding = {
  id: string;
  scan_id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: string;
  source: string;
  agent: string;
  tool: string;
  url?: string;
  file_path?: string;
  line_start?: number;
  line_end?: number;
  parameter?: string;
  cwe_id?: string;
  cvss_score?: number;
  code_snippet?: string;
  remediation?: string;
  fix_available: boolean;
  fix_diff?: string;
  pr_status: "none" | "created" | "merged";
  pr_url?: string;
  pr_number?: number;
  status: "open" | "confirmed" | "resolved";
  verified: boolean;
  created_at: string;
};

export type Provider = {
  id: string;
  provider: "litellm";
  name: string;
  api_key_mask: string;
  base_url: string;
  model: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
};

export type Project = {
  id: string;
  type: "domain" | "repository";
  name: string;
  status: "pending" | "verified" | "connected";
  lastScannedAt: string | null;
  findingsCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
};

type Database = {
  domains: Domain[];
  repos: Repo[];
  scans: Scan[];
  findings: Finding[];
  providers: Provider[];
};

type LogEntry = {
  at: number;
  agent: string;
  level: string;
  phase?: "sast" | "dast";
  message: string;
};

type FindingBeat = Omit<Finding, "id" | "scan_id" | "status" | "pr_status" | "created_at"> & {
  at: number;
  phase?: "sast" | "dast";
};

const nowISO = () => new Date().toISOString();
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version += 1;
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getStoreVersion() {
  return version;
}

const LOG_TIMELINE: LogEntry[] = [
  { at: 300, agent: "orchestrator", level: "info", message: "Orchestrator starting scan" },
  { at: 900, agent: "orchestrator", level: "info", message: "Resolving target and building agent plan" },
  { at: 1800, agent: "alpha", level: "info", phase: "sast", message: "Agent Alpha (Code Hunter) initialized" },
  { at: 2600, agent: "alpha", level: "info", phase: "sast", message: "Cloning acme/checkout-api at main" },
  { at: 4200, agent: "alpha", level: "info", phase: "sast", message: "Indexed 412 source files across 37 packages" },
  { at: 6000, agent: "alpha", level: "warning", phase: "sast", message: "Tainted parameter reaches SQL builder in orders/repository.go:142" },
  { at: 7400, agent: "alpha", level: "error", phase: "sast", message: "Hardcoded credential detected in config/settings.py:18" },
  { at: 9000, agent: "alpha", level: "success", phase: "sast", message: "Agent Alpha completed. Findings: 2" },
  { at: 9800, agent: "beta", level: "info", phase: "dast", message: "Agent Beta (Web Attacker) initialized" },
  { at: 10600, agent: "beta", level: "info", phase: "dast", message: "Crawled 68 routes, 14 authenticated" },
  { at: 12200, agent: "beta", level: "info", phase: "dast", message: "Running nuclei stage..." },
  { at: 14000, agent: "beta", level: "warning", phase: "dast", message: "Reflected payload survived encoding on /search?q=" },
  { at: 15600, agent: "beta", level: "info", phase: "dast", message: "Running sqlmap stage..." },
  { at: 17200, agent: "beta", level: "error", phase: "dast", message: "Boolean-based blind injection confirmed on /api/orders?id=" },
  { at: 18600, agent: "beta", level: "info", phase: "dast", message: "Running business-logic stage..." },
  { at: 19800, agent: "beta", level: "warning", phase: "dast", message: "Order #4182 readable across tenant boundary" },
  { at: 21000, agent: "beta", level: "success", phase: "dast", message: "Agent Beta completed. Findings: 3" },
  { at: 22000, agent: "strix", level: "info", message: "Strix validating exploitability with live proof-of-concept" },
  { at: 23600, agent: "strix", level: "success", message: "2 findings reproduced with a working PoC" },
  { at: 24600, agent: "orchestrator", level: "info", message: "Deduplicating overlapping SAST and DAST results" },
  { at: 25600, agent: "orchestrator", level: "success", message: "Scan completed successfully" },
];

const FINDING_TIMELINE: FindingBeat[] = [
  {
    at: 6200,
    phase: "sast",
    title: "SQL injection in order lookup",
    description:
      "The order identifier is concatenated directly into a SQL statement, letting an attacker read or modify any row in the orders table.",
    severity: "critical",
    category: "sqli",
    source: "code_scan",
    agent: "alpha",
    tool: "pentestcode",
    file_path: "internal/orders/repository.go",
    line_start: 142,
    line_end: 148,
    cwe_id: "CWE-89",
    cvss_score: 9.1,
    code_snippet:
      'query := "SELECT * FROM orders WHERE id = " + orderID\nrows, err := db.Query(query)',
    remediation:
      "Use a parameterised query so the identifier is bound as a value instead of being concatenated into the statement.",
    fix_available: true,
    fix_diff:
      '--- a/internal/orders/repository.go\n+++ b/internal/orders/repository.go\n@@ -140,8 +140,8 @@\n-\tquery := "SELECT * FROM orders WHERE id = " + orderID\n-\trows, err := db.Query(query)\n+\tconst query = "SELECT * FROM orders WHERE id = $1"\n+\trows, err := db.Query(query, orderID)',
    verified: true,
  },
  {
    at: 7600,
    phase: "sast",
    title: "Hardcoded API credential committed to source",
    description:
      "A live payment provider key is checked into the repository, so anyone with read access to the code can charge against the merchant account.",
    severity: "high",
    category: "secrets",
    source: "code_scan",
    agent: "alpha",
    tool: "pentestcode",
    file_path: "config/settings.py",
    line_start: 18,
    cwe_id: "CWE-798",
    cvss_score: 8.2,
    code_snippet: 'PAYMENTS_API_KEY = "sk_live_51H8xQ2Lm0pRtVnAe"',
    remediation:
      "Move the key into the secret store, read it from the environment at runtime, and rotate the exposed value.",
    fix_available: true,
    verified: false,
  },
  {
    at: 14200,
    phase: "dast",
    title: "Reflected cross-site scripting in search",
    description:
      "The search term is echoed into the results page without encoding, so a crafted link executes script in a victim's session.",
    severity: "medium",
    category: "xss",
    source: "web_pentest",
    agent: "beta",
    tool: "xss-engine",
    url: "https://shop.acme-demo.test/search?q=%3Cscript%3E",
    parameter: "q",
    cwe_id: "CWE-79",
    cvss_score: 6.1,
    remediation:
      "Contextually encode the search term on output, or render it as text rather than markup.",
    fix_available: false,
    verified: true,
  },
  {
    at: 17400,
    phase: "dast",
    title: "Blind SQL injection on the orders endpoint",
    description:
      "Boolean-based blind injection was confirmed against the public orders endpoint, allowing row-by-row extraction of the table.",
    severity: "critical",
    category: "sqli",
    source: "web_pentest",
    agent: "beta",
    tool: "sqlmap",
    url: "https://shop.acme-demo.test/api/orders?id=1",
    parameter: "id",
    cwe_id: "CWE-89",
    cvss_score: 9.4,
    remediation:
      "Bind the identifier as a query parameter and reject non-numeric input at the edge.",
    fix_available: false,
    verified: true,
  },
  {
    at: 20000,
    phase: "dast",
    title: "Insecure direct object reference on order history",
    description:
      "Order records are returned without checking tenant ownership, so incrementing the identifier exposes other customers' orders.",
    severity: "high",
    category: "idor",
    source: "web_pentest",
    agent: "beta",
    tool: "business-logic",
    url: "https://shop.acme-demo.test/api/orders/4182",
    cwe_id: "CWE-639",
    cvss_score: 7.7,
    remediation:
      "Scope the lookup to the authenticated tenant and return 404 when the record belongs to another organisation.",
    fix_available: false,
    verified: false,
  },
];

function seed(): Database {
  const shopId = "dom-shop-acme";
  const legacyId = "dom-legacy-acme";
  const repoId = "repo-checkout-api";
  const pastScanId = "scan-seed-0001";

  return {
    domains: [
      {
        id: shopId,
        domain: "shop.acme-demo.test",
        verification_status: "verified",
        last_scanned_at: ago(1000 * 60 * 42),
        created_at: ago(1000 * 60 * 60 * 24 * 9),
      },
      {
        id: legacyId,
        domain: "legacy.acme-demo.test",
        verification_status: "pending",
        last_scanned_at: null,
        created_at: ago(1000 * 60 * 60 * 30),
      },
    ],
    repos: [
      {
        id: repoId,
        full_name: "acme/checkout-api",
        is_connected: true,
        last_scanned_at: ago(1000 * 60 * 42),
        created_at: ago(1000 * 60 * 60 * 24 * 6),
      },
    ],
    scans: [
      {
        id: pastScanId,
        domain_id: shopId,
        repo_id: null,
        scan_type: "web_pentest",
        status: "completed",
        progress: 100,
        started_at: ago(1000 * 60 * 44),
        completed_at: ago(1000 * 60 * 42),
        findings_count: 2,
        critical_count: 0,
        high_count: 1,
        medium_count: 1,
        low_count: 0,
        created_at: ago(1000 * 60 * 44),
      },
    ],
    findings: [
      {
        id: "find-seed-0001",
        scan_id: pastScanId,
        title: "Session cookie missing Secure and SameSite attributes",
        description:
          "The session cookie is issued without the Secure and SameSite attributes, so it is transmitted over plaintext connections and attached to cross-site requests.",
        severity: "high",
        category: "config",
        source: "web_pentest",
        agent: "beta",
        tool: "nikto",
        url: "https://shop.acme-demo.test/login",
        cwe_id: "CWE-614",
        cvss_score: 7.1,
        remediation:
          "Issue the session cookie with Secure, HttpOnly and SameSite=Lax so it cannot be sent over HTTP or attached to cross-site requests.",
        fix_available: false,
        pr_status: "none",
        status: "open",
        verified: false,
        created_at: ago(1000 * 60 * 42),
      },
      {
        id: "find-seed-0002",
        scan_id: pastScanId,
        title: "Content Security Policy not enforced",
        description:
          "No Content-Security-Policy header is returned, so injected markup is free to load scripts from any origin.",
        severity: "medium",
        category: "config",
        source: "web_pentest",
        agent: "beta",
        tool: "nuclei",
        url: "https://shop.acme-demo.test/",
        cwe_id: "CWE-693",
        cvss_score: 5.3,
        remediation:
          "Return a Content-Security-Policy header with an explicit script-src allow-list and no unsafe-inline.",
        fix_available: false,
        pr_status: "none",
        status: "open",
        verified: false,
        created_at: ago(1000 * 60 * 42),
      },
    ],
    providers: [
      {
        id: "prov-demo",
        provider: "litellm",
        name: "Demo provider",
        api_key_mask: "****demo",
        base_url: "",
        model: "openai/gpt-4o-mini",
        is_active: true,
        is_verified: true,
        created_at: ago(1000 * 60 * 60 * 24 * 4),
      },
    ],
  };
}

function load(): Database {
  try {
    const raw = window.sessionStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Database;
  } catch {
    /* fall through */
  }
  const fresh = seed();
  save(fresh);
  return fresh;
}

function save(next: Database) {
  try {
    window.sessionStorage.setItem(STORE_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
}

let db = load();

function commit() {
  save(db);
  emit();
}

function phasesFor(scanType: ScanType) {
  if (scanType === "code_scan") return ["sast"];
  if (scanType === "web_pentest") return ["dast"];
  return ["sast", "dast"];
}

function includesPhase(scanType: ScanType, phase?: string) {
  return !phase || phasesFor(scanType).includes(phase);
}

function elapsedFor(scan: Scan) {
  return scan.launched_at ? Date.now() - scan.launched_at : Infinity;
}

function findingsForScan(scan: Scan): Finding[] {
  if (!scan.launched_at) {
    return db.findings.filter((finding) => finding.scan_id === scan.id);
  }

  const elapsed = elapsedFor(scan);
  return FINDING_TIMELINE.filter(
    (entry) => entry.at <= elapsed && includesPhase(scan.scan_type, entry.phase),
  ).map((entry, index) => {
    const id = `${scan.id}-f${index + 1}`;
    const stored = db.findings.find((finding) => finding.id === id);
    const rest = { ...entry };
    delete (rest as { at?: number }).at;
    delete (rest as { phase?: string }).phase;
    return {
      id,
      scan_id: scan.id,
      status: "open" as const,
      pr_status: "none" as const,
      created_at: new Date(scan.launched_at! + entry.at).toISOString(),
      ...rest,
      ...stored,
    };
  });
}

function materialise(scan: Scan): Scan {
  if (!scan.launched_at) return scan;
  const elapsed = elapsedFor(scan);
  const done = elapsed >= SCAN_DURATION_MS;
  const findings = findingsForScan(scan);
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const finding of findings) {
    if (finding.severity in counts) {
      counts[finding.severity as keyof typeof counts] += 1;
    }
  }
  const frozen = scan.status === "stopped" || scan.status === "paused";
  return {
    ...scan,
    status: frozen ? scan.status : done ? "completed" : "running",
    /* Hold 99% until the duration elapses, then snap to 100 so the last
       in-progress tick cannot be mistaken for a finished scan. */
    progress: frozen
      ? scan.progress
      : done
        ? 100
        : Math.min(99, Math.floor((elapsed / SCAN_DURATION_MS) * 100)),
    findings_count: findings.length,
    critical_count: counts.critical,
    high_count: counts.high,
    medium_count: counts.medium,
    low_count: counts.low,
    completed_at: done ? new Date(scan.launched_at + SCAN_DURATION_MS).toISOString() : null,
  };
}

function allScans() {
  return db.scans.map(materialise);
}

function allFindings() {
  const live = db.scans.filter((scan) => scan.launched_at);
  const liveIds = new Set(live.map((scan) => scan.id));
  return [
    ...db.findings.filter((finding) => !liveIds.has(finding.scan_id)),
    ...live.flatMap(findingsForScan),
  ];
}

function upsertFinding(id: string, patch: Partial<Finding>) {
  const existing = db.findings.find((finding) => finding.id === id);
  if (existing) {
    Object.assign(existing, patch);
    return;
  }
  const generated = allFindings().find((finding) => finding.id === id);
  if (generated) db.findings.push({ ...generated, ...patch });
}

function countsFor(findings: Finding[]) {
  return {
    findingsCount: findings.length,
    criticalCount: findings.filter((f) => f.severity === "critical").length,
    highCount: findings.filter((f) => f.severity === "high").length,
    mediumCount: findings.filter((f) => f.severity === "medium").length,
    lowCount: findings.filter((f) => f.severity === "low").length,
  };
}

export function resetStore() {
  db = seed();
  commit();
}

export function hasLiveScans() {
  return db.scans.some((scan) => {
    if (!scan.launched_at) return false;
    if (scan.status === "stopped" || scan.status === "paused" || scan.status === "completed") {
      return false;
    }
    return true;
  });
}

export function tickLiveScans() {
  let settled = false;
  let running = false;

  for (const scan of db.scans) {
    if (!scan.launched_at) continue;
    if (scan.status === "stopped" || scan.status === "paused" || scan.status === "completed") {
      continue;
    }

    const current = materialise(scan);
    if (current.status === "completed") {
      scan.status = "completed";
      scan.progress = 100;
      scan.completed_at = current.completed_at;
      scan.findings_count = current.findings_count;
      scan.critical_count = current.critical_count;
      scan.high_count = current.high_count;
      scan.medium_count = current.medium_count;
      scan.low_count = current.low_count;
      settled = true;
    } else {
      running = true;
    }
  }

  if (settled) {
    commit();
    return;
  }
  if (running) emit();
}

export function listDomains() {
  return db.domains.slice();
}

export function listRepos() {
  return db.repos.slice();
}

export function listProjects(): Project[] {
  const scans = allScans();
  const findings = allFindings();

  const domains = db.domains.map((domain) => {
    const related = findings.filter((finding) =>
      scans.some((scan) => scan.id === finding.scan_id && scan.domain_id === domain.id),
    );
    return {
      id: domain.id,
      type: "domain" as const,
      name: domain.domain,
      status: domain.verification_status,
      lastScannedAt: domain.last_scanned_at,
      ...countsFor(related),
    };
  });

  const repos = db.repos.map((repo) => {
    const related = findings.filter((finding) =>
      scans.some((scan) => scan.id === finding.scan_id && scan.repo_id === repo.id),
    );
    return {
      id: repo.id,
      type: "repository" as const,
      name: repo.full_name,
      status: repo.is_connected ? ("connected" as const) : ("pending" as const),
      lastScannedAt: repo.last_scanned_at,
      ...countsFor(related),
    };
  });

  return [...domains, ...repos];
}

export function createProject(target: string): Project {
  const value = target.trim();
  const isRepo = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(value);

  if (isRepo) {
    const repo: Repo = {
      id: uid("repo"),
      full_name: value,
      is_connected: true,
      last_scanned_at: null,
      created_at: nowISO(),
    };
    db.repos.unshift(repo);
    commit();
    return {
      id: repo.id,
      type: "repository",
      name: repo.full_name,
      status: "connected",
      lastScannedAt: null,
      findingsCount: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    };
  }

  const domain: Domain = {
    id: uid("dom"),
    domain: value.toLowerCase(),
    verification_status: "pending",
    last_scanned_at: null,
    created_at: nowISO(),
  };
  db.domains.unshift(domain);
  commit();
  return {
    id: domain.id,
    type: "domain",
    name: domain.domain,
    status: "pending",
    lastScannedAt: null,
    findingsCount: 0,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
  };
}

export function verifyProject(id: string) {
  const domain = db.domains.find((entry) => entry.id === id);
  if (domain) {
    domain.verification_status = "verified";
    commit();
  }
}

export function deleteProject(id: string) {
  db.domains = db.domains.filter((entry) => entry.id !== id);
  db.repos = db.repos.filter((entry) => entry.id !== id);
  commit();
}

export function getProjectDetail(id: string) {
  const project = listProjects().find((entry) => entry.id === id);
  if (!project) return null;
  const scans = allScans()
    .filter((scan) => scan.domain_id === id || scan.repo_id === id)
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  const findings = allFindings()
    .filter((finding) => scans.some((scan) => scan.id === finding.scan_id))
    .sort((a, b) => rank(a.severity) - rank(b.severity));
  return { ...project, scans, findings };
}

function rank(severity: string) {
  return { critical: 0, high: 1, medium: 2, low: 3, info: 4 }[severity] ?? 9;
}

export function createScan(body: {
  scan_type: ScanType;
  domain_id?: string;
  repo_id?: string;
}) {
  const scan: Scan = {
    id: uid("scan"),
    domain_id: body.domain_id || null,
    repo_id: body.repo_id || null,
    scan_type: body.scan_type,
    status: "running",
    progress: 0,
    launched_at: Date.now(),
    started_at: nowISO(),
    completed_at: null,
    findings_count: 0,
    critical_count: 0,
    high_count: 0,
    medium_count: 0,
    low_count: 0,
    created_at: nowISO(),
  };
  db.scans.unshift(scan);
  commit();
  return materialise(scan);
}

export function getScan(id: string) {
  const scan = db.scans.find((entry) => entry.id === id);
  return scan ? materialise(scan) : null;
}

export function listScans() {
  return allScans().sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

export function scanTarget(scan: Scan) {
  const domain = db.domains.find((entry) => entry.id === scan.domain_id);
  if (domain) return domain.domain;
  const repo = db.repos.find((entry) => entry.id === scan.repo_id);
  return repo?.full_name || "Unknown target";
}

export function scanTypeLabel(scanType: string) {
  return scanType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getScanLogs(id: string) {
  const scan = db.scans.find((entry) => entry.id === id);
  if (!scan?.launched_at) return [];
  const elapsed = elapsedFor(scan);
  return LOG_TIMELINE.filter(
    (entry) => entry.at <= elapsed && includesPhase(scan.scan_type, entry.phase),
  ).map((entry, index) => ({
    id: `${id}-log-${index}`,
    agent: entry.agent,
    level: entry.level,
    message: entry.message,
    created_at: new Date(scan.launched_at! + entry.at).toISOString(),
  }));
}

export function getScanFindings(id: string) {
  const scan = db.scans.find((entry) => entry.id === id);
  return scan ? findingsForScan(scan) : [];
}

export function listFindings() {
  return allFindings().sort((a, b) => rank(a.severity) - rank(b.severity));
}

export function getFinding(id: string) {
  return allFindings().find((finding) => finding.id === id) ?? null;
}

export function requestFix(id: string) {
  const finding = allFindings().find((entry) => entry.id === id);
  if (!finding) return null;
  const number = 128 + db.findings.filter((entry) => entry.pr_status === "created").length;
  upsertFinding(id, {
    pr_status: "created",
    pr_url: `https://github.com/acme/checkout-api/pull/${number}`,
    pr_number: number,
    status: "confirmed",
  });
  commit();
  return getFinding(id);
}

export const LLM_MODELS = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "anthropic/claude-sonnet-4-5",
  "gemini/gemini-2.5-flash",
  "ollama/qwen2.5-coder",
];

export function listProviders() {
  return db.providers.slice();
}

export function createProvider(body: {
  name: string;
  model: string;
  api_key?: string;
  base_url?: string;
}) {
  for (const provider of db.providers) provider.is_active = false;
  const provider: Provider = {
    id: uid("prov"),
    provider: "litellm",
    name: body.name || "LiteLLM",
    api_key_mask: body.api_key ? `****${body.api_key.slice(-4)}` : "",
    base_url: body.base_url || "",
    model: body.model,
    is_active: true,
    is_verified: false,
    created_at: nowISO(),
  };
  db.providers.unshift(provider);
  commit();
  return provider;
}

export function activateProvider(id: string) {
  for (const provider of db.providers) provider.is_active = provider.id === id;
  commit();
}

export function deleteProvider(id: string) {
  db.providers = db.providers.filter((provider) => provider.id !== id);
  commit();
}

export function testProvider(id: string) {
  const provider = db.providers.find((entry) => entry.id === id);
  if (provider) provider.is_verified = true;
  commit();
  return { success: true, message: "Provider test passed" };
}

export function githubBot() {
  return {
    account: "silenceai-net",
    has_key: true,
    public_key:
      "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKRKs9mqv21RVeeBixQ24IwYir8FyQL2L53SHFLXMbd2 silenceai-net@vulnsight",
  };
}

export function bccInfo() {
  return {
    configured: true,
    currency: "398",
    signature_note: "P_SIGN MAC contract is required from BCC",
  };
}

export function categoryLabel(category: string) {
  return (
    {
      sqli: "SQL injection",
      xss: "XSS",
      secrets: "Secrets",
      idor: "IDOR",
      config: "Config",
    }[category] ?? category
  );
}

export function timeAgo(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "unknown";
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
