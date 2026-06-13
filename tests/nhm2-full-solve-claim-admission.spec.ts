import { describe, expect, it } from "vitest";

import {
  NHM2_BLOCKER_LEDGER_ARTIFACT_ID,
  NHM2_BLOCKER_LEDGER_SCHEMA_VERSION,
  type Nhm2BlockerLedgerArtifact,
} from "../shared/contracts/nhm2-blocker-ledger.v1";
import {
  NHM2_COUPLED_CLOSURE_PASS_CANDIDATE_CONTRACT_VERSION,
  type Nhm2CoupledClosurePassCandidateArtifactV1,
} from "../shared/contracts/nhm2-coupled-closure-pass-candidate.v1";
import {
  buildNhm2FullSolveClaimAdmission,
  isNhm2FullSolveClaimAdmissionArtifact,
  type Nhm2ReferenceRunValidationAdmissionLike,
} from "../shared/contracts/nhm2-full-solve-claim-admission.v1";

const coupled = (passCandidate: boolean): Nhm2CoupledClosurePassCandidateArtifactV1 => ({
  contractVersion: NHM2_COUPLED_CLOSURE_PASS_CANDIDATE_CONTRACT_VERSION,
  generatedAt: "2026-06-12T00:00:00.000Z",
  laneId: "nhm2_shift_lapse",
  selectedProfileId: "stage1_centerline_alpha_0p995_v1",
  runId: "claim-admission-test",
  artifactRefs: {
    regionalSupportFunctionAtlas: null,
    regionalMaterialSourceTensorModel: null,
    tileLocalSourceElements: null,
    tileEffectiveCounterpart: null,
    sourceSideSameBasisTensorAuthority: null,
    regionalSourceClosureEvidence: null,
    sourceClosurePassReadiness: null,
    conservation: null,
    qeiWorldlineDossier: null,
    observerRobustEnergyConditions: null,
    casimirMaterialReceipt: null,
  },
  gates: passCandidate
    ? []
    : [
        {
          gateId: "regional_residuals",
          status: "fail",
          pass: false,
          blockers: ["wall_residual_exceeded"],
          warnings: [],
          primaryMetric: "wall.relLInf=1",
        },
      ],
  summary: {
    passCandidate,
    sourceClosurePassSignalAllowed: passCandidate,
    allRequiredRegionsAuthoritative: passCandidate,
    wallAuthorityPresent: passCandidate,
    wallClosureReady: passCandidate,
    regionalResidualsPass: passCandidate,
    conservationPass: passCandidate,
    qeiDossierPass: passCandidate,
    observerRobustPass: passCandidate,
    materialReceipted: passCandidate,
    atlasConsumerCongruencePass: passCandidate,
    firstBlocker: passCandidate ? "none" : "regional_residuals:wall_residual_exceeded",
    blockerCount: passCandidate ? 0 : 1,
  },
  claimBoundary: {
    diagnosticOnly: true,
    physicalViabilityClaimAllowed: false,
    transportClaimAllowed: false,
    doesNotRecomputePhysics: true,
    requiresSameRunSameChartEvidence: true,
  },
});

const validation = (
  overallState: "pass" | "review" | "fail",
): Nhm2ReferenceRunValidationAdmissionLike => ({
  artifactId: "nhm2_reference_run_validation",
  schemaVersion: "nhm2_reference_run_validation/v1",
  runId: "claim-admission-test",
  overallState,
  validationClaimAllowed: false,
  adapterVerificationStatus: "pass",
});

