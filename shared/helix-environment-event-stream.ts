import { z } from "zod";

export const HELIX_ENVIRONMENT_EVENT_SCHEMA =
  "helix.environment_event.v1" as const;
export const HELIX_ENVIRONMENT_EVENT_BATCH_SCHEMA =
  "helix.environment_event_batch.v1" as const;
export const HELIX_ENVIRONMENT_SITUATION_DIGEST_SCHEMA =
  "helix.environment_situation_digest.v1" as const;
export const HELIX_ENVIRONMENT_SITUATION_DIGEST_OBSERVATION_SCHEMA =
  "helix.environment_situation_digest_observation.v1" as const;

export const HELIX_MINECRAFT_SITUATION_DIGEST_READ_CAPABILITY =
  "com.casimirbot.minecraft.situation_digest.read" as const;

export const HELIX_ENVIRONMENT_EVENT_PRODUCER_PLANES = [
  "world_authority",
  "player_embodiment",
] as const;

export const HELIX_MINECRAFT_EVENT_TYPES = [
  "actor.joined",
  "actor.left",
  "actor.damaged",
  "actor.died",
  "actor.respawned",
  "actor.dimension_changed",
  "actor.position_changed",
  "inventory.item_picked_up",
  "inventory.item_dropped",
  "inventory.item_crafted",
  "inventory.item_smelted",
  "inventory.item_equipped",
  "world.block_broken",
  "world.block_placed",
  "world.entity_interacted",
  "world.entity_attacked",
  "container.opened",
  "container.closed",
  "advancement.completed",
  "workflow.started",
  "workflow.progress",
  "workflow.completed",
  "workflow.succeeded",
  "workflow.failed",
  "workflow.canceled",
  "workflow.timed_out",
  "workflow.resumed",
  "workflow.manual_override_detected",
  "workflow.manual_override",
  "workflow.emergency_stopped",
  "resident.decision",
] as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/);
const timestampSchema = z.string().datetime({ offset: true });
const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/);

export const helixEnvironmentEventSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_EVENT_SCHEMA),
    event_id: identifierSchema,
    sequence: z.number().int().nonnegative(),
    event_type: z.string().trim().min(1).max(160),
    domain: identifierSchema,
    domain_adapter: identifierSchema,
    room_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    producer_epoch_ref: identifierSchema,
    producer_plane: z.enum(HELIX_ENVIRONMENT_EVENT_PRODUCER_PLANES),
    subject_ref: identifierSchema.nullable(),
    workflow_ref: identifierSchema.nullable(),
    summary: z.string().trim().min(1).max(2_000),
    attributes: z.record(z.string(), z.unknown()),
    evidence_refs: z.array(identifierSchema).max(128),
    occurred_at: timestampSchema,
    observed_at: timestampSchema,
    provenance: z.enum(["measured", "reported", "derived"]),
    raw_event_included: z.literal(false),
    content_role: z.literal("environment_event_not_assistant_answer"),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentEvent = z.infer<
  typeof helixEnvironmentEventSchema
>;

export const helixEnvironmentEventBatchSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_EVENT_BATCH_SCHEMA),
    batch_id: identifierSchema,
    room_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    producer_epoch_ref: identifierSchema,
    producer_plane: z.enum(HELIX_ENVIRONMENT_EVENT_PRODUCER_PLANES),
    first_sequence: z.number().int().nonnegative(),
    last_sequence: z.number().int().nonnegative(),
    events: z.array(helixEnvironmentEventSchema).min(1).max(512),
    batch_hash: sha256Schema,
    created_at: timestampSchema,
    content_role: z.literal("environment_event_batch_not_assistant_answer"),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((batch, context) => {
    if (batch.first_sequence > batch.last_sequence) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["first_sequence"],
        message: "The first event sequence cannot exceed the last sequence.",
      });
    }
    const sequences = batch.events.map((event) => event.sequence);
    if (
      sequences[0] !== batch.first_sequence ||
      sequences[sequences.length - 1] !== batch.last_sequence
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["events"],
        message: "Batch sequence bounds must match the first and last event.",
      });
    }
    for (let index = 1; index < sequences.length; index += 1) {
      if (sequences[index] !== sequences[index - 1] + 1) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["events", index, "sequence"],
          message: "Environment event batches must be ordered and contiguous.",
        });
      }
    }
    batch.events.forEach((event, index) => {
      const identityMatches =
        event.room_id === batch.room_id &&
        event.source_id === batch.source_id &&
        event.world_id === batch.world_id &&
        event.producer_epoch_ref === batch.producer_epoch_ref &&
        event.producer_plane === batch.producer_plane;
      if (!identityMatches) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["events", index],
          message: "Every event must match its batch producer identity.",
        });
      }
    });
  });

