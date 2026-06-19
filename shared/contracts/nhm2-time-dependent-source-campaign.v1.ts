import type { CasimirMaterialReceiptV1 } from "./casimir-material-receipt.v1";
import type { Nhm2CampaignFrontierDispositionV1 } from "./nhm2-campaign-frontier-disposition.v1";
import type { Nhm2CoupledClosurePassCandidateArtifactV1 } from "./nhm2-coupled-closure-pass-candidate.v1";
import type { Nhm2CovariantConservationDiagnosticArtifactV1 } from "./nhm2-covariant-conservation-diagnostic.v1";
import type { Nhm2MetricMomentumRemediationTargetsV1 } from "./nhm2-metric-momentum-remediation-targets.v1";
import type { Nhm2MetricRequiredMomentumDemandAuditV1 } from "./nhm2-metric-required-momentum-demand-audit.v1";
import type { Nhm2NatarioInvariantAuditV1 } from "./nhm2-natario-invariant-audit.v1";
import type { Nhm2MomentumFrameProjectionReceiptV1 } from "./nhm2-momentum-frame-projection-receipt.v1";
import type { Nhm2ObserverRobustEnergyConditionArtifactV1 } from "./nhm2-observer-robust-energy-conditions.v1";
import type { Nhm2QeiWorldlineDossierV1 } from "./nhm2-qei-worldline-dossier.v1";
import type { Nhm2RegionalFullTensorResidualArtifactV1 } from "./nhm2-regional-full-tensor-residual.v1";
import type { Nhm2RegionalSupportFunctionAtlasV1 } from "./nhm2-regional-support-function-atlas.v1";
import { getNhm2RegionalSupportFunctionAtlasHash } from "./nhm2-regional-support-function-atlas.v1";
import type { Nhm2RegionalTensorPassPathHarnessArtifactV1 } from "./nhm2-regional-tensor-pass-path-harness.v1";
import type { Nhm2SourceComponentAuthorityLedgerArtifactV1 } from "./nhm2-source-component-authority-ledger.v1";
import type { Nhm2SourceMomentumDensityAuditArtifactV1 } from "./nhm2-source-momentum-density-audit.v1";
import type { Nhm2SourceOffDiagonalShearAuditArtifactV1 } from "./nhm2-source-off-diagonal-shear-audit.v1";

export const NHM2_TIME_DEPENDENT_SOURCE_CAMPAIGN_CONTRACT_VERSION =
  "nhm2_time_dependent_source_campaign/v1";

export const NHM2_TIME_DEPENDENT_SOURCE_CAMPAIGN_GATE_IDS = [
  "source_independence",
  "switching_covariant_conservation",
  "frequency_convergence",
  "dynamic_effective_geometry_agreement",
  "full_regional_tensor_closure",
  "observer_family_energy_conditions",
  "qei_worldline_receipts",
  "horizon_blueshift_particle_stability",
] as const;

export const NHM2_TIME_DEPENDENT_SOURCE_CAMPAIGN_STATUS_VALUES = [
  "pass",
  "review",
  "fail",
  "missing",
  "blocked",
] as const;

export type Nhm2TimeDependentSourceCampaignGateId =
  (typeof NHM2_TIME_DEPENDENT_SOURCE_CAMPAIGN_GATE_IDS)[number];
export type Nhm2TimeDependentSourceCampaignStatus =
  (typeof NHM2_TIME_DEPENDENT_SOURCE_CAMPAIGN_STATUS_VALUES)[number];

export type Nhm2TimeDependentSourceCampaignGateV1 = {
  gateId: Nhm2TimeDependentSourceCampaignGateId;
  status: Nhm2TimeDependentSourceCampaignStatus;
  pass: boolean;
  blockers: string[];
  warnings: string[];
  primaryMetric: string | null;
};

export type Nhm2FrequencyConvergenceEvidenceV1 = {
  contractVersion: "nhm2_frequency_convergence_evidence/v1";
  generatedAt: string;
  baseFrequencyHz: number | null;
  toleranceLInf: number;
  fixedCycleAverageSource: boolean;
  multipliers: number[];
  entries: Array<{
    multiplier: number;
    frequencyHz: number | null;
    residualLInf: number | null;
    residualL2: number | null;
    pass: boolean | null;
    blockers: string[];
  }>;
  convergenceStatus: Nhm2TimeDependentSourceCampaignStatus;
  blockers: string[];
};

export const NHM2_SWITCHING_CONSERVATION_TERM_IDS = [
  "regional_support_derivative",
  "sector_boundary",
  "time_derivative",
  "transition_kernel",
] as const;

export type Nhm2SwitchingConservationTermId =
  (typeof NHM2_SWITCHING_CONSERVATION_TERM_IDS)[number];

export type Nhm2SwitchingConservationTermV1 = {
  termId: Nhm2SwitchingConservationTermId;
  included: boolean;
  residualLInf: number | null;
  toleranceLInf: number;
  pass: boolean | null;
  blockers: string[];
};

export type Nhm2SwitchingConservationEvidenceV1 = {
  contractVersion: "nhm2_switching_covariant_conservation_evidence/v1";
  generatedAt: string;
  staticCovariantConservationRef: string | null;
  scheduleRef: string | null;
  sectorBoundaryRef: string | null;
  switchingFunctionRef: string | null;
  includesRegionalSupportDerivatives: boolean;
  includesSectorBoundaryTerms: boolean;
  includesTimeDerivativeTerms: boolean;
  includesTransitionKernelTerms: boolean;
  toleranceLInf: number;
  overallResidualLInf: number | null;
  terms: Nhm2SwitchingConservationTermV1[];
  conservationStatus: Nhm2TimeDependentSourceCampaignStatus;
  blockers: string[];
};

export type Nhm2DynamicEffectiveGeometryEvidenceV1 = {
  contractVersion: "nhm2_dynamic_effective_geometry_evidence/v1";
  generatedAt: string;
  dynamicGeometryRef: string | null;
  effectiveGeometryRef: string | null;
  averagingWindowSeconds: number | null;
  cycleAverageSourceFixed: boolean | null;
  averagedSourceTensorRef: string | null;
  backreactionResidualRef: string | null;
  residualLInf: number | null;
  residualL2: number | null;
  bounded: boolean | null;
  agreementStatus: Nhm2TimeDependentSourceCampaignStatus;
  blockers: string[];
};

export type Nhm2CampaignStabilityEvidenceV1 = {
  contractVersion: "nhm2_campaign_stability_evidence/v1";
  generatedAt: string;
  horizonStatus: Nhm2TimeDependentSourceCampaignStatus;
  blueshiftStatus: Nhm2TimeDependentSourceCampaignStatus;
  particleAccumulationStatus: Nhm2TimeDependentSourceCampaignStatus;
  perturbativeStabilityStatus: Nhm2TimeDependentSourceCampaignStatus;
  blockers: string[];
};

export type Nhm2TimeDependentSourceCampaignArtifactRefsV1 = {
  sourceComponentAuthorityLedger: string | null;
  regionalFullTensorResidual: string | null;
  sourceOffDiagonalShearAudit: string | null;
  sourceMomentumDensityAudit: string | null;
  momentumFrameProjectionReceipt: string | null;
  metricRequiredMomentumDemandAudit: string | null;
  metricMomentumRemediationTargets: string | null;
  campaignFrontierDisposition: string | null;
  covariantConservationDiagnostic: string | null;
  qeiWorldlineDossier: string | null;
  observerRobustEnergyConditions: string | null;
  natarioInvariantAudit: string | null;
  regionalSupportFunctionAtlas: string | null;
  casimirMaterialReceipt: string | null;
  coupledClosurePassCandidate: string | null;
  regionalTensorPassPathHarness: string | null;
  sourceModelRef: string | null;
  metricRequiredTensorRef: string | null;
  dynamicGeometryRef: string | null;
  effectiveGeometryRef: string | null;
  frequencyConvergence: string | null;
  switchingConservation: string | null;
  dynamicEffectiveGeometry: string | null;
  campaignStability: string | null;
};

