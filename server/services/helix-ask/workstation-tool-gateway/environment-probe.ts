import crypto from "node:crypto";
import { resolveHelixWorkstationCapabilityAccess } from "@shared/helix-account-session";
import { HELIX_SHARED_LIVE_ROOM_READ_SCOPE } from "@shared/contracts/helix-shared-live-room-agent.v1";
import {
  HELIX_ENVIRONMENT_PROBE_OBSERVATION_SCHEMA,
  HELIX_MINECRAFT_INVENTORY_CHECK_CAPABILITY,
  HELIX_MINECRAFT_READ_ONLY_CAPABILITY_IDS,
  HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
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
import {
  validateEnvironmentConnectorSchemaValue,
  type EnvironmentConnectorSchemaIssue,
} from "../../environment-connectors/conformance";
import {
  awaitDurableEnvironmentProbeObservation,
  dispatchDurableEnvironmentProbe,
  DurableEnvironmentProbeError,
  type DurableEnvironmentProbeErrorCode,
} from "../../environment-connectors/probe";
import {
  readSharedRealtimeRoom,
  readSharedRealtimeRoomMembership,
  updateSharedRealtimeRoomPresence,
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
  schemaRepair?: EnvironmentProbeSchemaRepair;
  error?: string;
};

export type EnvironmentProbeSchemaRepair = {
  schema: "helix.environment_probe_schema_repair.v1";
  capability_id: string;
  failure_class: "invalid_args";
  retryability: "retryable";
  issues: EnvironmentConnectorSchemaIssue[];
  rejected_fields: string[];
  allowed_fields: string[];
  required_fields: string[];
  trusted_input_schema: NonNullable<
    ReturnType<typeof readEnvironmentConnectorCapabilityDescriptor>
  >["input_schema"];
  proposed_arguments: Record<string, unknown> | null;
  next_affordances: Array<{
    affordance_id: string;
    capability_id: string;
    args: Record<string, unknown>;
    lane_request: Record<string, unknown>;
    admissible: true;
    reason: string;
  }>;
};

export type EnvironmentProbeGatewayDependencies = {
  bindingStore: Pick<SharedLiveRoomBindingStore, "getActiveRunRoomBinding">;
  refreshPresence: typeof updateSharedRealtimeRoomPresence;
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
  refreshPresence:
    overrides.refreshPresence ?? updateSharedRealtimeRoomPresence,
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

export const normalizeEnvironmentProbeSemanticArguments = (input: {
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
  const spatialSemanticArguments =
    input.descriptor.capability_id ===
    HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY
      ? { ...semanticArguments }
      : semanticArguments;
  if (
    input.descriptor.capability_id ===
    HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY
  ) {
    const aliasFrom = spatialSemanticArguments.from;
    const aliasMin = spatialSemanticArguments.min;
    const aliasTo = spatialSemanticArguments.to;
    const aliasMax = spatialSemanticArguments.max;
    const canonicalFrom = spatialSemanticArguments.verification_from;
    const canonicalTo = spatialSemanticArguments.verification_to;
    const hasExactVerificationShape =
      typeof spatialSemanticArguments.expected_block === "string" &&
      spatialSemanticArguments.expected_block.trim().length > 0 &&
      Boolean(
        (canonicalFrom &&
          typeof canonicalFrom === "object" &&
          !Array.isArray(canonicalFrom)) ||
          (aliasFrom && typeof aliasFrom === "object" && !Array.isArray(aliasFrom)) ||
          (aliasMin && typeof aliasMin === "object" && !Array.isArray(aliasMin)),
      ) &&
      Boolean(
        (canonicalTo &&
          typeof canonicalTo === "object" &&
          !Array.isArray(canonicalTo)) ||
          (aliasTo && typeof aliasTo === "object" && !Array.isArray(aliasTo)) ||
          (aliasMax && typeof aliasMax === "object" && !Array.isArray(aliasMax)),
      );
    if (hasExactVerificationShape) {
      if (
        canonicalFrom === undefined &&
        aliasFrom !== undefined &&
        aliasMin === undefined
      ) {
        spatialSemanticArguments.verification_from = aliasFrom;
        delete spatialSemanticArguments.from;
      }
      if (
        canonicalFrom === undefined &&
        aliasFrom === undefined &&
        aliasMin !== undefined
      ) {
        spatialSemanticArguments.verification_from = aliasMin;
        delete spatialSemanticArguments.min;
      }
      if (
        canonicalTo === undefined &&
        aliasTo !== undefined &&
        aliasMax === undefined
      ) {
        spatialSemanticArguments.verification_to = aliasTo;
        delete spatialSemanticArguments.to;
      }
      if (
        canonicalTo === undefined &&
        aliasTo === undefined &&
        aliasMax !== undefined
      ) {
        spatialSemanticArguments.verification_to = aliasMax;
        delete spatialSemanticArguments.max;
      }
      if (spatialSemanticArguments.purpose === undefined) {
        spatialSemanticArguments.purpose = "structure_verification";
      }
      if (normalized(String(spatialSemanticArguments.mutation ?? "")) === "none") {
        delete spatialSemanticArguments.mutation;
      }
    }
    if (
      spatialSemanticArguments.freshness_requirement_ms === undefined &&
      spatialSemanticArguments.freshness_ms !== undefined
    ) {
      spatialSemanticArguments.freshness_requirement_ms =
        spatialSemanticArguments.freshness_ms;
      delete spatialSemanticArguments.freshness_ms;
    }
    const category = normalized(String(spatialSemanticArguments.category ?? ""));
    const effect = normalized(String(spatialSemanticArguments.effect ?? ""));
    const recognizedPlanningCategory = [
      "prebuild_safety",
      "build_planning",
      "structure_planning",
    ].includes(category);
    if (
      recognizedPlanningCategory &&
      spatialSemanticArguments.purpose === undefined
    ) {
      spatialSemanticArguments.purpose =
        category === "structure_planning"
          ? "structure_planning"
          : "build_planning";
    }
    if (recognizedPlanningCategory) {
      delete spatialSemanticArguments.category;
      if (
        spatialSemanticArguments.center !== undefined &&
        (spatialSemanticArguments.target === undefined ||
          spatialSemanticArguments.target === "current_actor")
      ) {
        delete spatialSemanticArguments.center;
      }
    }
    if (effect === "read_only") {
      delete spatialSemanticArguments.effect;
    }
  }
  const radius = spatialSemanticArguments.radius;
  const hasHorizontalRadius = Object.prototype.hasOwnProperty.call(
    spatialSemanticArguments,
    "horizontal_radius",
  );
  const hasVerticalRadius = Object.prototype.hasOwnProperty.call(
    spatialSemanticArguments,
    "vertical_radius",
  );
  const canonicalArguments =
    input.descriptor.capability_id ===
      HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY &&
    Number.isInteger(radius) &&
    Number(radius) >= 1 &&
    Number(radius) <= 7 &&
    !hasHorizontalRadius &&
    !hasVerticalRadius
      ? Object.fromEntries([
          ...Object.entries(spatialSemanticArguments).filter(
            ([key]) => key !== "radius",
          ),
          ["horizontal_radius", Number(radius)],
          ["vertical_radius", Number(radius)],
        ])
      : spatialSemanticArguments;
  const targetSchema = input.descriptor.input_schema.properties?.target;
  const serverOwnsCurrentActorTarget =
    targetSchema?.type === "string" &&
    targetSchema.enum?.length === 1 &&
    targetSchema.enum[0] === "current_actor";
  return serverOwnsCurrentActorTarget
    ? { ...canonicalArguments, target: "current_actor" }
    : canonicalArguments;
};

const environmentProbeSemanticArgumentIssues = (input: {
  capabilityId: string;
  arguments: Record<string, unknown>;
}): EnvironmentConnectorSchemaIssue[] => {
  if (
    input.capabilityId !==
    HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY
  ) {
    return [];
  }
  const verificationFields = [
    "verification_from",
    "verification_to",
    "expected_block",
  ] as const;
  const purpose = normalized(String(input.arguments.purpose ?? ""));
  if (purpose === "structure_verification") {
    const missing = verificationFields.filter(
      (field) => input.arguments[field] === undefined,
    );
    const planningOnlyFields = [
      "requested_length",
      "requested_height",
      "orientation",
      "relative_side",
    ].filter((field) => input.arguments[field] !== undefined);
    return [
      ...missing.map((field) => ({
        path: `$.${field}`,
        code: "required_for_purpose",
        message: `${field} is required for structure_verification.`,
      })),
      ...planningOnlyFields.map((field) => ({
        path: `$.${field}`,
        code: "conflicting_property",
        message: `${field} is a planning argument and cannot be mixed with structure_verification.`,
      })),
    ];
  }
  return verificationFields
    .filter((field) => input.arguments[field] !== undefined)
    .map((field) => ({
      path: `$.${field}`,
      code: "conflicting_property",
      message: `${field} is admitted only when purpose is structure_verification.`,
    }));
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

const bindingIdentityMismatchReasons = (input: {
  binding: SharedLiveRoomRunRoomBinding;
  membership: SharedRealtimeRoomMembership;
}): string[] => [
  input.binding.authorizedByProfileId !== input.membership.profileId
    ? "profile_identity_changed"
    : null,
  input.binding.participantIdAtBind !== input.membership.participantId
    ? "participant_identity_changed"
    : null,
  input.binding.memberRoleAtBind !== input.membership.role
    ? "membership_role_changed"
    : null,
  input.binding.consentVersionAtBind !==
  input.membership.consent.consent_version
    ? "consent_version_changed"
    : null,
  input.binding.consentReceiptRefAtBind !==
  input.membership.consent.consent_receipt_ref
    ? "consent_receipt_changed"
    : null,
].filter((reason): reason is string => Boolean(reason));

const bindingIdentityMatches = (input: {
  binding: SharedLiveRoomRunRoomBinding;
  membership: SharedRealtimeRoomMembership;
}): boolean => bindingIdentityMismatchReasons(input).length === 0;

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
  result?: Record<string, unknown>;
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
  result: input.result ?? {},
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
  result?: Record<string, unknown>;
  status?: "blocked" | "failed";
  schemaRepair?: EnvironmentProbeSchemaRepair;
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
    ...(input.result || input.schemaRepair
      ? {
          result: {
            ...(input.result ?? {}),
            ...(input.schemaRepair
              ? { schema_repair: input.schemaRepair }
              : {}),
          },
        }
      : {}),
  }),
  ...(input.schemaRepair ? { schemaRepair: input.schemaRepair } : {}),
  error: input.outcome,
});

