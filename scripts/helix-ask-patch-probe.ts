import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type ProbeFamily =
  | "ideology_social"
  | "repo_technical"
  | "hybrid"
  | "general";

type ProbeExpectation = {
  intent_domain?: string;
  intent_id?: string;
  forbid_concept_ids?: string[];
  require_context_contains?: string[];
  min_coverage_ratio?: number;
  max_belief_unsupported_rate?: number;
};

type ProbeCase = {
  id: string;
  label: string;
  family: ProbeFamily;
  question: string;
  expect: ProbeExpectation;
};

type AskDebug = Record<string, unknown> & {
  intent_id?: string;
  intent_domain?: string;
  concept_id?: string;
  coverage_ratio?: number;
  belief_unsupported_rate?: number;
  context_files?: string[];
};

type AskResponse = {
  text?: string;
  debug?: AskDebug;
};

type ProbeResult = {
  id: string;
  label: string;
  family: ProbeFamily;
  question: string;
  ok: boolean;
  failures: string[];
  duration_ms: number;
  debug: {
    intent_id?: string;
    intent_domain?: string;
    concept_id?: string;
    coverage_ratio?: number;
    belief_unsupported_rate?: number;
    context_files_count?: number;
  } | null;
};

type ProbeSummary = {
  schema_version: "helix_ask_patch_probe/1";
  run_id: string;
  generated_at: string;
  base_url: string;
  ask_url: string;
  seed: number;
  sample_count: number;
  total_cases_available: number;
  pass_count: number;
  fail_count: number;
  pass_rate: number;
  plan_context: {
    path: string;
    required: boolean;
    loaded: boolean;
    sha256?: string;
  };
  family_stats: Array<{
    family: ProbeFamily;
    total: number;
    pass: number;
    fail: number;
    pass_rate: number;
  }>;
  artifacts: {
    output_dir: string;
    results_json: string;
    summary_json: string;
    report_md: string;
  };
};

const BASE_URL =
  process.env.HELIX_ASK_BASE_URL ??
  process.env.EVAL_BASE_URL ??
  "http://localhost:5050";
const ASK_URL = new URL("/api/agi/ask", BASE_URL).toString();
const REQUEST_TIMEOUT_MS = Math.max(
  1000,
  Number(process.env.HELIX_ASK_PATCH_PROBE_TIMEOUT_MS ?? 45000),
);
const SAMPLE_COUNT = Math.max(
  1,
  Number(process.env.HELIX_ASK_PATCH_PROBE_SAMPLES ?? 10),
);
const FAIL_ON_MISS = process.env.HELIX_ASK_PATCH_PROBE_FAIL_ON_MISS !== "0";
const REQUIRE_PLAN_CONTEXT =
  process.env.HELIX_ASK_PATCH_PROBE_REQUIRE_PLAN_CONTEXT !== "0";
const PLAN_PATH = process.env.HELIX_ASK_PATCH_PROBE_PLAN_PATH?.trim()
  ? path.resolve(process.env.HELIX_ASK_PATCH_PROBE_PLAN_PATH)
  : path.resolve(
      "docs/helix-ask-retrieval-objective-resolution-plan-2026-03-03.md",
    );
const OUTPUT_ROOT = path.resolve(
  process.env.HELIX_ASK_PATCH_PROBE_OUT_DIR ??
    "artifacts/experiments/helix-ask-patch-probe",
);