export type Nhm2TimeDependentSourceCampaignArtifactV1 = {
  contractVersion: typeof NHM2_TIME_DEPENDENT_SOURCE_CAMPAIGN_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  runId: string;
  chartId: string;
  atlasRef: string | null;
  atlasHash: string | null;
  artifactRefs: Nhm2TimeDependentSourceCampaignArtifactRefsV1;
  sourceIndependence: {
    independentlyDerivedTileMaterialTensor: boolean | null;
    copiedFromMetricRequiredTensor: boolean | null;
    fittedToMetricResidual: boolean | null;
    targetEchoDetected: boolean | null;
    blockers: string[];
  };
  frequencyLadder: {
    baseFrequencyHz: number | null;
    toleranceLInf: number | null;
    multipliers: number[];
    fixedCycleAverageSource: boolean | null;
    entries: Nhm2FrequencyConvergenceEvidenceV1["entries"];
    convergenceStatus: Nhm2TimeDependentSourceCampaignStatus;
    blockers: string[];
  };
  switchingSchedule: {
    scheduleRef: string | null;
    sectorBoundaryRef: string | null;
    switchingFunctionRef: string | null;
    includesRegionalSupportDerivatives: boolean | null;
    includesSectorBoundaryTerms: boolean | null;
    includesTimeDerivativeTerms: boolean | null;
    includesTransitionKernelTerms: boolean | null;
    toleranceLInf: number | null;
    overallResidualLInf: number | null;
    terms: Nhm2SwitchingConservationTermV1[];
    conservationStatus: Nhm2TimeDependentSourceCampaignStatus;
    blockers: string[];
  };
  timeAveraging: {
    averagingWindowSeconds: number | null;
    cycleAverageSourceFixed: boolean | null;
    averagedSourceTensorRef: string | null;
  };
  backreaction: {
    dynamicGeometryRef: string | null;
    effectiveGeometryRef: string | null;
    residualLInf: number | null;
    residualL2: number | null;
    bounded: boolean | null;
    status: Nhm2TimeDependentSourceCampaignStatus;
    blockers: string[];
  };
  stability: {
    horizonStatus: Nhm2TimeDependentSourceCampaignStatus;
    blueshiftStatus: Nhm2TimeDependentSourceCampaignStatus;
    particleAccumulationStatus: Nhm2TimeDependentSourceCampaignStatus;
    perturbativeStabilityStatus: Nhm2TimeDependentSourceCampaignStatus;
    blockers: string[];
  };
  gates: Nhm2TimeDependentSourceCampaignGateV1[];
  summary: {
    campaignPass: boolean;
    sourceIndependencePass: boolean;
    switchingConservationPass: boolean;
    frequencyConvergencePass: boolean;
    dynamicGeometryAgreementPass: boolean;
    fullRegionalTensorClosurePass: boolean;
    observerFamilyPass: boolean;
    qeiReceiptsPass: boolean;
    stabilityPass: boolean;
    firstBlocker: string;
    blockerCount: number;
  };
  claimBoundary: {
    diagnosticOnly: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
    staticEvidenceCannotPassDynamicCampaign: true;
  };
};

export type BuildNhm2TimeDependentSourceCampaignInput = {
  generatedAt?: string | null;
  laneId?: string | null;
  selectedProfileId?: string | null;
  runId?: string | null;
  chartId?: string | null;
  artifactRefs?: Partial<Nhm2TimeDependentSourceCampaignArtifactRefsV1> | null;
  sourceComponentAuthorityLedger?: Nhm2SourceComponentAuthorityLedgerArtifactV1 | null;
  regionalFullTensorResidual?: Nhm2RegionalFullTensorResidualArtifactV1 | null;
  sourceOffDiagonalShearAudit?: Nhm2SourceOffDiagonalShearAuditArtifactV1 | null;
  sourceMomentumDensityAudit?: Nhm2SourceMomentumDensityAuditArtifactV1 | null;
  momentumFrameProjectionReceipt?: Nhm2MomentumFrameProjectionReceiptV1 | null;
  metricRequiredMomentumDemandAudit?: Nhm2MetricRequiredMomentumDemandAuditV1 | null;
  metricMomentumRemediationTargets?: Nhm2MetricMomentumRemediationTargetsV1 | null;
  campaignFrontierDisposition?: Nhm2CampaignFrontierDispositionV1 | null;
  covariantConservationDiagnostic?: Nhm2CovariantConservationDiagnosticArtifactV1 | null;
  qeiWorldlineDossier?: Nhm2QeiWorldlineDossierV1 | null;
  observerRobustEnergyConditions?: Nhm2ObserverRobustEnergyConditionArtifactV1 | null;
  natarioInvariantAudit?: Nhm2NatarioInvariantAuditV1 | null;
  regionalSupportFunctionAtlas?: Nhm2RegionalSupportFunctionAtlasV1 | null;
  casimirMaterialReceipt?: CasimirMaterialReceiptV1 | null;
  coupledClosurePassCandidate?: Nhm2CoupledClosurePassCandidateArtifactV1 | null;
  regionalTensorPassPathHarness?: Nhm2RegionalTensorPassPathHarnessArtifactV1 | null;
  frequencyConvergence?: Nhm2FrequencyConvergenceEvidenceV1 | null;
  switchingConservation?: Nhm2SwitchingConservationEvidenceV1 | null;
  dynamicEffectiveGeometry?: Nhm2DynamicEffectiveGeometryEvidenceV1 | null;
  campaignStability?: Nhm2CampaignStabilityEvidenceV1 | null;
};

export type BuildNhm2FrequencyConvergenceEvidenceInput = {
  generatedAt?: string | null;
  baseFrequencyHz?: number | null;
  toleranceLInf?: number | null;
  fixedCycleAverageSource?: boolean | null;
  entries?: Array<{
    multiplier?: number | null;
    frequencyHz?: number | null;
    residualLInf?: number | null;
    residualL2?: number | null;
    blockers?: string[] | null;
  }> | null;
  blockers?: string[] | null;
};

export type BuildNhm2SwitchingConservationEvidenceInput = {
  generatedAt?: string | null;
  staticCovariantConservationRef?: string | null;
  scheduleRef?: string | null;
  sectorBoundaryRef?: string | null;
  switchingFunctionRef?: string | null;
  toleranceLInf?: number | null;
  terms?: Partial<Record<Nhm2SwitchingConservationTermId, number | null>> | null;
  includedTerms?: Partial<Record<Nhm2SwitchingConservationTermId, boolean | null>> | null;
  blockers?: string[] | null;
};

export type BuildNhm2DynamicEffectiveGeometryEvidenceInput = {
  generatedAt?: string | null;
  dynamicGeometryRef?: string | null;
  dynamicGeometryStatus?: Nhm2TimeDependentSourceCampaignStatus | null;
  dynamicGeometryBlockers?: string[] | null;
  effectiveGeometryRef?: string | null;
  effectiveGeometryStatus?: Nhm2TimeDependentSourceCampaignStatus | null;
  effectiveGeometryBlockers?: string[] | null;
  averagingWindowSeconds?: number | null;
  cycleAverageSourceFixed?: boolean | null;
  averagedSourceTensorRef?: string | null;
  backreactionResidualRef?: string | null;
  residualLInf?: number | null;
  residualL2?: number | null;
  toleranceLInf?: number | null;
  bounded?: boolean | null;
  blockers?: string[] | null;
};

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const uniqueText = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => asText(value))
        .filter((value): value is string => value != null),
    ),
  );

const toFinite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const DEFAULT_DYNAMIC_TOLERANCE_LINF = 0.1;

const maxFinite = (values: Array<number | null | undefined>): number | null => {
  const finite = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  return finite.length === 0 ? null : Math.max(...finite);
};

