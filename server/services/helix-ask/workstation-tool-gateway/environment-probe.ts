import crypto from "node:crypto";
import { resolveHelixWorkstationCapabilityAccess } from "@shared/helix-account-session";
import { HELIX_SHARED_LIVE_ROOM_READ_SCOPE } from "@shared/contracts/helix-shared-live-room-agent.v1";
import {
  HELIX_ENVIRONMENT_PROBE_OBSERVATION_SCHEMA,
  HELIX_MINECRAFT_INVENTORY_CHECK_CAPABILITY,
  HELIX_MINECRAFT_SITUATION_CAPABILITY_IDS,
  type HelixEnvironmentProbeObservation,
  type HelixEnvironmentProbeOutcome,
} from "@shared/helix-environment-connector";
import {
  SharedLiveRoomBindingStore,
  type SharedLiveRoomRunRoomBinding,
} from "../../shared-live-room-control/binding-store";
import {
  listEnvironmentConnectorCapabilityDescriptors,
  readEnvironmentConnectorCapabilityDescriptor,
} from "../../environment-connectors/catalog";
import {
  listActiveEnvironmentConnectorBindings,
  materializeLegacyRoomSourceConnector,
} from "../../environment-connectors/bindings";
import {
  isRoomEnvironmentSubjectError,
  resolveRoomEnvironmentSubjectForProbe,
} from "../../environment-connectors/subjects";
import { validateEnvironmentConnectorSchemaValue } from "../../environment-connectors/conformance";
import {
  awaitDurableEnvironmentProbeObservation,
  dispatchDurableEnvironmentProbe,
  DurableEnvironmentProbeError,
  type DurableEnvironmentProbeErrorCode,
} from "../../environment-connectors/probe";
import {
  readSharedRealtimeRoom,
  readSharedRealtimeRoomMembership,
  type SharedRealtimeRoomMembership,
} from "../realtime-room/room-store";
import {
  currentHelixExternalCapabilityPolicy,
  type HelixExternalCapabilityPolicy,
} from "../runtime/external-capability-policy";
import type { HelixWorkstationGatewayAccountContext } from "./account-policy";
import {
  listLatestBoundRoomSourceCandidates,
  type BoundRoomEvidenceSourceCandidate,
} from "./bound-room-evidence";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const HELIX_ENVIRONMENT_PROBE_GATEWAY_ACTION =
  "room.environment.probe" as const;
export const HELIX_ENVIRONMENT_PROBE_GATEWAY_ERROR_SCHEMA =
  "helix.environment_connector.probe_gateway_error.v1" as const;

export type EnvironmentProbeGatewayExecution = {
  ok: boolean;
  status: "completed" | "blocked" | "failed";
  summary: string;
  observation: Record<string, unknown>;
  error?: string;
};

export type EnvironmentProbeGatewayDependencies = {
  bindingStore: Pick<SharedLiveRoomBindingStore, "getActiveRunRoomBinding">;
  readMembership: typeof readSharedRealtimeRoomMembership;
  readRoom: typeof readSharedRealtimeRoom;
  listSourceCandidates: (
    roomId: string,
  ) => Promise<BoundRoomEvidenceSourceCandidate[]>;
  materializeConnector: typeof materializeLegacyRoomSourceConnector;
  listActiveConnectors: typeof listActiveEnvironmentConnectorBindings;
  resolveSubject: typeof resolveRoomEnvironmentSubjectForProbe;
  dispatchProbe: typeof dispatchDurableEnvironmentProbe;
  awaitProbe: typeof awaitDurableEnvironmentProbeObservation;
  now: () => Date;
};

