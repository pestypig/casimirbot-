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
