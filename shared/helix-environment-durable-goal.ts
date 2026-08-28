import crypto from "node:crypto";
import { z } from "zod";

export const HELIX_ENVIRONMENT_DURABLE_GOAL_SCHEMA =
  "helix.environment_durable_goal.v1" as const;
export const HELIX_ENVIRONMENT_DURABLE_GOAL_EVENT_SCHEMA =
  "helix.environment_durable_goal_event.v1" as const;
export const HELIX_ENVIRONMENT_DURABLE_GOAL_PROJECTION_SCHEMA =
  "helix.environment_durable_goal_projection.v1" as const;
export const HELIX_ENVIRONMENT_DURABLE_GOAL_CREATE_CAPABILITY =
  "com.casimirbot.environment.durable_goal.create" as const;
export const HELIX_ENVIRONMENT_DURABLE_GOAL_INSPECT_CAPABILITY =
  "com.casimirbot.environment.durable_goal.inspect" as const;
export const HELIX_ENVIRONMENT_DURABLE_GOAL_APPEND_CAPABILITY =
  "com.casimirbot.environment.durable_goal.append" as const;

export const HELIX_ENVIRONMENT_DURABLE_GOAL_EVENT_KINDS = [
  "goal_created",
  "strategy_revised",
  "milestone_activated",
  "attempt_started",
  "attempt_settled",
  "semantic_wake_consumed",
  "checkpoint_verified",
  "milestone_completed",
  "recovery_required",
  "authority_rebound",
  "goal_paused",
  "goal_resumed",
  "goal_completed",
  "goal_canceled",
] as const;

export const HELIX_ENVIRONMENT_DURABLE_GOAL_STATUSES = [
  "active",
  "paused",
  "recovery_required",
  "blocked",
  "completed",
  "canceled",
] as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/u);
const timestampSchema = z.string().datetime({ offset: true });
const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/u);
const boundedTextSchema = z.string().trim().min(1).max(4_000);
const evidenceRefsSchema = z.array(identifierSchema).max(256);

export const helixEnvironmentDurableGoalMilestoneSchema = z
  .object({
    milestone_id: identifierSchema,
    description: boundedTextSchema,
    dependency_milestone_ids: z.array(identifierSchema).max(64),
    required_postcondition_ids: z.array(identifierSchema).min(1).max(128),
  })
  .strict();

const minecraftDurableGoalObjectiveSchema = z
  .object({
    objective_text: boundedTextSchema,
    goal_kind: z.enum(["all_advancements_survival", "custom_survival"]),
    domain: z.literal("minecraft"),
    game_version: z.string().trim().min(1).max(80),
    mechanics_collection_ref: identifierSchema.nullable(),
    milestones: z
      .array(helixEnvironmentDurableGoalMilestoneSchema)
      .min(1)
      .max(256),
  })
  .strict();

const brokerageDurableGoalObjectiveSchema = z
  .object({
    objective_text: boundedTextSchema,
    goal_kind: z.literal("robinhood_shadow_observation"),
    domain: z.literal("brokerage"),
    provider: z.literal("robinhood"),
    controller_profile_id: z.literal("resident.brokerage.market_observer.v1"),
    reaction_requirement: z.literal("monitor_only"),
    milestones: z
      .array(helixEnvironmentDurableGoalMilestoneSchema)
      .min(1)
      .max(256),
  })
  .strict();

export const helixEnvironmentDurableGoalObjectiveSchema = z
  .discriminatedUnion("domain", [
    minecraftDurableGoalObjectiveSchema,
    brokerageDurableGoalObjectiveSchema,
  ])
  .superRefine((objective, context) => {
    const ids = new Set(objective.milestones.map((entry) => entry.milestone_id));
    if (ids.size !== objective.milestones.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["milestones"],
        message: "Durable goal milestone IDs must be unique.",
      });
    }
    objective.milestones.forEach((milestone, index) => {
      milestone.dependency_milestone_ids.forEach((dependency) => {
        if (!ids.has(dependency) || dependency === milestone.milestone_id) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["milestones", index, "dependency_milestone_ids"],
            message: "Milestone dependencies must name a different declared milestone.",
          });
        }
      });
    });
  });