const PROBE_BANK: ProbeCase[] = [
  {
    id: "ideology_child_love_1",
    label: "Child-love vulnerability policy",
    family: "ideology_social",
    question:
      "If a child would look forward to celebrating love, how can a society condition this vulnerability?",
    expect: {
      intent_domain: "repo",
      forbid_concept_ids: ["energy-conditions", "boundary-conditions-modes"],
      require_context_contains: ["docs/ethos/ideology.json"],
      min_coverage_ratio: 0.3,
      max_belief_unsupported_rate: 0.6,
    },
  },
  {
    id: "ideology_rumor_spike_1",
    label: "Rumor spike civic response",
    family: "ideology_social",
    question:
      "How should a town council respond to online rumor spikes using the ideology tree values in this repo?",
    expect: {
      intent_domain: "repo",
      intent_id: "repo.ideology_reference",
      require_context_contains: ["docs/ethos/ideology.json"],
      max_belief_unsupported_rate: 0.5,
    },
  },
  {
    id: "ideology_feedback_hygiene_1",
    label: "Feedback loop hygiene narrative",
    family: "ideology_social",
    question:
      "Explain Feedback Loop Hygiene as practical social guidance for a school community, rooted in this repo's ideology tree.",
    expect: {
      intent_domain: "repo",
      intent_id: "repo.ideology_reference",
      require_context_contains: ["docs/ethos/ideology.json"],
      max_belief_unsupported_rate: 0.5,
    },
  },
  {
    id: "ideology_societal_signal_1",
    label: "Societal signal routing",
    family: "ideology_social",
    question:
      "When social trust is fragile, what ideology-rooted principles should guide policy communication?",
    expect: {
      intent_domain: "repo",
      forbid_concept_ids: ["energy-conditions", "ford-roman-quantum-inequality"],
      require_context_contains: ["docs/ethos/ideology.json"],
      max_belief_unsupported_rate: 0.6,
    },
  },
  {
    id: "repo_pipeline_1",
    label: "Helix Ask pipeline explain",
    family: "repo_technical",
    question: "How does the Helix Ask pipeline work in this repo?",
    expect: {
      intent_domain: "repo",
      intent_id: "repo.helix_ask_pipeline_explain",
      min_coverage_ratio: 0.3,
    },
  },
  {
    id: "repo_debug_1",
    label: "Repo startup debug",
    family: "repo_technical",
    question: "This repo throws an error on startup. How do I fix it?",
    expect: {
      intent_domain: "repo",
      intent_id: "repo.repo_debugging_root_cause",
    },
  },
  {
    id: "repo_change_1",
    label: "Repo change request",
    family: "repo_technical",
    question: "Update this repo to add a new API endpoint.",
    expect: {
      intent_domain: "repo",
      intent_id: "repo.repo_change_request",
    },
  },
  {
    id: "hybrid_method_system_1",
    label: "Scientific method + system mapping",
    family: "hybrid",
    question:
      "What is the scientific method, and how does this system use it for verification?",
    expect: {
      intent_domain: "hybrid",
      intent_id: "hybrid.concept_plus_system_mapping",
      min_coverage_ratio: 0.25,
    },
  },
  {
    id: "hybrid_composite_1",
    label: "Composite system synthesis",
    family: "hybrid",
    question:
      "Using the repo, synthesize how save-the-Sun planning, warp viability, ideology gates, and uncertainty mechanics fit together.",
    expect: {
      intent_domain: "hybrid",
      intent_id: "hybrid.composite_system_synthesis",
      min_coverage_ratio: 0.3,
    },
  },
  {
    id: "general_epistemology_1",
    label: "General conceptual",
    family: "general",
    question: "What is epistemology and why does it matter?",
    expect: {
      intent_domain: "general",
      intent_id: "general.conceptual_define_compare",
    },
  },
];

const seedFromString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const resolveSeed = (): number => {
  const raw = process.env.HELIX_ASK_PATCH_PROBE_SEED?.trim();
  if (raw) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return Math.floor(parsed) >>> 0;
    return seedFromString(raw);
  }
  return seedFromString(`${Date.now()}:${process.pid}:${Math.random()}`);
};

