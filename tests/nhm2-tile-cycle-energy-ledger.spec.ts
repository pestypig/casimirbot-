import { describe, expect, it } from "vitest";

import {
  buildNhm2TileCycleEnergyLedger,
  isNhm2TileCycleEnergyLedger,
  type Nhm2TileCycleEvidenceV1,
} from "../shared/contracts/nhm2-tile-cycle-energy-ledger.v1";

const SHA_A = "a".repeat(64);
const SHA_B = "b".repeat(64);
const SHA_C = "c".repeat(64);

const validEvidence = (): Nhm2TileCycleEvidenceV1 => ({
  evidenceTier: "validated_simulation",
  cycleId: "nhm2-cycle-0001",
  systemBoundaryId: "tile-plus-drive-and-thermal-reservoirs",
  modulationKind: "combined",
  cyclePeriodSeconds: 1 / 15e9,
  declaredCycleFrequencyHz: 15e9,
  cycleCount: 1,
  reservoirIds: ["electrical-drive", "cold-sink"],
  initialStateSha256: SHA_A,
  finalStateSha256: SHA_B,
  modulationTrajectorySha256: SHA_C,
  importedEnergy: {
    electricalDriveJ: 8,
    materialSwitchingJ: 1,
    mechanicalActuatorJ: 1,
    sensingAndControlJ: 1,
    coolingJ: 1,
    statePreparationJ: 0,
    thermalReservoirJ: 3,
  },
  exportedEnergy: {
    usefulMechanicalWorkJ: 4,
    usefulElectricalWorkJ: 1,
    rejectedHeatJ: 8,
    radiatedEnergyJ: 1,
    leakageAndDissipationJ: 1,
  },
  initialStoredEnergyJ: 100,
  finalStoredEnergyJ: 100,
  balanceUncertaintyJ: 0.01,
  identifiedInputExergyJ: 10,
  driveBoundaryConditionReceiptRef: "artifacts/drive-boundary.json",
  forceGapCurveReceiptRef: "artifacts/force-gap.json",
  materialResponseReceiptRef: "artifacts/material-response.json",
  activeControlEnergyReceiptRef: "artifacts/active-control-energy.json",
  energyTimeSeriesReceiptRef: "artifacts/cycle-energy-timeseries.json",
  reservoirEnergyAllocationReceiptRef:
    "artifacts/reservoir-energy-allocation.json",
  uncertaintyBudgetReceiptRef: "artifacts/cycle-energy-uncertainty.json",
  stateClosureReceiptRef: "artifacts/cycle-state-closure.json",
  fullApparatusTensorReceiptRef: null,
});

