import { describe, expect, it } from "vitest";
import {
  buildContextCapsuleCopyText,
  resolveContextCapsulePalette,
  stripContextCapsuleTokensFromText,
} from "@/lib/helix/ask-context-capsule-display";
import type { ContextCapsuleSummary } from "@shared/helix-context-capsule";
import type { ConvergenceStripState } from "@/lib/helix/reasoning-theater-convergence";

const baseState: ConvergenceStripState = {
  source: "none",
  proof: "unknown",
  maturity: "exploratory",
  phase: "idle",
  openWorldActive: false,
  caption: "Idle",
  deltaPct: 0,
};

describe("Helix Ask context capsule display", () => {
  it("strips inline context capsule tokens while preserving ordinary text", () => {
    expect(stripContextCapsuleTokensFromText("Use HXCAP-ABC123 for this turn")).toBe("Use for this turn");
    expect(stripContextCapsuleTokensFromText("  no capsule token  ")).toBe("no capsule token");
  });

  it("maps convergence source and proof to display palettes", () => {
    expect(resolveContextCapsulePalette({ ...baseState, proof: "fail_closed" })).toEqual({ r: 239, g: 68, b: 68 });
    expect(resolveContextCapsulePalette({ ...baseState, source: "open_world" })).toEqual({ r: 244, g: 114, b: 182 });
    expect(resolveContextCapsulePalette({ ...baseState, source: "atlas_exact" })).toEqual({ r: 34, g: 211, b: 238 });
    expect(resolveContextCapsulePalette({ ...baseState, source: "repo_exact" })).toEqual({ r: 56, g: 189, b: 248 });
    expect(resolveContextCapsulePalette(baseState)).toEqual({ r: 148, g: 163, b: 184 });
  });

  it("builds compact context capsule copy text from stamp and convergence summary", () => {
    const summary = {
      stamp: {
        finalBits: "111111111111111111111111111111",
        gridW: 10,
        gridH: 3,
      },
      commit: {
        proof_verdict: "PASS",
      },
      convergence: {
        source: "repo_exact",
      },
    } as ContextCapsuleSummary;

    expect(buildContextCapsuleCopyText(summary)).toBe(
      ["##########", "##########", "##########", "proof:PASS  src:repo_exact"].join("\n"),
    );
  });
});
