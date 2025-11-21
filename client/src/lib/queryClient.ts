import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { isFlagEnabled } from "@/lib/envFlags";

interface ApiRequestOptions {
  allowUnauthorized?: boolean;
}

type FixedTuple3 = [number, number, number];

const HELIX_DEV_MOCKS_ENABLED = isFlagEnabled("HELIX_DEV_MOCKS", true);
const C_M_PER_S = 299_792_458;
const HELIX_MOCK_NEEDLE_PATH_M = 1007;
const HELIX_MOCK_TAU_LC_MS = (HELIX_MOCK_NEEDLE_PATH_M / C_M_PER_S) * 1e3;

export const HELIX_DEV_MOCK_EVENT = "helix:dev-mock-used";
export type DevMockStatus = {
  used: boolean;
  count: number;
  last?: {
    url: string;
    method: string;
    reason?: string;
    at: number;
  };
};

const devMockStatus: DevMockStatus = { used: false, count: 0 };

const notifyDevMockUsed = (info: { url: string; method: string; reason?: string }) => {
  devMockStatus.used = true;
  devMockStatus.count += 1;
  devMockStatus.last = { ...info, at: Date.now() };
  // Make the status inspectable for debugging and surface to listeners
  try {
    (globalThis as Record<string, unknown>).__HELIX_DEV_MOCK__ = { ...devMockStatus };
  } catch { /* noop */ }
  try {
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent(HELIX_DEV_MOCK_EVENT, { detail: { ...devMockStatus } }));
    }
  } catch { /* noop */ }
};

export const getDevMockStatus = (): DevMockStatus => ({ ...devMockStatus });

const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const encodeBytesToBase64 = (bytes: Uint8Array): string => {
  const globalScope = globalThis as {
    btoa?: (value: string) => string;
    Buffer?: {
      from?: (
        input: Uint8Array,
      ) => { toString(encoding: string): string };
    };
  };

  if (typeof globalScope.btoa === "function") {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode(...chunk);
    }
    return globalScope.btoa(binary);
  }

  const bufferFactory = globalScope.Buffer;
  if (
    bufferFactory &&
    typeof bufferFactory.from === "function"
  ) {
    return bufferFactory.from(bytes).toString("base64");
  }

  let output = "";
  let i = 0;
  const { length } = bytes;
  for (; i + 2 < length; i += 3) {
    const chunk =
      (bytes[i] << 16) |
      (bytes[i + 1] << 8) |
      bytes[i + 2];
    output += BASE64_ALPHABET[(chunk >> 18) & 63];
    output += BASE64_ALPHABET[(chunk >> 12) & 63];
    output += BASE64_ALPHABET[(chunk >> 6) & 63];
    output += BASE64_ALPHABET[chunk & 63];
  }
  const remaining = length - i;
  if (remaining === 1) {
    const chunk = bytes[i] << 16;
    output += BASE64_ALPHABET[(chunk >> 18) & 63];
    output += BASE64_ALPHABET[(chunk >> 12) & 63];
    output += "==";
  } else if (remaining === 2) {
    const chunk =
      (bytes[i] << 16) |
      (bytes[i + 1] << 8);
    output += BASE64_ALPHABET[(chunk >> 18) & 63];
    output += BASE64_ALPHABET[(chunk >> 12) & 63];
    output += BASE64_ALPHABET[(chunk >> 6) & 63];
    output += "=";
  }
  return output;
};

const encodeFloat32ToBase64 = (values: Float32Array): string => {
  const bytes = new Uint8Array(
    values.buffer,
    values.byteOffset,
    values.byteLength,
  );
  return encodeBytesToBase64(bytes);
};

const buildCurvatureMock = (dims: FixedTuple3) => {
  const total = dims[0] * dims[1] * dims[2];
  const data = new Float32Array(total);
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < total; i++) {
    const t = total > 1 ? i / (total - 1) : 0;
    const value = Math.sin(t * Math.PI * 4) * 0.05;
    data[i] = value;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (!Number.isFinite(min)) min = 0;
  if (!Number.isFinite(max)) max = 0;
  return {
    dims,
    data: encodeFloat32ToBase64(data),
    min,
    max,
  };
};

