import crypto from "node:crypto";
import {
  HELIX_BROKERAGE_CONNECTION_LIST_SCHEMA,
  HELIX_BROKERAGE_OAUTH_START_RECEIPT_SCHEMA,
  HELIX_BROKERAGE_ROOM_BINDING_LIST_SCHEMA,
  HELIX_ROBINHOOD_PROVIDER_ID,
  HELIX_ROBINHOOD_READ_CAPABILITY_IDS,
  HELIX_ROBINHOOD_TRADING_MCP_RESOURCE,
  helixBrokerageConnectionListSchema,
  helixBrokerageConnectionSchema,
  helixBrokerageOAuthStartReceiptSchema,
  helixBrokerageRoomBindingListSchema,
  helixBrokerageRoomBindingSchema,
  type HelixBrokerageConnection,
  type HelixBrokerageOAuthStartReceipt,
  type HelixBrokerageRoomBinding,
  type HelixRobinhoodReadCapabilityId,
} from "@shared/helix-brokerage-environment";
import {
  readSharedRealtimeRoomDatabase,
  withSharedRealtimeRoomTransaction,
} from "../helix-ask/realtime-room/room-store/database";
import type { Queryable } from
  "../helix-ask/realtime-room/room-store/types";
import {
  decryptProviderCredential,
  encryptProviderCredential,
} from "./provider-credential-vault";

const ROBINHOOD_RESOURCE_METADATA_URL =
  "https://agent.robinhood.com/.well-known/oauth-protected-resource/mcp/trading";
const ROBINHOOD_AUTHORIZATION_METADATA_URL =
  "https://agent.robinhood.com/.well-known/oauth-authorization-server/mcp/trading";
const OAUTH_TRANSACTION_TTL_MS = 10 * 60_000;
const FETCH_TIMEOUT_MS = 15_000;
const TOKEN_REFRESH_SKEW_MS = 60_000;
const ROBINHOOD_TOKEN_ENDPOINT =
  "https://api.robinhood.com/oauth2/token/" as const;

const ALLOWED_OAUTH_ENDPOINTS = new Map<string, ReadonlySet<string>>([
  ["authorization", new Set(["https://robinhood.com/oauth"])],
  ["token", new Set(["https://api.robinhood.com/oauth2/token/"])],
  ["registration", new Set(["https://agent.robinhood.com/oauth/trading/register"])],
]);

export type RobinhoodConnectionErrorCode =
  | "brokerage_auth_required"
  | "brokerage_account_policy_locked"
  | "brokerage_connection_not_found"
  | "brokerage_connection_not_ready"
  | "brokerage_oauth_discovery_failed"
  | "brokerage_oauth_registration_failed"
  | "brokerage_oauth_state_invalid"
  | "brokerage_oauth_transaction_expired"
  | "brokerage_oauth_exchange_failed"
  | "brokerage_oauth_refresh_failed"
  | "brokerage_room_not_private"
  | "brokerage_room_forbidden"
  | "brokerage_capability_denied"
  | "brokerage_provider_contract_changed"
  | "brokerage_read_failed"
  | "brokerage_unavailable";

export class RobinhoodConnectionError extends Error {
  constructor(
    readonly code: RobinhoodConnectionErrorCode,
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "RobinhoodConnectionError";
  }
}

type OAuthTransactionRow = {
  transaction_id: string;
  owner_profile_id: string;
  state_hash: string;
  encrypted_code_verifier: string;
  oauth_client_id: string;
  resource_url: string;
  authorization_endpoint: string;
  token_endpoint: string;
  redirect_uri: string;
  requested_scopes: unknown;
  status: string;
  expires_at: Date | string;
};

type BrokerageConnectionRow = {
  connection_id: string;
  owner_profile_id: string;
  provider: string;
  status: string;
  account_selection_status: string;
  provider_account_label: string | null;
  granted_capability_ids: unknown;
  credential_expires_at: Date | string | null;
  connected_at: Date | string;
  updated_at: Date | string;
  encrypted_credential_bundle: string;
  oauth_client_id: string;
  resource_url: string;
  producer_epoch_ref: string;
};

type BrokerageRoomBindingRow = {
  binding_id: string;
  connection_id: string;
  owner_profile_id: string;
  room_id: string;
  consent_capability_ids: unknown;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
};

export type RobinhoodCredentialBundle = Readonly<{
  schema: "helix.robinhood_oauth_credentials.v1";
  access_token: string;
  refresh_token: string | null;
  token_type: "Bearer";
  scope: string[];
  expires_at: string | null;
  resource: typeof HELIX_ROBINHOOD_TRADING_MCP_RESOURCE;
  /** Raw provider account reference. It must remain inside the encrypted vault. */
  agentic_account_ref?: string;
}>;

export type RobinhoodPrivateRoomCredentialLease = Readonly<{
  credentials: RobinhoodCredentialBundle;
  producerEpochRef: string;
}>;

type OAuthResourceMetadata = {
  resource: string;
  authorization_servers: string[];
  scopes_supported?: string[];
};

