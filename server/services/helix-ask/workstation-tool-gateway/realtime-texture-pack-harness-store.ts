import crypto from "node:crypto";
import {
  REALTIME_TEXTURE_PACK_HARNESS_ACTIONS,
  REALTIME_TEXTURE_PACK_HARNESS_LEASE_TTL_MS,
  REALTIME_TEXTURE_PACK_HARNESS_SCHEMA,
  REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMMANDS,
  REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_MAX_DIRECTIVE_LENGTH,
  type RealtimeTexturePackHarnessAction,
  type RealtimeTexturePackHarnessClientState,
  type RealtimeTexturePackVisualDirectionCommandArguments,
  type RealtimeTexturePackVisualDirectionCommandKind,
} from "@shared/realtime-texture-pack-harness";

type CommandRecord = {
  command_id: string;
  action: RealtimeTexturePackHarnessAction | RealtimeTexturePackVisualDirectionCommandKind;
  arguments: RealtimeTexturePackVisualDirectionCommandArguments | null;
  expected_configuration_revision: number | null;
  created_at: string;
  acknowledged_at: string | null;
  outcome: "completed" | "blocked" | null;
  failure_reason: string | null;
  applied_configuration_revision: number | null;
  directive_hash: string | null;
};

type LeaseRecord = {
  profile_id: string;
  session_id: string;
  allowed_actions: RealtimeTexturePackHarnessAction[];
  visual_direction_control_enabled: boolean;
  allowed_visual_direction_commands: RealtimeTexturePackVisualDirectionCommandKind[];
  expires_at_ms: number;
  client_state: RealtimeTexturePackHarnessClientState;
  commands: CommandRecord[];
};

