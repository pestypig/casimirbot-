import type { HelixAskTraceEvent } from "./response-debug-payload";

export type HelixAskReasoningSidebarStepStatus = "done" | "partial" | "blocked" | "skipped";

export type HelixAskReasoningSidebarStep = {
  step: number;
  title: string;
  status: HelixAskReasoningSidebarStepStatus;
  summary: string;
  detail?: string | null;
  debug_refs?: string[];
  at?: string | null;
};

export type HelixAskReasoningSidebarEventClockEntry = {
  idx: number;
  ts: string;
  stage: string;
  detail?: string | null;
  ok?: boolean | null;
  duration_ms?: number | null;
};

export type HelixAskReasoningSidebar = {
  version: "v1";
  generated_at: string;
  steps: HelixAskReasoningSidebarStep[];
  event_clock: HelixAskReasoningSidebarEventClockEntry[];
  markdown: string;
};

type BuildHelixAskReasoningSidebarArgs = {
  debugRecord: Record<string, unknown>;
  traceEvents: HelixAskTraceEvent[];
  coerceDebugString: (value: unknown) => string | null;
  coerceDebugBoolean: (value: unknown) => boolean | null;
  coerceDebugNumber: (value: unknown) => number | null;
  coerceDebugObjectArray: (value: unknown) => Array<Record<string, unknown>>;
  clipText: (value: string | undefined, limit: number) => string;
};

