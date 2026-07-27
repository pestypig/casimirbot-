import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { HELIX_AGENT_RUN_WRITE_SCOPE } from "@shared/contracts/helix-agent-api.v1";
import {
  requireHelixAgentApiScope,
} from "../../auth/helix-agent-principal";
import {
  handleHelixAgentApiError,
} from "../helix-agent-api";
import {
  HelixAgentApiServiceError,
} from "../../services/helix-agent-api/service";
import type { HelixAgentApiPrincipal } from "../../services/helix-agent-api/types";

const originalPublicBaseUrl = process.env.CASIMIR_PUBLIC_BASE_URL;

afterEach(() => {
  if (originalPublicBaseUrl === undefined) {
    delete process.env.CASIMIR_PUBLIC_BASE_URL;
  } else {
    process.env.CASIMIR_PUBLIC_BASE_URL = originalPublicBaseUrl;
  }
});

const appForError = (error: HelixAgentApiServiceError): express.Express => {
  const app = express();
  app.get(
    "/",
    (
      _req: Request,
      _res: Response,
      next: NextFunction,
    ): void => next(error),
  );
  app.use(handleHelixAgentApiError);
  return app;
};

const principalWithoutScopes = (): HelixAgentApiPrincipal =>
  ({
    tenantId: "tenant-oauth-challenge",
    issuer: "https://issuer.example",
    subjectId: "subject-oauth-challenge",
    accountProfileId: "profile-oauth-challenge",
    accountType: "user",
    scopes: new Set<string>(),
    tokenExpiresAt: "2099-01-01T00:00:00.000Z",
    accountContext: {
      session_id: "oauth-challenge-test",
      profile_id: "profile-oauth-challenge",
      trusted_account_session: true,
    },
  }) as HelixAgentApiPrincipal;

describe("Helix agent OAuth HTTP challenges", () => {
  it("returns a safe Bearer challenge for a 401 authentication failure", async () => {
    process.env.CASIMIR_PUBLIC_BASE_URL = "https://agent.example";
    const response = await request(
      appForError(
        new HelixAgentApiServiceError(
          401,
          "unauthorized",
          'Token "rejected".\r\nInjected: no \\ secrets 🚫',
        ),
      ),
    )
      .get("/")
      .expect(401);

    expect(response.headers["www-authenticate"]).toBe(
      'Bearer resource_metadata="https://agent.example/.well-known/oauth-protected-resource", ' +
        'error="invalid_token", ' +
        'error_description="Token  rejected .  Injected: no   secrets  "',
    );
    expect(response.headers.injected).toBeUndefined();
    expect(response.body).toMatchObject({
      schema: "helix.agent_api.error.v1",
      error: "unauthorized",
      request_id: null,
      retryable: false,
    });
  });

  it("advertises the exact required scope for insufficient_scope", async () => {
    process.env.CASIMIR_PUBLIC_BASE_URL = "https://agent.example";
    const app = express();
    app.get("/", (_req: Request, res: Response): void => {
      requireHelixAgentApiScope(
        principalWithoutScopes(),
        HELIX_AGENT_RUN_WRITE_SCOPE,
      );
      res.sendStatus(204);
    });
    app.use(handleHelixAgentApiError);

    const response = await request(app).get("/").expect(403);

    expect(response.headers["www-authenticate"]).toBe(
      'Bearer resource_metadata="https://agent.example/.well-known/oauth-protected-resource", ' +
        'error="insufficient_scope", ' +
        `error_description="The bearer token is missing the required ${HELIX_AGENT_RUN_WRITE_SCOPE} scope.", ` +
        `scope="${HELIX_AGENT_RUN_WRITE_SCOPE}"`,
    );
    expect(response.body).toMatchObject({
      schema: "helix.agent_api.error.v1",
      error: "insufficient_scope",
      details: {
        required_scope: HELIX_AGENT_RUN_WRITE_SCOPE,
      },
    });
  });

  it.each([
    "host_not_allowed",
    "origin_not_allowed",
    "https_required",
    "account_not_linked",
    "tenant_mismatch",
    "account_policy_blocked",
  ] as const)("does not challenge a non-scope 403 (%s)", async (code) => {
    process.env.CASIMIR_PUBLIC_BASE_URL = "https://agent.example";
    const response = await request(
      appForError(
        new HelixAgentApiServiceError(
          403,
          code,
          `Rejected by ${code}.`,
        ),
      ),
    )
      .get("/")
      .expect(403);

    expect(response.headers["www-authenticate"]).toBeUndefined();
    expect(response.body).toMatchObject({
      schema: "helix.agent_api.error.v1",
      error: code,
      message: `Rejected by ${code}.`,
    });
  });
});
