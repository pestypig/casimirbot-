import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import {
  HelixAgentAccountLinkError,
  type HelixAgentAccountBindingProjection,
} from "../../services/helix-account/agent-account-link-store";
import {
  createHelixAgentAccountBindingsRouter,
  type HelixAgentAccountBindingManagementStore,
  type HelixAgentAccountBindingSessionRecord,
} from "../helix-agent-account-bindings";

const SESSION_ID = "session-active";
const PROFILE_ID = "profile-active";
const BINDING_REF =
  "agent-binding:sha256:0123456789abcdef0123456789abcdef";

const activeSession: HelixAgentAccountBindingSessionRecord = {
  session_id: SESSION_ID,
  profile: {
    profile_id: PROFILE_ID,
  },
};

const binding: HelixAgentAccountBindingProjection = {
  binding_ref: BINDING_REF,
  issuer: "https://auth.example",
  tenant_ref: "tenant:sha256:0123456789abcdef01234567",
  provider: "provider-test",
  status: "active",
  created_at: "2026-07-26T18:00:00.000Z",
  updated_at: "2026-07-26T18:00:00.000Z",
  revoked_at: null,
  subject_included: false,
  bearer_included: false,
};

const listReceipt = {
  schema: "helix.agent_account_bindings.v1" as const,
  oauth_ready: true,
  bindings: [binding],
};

const revokeReceipt = {
  schema: "helix.agent_account_binding_receipt.v1" as const,
  operation: "agent_account_binding.revoke" as const,
  binding: {
    ...binding,
    status: "revoked" as const,
    updated_at: "2026-07-26T18:05:00.000Z",
    revoked_at: "2026-07-26T18:05:00.000Z",
  },
  already_revoked: false,
  answer_authority: false as const,
  assistant_answer: false as const,
};

const createDependencies = () => {
  const listBindings = vi.fn(async (
    _input: Parameters<
      HelixAgentAccountBindingManagementStore["listBindings"]
    >[0],
  ) => listReceipt);
  const revokeBinding = vi.fn(async (
    _input: Parameters<
      HelixAgentAccountBindingManagementStore["revokeBinding"]
    >[0],
  ) => revokeReceipt);
  const resolveSession = vi.fn(async (
    _sessionId?: string | null,
  ): Promise<HelixAgentAccountBindingSessionRecord | null> => activeSession);
  return {
    store: {
      listBindings,
      revokeBinding,
    } satisfies HelixAgentAccountBindingManagementStore,
    resolveSession,
  };
};

const createApp = (
  dependencies: ReturnType<typeof createDependencies>,
): express.Express => {
  const app = express();
  app.use(
    "/api/account",
    createHelixAgentAccountBindingsRouter(dependencies),
  );
  return app;
};

describe("Helix agent account-binding management routes", () => {
  it("requires an active cookie-authenticated Helix session", async () => {
    const dependencies = createDependencies();
    const response = await request(createApp(dependencies))
      .get("/api/account/session/agent-bindings")
      .expect(401);

    expect(dependencies.resolveSession).not.toHaveBeenCalled();
    expect(dependencies.store.listBindings).not.toHaveBeenCalled();
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body).toEqual({
      schema: "helix.agent_account_binding_error.v1",
      ok: false,
      error: "session_required",
      message:
        "An active Helix account session is required to manage agent bindings.",
      subject_included: false,
      bearer_included: false,
    });
  });

  it("rejects a stale session cookie before reading bindings", async () => {
    const dependencies = createDependencies();
    dependencies.resolveSession.mockResolvedValueOnce(null);

    await request(createApp(dependencies))
      .get("/api/account/session/agent-bindings")
      .set("Cookie", `helix_session=${SESSION_ID}`)
      .expect(401);

    expect(dependencies.resolveSession).toHaveBeenCalledWith(SESSION_ID);
    expect(dependencies.store.listBindings).not.toHaveBeenCalled();
  });

  it("lists only the active profile's sanitized bindings", async () => {
    const dependencies = createDependencies();
    const response = await request(createApp(dependencies))
      .get("/api/account/session/agent-bindings")
      .set("Cookie", `helix_session=${SESSION_ID}`)
      .expect(200);

    expect(dependencies.store.listBindings).toHaveBeenCalledWith({
      session: {
        sessionId: SESSION_ID,
        profileId: PROFILE_ID,
      },
    });
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.body).toEqual(listReceipt);
    expect(JSON.stringify(response.body).toLowerCase()).not.toContain(
      "provider-subject-secret",
    );
    expect(JSON.stringify(response.body).toLowerCase()).not.toContain(
      "bearer ",
    );
  });

  it("revokes a profile-owned opaque binding reference", async () => {
    const dependencies = createDependencies();
    const response = await request(createApp(dependencies))
      .delete(
        `/api/account/session/agent-bindings/${encodeURIComponent(BINDING_REF)}`,
      )
      .set("Cookie", `helix_session=${SESSION_ID}`)
      .expect(200);

    expect(dependencies.store.revokeBinding).toHaveBeenCalledWith({
      session: {
        sessionId: SESSION_ID,
        profileId: PROFILE_ID,
      },
      bindingRef: BINDING_REF,
      reason: "user_revoked_via_account_session",
    });
    expect(response.body).toEqual(revokeReceipt);
  });

  it("returns fixed typed errors without reflecting store messages", async () => {
    const dependencies = createDependencies();
    dependencies.store.revokeBinding.mockRejectedValueOnce(
      new HelixAgentAccountLinkError(
        404,
        "binding_not_found",
        "provider-subject-secret Bearer token-secret",
      ),
    );

    const response = await request(createApp(dependencies))
      .delete(
        `/api/account/session/agent-bindings/${encodeURIComponent(BINDING_REF)}`,
      )
      .set("Cookie", `helix_session=${SESSION_ID}`)
      .expect(404);

    expect(response.body).toEqual({
      schema: "helix.agent_account_binding_error.v1",
      ok: false,
      error: "binding_not_found",
      message: "The agent account binding was not found.",
      subject_included: false,
      bearer_included: false,
    });
    expect(JSON.stringify(response.body)).not.toContain(
      "provider-subject-secret",
    );
    expect(JSON.stringify(response.body)).not.toContain("token-secret");
  });

  it("sanitizes unexpected failures and exposes no create-link callback", async () => {
    const dependencies = createDependencies();
    dependencies.store.listBindings.mockRejectedValueOnce(
      new Error("Bearer token-secret provider-subject-secret"),
    );
    const app = createApp(dependencies);

    const response = await request(app)
      .get("/api/account/session/agent-bindings")
      .set("Cookie", `helix_session=${SESSION_ID}`)
      .expect(500);

    expect(response.body).toEqual({
      schema: "helix.agent_account_binding_error.v1",
      ok: false,
      error: "internal_error",
      message: "The agent account binding request could not be completed.",
      subject_included: false,
      bearer_included: false,
    });
    expect(JSON.stringify(response.body)).not.toContain("token-secret");

    await request(app)
      .post("/api/account/session/agent-bindings")
      .set("Cookie", `helix_session=${SESSION_ID}`)
      .expect(404);
  });
});

