import crypto from "node:crypto";
import type { HelixAccountSessionReceipt } from "@shared/helix-account-session";
import {
  DefaultHelixAgentAccessTokenVerifier,
  type HelixAgentAccessTokenVerifier,
} from "../../auth/helix-agent-principal";
import { HelixAgentApiServiceError } from "../helix-agent-api/errors";
import { signInWebAccountSession } from "./account-session-store";

type FetchLike = typeof fetch;

export type Auth0WebAccountSessionConfig = Readonly<{
  issuer: string;
  audience: string;
  clientId: string;
  redirectUri: string;
  scope: string;
}>;

type PendingLogin = Readonly<{
  codeVerifier: string;
  expiresAtMs: number;
  returnTo: string;
}>;

export class Auth0WebAccountSessionError extends Error {
  constructor(
    readonly status: number,
    readonly code:
      | "auth0_not_configured"
      | "invalid_callback"
      | "authorization_denied"
      | "login_intent_not_found"
      | "login_intent_expired"
      | "token_exchange_failed"
      | "signed_tenant_claim_missing"
      | "verified_identity_mismatch"
      | "session_creation_failed",
    message: string,
  ) {
    super(message);
    this.name = "Auth0WebAccountSessionError";
  }
}

const normalized = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const exactHttpsIdentifier = (value: string, field: string): string => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Auth0WebAccountSessionError(
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
    throw new Auth0WebAccountSessionError(
      503,
      "auth0_not_configured",
      `${field} must be an absolute HTTPS URL without credentials, query, or fragment.`,
    );
  }
  return value;
};

const exactRedirectUri = (value: string): string => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Auth0WebAccountSessionError(
      503,
      "auth0_not_configured",
      "HELIX_ACCOUNT_AUTH0_REDIRECT_URI must be an absolute URL.",
    );
  }
  const production = normalized(process.env.NODE_ENV).toLowerCase() === "production";
  const loopbackHttp =
    parsed.protocol === "http:" &&
    (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost");
  if (
    (production ? parsed.protocol !== "https:" : parsed.protocol !== "https:" && !loopbackHttp) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== "/api/auth/auth0/callback"
  ) {
    throw new Auth0WebAccountSessionError(
      503,
      "auth0_not_configured",
      "The Auth0 web-session callback is not an admitted exact callback URL.",
    );
  }
  return parsed.toString();
};

