import { z } from "zod";
import { HudCompositionModeSchema } from "./helix-hud-surface";

export const HELIX_SURFACE_REGISTRY_SCHEMA = "helix.surface_registry.v1" as const;
export const HELIX_SURFACE_RECEIPT_SCHEMA = "helix.surface_registry_receipt.v1" as const;
export const HELIX_SURFACE_CONTROL_LEASE_SCHEMA = "helix.surface_control_lease.v1" as const;
export const HELIX_PANEL_LAUNCH_CONTEXT_SCHEMA = "helix.panel_launch_context.v1" as const;
export const HELIX_SURFACE_PANEL_ROUTE_SCHEMA = "helix.surface_panel_route.v1" as const;
export const HELIX_SURFACE_PANEL_ROUTE_RECEIPT_SCHEMA = "helix.surface_panel_route_receipt.v1" as const;

const id = z.string().trim().min(1).max(200);

export const SurfaceSourceBindingV1Schema = z.object({
  source_id: id,
  producer_epoch: id,
  source_kind: z.enum(["none", "tab", "program", "camera", "simulator", "replay", "minecraft_client"]),
}).strict();

export const SurfaceDesiredStateSchema = z.object({
  profile_id: id,
  run_id: id,
  source: SurfaceSourceBindingV1Schema,
  composition_mode: HudCompositionModeSchema,
  transform_ref: id,
  output_target: z.enum(["workstation_preview", "clean_feed", "recorder", "game_overlay", "projector", "secondary_display"]),
}).strict();

export const SurfaceOutputLeaseSchema = z.object({
  schema: z.literal(HELIX_SURFACE_REGISTRY_SCHEMA),
  output_lease_id: id,
  surface_instance_id: id,
  owner_profile_id: id,
  source_id: id,
  producer_epoch: id,
  output_target: SurfaceDesiredStateSchema.shape.output_target,
  status: z.enum(["active", "released"]),
  issued_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  released_at: z.string().datetime().nullable(),
  release_reason: z.enum(["none", "reconfigured", "manual_release", "emergency_blank", "source_revoked", "source_rotated", "sign_out", "expired"]),
}).strict();

export const SurfaceInstanceSchema = z.object({
  schema: z.literal(HELIX_SURFACE_REGISTRY_SCHEMA),
  surface_instance_id: id,
  owner_profile_id: id,
  revision: z.number().int().positive(),
  status: z.enum(["active", "blanked", "released"]),
  desired_state: SurfaceDesiredStateSchema,
  output_lease: SurfaceOutputLeaseSchema.nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  state_hash: id,
  program_input_authority: z.literal(false),
  reflex_authority: z.literal(false),
  model_answer_authority: z.literal(false),
}).strict();

export const SurfaceOperationSchema = z.enum(["configure", "blank", "release", "route"]);

export const SurfaceControlLeaseSchema = z.object({
  schema: z.literal(HELIX_SURFACE_CONTROL_LEASE_SCHEMA),
  control_lease_id: id,
  surface_instance_id: id,
  owner_profile_id: id,
  thread_id: id,
  bound_profile_id: id,
  bound_source_id: id,
  bound_producer_epoch: id,
  permitted_operations: z.array(SurfaceOperationSchema).min(1).max(4),
  issued_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  status: z.enum(["active", "revoked", "expired", "consumed"]),
  revoked_at: z.string().datetime().nullable(),
}).strict();

export const SurfaceCommandSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("configure"), expected_revision: z.number().int().positive(), desired_state: SurfaceDesiredStateSchema }).strict(),
  z.object({ operation: z.literal("blank"), expected_revision: z.number().int().positive(), reason: z.literal("emergency_blank") }).strict(),
  z.object({ operation: z.literal("release"), expected_revision: z.number().int().positive(), reason: z.literal("manual_release") }).strict(),
]);

export const SurfacePrincipalSchema = z.object({
  kind: z.enum(["human_ui", "mcp_codex", "system_cleanup"]),
  principal_id: id,
  owner_profile_id: id,
  thread_id: id.nullable(),
  control_lease_id: id.nullable(),
}).strict();

