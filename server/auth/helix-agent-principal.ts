import crypto from "node:crypto";
import type { Request } from "express";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import {
  buildHelixAccountCapabilityPolicy,
  buildHelixSharedRealtimeRoomsExperimentPolicy,
} from "@shared/helix-account-session";
import type { HelixAccountType } from "@shared/helix-account-session";
import { HELIX_AGENT_RUN_DEVELOPER_SCOPE } from "@shared/contracts/helix-agent-api.v1";
import {
  HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
} from "@shared/contracts/helix-shared-live-room-agent.v1";
import { DESKTOP_MCP_TUNNEL_ACCOUNT_SESSION_HEADER } from "@shared/desktop-mcp-tunnel";
import { ensureDatabase, getPool } from "../db/client";
import {
  isDesktopSessionAuthorized,
  resolveDesktopSessionConfig,
} from "../security/desktop-session";
import { getAccountSessionById } from
  "../services/helix-account/account-session-store";
import { HelixAgentApiServiceError } from "../services/helix-agent-api/errors";
import type { HelixAgentApiPrincipal } from "../services/helix-agent-api/types";
export { requireHelixAgentApiScope } from "./helix-agent-scope";

type AccountLinkRow = {
  profile_id: string;
  display_name: string;
  email: string | null;
  account_type: string;
  picture_url: string | null;
};

export type HelixAgentVerifiedToken = {
  issuer: string;
  subject: string;
  tenantId: string;
  scopes: ReadonlySet<string>;
  expiresAt: string;
  claims: JWTPayload;
};

export interface HelixAgentAccessTokenVerifier {
  verify(token: string): Promise<HelixAgentVerifiedToken>;
  authorizationServer(): string;
  audience(): string;
  providerAlias(): string;
}

type AuthConfig =
  | {
      mode: "oauth_jwks";
      issuer: string;
      audience: string;
      providerAlias: string;
      jwksUrl: string;
      algorithms: string[];
      tenantClaim: string | null;
    }
  | {
      mode: "local_hs256";
      issuer: string;
      audience: string;
      providerAlias: string;
      secret: Uint8Array;
      algorithms: ["HS256"];
      tenantClaim: string | null;
    };

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const parseAlgorithms = (value: string | undefined): string[] => {
  const parsed = (value ?? "RS256,ES256")
    .split(",")
    .map((entry: string): string => entry.trim())
    .filter(Boolean);
  const admitted = parsed.filter((algorithm: string): boolean =>
    new Set(["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"]).has(
      algorithm,
    ),
  );
  if (admitted.length === 0) {
    throw new HelixAgentApiServiceError(
      503,
      "auth_not_configured",
      "No admitted OAuth signing algorithm is configured.",
    );
  }
  return admitted;
};

const parseTenantClaim = (value: string | undefined): string | null => {
  const claim = normalize(value);
  if (!claim) return null;
  if (claim.length > 512 || /[\s\x00-\x1f\x7f]/u.test(claim)) {
    throw new HelixAgentApiServiceError(
      503,
      "auth_not_configured",
      "HELIX_AGENT_OAUTH_TENANT_CLAIM must name one exact signed JWT claim.",
    );
  }
  return claim;
};

const requireUrl = (value: string, name: string): URL => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new HelixAgentApiServiceError(
      503,
      "auth_not_configured",
      `${name} must be an absolute URL.`,
    );
  }
  if (
    (process.env.NODE_ENV === "production" && url.protocol !== "https:") ||
    (url.protocol !== "https:" && url.protocol !== "http:")
  ) {
    throw new HelixAgentApiServiceError(
      503,
      "auth_not_configured",
      `${name} must use HTTPS in production.`,
    );
  }
  return url;
};

