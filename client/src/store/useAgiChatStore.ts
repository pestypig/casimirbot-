import { createWithEqualityFn } from "zustand/traditional";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ChatMessage, ChatRole, ChatSession } from "@shared/agi-chat";
import { useWorkspaceMemoryRegistryStore } from "@/store/useWorkspaceMemoryRegistryStore";

export type { ChatMessage, ChatRole, ChatSession };

interface AgiChatStore {
  sessions: Record<string, ChatSession>;
  activeId?: string;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  newSession: (title?: string, contextId?: string) => string;
  setActive: (id: string) => void;
  addMessage: (
    sessionId: string,
    msg: Omit<ChatMessage, "id" | "at" | "tokens"> & { tokens?: number }
  ) => ChatMessage;
  ensureContextSession: (contextId: string, title?: string) => string;
  getThreadForContext: (contextId: string | null) => ChatSession | undefined;
  addContextMessage: (
    contextId: string,
    msg: Omit<ChatMessage, "id" | "at" | "tokens"> & { tokens?: number },
    title?: string
  ) => ChatMessage | null;
  setPersona: (sessionId: string, personaId: string) => void;
  clearSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, title: string) => void;
  mergeSessions: (incoming: ChatSession[]) => void;
  totals: (sessionId: string) => { tokens: number; messages: number };
}

export const estimateTokens = (text: string) => {
  const rough = Math.ceil(text.trim().length / 4);
  return Math.max(1, rough);
};

const rawBudget = Number(import.meta.env?.VITE_CHAT_CONTEXT_BUDGET_TOKENS ?? 8192);

export const CHAT_CONTEXT_BUDGET =
  Number.isFinite(rawBudget) && rawBudget > 0 ? Math.floor(rawBudget) : 8192;

export const AGI_CHAT_STORAGE_KEY = "agi-chat-sessions-v1";
const DEFAULT_CHAT_TITLES = new Set(["New chat", "Helix Ask"]);
const AGI_CHAT_MAX_PERSISTED_SESSIONS = 18;
const AGI_CHAT_MAX_PERSISTED_MESSAGES_PER_SESSION = 80;
const AGI_CHAT_MAX_PERSISTED_CONTENT_CHARS = 12_000;
const AGI_CHAT_MAX_PERSISTED_HELIX_ASK_CHARS = 6_000;
const AGI_CHAT_MAX_STORAGE_CHARS = 1_500_000;
const AGI_CHAT_MIN_STORAGE_CHARS = 220_000;

function titleFromFirstMessage(content: string): string {
  const normalized = content.trim().replace(/\s+/g, " ");
  if (!normalized) return "New chat";
  return normalized.length > 64 ? `${normalized.slice(0, 61)}...` : normalized;
}

function registerChatMemoryArtifact(session: ChatSession) {
  useWorkspaceMemoryRegistryStore.getState().upsertArtifact({
    artifact_id: `helix-chat-session:${session.id}`,
    artifact_type: "helix_chat_session",
    storage_key: AGI_CHAT_STORAGE_KEY,
    storage_backend: "localStorage",
    owner_scope: "browser_guest",
    sync_status: "profile_candidate",
    chat_session_id: session.id,
    title: session.title,
    updated_at: session.updatedAt,
  });
}

