import { newDb } from "pg-mem";
import type { Pool } from "pg";
import { afterEach, describe, expect, it } from "vitest";
import { migration023 } from "../../../db/migrations/023_chat_sessions";
import { migration026 } from "../../../db/migrations/026_helix_accounts";
import { migration030 } from "../../../db/migrations/030_shared_realtime_rooms";
import { migration031 } from "../../../db/migrations/031_room_source_ingress";
import { migration032 } from "../../../db/migrations/032_helix_agent_api";
import { migration034 } from "../../../db/migrations/034_shared_live_room_agent_bindings";
import type { HelixAgentRunOwner } from "../../helix-agent-api/run-store";
import {
  SharedLiveRoomBindingStore,
  SharedLiveRoomBindingStoreError,
  type SharedLiveRoomChatContextSnapshot,
} from "../binding-store";

const NOW = "2026-07-26T20:00:00.000Z";
const OWNER_PROFILE_ID = "profile:observer-owner";
const OTHER_PROFILE_ID = "profile:other";
const CHAT_ID = "chat:selected";
const RUN_ID = "agent_run:observer";
const ROOM_ID = "shared_realtime_room:observer";
const SOURCE_BINDING_ID = "room_source_binding:observer";
const CONSENT_VERSION = 4;
const CONSENT_RECEIPT_REF = "room-consent:observer-owner:4";
const pools: Pool[] = [];

const owner = (
  overrides: Partial<HelixAgentRunOwner> = {},
): HelixAgentRunOwner => ({
  tenantId: "tenant:observer",
  issuer: "https://issuer.example",
  subjectId: "subject:observer",
  accountProfileId: OWNER_PROFILE_ID,
  ...overrides,
});

const createPool = async (): Promise<Pool> => {
  const memory = newDb({ autoCreateForeignKeyIndices: true });
  const adapter = memory.adapters.createPg();
  const pool = new adapter.Pool() as unknown as Pool;
  const client = await pool.connect();
  try {
    const context = { enablePgvector: false };
    await migration023.run(client, context);
    await migration026.run(client, context);
    await migration030.run(client, context);
    await migration031.run(client, context);
    await migration032.run(client, context);
    await migration034.run(client, context);
  } finally {
    client.release();
  }
  pools.push(pool);
  return pool;
};