const dependencies = (
  overrides: Partial<EnvironmentProbeGatewayDependencies> = {},
): EnvironmentProbeGatewayDependencies => ({
  bindingStore: overrides.bindingStore ?? new SharedLiveRoomBindingStore(),
  readMembership: overrides.readMembership ?? readSharedRealtimeRoomMembership,
  readRoom: overrides.readRoom ?? readSharedRealtimeRoom,
  listSourceCandidates:
    overrides.listSourceCandidates ?? listLatestBoundRoomSourceCandidates,
  materializeConnector:
    overrides.materializeConnector ?? materializeLegacyRoomSourceConnector,
  listActiveConnectors:
    overrides.listActiveConnectors ?? listActiveEnvironmentConnectorBindings,
  resolveSubject:
    overrides.resolveSubject ?? resolveRoomEnvironmentSubjectForProbe,
  dispatchProbe: overrides.dispatchProbe ?? dispatchDurableEnvironmentProbe,
  awaitProbe: overrides.awaitProbe ?? awaitDurableEnvironmentProbeObservation,
  now: overrides.now ?? (() => new Date()),
});

const normalized = (value: string): string => value.trim().toLowerCase();

const normalizeServerOwnedSemanticTarget = (input: {
  descriptor: NonNullable<
    ReturnType<typeof readEnvironmentConnectorCapabilityDescriptor>
  >;
  arguments: Record<string, unknown>;
}): Record<string, unknown> => {
  const argumentKeys = Object.keys(input.arguments);
  const wrappedInput = input.arguments.input;
  const semanticArguments =
    argumentKeys.length === 1 &&
    argumentKeys[0] === "input" &&
    wrappedInput !== null &&
    typeof wrappedInput === "object" &&
    !Array.isArray(wrappedInput)
      ? { ...(wrappedInput as Record<string, unknown>) }
      : input.arguments;
  const targetSchema = input.descriptor.input_schema.properties?.target;
  const serverOwnsCurrentActorTarget =
    targetSchema?.type === "string" &&
    targetSchema.enum?.length === 1 &&
    targetSchema.enum[0] === "current_actor";
  return serverOwnsCurrentActorTarget
    ? { ...semanticArguments, target: "current_actor" }
    : semanticArguments;
};

type EnvironmentProbeExecutionAuthority = {
  kind: "external_agent_run" | "first_party_shared_room";
  runId: string;
  tenantId: string;
  subjectId: string;
  accountProfileId: string;
  accountType: "developer" | "user";
  accountPolicy: HelixExternalCapabilityPolicy["accountPolicy"];
  roomId: string | null;
  signal?: AbortSignal;
  deadlineAt?: string;
};

const firstPartyRoomIdFromThread = (
  conversationThreadId: string | null | undefined,
): string | null => {
  const prefix = "helix-ask:room:";
  const threadId = conversationThreadId?.trim() ?? "";
  if (!threadId.startsWith(prefix)) return null;
  const roomId = threadId.slice(prefix.length).trim();
  return roomId && roomId.length <= 240 ? roomId : null;
};

const firstPartyAuthorityFromContext = (input: {
  capabilityId: string;
  accountContext?: HelixWorkstationGatewayAccountContext | null;
  conversationThreadId?: string | null;
}): EnvironmentProbeExecutionAuthority | null => {
  const accountContext = input.accountContext;
  const accountSession = accountContext?.account_session;
  const sessionId = accountContext?.session_id?.trim() ?? "";
  const profileId = accountContext?.profile_id?.trim() ?? "";
  const roomId = firstPartyRoomIdFromThread(input.conversationThreadId);
  if (
    !accountContext?.trusted_account_session ||
    !accountSession ||
    accountSession.status !== "active" ||
    !sessionId ||
    !profileId ||
    accountSession.session_id !== sessionId ||
    accountSession.profile.profile_id !== profileId ||
    !roomId
  ) {
    return null;
  }
  const accountPolicy = accountContext.account_policy;
  const capabilityAccess = resolveHelixWorkstationCapabilityAccess(
    accountPolicy,
    {
      capability_id: input.capabilityId,
      permission_profile_required: "read",
    },
  );
  if (
    !accountPolicy.feature_flags.includes("shared_realtime_rooms") ||
    !accountPolicy.feature_flags.includes("room_source_ingress") ||
    accountPolicy.locked_features.includes("shared_realtime_rooms") ||
    accountPolicy.locked_features.includes("room_source_ingress") ||
    capabilityAccess.state !== "available"
  ) {
    return null;
  }
  const subjectHash = crypto
    .createHash("sha256")
    .update(`${sessionId}\n${profileId}\n${roomId}`, "utf8")
    .digest("hex")
    .slice(0, 40);
  return {
    kind: "first_party_shared_room",
    runId: `first_party_shared_room:${subjectHash}`,
    tenantId: "first_party_browser_session",
    subjectId: `first_party_subject:${subjectHash}`,
    accountProfileId: profileId,
    accountType: accountPolicy.account_type,
    accountPolicy,
    roomId,
  };
};

