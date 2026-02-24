import { afterEach, describe, expect, it, vi } from "vitest";

const envBackup = {
  TS_AUTOSCALE_ENABLE: process.env.TS_AUTOSCALE_ENABLE,
  TS_AUTOSCALE_TARGET: process.env.TS_AUTOSCALE_TARGET,
  QI_AUTOSCALE_ENABLE: process.env.QI_AUTOSCALE_ENABLE,
  QI_AUTOSCALE_TARGET: process.env.QI_AUTOSCALE_TARGET,
  QI_AUTOSCALE_SOURCE: process.env.QI_AUTOSCALE_SOURCE,
  WARP_STRICT_CONGRUENCE: process.env.WARP_STRICT_CONGRUENCE,
};

const loadPipeline = async () => {
  vi.resetModules();
  const mod = await import("../server/energy-pipeline");
  return mod;
};

afterEach(() => {
  process.env.TS_AUTOSCALE_ENABLE = envBackup.TS_AUTOSCALE_ENABLE;
  process.env.TS_AUTOSCALE_TARGET = envBackup.TS_AUTOSCALE_TARGET;
  process.env.QI_AUTOSCALE_ENABLE = envBackup.QI_AUTOSCALE_ENABLE;
  process.env.QI_AUTOSCALE_TARGET = envBackup.QI_AUTOSCALE_TARGET;
  process.env.QI_AUTOSCALE_SOURCE = envBackup.QI_AUTOSCALE_SOURCE;
  process.env.WARP_STRICT_CONGRUENCE = envBackup.WARP_STRICT_CONGRUENCE;
});

