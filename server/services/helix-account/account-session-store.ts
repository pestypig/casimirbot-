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
import {
  createPasswordAccountHash,
  isValidAccountEmail,
  isValidAccountPassword,
  normalizeAccountEmail,
  publicProfileIdForEmail,
  verifyPasswordAccountHash,
} from "./password-account-auth";
import {
  buildAccountActionUrl,
  enqueueAccountEmail,
  isLocalEmailDeliveryMode,
} from "../email/email-outbox";

type AccountRow = {
  profile_id: string;
  display_name: string;
  email: string | null;
  email_verified_at: Date | string | null;
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
  email_verified_at: Date | string | null;
  account_type: string;
  provider: string;
  provider_subject: string | null;
  picture_url: string | null;
  account_created_at: Date | string;
  account_updated_at: Date | string;
};

type CredentialRow = {
  credential_id: string;
  profile_id: string;
  credential_type: string;
  subject: string;
  password_hash: string | null;
  expires_at: Date | string | null;
  consumed_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type AccountActionTokenReceipt = {
  ok: boolean;
  message: string;
  error: string | null;
  token_value_shown_once: boolean;
  token_value?: string | null;
  expires_at?: string | null;
  email_delivery?: {
    queued: boolean;
    provider: string | null;
    status: string | null;
  };
  raw_secret_stored: false;
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

const normalizedDeveloperWhitelist = (): Set<string> =>
  new Set(Array.from(developerProfileIds()).map((entry) => entry.toLowerCase()));

const developerWhitelistMatches = (...values: Array<string | null | undefined>): boolean => {
  const whitelist = normalizedDeveloperWhitelist();
  return values.some((value) => {
    const normalized = normalize(value).toLowerCase();
    return normalized ? whitelist.has(normalized) : false;
  });
};

const isProductionRuntime = (): boolean => normalize(process.env.NODE_ENV).toLowerCase() === "production";

const policyForAccountType = (accountType: HelixAccountType): HelixAccountCapabilityPolicy =>
  buildHelixAccountCapabilityPolicy(accountType);

const hashAccountActionToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("base64url");

const createAccountActionTokenValue = (prefix: string): string =>
  `${prefix}_${crypto.randomBytes(24).toString("base64url")}`;

const tokenExpiryIso = (ttlMs: number): string =>
  new Date(Date.now() + ttlMs).toISOString();

const PASSWORD_RESET_HINT_THRESHOLD = 3;
const PASSWORD_RESET_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const PASSWORD_RESET_RATE_LIMIT_MAX = 5;
const PASSWORD_RESET_RATE_LIMIT_COOLDOWN_MS = 15 * 60 * 1000;
const GENERIC_PASSWORD_SIGN_IN_FAILURE_MESSAGE = "Sign-in failed. Check your email and password.";
const GENERIC_PASSWORD_RESET_REQUEST_MESSAGE =
  "If a workstation profile exists for that email, a password reset link has been sent.";

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

function sessionFromRow(row: SessionRow): HelixAccountSession {
  const accountType = normalizeAccountType(row.account_type) ?? "user";
  return {
    schema: HELIX_ACCOUNT_SESSION_SCHEMA,
    session_id: row.session_id,
    profile: {
      profile_id: row.profile_id,
      display_name: row.display_name,
      email: row.email,
      email_verified_at: row.email_verified_at ? iso(row.email_verified_at) : null,
      auth_mode:
        row.provider === "google"
          ? "web_auth"
          : row.provider === "password"
            ? "password_account"
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
    // Authorization follows the current account-type policy. The stored JSON is
    // a session snapshot and must not preserve retired locks after deployment.
    account_policy: policyForAccountType(accountType),
    status: row.status === "signed_out" ? "signed_out" : "active",
    memory_scope: row.memory_scope === "session_only" ? "session_only" : "profile",
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
  email?: string | null;
  providerSubject?: string | null;
  requestedAccountType?: string | null;
  authMode: "web_auth" | "local_dev_profile" | "local_password_profile" | "password_account";
  devDefault?: boolean;
}): Promise<HelixAccountType> {
  const requested = normalizeAccountType(input.requestedAccountType);
  const existing = await findAccountByProfileId(input.profileId);
  const existingType = normalizeAccountType(existing?.account_type);
  const envGrantsDeveloper = developerWhitelistMatches(input.profileId, input.email, input.providerSubject);
  if (envGrantsDeveloper) return "developer";
  if (existingType) return existingType === "developer" && isProductionRuntime() ? "user" : existingType;
  if (requested && input.authMode === "local_dev_profile") {
    if (requested === "developer" && isProductionRuntime()) return "user";
    return requested;
  }
  if (input.authMode === "local_dev_profile") return isProductionRuntime() ? "user" : "developer";
  if (input.authMode === "local_password_profile" && input.devDefault) return "developer";
  return "user";
}

async function upsertAccount(input: {
  profile_id: string;
  display_name: string;
  email?: string | null;
  account_type: HelixAccountType;
  provider: "local" | "google" | "password";
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

async function findPasswordCredentialByEmail(email: string): Promise<CredentialRow | null> {
  await ensureDatabase();
  const { rows } = await getPool().query<CredentialRow>(
    `
      SELECT *
      FROM helix_account_credentials
      WHERE credential_type = 'password'
        AND lower(subject) = lower($1)
        AND revoked_at IS NULL
      LIMIT 1;
    `,
    [email],
  );
  return rows[0] ?? null;
}

async function recordPasswordSignInFailure(email: string): Promise<{ showPasswordResetHint: boolean }> {
  if (!isValidAccountEmail(email)) return { showPasswordResetHint: false };
  await ensureDatabase();
  const { rows } = await getPool().query<{ failed_attempt_count: number }>(
    `
      INSERT INTO helix_account_sign_in_attempts (
        email_key, failed_attempt_count, last_failed_at, created_at, updated_at
      )
      VALUES (lower($1), 1, now(), now(), now())
      ON CONFLICT (email_key) DO UPDATE SET
        failed_attempt_count = helix_account_sign_in_attempts.failed_attempt_count + 1,
        last_failed_at = now(),
        updated_at = now()
      RETURNING failed_attempt_count;
    `,
    [email],
  );
  return {
    showPasswordResetHint: Number(rows[0]?.failed_attempt_count ?? 0) >= PASSWORD_RESET_HINT_THRESHOLD,
  };
}

async function recordPasswordSignInSuccess(email: string): Promise<void> {
  if (!isValidAccountEmail(email)) return;
  await ensureDatabase();
  await getPool().query(
    `
      INSERT INTO helix_account_sign_in_attempts (
        email_key, failed_attempt_count, last_success_at, created_at, updated_at
      )
      VALUES (lower($1), 0, now(), now(), now())
      ON CONFLICT (email_key) DO UPDATE SET
        failed_attempt_count = 0,
        last_success_at = now(),
        updated_at = now();
    `,
    [email],
  );
}

async function recordPasswordResetRequestForKey(key: string): Promise<{ limited: boolean }> {
  const normalizedKey = normalize(key).toLowerCase();
  if (!normalizedKey) return { limited: false };
  await ensureDatabase();
  const now = Date.now();
  const { rows } = await getPool().query<{
    reset_request_count: number;
    reset_window_started_at: Date | string | null;
    reset_limited_until: Date | string | null;
  }>(
    `
      SELECT reset_request_count, reset_window_started_at, reset_limited_until
      FROM helix_account_sign_in_attempts
      WHERE email_key = $1
      LIMIT 1;
    `,
    [normalizedKey],
  );
  const existing = rows[0];
  const limitedUntilMs = existing?.reset_limited_until ? new Date(existing.reset_limited_until).getTime() : 0;
  if (limitedUntilMs > now) return { limited: true };
  const windowStartedMs = existing?.reset_window_started_at ? new Date(existing.reset_window_started_at).getTime() : 0;
  const inWindow = windowStartedMs > 0 && now - windowStartedMs < PASSWORD_RESET_RATE_LIMIT_WINDOW_MS;
  const nextCount = inWindow ? Number(existing?.reset_request_count ?? 0) + 1 : 1;
  const nextLimitedUntil = nextCount > PASSWORD_RESET_RATE_LIMIT_MAX
    ? new Date(now + PASSWORD_RESET_RATE_LIMIT_COOLDOWN_MS).toISOString()
    : null;
  await getPool().query(
    `
      INSERT INTO helix_account_sign_in_attempts (
        email_key, reset_request_count, reset_window_started_at, reset_limited_until, created_at, updated_at
      )
      VALUES ($1, 1, now(), NULL, now(), now())
      ON CONFLICT (email_key) DO UPDATE SET
        reset_request_count = $2,
        reset_window_started_at = CASE WHEN $3::boolean THEN helix_account_sign_in_attempts.reset_window_started_at ELSE now() END,
        reset_limited_until = $4,
        updated_at = now();
    `,
    [normalizedKey, nextCount, inWindow, nextLimitedUntil],
  );
  return { limited: nextLimitedUntil != null };
}

async function recordPasswordResetRequest(input: {
  email: string;
  requester_key?: string | null;
}): Promise<{ limited: boolean }> {
  const checks: Array<Promise<{ limited: boolean }>> = [];
  if (isValidAccountEmail(input.email)) {
    checks.push(recordPasswordResetRequestForKey(`email:${input.email}`));
  }
  const requesterKey = normalize(input.requester_key);
  if (requesterKey) {
    checks.push(recordPasswordResetRequestForKey(`requester:${requesterKey}`));
  }
  if (checks.length === 0) return { limited: false };
  const results = await Promise.all(checks);
  return { limited: results.some((result) => result.limited) };
}

async function createPasswordCredential(input: {
  profile_id: string;
  email: string;
  password: string;
}): Promise<CredentialRow> {
  await ensureDatabase();
  const { rows } = await getPool().query<CredentialRow>(
    `
      INSERT INTO helix_account_credentials (
        credential_id, profile_id, credential_type, subject, password_hash, created_at, updated_at
      )
      VALUES ($1, $2, 'password', $3, $4, now(), now())
      RETURNING *;
    `,
    [
      `account_credential:${crypto.randomUUID()}`,
      input.profile_id,
      input.email,
      createPasswordAccountHash({ password: input.password }),
    ],
  );
  return rows[0];
}

async function createAccountActionToken(input: {
  profile_id: string;
  email: string;
  credential_type: "email_verification" | "password_reset";
  token_prefix: string;
  ttl_ms: number;
}): Promise<AccountActionTokenReceipt> {
  const email = normalizeAccountEmail(input.email);
  if (!isValidAccountEmail(email)) {
    return {
      ok: false,
      message: "A valid email address is required.",
      error: "invalid_email",
      token_value_shown_once: false,
      token_value: null,
      expires_at: null,
      raw_secret_stored: false,
    };
  }
  const tokenValue = createAccountActionTokenValue(input.token_prefix);
  const expiresAt = tokenExpiryIso(input.ttl_ms);
  await ensureDatabase();
  await getPool().query(
    `
      UPDATE helix_account_credentials
      SET revoked_at = now(), updated_at = now()
      WHERE credential_type = $1
        AND lower(subject) = lower($2)
        AND revoked_at IS NULL
        AND consumed_at IS NULL;
    `,
    [input.credential_type, email],
  );
  await getPool().query(
    `
      INSERT INTO helix_account_credentials (
        credential_id, profile_id, credential_type, subject, password_hash, expires_at, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, now(), now());
    `,
    [
      `account_credential:${crypto.randomUUID()}`,
      input.profile_id,
      input.credential_type,
      email,
      hashAccountActionToken(tokenValue),
      expiresAt,
    ],
  );
  return {
    ok: true,
    message:
      input.credential_type === "email_verification"
        ? "Email verification token created."
        : "Password reset token created.",
    error: null,
    token_value_shown_once: true,
    token_value: tokenValue,
    expires_at: expiresAt,
    raw_secret_stored: false,
  };
}

async function consumeAccountActionToken(input: {
  token_value?: string | null;
  credential_type: "email_verification" | "password_reset";
}): Promise<CredentialRow | null> {
  const tokenValue = normalize(input.token_value);
  if (!tokenValue) return null;
  const tokenHash = hashAccountActionToken(tokenValue);
  await ensureDatabase();
  const { rows } = await getPool().query<CredentialRow>(
    `
      UPDATE helix_account_credentials
      SET consumed_at = now(), revoked_at = now(), updated_at = now()
      WHERE credential_id = (
        SELECT credential_id
        FROM helix_account_credentials
        WHERE credential_type = $1
          AND password_hash = $2
          AND revoked_at IS NULL
          AND consumed_at IS NULL
          AND (expires_at IS NULL OR expires_at > now())
        LIMIT 1
      )
      RETURNING *;
    `,
    [input.credential_type, tokenHash],
  );
  return rows[0] ?? null;
}

async function insertSession(input: {
  account: AccountRow;
  account_policy: HelixAccountCapabilityPolicy;
  memory_scope?: "profile" | "session_only";
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
        a.email_verified_at,
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
      recommended_flow: "web_auth_or_oauth_link",
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

export async function signUpPasswordAccountSession(input: {
  email?: string | null;
  password?: string | null;
  display_name?: string | null;
}): Promise<HelixAccountSessionReceipt> {
  const email = normalizeAccountEmail(input.email);
  if (!isValidAccountEmail(email)) {
    return {
      schema: HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
      ok: false,
      session: null,
      message: "A valid email address is required to create a workstation profile.",
      error: "invalid_email",
      raw_password_stored: false,
      credential_collection_allowed_in_agents: false,
      auth_method: "password_account",
    };
  }
  if (!isValidAccountPassword(input.password)) {
    return {
      schema: HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
      ok: false,
      session: null,
      message: "Password must be at least 10 characters.",
      error: "weak_password",
      raw_password_stored: false,
      credential_collection_allowed_in_agents: false,
      auth_method: "password_account",
    };
  }
  const existingCredential = await findPasswordCredentialByEmail(email);
  if (existingCredential) {
    return {
      schema: HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
      ok: false,
      session: null,
      message: "A workstation profile already exists for that email.",
      error: "account_already_exists",
      raw_password_stored: false,
      credential_collection_allowed_in_agents: false,
      auth_method: "password_account",
    };
  }
  const profileId = publicProfileIdForEmail(email);
  const accountType = await resolveStoredAccountType({
    profileId,
    email,
    providerSubject: email,
    authMode: "password_account",
  });
  const account = await upsertAccount({
    profile_id: profileId,
    display_name: normalize(input.display_name) || email,
    email,
    account_type: accountType,
    provider: "password",
    provider_subject: email,
  });
  await createPasswordCredential({
    profile_id: account.profile_id,
    email,
    password: input.password,
  });
  await createAccountActionToken({
    profile_id: account.profile_id,
    email,
    credential_type: "email_verification",
    token_prefix: "acct_verify",
    ttl_ms: 24 * 60 * 60 * 1000,
  });
  const session = await insertSession({
    account,
    account_policy: policyForAccountType(accountType),
  });
  return {
    schema: HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
    ok: true,
    session,
    message: "Workstation profile created.",
    error: null,
    raw_password_stored: false,
    credential_collection_allowed_in_agents: false,
    auth_method: "password_account",
  };
}

export async function requestPasswordAccountEmailVerification(
  sessionId?: string | null,
): Promise<AccountActionTokenReceipt> {
  const session = await getAccountSessionById(sessionId);
  if (!session?.profile.email || session.profile.auth_mode !== "password_account") {
    return {
      ok: false,
      message: "A signed-in password profile is required before email verification can be requested.",
      error: "password_account_session_required",
      token_value_shown_once: false,
      token_value: null,
      expires_at: null,
      raw_secret_stored: false,
    };
  }
  if (session.profile.email_verified_at) {
    return {
      ok: true,
      message: "Email is already verified.",
      error: null,
      token_value_shown_once: false,
      token_value: null,
      expires_at: null,
      raw_secret_stored: false,
    };
  }
  return createAccountActionToken({
    profile_id: session.profile.profile_id,
    email: session.profile.email,
    credential_type: "email_verification",
    token_prefix: "acct_verify",
    ttl_ms: 24 * 60 * 60 * 1000,
  });
}

export async function verifyPasswordAccountEmail(input: {
  token_value?: string | null;
}): Promise<AccountActionTokenReceipt> {
  const credential = await consumeAccountActionToken({
    credential_type: "email_verification",
    token_value: input.token_value,
  });
  if (!credential) {
    return {
      ok: false,
      message: "Email verification token is invalid or expired.",
      error: "invalid_or_expired_email_verification_token",
      token_value_shown_once: false,
      token_value: null,
      expires_at: null,
      raw_secret_stored: false,
    };
  }
  await getPool().query(
    `UPDATE helix_accounts SET email_verified_at = now(), updated_at = now() WHERE profile_id = $1`,
    [credential.profile_id],
  );
  return {
    ok: true,
    message: "Email verified.",
    error: null,
    token_value_shown_once: false,
    token_value: null,
    expires_at: null,
    raw_secret_stored: false,
  };
}

export async function requestPasswordAccountPasswordReset(input: {
  email?: string | null;
  requester_key?: string | null;
}): Promise<AccountActionTokenReceipt> {
  const email = normalizeAccountEmail(input.email);
  const rateLimit = await recordPasswordResetRequest({
    email,
    requester_key: input.requester_key,
  });
  const credential = isValidAccountEmail(email)
    ? await findPasswordCredentialByEmail(email)
    : null;
  if (!credential || rateLimit.limited) {
    return {
      ok: true,
      message: GENERIC_PASSWORD_RESET_REQUEST_MESSAGE,
      error: null,
      token_value_shown_once: false,
      token_value: null,
      expires_at: null,
      email_delivery: {
        queued: false,
        provider: null,
        status: null,
      },
      raw_secret_stored: false,
    };
  }
  const tokenReceipt = await createAccountActionToken({
    profile_id: credential.profile_id,
    email,
    credential_type: "password_reset",
    token_prefix: "acct_reset",
    ttl_ms: 60 * 60 * 1000,
  });
  if (!tokenReceipt.ok || !tokenReceipt.token_value) return tokenReceipt;
  const resetUrl = buildAccountActionUrl({
    path: "/account/reset-password",
    token_value: tokenReceipt.token_value,
  });
  const emailRecord = await enqueueAccountEmail({
    recipient: email,
    template: "password_reset",
    subject: "Reset your CasimirBot workstation profile password",
    text_body: [
      "A password reset was requested for your CasimirBot workstation profile.",
      "",
      "Use this link to set a new password:",
      resetUrl,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html_body: [
      "<p>A password reset was requested for your CasimirBot workstation profile.</p>",
      `<p><a href="${resetUrl}">Set a new password</a></p>`,
      "<p>If you did not request this, you can ignore this email.</p>",
    ].join(""),
  });
  const showDevToken = isLocalEmailDeliveryMode();
  return {
    ...tokenReceipt,
    message: GENERIC_PASSWORD_RESET_REQUEST_MESSAGE,
    token_value_shown_once: showDevToken,
    token_value: showDevToken ? tokenReceipt.token_value : null,
    email_delivery: {
      queued: true,
      provider: emailRecord.provider,
      status: emailRecord.status,
    },
  };
}

export async function resetPasswordAccountPassword(input: {
  token_value?: string | null;
  password?: string | null;
}): Promise<AccountActionTokenReceipt> {
  if (!isValidAccountPassword(input.password)) {
    return {
      ok: false,
      message: "Password must be at least 10 characters.",
      error: "weak_password",
      token_value_shown_once: false,
      token_value: null,
      expires_at: null,
      raw_secret_stored: false,
    };
  }
  const resetCredential = await consumeAccountActionToken({
    credential_type: "password_reset",
    token_value: input.token_value,
  });
  if (!resetCredential) {
    return {
      ok: false,
      message: "Password reset token is invalid or expired.",
      error: "invalid_or_expired_password_reset_token",
      token_value_shown_once: false,
      token_value: null,
      expires_at: null,
      raw_secret_stored: false,
    };
  }
  await getPool().query(
    `
      UPDATE helix_account_credentials
      SET password_hash = $1, updated_at = now()
      WHERE profile_id = $2
        AND credential_type = 'password'
        AND lower(subject) = lower($3)
        AND revoked_at IS NULL;
    `,
    [
      createPasswordAccountHash({ password: input.password }),
      resetCredential.profile_id,
      resetCredential.subject,
    ],
  );
  await getPool().query(
    `UPDATE helix_account_sessions SET status = 'signed_out', updated_at = now() WHERE profile_id = $1`,
    [resetCredential.profile_id],
  );
  return {
    ok: true,
    message: "Password reset complete.",
    error: null,
    token_value_shown_once: false,
    token_value: null,
    expires_at: null,
    raw_secret_stored: false,
  };
}

export async function signInPasswordAccountSession(input: {
  email?: string | null;
  password?: string | null;
}): Promise<HelixAccountSessionReceipt> {
  const email = normalizeAccountEmail(input.email);
  const password = typeof input.password === "string" ? input.password : "";
  const credential = isValidAccountEmail(email)
    ? await findPasswordCredentialByEmail(email)
    : null;
  if (!credential?.password_hash || !password) {
    const attempt = await recordPasswordSignInFailure(email);
    return {
      schema: HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
      ok: false,
      session: null,
      message: GENERIC_PASSWORD_SIGN_IN_FAILURE_MESSAGE,
      error: "invalid_password_account_credentials",
      raw_password_stored: false,
      credential_collection_allowed_in_agents: false,
      auth_method: "password_account",
      show_password_reset_hint: attempt.showPasswordResetHint,
    };
  }
  let verified = false;
  try {
    verified = verifyPasswordAccountHash({
      password,
      encoded_hash: credential.password_hash,
    });
  } catch {
    verified = false;
  }
  if (!verified) {
    const attempt = await recordPasswordSignInFailure(email);
    return {
      schema: HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
      ok: false,
      session: null,
      message: GENERIC_PASSWORD_SIGN_IN_FAILURE_MESSAGE,
      error: "invalid_password_account_credentials",
      raw_password_stored: false,
      credential_collection_allowed_in_agents: false,
      auth_method: "password_account",
      show_password_reset_hint: attempt.showPasswordResetHint,
    };
  }
  let account = await findAccountByProfileId(credential.profile_id);
  if (!account) {
    return {
      schema: HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
      ok: false,
      session: null,
      message: "Workstation profile is unavailable.",
      error: "account_unavailable",
      raw_password_stored: false,
      credential_collection_allowed_in_agents: false,
      auth_method: "password_account",
    };
  }
  const accountType = await resolveStoredAccountType({
    profileId: account.profile_id,
    email,
    providerSubject: credential.subject,
    authMode: "password_account",
  });
  if (normalizeAccountType(account.account_type) !== accountType) {
    account = await upsertAccount({
      profile_id: account.profile_id,
      display_name: account.display_name,
      email: account.email,
      account_type: accountType,
      provider: "password",
      provider_subject: credential.subject,
      picture_url: account.picture_url,
    });
  }
  const session = await insertSession({
    account,
    account_policy: policyForAccountType(accountType),
  });
  await recordPasswordSignInSuccess(email);
  return {
    schema: HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
    ok: true,
    session,
    message: "Signed in.",
    error: null,
    raw_password_stored: false,
    credential_collection_allowed_in_agents: false,
    auth_method: "password_account",
    show_password_reset_hint: false,
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
    email: normalize(input.email) || null,
    providerSubject,
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

export async function deleteAccountProfile(sessionId?: string | null): Promise<HelixAccountSessionReceipt> {
  const normalized = normalize(sessionId);
  const previous = normalized ? await getAccountSessionById(normalized) : null;
  if (!previous) {
    return {
      schema: HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
      ok: false,
      session: null,
      message: "A signed-in profile is required before profile data can be deleted.",
      error: "profile_session_required",
      raw_password_stored: false,
      credential_collection_allowed_in_agents: false,
      auth_method: null,
    };
  }
  await ensureDatabase();
  await getPool().query(
    `UPDATE helix_account_sessions SET status = 'signed_out', updated_at = now() WHERE profile_id = $1`,
    [previous.profile.profile_id],
  );
  await getPool().query(
    `UPDATE helix_account_profile_storage SET deleted_at = now(), updated_at = now() WHERE profile_id = $1`,
    [previous.profile.profile_id],
  );
  await getPool().query(
    `UPDATE helix_research_library_documents SET deleted_at = now(), updated_at = now() WHERE profile_id = $1`,
    [previous.profile.profile_id],
  );
  await getPool().query(
    `UPDATE helix_account_credentials SET revoked_at = now(), updated_at = now() WHERE profile_id = $1`,
    [previous.profile.profile_id],
  );
  await getPool().query(
    `UPDATE helix_accounts SET deleted_at = now(), updated_at = now() WHERE profile_id = $1`,
    [previous.profile.profile_id],
  );
  return {
    schema: HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA,
    ok: true,
    session: { ...previous, status: "signed_out", updated_at: nowIso() },
    message: "Workstation profile data deleted.",
    error: null,
    raw_password_stored: false,
    credential_collection_allowed_in_agents: false,
    auth_method: previous.profile.auth_mode,
  };
}

export async function resetAccountSessionStore(): Promise<void> {
  await ensureDatabase();
  await getPool().query(`DELETE FROM helix_account_events`);
  await getPool().query(`DELETE FROM helix_email_outbox`);
  await getPool().query(`DELETE FROM helix_account_sign_in_attempts`);
  await getPool().query(`DELETE FROM helix_account_profile_storage`);
  await getPool().query(`DELETE FROM helix_research_library_documents`);
  await getPool().query(`DELETE FROM helix_account_sessions`);
  await getPool().query(`DELETE FROM helix_account_credentials`);
  await getPool().query(`DELETE FROM helix_account_linked_providers`);
  await getPool().query(`DELETE FROM helix_accounts`);
}

export async function resetAccountSessionStoreAndDb(): Promise<void> {
  await resetDbClient();
}
