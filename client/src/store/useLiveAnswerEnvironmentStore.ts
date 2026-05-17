import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  LiveAnswerEnvironment,
  LiveAnswerEnvironmentDelta,
} from "@shared/helix-live-answer-environment";

export type LiveAnswerEnvironmentReadResponse = {
  ok: boolean;
  schema?: "helix.live_answer_environment_read.v1";
  environment?: LiveAnswerEnvironment | null;
  deltas?: LiveAnswerEnvironmentDelta[];
  source_descriptors?: Array<Record<string, unknown>>;
  schema_selection?: Record<string, unknown> | null;
  schema_compatibility?: Record<string, unknown> | null;
  debug?: {
    thread_id?: string | null;
    environment_id?: string | null;
    delta_count?: number;
    last_delta_id?: string | null;
    last_next_hash?: string | null;
    raw_transcript_included: false;
    raw_audio_included: false;
    deterministic_content_role: "observation_not_assistant_answer";
  };
};

export type LiveAnswerEnvironmentDiagnostics = {
  last_loaded_at?: string | null;
  last_fetch_error?: string | null;
  last_status?: "idle" | "loading" | "ok" | "error";
  stale?: boolean;
};

export type LiveAnswerEnvironmentState = {
  environmentByThread: Record<string, LiveAnswerEnvironment | null>;
  environmentById: Record<string, LiveAnswerEnvironment | null>;
  deltasByEnvironment: Record<string, LiveAnswerEnvironmentDelta[]>;
  latestReadByThread: Record<string, LiveAnswerEnvironmentReadResponse | null>;
  diagnosticsByThread: Record<string, LiveAnswerEnvironmentDiagnostics>;
  upsertReadResponse: (threadId: string, response: LiveAnswerEnvironmentReadResponse) => void;
  loadLiveAnswerEnvironment: (threadId: string, limit?: number) => Promise<void>;
  loadLiveAnswerEnvironmentById: (threadId: string, environmentId: string, limit?: number) => Promise<void>;
};

const uniqueDeltas = (deltas: LiveAnswerEnvironmentDelta[]): LiveAnswerEnvironmentDelta[] => {
  const byId = new Map<string, LiveAnswerEnvironmentDelta>();
  for (const delta of deltas) byId.set(delta.delta_id, delta);
  return Array.from(byId.values()).sort((a, b) => a.ts.localeCompare(b.ts)).slice(-80);
};

export const selectActiveLiveAnswerEnvironment = (
  state: LiveAnswerEnvironmentState,
  threadId: string,
): LiveAnswerEnvironment | null => state.environmentByThread[threadId] ?? null;

export const selectLiveAnswerEnvironmentById = (
  state: LiveAnswerEnvironmentState,
  environmentId?: string | null,
): LiveAnswerEnvironment | null => (environmentId ? state.environmentById[environmentId] ?? null : null);

export const selectLiveAnswerEnvironmentDeltas = (
  state: LiveAnswerEnvironmentState,
  environmentId?: string | null,
): LiveAnswerEnvironmentDelta[] => (environmentId ? state.deltasByEnvironment[environmentId] ?? [] : []);

export const useLiveAnswerEnvironmentStore = create<LiveAnswerEnvironmentState>()(
  persist(
    (set, get) => ({
      environmentByThread: {},
      environmentById: {},
      deltasByEnvironment: {},
      latestReadByThread: {},
      diagnosticsByThread: {},
      upsertReadResponse: (threadId, response) => {
        const environment = response.environment ?? null;
        set((state) => {
          const deltasByEnvironment = { ...state.deltasByEnvironment };
          if (environment) {
            deltasByEnvironment[environment.environment_id] = uniqueDeltas([
              ...(deltasByEnvironment[environment.environment_id] ?? []),
              ...(response.deltas ?? []),
            ]);
          }
          return {
            environmentByThread: {
              ...state.environmentByThread,
              [threadId]: environment,
            },
            environmentById: environment
              ? {
                  ...state.environmentById,
                  [environment.environment_id]: environment,
                }
              : state.environmentById,
            deltasByEnvironment,
            latestReadByThread: {
              ...state.latestReadByThread,
              [threadId]: response,
            },
            diagnosticsByThread: {
              ...state.diagnosticsByThread,
              [threadId]: {
                last_loaded_at: new Date().toISOString(),
                last_fetch_error: null,
                last_status: "ok",
                stale: false,
              },
            },
          };
        });
      },
      loadLiveAnswerEnvironment: async (threadId, limit = 30) => {
        set((state) => ({
          diagnosticsByThread: {
            ...state.diagnosticsByThread,
            [threadId]: {
              ...(state.diagnosticsByThread[threadId] ?? {}),
              last_status: "loading",
            },
          },
        }));
        try {
          const response = await fetch(
            `/api/agi/situation/live-answer-environment?thread_id=${encodeURIComponent(threadId)}&limit=${encodeURIComponent(String(limit))}`,
          );
          if (!response.ok) throw new Error(`live_answer_environment_read_failed:${response.status}`);
          get().upsertReadResponse(threadId, (await response.json()) as LiveAnswerEnvironmentReadResponse);
        } catch (error) {
          set((state) => ({
            diagnosticsByThread: {
              ...state.diagnosticsByThread,
              [threadId]: {
                ...(state.diagnosticsByThread[threadId] ?? {}),
                last_status: "error",
                last_fetch_error: error instanceof Error ? error.message : "live_answer_environment_read_failed",
                stale: true,
              },
            },
          }));
        }
      },
      loadLiveAnswerEnvironmentById: async (threadId, environmentId, limit = 30) => {
        set((state) => ({
          diagnosticsByThread: {
            ...state.diagnosticsByThread,
            [threadId]: {
              ...(state.diagnosticsByThread[threadId] ?? {}),
              last_status: "loading",
            },
          },
        }));
        try {
          const response = await fetch(
            `/api/agi/situation/live-answer-environment/${encodeURIComponent(environmentId)}?limit=${encodeURIComponent(String(limit))}`,
          );
          if (!response.ok) throw new Error(`live_answer_environment_read_failed:${response.status}`);
          get().upsertReadResponse(threadId, (await response.json()) as LiveAnswerEnvironmentReadResponse);
        } catch (error) {
          set((state) => ({
            diagnosticsByThread: {
              ...state.diagnosticsByThread,
              [threadId]: {
                ...(state.diagnosticsByThread[threadId] ?? {}),
                last_status: "error",
                last_fetch_error: error instanceof Error ? error.message : "live_answer_environment_read_failed",
                stale: true,
              },
            },
          }));
        }
      },
    }),
    {
      name: "helix-live-answer-environment-v1",
      version: 2,
      migrate: (persisted) => {
        const state = persisted && typeof persisted === "object"
          ? persisted as Partial<LiveAnswerEnvironmentState>
          : {};
        return {
          environmentByThread: state.environmentByThread ?? {},
          environmentById: state.environmentById ?? {},
          deltasByEnvironment: {},
          latestReadByThread: {},
          diagnosticsByThread: state.diagnosticsByThread ?? {},
        } as LiveAnswerEnvironmentState;
      },
      partialize: (state) => ({
        environmentByThread: state.environmentByThread,
        environmentById: state.environmentById,
        deltasByEnvironment: {},
        diagnosticsByThread: state.diagnosticsByThread,
      }),
    },
  ),
);
