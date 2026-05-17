import crypto from "node:crypto";
import {
  HELIX_CLIENT_CAPABILITY_ADOPTION_SCHEMA,
  type HelixClientCapabilityAdoption,
} from "@shared/helix-client-capability-adoption";
import {
  getClientCapabilityAction,
  updateClientCapabilityActionStatus,
} from "./client-action-queue";

const adoptionsById = new Map<string, HelixClientCapabilityAdoption>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export function recordClientCapabilityAdoption(input: Record<string, unknown>): HelixClientCapabilityAdoption {
  const actionRequestId = asString(input.action_request_id ?? input.actionRequestId) ?? "client_action:unknown";
  const request = getClientCapabilityAction(actionRequestId);
  const threadId = asString(input.thread_id ?? input.threadId) ?? request?.thread_id ?? "helix-ask:desktop";
  const ok = input.ok !== false;
  const observedState = input.observed_state && typeof input.observed_state === "object" && !Array.isArray(input.observed_state)
    ? input.observed_state as Record<string, unknown>
    : {};
  const adoption: HelixClientCapabilityAdoption = {
    schema: HELIX_CLIENT_CAPABILITY_ADOPTION_SCHEMA,
    adoption_id: `client_capability_adoption:${hashShort([actionRequestId, threadId, Date.now()])}`,
    action_request_id: actionRequestId,
    thread_id: threadId,
    capability: request?.capability ?? "visual_capture",
    action: request?.action ?? "adopt_producer",
    source_id: asString(input.source_id ?? input.sourceId ?? observedState.source_id),
    producer_id: asString(input.producer_id ?? input.producerId ?? observedState.producer_id),
    client_id: asString(input.client_id ?? input.clientId) ?? "current_browser",
    ok,
    observed_state: observedState,
    next_required_action: asString(input.next_required_action ?? input.nextRequiredAction),
    error: asString(input.error),
    assistant_answer: false,
    raw_content_included: false,
  };
  adoptionsById.set(adoption.adoption_id, adoption);
  updateClientCapabilityActionStatus(actionRequestId, ok ? "adopted" : "failed");
  return adoption;
}

export function listClientCapabilityAdoptions(input: { threadId?: string | null } = {}): HelixClientCapabilityAdoption[] {
  return Array.from(adoptionsById.values())
    .filter((adoption) => !input.threadId || adoption.thread_id === input.threadId);
}

export function findLatestClientCapabilityAdoption(input: {
  threadId?: string | null;
  sourceId?: string | null;
  producerId?: string | null;
  actionRequestId?: string | null;
}): HelixClientCapabilityAdoption | null {
  return listClientCapabilityAdoptions({ threadId: input.threadId })
    .filter((adoption) => !input.actionRequestId || adoption.action_request_id === input.actionRequestId)
    .filter((adoption) => !input.sourceId || adoption.source_id === input.sourceId)
    .filter((adoption) => !input.producerId || adoption.producer_id === input.producerId)
    .at(-1) ?? null;
}

export function resetClientCapabilityAdoptionsForTest(): void {
  adoptionsById.clear();
}
