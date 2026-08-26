import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createAuth0WebAuthRouter } from "../auth0-web-auth";

describe("Auth0 web auth route", () => {
  it("redirects to the controller authorization URL", async () => {
    const controller = {
      start: vi.fn(() => ({
        authorizationUrl: "https://tenant.example/authorize?state=opaque",
        expiresAt: "2030-01-01T00:00:00.000Z",
      })),
      complete: vi.fn(),
    };
    const app = express();
    app.use("/api/auth", createAuth0WebAuthRouter({ controller }));
    const response = await request(app)
      .get("/api/auth/auth0/start")
      .query({ return_to: "/desktop?panels=account-session" })
      .expect(302);
    expect(response.headers.location).toBe(
      "https://tenant.example/authorize?state=opaque",
    );
    expect(controller.start).toHaveBeenCalledWith(
      "/desktop?panels=account-session",
    );
  });

  it("sets only the HttpOnly Casimir session cookie after verified completion", async () => {
    const controller = {
      start: vi.fn(),
      complete: vi.fn(async () => ({
        receipt: {
          ok: true,
          session: { session_id: "session:auth0-profile" },
        },
        returnTo: "/desktop?panels=account-session&focus=account-session",
      })),
    };
    const app = express();
    app.use("/api/auth", createAuth0WebAuthRouter({ controller }));
    const response = await request(app)
      .get("/api/auth/auth0/callback")
      .query({ state: "opaque-state", code: "opaque-code" })
      .expect(302);
    expect(response.headers["set-cookie"]?.join(";")).toMatch(
      /helix_session=session%3Aauth0-profile;.*HttpOnly;.*SameSite=Lax/i,
    );
    expect(response.headers.location).toContain("auth0_account=linked");
    expect(response.headers.location).not.toContain("opaque-code");
    expect(response.headers.location).not.toContain("access_token");
  });
});
