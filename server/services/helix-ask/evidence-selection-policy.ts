import {
  HELIX_SELECTED_EVIDENCE_PACK_SCHEMA,
  type HelixSelectedEvidencePack,
} from "../../../shared/helix-selected-evidence-pack";
import { listSubgoalEvaluations } from "./subgoal-evaluator";
import { listSyntheticEvidence } from "../situation-room/synthetic-evidence-ledger";
import { getActiveLiveAnswerEnvironmentForThread } from "../situation-room/live-answer-environment-store";

export type SelectEvidenceForAskTurnInput = {
  thread_id: string;
  turn_id: string;
  prompt: string;
  max_items?: number;
  tool_receipt_ids?: string[];
};

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function relevanceScore(prompt: string, text: string): number {
  const terms = new Set(
    prompt
      .toLowerCase()
      .split(/[^a-z0-9_:-]+/i)
      .map((term) => term.trim())
      .filter((term) => term.length > 2),
  );
  if (terms.size === 0) return 0;
  const haystack = text.toLowerCase();
  let hits = 0;
  for (const term of terms) {
    if (haystack.includes(term)) hits += 1;
  }
  return hits / terms.size;
}

function parseNoteRef(value: string): { note_id: string; section_ref?: string | null } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^note[:/]/i.test(trimmed)) {
    const [noteId, sectionRef] = trimmed.split("#", 2);
    return { note_id: noteId, section_ref: sectionRef ?? null };
  }
  if (/receipt:note/i.test(trimmed)) {
    return { note_id: trimmed, section_ref: null };
  }
  return null;
}

export function selectEvidenceForAskTurn(input: SelectEvidenceForAskTurnInput): HelixSelectedEvidencePack {
  const maxItems = Math.max(1, Math.min(12, input.max_items ?? 8));
  const syntheticEvidence = listSyntheticEvidence(input.thread_id)
    .map((evidence) => ({
      evidence,
      score: relevanceScore(input.prompt, `${evidence.claim} ${evidence.source_refs.join(" ")}`),
    }))
    .sort((a, b) => b.score - a.score || Date.parse(b.evidence.created_at) - Date.parse(a.evidence.created_at))
    .slice(0, maxItems)
    .map((entry) => entry.evidence);
  const subgoals = listSubgoalEvaluations(input.thread_id)
    .slice(-maxItems)
    .reverse();
  const noteRefs = syntheticEvidence
    .map((evidence) => {
      const ref = evidence.reusable_context_ref ?? evidence.source_refs.find((entry) => /^note[:/]|receipt:note/i.test(entry)) ?? null;
      if (!ref) return null;
      return evidence.produced_by === "workstation_note"
        ? parseNoteRef(ref) ?? { note_id: ref, section_ref: null }
        : parseNoteRef(ref);
    })
    .filter((ref): ref is { note_id: string; section_ref?: string | null } => Boolean(ref));
  const liveEnvironment = getActiveLiveAnswerEnvironmentForThread(input.thread_id);
  const selectedIds = syntheticEvidence.map((evidence) => evidence.evidence_id);
  const receiptIds = Array.from(new Set([...(input.tool_receipt_ids ?? []), ...syntheticEvidence.flatMap((evidence) => evidence.source_refs)]));
  return {
    schema: HELIX_SELECTED_EVIDENCE_PACK_SCHEMA,
    thread_id: input.thread_id,
    turn_id: input.turn_id,
    prompt: input.prompt,
    selected_evidence_ids: selectedIds,
    selected_subgoal_ids: subgoals.map((subgoal) => subgoal.subgoal_id),
    selected_note_refs: noteRefs.slice(0, maxItems),
    selected_tool_receipts: receiptIds.slice(0, maxItems),
    selected_live_environment_ids: liveEnvironment ? [liveEnvironment.environment_id] : [],
    selection_reason:
      selectedIds.length > 0
        ? "Selected compact synthetic evidence by prompt relevance and freshness; raw content stayed out of Ask context."
        : "No reusable synthetic evidence was available for this thread.",
    budget: {
      max_items: maxItems,
      estimated_tokens: estimateTokens(syntheticEvidence.map((evidence) => evidence.claim).join("\n")),
    },
    raw_content_included: false,
    deterministic_content_role: "evidence_not_assistant_answer",
  };
}
