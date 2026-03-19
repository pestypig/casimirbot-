type HelixAskDebug = {
  intent_id?: string;
  intent_domain?: string;
  format?: string;
  stage_tags?: boolean;
  clarify_triggered?: boolean;
  ambiguity_target_span?: string;
  ambiguity_cluster_count?: number;
  open_world_bypass_mode?: "off" | "active";
  alignment_gate_decision?: "PASS" | "BORDERLINE" | "FAIL";
  frontier_theory_lens_active?: boolean;
  stage05_used?: boolean;
  stage05_card_count?: number;
  stage05_summary_hard_fail?: boolean;
  stage05_summary_fail_reason?: string | null;
  stage05_fallback_reason?: string | null;
  stage05_slot_coverage?: {
    ratio?: number;
    missing?: string[];
  } | null;
  composer_v2_applied?: boolean;
  composer_schema_valid?: boolean;
  composer_validation_fail_reason?: string | null;
  llm_error_code?: string | null;
};

type AskResponse = {
  text?: string;
  debug?: HelixAskDebug;
};

type RegressionCase = {
  label: string;
  question: string;
  expect: {
    intent_id?: string;
    intent_domain?: string;
    format?: string;
    stage_tags?: boolean;
    clarify?: boolean;
    ambiguity?: {
      targetSpan?: string;
      requireClusters?: boolean;
    };
    mustIncludeText?: string[];
    mustNotIncludeText?: string[];
    liveContract?: {
      requireRepoGrounding?: boolean;
      minStage05Coverage?: number;
      requireSourcesLine?: boolean;
      requireFiveSectionShape?: boolean;
      allowLlmError?: boolean;
    };
  };
};

type SessionContinuityCase = {
  label: string;
  firstQuestion: string;
  followupQuestion: string;
  expect: {
    intent_id: string;
    intent_domain: string;
    mustIncludeText?: string[];
    mustNotIncludeText?: string[];
  };
};

const BASE_URL =
  process.env.HELIX_ASK_BASE_URL ??
  process.env.EVAL_BASE_URL ??
  "http://localhost:5050";

const ASK_URL = new URL("/api/agi/ask", BASE_URL).toString();
const REQUEST_TIMEOUT_MS = Number(process.env.HELIX_ASK_REGRESSION_TIMEOUT_MS ?? 45000);
const ALLOW_FAIL = process.env.HELIX_ASK_REGRESSION_ALLOW_FAIL === "1";
const DRY_RUN = process.env.HELIX_ASK_REGRESSION_DRY_RUN === "1";
const LIGHT_MODE = process.env.HELIX_ASK_REGRESSION_LIGHT === "1";
const ONLY_LABEL = process.env.HELIX_ASK_REGRESSION_ONLY?.trim();
const AMBIGUITY_MODE = process.env.HELIX_ASK_REGRESSION_AMBIGUITY === "1";
const IDEOLOGY_MODE = process.env.HELIX_ASK_REGRESSION_IDEOLOGY === "1";
const FRONTIER_CONTINUITY_MODE =
  process.env.HELIX_ASK_REGRESSION_FRONTIER_CONTINUITY !== "0";
const INCLUDE_CONTINUITY_WITH_ONLY =
  process.env.HELIX_ASK_REGRESSION_INCLUDE_CONTINUITY_WITH_ONLY === "1";
const STRICT_ROUTING = process.env.HELIX_ASK_REGRESSION_STRICT_ROUTING === "1";
const MIN_STAGE05_COVERAGE_DEFAULT = Number(
  process.env.HELIX_ASK_REGRESSION_MIN_STAGE05_COVERAGE ?? 0.6,
);
const REQUIRE_FIVE_SECTION_DEFAULT =
  process.env.HELIX_ASK_REGRESSION_REQUIRE_FIVE_SECTION !== "0";
