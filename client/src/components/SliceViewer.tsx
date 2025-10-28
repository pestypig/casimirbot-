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
  viewAvg?: boolean; // true→(duty/sectors), false→instant

  // Engine sync
  dutyEffectiveFR?: number; // ship-wide FR duty (0..1)
  physicsParityMode?: boolean; // true => no boost, unity viz chain

  // Live strobing (REAL instant view)
  instantStrobe?: boolean; // false => avg; true => show sector polarity
  split?: number; // current (+/−) split boundary from engine
  strobeWidth?: number; // softness for tanh boundary (default 0.75)

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

  // Curvature gain controls (matches WarpVisualizer)
  curvatureGain?: number; // 0-8 slider range for blend control
  curvatureBoostMax?: number; // maximum boost multiplier (default 40)
  viewMassFraction?: number; // view mass fraction for per-width scaling
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
  dutyEffectiveFR,
  physicsParityMode = false,
  instantStrobe = false,
  split = 0,
  strobeWidth = 0.75,
  diffMode = false,
  refParams,
  sigmaRange = 6,
  exposure = 6,
  zeroStop = 1e-9,
  showContours = true,
  curvatureGain = 6.0,
  curvatureBoostMax = 40,
  viewMassFraction = 1.0,
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

  const safeAxes = useMemo(
    () => [Math.max(1e-9, hullAxes[0]), Math.max(1e-9, hullAxes[1]), Math.max(1e-9, hullAxes[2])] as Vec3,
    [hullAxes]
  );
  const dN = useMemo(() => normalize(divVec(driveDir, safeAxes)), [driveDir, safeAxes]);

  const amp = useMemo(() => {
    try {
      // Validate input parameters
      const validGammaGeo = Number.isFinite(gammaGeo) && gammaGeo > 0 ? gammaGeo : 26;
      const validQSpoiling = Number.isFinite(qSpoilingFactor) && qSpoilingFactor >= 0 ? qSpoilingFactor : 1;
      const validGammaVdB = Number.isFinite(gammaVdB) && gammaVdB >= 0 ? gammaVdB : 3.83e1;
      const validDutyCycle = Number.isFinite(dutyCycle) && dutyCycle > 0 ? dutyCycle : 0.14;
      const validSectors = Number.isFinite(sectors) && sectors >= 1 ? sectors : 1;
      const validViewMassFraction = Number.isFinite(viewMassFraction) && viewMassFraction > 0 ? viewMassFraction : 1.0;

      // Canonical theta scale calculation (physics chain)
      const avg = viewAvg
        ? (Number.isFinite(dutyEffectiveFR) && (dutyEffectiveFR as number) > 0
            ? Math.max(1e-12, dutyEffectiveFR as number)
            : Math.max(1e-12, validDutyCycle) / Math.max(1, validSectors))
        : 1.0;

      const thetaScaleCanonical =
        Math.pow(validGammaGeo, 3) *
        Math.max(1e-12, validQSpoiling) *
        Math.max(1.0, validGammaVdB) *
        avg;

      // Apply view mass fraction after canonical chain
      const thetaScaleUsed = thetaScaleCanonical * validViewMassFraction;

      // Visual boost (parity mode kills boosts, otherwise respect viewer gain)
      const validCurvatureGain = Number.isFinite(curvatureGain) ? curvatureGain : 6.0;
      const validBoostMax = Number.isFinite(curvatureBoostMax) && curvatureBoostMax > 0 ? curvatureBoostMax : 40;
      const curvatureGainT = Math.max(0, Math.min(1, validCurvatureGain / 8));
      const boost = physicsParityMode ? 1 : (1 - curvatureGainT) + curvatureGainT * validBoostMax;

      const result = thetaScaleUsed * boost;

      // Debug logging for amplitude calculation
      console.log('[SliceViewer] Amplitude calculation:', {
        inputs: { gammaGeo: validGammaGeo, qSpoilingFactor: validQSpoiling, gammaVdB: validGammaVdB },
        avg, thetaScaleCanonical, thetaScaleUsed, boost, result,
        physicsParityMode, viewAvg, dutyEffectiveFR
      });

      return Number.isFinite(result) ? result : 1e-12;
    } catch (error) {
      console.error('[SliceViewer] Error in amplitude calculation:', error);
      return 1e-12;
    }
  }, [
    gammaGeo, qSpoilingFactor, gammaVdB,
    viewAvg, dutyEffectiveFR, dutyCycle, sectors,
    physicsParityMode, curvatureGain, curvatureBoostMax, viewMassFraction
  ]);

  const ampRef = useMemo(() => {
    if (!diffMode) return 0;
    const g = refParams?.gammaGeo ?? gammaGeo;
    const q = refParams?.qSpoilingFactor ?? qSpoilingFactor;
    const v = refParams?.gammaVdB ?? gammaVdB;

    // Reference averaging mirrors primary averaging rule:
    const avgRef = (refParams?.viewAvg ?? viewAvg)
      ? (Number.isFinite(dutyEffectiveFR)
          ? Math.max(1e-12, dutyEffectiveFR as number)
          : Math.max(1e-12, (refParams?.dutyCycle ?? dutyCycle)) /
              Math.max(1, (refParams?.sectors ?? sectors)))
      : 1.0;

    return Math.pow(g, 3) * Math.max(1e-12, q) * Math.max(1.0, v) * avgRef;
  }, [
    diffMode, refParams,
    gammaGeo, qSpoilingFactor, gammaVdB,
    dutyCycle, sectors, viewAvg, dutyEffectiveFR
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('[SliceViewer] Canvas ref not available');
      return;
    }
    
    if (width <= 0 || height <= 0) {
      console.warn('[SliceViewer] Invalid canvas dimensions:', { width, height });
      return;
    }

    // Handle high-DPR displays for crisp result (but cap at 2x for performance)
    const dpr = Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
    const W = Math.max(1, Math.floor(width * dpr));
    const H = Math.max(1, Math.floor(height * dpr));
    
    // Only resize if dimensions changed
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      console.error('[SliceViewer] Failed to get 2D context');
      return;
    }

    let img: ImageData;
    try {
      img = ctx.createImageData(W, H);
    } catch (error) {
      console.error('[SliceViewer] Failed to create ImageData:', error);
      return;
    }
    
    const data = img.data;
    if (!data || data.length !== W * H * 4) {
      console.error('[SliceViewer] Invalid ImageData:', { W, H, dataLength: data?.length });
      return;
    }

    const nX = W; // σ samples
    const nY = H; // φ samples

    // Precompute normalizing constants for symmetric log exposure
    const logNorm = Math.log10(1 + Math.max(1, exposure));

    // φ runs top→bottom
    for (let j = 0; j < nY; j++) {
      const phi = (j / Math.max(1, nY - 1)) * Math.PI * 2; // 0..2π, avoid division by zero
      // unit point on equator in ellipsoidal normed coords (y=0)
      // pN is direction only; ρ handled on X sweep
      const pHat: Vec3 = [Math.cos(phi), 0, Math.sin(phi)];
      const xs_over_rs = dot(pHat, dN); // equals cos(angle between p and drive)
      
      // Validate critical calculations
      if (!Number.isFinite(xs_over_rs)) {
        console.warn('[SliceViewer] Invalid xs_over_rs at phi:', phi);
        continue;
      }

      // Optional: REAL strobing sign tied to current split
      let strobeSign = 1;
      if (instantStrobe && sectors >= 1) {
        const S = Math.max(1, sectors);
        const splitNorm = (typeof split === "number" && Number.isFinite(split))
          ? (split < 1 ? split * S : split)
          : S / 2;
        const splitIdx = Math.max(0, Math.min(S - 1, Math.floor(splitNorm)));
        const u = (phi % (2 * Math.PI)) / (2 * Math.PI);        // [0,1)
        const k = Math.floor(u * S);                             // sector index at this φ
        const distToSplit = (k - splitIdx + 0.5);                // sector units
        const w = strobeWidth ?? 0.75;
        strobeSign = Math.tanh(-distToSplit / Math.max(1e-6, w)); // smooth ±1
      }

      for (let i = 0; i < nX; i++) {
        // xSigma ∈ [-sigmaRange, +sigmaRange]
        const xSigma = -sigmaRange + (2 * sigmaRange * i) / Math.max(1, (nX - 1));
        const rho = 1 + xSigma * wRho; // absolute ρ

        // Canonical Gaussian shell and its derivative
        const w = Math.max(1e-6, wRho);
        const rhoDiff = rho - 1;
        const f = Math.exp(-(rhoDiff * rhoDiff) / (w * w));
        const dfdr = (-2 * rhoDiff / (w * w)) * f; // d/dρ

        // Validate critical calculations
        if (!Number.isFinite(f) || !Number.isFinite(dfdr)) {
          console.warn('[SliceViewer] Invalid Gaussian calculation:', { rho, w, f, dfdr });
          continue;
        }

        // York-time proxy (matches your shader form)
        let theta = vShip * xs_over_rs * dfdr * strobeSign;

        // Apply amplitude chain (viewer-only)
        let value = theta * amp;

        if (diffMode) {
          const valueRef = theta * ampRef;
          value = value - valueRef;
        }

        // Validate value before color mapping
        if (!Number.isFinite(value)) {
          value = 0;
        }

        // Symmetric log mapping to [-1,1]
        const absValue = Math.abs(value);
        const mag = Math.log10(1 + absValue / Math.max(zeroStop, 1e-18));
        const signed = (value < 0 ? -1 : 1) * (mag / Math.max(1e-12, logNorm));
        const xCol = Math.max(-1, Math.min(1, signed));

        const [r, g, b] = divergeColor(xCol);
        const idx = 4 * (j * nX + i);
        data[idx + 0] = Math.round(Math.max(0, Math.min(255, r * 255)));
        data[idx + 1] = Math.round(Math.max(0, Math.min(255, g * 255)));
        data[idx + 2] = Math.round(Math.max(0, Math.min(255, b * 255)));
        data[idx + 3] = 255;
      }
    }

    try {
      ctx.putImageData(img, 0, 0);
    } catch (error) {
      console.error('[SliceViewer] Failed to put ImageData:', error);
      return;
    }

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
    // Serialize complex objects to prevent unnecessary re-renders
    JSON.stringify(hullAxes),
    wRho,
    JSON.stringify(dN),
    vShip,
    amp,
    ampRef,
    sigmaRange,
    exposure,
    zeroStop,
    diffMode,
    showContours,
    instantStrobe,
    split,
    strobeWidth,
  ]);

  return (
    <div className={clsx("rounded-xl border border-cyan-500/30 bg-slate-900/70 p-3", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-mono text-cyan-300">
          Equatorial Curvature Slice (ρ-space)
          {physicsParityMode && <span className="ml-1 text-green-400">[REAL]</span>}
          {instantStrobe && <span className="ml-1 text-orange-400">[LIVE]</span>}
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          γ³×(ΔA/A)×γ_VdB×{viewAvg ? (dutyEffectiveFR !== undefined ? "(FR-duty/sectors)" : "(duty/sectors)") : "instant"}
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-auto block rounded-lg overflow-hidden" />
    </div>
  );
};
