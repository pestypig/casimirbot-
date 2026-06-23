import { describe, expect, it } from "vitest";
import {
  buildNhm2LayerStackMechanicalReceipt,
  isNhm2LayerStackMechanicalReceipt,
} from "../shared/contracts/nhm2-layer-stack-mechanical-receipt.v1";

const forbiddenPhrase = (...parts: string[]): RegExp => new RegExp(parts.join(""), "i");

describe("NHM2 layer stack mechanical receipt", () => {
  const generatedAt = "2026-06-21T00:00:00.000Z";

  it("builds and validates the diagnostic 447-layer mechanical receipt", () => {
    const receipt = buildNhm2LayerStackMechanicalReceipt({ generatedAt });

    expect(isNhm2LayerStackMechanicalReceipt(receipt)).toBe(true);
    expect(receipt.contractVersion).toBe("nhm2_layer_stack_mechanical_receipt/v1");
    expect(receipt.generatedAt).toBe(generatedAt);
    expect(receipt.claimBoundary.diagnosticOnly).toBe(true);
    expect(receipt.claimBoundary.mechanicalReceiptOnly).toBe(true);
    expect(receipt.claimBoundary.idealScalarLoadIsNotMaterialReceipt).toBe(true);
    expect(receipt.claimBoundary.internalLoadIsNotThrust).toBe(true);
  });

  it("computes the ideal scalar force and stress scale from repo target values", () => {
    const receipt = buildNhm2LayerStackMechanicalReceipt({ generatedAt });

    expect(receipt.inputGeometry.gapMeters.valueSI).toBe(8e-9);
    expect(receipt.inputGeometry.tileAreaMeters2.valueSI).toBe(1e-4);
    expect(receipt.inputGeometry.layerCount.valueSI).toBe(447);
    expect(receipt.inputGeometry.stackThicknessMeters.valueSI).toBeCloseTo(0.001344576, 12);
    expect(receipt.idealCasimirLoad.pressurePa.valueSI).toBeCloseTo(3.17413518664e5, 6);
    expect(receipt.idealCasimirLoad.forcePerTileN.valueSI).toBeCloseTo(31.7413518664, 9);
    expect(receipt.idealCasimirLoad.forcePer447LayerStackN.valueSI).toBeCloseTo(
      1.41883842843e4,
      5,
    );
    expect(receipt.idealCasimirLoad.effectiveStackPressurePa.valueSI).toBeCloseTo(
      1.41883842843e8,
      2,
    );
    expect(receipt.summary.forceScaleKilonewtons).toBeCloseTo(14.1883842843, 9);
    expect(receipt.summary.effectiveStackPressureMPa).toBeCloseTo(141.883842843, 6);
    expect(receipt.summary.stackThicknessMm).toBeCloseTo(1.344576, 9);
  });

  it("computes the support/source-retention overlap window for the TiN comparator", () => {
    const receipt = buildNhm2LayerStackMechanicalReceipt({ generatedAt });

    expect(receipt.supportWindow.materialPresetId).toBe(
      "ultra_high_stress_tin_literature_comparator",
    );
    expect(receipt.supportWindow.allowableStressPa).toBe(2.3e9);
    expect(receipt.supportWindow.safetyFactor).toBe(3);
    expect(receipt.supportWindow.designStressLimitPa).toBeCloseTo(7.66666666667e8, 2);
    expect(receipt.supportWindow.minimumSupportFractionForStress).toBeCloseTo(
      0.185065881969,
      12,
    );
    expect(receipt.supportWindow.maximumSupportFractionForSourceRetention).toBeCloseTo(
      0.0849673202614,
      12,
    );
    expect(receipt.supportWindow.minimumSupportAreaMeters2).toBeCloseTo(
      0.0000185065881969,
      16,
    );
    expect(receipt.supportWindow.maximumSupportAreaForRetentionMeters2).toBeCloseTo(
      0.00000849673202614,
      17,
    );
    expect(receipt.supportWindow.overlapMargin).toBeCloseTo(0.459119311228, 12);
    expect(receipt.summary.supportRetentionOverlapMargin).toBeCloseTo(0.459119311228, 12);
    expect(receipt.supportWindow.feasibleSupportRetentionWindow).toBe(false);
    expect(receipt.supportWindow.status).toBe("fail");
    expect(receipt.supportWindow.requiredSupportFractionReductionForOverlap).toBeCloseTo(
      0.100098561707,
      12,
    );
    expect(receipt.supportWindow.requiredSourceRetentionIncreaseForStressSupport).toBeCloseTo(
      0.0765753997062,
      12,
    );
    expect(receipt.supportWindow.blockers).toEqual(
      expect.arrayContaining([
        "support_retention_overlap_window_missing",
        "support_fraction_receipt_missing",
        "support_drive_tensor_terms_missing",
      ]),
    );
  });

  it("keeps mechanical survivability incomplete until real receipts exist", () => {
    const receipt = buildNhm2LayerStackMechanicalReceipt({ generatedAt });

    expect(receipt.engineeringReceipts.materialCouponStatus).toBe("missing");
    expect(receipt.engineeringReceipts.forceGapCurveStatus).toBe("missing");
    expect(receipt.engineeringReceipts.pullInMarginStatus).toBe("not_evaluated");
    expect(receipt.engineeringReceipts.supportFractionStatus).toBe("missing");
    expect(receipt.engineeringReceipts.roughnessMarginStatus).toBe("missing");
    expect(receipt.engineeringReceipts.patchPotentialBoundStatus).toBe("missing");
    expect(receipt.engineeringReceipts.thermalLoadStatus).toBe("missing");
    expect(receipt.engineeringReceipts.fatigueMarginStatus).toBe("missing");
    expect(receipt.engineeringReceipts.activeControlEnergyStatus).toBe("missing");
    expect(receipt.engineeringReceipts.linearScalingValidityStatus).toBe("missing");
    expect(receipt.summary.mechanicalReceiptComplete).toBe(false);
    expect(receipt.blockers).toEqual(
      expect.arrayContaining([
        "pull_in_margin_not_evaluated",
        "support_retention_overlap_window_missing",
        "linear_scaling_receipt_missing",
        "active_control_energy_receipt_missing",
      ]),
    );
  });

  it("does not allow source authority, physical viability, transport, propulsion, or speed claims", () => {
    const receipt = buildNhm2LayerStackMechanicalReceipt({ generatedAt });
    const text = JSON.stringify(receipt);

    expect(receipt.summary.fullTensorSourceAuthorityAllowed).toBe(false);
    expect(receipt.summary.physicalViabilityClaimAllowed).toBe(false);
    expect(receipt.summary.transportClaimAllowed).toBe(false);
    expect(receipt.claimBoundary.routeEtaClaimAllowed).toBe(false);
    expect(receipt.claimBoundary.propulsionClaimAllowed).toBe(false);
    expect(receipt.claimBoundary.speedAuthorityClaimAllowed).toBe(false);
    expect(text).not.toMatch(forbiddenPhrase("thrust", " proof"));
    expect(text).not.toMatch(forbiddenPhrase("material source", " closure"));
  });
});
