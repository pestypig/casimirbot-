import crypto from "node:crypto";
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
} from "jose";
import {
  AUTH0_MFA_ACR,
  AUTH0_STEP_UP_DEFAULT_MAX_AGE_SECONDS,
  AUTH0_STEP_UP_MAXIMUM_MAX_AGE_SECONDS,
  AUTH0_STEP_UP_MINIMUM_MAX_AGE_SECONDS,
  DESKTOP_AUTH0_STEP_UP_REDIRECT_URI,
  type HelixStepUpPurpose,
  type HelixStepUpStartReceipt,
} from "@shared/desktop-auth0-step-up";
import {
  DefaultHelixAgentAccessTokenVerifier,
  type HelixAgentAccessTokenVerifier,
  type HelixAgentVerifiedToken,
} from "../../auth/helix-agent-principal";
import { ensureDatabase, getPool } from "../../db/client";
import {
  HelixStepUpReceiptStore,
  helixStepUpReceiptStore,
} from "./auth0-step-up-receipt-store";

type FetchLike = typeof fetch;

export type Auth0StepUpSession = Readonly<{
  sessionId: string;
  profileId: string;
}>;

export type Auth0StepUpConfig = Readonly<{
  issuer: string;
  audience: string;
  clientId: string;
  jwksUrl: string;
  algorithms: readonly string[];
  redirectUri: typeof DESKTOP_AUTH0_STEP_UP_REDIRECT_URI;
  scope: string;
  maximumAgeSeconds: number;
  receiptTtlSeconds: number;
}>;

type PendingStepUp = Readonly<{
  session: Auth0StepUpSession;
  deviceId: string;
  purpose: HelixStepUpPurpose;
  targetRef: string | null;
  codeVerifier: string;
  nonce: string;
  expiresAtMs: number;
}>;

export class Auth0StepUpError extends Error {
  constructor(
    readonly status: number,
    readonly code:
      | "desktop_required"
      | "installed_services_locked"
      | "purpose_not_active"
      | "auth0_not_configured"
      | "invalid_request"
      | "invalid_callback"
      | "authorization_denied"
      | "step_up_intent_not_found"
      | "step_up_intent_expired"
      | "token_exchange_failed"
      | "identity_token_invalid"
      | "identity_mismatch"
      | "scope_required"
      | "mfa_required"
      | "authentication_stale",
    message: string,
  ) {
    super(message);
    this.name = "Auth0StepUpError";
  }
}

const normalized = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const exactHttpsUrl = (value: string, field: string): string => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Auth0StepUpError(
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
    throw new Auth0StepUpError(
      503,
      "auth0_not_configured",
      `${field} must be an absolute HTTPS URL without credentials, query, or fragment.`,
    );
  }
  return value;
};

const boundedSeconds = (
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number => {
  const parsed = Number.parseInt(normalized(value), 10);
  return Number.isFinite(parsed)
    ? Math.max(minimum, Math.min(maximum, parsed))
    : fallback;
};

const algorithms = (value: string | undefined): readonly string[] => {
  const admitted = new Set(["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"]);
  const values = (value ?? "RS256,ES256")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => admitted.has(entry));
  if (values.length === 0) {
    throw new Auth0StepUpError(
      503,
      "auth0_not_configured",
      "No admitted Auth0 signing algorithm is configured.",
    );
  }
  return Object.freeze(values);
};

