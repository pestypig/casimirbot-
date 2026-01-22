import { createWithEqualityFn } from "zustand/traditional";
import { persist } from "zustand/middleware";
import type { ChatMessage, ChatRole, ChatSession } from "@shared/agi-chat";

export type { ChatMessage, ChatRole, ChatSession };

interface AgiChatStore {
  sessions: Record<string, ChatSession>;
  activeId?: string;
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

const STORAGE_KEY = "agi-chat-sessions-v1";

export const useAgiChatStore = createWithEqualityFn<AgiChatStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      activeId: undefined,
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
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...target,
                messages: [...target.messages, complete],
                updatedAt: complete.at
              }
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
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: { ...target, personaId, updatedAt }
            }
          };
        }),
      clearSession: (sessionId) =>
        set((state) => {
          const target = state.sessions[sessionId];
          if (!target) return state;
          const updatedAt = new Date().toISOString();
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: { ...target, messages: [], updatedAt }
            }
          };
        }),
      deleteSession: (sessionId) =>
        set((state) => {
          if (!state.sessions[sessionId]) return state;
          const nextSessions = { ...state.sessions };
          delete nextSessions[sessionId];
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
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: { ...target, title, updatedAt }
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
    { name: STORAGE_KEY }
  )
);
