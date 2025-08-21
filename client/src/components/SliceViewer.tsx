import React, { useMemo, useRef, useEffect } from "react";
import clsx from "clsx";

type Vec3 = [number, number, number];

export interface SliceViewerProps {
  hullAxes: [number, number, number];       // [a, b, c] in meters (semi-axes)
  wallWidth_m?: number;
  driveDir?: Vec3;
  vShip?: number;

  // amplitude chain (viewer-only)
  gammaGeo?: number;
  qSpoilingFactor?: number;
  gammaVdB?: number;
  dutyCycle?: number;
  sectors?: number;
  viewAvg?: boolean;

  // diff vs hover
  diffMode?: boolean;
  refParams?: Partial<{
    gammaGeo: number;
    qSpoilingFactor: number;
    gammaVdB: number;
    dutyCycle: number;
    sectors: number;
    viewAvg: boolean;
  }>;

  // visual controls
  sigmaRange?: number;
  exposure?: number;
  zeroStop?: number;
  showContours?: boolean;

  // canvas size
  width?: number;
  height?: number;

  // optional className
  className?: string;
}

/** Nice step utility for axis ticks (1, 2, 5 × 10^n) */
function niceStep(spanMeters: number, targetTicks = 8) {
  const rough = spanMeters / targetTicks;
  const pow10 = Math.pow(10, Math.floor(Math.log10(Math.max(rough, 1e-9))));
  const n = rough / pow10;
  const mult = n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10;
  return mult * pow10;
}

/** Format length in meters with unit scaling (m / 10 m / 100 m / km) */
function fmtMeters(m: number) {
  const a = Math.abs(m);
  if (a >= 1000) return `${(m / 1000).toFixed(2)} km`;
  if (a >= 100)  return `${m.toFixed(0)} m`;
  if (a >= 10)   return `${m.toFixed(1)} m`;
  return `${m.toFixed(2)} m`;
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
  
  if (x <= -1) return [30/255, 90/255, 160/255];
  if (x >= 1) return [220/255, 100/255, 30/255];
  
  if (x < 0) {
    const t = clamp(-x);
    return [
      30/255 + t * (1 - 30/255),
      90/255 + t * (1 - 90/255),
      160/255 + t * (1 - 160/255)
    ];
  } else {
    const t = clamp(x);
    return [
      1 + t * (220/255 - 1),
      1 + t * (100/255 - 1),
      1 + t * (30/255 - 1)
    ];
  }
}

function smoothSign(x: number, k = 50) {
  return Math.tanh(k * x);
}

function natarioAmplitude(
  rho: number,
  sigma: number,
  ship_R: number,
  wall_widthRho: number,
  gammaGeoEff: number
): number {
  const rhoNorm = rho / ship_R;
  const vs = 1.0;
  const rhoW = wall_widthRho / ship_R;
  const deltaRho = rhoNorm - 1.0;
  const deltaRhoAbs = Math.abs(deltaRho);
  
  if (deltaRhoAbs > rhoW) return 0;
  
  const u = deltaRhoAbs / rhoW;
  const envelope = Math.exp(-u * u / (2 * sigma * sigma));
  const soft = smoothSign(deltaRho / rhoW);
  
  const factor = gammaGeoEff * vs * vs;
  return -factor * envelope * soft;
}

