import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const buildDiagnosticsMock = vi.fn();

vi.mock("@shared/time-dilation-diagnostics", async () => {
  const actual = await vi.importActual<typeof import("@shared/time-dilation-diagnostics")>(
    "@shared/time-dilation-diagnostics",
  );
  return {
    ...actual,
    buildTimeDilationDiagnostics: buildDiagnosticsMock,
  };
});

describe("/api/helix/time-dilation/activate contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns non-null pipelineUpdate/diagnostics for async success", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, overallStatus: "NOMINAL", strictCongruence: true }),
      text: async () => "",
    }));
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    buildDiagnosticsMock.mockResolvedValue({
      kind: "time_dilation_diagnostics",
      captured_at: new Date().toISOString(),
      gate: { banner: null, reasons: [] },
      definitions: {
        theta_definition: null,
        kij_sign_convention: null,
        gamma_field_naming: null,
        field_provenance_schema: null,
      },
      fieldProvenance: {},
      strict: {
        strictCongruence: true,
        latticeMetricOnly: true,
        strictMetricMissing: false,
        anyProxy: false,
        mathStageOK: true,
        grCertified: true,
        banner: null,
      },
      canonical: {
        family: "natario",
        chart: "comoving_cartesian",
        observer: "ship",
        normalization: "metric",
        unitSystem: null,
        match: null,
      },
      metric_contract: {
        metric_t00_contract_ok: true,
        metric_chart_contract_status: "ok",
        metric_chart_notes: null,
        metric_coordinate_map: null,
      },
      render_plan: {},
      sources: { proof_pack_proxy: false, gr_guardrails_proxy: false },
      wall: {},
    });

    const { helixTimeDilationRouter } = await import("../server/routes/helix/time-dilation");
    const app = express();
    app.use(express.json());
    app.use("/api/helix/time-dilation", helixTimeDilationRouter);

    const res = await request(app)
      .post("/api/helix/time-dilation/activate")
      .send({ warpFieldType: "natario", grEnabled: true, strictCongruence: true, async: true });

    expect(res.status).toBe(202);
    expect(res.body?.accepted).toBe(true);
    expect(res.body?.pipelineUpdate).toBeTruthy();
    expect(res.body?.diagnostics).toBeTruthy();
    expect(res.body?.updatedAt).toEqual(expect.any(Number));
    expect(res.body?.renderingSeed).toEqual(expect.any(String));
    expect(res.body?.strictCongruence).toBe(true);
    expect(res.body?.canonical).toEqual(
      expect.objectContaining({ family: "natario", mode: "natario", strictCongruence: true }),
    );
    expect(Array.isArray(res.body?.warnings)).toBe(true);
  });

  it("returns structured diagnostics metadata (not null) in async accepted responses", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, overallStatus: "CRITICAL", strictCongruence: true }),
      text: async () => "",
    }));
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    buildDiagnosticsMock.mockRejectedValue(new Error("diagnostics offline"));

    const { helixTimeDilationRouter } = await import("../server/routes/helix/time-dilation");
    const app = express();
    app.use(express.json());
    app.use("/api/helix/time-dilation", helixTimeDilationRouter);

    const res = await request(app)
      .post("/api/helix/time-dilation/activate")
      .send({ warpFieldType: "natario", grEnabled: true, strictCongruence: true, async: true });

    expect(res.status).toBe(202);
    expect(res.body?.accepted).toBe(true);
    expect(res.body?.pipelineUpdate).toEqual(
      expect.objectContaining({ ok: true, pending: true }),
    );
    expect(res.body?.diagnostics).toEqual(
      expect.objectContaining({ ok: false, pending: true, error: "diagnostics_pending" }),
    );
    expect(res.body?.diagnostics).not.toBeNull();
codex/fix-webgl2-and-502-bad-gateway-errors-hy1a3w
    expect(res.body?.warnings).toEqual(
      expect.arrayContaining(["diagnostics_partial"]),
    );
    expect(res.body?.updatedAt).toEqual(expect.any(Number));
    expect(res.body?.renderingSeed).toEqual(expect.any(String));
    expect(res.body?.canonical).toEqual(
      expect.objectContaining({ mode: "natario", family: "natario", strictCongruence: true }),
    );
    expect(Array.isArray(res.body?.warnings)).toBe(true);
main
  });
});
