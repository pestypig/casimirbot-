import { Router } from "express";
import { starSimRequestSchema } from "../modules/starsim/contract";
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
    const result = await runStarSim(parsed.data);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: "star_sim_failed",
      message,
    });
  }
});
