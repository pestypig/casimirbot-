import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";
import type {
  RepoConvergenceTelemetry,
  ToolUseBudgetTelemetry,
  ConstraintPackMetricMap,
} from "./constraint-pack-evaluator.js";

export type AutoTelemetryResult<T> = {
  telemetry?: T;
  notes: string[];
};

type TelemetrySourceInput = {
  telemetryPath?: string;
  junitPath?: string;
  env?: NodeJS.ProcessEnv;
};

const DEFAULT_MAX_BYTES = 5_000_000;

const parseMaxBytes = (): number => {
  const raw = Number(process.env.CONSTRAINT_PACK_TELEMETRY_MAX_BYTES ?? DEFAULT_MAX_BYTES);
  if (!Number.isFinite(raw) || raw < 10_000) {
    return DEFAULT_MAX_BYTES;
  }
  return Math.floor(raw);
};

const MAX_BYTES = parseMaxBytes();
const XML = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

const normalizeEnv = (env?: NodeJS.ProcessEnv): NodeJS.ProcessEnv =>
  env ?? process.env;

const resolveSafePath = (input?: string): string | null => {
  if (!input) return null;
  const cwd = path.resolve(process.cwd());
  const resolved = path.resolve(cwd, input);
  const relative = path.relative(cwd, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  if (!fs.existsSync(resolved)) {
    return null;
  }
  return resolved;
};

const readFileSafe = async (filePath: string): Promise<string | null> => {
  try {
    const stat = await fsPromises.stat(filePath);
    if (!stat.isFile()) return null;
    if (stat.size > MAX_BYTES) return null;
    return await fsPromises.readFile(filePath, "utf8");
  } catch {
    return null;
  }
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const toBooleanMetric = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (["1", "true", "yes", "pass", "ok", "success"].includes(lowered)) {
      return true;
    }
    if (["0", "false", "no", "fail", "failed", "error"].includes(lowered)) {
      return false;
    }
  }
  return undefined;
};

const readEnvNumber = (env: NodeJS.ProcessEnv, key: string): number | undefined =>
  toNumber(env[key]);

const readEnvBool = (env: NodeJS.ProcessEnv, key: string): boolean | undefined =>
  toBooleanMetric(env[key]);

const readEnvJson = (env: NodeJS.ProcessEnv, key: string): Record<string, unknown> | undefined => {
  const raw = env[key];
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return undefined;
  }
  return undefined;
};

const mergeRepoTelemetry = (
  base?: RepoConvergenceTelemetry,
  override?: RepoConvergenceTelemetry,
): RepoConvergenceTelemetry | undefined => {
  if (!base && !override) return undefined;
  const merged: RepoConvergenceTelemetry = {
    ...(base ?? {}),
    ...(override ?? {}),
  };
  if (base?.build || override?.build) {
    merged.build = { ...(base?.build ?? {}), ...(override?.build ?? {}) };
  }
  if (base?.tests || override?.tests) {
    merged.tests = { ...(base?.tests ?? {}), ...(override?.tests ?? {}) };
  }
  if (base?.schema || override?.schema) {
    merged.schema = { ...(base?.schema ?? {}), ...(override?.schema ?? {}) };
  }
  if (base?.deps || override?.deps) {
    merged.deps = { ...(base?.deps ?? {}), ...(override?.deps ?? {}) };
  }
  if (base?.lint || override?.lint) {
    merged.lint = { ...(base?.lint ?? {}), ...(override?.lint ?? {}) };
  }
  if (base?.typecheck || override?.typecheck) {
    merged.typecheck = { ...(base?.typecheck ?? {}), ...(override?.typecheck ?? {}) };
  }
  if (base?.metrics || override?.metrics) {
    merged.metrics = { ...(base?.metrics ?? {}), ...(override?.metrics ?? {}) };
  }
  return merged;
};

