type MutableDebugPayload = Record<string, unknown> | null | undefined;
type MutableResult = Record<string, unknown>;

type TermHitLike = {
  term_id: string;
  category: string;
  canonical: string;
  matched_in: string;
  match_type: string;
  term_hit_confidence: number;
};

type TermPriorDecisionLike = {
  term_hits: TermHitLike[];
  prior_suppressed_reason?: string | null;
} | null | undefined;

type MetricsRecorder = {
  recordHelixAskTermPriorImpact: (impact: "helped" | "harmed" | "neutral") => void;
  recordHelixAskTermRouteOutcome: (termId: string, intentDomain: string) => void;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const applyEquationTelemetryNormalization = (args: {
  debugPayload: MutableDebugPayload;
  answerPath: string[];
  equationStateVersion: string;
}): void => {
  if (!args.debugPayload) return;
  const debugPayloadRecord = args.debugPayload;
  const equationPromptDetectedForTelemetry =
    Boolean(
      (debugPayloadRecord.equation_quote_contract as
        | { required?: boolean | null }
        | null
        | undefined)?.required,
    ) ||
    typeof debugPayloadRecord.equation_selector_primary_key === "string" ||
    args.answerPath.some((entry) => entry.startsWith("equation") || entry.includes(":equation_"));
  if (!equationPromptDetectedForTelemetry) return;

  const selectorAuthorityLocked = Boolean(debugPayloadRecord.equation_selector_authority_lock);
  const primaryAnchorMatch =
    typeof debugPayloadRecord.equation_primary_anchor_match === "boolean"
      ? (debugPayloadRecord.equation_primary_anchor_match as boolean)
      : null;
  const anchorDriftDetected = selectorAuthorityLocked && primaryAnchorMatch === false;
  const inferredDegradePathId =
    typeof debugPayloadRecord.equation_degrade_path_id === "string" &&
    debugPayloadRecord.equation_degrade_path_id.length > 0
      ? (debugPayloadRecord.equation_degrade_path_id as string)
      : (() => {
          const fallbackMarker = args.answerPath.find(
            (entry) =>
              entry.startsWith("fallback:equation_") ||
              entry.startsWith("openWorldBypass:equation_") ||
              entry.startsWith("finalOutputGuard:final_empty_answer_equation_unified"),
          );
          if (!fallbackMarker) return null;
          if (fallbackMarker.startsWith("fallback:")) {
            return fallbackMarker.slice("fallback:".length);
          }
          if (fallbackMarker.startsWith("openWorldBypass:")) {
            return fallbackMarker.slice("openWorldBypass:".length);
          }
          return fallbackMarker;
        })();
  const inferredOverrideAttempted =
    args.answerPath.some(
      (entry) =>
        entry.includes("skipped_selector_lock") ||
        entry.includes("post_lock_override_blocked_final") ||
        entry.includes("post_lock_override_unrecoverable"),
    ) || Boolean(debugPayloadRecord.equation_post_lock_gate_override_attempted);
  const inferredOverrideBlocked =
    args.answerPath.some(
      (entry) =>
        entry.includes("skipped_selector_lock") ||
        entry.includes("post_lock_override_blocked_final") ||
        entry.includes("final_empty_answer_selector_restore"),
    ) || Boolean(debugPayloadRecord.equation_post_lock_gate_override_blocked);

  debugPayloadRecord.equation_state_version = args.equationStateVersion;
  if (debugPayloadRecord.equation_selection_lock_hash_expected === undefined) {
    debugPayloadRecord.equation_selection_lock_hash_expected = null;
  }
  if (debugPayloadRecord.equation_selection_lock_hash_current === undefined) {
    debugPayloadRecord.equation_selection_lock_hash_current = null;
  }
  if (debugPayloadRecord.equation_selection_lock_hash_match === undefined) {
    debugPayloadRecord.equation_selection_lock_hash_match = null;
  }
  if (debugPayloadRecord.equation_verified_label_integrity_reason === undefined) {
    debugPayloadRecord.equation_verified_label_integrity_reason = null;
  }
  debugPayloadRecord.equation_degrade_path_id = inferredDegradePathId;
  debugPayloadRecord.degrade_path_id = inferredDegradePathId;
  debugPayloadRecord.equation_post_lock_gate_override_attempted = inferredOverrideAttempted;
  debugPayloadRecord.equation_post_lock_gate_override_blocked = inferredOverrideBlocked;
  debugPayloadRecord.post_lock_gate_override_attempted = inferredOverrideAttempted;
  debugPayloadRecord.post_lock_gate_override_blocked = inferredOverrideBlocked;
  debugPayloadRecord.equation_anchor_drift_detected = anchorDriftDetected;
  debugPayloadRecord.anchor_drift_detected = anchorDriftDetected;
};

export const applyTermPriorTelemetry = (args: {
  termPriorDecision: TermPriorDecisionLike;
  termPriorApplied: boolean;
  termPriorRepoOverrideApplied: boolean;
  termPriorRepoEvidenceStrength: number;
  termPriorRepoEvidenceArtifactCount: number;
  intentDomain: string;
  debugPayload: MutableDebugPayload;
  metrics: MetricsRecorder;
  termPriorImpact: "helped" | "harmed" | "neutral";
}): "helped" | "harmed" | "neutral" => {
  if (!args.termPriorDecision) {
    return args.termPriorImpact;
  }

  let nextImpact = args.termPriorImpact;
  if (args.termPriorApplied && !args.termPriorRepoOverrideApplied) {
    nextImpact = args.intentDomain === "general" ? "helped" : "neutral";
  }
  if (!args.termPriorApplied) {
    nextImpact = "neutral";
  }
  args.metrics.recordHelixAskTermPriorImpact(nextImpact);
  for (const hit of args.termPriorDecision.term_hits) {
    args.metrics.recordHelixAskTermRouteOutcome(hit.term_id, args.intentDomain);
  }
  if (args.debugPayload) {
    const debugRecord = args.debugPayload;
    debugRecord.term_prior_impact = nextImpact;
    debugRecord.term_prior_repo_override_applied = args.termPriorRepoOverrideApplied;
    debugRecord.term_prior_repo_evidence_strength = Number(
      args.termPriorRepoEvidenceStrength.toFixed(4),
    );
    debugRecord.term_prior_repo_evidence_artifacts = args.termPriorRepoEvidenceArtifactCount;
  }
  return nextImpact;
};

export const applyMultilangResponseMetadata = (args: {
  includeMultilangMetadataForRequest: boolean;
  result: MutableResult;
  sourceLanguage: string | null;
  languageDetected: string | null;
  languageConfidence: number | null;
  codeMixedTurn: boolean;
  pivotConfidence: number | null;
  multilangDispatchState: string | null;
  multilangConfirm: boolean | null | undefined;
  responseLanguage: string | null;
  langSchemaVersion: string;
  interpreterStatus: string | null;
  interpreterConfidence: number | null;
  interpreterDispatchEligible: boolean;
  interpreterArtifact:
    | {
        dispatch_state?: string | null;
        confirm_prompt?: string | null;
        term_ids?: string[] | null;
        concept_ids?: string[] | null;
      }
    | null
    | undefined;
  interpreterSchemaVersion: string | null;
  termPriorDecision: TermPriorDecisionLike;
  termPriorApplied: boolean;
  termPriorImpact: "helped" | "harmed" | "neutral";
}): void => {
  if (!args.includeMultilangMetadataForRequest) return;

  if (args.result.source_language === undefined && args.sourceLanguage) {
    args.result.source_language = args.sourceLanguage;
  }
  if (args.result.language_detected === undefined) {
    args.result.language_detected = args.languageDetected ?? args.sourceLanguage;
  }
  if (args.result.language_confidence === undefined) {
    args.result.language_confidence = isFiniteNumber(args.languageConfidence)
      ? args.languageConfidence
      : null;
  }
  if (args.result.code_mixed === undefined) {
    args.result.code_mixed = args.codeMixedTurn;
  }
  if (args.result.pivot_confidence === undefined) {
    args.result.pivot_confidence = isFiniteNumber(args.pivotConfidence) ? args.pivotConfidence : null;
  }
  if (args.result.dispatch_state === undefined) {
    args.result.dispatch_state = args.multilangDispatchState;
  }
  if (args.result.needs_confirmation === undefined) {
    args.result.needs_confirmation =
      args.multilangDispatchState !== "auto" && args.multilangConfirm !== true;
  }
  if (args.result.response_language === undefined) {
    args.result.response_language = args.responseLanguage;
  }
  if (args.result.lang_schema_version === undefined) {
    args.result.lang_schema_version = args.langSchemaVersion;
  }
  if (args.result.interpreter_status === undefined) {
    args.result.interpreter_status = args.interpreterStatus;
  }
  if (args.result.interpreter_confidence === undefined) {
    args.result.interpreter_confidence = args.interpreterConfidence;
  }
  if (args.result.interpreter_dispatch_state === undefined) {
    args.result.interpreter_dispatch_state = args.interpreterDispatchEligible
      ? args.interpreterArtifact?.dispatch_state ?? null
      : null;
  }
  if (args.result.interpreter_confirm_prompt === undefined) {
    args.result.interpreter_confirm_prompt = args.interpreterArtifact?.confirm_prompt ?? null;
  }
  if (args.result.interpreter_term_ids === undefined) {
    args.result.interpreter_term_ids = args.interpreterArtifact?.term_ids ?? [];
  }
  if (args.result.interpreter_concept_ids === undefined) {
    args.result.interpreter_concept_ids = args.interpreterArtifact?.concept_ids ?? [];
  }
  if (args.result.interpreter_schema_version === undefined && args.interpreterArtifact) {
    args.result.interpreter_schema_version = args.interpreterSchemaVersion;
  }
  if (!args.termPriorDecision) return;

  if (args.result.term_hits === undefined) {
    args.result.term_hits = args.termPriorDecision.term_hits.map((hit) => ({
      term_id: hit.term_id,
      category: hit.category,
      canonical: hit.canonical,
      matched_in: hit.matched_in,
      match_type: hit.match_type,
      term_hit_confidence: hit.term_hit_confidence,
    }));
  }
  if (args.result.term_prior_applied === undefined) {
    args.result.term_prior_applied = args.termPriorApplied;
  }
  if (args.result.term_prior_suppressed_reason === undefined) {
    args.result.term_prior_suppressed_reason = args.termPriorDecision.prior_suppressed_reason;
  }
  if (args.result.term_prior_impact === undefined) {
    args.result.term_prior_impact = args.termPriorImpact;
  }
};
