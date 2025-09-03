import React, { useEffect, useRef, useState } from "react";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { driveWarpFromPipeline } from "@/lib/warp-pipeline-adapter";
import { useMetrics } from "@/hooks/use-metrics";

export default function WarpEngineContainer(props: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<any>(null);
  const [status, setStatus] = useState<"idle"|"loading"|"ready"|"error">("idle");
  const [err, setErr] = useState<string | null>(null);

  // Get live pipeline data
  const { data: pipeline } = useEnergyPipeline({ refetchInterval: 1000 });
  const { data: metrics } = useMetrics(2000);

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

  // Drive engine strictly from pipeline (no client physics)
  useEffect(() => {
    if (!pipeline) return;
    // Use strict pipeline-driven rendering
    driveWarpFromPipeline(engineRef.current, pipeline, { mode: 'REAL', strict: true, metrics });
  }, [pipeline, metrics]);

  // Keep cameraZ cosmetic only (no physics knobs here)
  useEffect(() => {
    const z = 3.0; // stable framing
    engineRef.current?.updateUniforms?.({ cameraZ: z });
  }, []);

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