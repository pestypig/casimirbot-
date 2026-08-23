import crypto from "node:crypto";
import { z } from "zod";

export const HELIX_ENVIRONMENT_REASONING_ROLE_OUTPUT_SCHEMA =
  "helix.environment_reasoning_role_output.v1" as const;
export const HELIX_ENVIRONMENT_REASONING_ROLE_EVENT_SCHEMA =
  "helix.environment_reasoning_role_event.v1" as const;
export const HELIX_ENVIRONMENT_REASONING_ROLE_PROJECTION_SCHEMA =
  "helix.environment_reasoning_role_projection.v1" as const;
export const HELIX_ENVIRONMENT_REASONING_ROLE_ARBITRATION_SCHEMA =
  "helix.environment_reasoning_role_arbitration.v1" as const;
export const HELIX_ENVIRONMENT_REASONING_ROLE_RECORD_CAPABILITY =
  "com.casimirbot.environment.reasoning_role.record" as const;
export const HELIX_ENVIRONMENT_REASONING_ROLE_INSPECT_CAPABILITY =
  "com.casimirbot.environment.reasoning_role.inspect" as const;
export const HELIX_ENVIRONMENT_REASONING_ROLE_DISPOSITION_CAPABILITY =
  "com.casimirbot.environment.reasoning_role.disposition" as const;
export const HELIX_ENVIRONMENT_REASONING_ROLE_ARBITRATE_CAPABILITY =
  "com.casimirbot.environment.reasoning_role.arbitrate" as const;

export const HELIX_ENVIRONMENT_REASONING_ROLE_KINDS = [
  "perception",
  "prospective_planning",
  "verification",
] as const;

export const HELIX_ENVIRONMENT_REASONING_ROLE_EVENT_KINDS = [
  "role_output_recorded",
  "role_output_invalidated",
  "principal_disposition_recorded",
  "proposal_arbitrated",
  "execution_link_recorded",
  "measured_result_link_recorded",
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

const boundedJsonRecordSchema = (maxBytes: number) =>
  z.record(z.string(), z.unknown()).superRefine((value, context) => {
    if (Buffer.byteLength(JSON.stringify(stableValue(value)), "utf8") > maxBytes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Structured value exceeds the ${maxBytes}-byte limit.`,
      });
    }
  });

export const helixEnvironmentReasoningRoleSha256 = (value: unknown): string =>
  `sha256:${crypto
    .createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex")}`;

export const helixEnvironmentReasoningRoleIdentitySchema = z
  .object({
    owner_profile_id: identifierSchema,
    room_id: identifierSchema,
    participant_id: identifierSchema,
    environment_binding_id: identifierSchema,
    room_source_binding_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    producer_epoch_ref: identifierSchema,
    subject_binding_id: identifierSchema,
    subject_native_id: identifierSchema,
    action_authority_id: identifierSchema,
    authority_policy_version: z.number().int().positive(),
    authority_expires_at: timestampSchema,
    goal_id: identifierSchema,
    goal_revision: z.number().int().positive(),
    observation_revision: z.number().int().nonnegative(),
    principal_turn_id: identifierSchema,
  })
  .strict();

const predictedPostconditionSchema = z
  .object({
    postcondition_id: identifierSchema,
    expected_state: boundedTextSchema,
    verification_capability_ids: z.array(identifierSchema).max(32),
  })
  .strict();

const perceptionChangeSchema = z
  .object({
    change_id: identifierSchema,
    kind: identifierSchema,
    severity: z.enum(["informational", "attention", "urgent"]),
    summary: boundedTextSchema,
    evidence_refs: evidenceRefsSchema.min(1),
  })
  .strict();

export const helixEnvironmentReasoningRolePayloadSchema = z.discriminatedUnion(
  "role_kind",
  [
    z
      .object({
        role_kind: z.literal("perception"),
        summary: boundedTextSchema,
        changes: z.array(perceptionChangeSchema).max(128),
        requested_observation_kinds: z.array(identifierSchema).max(64),
        uncertainty_notes: z.array(boundedTextSchema).max(32),
      })
      .strict(),
    z
      .object({
        role_kind: z.literal("prospective_planning"),
        proposal_id: identifierSchema,
        objective_summary: boundedTextSchema,
        capability_id: identifierSchema.nullable(),
        capability_arguments: boundedJsonRecordSchema(64 * 1024),
        predicted_postconditions: z
          .array(predictedPostconditionSchema)
          .max(128),
        assumptions: z.array(boundedTextSchema).max(64),
        resource_keys: z.array(identifierSchema).max(64),
        confidence: z.number().min(0).max(1),
        abstain: z.boolean(),
      })
      .strict(),
    z
      .object({
        role_kind: z.literal("verification"),
        proposal_id: identifierSchema,
        measured_result_refs: evidenceRefsSchema,
        verdict: z.enum([
          "prediction_supported",
          "prediction_contradicted",
          "insufficient_evidence",
        ]),
        summary: boundedTextSchema,
        recommended_disposition: z.enum([
          "continue",
          "repair",
          "reobserve",
          "invalidate",
        ]),
        unresolved_postcondition_ids: z.array(identifierSchema).max(128),
      })
      .strict(),
  ],
).superRefine((payload, context) => {
  if (payload.role_kind !== "prospective_planning") return;
  if (!payload.abstain && !payload.capability_id) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["capability_id"],
      message: "A non-abstaining proposal requires a capability ID.",
    });
  }
  if (payload.abstain && payload.capability_id) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["capability_id"],
      message: "An abstaining proposal cannot name an executable capability.",
    });
  }
});

export const helixEnvironmentReasoningRoleOutputSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_REASONING_ROLE_OUTPUT_SCHEMA),
    role_output_id: identifierSchema,
    identity: helixEnvironmentReasoningRoleIdentitySchema,
    producer: z
      .object({
        selected_runtime_provider_id: identifierSchema,
        supporting_provider_id: identifierSchema,
        role_profile_id: identifierSchema,
        role_artifact_version: identifierSchema,
      })
      .strict(),
    input_evidence_refs: evidenceRefsSchema.min(1),
    input_evidence_hash: sha256Schema,
    payload: helixEnvironmentReasoningRolePayloadSchema,
    created_at: timestampSchema,
    expires_at: timestampSchema,
    output_hash: sha256Schema,
    content_role: z.literal(
      "environment_reasoning_role_output_not_assistant_answer",
    ),
    execution_authority: z.literal(false),
    answer_authority: z.literal(false),
    reentry_required: z.literal(true),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((output, context) => {
    if (Date.parse(output.expires_at) <= Date.parse(output.created_at)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expires_at"],
        message: "Role output expiry must be after creation.",
      });
    }
  });

export type HelixEnvironmentReasoningRoleIdentity = z.infer<
  typeof helixEnvironmentReasoningRoleIdentitySchema
>;
export type HelixEnvironmentReasoningRolePayload = z.infer<
  typeof helixEnvironmentReasoningRolePayloadSchema
>;
export type HelixEnvironmentReasoningRoleOutput = z.infer<
  typeof helixEnvironmentReasoningRoleOutputSchema
>;

export const helixEnvironmentReasoningRoleRecordRequestSchema = z
  .object({
    goal_id: identifierSchema,
    expected_goal_revision: z.number().int().positive(),
    expected_ledger_revision: z.number().int().nonnegative(),
    observation_revision: z.number().int().nonnegative(),
    input_evidence_refs: evidenceRefsSchema.min(1),
    payload: helixEnvironmentReasoningRolePayloadSchema,
    expires_in_seconds: z.number().int().min(5).max(600),
  })
  .strict();

export const helixEnvironmentReasoningRoleDispositionRequestSchema = z
  .object({
    goal_id: identifierSchema,
    expected_ledger_revision: z.number().int().positive(),
    role_output_id: identifierSchema,
    disposition: z.enum(["adopted", "revised", "ignored", "rejected"]),
    adopted_capability_id: identifierSchema.nullable(),
    adopted_capability_arguments: boundedJsonRecordSchema(64 * 1024).nullable(),
    rationale_summary: boundedTextSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const adopted = value.disposition === "adopted" || value.disposition === "revised";
    if (adopted && (!value.adopted_capability_id || !value.adopted_capability_arguments)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["adopted_capability_arguments"],
        message: "An adopted or revised output requires the exact capability ID and arguments.",
      });
    }
    if (!adopted && (value.adopted_capability_id || value.adopted_capability_arguments)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["adopted_capability_arguments"],
        message: "An ignored or rejected output cannot retain adopted capability arguments.",
      });
    }
  });

