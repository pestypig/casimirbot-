"use client";
import React, {useEffect, useMemo, useRef, useState} from "react";

/*
  WarpRenderCheckpointsPanel
  --------------------------
  Drop-in diagnostics panel for the REAL/SHOW canvases. It inspects:
  - canvas sizing & WebGL context health
  - shader link/engine readiness
  - uniforms sanity (cameraZ, axesClip, thetaScale, parity/ridge)
  - grid/geometry presence
  - live energy-pipeline agreement (θ-scale, sectors/duty)
  - strobing mux presence
  - recent diagnostics heartbeat (via computeDiagnostics)

  Props: pass the same refs used by your inspector component so we can read engine + canvas state.

  <WarpRenderCheckpointsPanel
     leftLabel="REAL"
     rightLabel="SHOW"
     leftEngineRef={leftEngine}
     rightEngineRef={rightEngine}
     leftCanvasRef={leftRef}
     rightCanvasRef={rightRef}
     live={live}
  />
*/

// tiny helpers
const N = (x: any, d = 0) => (Number.isFinite(x) ? +x : d);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function expectedThetaForPane(live: any, engine: any) {
  const N = (x:any,d=0)=>Number.isFinite(x)?+x:d;
  const parity = !!engine?.uniforms?.physicsParityMode; // REAL=true, SHOW=false
  const mode = String(engine?.uniforms?.currentMode ?? live?.currentMode || '').toLowerCase();
  if (mode === 'standby') return 0;

  const gammaGeo = Math.max(1, N(live?.gammaGeo ?? live?.g_y, 26));
  const dAa      = Math.max(1e-12, N(live?.deltaAOverA ?? live?.qSpoilingFactor, 1));

  // Pull γ_VdB from the engine uniforms if present (authoritative for that pane)
  const gVdB = Math.max(
    1,
    N(
      engine?.uniforms?.gammaVdB ??
      engine?.uniforms?.gammaVanDenBroeck ??
      live?.gammaVanDenBroeck ?? live?.gammaVdB,
      2.86e5
    )
  );

  // Duty per pane
  let duty: number;
  if (parity) {
    // REAL: ship-wide Ford–Roman duty
    const dFR = live?.dutyEffectiveFR ?? live?.dutyShip ?? live?.dutyEff;
    duty = Number.isFinite(+dFR) ? Math.max(0, +dFR) : 0;
  } else {
    // SHOW: UI duty averaged over total sectors
    const S = Math.max(1, Math.floor(N(live?.sectorCount ?? live?.sectors ?? 1, 1)));
    duty = Math.max(0, N(live?.dutyCycle, 0)) / S;
  }

  const betaInst = Math.pow(gammaGeo, 3) * dAa * gVdB;
  const viewAvg  = (live?.viewAvg ?? true) ? 1 : 0;
  return viewAvg ? betaInst * Math.sqrt(Math.max(1e-12, duty)) : betaInst;
}

// Same θ computation as WarpBubbleCompare.tsx for perfect consistency
function computeThetaScaleFromParams(v: any) {
  const gammaGeo = N(v.gammaGeo, 26);
  const dAa = N(v.qSpoilingFactor, 1);
  const gammaVdB = N(v.gammaVanDenBroeck, 2.86e5);
  const sectors = Math.max(1, Math.floor(N(v.sectorCount ?? v.sectors, 1)));
  const duty = Math.max(0, N(v.dutyCycle, 0));
  const viewAvg = (v.viewAvg ?? true) ? 1 : 0;
  const betaInst = Math.pow(Math.max(1, gammaGeo), 3) * Math.max(1e-12, dAa) * Math.max(1, gammaVdB);
  const effDuty = Math.max(1e-12, duty / sectors);
  return viewAvg ? betaInst * Math.sqrt(effDuty) : betaInst;
}

function useEngineHeartbeat(engineRef: React.MutableRefObject<any | null>) {
  const [tickMs, setTickMs] = useState<number>(0);
  const timerRef = useRef<any>(null);
  useEffect(() => {
    const poll = () => {
      const e = engineRef.current;
      try {
        if (e?.computeDiagnostics) {
          e.computeDiagnostics(); // also warms accumulators
          setTickMs(Date.now());
        }
      } catch {}
      timerRef.current = setTimeout(poll, 1000);
    };
    poll();
    return () => clearTimeout(timerRef.current);
  }, [engineRef]);
  return tickMs;
}

