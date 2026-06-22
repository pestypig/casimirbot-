import { describe, expect, it } from "vitest";
import {
  buildNhm2LayerStackFullApparatusReceiptLoop,
  isNhm2LayerStackFullApparatusReceiptLoop,
} from "../shared/contracts/nhm2-layer-stack-full-apparatus-receipt-loop.v1";

const allReceipts = {
  material_coupon: true,
  force_gap_pull_in: true,
  roughness_patch_metrology: true,
  active_control_energy: true,
  fatigue_lifetime: true,
  layer_scaling: true,
  full_apparatus_tensor: true,
} as const;

const fullTensorCoverage = {
  supportStructureStressEnergy: true,
  spacerContactStressEnergy: true,
  activeControlFieldEnergy: true,
  thermalLoadStressEnergy: true,
  patchPotentialElectrostaticStress: true,
  fatigueDamageEvolution: true,
  layerScalingCrossTerms: true,
} as const;

const forbiddenPhrase = (...parts: string[]): RegExp => new RegExp(parts.join(""), "i");

describe("NHM2 layer stack full-apparatus receipt loop", () => {
  const generatedAt = "2026-06-22T00:00:00.000Z";

  it("builds and validates a receipt loop over architecture candidates", () => {
    const loop = buildNhm2LayerStackFullApparatusReceiptLoop({ generatedAt });

    expect(isNhm2LayerStackFullApparatusReceiptLoop(loop)).toBe(true);
    expect(loop.contractVersion).toBe("nhm2_layer_stack_full_apparatus_receipt_loop/v1");
    expect(loop.generatedAt).toBe(generatedAt);
    expect(loop.architectureLoopRef).toBe("nhm2_layer_stack_engineering_architecture_loop/v1");
    expect(loop.receiptPolicy.requiredReceiptSurfaces).toEqual([
      "material_coupon",
      "force_gap_pull_in",
      "roughness_patch_metrology",
      "active_control_energy",
      "fatigue_lifetime",
      "layer_scaling",
      "full_apparatus_tensor",
    ]);
    expect(loop.receiptPolicy.idealScalarCasimirIsMaterialReceipt).toBe(false);
    expect(loop.summary.receiptedCandidateRows).toEqual([]);
  });

  it("keeps rows review or fail when receipt surfaces are missing", () => {
    const loop = buildNhm2LayerStackFullApparatusReceiptLoop({ generatedAt });
    const topology = loop.rows.find(
      (row) => row.architectureId === "topology_optimized_lattice_tin",
    );

    expect(loop.summary.firstBlocker).toBe("material_coupon_receipt_missing");
    expect(topology?.engineeringCandidateStatus).toBe("review");
    expect(topology?.firstBlocker).toBe("material_coupon_receipt_missing");
    expect(topology?.receiptSurfaces.every((surface) => surface.status === "missing")).toBe(true);
    expect(topology?.sourceTensorAuthorityAllowed).toBe(false);
  });

  it("moves the blocker to full apparatus tensor coverage when receipts exist but tensor terms are incomplete", () => {
    const loop = buildNhm2LayerStackFullApparatusReceiptLoop({
      generatedAt,
      suppliedReceiptSurfaces: allReceipts,
      tensorTermCoverage: {
        supportStructureStressEnergy: true,
        spacerContactStressEnergy: true,
      },
    });
    const topology = loop.rows.find(
      (row) => row.architectureId === "topology_optimized_lattice_tin",
    );

    expect(topology?.firstBlocker).toBe("support_drive_terms_in_full_apparatus_Tmunu_missing");
    expect(topology?.engineeringCandidateStatus).toBe("review");
    expect(topology?.blockers).toContain("full_apparatus_tensor_term_coverage_incomplete");
    expect(loop.summary.receiptedCandidateRows).toEqual([]);
  });

  it("opens candidate rows only with all receipts and full tensor term coverage", () => {
    const loop = buildNhm2LayerStackFullApparatusReceiptLoop({
      generatedAt,
      suppliedReceiptSurfaces: allReceipts,
      tensorTermCoverage: fullTensorCoverage,
    });

    expect(loop.summary.receiptedCandidateRows.length).toBeGreaterThan(0);
    expect(loop.summary.firstBlocker).toBe("none");
    expect(loop.summary.receiptedCandidateRows.map((row) => row.architectureId)).toContain(
      "topology_optimized_lattice_tin",
    );
    expect(
      loop.summary.receiptedCandidateRows.every(
        (row) => row.engineeringCandidateStatus === "candidate_window",
      ),
    ).toBe(true);
    expect(
      loop.summary.receiptedCandidateRows.every((row) => row.sourceTensorAuthorityAllowed === false),
    ).toBe(true);
  });

  it("ranks architecture rows by evidence readiness and retained source target", () => {
    const missing = buildNhm2LayerStackFullApparatusReceiptLoop({ generatedAt });
    const partial = buildNhm2LayerStackFullApparatusReceiptLoop({
      generatedAt,
      suppliedReceiptSurfaces: {
        material_coupon: true,
        force_gap_pull_in: true,
      },
      tensorTermCoverage: {
        supportStructureStressEnergy: true,
      },
    });

    expect(partial.summary.rankedRowsByEvidenceReadiness[0].evidenceReadinessScore).toBeGreaterThan(
      missing.summary.rankedRowsByEvidenceReadiness[0].evidenceReadinessScore,
    );
    expect(partial.summary.rankedResearchGaps).toEqual(
      expect.arrayContaining([
        "roughness_asperity_tail_and_patch_potential_map",
        "active_gap_control_energy_and_noise",
        "support_drive_terms_in_full_apparatus_Tmunu",
      ]),
    );
  });

  it("keeps claim boundaries closed and avoids promotion language", () => {
    const loop = buildNhm2LayerStackFullApparatusReceiptLoop({
      generatedAt,
      suppliedReceiptSurfaces: allReceipts,
      tensorTermCoverage: fullTensorCoverage,
    });
    const text = JSON.stringify(loop);

    expect(loop.summary.physicalViabilityClaimAllowed).toBe(false);
    expect(loop.summary.transportClaimAllowed).toBe(false);
    expect(loop.summary.propulsionClaimAllowed).toBe(false);
    expect(loop.summary.speedAuthorityClaimAllowed).toBe(false);
    expect(loop.claimBoundary.sourceTensorAuthorityAllowed).toBe(false);
    expect(text).not.toMatch(forbiddenPhrase("physical", " viability"));
    expect(text).not.toMatch(forbiddenPhrase("material", " source proof"));
    expect(text).not.toMatch(forbiddenPhrase("wall", " closure"));
    expect(text).not.toMatch(forbiddenPhrase("internal load", " thrust"));
  });
});