const firstPartyAuthorityFailureSummary = (input: {
  capabilityId: string;
  accountContext?: HelixWorkstationGatewayAccountContext | null;
  conversationThreadId?: string | null;
}): string => {
  const accountContext = input.accountContext;
  const accountSession = accountContext?.account_session;
  const sessionId = accountContext?.session_id?.trim() ?? "";
  const profileId = accountContext?.profile_id?.trim() ?? "";
  if (!accountContext) {
    return "The Shared GPT Live Room probe did not receive a server-resolved workstation account context.";
  }
  if (!accountContext.trusted_account_session) {
    return "The Shared GPT Live Room probe requires a trusted active workstation account session.";
  }
  if (!accountSession || accountSession.status !== "active") {
    return "The Shared GPT Live Room probe requires an active workstation account session.";
  }
  if (
    !sessionId ||
    !profileId ||
    accountSession.session_id !== sessionId ||
    accountSession.profile.profile_id !== profileId
  ) {
    return "The Shared GPT Live Room probe account identity did not match the active server session.";
  }
  if (!firstPartyRoomIdFromThread(input.conversationThreadId)) {
    return "The Shared GPT Live Room probe requires the exact server-scoped room conversation thread.";
  }
  const accountPolicy = accountContext.account_policy;
  if (
    !accountPolicy.feature_flags.includes("shared_realtime_rooms") ||
    !accountPolicy.feature_flags.includes("room_source_ingress") ||
    accountPolicy.locked_features.includes("shared_realtime_rooms") ||
    accountPolicy.locked_features.includes("room_source_ingress")
  ) {
    return "Shared GPT Live Rooms or room source ingress is unavailable under the active account policy.";
  }
  return `The Minecraft capability ${input.capabilityId} is unavailable under the active workstation capability policy.`;
};

const ownerFromPolicy = (
  policy: HelixExternalCapabilityPolicy,
): {
  tenantId: string;
  issuer: string;
  subjectId: string;
  accountProfileId: string;
} | null => {
  const issuer = policy.issuer?.trim() ?? "";
  const subjectId = policy.subjectId?.trim() ?? "";
  if (
    !policy.runId.trim() ||
    !policy.tenantId.trim() ||
    !issuer ||
    !subjectId ||
    !policy.accountProfileId.trim()
  ) {
    return null;
  }
  return {
    tenantId: policy.tenantId,
    issuer,
    subjectId,
    accountProfileId: policy.accountProfileId,
  };
};

const bindingIdentityMatches = (input: {
  binding: SharedLiveRoomRunRoomBinding;
  membership: SharedRealtimeRoomMembership;
}): boolean =>
  input.binding.authorizedByProfileId === input.membership.profileId &&
  input.binding.participantIdAtBind === input.membership.participantId &&
  input.binding.memberRoleAtBind === input.membership.role &&
  input.binding.consentVersionAtBind ===
    input.membership.consent.consent_version &&
  input.binding.consentReceiptRefAtBind ===
    input.membership.consent.consent_receipt_ref;

const syntheticRef = (prefix: string, value: string): string =>
  `${prefix}:${crypto
    .createHash("sha256")
    .update(value, "utf8")
    .digest("hex")
    .slice(0, 40)}`;

