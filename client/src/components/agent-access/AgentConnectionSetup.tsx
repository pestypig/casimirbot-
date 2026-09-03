import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  ExternalLink,
  LoaderCircle,
  Play,
  RefreshCw,
  ShieldOff,
} from "lucide-react";
import { parseDesktopMcpTunnelState, type DesktopMcpTunnelState } from "@shared/desktop-mcp-tunnel";
import {
  HELIX_AGENT_CLIENT_PROFILES,
  helixAgentConnectionStatusSchema,
  type HelixAgentClientProfileId,
  type HelixAgentConnectionStatus,
} from "@shared/helix-agent-client-profile";
import {
  parseDesktopCodexPluginState,
  type DesktopCodexPluginState,
} from "@shared/codex-plugin";
import AgentAccountBindingReadiness from "./AgentAccountBindingReadiness";
import {
  AGENT_CONNECTION_SETUP_STORAGE_KEY,
  INITIAL_AGENT_CONNECTION_SETUP_STATE,
  agentConnectionSetupReducer,
  persistableAgentConnectionSetup,
  restoreAgentConnectionSetup,
  type AgentConnectionSetupStep,
} from "./agentConnectionSetupState";
import { CASIMIRBOT_PUBLIC_ORIGIN } from "@/lib/agent-access/agentAccessContent";
import { useAgiChatStore } from "@/store/useAgiChatStore";
import {
  inspectLatestReasoningBinding,
  inspectReasoningBinding,
  issueReasoningBindingClaim,
  revokeReasoningBinding,
  type BrowserReasoningBinding,
} from "@/lib/agent-access/reasoningTaskBinding";
import {
  buildAgentHarnessOnboardingDiagnostic,
  type AgentHarnessOnboardingPhase,
} from "./agentHarnessOnboarding";

export const AGENT_CONNECTION_READINESS_ENDPOINT =
  "/api/account/session/agent-connections/readiness";

const continuationExplanation = (
  continuation: HelixAgentConnectionStatus["readiness"]["continuation_readiness"],
): string => {
  switch (continuation) {
    case "ready":
      return "Helix can deliver steering to this attached task.";
    case "polling":
      return "This attached task can pick up steering while its AI client is polling.";
    case "monitor_only":
      return "Helix can observe public checkpoints, but cannot send messages to this task.";
    case "unavailable":
      return "Helix sees harness tool activity only and cannot send messages to this task.";
  }
};

type RemoteState =
  | { kind: "idle" | "loading" | "signed_out" | "unavailable" }
  | { kind: "loaded"; status: HelixAgentConnectionStatus };

const restore = () => {
  if (typeof window === "undefined") return INITIAL_AGENT_CONNECTION_SETUP_STATE;
  return restoreAgentConnectionSetup(
    window.localStorage.getItem(AGENT_CONNECTION_SETUP_STORAGE_KEY),
  );
};

