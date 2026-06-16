import { describe, expect, it } from "vitest";
import {
  HELIX_INTERIM_VOICE_CALLOUT_RECEIPT_SCHEMA,
  HELIX_INTERIM_VOICE_CALLOUT_REQUEST_SCHEMA,
  type HelixInterimVoiceCalloutReceiptV1,
  type HelixInterimVoiceCalloutRequestV1,
  validateHelixInterimVoiceCalloutReceiptV1,
  validateHelixInterimVoiceCalloutRequestV1,
} from "../helix-interim-voice-callout.v1";

describe("helix interim voice callout contract", () => {
  const request: HelixInterimVoiceCalloutRequestV1 = {
    artifactId: "helix_interim_voice_callout_request",
    schemaVersion: HELIX_INTERIM_VOICE_CALLOUT_REQUEST_SCHEMA,
    requestId: "interim_voice_request:1",
    turnId: "turn:1",
    threadId: "thread:1",
    source: "ask_tool_loop",
    kind: "immediate_ack",
    text: "I am checking the live-source mail now.",
    maxChars: 96,
    timingHintMs: 750,
    voicePlaybackKind: "tool_receipt",
    authority: "provisional",
    requiresConfirmation: false,
    evidenceRefs: ["tool_call:1"],
    reasonCodes: ["tool_progress"],
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    instruction_authority: "none",
    context_role: "tool_evidence",
  };

  const receipt: HelixInterimVoiceCalloutReceiptV1 = {
    artifactId: "helix_interim_voice_callout_receipt",
    schemaVersion: HELIX_INTERIM_VOICE_CALLOUT_RECEIPT_SCHEMA,
    receiptId: "interim_voice_receipt:1",
    requestId: request.requestId,
    status: "awaiting_client_playback",
    delivery: {
      utteranceId: "utterance:1",
      provider: "helix_interim_voice_callout",
      message: "Accepted for client playback handoff.",
      playbackConfirmationRequired: true,
      playbackAuthority: "client_runtime_required",
      playbackStatus: "awaiting_client_receipt",
    },
    evidenceRefs: [request.requestId],
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "tool_evidence",
  };

  it("accepts evidence-only provisional requests and receipts", () => {
    expect(validateHelixInterimVoiceCalloutRequestV1(request)).toEqual([]);
    expect(validateHelixInterimVoiceCalloutReceiptV1(receipt)).toEqual([]);
  });

  it("accepts steering acknowledgements as provisional tool receipts", () => {
    expect(validateHelixInterimVoiceCalloutRequestV1({
      ...request,
      source: "voice_steering_queue",
      kind: "steering_ack",
      text: "I heard the correction. I'll apply it after this step.",
      maxChars: 96,
      evidenceRefs: ["helix_voice_steering_event:1", "helix_voice_steering_decision:1"],
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      instruction_authority: "none",
      context_role: "tool_evidence",
    })).toEqual([]);
  });

  it("accepts narrator callout kinds as provisional evidence", () => {
    expect(validateHelixInterimVoiceCalloutRequestV1({
      ...request,
      kind: "narrator_read",
      voicePlaybackKind: "narrator_read",
      text: "Narrator has a panel observation ready.",
      maxChars: 220,
    })).toEqual([]);
    expect(validateHelixInterimVoiceCalloutRequestV1({
      ...request,
      kind: "panel_narration",
      voicePlaybackKind: "panel_narration",
      text: "The current panel control is an observation-only action.",
      maxChars: 220,
    })).toEqual([]);
  });

  it("rejects out-of-range timing hints", () => {
    expect(validateHelixInterimVoiceCalloutRequestV1({
      ...request,
      timingHintMs: 5_001,
    })).toEqual(expect.arrayContaining([
      "timingHintMs must be between 0 and 5000",
    ]));
  });

  it("rejects assistant-answer authority on interim callouts", () => {
    expect(validateHelixInterimVoiceCalloutRequestV1({
      ...request,
      assistant_answer: true as false,
      terminal_eligible: true as false,
      authority: "final" as "provisional",
    })).toEqual(expect.arrayContaining([
      "authority must be provisional",
      "assistant_answer must be false",
      "terminal_eligible must be false",
    ]));
    expect(validateHelixInterimVoiceCalloutReceiptV1({
      ...receipt,
      assistant_answer: true as false,
      terminal_eligible: true as false,
    })).toEqual(expect.arrayContaining([
      "assistant_answer must be false",
      "terminal_eligible must be false",
    ]));
  });

  it("rejects client-confirmed playback without delivered status", () => {
    expect(validateHelixInterimVoiceCalloutReceiptV1({
      ...receipt,
      status: "awaiting_client_playback",
      delivery: {
        ...receipt.delivery,
        playbackStatus: "client_confirmed",
      },
    })).toEqual(expect.arrayContaining([
      "client_confirmed playback requires delivered status",
    ]));
  });
});
