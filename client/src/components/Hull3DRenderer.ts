import { publish, subscribe, unsubscribe } from "@/lib/luma-bus";

import { queryClient } from "@/lib/queryClient";



/**



 * Hull3DRenderer



 * ---------------------------------------------------------------------------



 * WebGL2 volume renderer for the theta (Hull 3D) view. The renderer manages:



 *   - Radial LUT (1 x RADIAL_SIZE) sampling dTopHatDr in metric space



 */







const RADIAL_SIZE = 256;



const RADIAL_METRIC_RADIUS = 1;



const RADIAL_SAMPLE_R_MAX = 1.8;



const RADIAL_LUT_SCALE = (RADIAL_SIZE - 1) / RADIAL_SAMPLE_R_MAX;



const RING_SIZE = 2048;



const TWO_PI = Math.PI * 2;



const DEFAULT_DOMAIN_SCALE = 1.3;



const DEFAULT_EMA_ALPHA = 0.12;



const AVG_UPDATE_INTERVAL_MS = 1000 / 20; // ~20 Hz (within 15-30 Hz target)



const INV16PI = 1 / (16 * Math.PI);

const wrapPhase01 = (value: number) => {
  const wrapped = value % 1;
  return wrapped < 0 ? wrapped + 1 : wrapped;
};

const shortestPhaseDelta = (nextValue: number, prevValue: number) => {
  let delta = nextValue - prevValue;
  if (delta > 0.5) delta -= 1;
  if (delta <= -0.5) delta += 1;
  return delta;
};







type OverlayFlagKey =



  | "showHeatmapRing"



  | "showShellBands"



  | "showPhaseTracer"



  | "showReciprocity";







type OverlayToggleFlags = Partial<Record<OverlayFlagKey, boolean>>;







const OVERLAY_QUERY_KEY = ["helix:overlays"] as const;







const EMPTY_OVERLAY_FLAGS: OverlayToggleFlags = Object.freeze({});







function readOverlayFlags(): OverlayToggleFlags {



  try {



    return (



      (queryClient.getQueryData(OVERLAY_QUERY_KEY) as OverlayToggleFlags | undefined) ??



      EMPTY_OVERLAY_FLAGS



    );



  } catch {



    return EMPTY_OVERLAY_FLAGS;



  }



}











export type Hull3DRendererMode = "instant" | "average" | "blend";



export type Hull3DQualityPreset = "auto" | "low" | "medium" | "high";



export type Hull3DVolumeViz = "theta_gr" | "rho_gr" | "theta_drive";







const VOLUME_VIZ_TO_INDEX: Record<Hull3DVolumeViz, 0 | 1 | 2> = {



  theta_gr: 0,



  rho_gr: 1,



  theta_drive: 2,



};







export interface Hull3DQualityOverrides {



  voxelDensity?: "low" | "medium" | "high";



  raySteps?: number;



  stepBias?: number;



}







export interface Hull3DOverlayState {



  phase?: number;



  kInvariants?: {



    enabled?: boolean;



    mode?: 0 | 1 | 2;



    gain?: number;



    alpha?: number;



  };



  thetaIso?: {



    enabled?: boolean;



    step: number;



    width?: number;



    opacity?: number;



  };



  fordRoman?: {



    enabled?: boolean;



    tauLC: number;



    burst: number;



    dwell: number;



    alpha?: number;



  };



  sectorArc?: {



    enabled?: boolean;



    radiusPx?: number;



    widthPx?: number;



    gapPx?: number;



    instantAlpha?: number;



    emaAlpha?: number;



  };



  tilt?: {



    enabled?: boolean;



    dir?: [number, number];



    magnitude?: number;



    alpha?: number;



  };



  greens?: {



    enabled?: boolean;



    texture?: WebGLTexture | null;



    sizePx?: [number, number];



    originPx?: [number, number];



    range?: [number, number];



    alpha?: number;



  };



  curvature?: {



    enabled?: boolean;



    gain?: number;



    alpha?: number;



    palette?: number;



    showQIMargin?: boolean;



  };



}







type Overlay3DState = {
  mode: 0 | 1 | 2 | 3;
  mix: number;
  alpha: number;
  thick: number;
  gain: number;
  hue: number;
  phase01: number;
};


type CurvatureBrickMessage = {



  version: number;



  updatedAt: number;



  dims: [number, number, number];



  data: Float32Array;



  qiMargin?: Float32Array;



};

export interface Hull3DRendererState {



  axes: [number, number, number];



  R: number;



  sigma: number;



  beta: number;



  ampChain: number;



  gate: number;



  gateView: number;



  fActive: number;



  duty: number;



  // Multiplies volumetric densityScale to brighten/dim quickly (1 = neutral)



  exposure?: number;



  gaussianSigma: number;



  sectorCenter01: number;



  totalSectors: number;



  liveSectors: number;



  sectorFloor: number;



  lumpExp: number;



  splitEnabled: boolean;



  splitFrac: number;



  syncMode: number;



  phase01: number;



  phaseSign?: number;



  // UI toggles



  showSectorRing: boolean;



  showGhostSlice: boolean;



  followPhase: boolean;



  volumeViz?: Hull3DVolumeViz;



  blendFactor: number; // 0 = instant, 1 = average



  freeze: boolean;



  showSurfaceOverlay: boolean;



  betaOverlayEnabled?: boolean;



  betaTarget_ms2?: number;



  comfort_ms2?: number;



  hullDims?: [number, number, number];



  betaTexture?: WebGLTexture | null;



  betaUniform_ms2?: number;



  betaSampler?: ((u: number, v: number) => number) | null;



  // Diagnostics



  timeSec: number;



  bubbleStatus?: "NOMINAL" | "WARNING" | "CRITICAL";



  // Canvas aspect (provided by panel to keep camera in sync)



  aspect: number;



  vizFloorThetaGR?: number;



  vizFloorRhoGR?: number;



  vizFloorThetaDrive?: number;



  overlays?: Hull3DOverlayState;



}







export interface Hull3DRendererOptions {



  quality?: Hull3DQualityPreset;



  qualityOverrides?: Hull3DQualityOverrides;



  emaAlpha?: number;



}







type QualityProfile = {



  dims: [number, number, number];



  maxSteps: number;



  stepBias: number;



};







const QUALITY_PROFILES: Record<Exclude<Hull3DQualityPreset, "auto">, QualityProfile> = {



  low:    { dims: [128, 96, 128],  maxSteps: 56, stepBias: 0.65 },



  medium: { dims: [192, 144, 192], maxSteps: 72, stepBias: 0.52 },



  high:   { dims: [256, 192, 256], maxSteps: 96, stepBias: 0.42 },



};







const DEFAULT_BETA_TARGET = 9.80665;



const DEFAULT_COMFORT = 0.4 * 9.80665;







type Vec3 = [number, number, number];







const clamp = (x: number, min = -Infinity, max = Infinity) => Math.min(Math.max(x, min), max);



class UniformCache {



  private readonly f1 = new Map<WebGLUniformLocation, number>();



  private readonly i1 = new Map<WebGLUniformLocation, number>();



  set1f(gl: WebGL2RenderingContext, loc: WebGLUniformLocation | null, value: number) {



    if (!loc) return;



    if (this.f1.get(loc) === value) return;



    gl.uniform1f(loc, value);



    this.f1.set(loc, value);



  }



  set1i(gl: WebGL2RenderingContext, loc: WebGLUniformLocation | null, value: number) {



    if (!loc) return;



    if (this.i1.get(loc) === value) return;



    gl.uniform1i(loc, value);



    this.i1.set(loc, value);



  }



}



const lerp = (a: number, b: number, t: number) => a + (b - a) * t;







const identity = (): Float32Array => {



  const m = new Float32Array(16);



  m[0] = m[5] = m[10] = m[15] = 1;



  return m;



};







const multiply = (out: Float32Array, a: Float32Array, b: Float32Array) => {



  for (let i = 0; i < 4; i++) {



    const ai0 = a[i]; const ai1 = a[i + 4]; const ai2 = a[i + 8]; const ai3 = a[i + 12];



    out[i]      = ai0 * b[0] + ai1 * b[1] + ai2 * b[2] + ai3 * b[3];



    out[i + 4]  = ai0 * b[4] + ai1 * b[5] + ai2 * b[6] + ai3 * b[7];



    out[i + 8]  = ai0 * b[8] + ai1 * b[9] + ai2 * b[10] + ai3 * b[11];



    out[i + 12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];



  }



  return out;



};







const perspective = (out: Float32Array, fovy: number, aspect: number, near: number, far: number) => {



  const f = 1.0 / Math.tan(fovy / 2);



  out.fill(0);



  out[0] = f / aspect;



  out[5] = f;



  out[10] = (far + near) / (near - far);



  out[11] = -1;



  out[14] = (2 * far * near) / (near - far);



  return out;



};







const lookAt = (out: Float32Array, eye: Vec3, center: Vec3, up: Vec3) => {



  let [ex, ey, ez] = eye;



  let [cx, cy, cz] = center;



  let [ux, uy, uz] = up;



  let zx = ex - cx;



  let zy = ey - cy;



  let zz = ez - cz;



  const zLen = Math.hypot(zx, zy, zz) || 1;



  zx /= zLen; zy /= zLen; zz /= zLen;



  let xx = uy * zz - uz * zy;



  let xy = uz * zx - ux * zz;



  let xz = ux * zy - uy * zx;



  const xLen = Math.hypot(xx, xy, xz) || 1;



  xx /= xLen; xy /= xLen; xz /= xLen;



  let yx = zy * xz - zz * xy;



  let yy = zz * xx - zx * xz;



  let yz = zx * xy - zy * xx;



  out[0] = xx; out[4] = xy; out[8] = xz;  out[12] = -(xx * ex + xy * ey + xz * ez);



  out[1] = yx; out[5] = yy; out[9] = yz;  out[13] = -(yx * ex + yy * ey + yz * ez);



  out[2] = zx; out[6] = zy; out[10] = zz; out[14] = -(zx * ex + zy * ey + zz * ez);



  out[3] = 0;  out[7] = 0;  out[11] = 0;  out[15] = 1;



  return out;



};







const invert = (out: Float32Array, m: Float32Array) => {



  const inv = new Float32Array(16);



  inv[0]  = m[5]  * m[10] * m[15] - m[5]  * m[11] * m[14] - m[9]  * m[6]  * m[15] +



            m[9]  * m[7]  * m[14] + m[13] * m[6]  * m[11] - m[13] * m[7]  * m[10];



  inv[4]  = -m[4]  * m[10] * m[15] + m[4]  * m[11] * m[14] + m[8]  * m[6]  * m[15] -



            m[8]  * m[7]  * m[14] - m[12] * m[6]  * m[11] + m[12] * m[7]  * m[10];



  inv[8]  = m[4]  * m[9]  * m[15] - m[4]  * m[11] * m[13] - m[8]  * m[5]  * m[15] +



            m[8]  * m[7]  * m[13] + m[12] * m[5]  * m[11] - m[12] * m[7]  * m[9];



  inv[12] = -m[4]  * m[9]  * m[14] + m[4]  * m[10] * m[13] + m[8]  * m[5]  * m[14] -



            m[8]  * m[6]  * m[13] - m[12] * m[5]  * m[10] + m[12] * m[6]  * m[9];



  inv[1]  = -m[1]  * m[10] * m[15] + m[1]  * m[11] * m[14] + m[9]  * m[2]  * m[15] -



            m[9]  * m[3]  * m[14] - m[13] * m[2]  * m[11] + m[13] * m[3]  * m[10];



  inv[5]  = m[0]  * m[10] * m[15] - m[0]  * m[11] * m[14] - m[8]  * m[2]  * m[15] +



            m[8]  * m[3]  * m[14] + m[12] * m[2]  * m[11] - m[12] * m[3]  * m[10];



  inv[9]  = -m[0]  * m[9]  * m[15] + m[0]  * m[11] * m[13] + m[8]  * m[1]  * m[15] -



            m[8]  * m[3]  * m[13] - m[12] * m[1]  * m[11] + m[12] * m[3]  * m[9];



  inv[13] = m[0]  * m[9]  * m[14] - m[0]  * m[10] * m[13] - m[8]  * m[1]  * m[14] +



            m[8]  * m[2]  * m[13] + m[12] * m[1]  * m[10] - m[12] * m[2]  * m[9];



  inv[2]  = m[1]  * m[6]  * m[15] - m[1]  * m[7]  * m[14] - m[5]  * m[2]  * m[15] +



            m[5]  * m[3]  * m[14] + m[13] * m[2]  * m[7]  - m[13] * m[3]  * m[6];



  inv[6]  = -m[0]  * m[6]  * m[15] + m[0]  * m[7]  * m[14] + m[4]  * m[2]  * m[15] -



            m[4]  * m[3]  * m[14] - m[12] * m[2]  * m[7]  + m[12] * m[3]  * m[6];



  inv[10] = m[0]  * m[5]  * m[15] - m[0]  * m[7]  * m[13] - m[4]  * m[1]  * m[15] +



            m[4]  * m[3]  * m[13] + m[12] * m[1]  * m[7]  - m[12] * m[3]  * m[5];



  inv[14] = -m[0]  * m[5]  * m[14] + m[0]  * m[6]  * m[13] + m[4]  * m[1]  * m[14] -



            m[4]  * m[2]  * m[13] - m[12] * m[1]  * m[6]  + m[12] * m[2]  * m[5];



  inv[3]  = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] -



            m[5] * m[3] * m[10] - m[9] * m[2] * m[7]  + m[9] * m[3] * m[6];



  inv[7]  = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] +



            m[4] * m[3] * m[10] + m[8] * m[2] * m[7]  - m[8] * m[3] * m[6];



  inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] -



            m[4] * m[3] * m[9] - m[8] * m[1] * m[7]  + m[8] * m[3] * m[5];



  inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] +



            m[4] * m[2] * m[9] + m[8] * m[1] * m[6]  - m[8] * m[2] * m[5];



  let det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];



  if (Math.abs(det) < 1e-8) return null;



  det = 1.0 / det;



  for (let i = 0; i < 16; i++) out[i] = inv[i] * det;



  return out;



};







const sech2 = (x: number) => {



  const c = Math.cosh(x);



  return 1 / (c * c);



};







const dTopHatDr = (r: number, sigma: number, R: number) => {



  const den = Math.max(1e-8, 2 * Math.tanh(sigma * R));



  return sigma * (sech2(sigma * (r + R)) - sech2(sigma * (r - R))) / den;



};







const buildRadialLUT = (sigma: number, RMetric: number, rMax: number) => {



  const lut = new Float32Array(RADIAL_SIZE);



  const maxRadius = Math.max(rMax, 1e-6);



  for (let i = 0; i < RADIAL_SIZE; i++) {



    const t = i / (RADIAL_SIZE - 1);



    const r = t * maxRadius;



    const sample = dTopHatDr(r, sigma, RMetric);



    lut[i] = Number.isFinite(sample) ? sample : 0;



  }



  return lut;



};







const rotateWeights = (weights: Float32Array, phase01: number) => {



  const shifted = new Float32Array(weights.length);



  const phase = ((phase01 % 1) + 1) % 1;



  const offset = phase * weights.length;



  for (let i = 0; i < weights.length; i++) {



    const idx = (i + offset) % weights.length;



    const i0 = Math.floor(idx);



    const t = idx - i0;



    const i1 = (i0 + 1) % weights.length;



    const w0 = weights[i0];



    const w1 = weights[i1];



    shifted[i] = w0 + (w1 - w0) * t;



  }



  return shifted;



};







const createTexture2D = (gl: WebGL2RenderingContext) => {



  const tex = gl.createTexture();



  if (!tex) throw new Error("Failed to allocate texture");



  gl.bindTexture(gl.TEXTURE_2D, tex);



  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);



  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);



  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);



  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);



  gl.bindTexture(gl.TEXTURE_2D, null);



  return tex;



};







const createTexture3D = (gl: WebGL2RenderingContext) => {



  const tex = gl.createTexture();



  if (!tex) throw new Error("Failed to allocate texture3D");



  gl.bindTexture(gl.TEXTURE_3D, tex);



  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);



  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);



  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);



  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);



  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);



  gl.bindTexture(gl.TEXTURE_3D, null);



  return tex;



};







const compileShader = (gl: WebGL2RenderingContext, type: number, src: string) => {



  const shader = gl.createShader(type);



  if (!shader) throw new Error("Failed to create shader");



  gl.shaderSource(shader, src);



  gl.compileShader(shader);



  const ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS);



  if (!ok) {



    const info = gl.getShaderInfoLog(shader);



    gl.deleteShader(shader);



    throw new Error(`Shader compile failed: ${info || "no info log"}`);



  }



  return shader;



};







const linkProgram = (gl: WebGL2RenderingContext, label: string, vsSrc: string, fsSrc: string) => {



  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);



  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);



  const prog = gl.createProgram();



  if (!prog) {



    gl.deleteShader(vs);



    gl.deleteShader(fs);



    throw new Error("Failed to create program");



  }



  gl.attachShader(prog, vs);



  gl.attachShader(prog, fs);



  gl.linkProgram(prog);



  const ok = gl.getProgramParameter(prog, gl.LINK_STATUS);



  gl.deleteShader(vs);



  gl.deleteShader(fs);



  if (!ok) {



    const info = gl.getProgramInfoLog(prog);



    gl.deleteProgram(prog);



    throw new Error(`${label} link failed: ${info || "no info log"}`);



  }



  return prog;



};







const RAYMARCH_VS = `#version 300 es



layout(location=0) in vec2 a_pos;



out vec2 v_ndc;



void main() {



  v_ndc = a_pos;



  gl_Position = vec4(a_pos, 0.0, 1.0);



}



`;