type OAuthAuthorizationMetadata = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint: string;
  grant_types_supported: string[];
  response_types_supported: string[];
  code_challenge_methods_supported: string[];
  token_endpoint_auth_methods_supported: string[];
};

type DynamicClientRegistration = {
  client_id: string;
  token_endpoint_auth_method?: string;
};

type OAuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
};

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const isoOrNull = (value: Date | string | null): string | null =>
  value === null ? null : iso(value);

const sha256 = (namespace: string, value: string): `sha256:${string}` =>
  `sha256:${crypto
    .createHash("sha256")
    .update(`${namespace}\n${value}`, "utf8")
    .digest("hex")}`;

const randomId = (prefix: string): string => `${prefix}:${crypto.randomUUID()}`;

const parseStringArray = (value: unknown): string[] => {
  const parsed = typeof value === "string"
    ? (() => {
        try {
          return JSON.parse(value) as unknown;
        } catch {
          return [];
        }
      })()
    : value;
  return Array.isArray(parsed)
    ? parsed.filter((item): item is string => typeof item === "string")
    : [];
};

const exactHttpsEndpoint = (
  kind: "authorization" | "token" | "registration",
  value: unknown,
): string => {
  if (typeof value !== "string") {
    throw new RobinhoodConnectionError(
      "brokerage_oauth_discovery_failed",
      502,
      "Robinhood OAuth discovery returned an invalid endpoint.",
    );
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new RobinhoodConnectionError(
      "brokerage_oauth_discovery_failed",
      502,
      "Robinhood OAuth discovery returned an invalid endpoint.",
    );
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    !ALLOWED_OAUTH_ENDPOINTS.get(kind)?.has(parsed.toString())
  ) {
    throw new RobinhoodConnectionError(
      "brokerage_oauth_discovery_failed",
      502,
      "Robinhood OAuth discovery returned an untrusted endpoint.",
    );
  }
  return parsed.toString();
};

