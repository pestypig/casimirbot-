import type { IncomingHttpHeaders } from "node:http";
import { readHelixSessionCookie } from "../../../helix-account/session-cookie";
import {
  resolveWorkstationGatewayAccountContext,
  type HelixWorkstationGatewayAccountContext,
} from "../../workstation-tool-gateway/account-policy";
import type { HelixWorkstationGatewayCallResult } from "../../workstation-tool-gateway/types";
import { resolveProviderGatewayCapabilityId } from "../../provider-agent-capability-contract";
import {
  assertCapabilityAllowedByCommittedRoute,
  readCommittedAskRoute,
} from "../../committed-ask-route";
import { readWorkstationGatewayCallRequestsForTurn } from "../explicit-workstation-gateway";
import { resolveCodexNativeModelPolicy } from "./model-policy";
import {
  runCodexNativeWorkstationTurn,
  type CodexNativeWorkstationTurnResult,
} from "./workstation-turn";
import type { CodexNativeRuntimeApprovalContextV1 } from "./runtime-approval-host";

const readBooleanEnv = (
  value: string | undefined,
  defaultValue: boolean,
): boolean => {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (["0", "false", "no", "off", "disabled"].includes(normalized))
    return false;
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
  return defaultValue;
};

type CodexNativeProviderCooldown = {
  reason:
    | "native_provider_quota_exhausted"
    | "native_turn_timeout"
    | "native_initialize_timeout"
    | "native_thread_start_timeout"
    | "native_turn_start_timeout";
  untilMs: number;
};

let nativeProviderCooldown: CodexNativeProviderCooldown | null = null;

const quotaCooldownMs = (): number => {
  const configured = Number(process.env.HELIX_CODEX_NATIVE_QUOTA_COOLDOWN_MS);
  return Number.isFinite(configured) && configured >= 1_000
    ? Math.floor(configured)
    : 300_000;
};

const transportTimeoutCooldownMs = (): number => {
  const configured = Number(
    process.env.HELIX_CODEX_NATIVE_TIMEOUT_COOLDOWN_MS,
  );
  return Number.isFinite(configured) && configured >= 1_000
    ? Math.floor(configured)
    : 300_000;
};

const nativeTransportTimeoutReasons = new Set<
  CodexNativeProviderCooldown["reason"]
>([
  "native_turn_timeout",
  "native_initialize_timeout",
  "native_thread_start_timeout",
  "native_turn_start_timeout",
]);

export const readCodexNativeProviderCooldown = (
  nowMs = Date.now(),
): CodexNativeProviderCooldown | null => {
  if (!nativeProviderCooldown) return null;
  if (nativeProviderCooldown.untilMs <= nowMs) {
    nativeProviderCooldown = null;
    return null;
  }
  return { ...nativeProviderCooldown };
};

export const noteCodexNativeProviderFailure = (
  failReason: string | null,
  nowMs = Date.now(),
): void => {
  const reason =
    failReason === "native_provider_quota_exhausted" ||
    nativeTransportTimeoutReasons.has(
      failReason as CodexNativeProviderCooldown["reason"],
    )
      ? (failReason as CodexNativeProviderCooldown["reason"])
      : null;
  if (!reason) return;
  nativeProviderCooldown = {
    reason,
    untilMs:
      nowMs +
      (reason === "native_provider_quota_exhausted"
        ? quotaCooldownMs()
        : transportTimeoutCooldownMs()),
  };
};

export const resetCodexNativeProviderCooldownForTests = (): void => {
  nativeProviderCooldown = null;
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readThreadId = (body: Record<string, unknown>): string => {
  const sourceTargetIntent = readRecord(
    body.source_target_intent ?? body.sourceTargetIntent,
  );
  const routeProductContract = readRecord(
    body.route_product_contract ?? body.routeProductContract,
  );
  return (
    readString(sourceTargetIntent?.thread_id ?? sourceTargetIntent?.threadId) ??
    readString(
      routeProductContract?.thread_id ?? routeProductContract?.threadId,
    ) ??
    readString(body.session_id ?? body.sessionId) ??
    readString(body.conversation_id ?? body.conversationId) ??
    readString(body.thread_id ?? body.threadId) ??
    "helix-agent-provider"
  );
};

const readStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  return Array.from(
    new Set(
      value.map(readString).filter((entry): entry is string => Boolean(entry)),
    ),
  );
};

