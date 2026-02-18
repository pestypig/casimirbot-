import fs from "node:fs/promises";
import path from "node:path";
import { spawn, execFile } from "node:child_process";

type PromptFamily = "relation" | "repo_technical" | "ambiguous_general";

type PromptCase = {
  id: string;
  family: PromptFamily;
  question: string;
  expected_intent_id?: string;
  expected_report_mode?: boolean;
  min_text_chars?: number;
};

type AskDebug = Record<string, unknown> & {
  intent_id?: string;
  intent_strategy?: string;
  report_mode?: boolean;
  relation_packet_built?: boolean;
  relation_dual_domain_ok?: boolean;
  relation_packet_bridge_count?: number;
  relation_packet_evidence_count?: number;
  live_events?: Array<Record<string, unknown>>;
  deterministic_fallback_used_relation?: boolean;
  contract_parse_fail_rate_relation?: number;
  citation_repair?: boolean;
  answer_contract_primary_applied?: boolean;
  answer_contract_applied?: boolean;
  answer_token_budget?: number;
  stage_timing_ms?: Record<string, number>;
  timeline?: Array<Record<string, unknown>>;
  answer_path?: string[];
};

type AskPayload = {
  text?: string;
  report_mode?: boolean;
  debug?: AskDebug;
  error?: string;
  message?: string;
  retryAfterMs?: number;
};

type RawRun = {
  run_id: string;
  prompt_id: string;
  family: PromptFamily;
  question: string;
  seed: number;
  temperature: number;
  status: number;
  latency_ms: number;
  timestamp: string;
  expected_intent_id?: string;
  expected_report_mode?: boolean;
  response_text: string;
  debug: AskDebug | null;
  failures: string[];
  attempts?: number;
  stop_reason?: string;
  attempt_trace?: Array<{
    attempt: number;
    status: number;
    latency_ms: number;
    retry_after_ms: number;
    error?: string;
    message?: string;
  }>;
};

type FailureRecord = {
  key: string;
  count: number;
};

type GitProvenance = {
  branch: string | null;
  head: string | null;
  originMain: string | null;
  aheadBehind: string | null;
  hasOriginRemote: boolean;
  hasMainBranch: boolean;
};

const BASE_URL = process.env.HELIX_ASK_BASE_URL ?? "http://127.0.0.1:5173";
const OUT_DIR = process.env.HELIX_ASK_VERSATILITY_OUT ?? "artifacts/experiments/helix-ask-versatility";
const REPORT_PATH = process.env.HELIX_ASK_VERSATILITY_REPORT ?? "reports/helix-ask-versatility-report.md";
const ISOLATE_RUN_DIR = (process.env.HELIX_ASK_VERSATILITY_ISOLATE_RUN_DIR ?? "1") !== "0";
const RESUME_FROM_LATEST = (process.env.HELIX_ASK_VERSATILITY_RESUME_FROM_LATEST ?? "1") !== "0";
const FAIL_ON_INCOMPLETE = (process.env.HELIX_ASK_VERSATILITY_FAIL_ON_INCOMPLETE ?? "1") !== "0";
const SEEDS = (process.env.HELIX_ASK_VERSATILITY_SEEDS ?? "7,11,13")
  .split(",")
  .map((entry) => Number(entry.trim()))
  .filter((entry) => Number.isFinite(entry));
const TEMPS = (process.env.HELIX_ASK_VERSATILITY_TEMPS ?? "0.2")
  .split(",")
  .map((entry) => Number(entry.trim()))
  .filter((entry) => Number.isFinite(entry));
const START_SERVER = (process.env.HELIX_ASK_VERSATILITY_START_SERVER ?? "0") === "1";
const SERVER_COMMAND = process.env.HELIX_ASK_VERSATILITY_SERVER_CMD ?? "npm";
const SERVER_ARGS =
  process.env.HELIX_ASK_VERSATILITY_SERVER_ARGS?.split(/\s+/).filter(Boolean) ?? ["run", "dev:agi:5173"];
const REQUEST_TIMEOUT_MS = Number(process.env.HELIX_ASK_VERSATILITY_TIMEOUT_MS ?? 15000);
const MIN_TEXT_CHARS = Number(process.env.HELIX_ASK_VERSATILITY_MIN_TEXT_CHARS ?? 220);
const MAX_RETRIES = Math.max(0, Number(process.env.HELIX_ASK_VERSATILITY_MAX_RETRIES ?? 3));
const RETRY_BASE_MS = Math.max(100, Number(process.env.HELIX_ASK_VERSATILITY_RETRY_BASE_MS ?? 900));
const RETRY_MAX_MS = Math.max(RETRY_BASE_MS, Number(process.env.HELIX_ASK_VERSATILITY_RETRY_MAX_MS ?? 12000));
const RETRY_AFTER_CAP_MS = Math.max(250, Number(process.env.HELIX_ASK_VERSATILITY_RETRY_AFTER_CAP_MS ?? 5000));
const RETRY_STUB = (process.env.HELIX_ASK_VERSATILITY_RETRY_STUB ?? "1") !== "0";
const MAX_CASE_WALL_MS = Math.max(
  REQUEST_TIMEOUT_MS,
  Number(process.env.HELIX_ASK_VERSATILITY_MAX_CASE_WALL_MS ?? 25000),
);
const MAX_RUN_MS = Math.max(0, Number(process.env.HELIX_ASK_VERSATILITY_MAX_RUN_MS ?? 0));
const CHECKPOINT_EVERY = Math.max(1, Number(process.env.HELIX_ASK_VERSATILITY_CHECKPOINT_EVERY ?? 10));
const CIRCUIT_OPEN_MAX_RETRIES = Math.max(
  0,
  Number(process.env.HELIX_ASK_VERSATILITY_CIRCUIT_OPEN_MAX_RETRIES ?? 1),
);
const CIRCUIT_OPEN_RETRY_AFTER_CUTOFF_MS = Math.max(
  0,
  Number(process.env.HELIX_ASK_VERSATILITY_CIRCUIT_OPEN_RETRY_AFTER_CUTOFF_MS ?? 8000),
);
const GLOBAL_COOLDOWN_ON_CIRCUIT = (process.env.HELIX_ASK_VERSATILITY_GLOBAL_COOLDOWN_ON_CIRCUIT ?? "1") !== "0";
const GLOBAL_COOLDOWN_CAP_MS = Math.max(
  0,
  Number(process.env.HELIX_ASK_VERSATILITY_GLOBAL_COOLDOWN_CAP_MS ?? 30000),
);
const STUB_RE = /llm\.local stub result/i;
const REPORT_SECTION_RE = /(Executive summary:|Coverage map:|Point-by-point:|Report covers)/i;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const runCaseKey = (promptId: string, seed: number, temperature: number): string =>
  `${promptId}::s${seed}::t${temperature}`;
