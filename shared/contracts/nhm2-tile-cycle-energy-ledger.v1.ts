export const NHM2_TILE_CYCLE_ENERGY_LEDGER_CONTRACT_VERSION =
  "nhm2_tile_cycle_energy_ledger/v1";

export const NHM2_TILE_CYCLE_MODULATION_KINDS = [
  "gap_motion",
  "material_switching",
  "electromagnetic_boundary_modulation",
  "combined",
] as const;

export type Nhm2TileCycleModulationKind =
  (typeof NHM2_TILE_CYCLE_MODULATION_KINDS)[number];

export type Nhm2TileCycleImportedEnergyV1 = {
  electricalDriveJ: number;
  materialSwitchingJ: number;
  mechanicalActuatorJ: number;
  sensingAndControlJ: number;
  coolingJ: number;
  statePreparationJ: number;
  thermalReservoirJ: number;
};

export type Nhm2TileCycleExportedEnergyV1 = {
  usefulMechanicalWorkJ: number;
  usefulElectricalWorkJ: number;
  rejectedHeatJ: number;
  radiatedEnergyJ: number;
  leakageAndDissipationJ: number;
};

export type Nhm2TileCycleEvidenceV1 = {
  evidenceTier: "measured" | "validated_simulation";
  cycleId: string;
  systemBoundaryId: string;
  modulationKind: Nhm2TileCycleModulationKind;
  cyclePeriodSeconds: number;
  declaredCycleFrequencyHz: number;
  cycleCount: 1;
  reservoirIds: string[];
  initialStateSha256: string;
  finalStateSha256: string;
  modulationTrajectorySha256: string;
  importedEnergy: Nhm2TileCycleImportedEnergyV1;
  exportedEnergy: Nhm2TileCycleExportedEnergyV1;
  initialStoredEnergyJ: number;
  finalStoredEnergyJ: number;
  balanceUncertaintyJ: number;
  identifiedInputExergyJ: number;
  driveBoundaryConditionReceiptRef: string;
  forceGapCurveReceiptRef: string;
  materialResponseReceiptRef: string;
  activeControlEnergyReceiptRef: string;
  energyTimeSeriesReceiptRef: string;
  reservoirEnergyAllocationReceiptRef: string;
  uncertaintyBudgetReceiptRef: string;
  stateClosureReceiptRef: string;
  fullApparatusTensorReceiptRef: string | null;
};