export const buildHelixAskReasoningSidebarFromDebug = (
  args: BuildHelixAskReasoningSidebarArgs,
): HelixAskReasoningSidebar => {
  const {
    debugRecord,
    traceEvents,
    coerceDebugString,
    coerceDebugBoolean,
    coerceDebugNumber,
    coerceDebugObjectArray,
    clipText,
  } = args;
  const findEventTimestamp = (...tokens: string[]): string | null => {
    const normalized = tokens.map((token) => token.trim().toLowerCase()).filter(Boolean);
    if (normalized.length === 0) return null;
    const match = traceEvents.find((event) => {
      const signal = `${event.stage ?? ""} ${event.detail ?? ""}`.toLowerCase();
      return normalized.some((token) => signal.includes(token));
    });
    return match?.ts ?? null;
  };
  const steps: HelixAskReasoningSidebarStep[] = [];
  const pushStep = (step: Omit<HelixAskReasoningSidebarStep, "step">): void => {
    steps.push({ step: steps.length + 1, ...step });
  };

  const intentDomain = coerceDebugString(debugRecord.intent_domain) ?? "n/a";
  const promptFamily = coerceDebugString(debugRecord.policy_prompt_family) ?? "n/a";
  const fallbackTaxonomy =
    coerceDebugString(debugRecord.fallback_reason_taxonomy) ??
    coerceDebugString(debugRecord.fallback_reason) ??
    "none";
  const openWorldMode = coerceDebugString(debugRecord.open_world_bypass_mode) ?? "n/a";
  pushStep({
    title: "Routing + Policy",
    status: intentDomain !== "n/a" && promptFamily !== "n/a" ? "done" : "partial",
    summary: `intent=${intentDomain}; family=${promptFamily}; fallback=${fallbackTaxonomy}`,
    detail: `open_world_mode=${openWorldMode}`,
    debug_refs: [
      "intent_domain",
      "policy_prompt_family",
      "fallback_reason_taxonomy",
      "open_world_bypass_mode",
    ],
    at: findEventTimestamp("Routing prior", "Fallback"),
  });

  const objectiveStates = coerceDebugObjectArray(debugRecord.objective_loop_state);
  const objectiveLabels = objectiveStates
    .map((entry) => coerceDebugString(entry.objective_label))
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 8);
  const objectiveTotal =
    coerceDebugNumber(debugRecord.objective_total_count) ??
    (objectiveStates.length > 0 ? objectiveStates.length : 0);
  pushStep({
    title: "Planner Objectives",
    status: objectiveTotal > 0 ? "done" : "skipped",
    summary: `objectives=${objectiveTotal}; labels=${objectiveLabels.length}`,
    detail: objectiveLabels.length > 0 ? objectiveLabels.join(" | ") : "(no objectives recorded)",
    debug_refs: ["objective_total_count", "objective_loop_state"],
    at: findEventTimestamp("Controller step", "objective"),
  });

  const retrievalRows = coerceDebugObjectArray(debugRecord.objective_retrieval_queries);
  const retrievalQueryLines: string[] = [];
  let retrievalQueryCount = 0;
  for (const row of retrievalRows.slice(0, 16)) {
    const objectiveId = coerceDebugString(row.objective_id) ?? "unknown";
    const passIndex = coerceDebugNumber(row.pass_index);
    const queries = Array.isArray(row.queries)
      ? row.queries
          .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
          .filter(Boolean)
      : [];
    retrievalQueryCount += queries.length;
    for (const query of queries.slice(0, 4)) {
      retrievalQueryLines.push(
        `objective=${objectiveId}; pass=${passIndex ?? "n/a"}; query=${clipText(query, 140)}`,
      );
      if (retrievalQueryLines.length >= 10) break;
    }
    if (retrievalQueryLines.length >= 10) break;
  }
  pushStep({
    title: "Retrieval Passes",
    status: retrievalQueryCount > 0 ? "done" : objectiveTotal > 0 ? "partial" : "skipped",
    summary: `passes=${retrievalRows.length}; queries=${retrievalQueryCount}`,
    detail:
      retrievalQueryLines.length > 0
        ? retrievalQueryLines.join(" | ")
        : "(no objective retrieval queries recorded)",
    debug_refs: ["objective_retrieval_queries"],
    at: findEventTimestamp("Retrieval", "Repo search"),
  });

  const retrieveProposalMode = coerceDebugString(debugRecord.objective_retrieve_proposal_mode) ?? "none";
  const retrieveProposalAttempted = coerceDebugBoolean(
    debugRecord.objective_retrieve_proposal_attempted,
  );
  const retrieveProposalFailReason =
    coerceDebugString(debugRecord.objective_retrieve_proposal_fail_reason) ?? "none";
  const retrieveProposalPromptPreview = clipText(
    coerceDebugString(debugRecord.objective_retrieve_proposal_prompt_preview) ?? "",
    280,
  );
  pushStep({
    title: "Retrieve Proposal",
    status:
      retrieveProposalMode === "llm"
        ? "done"
        : retrieveProposalMode === "heuristic_fallback"
          ? "partial"
          : "skipped",
    summary: `mode=${retrieveProposalMode}; attempted=${String(retrieveProposalAttempted)}; fail=${retrieveProposalFailReason}`,
    detail: retrieveProposalPromptPreview || "(no retrieve-proposal prompt preview)",
    debug_refs: [
      "objective_retrieve_proposal_mode",
      "objective_retrieve_proposal_attempted",
      "objective_retrieve_proposal_fail_reason",
      "objective_retrieve_proposal_prompt_preview",
    ],
    at: findEventTimestamp("Retrieval objective-recovery", "objective_recovery"),
  });

  const transitions = coerceDebugObjectArray(debugRecord.objective_transition_log);
  const transitionLines = transitions.slice(-8).map((entry) => {
    const objectiveId = coerceDebugString(entry.objective_id) ?? "unknown";
    const from = coerceDebugString(entry.from) ?? "unknown";
    const to = coerceDebugString(entry.to) ?? "unknown";
    const reason = coerceDebugString(entry.reason) ?? "unknown";
    return `${objectiveId}: ${from} -> ${to} (${reason})`;
  });
  const finalizeMode = coerceDebugString(debugRecord.objective_finalize_gate_mode) ?? "n/a";
  const unresolvedCount = coerceDebugNumber(debugRecord.objective_unresolved_count) ?? 0;
  const coverageUnresolvedCount =
    coerceDebugNumber(debugRecord.objective_coverage_unresolved_count) ?? unresolvedCount;
  const unknownBlockCount = coerceDebugNumber(debugRecord.objective_unknown_block_count) ?? 0;
  const objectiveStatus: HelixAskReasoningSidebarStepStatus =
    finalizeMode === "strict_covered"
      ? "done"
      : finalizeMode === "blocked"
        ? "blocked"
        : finalizeMode === "unknown_terminal"
          ? "partial"
          : "partial";
  pushStep({
    title: "Objective Loop State",
    status: objectiveStatus,
    summary: `finalize=${finalizeMode}; unresolved=${unresolvedCount}; coverage_unresolved=${coverageUnresolvedCount}; unknown_blocks=${unknownBlockCount}`,
    detail: transitionLines.length > 0 ? transitionLines.join(" | ") : "(no transitions recorded)",
    debug_refs: [
      "objective_transition_log",
      "objective_finalize_gate_mode",
      "objective_unresolved_count",
      "objective_coverage_unresolved_count",
      "objective_unknown_block_count",
    ],
    at: findEventTimestamp("objective", "critiqued", "recovery"),
  });

  const objectiveReasoningTraceRows = coerceDebugObjectArray(debugRecord.objective_reasoning_trace);
  const objectiveReasoningPreview = objectiveReasoningTraceRows
    .slice(0, 3)
    .map((entry) => {
      const objectiveId = coerceDebugString(entry.objective_id) ?? "unknown";
      const status = coerceDebugString(entry.final_status) ?? "unknown";
      const plainReasoning = clipText(coerceDebugString(entry.plain_reasoning) ?? "", 140);
      return `${objectiveId}[${status}] ${plainReasoning || "(no plain reasoning)"}`;
    })
    .join(" | ");
  pushStep({
    title: "Objective Reasoning",
    status: objectiveReasoningTraceRows.length > 0 ? "done" : "skipped",
    summary: `entries=${objectiveReasoningTraceRows.length}; coverage_unresolved=${coverageUnresolvedCount}`,
    detail: objectiveReasoningPreview || "(no objective reasoning trace)",
    debug_refs: [
      "objective_reasoning_trace",
      "objective_telemetry_used",
      "objective_coverage_unresolved_count",
    ],
    at: findEventTimestamp("objective", "critic", "unknown_terminal"),
  });

  const miniSynthMode = coerceDebugString(debugRecord.objective_mini_synth_mode) ?? "none";
  const miniSynthAttempted = coerceDebugBoolean(debugRecord.objective_mini_synth_attempted);
  const miniSynthFailReason =
    coerceDebugString(debugRecord.objective_mini_synth_fail_reason) ?? "none";
  const miniSynthPromptPreview = clipText(
    coerceDebugString(debugRecord.objective_mini_synth_prompt_preview) ?? "",
    280,
  );
  pushStep({
    title: "Mini-Synth",
    status:
      miniSynthMode === "llm" ? "done" : miniSynthMode === "heuristic_fallback" ? "partial" : "skipped",
    summary: `mode=${miniSynthMode}; attempted=${String(miniSynthAttempted)}; fail=${miniSynthFailReason}`,
    detail: miniSynthPromptPreview || "(no mini-synth prompt preview)",
    debug_refs: [
      "objective_mini_synth_mode",
      "objective_mini_synth_attempted",
      "objective_mini_synth_fail_reason",
      "objective_mini_synth_prompt_preview",
    ],
    at: findEventTimestamp("mini", "synth"),
  });

  const miniCriticMode = coerceDebugString(debugRecord.objective_mini_critic_mode) ?? "none";
  const miniCriticAttempted = coerceDebugBoolean(debugRecord.objective_mini_critic_attempted);
  const miniCriticFailReason =
    coerceDebugString(debugRecord.objective_mini_critic_fail_reason) ?? "none";
  const miniCriticPromptPreview = clipText(
    coerceDebugString(debugRecord.objective_mini_critic_prompt_preview) ?? "",
    280,
  );
  pushStep({
    title: "Mini-Critic",
    status:
      miniCriticMode === "llm" ? "done" : miniCriticMode === "heuristic_fallback" ? "partial" : "skipped",
    summary: `mode=${miniCriticMode}; attempted=${String(miniCriticAttempted)}; fail=${miniCriticFailReason}`,
    detail: miniCriticPromptPreview || "(no mini-critic prompt preview)",
    debug_refs: [
      "objective_mini_critic_mode",
      "objective_mini_critic_attempted",
      "objective_mini_critic_fail_reason",
      "objective_mini_critic_prompt_preview",
    ],
    at: findEventTimestamp("mini", "critic"),
  });

  const objectiveStepTranscripts = coerceDebugObjectArray(debugRecord.objective_step_transcripts);
  const transcriptLlmCalls = objectiveStepTranscripts.filter((entry) =>
    Boolean(coerceDebugString(entry.llm_model)),
  ).length;
  const transcriptPreview = objectiveStepTranscripts
    .slice(-6)
    .map((entry) => {
      const objectiveId = coerceDebugString(entry.objective_id) ?? "unknown";
      const verb = coerceDebugString(entry.verb) ?? "unknown";
      const decision = coerceDebugString(entry.decision) ?? "unknown";
      return `${objectiveId}:${verb}:${decision}`;
    })
    .join(" | ");
  pushStep({
    title: "Objective Step Transcripts",
    status: objectiveStepTranscripts.length > 0 ? "done" : "partial",
    summary: `transcripts=${objectiveStepTranscripts.length}; llm_calls=${transcriptLlmCalls}`,
    detail: transcriptPreview || "(no objective step transcripts captured)",
    debug_refs: [
      "objective_step_transcripts",
      "objective_step_transcript_count",
      "objective_step_llm_call_count",
      "per_step_llm_call_rate",
      "transcript_completeness_rate",
    ],
    at: findEventTimestamp("objective", "assembly", "critic"),
  });

  const assemblyMode = coerceDebugString(debugRecord.objective_assembly_mode) ?? "none";
  const assemblyBlockedReason =
    coerceDebugString(debugRecord.objective_assembly_blocked_reason) ?? "none";
  const rescueAttempted = coerceDebugBoolean(debugRecord.objective_assembly_rescue_attempted);
  const rescueSuccess = coerceDebugBoolean(debugRecord.objective_assembly_rescue_success);
  const assemblyPromptPreview = clipText(
    coerceDebugString(debugRecord.objective_assembly_prompt_preview) ?? "",
    220,
  );
  const rescuePromptPreview = clipText(
    coerceDebugString(debugRecord.objective_assembly_rescue_prompt_preview) ?? "",
    220,
  );
  const assemblyStatus: HelixAskReasoningSidebarStepStatus =
    assemblyMode === "llm"
      ? assemblyBlockedReason !== "none"
        ? "partial"
        : "done"
      : assemblyMode === "deterministic_fallback"
        ? "partial"
        : assemblyBlockedReason !== "none"
          ? "blocked"
          : "skipped";
  pushStep({
    title: "Assembly",
    status: assemblyStatus,
    summary: `mode=${assemblyMode}; rescue=${String(rescueSuccess ?? false)}; blocked=${assemblyBlockedReason}`,
    detail:
      `primary_prompt=${assemblyPromptPreview || "(none)"} | rescue_prompt=${rescuePromptPreview || "(none)"} | rescue_attempted=${String(
        rescueAttempted ?? false,
      )}`,
    debug_refs: [
      "objective_assembly_mode",
      "objective_assembly_blocked_reason",
      "objective_assembly_rescue_attempted",
      "objective_assembly_rescue_success",
      "objective_assembly_prompt_preview",
      "objective_assembly_rescue_prompt_preview",
    ],
    at: findEventTimestamp("objectiveAssembly", "Finalization"),
  });

  const finalFailReason = coerceDebugString(debugRecord.helix_ask_fail_reason) ?? "none";
  const finalFailClass = coerceDebugString(debugRecord.helix_ask_fail_class) ?? "none";
  const finalAnswerPreview = clipText(coerceDebugString(debugRecord.answer_final_text) ?? "", 280);
  const finalStatus: HelixAskReasoningSidebarStepStatus =
    finalFailReason !== "none" || finalFailClass !== "none"
      ? "blocked"
      : /fallback/i.test(fallbackTaxonomy)
        ? "partial"
        : "done";
  pushStep({
    title: "Final Output",
    status: finalStatus,
    summary: `fail_reason=${finalFailReason}; fail_class=${finalFailClass}; fallback=${fallbackTaxonomy}`,
    detail: finalAnswerPreview || "(no final answer preview captured)",
    debug_refs: ["helix_ask_fail_reason", "helix_ask_fail_class", "answer_final_text"],
    at: findEventTimestamp("Finalization", "Answer cleaned preview"),
  });

  const maxEventClockEntries = 64;
  const clippedEvents = traceEvents.slice(-maxEventClockEntries);
  const eventClock = clippedEvents.map((entry, index) => ({
    idx: index + 1,
    ts: entry.ts,
    stage: coerceDebugString(entry.stage) ?? "unknown",
    detail: coerceDebugString(entry.detail) ?? null,
    ok: typeof entry.ok === "boolean" ? entry.ok : null,
    duration_ms:
      typeof entry.durationMs === "number" && Number.isFinite(entry.durationMs)
        ? Math.max(0, Math.floor(entry.durationMs))
        : null,
  }));

  const markdown = [
    "# Reasoning Sidebar",
    ...steps.map((step) => {
      const header = `${step.step}. ${step.title} [${step.status}]`;
      const summary = `summary: ${step.summary}`;
      const detail = step.detail ? `detail: ${step.detail}` : null;
      const refs =
        step.debug_refs && step.debug_refs.length > 0
          ? `refs: ${step.debug_refs.join(", ")}`
          : null;
      return [header, summary, detail, refs].filter(Boolean).join("\n");
    }),
    "",
    "## Event Clock",
    ...(eventClock.length > 0
      ? eventClock.map((entry) => {
          const duration = entry.duration_ms !== null ? `; ${entry.duration_ms}ms` : "";
          const detail = entry.detail ? `; ${clipText(entry.detail, 140)}` : "";
          return `- [${entry.idx}] ${entry.ts} | ${entry.stage} | ok=${String(entry.ok)}${duration}${detail}`;
        })
      : ["- (no events)"]),
  ]
    .join("\n")
    .trim();

  return {
    version: "v1",
    generated_at: new Date().toISOString(),
    steps,
    event_clock: eventClock,
    markdown: clipText(markdown, 8000),
  };
};

export const attachHelixAskReasoningSidebarToDebug = (
  args: BuildHelixAskReasoningSidebarArgs,
): void => {
  const sidebar = buildHelixAskReasoningSidebarFromDebug(args);
  args.debugRecord.reasoning_sidebar_enabled = true;
  args.debugRecord.reasoning_sidebar = sidebar;
  args.debugRecord.reasoning_sidebar_markdown = sidebar.markdown;
  args.debugRecord.reasoning_sidebar_step_count = sidebar.steps.length;
  args.debugRecord.reasoning_sidebar_event_count = sidebar.event_clock.length;
};
