import crypto from "node:crypto";
import type { HelixLoopParityTrace } from "./loop-parity-trace";

type RecordLike = Record<string, unknown>;

export type HelixAskTurnSolverTrace = {
  schema: "helix.ask_turn_solver_trace.v1";
  trace_id: string;
  turn_id: string;
  prompt_hash: string;
  prompt_interpretation: {
    prompt_shape: string;
    visual_content_request_detected: boolean;
    procedure_memory_request_detected: boolean;
    repo_or_runtime_request_detected: boolean;
    pipeline_control_request_detected: boolean;
    pipeline_status_request_detected: boolean;
    affirmative_operator_command_detected: boolean;
    contextual_tool_mentions: string[];
    negated_or_contextual_control_detected: boolean;
    mixed_intent_detected: boolean;
  };
  intent_hypotheses: Array<{
    hypothesis_id: string;
    intent_kind: string;
    route: string;
    source_target: string;
    confidence: number | null;
    evidence_needed: boolean;
    tool_needed: boolean;
    terminal_product_hint: string | null;
    risk_if_wrong: string;
    authority: "hypothesis_not_authority";
  }>;
  primary_intent: {
    intent_kind: string;
    route: string;
    source_target: string;
    target_kind: string;
    selection_reason: string;
  } | null;
  secondary_intents: Array<{
    intent_kind: string;
    route: string;
    source_target: string;
    reason: string;
  }>;
  source_admission_candidates: Array<{
    source_target: string;
    target_kind: string;
    strength: string;
    admitted: boolean;
    requested_outputs: string[];
    selected_source_refs: string[];
    rejected_source_refs: string[];
  }>;
  tool_admission_candidates: Array<{
    tool_family: string;
    admitted: boolean;
    actual_tool_ids: string[];
    unexpected_tool_ids: string[];
  }>;
  evidence_requests: Array<{
    request_kind: string;
    required: boolean;
    requested_outputs: string[];
    source_target: string;
  }>;
  evidence_results: {
    observations_created_count: number;
    evidence_selected_for_answer_count: number;
    evidence_rejected_for_answer_count: number;
    selected_refs: string[];
    rejected_refs: Array<{ ref: string; reason: string }>;
  };
  evidence_reentry: {
    tool_results_returned_to_turn: boolean;
    observations_reentered_for_arbitration: boolean;
    terminal_selection_ran_after_observations: boolean;
    receipts_treated_as_observations: boolean;
  };
  followup_reasoning: {
    required: boolean;
    ran: boolean | "not_applicable";
    final_arbitration_ran: boolean;
    requirement_reason: string;
  };
  authority_chain: {
    route_authority_ok: boolean;
    poison_audit_ok: boolean;
    terminal_authority_ok: boolean;
    terminal_artifact_kind: string;
    final_answer_source: string;
  };
  solver_short_circuit_flags: string[];
  completed_solver_path: boolean;
  codex_boundary: {
    duplicates_codex_runtime: false;
    codex_owned_runtime_mechanics: string[];
    helix_owned_policy_mechanics: string[];
    boundary_note: string;
  };
  assistant_answer: false;
  raw_content_included: false;
};

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const readBoolean = (value: unknown): boolean => value === true;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0) : [];

const unique = <T>(entries: T[]): T[] => Array.from(new Set(entries));

