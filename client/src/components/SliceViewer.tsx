import React, { useEffect, useMemo, useRef } from "react";
import clsx from "clsx";

/**
 * SliceViewer — true-to-scale equatorial curvature viewer (ρ-space)
 *
 * X-axis: (ρ-1)/w_ρ in σ units (±sigmaRange)
 * Y-axis: φ ∈ [0, 2π)
 * Color: York-time proxy θ(ρ,φ) with viewer-only amplitude chain
 * Matches the canonical Gaussian shell used in your WebGL fragment shader.
 */

export type Vec3 = [number, number, number];

export interface SliceViewerProps {
  className?: string;
  width?: number; // canvas width in CSS px
  height?: number; // canvas height in CSS px

  // Geometry / wall
  hullAxes: Vec3; // [a,b,c] in meters
  wallWidth_m?: number; // optional (if given, overrides rho calc)
  wallWidth_rho?: number; // optional (directly in ρ-units)

  // Drive / ship frame
  driveDir?: Vec3; // default [1,0,0]
  vShip?: number; // scale for θ proxy

  // Amplitude chain (viewer-only; does not affect geometry)
  gammaGeo?: number; // γ_geo
  qSpoilingFactor?: number; // ΔA/A
  gammaVdB?: number; // γ_VdB
  dutyCycle?: number; // 0..1
  sectors?: number; // ≥1
  viewAvg?: boolean; // true→√(duty/sectors), false→instant

  // Diff vs reference (viewer-only)
  diffMode?: boolean;
  refParams?: Partial<Pick<
    SliceViewerProps,
    | "gammaGeo"
    | "qSpoilingFactor"
    | "gammaVdB"
    | "dutyCycle"
    | "sectors"
    | "viewAvg"
  >>;

  // Visual controls
  sigmaRange?: number; // default 6 (±6σ)
  exposure?: number; // dynamic range control for symmetric log (default 6)
  zeroStop?: number; // avoids singularity at zero before log (default 1e-9)
  showContours?: boolean; // overlay iso-contours
}

function harmonicMean(a: number, b: number, c: number) {
  return 3 / (1 / a + 1 / b + 1 / c);
}

function normalize(v: Vec3): Vec3 {
  const m = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / m, v[1] / m, v[2] / m];
}

function divVec(a: Vec3, b: Vec3): Vec3 {
  return [a[0] / b[0], a[1] / b[1], a[2] / b[2]];
}

function dot(a: Vec3, b: Vec3) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function divergeColor(x: number): [number, number, number] {
  // x in [-1, 1]: blue → white → orange-red (matches engine aesthetic)
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const t = clamp((x + 1) * 0.5); // [0,1]
  const c1: [number, number, number] = [0.15, 0.45, 1.0]; // blue
  const c2: [number, number, number] = [1.0, 1.0, 1.0]; // white
  const c3: [number, number, number] = [1.0, 0.45, 0.0]; // orange-red
  let r: number, g: number, b: number;
  if (t < 0.5) {
    const u = t / 0.5; // 0..1 between c1→c2
    r = c1[0] * (1 - u) + c2[0] * u;
    g = c1[1] * (1 - u) + c2[1] * u;
    b = c1[2] * (1 - u) + c2[2] * u;
  } else {
    const u = (t - 0.5) / 0.5; // 0..1 between c2→c3
    r = c2[0] * (1 - u) + c3[0] * u;
    g = c2[1] * (1 - u) + c3[1] * u;
    b = c2[2] * (1 - u) + c3[2] * u;
  }
  return [r, g, b];
}

