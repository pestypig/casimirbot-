import { Router } from "express";
import type { Request, Response } from "express";
import {
  callAccountAuthorizedWorkstationGatewayCapability,
  listAccountAuthorizedWorkstationGatewayCapabilities,
  resolveWorkstationGatewayAccountContext,
} from "../services/helix-ask/workstation-tool-gateway/account-policy";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";

export const workstationToolGatewayRouter = Router();

const readRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

workstationToolGatewayRouter.get(
  "/workstation-tool-gateway/capabilities",
  async (req: Request, res: Response) => {
    const accountContext = await resolveWorkstationGatewayAccountContext(
      readHelixSessionCookie(req.headers.cookie),
    );
    const requestedMode = readString(req.query.mode);
    const requestedRuntime =
      readString(req.query.agent_runtime) ?? readString(req.query.agentRuntime);
    return res.status(200).json(
      listAccountAuthorizedWorkstationGatewayCapabilities({
        accountContext,
        requestedMode,
        requestedRuntime,
      }),
    );
  },
);

workstationToolGatewayRouter.post(
  "/workstation-tool-gateway/call",
  async (req: Request, res: Response) => {
    const body = readRecord(req.body);
    const accountContext = await resolveWorkstationGatewayAccountContext(
      readHelixSessionCookie(req.headers.cookie),
    );
    const result = await callAccountAuthorizedWorkstationGatewayCapability({
      accountContext,
      requestedMode: readString(body.mode),
      requestedRuntime:
        readString(body.agent_runtime) ?? readString(body.agentRuntime),
      capabilityId:
        readString(body.capability_id) ?? readString(body.capabilityId) ?? "",
      arguments: readRecord(body.arguments ?? body.args),
      approvalReceipt: body.approval_receipt ?? body.approvalReceipt,
      approvalToken:
        readString(body.approval_token) ?? readString(body.approvalToken),
      turnId: readString(body.turn_id) ?? readString(body.turnId),
      conversationThreadId:
        readString(body.conversation_thread_id) ??
        readString(body.conversationThreadId),
      toolCallId:
        readString(body.tool_call_id) ?? readString(body.toolCallId),
      providerExecutionId:
        readString(body.provider_execution_id) ??
        readString(body.providerExecutionId),
      iteration: typeof body.iteration === "number" ? body.iteration : null,
    });
    return res.status(result.status_code).json(result.body);
  },
);
