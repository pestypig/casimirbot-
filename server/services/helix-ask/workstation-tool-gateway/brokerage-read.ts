import {
  HELIX_BROKERAGE_OBSERVATION_SCHEMA,
  HELIX_BROKERAGE_READ_GATEWAY_CAPABILITY,
  HELIX_BROKERAGE_READ_GATEWAY_ERROR_SCHEMA,
  HELIX_ROBINHOOD_READ_ONLY_UPSTREAM_TOOLS,
  HELIX_ROBINHOOD_READ_TOOL_CAPABILITY,
  helixBrokerageObservationSchema,
  type HelixBrokerageObservation,
  type HelixRobinhoodReadOnlyUpstreamTool,
} from "@shared/helix-brokerage-environment";
import {
  executeRobinhoodPrivateRoomRead,
} from "../../brokerage/robinhood-read-adapter";
import {
  RobinhoodConnectionError,
  assertRobinhoodPrivateRoomReadCapability,
  listPrivateRoomRobinhoodBindings,
} from "../../brokerage/robinhood-connection-store";
import type { HelixWorkstationGatewayAccountContext } from "./account-policy";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const HELIX_BROKERAGE_READ_GATEWAY_ACTION =
  "room.environment.brokerage.read" as const;

export const brokerageReadManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: HELIX_BROKERAGE_READ_GATEWAY_CAPABILITY,
  label: "Read a private-room Robinhood observation",
  description:
    "Run one allowlisted, non-mutating Robinhood read for the signed-in developer's active private-room connection. The credential-free observation must re-enter Codex and is never financial advice, an order, or an assistant answer.",
  panel_id: "account-session",
  action_id: HELIX_BROKERAGE_READ_GATEWAY_ACTION,
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    properties: {
      connection_id: {
        type: "string",
        minLength: 1,
        maxLength: 320,
        pattern: "^[a-zA-Z0-9:._/-]+$",
        description:
          "Optional sanitized profile-owned Robinhood connection identifier. Omit it when the current private room has exactly one active Robinhood binding; Helix resolves that identity server-side.",
      },
      upstream_tool: {
        type: "string",
        enum: [...HELIX_ROBINHOOD_READ_ONLY_UPSTREAM_TOOLS],
        description:
          "One reviewed Robinhood read tool. Account-number reads, reviews, approvals, placements, cancellations, and other mutations are absent.",
      },
      upstream_arguments: {
        type: "object",
        maxProperties: 100,
        description:
          "Bounded arguments for the selected upstream read tool. Profile, room, credentials, producer epoch, and authority cannot be supplied here.",
      },
    },
    required: ["upstream_tool"],
    additionalProperties: false,
  },
  output_observation_schema: HELIX_BROKERAGE_OBSERVATION_SCHEMA,
  observation_schema: HELIX_BROKERAGE_OBSERVATION_SCHEMA,
  safety_tags: [
    "developer_only",
    "owner_private_room_required",
    "server_derived_profile_and_room",
    "allowlisted_read_only_upstream_tool",
    "credential_and_account_number_redaction",
    "fresh_current_turn_evidence_reentry_required",
    "no_financial_advice_authority",
    "no_order_review_or_execution",
    "no_shell",
    "no_code_mutation",
    "non_terminal",
  ],
  assistant_answer: false,
  raw_content_included: false,
};

const roomIdFromThread = (threadId: string | null | undefined): string | null => {
  const prefix = "helix-ask:room:";
  const normalized = threadId?.trim() ?? "";
  return normalized.startsWith(prefix)
    ? normalized.slice(prefix.length).trim() || null
    : null;
};

const cleanIdentifier = (value: unknown): string | null =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.trim().length <= 320 &&
  /^[a-zA-Z0-9:._/-]+$/u.test(value.trim())
    ? value.trim()
    : null;

const readArguments = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

