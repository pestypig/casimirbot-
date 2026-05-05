export const HELIX_SITUATION_THREAD_BINDING_SCHEMA =
  "helix.situation_thread_binding.v1" as const;

export const HELIX_SITUATION_THREAD_BINDING_RECEIPT_SCHEMA =
  "helix.situation_thread_binding_receipt.v1" as const;

export type HelixSituationBindingKind =
  | "room"
  | "source"
  | "graph"
  | "minecraft_world";

export type HelixSituationThreadBinding = {
  schema: typeof HELIX_SITUATION_THREAD_BINDING_SCHEMA;
  binding_id: string;
  binding_kind: HelixSituationBindingKind;
  room_id: string;
  source_id?: string | null;
  graph_id?: string | null;
  world_id?: string | null;
  thread_id: string;
  turn_id?: string | null;
  session_id?: string | null;
  trace_id?: string | null;
  mode: "observe_only" | "standby_receipts";
  append_policy: "salient_only" | "all_receipts_debug";
  context_policy: "explicit_attachment_only";
  command_lane_enabled: false;
  created_at: string;
  updated_at: string;
  expires_at?: string | null;
};

export type HelixSituationThreadBindingReceipt = {
  schema: typeof HELIX_SITUATION_THREAD_BINDING_RECEIPT_SCHEMA;
  ok: boolean;
  binding?: HelixSituationThreadBinding;
  error?: string | null;
  message: string;
};
