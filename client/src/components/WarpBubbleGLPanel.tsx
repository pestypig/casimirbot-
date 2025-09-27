import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * WarpBubbleGLPanel — a minimal, self-contained WebGL (WebGL1/2) viewer
 * that renders a Natário-like ring deformation from operational physics
 * scalars in the pipeline. No external engine required.
 *
 * Physics → θ (inside the shader):
 *   θ = γ_geo^3 · q · γ_VdB(vis) · (viewAvg ? sqrt(d_FR) : 1)
 *
 * REAL vs SHOW:
 *   - REAL: ridgeMode=0 → double-lobe via |d * d(gaussian)/dρ|
 *   - SHOW: ridgeMode=1 → single crest via |d| · gaussian
 */

// ---------- Types passed in from your pipeline ----------
export type WarpPipelineSnapshot = {
  // physics scalars
  gammaGeo: number;                // γ_geo
  qSpoilingFactor?: number;        // q = ΔA/A (preferred)
  deltaAOverA?: number;            // alias for q
  gammaVanDenBroeck_vis?: number;  // γ_VdB (visual)
  dutyEffectiveFR?: number;        // ship-wide FR duty (0..1)
  dutyCycle?: number;              // optional UI duty
  sectors?: number;                // concurrent sectors (for fallback duty)
  sectorCount?: number;            // total sectors (for fallback duty)

  // mode & shape
  physicsParityMode?: boolean;     // REAL when true
  ridgeMode?: 0 | 1;               // REAL→0, SHOW→1 (if omitted we'll infer)
  viewAvg?: boolean;               // if true, shader multiplies by √d_FR

  // geometry
  hull?: { a: number; b: number; c: number }; // ellipsoid semiaxes (m)
  wallWidth?: number;              // normalized σ for ring (default 0.06)

  // camera/framing
  cameraZ?: number;                // distance for pseudo perspective
};

// ---------- GLSL Shaders (inline for portability) ----------
const VERT = `#ifdef GL_ES
precision highp float;
#endif

attribute vec3 a_pos; // base grid vertex (normalized around origin)

uniform vec2  u_canvasSize;        // px (for aspect)
uniform float u_cameraZ;           // pseudo camera distance
uniform float u_eyeY;              // view lift

uniform vec3  u_axesClip;          // ellipsoid axes in scene units
uniform float u_wallWidth;         // ring σ in ρ units

// physics scalars for θ
uniform float u_gammaGeo;          // γ_geo
uniform float u_q;                 // ΔA/A
uniform float u_gammaVdB;          // γ_VdB (visual)
uniform float u_dutyFR;            // d_FR (0..1)
uniform int   u_viewAvg;           // 1 → use √d_FR
uniform int   u_ridgeMode;         // 0 → double-lobe (REAL), 1 → single ridge (SHOW)

// gentle interior tilt (non-physics cosmetic)
uniform float u_epsTilt;
uniform vec3  u_betaTilt;

// display gain (visual boost only)
uniform float u_displayGain;
uniform float u_zeroStop;

// ---- helpers ----
float softClamp(float x, float m){ return m * tanh(x / max(1e-6, m)); }

void main(){
  // Ellipsoidal radius ρ (with clip axes)
  vec3 rc = a_pos / max(vec3(1e-6), u_axesClip);
  float rho = length(rc);
  float d   = rho - 1.0;

  // Gaussian ring at ρ≈1 and its radial derivative
  float w   = max(1e-4, u_wallWidth);
  float g   = exp(- (d*d) / (w*w));
  float dgd = (2.0 * d / (w*w)) * g; // ∂/∂ρ gaussian

  // Canonical θ chain
  float theta = pow(max(1.0, u_gammaGeo), 3.0)
              * max(1e-12, u_q)
              * max(1.0, u_gammaVdB)
              * (u_viewAvg == 1 ? sqrt(clamp(u_dutyFR, 0.0, 1.0)) : 1.0);

  // Ridge shape: REAL→double-lobe (|d·dG|), SHOW→single crest (|d|·G)
  float baseMag = (u_ridgeMode == 1) ? abs(d) * g : abs(d * dgd);

  // Visual scaling (log compression to keep geometry in-bounds)
  float magMax   = log(1.0 + (baseMag * theta * 40.0) / max(1e-18, u_zeroStop));
  float magNow   = log(1.0 + (baseMag * theta * u_displayGain) / max(1e-18, u_zeroStop));
  float A_geom   = pow(min(1.0, magNow / max(1e-12, magMax)), 0.85);

  // Tilt envelope inside bubble
  float tiltEnv  = exp(- (rho*rho));
  float tiltY    = u_epsTilt * (normalize(u_betaTilt).y) * tiltEnv;

  // Displacement strictly along +y in this simple view
  float disp     = A_geom * g + tiltY;
  disp          = softClamp(disp, 0.22);

  // World position
  vec3 P = vec3(a_pos.x, a_pos.y + disp, a_pos.z);

  // Pseudo perspective projection
  float aspect = u_canvasSize.x / max(1.0, u_canvasSize.y);
  float s      = u_cameraZ / max(1e-3, (u_cameraZ + P.z));
  vec2 ndc;
  ndc.x = (P.x * s) / (aspect * 0.9);
  ndc.y = (-(P.y - u_eyeY) * s) / 0.9;

  gl_Position = vec4(ndc, 0.0, 1.0);
}
`;

