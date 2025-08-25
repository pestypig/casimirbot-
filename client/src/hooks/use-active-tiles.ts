import { useEffect, useMemo, useRef, useState } from "react";

export function useActiveTiles(opts: {
  totalTiles?: number;              // from pipeline or metrics
  totalSectors: number;             // e.g., 400
  concurrentSectors: number;        // e.g., 1 or 2
  dutyEffectiveFR: number;          // from your lc-based compute
  tilesPerSector?: number;          // optional override (server)
  lc?: { burst_ms?: number; dwell_ms?: number; phase?: number; sectorCount?: number };
  serverActiveTiles?: number;       // optional for drift check
  ema?: number;                     // 0..1 smoothing (default .35)
}) {
  const {
    totalTiles,
    totalSectors,
    concurrentSectors,
    dutyEffectiveFR,
    tilesPerSector,
    lc,
    serverActiveTiles,
    ema = 0.35,
  } = opts;

  // Sanity check for light-crossing loop parameters
  useEffect(() => {
    if (!Number.isFinite(lc?.phase) || !Number.isFinite(lc?.burst_ms) || !Number.isFinite(lc?.dwell_ms)) {
      console.warn("[HELIX] LC loop missing timing — 'now' tiles will be flat", {
        phase: lc?.phase,
        burst_ms: lc?.burst_ms,
        dwell_ms: lc?.dwell_ms
      });
    }
  }, [lc?.phase, lc?.burst_ms, lc?.dwell_ms]);

  // Hardened input sanitization
  const T  = Math.max(0, Number(totalTiles) || 0);
  const fr = Math.max(0, Math.min(1, Number(dutyEffectiveFR) || 0));
  const S  = Math.max(1, Number(totalSectors) || 1);
  const live = Math.max(1, Number(concurrentSectors) || 1);
  
  // Use consistent authority for sector count (prefer passed totalSectors)
  const S_total = Math.max(1, Math.floor(S));
  
  // Warn if dutyEffectiveFR was computed with different sector assumptions
  useEffect(() => {
    if (lc?.sectorCount && Math.abs(lc.sectorCount - S_total) > 0.1) {
      console.warn("[HELIX] Sector count mismatch between dutyEffectiveFR calculation and hook:", {
        hookSectors: S_total,
        lcSectors: lc.sectorCount,
        note: "This may cause drift in avgTiles calculation"
      });
    }
  }, [S_total, lc?.sectorCount]);
  const S_live  = Math.max(1, Math.floor(live));

  // average (FR) energized tiles across the whole ship
  const avgTiles = useMemo(() => {
    const result = T * fr;
    return Number.isFinite(result) ? Math.round(result) : 0;
  }, [T, fr]);

  // local burst fraction & instantaneous gate
  const burstLocal = Number.isFinite(lc?.burst_ms) && Number.isFinite(lc?.dwell_ms) && lc!.dwell_ms! > 0
    ? Math.max(0, Math.min(1, lc!.burst_ms! / lc!.dwell_ms!))
    : 0.01;

  const inBurstNow = !!lc && Number.isFinite(lc.phase) && Number.isFinite(lc.burst_ms)
    ? ((lc.phase as number) % (lc!.dwell_ms as number)) < (lc!.burst_ms as number)
    : false;

  const instBase = tilesPerSector ?? Math.floor(T / S);
  const instantTiles = instBase * live * burstLocal;
  const instantResult = inBurstNow ? instantTiles : 0;

  // EMA smoothing for "now"
  const [instantSmooth, setInstantSmooth] = useState(0);
  useEffect(() => {
    const target = Number.isFinite(instantResult) ? instantResult : 0;
    setInstantSmooth(prev => prev + ema * (target - prev));
  }, [instantResult, ema]);

  // drift monitor (warn if server vs derived >5% for 3 consecutive samples)
  const badStreak = useRef(0);
  useEffect(() => {
    if (!Number.isFinite(serverActiveTiles) || !Number.isFinite(avgTiles)) return;
    const srv = serverActiveTiles as number, drv = avgTiles as number;
    const rel = Math.abs(srv - drv) / Math.max(1, drv);
    badStreak.current = rel > 0.05 ? badStreak.current + 1 : 0;
    if (badStreak.current >= 3) {
      console.warn("[HELIX] ActiveTiles drift >5% for 3+ samples:", { server: srv, derived: drv, rel });
      badStreak.current = 0;
    }
  }, [serverActiveTiles, avgTiles]);

  return {
    avgTiles: Number.isFinite(avgTiles) ? avgTiles : 0,
    instantTiles: Number.isFinite(instantResult) ? instantResult : 0,
    instantTilesSmooth: Number.isFinite(instantSmooth) ? Math.round(instantSmooth) : 0,
    burstLocal,
    inBurstNow,
  };
}