export const resolveAuth0StepUpConfig = (
  env: NodeJS.ProcessEnv = process.env,
): Auth0StepUpConfig => {
  const issuer = normalized(env.HELIX_AGENT_OAUTH_ISSUER);
  const audience = normalized(env.HELIX_AGENT_OAUTH_AUDIENCE);
  const provider = normalized(env.HELIX_AGENT_OAUTH_PROVIDER).toLowerCase();
  const clientId = normalized(env.HELIX_AGENT_OAUTH_NATIVE_CLIENT_ID);
  const jwksUrl = normalized(env.HELIX_AGENT_OAUTH_JWKS_URL);
  if (!issuer || !audience || provider !== "auth0" || !clientId || !jwksUrl) {
    throw new Auth0StepUpError(
      503,
      "auth0_not_configured",
      "The Auth0 native MFA profile is incomplete.",
    );
  }
  exactHttpsUrl(issuer, "HELIX_AGENT_OAUTH_ISSUER");
  exactHttpsUrl(audience, "HELIX_AGENT_OAUTH_AUDIENCE");
  exactHttpsUrl(jwksUrl, "HELIX_AGENT_OAUTH_JWKS_URL");
  if (!/^[A-Za-z0-9_-]{8,256}$/u.test(clientId)) {
    throw new Auth0StepUpError(
      503,
      "auth0_not_configured",
      "HELIX_AGENT_OAUTH_NATIVE_CLIENT_ID is invalid.",
    );
  }
  return Object.freeze({
    issuer,
    audience,
    clientId,
    jwksUrl,
    algorithms: algorithms(env.HELIX_AGENT_OAUTH_ALGORITHMS),
    redirectUri: DESKTOP_AUTH0_STEP_UP_REDIRECT_URI,
    scope: "openid profile",
    maximumAgeSeconds: boundedSeconds(
      env.HELIX_AUTH0_STEP_UP_MAX_AGE_SECONDS,
      AUTH0_STEP_UP_DEFAULT_MAX_AGE_SECONDS,
      AUTH0_STEP_UP_MINIMUM_MAX_AGE_SECONDS,
      AUTH0_STEP_UP_MAXIMUM_MAX_AGE_SECONDS,
    ),
    receiptTtlSeconds: boundedSeconds(
      env.HELIX_AUTH0_STEP_UP_RECEIPT_TTL_SECONDS,
      2 * 60,
      30,
      5 * 60,
    ),
  });
};

const sha256 = (value: string | Buffer): Buffer =>
  crypto.createHash("sha256").update(value).digest();

const stateKey = (state: string): string => sha256(state).toString("hex");

const auth0Endpoint = (issuer: string, pathname: string): URL => {
  const endpoint = new URL(issuer);
  endpoint.pathname = pathname;
  endpoint.search = "";
  endpoint.hash = "";
  return endpoint;
};

const callbackValues = (
  callbackUrl: unknown,
): { state: string; code: string | null; denied: boolean } => {
  if (typeof callbackUrl !== "string" || callbackUrl.length > 8_192) {
    throw new Auth0StepUpError(400, "invalid_callback", "The Auth0 MFA callback is invalid.");
  }
  let parsed: URL;
  try {
    parsed = new URL(callbackUrl);
  } catch {
    throw new Auth0StepUpError(400, "invalid_callback", "The Auth0 MFA callback is invalid.");
  }
  if (
    parsed.protocol !== "casimirbot:" ||
    parsed.hostname !== "oauth" ||
    parsed.pathname !== "/callback" ||
    parsed.username ||
    parsed.password ||
    parsed.hash
  ) {
    throw new Auth0StepUpError(400, "invalid_callback", "The Auth0 MFA callback target is invalid.");
  }
  const states = parsed.searchParams.getAll("state");
  const state = states[0] ?? "";
  if (states.length !== 1 || !/^[A-Za-z0-9_-]{32,512}$/u.test(state)) {
    throw new Auth0StepUpError(400, "invalid_callback", "The Auth0 MFA callback state is invalid.");
  }
  const errors = parsed.searchParams.getAll("error");
  if (errors.length > 0) {
    if (errors.length !== 1 || parsed.searchParams.getAll("code").length > 0) {
      throw new Auth0StepUpError(400, "invalid_callback", "The Auth0 MFA callback parameters are invalid.");
    }
    return { state, code: null, denied: true };
  }
  const codes = parsed.searchParams.getAll("code");
  const code = codes[0] ?? "";
  if (codes.length !== 1 || !/^[A-Za-z0-9._~-]{8,4096}$/u.test(code)) {
    throw new Auth0StepUpError(400, "invalid_callback", "The Auth0 MFA authorization code is invalid.");
  }
  return { state, code, denied: false };
};

