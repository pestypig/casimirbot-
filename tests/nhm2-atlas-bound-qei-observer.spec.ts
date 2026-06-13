import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildNhm2QeiBoundReceipt } from "../shared/contracts/nhm2-qei-bound-receipt.v1";
import { buildNhm2RegionalSupportFunctionAtlas } from "../shared/contracts/nhm2-regional-support-function-atlas.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  NHM2_TENSOR_COMPONENTS,
  type Nhm2RegionalTensor,
} from "../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import { buildNhm2TileEffectiveFullTensorSourceArtifact } from "../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";
import { buildAtlasBoundObserverRobustEnergyConditions } from "../tools/nhm2/build-atlas-bound-observer-robust-energy-conditions";
import { buildAtlasBoundQeiWorldlineDossier } from "../tools/nhm2/build-atlas-bound-qei-worldline-dossier";

const writeJson = (dir: string, name: string, value: unknown): string => {
  const path = join(dir, name);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return path;
};

const atlasRegion = (
  regionId:
    | "global"
    | "hull"
    | "wall"
    | "exterior_shell"
    | "hull_wall_transition"
    | "wall_exterior_transition",
) => ({
  regionId,
  semanticRole:
    regionId === "global"
      ? "global_region" as const
      : regionId.includes("transition")
        ? "transition_region" as const
        : "closure_region" as const,
  maskRef: `mask.${regionId}`,
  supportFunctionRef: `support.${regionId}`,
  sampleCount: 8,
  supportStats: {
    minWeight: 0,
    maxWeight: 1,
    meanWeight: 1,
    nonzeroFraction: 1,
    effectiveVolume: 27,
  },
  aggregationPolicy: {
    weighting: "support_weighted" as const,
    normalization: "sum_weights" as const,
    includeTransitionSamples: !regionId.includes("transition"),
  },
});

const atlas = () =>
  buildNhm2RegionalSupportFunctionAtlas({
    runIdentity: {
      runId: "atlas-bound-test",
      profileId: "stage1_centerline_alpha_0p995_v1",
      chartId: "comoving_cartesian",
      metricRef: "metric.json",
      sourceModelRef: "source.json",
      gridRef: "grid.json",
      samplePlanRef: "sample-plan.json",
      createdAt: "2026-06-13T00:00:00.000Z",
    },
    basisAndUnits: {
      tensorBasis: "chart",
      coordinateSystem: "comoving_cartesian",
      lengthUnit: "m",
      energyDensityUnit: "J/m^3",
      stressEnergyConvention: "T_mu_nu_same_chart",
      signatureConvention: "(-,+,+,+)",
    },
    regions: {
      global: atlasRegion("global"),
      hull: atlasRegion("hull"),
      wall: atlasRegion("wall"),
      exterior_shell: atlasRegion("exterior_shell"),
      hull_wall_transition: atlasRegion("hull_wall_transition"),
      wall_exterior_transition: atlasRegion("wall_exterior_transition"),
    },
    transitionKernels: [
      {
        kernelId: "kernel:hull_wall",
        fromRegion: "hull",
        toRegion: "wall",
        supportRegion: "hull_wall_transition",
        kernelKind: "smootherstep_c2",
        smoothnessClass: "C2",
        widthMeters: 2,
        derivativeTermsAvailable: true,
        derivativeRef: "derivative:hull_wall",
      },
      {
        kernelId: "kernel:wall_exterior",
        fromRegion: "wall",
        toRegion: "exterior_shell",
        supportRegion: "wall_exterior_transition",
        kernelKind: "smootherstep_c2",
        smoothnessClass: "C2",
        widthMeters: 2,
        derivativeTermsAvailable: true,
        derivativeRef: "derivative:wall_exterior",
      },
    ],
    partitionOfUnity: {
      appliesTo: [...NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS],
      sumWeightsMean: 1,
      sumWeightsMaxAbsError: 0,
      negativeWeightMin: 0,
      overlapPolicy: "partition_of_unity",
      status: "pass",
    },
    derivativeSupport: {
      partialMuWAvailable: true,
      covariantDerivativeSupportAvailable: true,
      derivativeBasis: "chart",
      derivativeRef: "derivative:support",
      transitionDerivativeTermsRequired: true,
    },
    provenance: {
      generatedFrom: ["reference.json"],
      inputHashes: { "reference.json": "hash" },
      atlasHash: "atlas-bound-hash",
      targetEchoForbidden: true,
      targetDerivedFieldsUsed: false,
    },
  });

