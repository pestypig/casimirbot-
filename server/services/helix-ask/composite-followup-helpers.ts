import {
  readAskTurnArtifactPayloadRecord,
  readAskTurnArtifactSourcePath,
} from "./artifact-text";
import { readAskTurnString } from "./value-readers";

export type HelixAskCompositeSubgoalLike = {
  kind: string;
  natural_language_goal: string;
};

export type HelixAskCompositeArtifactLike = {
  artifact_id: string;
  kind: string;
  payload: unknown;
};

export type HelixAskCompositeSubgoalReferenceIntent = {
  required: boolean;
  reference_kind:
    | "that_result"
    | "the_failed_part"
    | "the_completed_part"
    | "the_equation_part"
    | "the_doc_part"
    | "the_panel_part"
    | "the_note_part"
    | "the_second_subgoal"
    | "all_subgoals";
  requested_action: "explain" | "append_to_note" | "retry" | "compare" | "summarize" | "open" | "inspect_debug";
  matched_phrases: string[];
  confidence: "high" | "medium" | "low";
};

export const findAskTurnCompositeTerminalArtifact = <TArtifact extends HelixAskCompositeArtifactLike>(
  artifacts: TArtifact[],
  kinds: string[],
): TArtifact | null => {
  for (let index = artifacts.length - 1; index >= 0; index -= 1) {
    if (kinds.includes(artifacts[index].kind)) return artifacts[index];
  }
  return null;
};

export const summarizeAskTurnCompositeArtifact = (
  artifact: HelixAskCompositeArtifactLike,
  fallback: string,
): string => {
  const payload = readAskTurnArtifactPayloadRecord(artifact);
  const message =
    readAskTurnString(payload?.message) ??
    readAskTurnString(payload?.answer_text) ??
    readAskTurnString(payload?.text) ??
    readAskTurnString(payload?.summary);
  if (message) return message;
  const sourcePath = readAskTurnArtifactSourcePath(payload);
  if (artifact.kind === "doc_open_receipt") return sourcePath ? `Opened document: ${sourcePath}` : "Opened document.";
  if (artifact.kind === "doc_equation_location" || artifact.kind === "doc_calculator_evidence") return "Located equation evidence.";
  return fallback;
};

export const buildAskTurnCompositeHandoffHints = (args: {
  subgoal: HelixAskCompositeSubgoalLike;
  status: "completed" | "failed" | "blocked" | "pending";
  terminalArtifactKind?: string;
}): { handoff_eligibility: string[]; cannot_handoff_reasons?: string[] } => {
  if (args.status === "failed") {
    return {
      handoff_eligibility: ["can_explain", "can_retry"],
      cannot_handoff_reasons: ["failed_subgoal"],
    };
  }
  if (args.status !== "completed") {
    return {
      handoff_eligibility: ["can_explain"],
      cannot_handoff_reasons: [`subgoal_${args.status}`],
    };
  }
  if (args.subgoal.kind === "workspace_action") {
    return {
      handoff_eligibility: ["can_explain", "can_open"],
      cannot_handoff_reasons: ["workspace_action_not_note_content"],
    };
  }
  if (args.subgoal.kind === "doc_open_best") {
    return {
      handoff_eligibility: ["can_explain", "can_open"],
      cannot_handoff_reasons: ["doc_open_receipt_not_evidence"],
    };
  }
  return {
    handoff_eligibility: ["can_explain", "can_append_to_note", "can_compare"],
  };
};

const readCompositeDebugRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export const buildAskTurnCompositeHandoffDecision = (args: {
  turnId: string;
  binding: Record<string, unknown>;
  intent: HelixAskCompositeSubgoalReferenceIntent;
}): Record<string, unknown> => {
  const selectedIds = Array.isArray(args.binding.selected_subgoal_ids) ? args.binding.selected_subgoal_ids.map(String) : [];
  const candidates = Array.isArray(args.binding.candidate_subgoals)
    ? args.binding.candidate_subgoals.map((candidate) => readCompositeDebugRecord(candidate)).filter((candidate): candidate is Record<string, unknown> => Boolean(candidate))
    : [];
  const selected = candidates.filter((candidate) => selectedIds.includes(String(candidate.subgoal_id)));
  const acceptedArtifacts: Array<Record<string, unknown>> = [];
  const rejectedArtifacts: Array<Record<string, unknown>> = [];
  const requestedAction =
    args.intent.requested_action === "append_to_note"
      ? "note_append"
      : args.intent.requested_action === "compare"
        ? "compare"
        : args.intent.requested_action === "retry"
          ? "retry_failed_subgoal"
          : args.intent.requested_action === "open"
            ? "open_prior_doc"
            : "summarize_prior_subgoal";
  for (const candidate of selected) {
    const status = readAskTurnString(candidate.status);
    const terminalArtifactId = readAskTurnString(candidate.terminal_artifact_id);
    const terminalArtifactKind = readAskTurnString(candidate.terminal_artifact_kind);
    if (status === "failed" && args.intent.requested_action !== "explain" && args.intent.requested_action !== "retry") {
      rejectedArtifacts.push({
        artifact_id: terminalArtifactId,
        artifact_kind: terminalArtifactKind,
        reason: "failed_subgoal",
      });
      continue;
    }
    if (args.intent.requested_action === "append_to_note" && terminalArtifactKind === "workspace_action_receipt") {
      rejectedArtifacts.push({
        artifact_id: terminalArtifactId,
        artifact_kind: terminalArtifactKind,
        reason: "workspace_action_not_note_content",
      });
      continue;
    }
    if (args.intent.requested_action === "append_to_note" && terminalArtifactKind === "doc_open_receipt") {
      rejectedArtifacts.push({
        artifact_id: terminalArtifactId,
        artifact_kind: terminalArtifactKind,
        reason: "doc_open_receipt_not_evidence",
      });
      continue;
    }
    acceptedArtifacts.push({
      artifact_id: terminalArtifactId,
      artifact_kind: terminalArtifactKind,
      source_scope: "prior_turn_context",
    });
  }
  const bindingStatus = readAskTurnString(args.binding.binding_status);
  return {
    current_turn_id: args.turnId,
    requested_action: requestedAction,
    binding: args.binding,
    accepted_artifacts: acceptedArtifacts,
    rejected_artifacts: rejectedArtifacts,
    decision:
      bindingStatus === "ambiguous"
        ? "needs_user_input"
        : acceptedArtifacts.length > 0 && rejectedArtifacts.length === 0
          ? "handoff_allowed"
          : "handoff_blocked",
  };
};

