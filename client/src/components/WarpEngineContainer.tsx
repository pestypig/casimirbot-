import React, { useEffect, useRef, useState } from "react";

// Mock imports for demonstration purposes if not running in a context with these available
// const useEnergyPipeline = () => ({ data: { modulationFreq_GHz: 10, dutyEffectiveFR: 0.5 } });
// const useMetrics = () => ({});
// const useGreens = () => ({});
// const useLightCrossing = () => ({ lc: { tauLC_ms: 10, dwell_ms: 5, burst_ms: 2, phase: 1, sectorIdx: 0, sectorCount: 10, onWindow: true } });


// Mock imports for demonstration purposes - replace with actual imports if needed
// In a real scenario, these would be imported from their respective modules.
// For this example, we'll define them as empty functions or objects if they aren't provided.
const useEnergyPipeline = (options?: { refetchInterval: number }) => ({ data: null });
const useMetrics = (interval: number) => ({ data: null });
const useGreens = () => ({});
const useLightCrossing = () => ({ lc: null }); // Assuming lc can be null initially

// Refactored to use provided props and mock data structures if necessary for standalone testing
// In the original code, `lc` was not defined, so we'll assume it comes from `useLightCrossing`
// and was intended to be passed down or accessed from a context.
// For this correction, we assume `useLightCrossing` is available and returns `lc`.

export default function WarpEngineContainer(props: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<any>(null);
  const [status, setStatus] = useState<"idle"|"loading"|"ready"|"error">("idle");
  const [err, setErr] = useState<string | null>(null);

  // Mocking the light crossing hook as it was not present in the original code snippet
  // but is referenced in the changes.
  const { lc } = useLightCrossing();

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

  // Get live pipeline data
  const { data: pipeline } = useEnergyPipeline({ refetchInterval: 1000 });
  // NOTE: LC loop already exists in your file; we just forward it to the engine.
  const { data: metrics } = useMetrics(2000);
  const greens = useGreens(); // This was in the original code, keeping it

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

  // Push Light-Crossing timeline into both engines every tick
  useEffect(() => {
    if (!lc) return;
    const payload = {
      tauLC_ms: lc.tauLC_ms,
      dwell_ms: lc.dwell_ms,
      burst_ms: lc.burst_ms,
      phase: lc.phase,
      sectorIdx: lc.sectorIdx,
      sectorCount: lc.sectorCount,
      onWindow: lc.onWindow,
      TS_ratio: (Number.isFinite(lc.tauLC_ms) && Number.isFinite(pipeline?.modulationFreq_GHz))
        ? (lc.tauLC_ms / (1000 / (pipeline!.modulationFreq_GHz! * 1e9))) : undefined,
      dutyEffectiveFR: (pipeline as any)?.dutyEffectiveFR,
    };
    engineRef.current?.setLightCrossing?.(payload); // Using engineRef.current directly
  }, [lc?.tauLC_ms, lc?.dwell_ms, lc?.burst_ms, lc?.phase, lc?.sectorIdx, lc?.sectorCount, lc?.onWindow, pipeline?.modulationFreq_GHz, (pipeline as any)?.dutyEffectiveFR]);


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