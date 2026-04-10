import {
  buildHelixAskObjectiveUnknownBlock,
  isHelixAskGenericUnknownScaffold,
  sanitizeHelixAskObjectiveUnknownBlock,
} from "./objective-assembly";

export type HelixAskObjectiveLoopStatus =
  | "pending"
  | "retrieving"
  | "synthesizing"
  | "critiqued"
  | "repaired"
  | "complete"
  | "blocked";

export type HelixAskObjectiveStepVerb =
  | "PLAN"
  | "RETRIEVE"
  | "MINI_SYNTH"
  | "MINI_CRITIC"
  | "REPAIR"
  | "ASSEMBLE"
  | "UNKNOWN_TERMINAL";

export type HelixAskObjectiveStepTranscript = {
  objective_id: string;
  attempt: number;
  verb: HelixAskObjectiveStepVerb;
  phase: "objective_loop" | "assembly" | "turn";
  started_at: string;
  ended_at: string;
  llm_model?: string | null;
  reasoning_effort?: string | null;
  schema_name?: string | null;
  schema_valid?: boolean;
  prompt_preview?: string | null;
  output_preview?: string | null;
  decision: string;
  decision_reason?: string | null;
  evidence_delta?: {
    before_ref_count?: number;
    after_ref_count?: number;
    before_coverage_ratio?: number;
    after_coverage_ratio?: number;
    before_oes?: number;
    after_oes?: number;
  };
  validator?: {
    preconditions_ok: boolean;
    postconditions_ok: boolean;
    violations: string[];
  };
};

export type HelixAskObjectiveLoopState = {
  objective_id: string;
  objective_label: string;
  required_slots: string[];
  matched_slots: string[];
  status: HelixAskObjectiveLoopStatus;
  attempt: number;
  started_at?: string;
  ended_at?: string;
  blocked_reason?: string;
  retrieval_confidence?: number;
};

export type HelixAskObjectiveTransition = {
  objective_id: string;
  from: HelixAskObjectiveLoopStatus | null;
  to: HelixAskObjectiveLoopStatus;
  reason: string;
  at: string;
};

export type HelixAskObjectiveRetrievalPass = {
  pass_index: number;
  reason: string;
  objective_ids: string[];
  query_count: number;
  query_preview: string[];
  selected_files_count?: number;
  selected_files?: string[];
  retrieval_confidence_before?: number;
  retrieval_confidence_after?: number;
  completed_objective_ids?: string[];
  blocked_objective_ids?: string[];
  exhausted?: boolean;
  at: string;
};

export type HelixAskObjectiveMiniAnswerStatus = "covered" | "partial" | "blocked";

export type HelixAskObjectiveUnknownBlock = {
  unknown: string;
  why: string;
  what_i_checked: string[];
  next_retrieval: string;
};

export type HelixAskObjectiveMiniAnswer = {
  objective_id: string;
  objective_label: string;
  status: HelixAskObjectiveMiniAnswerStatus;
  matched_slots: string[];
  missing_slots: string[];
  evidence_refs: string[];
  linked_evidence_refs?: string[];
  summary: string;
  unknown_block?: HelixAskObjectiveUnknownBlock;
};

export type HelixAskObjectiveEvidenceScore = {
  objective_id: string;
  score: number;
  threshold: number;
  pass: boolean;
  slot_ratio: number;
  evidence_ref_count: number;
  linked_evidence_ref_count?: number;
  retrieval_confidence: number;
  status: HelixAskObjectiveMiniAnswerStatus;
  reason: string;
};

export type HelixAskObjectiveMiniValidation = {
  total: number;
  covered: number;
  partial: number;
  blocked: number;
  unresolved: number;
};

export type HelixAskObjectivePlainReasoningTrace = {
  objective_id: string;
  objective_label: string;
  final_status: HelixAskObjectiveMiniAnswerStatus;
  plain_reasoning: string;
  transition_tail: string[];
  unknown_block?: HelixAskObjectiveUnknownBlock;
  used_telemetry: {
    required_slots: string[];
    matched_slots: string[];
    missing_slots: string[];
    retrieval_confidence: number;
    evidence_refs: string[];
    evidence_ref_count: number;
    retrieval_pass_count: number;
    scoped_retrieval_observed: boolean;
    objective_oes_score: number | null;
    objective_oes_threshold: number | null;
    objective_oes_pass: boolean | null;
    mini_critic_reason: string | null;
    terminalization_reason: string | null;
    blocked_reason: string | null;
  };
};

export type HelixAskObjectiveTelemetryUsed = {
  version: "v1";
  objective_unresolved_count_terminal: number;
  objective_coverage_unresolved_count: number;
  objective_coverage_unresolved_objective_ids: string[];
  objective_unknown_block_count: number;
  objective_unresolved_without_unknown_block_count: number;
  objective_missing_scoped_retrieval_count: number;
  objective_finalize_gate_mode: "strict_covered" | "unknown_terminal" | "blocked";
  objective_finalize_gate_passed: boolean;
  mini_modes: {
    synth: "llm" | "heuristic_fallback" | "none";
    critic: "llm" | "heuristic_fallback" | "none";
    assembly: "llm" | "deterministic_fallback" | "none";
  };
  oes_thresholds: {
    covered: number;
    blocked: number;
  };
  signals: string[];
};

export type ObjectiveLoopContractInput = {
  required_slots?: string[] | null;
  objectives: Array<{
    label: string;
    required_slots?: string[] | null;
  }>;
};

export type HelixAskObjectiveSupport = {
  objective: string;
  supported: boolean;
  matched_slots: string[];
};

