import { Router } from "express";
import type { Request, Response } from "express";
import { resolveHelixWorkstationCapabilityAccess } from "@shared/helix-account-session";
import { THEORY_RUNTIME_RUN_REQUEST_SCOPE_VALUES, type TheoryRuntimeRunRequestScope } from "@shared/contracts/theory-runtime-run-request.v1";
import { getAccountCapabilityPolicy } from "../../services/helix-account/account-session-store";
import { readHelixSessionCookie } from "../../services/helix-account/session-cookie";
import {
  readTheoryRuntimeJob,
  readTheoryRuntimeResult,
  startTheoryRuntimeJob,
} from "../../services/theory/runtime-jobs/runtime-job-service";

export const THEORY_RUNTIME_START_CAPABILITY = "scientific-calculator.run_theory_runtime";
export const THEORY_RUNTIME_READ_CAPABILITY = "scientific-calculator.read_theory_runtime_result";

export const helixTheoryRuntimeRouter = Router();

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim())) : [];

const scope = (value: unknown): TheoryRuntimeRunRequestScope =>
  THEORY_RUNTIME_RUN_REQUEST_SCOPE_VALUES.includes(value as TheoryRuntimeRunRequestScope)
    ? value as TheoryRuntimeRunRequestScope
    : "quick";

async function requireCapability(req: Request, res: Response, capabilityId: string): Promise<boolean> {
  const policy = await getAccountCapabilityPolicy(readHelixSessionCookie(req.headers.cookie));
  const access = resolveHelixWorkstationCapabilityAccess(policy, {
    capability_id: capabilityId,
    permission_profile_required: capabilityId === THEORY_RUNTIME_START_CAPABILITY ? "act" : "read",
  });
  if (access.state === "available") return true;
  res.status(403).json({
    schema: "helix.theory_runtime.account_policy_blocked.v1",
    ok: false,
    error: "account_policy_blocked",
    blocked_reason: access.reason,
    capability_id: capabilityId,
    account_policy: policy,
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  });
  return false;
}

helixTheoryRuntimeRouter.post("/", async (req, res) => {
  if (!(await requireCapability(req, res, THEORY_RUNTIME_START_CAPABILITY))) return;
  const body = record(req.body);
  try {
    const runtimeId = typeof body.runtimeId === "string" ? body.runtimeId.trim() : "";
    const graphId = typeof body.graphId === "string" ? body.graphId.trim() : "";
    const snapshot = await startTheoryRuntimeJob({
      runtimeId,
      graphId,
      badgeIds: strings(body.badgeIds),
      args: record(body.args),
      requestedScope: scope(body.requestedScope),
    });
    return res.status(202).json(snapshot);
  } catch (error) {
    return res.status(400).json({
      error: "theory_runtime_start_rejected",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

helixTheoryRuntimeRouter.get("/:requestId", async (req, res) => {
  if (!(await requireCapability(req, res, THEORY_RUNTIME_READ_CAPABILITY))) return;
  try {
    const snapshot = await readTheoryRuntimeJob({ requestId: req.params.requestId });
    if (!snapshot) return res.status(404).json({ error: "theory_runtime_job_not_found" });
    return res.status(200).json(snapshot);
  } catch (error) {
    return res.status(500).json({
      error: "theory_runtime_status_failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

helixTheoryRuntimeRouter.get("/:requestId/result", async (req, res) => {
  if (!(await requireCapability(req, res, THEORY_RUNTIME_READ_CAPABILITY))) return;
  try {
    const [snapshot, receipt] = await Promise.all([
      readTheoryRuntimeJob({ requestId: req.params.requestId }),
      readTheoryRuntimeResult({ requestId: req.params.requestId }),
    ]);
    if (!snapshot) return res.status(404).json({ error: "theory_runtime_job_not_found" });
    if (!receipt) {
      const terminal = ["completed", "failed", "timeout", "cancelled"].includes(snapshot.request.status);
      return res.status(terminal ? 500 : 409).json({
        error: terminal ? "theory_runtime_receipt_missing" : "theory_runtime_result_not_ready",
        job: snapshot,
      });
    }
    return res.status(200).json({ kind: "theory_runtime_result", job: snapshot, receipt });
  } catch (error) {
    return res.status(500).json({
      error: "theory_runtime_result_failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
