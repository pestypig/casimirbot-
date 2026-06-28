import { Router } from "express";
import type { Request, Response } from "express";
import {
  callWorkstationGatewayCapability,
  listWorkstationGatewayCapabilities,
} from "../services/helix-ask/workstation-tool-gateway/registry";

export const workstationToolGatewayRouter = Router();

const readRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

workstationToolGatewayRouter.get("/workstation-tool-gateway/capabilities", (req: Request, res: Response) => {
  return res.status(200).json(listWorkstationGatewayCapabilities({
    agentRuntime: readString(req.query.agent_runtime) ?? readString(req.query.agentRuntime),
    mode: readString(req.query.mode),
  }));
});

workstationToolGatewayRouter.post("/workstation-tool-gateway/call", async (req: Request, res: Response) => {
  const body = readRecord(req.body);
  const result = await callWorkstationGatewayCapability({
    agentRuntime: readString(body.agent_runtime) ?? readString(body.agentRuntime),
    mode: readString(body.mode),
    capabilityId: readString(body.capability_id) ?? readString(body.capabilityId) ?? "",
    arguments: readRecord(body.arguments ?? body.args),
    approvalToken: readString(body.approval_token) ?? readString(body.approvalToken),
    turnId: readString(body.turn_id) ?? readString(body.turnId),
    iteration: typeof body.iteration === "number" ? body.iteration : null,
  });
  return res.status(result.ok ? 200 : 400).json(result);
});
