import express from "express";
import request from "supertest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HELIX_AGENT_RUN_DEVELOPER_SCOPE,
  HELIX_AGENT_RUN_READ_SCOPE,
  HELIX_AGENT_RUN_WRITE_SCOPE,
} from "@shared/contracts/helix-agent-api.v1";
import {
  HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
  HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
} from "@shared/contracts/helix-shared-live-room-agent.v1";
import {
  HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
  HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE,
} from "@shared/helix-environment-action";
import {
  createHelixAgentApiRouter,
  createHelixAgentProtectedResourceMetadataRouter,
  HELIX_AGENT_OAUTH_OFFLINE_ACCESS_SCOPE,
} from "../helix-agent-api";
import { createHelixMcpRouter } from "../helix-mcp";
import { createHelixRunMcpServer } from "../../mcp/helix-run-mcp-server";
import {
  HELIX_DEVICE_CHECK_RESOURCE_METADATA_PATH,
  HELIX_LOCAL_SUPERVISOR_COORDINATION_RESOURCE_METADATA_PATH,
} from "../../mcp/helix-mcp-server";
import {
  HelixAgentApiServiceError,
  type HelixAgentApiService,
} from "../../services/helix-agent-api/service";
import type { HelixAgentApiPrincipal } from "../../services/helix-agent-api/types";
import { HELIX_AGENT_DATABASE_OAUTH_SCOPES } from "../../services/helix-agent-api/database-scope-policy";

const RUN_ID = "run_transport_12345678";

const principal = (
  scopes: readonly string[] = [
    HELIX_AGENT_RUN_READ_SCOPE,
    HELIX_AGENT_RUN_WRITE_SCOPE,
  ],
): HelixAgentApiPrincipal =>
  ({
    tenantId: "tenant-transport",
    issuer: "https://issuer.example",
    subjectId: "subject-transport",
    accountProfileId: "profile-transport",
    accountType: "developer",
    scopes: new Set(scopes),
    tokenExpiresAt: "2099-01-01T00:00:00.000Z",
    accountContext: {
      session_id: "external-oauth:test",
      profile_id: "profile-transport",
      trusted_account_session: true,
    },
  }) as HelixAgentApiPrincipal;

const runSnapshot = (version = 3) => ({
  schema: "helix.agent_run.v1",
  api_version: "v1",
  run_id: RUN_ID,
  version,
  completion_status: "needs_more_evidence",
  terminal_authority_status: "pending_helix_terminal_authority",
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

type ServiceDouble = {
  startRun: ReturnType<typeof vi.fn>;
  inspectRun: ReturnType<typeof vi.fn>;
  continueRun: ReturnType<typeof vi.fn>;
  cancelRun: ReturnType<typeof vi.fn>;
  listEvents: ReturnType<typeof vi.fn>;
  fetchEvidence: ReturnType<typeof vi.fn>;
};

const serviceDouble = (): ServiceDouble => ({
  startRun: vi.fn().mockResolvedValue({
    status: 202,
    body: runSnapshot(3),
    idempotencyReplayed: false,
  }),
  inspectRun: vi.fn().mockResolvedValue(runSnapshot(3)),
  continueRun: vi.fn().mockResolvedValue({
    status: 200,
    body: runSnapshot(4),
    idempotencyReplayed: true,
  }),
  cancelRun: vi.fn().mockResolvedValue({
    status: 200,
    body: {
      ...runSnapshot(5),
      completion_status: "cancelled",
    },
    idempotencyReplayed: false,
  }),
  listEvents: vi.fn().mockResolvedValue({
    schema: "helix.agent_run.events_page.v1",
    run_id: RUN_ID,
    events: [],
    next_after_seq: 7,
    has_more: false,
  }),
  fetchEvidence: vi.fn().mockResolvedValue({
    schema: "helix.agent_run.evidence_bundle.v1",
    run_id: RUN_ID,
    observation_refs: [],
    evidence_refs: [],
    receipt_refs: [],
    provider_terminal_candidate_ref: null,
    claims_supported: [],
    claims_contradicted: [],
    unresolved_requirements: [],
    terminal_authority_status: "not_evaluated",
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  }),
});

const asService = (service: ServiceDouble): HelixAgentApiService =>
  service as unknown as HelixAgentApiService;

const createRestApp = (input?: {
  service?: ServiceDouble;
  authPrincipal?: HelixAgentApiPrincipal;
  authenticate?: () => Promise<HelixAgentApiPrincipal>;
  enforceTransportSecurity?: boolean;
}): express.Express => {
  const app = express();
  app.use(
    "/api/v1/agent-runs",
    createHelixAgentApiRouter({
      service: asService(input?.service ?? serviceDouble()),
      authenticate:
        input?.authenticate ??
        (async () => input?.authPrincipal ?? principal()),
      rateLimit: false,
      enforceTransportSecurity: input?.enforceTransportSecurity ?? false,
    }),
  );
  return app;
};

const mcpHeaders = <T extends request.Test>(test: T): T =>
  test
    .set("Content-Type", "application/json")
    .set("Accept", "application/json, text/event-stream")
    .set("MCP-Protocol-Version", "2025-06-18");

const originalNodeEnv = process.env.NODE_ENV;
const originalPublicBaseUrl = process.env.CASIMIR_PUBLIC_BASE_URL;
const originalDesktopHost = process.env.CASIMIR_DESKTOP_HOST;
const originalDesktopSecret = process.env.CASIMIR_DESKTOP_SESSION_SECRET;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  if (originalPublicBaseUrl === undefined) {
    delete process.env.CASIMIR_PUBLIC_BASE_URL;
  } else {
    process.env.CASIMIR_PUBLIC_BASE_URL = originalPublicBaseUrl;
  }
  if (originalDesktopHost === undefined) delete process.env.CASIMIR_DESKTOP_HOST;
  else process.env.CASIMIR_DESKTOP_HOST = originalDesktopHost;
  if (originalDesktopSecret === undefined) {
    delete process.env.CASIMIR_DESKTOP_SESSION_SECRET;
  } else {
    process.env.CASIMIR_DESKTOP_SESSION_SECRET = originalDesktopSecret;
  }
  vi.restoreAllMocks();
});

