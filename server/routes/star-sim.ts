import { Router } from "express";
import { starSimRequestSchema } from "../modules/starsim/contract";
import { getStarSimJob, getStarSimJobResult, submitStarSimJob, submitStarSimJobWithMeta } from "../modules/starsim/jobs";
import {
  buildResolveBeforeRunEnqueuedResponse,
  prepareStarSimResolveBeforeRun,
} from "../modules/starsim/orchestration";
import { runStarSim } from "../modules/starsim/solver-registry";
import { resolveStarSimSources } from "../modules/starsim/sources/registry";

export const starSimRouter = Router();

starSimRouter.post("/v1/resolve", async (req, res) => {
  const parsed = starSimRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "star_sim_invalid_request",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await resolveStarSimSources(parsed.data);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: "star_sim_source_resolution_failed",
      message,
    });
  }
});

starSimRouter.post("/v1/run", async (req, res) => {
  const parsed = starSimRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "star_sim_invalid_request",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await runStarSim(parsed.data, { executionMode: "sync" });
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: "star_sim_failed",
      message,
    });
  }
});

starSimRouter.post("/v1/jobs", async (req, res) => {
  const parsed = starSimRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "star_sim_invalid_request",
      details: parsed.error.flatten(),
    });
  }

  if (parsed.data.resolve_before_run) {
    try {
      const orchestration = await prepareStarSimResolveBeforeRun(parsed.data);
      if (orchestration.status === "blocked") {
        return res.status(200).json(orchestration.response);
      }

      const job = await submitStarSimJobWithMeta(orchestration.frozen_request, {
        requested_lanes_original: orchestration.response.preflight.requested_lanes,
        precondition_policy: orchestration.job_meta.precondition_policy,
        resolved_draft_hash: orchestration.job_meta.resolved_draft_hash,
        resolved_draft_ref: orchestration.job_meta.resolved_draft_ref,
        source_resolution_ref: orchestration.job_meta.source_resolution_ref,
        source_cache_key: orchestration.job_meta.source_cache_key,
        lane_plan: orchestration.job_meta.lane_plan,
      });
      return res.status(202).json(buildResolveBeforeRunEnqueuedResponse({
        base: orchestration.response,
        job,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({
        error: "star_sim_resolve_before_run_failed",
        message,
      });
    }
  }

  const job = await submitStarSimJob(parsed.data);
  return res.status(202).json({
    ...job,
    result_url: `/api/star-sim/v1/jobs/${job.job_id}/result`,
  });
});

starSimRouter.get("/v1/jobs/:jobId", async (req, res) => {
  const job = await getStarSimJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({
      error: "star_sim_job_not_found",
    });
  }
  return res.json({
    ...job,
    result_url: `/api/star-sim/v1/jobs/${job.job_id}/result`,
  });
});

starSimRouter.get("/v1/jobs/:jobId/result", async (req, res) => {
  const job = await getStarSimJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({
      error: "star_sim_job_not_found",
    });
  }
  if (job.status !== "completed") {
    return res.status(409).json({
      error: "star_sim_job_not_ready",
      status: job.status,
    });
  }

  const result = await getStarSimJobResult(job.job_id);
  if (!result) {
    return res.status(500).json({
      error: "star_sim_job_result_missing",
    });
  }
  return res.json(result);
});