const RAYMARCH_FS = `#version 300 es



precision highp float;



precision highp sampler3D;



precision highp sampler2D;



in vec2 v_ndc;



layout(location=0) out vec4 outColor;



layout(location=1) out vec4 outAux;







uniform sampler3D u_volume;



uniform sampler2D u_ringInstant;



uniform sampler2D u_ringAverage;



uniform sampler2D u_radialLUT;



uniform sampler3D u_curvTex;



uniform float u_curvGain;



uniform float u_curvAlpha;



uniform int u_curvPaletteMode;







uniform vec3 u_axes;



uniform float u_domainScale;



uniform float u_beta;



uniform float u_ampChain;



uniform float u_gate;



uniform float u_gate_view;



uniform float u_fActive;



uniform float u_lumpExp;



uniform float u_phase01;



uniform float u_phaseSign;



uniform float u_blend;



uniform float u_densityScale;



uniform float u_stepBias;



uniform int u_maxSteps;



uniform float u_radialScale;



uniform float u_radialMax;



uniform float u_invR;



uniform float u_timeSec;



uniform float u_sigma; // sigma for analytic df in test modes



uniform float u_grThetaGain;



uniform float u_grRhoGain;



uniform float u_vizFloorThetaGR;



uniform float u_vizFloorRhoGR;



uniform float u_vizFloorThetaDrive;







// Diagnostics: allow bypassing ring gating to test visibility



uniform int u_forceFlatGate;



// Diagnostics: toggle a simple debug color to verify shader path



uniform int u_debugMode;



// Diagnostics: band sampling modes for probe FBO



uniform int u_probeMode;



uniform float u_probeGain;



// Test harness controls (dev only)



uniform int u_testMode;



uniform float u_baseScale;



// New: independent overlays/flags



uniform int   u_overlayMode;   // 0=off,1=fog3d,2=isoShell_dfdr,3=phaseStreaks



uniform float u_overlayMix;    // 0 instant, 1 EMA



uniform float u_overlayAlpha;  // blend factor for overlay tint



uniform float u_overlayThick;  // radial half-thickness (fraction of R)



uniform float u_overlayGain;   // intensity gain



uniform float u_overlayHue;    // base hue offset



uniform float u_overlayPhase;  // phase offset for streaks



uniform int u_ringOverlay;    // 1 to add a thin ring band at r≈R



uniform int u_grayMode;       // 1 to force grayscale volume



uniform int u_volumeViz;      // 0 theta_GR, 1 rho_GR, 2 theta_Drive



// Distribution-aware ring overlay controls



uniform int   u_ringOverlayMode;   // 0=locator, 1=weighted, 2=field-coded



uniform float u_ringOverlayBlend;  // 0..1 mixing instant/average weights



uniform float u_ringOverlayAlpha;  // 0..1 overlay opacity



uniform float u_ringOverlayWidth;  // radial belt thickness



uniform int   u_ringOverlayField;  // -1=follow volume viz, otherwise explicit field







uniform vec3 u_cameraPos;



uniform mat4 u_invViewProj;







const float INV_TAU = 0.15915494309189535;



const float INV16PI = 0.019894367886486918;



const int RADIAL_LAST = ${RADIAL_SIZE - 1};







struct KFastOut {



  float thetaGR;



  float rhoGR;



  float K2;



  float KijKij;



};







KFastOut kfast(float dfdr, vec3 rhat, float beta) {



  vec3 grad = dfdr * rhat;



  float dfx = grad.x;



  float dfy = grad.y;



  float dfz = grad.z;



  float Kxx = -beta * dfx;



  float Kxy = -0.5 * beta * dfy;



  float Kxz = -0.5 * beta * dfz;



  float theta = beta * dfx;



  float K2 = theta * theta;



  float KijKij = Kxx * Kxx + 2.0 * (Kxy * Kxy + Kxz * Kxz);



  KFastOut o;



  o.thetaGR = theta;



  o.rhoGR = (K2 - KijKij) * INV16PI;



  o.K2 = K2;



  o.KijKij = KijKij;



  return o;



}







float encodeLogVis(float v) {



  float logv = log2(max(v, 1e-36));



  return clamp((logv + 60.0) / 100.0, 0.0, 1.0);



}







vec3 diverge(float x) {



  float t = clamp(0.5 * (x + 1.0), 0.0, 1.0);



  vec3 cold = vec3(0.05, 0.2, 0.5);



  vec3 mid  = vec3(0.94, 0.96, 0.95);



  vec3 warm = vec3(0.98, 0.7, 0.1);



  if (t < 0.5) {



    float f = t / 0.5;



    return mix(cold, mid, f);



  } else {



    float f = (t - 0.5) / 0.5;



    return mix(mid, warm, f);



  }



}







vec3 purpleMap(float s) {



  float t = clamp(-s, 0.0, 1.0);



  vec3 base = vec3(0.92, 0.92, 0.98);



  vec3 purp = vec3(0.58, 0.25, 0.93);



  return mix(base, purp, t);



}






vec3 hsv2rgb(vec3 hsv) {
  vec3 p = abs(fract(hsv.xxx + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0);
  return hsv.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), hsv.y);
}

float shellWindow(float rNorm, float halfWidth) {
  float hw = clamp(halfWidth, 0.002, 0.6);
  float inner = smoothstep(1.0 - hw * 1.4, 1.0 - hw * 0.25, rNorm);
  float outer = 1.0 - smoothstep(1.0 + hw * 0.25, 1.0 + hw * 1.4, rNorm);
  return clamp(inner * outer, 0.0, 1.0);
}

float hueForAngle(float angle01, float baseHue) {
  return fract(baseHue + angle01);
}




float fetchRingWeight(sampler2D tex, float a01) {



  float u = fract(a01);



  return texture(tex, vec2(u, 0.5)).r;



}

vec3 curvaturePalette(float t, int mode) {
  t = clamp(t, 0.0, 1.0);
  if (mode == 1) {
    float x = clamp(t * 2.0 - 1.0, -1.0, 1.0);
    vec3 cold = vec3(0.12, 0.25, 0.92);
    vec3 warm = vec3(0.92, 0.28, 0.18);
    vec3 mid = vec3(0.96, 0.96, 0.96);
    if (x >= 0.0) {
      return mix(mid, warm, clamp(x, 0.0, 1.0));
    }
    return mix(mid, cold, clamp(-x, 0.0, 1.0));
  }
  vec3 c0 = vec3(0.08, 0.20, 0.80);
  vec3 c1 = vec3(0.05, 0.65, 0.88);
  vec3 c2 = vec3(0.98, 0.90, 0.25);
  vec3 c3 = vec3(0.92, 0.20, 0.12);
  float seg = clamp(t * 3.0, 0.0, 3.0);
  vec3 color = mix(c0, c1, clamp(seg, 0.0, 1.0));
  color = mix(color, c2, clamp(seg - 1.0, 0.0, 1.0));
  color = mix(color, c3, clamp(seg - 2.0, 0.0, 1.0));
  return color;
}








float a01_metric(vec3 pMetric) {



  float ang = atan(pMetric.z, pMetric.x);



  float a01 = ang * INV_TAU;



  return fract(a01);



}







float sampleRadialLUTMetric(float r) {



  if (r > u_radialMax || isnan(r) || isinf(r)) {



    return 0.0;



  }



  float idx = clamp(r * u_radialScale, 0.0, float(RADIAL_LAST));



  float texSize = float(RADIAL_LAST) + 1.0;



  float u = (idx + 0.5) / texSize;



  return texture(u_radialLUT, vec2(u, 0.5)).r;



}







// Analytic helpers (avoid LUT for test modes to validate pipeline)



float coshF(float x) { float ex = exp(x); float eix = exp(-x); return 0.5 * (ex + eix); }



float tanhF(float x) { float e2 = exp(2.0 * x); return (e2 - 1.0) / (e2 + 1.0); }



float sech2F(float x) { float c = coshF(x); return 1.0 / (c * c); }



float dTopHatDr_metric(float r, float sigma, float R) {



  float den = max(1e-8, 2.0 * tanhF(sigma * R));



  return sigma * (sech2F(sigma * (r + R)) - sech2F(sigma * (r - R))) / den;



}







bool intersectAABB(vec3 ro, vec3 rd, vec3 boundsMin, vec3 boundsMax, out float t0, out float t1) {



  vec3 invDir = 1.0 / rd;



  vec3 tMin = (boundsMin - ro) * invDir;



  vec3 tMax = (boundsMax - ro) * invDir;



  vec3 tNear = min(tMin, tMax);



  vec3 tFar  = max(tMin, tMax);



  t0 = max(max(tNear.x, tNear.y), tNear.z);



  t1 = min(min(tFar.x,  tFar.y),  tFar.z);



  return t1 >= max(t0, 0.0);



}







bool intersectEllipsoid(vec3 ro, vec3 rd, vec3 axes, out float t0, out float t1) {



  vec3 o = ro / axes;



  vec3 d = rd / axes;



  float A = dot(d, d);



  float B = 2.0 * dot(o, d);



  float C = dot(o, o) - 1.0;



  float disc = B * B - 4.0 * A * C;



  if (disc < 0.0) return false;



  float s = sqrt(max(disc, 0.0));



  float denom = 2.0 * A;



  if (denom == 0.0) return false;



  float tA = (-B - s) / denom;



  float tB = (-B + s) / denom;



  if (tA > tB) {



    float tmp = tA;



    tA = tB;



    tB = tmp;



  }



  t0 = tA;



  t1 = tB;



  return t1 > max(t0, 0.0);



}







void main() {



  vec4 nearH = u_invViewProj * vec4(v_ndc, -1.0, 1.0);



  nearH /= max(nearH.w, 1e-6);



  vec3 rayOrigin = u_cameraPos;



  vec4 farH = u_invViewProj * vec4(v_ndc, 1.0, 1.0);



  farH /= max(farH.w, 1e-6);



  vec3 rayDir = normalize(farH.xyz - rayOrigin);







  vec3 axesSafe = max(abs(u_axes), vec3(1e-6));



  vec3 bounds = axesSafe * u_domainScale;



  float tEnter, tExit;



  bool hitBounds = intersectAABB(rayOrigin, rayDir, -bounds, bounds, tEnter, tExit);



  if (!hitBounds) {



    float ellT0, ellT1;



    if (intersectEllipsoid(rayOrigin, rayDir, bounds, ellT0, ellT1)) {



      hitBounds = true;



      tEnter = max(ellT0, 0.0);



      tExit = ellT1;



    }



  }



  bool rayHit = hitBounds;



  if (!hitBounds) {



    if (u_testMode != 0) {



      tEnter = 0.0;



      tExit = max(length(bounds) * 2.0, 1.0);



    } else {



      discard;



    }



  }



  float t = max(tEnter, 0.0);



  float segLen = max(tExit - t, 1e-4);



  float dtBase = max(1e-4, segLen / float(u_maxSteps));



  vec4 accum = vec4(0.0);



  float bandHits = 0.0;



  float bandWeight = 0.0;



  float bandSamples = 0.0;



  float bandLuma = 0.0;



  float sumAbsDf = 0.0;



  float sumGate = 0.0;



  float sumTheta = 0.0;



  float sampleCount = 0.0;



  float diagRawMax = 0.0;



  float diagBoostMax = 0.0;



  float diagDensityMax = 0.0;



  float diagDriveMax = 0.0;



  float auxThetaPeak = 0.0;



  float auxRhoMin = 0.0;



  float auxMixPeak = 0.0;



  float auxKijPeak = 0.0;







  // Optional debug: show a simple gradient if requested (mode 1)



  if (u_debugMode == 1) {



    float u = 0.5 * (v_ndc.x + 1.0);



    float v = 0.5 * (v_ndc.y + 1.0);



    outColor = vec4(u, v, 0.2, 1.0);



    outAux = vec4(0.0);



    return;



  }



  for (int i = 0; i < u_maxSteps; i++) {



    // In test modes, don't terminate early on accumulated alpha so we can fully sample the band



    if (t > tExit || (u_testMode == 0 && accum.a >= 0.98)) break;



    vec3 pos = rayOrigin + rayDir * t;



    vec3 gridCentered = pos / bounds;



    if (max(abs(gridCentered.x), max(abs(gridCentered.y), abs(gridCentered.z))) > 1.0) {



      t += dtBase;



      continue;



    }



    vec3 pMetric = vec3(



      pos.x / axesSafe.x,



      pos.y / axesSafe.y,



      pos.z / axesSafe.z



    ) * u_invR;



    float rMetric = length(pMetric);



    // Debug belt overlay: locator, weighted, or field-coded band near the shell radius



    if (u_debugMode == 2 || u_ringOverlay == 1) {



      float bandWidth = clamp(u_ringOverlayWidth, 0.002, 0.20);



      float band = smoothstep(1.0 + bandWidth, 1.0, rMetric) * (1.0 - smoothstep(1.0, 1.0 - bandWidth, rMetric));



      float edgeAlpha = band * clamp(u_ringOverlayAlpha, 0.02, 1.0);



      vec3 overlayColor = vec3(band);



      int overlayMode = max(0, u_ringOverlayMode);



      if (overlayMode == 1 || overlayMode == 2) {



        float a01Base = a01_metric(pMetric);



        float aInstant = fract(a01Base + u_phaseSign * u_phase01);



        float wInstant = fetchRingWeight(u_ringInstant, aInstant);



        float wAverage = fetchRingWeight(u_ringAverage, a01Base);



        float blendT = clamp(u_ringOverlayBlend, 0.0, 1.0);



        float wMix = mix(wInstant, wAverage, blendT);



        if (overlayMode == 1) {



          float luma = clamp(pow(max(wMix, 0.0), 0.7), 0.0, 1.0);



          vec3 tintInstant = vec3(1.00, 0.62, 0.20);



          vec3 tintAverage = vec3(0.20, 0.78, 1.00);



          vec3 tint = mix(tintInstant, tintAverage, blendT);



          overlayColor = mix(vec3(0.0), tint, luma);



          edgeAlpha *= luma;



        } else {



          float dfLutShell = sampleRadialLUTMetric(rMetric);



          float dfShell = (u_testMode == 3 || u_testMode == 6)



            ? dTopHatDr_metric(rMetric, max(u_sigma, 1e-6), 1.0)



            : dfLutShell;



          vec3 dirShell = (rMetric > 1e-6) ? (pMetric / rMetric) : vec3(0.0);



          float base = dirShell.x * dfShell;



          float fActiveSafe = max(u_fActive, 1e-6);



          float activeScale = inversesqrt(fActiveSafe);



          float gateExponent = max(0.5, u_lumpExp);



          float gateWF = pow(activeScale * sqrt(max(wMix, 0.0)), gateExponent);



          float dfy = dfShell * dirShell.y;



          float dfz = dfShell * dirShell.z;



          float thetaGR = u_beta * base;



          float Kxx = -u_beta * base;



          float Kxy = -0.5 * u_beta * dfy;



          float Kxz = -0.5 * u_beta * dfz;



          float K2 = Kxx * Kxx;



          float KijKij = Kxx * Kxx + 2.0 * Kxy * Kxy + 2.0 * Kxz * Kxz;



          float rhoGR = (K2 - KijKij) * INV16PI;



          float thetaDrive = thetaGR * u_ampChain * u_gate_view * gateWF;



          int fieldSel = (u_ringOverlayField < 0) ? u_volumeViz : u_ringOverlayField;



          float fieldValue = (fieldSel == 1) ? rhoGR : ((fieldSel == 2) ? thetaDrive : thetaGR);



          float boost = (fieldSel == 1) ? max(u_grRhoGain, 1e-12) : max(u_grThetaGain, 1e-12);



          float viz = clamp(fieldValue * boost * u_densityScale, -1.5, 1.5);



          overlayColor = (fieldSel == 1) ? purpleMap(viz) : diverge(viz);



        }



      }



      accum.rgb += (1.0 - accum.a) * overlayColor * edgeAlpha;



      accum.a += (1.0 - accum.a) * edgeAlpha;



      t += dtBase;



      if (u_debugMode == 2) { continue; }



    }



    float dfLut = sampleRadialLUTMetric(rMetric);



    // For test modes, allow analytic fallback to validate df independent of LUT upload



    float df = (u_testMode == 3 || u_testMode == 6)



      ? dTopHatDr_metric(rMetric, max(u_sigma, 1e-6), 1.0)



      : dfLut;



    vec3 dir = (rMetric > 1e-6) ? (pMetric / rMetric) : vec3(0.0);



    float cosX = dir.x;



    float base = cosX * df;



    float a01Base = a01_metric(pMetric);



    float aInstant = fract(a01Base + u_phaseSign * u_phase01);



    float wInstant = fetchRingWeight(u_ringInstant, aInstant);



    float wAvg = fetchRingWeight(u_ringAverage, a01Base);



    float wNorm = mix(wInstant, wAvg, clamp(u_blend, 0.0, 1.0));



    if (u_forceFlatGate == 1) {



      wNorm = 1.0;



    }



    float wSafe = max(wNorm, 0.0);



    float fActiveSafe = max(u_fActive, 1e-6);



    float activeScale = inversesqrt(fActiveSafe);



    float gateLump = max(0.5, u_lumpExp);



    float gateWF = pow(activeScale * sqrt(wSafe), gateLump);



    KFastOut k = kfast(df, dir, u_beta);



    float thetaGR = k.thetaGR;



    float thetaDrive = thetaGR * u_ampChain * u_gate_view * gateWF;



    float K2 = k.K2;



    float KijKij = k.KijKij;



    float rhoGR = k.rhoGR;



    float kmix = KijKij - K2;



    if (abs(thetaGR) > abs(auxThetaPeak)) {



      auxThetaPeak = thetaGR;



    }



    if (rhoGR < auxRhoMin) {



      auxRhoMin = rhoGR;



    }



    if (abs(kmix) > abs(auxMixPeak)) {



      auxMixPeak = kmix;



    }



    if (KijKij > auxKijPeak) {



      auxKijPeak = KijKij;



    }



    float fieldValue = (u_volumeViz == 0) ? thetaGR : ((u_volumeViz == 1) ? rhoGR : thetaDrive);



    float floorV = (u_volumeViz == 0) ? u_vizFloorThetaGR : ((u_volumeViz == 1) ? u_vizFloorRhoGR : u_vizFloorThetaDrive);



    float clampedValue = fieldValue;



    if (floorV > 0.0) {



      float mag = abs(clampedValue);



      if (mag < floorV) {



        clampedValue = (clampedValue < 0.0) ? -floorV : floorV;



      }



    }



    sampleCount += 1.0;



    float bandWindow = smoothstep(1.03, 1.00, rMetric) * (1.0 - smoothstep(1.00, 0.97, rMetric));



    if (bandWindow > 1e-4) {



      bandHits += 1.0;



      bandWeight += bandWindow;



      bandSamples += 1.0;



      sumAbsDf += abs(df);



      sumGate += gateWF;



      sumTheta += abs(thetaDrive);



    }



    float displayValue = clampedValue;



    if (u_volumeViz == 0) {



      float thetaBoost = max(u_grThetaGain, 1e-12);



      displayValue = thetaGR * thetaBoost;



    } else if (u_volumeViz == 1) {



      float rhoBoost = max(u_grRhoGain, 1e-12);



      displayValue = rhoGR * rhoBoost;



    }



    float densitySource = abs(displayValue);



    diagDriveMax = max(diagDriveMax, abs(thetaDrive));



    diagRawMax = max(diagRawMax, abs(fieldValue));



    diagBoostMax = max(diagBoostMax, abs(displayValue));



    diagDensityMax = max(diagDensityMax, densitySource);







    float absDf = abs(df);



    float wallBand = smoothstep(0.2, 1.0, clamp(absDf / (1e-6 + u_radialMax), 0.0, 1.0));



    float stepScale = mix(0.55, 1.4, clamp(1.0 - min(absDf, 12.0) * u_stepBias, 0.0, 1.0));



    float adaptiveScale = mix(stepScale, stepScale * 0.35, wallBand);







    if (u_probeMode != 0) {



      if (bandWindow > 1e-4) {



        float probeField = abs(displayValue);



        float L = clamp(probeField * u_probeGain, 0.0, 1.0);



        bandLuma += L * bandWindow;



      }



      t += dtBase * adaptiveScale;



      continue;



    }







    if (u_debugMode == 3 || (u_grayMode == 1 && u_debugMode != 4)) {



      float L = clamp(abs(displayValue) * u_densityScale * 0.8, 0.0, 1.0);



      float alpha = L;



      vec3 color = vec3(L);



      accum.rgb += (1.0 - accum.a) * color * alpha;



      accum.a += (1.0 - accum.a) * alpha;



      t += dtBase * adaptiveScale;



      continue;



    }







    float density = clamp(densitySource * u_densityScale * 1.15, 0.0, 1.2);



    float vis = clamp(displayValue * u_densityScale, -1.5, 1.5);



    vec3 color = (u_volumeViz == 1)



      ? purpleMap(vis)



      : diverge(vis);



    if (u_curvAlpha > 1e-5) {
      vec3 sampleUVW = clamp(gridCentered * 0.5 + 0.5, 0.0, 1.0);
      float residual = texture(u_curvTex, sampleUVW).r * u_curvGain;
      float curvNorm = clamp(0.5 + 0.5 * residual, 0.0, 1.0);
      vec3 curvColor = curvaturePalette(curvNorm, u_curvPaletteMode);
      float a = clamp(u_curvAlpha, 0.0, 1.0);
      color += (1.0 - accum.a) * curvColor * a;
    }



    float alpha = 1.0 - exp(-density * 1.6);



    if (u_overlayMode != 0 && u_overlayAlpha > 1e-5) {
      float overlayShell = shellWindow(rMetric, max(u_overlayThick, 0.003));
      if (overlayShell > 1e-5) {
        float mixT = clamp(u_overlayMix, 0.0, 1.0);
        float wBlend = clamp(mix(wInstant, wAvg, mixT), 0.0, 1.0);
        float sectorWeight = mix(0.18, 1.0, pow(wBlend, 0.55));
        float gain = clamp(u_overlayGain, 0.0, 16.0);
        float overlayAlpha = clamp(u_overlayAlpha, 0.0, 1.0);
        float baseStrength = overlayShell * sectorWeight * gain;
        if (baseStrength > 1e-5 && overlayAlpha > 0.0) {
          if (u_overlayMode == 1) {
            vec3 tint = hsv2rgb(vec3(fract(u_overlayHue), 0.55, 1.0));
            float fog = clamp(baseStrength, 0.0, 1.6) * overlayAlpha;
            color = mix(color, tint, fog);
            alpha = 1.0 - (1.0 - alpha) * exp(-fog * 1.4);
          } else if (u_overlayMode == 2) {
            float dfMag = clamp(abs(df), 0.0, 8.0);
            float dfNorm = dfMag / (1.0 + dfMag);
            float weight = overlayAlpha * baseStrength * (0.35 + 0.65 * dfNorm);
            vec3 tint = hsv2rgb(vec3(fract(u_overlayHue), 0.75, 1.0));
            color += tint * weight;
            alpha = clamp(alpha + weight * 0.55, 0.0, 1.0);
          } else if (u_overlayMode == 3) {
            float phase = fract(aInstant + u_overlayPhase);
            float streakProfile = pow(1.0 - abs(phase * 2.0 - 1.0), 6.0);
            float weight = overlayAlpha * baseStrength * max(0.2, streakProfile);
            float hue = hueForAngle(phase, u_overlayHue);
            vec3 tint = hsv2rgb(vec3(hue, 0.85, 1.0));
            float blend = clamp(weight, 0.0, 1.0);
            color = mix(color, tint, blend);
            alpha = clamp(alpha + weight * 0.3, 0.0, 1.0);
          }
        }
      }
    }



    accum.rgb += (1.0 - accum.a) * color * alpha;



    accum.a += (1.0 - accum.a) * alpha;



    t += dtBase * adaptiveScale;



  }



  if (u_debugMode == 4) {



    float rawVis = encodeLogVis(diagRawMax);



    float boostVis = encodeLogVis(diagBoostMax);



    float densityVis = encodeLogVis(diagDensityMax);



    float driveVis = encodeLogVis(diagDriveMax);



    outColor = vec4(rawVis, boostVis, densityVis, driveVis);



    outAux = vec4(0.0);



    return;



  }



  if (u_testMode != 0) {



    float coverage = bandHits > 0.0 ? 1.0 : 0.0;



    float normBandSamples = max(bandSamples, 1e-6);



  // Amplify df visibility in test mode so 8-bit readback registers nonzero



  float meanDf = bandHits > 0.0 ? clamp(sumAbsDf / normBandSamples * 1.5, 0.0, 1.0) : 0.0;



  float meanGate = bandHits > 0.0 ? clamp(sumGate / normBandSamples * 0.2, 0.0, 1.0) : 0.0;



  // In test mode 6, amplify θ magnitude to clear 8-bit quantization and frame averaging



  float thetaScale = (u_testMode == 6) ? 2e-14 : 1e-15;



  float meanTheta = bandHits > 0.0 ? clamp(sumTheta / normBandSamples * thetaScale, 0.0, 1.0) : 0.0;



    vec4 testOut = vec4(0.0);



    if (u_testMode == 1) {



      testOut = vec4(1.0);



    } else if (u_testMode == 2) {



      testOut = vec4(vec3(coverage), coverage);



    } else if (u_testMode == 3) {



      testOut = vec4(vec3(meanDf), coverage);



    } else if (u_testMode == 4) {



      testOut = vec4(vec3(meanGate), coverage);



    } else if (u_testMode == 5) {



      float baseOnly = clamp(abs(u_baseScale) * 1e-15, 0.0, 1.0);



      testOut = vec4(vec3(baseOnly), 1.0);



    } else if (u_testMode == 6) {



      // Derive a visibility proxy from df and base scaling so harness can register nonzero



      // even when meanTheta is very small due to averaging/quantization. Test-only.



      float proxy = (bandHits > 0.0)



        ? clamp(meanDf * abs(u_baseScale) * 2e-14, 0.0, 1.0)



        : 0.0;



      float thetaVis = max(meanTheta, proxy);



      testOut = vec4(vec3(thetaVis), 1.0);



    } else if (u_testMode == 7) {



      testOut = vec4(rayHit ? 1.0 : 0.0, 0.0, 0.0, rayHit ? 1.0 : 0.0);



    }



    outColor = testOut;



    outAux = vec4(auxThetaPeak, auxRhoMin, auxMixPeak, auxKijPeak);



    return;



  }



  if (u_probeMode != 0) {



    float coverage = sampleCount > 0.0 ? clamp(bandHits / sampleCount, 0.0, 1.0) : 0.0;



    float meanL = bandWeight > 1e-6 ? bandLuma / bandWeight : 0.0;



    outColor = vec4(vec3(meanL), coverage);



    outAux = vec4(auxThetaPeak, auxRhoMin, auxMixPeak, auxKijPeak);



    return;



  }







  outColor = vec4(accum.rgb, clamp(accum.a, 0.0, 1.0));



  outAux = vec4(auxThetaPeak, auxRhoMin, auxMixPeak, auxKijPeak);



}



`;







const POST_VS = RAYMARCH_VS;







const POST_FS = `#version 300 es



precision highp float;



precision highp sampler2D;







in vec2 v_ndc;



out vec4 outColor;







uniform sampler2D u_colorTex;



uniform sampler2D u_auxTex;



uniform sampler2D u_ringInstantTex;



uniform sampler2D u_ringAverageTex;



uniform sampler2D u_greensTex;







uniform vec2 u_resolution;



uniform float u_phase;







uniform int u_showKHeat;



uniform int u_kMode;



uniform float u_kGain;



uniform float u_kAlpha;







uniform int u_showThetaIso;



uniform float u_isoStep;



uniform float u_isoWidth;



uniform float u_isoOpacity;







uniform int u_showFR;



uniform float u_tauLC;



uniform float u_burst;



uniform float u_dwell;



uniform float u_frAlpha;



uniform int u_showRecLamp;







uniform int u_showSectorArc;



uniform float u_arcRadiusPx;



uniform float u_arcWidthPx;



uniform float u_arcGapPx;



uniform float u_arcInstantAlpha;



uniform float u_arcEmaAlpha;







uniform int u_showTilt;



uniform vec2 u_tiltDir;



uniform float u_tiltMag;



uniform float u_tiltAlpha;







uniform int u_showGreens;



uniform vec2 u_greensSizePx;



uniform vec2 u_greensOriginPx;



uniform vec2 u_greensRange;



uniform float u_greensAlpha;







const float INV_TAU = 0.15915494309189535;







float saturate(float v) {



  return clamp(v, 0.0, 1.0);



}







vec3 magma(float t) {



  float u = saturate(t);



  vec3 c0 = vec3(0.001, 0.000, 0.015);



  vec3 c1 = vec3(0.180, 0.062, 0.356);



  vec3 c2 = vec3(0.976, 0.983, 0.643);



  vec3 mid = mix(c0, c1, smoothstep(0.0, 0.6, u));



  return mix(mid, c2, smoothstep(0.4, 1.0, u));



}







vec3 diverge(float t) {



  float u = saturate(0.5 + 0.5 * t);



  vec3 cold = vec3(0.20, 0.42, 0.85);



  vec3 mid = vec3(0.92, 0.95, 0.96);



  vec3 warm = vec3(0.95, 0.52, 0.18);



  if (u < 0.5) {



    float f = u / 0.5;



    return mix(cold, mid, f);



  } else {



    float f = (u - 0.5) / 0.5;



    return mix(mid, warm, f);



  }



}







float strokeSegment(vec2 p, vec2 a, vec2 b, float halfWidth) {



  vec2 pa = p - a;



  vec2 ba = b - a;



  float len2 = dot(ba, ba);



  if (len2 < 1e-6) {



    return 0.0;



  }



  float h = clamp(dot(pa, ba) / len2, 0.0, 1.0);



  float dist = length(pa - ba * h);



  return 1.0 - smoothstep(halfWidth, halfWidth + 1.5, dist);



}







vec3 applyKHeat(vec3 baseColor, float theta, float kmix, float kij, int mode, float gain, float alpha) {



  float scalar = 0.0;



  if (mode == 0) {



    scalar = max(kij, 0.0);



  } else if (mode == 1) {



    scalar = max(theta * theta, 0.0);



  } else {



    scalar = abs(kmix);



  }



  float g = max(gain, 1e-3);



  float mapped = log(1.0 + scalar * g) / log(1.0 + g);



  mapped = saturate(mapped);



  vec3 heat = magma(mapped);



  float blend = saturate(alpha * mapped);



  return mix(baseColor, heat, blend);



}







vec3 applyThetaIso(vec3 baseColor, float theta, float stepSize, float width, float opacity, float phase) {



  float stepV = max(stepSize, 1e-12);



  float bands = abs(theta) / stepV + phase;



  float stripe = 1.0 - smoothstep(0.5 - width, 0.5 + width, fract(bands));



  float alpha = saturate(opacity * stripe);



  vec3 posColor = vec3(0.96, 0.98, 0.99);



  vec3 negColor = vec3(0.60, 0.78, 1.00);



  vec3 tone = theta >= 0.0 ? posColor : negColor;



  return mix(baseColor, tone, alpha);



}







void main() {



  vec2 uv = 0.5 * (v_ndc + 1.0);



  vec2 fragPx = uv * u_resolution;



  vec4 base = texture(u_colorTex, uv);



  vec4 aux = texture(u_auxTex, uv);



  float thetaPeak = aux.r;



  float kmixPeak = aux.b;



  float kijPeak = aux.a;







  vec3 color = base.rgb;



  float alphaOverlay = 0.0;







  if (u_showKHeat != 0 && u_kAlpha > 1e-4) {



    color = applyKHeat(color, thetaPeak, kmixPeak, kijPeak, u_kMode, u_kGain, u_kAlpha);



  }







  if (u_showThetaIso != 0 && u_isoOpacity > 1e-4) {



    float stripeWidth = max(u_isoWidth, 1e-4);



    color = applyThetaIso(color, thetaPeak, u_isoStep, stripeWidth, u_isoOpacity, u_phase);



  }







  if (u_showFR != 0 && u_frAlpha > 1e-4) {



    vec2 origin = vec2(24.0, 24.0);



    vec2 size = vec2(220.0, 26.0);



    vec2 pos = (fragPx - origin) / size;



    if (pos.x >= 0.0 && pos.x <= 1.0 && pos.y >= 0.0 && pos.y <= 1.0) {



      float tau = max(u_tauLC, 1e-9);



      float burstRatio = u_burst / tau;



      float dwellRatio = u_dwell / tau;



      bool burstOk = burstRatio <= 1.0 + 1e-3;



      bool dwellOk = dwellRatio >= 1.0 - 1e-3;



      vec3 frameOk = vec3(0.18, 0.78, 0.52);



      vec3 frameWarn = vec3(0.92, 0.47, 0.22);



      vec3 frame = (burstOk && dwellOk) ? frameOk : frameWarn;



      float border = smoothstep(0.0, 0.01, min(min(pos.x, pos.y), min(1.0 - pos.x, 1.0 - pos.y)));



      vec3 panel = mix(frame, vec3(0.05, 0.10, 0.16), border);



      float x = clamp(pos.x, 0.0, 1.0);



      float dwellFill = saturate(dwellRatio - x);



      float burstFill = saturate(burstRatio - x);



      panel = mix(panel, vec3(0.19, 0.78, 0.64), pow(dwellFill, 0.35));



      panel = mix(panel, vec3(0.95, 0.32, 0.24), pow(burstFill, 0.5));



      float tauLine = 1.0 - smoothstep(0.006, 0.012, abs(x - 1.0));



      panel = mix(panel, vec3(1.0), tauLine * 0.4);



      float blend = saturate(u_frAlpha);



      color = mix(color, panel, blend);



      alphaOverlay = max(alphaOverlay, blend);



    }



  }







  if (u_showSectorArc != 0 && (u_arcInstantAlpha > 1e-4 || u_arcEmaAlpha > 1e-4)) {



    float radius = max(u_arcRadiusPx, 6.0);



    vec2 centerPx = vec2(u_resolution.x - (radius + 40.0), radius + 40.0);



    vec2 delta = fragPx - centerPx;



    float dist = length(delta);



    if (dist > 1e-3) {



      float bandInstant = 1.0 - smoothstep(u_arcWidthPx, u_arcWidthPx + 2.0, abs(dist - radius));



      float innerRadius = max(radius - u_arcGapPx, 2.0);



      float bandEma = 1.0 - smoothstep(u_arcWidthPx, u_arcWidthPx + 2.0, abs(dist - innerRadius));



      if (bandInstant > 0.001 || bandEma > 0.001) {



        float a01 = fract(0.5 + atan(delta.y, delta.x) * INV_TAU);



        float instant = texture(u_ringInstantTex, vec2(a01, 0.5)).r;



        float ema = texture(u_ringAverageTex, vec2(a01, 0.5)).r;



        vec3 instColor = mix(vec3(0.12, 0.18, 0.28), vec3(0.98, 0.73, 0.28), saturate(pow(instant, 0.5)));



        vec3 emaColor = mix(vec3(0.12, 0.18, 0.28), vec3(0.22, 0.86, 0.74), saturate(pow(ema, 0.5)));



        float instAlpha = bandInstant * u_arcInstantAlpha * saturate(instant);



        float emaAlpha = bandEma * u_arcEmaAlpha * saturate(ema);



        color = mix(color, instColor, clamp(instAlpha, 0.0, 1.0));



        color = mix(color, emaColor, clamp(emaAlpha, 0.0, 1.0));



        alphaOverlay = max(alphaOverlay, max(instAlpha, emaAlpha));



      }



    }



  }







  if (u_showTilt != 0 && u_tiltAlpha > 1e-4 && length(u_tiltDir) > 1e-6 && u_tiltMag > 1e-5) {



    vec2 dir = normalize(u_tiltDir);



    float clampedMag = saturate(u_tiltMag);



    float radius = max(u_arcRadiusPx, 6.0);



    vec2 origin = vec2(u_resolution.x - (radius + 40.0), radius + 40.0);



    float lengthPx = 32.0 + 48.0 * clampedMag;



    vec2 tail = origin;



    vec2 tip = origin + dir * lengthPx;



    float body = strokeSegment(fragPx, tail, tip, 1.4);



    vec2 perp = vec2(-dir.y, dir.x);



    vec2 headA = tip - dir * 8.0 + perp * 6.0;



    vec2 headB = tip - dir * 8.0 - perp * 6.0;



    float head = max(strokeSegment(fragPx, tip, headA, 1.6), strokeSegment(fragPx, tip, headB, 1.6));



    float arrow = max(body, head);



    vec3 tiltColor = mix(vec3(0.28, 0.42, 0.96), vec3(0.92, 0.96, 0.68), clampedMag);



    float blend = clamp(arrow * u_tiltAlpha, 0.0, 1.0);



    color = mix(color, tiltColor, blend);



    alphaOverlay = max(alphaOverlay, blend);



  }







  if (u_showGreens != 0 && u_greensAlpha > 1e-4 && u_greensSizePx.x > 4.0 && u_greensSizePx.y > 4.0) {



    vec2 pos = (fragPx - u_greensOriginPx) / u_greensSizePx;



    if (pos.x >= 0.0 && pos.x <= 1.0 && pos.y >= 0.0 && pos.y <= 1.0) {



      vec2 sampleUV = vec2(pos.x, 1.0 - pos.y);



      float phi = texture(u_greensTex, sampleUV).r;



      float denom = max(u_greensRange.y - u_greensRange.x, 1e-9);



      float normalized = (phi - u_greensRange.x) / denom;



      float centered = clamp(normalized * 2.0 - 1.0, -1.0, 1.0);



      vec3 panel = diverge(centered);



      float contour = 1.0 - smoothstep(0.45, 0.55, abs(fract(normalized * 10.0) - 0.5));



      panel = mix(panel, vec3(1.0), contour * 0.12);



      float border = smoothstep(0.0, 0.01, min(min(pos.x, pos.y), min(1.0 - pos.x, 1.0 - pos.y)));



      panel = mix(panel, vec3(0.05, 0.10, 0.16), border);



      float blend = saturate(u_greensAlpha);



      color = mix(color, panel, blend);



      alphaOverlay = max(alphaOverlay, blend);



    }



  }







  if (u_showRecLamp != 0 && u_tauLC > 1e-6 && u_burst > 0.0) {



    float tau = max(u_tauLC, 1e-6);



    bool pass = (u_burst >= tau);



    vec2 lampUv = fragPx / u_resolution;



    float lampX = 1.0 - smoothstep(0.05, 0.08, lampUv.x);



    float lampY = smoothstep(0.92, 0.98, lampUv.y);



    float lamp = lampX * lampY;



    if (lamp > 0.001) {



      vec3 lampColor = pass ? vec3(0.18, 0.82, 0.54) : vec3(1.0, 0.70, 0.30);



      color = mix(color, lampColor, clamp(lamp, 0.0, 1.0));



      alphaOverlay = max(alphaOverlay, lamp * 0.65);



    }



  }







  float finalAlpha = max(base.a, saturate(alphaOverlay));



  outColor = vec4(color, finalAlpha);



}



`;







const RING_OVERLAY_VS = `#version 300 es

layout(location=0) in vec3 a_pos;

layout(location=1) in vec2 a_data;



uniform mat4 u_mvp;



out vec3 v_world;

out float v_theta01;

out float v_radial01;

out vec2 v_ndc;



void main() {

  v_world = a_pos;

  v_theta01 = fract(a_data.x);

  v_radial01 = clamp(a_data.y, 0.0, 1.0);

  vec4 clip = u_mvp * vec4(a_pos, 1.0);

  gl_Position = clip;

  v_ndc = clip.xy / max(clip.w, 1e-6);

}

`;



const RING_OVERLAY_FS = `#version 300 es

precision highp float;

precision highp sampler2D;



in vec3 v_world;

in float v_theta01;

in float v_radial01;

in vec2 v_ndc;



out vec4 outColor;



uniform vec3 u_baseColor;

uniform float u_baseAlpha;

uniform int u_mode;

uniform sampler2D u_ringAvg;

uniform sampler2D u_ringInst;

uniform sampler2D u_radialLUT;

uniform float u_ringBlend;

uniform float u_phaseSign;

uniform float u_phase01;

uniform int u_showPhaseTracer;

uniform vec3 u_axes;

uniform float u_R;

uniform float u_dfdrMax;



vec3 diverge(float t) {

  vec3 c1 = vec3(0.06, 0.25, 0.98);

  vec3 c2 = vec3(0.95);

  vec3 c3 = vec3(0.95, 0.30, 0.08);

  float x = clamp(t, 0.0, 1.0);

  return (x < 0.5)

    ? mix(c1, c2, x / 0.5)

    : mix(c2, c3, (x - 0.5) / 0.5);

}



float smoothBelt(float radial) {

  float inner = smoothstep(0.0, 0.12, radial);

  float outer = 1.0 - smoothstep(0.88, 1.0, radial);

  return clamp(inner * outer, 0.0, 1.0);

}



float shellBandWeight(float dfNorm, float radial) {

  float inner = smoothstep(0.0, 0.18, radial) * (1.0 - smoothstep(0.25, 0.4, radial));

  float outer = smoothstep(0.6, 0.8, radial) * (1.0 - smoothstep(0.9, 1.0, radial));

  float dfWeight = smoothstep(0.25, 0.6, dfNorm);

  return max(inner, outer) * dfWeight;

}



float sampleRing(sampler2D tex, float coord) {

  return texture(tex, vec2(fract(coord), 0.5)).r;

}



void main() {

  float belt = smoothBelt(v_radial01);

  float alpha = u_baseAlpha * belt;

  vec3 color = u_baseColor;



  if (u_mode == 1) {

    float blend = clamp(u_ringBlend, 0.0, 1.0);

    float wAvg = sampleRing(u_ringAvg, v_theta01);

    float wInst = sampleRing(u_ringInst, fract(v_theta01 + u_phaseSign * u_phase01));

    float wMix = clamp(mix(wAvg, wInst, blend), 0.0, 1.0);

    color = diverge(wMix);

    alpha = max(alpha, belt * (0.35 + 0.45 * wMix));

  } else if (u_mode == 2) {

    vec3 axesSafe = max(abs(u_axes), vec3(1e-5));

    float rMetric = length(vec3(

      v_world.x / (axesSafe.x * max(u_R, 1e-5)),

      v_world.y / (axesSafe.y * max(u_R, 1e-5)),

      v_world.z / (axesSafe.z * max(u_R, 1e-5))

    ));

    float df = texture(u_radialLUT, vec2(clamp(rMetric, 0.0, 1.0), 0.5)).r;

    float dfNorm = clamp(abs(df) / max(u_dfdrMax, 1e-6), 0.0, 1.0);

    float band = shellBandWeight(dfNorm, v_radial01);

    if (band > 0.0) {

      vec3 bandColor = mix(vec3(0.18, 0.78, 1.0), vec3(1.0, 0.58, 0.24), 0.55);

      color = mix(color, bandColor, clamp(band, 0.0, 1.0));

      alpha = max(alpha, belt * (0.25 + 0.6 * band));

    }

  }



  if (u_showPhaseTracer != 0 && u_phase01 >= 0.0) {

    float phase = fract(u_phaseSign >= 0.0 ? u_phase01 : (1.0 - u_phase01));

    float delta = abs(v_theta01 - phase);

    float dtheta = min(delta, 1.0 - delta);

    float tracer = smoothstep(0.06, 0.0, dtheta) * belt;

    vec3 tracerColor = vec3(1.0, 0.95, 0.82);

    color = mix(color, tracerColor, tracer);

    alpha = max(alpha, 0.35 * tracer);

  }



  outColor = vec4(color, clamp(alpha, 0.0, 1.0));

  if (outColor.a <= 0.001) discard;

}

`;



