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

const readBooleanEnv = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false;
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
  return defaultValue;
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  return Array.from(
    new Set(
      value
        .map(readString)
        .filter((entry): entry is string => Boolean(entry)),
    ),
  );
};

const cookieHeader = (headers?: IncomingHttpHeaders): string | undefined => {
  const cookie = headers?.cookie;
  return Array.isArray(cookie) ? cookie.join("; ") : cookie;
};

const readGoalAllowedWorkstationTools = (body: Record<string, unknown>): string[] | null => {
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

export const readTurnAdmittedWorkstationTools = (body: Record<string, unknown>): string[] | null => {
  const rawGoalTools = readGoalAllowedWorkstationTools(body);
  const goalTools = rawGoalTools === null ? null : normalizeGatewayCapabilityIds(rawGoalTools);
  const admission = readRecord(body.tool_call_admission_decision ?? body.toolCallAdmissionDecision);
  const routeArbitration = readRecord(admission?.route_arbitration);
  const admissionStatus = readString(admission?.admission_status)?.toLowerCase() ?? null;
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
      : normalizeGatewayCapabilityIds(Array.from(new Set([
          ...(readStringArray(admission.compound_requested_capabilities) ?? []),
          readString(admission.admitted_capability),
          readString(admission.selected_capability),
          readString(routeArbitration?.selected_capability),
          readString(admission.requested_capability),
        ].filter((entry): entry is string => Boolean(entry)))))
    : null;
  const plannedTools = admissionRejected
    ? []
    : normalizeGatewayCapabilityIds(
        readWorkstationGatewayCallRequestsForTurn({
          body,
          includePlannerDerived: true,
          deferRuntimeTheoryReflection: false,
        })
          .map((request) => readString(request.capability_id ?? request.capabilityId))
          .filter((entry): entry is string => Boolean(entry)),
      );
  const turnTools = routeTools === null && plannedTools.length === 0
    ? null
    : Array.from(new Set([...(routeTools ?? []), ...plannedTools]));

  const goalIntersectedTools = goalTools === null
    ? turnTools
    : turnTools === null
      ? goalTools
      : goalTools.includes("*")
        ? turnTools
        : turnTools.includes("*")
          ? goalTools
          : turnTools.filter((capabilityId) => new Set(goalTools).has(capabilityId));
  const committedRoute = readCommittedAskRoute(body);
  if (!committedRoute || goalIntersectedTools === null) return goalIntersectedTools;
  return goalIntersectedTools.filter((capabilityId) =>
    capabilityId !== "*" &&
    assertCapabilityAllowedByCommittedRoute({
      committedRoute,
      capabilityId,
    }).allowed
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
    status: "not_eligible" | "disabled" | "unavailable" | "completed" | "fallback_required";
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
  const enabled = readBooleanEnv(process.env.HELIX_CODEX_NATIVE_APP_SERVER_ENABLED, true);
  const runningUnderTest = process.env.VITEST !== undefined || process.env.NODE_ENV === "test";
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
  body: Record<string, unknown>;
  headers?: IncomingHttpHeaders;
  accountContext?: HelixWorkstationGatewayAccountContext;
  signal?: AbortSignal;
  onNativeEvent?: (method: string, params: unknown) => void;
}): Promise<CodexNativeProviderBridgeAttempt> => {
  const availability = resolveCodexNativeProviderBridgeAvailability();
  const enabled = availability.enabled;
  const modelPolicy = resolveCodexNativeModelPolicy(input.body);
  const runtimeGoal = readRecord(input.body.runtime_goal_session);
  const trustedGoalAccountBindingRequired = Boolean(runtimeGoal);
  const allowedWorkstationTools = readTurnAdmittedWorkstationTools(input.body);
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

  const accountContext =
    input.accountContext ??
    await resolveWorkstationGatewayAccountContext(
      readHelixSessionCookie(cookieHeader(input.headers)),
    );
  const result = await runCodexNativeWorkstationTurn({
    prompt: input.prompt,
    turnId: input.turnId,
    cwd: process.cwd(),
    accountContext,
    requestedMode: "act",
    model: modelPolicy.model,
    reasoningEffort: modelPolicy.reasoningEffort,
    allowedWorkstationTools,
    requireTrustedAccountBinding: trustedGoalAccountBindingRequired,
    signal: input.signal,
    onNativeEvent: input.onNativeEvent,
  });
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
