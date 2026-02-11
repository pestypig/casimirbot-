import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { createProgram, makeGrid, resizeCanvasAndViewport } from "@/lib/gl/simple-gl";
import { registerWebGLContext } from "@/lib/webgl/context-pool";
import PipelineCongruenceBadge from "@/components/common/PipelineCongruenceBadge";
import {
  AlcubierreParams,
  Vec3,
  theta as computeTheta,
} from "@/physics/alcubierre";

// --- helpers: mode-driven β and bubble R, vector utils -------------------------
const fmtExp = (x:any) => {
  const n = Number(x); return Number.isFinite(n) ? n.toExponential(3) : "—";
};
function num(x: any, d = 0) { const n = Number(x); return Number.isFinite(n) ? n : d; }
function normalize3(v: any): [number, number, number] {
  const x = Number(v?.[0]) || 0, y = Number(v?.[1]) || 0, z = Number(v?.[2]) || 0;
  const L = Math.hypot(x, y, z) || 1; return [x/L, y/L, z/L];
}
// dotted-path getter
function getPath(obj:any, path:string){
  try {
    return path.split(".").reduce((o,k)=> (o && typeof o==="object") ? o[k] : undefined, obj);
  } catch { return undefined; }
}
// Robust server-θ pick: try known paths, then bounded deep search for /theta/i
function pickThetaServer(live:any){
  const paths = [
    "thetaScale", "thetaUniform", "theta",
    "uniforms.thetaScale", "render.uniforms.thetaScale",
    "pipeline.thetaScale", "snapshot.uniforms.thetaScale",
    "amplification.thetaScale", "amplification.theta",
    "metrics.thetaScale", "server.thetaScale",
    "bridge.thetaServer", "engine.uniforms.thetaScale"
  ];
  for (const p of paths){
    const v = getPath(live, p);
    if (Number.isFinite(+v)) return { value: +v, source: p };
  }
  // bounded deep search (depth ≤ 4)
  const Q:[any,number,string][] = [[live,0,"root"]];
  while (Q.length){
    const [o,d,base] = Q.shift()!;
    if (!o || typeof o!=="object" || d>4) continue;
    for (const [k,v] of Object.entries(o)){
      if (Number.isFinite(+(v as any)) && /theta/i.test(k)) return { value: +(v as any), source: `${base}.${k}` };
      if (typeof v === "object") Q.push([v as any, d+1, `${base}.${k}`]);
    }
  }
  return { value: NaN, source: "" };
}
function pickBetaFromMode(live: any, metrics: any): number {
  const direct = num((live?.beta ?? live?.shipBeta ?? metrics?.ship?.beta ?? metrics?.drive?.beta), NaN);
  if (Number.isFinite(direct)) return Math.max(0, Math.min(0.99, direct));
  const m = String(live?.currentMode ?? 'hover').toLowerCase();
  if (m === 'standby') return 0.0; if (m === 'hover') return 0.10; if (m === 'cruise') return 0.60; if (m === 'emergency') return 0.95; return 0.30;
}
function pickRFromLive(live: any, axes: [number,number,number]): number {
  const explicit = num(live?.bubble?.R ?? live?.R ?? live?.radius, NaN);
  if (Number.isFinite(explicit)) return Math.max(1, explicit);
  const a = Number(axes?.[0])||1, b = Number(axes?.[1])||1, c = Number(axes?.[2])||1;
  const Rgeom = Math.cbrt(Math.max(1e-6,a)*Math.max(1e-6,b)*Math.max(1e-6,c));
  return Math.max(1, Rgeom);
}
/** CurvatureTensorPanel — York-Time side-view surface (engine-free WebGL2). */

type Props = {
  className?: string;
};