const HELIX_ASK_OBJECTIVE_LOOP_TERMINAL: ReadonlySet<HelixAskObjectiveLoopStatus> = new Set([
  "complete",
  "blocked",
]);

export const HELIX_ASK_OBJECTIVE_OES_COVERED_THRESHOLD = 0.75;
export const HELIX_ASK_OBJECTIVE_OES_BLOCKED_THRESHOLD = 0.5;

const normalizeSlotId = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const clampHelixAskUnitInterval = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

export const isHelixAskObjectiveTerminalStatus = (
  status: HelixAskObjectiveLoopStatus,
): boolean => HELIX_ASK_OBJECTIVE_LOOP_TERMINAL.has(status);

export const isHelixAskObjectiveCoverageSatisfied = (
  state: HelixAskObjectiveLoopState,
): boolean =>
  state.required_slots.length === 0 ||
  state.required_slots.every((slot) => state.matched_slots.includes(slot));

export const hasHelixAskObjectiveUnknownBlock = (
  block: HelixAskObjectiveUnknownBlock | undefined,
): boolean => {
  if (!block) return false;
  const combined = [
    String(block.unknown ?? "").trim(),
    String(block.why ?? "").trim(),
    ...(Array.isArray(block.what_i_checked) ? block.what_i_checked : []),
    String(block.next_retrieval ?? "").trim(),
  ].join("\n");
  return Boolean(
    String(block.unknown ?? "").trim() &&
      String(block.why ?? "").trim() &&
      Array.isArray(block.what_i_checked) &&
      block.what_i_checked.some((entry) => String(entry ?? "").trim().length > 0) &&
      String(block.next_retrieval ?? "").trim() &&
      !isHelixAskGenericUnknownScaffold(combined),
  );
};

export const enforceHelixAskObjectiveUnknownBlocks = (args: {
  miniAnswers: HelixAskObjectiveMiniAnswer[];
  maxObjectives: number;
}): {
  miniAnswers: HelixAskObjectiveMiniAnswer[];
  missingObjectiveIds: string[];
} => {
  const missingObjectiveIds = args.miniAnswers
    .filter((entry) => entry.status !== "covered")
    .filter((entry) => !hasHelixAskObjectiveUnknownBlock(entry.unknown_block))
    .map((entry) => entry.objective_id)
    .slice(0, Math.max(0, args.maxObjectives));
  const missingSet = new Set(missingObjectiveIds);
  const patched = args.miniAnswers.map((entry) => {
    if (entry.status === "covered") {
      if (!entry.unknown_block) return entry;
      return {
        ...entry,
        unknown_block: undefined,
      };
    }
    if (!missingSet.has(entry.objective_id)) return entry;
    return {
      ...entry,
      unknown_block: sanitizeHelixAskObjectiveUnknownBlock({
        block: entry.unknown_block,
        objectiveLabel: entry.objective_label,
        missingSlots: entry.missing_slots,
        evidenceRefs: entry.evidence_refs,
        scopedRetrievalMissing: false,
      }),
    };
  });
  return {
    miniAnswers: patched,
    missingObjectiveIds,
  };
};

export const scoreHelixAskObjectiveEvidenceSufficiency = (args: {
  miniAnswer: HelixAskObjectiveMiniAnswer;
  state?: HelixAskObjectiveLoopState;
  threshold?: number;
}): HelixAskObjectiveEvidenceScore => {
  const threshold = Number.isFinite(args.threshold ?? NaN)
    ? Number(args.threshold)
    : HELIX_ASK_OBJECTIVE_OES_COVERED_THRESHOLD;
  const state = args.state;
  const requiredSlots =
    state?.required_slots.length
      ? state.required_slots
      : Array.from(new Set([...args.miniAnswer.matched_slots, ...args.miniAnswer.missing_slots]));
  const matchedSlots = requiredSlots.filter((slot) =>
    args.miniAnswer.matched_slots.includes(slot),
  );
  const slotRatio =
    requiredSlots.length > 0
      ? clampHelixAskUnitInterval(matchedSlots.length / requiredSlots.length)
      : args.miniAnswer.status === "covered"
        ? 1
        : 0;
  const linkedEvidenceRefCount = Array.from(
    new Set(
      (args.miniAnswer.linked_evidence_refs ?? args.miniAnswer.evidence_refs)
        .map((entry) => String(entry ?? "").trim())
        .filter(Boolean),
    ),
  ).length;
  const sourceRatio = clampHelixAskUnitInterval(linkedEvidenceRefCount / 2);
  const retrievalConfidence = clampHelixAskUnitInterval(Number(state?.retrieval_confidence ?? 0));
  const zeroConfidenceNoEvidenceLink = retrievalConfidence <= 0 && linkedEvidenceRefCount <= 0;
  const score = Number(
    (
      (zeroConfidenceNoEvidenceLink ? 0 : 0.55 * slotRatio + 0.25 * sourceRatio + 0.2 * retrievalConfidence)
    ).toFixed(4),
  );
  const pass = score >= threshold;
  return {
    objective_id: args.miniAnswer.objective_id,
    score,
    threshold,
    pass,
    slot_ratio: Number(slotRatio.toFixed(4)),
    evidence_ref_count: linkedEvidenceRefCount,
    linked_evidence_ref_count: linkedEvidenceRefCount,
    retrieval_confidence: Number(retrievalConfidence.toFixed(4)),
    status: args.miniAnswer.status,
    reason: zeroConfidenceNoEvidenceLink
      ? "objective_zero_confidence_missing_evidence_linkage"
      : pass
        ? "objective_oes_pass"
        : "objective_oes_below_threshold",
  };
};

