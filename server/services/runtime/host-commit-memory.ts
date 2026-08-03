import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";

const KIB_PER_MIB = 1024;
const DEFAULT_SAMPLE_INTERVAL_MS = 5_000;
const DEFAULT_STALE_AFTER_MS = 30_000;

export type HostCommitMemorySnapshot = {
  status: "available" | "stale" | "unavailable";
  source: "windows_wmic" | "linux_proc_meminfo" | "unsupported" | "sample_error";
  platform: NodeJS.Platform;
  committedMiB?: number;
  limitMiB?: number;
  freeMiB?: number;
  ratio?: number;
  sampledAtMs?: number;
  ageMs?: number;
  errorCode?: string;
};

type HostCommitMonitorOptions = {
  platform?: NodeJS.Platform;
  intervalMs?: number;
  staleAfterMs?: number;
  now?: () => number;
  log?: (message: string) => void;
};

let cachedSnapshot: HostCommitMemorySnapshot | null = null;
let monitorTimer: NodeJS.Timeout | null = null;
let monitorPromise: Promise<HostCommitMemorySnapshot> | null = null;
let monitorOptions: Required<Pick<HostCommitMonitorOptions, "platform" | "intervalMs" | "staleAfterMs" | "now">> &
  Pick<HostCommitMonitorOptions, "log"> = {
    platform: process.platform,
    intervalMs: DEFAULT_SAMPLE_INTERVAL_MS,
    staleAfterMs: DEFAULT_STALE_AFTER_MS,
    now: Date.now,
  };

const toPositiveInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const roundMiB = (value: number): number => Math.round(value * 10) / 10;
const roundRatio = (value: number): number => Math.round(value * 10_000) / 10_000;

const buildAvailableSnapshot = (input: {
  source: "windows_wmic" | "linux_proc_meminfo";
  platform: NodeJS.Platform;
  limitKiB: number;
  freeKiB: number;
  sampledAtMs: number;
}): HostCommitMemorySnapshot => {
  const limitMiB = input.limitKiB / KIB_PER_MIB;
  const freeMiB = Math.max(0, input.freeKiB / KIB_PER_MIB);
  const committedMiB = Math.max(0, limitMiB - freeMiB);
  return {
    status: "available",
    source: input.source,
    platform: input.platform,
    committedMiB: roundMiB(committedMiB),
    limitMiB: roundMiB(limitMiB),
    freeMiB: roundMiB(freeMiB),
    ratio: limitMiB > 0 ? roundRatio(committedMiB / limitMiB) : 0,
    sampledAtMs: input.sampledAtMs,
    ageMs: 0,
  };
};

export const parseWindowsVirtualMemoryOutput = (
  stdout: string,
  sampledAtMs = Date.now(),
): HostCommitMemorySnapshot | null => {
  const freeMatch = stdout.match(/(?:^|\r?\n)FreeVirtualMemory=(\d+)/i);
  const limitMatch = stdout.match(/(?:^|\r?\n)TotalVirtualMemorySize=(\d+)/i);
  const freeKiB = Number(freeMatch?.[1]);
  const limitKiB = Number(limitMatch?.[1]);
  if (!Number.isFinite(freeKiB) || !Number.isFinite(limitKiB) || limitKiB <= 0) return null;
  return buildAvailableSnapshot({
    source: "windows_wmic",
    platform: "win32",
    limitKiB,
    freeKiB,
    sampledAtMs,
  });
};

export const parseLinuxCommitMemory = (
  contents: string,
  sampledAtMs = Date.now(),
): HostCommitMemorySnapshot | null => {
  const limitMatch = contents.match(/^CommitLimit:\s+(\d+)\s+kB$/im);
  const committedMatch = contents.match(/^Committed_AS:\s+(\d+)\s+kB$/im);
  const limitKiB = Number(limitMatch?.[1]);
  const committedKiB = Number(committedMatch?.[1]);
  if (!Number.isFinite(limitKiB) || !Number.isFinite(committedKiB) || limitKiB <= 0) return null;
  return buildAvailableSnapshot({
    source: "linux_proc_meminfo",
    platform: "linux",
    limitKiB,
    freeKiB: Math.max(0, limitKiB - committedKiB),
    sampledAtMs,
  });
};

