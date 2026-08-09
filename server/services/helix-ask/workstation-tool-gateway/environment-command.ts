import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_COMMAND_CATALOG_OBSERVATION_SCHEMA,
  HELIX_ENVIRONMENT_COMMAND_OBSERVATION_SCHEMA,
  HELIX_MINECRAFT_COMMAND_CATALOG_CAPABILITY,
  HELIX_MINECRAFT_COMMAND_CAPABILITY,
  helixEnvironmentCommandCategorySchema,
  helixEnvironmentCommandEffectClassSchema,
  type HelixEnvironmentCommandObservation,
} from "@shared/helix-environment-command";
import {
  listRoomEnvironmentProjections,
} from "../../environment-connectors/subjects";
import {
  awaitEnvironmentCommandObservation,
  enqueueEnvironmentCommand,
  isEnvironmentCommandBrokerError,
  readEnvironmentCommandCatalog,
  readEnvironmentCommandAuthority,
} from "../../environment-connectors/commands";
import type { HelixWorkstationGatewayAccountContext } from "./account-policy";
import type { HelixWorkstationCapabilityManifest } from "./types";
import { classifyKnownMinecraftCommand } from "./minecraft-command-risk";

export const HELIX_ENVIRONMENT_COMMAND_GATEWAY_ACTION =
  "room.environment.command" as const;
export const HELIX_ENVIRONMENT_COMMAND_CATALOG_GATEWAY_ACTION =
  "room.environment.command.catalog" as const;

export const environmentCommandCatalogMinecraftManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: HELIX_MINECRAFT_COMMAND_CATALOG_CAPABILITY,
  label: "Inspect the live Minecraft command catalog",
  description:
    "Reads the bounded, version-correct command paths published from the bound Minecraft server's live Brigadier dispatcher, including mod command roots. Use it to discover syntax before composing a command. It never executes a command and exposes no connector credentials or network identity.",
  panel_id: null,
  action_id: HELIX_ENVIRONMENT_COMMAND_CATALOG_GATEWAY_ACTION,
  mode: "observe",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      query: {
        type: "string",
        maxLength: 240,
        description: "Optional case-insensitive terms that all command paths must contain.",
      },
      path_prefix: {
        type: "string",
        maxLength: 1_000,
        description: "Optional command-path prefix, such as `execute` or a mod command root.",
      },
      limit: { type: "integer", minimum: 1, maximum: 128 },
      environment_label: {
        type: "string",
        minLength: 1,
        maxLength: 240,
        description:
          "Optional exact display label when the room has more than one command-enabled Minecraft environment.",
      },
    },
    required: [],
  },
  output_observation_schema: HELIX_ENVIRONMENT_COMMAND_CATALOG_OBSERVATION_SCHEMA,
  observation_schema: HELIX_ENVIRONMENT_COMMAND_CATALOG_OBSERVATION_SCHEMA,
  safety_tags: [
    "room_member_grant_required",
    "live_dispatcher_catalog",
    "version_correct",
    "mod_command_discovery",
    "read_only",
    "credentials_hidden",
    "no_shell",
    "no_code_mutation",
    "non_terminal",
  ],
  assistant_answer: false,
  raw_content_included: false,
};

