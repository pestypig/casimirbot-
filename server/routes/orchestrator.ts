import express from "express";
import { HELIX_PLAN_VERSION } from "@shared/helix-plan";
import { requestSurfacePlan, SurfacePlannerError } from "../services/orchestrator.js";

export const orchestratorRouter = express.Router();

orchestratorRouter.post("/interpret", async (req, res) => {
  const { utterance, state, schemaVersion } = req.body ?? {};

  try {
    const result = await requestSurfacePlan({
      utterance,
      state,
      schemaVersion,
    });

    const responsePayload = {
      plan_id: result.planId,
      schema_version: HELIX_PLAN_VERSION,
      model: result.model,
      token_estimate: result.tokenEstimate,
      plan: result.plan,
    };

    res.json(responsePayload);
  } catch (error) {
    if (error instanceof SurfacePlannerError) {
      return res.status(error.status).json({ error: error.message });
    }
    const message = error instanceof Error ? error.message : "Unexpected surface planner error.";
    return res.status(500).json({ error: message });
  }
});
