import crypto from "node:crypto";
import {
  DefaultHelixAgentAccessTokenVerifier,
  type HelixAgentAccessTokenVerifier,
} from "../../auth/helix-agent-principal";
import {
  DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI,
  DESKTOP_AUTH0_ACCOUNT_LINK_START_SCHEMA,
  type DesktopAuth0AccountLinkStartReceipt,
} from "@shared/desktop-auth0-account-link";
import { HELIX_FRIENDS_PARTIES_COORDINATION_SCOPE } from
  "@shared/helix-friends-voice-party";
import {
  HelixAgentAccountLinkError,
  helixAgentAccountLinkStore,
  type HelixAgentAccountLinkSession,
  type HelixAgentAccountLinkStore,
} from "./agent-account-link-store";
import { HelixAgentApiServiceError } from "../helix-agent-api/errors";
import { bootstrapDesktopFriendsPartiesCoordination } from
  "../helix-social/friends-parties-coordination-client";

type FetchLike = typeof fetch;

export type Auth0NativeAccountLinkConfig = Readonly<{
  issuer: string;
  audience: string;
  providerAlias: "auth0";
  clientId: string;
  redirectUri: typeof DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI;
  scope: string;
}>;

type PendingLink = Readonly<{
  session: HelixAgentAccountLinkSession;
  codeVerifier: string;
  expiresAtMs: number;
}>;

export class Auth0NativeAccountLinkError extends Error {
  constructor(
    readonly status: number,
    readonly code:
      | "desktop_required"
      | "auth0_not_configured"
      | "invalid_callback"
      | "authorization_denied"
      | "link_intent_not_found"
      | "link_intent_expired"
      | "token_exchange_failed"
      | "signed_tenant_claim_missing"
      | "verified_identity_mismatch",
    message: string,
  ) {
    super(message);
    this.name = "Auth0NativeAccountLinkError";
  }
}

const normalized = (value: string | undefined): string => value?.trim() ?? "";

const exactHttpsIdentifier = (value: string, field: string): string => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Auth0NativeAccountLinkError(
      503,
      "auth0_not_configured",
      `${field} must be an absolute HTTPS URL.`,
    );
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Auth0NativeAccountLinkError(
      503,
      "auth0_not_configured",
      `${field} must be an absolute HTTPS URL without credentials, query, or fragment.`,
    );
  }
  return value;
};

export const resolveAuth0NativeAccountLinkConfig = (
  env: NodeJS.ProcessEnv = process.env,
): Auth0NativeAccountLinkConfig => {
  const issuer = normalized(env.HELIX_AGENT_OAUTH_ISSUER);
  const audience = normalized(env.HELIX_AGENT_OAUTH_AUDIENCE);
  const providerAlias = normalized(env.HELIX_AGENT_OAUTH_PROVIDER).toLowerCase();
  const clientId = normalized(env.HELIX_AGENT_OAUTH_NATIVE_CLIENT_ID);
  const scope = normalized(env.HELIX_AGENT_OAUTH_LINK_SCOPE) ||
    `openid profile ${HELIX_FRIENDS_PARTIES_COORDINATION_SCOPE}`;
  if (!issuer || !audience || providerAlias !== "auth0" || !clientId) {
    throw new Auth0NativeAccountLinkError(
      503,
      "auth0_not_configured",
      "The Auth0 native account-link profile is incomplete.",
    );
  }
  exactHttpsIdentifier(issuer, "HELIX_AGENT_OAUTH_ISSUER");
  exactHttpsIdentifier(audience, "HELIX_AGENT_OAUTH_AUDIENCE");
  if (!/^[A-Za-z0-9_-]{8,256}$/u.test(clientId)) {
    throw new Auth0NativeAccountLinkError(
      503,
      "auth0_not_configured",
      "HELIX_AGENT_OAUTH_NATIVE_CLIENT_ID is invalid.",
    );
  }
  const scopes = scope.split(/\s+/u).filter(Boolean);
  if (
    scopes.length === 0 ||
    scopes.length > 16 ||
    scopes.some((entry) => !/^[A-Za-z0-9:._/-]{1,128}$/u.test(entry))
  ) {
    throw new Auth0NativeAccountLinkError(
      503,
      "auth0_not_configured",
      "HELIX_AGENT_OAUTH_LINK_SCOPE is invalid.",
    );
  }
  return Object.freeze({
    issuer,
    audience,
    providerAlias: "auth0",
    clientId,
    redirectUri: DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI,
    scope: scopes.join(" "),
  });
};

const sha256 = (value: string | Buffer): Buffer =>
  crypto.createHash("sha256").update(value).digest();

const stateKey = (state: string): string => sha256(state).toString("hex");

