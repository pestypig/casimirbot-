import { describe, expect, it } from "vitest";
import { inspectCodexMcpOAuthReadiness } from "../../scripts/helix-codex-mcp-oauth-preflight";

const metadata = (scopes = [
  "helix.rooms.read",
  "helix.environment_actions.read",
  "helix.environment_actions.write",
  "helix.agent_runs.write",
  "helix.brokerage.paper_observer.process",
]) => ({
  resource: "http://127.0.0.1:1522/mcp",
  authorization_servers: ["https://tenant.example.auth0.com/"],
  scopes_supported: scopes,
});

const discovery = {
  issuer: "https://tenant.example.auth0.com/",
  authorization_endpoint: "https://tenant.example.auth0.com/authorize",
  token_endpoint: "https://tenant.example.auth0.com/oauth/token",
  jwks_uri: "https://tenant.example.auth0.com/.well-known/jwks.json",
  registration_endpoint: "https://tenant.example.auth0.com/oidc/register",
  code_challenge_methods_supported: ["S256"],
};

const fetcherFor = (resource = metadata(), auth = discovery): typeof fetch =>
  (async (input: string | URL | Request) => {
    const url = String(input);
    const body = url.includes("oauth-protected-resource") ? resource : auth;
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

describe("Codex MCP OAuth preflight", () => {
  it("reports the one non-secret client-registration requirement", async () => {
    const result = await inspectCodexMcpOAuthReadiness({
      fetcher: fetcherFor(),
    });

    expect(result).toMatchObject({
      status: "client_registration_required",
      resource_discovery_authoritative: true,
      oauth_resource_override_required: false,
      oauth_client_id_configured: false,
      oauth_client_secret_required: false,
      callback_port: 8766,
      callback_base_url: "http://127.0.0.1:8766/callback",
      callback_url: "http://127.0.0.1:8766/callback",
      derived_callback_url: null,
      derived_callback_valid: false,
      pkce_s256_supported: true,
      registration_endpoint_advertised: true,
      dynamic_registration_verified: false,
      mutating_request_performed: false,
      credentials_included: false,
    });
  });

  it("requires the exact Codex-derived callback after client registration", async () => {
    const result = await inspectCodexMcpOAuthReadiness({
      oauthClientId: "public-client-id",
      callbackPort: 9876,
      fetcher: fetcherFor(),
    });

    expect(result.status).toBe("derived_callback_registration_required");
    expect(result.callback_url).toBe("http://127.0.0.1:9876/callback");
    expect(result.derived_callback_url).toBeNull();
    expect(result.oauth_client_secret_required).toBe(false);
  });

  it("becomes ready only with a valid exact Codex-derived callback", async () => {
    const result = await inspectCodexMcpOAuthReadiness({
      oauthClientId: "public-client-id",
      callbackPort: 9876,
      derivedCallbackUrl: "http://127.0.0.1:9876/callback/server-id_123",
      fetcher: fetcherFor(),
    });

    expect(result).toMatchObject({
      status: "ready_for_interactive_login",
      derived_callback_url:
        "http://127.0.0.1:9876/callback/server-id_123",
      derived_callback_valid: true,
      resource_discovery_authoritative: true,
      oauth_resource_override_required: false,
    });
  });

  it("rejects wildcard, remote, or malformed derived callback URLs", async () => {
    await expect(inspectCodexMcpOAuthReadiness({
      oauthClientId: "public-client-id",
      derivedCallbackUrl: "http://127.0.0.1:8766/callback/*",
      fetcher: fetcherFor(),
    })).rejects.toThrow(/codex_mcp_derived_callback_url_invalid/);
    await expect(inspectCodexMcpOAuthReadiness({
      oauthClientId: "public-client-id",
      derivedCallbackUrl: "https://example.com/callback/server-id",
      fetcher: fetcherFor(),
    })).rejects.toThrow(/codex_mcp_derived_callback_url_invalid/);
  });

  it("fails before login when a required environment-action scope is absent", async () => {
    await expect(inspectCodexMcpOAuthReadiness({
      oauthClientId: "public-client-id",
      fetcher: fetcherFor(metadata(["helix.rooms.read"])),
    })).rejects.toThrow(
      /codex_mcp_required_scopes_missing:helix\.environment_actions\.read,helix\.environment_actions\.write/,
    );
  });

  it("requires run-write and paper-observer admission for the G8 monitor profile", async () => {
    await expect(inspectCodexMcpOAuthReadiness({
      oauthClientId: "public-client-id",
      capabilityProfile: "g8-monitor",
      fetcher: fetcherFor(metadata([
        "helix.rooms.read",
        "helix.environment_actions.read",
        "helix.environment_actions.write",
      ])),
    })).rejects.toThrow(
      /codex_mcp_required_scopes_missing:helix\.agent_runs\.write,helix\.brokerage\.paper_observer\.process/,
    );

    const result = await inspectCodexMcpOAuthReadiness({
      oauthClientId: "public-client-id",
      capabilityProfile: "g8-monitor",
      callbackPort: 9876,
      derivedCallbackUrl: "http://127.0.0.1:9876/callback/server-id_123",
      fetcher: fetcherFor(),
    });
    expect(result.capability_profile).toBe("g8-monitor");
    expect(result.required_scopes).toContain("helix.agent_runs.write");
    expect(result.required_scopes).toContain(
      "helix.brokerage.paper_observer.process",
    );
  });

  it("fails before login when PKCE S256 is unavailable", async () => {
    await expect(inspectCodexMcpOAuthReadiness({
      oauthClientId: "public-client-id",
      fetcher: fetcherFor(metadata(), {
        ...discovery,
        code_challenge_methods_supported: ["plain"],
      }),
    })).rejects.toThrow(/codex_mcp_pkce_s256_missing/);
  });

  it("constructs a single-slash protected-resource metadata URL", async () => {
    const requested: string[] = [];
    const fetcher = (async (input: string | URL | Request) => {
      const url = String(input);
      requested.push(url);
      const body = url.includes("oauth-protected-resource")
        ? metadata()
        : discovery;
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    await inspectCodexMcpOAuthReadiness({ fetcher });
    expect(requested[0]).toBe(
      "http://127.0.0.1:1522/.well-known/oauth-protected-resource/mcp",
    );
  });
});
