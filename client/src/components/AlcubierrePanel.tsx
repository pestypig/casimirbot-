import React, {useEffect, useMemo, useRef, useState} from "react";
import { cn } from "@/lib/utils";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";

// === helpers: math & smoothing =================================================
const clamp = (x: number, a = -Infinity, b = Infinity) => Math.max(a, Math.min(b, x));
const sech2  = (x: number) => {
  const c = Math.cosh(x);
  return 1 / (c * c);
};
/**
 * Alcubierre top-hat radial derivative df/dr_s (closed form, σ and R dimensionless)
 *   f(r)   = [tanh(σ(r+R)) − tanh(σ(r−R))] / [2 tanh(σR)]
 *   df/dr  = σ [sech²(σ(r+R)) − sech²(σ(r−R))] / [2 tanh(σR)]
 */
function dTopHatDr(r: number, sigma: number, R: number) {
  const den = Math.max(1e-8, 2 * Math.tanh(sigma * R));
  return sigma * (sech2(sigma * (r + R)) - sech2(sigma * (r - R))) / den;
}
/** tail-robust peak estimate: median of the top `tail` fraction of |values|. */
function tailPeakAbs(arr: Float32Array | number[], tail = 0.01) {
  if (!arr || arr.length === 0) return 0;
  const v = Array.from(arr, (x) => Math.abs(x)).filter((x) => x > 0);
  if (v.length === 0) return 0;
  v.sort((a, b) => a - b);
  const n = v.length;
  const start = Math.max(0, Math.floor((1 - Math.max(1e-4, tail)) * (n - 1)));
  const slice = v.slice(start);
  // median of the tail for stability
  const m = Math.floor(slice.length / 2);
  return slice.length ? slice[m] : v[n - 1];
}
/** tiny Gaussian blur on sector weights to remove hard edges (temporal average proxy) */
function gaussianBlur1D(w: number[], sigma = 1.2): number[] {
  if (sigma <= 0) return w.slice();
  const r = Math.max(1, Math.ceil(3 * sigma));
  const K: number[] = [];
  for (let i = -r; i <= r; i++) K.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
  const ksum = K.reduce((a, b) => a + b, 0);
  for (let i = 0; i < K.length; i++) K[i] /= ksum;
  const out = new Array(w.length).fill(0);
  for (let i = 0; i < w.length; i++) {
    let s = 0;
    for (let j = -r; j <= r; j++) {
      const idx = clamp(i + j, 0, w.length - 1);
      s += w[idx] * K[j + r];
    }
    out[i] = s;
  }
  return out;
}
/** sector smoothing that preserves total ∑w (energy budget) */
function smoothSectorWeights(w: number[], sigma = 1.25): number[] {
  const sm = gaussianBlur1D(w, sigma);
  const s = sm.reduce((a, b) => a + b, 0) || 1;
  const t = w.reduce((a, b) => a + b, 0) || 1;
  return sm.map((x) => (x * t) / s);
}

// --- β resolver (panel-local): prefer live pipeline values, else derive from mode
function resolveBeta(live: any): number {
  // 1) pipeline-provided candidates
  const cands = [
    Number(live?.shipBeta),
    Number(live?.vShip),
    Number(live?.beta),
  ];
  for (const v of cands) {
    if (Number.isFinite(v)) return Math.max(0, Math.min(0.99, v as number));
  }
  // 2) mode-driven fallback (panel-local)
  const m = String(live?.currentMode ?? "").toLowerCase();
  const fromMode =
    m === "standby"   ? 0.0  :
    m === "hover"     ? 0.10 :
    m === "cruise"    ? 0.60 :
    m === "emergency" ? 0.95 :
                        0.30;
  return fromMode;
}

/** ----------------------------------------------------------------
 * Alcubierre Metric Viewer (single-canvas, GR/Drive toggle)
 * - Viz 0: θ (York time, GR)
 * - Viz 1: ρ (energy density, GR)
 * - Viz 2: θ (Drive-scaled by γ_geo^3·q·γ_VdB·√d_FR)
 * ---------------------------------------------------------------- */