export const enforceHelixAskObjectiveEvidenceSufficiency = (args: {
  miniAnswers: HelixAskObjectiveMiniAnswer[];
  states: HelixAskObjectiveLoopState[];
  coveredThreshold?: number;
  blockedThreshold?: number;
}): {
  miniAnswers: HelixAskObjectiveMiniAnswer[];
  scores: HelixAskObjectiveEvidenceScore[];
  terminalizationReasons: Record<string, string>;
} => {
  const coveredThreshold = Number.isFinite(args.coveredThreshold ?? NaN)
    ? Number(args.coveredThreshold)
    : HELIX_ASK_OBJECTIVE_OES_COVERED_THRESHOLD;
  const blockedThreshold = Number.isFinite(args.blockedThreshold ?? NaN)
    ? Number(args.blockedThreshold)
    : HELIX_ASK_OBJECTIVE_OES_BLOCKED_THRESHOLD;
  const stateById = new Map(args.states.map((entry) => [entry.objective_id, entry] as const));
  const scores: HelixAskObjectiveEvidenceScore[] = [];
  const terminalizationReasons: Record<string, string> = {};
  const patched = args.miniAnswers.map((entry) => {
    const score = scoreHelixAskObjectiveEvidenceSufficiency({
      miniAnswer: entry,
      state: stateById.get(entry.objective_id),
      threshold: coveredThreshold,
    });
    scores.push(score);
    const unknownBlock = entry.unknown_block ?? buildHelixAskObjectiveUnknownBlock({
      objectiveLabel: entry.objective_label,
      missingSlots: entry.missing_slots,
      evidenceRefs: entry.evidence_refs,
    });
    if (entry.status === "covered" && score.score < coveredThreshold) {
      const downgradedStatus: HelixAskObjectiveMiniAnswerStatus =
        score.score < blockedThreshold ? "blocked" : "partial";
      terminalizationReasons[entry.objective_id] =
        downgradedStatus === "blocked"
          ? "objective_oes_below_block_threshold"
          : "objective_oes_below_covered_threshold";
      return {
        ...entry,
        status: downgradedStatus,
        missing_slots:
          entry.missing_slots.length > 0
            ? entry.missing_slots
            : ["evidence"],
        summary: `${entry.summary} OES=${score.score.toFixed(2)} below covered threshold ${coveredThreshold.toFixed(2)}.`.trim(),
        unknown_block: unknownBlock,
      };
    }
    if (entry.status === "partial" && score.score < blockedThreshold) {
      terminalizationReasons[entry.objective_id] = "objective_oes_partial_below_block_threshold";
      return {
        ...entry,
        status: "blocked",
        summary: `${entry.summary} OES=${score.score.toFixed(2)} below blocked threshold ${blockedThreshold.toFixed(2)}.`.trim(),
        unknown_block: unknownBlock,
      };
    }
    if (entry.status !== "covered") {
      terminalizationReasons[entry.objective_id] = "objective_unresolved";
    } else {
      terminalizationReasons[entry.objective_id] = "objective_covered";
    }
    return entry;
  });
  return {
    miniAnswers: patched,
    scores,
    terminalizationReasons,
  };
};

export const buildHelixAskObjectiveLoopState = (
  contract: ObjectiveLoopContractInput | null,
  deps: { slugifySectionId: (value: string, fallback: string) => string },
): HelixAskObjectiveLoopState[] => {
  if (!contract || contract.objectives.length === 0) return [];
  const contractFallbackRequiredSlots = Array.from(
    new Set((contract.required_slots ?? []).map((slot) => normalizeSlotId(slot)).filter(Boolean)),
  );
  return contract.objectives.map((objective, index) => {
    const objectiveId = deps.slugifySectionId(objective.label, `objective_${index + 1}`);
    const objectiveRequiredSlots = Array.from(
      new Set((objective.required_slots ?? []).map((slot) => normalizeSlotId(slot)).filter(Boolean)),
    );
    return {
      objective_id: objectiveId,
      objective_label: objective.label,
      required_slots:
        objectiveRequiredSlots.length > 0
          ? objectiveRequiredSlots
          : contractFallbackRequiredSlots,
      matched_slots: [],
      status: "pending",
      attempt: 0,
    };
  });
};

export const transitionHelixAskObjectiveState = (args: {
  state: HelixAskObjectiveLoopState;
  to: HelixAskObjectiveLoopStatus;
  reason: string;
  at?: string;
}): { state: HelixAskObjectiveLoopState; transition?: HelixAskObjectiveTransition } => {
  const at = args.at ?? new Date().toISOString();
  const from = args.state.status;
  const next: HelixAskObjectiveLoopState = { ...args.state };
  if (args.to === "retrieving") {
    next.attempt = Math.max(0, (next.attempt ?? 0) + 1);
    next.started_at = next.started_at ?? at;
    next.ended_at = undefined;
    next.blocked_reason = undefined;
  } else if (args.to === "blocked") {
    next.ended_at = at;
    next.blocked_reason = args.reason;
  } else if (args.to === "complete") {
    next.ended_at = at;
    next.blocked_reason = undefined;
  }
  next.status = args.to;
  const shouldRecordTransition = from !== args.to || args.to === "retrieving";
  if (!shouldRecordTransition) {
    return { state: next };
  }
  return {
    state: next,
    transition: {
      objective_id: next.objective_id,
      from,
      to: args.to,
      reason: args.reason,
      at,
    },
  };
};