export const helixEnvironmentDurableGoalIdentitySchema = z
  .object({
    owner_profile_id: identifierSchema,
    host_ref: identifierSchema,
    connector_installation_id: identifierSchema,
    device_id: identifierSchema,
    environment_binding_id: identifierSchema,
    room_source_binding_id: identifierSchema,
    room_id: identifierSchema,
    goal_owner_participant_id: identifierSchema,
    participant_id: identifierSchema,
    authority_participant_id: identifierSchema,
    subject_binding_id: identifierSchema,
    subject_native_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    producer_epoch_ref: identifierSchema,
    action_authority_id: identifierSchema,
    authority_policy_version: z.number().int().positive(),
    authority_expires_at: timestampSchema,
    run_id: identifierSchema.nullable(),
    turn_id: identifierSchema,
  })
  .strict();

const postconditionResultSchema = z
  .object({
    postcondition_id: identifierSchema,
    status: z.enum(["satisfied", "unsatisfied", "unknown"]),
    evidence_refs: evidenceRefsSchema,
  })
  .strict();

export const helixEnvironmentDurableGoalEventPayloadSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("goal_created"),
    objective: helixEnvironmentDurableGoalObjectiveSchema,
  }).strict(),
  z.object({
    kind: z.literal("strategy_revised"),
    strategy_summary: boundedTextSchema,
    candidate_milestone_ids: z.array(identifierSchema).max(64),
    supersedes_strategy_event_id: identifierSchema.nullable(),
  }).strict(),
  z.object({
    kind: z.literal("milestone_activated"),
    milestone_id: identifierSchema,
    rationale: boundedTextSchema,
  }).strict(),
  z.object({
    kind: z.literal("attempt_started"),
    attempt_id: identifierSchema,
    milestone_id: identifierSchema,
    plan_summary: boundedTextSchema,
    capability_ids: z.array(identifierSchema).min(1).max(64),
  }).strict(),
  z.object({
    kind: z.literal("attempt_settled"),
    attempt_id: identifierSchema,
    milestone_id: identifierSchema,
    outcome: z.enum(["succeeded", "failed", "canceled", "interrupted"]),
    postconditions: z.array(postconditionResultSchema).max(128),
    failure_code: identifierSchema.nullable(),
  }).strict(),
  z.object({
    kind: z.literal("semantic_wake_consumed"),
    mail_refs: z.array(identifierSchema).min(1).max(64),
    digest_refs: z.array(identifierSchema).min(1).max(64),
    observation_revision: z.number().int().nonnegative(),
    material_change_summary: boundedTextSchema,
  }).strict(),
  z.object({
    kind: z.literal("checkpoint_verified"),
    checkpoint_id: identifierSchema,
    milestone_id: identifierSchema.nullable(),
    observation_revision: z.number().int().nonnegative(),
    verified_facts: z.record(z.string(), z.unknown()),
    completed_postcondition_ids: z.array(identifierSchema).max(128),
    incomplete_postcondition_ids: z.array(identifierSchema).max(128),
    checkpoint_evidence_hash: sha256Schema,
  }).strict(),
  z.object({
    kind: z.literal("milestone_completed"),
    milestone_id: identifierSchema,
    completed_postcondition_ids: z.array(identifierSchema).min(1).max(128),
  }).strict(),
  z.object({
    kind: z.literal("recovery_required"),
    reason: z.enum([
      "disconnect",
      "death",
      "fabric_restart",
      "helix_restart",
      "authority_expired",
      "authority_revoked",
      "connector_epoch_changed",
      "world_changed",
      "subject_changed",
      "manual_override",
      "emergency_stop",
      "postcondition_failed",
    ]),
    last_recoverable_checkpoint_id: identifierSchema.nullable(),
  }).strict(),
  z.object({
    kind: z.literal("authority_rebound"),
    superseded_producer_epoch_ref: identifierSchema,
    fresh_observation_revision: z.number().int().nonnegative(),
  }).strict(),
  z.object({
    kind: z.literal("goal_paused"),
    reason: boundedTextSchema,
  }).strict(),
  z.object({
    kind: z.literal("goal_resumed"),
    recovery_checkpoint_id: identifierSchema,
  }).strict(),
  z.object({
    kind: z.literal("goal_completed"),
    completed_milestone_ids: z.array(identifierSchema).min(1).max(256),
  }).strict(),
  z.object({
    kind: z.literal("goal_canceled"),
    reason: boundedTextSchema,
  }).strict(),
]);

export const helixEnvironmentDurableGoalEventSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_DURABLE_GOAL_EVENT_SCHEMA),
    event_id: identifierSchema,
    goal_id: identifierSchema,
    sequence: z.number().int().positive(),
    previous_event_hash: sha256Schema.nullable(),
    identity: helixEnvironmentDurableGoalIdentitySchema,
    payload: helixEnvironmentDurableGoalEventPayloadSchema,
    evidence_refs: evidenceRefsSchema,
    occurred_at: timestampSchema,
    event_hash: sha256Schema,
    content_role: z.literal("environment_durable_goal_event_not_assistant_answer"),
    reentry_required: z.literal(true),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentDurableGoalEvent = z.infer<
  typeof helixEnvironmentDurableGoalEventSchema
>;
export type HelixEnvironmentDurableGoalEventPayload = z.infer<
  typeof helixEnvironmentDurableGoalEventPayloadSchema
>;

export const helixEnvironmentDurableGoalCreateRequestSchema = z.object({
  action_authority_id: identifierSchema,
  subject_native_id: identifierSchema,
  run_id: identifierSchema.nullable().optional(),
  turn_id: identifierSchema,
  objective: helixEnvironmentDurableGoalObjectiveSchema,
}).strict();

export const helixEnvironmentDurableGoalAppendRequestSchema = z.object({
  action_authority_id: identifierSchema,
  subject_native_id: identifierSchema,
  run_id: identifierSchema.nullable().optional(),
  turn_id: identifierSchema,
  expected_revision: z.number().int().positive(),
  payload: helixEnvironmentDurableGoalEventPayloadSchema,
  evidence_refs: evidenceRefsSchema,
}).strict();

export const helixEnvironmentDurableGoalParticipantGrantSchema = z.object({
  scopes: z.array(z.enum(["read", "steer"])).min(1).max(2),
}).strict();
export type HelixEnvironmentDurableGoalIdentity = z.infer<
  typeof helixEnvironmentDurableGoalIdentitySchema
>;
export type HelixEnvironmentDurableGoalObjective = z.infer<
  typeof helixEnvironmentDurableGoalObjectiveSchema
>;

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, stableValue(nested)]),
  );
};

export const helixEnvironmentDurableGoalSha256 = (value: unknown): string =>
  `sha256:${crypto
    .createHash("sha256")
    .update(JSON.stringify(stableValue(value)), "utf8")
    .digest("hex")}`;

export const environmentDurableGoalEventContent = (
  event: Omit<HelixEnvironmentDurableGoalEvent, "event_hash">,
): Omit<HelixEnvironmentDurableGoalEvent, "event_hash"> => event;

export const buildHelixEnvironmentDurableGoalEvent = (input: {
  event_id: string;
  goal_id: string;
  sequence: number;
  previous_event_hash: string | null;
  identity: HelixEnvironmentDurableGoalIdentity;
  payload: HelixEnvironmentDurableGoalEventPayload;
  evidence_refs: string[];
  occurred_at: string;
}): HelixEnvironmentDurableGoalEvent => {
  const withoutHash = {
    schema: HELIX_ENVIRONMENT_DURABLE_GOAL_EVENT_SCHEMA,
    ...input,
    content_role: "environment_durable_goal_event_not_assistant_answer" as const,
    reentry_required: true as const,
    answer_authority: false as const,
    assistant_answer: false as const,
    terminal_eligible: false as const,
    raw_content_included: false as const,
  };
  return helixEnvironmentDurableGoalEventSchema.parse({
    ...withoutHash,
    event_hash: helixEnvironmentDurableGoalSha256(withoutHash),
  });
};

export type HelixEnvironmentDurableGoalMilestoneProjection = {
  milestone_id: string;
  description: string;
  status: "candidate" | "active" | "completed" | "blocked";
  required_postcondition_ids: string[];
  completed_postcondition_ids: string[];
};

export type HelixEnvironmentDurableGoalAttemptProjection = {
  attempt_id: string;
  milestone_id: string;
  status: "running" | "succeeded" | "failed" | "canceled" | "interrupted";
  started_event_id: string;
  settled_event_id: string | null;
  evidence_refs: string[];
  failure_code: string | null;
};

