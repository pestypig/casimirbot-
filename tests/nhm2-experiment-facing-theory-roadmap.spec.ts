import { describe, expect, it } from "vitest";

import {
  NHM2_EXPERIMENT_FACING_SCALAR_CHECK_IDS,
  NHM2_EXPERIMENT_FACING_STAGE_IDS,
  buildNhm2ExperimentFacingTheoryRoadmap,
  isNhm2ExperimentFacingTheoryRoadmap,
} from "../shared/contracts/nhm2-experiment-facing-theory-roadmap.v1";

describe("NHM2 experiment-facing theory roadmap contract", () => {
  it("emits a receipt-blocked roadmap with closed physical and transport claims", () => {
    const artifact = buildNhm2ExperimentFacingTheoryRoadmap({
      generatedAt: "2026-06-21T00:00:00.000Z",
      physicalViabilityCampaignRef: "artifacts/nhm2-physical-viability-campaign.json",
      diagnosticCampaignRef: "artifacts/nhm2-time-dependent-source-campaign.json",
      leanCertificateRef: "artifacts/nhm2-lean-campaign-certificate.json",
    });

    expect(isNhm2ExperimentFacingTheoryRoadmap(artifact)).toBe(true);
    expect(artifact.stages.map((stage) => stage.stageId)).toEqual([
      ...NHM2_EXPERIMENT_FACING_STAGE_IDS,
    ]);
    expect(artifact.summary).toMatchObject({
      stageCount: NHM2_EXPERIMENT_FACING_STAGE_IDS.length,
      receiptBlockedStageCount: NHM2_EXPERIMENT_FACING_STAGE_IDS.length,
      firstBlocker: "prediction_freeze_receipt_missing",
      calculatorLoadableScalarCheckIds: [...NHM2_EXPERIMENT_FACING_SCALAR_CHECK_IDS],
      nonComputableStageIds: [...NHM2_EXPERIMENT_FACING_STAGE_IDS],
    });
    expect(artifact.claimBoundary).toMatchObject({
      diagnosticOnly: true,
      roadmapOnly: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
      scalarChecksCannotSubstituteForExperimentalReceipts: true,
      diagnosticCampaignCannotSubstituteForExperimentalReceipts: true,
      leanCertificateCannotSubstituteForExperimentalReceipts: true,
    });
  });

  it("limits calculator-loadable rows to scalar sanity checks", () => {
    const artifact = buildNhm2ExperimentFacingTheoryRoadmap({
      generatedAt: "2026-06-21T00:00:00.000Z",
    });

    expect(artifact.scalarSanityChecks.map((check) => check.expression)).toEqual([
      "delta_m = DeltaE/c^2",
      "delta_F = g*DeltaE/c^2",
      "array_scaling = DeltaE_N/(N*DeltaE_1)",
      "h00_proxy = 2*G*DeltaE/(r*c^4)",
    ]);
    expect(artifact.scalarSanityChecks.every((check) => check.cannotSubstituteForReceipt)).toBe(
      true,
    );
    expect(
      artifact.stages.every(
        (stage) =>
          stage.nonComputableRuntimeArtifactRequired &&
          stage.requiredReceipts.length > 0 &&
          stage.falsifiers.length > 0 &&
          stage.researchRefs.length > 0,
      ),
    ).toBe(true);
  });
});
