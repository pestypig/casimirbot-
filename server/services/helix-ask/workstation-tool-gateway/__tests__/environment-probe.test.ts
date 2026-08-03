import { describe, expect, it, vi } from "vitest";
import { buildHelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import { HELIX_SHARED_LIVE_ROOM_READ_SCOPE } from "@shared/contracts/helix-shared-live-room-agent.v1";
import {
  HELIX_ENVIRONMENT_ADAPTER_ADMISSION_SCHEMA,
  type HelixEnvironmentAdapterAdmissionProjection,
} from "@shared/helix-environment-adapter-profile";
import {
  HELIX_ENVIRONMENT_CATALOG_SNAPSHOT_SCHEMA,
  HELIX_ENVIRONMENT_PROBE_OBSERVATION_SCHEMA,
  HELIX_MINECRAFT_INVENTORY_CHECK_CAPABILITY,
  HELIX_MINECRAFT_LINE_OF_SIGHT_CHECK_CAPABILITY,
  HELIX_MINECRAFT_SITUATION_CAPABILITY_IDS,
  helixEnvironmentCatalogSnapshotSchema,
  type HelixEnvironmentProbeObservation,
} from "@shared/helix-environment-connector";
import {
  HELIX_ROOM_SOURCE_ADMISSION_SCHEMA,
  type HelixRoomSourceAdmission,
} from "@shared/helix-room-source-ingress";
import {
  HELIX_SHARED_REALTIME_ROOM_SCHEMA,
  type HelixSharedRealtimeRoom,
} from "@shared/helix-shared-realtime-room";
import type { SharedLiveRoomRunRoomBinding } from "../../../shared-live-room-control/binding-store";
import { readEnvironmentConnectorCapabilityDescriptor } from "../../../environment-connectors/catalog";
import { RoomEnvironmentSubjectError } from "../../../environment-connectors/subjects";
import { resolveEnvironmentAdapterProfile } from "../../../situation-room/environment-adapter-registry";
import type { SharedRealtimeRoomMembership } from "../../realtime-room/room-store";
import type { HelixExternalCapabilityPolicy } from "../../runtime/external-capability-policy";
import type { HelixWorkstationGatewayAccountContext } from "../account-policy";
import {
  environmentProbeMinecraftInventoryManifest,
  environmentProbeMinecraftManifests,
  executeEnvironmentProbeGatewayCapability,
  type EnvironmentProbeGatewayDependencies,
} from "../environment-probe";
import type { BoundRoomEvidenceSourceCandidate } from "../bound-room-evidence";

const NOW = new Date("2026-07-27T12:00:00.000Z");
const RUN_ID = "agent_run:environment-probe";
const TURN_ID = "ask:environment-probe:turn-1";
const ROOM_ID = "shared_realtime_room:environment-probe";
const SOURCE_ID = "source:room-ingress:environment-probe";
const SOURCE_BINDING_ID = "room_source_binding:environment-probe";
const CREDENTIAL_ID = "room_source_credential:environment-probe";
const TOOL_CALL_ID = "codex_tool_call:environment-probe";
const adapterRecord = resolveEnvironmentAdapterProfile({
  domainAdapter: "minecraft.minehut.v1",
  worldId: "minecraft:minehut:environment-probe",
});
const descriptor = readEnvironmentConnectorCapabilityDescriptor(
  HELIX_MINECRAFT_INVENTORY_CHECK_CAPABILITY,
)!;

const adapterAdmission: HelixEnvironmentAdapterAdmissionProjection = {
  schema: HELIX_ENVIRONMENT_ADAPTER_ADMISSION_SCHEMA,
  admission_id: "environment_adapter_admission:environment-probe",
  adapter_profile_id: adapterRecord.profile.profile_id,
  adapter_profile_version: adapterRecord.profile.profile_version,
  adapter_contract_hash: adapterRecord.contract_hash,
  manifest_id: "manifest:environment-probe",
  manifest_hash: `sha256:${"a".repeat(64)}`,
  producer_epoch_ref: "adapter_epoch:environment-probe",
  source_family: adapterRecord.profile.source_family,
  mechanics_collection_ids: adapterRecord.profile.mechanics_collections.map(
    (entry) => entry.collection_id,
  ),
  admitted_at: "2026-07-27T11:59:30.000Z",
  content_role: "adapter_admission_not_assistant_answer",
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
};

const consent = {
  schema: "helix.shared_realtime_room.consent.v1" as const,
  microphone_to_room: false,
  microphone_to_model: false,
  transcript_to_room: false,
  screen_to_model: false,
  screen_thumbnail_to_room: false,
  model_audio_output: false,
  consent_version: 3,
  consent_receipt_ref: "room-consent:environment-probe:3",
  updated_at: "2026-07-27T11:30:00.000Z",
};

const runBinding: SharedLiveRoomRunRoomBinding = {
  bindingId: "run_room_binding:environment-probe",
  runId: RUN_ID,
  owner: {
    tenantId: "tenant:environment-probe",
    issuer: "https://issuer.example.test",
    subjectId: "subject:environment-probe",
    accountProfileId: "profile:environment-probe",
  },
  roomId: ROOM_ID,
  authorizedByProfileId: "profile:environment-probe",
  participantIdAtBind: "participant:environment-probe",
  memberRoleAtBind: "owner",
  consentVersionAtBind: consent.consent_version,
  consentReceiptRefAtBind: consent.consent_receipt_ref,
  status: "active",
  version: 1,
  createdAt: "2026-07-27T11:00:00.000Z",
  updatedAt: "2026-07-27T11:00:00.000Z",
  revokedAt: null,
  revokeReason: null,
};

const membership: SharedRealtimeRoomMembership = {
  roomId: ROOM_ID,
  profileId: "profile:environment-probe",
  participantId: "participant:environment-probe",
  displayName: "Operator",
  role: "owner",
  presence: "present",
  consent,
  roomStatus: "active",
};

const room: HelixSharedRealtimeRoom = {
  schema: HELIX_SHARED_REALTIME_ROOM_SCHEMA,
  room_id: ROOM_ID,
  title: "Environment probe room",
  status: "active",
  max_participants: 2,
  self_participant_id: "participant:environment-probe",
  participants: [
    {
      participant_id: "participant:environment-probe",
      display_name: "Operator",
      role: "owner",
      presence: "present",
      consent,
      joined_at: "2026-07-27T11:00:00.000Z",
      last_seen_at: "2026-07-27T11:59:59.000Z",
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
    updated_at: "2026-07-27T11:59:59.000Z",
    limitations: [],
  },
  created_at: "2026-07-27T11:00:00.000Z",
  updated_at: "2026-07-27T11:59:59.000Z",
  closed_at: null,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
};

const sourceAdmission: HelixRoomSourceAdmission = {
  schema: HELIX_ROOM_SOURCE_ADMISSION_SCHEMA,
  transport: "room_source_ingress",
  binding_id: SOURCE_BINDING_ID,
  request_id: "room_source_request:projected",
  room_id: ROOM_ID,
  source_id: SOURCE_ID,
  world_id: "minecraft:minehut:environment-probe",
  domain_adapter: "minecraft.minehut.v1",
  adapter_admission: adapterAdmission,
  evidence_refs: [
    SOURCE_BINDING_ID,
    adapterAdmission.admission_id,
    adapterAdmission.adapter_contract_hash,
  ],
  content_role: "source_admission_not_assistant_answer",
  reentry_required: true,
  model_invoked: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
};

const sourceCandidate: BoundRoomEvidenceSourceCandidate = {
  bindingId: SOURCE_BINDING_ID,
  ownerProfileId: "profile:environment-probe",
  credentialId: CREDENTIAL_ID,
  roomId: ROOM_ID,
  sourceId: SOURCE_ID,
  worldId: sourceAdmission.world_id,
  domainAdapter: sourceAdmission.domain_adapter,
  requestProjectionId: sourceAdmission.request_id,
  requestSentAt: "2026-07-27T11:59:57.000Z",
  requestReceivedAt: "2026-07-27T11:59:58.000Z",
  adapterAdmission,
  sourceFamily: adapterRecord.profile.source_family,
  domain: adapterRecord.profile.domain,
  requestFreshnessMaxAgeMs:
    adapterRecord.profile.freshness.ingress_request_max_age_ms,
  freshnessMaxAgeMs:
    adapterRecord.profile.freshness.observation_max_age_ms,
  mechanicsCollectionIds: adapterAdmission.mechanics_collection_ids,
  admission: sourceAdmission,
};

const policy = (): HelixExternalCapabilityPolicy => ({
  runId: RUN_ID,
  tenantId: "tenant:environment-probe",
  issuer: "https://issuer.example.test",
  subjectId: "subject:environment-probe",
  accountProfileId: "profile:environment-probe",
  accountType: "developer",
  oauthScopes: new Set([HELIX_SHARED_LIVE_ROOM_READ_SCOPE]),
  accountPolicy: buildHelixAccountCapabilityPolicy("developer"),
  allowedCapabilities: [HELIX_MINECRAFT_INVENTORY_CHECK_CAPABILITY],
  readOnly: true,
  deadlineAt: "2026-07-27T12:00:15.000Z",
});

const firstPartyAccountContext =
  (): HelixWorkstationGatewayAccountContext => {
    const basePolicy = buildHelixAccountCapabilityPolicy("user");
    const accountPolicy = {
      ...basePolicy,
      feature_flags: Array.from(new Set([
        ...basePolicy.feature_flags,
        "shared_realtime_rooms",
        "room_source_ingress",
      ])),
      locked_features: basePolicy.locked_features.filter(
        (entry) =>
          entry !== "shared_realtime_rooms" &&
          entry !== "room_source_ingress",
      ),
      allowed_workstation_capabilities: Array.from(new Set([
        ...basePolicy.allowed_workstation_capabilities,
        HELIX_MINECRAFT_INVENTORY_CHECK_CAPABILITY,
      ])),
    };
    const accountSession = {
      schema: "helix.account_session.v1" as const,
      session_id: "account_session:first-party-environment-probe",
      profile: {
        profile_id: "profile:environment-probe",
        display_name: "Guest Operator",
        auth_mode: "guest" as const,
        account_type: "user" as const,
        provider: "guest" as const,
        created_at: "2026-07-27T11:00:00.000Z",
        updated_at: "2026-07-27T11:59:59.000Z",
      },
      account_policy: accountPolicy,
      status: "active" as const,
      memory_scope: "session_only" as const,
      created_at: "2026-07-27T11:00:00.000Z",
      updated_at: "2026-07-27T11:59:59.000Z",
      expires_at: "2026-07-28T11:00:00.000Z",
    };
    return {
      session_id: accountSession.session_id,
      profile_id: accountSession.profile.profile_id,
      trusted_account_session: true,
      account_session: accountSession,
      account_policy: accountPolicy,
    };
  };

const observation: HelixEnvironmentProbeObservation = {
  schema: HELIX_ENVIRONMENT_PROBE_OBSERVATION_SCHEMA,
  probe_request_ref: "environment_probe_request:environment-probe",
  probe_attempt_ref: "environment_probe_attempt:environment-probe",
  capability_id: HELIX_MINECRAFT_INVENTORY_CHECK_CAPABILITY,
  capability_version: 1,
  outcome: "succeeded",
  summary: "The bound actor has four inventory stacks.",
  result: {
    result_summary: "The bound actor has four inventory stacks.",
    item_count: 4,
    slots: [],
  },
  evidence_ref: "environment_probe_evidence:environment-probe",
  observed_at: NOW.toISOString(),
  freshness_age_ms: 0,
  provenance_valid: true,
  eligible_for_current_turn_reentry: true,
  late_result_disposition: null,
  content_role: "environment_probe_observation_not_assistant_answer",
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
};

const dependencies = (
  overrides: Partial<EnvironmentProbeGatewayDependencies> = {},
): Partial<EnvironmentProbeGatewayDependencies> => ({
  bindingStore: {
    getActiveRunRoomBinding: async () => runBinding,
  },
  readMembership: async () => membership,
  readRoom: async () => room,
  listSourceCandidates: async () => [sourceCandidate],
  listActiveConnectors: async () => [],
  resolveSubject: async () => null,
  materializeConnector: async () => ({
    packageVersionId: "connector_package_version:environment-probe",
    installationId: "connector_installation:environment-probe",
    deviceId: "connector_device:environment-probe",
    environmentBindingId: "environment_binding:environment-probe",
    catalogSnapshot: helixEnvironmentCatalogSnapshotSchema.parse({
      schema: HELIX_ENVIRONMENT_CATALOG_SNAPSHOT_SCHEMA,
      catalog_snapshot_id: "environment_catalog_snapshot:environment-probe",
      catalog_hash: `sha256:${"b".repeat(64)}`,
      environment_binding_ref: "environment_binding:environment-probe",
      connector_installation_ref: "connector_installation:environment-probe",
      device_ref: "connector_device:environment-probe",
      adapter_profile_id: adapterAdmission.adapter_profile_id,
      adapter_profile_version: adapterAdmission.adapter_profile_version,
      adapter_contract_hash: adapterAdmission.adapter_contract_hash,
      manifest_hash: adapterAdmission.manifest_hash,
      capability_descriptors: [descriptor],
      frozen_at: "2026-07-27T11:59:59.000Z",
      expires_at: null,
      content_role: "server_owned_capability_catalog",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    }),
  }),
  dispatchProbe: async () => ({
    requestId: observation.probe_request_ref,
    replayed: false,
  }),
  awaitProbe: async () => observation,
  now: () => NOW,
  ...overrides,
});

describe("environment probe workstation gateway", () => {
  it("advertises a semantic, read-only, nonterminal capability", () => {
    expect(environmentProbeMinecraftInventoryManifest).toMatchObject({
      capability_id: HELIX_MINECRAFT_INVENTORY_CHECK_CAPABILITY,
      action_id: "room.environment.probe",
      mode: "read",
      mutating: false,
      shell_access: false,
      code_mutation: false,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      input_schema: {
        additionalProperties: false,
        required: ["target"],
      },
    });
    expect(
      environmentProbeMinecraftManifests.map(
        (manifest) => manifest.capability_id,
      ),
    ).toEqual(HELIX_MINECRAFT_SITUATION_CAPABILITY_IDS);
    for (const manifest of environmentProbeMinecraftManifests) {
      expect(manifest).toMatchObject({
        action_id: "room.environment.probe",
        mode: "read",
        mutating: false,
        shell_access: false,
        code_mutation: false,
        terminal_eligible: false,
        post_tool_model_step_required: true,
      });
      expect(manifest.safety_tags).toEqual(
        expect.arrayContaining([
          "server_derived_environment_identity",
          "command_execution_disabled",
          "current_turn_reentry_required",
        ]),
      );
    }
  });

  it("derives all connector identity server-side and returns only exact re-entry evidence", async () => {
    const materializeConnector = vi.fn(
      dependencies().materializeConnector!,
    );
    const dispatchProbe = vi.fn(dependencies().dispatchProbe!);
    const result = await executeEnvironmentProbeGatewayCapability({
      turnId: TURN_ID,
      toolCallId: TOOL_CALL_ID,
      providerExecutionId: "codex_native_execution:environment-probe",
      arguments: {
        target: "current_actor",
        freshness_requirement_ms: 5_000,
      },
      policy: policy(),
      dependencies: dependencies({
        materializeConnector,
        dispatchProbe,
      }),
    });

    expect(result).toMatchObject({
      ok: true,
      status: "completed",
      observation: {
        schema: HELIX_ENVIRONMENT_PROBE_OBSERVATION_SCHEMA,
        outcome: "succeeded",
        eligible_for_current_turn_reentry: true,
        answer_authority: false,
        terminal_eligible: false,
      },
    });
    expect(materializeConnector).toHaveBeenCalledWith(
      expect.objectContaining({
        credentialId: CREDENTIAL_ID,
        roomSourceBindingId: SOURCE_BINDING_ID,
        roomId: ROOM_ID,
        sourceId: SOURCE_ID,
      }),
    );
    expect(dispatchProbe).toHaveBeenCalledWith(
      expect.objectContaining({
        runId: RUN_ID,
        turnId: TURN_ID,
        toolCallId: TOOL_CALL_ID,
        roomId: ROOM_ID,
        sourceId: SOURCE_ID,
        arguments: {
          target: "current_actor",
          freshness_requirement_ms: 5_000,
        },
      }),
    );
    expect(JSON.stringify(result)).not.toContain(CREDENTIAL_ID);
    expect(JSON.stringify(result)).not.toContain("lease_token");
  });

  it("freezes a verified participant subject while keeping its native id out of model-visible evidence", async () => {
    const subjectNativeId = "123e4567-e89b-12d3-a456-426614174000";
    const resolveSubject = vi.fn(async () => ({
      participantId: membership.participantId,
      subjectBindingId: "environment_subject_binding:operator",
      subjectNativeId,
      subjectRef: "environment_subject:operator",
      subjectLabel: "OperatorPlayer",
      verificationMethod: "self_claim" as const,
      confidence: 0.8,
      producerEpochRef: adapterAdmission.producer_epoch_ref,
    }));
    const dispatchProbe = vi.fn(dependencies().dispatchProbe!);
    const result = await executeEnvironmentProbeGatewayCapability({
      turnId: TURN_ID,
      toolCallId: `${TOOL_CALL_ID}:subject`,
      arguments: { target: "current_actor" },
      policy: policy(),
      dependencies: dependencies({ resolveSubject, dispatchProbe }),
    });

    expect(resolveSubject).toHaveBeenCalledWith({
      membership,
      participantId: membership.participantId,
      environmentBindingId: "environment_binding:environment-probe",
      sourceId: SOURCE_ID,
      worldId: sourceAdmission.world_id,
      producerEpochRef: adapterAdmission.producer_epoch_ref,
    });
    expect(dispatchProbe).toHaveBeenCalledWith(
      expect.objectContaining({
        requestingParticipantId: membership.participantId,
        resolvedSubject: {
          subjectBindingId: "environment_subject_binding:operator",
          subjectNativeId,
        },
        arguments: expect.objectContaining({ target: "current_actor" }),
      }),
    );
    expect(result.ok).toBe(true);
    expect(JSON.stringify(result)).not.toContain(subjectNativeId);
    expect(JSON.stringify(result)).not.toContain("OperatorPlayer");
  });

  it("fails with an actionable typed result when current_actor has no participant binding", async () => {
    const dispatchProbe = vi.fn(dependencies().dispatchProbe!);
    const result = await executeEnvironmentProbeGatewayCapability({
      turnId: TURN_ID,
      toolCallId: `${TOOL_CALL_ID}:binding-required`,
      arguments: { target: "current_actor" },
      policy: policy(),
      dependencies: dependencies({
        resolveSubject: async () => {
          throw new RoomEnvironmentSubjectError(
            "subject_binding_required",
            409,
            "Choose which online player you are in this room before asking about yourself.",
          );
        },
        dispatchProbe,
      }),
    });

    expect(result).toMatchObject({
      ok: false,
      status: "failed",
      error: "subject_binding_required",
    });
    expect(result.summary).toContain("Choose which online player");
    expect(dispatchProbe).not.toHaveBeenCalled();
  });

  it("admits the exact owner-bound first-party Shared GPT Live Room chat", async () => {
    const bindingStore = {
      getActiveRunRoomBinding: vi.fn(async () => {
        throw new Error("external run-room binding must not be used");
      }),
    };
    const dispatchProbe = vi.fn(dependencies().dispatchProbe!);
    const result = await executeEnvironmentProbeGatewayCapability({
      turnId: TURN_ID,
      toolCallId: TOOL_CALL_ID,
      providerExecutionId: "codex_native_execution:first-party-room",
      arguments: {
        target: "current_actor",
        freshness_requirement_ms: 5_000,
      },
      policy: null,
      accountContext: firstPartyAccountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: dependencies({
        bindingStore,
        readRoom: async () => room,
        dispatchProbe,
      }),
    });

    expect(result).toMatchObject({
      ok: true,
      status: "completed",
      observation: {
        outcome: "succeeded",
        eligible_for_current_turn_reentry: true,
        answer_authority: false,
      },
    });
    expect(bindingStore.getActiveRunRoomBinding).not.toHaveBeenCalled();
    expect(dispatchProbe).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "first_party_browser_session",
        ownerProfileId: "profile:environment-probe",
        roomId: ROOM_ID,
        sourceId: SOURCE_ID,
        runId: expect.stringMatching(/^first_party_shared_room:/),
      }),
    );
  });

  it("resolves GPT Live current_actor from the present active speaker", async () => {
    const speakerParticipantId = "participant:environment-probe:guest";
    const speakerRoom: HelixSharedRealtimeRoom = {
      ...room,
      participants: [
        ...room.participants,
        {
          participant_id: speakerParticipantId,
          display_name: "Guest Player",
          role: "participant",
          presence: "present",
          consent,
          joined_at: "2026-07-27T11:30:00.000Z",
          last_seen_at: "2026-07-27T11:59:59.000Z",
        },
      ],
      runtime: {
        ...room.runtime,
        state: "active",
        active_speaker_participant_id: speakerParticipantId,
      },
    };
    const resolveSubject = vi.fn(async () => ({
      participantId: speakerParticipantId,
      subjectBindingId: "environment_subject_binding:guest",
      subjectNativeId: "123e4567-e89b-12d3-a456-426614174001",
      subjectRef: "environment_subject:guest",
      subjectLabel: "GuestPlayer",
      verificationMethod: "self_claim" as const,
      confidence: 0.8,
      producerEpochRef: adapterAdmission.producer_epoch_ref,
    }));
    const dispatchProbe = vi.fn(dependencies().dispatchProbe!);
    const voiceAccountContext = firstPartyAccountContext();
    voiceAccountContext.trusted_turn_actor_context = {
      schema: "helix.realtime_room.turn_actor_context.v1",
      origin: "realtime_voice",
      room_id: ROOM_ID,
      requester_profile_id: "profile:environment-probe",
      realtime_session_id: "realtime:environment-probe",
      participant_id: speakerParticipantId,
      resolution: "resolved",
      resolution_source: "active_speaker_floor",
      captured_at_ms: NOW.getTime(),
    };
    const result = await executeEnvironmentProbeGatewayCapability({
      turnId: TURN_ID,
      toolCallId: `${TOOL_CALL_ID}:speaker`,
      arguments: { target: "current_actor" },
      policy: null,
      accountContext: voiceAccountContext,
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: dependencies({
        readRoom: async () => speakerRoom,
        resolveSubject,
        dispatchProbe,
      }),
    });

    expect(result.ok).toBe(true);
    expect(resolveSubject).toHaveBeenCalledWith(
      expect.objectContaining({ participantId: speakerParticipantId }),
    );
    expect(dispatchProbe).toHaveBeenCalledWith(
      expect.objectContaining({
        requestingParticipantId: speakerParticipantId,
        resolvedSubject: expect.objectContaining({
          subjectBindingId: "environment_subject_binding:guest",
        }),
      }),
    );
  });

  it("keeps typed room current_actor on the authenticated member when another speaker floor lingers", async () => {
    const speakerParticipantId = "participant:environment-probe:guest";
    const speakerRoom: HelixSharedRealtimeRoom = {
      ...room,
      participants: [
        ...room.participants,
        {
          participant_id: speakerParticipantId,
          display_name: "Guest Player",
          role: "participant",
          presence: "present",
          consent,
          joined_at: "2026-07-27T11:30:00.000Z",
          last_seen_at: "2026-07-27T11:59:59.000Z",
        },
      ],
      runtime: {
        ...room.runtime,
        state: "active",
        active_speaker_participant_id: speakerParticipantId,
      },
    };
    const resolveSubject = vi.fn(async () => null);
    const dispatchProbe = vi.fn(dependencies().dispatchProbe!);
    const result = await executeEnvironmentProbeGatewayCapability({
      turnId: `${TURN_ID}:typed`,
      toolCallId: `${TOOL_CALL_ID}:typed`,
      arguments: { target: "current_actor" },
      policy: null,
      accountContext: firstPartyAccountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: dependencies({
        readRoom: async () => speakerRoom,
        resolveSubject,
        dispatchProbe,
      }),
    });

    expect(result.ok).toBe(true);
    expect(resolveSubject).toHaveBeenCalledWith(
      expect.objectContaining({
        participantId: membership.participantId,
      }),
    );
    expect(dispatchProbe).toHaveBeenCalledWith(
      expect.objectContaining({
        requestingParticipantId: membership.participantId,
      }),
    );
  });

  it("fails closed when the frozen GPT Live participant is no longer present", async () => {
    const voiceAccountContext = firstPartyAccountContext();
    voiceAccountContext.trusted_turn_actor_context = {
      schema: "helix.realtime_room.turn_actor_context.v1",
      origin: "realtime_voice",
      room_id: ROOM_ID,
      requester_profile_id: "profile:environment-probe",
      realtime_session_id: "realtime:environment-probe",
      participant_id: "participant:environment-probe:departed",
      resolution: "resolved",
      resolution_source: "active_speaker_floor",
      captured_at_ms: NOW.getTime(),
    };
    const dispatchProbe = vi.fn(dependencies().dispatchProbe!);
    const result = await executeEnvironmentProbeGatewayCapability({
      turnId: `${TURN_ID}:departed-speaker`,
      toolCallId: `${TOOL_CALL_ID}:departed-speaker`,
      arguments: { target: "current_actor" },
      policy: null,
      accountContext: voiceAccountContext,
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: dependencies({ dispatchProbe }),
    });

    expect(result).toMatchObject({
      ok: false,
      error: "permission_revoked",
    });
    expect(result.summary).toContain("speaker identity");
    expect(dispatchProbe).not.toHaveBeenCalled();
  });

  it("admits a present non-owner room member and routes through the owner's connector", async () => {
    const memberParticipantId = "participant:environment-probe:member";
    const memberMembership: SharedRealtimeRoomMembership = {
      ...membership,
      participantId: memberParticipantId,
      role: "participant",
    };
    const memberRoom: HelixSharedRealtimeRoom = {
      ...room,
      self_participant_id: memberParticipantId,
      participants: [
        {
          ...room.participants[0],
          participant_id: memberParticipantId,
          role: "participant",
        },
      ],
    };
    const materializeConnector = vi.fn(
      dependencies().materializeConnector!,
    );
    const result = await executeEnvironmentProbeGatewayCapability({
      turnId: TURN_ID,
      toolCallId: `${TOOL_CALL_ID}:member`,
      arguments: { target: "current_actor" },
      policy: null,
      accountContext: firstPartyAccountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: dependencies({
        readMembership: async () => memberMembership,
        readRoom: async () => memberRoom,
        listSourceCandidates: async () => [{
          ...sourceCandidate,
          ownerProfileId: "profile:room-owner",
        }],
        materializeConnector,
      }),
    });

    expect(result.ok).toBe(true);
    expect(materializeConnector).toHaveBeenCalledWith(
      expect.objectContaining({ ownerProfileId: "profile:room-owner" }),
    );
  });

  it("does not turn an ordinary browser Ask thread into room authority", async () => {
    const dispatchProbe = vi.fn(dependencies().dispatchProbe!);
    const result = await executeEnvironmentProbeGatewayCapability({
      turnId: TURN_ID,
      toolCallId: TOOL_CALL_ID,
      arguments: { target: "current_actor" },
      policy: null,
      accountContext: firstPartyAccountContext(),
      conversationThreadId: "helix-ask:ordinary-chat",
      dependencies: dependencies({ dispatchProbe }),
    });

    expect(result).toMatchObject({
      ok: false,
      error: "permission_revoked",
    });
    expect(result.summary).toContain("exact server-scoped room conversation thread");
    expect(dispatchProbe).not.toHaveBeenCalled();
  });

  it("diagnoses a missing server-resolved first-party account context without exposing identity", async () => {
    const dispatchProbe = vi.fn(dependencies().dispatchProbe!);
    const result = await executeEnvironmentProbeGatewayCapability({
      turnId: TURN_ID,
      toolCallId: TOOL_CALL_ID,
      arguments: { target: "current_actor" },
      policy: null,
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: dependencies({ dispatchProbe }),
    });

    expect(result).toMatchObject({
      ok: false,
      error: "permission_revoked",
    });
    expect(result.summary).toContain(
      "server-resolved workstation account context",
    );
    expect(result.summary).not.toContain("profile:");
    expect(result.summary).not.toContain("account_session:");
    expect(dispatchProbe).not.toHaveBeenCalled();
  });

  it("requires the room member to be currently present in the exact first-party room chat", async () => {
    const dispatchProbe = vi.fn(dependencies().dispatchProbe!);
    const leftMembership = {
      ...membership,
      presence: "left" as const,
    };
    const leftRoom = {
      ...room,
      participants: room.participants.map((participant) =>
        participant.participant_id === membership.participantId
          ? { ...participant, presence: "left" as const }
          : participant),
    };
    const result = await executeEnvironmentProbeGatewayCapability({
      turnId: TURN_ID,
      toolCallId: TOOL_CALL_ID,
      arguments: { target: "current_actor" },
      policy: null,
      accountContext: firstPartyAccountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: dependencies({
        readMembership: async () => leftMembership,
        readRoom: async () => leftRoom,
        dispatchProbe,
      }),
    });

    expect(result).toMatchObject({
      ok: false,
      error: "permission_revoked",
    });
    expect(result.summary).toContain("membership or consent");
    expect(dispatchProbe).not.toHaveBeenCalled();
  });

  it("fails closed when the current room consent identity no longer matches membership", async () => {
    const dispatchProbe = vi.fn(dependencies().dispatchProbe!);
    const changedConsentRoom: HelixSharedRealtimeRoom = {
      ...room,
      participants: room.participants.map((participant) =>
        participant.participant_id === membership.participantId
          ? {
              ...participant,
              consent: {
                ...participant.consent,
                consent_version: participant.consent.consent_version + 1,
                consent_receipt_ref: "room-consent:environment-probe:changed",
                updated_at: "2026-07-27T12:01:00.000Z",
              },
            }
          : participant),
    };
    const result = await executeEnvironmentProbeGatewayCapability({
      turnId: TURN_ID,
      toolCallId: `${TOOL_CALL_ID}:consent-changed`,
      arguments: { target: "current_actor" },
      policy: null,
      accountContext: firstPartyAccountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: dependencies({
        readRoom: async () => changedConsentRoom,
        dispatchProbe,
      }),
    });

    expect(result).toMatchObject({
      ok: false,
      error: "permission_revoked",
    });
    expect(result.summary).toContain("authorizing membership");
    expect(dispatchProbe).not.toHaveBeenCalled();
  });

  it("fails closed on caller-supplied command or environment identity", async () => {
    const dispatchProbe = vi.fn(dependencies().dispatchProbe!);
    const result = await executeEnvironmentProbeGatewayCapability({
      turnId: TURN_ID,
      toolCallId: TOOL_CALL_ID,
      arguments: {
        target: "current_actor",
        command: "/give @s diamond",
        room_id: "attacker-selected-room",
      },
      policy: policy(),
      dependencies: dependencies({ dispatchProbe }),
    });

    expect(result).toMatchObject({
      ok: false,
      status: "failed",
      error: "schema_validation_failed",
      observation: {
        eligible_for_current_turn_reentry: false,
        provenance_valid: false,
      },
    });
    expect(dispatchProbe).not.toHaveBeenCalled();
  });

  it("normalizes a malformed model target to the authenticated current actor", async () => {
    const resolveSubject = vi.fn(dependencies().resolveSubject!);
    const dispatchProbe = vi.fn(dependencies().dispatchProbe!);
    const result = await executeEnvironmentProbeGatewayCapability({
      turnId: TURN_ID,
      toolCallId: `${TOOL_CALL_ID}:server-owned-target`,
      arguments: {
        target: { player: "model-selected-player" },
        freshness_requirement_ms: 4_000,
      },
      policy: policy(),
      dependencies: dependencies({ resolveSubject, dispatchProbe }),
    });

    expect(result).toMatchObject({
      ok: true,
      observation: {
        outcome: "succeeded",
        eligible_for_current_turn_reentry: true,
      },
    });
    expect(resolveSubject).toHaveBeenCalledOnce();
    expect(dispatchProbe).toHaveBeenCalledWith(
      expect.objectContaining({
        arguments: {
          target: "current_actor",
          freshness_requirement_ms: 4_000,
        },
      }),
    );
    expect(JSON.stringify(dispatchProbe.mock.calls)).not.toContain(
      "model-selected-player",
    );
  });

  it("unwraps a sole model input envelope without admitting sibling caller fields", async () => {
    const dispatchProbe = vi.fn(dependencies().dispatchProbe!);
    const result = await executeEnvironmentProbeGatewayCapability({
      turnId: TURN_ID,
      toolCallId: `${TOOL_CALL_ID}:model-input-envelope`,
      arguments: {
        input: {
          target: "current_actor",
          freshness_requirement_ms: 10_000,
        },
      },
      policy: policy(),
      dependencies: dependencies({ dispatchProbe }),
    });

    expect(result.ok).toBe(true);
    expect(dispatchProbe).toHaveBeenCalledWith(
      expect.objectContaining({
        arguments: {
          target: "current_actor",
          freshness_requirement_ms: 10_000,
        },
      }),
    );

    const rejected = await executeEnvironmentProbeGatewayCapability({
      turnId: TURN_ID,
      toolCallId: `${TOOL_CALL_ID}:model-input-envelope-with-sibling`,
      arguments: {
        input: { target: "current_actor" },
        command: "/give @s diamond",
      },
      policy: policy(),
      dependencies: dependencies({ dispatchProbe }),
    });
    expect(rejected).toMatchObject({
      ok: false,
      error: "schema_validation_failed",
    });
    expect(dispatchProbe).toHaveBeenCalledTimes(1);
  });

  it("dispatches a typed position probe while retaining server-owned environment identity", async () => {
    const capabilityId = HELIX_MINECRAFT_LINE_OF_SIGHT_CHECK_CAPABILITY;
    const dispatchProbe = vi.fn(dependencies().dispatchProbe!);
    const result = await executeEnvironmentProbeGatewayCapability({
      capabilityId,
      turnId: TURN_ID,
      toolCallId: `${TOOL_CALL_ID}:line-of-sight`,
      arguments: {
        target: "position",
        position: { x: 12.5, y: 64, z: -3 },
        freshness_requirement_ms: 4_000,
      },
      policy: {
        ...policy(),
        allowedCapabilities: [capabilityId],
      },
      dependencies: dependencies({
        dispatchProbe,
        awaitProbe: async () => ({
          ...observation,
          capability_id: capabilityId,
          summary: "The target position is visible.",
          result: {
            result_summary: "The target position is visible.",
            line_of_sight: true,
            distance_blocks: 7.25,
          },
        }),
      }),
    });

    expect(result).toMatchObject({
      ok: true,
      observation: {
        capability_id: capabilityId,
        outcome: "succeeded",
        answer_authority: false,
      },
    });
    expect(dispatchProbe).toHaveBeenCalledWith(
      expect.objectContaining({
        descriptor: expect.objectContaining({
          capability_id: capabilityId,
        }),
        arguments: {
          target: "position",
          position: { x: 12.5, y: 64, z: -3 },
          freshness_requirement_ms: 4_000,
        },
      }),
    );
  });

  it("rejects incomplete typed position probes before connector dispatch", async () => {
    const capabilityId = HELIX_MINECRAFT_LINE_OF_SIGHT_CHECK_CAPABILITY;
    const dispatchProbe = vi.fn(dependencies().dispatchProbe!);
    const result = await executeEnvironmentProbeGatewayCapability({
      capabilityId,
      turnId: TURN_ID,
      toolCallId: `${TOOL_CALL_ID}:invalid-position`,
      arguments: {
        target: "position",
        position: { x: 12.5, y: 64 },
      },
      policy: {
        ...policy(),
        allowedCapabilities: [capabilityId],
      },
      dependencies: dependencies({ dispatchProbe }),
    });

    expect(result).toMatchObject({
      ok: false,
      status: "failed",
      error: "schema_validation_failed",
    });
    expect(dispatchProbe).not.toHaveBeenCalled();
  });

  it("dispatches to the exact active paired device instead of recreating a legacy transport", async () => {
    const paired = await dependencies().materializeConnector!({
      ownerProfileId: "",
      roomSourceBindingId: "",
      credentialId: "",
      roomId: "",
      sourceId: "",
      worldId: "",
      producerEpochRef: "",
      adapterAdmission,
      capabilityDescriptors: [],
    });
    const materializeConnector = vi.fn(
      dependencies().materializeConnector!,
    );
    const dispatchProbe = vi.fn(dependencies().dispatchProbe!);
    const result = await executeEnvironmentProbeGatewayCapability({
      turnId: TURN_ID,
      toolCallId: TOOL_CALL_ID,
      arguments: { target: "current_actor" },
      policy: policy(),
      dependencies: dependencies({
        listActiveConnectors: async () => [paired],
        materializeConnector,
        dispatchProbe,
      }),
    });
    expect(result.ok).toBe(true);
    expect(materializeConnector).not.toHaveBeenCalled();
    expect(dispatchProbe).toHaveBeenCalledWith(
      expect.objectContaining({
        connector: expect.objectContaining({
          deviceId: paired.deviceId,
          environmentBindingId: paired.environmentBindingId,
        }),
      }),
    );
  });

  it("fails closed when more than one exact-profile source is available", async () => {
    const result = await executeEnvironmentProbeGatewayCapability({
      turnId: TURN_ID,
      toolCallId: TOOL_CALL_ID,
      arguments: { target: "current_actor" },
      policy: policy(),
      dependencies: dependencies({
        listSourceCandidates: async () => [
          sourceCandidate,
          {
            ...sourceCandidate,
            bindingId: "room_source_binding:other",
            sourceId: "source:room-ingress:other",
          },
        ],
      }),
    });

    expect(result).toMatchObject({
      ok: false,
      status: "blocked",
      error: "target_ambiguous",
    });
  });

  it("rejects a capability-lane call without exact tool-call identity", async () => {
    const result = await executeEnvironmentProbeGatewayCapability({
      turnId: TURN_ID,
      arguments: { target: "current_actor" },
      policy: policy(),
      dependencies: dependencies(),
    });
    expect(result).toMatchObject({
      ok: false,
      error: "permission_revoked",
    });
  });
});
