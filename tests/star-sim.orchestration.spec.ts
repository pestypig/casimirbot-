import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type StarSimRouteModule = typeof import("../server/routes/star-sim");
type StarSimJobsModule = typeof import("../server/modules/starsim/jobs");
type StarSimWorkerClientModule = typeof import("../server/modules/starsim/worker/starsim-worker-client");

let artifactRoot = "";

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

beforeEach(() => {
  artifactRoot = fs.mkdtempSync(path.join(os.tmpdir(), "starsim-orchestration-"));
  process.env.STAR_SIM_ARTIFACT_ROOT = artifactRoot;
  process.env.STAR_SIM_SOURCE_FETCH_MODE = "fixture";
  process.env.STAR_SIM_MESA_RUNTIME = "mock";
  process.env.STAR_SIM_GYRE_RUNTIME = "mock";
});

afterEach(async () => {
  const jobsModule: StarSimJobsModule = await import("../server/modules/starsim/jobs");
  const workerClientModule: StarSimWorkerClientModule = await import(
    "../server/modules/starsim/worker/starsim-worker-client"
  );
  await jobsModule.__resetStarSimJobsForTest();
  await workerClientModule.__resetStarSimWorkerForTest();
  delete process.env.STAR_SIM_ARTIFACT_ROOT;
  delete process.env.STAR_SIM_SOURCE_FETCH_MODE;
  delete process.env.STAR_SIM_MESA_RUNTIME;
  delete process.env.STAR_SIM_GYRE_RUNTIME;
  delete process.env.STAR_SIM_GAIA_DR3_MODE;
  delete process.env.STAR_SIM_SDSS_ASTRA_MODE;
  delete process.env.STAR_SIM_LAMOST_DR10_MODE;
  delete process.env.STAR_SIM_TESS_MAST_MODE;
  delete process.env.STAR_SIM_TASOC_MODE;
  fs.rmSync(artifactRoot, { recursive: true, force: true });
  vi.resetModules();
});

