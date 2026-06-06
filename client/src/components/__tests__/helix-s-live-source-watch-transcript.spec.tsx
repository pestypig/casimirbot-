import { beforeAll, describe, expect, it } from "vitest";

let buildHelixMailLoopTurnStreamRows: typeof import("../helix/HelixAskPill").buildHelixMailLoopTurnStreamRows;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  ({ buildHelixMailLoopTurnStreamRows } = await import("../helix/HelixAskPill"));
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
});
