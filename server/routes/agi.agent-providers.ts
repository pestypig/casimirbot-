import { Router } from "express";
import { listHelixAgentProviders } from "../services/helix-ask/agent-providers/registry";

export const agentProvidersRouter = Router();

agentProvidersRouter.get("/agent-providers", (_req, res) => {
  res.json({
    schema: "helix.agent_providers.v1",
    providers: listHelixAgentProviders(),
    default_provider: process.env.HELIX_ASK_AGENT_RUNTIME || "helix",
  });
});
