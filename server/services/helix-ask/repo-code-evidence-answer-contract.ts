import {
  HELIX_REPO_CODE_EVIDENCE_OBSERVATION_SCHEMA,
  HELIX_REPO_CODE_SEARCH_CONCEPT_CAPABILITY,
  type HelixRepoCodeEvidenceAnswerContract,
  type HelixRepoCodeEvidenceAnswerKind,
} from "../../../shared/helix-repo-code-evidence-observation";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

export function buildRepoCodeEvidenceAnswerContract(input: {
  turnId: string;
  goalKind?: string | null;
}): HelixRepoCodeEvidenceAnswerContract {
  const terminalKind: HelixRepoCodeEvidenceAnswerKind =
    input.goalKind === "repo_entity_definition" ? "repo_entity_definition" : "repo_code_evidence_answer";
  return {
    schema: "helix.repo_code_evidence_answer_contract.v1",
    turn_id: input.turnId,
    required_terminal_product: terminalKind,
    required_capability: HELIX_REPO_CODE_SEARCH_CONCEPT_CAPABILITY,
    required_observation_schema: HELIX_REPO_CODE_EVIDENCE_OBSERVATION_SCHEMA,
    required_observation_kinds: ["repo_code_evidence_observation"],
    forbidden_terminal_artifact_kinds: [
      "direct_answer_text",
      "no_tool_direct",
      "model_only_concept",
      "panel_generated_answer",
    ],
    requires_followup_model_synthesis: true,
    requires_file_evidence_refs: true,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function hasRepoCodeEvidenceObservation(payload: RecordLike): boolean {
  const ledger = Array.isArray(payload.current_turn_artifact_ledger) ? payload.current_turn_artifact_ledger : [];
  return ledger.some((entry) => {
    const record = readRecord(entry);
    const nestedPayload = readRecord(record?.payload);
    return (
      readString(record?.kind) === "repo_code_evidence_observation" ||
      readString(nestedPayload?.schema) === HELIX_REPO_CODE_EVIDENCE_OBSERVATION_SCHEMA
    );
  });
}

export function isRepoCodeEvidenceGoal(payload: RecordLike): boolean {
  const canonicalGoalFrame = readRecord(payload.canonical_goal_frame);
  const sourceTargetIntent = readRecord(payload.source_target_intent);
  const goalKind = readString(canonicalGoalFrame?.goal_kind);
  return (
    goalKind === "repo_code_evidence_question" ||
    goalKind === "repo_entity_definition" ||
    readString(sourceTargetIntent?.target_source) === "repo_code"
  );
}
