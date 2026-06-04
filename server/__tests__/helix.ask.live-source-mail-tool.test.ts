import { beforeEach, describe, expect, it } from "vitest";
import { executeLiveEnvironmentTool } from "../services/helix-ask/live-environment-tool-adapter";
import { buildLiveEnvironmentRuntimePacket } from "../services/situation-room/live-environment-runtime-packet-builder";
import {
  analyzeVisualFrame,
  recordVisualFrame,
  resetVisualSnapshotStoreForTest,
  startVisualSnapshotSource,
} from "../services/situation-room/visual-snapshot-store";
import { resetStagePlayLiveSourceMailboxForTest } from "../services/stage-play/stage-play-live-source-mailbox-store";

const threadId = "thread:helix-ask-live-source-mail-tool";
const roomId = "room:helix-ask-live-source-mail-tool";
const sourceId = "visual_source:helix-ask-live-source-mail-tool";

beforeEach(() => {
  resetStagePlayLiveSourceMailboxForTest();
  resetVisualSnapshotStoreForTest();
});

const seedVisualSummary = () => {
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
    frame_id: "visual_frame:helix-ask-live-source-mail-tool",
    ts: "2026-06-04T12:10:00.000Z",
  });
  analyzeVisualFrame({
    thread_id: threadId,
    frame_id: frame.frame_id,
    evidence_id: "visual_evidence:helix-ask-live-source-mail-tool",
    summary: "Minecraft-like scene with a player, cat, book stand, and distant mountains.",
    supports_claims: [
      {
        claim: "The active visual source has compact evidence.",
        support_status: "supports",
        confidence: 0.78,
      },
    ],
  });
};

describe("live-source mail live environment tools", () => {
  it("advertises live-source mail tools as automatic evidence-only capabilities", () => {
    const packet = buildLiveEnvironmentRuntimePacket({
      threadId,
      roomId,
      now: "2026-06-04T12:10:01.000Z",
    });

    expect(packet.available_tools).toEqual(expect.arrayContaining([
      expect.objectContaining({
        tool_id: "live_env.check_live_source_mail",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.read_live_source_mail",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.record_live_source_mail_decision",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
    ]));
  });

  it.each(["live_env.check_live_source_mail", "live_env.read_live_source_mail"] as const)(
    "reads latest visual summary mail as evidence through %s and requires a follow-up model decision",
    (toolName) => {
    seedVisualSummary();

    const observation = executeLiveEnvironmentTool({
      tool_name: toolName,
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
      },
    });

    expect(observation).toMatchObject({
      schema: "helix.live_environment_tool_observation.v1",
      tool_name: toolName,
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      instruction_authority: "none",
      ask_instruction_authority: "none",
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(observation.summary).toBe("Read 1 unread live-source mail item(s); decision required.");
    const payload = observation.observation as any;
    expect(payload).toMatchObject({
      artifactId: "stage_play_live_source_mail_read_result",
      items: [
        expect.objectContaining({
          sourceId,
          sourceRefs: expect.objectContaining({
            frameRef: "visual_frame:helix-ask-live-source-mail-tool",
            evidenceRef: "visual_evidence:helix-ask-live-source-mail-tool",
          }),
          assistant_answer: false,
          terminal_eligible: false,
        }),
      ],
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "tool_evidence",
    });
    expect(payload.transcriptRows.map((row: any) => row.rowKind)).toEqual(expect.arrayContaining([
      "mail_read_tool_call",
      "mail_read_receipt",
    ]));
    expect(observation.evidence_refs).toEqual(expect.arrayContaining([
      sourceId,
      "visual_frame:helix-ask-live-source-mail-tool",
      "visual_evidence:helix-ask-live-source-mail-tool",
    ]));
  });

  it("records the model decision as evidence and keeps text/voice drafts non-terminal", () => {
    seedVisualSummary();
    const readObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.check_live_source_mail",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
      },
    });
    const mailId = (readObservation.observation as any).items[0].mailId;

    const decisionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.record_live_source_mail_decision",
      thread_id: threadId,
      args: {
        room_id: roomId,
        mail_ids: [mailId],
        decision: "draft_text_answer",
        rationale_preview: "The compact summary is enough to draft a visible text update.",
        text_answer_draft: "The active visual source shows a Minecraft-like scene with a player and cat.",
        text_answer_terminal_eligible: false,
      },
    });

    expect(decisionObservation).toMatchObject({
      tool_name: "live_env.record_live_source_mail_decision",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    const payload = decisionObservation.observation as any;
    expect(payload).toMatchObject({
      artifactId: "stage_play_live_source_mail_decision",
      decision: "draft_text_answer",
      nextLoopState: "armed_for_next_summary",
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "tool_evidence",
    });
    expect(payload.textAnswerDraft).toMatchObject({
      terminalEligible: false,
    });
    expect(payload.transcriptRows.map((row: any) => row.rowKind)).toEqual(expect.arrayContaining([
      "agent_decision",
      "text_answer",
      "loop_state",
    ]));
    expect(payload.transcriptRows.find((row: any) => row.rowKind === "text_answer").terminalEligible).toBe(false);
  });

  it("records requested_tool from the decision tool as the next requested action", () => {
    seedVisualSummary();
    const readObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.read_live_source_mail",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
      },
    });
    const mailId = (readObservation.observation as any).items[0].mailId;

    const decisionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.record_live_source_mail_decision",
      thread_id: threadId,
      args: {
        room_id: roomId,
        mail_ids: [mailId],
        decision: "request_more_evidence",
        rationale_preview: "Need the next compact visual summary before answering.",
        requested_tool: {
          tool_name: "live_env.read_live_source_mail",
          args: {
            source_kind: "visual_frame",
            limit: 1,
          },
        },
      },
    });

    const payload = decisionObservation.observation as any;
    expect(payload.requestedTool).toEqual({
      toolName: "live_env.read_live_source_mail",
      args: {
        source_kind: "visual_frame",
        limit: 1,
      },
    });
    expect(payload.transcriptRows.map((row: any) => row.rowKind)).toEqual(expect.arrayContaining([
      "agent_decision",
      "requested_tool",
      "loop_state",
    ]));
    expect(payload.transcriptRows.find((row: any) => row.rowKind === "requested_tool").terminalEligible).toBe(false);
  });
});