export type Nhm2TileCycleEnergyLedgerV1 = {
  contractVersion: typeof NHM2_TILE_CYCLE_ENERGY_LEDGER_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  accountingConvention: {
    systemBoundaryMustBeDeclared: true;
    allValuesArePerDeclaredCycle: true;
    importedEnergyIsNonnegativeIntoBoundary: true;
    exportedEnergyIsNonnegativeOutOfBoundary: true;
    storedEnergyDeltaExpression: "finalStoredEnergyJ - initialStoredEnergyJ";
    firstLawResidualExpression: "totalImportedEnergyJ - totalExportedEnergyJ - storedEnergyDeltaJ";
    closureCriterion: "abs(firstLawResidualJ) <= balanceUncertaintyJ";
    usefulWorkIsExportNotEnergyCreation: true;
    rejectedHeatRadiationAndLeakageAreExportChannelsNotSecondSubtractions: true;
    staticCasimirEnergyTimesFrequencyIsNotPowerAuthority: true;
    oneParameterConservativeClosedPathCannotSupplyNetWork: true;
    switchedOrMultiReservoirCycleMustBindEverySupplyingReservoir: true;
  };
  evidence: {
    evidenceTier: "measured" | "validated_simulation" | null;
    cycleId: string | null;
    systemBoundaryId: string | null;
    modulationKind: Nhm2TileCycleModulationKind | null;
    cyclePeriodSeconds: number | null;
    declaredCycleFrequencyHz: number | null;
    cycleCount: 1 | null;
    reservoirIds: string[];
    initialStateSha256: string | null;
    finalStateSha256: string | null;
    modulationTrajectorySha256: string | null;
    importedEnergy: Nhm2TileCycleImportedEnergyV1 | null;
    exportedEnergy: Nhm2TileCycleExportedEnergyV1 | null;
    initialStoredEnergyJ: number | null;
    finalStoredEnergyJ: number | null;
    balanceUncertaintyJ: number | null;
    identifiedInputExergyJ: number | null;
    driveBoundaryConditionReceiptRef: string | null;
    forceGapCurveReceiptRef: string | null;
    materialResponseReceiptRef: string | null;
    activeControlEnergyReceiptRef: string | null;
    energyTimeSeriesReceiptRef: string | null;
    reservoirEnergyAllocationReceiptRef: string | null;
    uncertaintyBudgetReceiptRef: string | null;
    stateClosureReceiptRef: string | null;
    fullApparatusTensorReceiptRef: string | null;
  };
  derived: {
    totalImportedEnergyJ: number | null;
    totalExportedEnergyJ: number | null;
    usefulWorkOutputJ: number | null;
    nonUsefulExportEnergyJ: number | null;
    storedEnergyDeltaJ: number | null;
    firstLawResidualJ: number | null;
    absoluteFirstLawResidualJ: number | null;
    closureMarginJ: number | null;
    repeatableStateMarginJ: number | null;
    usefulPowerW: number | null;
    exergyEfficiency: number | null;
    exergyClosureMarginJ: number | null;
    frequencyPeriodProduct: number | null;
    energyBalanceClosed: boolean;
    repeatableStateClosed: boolean;
    frequencyPeriodConsistent: boolean;
    identifiedEnergySourceBound: boolean;
    usefulWorkObserved: boolean;
    receiptInputsComplete: boolean;
    diagnosticCycleComputationComplete: boolean;
  };
  blockers: string[];
  downstreamBlockers: string[];
  summary: {
    status: "blocked";
    diagnosticCycleComputationComplete: boolean;
    cycleEnergyLedgerReceiptReady: boolean;
    serverAuthenticatedEvidence: false;
    fullApparatusTensorRefSupplied: boolean;
    fullApparatusTensorBound: false;
    firstBlocker: string;
    firstDownstreamBlocker: string;
    energyCreationClaimAllowed: false;
    sourceTensorAuthorityAllowed: false;
    physicalViabilityClaimAllowed: false;
    propulsionClaimAllowed: false;
    transportClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    oneCycleEnergyAccountingOnly: true;
    idealCasimirScalarCannotSubstituteForLedger: true;
    cycleClosureDoesNotEstablishArrayScaling: true;
    cycleClosureDoesNotSupplyFullApparatusTensor: true;
    cycleClosureDoesNotEstablishVacuumEnergyExtraction: true;
    usefulWorkRequiresIdentifiedInputExergy: true;
    plainTypeScriptObjectDoesNotAuthenticateEvidence: true;
    serverOwnedObservationRequiredForReceipt: true;
    energyCreationClaimAllowed: false;
    sourceTensorAuthorityAllowed: false;
    physicalViabilityClaimAllowed: false;
    propulsionClaimAllowed: false;
    transportClaimAllowed: false;
  };
};

export type BuildNhm2TileCycleEnergyLedgerInput = {
  generatedAt?: string | null;
  selectedProfileId?: string | null;
  evidence?: Nhm2TileCycleEvidenceV1 | null;
};

const DEFAULT_PROFILE_ID = "nhm2_447_layer_topology_optimized_lattice_tin_v1";
const MAX_RESERVOIR_COUNT = 16;
const MAX_TEXT_LENGTH = 256;
const FREQUENCY_PERIOD_TOLERANCE = 1e-9;
const SHA256_HEX = /^[0-9a-f]{64}$/;

const IMPORT_KEYS = [
  "electricalDriveJ",
  "materialSwitchingJ",
  "mechanicalActuatorJ",
  "sensingAndControlJ",
  "coolingJ",
  "statePreparationJ",
  "thermalReservoirJ",
] as const;

const EXPORT_KEYS = [
  "usefulMechanicalWorkJ",
  "usefulElectricalWorkJ",
  "rejectedHeatJ",
  "radiatedEnergyJ",
  "leakageAndDissipationJ",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isFiniteNonnegative = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isFinitePositive = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const isBoundedText = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= MAX_TEXT_LENGTH &&
  /^[\x20-\x7e]+$/.test(value);

const textOrNull = (value: unknown): string | null =>
  isBoundedText(value) ? value : null;

const numberOrNull = (value: unknown): number | null =>
  isFiniteNonnegative(value) ? value : null;

const finiteOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const round = (value: number): number => Number(value.toPrecision(15));

const exactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
};