const execGit = async (args: string[]): Promise<string | null> =>
  new Promise((resolve) => {
    execFile("git", args, { cwd: process.cwd(), timeout: 3000 }, (error, stdout) => {
      if (error) {
        resolve(null);
        return;
      }
      const text = String(stdout ?? "").trim();
      resolve(text.length ? text : null);
    });
  });

const execGitOk = async (args: string[]): Promise<boolean> =>
  new Promise((resolve) => {
    execFile("git", args, { cwd: process.cwd(), timeout: 3000 }, (error) => {
      resolve(!error);
    });
  });

const collectGitProvenance = async (): Promise<GitProvenance> => {
  const [branch, head, originMain, remoteText] = await Promise.all([
    execGit(["branch", "--show-current"]),
    execGit(["rev-parse", "--short", "HEAD"]),
    execGit(["rev-parse", "--short", "origin/main"]),
    execGit(["remote"]),
  ]);
  const hasOriginRemote = Boolean(remoteText?.split(/\r?\n/).map((v) => v.trim()).filter(Boolean).includes("origin"));
  const hasMainBranch = await execGitOk(["show-ref", "--verify", "--quiet", "refs/heads/main"]);
  const aheadBehind = originMain && head ? await execGit(["rev-list", "--left-right", "--count", "origin/main...HEAD"]) : null;
  return {
    branch,
    head,
    originMain,
    aheadBehind,
    hasOriginRemote,
    hasMainBranch,
  };
};

const readJsonFile = async <T>(filePath: string): Promise<T | null> => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const sleepInterruptible = async (ms: number, shouldStop: () => boolean): Promise<void> => {
  let remaining = Math.max(0, Math.floor(ms));
  while (remaining > 0) {
    if (shouldStop()) return;
    const slice = Math.min(250, remaining);
    await sleep(slice);
    remaining -= slice;
  }
};

const loadExistingRawRunMap = async (runOutDir: string): Promise<Map<string, RawRun>> => {
  const rawDir = path.resolve(runOutDir, "raw");
  const map = new Map<string, RawRun>();
  let files: string[] = [];
  try {
    files = await fs.readdir(rawDir);
  } catch {
    return map;
  }
  for (const name of files) {
    if (!name.toLowerCase().endsWith(".json")) continue;
    const record = await readJsonFile<RawRun>(path.resolve(rawDir, name));
    if (!record || !record.prompt_id || !Number.isFinite(record.seed) || !Number.isFinite(record.temperature)) {
      continue;
    }
    const key = runCaseKey(record.prompt_id, record.seed, record.temperature);
    const previous = map.get(key);
    if (!previous) {
      map.set(key, record);
      continue;
    }
    const prevTs = Date.parse(previous.timestamp || "");
    const nextTs = Date.parse(record.timestamp || "");
    if (Number.isFinite(nextTs) && (!Number.isFinite(prevTs) || nextTs >= prevTs)) {
      map.set(key, record);
    }
  }
  return map;
};

const ensureServerReady = async (timeoutMs = 120000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(new URL("/api/ready", BASE_URL), { cache: "no-store" });
      if (response.status === 200) {
        const payload = (await response.json().catch(() => null)) as { ready?: boolean } | null;
        if (!payload || payload.ready !== false) return;
      }
    } catch {
      // retry
    }
    await sleep(1000);
  }
  throw new Error(`server not ready at ${BASE_URL}`);
};

const startServer = async () => {
  const child = spawn(SERVER_COMMAND, SERVER_ARGS, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (chunk) => process.stdout.write(`[versatility:server] ${chunk}`));
  child.stderr?.on("data", (chunk) => process.stderr.write(`[versatility:server:err] ${chunk}`));
  await ensureServerReady();
  return child;
};

const stopServer = async (child: ReturnType<typeof spawn>) => {
  if (child.killed) return;
  child.kill("SIGINT");
  await new Promise<void>((resolve) => {
    child.once("exit", () => resolve());
    setTimeout(() => {
      if (!child.killed) child.kill("SIGKILL");
      resolve();
    }, 10000);
  });
};

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

const clampSessionId = (value: string): string => value.slice(0, 120);
const RETRYABLE_STATUS = new Set([0, 408, 429, 500, 502, 503, 504]);

const isCircuitOpenPayload = (payload: AskPayload): boolean => {
  const error = String(payload.error ?? "").toLowerCase();
  const message = String(payload.message ?? "").toLowerCase();
  if (error === "helix_ask_temporarily_unavailable") return true;
  return (
    message.includes("circuit") ||
    message.includes("temporarily unavailable") ||
    message.includes("cooldown")
  );
};