const buildEnvironmentProbeSchemaRepair = (input: {
  turnId: string;
  capabilityId: string;
  descriptor: NonNullable<
    ReturnType<typeof readEnvironmentConnectorCapabilityDescriptor>
  >;
  arguments: Record<string, unknown>;
  issues: EnvironmentConnectorSchemaIssue[];
  admittedCapabilityIds: readonly string[];
  dropPositionForCurrentFocusConflict?: boolean;
}): EnvironmentProbeSchemaRepair => {
  const properties = input.descriptor.input_schema.properties ?? {};
  const allowedFields = Object.keys(properties).sort();
  const allowed = new Set(allowedFields);
  const proposedArguments = Object.fromEntries(
    Object.entries(input.arguments).filter(([key]) => allowed.has(key)),
  );
  if (input.dropPositionForCurrentFocusConflict) {
    delete proposedArguments.position;
  }
  const semanticConflictFields = input.issues.flatMap((issue) => {
    if (issue.code !== "conflicting_property") {
      return [];
    }
    const match = /^\$\.([A-Za-z0-9_]+)$/.exec(issue.path);
    return match && Object.prototype.hasOwnProperty.call(proposedArguments, match[1])
      ? [match[1]]
      : [];
  });
  for (const field of semanticConflictFields) {
    delete proposedArguments[field];
  }
  const proposedIssues = [
    ...validateEnvironmentConnectorSchemaValue(
      input.descriptor.input_schema,
      proposedArguments,
    ),
    ...environmentProbeSemanticArgumentIssues({
      capabilityId: input.capabilityId,
      arguments: proposedArguments,
    }),
  ];
  const proposedIsValid = proposedIssues.length === 0;
  const affordanceId = syntheticRef(
    "environment_probe_schema_repair",
    `${input.turnId}\n${input.capabilityId}\n${JSON.stringify(proposedArguments)}`,
  );
  const admitted = new Set(input.admittedCapabilityIds);
  const rejectedFields = Array.from(
    new Set([
      ...Object.keys(input.arguments).filter((key) => !allowed.has(key)),
      ...semanticConflictFields,
    ]),
  ).sort();
  const migratedAffordances = listEnvironmentConnectorCapabilityDescriptors()
    .filter(
      (candidate) =>
        candidate.capability_id !== input.capabilityId &&
        candidate.domain === input.descriptor.domain &&
        candidate.capability_class === "probe" &&
        candidate.read_only === true &&
        candidate.side_effects_allowed === false &&
        admitted.has(candidate.capability_id),
    )
    .map((candidate) => {
      const candidateAllowed = new Set(
        Object.keys(candidate.input_schema.properties ?? {}),
      );
      const candidateArguments = Object.fromEntries(
        Object.entries(input.arguments).filter(([key]) =>
          candidateAllowed.has(key),
        ),
      );
      const preservedRejectedFields = rejectedFields.filter(
        (field) =>
          candidateAllowed.has(field) &&
          Object.prototype.hasOwnProperty.call(candidateArguments, field),
      );
      const candidateIssues = [
        ...validateEnvironmentConnectorSchemaValue(
          candidate.input_schema,
          candidateArguments,
        ),
        ...environmentProbeSemanticArgumentIssues({
          capabilityId: candidate.capability_id,
          arguments: candidateArguments,
        }),
      ];
      return {
        descriptor: candidate,
        arguments: candidateArguments,
        preservedRejectedFields,
        candidateIssues,
      };
    })
    .filter(
      (candidate) =>
        candidate.preservedRejectedFields.length > 0 &&
        candidate.candidateIssues.length === 0,
    )
    .sort(
      (left, right) =>
        right.preservedRejectedFields.length -
          left.preservedRejectedFields.length ||
        Object.keys(right.arguments).length -
          Object.keys(left.arguments).length ||
        left.descriptor.capability_id.localeCompare(
          right.descriptor.capability_id,
        ),
    )
    .slice(0, 3)
    .map((candidate) => ({
      affordance_id: syntheticRef(
        "environment_probe_schema_migration",
        `${input.turnId}\n${input.capabilityId}\n${candidate.descriptor.capability_id}\n${JSON.stringify(candidate.arguments)}`,
      ),
      capability_id: candidate.descriptor.capability_id,
      args: candidate.arguments,
      lane_request: {
        capability: candidate.descriptor.capability_id,
        ...candidate.arguments,
      },
      admissible: true as const,
      reason:
        `The rejected fields ${candidate.preservedRejectedFields.join(", ")} belong to this already-admitted read-only capability. ` +
        "Use it instead of discarding the user's requested scope; Helix will validate it again before execution.",
    }));
  const sameCapabilityAffordance = proposedIsValid
    ? [
        {
          affordance_id: affordanceId,
          capability_id: input.capabilityId,
          args: proposedArguments,
          lane_request: {
            capability: input.capabilityId,
            ...proposedArguments,
          },
          admissible: true as const,
          reason:
            "Retry the same admitted read-only probe with only fields admitted by the frozen schema and semantic contract; Helix will validate it again before execution.",
        },
      ]
    : [];
  const nextAffordances = [
    ...migratedAffordances,
    ...sameCapabilityAffordance,
  ];
  return {
    schema: "helix.environment_probe_schema_repair.v1",
    capability_id: input.capabilityId,
    failure_class: "invalid_args",
    retryability: "retryable",
    issues: input.issues.slice(0, 12),
    rejected_fields: rejectedFields,
    allowed_fields: allowedFields,
    required_fields: [...(input.descriptor.input_schema.required ?? [])].sort(),
    trusted_input_schema: input.descriptor.input_schema,
    proposed_arguments: proposedIsValid ? proposedArguments : null,
    next_affordances: nextAffordances,
  };
};

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
  HELIX_MINECRAFT_READ_ONLY_CAPABILITY_IDS.map((capabilityId) =>
    environmentProbeManifestForCapability(capabilityId),
  );

