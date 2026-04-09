import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STAR_SIM_SOURCE_SELECTION_SCHEMA_VERSION } from "../server/modules/starsim/contract";
import { STAR_SIM_SOURCE_REGISTRY_VERSION } from "../server/modules/starsim/sources/types";

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
  await jobsModule.__resetStarSimJobsForTest();
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
  process.env.STAR_SIM_SOURCE_FETCH_MODE = "fixture";
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
  delete process.env.STAR_SIM_SOURCE_FETCH_MODE;
  delete process.env.STAR_SIM_GAIA_DR3_MODE;
  delete process.env.STAR_SIM_SDSS_ASTRA_MODE;
  delete process.env.STAR_SIM_LAMOST_DR10_MODE;
  delete process.env.STAR_SIM_GAIA_DR3_ENDPOINT;
  delete process.env.STAR_SIM_SDSS_ASTRA_ENDPOINT;
  delete process.env.STAR_SIM_LAMOST_DR10_ENDPOINT;
  delete process.env.STAR_SIM_TESS_MAST_MODE;
  delete process.env.STAR_SIM_TASOC_MODE;
  delete process.env.STAR_SIM_TESS_MAST_ENDPOINT;
  delete process.env.STAR_SIM_TASOC_ENDPOINT;
  delete process.env.STAR_SIM_SOURCE_TIMEOUT_MS;
  delete process.env.STAR_SIM_SOURCE_USER_AGENT;
  delete process.env.STAR_SIM_CACHE_TTL_MS;
  fs.rmSync(artifactRoot, { recursive: true, force: true });
  vi.resetModules();
});

