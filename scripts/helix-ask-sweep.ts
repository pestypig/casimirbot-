import fs from "node:fs/promises";
import path from "node:path";

type CitationsPolicy = "require" | "forbid" | "optional";

type SweepExpectation = {
  intent_id?: string;
  intent_domain?: string;
  format?: string;
  citations?: CitationsPolicy;
  must_include?: string[];
  allow_clarify?: boolean;
};

type SweepCase = {
  label: string;
  question: string;
  expect?: SweepExpectation;
};

type SweepPack = {
  cases: SweepCase[];
};

type SweepConfig = {
  name: string;
  tuning?: Record<string, unknown>;
  topK?: number;
  temperature?: number;
  max_tokens?: number;
  verbosity?: "brief" | "normal" | "extended";
};

type HelixAskDebug = {
  intent_id?: string;
  intent_domain?: string;
  format?: string;
  stage_tags?: boolean;
  arbiter_mode?: "repo_grounded" | "hybrid" | "general" | "clarify";
  context_files?: string[];
};

type AskResponse = {
  text?: string;
  debug?: HelixAskDebug;
  duration_ms?: number;
};

type CaseResult = {
  label: string;
  ok: boolean;
  clarify: boolean;
  hard_failures: string[];
  decorative_citations: string[];
  prompt_leak: boolean;
  cited_paths: string[];
  context_paths: string[];
  duration_ms?: number;
  debug?: HelixAskDebug;
};

type SweepSummary = {
  config: string;
  total: number;
  ok: number;
  hard_fail: number;
  clarify_rate: number;
  prompt_leak_rate: number;
  decorative_citation_rate: number;
  avg_duration_ms?: number;
};

const BASE_URL =
  process.env.HELIX_ASK_BASE_URL ??
  process.env.EVAL_BASE_URL ??
  "http://localhost:5173";

const ASK_URL = new URL("/api/agi/ask", BASE_URL).toString();
const REQUEST_TIMEOUT_MS = Number(process.env.HELIX_ASK_SWEEP_TIMEOUT_MS ?? 120000);
const PACK_PATH = process.env.HELIX_ASK_SWEEP_PACK ?? "scripts/helix-ask-sweep-pack.json";
const MATRIX_PATH = process.env.HELIX_ASK_SWEEP_MATRIX;
const OUTPUT_DIR = process.env.HELIX_ASK_SWEEP_OUT_DIR ?? "artifacts";

const DEFAULT_MATRIX: SweepConfig[] = [
  {
    name: "baseline",
  },
];

const FILE_PATH_PATTERN =
  /\b[a-zA-Z0-9_\-./]+?\.(?:ts|tsx|js|mjs|cjs|md|json|html|yml|yaml)\b/g;

const PROMPT_LEAK_PATTERNS: RegExp[] = [
  /\buse only the\b/i,
  /\bdo not add\b/i,
  /\bquestion:\b/i,
  /\bcontext sources\b/i,
  /\bevidence (?:bullets|steps)\b/i,
  /\brespond with only the answer\b/i,
];

const extractFilePaths = (text: string): string[] => {
  if (!text) return [];
  const matches = text.match(FILE_PATH_PATTERN) ?? [];
  const unique = new Set<string>();
  for (const match of matches) {
    if (!match) continue;
    unique.add(match.trim());
  }
  return Array.from(unique);
};

const hasPromptLeak = (text: string): boolean =>
  PROMPT_LEAK_PATTERNS.some((pattern) => pattern.test(text));

const readJsonFile = async <T>(filePath: string): Promise<T> => {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as T;
};

const resolveSweepMatrix = async (): Promise<SweepConfig[]> => {
  if (!MATRIX_PATH) return DEFAULT_MATRIX;
  const fullPath = path.resolve(MATRIX_PATH);
  const matrix = await readJsonFile<SweepConfig[]>(fullPath);
  return Array.isArray(matrix) && matrix.length ? matrix : DEFAULT_MATRIX;
};

const buildRequestBody = (entry: SweepCase, config: SweepConfig, sessionId: string) => {
  const body: Record<string, unknown> = {
    question: entry.question,
    debug: true,
    sessionId,
  };
  if (typeof config.max_tokens === "number") body.max_tokens = config.max_tokens;
  if (typeof config.temperature === "number") body.temperature = config.temperature;
  if (typeof config.topK === "number") body.topK = config.topK;
  if (config.verbosity) body.verbosity = config.verbosity;
  if (config.tuning) body.tuning = config.tuning;
  return body;
};

const fetchCase = async (entry: SweepCase, config: SweepConfig, sessionId: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(ASK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildRequestBody(entry, config, sessionId)),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) {
      const text = await response.text();
      return {
        ok: false,
        error: `request failed (${response.status})${text ? `: ${text.slice(0, 240)}` : ""}`,
      };
    }
    const payload = (await response.json()) as AskResponse;
    return { ok: true, payload };
  } catch (error) {
    clearTimeout(timeout);
    const message =
      (error as { message?: string })?.message ?? (error ? String(error) : "fetch_failed");
    return { ok: false, error: message };
  }
};

