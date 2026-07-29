import type {
  HelixRuntimeToolConfirmationBindingV1,
  HelixRuntimeToolConfirmationReceiptV1,
} from "@shared/contracts/helix-runtime-tool-confirmation.v1";
import {
  HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY,
} from "@shared/contracts/helix-shared-live-room-agent.v1";
import type { HelixWorkstationGatewayCallResult } from "../../workstation-tool-gateway/types";
import {
  THEORY_FORMAL_VERIFIER_PLAN_CAPABILITY,
  THEORY_FORMAL_VERIFIER_START_CAPABILITY,
} from "../../workstation-tool-gateway/theory-formal-verifier";
import {
  THEORY_INDEPENDENT_NUMERICAL_PLAN_CAPABILITY,
  THEORY_INDEPENDENT_NUMERICAL_START_CAPABILITY,
} from "../../workstation-tool-gateway/theory-independent-numerical-verifier";
import {
  THEORY_RUNTIME_CANARY_PLAN_CAPABILITY,
  THEORY_RUNTIME_CANARY_START_CAPABILITY,
} from "../../workstation-tool-gateway/theory-runtime-canary";

export const HELIX_CODEX_NATIVE_RUNTIME_APPROVAL_REQUEST_SCHEMA =
  "helix.codex_native_runtime_approval_request.v1" as const;
export const HELIX_CODEX_NATIVE_RUNTIME_APPROVAL_OUTCOME_SCHEMA =
  "helix.codex_native_runtime_approval_outcome.v1" as const;

const FORMAL_PLAN_OBSERVATION_SCHEMA =
  "casimir.theory_formal_verifier.plan_observation.v1" as const;
const NUMERICAL_PLAN_OBSERVATION_SCHEMA =
  "casimir.theory_independent_numerical_verifier.plan_observation.v1" as const;
const RUNTIME_CANARY_PLAN_OBSERVATION_SCHEMA =
  "casimir.formal_runtime_canary.plan_observation.v1" as const;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

const MODEL_RUNTIME_APPROVAL_CONTROL_FIELDS = new Set([
  "approval_receipt",
  "approvalReceipt",
  "approval_token",
  "approvalToken",
  "confirmation_receipt",
  "confirmationReceipt",
  "receipt",
  "binding",
  "expected_binding",
  "expectedBinding",
  "sealed_input_sha256",
  "sealedInputSha256",
]);

type RuntimeStartCapabilityId =
  | typeof THEORY_FORMAL_VERIFIER_START_CAPABILITY
  | typeof THEORY_INDEPENDENT_NUMERICAL_START_CAPABILITY
  | typeof THEORY_RUNTIME_CANARY_START_CAPABILITY;

type SharedLiveRoomMutationCapabilityId =
  | typeof HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY
  | typeof HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY;

type RuntimeApprovalCapabilityId =
  | RuntimeStartCapabilityId
  | SharedLiveRoomMutationCapabilityId;

export type CodexNativeTrustedRuntimeStartPlanV1 = {
  capabilityId: RuntimeStartCapabilityId;
  planId: string;
  preparedRequestId: string | null;
  sealedInputSha256: string;
  gatewayArguments: Record<string, unknown>;
};

export type CodexNativeRuntimeApprovalHostOutcomeV1 =
  | {
      status: "approved";
      receipt: HelixRuntimeToolConfirmationReceiptV1;
    }
  | {
      status: "declined";
      reason?: string;
    }
  | {
      status: "needs_input";
      reason?: string;
    }
  | {
      status: "failed";
      code: string;
      message?: string;
    };

export type CodexNativeRuntimeApprovalHostV1 = (input: {
  schema: typeof HELIX_CODEX_NATIVE_RUNTIME_APPROVAL_REQUEST_SCHEMA;
  requiredReplayProtection: "durable_atomic";
  binding: HelixRuntimeToolConfirmationBindingV1;
  summary: {
    capabilityId: RuntimeApprovalCapabilityId;
    planId: string;
    preparedRequestId: string | null;
    sealedInputSha256: string;
  };
}) =>
  | CodexNativeRuntimeApprovalHostOutcomeV1
  | Promise<CodexNativeRuntimeApprovalHostOutcomeV1>;