const fetchJson = async <T>(
  url: string,
  init: RequestInit | undefined,
  fetchImpl: typeof fetch,
  errorCode: RobinhoodConnectionErrorCode,
): Promise<T> => {
  let response: Response;
  try {
    response = await fetchImpl(url, {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new RobinhoodConnectionError(
      errorCode,
      502,
      "Robinhood authorization is temporarily unavailable.",
    );
  }
  const body = await response.json().catch(() => null) as T | null;
  if (!response.ok || !body || typeof body !== "object") {
    throw new RobinhoodConnectionError(
      errorCode,
      502,
      "Robinhood authorization returned an invalid response.",
    );
  }
  return body;
};

const discoverRobinhoodOAuth = async (
  fetchImpl: typeof fetch,
): Promise<{
  resource: typeof HELIX_ROBINHOOD_TRADING_MCP_RESOURCE;
  scopes: string[];
  authorization: OAuthAuthorizationMetadata;
}> => {
  const resource = await fetchJson<OAuthResourceMetadata>(
    ROBINHOOD_RESOURCE_METADATA_URL,
    undefined,
    fetchImpl,
    "brokerage_oauth_discovery_failed",
  );
  if (
    resource.resource !== HELIX_ROBINHOOD_TRADING_MCP_RESOURCE ||
    !Array.isArray(resource.authorization_servers) ||
    !resource.authorization_servers.includes(
      HELIX_ROBINHOOD_TRADING_MCP_RESOURCE,
    )
  ) {
    throw new RobinhoodConnectionError(
      "brokerage_oauth_discovery_failed",
      502,
      "Robinhood OAuth resource identity did not match the admitted Trading MCP.",
    );
  }
  const authorization = await fetchJson<OAuthAuthorizationMetadata>(
    ROBINHOOD_AUTHORIZATION_METADATA_URL,
    undefined,
    fetchImpl,
    "brokerage_oauth_discovery_failed",
  );
  if (
    authorization.issuer !== HELIX_ROBINHOOD_TRADING_MCP_RESOURCE ||
    !authorization.grant_types_supported?.includes("authorization_code") ||
    !authorization.grant_types_supported?.includes("refresh_token") ||
    !authorization.response_types_supported?.includes("code") ||
    !authorization.code_challenge_methods_supported?.includes("S256") ||
    !authorization.token_endpoint_auth_methods_supported?.includes("none")
  ) {
    throw new RobinhoodConnectionError(
      "brokerage_oauth_discovery_failed",
      502,
      "Robinhood OAuth no longer matches the admitted authorization-code and PKCE contract.",
    );
  }
  return {
    resource: HELIX_ROBINHOOD_TRADING_MCP_RESOURCE,
    scopes: Array.isArray(resource.scopes_supported)
      ? resource.scopes_supported.filter(
          (scope): scope is string => typeof scope === "string" && scope.length > 0,
        )
      : [],
    authorization: {
      ...authorization,
      authorization_endpoint: exactHttpsEndpoint(
        "authorization",
        authorization.authorization_endpoint,
      ),
      token_endpoint: exactHttpsEndpoint("token", authorization.token_endpoint),
      registration_endpoint: exactHttpsEndpoint(
        "registration",
        authorization.registration_endpoint,
      ),
    },
  };
};

const projectConnection = (
  row: BrokerageConnectionRow,
): HelixBrokerageConnection => helixBrokerageConnectionSchema.parse({
  schema: "helix.brokerage_connection.v1",
  connection_id: row.connection_id,
  provider: HELIX_ROBINHOOD_PROVIDER_ID,
  environment_domain: "brokerage",
  status: row.status,
  account_selection_status: row.account_selection_status,
  provider_account_label: row.provider_account_label,
  capability_ids: parseStringArray(row.granted_capability_ids),
  read_only: true,
  upstream_tool_execution_enabled: false,
  live_order_execution_enabled: false,
  connected_at: iso(row.connected_at),
  credential_expires_at: isoOrNull(row.credential_expires_at),
  updated_at: iso(row.updated_at),
  credential_included: false,
  account_numbers_included: false,
  raw_provider_payload_included: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const projectRoomBinding = (input: {
  row: BrokerageRoomBindingRow;
  privateRoom: boolean;
}): HelixBrokerageRoomBinding => helixBrokerageRoomBindingSchema.parse({
  schema: "helix.brokerage_room_binding.v1",
  binding_id: input.row.binding_id,
  connection_id: input.row.connection_id,
  room_id: input.row.room_id,
  provider: HELIX_ROBINHOOD_PROVIDER_ID,
  environment_domain: "brokerage",
  status: input.privateRoom ? input.row.status : "suspended",
  privacy_state: input.privateRoom ? "owner_private" : "privacy_invalidated",
  capability_ids: input.privateRoom
    ? parseStringArray(input.row.consent_capability_ids)
    : [],
  read_only: true,
  upstream_tool_execution_enabled: false,
  live_order_execution_enabled: false,
  created_at: iso(input.row.created_at),
  updated_at: iso(input.row.updated_at),
  credential_included: false,
  account_numbers_included: false,
  raw_provider_payload_included: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

export const startRobinhoodOAuth = async (input: {
  ownerProfileId: string;
  publicBaseUrl: string;
  fetchImpl?: typeof fetch;
}): Promise<HelixBrokerageOAuthStartReceipt> => {
  const ownerProfileId = input.ownerProfileId.trim();
  if (!ownerProfileId) {
    throw new RobinhoodConnectionError(
      "brokerage_auth_required",
      401,
      "Sign in before connecting Robinhood.",
    );
  }
  const redirectUri = new URL(
    "/api/agi/brokerage-connections/robinhood/oauth/callback",
    `${input.publicBaseUrl.replace(/\/+$/u, "")}/`,
  ).toString();
  const fetchImpl = input.fetchImpl ?? fetch;
  const discovered = await discoverRobinhoodOAuth(fetchImpl);
  const registration = await fetchJson<DynamicClientRegistration>(
    discovered.authorization.registration_endpoint,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_name: "CasimirBot Robinhood read environment",
        redirect_uris: [redirectUri],
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
      }),
    },
    fetchImpl,
    "brokerage_oauth_registration_failed",
  );
  if (
    typeof registration.client_id !== "string" ||
    !registration.client_id.trim() ||
    registration.token_endpoint_auth_method &&
      registration.token_endpoint_auth_method !== "none"
  ) {
    throw new RobinhoodConnectionError(
      "brokerage_oauth_registration_failed",
      502,
      "Robinhood returned an unsupported OAuth client registration.",
    );
  }
  const transactionId = randomId("brokerage_oauth_transaction");
  const state = crypto.randomBytes(32).toString("base64url");
  const codeVerifier = crypto.randomBytes(64).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier, "ascii")
    .digest("base64url");
  const expiresAt = new Date(Date.now() + OAUTH_TRANSACTION_TTL_MS);
  const verifierEnvelope = encryptProviderCredential(
    { code_verifier: codeVerifier },
    `robinhood-oauth-transaction\n${transactionId}\n${ownerProfileId}`,
  );
  const db = await readSharedRealtimeRoomDatabase();
  await db.query(
    `
      INSERT INTO helix_brokerage_oauth_transactions (
        transaction_id, owner_profile_id, provider, state_hash,
        encrypted_code_verifier, encryption_key_id, encryption_algorithm,
        oauth_client_id, resource_url, authorization_endpoint, token_endpoint,
        redirect_uri, requested_scopes, expires_at
      ) VALUES (
        $1, $2, 'robinhood', $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12::jsonb, $13
      );
    `,
    [
      transactionId,
      ownerProfileId,
      sha256("helix.robinhood.oauth.state.v1", state),
      verifierEnvelope.encryptedValue,
      verifierEnvelope.keyId,
      verifierEnvelope.algorithm,
      registration.client_id.trim(),
      discovered.resource,
      discovered.authorization.authorization_endpoint,
      discovered.authorization.token_endpoint,
      redirectUri,
      JSON.stringify(discovered.scopes),
      expiresAt.toISOString(),
    ],
  );
  const authorizationUrl = new URL(
    discovered.authorization.authorization_endpoint,
  );
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("client_id", registration.client_id.trim());
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  authorizationUrl.searchParams.set("resource", discovered.resource);
  authorizationUrl.searchParams.set("state", state);
  if (discovered.scopes.length > 0) {
    authorizationUrl.searchParams.set("scope", discovered.scopes.join(" "));
  }
  return helixBrokerageOAuthStartReceiptSchema.parse({
    schema: HELIX_BROKERAGE_OAUTH_START_RECEIPT_SCHEMA,
    ok: true,
    provider: HELIX_ROBINHOOD_PROVIDER_ID,
    authorization_url: authorizationUrl.toString(),
    expires_at: expiresAt.toISOString(),
    browser_navigation_required: true,
    credential_included: false,
    account_numbers_included: false,
    raw_provider_payload_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
};

const readPendingOAuthTransaction = async (
  db: Queryable,
  ownerProfileId: string,
  state: string,
): Promise<OAuthTransactionRow> => {
  const { rows } = await db.query<OAuthTransactionRow>(
    `
      SELECT *
      FROM helix_brokerage_oauth_transactions
      WHERE owner_profile_id = $1 AND state_hash = $2 AND status = 'pending'
      LIMIT 1;
    `,
    [ownerProfileId, sha256("helix.robinhood.oauth.state.v1", state)],
  );
  const transaction = rows[0];
  if (!transaction) {
    throw new RobinhoodConnectionError(
      "brokerage_oauth_state_invalid",
      400,
      "The Robinhood authorization state is invalid or already used.",
    );
  }
  if (Date.parse(iso(transaction.expires_at)) <= Date.now()) {
    await db.query(
      `UPDATE helix_brokerage_oauth_transactions SET status = 'expired' WHERE transaction_id = $1;`,
      [transaction.transaction_id],
    );
    throw new RobinhoodConnectionError(
      "brokerage_oauth_transaction_expired",
      400,
      "The Robinhood authorization request expired. Start a new connection.",
    );
  }
  return transaction;
};

export const completeRobinhoodOAuth = async (input: {
  ownerProfileId: string;
  state: string;
  code: string;
  fetchImpl?: typeof fetch;
}): Promise<HelixBrokerageConnection> => {
  const ownerProfileId = input.ownerProfileId.trim();
  const state = input.state.trim();
  const code = input.code.trim();
  if (!ownerProfileId || !state || !code) {
    throw new RobinhoodConnectionError(
      "brokerage_oauth_state_invalid",
      400,
      "The Robinhood authorization callback is incomplete.",
    );
  }
  const db = await readSharedRealtimeRoomDatabase();
  const transaction = await readPendingOAuthTransaction(
    db,
    ownerProfileId,
    state,
  );
  const verifier = decryptProviderCredential<{ code_verifier: string }>(
    transaction.encrypted_code_verifier,
    `robinhood-oauth-transaction\n${transaction.transaction_id}\n${ownerProfileId}`,
  );
  if (!verifier.code_verifier) {
    throw new RobinhoodConnectionError(
      "brokerage_oauth_exchange_failed",
      502,
      "The stored Robinhood PKCE verifier is unavailable.",
    );
  }
  const token = await fetchJson<OAuthTokenResponse>(
    transaction.token_endpoint,
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: transaction.oauth_client_id,
        redirect_uri: transaction.redirect_uri,
        code_verifier: verifier.code_verifier,
        resource: transaction.resource_url,
      }).toString(),
    },
    input.fetchImpl ?? fetch,
    "brokerage_oauth_exchange_failed",
  );
  if (
    typeof token.access_token !== "string" ||
    token.access_token.length < 16 ||
    token.token_type && token.token_type.toLowerCase() !== "bearer"
  ) {
    throw new RobinhoodConnectionError(
      "brokerage_oauth_exchange_failed",
      502,
      "Robinhood returned an unsupported access token response.",
    );
  }
  const now = new Date();
  const expiresAt = Number.isFinite(token.expires_in) && Number(token.expires_in) > 0
    ? new Date(now.getTime() + Number(token.expires_in) * 1_000).toISOString()
    : null;
  const connectionId = randomId("brokerage_connection");
  const bundle: RobinhoodCredentialBundle = {
    schema: "helix.robinhood_oauth_credentials.v1",
    access_token: token.access_token,
    refresh_token:
      typeof token.refresh_token === "string" && token.refresh_token
        ? token.refresh_token
        : null,
    token_type: "Bearer",
    scope: typeof token.scope === "string"
      ? token.scope.split(/\s+/u).filter(Boolean)
      : parseStringArray(transaction.requested_scopes),
    expires_at: expiresAt,
    resource: HELIX_ROBINHOOD_TRADING_MCP_RESOURCE,
  };
  const credentialEnvelope = encryptProviderCredential(
    bundle,
    `robinhood-connection\n${connectionId}\n${ownerProfileId}`,
  );
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    await client.query(
      `
        UPDATE helix_brokerage_connections
        SET status = 'revoked', revoked_at = $2, updated_at = $2
        WHERE owner_profile_id = $1 AND provider = 'robinhood'
          AND status <> 'revoked';
      `,
      [ownerProfileId, now.toISOString()],
    );
    await client.query(
      `
        UPDATE helix_brokerage_room_bindings
        SET status = 'revoked', revoked_at = $2, updated_at = $2
        WHERE owner_profile_id = $1 AND status <> 'revoked';
      `,
      [ownerProfileId, now.toISOString()],
    );
    const { rows } = await client.query<BrokerageConnectionRow>(
      `
        INSERT INTO helix_brokerage_connections (
          connection_id, owner_profile_id, provider, resource_url,
          oauth_issuer, oauth_client_id, encrypted_credential_bundle,
          encryption_key_id, encryption_algorithm, credential_expires_at,
          granted_capability_ids, producer_epoch_ref, connected_at, updated_at
        ) VALUES (
          $1, $2, 'robinhood', $3, $4, $5, $6, $7, $8, $9,
          $10::jsonb, $11, $12, $12
        ) RETURNING *;
      `,
      [
        connectionId,
        ownerProfileId,
        HELIX_ROBINHOOD_TRADING_MCP_RESOURCE,
        HELIX_ROBINHOOD_TRADING_MCP_RESOURCE,
        transaction.oauth_client_id,
        credentialEnvelope.encryptedValue,
        credentialEnvelope.keyId,
        credentialEnvelope.algorithm,
        expiresAt,
        JSON.stringify(HELIX_ROBINHOOD_READ_CAPABILITY_IDS),
        randomId("brokerage_producer_epoch"),
        now.toISOString(),
      ],
    );
    await client.query(
      `
        UPDATE helix_brokerage_oauth_transactions
        SET status = 'completed', completed_at = $2,
            encrypted_code_verifier = $3
        WHERE transaction_id = $1 AND status = 'pending';
      `,
      [
        transaction.transaction_id,
        now.toISOString(),
        encryptProviderCredential(
          { code_verifier_destroyed: true },
          `robinhood-oauth-transaction\n${transaction.transaction_id}\n${ownerProfileId}`,
        ).encryptedValue,
      ],
    );
    return projectConnection(rows[0]);
  });
};