export const buildNhm2FrequencyConvergenceEvidence = (
  input: BuildNhm2FrequencyConvergenceEvidenceInput,
): Nhm2FrequencyConvergenceEvidenceV1 => {
  const tolerance = input.toleranceLInf ?? DEFAULT_DYNAMIC_TOLERANCE_LINF;
  const entries = (input.entries ?? [])
    .map((entry) => {
      const multiplier = toFinite(entry.multiplier);
      if (multiplier == null) return null;
      const residualLInf = toFinite(entry.residualLInf);
      const explicitBlockers = uniqueText(entry.blockers ?? []);
      const blockers = uniqueText([
        ...explicitBlockers,
        residualLInf == null ? "frequency_residual_linf_missing" : null,
        residualLInf != null && residualLInf > tolerance
          ? "frequency_residual_linf_exceeds_tolerance"
          : null,
      ]);
      return {
        multiplier,
        frequencyHz: toFinite(entry.frequencyHz),
        residualLInf,
        residualL2: toFinite(entry.residualL2),
        pass: blockers.length === 0,
        blockers,
      };
    })
    .filter(
      (entry): entry is Nhm2FrequencyConvergenceEvidenceV1["entries"][number] =>
        entry != null,
    );
  const multipliers = Array.from(
    new Set(entries.map((entry) => entry.multiplier)),
  ).sort((a, b) => a - b);
  const requiredMultipliers = [1, 2, 4];
  const blockers = uniqueText([
    ...(input.blockers ?? []),
    input.fixedCycleAverageSource === true ? null : "cycle_average_source_not_fixed",
    ...requiredMultipliers.map((multiplier) =>
      multipliers.includes(multiplier)
        ? null
        : `frequency_multiplier_missing:${multiplier}`,
    ),
    entries.length < requiredMultipliers.length
      ? "frequency_ladder_too_short"
      : null,
    ...entries.flatMap((entry) =>
      entry.pass === true
        ? []
        : entry.blockers.map((blocker) => `${entry.multiplier}:${blocker}`),
    ),
  ]);
  return {
    contractVersion: "nhm2_frequency_convergence_evidence/v1",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    baseFrequencyHz: input.baseFrequencyHz ?? null,
    toleranceLInf: tolerance,
    fixedCycleAverageSource: input.fixedCycleAverageSource === true,
    multipliers,
    entries,
    convergenceStatus: blockers.length === 0 ? "pass" : "fail",
    blockers,
  };
};

export const buildNhm2SwitchingConservationEvidence = (
  input: BuildNhm2SwitchingConservationEvidenceInput,
): Nhm2SwitchingConservationEvidenceV1 => {
  const tolerance = input.toleranceLInf ?? DEFAULT_DYNAMIC_TOLERANCE_LINF;
  const terms = NHM2_SWITCHING_CONSERVATION_TERM_IDS.map((termId) => {
    const residualLInf = toFinite(input.terms?.[termId]);
    const included = input.includedTerms?.[termId] ?? residualLInf != null;
    const blockers = uniqueText([
      included ? null : `${termId}_term_missing`,
      residualLInf == null ? `${termId}_residual_linf_missing` : null,
      residualLInf != null && residualLInf > tolerance
        ? `${termId}_residual_linf_exceeds_tolerance`
        : null,
    ]);
    return {
      termId,
      included: included === true,
      residualLInf,
      toleranceLInf: tolerance,
      pass: blockers.length === 0,
      blockers,
    };
  });
  const overallResidualLInf = maxFinite(terms.map((term) => term.residualLInf));
  const blockers = uniqueText([
    ...(input.blockers ?? []),
    input.scheduleRef == null ? "switching_schedule_ref_missing" : null,
    input.sectorBoundaryRef == null ? "sector_boundary_ref_missing" : null,
    input.switchingFunctionRef == null ? "switching_function_ref_missing" : null,
    input.staticCovariantConservationRef == null
      ? "static_covariant_conservation_ref_missing"
      : null,
    ...terms.flatMap((term) =>
      term.pass === true
        ? []
        : term.blockers.map((blocker) => `${term.termId}:${blocker}`),
    ),
  ]);
  const hasTerm = (termId: Nhm2SwitchingConservationTermId) =>
    terms.find((term) => term.termId === termId)?.included === true;
  return {
    contractVersion: "nhm2_switching_covariant_conservation_evidence/v1",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    staticCovariantConservationRef: input.staticCovariantConservationRef ?? null,
    scheduleRef: input.scheduleRef ?? null,
    sectorBoundaryRef: input.sectorBoundaryRef ?? null,
    switchingFunctionRef: input.switchingFunctionRef ?? null,
    includesRegionalSupportDerivatives: hasTerm("regional_support_derivative"),
    includesSectorBoundaryTerms: hasTerm("sector_boundary"),
    includesTimeDerivativeTerms: hasTerm("time_derivative"),
    includesTransitionKernelTerms: hasTerm("transition_kernel"),
    toleranceLInf: tolerance,
    overallResidualLInf,
    terms,
    conservationStatus: blockers.length === 0 ? "pass" : "fail",
    blockers,
  };
};

export const buildNhm2DynamicEffectiveGeometryEvidence = (
  input: BuildNhm2DynamicEffectiveGeometryEvidenceInput,
): Nhm2DynamicEffectiveGeometryEvidenceV1 => {
  const tolerance = input.toleranceLInf ?? DEFAULT_DYNAMIC_TOLERANCE_LINF;
  const residualLInf = toFinite(input.residualLInf);
  const averagingWindowSeconds = toFinite(input.averagingWindowSeconds);
  const dynamicGeometryRef = asText(input.dynamicGeometryRef);
  const effectiveGeometryRef = asText(input.effectiveGeometryRef);
  const averagedSourceTensorRef = asText(input.averagedSourceTensorRef);
  const backreactionResidualRef = asText(input.backreactionResidualRef);
  const blockers = uniqueText([
    ...(input.blockers ?? []),
    dynamicGeometryRef == null ? "dynamic_geometry_ref_missing" : null,
    dynamicGeometryRef != null && input.dynamicGeometryStatus !== "pass"
      ? input.dynamicGeometryBlockers?.[0] ?? "dynamic_geometry_samples_not_pass"
      : null,
    ...(dynamicGeometryRef != null && input.dynamicGeometryStatus !== "pass"
      ? (input.dynamicGeometryBlockers ?? []).slice(1)
      : []),
    effectiveGeometryRef == null ? "effective_geometry_ref_missing" : null,
    effectiveGeometryRef != null && input.effectiveGeometryStatus === "fail"
      ? input.effectiveGeometryBlockers?.[0] ?? "effective_geometry_not_pass"
      : null,
    ...(effectiveGeometryRef != null && input.effectiveGeometryStatus === "fail"
      ? (input.effectiveGeometryBlockers ?? []).slice(1)
      : []),
    averagingWindowSeconds == null ? "averaging_window_seconds_missing" : null,
    averagingWindowSeconds != null && averagingWindowSeconds <= 0
      ? "averaging_window_seconds_nonpositive"
      : null,
    input.cycleAverageSourceFixed === true ? null : "cycle_average_source_not_fixed",
    averagedSourceTensorRef == null ? "averaged_source_tensor_ref_missing" : null,
    residualLInf == null ? "dynamic_effective_residual_linf_missing" : null,
    residualLInf != null && residualLInf > tolerance
      ? "dynamic_effective_residual_linf_exceeds_tolerance"
      : null,
    input.bounded === true ? null : "backreaction_residual_not_bounded",
  ]);
  return {
    contractVersion: "nhm2_dynamic_effective_geometry_evidence/v1",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    dynamicGeometryRef,
    effectiveGeometryRef,
    averagingWindowSeconds,
    cycleAverageSourceFixed: input.cycleAverageSourceFixed ?? null,
    averagedSourceTensorRef,
    backreactionResidualRef,
    residualLInf,
    residualL2: toFinite(input.residualL2),
    bounded: input.bounded ?? null,
    agreementStatus: blockers.length === 0 ? "pass" : "fail",
    blockers,
  };
};