function StatusDot({ state }: { state: "ok" | "warn" | "fail" }) {
  const color = state === "ok" ? "bg-emerald-500" : state === "warn" ? "bg-amber-500" : "bg-rose-500";
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color} mr-2 align-middle`} />;
}

function Row({ label, detail, state }: { label: string; detail?: string; state: "ok" | "warn" | "fail" }) {
  return (
    <div className="flex items-start justify-between py-1.5 border-b last:border-b-0 border-white/10 text-xs">
      <div className="flex items-start min-w-0">
        <StatusDot state={state} />
        <div className="truncate"><span className="font-medium">{label}</span>{detail ? <span className="text-white/70"> — {detail}</span> : null}</div>
      </div>
    </div>
  );
}

function FixButton({ onClick, children }: React.PropsWithChildren<{ onClick: () => void }>) {
  return (
    <button onClick={onClick} className="px-2 py-1 rounded-md border border-white/10 hover:bg-white/5 text-xs font-medium">
      {children}
    </button>
  );
}

function useCheckpointList(
  label: string,
  engineRef: React.MutableRefObject<any | null>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  liveSnap?: any,
  expectations?: { parity?: boolean; ridge?: number }
) {
  const hb = useEngineHeartbeat(engineRef);

  return useMemo(() => {
    const e = engineRef.current;
    const cv = canvasRef.current || (e?.canvas ?? null);
    const rows: { label: string; detail?: string; state: "ok" | "warn" | "fail" }[] = [];

    // Canvas
    const cw = N(cv?.clientWidth || cv?.width, 0);
    const ch = N(cv?.clientHeight || cv?.height, 0);
    const canvasOk = cw >= 64 && ch >= 64;
    rows.push({ label: "Canvas sized", detail: `${cw}×${ch}px`, state: canvasOk ? "ok" : "fail" });

    // GL context
    const gl = e?.gl;
    const ctxOk = !!gl && !(gl?.isContextLost && gl.isContextLost());
    rows.push({ label: "WebGL context", detail: gl ? (ctxOk ? "alive" : "lost") : "missing", state: ctxOk ? "ok" : gl ? "fail" : "fail" });

    // Shaders/program
    const progOk = !!e?.gridProgram && !!e?.gridUniforms && !!e?.gridAttribs;
    rows.push({ label: "Shaders linked", detail: progOk ? "gridProgram ready" : "no program", state: progOk ? "ok" : "fail" });

    // Engine readiness
    rows.push({ label: "Engine ready", detail: e?.isLoaded ? "isLoaded=true" : "waiting", state: e?.isLoaded ? "ok" : "warn" });

    // Uniforms
    const u = e?.uniforms || {};
    const camOk = Number.isFinite(u?.cameraZ);
    rows.push({ label: "CameraZ set", detail: camOk ? u.cameraZ.toFixed(2) : "unset", state: camOk ? "ok" : "warn" });

    const axes = Array.isArray(u?.axesClip) && u.axesClip.length === 3 ? u.axesClip : null;
    const axesOk = !!axes && axes.every((n: any) => Number.isFinite(n) && Math.abs(n) > 0);
    rows.push({ label: "Axes/clip", detail: axesOk ? `[${axes!.map((n: number) => n.toFixed(2)).join(", ")}]` : "unset", state: axesOk ? "ok" : "warn" });

    // Theta-scale
    const ts = N(u?.thetaScale, NaN);
    const tsOk = Number.isFinite(ts) && ts > 0;
    let tsState: "ok" | "warn" | "fail" = tsOk ? "ok" : "fail";
    let tsDetail = tsOk ? ts.toExponential(2) : "invalid";

    if (liveSnap) {
      const tsExp = expectedThetaForPane(liveSnap, e);
      const rel = tsOk ? Math.abs(ts - tsExp) / Math.max(1e-12, tsExp) : Infinity;
      
      // Check for mode disagreement during transitions
      const engineMode = String(e?.uniforms?.currentMode || '').toLowerCase();
      const liveMode = String(liveSnap?.currentMode || '').toLowerCase();
      const inTransition = engineMode && liveMode && engineMode !== liveMode;
      
      if (tsOk && Number.isFinite(rel)) {
        if (inTransition) {
          tsDetail += ` • (transition)`;
        } else {
          if (rel > 0.25) tsState = "warn"; // large disagreement
          tsDetail += ` • exp ${tsExp.toExponential(2)} (${(rel * 100).toFixed(0)}% off)`;
        }
      }
    }
    rows.push({ label: "θ-scale", detail: tsDetail, state: tsState });

    // Parity & ridge expectations
    if (expectations) {
      const expParity = expectations.parity;
      const expRidge = expectations.ridge;
      if (expParity != null) {
        const ok = !!u?.physicsParityMode === !!expParity;
        rows.push({ label: "Parity mode", detail: String(!!u?.physicsParityMode), state: ok ? "ok" : "fail" });
      }
      if (expRidge != null) {
        const ok = (u?.ridgeMode | 0) === (expRidge | 0);
        rows.push({ label: "Ridge mode", detail: String(u?.ridgeMode), state: ok ? "ok" : "warn" });
      }
    }

    // Grid data present
    const verts = (e?.gridVertices?.length || 0);
    const orig = (e?.originalGridVertices?.length || 0);
    const gridOk = verts > 0 && orig > 0;
    rows.push({ label: "Grid buffers", detail: `${verts}/${orig} floats`, state: gridOk ? "ok" : "fail" });

    // Strobing sanity
    const s = Math.max(1, N(u?.sectors, 1));
    const sp = Math.max(0, Math.min(s - 1, N(u?.split, 0)));
    const strobeOk = s >= 1 && sp < s;
    rows.push({ label: "Strobing", detail: `sectors=${s} • split=${sp}` , state: strobeOk ? "ok" : "warn" });

    // Heartbeat (did diagnostics run in the last ~2s?)
    const dt = Date.now() - hb;
    const beatOk = hb !== 0 && dt < 2000;
    rows.push({ label: "Diagnostics heartbeat", detail: beatOk ? `${dt}ms ago` : "stale", state: beatOk ? "ok" : "warn" });

    // Display/exposure sanity (SHOW should be bright; REAL conservative)
    const exp = N(u?.exposure, 0);
    const zs = N(u?.zeroStop, 0);
    const expOk = exp > 0 && exp <= 12 && zs > 0 && zs < 1e-3;
    rows.push({ label: "Tone mapping", detail: `exp=${exp} • zero=${zs}` , state: expOk ? "ok" : "warn" });

    // Render loop alive (RAF attached)
    const rafAlive = !!e?._raf;
    rows.push({ label: "Render loop", detail: rafAlive ? "active" : "stopped", state: rafAlive ? "ok" : "warn" });

    return rows;
  }, [engineRef.current, canvasRef.current, liveSnap, hb, label]);
}

export default function WarpRenderCheckpointsPanel({
  leftLabel = "REAL",
  rightLabel = "SHOW",
  leftEngineRef,
  rightEngineRef,
  leftCanvasRef,
  rightCanvasRef,
  live,
  parameters,
}: {
  leftLabel?: string;
  rightLabel?: string;
  leftEngineRef: React.MutableRefObject<any | null>;
  rightEngineRef: React.MutableRefObject<any | null>;
  leftCanvasRef: React.RefObject<HTMLCanvasElement>;
  rightCanvasRef: React.RefObject<HTMLCanvasElement>;
  live?: any;
  parameters?: any; // Optional parameters object from renderer for perfect consistency
}) {
  const modeKey = (live?.currentMode as string) || "hover";
  const snap = (live?.byMode && live?.byMode[modeKey]) || (live?.modes && live?.modes[modeKey]) || live || undefined;

  const leftRows  = useCheckpointList(leftLabel,  leftEngineRef,  leftCanvasRef,  snap, { parity: true,  ridge: 0 });
  const rightRows = useCheckpointList(rightLabel, rightEngineRef, rightCanvasRef, snap, { parity: false, ridge: 1 });

  // quick reasons summary if anything hard-fails
  const hardFailsLeft  = leftRows.filter(r => r.state === 'fail').map(r => r.label);
  const hardFailsRight = rightRows.filter(r => r.state === 'fail').map(r => r.label);

  // convenience actions
  const act = {
    forceResize: (e: any) => e?._resizeCanvasToDisplaySize?.(),
    fitCamera: (e: any) => {
      const axes = e?.uniforms?.axesClip || [1,1,1];
      const cv = e?.canvas as HTMLCanvasElement | undefined;
      if (!cv) return;
      const w = cv.clientWidth || cv.width || 800;
      const h = cv.clientHeight || cv.height || 320;
      const aspect = w / Math.max(1, h);
      const fovDesktop = Math.PI / 3.272, fovPortrait = Math.PI / 2.65;
      const t = Math.min(1, Math.max(0, (1.2 - aspect) / 0.6));
      const fov = fovDesktop * (1 - t) + fovPortrait * t;
      const R = Math.max(...axes);
      const margin = 0.95;
      const camZ = (margin * R) / Math.tan(fov * 0.5);
      e?.updateUniforms?.({ cameraZ: camZ, lockFraming: true });
    },
    restoreGL: (e: any) => e?.gl?.getExtension?.('WEBGL_lose_context')?.restoreContext?.(),
    recompile: (e: any) => e?._compileGridShaders?.(),
    rewarp: (e: any) => (e?.forceRedraw?.(), e?._render?.()),
    presets: {
      real:   (e: any) => e?.setPresetParity?.(),
      show:   (e: any) => e?.setPresetShowcase?.(),
    }
  };

  const L = leftEngineRef.current;
  const R = rightEngineRef.current;

  // Energy pipeline summary panel - use parameters if available for perfect renderer consistency
  const pipelineSummary = (snap || parameters) ? (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
      <h4 className="text-sm font-semibold text-white/90 mb-2">Energy Pipeline — {modeKey}{parameters ? " (renderer-sync)" : ""}</h4>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-white/70">θ-scale expected:</span>
          <span className="font-mono">{
            parameters 
              ? computeThetaScaleFromParams(parameters).toExponential(2)
              : expectedThetaForPane(snap, null).toExponential(2)
          }</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">γ_geo × q × γ_VdB:</span>
          <span className="font-mono">{
            parameters
              ? `${N(parameters.gammaGeo, 26)}³ × ${N(parameters.qSpoilingFactor, 1).toFixed(2)} × ${N(parameters.gammaVanDenBroeck, 2.86e5).toExponential(1)}`
              : `${N(snap?.gammaGeo ?? snap?.g_y, 26)}³ × ${N(snap?.deltaAOverA ?? snap?.qSpoilingFactor, 1).toFixed(2)} × ${N(snap?.gammaVdB ?? snap?.gammaVanDenBroeck, 2.86e5).toExponential(1)}`
          }</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">Duty / sectors:</span>
          <span className="font-mono">{
            parameters
              ? `${N(parameters.dutyCycle, 0.14).toFixed(3)} / ${Math.max(1, Math.floor(N(parameters.sectorCount ?? parameters.sectors, 1)))}`
              : `${N(snap?.dutyCycle, 0.14).toFixed(3)} / ${Math.max(1, Math.floor(N(snap?.sectorCount ?? snap?.sectors ?? 1, 1)))}`
          }</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">View averaging:</span>
          <span className="font-mono">{
            parameters 
              ? (parameters.viewAvg ?? true ? "ON" : "OFF")
              : (snap?.viewAvg ?? true ? "ON" : "OFF")
          }</span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-white/90">{leftLabel} — Checkpoints</h4>
          <div className="flex gap-1">
            <FixButton onClick={() => act.presets.real(L)}>Preset</FixButton>
            <FixButton onClick={() => act.forceResize(L)}>Resize</FixButton>
            <FixButton onClick={() => act.fitCamera(L)}>Fit</FixButton>
            <FixButton onClick={() => act.recompile(L)}>Shaders</FixButton>
            <FixButton onClick={() => act.restoreGL(L)}>Restore GL</FixButton>
            <FixButton onClick={() => act.rewarp(L)}>Re-render</FixButton>
          </div>
        </div>
        <div className="divide-y divide-white/10">
          {leftRows.map((r, i) => (
            <Row key={i} label={r.label} detail={r.detail} state={r.state} />
          ))}
        </div>
        {hardFailsLeft.length > 0 && (
          <div className="mt-2 text-xs text-rose-300/90">
            Likely black-screen causes: {hardFailsLeft.join(", ")}
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-white/90">{rightLabel} — Checkpoints</h4>
          <div className="flex gap-1">
            <FixButton onClick={() => act.presets.show(R)}>Preset</FixButton>
            <FixButton onClick={() => act.forceResize(R)}>Resize</FixButton>
            <FixButton onClick={() => act.fitCamera(R)}>Fit</FixButton>
            <FixButton onClick={() => act.recompile(R)}>Shaders</FixButton>
            <FixButton onClick={() => act.restoreGL(R)}>Restore GL</FixButton>
            <FixButton onClick={() => act.rewarp(R)}>Re-render</FixButton>
          </div>
        </div>
        <div className="divide-y divide-white/10">
          {rightRows.map((r, i) => (
            <Row key={i} label={r.label} detail={r.detail} state={r.state} />
          ))}
        </div>
        {hardFailsRight.length > 0 && (
          <div className="mt-2 text-xs text-rose-300/90">
            Likely black-screen causes: {hardFailsRight.join(", ")}
          </div>
        )}
      </div>
      {pipelineSummary}
    </div>
  );
}