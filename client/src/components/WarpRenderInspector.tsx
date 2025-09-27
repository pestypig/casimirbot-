// ============================================================================
// File: client/src/components/WarpRenderInspector.tsx  (SSOT v2 patch)
// Purpose: Inspector that ONLY drives physics via the adapter; uses the gate
//          for essentials/cosmetics; never writes physics directly.
// ============================================================================
import React, { useEffect, useRef, useState } from "react";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { useMetrics } from "@/hooks/use-metrics";
// Robust adapter import: works whether the module exports default or named
import * as WarpAdapter from "@/lib/warp-pipeline-adapter";
// Robust gate import: avoids named-export TS errors if names drift
import * as WarpGate from "@/lib/warp-uniforms-gate";
import { thetaScaleExpected } from "@/lib/expectations";

// Resolve adapter function regardless of export shape
const driveWarpFromPipeline =
  (WarpAdapter as any)?.default ??
  (WarpAdapter as any)?.driveWarpFromPipeline ??
  ((eng: any) => eng); // no-op fallback (won't crash TS)

// Bind gate helpers with safe fallbacks
const gatedUpdateUniforms =
  (WarpGate as any)?.gatedUpdateUniforms ??
  ((eng: any, u: any) => eng?.updateUniforms?.(u));
const gatedHeartbeat =
  (WarpGate as any)?.gatedHeartbeat ??
  ((eng: any, u: any) => eng?.updateUniforms?.(u));
const stripPhysics =
  (WarpGate as any)?.withoutPhysics ??
  ((o: any) => o);

/**
 * Minimal, scientific WarpRenderInspector
 * - Single canvas, strict pipeline → engine flow
 * - Adapter is authoritative; engine runs in strictScientific mode
 * - Gate is used for *all* non-adapter writes (essentials & cosmetics)
 */
