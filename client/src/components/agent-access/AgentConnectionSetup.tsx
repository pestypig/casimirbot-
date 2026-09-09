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
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import {
  parseDesktopMcpTunnelState,
  type DesktopMcpTunnelState,
} from "@shared/desktop-mcp-tunnel";
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
import ConnectionExpiryNotice from "./ConnectionExpiryNotice";
import ReasoningClaimHandle from "./ReasoningClaimHandle";
import DurableTaskPairing from "./DurableTaskPairing";
import EnvironmentSessionReadyUp from "./EnvironmentSessionReadyUp";
import EnvironmentSessionPreparationRequest from "./EnvironmentSessionPreparationRequest";
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
import {
  HELIX_WORKSTATION_GUIDANCE_EVENT,
  coerceWorkstationGuidanceRequest,
  consumePendingWorkstationGuidance,
  requestWorkstationGuidance,
} from "@/lib/workstation/workstationGuidance";

export const AGENT_CONNECTION_READINESS_ENDPOINT =
  "/api/account/session/agent-connections/readiness";
export const FULL_HARNESS_TRUST_ENDPOINT =
  "/api/desktop/mcp-tunnel-transition/full-harness-trust";
const REASONING_BIND_CONTROL_ID =
  "workstation.panel.agent-access.agent-connection-setup.bind-current-helix-chat";

type FullHarnessTrust = Readonly<{
  schema: "helix.installed_device_full_harness_trust.v1";
  trusted: boolean;
  device_ref: string;
  policy_revision: number;
  authority_limited_to_tunnel_transport: true;
  environment_authority_granted: false;
  trading_authority_granted: false;
  answer_authority: false;
  terminal_eligible: false;
}>;

const parseFullHarnessTrust = (value: unknown): FullHarnessTrust | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (
    candidate.schema !== "helix.installed_device_full_harness_trust.v1" ||
    typeof candidate.trusted !== "boolean" ||
    typeof candidate.device_ref !== "string" ||
    typeof candidate.policy_revision !== "number" ||
    candidate.authority_limited_to_tunnel_transport !== true ||
    candidate.environment_authority_granted !== false ||
    candidate.trading_authority_granted !== false ||
    candidate.answer_authority !== false ||
    candidate.terminal_eligible !== false
  )
    return null;
  return candidate as FullHarnessTrust;
};

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
  | { kind: "loaded"; status: HelixAgentConnectionStatus; refreshing?: boolean; readFailed?: boolean };

const restore = () => {
  if (typeof window === "undefined")
    return INITIAL_AGENT_CONNECTION_SETUP_STATE;
  return restoreAgentConnectionSetup(
    window.localStorage.getItem(AGENT_CONNECTION_SETUP_STORAGE_KEY),
  );
};

