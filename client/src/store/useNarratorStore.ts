import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import {
  NARRATOR_EVENT_SCHEMA,
  type NarratorEventV1,
  type NarratorSourceKind,
} from "@shared/contracts/narrator-event.v1";
import {
  DEFAULT_NARRATOR_SOURCE_POLICIES,
  decideNarratorDelivery,
  type NarratorSourcePolicy,
} from "@/lib/narrator/narratorPolicy";
import {
  buildNarratorDedupeKey,
  shouldDropNarratorDuplicate,
} from "@/lib/narrator/narratorDedupe";
import type { NarratorPlaybackDiagnostic } from "@/lib/narrator/narratorAudioPlayback";

export type NarratorDeliveryStatus = "visible" | "queued" | "suppressed" | "spoken" | "failed";

export type NarratorQueueState = {
  speaking: boolean;
  queuedEventIds: string[];
  suppressedEventIds: string[];
  lastSpokenByDedupeKey: Record<string, number>;
  lastSeenByDedupeKey: Record<string, number>;
  deliveryStatusByEventId: Record<string, NarratorDeliveryStatus>;
  playbackDiagnosticsByEventId: Record<string, NarratorPlaybackDiagnostic>;
};

export type PublishNarratorEventInput = Omit<
  NarratorEventV1,
  "schemaVersion" | "eventId" | "dedupeKey" | "createdAtMs"
> & {
  eventId?: string;
  dedupeKey?: string;
  createdAtMs?: number;
};

type NarratorState = {
  events: NarratorEventV1[];
  sourcePolicies: Record<NarratorSourceKind, NarratorSourcePolicy>;
  queueState: NarratorQueueState;
  publishEvent: (input: PublishNarratorEventInput, options?: { voiceArmed?: boolean; nowMs?: number }) => NarratorEventV1 | null;
  setSourcePolicy: (sourceKind: NarratorSourceKind, patch: Partial<NarratorSourcePolicy>) => void;
  markQueued: (eventId: string, diagnostic?: NarratorPlaybackDiagnostic) => void;
  markSpoken: (eventId: string, atMs?: number, diagnostic?: NarratorPlaybackDiagnostic) => void;
  markFailed: (eventId: string, diagnostic?: NarratorPlaybackDiagnostic) => void;
  recordPlaybackDiagnostic: (eventId: string, diagnostic: NarratorPlaybackDiagnostic) => void;
  clearFeed: () => void;
  resetPolicies: () => void;
};

const MAX_NARRATOR_EVENTS = 200;

const memoryStorage = (): StateStorage => {
  const values = new Map<string, string>();
  return {
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => {
      values.set(name, value);
    },
    removeItem: (name) => {
      values.delete(name);
    },
  };
};

const narratorStorage = createJSONStorage(() =>
  typeof localStorage === "undefined" ? memoryStorage() : localStorage,
);

const emptyQueueState = (): NarratorQueueState => ({
  speaking: false,
  queuedEventIds: [],
  suppressedEventIds: [],
  lastSpokenByDedupeKey: {},
  lastSeenByDedupeKey: {},
  deliveryStatusByEventId: {},
  playbackDiagnosticsByEventId: {},
});

function createNarratorEvent(input: PublishNarratorEventInput): NarratorEventV1 {
  const nowMs = input.createdAtMs ?? Date.now();
  const eventId = input.eventId ?? `narrator:event:${nowMs}:${Math.random().toString(36).slice(2, 8)}`;
  return {
    ...input,
    schemaVersion: NARRATOR_EVENT_SCHEMA,
    eventId,
    dedupeKey: input.dedupeKey ?? buildNarratorDedupeKey(input),
    createdAtMs: nowMs,
  };
}

function pushBounded(events: NarratorEventV1[], event: NarratorEventV1): NarratorEventV1[] {
  return [event, ...events].slice(0, MAX_NARRATOR_EVENTS);
}

