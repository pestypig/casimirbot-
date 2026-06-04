import type {
  HelixAskDepth,
  TheoryToolAdmissionDecision,
  TheoryToolKind,
} from "../../../../shared/helix-theory-congruence-trace";

export type BuildTheoryToolAdmissionPlanInput = {
  prompt: string;
  depth: HelixAskDepth;
  hasCalculatorRows?: boolean;
  hasRepoSourceRefs?: boolean;
  hasExactPaperId?: boolean;
  hasCurrentInfoCue?: boolean;
  featureFlagMode?: "off" | "shadow" | "on";
};

const ALL_TOOLS: TheoryToolKind[] = [
  "theory_badge_graph",
  "physics_atlas",
  "calculator_loadout",
  "repo_search",
  "docs_viewer",
  "scholarly_probe",
  "web_current",
  "benchmark_runner",
  "forbidden_claim_scan",
];

function cue(prompt: string, pattern: RegExp): string | undefined {
  const match = prompt.match(pattern);
  return match?.[0];
}

function decision(args: TheoryToolAdmissionDecision): TheoryToolAdmissionDecision {
  return args;
}

function blockedBecauseShadow(tool: TheoryToolKind, reason: string): TheoryToolAdmissionDecision {
  return decision({
    tool,
    status: "blocked",
    required: false,
    reason,
    blocked_reason: "feature_flag_shadow_mode_no_tool_execution",
  });
}

export function buildTheoryToolAdmissionPlan(
  input: BuildTheoryToolAdmissionPlanInput,
): TheoryToolAdmissionDecision[] {
  const mode = input.featureFlagMode ?? "shadow";
  const prompt = input.prompt;
  const decisions = new Map<TheoryToolKind, TheoryToolAdmissionDecision>();
  const set = (entry: TheoryToolAdmissionDecision) => decisions.set(entry.tool, entry);

  if (input.depth === "direct") {
    for (const tool of ALL_TOOLS) {
      set(decision({
        tool,
        status: tool === "forbidden_claim_scan" ? "admitted" : "not_applicable",
        required: tool === "forbidden_claim_scan",
        reason: tool === "forbidden_claim_scan"
          ? "lightweight claim scan remains safe for direct answers"
          : "direct depth has no mandatory evidence tool",
      }));
    }
    return ALL_TOOLS.map((tool) => decisions.get(tool) as TheoryToolAdmissionDecision);
  }

  set(decision({
    tool: "theory_badge_graph",
    status: "admitted",
    required: true,
    reason: "theory prompts require badge graph orientation before synthesis",
    prompt_cue: cue(prompt, /theory graph|badge graph|first principles|traceable/i),
  }));

  set(decision({
    tool: "physics_atlas",
    status: input.depth === "source_grounded" ? "admitted" : "admitted",
    required: input.depth !== "source_grounded",
    reason: input.depth === "source_grounded"
      ? "atlas context can narrow repo and badge domains"
      : "atlas context is part of congruence or audit depth",
    prompt_cue: cue(prompt, /physics atlas|domain|coverage/i),
  }));

  set(decision({
    tool: "calculator_loadout",
    status: input.hasCalculatorRows || /calculator|calculate|testable by calculation|equation row/i.test(prompt)
      ? "admitted"
      : "skipped",
    required: /calculator|calculate|testable by calculation/i.test(prompt),
    reason: input.hasCalculatorRows
      ? "retrieved theory badges include scalar calculator payloads"
      : "no retrieved scalar calculator rows are known yet",
    prompt_cue: cue(prompt, /calculator|calculate|testable by calculation|equation row/i),
  }));

  set(decision({
    tool: "repo_search",
    status: input.hasRepoSourceRefs || /repo|source|codebase|implementation|docs/i.test(prompt)
      ? "admitted"
      : "skipped",
    required: input.depth === "source_grounded" || input.depth === "audit_deep",
    reason: input.hasRepoSourceRefs
      ? "badge graph includes repo/doc source refs to ground"
      : "repo search is only needed for project-local or audit claims",
    prompt_cue: cue(prompt, /repo|source|codebase|implementation|docs/i),
  }));

  set(decision({
    tool: "docs_viewer",
    status: /docs viewer|open doc|attached doc|this document/i.test(prompt) ? "admitted" : "not_applicable",
    required: false,
    reason: "docs viewer is admitted only when the prompt targets an attached/open document",
    prompt_cue: cue(prompt, /docs viewer|open doc|attached doc|this document/i),
  }));

  set(decision({
    tool: "scholarly_probe",
    status: input.hasExactPaperId || /arxiv|doi|paper|scholarly|literature/i.test(prompt)
      ? "admitted"
      : "skipped",
    required: /arxiv:\s*\d{4}\.\d{4,5}|doi:/i.test(prompt),
    reason: input.hasExactPaperId
      ? "exact paper identifier can be resolved into a paper observation"
      : "scholarly probe is optional unless paper evidence is requested",
    prompt_cue: cue(prompt, /arxiv:\s*\d{4}\.\d{4,5}|arxiv|doi|paper|scholarly|literature/i),
  }));

  set(input.hasCurrentInfoCue
    ? blockedBecauseShadow("web_current", "current web evidence is outside the theory trace shadow execution path")
    : decision({
        tool: "web_current",
        status: "not_applicable",
        required: false,
        reason: "no freshness/current-events cue was detected",
      }));

  set(decision({
    tool: "benchmark_runner",
    status: input.depth === "audit_deep" ? (mode === "on" ? "admitted" : "blocked") : "skipped",
    required: input.depth === "audit_deep",
    reason: input.depth === "audit_deep"
      ? "audit depth should run benchmark assertions when execution is enabled"
      : "benchmark runner is only needed for audit depth",
    blocked_reason: input.depth === "audit_deep" && mode !== "on"
      ? "feature_flag_shadow_mode_no_benchmark_execution"
      : undefined,
    prompt_cue: cue(prompt, /benchmark|regression|adversarial|audit|validate/i),
  }));

  set(decision({
    tool: "forbidden_claim_scan",
    status: "admitted",
    required: true,
    reason: "all theory depths must scan drafts or summaries for forbidden overclaiming",
    prompt_cue: cue(prompt, /claim boundary|forbidden claims|validate|prove/i),
  }));

  return ALL_TOOLS.map((tool) => decisions.get(tool) as TheoryToolAdmissionDecision);
}
