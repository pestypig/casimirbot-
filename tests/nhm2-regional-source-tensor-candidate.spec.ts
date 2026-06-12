import { describe, expect, it } from "vitest";

import type { CasimirMaterialReceiptV1 } from "../shared/contracts/casimir-material-receipt.v1";
import {
  buildNhm2RegionalSourceTensorCandidate,
  isNhm2RegionalSourceTensorCandidateArtifact,
  type Nhm2RegionalSourceTensorCandidateTemplateV1,
} from "../shared/contracts/nhm2-regional-source-tensor-candidate.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  NHM2_TENSOR_COMPONENTS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
} from "../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import type { Nhm2RegionalSourceTensorTargetsArtifactV1 } from "../shared/contracts/nhm2-regional-source-tensor-targets.v1";

const sourceByRegion: Record<Nhm2RegionalSourceClosureRegionId, number> = {
  global: -58267450.96267209,
  hull: -16732756.921958108,
  wall: -27108804644.765415,
  exterior_shell: -5133810475.7006645,
};

const targetByRegion: Record<Nhm2RegionalSourceClosureRegionId, number> = {
  global: -58267450.98955891,
  hull: -733553902.6786809,
  wall: -1699539201.2526472,
  exterior_shell: -1699157799.1011546,
};

const factorByRegion: Record<Nhm2RegionalSourceClosureRegionId, number> = {
  global: 1.000000000461438,
  hull: 43.83939276115646,
  wall: 0.06269325495990913,
  exterior_shell: 0.33097400208745587,
};

const targets = (): Nhm2RegionalSourceTensorTargetsArtifactV1 => ({
  contractVersion: "nhm2_regional_source_tensor_targets/v1",
  generatedAt: "2026-06-12T00:00:00.000Z",
  laneId: "nhm2_shift_lapse",
  selectedProfileId: "stage1_centerline_alpha_0p995_v1",
  runId: "nhm2-reference-ledger-2026-05-05-v1",
  sourceEvidenceRef: "regional-evidence.json",
  regions: NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => ({
    regionId,
    requiredT00_SI: targetByRegion[regionId],
    currentSourceT00_SI: sourceByRegion[regionId],
    requiredOverCurrentSource: factorByRegion[regionId],
    currentSourceOverRequired: sourceByRegion[regionId] / targetByRegion[regionId],
    currentRelativeResidual: regionId === "global" ? 4.6e-10 : 1,
    toleranceRelLInf: 0.1,
    targetSourceT00_SI: targetByRegion[regionId],
    tuningDirection:
      regionId === "hull"
        ? "increase_magnitude"
        : regionId === "global"
          ? "hold"
          : "decrease_magnitude",
    scalarT00WithinTolerance: regionId === "global",
    tensorAuthorityRequired: true,
    materialReceiptRequired: true,
    blockers:
      regionId === "global"
        ? ["regional_tensor_authority_incomplete"]
        : ["scalar_T00_outside_tolerance"],
  })),
  summary: {
    allScalarT00WithinTolerance: false,
    allRegionsHaveTargets: true,
    regionalTensorTuningReady: true,
    firstBlocker: "hull:scalar_T00_outside_tolerance",
  },
  claimBoundary: {
    diagnosticOnly: true,
    scalarTargetsDoNotValidateSource: true,
    regionalTensorAuthorityStillRequired: true,
    physicalClaimAllowed: false,
    transportClaimAllowed: false,
  },
});

const materialReceipt = (): CasimirMaterialReceiptV1 => ({
  contractVersion: "casimir_material_receipt/v1",
  generatedAt: "2026-06-12T00:00:00.000Z",
  tileBatchId: "regional-candidate-test",
  geometry: {
    gapMeters: 8e-9,
    gapMetrologyStatus: "measured",
    roughnessRmsMeters: 1e-10,
    beyondPfaValidity: "pass",
  },
  material: {
    modelKind: "lifshitz",
    dielectricResponseRef: "dielectric.json",
    finiteConductivityIncluded: true,
    finiteTemperatureIncluded: true,
    roughnessCorrectionIncluded: true,
  },
  environment: { vacuumSealEvidence: "present", temperatureK: 4 },
  correctionFactors: { conductivity: 1, temperature: 1, roughness: 1, geometry: 1 },
  status: "material_receipted",
  literatureRefs: [
    "reid_white_johnson_2010_arbitrary_geometry_casimir",
    "klimchitskaya_mohideen_mostepanenko_2009_lifshitz_review",
  ],
  claimBoundary: {
    diagnosticOnly: true,
    idealCasimirDoesNotValidateTileSource: true,
  },
});

