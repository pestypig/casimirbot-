import crypto from "node:crypto";

type ProbePrompt = {
  id: string;
  question: string;
};

type AskDebug = Record<string, unknown> & {
  intent_domain?: string;
  policy_prompt_family?: string;
  context_files?: string[];
  stage0_used?: boolean;
  stage05_used?: boolean;
  stage05_slot_coverage?: { ratio?: number };
  objective_loop_patch_revision?: string;
  objective_finalize_gate_mode?: string;
  objective_mini_critic_mode?: string;
  objective_assembly_mode?: string;
  objective_unknown_block_count?: number;
  objective_loop_primary_composer_guard?: boolean;
  composer_family_degrade_suppressed?: boolean;
  composer_family_degrade_suppressed_reason?: string;
  open_world_objective_tail_scrub_applied?: boolean;
  composer_soft_enforce_action?: string;
  composer_v2_fallback_reason?: string;
  composer_v2_best_attempt_stage?: string;
  objective_assembly_rescue_attempted?: boolean;
  objective_assembly_rescue_success?: boolean;
  routing_salvage_applied?: boolean;
  routing_salvage_reason?: string;
  routing_salvage_retrieval_added_count?: number;
  routing_salvage_pre_eligible?: boolean;
  routing_salvage_anchor_cue?: boolean;
  routing_salvage_objective_cue?: boolean;
  composer_v2_claim_counts?: {
    baseline_common?: number;
    repo_grounded?: number;
    reasoned_inference?: number;
  };
};

type AskResponse = {
  status?: number;
  text?: string;
  debug?: AskDebug;
};

type ProbeRow = {
  id: string;
  question: string;
  status: number | null;
  text_len: number;
  generic_template: boolean;
  novelty_score: number;
  sufficiency_score: number;
  verdict: "strong" | "partial" | "weak";
  objective_loop_patch_revision: string | null;
  intent_domain: string | null;
  policy_prompt_family: string | null;
  stage0_used: boolean | null;
  stage05_used: boolean | null;
  stage05_ratio: number | null;
  context_file_count: number;
  objective_finalize_gate_mode: string | null;
  objective_mini_critic_mode: string | null;
  objective_assembly_mode: string | null;
  objective_unknown_block_count: number | null;
  objective_loop_primary_composer_guard: boolean | null;
  composer_family_degrade_suppressed: boolean | null;
  composer_family_degrade_suppressed_reason: string | null;
  open_world_objective_tail_scrub_applied: boolean | null;
  composer_soft_enforce_action: string | null;
  composer_v2_fallback_reason: string | null;
  composer_v2_best_attempt_stage: string | null;
  objective_assembly_rescue_attempted: boolean | null;
  objective_assembly_rescue_success: boolean | null;
  routing_salvage_applied: boolean | null;
  routing_salvage_reason: string | null;
  routing_salvage_retrieval_added_count: number | null;
  routing_salvage_pre_eligible: boolean | null;
  routing_salvage_anchor_cue: boolean | null;
  routing_salvage_objective_cue: boolean | null;
  claim_repo_grounded: number;
  claim_reasoned_inference: number;
  chokepoints: string[];
  text_preview: string;
};

const BASE_URL =
  process.env.HELIX_ASK_BASE_URL ??
  process.env.EVAL_BASE_URL ??
  "http://127.0.0.1:5050";

const DEFAULT_PROMPTS: ProbePrompt[] = [
  { id: "repo_warp_bubble", question: "What is a warp bubble?" },
  {
    id: "general_first_principles",
    question: "What are first principles meaning in physics?",
  },
  {
    id: "general_commonality",
    question: "What do electron behavior and solar-system kinematics have in common?",
  },
  {
    id: "repo_needle_mercury",
    question: "What is Needle Hull Mark 2 and how does it relate to Mercury precession?",
  },
];

const argValues = (flag: string): string[] => {
  const out: string[] = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    if (process.argv[i] === flag) {
      const value = process.argv[i + 1];
      if (typeof value === "string" && value.trim()) out.push(value.trim());
    }
  }
  return out;
};

