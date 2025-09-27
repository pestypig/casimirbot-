"use client";
import React, {useEffect, useMemo, useRef, useState} from "react";
import { checkpoint, Check, Side, Stage, within, onCheck } from "@/lib/checkpoints";
import CheckpointViewer from "./CheckpointViewer";

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
const N = (x: any, d = 0) => (Number.isFinite(+x) ? +x : d);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const aHarmonic = (ax:number=0, ay:number=0, az:number=0) => {
  const aNum = Number(ax), bNum = Number(ay), cNum = Number(az);
  const a = Number.isFinite(aNum) ? aNum : 0;
  const b = Number.isFinite(bNum) ? bNum : 0;
  const c = Number.isFinite(cNum) ? cNum : 0;
  const d=(a>0?1/a:0)+(b>0?1/b:0)+(c>0?1/c:0);
  return d>0?3/d:NaN;
};

// Enhanced canvas/GL inspection that works with both slice2d and grid3d engines
  const getCanvasEngine = (engineRef: React.MutableRefObject<any>, canvasRef: React.MutableRefObject<HTMLCanvasElement | null>) => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;

    // For Grid3DEngine, the engine has a canvas property pointing to the actual canvas with real WebGL context
    if (engine?.canvas && engine.canvas instanceof HTMLCanvasElement) {
      console.log(`[Checkpoints] Using Grid3D engine canvas: ${engine.canvas.width}x${engine.canvas.height}`);
      return { engine, canvas: engine.canvas };
    }

    // For regular WarpEngine, use the canvas ref directly
    if (canvas) {
      console.log(`[Checkpoints] Using slice2d engine canvas: ${canvas.width}x${canvas.height}`);
    }
    return { engine, canvas };
  };

// GPU link status helper with enhanced diagnostics
function getLinkStatus(engine: any) {
  const gl   = engine?.gl as WebGLRenderingContext | WebGL2RenderingContext | undefined;
  const prog = engine?.gridProgram || engine?.program || engine?._program || null;
  const ext  = (engine?.parallelShaderExt || null) as any;

  if (!gl || !prog) return { stage: engine?.loadingState || 'idle', ok: false, reason: 'no GL or program' };

  // Enhanced diagnostics temporarily disabled for debugging
  // if (typeof engine.getShaderDiagnostics === 'function') {
  //   const diag = engine.getShaderDiagnostics();
  //   const ok = diag.status === 'linked';
  //   return { 
  //     stage: diag.status, 
  //     ok: ok, 
  //     reason: diag.message || '',
  //     profile: diag.profile || 'auto',
  //     vertexCount: diag.vertexCount || 0
  //   };
  // }

  // Fallback to original method for compatibility
  if (engine?.loadingState === 'compiling') {
    return { stage: 'compiling', ok: false, reason: '⏳ compiling shaders…' };
  }
  if (engine?.loadingState === 'failed') {
    const log = (gl.getProgramInfoLog(prog) || 'link failed').trim();
    return { stage: 'failed', ok: false, reason: log };
  }
  if (engine?.loadingState === 'linked') {
    return { stage: 'linked', ok: true, reason: '' };
  }

  // Infer via KHR if state not provided
  if (ext && gl.getProgramParameter(prog, ext.COMPLETION_STATUS_KHR) === false) {
    return { stage: 'compiling', ok: false, reason: '⏳ compiling shaders…' };
  }

  // Final truth from LINK_STATUS
  const ok = !!gl.getProgramParameter(prog, gl.LINK_STATUS);
  const reason = ok ? '' : (gl.getProgramInfoLog(prog) || 'link failed (no log)').trim();
  return { stage: ok ? 'linked' : 'failed', ok, reason };
}

// ✅ Pane-specific expected θ using one duty law (√d_FR), with ENGINE authority
function expectedThetaForPane(live: any, engine: any) {
  const N = (x:any,d=0)=>Number.isFinite(+x)?+x:d;
  // Mode gate (standby short-circuit)
  const mode = String((engine?.uniforms?.currentMode ?? live?.currentMode) || '').toLowerCase();
  if (mode === 'standby') return NaN;

  // Values bound to the engine (authoritative for the pane)
  const U = engine?.uniforms || {};
  const gammaGeo = Math.max(1, N(U.gammaGeo ?? live?.gammaGeo ?? live?.g_y, 26));
  const q        = Number.isFinite(N(U.qSpoilingFactor ?? U.deltaAOverA ?? live?.deltaAOverA ?? live?.qSpoilingFactor, 1)) ? 
           N(U.qSpoilingFactor ?? U.deltaAOverA ?? live?.deltaAOverA ?? live?.qSpoilingFactor, 1) : 1e-12;
  const gVdB     = Math.max(1, N(U.gammaVdB ?? U.gammaVanDenBroeck ?? live?.gammaVanDenBroeck ?? live?.gammaVdB, 1.4e5));

  // Duty: STRICT — require engine-supplied dutyUsed (or dutyEffectiveFR)
  const dFR_used = Number.isFinite(U.dutyUsed) ? Math.max(1e-12, +U.dutyUsed)
                  : Number.isFinite(U.dutyEffectiveFR) ? Math.max(1e-12, +U.dutyEffectiveFR)
                  : NaN;
  if (!Number.isFinite(dFR_used)) return NaN;

  const base = Math.pow(gammaGeo, 3) * q * gVdB;
  const viewAvg = (U.viewAvg ?? live?.viewAvg ?? true) ? 1 : 0;
  return viewAvg ? base * Math.sqrt(dFR_used) : base;
}

// ✅ Prefer pipeline/engine d_FR; fall back to dutyCycle/sectors
function computeThetaScaleFromParams(v: any) {
  const N = (x:any,d=0)=>Number.isFinite(+x)?+x:d;
  const gammaGeo = Math.max(1, N(v.gammaGeo, 26));
  const q        = Number.isFinite(N(v.qSpoilingFactor ?? v.deltaAOverA, 1)) ? 
           N(v.qSpoilingFactor ?? v.deltaAOverA, 1) : 1e-12;
  const gVdB     = Math.max(1, N(v.gammaVanDenBroeck ?? v.gammaVdB, 1.4e5));

  const sectors   = Math.max(1, Math.floor(N(v.sectorCount ?? v.sectors, 1)));
  const dutyUI    = Math.max(0, N(v.dutyCycle, 0));
  const dFR_ui    = Math.max(1e-12, dutyUI / sectors);

  const dFR = Math.max(1e-12, N(v.dutyEffectiveFR, dFR_ui));
  const base = Math.pow(gammaGeo, 3) * q * gVdB;
  const averaging = (v.viewAvg ?? true);

  return averaging ? base * Math.sqrt(dFR) : base;
}

