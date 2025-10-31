import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
): Promise<Response> {
  // Helper: dev-only minimal mocks when backend isn't up.
  const shouldMock = () => {
    // Vite dev environment check
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV;
      return Boolean(isDev) && url.startsWith('/api/helix');
    } catch {
      return false;
    }
  };

  const makeMock = (): Response | null => {
    if (!shouldMock()) return null;
    // Very small, UI-friendly defaults to keep Helix Core page stable without backend
    const now = Date.now();
    const jsonFor = () => {
      if (method === 'GET' && url === '/api/helix/pipeline') {
        return {
          currentMode: 'hover',
          dutyEffectiveFR: 0.000025,
          sectorCount: 400,
          sectorsConcurrent: 1,
          gammaGeo: 26,
          qSpoilingFactor: 1,
          gammaVanDenBroeck: 134852.5967,
          lightCrossing: { burst_ms: 10, dwell_ms: 1000 },
          hull: { a: 503.5, b: 132, c: 86.5 },
          updatedAt: now,
        };
      }
      if (method === 'GET' && url === '/api/helix/metrics') {
        return {
          totalTiles: 0,
          activeTiles: 0,
          currentMode: 'hover',
          tileData: [],
          lightCrossing: {
            tauLC_ms: 3.336,
            sectorPeriod_ms: 1000,
            burst_ms: 10,
            dwell_ms: 1000,
            sectorsTotal: 400,
            activeSectors: 1,
          },
        };
      }
      // Accept POSTs used by the UI with a no-op echo to avoid hard errors
      if (method === 'POST' && url.startsWith('/api/helix/hardware/')) {
        return { ok: true };
      }
      if (method === 'POST' && (url.startsWith('/api/helix/pipeline') || url === '/api/helix/command' || url.startsWith('/api/helix/mode'))) {
        return { ok: true, url, method, received: data ?? null, mocked: true, ts: now };
      }
      return null;
    };
    const body = jsonFor();
    if (body == null) return null;
    // eslint-disable-next-line no-console
    console.warn('[apiRequest] Using DEV mock for', method, url);
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
      // Try dev mock on non-OK responses
      const mocked = makeMock();
      if (mocked) return mocked;
    }

    await throwIfResNotOk(res);
    return res;
  } catch (err) {
    // Network or other error: try dev mock
    const mocked = makeMock();
    if (mocked) return mocked;
    throw err;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

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