const cookieHeader = (headers?: IncomingHttpHeaders): string | undefined => {
  const cookie = headers?.cookie;
  return Array.isArray(cookie) ? cookie.join("; ") : cookie;
};

const readGoalAllowedWorkstationTools = (
  body: Record<string, unknown>,
): string[] | null => {
  const runtimeGoal = readRecord(body.runtime_goal_session);
  const jobBrief = readRecord(runtimeGoal?.job_brief);
  return (
    readStringArray(runtimeGoal?.allowed_workstation_tools) ??
    readStringArray(jobBrief?.allowed_workstation_tools) ??
    readStringArray(body.allowed_workstation_tools) ??
    readStringArray(body.allowedWorkstationTools)
  );
};

const normalizeGatewayCapabilityId = (capabilityId: string): string =>
  resolveProviderGatewayCapabilityId(capabilityId) ?? capabilityId;

const normalizeGatewayCapabilityIds = (capabilityIds: string[]): string[] =>
  Array.from(new Set(capabilityIds.map(normalizeGatewayCapabilityId)));

const gatewayCapabilitiesForAdmittedFamily = (family: string): string[] => {
  switch (family.trim().toLowerCase()) {
    case "situation_run":
    case "visual_capture":
      return ["situation-room.describe_visual_capture"];
    default:
      return [];
  }
};

export const readTurnAdmittedWorkstationTools = (
  body: Record<string, unknown>,
): string[] | null => {
  const rawGoalTools = readGoalAllowedWorkstationTools(body);
  const goalTools =
    rawGoalTools === null ? null : normalizeGatewayCapabilityIds(rawGoalTools);
  const admission = readRecord(
    body.tool_call_admission_decision ?? body.toolCallAdmissionDecision,
  );
  const routeArbitration = readRecord(admission?.route_arbitration);
  const admissionStatus =
    readString(admission?.admission_status)?.toLowerCase() ?? null;
  const admissionRejected = Boolean(
    admission?.tool_admission_suppressed === true ||
    readString(admission?.runtime_capability_rejection_reason) ||
    admissionStatus === "rejected" ||
    admissionStatus === "blocked" ||
    admissionStatus === "suppressed",
  );
  const routeTools = admission
    ? admissionRejected
      ? []
      : normalizeGatewayCapabilityIds(
          Array.from(
            new Set(
              [
                ...(readStringArray(
                  admission.compound_requested_capabilities,
                ) ?? []),
                ...(
                  readStringArray(admission.admitted_tool_families) ?? []
                ).flatMap(gatewayCapabilitiesForAdmittedFamily),
                readString(admission.admitted_capability),
                readString(admission.selected_capability),
                readString(routeArbitration?.selected_capability),
                readString(admission.requested_capability),
              ].filter((entry): entry is string => Boolean(entry)),
            ),
          ),
        )
    : null;
  const plannedTools = admissionRejected
    ? []
    : normalizeGatewayCapabilityIds(
        readWorkstationGatewayCallRequestsForTurn({
          body,
          includePlannerDerived: true,
          deferRuntimeTheoryReflection: false,
        })
          .map((request) =>
            readString(request.capability_id ?? request.capabilityId),
          )
          .filter((entry): entry is string => Boolean(entry)),
      );
  const turnTools =
    routeTools === null && plannedTools.length === 0
      ? null
      : Array.from(new Set([...(routeTools ?? []), ...plannedTools]));

  const goalIntersectedTools =
    goalTools === null
      ? turnTools
      : turnTools === null
        ? goalTools
        : goalTools.includes("*")
          ? turnTools
          : turnTools.includes("*")
            ? goalTools
            : turnTools.filter((capabilityId) =>
                new Set(goalTools).has(capabilityId),
              );
  const committedRoute = readCommittedAskRoute(body);
  if (!committedRoute || goalIntersectedTools === null)
    return goalIntersectedTools;
  return goalIntersectedTools.filter(
    (capabilityId) =>
      capabilityId !== "*" &&
      assertCapabilityAllowedByCommittedRoute({
        committedRoute,
        capabilityId,
      }).allowed,
  );
};

