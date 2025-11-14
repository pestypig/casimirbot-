import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";

export const ethosRouter = Router();

ethosRouter.get("/ideology", async (_req, res) => {
  try {
    const filePath = path.resolve("docs/ethos/ideology.json");
    const payload = await fs.readFile(filePath, "utf8");
    res.setHeader("Content-Type", "application/json");
    res.send(payload);
  } catch (err) {
    res.status(404).json({
      message: "ideology.json not found",
      error: err instanceof Error ? err.message : String(err)
    });
  }
});
