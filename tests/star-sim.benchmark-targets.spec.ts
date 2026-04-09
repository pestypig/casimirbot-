import { describe, expect, it } from "vitest";
import { resolveBenchmarkTarget } from "../server/modules/starsim/benchmark-targets";

describe("star-sim benchmark target matching", () => {
  it("matches supported benchmark target deterministically by Gaia identifier", () => {
    const match = resolveBenchmarkTarget({
      request: {
        target: { name: "Any" },
      } as any,
      identifiersResolved: { gaia_dr3_source_id: "123456789012345678" },
    });
    expect(match.benchmark_target?.id).toBe("demo_solar_a");
    expect(match.benchmark_target_match_mode).toBe("matched_by_identifier");
    expect(match.benchmark_target_identity_basis).toBe("trusted_identifier");
  });

  it("does not infer unsupported target membership", () => {
    const match = resolveBenchmarkTarget({
      request: {
        target: { name: "Random Star" },
      } as any,
      identifiersResolved: { gaia_dr3_source_id: "000000000000000001" },
    });
    expect(match.benchmark_target).toBeNull();
    expect(match.benchmark_target_match_mode).toBe("no_match");
    expect(match.benchmark_target_identity_basis).toBe("none");
  });

  it("does not silently assign a wrong benchmark target when name conflicts with identifiers", () => {
    const match = resolveBenchmarkTarget({
      request: {
        target: { name: "Demo Solar A" },
      } as any,
      identifiersResolved: { gaia_dr3_source_id: "987654321098765432" },
    });
    expect(match.benchmark_target).toBeNull();
    expect(match.benchmark_target_match_mode).toBe("conflicted_name_vs_identifier");
    expect(match.benchmark_target_conflict_reason).toBe("name_identifier_disagreement_conflict_unresolved");
    expect(match.benchmark_target_identity_basis).toBe("conflicted_trusted_identifier_vs_name");
  });
});
