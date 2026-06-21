import { describe, expect, it } from "vitest";

import { NHM2_EXPERIMENT_FACING_STAGE_IDS } from "../shared/contracts/nhm2-experiment-facing-theory-roadmap.v1";
import {
  buildNhm2ExperimentParameterTargets,
  isNhm2ExperimentParameterTargets,
} from "../shared/contracts/nhm2-experiment-parameter-targets.v1";

describe("NHM2 experiment parameter targets", () => {
  it("emits a receipt-blocked parameter ledger with closed physical and transport claims", () => {
    const artifact = buildNhm2ExperimentParameterTargets({
      generatedAt: "2026-06-21T00:00:00.000Z",
    });

    expect(isNhm2ExperimentParameterTargets(artifact)).toBe(true);
    expect(artifact.summary.stageIdsCovered).toEqual([...NHM2_EXPERIMENT_FACING_STAGE_IDS]);
    expect(artifact.summary.receiptBlockedRowCount).toBe(artifact.rows.length);
    expect(artifact.summary.firstBlocker).toBe("prediction_freeze_receipt_missing");
    expect(artifact.summary).toMatchObject({
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    });
    expect(artifact.claimBoundary).toMatchObject({
      diagnosticOnly: true,
      parameterTargetLayerOnly: true,
      parameterTargetsCannotSubstituteForExperimentalReceipts: true,
      scalarTargetsCannotSubstituteForExperimentalReceipts: true,
      literatureRangesCannotSubstituteForMeasurements: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    });
    expect(
      artifact.rows.every(
        (row) =>
          row.blockers.length > 0 &&
          row.claimBoundary.notMeasured &&
          row.claimBoundary.cannotSubstituteForReceipt &&
          !row.claimBoundary.physicalViabilityClaimAllowed &&
          !row.claimBoundary.transportClaimAllowed,
      ),
    ).toBe(true);
  });

  it("keeps every roadmap stage represented by at least one target row", () => {
    const artifact = buildNhm2ExperimentParameterTargets({
      generatedAt: "2026-06-21T00:00:00.000Z",
    });
    const rowsByStage = new Map(
      NHM2_EXPERIMENT_FACING_STAGE_IDS.map((stageId) => [
        stageId,
        artifact.rows.filter((row) => row.stageId === stageId),
      ]),
    );

    for (const stageId of NHM2_EXPERIMENT_FACING_STAGE_IDS) {
      expect(rowsByStage.get(stageId)?.length, stageId).toBeGreaterThanOrEqual(1);
    }
  });

  it("records current NHM2 numeric targets from the repo as target rows only", () => {
    const artifact = buildNhm2ExperimentParameterTargets({
      generatedAt: "2026-06-21T00:00:00.000Z",
    });
    const byId = new Map(artifact.rows.map((row) => [row.parameterId, row]));

    expect(byId.get("tile_metrology.gap_m")?.currentNhm2Target.valueSI).toBe(8e-9);
    expect(byId.get("tile_metrology.tile_area_m2")?.currentNhm2Target.valueSI).toBe(1e-4);
    expect(byId.get("cycle_energy_balance.ideal_tile_energy_j")?.currentNhm2Target.valueSI).toBeCloseTo(
      8.46e-8,
    );
    expect(byId.get("tile_metrology.ideal_pressure_pa")?.currentNhm2Target.valueSI).toBeCloseTo(
      3.17e5,
    );
    expect(byId.get("array_scaling.layer_count")?.currentNhm2Target.valueSI).toBe(447);
    expect(byId.get("array_scaling.stack_thickness_m")?.currentNhm2Target.valueSI).toBeCloseTo(
      0.001345,
    );
    expect(byId.get("metric_response.weak_field_h00_proxy")?.currentNhm2Target.value).toBe(
      "h00_proxy = 2*G*DeltaE/(r*c^4)",
    );
  });

  it("keeps modeled scalar targets from substituting for receipts", () => {
    const artifact = buildNhm2ExperimentParameterTargets({
      generatedAt: "2026-06-21T00:00:00.000Z",
    });
    const scalarRows = artifact.rows.filter((row) =>
      ["modeled_scalar", "derived_scale_check"].includes(row.targetKind),
    );

    expect(scalarRows.map((row) => row.parameterId)).toEqual(artifact.summary.scalarTargetIds);
    expect(scalarRows.length).toBeGreaterThanOrEqual(5);
    for (const row of scalarRows) {
      expect(row.claimBoundary.cannotSubstituteForReceipt).toBe(true);
      expect(row.blockers.join(" ")).toMatch(/receipt|scalar|detector|geometry|detection/i);
    }
  });

  it("anchors feasibility-relevant rows to independent research references", () => {
    const artifact = buildNhm2ExperimentParameterTargets({
      generatedAt: "2026-06-21T00:00:00.000Z",
    });
    const allRefs = new Set(artifact.rows.flatMap((row) => row.researchRefs));

    for (const row of artifact.rows) {
      expect(row.researchRefs.length, row.parameterId).toBeGreaterThan(0);
      expect(row.literatureRange.summary.length, row.parameterId).toBeGreaterThan(20);
    }
    expect(allRefs).toContain("arxiv_0902_4022_real_material_casimir_review");
    expect(allRefs).toContain("arxiv_1010_5539_arbitrary_material_casimir");
    expect(allRefs).toContain("nature_communications_2013_silicon_casimir_chip");
    expect(allRefs).toContain("arxiv_1409_5012_patch_potentials");
    expect(allRefs).toContain("physrevapplied_2021_high_stress_nanomechanical_resonators");
    expect(allRefs).toContain("epjp_2024_archimedes_balance_prototype");
    expect(allRefs).toContain("ligo_p1500260_advanced_ligo_sensitivity");
    expect(allRefs).toContain("nature_2021_millimetre_scale_gravitational_coupling");
    expect(allRefs).toContain("gr-qc_9702026_pfenning_ford_warp_qi");
    expect(allRefs).toContain("arxiv_2301_01698_stationary_worldline_qei");
    expect(allRefs).toContain("arxiv_2105_03079_generic_warp_nec");
  });
});