const VERT = `#version 300 es
layout(location=0) in vec2 a_pos; // square grid on x–z plane
uniform vec3 u_axes;              // hull axes for aspect (a,b,c); y used only for aspect
uniform float u_scale;            // world radius R for domain
uniform vec3 u_driveDir;         // unit vector for ship motion (default +x)
uniform float u_sigma;           // wall thickness control (σ)
uniform float u_R;               // bubble radius (R)
uniform float u_beta;            // ship β
uniform float u_thetaScale;      // optional global scale (pipeline amplification)
uniform float u_gain;            // adaptive height gain (CPU-chosen)
uniform float u_colorGain;       // adaptive color gain (CPU-chosen; keeps colors readable)
uniform float u_debugRing;       // >0 enables ring overlay
uniform float u_ringGain;        // [0..1] how visible the ring is (gate by √d_FR)
uniform mat4 u_mvp;             // camera

// helper
float topHat_f(float r, float sigma, float R) {
  float den = max(1e-6, 2.0 * tanh(sigma * R));
  return (tanh(sigma * (r + R)) - tanh(sigma * (r - R))) / den;
}

float d_topHat_dr(float r, float sigma, float R) {
  float den = max(1e-6, 2.0 * tanh(sigma * R));
  float A = 1.0 / cosh(sigma * (r + R));
  float B = 1.0 / cosh(sigma * (r - R));
  // d/dx tanh(x) = sech^2(x) = 1/cosh^2(x)
  float sech2A = A*A;
  float sech2B = B*B;
  return sigma * (sech2A - sech2B) / den;
}

out float v_theta;
out vec3 v_color;
out float v_ring;

vec3 diverge(float x) {
  // blue (−) → white → red (+)
  vec3 c1 = vec3(0.06,0.25,0.98);
  vec3 c2 = vec3(0.93,0.93,0.93);
  vec3 c3 = vec3(0.95,0.30,0.08);
  float t = clamp(0.5 + 0.5*x, 0.0, 1.0);
  return (t < 0.5) ? mix(c1,c2,t/0.5) : mix(c2,c3,(t-0.5)/0.5);
}

void main(){
  // map grid to physical x–z domain using R (u_scale) and normalized axes
  vec3 p = vec3(a_pos.x * u_scale * u_axes.x, 0.0, a_pos.y * u_scale * u_axes.z);
  float r = length(p);
  float xs = dot(normalize(u_driveDir), p);
  float dfdr = d_topHat_dr(max(1e-6,r), u_sigma, u_R);
  float theta = u_beta * (xs / max(r,1e-6)) * dfdr;  // York time (Alcubierre/White)
  v_theta = theta * u_thetaScale;                    // operational gate already applied
  // Colors use an adaptive gain so small-|θ| modes remain visible.
  v_color = diverge(clamp(v_theta * u_colorGain, -1.0, 1.0));
  // Debug ring near shell: highlight |df/dr| where top-hat transitions (thin band)
  float ringNorm = clamp(abs(dfdr) * (u_R / max(1e-6, u_sigma)), 0.0, 1.0);
  // Gate the overlay by operational power so standby shows no ring.
  v_ring = (u_debugRing > 0.0) ? (pow(ringNorm, 0.6) * clamp(u_ringGain, 0.0, 1.0)) : 0.0;

  // raise the surface by θ (scaled). Gain is adaptive; camera auto-fits R.
  float y = v_theta * u_gain;    // adaptive gain applied to height only
  vec4 pos = vec4(p.x, y, p.z, 1.0);
  gl_Position = u_mvp * pos;
}
`;

const FRAG = `#version 300 es
precision highp float;
in float v_theta;
in vec3 v_color;
in float v_ring;
out vec4 outColor;
void main(){
  vec3 base = v_color;
  if (v_ring > 0.0) {
    vec3 ringColor = vec3(0.98, 0.78, 0.18);
    float mixAmt = clamp(v_ring, 0.0, 1.0) * 0.45; // less dominant so the ±θ colors read
    base = mix(base, ringColor, mixAmt);
  }
  outColor = vec4(base, 0.95);
}
`;