export const environmentProbeMinecraftInventoryManifest =
  environmentProbeMinecraftManifests.find(
    (manifest) =>
      manifest.capability_id === HELIX_MINECRAFT_INVENTORY_CHECK_CAPABILITY,
    )!;

export const environmentProbeFailureRepairAction = (
  error: string | null | undefined,
): "retry" | "ask_user" =>
  [
    "connector_offline",
    "probe_timeout",
    "schema_validation_failed",
    "current_turn_reentry_ineligible",
    "result_stale",
  ].includes(String(error ?? "").trim())
    ? "retry"
    : "ask_user";

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
    entry: Omit<Parameters<typeof failed>[0], "turnId" | "capabilityId">,
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
      summary: `The current continuation is not scoped to ${capabilityId}.`,
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
  const args = normalizeEnvironmentProbeSemanticArguments({
    descriptor,
    arguments: input.arguments ?? {},
  });
  const inputIssues = [
    ...validateEnvironmentConnectorSchemaValue(descriptor.input_schema, args),
    ...environmentProbeSemanticArgumentIssues({
      capabilityId,
      arguments: args,
    }),
  ];
  if (
    inputIssues.length > 0 ||
    (args.target === "current_focus" && args.position !== undefined)
  ) {
    const currentFocusConflict =
      inputIssues.length === 0 &&
      args.target === "current_focus" &&
      args.position !== undefined;
    const repairIssues: EnvironmentConnectorSchemaIssue[] =
      inputIssues.length > 0
        ? inputIssues
        : [
            {
              path: "$.position",
              code: "conflicting_property",
              message:
                "A current-focus crop probe cannot also supply a position.",
            },
          ];
    const schemaRepair = buildEnvironmentProbeSchemaRepair({
      turnId,
      capabilityId,
      descriptor,
      arguments: args,
      issues: repairIssues,
      admittedCapabilityIds:
        policy?.allowedCapabilities ??
        accountPolicy.allowed_workstation_capabilities,
      dropPositionForCurrentFocusConflict: currentFocusConflict,
    });
    return fail({
      outcome: "schema_validation_failed",
      summary:
        inputIssues.length > 0
          ? `The probe arguments failed the trusted schema at ${inputIssues[0].path}.`
          : "A current-focus crop probe cannot also supply a position.",
      status: "failed",
      schemaRepair,
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
    const trustedTurnActor =
      authority.kind === "first_party_shared_room"
        ? (input.accountContext?.trusted_turn_actor_context ?? null)
        : null;
    const environmentInteractionActor =
      trustedTurnActor?.origin === "environment_interaction"
        ? trustedTurnActor
        : null;
    if (environmentInteractionActor) {
      if (
        environmentInteractionActor.room_id !== roomId ||
        environmentInteractionActor.requester_profile_id !==
          authority.accountProfileId ||
        environmentInteractionActor.resolution !== "resolved" ||
        !environmentInteractionActor.participant_id
      ) {
        return fail({
          outcome: "permission_revoked",
          summary:
            "The authenticated in-game participant identity no longer matches this room-scoped turn.",
        });
      }
      try {
        // The authenticated Minecraft request is itself an active room client.
        // Refresh only its exact membership immediately before the probe so a
        // slow model step cannot turn ordinary presence aging into revocation.
        // Explicit leave, room closure, or inaccessible membership still fail
        // closed inside the room store and consent is checked below.
        await deps.refreshPresence({
          roomId,
          profileId: authority.accountProfileId,
          presence: "present",
        });
      } catch {
        return fail({
          outcome: "permission_revoked",
          summary:
            "The authenticated in-game participant is no longer eligible to remain present in this room.",
        });
      }
    }
    const membership = await deps.readMembership({
      roomId,
      profileId: authority.accountProfileId,
    });
    const bindingMismatchReasons =
      binding && membership
        ? bindingIdentityMismatchReasons({ binding, membership })
        : [];
    const interactionParticipantMismatch = Boolean(
      environmentInteractionActor &&
        membership &&
        membership.participantId !== environmentInteractionActor.participant_id,
    );
    if (
      !membership ||
      membership.roomStatus === "closed" ||
      bindingMismatchReasons.length > 0 ||
      interactionParticipantMismatch ||
      (!binding && membership.presence !== "present")
    ) {
      return fail({
        outcome: "permission_revoked",
        summary:
          "The room membership or consent that authorized this run binding changed.",
        result: {
          binding_identity_mismatch_reasons:
            bindingMismatchReasons.length > 0
              ? bindingMismatchReasons
              : [
                  !membership
                    ? "membership_missing"
                    : membership.roomStatus === "closed"
                      ? "room_closed"
                      : interactionParticipantMismatch
                        ? "participant_identity_changed"
                      : "participant_not_present",
                ],
        },
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
    const consentIdentityMismatch =
      Boolean(roomSelf) &&
      (roomSelf!.consent.consent_version !==
        membership.consent.consent_version ||
        roomSelf!.consent.consent_receipt_ref !==
          membership.consent.consent_receipt_ref);
    const boundAuthorizationMismatch =
      Boolean(binding && roomSelf) &&
      (roomSelf!.participant_id !== binding!.participantIdAtBind ||
        roomSelf!.consent.consent_version !== binding!.consentVersionAtBind ||
        roomSelf!.consent.consent_receipt_ref !==
          binding!.consentReceiptRefAtBind);
    const firstPartyPresenceMismatch =
      !binding && Boolean(roomSelf) && roomSelf!.presence !== "present";
    if (
      room.status === "closed" ||
      participantIdentityMismatch ||
      consentIdentityMismatch ||
      boundAuthorizationMismatch ||
      firstPartyPresenceMismatch
    ) {
      const roomIdentityMismatchReasons = [
        room.status === "closed" ? "room_closed" : null,
        participantIdentityMismatch ? "participant_identity_changed" : null,
        roomSelf &&
        roomSelf.consent.consent_version !== membership.consent.consent_version
          ? "consent_version_changed"
          : null,
        roomSelf &&
        roomSelf.consent.consent_receipt_ref !==
          membership.consent.consent_receipt_ref
          ? "consent_receipt_changed"
          : null,
        boundAuthorizationMismatch ? "bound_authorization_changed" : null,
        firstPartyPresenceMismatch ? "participant_not_present" : null,
      ].filter((reason): reason is string => Boolean(reason));
      return fail({
        outcome: "permission_revoked",
        summary:
          room.status === "closed"
            ? "The exact server-validated Shared GPT Live Room is closed."
            : participantIdentityMismatch
              ? "The current room projection no longer matches the authenticated participant identity."
              : consentIdentityMismatch || boundAuthorizationMismatch
                ? "The current room consent identity no longer matches the authorizing membership."
                : "The first-party room member is not currently present in the exact server-validated Shared GPT Live Room chat.",
        result: {
          binding_identity_mismatch_reasons: roomIdentityMismatchReasons,
        },
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
    const now = deps.now();
    const freshCandidates = candidates.filter((candidate) => {
      const sourceAgeMs =
        now.getTime() - new Date(candidate.requestReceivedAt).getTime();
      return (
        Number.isFinite(sourceAgeMs) &&
        sourceAgeMs >= 0 &&
        sourceAgeMs <= candidate.requestFreshnessMaxAgeMs
      );
    });
    if (freshCandidates.length === 0) {
      return fail({
        outcome: "result_stale",
        summary:
          "Every matching Minecraft connector admission is stale and must send a fresh observation before probing.",
        status: "failed",
      });
    }
    if (freshCandidates.length > 1) {
      return fail({
        outcome: "target_ambiguous",
        summary:
          "More than one fresh admitted Minecraft environment matches this run; bind an exact environment before probing.",
      });
    }
    const source = freshCandidates[0];
    if (!source.credentialId) {
      return fail({
        outcome: "connector_offline",
        summary:
          "The admitted source does not expose a server-owned connector credential identity.",
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
        ? (input.accountContext?.trusted_turn_actor_context ?? null)
        : null;
    let requestingParticipantId = membership.participantId;
    if (trustedTurnActorContext?.origin === "realtime_voice") {
      const frozenParticipant = trustedTurnActorContext.participant_id
        ? (room.participants.find(
            (participant) =>
              participant.participant_id ===
                trustedTurnActorContext.participant_id &&
              participant.presence === "present",
          ) ?? null)
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
          const outcome: Exclude<HelixEnvironmentProbeOutcome, "succeeded"> =
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
