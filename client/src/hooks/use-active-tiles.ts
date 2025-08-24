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

  const S_total = Math.max(1, Math.floor(totalSectors || 400));
  const S_live  = Math.max(1, Math.floor(concurrentSectors || 1));

  // average (FR) energized tiles across the whole ship
  const avgTiles = useMemo(() => {
    return Number.isFinite(totalTiles) ? Math.round((totalTiles as number) * dutyEffectiveFR) : undefined;
  }, [totalTiles, dutyEffectiveFR]);

  // local burst fraction & instantaneous gate
  const burstLocal = (Number.isFinite(lc?.burst_ms) && Number.isFinite(lc?.dwell_ms) && lc!.dwell_ms! > 0)
    ? (lc!.burst_ms! / lc!.dwell_ms!)
    : 0.01;

  const inBurstNow = !!lc && Number.isFinite(lc.phase) && Number.isFinite(lc.burst_ms)
    ? ((lc.phase as number) % (lc!.dwell_ms as number)) < (lc!.burst_ms as number)
    : false;

  const tps = Number.isFinite(tilesPerSector)
    ? (tilesPerSector as number)
    : (Number.isFinite(totalTiles) ? Math.floor((totalTiles as number) / S_total) : 0);

  const instantTiles = (Number.isFinite(totalTiles) && tps > 0)
    ? (inBurstNow ? (S_live * tps) : 0)
    : undefined;

  // EMA smoothing for "now"
  const [instantSmooth, setInstantSmooth] = useState(0);
  useEffect(() => {
    const target = Number.isFinite(instantTiles) ? (instantTiles as number) : 0;
    setInstantSmooth(prev => prev + ema * (target - prev));
  }, [instantTiles, ema]);

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
    avgTiles,                // time-averaged across ship
    instantTiles,            // hard on/off
    instantTilesSmooth: Math.round(instantSmooth),
    burstLocal,              // local duty fraction
    inBurstNow,
  };
}