const seedBase = async (pool: Pool): Promise<void> => {
  await pool.query(
    `
      INSERT INTO helix_accounts (
        profile_id, display_name, account_type, provider, created_at, updated_at
      ) VALUES
        ($1, 'Observer owner', 'developer', 'local', $3, $3),
        ($2, 'Other profile', 'developer', 'local', $3, $3);
    `,
    [OWNER_PROFILE_ID, OTHER_PROFILE_ID, NOW],
  );
  await pool.query(
    `
      INSERT INTO agi_chat_sessions (
        id, owner_id, persona_id, title, messages_json, message_count,
        messages_hash, created_at, updated_at
      ) VALUES ($1, $2, 'helix', 'Selected chat', '[]'::jsonb, 0, 'empty', $3, $3);
    `,
    [CHAT_ID, OWNER_PROFILE_ID, NOW],
  );
  await pool.query(
    `
      INSERT INTO helix_shared_realtime_rooms (
        room_id, owner_profile_id, title, status, created_at, updated_at
      ) VALUES ($1, $2, 'Observer room', 'ready', $3, $3);
    `,
    [ROOM_ID, OWNER_PROFILE_ID, NOW],
  );
  await pool.query(
    `
      INSERT INTO helix_shared_realtime_room_members (
        room_id, slot_number, profile_id, participant_id, member_role,
        presence, consent, joined_at, last_seen_at, updated_at
      ) VALUES (
        $1, 1, $2, 'participant:observer-owner', 'owner', 'present',
        $4::jsonb, $3, $3, $3
      );
    `,
    [
      ROOM_ID,
      OWNER_PROFILE_ID,
      NOW,
      JSON.stringify({
        consent_version: CONSENT_VERSION,
        consent_receipt_ref: CONSENT_RECEIPT_REF,
      }),
    ],
  );
  await pool.query(
    `
      INSERT INTO helix_agent_runs (
        run_id, schema_version, tenant_id, issuer, subject_id,
        account_profile_id, objective, objective_hash, runtime_provider,
        provider_goal_id, provider_thread_id, provider_session_id,
        lifecycle_status, completion_status, terminal_authority_status,
        version, configuration, evidence_bundle, runtime_snapshot,
        latest_result, latest_summary, unresolved_requirements,
        contradictions, pending_questions, max_steps, steps_used,
        active_operation_id, operation_started_at, expires_at, created_at,
        updated_at, completed_at, cancelled_at
      ) VALUES (
        $1, 'v1', $2, $3, $4, $5, 'Observe the selected room',
        'sha256:objective', 'helix-ask', 'goal:observer', 'thread:observer',
        'session:observer', 'waiting', 'needs_more_evidence',
        'not_evaluated', 1, '{}'::jsonb, $6::jsonb, NULL, NULL, NULL,
        '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, 8, 0, NULL, NULL, $7,
        $8, $8, NULL, NULL
      );
    `,
    [
      RUN_ID,
      owner().tenantId,
      owner().issuer,
      owner().subjectId,
      OWNER_PROFILE_ID,
      JSON.stringify({
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
      "2026-07-27T20:00:00.000Z",
      NOW,
    ],
  );
  await pool.query(
    `
      INSERT INTO helix_room_source_bindings (
        binding_id, room_id, owner_profile_id, source_id, world_id,
        domain_adapter, source_label, scopes, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, 'source:room-ingress:observer',
        'minecraft:minehut:observer', 'minecraft.paper_plugin.v1',
        'Observer source', '["environment.read"]'::jsonb, 'active', $4, $4
      );
    `,
    [SOURCE_BINDING_ID, ROOM_ID, OWNER_PROFILE_ID, NOW],
  );
};

const contextSnapshot = (): SharedLiveRoomChatContextSnapshot => ({
  schema: "helix.agent_run_chat_context_snapshot.v1",
  messages: [
    {
      role: "user",
      content: "Please observe the room.",
      at: NOW,
    },
  ],
  captured_at: NOW,
  context_role: "non_authoritative_conversation_context",
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

afterEach(async () => {
  await Promise.all(pools.splice(0).map((pool) => pool.end()));
});

describe("SharedLiveRoomBindingStore", () => {
  it("durably binds an exact run owner to one current room membership", async () => {
    const pool = await createPool();
    await seedBase(pool);
    const store = new SharedLiveRoomBindingStore(pool);

    const first = await store.bindRunToRoom({
      owner: owner(),
      runId: RUN_ID,
      roomId: ROOM_ID,
      now: NOW,
    });
    const replay = await store.bindRunToRoom({
      owner: owner(),
      runId: RUN_ID,
      roomId: ROOM_ID,
      now: "2026-07-26T20:01:00.000Z",
    });
    expect(replay).toEqual(first);
    expect(first).toMatchObject({
      runId: RUN_ID,
      roomId: ROOM_ID,
      owner: owner(),
      participantIdAtBind: "participant:observer-owner",
      memberRoleAtBind: "owner",
      consentVersionAtBind: CONSENT_VERSION,
      consentReceiptRefAtBind: CONSENT_RECEIPT_REF,
      status: "active",
    });
    expect(
      await store.getActiveRunRoomBinding({
        owner: owner(),
        runId: RUN_ID,
      }),
    ).toEqual(first);
    expect(
      await store.getActiveRunRoomBinding({
        owner: owner({ issuer: "https://wrong-issuer.example" }),
        runId: RUN_ID,
      }),
    ).toBeNull();
  });

  it("creates a browser-first opaque chat claim and consumes it exactly once for the exact run owner", async () => {
    const pool = await createPool();
    await seedBase(pool);
    const store = new SharedLiveRoomBindingStore(pool);
    const pending = await store.createPendingChatBinding({
      browserProfileId: OWNER_PROFILE_ID,
      chatSessionId: CHAT_ID,
      contextSnapshot: contextSnapshot(),
      now: NOW,
    });

    expect(pending.binding).toMatchObject({
      browserProfileId: OWNER_PROFILE_ID,
      chatSessionId: CHAT_ID,
      runId: null,
      owner: null,
      status: "pending_claim",
      contextMessageCount: 1,
    });
    expect(pending.claimHandle).toMatch(/^agent_chat_claim_/);
    const persisted = await pool.query<{
      claim_handle_hash: string;
      context_snapshot_ref: string;
    }>(
      `
        SELECT claim_handle_hash, context_snapshot_ref
        FROM helix_agent_run_chat_bindings
        WHERE binding_id = $1;
      `,
      [pending.binding.bindingId],
    );
    expect(persisted.rows[0].claim_handle_hash).not.toContain(
      pending.claimHandle,
    );
    expect(persisted.rows[0].context_snapshot_ref).toMatch(
      /^agent-chat-context:sha256:/,
    );

    await expect(
      store.claimPendingChatBinding({
        owner: owner({ accountProfileId: OTHER_PROFILE_ID }),
        runId: RUN_ID,
        claimHandle: pending.claimHandle,
        now: NOW,
      }),
    ).rejects.toMatchObject({
      code: "chat_binding_not_found",
      statusCode: 404,
    });

    const active = await store.claimPendingChatBinding({
      owner: owner(),
      runId: RUN_ID,
      claimHandle: pending.claimHandle,
      now: NOW,
    });
    expect(active).toMatchObject({
      bindingId: pending.binding.bindingId,
      runId: RUN_ID,
      owner: owner(),
      status: "active",
    });
    expect(
      await store.getActiveRunChatBinding({ owner: owner(), runId: RUN_ID }),
    ).toMatchObject({ bindingId: pending.binding.bindingId });
    expect(
      await store.getActiveRunChatBinding({
        owner: owner({ subjectId: "subject:wrong" }),
        runId: RUN_ID,
      }),
    ).toBeNull();
    await expect(
      store.claimPendingChatBinding({
        owner: owner(),
        runId: RUN_ID,
        claimHandle: pending.claimHandle,
        now: NOW,
      }),
    ).rejects.toMatchObject({
      code: "chat_binding_not_claimable",
      statusCode: 409,
    });
  });

  it("lets the exact external owner withdraw and replace active run-room and claimed-chat bindings", async () => {
    const pool = await createPool();
    await seedBase(pool);
    const store = new SharedLiveRoomBindingStore(pool);
    const room = await store.bindRunToRoom({
      owner: owner(),
      runId: RUN_ID,
      roomId: ROOM_ID,
      now: NOW,
    });
    const pending = await store.createPendingChatBinding({
      browserProfileId: OWNER_PROFILE_ID,
      chatSessionId: CHAT_ID,
      now: NOW,
    });
    const chat = await store.claimPendingChatBinding({
      owner: owner(),
      runId: RUN_ID,
      claimHandle: pending.claimHandle,
      now: NOW,
    });

    for (const attempt of [
      () =>
        store.revokeRunRoomBindingForOwner({
          owner: owner({ subjectId: "subject:other" }),
          bindingRef: room.bindingId,
          now: "2026-07-26T20:01:00.000Z",
        }),
      () =>
        store.revokeClaimedRunChatBindingForOwner({
          owner: owner({ accountProfileId: OTHER_PROFILE_ID }),
          bindingRef: chat.bindingId,
          now: "2026-07-26T20:01:00.000Z",
        }),
    ]) {
      await expect(attempt()).rejects.toMatchObject({
        statusCode: 404,
      });
    }

    const revokedRoom = await store.revokeRunRoomBindingForOwner({
      owner: owner(),
      bindingRef: room.bindingId,
      now: "2026-07-26T20:01:00.000Z",
    });
    expect(revokedRoom).toMatchObject({
      revocationStatus: "revoked",
      binding: {
        bindingId: room.bindingId,
        status: "revoked",
        version: 2,
        revokedAt: "2026-07-26T20:01:00.000Z",
        revokeReason: "external_agent_owner_revoked_run_room_binding",
      },
    });
    const revokedChat = await store.revokeClaimedRunChatBindingForOwner({
      owner: owner(),
      bindingRef: chat.bindingId,
      now: "2026-07-26T20:01:00.000Z",
    });
    expect(revokedChat).toMatchObject({
      revocationStatus: "revoked",
      binding: {
        bindingId: chat.bindingId,
        status: "revoked",
        revokedAt: "2026-07-26T20:01:00.000Z",
        revokeReason: "external_agent_owner_revoked_run_chat_binding",
      },
    });
    expect(
      await store.getActiveRunRoomBinding({
        owner: owner(),
        runId: RUN_ID,
      }),
    ).toBeNull();
    expect(
      await store.getActiveRunChatBinding({
        owner: owner(),
        runId: RUN_ID,
      }),
    ).toBeNull();
    await expect(
      store.projectAuthorizedTerminalMessage({
        browserProfileId: OWNER_PROFILE_ID,
        bindingRef: chat.bindingId,
        now: "2026-07-26T20:01:01.000Z",
      }),
    ).rejects.toMatchObject({
      code: "chat_binding_not_claimable",
      statusCode: 410,
    });

    expect(
      await store.revokeRunRoomBindingForOwner({
        owner: owner(),
        bindingRef: room.bindingId,
        now: "2026-07-26T20:02:00.000Z",
      }),
    ).toEqual({
      ...revokedRoom,
      revocationStatus: "already_revoked",
    });
    expect(
      await store.revokeClaimedRunChatBindingForOwner({
        owner: owner(),
        bindingRef: chat.bindingId,
        now: "2026-07-26T20:02:00.000Z",
      }),
    ).toEqual({
      ...revokedChat,
      revocationStatus: "already_revoked",
    });

    const replacementRoom = await store.bindRunToRoom({
      owner: owner(),
      runId: RUN_ID,
      roomId: ROOM_ID,
      now: "2026-07-26T20:02:00.000Z",
    });
    expect(replacementRoom).toMatchObject({
      status: "active",
      runId: RUN_ID,
      roomId: ROOM_ID,
    });
    expect(replacementRoom.bindingId).not.toBe(room.bindingId);

    const replacementPending = await store.createPendingChatBinding({
      browserProfileId: OWNER_PROFILE_ID,
      chatSessionId: CHAT_ID,
      now: "2026-07-26T20:02:00.000Z",
    });
    const replacementChat = await store.claimPendingChatBinding({
      owner: owner(),
      runId: RUN_ID,
      claimHandle: replacementPending.claimHandle,
      now: "2026-07-26T20:02:00.000Z",
    });
    expect(replacementChat).toMatchObject({
      status: "active",
      runId: RUN_ID,
    });
    expect(replacementChat.bindingId).not.toBe(chat.bindingId);
  });

  it("lets only the exact browser owner withdraw pending or active chat bindings idempotently", async () => {
    const pool = await createPool();
    await seedBase(pool);
    const store = new SharedLiveRoomBindingStore(pool);
    const pending = await store.createPendingChatBinding({
      browserProfileId: OWNER_PROFILE_ID,
      chatSessionId: CHAT_ID,
      now: NOW,
    });

    await expect(
      store.revokeObserverBinding({
        browserProfileId: OTHER_PROFILE_ID,
        bindingRef: pending.binding.bindingId,
        now: "2026-07-26T20:01:00.000Z",
      }),
    ).rejects.toMatchObject({
      code: "chat_binding_not_found",
      statusCode: 404,
    });

    const revokedPending = await store.revokeObserverBinding({
      browserProfileId: OWNER_PROFILE_ID,
      bindingRef: pending.binding.bindingId,
      now: "2026-07-26T20:01:00.000Z",
    });
    expect(revokedPending).toMatchObject({
      bindingId: pending.binding.bindingId,
      browserProfileId: OWNER_PROFILE_ID,
      runId: null,
      status: "revoked",
      revokedAt: "2026-07-26T20:01:00.000Z",
      revokeReason: "browser_owner_disconnected_observer_binding",
    });
    expect(
      await store.revokeObserverBinding({
        browserProfileId: OWNER_PROFILE_ID,
        bindingRef: pending.binding.bindingId,
        now: "2026-07-26T20:02:00.000Z",
      }),
    ).toEqual(revokedPending);
    await expect(
      store.claimPendingChatBinding({
        owner: owner(),
        runId: RUN_ID,
        claimHandle: pending.claimHandle,
        now: "2026-07-26T20:02:00.000Z",
      }),
    ).rejects.toMatchObject({
      code: "chat_binding_not_claimable",
      statusCode: 409,
    });
    await expect(
      store.projectAuthorizedTerminalMessage({
        browserProfileId: OWNER_PROFILE_ID,
        bindingRef: pending.binding.bindingId,
        now: "2026-07-26T20:02:00.000Z",
      }),
    ).rejects.toMatchObject({
      code: "chat_binding_not_claimable",
      statusCode: 410,
    });

    const claimed = await store.createPendingChatBinding({
      browserProfileId: OWNER_PROFILE_ID,
      chatSessionId: CHAT_ID,
      now: "2026-07-26T20:02:00.000Z",
    });
    await store.claimPendingChatBinding({
      owner: owner(),
      runId: RUN_ID,
      claimHandle: claimed.claimHandle,
      now: "2026-07-26T20:02:00.000Z",
    });
    const revokedActive = await store.revokeObserverBinding({
      browserProfileId: OWNER_PROFILE_ID,
      bindingRef: claimed.binding.bindingId,
      now: "2026-07-26T20:03:00.000Z",
    });
    expect(revokedActive).toMatchObject({
      bindingId: claimed.binding.bindingId,
      runId: RUN_ID,
      status: "revoked",
      revokedAt: "2026-07-26T20:03:00.000Z",
      revokeReason: "browser_owner_disconnected_observer_binding",
    });
    expect(
      await store.getActiveRunChatBinding({
        owner: owner(),
        runId: RUN_ID,
      }),
    ).toBeNull();
    await expect(
      store.claimPendingChatBinding({
        owner: owner(),
        runId: RUN_ID,
        claimHandle: claimed.claimHandle,
        now: "2026-07-26T20:03:00.000Z",
      }),
    ).rejects.toMatchObject({
      code: "chat_binding_not_claimable",
      statusCode: 409,
    });
    await expect(
      store.projectAuthorizedTerminalMessage({
        browserProfileId: OWNER_PROFILE_ID,
        bindingRef: claimed.binding.bindingId,
        now: "2026-07-26T20:03:00.000Z",
      }),
    ).rejects.toMatchObject({
      code: "chat_binding_not_claimable",
      statusCode: 410,
    });
    const projections = await pool.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM helix_agent_chat_terminal_projections;
      `,
    );
    expect(Number(projections.rows[0].count)).toBe(0);
  });

  it("sanitizes after-sequence observer events and persists one exact canonical terminal projection", async () => {
    const pool = await createPool();
    await seedBase(pool);
    const store = new SharedLiveRoomBindingStore(pool);
    const pending = await store.createPendingChatBinding({
      browserProfileId: OWNER_PROFILE_ID,
      chatSessionId: CHAT_ID,
      now: NOW,
    });
    await store.claimPendingChatBinding({
      owner: owner(),
      runId: RUN_ID,
      claimHandle: pending.claimHandle,
      now: NOW,
    });
    expect(
      await store.getObserverBinding({
        browserProfileId: OTHER_PROFILE_ID,
        bindingRef: pending.binding.bindingId,
      }),
    ).toBeNull();
    await expect(
      store.listObserverEvents({
        browserProfileId: OTHER_PROFILE_ID,
        bindingRef: pending.binding.bindingId,
        afterSeq: 0,
        limit: 10,
      }),
    ).rejects.toMatchObject({
      code: "chat_binding_not_found",
      statusCode: 404,
    });
    await expect(
      store.projectAuthorizedTerminalMessage({
        browserProfileId: OTHER_PROFILE_ID,
        bindingRef: pending.binding.bindingId,
        now: NOW,
      }),
    ).rejects.toMatchObject({
      code: "chat_binding_not_found",
      statusCode: 404,
    });
    await pool.query(
      `
        INSERT INTO helix_agent_api_events (
          seq, event_id, run_id, event_type, payload, created_at
        ) VALUES
          (
            1, 'event:continuation', $1, 'continuation_received',
            '{"version":2,"steps_used":1,"operation_ref":"private-operation","secret":"do-not-forward"}'::jsonb,
            $2
          ),
          (
            2, 'event:evidence', $1, 'evidence_reentered',
            '{"version":2,"observation_refs":["observation:one"],"evidence_refs":["evidence:one"],"receipt_refs":["receipt:one","helix_room_src_observer_status_secret_123456"],"raw_provider_payload":"do-not-forward"}'::jsonb,
            $2
          );
      `,
      [RUN_ID, NOW],
    );

    const page = await store.listObserverEvents({
      browserProfileId: OWNER_PROFILE_ID,
      bindingRef: pending.binding.bindingId,
      afterSeq: 1,
      limit: 10,
    });
    expect(page.nextAfterSeq).toBe(2);
    expect(page.events).toHaveLength(1);
    expect(page.events[0]).toMatchObject({
      seq: 2,
      event_type: "evidence_reentered",
      payload: {
        version: 2,
        observation_ref_count: 1,
        evidence_ref_count: 1,
        receipt_ref_count: 2,
        status_rows: [
          {
            kind: "observation",
            status: "reentered",
            status_ref: expect.stringMatching(
              /^observer-observation:sha256:[a-f0-9]{64}$/,
            ),
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          },
          {
            kind: "evidence",
            status: "reentered",
            status_ref: expect.stringMatching(
              /^observer-evidence:sha256:[a-f0-9]{64}$/,
            ),
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          },
          {
            kind: "receipt",
            status: "reentered",
            status_ref: expect.stringMatching(
              /^observer-receipt:sha256:[a-f0-9]{64}$/,
            ),
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          },
        ],
      },
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(JSON.stringify(page.events[0])).not.toContain("do-not-forward");
    expect(JSON.stringify(page.events[0])).not.toContain("evidence:one");
    expect(JSON.stringify(page.events[0])).not.toContain("receipt:one");
    expect(JSON.stringify(page.events[0])).not.toContain(
      "helix_room_src_observer_status_secret_123456",
    );

    const eventSecret = "helix_room_src_observer_event_secret";
    await pool.query(
      `
        INSERT INTO helix_agent_api_events (
          seq, event_id, run_id, event_type, payload, created_at
        ) VALUES (
          4, 'event:failed-redaction', $1, 'run_failed',
          $2::jsonb, $3
        );
      `,
      [
        RUN_ID,
        JSON.stringify({
          version: 3,
          lifecycle_status: "failed",
          completion_status: "failed",
          failure_code: eventSecret,
        }),
        NOW,
      ],
    );
    const redactedPage = await store.listObserverEvents({
      browserProfileId: OWNER_PROFILE_ID,
      bindingRef: pending.binding.bindingId,
      afterSeq: 2,
      limit: 10,
    });
    expect(redactedPage.events).toHaveLength(1);
    expect(redactedPage.events[0].payload).toMatchObject({
      failure_code: "[REDACTED_SECRET]",
    });
    expect(JSON.stringify(redactedPage)).not.toContain(eventSecret);

    await pool.query(
      `
        INSERT INTO helix_agent_api_events (
          seq, event_id, run_id, event_type, payload, created_at
        ) VALUES (
          5, 'event:input', $1, 'input_requested',
          '{"version":3,"questions":["private question prose"],"provider_payload":"do-not-forward"}'::jsonb,
          $2
        );
      `,
      [RUN_ID, NOW],
    );
    const inputPage = await store.listObserverEvents({
      browserProfileId: OWNER_PROFILE_ID,
      bindingRef: pending.binding.bindingId,
      afterSeq: 4,
      limit: 10,
    });
    expect(inputPage.events).toHaveLength(1);
    expect(inputPage.events[0]).toMatchObject({
      seq: 5,
      event_type: "input_requested",
      payload: {
        version: 3,
        question_count: 1,
        pending_input: true,
      },
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(JSON.stringify(inputPage)).not.toContain("private question prose");
    expect(JSON.stringify(inputPage)).not.toContain("do-not-forward");

    const terminalText = "\nCanonical verified room answer.\n";
    const authorityRef = "terminal-authority:observer";
    await pool.query(
      `
        UPDATE helix_agent_runs
        SET lifecycle_status = 'completed',
            completion_status = 'completed',
            terminal_authority_status = 'authorized',
            version = 3,
            evidence_bundle = $2::jsonb,
            latest_result = $3::jsonb,
            updated_at = $4,
            completed_at = $4
        WHERE run_id = $1;
      `,
      [
        RUN_ID,
        JSON.stringify({
          schema: "helix.agent_run.evidence_bundle.v1",
          run_id: RUN_ID,
          observation_refs: [],
          evidence_refs: ["evidence:one"],
          receipt_refs: [],
          provider_terminal_candidate_ref: authorityRef,
          claims_supported: [],
          claims_contradicted: [],
          unresolved_requirements: [],
          terminal_authority_status: "authorized",
          answer_authority: false,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        }),
        JSON.stringify({
          ok: true,
          terminal_authority_status: "authorized",
          terminal_authority_reason: "canonical_terminal_authority_verified",
          terminal_authority_ref: authorityRef,
          failure_code: null,
          terminal_product: {
            authority_ref: authorityRef,
            artifact_kind: "helix.ask.answer.v1",
            text: terminalText,
            supporting_evidence_refs: ["evidence:one"],
          },
        }),
        "2026-07-26T20:01:00.000Z",
      ],
    );
    await pool.query(
      `
        INSERT INTO helix_agent_api_events (
          seq, event_id, run_id, event_type, payload, created_at
        ) VALUES (
          3, 'event:completed', $1, 'run_completed',
          '{"version":999,"lifecycle_status":"completed","completion_status":"completed","secret":"do-not-forward"}'::jsonb,
          $2
        );
      `,
      [RUN_ID, "2026-07-26T20:01:00.000Z"],
    );

    expect(
      await store.projectAuthorizedTerminalMessage({
        browserProfileId: OWNER_PROFILE_ID,
        bindingRef: pending.binding.bindingId,
        now: "2026-07-26T20:01:00.500Z",
      }),
    ).toBeNull();
    await pool.query(
      `
        UPDATE helix_agent_api_events
        SET payload =
          '{"version":3,"lifecycle_status":"completed","completion_status":"completed","secret":"do-not-forward"}'::jsonb
        WHERE event_id = 'event:completed';
      `,
    );
    const first = await store.projectAuthorizedTerminalMessage({
      browserProfileId: OWNER_PROFILE_ID,
      bindingRef: pending.binding.bindingId,
      now: "2026-07-26T20:01:01.000Z",
    });
    const replay = await store.projectAuthorizedTerminalMessage({
      browserProfileId: OWNER_PROFILE_ID,
      bindingRef: pending.binding.bindingId,
      now: "2026-07-26T20:02:00.000Z",
    });
    expect(first).not.toBeNull();
    expect(first?.content).toBe(terminalText);
    expect(replay).toEqual(first);
    const projections = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM helix_agent_chat_terminal_projections;`,
    );
    expect(Number(projections.rows[0].count)).toBe(1);

    const sourceBearer = "helix_room_src_legacy_terminal_secret_123456";
    await pool.query(
      `
        DELETE FROM helix_agent_chat_terminal_projections
        WHERE binding_id = $1;
      `,
      [pending.binding.bindingId],
    );
    await pool.query(
      `
        UPDATE helix_agent_runs
        SET latest_result = $2::jsonb
        WHERE run_id = $1;
      `,
      [
        RUN_ID,
        JSON.stringify({
          ok: true,
          terminal_authority_status: "authorized",
          terminal_authority_reason: "canonical_terminal_authority_verified",
          terminal_authority_ref: authorityRef,
          failure_code: null,
          terminal_product: {
            authority_ref: authorityRef,
            artifact_kind: "helix.ask.answer.v1",
            text: `Unsafe legacy answer ${sourceBearer}`,
            supporting_evidence_refs: ["evidence:one"],
          },
        }),
      ],
    );
    await expect(
      store.projectAuthorizedTerminalMessage({
        browserProfileId: OWNER_PROFILE_ID,
        bindingRef: pending.binding.bindingId,
        now: "2026-07-26T20:03:00.000Z",
      }),
    ).rejects.toMatchObject({
      code: "terminal_projection_sensitive_content_rejected",
      statusCode: 422,
    });
    const rejectedProjections = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM helix_agent_chat_terminal_projections;`,
    );
    expect(Number(rejectedProjections.rows[0].count)).toBe(0);
  });

  it("keeps credential delivery pending until an exact owner claim atomically persists the credential", async () => {
    const pool = await createPool();
    await seedBase(pool);
    const store = new SharedLiveRoomBindingStore(pool);
    const issued = await store.createCredentialDeliveryHandle({
      bindingId: SOURCE_BINDING_ID,
      ownerProfileId: OWNER_PROFILE_ID,
      purpose: "create",
      credentialTtlMs: 123_456,
      handleTtlMs: 120_000,
      now: NOW,
    });
    expect(issued.delivery).toMatchObject({
      bindingId: SOURCE_BINDING_ID,
      ownerProfileId: OWNER_PROFILE_ID,
      credentialTtlMs: 123_456,
      status: "pending",
    });
    const rawHandleRows = await pool.query<{
      handle_hash: string;
      credential_ttl_ms: string;
    }>(
      `
        SELECT handle_hash, credential_ttl_ms
        FROM helix_room_source_credential_deliveries
        WHERE delivery_id = $1;
      `,
      [issued.delivery.deliveryId],
    );
    expect(rawHandleRows.rows[0].handle_hash).not.toContain(
      issued.deliveryHandle,
    );
    expect(Number(rawHandleRows.rows[0].credential_ttl_ms)).toBe(123_456);

    await expect(
      store.claimCredentialDeliveryHandle({
        ownerProfileId: OTHER_PROFILE_ID,
        deliveryHandle: issued.deliveryHandle,
        consume: async () => undefined,
        now: NOW,
      }),
    ).rejects.toMatchObject({
      code: "credential_delivery_not_found",
      statusCode: 404,
    });

    await expect(
      store.claimCredentialDeliveryHandle({
        ownerProfileId: OWNER_PROFILE_ID,
        deliveryHandle: issued.deliveryHandle,
        now: NOW,
        consume: async () => {
          throw new Error("issuer failed before claim commit");
        },
      }),
    ).rejects.toThrow("issuer failed before claim commit");
    const afterFailure = await pool.query<{ status: string }>(
      `
        SELECT status
        FROM helix_room_source_credential_deliveries
        WHERE delivery_id = $1;
      `,
      [issued.delivery.deliveryId],
    );
    expect(afterFailure.rows[0].status).toBe("pending");

    const claimed = await store.claimCredentialDeliveryHandle({
      ownerProfileId: OWNER_PROFILE_ID,
      deliveryHandle: issued.deliveryHandle,
      now: NOW,
      consume: async (claim, client) => {
        expect(claim).toMatchObject({
          bindingId: SOURCE_BINDING_ID,
          roomId: ROOM_ID,
          sourceId: "source:room-ingress:observer",
          ownerProfileId: OWNER_PROFILE_ID,
          credentialTtlMs: 123_456,
        });
        await client.query(
          `
            INSERT INTO helix_room_source_credentials (
              credential_id, binding_id, token_hash, token_prefix,
              status, created_at, expires_at
            ) VALUES (
              'credential:committed', $1, 'hash:committed',
              'prefix:committed', 'active', $2, $3
            );
          `,
          [
            claim.bindingId,
            claim.claimedAt,
            new Date(
              new Date(claim.claimedAt).getTime() + claim.credentialTtlMs,
            ).toISOString(),
          ],
        );
      },
    });
    expect(claimed.status).toBe("claimed");
    expect(claimed).not.toHaveProperty("token");
    expect(claimed).not.toHaveProperty("bearer");
    await expect(
      store.claimCredentialDeliveryHandle({
        ownerProfileId: OWNER_PROFILE_ID,
        deliveryHandle: issued.deliveryHandle,
        consume: async () => undefined,
        now: NOW,
      }),
    ).rejects.toMatchObject({
      code: "credential_delivery_not_claimable",
      statusCode: 409,
    });
    await expect(
      store.createCredentialDeliveryHandle({
        bindingId: SOURCE_BINDING_ID,
        ownerProfileId: OWNER_PROFILE_ID,
        purpose: "create",
        credentialTtlMs: 123_456,
        now: NOW,
      }),
    ).rejects.toMatchObject({
      code: "credential_delivery_not_claimable",
      statusCode: 409,
    });

    const rotate = await store.createCredentialDeliveryHandle({
      bindingId: SOURCE_BINDING_ID,
      ownerProfileId: OWNER_PROFILE_ID,
      purpose: "rotate",
      credentialTtlMs: 654_321,
      now: NOW,
    });
    await pool.query(
      `
        UPDATE helix_shared_realtime_rooms
        SET status = 'closed', closed_at = $2, updated_at = $2
        WHERE room_id = $1;
      `,
      [ROOM_ID, "2026-07-26T20:02:00.000Z"],
    );
    let consumedAfterClose = false;
    await expect(
      store.claimCredentialDeliveryHandle({
        ownerProfileId: OWNER_PROFILE_ID,
        deliveryHandle: rotate.deliveryHandle,
        now: "2026-07-26T20:02:01.000Z",
        consume: async () => {
          consumedAfterClose = true;
        },
      }),
    ).rejects.toMatchObject({
      code: "source_binding_closed",
      statusCode: 410,
    });
    expect(consumedAfterClose).toBe(false);
  });

  it("refuses chat selection owned by another profile without revealing it", async () => {
    const pool = await createPool();
    await seedBase(pool);
    await pool.query(
      `UPDATE agi_chat_sessions SET owner_id = $2 WHERE id = $1;`,
      [CHAT_ID, OTHER_PROFILE_ID],
    );
    const store = new SharedLiveRoomBindingStore(pool);
    const error = await store
      .createPendingChatBinding({
        browserProfileId: OWNER_PROFILE_ID,
        chatSessionId: CHAT_ID,
        now: NOW,
      })
      .catch((caught) => caught);
    expect(error).toBeInstanceOf(SharedLiveRoomBindingStoreError);
    expect(error).toMatchObject({
      code: "chat_session_owner_mismatch",
      statusCode: 404,
    });
  });
});
