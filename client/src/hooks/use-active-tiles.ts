import { useEffect, useMemo, useRef, useState } from "react";

type LC = { burst_ms?: number; dwell_ms?: number; phase?: number; sectorCount?: number };

export function useActiveTiles(opts: {
  totalTiles?: number;              // from pipeline or metrics
  totalSectors: number;             // e.g., 400
  concurrentSectors: number;        // e.g., 1 or 2
  dutyEffectiveFR: number;          // from your lc-based compute
  tilesPerSector?: number;          // optional override (server)
  lc?: LC;
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
    const bad =
      !Number.isFinite(lc?.phase) ||
      !Number.isFinite(lc?.burst_ms) ||
      !Number.isFinite(lc?.dwell_ms) ||
      (Number.isFinite(lc?.dwell_ms) && (lc!.dwell_ms as number) <= 0);
    if (lc && bad) {
      console.warn("[HELIX] LC loop missing/invalid timing — 'now' tiles will be flat", {
        phase: lc?.phase,
        burst_ms: lc?.burst_ms,
        dwell_ms: lc?.dwell_ms,
      });
    }
  }, [lc?.phase, lc?.burst_ms, lc?.dwell_ms]);

  // Hardened input sanitization
  const T       = Math.max(0, Number(totalTiles) || 0);
  const fr      = Math.max(0, Math.min(1, Number(dutyEffectiveFR) || 0));
  const S_total = Math.max(1, Math.floor(Number(totalSectors) || 1));
  const S_live  = Math.max(1, Math.floor(Number(concurrentSectors) || 1));
  const EMA     = Math.min(1, Math.max(0, Number(ema)));

  // Warn if dutyEffectiveFR was computed with different sector assumptions
  useEffect(() => {
    if (lc?.sectorCount && lc.sectorCount !== S_total) {
      console.warn("[HELIX] Sector count mismatch between dutyEffectiveFR calculation and hook:", {
        hookSectors: S_total,
        lcSectors: lc.sectorCount,
        note: "This may cause drift in avgTiles calculation",
      });
    }
  }, [S_total, lc?.sectorCount]);

  // average (FR) energized tiles across the whole ship
  const avgTiles = useMemo(() => Math.round(T * fr), [T, fr]);

  // local burst fraction
  const burstLocal = useMemo(() => {
    if (
      !lc ||
      !Number.isFinite(lc.burst_ms) ||
      !Number.isFinite(lc.dwell_ms) ||
      (lc.dwell_ms as number) <= 0
    ) return 0.01;
    return Math.max(0, Math.min(1, (lc.burst_ms as number) / (lc.dwell_ms as number)));
  }, [lc?.burst_ms, lc?.dwell_ms]);

  // instantaneous gate
  const inBurstNow = useMemo(() => {
    if (
      !lc ||
      !Number.isFinite(lc.phase) ||
      !Number.isFinite(lc.burst_ms) ||
      !Number.isFinite(lc.dwell_ms) ||
      (lc.dwell_ms as number) <= 0
    ) return false;
    const dwell = lc.dwell_ms as number;
    const t = (lc.phase as number) % dwell;
    return t < (lc.burst_ms as number);
  }, [lc?.phase, lc?.burst_ms, lc?.dwell_ms]);

  const instBase = (tilesPerSector ?? Math.floor(T / S_total));
  const instantTiles = (inBurstNow ? instBase * S_live * burstLocal : 0);

  // EMA smoothing for "now"
  const [instantSmooth, setInstantSmooth] = useState(0);
  useEffect(() => {
    const target = Number.isFinite(instantTiles) ? instantTiles : 0;
    setInstantSmooth(prev => prev + EMA * (target - prev));
  }, [instantTiles, EMA]);

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
    avgTiles,                                  // integer
    instantTiles: Number(instantTiles) || 0,   // fractional by design
    instantTilesSmooth: Math.round(instantSmooth || 0),
    burstLocal,
    inBurstNow,
  };
}
