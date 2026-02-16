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

  it("returns pending diagnostics object shape for async accepted response", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, overallStatus: "NOMINAL", strictCongruence: true }),
      text: async () => "",
    }));
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    buildDiagnosticsMock.mockResolvedValue({
      kind: "time_dilation_diagnostics",
      renderingSeed: "diag:seed:full",
      gate: { banner: null, reasons: [] },
      strict: { strictCongruence: true, strictMetricMissing: false, anyProxy: false },
      canonical: { family: "natario", chart: "comoving_cartesian" },
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
    expect(res.body?.pipelineUpdate).toEqual(expect.objectContaining({ ok: true, pending: true }));
    expect(res.body?.diagnostics).toEqual(
      expect.objectContaining({ ok: false, status: "pending", pending: true, error: "diagnostics_pending" }),
    );
    expect(res.body?.renderingSeed).toEqual(expect.any(String));
    expect(res.body?.seedStatus).toBe("provisional");
    expect(res.body?.warnings).toEqual(expect.arrayContaining(["diagnostics_partial"]));
  });

  it("publishes full diagnostics shape after async completion with final seed lineage", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, overallStatus: "NOMINAL", strictCongruence: true }),
      text: async () => "",
    }));
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    buildDiagnosticsMock.mockResolvedValue({
      kind: "time_dilation_diagnostics",
      renderingSeed: "diag:final:seed",
      gate: { banner: "CERTIFIED", reasons: [] },
      strict: { strictCongruence: true, strictMetricMissing: false, anyProxy: false },
      canonical: { family: "natario", chart: "comoving_cartesian", observer: "ship", normalization: "metric" },
    });

    const { helixTimeDilationRouter } = await import("../server/routes/helix/time-dilation");
    const app = express();
    app.use(express.json());
    app.use("/api/helix/time-dilation", helixTimeDilationRouter);

    const activateRes = await request(app)
      .post("/api/helix/time-dilation/activate")
      .send({ warpFieldType: "natario", grEnabled: true, strictCongruence: true, async: true });

    expect(activateRes.status).toBe(202);
    expect(activateRes.body?.seedStatus).toBe("provisional");

    await new Promise((resolve) => setTimeout(resolve, 0));

    const diagRes = await request(app).get("/api/helix/time-dilation/diagnostics");
    expect(diagRes.status).toBe(200);
    expect(diagRes.body).toEqual(
      expect.objectContaining({
        ok: true,
        status: "ready",
        seedStatus: "final",
        renderingSeed: "diag:final:seed",
      }),
    );
    expect(diagRes.body?.payload).toEqual(
      expect.objectContaining({
        kind: "time_dilation_diagnostics",
        gate: expect.any(Object),
        strict: expect.any(Object),
        canonical: expect.any(Object),
        renderingSeed: "diag:final:seed",
      }),
    );
  });

  it("publishes explicit error diagnostics shape when async background fails", async () => {
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

    const activateRes = await request(app)
      .post("/api/helix/time-dilation/activate")
      .send({ warpFieldType: "natario", grEnabled: true, strictCongruence: true, async: true });

    expect(activateRes.status).toBe(202);
    expect(activateRes.body?.accepted).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const diagRes = await request(app).get("/api/helix/time-dilation/diagnostics");
    expect(diagRes.status).toBe(200);
    expect(diagRes.body).toEqual(
      expect.objectContaining({
        ok: false,
        status: "error",
        reason: "activate_failed",
        seedStatus: "provisional",
        renderingSeed: activateRes.body?.renderingSeed,
      }),
    );
    expect(diagRes.body?.payload).toEqual(
      expect.objectContaining({ ok: false, error: "activate_failed", message: expect.any(String) }),
    );
  });
});

describe("/api/helix/time-dilation/control", () => {
  it("accepts codex control commands and returns latest command", async () => {
    const { helixTimeDilationRouter } = await import("../server/routes/helix/time-dilation");
    const app = express();
    app.use(express.json());
    app.use("/api/helix/time-dilation", helixTimeDilationRouter);

    const postRes = await request(app)
      .post("/api/helix/time-dilation/control")
      .send({
        command: "set_debug_overrides",
        args: { alphaSource: "gr-brick", warpStrength: 0.14, viewerChart: "adm" },
        source: "codex",
      });

    expect(postRes.status).toBe(200);
    expect(postRes.body?.ok).toBe(true);
    expect(postRes.body?.command).toEqual(
      expect.objectContaining({
        command: "set_debug_overrides",
        source: "codex",
        args: expect.objectContaining({ alphaSource: "gr-brick", warpStrength: 0.14 }),
      }),
    );

    const getRes = await request(app).get("/api/helix/time-dilation/control");
    expect(getRes.status).toBe(200);
    expect(getRes.body?.ok).toBe(true);
    expect(getRes.body?.command).toEqual(
      expect.objectContaining({ command: "set_debug_overrides", source: "codex" }),
    );

    const clearRes = await request(app).delete("/api/helix/time-dilation/control");
    expect(clearRes.status).toBe(200);
    expect(clearRes.body?.ok).toBe(true);

    const afterClear = await request(app).get("/api/helix/time-dilation/control");
    expect(afterClear.status).toBe(200);
    expect(afterClear.body?.command).toBeNull();
  });
});
