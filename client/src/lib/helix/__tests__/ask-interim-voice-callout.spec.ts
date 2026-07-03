import { describe, expect, it } from "vitest";

import {
  buildInterimVoiceClientHandoffDebug,
  buildInterimVoiceReceiptPlaybackIntent,
  collectInterimVoiceCalloutPlaybackIntents,
} from "@/lib/helix/ask-interim-voice-callout";

function receiptArtifact(overrides: {
  kind?: string;
  status?: string;
  text?: string;
  turnId?: string;
  requestId?: string;
  receiptId?: string;
  utteranceId?: string;
  authority?: string;
  assistantAnswer?: boolean;
  terminalEligible?: boolean;
  rawContentIncluded?: boolean;
  voicePlaybackKind?: string;
} = {}) {
  const requestId = overrides.requestId ?? "request-1";
  const receiptId = overrides.receiptId ?? "receipt-1";
  return {
    schema: "helix.interim_voice_callout_tool_result.v1",
    request: {
      kind: overrides.kind ?? "tool_result",
      authority: overrides.authority ?? "provisional",
      text: overrides.text ?? "Calculator returned 72.",
      turnId: overrides.turnId ?? "turn-1",
      requestId,
      voicePlaybackKind: overrides.voicePlaybackKind,
      assistant_answer: overrides.assistantAnswer ?? false,
      terminal_eligible: overrides.terminalEligible ?? false,
      raw_content_included: overrides.rawContentIncluded ?? false,
    },
    receipt: {
      status: overrides.status ?? "queued",
      receiptId,
      delivery: overrides.utteranceId ? { utteranceId: overrides.utteranceId } : undefined,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
  };
}

describe("interim voice callout playback projection", () => {
  it("builds a provisional playback intent from a safe structured receipt", () => {
    const intent = buildInterimVoiceReceiptPlaybackIntent(receiptArtifact({
      utteranceId: "utterance-1",
    }));

    expect(intent).toMatchObject({
      kind: "tool_receipt",
      authority: "provisional",
      source: "agent_loop",
      turnKey: "turn-1",
      eventId: "receipt-1",
      requestId: "request-1",
      receiptId: "receipt-1",
      receiptKey: "utterance-1",
      calloutKind: "tool_result",
      interimVoiceRequestId: "request-1",
      interimVoiceReceiptId: "receipt-1",
      interimVoiceReceiptKey: "utterance-1",
      interimVoiceCalloutKind: "tool_result",
    });
  });

  it("rejects unsafe or unplayable receipts", () => {
    expect(buildInterimVoiceReceiptPlaybackIntent(receiptArtifact({
      assistantAnswer: true,
    }))).toBeNull();
    expect(buildInterimVoiceReceiptPlaybackIntent(receiptArtifact({
      authority: "final",
    }))).toBeNull();
    expect(buildInterimVoiceReceiptPlaybackIntent(receiptArtifact({
      status: "failed",
    }))).toBeNull();
    expect(buildInterimVoiceReceiptPlaybackIntent(receiptArtifact({
      kind: "final_answer",
    }))).toBeNull();
  });

  it("maps explicit relay and narration callouts to matching playback kinds", () => {
    expect(buildInterimVoiceReceiptPlaybackIntent(receiptArtifact({
      kind: "translation_relay",
    }))?.kind).toBe("translation_relay");
    expect(buildInterimVoiceReceiptPlaybackIntent(receiptArtifact({
      kind: "narrator_read",
    }))?.kind).toBe("narrator_read");
    expect(buildInterimVoiceReceiptPlaybackIntent(receiptArtifact({
      kind: "panel_narration",
    }))?.kind).toBe("panel_narration");
    expect(buildInterimVoiceReceiptPlaybackIntent(receiptArtifact({
      voicePlaybackKind: "translation_relay",
    }))?.kind).toBe("translation_relay");
  });

  it("collects nested receipts while suppressing already-spoken and duplicate intents", () => {
    const repeated = receiptArtifact({
      requestId: "request-repeat",
      receiptId: "receipt-repeat",
      utteranceId: "utterance-repeat",
    });
    const immediateAck = receiptArtifact({
      kind: "immediate_ack",
      turnId: "turn-ack",
      requestId: "request-ack",
      receiptId: "receipt-ack",
    });
    const fresh = receiptArtifact({
      requestId: "request-fresh",
      receiptId: "receipt-fresh",
    });

    const intents = collectInterimVoiceCalloutPlaybackIntents({
      artifacts: [{ nested: [repeated, repeated, immediateAck, fresh] }],
      spokenReceiptKeys: ["utterance-repeat"],
      spokenImmediateAckTurnKeys: ["turn-ack"],
    });

    expect(intents).toHaveLength(1);
    expect(intents[0]).toMatchObject({
      requestId: "request-fresh",
      receiptId: "receipt-fresh",
    });
  });

  it("builds governed client handoff debug without answer authority", () => {
    const intent = buildInterimVoiceReceiptPlaybackIntent(receiptArtifact({
      requestId: "request-debug",
      receiptId: "receipt-debug",
      utteranceId: "utterance-debug",
    }));

    expect(intent).not.toBeNull();
    expect(buildInterimVoiceClientHandoffDebug({
      intent: intent!,
      micArmState: "off",
      voiceMode: "companion",
      outputModeEnabled: true,
      allowMicOffPlayback: null,
    })).toEqual({
      schema: "helix.interim_voice_client_handoff_debug.v1",
      micArmState: "off",
      voiceMode: "companion",
      micArmed: false,
      outputModeEnabled: true,
      outputArmed: true,
      requestId: "request-debug",
      receiptId: "receipt-debug",
      receiptKey: "utterance-debug",
      calloutKind: "tool_result",
      playbackKind: "tool_receipt",
      allowMicOffPlayback: null,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  });
});