export function AgentConnectionSetup() {
  const [setup, dispatch] = useReducer(agentConnectionSetupReducer, undefined, restore);
  const [remote, setRemote] = useState<RemoteState>({ kind: "idle" });
  const [codexPlugin, setCodexPlugin] = useState<DesktopCodexPluginState | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [disconnectConfirm, setDisconnectConfirm] = useState(false);
  const activeChatId = useAgiChatStore((state) => state.activeId);
  const rememberReasoningTaskBinding = useAgiChatStore(
    (state) => state.rememberReasoningTaskBinding,
  );
  const [reasoningBinding, setReasoningBinding] = useState<BrowserReasoningBinding | null>(null);
  const [claimHandle, setClaimHandle] = useState<string | null>(null);
  const [bindingBusy, setBindingBusy] = useState(false);
  const [onboardingPhase, setOnboardingPhase] = useState<AgentHarnessOnboardingPhase>("idle");
  const [onboardingTunnel, setOnboardingTunnel] = useState<DesktopMcpTunnelState | null>(null);
  const [diagnosticStatus, setDiagnosticStatus] = useState<string | null>(null);
  const setupTitleRef = useRef<HTMLHeadingElement | null>(null);
  const previousViewedStep = useRef(setup.viewedStep);
  const skipNextProfileRefresh = useRef(false);

  useEffect(() => {
    window.localStorage.setItem(
      AGENT_CONNECTION_SETUP_STORAGE_KEY,
      JSON.stringify(persistableAgentConnectionSetup(setup)),
    );
  }, [setup]);

  useEffect(() => {
    if (previousViewedStep.current === setup.viewedStep) return;
    previousViewedStep.current = setup.viewedStep;
    setupTitleRef.current?.focus();
  }, [setup.viewedStep]);

  const refresh = useCallback(async (
    profileOverride?: HelixAgentClientProfileId,
    viewedStepOverride?: AgentConnectionSetupStep,
  ): Promise<void> => {
    const selectedProfile = profileOverride ?? setup.selectedProfile;
    const viewedStep = viewedStepOverride ?? setup.viewedStep;
    if (!selectedProfile) return;
    setOnboardingPhase("checking_readiness");
    setRemote({ kind: "loading" });
    setOperationError(null);
    try {
      const response = await fetch(
        `${AGENT_CONNECTION_READINESS_ENDPOINT}?client_profile=${encodeURIComponent(selectedProfile)}`,
        { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } },
      );
      if (response.status === 401) {
        setOnboardingPhase("action_required");
        setRemote({ kind: "signed_out" });
        dispatch({ type: "view", step: "account" });
        return;
      }
      if (!response.ok) throw new Error("readiness unavailable");
      const parsed = helixAgentConnectionStatusSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("invalid readiness projection");
      setRemote({ kind: "loaded", status: parsed.data });
      setOnboardingPhase(parsed.data.readiness.agent_ready ? "ready" : "action_required");
      if (parsed.data.readiness.client_authorization !== "active") {
        dispatch({ type: "view", step: "authorize" });
      } else if (
        parsed.data.proof_basis === "authenticated_presence_tool" &&
        parsed.data.readiness.agent_ready
      ) {
        dispatch({ type: "view", step: "ready" });
      } else if (parsed.data.catalog_reenumeration_required) {
        dispatch({ type: "view", step: "check" });
      } else if (viewedStep === "account" || viewedStep === "authorize") {
        dispatch({ type: "view", step: "connect" });
      }
    } catch {
      setOnboardingPhase("action_required");
      setRemote({ kind: "unavailable" });
    }
  }, [setup.selectedProfile, setup.viewedStep]);

  useEffect(() => {
    if (!setup.selectedProfile) return;
    if (skipNextProfileRefresh.current) {
      skipNextProfileRefresh.current = false;
      return;
    }
    void refresh();
  }, [setup.selectedProfile]); // refresh is intentionally user-driven after the initial profile selection

  useEffect(() => {
    if (setup.selectedProfile !== "codex_app") return;
    const inspect = window.casimirDesktop?.getCodexPluginState;
    if (!inspect) return;
    let cancelled = false;
    void inspect().then((candidate) => {
      if (!cancelled) setCodexPlugin(parseDesktopCodexPluginState(candidate));
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [setup.selectedProfile]);

  const selected = setup.selectedProfile
    ? HELIX_AGENT_CLIENT_PROFILES[setup.selectedProfile]
    : null;
  const status = remote.kind === "loaded" ? remote.status : null;

  useEffect(() => {
    if (
      setup.viewedStep !== "ready" ||
      !status?.client_session_ref ||
      status.readiness.continuation_readiness === "unavailable"
    ) return;
    let cancelled = false;
    void inspectLatestReasoningBinding()
      .then((binding) => {
        if (cancelled) return;
        setReasoningBinding(binding);
        rememberReasoningTaskBinding(binding);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [
    rememberReasoningTaskBinding,
    setup.viewedStep,
    status?.client_session_ref,
    status?.readiness.continuation_readiness,
  ]);

  const mcpUrl = selected
    ? `${CASIMIRBOT_PUBLIC_ORIGIN}${selected.endpoint_path}`
    : "";

  const startHarness = async (): Promise<void> => {
    if (onboardingPhase === "starting_native_harness" || onboardingPhase === "checking_readiness") return;
    setOnboardingPhase("starting_native_harness");
    setOperationError(null);
    setDiagnosticStatus(null);
    let nativeStartFailed = false;
    try {
      const start = window.casimirDesktop?.startMcpTunnel;
      if (start) {
        const tunnel = parseDesktopMcpTunnelState(await start({ scope: "full_helix_agent" }));
        if (!tunnel) throw new Error("invalid native harness state");
        setOnboardingTunnel(tunnel);
        if (!tunnel.ready || tunnel.scope !== "full_helix_agent") {
          throw new Error("full harness did not become ready");
        }
      }
      setOnboardingPhase("checking_readiness");
    } catch {
      nativeStartFailed = true;
      setOnboardingPhase("action_required");
      setDiagnosticStatus(
        "CasimirBot could not start the full native harness. The connection check below will identify the next safe action; no provider task or OAuth approval was attempted.",
      );
    } finally {
      if (setup.selectedProfile !== "codex_app") skipNextProfileRefresh.current = true;
      dispatch({ type: "choose", profile: "codex_app" });
      await refresh("codex_app", "account");
      if (nativeStartFailed) setOnboardingPhase("action_required");
    }
  };

  const copyOnboardingDiagnostic = async (): Promise<void> => {
    setDiagnosticStatus(null);
    try {
      let tunnel = onboardingTunnel;
      const inspectTunnel = window.casimirDesktop?.getMcpTunnelState;
      if (inspectTunnel) {
        tunnel = parseDesktopMcpTunnelState(await inspectTunnel());
        setOnboardingTunnel(tunnel);
      }
      const diagnostic = buildAgentHarnessOnboardingDiagnostic({
        onboardingPhase,
        setupStep: setup.viewedStep,
        selectedClientProfile: setup.selectedProfile,
        nativeDesktopAvailable: typeof window.casimirDesktop?.getRuntimeSnapshot === "function",
        status,
        tunnel,
        reasoningBinding,
      });
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(JSON.stringify(diagnostic, null, 2));
      setDiagnosticStatus("Sanitized onboarding diagnostics copied.");
    } catch {
      setDiagnosticStatus("Diagnostics could not be copied on this surface.");
    }
  };

  const currentCopy = useMemo(() => {
    switch (setup.viewedStep) {
      case "choose":
        return { title: "Choose your AI app", body: "CasimirBot works with an AI app already on this device. You can change this later." };
      case "account":
        return { title: "Sign in to CasimirBot", body: "Use the workstation account menu to sign in, then retry this check." };
      case "authorize":
        return { title: "Authorize agent access", body: "Link this CasimirBot profile through the native OAuth window. No token is copied into this chat or page." };
      case "connect":
        return { title: `Add CasimirBot to ${selected?.display_name ?? "your AI app"}`, body: "This step happens in the AI app. CasimirBot does not edit its settings, approve OAuth, restart it, or create its chat." };
      case "check":
        return status?.catalog_reenumeration_required
          ? { title: "Refresh this AI task's connection", body: "CasimirBot authorization changed after this task last loaded its tools. Use the AI app's in-place MCP reload for this same task. In Codex, reload MCP server configuration or restart Codex and reopen this same task; do not create replacement tasks just to chase a catalog." }
          : { title: "Check the connection", body: "In the relevant AI chat, ask: “Connect this chat to CasimirBot and check Agent Connections.” Then return here and Retry." };
      case "ready":
        return { title: "AI app connected", body: "A fresh authenticated client session and declared chat thread reached this node's current coordination catalog." };
    }
  }, [selected?.display_name, setup.viewedStep, status?.catalog_reenumeration_required]);

  const disconnect = async (): Promise<void> => {
    if (!status?.oauth_binding_ref) return;
    setOperationError(null);
    try {
      const response = await fetch(
        `/api/account/session/agent-bindings/${encodeURIComponent(status.oauth_binding_ref)}`,
        { method: "DELETE", credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw new Error("disconnect failed");
      setDisconnectConfirm(false);
      await refresh();
    } catch {
      setOperationError("CasimirBot could not revoke this profile's agent binding. Retry without sharing any credential.");
    }
  };

  const bindCurrentChat = async (): Promise<void> => {
    if (!status?.client_session_ref || !activeChatId) return;
    setBindingBusy(true);
    setOperationError(null);
    try {
      const issued = await issueReasoningBindingClaim({
        clientSessionRef: status.client_session_ref,
        helixConversationId: activeChatId,
      });
      setReasoningBinding(issued.binding);
      rememberReasoningTaskBinding(issued.binding);
      setClaimHandle(issued.claim_handle);
    } catch {
      setOperationError("CasimirBot could not create the exact task-binding claim.");
    } finally {
      setBindingBusy(false);
    }
  };

  const checkReasoningBinding = async (): Promise<void> => {
    if (!reasoningBinding) return;
    setBindingBusy(true);
    try {
      const binding = await inspectReasoningBinding(reasoningBinding.reasoning_binding_id);
      setReasoningBinding(binding);
      rememberReasoningTaskBinding(binding);
      if (binding.status === "active") setClaimHandle(null);
    } catch {
      setOperationError("CasimirBot could not verify the current reasoning-task binding.");
    } finally {
      setBindingBusy(false);
    }
  };

  const revokeCurrentReasoningBinding = async (): Promise<void> => {
    if (!reasoningBinding) return;
    setBindingBusy(true);
    setOperationError(null);
    try {
      const binding = await revokeReasoningBinding(reasoningBinding.reasoning_binding_id);
      setReasoningBinding(binding);
      rememberReasoningTaskBinding(binding);
      setClaimHandle(null);
    } catch {
      setOperationError("CasimirBot could not revoke the current reasoning-task binding.");
    } finally {
      setBindingBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-cyan-300/20 bg-slate-950/85 p-4 text-slate-100" aria-labelledby="agent-connection-setup-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">Agent Connections</p>
          <h1
            ref={setupTitleRef}
            id="agent-connection-setup-title"
            tabIndex={-1}
            className="mt-1 text-xl font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            {currentCopy.title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {setup.viewedStep !== "choose" ? (
            <button
              type="button"
              disabled={onboardingPhase === "starting_native_harness" || onboardingPhase === "checking_readiness"}
              onClick={() => void startHarness()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-50 disabled:opacity-50"
            >
              {onboardingPhase === "starting_native_harness" || onboardingPhase === "checking_readiness"
                ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
              {onboardingPhase === "starting_native_harness" ? "Starting harness…" : onboardingPhase === "checking_readiness" ? "Checking connection…" : "Start Harness"}
            </button>
          ) : null}
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300">
            {setup.viewedStep === "ready" ? "Connected" : `Step ${Math.max(1, ["choose", "account", "authorize", "connect", "check", "ready"].indexOf(setup.viewedStep) + 1)} of 6`}
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-300" role="status" aria-live="polite">{currentCopy.body}</p>

      {setup.viewedStep === "choose" ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-4">
            <p className="font-semibold text-cyan-50">Fast start with Codex</p>
            <p className="mt-1 text-xs leading-5 text-cyan-50/75">
              One click checks this account and exact Codex connection. In the installed desktop, this click also enables the existing full developer harness for this app session. It never approves OAuth, creates a Codex task, controls Codex UI, or grants environment authority.
            </p>
            <button
              type="button"
              disabled={onboardingPhase === "starting_native_harness" || onboardingPhase === "checking_readiness"}
              onClick={() => void startHarness()}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-cyan-200/40 bg-cyan-300/15 px-4 py-2 text-sm font-semibold text-cyan-50 disabled:opacity-50"
            >
              {onboardingPhase === "starting_native_harness" || onboardingPhase === "checking_readiness"
                ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                : <Play className="h-4 w-4" aria-hidden="true" />}
              {onboardingPhase === "starting_native_harness" ? "Starting harness…" : onboardingPhase === "checking_readiness" ? "Checking connection…" : "Start Harness"}
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.values(HELIX_AGENT_CLIENT_PROFILES).map((profile) => (
              <button key={profile.profile_id} type="button" onClick={() => dispatch({ type: "choose", profile: profile.profile_id })}
                className="rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-300/40 hover:bg-cyan-400/10">
                <span className="block font-semibold text-white">{profile.display_name}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-400">
                  {profile.profile_id === "codex_app" ? "Guided Codex MCP setup" : "Any OAuth-capable Streamable HTTP MCP client"}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {setup.viewedStep === "authorize" ? <div className="mt-4"><AgentAccountBindingReadiness /></div> : null}

      {setup.viewedStep === "connect" && selected ? (
        <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
          <ol className="list-decimal space-y-2 pl-5 text-xs leading-5 text-slate-300">
            {selected.profile_id === "codex_app" ? (
              <>
                <li>In Codex, open Plugins, choose Installed, and open the CasimirBot connection. Some Codex builds instead show MCP servers in Settings.</li>
                <li>Choose Connect, Finish setup, or Authenticate. If Codex asks for a server address, use the address shown below.</li>
                <li>After sign-in succeeds, reload the exact MCP server shown below for this same task. Reconnecting a separate Device Check plugin does not refresh this server's catalog. If this Codex build has no reload control, restart Codex once only while this exact server is already healthy, then reopen this same task; do not create replacement tasks to chase the catalog.</li>
              </>
            ) : (
              <>
                <li>Open your AI app's MCP or tools settings and add a Streamable HTTP server.</li>
                <li>Enter the server address below and choose its OAuth sign-in flow.</li>
                <li>Reload or reconnect the MCP server for the current task. If the client cannot refresh a loaded task, report that unsupported recovery boundary instead of repeatedly creating fresh tasks.</li>
              </>
            )}
          </ol>
          <label className="mt-4 block text-[10px] font-semibold uppercase tracking-wide text-slate-500" htmlFor="agent-mcp-url">Server address</label>
          <input id="agent-mcp-url" readOnly value={mcpUrl} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 font-mono text-xs text-cyan-100" />
          <p className="mt-2 text-[11px] text-slate-500">Use only the server address and the AI app's OAuth sign-in. Never paste a credential here.</p>
        </div>
      ) : null}

      {setup.viewedStep === "check" ? (
        <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-50/80">
          The AI app should use CasimirBot's connection-check tool automatically. The check passes only after this profile, exact MCP server, current node, client session, and chat thread are authenticated. Reconnecting a separate Device Check plugin, opening an app, or opening a tunnel alone does not pass it. If sign-in succeeds but the app immediately asks again, stop repeating the loop: the connection needs administrator repair before Retry can pass.
        </div>
      ) : null}

      {setup.viewedStep === "ready" && status ? (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-300/25 bg-emerald-400/10 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-200" aria-hidden="true" />
          <div className="text-xs leading-5 text-emerald-50/85">
            <p>Catalog probe: current. Chat attachment: current. Continuation: {status.readiness.continuation_readiness.replace("_", " ")}.</p>
            <p className="mt-1">Thread visibility: {status.thread_observability_bridge.negotiated_level.replaceAll("_", " ")}. Checkpoint publication: {status.thread_observability_bridge.checkpoint_publication_status.replaceAll("_", " ")}.</p>
            <p className="mt-1">{continuationExplanation(status.readiness.continuation_readiness)}</p>
            <p className="mt-1">This proves connection readiness only. It does not expose private reasoning or grant environment actions.</p>
          </div>
        </div>
      ) : null}

      {setup.viewedStep === "ready" && status?.readiness.continuation_readiness !== "unavailable" ? (
        <div className="mt-4 rounded-lg border border-cyan-300/20 bg-cyan-400/5 p-4 text-xs leading-5 text-cyan-50/85">
          <p className="font-semibold text-cyan-100">Bind the current Helix chat to this exact AI task</p>
          <p className="mt-1">This does not create or control an AI-app chat. It authorizes only the authenticated task shown above to poll for steering from the selected local Helix chat.</p>
          {!activeChatId ? <p className="mt-2 text-amber-100">Open or create a Helix chat first.</p> : null}
          {claimHandle ? (
            <>
              <label className="mt-3 block text-[10px] font-semibold uppercase tracking-wide text-cyan-200" htmlFor="reasoning-claim-handle">Show-once claim handle</label>
              <input id="reasoning-claim-handle" readOnly value={claimHandle} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 font-mono text-xs text-cyan-100" />
              <p className="mt-2">In that exact AI task, call <code>helix_reasoning_task_binding_claim</code> with its stable continuation reference and this handle. Then return here and check the binding.</p>
            </>
          ) : null}
          {reasoningBinding ? <p className="mt-2">Binding state: <strong>{reasoningBinding.status.replaceAll("_", " ")}</strong>. Transport: {reasoningBinding.continuation_transport.replaceAll("_", " ")}.</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={!activeChatId || bindingBusy} onClick={() => void bindCurrentChat()} className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 disabled:opacity-50">{bindingBusy ? "Working…" : reasoningBinding ? "Replace binding" : "Bind current Helix chat"}</button>
            {reasoningBinding ? <button type="button" disabled={bindingBusy} onClick={() => void checkReasoningBinding()} className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-50">Check binding</button> : null}
            {reasoningBinding && ["pending_claim", "active"].includes(reasoningBinding.status) ? <button type="button" disabled={bindingBusy} onClick={() => void revokeCurrentReasoningBinding()} className="rounded-lg border border-rose-300/30 px-3 py-2 text-rose-100 disabled:opacity-50">Revoke binding</button> : null}
          </div>
        </div>
      ) : null}

      {setup.explanationOpen ? (
        <p className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">
          Setup progress stored on this device is navigation only. Authorization, client presence, catalog adoption, and chat attachment are always re-read from trusted server or native-host evidence.
        </p>
      ) : null}

      {operationError ? <p className="mt-3 text-xs text-rose-200" role="alert">{operationError}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {setup.viewedStep !== "choose" ? (
          <button type="button" onClick={() => dispatch({ type: "back" })} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back
          </button>
        ) : null}
        {setup.viewedStep !== "choose" && setup.viewedStep !== "ready" ? (
          <button type="button" onClick={() => void refresh()} disabled={remote.kind === "loading"} className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-50 disabled:opacity-50">
            {remote.kind === "loading" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />} Retry
          </button>
        ) : null}
        {setup.viewedStep === "connect" ? (
          <button type="button" onClick={() => dispatch({ type: "view", step: "check" })} className="rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-50">I added it</button>
        ) : null}
        <button type="button" onClick={() => dispatch({ type: "toggle_explanation" })} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5" aria-expanded={setup.explanationOpen}>
          <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" /> Explain
        </button>
        {setup.viewedStep !== "choose" ? (
          <button type="button" onClick={() => void copyOnboardingDiagnostic()} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5">
            <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" /> Copy diagnostics
          </button>
        ) : null}
      </div>

      {diagnosticStatus ? <p className="mt-2 text-xs text-slate-300" role="status">{diagnosticStatus}</p> : null}

      {setup.selectedProfile === "codex_app" && setup.viewedStep !== "choose" ? (
        <div className="mt-4 border-t border-white/10 pt-3 text-xs text-slate-400">
          <p><strong className="text-slate-300">Optional Device Check:</strong> separate from the agent connection and never counts as chat or catalog proof.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {codexPlugin?.status === "ready" && !setup.deviceCheckSkipped ? (
              <button type="button" onClick={() => void window.casimirDesktop?.openCodexPlugin?.()} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Open optional Device Check
              </button>
            ) : null}
            {!setup.deviceCheckSkipped ? <button type="button" onClick={() => dispatch({ type: "skip_device_check" })} className="rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5">Skip Device Check</button> : <span>Device Check skipped.</span>}
          </div>
        </div>
      ) : null}

      {setup.viewedStep === "ready" && status?.oauth_binding_ref ? (
        <div className="mt-4 border-t border-white/10 pt-3">
          {!disconnectConfirm ? (
            <button type="button" onClick={() => setDisconnectConfirm(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300/20 px-3 py-2 text-xs text-rose-100 hover:bg-rose-400/10">
              <ShieldOff className="h-3.5 w-3.5" aria-hidden="true" /> Disconnect
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-xs text-rose-100">
              <span>This revokes the profile binding used by every AI client linked through it.</span>
              <button type="button" onClick={() => void disconnect()} className="rounded-lg border border-rose-300/30 bg-rose-400/10 px-3 py-2">Confirm disconnect</button>
              <button type="button" onClick={() => setDisconnectConfirm(false)} className="rounded-lg border border-white/10 px-3 py-2">Cancel</button>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

export default AgentConnectionSetup;
