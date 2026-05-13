import crypto from "node:crypto";
import type {
  HelixAccountLinkedAccount,
  HelixAccountSession,
  HelixAccountSessionReceipt,
  HelixAccountSessionStatus,
  HelixAccountUsageSummary,
} from "@shared/helix-account-session";
import {
  HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
  HELIX_ACCOUNT_SESSION_SCHEMA,
  HELIX_ACCOUNT_SESSION_STATUS_SCHEMA,
} from "@shared/helix-account-session";
import { getHelixThreadLedgerEvents } from "../helix-thread/ledger";
import { listDiscordVoiceSessions } from "../situation-room/discord-session-store";
import {
  getProfileIngressUsage,
  listProfileIngressTokens,
} from "./profile-ingress-store";

let activeSession: HelixAccountSession | null = null;

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const nowIso = (): string => new Date().toISOString();

function buildUsageSummary(): HelixAccountUsageSummary {
  const events = getHelixThreadLedgerEvents({ limit: 5000 });
  const itemEvents = events.filter((event) => event.event_type === "item_completed");
  const threadIds = new Set(events.map((event) => event.thread_id).filter(Boolean));
  const estimatedTokens = events.reduce((sum, event) => {
    const text = [
      event.user_text,
      event.assistant_text,
      event.delta_text,
      JSON.stringify(event.observation_ref ?? {}),
    ].join(" ");
    return sum + Math.ceil(text.length / 4);
  }, 0);
  return {
    thread_count: threadIds.size,
    item_count: itemEvents.length,
    answer_count: itemEvents.filter((event) => event.item_type === "answer").length,
    tool_observation_count: itemEvents.filter((event) => event.item_type === "toolObservation").length,
    validation_count: itemEvents.filter((event) => event.item_type === "validation").length,
    estimated_token_count: estimatedTokens,
    window_started_at: events[0]?.ts ?? nowIso(),
    window_ended_at: events.at(-1)?.ts ?? nowIso(),
  };
}

function buildLinkedAccounts(): HelixAccountLinkedAccount[] {
  const discordAccounts = listDiscordVoiceSessions()
    .filter((session) => session.commander_discord_user_id || session.status === "link_pending")
    .map<HelixAccountLinkedAccount>((session) => ({
      provider: "discord",
      external_id: session.commander_discord_user_id ?? session.session_id,
      display_name:
        session.participants.find(
          (participant) => participant.discord_user_id === session.commander_discord_user_id,
        )?.display_name ?? session.voice_channel_id,
      status: session.status === "link_pending" ? "pending" : "linked",
      authority: session.commander_discord_user_id ? "commander" : "viewer",
      linked_at: session.updated_at,
    }));
  return activeSession
    ? [
        {
          provider: "local",
          external_id: activeSession.profile.profile_id,
          display_name: activeSession.profile.display_name,
          status: "linked",
          authority: "owner",
          linked_at: activeSession.created_at,
        },
        ...discordAccounts,
      ]
    : discordAccounts;
}

export function getAccountSessionStatus(): HelixAccountSessionStatus {
  const profileId = activeSession?.profile.profile_id ?? null;
  return {
    schema: HELIX_ACCOUNT_SESSION_STATUS_SCHEMA,
    ok: true,
    session: activeSession,
    linked_accounts: buildLinkedAccounts(),
    profile_ingress_tokens: listProfileIngressTokens(profileId),
    profile_ingress_usage: getProfileIngressUsage(profileId),
    usage: buildUsageSummary(),
    auth_boundary: {
      credential_collection_allowed_in_agents: false,
      raw_password_stored: false,
      discord_bot_password_collection_allowed: false,
      recommended_flow: "web_auth_or_oauth_link",
    },
  };
}

export function signInLocalAccountSession(input: {
  profile_id?: string | null;
  display_name?: string | null;
  email?: string | null;
}): HelixAccountSessionReceipt {
  const profileId = normalize(input.profile_id) || normalize(input.email);
  if (!profileId) {
    return {
      schema: HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
      ok: false,
      session: null,
      message: "Profile ID or email is required to start a local workstation session.",
      error: "missing_profile_id",
      raw_password_stored: false,
      credential_collection_allowed_in_agents: false,
    };
  }
  const now = nowIso();
  activeSession = {
    schema: HELIX_ACCOUNT_SESSION_SCHEMA,
    session_id: `account_session:${crypto.randomUUID()}`,
    profile: {
      profile_id: profileId,
      display_name: normalize(input.display_name) || profileId,
      email: normalize(input.email) || null,
      auth_mode: "local_dev_profile",
      created_at: now,
      updated_at: now,
    },
    status: "active",
    memory_scope: "profile",
    created_at: now,
    updated_at: now,
  };
  return {
    schema: HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
    ok: true,
    session: activeSession,
    message: "Local workstation profile session started. Production auth should use web/OAuth handoff.",
    error: null,
    raw_password_stored: false,
    credential_collection_allowed_in_agents: false,
  };
}

export function signOutAccountSession(): HelixAccountSessionReceipt {
  const previous = activeSession;
  activeSession = null;
  return {
    schema: HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
    ok: true,
    session: previous ? { ...previous, status: "signed_out", updated_at: nowIso() } : null,
    message: previous ? "Workstation profile session signed out." : "No active workstation profile session.",
    error: null,
    raw_password_stored: false,
    credential_collection_allowed_in_agents: false,
  };
}

export function resetAccountSessionStore(): void {
  activeSession = null;
}
