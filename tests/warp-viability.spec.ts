import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const runtime = vi.hoisted(() => ({
  pipeline: {} as any,
}));

const mocks = vi.hoisted(() => ({
  calculateEnergyPipeline: vi.fn(async (state: any) => ({ ...state, ...runtime.pipeline })),
  initializePipelineState: vi.fn(() => ({
    shipRadius_m: 1,
    dutyCycle: 0.1,
    hull: { Lx_m: 2, Ly_m: 2, Lz_m: 2, wallThickness_m: 0.1 },
    tileArea_cm2: 1,
    gammaGeo: 1,
  })),
  loadWarpAgentsConfig: vi.fn(async () => ({})),
  findWarpConstraint: vi.fn(() => undefined),
  resolveConstraintSeverity: vi.fn((_cfg: unknown, _id: string, fallback: any) => fallback),
}));

vi.mock("../server/energy-pipeline", () => ({
  calculateEnergyPipeline: mocks.calculateEnergyPipeline,
  initializePipelineState: mocks.initializePipelineState,
  MODE_CONFIGS: { hover: { zeta_max: 1 } },
  PAPER_GEO: { RADIAL_LAYERS: 1, PACKING: 1 },
}));

vi.mock("../modules/physics/warpAgents", () => ({
  loadWarpAgentsConfig: mocks.loadWarpAgentsConfig,
  findWarpConstraint: mocks.findWarpConstraint,
  resolveConstraintSeverity: mocks.resolveConstraintSeverity,
}));

import { evaluateWarpViability } from "../tools/warpViability";

const makePipeline = (overrides: Record<string, unknown> = {}) => ({
  currentMode: "hover",
  hull: { Lx_m: 2, Ly_m: 2, Lz_m: 2, wallThickness_m: 0.1 },
  dutyCycle: 0.1,
  dutyShip: 0.1,
  d_eff: 0.1,
  gammaGeo: 2,
  gammaVanDenBroeck: 1,
  qSpoilingFactor: 1,
  N_tiles: 4,
  tileArea_cm2: 1,
  U_static: -1,
  TS_ratio: 120,
  tsMetricDerived: true,
  tsMetricDerivedSource: "warp.metricAdapter+clocking",
  tsMetricDerivedReason: "TS_ratio from proper-distance timing with explicit chart contract",
  M_exotic: 0.5,
  zeta: 0.5,
  fordRomanCompliance: true,
  natarioConstraint: true,
  overallStatus: "NOMINAL",
  sectorPeriod_ms: 1,
  P_avg: 0.001,
  exoticMassTarget_kg: 1,
  gr: {
    constraints: {
      rho_constraint: { mean: -1.5, rms: 0.1, maxAbs: 0.2 },
      H_constraint: { rms: 1e-4, maxAbs: 1e-3 },
      M_constraint: { rms: 1e-4, maxAbs: 1e-3 },
    },
    matter: { stressEnergy: { avgT00: -1.4 } },
    gauge: { lapseMin: 1, betaMaxAbs: 0.1 },
  },
  qiGuardrail: {
    marginRatio: 0.5,
    lhs_Jm3: -1,
    bound_Jm3: -2,
    rhoSource: "warp.metric.T00.natario.shift",
  },
  ...overrides,
});

