"use client";
import React, {useEffect, useMemo, useRef, useState} from "react";
import { checkpoint, Check, Side, Stage, within, onCheck } from "@/lib/checkpoints";
import { thetaScaleExpected } from "@/lib/expectations";
import CheckpointViewer from "./CheckpointViewer";

// Do NOT send theta from here. Engine computes canonical θ internally.

const sanitizeUniforms = (o: any) =>
  Object.fromEntries(Object.entries(o ?? {}).filter(([_, v]) => v !== undefined));
function paneSanitize(pane: 'REAL'|'SHOW', patch: any) {
  const p = { ...patch };
  if (pane === 'REAL') { p.physicsParityMode = true;  p.parityMode = true;  p.viewAvg = true;  p.ridgeMode = 0; }
  else                 { p.physicsParityMode = false; p.parityMode = false; p.viewAvg = false; p.ridgeMode = 1; }
  delete (p as any).thetaScale;
  delete (p as any).u_thetaScale;
  return p;
}
function buildRealPacket(parameters: any, base: any = {}) {
  const dutyFR = Math.max(1e-9, Math.min(1, parameters?.dutyEffectiveFR ?? parameters?.dutyFR ?? 0.000025));
  return {
    ...base,
    currentMode: parameters?.currentMode,
    physicsParityMode: true,
    viewAvg: true,
    dutyEffectiveFR: dutyFR,
    dutyCycle: dutyFR,
    sectors: 1,
    sectorCount: 1,
    vShip: 0,
    ridgeMode: 0,
    gammaVanDenBroeck_mass: Math.max(1, Math.min(1000,
      parameters?.gammaVanDenBroeck_mass ?? parameters?.gammaVanDenBroeck ?? 38.3)),
    thetaScale: undefined, u_thetaScale: undefined,
  };
}
function buildShowPacket(parameters: any, base: any = {}) {
  return {
    ...base,
    currentMode: parameters?.currentMode,
    physicsParityMode: false,
    viewAvg: false,
    dutyCycle: Math.max(0, Math.min(1, parameters?.dutyCycle ?? 0.14)),
    sectorCount: Math.max(1, Math.floor(parameters?.sectorCount ?? 400)),
    sectors:     Math.max(1, Math.floor(parameters?.sectors     ?? 1)),
    vShip: parameters?.currentMode === 'standby' ? 0 : 1,
    ridgeMode: 1,
    gammaVanDenBroeck_vis: Math.max(1, Math.min(1e9,
      parameters?.gammaVanDenBroeck_vis ?? parameters?.gammaVanDenBroeck ?? 2.86e5)),
    thetaScale: undefined, u_thetaScale: undefined,
  };
}

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

// ───────────────────────────────────────────────────────────────────────────────
// Projection helpers: take a point on the ellipsoid shell and project to NDC/pixels
// ───────────────────────────────────────────────────────────────────────────────
type Vec3 = [number, number, number];
type NDC = { x: number; y: number; z: number; w: number };

function shellPointOnDir(axes: Vec3, dir: Vec3): Vec3 {
  // Solve s so that ((s*dx)/ax)^2 + ((s*dy)/ay)^2 + ((s*dz)/az)^2 = 1  with p = s*dir
  const [ax, ay, az] = axes.map(v => Math.max(1e-9, +v)) as Vec3;
  const [dx, dy, dz] = dir as Vec3;
  const denom = (dx*dx)/(ax*ax) + (dy*dy)/(ay*ay) + (dz*dz)/(az*az);
  const s = (denom > 0) ? (1 / Math.sqrt(denom)) : 0;
  return [s*dx, s*dy, s*dz];
}