export type HelixEnvironmentEventBatch = z.infer<
  typeof helixEnvironmentEventBatchSchema
>;

export const helixEnvironmentSituationDigestSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_SITUATION_DIGEST_SCHEMA),
    digest_id: identifierSchema,
    room_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    producer_epoch_ref: identifierSchema,
    producer_plane: z.enum(HELIX_ENVIRONMENT_EVENT_PRODUCER_PLANES),
    subject_ref: identifierSchema.nullable(),
    window_started_at: timestampSchema,
    window_ended_at: timestampSchema,
    latest_event_sequence: z.number().int().nonnegative(),
    event_counts: z.record(z.string(), z.number().int().nonnegative()),
    latest_event_refs: z.array(identifierSchema).max(128),
    situation: z
      .object({
        actor: z.record(z.string(), z.unknown()).nullable(),
        inventory: z.record(z.string(), z.unknown()).nullable(),
        hazards: z.record(z.string(), z.unknown()).nullable(),
        focus: z.record(z.string(), z.unknown()).nullable(),
        active_workflow: z.record(z.string(), z.unknown()).nullable(),
      })
      .strict(),
    changed_fields: z.array(z.string().trim().min(1).max(320)).max(256),
    derived_from_event_refs: z.array(identifierSchema).max(1_024),
    derived_from_snapshot_refs: z.array(identifierSchema).max(128),
    digest_hash: sha256Schema,
    observed_at: timestampSchema,
    provenance_valid: z.boolean(),
    raw_events_included: z.literal(false),
    content_role: z.literal("environment_situation_digest_not_assistant_answer"),
    reentry_required: z.literal(true),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((digest, context) => {
    if (Date.parse(digest.window_started_at) > Date.parse(digest.window_ended_at)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["window_started_at"],
        message: "Situation digest windows must be ordered.",
      });
    }
    if (
      digest.latest_event_refs.some(
        (reference) => !digest.derived_from_event_refs.includes(reference),
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["latest_event_refs"],
        message: "Latest event references must remain in the digest provenance set.",
      });
    }
  });

export type HelixEnvironmentSituationDigest = z.infer<
  typeof helixEnvironmentSituationDigestSchema
>;

export const helixEnvironmentSituationDigestObservationSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_SITUATION_DIGEST_OBSERVATION_SCHEMA),
    outcome: z.enum([
      "fresh",
      "stale",
      "unavailable",
      "wrong_environment",
      "subject_binding_required",
      "forbidden",
      "integrity_failed",
    ]),
    summary: z.string().trim().min(1).max(2_000),
    digest: helixEnvironmentSituationDigestSchema.nullable(),
    evidence_ref: identifierSchema,
    observed_at: timestampSchema,
    provenance_valid: z.boolean(),
    eligible_for_current_turn_reentry: z.boolean(),
    content_role: z.literal(
      "environment_situation_digest_observation_not_assistant_answer",
    ),
    reentry_required: z.literal(true),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((observation, context) => {
    const successful = observation.outcome === "fresh";
    if (
      successful !== Boolean(observation.digest) ||
      successful !== observation.provenance_valid ||
      successful !== observation.eligible_for_current_turn_reentry
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["outcome"],
        message:
          "Only a fresh, provenance-valid digest is eligible for current-turn re-entry.",
      });
    }
  });

export type HelixEnvironmentSituationDigestObservation = z.infer<
  typeof helixEnvironmentSituationDigestObservationSchema
>;
