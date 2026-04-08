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

const buildApp = async () => {
  vi.resetModules();
  const routeModule: StarSimRouteModule = await import("../server/routes/star-sim");
  const jobsModule: StarSimJobsModule = await import("../server/modules/starsim/jobs");
  const workerClientModule: StarSimWorkerClientModule = await import(
    "../server/modules/starsim/worker/starsim-worker-client"
  );
  jobsModule.__resetStarSimJobsForTest();
  await workerClientModule.__resetStarSimWorkerForTest();
  const app = express();
  app.use(express.json());
  app.use("/api/star-sim", routeModule.starSimRouter);
  return app;
};

const waitForJob = async (app: express.Express, jobId: string, expected: string) => {
  for (let i = 0; i < 40; i += 1) {
    const response = await request(app).get(`/api/star-sim/v1/jobs/${jobId}`).expect(200);
    if (response.body?.status === expected) {
      return response.body;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`job ${jobId} did not reach ${expected}`);
};

beforeEach(() => {
  artifactRoot = fs.mkdtempSync(path.join(os.tmpdir(), "starsim-cache-"));
  process.env.STAR_SIM_ARTIFACT_ROOT = artifactRoot;
  process.env.STAR_SIM_MESA_RUNTIME = "mock";
  process.env.STAR_SIM_GYRE_RUNTIME = "mock";
});

afterEach(async () => {
  const jobsModule: StarSimJobsModule = await import("../server/modules/starsim/jobs");
  const workerClientModule: StarSimWorkerClientModule = await import(
    "../server/modules/starsim/worker/starsim-worker-client"
  );
  jobsModule.__resetStarSimJobsForTest();
  await workerClientModule.__resetStarSimWorkerForTest();
  delete process.env.STAR_SIM_ARTIFACT_ROOT;
  delete process.env.STAR_SIM_MESA_RUNTIME;
  delete process.env.STAR_SIM_GYRE_RUNTIME;
  fs.rmSync(artifactRoot, { recursive: true, force: true });
  vi.resetModules();
});

describe("star-sim cache-backed heavy lanes", () => {
  it("returns async_job_required on sync path before cache exists, then serves structure_mesa from cache", async () => {
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
      requested_lanes: ["structure_mesa"],
      strict_lanes: true,
    };

    const uncached = await request(app).post("/api/star-sim/v1/run").send(payload).expect(200);
    expect(uncached.body.lanes[0].status).toBe("unavailable");
    expect(uncached.body.lanes[0].status_reason).toBe("async_job_required");

    const submit = await request(app).post("/api/star-sim/v1/jobs").send(payload).expect(202);
    await waitForJob(app, submit.body.job_id, "completed");

    const cached = await request(app).post("/api/star-sim/v1/run").send(payload).expect(200);
    expect(cached.body.lanes[0].status).toBe("available");
    expect(cached.body.lanes[0].cache_key).toBeTruthy();
    expect(Array.isArray(cached.body.lanes[0].artifact_refs)).toBe(true);
    expect(fs.existsSync(path.resolve(cached.body.lanes[0].artifact_refs[0].path))).toBe(true);
  });

  it("keeps the heavy-lane cache key deterministic under JSON field reordering", async () => {
    const app = await buildApp();
    const payloadA = {
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
      requested_lanes: ["structure_mesa"],
    };
    const payloadB = {
      requested_lanes: ["structure_mesa"],
      structure: {
        radius_Rsun: 1,
        mass_Msun: 1,
      },
      spectroscopy: {
        metallicity_feh: 0,
        logg_cgs: 4.438,
        teff_K: 5772,
      },
      target: {
        name: "Sun",
        epoch_iso: "2026-01-01T00:00:00.000Z",
        object_id: "sun",
      },
    };

    const submit = await request(app).post("/api/star-sim/v1/jobs").send(payloadA).expect(202);
    await waitForJob(app, submit.body.job_id, "completed");

    const [resA, resB] = await Promise.all([
      request(app).post("/api/star-sim/v1/run").send(payloadA).expect(200),
      request(app).post("/api/star-sim/v1/run").send(payloadB).expect(200),
    ]);

    expect(resA.body.meta.deterministic_request_hash).toBe(resB.body.meta.deterministic_request_hash);
    expect(resA.body.meta.canonical_observables_hash).toBe(resB.body.meta.canonical_observables_hash);
    expect(resA.body.lanes[0].cache_key).toBe(resB.body.lanes[0].cache_key);
    expect(resA.body.lanes[0].artifact_refs).toEqual(resB.body.lanes[0].artifact_refs);
  });
});
