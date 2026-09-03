import { z } from "zod";

export const HELIX_OPERATOR_ACTIVITY_EVENT_SCHEMA =
  "helix.operator_activity_event.v1" as const;
export const HELIX_OPERATOR_ACTIVITY_CURSOR_SCHEMA =
  "helix.operator_activity_cursor.v1" as const;
export const HELIX_OPERATOR_ACTIVITY_PAGE_SCHEMA =
  "helix.operator_activity_page.v1" as const;
export const HELIX_OPERATOR_ACTIVITY_STREAM_LIST_SCHEMA =
  "helix.operator_activity_stream_list.v1" as const;

export const HELIX_OPERATOR_ACTIVITY_SOURCE_KINDS = [
  "mcp_capability_lifecycle",
  "agent_turn_lifecycle",
  "environment_event",
] as const;

export const HELIX_OPERATOR_ACTIVITY_EVENT_KINDS = [
  "connection",
  "request",
  "admission",
  "dispatch",
  "observation",
  "evidence",
  "checkpoint",
  "failure",
  "cancellation",
  "completion",
  "status",
] as const;

export const HELIX_OPERATOR_ACTIVITY_LIFECYCLE_STAGES = [
  "connected",
  "disconnected",
  "planned",
  "admitted",
  "dispatched",
  "adapter_acknowledged",
  "result_observed",
  "result_validated",
  "reentered_solver",
  "terminal_considered",
  "agent_run_observed",
  "environment_observed",
  "checkpoint_published",
] as const;

export const HELIX_OPERATOR_ACTIVITY_OUTCOMES = [
  "pending",
  "succeeded",
  "failed",
  "blocked",
  "canceled",
  "unavailable",
  "disconnected",
  "stale",
  "skipped",
] as const;

const refSchema = z.string().trim().min(1).max(512);
const timestampSchema = z.string().datetime({ offset: true });

const optionalRefSchema = refSchema.nullable();

export const helixOperatorActivityEventSchema = z
  .object({
    schema: z.literal(HELIX_OPERATOR_ACTIVITY_EVENT_SCHEMA),
    activity_event_id: refSchema,
    projection_sequence: z.number().int().nonnegative(),
    source_kind: z.enum(HELIX_OPERATOR_ACTIVITY_SOURCE_KINDS),
    source_schema: refSchema,
    source_event_ref: refSchema,
    profile_ref: refSchema,
    node_ref: refSchema,
    oauth_client_ref: optionalRefSchema,
    client_session_ref: optionalRefSchema,
    provider_thread_ref: optionalRefSchema,
    provider_thread_epoch: optionalRefSchema,
    run_id: optionalRefSchema,
    turn_id: optionalRefSchema,
    capability_call_ref: optionalRefSchema,
    environment_binding_ref: optionalRefSchema,
    room_ref: optionalRefSchema,
    source_ref: optionalRefSchema,
    world_ref: optionalRefSchema,
    workflow_ref: optionalRefSchema,
    effect_lease_ref: optionalRefSchema,
    terminal_product_ref: optionalRefSchema,
    event_kind: z.enum(HELIX_OPERATOR_ACTIVITY_EVENT_KINDS),
    lifecycle_stage: z.enum(HELIX_OPERATOR_ACTIVITY_LIFECYCLE_STAGES),
    outcome: z.enum(HELIX_OPERATOR_ACTIVITY_OUTCOMES),
    summary: z.string().trim().min(1).max(2_000),
    evidence_refs: z.array(refSchema).max(128),
    occurred_at: timestampSchema,
    observed_at: timestampSchema,
    provenance: z.enum(["measured", "reported", "derived"]),
    redaction_state: z.enum(["sanitized", "redacted", "withheld"]),
    visibility: z.enum(["profile", "room_grant"]),
    content_role: z.literal("operator_activity_not_assistant_answer"),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((event, context) => {
    if (Date.parse(event.occurred_at) > Date.parse(event.observed_at)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["occurred_at"],
        message: "Activity cannot be observed before it occurs.",
      });
    }
    if (new Set(event.evidence_refs).size !== event.evidence_refs.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["evidence_refs"],
        message: "Activity evidence references must be unique.",
      });
    }
    if (
      (event.provider_thread_ref === null) !==
      (event.provider_thread_epoch === null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["provider_thread_epoch"],
        message: "Provider thread identity and epoch must be present together.",
      });
    }
  });

export type HelixOperatorActivityEvent = z.infer<
  typeof helixOperatorActivityEventSchema
>;

export const helixOperatorActivityCursorSchema = z
  .object({
    schema: z.literal(HELIX_OPERATOR_ACTIVITY_CURSOR_SCHEMA),
    stream_ref: refSchema,
    profile_ref: refSchema,
    node_ref: refSchema,
    run_id: optionalRefSchema,
    provider_thread_ref: optionalRefSchema,
    provider_thread_epoch: optionalRefSchema,
    after_sequence: z.number().int().min(-1),
    projection_version: z.literal(1),
  })
  .strict()
  .superRefine((cursor, context) => {
    if (
      (cursor.provider_thread_ref === null) !==
      (cursor.provider_thread_epoch === null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["provider_thread_epoch"],
        message: "Cursor thread identity and epoch must be present together.",
      });
    }
  });

