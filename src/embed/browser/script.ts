import {
  clickElement,
  hideCursor,
  getDocument,
  selectOption,
  setChecked,
  sleep,
  typeInto,
  waitForNavigation,
  waitForSelector,
} from "./automation";

export const SITE_HOME = "/site/index.html";

export type Step = { id: string; label: string } & (
  | { action: "navigate"; url: string }
  | { action: "click"; selector: string; expectNavigation?: boolean }
  | { action: "type"; selector: string; value: string }
  | { action: "select"; selector: string; value: string }
  | { action: "check"; selector: string; value: boolean }
  | { action: "verify"; selector: string }
  | { action: "pause"; ms: number }
);

export type StepState = "pending" | "running" | "done" | "failed";

/**
 * What the agent does to the embedded site. Every entry maps to genuine DOM
 * work inside the real page — no step is decorative.
 */
export const SCRIPT: Step[] = [
  {
    id: "s1",
    action: "navigate",
    url: SITE_HOME,
    label: "Open Harness Studio",
  },
  {
    id: "s2",
    action: "click",
    selector: "#cta-brief",
    expectNavigation: true,
    label: "Follow “Create a review brief”",
  },
  {
    id: "s3",
    action: "type",
    selector: "#brief-title",
    value: "Add copy review brief action",
    label: "Fill in the title",
  },
  {
    id: "s4",
    action: "select",
    selector: "#brief-repo",
    value: "compare-model",
    label: "Choose the package",
  },
  {
    id: "s5",
    action: "select",
    selector: "#brief-severity",
    value: "major",
    label: "Set severity to major",
  },
  {
    id: "s6",
    action: "type",
    selector: "#brief-summary",
    value:
      "Adds buildReviewBrief plus a clipboard action on the Evidence Results page. Reviewers should start with the Markdown contract test.",
    label: "Write the summary",
  },
  {
    id: "s7",
    action: "check",
    selector: "#brief-tests",
    value: true,
    label: "Include verification evidence",
  },
  {
    id: "s8",
    action: "click",
    selector: "#brief-submit",
    expectNavigation: true,
    label: "Submit the form",
  },
  {
    id: "s9",
    action: "verify",
    selector: ".brief",
    label: "Confirm the brief was saved",
  },
];

export type RunContext = {
  frame: HTMLIFrameElement;
  navigate: (url: string) => void;
  cancelled: () => boolean;
};

async function execute(step: Step, ctx: RunContext) {
  const { frame } = ctx;

  switch (step.action) {
    case "navigate": {
      const before = getDocument(frame);
      ctx.navigate(step.url);
      if (before) await waitForNavigation(frame, before);
      else await sleep(900);
      return;
    }

    case "click": {
      const before = getDocument(frame);
      await clickElement(frame, step.selector);
      if (step.expectNavigation) {
        await waitForNavigation(frame, before);
        hideCursor(getDocument(frame));
      }
      return;
    }

    case "type":
      await typeInto(frame, step.selector, step.value);
      return;

    case "select":
      await selectOption(frame, step.selector, step.value);
      return;

    case "check":
      await setChecked(frame, step.selector, step.value);
      return;

    case "verify":
      await waitForSelector(frame, step.selector);
      return;

    case "pause":
      await sleep(step.ms);
      return;
  }
}

/**
 * Runs the script sequentially, reporting each transition so the log panel can
 * follow along. Rejections are surfaced per step rather than aborting silently.
 */
export async function runScript(
  ctx: RunContext,
  onStep: (index: number, state: StepState, error?: string) => void,
) {
  for (let index = 0; index < SCRIPT.length; index += 1) {
    if (ctx.cancelled()) return;

    onStep(index, "running");

    try {
      await execute(SCRIPT[index], ctx);
      if (ctx.cancelled()) return;
      onStep(index, "done");
      await sleep(420);
    } catch (error) {
      onStep(
        index,
        "failed",
        error instanceof Error ? error.message : "Step failed",
      );
      return;
    }
  }
}
