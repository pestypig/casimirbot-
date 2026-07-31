type MemoryUsageLike = {
  rss: number;
  heapUsed: number;
};

type IdleMemorySettleOptions = {
  enabled?: boolean;
  hasActiveTasks: () => boolean;
  delayMs?: number;
  minimumIntervalMs?: number;
  collect?: (() => void) | null;
  readMemory?: () => MemoryUsageLike;
  now?: () => number;
  log?: (message: string) => void;
  schedule?: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
};

const MIB = 1024 * 1024;
const DEFAULT_RSS_THRESHOLD_MIB = 950;
const DEFAULT_HEAP_THRESHOLD_MIB = 520;

let settleTimer: ReturnType<typeof setTimeout> | null = null;
let lastSettleAtMs = 0;

const toMiB = (bytes: number): number =>
  Math.round((bytes / MIB) * 10) / 10;

const readPositiveNumber = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
};

export const scheduleIdleMemorySettle = (
  options: IdleMemorySettleOptions,
): void => {
  const enabled =
    options.enabled ??
    process.env.HELIX_LOW_MEMORY_IDLE_GC === "1";
  if (!enabled || settleTimer) return;

  const collect =
    options.collect ??
    (globalThis as typeof globalThis & { gc?: () => void }).gc ??
    null;
  if (!collect) return;

  const readMemory = options.readMemory ?? process.memoryUsage;
  const now = options.now ?? Date.now;
  const delayMs =
    options.delayMs ??
    readPositiveNumber(process.env.HELIX_LOW_MEMORY_IDLE_GC_DELAY_MS, 1_000);
  const minimumIntervalMs =
    options.minimumIntervalMs ??
    readPositiveNumber(
      process.env.HELIX_LOW_MEMORY_IDLE_GC_MIN_INTERVAL_MS,
      30_000,
    );
  const schedule = options.schedule ?? setTimeout;
  const log = options.log ?? console.info;

  settleTimer = schedule(() => {
    settleTimer = null;
    const currentTimeMs = now();
    if (
      options.hasActiveTasks() ||
      currentTimeMs - lastSettleAtMs < minimumIntervalMs
    ) {
      return;
    }
    const before = readMemory();
    const rssThresholdMiB = readPositiveNumber(
      process.env.HELIX_LOW_MEMORY_IDLE_GC_RSS_MIB,
      DEFAULT_RSS_THRESHOLD_MIB,
    );
    const heapThresholdMiB = readPositiveNumber(
      process.env.HELIX_LOW_MEMORY_IDLE_GC_HEAP_MIB,
      DEFAULT_HEAP_THRESHOLD_MIB,
    );
    if (
      before.rss / MIB < rssThresholdMiB &&
      before.heapUsed / MIB < heapThresholdMiB
    ) {
      return;
    }
    const startedAtMs = performance.now();
    collect();
    lastSettleAtMs = currentTimeMs;
    const after = readMemory();
    log(
      `[memory] low-memory idle settle complete ` +
        `heap=${toMiB(before.heapUsed)}->${toMiB(after.heapUsed)}MiB ` +
        `rss=${toMiB(before.rss)}->${toMiB(after.rss)}MiB ` +
        `pause=${Math.round(performance.now() - startedAtMs)}ms`,
    );
  }, delayMs);
  settleTimer.unref?.();
};

export const resetIdleMemorySettleForTests = (): void => {
  if (settleTimer) clearTimeout(settleTimer);
  settleTimer = null;
  lastSettleAtMs = 0;
};
