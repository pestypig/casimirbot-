import type {
  HelixAccountCapabilityPolicy,
  HelixAccountSession,
} from "@shared/helix-account-session";
import {
  capHelixWorkstationModeForPolicy,
  resolveHelixAccountPanelAccess,
  resolveHelixRuntimeAgentAccess,
  resolveHelixWorkstationCapabilityAccess,
} from "@shared/helix-account-session";
import {
  getAccountCapabilityPolicy,
  getAccountSessionById,
} from "../../helix-account/account-session-store";
import {
  callWorkstationGatewayCapability,
  listWorkstationGatewayCapabilities,
} from "./registry";
import { buildWorkstationGatewayObservationPacket } from "./observation-packet";
import {
  HELIX_TOOL_FOLLOWUP_DECISION_SCHEMA,
  HELIX_TOOL_LIFECYCLE_TRACE_SCHEMA,
} from "@shared/helix-tool-lifecycle";
import type {
  HelixWorkstationGatewayCallResult,
  HelixWorkstationGatewayMode,
  HelixWorkstationCapabilityManifest,
} from "./types";

export const HELIX_WORKSTATION_GATEWAY_ACCOUNT_POLICY_BLOCKED_SCHEMA =
  "helix.workstation_tool_gateway.account_policy_blocked.v1" as const;

export type HelixWorkstationGatewayAccountContext = {
  session_id: string | null;
  profile_id: string | null;
  trusted_account_session: boolean;
  account_session: HelixAccountSession | null;
  account_policy: HelixAccountCapabilityPolicy;
};

export type HelixWorkstationGatewayPolicyGate = {
  account_type: HelixAccountCapabilityPolicy["account_type"];
  requested_mode: string;
  effective_mode: HelixWorkstationGatewayMode;
  requested_agent_runtime: string | null;
  effective_agent_runtime: string | null;
  capped: boolean;
  runtime_locked_reason: string | null;
};

