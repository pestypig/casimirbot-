import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
} from "./nhm2-regional-source-closure-evidence.v1";
import {
  NHM2_REGIONAL_SUPPORT_FUNCTION_REGION_IDS,
  getNhm2RegionalSupportFunctionAtlasHash,
  type Nhm2RegionalSupportFunctionAtlasV1,
  type Nhm2RegionalSupportFunctionRegionId,
} from "./nhm2-regional-support-function-atlas.v1";
import type { Nhm2TileCounterpartConservationArtifact } from "./nhm2-tile-counterpart-conservation.v1";

export const NHM2_COVARIANT_CONSERVATION_DIAGNOSTIC_CONTRACT_VERSION =
  "nhm2_covariant_conservation_diagnostic/v1";

export type Nhm2CovariantConservationDiagnosticRegionV1 = {
  regionId: Nhm2RegionalSupportFunctionRegionId;
  semanticRole: "closure_region" | "transition_region" | "global_region";
  status: "pass" | "review" | "fail" | "missing";
  divergenceNormLInf: number | null;
  continuityNormLInf: number | null;
  momentumNormLInf: number | null;
  transitionDerivativeContributionLInf: number | null;
  toleranceLInf: number | null;
  sampleCount: number | null;
  maxHotspotRef: string | null;
  blockers: string[];
  warnings: string[];
};

export type Nhm2CovariantConservationDiagnosticArtifactV1 = {
  contractVersion: typeof NHM2_COVARIANT_CONSERVATION_DIAGNOSTIC_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  runId: string;
  atlasRef: string | null;
  atlasHash: string | null;
  tensorRef: string | null;
  reducedOrderConservationRef: string | null;
  derivativeSupport: {
    partialMuWAvailable: boolean;
    covariantDerivativeSupportAvailable: boolean;
    derivativeBasis: "chart" | "missing";
    derivativeRef: string | null;
  };
  transitionDerivativeTerms: {
    required: true;
    included: boolean;
    missingKernelIds: string[];
    maxContributionLInf: number | null;
    hotspotRefs: string[];
  };
  regions: Nhm2CovariantConservationDiagnosticRegionV1[];
  summary: {
    covariantConservationPass: boolean;
    reducedOrderConservationPass: boolean;
    derivativeSupportAvailable: boolean;
    transitionDerivativeTermsIncluded: boolean;
    firstBlocker: string | null;
    blockerCount: number;
  };
  claimBoundary: {
    diagnosticOnly: true;
    reducedOrderJumpPassCannotSubstituteForCovariantConservation: true;
    transitionDerivativeTermsRequired: true;
    conservationDoesNotValidatePhysicalSource: true;
  };
};

export type BuildNhm2CovariantConservationDiagnosticInput = {
  generatedAt?: string | null;
  laneId?: "nhm2_shift_lapse" | null;
  selectedProfileId?: string | null;
  runId?: string | null;
  atlas?: Nhm2RegionalSupportFunctionAtlasV1 | null;
  atlasRef?: string | null;
  tensorRef?: string | null;
  reducedOrderConservation?: Nhm2TileCounterpartConservationArtifact | null;
  reducedOrderConservationRef?: string | null;
  toleranceLInf?: number | null;
};

const DEFAULT_TOLERANCE_LINF = 0.1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableText = (value: unknown): value is string | null =>
  value === null || isText(value);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const uniqueText = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(values.filter((value): value is string => isText(value))),
  );

const semanticRoleFor = (
  regionId: Nhm2RegionalSupportFunctionRegionId,
): Nhm2CovariantConservationDiagnosticRegionV1["semanticRole"] => {
  if (regionId === "global") return "global_region";
  return regionId.includes("transition") ? "transition_region" : "closure_region";
};

const transitionSupportFor = (
  regionId: Nhm2RegionalSupportFunctionRegionId,
): Nhm2RegionalSourceClosureRegionId[] => {
  if (regionId === "hull_wall_transition") return ["hull", "wall"];
  if (regionId === "wall_exterior_transition") return ["wall", "exterior_shell"];
  return [];
};

