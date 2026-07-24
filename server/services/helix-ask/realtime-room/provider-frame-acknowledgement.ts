import {
  subscribeRealtimeSidebandProviderEvents,
} from "../realtime-session/sideband-control-channel";
import {
  findSharedRealtimeRoomRuntimeByRealtimeSessionId,
  rejectSharedRealtimeRoomVisualFrameByProviderEvent,
  updateSharedRealtimeRoomVisualFrameByProviderItem,
} from "./runtime-registry";

type ProviderFrameAcknowledgementResult =
  | "ignored"
  | "provider_acknowledged"
  | "provider_rejected";

const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const providerItemHasInputImage = (item: Record<string, unknown>): boolean =>
  Array.isArray(item.content) &&
  item.content.some((part) => text(record(part)?.type) === "input_image");

/**
 * A sideband send receipt is not provider acknowledgement. Only the provider's
 * echoed conversation item, with the exact retained item ID and input_image
 * content, may promote a room frame to sent_to_shared_model.
 */
export const applySharedRealtimeRoomProviderFrameEvent = (input: {
  realtimeSessionId: string;
  event: Record<string, unknown>;
}): ProviderFrameAcknowledgementResult => {
  const binding = findSharedRealtimeRoomRuntimeByRealtimeSessionId({
    realtimeSessionId: input.realtimeSessionId,
  });
  if (!binding) return "ignored";
  const eventType = text(input.event.type);
  if (eventType === "conversation.item.created") {
    const item = record(input.event.item);
    const providerItemId = text(item?.id);
    if (!item || !providerItemId || !providerItemHasInputImage(item)) return "ignored";
    const acknowledged = updateSharedRealtimeRoomVisualFrameByProviderItem({
      roomId: binding.roomId,
      providerItemId,
      delivery: "sent_to_shared_model",
    });
    return acknowledged ? "provider_acknowledged" : "ignored";
  }
  if (eventType === "error") {
    const providerEventId = text(record(input.event.error)?.event_id);
    if (!providerEventId) return "ignored";
    const rejected = rejectSharedRealtimeRoomVisualFrameByProviderEvent({
      roomId: binding.roomId,
      providerEventId,
    });
    return rejected ? "provider_rejected" : "ignored";
  }
  return "ignored";
};

let installed = false;

export const installSharedRealtimeRoomProviderFrameAcknowledgement = (): void => {
  if (installed) return;
  installed = true;
  subscribeRealtimeSidebandProviderEvents((input) => {
    applySharedRealtimeRoomProviderFrameEvent(input);
  });
};

