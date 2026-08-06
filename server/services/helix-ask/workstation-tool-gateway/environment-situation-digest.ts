import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_SITUATION_DIGEST_OBSERVATION_SCHEMA,
  HELIX_MINECRAFT_SITUATION_DIGEST_READ_CAPABILITY,
  helixEnvironmentSituationDigestObservationSchema,
  type HelixEnvironmentSituationDigestObservation,
} from "@shared/helix-environment-event-stream";
import {
  readLatestEnvironmentSituationDigest,
  resolveEnvironmentSituationDigestReadContext,
} from "../../environment-connectors/events";
import { isEnvironmentActionBrokerError } from "../../environment-connectors/actions";
import { listRoomEnvironmentProjections } from "../../environment-connectors/subjects";
import { readSharedRealtimeRoomMembership } from "../realtime-room/room-store";
import type { HelixWorkstationGatewayAccountContext } from "./account-policy";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const HELIX_ENVIRONMENT_SITUATION_DIGEST_GATEWAY_ACTION =
  "room.environment.situation_digest.read" as const;

export const environmentSituationDigestMinecraftManifest:
HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: HELIX_MINECRAFT_SITUATION_DIGEST_READ_CAPABILITY,
  label: "Read Minecraft situation digest",
  description:
    "Read the latest compact player-embodiment situation digest for the current Shared Live Room speaker. The digest preserves raw event references and is evidence for Codex re-entry, never an assistant answer.",
  panel_id: null,
  action_id: HELIX_ENVIRONMENT_SITUATION_DIGEST_GATEWAY_ACTION,
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
      environment_label: {
        type: "string",
        minLength: 1,
        maxLength: 240,
        description:
          "Optional exact visible environment label when the room has more than one active Minecraft environment.",
      },
      freshness_requirement_ms: {
        type: "integer",
        minimum: 1_000,
        maximum: 120_000,
        description: "Maximum acceptable age of the server-owned digest.",
      },
      producer_plane: {
        type: "string",
        enum: ["world_authority", "player_embodiment"],
        description:
          "Select server-observed world events or separately paired client embodiment events. Defaults to player_embodiment.",
      },
    },
    required: [],
    additionalProperties: false,
  },
  output_observation_schema:
    HELIX_ENVIRONMENT_SITUATION_DIGEST_OBSERVATION_SCHEMA,
  observation_schema: HELIX_ENVIRONMENT_SITUATION_DIGEST_OBSERVATION_SCHEMA,
  safety_tags: [
    "exact_room_player_world_identity",
    "separate_player_action_pairing",
    "raw_event_provenance_preserved",
    "freshness_required",
    "current_turn_evidence_reentry_required",
    "no_shell",
    "no_code_mutation",
    "non_terminal",
  ],
  assistant_answer: false,
  raw_content_included: false,
};

const roomIdFromThread = (threadId: string | null | undefined): string | null => {
  const prefix = "helix-ask:room:";
  const normalized = threadId?.trim() ?? "";
  return normalized.startsWith(prefix)
    ? normalized.slice(prefix.length).trim() || null
    : null;
};

