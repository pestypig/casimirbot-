import {
  HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_CREATE_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_INSPECT_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_INSPECT_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_LIST_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_LIST_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_RECEIPT_SCHEMA,
  helixSharedLiveRoomIdSchema,
  helixSharedLiveRoomCreateRequestSchema,
  helixSharedLiveRoomSourceCreateRequestSchema,
} from "@shared/contracts/helix-shared-live-room-agent.v1";
import { computeCasimirSpecValueSha256V1 } from
  "@shared/contracts/casimir-spec-scientific-claim-ir.v1";
import {
  SharedLiveRoomControlError,
  SharedLiveRoomControlService,
  buildSharedLiveRoomControlActorFromAccountContext,
} from "../../shared-live-room-control/service";
import { getSharedLiveRoomControlService } from
  "../../shared-live-room-control/default-service";
import { redactSharedLiveRoomSensitiveValue } from
  "../../shared-live-room-control/sensitive-text";
import {
  createRuntimeToolConfirmationReceiptVerifierV1,
  type RuntimeToolConfirmationConsumeResultV1,
} from "../../theory/runtime-tool-confirmation-receipt-verifier";
import type {
  HelixWorkstationGatewayAccountContext,
} from "./account-policy";
import type {
  HelixWorkstationCapabilityManifest,
} from "./types";

export const SHARED_LIVE_ROOM_GATEWAY_CAPABILITIES = new Set<string>([
  HELIX_SHARED_LIVE_ROOM_LIST_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_INSPECT_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY,
]);

const roomIdProperty = {
  type: "string",
  minLength: 1,
  maxLength: 200,
  pattern: "^shared_realtime_room:[a-zA-Z0-9._:-]+$",
} as const;

const commonManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  panel_id: null,
  code_mutation: false,
  shell_access: false,
  requires_source: false,
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
} as const;

export const sharedLiveRoomGatewayManifests:
  HelixWorkstationCapabilityManifest[] = [
    {
      ...commonManifest,
      capability_id: HELIX_SHARED_LIVE_ROOM_LIST_CAPABILITY,
      label: "List my Shared Live Rooms",
      description:
        "Lists only Shared Live Rooms admitted by the authenticated account policy. The result is an observation, not an answer.",
      action_id: "list_shared_live_rooms",
      mode: "read",
      mutating: false,
      requires_confirmation: false,
      permission_profile_required: "read",
      input_schema: {
        type: "object",
        additionalProperties: false,
        properties: {},
      },
      output_observation_schema: HELIX_SHARED_LIVE_ROOM_LIST_RECEIPT_SCHEMA,
      observation_schema: HELIX_SHARED_LIVE_ROOM_LIST_RECEIPT_SCHEMA,
      safety_tags: [
        "read_only",
        "account_derived_identity",
        "room_membership_required",
        "no_shell",
        "no_code_mutation",
        "non_terminal",
      ],
    },
    {
      ...commonManifest,
      capability_id: HELIX_SHARED_LIVE_ROOM_INSPECT_CAPABILITY,
      label: "Inspect a Shared Live Room",
      description:
        "Reads one member-authorized Shared Live Room by opaque room ID. Account and membership identity are derived by the server.",
      action_id: "inspect_shared_live_room",
      mode: "read",
      mutating: false,
      requires_confirmation: false,
      permission_profile_required: "read",
      input_schema: {
        type: "object",
        additionalProperties: false,
        required: ["room_id"],
        properties: { room_id: roomIdProperty },
      },
      output_observation_schema: HELIX_SHARED_LIVE_ROOM_INSPECT_RECEIPT_SCHEMA,
      observation_schema: HELIX_SHARED_LIVE_ROOM_INSPECT_RECEIPT_SCHEMA,
      safety_tags: [
        "read_only",
        "account_derived_identity",
        "room_membership_required",
        "no_shell",
        "no_code_mutation",
        "non_terminal",
      ],
    },
    {
      ...commonManifest,
      capability_id: HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY,
      label: "Create a Shared Live Room",
      description:
        "Creates one account-owned Shared Live Room through the shared lifecycle service. Requires a stable idempotency key.",
      action_id: "create_shared_live_room",
      mode: "act",
      mutating: true,
      requires_confirmation: true,
      permission_profile_required: "act",
      input_schema: {
        type: "object",
        additionalProperties: false,
        required: ["idempotency_key"],
        properties: {
          idempotency_key: {
            type: "string",
            minLength: 8,
            maxLength: 200,
          },
          title: { type: "string", minLength: 1, maxLength: 120 },
        },
      },
      output_observation_schema: HELIX_SHARED_LIVE_ROOM_CREATE_RECEIPT_SCHEMA,
      observation_schema: HELIX_SHARED_LIVE_ROOM_CREATE_RECEIPT_SCHEMA,
      safety_tags: [
        "mutating",
        "idempotent",
        "confirmation_required",
        "account_derived_identity",
        "no_shell",
        "no_code_mutation",
        "non_terminal",
      ],
    },
    {
      ...commonManifest,
      capability_id: HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_CAPABILITY,
      label: "List room source bindings",
      description:
        "Lists owner-authorized source bindings without credentials or raw source payloads.",
      action_id: "list_shared_live_room_sources",
      mode: "read",
      mutating: false,
      requires_confirmation: false,
      permission_profile_required: "read",
      input_schema: {
        type: "object",
        additionalProperties: false,
        required: ["room_id"],
        properties: { room_id: roomIdProperty },
      },
      output_observation_schema:
        HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_RECEIPT_SCHEMA,
      observation_schema: HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_RECEIPT_SCHEMA,
      safety_tags: [
        "read_only",
        "developer_owner_required",
        "no_credentials",
        "no_shell",
        "no_code_mutation",
        "non_terminal",
      ],
    },
    {
      ...commonManifest,
      capability_id: HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY,
      label: "Create a room source binding",
      description:
        "Creates an observation-only environment source binding. It returns a short-lived browser claim handle and never returns the source bearer.",
      action_id: "create_shared_live_room_source",
      mode: "act",
      mutating: true,
      requires_confirmation: true,
      permission_profile_required: "act",
      input_schema: {
        type: "object",
        additionalProperties: false,
        required: ["room_id", "idempotency_key"],
        properties: {
          room_id: roomIdProperty,
          idempotency_key: {
            type: "string",
            minLength: 8,
            maxLength: 200,
          },
          world_id: { type: "string", minLength: 1, maxLength: 160 },
          domain_adapter: { type: "string", minLength: 1, maxLength: 160 },
          source_label: { type: "string", minLength: 1, maxLength: 120 },
          ttl_ms: {
            type: "number",
            minimum: 1,
            maximum: 30 * 24 * 60 * 60 * 1_000,
          },
        },
      },
      output_observation_schema:
        HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_RECEIPT_SCHEMA,
      observation_schema: HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_RECEIPT_SCHEMA,
      safety_tags: [
        "mutating",
        "idempotent",
        "confirmation_required",
        "developer_owner_required",
        "credential_handle_only",
        "command_execution_disabled",
        "no_shell",
        "no_code_mutation",
        "non_terminal",
      ],
    },
  ];

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const service = getSharedLiveRoomControlService();
const MUTATION_APPROVAL_SCHEMA =
  "helix.shared_live_room.mutation_approval_material.v1" as const;

