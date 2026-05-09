import { create, type StateCreator } from "zustand";
import {
  createPrimeSeriesState,
  nextPrimeSeriesTick,
  type PrimeSeriesState,
  type PrimeSeriesTick,
} from "@/lib/scientific-calculator/liveSeries";

type StartPrimeStreamInput = {
  environmentId?: string | null;
  sourceId?: string | null;
  tickRateMs?: number;
  maxTicks?: number;
  start?: number;
};

type CalculatorLiveSourceState = {
  status: "idle" | "active" | "stopped" | "error";
  sourceId: string;
  environmentId: string | null;
  tickRateMs: number;
  maxTicks: number;
  state: PrimeSeriesState;
  latestTick: PrimeSeriesTick | null;
  debugLog: string[];
  startPrimeStream: (input?: StartPrimeStreamInput) => Promise<void>;
  stopPrimeStream: () => void;
  restartPrimeStream: () => Promise<void>;
  emitNextTick: () => Promise<void>;
  copyDebugLog: () => string;
};

let timer: ReturnType<typeof setInterval> | null = null;
let lastStartInput: StartPrimeStreamInput = {};

const DEFAULT_SOURCE_ID = "source:calculator-prime-stream";

const resolveEnvironmentId = async (): Promise<string | null> => {
  if (typeof fetch !== "function") return null;
  try {
    const response = await fetch("/api/agi/situation/live-answer-environment?thread_id=helix-ask:desktop&limit=1");
    if (!response.ok) return null;
    const body = await response.json() as { environment?: { environment_id?: string; preset?: string } | null };
    return body.environment?.environment_id ?? null;
  } catch {
    return null;
  }
};

const postTick = async (args: {
  sourceId: string;
  environmentId: string | null;
  tick: PrimeSeriesTick;
}) => {
  if (typeof fetch !== "function") return null;
  const response = await fetch("/api/agi/situation/live-source/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_id: args.sourceId,
      environment_id: args.environmentId,
      kind: "calculator_series",
      source_family: "calculator_stream",
      panel_id: "scientific-calculator",
      event_type: args.tick.event_type,
      seq: args.tick.state.seq,
      tick_index: args.tick.state.seq,
      payload: args.tick.payload,
      trace: args.tick.trace,
      evidence_refs: [`calculator:prime:${args.tick.payload.candidate}`],
    }),
  });
  return response.ok ? response.json() : null;
};

const postSourceLifecycle = async (
  sourceId: string,
  action: "resume" | "stop" | "reset-counters" | "tick-rate",
  body?: Record<string, unknown>,
) => {
  if (typeof fetch !== "function") return null;
  const response = await fetch(`/api/agi/situation/live-source/${encodeURIComponent(sourceId)}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.ok ? response.json() : null;
};

const createCalculatorLiveSourceState: StateCreator<CalculatorLiveSourceState> = (set, get) => ({
  status: "idle",
  sourceId: DEFAULT_SOURCE_ID,
  environmentId: null,
  tickRateMs: 1000,
  maxTicks: 100,
  state: createPrimeSeriesState({ start: 2 }),
  latestTick: null,
  debugLog: [],
  startPrimeStream: async (input = {}) => {
    get().stopPrimeStream();
    lastStartInput = input;
    const environmentId = input.environmentId ?? await resolveEnvironmentId();
    const tickRateMs = Math.max(250, Math.floor(input.tickRateMs ?? 1000));
    const maxTicks = Math.max(1, Math.floor(input.maxTicks ?? 100));
    const sourceId = input.sourceId ?? DEFAULT_SOURCE_ID;
    void postSourceLifecycle(sourceId, "reset-counters");
    void postSourceLifecycle(sourceId, "tick-rate", { tick_rate_ms: tickRateMs });
    void postSourceLifecycle(sourceId, "resume");
    set({
      status: "active",
      sourceId,
      environmentId,
      tickRateMs,
      maxTicks,
      state: createPrimeSeriesState({ start: input.start ?? 2 }),
      latestTick: null,
      debugLog: [`Prime stream started at ${new Date().toISOString()}`],
    });
    await get().emitNextTick();
    timer = setInterval(() => {
      void get().emitNextTick();
    }, tickRateMs);
  },
  stopPrimeStream: () => {
    if (timer) clearInterval(timer);
    timer = null;
    void postSourceLifecycle(get().sourceId, "stop");
    set((state: CalculatorLiveSourceState) => ({
      status: state.status === "active" ? "stopped" : state.status,
      debugLog: [`Prime stream stopped at ${new Date().toISOString()}`, ...state.debugLog].slice(0, 120),
    }));
  },
  restartPrimeStream: async () => {
    await get().startPrimeStream(lastStartInput);
  },
  emitNextTick: async () => {
    const current = get();
    if (current.status !== "active") return;
    if (current.state.seq >= current.maxTicks) {
      get().stopPrimeStream();
      return;
    }
    const tick = nextPrimeSeriesTick(current.state);
    set((state: CalculatorLiveSourceState) => ({
      state: tick.state,
      latestTick: tick,
      debugLog: [
        `${tick.event_type} candidate=${tick.payload.candidate} prime=${tick.payload.is_prime}`,
        ...state.debugLog,
      ].slice(0, 120),
    }));
    try {
      await postTick({
        sourceId: current.sourceId,
        environmentId: current.environmentId,
        tick,
      });
    } catch (error) {
      set((state: CalculatorLiveSourceState) => ({
        status: "error",
        debugLog: [`emit failed: ${error instanceof Error ? error.message : "unknown"}`, ...state.debugLog].slice(0, 120),
      }));
    }
  },
  copyDebugLog: () => get().debugLog.join("\n"),
});

export const useScientificCalculatorLiveSourceStore = create<CalculatorLiveSourceState>()(
  createCalculatorLiveSourceState,
);