const buildMissingRegion = (
  regionId: Nhm2RegionalSupportFunctionRegionId,
  blockers: string[],
): Nhm2CovariantConservationDiagnosticRegionV1 => ({
  regionId,
  semanticRole: semanticRoleFor(regionId),
  status: "missing",
  divergenceNormLInf: null,
  continuityNormLInf: null,
  momentumNormLInf: null,
  transitionDerivativeContributionLInf: null,
  toleranceLInf: null,
  sampleCount: null,
  maxHotspotRef: null,
  blockers,
  warnings: [],
});

const maxFinite = (values: Array<number | null | undefined>): number | null => {
  const finite = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  return finite.length === 0 ? null : Math.max(...finite);
};

export const buildNhm2CovariantConservationDiagnostic = (
  input: BuildNhm2CovariantConservationDiagnosticInput,
): Nhm2CovariantConservationDiagnosticArtifactV1 => {
  const atlasHash = getNhm2RegionalSupportFunctionAtlasHash(input.atlas);
  const conservation = input.reducedOrderConservation ?? null;
  const derivativeSupport = input.atlas?.derivativeSupport ?? null;
  const missingKernelIds =
    input.atlas?.transitionKernels
      .filter((kernel) => !kernel.derivativeTermsAvailable)
      .map((kernel) => kernel.kernelId) ?? [];
  const derivativeSupportAvailable =
    derivativeSupport?.partialMuWAvailable === true &&
    derivativeSupport.covariantDerivativeSupportAvailable === true;
  const transitionDerivativeTermsIncluded =
    derivativeSupportAvailable && missingKernelIds.length === 0;
  const conservationByRegion = new Map(
    conservation?.regions.map((region) => [region.regionId, region]) ?? [],
  );
  const commonBlockers = uniqueText([
    input.atlas == null ? "regional_support_function_atlas_missing" : null,
    derivativeSupport?.partialMuWAvailable === true ? null : "partial_mu_support_derivatives_missing",
    derivativeSupport?.covariantDerivativeSupportAvailable === true
      ? null
      : "covariant_derivative_support_missing",
    missingKernelIds.length > 0 ? "transition_kernel_derivative_terms_missing" : null,
    conservation == null ? "reduced_order_conservation_missing" : null,
    conservation != null && conservation.overallState !== "pass"
      ? "reduced_order_conservation_not_pass"
      : null,
  ]);
  const tolerance = input.toleranceLInf ?? DEFAULT_TOLERANCE_LINF;
  const closureRegions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map(
    (regionId): Nhm2CovariantConservationDiagnosticRegionV1 => {
      const reduced = conservationByRegion.get(regionId);
      if (reduced == null) {
        return buildMissingRegion(regionId, [
          ...commonBlockers,
          "reduced_order_conservation_region_missing",
        ]);
      }
      const blockers = uniqueText([
        ...commonBlockers,
        ...reduced.blockers.map((blocker) => `reduced_order:${blocker}`),
        reduced.divTResidualLInf != null && reduced.divTResidualLInf > tolerance
          ? "covariant_conservation_residual_exceeded"
          : null,
        reduced.continuityResidualLInf != null && reduced.continuityResidualLInf > tolerance
          ? "covariant_continuity_residual_exceeded"
          : null,
        reduced.momentumResidualLInf != null && reduced.momentumResidualLInf > tolerance
          ? "covariant_momentum_residual_exceeded"
          : null,
      ]);
      return {
        regionId,
        semanticRole: semanticRoleFor(regionId),
        status:
          blockers.length === 0
            ? "pass"
            : blockers.some((blocker) => blocker.includes("exceeded"))
              ? "fail"
              : "review",
        divergenceNormLInf: reduced.divTResidualLInf,
        continuityNormLInf: reduced.continuityResidualLInf,
        momentumNormLInf: reduced.momentumResidualLInf,
        transitionDerivativeContributionLInf: null,
        toleranceLInf: reduced.toleranceLInf ?? tolerance,
        sampleCount: reduced.sampleCount,
        maxHotspotRef: reduced.maxHotspotRef ?? null,
        blockers,
        warnings: [
          ...(reduced.warnings ?? []),
          "covariant diagnostic requires explicit support derivative and connection terms",
        ],
      };
    },
  );
  const transitionRegions = ([
    "hull_wall_transition",
    "wall_exterior_transition",
  ] as const).map((regionId): Nhm2CovariantConservationDiagnosticRegionV1 => {
    const supports = transitionSupportFor(regionId);
    const reducedRegions = supports.map((region) => conservationByRegion.get(region) ?? null);
    const contribution = maxFinite(
      reducedRegions.map((region) => region?.transitionLayerResidualLInf),
    );
    const blockers = uniqueText([
      ...commonBlockers,
      reducedRegions.some((region) => region == null)
        ? "transition_support_reduced_order_region_missing"
        : null,
      contribution != null && contribution > tolerance
        ? "transition_derivative_contribution_out_of_tolerance"
        : null,
    ]);
    return {
      regionId,
      semanticRole: "transition_region",
      status:
        blockers.length === 0
          ? "pass"
          : blockers.some((blocker) => blocker.includes("out_of_tolerance"))
            ? "fail"
            : "review",
      divergenceNormLInf: contribution,
      continuityNormLInf: null,
      momentumNormLInf: null,
      transitionDerivativeContributionLInf: contribution,
      toleranceLInf: tolerance,
      sampleCount: input.atlas?.regions[regionId].sampleCount ?? null,
      maxHotspotRef:
        reducedRegions.find((region) => region?.maxHotspotRef != null)?.maxHotspotRef ??
        null,
      blockers,
      warnings: ["transition derivative contribution is reported separately from closure regions"],
    };
  });
  const regions: Nhm2CovariantConservationDiagnosticRegionV1[] = [
    ...closureRegions,
    ...transitionRegions,
  ];
  const blockers = regions.flatMap((region) =>
    region.blockers.map((blocker) => `${region.regionId}:${blocker}`),
  );
  const covariantConservationPass =
    derivativeSupportAvailable &&
    transitionDerivativeTermsIncluded &&
    conservation?.overallState === "pass" &&
    regions.every((region) => region.status === "pass");
  return {
    contractVersion: NHM2_COVARIANT_CONSERVATION_DIAGNOSTIC_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: input.laneId ?? conservation?.laneId ?? "nhm2_shift_lapse",
    selectedProfileId:
      input.selectedProfileId ??
      conservation?.selectedProfileId ??
      input.atlas?.runIdentity.profileId ??
      "unknown",
    runId: input.runId ?? conservation?.runId ?? input.atlas?.runIdentity.runId ?? "unknown",
    atlasRef: input.atlasRef ?? null,
    atlasHash,
    tensorRef: input.tensorRef ?? null,
    reducedOrderConservationRef: input.reducedOrderConservationRef ?? null,
    derivativeSupport: {
      partialMuWAvailable: derivativeSupport?.partialMuWAvailable === true,
      covariantDerivativeSupportAvailable:
        derivativeSupport?.covariantDerivativeSupportAvailable === true,
      derivativeBasis: derivativeSupport?.derivativeBasis ?? "missing",
      derivativeRef: derivativeSupport?.derivativeRef ?? null,
    },
    transitionDerivativeTerms: {
      required: true,
      included: transitionDerivativeTermsIncluded,
      missingKernelIds,
      maxContributionLInf: maxFinite(
        transitionRegions.map((region) => region.transitionDerivativeContributionLInf),
      ),
      hotspotRefs: uniqueText(transitionRegions.map((region) => region.maxHotspotRef)),
    },
    regions,
    summary: {
      covariantConservationPass,
      reducedOrderConservationPass: conservation?.overallState === "pass",
      derivativeSupportAvailable,
      transitionDerivativeTermsIncluded,
      firstBlocker: blockers[0] ?? null,
      blockerCount: blockers.length,
    },
    claimBoundary: {
      diagnosticOnly: true,
      reducedOrderJumpPassCannotSubstituteForCovariantConservation: true,
      transitionDerivativeTermsRequired: true,
      conservationDoesNotValidatePhysicalSource: true,
    },
  };
};

