import path from "node:path";
import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import {
  CollapseBenchmarkResult,
  collapseTriggerDecision,
  hazardProbability,
} from "@shared/collapse-benchmark";
import { collapseBenchmarksRouter } from "../server/routes/benchmarks.collapse";
import { handleInformationEvent, getTelemetrySnapshot } from "../server/services/star/service";

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/benchmarks/collapse", collapseBenchmarksRouter);
  return app;
};

describe("collapse benchmark (Phase 3): HTTP API", () => {
  it("POST /api/benchmarks/collapse returns a valid CollapseBenchmarkResult (deterministic under asOf)", async () => {
    const app = createApp();
    const asOf = "2025-01-01T00:00:00.000Z";
    const body = {
      schema_version: "collapse_benchmark/1",
      dt_ms: 50,
      tau_ms: 1_000,
      r_c_m: 0.25,
      seed: "deadbeef",
    };

    const res1 = await request(app).post(`/api/benchmarks/collapse?asOf=${encodeURIComponent(asOf)}`).send(body).expect(200);
    const parsed1 = CollapseBenchmarkResult.parse(res1.body);
    expect(parsed1.data_cutoff_iso).toBe(asOf);
    expect(parsed1.information_boundary.data_cutoff_iso).toBe(asOf);

    const res2 = await request(app).post(`/api/benchmarks/collapse?asOf=${encodeURIComponent(asOf)}`).send(body).expect(200);
    expect(res2.body).toEqual(res1.body);
  });

  it("POST /api/benchmarks/collapse rejects missing tau_ms in v1", async () => {
    const app = createApp();
    await request(app)
      .post("/api/benchmarks/collapse")
      .send({ schema_version: "collapse_benchmark/1", dt_ms: 50, r_c_m: 0.25 })
      .expect(400);
  });

  it("POST /api/benchmarks/collapse can derive r_c_m from lattice summary and binds lattice_generation_hash", async () => {
    const app = createApp();
    const asOf = "2025-01-01T00:00:00.000Z";
    const lattice_generation_hash = "lattice:abc123";
    const body = {
      schema_version: "collapse_benchmark/1",
      dt_ms: 50,
      tau_ms: 1_000,
      lattice: {
        lattice_generation_hash,
        dims: [10, 10, 10],
        voxel_size_m: 0.1,
        lattice_size_m: [1, 2, 3],
        coverage: 0.5,
      },
    };

    const res = await request(app)
      .post(`/api/benchmarks/collapse?asOf=${encodeURIComponent(asOf)}`)
      .send(body)
      .expect(200);

    const parsed = CollapseBenchmarkResult.parse(res.body);
    expect(parsed.lattice_generation_hash).toBe(lattice_generation_hash);
    expect(parsed.r_c_source).toBe("geometry");
    expect(parsed.r_c_m).toBeCloseTo(0.5, 12);
    expect(parsed.L_present_m).toBeCloseTo(0.5, 12);
    expect(parsed.kappa_present_m2).toBeCloseTo(4, 12);
  });

  it("POST /api/benchmarks/collapse refuses stale lattice_generation_hash when expected differs", async () => {
    const app = createApp();
    const body = {
      schema_version: "collapse_benchmark/1",
      dt_ms: 50,
      tau_ms: 1_000,
      expected_lattice_generation_hash: "lattice:new",
      lattice: {
        lattice_generation_hash: "lattice:old",
        dims: [10, 10, 10],
        voxel_size_m: 0.1,
      },
    };

    const res = await request(app).post("/api/benchmarks/collapse").send(body).expect(409);
    expect(res.body.error).toBe("stale_lattice_generation_hash");
    expect(res.body.expected).toBe("lattice:new");
    expect(res.body.got).toBe("lattice:old");
  });

  it("POST /api/benchmarks/collapse/explain returns resolved values + hashes", async () => {
    const app = createApp();
    const asOf = "2025-01-01T00:00:00.000Z";
    const body = {
      schema_version: "collapse_benchmark/1",
      dt_ms: 50,
      tau_ms: 1_000,
      r_c_m: 0.25,
    };
    const res = await request(app)
      .post(`/api/benchmarks/collapse/explain?asOf=${encodeURIComponent(asOf)}`)
      .send(body)
      .expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.resolved.tau_ms).toBe(1_000);
    expect(res.body.tau_source).toBe("manual");
    expect(res.body.r_c_source).toBe("manual");
    expect(res.body.data_cutoff_iso).toBe(asOf);
    expect(typeof res.body.inputs_hash).toBe("string");
    expect(res.body.inputs_hash.startsWith("sha256:")).toBe(true);
    expect(typeof res.body.features_hash).toBe("string");
    expect(res.body.features_hash.startsWith("sha256:")).toBe(true);
  });

  it("GET /api/benchmarks/collapse/from-session uses session dp_tau_estimate_ms with manual r_c_m", async () => {
    const app = createApp();
    const session_id = "collapse-session-1";
    const session_type = "debate";
    const timestamp = Date.parse("2025-01-01T00:00:00.000Z");

    handleInformationEvent({
      session_id,
      session_type,
      bytes: 2_048,
      complexity_score: 0.6,
      alignment: 0.1,
      origin: "model",
      timestamp,
    });

    const snapshot = getTelemetrySnapshot(session_id, session_type);
    const tau_ms = snapshot.dp_tau_estimate_ms;
    expect(tau_ms).toBeGreaterThan(0);
    if (tau_ms == null) {
      throw new Error("dp_tau_estimate_ms unavailable for session");
    }

    const dt_ms = 20;
    const r_c_m = 0.4;
    const asOf = "2025-01-02T00:00:00.000Z";

    const res = await request(app)
      .get("/api/benchmarks/collapse/from-session")
      .query({ session_id, session_type, dt_ms, r_c_m, asOf })
      .expect(200);

    const parsed = CollapseBenchmarkResult.parse(res.body);
    expect(parsed.tau_source).toBe("session_dp_tau");
    expect(parsed.tau_ms).toBeCloseTo(tau_ms, 12);
    expect(parsed.p_trigger).toBeCloseTo(hazardProbability(dt_ms, tau_ms), 12);
    expect(parsed.data_cutoff_iso).toBe(asOf);
  });

  it("GET /api/benchmarks/collapse/from-session loads lattice sidecars when r_c_m is omitted", async () => {
    const app = createApp();
    const session_id = "collapse-session-sidecar";
    const session_type = "lab";
    const timestamp = Date.parse("2025-01-01T00:00:00.000Z");

    handleInformationEvent({
      session_id,
      session_type,
      bytes: 1_024,
      complexity_score: 0.55,
      alignment: 0.05,
      origin: "model",
      timestamp,
    });

    const snapshot = getTelemetrySnapshot(session_id, session_type);
    const tau_ms = snapshot.dp_tau_estimate_ms;
    expect(tau_ms).toBeGreaterThan(0);
    if (tau_ms == null) {
      throw new Error("dp_tau_estimate_ms unavailable for session");
    }

    const sidecarPath = path.resolve(process.cwd(), "tests/fixtures/lattice.sidecar.fixture.json");
    const dt_ms = 40;
    const asOf = "2025-01-03T00:00:00.000Z";

    const res = await request(app)
      .get("/api/benchmarks/collapse/from-session")
      .query({
        session_id,
        session_type,
        lattice_sidecar_path: sidecarPath,
        dt_ms,
        expected_lattice_generation_hash: "lattice:sidecar-fixture",
        asOf,
      })
      .expect(200);

    const parsed = CollapseBenchmarkResult.parse(res.body);
    expect(parsed.tau_source).toBe("session_dp_tau");
    expect(parsed.lattice_generation_hash).toBe("lattice:sidecar-fixture");
    expect(parsed.r_c_source).toBe("geometry");
    expect(parsed.r_c_m).toBeCloseTo(0.6, 12); // min axis (1.2 m) / 2
    expect(parsed.p_trigger).toBeCloseTo(hazardProbability(dt_ms, tau_ms), 12);
    expect(parsed.data_cutoff_iso).toBe(asOf);
  });

  it("POST /api/benchmarks/collapse/run is deterministic under fixed seed + asOf", async () => {
    const app = createApp();
    const asOf = "2025-01-01T00:00:00.000Z";
    const steps = 1_000;
    const seed = "deadbeef";
    const dt_ms = 50;
    const tau_ms = 1_000;
    const lattice_generation_hash = "lattice:deadbeef";
    const lattice = {
      lattice_generation_hash,
      dims: [10, 10, 10],
      voxel_size_m: 0.1,
      lattice_size_m: [1, 2, 3],
      coverage: 0.95,
    };
    const histogram_bins = 10;

    const body = { steps, dt_ms, tau_ms, lattice, seed, histogram_bins };
    const res1 = await request(app).post(`/api/benchmarks/collapse/run?asOf=${encodeURIComponent(asOf)}`).send(body).expect(200);
    const res2 = await request(app).post(`/api/benchmarks/collapse/run?asOf=${encodeURIComponent(asOf)}`).send(body).expect(200);
    expect(res2.body).toEqual(res1.body);

    const p = hazardProbability(dt_ms, tau_ms);
    let expectedTriggers = 0;
    for (let i = 0; i < steps; i += 1) {
      if (collapseTriggerDecision(seed, i, p).trigger) expectedTriggers += 1;
    }
    expect(res1.body.p_trigger).toBe(p);
    expect(res1.body.trigger_count).toBe(expectedTriggers);
    expect(res1.body.lattice_generation_hash).toBe(lattice_generation_hash);
    expect(res1.body.r_c_source).toBe("geometry");
    expect(res1.body.r_c_m).toBeCloseTo(0.5, 12);

    const counts: number[] = res1.body.histogram_u?.counts ?? [];
    expect(counts.length).toBe(histogram_bins);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(steps);
    expect(res1.body.trigger_rate).toBeCloseTo(expectedTriggers / steps, 12);
  });
});