describe("warp viability congruence wiring", () => {
  const strictEnv = process.env.WARP_STRICT_CONGRUENCE;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WARP_STRICT_CONGRUENCE = "1";
    runtime.pipeline = makePipeline({
      thetaCal: 10,
      warp: {
        metricT00: -100,
        metricT00Source: "metric",
        metricT00Ref: "warp.metric.T00.natario.shift",
        metricAdapter: {
          family: "natario",
          chart: { label: "comoving_cartesian" },
          betaDiagnostics: { thetaMax: 0.5, method: "finite-diff" },
        },
      },
    });
  });

  it("propagates metricT00Ref into CL3 source and details", async () => {
    const result = await evaluateWarpViability({});
    const cl3 = result.constraints.find((c) => c.id === "CL3_RhoDelta");
    expect(result.snapshot.rho_delta_metric_source).toBe(
      "warp.metric.T00.natario.shift",
    );
    expect(result.snapshot.rho_delta_metric_chart).toBe("comoving_cartesian");
    expect(result.snapshot.rho_delta_metric_family).toBe("natario");
    expect(result.snapshot.thetaCal).toBe(10);
    expect(result.snapshot.theta_audit).toBe(0.5);
    expect(result.snapshot.theta_metric_derived).toBe(true);
    expect(result.snapshot.theta_metric_reason).toBe("metric_adapter_divergence");
    expect((result.snapshot as any).theta_provenance_class).toBe("measured");
    expect((result.snapshot as any).theta_confidence_band).toEqual({ low: 0.8, high: 0.99 });
    const ts = result.constraints.find((c) => c.id === "TS_ratio_min");
    expect((ts as any)?.provenance_class).toBe("measured");
    expect((ts as any)?.claim_tier).toBe("certified");
    expect((ts as any)?.confidence_band).toEqual({ low: 0.8, high: 0.99 });
    expect((result.snapshot as any).warp_mechanics_provenance_class).toBe("measured");
    expect((result.snapshot as any).warp_mechanics_claim_tier).toBe("reduced-order");
    expect((result.snapshot as any).warp_mechanics_promotion_reason).toBe("hard_constraint_failed");
    expect((result.snapshot as any).warp_mechanics_promotion_counterexample_class).toBe(
      "hard_constraint_regression",
    );
    expect((result.snapshot as any).warp_mechanics_promotion_replay).toMatchObject({
      version: "promotion-replay-pack/v1",
      outcome: {
        tier: "reduced-order",
        reason: "hard_constraint_failed",
        counterexample_class: "hard_constraint_regression",
        conservative_downgrade: true,
      },
    });
    expect(
      String((result.snapshot as any).warp_mechanics_promotion_replay?.deterministic_key ?? ""),
    ).toContain("reason=hard_constraint_failed");
    expect(cl3?.details).toContain("source=warp.metric.T00.natario.shift");
    expect(cl3?.details).not.toContain("T00_ref=n/a");
  });

  it("falls back to natario metric T00 source when warp metric T00 is absent", async () => {
    runtime.pipeline = makePipeline({
      warp: {
        metricAdapter: { betaDiagnostics: { thetaMax: 0.5, method: "finite-diff" } },
      },
      natario: {
        metricT00: -42,
        metricT00Source: "metric",
        metricT00Ref: "warp.metric.T00.natario_sdf.shift",
      },
    });

    const result = await evaluateWarpViability({});
    const cl3 = result.constraints.find((c) => c.id === "CL3_RhoDelta");
    expect(result.snapshot.rho_delta_metric_source).toBe(
      "warp.metric.T00.natario_sdf.shift",
    );
    expect(cl3?.details).toContain("source=warp.metric.T00.natario_sdf.shift");
    expect(cl3?.details).not.toContain("T00_ref=n/a");
  });

  it("accepts Natário chart contract metadata when warp adapter chart metadata is missing", async () => {
    runtime.pipeline = makePipeline({
      warp: {
        metricAdapter: { betaDiagnostics: { thetaMax: 0.5, method: "finite-diff" } },
      },
      natario: {
        metricT00: -42,
        metricT00Source: "metric",
        metricT00Ref: "warp.metric.T00.natario.shift",
        chartLabel: "natario_comoving",
        chartContractStatus: "ok",
        metricT00Observer: "eulerian_n",
        metricT00Normalization: "si_stress",
        metricT00UnitSystem: "SI",
        metricT00ContractStatus: "ok",
      },
    });

    const result = await evaluateWarpViability({});
    expect((result.snapshot as any).rho_delta_metric_source).toBe("warp.metric.T00.natario.shift");
    expect((result.snapshot as any).rho_delta_metric_chart).toBe("natario_comoving");
    expect((result.snapshot as any).rho_delta_metric_contract_status).toBe("ok");
    expect((result.snapshot as any).rho_delta_metric_contract_ok).toBe(true);
    const cl3 = result.constraints.find((c) => c.id === "CL3_RhoDelta");
    expect(cl3?.details).toContain("contract=ok");
    expect(cl3?.note).not.toBe("metric_source_missing");
  });

  it("emits failing CL3_RhoDelta when metric-derived T00 is missing", async () => {
    runtime.pipeline = makePipeline({
      warp: {
        metricAdapter: { betaDiagnostics: { thetaMax: 0.5, method: "finite-diff" } },
      },
    });

    const result = await evaluateWarpViability({});
    expect(result.constraints.map((c) => c.id)).toContain("CL3_RhoDelta");
    const cl3 = result.constraints.find((c) => c.id === "CL3_RhoDelta");
    expect(result.snapshot.rho_delta_source).toBe("metric-missing");
    expect(cl3?.passed).toBe(false);
    expect(cl3?.note).toBe("metric_source_missing");
    expect(cl3?.details).toContain("reason=missing_metric_t00");
  });

  it("fails ThetaAudit on proxy theta in strict mode and allows it when strict is disabled", async () => {
    runtime.pipeline = makePipeline({
      thetaCal: 42,
      warp: {
        metricT00: -100,
        metricT00Source: "metric",
        metricT00Ref: "warp.metric.T00.natario.shift",
      },
    });

    const strictResult = await evaluateWarpViability({});
    const strictTheta = strictResult.constraints.find((c) => c.id === "ThetaAudit");
    expect(strictTheta?.passed).toBe(false);
    expect(strictTheta?.note).toBe("proxy_input");

    runtime.pipeline = makePipeline({
      thetaCal: 42,
      warp: {
        metricT00: -100,
        metricT00Source: "metric",
        metricT00Ref: "warp.metric.T00.natario.shift",
        metricAdapter: {
          betaDiagnostics: { method: "not-computed", thetaMax: 42 },
        },
      },
    });
    const strictProxyResult = await evaluateWarpViability({});
    const strictProxyTheta = strictProxyResult.constraints.find(
      (c) => c.id === "ThetaAudit",
    );
    expect(strictProxyTheta?.passed).toBe(false);
    expect(strictProxyTheta?.note).toBe("proxy_input");
    expect(strictProxyResult.snapshot.theta_metric_derived).toBe(false);
    expect(strictProxyResult.snapshot.theta_metric_reason).toBe("theta_geom_proxy");
    expect(strictProxyResult.snapshot.theta_audit).toBe(42);

    process.env.WARP_STRICT_CONGRUENCE = "0";
    const relaxedResult = await evaluateWarpViability({});
    const relaxedTheta = relaxedResult.constraints.find((c) => c.id === "ThetaAudit");
    expect(relaxedTheta?.passed).toBe(true);
  });

  it("fails ThetaAudit in strict mode when chart contract metadata is missing", async () => {
    runtime.pipeline = makePipeline({
      thetaCal: 10,
      warp: {
        metricT00: -100,
        metricT00Source: "metric",
        metricT00Ref: "warp.metric.T00.natario.shift",
        metricAdapter: {
          chart: { label: "comoving_cartesian", contractStatus: "unknown" },
          betaDiagnostics: { method: "finite-diff", thetaMax: 0.5 },
        },
      },
    });

    const result = await evaluateWarpViability({});
    const theta = result.constraints.find((c) => c.id === "ThetaAudit");
    expect(theta?.passed).toBe(false);
    expect(theta?.note).toBe("chart_contract_missing");
    expect(result.snapshot.theta_chart_contract_status).toBe("unknown");
    expect(result.snapshot.theta_chart_contract_ok).toBe(false);
  });

  it("fails FordRomanQI on proxy rho source in strict mode", async () => {
    runtime.pipeline = makePipeline({
      qiGuardrail: {
        marginRatio: 0.2,
        lhs_Jm3: -1,
        bound_Jm3: -5,
        rhoSource: "tile-telemetry",
      },
      warp: {
        metricT00: -100,
        metricT00Source: "metric",
        metricT00Ref: "warp.metric.T00.natario.shift",
        metricAdapter: { betaDiagnostics: { thetaMax: 0.5, method: "finite-diff" } },
      },
    });

    const result = await evaluateWarpViability({});
    const fr = result.constraints.find((c) => c.id === "FordRomanQI");
    expect(fr?.passed).toBe(false);
    expect(fr?.note).toBe("proxy_input");
    expect((fr as any)?.provenance_class).toBe("proxy");
    expect((fr as any)?.claim_tier).toBe("diagnostic");
    expect((fr as any)?.strict_provenance_reason).toBe("strict_provenance_non_measured");
    expect((fr as any)?.confidence_band).toEqual({ low: 0.2, high: 0.49 });
    expect((result.snapshot as any).qi_provenance_class).toBe("proxy");
    expect((result.snapshot as any).qi_confidence_band).toEqual({ low: 0.2, high: 0.49 });
  });

  it("fails FordRomanQI in strict mode when metric source is missing contract metadata", async () => {
    runtime.pipeline = makePipeline({
      qiGuardrail: {
        marginRatio: 0.2,
        lhs_Jm3: -1,
        bound_Jm3: -5,
        rhoSource: "warp.metric.T00.natario.shift",
      },
      warp: {
        metricT00: -100,
        metricT00Source: "metric",
        metricT00Ref: "warp.metric.T00.natario.shift",
        metricAdapter: {
          chart: { label: "comoving_cartesian", contractStatus: "unknown" },
          betaDiagnostics: { thetaMax: 0.5, method: "finite-diff" },
        },
      },
    });

    const result = await evaluateWarpViability({});
    const fr = result.constraints.find((c) => c.id === "FordRomanQI");
    expect(fr?.passed).toBe(false);
    expect(fr?.note).toBe("contract_missing");
    expect(result.snapshot.rho_delta_metric_contract_ok).toBe(false);
  });

  it("blocks legacy FordRoman boolean fallback in strict mode", async () => {
    runtime.pipeline = makePipeline({
      qiGuardrail: undefined,
      fordRomanCompliance: true,
      warp: {
        metricT00: -100,
        metricT00Source: "metric",
        metricT00Ref: "warp.metric.T00.natario.shift",
        metricAdapter: { betaDiagnostics: { thetaMax: 0.5, method: "finite-diff" } },
      },
    });

    const result = await evaluateWarpViability({});
    const fr = result.constraints.find((c) => c.id === "FordRomanQI");
    expect(fr?.passed).toBe(false);
    expect(fr?.note).toBe("proxy_input");
    expect(fr?.details).toContain("proxy_fallback_blocked");
    expect((fr as any)?.provenance_class).toBe("inferred");
    expect((fr as any)?.claim_tier).toBe("diagnostic");
    expect((fr as any)?.strict_provenance_reason).toBe("strict_provenance_non_measured");
    expect((fr as any)?.confidence_band).toEqual({ low: 0.5, high: 0.79 });
  });




  it("fails TS_ratio_min in strict mode when TS metric provenance is missing", async () => {
    runtime.pipeline = makePipeline({
      tsMetricDerived: false,
      tsMetricDerivedSource: undefined,
      tsMetricDerivedReason: undefined,
      warp: {
        metricT00: -100,
        metricT00Source: "metric",
        metricT00Ref: "warp.metric.T00.natario.shift",
        metricAdapter: { betaDiagnostics: { thetaMax: 0.5, method: "finite-diff" } },
      },
    });

    const result = await evaluateWarpViability({});
    const ts = result.constraints.find((c) => c.id === "TS_ratio_min");
    expect(ts?.passed).toBe(false);
    expect(ts?.note).toBe("proxy_input");
    expect(ts?.details).toContain("metric_source=false");
    expect(ts?.details).toContain("ts_source=unknown");
  });

  it("uses conservative non-certifying defaults when provenance metadata is missing", async () => {
    runtime.pipeline = makePipeline({
      tsMetricDerived: undefined,
      tsMetricDerivedSource: undefined,
      thetaCal: undefined,
      warp: {
        metricAdapter: {
          chart: { label: "comoving_cartesian", contractStatus: "ok" },
        },
      },
      qiGuardrail: {
        marginRatio: 0.5,
        lhs_Jm3: -1,
        bound_Jm3: -2,
        rhoSource: "unknown-source",
      },
    });

    const result = await evaluateWarpViability({});
    expect((result.snapshot as any).warp_mechanics_provenance_class).toBe("proxy");
    expect((result.snapshot as any).warp_mechanics_claim_tier).toBe("diagnostic");
    expect((result.snapshot as any).warp_mechanics_promotion_reason).toBe("insufficient_provenance");
    expect((result.snapshot as any).warp_mechanics_promotion_counterexample_class).toBe(
      "provenance_missing",
    );
    expect((result.snapshot as any).warp_mechanics_promotion_replay).toMatchObject({
      outcome: {
        reason: "insufficient_provenance",
        counterexample_class: "provenance_missing",
        conservative_downgrade: true,
      },
      inputs: {
        provenance_class: "proxy",
      },
    });
    const ts = result.constraints.find((c) => c.id === "TS_ratio_min");
    expect((ts as any)?.claim_tier).toBe("diagnostic");
  });

  it("fails VdB_band when region-II derivative evidence is missing", async () => {
    runtime.pipeline = makePipeline({
      gammaVanDenBroeck: 100,
      warp: {
        metricT00: -100,
        metricT00Source: "metric",
        metricT00Ref: "warp.metric.T00.natario.shift",
        metricAdapter: { betaDiagnostics: { thetaMax: 0.5, method: "finite-diff" } },
      },
      vdbRegionII: {
        support: true,
        sampleCount: 16,
        t00_mean: -2,
        bprime_min: 0,
        bprime_max: 0,
        bdouble_min: 0,
        bdouble_max: 0,
      },
      vdbRegionIV: {
        support: true,
        dfdr_max_abs: 1e-3,
      },
    });

    const result = await evaluateWarpViability({});
    const vdb = result.constraints.find((c) => c.id === "VdB_band");
    expect(vdb?.passed).toBe(false);
    expect(vdb?.details).toContain("derivII=false");
    expect(vdb?.details).toContain("derivTwoWall=false");
    expect(result.snapshot.vdb_region_ii_derivative_support).toBe(false);
    expect(result.snapshot.vdb_two_wall_derivative_support).toBe(false);
  });

  it("passes VdB_band when region-II and region-IV derivative evidence is present", async () => {
    runtime.pipeline = makePipeline({
      gammaVanDenBroeck: 100,
      warp: {
        metricT00: -100,
        metricT00Source: "metric",
        metricT00Ref: "warp.metric.T00.natario.shift",
        metricAdapter: { betaDiagnostics: { thetaMax: 0.5, method: "finite-diff" } },
      },
      vdbRegionII: {
        support: true,
        sampleCount: 16,
        t00_mean: -2,
        bprime_min: -2e-4,
        bprime_max: 1e-4,
        bdouble_min: -3e-4,
        bdouble_max: 2e-4,
      },
      vdbRegionIV: {
        support: true,
        dfdr_max_abs: 1e-3,
      },
    });

    const result = await evaluateWarpViability({});
    const vdb = result.constraints.find((c) => c.id === "VdB_band");
    expect(vdb?.passed).toBe(true);
    expect(vdb?.details).toContain("derivII=true");
    expect(vdb?.details).toContain("derivIV=true");
    expect(vdb?.details).toContain("derivTwoWall=true");
    expect(result.snapshot.vdb_region_ii_derivative_support).toBe(true);
    expect(result.snapshot.vdb_two_wall_derivative_support).toBe(true);
  });


  it("keeps promotion replay deterministic across identical evaluations", async () => {
    runtime.pipeline = makePipeline({
      warp: {
        metricT00: -100,
        metricT00Source: "metric",
        metricT00Ref: "warp.metric.T00.natario.shift",
        metricAdapter: {
          chart: { label: "comoving_cartesian", contractStatus: "ok" },
          betaDiagnostics: { thetaMax: 0.5, method: "finite-diff" },
        },
      },
      thetaCal: 10,
      TS_ratio: 150,
      tsMetricDerived: true,
      qiGuardrail: {
        marginRatio: 0.2,
        lhs_Jm3: -1,
        bound_Jm3: -5,
        rhoSource: "warp.metric.T00.natario.shift",
      },
    });

    const first = await evaluateWarpViability({});
    const second = await evaluateWarpViability({});
    const firstReplay = (first.snapshot as any).warp_mechanics_promotion_replay;
    const secondReplay = (second.snapshot as any).warp_mechanics_promotion_replay;

    expect(firstReplay).toEqual(secondReplay);
    expect(firstReplay?.deterministic_key).toBe(secondReplay?.deterministic_key);
    expect((first.snapshot as any).warp_mechanics_promotion_counterexample_class).toBe("hard_constraint_regression");
    expect((first.snapshot as any).warp_mechanics_promotion_reason).toBe("hard_constraint_failed");
    expect((first.snapshot as any).warp_mechanics_claim_tier).toBe("reduced-order");
  });

  // restore the caller environment for subsequent tests
  

  it("fails closed in strict mode when Natário contract metadata is incomplete", async () => {
    runtime.pipeline = makePipeline({
      warp: {
        metricT00: -100,
        metricT00Source: "metric",
        metricT00Ref: "warp.metric.T00.natario.shift",
        metricT00Observer: undefined,
        metricT00Normalization: "si_stress",
        metricT00UnitSystem: "SI",
        metricT00ContractStatus: "ok",
        metricAdapter: {
          family: "natario",
          chart: { label: "comoving_cartesian", contractStatus: "ok" },
          betaDiagnostics: { thetaMax: 0.5, method: "finite-diff" },
        },
      },
    });

    const result = await evaluateWarpViability({});
    expect((result.snapshot as any).rho_delta_metric_contract_ok).toBe(false);
    const cl3 = result.constraints.find((c) => c.id === "CL3_RhoDelta");
    expect(cl3?.details ?? "").toContain("contract=");
  });

  it("keeps non-finite QI snapshot numerics undefined (no null placeholders)", async () => {
    runtime.pipeline = makePipeline({
      qiGuardrail: {
        marginRatio: Number.NaN,
        marginRatioRaw: Number.NaN,
        lhs_Jm3: Number.NaN,
        bound_Jm3: Number.NaN,
        curvatureRatio: Number.NaN,
        rhoSource: "warp.metric.T00.natario.shift",
      },
      qi: {
        boundK: Number.NaN,
        safetySigma_Jm3: Number.POSITIVE_INFINITY,
      },
    });

    const result = await evaluateWarpViability({});
    expect((result.snapshot as any).qi_lhs_Jm3).toBeUndefined();
    expect((result.snapshot as any).qi_bound_Jm3).toBeUndefined();
    expect((result.snapshot as any).qi_margin_ratio).toBeUndefined();
    expect((result.snapshot as any).qi_margin_ratio_raw).toBeUndefined();
    expect((result.snapshot as any).qi_curvature_ratio).toBeUndefined();
    expect((result.snapshot as any).qi_bound_K).toBeUndefined();
    expect((result.snapshot as any).qi_safetySigma_Jm3).toBeUndefined();
  });

  it("prevents certified promotion when QI applicability is not PASS", async () => {
    runtime.pipeline = makePipeline({
      qiGuardrail: {
        marginRatio: 0.2,
        lhs_Jm3: -1,
        bound_Jm3: -5,
        rhoSource: "warp.metric.T00.natario.shift",
        applicabilityStatus: "NOT_APPLICABLE",
      },
    });
    const result = await evaluateWarpViability({});
    expect((result.snapshot as any).warp_mechanics_claim_tier).toBe("diagnostic");
    expect((result.snapshot as any).qi_applicability_status).toBe("NOT_APPLICABLE");
  });
afterAll(() => {
    process.env.WARP_STRICT_CONGRUENCE = strictEnv;
  });
});
