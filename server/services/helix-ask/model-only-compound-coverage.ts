import type { HelixCompoundPromptContract } from "./prompt-interpretation";
import {
  evaluateCompoundPromptCoverageGate,
  type HelixCompoundPromptCoverageGate,
} from "./compound-prompt-coverage-gate";
import {
  isModelOnlyCompoundCoverageAllowed,
  resolveModelOnlyCompoundAnswerCandidate,
  type HelixModelOnlyCompoundAnswerCandidate,
} from "./model-only-compound-answer-resolver";

type ArtifactLike = {
  artifact_id?: unknown;
  kind?: unknown;
  payload?: unknown;
};

type RecordLike = Record<string, unknown>;

export type HelixModelOnlyCompoundCoverageFromAnswer = {
  schema: "helix.model_only_compound_coverage_from_answer.v1";
  turn_id: string;
  applies: boolean;
  passed: boolean;
  candidate_ref?: string;
  candidate_kind?: "direct_answer_text" | "final_answer_draft";
  compound_gate_ref?: string;
  compound_gate_decision?: "PASS" | "FAIL_CLOSED" | "NOT_APPLICABLE";
  required_count: number;
  answered_count: number;
  unresolved_requirement_ids: string[];
  coverage_source: "final_answer_draft" | "direct_answer_text" | "none";
  route_scope: "model_only_allowed" | "source_targeted_forbidden";
  reason: string;
  selected_candidate?: HelixModelOnlyCompoundAnswerCandidate;
  compound_prompt_coverage_gate?: HelixCompoundPromptCoverageGate;
  assistant_answer: false;
  raw_content_included: false;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const readEvidenceBackedAnswerTextFromArtifacts = (artifactLedger: ArtifactLike[]): string | null => {
  for (const preferredKind of ["reasoning_continuation_result", "turn_final_text", "final_answer_draft", "model_synthesized_answer"]) {
    for (const artifact of [...artifactLedger].reverse()) {
      const kind = readString(artifact.kind);
      if (kind !== preferredKind) continue;
      const payload = readRecord(artifact.payload);
      const text =
        readString(payload?.text) ??
        readString(payload?.answer_text) ??
        readString(payload?.final_answer_text);
      if (text) return text;
    }
  }
  return null;
};

export function evaluateModelOnlyCompoundCoverageFromAnswer(input: {
  turnId: string;
  payload: RecordLike;
  artifactLedger: ArtifactLike[];
  promptText: string;
  compoundContract?: HelixCompoundPromptContract | RecordLike | null;
}): HelixModelOnlyCompoundCoverageFromAnswer {
  if (!isModelOnlyCompoundCoverageAllowed(input.payload)) {
    return {
      schema: "helix.model_only_compound_coverage_from_answer.v1",
      turn_id: input.turnId,
      applies: false,
      passed: false,
      required_count: 0,
      answered_count: 0,
      unresolved_requirement_ids: [],
      coverage_source: "none",
      route_scope: "source_targeted_forbidden",
      reason: "source-targeted routes cannot use generic model-only answer text to satisfy compound coverage",
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  const candidate = resolveModelOnlyCompoundAnswerCandidate({
    turnId: input.turnId,
    payload: input.payload,
    artifactLedger: input.artifactLedger,
    promptText: input.promptText,
    compoundContract: input.compoundContract,
  });
  if (!candidate) {
    const fallbackGate = evaluateCompoundPromptCoverageGate({
      contract: input.compoundContract,
      promptText: input.promptText,
      finalAnswerText: null,
      terminalArtifactKind: readString(input.payload.terminal_artifact_kind),
      finalAnswerSource: readString(input.payload.final_answer_source),
    });
    return {
      schema: "helix.model_only_compound_coverage_from_answer.v1",
      turn_id: input.turnId,
      applies: fallbackGate.applies,
      passed: false,
      compound_gate_decision: fallbackGate.decision,
      required_count: fallbackGate.required_count,
      answered_count: fallbackGate.answered_count,
      unresolved_requirement_ids: fallbackGate.unresolved_requirement_ids,
      coverage_source: "none",
      route_scope: "model_only_allowed",
      reason: "no valid model-only answer artifact was available for compound coverage",
      compound_prompt_coverage_gate: fallbackGate,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  const gate = evaluateCompoundPromptCoverageGate({
    contract: input.compoundContract,
    promptText: input.promptText,
    finalAnswerText: candidate.text,
    terminalArtifactKind: candidate.artifact_kind === "final_answer_draft" ? "model_synthesized_answer" : "direct_answer_text",
    finalAnswerSource: candidate.artifact_kind === "final_answer_draft" ? "final_answer_draft" : "model_direct_answer",
    selectedEvidenceRefs: [candidate.artifact_ref],
  });

  return {
    schema: "helix.model_only_compound_coverage_from_answer.v1",
    turn_id: input.turnId,
    applies: gate.applies,
    passed: gate.passed,
    candidate_ref: candidate.artifact_ref,
    candidate_kind: candidate.artifact_kind,
    compound_gate_ref: `${input.turnId}:compound_prompt_coverage_gate`,
    compound_gate_decision: gate.decision,
    required_count: gate.required_count,
    answered_count: gate.answered_count,
    unresolved_requirement_ids: gate.unresolved_requirement_ids,
    coverage_source: candidate.artifact_kind,
    route_scope: "model_only_allowed",
    reason: gate.passed
      ? "all required compound prompt items were answered from a model-only answer artifact"
      : "model-only answer artifact did not cover every required compound prompt item",
    selected_candidate: candidate,
    compound_prompt_coverage_gate: gate,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function evaluateCompoundPromptCoverageGateFromAnswerArtifacts(input: {
  turnId: string;
  payload: RecordLike;
  artifactLedger: ArtifactLike[];
  promptText: string;
  contract?: HelixCompoundPromptContract | RecordLike | null;
  routeScope: "model_only" | "source_targeted";
}): {
  gate: HelixCompoundPromptCoverageGate;
  selected_answer_artifact_ref?: string;
  selected_answer_artifact_kind?: "direct_answer_text" | "final_answer_draft";
  selected_answer_source: "final_answer_draft" | "direct_answer_text" | "provided_final_answer_text" | "none";
  model_only_compound_coverage_from_answer: HelixModelOnlyCompoundCoverageFromAnswer;
} {
  const canonicalGoal = readRecord(input.payload.canonical_goal_frame);
  if (readString(canonicalGoal?.required_terminal_kind) === "capability_help_summary") {
    const gate = evaluateCompoundPromptCoverageGate({
      terminalArtifactKind: "capability_help_summary",
      finalAnswerSource: "capability_help_summary",
    });
    return {
      gate,
      selected_answer_source: "none",
      model_only_compound_coverage_from_answer: {
        schema: "helix.model_only_compound_coverage_from_answer.v1",
        turn_id: input.turnId,
        applies: false,
        passed: true,
        required_count: 0,
        answered_count: 0,
        unresolved_requirement_ids: [],
        coverage_source: "none",
        route_scope: input.routeScope === "model_only" ? "model_only_allowed" : "source_targeted_forbidden",
        reason: "canonical capability-help goals do not create compound execution obligations",
        compound_prompt_coverage_gate: gate,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  }
  const evidenceBackedAnswerText = readEvidenceBackedAnswerTextFromArtifacts(input.artifactLedger);
  const coverage = input.routeScope === "model_only"
    ? evaluateModelOnlyCompoundCoverageFromAnswer({
        turnId: input.turnId,
        payload: input.payload,
        artifactLedger: input.artifactLedger,
        promptText: input.promptText,
        compoundContract: input.contract,
      })
    : {
        schema: "helix.model_only_compound_coverage_from_answer.v1" as const,
        turn_id: input.turnId,
        applies: false,
        passed: false,
        required_count: 0,
        answered_count: 0,
        unresolved_requirement_ids: [],
        coverage_source: "none" as const,
        route_scope: "source_targeted_forbidden" as const,
        reason: "source-targeted route scope cannot use model-only answer artifact coverage",
        assistant_answer: false as const,
        raw_content_included: false as const,
      };

  if (coverage.compound_prompt_coverage_gate) {
    return {
      gate: coverage.compound_prompt_coverage_gate,
      selected_answer_artifact_ref: coverage.candidate_ref,
      selected_answer_artifact_kind: coverage.candidate_kind,
      selected_answer_source: coverage.coverage_source === "none" ? "none" : coverage.coverage_source,
      model_only_compound_coverage_from_answer: coverage,
    };
  }

  return {
    gate: evaluateCompoundPromptCoverageGate({
      contract: input.contract,
      promptText: input.promptText,
      finalAnswerText:
        evidenceBackedAnswerText ??
        readString(input.payload.selected_final_answer) ??
        readString(input.payload.answer) ??
        readString(input.payload.text),
      terminalArtifactKind: evidenceBackedAnswerText ? "model_synthesized_answer" : readString(input.payload.terminal_artifact_kind),
      finalAnswerSource: evidenceBackedAnswerText ? "evidence_backed_answer_artifact" : readString(input.payload.final_answer_source),
    }),
    selected_answer_source: "provided_final_answer_text",
    model_only_compound_coverage_from_answer: coverage,
  };
}
