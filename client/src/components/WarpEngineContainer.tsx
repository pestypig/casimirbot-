import React, { useEffect, useRef, useState } from "react";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { useMetrics } from "@/hooks/use-metrics";
import { useLightCrossingLoop } from "@/hooks/useLightCrossingLoop";

// Mock greens hook for demonstration purposes
const useGreens = () => ({});

// Refactored to use provided props and mock data structures if necessary for standalone testing
// In the original code, `lc` was not defined, so we'll assume it comes from `useLightCrossing`
// and was intended to be passed down or accessed from a context.
// For this correction, we assume `useLightCrossing` is available and returns `lc`.

export default function WarpEngineContainer(props: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<any>(null);
  const [status, setStatus] = useState<"idle"|"loading"|"ready"|"error">("idle");
  const [err, setErr] = useState<string | null>(null);

  // Get live pipeline data
  const { data: pipeline } = useEnergyPipeline({ refetchInterval: 1000 });
  const { data: metrics } = useMetrics(2000);
  // Hook returns a plain object (not {data}); also accept undefined pipeline fields safely.
  const lc = useLightCrossingLoop({
    sectorStrobing: Number.isFinite(pipeline?.sectorCount) ? (pipeline!.sectorCount as number) : 400,
    currentSector:  (metrics as any)?.sectorIdx ?? 0,
    sectorPeriod_ms: (pipeline as any)?.sectorPeriod_ms ?? 1,
    wallWidth_m:     (pipeline as any)?.wallWidth_m ?? (pipeline as any)?.lc?.wallWidth_m ?? 1.0,
    freqGHz:         (pipeline as any)?.modulationFreq_GHz ?? 15,
    localBurstFrac:  (pipeline as any)?.burstLocal ?? 0.01,
  }); // τ_LC, dwell, burst, phase, sector, onWindow
  const greens = useGreens();

  useEffect(() => {
    let cancelled = false;
    let retries = 0;
    let timer: any = null;

    function step() {
      if (cancelled) return;
      const W: any = (window as any).WarpEngine;
      const cvs = canvasRef.current;
      if (!cvs) { timer = setTimeout(step, 50); return; }
      if (!W || typeof W.getOrCreate !== "function") {
        // Wait for script load; retry a bit longer on cold loads
        if (retries++ < 200) { setStatus("loading"); timer = setTimeout(step, 50); return; }
        setStatus("error"); setErr("WarpEngine script not loaded"); return;
      }
      try {
        const eng = W.getOrCreate(cvs);
        engineRef.current = eng;
        setStatus(eng.isLoaded?.() ? "ready" : "loading");
        // Subscribe to ready
        const unsub = eng.onceReady?.(() => {
          if (cancelled) return;
          setStatus("ready");
          try { eng.requestRewarp?.(); } catch(_) {}
        });
        // Initial draw attempt
        try { eng.requestRewarp?.(); } catch(_) {}
        // Cleanup
        return () => { unsub && unsub(); };
      } catch (e: any) {
        setStatus("error"); setErr(e?.message || String(e));
      }
    }
    const cleanup = step();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      try { engineRef.current?.destroy?.(); } catch(_) {}
    };
  }, []);

  // State for comparison view
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (!engineRef.current) return;
    const engine = engineRef.current;

    // Update engine properties based on pipeline data
    if (pipeline) {
      engine.setModulationFrequency(pipeline.modulationFreq_GHz * 1e9);
      engine.setDutyCycle(pipeline.dutyEffectiveFR);
      engine.setGreens(greens);
    }

    // Update engine properties based on metrics data
    if (metrics) {
      // Assuming metrics structure includes relevant properties like phase, etc.
      // Example: engine.setPhase(metrics.phase);
    }
  }, [pipeline, metrics, greens]); // Added greens to dependencies

  // --- NEW: push Light-Crossing timeline into engines each tick --------------
  useEffect(() => {
    if (!engineRef.current) return;
    if (!lc) return;
    // Compute TS ratio if modulation freq is present
    const fGHz = Number.isFinite(pipeline?.modulationFreq_GHz) ? +pipeline!.modulationFreq_GHz! : NaN;
    const Tm_ms = Number.isFinite(fGHz) ? (1000.0 / (fGHz * 1e9)) : NaN; // ms
    const tauLC_ms = +lc.tauLC_ms ?? NaN;
    const TS_ratio = (Number.isFinite(tauLC_ms) && Number.isFinite(Tm_ms) && Tm_ms > 0) ? (tauLC_ms / Tm_ms) : undefined;

    const payload = {
      tauLC_ms: lc.tauLC_ms,
      dwell_ms: lc.dwell_ms,
      burst_ms: lc.burst_ms,
      phase: lc.phase,
      sectorIdx: lc.sectorIdx,
      sectorCount: lc.sectorCount,
      onWindow: !!lc.onWindow,
      TS_ratio,
      dutyEffectiveFR: (pipeline as any)?.dutyEffectiveFR
    };
    engineRef.current?.setLightCrossing?.(payload);
  }, [lc?.tauLC_ms, lc?.dwell_ms, lc?.burst_ms, lc?.phase, lc?.sectorIdx, lc?.sectorCount, lc?.onWindow, pipeline?.modulationFreq_GHz, (pipeline as any)?.dutyEffectiveFR]);

  // --- NEW: set a deterministic cameraZ and forward view/tensors -------------
  useEffect(() => {
    if (!engineRef.current) return;
    const z = 3.0; // stable frame (tweak if you have a UI knob)
    const vf: [number,number,number] = [0,0,-1]; // camera looks -Z in our scene
    const g0i = (pipeline as any)?.natario?.g0i || (pipeline as any)?.natario?.shiftBeta || undefined;
    const pack = {
      cameraZ: z,
      viewForward: vf,
      ...(Array.isArray(g0i) ? { g0i } : {})
    };
    engineRef.current.updateUniforms?.(pack);
  }, [pipeline?.natario]);


  // Drive engines from pipeline data
  useEffect(() => {
    if (!pipeline) return;
    const engine = engineRef.current;
    if (!engine) return;

    // Set initial state or update based on pipeline data
    // Example: engine.setWarpFactor(pipeline.warpFactor);
    // Note: The original code had requestRewarp in the initial setup useEffect.
    // If this effect is meant to drive continuous updates, those would go here.
    // For now, keeping it aligned with the provided diff.
  }, [pipeline]);


  if (status === "error") {
    return (
      <div className={"flex items-center justify-center " + (props.className||"")}>
        <div className="text-red-400 text-sm font-mono">
          WarpEngine error: {err}
        </div>
      </div>
    );
  }
  if (status !== "ready") {
    return (
      <div className={"flex items-center justify-center " + (props.className||"")}>
        <div className="text-gray-400 text-sm font-mono">
          WarpEngine status: {status}
        </div>
      </div>
    );
  }

  return <canvas ref={canvasRef} className={props.className} />;
}