const clipHelixAskObjectiveTransitionLog = (
  transitionLog: HelixAskObjectiveTransition[],
  transitionLogMax: number,
): HelixAskObjectiveTransition[] =>
  transitionLog.length > transitionLogMax
    ? transitionLog.slice(-transitionLogMax)
    : transitionLog;

const coerceHelixAskObjectiveRetrievalConfidence = (value?: number): number =>
  Number.isFinite(value) ? Number(value) : 0;

export const recordHelixAskObjectiveTransition = (args: {
  state: HelixAskObjectiveLoopState;
  to: HelixAskObjectiveLoopStatus;
  reason: string;
  transitionLog: HelixAskObjectiveTransition[];
  transitionLogMax: number;
  at?: string;
}): {
  state: HelixAskObjectiveLoopState;
  transitionLog: HelixAskObjectiveTransition[];
} => {
  const transitioned = transitionHelixAskObjectiveState({
    state: args.state,
    to: args.to,
    reason: args.reason,
    at: args.at,
  });
  if (!transitioned.transition) {
    return {
      state: transitioned.state,
      transitionLog: args.transitionLog,
    };
  }
  return {
    state: transitioned.state,
    transitionLog: clipHelixAskObjectiveTransitionLog(
      [...args.transitionLog, transitioned.transition],
      args.transitionLogMax,
    ),
  };
};

export const applyHelixAskObjectiveCoverageSnapshot = (args: {
  states: HelixAskObjectiveLoopState[];
  coveredSlots: string[];
  retrievalConfidence?: number;
  objectiveIds?: string[];
  transitionReason?: string;
  at?: string;
  transitionLog?: HelixAskObjectiveTransition[];
}): HelixAskObjectiveLoopState[] => {
  const covered = new Set(args.coveredSlots.map((slot) => normalizeSlotId(slot)).filter(Boolean));
  const objectiveScope =
    Array.isArray(args.objectiveIds) && args.objectiveIds.length > 0
      ? new Set(args.objectiveIds.map((entry) => String(entry ?? "").trim()).filter(Boolean))
      : null;
  const at = args.at ?? new Date().toISOString();
  const out: HelixAskObjectiveLoopState[] = [];
  for (const state of args.states) {
    if (objectiveScope && !objectiveScope.has(state.objective_id)) {
      out.push(state);
      continue;
    }
    const matched = state.required_slots.filter(
      (slot) => covered.has(slot) || state.matched_slots.includes(slot),
    );
    let next: HelixAskObjectiveLoopState = {
      ...state,
      matched_slots: Array.from(new Set(matched)),
      retrieval_confidence: Number.isFinite(args.retrievalConfidence)
        ? Number(args.retrievalConfidence)
        : state.retrieval_confidence,
    };
    if (
      !isHelixAskObjectiveTerminalStatus(next.status) &&
      isHelixAskObjectiveCoverageSatisfied(next) &&
      (next.status === "pending" || next.status === "retrieving")
    ) {
      const transitioned = transitionHelixAskObjectiveState({
        state: next,
        to: "synthesizing",
        reason: args.transitionReason ?? "objective_coverage_satisfied",
        at,
      });
      next = transitioned.state;
      if (transitioned.transition && args.transitionLog) {
        args.transitionLog.push(transitioned.transition);
      }
    }
    out.push(next);
  }
  return out;
};

export const summarizeHelixAskObjectiveLoopState = (states: HelixAskObjectiveLoopState[]) => {
  const total = states.length;
  const completeCount = states.filter((state) => state.status === "complete").length;
  const blockedCount = states.filter((state) => state.status === "blocked").length;
  const terminalCount = states.filter((state) => isHelixAskObjectiveTerminalStatus(state.status)).length;
  const unresolvedCount = Math.max(0, total - terminalCount);
  const completionRate = total > 0 ? Number((completeCount / total).toFixed(4)) : 1;
  return {
    total,
    completeCount,
    blockedCount,
    terminalCount,
    unresolvedCount,
    completionRate,
  };
};

