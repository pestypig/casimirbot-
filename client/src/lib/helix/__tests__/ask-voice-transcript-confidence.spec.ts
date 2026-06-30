import { describe, expect, it } from "vitest";

import {
  VOICE_STT_CONFIRM_THRESHOLD,
  deriveTranscriptConfidence,
  shouldRequireTranscriptConfirmation,
} from "@/lib/helix/ask-voice-transcript-confidence";

describe("ask-voice-transcript-confidence", () => {
  it("prefers finite provider confidence and clamps it into range", () => {
    expect(deriveTranscriptConfidence({
      transcript: "ignored",
      providerConfidence: 1.5,
      segments: [{ confidence: 0.2 }],
    })).toEqual({ confidence: 1, reason: "provider_reported" });
  });

  it("averages finite segment confidence when provider confidence is absent", () => {
    expect(deriveTranscriptConfidence({
      transcript: "ignored",
      providerConfidence: null,
      segments: [{ confidence: 0.25 }, { confidence: 0.75 }, { confidence: Number.NaN }],
    })).toEqual({ confidence: 0.5, reason: "segment_average" });
  });

  it("scores text quality heuristically when structured confidence is unavailable", () => {
    expect(deriveTranscriptConfidence({
      transcript: "",
      providerConfidence: null,
      segments: [],
    })).toEqual({ confidence: 0, reason: "empty_text" });
    expect(deriveTranscriptConfidence({
      transcript: "Explain the Casimir effect in one sentence.",
      providerConfidence: null,
      segments: [],
    })).toMatchObject({
      reason: "heuristic_text_quality",
    });
  });

  it("requires confirmation for provider, translation, or threshold risk", () => {
    expect(VOICE_STT_CONFIRM_THRESHOLD).toBe(0.58);
    expect(shouldRequireTranscriptConfirmation({
      confidence: 0.91,
      translationUncertain: false,
    })).toBe(false);
    expect(shouldRequireTranscriptConfirmation({
      confidence: 0.34,
      translationUncertain: false,
    })).toBe(true);
    expect(shouldRequireTranscriptConfirmation({
      confidence: 0.92,
      translationUncertain: true,
    })).toBe(true);
    expect(shouldRequireTranscriptConfirmation({
      confidence: 0.92,
      translationUncertain: false,
      providerNeedsConfirmation: true,
    })).toBe(true);
  });
});
