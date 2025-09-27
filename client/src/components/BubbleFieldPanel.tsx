import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { createProgram, makeGrid, resizeCanvasAndViewport } from "@/lib/gl/simple-gl";

const VERT = `#version 300 es
layout(location=0) in vec2 a_pos;           // unit square grid [-1,1]^2
uniform float u_scale;                       // world radius scale (R)
uniform vec3  u_axes;                        // normalized hull axes
uniform mat4  u_mvp;                         // ortho top-down
out vec2 v_pos;
void main(){
  vec2 p = a_pos * u_scale * vec2(u_axes.x, u_axes.z);
  v_pos = p;
  gl_Position = u_mvp * vec4(p, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;
in vec2 v_pos;
out vec4 outColor;

uniform float u_sigma;
uniform float u_R;
uniform vec3  u_dir;          // unit ship direction (default +x)
uniform float u_beta;         // ship beta
uniform float u_gate;         // √d_FR
uniform float u_colorGain;    // adaptive color gain

float d_topHat_dr(float r, float sigma, float R){
  float den = max(1e-6, 2.0 * tanh(sigma * R));
  float A = 1.0 / cosh(sigma * (r + R));
  float B = 1.0 / cosh(sigma * (r - R));
  return sigma * (A*A - B*B) / den;          // sech^2 difference
}

vec3 diverge(float x){
  vec3 c1 = vec3(0.06,0.25,0.98);
  vec3 c2 = vec3(0.93,0.93,0.93);
  vec3 c3 = vec3(0.95,0.30,0.08);
  float t = clamp(0.5 + 0.5*x, 0.0, 1.0);
  return (t < 0.5) ? mix(c1,c2,t/0.5) : mix(c2,c3,(t-0.5)/0.5);
}

void main(){
  vec3 p = vec3(v_pos.x, 0.0, v_pos.y);
  float r = length(p);
  float xs = dot(normalize(u_dir), p);
  float dfdr = d_topHat_dr(max(1e-6, r), u_sigma, u_R);
  float theta = u_beta * (xs/max(r,1e-6)) * dfdr * u_gate;
  vec3 col = diverge(clamp(theta * u_colorGain, -1.0, 1.0));
  outColor = vec4(col, 0.95);
}
`;

export default function BubbleFieldPanel({ className }: {className?: string}){
  const cvRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext|null>(null);
  const progRef = useRef<WebGLProgram|null>(null);
  const vboRef = useRef<WebGLBuffer|null>(null);
  const [res] = useState(160);

  const { data: live } = useEnergyPipeline({ staleTime: 5000, refetchOnWindowFocus: false });

  const axes = useMemo(() => {
    const A = Number(live?.hull?.a) || 1, B = Number(live?.hull?.b) || 1, C = Number(live?.hull?.c) || 1;
    const M = Math.max(A,B,C) || 1;
    return [A/M, B/M, C/M] as [number,number,number];
  }, [live]);

  const R  = useMemo(() => Math.max(1, Number(live?.bubble?.R ?? live?.R ?? 1)), [live]);
  const σ = 6.0;
  const β  = useMemo(() => {
    const m = String(live?.currentMode || 'hover').toLowerCase();
    if (m==='standby') return 0; if (m==='hover') return 0.1; if (m==='cruise') return 0.6; if (m==='emergency') return 0.95;
    return 0.3;
  }, [live]);
  const dGate = useMemo(() => Math.sqrt(Math.max(0, Number(live?.dutyEffectiveFR ?? live?.dutyFR ?? 0))), [live]);
  const dir = useMemo<[number,number,number]>(() => {
    const v = (live as any)?.driveDir || [1,0,0];
    const L = Math.hypot(v[0]||0, v[1]||0, v[2]||0) || 1;
    return [v[0]/L, v[1]/L, v[2]/L];
  }, [live]);

  // Adaptive chroma gain (keeps colors readable across modes)
  const estPeak = useMemo(() => {
    const tanhSR = Math.tanh(Math.max(1e-6, σ * R));
    const dfPeak = σ / (2 * Math.max(1e-6, tanhSR));
    return Math.abs(β) * dfPeak * dGate;
  }, [β, σ, R, dGate]);
  const cGain = useMemo(() => {
    if (!(estPeak>1e-12)) return 1;
    const g = 1.0 / (estPeak * 0.75);
    return Math.min(Math.max(g, 1e-8), 1e8);
  }, [estPeak]);

  // ortho top-down
  const mvp = useMemo(() => {
    const w = 2*R, h = 2*R;
    const l=-w, r=w, b=-h, t=h, n=-1, f=1; // XY plane
    const M = new Float32Array(16);
    M[0]=2/(r-l); M[5]=2/(t-b); M[10]=-2/(f-n); M[12]=-(r+l)/(r-l); M[13]=-(t+b)/(t-b); M[14]=-(f+n)/(f-n); M[15]=1;
    return M;
  }, [R]);

  // init GL
  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const gl = cv.getContext('webgl2', {antialias:true, preserveDrawingBuffer:true});
    if (!gl) return;
    glRef.current = gl;

    try {
      progRef.current = createProgram(gl, VERT, FRAG);
    } catch (e) {
      console.error("[BubbleFieldPanel] shader error:", e);
      return;
    }

    const vbo = gl.createBuffer()!; vboRef.current = vbo;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, makeGrid(res), gl.STATIC_DRAW);

    const onResize = () => resizeCanvasAndViewport(gl, cv);
    onResize();
    const ro = new ResizeObserver(onResize); ro.observe(cv);

    let raf = 0;
    const draw = () => {
      const prog = progRef.current;
      if (!prog) return;
      
      gl.clearColor(0.03,0.04,0.07,1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);

      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      const u_scale     = gl.getUniformLocation(prog, 'u_scale');
      const u_axes      = gl.getUniformLocation(prog, 'u_axes');
      const u_mvp       = gl.getUniformLocation(prog, 'u_mvp');
      const u_sigma     = gl.getUniformLocation(prog, 'u_sigma');
      const u_R         = gl.getUniformLocation(prog, 'u_R');
      const u_dir       = gl.getUniformLocation(prog, 'u_dir');
      const u_beta      = gl.getUniformLocation(prog, 'u_beta');
      const u_gate      = gl.getUniformLocation(prog, 'u_gate');
      const u_colorGain = gl.getUniformLocation(prog, 'u_colorGain');

      gl.uniform1f(u_scale, Math.max(1e-3, R));
      gl.uniform3f(u_axes, axes[0], axes[1], axes[2]);
      gl.uniformMatrix4fv(u_mvp, false, mvp);
      gl.uniform1f(u_sigma, σ);
      gl.uniform1f(u_R, R);
      gl.uniform3f(u_dir, dir[0], dir[1], dir[2]);
      gl.uniform1f(u_beta, β);
      gl.uniform1f(u_gate, dGate);
      gl.uniform1f(u_colorGain, cGain);

      // draw strips
      for (let row = 0, off = 0; row < res - 1; row++, off += res * 2) {
        gl.drawArrays(gl.TRIANGLE_STRIP, off, res * 2);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [res, R, axes, mvp, σ, β, dir, dGate, cGain]);

  return (
    <div className={cn("w-full", className)}>
      <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-slate-800 bg-black/60">
        <canvas ref={cvRef} className="w-full h-full block" />
      </div>
    </div>
  );
}