const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleWithSeed = <T>(items: T[], seed: number): T[] => {
  const rng = mulberry32(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
};

const sampleCases = (cases: ProbeCase[], count: number, seed: number): ProbeCase[] => {
  if (count >= cases.length) {
    return shuffleWithSeed(cases, seed);
  }

  const families: ProbeFamily[] = [
    "ideology_social",
    "repo_technical",
    "hybrid",
    "general",
  ];
  const selected: ProbeCase[] = [];
  const selectedIds = new Set<string>();

  const familyPools = new Map<ProbeFamily, ProbeCase[]>(
    families.map((family, index) => [
      family,
      shuffleWithSeed(
        cases.filter((entry) => entry.family === family),
        seed + index + 1,
      ),
    ]),
  );

  for (const family of families) {
    if (selected.length >= count) break;
    const candidate = (familyPools.get(family) ?? [])[0];
    if (candidate) {
      selected.push(candidate);
      selectedIds.add(candidate.id);
    }
  }

  if (selected.length >= count) return selected.slice(0, count);

  const remainder = shuffleWithSeed(
    cases.filter((entry) => !selectedIds.has(entry.id)),
    seed + 99,
  );
  for (const entry of remainder) {
    if (selected.length >= count) break;
    selected.push(entry);
  }
  return selected;
};

const readPlanContext = async (): Promise<{
  loaded: boolean;
  sha256?: string;
}> => {
  try {
    const raw = await fs.readFile(PLAN_PATH, "utf8");
    const sha256 = crypto.createHash("sha256").update(raw).digest("hex");
    return { loaded: true, sha256 };
  } catch {
    return { loaded: false };
  }
};

const askOne = async (entry: ProbeCase, runId: string): Promise<ProbeResult> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const started = Date.now();
  try {
    const response = await fetch(ASK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        question: entry.question,
        debug: true,
        verbosity: "extended",
        sessionId: runId,
        max_tokens: 400,
        temperature: 0.2,
      }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return {
        id: entry.id,
        label: entry.label,
        family: entry.family,
        question: entry.question,
        ok: false,
        failures: [
          `request_failed:${response.status}${detail ? `:${detail.slice(0, 200)}` : ""}`,
        ],
        duration_ms: Date.now() - started,
        debug: null,
      };
    }
    const payload = (await response.json()) as AskResponse;
    const debug = payload.debug ?? {};
    const failures: string[] = [];

    if (!payload.text || payload.text.trim().length < 32) {
      failures.push("answer_too_short");
    }

    if (entry.expect.intent_domain) {
      const got = debug.intent_domain ?? "";
      if (got !== entry.expect.intent_domain) {
        failures.push(`intent_domain:${got || "missing"}!=${entry.expect.intent_domain}`);
      }
    }

    if (entry.expect.intent_id) {
      const got = debug.intent_id ?? "";
      if (got !== entry.expect.intent_id) {
        failures.push(`intent_id:${got || "missing"}!=${entry.expect.intent_id}`);
      }
    }

    if (entry.expect.forbid_concept_ids?.length) {
      const concept = String(debug.concept_id ?? "");
      if (entry.expect.forbid_concept_ids.includes(concept)) {
        failures.push(`forbidden_concept_id:${concept}`);
      }
    }

    if (entry.expect.require_context_contains?.length) {
      const contextFiles = Array.isArray(debug.context_files)
        ? debug.context_files.map((value) => String(value))
        : [];
      for (const required of entry.expect.require_context_contains) {
        const hit = contextFiles.some((filePath) => filePath.includes(required));
        if (!hit) {
          failures.push(`missing_context:${required}`);
        }
      }
    }

    if (typeof entry.expect.min_coverage_ratio === "number") {
      const coverage = Number(debug.coverage_ratio);
      if (!Number.isFinite(coverage) || coverage < entry.expect.min_coverage_ratio) {
        failures.push(
          `coverage_ratio:${Number.isFinite(coverage) ? coverage.toFixed(3) : "missing"}<${entry.expect.min_coverage_ratio.toFixed(3)}`,
        );
      }
    }

    if (typeof entry.expect.max_belief_unsupported_rate === "number") {
      const belief = Number(debug.belief_unsupported_rate);
      if (
        Number.isFinite(belief) &&
        belief > entry.expect.max_belief_unsupported_rate
      ) {
        failures.push(
          `belief_unsupported_rate:${belief.toFixed(3)}>${entry.expect.max_belief_unsupported_rate.toFixed(3)}`,
        );
      }
    }

    return {
      id: entry.id,
      label: entry.label,
      family: entry.family,
      question: entry.question,
      ok: failures.length === 0,
      failures,
      duration_ms: Date.now() - started,
      debug: {
        intent_id: debug.intent_id,
        intent_domain: debug.intent_domain,
        concept_id: String(debug.concept_id ?? ""),
        coverage_ratio:
          typeof debug.coverage_ratio === "number" ? debug.coverage_ratio : undefined,
        belief_unsupported_rate:
          typeof debug.belief_unsupported_rate === "number"
            ? debug.belief_unsupported_rate
            : undefined,
        context_files_count: Array.isArray(debug.context_files)
          ? debug.context_files.length
          : 0,
      },
    };
  } catch (error) {
    const message =
      (error as { message?: string })?.message ??
      (typeof error === "string" ? error : "fetch_failed");
    return {
      id: entry.id,
      label: entry.label,
      family: entry.family,
      question: entry.question,
      ok: false,
      failures: [message],
      duration_ms: Date.now() - started,
      debug: null,
    };
  } finally {
    clearTimeout(timeout);
  }
};