const defaultLinkedIdentityValidator = async (input: {
  session: Auth0StepUpSession;
  subject: string;
}): Promise<boolean> => {
  await ensureDatabase();
  const { rows } = await getPool().query<{ matched: boolean }>(
    `
      SELECT true AS matched
      FROM helix_account_sessions s
      JOIN helix_account_linked_providers p ON p.profile_id = s.profile_id
      JOIN helix_accounts a ON a.profile_id = s.profile_id
      WHERE s.session_id = $1
        AND s.profile_id = $2
        AND s.status = 'active'
        AND (s.expires_at IS NULL OR s.expires_at > now())
        AND p.provider = 'auth0'
        AND p.provider_subject = $3
        AND a.deleted_at IS NULL
      LIMIT 1;
    `,
    [input.session.sessionId, input.session.profileId, input.subject],
  );
  return rows[0]?.matched === true;
};

const remoteJwks = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

const defaultIdTokenVerifier = async (input: {
  token: string;
  config: Auth0StepUpConfig;
}): Promise<JWTPayload> => {
  const jwks = remoteJwks.get(input.config.jwksUrl) ?? (() => {
    const created = createRemoteJWKSet(new URL(input.config.jwksUrl));
    remoteJwks.set(input.config.jwksUrl, created);
    return created;
  })();
  try {
    const verified = await jwtVerify(input.token, jwks, {
      issuer: input.config.issuer,
      audience: input.config.clientId,
      algorithms: [...input.config.algorithms],
      clockTolerance: 5,
      // Keep cryptographic/OIDC structure failures distinct from step-up policy
      // failures. The controller validates acr/amr/auth_time immediately after
      // signature verification so a correctly signed token that lacks MFA or
      // freshness evidence fails closed with the exact policy reason instead
      // of being mislabeled as a malformed identity token.
      requiredClaims: ["sub", "exp", "iat", "nonce"],
    });
    return verified.payload;
  } catch {
    throw new Auth0StepUpError(
      403,
      "identity_token_invalid",
      "The signed Auth0 MFA identity token is invalid.",
    );
  }
};

export class Auth0StepUpController {
  private readonly pending = new Map<string, PendingStepUp>();

  constructor(
    private readonly dependencies: Readonly<{
      config?: () => Auth0StepUpConfig;
      accessTokenVerifier?: HelixAgentAccessTokenVerifier;
      verifyIdToken?: typeof defaultIdTokenVerifier;
      validateLinkedIdentity?: typeof defaultLinkedIdentityValidator;
      receiptStore?: HelixStepUpReceiptStore;
      fetch?: FetchLike;
      now?: () => Date;
      randomBytes?: (size: number) => Buffer;
    }> = {},
  ) {}

  private now(): Date {
    return (this.dependencies.now ?? (() => new Date()))();
  }

  private config(): Auth0StepUpConfig {
    return (this.dependencies.config ?? resolveAuth0StepUpConfig)();
  }

  private prune(nowMs: number): void {
    for (const [key, pending] of this.pending) {
      if (pending.expiresAtMs <= nowMs) this.pending.delete(key);
    }
  }

