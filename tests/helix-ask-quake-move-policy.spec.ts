import { describe, expect, it } from "vitest";
import { selectDeterministicMoveWithDebug } from "../server/services/helix-ask/quake-frame-loop";

describe("HELIX-PS3 quake-style weighted move policy", () => {
  it("returns deterministic debug fields", () => {
    const out = selectDeterministicMoveWithDebug({
      groundedness: 0.7,
      uncertainty: 0.2,
      safety: 0.2,
      coverage: 0.75,
      evidenceGain: 0.2,
      latencyCost: 0.3,
      risk: 0.2,
      budgetPressure: 0.1,
      profile: "balanced",
    });
    expect(typeof out.selectedMove).toBe("string");
    expect(Object.keys(out.moveScores).sort()).toEqual([
      "clarify",
      "direct_answer",
      "fail_closed",
      "relation_build",
      "retrieve_more",
    ]);
    expect(Array.isArray(out.rejectedMoves)).toBe(true);
    expect(typeof out.rejectReasons).toBe("object");
    expect(typeof out.budgetPressure).toBe("number");
    expect(typeof out.stopReason).toBe("string");
  });

  it("is deterministic across repeated calls", () => {
    const input = {
      groundedness: 0.45,
      uncertainty: 0.55,
      safety: 0.4,
      coverage: 0.4,
      evidenceGain: 0.6,
      latencyCost: 0.5,
      risk: 0.45,
      budgetPressure: 0.4,
      relationIntentActive: true,
      profile: "evidence_first" as const,
    };
    const a = selectDeterministicMoveWithDebug(input);
    const b = selectDeterministicMoveWithDebug(input);
    expect(a).toEqual(b);
  });
});