// ✅ Single-source expected θ; caller provides dutyFR for the pane
function thetaExpected(u: any, dutyFR: number, liveSnap?: any) {
  const N = (x:any,d=0)=>Number.isFinite(+x)?+x:d;
  const g  = Math.max(1, N(u.gammaGeo, 26));
  const q  = Number.isFinite(N(u.deltaAOverA ?? u.qSpoilingFactor, 1)) ? 
        N(u.deltaAOverA ?? u.qSpoilingFactor, 1) : 1e-12;
  const gv = Math.max(1, N(u.gammaVdB ?? u.gammaVanDenBroeck, 1.35e5));

  const dFR = Math.max(1e-12, dutyFR);
  const base = Math.pow(g, 3) * q * gv;

  const averaged = (u.viewAvg ?? liveSnap?.viewAvg ?? true) ? 1 : 0;
  return averaged ? base * Math.sqrt(dFR) : base;
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

// 🔊 Publish a pane-local echo of the physics chain so other panels can read the same authority.
function publishWarpEcho(engine: any, side: Side, liveSnap?: any) {
  try {
    const u = engine?.uniforms || {};
    const gammaGeo = Math.max(1, N(u.gammaGeo ?? liveSnap?.gammaGeo ?? liveSnap?.g_y, 26));
    const q       = Math.max(1e-12, N(u.qSpoilingFactor ?? u.deltaAOverA ?? liveSnap?.deltaAOverA ?? liveSnap?.qSpoilingFactor, 1));
    const gammaVdB= Math.max(1, N(u.gammaVdB ?? u.gammaVanDenBroeck ?? liveSnap?.gammaVanDenBroeck ?? liveSnap?.gammaVdB, 1.4e5));

    const sectorsTotal = Math.max(1, N(u.sectorCount ?? liveSnap?.sectorCount, 400));
    const sectorsLive  = Math.max(1, N(u.sectors ?? 1, 1));

    const dutyLocal = 0.01; // Ford–Roman window (local)
    const dFR_fallback = dutyLocal * (sectorsLive / sectorsTotal);
    const dFR = Number.isFinite(+u.dutyEffectiveFR) ? Math.max(1e-12, +u.dutyEffectiveFR) : dFR_fallback;

    const w = (window as any);
    if (!w.__warpEcho) w.__warpEcho = {};
    w.__warpEcho.src = `${String(side).toLowerCase()}-locked`;
    w.__warpEcho.v = Date.now();
    w.__warpEcho.terms = { 
      // expose canonical names used by the checker rows
      ['γ_geo']: gammaGeo,
      ['q']: q,
      ['γ_VdB']: gammaVdB,
      ['d_FR']: dFR,
    };
  } catch {
    // no-op
  }
}

function useCheckpointList(
  label: string,
  engineRef: React.MutableRefObject<any | null>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  liveSnap?: any,
  expectations?: { parity?: boolean; ridge?: number },
  dutyFR?: number,
  thetaExpectedFn?: (u: any, dutyFR: number) => number
) {
  const hb = useEngineHeartbeat(engineRef);
  // Collect checkpoint records during render and flush them post-render
  const pendingChecksRef = useRef<Partial<Check>[]>([]);
  const pushCheck = (c: Partial<Check>) => { pendingChecksRef.current.push({ ...c, at: Date.now() }); };

  const rows = useMemo(() => {
  const { engine: e, canvas: cv } = getCanvasEngine(engineRef, canvasRef); // Use the utility function
  const rows: { label: string; detail?: string; state: "ok" | "warn" | "fail" }[] = [];
    const side: Side = label === "REAL" ? "REAL" : "SHOW";
  // NOTE: publishWarpEcho is intentionally deferred to a post-render effect

    // === DAG Stage 1: INPUT CHECKPOINTS (ENGINE-FIRST) ===
    // Prefer bound uniforms; fall back to live snapshot for context only.
    const Ue = (e?.uniforms || {});
    const gammaGeo = N(Ue.gammaGeo ?? liveSnap?.gammaGeo ?? liveSnap?.g_y, 26);
    const deltaAOverA = N(Ue.deltaAOverA ?? Ue.qSpoilingFactor ?? liveSnap?.deltaAOverA ?? liveSnap?.qSpoilingFactor, 1);
    const gammaVdB = N(Ue.gammaVdB ?? Ue.gammaVanDenBroeck ?? liveSnap?.gammaVdB ?? liveSnap?.gammaVanDenBroeck, 1.4e5);
    const sectors = Math.max(1, Math.floor(N(Ue.sectorCount ?? liveSnap?.sectorCount ?? liveSnap?.sectors, 400)));
    const duty    = N(Ue.dutyCycle ?? liveSnap?.dutyCycle, 0);

  pushCheck({
      id: 'input.gamma_geo', side, stage: 'input',
      pass: gammaGeo >= 1 && gammaGeo <= 1000,
      msg: `γ_geo=${gammaGeo}`,
      expect: [1, 1000], actual: gammaGeo,
      sev: gammaGeo < 1 || gammaGeo > 1000 ? 'error' : 'info'
    });

  pushCheck({
      id: 'input.delta_aa', side, stage: 'input',
      pass: deltaAOverA >= 1e-12 && deltaAOverA <= 100,
      msg: `δA/A=${deltaAOverA}`,
      expect: [1e-12, 100], actual: deltaAOverA,
      sev: deltaAOverA < 1e-12 || deltaAOverA > 100 ? 'error' : 'info'
    });

  pushCheck({
      id: 'input.gamma_vdb', side, stage: 'input',
      pass: gammaVdB >= 1 && gammaVdB <= 1e15,
      msg: `γ_VdB=${gammaVdB.toExponential(1)}`,
      expect: [1, 1e15], actual: gammaVdB,
      sev: gammaVdB < 1 || gammaVdB > 1e15 ? 'error' : 'info'
    });

    // === DAG Stage 2: EXPECTATIONS (ENGINE AUTHORITY) ===
    // Calculate expected θ-scale using the SAME chain the engine uses (RAW)
    // Prefer dutyUsed→dutyEffectiveFR→(dutyLocal*sectorsLive/total) as in expectedThetaForPane.
    const thetaExpected = expectedThetaForPane(liveSnap, e);
    const dutyFR = (() => {
      const used = N(Ue.dutyUsed, NaN);
      if (Number.isFinite(used)) return Math.max(1e-12, used);
      const de   = N(Ue.dutyEffectiveFR, NaN);
      if (Number.isFinite(de)) return Math.max(1e-12, de);
      const sTot = Math.max(1, N(Ue.sectorCount ?? liveSnap?.sectorCount, 400));
      const sCon = Math.max(1, N(Ue.sectors ?? 1, 1));
      const dutyLocal = 0.01;
      return Math.max(1e-12, dutyLocal * (sCon / sTot));
    })();

  pushCheck({
      id: 'expect.theta_scale', side, stage: 'expect',
      pass: Number.isFinite(thetaExpected) && thetaExpected > 0,
      msg: `θ_expected=${thetaExpected.toExponential(2)}`,
      expect: '>0', actual: thetaExpected,
      sev: !Number.isFinite(thetaExpected) || thetaExpected <= 0 ? 'error' : 'info',
      meta: { gammaGeo, q: deltaAOverA, gammaVdB, dFR: dutyFR }
    });

    // === DAG Stage 3: UNIFORMS ===
    const u = e?.uniforms || {};
    const ts = N(u?.thetaScale, NaN);

    // Expected uniforms θ from the same chain the engine uses (RAW)
    const thetaUniformExpected = expectedThetaForPane(liveSnap, e);

  pushCheck({
      id: 'uniforms.theta_scale', side, stage: 'uniforms',
      pass: Number.isFinite(ts) && ts > 0,
      msg: `θ_uniforms=${Number.isFinite(ts) ? ts.toExponential(2) : 'NaN'} vs expected=${thetaUniformExpected.toExponential(2)}`,
      expect: thetaUniformExpected, actual: ts,
      sev: !Number.isFinite(ts) || ts <= 0 ? 'error' : (within(ts, thetaUniformExpected, 0.10) ? 'info' : 'warn'),
      meta: { law: 'γ^3·q·γVdB·(√d_FR if viewAvg)' }
    });

    // Metric toggle consistency: if metric tensors are supplied, toggle should be ON
    {
      const hasMetricFields =
        (Array.isArray(Ue.gSpatialDiag) && Ue.gSpatialDiag.length >= 3) ||
        (Array.isArray(Ue.gSpatialSym)  && Ue.gSpatialSym.length  >= 6) ||
        Number.isFinite(Ue.lapseN) ||
        Array.isArray(Ue.shiftBeta);
      const metricActive = (Ue.useMetric === true) || (+Ue.metricOn > 0.5) || (!!Ue.metricMode);
      const pass = !hasMetricFields || metricActive;
      checkpoint({
        id: 'metric.toggle_consistency', side, stage: 'uniforms',
        pass,
        msg: hasMetricFields
          ? (metricActive ? 'metric active' : 'metric fields present but toggle OFF')
          : 'no metric fields',
        expect: hasMetricFields ? 'active' : 'none',
        actual: { metricActive, hasMetricFields },
        sev: pass ? 'info' : 'warn',
        meta: { where: 'adapter metricMode → engine.useMetric mirror' }
      });
    }

    // NEW: CameraZ presence checkpoint (warn-only so it won't halt render)
    const camZOk = Number.isFinite(u?.cameraZ);
  pushCheck({
      id: 'uniforms.cameraZ',
      side,
      stage: 'uniforms',
      pass: camZOk,
      msg: camZOk ? `cameraZ=${(+u.cameraZ).toFixed(2)}` : 'CameraZ unset',
      expect: 'number', actual: camZOk ? u.cameraZ : 'unset',
      sev: camZOk ? 'info' : 'warn'
    });

  pushCheck({
      id: 'uniforms.ridge_mode', side, stage: 'uniforms',
      pass: expectations?.ridge != null ? (u?.ridgeMode | 0) === (expectations.ridge | 0) : true,
      msg: `ridgeMode=${u?.ridgeMode}`,
      expect: expectations?.ridge, actual: u?.ridgeMode,
      sev: expectations?.ridge != null && (u?.ridgeMode | 0) !== (expectations.ridge | 0) ? 'warn' : 'info'
    });

  pushCheck({
      id: 'uniforms.parity_mode', side, stage: 'uniforms', 
      pass: expectations?.parity != null ? !!(u.physicsParityMode ?? u.parityMode) === !!expectations.parity : true,
      msg: `parity=${!!(u.physicsParityMode ?? u.parityMode)}`,
      expect: expectations?.parity, actual: !!(u.physicsParityMode ?? u.parityMode),
      sev: expectations?.parity != null && !!(u.physicsParityMode ?? u.parityMode) !== !!expectations.parity ? 'warn' : 'info'
    });

    // === DAG Stage 4: GPU STATE ===
    const cw = N(cv?.clientWidth || cv?.width, 0);
    const ch = N(cv?.clientHeight || cv?.height, 0);
    const canvasOk = cw >= 64 && ch >= 64;

  pushCheck({
      id: 'gpu.canvas_size', side, stage: 'gpu',
      pass: canvasOk,
      msg: `Canvas ${cw}×${ch}px`,
      expect: '>=64x64', actual: `${cw}×${ch}`,
      sev: !canvasOk ? 'error' : 'info'
    });

    rows.push({ label: "Canvas sized", detail: `${cw}×${ch}px`, state: canvasOk ? "ok" : "fail" });

    // GL context
    const gl = e?.gl;
    const ctxOk = !!gl && !(gl?.isContextLost && gl.isContextLost());

  pushCheck({
      id: 'gpu.webgl_context', side, stage: 'gpu',
      pass: ctxOk,
      msg: gl ? (ctxOk ? "WebGL alive" : "context lost") : "missing",
      expect: 'alive', actual: gl ? (ctxOk ? 'alive' : 'lost') : 'missing',
      sev: !ctxOk ? 'error' : 'info'
    });

    rows.push({ label: "WebGL context", detail: gl ? (ctxOk ? "alive" : "lost") : "missing", state: ctxOk ? "ok" : gl ? "fail" : "fail" });

    // ── Shaders / program (driver-queried, GL1/GL2 + async aware) ─────────────────
    {
      const gl = e?.gl as WebGLRenderingContext | WebGL2RenderingContext | undefined;
      const prog =
        (e as any)?.gridProgram ||
        (e as any)?.program ||
        (e as any)?._program ||
        null;

      let progOk = false;
      let compiling = false;
      let reason = 'no GL or program';

      try {
        if (gl && prog) {
          // Async compile support (KHR_parallel_shader_compile)
          const ext =
            (e as any)?.parallelShaderExt ||
            (gl.getExtension ? gl.getExtension('KHR_parallel_shader_compile') : null);

          if (ext) {
            const done = gl.getProgramParameter(prog, (ext as any).COMPLETION_STATUS_KHR);
            compiling = !done;
          }

          // Link status (works for both GL1/GL2)
          progOk = !!gl.getProgramParameter(prog, gl.LINK_STATUS);

          if (progOk) {
            reason = 'linked';
          } else if (compiling) {
            reason = 'compiling…';
          } else {
            reason = (gl.getProgramInfoLog(prog) || 'link failed (no log)').trim();
          }
        }
      } catch (e: any) {
        reason = `exception: ${e?.message || e}`;
      }

      // Checkpoint row (GPU → shaders_linked)
  pushCheck({
        id: 'gpu.shaders_linked',
        side,
        stage: 'gpu',
        pass: progOk,
        msg: progOk ? 'Shaders compiled & linked' : (compiling ? 'Compiling shaders…' : reason),
        expect: 'linked',
        actual: reason,
        sev: progOk ? 'info' : (compiling ? 'warn' : 'error'),
      });

      // DAG row
      rows.push({
        label: 'Shaders linked',
        detail: reason,
        state: progOk ? 'ok' : (compiling ? 'warn' : 'fail'),
      });
    }

    // Grid buffers
  const verts = Number.isFinite(e?.gridVertices?.length) ? e!.gridVertices!.length : 0;
  const orig = Number.isFinite(e?.originalGridVertices?.length) ? e!.originalGridVertices!.length : 0;
    const gridOk = verts > 0 && orig > 0;

  pushCheck({
      id: 'gpu.grid_buffers', side, stage: 'gpu',
      pass: gridOk,
      msg: `Grid buffers ${verts}/${orig} floats`,
      expect: '>0', actual: { verts, orig },
      sev: !gridOk ? 'error' : 'info'
    });

    // === DAG Stage 5: FRAME PROVENANCE ===
    // Frame analysis would need readPixels - simplified for now
    const frameAlive = !!e?._raf;

  pushCheck({
      id: 'frame.render_loop', side, stage: 'frame',
      pass: frameAlive,
      msg: frameAlive ? "RAF active" : "render stopped",
      expect: 'active', actual: frameAlive ? 'active' : 'stopped',
      sev: !frameAlive ? 'warn' : 'info'
    });

    // Tone mapping checkpoint (exp/zs/toneOk declared later in original code)
  pushCheck({
      id: 'frame.tone_mapping', side, stage: 'frame',
      pass: true, // will be updated when exp/zs are calculated below
      msg: `tone mapping params pending...`,
      expect: { exp: [0, 12], zs: [0, 1e-3] }, actual: {},
      sev: 'info'
    });

    // Engine readiness
    rows.push({ label: "Engine ready", detail: e?.isLoaded ? "isLoaded=true" : "waiting", state: e?.isLoaded ? "ok" : "warn" });

    // Camera uniforms (reusing existing u)
    const camOk = Number.isFinite(u?.cameraZ);
    rows.push({ label: "CameraZ set", detail: camOk ? u.cameraZ.toFixed(2) : "unset", state: camOk ? "ok" : "warn" });

    const axes = Array.isArray(u?.axesClip) && u.axesClip.length === 3 ? u.axesClip : null;
    const axesOk = !!axes && axes.every((n: any) => Number.isFinite(n) && Math.abs(n) > 0);
    rows.push({ label: "Axes/clip", detail: axesOk ? `[${axes!.map((n: number) => n.toFixed(2)).join(", ")}]` : "unset", state: axesOk ? "ok" : "warn" });

  // Pipeline stamps forwarded by the adapter (if present) — helpful for correlating frames
  const pipelineSeq = Number.isFinite(N(Ue.__pipelineSeq ?? Ue.seq ?? Ue.__PIPE_SEQ, NaN)) ? (Ue.__pipelineSeq ?? Ue.seq ?? Ue.__PIPE_SEQ) : undefined;
  const pipelineTs  = Number.isFinite(N(Ue.__pipelineTs ?? Ue.__ts ?? Ue.__PIPE_TS, NaN)) ? (Ue.__pipelineTs ?? Ue.__ts ?? Ue.__PIPE_TS) : undefined;
  rows.push({ label: "Pipeline seq", detail: pipelineSeq != null ? String(pipelineSeq) : '—', state: pipelineSeq != null ? "ok" : "warn" });
  rows.push({ label: "Pipeline ts",  detail: pipelineTs  != null ? new Date(+pipelineTs).toLocaleTimeString().slice(-8) : '—', state: pipelineTs  != null ? "ok" : "warn" });

    // Theta-scale (reusing existing ts)
    const tsOk = Number.isFinite(ts) && ts > 0;
    let tsState: "ok" | "warn" | "fail" = tsOk ? "ok" : "fail";
    let tsDetail = tsOk ? ts.toExponential(2) : "invalid";

    // Get bound uniforms from engine's __warpEcho for self-consistency
    const echo = (window as any).__warpEcho;
    const dUsed = Number.isFinite(u?.dutyUsed) ? Math.max(1e-12, +u.dutyUsed) : NaN;
    const dEff  = Number.isFinite(u?.dutyEffectiveFR) ? Math.max(1e-12, +u.dutyEffectiveFR) : NaN;

    // use the engine's own viewAvg if set, else live snapshot, else default true
    const viewAvg = (u?.viewAvg ?? liveSnap?.viewAvg ?? true);

    // Build expected θ from the bound terms, honoring √d_FR when averaging
    const thetaExpectedFromBound =
      echo && echo.terms
        ? Math.pow(Math.max(1, N(echo.terms.γ_geo, 26)), 3) *
          Math.max(1e-12, N(echo.terms.q, 1)) *
          Math.max(1, N(echo.terms.γ_VdB, 1.4e5)) *
          (viewAvg ? Math.sqrt(Math.max(1e-12, N(echo.terms.d_FR, 1e-6))) : 1)
        : undefined;

    // Enhanced theta debugging
    if (echo && echo.terms) {
      console.log(`[${label}] Theta calculation debug:`, {
        γ_geo: echo.terms.γ_geo,
        q: echo.terms.q,
        γ_VdB: echo.terms.γ_VdB,
        d_FR: echo.terms.d_FR,
        viewAvg,
        calculated: thetaExpectedFromBound,
        actualTheta: ts
      });
    }

    const mismatch = echo && thetaExpectedFromBound && tsOk
      ? (ts / thetaExpectedFromBound) : 1;

    if (echo && echo.terms && typeof thetaExpectedFromBound === 'number' && Number.isFinite(thetaExpectedFromBound)) {
      // Use bound uniforms for perfect self-consistency
      const rel = tsOk ? Math.abs(ts - thetaExpectedFromBound) / Math.max(1e-12, thetaExpectedFromBound) : Infinity;

      // Smart θ mismatch detection
      const parity = !!(u.physicsParityMode ?? u.parityMode);
      const boostLeak = parity && N(u.curvatureBoostMax, 1) > 1;
      if (boostLeak) {
        tsDetail += ' • (check: REAL boost should be 1)';
        tsState = 'warn';
      }

      // Check for mode disagreement during transitions
      const engineMode = String(e?.uniforms?.currentMode || '').toLowerCase();
      const liveMode = String(liveSnap?.currentMode || '').toLowerCase();
      const inTransition = engineMode && liveMode && engineMode !== liveMode;

      if (tsOk && Number.isFinite(rel)) {
        if (inTransition) {
          tsDetail += ` • (transition)`;
        } else {
          if (rel > 0.25) tsState = "warn"; // large disagreement
          const pct = (mismatch * 100 - 100);
          tsDetail += ` • exp ${thetaExpectedFromBound.toExponential(2)} (${pct >= 0 ? '+' : ''}${pct.toFixed(0)}% off)`;
        }
      }
    } else if (liveSnap && thetaExpectedFn && typeof dutyFR === 'number') {
      // Fallback to old method when echo unavailable
      const tsExp = thetaExpectedFn(u, dutyFR);
      const rel = tsOk ? Math.abs(ts - tsExp) / Math.max(1e-12, tsExp) : Infinity;

      if (tsOk && Number.isFinite(rel) && rel > 0.25) {
        tsState = "warn";
        const pct = (ts / tsExp - 1) * 100;
        tsDetail += ` • exp ${tsExp.toExponential(2)} (${pct >= 0 ? '+' : ''}${pct.toFixed(0)}% off)`;
      }
    } else if (liveSnap) {
      // Final fallback to old method
      const tsExp = expectedThetaForPane(liveSnap, e);
      const rel = tsOk ? Math.abs(ts - tsExp) / Math.max(1e-12, tsExp) : Infinity;

      if (tsOk && Number.isFinite(rel) && rel > 0.25) {
        tsState = "warn";
        tsDetail += ` • exp ${tsExp.toExponential(2)} (${(rel * 100).toFixed(0)}% off)`;
      }
    }

    // Bonus: inferred θ-duty hint (prefer dutyUsed if available)
    let inferredDutyPct: string | null = null;
    if (typeof u?.dutyUsed === 'number') {
      // Use actual duty the engine computed
      inferredDutyPct = `${(u.dutyUsed*100).toFixed(3)}%`;
    } else if (tsOk) {
      // Fall back to inferring from physics chain
      const gammaGeo = N(u?.gammaGeo, 26);
      const deltaAA  = Math.max(1e-12, N(u?.deltaAOverA ?? u?.qSpoilingFactor, 1));
      const gammaVdB = Math.max(1, N(u?.gammaVdB ?? u?.gammaVanDenBroeck, 1.4e5));
      const betaInst = Math.pow(gammaGeo, 3) * deltaAA * gammaVdB;
      const averaged = (u?.viewAvg ?? true);
      if (betaInst > 0) {
        const df = ts / betaInst;
        const d  = averaged ? df*df : 1;
        inferredDutyPct = `${(d*100).toFixed(3)}%`;
      }
    }

    // Add inferred duty to detail if available
    if (inferredDutyPct && tsOk && liveSnap && thetaExpectedFn && typeof dutyFR === 'number') {
      const tsExp = thetaExpectedFn(u, dutyFR);
      const rel = Math.abs(ts - tsExp) / Math.max(1e-12, tsExp);
      if (Number.isFinite(rel) && !String(tsDetail).includes('(transition)')) {
        tsDetail += ` • used≈${inferredDutyPct}`;
      }
    }

    rows.push({ label: "θ-scale", detail: tsDetail, state: tsState });

    // Light-crossing display row (renderer authority via ENGINE UNIFORMS)
    const tauLC    = N(Ue.tauLC_ms, NaN);
    const dwell_ms = N(Ue.dwell_ms, NaN);
    const burst_ms = N(Ue.burst_ms, NaN);
    const phase    = N(Ue.phase,    NaN);
  const onWindow = (Number.isFinite(+Ue.onWindow) ? +Ue.onWindow : 0) > 0.5;
    const TSratio  = N((Ue.TS_ratio ?? (Ue.TSratio as any)), NaN);

    // Duty consistency (info): used vs (burst/dwell)×(S_live/S_total)
    {
      const sLive = Math.max(1, N(Ue.sectors ?? 1, 1)); // <-- use engine uniforms (in-scope)
      if (Number.isFinite(dwell_ms) && Number.isFinite(burst_ms) && Number.isFinite(sectors) && Number.isFinite(sLive) && Number.isFinite(dUsed)) {
        const dFR_expected = (burst_ms / Math.max(1e-6, dwell_ms)) * (sLive / sectors);
        const dFR_used     = dUsed!;
        const ok           = within(dFR_used, dFR_expected, 0.15);
        checkpoint({
          id: 'lc.duty_consistency', side, stage: 'frame',
          pass: ok,
          msg: `used=${(dFR_used*100).toFixed(3)}% vs exp=${(dFR_expected*100).toFixed(3)}%`,
          expect: '≈ burst/dwell × S_live/S_total',
          actual: { dFR_used, dFR_expected },
          sev: ok ? 'info' : 'warn',
          meta: { where: 'engine uniforms vs LC' }
        });
      }
    }

    {
      const details =
        `τ=${Number.isFinite(tauLC)?tauLC.toFixed(3):'—'}ms · ` +
        `dwell=${Number.isFinite(dwell_ms)?dwell_ms.toFixed(3):'—'}ms · ` +
        `burst=${Number.isFinite(burst_ms)?burst_ms.toFixed(3):'—'}ms · ` +
        `φ=${Number.isFinite(phase)?phase.toFixed(3):'—'} · ` +
        `window=${onWindow?'ON':'off'}`;
      const lcOk = Number.isFinite(tauLC) && Number.isFinite(dwell_ms) && Number.isFinite(burst_ms);
      rows.push({ label: "Light crossing", detail: details, state: lcOk ? "ok" : "fail" });
    }

    // TS ratio (τ_LC / T_m)
    {
      const tsrOk = Number.isFinite(TSratio) && TSratio > 1.0;
      const detail = Number.isFinite(TSratio) ? TSratio.toFixed(1) : '—';
      rows.push({ label: "TS ratio", detail, state: tsrOk ? "ok" : "warn" });
    }

    // (existing) View tensors & wall width rows continue below…

    // Metric/tensors actually in use by the shader
    {
      const metricActive = (u?.useMetric === true) || (+u?.metricOn > 0.5) || (!!u?.metricMode);
      const gDiag = Array.isArray(u?.gSpatialDiag) ? u.gSpatialDiag : null;
      const gSym  = Array.isArray(u?.gSpatialSym)  && u.gSpatialSym.length>=6 ? u.gSpatialSym : null;
      rows.push({
        label: "Metric",
        detail: `${metricActive ? 'ON' : 'off'} · g_diag=${gDiag ? `[${gDiag.map((x:number)=>N(x).toFixed(3)).join(', ')}]` : '—'} · g_sym=${gSym ? '[…6]' : '—'}`,
        state: metricActive ? "ok" : "warn"
      });
    }

    // Wall width as the renderer uses it (ρ and meters)
    {
      const aH = aHarmonic(u?.axesHull?.[0], u?.axesHull?.[1], u?.axesHull?.[2]);
      const w_rho = Number.isFinite(u?.wallWidth_rho) ? +u.wallWidth_rho : (Number.isFinite(u?.wallWidth) ? +u.wallWidth : NaN);
      const w_m   = Number.isFinite(u?.wallWidth_m)   ? +u.wallWidth_m   : (Number.isFinite(aH) && Number.isFinite(w_rho) ? w_rho * aH : NaN);
      rows.push({
        label: "Wall width",
        detail: `${Number.isFinite(w_m)? w_m.toFixed(3) : '—'} m • ${Number.isFinite(w_rho)? w_rho.toExponential(3) : '—'} ρ`,
        state: (Number.isFinite(w_m) && Number.isFinite(w_rho)) ? "ok" : "warn"
      });
    }

    // View forward & lowered shift g0i presence (tensors used by shader)
    {
      const vf = Array.isArray(u?.viewForward) ? u.viewForward : null;
      const g0 = Array.isArray(u?.g0i) ? u.g0i : null;
      rows.push({
        label: "Tensors (view/g₀ᵢ)",
        detail: `${vf ? `[${vf.map((x:number)=>N(x).toFixed(2)).join(', ')}]` : '—'} • ${g0 ? `[${g0.map((x:number)=>N(x).toFixed(2)).join(', ')}]` : '—'}`,
        state: (vf && g0) ? "ok" : "warn"
      });
    }

    // Show detailed breakdown from bound uniforms if available
    if (echo && echo.terms) {
      const terms = echo.terms;
  const breakdown = `src=${echo.src ?? 'unknown'} v=${echo.v ?? '?'} · γ_geo=${terms.γ_geo ?? '?'}^3 · q=${terms.q ?? '?'} · γ_VdB=${(Number.isFinite(terms.γ_VdB) ? terms.γ_VdB : 0).toExponential(2)} · d_FR=${((Number.isFinite(terms.d_FR) ? terms.d_FR : 0) * 100).toExponential(2)}%`;
      rows.push({ label: "θ breakdown", detail: breakdown, state: "ok" });
    }

    // Parity & ridge expectations with enhanced debugging
    if (expectations) {
      const expParity = expectations.parity;
      const expRidge = expectations.ridge;
      if (expParity != null) {
        const parity = !!(u.physicsParityMode ?? u.parityMode);
        const ok = parity === !!expParity;

        // Enhanced debugging for parity failures
        if (!ok) {
          console.error(`❌ ${label} engine parity enforcement FAILED - should be ${!!expParity}, got:`, parity);
          console.error(`${label} uniforms.physicsParityMode:`, u.physicsParityMode);
          console.error(`${label} uniforms.parityMode:`, u.parityMode);
          console.error(`${label} expected parity:`, !!expParity);
        }

        rows.push({ 
          label: "Parity mode", 
          detail: `${String(parity)} (exp: ${!!expParity})`, 
          state: ok ? "ok" : "fail" 
        });
      }
      if (expRidge != null) {
        const actualRidge = u?.ridgeMode | 0;
        const expectedRidge = expRidge | 0;
        const ok = actualRidge === expectedRidge;

        if (!ok) {
          console.warn(`⚠️ ${label} ridge mode mismatch - should be ${expectedRidge}, got:`, actualRidge);
        }

        rows.push({ 
          label: "Ridge mode", 
          detail: `${actualRidge} (exp: ${expectedRidge})`, 
          state: ok ? "ok" : "warn" 
        });
      }
    }

    // Grid data present (using already declared variables)
    rows.push({ label: "Grid buffers", detail: `${verts}/${orig} floats`, state: gridOk ? "ok" : "fail" });

    // Strobing sanity
    const sConcurrent = u?.sectors ?? 1;
    const sTotal = liveSnap?.sectorCount ?? 400;
    const sp = Math.max(0, Math.min(sConcurrent - 1, N(u?.split, 0)));
    const strobeOk = sConcurrent >= 1 && sp < sConcurrent;
    rows.push({ label: "Strobing", detail: `concurrent=${sConcurrent} • total=${sTotal} • split=${sp}`, state: strobeOk ? "ok" : "warn" });

    // Heartbeat (did diagnostics run in the last ~2s?)
    const dt = Date.now() - hb;
    const beatOk = hb !== 0 && dt < 2000;
    rows.push({ label: "Diagnostics heartbeat", detail: beatOk ? `${dt}ms ago` : "stale", state: beatOk ? "ok" : "warn" });

    // Display/exposure sanity (SHOW should be bright; REAL conservative)
    const exp = N(u?.exposure, 0);
    const zs = N(u?.zeroStop, 0);
    const toneOk = exp > 0 && exp <= 12 && zs > 0 && zs < 1e-3;

    // Update the frame tone mapping checkpoint with actual values
    checkpoint({
      id: 'frame.tone_mapping_actual', side, stage: 'frame',
      pass: toneOk,
      msg: `exposure=${exp} zero=${zs}`,
      expect: { exp: [0, 12], zs: [0, 1e-3] }, actual: { exp, zs },
      sev: !toneOk ? 'warn' : 'info'
    });

    rows.push({ label: "Tone mapping", detail: `exp=${exp} • zero=${zs}` , state: toneOk ? "ok" : "warn" });

    // Render loop alive (RAF attached)
    const rafAlive = !!e?._raf;
    rows.push({ label: "Render loop", detail: rafAlive ? "active" : "stopped", state: rafAlive ? "ok" : "warn" });

    return rows;
  }, [engineRef.current, canvasRef.current, liveSnap, hb, label, dutyFR, thetaExpectedFn]);

  // Post-render: publish the warp echo and flush any pending checkpoints (safe to call setState now)
  useEffect(() => {
    try {
      const { engine: e } = getCanvasEngine(engineRef, canvasRef);
      publishWarpEcho(e, label === 'REAL' ? 'REAL' : 'SHOW', liveSnap);
    } catch (e) { /* ignore */ }

    if (pendingChecksRef.current.length > 0) {
      const toFlush = pendingChecksRef.current.splice(0, pendingChecksRef.current.length);
      toFlush.forEach((c) => {
        try { checkpoint(c as Check); } catch (e) { /* ignore */ }
      });
    }
  }, [rows]);

  return rows;
}

// D) Compact checkpoint table component
function CompactCheckpointTable() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [stopOnError, setStopOnError] = useState(false);
  const [renderPaused, setRenderPaused] = useState(false);

  useEffect(() => {
    const handleCheck = (check: Check) => {
      setChecks(prev => {
        // Keep last 50 checks, grouped by id+side
        const key = `${check.side}:${check.id}`;
        const updated = prev.filter(c => `${c.side}:${c.id}` !== key);
        updated.push(check);
        return updated.slice(-50);
      });

      // Stop render loop on first error if enabled
      if (stopOnError && !check.pass && check.sev === 'error' && !renderPaused) {
        setRenderPaused(true);
        // Pause both engines' render loops
        const engines = [
          (window as any).__leftEngine, 
          (window as any).__rightEngine
        ].filter(Boolean);

        engines.forEach(engine => {
          if (engine._raf) {
            cancelAnimationFrame(engine._raf);
            engine._raf = null;
          }
        });

        console.warn('🛑 Render loop halted due to checkpoint error:', check);
      }
    };

    onCheck(handleCheck);
    return () => {
      // No cleanup needed - onCheck just pushes to array
    };
  }, [stopOnError, renderPaused]);

  const resumeRender = () => {
    setRenderPaused(false);
    // Resume engines
    const engines = [
      (window as any).__leftEngine, 
      (window as any).__rightEngine
    ].filter(Boolean);

    engines.forEach(engine => {
      if (!engine._raf && engine._render) {
        const renderLoop = () => {
          engine._render();
          engine._raf = requestAnimationFrame(renderLoop);
        };
        renderLoop();
      }
    });
  };

  // Group by stage for cleaner display
  const byStage = checks.reduce((acc, check) => {
    if (!acc[check.stage]) acc[check.stage] = [];
    acc[check.stage].push(check);
    return acc;
  }, {} as Record<Stage, Check[]>);

  const getStateColor = (check: Check) => {
    if (!check.pass) {
      if (check.sev === 'error') return 'text-red-400';
      if (check.sev === 'warn') return 'text-yellow-400';
    }
    return 'text-green-400';
  };

  const getStateIcon = (check: Check) => {
    if (!check.pass) {
      if (check.sev === 'error') return '❌';
      if (check.sev === 'warn') return '⚠️';
    }
    return '✅';
  };

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm">Live Checkpoints</h4>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={stopOnError}
              onChange={(e) => setStopOnError(e.target.checked)}
              className="w-3 h-3"
            />
            Stop on error
          </label>
          {renderPaused && (
            <button
              onClick={resumeRender}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
            >
              Resume
            </button>
          )}
        </div>
      </div>

      {renderPaused && (
        <div className="bg-red-900/30 border border-red-700 rounded p-2 mb-3 text-xs text-red-300">
          🛑 Render loop paused due to checkpoint error. Click Resume to continue.
        </div>
      )}

      <div className="space-y-3">
        {Object.entries(byStage).map(([stage, stageChecks]) => (
          <div key={stage}>
            <div className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">
              {stage}
            </div>
            <div className="space-y-1">
              {stageChecks.map((check, i) => (
                <div key={`${check.side}:${check.id}:${i}`} className="flex items-start gap-2 text-xs">
                  <span className="text-slate-500 w-8 shrink-0">{check.side}</span>
                  <span className="shrink-0">{getStateIcon(check)}</span>
                  <span className="font-mono text-slate-300 min-w-0 flex-1">
                    <span className="text-slate-400">{check.id}</span>
                    <span className={`ml-2 ${getStateColor(check)}`}>{check.msg}</span>
                  </span>
                  <span className="text-slate-500 text-xs shrink-0">
                    {new Date(check.at).toLocaleTimeString().slice(-8)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {checks.length === 0 && (
        <div className="text-slate-500 text-xs text-center py-4">
          No checkpoints recorded yet...
        </div>
      )}
    </div>
  );
}

// Helper function to validate engines, now using the enhanced getCanvasEngine
function validateEngine(side: 'LEFT' | 'RIGHT', engineRef: React.MutableRefObject<any | null>, canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const { engine: e, canvas: cv } = getCanvasEngine(engineRef, canvasRef); // Use the utility function

  if (!e || !cv) {
    checkpoint({ id: 'gpu.canvas_size', side: side === 'LEFT' ? 'REAL' : 'SHOW', stage: 'gpu', pass: false, msg: 'Missing engine/canvas', expect: 'present', actual: 'missing', sev: 'error'});
    checkpoint({ id: 'gpu.webgl_context', side: side === 'LEFT' ? 'REAL' : 'SHOW', stage: 'gpu', pass: false, msg: 'Missing engine/canvas', expect: 'present', actual: 'missing', sev: 'error'});
    return;
  }

  const cw = N(cv?.clientWidth || cv?.width, 0);
  const ch = N(cv?.clientHeight || cv?.height, 0);
  const canvasOk = cw >= 64 && ch >= 64;

  checkpoint({
    id: 'gpu.canvas_size', side: side === 'LEFT' ? 'REAL' : 'SHOW', stage: 'gpu',
    pass: canvasOk,
    msg: `Canvas ${cw}×${ch}px`,
    expect: '>=64x64', actual: `${cw}×${ch}`,
    sev: !canvasOk ? 'error' : 'info'
  });

  const gl = e?.gl;
  const ctxOk = !!gl && !(gl?.isContextLost && gl.isContextLost());

  checkpoint({
    id: 'gpu.webgl_context', side: side === 'LEFT' ? 'REAL' : 'SHOW', stage: 'gpu',
    pass: ctxOk,
    msg: gl ? (ctxOk ? "WebGL alive" : "context lost") : "missing",
    expect: 'alive', actual: gl ? (ctxOk ? 'alive' : 'lost') : 'missing',
    sev: !ctxOk ? 'error' : 'info'
  });

  // Re-evaluate shaders linked status as well
  const glStatus = getLinkStatus(e);
  checkpoint({
    id: 'gpu.shaders_linked',
    side: side === 'LEFT' ? 'REAL' : 'SHOW',
    stage: 'gpu',
    pass: glStatus.ok,
    msg: glStatus.reason,
    expect: 'linked',
    actual: glStatus.stage,
    sev: glStatus.ok ? 'info' : (glStatus.stage === 'compiling' ? 'warn' : 'error'),
  });
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
  lightCrossing,
}: {
  leftLabel?: string;
  rightLabel?: string;
  leftEngineRef: React.MutableRefObject<any | null>;
  rightEngineRef: React.MutableRefObject<any | null>;
  leftCanvasRef: React.RefObject<HTMLCanvasElement>;
  rightCanvasRef: React.RefObject<HTMLCanvasElement>;
  live?: any;
  parameters?: any; // Optional parameters object from renderer for perfect consistency
  lightCrossing?: { burst_ms?: number; dwell_ms?: number };
}) {
  // Store engine refs globally for the CompactCheckpointTable
  useEffect(() => {
    (window as any).__leftEngine = leftEngineRef.current;
    (window as any).__rightEngine = rightEngineRef.current;
  }, [leftEngineRef.current, rightEngineRef.current]);
  const modeKey = (live?.currentMode as string) || "hover";
  const snap = (live?.byMode && live?.byMode[modeKey]) || (live?.modes && live?.modes[modeKey]) || live || undefined;

  // Compute Ford–Roman duty from LC props (STRICT: no fallback)
  const dutyLocal = (Number.isFinite(lightCrossing?.burst_ms) && Number.isFinite(lightCrossing?.dwell_ms) && (lightCrossing!.dwell_ms! > 0))
    ? (lightCrossing!.burst_ms! / lightCrossing!.dwell_ms!)
    : NaN;

  const sTotal       = snap?.sectorCount ?? 400;
  const sConcLeft    = leftEngineRef.current?.uniforms?.sectors  ?? 1;
  const sConcRight   = rightEngineRef.current?.uniforms?.sectors ?? sConcLeft;
  const dutyFR_left  = (Number.isFinite(dutyLocal) ? dutyLocal : NaN) * (sConcLeft  / sTotal);
  const dutyFR_right = (Number.isFinite(dutyLocal) ? dutyLocal : NaN) * (sConcRight / sTotal);

  // Pretty strings
  const dutyLocalPct    = Number.isFinite(dutyLocal)    ? `${(dutyLocal*100).toFixed(3)}%`    : '—';
  const dutyFRPct_left  = Number.isFinite(dutyFR_left)  ? `${(dutyFR_left*100).toFixed(4)}%`  : '—';
  const dutyFRPct_right = Number.isFinite(dutyFR_right) ? `${(dutyFR_right*100).toFixed(4)}%` : '—';


  const leftRows  = useCheckpointList(leftLabel,  leftEngineRef,  leftCanvasRef,  snap, { parity: true,  ridge: 0 }, dutyFR_left,  (u)=>thetaExpected(u, dutyFR_left,  snap));
  const rightRows = useCheckpointList(rightLabel, rightEngineRef, rightCanvasRef, snap, { parity: false, ridge: 1 }, dutyFR_right, (u)=>thetaExpected(u, dutyFR_right, snap));

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
            (() => {
              const exp = expectedThetaForPane(snap, leftEngineRef.current);
              return Number.isFinite(exp) ? exp.toExponential(2) : '—';
            })()
          }</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">γ_geo × q × γ_VdB:</span>
          <span className="font-mono">{
            parameters
              ? `${N(parameters.g_y, 26)}³ × ${N(parameters.qSpoilingFactor, 1).toFixed(2)} × ${N(parameters.gammaVanDenBroeck, 1.4e5).toExponential(1)}`
              : `${N(snap?.gammaGeo ?? snap?.g_y, 26)}³ × ${N(snap?.deltaAOverA ?? snap?.qSpoilingFactor, 1).toFixed(2)} × ${N(snap?.gammaVdB ?? snap?.gammaVanDenBroeck, 1.4e5).toExponential(1)}`
          }</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">Duty local / Ford-Roman:</span>
          <span className="font-mono">{dutyLocalPct} / {dutyFRPct_left} (REAL) • {dutyFRPct_right} (SHOW)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">Sectors conc/total:</span>
          <span className="font-mono">{sConcLeft}/{sTotal} (REAL) • {sConcRight}/{sTotal} (SHOW)</span>
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

  // Validate both engines every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const leftEngineCanvas = getCanvasEngine(leftEngineRef, leftCanvasRef);
      const rightEngineCanvas = getCanvasEngine(rightEngineRef, rightCanvasRef);

      validateEngine('LEFT', { current: leftEngineCanvas.engine }, { current: leftEngineCanvas.canvas });
      validateEngine('RIGHT', { current: rightEngineCanvas.engine }, { current: rightEngineCanvas.canvas });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Real-time updates every frame for critical metrics
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const leftEngineCanvas = getCanvasEngine(leftEngineRef, leftCanvasRef);
      const rightEngineCanvas = getCanvasEngine(rightEngineRef, rightCanvasRef);

      validateEngine('LEFT', { current: leftEngineCanvas.engine }, { current: leftEngineCanvas.canvas });
      validateEngine('RIGHT', { current: rightEngineCanvas.engine }, { current: rightEngineCanvas.canvas });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="mt-3 space-y-3">
      {/* D) Compact checkpoint table with stop-on-error toggle */}
      <CompactCheckpointTable />

      {/* DAG Checkpoint System */}
      <CheckpointViewer title="DAG: Props → Calc → Uniforms → GPU → Frame" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-white/90">{leftLabel} — Legacy Checks</h4>
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
            <h4 className="text-sm font-semibold text-white/90">{rightLabel} — Legacy Checks</h4>
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
    </div>
  );
}