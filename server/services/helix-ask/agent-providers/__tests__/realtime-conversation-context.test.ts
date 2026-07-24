import { beforeEach, describe, expect, it } from "vitest";
import {
  resetStagePlayLiveSourceConversationStoreForTest,
} from "../../../stage-play/stage-play-live-source-conversation-store";
import {
  bridgeRealtimeTranscriptToStagePlay,
  resetRealtimeStagePlayAskHandoffsForTests,
} from "../../live-source/realtime-stage-play-handoff";
import { buildRealtimeTranscriptObservation } from "../../realtime-session/route-boundary";
import { resetRealtimeStagePlayContextPacksForTests } from "../../realtime-session/context-pack-store";
import { materializeRealtimeConversationContext } from "../realtime-conversation-context";

const bridgeTranscript = (input: {
  transcriptText: string;
  eventRef: string;
  nowMs: number;
}) => {
  const observation = buildRealtimeTranscriptObservation({
    realtimeSessionId: "realtime:context-continuity",
    nowMs: input.nowMs,
    body: {
      event_type: "transcript.final",
      event_ref: input.eventRef,
      transcript_text: input.transcriptText,
    },
  });
  expect(observation).not.toBeNull();
  return bridgeRealtimeTranscriptToStagePlay({
    realtimeSessionId: "realtime:context-continuity",
    threadId: "helix-ask:desktop",
    providerEventRef: input.eventRef,
    transcriptText: input.transcriptText,
    observation: observation!,
    selectedRuntimeAgentProvider: "codex",
    nowMs: input.nowMs,
  });
};

describe("Realtime conversation context materialization", () => {
  beforeEach(() => {
    resetStagePlayLiveSourceConversationStoreForTest();
    resetRealtimeStagePlayAskHandoffsForTests();
  });

  it("retains a prior subject for Codex while keeping raw conversation out of the handoff and audit", () => {
    const priorText = "Search the local Docs corpus for information about the Casimir effect.";
    bridgeTranscript({
      transcriptText: priorText,
      eventRef: "provider-event:casimir-subject",
      nowMs: 100,
    });
    const currentText = "So just ask it to look at the docs.";
    const current = bridgeTranscript({
      transcriptText: currentText,
      eventRef: "provider-event:casimir-followup",
      nowMs: 200,
    });

    const materialized = materializeRealtimeConversationContext({
      body: { route_metadata: current.route_metadata },
      question: currentText,
    });

    expect(materialized?.audit).toMatchObject({
      schema: "helix.realtime_conversation_context_materialization.v1",
      status: "materialized",
      handoff_id: current.handoff_id,
      context_pack_id: current.context_pack_id,
      context_hash: current.context_hash,
      current_stage_play_event_ref: current.stage_play_event_ref,
      current_transcript_hash_matches: true,
      current_transcript_char_count_matches: true,
      current_utterance_present_in_pack: true,
      prior_user_turn_count: 1,
      model_context_included: true,
      answer_authority: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(materialized?.audit.selected_prior_user_refs).not.toContain(
      current.stage_play_event_ref,
    );
    expect(materialized?.promptLines.join("\n")).toContain("Casimir effect");
    expect(materialized?.promptLines.join("\n")).toContain("prior_user_turns");
    expect(JSON.stringify(current)).not.toContain(priorText);
    expect(JSON.stringify(materialized?.audit)).not.toContain(priorText);
  });

  it("fails closed when the current question does not match the server-bound utterance", () => {
    const currentText = "Look in the docs for the Casimir effect.";
    const current = bridgeTranscript({
      transcriptText: currentText,
      eventRef: "provider-event:binding",
      nowMs: 300,
    });

    const materialized = materializeRealtimeConversationContext({
      body: { route_metadata: current.route_metadata },
      question: "Search the web instead.",
    });

    expect(materialized?.audit).toMatchObject({
      status: "utterance_binding_mismatch",
      current_transcript_hash_matches: false,
      model_context_included: false,
    });
    expect(materialized?.promptLines).toEqual([]);
  });

  it("fails closed when route metadata is rebound to a different context hash", () => {
    const currentText = "Look in the docs for the Casimir effect.";
    const current = bridgeTranscript({
      transcriptText: currentText,
      eventRef: "provider-event:context-hash",
      nowMs: 350,
    });

    const materialized = materializeRealtimeConversationContext({
      body: {
        route_metadata: {
          ...current.route_metadata,
          contextHash: "sha256:different-context",
        },
      },
      question: currentText,
    });

    expect(materialized?.audit).toMatchObject({
      status: "context_pack_invalid",
      model_context_included: false,
      answer_authority: false,
      terminal_eligible: false,
    });
    expect(materialized?.promptLines).toEqual([]);
  });

  it("reports an unavailable server context pack without treating route metadata as context", () => {
    const currentText = "Look in the docs for the Casimir effect.";
    const current = bridgeTranscript({
      transcriptText: currentText,
      eventRef: "provider-event:expired",
      nowMs: 400,
    });
    resetRealtimeStagePlayContextPacksForTests();

    const materialized = materializeRealtimeConversationContext({
      body: { route_metadata: current.route_metadata },
      question: currentText,
    });

    expect(materialized?.audit).toMatchObject({
      status: "context_pack_missing",
      model_context_included: false,
      answer_authority: false,
      terminal_eligible: false,
    });
    expect(materialized?.promptLines).toEqual([]);
  });
});