const resolveAuthConfig = (): AuthConfig => {
  const issuer = normalize(process.env.HELIX_AGENT_OAUTH_ISSUER);
  const audience = normalize(process.env.HELIX_AGENT_OAUTH_AUDIENCE);
  const providerAlias = normalize(process.env.HELIX_AGENT_OAUTH_PROVIDER);
  const jwksUrl = normalize(process.env.HELIX_AGENT_OAUTH_JWKS_URL);
  if (issuer && audience && providerAlias && jwksUrl) {
    requireUrl(issuer, "HELIX_AGENT_OAUTH_ISSUER");
    requireUrl(audience, "HELIX_AGENT_OAUTH_AUDIENCE");
    return {
      mode: "oauth_jwks",
      // OAuth issuer identifiers are exact strings; a trailing slash is
      // significant and must not be silently canonicalized.
      issuer,
      audience,
      providerAlias,
      jwksUrl: requireUrl(jwksUrl, "HELIX_AGENT_OAUTH_JWKS_URL").toString(),
      algorithms: parseAlgorithms(process.env.HELIX_AGENT_OAUTH_ALGORITHMS),
      tenantClaim: parseTenantClaim(
        process.env.HELIX_AGENT_OAUTH_TENANT_CLAIM,
      ),
    };
  }

  const allowLocal =
    process.env.NODE_ENV !== "production" &&
    process.env.HELIX_AGENT_ALLOW_LOCAL_HS256 === "1";
  const localSecret = normalize(process.env.HELIX_AGENT_LOCAL_JWT_SECRET);
  if (
    allowLocal &&
    issuer &&
    audience &&
    providerAlias &&
    localSecret.length >= 32
  ) {
    requireUrl(issuer, "HELIX_AGENT_OAUTH_ISSUER");
    requireUrl(audience, "HELIX_AGENT_OAUTH_AUDIENCE");
    return {
      mode: "local_hs256",
      issuer,
      audience,
      providerAlias,
      secret: new TextEncoder().encode(localSecret),
      algorithms: ["HS256"],
      tenantClaim: parseTenantClaim(
        process.env.HELIX_AGENT_OAUTH_TENANT_CLAIM,
      ),
    };
  }
  throw new HelixAgentApiServiceError(
    503,
    "auth_not_configured",
    "The Helix agent API OAuth protected resource is not configured.",
  );
};

const scopesFromPayload = (payload: JWTPayload): ReadonlySet<string> => {
  const values: string[] = [];
  const scope = payload.scope;
  if (typeof scope === "string") values.push(...scope.split(/\s+/));
  const scp = payload.scp;
  if (typeof scp === "string") values.push(...scp.split(/\s+/));
  if (Array.isArray(scp)) {
    values.push(
      ...scp.filter(
        (entry: unknown): entry is string => typeof entry === "string",
      ),
    );
  }
  const scopes = payload.scopes;
  if (typeof scopes === "string") values.push(...scopes.split(/\s+/));
  if (Array.isArray(scopes)) {
    values.push(
      ...scopes.filter(
        (entry: unknown): entry is string => typeof entry === "string",
      ),
    );
  }
  return new Set(
    values
      .map((entry: string): string => entry.trim())
      .filter((entry: string): boolean => Boolean(entry)),
  );
};

const tenantFromPayload = (
  payload: JWTPayload,
  configuredClaim: string | null,
): string => {
  const claims = configuredClaim
    ? [configuredClaim]
    : [
    "tenantId",
    "tenant_id",
    "customerId",
    "customer_id",
    "orgId",
    "org_id",
      ];
  for (const key of claims) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  throw new HelixAgentApiServiceError(
    401,
    "tenant_required",
    "A signed tenant claim is required.",
  );
};

const remoteJwks = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

const developmentLoopbackAudience = (): string | null => {
  if (process.env.NODE_ENV === "production") return null;
  const rawPort = normalize(process.env.PORT);
  if (!/^\d{1,5}$/u.test(rawPort)) return null;
  const port = Number.parseInt(rawPort, 10);
  if (port < 1 || port > 65_535) return null;
  return `http://127.0.0.1:${port}/mcp`;
};

export class DefaultHelixAgentAccessTokenVerifier implements HelixAgentAccessTokenVerifier {
  private config(): AuthConfig {
    return resolveAuthConfig();
  }

  authorizationServer(): string {
    return this.config().issuer;
  }

  audience(): string {
    return this.config().audience;
  }

  providerAlias(): string {
    return this.config().providerAlias;
  }

  async verify(token: string): Promise<HelixAgentVerifiedToken> {
    const config = this.config();
    let payload: JWTPayload;
    try {
      const verificationOptions = {
        issuer: config.issuer,
        audience: Array.from(
          new Set(
            [config.audience, developmentLoopbackAudience()].filter(
              (value): value is string => Boolean(value),
            ),
          ),
        ),
        algorithms: config.algorithms,
        clockTolerance: 5,
      };
      const verified =
        config.mode === "oauth_jwks"
          ? await jwtVerify(
              token,
              remoteJwks.get(config.jwksUrl) ??
                (() => {
                  const value = createRemoteJWKSet(new URL(config.jwksUrl));
                  remoteJwks.set(config.jwksUrl, value);
                  return value;
                })(),
              verificationOptions,
            )
          : await jwtVerify(token, config.secret, verificationOptions);
      payload = verified.payload;
    } catch {
      throw new HelixAgentApiServiceError(
        401,
        "unauthorized",
        "The bearer token is invalid.",
      );
    }
    const subject = normalize(payload.sub);
    if (!subject || typeof payload.exp !== "number") {
      throw new HelixAgentApiServiceError(
        401,
        "unauthorized",
        "The bearer token must contain subject and expiration claims.",
      );
    }
    return {
      issuer: normalize(payload.iss) || config.issuer,
      subject,
      tenantId: tenantFromPayload(payload, config.tenantClaim),
      scopes: scopesFromPayload(payload),
      expiresAt: new Date(payload.exp * 1_000).toISOString(),
      claims: payload,
    };
  }
}

