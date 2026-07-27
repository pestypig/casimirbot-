import { newDb } from "pg-mem";
import type { Pool } from "pg";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildHelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import {
  helixAgentContinueRequestSchema,
  helixAgentStartRequestSchema,
} from "@shared/contracts/helix-agent-api.v1";
import { migration026 } from "../../../db/migrations/026_helix_accounts";
import { migration032 } from "../../../db/migrations/032_helix_agent_api";
import { HelixAgentApiService, HelixAgentApiServiceError } from "../service";
import { HelixAgentRunStore } from "../run-store";
import type {
  HelixAgentApiPrincipal,
  HelixAgentRunTurnExecutor,
  HelixAgentRunTurnExecutorInput,
  HelixAgentRunTurnExecutorResult,
} from "../types";

const pools: Pool[] = [];

const createPool = async (): Promise<Pool> => {
  const memory = newDb({ autoCreateForeignKeyIndices: true });
  const adapter = memory.adapters.createPg();
  const pool = new adapter.Pool() as unknown as Pool;
  const client = await pool.connect();
  try {
    await migration026.run(client, { enablePgvector: false });
    await migration032.run(client, { enablePgvector: false });
  } finally {
    client.release();
  }
  pools.push(pool);
  return pool;
};

afterEach(async () => {
  vi.useRealTimers();
  await Promise.all(pools.splice(0).map((pool) => pool.end()));
});

const principal = (
  overrides: Partial<HelixAgentApiPrincipal> = {},
): HelixAgentApiPrincipal => {
  const accountType = overrides.accountType ?? "developer";
  const accountPolicy =
    accountType === "developer"
      ? buildHelixAccountCapabilityPolicy("developer")
      : buildHelixAccountCapabilityPolicy("user");
  return {
    tenantId: "tenant-a",
    issuer: "https://issuer.example",
    subjectId: "subject-a",
    accountProfileId: "profile-a",
    accountType,
    scopes: new Set([
      "helix.agent_runs.read",
      "helix.agent_runs.write",
      "helix.agent_runs.developer",
    ]),
    tokenExpiresAt: "2026-07-27T00:00:00.000Z",
    accountContext: {
      session_id: "session-a",
      profile_id: "profile-a",
      trusted_account_session: true,
      account_session: null,
      account_policy: accountPolicy,
    },
    ...overrides,
  };
};

const result = (
  overrides: Partial<HelixAgentRunTurnExecutorResult> = {},
): HelixAgentRunTurnExecutorResult => ({
  ok: true,
  statusCode: 200,
  summary: "The governed turn needs more evidence.",
  observationRefs: [],
  evidenceRefs: [],
  receiptRefs: [],
  claimsSupported: [],
  claimsContradicted: [],
  unresolvedRequirements: ["evidence:missing"],
  resolvedRequirements: [],
  satisfiedEvidenceRequirements: [],
  contradictions: [],
  resolvedContradictions: [],
  pendingQuestions: [],
  terminalAuthorityStatus: "pending_helix_terminal_authority",
  terminalProduct: null,
  outputFields: {},
  failureCode: null,
  needsInput: false,
  sanitizedResult: {
    ok: true,
    raw_provider_payload_included: false,
    chain_of_thought_included: false,
  },
  ...overrides,
});

const buildExecutor = (
  implementation:
    | ((
        input: HelixAgentRunTurnExecutorInput,
      ) => Promise<HelixAgentRunTurnExecutorResult>)
    | HelixAgentRunTurnExecutorResult = result(),
) => {
  const executeTurn = vi.fn(
    typeof implementation === "function"
      ? implementation
      : async () => implementation,
  );
  return {
    executor: { executeTurn } satisfies HelixAgentRunTurnExecutor,
    executeTurn,
  };
};

const startRequest = (overrides: Record<string, unknown> = {}) =>
  helixAgentStartRequestSchema.parse({
    objective: "Evaluate the candidate against admitted evidence.",
    completion_contract: {
      min_evidence_refs: 1,
      require_terminal_authority: true,
      required_output_fields: [],
      max_unresolved_requirements: 0,
      allow_conflicts: false,
    },
    budget: {
      max_steps: 4,
      expires_in_seconds: 3_600,
    },
    ...overrides,
  });

const continueRequest = (
  expectedVersion: number,
  overrides: Record<string, unknown> = {},
) =>
  helixAgentContinueRequestSchema.parse({
    expected_version: expectedVersion,
    instruction: "Continue the bounded analysis.",
    ...overrides,
  });

