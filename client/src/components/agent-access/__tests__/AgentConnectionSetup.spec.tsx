// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildHelixAgentClientReadiness } from "@shared/helix-agent-client-readiness";
import {
  AGENT_CONNECTION_READINESS_ENDPOINT,
  AgentConnectionSetup,
} from "../AgentConnectionSetup";
import { AGENT_CONNECTION_SETUP_STORAGE_KEY } from "../agentConnectionSetupState";

const response = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const connectionStatus = (connected: boolean) => {
  const readiness = buildHelixAgentClientReadiness({
    agentSelected: true,
    provider_application: connected ? "available" : "unknown",
    client_authorization: "active",
    client_presence: connected ? "online" : "offline",
    catalog_sync: connected ? "current" : "stale",
    thread_attachment: connected ? "attached" : "not_attached",
    continuation_readiness: "polling",
    environment_readiness: "not_selected",
  });
  return {
    schema: "helix.agent_connection_status.v1",
    selected_client_profile: "codex_app",
    selected_profile_is_preference_only: true,
    client_kind_verified: false,
    authenticated_profile_ref: "profile-ref",
    service_instance_ref: "service-ref",
    oauth_binding_ref: "binding-ref",
    authenticated_mcp_client_ref: connected ? "mcp-client-ref" : null,
    client_session_ref: connected ? "client-session-ref" : null,
    conversation_thread_ref: connected ? "thread-ref" : null,
    proof_basis: connected ? "authenticated_presence_tool" : "none",
    observed_at: connected ? "2026-08-31T12:00:00.000Z" : null,
    heartbeat_expires_at: connected ? "2026-08-31T12:01:00.000Z" : null,
    authorization_changed_after_presence: false,
    catalog_reenumeration_required: false,
    catalog_recovery: "none",
    thread_observability_bridge: {
      negotiated_level: "tool_activity_only",
      declaration_basis: connected
        ? "authenticated_client_declaration"
        : "profile_default",
      checkpoint_publication_status: "not_requested",
      checkpoint_freshness_window_seconds: null,
      checkpoint_retention: "none",
      checkpoint_revocation: "not_applicable",
      provider_thread_content_included: false,
      hidden_reasoning_included: false,
      activity_completeness_claimed: false,
    },
    readiness,
    readiness_schema: readiness.schema,
    credential_included: false,
    oauth_subject_included: false,
    raw_claims_included: false,
    provider_thread_content_included: false,
    hidden_reasoning_included: false,
    environment_authority: false,
    mutation_authority: false,
    answer_authority: false,
    terminal_eligible: false,
  };
};

