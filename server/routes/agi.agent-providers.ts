import { Router } from "express";
import type { Request, Response } from "express";
import {
  listHelixAgentProviders,
  resolveDefaultHelixAgentProvider,
  resolveHelixAgentProvider,
} from "../services/helix-ask/agent-providers/registry";
import { buildHelixCapabilityLaneProviderAdapterContext } from "../services/helix-ask/capability-lanes/provider-adapter-context";
import { runHelixCapabilityLaneSessionRequests } from "../services/helix-ask/capability-lanes/session-runner";

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

agentProvidersRouter.post("/capability-lanes/one-shot", (req: Request, res: Response) => {
  const body = req.body && typeof req.body === "object"
    ? (req.body as Record<string, unknown>)
    : {};
  const provider = resolveHelixAgentProvider({
    body,
    headers: req.headers,
  });
  const capabilityLaneCall = body.capability_lane_call ?? body.capabilityLaneCall;
  const context = buildHelixCapabilityLaneProviderAdapterContext({
    provider,
    body: {
      turn_id: body.turn_id ?? body.turnId,
      capability_lane_call: capabilityLaneCall,
    },
    env: process.env,
  });
  const result = context.one_shot;

  res.json({
    ...result,
    schema: "helix.capability_lane.one_shot_response.v1",
    ok: result.requested === true && result.call_results.every((entry) => entry.ok === true),
    agent_runtime: provider.id,
    selected_agent_provider: {
      id: provider.id,
      label: provider.label,
      supports: provider.supports,
    },
    capability_lane_call_results: result.call_results,
    capability_lane_observation_packets: result.observation_packets,
    capability_lane_resolve_traces: result.resolve_traces,
    capability_lane_backend_selections: result.backend_selections,
    capability_lane_debug_events: result.debug_events,
    capability_lane_projection_receipts: context.projection_receipts,
    capability_lane_turn_timeline: context.capability_lane_turn_timeline,
    capability_lane_reentry_status: result.debug_projection.capability_lane_reentry_status,
    model_visible_capability_lane_manifest: context.model_visible_capability_lane_manifest,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  });
});

agentProvidersRouter.post("/capability-lanes/session", (req: Request, res: Response) => {
  const body = req.body && typeof req.body === "object"
    ? (req.body as Record<string, unknown>)
    : {};
  const provider = resolveHelixAgentProvider({
    body,
    headers: req.headers,
  });
  const result = runHelixCapabilityLaneSessionRequests({
    provider,
    body,
    env: process.env,
  });

  res.json({
    ...result,
    schema: "helix.capability_lane.session_control_response.v1",
    ok: result.session_results.every((entry) => entry.ok === true),
    agent_runtime: provider.id,
    selected_agent_provider: {
      id: provider.id,
      label: provider.label,
      supports: provider.supports,
    },
    capability_lane_session_results: result.session_results,
    capability_lane_session_debug_summaries: result.session_debug_summaries,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  });
});
