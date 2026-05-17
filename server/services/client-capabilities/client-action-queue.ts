import crypto from "node:crypto";
import {
  HELIX_CLIENT_CAPABILITY_ACTION_SCHEMA,
  type HelixClientCapability,
  type HelixClientCapabilityAction,
  type HelixClientCapabilityActionKind,
  type HelixClientCapabilityActionStatus,
  type HelixClientCapabilityTarget,
} from "@shared/helix-client-capability-action";

const requestsById = new Map<string, HelixClientCapabilityAction>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const normalizeTarget = (value: unknown): HelixClientCapabilityTarget =>
  value === "current_browser" || value === "desktop_client" || value === "discord_bridge"
    ? value
    : "any_available";

const normalizeCapability = (value: unknown): HelixClientCapability =>
  value === "tab_audio_capture" ||
  value === "microphone_capture" ||
  value === "screen_capture" ||
  value === "browser_tab_capture" ||
  value === "local_file_pick" ||
  value === "clipboard_read" ||
  value === "clipboard_write" ||
  value === "workstation_panel_focus"
    ? value
    : "visual_capture";

const normalizeAction = (value: unknown): HelixClientCapabilityActionKind =>
  value === "request_permission" ||
  value === "set_rate" ||
  value === "capture_now" ||
  value === "start_interval" ||
  value === "pause" ||
  value === "resume" ||
  value === "stop" ||
  value === "heartbeat"
    ? value
    : "adopt_producer";

const normalizeStatus = (value: unknown): HelixClientCapabilityActionStatus =>
  value === "delivered" ||
  value === "adopted" ||
  value === "completed" ||
  value === "failed" ||
  value === "expired"
    ? value
    : "requested";

export function requestClientCapabilityAction(input: Record<string, unknown>): HelixClientCapabilityAction {
  const threadId = asString(input.thread_id ?? input.threadId) ?? "helix-ask:desktop";
  const capability = normalizeCapability(input.capability);
  const action = normalizeAction(input.action);
  const args = input.args && typeof input.args === "object" && !Array.isArray(input.args)
    ? input.args as Record<string, unknown>
    : {};
  const explicitId = asString(input.action_request_id ?? input.actionRequestId);
  const dedupeKey = [
    threadId,
    capability,
    action,
    args.producer_id ?? args.producerId ?? null,
    args.source_id ?? args.sourceId ?? null,
    args.cadence_ms ?? args.cadenceMs ?? null,
  ];
  const existing = Array.from(requestsById.values()).find((request) =>
    request.thread_id === threadId &&
    request.capability === capability &&
    request.action === action &&
    request.status !== "completed" &&
    request.status !== "failed" &&
    request.status !== "expired" &&
    JSON.stringify([
      request.args.producer_id ?? request.args.producerId ?? null,
      request.args.source_id ?? request.args.sourceId ?? null,
      request.args.cadence_ms ?? request.args.cadenceMs ?? null,
    ]) === JSON.stringify(dedupeKey.slice(3))
  );
  if (existing && !explicitId) {
    const updated = { ...existing, status: "requested" as const, args };
    requestsById.set(existing.action_request_id, updated);
    return updated;
  }
  const request: HelixClientCapabilityAction = {
    schema: HELIX_CLIENT_CAPABILITY_ACTION_SCHEMA,
    action_request_id: explicitId ?? `client_action:${hashShort([dedupeKey, Date.now()])}`,
    thread_id: threadId,
    environment_id: asString(input.environment_id ?? input.environmentId),
    pipeline_id: asString(input.pipeline_id ?? input.pipelineId),
    target_client: normalizeTarget(input.target_client ?? input.targetClient),
    capability,
    action,
    args,
    status: normalizeStatus(input.status),
    requires_user_gesture: input.requires_user_gesture === true,
    assistant_answer: false,
    raw_content_included: false,
  };
  requestsById.set(request.action_request_id, request);
  return request;
}

export function listPendingClientCapabilityActions(input: { threadId?: string | null } = {}): HelixClientCapabilityAction[] {
  return Array.from(requestsById.values())
    .filter((request) => !input.threadId || request.thread_id === input.threadId)
    .filter((request) => request.status === "requested" || request.status === "delivered")
    .sort((a, b) => a.action_request_id.localeCompare(b.action_request_id));
}

export function listClientCapabilityActions(input: { threadId?: string | null } = {}): HelixClientCapabilityAction[] {
  return Array.from(requestsById.values())
    .filter((request) => !input.threadId || request.thread_id === input.threadId);
}

export function findLatestClientCapabilityAction(input: {
  threadId?: string | null;
  sourceId?: string | null;
  producerId?: string | null;
  capability?: HelixClientCapability | null;
  action?: HelixClientCapabilityActionKind | null;
}): HelixClientCapabilityAction | null {
  const sourceId = input.sourceId ?? null;
  const producerId = input.producerId ?? null;
  return listClientCapabilityActions({ threadId: input.threadId })
    .filter((request) => !input.capability || request.capability === input.capability)
    .filter((request) => !input.action || request.action === input.action)
    .filter((request) => !sourceId || request.args.source_id === sourceId || request.args.sourceId === sourceId)
    .filter((request) => !producerId || request.args.producer_id === producerId || request.args.producerId === producerId)
    .at(-1) ?? null;
}

export function getClientCapabilityAction(actionRequestId: string | null | undefined): HelixClientCapabilityAction | null {
  return actionRequestId ? requestsById.get(actionRequestId) ?? null : null;
}

export function updateClientCapabilityActionStatus(
  actionRequestId: string,
  status: HelixClientCapabilityActionStatus,
): HelixClientCapabilityAction | null {
  const request = requestsById.get(actionRequestId);
  if (!request) return null;
  const updated = { ...request, status };
  requestsById.set(actionRequestId, updated);
  return updated;
}

export function resetClientCapabilityActionsForTest(): void {
  requestsById.clear();
}
