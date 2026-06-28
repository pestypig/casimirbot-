import { Router } from "express";
import type { Request, Response } from "express";
import {
  listHelixAgentProviders,
  resolveDefaultHelixAgentProvider,
} from "../services/helix-ask/agent-providers/registry";

export const agentProvidersRouter = Router();

agentProvidersRouter.get("/agent-providers", (_req: Request, res: Response) => {
  const defaultProvider = resolveDefaultHelixAgentProvider();
  res.json({
    schema: "helix.agent_providers.v1",
    providers: listHelixAgentProviders(),
    default_provider: defaultProvider.id,
    default_provider_label: defaultProvider.label,
  });
});