type VizMode = 0 | 1 | 2; // 0=thetaGR, 1=rhoGR, 2=thetaDrive

function fnum(x: any, d=0) { const n = Number(x); return Number.isFinite(n) ? n : d; }

const VERT = `#version 300 es
layout(location=0) in vec2 a_pos;      // unit grid on x–z plane in [-1,1]^2
uniform vec3  u_axes;                   // hull axes scale (a,b,c) -> x,y,z
uniform float u_sigma;                  // wall thickness σ
uniform float u_R;                      // bubble radius R
uniform float u_beta;                   // ship beta along +x
uniform int   u_viz;                    // 0 θ_GR, 1 ρ_GR, 2 θ_Drive
uniform float u_ampChain;               // γ_geo^3 · q · γ_VdB
uniform float u_gate;                   // √d_FR · (sector visibility)
uniform float u_yGain;                  // height scale (viewer)
uniform float u_kColor;                 // color scale (viewer)
uniform mat4  u_mvp;

out vec3 v_color;

float sech2(float x){ float c=cosh(x); return 1.0/(c*c); }

float d_topHat_dr(float r, float sigma, float R) {
  float den = max(1e-8, 2.0 * tanh(sigma * R));
  return sigma * (sech2(sigma*(r+R)) - sech2(sigma*(r-R))) / den;
}

vec3 diverge(float x) {
  // blue (-) -> white -> red (+)
  vec3 c1 = vec3(0.06,0.25,0.98);
  vec3 c2 = vec3(0.94,0.94,0.95);
  vec3 c3 = vec3(0.95,0.30,0.08);
  float t = clamp(0.5 + 0.5*x, 0.0, 1.0);
  return (t < 0.5) ? mix(c1,c2,t/0.5) : mix(c2,c3,(t-0.5)/0.5);
}

vec3 purpleMap(float s){
  // ρ is ≤ 0 in shell; map negative to purple
  // s is expected in some small physical range; pre-scaled by u_kColor
  float t = clamp(-s, 0.0, 1.0); // -s so that s=-1 -> t=1
  vec3 base = vec3(0.92,0.92,0.98);
  vec3 purp = vec3(0.58,0.25,0.93);
  return mix(base, purp, t);
}

void main(){
  // Grid point in x–z plane; viewer space ~ meters after axes scaling
  vec3 p = vec3(a_pos.x * u_axes.x, 0.0, a_pos.y * u_axes.z);
  float rs = length(p);
  rs = max(rs, 1e-6);

  // ∂f/∂r_s and gradient components
  float dfdr = d_topHat_dr(rs, u_sigma, u_R);
  vec3 dir = p / rs;     // (x/rs, 0, z/rs)
  float dfx = dfdr * dir.x;
  float dfy = dfdr * dir.y; // zero in this slice; kept for generality
  float dfz = dfdr * dir.z;

  // θ_GR (York time, with sign convention matching +x motion)
  float theta_gr = u_beta * dfx;

  // Energy density ρ_GR from Hamiltonian constraint (alpha=1, gamma_ij=delta_ij)
  // Kxx = -β ∂x f, Kxy = -β/2 ∂y f, Kxz = -β/2 ∂z f
  float Kxx = -u_beta * dfx;
  float Kxy = -0.5 * u_beta * dfy;
  float Kxz = -0.5 * u_beta * dfz;
  float K2 = Kxx*Kxx;
  float KijKij = Kxx*Kxx + 2.0*Kxy*Kxy + 2.0*Kxz*Kxz;
  const float INV16PI = 0.019894367886486918; // 1/(16π)
  float rho_gr = (K2 - KijKij) * INV16PI;     // <= 0 in shell

  // Drive view applies your chain and operational gate
  float theta_drive = theta_gr * u_ampChain * u_gate;

  // Select the scalar to render (height & color are scaled independently)
  float s = (u_viz == 0) ? theta_gr : ((u_viz == 1) ? rho_gr : theta_drive);

  // Height
  float y = s * u_yGain;
  vec4 pos = vec4(p.x, y, p.z, 1.0);
  gl_Position = u_mvp * pos;

  // Color
  float c = s * u_kColor;
  if (u_viz == 1){
    v_color = purpleMap(c);
  } else {
    v_color = diverge(clamp(c, -1.0, 1.0));
  }
}
`;