function projectToNDC(mvp: Float32Array | number[], p: Vec3): NDC | null {
  if (!mvp || (mvp as any).length !== 16) return null;
  const m = mvp as any;
  const x = p[0], y = p[1], z = p[2];
  const X = m[0]*x + m[4]*y + m[8 ]*z + m[12];
  const Y = m[1]*x + m[5]*y + m[9 ]*z + m[13];
  const Z = m[2]*x + m[6]*y + m[10]*z + m[14];
  const W = m[3]*x + m[7]*y + m[11]*z + m[15];
  if (Math.abs(W) < 1e-9) return { x: 0, y: 0, z: Z, w: W };
  return { x: X / W, y: Y / W, z: Z / W, w: W };
}

function ndcToPixels(ndc: NDC | null, canvas?: HTMLCanvasElement | null) {
  if (!ndc || !canvas) return null;
  const w = canvas.clientWidth || canvas.width || 0;
  const h = canvas.clientHeight || canvas.height || 0;
  if (!w || !h) return null;
  // NDC (-1..1) → pixels
  const px = Math.round((ndc.x * 0.5 + 0.5) * w);
  const py = Math.round((1 - (ndc.y * 0.5 + 0.5)) * h); // invert Y for screen space
  const onScreen = ndc.x >= -1 && ndc.x <= 1 && ndc.y >= -1 && ndc.y <= 1 && ndc.w > 0;
  return { px, py, onScreen };
}

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

// ✅ Pane-specific expected θ using one duty law (√d_FR) and engine authority
function expectedThetaForPane(live: any, engine: any) {
  const N = (x:any,d=0)=>Number.isFinite(+x)?+x:d;

  // Mode gate
  const mode = String((engine?.uniforms?.currentMode ?? live?.currentMode) || '').toLowerCase();
  if (mode === 'standby') return 0;

  // Prefer values bound to the engine (authoritative for the pane)
  const gammaGeo = Math.max(1, N(engine?.uniforms?.gammaGeo ?? live?.gammaGeo ?? live?.g_y, 26));
  const q        = Math.max(1e-12, N(engine?.uniforms?.qSpoilingFactor ?? engine?.uniforms?.deltaAOverA ?? live?.deltaAOverA ?? live?.qSpoilingFactor, 1));
  const gVdB     = Math.max(1, N(engine?.uniforms?.gammaVdB ?? engine?.uniforms?.gammaVanDenBroeck ?? live?.gammaVanDenBroeck ?? live?.gammaVdB, 1.4e5));

  // Duty: prefer the pane's actual d_FR from uniforms/echo; else compute
  const echo = (window as any).__warpEcho;
  const dFR_echo = Number.isFinite(echo?.terms?.d_FR) ? Math.max(1e-12, +echo.terms.d_FR) : NaN;
  const dFR_u    = Number.isFinite(engine?.uniforms?.dutyEffectiveFR) ? Math.max(1e-12, +engine.uniforms.dutyEffectiveFR) : NaN;

  // Fallback from UI knobs only if needed (dutyCycle/sectorCount)
  const sectorsTotal = Math.max(1, N(live?.sectorCount ?? engine?.uniforms?.sectorCount, 400));
  const sectorsLive  = Math.max(1, N(engine?.uniforms?.sectors ?? 1, 1));
  const dutyLocal    = 0.01; // from light-crossing loop
  const dFR_fallback = dutyLocal * (sectorsLive / sectorsTotal);

  const dFR = Number.isFinite(dFR_u) ? dFR_u : (Number.isFinite(dFR_echo) ? dFR_echo : dFR_fallback);

  const base = Math.pow(gammaGeo, 3) * q * gVdB;
  const viewAvg = (engine?.uniforms?.viewAvg ?? live?.viewAvg ?? true) ? 1 : 0;
  return viewAvg ? base * Math.sqrt(dFR) : base; // (no √ term when not averaging)
}

