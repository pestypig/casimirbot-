import {
  isHelixEnvironmentSensorScope,
  type HelixEnvironmentSensorScope,
} from "./helix-environment-sensor-scope";
import { z } from "zod";

export const HELIX_ENVIRONMENT_PROBE_REQUEST_SCHEMA =
  "helix.environment_probe_request.v1" as const;

export const HELIX_ENVIRONMENT_PROBE_RESULT_SCHEMA =
  "helix.environment_probe_result.v1" as const;

export type HelixEnvironmentProbeType =
  | "route_feasibility"
  | "reachability"
  | "line_of_sight"
  | "container_freshness"
  | "crop_state"
  | "hazard_check"
  | "inventory_check"
  | "local_map_summary";

export type HelixEnvironmentProbeRequest = {
  schema: typeof HELIX_ENVIRONMENT_PROBE_REQUEST_SCHEMA;
  probe_request_id: string;
  source_id: string;
  room_id: string;
  domain: string;
  domain_adapter?: string | null;
  probe_type: HelixEnvironmentProbeType;
  reason: "rehearsal" | "manual_debug" | "live_answer_validation" | "contract_test";
  objective?: string | null;
  target?: {
    target_ref?: string | null;
    target_type?: string | null;
    position?: { x: number; y: number; z?: number | null } | null;
    actor_id?: string | null;
  };
  constraints: {
    read_only: true;
    side_effects_allowed: false;
    max_radius?: number | null;
    max_duration_ms?: number | null;
    ttl_ms: number;
  };
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
  expires_at: string;
};

export type HelixEnvironmentProbeResult = {
  schema: typeof HELIX_ENVIRONMENT_PROBE_RESULT_SCHEMA;
  probe_result_id: string;
  probe_request_id: string;
  source_id: string;
  room_id: string;
  domain: string;
  probe_type: HelixEnvironmentProbeType;
  status: "succeeded" | "failed" | "partial" | "expired" | "unsupported" | "blocked_by_policy";
  result_summary: string;
  result: {
    feasible?: boolean | null;
    reachable?: boolean | null;
    line_of_sight?: boolean | null;
    path_cost_blocks?: number | null;
    distance_blocks?: number | null;
    contents_fresh?: boolean | null;
    crop_mature?: boolean | null;
    hazard_present?: boolean | null;
    confidence?: number | null;
    details?: Record<string, unknown>;
  };
  sensor_scope: HelixEnvironmentSensorScope;
  requires_caveat: boolean;
  side_effects_performed: false;
  commands_executed: [];
  world_mutation_performed: false;
  evidence_refs: string[];
  deterministic: true;
  model_invoked: false;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};

const probeWireIdSchema = z.string().trim().min(1).max(256);
const probeWireTimestampSchema = z.string().trim().min(1).max(64).refine(
  (value) => Number.isFinite(Date.parse(value)),
  "Expected an ISO-compatible timestamp.",
);
const probeTypeSchema = z.enum([
  "route_feasibility",
  "reachability",
  "line_of_sight",
  "container_freshness",
  "crop_state",
  "hazard_check",
  "inventory_check",
  "local_map_summary",
]);

export const helixEnvironmentProbeResultSchema = z.object({
  schema: z.literal(HELIX_ENVIRONMENT_PROBE_RESULT_SCHEMA),
  probe_result_id: probeWireIdSchema,
  probe_request_id: probeWireIdSchema,
  source_id: probeWireIdSchema,
  room_id: probeWireIdSchema,
  domain: z.string().trim().min(1).max(80),
  probe_type: probeTypeSchema,
  status: z.enum([
    "succeeded",
    "failed",
    "partial",
    "expired",
    "unsupported",
    "blocked_by_policy",
  ]),
  result_summary: z.string().trim().min(1).max(2000),
  result: z.object({
    feasible: z.boolean().nullable().optional(),
    reachable: z.boolean().nullable().optional(),
    line_of_sight: z.boolean().nullable().optional(),
    path_cost_blocks: z.number().finite().nonnegative().nullable().optional(),
    distance_blocks: z.number().finite().nonnegative().nullable().optional(),
    contents_fresh: z.boolean().nullable().optional(),
    crop_mature: z.boolean().nullable().optional(),
    hazard_present: z.boolean().nullable().optional(),
    confidence: z.number().finite().min(0).max(1).nullable().optional(),
    details: z.record(z.string(), z.unknown()).optional(),
  }).strict(),
  sensor_scope: z.custom<HelixEnvironmentSensorScope>(
    isHelixEnvironmentSensorScope,
    { message: "Expected a supported environment sensor scope." },
  ),
  requires_caveat: z.boolean(),
  side_effects_performed: z.literal(false),
  commands_executed: z.array(z.unknown()).length(0),
  world_mutation_performed: z.literal(false),
  evidence_refs: z.array(z.string().trim().min(1).max(512)).max(128),
  deterministic: z.literal(true),
  model_invoked: z.literal(false),
  assistant_answer: z.literal(false),
  raw_content_included: z.literal(false),
  context_policy: z.literal("compact_context_pack_only"),
  created_at: probeWireTimestampSchema,
}).strict();