describe("NHM2 tile-cycle energy ledger v1", () => {
  it("fails closed with no physical cycle evidence", () => {
    const ledger = buildNhm2TileCycleEnergyLedger({
      generatedAt: "2026-08-20T00:00:00.000Z",
    });

    expect(isNhm2TileCycleEnergyLedger(ledger)).toBe(true);
    expect(ledger.summary).toMatchObject({
      status: "blocked",
      cycleEnergyLedgerReceiptReady: false,
      energyCreationClaimAllowed: false,
      sourceTensorAuthorityAllowed: false,
      physicalViabilityClaimAllowed: false,
      propulsionClaimAllowed: false,
      transportClaimAllowed: false,
    });
    expect(ledger.summary.firstBlocker).toBe("cycle_evidence_missing");
  });

  it("closes the diagnostic arithmetic but waits for server-authenticated evidence", () => {
    const ledger = buildNhm2TileCycleEnergyLedger({
      generatedAt: "2026-08-20T00:00:00.000Z",
      evidence: validEvidence(),
    });

    expect(ledger.derived).toMatchObject({
      totalImportedEnergyJ: 15,
      totalExportedEnergyJ: 15,
      usefulWorkOutputJ: 5,
      nonUsefulExportEnergyJ: 10,
      storedEnergyDeltaJ: 0,
      firstLawResidualJ: 0,
      energyBalanceClosed: true,
      repeatableStateClosed: true,
      frequencyPeriodConsistent: true,
      identifiedEnergySourceBound: true,
      usefulWorkObserved: true,
      receiptInputsComplete: true,
      diagnosticCycleComputationComplete: true,
      exergyEfficiency: 0.5,
      exergyClosureMarginJ: 5.01,
      usefulPowerW: 75_000_000_000,
    });
    expect(ledger.summary.status).toBe("blocked");
    expect(ledger.summary.diagnosticCycleComputationComplete).toBe(true);
    expect(ledger.summary.cycleEnergyLedgerReceiptReady).toBe(false);
    expect(ledger.summary.serverAuthenticatedEvidence).toBe(false);
    expect(ledger.blockers).toContain(
      "server_authenticated_cycle_evidence_missing",
    );
    expect(ledger.summary.fullApparatusTensorRefSupplied).toBe(false);
    expect(ledger.summary.fullApparatusTensorBound).toBe(false);
    expect(ledger.downstreamBlockers).toContain(
      "full_apparatus_tensor_receipt_missing",
    );
    expect(ledger.claimBoundary.cycleClosureDoesNotEstablishArrayScaling).toBe(
      true,
    );
    expect(
      ledger.claimBoundary.cycleClosureDoesNotSupplyFullApparatusTensor,
    ).toBe(true);
  });

  it("rejects an unclosed first-law residual", () => {
    const evidence = validEvidence();
    evidence.exportedEnergy.rejectedHeatJ = 7;
    const ledger = buildNhm2TileCycleEnergyLedger({ evidence });

    expect(ledger.derived.firstLawResidualJ).toBe(1);
    expect(ledger.derived.energyBalanceClosed).toBe(false);
    expect(ledger.blockers).toContain("first_law_energy_balance_not_closed");
    expect(ledger.summary.cycleEnergyLedgerReceiptReady).toBe(false);
  });

  it("rejects apparent useful work without identified input exergy", () => {
    const evidence = validEvidence();
    evidence.identifiedInputExergyJ = 0;
    const ledger = buildNhm2TileCycleEnergyLedger({ evidence });

    expect(ledger.derived.usefulWorkObserved).toBe(true);
    expect(ledger.derived.identifiedEnergySourceBound).toBe(false);
    expect(ledger.blockers).toContain(
      "useful_work_has_no_bounded_input_exergy_source",
    );
    expect(ledger.summary.cycleEnergyLedgerReceiptReady).toBe(false);
  });

  it("rejects useful output exceeding the identified input exergy", () => {
    const evidence = validEvidence();
    evidence.identifiedInputExergyJ = 4;
    const ledger = buildNhm2TileCycleEnergyLedger({ evidence });

    expect(ledger.derived.exergyEfficiency).toBe(1.25);
    expect(ledger.blockers).toContain(
      "useful_work_exceeds_identified_input_exergy",
    );
    expect(ledger.summary.cycleEnergyLedgerReceiptReady).toBe(false);
  });

  it("requires period and declared frequency to describe the same cycle", () => {
    const evidence = validEvidence();
    evidence.cyclePeriodSeconds = 1 / 10e9;
    const ledger = buildNhm2TileCycleEnergyLedger({ evidence });

    expect(ledger.derived.frequencyPeriodConsistent).toBe(false);
    expect(ledger.blockers).toContain("cycle_frequency_period_inconsistent");
  });

  it("allows a signed stored-energy reference while requiring its cycle delta to close", () => {
    const evidence = validEvidence();
    evidence.initialStoredEnergyJ = -8.464e-8;
    evidence.finalStoredEnergyJ = -8.464e-8;
    const ledger = buildNhm2TileCycleEnergyLedger({ evidence });

    expect(ledger.derived.storedEnergyDeltaJ).toBe(0);
    expect(ledger.derived.repeatableStateClosed).toBe(true);
    expect(ledger.derived.diagnosticCycleComputationComplete).toBe(true);
    expect(ledger.summary.cycleEnergyLedgerReceiptReady).toBe(false);
  });

  it("keeps heat, radiation and leakage as mutually exclusive export channels", () => {
    const ledger = buildNhm2TileCycleEnergyLedger({
      evidence: validEvidence(),
    });

    expect(ledger.accountingConvention).toMatchObject({
      rejectedHeatRadiationAndLeakageAreExportChannelsNotSecondSubtractions: true,
      staticCasimirEnergyTimesFrequencyIsNotPowerAuthority: true,
      usefulWorkIsExportNotEnergyCreation: true,
    });
    expect(ledger.derived.totalExportedEnergyJ).toBe(
      ledger.derived.usefulWorkOutputJ! +
        ledger.derived.nonUsefulExportEnergyJ!,
    );
  });

  it("clones and deeply freezes supplied evidence", () => {
    const evidence = validEvidence();
    const ledger = buildNhm2TileCycleEnergyLedger({ evidence });
    evidence.importedEnergy.electricalDriveJ = 99;
    evidence.reservoirIds.push("late-mutation");

    expect(ledger.evidence.importedEnergy?.electricalDriveJ).toBe(8);
    expect(ledger.evidence.reservoirIds).toEqual([
      "electrical-drive",
      "cold-sink",
    ]);
    expect(Object.isFrozen(ledger)).toBe(true);
    expect(Object.isFrozen(ledger.evidence)).toBe(true);
    expect(Object.isFrozen(ledger.evidence.importedEnergy)).toBe(true);
    expect(Object.isFrozen(ledger.evidence.reservoirIds)).toBe(true);
  });

  it("rejects duplicate or overlong reservoir inventories", () => {
    const duplicate = validEvidence();
    duplicate.reservoirIds = ["electrical-drive", "electrical-drive"];
    expect(
      buildNhm2TileCycleEnergyLedger({ evidence: duplicate }).blockers,
    ).toContain("reservoir_inventory_missing_or_invalid");

    const overlong = validEvidence();
    overlong.reservoirIds = Array.from(
      { length: 17 },
      (_, index) => `r-${index}`,
    );
    expect(
      buildNhm2TileCycleEnergyLedger({ evidence: overlong }).blockers,
    ).toContain("reservoir_inventory_missing_or_invalid");
  });

  it("never treats the ideal scalar or cycle closure as viability authority", () => {
    const ledger = buildNhm2TileCycleEnergyLedger({
      evidence: validEvidence(),
    });

    expect(ledger.claimBoundary).toEqual({
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
    });
  });

  it("rejects serialized promotion of authentication or receipt readiness", () => {
    const promoted = JSON.parse(
      JSON.stringify(
        buildNhm2TileCycleEnergyLedger({ evidence: validEvidence() }),
      ),
    ) as Record<string, any>;
    promoted.summary.cycleEnergyLedgerReceiptReady = true;
    promoted.summary.serverAuthenticatedEvidence = true;

    expect(isNhm2TileCycleEnergyLedger(promoted)).toBe(false);
  });
});
