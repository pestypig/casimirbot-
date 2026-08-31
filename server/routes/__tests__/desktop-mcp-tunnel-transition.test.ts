import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DesktopMcpTunnelTransitionStore } from
  "../../services/local-supervisor/desktop-mcp-tunnel-transition-store";

const { getAccountSessionById } = vi.hoisted(() => ({
  getAccountSessionById: vi.fn(),
}));
vi.mock("../../services/helix-account/account-session-store", () => ({
  getAccountSessionById,
}));

import { createDesktopMcpTunnelTransitionRouter } from
  "../desktop-mcp-tunnel-transition";

const serviceInstanceRef =
  "service_instance:77777777777777777777777777777777";
const sessionId = "account_session:developer-owner";
const profileId = "profile:developer-owner";

const session = (accountType: "developer" | "user" = "developer") => ({
  session_id: sessionId,
  status: "active",
  profile: { profile_id: profileId },
  account_policy: { account_type: accountType },
});

const setup = () => {
  const store = new DesktopMcpTunnelTransitionStore(serviceInstanceRef);
  const created = store.request({
    identity: {
      serviceInstanceRef,
      clientSessionRef: "supervisor_client:route-fixture",
      conversationThreadRef: "codex_thread:route-fixture",
      authenticatedProfileRef: profileId,
      authenticatedMcpClientRef: "mcp_client:native_desktop:route-fixture",
      accountSessionId: sessionId,
      clientIdentityAssurance:
        "native_tunnel_client_plus_server_derived_continuation",
      independentExternalOAuthClientBound: false,
    },
    declaredTaskSummary: "Refresh the admitted MCP catalog.",
    requestedLeaseSeconds: 120,
  });
  const onRevoked = vi.fn(async () => undefined);
  const app = express();
  app.use(
    "/api/desktop/mcp-tunnel-transition",
    createDesktopMcpTunnelTransitionRouter({ store, onRevoked }),
  );
  return { app, store, created, onRevoked };
};