const refs = (
  input: Partial<Nhm2TimeDependentSourceCampaignArtifactRefsV1> | null | undefined,
): Nhm2TimeDependentSourceCampaignArtifactRefsV1 => ({
  sourceComponentAuthorityLedger: input?.sourceComponentAuthorityLedger ?? null,
  regionalFullTensorResidual: input?.regionalFullTensorResidual ?? null,
  sourceOffDiagonalShearAudit: input?.sourceOffDiagonalShearAudit ?? null,
  sourceMomentumDensityAudit: input?.sourceMomentumDensityAudit ?? null,
  momentumFrameProjectionReceipt: input?.momentumFrameProjectionReceipt ?? null,
  metricRequiredMomentumDemandAudit: input?.metricRequiredMomentumDemandAudit ?? null,
  metricMomentumRemediationTargets: input?.metricMomentumRemediationTargets ?? null,
  campaignFrontierDisposition: input?.campaignFrontierDisposition ?? null,
  covariantConservationDiagnostic: input?.covariantConservationDiagnostic ?? null,
  qeiWorldlineDossier: input?.qeiWorldlineDossier ?? null,
  observerRobustEnergyConditions: input?.observerRobustEnergyConditions ?? null,
  natarioInvariantAudit: input?.natarioInvariantAudit ?? null,
  regionalSupportFunctionAtlas: input?.regionalSupportFunctionAtlas ?? null,
  casimirMaterialReceipt: input?.casimirMaterialReceipt ?? null,
  coupledClosurePassCandidate: input?.coupledClosurePassCandidate ?? null,
  regionalTensorPassPathHarness: input?.regionalTensorPassPathHarness ?? null,
  sourceModelRef: input?.sourceModelRef ?? null,
  metricRequiredTensorRef: input?.metricRequiredTensorRef ?? null,
  dynamicGeometryRef: input?.dynamicGeometryRef ?? null,
  effectiveGeometryRef: input?.effectiveGeometryRef ?? null,
  frequencyConvergence: input?.frequencyConvergence ?? null,
  switchingConservation: input?.switchingConservation ?? null,
  dynamicEffectiveGeometry: input?.dynamicEffectiveGeometry ?? null,
  campaignStability: input?.campaignStability ?? null,
});

const gate = (input: {
  gateId: Nhm2TimeDependentSourceCampaignGateId;
  status: Nhm2TimeDependentSourceCampaignStatus;
  blockers?: Array<string | null | undefined>;
  warnings?: Array<string | null | undefined>;
  primaryMetric?: string | null;
}): Nhm2TimeDependentSourceCampaignGateV1 => ({
  gateId: input.gateId,
  status: input.status,
  pass: input.status === "pass",
  blockers: uniqueText(input.blockers ?? []),
  warnings: uniqueText(input.warnings ?? []),
  primaryMetric: asText(input.primaryMetric),
});

const firstNonPassingGateBlocker = (
  gates: Nhm2TimeDependentSourceCampaignGateV1[],
): string => {
  const first = gates.find((entry) => entry.status !== "pass");
  if (first == null) return "none";
  return first.blockers[0] ?? `${first.gateId}:non_pass`;
};

const sourceIndependenceGate = (
  ledger: Nhm2SourceComponentAuthorityLedgerArtifactV1 | null | undefined,
): Nhm2TimeDependentSourceCampaignGateV1 => {
  if (ledger == null) {
    return gate({
      gateId: "source_independence",
      status: "missing",
      blockers: ["source_component_authority_ledger_missing"],
    });
  }
  const blockers = uniqueText([
    ledger.summary.anyMetricEcho ? "source_target_echo_detected" : null,
    ledger.summary.anyScalarProxy ? "source_component_scalar_proxy_present" : null,
    ledger.summary.anyMissing ? "source_component_missing" : null,
    ledger.summary.anyReducedOrder ? "source_component_reduced_order_declared" : null,
    ledger.summary.sourceSideComponentAuthorityComplete
      ? null
      : ledger.summary.firstBlocker ?? "source_side_component_authority_incomplete",
  ]);
  return gate({
    gateId: "source_independence",
    status: ledger.summary.anyMetricEcho ? "fail" : blockers.length === 0 ? "pass" : "review",
    blockers,
    primaryMetric: `sourceSideComponentAuthorityComplete=${ledger.summary.sourceSideComponentAuthorityComplete}`,
  });
};

const frequencyGate = (
  evidence: Nhm2FrequencyConvergenceEvidenceV1 | null | undefined,
): Nhm2TimeDependentSourceCampaignGateV1 => {
  if (evidence == null) {
    return gate({
      gateId: "frequency_convergence",
      status: "missing",
      blockers: ["frequency_convergence_evidence_missing"],
      warnings: ["static_artifacts_cannot_substitute_for_frequency_ladder"],
    });
  }
  const requiredMultipliers = [1, 2, 4];
  const blockers = uniqueText([
    evidence.fixedCycleAverageSource ? null : "cycle_average_source_not_fixed",
    ...requiredMultipliers.map((multiplier) =>
      evidence.multipliers.includes(multiplier)
        ? null
        : `frequency_multiplier_missing:${multiplier}`,
    ),
    ...evidence.entries
      .filter((entry) => entry.pass !== true)
      .flatMap((entry) =>
        entry.blockers.length > 0
          ? entry.blockers
          : [`frequency_entry_not_pass:${entry.multiplier}`],
      ),
    ...evidence.blockers,
  ]);
  return gate({
    gateId: "frequency_convergence",
    status:
      evidence.convergenceStatus === "pass" && blockers.length === 0
        ? "pass"
        : evidence.convergenceStatus === "fail"
          ? "fail"
          : "review",
    blockers,
    primaryMetric: `multipliers=${evidence.multipliers.join(",")}`,
  });
};

const switchingGate = (
  evidence: Nhm2SwitchingConservationEvidenceV1 | null | undefined,
  staticConservation: Nhm2CovariantConservationDiagnosticArtifactV1 | null | undefined,
): Nhm2TimeDependentSourceCampaignGateV1 => {
  if (evidence == null) {
    return gate({
      gateId: "switching_covariant_conservation",
      status: "missing",
      blockers: ["switching_conservation_evidence_missing"],
      warnings:
        staticConservation == null
          ? ["static_covariant_conservation_missing_too"]
          : ["static_covariant_conservation_cannot_substitute_for_switching_terms"],
    });
  }
  const blockers = uniqueText([
    evidence.includesRegionalSupportDerivatives
      ? null
      : "regional_support_derivative_terms_missing",
    evidence.includesSectorBoundaryTerms ? null : "sector_boundary_terms_missing",
    evidence.includesTimeDerivativeTerms ? null : "time_derivative_terms_missing",
    evidence.includesTransitionKernelTerms ? null : "transition_kernel_terms_missing",
    ...evidence.blockers,
  ]);
  return gate({
    gateId: "switching_covariant_conservation",
    status:
      evidence.conservationStatus === "pass" && blockers.length === 0
        ? "pass"
        : evidence.conservationStatus === "fail"
          ? "fail"
          : "review",
    blockers,
    primaryMetric: `overallResidualLInf=${evidence.overallResidualLInf ?? "missing"}`,
  });
};

const dynamicGeometryGate = (
  evidence: Nhm2DynamicEffectiveGeometryEvidenceV1 | null | undefined,
): Nhm2TimeDependentSourceCampaignGateV1 => {
  if (evidence == null) {
    return gate({
      gateId: "dynamic_effective_geometry_agreement",
      status: "missing",
      blockers: ["dynamic_effective_geometry_evidence_missing"],
      warnings: ["effective_source_geometry_static_summary_cannot_substitute_for_dynamic_geometry"],
    });
  }
  const blockers = uniqueText([
    evidence.dynamicGeometryRef == null ? "dynamic_geometry_ref_missing" : null,
    ...evidence.blockers,
    evidence.effectiveGeometryRef == null ? "effective_geometry_ref_missing" : null,
    evidence.cycleAverageSourceFixed === true ? null : "cycle_average_source_not_fixed",
    evidence.bounded === true ? null : "backreaction_residual_not_bounded",
  ]);
  return gate({
    gateId: "dynamic_effective_geometry_agreement",
    status:
      evidence.agreementStatus === "pass" && blockers.length === 0
        ? "pass"
        : evidence.agreementStatus === "fail"
          ? "fail"
          : "review",
    blockers,
    primaryMetric: `residualLInf=${evidence.residualLInf ?? "missing"}`,
  });
};

