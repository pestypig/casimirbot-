import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, MessageSquarePlus, Trash2 } from "lucide-react";
import { WorkstationStage } from "@/components/workstation/WorkstationStage";
import { HelixAskDock } from "@/components/workstation/HelixAskDock";
import { WorkstationResizeRail } from "@/components/workstation/WorkstationResizeRail";
import {
  WORKSTATION_DOCK_MAX_WIDTH,
  WORKSTATION_DOCK_MIN_WIDTH,
  useWorkstationLayoutStore,
} from "@/store/useWorkstationLayoutStore";
import { useAgiChatStore, type ChatSession } from "@/store/useAgiChatStore";
import { useHelixAskWorkspaceSessionStore } from "@/store/useHelixAskWorkspaceSessionStore";
import {
  listHelixAskChatSessions,
  resolveActiveHelixAskSession,
} from "@/lib/helix/helixAskChatSessions";
import { deleteChatSession } from "@/lib/agi/api";
import { HELIX_ASK_CONTEXT_ID } from "@/lib/helix/voice-surface-contract";
import type { PanelDefinition } from "@/lib/desktop/panelRegistry";

const HELIX_CONVERSATION_TRACE_PANEL_ID = "workstation-workflow-timeline";
const HELIX_CHAT_CONTEXT_PREFIX = "helix-ask-chat:";

function formatSessionDate(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  return new Date(parsed).toLocaleString();
}

function titleFromSession(session?: ChatSession): string {
  if (!session) return "New chat";
  const firstUserMessage = session.messages.find((message) => message.role === "user");
  const source = firstUserMessage?.content.trim() || session.title.trim() || "New chat";
  const compact = source.replace(/\s+/g, " ");
  return compact.length > 72 ? `${compact.slice(0, 69)}...` : compact;
}

const clampDockWidth = (value: number) =>
  Math.max(WORKSTATION_DOCK_MIN_WIDTH, Math.min(WORKSTATION_DOCK_MAX_WIDTH, Math.round(value)));

