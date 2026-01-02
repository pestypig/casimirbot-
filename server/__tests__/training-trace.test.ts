import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";
import path from "node:path";

type TrainingTraceRouterModule = typeof import("../routes/training-trace");
type TrainingTraceStoreModule = typeof import("../services/observability/training-trace-store");

let app: express.Express;
let resetStore: (() => void) | undefined;

const loadModules = async (): Promise<{
  routes: TrainingTraceRouterModule;
  store: TrainingTraceStoreModule;
}> => {
  process.env.TRAINING_TRACE_PERSIST = "0";
  process.env.TRAINING_TRACE_AUDIT_PATH = path.resolve(
    process.cwd(),
    ".cal",
    `training-trace-test-${process.pid}.jsonl`,
  );
  await vi.resetModules();
  const routes = await import("../routes/training-trace");
  const store = await import("../services/observability/training-trace-store");
  return { routes, store };
};

beforeAll(async () => {
  const { routes, store } = await loadModules();
  resetStore = store.__resetTrainingTraceStore;
  app = express();
  app.use(express.json());
  app.use("/api/agi", routes.trainingTraceRouter);
});

beforeEach(() => {
  resetStore?.();
});

describe("training-trace API", () => {
  it("ingests and retrieves traces", async () => {
    const payload = {
      traceId: "warp-viability:demo",
      pass: false,
      deltas: [
        { key: "gamma_VdB", from: 1, to: 1.5, delta: 0.5, change: "changed" },
      ],
      signal: { kind: "warp-viability", proxy: false },
      firstFail: {
        id: "FordRomanQI",
        severity: "HARD",
        status: "fail",
        value: -3e-6,
        limit: "-1e-6",
      },
      certificate: { status: "INADMISSIBLE", certificateHash: null },
      notes: ["status=INADMISSIBLE"],
    };
    const create = await request(app)
      .post("/api/agi/training-trace")
      .send(payload)
      .expect(200);
    const id = create.body?.trace?.id;
    expect(id).toBeTruthy();

    const list = await request(app)
      .get("/api/agi/training-trace?limit=10")
      .expect(200);
    expect(Array.isArray(list.body?.traces)).toBe(true);
    expect(list.body.traces.length).toBeGreaterThan(0);

    const fetched = await request(app)
      .get(`/api/agi/training-trace/${id}`)
      .expect(200);
    expect(fetched.body?.trace?.id).toBe(id);
    expect(fetched.body?.trace?.signal?.kind).toBe("warp-viability");
  });

  it("exports JSONL", async () => {
    await request(app)
      .post("/api/agi/training-trace")
      .send({ pass: true, deltas: [] })
      .expect(200);

    const res = await request(app)
      .get("/api/agi/training-trace/export")
      .expect(200);
    const body = typeof res.text === "string" ? res.text.trim() : "";
    const line = body.split("\n").filter(Boolean)[0];
    expect(line).toBeTruthy();
    const parsed = JSON.parse(line);
    expect(parsed.kind).toBe("training-trace");
  });
});
