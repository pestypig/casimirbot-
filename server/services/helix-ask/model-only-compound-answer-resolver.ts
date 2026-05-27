import type { HelixCompoundPromptContract } from "./prompt-interpretation";
import {
  evaluateFinalAnswerDraftQualityGate,
} from "./final-answer-draft-quality-gate";
import { isUnavailableModelDirectAnswerText } from "./model-direct-answer-step";

type ArtifactLike = {
  artifact_id?: unknown;
  kind?: unknown;
  payload?: unknown;
};

type RecordLike = Record<string, unknown>;

export type HelixModelOnlyCompoundAnswerCandidate = {
  schema: "helix.model_only_compound_answer_candidate.v1";
  turn_id: string;
  artifact_ref: string;
  artifact_kind: "final_answer_draft" | "direct_answer_text";
  sequence: number;
  text: string;
  source: "latest_final_answer_draft" | "latest_direct_answer_text";
  quality_gate_ref?: string;
  quality_ok: boolean;
  quality_violations: string[];
  assistant_answer: false;
  raw_content_included: false;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const artifactPayload = (artifact: ArtifactLike): RecordLike | null => readRecord(artifact.payload);

const artifactKind = (artifact: ArtifactLike): string =>
  readString(artifact.kind) ?? readString(artifactPayload(artifact)?.kind) ?? "";

const artifactSchema = (artifact: ArtifactLike): string =>
  readString(artifactPayload(artifact)?.schema) ?? "";

const artifactId = (artifact: ArtifactLike): string | null =>
  readString(artifact.artifact_id) ?? readString(artifactPayload(artifact)?.artifact_id);

const artifactText = (artifact: ArtifactLike): string | null => {
  const payload = artifactPayload(artifact);
  return readString(payload?.text) ?? readString(payload?.answer_text) ?? readString(payload?.visible_text);
};

const isFinalAnswerDraft = (artifact: ArtifactLike): boolean =>
  artifactKind(artifact) === "final_answer_draft" ||
  artifactSchema(artifact) === "helix.final_answer_draft.v1";

const isDirectAnswerText = (artifact: ArtifactLike): boolean =>
  artifactKind(artifact) === "direct_answer_text" ||
  artifactSchema(artifact) === "helix.direct_answer_text.v1";

const staleOrReceiptLike = (text: string): boolean =>
  /\b(?:workspace_step_failed|Failed to execute|workspace_action_receipt|runtime_tool_observation|panel receipt|I could not complete this turn|I could not produce a terminal answer|terminal boundary blocked)\b/i.test(text) ||
  /^(?:Opening panel|Opened panel|Receipt:|Action receipt|Successfully executed)\b/i.test(text.trim());

const isModelOnlyScope = (payload: RecordLike): boolean => {
  const canonicalGoal = readRecord(payload.canonical_goal_frame);
  const sourceTargetIntent = readRecord(payload.source_target_intent);
  const routeContract = readRecord(payload.route_product_contract);
  const goalKind = readString(canonicalGoal?.goal_kind);
  const answerScope = readString(canonicalGoal?.answer_scope);
  const targetSource = readString(sourceTargetIntent?.target_source);
  const targetKind = readString(sourceTargetIntent?.target_kind);
  const strength = readString(sourceTargetIntent?.strength);
  const contractSource = readString(routeContract?.source_target);

  if (goalKind === "model_only_concept" || goalKind === "conversation" || goalKind === "workspace_help") return true;
  if (answerScope === "model_only") return true;
  if (contractSource && !["model_only", "general_background", "unknown"].includes(contractSource)) return false;
  if (targetSource && !["unknown", "none", "model_only", "general_background"].includes(targetSource)) return false;
  if (targetKind && !["unknown", "none", "model_only", "general_background"].includes(targetKind)) return false;
  return strength !== "hard";
};

export function isModelOnlyCompoundCoverageAllowed(payload: RecordLike): boolean {
  return isModelOnlyScope(payload);
}

export function resolveModelOnlyCompoundAnswerCandidate(input: {
  turnId: string;
  payload: RecordLike;
  artifactLedger: ArtifactLike[];
  promptText: string;
  compoundContract?: HelixCompoundPromptContract | RecordLike | null;
}): HelixModelOnlyCompoundAnswerCandidate | null {
  if (!isModelOnlyScope(input.payload)) return null;

  const candidates = input.artifactLedger
    .map((artifact, sequence) => {
      const kind = isFinalAnswerDraft(artifact)
        ? "final_answer_draft" as const
        : isDirectAnswerText(artifact)
          ? "direct_answer_text" as const
          : null;
      const ref = artifactId(artifact);
      const text = artifactText(artifact);
      if (!kind || !ref || !text) return null;
      if (isUnavailableModelDirectAnswerText(text) || staleOrReceiptLike(text)) return null;
      return { artifact, kind, ref, text, sequence };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "final_answer_draft" ? -1 : 1;
      return b.sequence - a.sequence;
    });

  for (const candidate of candidates) {
    const payload = artifactPayload(candidate.artifact);
    const quality = evaluateFinalAnswerDraftQualityGate({
      turnId: input.turnId,
      finalAnswerDraftRef: candidate.ref,
      draftText: candidate.text,
      draftPayload: payload,
      promptText: input.promptText,
      routeProductContract: readRecord(input.payload.route_product_contract),
      payload: input.payload,
      artifactLedger: input.artifactLedger,
    });
    if (!quality.ok) continue;
    return {
      schema: "helix.model_only_compound_answer_candidate.v1",
      turn_id: input.turnId,
      artifact_ref: candidate.ref,
      artifact_kind: candidate.kind,
      sequence: candidate.sequence,
      text: candidate.text,
      source: candidate.kind === "final_answer_draft" ? "latest_final_answer_draft" : "latest_direct_answer_text",
      quality_gate_ref: `${candidate.ref}:final_answer_draft_quality_gate`,
      quality_ok: quality.ok,
      quality_violations: quality.violations,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  return null;
}