const bearerToken = (req: Request): string => {
  const header = req.get("authorization") ?? "";
  const match = header.match(/^Bearer ([^\s]+)$/);
  if (!match) {
    throw new HelixAgentApiServiceError(
      401,
      "unauthorized",
      "A bearer access token is required.",
    );
  }
  return match[1];
};

const assertedTenantHeader = (req: Request): string | null => {
  for (const name of ["x-tenant-id", "x-customer-id", "x-org-id"]) {
    const value = normalize(req.get(name));
    if (value) return value;
  }
  return null;
};

const developerWhitelist = (): ReadonlySet<string> =>
  new Set(
    normalize(process.env.HELIX_DEVELOPER_PROFILE_IDS)
      .split(",")
      .map((entry: string): string => entry.trim().toLowerCase())
      .filter(Boolean),
  );

const isTrustedDeveloperProfile = (input: {
  row: AccountLinkRow;
  token: HelixAgentVerifiedToken;
}): boolean => {
  if (input.row.account_type !== "developer") return false;
  if (process.env.NODE_ENV !== "production") return true;
  const whitelist = developerWhitelist();
  return [
    input.row.profile_id,
    input.row.email,
    input.token.subject,
  ].some((value) => value && whitelist.has(value.toLowerCase()));
};

const resolveAccountType = (input: {
  trustedDeveloperProfile: boolean;
  token: HelixAgentVerifiedToken;
}): HelixAccountType => {
  return input.trustedDeveloperProfile && input.token.scopes.has(HELIX_AGENT_RUN_DEVELOPER_SCOPE)
    ? "developer"
    : "user";
};

const sessionRef = (
  issuer: string,
  subject: string,
  profileId: string,
): string =>
  `external-oauth:${crypto
    .createHash("sha256")
    .update(`${issuer}\n${subject}\n${profileId}`)
    .digest("hex")
    .slice(0, 32)}`;

const oauthClientRef = (
  issuer: string,
  claims: JWTPayload,
): string | null => {
  const clientId = normalize(claims.azp) || normalize(claims.client_id);
  if (!clientId) return null;
  return `oauth_client:${crypto
    .createHash("sha256")
    .update(`${issuer}\n${clientId}`)
    .digest("hex")}`;
};