export type HelixOperatorActivityCursor = z.infer<
  typeof helixOperatorActivityCursorSchema
>;

export const helixOperatorActivityStreamDescriptorSchema = z
  .object({
    stream_ref: refSchema,
    profile_ref: refSchema,
    node_ref: refSchema,
    event_count: z.number().int().nonnegative(),
    next_sequence: z.number().int().nonnegative(),
    latest_observed_at: timestampSchema.nullable(),
  })
  .strict();

export type HelixOperatorActivityStreamDescriptor = z.infer<
  typeof helixOperatorActivityStreamDescriptorSchema
>;

export const helixOperatorActivityStreamListSchema = z
  .object({
    schema: z.literal(HELIX_OPERATOR_ACTIVITY_STREAM_LIST_SCHEMA),
    profile_ref: refSchema,
    streams: z.array(helixOperatorActivityStreamDescriptorSchema).max(100),
    content_role: z.literal("operator_activity_stream_list_not_assistant_answer"),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((list, context) => {
    for (let index = 0; index < list.streams.length; index += 1) {
      if (list.streams[index].profile_ref !== list.profile_ref) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["streams", index, "profile_ref"],
          message: "Every activity stream must belong to the listed profile.",
        });
      }
    }
  });

export type HelixOperatorActivityStreamList = z.infer<
  typeof helixOperatorActivityStreamListSchema
>;

export const helixOperatorActivityPageSchema = z
  .object({
    schema: z.literal(HELIX_OPERATOR_ACTIVITY_PAGE_SCHEMA),
    stream_ref: refSchema,
    profile_ref: refSchema,
    node_ref: refSchema,
    run_id: optionalRefSchema,
    provider_thread_ref: optionalRefSchema,
    provider_thread_epoch: optionalRefSchema,
    events: z.array(helixOperatorActivityEventSchema).max(100),
    next_cursor: helixOperatorActivityCursorSchema.nullable(),
    has_more: z.boolean(),
    complete_for_query: z.boolean(),
    summary: z
      .object({
        returned_count: z.number().int().nonnegative(),
        first_sequence: z.number().int().nonnegative().nullable(),
        last_sequence: z.number().int().nonnegative().nullable(),
        outcome_counts: z.record(
          z.string(),
          z.number().int().nonnegative(),
        ),
      })
      .strict(),
    content_role: z.literal("operator_activity_page_not_assistant_answer"),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((page, context) => {
    if (page.has_more !== Boolean(page.next_cursor)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["next_cursor"],
        message: "A continuation cursor is required exactly when more activity exists.",
      });
    }
    if (page.summary.returned_count !== page.events.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["summary", "returned_count"],
        message: "The returned activity count must match the page.",
      });
    }
    const firstSequence = page.events.at(0)?.projection_sequence ?? null;
    const lastSequence = page.events.at(-1)?.projection_sequence ?? null;
    if (
      page.summary.first_sequence !== firstSequence ||
      page.summary.last_sequence !== lastSequence
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["summary"],
        message: "Summary sequence bounds must match the page.",
      });
    }
    for (let index = 0; index < page.events.length; index += 1) {
      const event = page.events[index];
      const previous = page.events[index - 1];
      if (previous && event.projection_sequence <= previous.projection_sequence) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["events", index, "projection_sequence"],
          message: "Activity pages must be strictly ordered by projection sequence.",
        });
      }
      if (
        event.profile_ref !== page.profile_ref ||
        event.node_ref !== page.node_ref ||
        (page.run_id !== null && event.run_id !== page.run_id) ||
        (page.provider_thread_ref !== null &&
          (event.provider_thread_ref !== page.provider_thread_ref ||
            event.provider_thread_epoch !== page.provider_thread_epoch))
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["events", index],
          message: "Activity event identity does not match the requested page scope.",
        });
      }
    }
    if (
      page.next_cursor &&
      (page.next_cursor.stream_ref !== page.stream_ref ||
        page.next_cursor.profile_ref !== page.profile_ref ||
        page.next_cursor.node_ref !== page.node_ref ||
        page.next_cursor.run_id !== page.run_id ||
        page.next_cursor.provider_thread_ref !== page.provider_thread_ref ||
        page.next_cursor.provider_thread_epoch !== page.provider_thread_epoch ||
        page.next_cursor.after_sequence !== lastSequence)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["next_cursor"],
        message: "The continuation cursor must resume the exact page scope and sequence.",
      });
    }
  });

export type HelixOperatorActivityPage = z.infer<
  typeof helixOperatorActivityPageSchema
>;
