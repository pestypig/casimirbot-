import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type StarSimRouteModule = typeof import("../server/routes/star-sim");
type StarSimJobsModule = typeof import("../server/modules/starsim/jobs");
type StarSimWorkerClientModule = typeof import("../server/modules/starsim/worker/starsim-worker-client");

let artifactRoot = "";

const liveRunnerPath = path.resolve("tests", "fixtures", "starsim", "live-runtime-runner.cjs");

const buildApp = async () => {
  vi.resetModules();
  const routeModule: StarSimRouteModule = await import("../server/routes/star-sim");
  const jobsModule: StarSimJobsModule = await import("../server/modules/starsim/jobs");
  const workerClientModule: StarSimWorkerClientModule = await import(
    "../server/modules/starsim/worker/starsim-worker-client"
  );
  await jobsModule.__resetStarSimJobsForTest();
  await workerClientModule.__resetStarSimWorkerForTest();
  const app = express();
  app.use(express.json());
  app.use("/api/star-sim", routeModule.starSimRouter);
  return app;
};

const waitForJob = async (app: express.Express, jobId: string, expected: string) => {
  for (let i = 0; i < 50; i += 1) {
    const response = await request(app).get(`/api/star-sim/v1/jobs/${jobId}`).expect(200);
    if (response.body?.status === expected) {
      return response.body;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`job ${jobId} did not reach ${expected}`);
};

beforeEach(() => {
  artifactRoot = fs.mkdtempSync(path.join(os.tmpdir(), "starsim-live-"));
  process.env.STAR_SIM_ARTIFACT_ROOT = artifactRoot;
  process.env.STAR_SIM_ENABLE_LIVE_BENCHMARKS = "1";
  process.env.STAR_SIM_MESA_RUNTIME = "wsl";
  process.env.STAR_SIM_GYRE_RUNTIME = "wsl";
  process.env.STAR_SIM_WSL_LAUNCH_MODE = "direct";
  process.env.STAR_SIM_WSL_BIN = process.execPath;
  process.env.STAR_SIM_MESA_COMMAND = liveRunnerPath;
  process.env.STAR_SIM_GYRE_COMMAND = liveRunnerPath;
  process.env.STAR_SIM_WORKER_TIMEOUT_MS = "5000";
});

afterEach(async () => {
  const jobsModule: StarSimJobsModule = await import("../server/modules/starsim/jobs");
  const workerClientModule: StarSimWorkerClientModule = await import(
    "../server/modules/starsim/worker/starsim-worker-client"
  );
  jobsModule.__resetStarSimJobsForTest();
  await workerClientModule.__resetStarSimWorkerForTest();
  delete process.env.STAR_SIM_ARTIFACT_ROOT;
  delete process.env.STAR_SIM_ENABLE_LIVE_BENCHMARKS;
  delete process.env.STAR_SIM_MESA_RUNTIME;
  delete process.env.STAR_SIM_GYRE_RUNTIME;
  delete process.env.STAR_SIM_WSL_LAUNCH_MODE;
  delete process.env.STAR_SIM_WSL_BIN;
  delete process.env.STAR_SIM_MESA_COMMAND;
  delete process.env.STAR_SIM_GYRE_COMMAND;
  delete process.env.STAR_SIM_WORKER_TIMEOUT_MS;
  fs.rmSync(artifactRoot, { recursive: true, force: true });
  vi.resetModules();
});

describe("star-sim live benchmark lanes", () => {
  it("runs a live benchmark structure_mesa job and serves the validated cached artifact", async () => {
    const app = await buildApp();
    const payload = {
      target: {
        object_id: "sun",
        name: "Sun",
        epoch_iso: "2026-01-01T00:00:00.000Z",
      },
      spectroscopy: {
        teff_K: 5772,
        logg_cgs: 4.438,
        metallicity_feh: 0,
      },
      structure: {
        mass_Msun: 1,
        radius_Rsun: 1,
      },
      benchmark_case_id: "simplex_solar_calibration",
      requested_lanes: ["structure_mesa"],
    };

    const submit = await request(app).post("/api/star-sim/v1/jobs").send(payload).expect(202);
    await waitForJob(app, submit.body.job_id, "completed");

    const result = await request(app).get(`/api/star-sim/v1/jobs/${submit.body.job_id}/result`).expect(200);
    const lane = result.body.lanes.find((entry: any) => entry.requested_lane === "structure_mesa");
    expect(lane.status).toBe("available");
    expect(lane.maturity).toBe("research_sim");
    expect(lane.runtime_mode).toBe("wsl");
    expect(lane.result.runtime.live_solver).toBe(true);
    expect(lane.result.runtime.execution_mode).toBe("live_benchmark");
    expect(lane.result.benchmark_case_id).toBe("simplex_solar_calibration");
    expect(lane.benchmark_validation.passed).toBe(true);
    expect(lane.artifact_refs.some((ref: any) => ref.kind === "solver_metadata")).toBe(true);
    expect(lane.artifact_refs.some((ref: any) => ref.kind === "model_artifact")).toBe(true);
    expect(lane.artifact_refs.some((ref: any) => ref.kind === "gsm_placeholder")).toBe(false);
    for (const ref of lane.artifact_refs) {
      expect(fs.existsSync(path.resolve(ref.path))).toBe(true);
    }

    const cached = await request(app).post("/api/star-sim/v1/run").send(payload).expect(200);
    expect(cached.body.lanes[0].status).toBe("available");
    expect(cached.body.lanes[0].cache_key).toBe(lane.cache_key);
    expect(cached.body.lanes[0].benchmark_validation.passed).toBe(true);
  });

  it("runs a live benchmark structure_mesa + oscillation_gyre chain with correct parent threading", async () => {
    const app = await buildApp();
    const payload = {
      target: {
        object_id: "sun",
        name: "Sun",
        epoch_iso: "2026-01-01T00:00:00.000Z",
      },
      spectroscopy: {
        teff_K: 5772,
        logg_cgs: 4.438,
        metallicity_feh: 0,
      },
      structure: {
        mass_Msun: 1,
        radius_Rsun: 1,
      },
      asteroseismology: {
        numax_uHz: 3090,
        deltanu_uHz: 135.1,
        mode_frequencies_uHz: [3090.0, 3160.4, 3232.1],
      },
      benchmark_case_id: "astero_gyre_solar_like",
      requested_lanes: ["structure_mesa", "oscillation_gyre"],
    };

    const submit = await request(app).post("/api/star-sim/v1/jobs").send(payload).expect(202);
    await waitForJob(app, submit.body.job_id, "completed");

    const result = await request(app).get(`/api/star-sim/v1/jobs/${submit.body.job_id}/result`).expect(200);
    const structureLane = result.body.lanes.find((lane: any) => lane.requested_lane === "structure_mesa");
    const oscillationLane = result.body.lanes.find((lane: any) => lane.requested_lane === "oscillation_gyre");

    expect(structureLane.status).toBe("available");
    expect(structureLane.maturity).toBe("research_sim");
    expect(structureLane.phys_class).toBe("P3");
    expect(structureLane.benchmark_validation.passed).toBe(true);
    expect(oscillationLane.status).toBe("available");
    expect(oscillationLane.maturity).toBe("research_sim");
    expect(oscillationLane.result.runtime.live_solver).toBe(true);
    expect(oscillationLane.result.benchmark_case_id).toBe("astero_gyre_solar_like");
    expect(oscillationLane.benchmark_validation.passed).toBe(true);
    expect(oscillationLane.tree_dag.parent_claim_ids).toContain(structureLane.tree_dag.claim_id);
    expect(oscillationLane.result.structure_cache_key).toBe(structureLane.cache_key);
    expect(oscillationLane.result.mode_summary.mode_count).toBe(3);
    expect(oscillationLane.artifact_refs.some((ref: any) => ref.kind === "solver_metadata")).toBe(true);
    expect(oscillationLane.artifact_refs.some((ref: any) => ref.kind === "mode_table")).toBe(true);
  });

  it("rejects unsupported live requests that do not resolve to a benchmark", async () => {
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/run")
      .send({
        target: {
          object_id: "alpha-centauri-a",
          name: "Alpha Centauri A",
          epoch_iso: "2026-01-01T00:00:00.000Z",
        },
        spectroscopy: {
          teff_K: 5790,
          logg_cgs: 4.31,
          metallicity_feh: 0.22,
        },
        structure: {
          mass_Msun: 1.1,
          radius_Rsun: 1.2,
        },
        requested_lanes: ["structure_mesa"],
      })
      .expect(200);

    expect(res.body.lanes[0].status).toBe("unavailable");
    expect(res.body.lanes[0].status_reason).toBe("benchmark_required");
    expect(res.body.lanes[0].runtime_mode).toBe("wsl");
  });

  it("fails live benchmark validation honestly and does not cache the bad result", async () => {
    const app = await buildApp();
    const payload = {
      target: {
        object_id: "sun",
        name: "Sun",
        epoch_iso: "2026-01-01T00:00:00.000Z",
      },
      spectroscopy: {
        teff_K: 5772,
        logg_cgs: 4.438,
        metallicity_feh: 0,
      },
      structure: {
        mass_Msun: 1,
        radius_Rsun: 1,
      },
      benchmark_case_id: "simplex_solar_calibration",
      physics_flags: {
        force_validation_fail: true,
      },
      requested_lanes: ["structure_mesa"],
    };

    const submit = await request(app).post("/api/star-sim/v1/jobs").send(payload).expect(202);
    const failed = await waitForJob(app, submit.body.job_id, "failed");
    expect(failed.status_reason).toBe("lane_execution_error");

    const uncached = await request(app).post("/api/star-sim/v1/run").send(payload).expect(200);
    expect(uncached.body.lanes[0].status).toBe("unavailable");
    expect(uncached.body.lanes[0].status_reason).toBe("async_job_required");
    expect(uncached.body.lanes[0].cache_status).toBe("missing");
  });
});
