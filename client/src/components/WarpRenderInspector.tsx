import React, {useEffect, useMemo, useRef, useState} from "react";
import WarpRenderCheckpointsPanel from "./warp/WarpRenderCheckpointsPanel";
import { useEnergyPipeline, useSwitchMode } from "@/hooks/use-energy-pipeline";
import { useQueryClient } from "@tanstack/react-query";

/**
 * WarpRenderInspector
 *
 * A focused panel to verify that operational-mode + calculator payloads are
 * actually reaching WarpEngine, using the same dual-instance pattern as
 * WarpBubbleCompare. It mounts two canvases (REAL/SHOW), pushes calculator
 * outputs through the exact keys WarpEngine consumes, and exposes quick
 * controls to exaggerate differences so they are visually undeniable.
 *
 * Requirements: `warp-engine.js` must already be loaded and expose
 *   `window.WarpEngine`.
 */

// ---- Utility: type-light helpers -------------------------------------------
type Num = number | undefined | null;
const N = (x: Num, d = 0) => (Number.isFinite(x as number) ? Number(x) : d);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// Push only after shaders are ready
function pushUniformsWhenReady(engine: any, patch: Record<string, any>) {
  if (!engine) return;
  if (engine.isLoaded && engine.gridProgram) {
    engine.updateUniforms(patch);
  } else {
    engine.onceReady(() => engine.updateUniforms(patch));
  }
}

// A safe camera helper (optional override)
function compactCameraZ(axesScene?: number[] | null) {
  const ax = axesScene || [1,1,1];
  const R = Math.max(ax[0], ax[1], ax[2]) || 1;
  return Math.max(1.2, 1.8 * R);
}

// Mode → visual seasoning presets (so changes are obvious)
const MODE_PRESET: Record<string, {curvT:number; boost:number; displayGain:number}> = {
  hover:     { curvT: 0.25, boost: 20, displayGain: 1.0 },
  cruise:    { curvT: 0.45, boost: 30, displayGain: 2.0 },
  emergency: { curvT: 0.70, boost: 40, displayGain: 6.0 },
  standby:   { curvT: 0.00, boost:  1, displayGain: 1.0 },
};