type SharedLiveRoomGatewayConfirmationVerifier = {
  consume(input: {
    receipt?: unknown;
    legacyApprovalToken?: string | null;
    expectedBinding: {
      capabilityId: string;
      planId: string;
      accountType: "developer" | "user";
      profileId: string;
      sessionId: string;
      turnId: string;
      sealedInputSha256: string;
    };
  }): Promise<RuntimeToolConfirmationConsumeResultV1>;
};

export type SharedLiveRoomGatewayConfirmationDependencies = Parameters<
  typeof createRuntimeToolConfirmationReceiptVerifierV1
>[0];

let defaultConfirmationVerifier =
  createRuntimeToolConfirmationReceiptVerifierV1();

/**
 * Trusted server-composition seam. It installs only receipt verification and
 * replay-ledger dependencies; callers cannot provide it through tool args.
 */
export const installSharedLiveRoomGatewayConfirmationDependenciesForServerV1 =
  (
    dependencies: SharedLiveRoomGatewayConfirmationDependencies,
  ): void => {
    defaultConfirmationVerifier =
      createRuntimeToolConfirmationReceiptVerifierV1(dependencies);
  };

const readIdempotencyKey = (value: unknown): string => {
  const key = readString(value);
  if (
    key.length < 8 ||
    key.length > 200 ||
    /[\u0000-\u001f\u007f]/.test(key)
  ) {
    throw new SharedLiveRoomControlError(
      400,
      "invalid_request",
      "A stable idempotency key between 8 and 200 characters is required.",
    );
  }
  return key;
};

export type SharedLiveRoomGatewayMutationApprovalPlanV1 = {
  schema: typeof MUTATION_APPROVAL_SCHEMA;
  capabilityId:
    | typeof HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY
    | typeof HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY;
  planId: string;
  sealedInputSha256: string;
  canonicalArguments: Record<string, unknown>;
};