export const buildHelixAskObjectivePlainReasoningTrace = (args: {
  miniAnswers: HelixAskObjectiveMiniAnswer[];
  states: HelixAskObjectiveLoopState[];
  scores: HelixAskObjectiveEvidenceScore[];
  transitions: HelixAskObjectiveTransition[];
  stepTranscripts: HelixAskObjectiveStepTranscript[];
  retrievalQueries: Array<{ objective_id: string }>;
  terminalizationReasons: Record<string, string>;
  normalizeText: (value: string, maxChars: number) => string;
}): HelixAskObjectivePlainReasoningTrace[] => {
  if (args.miniAnswers.length === 0) return [];
  const stateById = new Map(args.states.map((entry) => [entry.objective_id, entry] as const));
  const scoreById = new Map(args.scores.map((entry) => [entry.objective_id, entry] as const));
  const criticReasonById = new Map<string, string>();
  for (const transcript of args.stepTranscripts) {
    if (transcript.verb !== "MINI_CRITIC") continue;
    const objectiveId = String(transcript.objective_id ?? "").trim();
    if (!objectiveId) continue;
    const reason = String(transcript.decision_reason ?? "").trim();
    if (!reason) continue;
    criticReasonById.set(objectiveId, reason);
  }
  const transitionTailById = new Map<string, string[]>();
  for (const transition of args.transitions) {
    const objectiveId = String(transition.objective_id ?? "").trim();
    if (!objectiveId) continue;
    const from = transition.from ?? "null";
    const to = transition.to ?? "unknown";
    const reason = transition.reason ?? "unknown";
    const prior = transitionTailById.get(objectiveId) ?? [];
    prior.push(`${from} -> ${to} (${reason})`);
    transitionTailById.set(objectiveId, prior.slice(-4));
  }
  const retrievalPassCountById = new Map<string, number>();
  for (const row of args.retrievalQueries) {
    const objectiveId = String(row.objective_id ?? "").trim();
    if (!objectiveId) continue;
    retrievalPassCountById.set(objectiveId, (retrievalPassCountById.get(objectiveId) ?? 0) + 1);
  }
  return args.miniAnswers.map((entry) => {
    const objectiveId = entry.objective_id;
    const state = stateById.get(objectiveId);
    const requiredSlots =
      state?.required_slots.length
        ? state.required_slots
        : Array.from(new Set([...entry.matched_slots, ...entry.missing_slots]));
    const matchedSlots = Array.from(
      new Set(entry.matched_slots.filter((slot) => requiredSlots.includes(slot))),
    );
    const missingSlots = Array.from(
      new Set(entry.missing_slots.filter((slot) => requiredSlots.includes(slot))),
    );
    const evidenceRefs = Array.from(
      new Set(
        entry.evidence_refs.map((evidenceRef) => String(evidenceRef ?? "").trim()).filter(Boolean),
      ),
    ).slice(0, 8);
    const score = scoreById.get(objectiveId);
    const criticReason = criticReasonById.get(objectiveId) ?? null;
    const terminalizationReason = args.terminalizationReasons[objectiveId] ?? null;
    const retrievalPassCount = retrievalPassCountById.get(objectiveId) ?? 0;
    const plainReasoning = args.normalizeText(
      [
        `Status ${entry.status}.`,
        missingSlots.length > 0
          ? `Missing required slots: ${missingSlots.join(", ")}.`
          : "All required slots covered.",
        score
          ? `Objective evidence score ${score.score.toFixed(2)} vs threshold ${score.threshold.toFixed(2)} (${score.pass ? "pass" : "fail"}).`
          : "Objective evidence score unavailable.",
        criticReason ? `Mini-critic reason: ${criticReason}.` : "Mini-critic reason unavailable.",
        terminalizationReason ? `Terminalization reason: ${terminalizationReason}.` : null,
        retrievalPassCount > 0
          ? `Objective-scoped retrieval passes observed: ${retrievalPassCount}.`
          : "Objective-scoped retrieval pass not observed.",
        entry.unknown_block?.next_retrieval
          ? `Next retrieval action: ${entry.unknown_block.next_retrieval}`
          : null,
      ]
        .filter((line): line is string => Boolean(line && line.trim()))
        .join(" "),
      520,
    );
    return {
      objective_id: objectiveId,
      objective_label: entry.objective_label,
      final_status: entry.status,
      plain_reasoning: plainReasoning || `Status ${entry.status}.`,
      transition_tail: transitionTailById.get(objectiveId) ?? [],
      unknown_block: entry.unknown_block,
      used_telemetry: {
        required_slots: requiredSlots,
        matched_slots: matchedSlots,
        missing_slots: missingSlots,
        retrieval_confidence: Number(
          clampHelixAskUnitInterval(Number(state?.retrieval_confidence ?? 0)).toFixed(4),
        ),
        evidence_refs: evidenceRefs,
        evidence_ref_count: evidenceRefs.length,
        retrieval_pass_count: retrievalPassCount,
        scoped_retrieval_observed: retrievalPassCount > 0,
        objective_oes_score: score ? Number(score.score.toFixed(4)) : null,
        objective_oes_threshold: score ? Number(score.threshold.toFixed(4)) : null,
        objective_oes_pass: score ? Boolean(score.pass) : null,
        mini_critic_reason: criticReason,
        terminalization_reason: terminalizationReason,
        blocked_reason: state?.blocked_reason ?? null,
      },
    };
  });
};

export const finalizeHelixAskObjectiveLoopState = (args: {
  states: HelixAskObjectiveLoopState[];
  validationPassed: boolean;
  failReason?: string | null;
  at?: string;
  transitionLog?: HelixAskObjectiveTransition[];
}): HelixAskObjectiveLoopState[] => {
  const at = args.at ?? new Date().toISOString();
  return args.states.map((state) => {
    if (isHelixAskObjectiveTerminalStatus(state.status)) return state;
    const coverageSatisfied = isHelixAskObjectiveCoverageSatisfied(state);
    const to =
      args.validationPassed && coverageSatisfied
        ? "complete"
        : ("blocked" as HelixAskObjectiveLoopStatus);
    const reason =
      to === "complete"
        ? "objective_finalize_complete"
        : args.failReason?.trim()
          ? args.failReason.trim()
          : coverageSatisfied
            ? "quality_gate_fail"
            : "missing_required_slots";
    const transitioned = transitionHelixAskObjectiveState({
      state,
      to,
      reason,
      at,
    });
    if (transitioned.transition && args.transitionLog) {
      args.transitionLog.push(transitioned.transition);
    }
    return transitioned.state;
  });
};

