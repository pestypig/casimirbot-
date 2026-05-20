import {
  HELIX_SOLVER_INSTRUCTION_FRAME_SCHEMA,
  type HelixSolverInstructionFrame,
} from "@shared/helix-solver-instruction-frame";
import {
  interpretHelixAskPrompt,
  type HelixPromptInterpretation,
} from "./prompt-interpretation";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry: unknown): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

const unique = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const promptInterpretation = (promptText: string, value: unknown): HelixPromptInterpretation => {
  const record = readRecord(value);
  return record?.schema === "helix.prompt_interpretation.v1"
    ? record as HelixPromptInterpretation
    : interpretHelixAskPrompt(promptText);
};

const hasVisualSourceTarget = (promptText: string, sourceTargetIntent?: RecordLike | null): boolean => {
  const text = `${promptText} ${readString(sourceTargetIntent?.target_source)} ${readString(sourceTargetIntent?.target_kind)}`;
  return /\b(?:visual|screen|capture|screenshot|frame|image)\b/i.test(text);
};

const hasCadenceConstraint = (promptText: string, interpretation: HelixPromptInterpretation): boolean => {
  const text = `${promptText} ${interpretation.negative_constraints.join(" ")} ${interpretation.contextual_tool_mentions.map((entry) => `${entry.verb_or_cue}:${entry.reason}`).join(" ")}`;
  return /\b(?:cadence|interval|rate|set_rate|every\s+\d)/i.test(text) &&
    /\b(?:do\s+not|don't|without|never|not|haven't|have\s+not|didn't|did\s+not|last|previous|why)\b/i.test(text);
};

const hasNoExecutionConstraint = (interpretation: HelixPromptInterpretation): boolean =>
  interpretation.negative_constraints.some((constraint) =>
    /\b(?:run|open|click|start|stop|set|change|update|repair|refresh|execute)\s+nothing\b/i.test(constraint) ||
    /\b(?:do\s+not|don't|without|never)\b[\s\S]{0,80}\b(?:run|open|click|start|stop|set|change|update|repair|refresh|execute|call)\b/i.test(constraint),
  );

export const buildSolverInstructionFrame = (input: {
  turnId: string;
  promptText: string;
  promptInterpretation?: HelixPromptInterpretation | RecordLike | null;
  sourceTargetIntent?: RecordLike | null;
}): HelixSolverInstructionFrame => {
  const interpretation = promptInterpretation(input.promptText, input.promptInterpretation);
  const sourceTargetIntent = readRecord(input.sourceTargetIntent);
  const visual = hasVisualSourceTarget(input.promptText, sourceTargetIntent);
  const noExecution = hasNoExecutionConstraint(interpretation);
  const cadenceConstraint = hasCadenceConstraint(input.promptText, interpretation);
  const contextualCues = interpretation.contextual_tool_mentions.map((entry) => entry.verb_or_cue);

  return {
    schema: HELIX_SOLVER_INSTRUCTION_FRAME_SCHEMA,
    turn_id: input.turnId,
    active_rules: unique([
      "solver_instruction_frame_must_reenter_each_solver_pass",
      "prompt_constraints_are_turn_artifacts",
      "capability_admission_precedes_execution",
      "evidence_retrieval_precedes_comparison_prediction_or_diagnosis",
      "receipt_is_not_answer",
      ...(noExecution ? ["negative_user_constraint_blocks_mutating_capability"] : []),
      ...(cadenceConstraint ? ["cadence_mentions_are_context_until_operator_command"] : []),
      ...(visual ? ["visual_source_equal_identity_required"] : []),
    ]),
    negative_user_constraints: unique(readStringArray(interpretation.negative_constraints)),
    source_identity_rules: unique([
      "source_identity_must_match_selected_source_binding",
      "live_capture_is_not_cognition",
      "projection_is_not_source_evidence",
      ...(visual ? ["visual_source_equal_identity_persists_across_retrieval_and_comparison"] : []),
    ]),
    capability_permission_rules: unique([
      "mutating_capability_requires_operator_command",
      "contextual_tool_mentions_do_not_admit_capability",
      "negative_user_constraints_block_mutating_capabilities",
      ...(contextualCues.length > 0 ? ["contextual_tool_mentions_remain_non_executable"] : []),
      ...(cadenceConstraint ? ["do_not_change_cadence_without_affirmative_operator_command"] : []),
    ]),
    terminal_authority_rules: [
      "receipt_is_not_answer",
      "projection_is_not_answer",
      "route_label_is_not_answer",
      "terminal_artifact_must_match_canonical_goal",
      "terminal_authority_must_run_after_solver_completion",
    ],
    codex_boundary: {
      codex_owned_runtime_forbidden: [
        "model_sampling_loop",
        "generic_tool_execution_loop",
        "tool_future_scheduler",
        "approval_sandbox_retry_runtime",
        "terminal_turn_completion_runtime",
      ],
      helix_owned_policy_allowed: [
        "prompt_interpretation_policy",
        "source_identity_policy",
        "capability_admission_policy",
        "evidence_retrieval_policy",
        "evidence_reentry_policy",
        "route_product_contract_policy",
        "terminal_authority_policy",
      ],
    },
    assistant_answer: false,
    raw_content_included: false,
  };
};
