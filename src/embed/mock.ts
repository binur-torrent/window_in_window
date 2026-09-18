export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 800;

export type ChangedFile = {
  path: string;
  added: number;
  removed: number;
};

export type Beat =
  | { id: string; kind: "user"; text: string; hold: number }
  | { id: string; kind: "processed"; label: string; hold: number }
  | { id: string; kind: "assistant"; text: string; hold: number }
  | {
      id: string;
      kind: "activity";
      label: string;
      duration: string;
      failed?: number;
      hold: number;
    }
  | { id: string; kind: "note"; html: string; hold: number }
  | {
      id: string;
      kind: "group";
      label: string;
      items: string[];
      hold: number;
    }
  | { id: string; kind: "thinking"; label: string; hold: number }
  | {
      id: string;
      kind: "result";
      summary: string;
      commit: string;
      branch: string;
      added: number;
      removed: number;
      deliverables: string[];
      evidence: string[];
      next: string;
      artifact: string;
      files: ChangedFile[];
      hold: number;
    };

export const WORKSPACE = "better-harness";
export const SESSION_TITLE = "Add copy review brief action";
export const BRANCH = "feat/evidence-results-review-brief";

export const RECENT_CONVERSATIONS = [
  "Create HTML competitive analys…",
  "Trace flaky snapshot in runner",
  "Draft release notes for 0.9.2",
];

export const BEATS: Beat[] = [
  {
    id: "b1",
    kind: "user",
    text: 'Add a "Copy review brief" action to Harness Studio\'s Evidence Results page. It should generate a concise Markdown summary suitable for a PR or issue.',
    hold: 900,
  },
  {
    id: "b2",
    kind: "processed",
    label: "Processed for 13.4s",
    hold: 700,
  },
  {
    id: "b3",
    kind: "assistant",
    text: "Understood — rerunning the task from scratch on a fresh branch, with all communication in English. Delivery stays clipboard-only as you decided earlier.",
    hold: 600,
  },
  {
    id: "b4",
    kind: "activity",
    label: "Ran cd ./better-harness",
    duration: "3.5s",
    hold: 700,
  },
  {
    id: "b5",
    kind: "note",
    html: "Branch <code>feat/evidence-results-review-brief</code> created from main (8a35fc5). Writing the spec.",
    hold: 800,
  },
  {
    id: "b6",
    kind: "activity",
    label: "Edited 2026-08-20-evidence-results-review-brief.md",
    duration: "8.8s",
    hold: 700,
  },
  {
    id: "b7",
    kind: "note",
    html: "Spec written. Now tests first, then the model function.",
    hold: 700,
  },
  {
    id: "b8",
    kind: "activity",
    label: "Read compare-model.test.ts",
    duration: "36.5s",
    hold: 700,
  },
  {
    id: "b9",
    kind: "note",
    html: "Tests in place. Implementing <code>buildReviewBrief</code> and the index export.",
    hold: 800,
  },
  {
    id: "b10",
    kind: "activity",
    label: "Edited 2 files",
    duration: "59.0s",
    failed: 2,
    hold: 700,
  },
  {
    id: "b11",
    kind: "note",
    html: "Re-reading both files after the branch switch.",
    hold: 700,
  },
  {
    id: "b12",
    kind: "group",
    label: "Processed for 152.7s",
    items: ["Read file compare-model.ts", "Read file index.ts"],
    hold: 900,
  },
  {
    id: "b13",
    kind: "thinking",
    label: "Mulling it over",
    hold: 1800,
  },
  {
    id: "b14",
    kind: "result",
    summary: "Rerun complete on branch",
    branch: BRANCH,
    commit: "94acbeb",
    added: 203,
    removed: 2,
    deliverables: [
      "<strong>Spec</strong>: docs/specs/2026-08-20-evidence-results-review-brief.md — intent, AC-1..AC-5, non-goals, clipboard-only decision recorded",
      "<strong>Code</strong>: buildReviewBrief in compare-model.ts; “Copy review brief” button with clipboard fallback + inline status in CompareView.tsx; styles in shell.css; package in index.ts",
      "<strong>Tests</strong>: 3 new cases in compare-model.test.ts (full Markdown contract, zero-cost wording, insufficient-pairs wording)",
    ],
    evidence: [
      "121 package tests passing, tsc --noEmit clean",
      "Browser end-to-end against fixture evidence: the exact Markdown brief reached the clipboard (verified character-for-character), both the “Copied” and “Clipboard unavailable” states confirmed",
      "Wide/narrow screenshots captured, no console errors beyond the pre-existing favicon 404",
    ],
    next: "Next step: push the branch and open a PR against <code>main</code> — want me to?",
    artifact: "2026-08-20-evidence-results-review-brief.md",
    files: [
      {
        path: "docs/specs/2026-08-20-evidence-results-review-brief.md",
        added: 64,
        removed: 0,
      },
      {
        path: "packages/harness-studio/src/app/compare-model.ts",
        added: 43,
        removed: 0,
      },
      {
        path: "packages/harness-studio/src/app/CompareView.tsx",
        added: 48,
        removed: 1,
      },
      {
        path: "packages/harness-studio/src/app/compare-model.test.ts",
        added: 34,
        removed: 0,
      },
      { path: "packages/harness-studio/src/app/shell.css", added: 12, removed: 0 },
      { path: "packages/harness-studio/src/index.ts", added: 2, removed: 1 },
    ],
    hold: 2600,
  },
];

export const TOTAL_BEATS = BEATS.length;
