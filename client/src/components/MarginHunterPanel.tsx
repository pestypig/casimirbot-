import React, { useEffect, useMemo, useRef, useState } from "react";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { gatedUpdateUniforms, withoutPhysics } from "@/lib/warp-uniforms-gate";
import { TheoryBadge } from "./common/TheoryBadge";
/**
 * TheoryRefs:
 *  - ford-roman-qi-1995: panel displays live FR duty vs QI ceiling
 */


/**
 * MarginHunterPanel — SHOW-only background optimizer
 * --------------------------------------------------
 * A tiny, safe, always-on search that nudges UI-side parameters (q, γ_VdB scale,
 * concurrent sectors, local duty) to maximize a Tchebychev margin under your
 * guardrails. It never writes thetaScale, never flips REAL parity, and only talks
 * to the SHOW engine through gatedUpdateUniforms.
 *
 * Plug in next to WarpRenderInspector.
 *
 * Minimal integration:
 * <MarginHunterPanel getShowEngine={() => rightEngine.current} />
 */

// ---------------------- Types & helpers -------------------------------------

type Num = number | undefined | null;
const N = (x: Num, d = 0) => (Number.isFinite(x as number) ? Number(x) : d);
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

function normalizeKeys(u: any) {
  const x: any = { ...(u || {}) };
  if (typeof x.gammaVanDenBroeck === "number" && typeof x.gammaVdB !== "number") x.gammaVdB = x.gammaVanDenBroeck;
  if (typeof x.gammaVdB === "number" && typeof x.gammaVanDenBroeck !== "number") x.gammaVanDenBroeck = x.gammaVdB;
  if (typeof x.qSpoilingFactor === "number" && typeof x.qSpoil !== "number") x.qSpoil = x.qSpoilingFactor;
  if (typeof x.qSpoil === "number" && typeof x.qSpoilingFactor !== "number") x.qSpoilingFactor = x.qSpoil;
  return x;
}

// ---------------------- Worker wiring ---------------------------------------

