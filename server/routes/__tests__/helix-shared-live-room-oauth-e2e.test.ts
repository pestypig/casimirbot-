import express from "express";
import request from "supertest";
import { SignJWT } from "jose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
  HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
} from "@shared/contracts/helix-shared-live-room-agent.v1";
import {
  runSharedLiveRoomLiveAcceptance,
  type FetchLike,
} from "../../../scripts/lib/helix-shared-live-room-live-acceptance";
import { ensureDatabase, getPool, resetDbClient } from "../../db/client";
import { createHelixMcpServer } from "../../mcp/helix-mcp-server";
import { HelixAgentAccountLinkStore } from "../../services/helix-account/agent-account-link-store";
import type { SharedLiveRoomBindingStore } from "../../services/shared-live-room-control/binding-store";
import type { SharedLiveRoomControlService } from "../../services/shared-live-room-control/service";
import { createAgentAccessDiscoveryRouter } from "../agent-access-discovery";
import { createHelixAgentProtectedResourceMetadataRouter } from "../helix-agent-api";
import { createHelixMcpRouter, type HelixMcpServerFactory } from "../helix-mcp";
import { createHelixSharedLiveRoomRouter } from "../helix-shared-live-rooms";

const BASE_URL = "https://agent-room-e2e.test";
const ISSUER = "https://issuer-room-e2e.test";
const AUDIENCE = `${BASE_URL}/mcp`;
const PROVIDER = "room-e2e-oauth";
const TENANT_ID = "tenant-room-e2e";
const SUBJECT_ID = "subject-room-e2e";
const PROFILE_ID = "profile-room-e2e";
const SESSION_ID = "session-room-e2e";
const LOCAL_SECRET =
  "shared-room-oauth-e2e-local-secret-at-least-32-characters";
const WRONG_LOCAL_SECRET =
  "shared-room-oauth-e2e-wrong-secret-at-least-32-characters";

const relevantEnvironmentKeys = [
  "CASIMIR_PUBLIC_BASE_URL",
  "DATABASE_URL",
  "HELIX_AGENT_ALLOW_LOCAL_HS256",
  "HELIX_AGENT_LOCAL_JWT_SECRET",
  "HELIX_AGENT_OAUTH_AUDIENCE",
  "HELIX_AGENT_OAUTH_ISSUER",
  "HELIX_AGENT_OAUTH_JWKS_URL",
  "HELIX_AGENT_OAUTH_PROVIDER",
  "HELIX_LOCAL_PG_MEM_PERSIST",
  "NODE_ENV",
] as const;

const originalEnvironment = Object.fromEntries(
  relevantEnvironmentKeys.map(
    (key: (typeof relevantEnvironmentKeys)[number]) => [key, process.env[key]],
  ),
) as Record<(typeof relevantEnvironmentKeys)[number], string | undefined>;

