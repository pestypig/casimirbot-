import * as React from "react";

// ---------------- Types (unchanged) ----------------
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
  // Strobing metrics (optional)
  lightCrossing_dwell_ms?: number;
  lightCrossing_burst_ms?: number;
  lightCrossing_sectorIndex?: number;
  lightCrossing_sectorCount?: number;
};

// ---------- Helpers: robust fetch + fallback derivation from pipeline ----------
function num(x: any, d = 0) { const n = +x; return Number.isFinite(n) ? n : d; }
function arrN(a: any, k: number) { return (Array.isArray(a) && a.length >= k) ? a : undefined; }

async function fetchJSON(url: string, signal?: AbortSignal) {
  const r = await fetch(url, { method: "GET", headers: { "Accept": "application/json" }, signal });
  if (!r.ok) {
    let body = "";
    try { body = await r.text(); } catch {}
    throw new Error(`HTTP ${r.status} ${r.statusText}${body ? ` — ${body.slice(0,200)}` : ""}`);
  }
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}

function deriveMetricsFromPipeline(p: any): HelixMetrics {
  // Attempt to read calibrated values from the pipeline snapshot with minimal assumptions.
  // Units: prefer MW & kg; handle W→MW if present. TS from provided ratio or LC/modulation.
  const energyMW =
    Number.isFinite(+p?.powerMW)       ? +p.powerMW :
    Number.isFinite(+p?.P_avg_MW)      ? +p.P_avg_MW :
    Number.isFinite(+p?.P_avg)         ? (+p.P_avg / 1e6) :
    Number.isFinite(+p?.power_W)       ? (+p.power_W / 1e6) :
    0;

  const exoticKg =
    Number.isFinite(+p?.exoticMass_kg) ? +p.exoticMass_kg :
    Number.isFinite(+p?.M_exotic)      ? +p.M_exotic :
    Number.isFinite(+p?.exoticMass)    ? +p.exoticMass :
    0;

  // Timescales
  const Llong_m   = num(p?.L_long ?? p?.L_long_m ?? p?.hull?.L_long_m ?? p?.metrics?.L_long_m, 0);
  const c         = 299_792_458;
  const T_LC_s    = Llong_m > 0 ? (Llong_m / c) : num(p?.T_LC ?? p?.T_LC_s, 0);
  const f_m_Hz    = num(p?.modulationFreq_Hz ?? (p?.modulationFreq_GHz * 1e9), 0);
  const T_m_s     = f_m_Hz > 0 ? (1 / f_m_Hz) : num(p?.T_m ?? p?.T_m_s, 0);
  const TS_long   = (T_LC_s > 0 && T_m_s > 0) ? (T_LC_s / T_m_s) : num(p?.TS_ratio ?? p?.TS ?? p?.timescales?.TS_long, 0);

  // Tiles/hull
  const N_tiles   = num(p?.N_tiles ?? p?.tiles?.N_tiles, 0);
  const tileArea  = num(p?.tileArea_cm2 ?? p?.tiles?.tileArea_cm2, 25);
  const hullArea  = Number.isFinite(+p?.A_hull) ? +p.A_hull : (Number.isFinite(+p?.tiles?.hullArea_m2) ? +p.tiles.hullArea_m2 : null);

  // γ_VdB (visual)
  const gammaVdB  = num(p?.gammaVdB ?? p?.gammaVanDenBroeck ?? p?.byMode?.SHOW?.gammaVdB ?? p?.byMode?.REAL?.gammaVdB, 0);

  // Optional legacy geometry block
  const geometry = (()=>{
    const Lx = num(p?.geometry?.Lx_m ?? p?.hull?.Lx_m, 0);
    const Ly = num(p?.geometry?.Ly_m ?? p?.hull?.Ly_m, 0);
    const Lz = num(p?.geometry?.Lz_m ?? p?.hull?.Lz_m, 0);
    if (!Lx && !Ly && !Lz) return undefined;
    return { Lx_m: Lx, Ly_m: Ly, Lz_m: Lz, TS_ratio: TS_long, TS_long, TS_geom: TS_long };
  })();

  // Ford-Roman compliance
  const zeta = num(p?.zeta ?? p?.fordRoman?.value ?? p?.fordRoman?.zeta, 0);
  const fordRomanStatus = p?.fordRomanCompliance ? "PASS" : (zeta >= 1.0 ? "FAIL" : "PASS");

  // Strobing metrics
  const strobingMetrics = {
    lightCrossing_dwell_ms: num(p?.lightCrossing?.dwell_ms ?? p?.dwell_ms),
    lightCrossing_burst_ms: num(p?.lightCrossing?.burst_ms ?? p?.burst_ms),
    lightCrossing_sectorIndex: num(p?.lightCrossing?.sectorIdx ?? p?.currentSector ?? p?.sectorIndex),
    lightCrossing_sectorCount: num(p?.lightCrossing?.sectorCount ?? p?.totalSectors ?? p?.sectorCount)
  };

  // Sector counts
  const sectors = num(p?.activeSectors ?? p?.sectorsActive ?? p?.lightCrossing?.sectorCount ?? p?.totalSectors ?? 0);
  const tiles = num(p?.activeTiles ?? 0);

  return {
    energyOutput: energyMW,
    exoticMass: exoticKg,
    timeScaleRatio: TS_long,
    curvatureMax: num(p?.curvature_max ?? p?.curvatureMax ?? 0),
    fordRoman: { value: zeta, limit: 1.0, status: fordRomanStatus },
    sectorStrobing: sectors,
    activeTiles: tiles,
    totalTiles: num(p?.totalTiles ?? N_tiles, 0),
    gammaVanDenBroeck: gammaVdB,
    modelMode: (p?.modelMode ?? "calibrated") as any,
    hull: geometry ? { Lx_m: geometry.Lx_m, Ly_m: geometry.Ly_m, Lz_m: geometry.Lz_m } : undefined,
    shiftVector: arrN(p?.shiftVector, 3) ? {
      epsilonTilt: num(p.shiftVector[0]),
      betaTiltVec: [num(p.shiftVector[0]), num(p.shiftVector[1]), num(p.shiftVector[2])],
      gTarget: num(p?.shiftVector?.gTarget ?? 1),
      R_geom: num(p?.shiftVector?.R_geom ?? Llong_m),
      gEff_check: num(p?.shiftVector?.gEff_check ?? 1)
    } : undefined,
    tiles: { tileArea_cm2: tileArea, hullArea_m2: hullArea, N_tiles },
    timescales: T_m_s > 0 ? {
      f_m_Hz, T_m_s, L_long_m: Llong_m, T_long_s: T_LC_s, TS_long, TS_geom: TS_long
    } : undefined,
    geometry, // Legacy compatibility
    // Strobing metrics (undefined when not available)
    ...strobingMetrics
  };
}