export const listRobinhoodConnections = async (
  ownerProfileId: string,
): Promise<ReturnType<typeof helixBrokerageConnectionListSchema.parse>> => {
  const db = await readSharedRealtimeRoomDatabase();
  const { rows } = await db.query<BrokerageConnectionRow>(
    `
      SELECT * FROM helix_brokerage_connections
      WHERE owner_profile_id = $1 AND status <> 'revoked'
      ORDER BY connected_at DESC;
    `,
    [ownerProfileId],
  );
  return helixBrokerageConnectionListSchema.parse({
    schema: HELIX_BROKERAGE_CONNECTION_LIST_SCHEMA,
    ok: true,
    connections: rows.map(projectConnection),
    credential_included: false,
    account_numbers_included: false,
    raw_provider_payload_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
};

export const disconnectRobinhoodConnection = async (input: {
  ownerProfileId: string;
  connectionId: string;
}): Promise<void> => {
  await withSharedRealtimeRoomTransaction(async (client) => {
    const { rows } = await client.query<{ connection_id: string }>(
      `
        SELECT connection_id FROM helix_brokerage_connections
        WHERE connection_id = $1 AND owner_profile_id = $2
          AND status <> 'revoked'
        FOR UPDATE;
      `,
      [input.connectionId, input.ownerProfileId],
    );
    if (!rows[0]) {
      throw new RobinhoodConnectionError(
        "brokerage_connection_not_found",
        404,
        "Robinhood connection not found.",
      );
    }
    await client.query(
      `DELETE FROM helix_brokerage_connections WHERE connection_id = $1;`,
      [input.connectionId],
    );
  });
};

const selectedCapabilities = (
  requested: string[] | undefined,
): HelixRobinhoodReadCapabilityId[] => {
  const values = requested ?? [...HELIX_ROBINHOOD_READ_CAPABILITY_IDS];
  const allowed = new Set<string>(HELIX_ROBINHOOD_READ_CAPABILITY_IDS);
  const unique = Array.from(new Set(values.map((value) => value.trim())));
  if (
    unique.length === 0 ||
    unique.some((capability) => !allowed.has(capability))
  ) {
    throw new RobinhoodConnectionError(
      "brokerage_capability_denied",
      403,
      "Only the immutable Robinhood read capability set can be attached.",
    );
  }
  return unique as HelixRobinhoodReadCapabilityId[];
};

const assertOwnerPrivateRoom = async (input: {
  db: Queryable;
  ownerProfileId: string;
  roomId: string;
}): Promise<void> => {
  const { rows } = await input.db.query<{
    owner_profile_id: string;
    status: string;
    active_members: number | string;
  }>(
    `
      SELECT r.owner_profile_id, r.status, count(m.participant_id) AS active_members
      FROM helix_shared_realtime_rooms r
      LEFT JOIN helix_shared_realtime_room_members m
        ON m.room_id = r.room_id AND m.presence <> 'left'
      WHERE r.room_id = $1
      GROUP BY r.room_id, r.owner_profile_id, r.status;
    `,
    [input.roomId],
  );
  const room = rows[0];
  if (!room || room.owner_profile_id !== input.ownerProfileId) {
    throw new RobinhoodConnectionError(
      "brokerage_room_forbidden",
      403,
      "Only the room owner can attach a brokerage environment.",
    );
  }
  if (room.status === "closed" || Number(room.active_members) !== 1) {
    throw new RobinhoodConnectionError(
      "brokerage_room_not_private",
      409,
      "Robinhood connections can be attached only while the room contains its owner and no other participant.",
    );
  }
};

export const assertRobinhoodPrivateRoomReadCapability = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  capabilityId: string;
}): Promise<{ producerEpochRef: string }> => {
  const db = await readSharedRealtimeRoomDatabase();
  await assertOwnerPrivateRoom({
    db,
    ownerProfileId: input.ownerProfileId,
    roomId: input.roomId,
  });
  const capabilityId = selectedCapabilities([input.capabilityId])[0];
  const { rows } = await db.query<{
    consent_capability_ids: unknown;
    producer_epoch_ref: string;
  }>(
    `
      SELECT b.consent_capability_ids, c.producer_epoch_ref
      FROM helix_brokerage_connections c
      JOIN helix_brokerage_room_bindings b
        ON b.connection_id = c.connection_id
       AND b.owner_profile_id = c.owner_profile_id
      WHERE c.connection_id = $1 AND c.owner_profile_id = $2
        AND c.status = 'connected'
        AND b.room_id = $3 AND b.status = 'active' AND b.private_only = true
      LIMIT 1;
    `,
    [input.connectionId, input.ownerProfileId, input.roomId],
  );
  if (!rows[0]) {
    throw new RobinhoodConnectionError(
      "brokerage_connection_not_ready",
      409,
      "An active owner-scoped Robinhood connection is required.",
    );
  }
  if (
    !capabilityId ||
    !parseStringArray(rows[0].consent_capability_ids).includes(capabilityId)
  ) {
    throw new RobinhoodConnectionError(
      "brokerage_capability_denied",
      403,
      "The private room has not consented to this Robinhood read capability.",
    );
  }
  return { producerEpochRef: rows[0].producer_epoch_ref };
};