const restoreEnvironment = (): void => {
  for (const key of relevantEnvironmentKeys) {
    const value = originalEnvironment[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
};

const roomListReceipt = () => ({
  schema: "helix.shared_live_room.list_receipt.v1",
  api_version: "v1",
  ok: true,
  operation: "room.list",
  content_role: "room_control_observation_not_assistant_answer",
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
  rooms: [],
});

const signAccessToken = async (input?: {
  secret?: string;
  subject?: string;
}): Promise<string> =>
  new SignJWT({
    tenant_id: TENANT_ID,
    scope: HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(input?.subject ?? SUBJECT_ID)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(input?.secret ?? LOCAL_SECRET));

const supertestFetch =
  (app: express.Express): FetchLike =>
  async (input, init): Promise<Response> => {
    const url = new URL(String(input));
    expect(url.origin).toBe(BASE_URL);
    const path = `${url.pathname}${url.search}`;
    const method = (init?.method ?? "GET").toUpperCase();
    const pending = (() => {
      switch (method) {
        case "GET":
          return request(app).get(path);
        case "POST":
          return request(app).post(path);
        case "DELETE":
          return request(app).delete(path);
        default:
          throw new Error(`Unsupported in-process HTTP method: ${method}`);
      }
    })();
    const headers = new Headers(init?.headers);
    headers.forEach((value: string, name: string) => {
      pending.set(name, value);
    });
    if (init?.body !== undefined && init.body !== null) {
      pending.send(String(init.body));
    }
    const result = await pending;
    const responseHeaders = new Headers();
    for (const [name, value] of Object.entries(result.headers)) {
      if (Array.isArray(value)) {
        for (const item of value) responseHeaders.append(name, item);
      } else if (value !== undefined) {
        responseHeaders.set(name, String(value));
      }
    }
    return new Response(result.text || JSON.stringify(result.body ?? null), {
      status: result.status,
      headers: responseHeaders,
    });
  };

describe("Shared Live Room real OAuth/account transport chain", () => {
  let accessToken: string;
  let linkStore: HelixAgentAccountLinkStore;
  let bindingRef: string;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "pg-mem://shared-room-oauth-e2e";
    process.env.HELIX_LOCAL_PG_MEM_PERSIST = "0";
    process.env.CASIMIR_PUBLIC_BASE_URL = BASE_URL;
    process.env.HELIX_AGENT_OAUTH_ISSUER = ISSUER;
    process.env.HELIX_AGENT_OAUTH_AUDIENCE = AUDIENCE;
    process.env.HELIX_AGENT_OAUTH_PROVIDER = PROVIDER;
    delete process.env.HELIX_AGENT_OAUTH_JWKS_URL;
    process.env.HELIX_AGENT_ALLOW_LOCAL_HS256 = "1";
    process.env.HELIX_AGENT_LOCAL_JWT_SECRET = LOCAL_SECRET;

    await resetDbClient();
    await ensureDatabase();
    const pool = getPool();
    const now = new Date("2026-07-27T13:00:00.000Z");
    await pool.query(
      `
        INSERT INTO helix_accounts (
          profile_id,
          display_name,
          account_type,
          provider,
          provider_subject,
          created_at,
          updated_at
        )
        VALUES ($1, 'Room OAuth E2E', 'developer', 'local', $1, $2, $2);
      `,
      [PROFILE_ID, now.toISOString()],
    );
    await pool.query(
      `
        INSERT INTO helix_account_sessions (
          session_id,
          profile_id,
          status,
          memory_scope,
          account_policy,
          created_at,
          updated_at,
          expires_at
        )
        VALUES ($1, $2, 'active', 'profile', $3::jsonb, $4, $4, $5);
      `,
      [
        SESSION_ID,
        PROFILE_ID,
        JSON.stringify({ account_type: "developer" }),
        now.toISOString(),
        "2099-01-01T00:00:00.000Z",
      ],
    );
    linkStore = new HelixAgentAccountLinkStore({
      pool,
      now: () => new Date(now),
      persist: async () => undefined,
    });
    const intent = await linkStore.createLinkIntent({
      session: {
        sessionId: SESSION_ID,
        profileId: PROFILE_ID,
      },
      expectedIssuer: ISSUER,
      expectedAudience: AUDIENCE,
      expectedProvider: PROVIDER,
    });
    const linked = await linkStore.completeLinkIntent({
      session: {
        sessionId: SESSION_ID,
        profileId: PROFILE_ID,
      },
      state: intent.state,
      identity: {
        issuer: ISSUER,
        audience: AUDIENCE,
        tenantId: TENANT_ID,
        providerAlias: PROVIDER,
        subject: SUBJECT_ID,
      },
    });
    bindingRef = linked.binding.binding_ref;
    accessToken = await signAccessToken();
  }, 30_000);

  afterAll(async () => {
    await resetDbClient();
    restoreEnvironment();
  });

  it("joins signed JWT verification, durable account binding, REST/MCP parity, and revocation", async () => {
    const listRooms = vi.fn(async () => roomListReceipt());
    const controlService = {
      listRooms,
    } as unknown as SharedLiveRoomControlService;
    const bindingStore = {
      bindRunToRoom: vi.fn(),
      claimPendingChatBinding: vi.fn(),
      revokeRunRoomBindingForOwner: vi.fn(),
      revokeClaimedRunChatBindingForOwner: vi.fn(),
    } as unknown as Pick<
      SharedLiveRoomBindingStore,
      | "bindRunToRoom"
      | "claimPendingChatBinding"
      | "revokeRunRoomBindingForOwner"
      | "revokeClaimedRunChatBindingForOwner"
    >;
    const app = express();
    app.use(
      createAgentAccessDiscoveryRouter({
        readDocumentation: async () => "# Helix Agent API v1",
      }),
    );
    app.use(
      createHelixAgentProtectedResourceMetadataRouter({
        additionalResourcePaths: [
          "/.well-known/oauth-protected-resource/api/v1/rooms",
        ],
        additionalScopes: [
          HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
          HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
          HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
        ],
      }),
    );
    app.use(
      "/api/v1/rooms",
      createHelixSharedLiveRoomRouter({
        controlService,
        bindingStore,
        rateLimit: false,
        enforceTransportSecurity: false,
      }),
    );
    app.use(
      "/mcp",
      createHelixMcpRouter({
        createServer: ({
          principal,
          service,
        }: Parameters<HelixMcpServerFactory>[0]) =>
          createHelixMcpServer({
            principal,
            service,
            roomControlService: controlService,
            roomBindingStore: bindingStore,
          }),
        rateLimit: false,
        enforceTransportSecurity: false,
      }),
    );

    const wrongSignatureToken = await signAccessToken({
      secret: WRONG_LOCAL_SECRET,
    });
    const wrongSignatureRest = await request(app)
      .get("/api/v1/rooms")
      .set("Authorization", `Bearer ${wrongSignatureToken}`)
      .expect(401);
    expect(wrongSignatureRest.body).toMatchObject({
      schema: "helix.shared_live_room.error.v1",
      error: "unauthorized",
    });
    expect(wrongSignatureRest.headers["www-authenticate"]).toContain(
      'error="invalid_token"',
    );
    const wrongSignatureMcp = await request(app)
      .post("/mcp")
      .set("Authorization", `Bearer ${wrongSignatureToken}`)
      .send({
        jsonrpc: "2.0",
        id: "wrong-signature-oauth-e2e",
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: {
            name: "wrong-signature-oauth-e2e",
            version: "1.0.0",
          },
        },
      })
      .expect(401);
    expect(wrongSignatureMcp.body).toMatchObject({
      schema: "helix.agent_api.error.v1",
      error: "unauthorized",
    });

    const unlinkedSubjectToken = await signAccessToken({
      subject: "subject-room-e2e-unlinked",
    });
    const unlinkedRest = await request(app)
      .get("/api/v1/rooms")
      .set("Authorization", `Bearer ${unlinkedSubjectToken}`)
      .expect(403);
    expect(unlinkedRest.body).toMatchObject({
      schema: "helix.shared_live_room.error.v1",
      error: "account_not_linked",
    });
    const unlinkedMcp = await request(app)
      .post("/mcp")
      .set("Authorization", `Bearer ${unlinkedSubjectToken}`)
      .send({
        jsonrpc: "2.0",
        id: "unlinked-oauth-e2e",
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: {
            name: "unlinked-oauth-e2e",
            version: "1.0.0",
          },
        },
      })
      .expect(403);
    expect(unlinkedMcp.body).toMatchObject({
      schema: "helix.agent_api.error.v1",
      error: "account_not_linked",
    });
    expect(listRooms).not.toHaveBeenCalled();

    const report = await runSharedLiveRoomLiveAcceptance({
      env: {
        HELIX_SHARED_ROOM_ACCEPTANCE_BASE_URL: BASE_URL,
        HELIX_SHARED_ROOM_ACCEPTANCE_NETWORK: "1",
        HELIX_SHARED_ROOM_ACCEPTANCE_ACCESS_TOKEN: accessToken,
      },
      fetchImpl: supertestFetch(app),
      now: () => new Date("2026-07-27T13:05:00.000Z"),
      randomId: () => "oauth-e2e",
    });

    expect(report.status).toBe("partial");
    expect(report.sections.public_discovery.status).toBe("pass");
    expect(report.sections.oauth_challenge.status).toBe("pass");
    expect(report.sections.authenticated_catalog.status).toBe("pass");
    expect(report.sections.read_parity.status).toBe("pass");
    expect(report.sections.mutation_lifecycle).toMatchObject({
      status: "skipped",
      checks: [
        expect.objectContaining({
          reason_code: "mutation_not_enabled",
        }),
      ],
    });
    expect(listRooms).toHaveBeenCalledTimes(2);
    for (const [input] of listRooms.mock.calls) {
      expect(input).toMatchObject({
        actor: {
          authKind: "external_oauth",
          profileId: PROFILE_ID,
          accountType: "developer",
          idempotencyOwner: {
            tenantId: TENANT_ID,
            issuer: ISSUER,
            subjectId: SUBJECT_ID,
            accountProfileId: PROFILE_ID,
          },
        },
      });
    }

    await linkStore.revokeBinding({
      session: {
        sessionId: SESSION_ID,
        profileId: PROFILE_ID,
      },
      bindingRef,
      reason: "oauth e2e revocation",
    });

    const revokedRest = await request(app)
      .get("/api/v1/rooms")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(403);
    expect(revokedRest.body).toMatchObject({
      schema: "helix.shared_live_room.error.v1",
      error: "account_not_linked",
    });
    const revokedMcp = await request(app)
      .post("/mcp")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        jsonrpc: "2.0",
        id: "revoked-oauth-e2e",
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: {
            name: "revoked-oauth-e2e",
            version: "1.0.0",
          },
        },
      })
      .expect(403);
    expect(revokedMcp.body).toMatchObject({
      schema: "helix.agent_api.error.v1",
      error: "account_not_linked",
    });
    expect(listRooms).toHaveBeenCalledTimes(2);
  }, 30_000);
});
