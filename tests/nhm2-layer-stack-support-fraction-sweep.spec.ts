import { describe, expect, it } from "vitest";
import {
  buildNhm2LayerStackSupportFractionSweep,
  isNhm2LayerStackSupportFractionSweep,
} from "../shared/contracts/nhm2-layer-stack-support-fraction-sweep.v1";

const forbiddenPhrase = (...parts: string[]): RegExp => new RegExp(parts.join(""), "i");

describe("NHM2 layer stack support fraction sweep", () => {
  const generatedAt = "2026-06-21T00:00:00.000Z";

  it("builds and validates a diagnostic support-fraction go/no-go map", () => {
    const sweep = buildNhm2LayerStackSupportFractionSweep({ generatedAt });

    expect(isNhm2LayerStackSupportFractionSweep(sweep)).toBe(true);
    expect(sweep.contractVersion).toBe("nhm2_layer_stack_support_fraction_sweep/v1");
    expect(sweep.generatedAt).toBe(generatedAt);
    expect(sweep.mechanicalReceiptRef).toBe("nhm2_layer_stack_mechanical_receipt/v1");
    expect(sweep.scalarInputs.stackForceN).toBeCloseTo(1.41883842843e4, 5);
    expect(sweep.claimBoundary.diagnosticOnly).toBe(true);
    expect(sweep.claimBoundary.supportDriveTermsMustEnterFullTensor).toBe(true);
    expect(sweep.claimBoundary.internalLoadIsNotThrust).toBe(true);
  });

  it("makes support stress decrease as support fraction increases", () => {
    const sweep = buildNhm2LayerStackSupportFractionSweep({ generatedAt });
    const tinRows = sweep.rows
      .filter((row) => row.materialPresetId === "ultra_high_stress_tin")
      .sort((a, b) => a.supportFraction - b.supportFraction);

    for (let index = 1; index < tinRows.length; index += 1) {
      expect(tinRows[index].supportStressPa).toBeLessThan(tinRows[index - 1].supportStressPa);
    }
    expect(tinRows[0].supportStressMPa).toBeCloseTo(7094.19214215, 6);
    expect(tinRows[tinRows.length - 1].supportStressMPa).toBeCloseTo(177.354803554, 6);
  });

  it("makes active area and source retention decrease as support fraction increases", () => {
    const sweep = buildNhm2LayerStackSupportFractionSweep({ generatedAt });
    const sinRows = sweep.rows
      .filter((row) => row.materialPresetId === "high_stress_sin")
      .sort((a, b) => a.supportFraction - b.supportFraction);

    for (let index = 1; index < sinRows.length; index += 1) {
      expect(sinRows[index].activeFraction).toBeLessThan(sinRows[index - 1].activeFraction);
      expect(sinRows[index].sourceRetention).toBeLessThan(sinRows[index - 1].sourceRetention);
    }
    expect(sinRows[0].sourceRetention).toBeCloseTo(0.7497, 6);
    expect(sinRows[sinRows.length - 1].sourceRetention).toBeCloseTo(0.153, 6);
  });

  it("reports no feasible window when stress and source-retention constraints do not overlap", () => {
    const sweep = buildNhm2LayerStackSupportFractionSweep({ generatedAt });

    expect(sweep.summary.minimumSupportFractionForStress).toBe(0.2);
    expect(sweep.summary.maximumSupportFractionForSourceRetention).toBe(0.05);
    expect(sweep.summary.feasibleWindowExists).toBe(false);
    expect(sweep.summary.bestCandidateRows).toEqual([]);
    expect(sweep.summary.firstBlocker).toBe("stress_retention_overlap_missing");
  });

  it("blocks candidate status when support and drive tensor terms are not supplied", () => {
    const sweep = buildNhm2LayerStackSupportFractionSweep({
      generatedAt,
      materialCorrection: 1,
      layerScalingEfficiency: 1,
      minimumSourceRetention: 0.5,
      minimumActiveFraction: 0.5,
    });
    const overlapRows = sweep.rows.filter(
      (row) => row.stressStatus === "pass" && row.sourceRetentionStatus === "pass",
    );

    expect(overlapRows.length).toBeGreaterThan(0);
    expect(sweep.summary.feasibleWindowExists).toBe(false);
    expect(sweep.summary.firstBlocker).toBe("support_drive_tensor_terms_missing");
    expect(overlapRows.every((row) => row.tensorContaminationStatus === "review")).toBe(true);
  });

  it("can expose a candidate window only when tensor terms are explicitly supplied", () => {
    const sweep = buildNhm2LayerStackSupportFractionSweep({
      generatedAt,
      materialCorrection: 1,
      layerScalingEfficiency: 1,
      minimumSourceRetention: 0.5,
      minimumActiveFraction: 0.5,
      supportDriveTensorTermsSupplied: true,
    });

    expect(sweep.summary.feasibleWindowExists).toBe(true);
    expect(sweep.summary.bestCandidateRows.length).toBeGreaterThan(0);
    expect(
      sweep.summary.bestCandidateRows.every((row) => row.goNoGoStatus === "candidate_window"),
    ).toBe(true);
  });

  it("keeps claim boundaries closed and avoids promotion language", () => {
    const sweep = buildNhm2LayerStackSupportFractionSweep({ generatedAt });
    const text = JSON.stringify(sweep);

    expect(sweep.summary.physicalViabilityClaimAllowed).toBe(false);
    expect(sweep.summary.transportClaimAllowed).toBe(false);
    expect(sweep.summary.propulsionClaimAllowed).toBe(false);
    expect(sweep.summary.speedAuthorityClaimAllowed).toBe(false);
    expect(sweep.claimBoundary.routeEtaClaimAllowed).toBe(false);
    expect(text).not.toMatch(forbiddenPhrase("physical", " viability"));
    expect(text).not.toMatch(forbiddenPhrase("internal load", " thrust"));
    expect(text).not.toMatch(forbiddenPhrase("propulsion", " proof"));
  });
});