import { useState, useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
type DerivedMetrics = {
  timestamp: number;
  dutyFR?: number | undefined;
  sectorCount?: number | undefined;
  currentSector?: number | undefined;
};

/**
 * useMetrics(pollMs)
 * - Lightweight stub for metrics polling used in debugging.
 * - Returns { data } where data starts null and is populated with a small object.
 */
export function useMetrics(pollMs = 2000) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      if (!mounted) return;
      // Prefer the canonical energy pipeline snapshot from react-query cache
      try {
        const pipeline = queryClient.getQueryData(['/api/helix/pipeline']) as any | undefined;
        if (pipeline) {
          // Derive a compact HelixMetrics-like view for UI consumers
          const derived = deriveMetricsFromPipeline(pipeline);
          // Merge pipeline payload with derived fields so callers can access both
          setData({ ...pipeline, ...derived, pipeline });
          return;
        }
      } catch {}

      // Fallback: minimal metrics payload to keep consumers functional
      setData((prev: DerivedMetrics | null) => prev ?? {
        timestamp: Date.now(),
        dutyFR: undefined,
        sectorCount: undefined,
        currentSector: undefined
      });
    };
    tick();
    const id = window.setInterval(tick, Math.max(250, pollMs));
    return () => { mounted = false; clearInterval(id); };
  }, [pollMs]);

  return { data };
}

export default useMetrics;