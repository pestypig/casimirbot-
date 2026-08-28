import { z } from "zod";

export const HELIX_LOCAL_SUPERVISOR_STATUS_SCHEMA =
  "helix.local_supervisor_status.v1" as const;

export const helixLocalSupervisorStatusSchema = z.object({
  schema: z.literal(HELIX_LOCAL_SUPERVISOR_STATUS_SCHEMA),
  service_instance_ref: z.string().regex(/^service_instance:[a-f0-9]{32}$/u),
  workspace_ref: z.string().regex(/^workspace:[a-f0-9]{64}$/u),
  started_at: z.string().datetime({ offset: true }),
  ready: z.boolean(),
  supervisor_mode: z.enum([
    "desktop_single_instance",
    "external_keyed_launcher",
    "external_process",
  ]),
  one_instance_enforced: z.boolean(),
  attach_supported: z.literal(true),
  client_isolation_dimensions: z.tuple([
    z.literal("account_session"),
    z.literal("oauth_client"),
    z.literal("conversation_thread"),
    z.literal("room_participant"),
    z.literal("run_turn"),
    z.literal("environment_source_epoch"),
    z.literal("execution_lease"),
  ]),
  concurrent_read_admission: z.literal("grant_scoped"),
  mutation_admission: z.literal("serialized_execution_lease"),
  credential_included: z.literal(false),
  private_endpoint_included: z.literal(false),
  workspace_path_included: z.literal(false),
  process_identity_included: z.literal(false),
  account_identity_included: z.literal(false),
  content_role: z.literal("local_supervisor_status_not_authority"),
  answer_authority: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

export type HelixLocalSupervisorStatus = z.infer<
  typeof helixLocalSupervisorStatusSchema
>;

export const HELIX_LOCAL_SUPERVISOR_ORIGIN_SELECTION_SCHEMA =
  "helix.local_supervisor_origin_selection.v1" as const;

const helixExactLoopbackOriginSchema = z.string().refine((value) => {
  try {
    const parsed = new URL(value);
    const port = Number(parsed.port);
    return parsed.protocol === "http:" &&
      parsed.hostname === "127.0.0.1" &&
      Boolean(parsed.port) &&
      Number.isInteger(port) &&
      port >= 1024 &&
      port <= 65_535 &&
      !parsed.username &&
      !parsed.password &&
      parsed.pathname === "/" &&
      !parsed.search &&
      !parsed.hash &&
      parsed.origin === value;
  } catch {
    return false;
  }
}, "Expected an exact uncredentialed HTTP 127.0.0.1 origin.");

export const helixLocalSupervisorOriginSelectionSchema = z.object({
  schema: z.literal(HELIX_LOCAL_SUPERVISOR_ORIGIN_SELECTION_SCHEMA),
  decision: z.enum(["attach", "start", "fail_closed"]),
  reason: z.enum([
    "verified_owned_instance_ready",
    "free_loopback_origin",
    "foreign_listener_skipped",
    "verified_ownership_contradiction",
    "multiple_verified_owned_instances",
    "candidate_origins_exhausted",
  ]),
  selected_origin: helixExactLoopbackOriginSchema.nullable(),
  candidate_count: z.number().int().min(1).max(16),
  foreign_or_unknown_listener_count: z.number().int().nonnegative().max(16),
  caller_ownership_receipt_required: z.literal(true),
  atomic_bind_claim_required: z.literal(true),
  post_start_status_verification_required: z.literal(true),
  credential_included: z.literal(false),
  private_network_endpoint_included: z.literal(false),
  workspace_path_included: z.literal(false),
  process_identity_included: z.literal(false),
  account_identity_included: z.literal(false),
  content_role: z.literal("local_supervisor_origin_selection_not_authority"),
  answer_authority: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict().superRefine((value, context) => {
  if (value.decision === "fail_closed" && value.selected_origin !== null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["selected_origin"],
      message: "A fail-closed selection cannot include an origin.",
    });
  }
  if (value.decision !== "fail_closed" && value.selected_origin === null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["selected_origin"],
      message: "Attach and start selections require an origin.",
    });
  }
});

export type HelixLocalSupervisorOriginSelection = z.infer<
  typeof helixLocalSupervisorOriginSelectionSchema