const auth0Endpoint = (issuer: string, path: string): URL => {
  const base = new URL(issuer);
  base.pathname = path;
  base.search = "";
  base.hash = "";
  return base;
};

const strictCallback = (
  callbackUrl: unknown,
): { state: string; code: string | null; denied: boolean } => {
  if (typeof callbackUrl !== "string" || callbackUrl.length > 8_192) {
    throw new Auth0NativeAccountLinkError(
      400,
      "invalid_callback",
      "The desktop OAuth callback is invalid.",
    );
  }
  let parsed: URL;
  try {
    parsed = new URL(callbackUrl);
  } catch {
    throw new Auth0NativeAccountLinkError(
      400,
      "invalid_callback",
      "The desktop OAuth callback is invalid.",
    );
  }
  if (
    parsed.protocol !== "casimirbot:" ||
    parsed.hostname !== "oauth" ||
    parsed.pathname !== "/callback" ||
    parsed.username ||
    parsed.password ||
    parsed.hash
  ) {
    throw new Auth0NativeAccountLinkError(
      400,
      "invalid_callback",
      "The desktop OAuth callback target is invalid.",
    );
  }
  const states = parsed.searchParams.getAll("state");
  const state = states[0] ?? "";
  if (states.length !== 1 || !/^[A-Za-z0-9_-]{32,512}$/u.test(state)) {
    throw new Auth0NativeAccountLinkError(
      400,
      "invalid_callback",
      "The desktop OAuth callback state is invalid.",
    );
  }
  const errors = parsed.searchParams.getAll("error");
  if (errors.length > 0) {
    if (errors.length !== 1 || parsed.searchParams.getAll("code").length > 0) {
      throw new Auth0NativeAccountLinkError(
        400,
        "invalid_callback",
        "The desktop OAuth callback parameters are invalid.",
      );
    }
    return { state, code: null, denied: true };
  }
  const codes = parsed.searchParams.getAll("code");
  const code = codes[0] ?? "";
  if (codes.length !== 1 || !/^[A-Za-z0-9._~-]{8,4096}$/u.test(code)) {
    throw new Auth0NativeAccountLinkError(
      400,
      "invalid_callback",
      "The desktop OAuth authorization code is invalid.",
    );
  }
  return { state, code, denied: false };
};

export class Auth0NativeAccountLinkController {
  private readonly pending = new Map<string, PendingLink>();

  constructor(
    private readonly dependencies: {
      store?: Pick<
        HelixAgentAccountLinkStore,
        "createLinkIntent" | "completeLinkIntent"
      >;
      verifier?: HelixAgentAccessTokenVerifier;
      fetch?: FetchLike;
      now?: () => Date;
      randomBytes?: (size: number) => Buffer;
      config?: () => Auth0NativeAccountLinkConfig;
      coordinationBootstrap?: typeof bootstrapDesktopFriendsPartiesCoordination;
    } = {},
  ) {}

  private now(): Date {
    return (this.dependencies.now ?? (() => new Date()))();
  }

  private config(): Auth0NativeAccountLinkConfig {
    return (this.dependencies.config ?? resolveAuth0NativeAccountLinkConfig)();
  }

  private store(): Pick<
    HelixAgentAccountLinkStore,
    "createLinkIntent" | "completeLinkIntent"
  > {
    return this.dependencies.store ?? helixAgentAccountLinkStore;
  }

  private verifier(): HelixAgentAccessTokenVerifier {
    return (
      this.dependencies.verifier ?? new DefaultHelixAgentAccessTokenVerifier()
    );
  }

  private prunePending(nowMs: number): void {
    for (const [key, pending] of this.pending) {
      if (pending.expiresAtMs <= nowMs) this.pending.delete(key);
    }
  }

  async start(
    session: HelixAgentAccountLinkSession,
  ): Promise<DesktopAuth0AccountLinkStartReceipt> {
    const config = this.config();
    const now = this.now();
    this.prunePending(now.getTime());
    const intent = await this.store().createLinkIntent({
      session,
      expectedIssuer: config.issuer,
      expectedAudience: config.audience,
      expectedProvider: config.providerAlias,
      ttlSeconds: 10 * 60,
    });
    const randomBytes = this.dependencies.randomBytes ?? crypto.randomBytes;
    const codeVerifier = randomBytes(64).toString("base64url");
    const codeChallenge = sha256(codeVerifier).toString("base64url");
    this.pending.set(stateKey(intent.state), {
      session,
      codeVerifier,
      expiresAtMs: Date.parse(intent.expires_at),
    });

    const authorize = auth0Endpoint(config.issuer, "/authorize");
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("client_id", config.clientId);
    authorize.searchParams.set("redirect_uri", config.redirectUri);
    authorize.searchParams.set("scope", config.scope);
    authorize.searchParams.set("audience", config.audience);
    authorize.searchParams.set("state", intent.state);
    authorize.searchParams.set("code_challenge", codeChallenge);
    authorize.searchParams.set("code_challenge_method", "S256");

    return Object.freeze({
      schema: DESKTOP_AUTH0_ACCOUNT_LINK_START_SCHEMA,
      ok: true,
      authorization_url: authorize.toString(),
      expires_at: intent.expires_at,
      provider: "auth0",
      pkce: "S256",
      client_secret_used: false,
      bearer_included: false,
      subject_included: false,
    });
  }