export type HelixEnvironmentDurableGoalProjection = {
  schema: typeof HELIX_ENVIRONMENT_DURABLE_GOAL_PROJECTION_SCHEMA;
  goal_id: string;
  revision: number;
  latest_event_hash: string;
  status: (typeof HELIX_ENVIRONMENT_DURABLE_GOAL_STATUSES)[number];
  objective: HelixEnvironmentDurableGoalObjective;
  identity: HelixEnvironmentDurableGoalIdentity;
  active_milestone_id: string | null;
  milestones: HelixEnvironmentDurableGoalMilestoneProjection[];
  recent_attempts: HelixEnvironmentDurableGoalAttemptProjection[];
  attempt_count: number;
  latest_checkpoint: {
    checkpoint_id: string;
    event_id: string;
    observation_revision: number;
    verified_facts: Record<string, unknown>;
    evidence_refs: string[];
  } | null;
  recovery: {
    required: boolean;
    reason: string | null;
    rebound_event_id: string | null;
  };
  consumed_semantic_wake_refs: string[];
  event_refs: string[];
  content_role: "environment_durable_goal_projection_not_assistant_answer";
  reentry_required: true;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export class HelixEnvironmentDurableGoalReductionError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "HelixEnvironmentDurableGoalReductionError";
  }
}

const stableGoalIdentity = (identity: HelixEnvironmentDurableGoalIdentity) => ({
  owner_profile_id: identity.owner_profile_id,
  room_source_binding_id: identity.room_source_binding_id,
  room_id: identity.room_id,
  subject_native_id: identity.subject_native_id,
  goal_owner_participant_id: identity.goal_owner_participant_id,
  source_id: identity.source_id,
  world_id: identity.world_id,
});

const equalStableIdentity = (
  left: HelixEnvironmentDurableGoalIdentity,
  right: HelixEnvironmentDurableGoalIdentity,
): boolean =>
  helixEnvironmentDurableGoalSha256(stableGoalIdentity(left)) ===
  helixEnvironmentDurableGoalSha256(stableGoalIdentity(right));

