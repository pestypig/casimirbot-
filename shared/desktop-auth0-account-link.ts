export const DESKTOP_AUTH0_ACCOUNT_LINK_START_SCHEMA =
  "casimir_desktop_auth0_account_link_start/1" as const;

export const DESKTOP_AUTH0_ACCOUNT_LINK_COMPLETION_SCHEMA =
  "casimir_desktop_auth0_account_link_completion/1" as const;

export const DESKTOP_AUTH0_ACCOUNT_LINK_START_PATH =
  "/api/account/session/agent-bindings/auth0/start" as const;

export const DESKTOP_AUTH0_ACCOUNT_LINK_CALLBACK_PATH =
  "/api/account/session/agent-bindings/auth0/callback" as const;

export const DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI =
  "casimirbot://oauth/callback" as const;

export type DesktopAuth0AccountLinkStartReceipt = Readonly<{
  schema: typeof DESKTOP_AUTH0_ACCOUNT_LINK_START_SCHEMA;
  ok: true;
  authorization_url: string;
  expires_at: string;
  provider: "auth0";
  pkce: "S256";
  client_secret_used: false;
  bearer_included: false;
  subject_included: false;
}>;

export type DesktopAuth0AccountLinkCompletion = Readonly<{
  schema: typeof DESKTOP_AUTH0_ACCOUNT_LINK_COMPLETION_SCHEMA;
  ok: boolean;
  error?: string;
  bearer_included: false;
  subject_included: false;
}>;

const record = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const parseDesktopAuth0AccountLinkStartReceipt = (
  value: unknown,
): DesktopAuth0AccountLinkStartReceipt | null => {
  if (
    !record(value) ||
    value.schema !== DESKTOP_AUTH0_ACCOUNT_LINK_START_SCHEMA ||
    value.ok !== true ||
    value.provider !== "auth0" ||
    value.pkce !== "S256" ||
    value.client_secret_used !== false ||
    value.bearer_included !== false ||
    value.subject_included !== false ||
    typeof value.authorization_url !== "string" ||
    typeof value.expires_at !== "string"
  ) {
    return null;
  }
  try {
    const authorizationUrl = new URL(value.authorization_url);
    const expiresAt = new Date(value.expires_at);
    if (
      authorizationUrl.protocol !== "https:" ||
      authorizationUrl.username ||
      authorizationUrl.password ||
      authorizationUrl.hash ||
      !Number.isFinite(expiresAt.getTime())
    ) {
      return null;
    }
  } catch {
    return null;
  }
  return value as DesktopAuth0AccountLinkStartReceipt;
};

export const parseDesktopAuth0AccountLinkCompletion = (
  value: unknown,
): DesktopAuth0AccountLinkCompletion | null => {
  if (
    !record(value) ||
    value.schema !== DESKTOP_AUTH0_ACCOUNT_LINK_COMPLETION_SCHEMA ||
    typeof value.ok !== "boolean" ||
    value.bearer_included !== false ||
    value.subject_included !== false ||
    (value.error !== undefined && typeof value.error !== "string")
  ) {
    return null;
  }
  return value as DesktopAuth0AccountLinkCompletion;
};