export default function WarpRenderInspector(_props: any = {}) {
  // DEBUG: Log render cycles
  console.log('🔍 WarpRenderInspector render', { 
    timestamp: Date.now(),
    props: _props 
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<any>(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [webglLost, setWebglLost] = useState(false);
  const [watchdog, setWatchdog] = useState<string | null>(null);
  const watchdogRef = useRef<number>(0);
  // Manual restart token to force re-initialization
  const [restartToken, setRestartToken] = useState(0);
  // backpressure + readiness
  const glReadyRef = useRef(false);
  const creatingRef = useRef(false);
  const lastCommitRef = useRef(0);
  const frameBudgetRef = useRef(33); // ms; starts ~30fps, adapts
  const inFlightRef = useRef(false);
  const flushTimerRef = useRef<number>(0 as any);
  const pendingPipelineRef = useRef<any | null>(null);
  const pendingEssentialsRef = useRef<any | null>(null);
  const restoreTimerRef = useRef<number>(0 as any);
  // optional GPU timer-query support (detected on init; not required)
  const gpuTimerSupportedRef = useRef(false);

  // Live pipeline + metrics
  const { data: live } = useEnergyPipeline({
    refetchOnWindowFocus: false,
    staleTime: 10_000,
  });
  const { data: metrics } = useMetrics(2000);

  // Ensure the public engine exists and attach once (with watchdog + context restore)
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    if (engineRef.current) return; // already created (prevent thrash)
    let cancelled = false;
    let attempts = 0;

    function seedCamera() {
      if (!cv || cancelled) return;
      try {
        const w = cv.clientWidth || cv.width || 800;
        const h = cv.clientHeight || cv.height || 450;
        const aspect = Math.max(0.5, w / Math.max(1, h));
        const a = Number(live?.hull?.a) || 1;
        const b = Number(live?.hull?.b) || 1;
        const c = Number(live?.hull?.c) || 1;
        const R = Math.max(a, b, c) || 1;
        const cameraZ = -R * (2.0 + 0.5 / aspect);
        // meta-only (always allowed)
        gatedHeartbeat(engineRef.current, { __meta: true, cameraZ, lockFraming: true });
      } catch {/* non-fatal */}
    }

    function testWebGL() {
      try {
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 1;
        testCanvas.height = 1;
        const gl = (testCanvas.getContext('webgl2') as WebGL2RenderingContext | null)
          || (testCanvas.getContext('webgl') as WebGLRenderingContext | null)
          || (testCanvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
        if (!gl) return false;
        // Test basic WebGL functionality with type-safe calls
        if ('clearColor' in gl && 'clear' in gl) {
          const wgl = gl as WebGLRenderingContext;
          wgl.clearColor(0, 0, 0, 1);
          wgl.clear(wgl.COLOR_BUFFER_BIT);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }

    function createEngine(reason: string) {
      if (!cv) return;
      if (engineRef.current || creatingRef.current) return;
      creatingRef.current = true;
      
      // Test WebGL first
      if (!testWebGL()) {
        setEngineError("WebGL not supported or disabled in browser");
        setWebglLost(true);
        creatingRef.current = false;
        return;
      }

      const anyWin: any = window as any;
      const W: any = anyWin.WarpEngine;
      if (!W) {
        setEngineError("WarpEngine script not loaded (public /warp-engine.js).");
        creatingRef.current = false;
        return;
      }
  try {
        // Force canvas size before engine creation
        cv.width = Math.max(320, cv.clientWidth || 800);
        cv.height = Math.max(240, cv.clientHeight || 450);
        
        if (typeof W.getOrCreate === "function") {
          engineRef.current = W.getOrCreate(cv, { strictScientific: true });
        } else if (typeof W === "function") {
          engineRef.current = (cv as any).__warp_instance || ((cv as any).__warp_instance = new W(cv, { strictScientific: true }));
        } else if (typeof W.create === "function") {
          engineRef.current = W.create(cv, { strictScientific: true });
        } else {
          throw new Error("Unknown WarpEngine shape");
        }
        
        // Check if engine creation actually succeeded
        if (!engineRef.current) {
          throw new Error("Engine creation returned null/undefined");
        }
        
        setEngineError(null);
        setWebglLost(false);
        setWatchdog(prev => prev ? prev : `engine-ready (${reason})`);
        glReadyRef.current = true;
        lastCommitRef.current = 0;
        // Immediately push a heartbeat and camera
        
        // Immediately push a heartbeat and camera
        seedCamera();
        if (live) {
          try { driveWarpFromPipeline(engineRef.current, live, { mode: "REAL", strict: true, metrics }); } catch {}
        }
        // Detect GPU timer query availability (optional)
        try {
          const gl: WebGLRenderingContext | undefined = engineRef.current?.gl;
          const hasExt = !!(gl?.getExtension && (gl.getExtension('EXT_disjoint_timer_query') || gl.getExtension('EXT_disjoint_timer_query_webgl2')));
          gpuTimerSupportedRef.current = !!hasExt;
        } catch {}
        // kick any pending frame through the scheduler
        scheduleFlush();
      } catch (e:any) {
        setEngineError(`Failed to create engine: ${e?.message || e}`);
        setWebglLost(true);
      } finally {
        creatingRef.current = false;
      }
    }

    // Inject script dynamically if missing (watchdog)
    function ensureScriptTag() {
      if (document.querySelector('script[data-warp-engine]')) return;
      const tag = document.createElement('script');
      tag.src = '/warp-engine.js';
      tag.async = true;
      tag.dataset.warpEngine = '1';
      tag.onload = () => setWatchdog('script-loaded');
      tag.onerror = () => setEngineError('Failed loading /warp-engine.js');
      document.head.appendChild(tag);
      setWatchdog('script-injected');
    }

    function tick() {
      if (cancelled) return;
      const has = (window as any).WarpEngine;
      if (!has) {
        if (attempts === 0) ensureScriptTag();
        attempts++;
        if (attempts > 160) { // ~8s @50ms
          setEngineError('WarpEngine script not loaded after watchdog retries');
          return;
        }
        watchdogRef.current = window.setTimeout(tick, 50);
        return;
      }
      createEngine('initial');
    }
    tick();

    // WebGL context loss / restore handlers
    function onLost(e: Event) {
      e.preventDefault();
      setWebglLost(true);
      setEngineError('WebGL context lost – attempting restore');
    }
    function onRestored() {
      setWebglLost(false);
      setEngineError(null);
      // Recreate engine fresh
      try { engineRef.current?.destroy?.(); } catch {}
      engineRef.current = null;
      createEngine('context-restored');
    }
    cv.addEventListener('webglcontextlost', onLost as any, false);
    cv.addEventListener('webglcontextrestored', onRestored as any, false);

    return () => {
      cancelled = true;
      if (watchdogRef.current) window.clearTimeout(watchdogRef.current);
      if (restoreTimerRef.current) window.clearTimeout(restoreTimerRef.current);
      cv.removeEventListener('webglcontextlost', onLost as any);
      cv.removeEventListener('webglcontextrestored', onRestored as any);
      try { engineRef.current?.destroy?.(); } catch {}
      engineRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef.current, restartToken]);

  // Drive the engine from the canonical server snapshot (REAL, strict)
  useEffect(() => {
    console.log('🔍 WarpRenderInspector useEffect fired', { 
      live: live?.currentMode, 
      liveDuty: live?.dutyEffectiveFR,
      hasLive: !!live,
      hasMetrics: !!metrics,
      timestamp: Date.now() 
    });
    
    // Use live data if available, otherwise fallback to mock data for standalone testing
    const effectiveLive = live || {
      currentMode: 'hover',
      sectors: 1,
      sectorCount: 400,
      dutyEffectiveFR: 0.25,
      hull: { a: 0.42, b: 0.11, c: 0.09 },
      gammaGeo: 26,
      gammaVanDenBroeck: 134852.59669968978,
      qSpoilingFactor: 1,
      dutyCycle: 0.14,
      __mockData: true // flag to indicate this is fallback data
    };
    
    console.log('🔧 WarpRenderInspector using data:', {
      isLiveData: !!live,
      isMockData: !!effectiveLive.__mockData,
      mode: effectiveLive.currentMode,
      dutyFR: effectiveLive.dutyEffectiveFR,
      gammaGeo: effectiveLive.gammaGeo,
      timestamp: Date.now()
    });
    
    // Stage the latest pipeline + essentials; the scheduler will coalesce
    pendingPipelineRef.current = effectiveLive;
    pendingEssentialsRef.current = {
      mode: effectiveLive?.currentMode || 'hover',
      currentMode: effectiveLive?.currentMode || 'hover',
      sectors: effectiveLive?.sectors || 1,
      sectorCount: effectiveLive?.sectorCount || 400,
      dutyEffectiveFR: effectiveLive?.dutyEffectiveFR ?? 0,
      hullAxes: [
        effectiveLive?.hull?.a || 0.42,
        effectiveLive?.hull?.b || 0.11,
        effectiveLive?.hull?.c || 0.09
      ] as [number,number,number],
      lockFraming: true,
      viewAvg: true,
      thetaSource: 'client' // ensure no server θ latch
    };
    scheduleFlush();
  }, [live, metrics]);

  // --- Backpressure scheduler: flush latest snapshot when budget allows -----
  function scheduleFlush() {
    console.log('[WarpRenderInspector] scheduleFlush called:', {
      hasTimer: !!flushTimerRef.current,
      budget: frameBudgetRef.current,
      lastCommit: lastCommitRef.current,
      now: performance.now()
    });
    if (flushTimerRef.current) return;
    const budget = frameBudgetRef.current;
    const since = performance.now() - lastCommitRef.current;
    const delay = Math.max(0, budget - since);
    flushTimerRef.current = window.setTimeout(flushNow, delay) as any;
    console.log('[WarpRenderInspector] scheduled flush in', delay, 'ms');
  }
  function flushNow() {
    flushTimerRef.current = 0 as any;
    const eng = engineRef.current;
    
    // DEBUG: Check why flushNow isn't running
    console.log('[WarpRenderInspector] flushNow called:', {
      hasEngine: !!eng,
      glReady: glReadyRef.current,
      hasPendingPipeline: !!pendingPipelineRef.current,
      hasPendingEssentials: !!pendingEssentialsRef.current,
      inFlight: inFlightRef.current
    });
    
    if (!eng || !glReadyRef.current) return;
    if (!pendingPipelineRef.current && !pendingEssentialsRef.current) return;
    if (inFlightRef.current) { scheduleFlush(); return; }
    inFlightRef.current = true;
    try {
      const liveSnap = pendingPipelineRef.current; // latest only
      const essentials = pendingEssentialsRef.current;
      pendingPipelineRef.current = null;
      pendingEssentialsRef.current = null;
      
      // DEBUG: Log what we're sending to the engine
      console.log('[WarpRenderInspector] flushNow:', {
        mode: liveSnap?.currentMode,
        dutyEffectiveFR: liveSnap?.dutyEffectiveFR,
        thetaScale: liveSnap?.thetaScale,
        essentials: { 
          thetaSource: essentials?.thetaSource, 
          dutyEffectiveFR: essentials?.dutyEffectiveFR, 
          viewAvg: essentials?.viewAvg 
        },
        engineUniforms: {
          thetaScale: eng?.uniforms?.thetaScale,
          thetaSource: eng?.uniforms?.thetaSource,
          dutyEffectiveFR: eng?.uniforms?.dutyEffectiveFR,
          viewAvg: eng?.uniforms?.viewAvg
        }
      });
      
      // Physics path (adapter is sole author)
      driveWarpFromPipeline(eng, liveSnap, { mode: "REAL", strict: true, metrics });
      // Essentials via gate
      gatedUpdateUniforms(eng, essentials, 'client');
      // Optional neutral cosmetics
      gatedUpdateUniforms(eng, stripPhysics({ exposure: 1.0, zeroStop: 1e-9 }), 'client');
      
      // DEBUG: Log engine state after updates
      console.log('[WarpRenderInspector] after updates:', {
        thetaScale: eng?.uniforms?.thetaScale,
        thetaSource: eng?.uniforms?.thetaSource,
        dutyEffectiveFR: eng?.uniforms?.dutyEffectiveFR,
        viewAvg: eng?.uniforms?.viewAvg
      });
      
      // Measure/adjust budget (cheap, CPU-side)
      const t0 = performance.now();
      eng.forceRedraw?.();
      const t1 = performance.now();
      const cost = Math.max(1, t1 - t0);
      frameBudgetRef.current = Math.max(16, Math.min(66, Math.round(cost * 2))); // ~2× render cost
      lastCommitRef.current = performance.now();
    } catch (e) {
      console.warn("[WarpRenderInspector] flush failed", e);
    } finally {
      inFlightRef.current = false;
      // If new data arrived meanwhile, schedule again
      if (pendingPipelineRef.current || pendingEssentialsRef.current) scheduleFlush();
    }
  }

  // Keep GL viewport in sync with canvas resize (DPR-aware) without recreating the engine
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ro = new ResizeObserver(() => {
      const rect = cv.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (cv.width !== w || cv.height !== h) {
        cv.width = w; cv.height = h;
        try {
          const gl: WebGLRenderingContext | undefined = engineRef.current?.gl;
          gl?.viewport(0, 0, w, h);
        } catch {}
        try { engineRef.current?.forceRedraw?.(); } catch {}
      }
    });
    ro.observe(cv);
    return () => { try { ro.disconnect(); } catch {} };
  }, [canvasRef.current, restartToken]);
  // Minimal status + render surface
  const theta = Number(engineRef.current?.uniforms?.thetaScale);
  const mode  = String(live?.currentMode || "—");
  
  // Compute the expected θ from the live snapshot (server is source of truth)
  const thetaExpected = (() => {
    if (!live) return NaN;
    const gammaGeo = Number(live?.gammaGeo ?? 26);
    const q = Number(live?.qSpoilingFactor ?? live?.deltaAOverA ?? 1);
    const gammaV = Number(live?.gammaVanDenBroeck_vis ?? live?.gammaVanDenBroeck ?? live?.gammaVdB ?? 1);
    const dFR = Number(live?.dutyEffectiveFR ?? 0);
    return thetaScaleExpected({ gammaGeo, qSpoilingFactor: q, gammaVanDenBroeck_vis: gammaV, dutyEffectiveFR: dFR });
  })();
  const thetaMismatch = Number.isFinite(theta) && Number.isFinite(thetaExpected)
    ? Math.abs(theta - thetaExpected) / Math.max(1e-12, Math.abs(thetaExpected))
    : NaN;

  // One-shot self-heal: if in Standby expected ≈ 0 but engine θ is large, re-drive once.
  useEffect(() => {
    if (!engineRef.current || !live) return;
    const isStandby = String(live?.currentMode).toLowerCase() === "standby";
    const expectZero = Number.isFinite(thetaExpected) && Math.abs(thetaExpected) < 1e-6;
    const engineLarge = Number.isFinite(theta) && Math.abs(theta) > 1e3; // your hover-scale order
    if (isStandby && expectZero && engineLarge) {
      try {
        // Clear any server latch then re-drive
        gatedUpdateUniforms(engineRef.current, { thetaSource: 'client' }, 'client');
        driveWarpFromPipeline(engineRef.current, { ...live, dutyEffectiveFR: 0 }, { mode: "REAL", strict: true, metrics });
      } catch {}
    }
  }, [live, metrics, thetaExpected, theta]);

  const hasEngine = !!engineRef.current;
  const hasGL = hasEngine && !!engineRef.current?.gl;
  // Detect Canvas2D engines exported as either ctx2d (warp-engine.js) or ctx (warp-engine-outline.js)
  const hasCanvas = hasEngine && (!!(engineRef.current as any)?.ctx2d || !!(engineRef.current as any)?.ctx);
  const renderBackend = webglLost ? 'lost' : (!hasEngine ? 'pending' : hasGL ? 'webgl' : hasCanvas ? 'canvas' : 'unknown');

  const statusTone = (renderBackend === 'webgl') ? 'text-green-400'
    : (renderBackend === 'canvas') ? 'text-amber-300'
    : (renderBackend === 'lost') ? 'text-red-400'
    : 'text-yellow-400';

  const statusLabel = (() => {
    switch (renderBackend) {
      case 'webgl': return 'WebGL active';
      case 'canvas': return 'Canvas fallback';
      case 'lost': return 'WebGL lost';
      case 'pending': return 'Engine pending';
      default: return 'Backend unknown';
    }
  })();

  return (
    <div className="w-full">
      <div className="text-sm mb-2 opacity-80 flex flex-wrap gap-x-3 gap-y-1">
        <span>Mode: <b>{mode}</b></span>
        <span>θ(engine): {Number.isFinite(theta) ? theta.toExponential(3) : "—"}</span>
        <span>θ(expected): {Number.isFinite(thetaExpected) ? thetaExpected.toExponential(3) : "—"}</span>
        {Number.isFinite(thetaMismatch) && thetaMismatch > 0.05 && (
          <span className="text-amber-300">Δθ {Math.round(thetaMismatch*100)}%</span>
        )}
        <span className={statusTone}>Backend: {statusLabel}</span>
        {watchdog && <span className="opacity-70">{watchdog}</span>}
        {(webglLost || engineError) && (
          <button
            type="button"
            onClick={() => {
              try { engineRef.current?.destroy?.(); } catch {}
              engineRef.current = null;
              setRestartToken((t) => t + 1);
            }}
            className="ml-2 px-2 py-0.5 text-xs rounded border border-amber-500/50 text-amber-200 hover:bg-amber-500/10"
            title="Force re-create the engine and attempt to restore WebGL"
          >Restore WebGL</button>
        )}
      </div>
      {engineError && (
        <div className="p-2 mb-2 rounded bg-red-900/30 border border-red-600/40 text-red-200 text-xs font-mono">
          {engineError}
          {webglLost && (
            <div className="mt-2 text-amber-300">
              Try refreshing the page or check if WebGL is enabled in your browser.
            </div>
          )}
        </div>
      )}
      {!engineError && (
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "min(48vh, 520px)", display: "block", backgroundColor: "#0b1220" }}
          width={960}
          height={540}
        />
      )}
      {renderBackend === 'canvas' && !engineError && (
        <div className="mt-2 text-xs text-amber-200/70 font-mono">
          Canvas fallback active (WebGL did not initialise). Physics values still update; visuals may be simplified.
        </div>
      )}
      {renderBackend === 'pending' && !engineError && (
        <div className="mt-2 text-xs text-slate-300/70 font-mono">
          Initialising warp inspector…
        </div>
      )}
      {renderBackend === 'lost' && (
        <div className="mt-2 text-xs text-red-300/70 font-mono">
          WebGL context lost - attempting to restore...
        </div>
      )}
    </div>
  );
}
