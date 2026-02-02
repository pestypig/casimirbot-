type HelixAskDebug = {
  intent_id?: string;
  intent_domain?: string;
  format?: string;
  stage_tags?: boolean;
};

type AskResponse = {
  text?: string;
  debug?: HelixAskDebug;
};

type RegressionCase = {
  label: string;
  question: string;
  expect: {
    intent_id: string;
    intent_domain: string;
    format: string;
    stage_tags?: boolean;
    clarify?: boolean;
    ambiguity?: {
      targetSpan?: string;
      requireClusters?: boolean;
    };
  };
};

const BASE_URL =
  process.env.HELIX_ASK_BASE_URL ??
  process.env.EVAL_BASE_URL ??
  "http://localhost:5173";

const ASK_URL = new URL("/api/agi/ask", BASE_URL).toString();
const REQUEST_TIMEOUT_MS = Number(process.env.HELIX_ASK_REGRESSION_TIMEOUT_MS ?? 45000);
const ALLOW_FAIL = process.env.HELIX_ASK_REGRESSION_ALLOW_FAIL === "1";
const DRY_RUN = process.env.HELIX_ASK_REGRESSION_DRY_RUN === "1";
const LIGHT_MODE = process.env.HELIX_ASK_REGRESSION_LIGHT === "1";
const ONLY_LABEL = process.env.HELIX_ASK_REGRESSION_ONLY?.trim();
const AMBIGUITY_MODE = process.env.HELIX_ASK_REGRESSION_AMBIGUITY === "1";
const normalizeLabel = (value: string): string =>
  value.toLowerCase().replace(/[\s_-]+/g, "_");
const normalizeToken = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const cases: RegressionCase[] = [
  {
    label: "general conceptual",
    question: "What is epistemology and why does it matter?",
    expect: {
      intent_id: "general.conceptual_define_compare",
      intent_domain: "general",
      format: "compare",
    },
  },
  {
    label: "hybrid concept + system",
    question:
      "What is the scientific method, and how does this system use it for verification?",
    expect: {
      intent_id: "hybrid.concept_plus_system_mapping",
      intent_domain: "hybrid",
      format: "compare",
      stage_tags: false,
    },
  },
  {
    label: "repo pipeline",
    question: "How does the Helix Ask pipeline work in this repo?",
    expect: {
      intent_id: "repo.helix_ask_pipeline_explain",
      intent_domain: "repo",
      format: "steps",
      stage_tags: false,
    },
  },
  {
    label: "composite synthesis",
    question:
      "Using the repo, synthesize how the save-the-Sun plan, warp-bubble viability, ideology/ledger gates, and the wavefunction/uncertainty business model fit together. Two short paragraphs; second must cite repo files.",
    expect: {
      intent_id: "hybrid.composite_system_synthesis",
      intent_domain: "hybrid",
      format: "compare",
      stage_tags: false,
    },
  },
  {
    label: "repo debugging",
    question: "This repo throws an error on startup. How do I fix it?",
    expect: {
      intent_id: "repo.repo_debugging_root_cause",
      intent_domain: "repo",
      format: "steps",
      stage_tags: false,
    },
  },
  {
    label: "repo change request",
    question: "Update this repo to add a new API endpoint.",
    expect: {
      intent_id: "repo.repo_change_request",
      intent_domain: "repo",
      format: "steps",
      stage_tags: false,
    },
  },
];

const ambiguityCases: RegressionCase[] = [
  {
    label: "ambiguity lattice",
    question: "Define lattice.",
    expect: {
      intent_id: "general.conceptual_define_compare",
      intent_domain: "general",
      format: "compare",
      clarify: true,
      ambiguity: {
        targetSpan: "lattice",
        requireClusters: false,
      },
    },
  },
  {
    label: "ambiguity cavity",
    question: "What's a cavity?",
    expect: {
      intent_id: "general.conceptual_define_compare",
      intent_domain: "general",
      format: "compare",
      clarify: true,
      ambiguity: {
        targetSpan: "cavity",
        requireClusters: false,
      },
    },
  },
  {
    label: "ambiguity warp bubble repo",
    question: "What is a warp bubble in this codebase?",
    expect: {
      intent_id: "repo.warp_definition_docs_first",
      intent_domain: "repo",
      format: "brief",
      clarify: false,
      ambiguity: {
        targetSpan: "warp bubble",
        requireClusters: false,
      },
    },
  },
];