describe("star-sim source-resolution cache", () => {
  it("serves a cached source-resolution result on repeated identical requests", async () => {
    const app = await buildApp();
    const payload = {
      target: {
        name: "Demo Solar A",
      },
      identifiers: {
        gaia_dr3_source_id: "123456789012345678",
      },
    };

    const first = await request(app).post("/api/star-sim/v1/resolve").send(payload).expect(200);
    const second = await request(app).post("/api/star-sim/v1/resolve").send(payload).expect(200);

    expect(first.body.source_resolution.cache_key).toBe(second.body.source_resolution.cache_key);
    expect(first.body.identifiers_resolved).toEqual(second.body.identifiers_resolved);
    expect(second.body.source_resolution.cache_status).toBe("hit");
    expect(second.body.source_resolution.fetch_mode).toBe("cache");
    expect(Array.isArray(second.body.source_resolution.artifact_refs)).toBe(true);
  });

  it("changes the source-resolution cache key when source policy changes", async () => {
    const app = await buildApp();
    const payloadA = {
      target: {
        name: "Demo Solar A",
      },
      identifiers: {
        gaia_dr3_source_id: "123456789012345678",
      },
      spectroscopy: {
        teff_K: 5900,
      },
    };
    const payloadB = {
      ...payloadA,
      source_policy: {
        strict_catalog_resolution: true,
      },
    };

    const [resA, resB] = await Promise.all([
      request(app).post("/api/star-sim/v1/resolve").send(payloadA).expect(200),
      request(app).post("/api/star-sim/v1/resolve").send(payloadB).expect(200),
    ]);

    expect(resA.body.source_resolution.cache_key).not.toBe(resB.body.source_resolution.cache_key);
  });

  it("separates live and fixture source cache namespaces", async () => {
    const fixtureApp = await buildApp();
    const payload = {
      target: {
        name: "Demo Solar A",
      },
      identifiers: {
        gaia_dr3_source_id: "123456789012345678",
      },
    };
    const fixtureRes = await request(fixtureApp).post("/api/star-sim/v1/resolve").send(payload).expect(200);

    process.env.STAR_SIM_SOURCE_FETCH_MODE = "live";
    process.env.STAR_SIM_GAIA_DR3_ENDPOINT = "http://127.0.0.1:9/gaia";
    process.env.STAR_SIM_SDSS_ASTRA_ENDPOINT = "http://127.0.0.1:9/astra";
    process.env.STAR_SIM_LAMOST_DR10_ENDPOINT = "http://127.0.0.1:9/lamost";
    const liveApp = await buildApp();
    const liveRes = await request(liveApp).post("/api/star-sim/v1/resolve").send(payload).expect(200);

    expect(fixtureRes.body.source_resolution.cache_key).not.toBe(liveRes.body.source_resolution.cache_key);
    expect(liveRes.body.source_resolution.fetch_mode).toBe("live");
  });

  it("returns an explicit cache-only miss when no compatible source artifact exists", async () => {
    process.env.STAR_SIM_SOURCE_FETCH_MODE = "cache_only";
    const app = await buildApp();
    const payload = {
      target: {
        name: "Demo Solar A",
      },
      identifiers: {
        gaia_dr3_source_id: "123456789012345678",
      },
    };

    const res = await request(app).post("/api/star-sim/v1/resolve").send(payload).expect(200);

    expect(res.body.source_resolution.status).toBe("unresolved");
    expect(res.body.source_resolution.fetch_mode).toBe("cache_only");
    expect(res.body.source_resolution.reasons).toContain("cache_only_miss");
  });

  it("writes source cache artifacts with the current selection-manifest schema version", async () => {
    const app = await buildApp();
    const payload = {
      target: {
        name: "Demo Solar A",
      },
      identifiers: {
        gaia_dr3_source_id: "123456789012345678",
      },
    };

    const res = await request(app).post("/api/star-sim/v1/resolve").send(payload).expect(200);
    const selectionManifestRef = (res.body.source_resolution.artifact_refs as Array<{ kind: string; path: string }>).find(
      (ref) => ref.kind === "selection_manifest",
    );
    expect(selectionManifestRef).toBeTruthy();

    const selectionManifestPath = path.resolve(selectionManifestRef!.path);
    const selectionManifest = JSON.parse(fs.readFileSync(selectionManifestPath, "utf8"));
    expect(selectionManifest.schema_version).toBe(STAR_SIM_SOURCE_SELECTION_SCHEMA_VERSION);
  });

  it("writes source cache artifacts with the current registry version", async () => {
    const app = await buildApp();
    const payload = {
      target: {
        name: "Demo Solar A",
      },
      identifiers: {
        gaia_dr3_source_id: "123456789012345678",
      },
    };

    const res = await request(app).post("/api/star-sim/v1/resolve").send(payload).expect(200);
    const manifestRef = (res.body.source_resolution.artifact_refs as Array<{ kind: string; path: string }>).find(
      (ref) => ref.kind === "manifest",
    );
    expect(manifestRef).toBeTruthy();

    const manifestPath = path.resolve(manifestRef!.path);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    expect(manifest.registry_version).toBe(STAR_SIM_SOURCE_REGISTRY_VERSION);
  });
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

  it("separates cache namespaces when the runtime mode changes", async () => {
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
    };

    const mockApp = await buildApp();
    const job = await request(mockApp).post("/api/star-sim/v1/jobs").send(payload).expect(202);
    await waitForJob(mockApp, job.body.job_id, "completed");
    const cachedMock = await request(mockApp).post("/api/star-sim/v1/run").send(payload).expect(200);
    const mockLane = cachedMock.body.lanes[0];

    process.env.STAR_SIM_MESA_RUNTIME = "docker";
    const dockerApp = await buildApp();
    const dockerRes = await request(dockerApp).post("/api/star-sim/v1/run").send(payload).expect(200);
    const dockerLane = dockerRes.body.lanes[0];

    expect(dockerLane.cache_key).not.toBe(mockLane.cache_key);
    expect(dockerLane.status).toBe("unavailable");
    expect(dockerLane.status_reason).toBe("solver_unconfigured");
    expect(dockerLane.cache_status).toBe("missing");
    expect(dockerLane.runtime_mode).toBe("docker");
  });

  it("changes the cache key when fit profile or fit constraints change", async () => {
    const app = await buildApp();
    const basePayload = {
      target: {
        object_id: "alpha-centauri-a",
        name: "Alpha Centauri A",
        epoch_iso: "2026-01-01T00:00:00.000Z",
        spectral_type: "G2",
        luminosity_class: "V",
      },
      spectroscopy: {
        teff_K: 5790,
        logg_cgs: 4.31,
        metallicity_feh: 0.22,
      },
      structure: {
        radius_Rsun: 1.22,
      },
      requested_lanes: ["structure_mesa"],
    };

    const variantA = {
      ...basePayload,
      fit_profile_id: "solar_like_observable_fit_v1",
      fit_constraints: {
        mixing_length_alpha_max: 2.05,
      },
    };
    const variantB = {
      ...basePayload,
      fit_profile_id: "solar_like_observable_fit_v2",
      fit_constraints: {
        mixing_length_alpha_max: 1.95,
      },
    };

    const submit = await request(app).post("/api/star-sim/v1/jobs").send(variantA).expect(202);
    await waitForJob(app, submit.body.job_id, "completed");
    const [resA, resB] = await Promise.all([
      request(app).post("/api/star-sim/v1/run").send(variantA).expect(200),
      request(app).post("/api/star-sim/v1/run").send(variantB).expect(200),
    ]);

    expect(resA.body.lanes[0].cache_key).not.toBe(resB.body.lanes[0].cache_key);
  });

  it("treats a corrupt cached artifact as a cache miss instead of valid output", async () => {
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
    };

    const submit = await request(app).post("/api/star-sim/v1/jobs").send(payload).expect(202);
    await waitForJob(app, submit.body.job_id, "completed");

    const cached = await request(app).post("/api/star-sim/v1/run").send(payload).expect(200);
    const summaryRef = cached.body.lanes[0].artifact_refs.find((ref: any) => ref.kind === "mesa_summary");
    fs.writeFileSync(path.resolve(summaryRef.path), "{\n  \"corrupt\": true\n}\n", "utf8");

    const res = await request(app).post("/api/star-sim/v1/run").send(payload).expect(200);
    expect(res.body.lanes[0].status).toBe("unavailable");
    expect(res.body.lanes[0].status_reason).toBe("async_job_required");
    expect(res.body.lanes[0].cache_status).toBe("corrupt");
    expect(res.body.lanes[0].artifact_integrity_status).toBe("corrupt");
  });

  it("treats an expired artifact as stale and requires a new async job", async () => {
    process.env.STAR_SIM_CACHE_TTL_MS = "1";
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
    };

    const submit = await request(app).post("/api/star-sim/v1/jobs").send(payload).expect(202);
    await waitForJob(app, submit.body.job_id, "completed");
    await new Promise((resolve) => setTimeout(resolve, 10));

    const res = await request(app).post("/api/star-sim/v1/run").send(payload).expect(200);
    expect(res.body.lanes[0].status).toBe("unavailable");
    expect(res.body.lanes[0].status_reason).toBe("async_job_required");
    expect(res.body.lanes[0].cache_status).toBe("stale");
    expect(res.body.lanes[0].artifact_integrity_status).toBe("stale");
  });
});