describe("pipeline ts/qi autoscale integration", () => {
  it("keeps QI guard consistent when TS autoscale is active", async () => {
    process.env.WARP_STRICT_CONGRUENCE = "0";
    process.env.TS_AUTOSCALE_ENABLE = "true";
    process.env.TS_AUTOSCALE_TARGET = "1000000"; // force TS servo to engage hard
    process.env.QI_AUTOSCALE_ENABLE = "false";
    process.env.QI_AUTOSCALE_SOURCE = "metric";

    const { calculateEnergyPipeline, initializePipelineState } = await loadPipeline();

    const baseline = await calculateEnergyPipeline(initializePipelineState());
    await new Promise((resolve) => setTimeout(resolve, 200));
    const autoscaled = await calculateEnergyPipeline(baseline);

    const baseBurst =
      (baseline as any).lightCrossing?.burst_ns ??
      ((baseline as any).lightCrossing?.burst_ms ?? 0) * 1e6;
    const autoBurst =
      (autoscaled as any).lightCrossing?.burst_ns ??
      ((autoscaled as any).lightCrossing?.burst_ms ?? 0) * 1e6;

    expect(autoscaled.tsAutoscale?.engaged ?? false).toBe(true);
    expect(autoBurst).toBeLessThanOrEqual(baseBurst);

    const guard = (autoscaled as any).qiGuardrail;
    expect(guard?.marginRatioRaw).toBeDefined();
    expect(Number.isFinite(guard?.marginRatioRaw ?? Number.NaN)).toBe(true);
    expect(guard?.marginRatioRaw ?? 0).toBeGreaterThan(0);
    expect(Math.abs((guard?.sumWindowDt ?? 1) - 1)).toBeLessThanOrEqual(0.1);
  });

  it("keeps TS timing stable when only QI autoscale is active", async () => {
    process.env.WARP_STRICT_CONGRUENCE = "0";
    process.env.TS_AUTOSCALE_ENABLE = "false";
    process.env.TS_AUTOSCALE_TARGET = "120";
    process.env.QI_AUTOSCALE_ENABLE = "true";
    process.env.QI_AUTOSCALE_TARGET = "0.0000005"; // force QI servo to engage
    process.env.QI_AUTOSCALE_SOURCE = "metric";

    const { calculateEnergyPipeline, initializePipelineState } = await loadPipeline();

    const baseline = await calculateEnergyPipeline(initializePipelineState());
    await new Promise((resolve) => setTimeout(resolve, 200));
    const autoscaled = await calculateEnergyPipeline(baseline);

    const baseBurst =
      (baseline as any).lightCrossing?.burst_ns ??
      ((baseline as any).lightCrossing?.burst_ms ?? 0) * 1e6;
    const autoBurst =
      (autoscaled as any).lightCrossing?.burst_ns ??
      ((autoscaled as any).lightCrossing?.burst_ms ?? 0) * 1e6;

    expect(autoscaled.qiAutoscale?.engaged ?? false).toBe(true);
    expect((autoscaled.qiAutoscale as any).gating).toBe("active");
    expect(autoBurst).toBeCloseTo(baseBurst, 6);
    expect(autoscaled.tsAutoscale?.engaged ?? false).toBe(false);
  });

  it("marks TS as metric-derived when charted metric adapter and derived timing are active", async () => {
    process.env.WARP_STRICT_CONGRUENCE = "1";
    process.env.TS_AUTOSCALE_ENABLE = "false";
    process.env.QI_AUTOSCALE_ENABLE = "false";

    const { calculateEnergyPipeline, initializePipelineState } = await loadPipeline();
    const snapshot = await calculateEnergyPipeline(initializePipelineState());

    expect((snapshot as any).tsMetricDerived).toBe(true);
    expect((snapshot as any).tsMetricDerivedSource).toBe("warp.metricAdapter+clocking");
    expect((snapshot as any).clocking?.metricDerived).toBe(true);
    expect((snapshot as any).ts?.metricDerived).toBe(true);
    expect((snapshot as any).natario?.metricMode).toBe(true);
    expect((snapshot as any).natario?.metricT00Source).toBe("metric");
    expect(String((snapshot as any).natario?.metricT00Ref ?? "")).toContain(
      "warp.metric.T00.natario",
    );
    expect((snapshot as any).natario?.metricT00Derivation).toBe(
      "forward_shift_to_K_to_rho_E",
    );
    expect((snapshot as any).natarioLegacy).toBeUndefined();
  });

  it("wires canonical metric T00 refs for non-alcubierre warp families", async () => {
    process.env.WARP_STRICT_CONGRUENCE = "1";
    process.env.TS_AUTOSCALE_ENABLE = "false";
    process.env.QI_AUTOSCALE_ENABLE = "false";

    const { calculateEnergyPipeline, initializePipelineState } = await loadPipeline();
    const cases = [
      { fieldType: "natario", ref: "warp.metric.T00.natario.shift" },
      { fieldType: "natario_sdf", ref: "warp.metric.T00.natario_sdf.shift" },
      { fieldType: "irrotational", ref: "warp.metric.T00.irrotational.shift" },
    ] as const;

    for (const testCase of cases) {
      const state = initializePipelineState();
      state.warpFieldType = testCase.fieldType as any;
      state.dynamicConfig = {
        ...(state.dynamicConfig ?? {}),
        warpFieldType: testCase.fieldType,
      } as any;

      const snapshot = await calculateEnergyPipeline(state);
      expect((snapshot as any).warp?.metricT00Source).toBe("metric");
      expect((snapshot as any).warp?.metricT00Ref).toBe(testCase.ref);
      expect((snapshot as any).natario?.metricMode).toBe(true);
      expect((snapshot as any).natario?.metricT00Source).toBe("metric");
      expect((snapshot as any).natario?.metricT00Ref).toBe(testCase.ref);
    }
  });

  it("marks TS as non-metric when hardware timing telemetry drives clocking", async () => {
    process.env.WARP_STRICT_CONGRUENCE = "1";
    process.env.TS_AUTOSCALE_ENABLE = "false";
    process.env.QI_AUTOSCALE_ENABLE = "false";

    const { calculateEnergyPipeline, initializePipelineState } = await loadPipeline();
    const state = initializePipelineState();
    state.hardwareTruth = {
      ...(state.hardwareTruth ?? {}),
      sectorState: {
        sectorsTotal: Number(state.sectorCount ?? 400),
        sectorsLive: Number(state.concurrentSectors ?? 1),
        dwell_ms: 1,
        burst_ms: 0.02,
        tauLC_ms: 0.003,
      } as any,
    };
    const snapshot = await calculateEnergyPipeline(state);

    expect((snapshot as any).clockingProvenance).toBe("hardware");
    expect((snapshot as any).tsMetricDerived).toBe(false);
    expect((snapshot as any).tsMetricDerivedSource).toBe("hardware_timing");
    expect((snapshot as any).clocking?.metricDerived).toBe(false);
    expect((snapshot as any).ts?.metricDerived).toBe(false);
  });

  it("promotes VdB region-II metric adapter fallback when warp module adapter is missing", async () => {
    process.env.WARP_STRICT_CONGRUENCE = "1";
    process.env.TS_AUTOSCALE_ENABLE = "false";
    process.env.QI_AUTOSCALE_ENABLE = "false";

    const { calculateEnergyPipeline, initializePipelineState, computeTauLcMsFromHull } =
      await loadPipeline();
    const warpModule = await import("../modules/warp/warp-module");
    const warpSpy = vi
      .spyOn(warpModule.warpBubbleModule, "calculate")
      .mockResolvedValue({} as any);

    try {
      const snapshot = await calculateEnergyPipeline(initializePipelineState());
      expect((snapshot as any).vdbRegionII?.support).toBe(true);
      expect((snapshot as any).warp?.metricT00Ref).toBe("warp.metric.T00.vdb.regionII");
      expect((snapshot as any).warp?.metricAdapter?.family).toBe("vdb");
      expect((snapshot as any).warp?.metricAdapter?.chart?.label).toBe("comoving_cartesian");
      expect((snapshot as any).warp?.metricAdapter?.gammaDiag?.[0]).toBeGreaterThan(1);
      expect((snapshot as any).warp?.metricAdapter?.betaDiagnostics?.method).toBe(
        "finite-diff+conformal",
      );
      expect(
        Number((snapshot as any).warp?.metricAdapter?.betaDiagnostics?.thetaConformalMax),
      ).toBeGreaterThan(0);
      expect((snapshot as any).warp?.metricT00Contract?.status).toBe("ok");
      expect((snapshot as any).theta_metric_derived).toBe(true);
      expect((snapshot as any).theta_metric_reason).toBe("metric_adapter_divergence");
      expect(Number.isFinite((snapshot as any).theta_geom)).toBe(true);
      const hullTauLcMs = computeTauLcMsFromHull((snapshot as any).hull);
      if (
        Number.isFinite(hullTauLcMs as number) &&
        Number.isFinite((snapshot as any)?.lightCrossing?.tauLC_ms)
      ) {
        expect((snapshot as any).lightCrossing.tauLC_ms).toBeGreaterThan(hullTauLcMs as number);
      }
      expect((snapshot as any).tsMetricDerived).toBe(true);
      expect((snapshot as any).tsMetricDerivedSource).toBe("warp.metricAdapter+clocking");
      expect((snapshot as any).clocking?.metricDerived).toBe(true);
      expect((snapshot as any).clocking?.metricDerivedSource).toBe("warp.metricAdapter+clocking");
      expect(String((snapshot as any).clocking?.detail ?? "")).toContain(
        "tau_LC from metric adapter gammaDiag",
      );
      expect((snapshot as any).ts?.metricDerived).toBe(true);
      expect((snapshot as any).ts?.metricDerivedSource).toBe("warp.metricAdapter+clocking");
      expect((snapshot as any).qiGuardrail?.metricDerived).toBe(true);
      expect(String((snapshot as any).qiGuardrail?.metricDerivedSource ?? "")).toContain(
        "warp.metricAdapter+clocking",
      );
      expect(String((snapshot as any).qiGuardrail?.metricDerivedSource ?? "")).toContain(
        "warp.metric.T00.vdb.regionII",
      );
    } finally {
      warpSpy.mockRestore();
    }
  });


  it("emits QI applicability and repayment heuristic labels", async () => {
    process.env.WARP_STRICT_CONGRUENCE = "1";
    const { calculateEnergyPipeline, initializePipelineState } = await loadPipeline();
    const snapshot = await calculateEnergyPipeline(initializePipelineState());
    const app = String((snapshot as any).qiGuardrail?.applicabilityStatus ?? "UNKNOWN");
    expect(["PASS", "NOT_APPLICABLE", "UNKNOWN"]).toContain(app);
    expect((snapshot as any).qiGuardrail?.strictMode).toBe(true);
    expect(typeof (snapshot as any).qiGuardrail?.metricContractOk).toBe("boolean");
    expect((snapshot as any).qi?.repayment_label).toBe("repayment_heuristic");
  });
});




  it("emits explicit Natário contract metadata fields in strict mode", async () => {
    process.env.WARP_STRICT_CONGRUENCE = "1";
    const { calculateEnergyPipeline, initializePipelineState } = await loadPipeline();
    const snapshot = await calculateEnergyPipeline(initializePipelineState());
    expect((snapshot as any).warp?.metricT00Observer).toBeTruthy();
    expect((snapshot as any).warp?.metricT00Normalization).toBeTruthy();
    expect((snapshot as any).warp?.metricT00UnitSystem).toBe("SI");
    expect((snapshot as any).warp?.metricAdapter?.chart?.label).toBeTruthy();
    expect((snapshot as any).warp?.metricAdapter?.chart?.contractStatus).toBeTruthy();
  });