export const beginHelixAskObjectiveRetrievalPass = (args: {
  objectiveLoopEnabled: boolean;
  objectiveLoopState: HelixAskObjectiveLoopState[];
  objectiveTransitionLog: HelixAskObjectiveTransition[];
  objectiveRetrievalPasses: HelixAskObjectiveRetrievalPass[];
  retrievalConfidence?: number;
  reason: string;
  queries: string[];
  objectiveIds?: string[];
  objectiveTransitionLogMax: number;
  objectiveRetrievalPassLogMax: number;
  at?: string;
}): {
  objectiveLoopState: HelixAskObjectiveLoopState[];
  objectiveTransitionLog: HelixAskObjectiveTransition[];
  objectiveRetrievalPasses: HelixAskObjectiveRetrievalPass[];
  objectiveRetrievalExhausted: boolean;
} => {
  if (!args.objectiveLoopEnabled || args.objectiveLoopState.length === 0) {
    return {
      objectiveLoopState: args.objectiveLoopState,
      objectiveTransitionLog: args.objectiveTransitionLog,
      objectiveRetrievalPasses: args.objectiveRetrievalPasses,
      objectiveRetrievalExhausted: false,
    };
  }
  const objectiveScope =
    Array.isArray(args.objectiveIds) && args.objectiveIds.length > 0
      ? new Set(args.objectiveIds.map((entry) => String(entry ?? "").trim()).filter(Boolean))
      : null;
  const at = args.at ?? new Date().toISOString();
  let objectiveTransitionLog = args.objectiveTransitionLog;
  const objectiveLoopState = args.objectiveLoopState.map((state) => {
    if (isHelixAskObjectiveTerminalStatus(state.status)) return state;
    if (objectiveScope && !objectiveScope.has(state.objective_id)) return state;
    const transitioned = recordHelixAskObjectiveTransition({
      state,
      to: "retrieving",
      reason: args.reason,
      transitionLog: objectiveTransitionLog,
      transitionLogMax: args.objectiveTransitionLogMax,
      at,
    });
    objectiveTransitionLog = transitioned.transitionLog;
    return transitioned.state;
  });
  const summary = summarizeHelixAskObjectiveLoopState(objectiveLoopState);
  const scopedObjectiveIds = objectiveScope
    ? objectiveLoopState
        .filter((entry) => objectiveScope.has(entry.objective_id))
        .map((entry) => entry.objective_id)
    : objectiveLoopState.map((entry) => entry.objective_id);
  let objectiveRetrievalPasses = [
    ...args.objectiveRetrievalPasses,
    {
      pass_index: args.objectiveRetrievalPasses.length + 1,
      reason: args.reason,
      objective_ids: scopedObjectiveIds,
      query_count: args.queries.length,
      query_preview: args.queries.slice(0, 8),
      retrieval_confidence_before: coerceHelixAskObjectiveRetrievalConfidence(args.retrievalConfidence),
      retrieval_confidence_after: coerceHelixAskObjectiveRetrievalConfidence(args.retrievalConfidence),
      completed_objective_ids: objectiveLoopState
        .filter((entry) => entry.status === "complete")
        .map((entry) => entry.objective_id),
      blocked_objective_ids: objectiveLoopState
        .filter((entry) => entry.status === "blocked")
        .map((entry) => entry.objective_id),
      exhausted: summary.unresolvedCount > 0,
      at,
    },
  ];
  if (objectiveRetrievalPasses.length > args.objectiveRetrievalPassLogMax) {
    objectiveRetrievalPasses = objectiveRetrievalPasses.slice(-args.objectiveRetrievalPassLogMax);
  }
  return {
    objectiveLoopState,
    objectiveTransitionLog,
    objectiveRetrievalPasses,
    objectiveRetrievalExhausted: summary.unresolvedCount > 0,
  };
};

export const applyHelixAskObjectiveCoverageSnapshotRuntime = (args: {
  objectiveLoopEnabled: boolean;
  objectiveLoopState: HelixAskObjectiveLoopState[];
  objectiveTransitionLog: HelixAskObjectiveTransition[];
  objectiveRetrievalPasses: HelixAskObjectiveRetrievalPass[];
  coveredSlots: string[];
  reason: string;
  files?: string[];
  retrievalConfidence?: number;
  objectiveIds?: string[];
}): {
  objectiveLoopState: HelixAskObjectiveLoopState[];
  objectiveTransitionLog: HelixAskObjectiveTransition[];
  objectiveRetrievalPasses: HelixAskObjectiveRetrievalPass[];
  objectiveRetrievalExhausted: boolean;
} => {
  if (!args.objectiveLoopEnabled || args.objectiveLoopState.length === 0) {
    return {
      objectiveLoopState: args.objectiveLoopState,
      objectiveTransitionLog: args.objectiveTransitionLog,
      objectiveRetrievalPasses: args.objectiveRetrievalPasses,
      objectiveRetrievalExhausted: false,
    };
  }
  const objectiveTransitionLog = [...args.objectiveTransitionLog];
  const objectiveLoopState = applyHelixAskObjectiveCoverageSnapshot({
    states: args.objectiveLoopState,
    coveredSlots: args.coveredSlots,
    objectiveIds: args.objectiveIds,
    retrievalConfidence: args.retrievalConfidence,
    transitionReason: args.reason,
    transitionLog: objectiveTransitionLog,
  });
  const summary = summarizeHelixAskObjectiveLoopState(objectiveLoopState);
  let objectiveRetrievalPasses = args.objectiveRetrievalPasses;
  if (objectiveRetrievalPasses.length > 0) {
    const lastIndex = objectiveRetrievalPasses.length - 1;
    const last = objectiveRetrievalPasses[lastIndex];
    objectiveRetrievalPasses = objectiveRetrievalPasses.map((entry, index) =>
      index !== lastIndex
        ? entry
        : {
            ...last,
            selected_files_count: args.files?.length ?? last.selected_files_count ?? 0,
            selected_files: (args.files ?? []).slice(0, 16),
            retrieval_confidence_after: coerceHelixAskObjectiveRetrievalConfidence(
              args.retrievalConfidence,
            ),
            completed_objective_ids: objectiveLoopState
              .filter((entry) => entry.status === "complete")
              .map((entry) => entry.objective_id),
            blocked_objective_ids: objectiveLoopState
              .filter((entry) => entry.status === "blocked")
              .map((entry) => entry.objective_id),
            exhausted: summary.unresolvedCount > 0,
          },
    );
  }
  return {
    objectiveLoopState,
    objectiveTransitionLog,
    objectiveRetrievalPasses,
    objectiveRetrievalExhausted: summary.unresolvedCount > 0,
  };
};

