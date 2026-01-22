export type LocalRuntimeStats = {
  ts: string;
  durationMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  maxTokens: number;
  contextTokens: number;
  memory: {
    rssBytes: number;
    heapUsedBytes: number;
    heapTotalBytes: number;
    externalBytes: number;
    arrayBuffersBytes: number;
  };
};

let lastStats: LocalRuntimeStats | null = null;

export const recordLocalRuntimeStats = (stats: LocalRuntimeStats): void => {
  lastStats = stats;
};

export const getLocalRuntimeStats = (): LocalRuntimeStats | null => lastStats;