const resolvedCases = LIGHT_MODE ? cases.slice(0, 3) : cases;
const expandedCases = AMBIGUITY_MODE ? [...resolvedCases, ...ambiguityCases] : resolvedCases;
const finalCases = ONLY_LABEL
  ? expandedCases.filter((entry) => normalizeLabel(entry.label) === normalizeLabel(ONLY_LABEL))
  : expandedCases;

const runCase = async (entry: RegressionCase, sessionId: string): Promise<string[]> => {
  console.log(`Running: ${entry.label}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(ASK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        question: entry.question,
      debug: true,
      sessionId,
      max_tokens: 256,
      temperature: 0.2,
      dryRun: DRY_RUN,
    }),
  });
  } catch (error) {
    clearTimeout(timeout);
    const name = (error as { name?: string })?.name ?? "fetch_failed";
    const message =
      (error as { message?: string })?.message ??
      (typeof error === "string" ? error : "");
    const label = name === "AbortError" ? "timeout" : name;
    const detail = message ? `: ${message}` : "";
    return [`${entry.label}: request failed (${label})${detail}`];
  }
  clearTimeout(timeout);
  if (!response.ok) {
    let detail = "";
    try {
      const text = await response.text();
      detail = text ? `: ${text.slice(0, 240)}` : "";
    } catch {
      // ignore
    }
    return [`${entry.label}: request failed (${response.status})${detail}`];
  }
  const payload = (await response.json()) as AskResponse;
  const failures: string[] = [];
  if (!DRY_RUN && (!payload.text || !payload.text.trim())) {
    failures.push(`${entry.label}: empty response text`);
  }
  if (!payload.debug) {
    failures.push(`${entry.label}: missing debug payload`);
    return failures;
  }
  if (payload.debug.intent_id !== entry.expect.intent_id) {
    failures.push(
      `${entry.label}: intent_id ${payload.debug.intent_id ?? "missing"} !== ${entry.expect.intent_id}`,
    );
  }
  if (payload.debug.intent_domain !== entry.expect.intent_domain) {
    failures.push(
      `${entry.label}: intent_domain ${payload.debug.intent_domain ?? "missing"} !== ${entry.expect.intent_domain}`,
    );
  }
  if (payload.debug.format !== entry.expect.format) {
    failures.push(
      `${entry.label}: format ${payload.debug.format ?? "missing"} !== ${entry.expect.format}`,
    );
  }
  if (typeof entry.expect.stage_tags === "boolean") {
    if (payload.debug.stage_tags !== entry.expect.stage_tags) {
      failures.push(
        `${entry.label}: stage_tags ${payload.debug.stage_tags ?? "missing"} !== ${entry.expect.stage_tags}`,
      );
    }
  }
  if (typeof entry.expect.clarify === "boolean") {
    const clarified = Boolean(payload.debug.clarify_triggered);
    if (clarified !== entry.expect.clarify) {
      failures.push(`${entry.label}: clarify ${clarified} !== ${entry.expect.clarify}`);
    }
  }
  if (entry.expect.ambiguity?.targetSpan) {
    const got = payload.debug.ambiguity_target_span ?? "";
    if (normalizeToken(got) !== normalizeToken(entry.expect.ambiguity.targetSpan)) {
      failures.push(
        `${entry.label}: ambiguity_target_span ${got || "missing"} !== ${entry.expect.ambiguity.targetSpan}`,
      );
    }
  }
  if (entry.expect.ambiguity?.requireClusters) {
    const count = payload.debug.ambiguity_cluster_count ?? 0;
    if (count <= 0) {
      failures.push(`${entry.label}: ambiguity_cluster_count ${count} <= 0`);
    }
  }
  return failures;
};

async function main(): Promise<void> {
  const sessionId = `helix-ask-regression:${Date.now()}`;
  const failures: string[] = [];
  for (const entry of finalCases) {
    const caseFailures = await runCase(entry, sessionId);
    failures.push(...caseFailures);
  }

  if (failures.length) {
    console.error("Helix Ask regression failures:");
    failures.forEach((line) => console.error(`- ${line}`));
    process.exit(ALLOW_FAIL ? 0 : 1);
  }
  console.log("Helix Ask regression passed.");
}

main().catch((error) => {
  console.error("[helix-ask-regression] failed:", error);
  process.exit(1);
});
