import { useEffect, useMemo, useRef, useState } from "react";

type HullLike = { a: number; b: number; c: number };
type Args = {
  sectorStrobing?: number;      // S (e.g., 1 or 400)
  currentSector?: number;       // server index (0..S-1)
  sectorPeriod_ms?: number;     // dwell per sector
  duty?: number;                // global duty (0..1)
  freqGHz?: number;             // tile modulation frequency
  hull?: HullLike;              // ellipsoid axes (meters)
  wallWidth_m?: number;         // physical wall thickness
};

export function useLightCrossingLoop({
  sectorStrobing = 1,
  currentSector = 0,
  sectorPeriod_ms = 1,
  duty = 0.14,
  freqGHz = 15,
  hull,
  wallWidth_m = 6.0,
}: Args) {
  // --- Light-crossing estimate (choose the *shortest relevant* length scale)
  // Using the wall thickness gives a strict local bound; feel free to swap
  // to min semi-axis or mean chord if you want a different control policy.
  const c = 299_792_458;
  const L_m = Math.max(1e-6, wallWidth_m); // clamp
  const tauLC_ms = (L_m / c) * 1e3;        // ms

  // --- 1% local ON window inside each sector's dwell (authentic physics)
  const localBurstFrac = 0.01;
  const dwell_ms = Math.max(0.01, sectorPeriod_ms);
  const burst_ms = Math.max(tauLC_ms, dwell_ms * localBurstFrac); // enforce τLC bound

  // --- UI latch system for stable ON/OFF display
  const UI_HOLD_MS = 200; // how long we keep the ON label visible
  const [displayOn, setDisplayOn] = useState(false);
  const lastOnRef = useRef<number>(0);

  // --- Phase clock synced to server's sector pointer
  const [phase, setPhase] = useState(0);           // 0..1 within current sector
  const [sectorIdx, setSectorIdx] = useState(currentSector % Math.max(1, sectorStrobing));
  const rafRef = useRef<number | null>(null);
  const t0Ref = useRef(performance.now());

  // keep clock continuous but snap when server index jumps
  useEffect(() => {
    setSectorIdx(currentSector % Math.max(1, sectorStrobing));
    t0Ref.current = performance.now(); // realign start of dwell
  }, [currentSector, sectorStrobing]);

  useEffect(() => {
    const tick = () => {
      const now = performance.now();
      const dt = now - t0Ref.current;
      const φ = (dt % dwell_ms) / dwell_ms; // 0..1
      setPhase(φ);
      
      // Calculate raw ON window (authentic physics)
      const half = (burst_ms / dwell_ms) / 2; // fraction
      const center = 0.5;
      const dist = Math.abs(φ - center);
      const onWindowRaw = dist <= half;
      
      // Record last ON time for UI latch
      if (onWindowRaw) lastOnRef.current = now;
      
      // UI latch: stays ON for UI_HOLD_MS after any real ON
      const onLatched = onWindowRaw || (now - lastOnRef.current) < UI_HOLD_MS;
      setDisplayOn(onLatched);
      
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [dwell_ms, burst_ms, UI_HOLD_MS]);

  const onWindow = useMemo(() => {
    // center a burst window of width = burst_ms inside the dwell
    const half = (burst_ms / dwell_ms) / 2; // fraction
    const center = 0.5;
    const dist = Math.abs(phase - center);
    return dist <= half;
  }, [phase, burst_ms, dwell_ms]);

  return {
    // shared timeline
    sectorIdx,
    sectorCount: Math.max(1, sectorStrobing),
    phase,            // 0..1 within dwell
    dwell_ms,
    tauLC_ms,
    burst_ms,
    duty,
    freqGHz,
    onWindow,         // boolean: raw physics ON window (for WarpEngine sync)
    onWindowRaw: onWindow,  // explicit alias for authentic physics
    onWindowDisplay: displayOn, // UI latch: stable display state for labels
  };
}