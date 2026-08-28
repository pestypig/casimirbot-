import crypto from "node:crypto";
import {
  REALTIME_TEXTURE_PACK_HARNESS_ACTIONS,
  REALTIME_TEXTURE_PACK_HARNESS_LEASE_TTL_MS,
  REALTIME_TEXTURE_PACK_HARNESS_SCHEMA,
  type RealtimeTexturePackHarnessAction,
  type RealtimeTexturePackHarnessClientState,
} from "@shared/realtime-texture-pack-harness";

type CommandRecord = {
  command_id: string;
  action: RealtimeTexturePackHarnessAction;
  created_at: string;
  acknowledged_at: string | null;
  outcome: "completed" | "blocked" | null;
  failure_reason: string | null;
};

type LeaseRecord = {
  profile_id: string;
  session_id: string;
  allowed_actions: RealtimeTexturePackHarnessAction[];
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
  expires_at: lease ? new Date(lease.expires_at_ms).toISOString() : null,
  client_state: lease?.client_state ?? {
    capture_active: false,
    overlay_visible: false,
    session_status: "unavailable",
  },
  pending_command_count: lease?.commands.filter((entry) => !entry.acknowledged_at).length ?? 0,
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
    clientState: RealtimeTexturePackHarnessClientState;
  }) {
    const existing = activeLease(input.profileId);
    const lease: LeaseRecord = {
      profile_id: input.profileId,
      session_id: input.sessionId,
      allowed_actions: REALTIME_TEXTURE_PACK_HARNESS_ACTIONS.filter((action) =>
        input.allowedActions.includes(action)),
      expires_at_ms: Date.now() + REALTIME_TEXTURE_PACK_HARNESS_LEASE_TTL_MS,
      client_state: input.clientState,
      commands: existing?.session_id === input.sessionId ? existing.commands.slice(-32) : [],
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
      created_at: nowIso(),
      acknowledged_at: null,
      outcome: null,
      failure_reason: null,
    };
    lease.commands.push(command);
    return { ok: true as const, command: { command_id: command.command_id, action, created_at: command.created_at }, harness: projection(lease) };
  },
  poll(profileId: string, sessionId: string) {
    const lease = activeLease(profileId);
    if (!lease || lease.session_id !== sessionId) return { ok: false as const, error: "lease_unavailable", commands: [] };
    return {
      ok: true as const,
      commands: lease.commands.filter((entry) => !entry.acknowledged_at).slice(0, 8).map(({ command_id, action, created_at }) => ({ command_id, action, created_at })),
    };
  },
  acknowledge(input: { profileId: string; sessionId: string; commandId: string; outcome: "completed" | "blocked"; failureReason?: string | null }) {
    const lease = activeLease(input.profileId);
    if (!lease || lease.session_id !== input.sessionId) return false;
    const command = lease.commands.find((entry) => entry.command_id === input.commandId);
    if (!command) return false;
    command.acknowledged_at = nowIso();
    command.outcome = input.outcome;
    command.failure_reason = input.failureReason?.slice(0, 160) ?? null;
    return true;
  },
  resetForTests() { leases.clear(); },
};