const CURVATURE_MOCKS = {
  low: buildCurvatureMock([8, 8, 8]),
  medium: buildCurvatureMock([12, 12, 12]),
  high: buildCurvatureMock([16, 16, 16]),
} as const;

const buildStressMock = (dims: FixedTuple3) => {
  const total = dims[0] * dims[1] * dims[2];
  const makeField = (scale: number, bias = 0) => {
    const data = new Float32Array(total);
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (let idx = 0; idx < total; idx += 1) {
      const t = total > 1 ? idx / (total - 1) : 0;
      const value = bias + Math.sin(t * Math.PI * 4) * scale;
      data[idx] = value;
      if (value < min) min = value;
      if (value > max) max = value;
    }
    if (!Number.isFinite(min)) min = 0;
    if (!Number.isFinite(max)) max = 0;
    return { data: encodeFloat32ToBase64(data), min, max };
  };
  return {
    dims,
    t00: makeField(0.08, -0.04),
    Sx: makeField(0.02),
    Sy: makeField(0.02),
    Sz: makeField(0.02),
    divS: makeField(0.01),
  };
};

const STRESS_ENERGY_MOCK = buildStressMock([12, 12, 12]);

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  signal?: AbortSignal,
  options: ApiRequestOptions = {},
): Promise<Response> {
  const normalizeUrlForMock = (input: string): string => {
    if (!input) return input;
    if (input.startsWith("/")) return input;
    try {
      const base =
        typeof window !== "undefined" && window.location
          ? `${window.location.protocol}//${window.location.host}`
          : "http://localhost";
      const parsed = new URL(input, base);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return input;
    }
  };
  const normalizedUrl = normalizeUrlForMock(url);
  const normalizedPath = normalizedUrl.split("?")[0] ?? normalizedUrl;

  // Helper: dev-only minimal mocks when backend isn't up.
  const shouldMock = () => {
    if (!HELIX_DEV_MOCKS_ENABLED) return false;
    // Vite dev environment check
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV;
      return Boolean(isDev) && normalizedUrl.startsWith('/api/helix');
    } catch {
      return false;
    }
  };

  const makeMock = (reason?: string): Response | null => {
    if (!shouldMock()) return null;
    // Very small, UI-friendly defaults to keep Helix Core page stable without backend
    const now = Date.now();
    const jsonFor = () => {
      if (method === 'GET' && normalizedPath === '/api/helix/pipeline') {
        return {
          currentMode: 'hover',
          dutyEffectiveFR: 0.000025,
          __mockData: true,
          __mockSource: 'helix-dev-defaults',
          sectorCount: 400,
          sectorsConcurrent: 1,
          gammaGeo: 26,
          qSpoilingFactor: 1,
          gammaVanDenBroeck: 134852.5967,
          lightCrossing: {
            tauLC_ms: HELIX_MOCK_TAU_LC_MS,
            burst_ms: 10,
            dwell_ms: 1000,
          },
          hull: { a: 503.5, b: 132, c: 86.5 },
          mock: true,
          updatedAt: now,
        };
      }
      if (method === 'GET' && normalizedPath === '/api/helix/metrics') {
        const sectorsTotal = 400;
        const sectorsLive = 1;
        const strobeHz = 1000;
        const sectorPeriod_ms = 1000 / strobeHz;
        const tilesPerSector = 1024;
        const totalTiles = tilesPerSector * sectorsTotal;
        const activeTiles = tilesPerSector * sectorsLive;
        const currentSector = Math.floor((now / 1000) * strobeHz) % sectorsTotal;
        return {
          totalTiles,
          activeTiles,
          tilesPerSector,
          totalSectors: sectorsTotal,
          activeSectors: sectorsLive,
          sectorStrobing: sectorsLive,
          currentSector,
          strobeHz,
          sectorPeriod_ms,
          dutyCycle: 0.01,
          dutyEffectiveFR: 0.01 * (sectorsLive / sectorsTotal),
          currentMode: 'hover',
          overallStatus: 'NOMINAL',
          __mockData: true,
          __mockSource: 'helix-dev-defaults',
          tileData: [],
          lightCrossing: {
            tauLC_ms: HELIX_MOCK_TAU_LC_MS,
            sectorPeriod_ms,
            burst_ms: sectorPeriod_ms * 0.01,
            dwell_ms: sectorPeriod_ms,
            sectorIdx: currentSector,
            sectorCount: sectorsTotal,
            sectorsTotal,
            activeSectors: sectorsLive,
          },
        };
      }
      if (method === 'GET' && normalizedPath === '/api/helix/curvature-brick') {
        const searchStart = normalizedUrl.indexOf("?");
        const params = searchStart >= 0
          ? new URLSearchParams(normalizedUrl.slice(searchStart + 1))
          : undefined;
        const qualityRaw = params?.get("quality")?.toLowerCase();
        const quality =
          qualityRaw === "low" || qualityRaw === "high"
            ? qualityRaw
            : "medium";
        const mock = CURVATURE_MOCKS[quality];
        const span = Math.max(mock.max - mock.min, 1e-6);
        const residualScale = span * 0.25;
        return {
          dims: mock.dims,
          voxelBytes: 4,
          format: "r32f",
          data: mock.data,
          min: mock.min,
          max: mock.max,
          emaAlpha: 0.18,
          residualMin: -residualScale,
          residualMax: residualScale,
          quality,
          mock: true,
          generatedAt: now,
        };
      }
      if (method === 'GET' && normalizedPath === '/api/helix/stress-energy-brick') {
        const mock = STRESS_ENERGY_MOCK;
        return {
          dims: mock.dims,
          voxelBytes: 4,
          format: "r32f",
          channels: {
            t00: mock.t00,
            Sx: mock.Sx,
            Sy: mock.Sy,
            Sz: mock.Sz,
            divS: mock.divS,
          },
          stats: {
            totalEnergy_J: -1.2e12,
            avgT00: -4e10,
            avgFluxMagnitude: 2e9,
            netFlux: [0, 0, 0],
            divMin: mock.divS.min,
            divMax: mock.divS.max,
            dutyFR: 0.0025,
            strobePhase: (now / 1000) % 1,
          },
          mock: true,
          generatedAt: now,
        };
      }
      // Accept POSTs used by the UI with a no-op echo to avoid hard errors
      if (method === 'POST' && normalizedUrl.startsWith('/api/helix/hardware/')) {
        return { ok: true };
      }
      if (method === 'POST' && (normalizedUrl.startsWith('/api/helix/pipeline') || normalizedUrl === '/api/helix/command' || normalizedUrl.startsWith('/api/helix/mode'))) {
        return { ok: true, url, method, received: data ?? null, mocked: true, ts: now };
      }
      return null;
    };
    const body = jsonFor();
    if (body == null) return null;
    // eslint-disable-next-line no-console
    if (reason) {
      console.warn('[apiRequest] Using DEV mock for', method, url, `:: ${reason}`);
    } else {
      console.warn('[apiRequest] Using DEV mock for', method, url);
    }
    notifyDevMockUsed({
      url: normalizedPath || normalizedUrl || url,
      method,
      reason,
    });
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal,
    });

    if (!res.ok) {
      if (options.allowUnauthorized && res.status === 401) {
        return res;
      }
      // Try dev mock on non-OK responses
      const mocked = makeMock(`${res.status} ${res.statusText}`.trim());
      if (mocked) return mocked;
    }

    await throwIfResNotOk(res);
    return res;
  } catch (err) {
    // Network or other error: try dev mock
    const message = err instanceof Error ? err.message : String(err);
    const mocked = makeMock(message);
    if (mocked) return mocked;
    throw err;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export function getQueryFn<T>({ on401: unauthorizedBehavior }: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> {
  return async ({ queryKey, signal }) => {
    const urlFromQueryKey = () => {
      const firstString = queryKey.find(
        (part): part is string => typeof part === "string" && part.length > 0,
      );
      if (firstString) return firstString;
      return queryKey.join("/");
    };

    const url = urlFromQueryKey();
    if (!url || typeof url !== "string" || url.length === 0) {
      throw new Error("queryKey must include a request URL string");
    }

    const res = await apiRequest(
      "GET",
      url,
      undefined,
      signal,
      { allowUnauthorized: unauthorizedBehavior === "returnNull" },
    );

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as T;
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return await res.json();
    }

    const text = await res.text();
    if (!text) {
      return null as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
