import { describe, expect, it } from "vitest";
import { calloutTemplateSchema, suppressionReasonSchema } from "../shared/helix-dottie-callout-contract";

describe("helix dottie callout contract", () => {
  it("accepts bounded canonical template payload", () => {
    const parsed = calloutTemplateSchema.parse({
      mode: "callout",
      what_changed: "Threat posture upgraded to warn.",
      why_it_matters: "Nearby plan execution may be delayed unless mitigated.",
      next_action: "Acknowledge and run verify lane now.",
      evidence_anchor: "docs/helix-ask-flow.md",
    });
    expect(parsed.mode).toBe("callout");
  });

  it("rejects missing evidence anchor", () => {
    const result = calloutTemplateSchema.safeParse({
      mode: "briefing",
      what_changed: "Action required.",
      why_it_matters: "Gate is red.",
      next_action: "Fix first hard fail.",
      evidence_anchor: "",
    });
    expect(result.success).toBe(false);
  });

  it("keeps suppression labels deterministic", () => {
    expect(suppressionReasonSchema.options).toContain("missing_evidence");
    expect(suppressionReasonSchema.options).toContain("agi_overload_admission_control");
  });
});