// ✅ Prefer pipeline/engine d_FR; fall back to dutyCycle/sectors
function computeThetaScaleFromParams(v: any) {
  const N = (x:any,d=0)=>Number.isFinite(+x)?+x:d;
  const gammaGeo = Math.max(1, N(v.gammaGeo, 26));
  const q        = Math.max(1e-12, N(v.qSpoilingFactor ?? v.deltaAOverA, 1));
  const gVdB     = Math.max(1, N(v.gammaVanDenBroeck ?? v.gammaVdB, 1.4e5));

  const sectors   = Math.max(1, Math.floor(N(v.sectorCount ?? v.sectors, 1)));
  const dutyUI    = Math.max(0, N(v.dutyCycle, 0));
  const dFR_ui    = Math.max(1e-12, dutyUI / sectors);

  const dFR = Math.max(1e-12, N(v.dutyEffectiveFR, dFR_ui));
  const base = Math.pow(gammaGeo, 3) * q * gVdB;
  const averaging = (v.viewAvg ?? true);

  return averaging ? base * Math.sqrt(dFR) : base;
}

// If you display "expected/exp" θ, compute locally for display-only (never send)
function expectedThetaForPanel(u: any, pane: 'REAL'|'SHOW') {
  const g  = Math.max(1, Number(u?.gammaGeo ?? u?.g_y ?? 26));
  const q  = Math.max(1e-12, Number(u?.deltaAOverA ?? u?.qSpoilingFactor ?? 1));
  const vM = Math.max(1, Math.min(1e2, Number(u?.gammaVanDenBroeck_mass ?? 38.3)));
  const vV = Math.max(1, Math.min(1e9, Number(u?.gammaVanDenBroeck_vis  ?? 2.86e5)));
  const sectors   = Math.max(1, pane === 'REAL' ? 1 : (u?.sectors ?? 1));
  const sectorCnt = Math.max(1, pane === 'REAL' ? 1 : (u?.sectorCount ?? 400));
  const dutyLocal = Math.max(0, Number(u?.dutyCycle ?? 0.14));
  const dFR = pane === 'REAL' ? dutyLocal : (dutyLocal * (sectors/sectorCnt));
  const dutyFactor = pane === 'REAL' ? Math.sqrt(Math.max(1e-12, dFR)) : 1;
  const v = pane === 'REAL' ? vM : vV;
  return (g*g*g) * q * v * dutyFactor;
}