export const helixEnvironmentReasoningRoleArbitrateRequestSchema = z
  .object({
    goal_id: identifierSchema,
    expected_goal_revision: z.number().int().positive(),
    expected_ledger_revision: z.number().int().positive(),
    observation_revision: z.number().int().nonnegative(),
    considered_role_output_ids: z.array(identifierSchema).min(1).max(64),
    selected_role_output_id: identifierSchema.nullable(),
    reason: boundedTextSchema,
  })
  .strict();

const roleOutputContent = (
  output: Omit<HelixEnvironmentReasoningRoleOutput, "output_hash">,
) => output;

export const buildHelixEnvironmentReasoningRoleOutput = (input: {
  roleOutputId: string;
  identity: HelixEnvironmentReasoningRoleIdentity;
  producer: HelixEnvironmentReasoningRoleOutput["producer"];
  inputEvidenceRefs: string[];
  payload: HelixEnvironmentReasoningRolePayload;
  createdAt?: string;
  expiresAt: string;
}): HelixEnvironmentReasoningRoleOutput => {
  const withoutHash = {
    schema: HELIX_ENVIRONMENT_REASONING_ROLE_OUTPUT_SCHEMA,
    role_output_id: input.roleOutputId,
    identity: input.identity,
    producer: input.producer,
    input_evidence_refs: [...new Set(input.inputEvidenceRefs)],
    input_evidence_hash: helixEnvironmentReasoningRoleSha256(
      [...new Set(input.inputEvidenceRefs)].sort(),
    ),
    payload: input.payload,
    created_at: input.createdAt ?? new Date().toISOString(),
    expires_at: input.expiresAt,
    content_role: "environment_reasoning_role_output_not_assistant_answer" as const,
    execution_authority: false as const,
    answer_authority: false as const,
    reentry_required: true as const,
    assistant_answer: false as const,
    terminal_eligible: false as const,
    raw_content_included: false as const,
  };
  return helixEnvironmentReasoningRoleOutputSchema.parse({
    ...withoutHash,
    output_hash: helixEnvironmentReasoningRoleSha256(
      roleOutputContent(withoutHash as Omit<HelixEnvironmentReasoningRoleOutput, "output_hash">),
    ),
  });
};

export const helixEnvironmentReasoningRoleEventPayloadSchema =
  z.discriminatedUnion("kind", [
    z
      .object({
        kind: z.literal("role_output_recorded"),
        output: helixEnvironmentReasoningRoleOutputSchema,
      })
      .strict(),
    z
      .object({
        kind: z.literal("role_output_invalidated"),
        role_output_id: identifierSchema,
        reason: z.enum([
          "goal_revision_advanced",
          "observation_revision_advanced",
          "identity_changed",
          "authority_changed",
          "expired",
          "principal_rejected",
          "prediction_contradicted",
          "superseded",
        ]),
        superseding_goal_revision: z.number().int().positive().nullable(),
        superseding_observation_revision: z.number().int().nonnegative().nullable(),
        evidence_refs: evidenceRefsSchema,
      })
      .strict(),
    z
      .object({
        kind: z.literal("principal_disposition_recorded"),
        role_output_id: identifierSchema,
        disposition: z.enum(["adopted", "revised", "ignored", "rejected"]),
        principal_turn_id: identifierSchema,
        adopted_capability_id: identifierSchema.nullable(),
        adopted_capability_arguments_hash: sha256Schema.nullable(),
        rationale_summary: boundedTextSchema,
      })
      .strict(),
    z
      .object({
        kind: z.literal("proposal_arbitrated"),
        arbitration_id: identifierSchema,
        considered_role_output_ids: z.array(identifierSchema).min(1).max(64),
        selected_role_output_id: identifierSchema.nullable(),
        status: z.enum(["selected_one", "none_current", "conflict_rejected"]),
        reason: boundedTextSchema,
      })
      .strict(),
    z
      .object({
        kind: z.literal("execution_link_recorded"),
        arbitration_id: identifierSchema,
        role_output_id: identifierSchema,
        environment_action_request_id: identifierSchema,
        capability_id: identifierSchema,
      })
      .strict(),
    z
      .object({
        kind: z.literal("measured_result_link_recorded"),
        environment_action_request_id: identifierSchema,
        environment_action_result_ref: identifierSchema,
        principal_turn_id: identifierSchema,
        reentry_observation_ref: identifierSchema,
      })
      .strict(),
  ]);

