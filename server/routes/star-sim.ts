import { Router } from "express";
import { starSimRequestSchema } from "../modules/starsim/contract";
import { getStarSimJob, getStarSimJobResult, submitStarSimJob } from "../modules/starsim/jobs";
import { runStarSim } from "../modules/starsim/solver-registry";

export const starSimRouter = Router();

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

  const job = submitStarSimJob(parsed.data);
  return res.status(202).json({
    ...job,
    result_url: `/api/star-sim/v1/jobs/${job.job_id}/result`,
  });
});

starSimRouter.get("/v1/jobs/:jobId", (req, res) => {
  const job = getStarSimJob(req.params.jobId);
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
  const job = getStarSimJob(req.params.jobId);
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