const ledger = (
  overallState: "pass" | "review" | "fail",
  reproStatus: Nhm2BlockerLedgerArtifact["reproducibilityBlockers"]["status"],
  certificateStatus: string | null,
  certificateIntegrity: string | null,
): Nhm2BlockerLedgerArtifact => ({
  artifactId: NHM2_BLOCKER_LEDGER_ARTIFACT_ID,
  schemaVersion: NHM2_BLOCKER_LEDGER_SCHEMA_VERSION,
  generatedAt: "2026-06-12T00:00:00.000Z",
  runId: "claim-admission-test",
  selectedProfileId: "stage1_centerline_alpha_0p995_v1",
  expectedProfileId: "stage1_centerline_alpha_0p995_v1",
  profileMatch: true,
  laneId: "nhm2_shift_lapse",
  claimLock: {
    validationClaimAllowed: false,
    physicalMechanismClaimAllowed: false,
    promotionAllowed: false,
    allowedClaimTier: overallState === "pass" ? "reduced-order" : "diagnostic",
    claimEffect:
      overallState === "pass"
        ? "reduced_order_candidate_evidence"
        : "blocker_ledger_only",
  },
  artifactRefs: {
    referenceRun: "reference.json",
    fullLoopAudit: "audit.json",
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
    coupledClosurePassCandidate: "coupled.json",
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
    conservationStatus: "pass",
    qeiLinkageStatus: "pass",
    sourceSideAuthorityRef: null,
    sourceSideAuthorityStatus: "authoritative_same_basis",
    hasWallAuthority: true,
    allRequiredRegionsAuthoritative: true,
    authorityMissingRegionIds: [],
    sourceClosurePassSignalAllowed: true,
    firstRetirableBlocker: null,
    preflightBlockers: [],
    coupledClosurePassCandidateRef: "coupled.json",
    coupledClosurePassCandidate: true,
    coupledClosureFirstBlocker: null,
    coupledClosureBlockers: [],
  },
  gateSummary: [],
  regionalBlockers: [],
  observerBlockers: { summaryVsDetailedStatus: "pass", reasonCodes: [] },
  qeiBlockers: {
    status: "pass",
    qeiApplicabilityStatus: "PASS",
    missingFields: [],
  },
  reproducibilityBlockers: {
    status: reproStatus,
    missingFields: reproStatus === "pass" ? [] : ["meshConvergenceOrder"],
  },
  certificatePolicy: {
    certificateStatus,
    certificateIntegrity,
    greenButNonPromotional: false,
    reason: null,
  },
  adapterVerification: { status: "pass", physicsImpact: "none_claimed" },
  literatureClaimBoundary: {
    externalTheoryDoesNotValidateNHM2: true,
    noPredictiveLanguageFromExperimentalMathOnly: true,
    sourcesChecked: ["santiago_schuster_visser_2021_generic_warp_nec"],
  },
  overallState,
  primaryBlockerClass: overallState === "pass" ? null : "source_closure",
  nextPatchRecommendation: "continue targeted blocker retirement from the frozen ledger",
  reasonCodes: [],
});

describe("nhm2_full_solve_claim_admission/v1", () => {
  it("blocks when the coupled closure pass-candidate artifact is missing", () => {
    const artifact = buildNhm2FullSolveClaimAdmission({});

    expect(artifact.admission.status).toBe("blocked");
    expect(artifact.admission.diagnosticClosurePassed).toBe(false);
    expect(artifact.blockers).toContain("coupled_closure_pass_candidate_missing");
    expect(artifact.admission.physicalClaimAllowed).toBe(false);
    expect(artifact.admission.transportClaimAllowed).toBe(false);
    expect(isNhm2FullSolveClaimAdmissionArtifact(artifact)).toBe(true);
  });

  it("blocks when coupled diagnostic closure is false", () => {
    const artifact = buildNhm2FullSolveClaimAdmission({
      coupledClosurePassCandidate: coupled(false),
    });

    expect(artifact.admission.status).toBe("blocked");
    expect(artifact.blockers).toContain("diagnostic_closure_pass_candidate_false");
    expect(artifact.blockers).toContain("regional_residuals:wall_residual_exceeded");
  });

  it("keeps a closure pass candidate diagnostic until ledger validation and certificate evidence pass", () => {
    const artifact = buildNhm2FullSolveClaimAdmission({
      coupledClosurePassCandidate: coupled(true),
    });

    expect(artifact.admission.status).toBe("diagnostic_closure_candidate");
    expect(artifact.admission.diagnosticClosurePassed).toBe(true);
    expect(artifact.admission.numericalReliabilityPassed).toBe(false);
    expect(artifact.blockers).toContain("reference_run_validation_missing");
    expect(artifact.blockers).toContain("blocker_ledger_missing");
    expect(artifact.claimBoundary.passCandidateIsNotPhysicalViability).toBe(true);
  });

  it("admits only a reduced-order numerical candidate when all numerical gates pass", () => {
    const artifact = buildNhm2FullSolveClaimAdmission({
      coupledClosurePassCandidate: coupled(true),
      blockerLedger: ledger("pass", "pass", "GREEN", "OK"),
      referenceRunValidation: validation("pass"),
    });

    expect(artifact.admission.status).toBe("reduced_order_numerical_candidate");
    expect(artifact.admission.numericalReliabilityPassed).toBe(true);
    expect(artifact.admission.reproducibilityPassed).toBe(true);
    expect(artifact.admission.certificateGreen).toBe(true);
    expect(artifact.blockers).toContain("external_physical_validation_missing");
    expect(artifact.admission.physicalClaimAllowed).toBe(false);
    expect(artifact.admission.transportClaimAllowed).toBe(false);
    expect(isNhm2FullSolveClaimAdmissionArtifact(artifact)).toBe(true);
  });

  it("does not pass numerical reliability with unknown certificate integrity", () => {
    const artifact = buildNhm2FullSolveClaimAdmission({
      coupledClosurePassCandidate: coupled(true),
      blockerLedger: ledger("pass", "pass", "GREEN", null),
      referenceRunValidation: validation("pass"),
    });

    expect(artifact.admission.status).toBe("diagnostic_closure_candidate");
    expect(artifact.admission.certificateGreen).toBe(false);
    expect(artifact.blockers).toContain("certificate_not_green_or_integrity_unknown");
  });
});
