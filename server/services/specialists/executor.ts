import { createHash, randomUUID } from "node:crypto";
import {
  ProblemStatement,
  SolverInput,
  SolverOutput,
  VerifierInput,
  CheckResult,
  RepairAction,
  type TProblemStatement,
  type TSolverOutput,
  type TCheckResult,
} from "@shared/agi-specialists";
import { getSolver } from "../../specialists/solvers";
import { getVerifier } from "../../specialists/verifiers";
import { appendToolLog } from "../observability/tool-log-store";
import { metrics, recordTaskOutcome } from "../../metrics";

export type SpecialistPlan = {
  solver: string;
  verifier?: string;
  params?: Record<string, unknown>;
  repair?: boolean;
};

export type SpecialistContext = {
  personaId?: string;
  traceId?: string;
  stepId?: string;
};

export type SpecialistRunResult = {
  ok: boolean;
  started_at: string;
  ended_at: string;
  solver_output: TSolverOutput;
  check: TCheckResult;
  repaired: boolean;
  problem: TProblemStatement;
};

const toBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }
  if (value === "1" || value === "true") {
    return true;
  }
  if (value === "0" || value === "false") {
    return false;
  }
  return fallback;
};

export async function runSpecialistPlan(
  plan: SpecialistPlan,
  problemInput: unknown,
  ctx: SpecialistContext = {},
): Promise<SpecialistRunResult> {
  ensureSpecialistsEnabled();

  const maxLatencyMs = Number(process.env.SPECIALISTS_MAX_LATENCY_MS ?? 120_000);
  const personaId = ctx.personaId ?? process.env.SPECIALISTS_DEFAULT_PERSONA ?? "persona:demo";
  const traceId = ctx.traceId ?? randomUUID();
  const stepId = ctx.stepId;
  const problem = ProblemStatement.parse(problemInput);
  const started = Date.now();
  const startedAt = new Date(started).toISOString();

  const solverResult = await invokeSolver(plan, problem, personaId, traceId, 0, stepId);
  let checkResult: TCheckResult = CheckResult.parse({ ok: true, reason: "no verifier" });

  if (plan.verifier) {
    checkResult = await invokeVerifier(plan.verifier, problem, solverResult, personaId, traceId, "initial", stepId);
  }

  let ok = checkResult.ok;
  let repaired = false;
  const maxRepair = Math.max(0, Number(process.env.SPECIALISTS_MAX_REPAIR ?? 1));
  const repairEnabled = plan.repair ?? toBoolean(process.env.SPECIALISTS_ENABLE_REPAIR, true);
  let repairAttempts = 0;

  while (!ok && repairEnabled && repairAttempts < maxRepair) {
    repairAttempts += 1;
    repaired = true;
    metrics.incrementSpecialistRepair();
    const repairHint = RepairAction.parse({
      suggested_params: {},
      note: checkResult.reason ?? "repair_requested",
    });
    const nextParams = {
      ...(plan.params ?? {}),
      repair_hint: repairHint.note,
      repair_attempt: repairAttempts,
    };
    const retryResult = await invokeSolver(
      { ...plan, params: nextParams },
      problem,
      personaId,
      traceId,
      repairAttempts,
      stepId,
    );
    Object.assign(solverResult, retryResult);
    if (plan.verifier) {
      checkResult = await invokeVerifier(plan.verifier, problem, solverResult, personaId, traceId, "repair", stepId);
      ok = checkResult.ok;
      if (ok) {
        break;
      }
    } else {
      ok = true;
    }
  }

  const endedAt = new Date().toISOString();
  recordTaskOutcome(ok);
  const latency = Date.now() - started;
  if (Number.isFinite(maxLatencyMs) && maxLatencyMs > 0 && latency > maxLatencyMs) {
    appendToolLog({
      tool: `solver:${plan.solver}`,
      version: "1.0.0",
      paramsHash: hashPayload({ goal: problem.goal, solver: plan.solver }),
      durationMs: latency,
      traceId,
      stepId,
      ok: false,
      error: `specialist_budget_exceeded>${latency}ms`,
      text: `[warn] ${plan.solver} exceeded budget ${maxLatencyMs}ms`,
    });
  }

  return {
    ok,
    started_at: startedAt,
    ended_at: endedAt,
    solver_output: solverResult,
    check: checkResult,
    repaired,
    problem,
  };
}

