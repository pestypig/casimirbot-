import type { Nhm2RegionalSupportFunctionRegionId } from "./nhm2-regional-support-function-atlas.v1";
import {
  isNhm2CandidateMetricProfileSpec,
  type Nhm2CandidateMetricProfileSpecV1,
} from "./nhm2-candidate-metric-profile-spec.v1";

export const NHM2_CANDIDATE_CAMPAIGN_GRID_CONTRACT_VERSION =
  "nhm2_candidate_campaign_grid/v1";

export type Nhm2CandidateCampaignGridV1 = {
  contractVersion: typeof NHM2_CANDIDATE_CAMPAIGN_GRID_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  candidateProfileId: string;
  runtimeProfileId: string | null;
  chartId: "comoving_cartesian";
  gridId: string;
  gridKind: "reduced_order_campaign_grid";
  coordinateSystem: "comoving_cartesian";
  basisRef: "chart";
  regionSamples: Record<Nhm2RegionalSupportFunctionRegionId, {
    sampleCount: number;
    maskRef: string;
    supportFunctionRef: string;
  }>;
  samplingPolicy: {
    regionalAggregationReady: true;
    admFiniteDifferenceReady: true;
    transitionSamplesIncluded: true;
    latestAliasesForbidden: true;
  };
  provenance: {
    candidateProfileSpecRef: string | null;
    sourceTensorCopiedFromMetric: false;
    targetDerivedFieldsUsed: false;
  };
  readiness: {
    gridAvailable: true;
    sameChartMetadataAvailable: boolean;
    candidateRuntimeProfileMapped: boolean;
    admSamplingReady: boolean;
    blockers: string[];
  };
  claimBoundary: {
    diagnosticOnly: true;
    gridDoesNotEvaluateMetricTensor: true;
    gridDoesNotValidateProfile: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2CandidateCampaignGridInput = {
  generatedAt?: string | null;
  candidateProfileSpec: Nhm2CandidateMetricProfileSpecV1;
  candidateProfileSpecRef?: string | null;
  closureRegionSampleCount?: number | null;
  transitionRegionSampleCount?: number | null;
};

const REGION_IDS: Nhm2RegionalSupportFunctionRegionId[] = [
  "global",
  "hull",
  "wall",
  "exterior_shell",
  "hull_wall_transition",
  "wall_exterior_transition",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableText = (value: unknown): value is string | null =>
  value === null || isText(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const positiveInt = (value: number | null | undefined, fallback: number): number =>
  Number.isFinite(value) && value != null && value > 0
    ? Math.max(1, Math.floor(value))
    : fallback;

export const buildNhm2CandidateCampaignGrid = (
  input: BuildNhm2CandidateCampaignGridInput,
): Nhm2CandidateCampaignGridV1 => {
  const spec = input.candidateProfileSpec;
  const closureSamples = positiveInt(input.closureRegionSampleCount, 24);
  const transitionSamples = positiveInt(input.transitionRegionSampleCount, 16);
  const candidateRuntimeProfileMapped =
    spec.executableGeometry.runtimeProfileRegistered &&
    spec.executableGeometry.runtimeProfileMatchesCandidateLevers;
  const regionSamples = Object.fromEntries(
    REGION_IDS.map((regionId) => {
      const transition =
        regionId === "hull_wall_transition" ||
        regionId === "wall_exterior_transition";
      return [
        regionId,
        {
          sampleCount: transition ? transitionSamples : closureSamples,
          maskRef: `candidate.${spec.candidateProfileId}.mask.${regionId}`,
          supportFunctionRef: `candidate.${spec.candidateProfileId}.W.${regionId}`,
        },
      ];
    }),
  ) as Nhm2CandidateCampaignGridV1["regionSamples"];
  const blockers = candidateRuntimeProfileMapped
    ? []
    : ["candidate_runtime_profile_mapping_incomplete"];

  return {
    contractVersion: NHM2_CANDIDATE_CAMPAIGN_GRID_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    candidateProfileId: spec.candidateProfileId,
    runtimeProfileId: spec.executableGeometry.runtimeProfileId,
    chartId: "comoving_cartesian",
    gridId: `grid:${spec.candidateProfileId}:reduced_order_campaign`,
    gridKind: "reduced_order_campaign_grid",
    coordinateSystem: "comoving_cartesian",
    basisRef: "chart",
    regionSamples,
    samplingPolicy: {
      regionalAggregationReady: true,
      admFiniteDifferenceReady: true,
      transitionSamplesIncluded: true,
      latestAliasesForbidden: true,
    },
    provenance: {
      candidateProfileSpecRef: input.candidateProfileSpecRef ?? null,
      sourceTensorCopiedFromMetric: false,
      targetDerivedFieldsUsed: false,
    },
    readiness: {
      gridAvailable: true,
      sameChartMetadataAvailable: true,
      candidateRuntimeProfileMapped,
      admSamplingReady: candidateRuntimeProfileMapped,
      blockers,
    },
    claimBoundary: {
      diagnosticOnly: true,
      gridDoesNotEvaluateMetricTensor: true,
      gridDoesNotValidateProfile: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

const isRegionSample = (value: unknown): boolean => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isFiniteNumber(record.sampleCount) &&
    isText(record.maskRef) &&
    isText(record.supportFunctionRef)
  );
};

export const isNhm2CandidateCampaignGrid = (
  value: unknown,
): value is Nhm2CandidateCampaignGridV1 => {
  const record = isRecord(value) ? value : null;
  const regionSamples = isRecord(record?.regionSamples)
    ? record.regionSamples
    : null;
  const samplingPolicy = isRecord(record?.samplingPolicy)
    ? record.samplingPolicy
    : null;
  const provenance = isRecord(record?.provenance) ? record.provenance : null;
  const readiness = isRecord(record?.readiness) ? record.readiness : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record.claimBoundary
    : null;
  return (
    record != null &&
    record.contractVersion === NHM2_CANDIDATE_CAMPAIGN_GRID_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    record.laneId === "nhm2_shift_lapse" &&
    typeof record.candidateProfileId === "string" &&
    isNullableText(record.runtimeProfileId) &&
    record.chartId === "comoving_cartesian" &&
    isText(record.gridId) &&
    record.gridKind === "reduced_order_campaign_grid" &&
    record.coordinateSystem === "comoving_cartesian" &&
    record.basisRef === "chart" &&
    regionSamples != null &&
    REGION_IDS.every((regionId) => isRegionSample(regionSamples[regionId])) &&
    samplingPolicy?.regionalAggregationReady === true &&
    samplingPolicy.admFiniteDifferenceReady === true &&
    samplingPolicy.transitionSamplesIncluded === true &&
    samplingPolicy.latestAliasesForbidden === true &&
    provenance?.sourceTensorCopiedFromMetric === false &&
    provenance.targetDerivedFieldsUsed === false &&
    isNullableText(provenance.candidateProfileSpecRef) &&
    readiness?.gridAvailable === true &&
    typeof readiness.sameChartMetadataAvailable === "boolean" &&
    typeof readiness.candidateRuntimeProfileMapped === "boolean" &&
    typeof readiness.admSamplingReady === "boolean" &&
    Array.isArray(readiness.blockers) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary.gridDoesNotEvaluateMetricTensor === true &&
    claimBoundary.gridDoesNotValidateProfile === true &&
    claimBoundary.physicalViabilityClaimAllowed === false &&
    claimBoundary.transportClaimAllowed === false &&
    claimBoundary.routeEtaClaimAllowed === false &&
    claimBoundary.propulsionClaimAllowed === false
  );
};

export const isCandidateProfileSpecForGrid = isNhm2CandidateMetricProfileSpec;
