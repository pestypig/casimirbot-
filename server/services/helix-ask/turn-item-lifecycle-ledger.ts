import {
  HELIX_TURN_ITEM_LIFECYCLE_EVENT_SCHEMA,
  type HelixTurnItemLifecycleEvent,
} from "@shared/helix-turn-item-lifecycle";

export function makeTurnItemLifecycleEvent(input: Omit<HelixTurnItemLifecycleEvent, "schema" | "created_at"> & {
  created_at?: string;
}): HelixTurnItemLifecycleEvent {
  return {
    schema: HELIX_TURN_ITEM_LIFECYCLE_EVENT_SCHEMA,
    ...input,
    created_at: input.created_at ?? new Date().toISOString(),
  };
}

export function pushTurnItemLifecyclePair(
  events: HelixTurnItemLifecycleEvent[],
  input: {
    thread_id: string;
    turn_id: string;
    item_id: string;
    item_type: HelixTurnItemLifecycleEvent["item_type"];
    assistant_answer?: boolean;
  },
): void {
  events.push(
    makeTurnItemLifecycleEvent({
      ...input,
      event_type: "item_started",
      status: "inProgress",
      assistant_answer: input.assistant_answer ?? false,
    }),
    makeTurnItemLifecycleEvent({
      ...input,
      event_type: "item_completed",
      status: "completed",
      assistant_answer: input.assistant_answer ?? false,
    }),
  );
}
