import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_DURABLE_GOAL_APPEND_CAPABILITY,
  HELIX_ENVIRONMENT_DURABLE_GOAL_CREATE_CAPABILITY,
  HELIX_ENVIRONMENT_DURABLE_GOAL_INSPECT_CAPABILITY,
  helixEnvironmentDurableGoalAppendRequestSchema,
  helixEnvironmentDurableGoalObjectiveSchema,
  helixEnvironmentDurableGoalSha256,
  type HelixEnvironmentDurableGoalProjection,
} from "@shared/helix-environment-durable-goal";
import { resolveEnvironmentActionAuthorityContext } from "../../environment-connectors/actions";
import {
  environmentDurableGoalStore,
  isEnvironmentDurableGoalError,
  type EnvironmentDurableGoalStore,
} from "../../environment-connectors/goals";
import { listRoomEnvironmentProjections } from "../../environment-connectors/subjects";
import { readSharedRealtimeRoomMembership } from "../realtime-room/room-store";
import type { HelixWorkstationGatewayAccountContext } from "./account-policy";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const HELIX_ENVIRONMENT_DURABLE_GOAL_OBSERVATION_SCHEMA =
  "helix.environment_durable_goal_observation.v1" as const;

const CREATE_ACTION = "room.environment.durable_goal.create" as const;
const INSPECT_ACTION = "room.environment.durable_goal.inspect" as const;
const APPEND_ACTION = "room.environment.durable_goal.append" as const;

