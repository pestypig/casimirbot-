import { timingSafeEqual } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
import type { RequestHandler } from "express";
import { isPublicRoomSourceIngressPath } from
  "../auth/public-source-ingress";

export const CASIMIR_DESKTOP_HOST_ENV = "CASIMIR_DESKTOP_HOST";
export const CASIMIR_DESKTOP_SESSION_SECRET_ENV =
  "CASIMIR_DESKTOP_SESSION_SECRET";
export const CASIMIR_DESKTOP_SESSION_HEADER =
  "x-casimir-desktop-session";

const MIN_DESKTOP_SESSION_SECRET_LENGTH = 32;
const OAUTH_PROTECTED_RESOURCE_METADATA_PATH =
  "/.well-known/oauth-protected-resource";
const PUBLIC_ENVIRONMENT_CONNECTOR_PATH =
  "/api/environment-connectors/v1/";
const PUBLIC_ENVIRONMENT_ACTION_CONNECTOR_PATH =
  "/api/environment-action/v1/authorities/";
export const DESKTOP_ROBINHOOD_OAUTH_CALLBACK_PATH =
  "/api/agi/brokerage-connections/robinhood/oauth/callback";

export type DesktopSessionConfig = Readonly<{
  enabled: boolean;
  headerName: typeof CASIMIR_DESKTOP_SESSION_HEADER;
  secret: string | null;
}>;

const enabledFlag = (value: string | undefined): boolean => {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true";
};

export function resolveDesktopSessionConfig(
  env: NodeJS.ProcessEnv,
): DesktopSessionConfig {
  const enabled = enabledFlag(env[CASIMIR_DESKTOP_HOST_ENV]);
  if (!enabled) {
    return Object.freeze({
      enabled: false,
      headerName: CASIMIR_DESKTOP_SESSION_HEADER,
      secret: null,
    });
  }

  const secret = env[CASIMIR_DESKTOP_SESSION_SECRET_ENV]?.trim() ?? "";
  if (secret.length < MIN_DESKTOP_SESSION_SECRET_LENGTH) {
    throw new Error(
      `${CASIMIR_DESKTOP_SESSION_SECRET_ENV} must contain at least ${MIN_DESKTOP_SESSION_SECRET_LENGTH} characters when desktop host mode is enabled`,
    );
  }

  return Object.freeze({
    enabled: true,
    headerName: CASIMIR_DESKTOP_SESSION_HEADER,
    secret,
  });
}

const singleHeaderValue = (
  value: string | string[] | undefined,
): string | null => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length === 1) return value[0] ?? null;
  return null;
};

const secretsEqual = (provided: string, expected: string): boolean => {
  const providedBytes = Buffer.from(provided, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  if (providedBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(providedBytes, expectedBytes);
};

export function isDesktopSessionAuthorized(
  headers: IncomingHttpHeaders,
  config: DesktopSessionConfig,
): boolean {
  if (!config.enabled) return true;
  if (!config.secret) return false;
  const provided = singleHeaderValue(headers[config.headerName]);
  return provided !== null && secretsEqual(provided, config.secret);
}

export function createDesktopSessionGuard(
  config: DesktopSessionConfig,
): RequestHandler {
  return (req, res, next) => {
    const method = (req.method ?? "").toUpperCase();
    const isPublicProtectedResourceMetadata = config.enabled &&
      (method === "GET" || method === "HEAD") &&
      (req.path === OAUTH_PROTECTED_RESOURCE_METADATA_PATH ||
        req.path.startsWith(`${OAUTH_PROTECTED_RESOURCE_METADATA_PATH}/`));
    const isOneTimeRobinhoodCallback = config.enabled &&
      method === "GET" &&
      req.path === DESKTOP_ROBINHOOD_OAUTH_CALLBACK_PATH;
    // These transports already enforce their own one-time-code, bearer-token,
    // signature, replay, body-limit, and rate-limit boundaries. A Fabric or
    // Paper process cannot possess the renderer-only per-launch desktop secret,
    // so requiring it here would make installed-node pairing and evidence
    // delivery impossible while adding no connector authority.
    const isIndependentEnvironmentConnectorTransport = config.enabled &&
      (req.path ?? "").startsWith(PUBLIC_ENVIRONMENT_CONNECTOR_PATH);
    const isIndependentEnvironmentActionConnectorTransport = config.enabled &&
      (req.path ?? "").startsWith(PUBLIC_ENVIRONMENT_ACTION_CONNECTOR_PATH);
    const isIndependentRoomSourceIngress = config.enabled &&
      isPublicRoomSourceIngressPath(req.originalUrl ?? req.path);
    if (
      isPublicProtectedResourceMetadata ||
      isOneTimeRobinhoodCallback ||
      isIndependentEnvironmentConnectorTransport ||
      isIndependentEnvironmentActionConnectorTransport ||
      isIndependentRoomSourceIngress ||
      isDesktopSessionAuthorized(req.headers, config)
    ) {
      next();
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.status(401).json({
      error: "desktop_session_required",
      message: "A valid native desktop session is required.",
    });
  };
}
