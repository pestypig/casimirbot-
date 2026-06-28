import { Router } from "express";
import type { Request, Response } from "express";
import { listHelixAgentProviders } from "../services/helix-ask/agent-providers/registry";

export const agentProvidersRouter = Router();

agentProvidersRouter.get("/agent-providers", (_req: Request, res: Response) => {
  res.json({
    schema: "helix.agent_providers.v1",
    providers: listHelixAgentProviders(),
    default_provider: process.env.HELIX_ASK_AGENT_RUNTIME || "helix",
  });
});
