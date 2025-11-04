import type { HelixPlan, HelixPlanAction } from "@shared/helix-plan";

export type PlanActionStatus = "applied" | "skipped" | "error";

export interface PlanActionResult {
  action: HelixPlanAction;
  status: PlanActionStatus;
  detail?: string;
}

export interface PlanExecutionRecord {
  planId: string;
  executedAt: number;
  results: PlanActionResult[];
}

export interface ExecutePlanOptions {
  dryRun?: boolean;
  requireConfirmation?: (action: Extract<HelixPlanAction, { op: "move_bubble" }>) => Promise<boolean> | boolean;
  broadcast?: boolean;
}

const executedPlans = new Set<string>();
const PLAN_LOG_KEY = "helix:plan-log:v1";
const PLAN_LOG_LIMIT = 50;
const channel =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel("helix-exec")
    : null;

export function readPlanLog(): PlanExecutionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PLAN_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => sanitizeRecord(entry))
      .filter((entry): entry is PlanExecutionRecord => entry != null);
  } catch (err) {
    console.warn("[helix-plan] failed to parse plan log", err);
    return [];
  }
}

export function clearPlanLog() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PLAN_LOG_KEY);
}

function sanitizeRecord(entry: unknown): PlanExecutionRecord | null {
  if (!entry || typeof entry !== "object") return null;
  const scoped = entry as Record<string, unknown>;
  const planId = typeof scoped.planId === "string" ? scoped.planId : null;
  const executedAt = typeof scoped.executedAt === "number" ? scoped.executedAt : null;
  const results = Array.isArray(scoped.results)
    ? scoped.results
        .map((raw) => {
          if (!raw || typeof raw !== "object") return null;
          const { action, status, detail } = raw as PlanActionResult;
          if (!action || typeof action !== "object") return null;
          if (status !== "applied" && status !== "skipped" && status !== "error") {
            return null;
          }
          return {
            action,
            status,
            detail: typeof detail === "string" ? detail : undefined,
          } satisfies PlanActionResult;
        })
        .filter(Boolean) as PlanActionResult[]
    : [];
  if (!planId || !executedAt || results.length === 0) return null;
  return { planId, executedAt, results };
}

function persistRecord(record: PlanExecutionRecord) {
  if (typeof window === "undefined") return;
  try {
    const existing = readPlanLog();
    const next = [record, ...existing].slice(0, PLAN_LOG_LIMIT);
    window.localStorage.setItem(PLAN_LOG_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn("[helix-plan] failed to persist plan record", err);
  }
}

export async function executeHelixPlan(
  planId: string,
  plan: HelixPlan,
  options: ExecutePlanOptions = {},
): Promise<PlanExecutionRecord> {
  if (!planId) {
    throw new Error("planId required");
  }
  if (executedPlans.has(planId)) {
    return {
      planId,
      executedAt: Date.now(),
      results: plan.actions.map((action) => ({
        action,
        status: "skipped",
        detail: "duplicate plan id - skipped",
      })),
    };
  }

  executedPlans.add(planId);

  const results: PlanActionResult[] = [];
  for (const action of plan.actions) {
    const result = await executeAction(action, options);
    results.push(result);
  }

  const record: PlanExecutionRecord = {
    planId,
    executedAt: Date.now(),
    results,
  };

  persistRecord(record);
  if (options.broadcast !== false) {
    channel?.postMessage(record);
  }

  return record;
}

async function executeAction(
  action: HelixPlanAction,
  options: ExecutePlanOptions,
): Promise<PlanActionResult> {
  if (action.op === "move_bubble" && action.confirm) {
    const confirmed = await maybeConfirm(action, options);
    if (!confirmed) {
      return {
        action,
        status: "skipped",
        detail: "move_bubble requires user confirmation",
      };
    }
  }

  // TODO: Wire into actual control surfaces (HCE + Helix pipeline).
  return {
    action,
    status: "skipped",
    detail: "executor not yet connected to control surface",
  };
}

async function maybeConfirm(
  action: Extract<HelixPlanAction, { op: "move_bubble" }>,
  options: ExecutePlanOptions,
) {
  if (!options.requireConfirmation) return false;
  try {
    const result = await options.requireConfirmation(action);
    return result === true;
  } catch (err) {
    console.warn("[helix-plan] confirm hook threw:", err);
    return false;
  }
}
