import { describe, expect, it } from "vitest";
import {
  NHM2_FULL_LOOP_AUDIT_CONTRACT_VERSION,
  NHM2_FULL_LOOP_AUDIT_ID,
  NHM2_FULL_LOOP_AUDIT_LANE_ID,
  NHM2_FULL_LOOP_AUDIT_SECTION_ORDER,
  buildNhm2FullLoopAuditContract,
  isNhm2FullLoopAuditContract,
  type Nhm2FullLoopAuditSectionsInput,
} from "../shared/contracts/nhm2-full-loop-audit.v1";

const makeArtifactRef = (artifactId: string, path: string) => ({
  artifactId,
  path,
  contractVersion: null,
  status: null,
});

const makeSections = (): Nhm2FullLoopAuditSectionsInput => ({
  family_semantics: {
    sectionId: "family_semantics",
    state: "pass",
    reasons: [],
    artifactRefs: [makeArtifactRef("closed_loop_doc", "docs/nhm2-closed-loop.md")],
    familyId: "nhm2_shift_lapse",
    baseFamily: "natario_zero_expansion",
    lapseExtension: true,
    selectedProfileId: "stage1_centerline_alpha_0p9625_v1",
    semanticBoundaries: [
      "Natario-style zero-expansion base",
      "lapse-extended candidate lane",
    ],
    nonClaims: [
      "not a certified transport solution",
      "not a physically solved warp bubble",
    ],
  },
  claim_tier: {
    sectionId: "claim_tier",
    state: "review",
    reasons: ["insufficient_provenance"],
    artifactRefs: [makeArtifactRef("math_status", "MATH_STATUS.md")],
    currentTier: "diagnostic",
    maximumClaimTier: "reduced-order",
    viabilityStatus: "MARGINAL",
    promotionReason: "insufficient_provenance",
    surfaceStages: [
      { module: "modules/warp/natario-warp.ts", stage: "reduced-order" },
      { module: "server/stress-energy-brick.ts", stage: "reduced-order" },
      { module: "server/gr-evolve-brick.ts", stage: "diagnostic" },
      { module: "tools/warpViability.ts", stage: "diagnostic" },
      { module: "tools/warpViabilityCertificate.ts", stage: "certified" },
    ],
  },
  lapse_provenance: {
    sectionId: "lapse_provenance",
    state: "review",
    reasons: ["insufficient_provenance"],
    artifactRefs: [
      makeArtifactRef("metric_adapter", "modules/warp/warp-metric-adapter.ts"),
    ],
    metricFamily: "nhm2_shift_lapse",
    shiftLapseProfileId: "stage1_centerline_alpha_0p9625_v1",
    shiftLapseProfileStage: "stage1",
    familyAuthorityStatus: "candidate_authoritative_solve_family",
    transportCertificationStatus: "bounded_transport_fail_closed_reference_only",
    metricT00ContractStatus: "ok",
    chartContractStatus: "ok",
  },
  strict_signal_readiness: {
    sectionId: "strict_signal_readiness",
    state: "unavailable",
    reasons: ["strict_signal_missing"],
    artifactRefs: [makeArtifactRef("warp_viability", "tools/warpViability.ts")],
    strictModeEnabled: true,
    thetaMetricDerived: true,
    tsMetricDerived: false,
    qiMetricDerived: null,
    qiApplicabilityStatus: null,
    missingSignals: ["ts", "qi"],
  },
  source_closure: {
    sectionId: "source_closure",
    state: "unavailable",
    reasons: ["source_closure_missing"],
    artifactRefs: [],
    metricTensorRef: null,
    tileEffectiveTensorRef: null,
    residualRms: null,
    residualMax: null,
    residualByRegion: {
      hull: null,
      wall: null,
      exteriorShell: null,
    },
    toleranceRef: null,
    assumptionsDrifted: null,
  },
  observer_audit: {
    sectionId: "observer_audit",
    state: "review",
    reasons: ["observer_audit_incomplete"],
    artifactRefs: [makeArtifactRef("stress_brick", "server/stress-energy-brick.ts")],
    observerBlockingAssessmentStatus: "observer_contract_incomplete",
    observerBlockingAssessmentNote: "tile_effective missing flux diagnostics",
    observerPromotionBlockingSurface: "unknown",
    observerPromotionBlockingCondition: "unknown",
    observerMetricPrimaryDriver: "unknown",
    observerTilePrimaryDriver: "unknown",
    observerPrimaryDriverAgreement: "unknown",
    observerPrimaryDriverNote: null,
    observerMetricFirstInspectionTarget: null,
    observerTileFirstInspectionTarget: null,
    observerSharedRootDriverStatus: "unknown",
    observerSharedRootDriverNote: null,
    observerSharedUpstreamDriverStatus: "unknown",
    observerSharedUpstreamDriverNote: null,
    observerWecPropagationStatus: "unknown",
    observerWecPropagationNote: null,
    observerRemediationSequenceStatus: "unknown",
    observerMetricCompletenessStatus: "incomplete_missing_inputs",
    observerMetricCompletenessNote:
      "Metric-required observer audit remains diagonal-only because T0i flux terms and off-diagonal spatial shear terms were not supplied; missing inputs: metric_t0i_missing, metric_tij_off_diagonal_missing",
    observerMetricCoverageBlockerStatus: "producer_not_emitted",
    observerMetricCoverageBlockerNote:
      "Metric-required observer completeness stops at metric tensor emission: the emitted same-chart observer tensor is diagonal-only and does not supply T0i flux terms or off-diagonal Tij shear terms, so completeness cannot close without new tensor emission semantics.",
    observerMetricFirstMissingStage: "metric_tensor_emission",
    observerMetricEmissionAdmissionStatus: "not_admitted",
    observerMetricEmissionAdmissionNote:
      "Admission failed: the current metric-required branch emits a reduced-order diagonal tensor only. Closing T0i and off-diagonal Tij would require a new same-chart full-tensor emission semantics rather than simple serialization or consumer wiring.",
    observerMetricT0iAdmissionStatus: "basis_or_semantics_ambiguous",
    observerMetricT0iAdmissionNote:
      "T0i is not carried as an emitted same-chart quantity. The current branch would need a new momentum-density emission semantics, not a serialization of an existing tensor component.",
    observerMetricOffDiagonalTijAdmissionStatus:
      "basis_or_semantics_ambiguous",
    observerMetricOffDiagonalTijAdmissionNote:
      "Off-diagonal Tij is not emitted and the current diagonal pressures are reduced-order placeholders. Closing shear terms would require a new same-chart full-tensor stress semantics, not a publication-only fix.",
    observerTileAuthorityStatus: "proxy_limited",
    observerTileAuthorityNote:
      "Tile-effective observer audit remains proxy-limited: fluxHandling=voxel_flux_field, shearHandling=not_modeled_in_proxy.",
    observerLeadReadinessWorkstream: "observer_completeness_and_authority",
    observerLeadReadinessReason:
      "Observer fail remains mixed: same-surface negativity is real, metric-required coverage still misses T0i/off-diagonal inputs, and tile-effective authority remains proxy-limited.",
    observerNextTechnicalAction: "emit_same_chart_metric_flux_and_shear_terms",
    observerTileDiminishingReturnStatus: "unknown",
    observerTileDiminishingReturnNote: null,
    metric: {
      state: "pass",
      wecMinOverAllTimelike: 0,
      necMinOverAllNull: 0,
      decStatus: "REVIEW",
      secStatus: "REVIEW",
      observerWorstCaseLocation: "wall",
      typeIFraction: 1,
      missedViolationFraction: 0,
      maxRobustMinusEulerian: 0,
    },
    tile: {
      state: "review",
      wecMinOverAllTimelike: null,
      necMinOverAllNull: null,
      decStatus: null,
      secStatus: null,
      observerWorstCaseLocation: null,
      typeIFraction: null,
      missedViolationFraction: null,
      maxRobustMinusEulerian: null,
    },
  },
  gr_stability_safety: {
    sectionId: "gr_stability_safety",
    state: "review",
    reasons: ["policy_review_required"],
    artifactRefs: [makeArtifactRef("gr_evolve_brick", "server/gr-evolve-brick.ts")],
    solverHealth: "diagnostic_ready",
    perturbationFamilies: ["alpha", "shell_thickness"],
    H_rms: 0.004,
    M_rms: 0.0008,
    H_maxAbs: 0.06,
    M_maxAbs: 0.008,
    centerlineProperAcceleration_mps2: 0,
    wallNormalSafetyMargin: null,
    blueshiftMax: null,
    stabilityWorstCase: "wall_adjacency",
    safetyWorstCaseLocation: "wall",
  },
  mission_time_outputs: {
    sectionId: "mission_time_outputs",
    state: "pass",
    reasons: [],
    artifactRefs: [
      makeArtifactRef(
        "mission_time_estimator",
        "artifacts/research/full-solve/nhm2-mission-time-estimator-latest.json",
      ),
      makeArtifactRef(
        "mission_time_comparison",
        "artifacts/research/full-solve/nhm2-mission-time-comparison-latest.json",
      ),
    ],
    worldlineStatus: "bounded_solve_backed",
    routeTimeStatus: "bounded_route_time_ready",
    missionTimeEstimatorStatus: "bounded_target_coupled_estimate_ready",
    missionTimeComparisonStatus: "bounded_target_coupled_comparison_ready",
    targetId: "alpha-cen-a",
    coordinateTimeEstimateSeconds: 137755965.9171795,
    properTimeEstimateSeconds: 137755965.9171795,
    properMinusCoordinateSeconds: 0,
    comparatorId: "nhm2_classical_no_time_dilation_reference",
  },
  shift_vs_lapse_decomposition: {
    sectionId: "shift_vs_lapse_decomposition",
    state: "review",
    reasons: ["shift_lapse_decomposition_missing"],
    artifactRefs: [],
    shiftDrivenContribution: null,
    lapseDrivenContribution: null,
    expansionLeakageBound: null,
    thetaFlatnessStatus: null,
    divBetaFlatnessStatus: null,
    natarioBaselineComparisonRef: null,
  },
  uncertainty_perturbation_reproducibility: {
    sectionId: "uncertainty_perturbation_reproducibility",
    state: "unavailable",
    reasons: ["perturbation_suite_missing", "reproducibility_missing"],
    artifactRefs: [],
    precisionAgreementStatus: null,
    meshConvergenceOrder: null,
    boundaryConditionSensitivity: null,
    smoothingKernelSensitivity: null,
    coldStartReproductionStatus: null,
    independentReproductionStatus: null,
    artifactHashConsistencyStatus: null,
  },
  certificate_policy_result: {
    sectionId: "certificate_policy_result",
    state: "unavailable",
    reasons: ["certificate_missing", "status_non_admissible"],
    artifactRefs: [makeArtifactRef("warp_certificate", "tools/warpViabilityCertificate.ts")],
    viabilityStatus: "INADMISSIBLE",
    hardConstraintPass: null,
    firstHardFailureId: null,
    certificateStatus: null,
    certificateHash: null,
    certificateIntegrity: "unavailable",
    promotionTier: "diagnostic",
    promotionReason: "status_non_admissible",
  },
});