const contextualToolPatterns: Array<[string, RegExp]> = [
  ["click", /\b(?:before|after|haven't|have not|didn't|did not|without|if|when|screen\s+(?:shows|says)|button\s+(?:labeled|called))\b[\s\S]{0,80}\bclick(?:ed|ing)?\b/i],
  ["open", /\b(?:before|after|haven't|have not|didn't|did not|without|if|when|screen\s+(?:shows|says))\b[\s\S]{0,80}\bopen(?:ed|ing)?\b/i],
  ["start", /\b(?:before|after|haven't|have not|didn't|did not|without|if|when|screen\s+(?:shows|says)|button\s+(?:labeled|called))\b[\s\S]{0,80}\bstart(?:ed|ing)?\b/i],
  ["run", /\b(?:before|after|haven't|have not|didn't|did not|without|if|when|why\s+did|previous|last)\b[\s\S]{0,80}\brun(?:ning)?\b/i],
  ["capture", /\b(?:was|before|after|haven't|have not|without|if|when|screen\s+(?:shows|says))\b[\s\S]{0,80}\bcapture(?:d|ing)?\b/i],
  ["inspect", /\b(?:why\s+did|whether|without|do\s+not|don't|previous|last)\b[\s\S]{0,80}\binspect(?:ed|ing)?\b/i],
  ["repair", /\b(?:if|when|without|do\s+not|don't|previous|last|why\s+did)\b[\s\S]{0,80}\brepair(?:ed|ing)?\b/i],
  ["refresh", /\b(?:after|before|if|when|without|do\s+not|don't|was)\b[\s\S]{0,80}\brefresh(?:ed|ing)?\b/i],
  ["verify", /\b(?:after|before|if|when|without|do\s+not|don't|where|why)\b[\s\S]{0,80}\bverify|verification\b/i],
  ["set_rate", /\b(?:why\s+did|last\s+turn|previous\s+answer|haven't|have not|not|without|before|after|if|when)\b[\s\S]{0,100}\bset_rate\b/i],
];

const isVisualContentPrompt = (promptText: string): boolean =>
  /\b(?:review|explain|describe|summari[sz]e|compare|what(?:'s|\s+is)?|what\s+changed|look\s+at|see|seeing)\b[\s\S]{0,140}\b(?:screen|screenshot|capture|visual|frame|window|tab)\b/i.test(promptText) ||
  /\b(?:screen|screenshot|capture|visual|frame|window|tab)\b[\s\S]{0,140}\b(?:show|shows|showing|seeing|visible|happening|changed)\b/i.test(promptText);

const isProcedureMemoryPrompt = (promptText: string): boolean =>
  /\b(?:what\s+changed|since\s+(?:the\s+)?(?:previous|last)|compare\s+(?:this|current)|replay|earlier|last\s+turn|previous\s+(?:visual|capture|frame|scene))\b/i.test(promptText);

const isRepoOrRuntimePrompt = (promptText: string): boolean =>
  /\b(?:repo|repository|code|source\s+file|implementation|where\s+(?:is|was).*(?:enforced|defined)|debug\s+export|route|classifier|tool\s+call|set_rate|terminal\s+authority)\b/i.test(promptText);

const isPipelineControlPrompt = (promptText: string): boolean =>
  /\b(?:set|change|update|start|enable|turn\s+on|keep\s+checking|watch)\b[\s\S]{0,80}\b(?:interval|cadence|rate|every\s+\d+|capture)\b/i.test(promptText) &&
  !/\b(?:haven't|have not|not|without|before|after|if|when|was|whether|why\s+did)\b[\s\S]{0,100}\b(?:interval|cadence|rate|every\s+\d+)\b/i.test(promptText);

const isPipelineStatusPrompt = (promptText: string): boolean =>
  /\b(?:is|was|whether|why)\b[\s\S]{0,80}\b(?:interval|cadence|producer|pipeline|capture|source)\b[\s\S]{0,80}\b(?:running|stale|adopted|bound|active|called|changed)\b/i.test(promptText);

const isAffirmativeOperatorCommand = (promptText: string): boolean =>
  /\b(?:set|change|update|start|stop|enable|turn\s+on|turn\s+off|click|open|close|run|refresh|inspect|repair|attach|adopt|verify)\b/i.test(promptText) &&
  !/\b(?:do\s+not|don't|without|haven't|have not|didn't|did not|before\s+i|after\s+i|if\s+we|when\s+we|was|why\s+did|screen\s+(?:shows|says))\b/i.test(promptText);

const detectContextualToolMentions = (promptText: string): string[] =>
  unique(contextualToolPatterns.filter(([, pattern]) => pattern.test(promptText)).map(([name]) => name));

const promptShapeFor = (input: {
  visual: boolean;
  procedure: boolean;
  repo: boolean;
  pipelineControl: boolean;
  pipelineStatus: boolean;
}): string => {
  const active = [
    input.visual ? "visual_content" : "",
    input.procedure ? "procedure_memory" : "",
    input.repo ? "repo_or_runtime" : "",
    input.pipelineControl ? "pipeline_control" : "",
    input.pipelineStatus ? "pipeline_status" : "",
  ].filter(Boolean);
  if (active.length > 1) return "mixed";
  return active[0] ?? "general_prompt";
};

const sourceRequiresEvidence = (sourceTarget: string): boolean =>
  /visual_capture|procedure_memory|situation_epoch|repo_code|runtime_evidence|docs_viewer|active_doc|world_event/i.test(sourceTarget);

const routeNeedsTool = (route: string, sourceTarget: string): boolean =>
  /live_pipeline_control|workspace_action|doc_open|calculator|process_graph/i.test(`${route} ${sourceTarget}`);

const terminalHintFor = (contract: RecordLike | null, terminalArtifactKind: string): string | null => {
  const allowed = readStringArray(contract?.allowed_terminal_artifact_kinds);
  if (allowed.length > 0) return allowed.join(",");
  return terminalArtifactKind || null;
};

const collectIntentHypotheses = (input: {
  payload: RecordLike;
  selectedRoute: string;
  terminalArtifactKind: string;
  sourceTarget: string;
  routeContract: RecordLike | null;
}): HelixAskTurnSolverTrace["intent_hypotheses"] => {
  const preflight = readRecord(input.payload.ask_turn_preflight_context);
  const routeCandidates = Array.isArray(preflight?.route_candidates) ? preflight.route_candidates : [];
  const candidates = routeCandidates
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .map((entry, index) => {
      const route = readString(entry.route) || "unknown";
      const confidence = readNumber(entry.confidence);
      return {
        hypothesis_id: `intent_hypothesis:${hashShort([route, index, readString(entry.reason)])}`,
        intent_kind: route,
        route,
        source_target: input.sourceTarget,
        confidence,
        evidence_needed: sourceRequiresEvidence(input.sourceTarget),
        tool_needed: routeNeedsTool(route, input.sourceTarget),
        terminal_product_hint: terminalHintFor(input.routeContract, input.terminalArtifactKind),
        risk_if_wrong: sourceRequiresEvidence(input.sourceTarget)
          ? "could bypass required source evidence or promote a receipt/projection"
          : "could select the wrong terminal product for the prompt",
        authority: "hypothesis_not_authority" as const,
      };
    });
  if (candidates.length > 0) return candidates;
  return [{
    hypothesis_id: `intent_hypothesis:${hashShort([input.selectedRoute, input.sourceTarget])}`,
    intent_kind: input.selectedRoute,
    route: input.selectedRoute,
    source_target: input.sourceTarget,
    confidence: null,
    evidence_needed: sourceRequiresEvidence(input.sourceTarget),
    tool_needed: routeNeedsTool(input.selectedRoute, input.sourceTarget),
    terminal_product_hint: terminalHintFor(input.routeContract, input.terminalArtifactKind),
    risk_if_wrong: sourceRequiresEvidence(input.sourceTarget)
      ? "could bypass required source evidence or promote a receipt/projection"
      : "could select the wrong terminal product for the prompt",
    authority: "hypothesis_not_authority",
  }];
};

const collectSecondaryIntents = (input: {
  promptShape: string;
  promptInterpretation: HelixAskTurnSolverTrace["prompt_interpretation"];
  selectedRoute: string;
  sourceTarget: string;
}): HelixAskTurnSolverTrace["secondary_intents"] => {
  const secondary: HelixAskTurnSolverTrace["secondary_intents"] = [];
  if (input.promptShape === "mixed" && input.promptInterpretation.pipeline_status_request_detected) {
    secondary.push({
      intent_kind: "pipeline_status",
      route: "live_pipeline_status_side_artifact",
      source_target: "live_pipeline",
      reason: "Pipeline status is secondary to the primary content/procedure request.",
    });
  }
  if (input.promptShape === "mixed" && input.promptInterpretation.contextual_tool_mentions.length > 0) {
    secondary.push({
      intent_kind: "contextual_tool_mention",
      route: input.selectedRoute,
      source_target: input.sourceTarget,
      reason: "Tool/control words are recorded as context, not execution.",
    });
  }
  return secondary;
};

const selectedRefsFromPayload = (payload: RecordLike): string[] => {
  const selection = readRecord(payload.situation_evidence_selection);
  return unique([
    ...readStringArray(selection?.selected_source_refs),
    ...readStringArray(selection?.selected_observation_refs),
    ...readStringArray(selection?.selected_field_evaluation_refs),
    ...readStringArray(selection?.selected_interpretation_run_refs),
    ...readStringArray(selection?.selected_epoch_closure_refs),
  ]);
};

const rejectedRefsFromPayload = (payload: RecordLike): string[] => {
  const selection = readRecord(payload.situation_evidence_selection);
  return unique([
    ...readStringArray(selection?.rejected_unbound_source_refs),
    ...readStringArray(selection?.exclusion_reasons),
  ]);
};

const buildEvidenceRequests = (input: {
  sourceTarget: string;
  routeContract: RecordLike | null;
  sourceTargetIntent: RecordLike | null;
}): HelixAskTurnSolverTrace["evidence_requests"] => {
  const requestedOutputs = unique([
    ...readStringArray(input.sourceTargetIntent?.requested_outputs),
    ...readStringArray(input.routeContract?.allowed_terminal_artifact_kinds),
  ]);
  return [{
    request_kind: sourceRequiresEvidence(input.sourceTarget) ? "source_evidence" : "terminal_product_contract",
    required: sourceRequiresEvidence(input.sourceTarget) || readString(input.sourceTargetIntent?.strength) === "hard",
    requested_outputs: requestedOutputs,
    source_target: input.sourceTarget,
  }];
};

const buildToolAdmissionCandidates = (loopTrace: HelixLoopParityTrace | RecordLike | null): HelixAskTurnSolverTrace["tool_admission_candidates"] => {
  const admittedFamilies = readStringArray(loopTrace?.admitted_tool_families);
  const actualToolCalls = Array.isArray(loopTrace?.actual_tool_calls) ? loopTrace.actual_tool_calls : [];
  const families = unique([
    ...admittedFamilies,
    ...actualToolCalls
      .map((entry) => readRecord(entry))
      .filter((entry): entry is RecordLike => Boolean(entry))
      .map((entry) => readString(entry.family) || "unknown"),
  ]);
  return families.map((family) => {
    const calls = actualToolCalls
      .map((entry) => readRecord(entry))
      .filter((entry): entry is RecordLike => Boolean(entry) && (readString(entry.family) || "unknown") === family);
    return {
      tool_family: family,
      admitted: admittedFamilies.includes(family),
      actual_tool_ids: calls.map((call) => readString(call.tool_id)).filter(Boolean),
      unexpected_tool_ids: calls.filter((call) => call.admitted !== true).map((call) => readString(call.tool_id)).filter(Boolean),
    };
  });
};

export function buildAskTurnSolverTrace(input: {
  turnId: string;
  promptText: string;
  selectedRoute: string;
  terminalArtifactKind: string | null | undefined;
  finalAnswerSource: string | null | undefined;
  payload: RecordLike;
  loopParityTrace?: HelixLoopParityTrace | RecordLike | null;
}): HelixAskTurnSolverTrace {
  const promptText = input.promptText;
  const visual = isVisualContentPrompt(promptText);
  const procedure = isProcedureMemoryPrompt(promptText);
  const repo = isRepoOrRuntimePrompt(promptText);
  const pipelineControl = isPipelineControlPrompt(promptText);
  const pipelineStatus = isPipelineStatusPrompt(promptText);
  const contextualToolMentions = detectContextualToolMentions(promptText);
  const promptShape = promptShapeFor({ visual, procedure, repo, pipelineControl, pipelineStatus });
  const promptInterpretation: HelixAskTurnSolverTrace["prompt_interpretation"] = {
    prompt_shape: promptShape,
    visual_content_request_detected: visual,
    procedure_memory_request_detected: procedure,
    repo_or_runtime_request_detected: repo,
    pipeline_control_request_detected: pipelineControl,
    pipeline_status_request_detected: pipelineStatus,
    affirmative_operator_command_detected: isAffirmativeOperatorCommand(promptText),
    contextual_tool_mentions: contextualToolMentions,
    negated_or_contextual_control_detected: contextualToolMentions.length > 0 || /\b(?:haven't|have not|not|without|before|after|if|when|was|whether|why\s+did)\b[\s\S]{0,100}\b(?:interval|cadence|rate|tool|click|open|start|run|capture|refresh|repair|inspect|verify|set_rate)\b/i.test(promptText),
    mixed_intent_detected: promptShape === "mixed",
  };
  const sourceTargetIntent = readRecord(input.payload.source_target_intent);
  const routeContract = readRecord(input.payload.route_product_contract);
  const loopTrace = (input.loopParityTrace ?? readRecord(input.payload.loop_parity_trace)) as HelixLoopParityTrace | RecordLike | null;
  const sourceTarget = readString(sourceTargetIntent?.target_source) || readString(routeContract?.source_target) || "unknown";
  const targetKind = readString(sourceTargetIntent?.target_kind) || sourceTarget;
  const terminalArtifactKind = readString(input.terminalArtifactKind) || "unknown";
  const finalAnswerSource = readString(input.finalAnswerSource) || "unknown";
  const selectedRefs = selectedRefsFromPayload(input.payload);
  const rejectedRefs = rejectedRefsFromPayload(input.payload);
  const actualToolCalls = Array.isArray(loopTrace?.actual_tool_calls) ? loopTrace.actual_tool_calls : [];
  const hasReceiptToolResult = actualToolCalls.length > 0 || /receipt/i.test(`${terminalArtifactKind} ${finalAnswerSource}`);
  const evidenceSelectedCount = Array.isArray(loopTrace?.evidence_selected_for_answer)
    ? loopTrace.evidence_selected_for_answer.length
    : selectedRefs.length;
  const observationsCreatedCount = Array.isArray(loopTrace?.observations_created)
    ? loopTrace.observations_created.length
    : 0;
  const evidenceRejected = Array.isArray(loopTrace?.evidence_rejected_for_answer)
    ? loopTrace.evidence_rejected_for_answer
        .map((entry) => readRecord(entry))
        .filter((entry): entry is RecordLike => Boolean(entry))
        .map((entry) => ({ ref: readString(entry.ref) || "unknown", reason: readString(entry.reason) || "unknown" }))
    : rejectedRefs.map((ref) => ({ ref, reason: "rejected_or_excluded" }));
  const terminalSelectionRan = readBoolean(loopTrace?.terminal_selection_ran_after_observations) || Boolean(readRecord(input.payload.route_authority_audit));
  const finalArbitrationRan = Boolean(readRecord(input.payload.route_authority_audit) && readRecord(input.payload.poison_audit) && readRecord(input.payload.terminal_answer_authority));
  const pureControlReceipt = sourceTarget === "live_pipeline" && terminalArtifactKind === "live_pipeline_receipt" && pipelineControl && !visual && !procedure && !repo;
  const followupRequired = !pureControlReceipt && (visual || procedure || repo || promptShape === "mixed" || evidenceSelectedCount > 0 || observationsCreatedCount > 0);
  const followupRan = loopTrace?.followup_reasoning_ran === true ? true : pureControlReceipt ? "not_applicable" : finalArbitrationRan;
  const routeAuthorityOk = readBoolean(loopTrace?.route_authority_ok) || readBoolean(readRecord(input.payload.route_authority_audit)?.route_authority_ok);
  const poisonAuditOk = readBoolean(loopTrace?.poison_audit_ok) || readBoolean(readRecord(input.payload.poison_audit)?.ok);
  const terminalAuthorityOk = readBoolean(loopTrace?.terminal_authority_ok) || readBoolean(readRecord(input.payload.terminal_answer_authority)?.server_authoritative);
  const unexpectedToolCalls = readStringArray(loopTrace?.unexpected_tool_calls);
  const loopFlags = readStringArray(loopTrace?.short_circuit_risk_flags);
  const solverFlags = unique([
    ...loopFlags,
    !routeContract && sourceTarget !== "unknown" ? "route_contract_missing" : "",
    unexpectedToolCalls.length > 0 ? "tool_called_without_admission" : "",
    (visual || procedure || repo) && terminalArtifactKind === "live_pipeline_receipt" ? "receipt_promoted_to_answer" : "",
    hasReceiptToolResult && (visual || procedure || repo) && terminalArtifactKind !== "typed_failure" && terminalArtifactKind !== "situation_context_pack" ? "receipt_used_before_content_arbitration" : "",
    evidenceSelectedCount > 0 && !terminalSelectionRan ? "evidence_selected_without_terminal_arbitration" : "",
    !finalArbitrationRan ? "final_answer_before_authority_chain" : "",
    followupRequired && followupRan !== true && followupRan !== "not_applicable" ? "followup_reasoning_missing" : "",
    promptInterpretation.negated_or_contextual_control_detected && unexpectedToolCalls.length > 0 ? "contextual_tool_mention_became_execution" : "",
  ].filter(Boolean));
  const completedSolverPath = finalArbitrationRan && routeAuthorityOk && poisonAuditOk && terminalAuthorityOk && solverFlags.length === 0;
  const intentHypotheses = collectIntentHypotheses({
    payload: input.payload,
    selectedRoute: input.selectedRoute,
    terminalArtifactKind,
    sourceTarget,
    routeContract,
  });

  return {
    schema: "helix.ask_turn_solver_trace.v1",
    trace_id: `ask-turn-solver:${hashShort([input.turnId, promptText, input.selectedRoute, terminalArtifactKind])}`,
    turn_id: input.turnId,
    prompt_hash: hashShort(promptText),
    prompt_interpretation: promptInterpretation,
    intent_hypotheses: intentHypotheses,
    primary_intent: sourceTarget === "unknown"
      ? null
      : {
          intent_kind: input.selectedRoute,
          route: input.selectedRoute,
          source_target: sourceTarget,
          target_kind: targetKind,
          selection_reason: readString(sourceTargetIntent?.precedence_reason) || readString(routeContract?.precedence_reason) || "selected_route_after_source_admission",
        },
    secondary_intents: collectSecondaryIntents({
      promptShape,
      promptInterpretation,
      selectedRoute: input.selectedRoute,
      sourceTarget,
    }),
    source_admission_candidates: sourceTarget === "unknown"
      ? []
      : [{
          source_target: sourceTarget,
          target_kind: targetKind,
          strength: readString(sourceTargetIntent?.strength) || "unknown",
          admitted: true,
          requested_outputs: readStringArray(sourceTargetIntent?.requested_outputs),
          selected_source_refs: selectedRefs,
          rejected_source_refs: rejectedRefs,
        }],
    tool_admission_candidates: buildToolAdmissionCandidates(loopTrace),
    evidence_requests: buildEvidenceRequests({ sourceTarget, routeContract, sourceTargetIntent }),
    evidence_results: {
      observations_created_count: observationsCreatedCount,
      evidence_selected_for_answer_count: evidenceSelectedCount,
      evidence_rejected_for_answer_count: evidenceRejected.length,
      selected_refs: Array.isArray(loopTrace?.evidence_selected_for_answer) ? readStringArray(loopTrace.evidence_selected_for_answer) : selectedRefs,
      rejected_refs: evidenceRejected,
    },
    evidence_reentry: {
      tool_results_returned_to_turn: readBoolean(loopTrace?.tool_results_returned_to_turn),
      observations_reentered_for_arbitration: evidenceSelectedCount === 0 || terminalSelectionRan,
      terminal_selection_ran_after_observations: terminalSelectionRan,
      receipts_treated_as_observations: hasReceiptToolResult ? finalArbitrationRan : true,
    },
    followup_reasoning: {
      required: followupRequired,
      ran: followupRan,
      final_arbitration_ran: finalArbitrationRan,
      requirement_reason: followupRequired
        ? "content, procedure, repo/runtime, mixed-intent, or selected evidence requires final arbitration after evidence"
        : "pure control/status receipt can terminate through receipt contract",
    },
    authority_chain: {
      route_authority_ok: routeAuthorityOk,
      poison_audit_ok: poisonAuditOk,
      terminal_authority_ok: terminalAuthorityOk,
      terminal_artifact_kind: terminalArtifactKind,
      final_answer_source: finalAnswerSource,
    },
    solver_short_circuit_flags: solverFlags,
    completed_solver_path: completedSolverPath,
    codex_boundary: {
      duplicates_codex_runtime: false,
      codex_owned_runtime_mechanics: readStringArray(loopTrace?.codex_owned_touched),
      helix_owned_policy_mechanics: unique([
        ...readStringArray(loopTrace?.helix_owned_touched),
        "prompt_interpretation_policy",
        "intent_hypothesis_admission",
        "evidence_reentry_trace",
        "terminal_eligibility_policy",
      ]),
      boundary_note: "This trace records Helix-owned admission/proof policy only; it does not sample models, execute tools, sandbox commands, retry, compact, spawn subagents, or complete Codex turns.",
    },
    assistant_answer: false,
    raw_content_included: false,
  };
}
