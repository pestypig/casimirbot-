type MemoryUsageLike = {
  rss: number;
  heapUsed: number;
};

type StartupMemorySettleOptions = {
  enabled?: boolean;
  delayMs?: number;
  collect?: (() => void) | null;
  readMemory?: () => MemoryUsageLike;
  now?: () => number;
  log?: (message: string) => void;
  schedule?: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
};

const toMiB = (bytes: number): number =>
  Math.round((bytes / 1024 / 1024) * 10) / 10;

const readDelayMs = (): number => {
  const parsed = Number(process.env.HELIX_LOW_MEMORY_STARTUP_GC_DELAY_MS ?? "1000");
  return Number.isFinite(parsed) ? Math.max(0, Math.min(30_000, parsed)) : 1000;
};

export const scheduleStartupMemorySettle = (
  options: StartupMemorySettleOptions = {},
): (() => void) => {
  const enabled =
    options.enabled ??
    process.env.HELIX_LOW_MEMORY_STARTUP_GC === "1";
  if (!enabled) return () => undefined;

  const collect =
    options.collect ??
    (globalThis as typeof globalThis & { gc?: () => void }).gc ??
    null;
  const log = options.log ?? console.info;
  if (!collect) {
    log("[memory] low-memory startup settle unavailable; start Node with --expose-gc");
    return () => undefined;
  }

  const readMemory = options.readMemory ?? process.memoryUsage;
  const now = options.now ?? (() => performance.now());
  const schedule = options.schedule ?? setTimeout;
  const timer = schedule(() => {
    const before = readMemory();
    const startedAt = now();
    collect();
    const durationMs = Math.max(0, now() - startedAt);
    const after = readMemory();
    log(
      `[memory] low-memory startup settle complete ` +
        `heap=${toMiB(before.heapUsed)}->${toMiB(after.heapUsed)}MiB ` +
        `rss=${toMiB(before.rss)}->${toMiB(after.rss)}MiB ` +
        `pause=${Math.round(durationMs)}ms`,
    );
  }, options.delayMs ?? readDelayMs());
  timer.unref?.();
  return () => clearTimeout(timer);
};