>;

export const HELIX_LOCAL_SUPERVISOR_POST_BIND_VERIFICATION_SCHEMA =
  "helix.local_supervisor_post_bind_verification.v1" as const;

export const helixLocalSupervisorPostBindVerificationSchema = z.object({
  schema: z.literal(HELIX_LOCAL_SUPERVISOR_POST_BIND_VERIFICATION_SCHEMA),
  decision: z.enum(["ready", "fail_closed"]),
  reason: z.enum([
    "bound_instance_verified",
    "selection_not_start",
    "selected_origin_mismatch",
    "atomic_bind_not_claimed",
    "listener_missing",
    "invalid_status",
    "workspace_mismatch",
    "supervisor_not_ready",
    "supervisor_not_enforcing",
    "status_exposure_violation",
  ]),
  verified_origin: helixExactLoopbackOriginSchema.nullable(),
  service_instance_ref: z.string()
    .regex(/^service_instance:[a-f0-9]{32}$/u)
    .nullable(),
  atomic_bind_claimed: z.boolean(),
  credential_included: z.literal(false),
  private_network_endpoint_included: z.literal(false),
  workspace_path_included: z.literal(false),
  process_identity_included: z.literal(false),
  account_identity_included: z.literal(false),
  content_role: z.literal("local_supervisor_post_bind_verification_not_authority"),
  answer_authority: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict().superRefine((value, context) => {
  if (value.decision === "ready" &&
      (!value.verified_origin || !value.service_instance_ref ||
       !value.atomic_bind_claimed)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A ready verification requires an origin, service instance, and atomic bind claim.",
    });
  }
  if (value.decision === "fail_closed" &&
      (value.verified_origin !== null || value.service_instance_ref !== null)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A fail-closed verification cannot advertise an instance.",
    });
  }
});

export type HelixLocalSupervisorPostBindVerification = z.infer<
  typeof helixLocalSupervisorPostBindVerificationSchema
>;

export const HELIX_LOCAL_SUPERVISOR_LAUNCH_ORCHESTRATION_SCHEMA =
  "helix.local_supervisor_launch_orchestration.v1" as const;

export const helixLocalSupervisorLaunchOrchestrationSchema = z.object({
  schema: z.literal(HELIX_LOCAL_SUPERVISOR_LAUNCH_ORCHESTRATION_SCHEMA),
  decision: z.enum(["attached", "started", "fail_closed"]),
  settled_stage: z.enum([
    "inspection",
    "selection",
    "protected_start",
    "post_bind",
    "complete",
  ]),
  reason: z.enum([
    "verified_owned_instance_attached",
    "bound_instance_started",
    "candidate_inspection_failed",
    "selection_failed_closed",
    "protected_start_failed",
    "post_bind_verification_failed",
    "orchestration_deadline_exceeded",
  ]),
  selected_origin: helixExactLoopbackOriginSchema.nullable(),
  service_instance_ref: z.string()
    .regex(/^service_instance:[a-f0-9]{32}$/u)
    .nullable(),
  candidate_count: z.number().int().min(1).max(16),
  deadline_ms: z.number().int().min(100).max(30_000),
  retryable: z.boolean(),
  credential_included: z.literal(false),
  private_network_endpoint_included: z.literal(false),
  workspace_path_included: z.literal(false),
  process_identity_included: z.literal(false),
  account_identity_included: z.literal(false),
  content_role: z.literal("local_supervisor_launch_orchestration_not_authority"),
  answer_authority: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict().superRefine((value, context) => {
  const successful = value.decision === "attached" || value.decision === "started";
  if (successful &&
      (value.settled_stage !== "complete" || !value.selected_origin ||
       !value.service_instance_ref || value.retryable)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A successful orchestration requires a complete non-retryable instance receipt.",
    });
  }
  if (value.decision === "fail_closed" &&
      (value.selected_origin !== null || value.service_instance_ref !== null ||
       value.settled_stage === "complete")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A fail-closed orchestration cannot advertise a completed instance.",
    });
  }
});

export type HelixLocalSupervisorLaunchOrchestration = z.infer<
  typeof helixLocalSupervisorLaunchOrchestrationSchema
>;
