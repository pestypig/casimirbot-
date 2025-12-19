import express from "express";
import { CurvatureUnitInput } from "@shared/essence-physics";
import { curvatureUnitHandler } from "../skills/physics.curvature";

export const curvatureRouter = express.Router();

curvatureRouter.post("/unit", async (req, res) => {
  const parsed = CurvatureUnitInput.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
  }

  try {
    const personaId = typeof req.auth?.sub === "string" ? req.auth.sub : "persona:api";
    const result = await curvatureUnitHandler(parsed.data, { personaId });
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: "curvature_unit_failed", message });
  }
});