const leases = new Map<string, LeaseRecord>();
const nowIso = () => new Date().toISOString();
const activeLease = (profileId: string): LeaseRecord | null => {
  const lease = leases.get(profileId) ?? null;
  if (lease && lease.expires_at_ms <= Date.now()) {
    leases.delete(profileId);
    return null;
  }
  return lease;
};
const projection = (lease: LeaseRecord | null) => ({
  schema: REALTIME_TEXTURE_PACK_HARNESS_SCHEMA,
  lease_active: Boolean(lease),
  session_id: lease?.session_id ?? null,
  allowed_actions: lease?.allowed_actions ?? [],
  visual_direction_control_enabled: lease?.visual_direction_control_enabled ?? false,
  allowed_visual_direction_commands: lease?.allowed_visual_direction_commands ?? [],
  expires_at: lease ? new Date(lease.expires_at_ms).toISOString() : null,
  client_state: lease?.client_state ?? {
    capture_active: false,
    overlay_visible: false,
    session_status: "unavailable",
  },
  pending_command_count: lease?.commands.filter((entry) => !entry.acknowledged_at).length ?? 0,
  latest_applied_visual_direction_receipt: lease
    ? [...lease.commands].reverse().find((entry) =>
        entry.acknowledged_at &&
        entry.applied_configuration_revision !== null &&
        REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMMANDS.includes(
          entry.action as RealtimeTexturePackVisualDirectionCommandKind,
        ),
      )
      ? (() => {
          const entry = [...lease.commands].reverse().find((candidate) =>
            candidate.acknowledged_at && candidate.applied_configuration_revision !== null &&
            REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMMANDS.includes(
              candidate.action as RealtimeTexturePackVisualDirectionCommandKind,
            ),
          )!;
          return {
            command_id: entry.command_id,
            command: entry.action,
            outcome: entry.outcome,
            applied_configuration_revision: entry.applied_configuration_revision,
            directive_hash: entry.directive_hash,
            acknowledged_at: entry.acknowledged_at,
            failure_reason: entry.failure_reason,
          };
        })()
      : null
    : null,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

export const realtimeTexturePackHarnessStore = {
  inspect(profileId: string) {
    return projection(activeLease(profileId));
  },
  renew(input: {
    profileId: string;
    sessionId: string;
    allowedActions: RealtimeTexturePackHarnessAction[];
    visualDirectionControlEnabled?: boolean;
    allowedVisualDirectionCommands?: RealtimeTexturePackVisualDirectionCommandKind[];
    clientState: RealtimeTexturePackHarnessClientState;
  }) {
    const existing = activeLease(input.profileId);
    const allowedActions = REALTIME_TEXTURE_PACK_HARNESS_ACTIONS.filter((action) =>
      input.allowedActions.includes(action));
    const allowedVisualCommands = input.visualDirectionControlEnabled === true
      ? REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMMANDS.filter((command) =>
          input.allowedVisualDirectionCommands?.includes(command))
      : [];
    const retainedCommands = existing?.session_id === input.sessionId
      ? existing.commands.filter((command) =>
          command.acknowledged_at !== null ||
          allowedActions.includes(command.action as RealtimeTexturePackHarnessAction) ||
          allowedVisualCommands.includes(command.action as RealtimeTexturePackVisualDirectionCommandKind),
        ).slice(-32)
      : [];
    const lease: LeaseRecord = {
      profile_id: input.profileId,
      session_id: input.sessionId,
      allowed_actions: allowedActions,
      visual_direction_control_enabled: input.visualDirectionControlEnabled === true,
      allowed_visual_direction_commands: allowedVisualCommands,
      expires_at_ms: Date.now() + REALTIME_TEXTURE_PACK_HARNESS_LEASE_TTL_MS,
      client_state: input.clientState,
      commands: retainedCommands,
    };
    leases.set(input.profileId, lease);
    return projection(lease);
  },
  revoke(profileId: string, sessionId?: string | null) {
    const lease = activeLease(profileId);
    if (lease && (!sessionId || lease.session_id === sessionId)) leases.delete(profileId);
    return projection(activeLease(profileId));
  },
  enqueue(profileId: string, action: RealtimeTexturePackHarnessAction) {
    const lease = activeLease(profileId);
    if (!lease) return { ok: false as const, error: "active_user_lease_required", harness: projection(null) };
    if (!lease.client_state.capture_active) {
      return { ok: false as const, error: "capture_not_active", harness: projection(lease) };
    }
    if (!lease.allowed_actions.includes(action)) {
      return { ok: false as const, error: "action_not_allowed_by_user", harness: projection(lease) };
    }
    const command: CommandRecord = {
      command_id: `rtp-command:${crypto.randomUUID()}`,
      action,
      arguments: null,
      expected_configuration_revision: null,
      created_at: nowIso(),
      acknowledged_at: null,
      outcome: null,
      failure_reason: null,
      applied_configuration_revision: null,
      directive_hash: null,
    };
    lease.commands.push(command);
    return { ok: true as const, command: { command_id: command.command_id, action, created_at: command.created_at }, harness: projection(lease) };
  },
  enqueueVisualDirection(input: {
    profileId: string;
    arguments: RealtimeTexturePackVisualDirectionCommandArguments;
    expectedConfigurationRevision: number;
  }) {
    const lease = activeLease(input.profileId);
    if (!lease) return { ok: false as const, error: "active_user_lease_required", harness: projection(null) };
    if (!lease.client_state.capture_active) {
      return { ok: false as const, error: "capture_not_active", harness: projection(lease) };
    }
    if (!lease.visual_direction_control_enabled) {
      return { ok: false as const, error: "visual_direction_control_not_enabled", harness: projection(lease) };
    }
    if (lease.client_state.visual_direction?.control_enabled !== true) {
      return { ok: false as const, error: "visual_direction_client_not_enabled", harness: projection(lease) };
    }
    if (!lease.allowed_visual_direction_commands.includes(input.arguments.command)) {
      return { ok: false as const, error: "visual_direction_command_not_allowed_by_user", harness: projection(lease) };
    }
    const currentRevision = lease.client_state.visual_direction?.configuration_revision ?? 0;
    if (!Number.isInteger(input.expectedConfigurationRevision) ||
        input.expectedConfigurationRevision !== currentRevision) {
      return { ok: false as const, error: "visual_direction_configuration_revision_mismatch", harness: projection(lease) };
    }
    if (
      input.arguments.command === "set_custom_visual_directive" &&
      input.arguments.custom_visual_directive.trim().length >
        REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_MAX_DIRECTIVE_LENGTH
    ) {
      return { ok: false as const, error: "visual_direction_directive_too_long", harness: projection(lease) };
    }
    const directiveHash = input.arguments.command === "set_custom_visual_directive"
      ? `sha256:${crypto.createHash("sha256").update(input.arguments.custom_visual_directive.trim(), "utf8").digest("hex")}`
      : null;
    const command: CommandRecord = {
      command_id: `rtp-command:${crypto.randomUUID()}`,
      action: input.arguments.command,
      arguments: input.arguments,
      expected_configuration_revision: input.expectedConfigurationRevision,
      created_at: nowIso(),
      acknowledged_at: null,
      outcome: null,
      failure_reason: null,
      applied_configuration_revision: null,
      directive_hash: directiveHash,
    };
    lease.commands.push(command);
    const receipt = {
      command_id: command.command_id,
      command: input.arguments.command,
      expected_configuration_revision: input.expectedConfigurationRevision,
      directive_hash: directiveHash,
      created_at: command.created_at,
    };
    return { ok: true as const, receipt, harness: projection(lease) };
  },
  poll(profileId: string, sessionId: string) {
    const lease = activeLease(profileId);
    if (!lease || lease.session_id !== sessionId) return { ok: false as const, error: "lease_unavailable", commands: [] };
    return {
      ok: true as const,
      commands: lease.commands.filter((entry) => !entry.acknowledged_at).slice(0, 8).map(({
        command_id, action, arguments: commandArguments,
        expected_configuration_revision, created_at,
      }) => ({
        command_id,
        action,
        created_at,
        ...(commandArguments ? { arguments: commandArguments } : {}),
        ...(expected_configuration_revision !== null
          ? { expected_configuration_revision }
          : {}),
      })),
    };
  },
  acknowledge(input: {
    profileId: string;
    sessionId: string;
    commandId: string;
    outcome: "completed" | "blocked";
    failureReason?: string | null;
    appliedConfigurationRevision?: number | null;
    clientState?: RealtimeTexturePackHarnessClientState;
  }) {
    const lease = activeLease(input.profileId);
    if (!lease || lease.session_id !== input.sessionId) return false;
    const command = lease.commands.find((entry) => entry.command_id === input.commandId);
    if (!command) return false;
    if (command.acknowledged_at) return false;
    const isVisualDirection = REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMMANDS.includes(
      command.action as RealtimeTexturePackVisualDirectionCommandKind,
    );
    if (isVisualDirection && input.outcome === "completed") {
      const expectedApplied = (command.expected_configuration_revision ?? -1) + 1;
      if (input.appliedConfigurationRevision !== expectedApplied || !input.clientState?.visual_direction ||
          input.clientState.visual_direction.configuration_revision !== expectedApplied) {
        return false;
      }
      lease.client_state = input.clientState;
      command.applied_configuration_revision = expectedApplied;
    }
    command.acknowledged_at = nowIso();
    command.outcome = input.outcome;
    command.failure_reason = input.failureReason?.slice(0, 160) ?? null;
    return true;
  },
  resetForTests() { leases.clear(); },
};
