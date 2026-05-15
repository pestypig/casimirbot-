import crypto from "node:crypto";
import {
  HELIX_SOURCE_ACTIVATION_RECEIPT_SCHEMA,
  type HelixSourceActivationReceipt,
  type HelixSourceActivationRequestedStatus,
} from "@shared/helix-source-activation-receipt";
import type {
  HelixSituationSourceModality,
  HelixSituationSourceStatus,
} from "@shared/helix-situation-source-capability";

const hashShort = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function buildSourceActivationReceipt(input: {
  sourceId: string;
  threadId: string;
  modality: HelixSituationSourceModality;
  requestedStatus: HelixSourceActivationRequestedStatus;
  observedStatus: HelixSituationSourceStatus;
  ok: boolean;
  summary: string;
  nextRequiredAction?: string | null;
  evidenceRefs?: string[];
  now?: string;
}): HelixSourceActivationReceipt {
  const now = input.now ?? new Date().toISOString();
  return {
    schema: HELIX_SOURCE_ACTIVATION_RECEIPT_SCHEMA,
    receipt_id: `source_activation:${hashShort([input.sourceId, input.modality, input.requestedStatus, input.observedStatus, now])}`,
    source_id: input.sourceId,
    thread_id: input.threadId,
    modality: input.modality,
    requested_status: input.requestedStatus,
    observed_status: input.observedStatus,
    ok: input.ok,
    summary: input.summary,
    next_required_action: input.nextRequiredAction ?? null,
    evidence_refs: input.evidenceRefs ?? [`source:${input.sourceId}`],
    raw_content_included: false,
    assistant_answer: false,
  };
}