const ROUTING_WARNINGS: string[] = [];
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
      liveContract: {
        requireRepoGrounding: true,
        requireSourcesLine: true,
      },
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
      liveContract: {
        requireRepoGrounding: true,
        requireSourcesLine: true,
      },
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
      liveContract: {
        requireRepoGrounding: true,
        requireSourcesLine: true,
      },
    },
  },
  {
    label: "warp mechanism assembly",
    question: "How is the warp bubble solved in the codebase?",
    expect: {
      intent_domain: "repo",
      format: "brief",
      stage_tags: false,
      mustIncludeText: [
        "Short answer:",
        "Conceptual baseline:",
        "How repo solves it:",
        "Evidence + proof anchors:",
        "Uncertainty / open gaps:",
      ],
      mustNotIncludeText: [
        "Answer grounded in retrieved evidence.",
        "Runtime fallback: fetch failed",
        "Reasoning event log",
        "traceId=ask:",
      ],
      liveContract: {
        requireRepoGrounding: true,
        requireSourcesLine: true,
        requireFiveSectionShape: true,
      },
    },
  },
  {
    label: "open-world bypass uncertainty",
    question: "How can I protect myself from AI-driven financial fraud?",
    expect: {
      intent_id: "general.conceptual_define_compare",
      intent_domain: "general",
      format: "compare",
      mustIncludeText: ["open-world best-effort", "explicit uncertainty"],
      mustNotIncludeText: ["Sources:", "Tree Walk", "Ask debug", "Execution log"],
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
      liveContract: {
        requireRepoGrounding: true,
        requireSourcesLine: true,
      },
      ambiguity: {
        targetSpan: "warp bubble",
        requireClusters: false,
      },
    },
  },
];


const ideologyNarrativeCases: RegressionCase[] = [
  {
    label: "ideology baseline narrative",
    question:
      "In plain language, how does Feedback Loop Hygiene affect society in the Ideology tree? Do this in a conversational tone for a non-technical reader, but keep it grounded in repo context. Include one short opening paragraph, a root-to-leaf narrative chain, a concrete real-world example, and one concise takeaway with societal impact. Do not return technical notes mode unless explicitly requested.",
    expect: {
      intent_id: "repo.ideology_reference",
      intent_domain: "repo",
      format: "brief",
      stage_tags: false,
      mustIncludeText: [
        "Mission Ethos",
        "Feedback Loop Hygiene",
        "example",
        "takeaway",
      ],
      mustNotIncludeText: ["Technical notes:"],
    },
  },
  {
    label: "ideology root-to-leaf stress",
    question:
      "Explain Feedback Loop Hygiene as the root-to-leaf path in Ideology for how a town council should handle online rumor spikes. Include how it links to Civic Signal Loop and Three Tenets Loop.",
    expect: {
      intent_id: "repo.ideology_reference",
      intent_domain: "repo",
      format: "brief",
      stage_tags: false,
      mustIncludeText: ["Civic Signal Loop", "Three Tenets Loop", "town council"],
      mustNotIncludeText: ["Technical notes:"],
    },
  },
  {
    label: "ideology regression compare resistance",
    question:
      "How does Feedback Loop Hygiene affect society? Answer in the new default narrative style only. If you are about to output a Technical notes compare/report format, switch to a plain-language narrative first.",
    expect: {
      intent_id: "repo.ideology_reference",
      intent_domain: "repo",
      format: "brief",
      stage_tags: false,
      mustNotIncludeText: ["Technical notes:", "compare/report"],
    },
  },
  {
    label: "ideology context control",
    question:
      "What is Feedback Loop Hygiene? Answer briefly without code-level repo details. It should be understandable to someone new to the project.",
    expect: {
      intent_id: "repo.ideology_reference",
      intent_domain: "repo",
      format: "brief",
      stage_tags: false,
      mustNotIncludeText: ["Technical notes:", "server/", "client/"],
    },
  },
];

const frontierContinuityCases: SessionContinuityCase[] = [
  {
    label: "frontier continuity followup",
    firstQuestion: "Is the sun conscious under Orch-OR style reasoning?",
    followupQuestion: "What in the reasoning ladder should we focus on since this is the case?",
    expect: {
      intent_id: "falsifiable.frontier_consciousness_theory_lens",
      intent_domain: "falsifiable",
      mustIncludeText: [
        "Definitions:",
        "Baseline:",
        "Hypothesis:",
        "Anti-hypothesis:",
        "Falsifiers:",
        "Uncertainty band:",
        "Claim tier:",
      ],
      mustNotIncludeText: ["Execution log", "Ask debug", "Runtime fallback: fetch failed"],
    },
  },
];

