import crypto from "node:crypto";
import type {
  HelixAccountCapabilityPolicy,
  HelixAccountLinkedAccount,
  HelixAccountSession,
  HelixAccountSessionReceipt,
  HelixAccountSessionStatus,
  HelixAccountType,
  HelixAccountUsageSummary,
} from "@shared/helix-account-session";
import {
  buildHelixAccountCapabilityPolicy,
  HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
  HELIX_ACCOUNT_SESSION_SCHEMA,
  HELIX_ACCOUNT_SESSION_STATUS_SCHEMA,
} from "@shared/helix-account-session";
import { ensureDatabase, getPool, resetDbClient } from "../../db/client";
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

type AccountRow = {
  profile_id: string;
  display_name: string;
  email: string | null;
  account_type: string;
  provider: string;
  provider_subject: string | null;
  picture_url: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type SessionRow = {
  session_id: string;
  profile_id: string;
  status: string;
  memory_scope: string;
  account_policy: HelixAccountCapabilityPolicy | string;
  created_at: Date | string;
  updated_at: Date | string;
  expires_at: Date | string | null;
  display_name: string;
  email: string | null;
  account_type: string;
  provider: string;
  provider_subject: string | null;
  picture_url: string | null;
  account_created_at: Date | string;
  account_updated_at: Date | string;
};

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const nowIso = (): string => new Date().toISOString();

const iso = (value: Date | string | null | undefined): string =>
  value instanceof Date ? value.toISOString() : normalize(value) || nowIso();

const normalizeAccountType = (value: unknown): HelixAccountType | null => {
  const normalized = normalize(value).toLowerCase();
  return normalized === "developer" || normalized === "user" ? normalized : null;
};

const developerProfileIds = (): Set<string> =>
  new Set(
    normalize(process.env.HELIX_DEVELOPER_PROFILE_IDS)
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );

const isProductionRuntime = (): boolean => normalize(process.env.NODE_ENV).toLowerCase() === "production";

const policyForAccountType = (accountType: HelixAccountType): HelixAccountCapabilityPolicy =>
  buildHelixAccountCapabilityPolicy(accountType);

export function getDefaultAccountCapabilityPolicy(): HelixAccountCapabilityPolicy {
  return buildHelixAccountCapabilityPolicy("user");
}

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

function parsePolicy(value: SessionRow["account_policy"], accountType: HelixAccountType): HelixAccountCapabilityPolicy {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : policyForAccountType(accountType);
    } catch {
      return policyForAccountType(accountType);
    }
  }
  return value && typeof value === "object" ? value : policyForAccountType(accountType);
}

