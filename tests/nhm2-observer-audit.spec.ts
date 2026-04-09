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