const evaluateCase = (
  entry: SweepCase,
  payload: AskResponse,
): CaseResult => {
  const answerText = payload.text ?? "";
  const debug = payload.debug;
  const citedPaths = extractFilePaths(answerText);
  const contextPaths = debug?.context_files ?? [];
  const contextSet = new Set(contextPaths);
  const decorative = citedPaths.filter((path) => !contextSet.has(path));
  const clarify =
    debug?.arbiter_mode === "clarify" ||
    /please point to the relevant files|narrow the request/i.test(answerText);

  const hardFailures: string[] = [];
  const expect = entry.expect ?? {};
  const allowClarify = expect.allow_clarify === true;

  const checkExpectation = (
    ok: boolean,
    message: string,
  ) => {
    if (!ok && !(allowClarify && clarify)) {
      hardFailures.push(message);
    }
  };

  if (expect.intent_id) {
    checkExpectation(
      debug?.intent_id === expect.intent_id,
      `intent_id ${debug?.intent_id ?? "missing"} !== ${expect.intent_id}`,
    );
  }
  if (expect.intent_domain) {
    checkExpectation(
      debug?.intent_domain === expect.intent_domain,
      `intent_domain ${debug?.intent_domain ?? "missing"} !== ${expect.intent_domain}`,
    );
  }
  if (expect.format) {
    checkExpectation(
      debug?.format === expect.format,
      `format ${debug?.format ?? "missing"} !== ${expect.format}`,
    );
  }

  const citationsPolicy = expect.citations ?? "optional";
  if (citationsPolicy === "require") {
    checkExpectation(citedPaths.length > 0, "missing citations");
  } else if (citationsPolicy === "forbid") {
    checkExpectation(citedPaths.length === 0, "unexpected citations");
  }

  if (expect.must_include?.length) {
    const missing = expect.must_include.filter(
      (value) =>
        !contextSet.has(value) &&
        !answerText.includes(value),
    );
    checkExpectation(missing.length === 0, `missing must_include: ${missing.join(", ")}`);
  }

  if (decorative.length > 0) {
    checkExpectation(false, `decorative citations: ${decorative.join(", ")}`);
  }

  const promptLeak = hasPromptLeak(answerText);
  if (promptLeak) {
    checkExpectation(false, "prompt leakage");
  }

  return {
    label: entry.label,
    ok: hardFailures.length === 0,
    clarify,
    hard_failures: hardFailures,
    decorative_citations: decorative,
    prompt_leak: promptLeak,
    cited_paths: citedPaths,
    context_paths: contextPaths,
    duration_ms: payload.duration_ms,
    debug,
  };
};

const summarize = (configName: string, results: CaseResult[]): SweepSummary => {
  const total = results.length;
  const ok = results.filter((entry) => entry.ok).length;
  const hardFail = total - ok;
  const clarifyCount = results.filter((entry) => entry.clarify).length;
  const promptLeakCount = results.filter((entry) => entry.prompt_leak).length;
  const decorativeCount = results.filter((entry) => entry.decorative_citations.length > 0).length;
  const durations = results.map((entry) => entry.duration_ms).filter((value) => typeof value === "number") as number[];
  const avgDuration =
    durations.length > 0
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : undefined;
  return {
    config: configName,
    total,
    ok,
    hard_fail: hardFail,
    clarify_rate: total > 0 ? Number((clarifyCount / total).toFixed(3)) : 0,
    prompt_leak_rate: total > 0 ? Number((promptLeakCount / total).toFixed(3)) : 0,
    decorative_citation_rate: total > 0 ? Number((decorativeCount / total).toFixed(3)) : 0,
    avg_duration_ms: avgDuration,
  };
};

async function main(): Promise<void> {
  const pack = await readJsonFile<SweepPack>(path.resolve(PACK_PATH));
  const matrix = await resolveSweepMatrix();
  if (!pack.cases?.length) {
    throw new Error(`Sweep pack is empty: ${PACK_PATH}`);
  }
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const sessionId = `helix-ask-sweep:${Date.now()}`;
  const runResults: Array<{ config: SweepConfig; results: CaseResult[]; summary: SweepSummary }> = [];

  for (const config of matrix) {
    const results: CaseResult[] = [];
    for (const entry of pack.cases) {
      console.log(`Running [${config.name}] ${entry.label}`);
      const response = await fetchCase(entry, config, sessionId);
      if (!response.ok) {
        results.push({
          label: entry.label,
          ok: false,
          clarify: false,
          hard_failures: [response.error ?? "request failed"],
          decorative_citations: [],
          prompt_leak: false,
          cited_paths: [],
          context_paths: [],
        });
        continue;
      }
      results.push(evaluateCase(entry, response.payload));
    }
    const summary = summarize(config.name, results);
    runResults.push({ config, results, summary });
    console.log(
      `Summary [${config.name}] ok=${summary.ok}/${summary.total} clarifyRate=${summary.clarify_rate} promptLeakRate=${summary.prompt_leak_rate}`,
    );
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "");
  const outPath = path.join(OUTPUT_DIR, `helix-ask-sweep.${stamp}.json`);
  await fs.writeFile(outPath, JSON.stringify(runResults, null, 2), "utf8");
  console.log(`Saved sweep report: ${outPath}`);
}

main().catch((error) => {
  console.error("[helix-ask-sweep] failed:", error);
  process.exit(1);
});
