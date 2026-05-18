import crypto from "node:crypto";
import {
  HELIX_ASK_TURN_PREFLIGHT_CONTEXT_SCHEMA,
  type HelixAskTurnInputModality,
  type HelixAskTurnPreflightContext,
  type HelixRouteCandidate,
} from "@shared/helix-ask-turn-preflight";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function buildAskTurnPreflightContext(input: {
  turnId: string;
  threadId: string;
  promptText: string;
  inputModality?: HelixAskTurnInputModality | null;
  retrievalRequiredSignal: unknown;
  routeCandidates?: HelixRouteCandidate[];
  sourceTargetIntent?: unknown | null;
  liveSourceContinuationIntent?: unknown | null;
  liveEnvironmentIntent?: unknown | null;
  deicticReference?: unknown | null;
  activeSituationContext?: unknown | null;
  situationEvidenceSelection?: unknown | null;
  pendingRequestState?: unknown | null;
  workspaceSnapshot?: unknown | null;
  createdAt?: string;
}): HelixAskTurnPreflightContext {
  const createdAt = input.createdAt ?? new Date().toISOString();
  return Object.freeze({
    schema: HELIX_ASK_TURN_PREFLIGHT_CONTEXT_SCHEMA,
    preflight_context_id: `ask_turn_preflight:${hashShort([
      input.turnId,
      input.threadId,
      input.promptText,
      createdAt,
    ])}`,
    turn_id: input.turnId,
    thread_id: input.threadId,
    prompt_text: input.promptText,
    prompt_hash: hashShort(input.promptText, 8),
    input_modality: input.inputModality ?? "typed",
    created_at: createdAt,
    retrieval_required_signal: input.retrievalRequiredSignal,
    route_candidates: input.routeCandidates ?? [],
    source_target_intent: input.sourceTargetIntent ?? null,
    live_source_continuation_intent: input.liveSourceContinuationIntent ?? null,
    live_environment_intent: input.liveEnvironmentIntent ?? null,
    deictic_reference: input.deicticReference ?? null,
    active_situation_context: input.activeSituationContext ?? null,
    situation_evidence_selection: input.situationEvidenceSelection ?? null,
    pending_request_state: input.pendingRequestState ?? null,
    workspace_snapshot: input.workspaceSnapshot ?? null,
    assistant_answer: false,
    raw_content_included: false,
  } satisfies HelixAskTurnPreflightContext);
}