describe("sector-control adapter hooks", () => {
  it("tracks monotonic QI behavior vs tau", async () => {
    const { fordRomanBound, isQiBoundMonotoneByTau } = await import("../server/qi/qi-bounds");
    const bounds = [2, 4, 8].map((tau) => fordRomanBound({ tau_s_ms: tau, sampler: "lorentzian" }));
    const magnitudes = bounds.map((bound) => Math.abs(bound));
    expect(isQiBoundMonotoneByTau(magnitudes)).toBe(true);
  });

  it("maps scheduler roles and fail-closes planner on hard QI constraints", async () => {
    const { computeSectorPhaseOffsets, buildSectorRoleAssignment } = await import("../server/energy/phase-scheduler");
    const { buildSectorControlPlan } = await import("../server/control/sectorControlPlanner");

    const schedule = computeSectorPhaseOffsets({
      N: 8,
      sectorPeriod_ms: 8,
      phase01: 0.25,
      tau_s_ms: 2,
      sampler: "gaussian",
      negativeFraction: 0.25,
    });
    const roles = buildSectorRoleAssignment(schedule);
    expect(Array.from(roles.neg).length).toBeGreaterThan(0);
    expect(Array.from(roles.pos).length).toBeGreaterThan(0);

    const plan = buildSectorControlPlan({
      mode: "diagnostic",
      timing: { strobeHz: 125, sectorPeriod_ms: 8, TS_ratio: 1.4, tauLC_ms: 8, tauPulse_ms: 6 },
      constraints: { FordRomanQI: "fail" },
    });
    expect(plan.ok).toBe(false);
    if (!plan.ok) {
      expect(plan.firstFail).toBe("FordRomanQI");
    }
  });
});
