// @vitest-environment jsdom

import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildHelixAgentClientReadiness } from "@shared/helix-agent-client-readiness";
import { DESKTOP_MCP_TUNNEL_STATE_SCHEMA_VERSION } from "@shared/desktop-mcp-tunnel";
import {
  AGENT_CONNECTION_READINESS_ENDPOINT,
  FULL_HARNESS_TRUST_ENDPOINT,
  AgentConnectionSetup,
} from "../AgentConnectionSetup";
import { AGENT_CONNECTION_SETUP_STORAGE_KEY } from "../agentConnectionSetupState";
import {
  HELIX_WORKSTATION_GUIDANCE_EVENT,
  clearPendingWorkstationGuidance,
  requestWorkstationGuidance,
} from "@/lib/workstation/workstationGuidance";
import { useAgiChatStore } from "@/store/useAgiChatStore";

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
    continuation_readiness: "unavailable",
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

const fullTunnelState = {
  schemaVersion: DESKTOP_MCP_TUNNEL_STATE_SCHEMA_VERSION,
  transport: "openai_secure_mcp_tunnel" as const,
  access: "developer_private" as const,
  scope: "full_helix_agent" as const,
  status: "ready" as const,
  configured: true,
  vaultAvailable: true,
  binaryVersion: "0.0.13",
  processRunning: true,
  healthy: true,
  ready: true,
  adminUiAvailable: true,
  failureCode: null,
  recovery: {
    phase: "idle" as const,
    attemptCount: 0,
    maxAttempts: 3,
    nextAttemptAt: null,
    lastReason: null,
    automaticScope: "local_supervisor_coordination_and_device_check" as const,
    manualInterventionRequired: false,
  },
};

const fullHarnessTrust = (trusted: boolean) => ({
  schema: "helix.installed_device_full_harness_trust.v1",
  trusted,
  device_ref: "device:sha256:fixture",
  policy_revision: trusted ? 1 : 0,
  trusted_at: trusted ? "2026-09-03T12:00:00.000Z" : null,
  revoked_at: null,
  authority_limited_to_tunnel_transport: true,
  environment_authority_granted: false,
  trading_authority_granted: false,
  answer_authority: false,
  terminal_eligible: false,
});

const nativeFetch = (
  readiness: (url: string, init?: RequestInit) => Response | Promise<Response>,
) =>
  vi.fn((url: string, init?: RequestInit) =>
    url === FULL_HARNESS_TRUST_ENDPOINT && init?.method !== "PUT"
      ? Promise.resolve(response({ trust: fullHarnessTrust(false) }))
      : Promise.resolve(readiness(url, init)),
  );

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  window.localStorage.clear();
  delete window.casimirDesktop;
  useAgiChatStore.setState({ activeId: undefined });
});