describe("Helix agent REST transport", () => {
  it("starts a run with typed input, idempotency, location, and weak ETag", async () => {
    const service = serviceDouble();
    const response = await request(createRestApp({ service }))
      .post("/api/v1/agent-runs")
      .set("Idempotency-Key", "stable-start-key")
      .set("X-Request-Id", "caller-request-1")
      .send({ objective: "Collect bounded external evidence." })
      .expect(202);

    expect(response.headers["x-request-id"]).toBe("caller-request-1");
    expect(response.headers.location).toBe(`/api/v1/agent-runs/${RUN_ID}`);
    expect(response.headers.etag).toBe('W/"agent-run-3"');
    expect(response.headers["idempotency-replayed"]).toBe("false");
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body).toMatchObject({
      run_id: RUN_ID,
      version: 3,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
    });
    expect(service.startRun).toHaveBeenCalledWith({
      principal: expect.objectContaining({
        tenantId: "tenant-transport",
        accountProfileId: "profile-transport",
      }),
      idempotencyKey: "stable-start-key",
      request: expect.objectContaining({
        objective: "Collect bounded external evidence.",
        constraints: [],
        database_scope: [],
        budget: {
          max_steps: 12,
          expires_in_seconds: 3_600,
        },
      }),
    });
  });

  it("maps inspect, continuation, cancellation, events, and evidence without losing owner context", async () => {
    const service = serviceDouble();
    const app = createRestApp({ service });

    const inspected = await request(app)
      .get(`/api/v1/agent-runs/${RUN_ID}`)
      .expect(200);
    expect(inspected.headers.etag).toBe('W/"agent-run-3"');

    const continued = await request(app)
      .post(`/api/v1/agent-runs/${RUN_ID}/continue`)
      .set("Idempotency-Key", "stable-continue-key")
      .send({ expected_version: 3, instruction: "Check another source." })
      .expect(200);
    expect(continued.headers.etag).toBe('W/"agent-run-4"');
    expect(continued.headers["idempotency-replayed"]).toBe("true");

    await request(app)
      .post(`/api/v1/agent-runs/${RUN_ID}/cancel`)
      .set("Idempotency-Key", "stable-cancel-key")
      .send({ expected_version: 4 })
      .expect(200);

    const events = await request(app)
      .get(`/api/v1/agent-runs/${RUN_ID}/events`)
      .query({ after_seq: "6", limit: "25" })
      .expect(200);
    expect(events.body).toMatchObject({
      run_id: RUN_ID,
      next_after_seq: 7,
      has_more: false,
    });

    const evidence = await request(app)
      .get(`/api/v1/agent-runs/${RUN_ID}/evidence`)
      .expect(200);
    expect(evidence.body).toMatchObject({
      run_id: RUN_ID,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
    });

    expect(service.inspectRun).toHaveBeenCalledWith({
      principal: expect.objectContaining({ tenantId: "tenant-transport" }),
      runId: RUN_ID,
    });
    expect(service.continueRun).toHaveBeenCalledWith({
      principal: expect.objectContaining({ subjectId: "subject-transport" }),
      runId: RUN_ID,
      idempotencyKey: "stable-continue-key",
      request: {
        expected_version: 3,
        instruction: "Check another source.",
        answers: [],
      },
    });
    expect(service.cancelRun).toHaveBeenCalledWith({
      principal: expect.any(Object),
      runId: RUN_ID,
      idempotencyKey: "stable-cancel-key",
      request: {
        expected_version: 4,
        reason: "cancelled_by_client",
      },
    });
    expect(service.listEvents).toHaveBeenCalledWith({
      principal: expect.any(Object),
      runId: RUN_ID,
      afterSeq: 6,
      limit: 25,
    });
    expect(service.fetchEvidence).toHaveBeenCalledWith({
      principal: expect.any(Object),
      runId: RUN_ID,
    });
  });

  it("fails closed with typed schema, identifier, and idempotency errors", async () => {
    const app = createRestApp();

    const missingKey = await request(app)
      .post("/api/v1/agent-runs")
      .set("X-Request-Id", "typed-error-request")
      .send({ objective: "A valid objective" })
      .expect(400);
    expect(missingKey.body).toEqual({
      schema: "helix.agent_api.error.v1",
      error: "invalid_request",
      message: "The Idempotency-Key header is required for mutation requests.",
      request_id: "typed-error-request",
      retryable: false,
    });

    const strictSchema = await request(app)
      .post("/api/v1/agent-runs")
      .set("Idempotency-Key", "strict-body-key")
      .send({
        objective: "A valid objective",
        tenant_id: "caller-cannot-assert-this",
      })
      .expect(400);
    expect(strictSchema.body).toMatchObject({
      schema: "helix.agent_api.error.v1",
      error: "invalid_request",
      retryable: false,
    });
    expect(strictSchema.body.details.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "unrecognized_keys" }),
      ]),
    );

    const invalidRun = await request(app)
      .get("/api/v1/agent-runs/not-a-run")
      .expect(400);
    expect(invalidRun.body.error).toBe("invalid_request");

    const invalidJson = await request(app)
      .post("/api/v1/agent-runs")
      .set("Content-Type", "application/json")
      .send('{"objective":')
      .expect(400);
    expect(invalidJson.body).toEqual({
      schema: "helix.agent_api.error.v1",
      error: "invalid_request",
      message: "The request body is not valid JSON.",
      request_id: null,
      retryable: false,
    });
  });

  it("never echoes credential-shaped request IDs or schema keys", async () => {
    const app = createRestApp();
    const requestIdSecret = "helix_room_src_agent_request_id_secret_123456";
    const requestIdResponse = await request(app)
      .post("/api/v1/agent-runs")
      .set("X-Request-Id", requestIdSecret)
      .send({ objective: "A safe objective" })
      .expect(400);
    expect(requestIdResponse.headers["x-request-id"]).toMatch(/^agent_req_/);
    expect(
      JSON.stringify({
        headers: requestIdResponse.headers,
        body: requestIdResponse.body,
      }),
    ).not.toContain(requestIdSecret);

    const schemaKeySecret = "room_source_claim_agent_schema_key_secret_123456";
    const schemaResponse = await request(app)
      .post("/api/v1/agent-runs")
      .set("Idempotency-Key", "schema-secret-key")
      .send({
        objective: "A safe objective",
        [schemaKeySecret]: true,
      })
      .expect(400);
    expect(schemaResponse.body).toMatchObject({
      error: "invalid_request",
      details: {
        failure_code: "protected_sensitive_content_rejected",
      },
    });
    expect(JSON.stringify(schemaResponse.body)).not.toContain(schemaKeySecret);
  });

  it("returns OAuth challenge metadata for authentication and scope failures", async () => {
    process.env.CASIMIR_PUBLIC_BASE_URL = "https://agent.example";
    const unauthorized = await request(
      createRestApp({
        authenticate: async () => {
          throw new HelixAgentApiServiceError(
            401,
            "unauthorized",
            "Token rejected.",
          );
        },
      }),
    )
      .get(`/api/v1/agent-runs/${RUN_ID}`)
      .expect(401);
    expect(unauthorized.body).toMatchObject({
      error: "unauthorized",
      message: "Token rejected.",
    });
    expect(unauthorized.headers["www-authenticate"]).toContain(
      'resource_metadata="https://agent.example/.well-known/oauth-protected-resource"',
    );
    expect(unauthorized.headers["www-authenticate"]).toContain(
      'error="invalid_token"',
    );

    const insufficient = await request(
      createRestApp({
        authPrincipal: principal([HELIX_AGENT_RUN_READ_SCOPE]),
      }),
    )
      .post("/api/v1/agent-runs")
      .set("Idempotency-Key", "write-scope-key")
      .send({ objective: "Should not be admitted." })
      .expect(403);
    expect(insufficient.body.error).toBe("insufficient_scope");
    expect(insufficient.headers["www-authenticate"]).toContain(
      'error="insufficient_scope"',
    );
  });

  it("publishes one canonical OAuth protected-resource identity", async () => {
    process.env.CASIMIR_PUBLIC_BASE_URL = "https://agent.example";
    const verifier = {
      verify: vi.fn(),
      authorizationServer: () => "https://issuer.example",
      audience: () => "https://agent.example/agent-resource",
      providerAlias: () => "oidc",
    };
    const app = express();
    app.use(
      createHelixAgentProtectedResourceMetadataRouter({
        verifier,
        additionalResourcePaths: [
          "/.well-known/oauth-protected-resource/api/v1/rooms",
        ],
        additionalScopes: [
          HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
          HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
          HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
          HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
          HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE,
        ],
      }),
    );

    for (const path of [
      "/.well-known/oauth-protected-resource",
      "/.well-known/oauth-protected-resource/mcp",
      "/.well-known/oauth-protected-resource/api/v1/agent-runs",
      "/.well-known/oauth-protected-resource/api/v1/rooms",
    ]) {
      const response = await request(app).get(path).expect(200);
      expect(response.body).toEqual({
        resource: "https://agent.example/agent-resource",
        authorization_servers: ["https://issuer.example"],
        scopes_supported: Array.from(
          new Set([
            HELIX_AGENT_RUN_READ_SCOPE,
            HELIX_AGENT_RUN_WRITE_SCOPE,
            HELIX_AGENT_RUN_DEVELOPER_SCOPE,
            ...HELIX_AGENT_DATABASE_OAUTH_SCOPES,
            HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
            HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
            HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
            HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
            HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE,
            HELIX_AGENT_OAUTH_OFFLINE_ACCESS_SCOPE,
          ]),
        ),
        bearer_methods_supported: ["header"],
        resource_documentation:
          "https://agent.example/docs/architecture/helix-agent-api-v1.md",
      });
    }
  });

  it("publishes an endpoint-matching MCP resource on a verified loopback request", async () => {
    process.env.CASIMIR_PUBLIC_BASE_URL = "https://agent.example";
    const verifier = {
      verify: vi.fn(),
      authorizationServer: () => "https://issuer.example",
      audience: () => "https://agent.example/mcp",
      providerAlias: () => "oidc",
    };
    const app = express();
    app.use(
      createHelixAgentProtectedResourceMetadataRouter({
        verifier,
        useLoopbackRequestResource: true,
      }),
    );

    const response = await request(app)
      .get("/.well-known/oauth-protected-resource/mcp")
      .set("Host", "localhost:1522")
      .expect(200);

    expect(response.body).toMatchObject({
      resource: "http://localhost:1522/mcp",
      authorization_servers: ["https://issuer.example"],
    });
  });

  it("publishes the exact local-supervisor MCP resource on a verified loopback request", async () => {
    process.env.CASIMIR_PUBLIC_BASE_URL = "https://agent.example";
    const verifier = {
      verify: vi.fn(),
      authorizationServer: () => "https://issuer.example",
      audience: () => "https://agent.example/mcp",
      providerAlias: () => "oidc",
    };
    const app = express();
    app.use(
      createHelixAgentProtectedResourceMetadataRouter({
        verifier,
        resourcePaths: [
          HELIX_LOCAL_SUPERVISOR_COORDINATION_RESOURCE_METADATA_PATH,
        ],
        useLoopbackRequestResource: false,
      }),
    );

    const response = await request(app)
      .get(HELIX_LOCAL_SUPERVISOR_COORDINATION_RESOURCE_METADATA_PATH)
      .set("Host", "localhost:1522")
      .expect(200);

    expect(response.body).toMatchObject({
      resource: "https://agent.example/mcp",
      authorization_servers: ["https://issuer.example"],
    });
  });

  it("publishes a least-privilege Device Check resource profile", async () => {
    process.env.CASIMIR_PUBLIC_BASE_URL = "https://agent.example";
    const verifier = {
      verify: vi.fn(),
      authorizationServer: () => "https://tenant.auth0.com/",
      audience: () => "https://agent.example/mcp",
      providerAlias: () => "auth0",
    };
    const app = express();
    app.use(
      createHelixAgentProtectedResourceMetadataRouter({
        verifier,
        resourcePaths: [HELIX_DEVICE_CHECK_RESOURCE_METADATA_PATH],
        scopes: [HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      }),
    );

    const response = await request(app)
      .get(HELIX_DEVICE_CHECK_RESOURCE_METADATA_PATH)
      .expect(200);
    expect(response.body).toEqual({
      resource: "https://agent.example/mcp",
      authorization_servers: ["https://tenant.auth0.com/"],
      scopes_supported: [
        HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
        HELIX_AGENT_OAUTH_OFFLINE_ACCESS_SCOPE,
      ],
      bearer_methods_supported: ["header"],
      resource_documentation:
        "https://agent.example/docs/architecture/helix-agent-api-v1.md",
    });
  });

  it("requires HTTPS and an admitted host in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.CASIMIR_PUBLIC_BASE_URL = "https://agent.example";
    const service = serviceDouble();
    const app = createRestApp({
      service,
      enforceTransportSecurity: true,
    });

    const wrongHost = await request(app)
      .get(`/api/v1/agent-runs/${RUN_ID}`)
      .set("Host", "attacker.example")
      .expect(403);
    expect(wrongHost.body.error).toBe("host_not_allowed");

    const insecure = await request(app)
      .get(`/api/v1/agent-runs/${RUN_ID}`)
      .set("Host", "agent.example")
      .set("Origin", "https://agent.example")
      .expect(403);
    expect(insecure.body.error).toBe("https_required");
    expect(service.inspectRun).not.toHaveBeenCalled();
  });

  it("admits production loopback only with the exact desktop session secret", async () => {
    process.env.NODE_ENV = "production";
    process.env.CASIMIR_PUBLIC_BASE_URL = "https://agent.example";
    process.env.CASIMIR_DESKTOP_HOST = "1";
    process.env.CASIMIR_DESKTOP_SESSION_SECRET =
      "desktop-session-secret-that-is-at-least-32-characters";
    const service = serviceDouble();
    const app = createRestApp({ service, enforceTransportSecurity: true });

    await request(app)
      .get(`/api/v1/agent-runs/${RUN_ID}`)
      .set("Host", "127.0.0.1:43123")
      .set(
        "X-Casimir-Desktop-Session",
        process.env.CASIMIR_DESKTOP_SESSION_SECRET,
      )
      .expect(200);
    expect(service.inspectRun).toHaveBeenCalledOnce();

    await request(app)
      .get(`/api/v1/agent-runs/${RUN_ID}`)
      .set("Host", "127.0.0.1:43123")
      .set("X-Casimir-Desktop-Session", "wrong-secret")
      .expect(403);
    expect(service.inspectRun).toHaveBeenCalledOnce();
  });
});

