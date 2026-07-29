import type { HelixEnvironmentDomain } from "./helix-environment-state-snapshot";
import {
  isHelixEnvironmentSensorScope,
  type HelixEnvironmentSensorScope,
} from "./helix-environment-sensor-scope";
import { z } from "zod";

export const HELIX_ENVIRONMENT_SOURCE_MANIFEST_SCHEMA =
  "helix.environment_source_manifest.v1" as const;

export const HELIX_ENVIRONMENT_SOURCE_HEARTBEAT_SCHEMA =
  "helix.environment_source_heartbeat.v1" as const;

export type HelixEnvironmentSourceModality =
  | "environment_state"
  | "environment_affordance"
  | "procedure_graph"
  | "simulation_stream"
  | "visual_frame"
  | "audio_transcript";

export type HelixEnvironmentSnapshotSection =
  | "actor_state"
  | "inventory_state"
  | "object_state"
  | "local_map"
  | "chunk_snapshot_summary"
  | "focus"
  | "affordances"
  | "domain_specific";

export type HelixEnvironmentManifestProbeType =
  | "actor_status"
  | "nearby_entities"
  | "route_feasibility"
  | "reachability"
  | "line_of_sight"
  | "container_freshness"
  | "crop_state"
  | "hazard_check"
  | "inventory_check"
  | "local_map_summary";

export type HelixEnvironmentForbiddenProbeType =
  | "move_actor"
  | "use_item"
  | "take_item"
  | "place_block"
  | "break_block"
  | "attack_entity"
  | "open_container";

export type HelixEnvironmentSourceManifest = {
  schema: typeof HELIX_ENVIRONMENT_SOURCE_MANIFEST_SCHEMA;
  manifest_id: string;
  source_id: string;
  room_id: string;
  domain: HelixEnvironmentDomain;
  domain_adapter: string;
  source_label: string;
  adapter_version: string;
  protocol_version: string;
  modalities: HelixEnvironmentSourceModality[];
  supported_snapshot_sections: HelixEnvironmentSnapshotSection[];
  supported_probe_types: HelixEnvironmentManifestProbeType[];
  forbidden_probe_types: HelixEnvironmentForbiddenProbeType[];
  snapshot_policy: {
    baseline_interval_ms: number;
    burst_interval_ms?: number | null;
    send_only_changed_sections: boolean;
    include_section_hashes: boolean;
    max_payload_bytes: number;
    raw_payload_included: false;
    raw_nbt_included?: false;
  };
  sensor_scope_policy: {
    default_scope: HelixEnvironmentSensorScope;
    can_report_privileged_state: boolean;
    privileged_state_requires_caveat: true;
    player_memory_requires_prior_observation: true;
  };
  execution_policy: {
    may_execute_live_actions: false;
    may_perform_read_only_probes: true;
    require_human_approval_for_execution: true;
  };
  auth_policy: {
    bearer_required: boolean;
    source_signature_required?: boolean;
  };
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};

export type HelixEnvironmentSourceHeartbeat = {
  schema: typeof HELIX_ENVIRONMENT_SOURCE_HEARTBEAT_SCHEMA;
  heartbeat_id: string;
  source_id: string;
  room_id: string;
  domain: string;
  domain_adapter: string;
  status: "active" | "degraded" | "paused" | "stale" | "error";
  server_tick?: number | null;
  latest_snapshot_id?: string | null;
  latest_snapshot_ts?: string | null;
  active_players?: Array<{
    actor_id: string;
    actor_label: string;
    dimension?: string | null;
  }>;
  pending_probe_count?: number;
  backpressure?: {
    snapshot_upload_pending: boolean;
    skipped_snapshot_count: number;
    avg_payload_bytes?: number | null;
  };
  runtime_status?: {
    upload_queue?: string | null;
    backoff_state?: string | null;
    auth_failure_count?: number | null;
    oversized_payload_count?: number | null;
    contract_failure_count?: number | null;
    last_error?: string | null;
  };
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};

const environmentWireIdSchema = z.string().trim().min(1).max(256);
const environmentWireTimestampSchema = z.string().trim().min(1).max(64).refine(
  (value) => Number.isFinite(Date.parse(value)),
  "Expected an ISO-compatible timestamp.",
);
const environmentEvidenceRefsSchema = z.array(z.string().trim().min(1).max(512)).max(128);
const environmentSensorScopeSchema = z.custom<HelixEnvironmentSensorScope>(
  isHelixEnvironmentSensorScope,
  { message: "Expected a supported environment sensor scope." },
);

