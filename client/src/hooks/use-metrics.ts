import * as React from "react";

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
  };
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
  const [data, setData] = React.useState<HelixMetrics | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch("/api/helix/metrics");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (alive) setData(j);
      } catch (e:any) {
        if (alive) setErr(e.message ?? "network error");
      }
    };
    tick();
    const id = setInterval(tick, pollMs);
    return () => { alive = false; clearInterval(id); };
  }, [pollMs]);

  return { data, err };
}