const objectiveJsonSchema = {
  type: "object",
  properties: {
    objective_text: { type: "string", minLength: 1, maxLength: 4_000 },
    goal_kind: { type: "string", enum: ["all_advancements_survival", "custom_survival"] },
    domain: { type: "string", enum: ["minecraft"] },
    game_version: { type: "string", minLength: 1, maxLength: 80 },
    mechanics_collection_ref: { type: ["string", "null"] },
    milestones: {
      type: "array",
      minItems: 1,
      maxItems: 256,
      items: {
        type: "object",
        properties: {
          milestone_id: { type: "string", minLength: 1, maxLength: 320 },
          description: { type: "string", minLength: 1, maxLength: 4_000 },
          dependency_milestone_ids: { type: "array", items: { type: "string" }, maxItems: 64 },
          required_postcondition_ids: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 128 },
        },
        required: ["milestone_id", "description", "dependency_milestone_ids", "required_postcondition_ids"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "objective_text",
    "goal_kind",
    "domain",
    "game_version",
    "mechanics_collection_ref",
    "milestones",
  ],
  additionalProperties: false,
} as const;

const durableGoalEventPayloadJsonSchema = {
  type: "object",
  description:
    "One canonical durable-goal event payload. Use kind (not schema or event_type). For checkpoint_verified, copy observation_revision and exact evidence_refs from the fresh observation; Helix derives checkpoint_evidence_hash when omitted.",
  properties: {
    kind: {
      type: "string",
      enum: [
        "strategy_revised", "milestone_activated", "attempt_started",
        "attempt_settled", "semantic_wake_consumed", "checkpoint_verified",
        "milestone_completed", "recovery_required", "authority_rebound",
        "goal_paused", "goal_resumed", "goal_completed", "goal_canceled",
      ],
    },
    strategy_summary: { type: "string" },
    candidate_milestone_ids: { type: "array", items: { type: "string" }, maxItems: 64 },
    supersedes_strategy_event_id: { type: ["string", "null"] },
    milestone_id: { type: ["string", "null"] },
    rationale: { type: "string" },
    attempt_id: { type: "string" },
    plan_summary: { type: "string" },
    capability_ids: { type: "array", items: { type: "string" }, maxItems: 64 },
    outcome: { type: "string", enum: ["succeeded", "failed", "canceled", "interrupted"] },
    postconditions: { type: "array", maxItems: 128 },
    failure_code: { type: ["string", "null"] },
    mail_refs: { type: "array", items: { type: "string" }, maxItems: 64 },
    digest_refs: { type: "array", items: { type: "string" }, maxItems: 64 },
    observation_revision: {
      type: "integer",
      minimum: 0,
      description: "Exact observation_revision copied from admitted current evidence.",
    },
    material_change_summary: { type: "string" },
    checkpoint_id: { type: "string" },
    verified_facts: { type: "object" },
    completed_postcondition_ids: { type: "array", items: { type: "string" }, maxItems: 128 },
    incomplete_postcondition_ids: { type: "array", items: { type: "string" }, maxItems: 128 },
    checkpoint_evidence_hash: {
      type: "string",
      pattern: "^sha256:[a-f0-9]{64}$",
      description: "Optional for checkpoint_verified; Helix deterministically derives it from the exact event facts and evidence refs when omitted.",
    },
    reason: { type: "string" },
    last_recoverable_checkpoint_id: { type: ["string", "null"] },
    superseded_producer_epoch_ref: { type: "string" },
    fresh_observation_revision: { type: "integer", minimum: 0 },
    recovery_checkpoint_id: { type: "string" },
    completed_milestone_ids: { type: "array", items: { type: "string" }, maxItems: 256 },
  },
  required: ["kind"],
  additionalProperties: false,
} as const;

const durableGoalEventFieldsByKind: Record<string, readonly string[]> = {
  strategy_revised: ["strategy_summary", "candidate_milestone_ids", "supersedes_strategy_event_id"],
  milestone_activated: ["milestone_id", "rationale"],
  attempt_started: ["attempt_id", "milestone_id", "plan_summary", "capability_ids"],
  attempt_settled: ["attempt_id", "milestone_id", "outcome", "postconditions", "failure_code"],
  semantic_wake_consumed: ["mail_refs", "digest_refs", "observation_revision", "material_change_summary"],
  checkpoint_verified: [
    "checkpoint_id", "milestone_id", "observation_revision", "verified_facts",
    "completed_postcondition_ids", "incomplete_postcondition_ids", "checkpoint_evidence_hash",
  ],
  milestone_completed: ["milestone_id", "completed_postcondition_ids"],
  recovery_required: ["reason", "last_recoverable_checkpoint_id"],
  authority_rebound: ["superseded_producer_epoch_ref", "fresh_observation_revision"],
  goal_paused: ["reason"],
  goal_resumed: ["recovery_checkpoint_id"],
  goal_completed: ["completed_milestone_ids"],
  goal_canceled: ["reason"],
};

const normalizeDurableGoalEventPayload = (value: unknown): unknown => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const input = value as Record<string, unknown>;
  const kind = typeof input.kind === "string" ? input.kind : "";
  const allowedFields = durableGoalEventFieldsByKind[kind];
  if (!allowedFields) return value;
  return Object.fromEntries([
    ["kind", kind],
    ...allowedFields
      .filter((field) => field in input)
      .map((field) => [field, input[field]] as const),
  ]);
};

const commonSafetyTags = [
  "exact_room_player_world_authority",
  "append_only_hash_linked_goal_ledger",
  "checkpoint_evidence_required",
  "current_turn_evidence_reentry_required",
  "strategy_owned_by_codex",
  "projection_not_answer_authority",
  "no_shell",
  "no_code_mutation",
  "non_terminal",
];

export const environmentDurableGoalManifests: HelixWorkstationCapabilityManifest[] = [
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: HELIX_ENVIRONMENT_DURABLE_GOAL_CREATE_CAPABILITY,
    label: "Create durable Minecraft survival goal",
    description: "Create a checkpointed survival objective bound to the exact active room speaker, selected player, Minecraft source, connector epoch, and action authority. Codex authors the milestones; Helix only persists and verifies them. The returned projection must re-enter Codex and is never an answer.",
    panel_id: null,
    action_id: CREATE_ACTION,
    mode: "act",
    mutating: true,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: true,
    terminal_eligible: false,
    permission_profile_required: "act",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      properties: {
        environment_label: {
          type: "string",
          minLength: 1,
          maxLength: 240,
          description:
            "Optional exact visible Minecraft source label. Omit this field when there is only one active Minecraft environment; never paraphrase it.",
        },
        objective: objectiveJsonSchema,
      },
      required: ["objective"],
      additionalProperties: false,
    },
    output_observation_schema: HELIX_ENVIRONMENT_DURABLE_GOAL_OBSERVATION_SCHEMA,
    observation_schema: HELIX_ENVIRONMENT_DURABLE_GOAL_OBSERVATION_SCHEMA,
    safety_tags: commonSafetyTags,
    assistant_answer: false,
    raw_content_included: false,
  },
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: HELIX_ENVIRONMENT_DURABLE_GOAL_INSPECT_CAPABILITY,
    label: "Inspect durable Minecraft survival goal",
    description: "Reconstruct bounded milestones, attempts, checkpoint, recovery, and exact evidence references from the canonical goal ledger for Codex replanning. The projection is nonterminal evidence.",
    panel_id: null,
    action_id: INSPECT_ACTION,
    mode: "read",
    mutating: false,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: true,
    terminal_eligible: false,
    permission_profile_required: "observe",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      properties: {
        goal_id: {
          type: "string",
          minLength: 1,
          maxLength: 320,
          description:
            "Exact goal ID when already known. Omit it to resolve the only readable durable goal for the exact active room, source, world, and source binding; multiple matches fail closed with candidate IDs.",
        },
      },
      required: [],
      additionalProperties: false,
    },
    output_observation_schema: HELIX_ENVIRONMENT_DURABLE_GOAL_OBSERVATION_SCHEMA,
    observation_schema: HELIX_ENVIRONMENT_DURABLE_GOAL_OBSERVATION_SCHEMA,
    safety_tags: commonSafetyTags,
    assistant_answer: false,
    raw_content_included: false,
  },
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: HELIX_ENVIRONMENT_DURABLE_GOAL_APPEND_CAPABILITY,
    label: "Record durable Minecraft goal progress",
    description: "Append one revision-checked strategy, attempt, semantic-wake, checkpoint, recovery, milestone, pause, resume, or completion fact after exact identity and evidence admission. This capability records Codex decisions; it does not make them.",
    panel_id: null,
    action_id: APPEND_ACTION,
    mode: "act",
    mutating: true,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: true,
    terminal_eligible: false,
    permission_profile_required: "act",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      properties: {
        environment_label: { type: "string", minLength: 1, maxLength: 240 },
        goal_id: { type: "string", minLength: 1, maxLength: 320 },
        expected_revision: { type: "integer", minimum: 1 },
        payload: durableGoalEventPayloadJsonSchema,
        evidence_refs: { type: "array", items: { type: "string" }, maxItems: 256 },
      },
      required: ["goal_id", "expected_revision", "payload", "evidence_refs"],
      additionalProperties: false,
    },
    output_observation_schema: HELIX_ENVIRONMENT_DURABLE_GOAL_OBSERVATION_SCHEMA,
    observation_schema: HELIX_ENVIRONMENT_DURABLE_GOAL_OBSERVATION_SCHEMA,
    safety_tags: commonSafetyTags,
    assistant_answer: false,
    raw_content_included: false,
  },
];

