import { describe, expect, it } from "vitest";
import {
  HELIX_VOICE_STEERING_DECISION_SCHEMA,
  HELIX_VOICE_STEERING_EVENT_SCHEMA,
  type HelixVoiceSteeringDecisionV1,
  type HelixVoiceSteeringEventV1,
  validateHelixVoiceSteeringDecisionV1,
  validateHelixVoiceSteeringEventV1,
} from "../helix-voice-steering-event.v1";

describe("helix voice steering event contract", () => {
  const event: HelixVoiceSteeringEventV1 = {
    artifactId: "helix_voice_steering_event",
    schemaVersion: HELIX_VOICE_STEERING_EVENT_SCHEMA,
    steeringEventId: "helix_voice_steering_event:1",
    threadId: "thread:1",
    turnId: "ask:1",
    expectedTurnId: "ask:1",
    source: "voice_capture",
    transcriptText: "Actually use meters per second, not feet.",
    normalizedText: "actually use meters per second, not feet.",
    capturedAt: "2026-06-07T18:00:00.000Z",
    timing: "during_tool_call",
    classification: "correction",
    queueDecision: "queued_for_safe_boundary",
    target: "active_turn",
    confidence: "high",
    evidenceRefs: ["voice_transcript:1"],
    reasonCodes: ["unit_correction"],
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    instruction_authority: "none",
    ask_instruction_authority: "none",
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
  };

  const decision: HelixVoiceSteeringDecisionV1 = {
    artifactId: "helix_voice_steering_decision",
    schemaVersion: HELIX_VOICE_STEERING_DECISION_SCHEMA,
    decisionId: "helix_voice_steering_decision:1",
    steeringEventId: event.steeringEventId,
    threadId: event.threadId,
    turnId: event.turnId,
    decision: "steering_applied",
    appliedAtBoundary: "after_tool_result",
    modelVisibleSummary: "User corrected the unit: use meters per second, not feet.",
    newTurnCandidateText: null,
    interimVoiceCalloutRequestRef: null,
    evidenceRefs: [event.steeringEventId],
    reasonCodes: ["applied_after_tool_result"],
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    instruction_authority: "none",
    context_role: "tool_evidence",
  };

  it("accepts evidence-only voice steering events and decisions", () => {
    expect(validateHelixVoiceSteeringEventV1(event)).toEqual([]);
    expect(validateHelixVoiceSteeringDecisionV1(decision)).toEqual([]);
  });

  it("rejects assistant-answer and terminal authority on events", () => {
    expect(validateHelixVoiceSteeringEventV1({
      ...event,
      assistant_answer: true,
      terminal_eligible: true,
      raw_content_included: true,
      instruction_authority: "system",
      ask_instruction_authority: "system",
      ask_context_policy: "instruction",
    })).toEqual(expect.arrayContaining([
      "assistant_answer must be false",
      "terminal_eligible must be false",
      "raw_content_included must be false",
      "instruction_authority must be none",
      "ask_instruction_authority must be none",
      "ask_context_policy must be evidence_only",
    ]));
  });

  it("rejects assistant-answer and terminal authority on decisions", () => {
    expect(validateHelixVoiceSteeringDecisionV1({
      ...decision,
      assistant_answer: true,
      terminal_eligible: true,
      raw_content_included: true,
      instruction_authority: "system",
    })).toEqual(expect.arrayContaining([
      "assistant_answer must be false",
      "terminal_eligible must be false",
      "raw_content_included must be false",
      "instruction_authority must be none",
    ]));
  });

  it("rejects empty transcript text", () => {
    expect(validateHelixVoiceSteeringEventV1({
      ...event,
      transcriptText: " ",
    })).toEqual(expect.arrayContaining(["transcriptText is required"]));
  });

  it("rejects active-turn targeting without expectedTurnId", () => {
    expect(validateHelixVoiceSteeringEventV1({
      ...event,
      expectedTurnId: null,
      target: "active_turn",
    })).toEqual(expect.arrayContaining(["target active_turn requires expectedTurnId"]));
  });

  it("rejects ambient or off-topic steering applied to the next step", () => {
    expect(validateHelixVoiceSteeringEventV1({
      ...event,
      classification: "ambient",
      queueDecision: "applied_to_next_step",
      target: "next_solver_step",
    })).toEqual(expect.arrayContaining(["ambient cannot be applied_to_next_step"]));

    expect(validateHelixVoiceSteeringEventV1({
      ...event,
      classification: "off_topic_new_goal",
      queueDecision: "applied_to_next_step",
      target: "next_solver_step",
    })).toEqual(expect.arrayContaining(["off_topic_new_goal cannot be applied_to_next_step"]));
  });
});