const tensor = (value: number): Nhm2RegionalTensor =>
  Object.fromEntries(
    NHM2_TENSOR_COMPONENTS.map((component) => [component, value]),
  ) as Nhm2RegionalTensor;

const template = (): Nhm2RegionalSourceTensorCandidateTemplateV1 => ({
  templateId: "regional-full-tensor-template",
  chartId: "comoving_cartesian",
  regions: NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => ({
    regionId,
    tensor: tensor(sourceByRegion[regionId]),
    provenanceRef: `template:${regionId}`,
  })),
});

const build = (
  options: {
    fullTensorTemplate?: Nhm2RegionalSourceTensorCandidateTemplateV1 | null;
    receipt?: CasimirMaterialReceiptV1 | null;
  } = {},
) =>
  buildNhm2RegionalSourceTensorCandidate({
    generatedAt: "2026-06-12T00:00:00.000Z",
    artifactRefs: {
      regionalSourceTensorTargets: "targets.json",
      fullTensorTemplate: options.fullTensorTemplate == null ? null : "template.json",
      materialReceipt: options.receipt == null ? null : "receipt.json",
    },
    targets: targets(),
    fullTensorTemplate: options.fullTensorTemplate ?? null,
    materialReceipt: options.receipt ?? null,
  });

describe("nhm2_regional_source_tensor_candidate/v1", () => {
  it("emits target-fit T00 candidates without claiming tensor authority", () => {
    const artifact = build();
    const wall = artifact.regions.find((region) => region.regionId === "wall");

    expect(wall?.T00ScaleFactor).toBeCloseTo(0.06269325495990913, 12);
    expect(wall?.proposedT00_SI).toBeCloseTo(targetByRegion.wall, 6);
    expect(wall?.candidateKind).toBe("target_fit_T00_only");
    expect(wall?.tensorAuthorityMode).toBe("proxy");
    expect(wall?.blockers).toContain("target_fit_candidate_not_material_source");
    expect(wall?.blockers).toContain("candidate_full_tensor_authority_missing");
    expect(artifact.summary.regionalMaterialSourceModelReady).toBe(false);
    expect(artifact.claimBoundary.physicalClaimAllowed).toBe(false);
    expect(isNhm2RegionalSourceTensorCandidateArtifact(artifact)).toBe(true);
  });

  it("uses full tensor template and material receipt before marking model-ready", () => {
    const artifact = build({
      fullTensorTemplate: template(),
      receipt: materialReceipt(),
    });
    const hull = artifact.regions.find((region) => region.regionId === "hull");

    expect(hull?.candidateKind).toBe("material_receipted_tensor");
    expect(hull?.tensorAuthorityMode).toBe("full_tensor");
    expect(hull?.proposedT00_SI).toBeCloseTo(targetByRegion.hull, 6);
    expect(hull?.componentStatus.T12).toBe("material_receipted");
    expect(hull?.blockers).toEqual([]);
    expect(artifact.summary.allRegionsFullTensorCandidate).toBe(true);
    expect(artifact.summary.materialReceipted).toBe(true);
    expect(artifact.summary.regionalMaterialSourceModelReady).toBe(true);
    expect(artifact.claimBoundary.candidateDoesNotPassHarness).toBe(true);
  });

  it("keeps template-scaled tensors blocked without a material receipt", () => {
    const artifact = build({ fullTensorTemplate: template() });
    const exterior = artifact.regions.find((region) => region.regionId === "exterior_shell");

    expect(exterior?.candidateKind).toBe("template_scaled_tensor");
    expect(exterior?.tensorAuthorityMode).toBe("full_tensor");
    expect(exterior?.blockers).toContain("material_receipt_status:missing");
    expect(artifact.summary.regionalMaterialSourceModelReady).toBe(false);
  });
});
