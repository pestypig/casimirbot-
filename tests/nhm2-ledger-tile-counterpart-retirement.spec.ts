import { describe, expect, it } from "vitest";

import { buildNhm2BlockerLedgerArtifact } from "../shared/contracts/nhm2-blocker-ledger.v1";

const base = (overrides = {}) =>
  buildNhm2BlockerLedgerArtifact({
    generatedAt: "2026-05-05T00:00:00.000Z",
    runId: "run-1",
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
    gateSummary: [],
    regionalBlockers: ["global", "hull", "wall", "exterior_shell"].map((regionId) => ({
      regionId: regionId as "global" | "hull" | "wall" | "exterior_shell",
      firstDivergenceBoundary: "none" as const,
      metricTensorAuthorityMode: "full_tensor",
      tileTensorAuthorityMode: "full_tensor",
      comparisonRole: "tile_effective_counterpart",
      relLInf: 0,
      absLInf: 0,
      status: "pass" as const,
      nextRequiredEvidence: "none",
    })),
    observerBlockers: { summaryVsDetailedStatus: "pass", reasonCodes: [] },
    qeiBlockers: { status: "missing", qeiApplicabilityStatus: null, missingFields: ["qei_dossier_missing"] },
    reproducibilityBlockers: { status: "pass", missingFields: [] },
    certificatePolicy: { certificateStatus: "GREEN", certificateIntegrity: "true", greenButNonPromotional: true, reason: "non-promotional" },
    adapterVerification: { status: "not_run", physicsImpact: "none_claimed" },
    literatureClaimBoundary: {
      externalTheoryDoesNotValidateNHM2: true,
      noPredictiveLanguageFromExperimentalMathOnly: true,
      sourcesChecked: ["maldacena_1997_ads_cft"],
    },
    primaryBlockerClass: null,
    nextPatchRecommendation: "continue targeted blocker retirement",
    ...overrides,
  });

describe("ledger tile-counterpart blocker retirement states", () => {
  it("keeps primary blocker at tile_counterpart when full tensor source is missing", () => {
    const ledger = base({
      gateSummary: [{
        gateId: "GATE_TILE_COUNTERPART_FULL_TENSOR_AUTHORITY",
        state: "review",
        reasonCodes: ["hull_full_tensor_authority_missing"],
        blockerClass: "tile_counterpart",
      }],
      primaryBlockerClass: "tile_counterpart",
    });
    expect(ledger.primaryBlockerClass).toBe("tile_counterpart");
  });

  it("moves blocker to QEI when source tensor authority is present but QEI is missing", () => {
    const ledger = base({
      artifactRefs: {
        referenceRun: "reference.json",
        fullLoopAudit: "full-loop.json",
        qeiDossier: null,
        tileEffectiveCounterpart: "tile.json",
        regionalSourceClosureEvidence: "regional.json",
        sourceToGeometryDivergenceReport: null,
        tileCounterpartProvenanceAudit: null,
        sourceTensorArtifact: "source-tensor.json",
        tileLocalSourceElements: null,
        conservationArtifact: null,
        sourceSideSameBasisTensorAuthority: "source-authority.json",
        sourceClosurePassReadiness: "readiness.json",
        coupledClosurePassCandidate: null,
        referenceRunValidation: "validation.json",
      },
      tileCounterpartSource: {
        sourceTensorArtifactRef: "source-tensor.json",
        sourceTensorAuthorityMode: "reconstituted_from_source_channels",
        tileLocalSourceElementsRef: null,
        tileLocalSourceElementCount: null,
        tileLocalSourceWallCoverage: null,
        tileLocalSourceMaterialReceiptStatus: null,
        tileLocalSourceFirstBlocker: null,
        conservationStatus: "unknown",
        qeiLinkageStatus: "UNKNOWN",
        sourceSideAuthorityRef: "source-authority.json",
        sourceSideAuthorityStatus: "authoritative_same_basis",
        hasWallAuthority: true,
        allRequiredRegionsAuthoritative: true,
        authorityMissingRegionIds: [],
        sourceClosurePassSignalAllowed: true,
        firstRetirableBlocker: "none",
        preflightBlockers: [],
        coupledClosurePassCandidateRef: null,
        coupledClosurePassCandidate: null,
        coupledClosureFirstBlocker: null,
        coupledClosureBlockers: [],
        coupledClosureFirstRequiredCorrections: {},
        coupledClosureRequiredCorrections: {},
      },
      gateSummary: [{
        gateId: "GATE_QEI_DOSSIER_PRESENT",
        state: "review",
        reasonCodes: ["qei_dossier_missing"],
        blockerClass: "qei",
      }],
      primaryBlockerClass: "qei",
    });
    expect(ledger.tileCounterpartSource.sourceTensorArtifactRef).toBe("source-tensor.json");
    expect(ledger.primaryBlockerClass).toBe("qei");
  });

  it("records conservation unknown after counterpart authority exists", () => {
    const ledger = base({
      regionalBlockers: ["global", "hull", "wall", "exterior_shell"].map((regionId) => ({
        regionId: regionId as "global" | "hull" | "wall" | "exterior_shell",
        firstDivergenceBoundary: "conservation_unknown" as const,
        metricTensorAuthorityMode: "full_tensor",
        tileTensorAuthorityMode: "symmetric_full_tensor",
        comparisonRole: "tile_effective_counterpart",
        relLInf: 0,
        absLInf: 0,
        status: "review" as const,
        nextRequiredEvidence: "emit pass-level conservation diagnostics",
      })),
      primaryBlockerClass: "source_closure",
    });
    expect(ledger.regionalBlockers[0].firstDivergenceBoundary).toBe("conservation_unknown");
  });

  it("records residual_exceeded when counterpart and physics-linkage blockers are cleared", () => {
    const ledger = base({
      regionalBlockers: [
        {
          regionId: "wall",
          firstDivergenceBoundary: "residual_exceeded",
          metricTensorAuthorityMode: "full_tensor",
          tileTensorAuthorityMode: "symmetric_full_tensor",
          comparisonRole: "tile_effective_counterpart",
          relLInf: 0.25,
          absLInf: 2,
          status: "fail",
          nextRequiredEvidence: "inspect dominant residual",
        },
      ],
      primaryBlockerClass: "source_closure",
    });
    expect(ledger.overallState).toBe("fail");
    expect(ledger.regionalBlockers[0].firstDivergenceBoundary).toBe("residual_exceeded");
  });

  it("keeps GREEN certificate non-promotional while ledger is non-pass", () => {
    const ledger = base({
      gateSummary: [{ gateId: "GATE_QEI_DOSSIER_PRESENT", state: "review", reasonCodes: ["qei_dossier_missing"], blockerClass: "qei" }],
      primaryBlockerClass: "qei",
    });
    expect(ledger.certificatePolicy.greenButNonPromotional).toBe(true);
    expect(ledger.overallState).not.toBe("pass");
  });
});