/**
 * Produces the exact effective mutation material used by both receipt binding
 * and execution. Unknown/no-op caller fields are intentionally excluded.
 */
export const buildSharedLiveRoomGatewayMutationApprovalPlanV1 = async (input: {
  capabilityId: string;
  args: Record<string, unknown>;
}): Promise<SharedLiveRoomGatewayMutationApprovalPlanV1> => {
  let capabilityId:
    | typeof HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY
    | typeof HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY;
  let canonicalArguments: Record<string, unknown>;

  if (input.capabilityId === HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY) {
    capabilityId = HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY;
    const request = helixSharedLiveRoomCreateRequestSchema.parse({
      ...(input.args.title === undefined ? {} : { title: input.args.title }),
    });
    canonicalArguments = {
      idempotency_key: readIdempotencyKey(input.args.idempotency_key),
      ...request,
    };
  } else if (
    input.capabilityId === HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY
  ) {
    capabilityId = HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY;
    const request = helixSharedLiveRoomSourceCreateRequestSchema.parse({
      ...(input.args.world_id === undefined
        ? {}
        : { world_id: input.args.world_id }),
      ...(input.args.domain_adapter === undefined
        ? {}
        : { domain_adapter: input.args.domain_adapter }),
      ...(input.args.source_label === undefined
        ? {}
        : { source_label: input.args.source_label }),
      ...(input.args.ttl_ms === undefined
        ? {}
        : { ttl_ms: input.args.ttl_ms }),
    });
    canonicalArguments = {
      room_id: helixSharedLiveRoomIdSchema.parse(input.args.room_id),
      idempotency_key: readIdempotencyKey(input.args.idempotency_key),
      ...request,
    };
  } else {
    throw new SharedLiveRoomControlError(
      400,
      "invalid_request",
      "Shared Live Room mutation capability is not registered.",
    );
  }

  const sealedInputSha256 = await computeCasimirSpecValueSha256V1({
    domain: "helix-shared-live-room-gateway-mutation-input/v1",
    capabilityId,
    arguments: canonicalArguments,
  });
  return {
    schema: MUTATION_APPROVAL_SCHEMA,
    capabilityId,
    planId: `shared-live-room-mutation:${sealedInputSha256}`,
    sealedInputSha256,
    canonicalArguments,
  };
};

const requireMutationConfirmation = async (input: {
  plan: SharedLiveRoomGatewayMutationApprovalPlanV1;
  accountType: "developer" | "user";
  profileId: string;
  sessionId: string | null;
  turnId: string | null | undefined;
  approvalReceipt?: unknown;
  approvalToken?: string | null;
  confirmationVerifier: SharedLiveRoomGatewayConfirmationVerifier;
}): Promise<void> => {
  const sessionId = readString(input.sessionId);
  const turnId = readString(input.turnId);
  if (!sessionId || !turnId) {
    throw new SharedLiveRoomControlError(
      403,
      "confirmation_invalid",
      "Current account, session, and turn identity are required for this mutation.",
      false,
      {
        approval_issues: [
          "runtime_approval_receipt_binding_context_missing",
        ],
      },
    );
  }
  const confirmation = await input.confirmationVerifier.consume({
    receipt: input.approvalReceipt,
    legacyApprovalToken: input.approvalToken,
    expectedBinding: {
      capabilityId: input.plan.capabilityId,
      planId: input.plan.planId,
      accountType: input.accountType,
      profileId: input.profileId,
      sessionId,
      turnId,
      sealedInputSha256: input.plan.sealedInputSha256,
    },
  });
  if (confirmation.ok) return;
  const needsConfirmation = confirmation.status === "needs_confirmation";
  throw new SharedLiveRoomControlError(
    needsConfirmation ? 409 : 403,
    needsConfirmation ? "confirmation_required" : "confirmation_invalid",
    needsConfirmation
      ? "Explicit trusted-runtime confirmation is required before this mutation."
      : "The trusted-runtime confirmation is invalid for this mutation.",
    false,
    { approval_issues: confirmation.issues },
  );
};

export type SharedLiveRoomGatewayExecution = {
  ok: boolean;
  status: "completed" | "blocked" | "failed";
  summary: string;
  observation: Record<string, unknown>;
  error?: string;
};

