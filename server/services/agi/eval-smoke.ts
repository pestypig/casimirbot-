import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_TASKS_FILE = "tests/evals/tasks.smoke.json";
const REQUIRED_FEATURE_FLAGS = [
  { key: "ENABLE_AGI", expected: "1" },
  { key: "ENABLE_ESSENCE", expected: "1" },
];
const REQUIRED_ADAPTER_ENVS = ["LLM_HTTP_BASE", "DIFF_HTTP_URL", "WHISPER_HTTP_URL"];

type SmokeEvalEnv = NodeJS.ProcessEnv;

export type SmokeEvalOptions = {
  baseUrl?: string;
  tasksFile?: string;
  env?: SmokeEvalEnv;
  fetchImpl?: typeof fetch;
  successTarget?: number;
};

export type SmokeEvalResult = {
  ok: number;
  total: number;
  rate: number;
  skipped: boolean;
  reason?: string;
  target: number;
};

const normalizeBase = (value?: string): string => {
  const trimmed = value?.trim();
  if (!trimmed) return DEFAULT_BASE_URL;
  return trimmed;
};

let sharedFetch: typeof fetch | null = typeof globalThis.fetch === "function" ? globalThis.fetch : null;
async function ensureFetch(custom?: typeof fetch): Promise<typeof fetch> {
  if (custom) {
    return custom;
  }
  if (sharedFetch) {
    return sharedFetch;
  }
  const mod = await import("node-fetch");
  sharedFetch = (mod.default ?? mod) as unknown as typeof fetch;
  return sharedFetch;
}

const shouldSkipEval = (env: SmokeEvalEnv): { skip: boolean; reason?: string } => {
  const missingFlags = REQUIRED_FEATURE_FLAGS.filter(
    ({ key, expected }) => (env[key] ?? "").trim() !== expected,
  ).map(({ key }) => key);
  const missingAdapters = REQUIRED_ADAPTER_ENVS.filter((key) => !(env[key]?.trim()));
  if (missingFlags.length || missingAdapters.length) {
    const reason = [
      missingFlags.length ? `features:${missingFlags.join(",")}` : null,
      missingAdapters.length ? `adapters:${missingAdapters.join(",")}` : null,
    ]
      .filter(Boolean)
      .join(" ");
    return { skip: true, reason };
  }
  return { skip: false };
};

async function runOne(goal: string, baseUrl: string, fetchFn: typeof fetch): Promise<boolean> {
  try {
    const planRes = await fetchFn(`${baseUrl}/api/agi/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal }),
    });
    if (!planRes.ok) {
      throw new Error(`plan_request_failed:${planRes.status}`);
    }
    const planJson: any = await planRes.json();
    const traceId = planJson?.traceId;
    if (!traceId) {
      throw new Error("missing_trace_id");
    }
    const execRes = await fetchFn(`${baseUrl}/api/agi/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ traceId }),
    });
    if (!execRes.ok) {
      throw new Error(`execute_request_failed:${execRes.status}`);
    }
    const execJson: any = await execRes.json();
    return Boolean(execJson?.ok);
  } catch (error) {
    console.error("[eval] task failed:", goal, error);
    return false;
  }
}

export async function runSmokeEval(options: SmokeEvalOptions = {}): Promise<SmokeEvalResult> {
  const env = options.env ?? process.env;
  const { skip, reason } = shouldSkipEval(env);
  const target = options.successTarget ?? Number(env.EVAL_SUCCESS_TARGET ?? 0.7);
  const baseUrl = normalizeBase(options.baseUrl ?? env.EVAL_BASE_URL ?? DEFAULT_BASE_URL);
  const tasksPath = path.resolve(process.cwd(), options.tasksFile ?? env.EVAL_TASKS_FILE ?? DEFAULT_TASKS_FILE);

  if (skip) {
    return { ok: 0, total: 0, rate: 0, skipped: true, reason, target };
  }

  const fetchFn = await ensureFetch(options.fetchImpl);
  const raw = await fs.readFile(tasksPath, "utf8");
  const tasks = JSON.parse(raw) as Array<{ goal: string }>;
  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw new Error("No eval tasks defined");
  }

  let success = 0;
  for (const task of tasks) {
    if (await runOne(task.goal, baseUrl.replace(/\/+$/, ""), fetchFn)) {
      success += 1;
    }
  }
  const rate = tasks.length ? success / tasks.length : 0;
  return {
    ok: success,
    total: tasks.length,
    rate: Number(rate.toFixed(2)),
    skipped: false,
    target,
  };
}

export async function pingMetricsEndpoint(baseUrl?: string): Promise<void> {
  const target = normalizeBase(baseUrl);
  try {
    const fetchFn = await ensureFetch();
    const url = `${target.replace(/\/+$/, "")}/metrics`;
    await fetchFn(url, { method: "HEAD" });
  } catch {
    // optional best-effort ping
  }
}
