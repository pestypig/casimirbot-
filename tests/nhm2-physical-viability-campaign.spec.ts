import { describe, expect, it } from "vitest";

import {
  NHM2_PHYSICAL_VIABILITY_STAGE_IDS,
  buildNhm2PhysicalViabilityCampaign,
  isNhm2PhysicalViabilityCampaign,
  type Nhm2PhysicalViabilityStageId,
} from "../shared/contracts/nhm2-physical-viability-campaign.v1";
import type { Nhm2TimeDependentSourceCampaignArtifactV1 } from "../shared/contracts/nhm2-time-dependent-source-campaign.v1";

const diagnosticCampaignFixture = (
  campaignPass: boolean,
): Nhm2TimeDependentSourceCampaignArtifactV1 =>
  ({
    selectedProfileId: "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1",
    summary: {
      campaignPass,
    },
  }) as Nhm2TimeDependentSourceCampaignArtifactV1;

describe("NHM2 physical viability campaign contract", () => {
  it("emits a blocked experimental ladder by default", () => {
    const artifact = buildNhm2PhysicalViabilityCampaign({
      generatedAt: "2026-06-21T00:00:00.000Z",
      diagnosticCampaignRef: "artifacts/diagnostic-campaign.json",
      diagnosticCampaignHash: "diagnostic-hash",
      leanCertificateRef: "artifacts/lean-certificate.json",
      diagnosticCampaign: diagnosticCampaignFixture(true),
    });

    expect(isNhm2PhysicalViabilityCampaign(artifact)).toBe(true);
    expect(artifact.diagnosticCampaign).toMatchObject({
      campaignPass: true,
      diagnosticAdmissionOnly: true,
      cannotSubstituteForPhysicalEvidence: true,
    });
    expect(artifact.stages.map((stage) => stage.stageId)).toEqual([
      ...NHM2_PHYSICAL_VIABILITY_STAGE_IDS,
    ]);
    expect(artifact.stages.every((stage) => stage.status === "unattempted")).toBe(true);
    expect(artifact.summary).toMatchObject({
      physicalEvidenceCampaignPass: false,
      transportPrecursorPass: false,
      firstBlocker: "prediction_freeze_missing",
      blockerCount: NHM2_PHYSICAL_VIABILITY_STAGE_IDS.length,
      replicatedStageCount: 0,
    });
    expect(artifact.claimBoundary).toMatchObject({
      diagnosticOnly: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
      diagnosticCampaignCannotSubstituteForExperimentalReceipts: true,
      leanCertificateCannotSubstituteForExperimentalReceipts: true,
    });
  });

  it("keeps transport blocked when only physical evidence stages are replicated", () => {
    const statuses = Object.fromEntries(
      NHM2_PHYSICAL_VIABILITY_STAGE_IDS.map((stageId) => [
        stageId,
        stageId === "stage6_transport_precursor" ? "unattempted" : "replicated",
      ]),
    ) as Partial<Record<Nhm2PhysicalViabilityStageId, "replicated" | "unattempted">>;

    const artifact = buildNhm2PhysicalViabilityCampaign({
      generatedAt: "2026-06-21T00:00:00.000Z",
      stageStatuses: statuses,
      diagnosticCampaign: diagnosticCampaignFixture(true),
    });

    expect(isNhm2PhysicalViabilityCampaign(artifact)).toBe(true);
    expect(artifact.summary.physicalEvidenceCampaignPass).toBe(true);
    expect(artifact.summary.transportPrecursorPass).toBe(false);
    expect(artifact.summary.firstBlocker).toBe("transport_precursor_receipt_missing");
    expect(artifact.claimBoundary.physicalViabilityClaimAllowed).toBe(false);
    expect(artifact.claimBoundary.transportClaimAllowed).toBe(false);
  });

  it("records falsified stages as explicit campaign blockers", () => {
    const artifact = buildNhm2PhysicalViabilityCampaign({
      generatedAt: "2026-06-21T00:00:00.000Z",
      stageStatuses: {
        stage1_tile_metrology: "falsified",
      },
      diagnosticCampaign: diagnosticCampaignFixture(true),
    });

    const tileStage = artifact.stages.find((stage) => stage.stageId === "stage1_tile_metrology");
    expect(tileStage?.status).toBe("falsified");
    expect(tileStage?.blockers).toEqual(["tile_metrology_receipt_missing"]);
    expect(artifact.summary.falsifiedStageIds).toEqual(["stage1_tile_metrology"]);
    expect(artifact.summary.physicalEvidenceCampaignPass).toBe(false);
  });
});