type DurableGoalObservation = {
  schema: typeof HELIX_ENVIRONMENT_DURABLE_GOAL_OBSERVATION_SCHEMA;
  outcome: "recorded" | "fresh" | "blocked" | "failed";
  summary: string;
  operation: string;
  goal: HelixEnvironmentDurableGoalProjection | null;
  evidence_ref: string;
  observed_at: string;
  provenance_valid: boolean;
  eligible_for_current_turn_reentry: boolean;
  content_role: "environment_durable_goal_observation_not_assistant_answer";
  reentry_required: true;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type EnvironmentDurableGoalGatewayExecution = {
  ok: boolean;
  status: "completed" | "blocked" | "failed";
  summary: string;
  observation: DurableGoalObservation;
  executedArgs?: Record<string, unknown>;
  repairAction?: "repair" | "retry" | "ask_user";
  error?: string;
};

export type EnvironmentDurableGoalGatewayDependencies = {
  store: Pick<
    EnvironmentDurableGoalStore,
    "create" | "inspect" | "listForRoom" | "append"
  >;
  listRoomEnvironments: typeof listRoomEnvironmentProjections;
  readMembership: typeof readSharedRealtimeRoomMembership;
  resolveActionContext: typeof resolveEnvironmentActionAuthorityContext;
};

const deps = (overrides: Partial<EnvironmentDurableGoalGatewayDependencies> = {}): EnvironmentDurableGoalGatewayDependencies => ({
  store: overrides.store ?? environmentDurableGoalStore,
  listRoomEnvironments: overrides.listRoomEnvironments ?? listRoomEnvironmentProjections,
  readMembership: overrides.readMembership ?? readSharedRealtimeRoomMembership,
  resolveActionContext: overrides.resolveActionContext ?? resolveEnvironmentActionAuthorityContext,
});

const roomIdFromThread = (threadId: string | null | undefined): string | null => {
  const prefix = "helix-ask:room:";
  const value = threadId?.trim() ?? "";
  return value.startsWith(prefix) ? value.slice(prefix.length).trim() || null : null;
};

const observation = (input: {
  outcome: DurableGoalObservation["outcome"];
  summary: string;
  operation: string;
  goal?: HelixEnvironmentDurableGoalProjection | null;
  evidenceRef: string;
  provenanceValid: boolean;
}): DurableGoalObservation => ({
  schema: HELIX_ENVIRONMENT_DURABLE_GOAL_OBSERVATION_SCHEMA,
  outcome: input.outcome,
  summary: input.summary,
  operation: input.operation,
  goal: input.goal ?? null,
  evidence_ref: input.evidenceRef,
  observed_at: new Date().toISOString(),
  provenance_valid: input.provenanceValid,
  eligible_for_current_turn_reentry: true,
  content_role: "environment_durable_goal_observation_not_assistant_answer",
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const failed = (turnId: string, operation: string, code: string, summary: string): EnvironmentDurableGoalGatewayExecution => ({
  ok: false,
  status: code === "durable_goal_revision_conflict" || code === "durable_goal_authority_stale" ? "blocked" : "failed",
  summary,
  observation: observation({
    outcome: "blocked",
    summary,
    operation,
    evidenceRef: `environment_durable_goal_failure:${crypto.createHash("sha256").update(`${turnId}\n${operation}\n${code}`).digest("hex").slice(0, 48)}`,
    provenanceValid: false,
  }),
  error: code,
  repairAction:
    code === "durable_goal_event_invalid" ||
    code === "durable_goal_environment_label_invalid" ||
    code === "durable_goal_selection_required"
      ? "repair"
      : code === "durable_goal_revision_conflict" ||
          code === "durable_goal_authority_stale"
        ? "retry"
        : "ask_user",
});

const objectiveValidationSummary = (
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
): string => {
  const issue = issues[0];
  const path = issue?.path.map(String).join(".") || "objective";
  const detail = issue?.message?.trim() || "The value does not satisfy the declared schema.";
  return `The durable goal objective or milestone contract is invalid at ${path}: ${detail}`;
};

const selectedParticipant = async (input: {
  dependencies: EnvironmentDurableGoalGatewayDependencies;
  roomId: string;
  profileId: string;
  account: HelixWorkstationGatewayAccountContext;
}): Promise<string | null> => {
  const membership = await input.dependencies.readMembership({ roomId: input.roomId, profileId: input.profileId });
  if (!membership || membership.roomStatus === "closed") return null;
  const actor = input.account.trusted_turn_actor_context;
  if (!actor) return membership.participantId;
  return ["realtime_voice", "environment_interaction"].includes(actor.origin) &&
    actor.room_id === input.roomId && actor.requester_profile_id === input.profileId &&
    actor.resolution === "resolved" && actor.participant_id
    ? actor.participant_id
    : null;
};

export const executeEnvironmentDurableGoalGatewayCapability = async (input: {
  capabilityId: string;
  turnId: string;
  arguments?: Record<string, unknown>;
  accountContext?: HelixWorkstationGatewayAccountContext | null;
  conversationThreadId?: string | null;
  dependencies?: Partial<EnvironmentDurableGoalGatewayDependencies>;
}): Promise<EnvironmentDurableGoalGatewayExecution> => {
  const dependencies = deps(input.dependencies);
  const operation = input.capabilityId;
  const account = input.accountContext;
  const profileId = account?.profile_id?.trim() ?? "";
  const roomId = roomIdFromThread(input.conversationThreadId);
  if (!account?.trusted_account_session || !account.account_session || account.account_session.status !== "active" || account.account_session.profile.profile_id !== profileId || !roomId || !input.turnId.trim()) {
    return failed(input.turnId, operation, "durable_goal_forbidden", "Durable Minecraft goals require an exact signed-in Shared Live Room turn.");
  }
  try {
    const participantId = await selectedParticipant({ dependencies, roomId, profileId, account });
    if (!participantId) return failed(input.turnId, operation, "durable_goal_identity_unavailable", "The current text author or GPT Live speaker is not an active room participant.");
    const args = input.arguments ?? {};
    if (operation === HELIX_ENVIRONMENT_DURABLE_GOAL_INSPECT_CAPABILITY) {
      let goalId =
        typeof args.goal_id === "string" ? args.goal_id.trim() : "";
      if (!goalId) {
        const activeMinecraftEnvironments = (
          await dependencies.listRoomEnvironments({ roomId, profileId })
        ).filter(
          (entry) =>
            entry.domain === "minecraft" &&
            entry.connection_status === "active",
        );
        if (activeMinecraftEnvironments.length !== 1) {
          return failed(
            input.turnId,
            operation,
            "durable_goal_identity_unavailable",
            activeMinecraftEnvironments.length === 0
              ? "No active Minecraft environment is available to resolve the current durable goal."
              : "More than one active Minecraft environment is available; provide an exact goal_id.",
          );
        }
        const environment = activeMinecraftEnvironments[0];
        const goals = await dependencies.store.listForRoom({
          roomId,
          profileId,
          participantId,
          sourceId: environment.source_id,
          worldId: environment.world_id,
          roomSourceBindingId: environment.room_source_binding_id,
          limit: 8,
        });
        if (goals.length !== 1) {
          const candidateSummaries = goals
            .map(
              (goal) =>
                `${goal.goal_id} [${goal.status}]: ${goal.objective.objective_text}`,
            )
            .join(" | ");
          return failed(
            input.turnId,
            operation,
            goals.length === 0
              ? "durable_goal_not_found"
              : "durable_goal_selection_required",
            goals.length === 0
              ? "No readable durable goal matches the exact active room, source, world, and source binding."
              : `More than one readable durable goal matches the exact active environment. Select the goal whose objective matches the user's request, then retry with its exact goal_id. Candidates: ${candidateSummaries}`,
          );
        }
        goalId = goals[0].goal_id;
      }
      const goal = await dependencies.store.inspect({ goalId, profileId, participantId });
      return {
        ok: true,
        status: "completed",
        summary: "Durable Minecraft goal context reconstructed from the canonical ledger.",
        observation: observation({ outcome: "fresh", summary: "Durable Minecraft goal context reconstructed from the canonical ledger.", operation, goal, evidenceRef: goal.event_refs.at(-1) ?? goal.latest_event_hash, provenanceValid: true }),
        executedArgs: {
          goal_id: goalId,
          goal_resolution:
            typeof args.goal_id === "string" && args.goal_id.trim()
              ? "explicit"
              : "only_readable_goal_for_exact_active_environment",
        },
      };
    }

    const requestedLabel = typeof args.environment_label === "string" ? args.environment_label.trim().toLowerCase() : "";
    const activeMinecraftEnvironments = (
      await dependencies.listRoomEnvironments({ roomId, profileId })
    ).filter(
      (entry) =>
        entry.domain === "minecraft" && entry.connection_status === "active",
    );
    const environments = requestedLabel
      ? activeMinecraftEnvironments.filter(
          (entry) => entry.source_label.trim().toLowerCase() === requestedLabel,
        )
      : activeMinecraftEnvironments;
    if (requestedLabel && environments.length === 0 && activeMinecraftEnvironments.length > 0) {
      return failed(
        input.turnId,
        operation,
        "durable_goal_environment_label_invalid",
        activeMinecraftEnvironments.length === 1
          ? "environment_label did not exactly match the active Minecraft source. Retry without environment_label because only one active Minecraft environment exists."
          : "environment_label did not exactly match an active Minecraft source. Retry with one exact visible source label.",
      );
    }
    if (environments.length !== 1) return failed(input.turnId, operation, "durable_goal_identity_unavailable", environments.length === 0 ? "No active Minecraft environment is available for this durable-goal request." : "More than one Minecraft environment matches; select its exact visible label.");
    const context = await dependencies.resolveActionContext({
      roomId,
      profileId,
      environmentBindingId: environments[0].environment_binding_id,
      participantId,
    });

    let goal: HelixEnvironmentDurableGoalProjection;
    if (operation === HELIX_ENVIRONMENT_DURABLE_GOAL_CREATE_CAPABILITY) {
      const parsedObjective = helixEnvironmentDurableGoalObjectiveSchema.safeParse(args.objective);
      if (!parsedObjective.success) {
        return failed(
          input.turnId,
          operation,
          "durable_goal_event_invalid",
          objectiveValidationSummary(parsedObjective.error.issues),
        );
      }
      goal = await dependencies.store.create({
        ownerProfileId: profileId,
        roomId,
        participantId,
        environmentBindingId: context.environmentBindingId,
        subjectNativeId: context.subjectNativeId,
        actionAuthorityId: context.actionAuthorityId,
        runId: null,
        turnId: input.turnId,
        objective: parsedObjective.data,
      });
    } else if (operation === HELIX_ENVIRONMENT_DURABLE_GOAL_APPEND_CAPABILITY) {
      const evidenceRefs = Array.isArray(args.evidence_refs)
        ? args.evidence_refs
        : [];
      const normalizedPayload = normalizeDurableGoalEventPayload(args.payload);
      const rawPayload =
        normalizedPayload &&
        typeof normalizedPayload === "object" &&
        !Array.isArray(normalizedPayload)
          ? { ...(normalizedPayload as Record<string, unknown>) }
          : normalizedPayload;
      if (
        rawPayload &&
        typeof rawPayload === "object" &&
        !Array.isArray(rawPayload) &&
        rawPayload.kind === "checkpoint_verified" &&
        !("checkpoint_evidence_hash" in rawPayload)
      ) {
        rawPayload.checkpoint_evidence_hash = helixEnvironmentDurableGoalSha256({
          evidence_refs: evidenceRefs,
          observation_revision: rawPayload.observation_revision,
          verified_facts: rawPayload.verified_facts,
          completed_postcondition_ids: rawPayload.completed_postcondition_ids,
          incomplete_postcondition_ids: rawPayload.incomplete_postcondition_ids,
        });
      }
      const parsed = helixEnvironmentDurableGoalAppendRequestSchema.safeParse({
        action_authority_id: context.actionAuthorityId,
        subject_native_id: context.subjectNativeId,
        run_id: null,
        turn_id: input.turnId,
        expected_revision: args.expected_revision,
        payload: rawPayload,
        evidence_refs: evidenceRefs,
      });
      const goalId = typeof args.goal_id === "string" ? args.goal_id.trim() : "";
      if (!goalId || !parsed.success) return failed(input.turnId, operation, "durable_goal_event_invalid", "A goal_id, current expected revision, typed event, and exact evidence refs are required.");
      goal = await dependencies.store.append({
        ownerProfileId: profileId,
        roomId,
        participantId,
        environmentBindingId: context.environmentBindingId,
        subjectNativeId: context.subjectNativeId,
        actionAuthorityId: context.actionAuthorityId,
        runId: null,
        turnId: input.turnId,
        goalId,
        expectedRevision: parsed.data.expected_revision,
        payload: parsed.data.payload,
        evidenceRefs: parsed.data.evidence_refs,
      });
    } else {
      return failed(input.turnId, operation, "durable_goal_event_invalid", "The durable goal capability is not registered.");
    }
    const summary = operation === HELIX_ENVIRONMENT_DURABLE_GOAL_CREATE_CAPABILITY ? "Durable Minecraft goal created and bound to current environment authority." : "Durable Minecraft goal event admitted to the canonical ledger.";
    return {
      ok: true,
      status: "completed",
      summary,
      observation: observation({ outcome: "recorded", summary, operation, goal, evidenceRef: goal.event_refs.at(-1) ?? goal.latest_event_hash, provenanceValid: true }),
      executedArgs: { goal_id: goal.goal_id, revision: goal.revision, ...(requestedLabel ? { environment_label: args.environment_label } : {}) },
    };
  } catch (error) {
    if (isEnvironmentDurableGoalError(error)) return failed(input.turnId, operation, error.code, error.message);
    return failed(input.turnId, operation, "durable_goal_identity_unavailable", error instanceof Error ? error.message : "Durable Minecraft goal state is unavailable.");
  }
};