export function SliceViewer(props: SliceViewerProps) {
  const {
    hullAxes,
    wallWidth_m = 2.27,
    driveDir = [1, 0, 0],
    vShip = 1.0,

    gammaGeo = 26,
    qSpoilingFactor = 1,
    gammaVdB = 3.83e1,
    dutyCycle = 0.14,
    sectors = 1,
    viewAvg = true,

    diffMode = false,
    refParams,

    sigmaRange = 6,
    exposure = 8,
    zeroStop = 1e-7,
    showContours = true,

    width = 480,
    height = 240,
    className,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Physics calculations
  const physicsData = useMemo(() => {
    const [a, b, c] = hullAxes;
    const ship_R = harmonicMean(a, b, c);
    const wall_widthRho = wallWidth_m;
    
    // Amplitude chain calculation
    const chainBase = gammaGeo * qSpoilingFactor * gammaVdB;
    const dutyFactor = viewAvg ? Math.sqrt(dutyCycle / sectors) : dutyCycle;
    const gammaGeoEff = chainBase * dutyFactor;
    
    return { ship_R, wall_widthRho, gammaGeoEff };
  }, [hullAxes, wallWidth_m, gammaGeo, qSpoilingFactor, gammaVdB, dutyCycle, sectors, viewAvg]);

  // Reference physics for diff mode
  const refPhysicsData = useMemo(() => {
    if (!diffMode || !refParams) return null;
    
    const [a, b, c] = hullAxes;
    const ship_R = harmonicMean(a, b, c);
    const wall_widthRho = wallWidth_m;
    
    const refGamma = refParams.gammaGeo ?? 26;
    const refQ = refParams.qSpoilingFactor ?? 1;
    const refVdB = refParams.gammaVdB ?? 3.83e1;
    const refDuty = refParams.dutyCycle ?? 0.14;
    const refSectors = refParams.sectors ?? 1;
    const refViewAvg = refParams.viewAvg ?? true;
    
    const refChainBase = refGamma * refQ * refVdB;
    const refDutyFactor = refViewAvg ? Math.sqrt(refDuty / refSectors) : refDuty;
    const refGammaGeoEff = refChainBase * refDutyFactor;
    
    return { ship_R, wall_widthRho, gammaGeoEff: refGammaGeoEff };
  }, [diffMode, refParams, hullAxes, wallWidth_m]);

  // Render equatorial slice
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const margin = { L: 40, R: 18, T: 18, B: 40 };
    const W = width - margin.L - margin.R;
    const H = height - margin.T - margin.B;

    const [a, c] = [hullAxes[0], hullAxes[2]];
    const rhoExtent = Math.max(a, c) * 1.5; // Extend beyond hull
    
    // Create ImageData for pixel-level rendering
    const imageData = ctx.createImageData(W, H);
    const data = imageData.data;

    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        // Map pixel to equatorial coordinates
        const x = ((px / W) - 0.5) * 2 * rhoExtent; // forward/aft
        const z = ((py / H) - 0.5) * 2 * rhoExtent; // port/starboard (flipped for screen coords)
        
        const rho = Math.sqrt(x*x + z*z);
        const sigma = 0.1; // Fixed sigma for visualization
        
        // Calculate amplitude
        let amplitude = natarioAmplitude(
          rho,
          sigma,
          physicsData.ship_R,
          physicsData.wall_widthRho,
          physicsData.gammaGeoEff
        );
        
        // Diff mode
        if (diffMode && refPhysicsData) {
          const refAmplitude = natarioAmplitude(
            rho,
            sigma,
            refPhysicsData.ship_R,
            refPhysicsData.wall_widthRho,
            refPhysicsData.gammaGeoEff
          );
          amplitude = amplitude - refAmplitude;
        }
        
        // Apply exposure scaling and color mapping
        const scaledAmp = amplitude * Math.pow(10, exposure - 8);
        const clampedAmp = Math.max(-1, Math.min(1, scaledAmp));
        const [r, g, b] = divergeColor(clampedAmp);
        
        const idx = (py * W + px) * 4;
        data[idx] = Math.round(r * 255);     // R
        data[idx + 1] = Math.round(g * 255); // G
        data[idx + 2] = Math.round(b * 255); // B
        data[idx + 3] = 255;                 // A
      }
    }

    // Draw the rendered slice
    ctx.putImageData(imageData, margin.L, margin.T);

    // Add contours if enabled
    if (showContours) {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.lineWidth = 0.5;
      
      // Draw hull ellipse
      ctx.beginPath();
      ctx.ellipse(
        margin.L + W/2,
        margin.T + H/2,
        (a / rhoExtent) * W/2,
        (c / rhoExtent) * H/2,
        0, 0, Math.PI * 2
      );
      ctx.stroke();
    }

  }, [
    hullAxes, wallWidth_m, driveDir, vShip,
    gammaGeo, qSpoilingFactor, gammaVdB, dutyCycle, sectors, viewAvg,
    diffMode, refParams, sigmaRange, exposure, zeroStop, showContours,
    width, height, physicsData, refPhysicsData
  ]);

  // Dynamic axes + scale derived from hull geometry
  const { a_m, c_m, tickX, tickZ, pxPerMeterX, pxPerMeterZ } = useMemo(() => {
    const a_m = hullAxes?.[0] ?? 503.5;
    const c_m = hullAxes?.[2] ?? 86.5;

    // Leave a small margin so labels don't clip
    const marginL = 40, marginR = 18, marginT = 18, marginB = 40;
    const innerW = Math.max(1, width - marginL - marginR);
    const innerH = Math.max(1, height - marginT - marginB);

    // Map x∈[-a,a] → innerW; z∈[-c,c] → innerH
    const pxPerMeterX = innerW / (2 * a_m);
    const pxPerMeterZ = innerH / (2 * c_m);

    // Choose "nice" tick spacing to get ~6–10 major lines
    const tickX = niceStep(2 * a_m, 9);
    const tickZ = niceStep(2 * c_m, 9);

    return { a_m, c_m, tickX, tickZ, pxPerMeterX, pxPerMeterZ };
  }, [hullAxes, width, height]);

  // Precompute positions for ticks (centered at (0,0) in data → center in pixels)
  const layout = useMemo(() => {
    const margin = { L: 40, R: 18, T: 18, B: 40 };
    const W = width - margin.L - margin.R;
    const H = height - margin.T - margin.B;

    const cx = margin.L + W / 2; // pixel center for x=0
    const cz = margin.T + H / 2; // pixel center for z=0

    // Generate ticks symmetric around 0 for x and z
    const ticksX: number[] = [];
    for (let x = 0; x <= a_m; x += tickX) {
      if (x > 0) ticksX.push(-x);
      ticksX.push(x);
    }
    ticksX.sort((p, q) => p - q);

    const ticksZ: number[] = [];
    for (let z = 0; z <= c_m; z += tickZ) {
      if (z > 0) ticksZ.push(-z);
      ticksZ.push(z);
    }
    ticksZ.sort((p, q) => p - q);

    // Convert to pixel coordinates
    const xToPx = (xm: number) => cx + xm * pxPerMeterX;
    const zToPx = (zm: number) => cz - zm * pxPerMeterZ; // screen y grows downward

    return { margin, W, H, cx, cz, ticksX, ticksZ, xToPx, zToPx };
  }, [a_m, c_m, tickX, tickZ, pxPerMeterX, pxPerMeterZ, width, height]);

  return (
    <div className={clsx(className)} style={{ position: "relative" }}>
      {/* Base slice (white background with heatmap/contours) */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ display: "block", width, height, background: "#fff" }}
      />

      {/* Axis + grid overlay (SVG so text is crisp) */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {/* Inner frame */}
        <rect
          x={layout.margin.L}
          y={layout.margin.T}
          width={layout.W}
          height={layout.H}
          fill="none"
          stroke="rgba(30,41,59,0.65)"        // slate-800-ish
          strokeWidth={1}
        />

        {/* Vertical grid lines (x ticks) */}
        {layout.ticksX.map((xm, i) => {
          const x = layout.xToPx(xm);
          const isZero = Math.abs(xm) < 1e-9;
          return (
            <g key={`gx-${i}`}>
              <line
                x1={x}
                y1={layout.margin.T}
                x2={x}
                y2={layout.margin.T + layout.H}
                stroke={isZero ? "rgba(56,189,248,0.6)" : "rgba(51,65,85,0.25)"} // cyan-400 for x=0, slate-700 for others
                strokeWidth={isZero ? 1.5 : 1}
              />
              {!isZero && (
                <text
                  x={x}
                  y={layout.margin.T + layout.H + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fill="rgba(100,116,139,0.9)" // slate-400
                >
                  {fmtMeters(xm)}
                </text>
              )}
            </g>
          );
        })}

        {/* Horizontal grid lines (z ticks) */}
        {layout.ticksZ.map((zm, i) => {
          const y = layout.zToPx(zm);
          const isZero = Math.abs(zm) < 1e-9;
          return (
            <g key={`gz-${i}`}>
              <line
                x1={layout.margin.L}
                y1={y}
                x2={layout.margin.L + layout.W}
                y2={y}
                stroke={isZero ? "rgba(251,146,60,0.6)" : "rgba(51,65,85,0.25)"} // orange-400 for z=0, slate-700 for others
                strokeWidth={isZero ? 1.5 : 1}
              />
              {!isZero && (
                <text
                  x={layout.margin.L - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="rgba(100,116,139,0.9)" // slate-400
                >
                  {fmtMeters(zm)}
                </text>
              )}
            </g>
          );
        })}

        {/* Axis labels */}
        <text
          x={layout.margin.L + layout.W / 2}
          y={height - 8}
          textAnchor="middle"
          fontSize="11"
          fontWeight={600}
          fill="rgba(148,163,184,0.95)" // slate-300
        >
          x (forward / aft) — span ±{fmtMeters(a_m)}
        </text>

        <text
          x={12}
          y={layout.margin.T + layout.H / 2}
          textAnchor="start"
          transform={`rotate(-90 12 ${layout.margin.T + layout.H / 2})`}
          fontSize="11"
          fontWeight={600}
          fill="rgba(148,163,184,0.95)" // slate-300
        >
          z (port / starboard) — span ±{fmtMeters(c_m)}
        </text>

        {/* Scale legend (shows current major tick spacing) */}
        <rect
          x={width - 168}
          y={layout.margin.T + 8}
          width={156}
          height={36}
          rx={6}
          fill="rgba(2,6,23,0.65)"       // slate-950 with opacity
          stroke="rgba(30,41,59,0.7)"
        />
        <text x={width - 160 + 8} y={layout.margin.T + 22} fontSize="11" fill="rgba(203,213,225,0.95)">
          Grid Δx = {fmtMeters(tickX)}
        </text>
        <text x={width - 160 + 8} y={layout.margin.T + 36} fontSize="11" fill="rgba(203,213,225,0.95)">
          Grid Δz = {fmtMeters(tickZ)}
        </text>
      </svg>
    </div>
  );
}