const asObject = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const toFiniteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const toBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const toStringOrNull = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const isGenericTemplate = (text: string): boolean => {
  const normalized = text.trim();
  if (!normalized) return true;
  if (/^For\s+".+?",\s*start with one concrete claim/i.test(normalized)) return true;
  if (/core meaning of the concept in its domain context/i.test(normalized)) return true;
  if (/Sources:\s*open-world best-effort/i.test(normalized)) return true;
  return false;
};

const scoreNovelty = (args: {
  text: string;
  generic: boolean;
  claimRepoGrounded: number;
  claimReasonedInference: number;
}): number => {
  let score = 0;
  if (args.claimReasonedInference > 0) score += 1;
  if (args.claimRepoGrounded >= 2) score += 1;
  if (!args.generic && args.text.length >= 220) score += 1;
  return score;
};

const scoreSufficiency = (args: {
  finalizeGateMode: string | null;
  stage05Used: boolean | null;
  contextFileCount: number;
  unknownBlockCount: number | null;
  assemblyMode: string | null;
  text: string;
}): number => {
  let score = 0;
  if (args.finalizeGateMode === "strict_covered") score += 2;
  if (args.stage05Used === true && args.contextFileCount > 0) score += 1;
  if (
    args.finalizeGateMode === "unknown_terminal" &&
    (args.unknownBlockCount ?? 0) > 0 &&
    args.assemblyMode === "deterministic_fallback"
  ) {
    score += 1;
  }
  if (/Sources:/i.test(args.text) && args.text.length >= 260) score += 1;
  return score;
};

const verdictFromScores = (novelty: number, sufficiency: number): ProbeRow["verdict"] => {
  if (novelty >= 2 && sufficiency >= 3) return "strong";
  if (novelty >= 1 && sufficiency >= 2) return "partial";
  return "weak";
};

const deriveChokepoints = (args: {
  intentDomain: string | null;
  policyPromptFamily: string | null;
  contextFileCount: number;
  finalizeGateMode: string | null;
  assemblyMode: string | null;
  objectiveLoopPrimaryComposerGuard: boolean | null;
  composerV2FallbackReason: string | null;
  genericTemplate: boolean;
  unknownBlockCount: number | null;
  miniCriticMode: string | null;
  routingSalvageApplied: boolean | null;
}): string[] => {
  const out: string[] = [];
  if (
    args.intentDomain === "general" &&
    args.policyPromptFamily === "definition_overview" &&
    args.contextFileCount === 0 &&
    args.finalizeGateMode === "unknown_terminal" &&
    args.objectiveLoopPrimaryComposerGuard === true
  ) {
    out.push("general_definition_trap");
    if (args.routingSalvageApplied !== true) {
      out.push("routing_salvage_missing");
    }
  }
  if (
    args.finalizeGateMode === "unknown_terminal" &&
    args.assemblyMode === "deterministic_fallback"
  ) {
    out.push("unknown_terminal_deterministic_fallback");
  }
  if (
    args.composerV2FallbackReason === "json_parse_failed" ||
    args.composerV2FallbackReason === "empty_output"
  ) {
    out.push("composer_v2_fallback_parse_or_empty");
  }
  if (
    args.genericTemplate &&
    (args.unknownBlockCount ?? 0) > 0
  ) {
    out.push("generic_unknown_renderer");
  }
  if (args.miniCriticMode === "heuristic_fallback") {
    out.push("mini_critic_heuristic_fallback");
  }
  return out;
};

