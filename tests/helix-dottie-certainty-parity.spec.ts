import { describe, expect, it } from "vitest";
import {
  deriveCalloutSuppressionReason,
  isVoiceCertaintyAllowed,
} from "../shared/helix-dottie-callout-contract";


describe("certainty parity and evidence suppression", () => {
  it("enforces voice certainty no stronger than text certainty", () => {
    expect(isVoiceCertaintyAllowed("reasoned", "confirmed")).toBe(false);
    expect(isVoiceCertaintyAllowed("reasoned", "reasoned")).toBe(true);
    expect(isVoiceCertaintyAllowed("confirmed", "reasoned")).toBe(true);
  });

  it("suppresses repo-attributed callouts when evidence refs missing", () => {
    expect(
      deriveCalloutSuppressionReason({ deterministic: true, evidenceRefs: [] }),
    ).toBe("missing_evidence");
  });

  it("keeps suppression reason deterministic in replay", () => {
    const first = deriveCalloutSuppressionReason({
      deterministic: true,
      evidenceRefs: [],
    });
    const second = deriveCalloutSuppressionReason({
      deterministic: true,
      evidenceRefs: [],
    });
    expect(first).toBe(second);
  });
});
