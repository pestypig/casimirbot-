import React, { useEffect, useMemo, useRef, useState } from "react";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import { DEFAULT_HELIX_AGENT_RUNTIME_PROVIDERS } from "@/lib/helix/ask-agent-runtime-display";
import { useAgiChatStore } from "@/store/useAgiChatStore";

import { HelixAskComposer } from "./HelixAskComposer";
import { HelixAskConsoleRuntimeLayout } from "./HelixAskConsoleRuntimeLayout";
import { buildHelixAskConsoleRuntimeBridgeProps } from "./HelixAskConsoleRuntimeShellProps";
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
import type { HelixAskMinimalRuntimeControlActions } from "./HelixAskMinimalRuntimeControls";
import {
  buildHelixAskRuntimePickerModel,
  HelixAskRuntimePicker,
} from "./HelixAskRuntimePicker";

export type HelixAskMinimalRuntimeShellProps = HelixAskConsoleProps & {
  onSubmitPlan?: (submitPlan: HelixAskMinimalRuntimeSubmitPlan) => void;
  runTurn?: HelixAskMinimalRuntimeTurnRunner;
  controlActions?: HelixAskMinimalRuntimeControlActions;
};

export function HelixAskMinimalRuntimeShell({
  onSubmitPlan,
  runTurn,
  controlActions,
  ...props
}: HelixAskMinimalRuntimeShellProps) {
  const shellProps = buildHelixAskConsoleRuntimeBridgeProps(props);
  const [draft, setDraft] = useState("");
  const [selectedRuntime, setSelectedRuntime] = useState<HelixAgentRuntimeId>("helix");
  const [runtimeMenuOpen, setRuntimeMenuOpen] = useState(false);
  const [runtimeState, setRuntimeState] = useState(createHelixAskMinimalRuntimeInitialState);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const hydratedChatSessionRef = useRef<string | null>(null);
  const ensureContextSession = useAgiChatStore((state) => state.ensureContextSession);
  const addChatMessage = useAgiChatStore((state) => state.addMessage);
  const setActiveChatSession = useAgiChatStore((state) => state.setActive);
  const chatSession = useAgiChatStore((state) => (chatSessionId ? state.sessions[chatSessionId] : undefined));
  const turnRunner = runTurn ?? runHelixAskMinimalRuntimeBackendTurn;

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
          {runtimeState.askStatus ? (
            <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-cyan-100/80">
              {runtimeState.askStatus}
            </p>
          ) : null}
          <HelixAskMinimalRuntimeTurnList
            replies={runtimeState.replies}
            className={shellProps.replyListClassName ?? "relative z-10 mt-4 space-y-5"}
            controlActions={controlActions}
          />
        </section>
      }
    />
  );
}
