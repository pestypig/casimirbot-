import { Router } from "express";
import { dispatchRuntimeGoalWakeCandidate } from "../services/helix-ask/runtime-goals/runtime-goal-wake-dispatcher";
import { latestActiveRuntimeGoalSession } from "../services/helix-ask/runtime-goals/runtime-goal-wake-admission";

export const runtimeGoalsRouter = Router();

runtimeGoalsRouter.get("/runtime-goals/active", (_req, res) => {
  const session = latestActiveRuntimeGoalSession();
  res.json({
    ok: true,
    schema: "helix.runtime_goal.active_session_response.v1",
    runtime_goal_session: session,
    active: session !== null,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
});

runtimeGoalsRouter.post("/runtime-goals/wake-candidate", async (req, res) => {
  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body)
    ? req.body as Record<string, unknown>
    : {};
  try {
    const result = await dispatchRuntimeGoalWakeCandidate({
      body,
      headers: req.headers,
      route: "/ask/turn",
    });
    return res.status(result.statusCode).json(result.payload);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "runtime_goal_wake_candidate_failed",
      message: error instanceof Error ? error.message : String(error),
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }
});
