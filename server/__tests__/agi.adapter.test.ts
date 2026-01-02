import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";

const runMock = vi.hoisted(() => vi.fn());
const recordMock = vi.hoisted(() => vi.fn());

vi.mock("../gr/gr-agent-loop.js", () => ({
  runGrAgentLoop: (...args: unknown[]) => runMock(...args),
}));

vi.mock("../services/observability/gr-agent-loop-store.js", () => ({
  recordGrAgentLoopRun: (...args: unknown[]) => recordMock(...args),
}));

type AdapterRouterModule = typeof import("../routes/agi.adapter");

let app: express.Express;

const mockResult = {
  accepted: false,
  acceptedIteration: undefined,
  attempts: [
    {
      iteration: 0,
      proposal: { label: "baseline", params: { dutyCycle: 0.004 } },
      evaluation: {
        constraints: [
          {
            id: "H_constraint",
            severity: "HARD",
            status: "fail",
            value: 0.12,
            limit: "H_rms <= 0.01",
          },
        ],
        certificate: {
          certificateHash: "cert-hash",
          certificateId: "cert-id",
        },
      },
    },
  ],
} as any;

const loadModules = async (): Promise<AdapterRouterModule> => {
  process.env.TRAINING_TRACE_PERSIST = "0";
  process.env.CONSTRAINT_PACK_POLICY_PERSIST = "0";
  process.env.CASIMIR_AUTO_TELEMETRY = "0";
  await vi.resetModules();
  return import("../routes/agi.adapter");
};

beforeAll(async () => {
  const routes = await loadModules();
  app = express();
  app.use(express.json());
  app.use("/api/agi/adapter", routes.adapterRouter);
});

beforeEach(() => {
  runMock.mockReset();
  recordMock.mockReset();
  runMock.mockResolvedValue(mockResult);
  recordMock.mockReturnValue({ id: "run-1" });
});

describe("agi adapter API", () => {
  it("runs adapter and returns verdict payload", async () => {
    const response = await request(app)
      .post("/api/agi/adapter/run")
      .send({
        traceId: "trace-1",
        actions: [{ id: "a1", params: { dutyCycle: 0.004 } }],
        budget: { maxIterations: 1 },
      })
      .expect(200);

    expect(response.body?.traceId).toBe("trace-1");
    expect(response.body?.runId).toBe("run-1");
    expect(response.body?.verdict).toBe("FAIL");
    expect(response.body?.pass).toBe(false);
    expect(response.body?.firstFail?.id).toBe("H_constraint");
    expect(Array.isArray(response.body?.deltas)).toBe(true);
    expect(response.body?.artifacts).toEqual(
      expect.arrayContaining([
        { kind: "gr-agent-loop-run", ref: "run-1" },
        { kind: "gr-agent-loop-run-url", ref: "/api/helix/gr-agent-loop/run-1" },
        { kind: "training-trace-export", ref: "/api/agi/training-trace/export" },
        { kind: "warp-certificate-hash", ref: "cert-hash" },
      ]),
    );
  });

  it("evaluates constraint pack runs via adapter", async () => {
    const response = await request(app)
      .post("/api/agi/adapter/run")
      .send({
        traceId: "pack-trace-1",
        mode: "constraint-pack",
        pack: {
          id: "repo-convergence",
          telemetry: {
            build: { status: "pass", durationMs: 420000 },
            tests: { failed: 0, total: 12 },
            schema: { contracts: true },
            deps: { coherence: true },
          },
        },
      })
      .expect(200);

    expect(response.body?.traceId).toBe("pack-trace-1");
    expect(response.body?.verdict).toBe("PASS");
    expect(response.body?.pass).toBe(true);
    expect(runMock).not.toHaveBeenCalled();
    expect(response.body?.artifacts).toEqual(
      expect.arrayContaining([
        { kind: "constraint-pack", ref: "repo-convergence" },
        { kind: "training-trace-export", ref: "/api/agi/training-trace/export" },
      ]),
    );
  });
});