const OVERLAY_VS = `#version 300 es



layout(location=0) in vec3 a_pos;



uniform mat4 u_mvp;



uniform float u_alpha;



out float v_alpha;



void main() {



  v_alpha = u_alpha;



  gl_Position = u_mvp * vec4(a_pos, 1.0);



}



`;







const OVERLAY_FS = `#version 300 es



precision highp float;



in float v_alpha;



uniform vec3 u_color;



out vec4 outColor;



void main() {



  outColor = vec4(u_color, v_alpha);



}



`;







// 2D Surface overlay pass (ported from AlcubierrePanel.tsx VERT/FRAG, with alpha uniform)



const SURFACE_OVERLAY_VS = `#version 300 es



layout(location=0) in vec2 a_pos;      // unit grid on x-z plane in [-1,1]^2



uniform vec3  u_axes;                   // hull axes scale (a,b,c) -> x,y,z



uniform float u_sigma;                  // wall thickness sigma



uniform float u_R;                      // bubble radius R



uniform float u_beta;                   // ship beta along +x



uniform int   u_viz;                    // 0 theta_GR, 1 rho_GR, 2 theta_Drive



uniform float u_ampChain;               // gamma_geo^3 * q * gamma_VdB



uniform float u_gate;                   // sqrt(d_FR) * (sector visibility)



uniform float u_gate_view;



uniform float u_duty;                   // Ford-Roman duty factor



uniform float u_yGain;                  // height scale (viewer)



uniform float u_yBias;                  // baseline shift (viewer)



uniform float u_kColor;                 // color scale (viewer)



uniform mat4  u_mvp;



uniform int   u_totalSectors;           // total sectors around bubble



uniform int   u_liveSectors;            // concurrently active sectors



uniform float u_lumpExp;                // contrast exponent for sector gating



uniform float u_sectorCenter;           // scheduler-driven azimuth center (0..1)



uniform float u_sectorSigma;            // Gaussian sigma in normalized azimuth units



uniform float u_sectorFloor;            // baseline fraction to keep shell visible



uniform int   u_syncMode;               // 1=scheduler sync, 0=fallback contiguous



uniform float u_phase01;                // additional phase offset in [0,1) to rotate sector gating



uniform int   u_splitEnabled;           // 1 to enable secondary lobe at +0.5



uniform float u_splitFrac;              // weight of primary lobe (0..1)



uniform float u_vizFloorThetaGR;



uniform float u_vizFloorRhoGR;



uniform float u_vizFloorThetaDrive;







out vec3 v_color;



out vec2 v_uv;



out vec3 v_normalWS;







const float TWO_PI = 6.283185307179586;







float cosh_exp(float x){



  float ex = exp(x);



  float ex_inv = exp(-x);



  return 0.5 * (ex + ex_inv);



}







float tanh_exp(float x){



  float ex = exp(x);



  float ex_inv = exp(-x);



  float denom = max(ex + ex_inv, 1e-6);



  return (ex - ex_inv) / denom;



}







float sech2(float x){



  float c = cosh_exp(x);



  return 1.0 / max(c * c, 1e-6);



}







float d_topHat_dr(float r, float sigma, float R) {



  float den = max(1e-6, 2.0 * tanh_exp(sigma * R));



  return sigma * (sech2(sigma*(r+R)) - sech2(sigma*(r-R))) / den;



}







vec3 diverge(float x) {



  vec3 c1 = vec3(0.06,0.25,0.98);



  vec3 c2 = vec3(0.94,0.94,0.95);



  vec3 c3 = vec3(0.95,0.30,0.08);



  float t = clamp(0.5 + 0.5*x, 0.0, 1.0);



  return (t < 0.5) ? mix(c1,c2,t/0.5) : mix(c2,c3,(t-0.5)/0.5);



}







vec3 purpleMap(float s){



  float t = clamp(-s, 0.0, 1.0);



  vec3 base = vec3(0.92,0.92,0.98);



  vec3 purp = vec3(0.58,0.25,0.93);



  return mix(base, purp, t);



}







void main(){



  float domainScale = u_R * 1.3;



  vec2 grid = a_pos;



  vec3 pView = vec3(grid.x * u_axes.x * domainScale, 0.0, grid.y * u_axes.z * domainScale);



  vec3 pMetric = vec3(



    pView.x / max(u_axes.x, 1e-6),



    0.0,



    pView.z / max(u_axes.z, 1e-6)



  );



  float rs = max(length(pMetric), 1e-6);







  float dfdr = d_topHat_dr(rs, u_sigma, u_R);



  vec3 dir = pMetric / rs;



  float dfx = dfdr * dir.x;



  float dfy = dfdr * dir.y;



  float dfz = dfdr * dir.z;







  float theta_gr = u_beta * dfx;







  float Kxx = -u_beta * dfx;



  float Kxy = -0.5 * u_beta * dfy;



  float Kxz = -0.5 * u_beta * dfz;



  float K2 = Kxx*Kxx;



  float KijKij = Kxx*Kxx + 2.0*Kxy*Kxy + 2.0*Kxz*Kxz;



  const float INV16PI = 0.019894367886486918;



  float rho_gr = (K2 - KijKij) * INV16PI;







  float gateWF = 1.0;



  if (u_viz == 2) {



    float ang = atan(pView.z, pView.x);



    float a01 = (ang < 0.0 ? ang + TWO_PI : ang) / TWO_PI;



    a01 = fract(a01 + u_phase01);



    int total = max(1, u_totalSectors);



    int live  = max(1, min(u_liveSectors, total));



    float fActive = max(max(1.0/float(total), float(live) / float(total)), max(0.0, u_duty));



    float floorFrac = clamp(u_sectorFloor, 0.0, 0.99);



    float peakFrac  = 1.0 - floorFrac;



    float wNorm = 1.0;



    if (u_syncMode == 1) {



      float center = u_sectorCenter - floor(u_sectorCenter);



      float sigma01 = max(1e-4, u_sectorSigma);



      float dist = abs(a01 - center);



      dist = min(dist, 1.0 - dist);



      float g1 = exp(-0.5 * (dist * dist) / (sigma01 * sigma01));



      float g = g1;



      if (u_splitEnabled == 1) {



        float center2 = fract(center + 0.5);



        float dist2 = abs(a01 - center2);



        dist2 = min(dist2, 1.0 - dist2);



        float g2 = exp(-0.5 * (dist2 * dist2) / (sigma01 * sigma01));



        float wA = clamp(u_splitFrac, 0.0, 1.0);



        g = g1 * wA + g2 * (1.0 - wA);



      }



      float avgG = min(1.0, sigma01 * 2.5066283);



      float gNorm = min(g / max(avgG, 1e-4), 12.0);



      wNorm = floorFrac + peakFrac * gNorm;



    } else {



      int sIdx = int(floor(a01 * float(total)));



      float on = (sIdx < live) ? 1.0 : 0.0;



      float frac = max(1.0/float(total), float(live) / float(total));



      float norm = (frac > 1e-9) ? min(on / frac, 12.0) : on;



      wNorm = floorFrac + peakFrac * norm;



    }



    gateWF = pow(sqrt(max(0.0, wNorm)), max(0.5, u_lumpExp));



  }



  float theta_drive = theta_gr * u_ampChain * u_gate_view * gateWF;







  float s_raw = (u_viz == 0) ? theta_gr : ((u_viz == 1) ? rho_gr : theta_drive);



  float floorV = (u_viz == 0) ? u_vizFloorThetaGR : ((u_viz == 1) ? u_vizFloorRhoGR : u_vizFloorThetaDrive);



  float s = s_raw;



  if (floorV > 0.0) {



    float mag = abs(s_raw);



    if (mag < floorV) {



      s = (s_raw < 0.0) ? -floorV : floorV;



    }



  }







  float y = (s - u_yBias) * u_yGain;



  vec4 pos = vec4(pView.x, y, pView.z, 1.0);



  gl_Position = u_mvp * pos;







  float c = s * u_kColor;



  if (u_viz == 1){



    v_color = purpleMap(c);



  } else {



    v_color = diverge(clamp(c, -1.0, 1.0));



  }



  v_uv = a_pos * 0.5 + 0.5;



  vec3 normalWS = (rs > 1e-6) ? normalize(vec3(dir.x, dir.y, dir.z)) : vec3(0.0, 1.0, 0.0);



  v_normalWS = normalWS;



}



`;







const SURFACE_OVERLAY_FS = `#version 300 es



precision highp float;



in vec3 v_color;



in vec2 v_uv;



in vec3 v_normalWS;



uniform float u_alpha;



out vec4 outColor;



void main(){



  outColor = vec4(v_color, clamp(u_alpha, 0.0, 1.0));



}



`;







const SURFACE_BETA_OVERLAY_FS = `#version 300 es



precision highp float;



in vec2 v_uv;



in vec3 v_normalWS;



uniform sampler2D uBetaTex;



uniform float uBetaTarget;



uniform float uComfort;



uniform vec3  uHullDims;



uniform float uAlpha;



out vec4 outColor;







vec3 hsv2rgb(vec3 c){



  vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0);



  return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);



}







float sampleBeta(vec2 uv){



  return texture(uBetaTex, uv).r;



}







void main(){



  ivec2 texSize = textureSize(uBetaTex, 0);



  vec2 texel = vec2(1.0) / max(vec2(texSize), vec2(1.0));



  float beta = sampleBeta(v_uv);



  float bx = sampleBeta(v_uv + vec2(texel.x, 0.0)) - beta;



  float by = sampleBeta(v_uv + vec2(0.0, texel.y)) - beta;



  float grad = length(vec2(bx, by));



  float hullScale = max(max(uHullDims.x, uHullDims.y), uHullDims.z);



  if (hullScale > 1e-5) {



    grad *= hullScale;



  }







  float comfortSafe = max(uComfort, 1e-5);



  float targetSafe = max(uBetaTarget, 1e-5);



  vec3 normal = normalize(v_normalWS);



  float bowStern = sign(dot(normal, vec3(0.0, 0.0, 1.0)));



  float hue = 0.62 + 0.18 * bowStern;



  float sat = clamp(grad / comfortSafe, 0.0, 1.0);



  float val = clamp(beta / targetSafe, 0.3, 1.0);



  vec3 base = hsv2rgb(vec3(hue, sat, val));







  const float G = 9.80665;



  float contour = abs(fract(beta / (0.05 * G)) - 0.5) * 2.0;



  float line = smoothstep(0.0, 0.05, contour);



  vec3 col = mix(base, vec3(1.0), pow(1.0 - line, 12.0));







  float redIso = smoothstep(0.0, 0.03, abs(grad - 0.4 * G));



  col = mix(col, vec3(1.0, 0.0, 0.1), pow(redIso, 10.0));







  outColor = vec4(col, clamp(uAlpha, 0.0, 1.0));



}



`;







const WHITE_TEST_VS = `#version 300 es



layout(location=0) in vec2 a_pos;



void main() {



  gl_Position = vec4(a_pos, 0.0, 1.0);



}



`;







const WHITE_TEST_FS = `#version 300 es



precision highp float;



out vec4 outColor;



void main() {



  outColor = vec4(1.0);



}



`;







const WIREFRAME_COLOR = new Float32Array([0.1, 0.7, 0.9]);







type RendererResources = {



  rayProgram: WebGLProgram | null;



  ringOverlayProgram: WebGLProgram | null;



  overlayProgram: WebGLProgram | null;



  postProgram: WebGLProgram | null;



  quadVao: WebGLVertexArrayObject | null;



  quadVbo: WebGLBuffer | null;



  ringAvgTex: WebGLTexture | null;



  rayFbo: WebGLFramebuffer | null;



  rayColorTex: WebGLTexture | null;



  rayAuxTex: WebGLTexture | null;



};







type RayUniformParams = {



  densityScale: number;



  stepBias: number;



  maxSteps: number;



  cameraEye: Vec3;



  invViewProj: Float32Array;



  phaseSign: number;



  phase01: number;



  invR: number;



  timeSec: number;



  blend: number;



  fActive: number;



  baseScale: number;



  sigma: number;



  volumeVizIndex: 0 | 1 | 2;



  grThetaGain: number;



  grRhoGain: number;



  forceFlatGate?: boolean;



  debugMode?: number;



  probeMode?: number;



  probeGain?: number;



  testMode?: number;



};







type HullTestResult = {



  luma: number;



  alpha: number;



  pass: boolean;



};







export class Hull3DRenderer {



  private gl: WebGL2RenderingContext;



  private canvas: HTMLCanvasElement;



  private options: Hull3DRendererOptions;



  private mode: Hull3DRendererMode = "instant";



  private qualityPreset: Hull3DQualityPreset;



  private qualityProfile: QualityProfile;



  private emaAlpha: number;



  private domainScale = DEFAULT_DOMAIN_SCALE;



  private volumeViz: Hull3DVolumeViz = "theta_drive";



  private volumeVizBusId: string | null = null;

  private overlay3D: Overlay3DState = {
    mode: 1,
    mix: 0.5,
    alpha: 0.65,
    thick: 0.02,
    gain: 1.0,
    hue: 0.6,
    phase01: 0,
  };

  private overlay3DBusId: string | null = null;



  private overlayPingBusId: string | null = null;



  private curvatureBusId: string | null = null;



  private phaseStableBusId: string | null = null;



  private phaseLegacyBusId: string | null = null;



  private phaseFeedActive = false;



  private phaseSourceActive = false;



  private phaseTarget = 0;



  private phaseUnwrapped = 0;



  private phaseState: {
    phase01: number;
    phaseCont: number;
    sign: 1 | -1;
    velocity: number;
    lastAtMs: number;
  } = {
    phase01: 0,
    phaseCont: 0,
    sign: 1,
    velocity: 0,
    lastAtMs: 0,
  };



  private uniformCache = new UniformCache();







  private radialLUT: Float32Array = new Float32Array(RADIAL_SIZE);



  private radialMetricR = RADIAL_METRIC_RADIUS;



  private radialMaxR = RADIAL_SAMPLE_R_MAX;



  private radialScale = RADIAL_LUT_SCALE;



  private radialDfMax = 1;



  private ringInstantLUT: Float32Array = new Float32Array(RING_SIZE);



  private ringAverageLUT: Float32Array = new Float32Array(RING_SIZE);







  private radialTex: WebGLTexture | null = null;



  private ringInstantTex: WebGLTexture | null = null;



  private ringAverageTex: WebGLTexture | null = null;



  private radialTexAllocated = false;



  private ringInstantTexAllocated = false;



  private ringAverageTexAllocated = false;



  private volumeTex: WebGLTexture | null = null;



  private dummyVolumeTex: WebGLTexture | null = null;



  private curvature = {



    texA: null as WebGLTexture | null,



    texB: null as WebGLTexture | null,



    fallback: null as WebGLTexture | null,



    front: 0 as 0 | 1,



    dims: [1, 1, 1] as [number, number, number],



    version: 0,



    updatedAt: 0,



    hasData: false,



    emaResidual: new Float32Array(0),



  };



  private fallbackTex2D: WebGLTexture | null = null;



  private rayTargetSize: [number, number] = [0, 0];



  private rayAuxInternalFormat = 0;



  private rayAuxType = 0;



  private supportsColorFloat = false;











  private dims: [number, number, number];



  private state: Hull3DRendererState | null = null;



  private lastVolumeKey = "";



  private lastRingKey = "";



  private lastRadialKey = "";



  private freezeVolume = false;



  private skipVolumeUpdate = false;



  private hasVolume = false;



  private lastAvgUpdate = 0;



  private ringAvgSeeded = false;



  private ringLastStats: RingLUTStats | null = null;



  private phaseSignEffective = 1;



  private autoFlatGate = false;







  private resources: RendererResources = {



    rayProgram: null,



    ringOverlayProgram: null,



    overlayProgram: null,



    postProgram: null,



    quadVao: null,



    quadVbo: null,



    ringAvgTex: null,



    rayFbo: null,



    rayColorTex: null,



    rayAuxTex: null,



  };



  private harnessWhiteProgram: WebGLProgram | null = null;







  // 2D surface overlay resources



  private surfaceProgram: WebGLProgram | null = null;



  private surfaceVao: WebGLVertexArrayObject | null = null;



  private surfaceVbo: WebGLBuffer | null = null;



  private surfaceRes = 64; // grid resolution (matches panel’s intent but lighter)



  private surfaceVertsPerRow = 0;



  private surfaceRows = 0;



  private betaOverlayProgram: WebGLProgram | null = null;



  private betaOverlayUniforms: {



    u_axes: WebGLUniformLocation | null;



    u_sigma: WebGLUniformLocation | null;



    u_R: WebGLUniformLocation | null;



    u_beta: WebGLUniformLocation | null;



    u_viz: WebGLUniformLocation | null;



    u_ampChain: WebGLUniformLocation | null;



    u_gate: WebGLUniformLocation | null;



    u_gate_view: WebGLUniformLocation | null;



    u_duty: WebGLUniformLocation | null;



    u_yGain: WebGLUniformLocation | null;



    u_yBias: WebGLUniformLocation | null;



    u_kColor: WebGLUniformLocation | null;



    u_mvp: WebGLUniformLocation | null;



    u_totalSectors: WebGLUniformLocation | null;



    u_liveSectors: WebGLUniformLocation | null;



    u_lumpExp: WebGLUniformLocation | null;



    u_sectorCenter: WebGLUniformLocation | null;



    u_sectorSigma: WebGLUniformLocation | null;



    u_sectorFloor: WebGLUniformLocation | null;



    u_syncMode: WebGLUniformLocation | null;



    u_phase01: WebGLUniformLocation | null;



    u_splitEnabled: WebGLUniformLocation | null;



    u_splitFrac: WebGLUniformLocation | null;



    uBetaTex: WebGLUniformLocation | null;



    uBetaTarget: WebGLUniformLocation | null;



    uComfort: WebGLUniformLocation | null;



    uHullDims: WebGLUniformLocation | null;



    uAlpha: WebGLUniformLocation | null;



    u_vizFloorThetaGR: WebGLUniformLocation | null;



    u_vizFloorRhoGR: WebGLUniformLocation | null;



    u_vizFloorThetaDrive: WebGLUniformLocation | null;



  } | null = null;



  private betaFallbackTex: WebGLTexture | null = null;



  private betaFallbackValue = DEFAULT_BETA_TARGET;



  private derivedHullDims: [number, number, number] = [1, 1, 1];



  private betaTelemetryFrame = 0;



  private betaTelemetry: { maxGrad: number; redPct: number } = { maxGrad: 0, redPct: 0 };







  private overlay = {



    ringVao: null as WebGLVertexArrayObject | null,



    ringVbo: null as WebGLBuffer | null,



    ringVertexCount: 0,



    sliceVao: null as WebGLVertexArrayObject | null,



    sliceVbo: null as WebGLBuffer | null,



    sliceEbo: null as WebGLBuffer | null,



    wireframeVao: null as WebGLVertexArrayObject | null,



    wireframeVbo: null as WebGLBuffer | null,



    fallbackProgram: null as WebGLProgram | null,



  };



  private overlayCache = {



    ringKey: "",



    sliceKey: "",



    wireKey: "",



  };







  private framePerf = {



    lastFrameTime: performance.now(),



    movingAvg: 16,



  };



  private debugCounter = 0;



  private volumeStatsKey = "";



  // Diagnostics state machine + offscreen probe (decoupled from main pass)



  private diagnosticsEnabled = true; // Keep on by default to preserve auto-exposure behavior



  private diagHoldFrames = 90; // hold diagnostics overlay for ~1.5s at 60 FPS



  private frameCount = 0;



  private _diag: {



    state: 'idle'|'queueSample'|'sampling'|'holding';



    holdLeft: number;



    lastOk: boolean;



    lastLuma: number;



    lastCoverage: number;



    lastMode: 'ok'|'base_dark'|'gated_dark'|'both_dark';



    lowCount: number;



    okCount: number;



    message: string;



  } = {



    state: 'idle',



    holdLeft: 0,



    lastOk: true,



    lastLuma: 0,



    lastCoverage: 0,



    lastMode: 'ok',



    lowCount: 0,



    okCount: 0,



    message: "",



  };



  private diagSize = 64;



  private diagFBO: WebGLFramebuffer | null = null;



  private diagColorTex: WebGLTexture | null = null;



  private diagBuffer: Uint8Array | null = null;



  private diagCoverageGrace = 0.15;



  private diagBaseThreshold = 0.003;



  private diagGatedThreshold = 0.004;



  private diagTripFrames = 3;



  private diagClearFrames = 2;



  private diagProbeGainFactor = 1.6;



  private debugTapBuffer: Uint8Array | null = null;



  // Camera smoothing



  private camInit = false;



  private camYaw = 0;



  private camPitch = 0;



  private camDist = 10;



  private camSmoothing = 0.12;



  // Phase smoothing (to avoid ticking when phase updates at low rate)



  private phaseInit = false;



  private phaseCont = 0; // continuous phase in cycles (unwrapped)



  private phaseVel = 0;  // cycles per second



  private lastPhaseRaw = 0;



  private lastPhaseTime = 0;



  private lastTimeSec = 0;



  // Auto-exposure (only active when no explicit user exposure provided)



  private autoGain = 1.0;



  private autoGainMin = 0.1;



  private autoGainMax = 40.0;



  private autoSampleEvery = 900; // frames (reduced cadence to minimize stalls)



  private autoTargetLuma = 0.24; // target center-pixel luma [0..1]



  private autoAggressiveness = 0.15; // how quickly to adjust



  private lastDensityScale = 1.0;



  private fActiveResolved = 1.0;







  constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, options: Hull3DRendererOptions = {}) {



    this.gl = gl;



    this.canvas = canvas;



    this.options = options;



    this.qualityPreset = options.quality ?? "auto";



    this.emaAlpha = options.emaAlpha ?? DEFAULT_EMA_ALPHA;



    this.qualityProfile = this.resolveQualityProfile(this.qualityPreset, options.qualityOverrides);



    this.dims = [...this.qualityProfile.dims];



    this.initCoreResources();



    this.volumeVizBusId = subscribe("warp:viz", (payload: any) => {



      const v = Number(payload?.volumeViz);



      if (v === 0 || v === 1 || v === 2) {



        const next: Hull3DVolumeViz = v === 0 ? "theta_gr" : v === 1 ? "rho_gr" : "theta_drive";



        if (this.volumeViz !== next) {



          this.setVolumeViz(next);



        }



      }



    });

    this.overlay3DBusId = subscribe("hull3d:overlay", (payload: any) => {
      this.updateOverlay3D(payload);
    });

    this.overlayPingBusId = subscribe("hull3d:overlay:ping", () => {
      this.publishOverlayState();
    });



    this.curvatureBusId = subscribe("hull3d:curvature", (payload: any) => {
      this.handleCurvatureBrick(payload);
    });



    const handlePhase = (payload: any) => {



      const nowMs = typeof performance !== "undefined" ? performance.now() : Date.now();



      const phaseRaw = Number(payload?.phase01);



      if (!Number.isFinite(phaseRaw)) return;



      const contRaw = Number(payload?.phaseCont);



      const signRaw = Number(payload?.phaseSign);



      const normalized = wrapPhase01(phaseRaw);



      if (!this.phaseFeedActive) {



        this.phaseState.phase01 = normalized;



        this.phaseState.phaseCont = Number.isFinite(contRaw) ? contRaw : normalized;



        this.phaseState.sign = Number.isFinite(signRaw) && signRaw < 0 ? -1 : 1;



        this.phaseState.velocity = 0;



        this.phaseState.lastAtMs = nowMs;



        this.phaseFeedActive = true;



      } else {



        const dtSec = Math.max(1e-3, (nowMs - this.phaseState.lastAtMs) / 1000);



        let delta = 0;



        if (Number.isFinite(contRaw)) {



          delta = contRaw - this.phaseState.phaseCont;



          this.phaseState.phaseCont = contRaw;



          this.phaseState.phase01 = wrapPhase01(this.phaseState.phaseCont);



        } else {



          delta = shortestPhaseDelta(normalized, this.phaseState.phase01);



          this.phaseState.phaseCont += delta;



          this.phaseState.phase01 = wrapPhase01(this.phaseState.phaseCont);



        }



        const instVel = delta / dtSec;



        const clampedVel = Math.max(-4, Math.min(4, instVel));



        if (Number.isFinite(clampedVel)) {



          this.phaseState.velocity =



            this.phaseState.velocity + (clampedVel - this.phaseState.velocity) * 0.2;



        }



        if (Number.isFinite(signRaw) && signRaw !== 0) {



          this.phaseState.sign = signRaw > 0 ? 1 : -1;



        } else if (Math.abs(delta) > 1e-4) {



          this.phaseState.sign = delta >= 0 ? 1 : -1;



        }



        this.phaseState.lastAtMs = nowMs;



        this.phaseFeedActive = true;



      }



      if (this.state) {



        this.state.phase01 = this.phaseState.phase01;



        this.state.phaseSign = this.phaseState.sign;



      }



    };



    this.phaseStableBusId = subscribe("warp:phase:stable", handlePhase);



    this.phaseLegacyBusId = subscribe("warp:phase", handlePhase);



    if (typeof window !== "undefined") {



      const win = window as any;



      win.runHull3DHealthCheck = this.runHull3DHealthCheck.bind(this);



      win.__hullRenderer = this;



    }



  }







  private updateOverlay3D(payload: any) {
    if (!payload || typeof payload !== "object") {
      return;
    }
    const target = this.overlay3D;
    const modeRaw = (payload as any).mode;
    if (modeRaw !== undefined) {
      const m = Number(modeRaw);
      if (m === 0 || m === 1 || m === 2 || m === 3) {
        target.mode = m as 0 | 1 | 2 | 3;
      }
    }
    const mixRaw = (payload as any).mix;
    if (mixRaw !== undefined) {
      const v = Number(mixRaw);
      if (Number.isFinite(v)) {
        target.mix = Math.max(0, Math.min(1, v));
      }
    }
    const alphaRaw = (payload as any).alpha;
    if (alphaRaw !== undefined) {
      const v = Number(alphaRaw);
      if (Number.isFinite(v)) {
        target.alpha = Math.max(0, Math.min(1, v));
      }
    }
    const thickRaw = (payload as any).thick;
    if (thickRaw !== undefined) {
      const v = Number(thickRaw);
      if (Number.isFinite(v)) {
        target.thick = Math.max(0.001, Math.min(0.3, v));
      }
    }
    const gainRaw = (payload as any).gain;
    if (gainRaw !== undefined) {
      const v = Number(gainRaw);
      if (Number.isFinite(v)) {
        target.gain = Math.max(0, Math.min(12, v));
      }
    }
    const hueRaw = (payload as any).hue;
    if (hueRaw !== undefined) {
      const v = Number(hueRaw);
      if (Number.isFinite(v)) {
        const wrapped = v % 1;
        target.hue = wrapped < 0 ? wrapped + 1 : wrapped;
      }
    }
    const phaseRaw = (payload as any).phase01;
    if (phaseRaw !== undefined) {
      const v = Number(phaseRaw);
      if (Number.isFinite(v)) {
        const wrapped = v % 1;
        target.phase01 = wrapped < 0 ? wrapped + 1 : wrapped;
      }
    }
  }



  private publishOverlayState() {
    const overlayHue = this.overlay3D.hue;
    publish("hull3d:overlay", {
      mode: this.overlay3D.mode,
      mix: this.overlay3D.mix,
      alpha: this.overlay3D.alpha,
      thick: this.overlay3D.thick,
      gain: this.overlay3D.gain,
      hue: overlayHue,
      phase01: this.overlay3D.phase01,
    });
  }


  private resolveQualityProfile(preset: Hull3DQualityPreset, overrides?: Hull3DQualityOverrides): QualityProfile {



    const profile = preset === "auto" ? QUALITY_PROFILES.high : QUALITY_PROFILES[preset];



    let dims = profile.dims;



    if (overrides?.voxelDensity === "low") dims = QUALITY_PROFILES.low.dims;



    if (overrides?.voxelDensity === "medium") dims = QUALITY_PROFILES.medium.dims;



    if (overrides?.voxelDensity === "high") dims = QUALITY_PROFILES.high.dims;



    const maxSteps = overrides?.raySteps ? Math.max(16, overrides.raySteps) : profile.maxSteps;



    const stepBias = overrides?.stepBias ?? profile.stepBias;



    return { dims, maxSteps, stepBias };



  }







  private initCoreResources() {



    const { gl } = this;



    const extFloat = gl.getExtension("EXT_color_buffer_float");



    const extHalf = gl.getExtension("EXT_color_buffer_half_float");



    this.supportsColorFloat = !!(extFloat || extHalf);



    const quadVao = gl.createVertexArray();



    const quadVbo = gl.createBuffer();



    if (!quadVao || !quadVbo) throw new Error("Failed to allocate quad geometry");



    gl.bindVertexArray(quadVao);



    gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);



    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([



      -1, -1,



      1, -1,



      -1,  1,



      1,  1,



    ]), gl.STATIC_DRAW);



    gl.enableVertexAttribArray(0);



    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);



    gl.bindVertexArray(null);



    this.resources.quadVao = quadVao;



    this.resources.quadVbo = quadVbo;







    try {



      this.resources.rayProgram = linkProgram(gl, "Hull3D::raymarch", RAYMARCH_VS, RAYMARCH_FS);



    } catch (err) {



      console.error("[Hull3DRenderer] Raymarch shader failed; fallback will be used", err);



      this.resources.rayProgram = null;



    }



    try {



      this.resources.overlayProgram = linkProgram(gl, "Hull3D::overlay", OVERLAY_VS, OVERLAY_FS);



    } catch (err) {



      console.error("[Hull3DRenderer] Overlay shader failed", err);



      this.resources.overlayProgram = null;



    }



    try {



      this.resources.ringOverlayProgram = linkProgram(gl, "Hull3D::ringOverlay", RING_OVERLAY_VS, RING_OVERLAY_FS);



    } catch (err) {



      console.error("[Hull3DRenderer] Ring overlay shader failed", err);



      this.resources.ringOverlayProgram = null;



    }



    try {



      this.resources.postProgram = linkProgram(gl, "Hull3D::post", POST_VS, POST_FS);



    } catch (err) {



      console.error("[Hull3DRenderer] Post shader failed", err);



      this.resources.postProgram = null;



    }



    // Link 2D surface overlay program



    try {



      this.surfaceProgram = linkProgram(gl, "Hull3D::surfaceOverlay", SURFACE_OVERLAY_VS, SURFACE_OVERLAY_FS);



    } catch (err) {



      console.error("[Hull3DRenderer] Surface overlay shader failed", err);



      this.surfaceProgram = null;



    }



    try {



      this.betaOverlayProgram = linkProgram(gl, "Hull3D::betaOverlay", SURFACE_OVERLAY_VS, SURFACE_BETA_OVERLAY_FS);



      if (this.betaOverlayProgram) {



        const prog = this.betaOverlayProgram;



        this.betaOverlayUniforms = {



          u_axes: gl.getUniformLocation(prog, "u_axes"),



          u_sigma: gl.getUniformLocation(prog, "u_sigma"),



          u_R: gl.getUniformLocation(prog, "u_R"),



          u_beta: gl.getUniformLocation(prog, "u_beta"),



          u_viz: gl.getUniformLocation(prog, "u_viz"),



          u_ampChain: gl.getUniformLocation(prog, "u_ampChain"),



          u_gate: gl.getUniformLocation(prog, "u_gate"),



          u_gate_view: gl.getUniformLocation(prog, "u_gate_view"),



          u_duty: gl.getUniformLocation(prog, "u_duty"),



          u_yGain: gl.getUniformLocation(prog, "u_yGain"),



          u_yBias: gl.getUniformLocation(prog, "u_yBias"),



          u_kColor: gl.getUniformLocation(prog, "u_kColor"),



          u_mvp: gl.getUniformLocation(prog, "u_mvp"),



          u_totalSectors: gl.getUniformLocation(prog, "u_totalSectors"),



          u_liveSectors: gl.getUniformLocation(prog, "u_liveSectors"),



          u_lumpExp: gl.getUniformLocation(prog, "u_lumpExp"),



          u_sectorCenter: gl.getUniformLocation(prog, "u_sectorCenter"),



          u_sectorSigma: gl.getUniformLocation(prog, "u_sectorSigma"),



          u_sectorFloor: gl.getUniformLocation(prog, "u_sectorFloor"),



          u_syncMode: gl.getUniformLocation(prog, "u_syncMode"),



          u_phase01: gl.getUniformLocation(prog, "u_phase01"),



          u_splitEnabled: gl.getUniformLocation(prog, "u_splitEnabled"),



          u_splitFrac: gl.getUniformLocation(prog, "u_splitFrac"),



          uBetaTex: gl.getUniformLocation(prog, "uBetaTex"),



          uBetaTarget: gl.getUniformLocation(prog, "uBetaTarget"),



          uComfort: gl.getUniformLocation(prog, "uComfort"),



          uHullDims: gl.getUniformLocation(prog, "uHullDims"),



          uAlpha: gl.getUniformLocation(prog, "uAlpha"),



          u_vizFloorThetaGR: gl.getUniformLocation(prog, "u_vizFloorThetaGR"),



          u_vizFloorRhoGR: gl.getUniformLocation(prog, "u_vizFloorRhoGR"),



          u_vizFloorThetaDrive: gl.getUniformLocation(prog, "u_vizFloorThetaDrive"),



        };



      }



    } catch (err) {



      console.error("[Hull3DRenderer] Beta overlay shader failed", err);



      this.betaOverlayProgram = null;



      this.betaOverlayUniforms = null;



    }







    try {



      this.radialTex = createTexture2D(gl);



      this.ringInstantTex = createTexture2D(gl);



      this.ringAverageTex = createTexture2D(gl);



      this.radialTexAllocated = false;



      this.ringInstantTexAllocated = false;



      this.ringAverageTexAllocated = false;



      this.volumeTex = createTexture3D(gl);



      if (this.ringInstantTex) {



        gl.bindTexture(gl.TEXTURE_2D, this.ringInstantTex);



        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);



        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);



      }



      if (this.ringAverageTex) {



        gl.bindTexture(gl.TEXTURE_2D, this.ringAverageTex);



        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);



        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);



      }



      gl.bindTexture(gl.TEXTURE_2D, null);



    } catch (err) {



      console.error("[Hull3DRenderer] Texture allocation failed:", err);



      this.radialTex = this.ringInstantTex = this.ringAverageTex = this.volumeTex = null;



      this.radialTexAllocated = false;



      this.ringInstantTexAllocated = false;



      this.ringAverageTexAllocated = false;



    }



    this.resources.ringAvgTex = this.ringAverageTex;



  }







  setQuality(preset: Hull3DQualityPreset, overrides?: Hull3DQualityOverrides) {



    this.qualityPreset = preset;



    this.qualityProfile = this.resolveQualityProfile(preset, overrides ?? this.options.qualityOverrides);



    this.dims = [...this.qualityProfile.dims];



    this.lastVolumeKey = "";



  }







  setMode(mode: Hull3DRendererMode, blendFactor?: number) {



    this.mode = mode;



    if (blendFactor !== undefined && this.state) {



      this.state.blendFactor = clamp(blendFactor, 0, 1);



    }



  }







  update(state: Hull3DRendererState) {



    this.state = { ...state };



    if (!Number.isFinite(this.state.gateView)) {



      this.state.gateView = this.state.gate;



    }



    this.state.vizFloorThetaGR = Math.max(0, this.state.vizFloorThetaGR ?? 1e-9);



    this.state.vizFloorRhoGR = Math.max(0, this.state.vizFloorRhoGR ?? 1e-18);



    this.state.vizFloorThetaDrive = Math.max(0, this.state.vizFloorThetaDrive ?? 1e-6);



    const rawPhase = Number.isFinite(this.state.phase01) ? this.state.phase01 : 0;



    const wrappedPhase = rawPhase % 1;



    const fallbackPhase = clamp(wrappedPhase < 0 ? wrappedPhase + 1 : wrappedPhase, 0, 1);



    if (!this.phaseSourceActive || !Number.isFinite(this.phaseTarget)) {



      this.phaseUnwrapped = fallbackPhase;



      this.phaseTarget = fallbackPhase;



    }



    this.state.phase01 = this.phaseTarget;



    const nextState = this.state;



    this.volumeViz = this.resolveVolumeViz(nextState);



    const wantFreeze = nextState.freeze || nextState.bubbleStatus === "CRITICAL";



    const safeR = Math.max(nextState.R, 1e-3);



    this.domainScale = DEFAULT_DOMAIN_SCALE * safeR;



    this.freezeVolume = wantFreeze;



    this.skipVolumeUpdate = wantFreeze && this.hasVolume;



    this.updateRadialLUT(nextState);



    this.updateRingLUT(nextState);



    this.updateDerivedHullDims(nextState);



    if (!this.skipVolumeUpdate) {



      this.updateVolume(nextState);



    }



    if (!this.freezeVolume) {



      this.updateRingAverage(nextState);



    }



    this.ensureOverlayGeometry(nextState);



    this.ensureSurfaceGrid();



  }







  private updateRadialLUT(state: Hull3DRendererState) {



    // Build LUT in normalized metric space with R=1, and scale radius in shader by 1/R



    // This guarantees the wall stays within the LUT domain regardless of absolute R.



    const metricR = RADIAL_METRIC_RADIUS; // normalized radius = 1



    this.radialMetricR = metricR;



    const key = `${state.sigma.toFixed(6)}|${metricR.toFixed(6)}|${this.radialMaxR.toFixed(6)}`;



    if (key === this.lastRadialKey) return;



    this.radialScale = (RADIAL_SIZE - 1) / Math.max(this.radialMaxR, 1e-6);



    this.radialLUT = buildRadialLUT(state.sigma, metricR, this.radialMaxR);



    let maxDf = 1e-6;



    for (let i = 0; i < this.radialLUT.length; i++) {



      const v = Math.abs(this.radialLUT[i]);



      if (v > maxDf) maxDf = v;



    }



    this.radialDfMax = maxDf;



    this.lastRadialKey = key;



    if (this.radialTex) {



      const { gl } = this;



      gl.bindTexture(gl.TEXTURE_2D, this.radialTex);



      if (!this.radialTexAllocated) {



        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, RADIAL_SIZE, 1, 0, gl.RED, gl.FLOAT, null);



        this.radialTexAllocated = true;



      }



      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, RADIAL_SIZE, 1, gl.RED, gl.FLOAT, this.radialLUT);



      gl.bindTexture(gl.TEXTURE_2D, null);



    }



  }







  private buildRingKey(state: Hull3DRendererState) {



    const keys = [



      state.gaussianSigma,



      state.sectorCenter01,



      state.totalSectors,



      state.liveSectors,



      state.sectorFloor,



      state.lumpExp,



      state.syncMode,



      state.splitEnabled ? 1 : 0,



      state.splitFrac,



    ];



    return keys.map((x) => `${Math.round(x * 1e6)}`).join("|");



  }







  private updateRingLUT(state: Hull3DRendererState) {



    const key = this.buildRingKey(state);



    if (key === this.lastRingKey) {



      if (this.state && this.ringLastStats) {



        this.state.fActive = clamp(this.ringLastStats.rawMean, 1e-6, 1);



      }



      return;



    }



    const ring = buildRingLUT({



      gaussianSigma: state.gaussianSigma,



      sectorCenter01: state.sectorCenter01,



      totalSectors: state.totalSectors,



      liveSectors: state.liveSectors,



      sectorFloor: state.sectorFloor,



      syncMode: state.syncMode,



      splitEnabled: state.splitEnabled,



      splitFrac: state.splitFrac,



    });



    this.ringInstantLUT = ring.weights;



    this.ringLastStats = ring.stats;



    const coverageLow = ring.stats.rawMean <= 1e-4;



    this.autoFlatGate = coverageLow;



    const fActiveRaw = clamp(ring.stats.rawMean, 1e-6, 1);



    if (this.state) {



      this.state.fActive = fActiveRaw;



    }



    const dbgPhaseSign = (typeof window !== "undefined" && (window as any).__hullPhaseSign === -1) ? -1 : 1;



    const phaseSignEffective = (Math.sign(state.phaseSign ?? 1) || 1) * dbgPhaseSign;



    const logPayload = {



      meanW: Number(ring.stats.mean.toFixed(6)),



      meanRaw: Number(ring.stats.rawMean.toFixed(6)),



      minW: Number(ring.stats.min.toFixed(6)),



      maxW: Number(ring.stats.max.toFixed(6)),



      phaseSign: phaseSignEffective,



      center01: Number(ring.stats.center01.toFixed(6)),



      sigma01: Number(ring.stats.sigma01.toFixed(6)),



      floor: Number(ring.stats.floor.toFixed(6)),



      split: ring.stats.splitEnabled,



      splitFrac: Number(ring.stats.splitFrac.toFixed(6)),



      mode: ring.stats.mode,



      liveSectors: ring.stats.liveSectors,



      totalSectors: ring.stats.totalSectors,



      minFloor: ring.stats.minFloor,



    };



    if (ring.stats.warnings.length > 0) {



      ring.stats.warnings.forEach((msg) => console.warn(msg, logPayload));



    } else if (coverageLow) {



      console.warn("[Hull3DRenderer] ring coverage extremely low; forcing flat gate fallback", logPayload);



    } else {



      console.info("[Hull3DRenderer] ringLUT stats", logPayload);



    }



    this.phaseSignEffective = phaseSignEffective;



    this.lastRingKey = key;



    if (this.ringInstantTex) {



      const { gl } = this;



      gl.bindTexture(gl.TEXTURE_2D, this.ringInstantTex);



      if (!this.ringInstantTexAllocated) {



        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, RING_SIZE, 1, 0, gl.RED, gl.FLOAT, null);



        this.ringInstantTexAllocated = true;



      }



      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, RING_SIZE, 1, gl.RED, gl.FLOAT, this.ringInstantLUT);



      gl.bindTexture(gl.TEXTURE_2D, null);



    }



  }







  private buildVolumeKey(state: Hull3DRendererState) {



    const keys = [



      ...state.axes,



      state.R,



      state.sigma,



      this.dims[0],



      this.dims[1],



      this.dims[2],



    ];



    return keys.map((x) => `${Math.round(x * 1e5)}`).join("|");



  }







  private updateVolume(state: Hull3DRendererState) {



    // PERFORMANCE: shader is analytic via radial LUT; keep a tiny placeholder texture once.



    if (this.skipVolumeUpdate) return;



    if (this.hasVolume && this.lastVolumeKey === "ANALYTIC") return;



    if (this.volumeTex) {



      const { gl } = this;



      gl.bindTexture(gl.TEXTURE_3D, this.volumeTex);



      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);



      const data = new Float32Array([0]);



      gl.texImage3D(gl.TEXTURE_3D, 0, gl.R32F, 1, 1, 1, 0, gl.RED, gl.FLOAT, data);



      gl.bindTexture(gl.TEXTURE_3D, null);



    }



    this.lastVolumeKey = "ANALYTIC";



    this.hasVolume = true;



  }







  private updateRingAverage(state: Hull3DRendererState) {



    const now = performance.now();



    const sinceLast = this.lastAvgUpdate === 0 ? Number.POSITIVE_INFINITY : now - this.lastAvgUpdate;



    if (sinceLast < AVG_UPDATE_INTERVAL_MS) return;



    const dtMs = this.lastAvgUpdate === 0 ? AVG_UPDATE_INTERVAL_MS : sinceLast;



    this.lastAvgUpdate = now;



    const dbgPhaseSign = (typeof window !== "undefined" && (window as any).__hullPhaseSign === -1) ? -1 : 1;



    const phaseSign = (Math.sign(state.phaseSign ?? 1) || 1) * dbgPhaseSign;



    const rotated = rotateWeights(this.ringInstantLUT, phaseSign * state.phase01);



    if (!this.ringAvgSeeded) {



      // Seed average with the current rotated instant to avoid black frames in Average mode



      this.ringAverageLUT.set(rotated);



      this.ringAvgSeeded = true;



    } else {



      const safeAlpha = clamp(this.emaAlpha, 1e-4, 0.999);



      const denom = Math.max(1e-6, -Math.log1p(-safeAlpha));



      const baseTauMs = AVG_UPDATE_INTERVAL_MS / denom;



      const tauMs = baseTauMs * (this.mode === "instant" ? 2 : 1);



      const alpha = 1 - Math.exp(-dtMs / Math.max(1e-3, tauMs));



      const alphaClamped = clamp(alpha, 0, 1);



      for (let i = 0; i < this.ringAverageLUT.length; i++) {



        const prev = this.ringAverageLUT[i];



        const next = rotated[i];



        this.ringAverageLUT[i] = prev + (next - prev) * alphaClamped;



      }



    }



    if (this.ringAverageTex) {



      const { gl } = this;



      gl.bindTexture(gl.TEXTURE_2D, this.ringAverageTex);



      if (!this.ringAverageTexAllocated) {



        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, RING_SIZE, 1, 0, gl.RED, gl.FLOAT, null);



        this.ringAverageTexAllocated = true;



      }



      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, RING_SIZE, 1, gl.RED, gl.FLOAT, this.ringAverageLUT);



      gl.bindTexture(gl.TEXTURE_2D, null);



    }



  }







  private ensureOverlayGeometry(state: Hull3DRendererState) {



    const { gl } = this;



    const keyFrom = (...values: number[]) =>



      values.map((v) => Math.round((Number.isFinite(v) ? v : 0) * 1e4)).join("|");







    const ringKey = keyFrom(state.R, state.axes[0], state.axes[2]);



    if (this.overlayCache.ringKey !== ringKey) {



      if (this.overlay.ringVao) gl.deleteVertexArray(this.overlay.ringVao);



      if (this.overlay.ringVbo) gl.deleteBuffer(this.overlay.ringVbo);



      this.overlay.ringVao = null;



      this.overlay.ringVbo = null;







      this.overlay.ringVertexCount = 0;



      const segments = 256;



      const stride = 5;



      const vertexPairs = segments + 1;



      const vertexCount = vertexPairs * 2;



      const ringVerts = new Float32Array(vertexCount * stride);



      const radiusX = Math.max(Math.abs(state.axes[0]) * state.R, 1e-3);



      const radiusZ = Math.max(Math.abs(state.axes[2]) * state.R, 1e-3);



      const belt = 0.015;



      const outerScale = 1 + belt;



      const innerScale = Math.max(0.01, 1 - belt);



      const vao = gl.createVertexArray();



      const vbo = gl.createBuffer();



      if (vao && vbo) {



        for (let i = 0; i <= segments; i++) {



          const theta01 = i / segments;



          const angle = theta01 * TWO_PI;



          const cosT = Math.cos(angle);



          const sinT = Math.sin(angle);



          const outerBase = i * 2 * stride;



          const innerBase = outerBase + stride;



          ringVerts[outerBase + 0] = cosT * radiusX * outerScale;



          ringVerts[outerBase + 1] = 0;



          ringVerts[outerBase + 2] = sinT * radiusZ * outerScale;



          ringVerts[outerBase + 3] = theta01;



          ringVerts[outerBase + 4] = 1;



          ringVerts[innerBase + 0] = cosT * radiusX * innerScale;



          ringVerts[innerBase + 1] = 0;



          ringVerts[innerBase + 2] = sinT * radiusZ * innerScale;



          ringVerts[innerBase + 3] = theta01;



          ringVerts[innerBase + 4] = 0;



        }



        gl.bindVertexArray(vao);



        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);



        gl.bufferData(gl.ARRAY_BUFFER, ringVerts, gl.STATIC_DRAW);



        const strideBytes = stride * 4;



        gl.enableVertexAttribArray(0);



        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, strideBytes, 0);



        gl.enableVertexAttribArray(1);



        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, strideBytes, 3 * 4);



        gl.bindVertexArray(null);



        this.overlay.ringVao = vao;



        this.overlay.ringVbo = vbo;



        this.overlay.ringVertexCount = vertexCount;



        this.overlayCache.ringKey = ringKey;



      }



    }







    const sliceKey = keyFrom(state.R, state.axes[0], state.axes[2]);



    if (this.overlayCache.sliceKey !== sliceKey) {



      if (this.overlay.sliceVao) gl.deleteVertexArray(this.overlay.sliceVao);



      if (this.overlay.sliceVbo) gl.deleteBuffer(this.overlay.sliceVbo);



      if (this.overlay.sliceEbo) gl.deleteBuffer(this.overlay.sliceEbo);



      this.overlay.sliceVao = null;



      this.overlay.sliceVbo = null;



      this.overlay.sliceEbo = null;







      const w = Math.max(Math.abs(state.axes[0]) * state.R, 1e-3) * 1.1;



      const h = Math.max(Math.abs(state.axes[2]) * state.R, 1e-3) * 1.1;



      const verts = new Float32Array([



        -w, 0, -h,



         w, 0, -h,



         w, 0,  h,



        -w, 0,  h,



      ]);



      const idx = new Uint16Array([0, 1, 2, 0, 2, 3]);



      const vao = gl.createVertexArray();



      const vbo = gl.createBuffer();



      const ebo = gl.createBuffer();



      if (vao && vbo && ebo) {



        gl.bindVertexArray(vao);



        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);



        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);



        gl.enableVertexAttribArray(0);



        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);



        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);



        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);



        gl.bindVertexArray(null);



        this.overlay.sliceVao = vao;



        this.overlay.sliceVbo = vbo;



        this.overlay.sliceEbo = ebo;



        this.overlayCache.sliceKey = sliceKey;



      }



    }







    const wireKey = keyFrom(state.R, state.axes[0], state.axes[1], state.axes[2]);



    if (this.overlayCache.wireKey !== wireKey) {



      if (this.overlay.wireframeVao) gl.deleteVertexArray(this.overlay.wireframeVao);



      if (this.overlay.wireframeVbo) gl.deleteBuffer(this.overlay.wireframeVbo);



      this.overlay.wireframeVao = null;



      this.overlay.wireframeVbo = null;







      const segments = 96;



      const verts = new Float32Array(segments * 6);



      const ax = Math.max(Math.abs(state.axes[0]) * state.R, 1e-3);



      const az = Math.max(Math.abs(state.axes[2]) * state.R, 1e-3);



      for (let i = 0; i < segments; i++) {



        const t = (i / segments) * TWO_PI;



        const n = ((i + 1) % segments) / segments * TWO_PI;



        const base = i * 6;



        verts[base + 0] = ax * Math.cos(t);



        verts[base + 1] = 0;



        verts[base + 2] = az * Math.sin(t);



        verts[base + 3] = ax * Math.cos(n);



        verts[base + 4] = 0;



        verts[base + 5] = az * Math.sin(n);



      }



      const vao = gl.createVertexArray();



      const vbo = gl.createBuffer();



      if (vao && vbo) {



        gl.bindVertexArray(vao);



        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);



        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);



        gl.enableVertexAttribArray(0);



        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);



        gl.bindVertexArray(null);



        this.overlay.wireframeVao = vao;



        this.overlay.wireframeVbo = vbo;



        this.overlayCache.wireKey = wireKey;



      }



    }



  }







  private ensureSurfaceGrid() {



    const { gl } = this;



    if (this.surfaceVao && this.surfaceVbo && this.surfaceRows > 0 && this.surfaceVertsPerRow > 0) return;



    const res = this.surfaceRes;



    const verts: number[] = [];



    // Degenerate triangle strips per row in [-1,1]^2



    for (let j = 0; j < res - 1; j++) {



      const v0 = -1 + (2 * j) / (res - 1);



      const v1 = -1 + (2 * (j + 1)) / (res - 1);



      for (let i = 0; i < res; i++) {



        const u = -1 + (2 * i) / (res - 1);



        verts.push(u, v0, u, v1);



      }



    }



    const data = new Float32Array(verts);



    const vao = gl.createVertexArray();



    const vbo = gl.createBuffer();



    if (!vao || !vbo) return;



    gl.bindVertexArray(vao);



    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);



    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);



    gl.enableVertexAttribArray(0);



    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);



    gl.bindVertexArray(null);



    this.surfaceVao = vao;



    this.surfaceVbo = vbo;



    this.surfaceRows = res - 1;



    this.surfaceVertsPerRow = res * 2;



  }







  private drawSurfaceGridGeometry(gl: WebGL2RenderingContext) {



    if (!this.surfaceVao) return;



    const rows = this.surfaceRows;



    const vpr = this.surfaceVertsPerRow;



    gl.bindVertexArray(this.surfaceVao);



    for (let row = 0; row < rows; row++) {



      const off = row * vpr;



      gl.drawArrays(gl.TRIANGLE_STRIP, off, vpr);



    }



    gl.bindVertexArray(null);



  }







  private ensureBetaFallbackTexture(betaMs2: number): WebGLTexture | null {



    const { gl } = this;



    if (!this.betaFallbackTex) {



      this.betaFallbackTex = gl.createTexture();



      if (!this.betaFallbackTex) return null;



      gl.bindTexture(gl.TEXTURE_2D, this.betaFallbackTex);



      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);



      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);



      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);



      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);



    } else {



      gl.bindTexture(gl.TEXTURE_2D, this.betaFallbackTex);



    }



    const valueSafe = Number.isFinite(betaMs2) ? betaMs2 : DEFAULT_BETA_TARGET;



    if (Math.abs(this.betaFallbackValue - valueSafe) > 1e-3) {



      const data = new Float32Array([valueSafe, 0, 0, 1]);



      let uploaded = false;



      try {



        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 1, 1, 0, gl.RGBA, gl.FLOAT, data);



        uploaded = true;



      } catch {



        /* fall through to RGBA8 */



      }



      if (!uploaded) {



        const clamped = Math.max(0, Math.min(1, valueSafe / DEFAULT_BETA_TARGET));



        const v = Math.round(clamped * 255);



        const u8 = new Uint8Array([v, v, v, 255]);



        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, u8);



      }



      this.betaFallbackValue = valueSafe;



    }



    gl.bindTexture(gl.TEXTURE_2D, null);



    return this.betaFallbackTex;



  }







  private updateDerivedHullDims(state: Hull3DRendererState) {



    const ax = Math.max(Math.abs(state.axes[0]) * state.R * 2, 1e-3);



    const ay = Math.max(Math.abs(state.axes[1]) * state.R * 2, 1e-3);



    const az = Math.max(Math.abs(state.axes[2]) * state.R * 2, 1e-3);



    this.derivedHullDims = [ax, ay, az];



  }







  private sampleBetaField(state: Hull3DRendererState, u: number, v: number): number {



    if (typeof state.betaSampler === "function") {



      try {



        const val = state.betaSampler(u, v);



        if (Number.isFinite(val)) return val;



      } catch (err) {



        console.warn("[Hull3DRenderer] betaSampler threw", err);



      }



    }



    if (Number.isFinite(state.betaUniform_ms2)) {



      return state.betaUniform_ms2 as number;



    }



    return state.beta;



  }







  private updateBetaTelemetry(state: Hull3DRendererState, comfort: number) {



    const samples = 24;



    const step = samples > 1 ? 1 / (samples - 1) : 1;



    const dims = state.hullDims ?? this.derivedHullDims;



    const hullScale = Math.max(dims[0], Math.max(dims[1], dims[2]));



    let maxGrad = 0;



    let redCount = 0;



    let total = 0;



    const G = 9.80665;



    for (let j = 0; j < samples; j++) {



      const v = j * step;



      for (let i = 0; i < samples; i++) {



        const u = i * step;



        const b = this.sampleBetaField(state, u, v);



        const bRight = this.sampleBetaField(state, Math.min(1, u + step), v);



        const bUp = this.sampleBetaField(state, u, Math.min(1, v + step));



        let grad = Math.hypot(bRight - b, bUp - b);



        if (hullScale > 1e-5) grad *= hullScale;



        if (grad > maxGrad) maxGrad = grad;



        if (Math.abs(grad - 0.4 * G) <= 0.05 * G) {



          redCount += 1;



        }



        total += 1;



      }



    }



    const redPct = total > 0 ? redCount / total : 0;



    this.betaTelemetry = { maxGrad, redPct };



    console.debug("[β-overlay]", {



      maxGrad_ms2: Number.isFinite(maxGrad) ? Number(maxGrad.toFixed(3)) : maxGrad,



      comfort_ms2: comfort,



      redBandAreaPct: Number.isFinite(redPct) ? Number((redPct * 100).toFixed(1)) : redPct,



    });



  }







  private ensureFallbackProgram() {



    if (this.overlay.fallbackProgram) return;



    try {



      this.overlay.fallbackProgram = linkProgram(this.gl, "Hull3D::fallback", OVERLAY_VS, OVERLAY_FS);



    } catch (err) {



      console.error("[Hull3DRenderer] Failed to create fallback shader", err);



      this.overlay.fallbackProgram = null;



    }



  }







  private applyRayUniforms(



    gl: WebGL2RenderingContext,



    loc: Record<string, WebGLUniformLocation | null>,



    state: Hull3DRendererState,



    params: RayUniformParams



  ) {



    const gateView = Number.isFinite(state.gateView) ? state.gateView : state.gate;



    const floorThetaGR = Math.max(0, state.vizFloorThetaGR ?? 1e-9);



    const floorRhoGR = Math.max(0, state.vizFloorRhoGR ?? 1e-18);



    const floorThetaDrive = Math.max(0, state.vizFloorThetaDrive ?? 1e-6);



    if (loc.u_axes) gl.uniform3f(loc.u_axes, state.axes[0], state.axes[1], state.axes[2]);



    if (loc.u_domainScale) gl.uniform1f(loc.u_domainScale, this.domainScale);



    if (loc.u_beta) gl.uniform1f(loc.u_beta, state.beta);



    if (loc.u_ampChain) gl.uniform1f(loc.u_ampChain, state.ampChain);



    if (loc.u_gate) gl.uniform1f(loc.u_gate, state.gate);



    if (loc.u_gate_view) gl.uniform1f(loc.u_gate_view, gateView);



    if (loc.u_vizFloorThetaGR) gl.uniform1f(loc.u_vizFloorThetaGR, floorThetaGR);



    if (loc.u_vizFloorRhoGR) gl.uniform1f(loc.u_vizFloorRhoGR, floorRhoGR);



    if (loc.u_vizFloorThetaDrive) gl.uniform1f(loc.u_vizFloorThetaDrive, floorThetaDrive);



    if (loc.u_fActive) gl.uniform1f(loc.u_fActive, params.fActive);



    if (loc.u_lumpExp) gl.uniform1f(loc.u_lumpExp, state.lumpExp);



    if (loc.u_phaseSign) gl.uniform1f(loc.u_phaseSign, params.phaseSign);



    this.uniformCache.set1f(gl, loc.u_phase01, params.phase01);



    if (loc.u_blend) gl.uniform1f(loc.u_blend, clamp(params.blend, 0, 1));



    if (loc.u_radialScale) gl.uniform1f(loc.u_radialScale, this.radialScale);



    if (loc.u_radialMax) gl.uniform1f(loc.u_radialMax, this.radialMaxR);



    if (loc.u_invR) gl.uniform1f(loc.u_invR, params.invR);



    if (loc.u_timeSec) gl.uniform1f(loc.u_timeSec, params.timeSec);



  if (loc.u_sigma) gl.uniform1f(loc.u_sigma, params.sigma);



    const win = (typeof window !== "undefined") ? (window as any) : undefined;



    const forcedDensityScale = Number.isFinite(win?.__hullForceDensityScale)



      ? win.__hullForceDensityScale



      : params.densityScale;



    if (loc.u_densityScale) gl.uniform1f(loc.u_densityScale, forcedDensityScale);



    if (loc.u_stepBias) gl.uniform1f(loc.u_stepBias, params.stepBias);



    if (loc.u_maxSteps) gl.uniform1i(loc.u_maxSteps, params.maxSteps);



    if (loc.u_cameraPos) gl.uniform3f(loc.u_cameraPos, params.cameraEye[0], params.cameraEye[1], params.cameraEye[2]);



    if (loc.u_invViewProj) gl.uniformMatrix4fv(loc.u_invViewProj, false, params.invViewProj);



    if (loc.u_forceFlatGate) gl.uniform1i(loc.u_forceFlatGate, params.forceFlatGate ? 1 : 0);



    if (loc.u_debugMode) gl.uniform1i(loc.u_debugMode, params.debugMode ?? 0);



    if (loc.u_probeMode) gl.uniform1i(loc.u_probeMode, params.probeMode ?? 0);



    if (loc.u_probeGain) gl.uniform1f(loc.u_probeGain, params.probeGain ?? 0);



    if (loc.u_testMode) gl.uniform1i(loc.u_testMode, params.testMode ?? 0);



    if (loc.u_baseScale) gl.uniform1f(loc.u_baseScale, params.baseScale);



    if (loc.u_volumeViz) gl.uniform1i(loc.u_volumeViz, params.volumeVizIndex);



    if (loc.u_grThetaGain) gl.uniform1f(loc.u_grThetaGain, params.grThetaGain);



    if (loc.u_grRhoGain) gl.uniform1f(loc.u_grRhoGain, params.grRhoGain);



    if (win) {



      win.__hullVolumeVizIndex = params.volumeVizIndex;



      win.__hullLastDensityScale = forcedDensityScale;



    }



  }







  draw() {



    if (!this.state) return;



    const { gl } = this;



    const state = this.state;



    const phase01 = clamp(this.phaseTarget, 0, 1);



    state.phase01 = phase01;



    this.overlay3D.phase01 = phase01;



    if (typeof window !== "undefined") {



      (window as any).__hullLastState = state;



    }



    const fActive = this.resolveFActive(state);



    this.fActiveResolved = fActive;



    const now = performance.now();



    const frameDt = now - this.framePerf.lastFrameTime;



    this.framePerf.lastFrameTime = now;



    this.framePerf.movingAvg = lerp(this.framePerf.movingAvg, frameDt, 0.1);



    if (this.options.quality === "auto") {



      if (this.framePerf.movingAvg > 40) {



        this.setQuality("medium", this.options.qualityOverrides);



      }



      if (this.framePerf.movingAvg > 55) {



        this.setQuality("low", this.options.qualityOverrides);



      }



    }







    const width = this.canvas.width;



    const height = this.canvas.height;



    const haveTargets = this.ensureRayTargets(width, height);



    const canUseOffscreen = haveTargets



      && !!this.resources.rayFbo



      && !!this.resources.rayColorTex



      && !!this.resources.rayAuxTex



      && !!this.resources.postProgram;



    if (canUseOffscreen) {



      gl.bindFramebuffer(gl.FRAMEBUFFER, this.resources.rayFbo);



      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);



    } else {



      gl.bindFramebuffer(gl.FRAMEBUFFER, null);



    }



    gl.viewport(0, 0, width, height);



    gl.clearColor(0.01, 0.015, 0.03, 1);



    gl.clear(gl.COLOR_BUFFER_BIT);



    // For the fullscreen raymarch, avoid depth interactions entirely



    gl.disable(gl.DEPTH_TEST);







    if ((this.debugCounter++ % 120) === 0) {



      const effectiveGate = Number.isFinite(state.gateView) ? state.gateView : state.gate;



      const baseDrive = state.beta * state.ampChain * effectiveGate;



      const driveMag = Math.abs(baseDrive);



      if (!Number.isFinite(driveMag) || driveMag < 1e-9) {



        console.warn("[Hull3DRenderer] Drive magnitude near zero", {



          ampChain: state.ampChain,



          beta: state.beta,



          gate: state.gate,



          duty: state.duty,



          bubbleStatus: state.bubbleStatus,



          freeze: this.freezeVolume,



          skipVolume: this.skipVolumeUpdate,



          hasVolume: this.hasVolume,



        });



      } else if (!this.hasVolume) {



        console.warn("[Hull3DRenderer] Volume not initialized yet (drive magnitude ok)", {



          freeze: this.freezeVolume,



          skipVolume: this.skipVolumeUpdate,



          lastVolumeKey: this.lastVolumeKey,



        });



      } else {



        const lumpExp = Math.max(0.5, state.lumpExp);



        const expectedGain = Math.pow(1 / Math.max(fActive, 1e-6), 0.5 * lumpExp);



        console.log("[Hull3D] drive check", {



          base: baseDrive,



          volumeViz: this.resolveVolumeViz(state),



          densityScale: this.lastDensityScale,



          fActive,



          duty: state.duty,



          lumpExp,



          expectedGain,



        });



      }



    }







    const camera = this.computeCamera(state);



    const view = lookAt(identity(), camera.eye, camera.center, [0, 1, 0]);



    const hullRadius = Math.max(Math.abs(state.axes[0]), Math.abs(state.axes[1]), Math.abs(state.axes[2])) * this.domainScale;



    const farPlane = Math.max(1000, hullRadius * 4);



    const proj = perspective(identity(), camera.fov, state.aspect || 1.6, 0.2, farPlane);



    const viewProj = multiply(identity(), proj, view);



    const invViewProj = invert(identity(), viewProj) ?? identity();







    if (this.resources.rayProgram && this.radialTex && this.ringInstantTex) {



      gl.useProgram(this.resources.rayProgram);



      const loc = {



        u_volume: gl.getUniformLocation(this.resources.rayProgram, "u_volume"),



        u_ringInstant: gl.getUniformLocation(this.resources.rayProgram, "u_ringInstant"),



        u_ringAverage: gl.getUniformLocation(this.resources.rayProgram, "u_ringAverage"),



        u_radialLUT: gl.getUniformLocation(this.resources.rayProgram, "u_radialLUT"),



        u_curvTex: gl.getUniformLocation(this.resources.rayProgram, "u_curvTex"),



        u_curvGain: gl.getUniformLocation(this.resources.rayProgram, "u_curvGain"),



        u_curvAlpha: gl.getUniformLocation(this.resources.rayProgram, "u_curvAlpha"),



        u_curvPaletteMode: gl.getUniformLocation(this.resources.rayProgram, "u_curvPaletteMode"),



        u_axes: gl.getUniformLocation(this.resources.rayProgram, "u_axes"),



        u_domainScale: gl.getUniformLocation(this.resources.rayProgram, "u_domainScale"),



        u_beta: gl.getUniformLocation(this.resources.rayProgram, "u_beta"),



        u_ampChain: gl.getUniformLocation(this.resources.rayProgram, "u_ampChain"),



        u_gate: gl.getUniformLocation(this.resources.rayProgram, "u_gate"),



        u_gate_view: gl.getUniformLocation(this.resources.rayProgram, "u_gate_view"),



        u_fActive: gl.getUniformLocation(this.resources.rayProgram, "u_fActive"),



        u_lumpExp: gl.getUniformLocation(this.resources.rayProgram, "u_lumpExp"),



        u_phase01: gl.getUniformLocation(this.resources.rayProgram, "u_phase01"),



        u_phaseSign: gl.getUniformLocation(this.resources.rayProgram, "u_phaseSign"),



        u_blend: gl.getUniformLocation(this.resources.rayProgram, "u_blend"),



        u_densityScale: gl.getUniformLocation(this.resources.rayProgram, "u_densityScale"),



        u_stepBias: gl.getUniformLocation(this.resources.rayProgram, "u_stepBias"),



        u_maxSteps: gl.getUniformLocation(this.resources.rayProgram, "u_maxSteps"),



        u_radialScale: gl.getUniformLocation(this.resources.rayProgram, "u_radialScale"),



        u_radialMax: gl.getUniformLocation(this.resources.rayProgram, "u_radialMax"),



        u_invR: gl.getUniformLocation(this.resources.rayProgram, "u_invR"),



        u_timeSec: gl.getUniformLocation(this.resources.rayProgram, "u_timeSec"),



  u_sigma: gl.getUniformLocation(this.resources.rayProgram, "u_sigma"),



        u_cameraPos: gl.getUniformLocation(this.resources.rayProgram, "u_cameraPos"),



        u_invViewProj: gl.getUniformLocation(this.resources.rayProgram, "u_invViewProj"),



        u_forceFlatGate: gl.getUniformLocation(this.resources.rayProgram, "u_forceFlatGate"),



        u_debugMode: gl.getUniformLocation(this.resources.rayProgram, "u_debugMode"),



        u_probeMode: gl.getUniformLocation(this.resources.rayProgram, "u_probeMode"),



        u_probeGain: gl.getUniformLocation(this.resources.rayProgram, "u_probeGain"),



        u_testMode: gl.getUniformLocation(this.resources.rayProgram, "u_testMode"),



        u_baseScale: gl.getUniformLocation(this.resources.rayProgram, "u_baseScale"),



        u_volumeViz: gl.getUniformLocation(this.resources.rayProgram, "u_volumeViz"),



        u_overlayMode: gl.getUniformLocation(this.resources.rayProgram, "u_overlayMode"),



        u_overlayMix: gl.getUniformLocation(this.resources.rayProgram, "u_overlayMix"),



        u_overlayAlpha: gl.getUniformLocation(this.resources.rayProgram, "u_overlayAlpha"),



        u_overlayThick: gl.getUniformLocation(this.resources.rayProgram, "u_overlayThick"),



        u_overlayGain: gl.getUniformLocation(this.resources.rayProgram, "u_overlayGain"),



        u_overlayHue: gl.getUniformLocation(this.resources.rayProgram, "u_overlayHue"),



        u_overlayPhase: gl.getUniformLocation(this.resources.rayProgram, "u_overlayPhase"),



        u_ringOverlay: gl.getUniformLocation(this.resources.rayProgram, "u_ringOverlay"),



        u_grayMode: gl.getUniformLocation(this.resources.rayProgram, "u_grayMode"),



        u_grThetaGain: gl.getUniformLocation(this.resources.rayProgram, "u_grThetaGain"),



        u_grRhoGain: gl.getUniformLocation(this.resources.rayProgram, "u_grRhoGain"),



        u_vizFloorThetaGR: gl.getUniformLocation(this.resources.rayProgram, "u_vizFloorThetaGR"),



        u_vizFloorRhoGR: gl.getUniformLocation(this.resources.rayProgram, "u_vizFloorRhoGR"),



        u_vizFloorThetaDrive: gl.getUniformLocation(this.resources.rayProgram, "u_vizFloorThetaDrive"),



        u_ringOverlayMode: gl.getUniformLocation(this.resources.rayProgram, "u_ringOverlayMode"),



        u_ringOverlayBlend: gl.getUniformLocation(this.resources.rayProgram, "u_ringOverlayBlend"),



        u_ringOverlayAlpha: gl.getUniformLocation(this.resources.rayProgram, "u_ringOverlayAlpha"),



        u_ringOverlayWidth: gl.getUniformLocation(this.resources.rayProgram, "u_ringOverlayWidth"),



        u_ringOverlayField: gl.getUniformLocation(this.resources.rayProgram, "u_ringOverlayField"),



      };



      const volumeTex = this.volumeTex ?? this.ensureDummy3D();



      const ringInstantTex = this.ringInstantTex!;



      const ringAverageTex = this.ringAverageTex ?? ringInstantTex;



      const curvTex = this.curvature.hasData ? this.getActiveCurvatureTexture() : this.ensureCurvatureFallback();



      gl.activeTexture(gl.TEXTURE0);



      gl.bindTexture(gl.TEXTURE_3D, volumeTex);



      gl.uniform1i(loc.u_volume, 0);



      gl.activeTexture(gl.TEXTURE1);



      gl.bindTexture(gl.TEXTURE_2D, ringInstantTex);



      gl.uniform1i(loc.u_ringInstant, 1);



      gl.activeTexture(gl.TEXTURE2);



      gl.bindTexture(gl.TEXTURE_2D, ringAverageTex);



      gl.uniform1i(loc.u_ringAverage, 2);



      gl.activeTexture(gl.TEXTURE3);



      gl.bindTexture(gl.TEXTURE_2D, this.radialTex);



      gl.uniform1i(loc.u_radialLUT, 3);



      gl.activeTexture(gl.TEXTURE4);



      gl.bindTexture(gl.TEXTURE_3D, curvTex);



      if (loc.u_curvTex) gl.uniform1i(loc.u_curvTex, 4);



      const dbgPhaseSign = (typeof window !== "undefined" && (window as any).__hullPhaseSign === -1) ? -1 : 1;



      const statePhaseSign = Math.sign(state.phaseSign ?? 1) || 1;



      this.phaseSignEffective = statePhaseSign * dbgPhaseSign;



      const userExposure = Number.isFinite(state.exposure as number) ? (state.exposure as number) : undefined;



      const exposureBase = userExposure ?? 1.0;



      const effectiveExposure = clamp(exposureBase * this.autoGain, 1e-4, 1e4);



      const densityScale = this.resolveDensityScale(state, effectiveExposure);



      this.lastDensityScale = densityScale;



      const baseScale = this.resolveBaseScale(state);



      const gateForGain = Number.isFinite(state.gateView) ? state.gateView : state.gate;



      const driveChain = Math.abs(state.ampChain) * Math.max(gateForGain, 1e-6);



      const grThetaGain = Math.max(driveChain * 0.6, 1e-12);



      const grRhoGain = clamp(driveChain * 0.03, 1e-12, 1e12);



      const ringStats = this.ringLastStats;



      if (typeof window !== "undefined") {



        (window as any).__hullVizStats = {



          viz: this.resolveVolumeViz(state),



          densityScale,



          radialDfMax: this.radialDfMax,



          beta: state.beta,



          ampChain: state.ampChain,



          gate: state.gate,



          duty: state.duty,



          exposure: state.exposure,



          driveChain,



          thetaBoost: grThetaGain,



          rhoBoost: grRhoGain,



          autoGain: this.autoGain,



          baseScale,



          fActiveResolved: this.fActiveResolved,



          ringMean: ringStats?.mean ?? null,



          ringRawMean: ringStats?.rawMean ?? null,



          ringMin: ringStats?.min ?? null,



          ringMax: ringStats?.max ?? null,



        };



      }



      const volumeVizIndex = this.resolveVolumeVizIndex(state);



      const dbg = (typeof window !== "undefined") ? (window as any) : {};



      const debugForceFlat = !!dbg.__hullForceFlatGate;



      const autoFlatGate = this.autoFlatGate || (!!ringStats && ringStats.rawMean <= 1e-4);



      const forceFlatGate = debugForceFlat || autoFlatGate;



      if (dbg) {



        dbg.__hullAutoFlatGate = autoFlatGate;



      }



      const debugMode = Number.isInteger(dbg.__hullDebugMode) ? (dbg.__hullDebugMode | 0) : 0;



      const ringOverlay = !!dbg.__hullShowRingOverlay ? 1 : 0;



      const grayMode = (!!dbg.__hullDebugGrayscale || debugMode === 3) ? 1 : 0;



      const ringMode = Number.isInteger(dbg.__hullRingOverlayMode) ? (dbg.__hullRingOverlayMode | 0) : 0;



      const ringBlend = Number.isFinite(dbg.__hullRingOverlayBlend) ? Math.max(0, Math.min(1, +dbg.__hullRingOverlayBlend)) : 0.25;



      const ringAlpha = Number.isFinite(dbg.__hullRingOverlayAlpha) ? Math.max(0, Math.min(1, +dbg.__hullRingOverlayAlpha)) : 0.6;



      const ringWidth = Number.isFinite(dbg.__hullRingOverlayWidth) ? Math.max(0.002, Math.min(0.12, +dbg.__hullRingOverlayWidth)) : 0.03;



      const ringField = Number.isInteger(dbg.__hullRingOverlayField) ? (dbg.__hullRingOverlayField | 0) : -1;



      const params: RayUniformParams = {



        densityScale,



        stepBias: this.qualityProfile.stepBias,



        maxSteps: this.qualityProfile.maxSteps,



        cameraEye: camera.eye,



        invViewProj,



        phaseSign: this.phaseSignEffective,



        phase01: state.phase01,



        invR: 1.0 / Math.max(state.R, 1e-6),



        timeSec: state.timeSec ?? 0,



        blend: clamp(state.blendFactor, 0, 1),



        fActive,



        baseScale,



        sigma: state.sigma,



        volumeVizIndex,



        grThetaGain,



        grRhoGain,



        forceFlatGate,



        debugMode,



        probeMode: 0,



        probeGain: 0,



        testMode: 0,



      };



      this.applyRayUniforms(gl, loc, state, params);



    const overlay3D = this.overlay3D;
    const overlayMix = Math.max(0, Math.min(1, overlay3D.mix));
    const overlayAlpha = Math.max(0, Math.min(1, overlay3D.alpha));
    const overlayThick = Math.max(0.001, Math.min(0.3, overlay3D.thick));
    const overlayGain = Math.max(0, overlay3D.gain);
    const overlayHue = overlay3D.hue - Math.floor(overlay3D.hue);
    const overlayPhase = phase01;
    if (loc.u_overlayMode) gl.uniform1i(loc.u_overlayMode, overlay3D.mode);
    if (loc.u_overlayMix) gl.uniform1f(loc.u_overlayMix, overlayMix);
    if (loc.u_overlayAlpha) gl.uniform1f(loc.u_overlayAlpha, overlayAlpha);
    if (loc.u_overlayThick) gl.uniform1f(loc.u_overlayThick, overlayThick);
    if (loc.u_overlayGain) gl.uniform1f(loc.u_overlayGain, overlayGain);
    if (loc.u_overlayHue) gl.uniform1f(loc.u_overlayHue, overlayHue);
    this.uniformCache.set1f(gl, loc.u_overlayPhase, overlayPhase);

    if (loc.u_ringOverlay) gl.uniform1i(loc.u_ringOverlay, ringOverlay);



      if (loc.u_grayMode) gl.uniform1i(loc.u_grayMode, grayMode);



      if (loc.u_ringOverlayMode) gl.uniform1i(loc.u_ringOverlayMode, ringMode);



      if (loc.u_ringOverlayBlend) gl.uniform1f(loc.u_ringOverlayBlend, ringBlend);



      if (loc.u_ringOverlayAlpha) gl.uniform1f(loc.u_ringOverlayAlpha, ringAlpha);



      if (loc.u_ringOverlayWidth) gl.uniform1f(loc.u_ringOverlayWidth, ringWidth);



      if (loc.u_ringOverlayField) gl.uniform1i(loc.u_ringOverlayField, ringField);







      gl.bindVertexArray(this.resources.quadVao);



      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);



      gl.bindVertexArray(null);



      if (canUseOffscreen) {



        gl.bindFramebuffer(gl.FRAMEBUFFER, null);



        gl.viewport(0, 0, width, height);



        gl.disable(gl.DEPTH_TEST);



        this.drawPostComposite(state);



      }



      if (debugMode === 4) {



        this.captureDebugTap();



      }



    } else {



      if (canUseOffscreen) {



        gl.bindFramebuffer(gl.FRAMEBUFFER, null);



        gl.viewport(0, 0, width, height);



      }



      this.drawWireframeFallback(viewProj);



    }



    // 2D surface overlay pass (composed on top with transparency)



    // Hide the 2D overlay when grayscale debug is enabled so gray volume stays clear



    const dbg = (typeof window !== "undefined") ? (window as any) : {};



    const hideSurface = !!dbg.__hullDebugGrayscale || (dbg.__hullDebugMode === 3);



    if (!hideSurface && state.showSurfaceOverlay) {



      this.drawSurfaceOverlay(viewProj, state);



    }



    if (!hideSurface && (state.betaOverlayEnabled ?? false)) {



      this.drawBetaOverlay(viewProj, state);



    }



    // Vector overlays (ring, slice, diagnostics badge)



    this.drawOverlays(viewProj, state);



    // Diagnostics scheduler (decoupled): run a tiny offscreen probe after normal draw



    if (this.diagnosticsEnabled) {



      if (this._diag.state === 'idle' && (this.frameCount % this.autoSampleEvery) === 0) {



        this._diag.state = 'sampling';



        this.runDiagnosticProbe(state, camera, invViewProj);



      } else if (this._diag.state === 'holding') {



        if (--this._diag.holdLeft <= 0) {



          this._diag.state = 'idle';



          this._diag.lastOk = true;



          this._diag.message = "";



        }



      }



    }



    this.frameCount++;



    gl.disable(gl.DEPTH_TEST);



  }







  private drawSurfaceOverlay(mvp: Float32Array, state: Hull3DRendererState) {



    const { gl } = this;



    if (!this.surfaceProgram || !this.surfaceVao) return;



    // Keep it subtle so the 3D volume remains visible



    gl.enable(gl.BLEND);



    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);



    gl.useProgram(this.surfaceProgram);



    const loc = {



      u_axes: gl.getUniformLocation(this.surfaceProgram, "u_axes"),



      u_sigma: gl.getUniformLocation(this.surfaceProgram, "u_sigma"),



      u_R: gl.getUniformLocation(this.surfaceProgram, "u_R"),



      u_beta: gl.getUniformLocation(this.surfaceProgram, "u_beta"),



      u_viz: gl.getUniformLocation(this.surfaceProgram, "u_viz"),



      u_ampChain: gl.getUniformLocation(this.surfaceProgram, "u_ampChain"),



      u_gate: gl.getUniformLocation(this.surfaceProgram, "u_gate"),



      u_gate_view: gl.getUniformLocation(this.surfaceProgram, "u_gate_view"),



      u_duty: gl.getUniformLocation(this.surfaceProgram, "u_duty"),



      u_yGain: gl.getUniformLocation(this.surfaceProgram, "u_yGain"),



      u_yBias: gl.getUniformLocation(this.surfaceProgram, "u_yBias"),



      u_kColor: gl.getUniformLocation(this.surfaceProgram, "u_kColor"),



      u_mvp: gl.getUniformLocation(this.surfaceProgram, "u_mvp"),



      u_totalSectors: gl.getUniformLocation(this.surfaceProgram, "u_totalSectors"),



      u_liveSectors: gl.getUniformLocation(this.surfaceProgram, "u_liveSectors"),



      u_lumpExp: gl.getUniformLocation(this.surfaceProgram, "u_lumpExp"),



      u_sectorCenter: gl.getUniformLocation(this.surfaceProgram, "u_sectorCenter"),



      u_sectorSigma: gl.getUniformLocation(this.surfaceProgram, "u_sectorSigma"),



      u_sectorFloor: gl.getUniformLocation(this.surfaceProgram, "u_sectorFloor"),



      u_syncMode: gl.getUniformLocation(this.surfaceProgram, "u_syncMode"),



      u_phase01: gl.getUniformLocation(this.surfaceProgram, "u_phase01"),



      u_splitEnabled: gl.getUniformLocation(this.surfaceProgram, "u_splitEnabled"),



      u_splitFrac: gl.getUniformLocation(this.surfaceProgram, "u_splitFrac"),



      u_alpha: gl.getUniformLocation(this.surfaceProgram, "u_alpha"),



      u_vizFloorThetaGR: gl.getUniformLocation(this.surfaceProgram, "u_vizFloorThetaGR"),



      u_vizFloorRhoGR: gl.getUniformLocation(this.surfaceProgram, "u_vizFloorRhoGR"),



      u_vizFloorThetaDrive: gl.getUniformLocation(this.surfaceProgram, "u_vizFloorThetaDrive"),



    } as const;







    // Conservative viewer params to avoid occluding volume



    const yGain = 1e-8;



    const yBias = 0.0;



    const kColor = 1e-6;



    const alpha = 0.24;



    const gateView = Number.isFinite(state.gateView) ? state.gateView : state.gate;



    const floorThetaGR = Math.max(0, state.vizFloorThetaGR ?? 1e-9);



    const floorRhoGR = Math.max(0, state.vizFloorRhoGR ?? 1e-18);



    const floorThetaDrive = Math.max(0, state.vizFloorThetaDrive ?? 1e-6);







    if (loc.u_axes) gl.uniform3f(loc.u_axes, state.axes[0], state.axes[1], state.axes[2]);



    if (loc.u_sigma) gl.uniform1f(loc.u_sigma, state.sigma);



    if (loc.u_R) gl.uniform1f(loc.u_R, Math.max(0.1, state.R));



    if (loc.u_beta) gl.uniform1f(loc.u_beta, state.beta);



    if (loc.u_viz) {



      const viz = this.resolveVolumeViz(state);



      const vizIndex = VOLUME_VIZ_TO_INDEX[viz];



      gl.uniform1i(loc.u_viz, vizIndex);



    }



    if (loc.u_ampChain) gl.uniform1f(loc.u_ampChain, state.ampChain);



    if (loc.u_gate) gl.uniform1f(loc.u_gate, state.gate);



    if (loc.u_gate_view) gl.uniform1f(loc.u_gate_view, gateView);



    if (loc.u_duty) gl.uniform1f(loc.u_duty, Math.max(0, Math.min(1, state.duty)));



    if (loc.u_yGain) gl.uniform1f(loc.u_yGain, yGain);



    if (loc.u_yBias) gl.uniform1f(loc.u_yBias, yBias);



    if (loc.u_kColor) gl.uniform1f(loc.u_kColor, kColor);



    if (loc.u_mvp) gl.uniformMatrix4fv(loc.u_mvp, false, mvp);



    if (loc.u_totalSectors) gl.uniform1i(loc.u_totalSectors, state.totalSectors | 0);



    if (loc.u_liveSectors) gl.uniform1i(loc.u_liveSectors, state.liveSectors | 0);



    if (loc.u_lumpExp) gl.uniform1f(loc.u_lumpExp, state.lumpExp);



    if (loc.u_sectorCenter) gl.uniform1f(loc.u_sectorCenter, state.sectorCenter01);



    if (loc.u_sectorSigma) gl.uniform1f(loc.u_sectorSigma, Math.max(1e-4, state.gaussianSigma));



    if (loc.u_sectorFloor) gl.uniform1f(loc.u_sectorFloor, Math.min(0.99, Math.max(0, state.sectorFloor)));



    if (loc.u_syncMode) gl.uniform1i(loc.u_syncMode, state.syncMode | 0);



    this.uniformCache.set1f(gl, loc.u_phase01, state.phase01);



    if (loc.u_splitEnabled) gl.uniform1i(loc.u_splitEnabled, state.splitEnabled ? 1 : 0);



    if (loc.u_splitFrac) gl.uniform1f(loc.u_splitFrac, state.splitFrac);



    if (loc.u_alpha) gl.uniform1f(loc.u_alpha, alpha);



    if (loc.u_vizFloorThetaGR) gl.uniform1f(loc.u_vizFloorThetaGR, floorThetaGR);



    if (loc.u_vizFloorRhoGR) gl.uniform1f(loc.u_vizFloorRhoGR, floorRhoGR);



    if (loc.u_vizFloorThetaDrive) gl.uniform1f(loc.u_vizFloorThetaDrive, floorThetaDrive);







    this.drawSurfaceGridGeometry(gl);



    gl.disable(gl.BLEND);



  }







  private drawPostComposite(state: Hull3DRendererState) {



    const { gl } = this;



    if (!this.resources.postProgram || !this.resources.quadVao || !this.resources.rayColorTex || !this.resources.rayAuxTex) return;



    gl.disable(gl.BLEND);



    gl.useProgram(this.resources.postProgram);



    const loc = {



      u_colorTex: gl.getUniformLocation(this.resources.postProgram, "u_colorTex"),



      u_auxTex: gl.getUniformLocation(this.resources.postProgram, "u_auxTex"),



      u_ringInstantTex: gl.getUniformLocation(this.resources.postProgram, "u_ringInstantTex"),



      u_ringAverageTex: gl.getUniformLocation(this.resources.postProgram, "u_ringAverageTex"),



      u_greensTex: gl.getUniformLocation(this.resources.postProgram, "u_greensTex"),



      u_resolution: gl.getUniformLocation(this.resources.postProgram, "u_resolution"),



      u_phase: gl.getUniformLocation(this.resources.postProgram, "u_phase"),



      u_showKHeat: gl.getUniformLocation(this.resources.postProgram, "u_showKHeat"),



      u_kMode: gl.getUniformLocation(this.resources.postProgram, "u_kMode"),



      u_kGain: gl.getUniformLocation(this.resources.postProgram, "u_kGain"),



      u_kAlpha: gl.getUniformLocation(this.resources.postProgram, "u_kAlpha"),



      u_showThetaIso: gl.getUniformLocation(this.resources.postProgram, "u_showThetaIso"),



      u_isoStep: gl.getUniformLocation(this.resources.postProgram, "u_isoStep"),



      u_isoWidth: gl.getUniformLocation(this.resources.postProgram, "u_isoWidth"),



      u_isoOpacity: gl.getUniformLocation(this.resources.postProgram, "u_isoOpacity"),



      u_showFR: gl.getUniformLocation(this.resources.postProgram, "u_showFR"),



      u_tauLC: gl.getUniformLocation(this.resources.postProgram, "u_tauLC"),



      u_burst: gl.getUniformLocation(this.resources.postProgram, "u_burst"),



      u_dwell: gl.getUniformLocation(this.resources.postProgram, "u_dwell"),



      u_frAlpha: gl.getUniformLocation(this.resources.postProgram, "u_frAlpha"),



      u_showRecLamp: gl.getUniformLocation(this.resources.postProgram, "u_showRecLamp"),



      u_showSectorArc: gl.getUniformLocation(this.resources.postProgram, "u_showSectorArc"),



      u_arcRadiusPx: gl.getUniformLocation(this.resources.postProgram, "u_arcRadiusPx"),



      u_arcWidthPx: gl.getUniformLocation(this.resources.postProgram, "u_arcWidthPx"),



      u_arcGapPx: gl.getUniformLocation(this.resources.postProgram, "u_arcGapPx"),



      u_arcInstantAlpha: gl.getUniformLocation(this.resources.postProgram, "u_arcInstantAlpha"),



      u_arcEmaAlpha: gl.getUniformLocation(this.resources.postProgram, "u_arcEmaAlpha"),



      u_showTilt: gl.getUniformLocation(this.resources.postProgram, "u_showTilt"),



      u_tiltDir: gl.getUniformLocation(this.resources.postProgram, "u_tiltDir"),



      u_tiltMag: gl.getUniformLocation(this.resources.postProgram, "u_tiltMag"),



      u_tiltAlpha: gl.getUniformLocation(this.resources.postProgram, "u_tiltAlpha"),



      u_showGreens: gl.getUniformLocation(this.resources.postProgram, "u_showGreens"),



      u_greensSizePx: gl.getUniformLocation(this.resources.postProgram, "u_greensSizePx"),



      u_greensOriginPx: gl.getUniformLocation(this.resources.postProgram, "u_greensOriginPx"),



      u_greensRange: gl.getUniformLocation(this.resources.postProgram, "u_greensRange"),



      u_greensAlpha: gl.getUniformLocation(this.resources.postProgram, "u_greensAlpha"),



    } as const;







    const overlays = state.overlays;



    const overlayFlags = readOverlayFlags();



    const kCfg = overlays?.kInvariants;



    const isoCfg = overlays?.thetaIso;



    const frCfg = overlays?.fordRoman;



    const arcCfg = overlays?.sectorArc;



    const tiltCfg = overlays?.tilt;



    const greensCfg = overlays?.greens;



    const curvCfg = overlays?.curvature;



    const phase = overlays?.phase ?? ((state.timeSec ?? 0) * 0.12) % 1;



    const kShow = kCfg?.enabled ? 1 : 0;



    const kMode = kCfg?.mode ?? 0;



    const kGain = kCfg?.gain ?? 6.0;



    const kAlpha = kCfg?.alpha ?? 0.0;







    const isoShow = isoCfg?.enabled ? 1 : 0;



    const isoStep = isoCfg?.step ?? 1e-6;



    const isoWidth = isoCfg?.width ?? 0.08;



    const isoOpacity = isoCfg?.opacity ?? 0.0;







    const frShow = frCfg?.enabled ? 1 : 0;



    const tauLC = frCfg?.tauLC ?? 1e-6;



    const burst = frCfg?.burst ?? 0.0;



    const dwell = frCfg?.dwell ?? 0.0;



    const frAlpha = frCfg?.alpha ?? 0.0;



    const recLampShow = (overlayFlags.showReciprocity ? 1 : 0) && tauLC > 1e-6 && burst > 0.0 ? 1 : 0;







    const arcShow = arcCfg?.enabled ? 1 : 0;



    const arcRadius = arcCfg?.radiusPx ?? 74.0;



    const arcWidth = arcCfg?.widthPx ?? 8.0;



    const arcGap = arcCfg?.gapPx ?? 11.0;



    const arcInstantAlpha = arcCfg?.instantAlpha ?? 0.75;



    const arcEmaAlpha = arcCfg?.emaAlpha ?? 0.6;







    const tiltShow = tiltCfg?.enabled && tiltCfg.dir ? 1 : 0;



    const tiltDir = tiltCfg?.dir ?? [0, -1];



    const tiltMag = tiltCfg?.magnitude ?? 0;



    const tiltAlpha = tiltCfg?.alpha ?? 0.8;







    const greensShow = greensCfg?.enabled && greensCfg.texture ? 1 : 0;



    const greensSize = greensCfg?.sizePx ?? [220, 80];



    const greensOrigin = greensCfg?.originPx ?? [24, 64];



    const greensRange = greensCfg?.range ?? [0, 1];



    const greensAlpha = greensCfg?.alpha ?? 0.0;



    const curvEnabled = !!curvCfg?.enabled && this.curvature.hasData;



    const curvGain = curvCfg?.gain ?? 1.0;



    const curvAlpha = curvEnabled ? Math.max(0, Math.min(1, curvCfg?.alpha ?? 0.0)) : 0.0;



    const curvPaletteMode = curvCfg?.palette ?? 0;



    if (loc.u_resolution) gl.uniform2f(loc.u_resolution, this.canvas.width, this.canvas.height);



    if (loc.u_phase) gl.uniform1f(loc.u_phase, phase);



    if (loc.u_showKHeat) gl.uniform1i(loc.u_showKHeat, kShow);



    if (loc.u_kMode) gl.uniform1i(loc.u_kMode, kMode);



    if (loc.u_kGain) gl.uniform1f(loc.u_kGain, kGain);



    if (loc.u_kAlpha) gl.uniform1f(loc.u_kAlpha, kAlpha);



    if (loc.u_showThetaIso) gl.uniform1i(loc.u_showThetaIso, isoShow);



    if (loc.u_isoStep) gl.uniform1f(loc.u_isoStep, isoStep);



    if (loc.u_isoWidth) gl.uniform1f(loc.u_isoWidth, isoWidth);



    if (loc.u_isoOpacity) gl.uniform1f(loc.u_isoOpacity, isoOpacity);



    if (loc.u_showFR) gl.uniform1i(loc.u_showFR, frShow);



    if (loc.u_tauLC) gl.uniform1f(loc.u_tauLC, tauLC);



    if (loc.u_burst) gl.uniform1f(loc.u_burst, burst);



    if (loc.u_dwell) gl.uniform1f(loc.u_dwell, dwell);



    if (loc.u_frAlpha) gl.uniform1f(loc.u_frAlpha, frAlpha);



    if (loc.u_showRecLamp) gl.uniform1i(loc.u_showRecLamp, recLampShow);



    if (loc.u_showSectorArc) gl.uniform1i(loc.u_showSectorArc, arcShow);



    if (loc.u_arcRadiusPx) gl.uniform1f(loc.u_arcRadiusPx, arcRadius);



    if (loc.u_arcWidthPx) gl.uniform1f(loc.u_arcWidthPx, arcWidth);



    if (loc.u_arcGapPx) gl.uniform1f(loc.u_arcGapPx, arcGap);



    if (loc.u_arcInstantAlpha) gl.uniform1f(loc.u_arcInstantAlpha, arcInstantAlpha);



    if (loc.u_arcEmaAlpha) gl.uniform1f(loc.u_arcEmaAlpha, arcEmaAlpha);



    if (loc.u_showTilt) gl.uniform1i(loc.u_showTilt, tiltShow);



    if (loc.u_tiltDir) gl.uniform2f(loc.u_tiltDir, tiltDir[0], tiltDir[1]);



    if (loc.u_tiltMag) gl.uniform1f(loc.u_tiltMag, tiltMag);



    if (loc.u_tiltAlpha) gl.uniform1f(loc.u_tiltAlpha, tiltAlpha);



    if (loc.u_showGreens) gl.uniform1i(loc.u_showGreens, greensShow);



    if (loc.u_greensSizePx) gl.uniform2f(loc.u_greensSizePx, greensSize[0], greensSize[1]);



    if (loc.u_greensOriginPx) gl.uniform2f(loc.u_greensOriginPx, greensOrigin[0], greensOrigin[1]);



    if (loc.u_greensRange) gl.uniform2f(loc.u_greensRange, greensRange[0], greensRange[1]);



    if (loc.u_greensAlpha) gl.uniform1f(loc.u_greensAlpha, greensAlpha);







    gl.activeTexture(gl.TEXTURE0);



    gl.bindTexture(gl.TEXTURE_2D, this.resources.rayColorTex);



    if (loc.u_colorTex) gl.uniform1i(loc.u_colorTex, 0);



    gl.activeTexture(gl.TEXTURE1);



    gl.bindTexture(gl.TEXTURE_2D, this.resources.rayAuxTex);



    if (loc.u_auxTex) gl.uniform1i(loc.u_auxTex, 1);



    const ringInstantTex = this.ringInstantTex ?? this.ensureFallback2D();



    const ringAverageTex = this.ringAverageTex ?? ringInstantTex;



    gl.activeTexture(gl.TEXTURE2);



    gl.bindTexture(gl.TEXTURE_2D, ringInstantTex);



    if (loc.u_ringInstantTex) gl.uniform1i(loc.u_ringInstantTex, 2);



    gl.activeTexture(gl.TEXTURE3);



    gl.bindTexture(gl.TEXTURE_2D, ringAverageTex);



    if (loc.u_ringAverageTex) gl.uniform1i(loc.u_ringAverageTex, 3);



    gl.activeTexture(gl.TEXTURE4);



    if (greensShow && greensCfg?.texture) {



      gl.bindTexture(gl.TEXTURE_2D, greensCfg.texture);



    } else {



      gl.bindTexture(gl.TEXTURE_2D, this.ensureFallback2D());



    }



    if (loc.u_greensTex) gl.uniform1i(loc.u_greensTex, 4);







    gl.bindVertexArray(this.resources.quadVao);



    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);



    gl.bindVertexArray(null);



    gl.activeTexture(gl.TEXTURE4);



    gl.bindTexture(gl.TEXTURE_2D, null);



    gl.activeTexture(gl.TEXTURE3);



    gl.bindTexture(gl.TEXTURE_2D, null);



    gl.activeTexture(gl.TEXTURE2);



    gl.bindTexture(gl.TEXTURE_2D, null);



    gl.activeTexture(gl.TEXTURE1);



    gl.bindTexture(gl.TEXTURE_2D, null);



    gl.activeTexture(gl.TEXTURE0);



    gl.bindTexture(gl.TEXTURE_2D, null);



  }







  private drawBetaOverlay(mvp: Float32Array, state: Hull3DRendererState) {



    const { gl } = this;



    if (!this.betaOverlayProgram || !this.surfaceVao || !this.betaOverlayUniforms) return;



    const u = this.betaOverlayUniforms;



    gl.enable(gl.BLEND);



    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);



    gl.useProgram(this.betaOverlayProgram);







    const yGain = 1e-8;



    const yBias = 0.0;



    const kColor = 1e-6;



    const alpha = 0.45;



    const viz = this.resolveVolumeViz(state);



    const vizIndex = VOLUME_VIZ_TO_INDEX[viz];



    const gateView = Number.isFinite(state.gateView) ? state.gateView : state.gate;



    const floorThetaGR = Math.max(0, state.vizFloorThetaGR ?? 1e-9);



    const floorRhoGR = Math.max(0, state.vizFloorRhoGR ?? 1e-18);



    const floorThetaDrive = Math.max(0, state.vizFloorThetaDrive ?? 1e-6);







    if (u.u_axes) gl.uniform3f(u.u_axes, state.axes[0], state.axes[1], state.axes[2]);



    if (u.u_sigma) gl.uniform1f(u.u_sigma, state.sigma);



    if (u.u_R) gl.uniform1f(u.u_R, Math.max(0.1, state.R));



    if (u.u_beta) gl.uniform1f(u.u_beta, state.beta);



    if (u.u_viz) gl.uniform1i(u.u_viz, vizIndex);



    if (u.u_ampChain) gl.uniform1f(u.u_ampChain, state.ampChain);



    if (u.u_gate) gl.uniform1f(u.u_gate, state.gate);



    if (u.u_gate_view) gl.uniform1f(u.u_gate_view, gateView);



    if (u.u_duty) gl.uniform1f(u.u_duty, Math.max(0, Math.min(1, state.duty)));



    if (u.u_yGain) gl.uniform1f(u.u_yGain, yGain);



    if (u.u_yBias) gl.uniform1f(u.u_yBias, yBias);



    if (u.u_kColor) gl.uniform1f(u.u_kColor, kColor);



    if (u.u_mvp) gl.uniformMatrix4fv(u.u_mvp, false, mvp);



    if (u.u_totalSectors) gl.uniform1i(u.u_totalSectors, state.totalSectors | 0);



    if (u.u_liveSectors) gl.uniform1i(u.u_liveSectors, state.liveSectors | 0);



    if (u.u_lumpExp) gl.uniform1f(u.u_lumpExp, state.lumpExp);



    if (u.u_sectorCenter) gl.uniform1f(u.u_sectorCenter, state.sectorCenter01);



    if (u.u_sectorSigma) gl.uniform1f(u.u_sectorSigma, Math.max(1e-4, state.gaussianSigma));



    if (u.u_sectorFloor) gl.uniform1f(u.u_sectorFloor, Math.min(0.99, Math.max(0, state.sectorFloor)));



    if (u.u_syncMode) gl.uniform1i(u.u_syncMode, state.syncMode | 0);



    this.uniformCache.set1f(gl, u.u_phase01, state.phase01);



    if (u.u_splitEnabled) gl.uniform1i(u.u_splitEnabled, state.splitEnabled ? 1 : 0);



    if (u.u_splitFrac) gl.uniform1f(u.u_splitFrac, state.splitFrac);



    if (u.u_vizFloorThetaGR) gl.uniform1f(u.u_vizFloorThetaGR, floorThetaGR);



    if (u.u_vizFloorRhoGR) gl.uniform1f(u.u_vizFloorRhoGR, floorRhoGR);



    if (u.u_vizFloorThetaDrive) gl.uniform1f(u.u_vizFloorThetaDrive, floorThetaDrive);







    const betaTarget = state.betaTarget_ms2 ?? DEFAULT_BETA_TARGET;



    const comfort = state.comfort_ms2 ?? DEFAULT_COMFORT;



    const dims = state.hullDims ?? this.derivedHullDims;



    const betaTex = state.betaTexture ?? this.ensureBetaFallbackTexture(state.betaUniform_ms2 ?? betaTarget);



    if (!betaTex) {



      gl.disable(gl.BLEND);



      return;



    }



    gl.activeTexture(gl.TEXTURE0);



    gl.bindTexture(gl.TEXTURE_2D, betaTex);



    if (u.uBetaTex) gl.uniform1i(u.uBetaTex, 0);



    if (u.uBetaTarget) gl.uniform1f(u.uBetaTarget, betaTarget);



    if (u.uComfort) gl.uniform1f(u.uComfort, comfort);



    if (u.uHullDims) gl.uniform3f(u.uHullDims, dims[0], dims[1], dims[2]);



    if (u.uAlpha) gl.uniform1f(u.uAlpha, alpha);







    this.drawSurfaceGridGeometry(gl);



    gl.bindTexture(gl.TEXTURE_2D, null);



    gl.disable(gl.BLEND);







    this.updateBetaTelemetry(state, comfort);



  }







  private ensureDiagFBO() {



    if (this.diagFBO && this.diagColorTex) return;



    const { gl } = this;



    this.diagFBO = gl.createFramebuffer();



    this.diagColorTex = gl.createTexture();



    if (!this.diagFBO || !this.diagColorTex) {



      this.diagFBO = null; this.diagColorTex = null; return;



    }



    gl.bindTexture(gl.TEXTURE_2D, this.diagColorTex);



    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);



    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);



    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);



    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);



    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.diagSize, this.diagSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);



    gl.bindFramebuffer(gl.FRAMEBUFFER, this.diagFBO);



    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.diagColorTex, 0);



    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);



    if (status !== gl.FRAMEBUFFER_COMPLETE) {



      console.warn("[Hull3DRenderer] Diagnostic FBO incomplete:", status);



    }



    gl.bindFramebuffer(gl.FRAMEBUFFER, null);



    gl.bindTexture(gl.TEXTURE_2D, null);



  }







  private ensureRayTargets(width: number, height: number): boolean {



    const { gl } = this;



    const res = this.resources;



    if (!res.rayFbo) res.rayFbo = gl.createFramebuffer();



    if (!res.rayColorTex) res.rayColorTex = gl.createTexture();



    if (!res.rayAuxTex) res.rayAuxTex = gl.createTexture();



    if (!res.rayFbo || !res.rayColorTex || !res.rayAuxTex) {



      console.warn("[Hull3DRenderer] Failed to allocate ray targets");



      return false;



    }



    const needsResize = this.rayTargetSize[0] !== width || this.rayTargetSize[1] !== height;



    const needsInit = this.rayAuxInternalFormat === 0 || this.rayAuxType === 0;



    if (!needsResize && !needsInit) {



      return true;



    }







    gl.bindTexture(gl.TEXTURE_2D, res.rayColorTex);



    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);



    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);



    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);



    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);



    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);







    const candidates: Array<{ internal: number; type: number }> = needsInit



      ? (



        this.supportsColorFloat



          ? [



              { internal: gl.RGBA16F, type: gl.HALF_FLOAT },



              { internal: gl.RGBA8, type: gl.UNSIGNED_BYTE },



            ]



          : [{ internal: gl.RGBA8, type: gl.UNSIGNED_BYTE }]



      )



      : [{ internal: this.rayAuxInternalFormat, type: this.rayAuxType }];







    let ok = false;



    for (const cand of candidates) {



      gl.bindTexture(gl.TEXTURE_2D, res.rayAuxTex);



      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);



      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);



      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);



      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);



      gl.texImage2D(gl.TEXTURE_2D, 0, cand.internal, width, height, 0, gl.RGBA, cand.type, null);







      gl.bindFramebuffer(gl.FRAMEBUFFER, res.rayFbo);



      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, res.rayColorTex, 0);



      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, res.rayAuxTex, 0);



      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);



      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);



      if (status === gl.FRAMEBUFFER_COMPLETE) {



        this.rayAuxInternalFormat = cand.internal;



        this.rayAuxType = cand.type;



        ok = true;



        break;



      } else {



        console.warn("[Hull3DRenderer] Ray FBO incomplete, retrying with fallback format", status);



      }



    }







    gl.bindFramebuffer(gl.FRAMEBUFFER, null);



    gl.bindTexture(gl.TEXTURE_2D, null);







    if (!ok) {



      console.error("[Hull3DRenderer] Unable to allocate auxiliary render target");



      return false;



    }







    this.rayTargetSize = [width, height];



    return true;



  }







  private ensureDummy3D(): WebGLTexture {



    if (this.dummyVolumeTex) return this.dummyVolumeTex;



    const { gl } = this;



    const tex = gl.createTexture();



    if (!tex) {



      throw new Error("Hull3DRenderer: failed to allocate dummy 3D texture");



    }



    gl.bindTexture(gl.TEXTURE_3D, tex);



    const data = new Uint8Array([0]);



    gl.texImage3D(gl.TEXTURE_3D, 0, gl.R8, 1, 1, 1, 0, gl.RED, gl.UNSIGNED_BYTE, data);



    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);



    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);



    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);



    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);



    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);



    gl.bindTexture(gl.TEXTURE_3D, null);



    this.dummyVolumeTex = tex;



    return tex;



  }

      private ensureCurvatureTextures() {
    const { gl } = this;
    if (!this.curvature.texA) {
      this.curvature.texA = this.createCurvatureTexture();
      this.curvature.front = 0;
    }
    if (!this.curvature.texB) {
      this.curvature.texB = this.createCurvatureTexture();
    }
  }

  private createCurvatureTexture(): WebGLTexture {
    const { gl } = this;
    const tex = gl.createTexture();
    if (!tex) {
      throw new Error("Hull3DRenderer: failed to allocate curvature texture");
    }
    gl.bindTexture(gl.TEXTURE_3D, tex);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.R32F, 1, 1, 1, 0, gl.RED, gl.FLOAT, new Float32Array([0]));
    gl.bindTexture(gl.TEXTURE_3D, null);
    return tex;
  }

  private ensureCurvatureFallback(): WebGLTexture {
    if (this.curvature.fallback) return this.curvature.fallback;
    const tex = this.createCurvatureTexture();
    this.curvature.fallback = tex;
    return tex;
  }

  private getActiveCurvatureTexture(): WebGLTexture {
    this.ensureCurvatureTextures();
    const active = this.curvature.front === 0 ? this.curvature.texA : this.curvature.texB;
    return active ?? this.ensureCurvatureFallback();
  }

  private handleCurvatureBrick(payload: any) {
    if (!payload || typeof payload !== "object") return;

    const versionRaw = Number((payload as any).version ?? 0);
    if (!Number.isFinite(versionRaw)) return;
    if (versionRaw <= this.curvature.version) return;

    const dimsRaw = (payload as any).dims;
    if (!Array.isArray(dimsRaw) || dimsRaw.length !== 3) return;

    const dims: [number, number, number] = [
      Math.max(1, Number(dimsRaw[0]) | 0),
      Math.max(1, Number(dimsRaw[1]) | 0),
      Math.max(1, Number(dimsRaw[2]) | 0),
    ];

    const dataSource = (payload as any).data;
    let data: Float32Array | null = null;
    if (dataSource instanceof Float32Array) {
      data = dataSource;
    } else if (dataSource instanceof ArrayBuffer) {
      data = new Float32Array(dataSource);
    } else if (Array.isArray(dataSource)) {
      data = new Float32Array(dataSource);
    } else if (dataSource && ArrayBuffer.isView(dataSource) && dataSource.buffer instanceof ArrayBuffer) {
      try {
        data = new Float32Array(dataSource.buffer);
      } catch {
        data = null;
      }
    }

    if (!data) return;

    const expected = dims[0] * dims[1] * dims[2];
    if (data.length < expected) return;

    const upload = data.length === expected ? data : data.subarray(0, expected);

    const alphaRaw = Number((payload as any).emaAlpha);
    const emaAlpha = Number.isFinite(alphaRaw) ? Math.min(1, Math.max(1e-3, alphaRaw)) : 0.18;
    const clampMinRaw = Number((payload as any).residualMin);
    const clampMaxRaw = Number((payload as any).residualMax);
    let clampMin = Number.isFinite(clampMinRaw) ? clampMinRaw : -8.0;
    let clampMax = Number.isFinite(clampMaxRaw) ? clampMaxRaw : 8.0;
    if (clampMax < clampMin) {
      const tmp = clampMax;
      clampMax = clampMin;
      clampMin = tmp;
    }
    const resized = this.curvature.emaResidual.length !== expected;
    if (resized) {
      this.curvature.emaResidual = new Float32Array(expected);
    }
    const ema = this.curvature.emaResidual;
    const prime = resized || !this.curvature.hasData;
    for (let i = 0; i < expected; i++) {
      const sample = Number.isFinite(upload[i]) ? upload[i] : 0;
      const target = Math.min(clampMax, Math.max(clampMin, sample));
      if (prime) {
        ema[i] = target;
      } else {
        const prev = ema[i];
        const blended = prev + (target - prev) * emaAlpha;
        ema[i] = Math.min(clampMax, Math.max(clampMin, blended));
      }
    }

    this.ensureCurvatureTextures();
    const back = this.curvature.front === 0 ? this.curvature.texB : this.curvature.texA;
    if (!back) return;

    const { gl } = this;
    gl.bindTexture(gl.TEXTURE_3D, back);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.R32F, dims[0], dims[1], dims[2], 0, gl.RED, gl.FLOAT, ema);
    gl.bindTexture(gl.TEXTURE_3D, null);

    this.curvature.front = (this.curvature.front ^ 1) as 0 | 1;
    this.curvature.dims = dims;
    this.curvature.version = versionRaw;
    this.curvature.updatedAt = Number((payload as any).updatedAt ?? Date.now());
    this.curvature.hasData = true;
  }





  private ensureFallback2D(): WebGLTexture {



    if (this.fallbackTex2D) return this.fallbackTex2D;



    const { gl } = this;



    const tex = gl.createTexture();



    if (!tex) {



      throw new Error("Hull3DRenderer: failed to allocate fallback 2D texture");



    }



    gl.bindTexture(gl.TEXTURE_2D, tex);



    const data = new Uint8Array([0, 0, 0, 255]);



    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);



    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);



    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);



    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);



    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);



    gl.bindTexture(gl.TEXTURE_2D, null);



    this.fallbackTex2D = tex;



    return tex;



  }







  private ensureHarnessWhiteProgram() {



    if (this.harnessWhiteProgram) return;



    try {



      this.harnessWhiteProgram = linkProgram(this.gl, "Hull3D::testWhite", WHITE_TEST_VS, WHITE_TEST_FS);



    } catch (err) {



      console.error("[Hull3DRenderer] Failed to create harness white shader", err);



      this.harnessWhiteProgram = null;



    }



  }







  private runDiagnosticProbe(state: Hull3DRendererState, camera: { eye: Vec3 }, invViewProj: Float32Array) {



    try {



      this.ensureDiagFBO();



      const { gl } = this;



      if (!this.diagFBO || !this.diagColorTex || !this.resources.rayProgram || !this.ringInstantTex || !this.radialTex) {



        this._diag.state = 'idle';



        return;



      }



      const prevFb = gl.getParameter(gl.FRAMEBUFFER_BINDING);



      const prevViewport = gl.getParameter(gl.VIEWPORT) as Int32Array;



      gl.bindFramebuffer(gl.FRAMEBUFFER, this.diagFBO);



      gl.viewport(0, 0, this.diagSize, this.diagSize);



      gl.clearColor(0, 0, 0, 1);



      gl.clearColor(0, 0, 0, 0);



      gl.clear(gl.COLOR_BUFFER_BIT);



      gl.useProgram(this.resources.rayProgram);



      const loc = {



        u_volume: gl.getUniformLocation(this.resources.rayProgram, "u_volume"),



        u_ringInstant: gl.getUniformLocation(this.resources.rayProgram, "u_ringInstant"),



        u_ringAverage: gl.getUniformLocation(this.resources.rayProgram, "u_ringAverage"),



        u_radialLUT: gl.getUniformLocation(this.resources.rayProgram, "u_radialLUT"),



        u_curvTex: gl.getUniformLocation(this.resources.rayProgram, "u_curvTex"),



        u_curvGain: gl.getUniformLocation(this.resources.rayProgram, "u_curvGain"),



        u_curvAlpha: gl.getUniformLocation(this.resources.rayProgram, "u_curvAlpha"),



        u_curvPaletteMode: gl.getUniformLocation(this.resources.rayProgram, "u_curvPaletteMode"),



        u_axes: gl.getUniformLocation(this.resources.rayProgram, "u_axes"),



        u_domainScale: gl.getUniformLocation(this.resources.rayProgram, "u_domainScale"),



        u_beta: gl.getUniformLocation(this.resources.rayProgram, "u_beta"),



        u_ampChain: gl.getUniformLocation(this.resources.rayProgram, "u_ampChain"),



        u_gate: gl.getUniformLocation(this.resources.rayProgram, "u_gate"),



        u_fActive: gl.getUniformLocation(this.resources.rayProgram, "u_fActive"),



        u_lumpExp: gl.getUniformLocation(this.resources.rayProgram, "u_lumpExp"),



        u_phase01: gl.getUniformLocation(this.resources.rayProgram, "u_phase01"),



        u_phaseSign: gl.getUniformLocation(this.resources.rayProgram, "u_phaseSign"),



        u_blend: gl.getUniformLocation(this.resources.rayProgram, "u_blend"),



        u_densityScale: gl.getUniformLocation(this.resources.rayProgram, "u_densityScale"),



        u_stepBias: gl.getUniformLocation(this.resources.rayProgram, "u_stepBias"),



        u_maxSteps: gl.getUniformLocation(this.resources.rayProgram, "u_maxSteps"),



        u_radialScale: gl.getUniformLocation(this.resources.rayProgram, "u_radialScale"),



        u_radialMax: gl.getUniformLocation(this.resources.rayProgram, "u_radialMax"),



        u_invR: gl.getUniformLocation(this.resources.rayProgram, "u_invR"),



        u_timeSec: gl.getUniformLocation(this.resources.rayProgram, "u_timeSec"),



  u_sigma: gl.getUniformLocation(this.resources.rayProgram, "u_sigma"),



        u_cameraPos: gl.getUniformLocation(this.resources.rayProgram, "u_cameraPos"),



        u_invViewProj: gl.getUniformLocation(this.resources.rayProgram, "u_invViewProj"),



        u_forceFlatGate: gl.getUniformLocation(this.resources.rayProgram, "u_forceFlatGate"),



        u_debugMode: gl.getUniformLocation(this.resources.rayProgram, "u_debugMode"),



        u_probeMode: gl.getUniformLocation(this.resources.rayProgram, "u_probeMode"),



        u_probeGain: gl.getUniformLocation(this.resources.rayProgram, "u_probeGain"),



        u_testMode: gl.getUniformLocation(this.resources.rayProgram, "u_testMode"),



        u_baseScale: gl.getUniformLocation(this.resources.rayProgram, "u_baseScale"),



        u_volumeViz: gl.getUniformLocation(this.resources.rayProgram, "u_volumeViz"),



        u_grThetaGain: gl.getUniformLocation(this.resources.rayProgram, "u_grThetaGain"),



        u_grRhoGain: gl.getUniformLocation(this.resources.rayProgram, "u_grRhoGain"),



        u_vizFloorThetaGR: gl.getUniformLocation(this.resources.rayProgram, "u_vizFloorThetaGR"),



        u_vizFloorRhoGR: gl.getUniformLocation(this.resources.rayProgram, "u_vizFloorRhoGR"),



        u_vizFloorThetaDrive: gl.getUniformLocation(this.resources.rayProgram, "u_vizFloorThetaDrive"),



      };



      const volumeTex = this.volumeTex ?? this.ensureDummy3D();



      const ringInstantTex = this.ringInstantTex!;



      const ringAverageTex = this.ringAverageTex ?? ringInstantTex;



      const curvTex = this.curvature.hasData ? this.getActiveCurvatureTexture() : this.ensureCurvatureFallback();



      gl.activeTexture(gl.TEXTURE0);



      gl.bindTexture(gl.TEXTURE_3D, volumeTex);



      gl.uniform1i(loc.u_volume, 0);



      gl.activeTexture(gl.TEXTURE1);



      gl.bindTexture(gl.TEXTURE_2D, ringInstantTex);



      gl.uniform1i(loc.u_ringInstant, 1);



      gl.activeTexture(gl.TEXTURE2);



      gl.bindTexture(gl.TEXTURE_2D, ringAverageTex);



      gl.uniform1i(loc.u_ringAverage, 2);



      gl.activeTexture(gl.TEXTURE3);



      gl.bindTexture(gl.TEXTURE_2D, this.radialTex);



      gl.uniform1i(loc.u_radialLUT, 3);



      gl.activeTexture(gl.TEXTURE4);



      gl.bindTexture(gl.TEXTURE_3D, curvTex);



      if (loc.u_curvTex) gl.uniform1i(loc.u_curvTex, 4);



      const dbgPhaseSign = (typeof window !== "undefined" && (window as any).__hullPhaseSign === -1) ? -1 : 1;



      const statePhaseSign = Math.sign(state.phaseSign ?? 1) || 1;



      this.phaseSignEffective = statePhaseSign * dbgPhaseSign;



      const userExposure = Number.isFinite(state.exposure as number) ? (state.exposure as number) : undefined;



      const exposureBase = userExposure ?? 1.0;



      const effectiveExposure = clamp(exposureBase * this.autoGain, 1e-4, 1e4);



      const densityScale = this.resolveDensityScale(state, effectiveExposure);



      this.lastDensityScale = densityScale;



      const baseScale = this.resolveBaseScale(state);



      const volumeVizIndex = this.resolveVolumeVizIndex(state);



      const gateForGain = Number.isFinite(state.gateView) ? state.gateView : state.gate;



      const driveChain = Math.abs(state.ampChain) * Math.max(gateForGain, 1e-6);



      const grThetaGain = Math.max(driveChain * 0.6, 1e-12);



      const grRhoGain = clamp(driveChain * 0.03, 1e-12, 1e12);



      this.applyRayUniforms(gl, loc, state, {



        densityScale,



        stepBias: this.qualityProfile.stepBias,



        maxSteps: Math.max(24, Math.floor(this.qualityProfile.maxSteps * 0.4)),



        cameraEye: camera.eye,



        invViewProj,



        phaseSign: this.phaseSignEffective,



        phase01: state.phase01,



        invR: 1.0 / Math.max(state.R, 1e-6),



        timeSec: state.timeSec ?? 0,



        blend: clamp(state.blendFactor, 0, 1),



        fActive: this.fActiveResolved,



        baseScale,



        sigma: state.sigma,



        volumeVizIndex,



        grThetaGain,



        grRhoGain,



        forceFlatGate: false,



        debugMode: 0,



        probeMode: 0,



        probeGain: 0,



        testMode: 0,



      });







      const probeGain = Math.max(0.1, densityScale * this.diagProbeGainFactor);



      const bufferSize = this.diagSize * this.diagSize * 4;



      if (!this.diagBuffer || this.diagBuffer.length !== bufferSize) {



        this.diagBuffer = new Uint8Array(bufferSize);



      }



      const buf = this.diagBuffer;







      const analyzeBuffer = (data: Uint8Array) => {



        let sum = 0;



        let sumAlpha = 0;



        let maxL = 0;



        const pxCount = data.length / 4;



        for (let i = 0; i < data.length; i += 4) {



          const r = data[i] / 255;



          // RGB are equal in probe mode; sample red channel.



          sum += r;



          if (r > maxL) maxL = r;



          sumAlpha += data[i + 3] / 255;



        }



        return {



          mean: pxCount > 0 ? sum / pxCount : 0,



          max: maxL,



          coverage: pxCount > 0 ? sumAlpha / pxCount : 0,



        };



      };







      const drawProbe = (mode: 'base' | 'gated') => {



        gl.clear(gl.COLOR_BUFFER_BIT);



        if (loc.u_probeMode) gl.uniform1i(loc.u_probeMode, mode === 'base' ? 1 : 2);



        if (loc.u_forceFlatGate) gl.uniform1i(loc.u_forceFlatGate, mode === 'base' ? 1 : 0);



        if (loc.u_probeGain) gl.uniform1f(loc.u_probeGain, probeGain);



        gl.bindVertexArray(this.resources.quadVao);



        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);



        gl.bindVertexArray(null);



        gl.readPixels(0, 0, this.diagSize, this.diagSize, gl.RGBA, gl.UNSIGNED_BYTE, buf!);



        return analyzeBuffer(buf!);



      };







      const baseSample = drawProbe('base');



      const gatedSample = drawProbe('gated');







      if (loc.u_forceFlatGate) gl.uniform1i(loc.u_forceFlatGate, 0);



      if (loc.u_probeMode) gl.uniform1i(loc.u_probeMode, 0);



      if (loc.u_probeGain) gl.uniform1f(loc.u_probeGain, 0);







      const coverageActiveBase = baseSample.coverage > this.diagCoverageGrace;



      const coverageActiveGated = gatedSample.coverage > this.diagCoverageGrace;



      const baseOk = !coverageActiveBase || baseSample.mean >= this.diagBaseThreshold;



      const gatedOk = !coverageActiveGated || gatedSample.mean >= this.diagGatedThreshold;







      const prevMode = this._diag.lastMode;



      let status: 'ok'|'base_dark'|'gated_dark'|'both_dark' = 'ok';



      if (!baseOk && !gatedOk) status = 'both_dark';



      else if (!baseOk) status = 'base_dark';



      else if (!gatedOk) status = 'gated_dark';







      if (status === 'ok') {



        this._diag.lowCount = 0;



        this._diag.okCount = Math.min(this.diagClearFrames, this._diag.okCount + 1);



      } else {



        this._diag.lowCount = Math.min(this.diagTripFrames, this._diag.lowCount + 1);



        this._diag.okCount = 0;



      }



      const triggered = status !== 'ok' && this._diag.lowCount >= this.diagTripFrames;



      const clearing = status === 'ok' && this._diag.okCount >= this.diagClearFrames;







      this._diag.lastMode = status;



      this._diag.lastLuma = gatedSample.mean;



      this._diag.lastCoverage = gatedSample.coverage;



      this._diag.lastOk = !triggered;







      const lumaForAuto = coverageActiveGated && gatedSample.mean > 0.0



        ? gatedSample.mean



        : (coverageActiveBase ? baseSample.mean : gatedSample.mean);



      if (userExposure === undefined) {



        const lumaSafe = Math.max(lumaForAuto, 1e-3);



        const err = this.autoTargetLuma / lumaSafe;



        const adj = clamp(Math.pow(err, this.autoAggressiveness), 0.8, 1.25);



        this.autoGain = clamp(this.autoGain * adj, this.autoGainMin, this.autoGainMax);



      }







      if (triggered) {



        let diagMsg = "Hull drive dark";



        if (status === 'gated_dark') diagMsg = "Gating zero?";



        else if (status === 'base_dark') diagMsg = "Base drive below threshold";



        const stats = this.ringLastStats;



        const rawMeanVal = stats?.rawMean;



        const meanRaw = Number.isFinite(rawMeanVal ?? NaN) ? (rawMeanVal as number) : this.fActiveResolved;



        const activeScale = 1 / Math.sqrt(Math.max(this.fActiveResolved, 1e-6));



        diagMsg += ` cov=${gatedSample.coverage.toFixed(2)} Lg=${gatedSample.mean.toFixed(3)} Lb=${baseSample.mean.toFixed(3)} meanRaw=${meanRaw.toFixed(3)} gain~${activeScale.toFixed(1)}`;



        this._diag.message = diagMsg;



        if (prevMode !== status) {



          console.warn("[Hull3DRenderer] diagnostic probe low", {



            status,



            base: baseSample,



            gated: gatedSample,



            thresholds: {



              coverage: this.diagCoverageGrace,



              base: this.diagBaseThreshold,



              gated: this.diagGatedThreshold,



            },



            phase01: Number(state.phase01.toFixed(4)),



            phaseSign: this.phaseSignEffective,



            fActive: this.fActiveResolved,



          });



        }



        if (this.diagHoldFrames > 0) {



          this._diag.state = 'holding';



          this._diag.holdLeft = this.diagHoldFrames;



        } else {



          this._diag.state = 'idle';



        }



      } else {



        if (clearing) {



          this._diag.message = "";



        }



        if (this._diag.state !== 'holding') {



          this._diag.state = 'idle';



        }



      }







      if (typeof window !== "undefined") {



        (window as any).__hullDiagMetrics = {



          status,



          triggered,



          base: baseSample,



          gated: gatedSample,



          probeGain,



          thresholds: {



            coverage: this.diagCoverageGrace,



            base: this.diagBaseThreshold,



            gated: this.diagGatedThreshold,



          },



        };



        (window as any).__hullDiagMessage = triggered



          ? {



            message: this._diag.message,



            status,



            base: baseSample,



            gated: gatedSample,



          }



          : null;



      }







      gl.bindFramebuffer(gl.FRAMEBUFFER, prevFb);



      gl.viewport(prevViewport[0], prevViewport[1], prevViewport[2], prevViewport[3]);



    } catch (e) {



      console.warn("[Hull3DRenderer] Diagnostic probe failed:", e);



      this._diag.state = 'idle';



      this._diag.lowCount = 0;



      this._diag.okCount = 0;



    }



  }







  runHull3DHealthCheck(): Record<string, HullTestResult> | null {



    if (!this.resources.rayProgram || !this.state || !this.resources.quadVao) {



      console.warn("[Hull3DRenderer] Health check unavailable (program/state not ready)");



      return null;



    }



    const state = this.state;



    const gl = this.gl;



    const results: Record<string, HullTestResult> = {};



    const prevDiag = this.diagnosticsEnabled;



    this.diagnosticsEnabled = false;



    if (!this.ringInstantTex || !this.radialTex) {



      console.warn("[Hull3DRenderer] Health check missing LUT textures");



      this.diagnosticsEnabled = prevDiag;



      return null;



    }



    this.ensureDiagFBO();



    if (!this.diagFBO || !this.diagColorTex) {



      console.warn("[Hull3DRenderer] Health check failed to allocate FBO");



      this.diagnosticsEnabled = prevDiag;



      return null;



    }



    const prevFb = gl.getParameter(gl.FRAMEBUFFER_BINDING);



    const prevViewport = gl.getParameter(gl.VIEWPORT) as Int32Array;



    const prevCull = gl.isEnabled(gl.CULL_FACE);



    const prevDepth = gl.isEnabled(gl.DEPTH_TEST);



    const prevBlend = gl.isEnabled(gl.BLEND);



    const prevDepthMask = gl.getParameter(gl.DEPTH_WRITEMASK);



    const prevSrcRGB = gl.getParameter(gl.BLEND_SRC_RGB);



    const prevDstRGB = gl.getParameter(gl.BLEND_DST_RGB);



    const prevSrcAlpha = gl.getParameter(gl.BLEND_SRC_ALPHA);



    const prevDstAlpha = gl.getParameter(gl.BLEND_DST_ALPHA);



    const prevScissor = gl.isEnabled(gl.SCISSOR_TEST);



    const prevColorMask = gl.getParameter(gl.COLOR_WRITEMASK) as boolean[];



    const prevProgram = gl.getParameter(gl.CURRENT_PROGRAM) as (WebGLProgram | null);



    const prevVAO = gl.getParameter(gl.VERTEX_ARRAY_BINDING) as (WebGLVertexArrayObject | null);



    gl.bindFramebuffer(gl.FRAMEBUFFER, this.diagFBO);



    gl.viewport(0, 0, this.diagSize, this.diagSize);



    gl.disable(gl.CULL_FACE);



    gl.disable(gl.DEPTH_TEST);



    gl.depthMask(false);



    gl.disable(gl.BLEND);



    gl.disable(gl.SCISSOR_TEST);



    gl.colorMask(true, true, true, true);



    gl.pixelStorei(gl.PACK_ALIGNMENT, 1);



    const fboBefore = gl.getParameter(gl.FRAMEBUFFER_BINDING);



    const vpBefore = gl.getParameter(gl.VIEWPORT) as Int32Array;



    console.log("[Hull3D][Health] target before draw", fboBefore, Array.from(vpBefore));



    const fActive = this.resolveFActive(state);



    this.fActiveResolved = fActive;



    let loc: Record<string, WebGLUniformLocation | null> | null = null;



    // Save/adjust domain scale for the duration of the health check



    const prevDomain = this.domainScale;



    try {



      // Expand bounds during health check for better viewport coverage



      this.domainScale = prevDomain * 1.8;



      this.ensureHarnessWhiteProgram();



      const camera = this.computeCamera(state);



      const view = lookAt(identity(), camera.eye, camera.center, [0, 1, 0]);



      const hullRadius = Math.max(Math.abs(state.axes[0]), Math.abs(state.axes[1]), Math.abs(state.axes[2])) * this.domainScale;



      const proj = perspective(identity(), camera.fov, state.aspect || 1.6, 0.2, Math.max(1000, hullRadius * 4));



      const viewProj = multiply(identity(), proj, view);



      const invViewProj = invert(identity(), viewProj) ?? identity();



      const dbgPhaseSign = (typeof window !== "undefined" && (window as any).__hullPhaseSign === -1) ? -1 : 1;



      const statePhaseSign = Math.sign(state.phaseSign ?? 1) || 1;



      this.phaseSignEffective = statePhaseSign * dbgPhaseSign;



      const userExposure = Number.isFinite(state.exposure as number) ? (state.exposure as number) : undefined;



      const exposureBase = userExposure ?? 1.0;



      const effectiveExposure = clamp(exposureBase * this.autoGain, 1e-4, 1e4);



      // Build a synthetic non-zero test state so health check isn't dependent on live duty



      const betaMag = Number.isFinite(state.beta) ? Math.abs(state.beta) : 0;



      const betaSign = (Number.isFinite(state.beta) && state.beta !== 0) ? Math.sign(state.beta) : 1;



      const betaUse = betaMag > 1e-6 ? state.beta : 0.3 * betaSign;



      const ampRaw = Number.isFinite(state.ampChain) ? state.ampChain : 0;



      const ampUse = Math.max(ampRaw, 1e14); // enforce strong synthetic magnitude for tests



      const testState: Hull3DRendererState = {



        ...state,



        // Ensure a healthy sigma for LUT generation during tests



        sigma: (Number.isFinite(state.sigma) && state.sigma > 1e-6) ? state.sigma : 6.0,



        beta: betaUse,



        gate: (Number.isFinite(state.gate) && state.gate > 0) ? state.gate : 1.0,



        gateView: (Number.isFinite(state.gateView) && state.gateView > 0)



          ? state.gateView



          : 1.0,



        ampChain: ampUse,



      };



      // Force-refresh LUTs with the synthetic test state so df/gate are visible



      const prevRadialKey = this.lastRadialKey;



      const prevRingKey = this.lastRingKey;



      this.lastRadialKey = "";



      this.lastRingKey = "";



      this.updateRadialLUT(testState);



      this.updateRingLUT(testState);



      const densityScale = this.resolveDensityScale(testState, effectiveExposure);



      const baseScale = this.resolveBaseScale(testState);



      const volumeVizIndex = this.resolveVolumeVizIndex(testState);



      loc = {



        u_volume: gl.getUniformLocation(this.resources.rayProgram, "u_volume"),



        u_ringInstant: gl.getUniformLocation(this.resources.rayProgram, "u_ringInstant"),



        u_ringAverage: gl.getUniformLocation(this.resources.rayProgram, "u_ringAverage"),



        u_radialLUT: gl.getUniformLocation(this.resources.rayProgram, "u_radialLUT"),



        u_curvTex: gl.getUniformLocation(this.resources.rayProgram, "u_curvTex"),



        u_curvGain: gl.getUniformLocation(this.resources.rayProgram, "u_curvGain"),



        u_curvAlpha: gl.getUniformLocation(this.resources.rayProgram, "u_curvAlpha"),



        u_curvPaletteMode: gl.getUniformLocation(this.resources.rayProgram, "u_curvPaletteMode"),



        u_axes: gl.getUniformLocation(this.resources.rayProgram, "u_axes"),



        u_domainScale: gl.getUniformLocation(this.resources.rayProgram, "u_domainScale"),



        u_beta: gl.getUniformLocation(this.resources.rayProgram, "u_beta"),



        u_ampChain: gl.getUniformLocation(this.resources.rayProgram, "u_ampChain"),



        u_gate: gl.getUniformLocation(this.resources.rayProgram, "u_gate"),



        u_fActive: gl.getUniformLocation(this.resources.rayProgram, "u_fActive"),



        u_lumpExp: gl.getUniformLocation(this.resources.rayProgram, "u_lumpExp"),



        u_phase01: gl.getUniformLocation(this.resources.rayProgram, "u_phase01"),



        u_phaseSign: gl.getUniformLocation(this.resources.rayProgram, "u_phaseSign"),



        u_blend: gl.getUniformLocation(this.resources.rayProgram, "u_blend"),



        u_densityScale: gl.getUniformLocation(this.resources.rayProgram, "u_densityScale"),



        u_stepBias: gl.getUniformLocation(this.resources.rayProgram, "u_stepBias"),



        u_maxSteps: gl.getUniformLocation(this.resources.rayProgram, "u_maxSteps"),



        u_radialScale: gl.getUniformLocation(this.resources.rayProgram, "u_radialScale"),



        u_radialMax: gl.getUniformLocation(this.resources.rayProgram, "u_radialMax"),



        u_invR: gl.getUniformLocation(this.resources.rayProgram, "u_invR"),



        u_timeSec: gl.getUniformLocation(this.resources.rayProgram, "u_timeSec"),



  u_sigma: gl.getUniformLocation(this.resources.rayProgram, "u_sigma"),



        u_cameraPos: gl.getUniformLocation(this.resources.rayProgram, "u_cameraPos"),



        u_invViewProj: gl.getUniformLocation(this.resources.rayProgram, "u_invViewProj"),



        u_forceFlatGate: gl.getUniformLocation(this.resources.rayProgram, "u_forceFlatGate"),



        u_debugMode: gl.getUniformLocation(this.resources.rayProgram, "u_debugMode"),



        u_probeMode: gl.getUniformLocation(this.resources.rayProgram, "u_probeMode"),



        u_probeGain: gl.getUniformLocation(this.resources.rayProgram, "u_probeGain"),



        u_testMode: gl.getUniformLocation(this.resources.rayProgram, "u_testMode"),



        u_baseScale: gl.getUniformLocation(this.resources.rayProgram, "u_baseScale"),



        u_volumeViz: gl.getUniformLocation(this.resources.rayProgram, "u_volumeViz"),



        u_grThetaGain: gl.getUniformLocation(this.resources.rayProgram, "u_grThetaGain"),



        u_grRhoGain: gl.getUniformLocation(this.resources.rayProgram, "u_grRhoGain"),



        u_vizFloorThetaGR: gl.getUniformLocation(this.resources.rayProgram, "u_vizFloorThetaGR"),



        u_vizFloorRhoGR: gl.getUniformLocation(this.resources.rayProgram, "u_vizFloorRhoGR"),



        u_vizFloorThetaDrive: gl.getUniformLocation(this.resources.rayProgram, "u_vizFloorThetaDrive"),



      };



  gl.useProgram(this.resources.rayProgram);



      const volumeTex = this.volumeTex ?? this.ensureDummy3D();



      const ringInstantTex = this.ringInstantTex!;



      const ringAverageTex = this.ringAverageTex ?? ringInstantTex;



      const curvTex = this.curvature.hasData ? this.getActiveCurvatureTexture() : this.ensureCurvatureFallback();



      gl.activeTexture(gl.TEXTURE0);



      gl.bindTexture(gl.TEXTURE_3D, volumeTex);



      gl.uniform1i(loc.u_volume, 0);



      gl.activeTexture(gl.TEXTURE1);



      gl.bindTexture(gl.TEXTURE_2D, ringInstantTex);



      gl.uniform1i(loc.u_ringInstant, 1);



      gl.activeTexture(gl.TEXTURE2);



      gl.bindTexture(gl.TEXTURE_2D, ringAverageTex);



      gl.uniform1i(loc.u_ringAverage, 2);



      gl.activeTexture(gl.TEXTURE3);



      gl.bindTexture(gl.TEXTURE_2D, this.radialTex);



      gl.uniform1i(loc.u_radialLUT, 3);



      gl.activeTexture(gl.TEXTURE4);



      gl.bindTexture(gl.TEXTURE_3D, curvTex);



      if (loc.u_curvTex) gl.uniform1i(loc.u_curvTex, 4);







      const harnessDriveChain = Math.abs(testState.ampChain) * Math.max(testState.gate, 1e-6);



      const harnessThetaGain = Math.max(harnessDriveChain * 0.6, 1e-12);



      const harnessRhoGain = clamp(harnessDriveChain * 0.03, 1e-12, 1e12);



      const baseParams: RayUniformParams = {



        densityScale,



        stepBias: this.qualityProfile.stepBias,



        // Use full step budget in health harness to resolve the thin r≈1 band reliably



        maxSteps: Math.max(32, this.qualityProfile.maxSteps),



        cameraEye: camera.eye,



        invViewProj,



        phaseSign: this.phaseSignEffective,



        phase01: testState.phase01,



        invR: 1.0 / Math.max(testState.R, 1e-6),



        timeSec: testState.timeSec ?? 0,



        // For tests, avoid dependency on unseeded ring-average texture



        blend: 0.0,



        fActive,



        baseScale,



        sigma: testState.sigma,



        volumeVizIndex,



        grThetaGain: harnessThetaGain,



        grRhoGain: harnessRhoGain,



        forceFlatGate: false,



        debugMode: 0,



        probeMode: 0,



        probeGain: 0,



      testMode: 0,



    };



    const axesForLog = [



      Math.max(Math.abs(state.axes[0]), 1e-6) * this.domainScale,



      Math.max(Math.abs(state.axes[1]), 1e-6) * this.domainScale,



      Math.max(Math.abs(state.axes[2]), 1e-6) * this.domainScale,



    ];



    console.log("[Hull3D][Health] camera", {



      eye: [camera.eye[0], camera.eye[1], camera.eye[2]],



      bounds: axesForLog,



      domainScale: this.domainScale,



    });



    const offsets = [



      [Math.floor(this.diagSize * 0.25), Math.floor(this.diagSize * 0.25)],



      [Math.floor(this.diagSize * 0.75), Math.floor(this.diagSize * 0.25)],



      [Math.floor(this.diagSize * 0.25), Math.floor(this.diagSize * 0.75)],



      [Math.floor(this.diagSize * 0.75), Math.floor(this.diagSize * 0.75)],



      ];



      // Full-frame analyzer: read entire FBO to robustly capture thin band coverage



      const analyzeFrame = (): { luma: number; alpha: number } => {



        const bufSize = this.diagSize * this.diagSize * 4;



        const fbBuf = new Uint8Array(bufSize);



        gl.readPixels(0, 0, this.diagSize, this.diagSize, gl.RGBA, gl.UNSIGNED_BYTE, fbBuf);



        let sumL = 0;



        let sumA = 0;



        const pxCount = this.diagSize * this.diagSize;



        for (let i = 0; i < fbBuf.length; i += 4) {



          const r = fbBuf[i] / 255;



          const g = fbBuf[i + 1] / 255;



          const b = fbBuf[i + 2] / 255;



          const a = fbBuf[i + 3] / 255;



          sumL += 0.2126 * r + 0.7152 * g + 0.0722 * b;



          sumA += a;



        }



        const denom = Math.max(1, pxCount);



        return { luma: sumL / denom, alpha: sumA / denom };



      };







      if (this.harnessWhiteProgram && this.resources.quadVao) {



      gl.clearColor(0, 0, 0, 0);



      gl.clear(gl.COLOR_BUFFER_BIT);



        gl.useProgram(this.harnessWhiteProgram);



        gl.bindVertexArray(this.resources.quadVao);



        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);



        const sampleWhite = analyzeFrame();



        const passWhite = sampleWhite.luma > 0.9;



        results["T0_whiteTriangle"] = { luma: sampleWhite.luma, alpha: sampleWhite.alpha, pass: passWhite };



        console.log(`[Hull3D][T0_whiteTriangle] ${passWhite ? "PASS" : "FAIL"}`, sampleWhite);



      } else {



        console.warn("[Hull3DRenderer] Health check missing white shader or quad VAO");



      }







      const run = (



        mode: number,



        name: string,



        expect: (sample: { luma: number; alpha: number }) => boolean,



        override?: Partial<Pick<RayUniformParams, "forceFlatGate" | "baseScale">>



      ) => {



        gl.useProgram(this.resources.rayProgram);



        gl.clearColor(0, 0, 0, 0);



        gl.clear(gl.COLOR_BUFFER_BIT);



        const params: RayUniformParams = {



          ...baseParams,



          testMode: mode,



          forceFlatGate: override?.forceFlatGate ?? baseParams.forceFlatGate,



          baseScale: override?.baseScale ?? baseParams.baseScale,



        };



        // For health tests, always apply synthetic non-zero testState



        this.applyRayUniforms(gl, loc!, testState, params);



        gl.bindVertexArray(this.resources.quadVao);



        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);



        gl.bindVertexArray(null);



        const sample = analyzeFrame();



        const pass = expect(sample);



        const result: HullTestResult = { luma: sample.luma, alpha: sample.alpha, pass };



        results[name] = result;



        console.log(`[Hull3D][${name}] ${pass ? "PASS" : "FAIL"}`, sample);



      };







      run(1, "T1_constWhite", (s) => s.luma > 0.9);



  // Band-related tests: allow modest thresholds, since ring covers a thin area of the frame



  run(2, "T2_bandWhite", (s) => s.alpha > 0.02 && s.luma > 0.02);



  run(3, "T3_dfOnly", (s) => s.alpha > 0.02 && s.luma > 0.02);



  run(4, "T4_gateOnly", (s) => s.alpha > 0.02 && s.luma > 0.02, { forceFlatGate: true });



      // Ensure base-only uses a sufficient synthetic magnitude for visibility



  const baseScaleForTests = Math.max(baseScale, 6e13);



  run(5, "T5_baseOnly", (s) => s.luma > 0.05, { baseScale: baseScaleForTests, forceFlatGate: true });



  // Field magnitude: average across full frame; keep threshold gentle



  run(6, "T6_thetaAbs", (s) => s.luma > 0.01, { baseScale: baseScaleForTests, forceFlatGate: true });



      // Intersection: assert alpha (coverage of hits), not luma of red



      run(7, "T7_intersect", (s) => s.alpha > 0.5);



      const boundAfter = gl.getParameter(gl.FRAMEBUFFER_BINDING);



      const vpAfter = gl.getParameter(gl.VIEWPORT) as Int32Array;



      if (boundAfter !== this.diagFBO) {



        console.warn("[Hull3DRenderer] Health harness detected FBO switch during tests", {



          expected: this.diagFBO,



          actual: boundAfter,



        });



      }



      if (vpAfter[2] !== this.diagSize || vpAfter[3] !== this.diagSize) {



        console.warn("[Hull3DRenderer] Health harness detected viewport change during tests", {



          expected: [0, 0, this.diagSize, this.diagSize],



          actual: Array.from(vpAfter),



        });



      }



    } finally {



      // Restore LUT keys after harness



      // Note: we don't revert textures on GPU; next normal update() will refresh them.



      // Keeping keys empty forces a rebuild on next update(), which is safe.



      if (loc?.u_testMode) gl.uniform1i(loc.u_testMode, 0);



      if (loc?.u_forceFlatGate) gl.uniform1i(loc.u_forceFlatGate, 0);



      if (loc?.u_probeMode) gl.uniform1i(loc.u_probeMode, 0);







    gl.bindFramebuffer(gl.FRAMEBUFFER, prevFb);



    gl.viewport(prevViewport[0], prevViewport[1], prevViewport[2], prevViewport[3]);



  // Restore domain scale after health harness



  // (Avoid affecting normal draw bounds/camera sizing.)



  this.domainScale = prevDomain;



    if (prevCull) gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE);



    if (prevDepth) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST);



    gl.depthMask(!!prevDepthMask);



    gl.blendFuncSeparate(prevSrcRGB, prevDstRGB, prevSrcAlpha, prevDstAlpha);



    if (prevBlend) gl.enable(gl.BLEND); else gl.disable(gl.BLEND);



    if (prevScissor) gl.enable(gl.SCISSOR_TEST); else gl.disable(gl.SCISSOR_TEST);



    gl.colorMask(prevColorMask[0], prevColorMask[1], prevColorMask[2], prevColorMask[3]);



    gl.bindVertexArray(prevVAO);



    gl.useProgram(prevProgram);



    this.diagnosticsEnabled = prevDiag;



    this._diag.state = 'idle';



    this._diag.lowCount = 0;



    this._diag.okCount = 0;



    this._diag.message = "";



    this._diag.lastOk = true;



    this._diag.lastMode = 'ok';



    (window as any).__hullTests = results;



    return results;



    }



  }







  private computeCamera(state: Hull3DRendererState) {



    const baseYaw = 0.65 * Math.PI;



    const timeSec = Number.isFinite(state.timeSec) ? state.timeSec : performance.now() * 0.001;



    // Initialize time



    if (this.lastTimeSec === 0) this.lastTimeSec = timeSec;



    const dtFrame = Math.max(0, timeSec - this.lastTimeSec);







    // Update internal phase smoother from raw phase01 when available



    if (!this.phaseInit) {



      this.phaseCont = state.phase01;



      this.phaseVel = 0;



      this.lastPhaseRaw = state.phase01;



      this.lastPhaseTime = timeSec;



      this.phaseInit = true;



    } else {



      const dtObs = Math.max(0, timeSec - this.lastPhaseTime);



      if (dtObs > 1e-4) {



        // Unwrap delta with direction preference to avoid random sign flips at wrap



        const unwrapDelta = (prevRaw: number, currRaw: number, preferSign: number) => {



          // forward difference in [0,1)



          const forward = ((currRaw - prevRaw) % 1 + 1) % 1;



          // shortest path in [-0.5, 0.5]



          const short = forward > 0.5 ? forward - 1 : forward;



          if (preferSign === 0 || Math.abs(short) < 1e-4) return short;



          const sShort = short > 0 ? 1 : (short < 0 ? -1 : 0);



          if (sShort === preferSign) return short;



          // choose the alternative wrap to maintain direction



          return short + preferSign; // add/subtract 1 cycle



        };



        const velHyst = 0.02; // cycles/sec below which direction is considered neutral



        const preferSign = Math.abs(this.phaseVel) > velHyst ? (this.phaseVel > 0 ? 1 : -1) : 0;



        const d = unwrapDelta(this.lastPhaseRaw, state.phase01, preferSign);



        const instVel = d / dtObs; // cycles/sec



        // Mild smoothing of velocity estimate and clamp to sane range



        const velTarget = Math.max(-4, Math.min(4, instVel));



        this.phaseVel = this.phaseVel + (velTarget - this.phaseVel) * 0.25;



        this.lastPhaseRaw = state.phase01;



        this.lastPhaseTime = timeSec;



      }



      // Integrate to continuous phase even when raw holds constant between updates



      this.phaseCont += this.phaseVel * dtFrame;



    }







    const phaseOffset = state.followPhase ? this.phaseCont * TWO_PI : 0;



    const targetYaw = baseYaw + phaseOffset;



    const targetPitch = clamp(0.18 * Math.PI, 0.1, 0.35);



    const hx = Math.abs(state.axes[0]) * this.domainScale;



    const hy = Math.abs(state.axes[1]) * this.domainScale;



    const hz = Math.abs(state.axes[2]) * this.domainScale;



    const hullRadius = Math.max(hx, hy, hz);



    const targetDist = Math.max(hullRadius * 1.35, state.R * 4.2, 12);







    // Initialize on first run to avoid jump



    if (!this.camInit) {



      this.camYaw = targetYaw;



      this.camPitch = targetPitch;



      this.camDist = targetDist;



      this.camInit = true;



    } else {



      // Smoothly track targets; unwrap yaw to shortest angular path



      const deltaYaw = Math.atan2(Math.sin(targetYaw - this.camYaw), Math.cos(targetYaw - this.camYaw));



      this.camYaw += deltaYaw * this.camSmoothing;



      this.camPitch += (targetPitch - this.camPitch) * this.camSmoothing;



      this.camDist += (targetDist - this.camDist) * this.camSmoothing;



    }







    const cy = Math.cos(this.camYaw), sy = Math.sin(this.camYaw);



    const cp = Math.cos(this.camPitch), sp = Math.sin(this.camPitch);



    const distance = this.camDist;



    const eye: Vec3 = [



      cy * cp * distance,



      sp * distance,



      sy * cp * distance,



    ];



    const center: Vec3 = [0, 0, 0];



    this.lastTimeSec = timeSec;



    return { eye, center, fov: 45 * (Math.PI / 180) };



  }







  private drawOverlays(mvp: Float32Array, state: Hull3DRendererState) {



    const { gl } = this;



    const overlayFlags = readOverlayFlags();



    const showHeatmapRing = !!overlayFlags.showHeatmapRing;



    const showShellBands = !!overlayFlags.showShellBands;



    const showPhaseTracer = !!overlayFlags.showPhaseTracer;



    const showReciprocity = !!overlayFlags.showReciprocity;



    const ringProgram = this.resources.ringOverlayProgram;



    const simpleProgram = this.resources.overlayProgram;



    const ringReady = Boolean(

      ringProgram &&

      this.overlay.ringVao &&

      this.overlay.ringVertexCount > 0

    );



    const shouldDrawRing = ringReady && (

      state.showSectorRing ||

      showHeatmapRing ||

      showShellBands ||

      showPhaseTracer ||

      showReciprocity

    );



    if (shouldDrawRing && ringProgram && this.overlay.ringVao) {



      const loc = {



        u_mvp: gl.getUniformLocation(ringProgram, "u_mvp"),



        u_baseColor: gl.getUniformLocation(ringProgram, "u_baseColor"),



        u_baseAlpha: gl.getUniformLocation(ringProgram, "u_baseAlpha"),



        u_mode: gl.getUniformLocation(ringProgram, "u_mode"),



        u_ringAvg: gl.getUniformLocation(ringProgram, "u_ringAvg"),



        u_ringInst: gl.getUniformLocation(ringProgram, "u_ringInst"),



        u_radialLUT: gl.getUniformLocation(ringProgram, "u_radialLUT"),



        u_ringBlend: gl.getUniformLocation(ringProgram, "u_ringBlend"),



        u_phaseSign: gl.getUniformLocation(ringProgram, "u_phaseSign"),



        u_phase01: gl.getUniformLocation(ringProgram, "u_phase01"),



        u_showPhaseTracer: gl.getUniformLocation(ringProgram, "u_showPhaseTracer"),



        u_axes: gl.getUniformLocation(ringProgram, "u_axes"),



        u_R: gl.getUniformLocation(ringProgram, "u_R"),



        u_dfdrMax: gl.getUniformLocation(ringProgram, "u_dfdrMax"),



      } as const;



      gl.enable(gl.BLEND);



      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);



      gl.useProgram(ringProgram);



      if (loc.u_mvp) gl.uniformMatrix4fv(loc.u_mvp, false, mvp);



      const baseAlpha = state.showSectorRing ? 0.45 : 0.25;



      if (loc.u_baseColor) gl.uniform3f(loc.u_baseColor, 0.21, 0.85, 0.56);



      if (loc.u_baseAlpha) gl.uniform1f(loc.u_baseAlpha, baseAlpha);



      let ringMode = 0;



      if (showHeatmapRing) ringMode = 1;



      else if (showShellBands) ringMode = 2;



      if (loc.u_mode) gl.uniform1i(loc.u_mode, ringMode);



      if (loc.u_ringBlend) gl.uniform1f(loc.u_ringBlend, clamp(state.blendFactor, 0, 1));



      if (loc.u_phaseSign) gl.uniform1f(loc.u_phaseSign, this.phaseSignEffective);



      const phaseUniform = showPhaseTracer ? (state.phase01 ?? -1) : -1;



      this.uniformCache.set1f(gl, loc.u_phase01, phaseUniform);



      if (loc.u_showPhaseTracer) gl.uniform1i(loc.u_showPhaseTracer, showPhaseTracer ? 1 : 0);



      if (loc.u_axes) gl.uniform3f(loc.u_axes, state.axes[0], state.axes[1], state.axes[2]);



      if (loc.u_R) gl.uniform1f(loc.u_R, Math.max(state.R, 1e-3));



      if (loc.u_dfdrMax) gl.uniform1f(loc.u_dfdrMax, Math.max(this.radialDfMax, 1e-6));



      const ringInstantTex = this.ringInstantTex ?? this.ensureFallback2D();



      const ringAverageTex = this.ringAverageTex ?? ringInstantTex;



      const curvTex = this.curvature.hasData ? this.getActiveCurvatureTexture() : this.ensureCurvatureFallback();



      const radialTex = this.radialTex ?? this.ensureFallback2D();



      gl.activeTexture(gl.TEXTURE6);



      gl.bindTexture(gl.TEXTURE_2D, ringAverageTex);



      if (loc.u_ringAvg) gl.uniform1i(loc.u_ringAvg, 6);



      gl.activeTexture(gl.TEXTURE7);



      gl.bindTexture(gl.TEXTURE_2D, ringInstantTex);



      if (loc.u_ringInst) gl.uniform1i(loc.u_ringInst, 7);



      gl.activeTexture(gl.TEXTURE8);



      gl.bindTexture(gl.TEXTURE_2D, radialTex);



      if (loc.u_radialLUT) gl.uniform1i(loc.u_radialLUT, 8);



      gl.bindVertexArray(this.overlay.ringVao);



      gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.overlay.ringVertexCount);



      gl.bindVertexArray(null);



      gl.disable(gl.BLEND);



      gl.activeTexture(gl.TEXTURE8);



      gl.bindTexture(gl.TEXTURE_2D, null);



      gl.activeTexture(gl.TEXTURE7);



      gl.bindTexture(gl.TEXTURE_2D, null);



      gl.activeTexture(gl.TEXTURE6);



      gl.bindTexture(gl.TEXTURE_2D, null);



      gl.activeTexture(gl.TEXTURE0);



    }



    if (!simpleProgram) return;



    gl.useProgram(simpleProgram);



    const loc = {



      u_mvp: gl.getUniformLocation(simpleProgram, "u_mvp"),



      u_color: gl.getUniformLocation(simpleProgram, "u_color"),



      u_alpha: gl.getUniformLocation(simpleProgram, "u_alpha"),



    } as const;



    if (loc.u_mvp) gl.uniformMatrix4fv(loc.u_mvp, false, mvp);



    if (state.showGhostSlice && this.overlay.sliceVao) {



      gl.enable(gl.BLEND);



      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);



      if (loc.u_color) gl.uniform3f(loc.u_color, 0.4, 0.7, 0.95);



      if (loc.u_alpha) gl.uniform1f(loc.u_alpha, 0.06);



      gl.bindVertexArray(this.overlay.sliceVao);



      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);



      if (loc.u_alpha) gl.uniform1f(loc.u_alpha, 0.18);



      gl.drawArrays(gl.LINE_LOOP, 0, 4);



      gl.bindVertexArray(null);



      gl.disable(gl.BLEND);



    }



    if ((this._diag.state === 'holding' || !this._diag.lastOk) && this._diag.message) {



      const pad = 18;



      const w = Math.max(96, Math.floor(this.canvas.width * 0.18));



      const h = Math.max(48, Math.floor(this.canvas.height * 0.12));



      const y = this.canvas.height - h - pad;



      const prevClear = gl.getParameter(gl.COLOR_CLEAR_VALUE) as Float32Array;



      gl.enable(gl.SCISSOR_TEST);



      gl.scissor(pad, y, w, h);



      gl.clearColor(0.24, 0.08, 0.08, 1.0);



      gl.clear(gl.COLOR_BUFFER_BIT);



      gl.disable(gl.SCISSOR_TEST);



      gl.clearColor(prevClear[0], prevClear[1], prevClear[2], prevClear[3]);



    }



  }







  private resolveFActive(state: Hull3DRendererState) {



    const raw = Number(state.fActive);



    if (Number.isFinite(raw) && raw > 1e-6) {



      return clamp(raw, 1e-6, 1);



    }



    const statsRaw = this.ringLastStats?.rawMean;



    if (typeof statsRaw === "number" && Number.isFinite(statsRaw) && statsRaw > 1e-6) {



      return clamp(statsRaw, 1e-6, 1);



    }



    let fActive = 0;



    if (fActive <= 1e-6) {



      const totalRaw = Number.isFinite(state.totalSectors) ? Math.max(0, state.totalSectors) : 0;



      const liveRaw = Number.isFinite(state.liveSectors) ? Math.max(0, state.liveSectors) : 0;



      const dutyRaw = Number.isFinite(state.duty) ? Math.max(0, state.duty) : 0;



      const totalSafe = Math.max(1, totalRaw);



      const sectorFrac = totalRaw > 0 ? Math.max(1 / totalSafe, liveRaw / totalSafe) : 0;



      fActive = Math.max(sectorFrac, dutyRaw);



    }



    return clamp(fActive, 1e-6, 1);



  }







  private resolveVolumeViz(state: Hull3DRendererState): Hull3DVolumeViz {



    const mode = state.volumeViz ?? this.volumeViz;



    if (mode === "theta_gr" || mode === "rho_gr" || mode === "theta_drive") {



      return mode;



    }



    return "theta_drive";



  }







  setVolumeViz(mode: Hull3DVolumeViz) {



    this.volumeViz = mode;



    if (this.state) {



      this.state.volumeViz = mode;



    }



  }







  private resolveVolumeVizIndex(state: Hull3DRendererState): 0 | 1 | 2 {



    return VOLUME_VIZ_TO_INDEX[this.resolveVolumeViz(state)];



  }







  private captureDebugTap() {



    const { gl } = this;



    if (!gl || this.canvas.width <= 0 || this.canvas.height <= 0) return;



    if (!this.debugTapBuffer) {



      this.debugTapBuffer = new Uint8Array(4);



    }



    const buf = this.debugTapBuffer;



    const decodeLogVis = (channel: number) => {



      const norm = channel / 255;



      const exponent = norm * 100 - 60;



      return Math.pow(2, exponent);



    };



    const win = typeof window !== "undefined" ? (window as any) : undefined;



    const manual = win?.__hullTapPixel;



    const points: Array<{ x: number; y: number }> = [];



    if (manual) {



      if (Array.isArray(manual) && manual.length >= 2) {



        points.push({



          x: Math.round(manual[0]),



          y: Math.round(manual[1]),



        });



      } else if (typeof manual === "object" && Number.isFinite(manual.x) && Number.isFinite(manual.y)) {



        points.push({



          x: Math.round(manual.x),



          y: Math.round(manual.y),



        });



      }



    }



    if (points.length === 0) {



      const gridRaw = Number(win?.__hullTapGrid);



      const grid = Number.isFinite(gridRaw) ? clamp(Math.round(gridRaw), 2, 24) : 9;



      const stepX = this.canvas.width / grid;



      const stepY = this.canvas.height / grid;



      for (let gy = 0; gy < grid; gy++) {



        for (let gx = 0; gx < grid; gx++) {



          const sx = Math.min(Math.max(Math.round((gx + 0.5) * stepX), 0), this.canvas.width - 1);



          const sy = Math.min(Math.max(Math.round((gy + 0.5) * stepY), 0), this.canvas.height - 1);



          points.push({ x: sx, y: sy });



        }



      }



    }



    type TapSample = {



      raw: number;



      boosted: number;



      density: number;



      drive: number;



      ratio: number;



      driveBoost: number;



      densityScale: number;



      pixel: [number, number];



    };



    let best: TapSample | null = null;



    const collect: TapSample[] | null = win?.__hullTapCollect ? [] : null;



    for (const pt of points) {



      gl.readPixels(pt.x, pt.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);



      const raw = decodeLogVis(buf[0]);



      const boosted = decodeLogVis(buf[1]);



      const density = decodeLogVis(buf[2]);



      const drive = decodeLogVis(buf[3]);



      const ratio = boosted / Math.max(raw, 1e-36);



      const driveBoost = drive / Math.max(raw, 1e-36);



      const tap = {



        raw,



        boosted,



        density,



        drive,



        ratio,



        driveBoost,



        densityScale: this.lastDensityScale,



        pixel: [pt.x, pt.y] as [number, number],



      };



      if (!best || boosted > best.boosted) {



        best = tap;



      }



      if (collect) collect.push(tap);



    }



    if (best && win) {



      win.__hullFieldTap = best;



      if (collect) win.__hullFieldTapSamples = collect;



    }



    if (best && (this.debugCounter % 60) === 0) {



      console.log("[Hull3D][tap]", best);



    }



  }







  private resolveBaseScale(state: Hull3DRendererState): number {



    const viz = this.resolveVolumeViz(state);



    if (viz === "theta_gr") {



      return state.beta;



    }



    if (viz === "rho_gr") {



      return state.beta * state.beta;



    }



    return state.ampChain * state.beta * state.gate;



  }







  private resolveDensityScale(state: Hull3DRendererState, effectiveExposure: number) {



    const viz = this.resolveVolumeViz(state);



    const dfMax = Math.max(this.radialDfMax, 1e-6);



    const beta = Number.isFinite(state.beta) ? state.beta : 0;



    let rawMag: number;



    if (viz === "theta_gr") {



      rawMag = Math.abs(beta) * dfMax;



    } else if (viz === "rho_gr") {



      const betaSq = beta * beta;



      rawMag = Math.abs(betaSq) * dfMax * dfMax * INV16PI;



    } else {



      rawMag = Math.abs(beta * state.ampChain * state.gate);



    }



    if (!Number.isFinite(rawMag) || rawMag <= 0) {



      return clamp(0.8 * effectiveExposure, 1e-5, 12);



    }



    const logMag = Math.log10(rawMag + 1e-30);



    // As drive magnitude grows, reduce density exponentially; clamp to retain visibility.



    const logGain = clamp(0.55 - logMag * 0.35, -3.2, 2.6);



    const baseScale = Math.pow(10, logGain);



    const stats = this.ringLastStats;



    const gateBias = stats ? clamp(1.0 / Math.max(stats.mean, 1e-3), 0.4, 2.5) : 1.0;



    const scale = baseScale * gateBias * effectiveExposure;



    const maxScale = viz === "theta_drive" ? 8.0 : 8.0e6;



    return clamp(scale, 5e-5, maxScale);



  }







  private drawWireframeFallback(mvp: Float32Array) {



    this.ensureFallbackProgram();



    if (!this.overlay.fallbackProgram || !this.overlay.wireframeVao) return;



    const { gl } = this;



    gl.useProgram(this.overlay.fallbackProgram);



    const loc = {



      u_mvp: gl.getUniformLocation(this.overlay.fallbackProgram, "u_mvp"),



      u_color: gl.getUniformLocation(this.overlay.fallbackProgram, "u_color"),



      u_alpha: gl.getUniformLocation(this.overlay.fallbackProgram, "u_alpha"),



    };



    gl.uniformMatrix4fv(loc.u_mvp, false, mvp);



    gl.uniform3fv(loc.u_color, WIREFRAME_COLOR);



    gl.uniform1f(loc.u_alpha, 0.65);



    gl.bindVertexArray(this.overlay.wireframeVao);



    gl.drawArrays(gl.LINES, 0, 96 * 2);



    gl.bindVertexArray(null);



  }







  dispose() {



    const { gl } = this;



    if (this.resources.rayProgram) gl.deleteProgram(this.resources.rayProgram);



    if (this.resources.overlayProgram) gl.deleteProgram(this.resources.overlayProgram);



    if (this.resources.ringOverlayProgram) gl.deleteProgram(this.resources.ringOverlayProgram);



    if (this.resources.postProgram) gl.deleteProgram(this.resources.postProgram);



    if (this.surfaceProgram) gl.deleteProgram(this.surfaceProgram);



    if (this.betaOverlayProgram) gl.deleteProgram(this.betaOverlayProgram);



    if (this.resources.quadVao) gl.deleteVertexArray(this.resources.quadVao);



    if (this.resources.quadVbo) gl.deleteBuffer(this.resources.quadVbo);



    if (this.radialTex) {



      gl.deleteTexture(this.radialTex);



      this.radialTex = null;



    }



    if (this.ringInstantTex) {



      gl.deleteTexture(this.ringInstantTex);



      this.ringInstantTex = null;



    }



    if (this.ringAverageTex) {



      gl.deleteTexture(this.ringAverageTex);



      this.ringAverageTex = null;



    }



    if (this.volumeTex) gl.deleteTexture(this.volumeTex);



    if (this.curvature.texA) {



      gl.deleteTexture(this.curvature.texA);



      this.curvature.texA = null;



    }



    if (this.curvature.texB) {



      gl.deleteTexture(this.curvature.texB);



      this.curvature.texB = null;



    }



    if (this.curvature.fallback) {



      gl.deleteTexture(this.curvature.fallback);



      this.curvature.fallback = null;



    }



    this.curvature.hasData = false;



    this.curvature.front = 0;



    this.curvature.dims = [1, 1, 1];



    this.curvature.version = 0;



    this.curvature.updatedAt = 0;



    this.radialTexAllocated = false;



    this.ringInstantTexAllocated = false;



    this.ringAverageTexAllocated = false;



    if (this.dummyVolumeTex) {



      gl.deleteTexture(this.dummyVolumeTex);



      this.dummyVolumeTex = null;



    }



    if (this.fallbackTex2D) {



      gl.deleteTexture(this.fallbackTex2D);



      this.fallbackTex2D = null;



    }



    if (this.overlay.ringVao) gl.deleteVertexArray(this.overlay.ringVao);



    if (this.overlay.ringVbo) gl.deleteBuffer(this.overlay.ringVbo);



    if (this.overlay.sliceVao) gl.deleteVertexArray(this.overlay.sliceVao);



    if (this.overlay.sliceVbo) gl.deleteBuffer(this.overlay.sliceVbo);



    this.overlay.ringVertexCount = 0;



    if (this.overlay.sliceEbo) gl.deleteBuffer(this.overlay.sliceEbo);



    if (this.overlay.wireframeVao) gl.deleteVertexArray(this.overlay.wireframeVao);



    if (this.overlay.wireframeVbo) gl.deleteBuffer(this.overlay.wireframeVbo);



    if (this.overlay.fallbackProgram) gl.deleteProgram(this.overlay.fallbackProgram);



    if (this.surfaceVao) gl.deleteVertexArray(this.surfaceVao);



    if (this.surfaceVbo) gl.deleteBuffer(this.surfaceVbo);



    if (this.betaFallbackTex) gl.deleteTexture(this.betaFallbackTex);



    this.betaOverlayProgram = null;



    this.betaOverlayUniforms = null;



    this.betaFallbackTex = null;



    if (this.harnessWhiteProgram) gl.deleteProgram(this.harnessWhiteProgram);



    this.harnessWhiteProgram = null;



    this.debugTapBuffer = null;



    if (this.volumeVizBusId) {



      unsubscribe(this.volumeVizBusId);



      this.volumeVizBusId = null;



    }



    if (this.overlay3DBusId) {



      unsubscribe(this.overlay3DBusId);



      this.overlay3DBusId = null;



    }



    if (this.overlayPingBusId) {



      unsubscribe(this.overlayPingBusId);



      this.overlayPingBusId = null;



    }



    if (this.curvatureBusId) {



      unsubscribe(this.curvatureBusId);



      this.curvatureBusId = null;



    }



    if (this.phaseStableBusId) {



      unsubscribe(this.phaseStableBusId);



      this.phaseStableBusId = null;



    }



    if (this.phaseLegacyBusId) {



      unsubscribe(this.phaseLegacyBusId);



      this.phaseLegacyBusId = null;



    }



    if (this.resources.rayColorTex) {



      gl.deleteTexture(this.resources.rayColorTex);



      this.resources.rayColorTex = null;



    }



    if (this.resources.rayAuxTex) {



      gl.deleteTexture(this.resources.rayAuxTex);



      this.resources.rayAuxTex = null;



    }



    if (this.resources.rayFbo) {



      gl.deleteFramebuffer(this.resources.rayFbo);



      this.resources.rayFbo = null;



    }



    this.rayTargetSize = [0, 0];



    this.rayAuxInternalFormat = 0;



    this.rayAuxType = 0;



    this.resources = {



      rayProgram: null,



      ringOverlayProgram: null,



      overlayProgram: null,



      postProgram: null,



      quadVao: null,



      quadVbo: null,



      ringAvgTex: null,



      rayFbo: null,



      rayColorTex: null,



      rayAuxTex: null,



    };



    this.hasVolume = false;



    this.skipVolumeUpdate = false;



  }



}







