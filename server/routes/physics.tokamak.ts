import express from "express";
import { TokamakSimCommandInput } from "@shared/tokamak-sim";
import { commandTokamakSimulation, getTokamakSimState } from "../services/physics/tokamak-sim";

const tokamakRouter = express.Router();

tokamakRouter.get("/sim", (_req, res) => {
  res.json(getTokamakSimState());
});

tokamakRouter.post("/command", async (req, res) => {
  try {
    const command = TokamakSimCommandInput.parse(req.body ?? {});
    const state = await commandTokamakSimulation(command);
    res.json(state);
  } catch (err) {
    res.status(400).json({
      message: err instanceof Error ? err.message : "invalid_tokamak_command",
    });
  }
});

export { tokamakRouter };
