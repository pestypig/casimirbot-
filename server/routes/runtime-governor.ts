import { Router } from "express";
import { runtimeMemoryGovernor } from "../services/runtime/runtime-memory-governor";

export const runtimeGovernorRouter = Router();

runtimeGovernorRouter.get("/memory", (_req, res) => {
  if (String(process.env.RUNTIME_MEMORY_STATUS_ENABLED ?? "1").trim() === "0") {
    return res.status(404).json({
      ok: false,
      error: "runtime_memory_status_disabled",
    });
  }
  return res.status(200).json({
    ok: true,
    ...runtimeMemoryGovernor.getRuntimeMemorySnapshot(),
  });
});

runtimeGovernorRouter.get("/tasks", (_req, res) => {
  if (String(process.env.RUNTIME_MEMORY_STATUS_ENABLED ?? "1").trim() === "0") {
    return res.status(404).json({
      ok: false,
      error: "runtime_task_status_disabled",
    });
  }
  return res.status(200).json({
    ok: true,
    ...runtimeMemoryGovernor.getRuntimeTaskSnapshot(),
  });
});