export type BrokerageReadGatewayErrorObservation = {
  schema: typeof HELIX_BROKERAGE_READ_GATEWAY_ERROR_SCHEMA;
  ok: false;
  environment_domain: "brokerage";
  provider: "robinhood";
  error: string;
  summary: string;
  retryable: boolean;
  credential_included: false;
  account_numbers_included: false;
  raw_provider_payload_included: false;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type BrokerageReadGatewayExecution = {
  ok: boolean;
  status: "completed" | "blocked" | "failed";
  summary: string;
  observation: HelixBrokerageObservation | BrokerageReadGatewayErrorObservation;
  sourceBindingId?: string;
  executedArgs?: Record<string, unknown>;
  repairAction?: "repair" | "retry" | "ask_user";
  error?: string;
};

export type BrokerageReadGatewayDependencies = {
  executeRead: typeof executeRobinhoodPrivateRoomRead;
  assertReadCapability: typeof assertRobinhoodPrivateRoomReadCapability;
  listBindings: typeof listPrivateRoomRobinhoodBindings;
  now: () => Date;
};

type PrivateRoomRobinhoodBinding = Awaited<
  ReturnType<typeof listPrivateRoomRobinhoodBindings>
>["bindings"][number];

const OBSERVATION_MAX_AGE_MS = 30_000;
const OBSERVATION_MAX_FUTURE_SKEW_MS = 5_000;

const errorObservation = (input: {
  error: string;
  summary: string;
  retryable?: boolean;
}): BrokerageReadGatewayErrorObservation => ({
  schema: HELIX_BROKERAGE_READ_GATEWAY_ERROR_SCHEMA,
  ok: false,
  environment_domain: "brokerage",
  provider: "robinhood",
  error: input.error,
  summary: input.summary,
  retryable: input.retryable ?? false,
  credential_included: false,
  account_numbers_included: false,
  raw_provider_payload_included: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

export const executeBrokerageReadGatewayCapability = async (input: {
  arguments?: Record<string, unknown>;
  accountContext?: HelixWorkstationGatewayAccountContext | null;
  conversationThreadId?: string | null;
  dependencies?: Partial<BrokerageReadGatewayDependencies>;
}): Promise<BrokerageReadGatewayExecution> => {
  const account = input.accountContext;
  const profileId = account?.profile_id?.trim() ?? "";
  const roomId = roomIdFromThread(input.conversationThreadId);
  if (
    !account?.trusted_account_session ||
    !account.account_session ||
    account.account_session.status !== "active" ||
    account.account_session.profile.profile_id !== profileId ||
    account.account_policy.account_type !== "developer" ||
    !account.account_policy.feature_flags.includes("brokerage_environment") ||
    !roomId
  ) {
    const summary =
      "Brokerage reads require an active signed-in developer session and an exact Shared Live Room turn.";
    return {
      ok: false,
      status: "blocked",
      summary,
      observation: errorObservation({
        error: "brokerage_auth_required",
        summary,
      }),
      repairAction: "ask_user",
      error: "brokerage_auth_required",
    };
  }

  const requestedConnectionId = input.arguments?.connection_id === undefined
    ? null
    : cleanIdentifier(input.arguments.connection_id);
  const upstreamTool =
    typeof input.arguments?.upstream_tool === "string" &&
    HELIX_ROBINHOOD_READ_ONLY_UPSTREAM_TOOLS.includes(
      input.arguments.upstream_tool as HelixRobinhoodReadOnlyUpstreamTool,
    )
      ? input.arguments.upstream_tool as HelixRobinhoodReadOnlyUpstreamTool
      : null;
  const upstreamArguments = input.arguments?.upstream_arguments === undefined
    ? {}
    : readArguments(input.arguments.upstream_arguments);
  if (
    (input.arguments?.connection_id !== undefined && !requestedConnectionId) ||
    !upstreamTool ||
    !upstreamArguments
  ) {
    const summary =
      "The brokerage read request may name one sanitized connection and must name one allowlisted read tool with bounded object arguments.";
    return {
      ok: false,
      status: "blocked",
      summary,
      observation: errorObservation({
        error: "brokerage_capability_denied",
        summary,
      }),
      repairAction: "repair",
      error: "brokerage_capability_denied",
    };
  }

  try {
    const bindingList = await (
      input.dependencies?.listBindings ?? listPrivateRoomRobinhoodBindings
    )({ ownerProfileId: profileId, roomId });
    const activeBindings = bindingList.bindings.filter(
      (binding: PrivateRoomRobinhoodBinding) =>
      binding.status === "active" &&
      binding.privacy_state === "owner_private" &&
      (!requestedConnectionId || binding.connection_id === requestedConnectionId),
    );
    if (activeBindings.length !== 1) {
      const code = activeBindings.length === 0
        ? "brokerage_connection_not_ready"
        : "brokerage_connection_ambiguous";
      const summary = activeBindings.length === 0
        ? "The current private room has no active Robinhood binding matching this request."
        : "The current private room has multiple active Robinhood bindings; select one sanitized connection identifier.";
      return {
        ok: false,
        status: "blocked",
        summary,
        observation: errorObservation({ error: code, summary }),
        repairAction: "ask_user",
        error: code,
      };
    }
    const connectionId = activeBindings[0].connection_id;
    const sourceBindingId = activeBindings[0].binding_id;
    const capabilityId = HELIX_ROBINHOOD_READ_TOOL_CAPABILITY[upstreamTool];
    const assertReadCapability = input.dependencies?.assertReadCapability ??
      assertRobinhoodPrivateRoomReadCapability;
    const before = await assertReadCapability({
      ownerProfileId: profileId,
      connectionId,
      roomId,
      capabilityId,
    });
    const observation = await (
      input.dependencies?.executeRead ?? executeRobinhoodPrivateRoomRead
    )({
      ownerProfileId: profileId,
      connectionId,
      roomId,
      toolName: upstreamTool,
      arguments: upstreamArguments,
    });
    const parsed = helixBrokerageObservationSchema.safeParse(observation);
    const after = await assertReadCapability({
      ownerProfileId: profileId,
      connectionId,
      roomId,
      capabilityId,
    });
    if (!parsed.success) {
      const summary =
        "The brokerage adapter returned an observation outside the canonical schema.";
      return {
        ok: false,
        status: "failed",
        summary,
        observation: errorObservation({
          error: "brokerage_observation_identity_mismatch",
          summary,
        }),
        repairAction: "retry",
        error: "brokerage_observation_identity_mismatch",
      };
    }
    const nowMs = (input.dependencies?.now ?? (() => new Date()))().getTime();
    const observedMs = Date.parse(parsed.data.observed_at);
    const identityCurrent = Boolean(
      parsed.data.connection_id === connectionId &&
      parsed.data.room_id === roomId &&
      parsed.data.upstream_tool === upstreamTool &&
      parsed.data.capability_id === capabilityId &&
      parsed.data.producer_epoch_ref === before.producerEpochRef &&
      parsed.data.producer_epoch_ref === after.producerEpochRef,
    );
    const freshnessCurrent = Number.isFinite(observedMs) &&
      observedMs <= nowMs + OBSERVATION_MAX_FUTURE_SKEW_MS &&
      nowMs - observedMs <= OBSERVATION_MAX_AGE_MS;
    if (!identityCurrent || !freshnessCurrent) {
      const code = !identityCurrent
        ? "brokerage_observation_identity_mismatch"
        : "brokerage_observation_stale";
      const summary = !identityCurrent
        ? "The normalized brokerage observation does not match the current owner, room, capability, tool, or producer epoch."
        : "The normalized brokerage observation is stale or future-dated and cannot re-enter the current turn.";
      return {
        ok: false,
        status: "failed",
        summary,
        observation: errorObservation({ error: code, summary }),
        repairAction: "retry",
        error: code,
      };
    }
    return {
      ok: true,
      status: "completed",
      summary: `Robinhood ${upstreamTool} returned fresh credential-free evidence for the current private room.`,
      observation: parsed.data,
      sourceBindingId,
      executedArgs: {
        source_binding_id: sourceBindingId,
        connection_id: connectionId,
        upstream_tool: upstreamTool,
        upstream_arguments: upstreamArguments,
      },
    };
  } catch (error) {
    const code = error instanceof RobinhoodConnectionError
      ? error.code
      : "brokerage_read_failed";
    const summary = error instanceof RobinhoodConnectionError
      ? error.message
      : "The Robinhood read request failed without changing the account.";
    const retryable = [
      "brokerage_read_failed",
      "brokerage_unavailable",
      "brokerage_oauth_refresh_failed",
    ].includes(code);
    return {
      ok: false,
      status: "failed",
      summary,
      observation: errorObservation({ error: code, summary, retryable }),
      repairAction: retryable ? "retry" : "ask_user",
      error: code,
    };
  }
};