const serviceHarness = async (
  options: {
    executor?: HelixAgentRunTurnExecutor;
    now?: () => Date;
    scopePolicies?: ReadonlyMap<
      string,
      {
        allowedTools: readonly string[];
        requiredEvidence: readonly string[];
        oauthScope: string;
      }
    >;
    scopeAllowlist?: ReadonlySet<string>;
    pool?: Pool;
    store?: HelixAgentRunStore;
  } = {},
) => {
  const pool = options.pool ?? (await createPool());
  let nextId = 0;
  const service = new HelixAgentApiService({
    store: options.store ?? new HelixAgentRunStore(pool),
    executor: options.executor ?? buildExecutor().executor,
    now: options.now ?? (() => new Date("2026-07-26T19:00:00.000Z")),
    randomId: () => `id-${++nextId}`,
    databaseScopePolicies: options.scopePolicies ?? new Map(),
    databaseScopeAllowlist: options.scopeAllowlist ?? new Set(),
    turnTimeoutMs: 1_000,
  });
  return { pool, service };
};

describe("HelixAgentApiService", () => {
  it("rejects protected credential material before run persistence or model entry", async () => {
    const turn = buildExecutor();
    const { service } = await serviceHarness({ executor: turn.executor });
    const actor = principal();
    const sourceBearer = "helix_room_src_agent_input_secret_123456";

    await expect(
      service.startRun({
        principal: actor,
        idempotencyKey: "protected-start-input",
        request: startRequest({
          objective: `Inspect ${sourceBearer}`,
        }),
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "invalid_request",
      details: {
        failure_code: "protected_sensitive_content_rejected",
      },
    });

    const started = await service.startRun({
      principal: actor,
      idempotencyKey: "safe-start-input",
      request: startRequest(),
    });
    await expect(
      service.continueRun({
        principal: actor,
        runId: started.body.run_id,
        idempotencyKey: "protected-continue-input",
        request: continueRequest(started.body.version, {
          instruction: "Use room_source_claim_agent_input_secret_123456 now.",
        }),
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "invalid_request",
      details: {
        failure_code: "protected_sensitive_content_rejected",
      },
    });
    expect(turn.executeTurn).not.toHaveBeenCalled();
    expect(
      await service.inspectRun({
        principal: actor,
        runId: started.body.run_id,
      }),
    ).toMatchObject({ version: started.body.version });
  });

  it("replaces a secret-bearing executor result before durable processing", async () => {
    const sourceBearer = "helix_room_src_executor_output_secret_123456";
    const turn = buildExecutor(
      result({
        summary: `Executor summary ${sourceBearer}`,
        observationRefs: [`observation:${sourceBearer}`],
        evidenceRefs: [`evidence:${sourceBearer}`],
        receiptRefs: [`receipt:${sourceBearer}`],
        claimsSupported: [`supported:${sourceBearer}`],
        claimsContradicted: [`contradicted:${sourceBearer}`],
        unresolvedRequirements: [],
        resolvedRequirements: [`resolved:${sourceBearer}`],
        satisfiedEvidenceRequirements: [],
        contradictions: [`contradiction:${sourceBearer}`],
        resolvedContradictions: [`resolved-contradiction:${sourceBearer}`],
        terminalAuthorityStatus: "authorized",
        terminalProduct: {
          authority_ref: `authority:${sourceBearer}`,
          artifact_kind: "helix.ask.terminal_product.v1",
          text: `Terminal output ${sourceBearer}`,
          supporting_evidence_refs: [`evidence:${sourceBearer}`],
        },
        outputFields: {
          answer: `Output ${sourceBearer}`,
        },
        sanitizedResult: {
          ok: true,
          nested: { secret: sourceBearer },
          terminal_authority_status: "authorized",
        },
      }),
    );
    const { service, pool } = await serviceHarness({
      executor: turn.executor,
    });
    const actor = principal();
    const started = await service.startRun({
      principal: actor,
      idempotencyKey: "secret-executor-start",
      request: startRequest(),
    });

    const continued = await service.continueRun({
      principal: actor,
      runId: started.body.run_id,
      idempotencyKey: "secret-executor-continue",
      request: continueRequest(started.body.version),
    });
    const events = await service.listEvents({
      principal: actor,
      runId: started.body.run_id,
      afterSeq: 0,
      limit: 50,
    });
    const evidence = await service.fetchEvidence({
      principal: actor,
      runId: started.body.run_id,
    });
    const { rows: durableRuns } = await pool.query<{
      latest_summary: string | null;
      latest_result: Record<string, unknown> | null;
      evidence_bundle: Record<string, unknown>;
    }>(
      `
        SELECT latest_summary, latest_result, evidence_bundle
        FROM helix_agent_runs
        WHERE run_id = $1;
      `,
      [started.body.run_id],
    );
    const { rows: durableEvents } = await pool.query<{
      payload: Record<string, unknown>;
    }>(
      `
        SELECT payload
        FROM helix_agent_api_events
        WHERE run_id = $1
        ORDER BY seq ASC;
      `,
      [started.body.run_id],
    );

    expect(continued.body).toMatchObject({
      lifecycle_status: "waiting",
      completion_status: "blocked",
      terminal_authority_status: "blocked",
      summary:
        "The governed executor result contained protected credential material and was rejected.",
      latest_result: {
        ok: false,
        failure_code: "protected_sensitive_content_rejected",
        terminal_authority_status: "blocked",
        terminal_product: null,
      },
    });
    expect(continued.body.evidence).toMatchObject({
      observation_refs: [],
      evidence_refs: [],
      receipt_refs: [],
      provider_terminal_candidate_ref: null,
    });
    expect(
      JSON.stringify({
        run: continued.body,
        events,
        evidence,
        durableRuns,
        durableEvents,
      }),
    ).not.toContain(sourceBearer);
    expect(durableRuns[0]?.latest_result).toMatchObject({
      failure_code: "protected_sensitive_content_rejected",
      terminal_product: null,
    });
    expect(durableEvents.map((event) => event.payload)).toContainEqual(
      expect.objectContaining({
        failure_code: "protected_sensitive_content_rejected",
      }),
    );
  });

  it("redacts protected material from legacy run, event, and evidence projections", async () => {
    const { service, pool } = await serviceHarness();
    const actor = principal();
    const started = await service.startRun({
      principal: actor,
      idempotencyKey: "legacy-projection-start",
      request: startRequest(),
    });
    const sourceBearer = "helix_room_src_legacy_projection_123456";
    const legacyEvidenceBundle = {
      ...started.body.evidence,
      evidence_refs: [sourceBearer],
    };
    await pool.query(
      `
        UPDATE helix_agent_runs
        SET
          objective = $2,
          latest_summary = $2,
          latest_result = $3::jsonb,
          evidence_bundle = $4::jsonb
        WHERE run_id = $1;
      `,
      [
        started.body.run_id,
        sourceBearer,
        JSON.stringify({ message: sourceBearer }),
        JSON.stringify(legacyEvidenceBundle),
      ],
    );
    await pool.query(
      `
        UPDATE helix_agent_api_events
        SET payload = $2::jsonb
        WHERE run_id = $1;
      `,
      [started.body.run_id, JSON.stringify({ legacy: sourceBearer })],
    );

    const inspected = await service.inspectRun({
      principal: actor,
      runId: started.body.run_id,
    });
    const events = await service.listEvents({
      principal: actor,
      runId: started.body.run_id,
      afterSeq: 0,
      limit: 20,
    });
    const evidence = await service.fetchEvidence({
      principal: actor,
      runId: started.body.run_id,
    });

    const projected = JSON.stringify({ inspected, events, evidence });
    expect(projected).not.toContain(sourceBearer);
    expect(projected).toContain("[REDACTED_SECRET]");
  });

  it("durably starts, inspects, and exactly replays an idempotent request", async () => {
    const { service, pool } = await serviceHarness();
    const owner = principal();
    const first = await service.startRun({
      principal: owner,
      idempotencyKey: "start-key-0001",
      request: startRequest(),
    });
    const replay = await service.startRun({
      principal: owner,
      idempotencyKey: "start-key-0001",
      request: startRequest(),
    });

    expect(first.status).toBe(201);
    expect(first.idempotencyReplayed).toBe(false);
    expect(replay).toEqual({
      status: 201,
      body: first.body,
      idempotencyReplayed: true,
    });
    expect(
      await service.inspectRun({ principal: owner, runId: first.body.run_id }),
    ).toEqual(first.body);

    const restarted = new HelixAgentApiService({
      store: new HelixAgentRunStore(pool),
      executor: buildExecutor().executor,
      databaseScopePolicies: new Map(),
      databaseScopeAllowlist: new Set(),
    });
    expect(
      await restarted.inspectRun({
        principal: owner,
        runId: first.body.run_id,
      }),
    ).toEqual(first.body);
  });

  it("isolates runs by tenant, issuer, subject, and linked account profile", async () => {
    const { service } = await serviceHarness();
    const owner = principal();
    const started = await service.startRun({
      principal: owner,
      idempotencyKey: "start-key-0002",
      request: startRequest(),
    });

    for (const other of [
      principal({ tenantId: "tenant-b" }),
      principal({ issuer: "https://other-issuer.example" }),
      principal({ subjectId: "subject-b" }),
      principal({
        accountProfileId: "profile-b",
        accountContext: {
          ...owner.accountContext,
          profile_id: "profile-b",
        },
      }),
    ]) {
      await expect(
        service.inspectRun({
          principal: other,
          runId: started.body.run_id,
        }),
      ).rejects.toMatchObject({
        status: 404,
        code: "not_found",
      });
    }
  });

  it("persists cumulative evidence and open issues across bounded continuations", async () => {
    const turns = [
      result({
        summary: "First turn",
        observationRefs: ["obs:one"],
        evidenceRefs: ["evidence:one"],
        unresolvedRequirements: ["requirement:one"],
        contradictions: ["conflict:one"],
      }),
      result({
        summary: "Second turn",
        observationRefs: ["obs:two"],
        evidenceRefs: ["evidence:two"],
        unresolvedRequirements: ["requirement:two"],
        resolvedRequirements: ["requirement:one"],
        contradictions: [],
        resolvedContradictions: ["conflict:one"],
      }),
    ];
    const fake = buildExecutor(async () => turns.shift() ?? result());
    const { service } = await serviceHarness({ executor: fake.executor });
    const owner = principal();
    const started = await service.startRun({
      principal: owner,
      idempotencyKey: "start-key-0003",
      request: startRequest(),
    });
    const first = await service.continueRun({
      principal: owner,
      runId: started.body.run_id,
      idempotencyKey: "continue-key-0001",
      request: continueRequest(started.body.version),
    });
    const second = await service.continueRun({
      principal: owner,
      runId: started.body.run_id,
      idempotencyKey: "continue-key-0002",
      request: continueRequest(first.body.version),
    });

    expect(second.body.evidence.observation_refs).toEqual([
      "obs:one",
      "obs:two",
    ]);
    expect(second.body.evidence.evidence_refs).toEqual([
      "evidence:one",
      "evidence:two",
    ]);
    expect(second.body.unresolved_requirements).toEqual(["requirement:two"]);
    expect(second.body.contradictions).toEqual([]);
    const events = await service.listEvents({
      principal: owner,
      runId: started.body.run_id,
      afterSeq: 0,
      limit: 100,
    });
    expect(events.events.map((event) => event.seq)).toEqual(
      events.events.map((_, index) => index + 1),
    );
    expect(events.events.map((event) => event.event_type)).toContain(
      "issues_resolved",
    );
  });

  it("preserves unanswered questions and deduplicates newly projected questions", async () => {
    const turns = [
      result({
        observationRefs: ["obs:questions:one"],
        unresolvedRequirements: [],
        pendingQuestions: [
          {
            question_id: "q1",
            prompt: "First question?",
            required_fields: ["first"],
            options: [],
          },
          {
            question_id: "q2",
            prompt: "Second question?",
            required_fields: ["second"],
            options: [],
          },
        ],
        needsInput: true,
      }),
      result({
        observationRefs: ["obs:questions:two"],
        unresolvedRequirements: [],
        terminalAuthorityStatus: "authorized",
        terminalProduct: {
          authority_ref: "terminal-grounding-authority:questions",
          artifact_kind: "answer",
          text: "This would otherwise satisfy the completion contract.",
          supporting_evidence_refs: ["obs:questions:two"],
        },
        pendingQuestions: [
          {
            question_id: "q3",
            prompt: "Stale third question?",
            required_fields: ["third"],
            options: [],
          },
          {
            question_id: "q3",
            prompt: "Current third question?",
            required_fields: ["third"],
            options: [],
          },
        ],
      }),
    ];
    const fake = buildExecutor(async () => turns.shift() ?? result());
    const { service } = await serviceHarness({ executor: fake.executor });
    const owner = principal();
    const started = await service.startRun({
      principal: owner,
      idempotencyKey: "start-key-pending-questions",
      request: startRequest(),
    });
    const first = await service.continueRun({
      principal: owner,
      runId: started.body.run_id,
      idempotencyKey: "continue-key-pending-questions-1",
      request: continueRequest(started.body.version),
    });
    const second = await service.continueRun({
      principal: owner,
      runId: started.body.run_id,
      idempotencyKey: "continue-key-pending-questions-2",
      request: continueRequest(first.body.version, {
        answers: [{ question_id: "q1", value: "answered" }],
      }),
    });

    expect(second.body.completion_status).toBe("needs_input");
    expect(second.body.pending_questions).toEqual([
      {
        question_id: "q2",
        prompt: "Second question?",
        required_fields: ["second"],
        options: [],
      },
      {
        question_id: "q3",
        prompt: "Current third question?",
        required_fields: ["third"],
        options: [],
      },
    ]);

    const events = await service.listEvents({
      principal: owner,
      runId: started.body.run_id,
      afterSeq: 0,
      limit: 100,
    });
    expect(
      events.events
        .filter((event) => event.event_type === "input_requested")
        .at(-1)?.payload.questions,
    ).toEqual(second.body.pending_questions);
  });

  it("replays a continuation before applying later version and terminal-state checks", async () => {
    const fake = buildExecutor(
      result({
        observationRefs: ["obs:replay"],
        unresolvedRequirements: ["still-open"],
      }),
    );
    const { service } = await serviceHarness({ executor: fake.executor });
    const owner = principal();
    const started = await service.startRun({
      principal: owner,
      idempotencyKey: "start-key-0004",
      request: startRequest(),
    });
    const request = continueRequest(started.body.version);
    const first = await service.continueRun({
      principal: owner,
      runId: started.body.run_id,
      idempotencyKey: "continue-key-replay",
      request,
    });
    const replay = await service.continueRun({
      principal: owner,
      runId: started.body.run_id,
      idempotencyKey: "continue-key-replay",
      request,
    });

    expect(replay).toEqual({
      status: first.status,
      body: first.body,
      idempotencyReplayed: true,
    });
    expect(fake.executeTurn).toHaveBeenCalledTimes(1);
  });

  it("returns outcome_unknown when finalization loses durable operation ownership", async () => {
    const pool = await createPool();
    const store = new HelixAgentRunStore(pool);
    const fake = buildExecutor(
      result({
        observationRefs: ["obs:lost-operation"],
        unresolvedRequirements: [],
      }),
    );
    const { service } = await serviceHarness({
      executor: fake.executor,
      pool,
      store,
    });
    const owner = principal();
    const started = await service.startRun({
      principal: owner,
      idempotencyKey: "start-key-lost-operation",
      request: startRequest(),
    });
    vi.spyOn(store, "finalizeContinuation").mockImplementationOnce(
      async (input) => {
        await store.cancelRun({
          owner: input.owner,
          runId: input.runId,
          expectedVersion: input.expectedClaimedVersion,
          reason: "concurrent cancellation won the version race",
          eventId: "evt-concurrent-cancellation",
          now: input.now,
        });
        return null;
      },
    );
    const request = continueRequest(started.body.version);

    await expect(
      service.continueRun({
        principal: owner,
        runId: started.body.run_id,
        idempotencyKey: "continue-key-lost-operation",
        request,
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "outcome_unknown",
      retryable: false,
      details: {
        run_id: started.body.run_id,
        claimed_version: started.body.version + 1,
      },
    });

    expect(
      await service.inspectRun({
        principal: owner,
        runId: started.body.run_id,
      }),
    ).toMatchObject({
      lifecycle_status: "cancelled",
      completion_status: "cancelled",
      version: started.body.version + 2,
    });
    await expect(
      service.continueRun({
        principal: owner,
        runId: started.body.run_id,
        idempotencyKey: "continue-key-lost-operation",
        request,
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "outcome_unknown",
    });
    expect(fake.executeTurn).toHaveBeenCalledTimes(1);
  });

  it("requires deployment scope, OAuth entitlement, and account policy together", async () => {
    const policies = new Map([
      [
        "repo",
        {
          allowedTools: ["repo.search"],
          requiredEvidence: ["repository_evidence"],
          oauthScope: "helix.data.repo.read",
        },
      ],
      [
        "repo-bundle",
        {
          allowedTools: ["repo.search", "docs-viewer.summarize_doc"],
          requiredEvidence: ["repository_evidence"],
          oauthScope: "helix.data.repo-bundle.read",
        },
      ],
      [
        "developer-secret",
        {
          allowedTools: ["developer.secret.read"],
          requiredEvidence: ["secret_evidence"],
          oauthScope: "helix.data.secret.read",
        },
      ],
    ]);
    const fake = buildExecutor();
    const { service } = await serviceHarness({
      executor: fake.executor,
      scopePolicies: policies,
      scopeAllowlist: new Set(policies.keys()),
    });
    const user = principal({
      accountType: "user",
      scopes: new Set([
        "helix.agent_runs.read",
        "helix.agent_runs.write",
        "helix.data.repo.read",
      ]),
      accountContext: {
        session_id: "session-user",
        profile_id: "profile-a",
        trusted_account_session: true,
        account_session: null,
        account_policy: buildHelixAccountCapabilityPolicy("user"),
      },
    });

    const repo = await service.startRun({
      principal: user,
      idempotencyKey: "scope-key-repo-1",
      request: startRequest({ database_scope: ["repo"] }),
    });
    await service.continueRun({
      principal: user,
      runId: repo.body.run_id,
      idempotencyKey: "scope-continue-repo-1",
      request: continueRequest(repo.body.version),
    });
    expect(fake.executeTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        databaseScope: ["repo"],
        allowedTools: ["repo.search"],
        requiredEvidence: ["repository_evidence"],
      }),
    );

    await expect(
      service.startRun({
        principal: {
          ...user,
          scopes: new Set([...user.scopes, "helix.data.repo-bundle.read"]),
        },
        idempotencyKey: "scope-key-exact-capability-check",
        request: startRequest({ database_scope: ["repo-bundle"] }),
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "account_policy_blocked",
      details: {
        denied_capabilities: ["docs-viewer.summarize_doc"],
      },
    });

    await expect(
      service.startRun({
        principal: principal({
          accountType: "user",
          scopes: new Set(["helix.agent_runs.read", "helix.agent_runs.write"]),
          accountContext: user.accountContext,
        }),
        idempotencyKey: "scope-key-missing-oauth",
        request: startRequest({ database_scope: ["repo"] }),
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "insufficient_scope",
    });

    await expect(
      service.startRun({
        principal: {
          ...user,
          scopes: new Set([...user.scopes, "helix.data.secret.read"]),
        },
        idempotencyKey: "scope-key-account-deny",
        request: startRequest({ database_scope: ["developer-secret"] }),
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "account_policy_blocked",
    });
  });

  it("rechecks OAuth entitlement and current account capability policy before every continuation", async () => {
    const policies = new Map([
      [
        "repo",
        {
          allowedTools: ["repo.search"],
          requiredEvidence: ["repository_evidence"],
          oauthScope: "helix.data.repo.read",
        },
      ],
      [
        "repo-bundle",
        {
          allowedTools: ["repo.search", "docs-viewer.summarize_doc"],
          requiredEvidence: ["repository_evidence"],
          oauthScope: "helix.data.repo-bundle.read",
        },
      ],
    ]);
    const fake = buildExecutor();
    const { service } = await serviceHarness({
      executor: fake.executor,
      scopePolicies: policies,
      scopeAllowlist: new Set(policies.keys()),
    });
    const admitted = principal({
      scopes: new Set([
        "helix.agent_runs.read",
        "helix.agent_runs.write",
        "helix.agent_runs.developer",
        "helix.data.repo.read",
        "helix.data.repo-bundle.read",
      ]),
    });

    const oauthRun = await service.startRun({
      principal: admitted,
      idempotencyKey: "scope-key-oauth-loss",
      request: startRequest({ database_scope: ["repo"] }),
    });
    await expect(
      service.continueRun({
        principal: {
          ...admitted,
          scopes: new Set([
            "helix.agent_runs.read",
            "helix.agent_runs.write",
            "helix.agent_runs.developer",
          ]),
        },
        runId: oauthRun.body.run_id,
        idempotencyKey: "scope-continue-oauth-loss",
        request: continueRequest(oauthRun.body.version),
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "insufficient_scope",
      details: {
        denied_scopes: ["repo"],
        required_oauth_scopes: ["helix.data.repo.read"],
      },
    });
    expect(fake.executeTurn).not.toHaveBeenCalled();

    const policyRun = await service.startRun({
      principal: admitted,
      idempotencyKey: "scope-key-account-policy-loss",
      request: startRequest({ database_scope: ["repo-bundle"] }),
    });
    await expect(
      service.continueRun({
        principal: {
          ...admitted,
          accountContext: {
            ...admitted.accountContext,
            account_policy: buildHelixAccountCapabilityPolicy("user"),
          },
        },
        runId: policyRun.body.run_id,
        idempotencyKey: "scope-continue-account-policy-loss",
        request: continueRequest(policyRun.body.version),
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "account_policy_blocked",
      details: {
        denied_capabilities: ["docs-viewer.summarize_doc"],
      },
    });
    expect(fake.executeTurn).not.toHaveBeenCalled();
  });

  it("projects a terminal product only when the completion contract passes", async () => {
    const fake = buildExecutor(
      result({
        summary: "Canonical final answer",
        observationRefs: ["obs:terminal"],
        evidenceRefs: ["evidence:terminal"],
        unresolvedRequirements: [],
        terminalAuthorityStatus: "authorized",
        terminalProduct: {
          authority_ref: "terminal-grounding-authority:one",
          artifact_kind: "answer",
          text: "Canonical final answer",
          supporting_evidence_refs: ["evidence:terminal"],
        },
        outputFields: {
          text: "Canonical final answer",
        },
      }),
    );
    const { service } = await serviceHarness({ executor: fake.executor });
    const owner = principal();
    const started = await service.startRun({
      principal: owner,
      idempotencyKey: "start-key-terminal",
      request: startRequest({
        completion_contract: {
          min_evidence_refs: 1,
          require_terminal_authority: true,
          required_output_fields: ["text"],
          max_unresolved_requirements: 0,
          allow_conflicts: false,
        },
      }),
    });
    const completed = await service.continueRun({
      principal: owner,
      runId: started.body.run_id,
      idempotencyKey: "continue-key-terminal",
      request: continueRequest(started.body.version),
    });

    expect(completed.body).toMatchObject({
      lifecycle_status: "completed",
      completion_status: "completed",
      terminal_authority_status: "authorized",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
    });
    expect(completed.body.evidence.provider_terminal_candidate_ref).toBe(
      "terminal-grounding-authority:one",
    );
    await expect(
      service.continueRun({
        principal: owner,
        runId: started.body.run_id,
        idempotencyKey: "continue-after-complete",
        request: continueRequest(completed.body.version),
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "run_not_resumable",
    });
  });

  it("reconstructs a missing scope-required evidence blocker even when an executor generically claims it resolved", async () => {
    const fake = buildExecutor(
      result({
        summary: "A terminal candidate without the required scoped evidence.",
        evidenceRefs: ["evidence:unrelated"],
        unresolvedRequirements: [],
        resolvedRequirements: ["required_evidence:shared_live_room_evidence"],
        satisfiedEvidenceRequirements: [],
        terminalAuthorityStatus: "authorized",
        terminalProduct: {
          authority_ref: "terminal-grounding-authority:missing-room-evidence",
          artifact_kind: "answer",
          text: "Unsupported room answer",
          supporting_evidence_refs: ["evidence:unrelated"],
        },
        outputFields: {
          text: "Unsupported room answer",
        },
        sanitizedResult: {
          ok: true,
          terminal_authority_status: "authorized",
          terminal_product: {
            authority_ref: "terminal-grounding-authority:missing-room-evidence",
          },
          raw_provider_payload_included: false,
          chain_of_thought_included: false,
        },
      }),
    );
    const { service } = await serviceHarness({
      executor: fake.executor,
      scopeAllowlist: new Set(["bound_room_evidence"]),
      scopePolicies: new Map([
        [
          "bound_room_evidence",
          {
            allowedTools: ["room.evidence.read_bound"],
            requiredEvidence: ["shared_live_room_evidence"],
            oauthScope: "helix.rooms.read",
          },
        ],
      ]),
    });
    const owner = principal({
      scopes: new Set([
        "helix.agent_runs.read",
        "helix.agent_runs.write",
        "helix.agent_runs.developer",
        "helix.rooms.read",
      ]),
    });
    const started = await service.startRun({
      principal: owner,
      idempotencyKey: "start-key-required-evidence-hard-gate",
      request: startRequest({
        database_scope: ["bound_room_evidence"],
        completion_contract: {
          min_evidence_refs: 1,
          require_terminal_authority: true,
          required_output_fields: ["text"],
          max_unresolved_requirements: 1,
          allow_conflicts: false,
        },
      }),
    });

    const continued = await service.continueRun({
      principal: owner,
      runId: started.body.run_id,
      idempotencyKey: "continue-key-required-evidence-hard-gate",
      request: continueRequest(started.body.version),
    });

    expect(continued.body).toMatchObject({
      lifecycle_status: "waiting",
      completion_status: "needs_more_evidence",
      terminal_authority_status: "blocked",
      unresolved_requirements: ["required_evidence:shared_live_room_evidence"],
      latest_result: {
        terminal_authority_status: "blocked",
        terminal_authority_reason: "required_current_turn_evidence_missing",
        terminal_product: null,
      },
    });
    expect(continued.body.evidence.provider_terminal_candidate_ref).toBeNull();
  });

  it("fails closed at the step budget and persists the terminal budget event", async () => {
    const fake = buildExecutor(result());
    const { service } = await serviceHarness({ executor: fake.executor });
    const owner = principal();
    const started = await service.startRun({
      principal: owner,
      idempotencyKey: "start-key-budget",
      request: startRequest({
        budget: {
          max_steps: 1,
          expires_in_seconds: 3_600,
        },
      }),
    });
    const exhausted = await service.continueRun({
      principal: owner,
      runId: started.body.run_id,
      idempotencyKey: "continue-key-budget",
      request: continueRequest(started.body.version),
    });

    expect(exhausted.body).toMatchObject({
      lifecycle_status: "failed",
      completion_status: "budget_exhausted",
      terminal_authority_status: "pending_helix_terminal_authority",
      budget: { max_steps: 1, steps_used: 1 },
    });
    const events = await service.listEvents({
      principal: owner,
      runId: started.body.run_id,
      afterSeq: 0,
      limit: 100,
    });
    expect(events.events.at(-1)?.event_type).toBe("budget_exhausted");
  });

  it("expires a durable run without invoking the executor", async () => {
    let current = new Date("2026-07-26T19:00:00.000Z");
    const fake = buildExecutor();
    const { service } = await serviceHarness({
      executor: fake.executor,
      now: () => current,
    });
    const owner = principal();
    const started = await service.startRun({
      principal: owner,
      idempotencyKey: "start-key-expiry",
      request: startRequest({
        budget: {
          max_steps: 2,
          expires_in_seconds: 60,
        },
      }),
    });
    current = new Date("2026-07-26T19:01:01.000Z");
    const expired = await service.continueRun({
      principal: owner,
      runId: started.body.run_id,
      idempotencyKey: "continue-key-expiry",
      request: continueRequest(started.body.version),
    });

    expect(expired.body).toMatchObject({
      lifecycle_status: "failed",
      completion_status: "failed",
      terminal_authority_status: "blocked",
    });
    expect(expired.body.summary).toContain("expired");
    expect(fake.executeTurn).not.toHaveBeenCalled();
  });

  it("cancels durably and exactly replays the cancellation", async () => {
    const { service } = await serviceHarness();
    const owner = principal();
    const started = await service.startRun({
      principal: owner,
      idempotencyKey: "start-key-cancel",
      request: startRequest(),
    });
    const request = {
      expected_version: started.body.version,
      reason: "operator stopped delegated work",
    };
    const cancelled = await service.cancelRun({
      principal: owner,
      runId: started.body.run_id,
      idempotencyKey: "cancel-key-0001",
      request,
    });
    const replay = await service.cancelRun({
      principal: owner,
      runId: started.body.run_id,
      idempotencyKey: "cancel-key-0001",
      request,
    });

    expect(cancelled.body).toMatchObject({
      lifecycle_status: "cancelled",
      completion_status: "cancelled",
      terminal_authority_status: "blocked",
    });
    expect(replay).toEqual({
      status: 200,
      body: cancelled.body,
      idempotencyReplayed: true,
    });
  });

  it("rejects reuse of an idempotency key with different validated input", async () => {
    const { service } = await serviceHarness();
    const owner = principal();
    await service.startRun({
      principal: owner,
      idempotencyKey: "start-key-conflict",
      request: startRequest({ objective: "first" }),
    });
    await expect(
      service.startRun({
        principal: owner,
        idempotencyKey: "start-key-conflict",
        request: startRequest({ objective: "second" }),
      }),
    ).rejects.toBeInstanceOf(HelixAgentApiServiceError);
    await expect(
      service.startRun({
        principal: owner,
        idempotencyKey: "start-key-conflict",
        request: startRequest({ objective: "third" }),
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "idempotency_conflict",
    });
  });
});