const publicOutcomeForDurableError = (
  code: DurableEnvironmentProbeErrorCode,
): Exclude<HelixEnvironmentProbeOutcome, "succeeded"> => {
  switch (code) {
    case "probe_lease_invalid":
      return "permission_revoked";
    case "probe_request_not_found":
      return "target_unavailable";
    case "probe_result_conflict":
      return "schema_validation_failed";
    default:
      return code;
  }
};

const errorObservation = (input: {
  turnId: string;
  capabilityId: string;
  outcome: Exclude<HelixEnvironmentProbeOutcome, "succeeded">;
  summary: string;
}): HelixEnvironmentProbeObservation => ({
  schema: HELIX_ENVIRONMENT_PROBE_OBSERVATION_SCHEMA,
  probe_request_ref: syntheticRef(
    "environment_probe_request_uncreated",
    `${input.turnId}\n${input.capabilityId}\n${input.outcome}`,
  ),
  probe_attempt_ref: null,
  capability_id: input.capabilityId,
  capability_version: 1,
  outcome: input.outcome,
  summary: input.summary,
  result: {},
  evidence_ref: syntheticRef(
    "environment_probe_failure",
    `${input.turnId}\n${input.capabilityId}\n${input.outcome}`,
  ),
  observed_at: new Date().toISOString(),
  freshness_age_ms: null,
  provenance_valid: false,
  eligible_for_current_turn_reentry: false,
  late_result_disposition: null,
  content_role: "environment_probe_observation_not_assistant_answer",
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const failed = (input: {
  turnId: string;
  capabilityId?: string;
  outcome: Exclude<HelixEnvironmentProbeOutcome, "succeeded">;
  summary: string;
  status?: "blocked" | "failed";
}): EnvironmentProbeGatewayExecution => ({
  ok: false,
  status: input.status ?? "blocked",
  summary: input.summary,
  observation: errorObservation({
    turnId: input.turnId,
    capabilityId:
      input.capabilityId ?? HELIX_MINECRAFT_INVENTORY_CHECK_CAPABILITY,
    outcome: input.outcome,
    summary: input.summary,
  }),
  error: input.outcome,
});

const environmentProbeManifestForCapability = (
  capabilityId: string,
): HelixWorkstationCapabilityManifest => {
  const capabilityDescriptor =
    readEnvironmentConnectorCapabilityDescriptor(capabilityId);
  if (!capabilityDescriptor) {
    throw new Error(
      `Missing built-in Minecraft capability descriptor ${capabilityId}.`,
    );
  }
  return {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: capabilityDescriptor.capability_id,
    label: capabilityDescriptor.trusted_model_label,
    description: `${capabilityDescriptor.trusted_model_description} The exact room, source, world, connector, device, credential, adapter, and catalog identity are server-derived.`,
    panel_id: null,
    action_id: HELIX_ENVIRONMENT_PROBE_GATEWAY_ACTION,
    mode: "read",
    mutating: false,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: true,
    terminal_eligible: false,
    permission_profile_required: "read",
    post_tool_model_step_required: true,
    input_schema: capabilityDescriptor.input_schema,
    output_observation_schema: HELIX_ENVIRONMENT_PROBE_OBSERVATION_SCHEMA,
    observation_schema: HELIX_ENVIRONMENT_PROBE_OBSERVATION_SCHEMA,
    safety_tags: [
      "read_only_probe",
      "semantic_arguments_only",
      "server_derived_environment_identity",
      "frozen_catalog_required",
      "durable_lease_required",
      "current_turn_reentry_required",
      "command_execution_disabled",
      "no_shell",
      "no_code_mutation",
      "non_terminal",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const environmentProbeMinecraftManifests: HelixWorkstationCapabilityManifest[] =
  HELIX_MINECRAFT_SITUATION_CAPABILITY_IDS.map((capabilityId) =>
    environmentProbeManifestForCapability(capabilityId),
  );

export const environmentProbeMinecraftInventoryManifest =
  environmentProbeMinecraftManifests.find(
    (manifest) =>
      manifest.capability_id === HELIX_MINECRAFT_INVENTORY_CHECK_CAPABILITY,
  )!;

export const executeEnvironmentProbeGatewayCapability = async (input: {
  capabilityId?: string | null;
  turnId: string;
  toolCallId?: string | null;
  providerExecutionId?: string | null;
  arguments?: Record<string, unknown>;
  policy?: HelixExternalCapabilityPolicy | null;
  accountContext?: HelixWorkstationGatewayAccountContext | null;
  conversationThreadId?: string | null;
  dependencies?: Partial<EnvironmentProbeGatewayDependencies>;
}): Promise<EnvironmentProbeGatewayExecution> => {
  const turnId = input.turnId.trim() || "unknown-turn";
  const toolCallId = input.toolCallId?.trim() ?? "";
  const capabilityId =
    input.capabilityId?.trim() || HELIX_MINECRAFT_INVENTORY_CHECK_CAPABILITY;
  const fail = (
    entry: Omit<
      Parameters<typeof failed>[0],
      "turnId" | "capabilityId"
    >,
  ): EnvironmentProbeGatewayExecution =>
    failed({ ...entry, turnId, capabilityId });
  const policy =
    input.policy === undefined
      ? currentHelixExternalCapabilityPolicy()
      : input.policy;
  const externalOwner = policy ? ownerFromPolicy(policy) : null;
  const authority: EnvironmentProbeExecutionAuthority | null =
    policy && externalOwner
      ? {
          kind: "external_agent_run",
          runId: policy.runId,
          tenantId: policy.tenantId,
          subjectId: externalOwner.subjectId,
          accountProfileId: policy.accountProfileId,
          accountType: policy.accountType,
          accountPolicy: policy.accountPolicy,
          roomId: null,
          signal: policy.signal,
          deadlineAt: policy.deadlineAt,
        }
      : !policy
        ? firstPartyAuthorityFromContext({ ...input, capabilityId })
        : null;
  if (!authority) {
    return fail({
      outcome: "permission_revoked",
      summary: policy
        ? "The external Agent API continuation did not provide complete server-validated run identity."
        : firstPartyAuthorityFailureSummary({ ...input, capabilityId }),
    });
  }
  if (!toolCallId) {
    return fail({
      outcome: "permission_revoked",
      summary:
        "The current probe is missing exact authenticated run or tool-call identity.",
    });
  }
  if (
    policy &&
    (!externalOwner ||
      !policy.oauthScopes?.has(HELIX_SHARED_LIVE_ROOM_READ_SCOPE) ||
      !policy.allowedCapabilities.some(
        (entry) => normalized(entry) === normalized(capabilityId),
      ))
  ) {
    return fail({
      outcome: "permission_revoked",
      summary:
        `The current continuation is not scoped to ${capabilityId}.`,
    });
  }
  const accountPolicy = authority.accountPolicy;
  const capabilityAccess = resolveHelixWorkstationCapabilityAccess(
    accountPolicy,
    {
      capability_id: capabilityId,
      permission_profile_required: "read",
    },
  );
  if (
    !accountPolicy ||
    authority.accountType !== accountPolicy.account_type ||
    !accountPolicy.feature_flags.includes("shared_realtime_rooms") ||
    !accountPolicy.feature_flags.includes("room_source_ingress") ||
    accountPolicy.locked_features.includes("shared_realtime_rooms") ||
    accountPolicy.locked_features.includes("room_source_ingress") ||
    capabilityAccess.state !== "available"
  ) {
    return fail({
      outcome: "permission_revoked",
      summary:
        "The current account policy does not admit bound environment probes.",
    });
  }
  const descriptor = readEnvironmentConnectorCapabilityDescriptor(capabilityId);
  if (!descriptor) {
    return fail({
      outcome: "capability_unavailable",
      summary: `The Minecraft capability ${capabilityId} is not registered.`,
    });
  }
  const args = normalizeServerOwnedSemanticTarget({
    descriptor,
    arguments: input.arguments ?? {},
  });
  const inputIssues = validateEnvironmentConnectorSchemaValue(
    descriptor.input_schema,
    args,
  );
  if (
    inputIssues.length > 0 ||
    (args.target === "current_focus" && args.position !== undefined)
  ) {
    return fail({
      outcome: "schema_validation_failed",
      summary:
        inputIssues.length > 0
          ? `The probe arguments failed the trusted schema at ${inputIssues[0].path}.`
          : "A current-focus crop probe cannot also supply a position.",
      status: "failed",
    });
  }

  const deps = dependencies(input.dependencies);
  try {
    const binding =
      authority.kind === "external_agent_run" && externalOwner
        ? await deps.bindingStore.getActiveRunRoomBinding({
            owner: externalOwner,
            runId: authority.runId,
          })
        : null;
    const roomId = binding?.roomId ?? authority.roomId;
    if (!roomId) {
      return fail({
        outcome: "binding_revoked",
        summary:
          authority.kind === "external_agent_run"
            ? "This exact Agent API run has no active Shared Live Room binding."
            : "This first-party continuation is not bound to an active Shared GPT Live Room.",
      });
    }
    const membership = await deps.readMembership({
      roomId,
      profileId: authority.accountProfileId,
    });
    if (
      !membership ||
      membership.roomStatus === "closed" ||
      (binding
        ? !bindingIdentityMatches({ binding, membership })
        : membership.presence !== "present")
    ) {
      return fail({
        outcome: "permission_revoked",
        summary:
          "The room membership or consent that authorized this run binding changed.",
      });
    }
    const room = await deps.readRoom({
      roomId,
      profileId: authority.accountProfileId,
    });
    const roomSelf = room.participants.find(
      (participant) => participant.participant_id === room.self_participant_id,
    );
    const participantIdentityMismatch =
      !roomSelf || roomSelf.participant_id !== membership.participantId;
    const consentIdentityMismatch = Boolean(roomSelf) && (
      roomSelf!.consent.consent_version !== membership.consent.consent_version ||
      roomSelf!.consent.consent_receipt_ref !==
        membership.consent.consent_receipt_ref
    );
    const boundAuthorizationMismatch = Boolean(binding && roomSelf) && (
      roomSelf!.participant_id !== binding!.participantIdAtBind ||
      roomSelf!.consent.consent_version !== binding!.consentVersionAtBind ||
      roomSelf!.consent.consent_receipt_ref !== binding!.consentReceiptRefAtBind
    );
    const firstPartyPresenceMismatch =
      !binding && Boolean(roomSelf) && roomSelf!.presence !== "present";
    if (
      room.status === "closed" ||
      participantIdentityMismatch ||
      consentIdentityMismatch ||
      boundAuthorizationMismatch ||
      firstPartyPresenceMismatch
    ) {
      return fail({
        outcome: "permission_revoked",
        summary: room.status === "closed"
          ? "The exact server-validated Shared GPT Live Room is closed."
          : participantIdentityMismatch
            ? "The current room projection no longer matches the authenticated participant identity."
            : consentIdentityMismatch || boundAuthorizationMismatch
              ? "The current room consent identity no longer matches the authorizing membership."
              : "The first-party room member is not currently present in the exact server-validated Shared GPT Live Room chat.",
      });
    }
    const allCandidates = await deps.listSourceCandidates(roomId);
    const candidates = allCandidates.filter(
      (candidate) =>
        descriptor.adapter_profile_ids.includes(
          candidate.adapterAdmission.adapter_profile_id,
        ) && candidate.roomId === roomId,
    );
    if (candidates.length === 0) {
      return fail({
        outcome: "connector_offline",
        summary:
          "No currently credentialed, registry-admitted Minecraft connector is available for the bound room.",
        status: "failed",
      });
    }
    if (candidates.length > 1) {
      return fail({
        outcome: "target_ambiguous",
        summary:
          "More than one admitted Minecraft environment matches this run; bind an exact environment before probing.",
      });
    }
    const source = candidates[0];
    if (!source.credentialId) {
      return fail({
        outcome: "connector_offline",
        summary:
          "The admitted source does not expose a server-owned connector credential identity.",
        status: "failed",
      });
    }
    const now = deps.now();
    const sourceAgeMs =
      now.getTime() - new Date(source.requestReceivedAt).getTime();
    if (
      !Number.isFinite(sourceAgeMs) ||
      sourceAgeMs < 0 ||
      sourceAgeMs > source.requestFreshnessMaxAgeMs
    ) {
      return fail({
        outcome: "result_stale",
        summary:
          "The Minecraft connector admission is stale and must send a fresh observation before probing.",
        status: "failed",
      });
    }
    const descriptors = listEnvironmentConnectorCapabilityDescriptors({
      adapterProfileId: source.adapterAdmission.adapter_profile_id,
    });
    const connectorOwnerProfileId =
      source.ownerProfileId ?? authority.accountProfileId;
    const activeConnectors = await deps.listActiveConnectors({
      ownerProfileId: connectorOwnerProfileId,
      roomId: source.roomId,
      roomSourceBindingId: source.bindingId,
      sourceId: source.sourceId,
      adapterAdmissionId: source.adapterAdmission.admission_id,
      adapterContractHash: source.adapterAdmission.adapter_contract_hash,
      manifestHash: source.adapterAdmission.manifest_hash,
      producerEpochRef: source.adapterAdmission.producer_epoch_ref,
      capabilityId,
    });
    const pairedConnectors = activeConnectors.filter(
      (candidate) => !candidate.deviceId.startsWith("connector_device:legacy:"),
    );
    if (pairedConnectors.length > 1) {
      return fail({
        outcome: "target_ambiguous",
        summary:
          "More than one paired device is active for this exact environment capability; revoke or suspend one device before probing.",
      });
    }
    const connector =
      pairedConnectors[0] ??
      activeConnectors[0] ??
      (await deps.materializeConnector({
        ownerProfileId: connectorOwnerProfileId,
        roomSourceBindingId: source.bindingId,
        credentialId: source.credentialId,
        roomId: source.roomId,
        sourceId: source.sourceId,
        worldId: source.worldId,
        producerEpochRef: source.adapterAdmission.producer_epoch_ref,
        adapterAdmission: source.adapterAdmission,
        capabilityDescriptors: descriptors,
      }));
    const trustedTurnActorContext =
      authority.kind === "first_party_shared_room"
        ? input.accountContext?.trusted_turn_actor_context ?? null
        : null;
    let requestingParticipantId = membership.participantId;
    if (trustedTurnActorContext?.origin === "realtime_voice") {
      const frozenParticipant = trustedTurnActorContext.participant_id
        ? room.participants.find(
            (participant) =>
              participant.participant_id ===
                trustedTurnActorContext.participant_id &&
              participant.presence === "present",
          ) ?? null
        : null;
      if (
        trustedTurnActorContext.room_id !== roomId ||
        trustedTurnActorContext.requester_profile_id !==
          authority.accountProfileId ||
        trustedTurnActorContext.resolution !== "resolved" ||
        !frozenParticipant
      ) {
        return fail({
          outcome: "permission_revoked",
          summary:
            "The GPT Live speaker identity for this turn is unavailable, stale, or no longer present in the bound room.",
          status: "failed",
        });
      }
      requestingParticipantId = frozenParticipant.participant_id;
    }
    let resolvedSubject: Awaited<
      ReturnType<typeof resolveRoomEnvironmentSubjectForProbe>
    > = null;
    if (args.target === "current_actor") {
      try {
        resolvedSubject = await deps.resolveSubject({
          membership,
          participantId: requestingParticipantId,
          environmentBindingId: connector.environmentBindingId,
          sourceId: source.sourceId,
          worldId: source.worldId,
          producerEpochRef: source.adapterAdmission.producer_epoch_ref,
        });
      } catch (error) {
        if (isRoomEnvironmentSubjectError(error)) {
          const outcome: Exclude<
            HelixEnvironmentProbeOutcome,
            "succeeded"
          > =
            error.code === "subject_offline"
              ? "subject_offline"
              : error.code === "subject_binding_required"
                ? "subject_binding_required"
              : error.code === "producer_epoch_mismatch"
                ? "producer_epoch_mismatch"
                : error.code === "wrong_environment"
                  ? "wrong_environment"
                  : error.code === "wrong_world"
                    ? "wrong_world"
                    : error.code === "subject_binding_forbidden"
                      ? "permission_revoked"
                      : "subject_binding_stale";
          return fail({
            outcome,
            summary: error.message,
            status: "failed",
          });
        }
        throw error;
      }
    }
    const requestedFreshness = Number(args.freshness_requirement_ms);
    const freshnessRequirementMs = Number.isFinite(requestedFreshness)
      ? Math.floor(requestedFreshness)
      : 5_000;
    const policyDeadlineMs = authority.deadlineAt
      ? new Date(authority.deadlineAt).getTime()
      : Number.POSITIVE_INFINITY;
    const deadlineMs = Math.min(
      policyDeadlineMs,
      now.getTime() + descriptor.timeout_ceiling_ms,
    );
    const deadlineAt = new Date(deadlineMs).toISOString();
    const dispatched = await deps.dispatchProbe({
      tenantId: authority.tenantId,
      ownerSubjectId: authority.subjectId,
      ownerProfileId: authority.accountProfileId,
      executionAuthorityKind: authority.kind,
      runId: authority.runId,
      turnId,
      providerExecutionId:
        input.providerExecutionId?.trim() || `codex_native_execution:${turnId}`,
      toolCallId,
      roomId: source.roomId,
      sourceId: source.sourceId,
      producerEpochRef: source.adapterAdmission.producer_epoch_ref,
      requestingParticipantId,
      resolvedSubject: resolvedSubject
        ? {
            subjectBindingId: resolvedSubject.subjectBindingId,
            subjectNativeId: resolvedSubject.subjectNativeId,
          }
        : null,
      adapterAdmission: source.adapterAdmission,
      connector,
      descriptor,
      arguments: {
        ...args,
        freshness_requirement_ms: freshnessRequirementMs,
      },
      freshnessRequirementMs,
      timeoutMs: Math.max(1_000, deadlineMs - now.getTime()),
      idempotencyKey: `environment_probe:${authority.runId}:${turnId}:${toolCallId}:${capabilityId}`,
      now,
    });
    const observation = await deps.awaitProbe({
      requestId: dispatched.requestId,
      signal: authority.signal,
      deadlineAt,
    });
    if (!observation.eligible_for_current_turn_reentry) {
      return {
        ok: false,
        status: "failed",
        summary:
          observation.late_result_disposition ??
          "The authentic probe result is not eligible for this turn.",
        observation,
        error:
          observation.late_result_disposition ??
          "current_turn_reentry_ineligible",
      };
    }
    return {
      ok: observation.outcome === "succeeded",
      status: observation.outcome === "succeeded" ? "completed" : "failed",
      summary: observation.summary,
      observation,
      ...(observation.outcome === "succeeded"
        ? {}
        : { error: observation.outcome }),
    };
  } catch (error) {
    if (error instanceof DurableEnvironmentProbeError) {
      return fail({
        outcome: publicOutcomeForDurableError(error.code),
        summary: error.message,
        status: "failed",
      });
    }
    return fail({
      outcome: "probe_failed",
      summary:
        "The governed environment probe failed before a trustworthy observation could re-enter.",
      status: "failed",
    });
  }
};
