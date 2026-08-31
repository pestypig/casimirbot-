import { newDb } from "pg-mem";
import type { Pool } from "pg";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildDefaultHelixSharedRealtimeRoomConsent,
  type HelixSharedRealtimeRoom,
} from "@shared/helix-shared-realtime-room";
import {
  buildHelixAccountCapabilityPolicy,
  buildHelixSharedRealtimeRoomsExperimentPolicy,
} from "@shared/helix-account-session";
import {
  HELIX_ROOM_SOURCE_BINDING_SCHEMA,
  HELIX_ROOM_SOURCE_INGRESS_SCOPES,
  type HelixRoomSourceBinding,
} from "@shared/helix-room-source-ingress";
import {
  HELIX_SHARED_LIVE_ROOM_CREDENTIAL_DELIVERY_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
  HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
} from "@shared/contracts/helix-shared-live-room-agent.v1";
import { migration026 } from "../../../db/migrations/026_helix_accounts";
import { migration032 } from "../../../db/migrations/032_helix_agent_api";
import { HelixAgentRunStore } from "../../helix-agent-api/run-store";
import {
  SharedLiveRoomControlError,
  SharedLiveRoomControlService,
  type SharedLiveRoomControlActor,
  type SharedLiveRoomControlDependencies,
} from "../service";

const NOW = "2026-07-26T19:00:00.000Z";
const ROOM_ID = "shared_realtime_room:room-001";
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
  vi.unstubAllEnvs();
  await Promise.all(pools.splice(0).map((pool) => pool.end()));
});

const actor = (
  overrides: Partial<SharedLiveRoomControlActor> = {},
): SharedLiveRoomControlActor => ({
  authKind: "external_oauth",
  profileId: "profile-a",
  accountType: "developer",
  accountPolicy: buildHelixAccountCapabilityPolicy("developer"),
  sessionId: "session-a",
  isGuest: false,
  oauthScopes: new Set([
    HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
    HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
    HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
  ]),
  idempotencyOwner: {
    tenantId: "tenant-a",
    issuer: "https://issuer.example",
    subjectId: "subject-a",
    accountProfileId: "profile-a",
  },
  ...overrides,
});

const room = (
  overrides: Partial<HelixSharedRealtimeRoom> = {},
): HelixSharedRealtimeRoom => {
  const profileId = overrides.participants?.[0]?.participant_id
    ? "profile-a"
    : "profile-a";
  const consent = buildDefaultHelixSharedRealtimeRoomConsent();
  return {
    schema: "helix.shared_realtime_room.v1",
    room_id: ROOM_ID,
    title: "Shared world room",
    status: "waiting_for_participant",
    max_participants: 2,
    self_participant_id: `participant:${profileId}`,
    participants: [
      {
        participant_id: `participant:${profileId}`,
        display_name: "Room owner",
        role: "owner",
        presence: "present",
        consent,
        joined_at: NOW,
        last_seen_at: NOW,
      },
    ],
    participant_context_cards: [],
    readiness: {
      participant_count: 1,
      required_participant_count: 2,
      ready: false,
      missing_participant_count: 1,
      missing_consent_by_participant: {},
    },
    runtime: {
      runtime_id: null,
      state: "idle",
      topology: "single_shared_model",
      transport_owner: "unbound",
      model: null,
      active_speaker_participant_id: null,
      provider_session_ref_hash: null,
      realtime_session_ref_hash: null,
      reserved_by_participant_id: null,
      started_at: null,
      updated_at: NOW,
      limitations: [],
    },
    created_at: NOW,
    updated_at: NOW,
    closed_at: null,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    ...overrides,
  };
};

const membership = (overrides: Record<string, unknown> = {}) => ({
  roomId: ROOM_ID,
  profileId: "profile-a",
  participantId: "participant:profile-a",
  displayName: "Room owner",
  role: "owner" as const,
  presence: "present" as const,
  consent: buildDefaultHelixSharedRealtimeRoomConsent(),
  roomStatus: "waiting_for_participant" as const,
  ...overrides,
});

