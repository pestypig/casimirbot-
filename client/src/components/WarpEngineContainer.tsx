
import React, { useRef, useEffect } from 'react';
import { driveWarpFromPipeline } from "@/lib/warp-pipeline-adapter";
import { useEnergyPipeline, useGreens } from "@/hooks/use-energy-pipeline";
import { useMetrics } from "@/hooks/use-metrics";
import { useLightCrossingLoop } from "@/hooks/useLightCrossingLoop";

interface WarpEngineContainerProps {
  showComparison?: boolean;
  metricKappa?: number; // For conformal metric mode
}

export default function WarpEngineContainer({ 
  showComparison = false, 
  metricKappa 
}: WarpEngineContainerProps) {
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const leftEngine = useRef<any>(null);
  const rightEngine = useRef<any>(null);

  // Get live pipeline data
  const { data: pipeline } = useEnergyPipeline({ refetchInterval: 1000 });
  const { data: metrics } = useMetrics(2000);
  const greens = useGreens();

  // Set up light-crossing loop with wall thickness control
  const lc = useLightCrossingLoop({
    sectorStrobing: pipeline?.sectorsConcurrent ?? pipeline?.sectorStrobing ?? 1,
    currentSector: pipeline?.currentSector ?? 0,
    sectorPeriod_ms: pipeline?.sectorPeriod_ms ?? 1.0,
    duty: pipeline?.dutyCycle ?? 0.14,
    freqGHz: pipeline?.modulationFreq_GHz ?? 15,
    hull: metrics?.hull ? {
      a: metrics.hull.Lx_m/2, 
      b: metrics.hull.Ly_m/2, 
      c: metrics.hull.Lz_m/2
    } : undefined,
    wallWidth_m: 6.0, // Explicit wall thickness - adjust as needed
    localBurstFrac: pipeline?.localBurstFrac ?? pipeline?.dutyCycle ?? 0.01
  });

  // Initialize engines
  useEffect(() => {
    if (leftCanvasRef.current && !leftEngine.current) {
      // Load WarpEngine from global script
      const WarpEngine = (window as any).WarpEngine;
      if (WarpEngine) {
        leftEngine.current = WarpEngine.getOrCreate(leftCanvasRef.current);
        leftEngine.current.setDebugTag('REAL');
      }
    }

    if (showComparison && rightCanvasRef.current && !rightEngine.current) {
      const WarpEngine = (window as any).WarpEngine;
      if (WarpEngine) {
        rightEngine.current = WarpEngine.getOrCreate(rightCanvasRef.current);
        rightEngine.current.setDebugTag('SHOW');
      }
    }

    return () => {
      // Cleanup engines on unmount
      if (leftEngine.current) {
        leftEngine.current.destroy();
        leftEngine.current = null;
      }
      if (rightEngine.current) {
        rightEngine.current.destroy();
        rightEngine.current = null;
      }
    };
  }, [showComparison]);

  // Drive engines from pipeline data
  useEffect(() => {
    if (!pipeline) return;

    // Drive left engine (REAL physics mode)
    if (leftEngine.current) {
      driveWarpFromPipeline(leftEngine.current, pipeline, {
        metrics,
        wallWidth_m: lc.wallWidth_m || 6.0, // Use LC wall thickness or fallback
        greens,
        metricKappa
      });
      
      // Set REAL mode specifics
      leftEngine.current.updateUniforms({
        physicsParityMode: true,
        ridgeMode: 0, // Double-lobe physics
        curvatureGainT: 0.0,
        curvatureBoostMax: 1.0
      });
    }

    // Drive right engine (SHOW mode) if comparison enabled
    if (showComparison && rightEngine.current) {
      driveWarpFromPipeline(rightEngine.current, pipeline, {
        metrics,
        wallWidth_m: lc.wallWidth_m || 6.0,
        greens,
        metricKappa
      });

      // Set SHOW mode specifics
      rightEngine.current.updateUniforms({
        physicsParityMode: false,
        ridgeMode: 1, // Single crest showcase
        curvatureGainT: 0.6,
        curvatureBoostMax: 40.0
      });
    }
  }, [pipeline, metrics, lc.wallWidth_m, greens, metricKappa, showComparison]);

  return (
    <div className="space-y-4">
      <div className={`grid gap-4 ${showComparison ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/* REAL Engine */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-300">
            Physics Parity Mode
          </h3>
          <canvas
            ref={leftCanvasRef}
            width={400}
            height={300}
            className="w-full border border-gray-600 rounded bg-black"
            style={{ aspectRatio: '4/3' }}
          />
          <div className="text-xs text-gray-400 space-y-1">
            <div>Mode: {pipeline?.currentMode || 'hover'}</div>
            <div>θ-scale: {pipeline?.thetaScale?.toExponential(2) || '—'}</div>
            <div>Wall: {lc.wallWidth_m?.toFixed(1) || '—'} m</div>
          </div>
        </div>

        {/* SHOW Engine (if comparison enabled) */}
        {showComparison && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-300">
              Showcase Mode
            </h3>
            <canvas
              ref={rightCanvasRef}
              width={400}
              height={300}
              className="w-full border border-gray-600 rounded bg-black"
              style={{ aspectRatio: '4/3' }}
            />
            <div className="text-xs text-gray-400 space-y-1">
              <div>Enhanced visuals</div>
              <div>Single crest ridge</div>
              <div>Curvature boost: 40×</div>
            </div>
          </div>
        )}
      </div>

      {/* Status indicators */}
      <div className="flex gap-4 text-xs text-gray-400">
        <div>Pipeline: {pipeline ? '✓' : '⏳'}</div>
        <div>Metrics: {metrics ? '✓' : '⏳'}</div>
        <div>Greens: {greens ? '✓' : '—'}</div>
        <div>LC τ: {lc.tauLC_ms.toFixed(2)}ms</div>
        <div>Burst: {lc.onWindow ? '🔥' : '💤'}</div>
      </div>
    </div>
  );
}
