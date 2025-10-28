import React, { useEffect, useMemo, useRef } from "react";

type MetricAmplificationPocketProps = {
  className?: string;
  /** I3_geo */
  gammaGeo: number;
  /** q factor (spoiling / deltaAOverA / qCavity normalized to a scalar >0) */
  q: number;
  /** Van den Broeck pocket visibility factor used in renderer chain */
  gammaVdB_vis: number;
  /** Ford–Roman duty fraction actually used for view (already effective) */
  dFR: number;
  /** If true, multiply theta by sqrt(dFR) (matches renderer’s viewAvg branch) */
  viewAvg: boolean;
  /** Optional: fixed height in px; defaults to 380 */
  height?: number;
};

/**
 * MetricAmplificationPocket
 * -------------------------
 * A lightweight GL panel that visualizes “metric amplification” as:
 *  - A static throat/tube SDF for shape
 *  - A coordinate grid that stretches by a(ρ) = 1 / (1 + u_vdb * g(ρ))
 *  - Transparency ∝ |∂_ρ a(ρ)| (a safe stress-proxy), boosted by θ
 *
 * This is a purely visual diagnostic — it encodes coordinate stretching,
 * not motion or FTL flow.
 */
export default function MetricAmplificationPocket({
  className,
  gammaGeo,
  q,
  gammaVdB_vis,
  dFR,
  viewAvg,
  height = 380,
}: MetricAmplificationPocketProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const attribsRef = useRef<{ a_pos: number } | null>(null);
  const buffersRef = useRef<{ tri: WebGLBuffer | null }>({ tri: null });
  const uniformsRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(
    typeof performance !== "undefined" ? performance.now() : Date.now()
  );
  const roRef = useRef<ResizeObserver | null>(null);

  // Canonical theta used by visuals (matches page-level expected scaling)
  const theta = useMemo(() => {
    const g = Math.max(1, Number(gammaGeo) || 1);
    const qq = Math.max(1e-12, Number(q) || 1);
    const vdb = Math.max(1, Number(gammaVdB_vis) || 1);
    const duty = Math.max(1e-12, Number(dFR) || 1e-12);
    const base = Math.pow(g, 3) * qq * vdb;
    return viewAvg ? base * Math.sqrt(duty) : base;
  }, [gammaGeo, q, gammaVdB_vis, dFR, viewAvg]);

  // Inline GLSL (keeps build simple; mirrors WarpBubbleGLPanel style)
  const VERT = `#ifdef GL_ES
precision highp float;
#endif
// Fullscreen big triangle
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

  const FRAG = `#ifdef GL_ES
precision highp float;
precision highp int;
#endif
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

uniform vec2  u_canvasSize;
uniform float u_time;
uniform float u_cameraZ;
uniform float u_theta;
uniform float u_vdb;
uniform float u_dfr;
uniform int   u_viewAvg;

#define PI 3.14159265359

// Map canvas to NDC with aspect fix
vec2 ndc() {
  vec2 uv = gl_FragCoord.xy / u_canvasSize;
  vec2 p  = uv * 2.0 - 1.0;
  p.x *= u_canvasSize.x / u_canvasSize.y;
  return p;
}

// Variable-radius "tube/throat" SDF along Y axis
// Height half-span H; radius grows away from throat.
float H() { return 0.9; }
float baseThroat() { return 0.18; }
float baseOuter()  { return 0.48; }

float thetaNorm();

float thetaVisual() {
  float n = thetaNorm(); // declared above; GLSL allows forward reference to functions
  // Ease curve favours mid-range differences; keeps dormant modes visibly distinct.
  return pow(clamp(n, 0.0, 1.0), 0.65);
}

float throatRadius() {
  float morph = mix(1.35, 0.55, thetaVisual());
  return baseThroat() * morph;
}

float outerRadius() {
  float morph = mix(0.9, 1.25, thetaVisual());
  return baseOuter() * morph;
}

float radiusProfile(float y) {
  float k = 2.5; // how quickly radius expands away from throat
  float t = clamp(abs(y) / H(), 0.0, 1.0);
  float grow = 1.0 - exp(-k * t * t);
  return mix(throatRadius(), outerRadius(), grow);
}

float sdVarTube(vec3 p) {
  // finite tube with variable radius
  float rr = radiusProfile(p.y);
  float dRad = length(p.xz) - rr;
  float dCap = abs(p.y) - H();
  return max(dRad, dCap);
}

// Basic raymarch
float march(vec3 ro, vec3 rd, out vec3 pos) {
  float t = 0.0;
  for (int i=0; i<100; ++i) {
    pos = ro + rd * t;
    float d = sdVarTube(pos);
    if (d < 0.001) return t;
    t += d * 0.8;
    if (t > 40.0) break;
  }
  return 1e9;
}

// Normal via central differences
vec3 calcNormal(vec3 p) {
  const float e = 0.0015;
  vec2 h = vec2(e, 0.0);
  float dx = sdVarTube(p + vec3(h.x, h.y, h.y)) - sdVarTube(p - vec3(h.x, h.y, h.y));
  float dy = sdVarTube(p + vec3(h.y, h.x, h.y)) - sdVarTube(p - vec3(h.y, h.x, h.y));
  float dz = sdVarTube(p + vec3(h.y, h.y, h.x)) - sdVarTube(p - vec3(h.y, h.y, h.x));
  return normalize(vec3(dx, dy, dz));
}

// Metric amplification scale factor a(ρ) visual — stronger near throat (small r).
float a_of_r(float r) {
  float rt = throatRadius();
  float ro = outerRadius();
  float t = clamp((r - rt) / max(1e-4, (ro - rt)), 0.0, 1.0);
  float s = 1.0 - t; // 1 near throat, 0 near outer
  return 1.0 / (1.0 + u_vdb * (0.25 + 0.75 * s));
}

// log10 helper
float log10f(float x) { return log2(x) / log2(10.0); }

// θ normalization for subtle breathing and stress scaling
float thetaNorm() {
  float l = log10f(max(u_theta, 1e-12));
  return clamp((l - (-6.0)) / (9.0 - (-6.0)), 0.0, 1.0);
}

// Stress proxy ~ |∂_r a(r)| boosted by θ (visual only)
float stressProxy(float r) {
  float eps = 0.004;
  float a1 = a_of_r(max(0.0, r - eps));
  float a2 = a_of_r(r + eps);
  float da = (a2 - a1) / (2.0 * eps);
  float k  = 0.4 + 0.6 * thetaNorm();
  return clamp(abs(da) * k, 0.0, 1.0);
}

// Reusable grid evaluator with derivative-aware line thickness
float gridFrom(vec2 g) {
#if defined(GL_OES_standard_derivatives) || __VERSION__ >= 300
  vec2 fw = max(fwidth(g), vec2(1e-4));
  vec2 cell = abs(fract(g - 0.5) - 0.5) / fw;
  float k = 1.0 - min(min(cell.x, cell.y), 1.0);
  return smoothstep(0.0, 1.0, k);
#else
  vec2 cell = abs(fract(g - 0.5) - 0.5);
  float thickness = 0.02 * (1.0 + 0.4 * thetaNorm());
  float l = min(cell.x, cell.y);
  return 1.0 - smoothstep(thickness * 0.25, thickness, l);
#endif
}

// Coordinate gridlines: stable base lattice + a()-coupled lattice
float gridLines(vec3 pWS) {
  float r   = length(pWS.xz);
  float phi = atan(pWS.z, pWS.x);          // [-pi, pi]
  float y   = pWS.y;                       // axial
  float a   = a_of_r(r);
  float breath = 1.0 + 0.12 * sin(u_time * (0.3 + 0.9 * thetaVisual()));

  float scaleA = a * breath;
  float couple = 0.55;
  float scaleVis = clamp(mix(1.0, scaleA, couple), 0.35, 1.35);

  float F = 20.0;
  vec2 gBase = vec2((phi / (2.0 * PI)) * F,
                    ((y / H()) * 0.5 + 0.5) * F);
  vec2 gScaled = gBase * scaleVis;

  float lBase = gridFrom(gBase);
  float lScaled = gridFrom(gScaled);

  float lines = max(0.45 * lBase, 0.75 * lScaled);
  return clamp(lines, 0.0, 1.0);
}
void main() {
  vec2 p = ndc();
  vec3 ro = vec3(0.0, 0.0, u_cameraZ);
  // simple pinhole camera
  vec3 rd = normalize(vec3(p.xy, -1.4));

  vec3 pos;
  float t = march(ro, rd, pos);
  if (t > 1e8) {
    // Outside — transparent
    gl_FragColor = vec4(0.0);
    return;
  }

  float r = length(pos.xz);
  float lines = gridLines(pos);
  float stress = stressProxy(r);

  // Subtle shading
  vec3 N = calcNormal(pos);
  float ndl = clamp(dot(N, normalize(vec3(0.4, 0.8, 0.3))), 0.0, 1.0);

  // Neutral surface shading
  float radial = clamp(r / max(outerRadius(), 1e-5), 0.0, 1.0);
  vec3 surface = mix(vec3(0.92, 0.95, 1.00), vec3(0.68, 0.74, 0.88), radial);
  surface *= 0.78 + 0.22 * ndl;

  // Grid highlight overlay – boost contrast so lines are visible even in low-power regimes.
  vec3 gridTint = mix(surface, vec3(0.20, 0.36, 0.78), 0.65);
  float gridStrength = mix(0.55, 0.92, thetaVisual());
  vec3 base = mix(surface, gridTint, clamp(lines * gridStrength, 0.0, 1.0));

  // Opacity encodes stress-proxy (visual cue only)
  float alpha = mix(0.15, 0.80, stress);

  gl_FragColor = vec4(base, alpha);
}
`;

  // Compile/link helpers
  function compile(gl: WebGLRenderingContext | WebGL2RenderingContext, type: number, src: string) {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh) || "Shader compile error";
      gl.deleteShader(sh);
      throw new Error(log);
    }
    return sh;
  }
  function link(gl: WebGLRenderingContext | WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader) {
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(prog) || "Program link error";
      gl.deleteProgram(prog);
      throw new Error(log);
    }
    return prog;
  }

  // Ensure canvas size → framebuffer size in device pixels
  function fitCanvas(canvas: HTMLCanvasElement, gl: WebGLRenderingContext | WebGL2RenderingContext) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      const u = uniformsRef.current;
      if (u) gl.uniform2f(u.u_canvasSize, w, h);
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current!;
    // Prefer WebGL2, fall back to WebGL1
    let gl = (canvas.getContext("webgl2", { antialias: true, alpha: true }) ||
              canvas.getContext("webgl", { antialias: true, alpha: true })) as
              (WebGL2RenderingContext | WebGLRenderingContext | null);
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }
    glRef.current = gl;
    try {
      gl.getExtension?.("OES_standard_derivatives");
    } catch (err) {
      console.warn("[MetricPocket] Unable to enable OES_standard_derivatives:", err);
    }

    // Compile/link
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = link(gl, vs, fs);
    programRef.current = prog;
    gl.useProgram(prog);

    // Attributes: fullscreen big triangle
    const a_pos = gl.getAttribLocation(prog, "a_pos");
    attribsRef.current = { a_pos };
    const tri = gl.createBuffer();
    buffersRef.current.tri = tri;
    gl.bindBuffer(gl.ARRAY_BUFFER, tri);
    // Big triangle vertices: (-1,-1), (3,-1), (-1,3)
    const verts = new Float32Array([
      -1, -1,
       3, -1,
      -1,  3,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_pos);
    gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const u = {
      u_canvasSize: gl.getUniformLocation(prog, "u_canvasSize"),
      u_time: gl.getUniformLocation(prog, "u_time"),
      u_cameraZ: gl.getUniformLocation(prog, "u_cameraZ"),
      u_theta: gl.getUniformLocation(prog, "u_theta"),
      u_vdb: gl.getUniformLocation(prog, "u_vdb"),
      u_dfr: gl.getUniformLocation(prog, "u_dfr"),
      u_viewAvg: gl.getUniformLocation(prog, "u_viewAvg"),
    };
    uniformsRef.current = u;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);

    // Initial uniforms
    fitCanvas(canvas, gl);
    gl.uniform1f(u.u_cameraZ, 2.8);
    gl.uniform1f(u.u_time, 0);
    gl.uniform1f(u.u_theta, Math.max(1e-12, theta));
    gl.uniform1f(u.u_vdb, Math.max(1, gammaVdB_vis || 1));
    gl.uniform1f(u.u_dfr, Math.max(1e-12, dFR || 1e-12));
    gl.uniform1i(u.u_viewAvg, viewAvg ? 1 : 0);

    // Draw loop
    const loop = () => {
      const now = performance.now();
      const t = (now - startTimeRef.current) / 1000.0;
      fitCanvas(canvas, gl);
      gl.uniform1f(u.u_time, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    const onLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onLost, false);

    const ro = new ResizeObserver(() => {
      if (glRef.current) fitCanvas(canvas, glRef.current);
    });
    ro.observe(canvas);
    roRef.current = ro;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("webglcontextlost", onLost);
      ro.disconnect();
      roRef.current = null;
      if (gl && programRef.current) {
        gl.deleteProgram(programRef.current);
        programRef.current = null;
      }
      if (gl && buffersRef.current.tri) {
        gl.deleteBuffer(buffersRef.current.tri);
        buffersRef.current.tri = null;
      }
      glRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push dynamic uniforms on prop change (no extra draws; loop reads them next frame)
  useEffect(() => {
    const gl = glRef.current;
    const u = uniformsRef.current;
    if (!gl || !u || !programRef.current) return;
    gl.useProgram(programRef.current);
    gl.uniform1f(u.u_theta, Math.max(1e-12, theta));
    gl.uniform1f(u.u_vdb, Math.max(1, gammaVdB_vis || 1));
    gl.uniform1f(u.u_dfr, Math.max(1e-12, dFR || 1e-12));
    gl.uniform1i(u.u_viewAvg, viewAvg ? 1 : 0);
  }, [theta, gammaVdB_vis, dFR, viewAvg]);

  return (
    <div className={`relative w-full ${className || ""}`} style={{ height }}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Legend overlay (visual semantics, not physics claims) */}
      <div className="pointer-events-none absolute left-3 bottom-3 text-[11px] leading-snug text-slate-300/90 bg-black/50 px-2 py-1 rounded">
        <div className="font-medium">Metric amplification (visual)</div>
        <div>Grid spacing ⇒ local coordinate stretch a(ρ)</div>
        <div>Opacity ∝ |∂<sub>ρ</sub> a(ρ)| (stress-proxy)</div>
        <div className="text-[10px] text-slate-400/90">Illustrative only; not motion/FTL.</div>
      </div>
    </div>
  );
}