const sourceBinding = (
  overrides: Partial<HelixRoomSourceBinding> = {},
): HelixRoomSourceBinding => ({
  schema: HELIX_ROOM_SOURCE_BINDING_SCHEMA,
  binding_id: "room_source_binding:binding-001",
  room_id: ROOM_ID,
  owner_profile_id: "profile-a-private",
  source_id: "source:room-ingress:source-001",
  world_id: "minecraft:world-001",
  domain_adapter: "minecraft",
  source_label: "Minehut test world",
  scopes: [...HELIX_ROOM_SOURCE_INGRESS_SCOPES],
  status: "active",
  public_ingress_base_url: "https://rooms.example.test/api/room-source",
  credential_id: "credential-private-001",
  token_prefix: "bearer-prefix-private",
  created_at: NOW,
  updated_at: NOW,
  expires_at: null,
  revoked_at: null,
  last_used_at: null,
  request_count: 0,
  execution_policy: {
    may_execute_live_actions: false,
    may_perform_read_only_probes: true,
  },
  content_role: "source_binding_not_assistant_answer",
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
  ...overrides,
});

type HarnessOverrides = {
  pool?: Pool;
  roomMembership?: ReturnType<typeof membership> | null;
  listedRooms?: HelixSharedRealtimeRoom[];
  listedBindings?: HelixRoomSourceBinding[];
  credentialDelivery?: SharedLiveRoomControlDependencies["credentialDelivery"];
  deferredSourceBindingStore?: SharedLiveRoomControlDependencies["deferredSourceBindingStore"];
  readRuntime?: SharedLiveRoomControlDependencies["readRuntime"];
  readFloor?: SharedLiveRoomControlDependencies["readFloor"];
  releaseFloor?: SharedLiveRoomControlDependencies["releaseFloor"];
  claimFloor?: SharedLiveRoomControlDependencies["claimFloor"];
  afterFloorRelease?: SharedLiveRoomControlDependencies["afterFloorRelease"];
  afterFloorAcquire?: SharedLiveRoomControlDependencies["afterFloorAcquire"];
};

const createHarness = async (overrides: HarnessOverrides = {}) => {
  const pool = overrides.pool ?? (await createPool());
  let roomSequence = 0;
  let deliverySequence = 0;
  const createRoom = vi.fn(
    async (input: { ownerProfileId: string; title?: string | null }) =>
      room({
        room_id: `shared_realtime_room:created-${++roomSequence}`,
        title: input.title ?? "Shared Realtime Room",
        self_participant_id: `participant:${input.ownerProfileId}`,
      }),
  );
  const listRooms = vi.fn(
    async (_input: { profileId: string }) => overrides.listedRooms ?? [room()],
  );
  const readRoom = vi.fn(
    async (_input: { roomId: string; profileId: string }) => room(),
  );
  const readMembership = vi.fn(
    async (_input: { roomId: string; profileId: string }) =>
      overrides.roomMembership === undefined
        ? membership()
        : overrides.roomMembership,
  );
  const listSourceBindings = vi.fn(
    async (_input: { roomId: string; ownerProfileId: string }) =>
      overrides.listedBindings ?? [
        sourceBinding({
          credential_id: null,
          token_prefix: null,
        }),
      ],
  );
  const updatePresence = vi.fn(
    async (input: { roomId: string; profileId: string; presence: "present" | "away" }) =>
      room({
        room_id: input.roomId,
        self_participant_id: `participant:${input.profileId}`,
        participants: [
          {
            ...room().participants[0]!,
            participant_id: `participant:${input.profileId}`,
            presence: input.presence,
          },
        ],
      }),
  );
  const patchConsent = vi.fn(
    async (input: {
      roomId: string;
      profileId: string;
      consentPatch: Record<string, boolean>;
    }) => {
      const current = room();
      return room({
        room_id: input.roomId,
        self_participant_id: `participant:${input.profileId}`,
        participants: [
          {
            ...current.participants[0]!,
            participant_id: `participant:${input.profileId}`,
            consent: {
              ...current.participants[0]!.consent,
              ...input.consentPatch,
              consent_version: current.participants[0]!.consent.consent_version + 1,
              consent_receipt_ref: "consent:test-revoke",
              updated_at: NOW,
            },
          },
        ],
      });
    },
  );
  const deferredSourceBindingStore = overrides.deferredSourceBindingStore ?? {
    createSourceBindingWithoutCredential: vi.fn(async () =>
      sourceBinding({
        credential_id: null,
        token_prefix: null,
      }),
    ),
  };
  const credentialDelivery = overrides.credentialDelivery ?? {
    issue: vi.fn(async () => ({
      schema: HELIX_SHARED_LIVE_ROOM_CREDENTIAL_DELIVERY_SCHEMA,
      claim_handle: `claim_handle_${++deliverySequence}_1234567890`,
      claim_url: "https://rooms.example.test/claims/claim",
      expires_at: "2026-07-26T19:05:00.000Z",
      delivery_status: "pending_claim" as const,
      bearer_included: false as const,
      plugin_config_included: false as const,
      answer_authority: false as const,
      assistant_answer: false as const,
      terminal_eligible: false as const,
      raw_content_included: false as const,
    })),
  };
  const service = new SharedLiveRoomControlService({
    idempotencyStore: new HelixAgentRunStore(pool),
    domainStore: {
      createRoom,
      listRooms,
      readRoom,
      readMembership,
      listSourceBindings,
      updatePresence,
      patchConsent,
    },
    deferredSourceBindingStore,
    credentialDelivery,
    now: () => new Date(NOW),
    guestHostingAllowed: () => true,
    withProfileAdmissionLock: async (_profileId, run) => run(),
    projectRoom: async (value) => value,
    readRuntime: overrides.readRuntime,
    readFloor: overrides.readFloor,
    releaseFloor: overrides.releaseFloor,
    claimFloor: overrides.claimFloor,
    afterFloorRelease: overrides.afterFloorRelease,
    afterFloorAcquire: overrides.afterFloorAcquire,
  });
  return {
    pool,
    service,
    createRoom,
    listRooms,
    readRoom,
    readMembership,
    listSourceBindings,
    updatePresence,
    patchConsent,
    deferredSourceBindingStore,
    credentialDelivery,
  };
};