const writeCheckpoint = async (outDir: string, runId: string, rows: RawRun[]) => {
  const checkpoint = {
    run_id: runId,
    timestamp: new Date().toISOString(),
    completed_runs: rows.length,
    status_counts: rows.reduce<Record<string, number>>((acc, row) => {
      const key = String(row.status);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
    stop_reasons: rows.reduce<Record<string, number>>((acc, row) => {
      const key = row.stop_reason ?? "done";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  };
  await fs.writeFile(path.resolve(outDir, "checkpoint.json"), `${JSON.stringify(checkpoint, null, 2)}\n`, "utf8");
};

const circuitRetryAfterFromRawRun = (row: RawRun): number => {
  const trace = row.attempt_trace ?? [];
  if (!trace.length) return 0;
  const latest = trace[trace.length - 1];
  if (!latest) return 0;
  const error = String(latest.error ?? "").toLowerCase();
  const message = String(latest.message ?? "").toLowerCase();
  const isCircuit =
    error === "helix_ask_temporarily_unavailable" ||
    message.includes("circuit") ||
    message.includes("temporarily unavailable");
  if (!isCircuit) return 0;
  return Math.max(0, latest.retry_after_ms ?? 0);
};

const makeRelationPrompts = (): PromptCase[] => {
  const base = [
    "How does a warp bubble fit in with the mission ethos?",
    "Explain the relation between warp bubble physics and mission ethos in this repo.",
    "Warp bubble ↔ ideology relation: what is the bridge?",
    "How do we connect Natario warp bubble constraints to mission ethics?",
    "What's the relationship between warp bubble viability and ideology tree commitments?",
    "Relate warp bubble design gates to mission ethos safeguards.",
    "how warp bubble connected to mission ethos?",
    "warp buble relation to ideology mission ethos",
    "Quick: warp bubble vs mission ethos — connected or separate?",
    "Define warp bubble, define mission ethos, then connect them.",
    "In one clear narrative: why does mission ethos matter for warp bubble claims?",
    "How does the ideology tree constrain warp-bubble deployment decisions?",
    "Bridge warp physics evidence to ethos stewardship without report mode.",
    "What ties warp bubble verification to ethos non-harm policy?",
    "Explain warp bubble + mission ethos for a skeptical engineer.",
    "How is the warp bubble a technical layer while mission ethos is policy layer?",
    "relation of warp bubble and mission ethos now",
    "warp/ethos relation prompt test: explain links and guardrails",
    "How do certificate integrity and mission ethos cohere for warp bubble work?",
    "How does Casimir verification connect to ideology accountability in warp work?",
    "Need concise relation: warp bubble, mission ethos, evidence.",
    "Which shared constraints bind warp bubble engineering to ideology values?",
    "Compare and connect warp bubble viability gates with mission ethos gates.",
    "Could warp bubble progress violate mission ethos? How is that prevented?",
    "From docs perspective, how do warp bubble files and ethos files relate?",
    "Give a practical relation map from warp bubble model to mission ethos decisions.",
    "How does relation-mode answer tie warp bubble to ideology without report scaffolding?",
    "mission ethos + warp bubble, what's the dependency chain?",
    "Tell me the warp bubble relation to mission ethos in plain language.",
    "If warp bubble is capability, how does ethos govern its use?",
  ];
  return base.map((question, index) => ({
    id: `relation_${String(index + 1).padStart(2, "0")}_${slug(question)}`,
    family: "relation",
    question,
    expected_intent_id: "hybrid.warp_ethos_relation",
    expected_report_mode: false,
    min_text_chars: MIN_TEXT_CHARS,
  }));
};

const makeRepoTechnicalPrompts = (): PromptCase[] => {
  const base = [
    "Walk through /api/agi/ask routing from intent detection to final answer cleanup.",
    "How does Helix Ask choose report mode vs hybrid explain mode?",
    "Where are relation packet fields built and surfaced in debug payload?",
    "Explain evidence gate flow and where citation repair is applied.",
    "How does deterministic fallback guard relation-mode contract parse failures?",
    "Describe how answer contract primary and field repair work in sequence.",
    "How are ambiguity gates triggered and what clarify output is produced?",
    "What does /api/agi/adapter/run return for PASS/FAIL and certificate data?",
    "Explain training-trace export path and expected payload behavior.",
    "How do topic tags influence intent directory routing for helix ask?",
    "Show pipeline stages captured in debug live events for Helix Ask.",
    "Where is relation topology dual-domain detection implemented?",
    "How does goal-zone harness evaluate pass/fail across seeds?",
    "What determines relation_packet_bridge_count and evidence_count?",
    "How does the system prevent report-scaffold responses for relation prompts?",
    "Where are citation allowlists normalized before sanitizeSourcesLine?",
    "Explain retrieval confidence and deterministic contract signal thresholds.",
    "How does fast quality mode alter answer generation deadlines?",
    "What are top fallback reasons emitted in debug for helix ask failures?",
    "How are source paths extracted from evidence text and context?",
    "Explain relation-assembly fallback rendering shape and intended usage.",
    "Where is helix ask intent directory mapping for warp+ethos relation?",
    "How does arbiter_mode get selected for repo vs hybrid asks?",
    "What files are considered high-signal for mission ethos reference intents?",
    "How does report_mode_reason get set and propagated to debug?",
    "Explain how answer_path is populated and useful for diagnostics.",
    "Where are claim coverage metrics computed and used as gates?",
    "How is platonic gate scoring attached to final response debug?",
    "What checks enforce presence of citations in repo/hybrid responses?",
    "Describe the interaction between relation query detection and graph resolver.",
  ];
  return base.map((question, index) => ({
    id: `repo_tech_${String(index + 1).padStart(2, "0")}_${slug(question)}`,
    family: "repo_technical",
    question,
    expected_report_mode: false,
    min_text_chars: MIN_TEXT_CHARS,
  }));
};

const makeAmbiguousPrompts = (): PromptCase[] => {
  const base = [
    "Define lattice.",
    "What's a cavity?",
    "Explain resonance in simple terms.",
    "What is stability?",
    "How should I think about uncertainty?",
    "Help me compare precision and recall quickly.",
    "How do constraints help decision making?",
    "What's a good way to summarize evidence?",
    "Can you explain system integrity for non-experts?",
    "What is model drift?",
    "How do I ask better technical questions?",
    "What's a clean way to structure a short answer?",
    "How do I avoid overclaiming from weak data?",
    "What does falsifiable mean in practice?",
    "Difference between hypothesis and verified claim?",
    "How can ambiguity be reduced in prompts?",
    "When should I request citations?",
    "Explain feedback loops without jargon.",
    "What makes a good guardrail?",
    "How do I triage failures quickly?",
    "Give me a concise explanation of verification.",
    "How can teams avoid report-mode spam in assistants?",
    "What is a practical debug payload used for?",
    "How should I read latency percentiles?",
    "When is deterministic fallback preferable?",
    "How do seeds help evaluation reliability?",
    "What's a robust pass criterion for prompts?",
    "How can I identify high-impact failure categories?",
    "Explain why short prompts can confuse routing.",
    "What's the difference between routing and assembly?",
  ];
  return base.map((question, index) => ({
    id: `ambiguous_${String(index + 1).padStart(2, "0")}_${slug(question)}`,
    family: "ambiguous_general",
    question,
    expected_report_mode: false,
    min_text_chars: MIN_TEXT_CHARS,
  }));
};

const allPrompts = (): PromptCase[] => [
  ...makeRelationPrompts(),
  ...makeRepoTechnicalPrompts(),
  ...makeAmbiguousPrompts(),
];

const askOnce = async (entry: PromptCase, seed: number, temperature: number, runId: string) => {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(new URL("/api/agi/ask", BASE_URL), {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        question: entry.question,
        debug: true,
        seed,
        temperature,
        verbosity: "extended",
        sessionId: clampSessionId(`versatility:${runId}:${entry.id}:s${seed}:t${temperature}`),
      }),
    });
    clearTimeout(timeout);
    const latencyMs = Date.now() - started;
    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? ((await response.json()) as AskPayload)
      : ({ text: await response.text() } as AskPayload);
    return { status: response.status, latency_ms: latencyMs, payload };
  } catch (error) {
    clearTimeout(timeout);
    return {
      status: 0,
      latency_ms: Date.now() - started,
      payload: { text: error instanceof Error ? error.message : String(error) } as AskPayload,
    };
  }
};

const shouldRetryResponse = (
  response: Awaited<ReturnType<typeof askOnce>>,
  entry: PromptCase,
): boolean => {
  if (isCircuitOpenPayload(response.payload)) return true;
  if (RETRYABLE_STATUS.has(response.status)) return true;
  const text = String(response.payload.text ?? "");
  if (RETRY_STUB && STUB_RE.test(text) && entry.family !== "ambiguous_general") {
    return true;
  }
  return false;
};

const retryDelayMs = (
  response: Awaited<ReturnType<typeof askOnce>>,
  attempt: number,
): number => {
  const requestedRetry = Math.min(RETRY_AFTER_CAP_MS, Math.max(0, toNum(response.payload.retryAfterMs, 0)));
  const backoff = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * Math.max(1, 2 ** attempt));
  return Math.max(requestedRetry, backoff);
};