export const environmentCommandMinecraftManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: HELIX_MINECRAFT_COMMAND_CAPABILITY,
  label: "Run a live Minecraft server command",
  description:
    "World Authority plane: parse and execute one exact command against the bound Minecraft server's live Brigadier dispatcher under the room owner's active authority profile. Use this plane for direct server, administration, or world-state command semantics. Do not substitute a server command such as teleport or effect for an admitted Player Embodiment walk, jump, navigate, look, interact, equipment, follow, collect, mine, place, craft, or inventory-transfer action when the user asked the paired client to perform it. If the required Player Embodiment capability is unavailable, preserve that typed limitation unless the user explicitly authorizes a World Authority alternative. Issue multiple user-requested actions as sequential capability calls, one observed command at a time; never send a commands array or join commands with semicolons. The installed rollback syntax is `helixgame checkpoint capture_box <name> <x1> <y1> <z1> <x2> <y2> <z2>`, `helixgame checkpoint restore <name>`, and `helixgame checkpoint status`. For a room member's bound player, use @s when the command plane is intended and runs from that player's source. Player-only arguments such as /title require @s, a literal player name, or a player selector such as @a; an @e selector remains an entity selector even when filtered by name. For unfamiliar or intricate syntax, first use docs.search with a goal-shaped query and environment_scope=active_room_environment, then use the live command catalog when the exact path or arguments remain uncertain. Do not add unrelated probes: observe only state materially needed to compose or verify the user's requested action. The connector verifies the exact category and effect before dispatch. This capability never grants host shell, filesystem, RCON, process, credential, or operating-system access.",
  panel_id: null,
  action_id: HELIX_ENVIRONMENT_COMMAND_GATEWAY_ACTION,
  mode: "act",
  mutating: true,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  // The gateway invocation itself is an act. The signed room authority and
  // member grant below it are the command-specific danger boundary; using the
  // gateway's unavailable `danger` mode here would make every command
  // unreachable before that exact policy can run.
  permission_profile_required: "act",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      command: {
        type: "string",
        minLength: 1,
        maxLength: 16_000,
        description:
          "Exactly one Minecraft World Authority command without a leading slash. Never use this field as an implicit replacement for an admitted paired-client Player Embodiment action. Never supply an array, join commands with semicolons, send a command batch, a shell command, or an RCON command. Checkpoint capture uses `helixgame checkpoint capture_box <name> <x1> <y1> <z1> <x2> <y2> <z2>`. When the command plane is explicitly intended for a room-bound player, prefer @s; never use @e for a player-only argument.",
      },
      category: {
        type: "string",
        description:
          "Declare the connector's risk category for an unknown or installed-mod command. Helix derives this server-side for recognized vanilla commands. Every read-only command uses `query`, even when it reads time, difficulty, a gamerule, worldborder state, tick state, entity data, inventory, or another semantic domain. Use `world_time_weather` only for commands that mutate those values. Server-originated communication commands such as `say`, `msg`, `tellraw`, and `title` use `server_administration`; use the other categories only for their mutating forms.",
        enum: [
          "query",
          "player_state",
          "player_inventory",
          "player_movement",
          "world_time_weather",
          "world_build",
          "entity_control",
          "server_administration",
          "mod_command",
        ],
      },
      effect: {
        type: "string",
        description:
          "Declare the expected effect for an unknown or installed-mod command. Helix derives this server-side for recognized vanilla commands. Use `read_only` for query forms such as `time query`, one-argument `gamerule`, `difficulty`, `worldborder get`, `tick query`, `data get`, `list`, `locate`, and `seed`. Use `server_administration` for server-originated communication. The live connector independently classifies the exact command and rejects any mismatch.",
        enum: [
          "read_only",
          "player_mutation",
          "world_mutation",
          "server_administration",
          "unknown",
        ],
      },
      environment_label: {
        type: "string",
        minLength: 1,
        maxLength: 240,
        description:
          "Optional exact display label when the room has more than one command-enabled Minecraft environment.",
      },
    },
    required: ["command"],
  },
  output_observation_schema: HELIX_ENVIRONMENT_COMMAND_OBSERVATION_SCHEMA,
  observation_schema: HELIX_ENVIRONMENT_COMMAND_OBSERVATION_SCHEMA,
  safety_tags: [
    "room_owner_authority_required",
    "member_grant_required",
    "live_dispatcher_parse_required",
    "exact_category_and_effect_match_required",
    "separate_command_credential",
    "one_shot_no_automatic_retry",
    "host_access_forbidden",
    "current_turn_evidence_reentry_required",
    "no_shell",
    "no_code_mutation",
    "non_terminal",
  ],
  assistant_answer: false,
  raw_content_included: false,
};

export type EnvironmentCommandGatewayExecution = {
  ok: boolean;
  status: "completed" | "blocked" | "failed";
  summary: string;
  observation: Record<string, unknown>;
  executedArgs?: Record<string, unknown>;
  idempotentReplay?: boolean;
  repairAction?: "repair" | "retry" | "ask_user";
  error?: string;
};

