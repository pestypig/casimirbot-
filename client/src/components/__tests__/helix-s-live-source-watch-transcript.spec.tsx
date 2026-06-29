import { beforeAll, describe, expect, it } from "vitest";

let buildHelixMailLoopTurnStreamRows: typeof import("../helix/HelixAskPill").buildHelixMailLoopTurnStreamRows;
let buildHelixAskSteeringQueueItems: typeof import("../helix/HelixAskPill").buildHelixAskSteeringQueueItems;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  ({ buildHelixMailLoopTurnStreamRows, buildHelixAskSteeringQueueItems } = await import("../helix/HelixAskPill"));
});

describe("Helix Ask live-source watch transcript rows", () => {
  it("renders interpretation, watch-next, and narrative-state rows as live-source transcript rows", () => {
    const rows = buildHelixMailLoopTurnStreamRows("reply-live-source", [
      {
        rowId: "row-interpretation",
        rowKind: "interpretation",
        title: "Interpretation",
        body: "The batch shows a stable launcher with productivity apps visible.",
        evidenceRefs: ["stage_play_live_source_narrative_state:test"],
        authority: "model_decision_receipt",
        terminalEligible: false,
      },
      {
        rowId: "row-watch-next",
        rowKind: "watch_next",
        title: "Watch next",
        body: "Targets: opened app, active window change\nReason: Watch for content replacing the launcher.",
        evidenceRefs: ["stage_play_live_source_narrative_state:test"],
        authority: "model_decision_receipt",
        terminalEligible: false,
      },
      {
        rowId: "row-narrative-state",
        rowKind: "narrative_state",
        title: "Narrative state",
        body: "stage_play_live_source_narrative_state:test",
        evidenceRefs: ["stage_play_live_source_narrative_state:test"],
        authority: "tool_evidence",
        terminalEligible: false,
      },
    ]);

    expect(rows.map((row) => row.label)).toEqual([
      "Interpretation",
      "Watch next",
      "Narrative state",
    ]);
    expect(rows.map((row) => row.status)).toEqual([
      "interpretation",
      "watch_next",
      "narrative_state",
    ]);
    expect(rows.every((row) => row.source === "live_source_mail")).toBe(true);
    expect(rows.every((row) => row.tone === "checkpoint")).toBe(true);
    expect(rows.every((row) => row.meta !== "user prompt")).toBe(true);
  });

  it("keeps interpretation rows separate from user prompts", () => {
    const rows = buildHelixMailLoopTurnStreamRows("reply-live-source", [
      {
        rowId: "row-interpretation",
        rowKind: "interpretation",
        title: "Interpretation",
        body: "The visual source appears to be in a document editor.",
        evidenceRefs: [],
        authority: "model_decision_receipt",
        terminalEligible: false,
      },
    ]);

    expect(rows[0]).toMatchObject({
      source: "live_source_mail",
      label: "Interpretation",
      status: "interpretation",
      tone: "checkpoint",
    });
    expect(rows[0].source).not.toBe("question");
    expect(rows[0].meta).not.toBe("user prompt");
  });

  it("exposes latest narrative state in the compact transcript status", () => {
    const rows = buildHelixMailLoopTurnStreamRows("reply-live-source", [
      {
        rowId: "row-narrative-state",
        rowKind: "narrative_state",
        title: "Narrative state",
        body: "stage_play_live_source_narrative_state:latest",
        evidenceRefs: ["stage_play_live_source_narrative_state:latest"],
        authority: "tool_evidence",
        terminalEligible: false,
      },
    ]);

    expect(rows[0]).toMatchObject({
      label: "Narrative state",
      text: "stage_play_live_source_narrative_state:latest",
      source: "live_source_mail",
      detailLimit: 420,
    });
    expect(rows[0].evidenceRefs).toContain("stage_play_live_source_narrative_state:latest");
  });

  it("builds a visible steering queue with active steps first", () => {
    const rows = buildHelixAskSteeringQueueItems({
      activeTurnStreamRows: [
        {
          key: "active-read",
          source: "agent_work",
          label: "Read processed mail",
          text: "live_env.read_processed_live_source_mail",
          meta: "current turn",
          status: "running",
          tone: "working",
          evidenceRefs: [],
        },
      ],
      mailbox: {
        ok: true,
        mailboxThreadId: "helix-ask:desktop",
        watchJobPolicies: [
          {
            policyId: "stage_play_live_source_watch_job_policy:test",
            objectiveText: "Watch Minecraft mail.",
            interpretationMode: "prediction_watch",
            status: "armed",
            createdAt: "2026-06-09T10:00:00.000Z",
          },
        ],
      },
      maxItems: 4,
    });

    expect(rows[0]).toMatchObject({
      label: "Read processed mail",
      status: "running",
    });
    expect(rows.some((row) => row.label === "Watch policy armed")).toBe(true);
  });

  it("surfaces unread mail and deferred wake continuation as queue items", () => {
    const rows = buildHelixAskSteeringQueueItems({
      mailbox: {
        ok: true,
        mailboxThreadId: "helix-ask:desktop",
        mailItems: [
          {
            mailId: "stage_play_live_source_mail:one",
            status: "unread",
            summary: {
              preview: "Minecraft player moves from a base toward a cave.",
            },
            evidenceRefs: ["visual_evidence:one"],
            createdAt: "2026-06-09T10:01:00.000Z",
          },
        ],
        wakeAdmissionCycle: {
          deferredWakeIds: ["stage_play_live_source_mail_wake:pressure"],
          runtimeAdmission: {
            reason: "memory_pressure",
            pressureLevel: "high",
          },
          continuation: {
            scheduled: false,
            reason: "pressure",
            runnableWakeIds: [],
          },
        },
      },
      maxItems: 4,
    });

    expect(rows.map((row) => row.label)).toEqual([
      "Observer backlog",
      "Continuation deferred",
    ]);
    expect(rows[0].detail).toContain("Minecraft player moves");
    expect(rows[1]).toMatchObject({
      status: "deferred",
      meta: "memory_pressure",
    });
  });
});