export const reduceHelixEnvironmentDurableGoalEvents = (
  suppliedEvents: HelixEnvironmentDurableGoalEvent[],
): HelixEnvironmentDurableGoalProjection => {
  if (suppliedEvents.length === 0) {
    throw new HelixEnvironmentDurableGoalReductionError(
      "durable_goal_event_stream_empty",
      "A durable goal projection requires at least one event.",
    );
  }
  const events = suppliedEvents.map((entry) =>
    helixEnvironmentDurableGoalEventSchema.parse(entry));
  const first = events[0];
  if (first.sequence !== 1 || first.previous_event_hash !== null || first.payload.kind !== "goal_created") {
    throw new HelixEnvironmentDurableGoalReductionError(
      "durable_goal_genesis_invalid",
      "The first durable goal event must be sequence 1 goal_created with no predecessor.",
    );
  }

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const { event_hash: suppliedHash, ...withoutHash } = event;
    if (helixEnvironmentDurableGoalSha256(withoutHash) !== suppliedHash) {
      throw new HelixEnvironmentDurableGoalReductionError(
        "durable_goal_event_hash_invalid",
        `Durable goal event ${event.event_id} failed its content hash.`,
      );
    }
    if (event.goal_id !== first.goal_id || !equalStableIdentity(first.identity, event.identity)) {
      throw new HelixEnvironmentDurableGoalReductionError(
        "durable_goal_identity_mismatch",
        `Durable goal event ${event.event_id} changed the stable goal identity.`,
      );
    }
    if (index > 0) {
      const previous = events[index - 1];
      if (event.sequence !== previous.sequence + 1 || event.previous_event_hash !== previous.event_hash) {
        throw new HelixEnvironmentDurableGoalReductionError(
          "durable_goal_event_chain_invalid",
          `Durable goal event ${event.event_id} is not the next hash-linked event.`,
        );
      }
    }
  }

  const objective = first.payload.objective;
  const milestones = new Map<string, HelixEnvironmentDurableGoalMilestoneProjection>(
    objective.milestones.map((milestone) => [milestone.milestone_id, {
      milestone_id: milestone.milestone_id,
      description: milestone.description,
      status: "candidate",
      required_postcondition_ids: [...milestone.required_postcondition_ids],
      completed_postcondition_ids: [],
    }]),
  );
  const attempts = new Map<string, HelixEnvironmentDurableGoalAttemptProjection>();
  let status: HelixEnvironmentDurableGoalProjection["status"] = "active";
  let activeMilestoneId: string | null = null;
  let latestCheckpoint: HelixEnvironmentDurableGoalProjection["latest_checkpoint"] = null;
  let recovery: HelixEnvironmentDurableGoalProjection["recovery"] = {
    required: false,
    reason: null,
    rebound_event_id: null,
  };
  const semanticWakeRefs = new Set<string>();
  let currentIdentity = first.identity;

  for (const event of events.slice(1)) {
    const epochChanged =
      event.identity.producer_epoch_ref !== currentIdentity.producer_epoch_ref ||
      event.identity.action_authority_id !== currentIdentity.action_authority_id ||
      event.identity.authority_policy_version !== currentIdentity.authority_policy_version ||
      event.identity.device_id !== currentIdentity.device_id ||
      event.identity.connector_installation_id !== currentIdentity.connector_installation_id;
    if (epochChanged && event.payload.kind !== "authority_rebound" && event.payload.kind !== "recovery_required") {
      throw new HelixEnvironmentDurableGoalReductionError(
        "durable_goal_rebind_required",
        `Durable goal event ${event.event_id} changed runtime identity without an authority rebound.`,
      );
    }

    switch (event.payload.kind) {
      case "milestone_activated": {
        const milestone = milestones.get(event.payload.milestone_id);
        if (!milestone) throw new HelixEnvironmentDurableGoalReductionError("durable_goal_milestone_unknown", "The activated milestone is not declared.");
        const source = objective.milestones.find((entry) => entry.milestone_id === milestone.milestone_id)!;
        if (source.dependency_milestone_ids.some((id) => milestones.get(id)?.status !== "completed")) {
          throw new HelixEnvironmentDurableGoalReductionError("durable_goal_milestone_dependencies_incomplete", "The activated milestone has incomplete dependencies.");
        }
        if (activeMilestoneId && milestones.get(activeMilestoneId)?.status === "active") {
          milestones.get(activeMilestoneId)!.status = "candidate";
        }
        milestone.status = "active";
        activeMilestoneId = milestone.milestone_id;
        break;
      }
      case "attempt_started": {
        if (status !== "active" || recovery.required) {
          throw new HelixEnvironmentDurableGoalReductionError("durable_goal_attempt_not_admitted", "An attempt cannot start while the goal is paused or recovering.");
        }
        if (attempts.has(event.payload.attempt_id) || event.payload.milestone_id !== activeMilestoneId) {
          throw new HelixEnvironmentDurableGoalReductionError("durable_goal_attempt_identity_invalid", "The attempt must be new and target the active milestone.");
        }
        attempts.set(event.payload.attempt_id, {
          attempt_id: event.payload.attempt_id,
          milestone_id: event.payload.milestone_id,
          status: "running",
          started_event_id: event.event_id,
          settled_event_id: null,
          evidence_refs: [...event.evidence_refs],
          failure_code: null,
        });
        break;
      }
      case "attempt_settled": {
        const attempt = attempts.get(event.payload.attempt_id);
        if (!attempt || attempt.status !== "running" || attempt.milestone_id !== event.payload.milestone_id) {
          throw new HelixEnvironmentDurableGoalReductionError("durable_goal_attempt_settlement_invalid", "Only the matching running attempt may settle.");
        }
        attempt.status = event.payload.outcome;
        attempt.settled_event_id = event.event_id;
        attempt.evidence_refs = [...new Set([...attempt.evidence_refs, ...event.evidence_refs])];
        attempt.failure_code = event.payload.failure_code;
        break;
      }
      case "semantic_wake_consumed": {
        const claimedRefs = [...new Set([
          ...event.payload.mail_refs,
          ...event.payload.digest_refs,
        ])];
        if (
          claimedRefs.length === 0 ||
          claimedRefs.some((ref) => !event.evidence_refs.includes(ref)) ||
          event.evidence_refs.some((ref) => !claimedRefs.includes(ref)) ||
          claimedRefs.some((ref) => semanticWakeRefs.has(ref))
        ) {
          throw new HelixEnvironmentDurableGoalReductionError(
            "durable_goal_semantic_wake_invalid",
            "Semantic wake consumption requires one exact, previously unconsumed mail/digest evidence set.",
          );
        }
        claimedRefs.forEach((ref) => semanticWakeRefs.add(ref));
        break;
      }
      case "checkpoint_verified": {
        if (event.evidence_refs.length === 0) {
          throw new HelixEnvironmentDurableGoalReductionError("durable_goal_checkpoint_evidence_missing", "A verified checkpoint requires evidence references.");
        }
        if (latestCheckpoint && event.payload.observation_revision <= latestCheckpoint.observation_revision) {
          throw new HelixEnvironmentDurableGoalReductionError("durable_goal_checkpoint_revision_regressed", "Checkpoint observation revisions must increase.");
        }
        if (event.payload.milestone_id) {
          const milestone = milestones.get(event.payload.milestone_id);
          if (!milestone) throw new HelixEnvironmentDurableGoalReductionError("durable_goal_milestone_unknown", "The checkpoint milestone is not declared.");
          milestone.completed_postcondition_ids = [...new Set([
            ...milestone.completed_postcondition_ids,
            ...event.payload.completed_postcondition_ids.filter((id) => milestone.required_postcondition_ids.includes(id)),
          ])];
        }
        latestCheckpoint = {
          checkpoint_id: event.payload.checkpoint_id,
          event_id: event.event_id,
          observation_revision: event.payload.observation_revision,
          verified_facts: event.payload.verified_facts,
          evidence_refs: [...event.evidence_refs],
        };
        break;
      }
      case "milestone_completed": {
        const milestone = milestones.get(event.payload.milestone_id);
        if (!milestone) throw new HelixEnvironmentDurableGoalReductionError("durable_goal_milestone_unknown", "The completed milestone is not declared.");
        const completed = new Set(milestone.completed_postcondition_ids);
        if (
          event.payload.completed_postcondition_ids.some((id) => !completed.has(id)) ||
          milestone.required_postcondition_ids.some((id) => !completed.has(id)) ||
          event.evidence_refs.length === 0
        ) {
          throw new HelixEnvironmentDurableGoalReductionError("durable_goal_milestone_evidence_incomplete", "Every required milestone postcondition needs verified evidence before completion.");
        }
        milestone.status = "completed";
        if (activeMilestoneId === milestone.milestone_id) activeMilestoneId = null;
        break;
      }
      case "recovery_required":
        status = "recovery_required";
        recovery = { required: true, reason: event.payload.reason, rebound_event_id: null };
        break;
      case "authority_rebound":
        if (!recovery.required || event.payload.superseded_producer_epoch_ref !== currentIdentity.producer_epoch_ref || event.evidence_refs.length === 0) {
          throw new HelixEnvironmentDurableGoalReductionError("durable_goal_authority_rebound_invalid", "Authority rebound requires recovery, the prior epoch, and fresh evidence.");
        }
        currentIdentity = event.identity;
        recovery = { ...recovery, rebound_event_id: event.event_id };
        break;
      case "goal_paused":
        status = "paused";
        break;
      case "goal_resumed":
        if (recovery.required && (!latestCheckpoint || event.payload.recovery_checkpoint_id !== latestCheckpoint.checkpoint_id || !recovery.rebound_event_id)) {
          throw new HelixEnvironmentDurableGoalReductionError("durable_goal_resume_evidence_invalid", "Recovery resume requires the latest verified checkpoint and a fresh authority rebound.");
        }
        status = "active";
        recovery = { required: false, reason: null, rebound_event_id: recovery.rebound_event_id };
        break;
      case "goal_completed": {
        const completed = new Set(event.payload.completed_milestone_ids);
        if (milestones.size !== completed.size || [...milestones.values()].some((milestone) => milestone.status !== "completed" || !completed.has(milestone.milestone_id)) || event.evidence_refs.length === 0) {
          throw new HelixEnvironmentDurableGoalReductionError("durable_goal_completion_unsupported", "Goal completion requires every declared milestone and current evidence.");
        }
        status = "completed";
        break;
      }
      case "goal_canceled":
        status = "canceled";
        break;
      case "strategy_revised":
      case "goal_created":
        break;
    }
    currentIdentity = event.identity;
  }

  const latest = events[events.length - 1];
  return {
    schema: HELIX_ENVIRONMENT_DURABLE_GOAL_PROJECTION_SCHEMA,
    goal_id: first.goal_id,
    revision: latest.sequence,
    latest_event_hash: latest.event_hash,
    status,
    objective,
    identity: currentIdentity,
    active_milestone_id: activeMilestoneId,
    milestones: [...milestones.values()],
    recent_attempts: [...attempts.values()].slice(-32),
    attempt_count: attempts.size,
    latest_checkpoint: latestCheckpoint,
    recovery,
    consumed_semantic_wake_refs: [...semanticWakeRefs].slice(-128),
    event_refs: events.map((event) => event.event_id),
    content_role: "environment_durable_goal_projection_not_assistant_answer",
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