const fullTensorGate = (
  residual: Nhm2RegionalFullTensorResidualArtifactV1 | null | undefined,
  shearAudit: Nhm2SourceOffDiagonalShearAuditArtifactV1 | null | undefined,
  momentumAudit: Nhm2SourceMomentumDensityAuditArtifactV1 | null | undefined,
  momentumFrameProjection: Nhm2MomentumFrameProjectionReceiptV1 | null | undefined,
  metricMomentumDemandAudit: Nhm2MetricRequiredMomentumDemandAuditV1 | null | undefined,
  metricMomentumRemediationTargets: Nhm2MetricMomentumRemediationTargetsV1 | null | undefined,
  campaignFrontierDisposition: Nhm2CampaignFrontierDispositionV1 | null | undefined,
): Nhm2TimeDependentSourceCampaignGateV1 => {
  if (residual == null) {
    return gate({
      gateId: "full_regional_tensor_closure",
      status: "missing",
      blockers: ["regional_full_tensor_residual_missing"],
    });
  }
  const missingComponentBlockers = residual.regions.flatMap((region) => [
    ...region.missingMetricComponentIds.map(
      (componentId) => `${region.regionId}:${componentId}:metric_component_missing`,
    ),
    ...region.missingTileComponentIds.map(
      (componentId) => `${region.regionId}:${componentId}:tile_component_missing`,
    ),
  ]);
  const shearAuditBlockers = uniqueText([
    shearAudit?.summary.currentDeclaredSourceModelFalsified
      ? "source_off_diagonal_current_declared_model_falsified"
      : null,
    shearAudit?.summary.falsifierCandidate &&
    !shearAudit.summary.currentDeclaredSourceModelFalsified
      ? "source_off_diagonal_shear_falsifier_candidate"
      : null,
    shearAudit?.summary.anyShearMechanismMissing
      ? "source_off_diagonal_shear_mechanism_missing"
      : null,
  ]);
  const momentumAuditBlockers = uniqueText([
    campaignFrontierDisposition?.disposition.status === "current_profile_rejected"
      ? "metric_momentum_current_profile_rejected_for_campaign"
      : null,
    metricMomentumDemandAudit?.summary.currentMetricProfileFalsified
      ? "metric_required_momentum_density_current_profile_falsified"
      : null,
    momentumAudit?.summary.anyMetricRequiredCausalMomentumBoundViolation &&
    momentumAudit.summary.causalMomentumBoundApplicabilityStatus !== "applicable" &&
    momentumFrameProjection == null
      ? "momentum_density_causal_bound_frame_projection_missing"
      : null,
    momentumFrameProjection?.summary.causalBoundApplicabilityStatus === "missing"
      ? "momentum_density_causal_bound_frame_projection_missing"
      : null,
    momentumFrameProjection?.summary.causalBoundApplicabilityStatus === "blocked"
      ? "momentum_density_causal_bound_frame_projection_blocked"
      : null,
    metricMomentumDemandAudit == null &&
    momentumFrameProjection?.summary.anyProjectedMetricRequiredCausalMomentumBoundViolation
      ? "metric_required_momentum_density_causal_bound_exceeded"
      : null,
    metricMomentumDemandAudit != null &&
    !metricMomentumDemandAudit.summary.currentMetricProfileFalsified &&
    metricMomentumDemandAudit.summary.anyProjectedMetricRequiredCausalMomentumBoundViolation
      ? "metric_required_momentum_density_causal_bound_exceeded"
      : null,
    momentumAudit?.summary.causalMaterialMomentumBoundFalsifier
      ? "metric_required_momentum_density_causal_bound_exceeded"
      : null,
    momentumAudit?.summary.currentDeclaredSourceModelFalsified
      ? "source_momentum_density_current_declared_model_falsified"
      : null,
    momentumAudit?.summary.falsifierCandidate &&
    !momentumAudit.summary.currentDeclaredSourceModelFalsified
      ? "source_momentum_density_falsifier_candidate"
      : null,
    momentumAudit?.summary.anyMomentumMechanismMissing
      ? "source_momentum_density_mechanism_missing"
      : null,
  ]);
  const blockers = uniqueText([
    ...shearAuditBlockers,
    ...momentumAuditBlockers,
    residual.summary.allRequiredComponentsPresent
      ? null
      : "regional_full_tensor_components_missing",
    residual.summary.fullTensorResidualsPass
      ? null
      : residual.summary.firstBlocker ?? "regional_full_tensor_residual_not_pass",
    ...missingComponentBlockers,
  ]);
  const warnings = uniqueText([
    shearAudit == null ? "source_off_diagonal_shear_audit_missing" : null,
    momentumAudit == null ? "source_momentum_density_audit_missing" : null,
    momentumAudit != null && momentumFrameProjection == null
      ? "momentum_frame_projection_receipt_missing"
      : null,
    shearAudit?.summary.uniformFractionalShearAnsatzDetected
      ? "source_off_diagonal_uniform_fractional_shear_ansatz"
      : null,
    momentumAudit?.summary.uniformFractionalMomentumAnsatzDetected
      ? "source_momentum_density_uniform_fractional_ansatz"
      : null,
  ]);
  const worstRegion = residual.regions.find(
    (region) => region.regionId === residual.summary.worstRegionId,
  );
  const worstFamily = worstRegion?.familyResiduals?.find(
    (family) => family.family === residual.summary.worstResidualFamily,
  );
  return gate({
    gateId: "full_regional_tensor_closure",
    status:
      residual.summary.allRequiredComponentsPresent &&
      residual.summary.fullTensorResidualsPass &&
      blockers.length === 0
        ? "pass"
        : residual.summary.allRequiredComponentsPresent
          ? "fail"
          : "blocked",
    blockers,
    primaryMetric: [
      `worstRelResidual=${residual.summary.worstRelResidual ?? "missing"}`,
      `family=${residual.summary.worstResidualFamily ?? "missing"}`,
      `component=${residual.summary.worstComponentId ?? "missing"}`,
      `region=${residual.summary.worstRegionId ?? "missing"}`,
      `currentToAllowedMagnitudeRatio=${worstFamily?.maxCurrentToAllowedMagnitudeRatio ?? "missing"}`,
      `shearAuditWorstRatio=${shearAudit?.summary.worstCurrentToAllowedMagnitudeRatio ?? "missing"}`,
      `shearAuditWorstSuppression=${shearAudit?.summary.worstFractionalSuppressionToRequirement ?? "missing"}`,
      `momentumAuditWorstAmplification=${momentumAudit?.summary.worstRequiredAmplificationToPass ?? "missing"}`,
      `momentumAuditWorstFractionalAmplification=${momentumAudit?.summary.worstFractionalAmplificationToRequirement ?? "missing"}`,
      `momentumAuditWorstMetricRequiredRatio=${momentumAudit?.summary.worstMetricRequiredMomentumToEnergyRatio ?? "missing"}`,
      `momentumAuditCausalBoundApplicability=${momentumAudit?.summary.causalMomentumBoundApplicabilityStatus ?? "missing"}`,
      `momentumFrameProjection=${momentumFrameProjection?.summary.causalBoundApplicabilityStatus ?? "missing"}`,
      `metricMomentumDemandWorstRatio=${metricMomentumDemandAudit?.summary.worstProjectedMetricRequiredMomentumToEnergyRatio ?? "missing"}`,
      `metricMomentumDemandFalsified=${metricMomentumDemandAudit?.summary.currentMetricProfileFalsified ?? "missing"}`,
      `metricMomentumWorstSuppression=${metricMomentumRemediationTargets?.summary.worstRequiredSuppressionFactor ?? "missing"}`,
      `metricMomentumNonResolvableForCurrentProfile=${metricMomentumRemediationTargets?.summary.nonResolvableForCurrentProfile ?? "missing"}`,
      `campaignFrontierDisposition=${campaignFrontierDisposition?.disposition.status ?? "missing"}`,
    ].join(";"),
    warnings,
  });
};