const resolvedCases = LIGHT_MODE ? cases.slice(0, 3) : cases;
const withAmbiguityCases = AMBIGUITY_MODE ? [...resolvedCases, ...ambiguityCases] : resolvedCases;
const expandedCases = IDEOLOGY_MODE
  ? [...withAmbiguityCases, ...ideologyNarrativeCases]
  : withAmbiguityCases;
const finalCases = ONLY_LABEL
  ? expandedCases.filter((entry) => normalizeLabel(entry.label) === normalizeLabel(ONLY_LABEL))
  : expandedCases;

const toFiniteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const hasFiveSectionShape = (text: string): boolean => {
  const required = [
    "short answer:",
    "conceptual baseline:",
    "how repo solves it:",
    "evidence + proof anchors:",
    "uncertainty / open gaps:",
  ];
  const normalized = text.toLowerCase();
  return required.every((heading) => normalized.includes(heading));
};

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
        verbosity: "extended",
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
  const routeMismatch = (message: string): void => {
    if (STRICT_ROUTING) failures.push(message);
    else ROUTING_WARNINGS.push(message);
  };
  if (entry.expect.intent_id && payload.debug.intent_id !== entry.expect.intent_id) {
    routeMismatch(
      `${entry.label}: intent_id ${payload.debug.intent_id ?? "missing"} !== ${entry.expect.intent_id}`,
    );
  }
  if (entry.expect.intent_domain && payload.debug.intent_domain !== entry.expect.intent_domain) {
    routeMismatch(
      `${entry.label}: intent_domain ${payload.debug.intent_domain ?? "missing"} !== ${entry.expect.intent_domain}`,
    );
  }
  if (entry.expect.format && payload.debug.format !== entry.expect.format) {
    routeMismatch(
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

  const text = payload.text ?? "";
  const textLower = text.toLowerCase();
  for (const snippet of entry.expect.mustIncludeText ?? []) {
    if (!textLower.includes(snippet.toLowerCase())) {
      failures.push(`${entry.label}: response missing required text snippet "${snippet}"`);
    }
  }
  for (const snippet of entry.expect.mustNotIncludeText ?? []) {
    if (textLower.includes(snippet.toLowerCase())) {
      failures.push(`${entry.label}: response included forbidden text snippet "${snippet}"`);
    }
  }

  const liveContract = entry.expect.liveContract;
  if (liveContract?.requireRepoGrounding) {
    const stage05Used = payload.debug.stage05_used === true;
    const stage05Cards = Math.max(0, Math.floor(toFiniteNumber(payload.debug.stage05_card_count) ?? 0));
    const stage05Coverage = toFiniteNumber(payload.debug.stage05_slot_coverage?.ratio) ?? null;
    const minCoverage = Number.isFinite(liveContract.minStage05Coverage ?? NaN)
      ? Math.max(0, Math.min(1, Number(liveContract.minStage05Coverage)))
      : Math.max(0, Math.min(1, MIN_STAGE05_COVERAGE_DEFAULT));
    if (!stage05Used) {
      failures.push(`${entry.label}: stage05_used was not true for repo-grounded contract`);
    }
    if (stage05Cards <= 0) {
      failures.push(`${entry.label}: stage05_card_count ${stage05Cards} <= 0 for repo-grounded contract`);
    }
    if (stage05Coverage === null || stage05Coverage < minCoverage) {
      failures.push(
        `${entry.label}: stage05_slot_coverage ratio ${stage05Coverage ?? "missing"} < ${minCoverage.toFixed(2)}`,
      );
    }
    if (payload.debug.stage05_summary_hard_fail === true) {
      failures.push(
        `${entry.label}: stage05_summary_hard_fail true (${payload.debug.stage05_summary_fail_reason ?? "unknown"})`,
      );
    }
    const llmError = String(payload.debug.llm_error_code ?? "").trim();
    if (llmError && liveContract.allowLlmError !== true) {
      failures.push(`${entry.label}: llm_error_code present (${llmError})`);
    }
  }

  if (liveContract?.requireSourcesLine && !/\bsources:\s*/i.test(text)) {
    failures.push(`${entry.label}: response missing Sources line`);
  }

  const requireFiveSectionShape =
    liveContract?.requireFiveSectionShape === true ||
    (liveContract?.requireFiveSectionShape !== false && REQUIRE_FIVE_SECTION_DEFAULT && Boolean(liveContract));
  if (requireFiveSectionShape && !hasFiveSectionShape(text)) {
    failures.push(`${entry.label}: response missing non-equation five-section shape`);
  }

  return failures;
};

const runSessionContinuityCase = async (
  entry: SessionContinuityCase,
): Promise<string[]> => {
  console.log(`Running: ${entry.label}`);
  const sessionId = `helix-ask-regression:continuity:${Date.now()}`;
  const failures: string[] = [];
  const doAsk = async (question: string): Promise<AskResponse | null> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(ASK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          question,
          debug: true,
          verbosity: "extended",
          sessionId,
          max_tokens: 256,
          temperature: 0.2,
          dryRun: DRY_RUN,
        }),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        failures.push(
          `${entry.label}: request failed (${response.status})${text ? `: ${text.slice(0, 240)}` : ""}`,
        );
        return null;
      }
      return (await response.json()) as AskResponse;
    } catch (error) {
      const name = (error as { name?: string })?.name ?? "fetch_failed";
      const message =
        (error as { message?: string })?.message ??
        (typeof error === "string" ? error : "");
      const label = name === "AbortError" ? "timeout" : name;
      failures.push(`${entry.label}: request failed (${label})${message ? `: ${message}` : ""}`);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  };

  const first = await doAsk(entry.firstQuestion);
  if (!first) return failures;
  const followup = await doAsk(entry.followupQuestion);
  if (!followup) return failures;
  if (!followup.debug) {
    failures.push(`${entry.label}: missing debug payload`);
    return failures;
  }
  if (followup.debug.intent_id !== entry.expect.intent_id) {
    const message = `${entry.label}: intent_id ${followup.debug.intent_id ?? "missing"} !== ${entry.expect.intent_id}`;
    if (STRICT_ROUTING) failures.push(message);
    else ROUTING_WARNINGS.push(message);
  }
  if (followup.debug.intent_domain !== entry.expect.intent_domain) {
    const message = `${entry.label}: intent_domain ${followup.debug.intent_domain ?? "missing"} !== ${entry.expect.intent_domain}`;
    if (STRICT_ROUTING) failures.push(message);
    else ROUTING_WARNINGS.push(message);
  }
  if (followup.debug.frontier_theory_lens_active !== true) {
    failures.push(`${entry.label}: frontier_theory_lens_active not true on followup`);
  }
  const text = followup.text ?? "";
  const textLower = text.toLowerCase();
  for (const snippet of entry.expect.mustIncludeText ?? []) {
    if (!textLower.includes(snippet.toLowerCase())) {
      failures.push(`${entry.label}: response missing required text snippet "${snippet}"`);
    }
  }
  for (const snippet of entry.expect.mustNotIncludeText ?? []) {
    if (textLower.includes(snippet.toLowerCase())) {
      failures.push(`${entry.label}: response included forbidden text snippet "${snippet}"`);
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
  const shouldRunContinuity =
    FRONTIER_CONTINUITY_MODE && (!ONLY_LABEL || INCLUDE_CONTINUITY_WITH_ONLY);
  if (shouldRunContinuity) {
    for (const entry of frontierContinuityCases) {
      const caseFailures = await runSessionContinuityCase(entry);
      failures.push(...caseFailures);
    }
  }

  if (failures.length) {
    console.error("Helix Ask regression failures:");
    failures.forEach((line) => console.error(`- ${line}`));
    if (ROUTING_WARNINGS.length > 0) {
      console.error("Helix Ask regression routing warnings:");
      ROUTING_WARNINGS.forEach((line) => console.error(`- ${line}`));
    }
    process.exit(ALLOW_FAIL ? 0 : 1);
  }
  if (ROUTING_WARNINGS.length > 0) {
    console.warn("Helix Ask regression routing warnings:");
    ROUTING_WARNINGS.forEach((line) => console.warn(`- ${line}`));
  }
  console.log("Helix Ask regression passed.");
}

main().catch((error) => {
  console.error("[helix-ask-regression] failed:", error);
  process.exit(1);
});
