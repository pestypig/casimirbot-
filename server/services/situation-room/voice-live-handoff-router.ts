import crypto from "node:crypto";
import {
  HELIX_VOICE_LIVE_HANDOFF_SCHEMA,
  type HelixVoiceLiveHandoff,
} from "@shared/helix-voice-live-handoff";
import type { HelixDeicticReference } from "@shared/helix-deictic-reference";
import type { HelixSituationEvidenceSelection } from "@shared/helix-situation-evidence-selection";

const handoffsByThread = new Map<string, HelixVoiceLiveHandoff[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function createVoiceLiveHandoff(input: {
  threadId: string;
  transcript: string;
  deicticReference: HelixDeicticReference;
  situationEvidenceSelection: HelixSituationEvidenceSelection;
}): HelixVoiceLiveHandoff {
  const route = input.situationEvidenceSelection.answerable
    ? input.deicticReference.reference_type === "latest_epoch_change"
      ? "procedure_epoch_replay_question"
      : "situation_context_question"
    : "request_user_input";
  const handoff: HelixVoiceLiveHandoff = {
    schema: HELIX_VOICE_LIVE_HANDOFF_SCHEMA,
    handoff_id: `voice_live_handoff:${hashShort([
      input.threadId,
      input.transcript,
      input.deicticReference.reference_id,
      input.situationEvidenceSelection.selection_id,
    ])}`,
    thread_id: input.threadId,
    transcript: input.transcript,
    deictic_reference: input.deicticReference,
    situation_evidence_selection: input.situationEvidenceSelection,
    route,
    quick_response_suppressed: input.deicticReference.candidate_signal,
    assistant_answer: false,
    raw_content_included: false,
  };
  handoffsByThread.set(input.threadId, [
    ...(handoffsByThread.get(input.threadId) ?? []).filter((entry: HelixVoiceLiveHandoff) => entry.handoff_id !== handoff.handoff_id),
    handoff,
  ].slice(-200));
  return handoff;
}

export function listVoiceLiveHandoffs(input: {
  threadId?: string | null;
  limit?: number;
} = {}): HelixVoiceLiveHandoff[] {
  const limit = Math.max(0, Math.min(200, Math.trunc(input.limit ?? 80)));
  return Array.from(handoffsByThread.values()).flat()
    .filter((entry: HelixVoiceLiveHandoff) => !input.threadId || entry.thread_id === input.threadId)
    .slice(-limit);
}

export function resetVoiceLiveHandoffsForTest(): void {
  handoffsByThread.clear();
}