function scoreTimestamp(value?: string): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function truncatePersistedText(value: string, limit: number): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, Math.max(0, limit - 48))}\n...[truncated ${value.length - limit} chars for saved chat copy]`;
}

function clampUnknownForStorage(value: unknown, limit: number): unknown {
  if (!value || typeof value !== "object") return value;
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length <= limit) return value;
    return {
      truncated: true,
      storage_note: "large Helix Ask metadata omitted from browser-saved chat copy",
      original_char_length: serialized.length,
      preview: serialized.slice(0, limit),
    };
  } catch {
    return {
      truncated: true,
      storage_note: "unserializable Helix Ask metadata omitted from browser-saved chat copy",
    };
  }
}

function normalizeMessageForStorage(message: ChatMessage, contentLimit = AGI_CHAT_MAX_PERSISTED_CONTENT_CHARS): ChatMessage {
  return {
    ...message,
    content: truncatePersistedText(message.content ?? "", contentLimit),
    tokens: message.tokens ?? estimateTokens(message.content ?? ""),
    helixAsk: clampUnknownForStorage(message.helixAsk, AGI_CHAT_MAX_PERSISTED_HELIX_ASK_CHARS) as ChatMessage["helixAsk"],
  };
}

function normalizeSessionForStorage(
  session: ChatSession,
  messageLimit = AGI_CHAT_MAX_PERSISTED_MESSAGES_PER_SESSION,
  contentLimit = AGI_CHAT_MAX_PERSISTED_CONTENT_CHARS,
): ChatSession {
  const messages = session.messages ?? [];
  const persistedMessages = messages
    .slice(Math.max(0, messages.length - messageLimit))
    .map((message) => normalizeMessageForStorage(message, contentLimit));
  return {
    ...session,
    messages: persistedMessages,
    messageCount: messages.length,
  };
}

function buildPersistedChatState(state: Pick<AgiChatStore, "sessions" | "activeId">) {
  const sessions = Object.values(state.sessions ?? {})
    .sort((left, right) => {
      if (left.id === state.activeId) return -1;
      if (right.id === state.activeId) return 1;
      return scoreTimestamp(right.updatedAt ?? right.createdAt) - scoreTimestamp(left.updatedAt ?? left.createdAt);
    })
    .slice(0, AGI_CHAT_MAX_PERSISTED_SESSIONS)
    .map((session) => normalizeSessionForStorage(session));
  return {
    sessions: Object.fromEntries(sessions.map((session) => [session.id, session])),
    activeId: state.activeId,
  };
}

function clampPersistedChatEnvelope(envelope: unknown, targetChars = AGI_CHAT_MAX_STORAGE_CHARS): unknown {
  const record = envelope && typeof envelope === "object"
    ? envelope as { state?: { sessions?: Record<string, ChatSession>; activeId?: string } }
    : null;
  const sourceState = {
    sessions: record?.state?.sessions ?? {},
    activeId: record?.state?.activeId,
  };
  let messageLimit = Math.min(AGI_CHAT_MAX_PERSISTED_MESSAGES_PER_SESSION, 40);
  let contentLimit = Math.min(AGI_CHAT_MAX_PERSISTED_CONTENT_CHARS, 6_000);
  let sessionLimit = Math.min(AGI_CHAT_MAX_PERSISTED_SESSIONS, 12);
  let next = {
    ...(record ?? {}),
    state: {
      ...buildPersistedChatState(sourceState),
    },
  };
  while (JSON.stringify(next).length > targetChars && targetChars >= AGI_CHAT_MIN_STORAGE_CHARS) {
    const sessions = Object.values(sourceState.sessions)
      .sort((left, right) => {
        if (left.id === sourceState.activeId) return -1;
        if (right.id === sourceState.activeId) return 1;
        return scoreTimestamp(right.updatedAt ?? right.createdAt) - scoreTimestamp(left.updatedAt ?? left.createdAt);
      })
      .slice(0, sessionLimit)
      .map((session) => normalizeSessionForStorage(session, messageLimit, contentLimit));
    next = {
      ...(record ?? {}),
      state: {
        sessions: Object.fromEntries(sessions.map((session) => [session.id, session])),
        activeId: sourceState.activeId,
      },
    };
    if (JSON.stringify(next).length <= targetChars) break;
    if (messageLimit > 8) {
      messageLimit = Math.max(8, Math.floor(messageLimit / 2));
      continue;
    }
    if (contentLimit > 1_500) {
      contentLimit = Math.max(1_500, Math.floor(contentLimit / 2));
      continue;
    }
    if (sessionLimit > 2) {
      sessionLimit = Math.max(2, Math.floor(sessionLimit / 2));
      continue;
    }
    break;
  }
  return next;
}

const safeAgiChatStorage = createJSONStorage<Pick<AgiChatStore, "sessions" | "activeId">>(() => ({
  getItem: (name) => {
    try {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(name);
    } catch (error) {
      console.warn("[agi-chat] localStorage read failed", error);
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(name, value);
    } catch (error) {
      try {
        if (typeof window === "undefined") return;
        const parsed = JSON.parse(value);
        const clamped = JSON.stringify(clampPersistedChatEnvelope(parsed));
        window.localStorage.setItem(name, clamped);
        console.warn("[agi-chat] saved chat copy was truncated after storage quota pressure", error);
      } catch (secondError) {
        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(name, JSON.stringify(clampPersistedChatEnvelope(JSON.parse(value), AGI_CHAT_MIN_STORAGE_CHARS)));
          }
        } catch {
          console.warn("[agi-chat] localStorage write skipped after quota pressure", secondError);
        }
      }
    }
  },
  removeItem: (name) => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(name);
    } catch (error) {
      console.warn("[agi-chat] localStorage remove failed", error);
    }
  },
}));

export const useAgiChatStore = createWithEqualityFn<AgiChatStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      activeId: undefined,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      newSession: (title?: string, contextId?: string) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const session: ChatSession = {
          id,
          title: title ?? "New chat",
          createdAt: now,
          updatedAt: now,
          personaId: "default",
          contextId,
          messages: []
        };
        set((state) => ({
          sessions: { ...state.sessions, [id]: session },
          activeId: id
        }));
        registerChatMemoryArtifact(session);
        return id;
      },
      setActive: (id: string) => set({ activeId: id }),
      addMessage: (sessionId, partial) => {
        const complete: ChatMessage = {
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          tokens: partial.tokens ?? estimateTokens(partial.content),
          ...partial
        };
        set((state) => {
          const target = state.sessions[sessionId];
          if (!target) return state;
          const updatedSession = {
            ...target,
            title:
              partial.role === "user" &&
              target.messages.length === 0 &&
              (DEFAULT_CHAT_TITLES.has(target.title) || target.title === target.contextId)
                ? titleFromFirstMessage(partial.content)
                : target.title,
            messages: [...target.messages, complete],
            updatedAt: complete.at
          };
          registerChatMemoryArtifact(updatedSession);
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: updatedSession
            }
          };
        });
        return complete;
      },
      ensureContextSession: (contextId, title) => {
        const key = contextId?.trim();
        if (!key) {
          return "";
        }
        const existing = Object.values(get().sessions).find((session) => session.contextId === key);
        if (existing) {
          return existing.id;
        }
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const session: ChatSession = {
          id,
          title: title ?? key,
          createdAt: now,
          updatedAt: now,
          personaId: "default",
          contextId: key,
          messages: []
        };
        set((state) => ({
          sessions: { ...state.sessions, [id]: session }
        }));
        registerChatMemoryArtifact(session);
        return id;
      },
      getThreadForContext: (contextId) => {
        if (!contextId) return undefined;
        const key = contextId.trim();
        if (!key) return undefined;
        return Object.values(get().sessions).find((session) => session.contextId === key);
      },
      addContextMessage: (contextId, partial, title) => {
        if (!contextId?.trim()) {
          return null;
        }
        const id = get().ensureContextSession(contextId.trim(), title);
        if (!id) {
          return null;
        }
        return get().addMessage(id, partial);
      },
      setPersona: (sessionId, personaId) =>
        set((state) => {
          const target = state.sessions[sessionId];
          if (!target) return state;
          const updatedAt = new Date().toISOString();
          const updatedSession = { ...target, personaId, updatedAt };
          registerChatMemoryArtifact(updatedSession);
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: updatedSession
            }
          };
        }),
      clearSession: (sessionId) =>
        set((state) => {
          const target = state.sessions[sessionId];
          if (!target) return state;
          const updatedAt = new Date().toISOString();
          const updatedSession = { ...target, messages: [], updatedAt };
          registerChatMemoryArtifact(updatedSession);
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: updatedSession
            }
          };
        }),
      deleteSession: (sessionId) =>
        set((state) => {
          if (!state.sessions[sessionId]) return state;
          const nextSessions = { ...state.sessions };
          delete nextSessions[sessionId];
          useWorkspaceMemoryRegistryStore.getState().removeArtifact(`helix-chat-session:${sessionId}`);
          useWorkspaceMemoryRegistryStore.getState().removeArtifact(`helix-chat-layout:${sessionId}`);
          const nextActive =
            state.activeId === sessionId ? Object.keys(nextSessions)[0] : state.activeId;
          return {
            sessions: nextSessions,
            activeId: nextActive
          };
        }),
      renameSession: (sessionId, title) =>
        set((state) => {
          const target = state.sessions[sessionId];
          if (!target) return state;
          const updatedAt = new Date().toISOString();
          const updatedSession = { ...target, title, updatedAt };
          registerChatMemoryArtifact(updatedSession);
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: updatedSession
            }
          };
        }),
      mergeSessions: (incoming) =>
        set((state) => {
          if (!incoming || incoming.length === 0) {
            return state;
          }
          const sessions = { ...state.sessions };
          let activeId = state.activeId;
          const scoreTimestamp = (value?: string) => {
            if (!value) return 0;
            const parsed = Date.parse(value);
            return Number.isFinite(parsed) ? parsed : 0;
          };
          for (const session of incoming) {
            const existing = sessions[session.id];
            if (!existing) {
              sessions[session.id] = session;
              registerChatMemoryArtifact(session);
              activeId = activeId ?? session.id;
              continue;
            }
            const existingStamp = scoreTimestamp(existing.updatedAt ?? existing.createdAt);
            const incomingStamp = scoreTimestamp(session.updatedAt ?? session.createdAt);
            if (incomingStamp >= existingStamp) {
              const incomingMessages = session.messages ?? [];
              const hasIncomingMessages = incomingMessages.length > 0;
              const hasZeroCount =
                typeof session.messageCount === "number" &&
                session.messageCount === 0;
              sessions[session.id] = {
                ...existing,
                ...session,
                messages:
                  hasIncomingMessages || hasZeroCount
                    ? incomingMessages
                    : existing.messages
              };
              registerChatMemoryArtifact(sessions[session.id]);
            }
          }
          return { sessions, activeId };
        }),
      totals: (sessionId) => {
        const sess = get().sessions[sessionId];
        if (!sess) return { tokens: 0, messages: 0 };
        const tokens = sess.messages.reduce(
          (sum, m) => sum + (m.tokens ?? 0),
          0,
        );
        return { tokens, messages: sess.messages.length };
      }
    }),
    {
      name: AGI_CHAT_STORAGE_KEY,
      storage: safeAgiChatStorage,
      partialize: buildPersistedChatState,
      onRehydrateStorage: () => (state) => {
        Object.values(state?.sessions ?? {}).forEach(registerChatMemoryArtifact);
        state?.setHydrated(true);
      },
    }
  )
);