export const attachRobinhoodConnectionToPrivateRoom = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  capabilityIds?: string[];
}): Promise<HelixBrokerageRoomBinding> =>
  withSharedRealtimeRoomTransaction(async (client) => {
    await assertOwnerPrivateRoom({
      db: client,
      ownerProfileId: input.ownerProfileId,
      roomId: input.roomId,
    });
    const { rows: connectionRows } = await client.query<BrokerageConnectionRow>(
      `
        SELECT * FROM helix_brokerage_connections
        WHERE connection_id = $1 AND owner_profile_id = $2
          AND status = 'connected'
        FOR UPDATE;
      `,
      [input.connectionId, input.ownerProfileId],
    );
    if (!connectionRows[0]) {
      throw new RobinhoodConnectionError(
        "brokerage_connection_not_ready",
        409,
        "An active owner-scoped Robinhood connection is required.",
      );
    }
    const capabilityIds = selectedCapabilities(input.capabilityIds);
    const now = new Date().toISOString();
    const bindingId = randomId("brokerage_room_binding");
    const { rows: existingRows } =
      await client.query<BrokerageRoomBindingRow>(
        `
          SELECT * FROM helix_brokerage_room_bindings
          WHERE connection_id = $1 AND room_id = $2 AND status = 'active'
          LIMIT 1;
        `,
        [input.connectionId, input.roomId],
      );
    const result = existingRows[0]
      ? await client.query<BrokerageRoomBindingRow>(
          `
            UPDATE helix_brokerage_room_bindings
            SET consent_capability_ids = $2::jsonb, updated_at = $3
            WHERE binding_id = $1
            RETURNING *;
          `,
          [
            existingRows[0].binding_id,
            JSON.stringify(capabilityIds),
            now,
          ],
        )
      : await client.query<BrokerageRoomBindingRow>(
          `
            INSERT INTO helix_brokerage_room_bindings (
              binding_id, connection_id, owner_profile_id, room_id,
              consent_capability_ids, private_only, status, created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5::jsonb, true, 'active', $6, $6)
            RETURNING *;
          `,
          [
            bindingId,
            input.connectionId,
            input.ownerProfileId,
            input.roomId,
            JSON.stringify(capabilityIds),
            now,
          ],
        );
    return projectRoomBinding({ row: result.rows[0], privateRoom: true });
  });