export function HelixWorkstationShell({
  onOpenPanel,
  layoutVariant = "desktop",
}: {
  onOpenPanel: (panelId: PanelDefinition["id"]) => void;
  layoutVariant?: "desktop" | "mobile";
}) {
  const chatDock = useWorkstationLayoutStore((state) => state.chatDock);
  const setChatDockWidth = useWorkstationLayoutStore((state) => state.setChatDockWidth);
  const captureLayoutSnapshot = useWorkstationLayoutStore((state) => state.captureLayoutSnapshot);
  const applyLayoutSnapshot = useWorkstationLayoutStore((state) => state.applyLayoutSnapshot);
  const saveLayoutSnapshot = useHelixAskWorkspaceSessionStore((state) => state.saveLayoutSnapshot);
  const readLayoutSnapshot = useHelixAskWorkspaceSessionStore((state) => state.readLayoutSnapshot);
  const removeLayoutSnapshot = useHelixAskWorkspaceSessionStore((state) => state.removeLayoutSnapshot);
  const sessions = useAgiChatStore((state) => state.sessions);
  const activeChatId = useAgiChatStore((state) => state.activeId);
  const newSession = useAgiChatStore((state) => state.newSession);
  const setActiveChat = useAgiChatStore((state) => state.setActive);
  const deleteLocalSession = useAgiChatStore((state) => state.deleteSession);
  const ensureContextSession = useAgiChatStore((state) => state.ensureContextSession);
  const [sessionListOpen, setSessionListOpen] = useState(false);
  const [mobileSurface, setMobileSurface] = useState<"ask" | "workstation">("ask");
  const [resizePreviewWidth, setResizePreviewWidth] = useState<number | null>(null);
  const resizeStartWidthRef = useRef(chatDock.widthPx);

  const handleOpenConversation = useCallback(
    (_sessionId: string) => {
      onOpenPanel(HELIX_CONVERSATION_TRACE_PANEL_ID);
    },
    [onOpenPanel],
  );

  const handleMobileOpenPanel = useCallback(
    (panelId: PanelDefinition["id"]) => {
      onOpenPanel(panelId);
      setMobileSurface("workstation");
    },
    [onOpenPanel],
  );

  const handleMobileOpenConversation = useCallback(
    (sessionId: string) => {
      handleOpenConversation(sessionId);
      setMobileSurface("workstation");
    },
    [handleOpenConversation],
  );

  const helixSessions = useMemo(() => listHelixAskChatSessions(sessions), [sessions]);
  const activeSession = useMemo(
    () => resolveActiveHelixAskSession(sessions, activeChatId),
    [activeChatId, sessions],
  );
  const activeContextId = activeSession?.contextId ?? HELIX_ASK_CONTEXT_ID.desktop;
  const activeTitle = titleFromSession(activeSession);

  useEffect(() => {
    if (activeSession?.id && activeSession.id !== activeChatId) {
      setActiveChat(activeSession.id);
      return;
    }
    if (activeSession?.contextId) return;
    const fallbackId = ensureContextSession(HELIX_ASK_CONTEXT_ID.desktop, "New chat");
    if (fallbackId) {
      setActiveChat(fallbackId);
    }
  }, [activeChatId, activeSession?.contextId, activeSession?.id, ensureContextSession, setActiveChat]);

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      if (activeSession?.id) {
        saveLayoutSnapshot(activeSession.id, captureLayoutSnapshot());
      }
      const snapshot = readLayoutSnapshot(sessionId);
      if (snapshot) {
        applyLayoutSnapshot(snapshot);
      }
      setActiveChat(sessionId);
      setSessionListOpen(false);
    },
    [activeSession?.id, applyLayoutSnapshot, captureLayoutSnapshot, readLayoutSnapshot, saveLayoutSnapshot, setActiveChat],
  );

  const handleCreateSession = useCallback(() => {
    if (activeSession?.id) {
      saveLayoutSnapshot(activeSession.id, captureLayoutSnapshot());
    }
    const id = newSession("New chat", `${HELIX_CHAT_CONTEXT_PREFIX}${crypto.randomUUID()}`);
    setActiveChat(id);
    setSessionListOpen(false);
  }, [activeSession?.id, captureLayoutSnapshot, newSession, saveLayoutSnapshot, setActiveChat]);

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      const target = sessions[sessionId];
      if (!target) return;
      const title = titleFromSession(target);
      const confirmed =
        typeof window === "undefined" ||
        window.confirm(`Delete "${title}"? This removes the saved chat from this browser and from the synced chat store when available.`);
      if (!confirmed) return;

      const nextSession = helixSessions.find((session) => session.id !== sessionId) ?? null;
      deleteLocalSession(sessionId);
      removeLayoutSnapshot(sessionId);
      void deleteChatSession(sessionId).catch((error) => {
        console.warn("[HelixWorkstationShell] synced chat delete failed", error);
      });

      if (sessionId !== activeSession?.id) return;
      if (nextSession) {
        const snapshot = readLayoutSnapshot(nextSession.id);
        if (snapshot) {
          applyLayoutSnapshot(snapshot);
        }
        setActiveChat(nextSession.id);
        return;
      }
      const id = newSession("New chat", `${HELIX_CHAT_CONTEXT_PREFIX}${crypto.randomUUID()}`);
      setActiveChat(id);
    },
    [
      activeSession?.id,
      applyLayoutSnapshot,
      deleteLocalSession,
      helixSessions,
      newSession,
      readLayoutSnapshot,
      removeLayoutSnapshot,
      sessions,
      setActiveChat,
    ],
  );

  const visibleWidth = chatDock.collapsed ? 56 : resizePreviewWidth ?? chatDock.widthPx;

  if (layoutVariant === "mobile") {
    const showingWorkstation = mobileSurface === "workstation";
    return (
      <div
        className="relative z-10 h-full min-h-0 w-full overflow-hidden"
      >
        <section
          aria-hidden={showingWorkstation}
          className={`absolute inset-0 min-h-0 transform-gpu transition-transform duration-300 ease-out ${
            showingWorkstation ? "-translate-x-full" : "translate-x-0"
          }`}
        >
          <HelixAskDock
            widthPx="100%"
            collapsed={false}
            contextId={activeContextId}
            placement="bottom"
            onOpenPanel={handleMobileOpenPanel}
            onOpenConversation={handleMobileOpenConversation}
          />
        </section>

        <section
          aria-hidden={!showingWorkstation}
          className={`absolute inset-0 min-h-0 transform-gpu bg-slate-950 transition-transform duration-300 ease-out ${
            showingWorkstation ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <WorkstationStage layoutVariant="mobile" />
        </section>

        {!showingWorkstation ? (
          <button
            type="button"
            aria-label="Open workstation"
            title="Open workstation"
            onClick={() => setMobileSurface("workstation")}
            className="absolute left-0 top-1/2 z-40 inline-flex h-24 w-11 -translate-y-1/2 items-center justify-center rounded-r-full border border-l-0 border-cyan-300/40 bg-slate-950/90 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.24)] backdrop-blur transition hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.98]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Open Helix Ask"
            title="Open Helix Ask"
            onClick={() => setMobileSurface("ask")}
            className="absolute right-0 top-1/2 z-40 inline-flex h-24 w-11 -translate-y-1/2 items-center justify-center rounded-l-full border border-r-0 border-cyan-300/40 bg-slate-950/90 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.24)] backdrop-blur transition hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.98]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative z-10 grid h-full min-h-0 w-full"
      style={{
        gridTemplateColumns: `minmax(0, 1fr) 0.375rem ${visibleWidth}px`,
        gridTemplateRows: "3.5rem minmax(0, 1fr)",
      }}
    >
      <div className="col-start-1 col-end-3 row-start-1 flex min-w-0 items-center gap-3 border-b border-white/10 bg-slate-950/72 px-3 backdrop-blur">
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => setSessionListOpen((open) => !open)}
            aria-label={sessionListOpen ? "Return to current Helix Ask chat" : "Open Helix Ask chats"}
            title={sessionListOpen ? "Return to current Helix Ask chat" : "Open Helix Ask chats"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
          >
            {sessionListOpen ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          </button>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{activeTitle}</p>
          <p className="truncate text-[11px] uppercase tracking-[0.16em] text-slate-500">
            Helix Ask session
          </p>
        </div>
      </div>
      <div className="relative col-start-1 row-start-2 h-full min-h-0 min-w-0">
        <WorkstationStage />
        {sessionListOpen ? (
          <div className="absolute inset-0 z-30 overflow-hidden bg-slate-950/82 backdrop-blur-md">
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Helix Ask chats</p>
                  <p className="text-xs text-slate-400">Switch sessions with saved chat context and workstation orientation.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateSession}
                  className="inline-flex items-center gap-2 rounded border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-500/20"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  New chat
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <div className="space-y-2">
                  {helixSessions.map((session) => {
                    const selected = session.id === activeSession?.id;
                    return (
                      <div
                        key={session.id}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                          selected
                            ? "border-cyan-400/50 bg-cyan-500/15"
                            : "border-white/10 bg-black/25"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectSession(session.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-sm font-medium text-slate-100">
                            {titleFromSession(session)}
                          </p>
                          <p className="mt-1 truncate text-[11px] text-slate-500">
                            {session.messages.length} message{session.messages.length === 1 ? "" : "s"} - {formatSessionDate(session.updatedAt)}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectSession(session.id)}
                          aria-label={`Open ${titleFromSession(session)}`}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          aria-label={`Delete ${titleFromSession(session)}`}
                          title="Delete chat"
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rose-300/20 bg-rose-500/10 text-rose-100 hover:border-rose-200/50 hover:bg-rose-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                  {helixSessions.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-white/15 bg-black/20 p-4 text-sm text-slate-400">
                      No Helix Ask chats yet.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <div className="col-start-2 row-start-2 h-full min-h-0">
        <WorkstationResizeRail
          onResizeStart={() => {
            if (chatDock.collapsed) return;
            resizeStartWidthRef.current = chatDock.widthPx;
            setResizePreviewWidth(chatDock.widthPx);
          }}
          onResizePreview={(deltaX) => {
            if (chatDock.collapsed) return;
            setResizePreviewWidth(clampDockWidth(resizeStartWidthRef.current + deltaX));
          }}
          onResizeCommit={(deltaX) => {
            if (chatDock.collapsed) {
              setResizePreviewWidth(null);
              return;
            }
            const nextWidth = clampDockWidth(resizeStartWidthRef.current + deltaX);
            setResizePreviewWidth(null);
            setChatDockWidth(nextWidth);
          }}
          onResizeCancel={() => {
            setResizePreviewWidth(null);
          }}
        />
      </div>
      <div className="col-start-3 row-span-2 row-start-1 h-full min-h-0">
        <HelixAskDock
          widthPx={visibleWidth}
          collapsed={chatDock.collapsed}
          contextId={activeContextId}
          onOpenPanel={onOpenPanel}
          onOpenConversation={handleOpenConversation}
        />
      </div>
    </div>
  );
}