describe("Helix MCP server", () => {
  const connect = async (input: {
    service: ServiceDouble;
    authPrincipal?: HelixAgentApiPrincipal;
  }) => {
    const server = createHelixRunMcpServer({
      principal: input.authPrincipal ?? principal(),
      service: asService(input.service),
    });
    const client = new Client(
      { name: "helix-transport-test", version: "1.0.0" },
      { capabilities: {} },
    );
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    return {
      client,
      server,
      close: async () => {
        await client.close();
        await server.close();
      },
    };
  };

  it("initializes with instructions and lists a stable OAuth-upgrade catalog with annotations", async () => {
    const service = serviceDouble();
    const connection = await connect({ service });
    try {
      expect(connection.client.getServerVersion()).toEqual({
        name: "casimirbot-helix-agent",
        version: "1.0.0",
      });
      expect(connection.client.getInstructions()).toContain(
        "completion_status and terminal_authority_status are separate",
      );
      const tools = await connection.client.listTools();
      expect(tools.tools.map((tool) => tool.name).sort()).toEqual([
        "helix_run_cancel",
        "helix_run_continue",
        "helix_run_fetch_evidence",
        "helix_run_inspect",
        "helix_run_list_events",
        "helix_run_start",
      ]);
      expect(
        tools.tools.find((tool) => tool.name === "helix_run_inspect")
          ?.annotations,
      ).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      });
      expect(
        tools.tools.find((tool) => tool.name === "helix_run_cancel")
          ?.annotations,
      ).toMatchObject({
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
      });
    } finally {
      await connection.close();
    }

    const readOnly = await connect({
      service,
      authPrincipal: principal([HELIX_AGENT_RUN_READ_SCOPE]),
    });
    try {
      const tools = await readOnly.client.listTools();
      expect(tools.tools.map((tool) => tool.name).sort()).toEqual([
        "helix_run_cancel",
        "helix_run_continue",
        "helix_run_fetch_evidence",
        "helix_run_inspect",
        "helix_run_list_events",
        "helix_run_start",
      ]);
    } finally {
      await readOnly.close();
    }
  });

  it("calls durable tools with stable idempotency and returns structured results", async () => {
    const service = serviceDouble();
    const connection = await connect({ service });
    try {
      const started = await connection.client.callTool({
        name: "helix_run_start",
        arguments: {
          idempotency_key: "mcp-stable-start",
          request: {
            objective: "Research the bounded objective.",
          },
        },
      });
      expect(started.isError).not.toBe(true);
      expect(started.structuredContent).toMatchObject({
        operation: "start",
        idempotency_replayed: false,
        run: {
          run_id: RUN_ID,
          answer_authority: false,
          assistant_answer: false,
          terminal_eligible: false,
        },
      });
      expect(service.startRun).toHaveBeenCalledWith({
        principal: expect.objectContaining({
          tenantId: "tenant-transport",
          accountProfileId: "profile-transport",
        }),
        idempotencyKey: "mcp-stable-start",
        request: expect.objectContaining({
          objective: "Research the bounded objective.",
          database_scope: [],
        }),
      });

      const inspected = await connection.client.callTool({
        name: "helix_run_inspect",
        arguments: { run_id: RUN_ID },
      });
      expect(inspected.structuredContent).toMatchObject({
        operation: "inspect",
        run: { run_id: RUN_ID },
      });
      expect(service.inspectRun).toHaveBeenCalledWith({
        principal: expect.any(Object),
        runId: RUN_ID,
      });
    } finally {
      await connection.close();
    }
  });

  it("returns typed service failures as non-authoritative MCP tool errors", async () => {
    const service = serviceDouble();
    service.continueRun.mockRejectedValue(
      new HelixAgentApiServiceError(
        409,
        "version_conflict",
        "The expected run version is stale.",
        true,
        { current_version: 9 },
      ),
    );
    const connection = await connect({ service });
    try {
      const result = await connection.client.callTool({
        name: "helix_run_continue",
        arguments: {
          run_id: RUN_ID,
          idempotency_key: "mcp-continue-key",
          request: {
            expected_version: 8,
            instruction: "Continue.",
          },
        },
      });
      expect(result.isError).toBe(true);
      expect(result.structuredContent).toEqual({
        schema: "helix.agent_api.error.v1",
        error: "version_conflict",
        message: "The expected run version is stale.",
        request_id: null,
        retryable: true,
        details: { current_version: 9 },
      });
    } finally {
      await connection.close();
    }
  });
});

