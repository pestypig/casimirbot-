import crypto from "node:crypto";
import { z } from "zod";

export const HELIX_RESIDENT_CONTROLLER_PROFILE_SCHEMA =
  "helix.resident_controller.profile.v1" as const;
export const HELIX_RESIDENT_CONTROLLER_PROPOSAL_SCHEMA =
  "helix.resident_controller.proposal.v1" as const;
export const HELIX_RESIDENT_CONTROLLER_ADMISSION_SCHEMA =
  "helix.resident_controller.admission.v1" as const;
export const HELIX_RESIDENT_CONTROLLER_RECEIPT_SCHEMA =
  "helix.resident_controller.receipt.v1" as const;
export const HELIX_RESIDENT_CONTROLLER_EVENT_SCHEMA =
  "helix.resident_controller.event.v1" as const;
export const HELIX_RESIDENT_CONTROLLER_PROJECTION_SCHEMA =
  "helix.resident_controller.projection.v1" as const;

export const HELIX_RESIDENT_CONTROLLER_STATES = [
  "registered",
  "bound",
  "admitted",
  "active",
  "suspended",
  "releasing",
  "released",
  "invalidated",
] as const;

export const HELIX_RESIDENT_CONTROLLER_OUTCOMES = [
  "completed",
  "abstained",
  "interrupted",
  "canceled",
  "timed_out",
  "lease_expired",
  "manual_override",
  "emergency_stopped",
  "identity_stale",
  "postcondition_failed",
  "resource_budget_exhausted",
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

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, stableValue(nested)]),
  );
};