const expectControlError = async (
  promise: Promise<unknown>,
  status: number,
  code: string,
) => {
  const error = await promise.catch((caught) => caught);
  expect(error).toBeInstanceOf(SharedLiveRoomControlError);
  expect(error).toMatchObject({ status, code });
};

describe("SharedLiveRoomControlService", () => {
  it("sets only the authenticated actor's own room presence", async () => {
    const harness = await createHarness();
    const receipt = await harness.service.setOwnPresence({
      actor: actor(),
      request: { room_id: ROOM_ID, presence: "present" },
    });

    expect(harness.updatePresence).toHaveBeenCalledWith({
      roomId: ROOM_ID,
      profileId: "profile-a",
      presence: "present",
    });
    expect(receipt).toMatchObject({
      schema: "helix.shared_live_room.presence_set_receipt.v1",
      operation: "room.presence.set",
      content_role: "room_control_receipt_not_assistant_answer",
      room: {
        room_id: ROOM_ID,
        self_participant_id: "participant:profile-a",
      },
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  });

  it("idempotently revokes only the authenticated actor's own consent", async () => {
    const harness = await createHarness();
    const request = {
      room_id: ROOM_ID,
      consent: {
        microphone_to_model: false as const,
        screen_to_model: false as const,
      },
    };
    const first = await harness.service.revokeOwnConsent({
      actor: actor(),
      idempotencyKey: "consent-revoke-001",
      request,
    });
    const replay = await harness.service.revokeOwnConsent({
      actor: actor(),
      idempotencyKey: "consent-revoke-001",
      request,
    });

    expect(harness.patchConsent).toHaveBeenCalledTimes(1);
    expect(harness.patchConsent).toHaveBeenCalledWith({
      roomId: ROOM_ID,
      profileId: "profile-a",
      consentPatch: request.consent,
    });
    expect(first).toMatchObject({
      idempotencyReplayed: false,
      body: {
        schema: "helix.shared_live_room.consent_revoke_receipt.v1",
        operation: "room.consent.revoke",
        changed_fields: ["microphone_to_model", "screen_to_model"],
        authority_delta: "reduced_only",
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
      },
    });
    expect(replay).toMatchObject({
      idempotencyReplayed: true,
      body: first.body,
    });
  });

  it("idempotently grants only explicit own-consent fields after adapter delegation", async () => {
    const harness = await createHarness();
    const request = { room_id: ROOM_ID, consent: { microphone_to_model: true as const } };
    const first = await harness.service.grantOwnConsent({ actor: actor(), idempotencyKey: "consent-grant-001", request, delegationRef: "room-delegation:001" });
    const replay = await harness.service.grantOwnConsent({ actor: actor(), idempotencyKey: "consent-grant-001", request, delegationRef: "room-delegation:001" });
    expect(harness.patchConsent).toHaveBeenCalledTimes(1);
    expect(harness.patchConsent).toHaveBeenCalledWith({ roomId: ROOM_ID, profileId: "profile-a", consentPatch: request.consent });
    expect(first).toMatchObject({ idempotencyReplayed: false, body: { operation: "room.consent.grant", changed_fields: ["microphone_to_model"], delegation_ref: "room-delegation:001", authority_delta: "increased_bounded", assistant_answer: false, terminal_eligible: false } });
    expect(replay).toMatchObject({ idempotencyReplayed: true, body: first.body });
  });

  it("routes first-party and delegated floor acquisition through the same claim handler", async () => {
    const claimFloor = vi.fn(() => ({
      ok: true,
      granted: true,
      error: null,
      floor: { participant_id: "participant:profile-a", epoch: 3, acquired_at: NOW, lease_expires_at: "2026-07-26T19:00:30.000Z" },
    })) as unknown as NonNullable<SharedLiveRoomControlDependencies["claimFloor"]>;
    const readRuntime = vi.fn(() => ({ runtime_id: "runtime:001", state: "bridge_active", transport_owner: "room_media_bridge" })) as unknown as NonNullable<SharedLiveRoomControlDependencies["readRuntime"]>;
    const harness = await createHarness({
      claimFloor,
      readRuntime,
      roomMembership: membership({
        consent: {
          ...buildDefaultHelixSharedRealtimeRoomConsent(),
          microphone_to_model: true,
        },
      }),
    });
    const uiRoom = await harness.service.acquireOwnFloorFromFirstPartyUi({ actor: actor({ authKind: "first_party_session" }), request: { room_id: ROOM_ID } });
    expect(uiRoom.room_id).toBe(ROOM_ID);
    const result = await harness.service.acquireOwnFloor({ actor: actor(), idempotencyKey: "floor-acquire-001", request: { room_id: ROOM_ID, lease_ms: 15_000 }, delegationRef: "room-delegation:floor-001" });
    expect(claimFloor).toHaveBeenCalledTimes(2);
    expect(claimFloor).toHaveBeenLastCalledWith(expect.objectContaining({ roomId: ROOM_ID, runtimeId: "runtime:001", participantId: "participant:profile-a", microphoneToModelAuthorized: true, leaseMs: 15_000 }));
    expect(result.body).toMatchObject({ operation: "room.floor.acquire", granted: true, delegation_ref: "room-delegation:floor-001", authority_delta: "increased_bounded", terminal_eligible: false });
  });

  it("rejects consent grants before calling the room domain handler", async () => {
    const harness = await createHarness();
    await expectControlError(
      harness.service.revokeOwnConsent({
        actor: actor(),
        idempotencyKey: "consent-grant-blocked-001",
        request: {
          room_id: ROOM_ID,
          consent: { microphone_to_model: true },
        },
      }),
      400,
      "invalid_request",
    );
    expect(harness.patchConsent).not.toHaveBeenCalled();
  });

  it("inspects an exact floor epoch and releases only the actor's matching floor", async () => {
    const floor = {
      participant_id: "participant:profile-a",
      epoch: 7,
      acquired_at: NOW,
      lease_expires_at: "2026-07-26T19:00:30.000Z",
    };
    const readFloor = vi.fn(() => floor);
    const releaseFloor = vi.fn(() => ({
      ok: true as const,
      error: null,
      released: true,
      floor: {
        participant_id: null,
        epoch: 7,
        acquired_at: null,
        lease_expires_at: null,
      },
      runtime: room().runtime,
    }));
    const afterFloorRelease = vi.fn();
    const harness = await createHarness({
      readRuntime: vi.fn(() => ({
        ...room().runtime,
        runtime_id: "shared_room_runtime:runtime-001",
        state: "host_transport_active",
      })),
      readFloor,
      releaseFloor: releaseFloor as SharedLiveRoomControlDependencies["releaseFloor"],
      afterFloorRelease,
    });

    const inspected = await harness.service.inspectFloor({
      actor: actor(),
      roomId: ROOM_ID,
    });
    const released = await harness.service.releaseOwnFloor({
      actor: actor(),
      request: { room_id: ROOM_ID, floor_epoch: inspected.floor?.epoch },
    });

    expect(inspected).toMatchObject({
      operation: "room.floor.inspect",
      room_id: ROOM_ID,
      floor: { participant_id: "participant:profile-a", epoch: 7 },
      answer_authority: false,
      terminal_eligible: false,
    });
    expect(releaseFloor).toHaveBeenCalledWith({
      roomId: ROOM_ID,
      runtimeId: "shared_room_runtime:runtime-001",
      participantId: "participant:profile-a",
      epoch: 7,
    });
    expect(afterFloorRelease).toHaveBeenCalledTimes(1);
    expect(released).toMatchObject({
      operation: "room.floor.release",
      released: true,
      requested_floor_epoch: 7,
      floor: { participant_id: null, epoch: 7 },
      authority_delta: "reduced_only",
      assistant_answer: false,
      terminal_eligible: false,
    });
  });

  it("lists and inspects only the authenticated actor's rooms as observations", async () => {
    const harness = await createHarness();
    const externalActor = actor();

    const listed = await harness.service.listRooms({ actor: externalActor });
    const inspected = await harness.service.inspectRoom({
      actor: externalActor,
      roomId: ROOM_ID,
    });

    expect(harness.listRooms).toHaveBeenCalledWith({
      profileId: "profile-a",
    });
    expect(harness.readRoom).toHaveBeenCalledWith({
      roomId: ROOM_ID,
      profileId: "profile-a",
    });
    expect(listed).toMatchObject({
      operation: "room.list",
      reentry_required: true,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(inspected).toMatchObject({
      operation: "room.inspect",
      room: { room_id: ROOM_ID },
      answer_authority: false,
      terminal_eligible: false,
    });
  });

  it("rejects protected mutable input and redacts legacy room/source projections", async () => {
    const sourceBearer = "helix_room_src_control_projection_secret_123456";
    const harness = await createHarness({
      listedRooms: [room({ title: sourceBearer })],
      listedBindings: [
        sourceBinding({
          source_label: sourceBearer,
          world_id: `minecraft:${sourceBearer}`,
        }),
      ],
    });

    const listedRooms = await harness.service.listRooms({ actor: actor() });
    const listedSources = await harness.service.listSourceBindings({
      actor: actor(),
      roomId: ROOM_ID,
    });
    const projection = JSON.stringify({ listedRooms, listedSources });
    expect(projection).not.toContain(sourceBearer);
    expect(projection).toContain("[REDACTED_SECRET]");

    await expectControlError(
      harness.service.createRoom({
        actor: actor(),
        idempotencyKey: "protected-room-input",
        request: { title: sourceBearer },
      }),
      400,
      "protected_sensitive_content_rejected",
    );
    await expectControlError(
      harness.service.createSourceBinding({
        actor: actor(),
        roomId: ROOM_ID,
        idempotencyKey: "protected-source-input",
        request: { source_label: sourceBearer },
      }),
      400,
      "protected_sensitive_content_rejected",
    );
    expect(harness.createRoom).not.toHaveBeenCalled();
    expect(
      harness.deferredSourceBindingStore?.createSourceBindingWithoutCredential,
    ).not.toHaveBeenCalled();
  });

  it("fails invalid identifiers and missing external OAuth scopes as typed errors", async () => {
    const harness = await createHarness();
    await expectControlError(
      harness.service.inspectRoom({
        actor: actor(),
        roomId: "../another-room",
      }),
      400,
      "invalid_request",
    );
    const scopeError = await harness.service
      .listRooms({
        actor: actor({ oauthScopes: new Set() }),
      })
      .catch((caught) => caught);
    expect(scopeError).toBeInstanceOf(SharedLiveRoomControlError);
    expect(scopeError).toMatchObject({
      status: 403,
      code: "insufficient_scope",
      details: {
        required_scope: HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
        required_oauth_scopes: [HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      },
    });
    expect(harness.readRoom).not.toHaveBeenCalled();
  });

  it("durably replays room creation and isolates keys by the full Agent owner tuple", async () => {
    const harness = await createHarness();
    const owner = actor();
    const first = await harness.service.createRoom({
      actor: owner,
      idempotencyKey: "room-create-key-0001",
      request: { title: "Build room" },
    });
    const replay = await harness.service.createRoom({
      actor: owner,
      idempotencyKey: "room-create-key-0001",
      request: { title: "Build room" },
    });

    expect(replay).toEqual({
      status: 201,
      body: first.body,
      idempotencyReplayed: true,
    });
    expect(harness.createRoom).toHaveBeenCalledTimes(1);
    await expectControlError(
      harness.service.createRoom({
        actor: owner,
        idempotencyKey: "room-create-key-0001",
        request: { title: "Different room" },
      }),
      409,
      "idempotency_conflict",
    );

    const otherOwner = actor({
      profileId: "profile-b",
      idempotencyOwner: {
        ...owner.idempotencyOwner,
        subjectId: "subject-b",
        accountProfileId: "profile-b",
      },
    });
    const isolated = await harness.service.createRoom({
      actor: otherOwner,
      idempotencyKey: "room-create-key-0001",
      request: { title: "Build room" },
    });
    expect(isolated.idempotencyReplayed).toBe(false);
    expect(harness.createRoom).toHaveBeenCalledTimes(2);
  });

  it("enforces account locks and bounded guest hosting before room creation", async () => {
    const harness = await createHarness({
      listedRooms: [room({ status: "active" })],
    });
    await expectControlError(
      harness.service.createRoom({
        actor: actor({
          accountType: "user",
          accountPolicy: buildHelixAccountCapabilityPolicy("user"),
        }),
        idempotencyKey: "room-create-key-0002",
        request: {},
      }),
      403,
      "account_policy_blocked",
    );
    await expectControlError(
      harness.service.createRoom({
        actor: actor({
          authKind: "first_party_session",
          accountType: "user",
          accountPolicy: buildHelixSharedRealtimeRoomsExperimentPolicy("user"),
          isGuest: true,
          oauthScopes: new Set(),
        }),
        idempotencyKey: "room-create-key-0003",
        request: {},
      }),
      409,
      "room_runtime_conflict",
    );
    expect(harness.createRoom).not.toHaveBeenCalled();
  });

  it("keeps source management policy-and-owner scoped with outsider privacy", async () => {
    const participantHarness = await createHarness({
      roomMembership: membership({ role: "participant" }),
    });
    await expectControlError(
      participantHarness.service.listSourceBindings({
        actor: actor(),
        roomId: ROOM_ID,
      }),
      403,
      "source_binding_forbidden",
    );
    const outsiderHarness = await createHarness({ roomMembership: null });
    await expectControlError(
      outsiderHarness.service.listSourceBindings({
        actor: actor(),
        roomId: ROOM_ID,
      }),
      404,
      "room_not_found",
    );
    const userHarness = await createHarness();
    await expectControlError(
      userHarness.service.listSourceBindings({
        actor: actor({
          accountType: "user",
          accountPolicy: buildHelixSharedRealtimeRoomsExperimentPolicy("user"),
        }),
        roomId: ROOM_ID,
      }),
      403,
      "source_binding_forbidden",
    );
  });

  it("admits first-party public users and caps temporary guest source credentials", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("HELIX_PUBLIC_ROOMS_EXPERIMENT", "1");
    vi.stubEnv("HELIX_GUEST_ROOM_CREATION", "1");
    const harness = await createHarness({ listedBindings: [] });
    const publicUserPolicy = buildHelixSharedRealtimeRoomsExperimentPolicy("user");
    publicUserPolicy.feature_flags.push("room_source_ingress");
    publicUserPolicy.locked_features = publicUserPolicy.locked_features.filter(
      (feature) => feature !== "room_source_ingress",
    );
    await expect(
      harness.service.listSourceBindings({
        actor: actor({
          authKind: "first_party_session",
          accountType: "user",
          accountPolicy: publicUserPolicy,
          isGuest: false,
          oauthScopes: new Set(),
        }),
        roomId: ROOM_ID,
      }),
    ).resolves.toMatchObject({ bindings: [] });

    const guestPolicy = buildHelixSharedRealtimeRoomsExperimentPolicy("user");
    guestPolicy.feature_flags.push("room_source_ingress");
    guestPolicy.locked_features = guestPolicy.locked_features.filter(
      (feature) => feature !== "room_source_ingress",
    );
    const guestActor = actor({
      authKind: "first_party_session",
      accountType: "user",
      accountPolicy: guestPolicy,
      isGuest: true,
      oauthScopes: new Set(),
    });

    await expect(
      harness.service.listSourceBindings({
        actor: guestActor,
        roomId: ROOM_ID,
      }),
    ).resolves.toMatchObject({ bindings: [] });

    await harness.service.createSourceBinding({
      actor: guestActor,
      roomId: ROOM_ID,
      idempotencyKey: "guest-source-create-key-0001",
      request: {
        world_id: "minecraft:paper-local-test",
        domain_adapter: "minecraft.paper_plugin.v1",
        ttl_ms: 30 * 24 * 60 * 60 * 1_000,
      },
    });
    expect(harness.credentialDelivery?.issue).toHaveBeenCalledWith(
      expect.objectContaining({
        credentialTtlMs: 24 * 60 * 60 * 1_000,
      }),
    );

    await expectControlError(
      harness.service.listSourceBindings({
        actor: {
          ...guestActor,
          authKind: "external_oauth",
          isGuest: true,
          oauthScopes: new Set([
            HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
          ]),
        },
        roomId: ROOM_ID,
      }),
      403,
      "source_binding_forbidden",
    );
  });

  it("creates source identity without a bearer and replays with a fresh pending secure claim", async () => {
    const harness = await createHarness();
    const created = await harness.service.createSourceBinding({
      actor: actor(),
      roomId: ROOM_ID,
      idempotencyKey: "source-create-key-0001",
      request: {
        world_id: "minecraft:world-001",
        domain_adapter: "minecraft",
        source_label: "Minehut test world",
      },
    });
    const replay = await harness.service.createSourceBinding({
      actor: actor(),
      roomId: ROOM_ID,
      idempotencyKey: "source-create-key-0001",
      request: {
        world_id: "minecraft:world-001",
        domain_adapter: "minecraft",
        source_label: "Minehut test world",
      },
    });

    expect(
      harness.deferredSourceBindingStore?.createSourceBindingWithoutCredential,
    ).toHaveBeenCalledTimes(1);
    expect(harness.credentialDelivery?.issue).toHaveBeenCalledTimes(2);
    expect(created.body).toMatchObject({
      operation: "room.source.create",
      room_id: ROOM_ID,
      binding: {
        status: "pending_credential_claim",
        execution_policy: {
          may_execute_live_actions: false,
          may_perform_read_only_probes: true,
        },
        answer_authority: false,
        terminal_eligible: false,
      },
      credential_delivery: {
        delivery_status: "pending_claim",
        bearer_included: false,
        plugin_config_included: false,
        raw_content_included: false,
      },
      execution_enabled: false,
      command_execution_enabled: false,
      answer_authority: false,
      terminal_eligible: false,
    });
    expect(replay).toMatchObject({
      status: 201,
      body: {
        operation: "room.source.create",
        binding: {
          binding_id: created.body.binding.binding_id,
          status: "pending_credential_claim",
        },
        credential_delivery: {
          delivery_status: "pending_claim",
        },
      },
      idempotencyReplayed: true,
    });
    expect(replay.body.credential_delivery.claim_handle).not.toBe(
      created.body.credential_delivery.claim_handle,
    );
    const serialized = JSON.stringify(created.body);
    expect(serialized).not.toContain("profile-a-private");
    expect(serialized).not.toContain("credential-private-001");
    expect(serialized).not.toContain("bearer-prefix-private");
    expect(serialized).not.toContain("bearer_token");
    expect(created.body.credential_delivery).not.toHaveProperty(
      "plugin_config",
    );
    const persisted = await harness.pool.query<{
      response_receipt: Record<string, unknown> | string;
    }>(
      `
        SELECT response_receipt
        FROM helix_agent_api_requests
        WHERE operation = $1;
      `,
      [`room.source.create:${ROOM_ID}`],
    );
    const durableReceipt =
      typeof persisted.rows[0].response_receipt === "string"
        ? JSON.parse(persisted.rows[0].response_receipt)
        : persisted.rows[0].response_receipt;
    const durableSerialized = JSON.stringify(durableReceipt);
    expect(durableSerialized).not.toContain(
      created.body.credential_delivery.claim_handle,
    );
    expect(durableSerialized).not.toContain(
      replay.body.credential_delivery.claim_handle,
    );
    expect(durableSerialized).not.toContain("claim_handle");
    expect(durableReceipt).toMatchObject({
      operation: "room.source.create",
      durable_resource: {
        room_id: ROOM_ID,
        binding_id: created.body.binding.binding_id,
        credential_delivery_handle_persisted: false,
      },
    });
  });

  it("does not replay a consumed claim handle after the source credential is active", async () => {
    const harness = await createHarness({
      listedBindings: [
        sourceBinding({
          credential_id: "room_source_credential:claimed-001",
          token_prefix: "claimed-prefix-private",
          expires_at: "2026-07-27T19:00:00.000Z",
        }),
      ],
    });
    const request = {
      world_id: "minecraft:world-001",
      domain_adapter: "minecraft",
      source_label: "Minehut test world",
    };
    const created = await harness.service.createSourceBinding({
      actor: actor(),
      roomId: ROOM_ID,
      idempotencyKey: "source-create-key-claimed-0001",
      request,
    });

    const replayError = await harness.service
      .createSourceBinding({
        actor: actor(),
        roomId: ROOM_ID,
        idempotencyKey: "source-create-key-claimed-0001",
        request,
      })
      .catch((caught) => caught);

    expect(replayError).toBeInstanceOf(SharedLiveRoomControlError);
    expect(replayError).toMatchObject({
      status: 409,
      code: "credential_delivery_unavailable",
      retryable: false,
      details: {
        binding_id: "room_source_binding:binding-001",
        delivery_status: "claimed",
        recovery_action: "rotate_source_credential",
      },
    });
    expect(harness.credentialDelivery?.issue).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(replayError)).not.toContain(
      created.body.credential_delivery.claim_handle,
    );
    const persisted = await harness.pool.query<{
      response_receipt: Record<string, unknown> | string;
    }>(
      `
        SELECT response_receipt
        FROM helix_agent_api_requests
        WHERE operation = $1;
      `,
      [`room.source.create:${ROOM_ID}`],
    );
    expect(JSON.stringify(persisted.rows[0].response_receipt)).not.toContain(
      created.body.credential_delivery.claim_handle,
    );
  });

  it("replaces an expired unclaimed delivery instead of replaying its stale handle", async () => {
    let issueCount = 0;
    const credentialDelivery = {
      issue: vi.fn(async () => {
        issueCount += 1;
        return {
          schema: HELIX_SHARED_LIVE_ROOM_CREDENTIAL_DELIVERY_SCHEMA,
          claim_handle: `expired_replay_claim_${issueCount}_1234567890`,
          claim_url: "https://rooms.example.test/claims/claim",
          expires_at:
            issueCount === 1
              ? "2026-07-26T18:59:00.000Z"
              : "2026-07-26T19:05:00.000Z",
          delivery_status: "pending_claim" as const,
          bearer_included: false as const,
          plugin_config_included: false as const,
          answer_authority: false as const,
          assistant_answer: false as const,
          terminal_eligible: false as const,
          raw_content_included: false as const,
        };
      }),
    };
    const harness = await createHarness({ credentialDelivery });
    const request = {
      world_id: "minecraft:world-001",
      domain_adapter: "minecraft",
    };
    const created = await harness.service.createSourceBinding({
      actor: actor(),
      roomId: ROOM_ID,
      idempotencyKey: "source-create-key-expired-0001",
      request,
    });
    const replay = await harness.service.createSourceBinding({
      actor: actor(),
      roomId: ROOM_ID,
      idempotencyKey: "source-create-key-expired-0001",
      request,
    });

    expect(created.body.credential_delivery.expires_at).toBe(
      "2026-07-26T18:59:00.000Z",
    );
    expect(replay.body.credential_delivery).toMatchObject({
      claim_handle: "expired_replay_claim_2_1234567890",
      expires_at: "2026-07-26T19:05:00.000Z",
      delivery_status: "pending_claim",
    });
    expect(replay.body.credential_delivery.claim_handle).not.toBe(
      created.body.credential_delivery.claim_handle,
    );
    const persisted = await harness.pool.query<{
      response_receipt: Record<string, unknown> | string;
    }>(
      `
        SELECT response_receipt
        FROM helix_agent_api_requests
        WHERE operation = $1;
      `,
      [`room.source.create:${ROOM_ID}`],
    );
    const serialized = JSON.stringify(persisted.rows[0].response_receipt);
    expect(serialized).not.toContain(
      created.body.credential_delivery.claim_handle,
    );
    expect(serialized).not.toContain(
      replay.body.credential_delivery.claim_handle,
    );
  });

  it("fails closed before source mutation when secure delivery is unavailable", async () => {
    const harness = await createHarness({
      credentialDelivery: undefined,
      deferredSourceBindingStore: undefined,
    });
    const service = new SharedLiveRoomControlService({
      idempotencyStore: new HelixAgentRunStore(harness.pool),
      domainStore: {
        createRoom: harness.createRoom,
        listRooms: harness.listRooms,
        readRoom: harness.readRoom,
        readMembership: harness.readMembership,
        listSourceBindings: harness.listSourceBindings,
      },
      now: () => new Date(NOW),
      projectRoom: async (value) => value,
    });

    await expectControlError(
      service.createSourceBinding({
        actor: actor(),
        roomId: ROOM_ID,
        idempotencyKey: "source-create-key-0002",
        request: {},
      }),
      503,
      "credential_delivery_unavailable",
    );
    expect(harness.readMembership).not.toHaveBeenCalled();
  });

  it("rejects a credential descriptor that attempts to smuggle a bearer", async () => {
    const harness = await createHarness({
      credentialDelivery: {
        issue: vi.fn(
          async () =>
            ({
              schema: HELIX_SHARED_LIVE_ROOM_CREDENTIAL_DELIVERY_SCHEMA,
              claim_handle: "claim_handle_1234567890",
              claim_url:
                "https://rooms.example.test/claims/claim_handle_1234567890",
              expires_at: "2026-07-26T19:05:00.000Z",
              delivery_status: "pending_claim",
              bearer_included: false,
              plugin_config_included: false,
              answer_authority: false,
              assistant_answer: false,
              terminal_eligible: false,
              raw_content_included: false,
              bearer_token: "must-not-cross-agent-boundary",
            }) as never,
        ),
      },
    });
    await expectControlError(
      harness.service.createSourceBinding({
        actor: actor(),
        roomId: ROOM_ID,
        idempotencyKey: "source-create-key-0003",
        request: {},
      }),
      503,
      "credential_delivery_invalid",
    );
  });
});