export const reconcileHelixAskObjectiveLoopFromSupport = (args: {
  objectiveLoopEnabled: boolean;
  objectiveLoopState: HelixAskObjectiveLoopState[];
  objectiveTransitionLog: HelixAskObjectiveTransition[];
  objectiveSupport: HelixAskObjectiveSupport[];
  objectiveTransitionLogMax: number;
  reason?: string;
}): {
  objectiveLoopState: HelixAskObjectiveLoopState[];
  objectiveTransitionLog: HelixAskObjectiveTransition[];
} => {
  if (
    !args.objectiveLoopEnabled ||
    args.objectiveLoopState.length === 0 ||
    args.objectiveSupport.length === 0
  ) {
    return {
      objectiveLoopState: args.objectiveLoopState,
      objectiveTransitionLog: args.objectiveTransitionLog,
    };
  }
  const supportByLabel = new Map(
    args.objectiveSupport.map((entry) => [entry.objective.trim().toLowerCase(), entry] as const),
  );
  let objectiveTransitionLog = args.objectiveTransitionLog;
  const objectiveLoopState = args.objectiveLoopState.map((state) => {
    if (isHelixAskObjectiveTerminalStatus(state.status)) return state;
    const support = supportByLabel.get(state.objective_label.trim().toLowerCase());
    if (!support) return state;
    const supportMatched = new Set(
      (support.matched_slots ?? []).map((slot) => normalizeSlotId(slot)).filter(Boolean),
    );
    let nextMatchedSlots = state.required_slots.filter((slot) => supportMatched.has(slot));
    if (support.supported && nextMatchedSlots.length === 0 && state.required_slots.length > 0) {
      nextMatchedSlots = state.required_slots.slice();
    }
    const next: HelixAskObjectiveLoopState = {
      ...state,
      matched_slots: Array.from(new Set(nextMatchedSlots)),
    };
    if (
      isHelixAskObjectiveCoverageSatisfied(next) &&
      (next.status === "pending" || next.status === "retrieving")
    ) {
      const transitioned = recordHelixAskObjectiveTransition({
        state: next,
        to: "synthesizing",
        reason: args.reason ?? "objective_support_reconciled",
        transitionLog: objectiveTransitionLog,
        transitionLogMax: args.objectiveTransitionLogMax,
      });
      objectiveTransitionLog = transitioned.transitionLog;
      return transitioned.state;
    }
    return next;
  });
  return {
    objectiveLoopState,
    objectiveTransitionLog,
  };
};

export const setHelixAskObjectiveLoopPhase = (args: {
  objectiveLoopEnabled: boolean;
  objectiveLoopState: HelixAskObjectiveLoopState[];
  objectiveTransitionLog: HelixAskObjectiveTransition[];
  nextStatus: HelixAskObjectiveLoopStatus;
  reason: string;
  objectiveTransitionLogMax: number;
  filter?: (state: HelixAskObjectiveLoopState) => boolean;
}): {
  objectiveLoopState: HelixAskObjectiveLoopState[];
  objectiveTransitionLog: HelixAskObjectiveTransition[];
} => {
  if (!args.objectiveLoopEnabled || args.objectiveLoopState.length === 0) {
    return {
      objectiveLoopState: args.objectiveLoopState,
      objectiveTransitionLog: args.objectiveTransitionLog,
    };
  }
  let objectiveTransitionLog = args.objectiveTransitionLog;
  const objectiveLoopState = args.objectiveLoopState.map((state) => {
    if (isHelixAskObjectiveTerminalStatus(state.status)) return state;
    if (args.filter && !args.filter(state)) return state;
    const transitioned = recordHelixAskObjectiveTransition({
      state,
      to: args.nextStatus,
      reason: args.reason,
      transitionLog: objectiveTransitionLog,
      transitionLogMax: args.objectiveTransitionLogMax,
    });
    objectiveTransitionLog = transitioned.transitionLog;
    return transitioned.state;
  });
  return {
    objectiveLoopState,
    objectiveTransitionLog,
  };
};

export const finalizeHelixAskObjectiveLoopRuntime = (args: {
  objectiveLoopEnabled: boolean;
  objectiveLoopState: HelixAskObjectiveLoopState[];
  objectiveTransitionLog: HelixAskObjectiveTransition[];
  validationPassed: boolean;
  failReason?: string | null;
  objectiveTransitionLogMax: number;
}): {
  objectiveLoopState: HelixAskObjectiveLoopState[];
  objectiveTransitionLog: HelixAskObjectiveTransition[];
  objectiveRetrievalExhausted: boolean;
} => {
  if (!args.objectiveLoopEnabled || args.objectiveLoopState.length === 0) {
    return {
      objectiveLoopState: args.objectiveLoopState,
      objectiveTransitionLog: args.objectiveTransitionLog,
      objectiveRetrievalExhausted: false,
    };
  }
  const objectiveTransitionLog = [...args.objectiveTransitionLog];
  const objectiveLoopState = finalizeHelixAskObjectiveLoopState({
    states: args.objectiveLoopState,
    validationPassed: args.validationPassed,
    failReason: args.failReason,
    transitionLog: objectiveTransitionLog,
  });
  const summary = summarizeHelixAskObjectiveLoopState(objectiveLoopState);
  return {
    objectiveLoopState,
    objectiveTransitionLog: clipHelixAskObjectiveTransitionLog(
      objectiveTransitionLog,
      args.objectiveTransitionLogMax,
    ),
    objectiveRetrievalExhausted: summary.unresolvedCount > 0,
  };
};