const boundedRecordSchema = (maxBytes: number) =>
  z.record(z.string(), z.unknown()).superRefine((value, context) => {
    if (Buffer.byteLength(JSON.stringify(stableValue(value)), "utf8") > maxBytes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Structured value exceeds the ${maxBytes}-byte limit.`,
      });
    }
  });

export const helixResidentControllerSha256 = (value: unknown): string =>
  `sha256:${crypto
    .createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex")}`;

export const helixResidentControllerIdentitySchema = z
  .object({
    environment_id: identifierSchema,
    world_id: identifierSchema,
    connector_epoch: identifierSchema,
    actor_id: identifierSchema,
    actor_runtime_id: identifierSchema,
    actor_incarnation_id: identifierSchema,
    controller_profile_id: identifierSchema,
    controller_artifact_hash: sha256Schema,
    owner_account_id: identifierSchema,
    authority_subject_id: identifierSchema,
    beneficiary_subject_id: identifierSchema,
    room_id: identifierSchema.nullable(),
    observation_revision: z.number().int().nonnegative(),
  })
  .strict();

export type HelixResidentControllerIdentity = z.infer<
  typeof helixResidentControllerIdentitySchema
>;

export const helixResidentControllerProfileSchema = z
  .object({
    schema: z.literal(HELIX_RESIDENT_CONTROLLER_PROFILE_SCHEMA),
    controller_profile_id: identifierSchema,
    controller_artifact_hash: sha256Schema,
    domain: identifierSchema,
    response_vocabulary: z.array(identifierSchema).min(1).max(64),
    sensor_vocabulary: z.array(identifierSchema).min(1).max(128),
    resource_vocabulary: z.array(identifierSchema).max(64),
    effect_vocabulary: z.array(identifierSchema).max(64),
    maximum_observation_age_ms: z.number().int().positive().max(60_000),
    reaction_deadline_ms: z.number().int().positive().max(60_000),
    maximum_duration_ms: z.number().int().positive().max(60 * 60_000),
    deterministic_fallback: z.enum(["hold", "release", "abstain"]),
    manual_override_required: z.literal(true),
    emergency_stop_required: z.literal(true),
    model_execution_supported: z.literal(false),
    authority_expansion_supported: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

export type HelixResidentControllerProfile = z.infer<
  typeof helixResidentControllerProfileSchema
>;

export const helixResidentControllerProposalSchema = z
  .object({
    schema: z.literal(HELIX_RESIDENT_CONTROLLER_PROPOSAL_SCHEMA),
    proposal_id: identifierSchema,
    identity: helixResidentControllerIdentitySchema,
    response_kind: identifierSchema,
    arguments: boundedRecordSchema(32 * 1024),
    precondition_refs: evidenceRefsSchema,
    requested_resource_keys: z.array(identifierSchema).max(64),
    requested_effect_keys: z.array(identifierSchema).max(64),
    maximum_effect_count: z.number().int().nonnegative().max(10_000),
    proposed_at: timestampSchema,
    expires_at: timestampSchema,
    proposal_hash: sha256Schema,
    execution_authority: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict()
  .superRefine((proposal, context) => {
    if (Date.parse(proposal.expires_at) <= Date.parse(proposal.proposed_at)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expires_at"],
        message: "Proposal expiry must be after creation.",
      });
    }
  });

export type HelixResidentControllerProposal = z.infer<
  typeof helixResidentControllerProposalSchema
>;

export const buildHelixResidentControllerProposal = (
  input: Omit<
    HelixResidentControllerProposal,
    | "schema"
    | "proposal_hash"
    | "execution_authority"
    | "answer_authority"
    | "assistant_answer"
    | "terminal_eligible"
  >,
): HelixResidentControllerProposal => {
  const base = {
    schema: HELIX_RESIDENT_CONTROLLER_PROPOSAL_SCHEMA,
    ...input,
    execution_authority: false as const,
    answer_authority: false as const,
    assistant_answer: false as const,
    terminal_eligible: false as const,
  };
  return helixResidentControllerProposalSchema.parse({
    ...base,
    proposal_hash: helixResidentControllerSha256(base),
  });
};

export const helixResidentControllerAdmissionSchema = z
  .object({
    schema: z.literal(HELIX_RESIDENT_CONTROLLER_ADMISSION_SCHEMA),
    admission_id: identifierSchema,
    proposal_id: identifierSchema,
    proposal_hash: sha256Schema,
    identity: helixResidentControllerIdentitySchema,
    actor_lease_id: identifierSchema,
    effect_lease_id: identifierSchema,
    admitted_resource_keys: z.array(identifierSchema).max(64),
    admitted_effect_keys: z.array(identifierSchema).max(64),
    maximum_effect_count: z.number().int().nonnegative().max(10_000),
    admitted_at: timestampSchema,
    expires_at: timestampSchema,
    automatic_replay: z.literal(false),
    serialized_execution_required: z.literal(true),
    manual_override_required: z.literal(true),
    emergency_stop_required: z.literal(true),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict()
  .superRefine((admission, context) => {
    if (Date.parse(admission.expires_at) <= Date.parse(admission.admitted_at)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expires_at"],
        message: "Admission expiry must be after admission.",
      });
    }
  });

export type HelixResidentControllerAdmission = z.infer<
  typeof helixResidentControllerAdmissionSchema
>;

export const helixResidentControllerReceiptSchema = z
  .object({
    schema: z.literal(HELIX_RESIDENT_CONTROLLER_RECEIPT_SCHEMA),
    receipt_id: identifierSchema,
    proposal_id: identifierSchema,
    admission_id: identifierSchema,
    identity: helixResidentControllerIdentitySchema,
    actor_lease_id: identifierSchema,
    effect_lease_id: identifierSchema,
    outcome: z.enum(HELIX_RESIDENT_CONTROLLER_OUTCOMES),
    started_at: timestampSchema,
    settled_at: timestampSchema,
    start_observation_revision: z.number().int().nonnegative(),
    end_observation_revision: z.number().int().nonnegative(),
    effects_committed: z.number().int().nonnegative().max(10_000),
    measurements: boundedRecordSchema(64 * 1024),
    evidence_refs: evidenceRefsSchema,
    controls_released: z.literal(true),
    resources_released: z.literal(true),
    leases_replayable: z.literal(false),
    credential_included: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict()
  .superRefine((receipt, context) => {
    if (Date.parse(receipt.settled_at) < Date.parse(receipt.started_at)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["settled_at"],
        message: "Receipt settlement cannot predate execution.",
      });
    }
    if (receipt.end_observation_revision < receipt.start_observation_revision) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_observation_revision"],
        message: "Receipt observation revision cannot regress.",
      });
    }
  });

export type HelixResidentControllerReceipt = z.infer<
  typeof helixResidentControllerReceiptSchema
>;

const eventPayloadSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("registered") }).strict(),
  z.object({ kind: z.literal("bound") }).strict(),
  z.object({ kind: z.literal("admitted"), admission_id: identifierSchema }).strict(),
  z.object({ kind: z.literal("activated"), admission_id: identifierSchema }).strict(),
  z.object({ kind: z.literal("suspended"), reason: boundedTextSchema }).strict(),
  z.object({ kind: z.literal("resumed"), admission_id: identifierSchema }).strict(),
  z.object({ kind: z.literal("release_started"), reason: boundedTextSchema }).strict(),
  z.object({ kind: z.literal("released"), receipt_id: identifierSchema }).strict(),
  z.object({ kind: z.literal("invalidated"), reason: boundedTextSchema }).strict(),
]);

export const helixResidentControllerEventSchema = z
  .object({
    schema: z.literal(HELIX_RESIDENT_CONTROLLER_EVENT_SCHEMA),
    event_id: identifierSchema,
    sequence: z.number().int().positive(),
    previous_event_hash: sha256Schema.nullable(),
    identity: helixResidentControllerIdentitySchema,
    payload: eventPayloadSchema,
    occurred_at: timestampSchema,
    event_hash: sha256Schema,
  })
  .strict();