export type HelixEnvironmentReasoningRoleEventPayload = z.infer<
  typeof helixEnvironmentReasoningRoleEventPayloadSchema
>;

export const helixEnvironmentReasoningRoleEventSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_REASONING_ROLE_EVENT_SCHEMA),
    event_id: identifierSchema,
    goal_id: identifierSchema,
    sequence: z.number().int().positive(),
    previous_event_hash: sha256Schema.nullable(),
    payload: helixEnvironmentReasoningRoleEventPayloadSchema,
    occurred_at: timestampSchema,
    event_hash: sha256Schema,
    content_role: z.literal(
      "environment_reasoning_role_event_not_assistant_answer",
    ),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentReasoningRoleEvent = z.infer<
  typeof helixEnvironmentReasoningRoleEventSchema
>;

export const buildHelixEnvironmentReasoningRoleEvent = (input: {
  eventId: string;
  goalId: string;
  sequence: number;
  previousEventHash: string | null;
  payload: HelixEnvironmentReasoningRoleEventPayload;
  occurredAt?: string;
}): HelixEnvironmentReasoningRoleEvent => {
  const withoutHash = {
    schema: HELIX_ENVIRONMENT_REASONING_ROLE_EVENT_SCHEMA,
    event_id: input.eventId,
    goal_id: input.goalId,
    sequence: input.sequence,
    previous_event_hash: input.previousEventHash,
    payload: input.payload,
    occurred_at: input.occurredAt ?? new Date().toISOString(),
    content_role: "environment_reasoning_role_event_not_assistant_answer" as const,
    answer_authority: false as const,
    assistant_answer: false as const,
    terminal_eligible: false as const,
    raw_content_included: false as const,
  };
  return helixEnvironmentReasoningRoleEventSchema.parse({
    ...withoutHash,
    event_hash: helixEnvironmentReasoningRoleSha256(withoutHash),
  });
};

export type HelixEnvironmentReasoningRoleCurrentnessReason =
  | "current"
  | "goal_revision_stale"
  | "goal_revision_future"
  | "observation_revision_stale"
  | "observation_revision_future"
  | "identity_mismatch"
  | "authority_mismatch"
  | "authority_expired"
  | "role_output_expired";

export type HelixEnvironmentReasoningRoleCurrentness = {
  current: boolean;
  reason: HelixEnvironmentReasoningRoleCurrentnessReason;
  mismatch_fields: string[];
};

const identityComparisonFields = [
  "owner_profile_id",
  "room_id",
  "participant_id",
  "environment_binding_id",
  "room_source_binding_id",
  "source_id",
  "world_id",
  "producer_epoch_ref",
  "subject_binding_id",
  "subject_native_id",
  "principal_turn_id",
] as const;

export const evaluateHelixEnvironmentReasoningRoleCurrentness = (input: {
  output: HelixEnvironmentReasoningRoleOutput;
  currentIdentity: HelixEnvironmentReasoningRoleIdentity;
  now?: string;
}): HelixEnvironmentReasoningRoleCurrentness => {
  const output = helixEnvironmentReasoningRoleOutputSchema.parse(input.output);
  const current = helixEnvironmentReasoningRoleIdentitySchema.parse(
    input.currentIdentity,
  );
  const mismatchFields = identityComparisonFields.filter(
    (field) => output.identity[field] !== current[field],
  );
  if (mismatchFields.length > 0) {
    return { current: false, reason: "identity_mismatch", mismatch_fields: mismatchFields };
  }
  const authorityMismatch = [
    "action_authority_id",
    "authority_policy_version",
  ].filter(
    (field) =>
      output.identity[field as "action_authority_id" | "authority_policy_version"] !==
      current[field as "action_authority_id" | "authority_policy_version"],
  );
  if (authorityMismatch.length > 0) {
    return { current: false, reason: "authority_mismatch", mismatch_fields: authorityMismatch };
  }
  if (output.identity.goal_id !== current.goal_id) {
    return { current: false, reason: "identity_mismatch", mismatch_fields: ["goal_id"] };
  }
  if (output.identity.goal_revision < current.goal_revision) {
    return { current: false, reason: "goal_revision_stale", mismatch_fields: ["goal_revision"] };
  }
  if (output.identity.goal_revision > current.goal_revision) {
    return { current: false, reason: "goal_revision_future", mismatch_fields: ["goal_revision"] };
  }
  if (output.identity.observation_revision < current.observation_revision) {
    return { current: false, reason: "observation_revision_stale", mismatch_fields: ["observation_revision"] };
  }
  if (output.identity.observation_revision > current.observation_revision) {
    return { current: false, reason: "observation_revision_future", mismatch_fields: ["observation_revision"] };
  }
  const nowMs = Date.parse(input.now ?? new Date().toISOString());
  if (Date.parse(current.authority_expires_at) <= nowMs) {
    return { current: false, reason: "authority_expired", mismatch_fields: ["authority_expires_at"] };
  }
  if (Date.parse(output.expires_at) <= nowMs) {
    return { current: false, reason: "role_output_expired", mismatch_fields: ["expires_at"] };
  }
  return { current: true, reason: "current", mismatch_fields: [] };
};

