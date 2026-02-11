import { describe, expect, it } from "vitest";
import { buildWarpMetricAdapterSnapshot } from "../modules/warp/warp-metric-adapter";

describe("buildWarpMetricAdapterSnapshot", () => {
  it("defaults dtGammaPolicy based on chart label", () => {
    const lab = buildWarpMetricAdapterSnapshot({
      family: "natario",
      chart: { label: "lab_cartesian" },
    });
    expect(lab.chart.dtGammaPolicy).toBe("computed");
    expect(lab.chart.contractStatus).toBe("unknown");

    const comoving = buildWarpMetricAdapterSnapshot({
      family: "natario",
      chart: { label: "comoving_cartesian" },
    });
    expect(comoving.chart.dtGammaPolicy).toBe("assumed_zero");
    expect(comoving.chart.contractStatus).toBe("ok");
  });

  it("annotates dtGammaPolicy overrides in chart notes", () => {
    const snap = buildWarpMetricAdapterSnapshot({
      family: "alcubierre",
      chart: {
        label: "lab_cartesian",
        dtGammaPolicy: "assumed_zero",
        notes: "user note",
      },
    });

    expect(snap.chart.dtGammaPolicy).toBe("assumed_zero");
    expect(snap.chart.notes).toContain("user note");
    expect(snap.chart.notes).toContain("dtGammaPolicy override");
    expect(snap.chart.notes).toContain("lab_cartesian");
    expect(snap.chart.contractStatus).toBe("override");
  });

  it("computes finite-diff diagnostics when a shift field is provided", () => {
    const snap = buildWarpMetricAdapterSnapshot({
      family: "natario",
      shiftVectorField: {
        evaluateShiftVector: (x, y, z) => [x, y, z],
      },
      sampleScale_m: 2,
      sampleCount: 16,
    });

    expect(snap.betaDiagnostics?.method).toBe("finite-diff");
    expect(snap.betaDiagnostics?.thetaMax).toBeCloseTo(3, 6);
    expect(snap.betaDiagnostics?.thetaRms).toBeCloseTo(3, 6);
    expect(snap.betaDiagnostics?.curlMax ?? 0).toBeLessThan(1e-8);
    expect(snap.betaDiagnostics?.sampleCount ?? 0).toBeGreaterThan(0);
  });

  it("applies VdB conformal derivative correction to theta diagnostics", () => {
    const snap = buildWarpMetricAdapterSnapshot({
      family: "vdb",
      chart: { label: "comoving_cartesian" },
      shiftVectorField: {
        amplitude: 0.2,
        evaluateShiftVector: (x, y, z) => [x, y, z],
      },
      sampleScale_m: 2,
      sampleCount: 16,
      vdbConformalDiagnostics: {
        bMin: 10,
        bMax: 40,
        bprimeMin: -8,
        bprimeMax: 8,
        bdoubleMin: -12,
        bdoubleMax: 12,
      },
    });

    expect(snap.betaDiagnostics?.method).toBe("finite-diff+conformal");
    expect(snap.betaDiagnostics?.thetaConformalMax).toBeGreaterThan(0);
    expect(snap.betaDiagnostics?.bPrimeOverBMax).toBeGreaterThan(0);
    expect(snap.betaDiagnostics?.thetaMax ?? 0).toBeGreaterThan(3);
    expect(String(snap.betaDiagnostics?.note ?? "")).toContain(
      "VdB conformal correction",
    );
  });
});