export const SliceViewer: React.FC<SliceViewerProps> = ({
  className,
  width = 480,
  height = 240,
  hullAxes,
  wallWidth_m,
  wallWidth_rho,
  driveDir = [1, 0, 0],
  vShip = 1.0,
  gammaGeo = 26,
  qSpoilingFactor = 1,
  gammaVdB = 3.83e1,
  dutyCycle = 0.14,
  sectors = 1,
  viewAvg = true,
  diffMode = true,
  refParams,
  sigmaRange = 6,
  exposure = 6,
  zeroStop = 1e-9,
  showContours = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const wRho = useMemo(() => {
    if (Number.isFinite(wallWidth_rho as number)) return wallWidth_rho as number;
    if (Number.isFinite(wallWidth_m as number)) {
      const aH = harmonicMean(hullAxes[0], hullAxes[1], hullAxes[2]);
      return (wallWidth_m as number) / aH;
    }
    // Canonical default used in engine: 0.016 in ρ-space
    return 0.016;
  }, [hullAxes, wallWidth_m, wallWidth_rho]);

  const dN = useMemo(() => normalize(divVec(driveDir, hullAxes as Vec3)), [driveDir, hullAxes]);

  const amp = useMemo(() => {
    const A_geo = Math.pow(gammaGeo, 3);
    const avg = viewAvg ? Math.sqrt(Math.max(1e-12, dutyCycle) / Math.max(1, sectors)) : 1.0;
    return A_geo * Math.max(1e-12, qSpoilingFactor) * Math.max(1.0, gammaVdB) * avg;
  }, [gammaGeo, qSpoilingFactor, gammaVdB, dutyCycle, sectors, viewAvg]);

  const ampRef = useMemo(() => {
    if (!diffMode) return 0;
    const g = refParams?.gammaGeo ?? gammaGeo;
    const q = refParams?.qSpoilingFactor ?? 1;
    const v = refParams?.gammaVdB ?? 3.83e1;
    const d = refParams?.dutyCycle ?? 0.14;
    const s = refParams?.sectors ?? 1;
    const avg = (refParams?.viewAvg ?? true) ? Math.sqrt(Math.max(1e-12, d) / Math.max(1, s)) : 1.0;
    return Math.pow(g, 3) * Math.max(1e-12, q) * Math.max(1.0, v) * avg;
  }, [diffMode, refParams, gammaGeo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle high-DPR displays for crisp result
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.floor(width * dpr);
    const H = Math.floor(height * dpr);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const img = ctx.createImageData(W, H);
    const data = img.data;

    const nX = W; // σ samples
    const nY = H; // φ samples

    // Precompute normalizing constants for symmetric log exposure
    const logNorm = Math.log10(1 + Math.max(1, exposure));

    // φ runs top→bottom
    for (let j = 0; j < nY; j++) {
      const phi = (j / (nY - 1)) * Math.PI * 2; // 0..2π
      // unit point on equator in ellipsoidal normed coords (y=0)
      // pN is direction only; ρ handled on X sweep
      const pHat: Vec3 = [Math.cos(phi), 0, Math.sin(phi)];
      const xs_over_rs = dot(pHat, dN); // equals cos(angle between p and drive)

      for (let i = 0; i < nX; i++) {
        // xσ ∈ [-sigmaRange, +sigmaRange]
        const xσ = -sigmaRange + (2 * sigmaRange * i) / (nX - 1);
        const ρ = 1 + xσ * wRho; // absolute ρ

        // Canonical Gaussian shell and its derivative
        const w = Math.max(1e-6, wRho);
        const f = Math.exp(-((ρ - 1) * (ρ - 1)) / (w * w));
        const dfdr = (-2 * (ρ - 1) / (w * w)) * f; // d/dρ

        // York-time proxy (matches your shader form)
        let theta = vShip * xs_over_rs * dfdr; // 1/ρ cancels because pHat has |p|=1

        // Apply amplitude chain (viewer-only)
        let value = theta * amp;

        if (diffMode) {
          const valueRef = theta * ampRef;
          value = value - valueRef;
        }

        // Symmetric log mapping to [-1,1]
        const mag = Math.log10(1 + Math.abs(value) / Math.max(zeroStop, 1e-18));
        const signed = (value < 0 ? -1 : 1) * (mag / logNorm);
        const xCol = Math.max(-1, Math.min(1, signed));

        const [r, g, b] = divergeColor(xCol);
        const idx = 4 * (j * nX + i);
        data[idx + 0] = Math.round(r * 255);
        data[idx + 1] = Math.round(g * 255);
        data[idx + 2] = Math.round(b * 255);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(img, 0, 0);

    // Optional: overlay iso-contours and axes labels
    if (showContours) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = Math.max(1, dpr);
      ctx.strokeStyle = "rgba(0,0,0,0.20)";

      // vertical σ ticks every 2σ
      for (let k = -sigmaRange; k <= sigmaRange; k += 2) {
        const i = Math.round(((k + sigmaRange) / (2 * sigmaRange)) * (W - 1));
        ctx.beginPath();
        ctx.moveTo(i + 0.5, 0);
        ctx.lineTo(i + 0.5, H);
        ctx.stroke();
      }

      // horizontal φ ticks at quadrants
      const quads = 8;
      for (let q = 0; q < quads; q++) {
        const jLine = Math.round((q / quads) * (H - 1));
        ctx.beginPath();
        ctx.moveTo(0, jLine + 0.5);
        ctx.lineTo(W, jLine + 0.5);
        ctx.stroke();
      }

      ctx.restore();

      // Labels (lightweight)
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = `${12 * dpr}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textBaseline = "top";
      ctx.fillText(`(ρ-1)/w_ρ  [±${sigmaRange}σ]`, 8 * dpr, 6 * dpr);
      ctx.textAlign = "right";
      ctx.fillText("φ ∈ [0, 2π)", W - 8 * dpr, 6 * dpr);
      if (diffMode) {
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText("Δθ vs baseline", 8 * dpr, H - 8 * dpr);
      }
      ctx.restore();
    }
  }, [
    width,
    height,
    hullAxes,
    wRho,
    dN,
    vShip,
    amp,
    ampRef,
    sigmaRange,
    exposure,
    zeroStop,
    diffMode,
    showContours,
  ]);

  return (
    <div className={clsx("rounded-xl border border-cyan-500/30 bg-slate-900/70 p-3", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-mono text-cyan-300">Equatorial Curvature Slice (ρ-space)</div>
        <div className="text-[10px] font-mono text-slate-400">
          γ³×(ΔA/A)×γ_VdB×{viewAvg ? "√(duty/sectors)" : "instant"}
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-auto block rounded-lg overflow-hidden" />
    </div>
  );
};