  start(input: {
    session: Auth0StepUpSession;
    deviceId: string;
    purpose: HelixStepUpPurpose;
    targetRef: string | null;
  }): HelixStepUpStartReceipt {
    const config = this.config();
    const now = this.now();
    this.prune(now.getTime());
    const randomBytes = this.dependencies.randomBytes ?? crypto.randomBytes;
    const state = randomBytes(32).toString("base64url");
    const codeVerifier = randomBytes(64).toString("base64url");
    const nonce = randomBytes(32).toString("base64url");
    const expiresAtMs = now.getTime() + 10 * 60_000;
    this.pending.set(stateKey(state), Object.freeze({
      session: input.session,
      deviceId: normalized(input.deviceId),
      purpose: input.purpose,
      targetRef: input.targetRef,
      codeVerifier,
      nonce,
      expiresAtMs,
    }));
    const authorize = auth0Endpoint(config.issuer, "/authorize");
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("client_id", config.clientId);
    authorize.searchParams.set("redirect_uri", config.redirectUri);
    authorize.searchParams.set("scope", config.scope);
    authorize.searchParams.set("audience", config.audience);
    authorize.searchParams.set("state", state);
    authorize.searchParams.set("code_challenge", sha256(codeVerifier).toString("base64url"));
    authorize.searchParams.set("code_challenge_method", "S256");
    authorize.searchParams.set("nonce", nonce);
    authorize.searchParams.set("acr_values", AUTH0_MFA_ACR);
    // Preserve a recently authenticated Auth0 SSO session while the exact-client
    // Action still forces a new MFA challenge for every one-purpose request.
    // Once the primary authentication is older than this bounded window Auth0
    // must actively reauthenticate it, and the returned auth_time is verified
    // again below. Do not add prompt=login: that needlessly repeats the first
    // factor even while the primary session is still fresh.
    authorize.searchParams.set("max_age", String(config.maximumAgeSeconds));
    return Object.freeze({
      schema: "helix.auth0_step_up_start.v1",
      ok: true,
      authorization_url: authorize.toString(),
      purpose: input.purpose,
      target_ref: input.targetRef,
      expires_at: new Date(expiresAtMs).toISOString(),
      provider: "auth0",
      pkce: "S256",
      nonce_bound: true,
      mfa_acr_requested: AUTH0_MFA_ACR,
      usable_receipt_included: false,
      identity_token_included: false,
      access_token_included: false,
      factor_detail_included: false,
    });
  }

  inspectStart(authorizationUrl: unknown): {
    purpose: HelixStepUpPurpose;
    target_ref: string | null;
    expires_at: string;
  } {
    if (typeof authorizationUrl !== "string" || authorizationUrl.length > 8_192) {
      throw new Auth0StepUpError(400, "invalid_request", "The MFA authorization request is invalid.");
    }
    let parsed: URL;
    try {
      parsed = new URL(authorizationUrl);
    } catch {
      throw new Auth0StepUpError(400, "invalid_request", "The MFA authorization request is invalid.");
    }
    const state = parsed.searchParams.get("state") ?? "";
    const pending = this.pending.get(stateKey(state));
    if (!pending || pending.expiresAtMs <= this.now().getTime()) {
      throw new Auth0StepUpError(404, "step_up_intent_not_found", "The MFA request was not found.");
    }
    return {
      purpose: pending.purpose,
      target_ref: pending.targetRef,
      expires_at: new Date(pending.expiresAtMs).toISOString(),
    };
  }