// We inline the worker so this file stands alone.
function createMarginWorker(): Worker {
  const code = `
  const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
  const N=(x,d=0)=>Number.isFinite(+x)?+x:d;

  function thetaExpected({gammaGeo,q,gammaVdB,dutyEff}){
    return Math.pow(N(gammaGeo,1),3) * N(q,1) * N(gammaVdB,1) * N(dutyEff,0);
  }

  function tchebyMargin({theta,thetaBudget,dutyEff,dutyMax,sectors,sectorCap}){
    // per-constraint slacks
    const sTheta = 1 - (theta / Math.max(thetaBudget,1e-30));
    const sDuty  = 1 - (dutyEff / Math.max(dutyMax,1e-30));
    const sSect  = 1 - (sectors / Math.max(sectorCap,1));
    // margin = min slack across hard constraints
    return Math.min(sTheta, sDuty, sSect);
  }

  onmessage = (ev)=>{
    const m = ev.data||{};
    if(m.type==='iterate'){
      const cfg = m.cfg; // immutable
      let {center, radius, samples, eliteFrac} = m.state;
      const eliteN = Math.max(1, Math.floor(samples*eliteFrac));

      // Sample population around center within radius box
      const pop = [];
      for(let i=0;i<samples;i++){
        // Box sampling with small Gaussian jitter
        const u = (lo,hi)=> lo + Math.random()*(hi-lo);
        const g = (mu,sig)=> mu + (Math.random()*2-1)*sig;
        const q         = clamp(g(center.q, radius.q/3),      cfg.bounds.q[0], cfg.bounds.q[1]);
        const gScale    = clamp(g(center.gScale, radius.gScale/3), cfg.bounds.gScale[0], cfg.bounds.gScale[1]);
        const sectors   = Math.round(clamp(g(center.sectors, radius.sectors/3), cfg.bounds.sectors[0], cfg.bounds.sectors[1]));
        const dutyLocal = clamp(g(center.dutyLocal, radius.dutyLocal/3), cfg.bounds.dutyLocal[0], cfg.bounds.dutyLocal[1]);

        const dutyEff = dutyLocal * (sectors / Math.max(1,cfg.sectorCount));
        const gammaVdB = cfg.baseline.gammaVdB * gScale;
        const theta = thetaExpected({gammaGeo:cfg.gammaGeo, q, gammaVdB, dutyEff});
        const margin = tchebyMargin({
          theta, thetaBudget: cfg.budgets.thetaBudget,
          dutyEff, dutyMax: cfg.budgets.dutyFR_max,
          sectors, sectorCap: cfg.budgets.sectorCap
        });
        const score = margin + cfg.bonusTheta * Math.min(theta / Math.max(cfg.budgets.thetaBudget,1e-30), 1);
        pop.push({q,gScale,sectors,dutyLocal, dutyEff, gammaVdB, theta, margin, score});
      }

      pop.sort((a,b)=> b.score - a.score);
      const elite = pop.slice(0, eliteN);
      // Refit center to elite mean (CEM)
      const mean = (k)=> elite.reduce((s,e)=>s+e[k],0)/elite.length;
      const newCenter = {
        q: mean('q'),
        gScale: mean('gScale'),
        sectors: Math.round(mean('sectors')),
        dutyLocal: mean('dutyLocal')
      };

      // Trust-region adapt: if margin improved, slightly expand; else shrink
      const best = elite[0];
      const improve = best.margin > m.bestMargin;
      const f = improve ? cfg.trust.grow : cfg.trust.shrink;
      const newRadius = {
        q: Math.max(cfg.minRadius.q, Math.min(cfg.maxRadius.q, radius.q * f)),
        gScale: Math.max(cfg.minRadius.gScale, Math.min(cfg.maxRadius.gScale, radius.gScale * f)),
        sectors: Math.max(cfg.minRadius.sectors, Math.min(cfg.maxRadius.sectors, radius.sectors * f)),
        dutyLocal: Math.max(cfg.minRadius.dutyLocal, Math.min(cfg.maxRadius.dutyLocal, radius.dutyLocal * f)),
      };

      postMessage({
        type:'iterResult',
        best, eliteN, center:newCenter, radius:newRadius
      });
    }
  };
  `;

  const blob = new Blob([code], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const w = new Worker(url, { name: "margin-worker" });
  // No revoke here; keep for component lifetime
  return w;
}

// ---------------------- Component -------------------------------------------

export default function MarginHunterPanel({
  getShowEngine,
  ghostPreview: ghostPreviewDefault = true,
  initial,
}: {
  getShowEngine: () => any;                    // returns SHOW engine instance
  ghostPreview?: boolean;
  initial?: Partial<{
    thetaBudget: number;
    dutyFR_max: number;
    sectorCap: number;
    bounds: { q: [number,number]; gScale: [number,number]; sectors: [number,number]; dutyLocal: [number,number] };
  }>;
}){
  const { data: live } = useEnergyPipeline({ refetchOnWindowFocus: false, staleTime: 10_000 });

  // Baselines from live (safe fallbacks)
  const sectorCount = Math.max(1, +(live as any)?.sectorCount || 400);
  const gammaGeo    = N((live as any)?.gammaGeo, 26);
  const qBase       = N((live as any)?.qSpoilingFactor, 1);
  const gammaVdB0   = N((live as any)?.gammaVanDenBroeck ?? (live as any)?.gammaVdB, 1e11);
  const dwell_ms    = N((live as any)?.dwell_ms, 1000);
  const burst_ms    = N((live as any)?.burst_ms, 10);
  const dutyLocal0  = clamp(N(burst_ms/dwell_ms, 0.01), 1e-6, 0.5);
  const sectors0    = Math.max(1, +(live as any)?.sectors || 1);

  const budgets = {
    thetaBudget: N(initial?.thetaBudget, N((live as any)?.thetaBudget, 8.79e12)),
    dutyFR_max:  N(initial?.dutyFR_max, 0.02), // 2% cap (adjust to taste)
    sectorCap:   Math.max(1, Math.floor(N(initial?.sectorCap, 64))),
  };

  const bounds = {
    q: initial?.bounds?.q ?? [0.1*qBase, 5*qBase],
    gScale: initial?.bounds?.gScale ?? [0.1, 5],         // γ_VdB multiplier window
    sectors: initial?.bounds?.sectors ?? [1, Math.max(4, Math.min(64, sectorCount))],
    dutyLocal: initial?.bounds?.dutyLocal ?? [1e-4, 0.2], // local (burst/dwell)
  } as const;

  // Worker life-cycle
  const workerRef = useRef<Worker | null>(null);
  const [running, setRunning] = useState(false);
  const [ghostPreview, setGhostPreview] = useState(ghostPreviewDefault);

  // Optimizer dynamic state
  const [iter, setIter] = useState(0);
  const [best, setBest] = useState<any | null>(null);
  const [center, setCenter] = useState({ q: qBase, gScale: 1.0, sectors: sectors0, dutyLocal: dutyLocal0 });
  const [radius, setRadius] = useState({ q: qBase*0.5, gScale: 0.5, sectors: Math.max(1,sectors0), dutyLocal: dutyLocal0*0.5 });

  // Constants passed to worker
  const cfg = useMemo(() => ({
    gammaGeo,
    sectorCount,
    baseline: { gammaVdB: gammaVdB0 },
    budgets,
    bounds,
    bonusTheta: 0.05, // small tiebreaker toward higher theta
    trust: { grow: 1.12, shrink: 0.72 },
    minRadius: { q: 1e-4, gScale: 0.02, sectors: 1, dutyLocal: 1e-5 },
    maxRadius: { q: Math.max(0.1, qBase), gScale: 1.5, sectors: Math.max(1, sectorCount/2), dutyLocal: 0.2 },
  }), [gammaGeo, sectorCount, gammaVdB0, budgets, bounds, qBase]);

  // Preview → SHOW engine (safe patch)
  const previewToShow = (cand: any) => {
    if (!ghostPreview || !cand) return;
    const eng = getShowEngine?.();
    if (!eng) return;
    // reconstruct a consistent light-crossing pair from dutyLocal
    const dutyLocal = clamp(N(cand.dutyLocal, dutyLocal0), bounds.dutyLocal[0], bounds.dutyLocal[1]);
    const dwell = Math.max(1e-9, dwell_ms);
    const burst = clamp(dutyLocal * dwell, 0, dwell*0.9);

    const patch = normalizeKeys({
      qSpoilingFactor: cand.q,
      gammaVanDenBroeck: gammaVdB0 * cand.gScale,
      sectors: cand.sectors,
      lightCrossing: { burst_ms: burst, dwell_ms: dwell },
      // display seasoning (SHOW only)
      exposure: 5.0,
      zeroStop: 1e-7,
      colorMode: 'theta',
      viewAvg: true,
    });
  gatedUpdateUniforms(eng, withoutPhysics(patch), 'margin-hunter-preview');
  };

  const commitBestToShow = () => {
    if (!best) return;
    const eng = getShowEngine?.();
    if (!eng) return;
    const dwell = Math.max(1e-9, dwell_ms);
    const burst = clamp(best.dutyLocal * dwell, 0, dwell*0.9);
    const patch = normalizeKeys({
      qSpoilingFactor: best.q,
      gammaVanDenBroeck: gammaVdB0 * best.gScale,
      sectors: best.sectors,
      lightCrossing: { burst_ms: burst, dwell_ms: dwell },
    });
  gatedUpdateUniforms(eng, withoutPhysics(patch), 'margin-hunter-commit');
  };

  // Start/stop the loop
  useEffect(() => {
    if (!running) return;
    if (!workerRef.current) workerRef.current = createMarginWorker();
    const w = workerRef.current;

    let bestMargin = -Infinity;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      w!.postMessage({
        type: 'iterate',
        cfg,
        state: { center, radius, samples: 48, eliteFrac: 0.2 },
        bestMargin
      });
    };

    const onMsg = (ev: MessageEvent) => {
      const m: any = ev.data;
      if (m?.type === 'iterResult') {
        setIter((v) => v + 1);
        setCenter(m.center);
        setRadius(m.radius);
        setBest((bPrev: any) => {
          const b = !bPrev || m.best.margin > bPrev.margin ? m.best : bPrev;
          bestMargin = b.margin;
          previewToShow(m.best); // ghost-preview the current best of this iter
          return b;
        });
        // schedule next
        setTimeout(tick, 120); // gentle beat so UI can breathe
      }
    };

    w.addEventListener('message', onMsg);
    tick();

    return () => {
      cancelled = true;
      w.removeEventListener('message', onMsg);
    };
  }, [running, cfg, center, radius]);

  // Derived stats for display
  const derived = useMemo(() => {
    if (!best) return null;
    const dutyEff = best.dutyLocal * (best.sectors / sectorCount);
    const thetaExpected = Math.pow(gammaGeo,3) * best.q * (gammaVdB0 * best.gScale) * dutyEff;
    const sTheta = 1 - thetaExpected / budgets.thetaBudget;
    const sDuty  = 1 - dutyEff / budgets.dutyFR_max;
    const sSect  = 1 - best.sectors / budgets.sectorCap;
    return { dutyEff, thetaExpected, sTheta, sDuty, sSect };
  }, [best, sectorCount, gammaGeo, gammaVdB0, budgets]);

  // UI -----------------------------------------------------------------------
  return (
    <div className="rounded-2xl border border-neutral-200 p-4">
      <header className="flex items-center justify-between gap-3 mb-2">
        <div>
          <h3 className="text-base font-semibold">Margin Hunter (SHOW-only)</h3>
          <p className="text-xs text-neutral-500">Trust-region CEM over q, γ<sub>VdB</sub>×, sectors, local duty — maximizes min-slack under θ / FR / sectors caps.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRunning(v=>!v)}
            className={`px-3 py-1 rounded-2xl text-sm border ${running? 'bg-emerald-600 text-white border-emerald-600' : 'border-neutral-300 hover:bg-neutral-100'}`}
          >{running? 'Stop' : 'Start'}</button>
          <label className="text-xs flex items-center gap-2">
            <input type="checkbox" checked={ghostPreview} onChange={e=>setGhostPreview(e.target.checked)} />
            Ghost preview to SHOW
          </label>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl border p-3">
          <div className="font-medium mb-1">Guardrails</div>
          <div>θ budget: <span className="font-mono">{budgets.thetaBudget.toExponential(2)}</span></div>
          <div>
            <span className="flex items-center gap-2">
              FR duty max
              <TheoryBadge
                refs={["ford-roman-qi-1995"]}
                categoryAnchor="Quantum-Inequalities"
              />
            </span>
            <span className="font-mono ml-1">{(budgets.dutyFR_max*100).toFixed(3)}%</span>
          </div>
          <div>Sector cap: <span className="font-mono">{budgets.sectorCap}</span></div>
          <div>Sector total: <span className="font-mono">{sectorCount}</span></div>
        </div>
        <div className="rounded-xl border p-3">
          <div className="font-medium mb-1">Search center</div>
          <div>q: <span className="font-mono">{center.q.toFixed(4)}</span></div>
          <div>γ<sub>VdB</sub>×: <span className="font-mono">{center.gScale.toFixed(3)}</span></div>
          <div>sectors: <span className="font-mono">{center.sectors}</span></div>
          <div>duty<sub>local</sub>: <span className="font-mono">{center.dutyLocal.toExponential(2)}</span></div>
        </div>
        <div className="rounded-xl border p-3">
          <div className="font-medium mb-1">Best so far</div>
          {best ? (
            <>
              <div>margin: <span className="font-mono">{(best.margin*100).toFixed(2)}%</span></div>
              <div>q / γ× / sec / duty: <span className="font-mono">{best.q.toFixed(4)} / {best.gScale.toFixed(3)} / {best.sectors} / {best.dutyLocal.toExponential(2)}</span></div>
            </>
          ) : <div className="text-neutral-500">—</div>}
        </div>
      </section>

      <section className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl border p-3">
          <div className="font-medium mb-1">Derived (best)</div>
          {derived ? (
            <>
              <div>θ expected: <span className="font-mono">{derived.thetaExpected.toExponential(2)}</span></div>
              <div>FR duty eff: <span className="font-mono">{(derived.dutyEff*100).toFixed(4)}%</span></div>
              <div>slack θ / FR / sec: <span className="font-mono">{(derived.sTheta*100).toFixed(1)}% / {(derived.sDuty*100).toFixed(1)}% / {(derived.sSect*100).toFixed(1)}%</span></div>
            </>
          ) : <div className="text-neutral-500">—</div>}
        </div>
        <div className="rounded-xl border p-3">
          <div className="font-medium mb-1">Iteration</div>
          <div>iters: <span className="font-mono">{iter}</span></div>
          <div>radius: <span className="font-mono">q±{radius.q.toExponential(2)}, γ×±{radius.gScale.toFixed(3)}, s±{radius.sectors.toFixed(1)}, duty±{radius.dutyLocal.toExponential(2)}</span></div>
        </div>
        <div className="rounded-xl border p-3 flex items-center justify-between gap-2">
          <button
            className="px-3 py-1 rounded bg-neutral-900 text-white"
            onClick={commitBestToShow}
            disabled={!best}
          >Commit best → SHOW</button>
          <button
            className="px-3 py-1 rounded border"
            onClick={()=>{ setBest(null); setIter(0); setCenter({ q: qBase, gScale: 1.0, sectors: sectors0, dutyLocal: dutyLocal0 }); setRadius({ q: qBase*0.5, gScale: 0.5, sectors: Math.max(1,sectors0), dutyLocal: dutyLocal0*0.5 }); }}
          >Reset</button>
        </div>
      </section>

      <p className="text-[10px] text-neutral-500 mt-3">
        Safety: writes SHOW-only (physicsParityMode=false), no θ-scale writes. Candidate previews respect bounds and guardrails.
      </p>
    </div>
  );
}
