import { describe, expect, it } from "vitest";

import {
  buildNhm2BlockerLedgerArtifact,
  isNhm2BlockerLedgerArtifact,
  type Nhm2BlockerLedgerArtifact,
} from "../shared/contracts/nhm2-blocker-ledger.v1";

const validLedger = () =>
  buildNhm2BlockerLedgerArtifact({
    generatedAt: "2026-05-05T00:00:00.000Z",
    runId: "ledger-run",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    expectedProfileId: "stage1_centerline_alpha_0p995_v1",
    laneId: "nhm2_shift_lapse",
    claimLock: {
      validationClaimAllowed: false,
      physicalMechanismClaimAllowed: false,
      promotionAllowed: false,
      allowedClaimTier: null,
      claimEffect: "blocker_ledger_only",
    },
    artifactRefs: {
      referenceRun: "reference.json",
      fullLoopAudit: "full-loop.json",
      qeiDossier: null,
      tileEffectiveCounterpart: "tile.json",
      regionalSourceClosureEvidence: "regional.json",
      sourceToGeometryDivergenceReport: null,
      tileCounterpartProvenanceAudit: null,
      sourceTensorArtifact: null,
      tileLocalSourceElements: null,
      conservationArtifact: null,
      sourceSideSameBasisTensorAuthority: null,
      sourceClosurePassReadiness: null,
      coupledClosurePassCandidate: null,
      referenceRunValidation: "validation.json",
    },
    tileCounterpartSource: {
      sourceTensorArtifactRef: null,
      sourceTensorAuthorityMode: null,
      tileLocalSourceElementsRef: null,
      tileLocalSourceElementCount: null,
      tileLocalSourceWallCoverage: null,
      tileLocalSourceMaterialReceiptStatus: null,
      tileLocalSourceFirstBlocker: null,
      conservationStatus: null,
      qeiLinkageStatus: null,
      sourceSideAuthorityRef: null,
      sourceSideAuthorityStatus: "missing",
      hasWallAuthority: null,
      allRequiredRegionsAuthoritative: null,
      authorityMissingRegionIds: [],
      sourceClosurePassSignalAllowed: null,
      firstRetirableBlocker: null,
      preflightBlockers: [],
      coupledClosurePassCandidateRef: null,
      coupledClosurePassCandidate: null,
      coupledClosureFirstBlocker: null,
      coupledClosureBlockers: [],
      coupledClosureFirstRequiredCorrections: {},
      coupledClosureRequiredCorrections: {},
    },
    gateSummary: [
      {
        gateId: "GATE_QEI_DOSSIER_PRESENT",
        state: "review",
        reasonCodes: ["qei_dossier_missing"],
        blockerClass: "qei",
      },
    ],
    regionalBlockers: [
      {
        regionId: "global",
        firstDivergenceBoundary: "none",
        metricTensorAuthorityMode: "full_tensor",
        tileTensorAuthorityMode: "full_tensor",
        comparisonRole: "tile_effective_counterpart",
        relLInf: 0,
        absLInf: 0,
        status: "pass",
        nextRequiredEvidence: "none",
      },
      {
        regionId: "hull",
        firstDivergenceBoundary: "counterpart_missing",
        metricTensorAuthorityMode: "full_tensor",
        tileTensorAuthorityMode: "unknown",
        comparisonRole: "unknown",
        relLInf: null,
        absLInf: null,
        status: "review",
        nextRequiredEvidence: "emit tile counterpart",
      },
    ],
    observerBlockers: { summaryVsDetailedStatus: "unknown", reasonCodes: [] },
    qeiBlockers: {
      status: "missing",
      qeiApplicabilityStatus: null,
      missingFields: ["qei_dossier_missing"],
    },
    reproducibilityBlockers: {
      status: "review",
      missingFields: ["independentReproductionStatus"],
    },
    certificatePolicy: {
      certificateStatus: "GREEN",
      certificateIntegrity: "true",
      greenButNonPromotional: true,
      reason: "certificate green is non-promotional because reference validation remains non-pass",
    },
    adapterVerification: {
      status: "blocked_infra_endpoint_unavailable",
      physicsImpact: "none_claimed",
    },
    literatureClaimBoundary: {
      externalTheoryDoesNotValidateNHM2: true,
      noPredictiveLanguageFromExperimentalMathOnly: true,
      sourcesChecked: ["maldacena_1997_ads_cft"],
    },
    primaryBlockerClass: "qei",
    nextPatchRecommendation: "publish QEI dossier",
  });

describe("nhm2 blocker ledger contract", () => {
  it("rejects validationClaimAllowed=true", () => {
    const ledger = validLedger() as unknown as Record<string, unknown>;
    (ledger.claimLock as Record<string, unknown>).validationClaimAllowed = true;
    expect(isNhm2BlockerLedgerArtifact(ledger)).toBe(false);
  });

  it("rejects promotionAllowed=true", () => {
    const ledger = validLedger() as unknown as Record<string, unknown>;
    (ledger.claimLock as Record<string, unknown>).promotionAllowed = true;
    expect(isNhm2BlockerLedgerArtifact(ledger)).toBe(false);
  });

  it("rejects physical mechanism claim allowed", () => {
    const ledger = validLedger() as unknown as Record<string, unknown>;
    (ledger.claimLock as Record<string, unknown>).physicalMechanismClaimAllowed = true;
    expect(isNhm2BlockerLedgerArtifact(ledger)).toBe(false);
  });

  it("rejects profile mismatch", () => {
    const ledger = validLedger() as unknown as Record<string, unknown>;
    ledger.expectedProfileId = "stage1_centerline_alpha_0p7000_v1";
    expect(isNhm2BlockerLedgerArtifact(ledger)).toBe(false);
  });

  it("rejects pass ledger when a hard gate fails", () => {
    const ledger = validLedger() as unknown as Nhm2BlockerLedgerArtifact;
    ledger.gateSummary[0] = {
      gateId: "GATE_TILE_COUNTERPART_NOT_METRIC_ECHO",
      state: "fail",
      reasonCodes: ["metric_echo_not_source_closure"],
      blockerClass: "tile_counterpart",
    };
    ledger.overallState = "pass";
    expect(isNhm2BlockerLedgerArtifact(ledger)).toBe(false);
  });

  it("accepts review ledger with explicit blockers", () => {
    const ledger = validLedger();
    expect(ledger.overallState).toBe("review");
    expect(isNhm2BlockerLedgerArtifact(ledger)).toBe(true);
  });
});