const isRegionId = (value: unknown): value is Nhm2RegionalSupportFunctionRegionId =>
  NHM2_REGIONAL_SUPPORT_FUNCTION_REGION_IDS.includes(
    value as Nhm2RegionalSupportFunctionRegionId,
  );

const isStatus = (value: unknown): value is "pass" | "review" | "fail" | "missing" =>
  value === "pass" || value === "review" || value === "fail" || value === "missing";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isText);

const isRegion = (
  value: unknown,
): value is Nhm2CovariantConservationDiagnosticRegionV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isRegionId(record.regionId) &&
    (record.semanticRole === "closure_region" ||
      record.semanticRole === "transition_region" ||
      record.semanticRole === "global_region") &&
    isStatus(record.status) &&
    isNullableNumber(record.divergenceNormLInf) &&
    isNullableNumber(record.continuityNormLInf) &&
    isNullableNumber(record.momentumNormLInf) &&
    isNullableNumber(record.transitionDerivativeContributionLInf) &&
    isNullableNumber(record.toleranceLInf) &&
    isNullableNumber(record.sampleCount) &&
    isNullableText(record.maxHotspotRef) &&
    isStringArray(record.blockers) &&
    isStringArray(record.warnings)
  );
};

export const isNhm2CovariantConservationDiagnostic = (
  value: unknown,
): value is Nhm2CovariantConservationDiagnosticArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const derivativeSupport = isRecord(record?.derivativeSupport)
    ? record?.derivativeSupport
    : null;
  const transitionDerivativeTerms = isRecord(record?.transitionDerivativeTerms)
    ? record?.transitionDerivativeTerms
    : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary) ? record?.claimBoundary : null;
  return (
    record != null &&
    record.contractVersion === NHM2_COVARIANT_CONSERVATION_DIAGNOSTIC_CONTRACT_VERSION &&
    isText(record.generatedAt) &&
    record.laneId === "nhm2_shift_lapse" &&
    isText(record.selectedProfileId) &&
    isText(record.runId) &&
    isNullableText(record.atlasRef) &&
    isNullableText(record.atlasHash) &&
    isNullableText(record.tensorRef) &&
    isNullableText(record.reducedOrderConservationRef) &&
    derivativeSupport != null &&
    typeof derivativeSupport.partialMuWAvailable === "boolean" &&
    typeof derivativeSupport.covariantDerivativeSupportAvailable === "boolean" &&
    (derivativeSupport.derivativeBasis === "chart" ||
      derivativeSupport.derivativeBasis === "missing") &&
    isNullableText(derivativeSupport.derivativeRef) &&
    transitionDerivativeTerms != null &&
    transitionDerivativeTerms.required === true &&
    typeof transitionDerivativeTerms.included === "boolean" &&
    isStringArray(transitionDerivativeTerms.missingKernelIds) &&
    isNullableNumber(transitionDerivativeTerms.maxContributionLInf) &&
    isStringArray(transitionDerivativeTerms.hotspotRefs) &&
    Array.isArray(record.regions) &&
    record.regions.length === NHM2_REGIONAL_SUPPORT_FUNCTION_REGION_IDS.length &&
    record.regions.every(isRegion) &&
    summary != null &&
    typeof summary.covariantConservationPass === "boolean" &&
    typeof summary.reducedOrderConservationPass === "boolean" &&
    typeof summary.derivativeSupportAvailable === "boolean" &&
    typeof summary.transitionDerivativeTermsIncluded === "boolean" &&
    isNullableText(summary.firstBlocker) &&
    typeof summary.blockerCount === "number" &&
    Number.isFinite(summary.blockerCount) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.reducedOrderJumpPassCannotSubstituteForCovariantConservation === true &&
    claimBoundary?.transitionDerivativeTermsRequired === true &&
    claimBoundary?.conservationDoesNotValidatePhysicalSource === true
  );
};