export type HelixWorkstationGatewayAccountPolicyBlock = {
  schema: typeof HELIX_WORKSTATION_GATEWAY_ACCOUNT_POLICY_BLOCKED_SCHEMA;
  ok: false;
  capability_id?: string;
  error: "account_policy_blocked" | "runtime_agent_locked_by_account_policy";
  blocked_reason: string;
  account_policy: HelixAccountCapabilityPolicy;
  policy_gate: HelixWorkstationGatewayPolicyGate;
  terminal_eligible: false;
  post_tool_model_step_required: true;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixGovernedWorkstationGatewayCallResult = {
  status_code: 200 | 400 | 403;
  body:
    | HelixWorkstationGatewayAccountPolicyBlock
    | (HelixWorkstationGatewayCallResult & {
        account_policy: HelixAccountCapabilityPolicy;
        policy_gate: HelixWorkstationGatewayPolicyGate;
      });
};

export type HelixWorkstationGatewayCallAuthorization =
  | {
      admitted: true;
      effective_mode: HelixWorkstationGatewayMode;
      effective_agent_runtime: string | null;
      capability: HelixWorkstationCapabilityManifest | null;
    }
  | {
      admitted: false;
      status_code: 403;
      block: HelixWorkstationGatewayAccountPolicyBlock;
    };

const cleanString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const findGatewayCapability = (
  capabilityId: string,
): HelixWorkstationCapabilityManifest | null =>
  listWorkstationGatewayCapabilities({ mode: "act" }).capabilities.find(
    (capability) => capability.capability_id === capabilityId,
  ) ?? null;

const resolveDynamicTargetPanelId = (
  capability: HelixWorkstationCapabilityManifest | null,
  args: Record<string, unknown>,
): string | null => {
  if (!capability) return null;
  const dynamicArg = capability.dynamic_panel_id_arg;
  if (dynamicArg) return cleanString(args[dynamicArg]);
  if (
    capability.capability_id === "workstation.open_panel" ||
    capability.capability_id === "workstation.focus_panel"
  ) {
    return cleanString(args.panel_id) ?? cleanString(args.panelId);
  }
  return null;
};

export const resolveWorkstationGatewayAccountContext = async (
  sessionId?: string | null,
): Promise<HelixWorkstationGatewayAccountContext> => {
  const normalizedSessionId = cleanString(sessionId);
  const [accountPolicy, accountSession] = await Promise.all([
    getAccountCapabilityPolicy(normalizedSessionId),
    getAccountSessionById(normalizedSessionId),
  ]);
  return {
    session_id: accountSession?.session_id ?? null,
    profile_id: accountSession?.profile.profile_id ?? null,
    trusted_account_session: Boolean(accountSession),
    account_session: accountSession,
    account_policy: accountPolicy,
  };
};

export const listAccountAuthorizedWorkstationGatewayCapabilities = (input: {
  accountContext: HelixWorkstationGatewayAccountContext;
  requestedMode?: string | null;
  requestedRuntime?: string | null;
}) => {
  const { account_policy: accountPolicy } = input.accountContext;
  const requestedMode = cleanString(input.requestedMode);
  const requestedRuntime = cleanString(input.requestedRuntime);
  const runtimeAccess = requestedRuntime
    ? resolveHelixRuntimeAgentAccess(accountPolicy, requestedRuntime)
    : { state: "available" as const, reason: null };
  const effectiveRuntime =
    runtimeAccess.state === "available" ? requestedRuntime : null;
  const effectiveMode = capHelixWorkstationModeForPolicy(
    accountPolicy,
    requestedMode,
  );
  const requestedList = listWorkstationGatewayCapabilities({
    agentRuntime: effectiveRuntime,
    mode: requestedMode,
    accountType: accountPolicy.account_type,
    profileId: input.accountContext.profile_id,
  });
  const capabilityAccess = requestedList.capabilities.map((capability) => ({
    capability,
    access: resolveHelixWorkstationCapabilityAccess(accountPolicy, {
      capability_id: capability.capability_id,
      permission_profile_required: capability.permission_profile_required,
    }),
  }));
  const runtimeAvailable = runtimeAccess.state === "available";

  return {
    ...requestedList,
    mode: effectiveMode,
    capabilities: runtimeAvailable
      ? capabilityAccess
          .filter(({ access }) => access.state === "available")
          .map(({ capability }) => capability)
      : [],
    account_policy: accountPolicy,
    policy_gate: {
      account_type: accountPolicy.account_type,
      requested_mode: requestedMode ?? requestedList.mode,
      effective_mode: effectiveMode,
      requested_agent_runtime: requestedRuntime,
      effective_agent_runtime: runtimeAvailable
        ? effectiveRuntime ?? requestedList.agent_runtime
        : null,
      capped:
        effectiveMode !== requestedList.mode ||
        runtimeAccess.state !== "available",
      runtime_locked_reason: runtimeAccess.reason,
    } satisfies HelixWorkstationGatewayPolicyGate,
    locked_capabilities: capabilityAccess
      .filter(({ access }) => !runtimeAvailable || access.state === "locked")
      .map(({ capability, access }) => ({
        capability_id: capability.capability_id,
        label: capability.label,
        panel_id: capability.panel_id,
        action_id: capability.action_id,
        permission_profile_required: capability.permission_profile_required,
        locked_reason: runtimeAvailable ? access.reason : runtimeAccess.reason,
      })),
  };
};

const capabilityPolicyBlock = (input: {
  accountContext: HelixWorkstationGatewayAccountContext;
  requestedMode: string | null;
  effectiveMode: HelixWorkstationGatewayMode;
  capabilityId: string;
  blockedReason: string | null;
  requestedRuntime: string | null;
}): HelixWorkstationGatewayAccountPolicyBlock => ({
  schema: HELIX_WORKSTATION_GATEWAY_ACCOUNT_POLICY_BLOCKED_SCHEMA,
  ok: false,
  capability_id: input.capabilityId,
  error: "account_policy_blocked",
  blocked_reason: input.blockedReason ?? "capability_outside_account_policy",
  account_policy: input.accountContext.account_policy,
  policy_gate: {
    account_type: input.accountContext.account_policy.account_type,
    requested_mode: input.requestedMode ?? "read",
    effective_mode: input.effectiveMode,
    requested_agent_runtime: input.requestedRuntime,
    effective_agent_runtime: null,
    capped: true,
    runtime_locked_reason: null,
  },
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
});

const runtimePolicyBlock = (input: {
  accountContext: HelixWorkstationGatewayAccountContext;
  requestedMode: string | null;
  effectiveMode: HelixWorkstationGatewayMode;
  requestedRuntime: string;
  blockedReason: string | null;
}): HelixWorkstationGatewayAccountPolicyBlock => ({
  schema: HELIX_WORKSTATION_GATEWAY_ACCOUNT_POLICY_BLOCKED_SCHEMA,
  ok: false,
  error: "runtime_agent_locked_by_account_policy",
  blocked_reason: input.blockedReason ?? "runtime_agent_outside_account_policy",
  account_policy: input.accountContext.account_policy,
  policy_gate: {
    account_type: input.accountContext.account_policy.account_type,
    requested_mode: input.requestedMode ?? "read",
    effective_mode: input.effectiveMode,
    requested_agent_runtime: input.requestedRuntime,
    effective_agent_runtime: null,
    capped: true,
    runtime_locked_reason: input.blockedReason,
  },
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
});

export const authorizeWorkstationGatewayCall = (input: {
  accountContext: HelixWorkstationGatewayAccountContext;
  requestedMode?: string | null;
  requestedRuntime?: string | null;
  capabilityId: string;
  arguments?: Record<string, unknown>;
}): HelixWorkstationGatewayCallAuthorization => {
  const requestedMode = cleanString(input.requestedMode);
  const requestedRuntime = cleanString(input.requestedRuntime);
  const capabilityId = cleanString(input.capabilityId) ?? "";
  const args = input.arguments ?? {};
  const accountPolicy = input.accountContext.account_policy;
  const effectiveMode = capHelixWorkstationModeForPolicy(
    accountPolicy,
    requestedMode,
  );
  const capability = findGatewayCapability(capabilityId);

  if (capability) {
    const capabilityAccess = resolveHelixWorkstationCapabilityAccess(
      accountPolicy,
      {
        capability_id: capability.capability_id,
        permission_profile_required: capability.permission_profile_required,
      },
    );
    if (capabilityAccess.state !== "available") {
      return {
        admitted: false,
        status_code: 403,
        block: capabilityPolicyBlock({
          accountContext: input.accountContext,
          requestedMode,
          effectiveMode,
          capabilityId: capability.capability_id,
          blockedReason: capabilityAccess.reason,
          requestedRuntime,
        }),
      };
    }

    const targetPanelId = resolveDynamicTargetPanelId(capability, args);
    if (targetPanelId) {
      const panelAccess = resolveHelixAccountPanelAccess(
        accountPolicy,
        targetPanelId,
      );
      if (panelAccess.state !== "available") {
        return {
          admitted: false,
          status_code: 403,
          block: capabilityPolicyBlock({
            accountContext: input.accountContext,
            requestedMode,
            effectiveMode,
            capabilityId: capability.capability_id,
            blockedReason:
              panelAccess.reason ?? "target_panel_outside_account_policy",
            requestedRuntime,
          }),
        };
      }
    }
  }

  const runtimeAccess = requestedRuntime
    ? resolveHelixRuntimeAgentAccess(accountPolicy, requestedRuntime)
    : { state: "available" as const, reason: null };
  if (runtimeAccess.state !== "available" && requestedRuntime) {
    return {
      admitted: false,
      status_code: 403,
      block: runtimePolicyBlock({
        accountContext: input.accountContext,
        requestedMode,
        effectiveMode,
        requestedRuntime,
        blockedReason: runtimeAccess.reason,
      }),
    };
  }

  return {
    admitted: true,
    effective_mode: effectiveMode,
    effective_agent_runtime: requestedRuntime,
    capability,
  };
};

export const callAccountAuthorizedWorkstationGatewayCapability = async (input: {
  accountContext: HelixWorkstationGatewayAccountContext;
  requestedMode?: string | null;
  requestedRuntime?: string | null;
  capabilityId: string;
  arguments?: Record<string, unknown>;
  approvalToken?: string | null;
  turnId?: string | null;
  iteration?: number | null;
}): Promise<HelixGovernedWorkstationGatewayCallResult> => {
  const requestedMode = cleanString(input.requestedMode);
  const requestedRuntime = cleanString(input.requestedRuntime);
  const authorization = authorizeWorkstationGatewayCall({
    accountContext: input.accountContext,
    requestedMode,
    requestedRuntime,
    capabilityId: input.capabilityId,
    arguments: input.arguments,
  });
  if (!authorization.admitted) {
    return {
      status_code: authorization.status_code,
      body: authorization.block,
    };
  }

  const result = await callWorkstationGatewayCapability({
    agentRuntime: authorization.effective_agent_runtime,
    mode: authorization.effective_mode,
    capabilityId: input.capabilityId,
    arguments: input.arguments,
    approvalToken: cleanString(input.approvalToken),
    turnId: cleanString(input.turnId),
    iteration: input.iteration,
    accountType: input.accountContext.account_policy.account_type,
    profileId: input.accountContext.profile_id,
  });
  return {
    status_code: result.ok ? 200 : 400,
    body: {
      ...result,
      account_policy: input.accountContext.account_policy,
      policy_gate: {
        account_type: input.accountContext.account_policy.account_type,
        requested_mode: requestedMode ?? result.mode,
        effective_mode: authorization.effective_mode,
        requested_agent_runtime: requestedRuntime,
        effective_agent_runtime: result.agent_runtime,
        capped:
          authorization.effective_mode !== requestedMode ||
          authorization.effective_agent_runtime !== requestedRuntime,
        runtime_locked_reason: null,
      },
    },
  };
};

const buildProviderPolicyBlockedCallResult = (input: {
  block: HelixWorkstationGatewayAccountPolicyBlock;
  requestedRuntime?: string | null;
  capabilityId: string;
  turnId?: string | null;
  iteration?: number | null;
}): HelixWorkstationGatewayCallResult => {
  const capabilityId = cleanString(input.capabilityId) ?? "unknown";
  const agentRuntime = cleanString(input.requestedRuntime) ?? "codex";
  const turnId = cleanString(input.turnId) ?? `workstation-gateway-policy:${Date.now()}`;
  const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
    ? Math.max(0, Math.floor(input.iteration))
    : 0;
  const capability = findGatewayCapability(capabilityId);
  const admission = {
    schema: "helix.workstation_tool_gateway.admission.v1" as const,
    requested_capability: capabilityId,
    selected_agent_provider: agentRuntime,
    permission_profile: capability?.permission_profile_required ?? "observe",
    admission_status: "blocked" as const,
    admission_reason: "account_policy_blocked",
    blocked_reason: input.block.blocked_reason,
    assistant_answer: false as const,
    raw_content_included: false as const,
  };
  const observation = {
    schema: "helix.workstation_tool_gateway.account_policy_observation.v1" as const,
    capability_key: capabilityId,
    status: "blocked" as const,
    blocked_reason: input.block.blocked_reason,
    account_policy_block: input.block,
    terminal_eligible: false as const,
    post_tool_model_step_required: true as const,
    assistant_answer: false as const,
    raw_content_included: false as const,
  };
  const observationPacket = buildWorkstationGatewayObservationPacket({
    turnId,
    iteration,
    capabilityId,
    panelId: capability?.panel_id ?? "workstation-gateway",
    action: "account_policy_check",
    status: "blocked",
    summary: `Workstation gateway blocked ${capabilityId}: ${input.block.blocked_reason}.`,
    observation,
    missingRequirements: [{
      code: input.block.blocked_reason,
      message: `Capability ${capabilityId} is outside the active account policy.`,
      repair_action: "ask_user",
    }],
  });
  const traceRef = `${turnId}:workstation_gateway:${capabilityId}:tool_lifecycle_trace`;

  return {
    schema: "helix.workstation_tool_gateway.call_result.v1",
    manifest_version: "read-observe-act.v1",
    ok: false,
    agent_runtime: agentRuntime,
    capability_id: capabilityId,
    mode: input.block.policy_gate.effective_mode,
    gateway_admission: admission,
    observation_packet: observationPacket,
    tool_lifecycle_trace: {
      schema: HELIX_TOOL_LIFECYCLE_TRACE_SCHEMA,
      turn_id: turnId,
      tool_call_id: observationPacket.call_id,
      tool_family: "workstation_tool_gateway",
      requested_capability: capabilityId,
      admitted_capability: null,
      executed_capability: null,
      lifecycle_stage: "blocked",
      status: "blocked",
      session_ref: agentRuntime,
      process_ref: null,
      observation_refs: observationPacket.produced_artifact_refs,
      receipt_refs: [],
      evidence_refs: observationPacket.produced_artifact_refs,
      failure_reason: input.block.blocked_reason,
      retry_recommendation: "ask_user",
      fallback_used: false,
      fallback_equivalent: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    },
    tool_followup_decision: {
      schema: HELIX_TOOL_FOLLOWUP_DECISION_SCHEMA,
      turn_id: turnId,
      prior_tool_trace_ref: traceRef,
      observation_summary: observationPacket.observation_summary,
      next_action: "ask_user",
      reason: input.block.blocked_reason,
      external_change_required: false,
      terminal_blockers: [
        "post_tool_model_step_required",
        "terminal_authority_not_evaluated",
      ],
      required_surface_satisfied: false,
      evidence_reentered: false,
      assistant_answer: false,
      raw_content_included: false,
    },
    observation,
    artifact_refs: observationPacket.produced_artifact_refs,
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
    error: input.block.blocked_reason,
  };
};

export const callAccountAuthorizedWorkstationGatewayCapabilityForProvider = async (
  input: Parameters<typeof callAccountAuthorizedWorkstationGatewayCapability>[0],
): Promise<HelixWorkstationGatewayCallResult> => {
  const governed = await callAccountAuthorizedWorkstationGatewayCapability(input);
  if (governed.body.schema === "helix.workstation_tool_gateway.call_result.v1") {
    return governed.body;
  }
  return buildProviderPolicyBlockedCallResult({
    block: governed.body,
    requestedRuntime: input.requestedRuntime,
    capabilityId: input.capabilityId,
    turnId: input.turnId,
    iteration: input.iteration,
  });
};