  async complete(callbackUrl: unknown): Promise<{
    token: string;
    receipt_ref: string;
    purpose: HelixStepUpPurpose;
    target_ref: string | null;
    expires_at: string;
  }> {
    const { state, code, denied } = callbackValues(callbackUrl);
    const key = stateKey(state);
    const pending = this.pending.get(key);
    this.pending.delete(key);
    if (!pending) {
      throw new Auth0StepUpError(404, "step_up_intent_not_found", "The MFA request was not found.");
    }
    const now = this.now();
    if (pending.expiresAtMs <= now.getTime()) {
      throw new Auth0StepUpError(410, "step_up_intent_expired", "The MFA request expired.");
    }
    if (denied || code === null) {
      throw new Auth0StepUpError(403, "authorization_denied", "Auth0 did not authorize MFA step-up.");
    }
    const config = this.config();
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
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: config.clientId,
            code,
            code_verifier: pending.codeVerifier,
            redirect_uri: config.redirectUri,
          }),
          signal: AbortSignal.timeout(15_000),
        },
      );
    } catch {
      throw new Auth0StepUpError(502, "token_exchange_failed", "The Auth0 MFA token exchange failed.");
    }
    const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    const accessToken = body?.access_token;
    const idToken = body?.id_token;
    if (
      !response.ok ||
      typeof accessToken !== "string" ||
      accessToken.length < 16 ||
      accessToken.length > 32_768 ||
      typeof idToken !== "string" ||
      idToken.length < 16 ||
      idToken.length > 32_768
    ) {
      throw new Auth0StepUpError(502, "token_exchange_failed", "The Auth0 MFA token exchange failed.");
    }
    let verifiedAccess: HelixAgentVerifiedToken;
    try {
      verifiedAccess = await (
        this.dependencies.accessTokenVerifier ??
        new DefaultHelixAgentAccessTokenVerifier()
      ).verify(accessToken);
    } catch {
      throw new Auth0StepUpError(403, "identity_mismatch", "The Auth0 MFA access identity is invalid.");
    }
    if (!verifiedAccess.scopes.has("openid")) {
      throw new Auth0StepUpError(
        403,
        "scope_required",
        "The signed Auth0 access token does not contain the required OIDC scope.",
      );
    }
    const claims = await (this.dependencies.verifyIdToken ?? defaultIdTokenVerifier)({
      token: idToken,
      config,
    });
    const subject = normalized(claims.sub);
    if (
      verifiedAccess.issuer !== config.issuer ||
      verifiedAccess.subject !== subject ||
      normalized(claims.nonce) !== pending.nonce
    ) {
      throw new Auth0StepUpError(403, "identity_mismatch", "The Auth0 MFA identity did not match the request.");
    }
    const acr = normalized(claims.acr);
    const amr = Array.isArray(claims.amr)
      ? claims.amr.filter((entry): entry is string => typeof entry === "string")
      : [];
    if (acr !== AUTH0_MFA_ACR || !amr.includes("mfa")) {
      throw new Auth0StepUpError(403, "mfa_required", "The signed Auth0 identity does not prove MFA.");
    }
    const authTime = claims.auth_time;
    if (typeof authTime !== "number" || !Number.isSafeInteger(authTime)) {
      throw new Auth0StepUpError(403, "authentication_stale", "The Auth0 authentication time is invalid.");
    }
    const ageSeconds = Math.floor(now.getTime() / 1_000) - authTime;
    if (ageSeconds < -5 || ageSeconds > config.maximumAgeSeconds) {
      throw new Auth0StepUpError(403, "authentication_stale", "The Auth0 MFA authentication is not fresh.");
    }
    const linked = await (
      this.dependencies.validateLinkedIdentity ?? defaultLinkedIdentityValidator
    )({ session: pending.session, subject });
    if (!linked) {
      throw new Auth0StepUpError(403, "identity_mismatch", "The Auth0 MFA identity is not linked to this profile.");
    }
    const issued = (
      this.dependencies.receiptStore ?? helixStepUpReceiptStore
    ).issue({
      ttlSeconds: config.receiptTtlSeconds,
      binding: {
        profileId: pending.session.profileId,
        sessionId: pending.session.sessionId,
        deviceId: pending.deviceId,
        purpose: pending.purpose,
        targetRef: pending.targetRef,
        issuer: config.issuer,
        subject,
        authTime: new Date(authTime * 1_000).toISOString(),
        amr,
        acr,
      },
    });
    return {
      token: issued.token,
      receipt_ref: issued.projection.receipt_ref,
      purpose: issued.projection.purpose,
      target_ref: issued.projection.target_ref,
      expires_at: issued.projection.expires_at,
    };
  }
}

export const auth0StepUpController = new Auth0StepUpController();