const FRAG = `#ifdef GL_ES
precision mediump float;
#endif

uniform vec3 u_color;

void main(){
  gl_FragColor = vec4(u_color, 0.95);
}
`;

// ---------- Small WebGL helper ----------
function compileShader(gl: WebGLRenderingContext, type: number, src: string){
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh) || "(no log)";
    gl.deleteShader(sh); throw new Error("Shader compile failed: " + log);
  }
  return sh;
}

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string){
  const p = gl.createProgram()!;
  gl.attachShader(p, compileShader(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compileShader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(p) || "(no log)";
    gl.deleteProgram(p); throw new Error("Program link failed: " + log);
  }
  return p;
}

function makeGrid(span = 1.6, div = 96){
  // line-list grid in XZ plane at y ≈ -0.15
  const verts: number[] = [];
  const step = (span * 2) / div;
  const half = span;
  const y = -0.15;
  for (let z = 0; z <= div; z++){
    const zPos = -half + z * step;
    for (let x = 0; x < div; x++){
      const x0 = -half + x * step;
      const x1 = -half + (x + 1) * step;
      verts.push(x0,y,zPos,  x1,y,zPos);
    }
  }
  for (let xi = 0; xi <= div; xi++){
    const xPos = -half + xi * step;
    for (let zi = 0; zi < div; zi++){
      const z0 = -half + zi * step;
      const z1 = -half + (zi + 1) * step;
      verts.push(xPos,y,z0,  xPos,y,z1);
    }
  }
  return new Float32Array(verts);
}

// ---------- React component ----------
export default function WarpBubbleGLPanel({
  snapshot,
  width = 960,
  height = 540,
  background = "#0b1220",
  color = "#b8ccff",
}: {
  snapshot: WarpPipelineSnapshot;
  width?: number; height?: number;
  background?: string; color?: string;
}){
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const progRef = useRef<WebGLProgram | null>(null);
  const vboRef = useRef<WebGLBuffer | null>(null);
  const attribsRef = useRef<{ a_pos: number } | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation>>({} as any);
  const [status, setStatus] = useState<'ok'|'none'|'lost'|'error'>('none');
  const grid = useMemo(() => makeGrid(1.6, 96), []);

  // Create GL context + program once
  useEffect(() => {
    const cv = canvasRef.current!;
    if (!cv) return;

    // Try GL2 → GL1
    let gl = (cv.getContext("webgl2", { antialias: false }) || cv.getContext("webgl", { antialias: false })) as WebGLRenderingContext | null;
    if (!gl){ setStatus('none'); return; }

    const prog = createProgram(gl, VERT, FRAG);
    const a_pos = gl.getAttribLocation(prog, "a_pos");

    const uniforms: Record<string, WebGLUniformLocation> = {
      u_canvasSize: gl.getUniformLocation(prog, "u_canvasSize")!,
      u_cameraZ:    gl.getUniformLocation(prog, "u_cameraZ")!,
      u_eyeY:       gl.getUniformLocation(prog, "u_eyeY")!,
      u_axesClip:   gl.getUniformLocation(prog, "u_axesClip")!,
      u_wallWidth:  gl.getUniformLocation(prog, "u_wallWidth")!,
      u_gammaGeo:   gl.getUniformLocation(prog, "u_gammaGeo")!,
      u_q:          gl.getUniformLocation(prog, "u_q")!,
      u_gammaVdB:   gl.getUniformLocation(prog, "u_gammaVdB")!,
      u_dutyFR:     gl.getUniformLocation(prog, "u_dutyFR")!,
      u_viewAvg:    gl.getUniformLocation(prog, "u_viewAvg")!,
      u_ridgeMode:  gl.getUniformLocation(prog, "u_ridgeMode")!,
      u_epsTilt:    gl.getUniformLocation(prog, "u_epsTilt")!,
      u_betaTilt:   gl.getUniformLocation(prog, "u_betaTilt")!,
      u_displayGain:gl.getUniformLocation(prog, "u_displayGain")!,
      u_zeroStop:   gl.getUniformLocation(prog, "u_zeroStop")!,
      u_color:      gl.getUniformLocation(prog, "u_color")!,
    };

    const vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, grid, gl.STATIC_DRAW);

    glRef.current = gl; progRef.current = prog; vboRef.current = vbo;
    attribsRef.current = { a_pos };
    uniformsRef.current = uniforms;

    const onLost = (e: Event) => { e.preventDefault(); setStatus('lost'); };
    const onRestored = () => { setStatus('ok'); try { gl.viewport(0,0,cv.width,cv.height); } catch{} };
    cv.addEventListener('webglcontextlost', onLost as any, { passive: false });
    cv.addEventListener('webglcontextrestored', onRestored as any, { passive: true });

    setStatus('ok');
    return () => {
      cv.removeEventListener('webglcontextlost', onLost as any);
      cv.removeEventListener('webglcontextrestored', onRestored as any);
      try {
        if (gl) {
          gl.deleteBuffer(vbo);
          gl.deleteProgram(prog);
        }
      } catch {}
      glRef.current = null; progRef.current = null; vboRef.current = null;
    };
  }, [grid]);

  // Draw whenever snapshot or size changes
  useEffect(() => {
    const cv = canvasRef.current!;
    const gl = glRef.current; const prog = progRef.current;
    if (!cv || !gl || !prog) return;

    gl.viewport(0, 0, cv.width, cv.height);
    // Clear background
    const bg = hexToRgb(background);
    gl.clearColor(bg[0]/255, bg[1]/255, bg[2]/255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(prog);

    // Attributes
    const a_pos = attribsRef.current!.a_pos;
    gl.bindBuffer(gl.ARRAY_BUFFER, vboRef.current);
    gl.enableVertexAttribArray(a_pos);
    gl.vertexAttribPointer(a_pos, 3, gl.FLOAT, false, 0, 0);

    // Uniforms from snapshot
    const u = uniformsRef.current!;
    const { a, b, c } = snapshot.hull || { a: 0.5035, b: 0.132, c: 0.0865 };
    const axes = [Math.abs(a) || 1, Math.abs(b) || 1, Math.abs(c) || 1];

    const gammaGeo  = Math.max(1, +snapshot.gammaGeo || 1);
    const q         = Math.max(1e-12, +(snapshot.qSpoilingFactor ?? snapshot.deltaAOverA ?? 1));
    const gammaVdB  = Math.max(1, +(snapshot.gammaVanDenBroeck_vis ?? 1));

    const sTot = Math.max(1, Math.floor(snapshot.sectorCount ?? 400));
    const sLive= Math.max(1, Math.floor(snapshot.sectors ?? 1));
    const dFR  = Number.isFinite(snapshot.dutyEffectiveFR as number)
      ? Math.max(0, Math.min(1, snapshot.dutyEffectiveFR as number))
      : Math.max(0, Math.min(1, (snapshot.dutyCycle ?? 0) * (sLive / sTot)));

    const ridgeMode = (snapshot.ridgeMode != null)
      ? (snapshot.ridgeMode as number)
      : (snapshot.physicsParityMode ? 0 : 1);

    const viewAvg    = snapshot.viewAvg === false ? 0 : 1; // default ON for operational averaging
  const wallWidth  = Math.max(1e-4, Number(snapshot.wallWidth ?? 0.06));
  const cameraZ    = Math.max(0.1, Number(snapshot.cameraZ ?? 2.0));

    gl.uniform2f(u.u_canvasSize, cv.width, cv.height);
    gl.uniform1f(u.u_cameraZ, cameraZ);
    gl.uniform1f(u.u_eyeY, -0.15);

    gl.uniform3f(u.u_axesClip, axes[0], axes[1], axes[2]);
    gl.uniform1f(u.u_wallWidth, wallWidth);

    gl.uniform1f(u.u_gammaGeo, gammaGeo);
    gl.uniform1f(u.u_q, q);
    gl.uniform1f(u.u_gammaVdB, gammaVdB);
    gl.uniform1f(u.u_dutyFR, dFR);
    gl.uniform1i(u.u_viewAvg, viewAvg);
    gl.uniform1i(u.u_ridgeMode, ridgeMode);

    gl.uniform1f(u.u_epsTilt, 5e-7);         // small constant tilt; could be prop
    gl.uniform3f(u.u_betaTilt, 0.0, -1.0, 0.0);
    gl.uniform1f(u.u_displayGain, snapshot.physicsParityMode ? 1.0 : 20.0);
    gl.uniform1f(u.u_zeroStop, 1e-9);

    const rgb = hexToRgb(color);
    gl.uniform3f(u.u_color, rgb[0]/255, rgb[1]/255, rgb[2]/255);

    const vertCount = grid.length / 3;
    gl.drawArrays(gl.LINES, 0, vertCount);
  }, [snapshot, background, color, grid]);

  return (
    <div className="inline-block">
      <div className="flex items-center gap-3 text-xs font-mono opacity-80 mb-1">
        <span className={status==='ok' ? 'text-emerald-400' : status==='lost' ? 'text-red-400' : status==='none' ? 'text-amber-400' : 'text-rose-400'}>
          GL: {status}
        </span>
        <span>mode: {snapshot.physicsParityMode ? 'REAL' : 'SHOW'}</span>
        <span>viewAvg: {snapshot.viewAvg === false ? 'off' : 'on'}</span>
      </div>
      <canvas ref={canvasRef} width={width} height={height} style={{ display:'block', width: Math.min(width, 900), height: height * (Math.min(width, 900)/width) }} />
    </div>
  );
}

// ---------- tiny utils ----------
function hexToRgb(hex: string){
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex) || ["","0","0","0"];
  return [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)] as [number,number,number];
}

// ---------- Usage example ----------
// <WarpBubbleGLPanel
//    snapshot={{
//      gammaGeo: 26,
//      qSpoilingFactor: 1,
//      gammaVanDenBroeck_vis: 2.86e5,
//      dutyEffectiveFR: 2.5e-5,
//      physicsParityMode: true,   // REAL
//      ridgeMode: 0,
//      viewAvg: true,
//      hull: { a: 0.5035, b: 0.132, c: 0.0865 },
//      wallWidth: 0.06,
//      cameraZ: 2.0,
//    }}
// />
