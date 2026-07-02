import React, { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import { DEFAULT_HELIX_AGENT_RUNTIME_PROVIDERS } from "@/lib/helix/ask-agent-runtime-display";
import { useAgiChatStore } from "@/store/useAgiChatStore";

import { HelixAskComposer } from "./HelixAskComposer";
import { HelixAskConsoleRuntimeLayout } from "./HelixAskConsoleRuntimeLayout";
import { buildHelixAskConsoleRuntimeBridgeProps } from "./HelixAskConsoleRuntimeShellProps";
import { HelixAskDebugDrawer } from "./HelixAskDebugDrawer";
import type { HelixAskConsoleProps } from "./HelixAskConsoleState";
import {
  completeHelixAskMinimalRuntimeTurn,
  createHelixAskMinimalRuntimeInitialState,
  failHelixAskMinimalRuntimeTurn,
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
  buildHelixAskRuntimePickerModel,
  HelixAskRuntimePicker,
} from "./HelixAskRuntimePicker";
import { HelixAskRuntimeStatusLine } from "./HelixAskStatusLine";
import {
  HelixAskSurfaceSupplementStack,
  type HelixAskSurfaceSupplementStackProps,
} from "./HelixAskSurfaceSupplementStack";

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
  const [runtimeMenuOpen, setRuntimeMenuOpen] = useState(false);
  const [runtimeState, setRuntimeState] = useState(createHelixAskMinimalRuntimeInitialState);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [debugDrawer, setDebugDrawer] = useState<HelixAskMinimalRuntimeDebugDrawerState | null>(null);
  const hydratedChatSessionRef = useRef<string | null>(null);
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

  const runtimePickerModel = useMemo(
    () =>
      buildHelixAskRuntimePickerModel({
        selectedRuntime,
        providers: DEFAULT_HELIX_AGENT_RUNTIME_PROVIDERS,
      }),
    [selectedRuntime],
  );

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
        <section
          className="relative z-10 w-full rounded-3xl border border-cyan-300/20 bg-slate-950/85 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
          data-testid="helix-ask-minimal-runtime-shell"
        >
          {visibleSurface?.voiceLevelMonitor}
          <div className="mb-3 flex justify-end">
            <HelixAskRuntimePicker
              model={runtimePickerModel}
              menuOpen={runtimeMenuOpen}
              onPrimaryClick={() => setRuntimeMenuOpen((open) => !open)}
              onSelect={(runtime) => {
                setSelectedRuntime(runtime);
                setRuntimeMenuOpen(false);
              }}
            />
          </div>
          <HelixAskComposer
            value={draft}
            placeholder={shellProps.placeholder}
            runtimeLabel={runtimePickerModel.selectedLabel}
            onChange={setDraft}
            onSubmit={() => {
              const submitPlan = buildHelixAskMinimalRuntimeSubmitPlan({
                draft,
                selectedRuntime,
                desktopUrl: typeof window === "undefined" ? "" : window.location.href,
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
                return;
              }
              setDraft((value) => value.trimStart());
            }}
          />
          {visibleSurface?.supplementStack ? (
            <HelixAskSurfaceSupplementStack {...visibleSurface.supplementStack} />
          ) : null}
          <HelixAskRuntimeStatusLine text={runtimeState.askStatus} />
          <HelixAskMinimalRuntimeTurnList
            replies={runtimeState.replies}
            className={shellProps.replyListClassName ?? "relative z-10 mt-4 space-y-5"}
            controlActions={shellControlActions}
          />
        </section>
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
