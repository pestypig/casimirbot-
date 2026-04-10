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
    expect(artifact.tensors.metricRequired.fluxDiagnostics.status).toBe(
      "assumed_zero",
    );
    expect(artifact.tensors.tileEffective.model.pressureModel).toBe(
      "isotropic_pressure_proxy",
    );
    expect(artifact.distinction.preserveNegativeAndMixedResults).toBe(true);
    expect(isNhm2ObserverAuditArtifact(artifact)).toBe(true);
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