describe("star-sim resolve-first orchestration", () => {
  it("goes from identifiers to an enqueued structure job and preserves source provenance in solver artifacts", async () => {
    const app = await buildApp();
    const submit = await request(app)
      .post("/api/star-sim/v1/jobs")
      .send({
        resolve_before_run: true,
        target: {
          name: "Demo Solar A",
        },
        identifiers: {
          gaia_dr3_source_id: "123456789012345678",
        },
        requested_lanes: ["structure_mesa"],
      })
      .expect(202);

    expect(submit.body.job_enqueued).toBe(true);
    expect(submit.body.resolution_stage).toBe("job_enqueued");
    expect(["queued_structure_mesa", "running_structure_mesa"]).toContain(submit.body.stage);
    expect(submit.body.source_resolution_ref).toMatch(/resolve-response\.json$/);
    expect(submit.body.resolved_draft_ref).toMatch(/canonical-request\.json$/);
    expect(submit.body.lane_plan.runnable_lanes).toEqual(["structure_mesa"]);
    expect(["demo_solar_a", "demo_solar_b"]).toContain(submit.body.benchmark_target_id);
    expect(submit.body.benchmark_target_match_mode).toBe("matched_by_identifier");

    await waitForJob(app, submit.body.job_id, "completed");
    const result = await request(app).get(`/api/star-sim/v1/jobs/${submit.body.job_id}/result`).expect(200);
    const structureLane = result.body.lanes.find((lane: { requested_lane: string }) => lane.requested_lane === "structure_mesa");
    expect(structureLane?.status).toBe("available");

    const canonicalRequestRef = structureLane.artifact_refs.find(
      (artifact: { kind: string }) => artifact.kind === "canonical_request",
    )?.path;
    const cachedCanonicalRequest = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), canonicalRequestRef), "utf8"),
    );
    expect(cachedCanonicalRequest.source_context.source_cache_key).toBe(submit.body.source_cache_key);
    expect(cachedCanonicalRequest.source_context.source_resolution_ref).toBe(submit.body.source_resolution_ref);
    expect(cachedCanonicalRequest.source_context.selected_field_origins["spectroscopy.teff_K"]).toBe("sdss_astra");
  });

  it("enqueues structure plus oscillation when the resolved target is fully ready and preserves claim threading", async () => {
    const app = await buildApp();
    const submit = await request(app)
      .post("/api/star-sim/v1/jobs")
      .send({
        resolve_before_run: true,
        target: {
          name: "Demo Solar A",
        },
        identifiers: {
          gaia_dr3_source_id: "123456789012345678",
        },
        requested_lanes: ["structure_mesa", "oscillation_gyre"],
      })
      .expect(202);

    expect(submit.body.lane_plan.runnable_lanes).toEqual(["structure_mesa", "oscillation_gyre"]);
    await waitForJob(app, submit.body.job_id, "completed");

    const result = await request(app).get(`/api/star-sim/v1/jobs/${submit.body.job_id}/result`).expect(200);
    const structureLane = result.body.lanes.find((lane: { requested_lane: string }) => lane.requested_lane === "structure_mesa");
    const oscillationLane = result.body.lanes.find((lane: { requested_lane: string }) => lane.requested_lane === "oscillation_gyre");

    expect(structureLane?.status).toBe("available");
    expect(oscillationLane?.status).toBe("available");
    expect(oscillationLane?.tree_dag.parent_claim_ids).toContain(structureLane?.tree_dag.claim_id);
  });

  it("blocks strict requested-lane orchestration when oscillation inputs are unresolved", async () => {
    const app = await buildApp();
    const blocked = await request(app)
      .post("/api/star-sim/v1/jobs")
      .send({
        resolve_before_run: true,
        target: {
          name: "Demo Solar B",
        },
        identifiers: {
          gaia_dr3_source_id: "987654321098765432",
        },
        requested_lanes: ["structure_mesa", "oscillation_gyre"],
      })
      .expect(200);

    expect(blocked.body.job_enqueued).toBe(false);
    expect(blocked.body.resolution_stage).toBe("preflight_blocked");
    expect(blocked.body.job_id).toBeNull();
    expect(blocked.body.lane_plan.runnable_lanes).toEqual(["structure_mesa"]);
    expect(blocked.body.lane_plan.blocked_lanes).toContain("oscillation_gyre");
    expect(blocked.body.blocked_reasons).toContain("seismology_unresolved");
  });

  it("runs the available prefix when requested and leaves oscillation blocked", async () => {
    const app = await buildApp();
    const submit = await request(app)
      .post("/api/star-sim/v1/jobs")
      .send({
        resolve_before_run: true,
        precondition_policy: "run_available_prefix",
        target: {
          name: "Demo Solar B",
        },
        identifiers: {
          gaia_dr3_source_id: "987654321098765432",
        },
        requested_lanes: ["structure_mesa", "oscillation_gyre"],
      })
      .expect(202);

    expect(submit.body.policy_used).toBe("run_available_prefix");
    expect(submit.body.requested_lanes).toEqual(["structure_mesa", "oscillation_gyre"]);
    expect(submit.body.lane_plan.runnable_lanes).toEqual(["structure_mesa"]);
    expect(["demo_solar_a", "demo_solar_b"]).toContain(submit.body.benchmark_target_id);
    expect(submit.body.lane_plan.blocked_lanes).toEqual(["oscillation_gyre"]);

    await waitForJob(app, submit.body.job_id, "completed");
    const result = await request(app).get(`/api/star-sim/v1/jobs/${submit.body.job_id}/result`).expect(200);
    expect(result.body.solver_plan.requested_lanes).toEqual(["structure_mesa"]);
    expect(result.body.lanes).toHaveLength(1);
    expect(result.body.lanes[0].requested_lane).toBe("structure_mesa");
  });

  it("carries user overrides into the frozen solver draft and changes dedupe identity when source resolution changes", async () => {
    const app = await buildApp();
    const first = await request(app)
      .post("/api/star-sim/v1/jobs")
      .send({
        resolve_before_run: true,
        target: {
          name: "Demo Solar A",
        },
        identifiers: {
          gaia_dr3_source_id: "123456789012345678",
        },
        spectroscopy: {
          teff_K: 5901,
        },
        requested_lanes: ["structure_mesa"],
      })
      .expect(202);

    const frozenRequest = JSON.parse(
      fs.readFileSync(path.join(artifactRoot, "jobs", first.body.job_id, "request.json"), "utf8"),
    );
    expect(frozenRequest.spectroscopy.teff_K).toBe(5901);
    expect(frozenRequest.source_context.selected_field_origins["spectroscopy.teff_K"]).toBe("user_override");

    const second = await request(app)
      .post("/api/star-sim/v1/jobs")
      .send({
        resolve_before_run: true,
        target: {
          name: "Demo Solar A",
        },
        identifiers: {
          gaia_dr3_source_id: "123456789012345678",
        },
        source_hints: {
          preferred_catalogs: ["gaia_dr3", "lamost_dr10", "sdss_astra"],
        },
        requested_lanes: ["structure_mesa"],
      })
      .expect(202);

    expect(first.body.source_cache_key).not.toBe(second.body.source_cache_key);
    expect(first.body.job_id).not.toBe(second.body.job_id);
  });

});