export const createHull3DRenderer = (



  gl: WebGL2RenderingContext,



  canvas: HTMLCanvasElement,



  options: Hull3DRendererOptions = {}



) => {



  return new Hull3DRenderer(gl, canvas, options);



};







type RingParams = {



  gaussianSigma: number;



  sectorCenter01: number;



  totalSectors: number;



  liveSectors: number;



  sectorFloor: number;



  syncMode: number;



  splitEnabled: boolean;



  splitFrac: number;



};







type RingLUTStats = {



  mean: number;



  rawMean: number;



  min: number;



  max: number;



  minFloor: number;



  samples: number;



  mode: "gaussian" | "wedge";



  sigma01: number;



  center01: number;



  floor: number;



  splitEnabled: boolean;



  splitFrac: number;



  liveSectors: number;



  totalSectors: number;



  warnings: string[];



};







type RingLUTResult = {



  weights: Float32Array;



  stats: RingLUTStats;



};







const buildRingLUT = (params: RingParams): RingLUTResult => {



  const {



    gaussianSigma,



    sectorCenter01,



    totalSectors,



    liveSectors,



    sectorFloor,



    syncMode,



    splitEnabled,



    splitFrac,



  } = params;







  const mode: "gaussian" | "wedge" = syncMode === 1 ? "gaussian" : "wedge";



  const samples = RING_SIZE;



  const weights = new Float32Array(samples);



  const warnings: string[] = [];



  const wrap01 = (x: number) => x - Math.floor(x);



  const d01 = (a: number, b: number) => {



    let d = Math.abs(wrap01(a) - wrap01(b));



    return d > 0.5 ? 1 - d : d;



  };







  const total = Math.max(1, Math.round(totalSectors));



  const live = Math.max(0, Math.round(liveSectors));



  let floor = clamp(sectorFloor, 0, 0.5);



  if (!Number.isFinite(floor)) floor = 0;



  if (floor !== sectorFloor) {



    warnings.push(`[Hull3DRenderer] sectorFloor clamped from ${sectorFloor} to ${floor}`);



  }



  const minFloor = Math.max(0.01, floor);



  const center01 = wrap01(sectorCenter01);







  let uniformFallback = false;



  let sigma01 = Math.max(gaussianSigma, 1e-4);



  if (!Number.isFinite(sigma01)) sigma01 = 0;



  if (mode === "gaussian" && sigma01 <= 1e-4) {



    warnings.push("[Hull3DRenderer] gaussianSigma too small; forcing flat gate");



    uniformFallback = true;



  }



  if (mode === "wedge" && live <= 0) {



    warnings.push("[Hull3DRenderer] liveSectors=0; forcing flat gate");



    uniformFallback = true;



  }



  if (total <= 0) {



    warnings.push("[Hull3DRenderer] totalSectors<=0; forcing flat gate");



    uniformFallback = true;



  }







  if (uniformFallback) {



    for (let i = 0; i < samples; i++) weights[i] = 1;



  } else if (mode === "gaussian") {



    const splitMix = clamp(splitFrac, 0, 1);



    const altCenter = wrap01(center01 + 0.5);



    for (let i = 0; i < samples; i++) {



      const a = i / samples;



      const g1 = Math.exp(-0.5 * Math.pow(d01(a, center01) / sigma01, 2));



      let g = g1;



      if (splitEnabled) {



        const g2 = Math.exp(-0.5 * Math.pow(d01(a, altCenter) / sigma01, 2));



        g = (1 - splitMix) * g1 + splitMix * g2;



      }



      const cur = floor + (1 - floor) * g;



      weights[i] = Math.max(0, cur);



    }



  } else {



    const liveFrac = clamp(total > 0 ? live / total : 0, 0, 1);



    if (liveFrac <= 0) {



      warnings.push("[Hull3DRenderer] liveFrac<=0 after clamp; forcing flat gate");



      for (let i = 0; i < samples; i++) weights[i] = 1;



    } else {



      const half = 0.5 * liveFrac;



      const left = wrap01(center01 - half);



      const right = wrap01(center01 + half);



      for (let i = 0; i < samples; i++) {



        const a = i / samples;



        const inRange = left < right



          ? (a >= left && a <= right)



          : (a >= left || a <= right);



        weights[i] = inRange ? 1 : floor;



      }



    }



  }







  let sumRaw = 0;



  for (let i = 0; i < samples; i++) sumRaw += weights[i];



  const rawMean = sumRaw / samples || 1;



  const invMean = rawMean > 0 ? 1 / rawMean : 1;







  let minVal = Number.POSITIVE_INFINITY;



  let maxVal = 0;



  let sumNorm = 0;



  for (let i = 0; i < samples; i++) {



    const wn = weights[i] * invMean;



    const clamped = Math.max(minFloor, wn);



    weights[i] = clamped;



    minVal = Math.min(minVal, clamped);



    maxVal = Math.max(maxVal, clamped);



    sumNorm += clamped;



  }



  let normMean = sumNorm / samples || 1;



  const targetSum = samples;



  if (Math.abs(sumNorm - targetSum) > 1e-5) {



    if (sumNorm > targetSum) {



      let adjustable = 0;



      for (let i = 0; i < samples; i++) {



        if (weights[i] > minFloor) adjustable += weights[i] - minFloor;



      }



      if (adjustable > 1e-8) {



        const scale = (sumNorm - targetSum) / adjustable;



        sumNorm = 0;



        minVal = Number.POSITIVE_INFINITY;



        maxVal = 0;



        for (let i = 0; i < samples; i++) {



          if (weights[i] > minFloor) {



            const reduction = (weights[i] - minFloor) * scale;



            weights[i] = Math.max(minFloor, weights[i] - reduction);



          }



          minVal = Math.min(minVal, weights[i]);



          maxVal = Math.max(maxVal, weights[i]);



          sumNorm += weights[i];



        }



        normMean = sumNorm / samples || 1;



      }



    } else {



      const deficitPer = (targetSum - sumNorm) / samples;



      sumNorm = 0;



      minVal = Number.POSITIVE_INFINITY;



      maxVal = 0;



      for (let i = 0; i < samples; i++) {



        const adjusted = weights[i] + deficitPer;



        weights[i] = Math.max(minFloor, adjusted);



        minVal = Math.min(minVal, weights[i]);



        maxVal = Math.max(maxVal, weights[i]);



        sumNorm += weights[i];



      }



      normMean = sumNorm / samples || 1;



    }



  }







  const stats: RingLUTStats = {



    mean: normMean,



    rawMean,



    min: Number.isFinite(minVal) ? minVal : 1,



    max: Number.isFinite(maxVal) ? maxVal : 1,



    minFloor,



    samples,



    mode,



    sigma01,



    center01,



    floor,



    splitEnabled,



    splitFrac: clamp(splitFrac, 0, 1),



    liveSectors: live,



    totalSectors: total,



    warnings,



  };







  return { weights, stats };



};