const askWithRetry = async (
  entry: PromptCase,
  seed: number,
  temperature: number,
  runId: string,
  shouldAbort?: () => boolean,
) => {
  const begin = Date.now();
  let attempts = 0;
  let stopReason = "done";
  let circuitOpenRetries = 0;
  const attemptTrace: NonNullable<RawRun["attempt_trace"]> = [];
  let response = await askOnce(entry, seed, temperature, runId);
  attempts += 1;
  attemptTrace.push({
    attempt: attempts,
    status: response.status,
    latency_ms: response.latency_ms,
    retry_after_ms: Math.max(0, toNum(response.payload.retryAfterMs, 0)),
    error: response.payload.error,
    message: response.payload.message,
  });
  if (shouldAbort?.()) {
    stopReason = "campaign_abort_requested";
    return { response, attempts, stopReason, attemptTrace };
  }
  while (attempts <= MAX_RETRIES && shouldRetryResponse(response, entry)) {
    if (shouldAbort?.()) {
      stopReason = "campaign_abort_requested";
      break;
    }
    const elapsedMs = Date.now() - begin;
    if (elapsedMs >= MAX_CASE_WALL_MS) {
      stopReason = "case_wall_exceeded";
      break;
    }
    if (isCircuitOpenPayload(response.payload)) {
      circuitOpenRetries += 1;
      const retryAfter = Math.max(0, toNum(response.payload.retryAfterMs, 0));
      if (
        circuitOpenRetries > CIRCUIT_OPEN_MAX_RETRIES ||
        retryAfter >= CIRCUIT_OPEN_RETRY_AFTER_CUTOFF_MS
      ) {
        stopReason = "circuit_open_short_circuit";
        break;
      }
    }
    const delay = retryDelayMs(response, attempts - 1);
    const remaining = Math.max(0, MAX_CASE_WALL_MS - (Date.now() - begin));
    if (remaining <= 0) {
      stopReason = "case_wall_exceeded";
      break;
    }
    await sleepInterruptible(Math.min(delay, remaining), () => Boolean(shouldAbort?.()));
    if (shouldAbort?.()) {
      stopReason = "campaign_abort_requested";
      break;
    }
    response = await askOnce(entry, seed, temperature, runId);
    attempts += 1;
    attemptTrace.push({
      attempt: attempts,
      status: response.status,
      latency_ms: response.latency_ms,
      retry_after_ms: Math.max(0, toNum(response.payload.retryAfterMs, 0)),
      error: response.payload.error,
      message: response.payload.message,
    });
  }
  if (stopReason === "done" && shouldRetryResponse(response, entry) && attempts > MAX_RETRIES) {
    stopReason = "max_retries_reached";
  }
  return { response, attempts, stopReason, attemptTrace };
};

const toNum = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const collectTimings = (debug: AskDebug | null): { retrieval?: number; synthesis?: number } => {
  if (!debug) return {};
  const timeline = Array.isArray(debug.timeline) ? debug.timeline : [];
  const liveEvents = Array.isArray(debug.live_events) ? debug.live_events : [];
  const stageTiming =
    debug.stage_timing_ms && typeof debug.stage_timing_ms === "object"
      ? debug.stage_timing_ms
      : {};
  let retrieval = 0;
  let synthesis = 0;
  for (const step of timeline) {
    const stage = String(step?.stage ?? step?.name ?? "").toLowerCase();
    const ms = toNum(step?.duration_ms ?? step?.ms, 0);
    if (!ms) continue;
    if (/retrieve|search|evidence|context/.test(stage)) retrieval += ms;
    if (/synth|answer|contract|repair|final/.test(stage)) synthesis += ms;
  }
  if (retrieval === 0 || synthesis === 0) {
    for (const evt of liveEvents) {
      const stage = String(evt?.stage ?? evt?.name ?? "").toLowerCase();
      const ms = toNum(evt?.durationMs ?? evt?.duration_ms ?? evt?.ms, 0);
      if (!ms) continue;
      if (retrieval === 0 && /retrieve|evidence|search|context|tree walk|ambiguity/.test(stage)) retrieval += ms;
      if (synthesis === 0 && /synthesis|answer|contract|repair|cleaned|final/.test(stage)) synthesis += ms;
    }
  }
  if (retrieval === 0 || synthesis === 0) {
    for (const [stageKey, value] of Object.entries(stageTiming)) {
      const stage = String(stageKey ?? "").toLowerCase();
      const ms = toNum(value, 0);
      if (!ms) continue;
      if (retrieval === 0 && /retrieve|evidence|search|context|preflight/.test(stage)) retrieval += ms;
      if (synthesis === 0 && /synth|answer|contract|repair|cleaned|final/.test(stage)) synthesis += ms;
    }
  }
  return {
    retrieval: retrieval > 0 ? retrieval : undefined,
    synthesis: synthesis > 0 ? synthesis : undefined,
  };
};

const evaluateFailures = (entry: PromptCase, response: ReturnType<typeof askOnce> extends Promise<infer R> ? R : never): string[] => {
  const failures: string[] = [];
  const text = String(response.payload.text ?? "");
  const debug = response.payload.debug ?? null;
  const reportMode = typeof debug?.report_mode === "boolean" ? debug.report_mode : response.payload.report_mode;
  if (response.status !== 200) failures.push(`request_failed:${response.status || "network"}`);
  if (response.status === 200 && isCircuitOpenPayload(response.payload)) {
    failures.push("request_failed:circuit_open_payload");
  }
  if (entry.expected_intent_id && debug?.intent_id !== entry.expected_intent_id) {
    failures.push(`intent_mismatch:${debug?.intent_id ?? "missing"}`);
  }
  if (typeof entry.expected_report_mode === "boolean" && reportMode !== entry.expected_report_mode) {
    failures.push(`report_mode_mismatch:${String(reportMode)}`);
  }
  if (entry.family === "relation") {
    if (debug?.relation_packet_built !== true) failures.push(`relation_packet_built:${String(debug?.relation_packet_built)}`);
    if (debug?.relation_dual_domain_ok !== true) failures.push(`relation_dual_domain:${String(debug?.relation_dual_domain_ok)}`);
    if (toNum(debug?.relation_packet_bridge_count, 0) < 2) failures.push(`bridge_count_low:${toNum(debug?.relation_packet_bridge_count, 0)}`);
    if (toNum(debug?.relation_packet_evidence_count, 0) < 2) failures.push(`evidence_count_low:${toNum(debug?.relation_packet_evidence_count, 0)}`);
  }
  if (STUB_RE.test(text)) failures.push("stub_text_detected");
  if (REPORT_SECTION_RE.test(text)) failures.push("report_scaffold_shape");
  if (text.trim().length < (entry.min_text_chars ?? MIN_TEXT_CHARS)) failures.push(`text_too_short:${text.trim().length}`);
  const hasCitation = /\bSources?:\s+/i.test(text) || /docs\//i.test(text) || /server\//i.test(text);
  if (!hasCitation) failures.push("citation_missing");
  return failures;
};

