import { describe, expect, it } from "vitest";
import {
  buildNhm2LayerStackEngineeringArchitectureLoop,
  isNhm2LayerStackEngineeringArchitectureLoop,
} from "../shared/contracts/nhm2-layer-stack-engineering-architecture-loop.v1";

const forbiddenPhrase = (...parts: string[]): RegExp => new RegExp(parts.join(""), "i");

describe("NHM2 layer stack engineering architecture loop", () => {
  const generatedAt = "2026-06-22T00:00:00.000Z";

  it("builds and validates an architecture-level engineering loop", () => {
    const loop = buildNhm2LayerStackEngineeringArchitectureLoop({ generatedAt });

    expect(isNhm2LayerStackEngineeringArchitectureLoop(loop)).toBe(true);
    expect(loop.contractVersion).toBe("nhm2_layer_stack_engineering_architecture_loop/v1");
    expect(loop.generatedAt).toBe(generatedAt);
    expect(loop.supportFractionSweepRef).toBe("nhm2_layer_stack_support_fraction_sweep/v1");
    expect(loop.scalarInputs.stackForceN).toBeCloseTo(1.41883842843e4, 5);
    expect(loop.scalarInputs.forceGradientNPerM).toBeCloseTo(7.09419214215e12, 5);
    expect(loop.claimBoundary.engineeringArchitectureLoopOnly).toBe(true);
    expect(loop.claimBoundary.supportArchitectureIsNotTensorAuthority).toBe(true);
  });

  it("separates load-bearing fraction from active area loss", () => {
    const loop = buildNhm2LayerStackEngineeringArchitectureLoop({ generatedAt });
    const topology = loop.candidates.find(
      (candidate) => candidate.architectureId === "topology_optimized_lattice_tin",
    );
    const membrane = loop.candidates.find(
      (candidate) => candidate.architectureId === "suspended_membrane_sin",
    );

    expect(topology?.loadBearingFraction).toBeGreaterThan(topology?.activeAreaLostFraction ?? 1);
    expect(topology?.sourceRetention).toBeCloseTo(0.7038, 6);
    expect(topology?.stressStatus).toBe("candidate_window");
    expect(topology?.pullInStatus).toBe("candidate_window");
    expect(topology?.goNoGoStatus).toBe("review");
    expect(topology?.blockers).toContain("support_drive_tensor_terms_missing");

    expect(membrane?.activeFraction).toBeCloseTo(0.97, 6);
    expect(membrane?.stressStatus).toBe("fail");
    expect(membrane?.goNoGoStatus).toBe("fail");
  });

  it("keeps the default loop from passing when receipts and tensor terms are missing", () => {
    const loop = buildNhm2LayerStackEngineeringArchitectureLoop({ generatedAt });

    expect(loop.summary.mechanicallyPromisingRows.length).toBeGreaterThan(0);
    expect(loop.summary.goNoGoRows).toEqual([]);
    expect(loop.summary.feasibleArchitectureWindowExists).toBe(false);
    expect(loop.summary.firstBlocker).toBe("material_coupon_receipt_missing");
    expect(loop.summary.rankedResearchGaps).toEqual(
      expect.arrayContaining([
        "material_coupon_receipt_for_selected_support_material",
        "force_gap_curve_and_pull_in_margin_at_8nm",
        "support_drive_terms_in_full_apparatus_Tmunu",
      ]),
    );
  });

  it("requires all receipt surfaces before a candidate architecture window can open", () => {
    const partial = buildNhm2LayerStackEngineeringArchitectureLoop({
      generatedAt,
      materialReceiptsSupplied: true,
      roughnessAndPatchReceiptsSupplied: true,
      activeControlReceiptsSupplied: true,
    });
    const complete = buildNhm2LayerStackEngineeringArchitectureLoop({
      generatedAt,
      materialReceiptsSupplied: true,
      roughnessAndPatchReceiptsSupplied: true,
      activeControlReceiptsSupplied: true,
      supportDriveTensorTermsSupplied: true,
    });

    expect(partial.summary.feasibleArchitectureWindowExists).toBe(false);
    expect(partial.summary.firstBlocker).toBe("support_drive_tensor_terms_missing");
    expect(complete.summary.feasibleArchitectureWindowExists).toBe(true);
    expect(complete.summary.goNoGoRows.map((row) => row.architectureId)).toContain(
      "topology_optimized_lattice_tin",
    );
    expect(
      complete.summary.goNoGoRows.every((row) => row.goNoGoStatus === "candidate_window"),
    ).toBe(true);
  });

  it("keeps claim boundaries closed and avoids promotion language", () => {
    const loop = buildNhm2LayerStackEngineeringArchitectureLoop({ generatedAt });
    const text = JSON.stringify(loop);

    expect(loop.summary.physicalViabilityClaimAllowed).toBe(false);
    expect(loop.summary.transportClaimAllowed).toBe(false);
    expect(loop.summary.propulsionClaimAllowed).toBe(false);
    expect(loop.summary.speedAuthorityClaimAllowed).toBe(false);
    expect(loop.claimBoundary.routeEtaClaimAllowed).toBe(false);
    expect(text).not.toMatch(forbiddenPhrase("physical", " viability"));
    expect(text).not.toMatch(forbiddenPhrase("internal load", " thrust"));
    expect(text).not.toMatch(forbiddenPhrase("propulsion", " proof"));
    expect(text).not.toMatch(forbiddenPhrase("material", " evidence"));
  });
});