export const helixEnvironmentSourceManifestSchema = z.object({
  schema: z.literal(HELIX_ENVIRONMENT_SOURCE_MANIFEST_SCHEMA),
  manifest_id: environmentWireIdSchema,
  source_id: environmentWireIdSchema,
  room_id: environmentWireIdSchema,
  domain: z.string().trim().min(1).max(80),
  domain_adapter: environmentWireIdSchema,
  source_label: z.string().trim().min(1).max(160),
  adapter_version: z.string().trim().min(1).max(80),
  protocol_version: z.string().trim().min(1).max(160),
  modalities: z.array(z.enum([
    "environment_state",
    "environment_affordance",
    "procedure_graph",
    "simulation_stream",
    "visual_frame",
    "audio_transcript",
  ])).min(1).max(16),
  supported_snapshot_sections: z.array(z.enum([
    "actor_state",
    "inventory_state",
    "object_state",
    "local_map",
    "chunk_snapshot_summary",
    "focus",
    "affordances",
    "domain_specific",
  ])).max(32),
  supported_probe_types: z.array(z.enum([
    "actor_status",
    "nearby_entities",
    "route_feasibility",
    "reachability",
    "line_of_sight",
    "container_freshness",
    "crop_state",
    "hazard_check",
    "inventory_check",
    "local_map_summary",
  ])).max(32),
  forbidden_probe_types: z.array(z.enum([
    "move_actor",
    "use_item",
    "take_item",
    "place_block",
    "break_block",
    "attack_entity",
    "open_container",
  ])).max(32),
  snapshot_policy: z.object({
    baseline_interval_ms: z.number().int().positive(),
    burst_interval_ms: z.number().int().positive().nullable().optional(),
    send_only_changed_sections: z.boolean(),
    include_section_hashes: z.boolean(),
    max_payload_bytes: z.number().int().positive(),
    raw_payload_included: z.literal(false),
    raw_nbt_included: z.literal(false).optional(),
  }).strict(),
  sensor_scope_policy: z.object({
    default_scope: environmentSensorScopeSchema,
    can_report_privileged_state: z.boolean(),
    privileged_state_requires_caveat: z.literal(true),
    player_memory_requires_prior_observation: z.literal(true),
  }).strict(),
  execution_policy: z.object({
    may_execute_live_actions: z.literal(false),
    may_perform_read_only_probes: z.literal(true),
    require_human_approval_for_execution: z.literal(true),
  }).strict(),
  auth_policy: z.object({
    bearer_required: z.boolean(),
    source_signature_required: z.boolean().optional(),
  }).strict(),
  assistant_answer: z.literal(false),
  raw_content_included: z.literal(false),
  context_policy: z.literal("compact_context_pack_only"),
  created_at: environmentWireTimestampSchema,
}).strict();

export const helixEnvironmentSourceHeartbeatSchema = z.object({
  schema: z.literal(HELIX_ENVIRONMENT_SOURCE_HEARTBEAT_SCHEMA),
  heartbeat_id: environmentWireIdSchema,
  source_id: environmentWireIdSchema,
  room_id: environmentWireIdSchema,
  domain: z.string().trim().min(1).max(80),
  domain_adapter: environmentWireIdSchema,
  status: z.enum(["active", "degraded", "paused", "stale", "error"]),
  server_tick: z.number().int().nonnegative().nullable().optional(),
  latest_snapshot_id: environmentWireIdSchema.nullable().optional(),
  latest_snapshot_ts: environmentWireTimestampSchema.nullable().optional(),
  active_players: z.array(z.object({
    actor_id: environmentWireIdSchema,
    actor_label: z.string().trim().min(1).max(160),
    dimension: z.string().trim().min(1).max(160).nullable().optional(),
  }).strict()).max(256).optional(),
  pending_probe_count: z.number().int().nonnegative().optional(),
  backpressure: z.object({
    snapshot_upload_pending: z.boolean(),
    skipped_snapshot_count: z.number().int().nonnegative(),
    avg_payload_bytes: z.number().finite().nonnegative().nullable().optional(),
  }).strict().optional(),
  runtime_status: z.object({
    upload_queue: z.string().max(160).nullable().optional(),
    backoff_state: z.string().max(160).nullable().optional(),
    auth_failure_count: z.number().int().nonnegative().nullable().optional(),
    oversized_payload_count: z.number().int().nonnegative().nullable().optional(),
    contract_failure_count: z.number().int().nonnegative().nullable().optional(),
    last_error: z.string().max(1000).nullable().optional(),
  }).strict().optional(),
  evidence_refs: environmentEvidenceRefsSchema,
  assistant_answer: z.literal(false),
  raw_content_included: z.literal(false),
  created_at: environmentWireTimestampSchema,
}).strict();