// ✅ Single-source expected θ; caller provides dutyFR for the pane
function thetaExpected(u: any, dutyFR: number, liveSnap?: any) {
  const N = (x:any,d=0)=>Number.isFinite(+x)?+x:d;
  const g  = Math.max(1, N(u.gammaGeo, 26));
  const q  = Math.max(1e-12, N(u.deltaAOverA ?? u.qSpoilingFactor, 1));
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

  return useMemo(() => {
    const { engine: e, canvas: cv } = getCanvasEngine(engineRef, canvasRef); // Use the utility function
    const rows: { label: string; detail?: string; state: "ok" | "warn" | "fail" }[] = [];
    const side: Side = label === "REAL" ? "REAL" : "SHOW";

    // 👂 Publish the engine's current physics authority for other UI bits
    publishWarpEcho(e, side, liveSnap);

    // ── Gather geometry & view for projection checks
    const u = e?.uniforms || {};
    const axesScene: Vec3 = (Array.isArray(u?.axesClip) && u.axesClip.length === 3)
      ? [u.axesClip[0], u.axesClip[1], u.axesClip[2]]
      : (Array.isArray(u?.axesScene) && u.axesScene.length === 3 ? [u.axesScene[0], u.axesScene[1], u.axesScene[2]] : [1,1,1]);
    const driveRaw: Vec3 = (Array.isArray(u?.driveDir) && u.driveDir.length === 3) ? [u.driveDir[0], u.driveDir[1], u.driveDir[2]] : [1,0,0];
    // normalize drive dir in scene-scaled space (same as engine)
    const dN = (() => {
      const t: Vec3 = [driveRaw[0] / axesScene[0], driveRaw[1] / axesScene[1], driveRaw[2] / axesScene[2]];
      const m = Math.hypot(t[0], t[1], t[2]) || 1;
      return [t[0]/m, t[1]/m, t[2]/m] as Vec3;
    })();
    // Points on the ellipsoid shell along ±drive direction
    const pFront = shellPointOnDir(axesScene, dN);
    const pRear  = shellPointOnDir(axesScene, [-dN[0], -dN[1], -dN[2]]);
    const ndcF   = projectToNDC(e?.mvpMatrix, pFront);
    const ndcR   = projectToNDC(e?.mvpMatrix, pRear);
    const pixF   = ndcToPixels(ndcF as any, cv);
    const pixR   = ndcToPixels(ndcR as any, cv);

    // === DAG Stage 1: INPUT CHECKPOINTS ===
    // Pipeline inputs validation
    const gammaGeo = N(liveSnap?.gammaGeo ?? liveSnap?.g_y, 26);
    const deltaAOverA = N(liveSnap?.deltaAOverA ?? liveSnap?.qSpoilingFactor, 1);
    const gammaVdB = N(liveSnap?.gammaVdB ?? liveSnap?.gammaVanDenBroeck, 1.4e5);
    const sectors = Math.max(1, Math.floor(N(liveSnap?.sectorCount ?? liveSnap?.sectors, 1)));
    const duty = N(liveSnap?.dutyCycle, 0);

    checkpoint({
      id: 'input.gamma_geo', side, stage: 'input',
      pass: gammaGeo >= 1 && gammaGeo <= 1000,
      msg: `γ_geo=${gammaGeo}`,
      expect: [1, 1000], actual: gammaGeo,
      sev: gammaGeo < 1 || gammaGeo > 1000 ? 'error' : 'info'
    });

    checkpoint({
      id: 'input.delta_aa', side, stage: 'input',
      pass: deltaAOverA >= 1e-12 && deltaAOverA <= 100,
      msg: `δA/A=${deltaAOverA}`,
      expect: [1e-12, 100], actual: deltaAOverA,
      sev: deltaAOverA < 1e-12 || deltaAOverA > 100 ? 'error' : 'info'
    });

    checkpoint({
      id: 'input.gamma_vdb', side, stage: 'input',
      pass: gammaVdB >= 1 && gammaVdB <= 1e15,
      msg: `γ_VdB=${gammaVdB.toExponential(1)}`,
      expect: [1, 1e15], actual: gammaVdB,
      sev: gammaVdB < 1 || gammaVdB > 1e15 ? 'error' : 'info'
    });

    // === DAG Stage 2: EXPECTATIONS (Single Source of Truth) ===
    // Calculate the expected θ-scale using canonical formula (RAW, no tone-mapping)
    const dutyFR = Math.max(1e-12, duty / sectors);
    const thetaExpected = thetaScaleExpected({
      gammaGeo: Math.max(1, gammaGeo),
      q: Math.max(1e-12, deltaAOverA), 
      gammaVdB: Math.max(1, gammaVdB),
      dFR: dutyFR
    });

    checkpoint({
      id: 'expect.theta_scale', side, stage: 'expect',
      pass: Number.isFinite(thetaExpected) && thetaExpected > 0,
      msg: `θ_expected=${thetaExpected.toExponential(2)}`,
      expect: '>0', actual: thetaExpected,
      sev: !Number.isFinite(thetaExpected) || thetaExpected <= 0 ? 'error' : 'info',
      meta: { gammaGeo, q: deltaAOverA, gammaVdB, dFR: dutyFR }
    });

    // === DAG Stage 3: UNIFORMS ===
    // (u defined above)
    const ts = N(u?.thetaScale, NaN);

    // Expected uniforms θ from the same chain the engine uses (RAW)
    const thetaUniformExpected = expectedThetaForPane(liveSnap, e);

    checkpoint({
      id: 'uniforms.theta_scale', side, stage: 'uniforms',
      pass: Number.isFinite(ts) && ts > 0,
      msg: `θ_uniforms=${Number.isFinite(ts) ? ts.toExponential(2) : 'NaN'} vs expected=${thetaUniformExpected.toExponential(2)}`,
      expect: thetaUniformExpected, actual: ts,
      sev: !Number.isFinite(ts) || ts <= 0 ? 'error' : (within(ts, thetaUniformExpected, 0.10) ? 'info' : 'warn'),
      meta: { law: 'γ^3·q·γVdB·(√d_FR if viewAvg)' }
    });

    // NEW: CameraZ presence checkpoint (warn-only so it won’t halt render)
    const camZOk = Number.isFinite(u?.cameraZ);
    checkpoint({
      id: 'uniforms.cameraZ',
      side,
      stage: 'uniforms',
      pass: camZOk,
      msg: camZOk ? `cameraZ=${(+u.cameraZ).toFixed(2)}` : 'CameraZ unset',
      expect: 'number', actual: camZOk ? u.cameraZ : 'unset',
      sev: camZOk ? 'info' : 'warn'
    });

    checkpoint({
      id: 'uniforms.ridge_mode', side, stage: 'uniforms',
      pass: expectations?.ridge != null ? (u?.ridgeMode | 0) === (expectations.ridge | 0) : true,
      msg: `ridgeMode=${u?.ridgeMode}`,
      expect: expectations?.ridge, actual: u?.ridgeMode,
      sev: expectations?.ridge != null && (u?.ridgeMode | 0) !== (expectations.ridge | 0) ? 'warn' : 'info'
    });

    checkpoint({
      id: 'uniforms.parity_mode', side, stage: 'uniforms', 
      pass: expectations?.parity != null ? !!(u.physicsParityMode ?? u.parityMode) === !!expectations.parity : true,
      msg: `parity=${!!(u.physicsParityMode ?? u.parityMode)}`,
      expect: expectations?.parity, actual: !!(u.physicsParityMode ?? u.parityMode),
      sev: expectations?.parity != null && !!(u.physicsParityMode ?? u.parityMode) !== !!expectations.parity ? 'warn' : 'info'
    });

    // NEW: Informational display-space θ (tone-mapped) — for context only
    {
      const exposure   = Math.max(1.0, N(u?.exposure, 6.0));
      const zeroStop   = Math.max(1e-18, N(u?.zeroStop, 1e-7));
      const userGain   = Math.max(1.0, N(u?.userGain, 1.0));
      const boostT     = clamp01(N(u?.curvatureGainT, 0));
      const boostMax   = Math.max(1, N(u?.curvatureBoostMax, 40));
      const boostNow   = 1 + boostT * (boostMax - 1);

      // We use a unit baseMag for comparability; this row is *informational*, not a pass/fail gate.
      const baseMag = 1;

      const magUniform = Math.log(1 + (baseMag * ts * userGain * boostNow) / zeroStop);
      const magExpect  = Math.log(1 + (baseMag * thetaUniformExpected * userGain * boostNow) / zeroStop);
      const thetaDisplayUniform = magUniform / Math.log(1 + exposure);
      const thetaDisplayExpect  = magExpect  / Math.log(1 + exposure);

      checkpoint({
        id: 'uniforms.theta_display_info',
        side,
        stage: 'uniforms',
        pass: true,
        msg: `θ_display uniform=${Number.isFinite(thetaDisplayUniform) ? thetaDisplayUniform.toFixed(3) : '—'} vs exp=${Number.isFinite(thetaDisplayExpect) ? thetaDisplayExpect.toFixed(3) : '—'}`,
        expect: 'info-only',
        actual: { thetaDisplayUniform, thetaDisplayExpect, exposure, zeroStop, userGain, boostNow },
        sev: 'info'
      });
    }

    // ── NEW: Shader amplitude estimate (what the FS multiplies with)
    // amp = u_thetaScale * max(1, u_userGain) * showGain * vizSeason * (1 + tBlend*(tBoost-1))
    {
      const parity = !!(u.physicsParityMode ?? u.parityMode);
      const showGain  = parity ? 1.0 : Math.max(1, N(u?.displayGain, 1));
      const vizSeason = parity ? 1.0 : Math.max(1, N(u?.vizGain, 1));
      const tBlend    = parity ? 0.0 : clamp01(N(u?.curvatureGainT, 0));
      const tBoostMax = parity ? 1.0 : Math.max(1, N(u?.curvatureBoostMax, 40));
      const userGain  = Math.max(1, N(u?.userGain, 1));
      const ampEst    = (Number.isFinite(ts) ? ts : 0) * userGain * showGain * vizSeason * (1 + tBlend * (tBoostMax - 1));

      checkpoint({
        id: 'uniforms.theta_shader_amp_est',
        side,
        stage: 'uniforms',
        pass: Number.isFinite(ampEst) && ampEst >= 0,
        msg: `θ(shader) amp≈${Number.isFinite(ampEst) ? ampEst.toExponential(2) : '—'} (parity=${parity})`,
        expect: 'info-only',
        actual: { ts, userGain, showGain, vizSeason, tBlend, tBoostMax },
        sev: 'info'
      });
    }

    // === DAG Stage 4: GPU STATE ===
    const cw = N(cv?.clientWidth || cv?.width, 0);
    const ch = N(cv?.clientHeight || cv?.height, 0);
    const canvasOk = cw >= 64 && ch >= 64;

    checkpoint({
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

    checkpoint({
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
      checkpoint({
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

    // θ readouts (prefer engine's telemetry "thetaScale_actual" when present)
    const thetaShaderReal  = Number(e?.uniforms?.thetaScale_actual ?? e?.uniforms?.thetaScale ?? NaN);
    const thetaExpected    = expectedThetaForPanel(u, side);
    const thetaDelta       = Number.isFinite(thetaShaderReal) && Number.isFinite(thetaExpected) 
      ? ((thetaShaderReal / thetaExpected - 1) * 100).toFixed(1) + '%'
      : '—';

    // Grid buffers
    const verts = (e?.gridVertices?.length || 0);
    const orig = (e?.originalGridVertices?.length || 0);
    const gridOk = verts > 0 && orig > 0;

    checkpoint({
      id: 'gpu.grid_buffers', side, stage: 'gpu',
      pass: gridOk,
      msg: `Grid buffers ${verts}/${orig} floats`,
      expect: '>0', actual: { verts, orig },
      sev: !gridOk ? 'error' : 'info'
    });

    // === DAG Stage 5: FRAME PROVENANCE ===
    // Frame analysis would need readPixels - simplified for now
    const frameAlive = !!e?._raf;

    checkpoint({
      id: 'frame.render_loop', side, stage: 'frame',
      pass: frameAlive,
      msg: frameAlive ? "RAF active" : "render stopped",
      expect: 'active', actual: frameAlive ? 'active' : 'stopped',
      sev: !frameAlive ? 'warn' : 'info'
    });

    // Tone mapping checkpoint (exp/zs/toneOk declared later in original code)
    checkpoint({
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

    // Theta-scale (reusing existing ts)
    const tsOk = Number.isFinite(ts) && ts > 0;
    let tsState: "ok" | "warn" | "fail" = tsOk ? "ok" : "fail";
    let tsDetail = tsOk ? ts.toExponential(2) : "invalid";

    // Get bound uniforms from engine's __warpEcho for self-consistency
    const echo = (window as any).__warpEcho;

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

    if (echo && echo.terms) {
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

    // Updated theta scale row with engine telemetry
    const tsOk = Number.isFinite(ts) && ts > 0;
    let tsState: "ok" | "warn" | "fail" = tsOk ? "ok" : "fail";
    let tsDetail = tsOk ? `${ts.toExponential(2)} • exp ${thetaExpected.toExponential(2)} (Δ ${thetaDelta})` : "invalid";

    rows.push({ label: "θ-scale", detail: tsDetail, state: tsState });

    // ── NEW: WebGL projection rows (front/rear shell along drive direction)
    if (ndcF && pixF) {
      const detailF = `NDC=(${ndcF.x.toFixed(3)}, ${ndcF.y.toFixed(3)}, ${ndcF.z.toFixed(3)}) • px=(${pixF.px}, ${pixF.py}) ${pixF.onScreen ? '' : '• offscreen'}`;
      rows.push({ label: "Front (ρ=1) projection", detail: detailF, state: pixF.onScreen ? "ok" : "warn" });
      checkpoint({
        id: 'gpu.mvp_front',
        side,
        stage: 'gpu',
        pass: pixF.onScreen,
        msg: detailF,
        expect: 'inside frustum',
        actual: detailF,
        sev: pixF.onScreen ? 'info' : 'warn'
      });
    }
    if (ndcR && pixR) {
      const detailR = `NDC=(${ndcR.x.toFixed(3)}, ${ndcR.y.toFixed(3)}, ${ndcR.z.toFixed(3)}) • px=(${pixR.px}, ${pixR.py}) ${pixR.onScreen ? '' : '• offscreen'}`;
      rows.push({ label: "Rear (ρ=1) projection", detail: detailR, state: pixR.onScreen ? "ok" : "warn" });
      checkpoint({
        id: 'gpu.mvp_rear',
        side,
        stage: 'gpu',
        pass: pixR.onScreen,
        msg: detailR,
        expect: 'inside frustum',
        actual: detailR,
        sev: pixR.onScreen ? 'info' : 'warn'
      });
    }

    // Show detailed breakdown from bound uniforms if available
    if (echo && echo.terms) {
      const terms = echo.terms;
      const breakdown = `src=${echo.src || 'unknown'} v=${echo.v || '?'} · γ_geo=${terms.γ_geo || '?'}^3 · q=${terms.q || '?'} · γ_VdB=${(terms.γ_VdB || 0).toExponential(2)} · d_FR=${((terms.d_FR || 0) * 100).toExponential(2)}%`;
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

    // ── Frame console line for quick triage
    try {
      const parity = !!(u.physicsParityMode ?? u.parityMode);
      const showGain  = parity ? 1.0 : Math.max(1, N(u?.displayGain, 1));
      const vizSeason = parity ? 1.0 : Math.max(1, N(u?.vizGain, 1));
      const tBlend    = parity ? 0.0 : clamp01(N(u?.curvatureGainT, 0));
      const tBoostMax = parity ? 1.0 : Math.max(1, N(u?.curvatureBoostMax, 40));
      const userGain  = Math.max(1, N(u?.userGain, 1));
      const ampEst    = (Number.isFinite(ts) ? ts : 0) * userGain * showGain * vizSeason * (1 + tBlend * (tBoostMax - 1));

      console.log(`[WRC θ] ${label}`, {
        theta_uniform: ts,
        theta_expected_chain: thetaUniformExpected,
        shader_amp_est: ampEst,
        parity,
        viewAvg: (u?.viewAvg ?? true),
        sectors: { live: u?.sectors, total: u?.sectorCount },
        dutyUsed: u?.dutyUsed ?? u?.dutyEffectiveFR,
        front_ndc: ndcF, rear_ndc: ndcR,
        front_px: pixF, rear_px: pixR
      });
    } catch {}

    return rows;
  }, [engineRef.current, canvasRef.current, liveSnap, hb, label, dutyFR, thetaExpectedFn]);
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
    checkpoint({ id: 'gpu.canvas_size', side, stage: 'gpu', pass: false, msg: 'Missing engine/canvas', expect: 'present', actual: 'missing', sev: 'error'});
    checkpoint({ id: 'gpu.webgl_context', side, stage: 'gpu', pass: false, msg: 'Missing engine/canvas', expect: 'present', actual: 'missing', sev: 'error'});
    return;
  }

  const cw = N(cv?.clientWidth || cv?.width, 0);
  const ch = N(cv?.clientHeight || cv?.height, 0);
  const canvasOk = cw >= 64 && ch >= 64;

  checkpoint({
    id: 'gpu.canvas_size', side, stage: 'gpu',
    pass: canvasOk,
    msg: `Canvas ${cw}×${ch}px`,
    expect: '>=64x64', actual: `${cw}×${ch}`,
    sev: !canvasOk ? 'error' : 'info'
  });

  const gl = e?.gl;
  const ctxOk = !!gl && !(gl?.isContextLost && gl.isContextLost());

  checkpoint({
    id: 'gpu.webgl_context', side, stage: 'gpu',
    pass: ctxOk,
    msg: gl ? (ctxOk ? "WebGL alive" : "context lost") : "missing",
    expect: 'alive', actual: gl ? (ctxOk ? 'alive' : 'lost') : 'missing',
    sev: !ctxOk ? 'error' : 'info'
  });

  // Re-evaluate shaders linked status as well
  const glStatus = getLinkStatus(e);
  checkpoint({
    id: 'gpu.shaders_linked',
    side,
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

  // Compute Ford-Roman duty from light-crossing loop
  const dutyLocal = (lightCrossing?.burst_ms && lightCrossing?.dwell_ms)
    ? (lightCrossing.burst_ms / lightCrossing.dwell_ms)    // ~0.01
    : 0.01;                                                 // fallback

  const sTotal       = snap?.sectorCount ?? 400;
  const sConcLeft    = leftEngineRef.current?.uniforms?.sectors  ?? 1;
  const sConcRight   = rightEngineRef.current?.uniforms?.sectors ?? sConcLeft;
  const dutyFR_left  = dutyLocal * (sConcLeft  / sTotal);
  const dutyFR_right = dutyLocal * (sConcRight / sTotal);

  // Pretty strings
  const dutyLocalPct = `${(dutyLocal*100).toFixed(3)}%`;
  const dutyFRPct_left = `${(dutyFR_left*100).toFixed(4)}%`;
  const dutyFRPct_right = `${(dutyFR_right*100).toFixed(4)}%`;


  const leftRows  = useCheckpointList(leftLabel,  leftEngineRef,  leftCanvasRef,  snap, { parity: true,  ridge: 0 }, dutyFR_left,  (u)=>thetaExpected(u, dutyFR_left,  snap));
  const rightRows = useCheckpointList(rightLabel, rightEngineRef, rightCanvasRef, snap, { parity: false, ridge: 1 }, dutyFR_right, (u)=>thetaExpected(u, dutyFR_right, snap));

  // quick reasons summary if anything hard-fails
  const hardFailsLeft  = leftRows.filter(r => r.state === 'fail').map(r => r.label);
  const hardFailsRight = rightRows.filter(r => r.state === 'fail').map(r => r.label);

  // convenience actions
  // Buttons that push presets / test writes (always go through builders)
  const onPresetReal = () => {
    if (!leftEngineRef.current) return;
    const pkt = paneSanitize('REAL', sanitizeUniforms(buildRealPacket(parameters, {})));
    leftEngineRef.current.updateUniforms(pkt);
  };
  const onPresetShow = () => {
    if (!rightEngineRef.current) return;
    const pkt = paneSanitize('SHOW', sanitizeUniforms(buildShowPacket(parameters, {})));
    rightEngineRef.current.updateUniforms(pkt);
  };

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
      real:   onPresetReal,
      show:   onPresetShow,
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