export type HelixEnvironmentReasoningRoleProjection = {
  schema: typeof HELIX_ENVIRONMENT_REASONING_ROLE_PROJECTION_SCHEMA;
  goal_id: string;
  revision: number;
  latest_event_hash: string;
  outputs: HelixEnvironmentReasoningRoleOutput[];
  invalidated_output_ids: string[];
  principal_dispositions: Array<
    Extract<
      HelixEnvironmentReasoningRoleEventPayload,
      { kind: "principal_disposition_recorded" }
    >
  >;
  arbitrations: Array<
    Extract<
      HelixEnvironmentReasoningRoleEventPayload,
      { kind: "proposal_arbitrated" }
    >
  >;
  execution_links: Array<
    Extract<
      HelixEnvironmentReasoningRoleEventPayload,
      { kind: "execution_link_recorded" }
    >
  >;
  measured_result_links: Array<
    Extract<
      HelixEnvironmentReasoningRoleEventPayload,
      { kind: "measured_result_link_recorded" }
    >
  >;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
};

export class HelixEnvironmentReasoningRoleReductionError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "HelixEnvironmentReasoningRoleReductionError";
  }
}

export const reduceHelixEnvironmentReasoningRoleEvents = (
  suppliedEvents: HelixEnvironmentReasoningRoleEvent[],
): HelixEnvironmentReasoningRoleProjection => {
  if (suppliedEvents.length === 0) {
    throw new HelixEnvironmentReasoningRoleReductionError(
      "reasoning_role_events_empty",
      "At least one role event is required.",
    );
  }
  const events = suppliedEvents.map((event) =>
    helixEnvironmentReasoningRoleEventSchema.parse(event),
  );
  const goalId = events[0].goal_id;
  const outputs = new Map<string, HelixEnvironmentReasoningRoleOutput>();
  const invalidated = new Set<string>();
  const dispositions = new Map<string, Extract<HelixEnvironmentReasoningRoleEventPayload, { kind: "principal_disposition_recorded" }>>();
  const arbitrations: HelixEnvironmentReasoningRoleProjection["arbitrations"] = [];
  const executionLinks: HelixEnvironmentReasoningRoleProjection["execution_links"] = [];
  const measuredLinks: HelixEnvironmentReasoningRoleProjection["measured_result_links"] = [];
  let previousHash: string | null = null;

  events.forEach((event, index) => {
    const expectedSequence = index + 1;
    if (event.goal_id !== goalId) {
      throw new HelixEnvironmentReasoningRoleReductionError(
        "reasoning_role_goal_mismatch",
        "Every role event must bind the same durable goal.",
      );
    }
    if (event.sequence !== expectedSequence || event.previous_event_hash !== previousHash) {
      throw new HelixEnvironmentReasoningRoleReductionError(
        "reasoning_role_event_chain_invalid",
        "Role events must be contiguous and hash-linked.",
      );
    }
    const { event_hash: suppliedHash, ...withoutHash } = event;
    if (helixEnvironmentReasoningRoleSha256(withoutHash) !== suppliedHash) {
      throw new HelixEnvironmentReasoningRoleReductionError(
        "reasoning_role_event_hash_invalid",
        "A role event hash does not match its canonical content.",
      );
    }
    previousHash = event.event_hash;

    switch (event.payload.kind) {
      case "role_output_recorded": {
        const output = event.payload.output;
        const { output_hash: suppliedOutputHash, ...withoutOutputHash } = output;
        if (helixEnvironmentReasoningRoleSha256(withoutOutputHash) !== suppliedOutputHash) {
          throw new HelixEnvironmentReasoningRoleReductionError(
            "reasoning_role_output_hash_invalid",
            "A role output hash does not match its canonical content.",
          );
        }
        if (output.identity.goal_id !== goalId || outputs.has(output.role_output_id)) {
          throw new HelixEnvironmentReasoningRoleReductionError(
            "reasoning_role_output_identity_invalid",
            "Role output identity must be unique and match the event goal.",
          );
        }
        outputs.set(output.role_output_id, output);
        break;
      }
      case "role_output_invalidated":
        if (!outputs.has(event.payload.role_output_id)) {
          throw new HelixEnvironmentReasoningRoleReductionError(
            "reasoning_role_output_unknown",
            "Only a recorded role output may be invalidated.",
          );
        }
        invalidated.add(event.payload.role_output_id);
        break;
      case "principal_disposition_recorded":
        if (!outputs.has(event.payload.role_output_id)) {
          throw new HelixEnvironmentReasoningRoleReductionError(
            "reasoning_role_output_unknown",
            "Only a recorded role output may receive a principal disposition.",
          );
        }
        dispositions.set(event.payload.role_output_id, event.payload);
        if (event.payload.disposition === "rejected") invalidated.add(event.payload.role_output_id);
        break;
      case "proposal_arbitrated": {
        const unknown = event.payload.considered_role_output_ids.filter((id) => !outputs.has(id));
        if (unknown.length > 0) {
          throw new HelixEnvironmentReasoningRoleReductionError(
            "reasoning_role_output_unknown",
            "Arbitration may consider only recorded outputs.",
          );
        }
        if (
          event.payload.selected_role_output_id &&
          (!event.payload.considered_role_output_ids.includes(event.payload.selected_role_output_id) ||
            invalidated.has(event.payload.selected_role_output_id) ||
            !["adopted", "revised"].includes(
              dispositions.get(event.payload.selected_role_output_id)?.disposition ?? "",
            ))
        ) {
          throw new HelixEnvironmentReasoningRoleReductionError(
            "reasoning_role_arbitration_selection_invalid",
            "Arbitration may select only a current principal-adopted proposal.",
          );
        }
        arbitrations.push(event.payload);
        break;
      }
      case "execution_link_recorded": {
        const payload = event.payload as Extract<
          HelixEnvironmentReasoningRoleEventPayload,
          { kind: "execution_link_recorded" }
        >;
        const arbitration = arbitrations.find(
          (entry) => entry.arbitration_id === payload.arbitration_id,
        );
        if (
          !arbitration ||
          arbitration.selected_role_output_id !== payload.role_output_id ||
          executionLinks.some((entry) => entry.arbitration_id === payload.arbitration_id)
        ) {
          throw new HelixEnvironmentReasoningRoleReductionError(
            "reasoning_role_execution_link_invalid",
            "Execution must link exactly once to the selected arbitration output.",
          );
        }
        executionLinks.push(payload);
        break;
      }
      case "measured_result_link_recorded": {
        const payload = event.payload as Extract<
          HelixEnvironmentReasoningRoleEventPayload,
          { kind: "measured_result_link_recorded" }
        >;
        if (!executionLinks.some((entry) => entry.environment_action_request_id === payload.environment_action_request_id)) {
          throw new HelixEnvironmentReasoningRoleReductionError(
            "reasoning_role_result_link_invalid",
            "A measured result must link to a recorded execution request.",
          );
        }
        measuredLinks.push(payload);
        break;
      }
    }
  });

  return {
    schema: HELIX_ENVIRONMENT_REASONING_ROLE_PROJECTION_SCHEMA,
    goal_id: goalId,
    revision: events.length,
    latest_event_hash: previousHash!,
    outputs: [...outputs.values()],
    invalidated_output_ids: [...invalidated],
    principal_dispositions: [...dispositions.values()],
    arbitrations,
    execution_links: executionLinks,
    measured_result_links: measuredLinks,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  };
};