const observerGate = (
  observer: Nhm2ObserverRobustEnergyConditionArtifactV1 | null | undefined,
): Nhm2TimeDependentSourceCampaignGateV1 => {
  if (observer == null) {
    return gate({
      gateId: "observer_family_energy_conditions",
      status: "missing",
      blockers: ["observer_robust_energy_conditions_missing"],
    });
  }
  const blockers = uniqueText([
    observer.summary.robustCheckComplete ? null : "observer_robust_check_incomplete",
    observer.summary.eulerianOnly ? "observer_check_eulerian_only" : null,
    observer.summary.anyViolation ? "observer_family_energy_condition_violation" : null,
    ...observer.observerFamilies.flatMap((family) =>
      family.status === "pass"
        ? []
        : family.blockers.length > 0
          ? family.blockers.map((blocker) => `${family.familyId}:${blocker}`)
          : [`${family.familyId}:${family.status}`],
    ),
  ]);
  return gate({
    gateId: "observer_family_energy_conditions",
    status:
      observer.summary.anyViolation
        ? "fail"
        : observer.summary.robustCheckComplete && !observer.summary.eulerianOnly
          ? "pass"
          : "review",
    blockers,
    primaryMetric: `robustCheckComplete=${observer.summary.robustCheckComplete}`,
  });
};

const qeiGate = (
  dossier: Nhm2QeiWorldlineDossierV1 | null | undefined,
): Nhm2TimeDependentSourceCampaignGateV1 => {
  if (dossier == null) {
    return gate({
      gateId: "qei_worldline_receipts",
      status: "missing",
      blockers: ["qei_worldline_dossier_missing"],
    });
  }
  const blockers = uniqueText([
    dossier.summary.dossierComplete ? null : "qei_worldline_dossier_incomplete",
    dossier.summary.hasWallWorldline ? null : "qei_wall_worldline_missing",
    dossier.summary.allMarginsPass === true ? null : "qei_margin_not_pass",
    dossier.summary.anyProxy ? "qei_proxy_evidence_present" : null,
    ...dossier.worldlines.flatMap((worldline) =>
      worldline.blockers.map((blocker) => `${worldline.worldlineId}:${blocker}`),
    ),
  ]);
  return gate({
    gateId: "qei_worldline_receipts",
    status:
      dossier.summary.dossierComplete &&
      dossier.summary.hasWallWorldline &&
      dossier.summary.allMarginsPass === true &&
      !dossier.summary.anyProxy
        ? "pass"
        : "review",
    blockers,
    primaryMetric: `dossierComplete=${dossier.summary.dossierComplete}`,
  });
};

const stabilityGate = (
  evidence: Nhm2CampaignStabilityEvidenceV1 | null | undefined,
  natario: Nhm2NatarioInvariantAuditV1 | null | undefined,
): Nhm2TimeDependentSourceCampaignGateV1 => {
  if (evidence == null) {
    return gate({
      gateId: "horizon_blueshift_particle_stability",
      status: "missing",
      blockers: ["campaign_stability_evidence_missing"],
      warnings:
        natario == null
          ? ["natario_invariant_audit_missing"]
          : [
              "natario_invariant_audit_cannot_substitute_for_horizon_particle_accumulation_receipts",
            ],
    });
  }
  const blockers = uniqueText([
    evidence.horizonStatus === "pass" ? null : "horizon_check_not_pass",
    evidence.blueshiftStatus === "pass" ? null : "blueshift_check_not_pass",
    evidence.particleAccumulationStatus === "pass"
      ? null
      : "particle_accumulation_check_not_pass",
    evidence.perturbativeStabilityStatus === "pass"
      ? null
      : "perturbative_stability_check_not_pass",
    ...evidence.blockers,
  ]);
  return gate({
    gateId: "horizon_blueshift_particle_stability",
    status: blockers.length === 0 ? "pass" : "review",
    blockers,
    primaryMetric: `horizon=${evidence.horizonStatus};particle=${evidence.particleAccumulationStatus}`,
  });
};

export const buildNhm2TimeDependentSourceCampaign = (
  input: BuildNhm2TimeDependentSourceCampaignInput,
): Nhm2TimeDependentSourceCampaignArtifactV1 => {
  const artifactRefs = refs(input.artifactRefs);
  const sourceGate = sourceIndependenceGate(input.sourceComponentAuthorityLedger);
  const gates = [
    sourceGate,
    switchingGate(input.switchingConservation, input.covariantConservationDiagnostic),
    frequencyGate(input.frequencyConvergence),
    dynamicGeometryGate(input.dynamicEffectiveGeometry),
    fullTensorGate(
      input.regionalFullTensorResidual,
      input.sourceOffDiagonalShearAudit,
      input.sourceMomentumDensityAudit,
      input.momentumFrameProjectionReceipt,
      input.metricRequiredMomentumDemandAudit,
      input.metricMomentumRemediationTargets,
      input.campaignFrontierDisposition,
    ),
    observerGate(input.observerRobustEnergyConditions),
    qeiGate(input.qeiWorldlineDossier),
    stabilityGate(input.campaignStability, input.natarioInvariantAudit),
  ];
  const gateById = new Map(gates.map((entry) => [entry.gateId, entry]));
  const getPass = (gateId: Nhm2TimeDependentSourceCampaignGateId) =>
    gateById.get(gateId)?.pass === true;
  const blockerCount = gates.reduce((sum, entry) => sum + entry.blockers.length, 0);
  const sourceLedger = input.sourceComponentAuthorityLedger;
  const dynamic = input.dynamicEffectiveGeometry;
  const switching = input.switchingConservation;
  const frequency = input.frequencyConvergence;
  const stability = input.campaignStability;
  const atlasHash = getNhm2RegionalSupportFunctionAtlasHash(
    input.regionalSupportFunctionAtlas,
  );
  return {
    contractVersion: NHM2_TIME_DEPENDENT_SOURCE_CAMPAIGN_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId:
      input.laneId ??
      sourceLedger?.laneId ??
      input.regionalFullTensorResidual?.laneId ??
      "nhm2_shift_lapse",
    selectedProfileId:
      input.selectedProfileId ??
      sourceLedger?.selectedProfileId ??
      input.regionalFullTensorResidual?.selectedProfileId ??
      "unknown",
    runId:
      input.runId ??
      sourceLedger?.runId ??
      input.regionalFullTensorResidual?.runId ??
      "unknown",
    chartId: input.chartId ?? input.regionalSupportFunctionAtlas?.runIdentity.chartId ?? "unknown",
    atlasRef: artifactRefs.regionalSupportFunctionAtlas,
    atlasHash: atlasHash ?? input.regionalSupportFunctionAtlas?.provenance.atlasHash ?? null,
    artifactRefs,
    sourceIndependence: {
      independentlyDerivedTileMaterialTensor:
        sourceLedger == null
          ? null
          : sourceGate.pass &&
            !sourceLedger.summary.anyMetricEcho &&
            !sourceLedger.summary.anyScalarProxy &&
            !sourceLedger.summary.anyMissing,
      copiedFromMetricRequiredTensor: sourceLedger == null ? null : sourceLedger.summary.anyMetricEcho,
      fittedToMetricResidual: sourceLedger == null ? null : false,
      targetEchoDetected: sourceLedger == null ? null : sourceLedger.summary.anyMetricEcho,
      blockers: sourceGate.blockers,
    },
    frequencyLadder: {
      baseFrequencyHz: frequency?.baseFrequencyHz ?? null,
      toleranceLInf: frequency?.toleranceLInf ?? null,
      multipliers: frequency?.multipliers ?? [],
      fixedCycleAverageSource: frequency?.fixedCycleAverageSource ?? null,
      entries: frequency?.entries ?? [],
      convergenceStatus: frequency?.convergenceStatus ?? "missing",
      blockers:
        gateById.get("frequency_convergence")?.blockers ??
        ["frequency_convergence_evidence_missing"],
    },
    switchingSchedule: {
      scheduleRef: switching?.scheduleRef ?? null,
      sectorBoundaryRef: switching?.sectorBoundaryRef ?? null,
      switchingFunctionRef: switching?.switchingFunctionRef ?? null,
      includesRegionalSupportDerivatives:
        switching?.includesRegionalSupportDerivatives ?? null,
      includesSectorBoundaryTerms: switching?.includesSectorBoundaryTerms ?? null,
      includesTimeDerivativeTerms: switching?.includesTimeDerivativeTerms ?? null,
      includesTransitionKernelTerms: switching?.includesTransitionKernelTerms ?? null,
      toleranceLInf: switching?.toleranceLInf ?? null,
      overallResidualLInf: switching?.overallResidualLInf ?? null,
      terms: switching?.terms ?? [],
      conservationStatus: switching?.conservationStatus ?? "missing",
      blockers:
        gateById.get("switching_covariant_conservation")?.blockers ??
        ["switching_conservation_evidence_missing"],
    },
    timeAveraging: {
      averagingWindowSeconds: dynamic?.averagingWindowSeconds ?? null,
      cycleAverageSourceFixed: dynamic?.cycleAverageSourceFixed ?? null,
      averagedSourceTensorRef: dynamic?.averagedSourceTensorRef ?? null,
    },
    backreaction: {
      dynamicGeometryRef: dynamic?.dynamicGeometryRef ?? artifactRefs.dynamicGeometryRef,
      effectiveGeometryRef: dynamic?.effectiveGeometryRef ?? artifactRefs.effectiveGeometryRef,
      residualLInf: dynamic?.residualLInf ?? null,
      residualL2: dynamic?.residualL2 ?? null,
      bounded: dynamic?.bounded ?? null,
      status: dynamic?.agreementStatus ?? "missing",
      blockers:
        gateById.get("dynamic_effective_geometry_agreement")?.blockers ??
        ["dynamic_effective_geometry_evidence_missing"],
    },
    stability: {
      horizonStatus: stability?.horizonStatus ?? "missing",
      blueshiftStatus: stability?.blueshiftStatus ?? "missing",
      particleAccumulationStatus: stability?.particleAccumulationStatus ?? "missing",
      perturbativeStabilityStatus:
        stability?.perturbativeStabilityStatus ??
        input.natarioInvariantAudit?.stability.convergenceStatus ??
        "missing",
      blockers:
        gateById.get("horizon_blueshift_particle_stability")?.blockers ??
        ["campaign_stability_evidence_missing"],
    },
    gates,
    summary: {
      campaignPass: gates.every((entry) => entry.pass),
      sourceIndependencePass: getPass("source_independence"),
      switchingConservationPass: getPass("switching_covariant_conservation"),
      frequencyConvergencePass: getPass("frequency_convergence"),
      dynamicGeometryAgreementPass: getPass("dynamic_effective_geometry_agreement"),
      fullRegionalTensorClosurePass: getPass("full_regional_tensor_closure"),
      observerFamilyPass: getPass("observer_family_energy_conditions"),
      qeiReceiptsPass: getPass("qei_worldline_receipts"),
      stabilityPass: getPass("horizon_blueshift_particle_stability"),
      firstBlocker: firstNonPassingGateBlocker(gates),
      blockerCount,
    },
    claimBoundary: {
      diagnosticOnly: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
      staticEvidenceCannotPassDynamicCampaign: true,
    },
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) &&
  value.every((entry) => typeof entry === "number" && Number.isFinite(entry));

const isNullableText = (value: unknown): value is string | null =>
  value === null || (typeof value === "string" && value.trim().length > 0);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isStatus = (value: unknown): value is Nhm2TimeDependentSourceCampaignStatus =>
  NHM2_TIME_DEPENDENT_SOURCE_CAMPAIGN_STATUS_VALUES.includes(
    value as Nhm2TimeDependentSourceCampaignStatus,
  );

const isGate = (value: unknown): value is Nhm2TimeDependentSourceCampaignGateV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    NHM2_TIME_DEPENDENT_SOURCE_CAMPAIGN_GATE_IDS.includes(
      record.gateId as Nhm2TimeDependentSourceCampaignGateId,
    ) &&
    isStatus(record.status) &&
    typeof record.pass === "boolean" &&
    record.pass === (record.status === "pass") &&
    isStringArray(record.blockers) &&
    isStringArray(record.warnings) &&
    isNullableText(record.primaryMetric)
  );
};