export function AgentConnectionSetup() {
  const [setup, dispatch] = useReducer(
    agentConnectionSetupReducer,
    undefined,
    restore,
  );
  const [remote, setRemote] = useState<RemoteState>({ kind: "idle" });
  const [codexPlugin, setCodexPlugin] =
    useState<DesktopCodexPluginState | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [presentationError, setPresentationError] = useState<string | null>(null);
  const [disconnectConfirm, setDisconnectConfirm] = useState(false);
  const activeChatId = useAgiChatStore((state) => state.activeId);
  const rememberReasoningTaskBinding = useAgiChatStore(
    (state) => state.rememberReasoningTaskBinding,
  );
  const [reasoningBinding, setReasoningBinding] =
    useState<BrowserReasoningBinding | null>(null);
  const [claimHandle, setClaimHandle] = useState<string | null>(null);
  const [bindingBusy, setBindingBusy] = useState(false);
  const [selectedRunVerification, setSelectedRunVerification] = useState<string | null>(null);
  const [onboardingPhase, setOnboardingPhase] =
    useState<AgentHarnessOnboardingPhase>("idle");
  const [onboardingTunnel, setOnboardingTunnel] =
    useState<DesktopMcpTunnelState | null>(null);
  const [diagnosticStatus, setDiagnosticStatus] = useState<string | { kind: "binding_check" } | null>(null);
  const [fullHarnessTrust, setFullHarnessTrust] =
    useState<FullHarnessTrust | null>(null);
  const [trustBusy, setTrustBusy] = useState(false);
  const [trustStatus, setTrustStatus] = useState<string | null>(null);
  const setupTitleRef = useRef<HTMLHeadingElement | null>(null);
  const previousViewedStep = useRef(setup.viewedStep);
  const skipNextProfileRefresh = useRef(false);
  const pendingHarnessStart = useRef(false);
  const revealBindingAfterStart = useRef(false);
  const suppressLocalGuidanceHandling = useRef(false);
  const readinessRead = useRef<{ generation: number; controller?: AbortController }>({ generation: 0 });
  useEffect(() => () => {
    readinessRead.current.generation++;
    readinessRead.current.controller?.abort();
  }, []);

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

  const refresh = useCallback(
    async (
      profileOverride?: HelixAgentClientProfileId,
      viewedStepOverride?: AgentConnectionSetupStep,
    ): Promise<void> => {
      const selectedProfile = profileOverride ?? setup.selectedProfile;
      const viewedStep = viewedStepOverride ?? setup.viewedStep;
      if (!selectedProfile) return;
      readinessRead.current.controller?.abort();
      const controller = new AbortController();
      const generation = ++readinessRead.current.generation;
      readinessRead.current.controller = controller;
      let timeoutId: number | undefined;
      setOnboardingPhase("checking_readiness");
      // Keep the consent control mounted when returning to this window. A
      // background read must not remove the target between pointerdown/click.
      // The claim endpoint still validates current identity and presence.
      setRemote((current) => current.kind === "loaded"
        ? { ...current, refreshing: true }
        : { kind: "loading" });
      setOperationError(null);
      try {
        const { response, body } = await Promise.race([
          (async () => {
            const response = await fetch(
              `${AGENT_CONNECTION_READINESS_ENDPOINT}?client_profile=${encodeURIComponent(selectedProfile)}`,
              {
                credentials: "same-origin",
                cache: "no-store",
                headers: { Accept: "application/json" },
                signal: controller.signal,
              },
            );
            const body = response.status === 401 ? null : await response.json();
            return { response, body };
          })(),
          new Promise<never>((_, reject) => {
            timeoutId = window.setTimeout(() => {
              controller.abort();
              reject(new Error("readiness_timeout"));
            }, 10_000);
          }),
        ]);
        if (generation !== readinessRead.current.generation) return;
        if (response.status === 401) {
          setOnboardingPhase("action_required");
          setRemote({ kind: "signed_out" });
          dispatch({ type: "view", step: "account" });
          return;
        }
        if (!response.ok) throw new Error("readiness unavailable");
        const parsed = helixAgentConnectionStatusSchema.safeParse(
          body,
        );
        if (!parsed.success) throw new Error("invalid readiness projection");
        setRemote({ kind: "loaded", status: parsed.data });
        setOnboardingPhase(
          parsed.data.readiness.agent_ready ? "ready" : "action_required",
        );
        if (parsed.data.readiness.client_authorization !== "active") {
          dispatch({ type: "view", step: "authorize" });
          suppressLocalGuidanceHandling.current = true;
          try {
            requestWorkstationGuidance({
              kind: "user_attention",
              panelId: "agent-access",
              targetId: "auth0-account-link",
              label:
                "Agent access needs authentication. Review the account status and choose Link Auth0 to open the secure native sign-in window.",
              durationMs: 12_000,
            });
          } finally {
            suppressLocalGuidanceHandling.current = false;
          }
        } else if (
          parsed.data.proof_basis === "authenticated_presence_tool" &&
          parsed.data.readiness.agent_ready
        ) {
          dispatch({ type: "view", step: "ready" });
        } else if (parsed.data.catalog_reenumeration_required) {
          dispatch({ type: "view", step: "check" });
        } else if (revealBindingAfterStart.current) {
          dispatch({ type: "view", step: "check" });
          setDiagnosticStatus("Account access is linked. Waiting for this AI task to check in through CasimirBot. This page checks automatically; Check connection checks now. Neither action wakes the AI task or approves binding.");
        } else if (viewedStep === "account" || viewedStep === "authorize") {
          dispatch({ type: "view", step: "connect" });
          setDiagnosticStatus("This exact AI task has not passed its connection check. Ask the same AI task to refresh its CasimirBot presence, then use Retry. Starting the harness alone does not create a task binding.");
        }
      } catch {
        if (generation !== readinessRead.current.generation) return;
        setOnboardingPhase("action_required");
        setRemote(current => current.kind === "loaded"
          ? { ...current, refreshing: false, readFailed: true }
          : { kind: "unavailable" });
        setOperationError("The connection check did not finish. Recheck connection is available; binding waits for a fresh result. Any selected run is retained.");
      } finally {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      }
    },
    [setup.selectedProfile, setup.viewedStep],
  );
  const guidanceRefresh = useRef(refresh);
  guidanceRefresh.current = refresh;
  const refreshBusy = useRef(false);
  const readinessRefreshing = remote.kind === "loading" ||
    (remote.kind === "loaded" && remote.refreshing === true);
  refreshBusy.current = readinessRefreshing || bindingBusy;

  useEffect(() => {
    if (!setup.selectedProfile) return;
    if (skipNextProfileRefresh.current) {
      skipNextProfileRefresh.current = false;
      return;
    }
    void refresh();
  }, [setup.selectedProfile]);

  useEffect(() => {
    if (!setup.selectedProfile || setup.viewedStep !== "ready") return;
    let pending: number | undefined;
    const recheckOnReturn = () => {
      if (document.visibilityState === "hidden" || pending !== undefined) return;
      // Focus and visibility commonly arrive together. Coalesce them into one
      // read; never synthesize presence or activate the human-only bind control.
      pending = window.setTimeout(() => {
        pending = undefined;
        if (document.visibilityState !== "hidden" && !refreshBusy.current) {
          void guidanceRefresh.current();
        }
      }, 200);
    };
    window.addEventListener("focus", recheckOnReturn);
    document.addEventListener("visibilitychange", recheckOnReturn);
    return () => {
      if (pending !== undefined) window.clearTimeout(pending);
      window.removeEventListener("focus", recheckOnReturn);
      document.removeEventListener("visibilitychange", recheckOnReturn);
    };
  }, [setup.selectedProfile, setup.viewedStep]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("native_presentation") !== "reasoning-binding")
      return;
    url.searchParams.delete("native_presentation");
    window.history.replaceState(window.history.state, "", url.toString());
    setOnboardingPhase("checking_readiness");
    if (setup.selectedProfile === "codex_app") {
      void refresh("codex_app", "account");
    } else {
      dispatch({ type: "choose", profile: "codex_app" });
    }
  }, [refresh, setup.selectedProfile]);

  useEffect(() => {
    const inspectTunnel = window.casimirDesktop?.getMcpTunnelState;
    let cancelled = false;
    const retryIds = new Set<number>();
    let presentationGeneration = 0;
    let failedPresentation: unknown = null;
    const handleGuidanceRequest = (candidate: unknown) => {
      if (suppressLocalGuidanceHandling.current) return;
      const request = coerceWorkstationGuidanceRequest(candidate);
      if (request?.kind === "user_attention" && request.panelId === "agent-access" && request.targetId === "external-ai-connection-setup") {
        // Resume navigation only. Opening setup never starts transport or
        // grants trust, binding, or environment authority.
        revealBindingAfterStart.current = true;
        setPresentationError(null);
        dispatch({ type: "choose", profile: "codex_app" });
        void guidanceRefresh.current("codex_app", "account");
        return;
      }
      if (!inspectTunnel) return;
      const presentsTrust = request?.targetId === "full-harness-trust";
      const presentsAgentAccountLink =
        request?.targetId === "auth0-account-link";
      const presentsReasoningBinding =
        request?.controlId === REASONING_BIND_CONTROL_ID;
      if (
        request?.kind !== "user_attention" ||
        request.panelId !== "agent-access" ||
        (!presentsTrust &&
          !presentsAgentAccountLink &&
          !presentsReasoningBinding)
      )
        return;
      const generation = ++presentationGeneration;
      failedPresentation = null;
      for (const retryId of retryIds) window.clearTimeout(retryId);
      retryIds.clear();
      setPresentationError(null);
      setOperationError(null);
      setOnboardingPhase("checking_readiness");
      dispatch({ type: "choose", profile: "codex_app" });
      const reportPresentationFailure = (message: string) => {
        if (cancelled || generation !== presentationGeneration) return;
        failedPresentation = candidate;
        setOnboardingPhase("action_required");
        setPresentationError(message);
      };
      const inspectPresentedTunnel = (attempt: number) => {
        void inspectTunnel()
          .then(parseDesktopMcpTunnelState)
          .then((tunnel) => {
            if (cancelled || generation !== presentationGeneration) return;
            if (!tunnel?.ready || tunnel.scope !== "full_helix_agent") {
              if (attempt >= 20) {
                reportPresentationFailure(
                  "The binding panel request arrived, but the native Full Harness transport did not become ready within 5 seconds. Binding is not ready. Ask the connected AI task to inspect the transport; repeating account sign-in will not complete this check.",
                );
                return;
              }
              const retryId = window.setTimeout(() => {
                retryIds.delete(retryId);
                inspectPresentedTunnel(attempt + 1);
              }, 250);
              retryIds.add(retryId);
              return;
            }
            setOnboardingTunnel(tunnel);
            setOnboardingPhase("checking_readiness");
            void guidanceRefresh.current("codex_app", "account");
          })
          .catch(() => reportPresentationFailure(
            "CasimirBot could not read native Full Harness transport readiness. Binding readiness is unverified. Ask the connected AI task to inspect the native transport.",
          ));
      };
      inspectPresentedTunnel(0);
    };
    const handleGuidance = (event: Event) => {
      const candidate = (event as CustomEvent<unknown>).detail;
      handleGuidanceRequest(candidate);
      const request = coerceWorkstationGuidanceRequest(candidate);
      if (
        request?.kind === "user_attention" &&
        request.panelId === "agent-access" &&
        (request.targetId === "external-ai-connection-setup" || request.targetId === "full-harness-trust" ||
          request.targetId === "auth0-account-link" ||
          request.controlId === REASONING_BIND_CONTROL_ID)
      ) {
        consumePendingWorkstationGuidance();
      }
    };
    window.addEventListener(HELIX_WORKSTATION_GUIDANCE_EVENT, handleGuidance);
    const pending = consumePendingWorkstationGuidance();
    if (pending) handleGuidanceRequest(pending);
    void window.casimirDesktop?.getPendingWorkstationGuidance?.()
      .then((candidate) => {
        if (!cancelled && candidate) handleGuidanceRequest(candidate);
      })
      .catch(() => undefined);
    const unsubscribeTunnel = window.casimirDesktop?.onMcpTunnelState?.((candidate) => {
      if (cancelled || !failedPresentation) return;
      const tunnel = parseDesktopMcpTunnelState(candidate);
      if (!tunnel?.ready || tunnel.scope !== "full_helix_agent") return;
      // A late native recovery resumes only the prior presentation/readiness
      // check. It does not start transport, issue a claim or approve a run.
      handleGuidanceRequest(failedPresentation);
    });
    return () => {
      cancelled = true;
      unsubscribeTunnel?.();
      for (const retryId of retryIds) window.clearTimeout(retryId);
      retryIds.clear();
      window.removeEventListener(
        HELIX_WORKSTATION_GUIDANCE_EVENT,
        handleGuidance,
      );
    };
  }, []);

  useEffect(() => {
    if (typeof window.casimirDesktop?.getRuntimeSnapshot !== "function") return;
    let cancelled = false;
    void fetch(FULL_HARNESS_TRUST_ENDPOINT, {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const body = (await response.json()) as { trust?: unknown };
        return parseFullHarnessTrust(body.trust);
      })
      .then((trust) => {
        if (!cancelled && trust) setFullHarnessTrust(trust);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (setup.selectedProfile !== "codex_app") return;
    const inspect = window.casimirDesktop?.getCodexPluginState;
    if (!inspect) return;
    let cancelled = false;
    void inspect()
      .then((candidate) => {
        if (!cancelled) setCodexPlugin(parseDesktopCodexPluginState(candidate));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [setup.selectedProfile]);

  const selected = setup.selectedProfile
    ? HELIX_AGENT_CLIENT_PROFILES[setup.selectedProfile]
    : null;
  const status = remote.kind === "loaded" ? remote.status : null;
  // Connection guidance follows the latest read; operation receipts such as
  // copying diagnostics remain separate strings, not cached readiness proof.
  const diagnosticMessage = typeof diagnosticStatus === "string" ? diagnosticStatus : diagnosticStatus
    ? status?.readiness.agent_ready && status.readiness.continuation_readiness !== "unavailable"
      ? "Connection checked. Review the exact-task binding below; Start Harness has not approved it for you."
      : "The connection is visible, but this exact task's continuation is unavailable. Ask that same AI task to refresh its CasimirBot presence, then recheck here."
    : null;
  const bindingGuidanceLabel = status?.readiness.continuation_readiness === "unavailable"
    ? "Recheck this AI task's connection before binding."
    : !status?.verified_run_association
      ? "For Minecraft, prepare a room below and wait for a verified run before binding. Chat-only binding remains optional."
      : "Review and bind the current Helix chat to this exact AI task. This is a user consent action.";

  const waitingForSessionSetup = (setup.viewedStep === "ready" || setup.viewedStep === "check") &&
    status?.readiness.client_authorization === "active" &&
    !status.catalog_reenumeration_required &&
    ((remote.kind === "loaded" && remote.readFailed) || status.readiness.continuation_readiness === "unavailable" || !status.readiness.agent_ready ||
      (Boolean(activeChatId) && reasoningBinding?.status !== "active" && !status.verified_run_association));
  useEffect(() => {
    if (!setup.selectedProfile || !["ready", "check"].includes(setup.viewedStep) ||
        !status?.heartbeat_expires_at) return;
    const deadline = Date.parse(status.heartbeat_expires_at);
    if (!Number.isFinite(deadline)) return;
    let timer: number;
    const inspectAtDeadline = () => {
      // This is a status read, never a heartbeat or consent renewal. Keep the
      // selected run mounted while fetching; the server still decides validity.
      if (document.visibilityState === "hidden") return;
      if (refreshBusy.current) {
        timer = window.setTimeout(inspectAtDeadline, 250);
        return;
      }
      void guidanceRefresh.current();
    };
    timer = window.setTimeout(inspectAtDeadline,
      Math.min(2_147_483_647, Math.max(0, deadline - Date.now()) + 50));
    return () => window.clearTimeout(timer);
  }, [setup.selectedProfile, setup.viewedStep, status?.heartbeat_expires_at]);

  useEffect(() => {
    if (!waitingForSessionSetup || !setup.selectedProfile) return;
    // Observe recovery from the authenticated task; never mint a heartbeat,
    // wake a provider, issue a claim, or extend a permission from this UI.
    // A connected task can still be preparing its run. Keep observing until
    // that association is available for human review, or a binding is active.
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "hidden" && !refreshBusy.current) {
        void guidanceRefresh.current();
      }
    }, 5_000);
    return () => window.clearInterval(timer);
  }, [waitingForSessionSetup, setup.selectedProfile]);

  useEffect(() => {
    if (!revealBindingAfterStart.current || setup.viewedStep !== "ready" || !status) return;
    revealBindingAfterStart.current = false;
    setDiagnosticStatus({ kind: "binding_check" });
    // Presentation only: wait until the binding target has mounted and never
    // invoke its human-only control or recursively refresh from our own guide.
    suppressLocalGuidanceHandling.current = true;
    try {
      requestWorkstationGuidance({
        kind: "user_attention", panelId: "agent-access", targetId: "reasoning-task-binding",
        label: bindingGuidanceLabel,
        durationMs: 12000,
      });
    } finally { suppressLocalGuidanceHandling.current = false; }
  }, [setup.viewedStep, status, bindingGuidanceLabel]);

  useEffect(() => {
    if (
      !["check", "ready"].includes(setup.viewedStep) ||
      status?.readiness.client_authorization !== "active"
    )
      return;
    let cancelled = false;
    void inspectLatestReasoningBinding()
      .then((binding) => {
        if (cancelled) return;
        setReasoningBinding(binding);
        rememberReasoningTaskBinding(binding);
      })
      .catch(() => {
        if (cancelled) return;
        setReasoningBinding(null);
        setClaimHandle((current) => {
          if (current) {
            setOperationError(
              "The previous show-once claim is no longer valid on this packaged service. Create a new binding claim; do not retry the old value.",
            );
          }
          return null;
        });
      });
    return () => {
      cancelled = true;
    };
  }, [
    rememberReasoningTaskBinding,
    setup.viewedStep,
    status?.client_session_ref,
    status?.readiness.continuation_readiness,
    status?.readiness.client_authorization,
  ]);

  useEffect(() => {
    if (
      !status?.service_instance_ref ||
      !reasoningBinding?.service_instance_ref ||
      status.service_instance_ref === reasoningBinding.service_instance_ref
    )
      return;
    setReasoningBinding(null);
    setClaimHandle(null);
    setOperationError(
      reasoningBinding.pairing_id
        ? "The packaged service restarted. Recover the existing approved pairing in the same AI task; its consent duration has not changed."
        : "The packaged service restarted, so its previous show-once claim was invalidated. Create a new binding claim for this service run.",
    );
  }, [reasoningBinding?.service_instance_ref, status?.service_instance_ref]);

  useEffect(() => {
    if (!claimHandle || !reasoningBinding?.expires_at) return;
    let cancelled = false;
    const expiresAt = Date.parse(reasoningBinding.expires_at);
    if (!Number.isFinite(expiresAt)) return;
    const reconcileExpiry = async () => {
      try {
        const binding = await inspectReasoningBinding(
          reasoningBinding.reasoning_binding_id,
        );
        if (cancelled) return;
        setClaimHandle(null);
        setReasoningBinding(binding);
        rememberReasoningTaskBinding(binding);
        setOperationError(
          binding.status === "active"
            ? null
            : "The show-once claim expired. Create a new binding claim instead of retrying the old value.",
        );
      } catch {
        if (cancelled) return;
        setClaimHandle(null);
        setReasoningBinding((current) =>
          current?.status === "pending_claim"
            ? { ...current, status: "expired" }
            : current,
        );
        setOperationError(
          "The show-once claim expired. Create a new binding claim instead of retrying the old value.",
        );
      }
    };
    const delay = expiresAt - Date.now();
    if (delay <= 0) {
      void reconcileExpiry();
      return () => {
        cancelled = true;
      };
    }
    const timeoutId = window.setTimeout(() => void reconcileExpiry(), delay);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    claimHandle,
    reasoningBinding?.expires_at,
    reasoningBinding?.reasoning_binding_id,
    rememberReasoningTaskBinding,
  ]);

  const mcpUrl = selected
    ? `${CASIMIRBOT_PUBLIC_ORIGIN}${selected.endpoint_path}`
    : "";

  const startHarness = async (): Promise<void> => {
    if (
      onboardingPhase === "starting_native_harness" ||
      onboardingPhase === "checking_readiness"
    )
      return;
    setOnboardingPhase("starting_native_harness");
    revealBindingAfterStart.current = true;
    pendingHarnessStart.current = false;
    setOperationError(null);
    setDiagnosticStatus(null);
    let nativeStartFailed = false;
    try {
      const start = window.casimirDesktop?.startMcpTunnel;
      if (start) {
        const tunnel = parseDesktopMcpTunnelState(
          await start({ scope: "full_helix_agent" }),
        );
        if (!tunnel) throw new Error("invalid native harness state");
        setOnboardingTunnel(tunnel);
        if (!tunnel.ready || tunnel.scope !== "full_helix_agent") {
          throw new Error("full harness did not become ready");
        }
      }
      pendingHarnessStart.current = false;
      setOnboardingPhase("checking_readiness");
    } catch {
      pendingHarnessStart.current = true;
      nativeStartFailed = true;
      setOnboardingPhase("action_required");
      setDiagnosticStatus(
        "CasimirBot could not start the full native harness. The connection check below will identify the next safe action; no provider task or OAuth approval was attempted.",
      );
    } finally {
      if (setup.selectedProfile !== "codex_app")
        skipNextProfileRefresh.current = true;
      dispatch({ type: "choose", profile: "codex_app" });
      if (fullHarnessTrust?.trusted !== true) {
        suppressLocalGuidanceHandling.current = true;
        try {
          requestWorkstationGuidance({
            kind: "user_attention",
            panelId: "agent-access",
            targetId: "full-harness-trust",
            label:
              "Review and choose whether to trust this installed device for short Full Harness tunnel leases and installed local environment application lifecycle.",
            durationMs: 8000,
          });
        } finally {
          suppressLocalGuidanceHandling.current = false;
        }
      }
      await refresh("codex_app", "account");
      if (nativeStartFailed) setOnboardingPhase("action_required");
    }
  };

  const updateFullHarnessTrust = async (trusted: boolean): Promise<void> => {
    if (trustBusy) return;
    setTrustBusy(true);
    setTrustStatus(null);
    let parsed: FullHarnessTrust | null = null;
    try {
      const response = await fetch(FULL_HARNESS_TRUST_ENDPOINT, {
        method: "PUT",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trusted }),
      });
      if (!response.ok) throw new Error("full harness trust update failed");
      const body = (await response.json()) as { trust?: unknown };
      parsed = parseFullHarnessTrust(body.trust);
      if (!parsed) throw new Error("invalid full harness trust projection");
      setFullHarnessTrust(parsed);
      setTrustStatus(
        parsed.trusted
          ? "Trusted-device tunnel approval is on. Every lease remains finite, logged, and revocable."
          : "Trusted-device tunnel approval is off.",
      );
    } catch {
      setTrustStatus(
        "CasimirBot could not change trusted-device approval. Sign in with a developer account and verify this installed device.",
      );
    } finally {
      setTrustBusy(false);
    }
    if (!parsed?.trusted || !pendingHarnessStart.current) return;

    setOnboardingPhase("starting_native_harness");
    try {
      const start = window.casimirDesktop?.startMcpTunnel;
      if (!start) throw new Error("native harness unavailable");
      const tunnel = parseDesktopMcpTunnelState(
        await start({ scope: "full_helix_agent" }),
      );
      if (!tunnel?.ready || tunnel.scope !== "full_helix_agent") {
        throw new Error("full harness did not become ready");
      }
      pendingHarnessStart.current = false;
      setOnboardingTunnel(tunnel);
      setTrustStatus(
        "This device is trusted and the pending Full Harness start resumed successfully.",
      );
      await refresh("codex_app", "account");
    } catch {
      setOnboardingPhase("action_required");
      setTrustStatus(
        "This device is trusted, but the pending Full Harness start still needs attention. Retry Start Harness; do not toggle trust off.",
      );
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
        nativeDesktopAvailable:
          typeof window.casimirDesktop?.getRuntimeSnapshot === "function",
        status,
        tunnel,
        reasoningBinding,
      });
      if (!navigator.clipboard?.writeText)
        throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(JSON.stringify(diagnostic, null, 2));
      setDiagnosticStatus("Sanitized onboarding diagnostics copied.");
    } catch {
      setDiagnosticStatus("Diagnostics could not be copied on this surface.");
    }
  };

  const currentCopy = useMemo(() => {
    switch (setup.viewedStep) {
      case "choose":
        return {
          title: "Choose your AI app",
          body: "CasimirBot works with an AI app already on this device. You can change this later.",
        };
      case "account":
        return {
          title: "Sign in to CasimirBot",
          body: "Use the workstation account menu to sign in, then retry this check.",
        };
      case "authorize":
        return {
          title: "Authorize agent access",
          body: "Link this CasimirBot profile through the native OAuth window. No token is copied into this chat or page.",
        };
      case "connect":
        return {
          title: `Add CasimirBot to ${selected?.display_name ?? "your AI app"}`,
          body: "This step happens in the AI app. CasimirBot does not edit its settings, approve OAuth, restart it, or create its chat.",
        };
      case "check":
        return status?.catalog_reenumeration_required
          ? {
              title: "Refresh this AI task's connection",
              body: "CasimirBot authorization changed after this task last loaded its tools. Use the AI app's in-place MCP reload for this same task. In Codex, reload MCP server configuration or restart Codex and reopen this same task; do not create replacement tasks just to chase a catalog.",
            }
          : {
              title: "Waiting for your AI task",
              body: "In the AI task you want to bind, ask: “Refresh this task’s CasimirBot presence.” Keep this page open: it checks automatically and continues to binding when that task is ready. No new task or repeated sign-in is needed. If CasimirBot tools are not installed in that AI app, use Advanced manual setup below.",
            };
      case "ready":
        return {
          title: "AI app connected",
          body: "Connection checked. Next: review the exact-task binding below. Connection readiness alone does not bind this chat or grant game actions.",
        };
    }
  }, [
    selected?.display_name,
    setup.viewedStep,
    status?.catalog_reenumeration_required,
  ]);

  const disconnect = async (): Promise<void> => {
    if (!status?.oauth_binding_ref) return;
    setOperationError(null);
    try {
      const response = await fetch(
        `/api/account/session/agent-bindings/${encodeURIComponent(status.oauth_binding_ref)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
        },
      );
      if (!response.ok) throw new Error("disconnect failed");
      setDisconnectConfirm(false);
      await refresh();
    } catch {
      setOperationError(
        "CasimirBot could not revoke this profile's agent binding. Retry without sharing any credential.",
      );
    }
  };

  const bindCurrentChat = async (): Promise<void> => {
    if (!status?.client_session_ref || !activeChatId) return;
    setBindingBusy(true);
    setOperationError(null);
    try {
      if (selectedRunVerification &&
          selectedRunVerification !== status.verified_run_association?.verification_ref) {
        throw new Error("reasoning_binding_run_association_stale");
      }
      const issued = await issueReasoningBindingClaim({
        clientSessionRef: status.client_session_ref,
        helixConversationId: activeChatId,
        runAssociation: status.verified_run_association &&
          selectedRunVerification === status.verified_run_association.verification_ref
          ? status.verified_run_association : undefined,
      });
      setReasoningBinding(issued.binding);
      rememberReasoningTaskBinding(issued.binding);
      setClaimHandle(issued.claim_handle);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "";
      setOperationError(
        reason === "reasoning_binding_run_association_stale"
          ? "The selected environment run changed or is no longer available. Refresh this task's presence, recheck the connection, and review the run again. Your existing chat binding was not replaced."
          : reason === "reasoning_binding_target_inactive"
          ? "This exact AI task's short supervisor presence expired. Return to that same task, ask it to refresh its CasimirBot presence, then retry here. Do not restart CasimirBot or create a replacement task."
          : reason === "reasoning_binding_identity_mismatch"
            ? "The connected AI task does not match this browser session. Recheck Agent Connections from the exact task you intend to bind; do not reuse another task's claim."
            : "CasimirBot could not create the exact task-binding claim.",
      );
    } finally {
      setBindingBusy(false);
    }
  };

  const checkReasoningBinding = async (): Promise<void> => {
    if (!reasoningBinding) return;
    setBindingBusy(true);
    try {
      const binding = await inspectReasoningBinding(
        reasoningBinding.reasoning_binding_id,
      );
      setReasoningBinding(binding);
      rememberReasoningTaskBinding(binding);
      if (binding.status === "active") setClaimHandle(null);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "";
      if (
        reason === "reasoning_binding_not_found" ||
        reason === "reasoning_binding_expired" ||
        reason === "reasoning_binding_superseded"
      ) {
        setReasoningBinding(null);
        setClaimHandle(null);
        setOperationError(
          "This show-once claim is no longer valid. Create a new binding claim; do not retry the old value.",
        );
      } else {
        setOperationError(
          "CasimirBot could not verify the current reasoning-task binding.",
        );
      }
    } finally {
      setBindingBusy(false);
    }
  };

  const revokeCurrentReasoningBinding = async (): Promise<void> => {
    if (!reasoningBinding) return;
    setBindingBusy(true);
    setOperationError(null);
    try {
      const binding = await revokeReasoningBinding(
        reasoningBinding.reasoning_binding_id,
      );
      setReasoningBinding(binding);
      rememberReasoningTaskBinding(binding);
      setClaimHandle(null);
    } catch {
      setOperationError(
        "CasimirBot could not revoke the current reasoning-task binding.",
      );
    } finally {
      setBindingBusy(false);
    }
  };

  const nativeTrustControl =
    typeof window.casimirDesktop?.getRuntimeSnapshot === "function" ? (
      <div
        className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-400/5 p-3"
        data-helix-guidance-target="full-harness-trust"
        data-helix-guidance-satisfied={
          fullHarnessTrust?.trusted === true ? "true" : "false"
        }
        data-helix-guidance-next-targets="reasoning-task-binding agent-connection-fast-start"
      >
        <div className="flex items-start gap-2 text-xs text-cyan-50">
          <span>
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {fullHarnessTrust?.trusted
                ? "This device is trusted for Full Harness"
                : "Trust this device for Full Harness"}
            </span>
            <span className="mt-1 block leading-5 text-cyan-50/70">
              Remember approval for short, logged tunnel leases and for
              starting or stopping installed local environment applications on
              this profile and device. This never grants in-environment
              Minecraft actions, trading, answer, or terminal authority.
            </span>
            <button
              type="button"
              disabled={trustBusy || fullHarnessTrust === null}
              onClick={() =>
                void updateFullHarnessTrust(fullHarnessTrust?.trusted !== true)
              }
              className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-cyan-200/30 bg-cyan-300/10 px-2.5 py-1.5 text-[11px] font-semibold text-cyan-50 disabled:opacity-50"
            >
              {trustBusy ? (
                <LoaderCircle className="h-3 w-3 animate-spin" aria-hidden="true" />
              ) : fullHarnessTrust?.trusted ? (
                <ShieldOff className="h-3 w-3" aria-hidden="true" />
              ) : (
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              )}
              {trustBusy
                ? "Saving device trust…"
                : fullHarnessTrust?.trusted
                  ? "Remove Full Harness device trust"
                  : "Trust this device for Full Harness"}
            </button>
          </span>
        </div>
        {trustStatus ? (
          <p className="mt-2 text-[11px] leading-4 text-cyan-100" role="status">
            {trustStatus}
          </p>
        ) : null}
      </div>
    ) : null;

  return (
    <section
      className="rounded-xl border border-cyan-300/20 bg-slate-950/85 p-4 text-slate-100"
      aria-labelledby="agent-connection-setup-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Agent Connections
          </p>
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
              disabled={
                onboardingPhase === "starting_native_harness" ||
                onboardingPhase === "checking_readiness"
              }
              onClick={() => void startHarness()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-50 disabled:opacity-50"
            >
              {onboardingPhase === "starting_native_harness" ||
              onboardingPhase === "checking_readiness" ? (
                <LoaderCircle
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {onboardingPhase === "starting_native_harness"
                ? "Starting harness…"
                : onboardingPhase === "checking_readiness"
                  ? "Checking connection…"
                  : "Start Harness"}
            </button>
          ) : null}
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300">
            {setup.viewedStep === "ready"
              ? "Review task binding"
              : `Step ${Math.max(1, ["choose", "account", "authorize", "connect", "check", "ready"].indexOf(setup.viewedStep) + 1)} of 6`}
          </span>
        </div>
      </div>

      <p
        className="mt-3 text-sm leading-6 text-slate-300"
        role="status"
        aria-live="polite"
      >
        {currentCopy.body}
      </p>
      {nativeTrustControl}

      {setup.viewedStep === "choose" ? (
        <div className="mt-4 space-y-3">
          <div
            className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-4"
            data-helix-guidance-target="agent-connection-fast-start"
            data-helix-guidance-label="Start the harness to check this account and exact Codex connection."
          >
            <p className="font-semibold text-cyan-50">Fast start with Codex</p>
            <p className="mt-1 text-xs leading-5 text-cyan-50/75">
              One click checks this account and exact Codex connection. In the
              installed desktop, this click also enables the existing full
              developer harness for this app session. It never approves OAuth,
              creates a Codex task, controls Codex UI, or grants environment
              authority.
            </p>
            <button
              type="button"
              disabled={
                onboardingPhase === "starting_native_harness" ||
                onboardingPhase === "checking_readiness"
              }
              onClick={() => void startHarness()}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-cyan-200/40 bg-cyan-300/15 px-4 py-2 text-sm font-semibold text-cyan-50 disabled:opacity-50"
            >
              {onboardingPhase === "starting_native_harness" ||
              onboardingPhase === "checking_readiness" ? (
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Play className="h-4 w-4" aria-hidden="true" />
              )}
              {onboardingPhase === "starting_native_harness"
                ? "Starting harness…"
                : onboardingPhase === "checking_readiness"
                  ? "Checking connection…"
                  : "Start Harness"}
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.values(HELIX_AGENT_CLIENT_PROFILES).map((profile) => (
              <button
                key={profile.profile_id}
                type="button"
                onClick={() =>
                  dispatch({ type: "choose", profile: profile.profile_id })
                }
                className="rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-300/40 hover:bg-cyan-400/10"
              >
                <span className="block font-semibold text-white">
                  {profile.display_name}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-400">
                  {profile.profile_id === "codex_app"
                    ? "Guided Codex MCP setup"
                    : "Any OAuth-capable Streamable HTTP MCP client"}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {setup.viewedStep === "authorize" ? (
        <div className="mt-4">
          <AgentAccountBindingReadiness />
        </div>
      ) : null}

      {setup.viewedStep === "connect" && selected ? (
        <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
          <ol className="list-decimal space-y-2 pl-5 text-xs leading-5 text-slate-300">
            {selected.profile_id === "codex_app" ? (
              <>
                <li>
                  In Codex, open Plugins, choose Installed, and open the
                  CasimirBot connection. Some Codex builds instead show MCP
                  servers in Settings.
                </li>
                <li>
                  Choose Connect, Finish setup, or Authenticate. If Codex asks
                  for a server address, use the address shown below.
                </li>
                <li>
                  After sign-in succeeds, reload the exact MCP server shown
                  below for this same task. Reconnecting a separate Device Check
                  plugin does not refresh this server's catalog. If this Codex
                  build has no reload control, restart Codex once only while
                  this exact server is already healthy, then reopen this same
                  task; do not create replacement tasks to chase the catalog.
                </li>
              </>
            ) : (
              <>
                <li>
                  Open your AI app's MCP or tools settings and add a Streamable
                  HTTP server.
                </li>
                <li>
                  Enter the server address below and choose its OAuth sign-in
                  flow.
                </li>
                <li>
                  Reload or reconnect the MCP server for the current task. If
                  the client cannot refresh a loaded task, report that
                  unsupported recovery boundary instead of repeatedly creating
                  fresh tasks.
                </li>
              </>
            )}
          </ol>
          <label
            className="mt-4 block text-[10px] font-semibold uppercase tracking-wide text-slate-500"
            htmlFor="agent-mcp-url"
          >
            Server address
          </label>
          <input
            id="agent-mcp-url"
            readOnly
            value={mcpUrl}
            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 font-mono text-xs text-cyan-100"
          />
          <p className="mt-2 text-[11px] text-slate-500">
            Use only the server address and the AI app's OAuth sign-in. Never
            paste a credential here.
          </p>
        </div>
      ) : null}

      {setup.viewedStep === "check" ? (
        <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-50/80">
          The AI app should use CasimirBot's connection-check tool
          automatically. The check passes only after this profile, exact MCP
          server, current node, client session, and chat thread are
          authenticated. Reconnecting a separate Device Check plugin, opening an
          app, or opening a tunnel alone does not pass it. If sign-in succeeds
          but the app immediately asks again, stop repeating the loop: the
          connection needs administrator repair before a connection check can pass.
        </div>
      ) : null}

      {setup.viewedStep === "ready" && status?.readiness.agent_ready ? (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-300/25 bg-emerald-400/10 p-4">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-200"
            aria-hidden="true"
          />
          <div className="text-xs leading-5 text-emerald-50/85">
            <p>
              Catalog probe: current. Chat attachment: current. Continuation:{" "}
              {status.readiness.continuation_readiness.replace("_", " ")}.
            </p>
            <p className="mt-1">
              Thread visibility:{" "}
              {status.thread_observability_bridge.negotiated_level.replaceAll(
                "_",
                " ",
              )}
              . Checkpoint publication:{" "}
              {status.thread_observability_bridge.checkpoint_publication_status.replaceAll(
                "_",
                " ",
              )}
              .
            </p>
            <p className="mt-1">
              {continuationExplanation(status.readiness.continuation_readiness)}
            </p>
            <p className="mt-1">
              This proves connection readiness only. It does not expose private
              reasoning or grant environment actions.
            </p>
          </div>
        </div>
      ) : null}

      {status?.authenticated_profile_ref && activeChatId && setup.viewedStep === "ready" ? (
        <DurableTaskPairing profileId={status.authenticated_profile_ref} chatId={activeChatId}
          onRuntimeBinding={(binding, pairingId) => {
            setReasoningBinding(current => binding ?? (current?.pairing_id === pairingId ? null : current));
            if (binding) rememberReasoningTaskBinding(binding);
          }}
          environment={status.verified_run_association ? {
            roomId: status.verified_run_association.room_id, runId: status.verified_run_association.run_id,
          } : null} />
      ) : null}

      {status?.heartbeat_expires_at ? (
        <ConnectionExpiryNotice deadline={status.heartbeat_expires_at} label="AI task presence"
          recovery="Ask the same AI task to refresh its CasimirBot presence. Keep this panel open for its automatic connection check. Keep any active binding; missing presence alone does not revoke it." />
      ) : null}

      {status && (setup.viewedStep === "ready" || (setup.viewedStep === "check" && reasoningBinding)) ? (
        <div
          className="mt-4 rounded-lg border border-cyan-300/20 bg-cyan-400/5 p-4 text-xs leading-5 text-cyan-50/85"
          data-helix-guidance-target="reasoning-task-binding"
          data-helix-guidance-satisfied={
            reasoningBinding?.status === "active" ? "true" : "false"
          }
          data-helix-guidance-label={bindingGuidanceLabel}
        >
          <p className="font-semibold text-cyan-100">
            Bind the current Helix chat to this exact AI task
          </p>
          <p className="mt-1">
            This does not create or control an AI-app chat. It authorizes only
            the authenticated task shown above to poll for steering from the
            selected local Helix chat.
          </p>
          {(reasoningBinding?.status === "pending_claim" || reasoningBinding?.status === "expired") && reasoningBinding.expires_at ? (
            <ConnectionExpiryNotice deadline={reasoningBinding.expires_at} label="One-time binding claim"
              recovery="Check the binding status before replacing the claim: the AI task may already have claimed it. If the server confirms expiry, review the verified environment run and generate a new claim here. Do not downgrade to chat-only for Minecraft." />
          ) : null}
          {reasoningBinding?.status === "active" ? (
            <div className="mt-3 rounded border border-white/15 p-3" aria-label="Session recovery status">
              <p>Chat binding: active. A missing heartbeat does not revoke this binding.</p>
              <p>AI availability: {status.readiness.agent_ready && status.readiness.continuation_readiness !== "unavailable"
                ? "current connection check passed; polling pickup still requires the AI task to run."
                : "waiting for a fresh connection check from the same AI task."}</p>
              <p>An associated run does not by itself prove current game connectivity or action permission.</p>
              <EnvironmentSessionReadyUp key={`${reasoningBinding.reasoning_binding_id}:${reasoningBinding.binding_epoch}`}
                binding={reasoningBinding} />
              <p className="mt-2">Keep this binding while recovering the session. Do not replace it just because task presence or game permissions expired.</p>
            </div>
          ) : null}
          {status.readiness.continuation_readiness === "unavailable" ? (
            <p className="mt-2 text-amber-100">
              This task's continuation was unavailable at the last check.
              Ask that same AI task to refresh its CasimirBot presence.
              While this panel is visible, it checks automatically every five seconds
              and enables binding when the server confirms readiness.
              Recheck connection only checks status: it cannot wake an idle task
              or renew binding and environment permissions. Do not create another task.
            </p>
          ) : null}
          {!activeChatId ? (
            <p className="mt-2 text-amber-100">
              Open or create a Helix chat first.
            </p>
          ) : null}
          {status.verified_run_association ? (
            <label className="mt-3 block rounded border border-cyan-300/20 p-3">
              <input
                type="checkbox"
                data-helix-interaction-kind="human_only"
                data-helix-authority-state="client_local"
                data-helix-control-id="workstation.panel.agent-access.agent-connection-setup.bind-environment-run"
                checked={selectedRunVerification === status.verified_run_association.verification_ref}
                onChange={event => setSelectedRunVerification(event.target.checked
                  ? status.verified_run_association!.verification_ref : null)}
              />{" "}
              Include this verified environment run in the new binding:
              <span className="block break-all">{status.verified_run_association.run_id}</span>
              <span className="block break-all">Room: {status.verified_run_association.room_id}</span>
              This associates steering with the run; environment action permission remains separate.
            </label>
          ) : (
            <div className="mt-3 rounded border border-amber-300/20 p-3">
              <label className="block">
                <input type="checkbox" checked={false} disabled aria-describedby="environment-run-preparation-needed" />{" "}
                Include a verified environment run in the new binding
              </label>
              <p id="environment-run-preparation-needed" className="mt-2">
                Environment session not ready to bind. This task has not published a current,
                server-verified run. A run may need preparation, or its verification may have
                expired after a state change. This does not mean Minecraft is disconnected.
              </p>
              <p className="mt-2">
                Ask this same AI task to prepare or restore the Minecraft session through the
                harness and refresh its presence with the exact run and room. Keep this panel
                open: when verification arrives, review and select the run here before replacing
                the binding. Checking the connection does not prepare a session or approve it.
              </p>
              <p className="mt-2">
                Binding now creates a chat-only connection, not a Minecraft run association.
                Do not generate another claim while waiting for the environment run.
              </p>
              {status.client_session_ref && status.conversation_thread_ref && activeChatId && (
                <EnvironmentSessionPreparationRequest
                  key={JSON.stringify([status.authenticated_profile_ref, status.service_instance_ref,
                    status.client_session_ref, status.conversation_thread_ref, activeChatId])}
                  clientSessionRef={status.client_session_ref}
                  profileRef={status.authenticated_profile_ref}
                  serviceInstanceRef={status.service_instance_ref}
                  continuationRef={status.conversation_thread_ref}
                  chatId={activeChatId}
                />
              )}
            </div>
          )}
          {selectedRunVerification &&
            selectedRunVerification !== status.verified_run_association?.verification_ref ? (
            <div className="mt-2 text-amber-100">
              The selected environment run is no longer current. Review a fresh run above or explicitly choose chat-only.
              <button
                type="button"
                data-helix-interaction-kind="human_only"
                data-helix-authority-state="client_local"
                data-helix-control-id="workstation.panel.agent-access.agent-connection-setup.clear-environment-run"
                className="ml-2 rounded border border-white/20 px-2 py-1"
                onClick={() => setSelectedRunVerification(null)}
              >Use chat-only binding</button>
            </div>
          ) : null}
          {claimHandle ? (
            <>
              <ReasoningClaimHandle value={claimHandle} />
              <p className="mt-2">
                In that exact AI task, call{" "}
                <code>helix_reasoning_task_binding_claim</code> with its stable
                continuation reference and this handle. Then return here and
                check the binding.
              </p>
              <p className="mt-1 text-[11px] text-cyan-100/70">
                {reasoningBinding?.expires_at
                  ? `Valid until ${new Date(reasoningBinding.expires_at).toLocaleTimeString()}. `
                  : "Short-lived claim. "}
                A packaged-service restart invalidates it immediately. Never
                retry a rejected or expired value.
              </p>
            </>
          ) : null}
          {reasoningBinding ? (
            <p className="mt-2">
              Binding state:{" "}
              <strong>{reasoningBinding.status.replaceAll("_", " ")}</strong>.
              Transport:{" "}
              {reasoningBinding.continuation_transport.replaceAll("_", " ")}.
              {" "}Environment run: {reasoningBinding.run_id ?? "none (chat-only)"}.
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              data-helix-control-id={REASONING_BIND_CONTROL_ID}
              data-helix-interaction-kind="human_only"
              data-helix-authority-state="client_local"
              type="button"
              disabled={
                !activeChatId ||
                (remote.kind === "loaded" && remote.readFailed === true) ||
                !status.client_session_ref ||
                !status.readiness.agent_ready ||
                status.readiness.continuation_readiness === "unavailable" ||
                bindingBusy
              }
              onClick={() => void bindCurrentChat()}
              className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 disabled:opacity-50"
            >
              {bindingBusy
                ? "Working…"
                : reasoningBinding
                  ? "Replace binding"
                  : "Bind current Helix chat"}
            </button>
            {reasoningBinding ? (
              <button
                data-helix-control-id="workstation.panel.agent-access.agent-connection-setup.check-reasoning-binding"
                data-helix-interaction-kind="observe"
                data-helix-authority-state="client_local"
                type="button"
                disabled={bindingBusy}
                onClick={() => void checkReasoningBinding()}
                className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-50"
              >
                Check binding
              </button>
            ) : null}
            {reasoningBinding &&
            ["pending_claim", "active"].includes(reasoningBinding.status) ? (
              <button
                data-helix-control-id="workstation.panel.agent-access.agent-connection-setup.revoke-reasoning-binding"
                data-helix-interaction-kind="human_only"
                data-helix-authority-state="client_local"
                type="button"
                disabled={bindingBusy}
                onClick={() => void revokeCurrentReasoningBinding()}
                className="rounded-lg border border-rose-300/30 px-3 py-2 text-rose-100 disabled:opacity-50"
              >
                Revoke binding
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {setup.explanationOpen ? (
        <p className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">
          Setup progress stored on this device is navigation only.
          Authorization, client presence, catalog adoption, and chat attachment
          are always re-read from trusted server or native-host evidence.
        </p>
      ) : null}

      {operationError ? (
        <p className="mt-3 text-xs text-rose-200" role="alert">
          {operationError}
        </p>
      ) : null}

      {presentationError ? (
        <p className="mt-3 text-xs text-rose-200" role="alert">
          {presentationError}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {window.casimirDesktop?.startMcpTunnel ? (
          <button
            type="button"
            onClick={() => void startHarness()}
            disabled={onboardingPhase === "starting_native_harness" || onboardingPhase === "checking_readiness"}
            title="Restore the native Full Harness transport and recheck setup. Does not renew an idle AI task's presence, approve binding, or grant game actions."
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-50 disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh harness connection
          </button>
        ) : null}
        {setup.viewedStep !== "choose" ? (
          <button
            type="button"
            onClick={() => dispatch({ type: "back" })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back
          </button>
        ) : null}
        {setup.viewedStep !== "choose" ? (
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={readinessRefreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-50 disabled:opacity-50"
          >
            {readinessRefreshing ? (
              <LoaderCircle
                className="h-3.5 w-3.5 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            )}{" "}
            {setup.viewedStep === "ready" ? "Recheck connection" : setup.viewedStep === "check" && !status?.catalog_reenumeration_required ? "Check connection" : "Retry"}
          </button>
        ) : null}
        {setup.viewedStep === "connect" ? (
          <button
            type="button"
            onClick={() => dispatch({ type: "view", step: "check" })}
            className="rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-50"
          >
            I added it
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => dispatch({ type: "toggle_explanation" })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5"
          aria-expanded={setup.explanationOpen}
        >
          <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" /> Explain
        </button>
        {setup.viewedStep !== "choose" ? (
          <button
            type="button"
            onClick={() => void copyOnboardingDiagnostic()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5"
          >
            <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" /> Copy
            diagnostics
          </button>
        ) : null}
      </div>

      {diagnosticStatus ? (
        <p className="mt-2 text-xs text-slate-300" role="status">
          {diagnosticMessage}
        </p>
      ) : null}

      {setup.selectedProfile === "codex_app" &&
      setup.viewedStep !== "choose" ? (
        <div className="mt-4 border-t border-white/10 pt-3 text-xs text-slate-400">
          <p>
            <strong className="text-slate-300">Optional Device Check:</strong>{" "}
            separate from the agent connection and never counts as chat or
            catalog proof.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {codexPlugin?.status === "ready" && !setup.deviceCheckSkipped ? (
              <button
                type="button"
                onClick={() => void window.casimirDesktop?.openCodexPlugin?.()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Open
                optional Device Check
              </button>
            ) : null}
            {!setup.deviceCheckSkipped ? (
              <button
                type="button"
                onClick={() => dispatch({ type: "skip_device_check" })}
                className="rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5"
              >
                Skip Device Check
              </button>
            ) : (
              <span>Device Check skipped.</span>
            )}
          </div>
        </div>
      ) : null}

      {setup.viewedStep === "ready" && status?.oauth_binding_ref ? (
        <div className="mt-4 border-t border-white/10 pt-3">
          {!disconnectConfirm ? (
            <button
              type="button"
              onClick={() => setDisconnectConfirm(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300/20 px-3 py-2 text-xs text-rose-100 hover:bg-rose-400/10"
            >
              <ShieldOff className="h-3.5 w-3.5" aria-hidden="true" />{" "}
              Disconnect
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-xs text-rose-100">
              <span>
                This revokes the profile binding used by every AI client linked
                through it.
              </span>
              <button
                type="button"
                onClick={() => void disconnect()}
                className="rounded-lg border border-rose-300/30 bg-rose-400/10 px-3 py-2"
              >
                Confirm disconnect
              </button>
              <button
                type="button"
                onClick={() => setDisconnectConfirm(false)}
                className="rounded-lg border border-white/10 px-3 py-2"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

export default AgentConnectionSetup;