afterEach(() => {
  cleanup();
  clearPendingWorkstationGuidance();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AgentConnectionSetup", () => {
  it("adopts an already-active native Full Harness when MCP guidance arrives", async () => {
    const startMcpTunnel = vi.fn(async () => fullTunnelState);
    window.casimirDesktop = Object.freeze({
      getRuntimeSnapshot: vi.fn(async () => null),
      startMcpTunnel,
      getMcpTunnelState: vi.fn(async () => fullTunnelState),
    });
    const fetchMock = vi.fn((url: string, init?: RequestInit) =>
      url === FULL_HARNESS_TRUST_ENDPOINT && init?.method !== "PUT"
        ? Promise.resolve(response({ trust: fullHarnessTrust(true) }))
        : Promise.resolve(response(connectionStatus(true))),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);
    requestWorkstationGuidance({
      kind: "user_attention",
      panelId: "agent-access",
      targetId: "full-harness-trust",
      label: "Continue setup.",
    });

    expect(await screen.findByText("AI app connected")).toBeInTheDocument();
    expect(startMcpTunnel).not.toHaveBeenCalled();
    expect(
      window.casimirDesktop.getMcpTunnelState,
    ).toHaveBeenCalledTimes(1);
  });

  it("rechecks readiness when MCP presents the exact binding control", async () => {
    const getMcpTunnelState = vi.fn(async () => fullTunnelState);
    window.casimirDesktop = Object.freeze({
      getRuntimeSnapshot: vi.fn(async () => null),
      getMcpTunnelState,
    });
    const fetchMock = nativeFetch(() => response(connectionStatus(true)));
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);
    requestWorkstationGuidance({
      kind: "user_attention",
      panelId: "agent-access",
      controlId:
        "workstation.panel.agent-access.agent-connection-setup.bind-current-helix-chat",
      label: "Review the exact binding control.",
    });

    expect(await screen.findByText("AI app connected")).toBeInTheDocument();
    expect(getMcpTunnelState).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `${AGENT_CONNECTION_READINESS_ENDPOINT}?client_profile=codex_app`,
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("rechecks readiness when MCP presents the OAuth account-link prerequisite", async () => {
    const getMcpTunnelState = vi.fn(async () => fullTunnelState);
    window.casimirDesktop = Object.freeze({
      getRuntimeSnapshot: vi.fn(async () => null),
      getMcpTunnelState,
    });
    const fetchMock = nativeFetch(() => response(connectionStatus(false)));
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);
    requestWorkstationGuidance({
      kind: "user_attention",
      panelId: "agent-access",
      targetId: "auth0-account-link",
      label: "Link the verified OAuth account.",
    });

    expect(await screen.findByText("Add CasimirBot to Codex App")).toBeInTheDocument();
    expect(getMcpTunnelState).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `${AGENT_CONNECTION_READINESS_ENDPOINT}?client_profile=codex_app`,
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("replays binding guidance when MCP opens the panel before it mounts", async () => {
    const getMcpTunnelState = vi.fn(async () => fullTunnelState);
    window.casimirDesktop = Object.freeze({
      getRuntimeSnapshot: vi.fn(async () => null),
      getMcpTunnelState,
    });
    const fetchMock = nativeFetch(() => response(connectionStatus(true)));
    vi.stubGlobal("fetch", fetchMock);

    requestWorkstationGuidance({
      kind: "user_attention",
      panelId: "agent-access",
      controlId:
        "workstation.panel.agent-access.agent-connection-setup.bind-current-helix-chat",
      label: "Review the exact binding control.",
      durationMs: 12_000,
    });
    render(<AgentConnectionSetup />);

    expect(await screen.findByText("AI app connected")).toBeInTheDocument();
    expect(getMcpTunnelState).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `${AGENT_CONNECTION_READINESS_ENDPOINT}?client_profile=codex_app`,
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("waits for the accepted tunnel transition before rechecking binding readiness", async () => {
    const getMcpTunnelState = vi
      .fn()
      .mockResolvedValueOnce({
        ...fullTunnelState,
        status: "starting",
        healthy: false,
        ready: false,
      })
      .mockResolvedValue(fullTunnelState);
    window.casimirDesktop = Object.freeze({
      getRuntimeSnapshot: vi.fn(async () => null),
      getMcpTunnelState,
    });
    const fetchMock = nativeFetch(() => response(connectionStatus(true)));
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);
    requestWorkstationGuidance({
      kind: "user_attention",
      panelId: "agent-access",
      controlId:
        "workstation.panel.agent-access.agent-connection-setup.bind-current-helix-chat",
      label: "Review the exact binding control.",
      durationMs: 12_000,
    });

    await waitFor(() => expect(getMcpTunnelState).toHaveBeenCalledTimes(2), {
      timeout: 1500,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `${AGENT_CONNECTION_READINESS_ENDPOINT}?client_profile=codex_app`,
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("lets the mounted target consume native guidance that the desktop shell could not deliver", async () => {
    const getMcpTunnelState = vi.fn(async () => fullTunnelState);
    window.casimirDesktop = Object.freeze({
      getRuntimeSnapshot: vi.fn(async () => null),
      getMcpTunnelState,
      getPendingWorkstationGuidance: vi.fn(async () => ({
        kind: "user_attention",
        panelId: "agent-access",
        controlId:
          "workstation.panel.agent-access.agent-connection-setup.bind-current-helix-chat",
        label: "Review the exact binding control.",
        durationMs: 12_000,
      })),
    });
    const fetchMock = nativeFetch(() => response(connectionStatus(true)));
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);

    await waitFor(() => expect(getMcpTunnelState).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      `${AGENT_CONNECTION_READINESS_ENDPOINT}?client_profile=codex_app`,
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("uses the one-shot native presentation marker when the preload bridge is degraded", async () => {
    window.history.replaceState(
      null,
      "",
      "/agent-access?native_presentation=reasoning-binding",
    );
    const fetchMock = vi.fn().mockResolvedValue(response(connectionStatus(true)));
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);

    expect(await screen.findByText("AI app connected")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `${AGENT_CONNECTION_READINESS_ENDPOINT}?client_profile=codex_app`,
      expect.objectContaining({ credentials: "same-origin" }),
    );
    expect(window.location.search).not.toContain("native_presentation");
  });

  it("keeps exact-task binding discoverable when continuation needs a recheck", async () => {
    useAgiChatStore.setState({ activeId: "helix-chat-test" });
    window.localStorage.setItem(
      AGENT_CONNECTION_SETUP_STORAGE_KEY,
      JSON.stringify({
        schema: AGENT_CONNECTION_SETUP_STORAGE_KEY,
        selected_profile: "codex_app",
        viewed_step: "ready",
      }),
    );
    const fetchMock = vi.fn().mockResolvedValue(response(connectionStatus(true)));
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);

    expect(
      await screen.findByText("Bind the current Helix chat to this exact AI task"),
    ).toBeInTheDocument();
    expect(screen.getByText(/continuation was unavailable at the last check/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bind current Helix chat" }),
    ).toBeDisabled();
    const recheck = screen.getByRole("button", { name: "Recheck connection" });
    fireEvent.click(recheck);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("starts the native full harness once and then diagnoses the exact Codex connection", async () => {
    const guidance = vi.fn();
    window.addEventListener(HELIX_WORKSTATION_GUIDANCE_EVENT, guidance);
    const startMcpTunnel = vi.fn(async () => fullTunnelState);
    window.casimirDesktop = Object.freeze({
      getRuntimeSnapshot: vi.fn(async () => null),
      startMcpTunnel,
      getMcpTunnelState: vi.fn(async () => fullTunnelState),
    });
    const fetchMock = nativeFetch(() => response(connectionStatus(true)));
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);
    expect(document.body.textContent).toMatch(/never approves OAuth/i);
    fireEvent.click(screen.getByRole("button", { name: "Start Harness" }));

    await waitFor(() => expect(startMcpTunnel).toHaveBeenCalledTimes(1));
    expect(startMcpTunnel).toHaveBeenCalledWith({ scope: "full_helix_agent" });
    expect(await screen.findByText("AI app connected")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `${AGENT_CONNECTION_READINESS_ENDPOINT}?client_profile=codex_app`,
      expect.objectContaining({
        credentials: "same-origin",
        cache: "no-store",
      }),
    );
    expect(guidance).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          kind: "user_attention",
          panelId: "agent-access",
          targetId: "full-harness-trust",
        }),
      }),
    );
    window.removeEventListener(HELIX_WORKSTATION_GUIDANCE_EVENT, guidance);
  });

  it("uses the same Start Harness entry point for browser diagnosis without native mutation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response(connectionStatus(false)));
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);
    fireEvent.click(screen.getByRole("button", { name: "Start Harness" }));

    expect(
      await screen.findByText("Add CasimirBot to Codex App"),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps Start Harness available after persisted setup and performs one fresh diagnosis", async () => {
    window.localStorage.setItem(
      AGENT_CONNECTION_SETUP_STORAGE_KEY,
      JSON.stringify({
        schema: AGENT_CONNECTION_SETUP_STORAGE_KEY,
        selected_profile: "codex_app",
        viewed_step: "check",
      }),
    );
    const startMcpTunnel = vi.fn(async () => fullTunnelState);
    window.casimirDesktop = Object.freeze({
      getRuntimeSnapshot: vi.fn(async () => null),
      startMcpTunnel,
      getMcpTunnelState: vi.fn(async () => fullTunnelState),
    });
    let readinessCalls = 0;
    const fetchMock = nativeFetch(() =>
      response(connectionStatus(++readinessCalls > 1)),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);
    const startButton = await screen.findByRole("button", {
      name: "Start Harness",
    });
    fireEvent.click(startButton);

    await waitFor(() => expect(startMcpTunnel).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("AI app connected")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        String(url).startsWith(AGENT_CONNECTION_READINESS_ENDPOINT),
      ),
    ).toHaveLength(2);
  });

  it("copies only sanitized finite onboarding diagnostics", async () => {
    window.localStorage.setItem(
      AGENT_CONNECTION_SETUP_STORAGE_KEY,
      JSON.stringify({
        schema: AGENT_CONNECTION_SETUP_STORAGE_KEY,
        selected_profile: "codex_app",
        viewed_step: "ready",
      }),
    );
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    window.casimirDesktop = Object.freeze({
      getRuntimeSnapshot: vi.fn(async () => null),
      getMcpTunnelState: vi.fn(async () => fullTunnelState),
    });
    vi.stubGlobal(
      "fetch",
      nativeFetch(() => response(connectionStatus(true))),
    );

    render(<AgentConnectionSetup />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Copy diagnostics" }),
    );

    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    const exported = writeText.mock.calls[0]?.[0] ?? "";
    expect(JSON.parse(exported)).toMatchObject({
      schema: "helix.agent_harness_onboarding_diagnostic.v1",
      native_desktop_available: true,
      provider_task_created: false,
      codex_ui_automation_used: false,
      credential_included: false,
      answer_authority: false,
      terminal_eligible: false,
    });
    expect(exported).not.toContain("profile-ref");
    expect(exported).not.toContain("mcp-client-ref");
    expect(exported).not.toContain("thread-ref");
    expect(
      await screen.findByText("Sanitized onboarding diagnostics copied."),
    ).toBeInTheDocument();
  });

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
    let readinessCalls = 0;
    const fetchMock = nativeFetch(() =>
      response(connectionStatus(++readinessCalls > 1)),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);
    fireEvent.click(screen.getByRole("button", { name: /Codex App/i }));

    expect(
      await screen.findByText("Add CasimirBot to Codex App"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Add CasimirBot to Codex App" }),
    ).toHaveFocus();
    expect(
      screen.getByDisplayValue(
        "https://casimirbot.com/mcp/local-supervisor-coordination",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Device Check-only|separate from the agent connection/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Open Plugins, choose Installed/i),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(
      /callback port|scope string/i,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Open optional Device Check" }),
    );
    await waitFor(() => expect(openCodexPlugin).toHaveBeenCalledOnce());
    expect(screen.getByText("Add CasimirBot to Codex App")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "I added it" }));
    expect(screen.getByText("Check the connection")).toBeInTheDocument();
    expect(screen.getByText(/stop repeating the loop/i)).toBeInTheDocument();
    expect(
      screen.getByText(/separate Device Check plugin/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("AI app connected")).toBeInTheDocument();
    expect(
      screen.getByText(/does not expose private reasoning/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Thread visibility: tool activity only/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /sees harness tool activity only and cannot send messages/i,
      ),
    ).toBeInTheDocument();
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain("binding-ref");
  });

  it("requires one explicit same-task reload when authorization is newer than the catalog probe", async () => {
    window.localStorage.setItem(
      AGENT_CONNECTION_SETUP_STORAGE_KEY,
      JSON.stringify({
        schema: AGENT_CONNECTION_SETUP_STORAGE_KEY,
        selected_profile: "codex_app",
        viewed_step: "ready",
      }),
    );
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
    expect(
      await screen.findByText("Refresh this AI task's connection"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/authorization changed after this task last loaded/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/in-place MCP reload for this same task/i),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(
      /start a fresh (chat|task)|begin a new chat/i,
    );
    expect(screen.queryByText("AI app connected")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("resumes only navigation preference and rechecks server authority", async () => {
    window.localStorage.setItem(
      AGENT_CONNECTION_SETUP_STORAGE_KEY,
      JSON.stringify({
        schema: AGENT_CONNECTION_SETUP_STORAGE_KEY,
        selected_profile: "standard_mcp",
        viewed_step: "check",
      }),
    );
    const fetchMock = vi.fn().mockResolvedValue(response({}, 401));
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);
    expect(
      await screen.findByText("Sign in to CasimirBot"),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `${AGENT_CONNECTION_READINESS_ENDPOINT}?client_profile=standard_mcp`,
      expect.objectContaining({
        credentials: "same-origin",
        cache: "no-store",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Explain" }));
    expect(screen.getByText(/navigation only/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Choose your AI app")).toBeInTheDocument();
  });

  it("requires explicit confirmation before profile-owned revocation", async () => {
    window.localStorage.setItem(
      AGENT_CONNECTION_SETUP_STORAGE_KEY,
      JSON.stringify({
        schema: AGENT_CONNECTION_SETUP_STORAGE_KEY,
        selected_profile: "codex_app",
        viewed_step: "ready",
      }),
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(connectionStatus(true)))
      .mockResolvedValueOnce(
        response({ operation: "agent_account_binding.revoke" }),
      )
      .mockResolvedValueOnce(response(connectionStatus(false)));
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);
    fireEvent.click(await screen.findByRole("button", { name: "Disconnect" }));
    expect(
      screen.getByText(/every AI client linked through it/i),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Confirm disconnect" }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/account/session/agent-bindings/binding-ref",
        expect.objectContaining({
          method: "DELETE",
          credentials: "same-origin",
        }),
      ),
    );
  });

  it("rehydrates the current exact reasoning binding after readiness reload", async () => {
    window.localStorage.setItem(
      AGENT_CONNECTION_SETUP_STORAGE_KEY,
      JSON.stringify({
        schema: AGENT_CONNECTION_SETUP_STORAGE_KEY,
        selected_profile: "codex_app",
        viewed_step: "ready",
      }),
    );
    const candidate = connectionStatus(true);
    candidate.readiness = buildHelixAgentClientReadiness({
      agentSelected: true,
      provider_application: "available",
      client_authorization: "active",
      client_presence: "online",
      catalog_sync: "current",
      thread_attachment: "attached",
      continuation_readiness: "polling",
      environment_readiness: "not_selected",
    });
    candidate.thread_observability_bridge.negotiated_level =
      "continuation_ready";
    const binding = {
      reasoning_binding_id: "reasoning_binding:reload-test",
      helix_conversation_id: "helix-chat-test",
      status: "active",
      continuation_transport: "polling",
      binding_epoch: 2,
      service_instance_ref: "service-ref",
      expires_at: "2026-09-04T12:10:00.000Z",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(candidate))
      .mockResolvedValueOnce(response({ binding }))
      .mockResolvedValueOnce(
        response({ binding: { ...binding, status: "revoked" } }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);

    expect(await screen.findByText(/Binding state:/i)).toHaveTextContent(
      "active",
    );
    expect(
      screen.getByText("Bind the current Helix chat to this exact AI task")
        .closest("[data-helix-guidance-target='reasoning-task-binding']"),
    ).toHaveAttribute("data-helix-guidance-satisfied", "true");
    const replaceButton = screen.getByRole("button", {
      name: "Replace binding",
    });
    expect(replaceButton).toHaveAttribute(
      "data-helix-control-id",
      "workstation.panel.agent-access.agent-connection-setup.bind-current-helix-chat",
    );
    expect(replaceButton).toHaveAttribute(
      "data-helix-interaction-kind",
      "human_only",
    );
    expect(screen.getByRole("button", { name: "Check binding" })).toHaveAttribute(
      "data-helix-control-id",
      "workstation.panel.agent-access.agent-connection-setup.check-reasoning-binding",
    );
    const revokeButton = screen.getByRole("button", { name: "Revoke binding" });
    expect(revokeButton).toHaveAttribute(
      "data-helix-control-id",
      "workstation.panel.agent-access.agent-connection-setup.revoke-reasoning-binding",
    );
    expect(revokeButton).toHaveAttribute(
      "data-helix-interaction-kind",
      "human_only",
    );
    fireEvent.click(revokeButton);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/account/session/agent-connections/reasoning-bindings/reasoning_binding%3Areload-test/revoke",
        expect.objectContaining({ method: "POST", credentials: "same-origin" }),
      ),
    );
    expect(await screen.findByText(/Binding state:/i)).toHaveTextContent(
      "revoked",
    );
  });

  it("clears a pending show-once claim when its authoritative binding disappears", async () => {
    useAgiChatStore.setState({ activeId: "helix-chat-test" });
    window.localStorage.setItem(
      AGENT_CONNECTION_SETUP_STORAGE_KEY,
      JSON.stringify({
        schema: AGENT_CONNECTION_SETUP_STORAGE_KEY,
        selected_profile: "codex_app",
        viewed_step: "ready",
      }),
    );
    const candidate = connectionStatus(true);
    candidate.readiness = buildHelixAgentClientReadiness({
      agentSelected: true,
      provider_application: "available",
      client_authorization: "active",
      client_presence: "online",
      catalog_sync: "current",
      thread_attachment: "attached",
      continuation_readiness: "polling",
      environment_readiness: "not_selected",
    });
    candidate.thread_observability_bridge.negotiated_level =
      "continuation_ready";
    const pending = {
      reasoning_binding_id: "reasoning_binding:pending-test",
      helix_conversation_id: "helix-chat-test",
      status: "pending_claim",
      continuation_transport: "polling",
      binding_epoch: 3,
      service_instance_ref: "service-ref",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(candidate))
      .mockResolvedValueOnce(response({ binding: pending }))
      .mockResolvedValueOnce(
        response({ claim_handle: "reasoning_claim:fresh-test-value", binding: pending }, 201),
      )
      .mockResolvedValueOnce(
        response({ error: "reasoning_binding_not_found" }, 404),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);
    fireEvent.click(await screen.findByRole("button", { name: "Replace binding" }));
    expect(
      await screen.findByDisplayValue("reasoning_claim:fresh-test-value"),
    ).toBeInTheDocument();
    expect(screen.getByText(/packaged-service restart invalidates it immediately/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Check binding" }));
    expect(
      await screen.findByText(/show-once claim is no longer valid/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByDisplayValue("reasoning_claim:fresh-test-value"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bind current Helix chat" })).toBeInTheDocument();
  });

  it("explains how to recover when the exact AI task presence expired", async () => {
    useAgiChatStore.setState({ activeId: "helix-chat-test" });
    window.localStorage.setItem(
      AGENT_CONNECTION_SETUP_STORAGE_KEY,
      JSON.stringify({
        schema: AGENT_CONNECTION_SETUP_STORAGE_KEY,
        selected_profile: "codex_app",
        viewed_step: "ready",
      }),
    );
    const candidate = connectionStatus(true);
    candidate.readiness = buildHelixAgentClientReadiness({
      agentSelected: true,
      provider_application: "available",
      client_authorization: "active",
      client_presence: "online",
      catalog_sync: "current",
      thread_attachment: "attached",
      continuation_readiness: "polling",
      environment_readiness: "not_selected",
    });
    candidate.thread_observability_bridge.negotiated_level =
      "continuation_ready";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(candidate))
      .mockResolvedValueOnce(response({ error: "reasoning_binding_not_found" }, 404))
      .mockResolvedValueOnce(
        response({ error: "reasoning_binding_target_inactive" }, 409),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Bind current Helix chat" }),
    );

    expect(
      await screen.findByText(/short supervisor presence expired/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/same task/i)).toBeInTheDocument();
    expect(screen.getByText(/Do not restart CasimirBot/i)).toBeInTheDocument();
  });

  it("allows the optional Device Check to be skipped with keyboard-native controls", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response(connectionStatus(false))),
    );
    render(<AgentConnectionSetup />);
    fireEvent.click(screen.getByRole("button", { name: /Codex App/i }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Skip Device Check" }),
    );
    expect(screen.getByText("Device Check skipped.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explain" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("lets the packaged desktop explicitly trust this device without granting environment authority", async () => {
    window.casimirDesktop = Object.freeze({
      getRuntimeSnapshot: vi.fn(async () => null),
    });
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url !== FULL_HARNESS_TRUST_ENDPOINT) {
        return Promise.resolve(response(connectionStatus(false)));
      }
      if (init?.method === "PUT") {
        return Promise.resolve(response({ trust: fullHarnessTrust(true) }));
      }
      return Promise.resolve(response({ trust: fullHarnessTrust(false) }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);
    const trustButton = await screen.findByRole("button", {
      name: /Trust this device for Full Harness/i,
    });
    await waitFor(() => expect(trustButton).toBeEnabled());
    fireEvent.click(trustButton);
    expect(
      await screen.findByText("This device is trusted for Full Harness"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Remove Full Harness device trust",
      }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      FULL_HARNESS_TRUST_ENDPOINT,
      expect.objectContaining({
        method: "PUT",
        credentials: "same-origin",
        body: JSON.stringify({ trusted: true }),
      }),
    );
    expect(
      screen.getByText(
        /never grants in-environment Minecraft actions, trading, answer, or terminal authority/i,
      ),
    ).toBeInTheDocument();
  });

  it("resumes one pending Start Harness attempt after device trust is granted", async () => {
    const startMcpTunnel = vi
      .fn()
      .mockRejectedValueOnce(new Error("device trust required"))
      .mockResolvedValueOnce(fullTunnelState);
    window.casimirDesktop = Object.freeze({
      getRuntimeSnapshot: vi.fn(async () => null),
      startMcpTunnel,
      getMcpTunnelState: vi.fn(async () => fullTunnelState),
    });
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === FULL_HARNESS_TRUST_ENDPOINT) {
        return Promise.resolve(
          response({
            trust: fullHarnessTrust(init?.method === "PUT"),
            delegated_request_refs:
              init?.method === "PUT" ? ["transition_request:fixture"] : [],
          }),
        );
      }
      return Promise.resolve(response(connectionStatus(false)));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Start Harness" }),
    );
    await waitFor(() => expect(startMcpTunnel).toHaveBeenCalledTimes(1));

    const trustButton = await screen.findByRole("button", {
      name: "Trust this device for Full Harness",
    });
    await waitFor(() => expect(trustButton).toBeEnabled());
    fireEvent.click(trustButton);

    await waitFor(() => expect(startMcpTunnel).toHaveBeenCalledTimes(2));
    expect(startMcpTunnel).toHaveBeenLastCalledWith({
      scope: "full_helix_agent",
    });
    expect(
      await screen.findByText(/pending Full Harness start resumed successfully/i),
    ).toBeInTheDocument();
  });
});