const isArtifactRefs = (
  value: unknown,
): value is Nhm2TimeDependentSourceCampaignArtifactRefsV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isNullableText(record.sourceComponentAuthorityLedger) &&
    isNullableText(record.regionalFullTensorResidual) &&
    isNullableText(record.sourceOffDiagonalShearAudit) &&
    isNullableText(record.sourceMomentumDensityAudit) &&
    isNullableText(record.momentumFrameProjectionReceipt) &&
    isNullableText(record.metricRequiredMomentumDemandAudit) &&
    isNullableText(record.metricMomentumRemediationTargets) &&
    isNullableText(record.campaignFrontierDisposition) &&
    isNullableText(record.covariantConservationDiagnostic) &&
    isNullableText(record.qeiWorldlineDossier) &&
    isNullableText(record.observerRobustEnergyConditions) &&
    isNullableText(record.natarioInvariantAudit) &&
    isNullableText(record.regionalSupportFunctionAtlas) &&
    isNullableText(record.casimirMaterialReceipt) &&
    isNullableText(record.coupledClosurePassCandidate) &&
    isNullableText(record.regionalTensorPassPathHarness) &&
    isNullableText(record.sourceModelRef) &&
    isNullableText(record.metricRequiredTensorRef) &&
    isNullableText(record.dynamicGeometryRef) &&
    isNullableText(record.effectiveGeometryRef) &&
    isNullableText(record.frequencyConvergence) &&
    isNullableText(record.switchingConservation) &&
    isNullableText(record.dynamicEffectiveGeometry) &&
    isNullableText(record.campaignStability)
  );
};

const isFrequencyEntry = (
  value: unknown,
): value is Nhm2FrequencyConvergenceEvidenceV1["entries"][number] => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    typeof record.multiplier === "number" &&
    Number.isFinite(record.multiplier) &&
    isNullableNumber(record.frequencyHz) &&
    isNullableNumber(record.residualLInf) &&
    isNullableNumber(record.residualL2) &&
    (record.pass === null || typeof record.pass === "boolean") &&
    isStringArray(record.blockers)
  );
};

const isSwitchingTerm = (
  value: unknown,
): value is Nhm2SwitchingConservationTermV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    NHM2_SWITCHING_CONSERVATION_TERM_IDS.includes(
      record.termId as Nhm2SwitchingConservationTermId,
    ) &&
    typeof record.included === "boolean" &&
    isNullableNumber(record.residualLInf) &&
    typeof record.toleranceLInf === "number" &&
    Number.isFinite(record.toleranceLInf) &&
    (record.pass === null || typeof record.pass === "boolean") &&
    isStringArray(record.blockers)
  );
};

export const isNhm2FrequencyConvergenceEvidence = (
  value: unknown,
): value is Nhm2FrequencyConvergenceEvidenceV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    record.contractVersion === "nhm2_frequency_convergence_evidence/v1" &&
    typeof record.generatedAt === "string" &&
    isNullableNumber(record.baseFrequencyHz) &&
    typeof record.toleranceLInf === "number" &&
    Number.isFinite(record.toleranceLInf) &&
    typeof record.fixedCycleAverageSource === "boolean" &&
    isNumberArray(record.multipliers) &&
    Array.isArray(record.entries) &&
    record.entries.every(isFrequencyEntry) &&
    isStatus(record.convergenceStatus) &&
    isStringArray(record.blockers)
  );
};

export const isNhm2SwitchingConservationEvidence = (
  value: unknown,
): value is Nhm2SwitchingConservationEvidenceV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    record.contractVersion === "nhm2_switching_covariant_conservation_evidence/v1" &&
    typeof record.generatedAt === "string" &&
    isNullableText(record.staticCovariantConservationRef) &&
    isNullableText(record.scheduleRef) &&
    isNullableText(record.sectorBoundaryRef) &&
    isNullableText(record.switchingFunctionRef) &&
    typeof record.includesRegionalSupportDerivatives === "boolean" &&
    typeof record.includesSectorBoundaryTerms === "boolean" &&
    typeof record.includesTimeDerivativeTerms === "boolean" &&
    typeof record.includesTransitionKernelTerms === "boolean" &&
    typeof record.toleranceLInf === "number" &&
    Number.isFinite(record.toleranceLInf) &&
    isNullableNumber(record.overallResidualLInf) &&
    Array.isArray(record.terms) &&
    record.terms.every(isSwitchingTerm) &&
    isStatus(record.conservationStatus) &&
    isStringArray(record.blockers)
  );
};

