import * as React from "react";

export interface ShiftVectorMetrics {
  epsilonTilt: number;
  betaTiltVec: [number, number, number];
  gTarget: number;
  R_geom: number;
  gEff_check: number;
}

interface MetricsData {
  totalTiles: number;
  activeTiles: number;
  avgTiles: number;
  // ... other existing fields
  shift?: ShiftVectorMetrics;
}

export type HelixMetrics = {
  energyOutput: number;          // MW
  exoticMass: number;            // kg
  timeScaleRatio: number;        // TS
  curvatureMax: number;          // proxy
  fordRoman: { value:number; limit:number; status:"PASS"|"FAIL" };
  sectorStrobing?: number;       // sectors active
  activeTiles?: number;
  totalTiles?: number;
  gammaVanDenBroeck?: number;
  modelMode?: string;
  // New Bridge-specific fields
  hull?: {
    Lx_m: number;                // Hull length
    Ly_m: number;                // Hull width  
    Lz_m: number;                // Hull height
    a?: number;                  // Semi-axis a
    b?: number;                  // Semi-axis b
    c?: number;                  // Semi-axis c
  };
  shiftVector?: ShiftVectorMetrics;
  tiles?: {
    tileArea_cm2: number;        // Tile area
    hullArea_m2: number | null;  // Hull surface area
    N_tiles: number;             // Total tiles
  };
  timescales?: {
    f_m_Hz: number;              // Modulation frequency
    T_m_s: number;               // Modulation period
    L_long_m: number;            // Longest hull dimension
    T_long_s: number;            // Light-crossing time
    TS_long: number;             // Time-scale ratio (conservative)
    TS_geom: number;             // Time-scale ratio (geometric)
  };
  // Legacy geometry field (backward compatibility)
  geometry?: {
    Lx_m: number;
    Ly_m: number;
    Lz_m: number;
    TS_ratio: number;
    TS_long?: number;
    TS_geom?: number;
  };
};

export function useMetrics(pollMs = 2000) {
  // Configure API base once. In dev, point to your backend port.
  // Example: VITE_API_BASE=http://localhost:3001
  const API_BASE = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_BASE : '') || '';
  const [data, setData] = React.useState<HelixMetrics | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    const makeUrl = (path: string) => (API_BASE ? `${API_BASE}${path}` : path);
    const tick = async () => {
      try {
        // Add a 7s timeout so "Failed to fetch" surfaces quickly + cleanly.
        // Prefer native AbortSignal.timeout when available; else use controller with a reason.
        let controller: AbortController | null = null;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let signal: AbortSignal | undefined;
        if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
          // @ts-ignore: TS lib may not have AbortSignal.timeout yet
          signal = AbortSignal.timeout(7000);
        } else {
          controller = new AbortController();
          signal = controller.signal;
          timeoutId = setTimeout(() => {
            try {
              controller!.abort(new DOMException('Request timed out', 'TimeoutError'));
            } catch {}
          }, 7000);
        }

        const r = await fetch(makeUrl("/api/helix/metrics"), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          signal
        });
        if (!r.ok) {
          // Try to extract any text error for easier debugging
          let body = '';
          try { body = await r.text(); } catch {}
          throw new Error(`HTTP ${r.status} ${r.statusText}${body ? ` — ${body.slice(0,200)}` : ''}`);
        }
        
        // Some runtimes return empty; guard JSON parse
        const text = await r.text();
        const j = text ? JSON.parse(text) : null;
        if (alive) {
          setData(j);
          setErr(null); // Clear any previous errors
        }
      } catch (e: any) {
        if (alive) {
          const name = e?.name || '';
          const msg  = (name === 'AbortError' || name === 'TimeoutError')
            ? 'request timeout (7s)'
            : (e?.message || 'network error');
          console.error('[useMetrics] Fetch error:', msg);
          setErr(msg);
          // Fallback mock so the Bridge stays interactive in dev
          setData(d => d ?? {
            energyOutput: 0,
            exoticMass: 0,
            timeScaleRatio: 0,
            curvatureMax: 0,
            fordRoman: { value: 0, limit: 1, status: 'PASS' },
            modelMode: 'calibrated',
            tiles: { tileArea_cm2: 25, hullArea_m2: null, N_tiles: 0 }
          });
        }
      } finally {
        // Make sure the fallback timer is always cleared
        if (timeoutId) clearTimeout(timeoutId);
      }
    };
    
    // Initial fetch
    tick();
    
    // Set up polling interval
    const id = setInterval(tick, pollMs);
    
    return () => { 
      alive = false; 
      clearInterval(id); 
    };
  }, [pollMs]);

  return { data, err };
}