export async function runVerifierOnly(
  verifierName: string,
  problem: TProblemStatement,
  solverOutput: TSolverOutput,
  ctx: SpecialistContext = {},
): Promise<TCheckResult> {
  ensureSpecialistsEnabled();
  const personaId = ctx.personaId ?? process.env.SPECIALISTS_DEFAULT_PERSONA ?? "persona:demo";
  const traceId = ctx.traceId ?? randomUUID();
  return invokeVerifier(verifierName, problem, solverOutput, personaId, traceId, "standalone", ctx.stepId);
}

async function invokeSolver(
  plan: SpecialistPlan,
  problem: TProblemStatement,
  personaId: string,
  traceId: string,
  attempt = 0,
  stepId?: string,
): Promise<TSolverOutput> {
  const solver = getSolver(plan.solver);
  if (!solver) {
    throw new Error(`unknown solver ${plan.solver}`);
  }
  const solverInput = SolverInput.parse({
    problem,
    params: plan.params ?? {},
  });

  const start = Date.now();
  let error: unknown;
  let output: TSolverOutput | undefined;
  try {
    output = await solver.handler(solverInput, { personaId, traceId });
    metrics.recordSpecialistSolver(plan.solver, true);
    return SolverOutput.parse(output);
  } catch (err) {
    error = err;
    metrics.recordSpecialistSolver(plan.solver, false);
    throw err;
  } finally {
    appendToolLog({
      tool: `solver:${plan.solver}`,
      version: "1.0.0",
      paramsHash: hashPayload({ params: solverInput.params, attempt }),
      durationMs: Date.now() - start,
      traceId,
      stepId,
      ok: !error,
      error: error ? serializeError(error) : undefined,
      essenceId: output?.essence_ids?.[0],
      text: error
        ? `[err] solver ${plan.solver}: ${serializeError(error)}`
        : `[ok] solver ${plan.solver} total=${(output?.data as any)?.total ?? "n/a"}`,
    });
  }
}

async function invokeVerifier(
  verifierName: string,
  problem: TProblemStatement,
  solverOutput: TSolverOutput,
  personaId: string,
  traceId: string,
  phase: "initial" | "repair" | "standalone",
  stepId?: string,
): Promise<TCheckResult> {
  const verifier = getVerifier(verifierName);
  if (!verifier) {
    throw new Error(`unknown verifier ${verifierName}`);
  }
  const input = VerifierInput.parse({
    problem,
    solver_output: solverOutput,
  });
  const start = Date.now();
  let result: TCheckResult | undefined;
  let error: unknown;
  try {
    const raw = await verifier.handler(input, { personaId, traceId, phase });
    result = CheckResult.parse(raw);
    metrics.recordSpecialistVerifier(verifierName, result.ok);
    return result;
  } catch (err) {
    error = err;
    metrics.recordSpecialistVerifier(verifierName, false);
    throw err;
  } finally {
    appendToolLog({
      tool: `verifier:${verifierName}`,
      version: "1.0.0",
      paramsHash: hashPayload({ verifierName, phase }),
      durationMs: Date.now() - start,
      traceId,
      stepId,
      ok: !error && !!result?.ok,
      error: error ? serializeError(error) : result && !result.ok ? result.reason : undefined,
      essenceId: solverOutput.essence_ids?.[0],
      text: error
        ? `[err] verifier ${verifierName}: ${serializeError(error)}`
        : `[${result?.ok ? "ok" : "err"}] verifier ${verifierName} ${result?.reason ?? ""}`.trim(),
    });
  }
}

function ensureSpecialistsEnabled(): void {
  if (process.env.ENABLE_SPECIALISTS !== "1") {
    throw new Error("specialists_disabled");
  }
}

const hashPayload = (payload: unknown): string => {
  try {
    return createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 16);
  } catch {
    return "hash_error";
  }
};

const serializeError = (err: unknown): string => {
  if (err instanceof Error) {
    return err.message || err.name;
  }
  if (typeof err === "string") {
    return err;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
};
