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
  listStagePlayMailDecisions,
  listStagePlayLiveSourceJobStates,
  listStagePlayLiveSourceMailItems,
  resetStagePlayLiveSourceMailboxForTest,
  upsertStagePlayLiveSourceJobState,
} from "../services/stage-play/stage-play-live-source-mailbox-store";
import {
  listStagePlayLiveSourceMailWakeRequests,
  markStagePlayMailWakeRunning,
  resetStagePlayLiveSourceMailWakeStoreForTest,
} from "../services/stage-play/stage-play-live-source-mail-wake-store";
import {
  queueMailWakeForUnreadItems,
  runNextMailWakeRequest,
} from "../services/stage-play/stage-play-live-source-mail-wake-runner";
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
  resetStagePlayLiveSourceMailWakeStoreForTest();
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

  it("enqueues visual summary mail at the visual analysis producer boundary", () => {
    const { evidence } = seedVisualEvidence();

    const mailItems = listStagePlayLiveSourceMailItems({ threadId, sourceId });
    expect(mailItems).toHaveLength(1);
    expect(mailItems[0]).toMatchObject({
      status: "unread",
      sourceRefs: {
        frameRef: evidence.frame_id,
        evidenceRef: evidence.evidence_id,
      },
      summary: {
        text: evidence.summary,
        analysisState: "analysis_ready",
      },
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
    expect(listStagePlayLiveSourceJobStates({ threadId })[0]).toMatchObject({
      status: "armed",
      lastMailId: mailItems[0].mailId,
      nextLoopState: "continue_with_unread_mail",
    });
    expect(listStagePlayLiveSourceMailWakeRequests({ threadId })).toHaveLength(1);
    expect(listStagePlayLiveSourceMailWakeRequests({ threadId })[0]).toMatchObject({
      status: "queued",
      mailIds: [mailItems[0].mailId],
      sourceIds: [sourceId],
      reason: "unread_mail",
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
    expect(JSON.stringify(mailItems[0])).not.toMatch(/raw_image|image_ref|data:image|base64/i);
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

  it("reads only exact wake mail ids instead of widening to all unread mail", () => {
    const first = enqueueVisualSummaryMailFromEvidence({
      threadId,
      roomId,
      sourceId,
      visualFrameRef: "visual_frame:exact-first",
      visualEvidenceRef: "visual_evidence:exact-first",
      summary: "First compact visual summary.",
      analysisState: "analysis_ready",
      now: "2026-06-04T12:00:01.000Z",
    });
    const second = enqueueVisualSummaryMailFromEvidence({
      threadId,
      roomId,
      sourceId,
      visualFrameRef: "visual_frame:exact-second",
      visualEvidenceRef: "visual_evidence:exact-second",
      summary: "Second compact visual summary.",
      analysisState: "analysis_ready",
      now: "2026-06-04T12:00:02.000Z",
    });

    const readResult = readLiveSourceMailForAsk({
      threadId,
      roomId,
      sourceId,
      mailIds: [second.mailId],
      limit: 3,
      now: "2026-06-04T12:00:03.000Z",
    });

    expect(readResult.items.map((item) => item.mailId)).toEqual([second.mailId]);
    expect(readResult.evidenceRefs).toEqual(expect.arrayContaining([
      second.mailId,
      "visual_frame:exact-second",
      "visual_evidence:exact-second",
    ]));
    expect(listStagePlayLiveSourceMailItems({ threadId }).map((item) => ({
      mailId: item.mailId,
      status: item.status,
    }))).toEqual([
      { mailId: first.mailId, status: "unread" },
      { mailId: second.mailId, status: "delivered_to_ask" },
    ]);
  });

  it("records a model decision as a receipt and re-arms for the next source update", () => {
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
      voiceAllowedNow: true,
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

  it("includes voice policy in mail reads and suppresses voice options when disabled", () => {
    seedVisualEvidence();
    const readResult = readLiveSourceMailForAsk({
      threadId,
      roomId,
      sourceId,
      limit: 1,
      voicePolicy: {
        voiceEnabled: false,
        requiresConfirmation: false,
        allowedNow: false,
        reason: "operator_disabled_voice",
      },
    });

    expect(readResult.voicePolicy).toEqual({
      voiceEnabled: false,
      requiresConfirmation: false,
      allowedNow: false,
      reason: "operator_disabled_voice",
    });
    expect(readResult.suggestedDecisionOptions).not.toContain("request_voice_callout");
  });

  it("downgrades disabled voice callout requests to text drafts and blocks voice tools", () => {
    seedVisualEvidence();
    const readResult = readLiveSourceMailForAsk({ threadId, roomId, sourceId, limit: 1 });
    const mailId = readResult.items[0].mailId;

    const decision = recordLiveSourceMailDecisionForAsk({
      threadId,
      roomId,
      mailIds: [mailId],
      decision: "request_voice_callout",
      rationalePreview: "Risk appeared, but voice output is disabled.",
      voiceCalloutDraft: "Hostile mob appeared near the player.",
      voiceEnabled: false,
      voiceRequiresConfirmation: false,
      voiceAllowedNow: false,
      voicePolicyReason: "voice_disabled",
      requestedTool: {
        toolName: "situation-room-pipelines.voice_delivery.confirm_speak",
        args: { text: "Hostile mob appeared near the player." },
      },
      evidenceRefs: readResult.evidenceRefs,
      now: "2026-06-04T12:00:02.100Z",
    });

    expect(decision.voicePolicy).toMatchObject({
      voiceEnabled: false,
      allowedNow: false,
      reason: "voice_disabled",
    });
    expect(decision.voiceCalloutDraft).toBeNull();
    expect(decision.textAnswerDraft).toMatchObject({
      text: "Hostile mob appeared near the player.",
      terminalEligible: false,
    });
    expect(decision.requestedTool).toBeNull();
    const rows = buildMailLoopTranscriptRows({ decision });
    expect(rows.map((row) => row.rowKind)).toContain("text_answer");
    expect(rows.map((row) => row.rowKind)).not.toContain("voice_callout_request");
    expect(rows.map((row) => row.rowKind)).not.toContain("voice_tool_call");
  });

  it("keeps confirmation-required voice callouts as drafts and blocks voice tools", () => {
    seedVisualEvidence();
    const readResult = readLiveSourceMailForAsk({ threadId, roomId, sourceId, limit: 1 });
    const mailId = readResult.items[0].mailId;

    const decision = recordLiveSourceMailDecisionForAsk({
      threadId,
      roomId,
      mailIds: [mailId],
      decision: "request_voice_callout",
      rationalePreview: "Risk appeared, but voice output requires confirmation.",
      voiceCalloutDraft: "Hostile mob appeared near the player.",
      voiceEnabled: true,
      voiceRequiresConfirmation: true,
      voiceAllowedNow: false,
      voicePolicyReason: "voice_requires_confirmation",
      requestedTool: {
        toolName: "situation-room-pipelines.voice_delivery.confirm_speak",
        args: { text: "Hostile mob appeared near the player." },
      },
      evidenceRefs: readResult.evidenceRefs,
      now: "2026-06-04T12:00:02.200Z",
    });

    expect(decision.voicePolicy).toMatchObject({
      voiceEnabled: true,
      requiresConfirmation: true,
      allowedNow: false,
      reason: "voice_requires_confirmation",
    });
    expect(decision.voiceCalloutDraft).toMatchObject({
      text: "Hostile mob appeared near the player.",
      voiceEligible: false,
      requiresConfirmation: true,
    });
    expect(decision.requestedTool).toBeNull();
    const rows = buildMailLoopTranscriptRows({ decision });
    expect(rows.map((row) => row.rowKind)).toContain("voice_callout_request");
    expect(rows.map((row) => row.rowKind)).not.toContain("voice_tool_call");
  });

  it("allows a separate voice tool request only after an allowed voice decision", () => {
    seedVisualEvidence();
    const readResult = readLiveSourceMailForAsk({ threadId, roomId, sourceId, limit: 1 });
    const mailId = readResult.items[0].mailId;

    const decision = recordLiveSourceMailDecisionForAsk({
      threadId,
      roomId,
      mailIds: [mailId],
      decision: "request_voice_callout",
      rationalePreview: "New risk appeared and voice policy allows a callout now.",
      voiceCalloutDraft: "Hostile mob appeared near the player.",
      voiceEnabled: true,
      voiceRequiresConfirmation: false,
      voiceAllowedNow: true,
      requestedTool: {
        toolName: "situation-room-pipelines.voice_delivery.confirm_speak",
        args: { text: "Hostile mob appeared near the player." },
      },
      evidenceRefs: readResult.evidenceRefs,
      now: "2026-06-04T12:00:02.300Z",
    });

    expect(decision.voicePolicy).toMatchObject({
      voiceEnabled: true,
      requiresConfirmation: false,
      allowedNow: true,
    });
    expect(decision.voiceCalloutDraft).toMatchObject({
      voiceEligible: true,
      requiresConfirmation: false,
    });
    expect(decision.requestedTool).toMatchObject({
      toolName: "situation-room-pipelines.voice_delivery.confirm_speak",
    });
    const rows = buildMailLoopTranscriptRows({ decision });
    expect(rows.map((row) => row.rowKind)).toEqual(expect.arrayContaining([
      "voice_callout_request",
      "voice_tool_call",
    ]));
    expect(rows.find((row) => row.rowKind === "voice_tool_call")?.terminalEligible).toBe(false);
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

  it("does not re-deliver a visual summary mail item after a decision is recorded", () => {
    seedVisualEvidence();
    const firstRead = readLiveSourceMailForAsk({
      threadId,
      roomId,
      sourceId,
      limit: 1,
      now: "2026-06-04T12:00:13.000Z",
    });
    const mailId = firstRead.items[0].mailId;

    const decision = recordLiveSourceMailDecisionForAsk({
      threadId,
      roomId,
      mailIds: [mailId],
      decision: "wait_for_next_summary",
      rationalePreview: "No high-salience change yet; wait for the next interval summary.",
      evidenceRefs: firstRead.evidenceRefs,
      now: "2026-06-04T12:00:14.000Z",
    });

    const secondRead = readLiveSourceMailForAsk({
      threadId,
      roomId,
      sourceId,
      limit: 1,
      now: "2026-06-04T12:00:15.000Z",
    });

    expect(secondRead.items).toEqual([]);
    expect(secondRead.priorDecisionRefs).toContain(decision.decisionId);
    expect(listStagePlayLiveSourceMailItems({ threadId, status: "decision_recorded" }).map((item) => item.mailId)).toEqual([
      mailId,
    ]);
    expect(listStagePlayMailDecisions({ threadId, mailId })).toHaveLength(1);
    expect(listStagePlayLiveSourceJobStates({ threadId })[0]).toMatchObject({
      status: "armed",
      mailboxCursor: mailId,
      lastDecisionId: decision.decisionId,
      nextLoopState: "armed_for_next_summary",
    });
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
    expect(listStagePlayLiveSourceMailWakeRequests({ threadId })).toHaveLength(2);
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

  it("does not queue a wake for a paused live-source job", () => {
    const mail = enqueueStagePlayLiveSourceMailItem({
      threadId,
      roomId,
      sourceId,
      sourceKind: "visual_frame",
      frameRef: "visual_frame:paused",
      evidenceRef: "visual_evidence:paused",
      summaryText: "Paused source summary.",
      createdAt: "2026-06-04T12:00:16.000Z",
    });
    upsertStagePlayLiveSourceJobState({
      threadId,
      roomId,
      sourceIds: [sourceId],
      status: "paused",
      lastMailId: mail.mailId,
      nextLoopState: "paused_by_user",
      updatedAt: "2026-06-04T12:00:16.500Z",
    });

    const wake = queueMailWakeForUnreadItems({
      threadId,
      roomId,
      sourceId,
      now: "2026-06-04T12:00:17.000Z",
    });

    expect(wake).toBeNull();
  });

  it("runs the next queued wake through the Ask turn runner and records completion", async () => {
    seedVisualEvidence();
    const wake = listStagePlayLiveSourceMailWakeRequests({ threadId })[0];
    expect(wake).toMatchObject({ status: "queued" });

    const result = await runNextMailWakeRequest({
      threadId,
      roomId,
      askTurnRunner: async ({ wakeRequest }) => ({
        turn_id: "ask:wake-test",
        current_turn_artifact_ledger: [
          {
            kind: "live_environment_tool_observation",
            payload: {
              tool_name: "live_env.record_live_source_mail_decision",
              observation: {
                artifactId: "stage_play_live_source_mail_decision",
                decisionId: "stage_play_live_source_mail_decision:wake-test",
              },
            },
          },
        ],
        wakeRequestId: wakeRequest.wakeRequestId,
      }),
    });

    expect(result).toMatchObject({
      artifactId: "stage_play_live_source_mail_wake_result",
      status: "completed",
      askTurnId: "ask:wake-test",
      decisionIds: ["stage_play_live_source_mail_decision:wake-test"],
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
    expect(listStagePlayLiveSourceMailWakeRequests({ threadId })[0]).toMatchObject({
      status: "completed",
      askTurnId: "ask:wake-test",
      decisionIds: ["stage_play_live_source_mail_decision:wake-test"],
    });
  });

  it("does not complete a wake from a generic agent-step decision without a mail decision receipt", async () => {
    seedVisualEvidence();

    const result = await runNextMailWakeRequest({
      threadId,
      roomId,
      askTurnRunner: async () => ({
        turn_id: "ask:wake-missing-mail-decision",
        current_turn_artifact_ledger: [
          {
            kind: "agent_step_decision",
            payload: {
              decision_id: "ask:wake-missing-mail-decision:agent_step_decision",
              chosen_capability: "model.direct_answer",
            },
          },
        ],
      }),
    });

    expect(result).toMatchObject({
      artifactId: "stage_play_live_source_mail_wake_result",
      status: "failed_terminal",
      askTurnId: "ask:wake-missing-mail-decision",
      failedReason: "mail_wake_decision_missing",
      decisionIds: [],
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
    expect(listStagePlayLiveSourceMailWakeRequests({ threadId })[0]).toMatchObject({
      status: "failed_terminal",
      decisionIds: [],
    });
  });

  it("defers 503 wake failures for retry without recording a mail decision", async () => {
    seedVisualEvidence();

    const result = await runNextMailWakeRequest({
      threadId,
      roomId,
      now: "2026-06-04T12:01:00.000Z",
      askTurnRunner: async () => {
        throw new Error("mail_wake_ask_turn_failed:503");
      },
    });

    expect(result).toMatchObject({
      status: "deferred_for_pressure",
      failedReason: "ask_turn_pressure_503",
      decisionIds: [],
    });
    const wake = listStagePlayLiveSourceMailWakeRequests({ threadId })[0];
    expect(wake).toMatchObject({
      status: "deferred_for_pressure",
      attemptCount: 1,
      lastAttemptAt: "2026-06-04T12:01:00.000Z",
      nextRetryAt: "2026-06-04T12:01:15.000Z",
      failureReason: "ask_turn_pressure_503",
    });
    expect(listStagePlayLiveSourceMailItems({ threadId })[0].status).toBe("unread");
    expect(listStagePlayMailDecisions({ threadId })).toHaveLength(0);
  });

  it("runs a retryable pressure wake after nextRetryAt while preserving exact mail ids", async () => {
    seedVisualEvidence();
    await runNextMailWakeRequest({
      threadId,
      roomId,
      now: "2026-06-04T12:01:00.000Z",
      askTurnRunner: async () => {
        throw new Error("mail_wake_ask_turn_failed:503");
      },
    });
    const mailId = listStagePlayLiveSourceMailItems({ threadId })[0].mailId;

    const early = await runNextMailWakeRequest({
      threadId,
      roomId,
      now: "2026-06-04T12:01:10.000Z",
      askTurnRunner: async () => {
        throw new Error("should_not_run_before_retry");
      },
    });
    expect(early).toBeNull();

    const result = await runNextMailWakeRequest({
      threadId,
      roomId,
      now: "2026-06-04T12:01:15.000Z",
      askTurnRunner: async ({ wakeRequest }) => ({
        turn_id: "ask:wake-retry",
        current_turn_artifact_ledger: [
          {
            kind: "live_environment_tool_observation",
            payload: {
              tool_name: "live_env.record_live_source_mail_decision",
              observation: {
                artifactId: "stage_play_live_source_mail_decision",
                decisionId: "stage_play_live_source_mail_decision:wake-retry",
                mailIds: wakeRequest.mailIds,
              },
            },
          },
        ],
      }),
    });

    expect(result).toMatchObject({
      status: "completed",
      askTurnId: "ask:wake-retry",
      decisionIds: ["stage_play_live_source_mail_decision:wake-retry"],
    });
    expect(listStagePlayLiveSourceMailWakeRequests({ threadId })[0]).toMatchObject({
      status: "completed",
      attemptCount: 2,
      mailIds: [mailId],
      nextRetryAt: null,
    });
  });

  it("blocks later wakes while a non-stale wake is running", async () => {
    enqueueStagePlayLiveSourceMailItem({
      threadId,
      roomId,
      sourceId,
      sourceKind: "visual_frame",
      frameRef: "visual_frame:block-first",
      evidenceRef: "visual_evidence:block-first",
      summaryText: "First summary.",
      createdAt: "2026-06-04T12:02:00.000Z",
    });
    enqueueStagePlayLiveSourceMailItem({
      threadId,
      roomId,
      sourceId,
      sourceKind: "visual_frame",
      frameRef: "visual_frame:block-second",
      evidenceRef: "visual_evidence:block-second",
      summaryText: "Second summary.",
      createdAt: "2026-06-04T12:02:01.000Z",
    });
    const first = listStagePlayLiveSourceMailWakeRequests({ threadId })[0];
    markStagePlayMailWakeRunning(first.wakeRequestId, "2026-06-04T12:02:02.000Z");
    const skipped = await runNextMailWakeRequest({
      threadId,
      roomId,
      now: "2026-06-04T12:02:10.000Z",
      askTurnRunner: async () => {
        throw new Error("should_not_run_while_prior_running");
      },
    });

    expect(skipped).toBeNull();
    expect(listStagePlayLiveSourceMailWakeRequests({ threadId, mailId: first.mailIds[0] })[0]).toMatchObject({
      status: "running",
      attemptCount: 1,
    });
  });

  it("recovers a stale running wake into retryable state", async () => {
    seedVisualEvidence();
    const wake = listStagePlayLiveSourceMailWakeRequests({ threadId })[0];
    markStagePlayMailWakeRunning(wake.wakeRequestId, "2026-06-04T12:03:00.000Z");

    const retry = await runNextMailWakeRequest({
      threadId,
      roomId,
      now: "2026-06-04T12:04:31.000Z",
      askTurnRunner: async () => ({
        turn_id: "ask:wake-stale-retry",
        current_turn_artifact_ledger: [
          {
            kind: "live_environment_tool_observation",
            payload: {
              tool_name: "live_env.record_live_source_mail_decision",
              observation: {
                artifactId: "stage_play_live_source_mail_decision",
                decisionId: "stage_play_live_source_mail_decision:wake-stale-retry",
              },
            },
          },
        ],
      }),
    });

    expect(retry).toMatchObject({
      status: "completed",
      askTurnId: "ask:wake-stale-retry",
    });
    expect(listStagePlayLiveSourceMailWakeRequests({ threadId })[0]).toMatchObject({
      status: "completed",
      attemptCount: 2,
    });
  });
});