export const environmentCommandFailureRepairAction = (
  outcome: HelixEnvironmentCommandObservation["outcome"],
): "repair" | "retry" | "ask_user" => {
  if (
    [
      "command_parse_failed",
      "command_category_mismatch",
      "command_catalog_changed",
    ].includes(outcome)
  ) {
    return "repair";
  }
  if (
    [
      "failed",
      "connector_offline",
      "command_timeout",
      "command_outcome_unknown",
    ].includes(outcome)
  ) {
    return "retry";
  }
  return "ask_user";
};

export type EnvironmentCommandGatewayDependencies = {
  listRoomEnvironments: typeof listRoomEnvironmentProjections;
  readAuthority: typeof readEnvironmentCommandAuthority;
  readCatalog: typeof readEnvironmentCommandCatalog;
  enqueueCommand: typeof enqueueEnvironmentCommand;
  awaitObservation: typeof awaitEnvironmentCommandObservation;
};

const resolveDependencies = (
  overrides: Partial<EnvironmentCommandGatewayDependencies> = {},
): EnvironmentCommandGatewayDependencies => ({
  listRoomEnvironments:
    overrides.listRoomEnvironments ?? listRoomEnvironmentProjections,
  readAuthority: overrides.readAuthority ?? readEnvironmentCommandAuthority,
  readCatalog: overrides.readCatalog ?? readEnvironmentCommandCatalog,
  enqueueCommand: overrides.enqueueCommand ?? enqueueEnvironmentCommand,
  awaitObservation:
    overrides.awaitObservation ?? awaitEnvironmentCommandObservation,
});

type AuthorizedMinecraftEnvironment = {
  environmentBindingId: string;
  sourceLabel: string;
};

type MinecraftEnvironmentSelection =
  | { ok: true; target: AuthorizedMinecraftEnvironment }
  | {
      ok: false;
      error: "connector_offline" | "permission_revoked" | "wrong_environment";
      summary: string;
    };

const selectAuthorizedMinecraftEnvironment = async (input: {
  deps: EnvironmentCommandGatewayDependencies;
  roomId: string;
  profileId: string;
  requestedLabel: string;
  accessKind: "catalog" | "command";
}): Promise<MinecraftEnvironmentSelection> => {
  const environments = await input.deps.listRoomEnvironments({
    roomId: input.roomId,
    profileId: input.profileId,
  });
  const minecraftEnvironments = environments.filter(
    (environment) => environment.domain === "minecraft",
  );
  const activeEnvironments = minecraftEnvironments.filter(
    (environment) => environment.connection_status === "active",
  );
  if (activeEnvironments.length === 0) {
    return {
      ok: false,
      error: "connector_offline",
      summary:
        minecraftEnvironments.length === 0
          ? "This room has no bound Minecraft environment."
          : "This room has a Minecraft environment, but its source is not currently active.",
    };
  }

  const requestedLabel = input.requestedLabel.trim().toLowerCase();
  const exactLabelMatches = requestedLabel
    ? activeEnvironments.filter(
        (environment) =>
          environment.source_label.trim().toLowerCase() === requestedLabel,
      )
    : [];
  // The model-visible label is a disambiguation hint, not a provenance key.
  // Exact room, account, binding, and grant identity are resolved server-side.
  // A natural phrase such as "my paired Fabric world" must not block the sole
  // authorized environment, while multiple authorized worlds still require an
  // exact visible label and therefore fail closed on ambiguity.
  const authorityCandidates =
    requestedLabel && exactLabelMatches.length > 0
      ? exactLabelMatches
      : activeEnvironments;
  const authorized: AuthorizedMinecraftEnvironment[] = [];
  for (const environment of authorityCandidates) {
    const authority = await input.deps.readAuthority({
      roomId: input.roomId,
      profileId: input.profileId,
      environmentBindingId: environment.environment_binding_id,
    });
    if (
      authority.authority?.status === "active" &&
      authority.memberGrant?.status === "active"
    ) {
      authorized.push({
        environmentBindingId: environment.environment_binding_id,
        sourceLabel: environment.source_label,
      });
    }
  }
  if (authorized.length === 0) {
    return {
      ok: false,
      error: "permission_revoked",
      summary: `No active Minecraft environment grants this room member ${input.accessKind} access.`,
    };
  }
  if (authorized.length > 1) {
    return {
      ok: false,
      error: "wrong_environment",
      summary: `More than one Minecraft environment grants ${input.accessKind} access; select the exact environment label.`,
    };
  }
  if (
    requestedLabel &&
    exactLabelMatches.length === 0 &&
    authorized.length !== 1
  ) {
    return {
      ok: false,
      error: "wrong_environment",
      summary:
        "The requested Minecraft environment label does not match one uniquely authorized active room source.",
    };
  }
  return { ok: true, target: authorized[0] };
};

