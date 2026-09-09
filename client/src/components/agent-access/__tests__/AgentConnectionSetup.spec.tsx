// @vitest-environment jsdom

import React from "react";
import {
  act,
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
    heartbeat_expires_at: connected ? new Date(Date.now() + 180_000).toISOString() : null,
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
  vi.useRealTimers();
  clearPendingWorkstationGuidance();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AgentConnectionSetup", () => {
  it("recovers cold-start setup to binding by read-only polling", async () => {
    let current = connectionStatus(false);
    const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => url.startsWith(AGENT_CONNECTION_READINESS_ENDPOINT) ? response(current) : response({}, 404));
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers();
    requestWorkstationGuidance({ kind: "user_attention", panelId: "agent-access", targetId: "external-ai-connection-setup", label: "Set up connection" });
    await act(async () => { render(<AgentConnectionSetup />); });
    expect(screen.getByText("Waiting for your AI task")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check connection" })).toBeInTheDocument();
    expect(screen.queryByText("Add CasimirBot to Codex App")).not.toBeInTheDocument();
    current = connectionStatus(true);
    current.readiness.continuation_readiness = "polling";
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(screen.getByText("Review task binding")).toBeInTheDocument();
    expect(fetchMock.mock.calls.every(([, init]) => !init?.method || init.method === "GET")).toBe(true);
  });
  it.each([false, true])("resumes confirmed destination setup when panel already mounted: %s", async (mounted) => {
    const fetchMock = nativeFetch(() => response(connectionStatus(true)));
    vi.stubGlobal("fetch", fetchMock);
    if (mounted) render(<AgentConnectionSetup />);
    act(() => requestWorkstationGuidance({ kind: "user_attention", panelId: "agent-access", targetId: "external-ai-connection-setup", label: "Continue connection setup" }));
    if (!mounted) render(<AgentConnectionSetup />);
    expect(await screen.findByText("Review task binding")).toBeInTheDocument();
    expect(screen.getByText("Bind the current Helix chat to this exact AI task")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bind current Helix chat" })).toBeDisabled();
    expect(fetchMock.mock.calls.every(([, init]) => !init?.method || init.method === "GET")).toBe(true);
  });
  it("observes task recovery without focus or consent mutation and stops after run readiness", async () => {
    useAgiChatStore.setState({ activeId: "helix-chat-test" });
    window.localStorage.setItem(AGENT_CONNECTION_SETUP_STORAGE_KEY, JSON.stringify({
      schema: AGENT_CONNECTION_SETUP_STORAGE_KEY,
      selected_profile: "codex_app", viewed_step: "ready",
    }));
    let current = connectionStatus(true);
    const fetchMock = vi.fn(async (url: string, _init?: RequestInit) =>
      url.startsWith(AGENT_CONNECTION_READINESS_ENDPOINT)
        ? response(current)
        : response({ error: "reasoning_binding_not_found" }, 404));
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers();
    let unmount!: () => void;
    await act(async () => { ({ unmount } = render(<AgentConnectionSetup />)); });
    expect(screen.getByRole("button", { name: "Bind current Helix chat" })).toBeDisabled();
    expect(screen.getByText(/cannot wake an idle task/)).toBeInTheDocument();
    const initial = fetchMock.mock.calls.length;
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(fetchMock).toHaveBeenCalledTimes(initial);
    visibility.mockReturnValue("visible");
    current = { ...current, readiness: { ...current.readiness, continuation_readiness: "polling" },
      ...{ verified_run_association: { run_id: "run-prepared", run_version: 1, room_id: "room-current",
        room_binding_id: "room-binding-current", room_binding_version: 1, verification_ref: "verified-prepared" } } };
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(screen.getByRole("button", { name: "Bind current Helix chat" })).toBeEnabled();
    const recovered = fetchMock.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(fetchMock).toHaveBeenCalledTimes(recovered);
    expect(fetchMock.mock.calls.every(([, init]) =>
      !init?.method || init.method === "GET",
    )).toBe(true);
    unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(fetchMock).toHaveBeenCalledTimes(recovered);
  });

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

  it("recovers failed presentation after a late native ready event without granting permission", async () => {
    let publish: ((state: unknown) => void) | undefined;
    const unsubscribe = vi.fn();
    const getMcpTunnelState = vi.fn()
      .mockRejectedValueOnce(new Error("not ready"))
      .mockResolvedValue(fullTunnelState);
    const startMcpTunnel = vi.fn();
    window.casimirDesktop = Object.freeze({
      getRuntimeSnapshot: vi.fn(async () => null),
      getMcpTunnelState, startMcpTunnel,
      onMcpTunnelState: (listener: (state: unknown) => void) => { publish = listener; return unsubscribe; },
    });
    const fetchMock = nativeFetch(() => response(connectionStatus(true)));
    vi.stubGlobal("fetch", fetchMock);
    const view = render(<AgentConnectionSetup />);
    requestWorkstationGuidance({ kind: "user_attention", panelId: "agent-access",
      controlId: "workstation.panel.agent-access.agent-connection-setup.bind-current-helix-chat", label: "Review binding." });
    await screen.findByText(/could not read native Full Harness transport readiness/);
    act(() => publish?.({ ...fullTunnelState, ready: false }));
    expect(getMcpTunnelState).toHaveBeenCalledTimes(1);
    act(() => publish?.(fullTunnelState));
    expect(await screen.findByText("AI app connected")).toBeInTheDocument();
    expect(screen.queryByText(/could not read native Full Harness transport readiness/)).not.toBeInTheDocument();
    expect(startMcpTunnel).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/claims"))).toBe(false);
    view.unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it.each(["rejected", "not-ready"])("reports %s native presentation instead of silently abandoning it", async (mode) => {
    const getMcpTunnelState = vi.fn(() => mode === "rejected"
      ? Promise.reject(new Error("private diagnostic must not leak"))
      : Promise.resolve({ ...fullTunnelState, ready: false, healthy: false, status: "starting" }));
    window.casimirDesktop = Object.freeze({
      getRuntimeSnapshot: vi.fn(async () => null),
      getMcpTunnelState,
    });
    vi.stubGlobal("fetch", nativeFetch(() => response(connectionStatus(true))));
    render(<AgentConnectionSetup />);
    requestWorkstationGuidance({
      kind: "user_attention",
      panelId: "agent-access",
      controlId: "workstation.panel.agent-access.agent-connection-setup.bind-current-helix-chat",
      label: "Review binding.",
    });
    const message = mode === "rejected"
      ? /could not read native Full Harness transport readiness/
      : /did not become ready within 5 seconds/;
    expect(await screen.findByText(message, {}, { timeout: 6500 })).toHaveAttribute("role", "alert");
    expect(screen.queryByText(/private diagnostic must not leak/)).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Checking connection…" })).not.toBeInTheDocument();
    });
    expect(screen.getByText(message)).toHaveAttribute("role", "alert");
    expect(getMcpTunnelState).toHaveBeenCalledTimes(mode === "rejected" ? 1 : 21);
  }, 8000);

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

  it("shows the presence deadline while waiting, without a binding section", async () => {
    window.localStorage.setItem(AGENT_CONNECTION_SETUP_STORAGE_KEY, JSON.stringify({
      schema: AGENT_CONNECTION_SETUP_STORAGE_KEY,
      selected_profile: "codex_app",
      viewed_step: "check",
    }));
    const current = connectionStatus(false);
    current.heartbeat_expires_at = "2026-08-31T12:01:00.000Z";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(current)));
    render(<AgentConnectionSetup />);
    expect(await screen.findByText(/AI task presence:/)).toBeInTheDocument();
    expect(screen.queryByText("Bind the current Helix chat to this exact AI task")).not.toBeInTheDocument();
    expect(screen.getByText(/Keep any active binding/)).toBeInTheDocument();
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
    await waitFor(() => expect(fetchMock.mock.calls.filter(([url]) => url.startsWith(AGENT_CONNECTION_READINESS_ENDPOINT))).toHaveLength(2));
  });

  it("rechecks stale continuation on return without issuing a binding or duplicating focus reads", async () => {
    useAgiChatStore.setState({ activeId: "helix-chat-test" });
    window.localStorage.setItem(
      AGENT_CONNECTION_SETUP_STORAGE_KEY,
      JSON.stringify({
        schema: AGENT_CONNECTION_SETUP_STORAGE_KEY,
        selected_profile: "codex_app",
        viewed_step: "ready",
      }),
    );
    let current = connectionStatus(true);
    let releaseRead: (() => void) | undefined;
    let holdRead = false;
    const fetchMock = vi.fn(async (url: string, _init?: RequestInit) =>
      url.startsWith(AGENT_CONNECTION_READINESS_ENDPOINT)
        ? (holdRead
            ? new Promise<Response>((resolve) => { releaseRead = () => resolve(response(current)); })
            : response(current))
        : response({ error: "reasoning_binding_not_found" }, 404),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { unmount } = render(<AgentConnectionSetup />);
    expect(await screen.findByRole("button", { name: "Bind current Helix chat" })).toBeDisabled();
    const readinessCalls = () => fetchMock.mock.calls.filter(([url]) =>
      url.startsWith(AGENT_CONNECTION_READINESS_ENDPOINT),
    ).length;
    current = {
      ...current,
      readiness: buildHelixAgentClientReadiness({
        agentSelected: true,
        provider_application: "available",
        client_authorization: "active",
        client_presence: "online",
        catalog_sync: "current",
        thread_attachment: "attached",
        continuation_readiness: "polling",
        environment_readiness: "not_selected",
      }),
    };
    fireEvent.focus(window);
    fireEvent(document, new Event("visibilitychange"));
    await waitFor(() => expect(readinessCalls()).toBe(2));
    expect(screen.getByRole("button", { name: "Bind current Helix chat" })).toBeEnabled();
    expect(fetchMock.mock.calls.every(([, init]) => !init || !(init as RequestInit).method || (init as RequestInit).method === "GET")).toBe(true);

    // Returning to click consent must not unmount the pointer target while
    // the read is pending, even if another focus event arrives meanwhile.
    holdRead = true;
    const bindButton = screen.getByRole("button", { name: "Bind current Helix chat" });
    fireEvent.focus(window);
    await waitFor(() => expect(readinessCalls()).toBe(3));
    expect(screen.getByRole("button", { name: "Bind current Helix chat" })).toBe(bindButton);
    expect(bindButton).toBeEnabled();
    fireEvent.focus(window);
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(readinessCalls()).toBe(3);
    holdRead = false;
    releaseRead!();
    await waitFor(() => expect(screen.getByRole("button", { name: "Recheck connection" })).toBeEnabled());

    // A refreshed response can also withdraw readiness; focus is not proof.
    current = connectionStatus(true);
    fireEvent.focus(window);
    await waitFor(() => expect(readinessCalls()).toBe(4));
    expect(screen.getByRole("button", { name: "Bind current Helix chat" })).toBeDisabled();

    fireEvent.focus(window);
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(readinessCalls()).toBe(4);
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
    expect(guidance).toHaveBeenCalledWith(expect.objectContaining({
      detail: expect.objectContaining({ targetId: "reasoning-task-binding" }),
    }));
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);
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

  it("updates the post-start diagnostic when continuation recovers without another start", async () => {
    let current = connectionStatus(true);
    const startMcpTunnel = vi.fn(async () => fullTunnelState);
    window.casimirDesktop = Object.freeze({
      getRuntimeSnapshot: vi.fn(async () => null), startMcpTunnel,
      getMcpTunnelState: vi.fn(async () => fullTunnelState),
    });
    vi.stubGlobal("fetch", nativeFetch(() => response(current)));
    render(<AgentConnectionSetup />);
    fireEvent.click(screen.getByRole("button", { name: "Start Harness" }));
    await screen.findByText(/The connection is visible, but this exact task's continuation is unavailable/);
    current = connectionStatus(true);
    current.readiness.continuation_readiness = "polling";
    current.thread_observability_bridge.negotiated_level = "continuation_ready";
    fireEvent.focus(window);
    await waitFor(() => expect(screen.queryByText(/The connection is visible, but this exact task's continuation is unavailable/)).not.toBeInTheDocument());
    expect(screen.getByText(/Connection checked. Review the exact-task binding below/)).toBeInTheDocument();
    current = connectionStatus(true);
    fireEvent.focus(window);
    await screen.findByText(/The connection is visible, but this exact task's continuation is unavailable/);
    expect(screen.queryByText(/Connection checked. Review the exact-task binding below/)).not.toBeInTheDocument();
    expect(startMcpTunnel).toHaveBeenCalledTimes(1);
  });

  it("uses the same Start Harness entry point for browser diagnosis without native mutation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response(connectionStatus(false)));
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);
    fireEvent.click(screen.getByRole("button", { name: "Start Harness" }));

    expect(
      await screen.findByText("Waiting for your AI task"),
    ).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([url]) => url.startsWith(AGENT_CONNECTION_READINESS_ENDPOINT))).toHaveLength(1);
    expect(screen.getByText(/Neither action wakes the AI task or approves binding/)).toBeInTheDocument();
  });

  it.each(["Start Harness", "Refresh harness connection"])("keeps %s available after persisted setup and performs one native refresh", async buttonName => {
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
      name: buttonName,
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
    expect(screen.getByText("Waiting for your AI task")).toBeInTheDocument();
    expect(screen.getByText(/stop repeating the loop/i)).toBeInTheDocument();
    expect(
      screen.getByText(/separate Device Check plugin/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Check connection" }));
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
      .mockResolvedValueOnce(response({}, 404))
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
    expect(fetchMock).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ method: "DELETE" }));
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

  it("keeps an active binding inspectable on cold start while task presence is unavailable", async () => {
    window.localStorage.setItem(AGENT_CONNECTION_SETUP_STORAGE_KEY, JSON.stringify({
      schema: AGENT_CONNECTION_SETUP_STORAGE_KEY,
      selected_profile: "codex_app",
      viewed_step: "check",
    }));
    useAgiChatStore.setState({ activeId: "helix-chat-test" });
    const binding = {
      reasoning_binding_id: "reasoning_binding:recovery-test",
      helix_conversation_id: "helix-chat-test",
      status: "active",
      continuation_transport: "polling",
      binding_epoch: 2,
      service_instance_ref: "service-ref",
      run_id: "run:retained",
    };
    const fetchMock = vi.fn(async (url: string) => {
      if (url.startsWith(AGENT_CONNECTION_READINESS_ENDPOINT)) return response(connectionStatus(false));
      if (url.includes("reasoning-bindings/")) return response({ binding });
      return response({}, 404);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AgentConnectionSetup />);
    expect(await screen.findByText(/Binding state:/)).toHaveTextContent("active");
    expect(screen.getByText(/AI availability:/)).toHaveTextContent("waiting for a fresh connection check");
    expect(screen.getByText(/An associated run does not by itself/)).toHaveTextContent("action permission");
    expect(screen.getByRole("button", { name: "Ready up" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Replace binding" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Check binding" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Check binding" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("reasoning_binding%3Arecovery-test"),
      expect.objectContaining({ method: "GET" }),
    ));
    expect(fetchMock.mock.calls.every(([, init]: any[]) => !init?.method || init.method === "GET")).toBe(true);
    expect(screen.queryByText(/Catalog probe: current/)).not.toBeInTheDocument();
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
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/readiness")) return response(candidate);
      if (url.endsWith("/rooms")) return response({ rooms: [] });
      if (url.endsWith("/current")) return response({ binding: pending });
      if (url.endsWith("/claims")) return response({ claim_handle: "reasoning_claim:fresh-test-value", binding: pending }, 201);
      return response({ error: "reasoning_binding_not_found" }, 404);
    });
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

  it("reconciles a consumed claim at its deadline instead of expiring the active binding locally", async () => {
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
      reasoning_binding_id: "reasoning_binding:deadline-test",
      helix_conversation_id: "helix-chat-test",
      status: "pending_claim",
      continuation_transport: "polling",
      binding_epoch: 4,
      service_instance_ref: "service-ref",
      expires_at: new Date(Date.now() + 500).toISOString(),
    };
    const active = {
      ...pending,
      status: "active",
      claimed_at: new Date().toISOString(),
    };
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/readiness")) return response(candidate);
      if (url.endsWith("/rooms")) return response({ rooms: [] });
      if (url.endsWith("/current")) return response({ error: "reasoning_binding_not_found" }, 404);
      if (url.endsWith("/claims")) return response({ claim_handle: "reasoning_claim:deadline-test-value", binding: pending }, 201);
      if (url.includes("/reasoning-bindings/")) return response({ binding: active });
      return response({}, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentConnectionSetup />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Bind current Helix chat" }),
    );
    expect(
      await screen.findByDisplayValue("reasoning_claim:deadline-test-value"),
    ).toBeInTheDocument();

    await waitFor(
      () =>
        expect(screen.getByText(/Binding state:/i)).toHaveTextContent("active"),
      { timeout: 2_000 },
    );
    expect(
      screen.queryByText(/show-once claim expired/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByDisplayValue("reasoning_claim:deadline-test-value"),
    ).not.toBeInTheDocument();
  });

  it("recovers a hung readiness read without losing the run selection or accepting a late response", async () => {
    vi.useFakeTimers();
    useAgiChatStore.setState({ activeId: "helix-chat-test" });
    window.localStorage.setItem(AGENT_CONNECTION_SETUP_STORAGE_KEY, JSON.stringify({
      schema: AGENT_CONNECTION_SETUP_STORAGE_KEY, selected_profile: "codex_app", viewed_step: "ready",
    }));
    const base = connectionStatus(true);
    base.readiness.continuation_readiness = "polling";
    base.thread_observability_bridge.negotiated_level = "continuation_ready";
    const candidate = { ...base, verified_run_association: { run_id: "run-current", run_version: 1,
      room_id: "room-current", room_binding_id: "room-binding-current", room_binding_version: 1,
      verification_ref: "verified-current" } };
    let calls = 0;
    let late: (value: Response) => void = () => {};
    const fetchMock = vi.fn(async (url: string) => {
      if (!String(url).includes("/readiness")) return response({}, 404);
      calls++;
      return calls === 2 ? new Promise<Response>(resolve => { late = resolve; }) : response(candidate);
    });
    vi.stubGlobal("fetch", fetchMock);
    await act(async () => { render(<AgentConnectionSetup />); });
    const choice = screen.getByRole("checkbox", { name: /Include this verified environment run/i });
    fireEvent.click(choice);
    fireEvent.click(screen.getByRole("button", { name: "Recheck connection" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(10_100); });
    expect(screen.getByRole("button", { name: "Recheck connection" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Bind current Helix chat" })).toBeDisabled();
    expect(choice).toBeChecked();
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(calls).toBe(3);
    expect(screen.getByRole("button", { name: "Bind current Helix chat" })).toBeEnabled();
    await act(async () => { late(response(connectionStatus(true))); });
    expect(screen.getByRole("checkbox", { name: /Include this verified environment run/i })).toBe(choice);
    expect(choice).toBeChecked();
    expect(screen.getByRole("button", { name: "Bind current Helix chat" })).toBeEnabled();
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith("/claims"))).toBe(false);
  });

  it("rechecks the presence deadline without focus and preserves the human run selection", async () => {
    vi.useFakeTimers();
    useAgiChatStore.setState({ activeId: "helix-chat-test" });
    window.localStorage.setItem(AGENT_CONNECTION_SETUP_STORAGE_KEY, JSON.stringify({
      schema: AGENT_CONNECTION_SETUP_STORAGE_KEY, selected_profile: "codex_app", viewed_step: "ready",
    }));
    const base = connectionStatus(true);
    base.readiness.continuation_readiness = "polling";
    base.thread_observability_bridge.negotiated_level = "continuation_ready";
    const association = { run_id: "run-current", run_version: 1, room_id: "room-current",
      room_binding_id: "room-binding-current", room_binding_version: 1, verification_ref: "verified-current" };
    let candidate = { ...base, heartbeat_expires_at: new Date(Date.now() + 2_000).toISOString(),
      verified_run_association: association };
    const fetchMock = vi.fn(async (url: string) => String(url).includes("/readiness")
      ? response(candidate) : response({ error: "reasoning_binding_not_found" }, 404));
    vi.stubGlobal("fetch", fetchMock);
    await act(async () => { render(<AgentConnectionSetup />); });
    const checkbox = screen.getByRole("checkbox", { name: /Include this verified environment run/i });
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    const reads = () => fetchMock.mock.calls.filter(([url]) => String(url).includes("/readiness")).length;
    expect(reads()).toBe(1);
    candidate = { ...candidate, heartbeat_expires_at: new Date(Date.now() + 180_000).toISOString() };
    await act(async () => { await vi.advanceTimersByTimeAsync(2_100); });
    expect(reads()).toBe(2);
    expect(screen.getByRole("checkbox", { name: /Include this verified environment run/i })).toBe(checkbox);
    expect(checkbox).toBeChecked();
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith("/claims"))).toBe(false);
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(reads()).toBe(2);
  });

  it("automatically observes a prepared run without focus, selection or consent mutation", async () => {
    useAgiChatStore.setState({ activeId: "helix-chat-test" });
    window.localStorage.setItem(AGENT_CONNECTION_SETUP_STORAGE_KEY, JSON.stringify({
      schema: AGENT_CONNECTION_SETUP_STORAGE_KEY, selected_profile: "codex_app", viewed_step: "ready",
    }));
    const base = connectionStatus(true);
    base.readiness.continuation_readiness = "polling";
    base.thread_observability_bridge.negotiated_level = "continuation_ready";
    const association = { run_id: "run-prepared", run_version: 2, room_id: "room-current",
      room_binding_id: "room-binding-current", room_binding_version: 1, verification_ref: "verified-prepared" };
    let candidate = { ...base, verified_run_association: null as typeof association | null };
    const fetchMock = vi.fn(async (url: string) => String(url).includes("/readiness")
      ? response(candidate) : response({ error: "reasoning_binding_not_found" }, 404));
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers();
    await act(async () => { render(<AgentConnectionSetup />); });
    const unavailable = screen.getByRole("checkbox", { name: /Include a verified environment run/i });
    expect(unavailable).toBeDisabled();
    expect(unavailable).not.toBeChecked();
    expect(unavailable.closest("[data-helix-guidance-target='reasoning-task-binding']"))
      .toHaveAttribute("data-helix-guidance-label", "For Minecraft, prepare a room below and wait for a verified run before binding. Chat-only binding remains optional.");
    expect(screen.getByText(/Checking the connection does not prepare a session or approve it/i)).toBeInTheDocument();
    candidate = { ...base, verified_run_association: association };
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    const available = screen.getByRole("checkbox", { name: /Include this verified environment run/i });
    expect(available).toBeEnabled();
    expect(available).not.toBeChecked();
    expect(available.closest("[data-helix-guidance-target='reasoning-task-binding']"))
      .toHaveAttribute("data-helix-guidance-label", "Review and bind the current Helix chat to this exact AI task. This is a user consent action.");
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith("/claims"))).toBe(false);
    expect(screen.queryByText(/Environment session not ready to bind/i)).not.toBeInTheDocument();
    const settledReads = fetchMock.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(fetchMock).toHaveBeenCalledTimes(settledReads);
  });

  it("never silently downgrades a selected run after refresh and allows explicit chat-only recovery", async () => {
    useAgiChatStore.setState({ activeId: "helix-chat-test" });
    window.localStorage.setItem(AGENT_CONNECTION_SETUP_STORAGE_KEY, JSON.stringify({
      schema: AGENT_CONNECTION_SETUP_STORAGE_KEY, selected_profile: "codex_app", viewed_step: "ready",
    }));
    const base = connectionStatus(true);
    base.readiness.continuation_readiness = "polling";
    base.thread_observability_bridge.negotiated_level = "continuation_ready";
    const association = { run_id: "run-current", run_version: 1, room_id: "room-current",
      room_binding_id: "room-binding-current", room_binding_version: 1, verification_ref: "verified-current" };
    let candidate = { ...base, verified_run_association: association as typeof association | null };
    const claims: Record<string, unknown>[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes("/readiness")) return response(candidate);
      if (String(url).endsWith("/claims")) {
        claims.push(JSON.parse(init!.body as string));
        return response({ error: "reasoning_binding_target_inactive" }, 409);
      }
      return response({ error: "reasoning_binding_not_found" }, 404);
    }));
    render(<AgentConnectionSetup />);
    const choice = await screen.findByRole("checkbox", { name: /Include this verified environment run/i });
    expect(choice).not.toBeChecked();
    fireEvent.click(choice);
    fireEvent.click(screen.getByRole("button", { name: "Bind current Helix chat" }));
    await waitFor(() => expect(claims).toHaveLength(1));
    expect(claims[0]).toMatchObject({ run_id: "run-current", run_verification_ref: "verified-current" });
    await screen.findByText(/short supervisor presence expired/i);
    candidate = { ...base, verified_run_association: null };
    fireEvent.click(screen.getByRole("button", { name: "Recheck connection" }));
    const clear = await screen.findByRole("button", { name: "Use chat-only binding" });
    fireEvent.click(screen.getByRole("button", { name: "Bind current Helix chat" }));
    await screen.findByText(/selected environment run changed/i);
    expect(claims).toHaveLength(1);
    fireEvent.click(clear);
    fireEvent.click(screen.getByRole("button", { name: "Bind current Helix chat" }));
    await waitFor(() => expect(claims).toHaveLength(2));
    expect(claims[1]).not.toHaveProperty("run_id");
    expect(claims[1]).not.toHaveProperty("run_verification_ref");
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
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/readiness")) return response(candidate);
      if (url.endsWith("/rooms")) return response({ rooms: [] });
      if (url.endsWith("/claims")) return response({ error: "reasoning_binding_target_inactive" }, 409);
      return response({ error: "reasoning_binding_not_found" }, 404);
    });
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