beforeEach(() => {
  window.localStorage.clear();
  delete window.casimirDesktop;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AgentConnectionSetup", () => {
  it("guides Codex setup without treating the optional plugin as connection proof", async () => {
    const openCodexPlugin = vi.fn(async () => undefined);
    window.casimirDesktop = Object.freeze({
      getRuntimeSnapshot: vi.fn(async () => null),
      getCodexPluginState: vi.fn(async () => ({
        schemaVersion: "casimir_desktop_codex_plugin/1",
        pluginName: "casimirbot-device-check",
        marketplaceName: "casimirbot",
        status: "ready",
        authentication: "on_install",
        connection: "oauth_protected_https_mcp",
        blockedReason: null,
      })),
      openCodexPlugin,
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(connectionStatus(false)))
      .mockResolvedValueOnce(response(connectionStatus(true)));
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);
    fireEvent.click(screen.getByRole("button", { name: /Codex App/i }));

    expect(await screen.findByText("Add CasimirBot to Codex App")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Add CasimirBot to Codex App" }))
      .toHaveFocus();
    expect(screen.getByDisplayValue("https://casimirbot.com/mcp/local-supervisor-coordination")).toBeInTheDocument();
    expect(screen.getByText(/Device Check-only|separate from the agent connection/i)).toBeInTheDocument();
    expect(screen.getByText(/Open Plugins, choose Installed/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/callback port|scope string/i);

    fireEvent.click(await screen.findByRole("button", { name: "Open optional Device Check" }));
    await waitFor(() => expect(openCodexPlugin).toHaveBeenCalledOnce());
    expect(screen.getByText("Add CasimirBot to Codex App")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "I added it" }));
    expect(screen.getByText("Check the connection")).toBeInTheDocument();
    expect(screen.getByText(/stop repeating the loop/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("AI app connected")).toBeInTheDocument();
    expect(screen.getByText(/does not expose private reasoning/i)).toBeInTheDocument();
    expect(screen.getByText(/Thread visibility: tool activity only/i)).toBeInTheDocument();
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain("binding-ref");
  });

  it("requires one explicit reconnect when authorization is newer than the catalog probe", async () => {
    window.localStorage.setItem(AGENT_CONNECTION_SETUP_STORAGE_KEY, JSON.stringify({
      schema: AGENT_CONNECTION_SETUP_STORAGE_KEY,
      selected_profile: "codex_app",
      viewed_step: "ready",
    }));
    const candidate = connectionStatus(true);
    candidate.authorization_changed_after_presence = true;
    candidate.catalog_reenumeration_required = true;
    candidate.catalog_recovery = "reconnect_and_refresh";
    candidate.readiness = buildHelixAgentClientReadiness({
      agentSelected: true,
      provider_application: "available",
      client_authorization: "active",
      client_presence: "online",
      catalog_sync: "stale",
      thread_attachment: "stale",
      continuation_readiness: "polling",
      environment_readiness: "not_selected",
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(candidate)));

    render(<AgentConnectionSetup />);
    expect(await screen.findByText("Refresh the AI app connection")).toBeInTheDocument();
    expect(screen.getByText(/authorization changed after this app last loaded/i)).toBeInTheDocument();
    expect(screen.queryByText("AI app connected")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("resumes only navigation preference and rechecks server authority", async () => {
    window.localStorage.setItem(AGENT_CONNECTION_SETUP_STORAGE_KEY, JSON.stringify({
      schema: AGENT_CONNECTION_SETUP_STORAGE_KEY,
      selected_profile: "standard_mcp",
      viewed_step: "check",
    }));
    const fetchMock = vi.fn().mockResolvedValue(response({}, 401));
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);
    expect(await screen.findByText("Sign in to CasimirBot")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `${AGENT_CONNECTION_READINESS_ENDPOINT}?client_profile=standard_mcp`,
      expect.objectContaining({ credentials: "same-origin", cache: "no-store" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Explain" }));
    expect(screen.getByText(/navigation only/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Choose your AI app")).toBeInTheDocument();
  });

  it("requires explicit confirmation before profile-owned revocation", async () => {
    window.localStorage.setItem(AGENT_CONNECTION_SETUP_STORAGE_KEY, JSON.stringify({
      schema: AGENT_CONNECTION_SETUP_STORAGE_KEY,
      selected_profile: "codex_app",
      viewed_step: "ready",
    }));
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(connectionStatus(true)))
      .mockResolvedValueOnce(response({ operation: "agent_account_binding.revoke" }))
      .mockResolvedValueOnce(response(connectionStatus(false)));
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);
    fireEvent.click(await screen.findByRole("button", { name: "Disconnect" }));
    expect(screen.getByText(/every AI client linked through it/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Confirm disconnect" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/account/session/agent-bindings/binding-ref",
      expect.objectContaining({ method: "DELETE", credentials: "same-origin" }),
    ));
  });

  it("allows the optional Device Check to be skipped with keyboard-native controls", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(connectionStatus(false))));
    render(<AgentConnectionSetup />);
    fireEvent.click(screen.getByRole("button", { name: /Codex App/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Skip Device Check" }));
    expect(screen.getByText("Device Check skipped.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explain" })).toHaveAttribute("aria-expanded", "false");
  });
});