export const executeSharedLiveRoomGatewayCapability = async (input: {
  capabilityId: string;
  args: Record<string, unknown>;
  accountContext: HelixWorkstationGatewayAccountContext | null | undefined;
  approvalReceipt?: unknown;
  approvalToken?: string | null;
  turnId?: string | null;
  controlService?: SharedLiveRoomControlService;
  confirmationVerifier?: SharedLiveRoomGatewayConfirmationVerifier;
}): Promise<SharedLiveRoomGatewayExecution> => {
  try {
    if (!input.accountContext) {
      throw new SharedLiveRoomControlError(
        401,
        "account_policy_blocked",
        "A server-derived signed-in account context is required.",
      );
    }
    const actor = buildSharedLiveRoomControlActorFromAccountContext(
      input.accountContext,
    );
    const control = input.controlService ?? service;
    let observation: Record<string, unknown>;
    if (input.capabilityId === HELIX_SHARED_LIVE_ROOM_LIST_CAPABILITY) {
      observation = await control.listRooms({ actor });
    } else if (
      input.capabilityId === HELIX_SHARED_LIVE_ROOM_INSPECT_CAPABILITY
    ) {
      observation = await control.inspectRoom({
        actor,
        roomId: readString(input.args.room_id),
      });
    } else if (
      input.capabilityId === HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY
    ) {
      const plan = await buildSharedLiveRoomGatewayMutationApprovalPlanV1({
        capabilityId: input.capabilityId,
        args: input.args,
      });
      await requireMutationConfirmation({
        plan,
        accountType: actor.accountType,
        profileId: actor.profileId,
        sessionId: actor.sessionId,
        turnId: input.turnId,
        approvalReceipt: input.approvalReceipt,
        approvalToken: input.approvalToken,
        confirmationVerifier:
          input.confirmationVerifier ?? defaultConfirmationVerifier,
      });
      observation = (
        await control.createRoom({
          actor,
          idempotencyKey: readString(
            plan.canonicalArguments.idempotency_key,
          ),
          request: helixSharedLiveRoomCreateRequestSchema.parse({
            ...(plan.canonicalArguments.title === undefined
              ? {}
              : { title: plan.canonicalArguments.title }),
          }),
        })
      ).body;
    } else if (
      input.capabilityId === HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_CAPABILITY
    ) {
      observation = await control.listSourceBindings({
        actor,
        roomId: readString(input.args.room_id),
      });
    } else if (
      input.capabilityId === HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY
    ) {
      const plan = await buildSharedLiveRoomGatewayMutationApprovalPlanV1({
        capabilityId: input.capabilityId,
        args: input.args,
      });
      await requireMutationConfirmation({
        plan,
        accountType: actor.accountType,
        profileId: actor.profileId,
        sessionId: actor.sessionId,
        turnId: input.turnId,
        approvalReceipt: input.approvalReceipt,
        approvalToken: input.approvalToken,
        confirmationVerifier:
          input.confirmationVerifier ?? defaultConfirmationVerifier,
      });
      observation = (
        await control.createSourceBinding({
          actor,
          roomId: readString(plan.canonicalArguments.room_id),
          idempotencyKey: readString(
            plan.canonicalArguments.idempotency_key,
          ),
          request: helixSharedLiveRoomSourceCreateRequestSchema.parse({
            ...(plan.canonicalArguments.world_id === undefined
              ? {}
              : { world_id: plan.canonicalArguments.world_id }),
            ...(plan.canonicalArguments.domain_adapter === undefined
              ? {}
              : {
                  domain_adapter:
                    plan.canonicalArguments.domain_adapter,
                }),
            ...(plan.canonicalArguments.source_label === undefined
              ? {}
              : { source_label: plan.canonicalArguments.source_label }),
            ...(plan.canonicalArguments.ttl_ms === undefined
              ? {}
              : { ttl_ms: plan.canonicalArguments.ttl_ms }),
          }),
        })
      ).body;
    } else {
      throw new SharedLiveRoomControlError(
        400,
        "invalid_request",
        "Shared Live Room capability is not registered.",
      );
    }
    return {
      ok: true,
      status: "completed",
      summary: `Shared Live Room capability ${input.capabilityId} completed with a nonterminal observation.`,
      observation,
    };
  } catch (error) {
    const normalized =
      error instanceof SharedLiveRoomControlError
        ? error
        : new SharedLiveRoomControlError(
            400,
            "invalid_request",
            "Shared Live Room capability input is invalid.",
          );
    return {
      ok: false,
      status:
        normalized.status === 401 ||
        normalized.status === 403 ||
        normalized.status === 404 ||
        normalized.status === 409 ||
        normalized.status === 410
          ? "blocked"
          : "failed",
      summary: normalized.message,
      observation: {
        schema: "helix.shared_live_room.gateway_error.v1",
        ok: false,
        error: normalized.code,
        message: normalized.message,
        retryable: normalized.retryable,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        ...(normalized.details
          ? {
              details: redactSharedLiveRoomSensitiveValue(
                normalized.details,
              ),
            }
          : {}),
      },
      error: normalized.code,
    };
  }
};
