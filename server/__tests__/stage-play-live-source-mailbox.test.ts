import { beforeEach, describe, expect, it } from "vitest";
import {
  buildMailLoopTranscriptRows,
  readLiveSourceMailForAsk,
  recordLiveSourceMailDecisionForAsk,
} from "../services/stage-play/stage-play-visual-summary-mail-ingest";
import {
  listStagePlayLiveSourceJobStates,
  listStagePlayLiveSourceMailItems,
  resetStagePlayLiveSourceMailboxForTest,
} from "../services/stage-play/stage-play-live-source-mailbox-store";
import {
  analyzeVisualFrame,
  recordVisualFrame,
  resetVisualSnapshotStoreForTest,
  startVisualSnapshotSource,
} from "../services/situation-room/visual-snapshot-store";

const threadId = "thread:stage-play-mailbox";
const roomId = "room:stage-play-mailbox";
const sourceId = "visual_source:stage-play-mailbox";

beforeEach(() => {
  resetStagePlayLiveSourceMailboxForTest();
  resetVisualSnapshotStoreForTest();
});

const seedVisualEvidence = () => {
  startVisualSnapshotSource({
    source_id: sourceId,
    thread_id: threadId,
    room_id: roomId,
    source_surface: "browser_tab",
    capture_mode: "interval",
    status: "active",
  });
  const frame = recordVisualFrame({
    source_id: sourceId,
    thread_id: threadId,
    room_id: roomId,
    frame_id: "visual_frame:stage-play-mailbox",
    ts: "2026-06-04T12:00:00.000Z",
  });
  const evidence = analyzeVisualFrame({
    thread_id: threadId,
    frame_id: frame.frame_id,
    evidence_id: "visual_evidence:stage-play-mailbox",
    summary: "Minecraft-like scene with a character near a book stand, cat, moonlit mountains, and waterfalls.",
    detected_objects: ["character", "book stand", "cat"],
    uncertainty: ["audio context missing"],
    supports_claims: [
      {
        claim: "A compact visual summary is available.",
        support_status: "supports",
        confidence: 0.82,
      },
    ],
  });
  return { frame, evidence };
};

describe("Stage Play live-source mailbox", () => {
  it("turns latest compact visual evidence into unread Ask mail without raw content", () => {
    seedVisualEvidence();

    const readResult = readLiveSourceMailForAsk({
      threadId,
      roomId,
      sourceId,
      limit: 1,
      now: "2026-06-04T12:00:01.000Z",
    });

    expect(readResult).toMatchObject({
      artifactId: "stage_play_live_source_mail_read_result",
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
    expect(readResult.items).toHaveLength(1);
    expect(readResult.items[0]).toMatchObject({
      artifactId: "stage_play_live_source_mail_item",
      status: "delivered_to_ask",
      sourceId,
      sourceRefs: {
        frameRef: "visual_frame:stage-play-mailbox",
        evidenceRef: "visual_evidence:stage-play-mailbox",
      },
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(readResult.items[0].summary.preview).toMatch(/Minecraft-like scene/);
    expect(readResult.evidenceRefs).toEqual(expect.arrayContaining([
      sourceId,
      "visual_frame:stage-play-mailbox",
      "visual_evidence:stage-play-mailbox",
      readResult.items[0].mailId,
    ]));

    const rows = buildMailLoopTranscriptRows({
      mailItems: readResult.items,
      readResult,
    });
    expect(rows.map((row) => row.rowKind)).toEqual(expect.arrayContaining([
      "mail_received",
      "mail_read_tool_call",
      "mail_read_receipt",
    ]));
    expect(rows.every((row) => row.assistantAnswer === false && row.terminalEligible === false)).toBe(true);
  });

  it("records a model decision as a receipt and re-arms for the next visual summary", () => {
    seedVisualEvidence();
    const readResult = readLiveSourceMailForAsk({ threadId, roomId, sourceId, limit: 1 });
    const mailId = readResult.items[0].mailId;

    const decision = recordLiveSourceMailDecisionForAsk({
      threadId,
      roomId,
      mailIds: [mailId],
      decision: "request_voice_callout",
      rationalePreview: "The compact visual summary shows a notable scene change worth announcing.",
      voiceCalloutDraft: "The active visual source now shows a Minecraft-like scene near a book stand.",
      voiceEnabled: true,
      voiceRequiresConfirmation: false,
      evidenceRefs: readResult.evidenceRefs,
      now: "2026-06-04T12:00:02.000Z",
    });

    expect(decision).toMatchObject({
      artifactId: "stage_play_live_source_mail_decision",
      decision: "request_voice_callout",
      nextLoopState: "armed_for_next_summary",
      modelReviewed: true,
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
    expect(decision.voiceCalloutDraft).toMatchObject({
      voiceEligible: true,
      requiresConfirmation: false,
    });
    expect(listStagePlayLiveSourceMailItems({ threadId, status: "decision_recorded" })).toHaveLength(1);
    expect(listStagePlayLiveSourceJobStates({ threadId })[0]).toMatchObject({
      status: "armed",
      nextLoopState: "armed_for_next_summary",
      lastDecisionId: decision.decisionId,
    });

    const rows = buildMailLoopTranscriptRows({ decision });
    expect(rows.map((row) => row.rowKind)).toEqual(expect.arrayContaining([
      "agent_decision",
      "voice_callout_request",
      "loop_state",
    ]));
    expect(rows.find((row) => row.rowKind === "voice_callout_request")?.terminalEligible).toBe(false);
  });

  it("returns a wait receipt instead of a visual-unavailable answer when no summary mail exists", () => {
    const readResult = readLiveSourceMailForAsk({
      threadId,
      roomId,
      sourceId,
      limit: 1,
      now: "2026-06-04T12:00:03.000Z",
    });

    expect(readResult.items).toEqual([]);
    expect(readResult.assistant_answer).toBe(false);
    expect(readResult.terminal_eligible).toBe(false);
    const rows = buildMailLoopTranscriptRows({ readResult });
    expect(rows.map((row) => row.rowKind)).toContain("wait_for_next_summary");
    expect(rows.map((row) => row.body).join("\n")).not.toMatch(/visual capture evidence is unavailable/i);
  });
});