export const SurfaceReceiptSchema = z.object({
  schema: z.literal(HELIX_SURFACE_RECEIPT_SCHEMA),
  receipt_id: id,
  surface_instance_id: id,
  operation: z.enum(["create", "configure", "blank", "release", "source_revoke", "source_rotate", "sign_out", "lease_issue", "lease_revoke"]),
  principal: SurfacePrincipalSchema,
  prior_revision: z.number().int().nonnegative(),
  applied_revision: z.number().int().positive(),
  prior_state_hash: id.nullable(),
  applied_state_hash: id,
  changed: z.boolean(),
  occurred_at: z.string().datetime(),
  content_role: z.literal("surface_control_receipt_not_assistant_answer"),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  program_input_authority: z.literal(false),
  reflex_authority: z.literal(false),
  model_answer_authority: z.literal(false),
}).strict();

export const PanelLaunchContextSchema = z.object({
  schema: z.literal(HELIX_PANEL_LAUNCH_CONTEXT_SCHEMA),
  panel_id: id,
  surface_instance_id: id.nullable(),
  surface_revision: z.number().int().positive().nullable(),
  profile_id: id.nullable(),
  run_id: id.nullable(),
  source_id: id.nullable(),
  producer_epoch: id.nullable(),
  sequence_id: id.nullable(),
  output_lease_id: id.nullable(),
  requested_view: id.nullable(),
  focus_target: id.nullable(),
}).strict();

export const SURFACE_PANEL_ROUTE_TARGETS = {
  surface_workspace: "surface-workspace",
  hud_lab: "motorcycle-hud-lab",
  image_lens: "image-lens",
  live_answer: "live-answer-environment",
  situation_room: "situation-room-pipelines",
  process_graph: "workstation-process-graph",
  workflow_timeline: "workstation-workflow-timeline",
  storage_map: "workstation-storage-map",
  task_manager: "workstation-task-manager",
} as const;

export const SurfacePanelRouteTargetSchema = z.enum([
  "surface_workspace",
  "hud_lab",
  "image_lens",
  "live_answer",
  "situation_room",
  "process_graph",
  "workflow_timeline",
  "storage_map",
  "task_manager",
]);

export const SurfacePanelRouteRequestSchema = z.object({
  schema: z.literal(HELIX_SURFACE_PANEL_ROUTE_SCHEMA),
  expected_revision: z.number().int().positive(),
  target: SurfacePanelRouteTargetSchema,
  sequence_id: id.nullable(),
  requested_view: id.nullable(),
  focus_target: id.nullable(),
}).strict();

export const SurfacePanelRouteReceiptSchema = z.object({
  schema: z.literal(HELIX_SURFACE_PANEL_ROUTE_RECEIPT_SCHEMA),
  route_id: id,
  surface_instance_id: id,
  surface_revision: z.number().int().positive(),
  target: SurfacePanelRouteTargetSchema,
  target_panel_id: id,
  context: PanelLaunchContextSchema,
  principal: SurfacePrincipalSchema,
  occurred_at: z.string().datetime(),
  content_role: z.literal("surface_panel_route_receipt_not_assistant_answer"),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  program_input_authority: z.literal(false),
  reflex_authority: z.literal(false),
  model_answer_authority: z.literal(false),
}).strict();

export type SurfaceDesiredState = z.infer<typeof SurfaceDesiredStateSchema>;
export type SurfaceInstance = z.infer<typeof SurfaceInstanceSchema>;
export type SurfaceCommand = z.infer<typeof SurfaceCommandSchema>;
export type SurfaceOperation = z.infer<typeof SurfaceOperationSchema>;
export type SurfacePrincipal = z.infer<typeof SurfacePrincipalSchema>;
export type SurfaceReceipt = z.infer<typeof SurfaceReceiptSchema>;
export type SurfaceControlLease = z.infer<typeof SurfaceControlLeaseSchema>;
export type PanelLaunchContext = z.infer<typeof PanelLaunchContextSchema>;
export type SurfacePanelRouteTarget = z.infer<typeof SurfacePanelRouteTargetSchema>;
export type SurfacePanelRouteRequest = z.infer<typeof SurfacePanelRouteRequestSchema>;
export type SurfacePanelRouteReceipt = z.infer<typeof SurfacePanelRouteReceiptSchema>;

export const SurfaceCreateRequestSchema = z.object({
  surface_instance_id: id.optional(),
  desired_state: SurfaceDesiredStateSchema,
}).strict();

export const SurfaceControlLeaseRequestSchema = z.object({
  thread_id: id,
  permitted_operations: z.array(SurfaceOperationSchema).min(1).max(4),
  duration_ms: z.number().int().min(1_000).max(15 * 60_000),
}).strict();
