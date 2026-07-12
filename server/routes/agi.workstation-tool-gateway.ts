import { Router } from "express";
import type { Request, Response } from "express";
import {
  capHelixWorkstationModeForPolicy,
  resolveHelixAccountPanelAccess,
  resolveHelixRuntimeAgentAccess,
  resolveHelixWorkstationCapabilityAccess,
} from "@shared/helix-account-session";
import type { HelixWorkstationGatewayMode } from "../services/helix-ask/workstation-tool-gateway/types";
import { getAccountCapabilityPolicy } from "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";
import {
  callWorkstationGatewayCapability,
  listWorkstationGatewayCapabilities,
} from "../services/helix-ask/workstation-tool-gateway/registry";

export const workstationToolGatewayRouter = Router();

const readRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const accountPolicyForRequest = async (req: Request) =>
  getAccountCapabilityPolicy(readHelixSessionCookie(req.headers.cookie));

const findGatewayCapability = (capabilityId: string) =>
  listWorkstationGatewayCapabilities({ mode: "act" }).capabilities.find(
    (capability) => capability.capability_id === capabilityId,
  ) ?? null;

const resolveDynamicTargetPanelId = (
  capability: ReturnType<typeof findGatewayCapability>,
  args: Record<string, unknown>,
): string | null => {
  if (!capability) return null;
  const dynamicArg = capability.dynamic_panel_id_arg;
  if (dynamicArg) return readString(args[dynamicArg]);
  if (capability.capability_id === "workstation.open_panel" || capability.capability_id === "workstation.focus_panel") {
    return readString(args.panel_id) ?? readString(args.panelId);
  }
  return null;
};

const accountPolicyBlock = (input: {
  res: Response;
  accountPolicy: Awaited<ReturnType<typeof accountPolicyForRequest>>;
  requestedMode: string | null;
  effectiveMode: string;
  capabilityId: string;
  blockedReason: string | null;
  requestedRuntime?: string | null;
}) =>
  input.res.status(403).json({
    schema: "helix.workstation_tool_gateway.account_policy_blocked.v1",
    ok: false,
    capability_id: input.capabilityId,
    error: "account_policy_blocked",
    blocked_reason: input.blockedReason ?? "capability_outside_account_policy",
    account_policy: input.accountPolicy,
    policy_gate: {
      account_type: input.accountPolicy.account_type,
      requested_mode: input.requestedMode ?? "read",
      effective_mode: input.effectiveMode,
      requested_agent_runtime: input.requestedRuntime ?? null,
      effective_agent_runtime: null,
      capped: true,
      runtime_locked_reason: null,
    },
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  });

workstationToolGatewayRouter.get("/workstation-tool-gateway/capabilities", async (req: Request, res: Response) => {
  const accountPolicy = await accountPolicyForRequest(req);
  const requestedMode = readString(req.query.mode);
  const requestedRuntime = readString(req.query.agent_runtime) ?? readString(req.query.agentRuntime);
  const runtimeAccess = requestedRuntime
    ? resolveHelixRuntimeAgentAccess(accountPolicy, requestedRuntime)
    : { state: "available" as const, reason: null };
  const effectiveRuntime = runtimeAccess.state === "available" ? requestedRuntime : null;
  const effectiveMode = capHelixWorkstationModeForPolicy(accountPolicy, requestedMode);
  const requestedList = listWorkstationGatewayCapabilities({
    agentRuntime: effectiveRuntime,
    mode: requestedMode,
    accountType: accountPolicy.account_type,
  });
  const allowedCapabilities = requestedList.capabilities.filter((capability) =>
    resolveHelixWorkstationCapabilityAccess(accountPolicy, {
      capability_id: capability.capability_id,
      permission_profile_required: capability.permission_profile_required,
    }).state === "available",
  );
  const lockedCapabilities = requestedList.capabilities
    .filter((capability) =>
      resolveHelixWorkstationCapabilityAccess(accountPolicy, {
        capability_id: capability.capability_id,
        permission_profile_required: capability.permission_profile_required,
      }).state === "locked",
    )
    .map((capability) => ({
      capability_id: capability.capability_id,
      label: capability.label,
      panel_id: capability.panel_id,
      action_id: capability.action_id,
      permission_profile_required: capability.permission_profile_required,
      locked_reason: resolveHelixWorkstationCapabilityAccess(accountPolicy, {
        capability_id: capability.capability_id,
        permission_profile_required: capability.permission_profile_required,
      }).reason,
    }));
  return res.status(200).json({
    ...requestedList,
    mode: effectiveMode,
    capabilities: allowedCapabilities,
    account_policy: accountPolicy,
    policy_gate: {
      account_type: accountPolicy.account_type,
      requested_mode: requestedMode ?? requestedList.mode,
      effective_mode: effectiveMode,
      requested_agent_runtime: requestedRuntime,
      effective_agent_runtime: effectiveRuntime ?? requestedList.agent_runtime,
      capped: effectiveMode !== requestedList.mode || runtimeAccess.state !== "available",
      runtime_locked_reason: runtimeAccess.reason,
    },
    locked_capabilities: lockedCapabilities,
  });
});