const mergeToolTelemetry = (
  base?: ToolUseBudgetTelemetry,
  override?: ToolUseBudgetTelemetry,
): ToolUseBudgetTelemetry | undefined => {
  if (!base && !override) return undefined;
  const merged: ToolUseBudgetTelemetry = {
    ...(base ?? {}),
    ...(override ?? {}),
  };
  if (base?.steps || override?.steps) {
    merged.steps = { ...(base?.steps ?? {}), ...(override?.steps ?? {}) };
  }
  if (base?.cost || override?.cost) {
    merged.cost = { ...(base?.cost ?? {}), ...(override?.cost ?? {}) };
  }
  if (base?.ops || override?.ops) {
    merged.ops = { ...(base?.ops ?? {}), ...(override?.ops ?? {}) };
  }
  if (base?.provenance || override?.provenance) {
    merged.provenance = { ...(base?.provenance ?? {}), ...(override?.provenance ?? {}) };
  }
  if (base?.runtime || override?.runtime) {
    merged.runtime = { ...(base?.runtime ?? {}), ...(override?.runtime ?? {}) };
  }
  if (base?.tools || override?.tools) {
    merged.tools = { ...(base?.tools ?? {}), ...(override?.tools ?? {}) };
  }
  if (base?.metrics || override?.metrics) {
    merged.metrics = { ...(base?.metrics ?? {}), ...(override?.metrics ?? {}) };
  }
  return merged;
};

const pickTelemetryPath = (
  env: NodeJS.ProcessEnv,
  explicit?: string,
  envKey?: string,
): string | null => {
  const candidate = explicit ?? env[envKey ?? ""] ?? env.CASIMIR_TELEMETRY_PATH;
  const resolved = resolveSafePath(candidate);
  return resolved;
};

const pickJUnitPath = (
  env: NodeJS.ProcessEnv,
  explicit?: string,
): string | null => {
  const candidate = explicit ?? env.CASIMIR_TEST_JUNIT_PATH ?? env.JUNIT_PATH;
  const resolved = resolveSafePath(candidate);
  return resolved;
};