const cloneImportedEnergy = (
  value: unknown,
): Nhm2TileCycleImportedEnergyV1 | null => {
  if (!isRecord(value) || !exactKeys(value, IMPORT_KEYS)) return null;
  if (!IMPORT_KEYS.every((key) => isFiniteNonnegative(value[key]))) return null;
  return {
    electricalDriveJ: value.electricalDriveJ as number,
    materialSwitchingJ: value.materialSwitchingJ as number,
    mechanicalActuatorJ: value.mechanicalActuatorJ as number,
    sensingAndControlJ: value.sensingAndControlJ as number,
    coolingJ: value.coolingJ as number,
    statePreparationJ: value.statePreparationJ as number,
    thermalReservoirJ: value.thermalReservoirJ as number,
  };
};

const cloneExportedEnergy = (
  value: unknown,
): Nhm2TileCycleExportedEnergyV1 | null => {
  if (!isRecord(value) || !exactKeys(value, EXPORT_KEYS)) return null;
  if (!EXPORT_KEYS.every((key) => isFiniteNonnegative(value[key]))) return null;
  return {
    usefulMechanicalWorkJ: value.usefulMechanicalWorkJ as number,
    usefulElectricalWorkJ: value.usefulElectricalWorkJ as number,
    rejectedHeatJ: value.rejectedHeatJ as number,
    radiatedEnergyJ: value.radiatedEnergyJ as number,
    leakageAndDissipationJ: value.leakageAndDissipationJ as number,
  };
};

const cloneReservoirIds = (value: unknown): string[] => {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > MAX_RESERVOIR_COUNT
  )
    return [];
  if (!value.every(isBoundedText)) return [];
  if (new Set(value).size !== value.length) return [];
  return [...value];
};

const sumImported = (value: Nhm2TileCycleImportedEnergyV1): number =>
  round(IMPORT_KEYS.reduce((sum, key) => sum + value[key], 0));

const sumExported = (value: Nhm2TileCycleExportedEnergyV1): number =>
  round(EXPORT_KEYS.reduce((sum, key) => sum + value[key], 0));