const sampleWindowsCommitMemory = (sampledAtMs: number): Promise<HostCommitMemorySnapshot> =>
  new Promise((resolve) => {
    execFile(
      "wmic.exe",
      ["OS", "get", "FreeVirtualMemory,TotalVirtualMemorySize", "/value"],
      { timeout: 3_000, windowsHide: true, maxBuffer: 16 * 1024 },
      (error, stdout) => {
        const parsed = !error ? parseWindowsVirtualMemoryOutput(stdout, sampledAtMs) : null;
        resolve(
          parsed ?? {
            status: "unavailable",
            source: "sample_error",
            platform: "win32",
            errorCode: error && "code" in error ? String(error.code) : "windows_sample_invalid",
          },
        );
      },
    );
  });

const sampleLinuxCommitMemory = async (sampledAtMs: number): Promise<HostCommitMemorySnapshot> => {
  try {
    const contents = await readFile("/proc/meminfo", "utf8");
    return (
      parseLinuxCommitMemory(contents, sampledAtMs) ?? {
        status: "unavailable",
        source: "sample_error",
        platform: "linux",
        errorCode: "linux_sample_invalid",
      }
    );
  } catch (error) {
    return {
      status: "unavailable",
      source: "sample_error",
      platform: "linux",
      errorCode: error && typeof error === "object" && "code" in error ? String(error.code) : "linux_sample_failed",
    };
  }
};

export const sampleHostCommitMemory = async (
  platform: NodeJS.Platform = process.platform,
  sampledAtMs = Date.now(),
): Promise<HostCommitMemorySnapshot> => {
  if (platform === "win32") return sampleWindowsCommitMemory(sampledAtMs);
  if (platform === "linux") return sampleLinuxCommitMemory(sampledAtMs);
  return {
    status: "unavailable",
    source: "unsupported",
    platform,
    errorCode: "platform_unsupported",
  };
};

const refreshCachedSnapshot = async (): Promise<HostCommitMemorySnapshot> => {
  const sampled = await sampleHostCommitMemory(monitorOptions.platform, monitorOptions.now());
  cachedSnapshot = sampled;
  return sampled;
};

export const initializeHostCommitMemoryMonitor = async (
  options: HostCommitMonitorOptions = {},
): Promise<HostCommitMemorySnapshot> => {
  monitorOptions = {
    platform: options.platform ?? process.platform,
    intervalMs:
      options.intervalMs ??
      toPositiveInteger(process.env.HELIX_HOST_COMMIT_SAMPLE_INTERVAL_MS, DEFAULT_SAMPLE_INTERVAL_MS),
    staleAfterMs:
      options.staleAfterMs ??
      toPositiveInteger(process.env.HELIX_HOST_COMMIT_STALE_AFTER_MS, DEFAULT_STALE_AFTER_MS),
    now: options.now ?? Date.now,
    log: options.log,
  };
  if (!monitorPromise) {
    monitorPromise = refreshCachedSnapshot().finally(() => {
      monitorPromise = null;
    });
  }
  const initial = await monitorPromise;
  if (!monitorTimer && initial.source !== "unsupported") {
    monitorTimer = setInterval(() => {
      if (monitorPromise) return;
      monitorPromise = refreshCachedSnapshot()
        .then((snapshot) => {
          if (snapshot.status !== "available") {
            monitorOptions.log?.(`[memory] host commit sample unavailable (${snapshot.errorCode ?? snapshot.source})`);
          }
          return snapshot;
        })
        .finally(() => {
          monitorPromise = null;
        });
    }, monitorOptions.intervalMs);
    monitorTimer.unref?.();
  }
  return initial;
};

export const getHostCommitMemorySnapshot = (): HostCommitMemorySnapshot | null => {
  if (!cachedSnapshot) return null;
  if (cachedSnapshot.status !== "available" || cachedSnapshot.sampledAtMs === undefined) {
    return { ...cachedSnapshot };
  }
  const ageMs = Math.max(0, monitorOptions.now() - cachedSnapshot.sampledAtMs);
  return {
    ...cachedSnapshot,
    status: ageMs > monitorOptions.staleAfterMs ? "stale" : "available",
    ageMs,
  };
};

export const stopHostCommitMemoryMonitor = (): void => {
  if (monitorTimer) clearInterval(monitorTimer);
  monitorTimer = null;
  monitorPromise = null;
};

export const resetHostCommitMemoryMonitorForTests = (): void => {
  stopHostCommitMemoryMonitor();
  cachedSnapshot = null;
  monitorOptions = {
    platform: process.platform,
    intervalMs: DEFAULT_SAMPLE_INTERVAL_MS,
    staleAfterMs: DEFAULT_STALE_AFTER_MS,
    now: Date.now,
  };
};
