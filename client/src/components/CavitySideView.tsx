import * as React from "react";

type Props = {
  // Geometry (pipeline-driven)
  pocketDiameter_um: number;   // e.g. 40
  sag_nm: number;              // e.g. 16
  gap_nm: number;              // e.g. 1
  topMirror_thick_um: number;  // e.g. 1.5
  botMirror_thick_um: number;  // e.g. 1.5
  alnRim_width_um: number;     // e.g. 20 (piezo rim width)
  tileWidth_mm: number;        // e.g. 50

  // Visual/animation
  physicsParity?: boolean;
  onWindow?: boolean;

  // Canvas
  width?: number;
  height?: number;

  // NEW: readability controls (UI-only; do not affect physics)
  /** X scale: pixels per micrometer across the tile plane (defaults to "fit") */
  pxPerUmX?: number;
  /** Y vertical exaggeration (applies only to thickness/gap/sag). Keeps X to-scale. */
  verticalExaggeration?: number; // e.g. 3000 makes nm-scale clearly visible
  /** Zoom box magnification of the gap region (drawn as an inset). */
  gapInsetMagnification?: number; // e.g. 8000
  /** Optional font scale multiplier for labels. */
  fontScale?: number;
};

export default function CavitySideView({
  pocketDiameter_um,
  sag_nm,
  gap_nm,
  topMirror_thick_um,
  botMirror_thick_um,
  alnRim_width_um,
  tileWidth_mm,
  physicsParity = false,
  onWindow = false,
  width = 960,
  height = 320,
  pxPerUmX,
  verticalExaggeration,
  gapInsetMagnification,
  fontScale = 1.0,
}: Props) {

  // ---- Helper components ----
  function LabelChip({ x, y, text, tone = "neutral" }: { x:number; y:number; text:string; tone?: "neutral"|"on"|"off" }) {
    const fill = tone === "on" ? "#06b6d4" : tone === "off" ? "#475569" : "#334155";
    const textCol = tone === "on" ? "#e6ffff" : "#e5e7eb";
    return (
      <g transform={`translate(${x}, ${y})`}>
        <rect x={-6} y={-12} width={text.length * 7.2 + 12} height={16} rx={6} fill={`${fill}CC`} />
        <text x={0} y={0} fill={textCol} fontSize={11} dominantBaseline="central">{text}</text>
      </g>
    );
  }

  function DimArrow({ x, y0, y1, label }: { x:number; y0:number; y1:number; label:string }) {
    const yTop = Math.min(y0,y1), yBot = Math.max(y0,y1);
    return (
      <g>
        <line x1={x} y1={yTop} x2={x} y2={yBot} stroke="#94a3b8" strokeWidth={2}/>
        <line x1={x-6} y1={yTop} x2={x+6} y2={yTop} stroke="#94a3b8" strokeWidth={2}/>
        <line x1={x-6} y1={yBot} x2={x+6} y2={yBot} stroke="#94a3b8" strokeWidth={2}/>
        <rect x={x - 70} y={yTop + (yBot-yTop)/2 - 9} width={140} height={18} rx={6} fill="#0b1220" stroke="#334155"/>
        <text x={x} y={yTop + (yBot-yTop)/2} fill="#bfdbfe" fontSize={11} dominantBaseline="central" textAnchor="middle">{label}</text>
      </g>
    );
  }

  function Legend({ x, y, items }: { x:number; y:number; items:{c:string; label:string}[] }) {
    const rowH = 18;
    return (
      <g transform={`translate(${x},${y})`}>
        <rect x={-6} y={-6} width={180} height={rowH*items.length+12} rx={8} fill="#0b1220" stroke="#334155"/>
        {items.map((it, i)=>(
          <g key={i} transform={`translate(6, ${i*rowH})`}>
            <rect x={0} y={4} width={14} height={10} rx={2} fill={it.c}/>
            <text x={22} y={9} fill="#cbd5e1" fontSize={11} dominantBaseline="central">{it.label}</text>
          </g>
        ))}
      </g>
    );
  }

  function LocalGapInset({
    x, y, w, h,
    gap_um,
    top_um,
    bot_um,
    pocketDiameter_um,
    onWindow
  }: {
    x:number; y:number; w:number; h:number;
    gap_um:number; top_um:number; bot_um:number;
    pocketDiameter_um:number; onWindow:boolean;
  }) {
    const pad = 10;
    const innerW = w - pad * 2;
    const innerH = h - pad * 2;
    const X0 = x + pad;
    const Y0 = y + pad;

    const total = top_um + gap_um + bot_um;
    const yScale = innerH / total;

    const yTop = Y0;
    const yGap = yTop + top_um * yScale;
    const yBot = yGap + gap_um * yScale;

    // show a canonical window of 120 μm centered under pocket
    const view_um = Math.max(120, pocketDiameter_um * 1.2);
    const pxPerUmInsetX = innerW / view_um;
    const pocketW = pocketDiameter_um * pxPerUmInsetX;
    const pocketX = X0 + (innerW - pocketW) / 2;

    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill="#0b1220" stroke="#334155" rx={10}/>
        <text x={x + 12} y={y + 18} fill="#e5e7eb" fontSize={12}>Gap inset</text>

        {/* stack */}
        <rect x={X0} y={yTop} width={innerW} height={(yGap - yTop)} fill="#f59e0b" opacity={0.95} stroke="#0f172a"/>
        <rect x={X0} y={yGap} width={innerW} height={(yBot - yGap)} fill="rgba(56,189,248,0.28)" stroke="#0891b2"/>
        <rect x={X0} y={yBot} width={innerW} height={(Y0 + innerH - yBot)} fill="#94a3b8" opacity={0.96} stroke="#0f172a"/>

        {/* pocket footprint */}
        <rect x={pocketX} y={yGap} width={pocketW} height={(yBot - yGap)} fill="rgba(59,130,246,0.28)" stroke="#22d3ee"/>
        {onWindow && (
          <rect x={pocketX} y={yGap} width={pocketW * 0.35} height={(yBot - yGap)} fill="url(#glow)" opacity={0.6}/>
        )}

        {/* labels */}
        <g fill="#cbd5e1" fontSize={11}>
          <text x={X0 + 8} y={yTop + 14}>top {top_um.toFixed(1)} μm</text>
          <text x={X0 + 8} y={yGap + 14}>gap {(gap_um*1000).toFixed(2)} nm</text>
          <text x={X0 + 8} y={yBot + 14}>bottom {bot_um.toFixed(1)} μm</text>
        </g>
      </g>
    );
  }

  // --- units & scales ---
  const umPerMm = 1000;
  const tileWidth_um = tileWidth_mm * umPerMm;

  // Fit X automatically if not provided
  const pxPerUmX_eff = pxPerUmX ?? ((width - 48) / Math.max(1, tileWidth_um)); // 24px margin each side
  // Make nm-scale visible vertically (exaggeration only on Y)
  const veY = Math.max(100, verticalExaggeration ?? 4000);
  // Zoom box magnification for the gap/pocket region (reserved, not currently used directly)
  // const insetMag = Math.max(100, gapInsetMagnification ?? 10000);

  // Derived geometry
  const pocketR_um = pocketDiameter_um / 2;
  const sag_um = sag_nm * 1e-3;
  const gap_um = gap_nm * 1e-3;

  // Layout helpers
  const margin = 24;
  const W = width;
  const H = height;
  const X0 = margin;
  const X1 = W - margin;

  // Fix scaling issue: don't mix horizontal and vertical scales for Y positioning  
  // For nanometer features to be visible, we need much more aggressive Y scaling
  // Gap is 0.001 μm (1 nm), we want at least 8 pixels for visibility: 8 px / 0.001 μm = 8000 px/μm
  const pxPerUmY = veY; // Use full vertical exaggeration: 8000 px/μm

  // DEBUG: Log scaling calculations for 1nm gap issue
  if (gap_nm <= 2) {
    console.debug("[CavitySideView] Scaling debug - FIXED VERSION:", {
      gap_nm, gap_um, sag_nm, sag_um,
      tileWidth_mm, tileWidth_um,
      scales: { veY, pxPerUmX_eff, pxPerUmY },
      canvas: { width, height },
      OLD_scaling: {
        gaps_px_old: gap_um * veY * pxPerUmX_eff,
        sag_px_old: sag_um * veY * pxPerUmX_eff
      },
      NEW_scaling: {
        gaps_px_new: gap_um * pxPerUmY,
        sag_px_new: sag_um * pxPerUmY,
        pocket_span_px: pocketDiameter_um * pxPerUmX_eff,
        pocket_diameter_um: pocketDiameter_um,
        calculated_visibility: {
          gap_visible: gap_um * pxPerUmY >= 4,
          sag_visible: sag_um * pxPerUmY >= 4,
          pocket_visible: pocketDiameter_um * pxPerUmX_eff >= 4
        }
      }
    });
  }
  
  // Baseline (top of bottom mirror) - use proper Y scale
  const baselineY = H - margin - botMirror_thick_um * pxPerUmY;

  // Layers (Y thicknesses with proper vertical scale)
  const yBotMirrorTop = baselineY;
  const yBotMirrorBottom = yBotMirrorTop + botMirror_thick_um * pxPerUmY;

  const yGapTop    = yBotMirrorTop - gap_um * pxPerUmY;
  const yTopMirror = yGapTop - topMirror_thick_um * pxPerUmY;

  // Pocket profile (spherical cap approximation)
  // draw as a circular arc inside the top mirror: center chosen to produce sag at midspan
  const pocketCenterX = (X0 + X1) / 2;
  const pocketSpanPx = pocketDiameter_um * pxPerUmX_eff;
  const pocketSagPx  = sag_um * pxPerUmY;

  // Guard against zero/near-zero sag to avoid division by zero
  const pocketRpx =
    pocketSagPx > 1e-9
      ? (pocketSpanPx ** 2) / (8 * pocketSagPx) + pocketSagPx / 2
      : Infinity;

  const pocketCenterY = Number.isFinite(pocketRpx)
    ? (yTopMirror + pocketRpx - pocketSagPx)
    : yTopMirror;

  // Local helper so it's always in scope where it's used
  const describePocketArc = React.useCallback((
    _cx: number, _cy: number, r: number,
    xL: number, yL: number,
    xR: number, yR: number
  ) => {
    if (!Number.isFinite(r) || r <= 0) return ""; // guard for tiny/zero sag
    // Draw arc from left to right along the circle centered at (cx,cy)
    // Using SVG large-arc-flag = 0, sweep-flag = 1
    return `M ${xL} ${yL} A ${r} ${r} 0 0 1 ${xR} ${yR}`;
  }, []);

  // Only draw the dashed arc when sag is positive and radius finite/reasonable
  const drawPocketArc =
    pocketSagPx > 0.1 && // > 0.1 px visual sag
    Number.isFinite(pocketRpx) &&
    pocketRpx < 1e6;

  // Colors (UI)
  const colTop = physicsParity ? "#6b7280" : "#f59e0b";   // gold when live, muted in parity
  const colBot = "#94a3b8";
  const colGap = physicsParity ? "rgba(30,58,138,0.25)" : "rgba(14,165,233,0.25)";
  const colBlueShift = physicsParity ? "rgba(99,102,241,0.2)" : "rgba(56,189,248,0.22)";

  // Animation pulse for ON window glow
  const [pulse, setPulse] = React.useState(0);
  React.useEffect(() => {
    let raf = 0;
    let t0: number | null = null;
    const loop = (t: number) => {
      if (t0 == null) t0 = t;
      const dt = (t - t0) / 1000;
      setPulse(Math.sin(dt * (onWindow ? 6 : 1)) * 0.5 + 0.5);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [onWindow]);

  // Render
  return (
    <svg width={W} height={H} className="w-full rounded-xl ring-1 ring-slate-800 bg-[#0b1220]">
      {/* X ruler */}
      <g transform={`translate(${X0}, ${H - 10})`} opacity={0.9}>
        <line x1={0} y1={0} x2={(tileWidth_um) * pxPerUmX_eff} y2={0} stroke="#1f2937" strokeWidth={3}/>
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
          <g key={i} transform={`translate(${f * tileWidth_um * pxPerUmX_eff}, 0)`}>
            <line x1={0} y1={0} x2={0} y2={-7} stroke="#334155" strokeWidth={2}/>
            <text x={0} y={-9} fill="#a3a3a3" fontSize={11 * fontScale} textAnchor="middle">
              {(tileWidth_mm * f).toFixed(0)} mm
            </text>
          </g>
        ))}
      </g>

      {/* Bottom mirror (fixed) */}
      <rect
        x={X0}
        y={yBotMirrorTop}
        width={(tileWidth_um) * pxPerUmX_eff}
        height={botMirror_thick_um * veY * pxPerUmX_eff}
        fill={colBot}
        opacity={0.95}
        stroke="#0f172a"
        strokeWidth={2}
      />
      <LabelChip x={X0 + 10} y={yBotMirrorTop - 10} text="Nb₃Sn (fixed)" />

      {/* Gap region */}
      <rect
        x={X0}
        y={yGapTop}
        width={(tileWidth_um) * pxPerUmX_eff}
        height={gap_um * veY * pxPerUmX_eff}
        fill={colGap}
        stroke="#0891b2"
        strokeWidth={1.5}
      />

      {/* Blue-shift region under pocket footprint */}
      <rect
        x={pocketCenterX - (pocketDiameter_um * pxPerUmX_eff) / 2}
        y={yGapTop}
        width={pocketDiameter_um * pxPerUmX_eff}
        height={gap_um * veY * pxPerUmX_eff}
        fill={colBlueShift}
        opacity={0.9}
        stroke="#22d3ee"
        strokeWidth={1}
      />

      {/* Top mirror (moving diaphragm) */}
      <rect
        x={X0}
        y={yTopMirror}
        width={(tileWidth_um) * pxPerUmX_eff}
        height={topMirror_thick_um * veY * pxPerUmX_eff}
        fill={colTop}
        opacity={0.96}
        stroke="#0f172a"
        strokeWidth={2}
      />
      <LabelChip
        x={X0 + 10}
        y={yTopMirror - 12}
        text={`Graphene + Nb₃Sn (moving) · ${onWindow ? "ON" : "OFF"}`}
        tone={onWindow ? "on" : "off"}
      />

      {/* Pocket spherical-cap cue (dashed arc) */}
      {drawPocketArc && (
        <path
          d={describePocketArc(
            pocketCenterX,
            pocketCenterY,
            pocketRpx,
            pocketCenterX - pocketSpanPx / 2,
            yTopMirror,
            pocketCenterX + pocketSpanPx / 2,
            yTopMirror
          )}
          fill="none"
          stroke="#67e8f9"
          strokeDasharray="6 6"
          strokeWidth={2}
          opacity={0.9}
        />
      )}

      {/* Gap dimension arrow + label (right side) */}
      <DimArrow
        x={X1 - 30}
        y0={yGapTop}
        y1={yGapTop + gap_um * veY * pxPerUmX_eff}
        label={`a = ${gap_nm.toFixed(2)} nm`}
      />

      {/* Right-side numeric labels */}
      <g fontSize={11 * fontScale} fill="#93c5fd">
        <text x={X1 - 10} y={yTopMirror + 16} textAnchor="end">sag t = {sag_nm.toFixed(1)} nm</text>
        <text x={X1 - 10} y={yBotMirrorBottom + 14} textAnchor="end">pocket ⌀ = {pocketDiameter_um.toFixed(0)} μm</text>
      </g>

      {/* ON glow sweep (subtle) */}
      {onWindow && (
        <rect
          x={pocketCenterX - (pocketDiameter_um * pxPerUmX_eff) / 2}
          y={yGapTop}
          width={(pocketDiameter_um * pxPerUmX_eff) * (0.20 + 0.80 * pulse)}
          height={gap_um * veY * pxPerUmX_eff}
          fill="url(#glow)"
          opacity={0.55}
        />
      )}

      {/* Legend (top-left) */}
      <Legend x={X0 + 6} y={margin + 6} items={[
        { c:"#f59e0b", label:"Moving diaphragm" },
        { c:"#94a3b8", label:"Fixed mirror" },
        { c:"#22d3ee", label:"Vacuum gap a" },
        { c:"#38bdf8", label:"Blue-shift region" },
      ]}/>

      {/* Gap inset (top-right) */}
      <LocalGapInset
        x={W - (Math.min(380, W * 0.44)) - 12}
        y={margin + 8}
        w={Math.min(380, W * 0.44)}
        h={120}
        gap_um={gap_um}
        top_um={topMirror_thick_um}
        bot_um={botMirror_thick_um}
        pocketDiameter_um={pocketDiameter_um}
        onWindow={onWindow}
      />

      {/* gradient defs */}
      <defs>
        <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.95"/>
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