// ---- Component --------------------------------------------------------------
export default function WarpRenderInspector(props: {
  // Optional: calculator outputs. Pass exactly what your calculator returns
  // (REAL/FR vs SHOW/UI). Any missing fields fall back safely.
  parityPhys?: Record<string, any>;
  showPhys?: Record<string, any>;
  baseShared?: Record<string, any>; // e.g. hull, sectors/split, colorMode, etc.
}){
  const leftRef = useRef<HTMLCanvasElement>(null);   // REAL
  const rightRef = useRef<HTMLCanvasElement>(null);  // SHOW
  const leftEngine = useRef<any>(null);
  const rightEngine = useRef<any>(null);

  // Live energy pipeline data for diagnostics
  const { data: live } = useEnergyPipeline();
  const switchMode = useSwitchMode();
  const queryClient = useQueryClient();

  // Get current mode from global energy pipeline instead of local state
  const currentMode = ((live as any)?.currentMode as 'hover'|'cruise'|'emergency'|'standby') || 'hover';
  const [mode, setMode] = useState<'hover'|'cruise'|'emergency'|'standby'>(currentMode);

  // Sync local mode with global mode
  useEffect(() => {
    setMode(currentMode);
  }, [currentMode]);
  const [ridgeMode, setRidgeMode] = useState<0|1>(1); // 0=physics df, 1=single crest
  const [colorMode, setColorMode] = useState<'theta'|'shear'|'solid'>('theta');
  const [userGain, setUserGain] = useState(1);
  const [decades, setDecades] = useState(0.6 * 8); // UI slider 0..8 → 0..1

  // Pulled from calculator (if present). Keeps names WarpEngine expects.
  const shared = useMemo(() => ({
    colorMode,
    ridgeMode,
    lockFraming: true,
    hull: { a: 503.5, b: 132, c: 86.5 }, // default hull
    gridSpan: 2.6,
    sectors: 400,
    split: 0,
    ...props.baseShared,
  }), [props.baseShared, colorMode, ridgeMode]);

  // Build REAL and SHOW payloads using canonical keys and aliases.
  const realPayload = useMemo(() => {
    const p = props.parityPhys || {};
    return {
      ...shared,
      // geometry
      hull: p.hull || p.hullDims || shared.hull,
      hullAxes: p.hullAxes || undefined, // let engine derive from hull if absent
      gridSpan: p.gridSpan ?? shared.gridSpan,
      // physics chain & overrides
      physicsParityMode: true,
      gammaGeo: N(p.gammaGeo ?? p.g_y, 26),
      deltaAOverA: N(p.deltaAOverA ?? p.qSpoilingFactor, 1),
      gammaVdB: N(p.gammaVdB ?? p.gammaVanDenBroeck, 2.86e5),
      dutyCycle: N(p.dutyCycle, 0.14),
      // FR duty override → use it if calculator provides one
      dutyEffectiveFR: N(p.dutyEffectiveFR ?? p.dutyEff ?? p.dutyFR, undefined),
      sectors: Math.max(1, Math.floor(N(p.sectors ?? p.sectorCount, shared.sectors ?? 1))),
      split: Math.max(0, Math.floor(N(p.split ?? p.sectorSplit ?? shared.split, 0))),
      // conservative visuals
      exposure: 3.5,
      zeroStop: 1e-5,
      curvatureGainT: 0.0,
      curvatureBoostMax: 1,
      vizGain: 1,
      displayGain: 1,
      userGain: 1, // keep REAL parity visually "true"
      currentMode: mode,
    };
  }, [props.parityPhys, shared, userGain, mode]);

  const showPayload = useMemo(() => {
    const p = props.showPhys || {};
    const T = clamp01(decades / 8);
    const mp = MODE_PRESET[mode] || MODE_PRESET.hover;
    return {
      ...shared,
      physicsParityMode: false,
      hull: p.hull || p.hullDims || shared.hull,
      hullAxes: p.hullAxes || undefined, // let engine derive from hull if absent
      gridSpan: p.gridSpan ?? shared.gridSpan,
      gammaGeo: N(p.gammaGeo ?? p.g_y, 26),
      deltaAOverA: N(p.deltaAOverA ?? p.qSpoilingFactor, 1),
      gammaVdB: N(p.gammaVdB ?? p.gammaVanDenBroeck, 2.86e5),
      dutyCycle: N(p.dutyCycle, 0.14),
      sectors: Math.max(1, Math.floor(N(p.sectors ?? p.sectorCount, shared.sectors ?? 1))),
      split: Math.max(0, Math.floor(N(p.split ?? p.sectorSplit ?? shared.split, 0))),
      // boosted visuals (operational-mode seasoning baked in so you can SEE it)
      curvatureGainT: Math.max(mp.curvT, T),
      curvatureBoostMax: Math.max(mp.boost, 20),
      zeroStop: 1e-7,
      exposure: 6.0,
      vizGain: 1.0,
      displayGain: Math.max(1, mp.displayGain),
      userGain: Math.max(1, userGain),
      currentMode: mode,
    };
  }, [props.showPhys, shared, userGain, decades, mode]);

  // Reuse-or-create guard so we never attach twice to the same canvas
  const ENGINE_KEY = '__warpEngine';

  function getOrCreateEngine<WarpType = any>(Ctor: new (c: HTMLCanvasElement) => WarpType, cv: HTMLCanvasElement): WarpType {
    const existing = (cv as any)[ENGINE_KEY];
    if (existing && !existing._destroyed) return existing as WarpType;
    const eng = new Ctor(cv);
    (cv as any)[ENGINE_KEY] = eng;
    return eng;
  }

  // Engine creation & lifecycle
  useEffect(() => {
    const W: any = (window as any).WarpEngine;
    if (!W) { console.error("WarpEngine not found on window. Load warp-engine.js first."); return; }

    if (leftRef.current && !leftEngine.current)  {
      // DPR-safe size before GL init
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      leftRef.current.width  = Math.max(1, Math.floor((leftRef.current.clientWidth  || 800) * dpr));
      leftRef.current.height = Math.max(1, Math.floor((leftRef.current.clientHeight || 450) * dpr));
      leftEngine.current  = getOrCreateEngine(W, leftRef.current);
    }
    if (rightRef.current && !rightEngine.current) {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      rightRef.current.width  = Math.max(1, Math.floor((rightRef.current.clientWidth  || 800) * dpr));
      rightRef.current.height = Math.max(1, Math.floor((rightRef.current.clientHeight || 450) * dpr));
      rightEngine.current = getOrCreateEngine(W, rightRef.current);
    }

    // Bootstrap; fit camera after link using derived axes
    leftEngine.current?.bootstrap({ ...realPayload });
    rightEngine.current?.bootstrap({ ...showPayload });
    leftEngine.current?.onceReady?.(() => {
      const ax = leftEngine.current?.uniforms?.axesClip;
      const cz = compactCameraZ(ax);
      leftEngine.current.updateUniforms({ cameraZ: cz, lockFraming: true });
    });
    rightEngine.current?.onceReady?.(() => {
      const ax = rightEngine.current?.uniforms?.axesClip;
      const cz = compactCameraZ(ax);
      rightEngine.current.updateUniforms({ cameraZ: cz, lockFraming: true });
      // optional: mirror display gain through helper
      const dg = Math.max(1, (showPayload as any)?.displayGain || 1);
      rightEngine.current.setDisplayGain?.(dg);
    });

    // Diagnostics -> window for quick comparison
    leftEngine.current && (leftEngine.current.onDiagnostics  = (d: any) => ((window as any).__diagREAL = d));
    rightEngine.current && (rightEngine.current.onDiagnostics = (d: any) => ((window as any).__diagSHOW = d));

    return () => {
      try { leftEngine.current?.destroy(); } catch {}
      try { rightEngine.current?.destroy(); } catch {}
      leftEngine.current = null as any;
      rightEngine.current = null as any;

      // Robust cleanup for HMR/StrictMode
      if (leftRef.current) {
        try {
          if ((leftRef.current as any)[ENGINE_KEY] && !(leftRef.current as any)[ENGINE_KEY]._destroyed) {
            (leftRef.current as any)[ENGINE_KEY].destroy?.();
          }
          delete (leftRef.current as any)[ENGINE_KEY];
        } catch {}
      }
      
      if (rightRef.current) {
        try {
          if ((rightRef.current as any)[ENGINE_KEY] && !(rightRef.current as any)[ENGINE_KEY]._destroyed) {
            (rightRef.current as any)[ENGINE_KEY].destroy?.();
          }
          delete (rightRef.current as any)[ENGINE_KEY];
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply payloads any time calculator/shared/controls change
  useEffect(() => {
    if (!leftEngine.current || !rightEngine.current) return;
    // sanitize a few hot-path values
    const safe = (o:any)=>({
      ...o,
      sectors: Math.max(1, Math.floor(N(o.sectors, 1))),
      split: Math.max(0, Math.floor(N(o.split, 0))),
      exposure: Math.max(1, Math.min(12, N(o.exposure, 6))),
      zeroStop: Math.max(1e-9, N(o.zeroStop, 1e-7)),
    });
    // REAL
    pushUniformsWhenReady(leftEngine.current, {
      ...safe(realPayload),
      ridgeMode: 0,
      physicsParityMode: true,
    });

    // SHOW
    pushUniformsWhenReady(rightEngine.current, {
      ...safe(showPayload),
      ridgeMode: 1,
      physicsParityMode: false,
    });

    // Optional camera sweetener so both keep same framing
    const ax = (shared as any).axesScene || leftEngine.current?.uniforms?.axesClip;
    const cz = compactCameraZ(ax);
    pushUniformsWhenReady(leftEngine.current,  { cameraZ: cz });
    pushUniformsWhenReady(rightEngine.current, { cameraZ: cz });
  }, [realPayload, showPayload, shared]);

  // Keep canvases crisp on container resize
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const c of [leftRef.current, rightRef.current]) {
        if (!c) continue;
        const w = Math.max(1, Math.floor((c.clientWidth  || 1) * dpr));
        const h = Math.max(1, Math.floor((c.clientHeight || 1) * dpr));
        if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      }
      leftEngine.current?._resize?.();
      rightEngine.current?._resize?.();
    });
    leftRef.current && ro.observe(leftRef.current);
    rightRef.current && ro.observe(rightRef.current);
    return () => ro.disconnect();
  }, []);

  // Wire strobing once; both engines receive the same stream
  useEffect(() => {
    const add = (window as any).__addStrobingListener as undefined | ((cb: any) => () => void);
    if (!add) return;
    const off = add(({ sectorCount, currentSector, split }: any) => {
      const s = Math.max(1, sectorCount|0);
      const sp = Number.isFinite(split) ? (split|0) : (currentSector|0);
      const payload = { sectors: s, split: Math.max(0, Math.min(s - 1, sp)) };
      pushUniformsWhenReady(leftEngine.current,  payload);
      pushUniformsWhenReady(rightEngine.current, payload);
    });
    return () => { try { off?.(); } catch {} };
  }, []);

  // UI events - use global mode switching instead of local state
  const onMode = (m: 'hover'|'cruise'|'emergency'|'standby') => {
    switchMode.mutate(m as any, {
      onSuccess: () => {
        // Refresh both pipeline and metrics to keep everything in sync
        queryClient.invalidateQueries({ queryKey: ['/api/helix/pipeline'] });
        queryClient.invalidateQueries({ queryKey: ['/api/helix/metrics'] });
      }
    });
  };

  return (
    <div className="w-full grid gap-4 p-4">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold">Operational Render Inspector</h2>
          <p className="text-sm text-neutral-500">REAL (Ford–Roman parity) vs SHOW (UI boosted) — uses the same render path as WarpBubbleCompare.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Mode</label>
          {(['hover','cruise','emergency','standby'] as const).map(m => (
            <button
              key={m}
              onClick={() => onMode(m)}
              className={`px-3 py-1 rounded-2xl text-sm border ${mode===m? 'bg-blue-600 text-white border-blue-600' : 'border-neutral-300 hover:bg-neutral-100'}`}
            >{m}</button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <article className="rounded-2xl border border-neutral-200 bg-neutral-950/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">REAL — Parity (Ford–Roman)</h3>
            <div className="text-xs text-neutral-400">ridgeMode=0 • {colorMode}</div>
          </div>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black/90">
            <canvas ref={leftRef} className="w-full h-full block"/>
          </div>
        </article>
        <article className="rounded-2xl border border-neutral-200 bg-neutral-950/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">SHOW — Boosted (UI)</h3>
            <div className="text-xs text-neutral-400">ridgeMode=1 • {colorMode}</div>
          </div>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black/90">
            <canvas ref={rightRef} className="w-full h-full block"/>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-200 p-4">
          <h4 className="font-medium mb-3">Visual Controls</h4>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm">Color</label>
            <select value={colorMode} onChange={e=>setColorMode(e.target.value as any)} className="border rounded px-2 py-1 text-sm">
              <option value="theta">theta (diverging)</option>
              <option value="shear">shear (teal→lime)</option>
              <option value="solid">solid</option>
            </select>
          </div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm">Ridge</label>
            <select value={ridgeMode} onChange={e=>setRidgeMode(Number(e.target.value) as 0|1)} className="border rounded px-2 py-1 text-sm">
              <option value={0}>0 — physics df (double-lobe)</option>
              <option value={1}>1 — single crest at ρ=1</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="text-sm">Decades blend (T) — SHOW</label>
            <input type="range" min={0} max={8} step={0.01} value={decades}
              onChange={e=>setDecades(Number(e.target.value))} className="w-full"/>
            <div className="text-xs text-neutral-500">T={(decades/8).toFixed(2)} • boost≤40</div>
          </div>
          <div className="mb-2">
            <label className="text-sm">User Gain (both)</label>
            <input type="range" min={1} max={64} step={0.1} value={userGain}
              onChange={e=>setUserGain(Number(e.target.value))} className="w-full"/>
            <div className="text-xs text-neutral-500">{userGain.toFixed(2)}×</div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 p-4">
          <h4 className="font-medium mb-3">Strobing</h4>
          <div className="text-sm text-neutral-600 mb-2">Use your existing strobing emitter; this panel listens and forwards to both engines.</div>
          <div className="text-xs text-neutral-500">Tip: in DevTools → `window.setStrobingState({'{'}sectorCount:6,currentSector:2{'}'});`</div>
        </div>

        <div className="rounded-2xl border border-neutral-200 p-4">
          <h4 className="font-medium mb-3">Live Engine Snapshot</h4>
          <button
            className="px-3 py-1 rounded bg-neutral-900 text-white text-sm"
            onClick={() => {
              const L = leftEngine.current?.uniforms; const R = rightEngine.current?.uniforms;
              console.table({
                REAL_thetaScale: L?.thetaScale, SHOW_thetaScale: R?.thetaScale,
                REAL_gammaVdB: L?.gammaVdB, SHOW_gammaVdB: R?.gammaVdB,
                REAL_dutyFR: (leftEngine.current?.uniforms as any)?.dutyEffectiveFR,
                REAL_dutyCycle: L?.dutyCycle, SHOW_dutyCycle: R?.dutyCycle,
                sectors: L?.sectors, split: L?.split,
                REAL_parity: L?.physicsParityMode, SHOW_parity: R?.physicsParityMode,
              });
              console.log('REAL diag', (window as any).__diagREAL);
              console.log('SHOW diag', (window as any).__diagSHOW);
            }}
          >Dump uniforms + diagnostics</button>
          <p className="text-xs text-neutral-500 mt-2">Opens a concise table/diagnostics in DevTools.</p>
        </div>
      </section>

      {/* Comprehensive WebGL diagnostics panel */}
      <WarpRenderCheckpointsPanel
        leftLabel="REAL"
        rightLabel="SHOW"
        leftEngineRef={leftEngine}
        rightEngineRef={rightEngine}
        leftCanvasRef={leftRef}
        rightCanvasRef={rightRef}
        live={live}
      />
    </div>
  );
}