export const resolveHelixAgentApiPrincipal = async (
  req: Request,
  verifier: HelixAgentAccessTokenVerifier = new DefaultHelixAgentAccessTokenVerifier(),
): Promise<HelixAgentApiPrincipal> => {
  const token = await verifier.verify(bearerToken(req));
  const providerAlias = verifier.providerAlias();
  const tenantHeader = assertedTenantHeader(req);
  if (tenantHeader && tenantHeader !== token.tenantId) {
    throw new HelixAgentApiServiceError(
      403,
      "tenant_mismatch",
      "The tenant header does not match the signed tenant claim.",
    );
  }
  await ensureDatabase();
  const { rows } = await getPool().query<AccountLinkRow>(
    `
      SELECT
        a.profile_id,
        a.display_name,
        a.email,
        a.account_type,
        a.picture_url
      FROM helix_agent_account_bindings b
      JOIN helix_account_linked_providers p
        ON p.provider = b.provider
        AND p.provider_subject = b.provider_subject
        AND p.profile_id = b.profile_id
      JOIN helix_accounts a ON a.profile_id = p.profile_id
      WHERE b.issuer = $1
        AND b.tenant_id = $2
        AND b.provider = $3
        AND b.provider_subject = $4
        AND b.revoked_at IS NULL
        AND a.deleted_at IS NULL
      LIMIT 1;
    `,
    [token.issuer, token.tenantId, providerAlias, token.subject],
  );
  const account = rows[0];
  if (!account) {
    throw new HelixAgentApiServiceError(
      403,
      "account_not_linked",
      "The verified OAuth subject is not explicitly bound to an active Helix account for this issuer and tenant.",
    );
  }
  const trustedDeveloperProfile = isTrustedDeveloperProfile({ row: account, token });
  const accountType = resolveAccountType({ trustedDeveloperProfile, token });
  // An exact room OAuth capability is the admission boundary for the room
  // experiment. Keep generic developer authority attenuated independently:
  // enabling Shared Live Rooms here does not promote accountType or unlock any
  // other developer feature.
  const accountPolicy = token.scopes.has(HELIX_SHARED_LIVE_ROOM_READ_SCOPE) ||
      token.scopes.has(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE)
    ? buildHelixSharedRealtimeRoomsExperimentPolicy(accountType)
    : buildHelixAccountCapabilityPolicy(accountType);
  const now = new Date().toISOString();
  const sessionId = sessionRef(token.issuer, token.subject, account.profile_id);
  const clientRef = oauthClientRef(token.issuer, token.claims);
  const accountSession = {
    schema: "helix.account_session.v1" as const,
    session_id: sessionId,
    profile: {
      profile_id: account.profile_id,
      display_name: account.display_name,
      email: account.email,
      auth_mode: "web_auth" as const,
      account_type: accountType,
      provider:
        providerAlias === "google"
          ? ("google" as const)
          : ("external_oauth" as const),
      provider_alias: providerAlias,
      provider_subject: token.subject,
      picture_url: account.picture_url,
      created_at: now,
      updated_at: now,
    },
    account_policy: accountPolicy,
    status: "active" as const,
    memory_scope: "profile" as const,
    created_at: now,
    updated_at: now,
    expires_at: token.expiresAt,
  };

  return {
    tenantId: token.tenantId,
    issuer: token.issuer,
    subjectId: token.subject,
    accountProfileId: account.profile_id,
    accountType,
    trustedDeveloperProfile,
    mcpClientRef: clientRef,
    oauthClientRef: clientRef,
    scopes: token.scopes,
    tokenExpiresAt: token.expiresAt,
    accountContext: {
      session_id: sessionId,
      profile_id: account.profile_id,
      trusted_account_session: true,
      account_session: accountSession,
      account_policy: accountPolicy,
    },
  };
};

const isLoopbackRequestHost = (host: string): boolean => {
  try {
    const hostname = new URL(`http://${host}`).hostname.toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1" ||
      hostname === "[::1]";
  } catch {
    return false;
  }
};

export const resolveHelixDesktopMcpPrincipal = async (
  req: Request,
  allowedScopes: readonly string[],
): Promise<HelixAgentApiPrincipal> => {
  const desktopSession = resolveDesktopSessionConfig(process.env);
  const sessionId = normalize(
    req.get(DESKTOP_MCP_TUNNEL_ACCOUNT_SESSION_HEADER),
  );
  if (
    !desktopSession.enabled ||
    !isLoopbackRequestHost(normalize(req.get("host"))) ||
    !isDesktopSessionAuthorized(req.headers, desktopSession) ||
    !/^account_session:[A-Za-z0-9-]{8,128}$/u.test(sessionId)
  ) {
    throw new HelixAgentApiServiceError(
      401,
      "unauthorized",
      "A valid native desktop tunnel delegation is required.",
    );
  }
  const session = await getAccountSessionById(sessionId);
  if (!session || session.status !== "active") {
    throw new HelixAgentApiServiceError(
      401,
      "unauthorized",
      "The native desktop tunnel delegation is no longer active.",
    );
  }
  const profileId = session.profile.profile_id;
  const accountType = session.account_policy.account_type;
  const desktopDeviceId = normalize(process.env.HELIX_DESKTOP_DEVICE_ID);
  if (!/^desktop_device_[A-Za-z0-9_-]{22}$/u.test(desktopDeviceId)) {
    throw new HelixAgentApiServiceError(
      503,
      "native_mcp_client_identity_unavailable",
      "The native desktop MCP client identity is unavailable.",
    );
  }
  const nativeMcpClientRef = `mcp_client:native_desktop:${crypto
    .createHash("sha256")
    .update(`${desktopDeviceId}\n${profileId}\n${session.session_id}`)
    .digest("hex")}`;
  return {
    tenantId: `desktop:${crypto
      .createHash("sha256")
      .update(profileId)
      .digest("hex")
      .slice(0, 24)}`,
    issuer: "urn:casimirbot:desktop-session",
    subjectId: profileId,
    accountProfileId: profileId,
    accountType,
    trustedDeveloperProfile: accountType === "developer",
    mcpClientRef: nativeMcpClientRef,
    oauthClientRef: null,
    scopes: new Set(allowedScopes),
    tokenExpiresAt: session.expires_at ?? null,
    accountContext: {
      session_id: session.session_id,
      profile_id: profileId,
      trusted_account_session: true,
      account_session: session,
      account_policy: session.account_policy,
    },
  };
};