const deepFreeze = <T>(value: T): T => {
  if (value != null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
};

const missingReferenceBlockers = (
  evidence: Nhm2TileCycleEnergyLedgerV1["evidence"],
): string[] => {
  const required: Array<[keyof typeof evidence, string]> = [
    [
      "driveBoundaryConditionReceiptRef",
      "drive_boundary_condition_receipt_missing",
    ],
    ["forceGapCurveReceiptRef", "force_gap_curve_receipt_missing"],
    ["materialResponseReceiptRef", "material_response_receipt_missing"],
    ["activeControlEnergyReceiptRef", "active_control_energy_receipt_missing"],
    ["energyTimeSeriesReceiptRef", "energy_time_series_receipt_missing"],
    [
      "reservoirEnergyAllocationReceiptRef",
      "reservoir_energy_allocation_receipt_missing",
    ],
    ["uncertaintyBudgetReceiptRef", "uncertainty_budget_receipt_missing"],
    ["stateClosureReceiptRef", "state_closure_receipt_missing"],
  ];
  return required.flatMap(([key, blocker]) =>
    evidence[key] == null ? [blocker] : [],
  );
};

export const buildNhm2TileCycleEnergyLedger = (
  input: BuildNhm2TileCycleEnergyLedgerInput = {},
): Nhm2TileCycleEnergyLedgerV1 => {
  const supplied = input.evidence;
  const importedEnergy = cloneImportedEnergy(supplied?.importedEnergy);
  const exportedEnergy = cloneExportedEnergy(supplied?.exportedEnergy);
  const reservoirIds = cloneReservoirIds(supplied?.reservoirIds);

  const cyclePeriodSeconds = isFinitePositive(supplied?.cyclePeriodSeconds)
    ? supplied.cyclePeriodSeconds
    : null;
  const declaredCycleFrequencyHz = isFinitePositive(
    supplied?.declaredCycleFrequencyHz,
  )
    ? supplied.declaredCycleFrequencyHz
    : null;
  const balanceUncertaintyJ = isFinitePositive(supplied?.balanceUncertaintyJ)
    ? supplied.balanceUncertaintyJ
    : null;
  const initialStoredEnergyJ = finiteOrNull(supplied?.initialStoredEnergyJ);
  const finalStoredEnergyJ = finiteOrNull(supplied?.finalStoredEnergyJ);
  const identifiedInputExergyJ = numberOrNull(supplied?.identifiedInputExergyJ);

  const evidence: Nhm2TileCycleEnergyLedgerV1["evidence"] = {
    evidenceTier:
      supplied?.evidenceTier === "measured" ||
      supplied?.evidenceTier === "validated_simulation"
        ? supplied.evidenceTier
        : null,
    cycleId: textOrNull(supplied?.cycleId),
    systemBoundaryId: textOrNull(supplied?.systemBoundaryId),
    modulationKind:
      supplied != null &&
      (NHM2_TILE_CYCLE_MODULATION_KINDS as readonly unknown[]).includes(
        supplied.modulationKind,
      )
        ? supplied.modulationKind
        : null,
    cyclePeriodSeconds,
    declaredCycleFrequencyHz,
    cycleCount: supplied?.cycleCount === 1 ? 1 : null,
    reservoirIds,
    initialStateSha256: SHA256_HEX.test(supplied?.initialStateSha256 ?? "")
      ? supplied!.initialStateSha256
      : null,
    finalStateSha256: SHA256_HEX.test(supplied?.finalStateSha256 ?? "")
      ? supplied!.finalStateSha256
      : null,
    modulationTrajectorySha256: SHA256_HEX.test(
      supplied?.modulationTrajectorySha256 ?? "",
    )
      ? supplied!.modulationTrajectorySha256
      : null,
    importedEnergy,
    exportedEnergy,
    initialStoredEnergyJ,
    finalStoredEnergyJ,
    balanceUncertaintyJ,
    identifiedInputExergyJ,
    driveBoundaryConditionReceiptRef: textOrNull(
      supplied?.driveBoundaryConditionReceiptRef,
    ),
    forceGapCurveReceiptRef: textOrNull(supplied?.forceGapCurveReceiptRef),
    materialResponseReceiptRef: textOrNull(
      supplied?.materialResponseReceiptRef,
    ),
    activeControlEnergyReceiptRef: textOrNull(
      supplied?.activeControlEnergyReceiptRef,
    ),
    energyTimeSeriesReceiptRef: textOrNull(
      supplied?.energyTimeSeriesReceiptRef,
    ),
    reservoirEnergyAllocationReceiptRef: textOrNull(
      supplied?.reservoirEnergyAllocationReceiptRef,
    ),
    uncertaintyBudgetReceiptRef: textOrNull(
      supplied?.uncertaintyBudgetReceiptRef,
    ),
    stateClosureReceiptRef: textOrNull(supplied?.stateClosureReceiptRef),
    fullApparatusTensorReceiptRef: textOrNull(
      supplied?.fullApparatusTensorReceiptRef,
    ),
  };

  const totalImportedEnergyJ =
    importedEnergy == null ? null : sumImported(importedEnergy);
  const totalExportedEnergyJ =
    exportedEnergy == null ? null : sumExported(exportedEnergy);
  const usefulWorkOutputJ =
    exportedEnergy == null
      ? null
      : round(
          exportedEnergy.usefulMechanicalWorkJ +
            exportedEnergy.usefulElectricalWorkJ,
        );
  const nonUsefulExportEnergyJ =
    totalExportedEnergyJ == null || usefulWorkOutputJ == null
      ? null
      : round(totalExportedEnergyJ - usefulWorkOutputJ);
  const storedEnergyDeltaJ =
    initialStoredEnergyJ == null || finalStoredEnergyJ == null
      ? null
      : round(finalStoredEnergyJ - initialStoredEnergyJ);
  const firstLawResidualJ =
    totalImportedEnergyJ == null ||
    totalExportedEnergyJ == null ||
    storedEnergyDeltaJ == null
      ? null
      : round(totalImportedEnergyJ - totalExportedEnergyJ - storedEnergyDeltaJ);
  const absoluteFirstLawResidualJ =
    firstLawResidualJ == null ? null : Math.abs(firstLawResidualJ);
  const closureMarginJ =
    balanceUncertaintyJ == null || absoluteFirstLawResidualJ == null
      ? null
      : round(balanceUncertaintyJ - absoluteFirstLawResidualJ);
  const repeatableStateMarginJ =
    balanceUncertaintyJ == null || storedEnergyDeltaJ == null
      ? null
      : round(balanceUncertaintyJ - Math.abs(storedEnergyDeltaJ));
  const frequencyPeriodProduct =
    cyclePeriodSeconds == null || declaredCycleFrequencyHz == null
      ? null
      : round(cyclePeriodSeconds * declaredCycleFrequencyHz);
  const frequencyPeriodConsistent =
    frequencyPeriodProduct != null &&
    Math.abs(frequencyPeriodProduct - 1) <= FREQUENCY_PERIOD_TOLERANCE;
  const energyBalanceClosed = closureMarginJ != null && closureMarginJ >= 0;
  const repeatableStateClosed =
    repeatableStateMarginJ != null &&
    repeatableStateMarginJ >= 0 &&
    evidence.stateClosureReceiptRef != null;
  const usefulWorkObserved = usefulWorkOutputJ != null && usefulWorkOutputJ > 0;
  const identifiedEnergySourceBound =
    identifiedInputExergyJ != null &&
    totalImportedEnergyJ != null &&
    identifiedInputExergyJ > 0 &&
    identifiedInputExergyJ <=
      totalImportedEnergyJ + (balanceUncertaintyJ ?? 0) &&
    reservoirIds.length > 0;
  const usefulPowerW =
    usefulWorkOutputJ == null || cyclePeriodSeconds == null
      ? null
      : round(usefulWorkOutputJ / cyclePeriodSeconds);
  const exergyEfficiency =
    usefulWorkOutputJ == null ||
    identifiedInputExergyJ == null ||
    identifiedInputExergyJ <= 0
      ? null
      : round(usefulWorkOutputJ / identifiedInputExergyJ);
  const exergyClosureMarginJ =
    usefulWorkOutputJ == null || identifiedInputExergyJ == null
      ? null
      : round(
          identifiedInputExergyJ +
            (balanceUncertaintyJ ?? 0) -
            usefulWorkOutputJ,
        );

  const receiptInputsComplete =
    evidence.evidenceTier != null &&
    evidence.cycleId != null &&
    evidence.systemBoundaryId != null &&
    evidence.modulationKind != null &&
    evidence.cyclePeriodSeconds != null &&
    evidence.declaredCycleFrequencyHz != null &&
    evidence.cycleCount === 1 &&
    evidence.reservoirIds.length > 0 &&
    evidence.initialStateSha256 != null &&
    evidence.finalStateSha256 != null &&
    evidence.modulationTrajectorySha256 != null &&
    evidence.importedEnergy != null &&
    evidence.exportedEnergy != null &&
    evidence.initialStoredEnergyJ != null &&
    evidence.finalStoredEnergyJ != null &&
    evidence.balanceUncertaintyJ != null &&
    evidence.identifiedInputExergyJ != null &&
    missingReferenceBlockers(evidence).length === 0;

  const blockers = [
    ...(supplied == null ? ["cycle_evidence_missing"] : []),
    ...(evidence.evidenceTier == null
      ? ["evidence_tier_missing_or_invalid"]
      : []),
    ...(evidence.cycleId == null ? ["cycle_id_missing_or_invalid"] : []),
    ...(evidence.systemBoundaryId == null
      ? ["system_boundary_id_missing_or_invalid"]
      : []),
    ...(evidence.modulationKind == null
      ? ["modulation_kind_missing_or_invalid"]
      : []),
    ...(cyclePeriodSeconds == null ? ["cycle_period_missing_or_invalid"] : []),
    ...(declaredCycleFrequencyHz == null
      ? ["declared_cycle_frequency_missing_or_invalid"]
      : []),
    ...(evidence.cycleCount !== 1 ? ["exactly_one_cycle_required"] : []),
    ...(reservoirIds.length === 0
      ? ["reservoir_inventory_missing_or_invalid"]
      : []),
    ...(evidence.initialStateSha256 == null
      ? ["initial_state_sha256_invalid"]
      : []),
    ...(evidence.finalStateSha256 == null
      ? ["final_state_sha256_invalid"]
      : []),
    ...(evidence.modulationTrajectorySha256 == null
      ? ["modulation_trajectory_sha256_invalid"]
      : []),
    ...(importedEnergy == null
      ? ["imported_energy_channels_missing_or_invalid"]
      : []),
    ...(exportedEnergy == null
      ? ["exported_energy_channels_missing_or_invalid"]
      : []),
    ...(initialStoredEnergyJ == null || finalStoredEnergyJ == null
      ? ["stored_energy_endpoints_missing_or_invalid"]
      : []),
    ...(balanceUncertaintyJ == null
      ? ["positive_balance_uncertainty_missing_or_invalid"]
      : []),
    ...(identifiedInputExergyJ == null
      ? ["identified_input_exergy_missing_or_invalid"]
      : []),
    ...missingReferenceBlockers(evidence),
    ...(frequencyPeriodProduct != null && !frequencyPeriodConsistent
      ? ["cycle_frequency_period_inconsistent"]
      : []),
    ...(firstLawResidualJ != null && !energyBalanceClosed
      ? ["first_law_energy_balance_not_closed"]
      : []),
    ...(storedEnergyDeltaJ != null && !repeatableStateClosed
      ? ["repeatable_state_energy_not_closed"]
      : []),
    ...(usefulWorkObserved && !identifiedEnergySourceBound
      ? ["useful_work_has_no_bounded_input_exergy_source"]
      : []),
    ...(exergyClosureMarginJ != null && exergyClosureMarginJ < 0
      ? ["useful_work_exceeds_identified_input_exergy"]
      : []),
  ];

  const diagnosticBlockers = [...new Set(blockers)];
  const diagnosticCycleComputationComplete =
    receiptInputsComplete &&
    energyBalanceClosed &&
    repeatableStateClosed &&
    frequencyPeriodConsistent &&
    (!usefulWorkObserved || identifiedEnergySourceBound) &&
    (exergyClosureMarginJ == null || exergyClosureMarginJ >= 0) &&
    diagnosticBlockers.length === 0;
  const uniqueBlockers = [
    ...diagnosticBlockers,
    "server_authenticated_cycle_evidence_missing",
  ];
  const downstreamBlockers = [
    ...(evidence.fullApparatusTensorReceiptRef == null
      ? ["full_apparatus_tensor_receipt_missing"]
      : []),
    "full_apparatus_tensor_receipt_not_server_authenticated",
    "array_scaling_receipt_missing",
    "source_tensor_authority_not_granted_by_cycle_ledger",
  ];
  const cycleEnergyLedgerReceiptReady = false;

  return deepFreeze({
    contractVersion: NHM2_TILE_CYCLE_ENERGY_LEDGER_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: input.selectedProfileId ?? DEFAULT_PROFILE_ID,
    accountingConvention: {
      systemBoundaryMustBeDeclared: true,
      allValuesArePerDeclaredCycle: true,
      importedEnergyIsNonnegativeIntoBoundary: true,
      exportedEnergyIsNonnegativeOutOfBoundary: true,
      storedEnergyDeltaExpression: "finalStoredEnergyJ - initialStoredEnergyJ",
      firstLawResidualExpression:
        "totalImportedEnergyJ - totalExportedEnergyJ - storedEnergyDeltaJ",
      closureCriterion: "abs(firstLawResidualJ) <= balanceUncertaintyJ",
      usefulWorkIsExportNotEnergyCreation: true,
      rejectedHeatRadiationAndLeakageAreExportChannelsNotSecondSubtractions: true,
      staticCasimirEnergyTimesFrequencyIsNotPowerAuthority: true,
      oneParameterConservativeClosedPathCannotSupplyNetWork: true,
      switchedOrMultiReservoirCycleMustBindEverySupplyingReservoir: true,
    },
    evidence,
    derived: {
      totalImportedEnergyJ,
      totalExportedEnergyJ,
      usefulWorkOutputJ,
      nonUsefulExportEnergyJ,
      storedEnergyDeltaJ,
      firstLawResidualJ,
      absoluteFirstLawResidualJ,
      closureMarginJ,
      repeatableStateMarginJ,
      usefulPowerW,
      exergyEfficiency,
      exergyClosureMarginJ,
      frequencyPeriodProduct,
      energyBalanceClosed,
      repeatableStateClosed,
      frequencyPeriodConsistent,
      identifiedEnergySourceBound,
      usefulWorkObserved,
      receiptInputsComplete,
      diagnosticCycleComputationComplete,
    },
    blockers: uniqueBlockers,
    downstreamBlockers,
    summary: {
      status: "blocked",
      diagnosticCycleComputationComplete,
      cycleEnergyLedgerReceiptReady,
      serverAuthenticatedEvidence: false,
      fullApparatusTensorRefSupplied:
        evidence.fullApparatusTensorReceiptRef != null,
      fullApparatusTensorBound: false,
      firstBlocker: uniqueBlockers[0] ?? "none",
      firstDownstreamBlocker: downstreamBlockers[0] ?? "none",
      energyCreationClaimAllowed: false,
      sourceTensorAuthorityAllowed: false,
      physicalViabilityClaimAllowed: false,
      propulsionClaimAllowed: false,
      transportClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      oneCycleEnergyAccountingOnly: true,
      idealCasimirScalarCannotSubstituteForLedger: true,
      cycleClosureDoesNotEstablishArrayScaling: true,
      cycleClosureDoesNotSupplyFullApparatusTensor: true,
      cycleClosureDoesNotEstablishVacuumEnergyExtraction: true,
      usefulWorkRequiresIdentifiedInputExergy: true,
      plainTypeScriptObjectDoesNotAuthenticateEvidence: true,
      serverOwnedObservationRequiredForReceipt: true,
      energyCreationClaimAllowed: false,
      sourceTensorAuthorityAllowed: false,
      physicalViabilityClaimAllowed: false,
      propulsionClaimAllowed: false,
      transportClaimAllowed: false,
    },
  });
};

export const isNhm2TileCycleEnergyLedger = (
  value: unknown,
): value is Nhm2TileCycleEnergyLedgerV1 => {
  if (!isRecord(value)) return false;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  const convention = isRecord(value.accountingConvention)
    ? value.accountingConvention
    : null;
  return (
    value.contractVersion === NHM2_TILE_CYCLE_ENERGY_LEDGER_CONTRACT_VERSION &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.generatedAt === "string" &&
    typeof value.selectedProfileId === "string" &&
    Array.isArray(value.blockers) &&
    value.blockers.every((entry) => typeof entry === "string") &&
    Array.isArray(value.downstreamBlockers) &&
    value.downstreamBlockers.every((entry) => typeof entry === "string") &&
    convention != null &&
    convention.systemBoundaryMustBeDeclared === true &&
    convention.usefulWorkIsExportNotEnergyCreation === true &&
    convention.staticCasimirEnergyTimesFrequencyIsNotPowerAuthority === true &&
    summary != null &&
    summary.status === "blocked" &&
    typeof summary.diagnosticCycleComputationComplete === "boolean" &&
    summary.cycleEnergyLedgerReceiptReady === false &&
    summary.serverAuthenticatedEvidence === false &&
    typeof summary.fullApparatusTensorRefSupplied === "boolean" &&
    summary.fullApparatusTensorBound === false &&
    summary.energyCreationClaimAllowed === false &&
    summary.sourceTensorAuthorityAllowed === false &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.cycleClosureDoesNotEstablishVacuumEnergyExtraction === true &&
    boundary.plainTypeScriptObjectDoesNotAuthenticateEvidence === true &&
    boundary.serverOwnedObservationRequiredForReceipt === true &&
    boundary.energyCreationClaimAllowed === false &&
    boundary.sourceTensorAuthorityAllowed === false &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false &&
    boundary.transportClaimAllowed === false
  );
};