const fullTensor = (rho: number): Nhm2RegionalTensor => ({
  T00: rho,
  T01: 0,
  T02: 0,
  T03: 0,
  T11: 1,
  T12: 0,
  T13: 0,
  T22: 1,
  T23: 0,
  T33: 1,
});

const diagonalTensor = (rho: number): Nhm2RegionalTensor => ({
  T00: rho,
  T11: 1,
  T22: 1,
  T33: 1,
});

const source = (tensorFactory: (rho: number) => Nhm2RegionalTensor = fullTensor) =>
  buildNhm2TileEffectiveFullTensorSourceArtifact({
    generatedAt: "2026-06-13T00:00:00.000Z",
    runId: "atlas-bound-test",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    expectedProfileId: "stage1_centerline_alpha_0p995_v1",
    laneId: "nhm2_shift_lapse",
    sourceModel: {
      sourceModelId: "declared-regional-source",
      sourceModelVersion: "test",
      sourceModelClass: "renormalized_qft_declared",
      sourceSideOnly: true,
      notDerivedFromMetricRequiredTensor: true,
      metricRequiredInputRefs: [],
      sourceInputRefs: ["source-input.json"],
      qeiDossierRef: null,
      conservationRef: null,
    },
    regions: NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => {
      const tensor = tensorFactory(10);
      return {
        regionId,
        status: "pass",
        tensorAuthorityMode:
          ["T00", "T01", "T02", "T03", "T11", "T12", "T13", "T22", "T23", "T33"].every(
            (component) => tensor[component as keyof Nhm2RegionalTensor] != null,
          )
            ? "symmetric_full_tensor" as const
            : "diagonal_reduced_order" as const,
        tensor,
        symmetry: {
          declared: false,
          kind: "none" as const,
          lowerComponentsDerivedBySymmetry: false,
        },
        chartRef: "comoving_cartesian",
        unitsRef: "J/m^3",
        regionMaskRef: `mask.${regionId}`,
        aggregationMode: "mean" as const,
        normalizationBasis: "volume" as const,
        sampleCount: 8,
        sourceSupport: {
          supportKernelId: `support.${regionId}`,
          cycleAverageStatus: "pass" as const,
          dutyCycleStatus: "pass" as const,
          lightCrossingConsistencyStatus: "pass" as const,
        },
        provenance: {
          producerModule: "test",
          producerFunction: "source",
          derivationMode: "source_model_direct_full_tensor" as const,
          inputRefs: ["source-input.json"],
          preAggregationValueRefs: [`source:${regionId}`],
          notDerivedFromMetricRequiredTensor: true,
        },
        blockers: [],
      };
    }),
    literatureRefs: [],
  });