describe("desktop MCP tunnel transition consent route", () => {
  beforeEach(() => {
    getAccountSessionById.mockReset();
    getAccountSessionById.mockResolvedValue(session());
  });

  it("rejects missing/cross origin and non-developer consent before granting", async () => {
    const { app, created } = setup();
    const path = `/api/desktop/mcp-tunnel-transition/requests/${encodeURIComponent(
      created.request.transition_request_ref,
    )}/delegate`;
    const cookie = `helix_session=${encodeURIComponent(sessionId)}`;
    const missingOrigin = await request(app)
      .post(path)
      .set("Cookie", cookie)
      .send({ lease_seconds: 120 });
    expect(missingOrigin.status).toBe(403);
    expect(missingOrigin.body.error).toBe("transition_same_origin_required");
    const crossOrigin = await request(app)
      .post(path)
      .set("Cookie", cookie)
      .set("Origin", "https://attacker.invalid")
      .set("Sec-Fetch-Site", "cross-site")
      .send({ lease_seconds: 120 });
    expect(crossOrigin.status).toBe(403);
    getAccountSessionById.mockResolvedValueOnce(session("user"));
    const user = await request(app)
      .post(path)
      .set("Cookie", cookie)
      .set("Origin", "http://127.0.0.1")
      .set("Host", "127.0.0.1")
      .set("Sec-Fetch-Site", "same-origin")
      .send({ lease_seconds: 120 });
    expect(user.status).toBe(403);
    expect(user.body.error).toBe("transition_developer_account_required");
  });

  it("grants and revokes only the exact active developer account session", async () => {
    const { app, created, onRevoked } = setup();
    const base = `/api/desktop/mcp-tunnel-transition/requests/${encodeURIComponent(
      created.request.transition_request_ref,
    )}`;
    const headers = {
      Cookie: `helix_session=${encodeURIComponent(sessionId)}`,
      Origin: "http://127.0.0.1",
      Host: "127.0.0.1",
      "Sec-Fetch-Site": "same-origin",
    };
    const granted = await request(app)
      .post(`${base}/delegate`)
      .set(headers)
      .send({ lease_seconds: 120 });
    expect(granted.status).toBe(200);
    expect(granted.body).toMatchObject({
      ok: true,
      request: {
        status: "delegated",
        environment_authority_granted: false,
        trading_authority_granted: false,
      },
      receipt: {
        event_type: "delegated",
        assistant_answer: false,
        terminal_eligible: false,
      },
    });
    const revoked = await request(app)
      .post(`${base}/revoke`)
      .set(headers)
      .send({});
    expect(revoked.status).toBe(200);
    expect(revoked.body).toMatchObject({
      ok: true,
      read_only_return_requested: true,
      receipt: { event_type: "revoked" },
    });
    expect(onRevoked).toHaveBeenCalledWith(expect.objectContaining({
      transitionRequestRef: created.request.transition_request_ref,
      accountSessionId: sessionId,
    }));
  });

  it("lets a same-profile native developer session approve an OAuth-bound request", async () => {
    const nativeSessionId = "account_session:native-developer-owner";
    const store = new DesktopMcpTunnelTransitionStore(serviceInstanceRef);
    const created = store.request({
      identity: {
        serviceInstanceRef,
        clientSessionRef: "supervisor_client:oauth-route-fixture",
        conversationThreadRef: "codex_thread:oauth-route-fixture",
        authenticatedProfileRef: profileId,
        authenticatedMcpClientRef: "oauth_client:chatgpt-fixture",
        accountSessionId: "external-oauth:chatgpt-fixture",
        clientIdentityAssurance:
          "external_oauth_client_plus_server_derived_continuation",
        independentExternalOAuthClientBound: true,
      },
      declaredTaskSummary: "Approve the installed MCP transition.",
      requestedLeaseSeconds: 120,
    });
    getAccountSessionById.mockResolvedValue({
      ...session(),
      session_id: nativeSessionId,
    });
    const app = express();
    app.use(
      "/api/desktop/mcp-tunnel-transition",
      createDesktopMcpTunnelTransitionRouter({ store }),
    );
    const headers = {
      Cookie: `helix_session=${encodeURIComponent(nativeSessionId)}`,
      Origin: "http://127.0.0.1",
      Host: "127.0.0.1",
      "Sec-Fetch-Site": "same-origin",
    };
    const listed = await request(app)
      .get("/api/desktop/mcp-tunnel-transition/requests")
      .set("Cookie", headers.Cookie);
    expect(listed.body.requests).toEqual([
      expect.objectContaining({
        transition_request_ref: created.request.transition_request_ref,
        independent_external_oauth_client_bound: true,
      }),
    ]);
    const granted = await request(app)
      .post(`/api/desktop/mcp-tunnel-transition/requests/${encodeURIComponent(
        created.request.transition_request_ref,
      )}/delegate`)
      .set(headers)
      .send({ lease_seconds: 120 });
    expect(granted.status).toBe(200);
    expect(granted.body.request.status).toBe("delegated");
    const authorization = store.authorize({
      identity: {
        serviceInstanceRef,
        clientSessionRef: "supervisor_client:oauth-route-fixture",
        conversationThreadRef: "codex_thread:oauth-route-fixture",
        authenticatedProfileRef: profileId,
        authenticatedMcpClientRef: "oauth_client:chatgpt-fixture",
        accountSessionId: "external-oauth:chatgpt-fixture",
        clientIdentityAssurance:
          "external_oauth_client_plus_server_derived_continuation",
        independentExternalOAuthClientBound: true,
      },
      requestRef: created.request.transition_request_ref,
      targetScope: "full_helix_agent",
      idempotencyKey: "oauth-native-delegation-fixture",
    });
    expect(authorization.delegatedAccountSessionId).toBe(nativeSessionId);
  });
});