const probePrompt = async (baseUrl: string, prompt: ProbePrompt): Promise<ProbeRow> => {
  const traceId = `ask:prompt-quality:${prompt.id}:${crypto.randomUUID()}`;
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/agi/ask`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      question: prompt.question,
      debug: true,
      traceId,
    }),
  });

  let payload: AskResponse = {};
  try {
    payload = (await response.json()) as AskResponse;
  } catch {
    payload = {};
  }

  const debugObj = (asObject(payload.debug) ?? {}) as AskDebug;
  const text = typeof payload.text === "string" ? payload.text : "";
  const genericTemplate = isGenericTemplate(text);
  const claimCounts = asObject(debugObj.composer_v2_claim_counts) ?? {};
  const claimRepoGrounded = Math.max(
    0,
    Math.trunc(toFiniteNumber(claimCounts.repo_grounded) ?? 0),
  );
  const claimReasonedInference = Math.max(
    0,
    Math.trunc(toFiniteNumber(claimCounts.reasoned_inference) ?? 0),
  );
  const stage05Coverage = asObject(debugObj.stage05_slot_coverage) ?? {};
  const stage05RatioRaw = toFiniteNumber(stage05Coverage.ratio);
  const stage05Ratio =
    stage05RatioRaw === null ? null : Number(Math.max(0, Math.min(1, stage05RatioRaw)).toFixed(4));
  const contextFiles = Array.isArray(debugObj.context_files) ? debugObj.context_files : [];
  const contextFileCount = contextFiles.filter((entry) => typeof entry === "string" && entry.trim()).length;
  const finalizeGateMode = toStringOrNull(debugObj.objective_finalize_gate_mode);
  const unknownBlockCount = toFiniteNumber(debugObj.objective_unknown_block_count);
  const assemblyMode = toStringOrNull(debugObj.objective_assembly_mode);

  const noveltyScore = scoreNovelty({
    text,
    generic: genericTemplate,
    claimRepoGrounded,
    claimReasonedInference,
  });
  const sufficiencyScore = scoreSufficiency({
    finalizeGateMode,
    stage05Used: toBoolean(debugObj.stage05_used),
    contextFileCount,
    unknownBlockCount: unknownBlockCount === null ? null : Math.trunc(unknownBlockCount),
    assemblyMode,
    text,
  });
  const miniCriticMode = toStringOrNull(debugObj.objective_mini_critic_mode);
  const composerV2FallbackReason = toStringOrNull(debugObj.composer_v2_fallback_reason);
  const objectiveLoopPrimaryComposerGuard = toBoolean(
    debugObj.objective_loop_primary_composer_guard,
  );
  const routingSalvageApplied = toBoolean(debugObj.routing_salvage_applied);
  const chokepoints = deriveChokepoints({
    intentDomain: toStringOrNull(debugObj.intent_domain),
    policyPromptFamily: toStringOrNull(debugObj.policy_prompt_family),
    contextFileCount,
    finalizeGateMode,
    assemblyMode,
    objectiveLoopPrimaryComposerGuard,
    composerV2FallbackReason,
    genericTemplate,
    unknownBlockCount: unknownBlockCount === null ? null : Math.trunc(unknownBlockCount),
    miniCriticMode,
    routingSalvageApplied,
  });

  return {
    id: prompt.id,
    question: prompt.question,
    status: response.status,
    text_len: text.length,
    generic_template: genericTemplate,
    novelty_score: noveltyScore,
    sufficiency_score: sufficiencyScore,
    verdict: verdictFromScores(noveltyScore, sufficiencyScore),
    objective_loop_patch_revision: toStringOrNull(debugObj.objective_loop_patch_revision),
    intent_domain: toStringOrNull(debugObj.intent_domain),
    policy_prompt_family: toStringOrNull(debugObj.policy_prompt_family),
    stage0_used: toBoolean(debugObj.stage0_used),
    stage05_used: toBoolean(debugObj.stage05_used),
    stage05_ratio: stage05Ratio,
    context_file_count: contextFileCount,
    objective_finalize_gate_mode: finalizeGateMode,
    objective_mini_critic_mode: miniCriticMode,
    objective_assembly_mode: assemblyMode,
    objective_unknown_block_count:
      unknownBlockCount === null ? null : Math.max(0, Math.trunc(unknownBlockCount)),
    objective_loop_primary_composer_guard: objectiveLoopPrimaryComposerGuard,
    composer_family_degrade_suppressed: toBoolean(debugObj.composer_family_degrade_suppressed),
    composer_family_degrade_suppressed_reason: toStringOrNull(
      debugObj.composer_family_degrade_suppressed_reason,
    ),
    open_world_objective_tail_scrub_applied: toBoolean(
      debugObj.open_world_objective_tail_scrub_applied,
    ),
    composer_soft_enforce_action: toStringOrNull(debugObj.composer_soft_enforce_action),
    composer_v2_fallback_reason: composerV2FallbackReason,
    composer_v2_best_attempt_stage: toStringOrNull(debugObj.composer_v2_best_attempt_stage),
    objective_assembly_rescue_attempted: toBoolean(debugObj.objective_assembly_rescue_attempted),
    objective_assembly_rescue_success: toBoolean(debugObj.objective_assembly_rescue_success),
    routing_salvage_applied: routingSalvageApplied,
    routing_salvage_reason: toStringOrNull(debugObj.routing_salvage_reason),
    routing_salvage_retrieval_added_count: toFiniteNumber(
      debugObj.routing_salvage_retrieval_added_count,
    ),
    routing_salvage_pre_eligible: toBoolean(debugObj.routing_salvage_pre_eligible),
    routing_salvage_anchor_cue: toBoolean(debugObj.routing_salvage_anchor_cue),
    routing_salvage_objective_cue: toBoolean(debugObj.routing_salvage_objective_cue),
    claim_repo_grounded: claimRepoGrounded,
    claim_reasoned_inference: claimReasonedInference,
    chokepoints,
    text_preview: text.replace(/\s+/g, " ").trim().slice(0, 260),
  };
};

const main = async (): Promise<void> => {
  const promptArgs = argValues("--prompt");
  const prompts: ProbePrompt[] =
    promptArgs.length > 0
      ? promptArgs.map((question, index) => ({
          id: `prompt_${index + 1}`,
          question,
        }))
      : DEFAULT_PROMPTS;

  const rows: ProbeRow[] = [];
  for (const prompt of prompts) {
    const row = await probePrompt(BASE_URL, prompt);
    rows.push(row);
    const label = `${row.id} | verdict=${row.verdict} | novelty=${row.novelty_score} | suff=${row.sufficiency_score}`;
    console.log(label);
    console.log(`  finalize=${row.objective_finalize_gate_mode ?? "n/a"} assembly=${row.objective_assembly_mode ?? "n/a"} guard=${String(row.objective_loop_primary_composer_guard)}`);
    console.log(
      `  salvage=${String(row.routing_salvage_applied)} preEligible=${String(row.routing_salvage_pre_eligible)} cue=${String(row.routing_salvage_anchor_cue)} objCue=${String(row.routing_salvage_objective_cue)} rescue=${String(row.objective_assembly_rescue_success)} chokepoints=${row.chokepoints.join(",") || "none"}`,
    );
    console.log(`  preview=${row.text_preview}`);
  }

  const totals = {
    prompts: rows.length,
    strong: rows.filter((row) => row.verdict === "strong").length,
    partial: rows.filter((row) => row.verdict === "partial").length,
    weak: rows.filter((row) => row.verdict === "weak").length,
    avg_novelty: Number(
      (rows.reduce((sum, row) => sum + row.novelty_score, 0) / Math.max(1, rows.length)).toFixed(2),
    ),
    avg_sufficiency: Number(
      (rows.reduce((sum, row) => sum + row.sufficiency_score, 0) / Math.max(1, rows.length)).toFixed(2),
    ),
    chokepoint_counts: rows.reduce<Record<string, number>>((acc, row) => {
      for (const tag of row.chokepoints) {
        acc[tag] = (acc[tag] ?? 0) + 1;
      }
      return acc;
    }, {}),
  };
  const runtimeLikelyStale =
    rows.length > 0 &&
    rows.every(
      (row) =>
        row.routing_salvage_applied === null &&
        row.objective_assembly_rescue_attempted === null,
    );

  console.log("\nSummary");
  console.log(JSON.stringify(totals, null, 2));
  if (runtimeLikelyStale) {
    console.log(
      "\nWarning: routing salvage and objective-assembly rescue debug fields are absent across all rows (runtime likely stale; restart 5050 to validate latest patch).",
    );
  }
  console.log("\nRows");
  console.log(JSON.stringify(rows, null, 2));
};

main().catch((error) => {
  console.error("[helix-ask-prompt-quality-probe] failed", error);
  process.exitCode = 1;
});
