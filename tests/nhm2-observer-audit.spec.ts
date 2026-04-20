import { describe, expect, it } from "vitest";

import {
  buildNhm2ObserverAuditArtifact,
  isNhm2ObserverAuditArtifact,
  NHM2_OBSERVER_AUDIT_ARTIFACT_ID,
  NHM2_OBSERVER_AUDIT_SCHEMA_VERSION,
} from "../shared/contracts/nhm2-observer-audit.v1";

const positiveCondition = (value: number) => ({
  eulerianMin: value + 0.1,
  eulerianMean: value + 0.1,
  robustMin: value,
  robustMean: value,
  eulerianViolationFraction: 0,
  robustViolationFraction: 0,
  missedViolationFraction: 0,
  severityGainMin: -0.1,
  severityGainMean: -0.1,
  maxRobustMinusEulerian: -0.1,
  worstCase: {
    index: 0,
    value,
    direction: [1, 0, 0] as [number, number, number],
    rapidity: null,
    source: "algebraic_type_i",
  },
});

describe("nhm2 observer audit artifact", () => {
  it("captures both tensor paths and labels surrogate limits explicitly", () => {
    const artifact = buildNhm2ObserverAuditArtifact({
      familyId: "nhm2_shift_lapse",
      shiftLapseProfileId: "stage1_centerline_alpha_0p995_v1",
      metricRequired: {
        tensorRef: "warp.metricStressEnergy",
        sampleCount: 1,
        rapidityCap: 2.5,
        rapidityCapBeta: Math.tanh(2.5),
        typeI: { count: 1, fraction: 1, tolerance: 0 },
        conditions: {
          nec: positiveCondition(0.25),
          wec: positiveCondition(0.2),
          sec: positiveCondition(0.15),
          dec: positiveCondition(0.1),
        },
        fluxDiagnostics: {
          status: "assumed_zero",
          meanMagnitude: 0,
          maxMagnitude: 0,
          netMagnitude: 0,
          netDirection: null,
          note: "metric T0i unavailable; diagonal audit assumes zero flux",
        },
        model: {
          pressureModel: "diagonal_tensor_components",
          fluxHandling: "assumed_zero_from_missing_t0i",
          shearHandling: "assumed_zero_from_missing_tij",
          limitationNotes: [
            "T0i terms unavailable",
            "off-diagonal Tij terms unavailable",
          ],
          note: "Diagonal-only observer audit",
        },
        missingInputs: ["metric_t0i_missing", "metric_tij_off_diagonal_missing"],
      },
      tileEffective: {
        tensorRef: "warp.tileEffectiveStressEnergy",
        sampleCount: 4096,
        rapidityCap: 2.5,
        rapidityCapBeta: Math.tanh(2.5),
        typeI: { count: 4096, fraction: 0.92, tolerance: 1e-9 },
        conditions: {
          nec: positiveCondition(0.12),
          wec: positiveCondition(0.08),
          sec: positiveCondition(0.06),
          dec: positiveCondition(0.03),
        },
        fluxDiagnostics: {
          status: "available",
          meanMagnitude: 0.4,
          maxMagnitude: 1.2,
          netMagnitude: 0.05,
          netDirection: [1, 0, 0],
          note: "voxel S_i channels",
        },
        model: {
          pressureModel: "isotropic_pressure_proxy",
          fluxHandling: "voxel_flux_field",
          shearHandling: "not_modeled_in_proxy",
          limitationNotes: [
            "isotropic pressure proxy only",
          ],
        },
      },
    });

    expect(artifact.artifactId).toBe(NHM2_OBSERVER_AUDIT_ARTIFACT_ID);
    expect(artifact.schemaVersion).toBe(NHM2_OBSERVER_AUDIT_SCHEMA_VERSION);
    expect(artifact.status).toBe("review");
    expect(artifact.completeness).toBe("incomplete");
    expect(artifact.shiftLapseProfileId).toBe("stage1_centerline_alpha_0p995_v1");
    expect(artifact.reasonCodes).toEqual(
      expect.arrayContaining([
        "metric_audit_incomplete",
        "surrogate_model_limited",
      ]),
    );
    expect(artifact.observerBlockingAssessmentStatus).toBe(
      "observer_contract_incomplete",
    );
    expect(artifact.observerPromotionBlockingSurface).toBe("unknown");
    expect(artifact.observerPromotionBlockingCondition).toBe("unknown");
    expect(artifact.observerMetricPrimaryDriver).toBe("unknown");
    expect(artifact.observerTilePrimaryDriver).toBe("unknown");
    expect(artifact.observerPrimaryDriverAgreement).toBe("unknown");
    expect(artifact.observerMetricFirstInspectionTarget).toBeNull();
    expect(artifact.observerTileFirstInspectionTarget).toBeNull();
    expect(artifact.observerSharedRootDriverStatus).toBe("unknown");
    expect(artifact.observerSharedRootDriverNote).toBeNull();
    expect(artifact.observerSharedUpstreamDriverStatus).toBe("unknown");
    expect(artifact.observerSharedUpstreamDriverNote).toBeNull();
    expect(artifact.observerWecPropagationStatus).toBe("unknown");
    expect(artifact.observerWecPropagationNote).toBeNull();
    expect(artifact.observerRemediationSequenceStatus).toBe("unknown");
    expect(artifact.observerTileDiminishingReturnStatus).toBe("unknown");
    expect(artifact.observerTileDiminishingReturnNote).toBeNull();
    expect(artifact.observerMetricCompletenessStatus).toBe(
      "incomplete_missing_inputs",
    );
    expect(artifact.observerMetricCompletenessNote).toContain(
      "metric_t0i_missing",
    );
    expect(artifact.observerMetricCoverageBlockerStatus).toBe(
      "producer_not_emitted",
    );
    expect(artifact.observerMetricCoverageBlockerNote).toContain(
      "diagonal-only",
    );
    expect(artifact.observerMetricFirstMissingStage).toBe(
      "metric_tensor_emission",
    );
    expect(artifact.observerMetricEmissionAdmissionStatus).toBe(
      "not_admitted",
    );
    expect(artifact.observerMetricEmissionAdmissionNote).toContain(
      "reduced-order diagonal tensor only",
    );
    expect(artifact.observerMetricT0iAdmissionStatus).toBe(
      "basis_or_semantics_ambiguous",
    );
    expect(artifact.observerMetricT0iAdmissionNote).toContain(
      "not carried as an emitted same-chart quantity",
    );
    expect(artifact.observerMetricOffDiagonalTijAdmissionStatus).toBe(
      "basis_or_semantics_ambiguous",
    );
    expect(artifact.observerMetricOffDiagonalTijAdmissionNote).toContain(
      "reduced-order placeholders",
    );
    expect(artifact.observerTileAuthorityStatus).toBe("proxy_limited");
    expect(artifact.observerTileAuthorityNote).toContain(
      "fluxHandling=voxel_flux_field",
    );
    expect(artifact.observerLeadReadinessWorkstream).toBe(
      "observer_completeness_and_authority",
    );
    expect(artifact.observerLeadReadinessReason).toContain(
      "same-surface negativity is real",
    );
    expect(artifact.observerNextTechnicalAction).toBe(
      "emit_same_chart_metric_flux_and_shear_terms",
    );
    expect(artifact.tileObserverConditionAuthorityMode).toBe(
      "legacy_proxy_published",
    );
    expect(artifact.tileObserverConditionAuthorityNote).toContain(
      "Legacy tile-proxy observer-condition lane remains authoritative",
    );
    expect(artifact.tileObserverLegacyProxyDiagnostics).toBeNull();
    expect(artifact.tensors.metricRequired.rootCauseClass).toBe("unknown");
    expect(artifact.tensors.tileEffective.rootCauseClass).toBe("unknown");
    expect(artifact.tensors.metricRequired.firstRemediationTarget).toBeNull();
    expect(artifact.tensors.tileEffective.firstRemediationTarget).toBeNull();
    expect(artifact.tensors.metricRequired.upstreamDriverRef).toBeNull();
    expect(artifact.tensors.tileEffective.upstreamDriverRef).toBeNull();
    expect(artifact.tensors.metricRequired.upstreamDriverClass).toBe("unknown");
    expect(artifact.tensors.tileEffective.upstreamDriverClass).toBe("unknown");
    expect(artifact.tensors.metricRequired.wecProbeApplied).toBe(false);
    expect(artifact.tensors.tileEffective.wecProbeApplied).toBe(false);
    expect(artifact.tensors.metricRequired.fluxDiagnostics.status).toBe(
      "assumed_zero",
    );
    expect(artifact.tensors.tileEffective.model.pressureModel).toBe(
      "isotropic_pressure_proxy",
    );
    expect(artifact.distinction.preserveNegativeAndMixedResults).toBe(true);
    expect(isNhm2ObserverAuditArtifact(artifact)).toBe(true);
  });

  it("accepts additive metric-producer admission evidence payloads", () => {
    const artifact = buildNhm2ObserverAuditArtifact({
      metricRequired: {
        tensorRef: "warp.metricStressEnergy",
        conditions: {
          nec: positiveCondition(0.1),
          wec: positiveCondition(0.05),
          sec: positiveCondition(0.04),
          dec: positiveCondition(0.03),
        },
        model: {
          pressureModel: "diagonal_tensor_components",
          fluxHandling: "assumed_zero_from_missing_t0i",
          shearHandling: "assumed_zero_from_missing_tij",
          limitationNotes: ["diagonal-only"],
        },
        missingInputs: ["metric_t0i_missing", "metric_tij_off_diagonal_missing"],
      },
      tileEffective: {
        tensorRef: "warp.tileEffectiveStressEnergy",
        conditions: {
          nec: positiveCondition(0.1),
          wec: positiveCondition(0.05),
          sec: positiveCondition(0.04),
          dec: positiveCondition(0.03),
        },
      },
      metricProducerAdmissionEvidence: {
        semanticsRef:
          "docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md",
        chartRef: "comoving_cartesian",
        producerModuleRef: [
          "modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorAtPointFromShiftField",
        ],
        currentEmissionShape: "diagonal_only",
        currentOutputFamilies: ["T00", "T11", "T22", "T33"],
        supportFieldEvidence: {
          alpha: "present_admitted",
          beta_i: "present_admitted",
          gamma_ij: "present_admitted",
          K_ij: "present_but_not_admitted",
          D_j_Kj_i_minus_D_i_K_route: "missing",
          time_derivative_or_Kij_evolution_route: "missing",
          full_einstein_tensor_route: "missing",
        },
        t0iAdmissionBranch: "requires_new_model_term",
        offDiagonalTijAdmissionBranch: "requires_new_model_term",
        nextInspectionTarget:
          "modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorAtPointFromShiftField",
        notes: ["producer is diagonal-only on current runtime path"],
      },
      modelTermSemanticAdmissionEvidence: {
        semanticsRef:
          "docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md",
        researchBasisRef:
          "docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md",
        chartRef: "comoving_cartesian",
        routeId: "adm_quasi_stationary_recovery_v1",
        routeAdmission: "experimental_not_admitted",
        decision: "do_not_admit",
        reasonCodes: [
          "support_field_route_not_admitted",
          "full_einstein_tensor_route_not_admitted",
        ],
        checks: {
          routeMetadata: "pass",
          chart: "pass",
          finiteTensorComponents: "pass",
          t0iSymmetry: "pass",
          offDiagonalTijSymmetry: "pass",
          finiteDifferenceConvergence: "unknown",
          independentCrossCheck: "unknown",
          dtGammaAssumptionBounded: "unknown",
          supportFieldRouteAdmission: "fail",
          fullEinsteinTensorRouteAdmission: "fail",
          citationBasis: "pass",
          citationCoverage: "unknown",
        },
        einsteinResidualAttributionEvidence: {
          status: "available",
          sampleCount: 9,
          maxRelativeResidual: 0.64,
          componentResiduals: {
            T01: 0.64,
            T02: 0.58,
            T03: 0.61,
            T12: 0.31,
            T13: 0.28,
            T23: 0.22,
          },
          conventionSweep: [
            {
              candidateId: "raw_geometry_fd4",
              status: "available",
              maxRelativeResidual: 0.64,
              note: "baseline",
            },
            {
              candidateId: "sign_flip",
              status: "available",
              maxRelativeResidual: 0.18,
              note: "checks sign convention",
            },
          ],
          bestCandidateId: "sign_flip",
          bestCandidateResidual: 0.18,
          diagnosisClass: "convention_mismatch",
          note: "Residuals improve under sign-flip convention sweep candidate.",
        },
        einsteinEvaluatorClosureEvidence: {
          status: "available",
          chartRef: "comoving_cartesian",
          routeId: "einstein_tensor_geometry_fd4_v1",
          unitConvention: "si_from_geometry_via_inv8pi_and_geom_to_si_stress",
          signConvention: "T_munu_equals_plus_G_munu_over_8pi",
          resolutionSweep: {
            coarse: {
              step_m: 0.1,
              comparedSampleCount: 9,
              t0iMaxRelativeResidual: 0.64,
              offDiagonalMaxRelativeResidual: 0.31,
            },
            refined: {
              step_m: 0.05,
              comparedSampleCount: 9,
              t0iMaxRelativeResidual: 0.42,
              offDiagonalMaxRelativeResidual: 0.19,
            },
            superRefined: {
              step_m: 0.025,
              comparedSampleCount: 9,
              t0iMaxRelativeResidual: 0.27,
              offDiagonalMaxRelativeResidual: 0.11,
            },
          },
          observedConvergenceOrder: {
            t0i: 1.2,
            offDiagonal: 1.1,
          },
          richardsonExtrapolatedResidual: {
            t0i: 0.21,
            offDiagonal: 0.08,
          },
          conventionSweep: [
            {
              candidateId: "raw_geometry_fd4",
              status: "available",
              maxRelativeResidual: 0.64,
              note: "baseline",
            },
            {
              candidateId: "sign_flip",
              status: "available",
              maxRelativeResidual: 0.18,
              note: "checks sign convention",
            },
          ],
          bestCandidateId: "sign_flip",
          diagnosisClass: "convention_mismatch",
          note: "h/h2/h4 closure confirms convention-mismatch-dominant residual behavior.",
          citationRefs: [
            "https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf",
            "https://arxiv.org/abs/gr-qc/0703035",
          ],
        },
        einsteinRouteValidationSuite: {
          status: "pass",
          admittedForRoutePass: true,
          residualThreshold: 1e-9,
          evaluatedCaseCount: 2,
          passedCaseCount: 2,
          cases: [
            {
              caseId: "minkowski_zero_shift",
              status: "pass",
              maxAbsResidual: 0,
              expectedNearZero: true,
              note: "Flat-space zero shift control passed.",
              citationRefs: [
                "https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf",
              ],
            },
            {
              caseId: "constant_shift_flat_space",
              status: "pass",
              maxAbsResidual: 0,
              expectedNearZero: true,
              note: "Constant-shift flat-space control passed.",
              citationRefs: [
                "https://arxiv.org/abs/gr-qc/0703035",
              ],
            },
          ],
          note: "Independent Einstein-route near-zero controls passed.",
          citationRefs: [
            "https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf",
            "https://arxiv.org/abs/gr-qc/0703035",
          ],
        },
        closurePathDecision: {
          selectedPath: "adm_complete",
          admPathStatus: "fail",
          fullEinsteinPathStatus: "fail",
          routeHint: "adm_route_metadata",
          nextPatchClass: "adm_support_field_admission_patch",
          patchBriefRef:
            "docs/audits/research/warp-nhm2-semantic-closure-route-decision-brief-latest.md",
          rationale:
            "Route metadata points to ADM with no stronger Einstein preference signal; continue with ADM-complete semantic closure.",
          blockerCodes: [
            "support_field_route_not_admitted",
            "full_einstein_tensor_route_not_admitted",
          ],
          citationRefs: [
            "https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf",
            "https://arxiv.org/abs/gr-qc/0703035",
          ],
          notes: ["selectedPath=adm_complete"],
        },
        citationRefs: [
          "docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md",
          "https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf",
        ],
        notes: ["decision localized to non-admitted route support fields"],
      },
      t00PolicyAdmissionBridgeEvidence: {
        status: "fail",
        routeId: "einstein_tensor_geometry_fd4_v1",
        chartRef: "comoving_cartesian",
        selectedPath: "adm_complete",
        routeAdmissionRaw: "experimental_not_admitted",
        routeAdmissionEffective: "experimental_not_admitted",
        routeAdmissionPromotionBasis: "evidence_gate_not_satisfied",
        checks: {
          fullEinsteinTensorRouteAdmission: "fail",
          einsteinT00Comparability: "unknown",
          independentCrossCheck: "unknown",
          finiteDifferenceConvergence: "unknown",
          citationCoverage: "unknown",
        },
        pass: false,
        rationale:
          "Bridge is not satisfied while Einstein-path route admission remains non-admitted.",
        citationRefs: [
          "https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf",
          "https://arxiv.org/abs/gr-qc/0703035",
        ],
        notes: ["selectedPath=adm_complete", "bridgeStatus=fail"],
      },
      tileAuthorityEvidence: {
        status: "fail",
        chartRef: "comoving_cartesian",
        routeId: "einstein_tensor_geometry_fd4_v1",
        selectedPath: "adm_complete",
        tileRoute: "proxy_tile_brick",
        checks: {
          routeAdmission: "fail",
          fullTensorComponents: "pass",
          comparability: "fail",
          citationCoverage: "unknown",
        },
        pass: false,
        rationale:
          "Tile lane remains proxy-limited while comparability on a full-tensor authority route is unresolved.",
        citationRefs: [
          "https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf",
          "https://arxiv.org/abs/gr-qc/0703035",
        ],
        notes: ["tileRoute=proxy_tile_brick", "authorityStatus=fail"],
      },
      tileComparableCrossCheckEvidence: {
        status: "fail",
        chartRef: "comoving_cartesian",
        routeId: "einstein_tensor_geometry_fd4_v1",
        selectedPath: "adm_complete",
        referenceRouteId: "einstein_tensor_geometry_fd2_independent_v1",
        aggregationMethod:
          "same_profile_global_minimum_compare(wec.eulerianMin, wec.robustMin)",
        metricTensorRef: "warp.metricStressEnergy",
        tileTensorRef: "warp.tileEffectiveStressEnergy",
        metricWecEulerianMin: 0,
        metricWecRobustMin: 0,
        tileWecEulerianMin: -0.3,
        tileWecRobustMin: -0.3,
        eulerianMinDelta: -0.3,
        robustMinDelta: -0.3,
        eulerianSignAgreement: false,
        robustSignAgreement: false,
        independentCrossCheckStatus: "fail",
        comparabilityStatus: "fail",
        localizationResult: "proxy_artifact_suspected",
        nextPatchClass: "tile_surface_reconstitution_patch",
        rationale:
          "Tile proxy lane diverges from Einstein metric lane and remains non-comparable.",
        citationRefs: [
          "https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf",
          "https://arxiv.org/abs/2404.03095",
        ],
        notes: [
          "comparabilityStatus=fail",
          "localizationResult=proxy_artifact_suspected",
        ],
      },
      tileSurfaceReconstitutionEvidence: {
        status: "fail",
        chartRef: "comoving_cartesian",
        routeId: "einstein_tensor_geometry_fd4_v1",
        selectedPath: "adm_complete",
        sourceTensorRef: "warp.metricStressEnergy",
        reconstitutedTileTensorRef: "warp.tileEffectiveStressEnergy",
        aggregationMethod:
          "same_profile_global_minimum_compare(wec.eulerianMin, wec.robustMin)+component_coverage_gate",
        sampleDomainRef: "nhm2_shift_lapse/global_region",
        componentCoverage: {
          t00: "present_but_not_admitted",
          t0i: "present_admitted",
          offDiagonalTij: "present_admitted",
        },
        independentCrossCheckRouteRef: "einstein_tensor_geometry_fd2_independent_v1",
        independentCrossCheckStatus: "fail",
        comparabilityStatus: "fail",
        localizationResult: "proxy_artifact_suspected",
        rationale:
          "Route comparability is still failing, so tile-surface reconstitution evidence is not admitted yet.",
        citationRefs: [
          "https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf",
          "https://arxiv.org/abs/2404.03095",
        ],
        notes: [
          "componentCoverage.t00=present_but_not_admitted",
          "reconstitutionStatus=fail",
        ],
      },
      tileObserverConditionComparabilityEvidence: {
        status: "fail",
        chartRef: "comoving_cartesian",
        routeId: "einstein_tensor_geometry_fd4_v1",
        selectedPath: "adm_complete",
        sampleDomainRef: "nhm2_shift_lapse/global_region",
        aggregationMethod:
          "same_chart_commensurate_replay(metric_required_vs_tile_effective_proxy_vs_tile_effective_reconstituted)",
        classification: "inconclusive",
        classificationReason:
          "Commensurate observer-condition classification remains unresolved.",
        checks: {
          routeComparability: "fail",
          independentCrossCheck: "fail",
          sampleCountParity: "unknown",
          rapidityCapParity: "unknown",
          rapidityCapBetaParity: "unknown",
          citationCoverage: "unknown",
        },
        lanes: {
          metricRequired: {
            tensorRef: "warp.metricStressEnergy",
            sampleCount: 1,
            rapidityCap: 2.5,
            rapidityCapBeta: Math.tanh(2.5),
            wecEulerianMin: 0,
            wecRobustMin: 0,
            decEulerianMin: 0,
            decRobustMin: 0,
          },
          tileEffectiveProxy: {
            tensorRef: "warp.tileEffectiveStressEnergy",
            sampleCount: 4096,
            rapidityCap: 2.5,
            rapidityCapBeta: Math.tanh(2.5),
            wecEulerianMin: -0.3,
            wecRobustMin: -0.3,
            decEulerianMin: -0.2,
            decRobustMin: -0.2,
          },
          tileEffectiveReconstituted: {
            tensorRef: "warp.tileEffectiveStressEnergy",
            sourceRef: "warp.metricStressEnergy",
            sampleCount: null,
            rapidityCap: null,
            rapidityCapBeta: null,
            wecEulerianMin: null,
            wecRobustMin: null,
            decEulerianMin: null,
            decRobustMin: null,
            note: "Route remains non-admitted in this fixture.",
          },
        },
        pass: false,
        rationale:
          "Comparability remains unresolved in this fixture while route checks fail.",
        citationRefs: [
          "https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf",
          "https://arxiv.org/abs/2404.03095",
        ],
        notes: ["classification=inconclusive", "status=fail"],
      },
    });

    expect(artifact.metricProducerAdmissionEvidence).toMatchObject({
      semanticsRef:
        "docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md",
      chartRef: "comoving_cartesian",
      currentEmissionShape: "diagonal_only",
      t0iAdmissionBranch: "requires_new_model_term",
      offDiagonalTijAdmissionBranch: "requires_new_model_term",
    });
    expect(
      artifact.metricProducerAdmissionEvidence?.supportFieldEvidence.K_ij,
    ).toBe("present_but_not_admitted");
    expect(artifact.modelTermSemanticAdmissionEvidence).toMatchObject({
      routeId: "adm_quasi_stationary_recovery_v1",
      routeAdmissionRaw: "experimental_not_admitted",
      routeAdmissionEffective: "experimental_not_admitted",
      routeAdmissionPromotionBasis: "evidence_gate_not_satisfied",
      routeAdmission: "experimental_not_admitted",
      decision: "do_not_admit",
      checks: {
        supportFieldRouteAdmission: "fail",
        fullEinsteinTensorRouteAdmission: "fail",
        finiteDifferenceConvergence: "unknown",
        independentCrossCheck: "unknown",
        dtGammaAssumptionBounded: "unknown",
        citationCoverage: "unknown",
      },
      einsteinResidualAttributionEvidence: {
        status: "available",
        sampleCount: 9,
        bestCandidateId: "sign_flip",
        diagnosisClass: "convention_mismatch",
      },
      einsteinEvaluatorClosureEvidence: {
        status: "available",
        chartRef: "comoving_cartesian",
        routeId: "einstein_tensor_geometry_fd4_v1",
        bestCandidateId: "sign_flip",
        diagnosisClass: "convention_mismatch",
      },
      einsteinRouteValidationSuite: {
        status: "pass",
        admittedForRoutePass: true,
        evaluatedCaseCount: 2,
        passedCaseCount: 2,
      },
      closurePathDecision: {
        selectedPath: "adm_complete",
        admPathStatus: "fail",
        fullEinsteinPathStatus: "fail",
        routeHint: "adm_route_metadata",
        nextPatchClass: "adm_support_field_admission_patch",
        patchBriefRef:
          "docs/audits/research/warp-nhm2-semantic-closure-route-decision-brief-latest.md",
      },
    });
    expect(artifact.t00PolicyAdmissionBridgeEvidence).toMatchObject({
      status: "fail",
      routeId: "einstein_tensor_geometry_fd4_v1",
      chartRef: "comoving_cartesian",
      selectedPath: "adm_complete",
      routeAdmissionRaw: "experimental_not_admitted",
      routeAdmissionEffective: "experimental_not_admitted",
      routeAdmissionPromotionBasis: "evidence_gate_not_satisfied",
      checks: {
        fullEinsteinTensorRouteAdmission: "fail",
        einsteinT00Comparability: "unknown",
        independentCrossCheck: "unknown",
        finiteDifferenceConvergence: "unknown",
        citationCoverage: "unknown",
      },
      pass: false,
    });
    expect(artifact.tileAuthorityEvidence).toMatchObject({
      status: "fail",
      chartRef: "comoving_cartesian",
      routeId: "einstein_tensor_geometry_fd4_v1",
      selectedPath: "adm_complete",
      tileRoute: "proxy_tile_brick",
      checks: {
        routeAdmission: "fail",
        fullTensorComponents: "pass",
        comparability: "fail",
        citationCoverage: "unknown",
      },
      pass: false,
    });
    expect(artifact.tileComparableCrossCheckEvidence).toMatchObject({
      status: "fail",
      chartRef: "comoving_cartesian",
      routeId: "einstein_tensor_geometry_fd4_v1",
      selectedPath: "adm_complete",
      referenceRouteId: "einstein_tensor_geometry_fd2_independent_v1",
      comparabilityStatus: "fail",
      localizationResult: "proxy_artifact_suspected",
      nextPatchClass: "tile_surface_reconstitution_patch",
    });
    expect(artifact.tileSurfaceReconstitutionEvidence).toMatchObject({
      status: "fail",
      chartRef: "comoving_cartesian",
      routeId: "einstein_tensor_geometry_fd4_v1",
      selectedPath: "adm_complete",
      sourceTensorRef: "warp.metricStressEnergy",
      reconstitutedTileTensorRef: "warp.tileEffectiveStressEnergy",
      sampleDomainRef: "nhm2_shift_lapse/global_region",
      componentCoverage: {
        t00: "present_but_not_admitted",
        t0i: "present_admitted",
        offDiagonalTij: "present_admitted",
      },
      independentCrossCheckStatus: "fail",
      comparabilityStatus: "fail",
      localizationResult: "proxy_artifact_suspected",
    });
    expect(artifact.tileObserverConditionComparabilityEvidence).toMatchObject({
      status: "fail",
      chartRef: "comoving_cartesian",
      routeId: "einstein_tensor_geometry_fd4_v1",
      selectedPath: "adm_complete",
      sampleDomainRef: "nhm2_shift_lapse/global_region",
      classification: "inconclusive",
      checks: {
        routeComparability: "fail",
        independentCrossCheck: "fail",
        sampleCountParity: "unknown",
        rapidityCapParity: "unknown",
        rapidityCapBetaParity: "unknown",
        citationCoverage: "unknown",
      },
      lanes: {
        metricRequired: {
          tensorRef: "warp.metricStressEnergy",
          sampleCount: 1,
          rapidityCap: 2.5,
        },
        tileEffectiveProxy: {
          tensorRef: "warp.tileEffectiveStressEnergy",
          sampleCount: 4096,
          rapidityCap: 2.5,
        },
        tileEffectiveReconstituted: {
          sourceRef: "warp.metricStressEnergy",
        },
      },
      pass: false,
    });
    expect(artifact.tileObserverConditionAuthorityMode).toBe(
      "legacy_proxy_published",
    );
    expect(artifact.tileObserverConditionAuthorityNote).toContain(
      "not pass-level",
    );
    expect(artifact.tileObserverLegacyProxyDiagnostics).toBeNull();
    expect(isNhm2ObserverAuditArtifact(artifact)).toBe(true);
    expect(isNhm2ObserverAuditArtifact(JSON.parse(JSON.stringify(artifact)))).toBe(
      true,
    );
  });

  it("preserves explicit negative observer results instead of normalizing them away", () => {
    const artifact = buildNhm2ObserverAuditArtifact({
      metricRequired: {
        tensorRef: "warp.metricStressEnergy",
        conditions: {
          nec: positiveCondition(0.2),
          wec: positiveCondition(0.1),
          sec: positiveCondition(0.05),
          dec: positiveCondition(0.02),
        },
        model: {
          pressureModel: "diagonal_tensor_components",
          fluxHandling: "assumed_zero_from_missing_t0i",
          shearHandling: "assumed_zero_from_missing_tij",
          limitationNotes: ["diagonal-only"],
        },
        missingInputs: ["metric_t0i_missing"],
      },
      tileEffective: {
        tensorRef: "warp.tileEffectiveStressEnergy",
        conditions: {
          nec: positiveCondition(0.1),
          wec: {
            ...positiveCondition(-0.2),
            eulerianMin: 0.05,
            eulerianMean: 0.05,
            robustMin: -0.2,
            robustMean: -0.2,
            robustViolationFraction: 1,
            missedViolationFraction: 1,
            severityGainMin: -0.25,
            severityGainMean: -0.25,
            maxRobustMinusEulerian: -0.25,
          },
          sec: positiveCondition(0.04),
          dec: positiveCondition(0.01),
        },
        fluxDiagnostics: {
          status: "available",
          meanMagnitude: 0.6,
          maxMagnitude: 1.4,
          netMagnitude: 0.08,
          netDirection: [0, 1, 0],
        },
        model: {
          pressureModel: "isotropic_pressure_proxy",
          fluxHandling: "voxel_flux_field",
          shearHandling: "not_modeled_in_proxy",
          limitationNotes: ["isotropic pressure proxy only"],
        },
      },
    });

    expect(artifact.status).toBe("fail");
    expect(artifact.reasonCodes).toContain("observer_condition_failed");
    expect(artifact.tensors.tileEffective.status).toBe("fail");
    expect(artifact.tensors.tileEffective.conditions.wec.status).toBe("fail");
    expect(artifact.tensors.tileEffective.conditions.wec.robustMin).toBe(-0.2);
    expect(artifact.observerBlockingAssessmentStatus).toBe(
      "observer_contract_incomplete",
    );
    expect(artifact.observerTilePrimaryDriver).toBe("wec");
    expect(artifact.tensors.tileEffective.primaryBlockingCondition).toBe("wec");
    expect(artifact.tensors.tileEffective.primaryBlockingMode).toBe(
      "robust_only",
    );
    expect(artifact.observerTileFirstInspectionTarget).toBe(
      "tile_effective.conditions.wec",
    );
    expect(artifact.tensors.tileEffective.rootCauseClass).toBe(
      "negative_energy_density",
    );
    expect(artifact.tensors.tileEffective.blockingDependencyStatus).toBe(
      "primary_only",
    );
    expect(artifact.tensors.tileEffective.firstRemediationTarget).toBe(
      "tile_effective.conditions.wec",
    );
    expect(artifact.observerSharedRootDriverStatus).toBe("unknown");
    expect(artifact.tensors.tileEffective.upstreamDriverClass).toBe(
      "tile_energy_density_proxy",
    );
    expect(artifact.tensors.tileEffective.upstreamDriverDependencyStatus).toBe(
      "proxy_derived_driver",
    );
    expect(artifact.observerSharedUpstreamDriverStatus).toBe("unknown");
    expect(artifact.tensors.tileEffective.wecProbeApplied).toBe(true);
    expect(artifact.tensors.tileEffective.wecProbeScale).toBe(0.5);
    expect(artifact.tensors.tileEffective.wecProbeBaseline).toBe(-0.2);
    expect(artifact.tensors.tileEffective.wecProbeResult).toBe(-0.2);
    expect(artifact.tensors.tileEffective.wecProbeDelta).toBe(0);
    expect(artifact.observerWecPropagationStatus).toBe("unknown");
  });

  it("derives commensurate observer-condition authority mode when proxy-artifact comparability gate passes", () => {
    const artifact = buildNhm2ObserverAuditArtifact({
      metricRequired: {
        tensorRef: "warp.metricStressEnergy",
        sampleCount: 1,
        rapidityCap: 2.5,
        rapidityCapBeta: Math.tanh(2.5),
        conditions: {
          nec: positiveCondition(0.1),
          wec: positiveCondition(0.05),
          sec: positiveCondition(0.04),
          dec: positiveCondition(-0.02),
        },
        model: {
          pressureModel: "same_chart_metric_tensor_projection",
          fluxHandling: "same_chart_metric_t0i_projection",
          shearHandling: "same_chart_metric_tij_projection",
          limitationNotes: [],
        },
      },
      tileEffective: {
        tensorRef: "warp.tileEffectiveStressEnergy",
        sampleCount: 1024,
        rapidityCap: 2.5,
        rapidityCapBeta: Math.tanh(2.5),
        conditions: {
          nec: positiveCondition(-0.2),
          wec: positiveCondition(-0.3),
          sec: positiveCondition(-0.1),
          dec: positiveCondition(-0.4),
        },
        model: {
          pressureModel: "isotropic_pressure_proxy",
          fluxHandling: "voxel_flux_field",
          shearHandling: "not_modeled_in_proxy",
          limitationNotes: ["proxy lane"],
        },
      },
      tileObserverConditionComparabilityEvidence: {
        status: "pass",
        chartRef: "comoving_cartesian",
        routeId: "einstein_tensor_geometry_fd4_v1",
        selectedPath: "full_einstein_tensor",
        sampleDomainRef: "nhm2_shift_lapse/global_region",
        aggregationMethod:
          "same_chart_commensurate_replay(metric_required_vs_tile_effective_proxy_vs_tile_effective_reconstituted)",
        classification: "proxy_artifact_confirmed",
        classificationReason:
          "Commensurate replay localizes to the proxy lane.",
        checks: {
          routeComparability: "pass",
          independentCrossCheck: "pass",
          sampleCountParity: "pass",
          rapidityCapParity: "pass",
          rapidityCapBetaParity: "pass",
          citationCoverage: "pass",
        },
        lanes: {
          metricRequired: {
            tensorRef: "warp.metricStressEnergy",
            sampleCount: 1,
            rapidityCap: 2.5,
            rapidityCapBeta: Math.tanh(2.5),
            wecEulerianMin: 0.15,
            wecRobustMin: 0.05,
            decEulerianMin: 0,
            decRobustMin: -0.02,
          },
          tileEffectiveProxy: {
            tensorRef: "warp.tileEffectiveStressEnergy",
            sampleCount: 1024,
            rapidityCap: 2.5,
            rapidityCapBeta: Math.tanh(2.5),
            wecEulerianMin: -0.2,
            wecRobustMin: -0.3,
            decEulerianMin: -0.2,
            decRobustMin: -0.4,
          },
          tileEffectiveReconstituted: {
            tensorRef: "warp.tileEffectiveStressEnergy",
            sourceRef: "warp.metricStressEnergy",
            sampleCount: 1,
            rapidityCap: 2.5,
            rapidityCapBeta: Math.tanh(2.5),
            wecEulerianMin: 0.15,
            wecRobustMin: 0.05,
            decEulerianMin: 0,
            decRobustMin: -0.02,
            note: "same-chart replay",
          },
        },
        pass: true,
        rationale: "Proxy lane artifact confirmed under commensurate checks.",
        citationRefs: ["https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf"],
        notes: ["classification=proxy_artifact_confirmed"],
      },
      tileObserverLegacyProxyDiagnostics: {
        tensorRef: "warp.tileEffectiveStressEnergy",
        sampleCount: 1024,
        rapidityCap: 2.5,
        rapidityCapBeta: Math.tanh(2.5),
        wecEulerianMin: -0.2,
        wecRobustMin: -0.3,
        decEulerianMin: -0.2,
        decRobustMin: -0.4,
        note: "legacy proxy snapshot",
      },
    });

    expect(artifact.tileObserverConditionAuthorityMode).toBe(
      "commensurate_reconstituted_authoritative",
    );
    expect(artifact.tileObserverConditionAuthorityNote).toContain(
      "reconstituted same-chart lane",
    );
    expect(artifact.tileObserverLegacyProxyDiagnostics).toMatchObject({
      tensorRef: "warp.tileEffectiveStressEnergy",
      sampleCount: 1024,
      wecRobustMin: -0.3,
      decRobustMin: -0.4,
    });
    expect(isNhm2ObserverAuditArtifact(artifact)).toBe(true);
  });

  it("preserves explicit stop-territory reassessment notes when publication supplies them", () => {
    const artifact = buildNhm2ObserverAuditArtifact({
      observerTileDiminishingReturnStatus: "likely_stop_territory",
      observerTileDiminishingReturnNote:
        "No admissible new aft-local single-contributor mechanism remained.",
      observerLeadReadinessWorkstream: "certificate_policy_readiness",
      observerLeadReadinessReason:
        "Certificate remains unavailable after the observer pause decision.",
      metricRequired: {
        tensorRef: "warp.metricStressEnergy",
        conditions: {
          nec: positiveCondition(0.2),
          wec: positiveCondition(0.1),
          sec: positiveCondition(0.05),
          dec: positiveCondition(0.02),
        },
      },
      tileEffective: {
        tensorRef: "warp.tileEffectiveStressEnergy",
        conditions: {
          nec: positiveCondition(0.1),
          wec: positiveCondition(-0.05),
          sec: positiveCondition(0.04),
          dec: positiveCondition(-0.1),
        },
      },
    });

    expect(artifact.observerTileDiminishingReturnStatus).toBe(
      "likely_stop_territory",
    );
    expect(artifact.observerTileDiminishingReturnNote).toContain(
      "No admissible new aft-local single-contributor mechanism remained.",
    );
    expect(artifact.observerLeadReadinessWorkstream).toBe(
      "certificate_policy_readiness",
    );
    expect(artifact.observerLeadReadinessReason).toContain(
      "Certificate remains unavailable",
    );
    expect(artifact.observerMetricCoverageBlockerStatus).toBe("unknown");
    expect(artifact.observerMetricFirstMissingStage).toBe("unknown");
    expect(artifact.observerNextTechnicalAction).toBe("unknown");
    expect(isNhm2ObserverAuditArtifact(artifact)).toBe(true);
  });

  it("classifies same-surface observer blockers when robust failing evidence is complete enough", () => {
    const artifact = buildNhm2ObserverAuditArtifact({
      metricRequired: {
        tensorRef: "warp.metricStressEnergy",
        typeI: { count: 1, fraction: 1, tolerance: 0 },
        conditions: {
          nec: positiveCondition(0.1),
          wec: {
            ...positiveCondition(-0.4),
            robustMin: -0.4,
            robustMean: -0.4,
            robustViolationFraction: 1,
            missedViolationFraction: 0,
            maxRobustMinusEulerian: 0,
          },
          sec: positiveCondition(0.05),
          dec: positiveCondition(0.02),
        },
      },
      tileEffective: {
        tensorRef: "warp.tileEffectiveStressEnergy",
        typeI: { count: 1, fraction: 1, tolerance: 0 },
        conditions: {
          nec: positiveCondition(0.08),
          wec: positiveCondition(0.04),
          sec: positiveCondition(0.03),
          dec: {
            ...positiveCondition(-0.1),
            robustMin: -0.1,
            robustMean: -0.1,
            robustViolationFraction: 1,
            missedViolationFraction: 0,
            maxRobustMinusEulerian: -0.05,
          },
        },
      },
    });

    expect(artifact.status).toBe("fail");
    expect(artifact.observerBlockingAssessmentStatus).toBe(
      "same_surface_violation_confirmed",
    );
    expect(artifact.observerPromotionBlockingSurface).toBe("both");
    expect(artifact.observerPromotionBlockingCondition).toBe("mixed");
    expect(artifact.observerMetricPrimaryDriver).toBe("wec");
    expect(artifact.observerTilePrimaryDriver).toBe("dec");
    expect(artifact.observerPrimaryDriverAgreement).toBe("diverged");
    expect(artifact.tensors.metricRequired.primaryBlockingMode).toBe(
      "robust_search_amplified",
    );
    expect(artifact.tensors.tileEffective.primaryBlockingMode).toBe(
      "robust_only",
    );
    expect(artifact.tensors.metricRequired.rootCauseClass).toBe(
      "negative_energy_density",
    );
    expect(artifact.tensors.metricRequired.blockingDependencyStatus).toBe(
      "primary_only",
    );
    expect(artifact.tensors.tileEffective.rootCauseClass).toBe(
      "mixed_independent",
    );
    expect(artifact.tensors.tileEffective.blockingDependencyStatus).toBe(
      "primary_only",
    );
    expect(artifact.tensors.tileEffective.firstRemediationTarget).toBe(
      "tile_effective.conditions.dec",
    );
    expect(artifact.observerSharedRootDriverStatus).toBe(
      "mixed",
    );
    expect(artifact.tensors.metricRequired.upstreamDriverClass).toBe(
      "metric_t00_density",
    );
    expect(artifact.tensors.tileEffective.upstreamDriverClass).toBe("unknown");
    expect(artifact.observerSharedUpstreamDriverStatus).toBe("unknown");
    expect(artifact.observerWecPropagationStatus).toBe("unknown");
    expect(artifact.observerPrimaryDriverNote).toContain(
      "metric_required first localizes to WEC",
    );
    expect(artifact.observerPrimaryDriverNote).toContain(
      "tile_effective first localizes to DEC",
    );
    expect(artifact.observerBlockingAssessmentNote).toContain(
      "missedViolationFraction=0",
    );
  });

  it("prefers Eulerian-native WEC over downstream DEC and secondary robust-only conditions", () => {
    const artifact = buildNhm2ObserverAuditArtifact({
      metricRequired: {
        tensorRef: "warp.metricStressEnergy",
        conditions: {
          nec: positiveCondition(0.1),
          wec: {
            ...positiveCondition(-0.5),
            eulerianMin: -0.5,
            eulerianMean: -0.5,
            robustMin: -0.5,
            robustMean: -0.5,
            robustViolationFraction: 1,
            missedViolationFraction: 0,
            maxRobustMinusEulerian: 0,
          },
          sec: positiveCondition(0.05),
          dec: {
            ...positiveCondition(-0.6),
            eulerianMin: -0.5,
            eulerianMean: -0.5,
            robustMin: -1.0,
            robustMean: -1.0,
            robustViolationFraction: 1,
            missedViolationFraction: 0,
            maxRobustMinusEulerian: -0.5,
          },
        },
      },
      tileEffective: {
        tensorRef: "warp.tileEffectiveStressEnergy",
        conditions: {
          nec: {
            ...positiveCondition(-0.2),
            eulerianMin: 0,
            eulerianMean: 0,
            robustMin: -0.2,
            robustMean: -0.2,
            robustViolationFraction: 1,
            missedViolationFraction: 1,
            maxRobustMinusEulerian: -0.2,
          },
          wec: {
            ...positiveCondition(-0.4),
            eulerianMin: -0.4,
            eulerianMean: -0.4,
            robustMin: -0.4,
            robustMean: -0.4,
            robustViolationFraction: 1,
            missedViolationFraction: 0,
            maxRobustMinusEulerian: 0,
          },
          sec: {
            ...positiveCondition(-0.1),
            eulerianMin: 0.05,
            eulerianMean: 0.05,
            robustMin: -0.1,
            robustMean: -0.1,
            robustViolationFraction: 1,
            missedViolationFraction: 1,
            maxRobustMinusEulerian: -0.15,
          },
          dec: {
            ...positiveCondition(-0.3),
            eulerianMin: -0.2,
            eulerianMean: -0.2,
            robustMin: -0.6,
            robustMean: -0.6,
            robustViolationFraction: 1,
            missedViolationFraction: 0,
            maxRobustMinusEulerian: -0.4,
          },
        },
      },
    });

    expect(artifact.observerMetricPrimaryDriver).toBe("wec");
    expect(artifact.observerTilePrimaryDriver).toBe("wec");
    expect(artifact.observerPrimaryDriverAgreement).toBe("aligned");
    expect(artifact.tensors.metricRequired.primaryBlockingMode).toBe(
      "eulerian_native",
    );
    expect(artifact.tensors.tileEffective.primaryBlockingMode).toBe(
      "eulerian_native",
    );
    expect(artifact.tensors.metricRequired.primaryBlockingWhy).toContain(
      "DEC co-fails downstream",
    );
    expect(artifact.tensors.tileEffective.primaryBlockingWhy).toContain(
      "NEC/SEC remain secondary search-driven failures",
    );
    expect(artifact.observerMetricFirstInspectionTarget).toBe(
      "metric_required.conditions.wec",
    );
    expect(artifact.observerTileFirstInspectionTarget).toBe(
      "tile_effective.conditions.wec",
    );
    expect(artifact.tensors.metricRequired.rootCauseClass).toBe(
      "negative_energy_density",
    );
    expect(artifact.tensors.metricRequired.blockingDependencyStatus).toBe(
      "dec_downstream_of_wec",
    );
    expect(artifact.tensors.tileEffective.rootCauseClass).toBe(
      "negative_energy_density",
    );
    expect(artifact.tensors.tileEffective.blockingDependencyStatus).toBe(
      "dec_downstream_of_wec",
    );
    expect(artifact.tensors.metricRequired.firstRemediationTarget).toBe(
      "metric_required.conditions.wec",
    );
    expect(artifact.tensors.tileEffective.firstRemediationTarget).toBe(
      "tile_effective.conditions.wec",
    );
    expect(artifact.observerSharedRootDriverStatus).toBe(
      "shared_root_driver_confirmed",
    );
    expect(artifact.observerSharedRootDriverNote).toContain(
      "negative-energy-density root driver",
    );
    expect(artifact.tensors.metricRequired.upstreamDriverClass).toBe(
      "metric_t00_density",
    );
    expect(artifact.tensors.tileEffective.upstreamDriverClass).toBe(
      "tile_energy_density_proxy",
    );
    expect(artifact.tensors.metricRequired.upstreamDriverDependencyStatus).toBe(
      "direct_same_surface_driver",
    );
    expect(artifact.tensors.tileEffective.upstreamDriverDependencyStatus).toBe(
      "proxy_derived_driver",
    );
    expect(artifact.observerSharedUpstreamDriverStatus).toBe(
      "surface_specific_upstream_refs",
    );
    expect(artifact.observerSharedUpstreamDriverNote).toContain(
      "not the same emitted upstream driver",
    );
    expect(artifact.observerWecPropagationStatus).toBe(
      "tile_proxy_independent",
    );
    expect(artifact.observerRemediationSequenceStatus).toBe(
      "metric_then_tile_proxy",
    );
    expect(artifact.tensors.metricRequired.wecProbeApplied).toBe(true);
    expect(artifact.tensors.metricRequired.wecProbeScale).toBe(0.5);
    expect(artifact.tensors.metricRequired.wecProbeBaseline).toBe(-0.5);
    expect(artifact.tensors.metricRequired.wecProbeResult).toBe(-0.25);
    expect(artifact.tensors.metricRequired.wecProbeDelta).toBe(0.25);
    expect(artifact.tensors.metricRequired.decProbeBaseline).toBe(-1);
    expect(artifact.tensors.metricRequired.decProbeResult).toBe(-0.5);
    expect(artifact.tensors.metricRequired.decProbeDelta).toBe(0.5);
    expect(artifact.tensors.tileEffective.wecProbeApplied).toBe(true);
    expect(artifact.tensors.tileEffective.wecProbeBaseline).toBe(-0.4);
    expect(artifact.tensors.tileEffective.wecProbeResult).toBe(-0.4);
    expect(artifact.tensors.tileEffective.wecProbeDelta).toBe(0);
    expect(artifact.tensors.tileEffective.decProbeBaseline).toBe(-0.6);
    expect(artifact.tensors.tileEffective.decProbeResult).toBe(-0.6);
    expect(artifact.tensors.tileEffective.decProbeDelta).toBe(0);
    expect(artifact.observerWecPropagationNote).toContain(
      "leaves the tile_effective proxy effectively unchanged",
    );
  });

  it("classifies robust-search-amplified primaries when Eulerian negativity is deepened", () => {
    const artifact = buildNhm2ObserverAuditArtifact({
      metricRequired: {
        tensorRef: "warp.metricStressEnergy",
        conditions: {
          nec: positiveCondition(0.1),
          wec: positiveCondition(0.05),
          sec: positiveCondition(0.02),
          dec: {
            ...positiveCondition(-0.2),
            eulerianMin: -0.1,
            eulerianMean: -0.1,
            robustMin: -0.4,
            robustMean: -0.4,
            robustViolationFraction: 1,
            missedViolationFraction: 0,
            maxRobustMinusEulerian: -0.3,
          },
        },
      },
      tileEffective: null,
    });

    expect(artifact.tensors.metricRequired.primaryBlockingCondition).toBe("dec");
    expect(artifact.tensors.metricRequired.primaryBlockingMode).toBe(
      "robust_search_amplified",
    );
    expect(artifact.observerMetricFirstInspectionTarget).toBe(
      "metric_required.conditions.dec",
    );
    expect(artifact.tensors.metricRequired.rootCauseClass).toBe(
      "mixed_independent",
    );
    expect(artifact.tensors.metricRequired.blockingDependencyStatus).toBe(
      "primary_only",
    );
    expect(artifact.tensors.metricRequired.firstRemediationTarget).toBe(
      "metric_required.conditions.dec",
    );
    expect(artifact.tensors.metricRequired.upstreamDriverClass).toBe("unknown");
    expect(artifact.observerSharedUpstreamDriverStatus).toBe("unknown");
    expect(artifact.observerWecPropagationStatus).toBe("unknown");
  });

  it("classifies shared upstream driver families and exact refs when explicit trace metadata is present", () => {
    const exactShared = buildNhm2ObserverAuditArtifact({
      metricRequired: {
        tensorRef: "warp.metricStressEnergy",
        upstreamDriverRef: "shared.emitted.t00",
        upstreamDriverClass: "metric_t00_density",
        upstreamDriverDependencyStatus: "direct_same_surface_driver",
        conditions: {
          nec: positiveCondition(0.1),
          wec: {
            ...positiveCondition(-0.3),
            eulerianMin: -0.3,
            eulerianMean: -0.3,
            robustMin: -0.3,
            robustMean: -0.3,
            robustViolationFraction: 1,
            missedViolationFraction: 0,
            maxRobustMinusEulerian: 0,
          },
          sec: positiveCondition(0.05),
          dec: positiveCondition(0.02),
        },
      },
      tileEffective: {
        tensorRef: "warp.tileEffectiveStressEnergy",
        upstreamDriverRef: "shared.emitted.t00",
        upstreamDriverClass: "tile_t00_density",
        upstreamDriverDependencyStatus: "direct_same_surface_driver",
        conditions: {
          nec: positiveCondition(0.08),
          wec: {
            ...positiveCondition(-0.2),
            eulerianMin: -0.2,
            eulerianMean: -0.2,
            robustMin: -0.2,
            robustMean: -0.2,
            robustViolationFraction: 1,
            missedViolationFraction: 0,
            maxRobustMinusEulerian: 0,
          },
          sec: positiveCondition(0.03),
          dec: positiveCondition(0.01),
        },
      },
    });

    expect(exactShared.observerSharedUpstreamDriverStatus).toBe(
      "shared_exact_ref",
    );
    expect(exactShared.observerSharedUpstreamDriverNote).toContain(
      "shared.emitted.t00",
    );
    expect(exactShared.observerWecPropagationStatus).toBe(
      "shared_propagation_detected",
    );
    expect(exactShared.observerRemediationSequenceStatus).toBe(
      "shared_metric_first",
    );
    expect(exactShared.tensors.metricRequired.wecProbeResult).toBeCloseTo(-0.15);
    expect(exactShared.tensors.tileEffective.wecProbeResult).toBeCloseTo(-0.1);

    const sharedClass = buildNhm2ObserverAuditArtifact({
      metricRequired: {
        tensorRef: "warp.metricStressEnergy",
        upstreamDriverRef: "warp.metric.T00.nhm2.shift_lapse",
        upstreamDriverClass: "metric_t00_density",
        upstreamDriverDependencyStatus: "direct_same_surface_driver",
        conditions: {
          nec: positiveCondition(0.1),
          wec: {
            ...positiveCondition(-0.3),
            eulerianMin: -0.3,
            eulerianMean: -0.3,
            robustMin: -0.3,
            robustMean: -0.3,
            robustViolationFraction: 1,
            missedViolationFraction: 0,
            maxRobustMinusEulerian: 0,
          },
          sec: positiveCondition(0.05),
          dec: positiveCondition(0.02),
        },
      },
      tileEffective: {
        tensorRef: "warp.tileEffectiveStressEnergy",
        upstreamDriverRef: "warp.tileEffectiveStressEnergy.T00",
        upstreamDriverClass: "tile_t00_density",
        upstreamDriverDependencyStatus: "direct_same_surface_driver",
        conditions: {
          nec: positiveCondition(0.08),
          wec: {
            ...positiveCondition(-0.2),
            eulerianMin: -0.2,
            eulerianMean: -0.2,
            robustMin: -0.2,
            robustMean: -0.2,
            robustViolationFraction: 1,
            missedViolationFraction: 0,
            maxRobustMinusEulerian: 0,
          },
          sec: positiveCondition(0.03),
          dec: positiveCondition(0.01),
        },
      },
    });

    expect(sharedClass.observerSharedUpstreamDriverStatus).toBe(
      "shared_driver_class",
    );
    expect(sharedClass.observerSharedUpstreamDriverNote).toContain(
      "same emitted t00_density driver family",
    );
    expect(sharedClass.observerWecPropagationStatus).toBe(
      "metric_only_propagation",
    );
    expect(sharedClass.observerRemediationSequenceStatus).toBe(
      "metric_then_tile_proxy",
    );
  });

  it("classifies weak cross-surface propagation when the tile probe moves only partially", () => {
    const artifact = buildNhm2ObserverAuditArtifact({
      metricRequired: {
        tensorRef: "warp.metricStressEnergy",
        conditions: {
          nec: positiveCondition(0.1),
          wec: {
            ...positiveCondition(-0.4),
            eulerianMin: -0.4,
            eulerianMean: -0.4,
            robustMin: -0.4,
            robustMean: -0.4,
            robustViolationFraction: 1,
            missedViolationFraction: 0,
            maxRobustMinusEulerian: 0,
          },
          sec: positiveCondition(0.03),
          dec: {
            ...positiveCondition(-0.4),
            eulerianMin: -0.4,
            eulerianMean: -0.4,
            robustMin: -0.8,
            robustMean: -0.8,
            robustViolationFraction: 1,
            missedViolationFraction: 0,
            maxRobustMinusEulerian: -0.4,
          },
        },
      },
      tileEffective: {
        tensorRef: "warp.tileEffectiveStressEnergy",
        upstreamDriverRef: "tile.proxy.surface",
        upstreamDriverClass: "tile_energy_density_proxy",
        upstreamDriverDependencyStatus: "proxy_derived_driver",
        wecProbeResponseFactor: 0.2,
        conditions: {
          nec: positiveCondition(0.05),
          wec: {
            ...positiveCondition(-0.2),
            eulerianMin: -0.2,
            eulerianMean: -0.2,
            robustMin: -0.2,
            robustMean: -0.2,
            robustViolationFraction: 1,
            missedViolationFraction: 0,
            maxRobustMinusEulerian: 0,
          },
          sec: positiveCondition(0.03),
          dec: {
            ...positiveCondition(-0.2),
            eulerianMin: -0.2,
            eulerianMean: -0.2,
            robustMin: -0.4,
            robustMean: -0.4,
            robustViolationFraction: 1,
            missedViolationFraction: 0,
            maxRobustMinusEulerian: -0.2,
          },
        },
      },
    });

    expect(artifact.observerWecPropagationStatus).toBe(
      "weak_cross_surface_propagation",
    );
    expect(artifact.observerRemediationSequenceStatus).toBe(
      "metric_then_tile_proxy",
    );
    expect(artifact.tensors.tileEffective.wecProbeScale).toBe(0.5);
    expect(artifact.tensors.tileEffective.wecProbeResult).toBeCloseTo(-0.18);
    expect(artifact.tensors.tileEffective.wecProbeDelta).toBeCloseTo(0.02);
  });

  it("accepts additive DEC physics-control evidence payloads", () => {
    const artifact = buildNhm2ObserverAuditArtifact({
      metricRequired: {
        tensorRef: "warp.metricStressEnergy",
        conditions: {
          nec: positiveCondition(0.1),
          wec: positiveCondition(0.05),
          sec: positiveCondition(0.04),
          dec: {
            ...positiveCondition(-0.2),
            eulerianMin: 0,
            eulerianMean: 0,
            robustMin: -0.2,
            robustMean: -0.2,
            robustViolationFraction: 1,
            missedViolationFraction: 1,
            maxRobustMinusEulerian: -0.2,
          },
        },
      },
      tileEffective: {
        tensorRef: "warp.tileEffectiveStressEnergy",
        conditions: {
          nec: positiveCondition(0.1),
          wec: positiveCondition(0.05),
          sec: positiveCondition(0.04),
          dec: {
            ...positiveCondition(-0.2),
            eulerianMin: 0,
            eulerianMean: 0,
            robustMin: -0.2,
            robustMean: -0.2,
            robustViolationFraction: 1,
            missedViolationFraction: 1,
            maxRobustMinusEulerian: -0.2,
          },
        },
      },
      observerDecPhysicsControlEvidence: {
        chartRef: "comoving_cartesian",
        routeId: "einstein_tensor_geometry_fd4_v1",
        selectedPath: "full_einstein_tensor",
        baseline: {
          metricDecEulerianMin: 0,
          metricDecRobustMin: -0.2,
          metricWecEulerianMin: 0,
          metricWecRobustMin: 0,
          metricNecEulerianMin: 0.1,
          metricNecRobustMin: 0.1,
          tileReconstitutedDecEulerianMin: 0,
          tileReconstitutedDecRobustMin: -0.2,
          tileReconstitutedWecEulerianMin: 0,
          tileReconstitutedWecRobustMin: 0,
          tileReconstitutedNecEulerianMin: 0.1,
          tileReconstitutedNecRobustMin: 0.1,
        },
        candidate: {
          candidateId:
            "same_chart_physics_control_coupled_density_pressure_probe_v1",
          applied: false,
          metricDecEulerianMin: 0,
          metricDecRobustMin: -0.16,
          metricWecEulerianMin: 0,
          metricWecRobustMin: 0.02,
          metricNecEulerianMin: 0.1,
          metricNecRobustMin: 0.11,
          tileReconstitutedDecEulerianMin: 0,
          tileReconstitutedDecRobustMin: -0.16,
          tileReconstitutedWecEulerianMin: 0,
          tileReconstitutedWecRobustMin: 0.02,
          tileReconstitutedNecEulerianMin: 0.1,
          tileReconstitutedNecRobustMin: 0.11,
        },
        deltas: {
          metricDecRobustLift: 0.04,
          tileReconstitutedDecRobustLift: 0.04,
          metricWecRobustDelta: 0.02,
          metricNecRobustDelta: 0.01,
        },
        guardChecks: {
          metricWecNonRegression: true,
          metricNecNonRegression: true,
          emissionAdmissionStable: true,
          semanticAdmissionStable: true,
        },
        sweepCandidates: [
          {
            candidateId: "baseline_hold_no_applied_control_patch_v1",
            candidateClass: "baseline_hold",
            sweepPhase: "baseline",
            refineSeedCandidateId: null,
            applied: false,
            rapidityCap: 2.5,
            rapidityCapBeta: 0.9866,
            metricDecRobustMin: -0.2,
            tileReconstitutedDecRobustMin: -0.2,
            metricWecRobustMin: 0,
            metricNecRobustMin: 0.1,
            metricDecRobustLift: 0,
            tileReconstitutedDecRobustLift: 0,
            metricWecRobustDelta: 0,
            metricNecRobustDelta: 0,
            metricDecRobustMarginToZero: -0.2,
            tileReconstitutedDecRobustMarginToZero: -0.2,
            crossesZeroBothDecMargins: false,
            metricWecNonRegressionMargin: 0,
            metricNecNonRegressionMargin: 0,
            guardChecks: {
              metricWecNonRegression: true,
              metricNecNonRegression: true,
              emissionAdmissionStable: true,
              semanticAdmissionStable: true,
            },
            passesSelectionGate: false,
            gateFailureReasons: ["no_candidate_improves_dec"],
            note: "baseline hold lane",
          },
          {
            candidateId: "observer_domain_truncation_zeta0_probe_v1",
            candidateClass: "observer_domain_truncation",
            sweepPhase: "baseline",
            refineSeedCandidateId: null,
            applied: false,
            rapidityCap: 0,
            rapidityCapBeta: 0,
            metricDecRobustMin: 0,
            tileReconstitutedDecRobustMin: 0,
            metricWecRobustMin: 0,
            metricNecRobustMin: 0.1,
            metricDecRobustLift: 0.2,
            tileReconstitutedDecRobustLift: 0.2,
            metricWecRobustDelta: 0,
            metricNecRobustDelta: 0,
            metricDecRobustMarginToZero: 0,
            tileReconstitutedDecRobustMarginToZero: 0,
            crossesZeroBothDecMargins: true,
            metricWecNonRegressionMargin: 0,
            metricNecNonRegressionMargin: 0,
            guardChecks: {
              metricWecNonRegression: true,
              metricNecNonRegression: true,
              emissionAdmissionStable: true,
              semanticAdmissionStable: true,
            },
            passesSelectionGate: false,
            gateFailureReasons: ["candidate_is_observer_domain_truncation"],
            note: "non-physical truncation probe",
          },
          {
            candidateId: "same_chart_physics_control_no_domain_shift_probe_v1",
            candidateClass: "physics_control_proposal",
            sweepPhase: "coarse",
            refineSeedCandidateId: null,
            applied: false,
            rapidityCap: 2.5,
            rapidityCapBeta: 0.9866,
            metricDecRobustMin: -0.18,
            tileReconstitutedDecRobustMin: -0.18,
            metricWecRobustMin: 0,
            metricNecRobustMin: 0.09,
            metricDecRobustLift: 0.02,
            tileReconstitutedDecRobustLift: 0.02,
            metricWecRobustDelta: 0,
            metricNecRobustDelta: -0.01,
            metricDecRobustMarginToZero: -0.18,
            tileReconstitutedDecRobustMarginToZero: -0.18,
            crossesZeroBothDecMargins: false,
            metricWecNonRegressionMargin: 0,
            metricNecNonRegressionMargin: -0.01,
            guardChecks: {
              metricWecNonRegression: true,
              metricNecNonRegression: false,
              emissionAdmissionStable: true,
              semanticAdmissionStable: true,
            },
            passesSelectionGate: false,
            gateFailureReasons: ["candidate_violates_nec_non_regression"],
            note: "non-truncation same-chart physics-control probe",
          },
          {
            candidateId:
              "same_chart_physics_control_coupled_density_pressure_probe_v1",
            candidateClass: "physics_control_proposal",
            sweepPhase: "coarse",
            refineSeedCandidateId: null,
            applied: false,
            rapidityCap: 2.5,
            rapidityCapBeta: 0.9866,
            metricDecRobustMin: -0.16,
            tileReconstitutedDecRobustMin: -0.16,
            metricWecRobustMin: 0.02,
            metricNecRobustMin: 0.11,
            metricDecRobustLift: 0.04,
            tileReconstitutedDecRobustLift: 0.04,
            metricWecRobustDelta: 0.02,
            metricNecRobustDelta: 0.01,
            metricDecRobustMarginToZero: -0.16,
            tileReconstitutedDecRobustMarginToZero: -0.16,
            crossesZeroBothDecMargins: false,
            metricWecNonRegressionMargin: 0.02,
            metricNecNonRegressionMargin: 0.01,
            guardChecks: {
              metricWecNonRegression: true,
              metricNecNonRegression: true,
              emissionAdmissionStable: true,
              semanticAdmissionStable: true,
            },
            passesSelectionGate: true,
            gateFailureReasons: [],
            note: "coupled non-truncation same-chart physics-control probe",
          },
        ],
        sweepPhaseSummary: {
          coarseCandidateCount: 2,
          coarsePassingCount: 1,
          refineCandidateCount: 0,
          refinePassingCount: 0,
          refineSeedCandidateIds: [],
          note: "refine sweep not used for this fixture",
        },
        topCandidateLeaderboard: [
          {
            rank: 1,
            candidateId:
              "same_chart_physics_control_coupled_density_pressure_probe_v1",
            candidateClass: "physics_control_proposal",
            sweepPhase: "coarse",
            passesSelectionGate: true,
            crossesZeroBothDecMargins: false,
            selectionObjectivePrimaryMargin: -0.16,
            metricDecRobustLift: 0.04,
            tileReconstitutedDecRobustLift: 0.04,
            controlDeviationMagnitude: 0.2,
          },
          {
            rank: 2,
            candidateId: "same_chart_physics_control_no_domain_shift_probe_v1",
            candidateClass: "physics_control_proposal",
            sweepPhase: "coarse",
            passesSelectionGate: false,
            crossesZeroBothDecMargins: false,
            selectionObjectivePrimaryMargin: -0.18,
            metricDecRobustLift: 0.02,
            tileReconstitutedDecRobustLift: 0.02,
            controlDeviationMagnitude: 0.1,
          },
        ],
        selectedCandidateId:
          "same_chart_physics_control_coupled_density_pressure_probe_v1",
        selectionDecision: "apply_candidate",
        selectionPlateauStatus: "best_margin_still_negative",
        crossZeroFeasibilityEvidence: {
          baselinePrimaryMargin: -0.2,
          bestCandidatePrimaryMargin: -0.16,
          requiredLiftToZero: 0.2,
          achievedLiftFromBaseline: 0.04,
          bestAchievedLift: 0.04,
          residualMarginToZero: -0.16,
          gapToZero: 0.16,
          crossZeroAchieved: false,
          boundedControlEnvelope: {
            pressureScaleMin: 0.9,
            pressureScaleMax: 1,
            densityLiftMin: 0,
            densityLiftMax: 0.1,
          },
          evaluationRoute: {
            chartRef: "comoving_cartesian",
            routeId: "einstein_tensor_geometry_fd4_v1",
            selectedPath: "full_einstein_tensor",
            independentCrossCheckStatus: "pass",
            runtimeComparabilityPass: true,
          },
          method: "bounded_sweep_margin_analysis",
          inferenceLabel: "mixed",
          citationRefs: [
            "https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf",
            "https://arxiv.org/abs/1702.05915",
            "https://arxiv.org/abs/2003.01815",
            "https://arxiv.org/abs/1405.0403",
          ],
          notes: [
            "Cross-zero feasibility is evaluated on the same bounded DEC-control sweep objective used for candidate ranking on the admitted Einstein route.",
          ],
        },
        zeroCrossFeasibilityDecision: "zero_cross_not_achievable_within_bounds",
        zeroCrossFeasibilityReasonCodes: [
          "best_margin_still_negative",
          "candidate_not_evaluated",
        ],
        boundedSearchEnvelope: {
          pressureScaleMin: 0.85,
          pressureScaleMax: 1,
          densityLiftMin: 0,
          densityLiftMax: 0.15,
          coarsePressureStep: 0.025,
          coarseDensityLiftStep: 0.025,
          refinePressureStep: 0.0125,
          refineDensityLiftStep: 0.0125,
          coarseCandidateCount: 2,
          refineCandidateCount: 0,
          refineSeedCount: 0,
          observerDomainFixed: true,
        },
        selectionReasonCodes: ["selection_gate_pass"],
        nonRegressionGate: {
          required: [
            "metricWecNonRegression",
            "metricNecNonRegression",
            "emissionAdmissionStable",
            "semanticAdmissionStable",
            "candidateNotObserverDomainTruncation",
            "metricDecRobustLiftPositive",
            "tileReconstitutedDecRobustLiftNonNegative",
          ],
          pass: true,
          note: "admissible candidate selected",
        },
        runtimeApplication: {
          attempted: true,
          enabled: false,
          status: "rolled_back",
          failureMode: "runtime_apply_disabled",
          evaluationComparable: true,
          sampleCount: 9,
          comparableSampleCount: 9,
          minimumComparableSampleCount: 3,
          sampleCountSufficient: true,
          referenceRouteId: "einstein_tensor_geometry_fd2_independent_v1",
          selectedRouteId: "einstein_tensor_geometry_fd4_v1",
          selectedPath: "full_einstein_tensor",
          candidateId:
            "same_chart_physics_control_coupled_density_pressure_probe_v1",
          comparabilityGate: {
            chartRef: "comoving_cartesian",
            chartParity: true,
            selectedPathParity: true,
            independentCrossCheckStatus: "pass",
            pass: true,
            note: "comparable gate pass",
          },
          rollbackReasonCodes: ["candidate_not_evaluated"],
          guardChecks: {
            metricWecNonRegression: true,
            metricNecNonRegression: true,
            emissionAdmissionStable: true,
            semanticAdmissionStable: true,
            metricDecRobustLiftPositive: true,
            tileReconstitutedDecRobustLiftNonNegative: true,
          },
          observed: {
            metricDecRobustLift: 0.04,
            tileReconstitutedDecRobustLift: 0.04,
            metricWecRobustDelta: 0.02,
            metricNecRobustDelta: 0.01,
            metricDecRobustMarginToZero: -0.16,
            tileReconstitutedDecRobustMarginToZero: -0.16,
            metricWecNonRegressionMargin: 0.02,
            metricNecNonRegressionMargin: 0.01,
          },
          note: "runtime opt-in disabled in this test fixture",
          citationRefs: [
            "https://arxiv.org/abs/1702.05915",
            "https://arxiv.org/abs/2003.01815",
            "https://arxiv.org/abs/1208.5399",
          ],
        },
        controlKnobs: [
          {
            knobId: "observer_rapidity_cap",
            baselineValue: 2.5,
            candidateValue: 2.5,
            deltaValue: 0,
            boundedDeltaMax: 0.25,
            bounded: true,
            note: "baseline hold",
          },
          {
            knobId: "same_chart_tensor_physics_control",
            baselineValue: 1,
            candidateValue: 0.9,
            deltaValue: -0.1,
            boundedDeltaMax: 0.1,
            bounded: true,
            note: "bounded same-chart pressure-scale probe",
          },
          {
            knobId: "same_chart_tensor_density_lift",
            baselineValue: 0,
            candidateValue: 0.1,
            deltaValue: 0.1,
            boundedDeltaMax: 0.1,
            bounded: true,
            note: "bounded same-chart density-lift probe",
          },
        ],
        claimCitationMap: [
          {
            claimId: "same_chart_projection_grammar_required",
            claim:
              "Observer-condition controls are evaluated on a same-chart stress-energy grammar where E, J_i, and S_ij are projections of a single tensor field.",
            citationRefs: [
              "https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf",
              "https://arxiv.org/abs/gr-qc/0703035",
            ],
            note: "same-chart grammar basis",
          },
          {
            claimId: "geometry_first_route_is_control_basis",
            claim:
              "DEC-control probes are evaluated on the admitted geometry-first Einstein route and retained only when comparability and independent cross-check gates stay pass-level.",
            citationRefs: [
              "https://arxiv.org/abs/gr-qc/0110086",
              "https://arxiv.org/abs/2404.03095",
            ],
            note: "geometry-first route basis",
          },
        ],
        claimCitationMapCompleteness: {
          status: "pass",
          expectedClaimCount: 2,
          coveredClaimCount: 2,
          expectedClaimIds: [
            "same_chart_projection_grammar_required",
            "geometry_first_route_is_control_basis",
          ],
          missingClaimIds: [],
          note: "all claims covered",
        },
        recommendation: "physics_control_patch",
        uncertaintyTags: ["direct_measurement", "inference", "open_assumption"],
        citationRefs: [
          "https://arxiv.org/abs/1405.0403",
          "https://arxiv.org/abs/2105.03079",
        ],
        derivationNotes: ["candidateApplied=false"],
        uncertaintyNotes: [
          "A coupled non-truncation same-chart physics-control probe was evaluated with fixed observer-domain bounds.",
        ],
      },
    });

    expect(artifact.observerDecPhysicsControlEvidence).toMatchObject({
      chartRef: "comoving_cartesian",
      routeId: "einstein_tensor_geometry_fd4_v1",
      selectedPath: "full_einstein_tensor",
      candidate: {
        candidateId:
          "same_chart_physics_control_coupled_density_pressure_probe_v1",
        applied: false,
      },
      selectedCandidateId:
        "same_chart_physics_control_coupled_density_pressure_probe_v1",
      selectionDecision: "apply_candidate",
      selectionPlateauStatus: "best_margin_still_negative",
      crossZeroFeasibilityEvidence: {
        baselinePrimaryMargin: -0.2,
        bestCandidatePrimaryMargin: -0.16,
        requiredLiftToZero: 0.2,
        achievedLiftFromBaseline: 0.04,
        bestAchievedLift: 0.04,
        residualMarginToZero: -0.16,
        gapToZero: 0.16,
        crossZeroAchieved: false,
        method: "bounded_sweep_margin_analysis",
        inferenceLabel: "mixed",
      },
      zeroCrossFeasibilityDecision: "zero_cross_not_achievable_within_bounds",
      zeroCrossFeasibilityReasonCodes: expect.arrayContaining([
        "best_margin_still_negative",
        "candidate_not_evaluated",
      ]),
      boundedSearchEnvelope: {
        pressureScaleMin: 0.85,
        pressureScaleMax: 1,
        densityLiftMin: 0,
        densityLiftMax: 0.15,
        coarsePressureStep: 0.025,
        coarseDensityLiftStep: 0.025,
        refinePressureStep: 0.0125,
        refineDensityLiftStep: 0.0125,
        coarseCandidateCount: 2,
        refineCandidateCount: 0,
        refineSeedCount: 0,
        observerDomainFixed: true,
      },
      runtimeApplication: {
        attempted: true,
        enabled: false,
        status: "rolled_back",
        failureMode: "runtime_apply_disabled",
        evaluationComparable: true,
        sampleCount: 9,
        comparableSampleCount: 9,
        minimumComparableSampleCount: 3,
        sampleCountSufficient: true,
        referenceRouteId: "einstein_tensor_geometry_fd2_independent_v1",
        selectedRouteId: "einstein_tensor_geometry_fd4_v1",
        selectedPath: "full_einstein_tensor",
        candidateId:
          "same_chart_physics_control_coupled_density_pressure_probe_v1",
      },
      recommendation: "physics_control_patch",
    });
    expect(artifact.observerDecPhysicsControlEvidence?.sweepCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          candidateId: "observer_domain_truncation_zeta0_probe_v1",
          candidateClass: "observer_domain_truncation",
          sweepPhase: "baseline",
          passesSelectionGate: false,
        }),
        expect.objectContaining({
          candidateId: "same_chart_physics_control_no_domain_shift_probe_v1",
          candidateClass: "physics_control_proposal",
          sweepPhase: "coarse",
          passesSelectionGate: false,
        }),
        expect.objectContaining({
          candidateId:
            "same_chart_physics_control_coupled_density_pressure_probe_v1",
          candidateClass: "physics_control_proposal",
          sweepPhase: "coarse",
          passesSelectionGate: true,
        }),
      ]),
    );
    expect(artifact.observerDecPhysicsControlEvidence?.selectionReasonCodes).toEqual(
      expect.arrayContaining([
        "selection_gate_pass",
      ]),
    );
    expect(
      artifact.observerDecPhysicsControlEvidence?.nonRegressionGate.pass,
    ).toBe(true);
    expect(
      artifact.observerDecPhysicsControlEvidence?.runtimeApplication,
    ).toMatchObject({
      attempted: true,
      status: "rolled_back",
      failureMode: "runtime_apply_disabled",
      evaluationComparable: true,
      sampleCount: 9,
      comparableSampleCount: 9,
      minimumComparableSampleCount: 3,
      sampleCountSufficient: true,
      referenceRouteId: "einstein_tensor_geometry_fd2_independent_v1",
      selectedRouteId: "einstein_tensor_geometry_fd4_v1",
      selectedPath: "full_einstein_tensor",
      candidateId:
        "same_chart_physics_control_coupled_density_pressure_probe_v1",
      comparabilityGate: expect.objectContaining({
        chartRef: "comoving_cartesian",
        chartParity: true,
        selectedPathParity: true,
        independentCrossCheckStatus: "pass",
        pass: true,
      }),
      rollbackReasonCodes: ["candidate_not_evaluated"],
    });
    expect(artifact.observerDecPhysicsControlEvidence?.controlKnobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          knobId: "observer_rapidity_cap",
          bounded: true,
        }),
        expect.objectContaining({
          knobId: "same_chart_tensor_physics_control",
          bounded: true,
        }),
        expect.objectContaining({
          knobId: "same_chart_tensor_density_lift",
          bounded: true,
        }),
      ]),
    );
    expect(artifact.observerDecPhysicsControlEvidence?.claimCitationMap).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          claimId: "same_chart_projection_grammar_required",
        }),
        expect.objectContaining({
          claimId: "geometry_first_route_is_control_basis",
        }),
      ]),
    );
    expect(
      artifact.observerDecPhysicsControlEvidence?.claimCitationMapCompleteness,
    ).toMatchObject({
      status: "pass",
      expectedClaimCount: 2,
      coveredClaimCount: 2,
      expectedClaimIds: expect.arrayContaining([
        "same_chart_projection_grammar_required",
        "geometry_first_route_is_control_basis",
      ]),
      missingClaimIds: [],
    });
    expect(
      artifact.observerDecPhysicsControlEvidence?.uncertaintyNotes,
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "coupled non-truncation same-chart physics-control probe",
        ),
      ]),
    );
    expect(
      artifact.observerDecPhysicsControlEvidence?.sweepPhaseSummary,
    ).toMatchObject({
      coarseCandidateCount: 2,
      coarsePassingCount: 1,
      refineCandidateCount: 0,
      refinePassingCount: 0,
    });
    expect(
      artifact.observerDecPhysicsControlEvidence?.topCandidateLeaderboard,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rank: 1,
          candidateId:
            "same_chart_physics_control_coupled_density_pressure_probe_v1",
          sweepPhase: "coarse",
        }),
      ]),
    );
    expect(
      artifact.observerDecPhysicsControlEvidence?.uncertaintyTags,
    ).toEqual(
      expect.arrayContaining(["direct_measurement", "inference", "open_assumption"]),
    );
    expect(isNhm2ObserverAuditArtifact(artifact)).toBe(true);
  });

  it("marks missing tensor inputs as incomplete and unavailable", () => {
    const artifact = buildNhm2ObserverAuditArtifact({
      metricRequired: null,
      tileEffective: {
        tensorRef: "warp.tileEffectiveStressEnergy",
        conditions: {
          nec: positiveCondition(0.3),
          wec: positiveCondition(0.2),
          sec: positiveCondition(0.15),
          dec: positiveCondition(0.12),
        },
      },
    });

    expect(artifact.status).toBe("unavailable");
    expect(artifact.completeness).toBe("incomplete");
    expect(artifact.reasonCodes).toContain("metric_tensor_missing");
    expect(artifact.tensors.metricRequired.status).toBe("unavailable");
    expect(artifact.tensors.metricRequired.completeness).toBe("incomplete");
  });
});
