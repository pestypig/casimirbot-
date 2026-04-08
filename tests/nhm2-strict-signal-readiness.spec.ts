import { describe, expect, it } from "vitest";

import {
  buildNhm2StrictSignalReadinessArtifact,
  isNhm2StrictSignalReadinessArtifact,
  NHM2_STRICT_SIGNAL_READINESS_ARTIFACT_ID,
  NHM2_STRICT_SIGNAL_READINESS_SCHEMA_VERSION,
} from "../shared/contracts/nhm2-strict-signal-readiness.v1";

describe("nhm2 strict-signal readiness artifact", () => {
  it("represents a fully metric-derived NHM2 run without inference", () => {
    const artifact = buildNhm2StrictSignalReadinessArtifact({
      familyId: "nhm2_shift_lapse",
      familyAuthorityStatus: "candidate_authoritative_solve_family",
      transportCertificationStatus: "bounded_transport_fail_closed_reference_only",
      strictModeEnabled: true,
      lapseSummary: {
        alphaCenterline: 0.995,
        alphaMin: 0.995,
        alphaMax: 1,
        alphaProfileKind: "linear_gradient_tapered",
        alphaGradientAxis: "x_ship",
        shiftLapseProfileId: "stage1_centerline_alpha_0p995_v1",
      },
      theta: {
        metricDerived: true,
        provenance: "metric",
        sourcePath: "warp.metricAdapter.betaDiagnostics.thetaMax",
      },
      ts: {
        metricDerived: true,
        provenance: "metric",
        sourcePath: "warp.metricAdapter+clocking",
      },
      qi: {
        metricDerived: true,
        provenance: "metric",
        sourcePath: "warp.metric.T00.nhm2.shift_lapse+warp.metricAdapter+clocking",
        rhoSource: "warp.metric.T00.nhm2.shift_lapse",
        applicabilityStatus: "PASS",
      },
    });

    expect(artifact.artifactId).toBe(NHM2_STRICT_SIGNAL_READINESS_ARTIFACT_ID);
    expect(artifact.schemaVersion).toBe(
      NHM2_STRICT_SIGNAL_READINESS_SCHEMA_VERSION,
    );
    expect(artifact.status).toBe("pass");
    expect(artifact.completeness).toBe("complete");
    expect(artifact.reasonCodes).toEqual([]);
    expect(artifact.readiness.promotionSignalReady).toBe(true);
    expect(artifact.readiness.certifiedPromotionReady).toBe(true);
    expect(artifact.family.lapseSummary?.shiftLapseProfileId).toBe(
      "stage1_centerline_alpha_0p995_v1",
    );
    expect(isNhm2StrictSignalReadinessArtifact(artifact)).toBe(true);
  });

  it("fails explicitly for proxy and missing strict signals", () => {
    const artifact = buildNhm2StrictSignalReadinessArtifact({
      strictModeEnabled: true,
      theta: {
        metricDerived: false,
        provenance: "proxy",
        sourcePath: "pipeline.thetaCal",
        reasonCode: "theta_geom_proxy",
      },
      ts: {
        metricDerived: false,
        provenance: "proxy",
        sourcePath: "hardware_timing",
        reasonCode: "hardware_timing",
        reason: "clocking provenance is hardware telemetry",
      },
      qi: {
        metricDerived: null,
        provenance: "missing",
        sourcePath: null,
        rhoSource: null,
        reasonCode: "strict_signal_missing",
        applicabilityStatus: null,
      },
    });

    expect(artifact.status).toBe("fail");
    expect(artifact.completeness).toBe("incomplete");
    expect(artifact.reasonCodes).toEqual([
      "strict_signal_missing",
      "insufficient_provenance",
    ]);
    expect(artifact.signals.theta.provenance).toBe("proxy");
    expect(artifact.signals.ts.reasonCode).toBe("hardware_timing");
    expect(artifact.signals.qi.status).toBe("unavailable");
    expect(artifact.missingSignals).toEqual(["qi"]);
    expect(artifact.proxySignals).toEqual(["theta", "ts"]);
    expect(artifact.readiness.promotionSignalReady).toBe(false);
  });

  it("marks strict-signal readiness as review when signals are complete but strict mode is disabled", () => {
    const artifact = buildNhm2StrictSignalReadinessArtifact({
      strictModeEnabled: false,
      theta: {
        metricDerived: true,
        provenance: "metric",
        sourcePath: "warp.metricAdapter.betaDiagnostics.thetaMax",
      },
      ts: {
        metricDerived: true,
        provenance: "metric",
        sourcePath: "warp.metricAdapter+clocking",
      },
      qi: {
        metricDerived: true,
        provenance: "metric",
        sourcePath: "warp.metric.T00.nhm2.shift_lapse+warp.metricAdapter+clocking",
        rhoSource: "warp.metric.T00.nhm2.shift_lapse",
        applicabilityStatus: "PASS",
      },
    });

    expect(artifact.status).toBe("review");
    expect(artifact.completeness).toBe("complete");
    expect(artifact.readiness.promotionSignalReady).toBe(true);
    expect(artifact.readiness.certifiedPromotionReady).toBe(false);
  });

  it("preserves absent lapse-summary numerics as null instead of coercing them to zero", () => {
    const artifact = buildNhm2StrictSignalReadinessArtifact({
      familyId: "nhm2_shift_lapse",
      lapseSummary: {
        alphaCenterline: 0.995,
        alphaMin: null,
        alphaMax: undefined,
        shiftLapseProfileId: "stage1_centerline_alpha_0p995_v1",
      },
    });

    expect(artifact.family.lapseSummary?.alphaCenterline).toBe(0.995);
    expect(artifact.family.lapseSummary?.alphaMin).toBeNull();
    expect(artifact.family.lapseSummary?.alphaMax).toBeNull();
  });

  it("rejects malformed payloads", () => {
    expect(
      isNhm2StrictSignalReadinessArtifact({
        artifactId: NHM2_STRICT_SIGNAL_READINESS_ARTIFACT_ID,
        schemaVersion: NHM2_STRICT_SIGNAL_READINESS_SCHEMA_VERSION,
        status: "pass",
      }),
    ).toBe(false);
  });
});
