import type { RuntimeDegradeStep } from "./frame-contract";

export type RuntimeBudgetSignals = {
  clockA_p95_ms: number;
  tool_calls_last_tick: number;
  kv_tokens: number;
  queue_depth: number;
  lane_pressure: Record<string, number>;
};

export type RuntimeBudgetState = {
  level: "OK" | "WARNING" | "OVER";
  signals: RuntimeBudgetSignals;
  recommend: RuntimeDegradeStep;
};

const maxLanePressure = (lanePressure: Record<string, number>): number => {
  const values = Object.values(lanePressure).filter((value) => Number.isFinite(value));
  if (values.length === 0) return 0;
  return Math.max(...values);
};

export const evaluateRuntimeBudgetState = (input: {
  clockAP95Ms: number;
  clockABudgetMs: number;
  toolCallsLastTick: number;
  maxToolCalls: number;
  kvTokens: number;
  kvMaxTokens: number;
  queueDepth: number;
  queueMaxDepth: number;
  lanePressure: Record<string, number>;
}): RuntimeBudgetState => {
  const pressure = {
    clock: input.clockAP95Ms / Math.max(1, input.clockABudgetMs),
    tools: input.toolCallsLastTick / Math.max(1, input.maxToolCalls),
    kv: input.kvTokens / Math.max(1, input.kvMaxTokens),
    queue: input.queueDepth / Math.max(1, input.queueMaxDepth),
    lane: maxLanePressure(input.lanePressure),
  };

  const top = Math.max(pressure.clock, pressure.tools, pressure.kv, pressure.queue, pressure.lane);

  let level: RuntimeBudgetState["level"] = "OK";
  let recommend: RuntimeDegradeStep = "none";
  if (top >= 1) {
    level = "OVER";
    if (pressure.clock >= 1 || pressure.tools >= 1) {
      recommend = "reduce_output_tokens";
    } else if (pressure.queue >= 1 || pressure.lane >= 1) {
      recommend = "queue_deep_work";
    } else if (pressure.kv >= 1) {
      recommend = "force_clarify";
    }
  } else if (top >= 0.8) {
    level = "WARNING";
    if (pressure.clock >= 0.8 || pressure.tools >= 0.8) {
      recommend = "reduce_tool_calls";
    } else if (pressure.queue >= 0.8 || pressure.lane >= 0.8) {
      recommend = "queue_deep_work";
    } else if (pressure.kv >= 0.8) {
      recommend = "reduce_output_tokens";
    }
  }

  return {
    level,
    signals: {
      clockA_p95_ms: input.clockAP95Ms,
      tool_calls_last_tick: input.toolCallsLastTick,
      kv_tokens: input.kvTokens,
      queue_depth: input.queueDepth,
      lane_pressure: input.lanePressure,
    },
    recommend,
  };
};