export const listPrivateRoomRobinhoodBindings = async (input: {
  ownerProfileId: string;
  roomId: string;
}): Promise<ReturnType<typeof helixBrokerageRoomBindingListSchema.parse>> => {
  const db = await readSharedRealtimeRoomDatabase();
  const { rows: roomRows } = await db.query<{
    owner_profile_id: string;
    active_members: number | string;
  }>(
    `
      SELECT r.owner_profile_id, count(m.participant_id) AS active_members
      FROM helix_shared_realtime_rooms r
      LEFT JOIN helix_shared_realtime_room_members m
        ON m.room_id = r.room_id AND m.presence <> 'left'
      WHERE r.room_id = $1
      GROUP BY r.room_id, r.owner_profile_id;
    `,
    [input.roomId],
  );
  const room = roomRows[0];
  if (!room || room.owner_profile_id !== input.ownerProfileId) {
    throw new RobinhoodConnectionError(
      "brokerage_room_forbidden",
      403,
      "Only the room owner can inspect a brokerage environment binding.",
    );
  }
  const { rows } = await db.query<BrokerageRoomBindingRow>(
    `
      SELECT * FROM helix_brokerage_room_bindings
      WHERE owner_profile_id = $1 AND room_id = $2 AND status <> 'revoked'
      ORDER BY updated_at DESC;
    `,
    [input.ownerProfileId, input.roomId],
  );
  const privateRoom = Number(room.active_members) === 1;
  return helixBrokerageRoomBindingListSchema.parse({
    schema: HELIX_BROKERAGE_ROOM_BINDING_LIST_SCHEMA,
    ok: true,
    room_id: input.roomId,
    bindings: rows.map((row) => projectRoomBinding({ row, privateRoom })),
    credential_included: false,
    account_numbers_included: false,
    raw_provider_payload_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
};

export const readRobinhoodCredentialBundleForPrivateRoomAdapter = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  capabilityId: string;
  fetchImpl?: typeof fetch;
  forceRefresh?: boolean;
  now?: Date;
}): Promise<RobinhoodPrivateRoomCredentialLease> => {
  const db = await readSharedRealtimeRoomDatabase();
  await assertOwnerPrivateRoom({
    db,
    ownerProfileId: input.ownerProfileId,
    roomId: input.roomId,
  });
  const capabilityId = selectedCapabilities([input.capabilityId])[0];
  const { rows: accessRows } = await db.query<{
    consent_capability_ids: unknown;
  }>(
    `
      SELECT b.consent_capability_ids
      FROM helix_brokerage_connections c
      JOIN helix_brokerage_room_bindings b
        ON b.connection_id = c.connection_id
       AND b.owner_profile_id = c.owner_profile_id
      WHERE c.connection_id = $1 AND c.owner_profile_id = $2
        AND c.status = 'connected'
        AND b.room_id = $3 AND b.status = 'active' AND b.private_only = true
      LIMIT 1;
    `,
    [input.connectionId, input.ownerProfileId, input.roomId],
  );
  if (!accessRows[0]) {
    throw new RobinhoodConnectionError(
      "brokerage_connection_not_ready",
      409,
      "An active owner-scoped Robinhood connection is required.",
    );
  }
  if (
    !capabilityId ||
    !parseStringArray(accessRows[0].consent_capability_ids).includes(
      capabilityId,
    )
  ) {
    throw new RobinhoodConnectionError(
      "brokerage_capability_denied",
      403,
      "The private room has not consented to this Robinhood read capability.",
    );
  }
  return withSharedRealtimeRoomTransaction(async (client) => {
    const { rows } = await client.query<BrokerageConnectionRow>(
      `
        SELECT * FROM helix_brokerage_connections
        WHERE connection_id = $1 AND owner_profile_id = $2
          AND status = 'connected'
        FOR UPDATE;
      `,
      [input.connectionId, input.ownerProfileId],
    );
    const row = rows[0];
    if (!row) {
      throw new RobinhoodConnectionError(
        "brokerage_connection_not_ready",
        409,
        "An active owner-scoped Robinhood connection is required.",
      );
    }
    const current = decryptProviderCredential<RobinhoodCredentialBundle>(
      row.encrypted_credential_bundle,
      `robinhood-connection\n${row.connection_id}\n${row.owner_profile_id}`,
    );
    const now = input.now ?? new Date();
    const expiryMs = current.expires_at
      ? Date.parse(current.expires_at)
      : Number.POSITIVE_INFINITY;
    const refreshRequired = input.forceRefresh === true ||
      expiryMs <= now.getTime() + TOKEN_REFRESH_SKEW_MS;
    if (!refreshRequired) {
      return {
        credentials: current,
        producerEpochRef: row.producer_epoch_ref,
      };
    }
    if (!current.refresh_token) {
      throw new RobinhoodConnectionError(
        "brokerage_connection_not_ready",
        409,
        "Reconnect Robinhood because the access token expired without a refresh token.",
      );
    }
    const refreshed = await fetchJson<OAuthTokenResponse>(
      ROBINHOOD_TOKEN_ENDPOINT,
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: current.refresh_token,
          client_id: row.oauth_client_id,
          resource: row.resource_url,
        }).toString(),
      },
      input.fetchImpl ?? fetch,
      "brokerage_oauth_refresh_failed",
    );
    if (
      typeof refreshed.access_token !== "string" ||
      refreshed.access_token.length < 16 ||
      refreshed.token_type && refreshed.token_type.toLowerCase() !== "bearer"
    ) {
      throw new RobinhoodConnectionError(
        "brokerage_oauth_refresh_failed",
        502,
        "Robinhood returned an unsupported refresh response.",
      );
    }
    const refreshedExpiresAt =
      Number.isFinite(refreshed.expires_in) && Number(refreshed.expires_in) > 0
        ? new Date(
            now.getTime() + Number(refreshed.expires_in) * 1_000,
          ).toISOString()
        : null;
    const next: RobinhoodCredentialBundle = {
      ...current,
      access_token: refreshed.access_token,
      refresh_token:
        typeof refreshed.refresh_token === "string" && refreshed.refresh_token
          ? refreshed.refresh_token
          : current.refresh_token,
      scope: typeof refreshed.scope === "string"
        ? refreshed.scope.split(/\s+/u).filter(Boolean)
        : current.scope,
      expires_at: refreshedExpiresAt,
    };
    const envelope = encryptProviderCredential(
      next,
      `robinhood-connection\n${row.connection_id}\n${row.owner_profile_id}`,
    );
    await client.query(
      `
        UPDATE helix_brokerage_connections
        SET encrypted_credential_bundle = $2,
            encryption_key_id = $3,
            encryption_algorithm = $4,
            credential_expires_at = $5,
            updated_at = $6
        WHERE connection_id = $1;
      `,
      [
        row.connection_id,
        envelope.encryptedValue,
        envelope.keyId,
        envelope.algorithm,
        refreshedExpiresAt,
        now.toISOString(),
      ],
    );
    return {
      credentials: next,
      producerEpochRef: row.producer_epoch_ref,
    };
  });
};