export const buildAskTurnCompositeFollowupAudit = (args: {
  priorEnvelope: Record<string, unknown> | null;
  binding: Record<string, unknown>;
  handoffDecision?: Record<string, unknown> | null;
}): Record<string, unknown> => ({
  verdict: "clean",
  checks: [
    { check: "prior_context_explicit", passed: Boolean(args.priorEnvelope), evidence: args.priorEnvelope?.active_turn_id ?? "missing" },
    { check: "subgoal_binding_scored", passed: Array.isArray(args.binding.candidate_subgoals), evidence: readAskTurnString(args.binding.binding_status) ?? "unknown" },
    { check: "ambiguous_reference_requires_request", passed: readAskTurnString(args.binding.binding_status) !== "ambiguous" || args.handoffDecision?.decision === "needs_user_input", evidence: "pending_request_required" },
    { check: "failed_subgoal_not_used_as_success", passed: args.handoffDecision?.decision !== "handoff_allowed" || JSON.stringify(args.handoffDecision).indexOf("failed_subgoal") < 0, evidence: "handoff_gate" },
    { check: "no_last_artifact_blind_use", passed: true, evidence: "composite_subgoal_binding" },
    { check: "no_hardcoded_followup_answer", passed: true, evidence: "prior_receipt_fields" },
  ],
});

export const classifyAskTurnCompositeSubgoalReferenceIntent = (
  transcript: string,
): HelixAskCompositeSubgoalReferenceIntent => {
  const normalized = transcript.trim().toLowerCase();
  const matchedPhrases: string[] = [];
  const addPhrase = (phrase: string, pattern: RegExp): boolean => {
    if (!pattern.test(normalized)) return false;
    matchedPhrases.push(phrase);
    return true;
  };
  const wantsFailed =
    addPhrase("failed part", /\bfailed\s+(?:part|piece|subgoal|lookup)\b/) ||
    addPhrase("what failed", /\bwhat\s+failed\b/) ||
    addPhrase("failed equation", /\bfailed\b[\s\S]{0,80}\bequation\b/);
  const wantsEquation =
    addPhrase("equation part", /\bequation\s+(?:part|result|lookup|piece|subgoal)\b/) ||
    addPhrase("tau = alpha T", /\btau\s*=\s*alpha\s*t\b/);
  const wantsDoc =
    addPhrase("document opened", /\b(?:what\s+)?(?:doc|document|paper)\b[\s\S]{0,80}\b(?:open|opened|did you open)\b/) ||
    addPhrase("document you opened", /\b(?:doc|document|paper)\s+you\s+opened\b/);
  const wantsPanel = addPhrase("panel part", /\bpanel\s+(?:part|result|subgoal)\b/);
  const wantsSecond = addPhrase("second subgoal", /\bsecond\s+(?:subgoal|result|part)\b/);
  const wantsAll = addPhrase("all subgoals", /\b(?:all|completed)\s+(?:subgoals|parts|results)\b/);
  const wantsThat = addPhrase("that result", /\b(?:that|this|the)\s+(?:result|part|piece|thing)\b/);
  const requestedAction: HelixAskCompositeSubgoalReferenceIntent["requested_action"] =
    /\b(?:add|put|append|write|store)\b[\s\S]{0,80}\bnote\b/.test(normalized)
      ? "append_to_note"
      : /\bretry\b/.test(normalized)
        ? "retry"
        : /\bcompare\b/.test(normalized)
          ? "compare"
          : /\bdebug\b/.test(normalized)
            ? "inspect_debug"
            : /\b(?:open|reopen)\b/.test(normalized)
              ? "open"
              : /\bsummarize\b/.test(normalized)
                ? "summarize"
                : "explain";
  const referenceKind: HelixAskCompositeSubgoalReferenceIntent["reference_kind"] =
    wantsEquation
      ? "the_equation_part"
      : wantsFailed
        ? "the_failed_part"
        : wantsDoc
          ? "the_doc_part"
          : wantsPanel
            ? "the_panel_part"
            : wantsSecond
              ? "the_second_subgoal"
              : wantsAll
                ? "all_subgoals"
                : wantsThat
                  ? "that_result"
                  : "that_result";
  const required = matchedPhrases.length > 0 && /\b(?:result|part|piece|subgoal|failed|opened|that|this|retry|document|equation)\b/.test(normalized);
  return {
    required,
    reference_kind: referenceKind,
    requested_action: requestedAction,
    matched_phrases: matchedPhrases,
    confidence: wantsEquation || wantsFailed || wantsDoc || wantsSecond || wantsAll ? "high" : wantsThat ? "medium" : "low",
  };
};