export const initializeHelixAskObjectiveLoopRuntime = (args: {
  objectiveLoopEnabled: boolean;
  objectiveLoopState: HelixAskObjectiveLoopState[];
  baseQuestion: string;
  llmModel?: string | null;
  clipText: (value: string, maxChars: number) => string;
}): {
  objectiveTransitionLog: HelixAskObjectiveTransition[];
  planTranscript?: HelixAskObjectiveStepTranscript;
} => {
  if (!args.objectiveLoopEnabled || args.objectiveLoopState.length === 0) {
    return {
      objectiveTransitionLog: [],
    };
  }
  const at = new Date().toISOString();
  const objectiveTransitionLog = args.objectiveLoopState.map((state) => ({
    objective_id: state.objective_id,
    from: null,
    to: state.status,
    reason: "initialized",
    at,
  }));
  const planPreview = args.objectiveLoopState
    .slice(0, 6)
    .map((state) => state.objective_label)
    .join(" | ");
  return {
    objectiveTransitionLog,
    planTranscript: {
      objective_id: args.objectiveLoopState[0]?.objective_id ?? "turn",
      attempt: 0,
      verb: "PLAN",
      phase: "turn",
      started_at: at,
      ended_at: at,
      llm_model: args.llmModel?.trim() || "gpt-4o-mini",
      reasoning_effort: "high",
      schema_name: "helix.ask.plan.v2",
      schema_valid: true,
      prompt_preview: args.clipText(args.baseQuestion, 240),
      output_preview: args.clipText(planPreview || "(no objective labels)", 280),
      decision: "plan_initialized",
      decision_reason: args.objectiveLoopState.length > 0 ? null : "no_objectives",
      validator: {
        preconditions_ok: true,
        postconditions_ok: args.objectiveLoopState.length > 0,
        violations: args.objectiveLoopState.length > 0 ? [] : ["no_objectives"],
      },
    },
  };
};

export const rebuildHelixAskObjectiveLoopStateFromContract = (args: {
  objectiveLoopEnabled: boolean;
  objectiveLoopState: HelixAskObjectiveLoopState[];
  objectiveTransitionLog: HelixAskObjectiveTransition[];
  contract: ObjectiveLoopContractInput | null;
  slugifySectionId: (value: string, fallback: string) => string;
  objectiveTransitionLogMax: number;
  at?: string;
}): {
  objectiveLoopState: HelixAskObjectiveLoopState[];
  objectiveTransitionLog: HelixAskObjectiveTransition[];
} => {
  if (!args.objectiveLoopEnabled) {
    return {
      objectiveLoopState: args.objectiveLoopState,
      objectiveTransitionLog: args.objectiveTransitionLog,
    };
  }
  const previousByLabel = new Map(
    args.objectiveLoopState.map((state) => [state.objective_label.toLowerCase(), state] as const),
  );
  const contractFallbackRequiredSlots = Array.from(
    new Set((args.contract?.required_slots ?? []).map((slot) => normalizeSlotId(slot)).filter(Boolean)),
  );
  const objectiveLoopState = buildHelixAskObjectiveLoopState(args.contract, {
    slugifySectionId: args.slugifySectionId,
  }).map((nextState) => {
    const hydratedRequiredSlots =
      nextState.required_slots.length > 0
        ? nextState.required_slots
        : contractFallbackRequiredSlots;
    const prev = previousByLabel.get(nextState.objective_label.toLowerCase());
    if (!prev) {
      return hydratedRequiredSlots === nextState.required_slots
        ? nextState
        : {
            ...nextState,
            required_slots: hydratedRequiredSlots,
          };
    }
    const hydratedRequiredSlotSet = new Set(hydratedRequiredSlots);
    return {
      ...nextState,
      required_slots: hydratedRequiredSlots,
      matched_slots: prev.matched_slots
        .filter((slot) => hydratedRequiredSlotSet.has(normalizeSlotId(slot)))
        .slice(0, hydratedRequiredSlots.length || 8),
      status: prev.status,
      attempt: prev.attempt,
      started_at: prev.started_at,
      ended_at: prev.ended_at,
      blocked_reason: prev.blocked_reason,
      retrieval_confidence: prev.retrieval_confidence,
    };
  });
  const at = args.at ?? new Date().toISOString();
  let objectiveTransitionLog = [...args.objectiveTransitionLog];
  for (const state of objectiveLoopState) {
    if (state.status !== "pending") continue;
    objectiveTransitionLog.push({
      objective_id: state.objective_id,
      from: null,
      to: "pending",
      reason: "contract_rebuild",
      at,
    });
  }
  return {
    objectiveLoopState,
    objectiveTransitionLog: clipHelixAskObjectiveTransitionLog(
      objectiveTransitionLog,
      args.objectiveTransitionLogMax,
    ),
  };
};