const FRAG = `#version 300 es
precision highp float;
in vec3 v_color;
out vec4 outColor;
void main(){
  outColor = vec4(v_color, 1.0);
}
`;

function makeGrid(res: number) {
  // Degenerate triangle strips per row in [-1,1]^2
  const verts: number[] = [];
  for (let j=0; j<res-1; j++){
    for (let i=0; i<res; i++){
      const x = -1 + 2*(i/(res-1));
      const z0 = -1 + 2*(j/(res-1));
      const z1 = -1 + 2*((j+1)/(res-1));
      verts.push(x, z0,  x, z1);
    }
  }
  return new Float32Array(verts);
}

export default function AlcubierrePanel({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext|null>(null);
  const progRef = useRef<WebGLProgram|null>(null);
  const vboRef  = useRef<WebGLBuffer|null>(null);
  const vcountRef = useRef<number>(0); // DEBUG: track vertex count

  const [viz, setViz] = useState<VizMode>(0); // 0 θ_GR, 1 ρ_GR, 2 θ_Drive
  const res = 256;
  const FORCE_SHOW = false; // DEBUG: set true to ignore gate while debugging

  const { data: live } = useEnergyPipeline({
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });

  // Live parameters (safe defaults)
  const beta  = useMemo(() => resolveBeta(live), [live]);
  const sigma = useMemo(() => Math.max(1e-6, fnum(live?.sigma ?? 6.0, 6.0)), [live]);
  const R     = useMemo(() => Math.max(1, fnum(live?.R ?? live?.bubble?.R ?? 100, 100)), [live]);

  // Engineering “amplitude chain” used only in Drive mode
  const ampChain = useMemo(() => {
    const g = Math.max(1, fnum(live?.gammaGeo, 26));
    const q = Math.max(1e-6, fnum(live?.qSpoilingFactor ?? live?.q, 1));
    const v = Math.max(1, fnum(live?.gammaVanDenBroeck_vis ?? live?.gammaVanDenBroeck, 1e11));
    return Math.pow(g,3) * q * v;
  }, [live]);

  const gate = useMemo(() => {
    const dfr = Math.max(0, fnum(live?.dutyEffectiveFR ?? live?.dutyFR, 0));
    const v = Math.sqrt(dfr);
    return FORCE_SHOW ? 1 : (Number.isFinite(v) ? v : 0);
  }, [live]);

  // ---- sector gating (f and w) ------------------------------------------------
  const totalSectors = useMemo(() => Math.max(1, fnum(live?.sectors ?? live?.totalSectors, 400)), [live]);
  const liveSectors = useMemo(() => Math.max(1, fnum(live?.liveSectors ?? live?.S_live, 1)), [live]);
  const fActive = useMemo(() => Math.max(1 / totalSectors, liveSectors / totalSectors), [totalSectors, liveSectors]);
  
  const sectorWeights = useMemo(() => {
    // Build basic sector weights (simplified for this viewer)
    const raw = new Array(totalSectors).fill(0);
    for (let i = 0; i < liveSectors; i++) {
      raw[i] = 1; // simple on/off pattern
    }
    // smooth to avoid temporal "saw" without changing total power
    return smoothSectorWeights(raw, 1.25);
  }, [totalSectors, liveSectors]);

  // sector "boost" term (visibility of a single active arc): √(w/f)
  const boostWF = useMemo(() => Math.sqrt(Math.max(1e-12, 1 / fActive)), [fActive]);

  // Viewer axes (hull aspect)
  const axes = useMemo(
    () => [fnum(live?.hull?.a, 1), fnum(live?.hull?.b, 1), fnum(live?.hull?.c, 1)] as [number,number,number],
    [live]
  );

  // --- track canvas aspect so camera fits accurately
  const [aspect, setAspect] = useState(16/9);

  // === NEW: Split peak calculation per viz mode ==================================
  const thetaField_GR = useMemo(() => {
    if (viz !== 0) return null;
    const nx = res, ny = res;
    const field = new Float32Array(nx * ny);
    const domainScale = R * 1.3;
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const gx = -1 + 2 * (i / (nx - 1));
        const gz = -1 + 2 * (j / (ny - 1));
        const x = gx * domainScale * axes[0];
        const z = gz * domainScale * axes[2];
        const r = Math.sqrt(x * x + z * z);
        const cos = x / Math.max(r, 1e-6);
        const dfdr = dTopHatDr(r, sigma, R);
        field[j * nx + i] = beta * cos * dfdr;
      }
    }
    return field;
  }, [viz, beta, sigma, R, axes, res]);

  const rhoField_GR = useMemo(() => {
    if (viz !== 1) return null;
    const nx = res, ny = res;
    const field = new Float32Array(nx * ny);
    const domainScale = R * 1.3;
    const INV16PI = 0.019894367886486918;
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const gx = -1 + 2 * (i / (nx - 1));
        const gz = -1 + 2 * (j / (ny - 1));
        const x = gx * domainScale * axes[0];
        const z = gz * domainScale * axes[2];
        const r = Math.sqrt(x * x + z * z);
        const cos = x / Math.max(r, 1e-6);
        const dfdr = dTopHatDr(r, sigma, R);
        const Kxx = -beta * cos * dfdr;
        field[j * nx + i] = Kxx * Kxx * INV16PI;
      }
    }
    return field;
  }, [viz, beta, sigma, R, axes, res]);

  const thetaField_Drive = useMemo(() => {
    if (viz !== 2) return null;
    const nx = res, ny = res;
    const field = new Float32Array(nx * ny);
    const twoPi = 2 * Math.PI;
    const domainScale = R * 1.3;
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const gx = -1 + 2 * (i / (nx - 1));
        const gz = -1 + 2 * (j / (ny - 1));
        const x = gx * domainScale * axes[0];
        const z = gz * domainScale * axes[2];
        const r = Math.sqrt(x * x + z * z);
        const cos = x / Math.max(r, 1e-6);
        const dfdr = dTopHatDr(r, sigma, R);

        const ang = Math.atan2(z, x);
        const a01 = (ang < 0 ? ang + twoPi : ang) / twoPi;
        const sIdx = Math.min(totalSectors - 1, Math.floor(a01 * totalSectors));
        const w = sectorWeights[sIdx] || 0;
        const gateWF = Math.sqrt(Math.max(0, w) / Math.max(fActive, 1e-9));

        field[j * nx + i] = ampChain * beta * cos * dfdr * gate * gateWF;
      }
    }
    return field;
  }, [viz, beta, sigma, R, ampChain, gate, fActive, sectorWeights, totalSectors, axes, res]);

  const [thetaField, thetaPk] = useMemo(() => {
    const field = viz === 0 ? thetaField_GR : viz === 1 ? rhoField_GR : thetaField_Drive;
    return [field, field ? Math.max(1e-9, tailPeakAbs(field, 0.4)) : 1e-9];
  }, [viz, thetaField_GR, rhoField_GR, thetaField_Drive]);
  const mapT = (θ: number) => Math.tanh(1.4 * θ / thetaPk);

  // World-space target half-height (meters) shared by yGain and camera
  const targetHalf = useMemo(() => {
    const targetFrac = Number((live as any)?.view?.yTargetFrac);
    const minFrac    = Number((live as any)?.view?.yMinFrac);
    const maxFrac    = Number((live as any)?.view?.yMaxFrac);
    const tf = Number.isFinite(targetFrac) ? targetFrac : 3.00;  // 300% of R
    const mf = Number.isFinite(minFrac)    ? minFrac    : 0.0;        // allow micro heights
    const xf = Number.isFinite(maxFrac)    ? maxFrac    : 3.00;  // cap at 300%
    return clamp(tf, mf, xf) * R;
  }, [live, R]);

  // Camera fit bias (already added earlier)
  const heightFitBias = useMemo(() => {
    const v = Number((live as any)?.view?.heightFitBias);
    return Number.isFinite(v) ? clamp(v, 0.1, 1.0) : 0.55;
  }, [live]);

  // NEW: simple knobs to center the plane vertically by lowering the camera.
  // You can override live.view.eyeYScale / eyeYBase at runtime.
  const eyeYScale = useMemo(() => {
    const v = Number((live as any)?.view?.eyeYScale);
    return Number.isFinite(v) ? v : 0.65; // was 1.10
  }, [live]);
  const eyeYBase = useMemo(() => {
    const v = Number((live as any)?.view?.eyeYBase);
    return Number.isFinite(v) ? v : 0.06; // was 0.12
  }, [live]);

  // ---- Analytic peak estimate: df/dr peak at the wall ----
  const dfdr_peak_est = useMemo(() => {
    const t = Math.tanh(Math.max(1e-6, sigma * R));
    return sigma / (2 * Math.max(1e-6, t)); // analytic peak estimate
  }, [sigma, R]);

  // Analytic reference amplitude per viz (peak at the wall)
  const ampRef = useMemo(() => {
    const INV16PI = 0.019894367886486918;
    if (viz === 0) return Math.abs(beta * dfdr_peak_est);                       // θ_GR
    if (viz === 1) return Math.abs(beta * beta * dfdr_peak_est * dfdr_peak_est * INV16PI); // ρ_GR
    return Math.abs(ampChain * beta * dfdr_peak_est * gate);                    // θ_Drive
  }, [viz, beta, dfdr_peak_est, ampChain, gate]);

  const yGain = useMemo(() => {
    const usr = Number((live as any)?.view?.yGain);
    if (Number.isFinite(usr) && usr > 0) return usr;
    // Map the analytic peak in the current mode to the desired world-space height.
    // This keeps θ(GR), ρ(GR), and θ(Drive) on the same visual scale.
    return targetHalf / Math.max(1e-18, ampRef);
  }, [targetHalf, ampRef, live]);

  const kColor = useMemo(() => {
    const usr = Number((live as any)?.view?.kColor);
    if (Number.isFinite(usr) && usr > 0) return usr;
    return 0.85 / Math.max(1e-18, thetaPk);
  }, [live, thetaPk]);

  // Compute MVP to fit both horizontal (domain) and vertical (curvature) extents
  const mvp = useMemo(() => {
    const fovy = 40 * Math.PI/180;
    const tanY = Math.tan(fovy * 0.5);
    const tanX = tanY * Math.max(0.2, aspect);

    // Horizontal half-extent (take the larger of x/z)
    const halfX = (R * 1.3);     // domainMul=1.3 in this viewer
    const halfZ = (R * 1.3);
    const halfW = Math.max(halfX, halfZ);

    // Vertical half-extent (world space). For camera distance we use a biased
    // version so we don't zoom out too far when targetHalf is very large.
    const halfH = Math.max(1e-6, targetHalf);
    const fitH  = halfH * heightFitBias;

    // Distance to fit width/height
    const dByW = halfW / Math.max(1e-6, tanX);
    const dByH = fitH  / Math.max(1e-6, tanY);
    const dist = Math.max(dByW, dByH) * 1.6 + 1.5; // closer default

    const near = Math.max(0.05, dist - (halfW + fitH) - 5);
    const far  = dist + (halfW + fitH) + 50;

    // Build perspective * lookAt; slight tilt for readability
    const f = 1/Math.tan(fovy/2);
    const P = [
      f/aspect,0,0,0,
      0,f,0,0,
      0,0,(far+near)/(near-far),-1,
      0,0,(2*far*near)/(near-far),0,
    ];
    // eye above +z looking at origin
    const eyeY = fitH * eyeYScale + R * eyeYBase;
    const V = [
      1,0,0,0,
      0,0.96,-0.28,0,
      0,0.28, 0.96,0,
      0,-eyeY,-dist,1,
    ];
    const M = new Float32Array(16);
    for (let r=0;r<4;r++){
      for (let c=0;c<4;c++){
        let s=0; for (let k=0;k<4;k++) s += P[k*4+r]*V[c*4+k];
        M[c*4+r]=s;
      }
    }
    return M;
  }, [aspect, R, targetHalf, heightFitBias, eyeYScale, eyeYBase]);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const gl = cv.getContext('webgl2', { antialias: true, preserveDrawingBuffer: true });
    if (!gl) return;

    glRef.current = gl;
    console.log("[Alcubierre] WebGL2 context OK");
    const lost = (e:Event)=>{ console.warn("[Alcubierre] WebGL context lost"); };
    const restored = ()=>{ console.warn("[Alcubierre] WebGL context restored (reload recommended)"); };
    cv.addEventListener("webglcontextlost", lost);
    cv.addEventListener("webglcontextrestored", restored);

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("GLSL error:", gl.getShaderInfoLog(s));
      }
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("Link error:", gl.getProgramInfoLog(prog));
      // DEBUG: paint a big red quad so the failure is obvious
      gl.clearColor(0.2,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }
    progRef.current = prog;

    const vbo = gl.createBuffer()!; vboRef.current = vbo;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    const grid = makeGrid(res);
    gl.bufferData(gl.ARRAY_BUFFER, grid, gl.STATIC_DRAW);
    vcountRef.current = grid.length / 2; // two floats per vertex
    if (!vcountRef.current) {
      console.warn("[Alcubierre] VBO appears empty");
    }

    const onResize = () => {
      const rect = cv.getBoundingClientRect();
      const w = Math.max(640, Math.floor(rect.width * devicePixelRatio));
      const h = Math.max(360, Math.floor(rect.height * devicePixelRatio)); // use actual height
      cv.width = w; cv.height = h;
      gl.viewport(0,0,w,h);
      setAspect(w / Math.max(1, h)); // pixel-accurate aspect for MVP
      if (!w || !h) console.warn("[Alcubierre] Canvas size is zero", w, h);
    };
    onResize();
    const ro = new ResizeObserver(onResize); ro.observe(cv);

    const loc = {
      a_pos: 0,
      u_axes: gl.getUniformLocation(prog, "u_axes"),
      u_sigma: gl.getUniformLocation(prog, "u_sigma"),
      u_R: gl.getUniformLocation(prog, "u_R"),
      u_beta: gl.getUniformLocation(prog, "u_beta"),
      u_viz: gl.getUniformLocation(prog, "u_viz"),
      u_ampChain: gl.getUniformLocation(prog, "u_ampChain"),
      u_gate: gl.getUniformLocation(prog, "u_gate"),
      u_yGain: gl.getUniformLocation(prog, "u_yGain"),
      u_kColor: gl.getUniformLocation(prog, "u_kColor"),
      u_mvp: gl.getUniformLocation(prog, "u_mvp"),
    };

    let raf = 0;
    const draw = () => {
      gl.clearColor(0.02,0.03,0.06,1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // DEBUG: depth not needed for a single surface; avoid surprises
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);

      gl.useProgram(prog);

      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      // sanitize all uniforms (no NaN/Inf)
      const s = (x:number, d=0)=> Number.isFinite(x) ? x : d;
      gl.uniform3f(loc.u_axes, s(axes[0],1), s(axes[1],1), s(axes[2],1));
      gl.uniform1f(loc.u_sigma, s(sigma,6));
      gl.uniform1f(loc.u_R, Math.max(0.1, s(R,100)));
      gl.uniform1f(loc.u_beta, s(beta,0));
      gl.uniform1i(loc.u_viz, viz);
      gl.uniform1f(loc.u_ampChain, s(ampChain,1));
      gl.uniform1f(loc.u_gate, Math.max(0, s(gate,0)));
      gl.uniform1f(loc.u_yGain, s(yGain,1e-8));
      gl.uniform1f(loc.u_kColor, s(kColor,1e-6));
      gl.uniformMatrix4fv(loc.u_mvp, false, mvp);

      const RES = Math.round(Math.sqrt(vcountRef.current / 2)); // expected ~256
      if (!vcountRef.current) {
        // DEBUG: draw a magenta strip so we know draw calls are working
        gl.disableVertexAttribArray(0);
        const tmp = new Float32Array([-1,0, -1,0.01, 1,0, 1,0.01]);
        const tb = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, tb);
        gl.bufferData(gl.ARRAY_BUFFER, tmp, gl.STREAM_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      } else {
        // draw each strip row
        let off = 0;
        for (let row=0; row<RES-1; row++){
          gl.drawArrays(gl.TRIANGLE_STRIP, off, RES*2);
          off += RES*2;
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => { 
      cancelAnimationFrame(raf); 
      ro.disconnect(); 
      gl.deleteBuffer(vbo); 
      gl.deleteProgram(prog);
      cv.removeEventListener("webglcontextlost", lost as any);
      cv.removeEventListener("webglcontextrestored", restored as any);
    };
  }, [axes, sigma, R, beta, viz, ampChain, gate, yGain, kColor, mvp, thetaField, thetaPk]);

  // ---- HUD (expected, peak (×√w/f), θ95) --------------------------------------
  const theta_expected = useMemo(() => {
    if (viz === 0) return beta * dfdr_peak_est;
    if (viz === 1) return beta * beta * dfdr_peak_est * dfdr_peak_est * 0.019894367886486918;
    return ampChain * beta * dfdr_peak_est * gate; // no √(w/f)
  }, [viz, beta, dfdr_peak_est, ampChain, gate]);
  
  const theta_peak = useMemo(() => theta_expected * boostWF, [theta_expected, boostWF]);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-wrap gap-2 text-xs mb-2 opacity-85">
        <span className="px-2 py-1 rounded bg-slate-800">Mode: <b>{String(live?.currentMode||"—")}</b></span>
        <span className="px-2 py-1 rounded bg-slate-800">θ_expected: <b>{theta_expected.toExponential(3)}</b></span>
        <span className="px-2 py-1 rounded bg-slate-800">θ_peak (×√w/f): <b>{theta_peak.toExponential(3)}</b></span>
        <span className="px-2 py-1 rounded bg-slate-800">θₚₖ (tail): <b>{thetaPk.toExponential(3)}</b></span>
        <span className="px-2 py-1 rounded bg-slate-800">σ: <b>{sigma.toFixed(2)}</b></span>
        <span className="px-2 py-1 rounded bg-slate-800">R: <b>{R.toFixed(2)}</b></span>
        <span className="px-2 py-1 rounded bg-slate-800">β: <b>{beta.toFixed(2)}</b></span>

        <div className="ml-auto flex gap-1">
          <button title="θ (GR) — York time (trace of extrinsic curvature) in General Relativity" aria-label="York time θ (GR)" onClick={()=>setViz(0)} className={cn("px-2 py-1 rounded", viz===0?"bg-blue-700 text-white":"bg-slate-800")}>θ (GR)</button>
          <button title="ρ (GR) — Energy density from the Hamiltonian constraint (≤ 0 in shell), General Relativity" aria-label="Energy density ρ (GR)" onClick={()=>setViz(1)} className={cn("px-2 py-1 rounded", viz===1?"bg-purple-700 text-white":"bg-slate-800")}>ρ (GR)</button>
          <button title="θ (Drive) — York time scaled by drive chain (γ_geo³ · q · γ_VdB · √d_FR) and sector gating" aria-label="Drive-scaled York time θ (Drive)" onClick={()=>setViz(2)} className={cn("px-2 py-1 rounded", viz===2?"bg-emerald-700 text-white":"bg-slate-800")}>θ (Drive)</button>
        </div>
      </div>

      <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-slate-800 bg-black/70">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
}