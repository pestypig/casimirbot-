import {
  HELIX_SYNTHETIC_EVIDENCE_SCHEMA,
  type HelixSyntheticEvidence,
  type HelixSyntheticEvidenceProducer,
  type HelixSyntheticEvidenceSupportStatus,
} from "../../../shared/helix-synthetic-evidence";

export type CreateSyntheticEvidenceInput = {
  thread_id: string;
  produced_by: HelixSyntheticEvidenceProducer;
  claim: string;
  support_status: HelixSyntheticEvidenceSupportStatus;
  source_refs: string[];
  reusable_context_ref?: string | null;
  deterministic?: boolean;
  model_invoked?: boolean;
};

const syntheticEvidenceByThread = new Map<string, HelixSyntheticEvidence[]>();

function newId(prefix: string): string {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(new Set(values.map((entry) => String(entry ?? "").trim()).filter(Boolean)));
}

export function recordSyntheticEvidence(input: CreateSyntheticEvidenceInput): HelixSyntheticEvidence {
  const evidence: HelixSyntheticEvidence = {
    schema: HELIX_SYNTHETIC_EVIDENCE_SCHEMA,
    evidence_id: newId("synthetic-evidence"),
    thread_id: input.thread_id,
    produced_by: input.produced_by,
    claim: input.claim.trim(),
    support_status: input.support_status,
    source_refs: uniqueStrings(input.source_refs),
    reusable_context_ref: input.reusable_context_ref ?? null,
    raw_content_included: false,
    assistant_answer: false,
    deterministic: input.deterministic !== false,
    model_invoked: input.model_invoked === true,
    created_at: new Date().toISOString(),
  };
  const existing = syntheticEvidenceByThread.get(evidence.thread_id) ?? [];
  syntheticEvidenceByThread.set(evidence.thread_id, [...existing, evidence].slice(-200));
  return evidence;
}

export function listSyntheticEvidence(threadId: string): HelixSyntheticEvidence[] {
  return [...(syntheticEvidenceByThread.get(threadId) ?? [])];
}

export function clearSyntheticEvidenceForTest(): void {
  syntheticEvidenceByThread.clear();
}
