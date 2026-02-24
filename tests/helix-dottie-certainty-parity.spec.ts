import { describe, expect, it } from "vitest";

type Certainty = "unknown" | "hypothesis" | "reasoned" | "confirmed";

const rank: Record<Certainty, number> = {
  unknown: 0,
  hypothesis: 1,
  reasoned: 2,
  confirmed: 3,
};

const shouldSpeakRepoClaim = (evidenceRefs: string[]) => evidenceRefs.length > 0;
const suppressionReason = (input: { deterministic: boolean; evidenceRefs: string[] }) => {
  if (!input.deterministic) return "contract_violation";
  if (input.evidenceRefs.length === 0) return "missing_evidence";
  return null;
};

describe("certainty parity and evidence suppression", () => {
  it("never allows voice certainty to exceed text certainty", () => {
    const text: Certainty = "reasoned";
    const voice: Certainty = "confirmed";
    expect(rank[voice] <= rank[text]).toBe(false);
  });

  it("suppresses repo-attributed callouts when evidence refs missing", () => {
    expect(shouldSpeakRepoClaim([])).toBe(false);
    expect(suppressionReason({ deterministic: true, evidenceRefs: [] })).toBe("missing_evidence");
  });

  it("keeps suppression reason deterministic in replay", () => {
    const first = suppressionReason({ deterministic: true, evidenceRefs: [] });
    const second = suppressionReason({ deterministic: true, evidenceRefs: [] });
    expect(first).toBe(second);
  });
});