function sessionFromRow(row: SessionRow): HelixAccountSession {
  const accountType = normalizeAccountType(row.account_type) ?? "user";
  return {
    schema: HELIX_ACCOUNT_SESSION_SCHEMA,
    session_id: row.session_id,
    profile: {
      profile_id: row.profile_id,
      display_name: row.display_name,
      email: row.email,
      auth_mode:
        row.provider === "google"
          ? "web_auth"
          : row.provider_subject && row.provider_subject !== row.profile_id
            ? "local_password_profile"
            : "local_dev_profile",
      account_type: accountType,
      provider: row.provider === "google" ? "google" : "local",
      provider_subject: row.provider_subject,
      picture_url: row.picture_url,
      created_at: iso(row.account_created_at),
      updated_at: iso(row.account_updated_at),
    },
    account_policy: parsePolicy(row.account_policy, accountType),
    status: row.status === "signed_out" ? "signed_out" : "active",
    memory_scope: row.memory_scope === "browser_session" ? "browser_session" : "profile",
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
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

async function findAccountByProfileId(profileId: string): Promise<AccountRow | null> {
  await ensureDatabase();
  const { rows } = await getPool().query<AccountRow>(
    `SELECT * FROM helix_accounts WHERE profile_id = $1 AND deleted_at IS NULL`,
    [profileId],
  );
  return rows[0] ?? null;
}

async function resolveStoredAccountType(input: {
  profileId: string;
  requestedAccountType?: string | null;
  authMode: "web_auth" | "local_dev_profile" | "local_password_profile";
  devDefault?: boolean;
}): Promise<HelixAccountType> {
  const requested = normalizeAccountType(input.requestedAccountType);
  const existing = await findAccountByProfileId(input.profileId);
  const existingType = normalizeAccountType(existing?.account_type);
  if (existingType) return existingType;
  const envGrantsDeveloper = developerProfileIds().has(input.profileId);
  if (requested && input.authMode === "local_dev_profile") {
    if (requested === "developer" && isProductionRuntime() && !envGrantsDeveloper) return "user";
    return requested;
  }
  if (input.authMode === "local_dev_profile") return isProductionRuntime() && !envGrantsDeveloper ? "user" : "developer";
  if (input.authMode === "local_password_profile" && input.devDefault) return "developer";
  if (envGrantsDeveloper) return "developer";
  return "user";
}

async function upsertAccount(input: {
  profile_id: string;
  display_name: string;
  email?: string | null;
  account_type: HelixAccountType;
  provider: "local" | "google";
  provider_subject?: string | null;
  picture_url?: string | null;
}): Promise<AccountRow> {
  await ensureDatabase();
  const { rows } = await getPool().query<AccountRow>(
    `
      INSERT INTO helix_accounts (
        profile_id, display_name, email, account_type, provider, provider_subject, picture_url, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
      ON CONFLICT (profile_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        email = COALESCE(EXCLUDED.email, helix_accounts.email),
        account_type = EXCLUDED.account_type,
        provider = EXCLUDED.provider,
        provider_subject = EXCLUDED.provider_subject,
        picture_url = EXCLUDED.picture_url,
        deleted_at = NULL,
        updated_at = now()
      RETURNING *;
    `,
    [
      input.profile_id,
      input.display_name,
      input.email ?? null,
      input.account_type,
      input.provider,
      input.provider_subject ?? input.profile_id,
      input.picture_url ?? null,
    ],
  );
  const account = rows[0];
  if (input.provider_subject) {
    await getPool().query(
      `
        INSERT INTO helix_account_linked_providers (
          provider, provider_subject, profile_id, email, display_name, picture_url, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, now(), now())
        ON CONFLICT (provider, provider_subject) DO UPDATE SET
          profile_id = EXCLUDED.profile_id,
          email = EXCLUDED.email,
          display_name = EXCLUDED.display_name,
          picture_url = EXCLUDED.picture_url,
          updated_at = now();
      `,
      [
        input.provider,
        input.provider_subject,
        input.profile_id,
        input.email ?? null,
        input.display_name,
        input.picture_url ?? null,
      ],
    );
  }
  return account;
}

async function insertSession(input: {
  account: AccountRow;
  account_policy: HelixAccountCapabilityPolicy;
  memory_scope?: "profile" | "browser_session";
}): Promise<HelixAccountSession> {
  const sessionId = `account_session:${crypto.randomUUID()}`;
  await ensureDatabase();
  await getPool().query(
    `
      INSERT INTO helix_account_sessions (
        session_id, profile_id, status, memory_scope, account_policy, created_at, updated_at
      )
      VALUES ($1, $2, 'active', $3, $4::jsonb, now(), now())
    `,
    [
      sessionId,
      input.account.profile_id,
      input.memory_scope ?? "profile",
      JSON.stringify(input.account_policy),
    ],
  );
  const joined = await getSessionRowById(sessionId);
  if (!joined) throw new Error("account_session_insert_failed");
  return sessionFromRow(joined);
}

async function getSessionRowById(sessionId?: string | null): Promise<SessionRow | null> {
  const normalized = normalize(sessionId);
  if (!normalized) return null;
  await ensureDatabase();
  const { rows } = await getPool().query<SessionRow>(
    `
      SELECT
        s.*,
        a.display_name,
        a.email,
        a.account_type,
        a.provider,
        a.provider_subject,
        a.picture_url,
        a.created_at AS account_created_at,
        a.updated_at AS account_updated_at
      FROM helix_account_sessions s
      JOIN helix_accounts a ON a.profile_id = s.profile_id
      WHERE s.session_id = $1
        AND s.status = 'active'
        AND a.deleted_at IS NULL
        AND (s.expires_at IS NULL OR s.expires_at > now())
      LIMIT 1;
    `,
    [normalized],
  );
  return rows[0] ?? null;
}

export async function getAccountSessionById(sessionId?: string | null): Promise<HelixAccountSession | null> {
  const row = await getSessionRowById(sessionId);
  return row ? sessionFromRow(row) : null;
}

export async function getAccountSessionStatus(sessionId?: string | null): Promise<HelixAccountSessionStatus> {
  const session = sessionId ? await getAccountSessionById(sessionId) : null;
  const profileId = session?.profile.profile_id ?? null;
  const accountPolicy = session?.account_policy ?? getDefaultAccountCapabilityPolicy();
  return {
    schema: HELIX_ACCOUNT_SESSION_STATUS_SCHEMA,
    ok: true,
    session,
    account_policy: accountPolicy,
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

export async function signInLocalAccountSession(input: {
  profile_id?: string | null;
  display_name?: string | null;
  email?: string | null;
  account_type?: string | null;
}): Promise<HelixAccountSessionReceipt> {
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
  const accountType = await resolveStoredAccountType({
    requestedAccountType: input.account_type,
    profileId,
    authMode: "local_dev_profile",
  });
  const account = await upsertAccount({
    profile_id: profileId,
    display_name: normalize(input.display_name) || profileId,
    email: normalize(input.email) || null,
    account_type: accountType,
    provider: "local",
    provider_subject: profileId,
  });
  const session = await insertSession({
    account,
    account_policy: policyForAccountType(accountType),
  });
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

export async function signInLocalPasswordAccountSession(input: {
  username?: string | null;
  password?: string | null;
}): Promise<HelixAccountSessionReceipt> {
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
  const accountType = await resolveStoredAccountType({
    profileId: verification.config.profile_id,
    authMode: "local_password_profile",
    devDefault: verification.config.dev_default,
  });
  const account = await upsertAccount({
    profile_id: verification.config.profile_id,
    display_name: verification.config.display_name,
    email: verification.config.email,
    account_type: accountType,
    provider: "local",
    provider_subject: verification.config.username,
  });
  const session = await insertSession({
    account,
    account_policy: policyForAccountType(accountType),
  });
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

export async function signInWebAccountSession(input: {
  provider: "google";
  provider_subject?: string | null;
  display_name?: string | null;
  email?: string | null;
  picture_url?: string | null;
}): Promise<HelixAccountSessionReceipt> {
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
  const profileId = `${input.provider}:${providerSubject}`;
  const accountType = await resolveStoredAccountType({
    profileId,
    authMode: "web_auth",
  });
  const account = await upsertAccount({
    profile_id: profileId,
    display_name: normalize(input.display_name) || normalize(input.email) || "Google user",
    email: normalize(input.email) || null,
    account_type: accountType,
    provider: input.provider,
    provider_subject: providerSubject,
    picture_url: normalize(input.picture_url) || null,
  });
  const session = await insertSession({
    account,
    account_policy: policyForAccountType(accountType),
  });
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

export async function getAccountCapabilityPolicy(sessionId?: string | null): Promise<HelixAccountCapabilityPolicy> {
  const session = sessionId ? await getAccountSessionById(sessionId) : null;
  return session?.account_policy ?? getDefaultAccountCapabilityPolicy();
}

export async function signOutAccountSession(sessionId?: string | null): Promise<HelixAccountSessionReceipt> {
  const normalized = normalize(sessionId);
  const previous = normalized ? await getAccountSessionById(normalized) : null;
  if (normalized) {
    await ensureDatabase();
    await getPool().query(
      `UPDATE helix_account_sessions SET status = 'signed_out', updated_at = now() WHERE session_id = $1`,
      [normalized],
    );
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

export async function resetAccountSessionStore(): Promise<void> {
  await ensureDatabase();
  await getPool().query(`DELETE FROM helix_account_events`);
  await getPool().query(`DELETE FROM helix_account_profile_storage`);
  await getPool().query(`DELETE FROM helix_account_sessions`);
  await getPool().query(`DELETE FROM helix_account_linked_providers`);
  await getPool().query(`DELETE FROM helix_accounts`);
}

export async function resetAccountSessionStoreAndDb(): Promise<void> {
  await resetDbClient();
}