export const removeSatisfiedNativeWorkstationTools = (
  allowedWorkstationTools: string[] | null,
  gatewayCallResults: readonly HelixWorkstationGatewayCallResult[] = [],
): string[] | null => {
  if (allowedWorkstationTools === null || gatewayCallResults.length === 0) {
    return allowedWorkstationTools;
  }
  const observedCapabilities = new Set(
    gatewayCallResults
      .filter(
        (result) => {
          if (
            result.ok === true &&
            result.observation_packet?.status === "succeeded"
          ) {
            return true;
          }
          const nextAction = readString(
            result.tool_followup_decision?.next_action,
          );
          return (
            result.observation_packet?.status === "blocked" &&
            (nextAction === "ask_user" ||
              nextAction === "fail_closed" ||
              nextAction === "abort")
          );
        },
      )
      .map((result) => result.capability_id),
  );
  return allowedWorkstationTools.filter(
    (capabilityId) => !observedCapabilities.has(capabilityId),
  );
};

export const resolveNativeAllowedWorkstationTools = (input: {
  body: Record<string, unknown>;
  runtimeProviderAdmittedCapabilityIds?: string[];
  preexecutedGatewayCallResults?: readonly HelixWorkstationGatewayCallResult[];
}): string[] | null => {
  const committedRoute = readCommittedAskRoute(input.body);
  const providerAdmittedTools = input.runtimeProviderAdmittedCapabilityIds
    ? normalizeGatewayCapabilityIds(input.runtimeProviderAdmittedCapabilityIds)
        .filter(
          (capabilityId) =>
            !committedRoute ||
            assertCapabilityAllowedByCommittedRoute({
              committedRoute,
              capabilityId,
            }).allowed,
        )
    : null;
  return removeSatisfiedNativeWorkstationTools(
    providerAdmittedTools ?? readTurnAdmittedWorkstationTools(input.body),
    input.preexecutedGatewayCallResults,
  );
};

export type CodexNativeProviderBridgeAttempt = {
  attempted: boolean;
  eligible: boolean;
  fallbackRequired: boolean;
  fallbackReason: string | null;
  result: CodexNativeWorkstationTurnResult | null;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
  debug: {
    schema: "helix.codex_native_provider_bridge.v1";
    enabled: boolean;
    eligible: boolean;
    attempted: boolean;
    status:
      | "not_eligible"
      | "disabled"
      | "unavailable"
      | "completed"
      | "fallback_required";
    native_transport: "codex_app_server";
    compatibility_transport: "codex_exec";
    fallback_required: boolean;
    fallback_reason: string | null;
    model_policy_source: string;
    effective_model: string | null;
    effective_reasoning_effort: string | null;
    trusted_goal_account_binding_required: boolean;
    allowed_workstation_tools: string[] | null;
    native_workstation_turn: CodexNativeWorkstationTurnResult["debug"] | null;
    terminal_eligible: false;
    assistant_answer: false;
    raw_content_included: false;
  };
};

export const resolveCodexNativeProviderBridgeAvailability = (): {
  enabled: boolean;
  available: boolean;
  unavailableReason: string | null;
} => {
  const enabled = readBooleanEnv(
    process.env.HELIX_CODEX_NATIVE_APP_SERVER_ENABLED,
    true,
  );
  const runningUnderTest =
    process.env.VITEST !== undefined || process.env.NODE_ENV === "test";
  const nativeTestOptIn = readBooleanEnv(
    process.env.HELIX_CODEX_NATIVE_APP_SERVER_TEST_ENABLED,
    false,
  );
  const unavailableReason = !enabled
    ? "native_app_server_disabled"
    : process.env.CODEX_AGENT_FAKE_STDOUT !== undefined ||
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE !== undefined
      ? "legacy_fake_runtime_configured"
      : runningUnderTest && !nativeTestOptIn
        ? "native_app_server_disabled_in_test"
        : !readString(process.env.OPENAI_API_KEY)
          ? "openai_api_key_missing"
          : null;
  return {
    enabled,
    available: unavailableReason === null,
    unavailableReason,
  };
};

