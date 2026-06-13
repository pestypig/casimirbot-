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
import {
  resolveLocalPasswordProfileAuthConfig,
  verifyLocalPasswordProfileCredentials,
} from "./local-password-profile-auth";

let activeSession: HelixAccountSession | null = null;
const sessionsById = new Map<string, HelixAccountSession>();

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

function buildLinkedAccounts(session: HelixAccountSession | null): HelixAccountLinkedAccount[] {
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
  const profileAccount: HelixAccountLinkedAccount | null = session
    ? {
        provider: session.profile.provider === "google" ? "google" : "local",
        external_id: session.profile.provider_subject ?? session.profile.profile_id,
        display_name: session.profile.display_name,
        status: "linked",
        authority: "owner",
        linked_at: session.created_at,
      }
    : null;
  return profileAccount
    ? [
        profileAccount,
        ...discordAccounts,
      ]
    : discordAccounts;
}

export function getAccountSessionById(sessionId?: string | null): HelixAccountSession | null {
  const normalized = normalize(sessionId);
  if (normalized) {
    return sessionsById.get(normalized) ?? null;
  }
  return null;
}

export function getAccountSessionStatus(sessionId?: string | null): HelixAccountSessionStatus {
  const session = getAccountSessionById(sessionId) ?? activeSession;
  const profileId = session?.profile.profile_id ?? null;
  return {
    schema: HELIX_ACCOUNT_SESSION_STATUS_SCHEMA,
    ok: true,
    session,
    linked_accounts: buildLinkedAccounts(session),
    profile_ingress_tokens: listProfileIngressTokens(profileId),
    profile_ingress_usage: getProfileIngressUsage(profileId),
    usage: buildUsageSummary(),
    auth_boundary: {
      credential_collection_allowed_in_agents: false,
      raw_password_stored: false,
      discord_bot_password_collection_allowed: false,
      recommended_flow: resolveLocalPasswordProfileAuthConfig().enabled
        ? "dev_local_password_profile"
        : "web_auth_or_oauth_link",
      local_password_profile_available: resolveLocalPasswordProfileAuthConfig().enabled,
      local_password_profile_dev_default: resolveLocalPasswordProfileAuthConfig().dev_default,
    },
  };
}

function rememberSession(session: HelixAccountSession): HelixAccountSession {
  sessionsById.set(session.session_id, session);
  activeSession = session;
  return session;
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
  const session: HelixAccountSession = {
    schema: HELIX_ACCOUNT_SESSION_SCHEMA,
    session_id: `account_session:${crypto.randomUUID()}`,
    profile: {
      profile_id: profileId,
      display_name: normalize(input.display_name) || profileId,
      email: normalize(input.email) || null,
      auth_mode: "local_dev_profile",
      provider: "local",
      provider_subject: profileId,
      picture_url: null,
      created_at: now,
      updated_at: now,
    },
    status: "active",
    memory_scope: "profile",
    created_at: now,
    updated_at: now,
  };
  rememberSession(session);
  return {
    schema: HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
    ok: true,
    session,
    message: "Local workstation profile session started. Production auth should use web/OAuth handoff.",
    error: null,
    raw_password_stored: false,
    credential_collection_allowed_in_agents: false,
    auth_method: "local_dev_profile",
  };
}

export function signInLocalPasswordAccountSession(input: {
  username?: string | null;
  password?: string | null;
}): HelixAccountSessionReceipt {
  const verification = verifyLocalPasswordProfileCredentials({
    username: input.username,
    password: input.password,
  });
  if (!verification.ok) {
    return {
      schema: HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
      ok: false,
      session: null,
      message:
        verification.error === "local_password_profile_disabled"
          ? "Local password profile sign-in is disabled."
          : verification.error === "local_password_profile_misconfigured"
            ? "Local password profile sign-in is misconfigured."
            : "Local profile username or password is incorrect.",
      error: verification.error,
      raw_password_stored: false,
      credential_collection_allowed_in_agents: false,
      auth_method: "local_password_profile",
    };
  }
  const now = nowIso();
  const session: HelixAccountSession = {
    schema: HELIX_ACCOUNT_SESSION_SCHEMA,
    session_id: `account_session:${crypto.randomUUID()}`,
    profile: {
      profile_id: verification.config.profile_id,
      display_name: verification.config.display_name,
      email: verification.config.email,
      auth_mode: "local_password_profile",
      provider: "local",
      provider_subject: verification.config.username,
      picture_url: null,
      created_at: now,
      updated_at: now,
    },
    status: "active",
    memory_scope: "profile",
    created_at: now,
    updated_at: now,
  };
  rememberSession(session);
  return {
    schema: HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
    ok: true,
    session,
    message: verification.config.dev_default
      ? "Signed in with the development local admin profile. Configure HELIX_LOCAL_PROFILE_PASSWORD_HASH before using this outside localhost."
      : "Signed in with local password profile.",
    error: null,
    raw_password_stored: false,
    credential_collection_allowed_in_agents: false,
    auth_method: "local_password_profile",
  };
}

export function signInWebAccountSession(input: {
  provider: "google";
  provider_subject?: string | null;
  display_name?: string | null;
  email?: string | null;
  picture_url?: string | null;
}): HelixAccountSessionReceipt {
  const providerSubject = normalize(input.provider_subject);
  if (!providerSubject) {
    return {
      schema: HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
      ok: false,
      session: null,
      message: "A verified provider subject is required to start a web account session.",
      error: "missing_provider_subject",
      raw_password_stored: false,
      credential_collection_allowed_in_agents: false,
    };
  }
  const now = nowIso();
  const profileId = `${input.provider}:${providerSubject}`;
  const session: HelixAccountSession = {
    schema: HELIX_ACCOUNT_SESSION_SCHEMA,
    session_id: `account_session:${crypto.randomUUID()}`,
    profile: {
      profile_id: profileId,
      display_name: normalize(input.display_name) || normalize(input.email) || "Google user",
      email: normalize(input.email) || null,
      auth_mode: "web_auth",
      provider: input.provider,
      provider_subject: providerSubject,
      picture_url: normalize(input.picture_url) || null,
      created_at: now,
      updated_at: now,
    },
    status: "active",
    memory_scope: "profile",
    created_at: now,
    updated_at: now,
  };
  rememberSession(session);
  return {
    schema: HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
    ok: true,
    session,
    message: "Signed in with Google.",
    error: null,
    raw_password_stored: false,
    credential_collection_allowed_in_agents: false,
    auth_method: "web_auth",
  };
}

export function signOutAccountSession(sessionId?: string | null): HelixAccountSessionReceipt {
  const normalized = normalize(sessionId);
  const previous = normalized ? sessionsById.get(normalized) ?? null : activeSession;
  if (normalized) {
    sessionsById.delete(normalized);
  }
  if (!normalized || activeSession?.session_id === normalized) {
    activeSession = null;
  }
  return {
    schema: HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
    ok: true,
    session: previous ? { ...previous, status: "signed_out", updated_at: nowIso() } : null,
    message: previous ? "Workstation profile session signed out." : "No active workstation profile session.",
    error: null,
    raw_password_stored: false,
    credential_collection_allowed_in_agents: false,
    auth_method: previous?.profile.auth_mode ?? null,
  };
}

export function resetAccountSessionStore(): void {
  activeSession = null;
  sessionsById.clear();
}
