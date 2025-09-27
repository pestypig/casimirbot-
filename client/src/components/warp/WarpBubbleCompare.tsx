'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { driveWarpFromPipeline } from '@/lib/warp-pipeline-adapter';

type Props = {
  /** Preferred: full pipeline snapshot (same shape as /api/helix/pipeline) */
  pipeline?: any;
  /** Fallback: legacy parameters (used only to frame camera if hull present) */
  parameters?: any;
  title?: string;
};

/**
 * Minimal, strict-scientific REAL renderer.
 * - One canvas
 * - No SHOW / no cosmetics
 * - Adapter is the single source of truth
 */
export default function WarpBubbleCompare({ pipeline, parameters, title = 'REAL • STRICT' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<any>(null);
  const [err, setErr] = useState<string | null>(null);

  // Snapshot we hand to the adapter. Prefer live pipeline; otherwise pass parameters as-is.
  const snap = useMemo(() => {
    if (pipeline) return pipeline;
    return parameters || {};
  }, [pipeline, parameters]);

  // --- helpers (tiny) --------------------------------------------------------
  const ensureEngineScript = async () => {
    const w = window as any;
    if (w.WarpEngine?.getOrCreate) return;
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/warp-engine.js';
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load /warp-engine.js'));
      document.head.appendChild(s);
    });
  };

  const sizeCanvas = (cv: HTMLCanvasElement) => {
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const r = cv.getBoundingClientRect();
    const w = Math.max(1, Math.floor((r.width || 800) * dpr));
    const h = Math.max(1, Math.floor((r.height || 420) * dpr));
    if (cv.width !== w) cv.width = w;
    if (cv.height !== h) cv.height = h;
    try { (engineRef.current?.gl as WebGLRenderingContext)?.viewport(0, 0, w, h); } catch {}
  };

  const cameraZFromHull = (cv: HTMLCanvasElement, hull?: { a?: number; b?: number; c?: number }) => {
    const a = Number(hull?.a) || 503.5;
    const b = Number(hull?.b) || 132.0;
    const c = Number(hull?.c) || 86.5;
    const axes = [a, b, c].map(n => Math.max(1e-9, n));
    const R = Math.max(...axes);
    const w = cv.clientWidth || 800, h = cv.clientHeight || 420;
    const aspect = w / Math.max(1, h);
    const fov = (aspect > 1.2) ? Math.PI / 3.2 : Math.PI / 2.7; // ~55° vs ~66°
    const margin = 1.0;
    return (margin * (R / a)) / Math.tan(0.5 * fov); // normalized to long-axis
  };

  // --- mount/init ------------------------------------------------------------
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const cv = canvasRef.current;
        if (!cv) return;
        await ensureEngineScript();
        const W = (window as any).WarpEngine;
        if (!W?.getOrCreate) throw new Error('WarpEngine.getOrCreate missing');
        sizeCanvas(cv);
        const eng = W.getOrCreate(cv, { strictScientific: true });
        engineRef.current = eng;
        // Seed a single scientific camera value (cosmetic framing only)
        try {
          const cz = cameraZFromHull(cv, (snap?.hull || parameters?.hull));
          eng.updateUniforms?.({ cameraZ: Number.isFinite(cz) ? cz : 2.0, lockFraming: true });
        } catch {}
        // Drive **only** from pipeline; REAL + strict
        driveWarpFromPipeline(eng, snap, { mode: 'REAL', strict: true });
        eng.forceRedraw?.();
      } catch (e: any) {
        if (alive) setErr(String(e?.message || e));
      }
    })();
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount once

  // Re-drive physics whenever the pipeline snapshot changes
  useEffect(() => {
    if (!engineRef.current || !snap) return;
    try {
      driveWarpFromPipeline(engineRef.current, snap, { mode: 'REAL', strict: true });
      engineRef.current.forceRedraw?.();
    } catch (e) {
      console.warn('[WarpBubbleCompare:min] drive error', e);
    }
  }, [snap]);

  // Keep canvas sized to container
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ro = new ResizeObserver(() => sizeCanvas(cv));
    ro.observe(cv);
    sizeCanvas(cv);
    return () => ro.disconnect();
  }, []);

  if (err) {
    return (
      <div className="p-4 text-sm text-red-400 font-mono">
        Warp viewer failed: {err}
      </div>
    );
  }

  return (
    <div className="rounded-md overflow-hidden bg-black/40 flex flex-col" style={{ aspectRatio: '16 / 10', minHeight: 420 }}>
      <div className="px-2 py-1 text-xs font-mono text-slate-300 shrink-0">{title}</div>
      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block touch-manipulation select-none"
          style={{ background: '#000' }}
        />
      </div>
    </div>
  );
}