const roomIdFromThread = (threadId: string | null | undefined): string | null => {
  const prefix = "helix-ask:room:";
  const normalized = threadId?.trim() ?? "";
  return normalized.startsWith(prefix) ? normalized.slice(prefix.length).trim() : null;
};

export const executeEnvironmentCommandCatalogGatewayCapability = async (input: {
  turnId: string;
  toolCallId?: string | null;
  providerExecutionId?: string | null;
  arguments?: Record<string, unknown>;
  accountContext?: HelixWorkstationGatewayAccountContext | null;
  conversationThreadId?: string | null;
  dependencies?: Partial<EnvironmentCommandGatewayDependencies>;
}): Promise<EnvironmentCommandGatewayExecution> => {
  const deps = resolveDependencies(input.dependencies);
  const args = input.arguments ?? {};
  const account = input.accountContext;
  const profileId = account?.profile_id?.trim() ?? "";
  const session = account?.account_session;
  const roomId = roomIdFromThread(input.conversationThreadId);
  if (
    !account?.trusted_account_session ||
    !session ||
    session.status !== "active" ||
    session.profile.profile_id !== profileId ||
    !roomId ||
    !input.turnId.trim() ||
    !input.toolCallId?.trim() ||
    !input.providerExecutionId?.trim()
  ) {
    return {
      ok: false,
      status: "blocked",
      summary: "The live Minecraft command catalog requires an exact signed-in shared-room turn.",
      observation: {
        schema: "helix.environment_command.catalog_failure.v1",
        error: "permission_revoked",
        provenance_valid: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      error: "permission_revoked",
    };
  }
  try {
    const requestedLabel =
      typeof args.environment_label === "string"
        ? args.environment_label
        : "";
    const selection = await selectAuthorizedMinecraftEnvironment({
      deps,
      roomId,
      profileId,
      requestedLabel,
      accessKind: "catalog",
    });
    if (!selection.ok) {
      return {
        ok: false,
        status: "blocked",
        summary: selection.summary,
        observation: {
          schema: "helix.environment_command.catalog_failure.v1",
          error: selection.error,
          provenance_valid: false,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
        error: selection.error,
      };
    }
    const catalog = await deps.readCatalog({
      roomId,
      profileId,
      environmentBindingId: selection.target.environmentBindingId,
      query: typeof args.query === "string" ? args.query : "",
      pathPrefix: typeof args.path_prefix === "string" ? args.path_prefix : "",
      limit: typeof args.limit === "number" ? args.limit : 64,
    });
    const observedAt = new Date().toISOString();
    const observation = {
      schema: HELIX_ENVIRONMENT_COMMAND_CATALOG_OBSERVATION_SCHEMA,
      environment_label: selection.target.sourceLabel,
      game_version: catalog.gameVersion,
      command_tree_hash: catalog.commandTreeHash,
      root_command_count: catalog.rootCommandCount,
      query: typeof args.query === "string" ? args.query.trim() : "",
      path_prefix: typeof args.path_prefix === "string" ? args.path_prefix.trim() : "",
      nodes: catalog.nodes,
      matched_count: catalog.matchedCount,
      returned_count: catalog.nodes.length,
      catalog_truncated: catalog.truncated,
      snapshot_generated_at: catalog.generatedAt,
      observed_at: observedAt,
      provenance_valid: true,
      content_role: "environment_command_catalog_observation_not_assistant_answer" as const,
      reentry_required: true as const,
      answer_authority: false as const,
      assistant_answer: false as const,
      terminal_eligible: false as const,
      raw_content_included: false as const,
    };
    return {
      ok: true,
      status: "completed",
      summary: `The live Minecraft ${catalog.gameVersion} dispatcher catalog returned ${catalog.nodes.length} matching command path(s).`,
      observation,
    };
  } catch (error) {
    const code = isEnvironmentCommandBrokerError(error)
      ? error.code === "command_catalog_required"
        ? "command_catalog_changed"
        : error.code === "command_policy_denied"
          ? "permission_revoked"
          : "failed"
      : "failed";
    return {
      ok: false,
      status: "failed",
      summary: error instanceof Error ? error.message : "The live Minecraft command catalog could not be read.",
      observation: {
        schema: "helix.environment_command.catalog_failure.v1",
        error: code,
        provenance_valid: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      error: code,
    };
  }
};

const syntheticFailure = (input: {
  turnId: string;
  command: string;
  outcome: HelixEnvironmentCommandObservation["outcome"];
  summary: string;
}): HelixEnvironmentCommandObservation => {
  const hash = crypto
    .createHash("sha256")
    .update(`${input.turnId}\n${input.command}\n${input.outcome}`, "utf8")
    .digest("hex");
  return {
    schema: HELIX_ENVIRONMENT_COMMAND_OBSERVATION_SCHEMA,
    command_request_ref: `command_request_uncreated:${hash.slice(0, 40)}`,
    command_execution_ref: null,
    command_hash: `sha256:${crypto.createHash("sha256").update(input.command, "utf8").digest("hex")}`,
    command_root: input.command.trim().replace(/^\/+/, "").split(/\s+/u)[0] || "unknown",
    outcome: input.outcome,
    summary: input.summary,
    result: {},
    evidence_ref: `environment_command_failure:${hash.slice(0, 40)}`,
    post_state_evidence_refs: [],
    observed_at: new Date().toISOString(),
    provenance_valid: false,
    eligible_for_current_turn_reentry: false,
    content_role: "environment_command_observation_not_assistant_answer",
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const failed = (input: {
  turnId: string;
  command: string;
  outcome: HelixEnvironmentCommandObservation["outcome"];
  summary: string;
  status?: "blocked" | "failed";
}): EnvironmentCommandGatewayExecution => ({
  ok: false,
  status: input.status ?? "blocked",
  summary: input.summary,
  observation: syntheticFailure(input),
  repairAction: environmentCommandFailureRepairAction(input.outcome),
  error: input.outcome,
});

export const executeEnvironmentCommandGatewayCapability = async (input: {
  turnId: string;
  toolCallId?: string | null;
  providerExecutionId?: string | null;
  arguments?: Record<string, unknown>;
  accountContext?: HelixWorkstationGatewayAccountContext | null;
  conversationThreadId?: string | null;
  dependencies?: Partial<EnvironmentCommandGatewayDependencies>;
}): Promise<EnvironmentCommandGatewayExecution> => {
  const deps = resolveDependencies(input.dependencies);
  const args = input.arguments ?? {};
  const command = typeof args.command === "string"
    ? args.command.trim().replace(/^\/+/, "").trim()
    : "";
  const category = helixEnvironmentCommandCategorySchema.safeParse(args.category);
  const effect = helixEnvironmentCommandEffectClassSchema.safeParse(args.effect);
  const canonicalKnownRisk = classifyKnownMinecraftCommand(command);
  const declaredRisk = category.success && effect.success
    ? { category: category.data, effect: effect.data }
    : null;
  const effectiveRisk = canonicalKnownRisk ?? declaredRisk;
  const account = input.accountContext;
  const profileId = account?.profile_id?.trim() ?? "";
  const session = account?.account_session;
  const roomId = roomIdFromThread(input.conversationThreadId);
  const toolCallId = input.toolCallId?.trim() ?? "";
  const providerExecutionId = input.providerExecutionId?.trim() ?? "";
  if (!command) {
    const requestedCommands = Array.isArray(args.commands)
      ? args.commands
      : [];
    return failed({
      turnId: input.turnId,
      command,
      outcome: "command_parse_failed",
      status: "failed",
      summary:
        requestedCommands.length > 0
          ? "The Minecraft command capability accepts exactly one command string per tool call. Retry with the first command in `command`, observe it, then request each remaining command in a separate tool call."
          : "The Minecraft command capability requires exactly one non-empty command string in `command`.",
    });
  }
  if (
    !account?.trusted_account_session ||
    !session ||
    session.status !== "active" ||
    session.profile.profile_id !== profileId ||
    !roomId ||
    !toolCallId ||
    !providerExecutionId
  ) {
    return failed({
      turnId: input.turnId,
      command,
      outcome: "permission_revoked",
      summary:
        "The Minecraft command requires an exact signed-in room turn and provider tool-call identity.",
    });
  }
  if (!effectiveRisk) {
    return failed({
      turnId: input.turnId,
      command,
      outcome: "command_category_mismatch",
      status: "failed",
      summary:
        "Unknown and installed-mod Minecraft commands require an explicit category and effect; recognized vanilla commands are classified server-side.",
    });
  }
  const requestedCategory = effectiveRisk.category;
  const expectedEffect = effectiveRisk.effect;
  try {
    const requestedLabel =
      typeof args.environment_label === "string"
        ? args.environment_label
        : "";
    const selection = await selectAuthorizedMinecraftEnvironment({
      deps,
      roomId,
      profileId,
      requestedLabel,
      accessKind: "command",
    });
    if (!selection.ok) {
      return failed({
        turnId: input.turnId,
        command,
        outcome: selection.error,
        summary: selection.summary,
      });
    }
    const request = await deps.enqueueCommand({
      roomId,
      profileId,
      environmentBindingId: selection.target.environmentBindingId,
      runId: `first_party_shared_room:${crypto.createHash("sha256").update(`${profileId}\n${roomId}`).digest("hex").slice(0, 40)}`,
      turnId: input.turnId,
      providerExecutionId,
      toolCallId,
      commandText: command,
      requestedCategory,
      expectedEffect,
      // A provider retry must not physically execute the same command twice.
      // The broker already scopes idempotency to the active command authority;
      // turn + canonical command therefore identifies this execution attempt.
      idempotencyKey: `room-command:${crypto.createHash("sha256").update(`${input.turnId}\n${command}`).digest("hex")}`,
      confirmationState: "not_required",
      deadlineMs: 15_000,
    });
    const observation = await deps.awaitObservation({
      requestId: request.command_request_id,
      deadlineAt: request.deadline_at,
    });
    const idempotentReplay =
      typeof request.tool_call_id === "string" &&
      request.tool_call_id.trim().length > 0 &&
      request.tool_call_id !== toolCallId;
    return {
      ok:
        observation.outcome === "succeeded" &&
        observation.provenance_valid &&
        observation.eligible_for_current_turn_reentry,
      status: observation.outcome === "succeeded" ? "completed" : "failed",
      summary: idempotentReplay
        ? `Helix did not execute the duplicate Minecraft command again; it re-entered the existing current-turn observation. ${observation.summary}`
        : observation.summary,
      observation,
      idempotentReplay,
      ...(observation.outcome === "succeeded"
        ? {
            executedArgs: {
              command,
              category: requestedCategory,
              effect: expectedEffect,
              idempotent_replay: idempotentReplay,
              physical_execution_performed: !idempotentReplay,
              ...(typeof args.environment_label === "string" &&
              args.environment_label.trim()
                ? { environment_label: args.environment_label.trim() }
                : {}),
            },
          }
        : {}),
      ...(observation.outcome === "succeeded"
        ? {}
        : {
            error: observation.outcome,
            repairAction: environmentCommandFailureRepairAction(
              observation.outcome,
            ),
          }),
    };
  } catch (error) {
    return failed({
      turnId: input.turnId,
      command,
      outcome: isEnvironmentCommandBrokerError(error)
        ? error.code === "command_request_expired"
          ? "command_outcome_unknown"
          : error.code === "command_catalog_required"
            ? "command_catalog_changed"
            : error.code === "command_policy_denied"
              ? "permission_revoked"
              : "failed"
        : "failed",
      summary:
        error instanceof Error
          ? error.message
          : "The Minecraft command lane failed before current-turn evidence re-entry.",
      status: "failed",
    });
  }
};
