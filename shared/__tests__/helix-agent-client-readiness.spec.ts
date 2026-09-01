import { describe, expect, it } from "vitest";
import {
  buildHelixAgentClientReadiness,
  HELIX_NO_AGENT_CAPABILITIES,
  helixAgentClientReadinessSchema,
} from "../helix-agent-client-readiness";

const readyAxes = {
  provider_application: "available" as const,
  client_authorization: "active" as const,
  client_presence: "online" as const,
  catalog_sync: "current" as const,
  thread_attachment: "attached" as const,
  continuation_readiness: "ready" as const,
  environment_readiness: "ready" as const,
};

describe("Helix agent-client readiness", () => {
  it("makes no-agent operation useful and explicit", () => {
    const projection = buildHelixAgentClientReadiness({
      ...readyAxes,
      agentSelected: false,
      provider_application: "unavailable",
      client_authorization: "missing",
      client_presence: "offline",
      catalog_sync: "unsupported",
      thread_attachment: "unsupported",
      continuation_readiness: "unavailable",
      environment_readiness: "not_selected",
    });

    expect(projection).toMatchObject({
      mode: "no_agent",
      status: "no_agent",
      agent_ready: false,
      manual_harness_ready: true,
      recovery_action: "choose_agent_app",
      credential_included: false,
      hidden_reasoning_included: false,
      answer_authority: false,
    });
    expect(projection.available_without_agent).toEqual([
      ...HELIX_NO_AGENT_CAPABILITIES,
    ]);
  });

  it("does not infer readiness from authorization when the client is offline", () => {
    expect(buildHelixAgentClientReadiness({
      ...readyAxes,
      agentSelected: true,
      client_presence: "offline",
    })).toMatchObject({
      status: "degraded",
      agent_ready: false,
      recovery_action: "open_agent_app",
    });
  });

  it("does not infer steering readiness from a synchronized catalog", () => {
    expect(buildHelixAgentClientReadiness({
      ...readyAxes,
      agentSelected: true,
      thread_attachment: "not_attached",
    })).toMatchObject({
      status: "degraded",
      agent_ready: false,
      recovery_action: "choose_task",
    });
  });

  it("keeps environment degradation separate from agent readiness", () => {
    expect(buildHelixAgentClientReadiness({
      ...readyAxes,
      agentSelected: true,
      environment_readiness: "offline",
    })).toMatchObject({
      status: "degraded",
      agent_ready: true,
      recovery_action: "reconnect_environment",
    });
  });

  it("rejects secret, thread-content, and reasoning fields", () => {
    const projection = buildHelixAgentClientReadiness({
      ...readyAxes,
      agentSelected: true,
    });
    expect(() => helixAgentClientReadinessSchema.parse({
      ...projection,
      access_token: "must-not-project",
    })).toThrow();
    expect(projection).toMatchObject({
      status: "ready",
      credential_included: false,
      provider_thread_content_included: false,
      hidden_reasoning_included: false,
      terminal_eligible: false,
    });
  });
});