describe("Helix MCP HTTP transport", () => {
  const createMcpApp = (input?: {
    service?: ServiceDouble;
    authenticate?: () => Promise<HelixAgentApiPrincipal>;
    authenticateDesktop?: (
      req: express.Request,
      scopes: readonly string[],
    ) => Promise<HelixAgentApiPrincipal>;
    desktopDelegationScopes?: readonly string[];
    resourceMetadataPath?: string;
  }): express.Express => {
    const app = express();
    app.use(
      "/mcp",
      createHelixMcpRouter({
        service: asService(input?.service ?? serviceDouble()),
        authenticate: input?.authenticate ?? (async () => principal()),
        authenticateDesktop: input?.authenticateDesktop,
        desktopDelegationScopes: input?.desktopDelegationScopes,
        rateLimit: false,
        enforceTransportSecurity: false,
        resourceMetadataPath: input?.resourceMetadataPath,
      }),
    );
    return app;
  };

  it("serves initialize and tools/list as stateless JSON-RPC POSTs", async () => {
    const app = createMcpApp();
    const initialize = await mcpHeaders(
      request(app).post("/mcp").set("X-Request-Id", "mcp-initialize-1"),
    )
      .send({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "http-test", version: "1.0.0" },
        },
      })
      .expect(200);
    expect(initialize.headers["x-request-id"]).toBe("mcp-initialize-1");
    expect(initialize.body).toMatchObject({
      jsonrpc: "2.0",
      id: 1,
      result: {
        serverInfo: {
          name: "casimirbot-helix-agent",
          version: "1.0.0",
        },
      },
    });

    const listed = await mcpHeaders(request(app).post("/mcp"))
      .send({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      })
      .expect(200);
    expect(
      listed.body.result.tools.map((tool: { name: string }) => tool.name),
    ).toEqual(
      expect.arrayContaining([
        "helix_run_start",
        "helix_run_continue",
        "helix_run_inspect",
        "helix_room_list",
        "helix_room_command_request",
        "helix_minecraft_player_action",
        "helix_minecraft_workflow_status",
        "helix_minecraft_workflow_control",
      ]),
    );
  });

  it("rejects credential-shaped MCP envelope fields without echoing them", async () => {
    const app = createMcpApp();
    const requestIdSecret = "room_source_claim_mcp_request_secret_123456";
    const safeInitialize = await mcpHeaders(
      request(app).post("/mcp").set("X-Request-Id", requestIdSecret),
    )
      .send({
        jsonrpc: "2.0",
        id: 91,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "http-test", version: "1.0.0" },
        },
      })
      .expect(200);
    expect(safeInitialize.headers["x-request-id"]).toMatch(/^mcp_req_/);
    expect(
      JSON.stringify({
        headers: safeInitialize.headers,
        body: safeInitialize.body,
      }),
    ).not.toContain(requestIdSecret);

    const rpcIdSecret = "helix_room_src_mcp_rpc_id_secret_123456";
    const rejected = await mcpHeaders(request(app).post("/mcp"))
      .send({
        jsonrpc: "2.0",
        id: rpcIdSecret,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "http-test", version: "1.0.0" },
        },
      })
      .expect(400);
    expect(rejected.body).toEqual({
      jsonrpc: "2.0",
      error: {
        code: -32602,
        message:
          "Protected credential material is not accepted by this MCP resource.",
      },
      id: null,
    });
    expect(JSON.stringify(rejected.body)).not.toContain(rpcIdSecret);
  });

  it("dispatches stateless tools/call to the injected durable service", async () => {
    const service = serviceDouble();
    const response = await mcpHeaders(
      request(createMcpApp({ service })).post("/mcp"),
    )
      .send({
        jsonrpc: "2.0",
        id: "call-1",
        method: "tools/call",
        params: {
          name: "helix_run_inspect",
          arguments: { run_id: RUN_ID },
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      jsonrpc: "2.0",
      id: "call-1",
      result: {
        structuredContent: {
          operation: "inspect",
          run: { run_id: RUN_ID },
        },
      },
    });
    expect(service.inspectRun).toHaveBeenCalledWith({
      principal: expect.objectContaining({ tenantId: "tenant-transport" }),
      runId: RUN_ID,
    });
  });

  it("returns JSON-RPC parse and method-not-allowed errors without a server", async () => {
    const app = createMcpApp();
    const malformed = await request(app)
      .post("/mcp")
      .set("Content-Type", "application/json")
      .send('{"jsonrpc":')
      .expect(400);
    expect(malformed.body).toEqual({
      jsonrpc: "2.0",
      error: {
        code: -32700,
        message: "Parse error.",
      },
      id: null,
    });

    for (const method of ["get", "delete"] as const) {
      const response = await request(app)[method]("/mcp").expect(405);
      expect(response.headers.allow).toBe("POST");
      expect(response.body).toEqual({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message:
            "Method not allowed. This MCP resource uses stateless POST requests.",
        },
        id: null,
      });
    }
  });

  it("preserves typed OAuth failures on the protected MCP resource", async () => {
    process.env.CASIMIR_PUBLIC_BASE_URL = "https://agent.example";
    const app = createMcpApp({
      resourceMetadataPath: HELIX_DEVICE_CHECK_RESOURCE_METADATA_PATH,
      authenticate: async () => {
        throw new HelixAgentApiServiceError(
          401,
          "unauthorized",
          "Bearer token rejected.",
        );
      },
    });
    const response = await mcpHeaders(request(app).post("/mcp"))
      .send({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/list",
        params: {},
      })
      .expect(401);
    expect(response.body).toMatchObject({
      schema: "helix.agent_api.error.v1",
      error: "unauthorized",
      message: "Bearer token rejected.",
    });
    expect(response.headers["www-authenticate"]).toContain(
      'error="invalid_token"',
    );
    expect(response.headers["www-authenticate"]).toMatch(
      new RegExp(
        `resource_metadata="http://127\\.0\\.0\\.1:\\d+${HELIX_DEVICE_CHECK_RESOURCE_METADATA_PATH.replaceAll("/", "\\/")}"`,
        "u",
      ),
    );
  });

  it("prefers an exact native desktop delegation even when the tunnel forwards a bearer", async () => {
    const authenticateDesktop = vi.fn(
      async (_req: express.Request, _scopes: readonly string[]) =>
        principal(),
    );
    const app = express();
    app.use(
      "/mcp",
      createHelixMcpRouter({
        service: asService(serviceDouble()),
        authenticateDesktop,
        desktopDelegationScopes: ["helix.rooms.read"],
        rateLimit: false,
        enforceTransportSecurity: false,
      }),
    );

    await mcpHeaders(request(app).post("/mcp"))
      .send({ jsonrpc: "2.0", id: 41, method: "tools/list", params: {} })
      .expect(200);
    expect(authenticateDesktop).toHaveBeenCalledOnce();
    expect(authenticateDesktop.mock.calls[0]?.[1]).toEqual([
      "helix.rooms.read",
    ]);

    await mcpHeaders(
      request(app).post("/mcp").set("Authorization", "Bearer external-token"),
    )
      .send({ jsonrpc: "2.0", id: 42, method: "tools/list", params: {} })
      .expect(401);
    expect(authenticateDesktop).toHaveBeenCalledOnce();

    await mcpHeaders(
      request(app)
        .post("/mcp")
        .set("Authorization", "Bearer external-token")
        .set("X-Casimir-Desktop-Session", "native-desktop-secret")
        .set(
          "X-Casimir-Desktop-Account-Session",
          "account_session:native-developer-owner",
        ),
    )
      .send({ jsonrpc: "2.0", id: 43, method: "tools/list", params: {} })
      .expect(200);
    expect(authenticateDesktop).toHaveBeenCalledTimes(2);
    expect(authenticateDesktop.mock.calls[1]?.[1]).toEqual([
      "helix.rooms.read",
    ]);
  });

  it("returns a typed legacy fallback for the modern server discovery probe", async () => {
    const app = createMcpApp();

    const response = await mcpHeaders(request(app).post("/mcp"))
      .send({
        jsonrpc: "2.0",
        id: "discover-fixture",
        method: "server/discover",
        params: {
          _meta: {
            "io.modelcontextprotocol/protocolVersion": "2026-07-28",
            "io.modelcontextprotocol/clientInfo": {
              name: "fixture-client",
              version: "1.0.0",
            },
            "io.modelcontextprotocol/clientCapabilities": {},
          },
        },
      })
      .expect(404);

    expect(response.body).toEqual({
      jsonrpc: "2.0",
      error: { code: -32601, message: "Method not found" },
      id: "discover-fixture",
    });
  });
});