const parseMetricMap = (raw?: Record<string, unknown>): ConstraintPackMetricMap | undefined => {
  if (!raw) return undefined;
  const out: ConstraintPackMetricMap = {};
  for (const [key, value] of Object.entries(raw)) {
    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "string" ||
      value === null
    ) {
      out[key] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
};

type JunitTotals = {
  tests: number;
  failures: number;
  errors: number;
  skipped: number;
  timeSeconds?: number;
};

const readJunitTotals = (node: unknown): JunitTotals | null => {
  if (!node || typeof node !== "object") return null;
  const obj = node as Record<string, unknown>;
  const tests = toNumber(obj.tests);
  const failures = toNumber(obj.failures) ?? 0;
  const errors = toNumber(obj.errors) ?? 0;
  const skipped = toNumber(obj.skipped) ?? 0;
  const timeSeconds = toNumber(obj.time);
  if (tests === undefined) return null;
  return {
    tests,
    failures,
    errors,
    skipped,
    timeSeconds,
  };
};

const sumTotals = (totals: JunitTotals[]): JunitTotals => {
  return totals.reduce(
    (acc, entry) => ({
      tests: acc.tests + entry.tests,
      failures: acc.failures + entry.failures,
      errors: acc.errors + entry.errors,
      skipped: acc.skipped + entry.skipped,
      timeSeconds:
        acc.timeSeconds !== undefined || entry.timeSeconds !== undefined
          ? (acc.timeSeconds ?? 0) + (entry.timeSeconds ?? 0)
          : undefined,
    }),
    { tests: 0, failures: 0, errors: 0, skipped: 0, timeSeconds: undefined },
  );
};

const parseJUnitSummary = (xml: string): JunitTotals | null => {
  try {
    const parsed = XML.parse(xml);
    const root = parsed.testsuites ?? parsed.testsuite;
    if (!root) return null;
    if (Array.isArray(root)) {
      const totals = root.map(readJunitTotals).filter((entry): entry is JunitTotals => !!entry);
      return totals.length ? sumTotals(totals) : null;
    }
    if (root.testsuite && Array.isArray(root.testsuite)) {
      const totals = root.testsuite
        .map(readJunitTotals)
        .filter((entry): entry is JunitTotals => !!entry);
      return totals.length ? sumTotals(totals) : null;
    }
    const direct = readJunitTotals(root);
    return direct ?? null;
  } catch {
    return null;
  }
};

const loadRepoTelemetryFromEnv = (env: NodeJS.ProcessEnv): RepoConvergenceTelemetry => {
  const buildStatus = env.CASIMIR_BUILD_STATUS ?? env.CASIMIR_BUILD_OK;
  const buildExitCode = readEnvNumber(env, "CASIMIR_BUILD_EXIT_CODE");
  const buildDuration = readEnvNumber(env, "CASIMIR_BUILD_DURATION_MS");

  const testStatus = env.CASIMIR_TEST_STATUS ?? env.CASIMIR_TEST_OK;
  const testsFailed = readEnvNumber(env, "CASIMIR_TEST_FAILED");
  const testsPassed = readEnvNumber(env, "CASIMIR_TEST_PASSED");
  const testsTotal = readEnvNumber(env, "CASIMIR_TEST_TOTAL");

  const schemaContracts = env.CASIMIR_SCHEMA_CONTRACTS ?? env.CASIMIR_SCHEMA_OK;
  const depsCoherence = env.CASIMIR_DEPS_COHERENCE;

  const lintStatus = env.CASIMIR_LINT_STATUS;
  const typecheckStatus = env.CASIMIR_TYPECHECK_STATUS;
  const timeToGreenMs = readEnvNumber(env, "CASIMIR_TIME_TO_GREEN_MS");

  const metrics = parseMetricMap(readEnvJson(env, "CASIMIR_REPO_METRICS_JSON"));

  const telemetry: RepoConvergenceTelemetry = {};
  if (
    buildStatus !== undefined ||
    buildExitCode !== undefined ||
    buildDuration !== undefined
  ) {
    telemetry.build = {
      status: buildStatus,
      ok: toBooleanMetric(buildStatus),
      exitCode: buildExitCode,
      durationMs: buildDuration,
    };
  }
  if (testStatus !== undefined || testsFailed !== undefined || testsPassed !== undefined || testsTotal !== undefined) {
    telemetry.tests = {
      status: testStatus,
      ok: toBooleanMetric(testStatus),
      failed: testsFailed,
      passed: testsPassed,
      total: testsTotal,
    };
  }
  if (schemaContracts !== undefined) {
    telemetry.schema = {
      contracts: schemaContracts,
      ok: toBooleanMetric(schemaContracts),
    };
  }
  if (depsCoherence !== undefined) {
    telemetry.deps = {
      coherence: depsCoherence,
    };
  }
  if (lintStatus !== undefined) {
    telemetry.lint = { status: lintStatus };
  }
  if (typecheckStatus !== undefined) {
    telemetry.typecheck = { status: typecheckStatus };
  }
  if (timeToGreenMs !== undefined) {
    telemetry.timeToGreenMs = timeToGreenMs;
  }
  if (metrics) {
    telemetry.metrics = metrics;
  }
  return telemetry;
};

const loadToolTelemetryFromEnv = (env: NodeJS.ProcessEnv): ToolUseBudgetTelemetry => {
  const stepsUsed = readEnvNumber(env, "CASIMIR_STEPS_USED");
  const stepsTotal = readEnvNumber(env, "CASIMIR_STEPS_TOTAL");
  const costUsd = readEnvNumber(env, "CASIMIR_COST_USD");
  const forbiddenOps = readEnvNumber(env, "CASIMIR_OPS_FORBIDDEN");
  const approvalMissing = readEnvNumber(env, "CASIMIR_OPS_APPROVAL_MISSING");
  const provenanceMissing = readEnvNumber(env, "CASIMIR_PROVENANCE_MISSING");
  const runtimeMs = readEnvNumber(env, "CASIMIR_RUNTIME_MS");
  const toolCalls = readEnvNumber(env, "CASIMIR_TOOL_CALLS");
  const toolTotal = readEnvNumber(env, "CASIMIR_TOOL_TOTAL");
  const metrics = parseMetricMap(readEnvJson(env, "CASIMIR_TOOL_METRICS_JSON"));

  const telemetry: ToolUseBudgetTelemetry = {};
  if (stepsUsed !== undefined || stepsTotal !== undefined) {
    telemetry.steps = { used: stepsUsed, total: stepsTotal };
  }
  if (costUsd !== undefined) {
    telemetry.cost = { usd: costUsd };
  }
  if (forbiddenOps !== undefined || approvalMissing !== undefined) {
    telemetry.ops = {
      forbidden: forbiddenOps,
      approvalMissing,
    };
  }
  if (provenanceMissing !== undefined) {
    telemetry.provenance = { missing: provenanceMissing };
  }
  if (runtimeMs !== undefined) {
    telemetry.runtime = { ms: runtimeMs };
  }
  if (toolCalls !== undefined || toolTotal !== undefined) {
    telemetry.tools = { calls: toolCalls, total: toolTotal };
  }
  if (metrics) {
    telemetry.metrics = metrics;
  }
  return telemetry;
};

const hasTelemetryFields = (telemetry?: Record<string, unknown>): boolean =>
  !!telemetry && Object.keys(telemetry).length > 0;

const parseRepoTelemetryJson = (
  value: Record<string, unknown>,
): RepoConvergenceTelemetry => {
  if (value.repo && typeof value.repo === "object") {
    return value.repo as RepoConvergenceTelemetry;
  }
  return value as RepoConvergenceTelemetry;
};

const parseToolTelemetryJson = (
  value: Record<string, unknown>,
): ToolUseBudgetTelemetry => {
  if (value.tool && typeof value.tool === "object") {
    return value.tool as ToolUseBudgetTelemetry;
  }
  return value as ToolUseBudgetTelemetry;
};

export const collectRepoConvergenceTelemetry = async (
  input: TelemetrySourceInput & { explicit?: RepoConvergenceTelemetry },
): Promise<AutoTelemetryResult<RepoConvergenceTelemetry>> => {
  const env = normalizeEnv(input.env);
  const notes: string[] = [];
  let autoTelemetry: RepoConvergenceTelemetry | undefined;

  const telemetryPath = pickTelemetryPath(env, input.telemetryPath, "CASIMIR_REPO_TELEMETRY_PATH");
  if (telemetryPath) {
    const raw = await readFileSafe(telemetryPath);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          autoTelemetry = mergeRepoTelemetry(autoTelemetry, parseRepoTelemetryJson(parsed as Record<string, unknown>));
          notes.push(`telemetry_source=json:${path.relative(process.cwd(), telemetryPath)}`);
        }
      } catch {
        // ignore parse failures
      }
    }
  }

  const junitPath = pickJUnitPath(env, input.junitPath);
  if (junitPath) {
    const raw = await readFileSafe(junitPath);
    if (raw) {
      const totals = parseJUnitSummary(raw);
      if (totals) {
        const failed = totals.failures + totals.errors;
        const passed = Math.max(0, totals.tests - failed - totals.skipped);
        const junitTelemetry: RepoConvergenceTelemetry = {
          tests: {
            failed,
            passed,
            total: totals.tests,
            status: failed > 0 ? "fail" : "pass",
          },
        };
        autoTelemetry = mergeRepoTelemetry(autoTelemetry, junitTelemetry);
        notes.push(`telemetry_source=junit:${path.relative(process.cwd(), junitPath)}`);
      }
    }
  }

  const envTelemetry = loadRepoTelemetryFromEnv(env);
  if (hasTelemetryFields(envTelemetry)) {
    autoTelemetry = mergeRepoTelemetry(autoTelemetry, envTelemetry);
    notes.push("telemetry_source=env");
  }

  const merged = mergeRepoTelemetry(autoTelemetry, input.explicit);
  if (!merged) {
    return { telemetry: input.explicit, notes };
  }
  return { telemetry: merged, notes };
};

