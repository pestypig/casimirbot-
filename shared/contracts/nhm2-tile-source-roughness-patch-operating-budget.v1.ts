import {
  buildNhm2TileSourceForceGapLoadBudget,
  isNhm2TileSourceForceGapLoadBudget,
  type Nhm2TileSourceForceGapLoadBudgetV1,
} from "./nhm2-tile-source-force-gap-load-budget.v1";
import type {
  Nhm2TileSourceRoughnessPatchEvidenceV1,
} from "./nhm2-tile-source-material-evidence-receipts.v1";

export const NHM2_TILE_SOURCE_ROUGHNESS_PATCH_OPERATING_BUDGET_CONTRACT_VERSION =
  "nhm2_tile_source_roughness_patch_operating_budget/v1";

export type Nhm2TileSourceRoughnessPatchOperatingBudgetV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_ROUGHNESS_PATCH_OPERATING_BUDGET_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  sourceRefs: {
    forceGapLoadBudgetRef: string | null;
    roughnessPatchEvidenceRef: string | null;
  };
  operatingTargets: {
    gapMeters: 8e-9;
    idealCasimirPressureAbsPa: number;
    roughnessRmsMaxMeters: 1e-10;
    asperityP99MaxMeters: 2e-9;
    asperityMaxMeters: 4e-9;
    patchVoltageRmsMaxVolts: 0.01;
    patchVoltageDerivedElectrostaticFractionMax: 0.05;
    residualElectrostaticForceFractionMax: 0.05;
    residualElectrostaticForceMaxN: number;
  };
  suppliedRoughnessPatchEvidence: {
    evidenceTier: string;
    roughnessMapRef: string | null;
    asperityDistributionRef: string | null;
    patchVoltageMapRef: string | null;
    roughnessRmsMeters: number | null;
    asperityP99Meters: number | null;
    asperityMaxMeters: number | null;
    patchVoltageRmsVolts: number | null;
    residualElectrostaticForceFraction: number | null;
    correctionRef: string | null;
  };
  derivedOperatingBudget: {
    mapRefsAvailable: boolean;
    roughnessRmsMargin: number | null;
    asperityP99Margin: number | null;
    asperityMaxMargin: number | null;
    minimumGapClearanceMeters: number | null;
    patchVoltageMargin: number | null;
    patchVoltageDerivedElectrostaticPressurePa: number | null;
    patchVoltageDerivedElectrostaticForceFraction: number | null;
    patchVoltageDerivedElectrostaticMargin: number | null;
    residualElectrostaticForceN: number | null;
    residualElectrostaticMargin: number | null;
  };
  blockers: string[];
  summary: {
    operatingBudgetComputed: boolean;
    roughnessPatchEvidenceReady: boolean;
    falsifiesCurrentCandidate: boolean;
    firstBlocker: string;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    operatingBudgetOnly: true;
    roughnessPatchEvidenceDoesNotSupplyFullApparatusTensor: true;
    patchElectrostaticTermsMustEnterFullTensor: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2TileSourceRoughnessPatchOperatingBudgetInput = {
  generatedAt?: string | null;
  forceGapLoadBudget?: Nhm2TileSourceForceGapLoadBudgetV1 | null;
  forceGapLoadBudgetRef?: string | null;
  roughnessPatchEvidence?: Nhm2TileSourceRoughnessPatchEvidenceV1 | null;
};

const ROUGHNESS_RMS_MAX_METERS = 1e-10;
const ASPERITY_P99_MAX_METERS = 2e-9;
const ASPERITY_MAX_METERS = 4e-9;
const PATCH_VOLTAGE_RMS_MAX_VOLTS = 0.01;
const RESIDUAL_ELECTROSTATIC_FORCE_FRACTION_MAX = 0.05;
const EPSILON_0_SI = 8.8541878128e-12;

const round = (value: number, digits = 12): number => Number(value.toPrecision(digits));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const finiteOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const safeRatio = (numerator: number | null, denominator: number | null): number | null =>
  numerator == null || denominator == null || denominator === 0
    ? null
    : round(numerator / denominator);

export const buildNhm2TileSourceRoughnessPatchOperatingBudget = (
  input: BuildNhm2TileSourceRoughnessPatchOperatingBudgetInput = {},
): Nhm2TileSourceRoughnessPatchOperatingBudgetV1 => {
  const forceGapLoadBudget =
    input.forceGapLoadBudget ??
    buildNhm2TileSourceForceGapLoadBudget({ generatedAt: input.generatedAt });
  if (!isNhm2TileSourceForceGapLoadBudget(forceGapLoadBudget)) {
    throw new Error("force gap load budget must be nhm2_tile_source_force_gap_load_budget/v1");
  }
  const evidence = input.roughnessPatchEvidence ?? null;
  const mapRefsAvailable =
    evidence?.roughnessMapRef != null &&
    evidence.asperityDistributionRef != null &&
    evidence.patchVoltageMapRef != null;
  const gapMeters = forceGapLoadBudget.frozenGeometry.gapMeters;
  const residualElectrostaticForceMaxN = round(
    Math.abs(forceGapLoadBudget.idealLoadBudget.forcePer447LayerStackN) *
      RESIDUAL_ELECTROSTATIC_FORCE_FRACTION_MAX,
  );
  const residualElectrostaticForceN =
    evidence?.residualElectrostaticForceFraction == null
      ? null
      : round(
          Math.abs(forceGapLoadBudget.idealLoadBudget.forcePer447LayerStackN) *
            evidence.residualElectrostaticForceFraction,
        );
  const roughnessRmsMargin = safeRatio(ROUGHNESS_RMS_MAX_METERS, evidence?.roughnessRmsMeters ?? null);
  const asperityP99Margin = safeRatio(ASPERITY_P99_MAX_METERS, evidence?.asperityP99Meters ?? null);
  const asperityMaxMargin = safeRatio(ASPERITY_MAX_METERS, evidence?.asperityMaxMeters ?? null);
  const patchVoltageMargin = safeRatio(PATCH_VOLTAGE_RMS_MAX_VOLTS, evidence?.patchVoltageRmsVolts ?? null);
  const idealCasimirPressureAbsPa = Math.abs(forceGapLoadBudget.idealLoadBudget.pressurePa);
  const patchVoltageDerivedElectrostaticPressurePa =
    evidence?.patchVoltageRmsVolts == null
      ? null
      : round((0.5 * EPSILON_0_SI * evidence.patchVoltageRmsVolts ** 2) / gapMeters ** 2);
  const patchVoltageDerivedElectrostaticForceFraction = safeRatio(
    patchVoltageDerivedElectrostaticPressurePa,
    idealCasimirPressureAbsPa,
  );
  const patchVoltageDerivedElectrostaticMargin = safeRatio(
    RESIDUAL_ELECTROSTATIC_FORCE_FRACTION_MAX,
    patchVoltageDerivedElectrostaticForceFraction,
  );
  const residualElectrostaticMargin = safeRatio(
    RESIDUAL_ELECTROSTATIC_FORCE_FRACTION_MAX,
    evidence?.residualElectrostaticForceFraction ?? null,
  );
  const minimumGapClearanceMeters =
    evidence?.asperityMaxMeters == null ? null : round(gapMeters - evidence.asperityMaxMeters);
  const blockers = [
    ...(evidence == null || evidence.evidenceTier === "missing"
      ? ["roughness_patch_receipt_missing_for_operating_budget"]
      : []),
    ...(evidence?.evidenceTier !== "measured" &&
    evidence?.evidenceTier !== "validated_simulation"
      ? ["roughness_patch_operating_budget_tier_not_measured_or_validated"]
      : []),
    ...(evidence?.roughnessMapRef == null
      ? ["roughness_map_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.asperityDistributionRef == null
      ? ["asperity_tail_distribution_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.patchVoltageMapRef == null
      ? ["patch_voltage_map_ref_missing_for_operating_budget"]
      : []),
    ...(roughnessRmsMargin == null
      ? ["roughness_rms_missing_for_operating_budget"]
      : roughnessRmsMargin < 1
        ? ["roughness_rms_above_0p1nm_operating_budget"]
        : []),
    ...(asperityP99Margin == null
      ? ["asperity_p99_missing_for_operating_budget"]
      : asperityP99Margin < 1
        ? ["asperity_p99_above_2nm_operating_budget"]
        : []),
    ...(asperityMaxMargin == null
      ? ["asperity_max_missing_for_operating_budget"]
      : asperityMaxMargin < 1
        ? ["asperity_max_exceeds_half_gap_operating_budget"]
        : []),
    ...(minimumGapClearanceMeters != null && minimumGapClearanceMeters <= 0
      ? ["asperity_tail_closes_8nm_gap"]
      : []),
    ...(patchVoltageMargin == null
      ? ["patch_voltage_missing_for_operating_budget"]
      : patchVoltageMargin < 1
        ? ["patch_voltage_above_10mv_operating_budget"]
        : []),
    ...(patchVoltageDerivedElectrostaticMargin == null
      ? ["patch_voltage_derived_electrostatic_fraction_missing_for_operating_budget"]
      : patchVoltageDerivedElectrostaticMargin < 1
        ? ["patch_voltage_derived_electrostatic_fraction_above_5pct_operating_budget"]
        : []),
    ...(residualElectrostaticMargin == null
      ? ["residual_electrostatic_force_missing_for_operating_budget"]
      : residualElectrostaticMargin < 1
        ? ["residual_electrostatic_force_above_5pct_operating_budget"]
        : []),
    ...(evidence?.correctionRef == null
      ? ["roughness_patch_correction_ref_missing_for_operating_budget"]
      : []),
  ];
  const falsifiesCurrentCandidate =
    evidence?.evidenceTier === "measured" ||
    evidence?.evidenceTier === "validated_simulation"
      ? blockers.some((blocker) =>
          [
            "roughness_rms_above_0p1nm_operating_budget",
            "asperity_p99_above_2nm_operating_budget",
            "asperity_max_exceeds_half_gap_operating_budget",
            "asperity_tail_closes_8nm_gap",
            "patch_voltage_above_10mv_operating_budget",
            "patch_voltage_derived_electrostatic_fraction_above_5pct_operating_budget",
            "residual_electrostatic_force_above_5pct_operating_budget",
          ].includes(blocker),
        )
      : false;
  return {
    contractVersion: NHM2_TILE_SOURCE_ROUGHNESS_PATCH_OPERATING_BUDGET_CONTRACT_VERSION,
    generatedAt: forceGapLoadBudget.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: forceGapLoadBudget.selectedProfileId,
    frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1",
    sourceRefs: {
      forceGapLoadBudgetRef: input.forceGapLoadBudgetRef ?? null,
      roughnessPatchEvidenceRef: evidence?.evidenceRef ?? null,
    },
    operatingTargets: {
      gapMeters: 8e-9,
      idealCasimirPressureAbsPa,
      roughnessRmsMaxMeters: ROUGHNESS_RMS_MAX_METERS,
      asperityP99MaxMeters: ASPERITY_P99_MAX_METERS,
      asperityMaxMeters: ASPERITY_MAX_METERS,
      patchVoltageRmsMaxVolts: PATCH_VOLTAGE_RMS_MAX_VOLTS,
      patchVoltageDerivedElectrostaticFractionMax:
        RESIDUAL_ELECTROSTATIC_FORCE_FRACTION_MAX,
      residualElectrostaticForceFractionMax: RESIDUAL_ELECTROSTATIC_FORCE_FRACTION_MAX,
      residualElectrostaticForceMaxN,
    },
    suppliedRoughnessPatchEvidence: {
      evidenceTier: evidence?.evidenceTier ?? "missing",
      roughnessMapRef: evidence?.roughnessMapRef ?? null,
      asperityDistributionRef: evidence?.asperityDistributionRef ?? null,
      patchVoltageMapRef: evidence?.patchVoltageMapRef ?? null,
      roughnessRmsMeters: finiteOrNull(evidence?.roughnessRmsMeters),
      asperityP99Meters: finiteOrNull(evidence?.asperityP99Meters),
      asperityMaxMeters: finiteOrNull(evidence?.asperityMaxMeters),
      patchVoltageRmsVolts: finiteOrNull(evidence?.patchVoltageRmsVolts),
      residualElectrostaticForceFraction: finiteOrNull(evidence?.residualElectrostaticForceFraction),
      correctionRef: evidence?.correctionRef ?? null,
    },
    derivedOperatingBudget: {
      mapRefsAvailable,
      roughnessRmsMargin,
      asperityP99Margin,
      asperityMaxMargin,
      minimumGapClearanceMeters,
      patchVoltageMargin,
      patchVoltageDerivedElectrostaticPressurePa,
      patchVoltageDerivedElectrostaticForceFraction,
      patchVoltageDerivedElectrostaticMargin,
      residualElectrostaticForceN,
      residualElectrostaticMargin,
    },
    blockers,
    summary: {
      operatingBudgetComputed: true,
      roughnessPatchEvidenceReady: blockers.length === 0,
      falsifiesCurrentCandidate,
      firstBlocker: blockers[0] ?? "none",
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      operatingBudgetOnly: true,
      roughnessPatchEvidenceDoesNotSupplyFullApparatusTensor: true,
      patchElectrostaticTermsMustEnterFullTensor: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

export const isNhm2TileSourceRoughnessPatchOperatingBudget = (
  value: unknown,
): value is Nhm2TileSourceRoughnessPatchOperatingBudgetV1 => {
  if (!isRecord(value)) return false;
  const targets = isRecord(value.operatingTargets) ? value.operatingTargets : null;
  const supplied = isRecord(value.suppliedRoughnessPatchEvidence)
    ? value.suppliedRoughnessPatchEvidence
    : null;
  const budget = isRecord(value.derivedOperatingBudget)
    ? value.derivedOperatingBudget
    : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_TILE_SOURCE_ROUGHNESS_PATCH_OPERATING_BUDGET_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    isRecord(value.sourceRefs) &&
    targets != null &&
    targets.gapMeters === 8e-9 &&
    typeof targets.idealCasimirPressureAbsPa === "number" &&
    targets.roughnessRmsMaxMeters === 1e-10 &&
    targets.asperityP99MaxMeters === 2e-9 &&
    targets.asperityMaxMeters === 4e-9 &&
    targets.patchVoltageRmsMaxVolts === 0.01 &&
    targets.patchVoltageDerivedElectrostaticFractionMax === 0.05 &&
    targets.residualElectrostaticForceFractionMax === 0.05 &&
    typeof targets.residualElectrostaticForceMaxN === "number" &&
    supplied != null &&
    typeof supplied.evidenceTier === "string" &&
    (supplied.roughnessMapRef === null || typeof supplied.roughnessMapRef === "string") &&
    (supplied.asperityDistributionRef === null ||
      typeof supplied.asperityDistributionRef === "string") &&
    (supplied.patchVoltageMapRef === null || typeof supplied.patchVoltageMapRef === "string") &&
    budget != null &&
    typeof budget.mapRefsAvailable === "boolean" &&
    Array.isArray(value.blockers) &&
    value.blockers.every((entry) => typeof entry === "string") &&
    summary != null &&
    summary.operatingBudgetComputed === true &&
    typeof summary.roughnessPatchEvidenceReady === "boolean" &&
    typeof summary.falsifiesCurrentCandidate === "boolean" &&
    typeof summary.firstBlocker === "string" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.operatingBudgetOnly === true &&
    boundary.roughnessPatchEvidenceDoesNotSupplyFullApparatusTensor === true &&
    boundary.patchElectrostaticTermsMustEnterFullTensor === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false
  );
};