export const runCodexNativeProviderBridge = async (input: {
  eligible: boolean;
  prompt: string;
  turnId: string;
  conversationThreadId?: string | null;
  body: Record<string, unknown>;
  headers?: IncomingHttpHeaders;
  accountContext?: HelixWorkstationGatewayAccountContext;
  preexecutedGatewayCallResults?: readonly HelixWorkstationGatewayCallResult[];
  runtimeProviderAdmittedCapabilityIds?: string[];
  authoritativeEvidenceArtifacts?: unknown[];
  runtimeApproval?: CodexNativeRuntimeApprovalContextV1;
  signal?: AbortSignal;
  onNativeEvent?: (method: string, params: unknown) => void;
}): Promise<CodexNativeProviderBridgeAttempt> => {
  const availability = resolveCodexNativeProviderBridgeAvailability();
  const enabled = availability.enabled;
  const modelPolicy = resolveCodexNativeModelPolicy(input.body);
  const runtimeGoal = readRecord(input.body.runtime_goal_session);
  const trustedGoalAccountBindingRequired = Boolean(runtimeGoal);
  const allowedWorkstationTools = resolveNativeAllowedWorkstationTools({
    body: input.body,
    runtimeProviderAdmittedCapabilityIds:
      input.runtimeProviderAdmittedCapabilityIds,
    preexecutedGatewayCallResults: input.preexecutedGatewayCallResults,
  });
  const baseDebug: CodexNativeProviderBridgeAttempt["debug"] = {
    schema: "helix.codex_native_provider_bridge.v1",
    enabled,
    eligible: input.eligible,
    attempted: false,
    status: input.eligible ? "disabled" : "not_eligible",
    native_transport: "codex_app_server",
    compatibility_transport: "codex_exec",
    fallback_required: false,
    fallback_reason: null,
    model_policy_source: modelPolicy.source,
    effective_model: modelPolicy.model,
    effective_reasoning_effort: modelPolicy.reasoningEffort,
    trusted_goal_account_binding_required: trustedGoalAccountBindingRequired,
    allowed_workstation_tools: allowedWorkstationTools,
    native_workstation_turn: null,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };

  if (!input.eligible || !enabled) {
    return {
      attempted: false,
      eligible: input.eligible,
      fallbackRequired: false,
      fallbackReason: null,
      result: null,
      gatewayCallResults: [],
      debug: baseDebug,
    };
  }

  const unavailableReason = availability.unavailableReason;
  if (unavailableReason) {
    return {
      attempted: false,
      eligible: true,
      fallbackRequired: true,
      fallbackReason: unavailableReason,
      result: null,
      gatewayCallResults: [],
      debug: {
        ...baseDebug,
        status: "unavailable",
        fallback_required: true,
        fallback_reason: unavailableReason,
      },
    };
  }

  const providerCooldown = readCodexNativeProviderCooldown();
  if (providerCooldown) {
    return {
      attempted: false,
      eligible: true,
      fallbackRequired: true,
      fallbackReason: providerCooldown.reason,
      result: null,
      gatewayCallResults: [],
      debug: {
        ...baseDebug,
        status: "unavailable",
        fallback_required: true,
        fallback_reason: providerCooldown.reason,
      },
    };
  }

  const accountContext =
    input.accountContext ??
    (await resolveWorkstationGatewayAccountContext(
      readHelixSessionCookie(cookieHeader(input.headers)),
    ));
  const result = await runCodexNativeWorkstationTurn({
    prompt: input.prompt,
    turnId: input.turnId,
    conversationThreadId:
      readString(input.conversationThreadId) ?? readThreadId(input.body),
    cwd: process.cwd(),
    accountContext,
    requestedMode: "act",
    model: modelPolicy.model,
    reasoningEffort: modelPolicy.reasoningEffort,
    allowedWorkstationTools,
    authoritativeEvidenceArtifacts: input.authoritativeEvidenceArtifacts,
    trustedCurrentTurnGatewayCallResults: input.preexecutedGatewayCallResults,
    runtimeApproval: input.runtimeApproval,
    requireTrustedAccountBinding: trustedGoalAccountBindingRequired,
    signal: input.signal,
    onNativeEvent: input.onNativeEvent,
  });
  noteCodexNativeProviderFailure(result.failReason);
  return {
    attempted: true,
    eligible: true,
    fallbackRequired: !result.ok,
    fallbackReason: result.ok ? null : result.failReason,
    result,
    gatewayCallResults: result.gatewayCallResults,
    debug: {
      ...baseDebug,
      attempted: true,
      status: result.ok ? "completed" : "fallback_required",
      fallback_required: !result.ok,
      fallback_reason: result.ok ? null : result.failReason,
      native_workstation_turn: result.debug,
    },
  };
};
