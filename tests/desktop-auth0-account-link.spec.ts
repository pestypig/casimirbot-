import { describe, expect, it } from "vitest";
import {
  DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI,
  parseDesktopAuth0AccountLinkCompletion,
  parseDesktopAuth0AccountLinkStartReceipt,
} from "../shared/desktop-auth0-account-link";
import {
  extractDesktopAuth0Callback,
  isAllowedDesktopAuth0AuthorizationUrl,
  shouldRegisterDesktopProtocol,
} from "../apps/desktop/src/auth0-account-link";

const issuer = "https://tenant.auth0.com/";
const clientId = "nativeClientId_123456";
const authorizationUrl = (): string => {
  const value = new URL("https://tenant.auth0.com/authorize");
  value.searchParams.set("response_type", "code");
  value.searchParams.set("client_id", clientId);
  value.searchParams.set("redirect_uri", DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI);
  value.searchParams.set("scope", "openid profile");
  value.searchParams.set("audience", "https://casimirbot.com/mcp");
  value.searchParams.set("state", "s".repeat(43));
  value.searchParams.set("code_challenge", "c".repeat(43));
  value.searchParams.set("code_challenge_method", "S256");
  return value.toString();
};

describe("desktop Auth0 account-link host boundary", () => {
  it("admits only the configured issuer, public client, redirect, and S256 request", () => {
    expect(
      isAllowedDesktopAuth0AuthorizationUrl(authorizationUrl(), {
        issuer,
        clientId,
      }),
    ).toBe(true);
    expect(
      isAllowedDesktopAuth0AuthorizationUrl(
        authorizationUrl().replace("tenant.auth0.com", "attacker.example"),
        { issuer, clientId },
      ),
    ).toBe(false);
    expect(
      isAllowedDesktopAuth0AuthorizationUrl(
        authorizationUrl().replace("S256", "plain"),
        { issuer, clientId },
      ),
    ).toBe(false);
    expect(
      isAllowedDesktopAuth0AuthorizationUrl(
        `${authorizationUrl()}&client_id=${clientId}`,
        { issuer, clientId },
      ),
    ).toBe(false);
  });

  it("extracts only the exact custom-protocol callback from process arguments", () => {
    const callback = `${DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI}?code=code-value-123&state=${"s".repeat(43)}`;
    expect(extractDesktopAuth0Callback(["CasimirBot.exe", callback])).toBe(
      callback,
    );
    expect(
      extractDesktopAuth0Callback([
        "CasimirBot.exe",
        callback.replace("casimirbot://oauth", "casimirbot://attacker"),
      ]),
    ).toBeNull();
  });

  it("parses only sanitized renderer receipts", () => {
    expect(
      parseDesktopAuth0AccountLinkStartReceipt({
        schema: "casimir_desktop_auth0_account_link_start/1",
        ok: true,
        authorization_url: authorizationUrl(),
        expires_at: "2026-08-11T20:10:00.000Z",
        provider: "auth0",
        pkce: "S256",
        client_secret_used: false,
        bearer_included: false,
        subject_included: false,
      }),
    ).not.toBeNull();
    expect(
      parseDesktopAuth0AccountLinkCompletion({
        schema: "casimir_desktop_auth0_account_link_completion/1",
        ok: true,
        bearer_included: false,
        subject_included: false,
      }),
    ).not.toBeNull();
  });

  it("does not let isolated smoke profiles replace protocol ownership", () => {
    expect(shouldRegisterDesktopProtocol(false)).toBe(true);
    expect(shouldRegisterDesktopProtocol(true)).toBe(false);
  });
});