export const resolveAuth0WebAccountSessionConfig = (
  env: NodeJS.ProcessEnv = process.env,
): Auth0WebAccountSessionConfig => {
  const issuer = normalized(env.HELIX_AGENT_OAUTH_ISSUER);
  const audience = normalized(env.HELIX_AGENT_OAUTH_AUDIENCE);
  const provider = normalized(env.HELIX_AGENT_OAUTH_PROVIDER).toLowerCase();
  const clientId = normalized(env.HELIX_AGENT_OAUTH_NATIVE_CLIENT_ID);
  const port = normalized(env.PORT) || "5050";
  const redirectUri =
    normalized(env.HELIX_ACCOUNT_AUTH0_REDIRECT_URI) ||
    `http://127.0.0.1:${port}/api/auth/auth0/callback`;
  if (!issuer || !audience || provider !== "auth0" || !clientId) {
    throw new Auth0WebAccountSessionError(
      503,
      "auth0_not_configured",
      "The Auth0 web account-session profile is incomplete.",
    );
  }
  exactHttpsIdentifier(issuer, "HELIX_AGENT_OAUTH_ISSUER");
  exactHttpsIdentifier(audience, "HELIX_AGENT_OAUTH_AUDIENCE");
  if (!/^[A-Za-z0-9_-]{8,256}$/u.test(clientId)) {
    throw new Auth0WebAccountSessionError(
      503,
      "auth0_not_configured",
      "HELIX_AGENT_OAUTH_NATIVE_CLIENT_ID is invalid.",
    );
  }
  return Object.freeze({
    issuer,
    audience,
    clientId,
    redirectUri: exactRedirectUri(redirectUri),
    scope: "openid profile email",
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

const admittedReturnTo = (value: unknown): string => {
  const candidate = normalized(value);
  if (
    candidate.length > 2_048 ||
    !candidate.startsWith("/desktop") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001f\u007f]/u.test(candidate)
  ) {
    return "/desktop?panels=account-session&focus=account-session";
  }
  return candidate;
};

const safeClaim = (value: unknown, maxLength: number): string | null => {
  const candidate = normalized(value)
    .replace(/[\u0000-\u001f\u007f-\u009f]/gu, " ")
    .replace(/\s+/gu, " ")
    .slice(0, maxLength);
  return candidate || null;
};

export class Auth0WebAccountSessionController {
  private readonly pending = new Map<string, PendingLogin>();

  constructor(
    private readonly dependencies: {
      verifier?: HelixAgentAccessTokenVerifier;
      fetch?: FetchLike;
      now?: () => Date;
      randomBytes?: (size: number) => Buffer;
      config?: () => Auth0WebAccountSessionConfig;
      signIn?: typeof signInWebAccountSession;
    } = {},
  ) {}

  private now(): Date {
    return (this.dependencies.now ?? (() => new Date()))();
  }

  private config(): Auth0WebAccountSessionConfig {
    return (this.dependencies.config ?? resolveAuth0WebAccountSessionConfig)();
  }

  private verifier(): HelixAgentAccessTokenVerifier {
    return this.dependencies.verifier ?? new DefaultHelixAgentAccessTokenVerifier();
  }

  private prune(nowMs: number): void {
    for (const [key, pending] of this.pending) {
      if (pending.expiresAtMs <= nowMs) this.pending.delete(key);
    }
  }

  start(returnToValue: unknown): { authorizationUrl: string; expiresAt: string } {
    const config = this.config();
    const now = this.now();
    this.prune(now.getTime());
    const randomBytes = this.dependencies.randomBytes ?? crypto.randomBytes;
    const state = randomBytes(32).toString("base64url");
    const codeVerifier = randomBytes(64).toString("base64url");
    const codeChallenge = sha256(codeVerifier).toString("base64url");
    const expiresAtMs = now.getTime() + 10 * 60_000;
    this.pending.set(stateKey(state), {
      codeVerifier,
      expiresAtMs,
      returnTo: admittedReturnTo(returnToValue),
    });
    const authorize = auth0Endpoint(config.issuer, "/authorize");
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("client_id", config.clientId);
    authorize.searchParams.set("redirect_uri", config.redirectUri);
    authorize.searchParams.set("scope", config.scope);
    authorize.searchParams.set("audience", config.audience);
    authorize.searchParams.set("state", state);
    authorize.searchParams.set("code_challenge", codeChallenge);
    authorize.searchParams.set("code_challenge_method", "S256");
    return {
      authorizationUrl: authorize.toString(),
      expiresAt: new Date(expiresAtMs).toISOString(),
    };
  }

  async complete(query: unknown): Promise<{
    receipt: HelixAccountSessionReceipt;
    returnTo: string;
  }> {
    const record =
      query && typeof query === "object" && !Array.isArray(query)
        ? (query as Record<string, unknown>)
        : {};
    const state = normalized(record.state);
    if (!/^[A-Za-z0-9_-]{32,512}$/u.test(state)) {
      throw new Auth0WebAccountSessionError(
        400,
        "invalid_callback",
        "The Auth0 callback state is invalid.",
      );
    }
    const key = stateKey(state);
    const pending = this.pending.get(key);
    this.pending.delete(key);
    if (!pending) {
      throw new Auth0WebAccountSessionError(
        404,
        "login_intent_not_found",
        "The Auth0 web login intent was not found.",
      );
    }
    if (pending.expiresAtMs <= this.now().getTime()) {
      throw new Auth0WebAccountSessionError(
        410,
        "login_intent_expired",
        "The Auth0 web login intent expired.",
      );
    }
    if (normalized(record.error)) {
      throw new Auth0WebAccountSessionError(
        403,
        "authorization_denied",
        "Auth0 did not authorize the web account session.",
      );
    }
    const code = normalized(record.code);
    if (!/^[A-Za-z0-9._~-]{8,4096}$/u.test(code)) {
      throw new Auth0WebAccountSessionError(
        400,
        "invalid_callback",
        "The Auth0 callback code is invalid.",
      );
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
      throw new Auth0WebAccountSessionError(
        502,
        "token_exchange_failed",
        "The Auth0 web-session token exchange failed.",
      );
    }
    const body = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const accessToken = body?.access_token;
    if (
      !response.ok ||
      typeof accessToken !== "string" ||
      accessToken.length < 16 ||
      accessToken.length > 32_768
    ) {
      throw new Auth0WebAccountSessionError(
        502,
        "token_exchange_failed",
        "The Auth0 web-session token exchange failed.",
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
        throw new Auth0WebAccountSessionError(
          403,
          "signed_tenant_claim_missing",
          "The Auth0 access token is missing the configured signed tenant claim.",
        );
      }
      throw new Auth0WebAccountSessionError(
        403,
        "verified_identity_mismatch",
        "The Auth0 access token could not be verified for this account session.",
      );
    }
    if (
      verified.issuer !== config.issuer ||
      verifier.authorizationServer() !== config.issuer ||
      verifier.audience() !== config.audience ||
      verifier.providerAlias() !== "auth0"
    ) {
      throw new Auth0WebAccountSessionError(
        403,
        "verified_identity_mismatch",
        "The verified Auth0 identity does not match this account-session profile.",
      );
    }
    const claims = verified.claims;
    const signIn = this.dependencies.signIn ?? signInWebAccountSession;
    const receipt = await signIn({
      provider: "auth0",
      provider_subject: verified.subject,
      display_name: safeClaim(claims.name ?? claims.nickname, 160),
      email: safeClaim(claims.email, 320),
      picture_url: safeClaim(claims.picture, 2_048),
    });
    if (!receipt.ok || !receipt.session) {
      throw new Auth0WebAccountSessionError(
        500,
        "session_creation_failed",
        "The verified Auth0 identity could not start a CasimirBot profile session.",
      );
    }
    return { receipt, returnTo: pending.returnTo };
  }
}

export const auth0WebAccountSessionController =
  new Auth0WebAccountSessionController();