describe("atlas-bound QEI and observer builders", () => {
  it("emits wall and transition QEI worldlines while blocking missing bound provenance", () => {
    const dir = mkdtempSync(join(tmpdir(), "nhm2-qei-"));
    const atlasPath = writeJson(dir, "atlas.json", atlas());
    const sourcePath = writeJson(dir, "source.json", source());

    const artifact = buildAtlasBoundQeiWorldlineDossier({
      repoRoot: dir,
      regionalSupportAtlasPath: atlasPath,
      sourceFullTensorPath: sourcePath,
      tauSeconds: 1e-9,
      dutyCycle: 0.5,
      modulationSeconds: 1e-6,
      samplingKind: "gaussian",
      samplingNormalized: true,
      outPath: "qei.json",
      auditOnly: true,
    });

    expect(artifact.atlasHash).toBe("atlas-bound-hash");
    expect(artifact.summary.hasWallWorldline).toBe(true);
    expect(artifact.summary.dossierComplete).toBe(false);
    expect(artifact.worldlines.map((worldline) => worldline.regionId)).toEqual([
      "wall",
      "hull_wall_transition",
      "wall_exterior_transition",
    ]);
    expect(artifact.worldlines[0]?.sampledRho).toMatchObject({
      status: "computed",
      valueSI: 10,
    });
    expect(artifact.worldlines[0]?.blockers).toContain("qei_bound_missing");
    expect(artifact.worldlines[0]?.blockers).toContain("qei_bound_provenance_missing");
    expect(artifact.worldlines[0]?.blockers).toContain("qei_bound_receipt_missing");
  });

  it("consumes a typed QEI bound receipt for atlas-bound wall worldlines", () => {
    const dir = mkdtempSync(join(tmpdir(), "nhm2-qei-"));
    const atlasArtifact = atlas();
    const sourceArtifact = source();
    const atlasPath = writeJson(dir, "atlas.json", atlasArtifact);
    const sourcePath = writeJson(dir, "source.json", sourceArtifact);
    const receiptPath = writeJson(
      dir,
      "receipt.json",
      buildNhm2QeiBoundReceipt({
        generatedAt: "2026-06-13T00:00:00.000Z",
        laneId: "nhm2_shift_lapse",
        selectedProfileId: "stage1_centerline_alpha_0p995_v1",
        atlasRef: atlasPath,
        atlasHash: atlasArtifact.provenance.atlasHash,
        tensorRef: sourceArtifact.artifactId,
        boundModelKind: "ford_roman_lorentzian",
        samplingFunction: {
          kind: "lorentzian",
          tauSeconds: 1e-10,
          normalized: true,
        },
        bound: {
          valueSI: 20,
          unit: "J/m^3",
          provenanceRef: "ford_roman_1996_quantum_inequality",
          status: "literature_bound",
        },
        tauPolicy: {
          tauVsDuty: "pass",
          tauVsLightCrossing: "pass",
          tauVsModulation: "pass",
          dutyCycle: 0.5,
          lightCrossingSeconds: 1e-6,
          modulationSeconds: 1e-6,
        },
        applicability: {
          appliesToRegions: ["wall", "hull_wall_transition", "wall_exterior_transition"],
          stationaryWorldlineAssumption: true,
          reducedOrderOnly: false,
          qftStateSpecified: true,
          renormalizationConventionSpecified: true,
        },
      }),
    );

    const artifact = buildAtlasBoundQeiWorldlineDossier({
      repoRoot: dir,
      regionalSupportAtlasPath: atlasPath,
      sourceFullTensorPath: sourcePath,
      qeiBoundReceiptPath: receiptPath,
      outPath: "qei.json",
      auditOnly: true,
    });

    const wall = artifact.worldlines.find((worldline) => worldline.regionId === "wall");
    expect(wall?.samplingFunction).toMatchObject({
      kind: "lorentzian",
      tauSeconds: 1e-10,
      normalized: true,
    });
    expect(wall?.bound).toMatchObject({
      valueSI: 20,
      status: "literature_bound",
      provenanceRef: "ford_roman_1996_quantum_inequality",
    });
    expect(wall?.blockers).not.toContain("qei_bound_missing");
    expect(wall?.blockers).not.toContain("qei_bound_receipt_missing");
    expect(artifact.summary.dossierComplete).toBe(false);
    expect(
      artifact.worldlines.find((worldline) => worldline.regionId === "hull_wall_transition")
        ?.blockers,
    ).toContain("transition_worldline_reduced_order_interpolation");
  });

  it("marks stale QEI bound receipts as atlas-mismatched worldline blockers", () => {
    const dir = mkdtempSync(join(tmpdir(), "nhm2-qei-"));
    const sourceArtifact = source();
    const atlasPath = writeJson(dir, "atlas.json", atlas());
    const sourcePath = writeJson(dir, "source.json", sourceArtifact);
    const receiptPath = writeJson(
      dir,
      "receipt.json",
      buildNhm2QeiBoundReceipt({
        generatedAt: "2026-06-13T00:00:00.000Z",
        laneId: "nhm2_shift_lapse",
        selectedProfileId: "stage1_centerline_alpha_0p995_v1",
        atlasRef: atlasPath,
        atlasHash: "stale-atlas-hash",
        tensorRef: sourceArtifact.artifactId,
        boundModelKind: "ford_roman_lorentzian",
        samplingFunction: {
          kind: "lorentzian",
          tauSeconds: 1e-10,
          normalized: true,
        },
        bound: {
          valueSI: 20,
          unit: "J/m^3",
          provenanceRef: "ford_roman_1996_quantum_inequality",
          status: "literature_bound",
        },
        tauPolicy: {
          tauVsDuty: "pass",
          tauVsLightCrossing: "pass",
          tauVsModulation: "pass",
          dutyCycle: 0.5,
          lightCrossingSeconds: 1e-6,
          modulationSeconds: 1e-6,
        },
        applicability: {
          appliesToRegions: ["wall"],
          stationaryWorldlineAssumption: true,
          reducedOrderOnly: false,
          qftStateSpecified: true,
          renormalizationConventionSpecified: true,
        },
      }),
    );

    const artifact = buildAtlasBoundQeiWorldlineDossier({
      repoRoot: dir,
      regionalSupportAtlasPath: atlasPath,
      sourceFullTensorPath: sourcePath,
      qeiBoundReceiptPath: receiptPath,
      outPath: "qei.json",
      auditOnly: true,
    });

    expect(artifact.worldlines[0]?.blockers).toContain(
      "qei_bound_receipt_atlas_hash_mismatch",
    );
    expect(artifact.summary.dossierComplete).toBe(false);
  });

  it("does not let a direct QEI bound scalar complete the dossier outside audit-only mode", () => {
    const dir = mkdtempSync(join(tmpdir(), "nhm2-qei-"));
    const atlasPath = writeJson(dir, "atlas.json", atlas());
    const sourcePath = writeJson(dir, "source.json", source());

    const artifact = buildAtlasBoundQeiWorldlineDossier({
      repoRoot: dir,
      regionalSupportAtlasPath: atlasPath,
      sourceFullTensorPath: sourcePath,
      qeiBoundSI: 20,
      tauSeconds: 1e-10,
      dutyCycle: 0.5,
      modulationSeconds: 1e-6,
      samplingKind: "lorentzian",
      samplingNormalized: true,
      outPath: "qei.json",
      auditOnly: false,
    });

    expect(artifact.worldlines[0]?.bound.status).toBe("proxy");
    expect(artifact.worldlines[0]?.blockers).toContain(
      "qei_bound_direct_scalar_not_receipted",
    );
    expect(artifact.summary.anyProxy).toBe(true);
    expect(artifact.summary.dossierComplete).toBe(false);
  });

  it("does not treat diagonal-only source tensors as robust observer evidence", () => {
    const dir = mkdtempSync(join(tmpdir(), "nhm2-observer-"));
    const atlasPath = writeJson(dir, "atlas.json", atlas());
    const sourcePath = writeJson(dir, "source.json", source(diagonalTensor));

    const artifact = buildAtlasBoundObserverRobustEnergyConditions({
      repoRoot: dir,
      regionalSupportAtlasPath: atlasPath,
      sourceFullTensorPath: sourcePath,
      outPath: "observer.json",
      auditOnly: true,
    });

    const boosted = artifact.observerFamilies.find(
      (family) => family.familyId === "boosted_timelike_grid",
    );
    const optimizer = artifact.observerFamilies.find(
      (family) => family.familyId === "continuous_optimizer",
    );

    expect(artifact.atlasHash).toBe("atlas-bound-hash");
    expect(artifact.summary.robustCheckComplete).toBe(false);
    expect(boosted?.status).toBe("missing");
    expect(boosted?.blockers).toContain("wall:source_full_tensor_authority_not_pass");
    expect(boosted?.blockers).toContain("wall:T12:source_component_missing");
    expect(optimizer?.status).toBe("not_run");
    expect(optimizer?.optimizerUsed).toBe(false);
  });

  it("runs bounded observer-family checks from full source tensors without completing optimizer", () => {
    const dir = mkdtempSync(join(tmpdir(), "nhm2-observer-"));
    const atlasPath = writeJson(dir, "atlas.json", atlas());
    const sourcePath = writeJson(dir, "source.json", source());

    const artifact = buildAtlasBoundObserverRobustEnergyConditions({
      repoRoot: dir,
      regionalSupportAtlasPath: atlasPath,
      sourceFullTensorPath: sourcePath,
      outPath: "observer.json",
      auditOnly: true,
    });

    expect(artifact.sampleRegionCoverage?.wall).toBe(8);
    expect(
      artifact.observerFamilies.find(
        (family) => family.familyId === "boosted_timelike_grid",
      )?.status,
    ).toBe("pass");
    expect(
      artifact.observerFamilies.find((family) => family.familyId === "null_direction_grid")
        ?.status,
    ).toBe("pass");
    expect(
      artifact.observerFamilies.find((family) => family.familyId === "algebraic_type_i")
        ?.status,
    ).toBe("pass");
    expect(
      artifact.observerFamilies.find((family) => family.familyId === "continuous_optimizer")
        ?.status,
    ).toBe("not_run");
  });
});
