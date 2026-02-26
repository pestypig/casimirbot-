import { describe, expect, it } from "vitest";
import {
  OPERATOR_CALLOUT_V1_KIND,
  validateOperatorCalloutV1,
} from "../services/helix-ask/operator-contract-v1";

describe("validateOperatorCalloutV1", () => {
  it("passes a valid helix.operator_callout.v1 payload", () => {
    const result = validateOperatorCalloutV1({
      kind: OPERATOR_CALLOUT_V1_KIND,
      deterministic: true,
      suppressed: false,
      text: {
        certainty: "reasoned",
        message: "Text callout certainty is reasoned.",
      },
      voice: {
        certainty: "reasoned",
        message: "Voice mirrors text certainty.",
      },
    });

    expect(result.ok).toBe(true);
  });

  it("fails deterministically when required fields are missing", () => {
    const result = validateOperatorCalloutV1({
      kind: OPERATOR_CALLOUT_V1_KIND,
      suppressed: false,
      text: {
        certainty: "reasoned",
      },
      voice: {
        message: "missing certainty",
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected deterministic failure");
    }

    expect(result.errors).toEqual([
      {
        code: "MISSING_REQUIRED_FIELD",
        path: "deterministic",
        message: "deterministic must be a boolean",
      },
      {
        code: "MISSING_REQUIRED_FIELD",
        path: "voice.certainty",
        message: "voice.certainty must be one of unknown, hypothesis, reasoned, confirmed",
      },
      {
        code: "MISSING_REQUIRED_FIELD",
        path: "text.message",
        message: "text.message must be a non-empty string",
      },
    ]);
  });

  it("fails when voice certainty is stronger than text certainty", () => {
    const result = validateOperatorCalloutV1({
      kind: OPERATOR_CALLOUT_V1_KIND,
      deterministic: true,
      suppressed: false,
      text: {
        certainty: "hypothesis",
        message: "Text confidence is still exploratory.",
      },
      voice: {
        certainty: "confirmed",
        message: "Voice overstates certainty.",
      },
    });

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          code: "VOICE_CERTAINTY_EXCEEDS_TEXT",
          path: "voice.certainty",
          message: "voice certainty must not exceed text certainty",
        },
      ],
    });
  });

  it("fails suppressed payloads that omit suppression reason", () => {
    const result = validateOperatorCalloutV1({
      kind: OPERATOR_CALLOUT_V1_KIND,
      deterministic: true,
      suppressed: true,
      text: {
        certainty: "reasoned",
        message: "Suppressed callout payload.",
      },
      voice: {
        certainty: "reasoned",
        message: "Suppressed voice payload.",
      },
    });

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          code: "SUPPRESSION_REASON_REQUIRED",
          path: "suppression_reason",
          message: "suppression_reason must be a stable suppression reason when suppressed is true",
        },
      ],
    });
  });
});
