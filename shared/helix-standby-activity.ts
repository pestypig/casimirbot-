export const HELIX_STANDBY_ACTIVITY_ITEM_SCHEMA =
  "helix.standby_activity_item.v1" as const;

export type HelixStandbyActivityKind =
  | "source_event"
  | "episode"
  | "narration"
  | "prediction"
  | "salience"
  | "callout_proposal"
  | "callout_delivery"
  | "standby_reasoning"
  | "suppression"
  | "queue_state"
  | "binding_state";

export type HelixStandbyActivityVisibility =
  | "hidden"
  | "runtime_only"
  | "helix_dock"
  | "helix_dock_pinned";

export type HelixStandbyActivityItem = {
  schema: typeof HELIX_STANDBY_ACTIVITY_ITEM_SCHEMA;
  activity_id: string;
  thread_id?: string | null;
  turn_id?: string | null;
  item_id?: string | null;
  room_id?: string | null;
  source_id?: string | null;
  graph_id?: string | null;
  world_id?: string | null;
  actor_label?: string | null;
  kind: HelixStandbyActivityKind;
  priority: "info" | "warn" | "critical" | "action";
  title: string;
  summary: string;
  decision?:
    | "silent_keep_in_context"
    | "show_text"
    | "voice_on_confirm"
    | "voice_auto_allowed"
    | "request_user_input"
    | "promote_to_reasoning";
  visibility: HelixStandbyActivityVisibility;
  provenance: {
    source: "deterministic_dictionary" | "micro_reasoner" | "hybrid" | "user_direct";
    model_invoked: boolean;
    context_policy: "observation_only" | "explicit_attachment_only";
    safe_for_future_context: boolean;
  };
  evidence_refs: string[];
  linked_activity_ids?: string[];
  ts: string;
};

export type HelixStandbyActivityResponse = {
  ok: boolean;
  schema: "helix.standby_activity_response.v1";
  thread_id: string;
  limit: number;
  activities: HelixStandbyActivityItem[];
};