describe("nhm2 full-loop audit contract", () => {
  it("builds a serializable contract that represents incomplete NHM2 evidence honestly", () => {
    const contract = buildNhm2FullLoopAuditContract({
      generatedAt: "2026-04-07T12:00:00.000Z",
      sections: makeSections(),
    });

    expect(contract).not.toBeNull();
    expect(contract).toMatchObject({
      contractVersion: NHM2_FULL_LOOP_AUDIT_CONTRACT_VERSION,
      auditId: NHM2_FULL_LOOP_AUDIT_ID,
      laneId: NHM2_FULL_LOOP_AUDIT_LANE_ID,
      currentClaimTier: "diagnostic",
      maximumClaimTier: "reduced-order",
      highestPassingClaimTier: null,
      overallState: "unavailable",
    });
    expect(contract?.claimTierReadiness.diagnostic.state).toBe("review");
    expect(contract?.claimTierReadiness["reduced-order"].state).toBe("unavailable");
    expect(contract?.claimTierReadiness.certified.state).toBe("unavailable");
    expect(contract?.claimTierReadiness["reduced-order"].blockingReasons).toContain(
      "strict_signal_missing",
    );
    expect(contract?.claimTierReadiness.certified.blockingReasons).toContain(
      "certificate_missing",
    );
    expect(contract?.sectionOrder).toEqual(NHM2_FULL_LOOP_AUDIT_SECTION_ORDER);
    expect(contract?.sections.observer_audit.observerTileDiminishingReturnStatus).toBe(
      "unknown",
    );
    expect(contract?.sections.observer_audit.observerTileDiminishingReturnNote).toBeNull();
    expect(
      contract?.sections.observer_audit.observerMetricCompletenessStatus,
    ).toBe("incomplete_missing_inputs");
    expect(
      contract?.sections.observer_audit.observerMetricCoverageBlockerStatus,
    ).toBe("producer_not_emitted");
    expect(
      contract?.sections.observer_audit.observerMetricFirstMissingStage,
    ).toBe("metric_tensor_emission");
    expect(
      contract?.sections.observer_audit.observerMetricEmissionAdmissionStatus,
    ).toBe("not_admitted");
    expect(
      contract?.sections.observer_audit.observerMetricT0iAdmissionStatus,
    ).toBe("basis_or_semantics_ambiguous");
    expect(
      contract?.sections.observer_audit.observerMetricOffDiagonalTijAdmissionStatus,
    ).toBe("basis_or_semantics_ambiguous");
    expect(contract?.sections.observer_audit.observerTileAuthorityStatus).toBe(
      "proxy_limited",
    );
    expect(
      contract?.sections.observer_audit.observerLeadReadinessWorkstream,
    ).toBe("observer_completeness_and_authority");
    expect(contract?.sections.observer_audit.observerNextTechnicalAction).toBe(
      "emit_same_chart_metric_flux_and_shear_terms",
    );

    const roundTrip = JSON.parse(JSON.stringify(contract));
    expect(isNhm2FullLoopAuditContract(roundTrip)).toBe(true);
  });

  it("preserves explicit negative results and repo-aligned blocking reasons", () => {
    const sections = makeSections();
    sections.source_closure = {
      ...sections.source_closure,
      state: "fail",
      reasons: ["source_closure_residual_exceeded"],
      metricTensorRef: "artifact://metric-tensor",
      tileEffectiveTensorRef: "artifact://tile-effective",
      residualRms: 0.12,
      residualMax: 0.31,
      residualByRegion: {
        hull: 0.08,
        wall: 0.31,
        exteriorShell: 0.07,
      },
      toleranceRef: "source_closure_tolerance/v1",
      assumptionsDrifted: false,
    };
    sections.strict_signal_readiness = {
      ...sections.strict_signal_readiness,
      state: "fail",
      reasons: ["strict_signal_missing", "qei_applicability_non_pass"],
      qiApplicabilityStatus: "NOT_APPLICABLE",
    };
    sections.certificate_policy_result = {
      ...sections.certificate_policy_result,
      state: "fail",
      reasons: ["hard_constraint_failed", "status_non_admissible"],
      hardConstraintPass: false,
      firstHardFailureId: "FordRomanQI",
      certificateStatus: "INADMISSIBLE",
      certificateHash: "deadbeef",
      certificateIntegrity: "fail",
      promotionReason: "hard_constraint_failed",
    };

    const contract = buildNhm2FullLoopAuditContract({
      generatedAt: "2026-04-07T12:05:00.000Z",
      sections,
    });

    expect(contract).not.toBeNull();
    expect(contract?.claimTierReadiness["reduced-order"].state).toBe("fail");
    expect(contract?.claimTierReadiness.certified.state).toBe("fail");
    expect(contract?.blockingReasons).toEqual(
      expect.arrayContaining([
        "strict_signal_missing",
        "source_closure_residual_exceeded",
        "hard_constraint_failed",
        "status_non_admissible",
      ]),
    );
    expect(contract?.highestPassingClaimTier).toBeNull();
    expect(isNhm2FullLoopAuditContract(contract)).toBe(true);
  });

  it("clamps highest passing tier to the declared maximum claim tier", () => {
    const sections = makeSections();
    sections.claim_tier = {
      ...sections.claim_tier,
      state: "pass",
      reasons: [],
      maximumClaimTier: "reduced-order",
      viabilityStatus: "ADMISSIBLE",
      promotionReason: null,
    };
    sections.lapse_provenance = {
      ...sections.lapse_provenance,
      state: "pass",
      reasons: [],
    };
    sections.strict_signal_readiness = {
      ...sections.strict_signal_readiness,
      state: "pass",
      reasons: [],
      tsMetricDerived: true,
      qiMetricDerived: true,
      qiApplicabilityStatus: "PASS",
      missingSignals: [],
    };
    sections.source_closure = {
      ...sections.source_closure,
      state: "pass",
      reasons: [],
      metricTensorRef: "artifact://metric-tensor",
      tileEffectiveTensorRef: "artifact://tile-effective",
      residualRms: 1e-6,
      residualMax: 1e-5,
      residualByRegion: { hull: 1e-6, wall: 1e-5, exteriorShell: 1e-6 },
      toleranceRef: "source_closure_tolerance/v1",
      assumptionsDrifted: false,
    };
    sections.observer_audit = {
      ...sections.observer_audit,
      state: "pass",
      reasons: [],
      metric: {
        ...sections.observer_audit.metric,
        state: "pass",
      },
      tile: {
        state: "pass",
        wecMinOverAllTimelike: 0,
        necMinOverAllNull: 0,
        decStatus: "PASS",
        secStatus: "PASS",
        observerWorstCaseLocation: "wall",
        typeIFraction: 1,
        missedViolationFraction: 0,
        maxRobustMinusEulerian: 0,
      },
    };
    sections.gr_stability_safety = {
      ...sections.gr_stability_safety,
      state: "pass",
      reasons: [],
    };
    sections.shift_vs_lapse_decomposition = {
      ...sections.shift_vs_lapse_decomposition,
      state: "pass",
      reasons: [],
      shiftDrivenContribution: 0.5,
      lapseDrivenContribution: 0.5,
      expansionLeakageBound: 0,
      thetaFlatnessStatus: "PASS",
      divBetaFlatnessStatus: "PASS",
      natarioBaselineComparisonRef: "artifact://natario-baseline",
    };
    sections.uncertainty_perturbation_reproducibility = {
      ...sections.uncertainty_perturbation_reproducibility,
      state: "pass",
      reasons: [],
      precisionAgreementStatus: "within_tolerance",
      meshConvergenceOrder: 2,
      boundaryConditionSensitivity: 0.01,
      smoothingKernelSensitivity: 0.01,
      coldStartReproductionStatus: "reproduced",
      independentReproductionStatus: "reproduced",
      artifactHashConsistencyStatus: "ok",
    };
    sections.certificate_policy_result = {
      ...sections.certificate_policy_result,
      state: "pass",
      reasons: [],
      viabilityStatus: "ADMISSIBLE",
      hardConstraintPass: true,
      firstHardFailureId: null,
      certificateStatus: "ADMISSIBLE",
      certificateHash: "cafefeed",
      certificateIntegrity: "ok",
      promotionReason: null,
    };

    const contract = buildNhm2FullLoopAuditContract({
      generatedAt: "2026-04-23T01:00:00.000Z",
      sections,
    });

    expect(contract).not.toBeNull();
    expect(contract?.claimTierReadiness.certified.state).toBe("pass");
    expect(contract?.maximumClaimTier).toBe("reduced-order");
    expect(contract?.highestPassingClaimTier).toBe("reduced-order");
    expect(isNhm2FullLoopAuditContract(contract)).toBe(true);
    expect(
      isNhm2FullLoopAuditContract({
        ...contract,
        highestPassingClaimTier: "certified",
      }),
    ).toBe(false);
  });

  it("accepts source-closure version lag as an explicit fail-closed blocker", () => {
    const sections = makeSections();
    sections.source_closure = {
      ...sections.source_closure,
      state: "review",
      reasons: ["source_closure_version_lag"],
      artifactRefs: [makeArtifactRef("source_closure", "runtime://pipeline/nhm2SourceClosure")],
    };

    const contract = buildNhm2FullLoopAuditContract({
      generatedAt: "2026-04-09T12:00:00.000Z",
      sections,
    });

    expect(contract).not.toBeNull();
    expect(contract?.sections.source_closure.reasons).toContain(
      "source_closure_version_lag",
    );
    expect(contract?.blockingReasons).toContain("source_closure_version_lag");
    expect(isNhm2FullLoopAuditContract(contract)).toBe(true);
  });

  it("rejects forged contracts with invalid tier maps or unknown reason codes", () => {
    const contract = buildNhm2FullLoopAuditContract({
      generatedAt: "2026-04-07T12:10:00.000Z",
      sections: makeSections(),
    });
    expect(contract).not.toBeNull();

    expect(
      isNhm2FullLoopAuditContract({
        ...contract,
        claimTierSectionMap: {
          ...contract?.claimTierSectionMap,
          certified: ["certificate_policy_result"],
        },
      }),
    ).toBe(false);

    expect(
      isNhm2FullLoopAuditContract({
        ...contract,
        sections: {
          ...contract?.sections,
          claim_tier: {
            ...contract?.sections.claim_tier,
            reasons: ["unknown_reason_code"],
          },
        },
      }),
    ).toBe(false);
  });
});