export default function CurvatureTensorPanel({ className }: Props){
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext|null>(null);
  const releaseContextRef = useRef<() => void>(() => {});
  const progRef = useRef<WebGLProgram|null>(null);
  const vboRef = useRef<WebGLBuffer|null>(null);
  const [glStatus, setGlStatus] = useState<'ok'|'no-webgl'|'compile-fail'|'context-lost'>('ok');
  const [glError, setGlError] = useState<string | null>(null);
  // Side-view only; fixed grid resolution
  const [res] = useState(120);

  // live pipeline (for amplitude option and UI badges)
  const { data: live } = useEnergyPipeline({
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });

  // --- amplitude chain split ---------------------------------------------------
  // Base chain (no duty): γ_geo^3 · q · γ_VdB(vis)
  const thetaChain = useMemo(() => {
    const g = Number(live?.gammaGeo) || 1;
    const q = Number(live?.qSpoilingFactor ?? live?.q ?? 1) || 1;
    const vdb = Number(live?.gammaVanDenBroeck_vis ?? live?.gammaVanDenBroeck ?? 1) || 1;
    return Math.pow(g,3) * q * vdb;
  },[live]);
  // Operational gate: √d_FR (0 in standby)
  const dFR = useMemo(() => Math.max(0, num(live?.dutyEffectiveFR ?? live?.dutyFR, 0)), [live]);
  const opGate = useMemo(() => Math.sqrt(dFR), [dFR]);
  // θ_expected (operational): chain × gate (display only).
  const thetaExpected = useMemo(() => thetaChain * opGate, [thetaChain, opGate]);

  // θ_server if Helix publishes it (for audit/compare) — robust deep pick
  const { value: thetaServer, source: thetaSourcePath } = useMemo(() => pickThetaServer(live), [live]);

  // ---- operational gate: zero height when no energy is driven ------------------
  // Gate is √d_FR; we also zero out when active tiles are reported as 0.
  const dfrRaw = useMemo(
    () => Math.max(0, num(live?.dutyEffectiveFR ?? live?.dutyFR, 0)),
    [live]
  );
  const activeTiles = useMemo(
    () => num(live?.activeTiles ?? live?.tiles?.active ?? live?.S_live, NaN),
    [live]
  );
  const opGateRef = useRef(0); useEffect(() => { opGateRef.current = opGate; }, [opGate]);

  // defaults / controls
  const sigma = 6.0;              // wall thickness (dimensionless)

  // Render with normalized axes to keep geometry in a stable numeric range.
  // Absolute radius comes from R (picked from live); this stops huge hull values
  // from pushing the camera too far away.
  const axesNorm = useMemo(() => {
    const A = Number(live?.hull?.a) || 1;
    const B = Number(live?.hull?.b) || 1;
    const C = Number(live?.hull?.c) || 1;
    const M = Math.max(A, B, C) || 1;
    return [A/M, B/M, C/M] as [number, number, number];
  }, [live]);

  const beta = useMemo(() => pickBetaFromMode(live, null), [live]);
  const R = useMemo(() => pickRFromLive(live, axesNorm), [live, axesNorm]);
  const bubbleCenter = useMemo<Vec3>(() => {
    const candidate =
      (live as any)?.bubble?.center ??
      (live as any)?.bubble?.centerMetric ??
      (live as any)?.bubbleCenter ??
      (live as any)?.center;
    if (Array.isArray(candidate) && candidate.length >= 3) {
      const cx = Number(candidate[0]);
      const cy = Number(candidate[1]);
      const cz = Number(candidate[2]);
      return [
        Number.isFinite(cx) ? cx : 0,
        Number.isFinite(cy) ? cy : 0,
        Number.isFinite(cz) ? cz : 0,
      ] as Vec3;
    }
    if (candidate && typeof candidate === "object") {
      const cx = Number((candidate as any).x);
      const cy = Number((candidate as any).y);
      const cz = Number((candidate as any).z);
      if ([cx, cy, cz].every((n) => Number.isFinite(n))) {
        return [cx, cy, cz] as Vec3;
      }
    }
    return [0, 0, 0] as Vec3;
  }, [live]);

  const bubbleParams = useMemo<AlcubierreParams>(
    () => ({
      R: Math.max(1e-6, R),
      sigma,
      v: beta,
      center: bubbleCenter,
    }),
    [R, sigma, beta, bubbleCenter]
  );
  const driveDir = useMemo<[number,number,number]>(() => normalize3((live as any)?.driveDir ?? [1,0,0]), [live]);

  // --- adaptive height gain -----------------------------------------------------
  // Estimate peak |θ_York| near the shell: |β| * [σ/(2 tanh(σR))] * √d_FR
  const estThetaPeak = useMemo(() => {
    const params = bubbleParams;
    const op = opGate;
    if (!(op > 0)) return 0;
    const cx = params.center[0];
    const cy = params.center[1];
    const cz = params.center[2];
    const ahead = computeTheta(cx + params.R, cy, cz, params);
    const aft = computeTheta(cx - params.R, cy, cz, params);
    const val = Math.max(Math.abs(ahead), Math.abs(aft)) * op;
    return Number.isFinite(val) ? Math.max(0, val) : 0;
  }, [bubbleParams, opGate]);
  const gain = useMemo(() => {
    const target = 0.20 * Math.max(1, R);
    if (!(estThetaPeak > 1e-12)) return 0.0;
    const g = target / estThetaPeak;
    return Math.min(Math.max(g, 1e-8), 1e8);
  }, [estThetaPeak, R]);

  // Adaptive color gain: map |θ|≈estThetaPeak to full chroma (|x|≈1 in diverge())
  const colorGain = useMemo(() => {
    if (!(estThetaPeak > 1e-12)) return 1.0;                 // standby etc.
    // push colors a bit hotter so we see ±θ lobes with tiny √d_FR
    const g = 1.0 / (estThetaPeak * 0.75);                    // 25% hotter
    return Math.min(Math.max(g, 1e-8), 1e8);
  }, [estThetaPeak]);

  // Ring visibility: scale ~ linearly with √d_FR (and clamp)
  const ringGain = useMemo(() => Math.min(1, opGate * 400.0), [opGate]);

  // Debug: log once per change which path produced θ_server
  useEffect(() => {
    if (Number.isFinite(thetaServer)) {
      console.debug("[CurvatureTensorPanel] θ_server picked from", thetaSourcePath, "=", thetaServer);
    } else {
      console.debug("[CurvatureTensorPanel] θ_server not found in live payload");
    }
    // Debug critical values
    console.debug("[CurvatureTensorPanel] Critical values:", {
      beta,
      R,
      opGate,
      estThetaPeak,
      gain,
      colorGain,
      ringGain,
      axesNorm,
      driveDir
    });
  }, [
    thetaServer, thetaSourcePath,
    beta, R, opGate, estThetaPeak, gain, colorGain, ringGain,
    axesNorm, driveDir
  ]);

  // Auto-fit camera: set perspective+lookAt from FOV/aspect and R.
  const mvpRef = useRef<Float32Array>(new Float32Array(16));
  const fovY = 40 * Math.PI/180;       // nice perspective
  const near = 0.1, far = 20000.0;     // wide range for big R

  function perspective(out: Float32Array, fovy:number, aspect:number, znear:number, zfar:number){
    const f = 1/Math.tan(fovy/2), nf = 1/(znear - zfar);
    out[0]=f/aspect; out[1]=0; out[2]=0; out[3]=0;
    out[4]=0; out[5]=f; out[6]=0; out[7]=0;
    out[8]=0; out[9]=0; out[10]=(zfar+znear)*nf; out[11]=-1;
    out[12]=0; out[13]=0; out[14]=(2*zfar*znear)*nf; out[15]=0;
  }
  function lookAt(out: Float32Array, eye:[number,number,number], center:[number,number,number], up:[number,number,number]){
    const [ex,ey,ez]=eye,[cx,cy,cz]=center,[ux,uy,uz]=up;
    let zx=ex-cx, zy=ey-cy, zz=ez-cz; let rl=1/Math.hypot(zx,zy,zz); zx*=rl; zy*=rl; zz*=rl;
    let xx=uy*zz-uz*zy, xy=uz*zx-ux*zz, xz=ux*zy-uy*zx; rl=1/Math.hypot(xx,xy,xz); xx*=rl; xy*=rl; xz*=rl;
    const yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
    out[0]=xx; out[1]=yx; out[2]=zx; out[3]=0;
    out[4]=xy; out[5]=yy; out[6]=zy; out[7]=0;
    out[8]=xz; out[9]=yz; out[10]=zz; out[11]=0;
    out[12]=-(xx*ex+xy*ey+xz*ez);
    out[13]=-(yx*ex+yy*ey+yz*ez);
    out[14]=-(zx*ex+zy*ey+zz*ez);
    out[15]=1;
  }
  function mul(out: Float32Array, A: Float32Array, B: Float32Array){
    for (let r=0;r<4;r++){ for (let c=0;c<4;c++){ let s=0; for (let k=0;k<4;k++) s+=A[k*4+r]*B[c*4+k]; out[c*4+r]=s; } }
  }

  // Recompute MVP when the canvas size changes (auto-fit to R).
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const recompute = () => {
      const aspect = Math.max(0.5, cv.width / Math.max(1, cv.height));
      const pad = 1.3;                 // little framing margin
      const fit = pad * (Number.isFinite(R) ? Math.max(1, R) : 1); // world radius to fit
      const dist = fit / Math.tan(fovY/2); // distance so ±fit fills vertically
      // Give a slight pitch so surface reads as 3D:
      const eye:[number,number,number] = [0, 0.55*dist, dist];
      const center:[number,number,number] = [0, 0, 0];
      const up:[number,number,number] = [0, 1, 0];
      const P = new Float32Array(16), V = new Float32Array(16);
      perspective(P, fovY, aspect, near, far);
      lookAt(V, eye, center, up);
      mul(mvpRef.current, P, V);
    };
    recompute();
  }, [/* R changes cause reframe */ live]);

  // Init GL with robust error handling
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    
    // Clear any previous error state
    setGlStatus('ok');
    setGlError(null);
    
    const gl = cv.getContext('webgl2', {antialias:true, preserveDrawingBuffer:true});
    if (!gl) { setGlStatus('no-webgl'); setGlError('WebGL2 not available (context creation failed).'); return; }
    glRef.current = gl;
    releaseContextRef.current();
    releaseContextRef.current = () => {};
    releaseContextRef.current = registerWebGLContext(gl, {
      label: "CurvatureTensorPanel",
    });

    try {
      const prog = createProgram(gl, VERT, FRAG);
      progRef.current = prog;
    } catch (e:any) {
      setGlStatus('compile-fail'); setGlError(e?.message || String(e)); return;
    }

    const vbo = gl.createBuffer()!; vboRef.current = vbo;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, makeGrid(res), gl.STATIC_DRAW);

    const onResize = () => resizeCanvasAndViewport(gl, cv);
    onResize();
    const ro = new ResizeObserver(onResize); ro.observe(cv);
    const onLost = (e: Event) => { 
      e.preventDefault(); 
      setGlStatus('context-lost'); 
      console.warn('[CurvatureTensorPanel] WebGL context lost');
    };
    const onRestored = () => { 
      setGlStatus('ok'); 
      setGlError(null);
      onResize(); 
      console.log('[CurvatureTensorPanel] WebGL context restored');
    };
    cv.addEventListener('webglcontextlost', onLost as any, false);
    cv.addEventListener('webglcontextrestored', onRestored as any, false);

    let raf = 0;
    const draw = () => {
      try {
        if (gl.isContextLost()) {
          setGlStatus('context-lost');
          return;
        }
        
        gl.clearColor(0.03,0.04,0.07,1);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

      const prog = progRef.current;
      if (!prog) return;
      
      gl.useProgram(prog);
      // attributes
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      const loc = 0; // a_pos
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      // uniforms
      const u_axes = gl.getUniformLocation(prog, 'u_axes');
      const u_scale = gl.getUniformLocation(prog, 'u_scale');
      const u_driveDir = gl.getUniformLocation(prog, 'u_driveDir');
      const u_sigma = gl.getUniformLocation(prog, 'u_sigma');
      const u_R = gl.getUniformLocation(prog, 'u_R');
      const u_beta = gl.getUniformLocation(prog, 'u_beta');
      const u_thetaScale = gl.getUniformLocation(prog, 'u_thetaScale');
      const u_gain = gl.getUniformLocation(prog, 'u_gain');
      const u_colorGain = gl.getUniformLocation(prog, 'u_colorGain');
      const u_debugRing = gl.getUniformLocation(prog, 'u_debugRing');
      const u_ringGain = gl.getUniformLocation(prog, 'u_ringGain');
      const u_mvp = gl.getUniformLocation(prog, 'u_mvp');

      gl.uniform3f(u_axes, axesNorm[0], axesNorm[1], axesNorm[2]);
      gl.uniform1f(u_scale, Number.isFinite(R)? Math.max(1e-3, R) : 1.0);
      gl.uniform3f(u_driveDir, driveDir[0], driveDir[1], driveDir[2]);
      gl.uniform1f(u_sigma, sigma);
      gl.uniform1f(u_R, R);
      gl.uniform1f(u_beta, beta);
      // pure York-time × operational gate (√d_FR); 0 in standby
      gl.uniform1f(u_thetaScale, opGateRef.current);
      gl.uniform1f(u_gain, gain); // adaptive height gain
      gl.uniform1f(u_colorGain, colorGain); // adaptive color gain
      gl.uniform1f(u_debugRing, 1.0); // overlay enabled…
      gl.uniform1f(u_ringGain, ringGain); // …but strength follows √d_FR (0 in standby)
      gl.uniformMatrix4fv(u_mvp, false, mvpRef.current);

      // draw triangle strips per row
      for (let row = 0, off = 0; row < res - 1; row++, off += res * 2) {
        gl.drawArrays(gl.TRIANGLE_STRIP, off, res * 2);
      }

      raf = requestAnimationFrame(draw);
      } catch (error) {
        console.error('[CurvatureTensorPanel] WebGL draw error:', error);
        setGlStatus('compile-fail');
        setGlError(`WebGL draw error: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      try { cv.removeEventListener('webglcontextlost', onLost as any); } catch {}
      try { cv.removeEventListener('webglcontextrestored', onRestored as any); } catch {}
      try { if (vbo) gl.deleteBuffer(vbo); } catch {}
      try { if (progRef.current) gl.deleteProgram(progRef.current); } catch {}
      if (glRef.current === gl) {
        glRef.current = null;
      }
      releaseContextRef.current();
      releaseContextRef.current = () => {};
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // if resolution changes, rebuild VBO
  useEffect(() => {
    const gl = glRef.current; const vbo = vboRef.current; 
    if (!gl || !vbo || gl.isContextLost()) return;
    try {
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, makeGrid(res), gl.STATIC_DRAW);
    } catch (error) {
      console.error('[CurvatureTensorPanel] VBO update error:', error);
      setGlStatus('compile-fail');
      setGlError(`VBO update error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [res]);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-wrap items-center gap-2 text-xs mb-2 opacity-80">
        <span className="px-2 py-1 rounded bg-slate-800">Mode: <b>{String(live?.currentMode||'—')}</b></span>
        <span className="px-2 py-1 rounded bg-slate-800">θ_chain (γ³·q·γ_VdB): <b>{Number.isFinite(thetaChain)? thetaChain.toExponential(3): '—'}</b></span>
        <span className="px-2 py-1 rounded bg-slate-800">θ_expected (×√d_FR): <b>{Number.isFinite(thetaExpected)? thetaExpected.toExponential(3): '—'}</b></span>
        <span className="px-2 py-1 rounded bg-slate-800">
          θ_server: <b>{fmtExp(thetaServer)}</b>
          { !Number.isFinite(thetaServer) && <span className="opacity-60 ml-1">(not published)</span> }
        </span>
        <span className="px-2 py-1 rounded bg-slate-800">d_FR: <b>{Number.isFinite(dfrRaw)? dfrRaw.toExponential(3): '—'}</b></span>
        {/* side-view only; no alternate view selector in this component */}
        <span className="px-2 py-1 rounded bg-slate-800">σ: {sigma.toFixed(1)}</span>
        <span className="px-2 py-1 rounded bg-slate-800">R: {R.toFixed(2)}</span>
        <span className="px-2 py-1 rounded bg-slate-800">β: {beta.toFixed(2)}</span>
        <span className="px-2 py-1 rounded bg-slate-800">gain: <b>{Number.isFinite(gain) ? gain.toExponential(2) : '—'}</b></span>
        <span className="px-2 py-1 rounded bg-slate-800">cGain: <b>{Number.isFinite(colorGain) ? colorGain.toExponential(2) : '—'}</b></span>
        <span className="px-2 py-1 rounded bg-slate-800">ring: <b>{ringGain.toFixed(2)}</b></span>
        {glStatus !== 'ok' && (
          <span className="px-2 py-1 rounded bg-red-900/40 border border-red-700/40 text-red-200">
            GL: {glStatus}{glError ? ` • ${glError}` : ''}
          </span>
        )}
      </div>

      <PipelineCongruenceBadge
        label="curvature"
        meta={live?.curvatureMeta}
        className="mb-2"
      />

      <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-slate-800 bg-black/60">
        <canvas ref={canvasRef} data-york-panel className="w-full h-full block" />
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="px-3 py-2 rounded bg-slate-900/60 border border-slate-800">
          <div className="font-semibold mb-1">Legend</div>
          <div className="flex items-center gap-2 mb-1"><span className="inline-block w-3 h-3 rounded" style={{background:'#0f40fa'}} /> Contraction (−β)</div>
          <div className="flex items-center gap-2 mb-1"><span className="inline-block w-3 h-3 rounded" style={{background:'#e4e4e4'}} /> Neutral</div>
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded" style={{background:'#f54d16'}} /> Expansion (+β)</div>
        </div>
        <div className="px-3 py-2 rounded bg-slate-900/60 border border-slate-800">
          <div className="font-semibold mb-1">Model</div>
          <div>θ(x) = β (x/|r|) · d f/dr,  f = [tanh(σ(r+R))−tanh(σ(r−R))] / [2 tanh(σR)]</div>
          <div className="opacity-70 mt-1">Surface height ∝ θ (gated by √d_FR; standby → flat).</div>
        </div>
        <div className="px-3 py-2 rounded bg-slate-900/60 border border-slate-800">
          <div className="font-semibold mb-1">Tips</div>
          <ul className="list-disc list-inside opacity-80 space-y-1">
            <li>Decrease σ → thicker wall → lower |θ|, broader donut.</li>
            <li>Increase β or pipeline amplitude to emphasize features.</li>
            <li>Set driveDir to +x to match classic figures.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
