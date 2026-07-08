import React, { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import type { HelixLanguageModelProfileId } from "@shared/helix-language-model-policy";
import { DEFAULT_HELIX_AGENT_RUNTIME_PROVIDERS } from "@/lib/helix/ask-agent-runtime-display";
import { useAgiChatStore } from "@/store/useAgiChatStore";

import {
  buildHelixAskComposerViewModel,
} from "./HelixAskComposer";
import { HelixAskLegacyComposerSurface } from "./HelixAskLegacyComposerSurface";
import { HelixAskConsoleRuntimeLayout } from "./HelixAskConsoleRuntimeLayout";
import { buildHelixAskConsoleRuntimeBridgeProps } from "./HelixAskConsoleRuntimeShellProps";
import { HelixAskDebugDrawer } from "./HelixAskDebugDrawer";
import type { HelixAskConsoleProps } from "./HelixAskConsoleState";
import {
  completeHelixAskMinimalRuntimeTurn,
  createHelixAskMinimalRuntimeInitialState,
  failHelixAskMinimalRuntimeTurn,
  HELIX_ASK_MINIMAL_RUNTIME_REPLY_LIMIT,
  recordHelixAskMinimalRuntimeStreamEvent,
  resolveHelixAskMinimalRuntimeAnswerText,
  startHelixAskMinimalRuntimeTurn,
} from "./HelixAskMinimalRuntimeLifecycle";
import { buildHelixAskMinimalRuntimeRepliesFromChatSession } from "./HelixAskMinimalRuntimeChatSession";
import { runHelixAskMinimalRuntimeBackendTurn } from "./HelixAskMinimalRuntimeBackendRunner";
import {
  buildHelixAskMinimalRuntimeSubmitPlan,
  type HelixAskMinimalRuntimeSubmitPlan,
} from "./HelixAskMinimalRuntimeSubmitPlan";
import {
  buildHelixAskMinimalRuntimeTurnPayload,
  runHelixAskMinimalRuntimeInjectedTransport,
  type HelixAskMinimalRuntimeTurnRunner,
} from "./HelixAskMinimalRuntimeTransport";
import { HelixAskMinimalRuntimeTurnList } from "./HelixAskMinimalRuntimeTurnList";
import {
  HELIX_ASK_MINIMAL_RUNTIME_BROWSER_CONTROL_ACTIONS,
  type HelixAskMinimalRuntimeControlActions,
  type HelixAskMinimalRuntimeControlPayload,
} from "./HelixAskMinimalRuntimeControls";
import {
  clearPendingHelixAskPrompt,
  consumePendingHelixAskPrompt,
  HELIX_ASK_PROMPT_EVENT,
  type PendingHelixAskPrompt,
} from "@/lib/helix/ask-prompt-launch";
import {
  claimExternalPromptSingleFlight,
  resolveExternalPromptClaimId,
} from "@/lib/helix/ask-external-prompt-claim";
import {
  buildHelixAskRuntimePickerModel,
  HelixAskRuntimePicker,
} from "./HelixAskRuntimePicker";
import {
  buildHelixAskLanguageModelPickerModel,
  HelixAskLanguageModelPicker,
} from "./HelixAskLanguageModelPicker";
import {
  persistHelixAskLanguageModelProfile,
  readStoredHelixAskLanguageModelProfile,
} from "./HelixAskLanguageModelPreference";
import { useHelixAskRuntimeGoalWakeSubscriptions } from "./HelixAskRuntimeGoalWakeSubscriptions";
import { HelixAskRuntimeStatusLine } from "./HelixAskStatusLine";
import {
  HelixAskSurfaceSupplementStack,
  type HelixAskSurfaceSupplementStackProps,
} from "./HelixAskSurfaceSupplementStack";
import { HelixAskSurfaceFrameSurface } from "./HelixAskSurfaceFrameSurface";

export type HelixAskMinimalRuntimeVisibleSurfaceSlots = {
  voiceLevelMonitor?: ReactNode;
  goalPill?: ReactNode;
  steeringQueue?: ReactNode;
  supplementStack?: HelixAskSurfaceSupplementStackProps;
};

export type HelixAskMinimalRuntimeShellProps = HelixAskConsoleProps & {
  onSubmitPlan?: (submitPlan: HelixAskMinimalRuntimeSubmitPlan) => void;
  runTurn?: HelixAskMinimalRuntimeTurnRunner;
  controlActions?: HelixAskMinimalRuntimeControlActions;
  visibleSurface?: HelixAskMinimalRuntimeVisibleSurfaceSlots;
};

type HelixAskMinimalRuntimeDebugDrawerState = {
  payload: string;
  payloadHash: string;
  readbackMatch: string;
  replyId: string;
};

type RecordLike = Record<string, unknown>;

function hashHelixAskMinimalRuntimeDebugPayload(text: string): string {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = Math.imul(31, hash) + text.charCodeAt(index);
    hash |= 0;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function HelixAskMinimalRuntimeShell({
  onSubmitPlan,
  runTurn,
  controlActions,
  visibleSurface,
  ...props
}: HelixAskMinimalRuntimeShellProps) {
  const shellProps = buildHelixAskConsoleRuntimeBridgeProps(props);
  const [draft, setDraft] = useState("");
  const [selectedRuntime, setSelectedRuntime] = useState<HelixAgentRuntimeId>("helix");
  const [selectedLanguageModelProfile, setSelectedLanguageModelProfile] = useState<HelixLanguageModelProfileId>(() =>
    readStoredHelixAskLanguageModelProfile(),
  );
  const [runtimeMenuOpen, setRuntimeMenuOpen] = useState(false);
  const [languageModelMenuOpen, setLanguageModelMenuOpen] = useState(false);
  const [runtimeState, setRuntimeState] = useState(createHelixAskMinimalRuntimeInitialState);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [debugDrawer, setDebugDrawer] = useState<HelixAskMinimalRuntimeDebugDrawerState | null>(null);
  const runtimeRepliesRef = useRef<readonly RecordLike[]>([]);
  const runtimeGoalWakeInFlightRef = useRef(false);
  const runtimeGoalWakeLastSubmittedKeyRef = useRef<string | null>(null);
  const hydratedChatSessionRef = useRef<string | null>(null);
  const pendingExternalPromptRef = useRef<PendingHelixAskPrompt | null>(null);
  const askInputRef = useRef<HTMLTextAreaElement | null>(null);
  const toolbarCarouselRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const ensureContextSession = useAgiChatStore((state) => state.ensureContextSession);
  const addChatMessage = useAgiChatStore((state) => state.addMessage);
  const setActiveChatSession = useAgiChatStore((state) => state.setActive);
  const chatSession = useAgiChatStore((state) => (chatSessionId ? state.sessions[chatSessionId] : undefined));
  const turnRunner = runTurn ?? runHelixAskMinimalRuntimeBackendTurn;
  const shellControlActions = useMemo<HelixAskMinimalRuntimeControlActions>(() => {
    if (controlActions) return controlActions;
    return {
      ...HELIX_ASK_MINIMAL_RUNTIME_BROWSER_CONTROL_ACTIONS,
      debugCopy: async (payload: HelixAskMinimalRuntimeControlPayload) => {
        await HELIX_ASK_MINIMAL_RUNTIME_BROWSER_CONTROL_ACTIONS.debugCopy(payload);
        setDebugDrawer({
          payload: payload.debugCopyText,
          payloadHash: hashHelixAskMinimalRuntimeDebugPayload(payload.debugCopyText),
          readbackMatch: "not_checked",
          replyId: payload.replyId,
        });
      },
    };
  }, [controlActions]);

  useEffect(() => {
    runtimeRepliesRef.current = runtimeState.replies as unknown as readonly RecordLike[];
  }, [runtimeState.replies]);

  const getMinimalRuntimeSessionId = useCallback(() => {
    const sessionId = chatSessionId ?? ensureContextSession(props.contextId, "Helix Ask");
    if (sessionId && sessionId !== chatSessionId) {
      setChatSessionId(sessionId);
      setActiveChatSession(sessionId);
    }
    return sessionId ?? null;
  }, [chatSessionId, ensureContextSession, props.contextId, setActiveChatSession]);

  const buildMinimalWorkspaceContextSnapshot = useCallback((sessionId: string | null): RecordLike => {
    const href = typeof window === "undefined" ? "" : window.location.href;
    const url = (() => {
      try {
        return href ? new URL(href) : null;
      } catch {
        return null;
      }
    })();
    const docPath = url?.searchParams.get("doc")?.trim() || null;
    const focus = url?.searchParams.get("focus")?.trim() || null;
    const panels = url?.searchParams.get("panels")?.split(",").map((entry) => entry.trim()).filter(Boolean) ?? [];
    return {
      schema: "helix.ask.minimal_runtime_workspace_context_snapshot.v1",
      session_id: sessionId,
      desktop_url: href,
      active_panel_id: focus || (panels.includes("docs-viewer") ? "docs-viewer" : null),
      activePanelId: focus || (panels.includes("docs-viewer") ? "docs-viewer" : null),
      open_panel_ids: panels,
      openPanelIds: panels,
      active_doc_path: docPath,
      activeDocPath: docPath,
      doc_context_path: docPath,
      docContextPath: docPath,
    };
  }, []);

  const appendMinimalRuntimeWakeReply = useCallback((reply: RecordLike) => {
    const turnId =
      typeof reply.turn_id === "string" && reply.turn_id.trim()
        ? reply.turn_id.trim()
        : typeof reply.id === "string" && reply.id.trim()
          ? reply.id.trim()
          : `runtime-goal-wake:${Date.now()}`;
    const content =
      typeof reply.content === "string" && reply.content.trim()
        ? reply.content
        : typeof reply.selected_final_answer === "string" && reply.selected_final_answer.trim()
          ? reply.selected_final_answer
          : typeof reply.text === "string" && reply.text.trim()
            ? reply.text
            : "Runtime goal wake completed.";
    const question =
      typeof reply.question === "string" && reply.question.trim()
        ? reply.question
        : "Runtime goal wake: visible source changed";
    setRuntimeState((state) => ({
      ...state,
      askBusy: false,
      askStatus: "Runtime goal wake completed.",
      activeTurnId: state.activeTurnId === turnId ? null : state.activeTurnId,
      activeStartedAtMs: state.activeTurnId === turnId ? null : state.activeStartedAtMs,
      replies: [
        ...state.replies.filter((entry) => entry.turn_id !== turnId),
        {
          id: turnId,
          turn_id: turnId,
          createdAtMs:
            typeof reply.createdAtMs === "number" && Number.isFinite(reply.createdAtMs)
              ? reply.createdAtMs
              : Date.now(),
          content,
          question,
          mode: "observe",
          result: reply,
          debug: reply.debug,
          liveEvents: [],
        },
      ].slice(-HELIX_ASK_MINIMAL_RUNTIME_REPLY_LIMIT),
    }));
  }, []);

  useHelixAskRuntimeGoalWakeSubscriptions({
    selectedAgentRuntime: selectedRuntime,
    askRepliesRef: runtimeRepliesRef,
    runtimeGoalWakeInFlightRef,
    runtimeGoalWakeLastSubmittedKeyRef,
    getHelixAskSessionId: getMinimalRuntimeSessionId,
    buildWorkspaceContextSnapshot: buildMinimalWorkspaceContextSnapshot,
    setAskStatus: (status) => {
      setRuntimeState((state) => ({ ...state, askStatus: status }));
    },
    setAskError: (error) => {
      if (!error) return;
      setRuntimeState((state) => ({ ...state, askStatus: error }));
    },
    appendWakeReply: appendMinimalRuntimeWakeReply,
  });

  const submitMinimalRuntimeQuestion = useCallback((questionText: string, pendingPrompt: PendingHelixAskPrompt | null = null) => {
    const draftText = questionText.trim();
    if (!draftText) return false;
    if (runtimeState.askBusy) {
      pendingExternalPromptRef.current = pendingPrompt
        ? { ...pendingPrompt, question: draftText }
        : {
            promptId: `queued:${Date.now()}`,
            question: draftText,
            autoSubmit: true,
            createdAt: Date.now(),
          };
      return true;
    }
    const submitPlan = buildHelixAskMinimalRuntimeSubmitPlan({
      draft: draftText,
      selectedRuntime,
      selectedLanguageModelProfile,
      desktopUrl: typeof window === "undefined" ? "" : window.location.href,
      pendingPrompt,
    });
    if (submitPlan.envelope) {
      const turnId = `ask:${crypto.randomUUID()}`;
      const sessionId = chatSessionId ?? ensureContextSession(props.contextId, "Helix Ask");
      onSubmitPlan?.(submitPlan);
      if (sessionId) {
        setChatSessionId(sessionId);
        setActiveChatSession(sessionId);
        addChatMessage(sessionId, {
          role: "user",
          content: submitPlan.envelope.question,
          traceId: turnId,
        });
      }
      setRuntimeState((state) =>
        startHelixAskMinimalRuntimeTurn({
          state,
          submitPlan,
          turnId,
          startedAtMs: Date.now(),
        }),
      );
      const payload = buildHelixAskMinimalRuntimeTurnPayload({
        submitPlan,
        sessionId,
        traceId: turnId,
        turnId,
        maxTokens: 8192,
      });
      if (payload) {
        void runHelixAskMinimalRuntimeInjectedTransport({
          runner: turnRunner,
          payload,
          onEvent: (event) => {
            setRuntimeState((state) =>
              recordHelixAskMinimalRuntimeStreamEvent({
                state,
                turnId,
                eventName: event.event,
                receivedAtMs: Date.now(),
              }),
            );
          },
        })
          .then((result) => {
            if (sessionId) {
              addChatMessage(sessionId, {
                role: "assistant",
                content: resolveHelixAskMinimalRuntimeAnswerText(result),
                traceId: turnId,
                helixAsk: {
                  schema: "helix.ask.chat_backend_observation.v1",
                  backend_ask_call_attempted: true,
                  backend_ask_entrypoint_observed: true,
                  use_backend_ask_turn_entrypoint: true,
                  turn_id: typeof result.turn_id === "string" && result.turn_id.trim() ? result.turn_id : turnId,
                  final_answer_source:
                    typeof result.final_answer_source === "string" ? result.final_answer_source : null,
                  terminal_artifact_kind:
                    typeof result.terminal_artifact_kind === "string" ? result.terminal_artifact_kind : null,
                  terminal_error_code:
                    typeof result.terminal_error_code === "string" ? result.terminal_error_code : null,
                },
              });
            }
            setRuntimeState((state) =>
              completeHelixAskMinimalRuntimeTurn({
                state,
                turnId,
                result,
                completedAtMs: Date.now(),
              }),
            );
          })
          .catch((error: unknown) => {
            if (sessionId) {
              addChatMessage(sessionId, {
                role: "assistant",
                content: error instanceof Error ? error.message : "Ask turn failed.",
                traceId: turnId,
              });
            }
            setRuntimeState((state) =>
              failHelixAskMinimalRuntimeTurn({
                state,
                turnId,
                error,
                failedAtMs: Date.now(),
              }),
            );
          });
      }
      setDraft("");
      return true;
    }
    setDraft((value) => (value === questionText ? value.trimStart() : value));
    return false;
  }, [
    addChatMessage,
    chatSessionId,
    ensureContextSession,
    onSubmitPlan,
    props.contextId,
    runtimeState.askBusy,
    selectedLanguageModelProfile,
    selectedRuntime,
    setActiveChatSession,
    turnRunner,
  ]);

  const executePendingPrompt = useCallback((pending: PendingHelixAskPrompt | null | undefined) => {
    const question = pending?.question?.trim() ?? "";
    if (!question) return;
    const claimId = resolveExternalPromptClaimId(pending, question);
    if (!claimExternalPromptSingleFlight(claimId)) return;
    clearPendingHelixAskPrompt();
    if (pending?.autoSubmit === false) {
      setDraft(question);
      return;
    }
    submitMinimalRuntimeQuestion(question, pending);
  }, [submitMinimalRuntimeQuestion]);

  useEffect(() => {
    if (runtimeState.askBusy) return;
    const pending = pendingExternalPromptRef.current;
    if (!pending) return;
    pendingExternalPromptRef.current = null;
    submitMinimalRuntimeQuestion(pending.question, pending);
  }, [runtimeState.askBusy, submitMinimalRuntimeQuestion]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pending = consumePendingHelixAskPrompt();
    if (pending) executePendingPrompt(pending);
    const handlePromptEvent = (event: Event) => {
      const detail = (event as CustomEvent<PendingHelixAskPrompt>)?.detail;
      executePendingPrompt(detail);
    };
    window.addEventListener(HELIX_ASK_PROMPT_EVENT, handlePromptEvent as EventListener);
    return () => {
      window.removeEventListener(HELIX_ASK_PROMPT_EVENT, handlePromptEvent as EventListener);
    };
  }, [executePendingPrompt]);

  const runtimePickerModel = useMemo(
    () =>
      buildHelixAskRuntimePickerModel({
        selectedRuntime,
        providers: DEFAULT_HELIX_AGENT_RUNTIME_PROVIDERS,
      }),
    [selectedRuntime],
  );
  const languageModelPickerModel = useMemo(
    () => buildHelixAskLanguageModelPickerModel(selectedLanguageModelProfile),
    [selectedLanguageModelProfile],
  );
  const composerViewModel = useMemo(
    () =>
      buildHelixAskComposerViewModel({
        busy: runtimeState.askBusy,
        placeholder: shellProps.placeholder,
        runtimeLabel: runtimePickerModel.selectedLabel,
      }),
    [runtimePickerModel.selectedLabel, runtimeState.askBusy, shellProps.placeholder],
  );
  const submitCurrentDraft = useCallback(() => {
    submitMinimalRuntimeQuestion(draft);
  }, [draft, submitMinimalRuntimeQuestion]);

  useEffect(() => {
    const sessionId = ensureContextSession(props.contextId, "Helix Ask");
    if (!sessionId) return;
    setChatSessionId(sessionId);
    setActiveChatSession(sessionId);
  }, [ensureContextSession, props.contextId, setActiveChatSession]);

  useEffect(() => {
    if (!chatSession || hydratedChatSessionRef.current === chatSession.id) return;
    const hydratedReplies = buildHelixAskMinimalRuntimeRepliesFromChatSession(chatSession);
    hydratedChatSessionRef.current = chatSession.id;
    if (hydratedReplies.length === 0) return;
    setRuntimeState((state) => {
      if (state.replies.length > 0) return state;
      return {
        ...state,
        replies: hydratedReplies,
      };
    });
  }, [chatSession]);

  return (
    <HelixAskConsoleRuntimeLayout
      className={shellProps.className}
      layoutVariant={shellProps.layoutVariant ?? "hero"}
      surface={
        <div
          className="relative z-10"
          data-testid="helix-ask-minimal-runtime-shell"
        >
          <HelixAskSurfaceFrameSurface
            maxWidthClassName={
              shellProps.maxWidthClassName ??
              (shellProps.layoutVariant === "dock" ? "max-w-none" : "mx-auto max-w-4xl")
            }
            surfaceBorderClassName="border-cyan-300/20"
            surfaceTintClassName="bg-cyan-400/[0.03]"
            surfaceHaloClassName="shadow-[0_0_80px_rgba(34,211,238,0.08)]"
            isOffline={false}
            onPrimeInteraction={() => undefined}
            onSubmit={(event) => {
              event.preventDefault();
              submitCurrentDraft();
            }}
          >
            <div className="relative z-[90] flex justify-end px-4 pt-3">
              <HelixAskLanguageModelPicker
                model={languageModelPickerModel}
                menuOpen={languageModelMenuOpen}
                onPrimaryClick={() => {
                  setRuntimeMenuOpen(false);
                  setLanguageModelMenuOpen((open) => !open);
                }}
                onSelect={(profile) => {
                  setSelectedLanguageModelProfile(profile);
                  persistHelixAskLanguageModelProfile(profile);
                  setLanguageModelMenuOpen(false);
                }}
              />
            </div>
            {visibleSurface?.voiceLevelMonitor}
            <HelixAskLegacyComposerSurface
              voiceLevelMonitor={{
                visible: false,
                maxHeightPx: 0,
                level: 0,
                signalState: "low",
              }}
              moodAvatar={{
                auraClassName: "border-cyan-300/25 bg-cyan-400/10 shadow-[0_0_28px_rgba(34,211,238,0.18)]",
                ringClassName: "ring-cyan-200/25",
                moodSrc: null,
                moodLabel: "Helix",
                onImageError: () => undefined,
              }}
              actionToolbar={{
                carouselRef: toolbarCarouselRef,
                imageInputRef,
                canScrollLeft: false,
                canScrollRight: false,
                onScrollLeft: () => undefined,
                onScrollRight: () => undefined,
                onImageSelect: () => undefined,
                onAttachImage: () => imageInputRef.current?.click(),
                attachDisabled: true,
                hasReadyAttachment: false,
                hasAnyAttachment: false,
                micEnabled: false,
                voiceTranscribing: false,
                onToggleMic: () => undefined,
                showRetryVoiceSample: false,
                retryVoiceSampleDisabled: true,
                onRetryVoiceSample: () => undefined,
                showVisualCaptureControls: true,
                visualSituationSourceStatus: "idle",
                onCaptureVisualSource: () => undefined,
                visualSituationIncludeAudio: false,
                displayAudioStatus: "idle",
                visualAudioToggleDisabled: true,
                onToggleVisualAudio: () => undefined,
                runtimePickerModel,
                runtimeMenuOpen,
                onRuntimePrimaryClick: () => {
                  setLanguageModelMenuOpen(false);
                  setRuntimeMenuOpen((open) => !open);
                },
                onRuntimeSelect: (runtime) => {
                  setSelectedRuntime(runtime);
                  setRuntimeMenuOpen(false);
                  setLanguageModelMenuOpen(false);
                },
                submitViewModel: composerViewModel,
                onSubmitIntent: submitCurrentDraft,
                onStop: () => undefined,
              }}
              textarea={{
                ariaDisabled: runtimeState.askBusy,
                className: composerViewModel.textareaClassName,
                placeholder: composerViewModel.currentPlaceholder,
                value: draft,
                onInputValue: (value) => setDraft(value),
                onSubmitRequested: (form) => form?.requestSubmit(),
              }}
              textareaRef={askInputRef}
            />
          </HelixAskSurfaceFrameSurface>
          {visibleSurface?.supplementStack ? (
            <HelixAskSurfaceSupplementStack {...visibleSurface.supplementStack} />
          ) : null}
          <HelixAskRuntimeStatusLine text={runtimeState.askStatus} />
          <HelixAskMinimalRuntimeTurnList
            replies={runtimeState.replies}
            className={shellProps.replyListClassName ?? "relative z-10 mt-4 space-y-5"}
            controlActions={shellControlActions}
          />
        </div>
      }
      goalPill={visibleSurface?.goalPill}
      steeringQueue={visibleSurface?.steeringQueue}
      debugDrawer={debugDrawer ? (
        <HelixAskDebugDrawer
          payload={debugDrawer.payload}
          payloadHash={debugDrawer.payloadHash}
          readbackMatch={debugDrawer.readbackMatch}
          replyId={debugDrawer.replyId}
          onClose={() => setDebugDrawer(null)}
        />
      ) : null}
    />
  );
}