export type HelixResidentControllerEvent = z.infer<
  typeof helixResidentControllerEventSchema
>;

export const buildHelixResidentControllerEvent = (
  input: Omit<HelixResidentControllerEvent, "schema" | "event_hash">,
): HelixResidentControllerEvent => {
  const base = { schema: HELIX_RESIDENT_CONTROLLER_EVENT_SCHEMA, ...input };
  return helixResidentControllerEventSchema.parse({
    ...base,
    event_hash: helixResidentControllerSha256(base),
  });
};

const transitions: Record<
  (typeof HELIX_RESIDENT_CONTROLLER_STATES)[number] | "none",
  Partial<Record<z.infer<typeof eventPayloadSchema>["kind"], (typeof HELIX_RESIDENT_CONTROLLER_STATES)[number]>>
> = {
  none: { registered: "registered" },
  registered: { bound: "bound", invalidated: "invalidated" },
  bound: { admitted: "admitted", invalidated: "invalidated" },
  admitted: { activated: "active", release_started: "releasing", invalidated: "invalidated" },
  active: { suspended: "suspended", release_started: "releasing", invalidated: "invalidated" },
  suspended: { resumed: "active", release_started: "releasing", invalidated: "invalidated" },
  releasing: { released: "released", invalidated: "invalidated" },
  released: {},
  invalidated: {},
};

export class HelixResidentControllerReductionError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "HelixResidentControllerReductionError";
  }
}

export const reduceHelixResidentControllerEvents = (
  suppliedEvents: HelixResidentControllerEvent[],
) => {
  if (suppliedEvents.length === 0) {
    throw new HelixResidentControllerReductionError(
      "resident_controller_events_empty",
      "At least one lifecycle event is required.",
    );
  }
  const events = suppliedEvents.map((event) =>
    helixResidentControllerEventSchema.parse(event),
  );
  const firstIdentity = events[0].identity;
  let state: (typeof HELIX_RESIDENT_CONTROLLER_STATES)[number] | "none" = "none";
  let previousHash: string | null = null;

  for (const [index, event] of events.entries()) {
    if (event.sequence !== index + 1 || event.previous_event_hash !== previousHash) {
      throw new HelixResidentControllerReductionError(
        "resident_controller_event_chain_invalid",
        "Lifecycle events must be contiguous and hash-linked.",
      );
    }
    const { event_hash: suppliedHash, ...withoutHash } = event;
    if (helixResidentControllerSha256(withoutHash) !== suppliedHash) {
      throw new HelixResidentControllerReductionError(
        "resident_controller_event_hash_invalid",
        "Lifecycle event hash does not match its canonical content.",
      );
    }
    const identityKeys = Object.keys(firstIdentity) as Array<keyof typeof firstIdentity>;
    if (identityKeys.some((key) => event.identity[key] !== firstIdentity[key])) {
      throw new HelixResidentControllerReductionError(
        "resident_controller_identity_drift",
        "A lifecycle chain cannot change actor, incarnation, authority, or observation identity.",
      );
    }
    const next = transitions[state][event.payload.kind];
    if (!next) {
      throw new HelixResidentControllerReductionError(
        "resident_controller_transition_invalid",
        `Lifecycle event ${event.payload.kind} is invalid from ${state}.`,
      );
    }
    state = next;
    previousHash = event.event_hash;
  }

  return {
    schema: HELIX_RESIDENT_CONTROLLER_PROJECTION_SCHEMA,
    identity: firstIdentity,
    state,
    revision: events.length,
    latest_event_hash: previousHash!,
    controls_may_be_asserted: state === "active",
    execution_authority: false as const,
    answer_authority: false as const,
    assistant_answer: false as const,
    terminal_eligible: false as const,
  };
};

export const evaluateHelixResidentControllerCurrentness = (input: {
  proposal: HelixResidentControllerProposal;
  currentIdentity: HelixResidentControllerIdentity;
  now: string;
}) => {
  const proposal = helixResidentControllerProposalSchema.parse(input.proposal);
  const current = helixResidentControllerIdentitySchema.parse(input.currentIdentity);
  const mismatches = (Object.keys(current) as Array<keyof typeof current>).filter(
    (key) => proposal.identity[key] !== current[key],
  );
  if (mismatches.length > 0) {
    return { current: false as const, reason: "identity_stale" as const, mismatch_fields: mismatches };
  }
  if (Date.parse(proposal.expires_at) <= Date.parse(input.now)) {
    return { current: false as const, reason: "proposal_expired" as const, mismatch_fields: ["expires_at"] };
  }
  return { current: true as const, reason: "current" as const, mismatch_fields: [] };
};