const buildReportMarkdown = (summary: ProbeSummary, results: ProbeResult[]): string => {
  const failed = results.filter((entry) => !entry.ok);
  const lines: string[] = [
    "# Helix Ask Patch Probe Report",
    "",
    `- run_id: ${summary.run_id}`,
    `- generated_at: ${summary.generated_at}`,
    `- base_url: ${summary.base_url}`,
    `- seed: ${summary.seed}`,
    `- sample_count: ${summary.sample_count}`,
    `- pass_rate: ${(summary.pass_rate * 100).toFixed(1)}%`,
    `- plan_context_loaded: ${String(summary.plan_context.loaded)}`,
    `- plan_context_sha256: ${summary.plan_context.sha256 ?? "missing"}`,
    "",
    "## Family Stats",
    "| family | total | pass | fail | pass_rate |",
    "|---|---:|---:|---:|---:|",
    ...summary.family_stats.map(
      (entry) =>
        `| ${entry.family} | ${entry.total} | ${entry.pass} | ${entry.fail} | ${(entry.pass_rate * 100).toFixed(1)}% |`,
    ),
    "",
    "## Failed Cases",
  ];

  if (!failed.length) {
    lines.push("- none");
  } else {
    for (const entry of failed) {
      lines.push(`### ${entry.label} (${entry.id})`);
      lines.push(`- family: ${entry.family}`);
      lines.push(`- failures: ${entry.failures.join(", ")}`);
      lines.push(`- intent_id: ${entry.debug?.intent_id ?? "missing"}`);
      lines.push(`- intent_domain: ${entry.debug?.intent_domain ?? "missing"}`);
      lines.push(`- concept_id: ${entry.debug?.concept_id ?? "missing"}`);
      lines.push(`- coverage_ratio: ${entry.debug?.coverage_ratio ?? "missing"}`);
      lines.push(
        `- belief_unsupported_rate: ${entry.debug?.belief_unsupported_rate ?? "missing"}`,
      );
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
};

async function main(): Promise<void> {
  const seed = resolveSeed();
  const runId = `helix-ask-patch-probe:${Date.now()}:${seed}`;
  const sampledCases = sampleCases(PROBE_BANK, SAMPLE_COUNT, seed);
  const planContext = await readPlanContext();

  if (REQUIRE_PLAN_CONTEXT && !planContext.loaded) {
    throw new Error(`Required plan context file not found: ${PLAN_PATH}`);
  }

  const results: ProbeResult[] = [];
  for (const entry of sampledCases) {
    console.log(`Running patch probe case: ${entry.label}`);
    const result = await askOne(entry, runId);
    results.push(result);
  }

  const passCount = results.filter((entry) => entry.ok).length;
  const failCount = results.length - passCount;

  const families: ProbeFamily[] = [
    "ideology_social",
    "repo_technical",
    "hybrid",
    "general",
  ];
  const familyStats = families
    .map((family) => {
      const scoped = results.filter((entry) => entry.family === family);
      const pass = scoped.filter((entry) => entry.ok).length;
      const total = scoped.length;
      return {
        family,
        total,
        pass,
        fail: total - pass,
        pass_rate: total > 0 ? pass / total : 0,
      };
    })
    .filter((entry) => entry.total > 0);

  const stamp = new Date().toISOString().replace(/[:.]/g, "");
  const outDir = path.resolve(OUTPUT_ROOT, stamp);
  await fs.mkdir(outDir, { recursive: true });

  const summary: ProbeSummary = {
    schema_version: "helix_ask_patch_probe/1",
    run_id: runId,
    generated_at: new Date().toISOString(),
    base_url: BASE_URL,
    ask_url: ASK_URL,
    seed,
    sample_count: sampledCases.length,
    total_cases_available: PROBE_BANK.length,
    pass_count: passCount,
    fail_count: failCount,
    pass_rate: sampledCases.length > 0 ? passCount / sampledCases.length : 0,
    plan_context: {
      path: PLAN_PATH,
      required: REQUIRE_PLAN_CONTEXT,
      loaded: planContext.loaded,
      sha256: planContext.sha256,
    },
    family_stats: familyStats,
    artifacts: {
      output_dir: outDir,
      results_json: path.resolve(outDir, "results.json"),
      summary_json: path.resolve(outDir, "summary.json"),
      report_md: path.resolve(outDir, "report.md"),
    },
  };

  const report = buildReportMarkdown(summary, results);
  await fs.writeFile(summary.artifacts.results_json, `${JSON.stringify(results, null, 2)}\n`, "utf8");
  await fs.writeFile(summary.artifacts.summary_json, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await fs.writeFile(summary.artifacts.report_md, report, "utf8");

  console.log(
    `Patch probe summary: pass=${summary.pass_count}/${summary.sample_count} fail=${summary.fail_count} passRate=${(summary.pass_rate * 100).toFixed(1)}%`,
  );
  console.log(`Artifacts: ${summary.artifacts.output_dir}`);

  if (FAIL_ON_MISS && summary.fail_count > 0) {
    process.exit(1);
  }
}

const isEntrypoint =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isEntrypoint) {
  main().catch((error) => {
    console.error("[helix-ask-patch-probe] failed:", error);
    process.exit(1);
  });
}
