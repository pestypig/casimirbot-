import { beforeEach, describe, expect, it } from "vitest";
import {
  buildMailLoopTranscriptRows,
  enqueueLatestVisualSummaryMailIfNeeded,
  enqueueVisualSummaryMailFromEvidence,
  readLiveSourceMailForAsk,
  recordLiveSourceMailDecisionForAsk,
} from "../services/stage-play/stage-play-visual-summary-mail-ingest";
import {
  enqueueStagePlayLiveSourceMailItem,
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
  it("enqueues analysis-ready visual summaries as compact mail only", () => {
    const mail = enqueueVisualSummaryMailFromEvidence({
      threadId,
      roomId,
      environmentId: "live_env:stage-play-mailbox",
      sourceId,
      visualFrameRef: "visual_frame:compact-only",
      visualEvidenceRef: "visual_evidence:compact-only",
      summary: "Compact visual evidence summary with no raw image payload.",
      confidence: 0.74,
      analysisState: "analysis_ready",
      now: "2026-06-04T11:59:59.000Z",
    });

    expect(mail).toMatchObject({
      artifactId: "stage_play_live_source_mail_item",
      sourceId,
      sourceKind: "visual_frame",
      sourceRefs: {
        sourceId,
        frameRef: "visual_frame:compact-only",
        evidenceRef: "visual_evidence:compact-only",
      },
      summary: {
        confidence: 0.74,
        analysisState: "analysis_ready",
      },
      evidenceRefs: [
        sourceId,
        "visual_frame:compact-only",
        "visual_evidence:compact-only",
      ],
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
    expect(JSON.stringify(mail)).not.toMatch(/raw_image|image_ref|data:image|base64/i);
  });

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

  it("records wait as a visible decision receipt instead of silent no-op", () => {
    seedVisualEvidence();
    const readResult = readLiveSourceMailForAsk({ threadId, roomId, sourceId, limit: 1 });
    const mailId = readResult.items[0].mailId;

    const decision = recordLiveSourceMailDecisionForAsk({
      threadId,
      roomId,
      mailIds: [mailId],
      decision: "wait_for_next_summary",
      rationalePreview: "No high-salience change yet; keep the mailbox armed for the next interval summary.",
      evidenceRefs: readResult.evidenceRefs,
      now: "2026-06-04T12:00:02.500Z",
    });

    expect(decision).toMatchObject({
      decision: "wait_for_next_summary",
      nextLoopState: "armed_for_next_summary",
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
    });

    const rows = buildMailLoopTranscriptRows({ decision });
    expect(rows.map((row) => row.rowKind)).toEqual(expect.arrayContaining([
      "agent_decision",
      "loop_state",
    ]));
    expect(rows.map((row) => row.rowKind)).not.toContain("text_answer");
    expect(rows.map((row) => row.rowKind)).not.toContain("voice_callout_request");
    expect(rows.every((row) => row.assistantAnswer === false && row.terminalEligible === false)).toBe(true);
  });

  it("persists a requested next tool on the mail decision receipt", () => {
    seedVisualEvidence();
    const readResult = readLiveSourceMailForAsk({ threadId, roomId, sourceId, limit: 1 });
    const mailId = readResult.items[0].mailId;

    const decision = recordLiveSourceMailDecisionForAsk({
      threadId,
      roomId,
      mailIds: [mailId],
      decision: "request_more_evidence",
      rationalePreview: "The compact summary is ambiguous; request another visual mail check before drafting.",
      requestedTool: {
        toolName: "live_env.read_live_source_mail",
        args: {
          source_kind: "visual_frame",
          limit: 1,
        },
      },
      evidenceRefs: readResult.evidenceRefs,
      now: "2026-06-04T12:00:02.750Z",
    });

    expect(decision.requestedTool).toEqual({
      toolName: "live_env.read_live_source_mail",
      args: {
        source_kind: "visual_frame",
        limit: 1,
      },
    });
    const rows = buildMailLoopTranscriptRows({ decision });
    expect(rows.map((row) => row.rowKind)).toContain("requested_tool");
    expect(rows.find((row) => row.rowKind === "requested_tool")?.body).toContain("live_env.read_live_source_mail");
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

  it("polling fallback enqueues latest visual evidence once per evidence ref", () => {
    seedVisualEvidence();

    const first = enqueueLatestVisualSummaryMailIfNeeded({
      threadId,
      roomId,
      sourceId,
      now: "2026-06-04T12:00:09.000Z",
    });
    const second = enqueueLatestVisualSummaryMailIfNeeded({
      threadId,
      roomId,
      sourceId,
      now: "2026-06-04T12:00:10.000Z",
    });

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(second?.mailId).toBe(first?.mailId);
    expect(first).toMatchObject({
      sourceRefs: {
        frameRef: "visual_frame:stage-play-mailbox",
        evidenceRef: "visual_evidence:stage-play-mailbox",
      },
      raw_content_included: false,
      assistant_answer: false,
      terminal_eligible: false,
    });
    expect(listStagePlayLiveSourceMailItems({ threadId, sourceId })).toHaveLength(1);
    expect(JSON.stringify(first)).not.toMatch(/raw_image|image_ref|data:image|base64/i);
  });

  it("collapses exact evidence duplicates without deciding salience", () => {
    const first = enqueueStagePlayLiveSourceMailItem({
      threadId,
      roomId,
      sourceId,
      sourceKind: "visual_frame",
      frameRef: "visual_frame:duplicate",
      evidenceRef: "visual_evidence:duplicate",
      summaryText: "A compact visual summary.",
      createdAt: "2026-06-04T12:00:04.000Z",
    });
    const duplicate = enqueueStagePlayLiveSourceMailItem({
      threadId,
      roomId,
      sourceId,
      sourceKind: "visual_frame",
      frameRef: "visual_frame:duplicate",
      evidenceRef: "visual_evidence:duplicate",
      summaryText: "A compact visual summary.",
      createdAt: "2026-06-04T12:00:05.000Z",
    });
    const changed = enqueueStagePlayLiveSourceMailItem({
      threadId,
      roomId,
      sourceId,
      sourceKind: "visual_frame",
      frameRef: "visual_frame:changed",
      evidenceRef: "visual_evidence:changed",
      summaryText: "A different compact visual summary.",
      createdAt: "2026-06-04T12:00:06.000Z",
    });

    expect(duplicate.mailId).toBe(first.mailId);
    expect(changed.mailId).not.toBe(first.mailId);
    expect(listStagePlayLiveSourceMailItems({ threadId })).toHaveLength(2);
    expect(listStagePlayLiveSourceMailItems({ threadId, status: "unread" }).map((item) => item.mailId)).toEqual([
      first.mailId,
      changed.mailId,
    ]);
  });

  it("only supersedes unread mail when the caller explicitly names replacement ids", () => {
    const oldMail = enqueueStagePlayLiveSourceMailItem({
      threadId,
      roomId,
      sourceId,
      sourceKind: "visual_frame",
      frameRef: "visual_frame:old",
      evidenceRef: "visual_evidence:old",
      summaryText: "Older compact visual summary.",
      createdAt: "2026-06-04T12:00:07.000Z",
    });
    const replacement = enqueueStagePlayLiveSourceMailItem({
      threadId,
      roomId,
      sourceId,
      sourceKind: "visual_frame",
      frameRef: "visual_frame:new",
      evidenceRef: "visual_evidence:new",
      summaryText: "Newer compact visual summary.",
      supersedesMailIds: [oldMail.mailId],
      createdAt: "2026-06-04T12:00:08.000Z",
    });

    expect(listStagePlayLiveSourceMailItems({ threadId, status: "superseded" }).map((item) => item.mailId)).toEqual([
      oldMail.mailId,
    ]);
    expect(listStagePlayLiveSourceMailItems({ threadId, status: "unread" }).map((item) => item.mailId)).toEqual([
      replacement.mailId,
    ]);
  });

  it("filters unread mail by source kind without consuming other kinds", () => {
    const visualMail = enqueueStagePlayLiveSourceMailItem({
      threadId,
      roomId,
      sourceId: "visual_source:kind-filter",
      sourceKind: "visual_frame",
      frameRef: "visual_frame:kind-filter",
      evidenceRef: "visual_evidence:kind-filter",
      summaryText: "Visual frame summary.",
      createdAt: "2026-06-04T12:00:11.000Z",
    });
    const audioMail = enqueueStagePlayLiveSourceMailItem({
      threadId,
      roomId,
      sourceId: "audio_source:kind-filter",
      sourceKind: "audio_transcript",
      observationRef: "audio_observation:kind-filter",
      summaryText: "Audio transcript summary.",
      createdAt: "2026-06-04T12:00:12.000Z",
    });

    const readResult = readLiveSourceMailForAsk({
      threadId,
      roomId,
      sourceKind: "audio_transcript",
      limit: 5,
    });

    expect(readResult.items.map((item) => item.mailId)).toEqual([audioMail.mailId]);
    expect(listStagePlayLiveSourceMailItems({ threadId, status: "delivered_to_ask" }).map((item) => item.mailId)).toEqual([
      audioMail.mailId,
    ]);
    expect(listStagePlayLiveSourceMailItems({ threadId, status: "unread" }).map((item) => item.mailId)).toEqual([
      visualMail.mailId,
    ]);
  });
});