const syntheticObservation = (input: {
  turnId: string;
  outcome: Exclude<HelixEnvironmentSituationDigestObservation["outcome"], "fresh">;
  summary: string;
}): HelixEnvironmentSituationDigestObservation => {
  const digest = crypto
    .createHash("sha256")
    .update(`${input.turnId}\n${input.outcome}\n${input.summary}`, "utf8")
    .digest("hex");
  return helixEnvironmentSituationDigestObservationSchema.parse({
    schema: HELIX_ENVIRONMENT_SITUATION_DIGEST_OBSERVATION_SCHEMA,
    outcome: input.outcome,
    summary: input.summary,
    digest: null,
    evidence_ref: `environment_situation_digest_failure:${digest.slice(0, 48)}`,
    observed_at: new Date().toISOString(),
    provenance_valid: false,
    eligible_for_current_turn_reentry: false,
    content_role:
      "environment_situation_digest_observation_not_assistant_answer",
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
};

export type EnvironmentSituationDigestGatewayDependencies = {
  listRoomEnvironments: typeof listRoomEnvironmentProjections;
  readMembership: typeof readSharedRealtimeRoomMembership;
  resolveContext: typeof resolveEnvironmentSituationDigestReadContext;
  readDigest: typeof readLatestEnvironmentSituationDigest;
};

const dependencies = (
  overrides: Partial<EnvironmentSituationDigestGatewayDependencies> = {},
): EnvironmentSituationDigestGatewayDependencies => ({
  listRoomEnvironments:
    overrides.listRoomEnvironments ?? listRoomEnvironmentProjections,
  readMembership: overrides.readMembership ?? readSharedRealtimeRoomMembership,
  resolveContext:
    overrides.resolveContext ?? resolveEnvironmentSituationDigestReadContext,
  readDigest: overrides.readDigest ?? readLatestEnvironmentSituationDigest,
});

const selectedParticipantId = async (input: {
  deps: EnvironmentSituationDigestGatewayDependencies;
  roomId: string;
  profileId: string;
  account: HelixWorkstationGatewayAccountContext;
}): Promise<string | null> => {
  const membership = await input.deps.readMembership({
    roomId: input.roomId,
    profileId: input.profileId,
  });
  if (!membership || membership.roomStatus === "closed") return null;
  const actor = input.account.trusted_turn_actor_context;
  if (!actor) return membership.participantId;
  if (
    actor.origin !== "realtime_voice" ||
    actor.room_id !== input.roomId ||
    actor.requester_profile_id !== input.profileId ||
    actor.resolution !== "resolved" ||
    !actor.participant_id
  ) return null;
  return actor.participant_id;
};

export type EnvironmentSituationDigestGatewayExecution = {
  ok: boolean;
  status: "completed" | "blocked" | "failed";
  summary: string;
  observation: HelixEnvironmentSituationDigestObservation;
  executedArgs?: Record<string, unknown>;
  repairAction?: "repair" | "retry" | "ask_user";
  error?: string;
};

export const environmentSituationDigestFailureRepairAction = (
  outcome: HelixEnvironmentSituationDigestObservation["outcome"],
): "repair" | "retry" | "ask_user" => {
  if (["stale", "unavailable", "integrity_failed"].includes(outcome)) {
    return "retry";
  }
  if (outcome === "wrong_environment") return "repair";
  return "ask_user";
};

export const executeEnvironmentSituationDigestGatewayCapability = async (input: {
  turnId: string;
  arguments?: Record<string, unknown>;
  accountContext?: HelixWorkstationGatewayAccountContext | null;
  conversationThreadId?: string | null;
  dependencies?: Partial<EnvironmentSituationDigestGatewayDependencies>;
}): Promise<EnvironmentSituationDigestGatewayExecution> => {
  const deps = dependencies(input.dependencies);
  const fail = (
    outcome: Exclude<HelixEnvironmentSituationDigestObservation["outcome"], "fresh">,
    summary: string,
    status: "blocked" | "failed" = "blocked",
  ): EnvironmentSituationDigestGatewayExecution => ({
    ok: false,
    status,
    summary,
    observation: syntheticObservation({
      turnId: input.turnId,
      outcome,
      summary,
    }),
    repairAction: environmentSituationDigestFailureRepairAction(outcome),
    error: outcome,
  });

  const account = input.accountContext;
  const profileId = account?.profile_id?.trim() ?? "";
  const roomId = roomIdFromThread(input.conversationThreadId);
  if (
    !account?.trusted_account_session ||
    !account.account_session ||
    account.account_session.status !== "active" ||
    account.account_session.profile.profile_id !== profileId ||
    !roomId ||
    !input.turnId.trim()
  ) {
    return fail(
      "forbidden",
      "Minecraft situation digests require an exact signed-in Shared Live Room turn.",
    );
  }

  try {
    const participantId = await selectedParticipantId({
      deps,
      roomId,
      profileId,
      account,
    });
    if (!participantId) {
      return fail(
        "subject_binding_required",
        "The current text author or GPT Live speaker could not be resolved to an active room participant.",
      );
    }
    const requestedLabel =
      typeof input.arguments?.environment_label === "string"
        ? input.arguments.environment_label.trim().toLowerCase()
        : "";
    const environments = (
      await deps.listRoomEnvironments({ roomId, profileId })
    ).filter(
      (environment) =>
        environment.domain === "minecraft" &&
        environment.connection_status === "active" &&
        (!requestedLabel ||
          environment.source_label.trim().toLowerCase() === requestedLabel),
    );
    if (environments.length !== 1) {
      return fail(
        "wrong_environment",
        environments.length === 0
          ? "No active Minecraft environment matches this digest request."
          : "More than one Minecraft environment matches; select its exact visible label.",
      );
    }
    const context = await deps.resolveContext({
      roomId,
      profileId,
      environmentBindingId: environments[0].environment_binding_id,
      participantId,
    });
    const requestedFreshness = input.arguments?.freshness_requirement_ms;
    const maxAgeMs =
      typeof requestedFreshness === "number" &&
      Number.isFinite(requestedFreshness)
        ? Math.floor(requestedFreshness)
        : 30_000;
    const producerPlane =
      input.arguments?.producer_plane === "world_authority"
        ? "world_authority"
        : "player_embodiment";
    const observation = await deps.readDigest({
      context,
      maxAgeMs,
      producerPlane,
    });
    const ok = observation.outcome === "fresh";
    return {
      ok,
      status: ok ? "completed" : "failed",
      summary: observation.summary,
      observation,
      executedArgs: {
        ...(requestedLabel
          ? { environment_label: input.arguments?.environment_label }
          : {}),
        producer_plane: producerPlane,
        freshness_requirement_ms: Math.max(1_000, Math.min(120_000, maxAgeMs)),
      },
      ...(!ok
        ? {
            error: observation.outcome,
            repairAction: environmentSituationDigestFailureRepairAction(
              observation.outcome,
            ),
          }
        : {}),
    };
  } catch (error) {
    const summary =
      error instanceof Error
        ? error.message
        : "The Minecraft situation digest could not be resolved.";
    const outcome = isEnvironmentActionBrokerError(error)
      ? error.code === "action_authority_not_found"
        ? "subject_binding_required"
        : "forbidden"
      : "unavailable";
    return fail(outcome, summary, "failed");
  }
};