workstationToolGatewayRouter.post("/workstation-tool-gateway/call", async (req: Request, res: Response) => {
  const body = readRecord(req.body);
  const accountPolicy = await accountPolicyForRequest(req);
  const requestedMode = readString(body.mode);
  const effectiveMode = capHelixWorkstationModeForPolicy(accountPolicy, requestedMode);
  const requestedRuntime = readString(body.agent_runtime) ?? readString(body.agentRuntime);
  const capabilityId = readString(body.capability_id) ?? readString(body.capabilityId) ?? "";
  const args = readRecord(body.arguments ?? body.args);
  const capability = findGatewayCapability(capabilityId);
  if (capability) {
    const capabilityAccess = resolveHelixWorkstationCapabilityAccess(accountPolicy, {
      capability_id: capability.capability_id,
      permission_profile_required: capability.permission_profile_required,
    });
    if (capabilityAccess.state !== "available") {
      return accountPolicyBlock({
        res,
        accountPolicy,
        requestedMode,
        effectiveMode,
        capabilityId: capability.capability_id,
        blockedReason: capabilityAccess.reason,
        requestedRuntime,
      });
    }
    const targetPanelId = resolveDynamicTargetPanelId(capability, args);
    if (targetPanelId) {
      const panelAccess = resolveHelixAccountPanelAccess(accountPolicy, targetPanelId);
      if (panelAccess.state !== "available") {
        return accountPolicyBlock({
          res,
          accountPolicy,
          requestedMode,
          effectiveMode,
          capabilityId: capability.capability_id,
          blockedReason: panelAccess.reason ?? "target_panel_outside_account_policy",
          requestedRuntime,
        });
      }
    }
  }
  const runtimeAccess = requestedRuntime
    ? resolveHelixRuntimeAgentAccess(accountPolicy, requestedRuntime)
    : { state: "available" as const, reason: null };
  if (runtimeAccess.state !== "available") {
    return res.status(403).json({
      schema: "helix.workstation_tool_gateway.account_policy_blocked.v1",
      ok: false,
      error: "runtime_agent_locked_by_account_policy",
      blocked_reason: runtimeAccess.reason,
      account_policy: accountPolicy,
      policy_gate: {
        account_type: accountPolicy.account_type,
        requested_mode: requestedMode ?? "read",
        effective_mode: effectiveMode,
        requested_agent_runtime: requestedRuntime,
        effective_agent_runtime: null,
        capped: true,
        runtime_locked_reason: runtimeAccess.reason,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  }
  const result = await callWorkstationGatewayCapability({
    agentRuntime: runtimeAccess.state === "available" ? requestedRuntime : null,
    mode: effectiveMode as HelixWorkstationGatewayMode,
    capabilityId,
    arguments: args,
    approvalToken: readString(body.approval_token) ?? readString(body.approvalToken),
    turnId: readString(body.turn_id) ?? readString(body.turnId),
    iteration: typeof body.iteration === "number" ? body.iteration : null,
    accountType: accountPolicy.account_type,
  });
  return res.status(result.ok ? 200 : 400).json({
    ...result,
    account_policy: accountPolicy,
    policy_gate: {
      account_type: accountPolicy.account_type,
      requested_mode: requestedMode ?? result.mode,
      effective_mode: effectiveMode,
      requested_agent_runtime: requestedRuntime,
      effective_agent_runtime: result.agent_runtime,
      capped: effectiveMode !== requestedMode || runtimeAccess.state !== "available",
      runtime_locked_reason: runtimeAccess.reason,
    },
  });
});