export type CodexNativeRuntimeApprovalContextV1 = {
  host: CodexNativeRuntimeApprovalHostV1;
  affirmativeExecutionIntent: boolean;
  replayProtection: "durable_atomic" | "process_local" | "unavailable";
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const isRuntimeStartCapabilityId = (
  value: string,
): value is RuntimeStartCapabilityId =>
  value === THEORY_FORMAL_VERIFIER_START_CAPABILITY ||
  value === THEORY_INDEPENDENT_NUMERICAL_START_CAPABILITY ||
  value === THEORY_RUNTIME_CANARY_START_CAPABILITY;

export const isCodexNativeRuntimeApprovalStartCapability = (
  capabilityId: string,
): capabilityId is RuntimeStartCapabilityId =>
  isRuntimeStartCapabilityId(capabilityId);

export const isCodexNativeSharedLiveRoomMutationApprovalCapability = (
  capabilityId: string,
): capabilityId is SharedLiveRoomMutationCapabilityId =>
  capabilityId === HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY ||
  capabilityId === HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY;

export const isCodexNativeRuntimeApprovalCapability = (
  capabilityId: string,
): capabilityId is RuntimeApprovalCapabilityId =>
  isCodexNativeRuntimeApprovalStartCapability(capabilityId) ||
  isCodexNativeSharedLiveRoomMutationApprovalCapability(capabilityId);

export const findModelSuppliedRuntimeApprovalControlField = (
  args: Record<string, unknown>,
): string | null =>
  Object.keys(args).find((key) =>
    MODEL_RUNTIME_APPROVAL_CONTROL_FIELDS.has(key),
  ) ?? null;

const trustedPlanFromGatewayResult = (input: {
  result: HelixWorkstationGatewayCallResult;
  turnId: string;
  startCapabilityId: RuntimeStartCapabilityId;
}): CodexNativeTrustedRuntimeStartPlanV1 | null => {
  const formal =
    input.startCapabilityId === THEORY_FORMAL_VERIFIER_START_CAPABILITY;
  const runtimeCanary =
    input.startCapabilityId === THEORY_RUNTIME_CANARY_START_CAPABILITY;
  const expectedPlanCapability = formal
    ? THEORY_FORMAL_VERIFIER_PLAN_CAPABILITY
    : runtimeCanary
      ? THEORY_RUNTIME_CANARY_PLAN_CAPABILITY
      : THEORY_INDEPENDENT_NUMERICAL_PLAN_CAPABILITY;
  const expectedObservationSchema = formal
    ? FORMAL_PLAN_OBSERVATION_SCHEMA
    : runtimeCanary
      ? RUNTIME_CANARY_PLAN_OBSERVATION_SCHEMA
      : NUMERICAL_PLAN_OBSERVATION_SCHEMA;
  const packet = input.result.observation_packet;
  const observation = readRecord(input.result.observation);

  if (
    input.result.ok !== true ||
    input.result.capability_id !== expectedPlanCapability ||
    input.result.gateway_admission?.admission_status !== "admitted" ||
    packet?.turn_id !== input.turnId ||
    packet?.capability_key !== expectedPlanCapability ||
    packet?.status !== "succeeded" ||
    !observation ||
    observation.schema !== expectedObservationSchema ||
    observation.ok !== true ||
    observation.status !== "ready" ||
    observation.confirmationRequired !== true ||
    observation.nextCapability !== input.startCapabilityId
  ) {
    return null;
  }

  const planId = readString(observation.planId);
  const sealedInputSha256 = readString(observation.sealedInputSha256);
  const preparedRequestId = readString(
    formal ? observation.prepared_request_id : observation.preparedRequestId,
  );
  if (
    !planId ||
    !sealedInputSha256 ||
    !SHA256_PATTERN.test(sealedInputSha256) ||
    (formal && !preparedRequestId)
  ) {
    return null;
  }

  return {
    capabilityId: input.startCapabilityId,
    planId,
    preparedRequestId,
    sealedInputSha256,
    gatewayArguments: formal
      ? {
          prepared_request_id: preparedRequestId,
          plan_id: planId,
        }
      : { plan_id: planId },
  };
};

export const readCodexNativeTrustedRuntimeStartPlans = (input: {
  capabilityId: string;
  turnId: string;
  gatewayCallResults: readonly HelixWorkstationGatewayCallResult[];
}): CodexNativeTrustedRuntimeStartPlanV1[] => {
  if (!isRuntimeStartCapabilityId(input.capabilityId)) return [];
  const byPlanId = new Map<string, CodexNativeTrustedRuntimeStartPlanV1>();
  for (const result of input.gatewayCallResults) {
    const plan = trustedPlanFromGatewayResult({
      result,
      turnId: input.turnId,
      startCapabilityId: input.capabilityId,
    });
    if (plan) byPlanId.set(plan.planId, plan);
  }
  return [...byPlanId.values()];
};

export const resolveCodexNativeTrustedRuntimeStartPlan = (input: {
  capabilityId: string;
  arguments: Record<string, unknown>;
  turnId: string;
  gatewayCallResults: readonly HelixWorkstationGatewayCallResult[];
}): CodexNativeTrustedRuntimeStartPlanV1 | null => {
  const requestedPlanId = readString(
    input.arguments.plan_id ?? input.arguments.planId,
  );
  if (!requestedPlanId) return null;
  const requestedPreparedRequestId = readString(
    input.arguments.prepared_request_id ?? input.arguments.preparedRequestId,
  );
  return (
    readCodexNativeTrustedRuntimeStartPlans(input).find(
      (plan) =>
        plan.planId === requestedPlanId &&
        (plan.capabilityId !== THEORY_FORMAL_VERIFIER_START_CAPABILITY ||
          plan.preparedRequestId === requestedPreparedRequestId),
    ) ?? null
  );
};