export const collectToolUseBudgetTelemetry = async (
  input: TelemetrySourceInput & { explicit?: ToolUseBudgetTelemetry },
): Promise<AutoTelemetryResult<ToolUseBudgetTelemetry>> => {
  const env = normalizeEnv(input.env);
  const notes: string[] = [];
  let autoTelemetry: ToolUseBudgetTelemetry | undefined;

  const telemetryPath = pickTelemetryPath(env, input.telemetryPath, "CASIMIR_TOOL_TELEMETRY_PATH");
  if (telemetryPath) {
    const raw = await readFileSafe(telemetryPath);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          autoTelemetry = mergeToolTelemetry(autoTelemetry, parseToolTelemetryJson(parsed as Record<string, unknown>));
          notes.push(`telemetry_source=json:${path.relative(process.cwd(), telemetryPath)}`);
        }
      } catch {
        // ignore parse failures
      }
    }
  }

  const envTelemetry = loadToolTelemetryFromEnv(env);
  if (hasTelemetryFields(envTelemetry)) {
    autoTelemetry = mergeToolTelemetry(autoTelemetry, envTelemetry);
    notes.push("telemetry_source=env");
  }

  const merged = mergeToolTelemetry(autoTelemetry, input.explicit);
  if (!merged) {
    return { telemetry: input.explicit, notes };
  }
  return { telemetry: merged, notes };
};

export const isAutoTelemetryEnabled = (env?: NodeJS.ProcessEnv): boolean => {
  const value = normalizeEnv(env).CASIMIR_AUTO_TELEMETRY;
  return value === "1" || value === "true";
};