export const persistRobinhoodAgenticAccountSelectionForPrivateRoom = async (
  input: {
    ownerProfileId: string;
    connectionId: string;
    roomId: string;
    providerAccountRef: string;
    now?: Date;
  },
): Promise<RobinhoodPrivateRoomCredentialLease> => {
  const providerAccountRef = input.providerAccountRef.trim();
  if (!providerAccountRef || providerAccountRef.length > 512 ||
      /[\u0000-\u001f\u007f-\u009f]/u.test(providerAccountRef)) {
    throw new RobinhoodConnectionError(
      "brokerage_provider_contract_changed",
      502,
      "Robinhood did not provide a bounded Agentic account reference.",
    );
  }
  await assertRobinhoodPrivateRoomReadCapability({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    capabilityId: "brokerage.robinhood.market_data.read",
  });
  const at = input.now ?? new Date();
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<BrokerageConnectionRow>(
      `SELECT * FROM helix_brokerage_connections
       WHERE connection_id = $1 AND owner_profile_id = $2
         AND status = 'connected'
       FOR UPDATE;`,
      [input.connectionId, input.ownerProfileId],
    );
    const row = rows[0];
    if (!row) {
      throw new RobinhoodConnectionError(
        "brokerage_connection_not_ready", 409,
        "An active owner-scoped Robinhood connection is required.",
      );
    }
    const current = decryptProviderCredential<RobinhoodCredentialBundle>(
      row.encrypted_credential_bundle,
      `robinhood-connection\n${row.connection_id}\n${row.owner_profile_id}`,
    );
    if (current.agentic_account_ref &&
        current.agentic_account_ref !== providerAccountRef) {
      throw new RobinhoodConnectionError(
        "brokerage_provider_contract_changed", 409,
        "The selected Robinhood Agentic account changed; reconnect before reviewing orders.",
      );
    }
    const next: RobinhoodCredentialBundle = {
      ...current,
      agentic_account_ref: providerAccountRef,
    };
    const envelope = encryptProviderCredential(
      next,
      `robinhood-connection\n${row.connection_id}\n${row.owner_profile_id}`,
    );
    await client.query(
      `UPDATE helix_brokerage_connections
       SET encrypted_credential_bundle = $3,
           encryption_key_id = $4,
           encryption_algorithm = $5,
           account_selection_status = 'agentic_selected',
           provider_account_ref_hash = $6,
           provider_account_label = 'Robinhood Agentic account',
           updated_at = $7
       WHERE connection_id = $1 AND owner_profile_id = $2;`,
      [row.connection_id, row.owner_profile_id, envelope.encryptedValue,
        envelope.keyId, envelope.algorithm,
        sha256("robinhood-agentic-account-ref", providerAccountRef),
        at.toISOString()],
    );
    return { credentials: next, producerEpochRef: row.producer_epoch_ref };
  });
};