const percentile = (values: number[], p: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index] ?? 0;
};

const avg = (values: number[]): number => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

const main = async () => {
  const startedAt = new Date().toISOString();
  const runEpoch = Date.now();
  const gitProvenance = await collectGitProvenance();
  const provenanceWarnings: string[] = [];
  if (!gitProvenance.hasOriginRemote) provenanceWarnings.push("git_origin_remote_missing");
  if (!gitProvenance.originMain) provenanceWarnings.push("git_origin_main_ref_missing");
  if (!gitProvenance.head) provenanceWarnings.push("git_head_missing");
  const provenanceGatePass = provenanceWarnings.length === 0;
  let runId = `versatility-${Date.now()}`;
  const outRootDir = path.resolve(OUT_DIR);
  let runOutDir = ISOLATE_RUN_DIR ? path.join(outRootDir, runId) : outRootDir;
  const prompts = allPrompts();
  if (prompts.length < 90) throw new Error(`expected >=90 prompts, got ${prompts.length}`);
  const expectedRuns = prompts.length * SEEDS.length * TEMPS.length;

  let resumedFromLatest = false;
  let resumedRuns = 0;
  if (ISOLATE_RUN_DIR && RESUME_FROM_LATEST) {
    const latest = await readJsonFile<{ run_id?: string; output_run_dir?: string }>(
      path.resolve(outRootDir, "latest.json"),
    );
    if (latest?.run_id && latest?.output_run_dir) {
      const summary = await readJsonFile<{ expected_runs?: number; run_complete?: boolean }>(
        path.resolve(latest.output_run_dir, "summary.json"),
      );
      const expectedMatch = !Number.isFinite(summary?.expected_runs) || summary?.expected_runs === expectedRuns;
      const incomplete = summary?.run_complete !== true;
      if (expectedMatch && incomplete) {
        runId = latest.run_id;
        runOutDir = path.resolve(latest.output_run_dir);
        resumedFromLatest = true;
      }
    }
  }

  await fs.mkdir(path.resolve(runOutDir, "raw"), { recursive: true });
  await fs.mkdir(path.resolve("reports"), { recursive: true });

  const promptJsonl = prompts
    .map((entry) => JSON.stringify(entry))
    .join("\n");
  await fs.writeFile(path.resolve(runOutDir, "prompts.jsonl"), `${promptJsonl}\n`, "utf8");

  let serverChild: ReturnType<typeof spawn> | null = null;
  if (START_SERVER) {
    serverChild = await startServer();
  } else {
    await ensureServerReady();
  }

  const rawRunByKey = resumedFromLatest ? await loadExistingRawRunMap(runOutDir) : new Map<string, RawRun>();
  resumedRuns = rawRunByKey.size;
  if (resumedRuns > 0) {
    await writeCheckpoint(runOutDir, runId, Array.from(rawRunByKey.values()));
    console.log(
      `[versatility] resume run=${runId} restored_runs=${resumedRuns}/${expectedRuns} out=${runOutDir}`,
    );
  }

  let terminatedEarlyReason: string | null = null;
  const runStartMs = Date.now();
  let globalCooldownUntil = 0;
  let globalCooldownAppliedMs = 0;
  let abortSignal: NodeJS.Signals | null = null;
  const onAbortSignal = (signal: NodeJS.Signals) => {
    abortSignal = signal;
    if (!terminatedEarlyReason) {
      terminatedEarlyReason = `signal:${signal}`;
    }
  };
  process.once("SIGINT", onAbortSignal);
  process.once("SIGTERM", onAbortSignal);
  try {
    outer: for (const entry of prompts) {
      for (const seed of SEEDS) {
        for (const temperature of TEMPS) {
          const caseKey = runCaseKey(entry.id, seed, temperature);
          if (rawRunByKey.has(caseKey)) continue;
          if (abortSignal) {
            terminatedEarlyReason = terminatedEarlyReason ?? `signal:${abortSignal}`;
            break outer;
          }
          if (globalCooldownUntil > Date.now()) {
            const waitMs = globalCooldownUntil - Date.now();
            const cooldownStart = Date.now();
            await sleepInterruptible(waitMs, () => Boolean(abortSignal));
            const waitedMs = Math.max(0, Date.now() - cooldownStart);
            if (abortSignal) {
              terminatedEarlyReason = terminatedEarlyReason ?? `signal:${abortSignal}`;
              break outer;
            }
            globalCooldownAppliedMs += waitedMs;
          }
          if (MAX_RUN_MS > 0 && Date.now() - runStartMs >= MAX_RUN_MS) {
            terminatedEarlyReason = `max_run_ms_exceeded:${MAX_RUN_MS}`;
            break outer;
          }
          const { response, attempts, stopReason, attemptTrace } = await askWithRetry(
            entry,
            seed,
            temperature,
            runId,
            () => Boolean(abortSignal),
          );
          if (stopReason === "campaign_abort_requested") {
            terminatedEarlyReason = terminatedEarlyReason ?? `signal:${abortSignal ?? "abort_requested"}`;
            break outer;
          }
          const failures = evaluateFailures(entry, response);
          const raw: RawRun = {
            run_id: runId,
            prompt_id: entry.id,
            family: entry.family,
            question: entry.question,
            seed,
            temperature,
            status: response.status,
            latency_ms: response.latency_ms,
            timestamp: new Date().toISOString(),
            expected_intent_id: entry.expected_intent_id,
            expected_report_mode: entry.expected_report_mode,
            response_text: String(response.payload.text ?? ""),
            debug: response.payload.debug ?? null,
            failures,
            attempts,
            stop_reason: stopReason,
            attempt_trace: attemptTrace,
          };
          rawRunByKey.set(caseKey, raw);
          if (
            GLOBAL_COOLDOWN_ON_CIRCUIT &&
            (raw.stop_reason === "circuit_open_short_circuit" || raw.status === 503)
          ) {
            const retryAfterMs = circuitRetryAfterFromRawRun(raw);
            if (retryAfterMs > 0) {
              const cooldownMs = Math.min(GLOBAL_COOLDOWN_CAP_MS, retryAfterMs);
              if (cooldownMs > 0) {
                globalCooldownUntil = Math.max(globalCooldownUntil, Date.now() + cooldownMs);
              }
            }
          }
          const fileName = `${runId}-${entry.id}-s${seed}-t${String(temperature).replace(".", "p")}.json`;
          await fs.writeFile(path.resolve(runOutDir, "raw", fileName), `${JSON.stringify(raw, null, 2)}\n`, "utf8");
          if (rawRunByKey.size % CHECKPOINT_EVERY === 0) {
            const checkpointRows = Array.from(rawRunByKey.values());
            await writeCheckpoint(runOutDir, runId, checkpointRows);
            console.log(`[versatility] progress ${checkpointRows.length}/${expectedRuns}`);
          }
        }
      }
    }
  } finally {
    process.removeListener("SIGINT", onAbortSignal);
    process.removeListener("SIGTERM", onAbortSignal);
    if (serverChild) await stopServer(serverChild);
  }
  const rawRuns = Array.from(rawRunByKey.values());
  await writeCheckpoint(runOutDir, runId, rawRuns);
  const runComplete = rawRuns.length === expectedRuns && !terminatedEarlyReason;
  if (!runComplete && !terminatedEarlyReason) {
    terminatedEarlyReason = `incomplete_run:${rawRuns.length}/${expectedRuns}`;
  }

  const byFamily = new Map<PromptFamily, RawRun[]>();
  for (const family of ["relation", "repo_technical", "ambiguous_general"] as const) {
    byFamily.set(family, rawRuns.filter((entry) => entry.family === family));
  }

  const failureCounts = new Map<string, number>();
  for (const row of rawRuns) {
    for (const failure of row.failures) {
      const key = failure.split(":")[0] ?? failure;
      failureCounts.set(key, (failureCounts.get(key) ?? 0) + 1);
    }
  }
  const topFailures: FailureRecord[] = Array.from(failureCounts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const expectedIntentRows = rawRuns.filter((row) => row.expected_intent_id);
  const reportExpectedRows = rawRuns.filter((row) => typeof row.expected_report_mode === "boolean");
  const relationRows = rawRuns.filter((row) => row.family === "relation");

  const citationRate = rawRuns.filter((row) => !row.failures.some((f) => f.startsWith("citation_missing"))).length / Math.max(1, rawRuns.length);
  const minTextPassRate = rawRuns.filter((row) => !row.failures.some((f) => f.startsWith("text_too_short"))).length / Math.max(1, rawRuns.length);
  const stubRate = rawRuns.filter((row) => row.failures.includes("stub_text_detected")).length / Math.max(1, rawRuns.length);

  const relationFallbackRate = relationRows.filter((row) => row.debug?.deterministic_fallback_used_relation === true).length / Math.max(1, relationRows.length);
  const parseFailRelationRate = relationRows.filter((row) => toNum(row.debug?.contract_parse_fail_rate_relation, 0) > 0).length / Math.max(1, relationRows.length);
  const repairRate = rawRuns.filter((row) => row.debug?.citation_repair === true).length / Math.max(1, rawRuns.length);

  const intentCorrectRate = expectedIntentRows.filter((row) => row.debug?.intent_id === row.expected_intent_id).length / Math.max(1, expectedIntentRows.length);
  const reportModeCorrectRate = reportExpectedRows.filter((row) => {
    const actual = typeof row.debug?.report_mode === "boolean" ? row.debug?.report_mode : undefined;
    return actual === row.expected_report_mode;
  }).length / Math.max(1, reportExpectedRows.length);

  const relationPacketBuiltRate = relationRows.filter((row) => row.debug?.relation_packet_built === true).length / Math.max(1, relationRows.length);
  const relationDualDomainRate = relationRows.filter((row) => row.debug?.relation_dual_domain_ok === true).length / Math.max(1, relationRows.length);

  const totalLatencies = rawRuns.map((row) => row.latency_ms);
  const retrievalLatencies = rawRuns.map((row) => collectTimings(row.debug).retrieval).filter((value): value is number => typeof value === "number");
  const synthesisLatencies = rawRuns.map((row) => collectTimings(row.debug).synthesis).filter((value): value is number => typeof value === "number");

  const familySummary = Object.fromEntries(
    Array.from(byFamily.entries()).map(([family, rows]) => {
      const passCount = rows.filter((row) => row.failures.length === 0).length;
      const intentRows = rows.filter((row) => row.expected_intent_id);
      const reportRows = rows.filter((row) => typeof row.expected_report_mode === "boolean");
      return [
        family,
        {
          runs: rows.length,
          pass_rate: passCount / Math.max(1, rows.length),
          avg_latency_ms: avg(rows.map((row) => row.latency_ms)),
          p50_latency_ms: percentile(rows.map((row) => row.latency_ms), 50),
          p95_latency_ms: percentile(rows.map((row) => row.latency_ms), 95),
          intent_correct_rate:
            intentRows.filter((row) => row.debug?.intent_id === row.expected_intent_id).length /
            Math.max(1, intentRows.length),
          report_mode_correct_rate:
            reportRows.filter((row) => row.debug?.report_mode === row.expected_report_mode).length /
            Math.max(1, reportRows.length),
          stub_rate: rows.filter((row) => row.failures.includes("stub_text_detected")).length / Math.max(1, rows.length),
        },
      ];
    }),
  );

  const worst = [...rawRuns]
    .sort((a, b) => b.failures.length - a.failures.length || b.latency_ms - a.latency_ms)
    .slice(0, 15)
    .map((row) => ({
      prompt_id: row.prompt_id,
      family: row.family,
      question: row.question,
      answer: row.response_text.slice(0, 1800),
      debug: {
        intent_id: row.debug?.intent_id,
        intent_strategy: row.debug?.intent_strategy,
        report_mode: row.debug?.report_mode,
        relation_packet_built: row.debug?.relation_packet_built,
        relation_dual_domain_ok: row.debug?.relation_dual_domain_ok,
        deterministic_fallback_used_relation: row.debug?.deterministic_fallback_used_relation,
        contract_parse_fail_rate_relation: row.debug?.contract_parse_fail_rate_relation,
        citation_repair: row.debug?.citation_repair,
        answer_path: row.debug?.answer_path,
      },
      failures: row.failures,
      likely_root_cause: row.failures.some((entry) => entry.startsWith("stub_text_detected"))
        ? "llm_local_stub_environment"
        : row.failures.some((entry) => entry.startsWith("relation_packet_built"))
          ? "relation_topology_or_context_gap"
          : row.failures.some((entry) => entry.startsWith("citation_missing"))
            ? "citation_cleanup_or_contract_fill_gap"
            : row.failures.some((entry) => entry.startsWith("report_mode_mismatch"))
              ? "routing_or_report_mode_policy"
              : "mixed",
      patch_suggestion: row.failures.some((entry) => entry.startsWith("stub_text_detected"))
        ? "Run campaign with real model and disable stub for decision-grade relation quality judgments."
        : row.failures.some((entry) => entry.startsWith("relation_packet_built"))
          ? "Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation."
          : row.failures.some((entry) => entry.startsWith("citation_missing"))
            ? "Strengthen citation fallback append after final cleaning for hybrid/repo outputs."
            : "Tighten routing diagnostics and deterministic fallback conditions for this failure signature.",
    }));

  const summary = {
    summary_schema_version: 2,
    run_id: runId,
    started_at: startedAt,
    ended_at: new Date().toISOString(),
    run_duration_ms: Date.now() - runEpoch,
    terminated_early_reason: terminatedEarlyReason,
    global_cooldown_applied_ms: globalCooldownAppliedMs,
    resumed_from_latest: resumedFromLatest,
    resumed_runs: resumedRuns,
    output_root_dir: outRootDir,
    output_run_dir: runOutDir,
    base_url: BASE_URL,
    prompt_count: prompts.length,
    seed_count: SEEDS.length,
    temperature_values: TEMPS,
    expected_runs: expectedRuns,
    total_runs: rawRuns.length,
    run_complete: runComplete,
    completion_rate: rawRuns.length / Math.max(1, expectedRuns),
    provenance: {
      ...gitProvenance,
      gate_pass: provenanceGatePass,
      warnings: provenanceWarnings,
    },
    family_summary: familySummary,
    metrics: {
      attempts: {
        avg_attempts: avg(rawRuns.map((row) => row.attempts ?? 1)),
        p95_attempts: percentile(rawRuns.map((row) => row.attempts ?? 1), 95),
      },
      intent_id_correct_rate: intentCorrectRate,
      report_mode_correct_rate: reportModeCorrectRate,
      relation_packet_built_rate: relationPacketBuiltRate,
      relation_dual_domain_ok_rate: relationDualDomainRate,
      stub_text_detected_rate: stubRate,
      deterministic_fallback_relation_rate: relationFallbackRate,
      contract_parse_fail_relation_rate: parseFailRelationRate,
      citation_repair_rate: repairRate,
      citation_presence_rate: citationRate,
      min_text_length_pass_rate: minTextPassRate,
      latency_ms: {
        total: { p50: percentile(totalLatencies, 50), p95: percentile(totalLatencies, 95) },
        retrieval: { p50: percentile(retrievalLatencies, 50), p95: percentile(retrievalLatencies, 95), samples: retrievalLatencies.length },
        synthesis: { p50: percentile(synthesisLatencies, 50), p95: percentile(synthesisLatencies, 95), samples: synthesisLatencies.length },
      },
    },
    top_failure_signatures: topFailures,
    worst_examples: worst,
  };

  const failures = {
    run_id: runId,
    expected_runs: expectedRuns,
    total_runs: rawRuns.length,
    run_complete: runComplete,
    top_failure_signatures: topFailures,
    failed_runs: rawRuns.filter((row) => row.failures.length > 0).map((row) => ({
      prompt_id: row.prompt_id,
      family: row.family,
      seed: row.seed,
      temperature: row.temperature,
      failures: row.failures,
      intent_id: row.debug?.intent_id,
      report_mode: row.debug?.report_mode,
      latency_ms: row.latency_ms,
    })),
  };

  const recommendationDecision =
    !runComplete ||
    !provenanceGatePass ||
    stubRate > 0.02 ||
    relationPacketBuiltRate < 0.95 ||
    relationDualDomainRate < 0.95 ||
    reportModeCorrectRate < 0.98 ||
    minTextPassRate < 0.9
      ? (runComplete ? "needs_patch" : "insufficient_run_quality")
      : "ship";
  const normalizedDecision =
    !provenanceGatePass || !runComplete ? "insufficient_run_quality" : recommendationDecision;
  const nextPatches = [
    ...(!provenanceGatePass
      ? [
          {
            order: 0,
            title: "Validation provenance gate",
            why: "Require origin/main + HEAD provenance in reports before accepting decision-grade outcomes.",
          },
        ]
      : []),
    {
      order: 1,
      title: "Relation-mode fallback hardening",
      why: "Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.",
    },
    {
      order: 2,
      title: "Citation persistence guard",
      why: "Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.",
    },
    {
      order: 3,
      title: "Stub environment policy split",
      why: "Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.",
    },
  ];

  const recommendation = {
    summary_schema_version: 2,
    run_id: runId,
    decision: normalizedDecision,
    rationale: [
      `provenance_gate_pass=${String(provenanceGatePass)}`,
      `git_branch=${gitProvenance.branch ?? "missing"}`,
      `git_head=${gitProvenance.head ?? "missing"}`,
      `git_origin_main=${gitProvenance.originMain ?? "missing"}`,
      `git_ahead_behind=${gitProvenance.aheadBehind ?? "missing"}`,
      `run_complete=${String(runComplete)}`,
      `expected_runs=${expectedRuns}`,
      `total_runs=${rawRuns.length}`,
      `terminated_early_reason=${terminatedEarlyReason ?? "none"}`,
      `global_cooldown_applied_ms=${globalCooldownAppliedMs}`,
      `resumed_from_latest=${String(resumedFromLatest)}`,
      `resumed_runs=${resumedRuns}`,
      `stub_text_detected_rate=${stubRate.toFixed(3)}`,
      `relation_packet_built_rate=${relationPacketBuiltRate.toFixed(3)}`,
      `relation_dual_domain_ok_rate=${relationDualDomainRate.toFixed(3)}`,
      `report_mode_correct_rate=${reportModeCorrectRate.toFixed(3)}`,
      `min_text_length_pass_rate=${minTextPassRate.toFixed(3)}`,
    ],
    next_patches: nextPatches,
  };

  await fs.writeFile(path.resolve(runOutDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await fs.writeFile(path.resolve(runOutDir, "failures.json"), `${JSON.stringify(failures, null, 2)}\n`, "utf8");
  await fs.writeFile(path.resolve(runOutDir, "recommendation.json"), `${JSON.stringify(recommendation, null, 2)}\n`, "utf8");
  await fs.writeFile(
    path.resolve(outRootDir, "latest.json"),
    `${JSON.stringify({ run_id: runId, output_run_dir: runOutDir, completed_at: new Date().toISOString() }, null, 2)}\n`,
    "utf8",
  );

  const familyLines = (Object.entries(familySummary) as Array<[string, Record<string, number>]>).map(
    ([family, stats]) =>
      `| ${family} | ${stats.runs} | ${(stats.pass_rate * 100).toFixed(1)}% | ${(stats.intent_correct_rate * 100).toFixed(1)}% | ${(stats.report_mode_correct_rate * 100).toFixed(1)}% | ${(stats.stub_rate * 100).toFixed(1)}% | ${stats.p50_latency_ms.toFixed(0)} | ${stats.p95_latency_ms.toFixed(0)} |`,
  );

  const worstSection = worst
    .map((entry, index) => {
      const debug = entry.debug;
      return [
        `### Worst #${index + 1}: ${entry.prompt_id}`,
        `- family: ${entry.family}`,
        `- question: ${entry.question}`,
        `- failures: ${entry.failures.join(", ") || "none"}`,
        `- likely_root_cause: ${entry.likely_root_cause}`,
        `- patch_suggestion: ${entry.patch_suggestion}`,
        `- debug: intent_id=${String(debug.intent_id)} intent_strategy=${String(debug.intent_strategy)} report_mode=${String(debug.report_mode)} relation_packet_built=${String(debug.relation_packet_built)} relation_dual_domain_ok=${String(debug.relation_dual_domain_ok)} deterministic_fallback_used_relation=${String(debug.deterministic_fallback_used_relation)} contract_parse_fail_rate_relation=${String(debug.contract_parse_fail_rate_relation)} citation_repair=${String(debug.citation_repair)}`,
        "- final_answer:",
        "```text",
        entry.answer,
        "```",
      ].join("\n");
    })
    .join("\n\n");

  const md = [
    "# Helix Ask Versatility Evaluation Report",
    "",
    `- summary_schema_version: 2`,
    `- git_branch: ${gitProvenance.branch ?? "missing"}`,
    `- git_head: ${gitProvenance.head ?? "missing"}`,
    `- git_origin_main: ${gitProvenance.originMain ?? "missing"}`,
    `- git_ahead_behind: ${gitProvenance.aheadBehind ?? "missing"}`,
    `- provenance_gate_pass: ${String(provenanceGatePass)}`,
    `- provenance_warnings: ${provenanceWarnings.length ? provenanceWarnings.join(", ") : "none"}`,
    `- run_id: ${runId}`,
    `- base_url: ${BASE_URL}`,
    `- prompts: ${prompts.length}`,
    `- seeds: ${SEEDS.join(",")}`,
    `- temperatures: ${TEMPS.join(",")}`,
    `- expected_runs: ${expectedRuns}`,
    `- total_runs: ${rawRuns.length}`,
    `- run_complete: ${String(runComplete)}`,
    `- completion_rate: ${(100 * rawRuns.length / Math.max(1, expectedRuns)).toFixed(2)}%`,
    `- run_duration_ms: ${Date.now() - runEpoch}`,
    `- terminated_early_reason: ${terminatedEarlyReason ?? "none"}`,
    `- global_cooldown_applied_ms: ${globalCooldownAppliedMs}`,
    `- resumed_from_latest: ${String(resumedFromLatest)}`,
    `- resumed_runs: ${resumedRuns}`,
    `- output_run_dir: ${runOutDir}`,
    "",
    "## Aggregate by Prompt Family",
    "| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |",
    "|---|---:|---:|---:|---:|---:|---:|---:|",
    ...familyLines,
    "",
    "## Core Metrics",
    `- intent_id_correct_rate: ${(intentCorrectRate * 100).toFixed(2)}%`,
    `- report_mode_correct_rate: ${(reportModeCorrectRate * 100).toFixed(2)}%`,
    `- relation_packet_built_rate: ${(relationPacketBuiltRate * 100).toFixed(2)}%`,
    `- relation_dual_domain_ok_rate: ${(relationDualDomainRate * 100).toFixed(2)}%`,
    `- avg_attempts_per_run: ${avg(rawRuns.map((row) => row.attempts ?? 1)).toFixed(2)}`,
    `- p95_attempts_per_run: ${percentile(rawRuns.map((row) => row.attempts ?? 1), 95).toFixed(0)}`,
    `- stub_text_detected_rate: ${(stubRate * 100).toFixed(2)}%`,
    `- deterministic_fallback_relation_rate: ${(relationFallbackRate * 100).toFixed(2)}%`,
    `- contract_parse_fail_relation_rate: ${(parseFailRelationRate * 100).toFixed(2)}%`,
    `- citation_repair_rate: ${(repairRate * 100).toFixed(2)}%`,
    `- citation_presence_rate: ${(citationRate * 100).toFixed(2)}%`,
    `- min_text_length_pass_rate: ${(minTextPassRate * 100).toFixed(2)}%`,
    `- latency_total_p50_ms: ${percentile(totalLatencies, 50).toFixed(0)}`,
    `- latency_total_p95_ms: ${percentile(totalLatencies, 95).toFixed(0)}`,
    `- latency_retrieval_p50_ms: ${percentile(retrievalLatencies, 50).toFixed(0)} (samples=${retrievalLatencies.length})`,
    `- latency_retrieval_p95_ms: ${percentile(retrievalLatencies, 95).toFixed(0)} (samples=${retrievalLatencies.length})`,
    `- latency_synthesis_p50_ms: ${percentile(synthesisLatencies, 50).toFixed(0)} (samples=${synthesisLatencies.length})`,
    `- latency_synthesis_p95_ms: ${percentile(synthesisLatencies, 95).toFixed(0)} (samples=${synthesisLatencies.length})`,
    "",
    "## Top Failure Signatures",
    ...topFailures.map((entry) => `- ${entry.key}: ${entry.count}`),
    "",
    "## Tie-in vs Prior Reports",
    "- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.",
    "- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.",
    "- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.",
    "",
    "## 15 Worst Examples",
    worstSection,
    "",
    "## Recommendation",
    `- decision: ${normalizedDecision}`,
    ...recommendation.next_patches.map((patch) => `- [${patch.order}] ${patch.title}: ${patch.why}`),
  ].join("\n");

  await fs.writeFile(path.resolve(REPORT_PATH), `${md}\n`, "utf8");
  await fs.writeFile(path.resolve(runOutDir, "report.md"), `${md}\n`, "utf8");

  console.log(
    `[versatility] run=${runId} prompts=${prompts.length} expected_runs=${expectedRuns} runs=${rawRuns.length} run_complete=${String(
      runComplete,
    )} decision=${normalizedDecision} out=${runOutDir}`,
  );
  if (FAIL_ON_INCOMPLETE && !runComplete) {
    throw new Error(
      `versatility_run_incomplete expected=${expectedRuns} actual=${rawRuns.length} reason=${terminatedEarlyReason ?? "none"}`,
    );
  }
};

main().catch((error) => {
  console.error("[versatility] failed", error);
  process.exit(1);
});
