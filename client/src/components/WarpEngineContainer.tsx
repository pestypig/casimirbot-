import React, { useEffect, useRef, useState } from "react";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { driveWarpFromPipeline } from "@/lib/warp-pipeline-adapter";
import { useMetrics } from "@/hooks/use-metrics";
import PipelineCongruenceBadge from "@/components/common/PipelineCongruenceBadge";

export default function WarpEngineContainer(props: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<any>(null);
  const [status, setStatus] = useState<"idle"|"loading"|"ready"|"error">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [contractNote, setContractNote] = useState<string | null>(null);

  // Get live pipeline data
  const { data: pipeline } = useEnergyPipeline({ refetchInterval: 1000 });
  const { data: metrics } = useMetrics(2000);

  useEffect(() => {
    let cancelled = false;
    let retries = 0;
    let timer: any = null;
  // track initial creation attempts separately so context restore can reuse logic
  let attempts = 0;

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
        // WebGL context loss / restore handling
        const onLost = (e: Event) => {
          e.preventDefault();
          console.warn('[WarpEngine] WebGL context lost');
          setErr(prev => prev ?? 'WebGL context lost');
          setStatus('loading');
        };
        const onRestored = () => {
          console.info('[WarpEngine] WebGL context restored – recreating engine');
          try { engineRef.current?.destroy?.(); } catch {}
          engineRef.current = null;
          // Re-run step to recreate
          attempts = 0; retries = 0; // reset counters for fresh load
          step();
        };
        cvs.addEventListener('webglcontextlost', onLost as any, { passive: false });
        cvs.addEventListener('webglcontextrestored', onRestored as any, { passive: true });
        (eng as any).__ctxLossCleanup = () => {
          cvs.removeEventListener('webglcontextlost', onLost as any);
          cvs.removeEventListener('webglcontextrestored', onRestored as any);
        };
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
  try { (engineRef.current as any)?.__ctxLossCleanup?.(); } catch {}
  try { engineRef.current?.destroy?.(); } catch(_) {}
    };
  }, []);

  // Drive engine strictly from pipeline (no client physics)
  useEffect(() => {
    if (!pipeline) return;
    // Use strict pipeline-driven rendering
    driveWarpFromPipeline(engineRef.current, pipeline, { mode: 'REAL', strict: true, metrics });
  }, [pipeline, metrics]);

  // Periodic θ contract assertion (every 5s) – warns if engine theta deviates from expected chain
  useEffect(() => {
    const id = setInterval(() => {
      const eng = engineRef.current;
      if (!eng || !eng.uniforms) return;
      const u: any = eng.uniforms;
      const g = +u.gammaGeo, q = + (u.qSpoilingFactor ?? u.deltaAOverA);
      const vdb = + (u.gammaVdB ?? u.gammaVanDenBroeck);
      const duty = + (u.dutyUsed ?? u.dutyEffectiveFR ?? pipeline?.dutyEffectiveFR);
      if (![g,q,vdb,duty].every(Number.isFinite) || duty <= 0) { setContractNote(null); return; }
      const expected = Math.pow(g,3) * q * vdb * Math.sqrt(duty);
      const have = +u.thetaScale || +u.thetaUniform || 0;
      if (!Number.isFinite(have) || have === 0) { setContractNote('θ missing (expected ' + expected.toExponential(3) + ')'); return; }
      const rel = Math.abs(have - expected) / (expected || 1);
      if (rel > 0.05) {
        setContractNote('θ mismatch rel=' + rel.toFixed(2) + ' expected ' + expected.toExponential(3) + ' got ' + have.toExponential(3));
      } else {
        setContractNote(null);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [pipeline]);

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
          {contractNote && <div className="mt-1 text-amber-300">{contractNote}</div>}
        </div>
      </div>
    );
  }
  if (status !== "ready") {
    return (
      <div className={"flex items-center justify-center " + (props.className||"")}>
        <div className="text-gray-400 text-sm font-mono">
          WarpEngine status: {status}
          {contractNote && <div className="mt-1 text-amber-300">{contractNote}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={props.className}>
      <PipelineCongruenceBadge
        label="curvature"
        meta={pipeline?.curvatureMeta}
        className="mb-2"
      />
      <canvas ref={canvasRef} className="w-full h-full" />
      {contractNote && <div className="mt-1 text-xs text-amber-300/80 font-mono">{contractNote}</div>}
    </div>
  );
}
