export const HELIX_TURN_ITEM_LIFECYCLE_EVENT_SCHEMA = "helix.turn_item_lifecycle_event.v1" as const;

export type HelixTurnItemLifecycleEvent = {
  schema: typeof HELIX_TURN_ITEM_LIFECYCLE_EVENT_SCHEMA;
  thread_id: string;
  turn_id: string;
  item_id: string;
  item_type:
    | "userMessage"
    | "visualAnalysis"
    | "visualExtraction"
    | "derivedEquation"
    | "dynamicToolCall"
    | "toolObservation"
    | "workstationToolEvaluation"
    | "agentMessage";
  event_type: "item_started" | "item_delta" | "item_completed" | "item_failed";
  status?: "inProgress" | "completed" | "failed" | "declined";
  assistant_answer: boolean;
  created_at: string;
};