export const isNhm2DynamicEffectiveGeometryEvidence = (
  value: unknown,
): value is Nhm2DynamicEffectiveGeometryEvidenceV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    record.contractVersion === "nhm2_dynamic_effective_geometry_evidence/v1" &&
    typeof record.generatedAt === "string" &&
    isNullableText(record.dynamicGeometryRef) &&
    isNullableText(record.effectiveGeometryRef) &&
    isNullableNumber(record.averagingWindowSeconds) &&
    (record.cycleAverageSourceFixed === null ||
      typeof record.cycleAverageSourceFixed === "boolean") &&
    isNullableText(record.averagedSourceTensorRef) &&
    isNullableText(record.backreactionResidualRef) &&
    isNullableNumber(record.residualLInf) &&
    isNullableNumber(record.residualL2) &&
    (record.bounded === null || typeof record.bounded === "boolean") &&
    isStatus(record.agreementStatus) &&
    isStringArray(record.blockers)
  );
};

export const isNhm2CampaignStabilityEvidence = (
  value: unknown,
): value is Nhm2CampaignStabilityEvidenceV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    record.contractVersion === "nhm2_campaign_stability_evidence/v1" &&
    typeof record.generatedAt === "string" &&
    isStatus(record.horizonStatus) &&
    isStatus(record.blueshiftStatus) &&
    isStatus(record.particleAccumulationStatus) &&
    isStatus(record.perturbativeStabilityStatus) &&
    isStringArray(record.blockers)
  );
};

export const isNhm2TimeDependentSourceCampaignArtifact = (
  value: unknown,
): value is Nhm2TimeDependentSourceCampaignArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary) ? record?.claimBoundary : null;
  const sourceIndependence = isRecord(record?.sourceIndependence)
    ? record?.sourceIndependence
    : null;
  const frequencyLadder = isRecord(record?.frequencyLadder)
    ? record?.frequencyLadder
    : null;
  const switchingSchedule = isRecord(record?.switchingSchedule)
    ? record?.switchingSchedule
    : null;
  const timeAveraging = isRecord(record?.timeAveraging) ? record?.timeAveraging : null;
  const backreaction = isRecord(record?.backreaction) ? record?.backreaction : null;
  const stability = isRecord(record?.stability) ? record?.stability : null;
  return (
    record != null &&
    record.contractVersion === NHM2_TIME_DEPENDENT_SOURCE_CAMPAIGN_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    typeof record.laneId === "string" &&
    typeof record.selectedProfileId === "string" &&
    typeof record.runId === "string" &&
    typeof record.chartId === "string" &&
    isNullableText(record.atlasRef) &&
    isNullableText(record.atlasHash) &&
    isArtifactRefs(record.artifactRefs) &&
    sourceIndependence != null &&
    (sourceIndependence.independentlyDerivedTileMaterialTensor === null ||
      typeof sourceIndependence.independentlyDerivedTileMaterialTensor === "boolean") &&
    (sourceIndependence.copiedFromMetricRequiredTensor === null ||
      typeof sourceIndependence.copiedFromMetricRequiredTensor === "boolean") &&
    (sourceIndependence.fittedToMetricResidual === null ||
      typeof sourceIndependence.fittedToMetricResidual === "boolean") &&
    (sourceIndependence.targetEchoDetected === null ||
      typeof sourceIndependence.targetEchoDetected === "boolean") &&
    isStringArray(sourceIndependence.blockers) &&
    frequencyLadder != null &&
    isNullableNumber(frequencyLadder.baseFrequencyHz) &&
    isNullableNumber(frequencyLadder.toleranceLInf) &&
    isNumberArray(frequencyLadder.multipliers) &&
    (frequencyLadder.fixedCycleAverageSource === null ||
      typeof frequencyLadder.fixedCycleAverageSource === "boolean") &&
    Array.isArray(frequencyLadder.entries) &&
    frequencyLadder.entries.every(isFrequencyEntry) &&
    isStatus(frequencyLadder.convergenceStatus) &&
    isStringArray(frequencyLadder.blockers) &&
    switchingSchedule != null &&
    isNullableText(switchingSchedule.scheduleRef) &&
    isNullableText(switchingSchedule.sectorBoundaryRef) &&
    isNullableText(switchingSchedule.switchingFunctionRef) &&
    (switchingSchedule.includesRegionalSupportDerivatives === null ||
      typeof switchingSchedule.includesRegionalSupportDerivatives === "boolean") &&
    (switchingSchedule.includesSectorBoundaryTerms === null ||
      typeof switchingSchedule.includesSectorBoundaryTerms === "boolean") &&
    (switchingSchedule.includesTimeDerivativeTerms === null ||
      typeof switchingSchedule.includesTimeDerivativeTerms === "boolean") &&
    (switchingSchedule.includesTransitionKernelTerms === null ||
      typeof switchingSchedule.includesTransitionKernelTerms === "boolean") &&
    isNullableNumber(switchingSchedule.toleranceLInf) &&
    isNullableNumber(switchingSchedule.overallResidualLInf) &&
    Array.isArray(switchingSchedule.terms) &&
    switchingSchedule.terms.every(isSwitchingTerm) &&
    isStatus(switchingSchedule.conservationStatus) &&
    isStringArray(switchingSchedule.blockers) &&
    timeAveraging != null &&
    isNullableNumber(timeAveraging.averagingWindowSeconds) &&
    (timeAveraging.cycleAverageSourceFixed === null ||
      typeof timeAveraging.cycleAverageSourceFixed === "boolean") &&
    isNullableText(timeAveraging.averagedSourceTensorRef) &&
    backreaction != null &&
    isNullableText(backreaction.dynamicGeometryRef) &&
    isNullableText(backreaction.effectiveGeometryRef) &&
    isNullableNumber(backreaction.residualLInf) &&
    isNullableNumber(backreaction.residualL2) &&
    (backreaction.bounded === null || typeof backreaction.bounded === "boolean") &&
    isStatus(backreaction.status) &&
    isStringArray(backreaction.blockers) &&
    stability != null &&
    isStatus(stability.horizonStatus) &&
    isStatus(stability.blueshiftStatus) &&
    isStatus(stability.particleAccumulationStatus) &&
    isStatus(stability.perturbativeStabilityStatus) &&
    isStringArray(stability.blockers) &&
    Array.isArray(record.gates) &&
    record.gates.every(isGate) &&
    new Set(
      (record.gates as Nhm2TimeDependentSourceCampaignGateV1[]).map(
        (entry) => entry.gateId,
      ),
    ).size === NHM2_TIME_DEPENDENT_SOURCE_CAMPAIGN_GATE_IDS.length &&
    NHM2_TIME_DEPENDENT_SOURCE_CAMPAIGN_GATE_IDS.every((gateId) =>
      (record.gates as Nhm2TimeDependentSourceCampaignGateV1[]).some(
        (entry) => entry.gateId === gateId,
      ),
    ) &&
    summary != null &&
    typeof summary.campaignPass === "boolean" &&
    typeof summary.sourceIndependencePass === "boolean" &&
    typeof summary.switchingConservationPass === "boolean" &&
    typeof summary.frequencyConvergencePass === "boolean" &&
    typeof summary.dynamicGeometryAgreementPass === "boolean" &&
    typeof summary.fullRegionalTensorClosurePass === "boolean" &&
    typeof summary.observerFamilyPass === "boolean" &&
    typeof summary.qeiReceiptsPass === "boolean" &&
    typeof summary.stabilityPass === "boolean" &&
    typeof summary.firstBlocker === "string" &&
    typeof summary.blockerCount === "number" &&
    Number.isFinite(summary.blockerCount) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary.physicalViabilityClaimAllowed === false &&
    claimBoundary.transportClaimAllowed === false &&
    claimBoundary.routeEtaClaimAllowed === false &&
    claimBoundary.propulsionClaimAllowed === false &&
    claimBoundary.staticEvidenceCannotPassDynamicCampaign === true
  );
};