  async complete(callbackUrl: unknown): Promise<{
    schema: "helix.agent_account_binding_receipt.v1";
    operation: "agent_account_binding.complete";
    binding: unknown;
    answer_authority: false;
    assistant_answer: false;
    raw_identity_included: false;
    bearer_included: false;
  }> {
    const { state, code, denied } = strictCallback(callbackUrl);
    const key = stateKey(state);
    const pending = this.pending.get(key);
    this.pending.delete(key);
    if (!pending) {
      throw new Auth0NativeAccountLinkError(
        404,
        "link_intent_not_found",
        "The desktop OAuth link intent was not found.",
      );
    }
    if (pending.expiresAtMs <= this.now().getTime()) {
      throw new Auth0NativeAccountLinkError(
        410,
        "link_intent_expired",
        "The desktop OAuth link intent has expired.",
      );
    }
    if (denied || code === null) {
      throw new Auth0NativeAccountLinkError(
        403,
        "authorization_denied",
        "Auth0 did not authorize the account link.",
      );
    }

    const config = this.config();
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      code,
      code_verifier: pending.codeVerifier,
      redirect_uri: config.redirectUri,
    });
    let response: Response;
    try {
      response = await (this.dependencies.fetch ?? fetch)(
        auth0Endpoint(config.issuer, "/oauth/token"),
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
          signal: AbortSignal.timeout(15_000),
        },
      );
    } catch {
      throw new Auth0NativeAccountLinkError(
        502,
        "token_exchange_failed",
        "The Auth0 token exchange failed.",
      );
    }
    let tokenBody: unknown = null;
    try {
      tokenBody = await response.json();
    } catch {
      // The error surface below is intentionally fixed and non-reflective.
    }
    const tokenRecord =
      tokenBody && typeof tokenBody === "object" && !Array.isArray(tokenBody)
        ? (tokenBody as Record<string, unknown>)
        : null;
    const accessToken = tokenRecord?.access_token;
    if (
      !response.ok ||
      typeof accessToken !== "string" ||
      accessToken.length < 16 ||
      accessToken.length > 32_768
    ) {
      throw new Auth0NativeAccountLinkError(
        502,
        "token_exchange_failed",
        "The Auth0 token exchange failed.",
      );
    }

    const verifier = this.verifier();
    let verified;
    try {
      verified = await verifier.verify(accessToken);
    } catch (error) {
      if (
        error instanceof HelixAgentApiServiceError &&
        error.code === "tenant_required"
      ) {
        throw new Auth0NativeAccountLinkError(
          403,
          "signed_tenant_claim_missing",
          "The Auth0 access token is missing the configured signed tenant claim.",
        );
      }
      throw new Auth0NativeAccountLinkError(
        403,
        "verified_identity_mismatch",
        "The Auth0 access token could not be verified for this account-link profile.",
      );
    }
    if (
      verified.issuer !== config.issuer ||
      verifier.authorizationServer() !== config.issuer ||
      verifier.audience() !== config.audience ||
      verifier.providerAlias() !== config.providerAlias
    ) {
      throw new Auth0NativeAccountLinkError(
        403,
        "verified_identity_mismatch",
        "The verified Auth0 identity does not match the account-link profile.",
      );
    }
    const receipt = await this.store().completeLinkIntent({
      session: pending.session,
      state,
      // Reaching this point requires a fresh native PKCE authorization that
      // the signed-in user explicitly started from Agent Connections. Treat
      // that completed authorization as the store's required reactivation
      // consent when the same profile binding was previously revoked.
      reactivate: true,
      identity: {
        issuer: verified.issuer,
        audience: config.audience,
        tenantId: verified.tenantId,
        providerAlias: config.providerAlias,
        subject: verified.subject,
      },
    });
    await (
      this.dependencies.coordinationBootstrap ??
      bootstrapDesktopFriendsPartiesCoordination
    )({
      accessToken,
      localProfileId: pending.session.profileId,
      localSessionId: pending.session.sessionId,
    });
    return receipt;
  }
}

export const auth0NativeAccountLinkController =
  new Auth0NativeAccountLinkController();