export const useNarratorStore = create<NarratorState>()(
  persist(
    (set, get) => ({
      events: [],
      sourcePolicies: DEFAULT_NARRATOR_SOURCE_POLICIES,
      queueState: emptyQueueState(),
      publishEvent: (input, options) => {
        const event = createNarratorEvent(input);
        const state = get();
        const nowMs = options?.nowMs ?? Date.now();
        if (shouldDropNarratorDuplicate({
          event,
          lastSeenByDedupeKey: state.queueState.lastSeenByDedupeKey,
          nowMs,
        })) {
          return null;
        }
        const policy = state.sourcePolicies[event.sourceKind] ?? DEFAULT_NARRATOR_SOURCE_POLICIES[event.sourceKind];
        const decision = decideNarratorDelivery({
          event,
          policy,
          voiceArmed: options?.voiceArmed,
          lastSpokenAtMs: state.queueState.lastSpokenByDedupeKey[event.dedupeKey],
          nowMs,
        });
        const status: NarratorDeliveryStatus = decision.suppressed ? "suppressed" : "visible";
        set((current) => ({
          events: decision.mode === "hidden" ? current.events : pushBounded(current.events, event),
          queueState: {
            ...current.queueState,
            suppressedEventIds: decision.suppressed
              ? [...current.queueState.suppressedEventIds, event.eventId]
              : current.queueState.suppressedEventIds,
            lastSeenByDedupeKey: {
              ...current.queueState.lastSeenByDedupeKey,
              [event.dedupeKey]: nowMs,
            },
            deliveryStatusByEventId: {
              ...current.queueState.deliveryStatusByEventId,
              [event.eventId]: status,
            },
          },
        }));
        return event;
      },
      setSourcePolicy: (sourceKind, patch) =>
        set((current) => ({
          sourcePolicies: {
            ...current.sourcePolicies,
            [sourceKind]: {
              ...current.sourcePolicies[sourceKind],
              ...patch,
            },
          },
        })),
      markQueued: (eventId, diagnostic) =>
        set((current) => ({
          queueState: {
            ...current.queueState,
            queuedEventIds: current.queueState.queuedEventIds.includes(eventId)
              ? current.queueState.queuedEventIds
              : [...current.queueState.queuedEventIds, eventId],
            deliveryStatusByEventId: {
              ...current.queueState.deliveryStatusByEventId,
              [eventId]: "queued",
            },
            playbackDiagnosticsByEventId: diagnostic
              ? {
                  ...current.queueState.playbackDiagnosticsByEventId,
                  [eventId]: diagnostic,
                }
              : current.queueState.playbackDiagnosticsByEventId,
          },
        })),
      markSpoken: (eventId, atMs, diagnostic) =>
        set((current) => {
          const event = current.events.find((entry) => entry.eventId === eventId);
          return {
            queueState: {
              ...current.queueState,
              queuedEventIds: current.queueState.queuedEventIds.filter((id) => id !== eventId),
              lastSpokenByDedupeKey: event
                ? {
                    ...current.queueState.lastSpokenByDedupeKey,
                    [event.dedupeKey]: atMs ?? Date.now(),
                  }
                : current.queueState.lastSpokenByDedupeKey,
              deliveryStatusByEventId: {
                ...current.queueState.deliveryStatusByEventId,
                [eventId]: "spoken",
              },
              playbackDiagnosticsByEventId: diagnostic
                ? {
                    ...current.queueState.playbackDiagnosticsByEventId,
                    [eventId]: diagnostic,
                  }
                : current.queueState.playbackDiagnosticsByEventId,
            },
          };
        }),
      markFailed: (eventId, diagnostic) =>
        set((current) => ({
          queueState: {
            ...current.queueState,
            queuedEventIds: current.queueState.queuedEventIds.filter((id) => id !== eventId),
            deliveryStatusByEventId: {
              ...current.queueState.deliveryStatusByEventId,
              [eventId]: "failed",
            },
            playbackDiagnosticsByEventId: diagnostic
              ? {
                  ...current.queueState.playbackDiagnosticsByEventId,
                  [eventId]: diagnostic,
                }
              : current.queueState.playbackDiagnosticsByEventId,
          },
        })),
      recordPlaybackDiagnostic: (eventId, diagnostic) =>
        set((current) => ({
          queueState: {
            ...current.queueState,
            playbackDiagnosticsByEventId: {
              ...current.queueState.playbackDiagnosticsByEventId,
              [eventId]: diagnostic,
            },
          },
        })),
      clearFeed: () => set((current) => ({ events: [], queueState: { ...emptyQueueState(), lastSpokenByDedupeKey: current.queueState.lastSpokenByDedupeKey } })),
      resetPolicies: () => set({ sourcePolicies: DEFAULT_NARRATOR_SOURCE_POLICIES }),
    }),
    {
      name: "helix-narrator-store",
      storage: narratorStorage,
      partialize: (state) => ({ sourcePolicies: state.sourcePolicies }),
    },
  ),
);
