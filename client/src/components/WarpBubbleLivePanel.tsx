import React, { useMemo } from "react";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import WarpBubbleGLPanel, { type WarpPipelineSnapshot } from "./WarpBubbleGLPanel";

// Build a safe snapshot from pipeline data with sensible defaults
function n(x: any, d: number){ const v = Number(x); return Number.isFinite(v) ? v : d; }
function clamp(x:number,a:number,b:number){ return Math.max(a, Math.min(b, x)); }

function buildSnapshotFromPipeline(p: any, opts: { viewAvg: boolean }): WarpPipelineSnapshot {
  const gammaGeo = Math.max(1, n(p?.gammaGeo, 26));
  const q = Math.max(1e-12, n(p?.qSpoilingFactor ?? p?.deltaAOverA, 1));
  const gammaVdB_vis = Math.max(1, n(p?.gammaVanDenBroeck_vis ?? p?.gammaVanDenBroeck, 2.86e5));

  const sectorsTotal = Math.max(1, Math.floor(n(p?.sectorsTotal ?? p?.sectorCount ?? p?.lightCrossing?.sectorsTotal, 400)));
  const sectorsLive  = Math.max(1, Math.floor(n(p?.sectorsConcurrent ?? p?.concurrentSectors ?? p?.lightCrossing?.activeSectors, 1)));
  const localBurst   = clamp(n(p?.localBurstFrac ?? p?.dutyCycle, 0), 0, 1);
  const dutyFR       = clamp(n(p?.dutyEffectiveFR, NaN), 0, 1);
  const dFR          = Number.isFinite(dutyFR) ? dutyFR : clamp(localBurst * (sectorsLive / sectorsTotal), 0, 1);

  const isREAL   = true;  // single-pane truth in this viewer
  const ridge    = (p?.ridgeMode != null) ? (p.ridgeMode|0) : (isREAL ? 0 : 1);
  const avgOn    = (p?.viewAvg === false) ? false : !!opts.viewAvg;

  const a = n(p?.hull?.a, 0.5035), b = n(p?.hull?.b, 0.132), c = n(p?.hull?.c, 0.0865);
  const wallWidth = Math.max(1e-4, n(p?.wallWidth, 0.06));
  const R = Math.max(a,b,c) || 1;
  const cameraZ = n(p?.cameraZ, 2.0 + 0.5 * R);

  return {
    gammaGeo,
    qSpoilingFactor: q,
    gammaVanDenBroeck_vis: gammaVdB_vis,
    dutyEffectiveFR: dFR,
    physicsParityMode: isREAL,
    ridgeMode: (ridge ? 1 : 0) as 0|1,
    viewAvg: avgOn,
    hull: { a, b, c },
    wallWidth,
    cameraZ
  };
}

function HeaderBar({ snapshot, isLoading, isError }:{ snapshot: Required<WarpPipelineSnapshot>; isLoading: boolean; isError: boolean }){
  const theta = Math.pow(snapshot.gammaGeo, 3)
    * snapshot.qSpoilingFactor!
    * snapshot.gammaVanDenBroeck_vis!
    * (snapshot.viewAvg ? Math.sqrt(snapshot.dutyEffectiveFR!) : 1);
  return (
    <div className="mb-2 flex flex-wrap items-center gap-3 text-xs font-mono opacity-80">
      <span className="text-sky-300">WarpBubbleGL (pipeline)</span>
      {isLoading && <span className="text-amber-400">loading…</span>}
      {isError && <span className="text-rose-400">error</span>}
      <span>mode: <b>{snapshot.physicsParityMode ? 'REAL' : 'SHOW'}</b></span>
      <span>ridge: {snapshot.ridgeMode}</span>
      <span>viewAvg: {snapshot.viewAvg ? 'on' : 'off'}</span>
      <span>θ: {Number.isFinite(theta) ? theta.toExponential(3) : '—'}</span>
      <span>γ_geo: {snapshot.gammaGeo.toFixed(2)}</span>
      <span>q: {snapshot.qSpoilingFactor!.toFixed(3)}</span>
      <span>γ_VdB(vis): {snapshot.gammaVanDenBroeck_vis!.toExponential(3)}</span>
      <span>d_FR: {snapshot.dutyEffectiveFR!.toExponential(3)}</span>
    </div>
  );
}

export default function WarpBubbleLivePanel({
  color = "#b8ccff",
  bg = "#0b1220",
  viewAvg = true,
}: { color?: string; bg?: string; viewAvg?: boolean }){
  const { data, isLoading, isError } = useEnergyPipeline({ refetchOnWindowFocus: false, staleTime: 1000 });
  const snapshot = useMemo(() => buildSnapshotFromPipeline(data, { viewAvg }), [data, viewAvg]) as Required<WarpPipelineSnapshot>;

  return (
    <div className="w-full">
      <HeaderBar snapshot={snapshot} isLoading={isLoading} isError={isError} />
      <WarpBubbleGLPanel snapshot={snapshot} background={bg} color={color} />
    </div>
  );
}
