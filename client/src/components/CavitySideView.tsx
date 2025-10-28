import * as React from "react";
import { computeCavityScaling } from "./cavityScaling";
import InfoDot from "./InfoDot";

type Props = {
  /** Visual variant preset: 'full' shows all chrome, 'embedded' minimal (can be overridden by explicit show* props) */
  variant?: 'full' | 'embedded';
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
  /** Override target pixel height for a 1 nm gap (default adaptive 6–12 px). */
  gapTargetPxFor1nm?: number;
  /** Mirror compression factor relative to gap scale (default 0.025). */
  mirrorCompression?: number;
  /** Animate pocket sag (sinusoidal) for modulation visualization. */
  animateSag?: boolean;
  /** Fractional oscillation amplitude relative to nominal sag (default 0.25). */
  sagOscillationFraction?: number;
  /** Optional modulation frequency (Hz) to sync animation tempo. */
  modulationFreq_Hz?: number;
  /** Force position of gap inset for predictable layout on narrow widths. */
  insetPosition?: 'auto' | 'top-right' | 'bottom-right';
  /** Toggle internal legend block */
  showLegend?: boolean;
  /** Toggle vertical exaggeration scale block */
  showScaleLegend?: boolean;
  /** Toggle miniature gap inset overlay */
  showInset?: boolean;
  /** Toggle top x-axis ruler */
  showRuler?: boolean;
  /** Toggle dashed pocket arc guide */
  showPocketArc?: boolean;
  /** Toggle dimension + numeric labels (right side + chips) */
  showLabels?: boolean;
  /** Show debug overlay & console metrics for layout/overlap diagnostics */
  debugLayout?: boolean;
  /** Automatically increase height so geometry + labels have breathing room */
  autoHeight?: boolean;
  /** Extra clearance (px) below geometry inside canvas when autoHeight is active */
  autoHeightExtraClearance?: number;
  /** External phase (0..1 cyc) for sag oscillation; overrides internal time animation if provided */
  externalSagPhase?: number;
  /** Highlight currently focused pipeline step (1..8) for visual emphasis */
  highlightStep?: 1|2|3|4|5|6|7|8;
  // --- Physics bindings for explanatory overlays (UI-only; do not affect geometry) ---
  /** Geometry blue-shift factor (γ_geo) used to show a_eq and λ_cut(eq) */
  gammaGeo?: number;
  /** Surface resistance (nΩ) for conductor loss cue */
  surfaceResistance_nOhm?: number;
  /** Geometry factor (Ohms) to derive Rs ≈ G/Q when Rs missing */
  geometryFactor_Ohm?: number;
  /** Cavity Q for DCE and loss cues */
  qCav?: number;
  /** Modulation angular frequency (rad/s) for display */
  omega_rad_s?: number;
  /** Modulation linear frequency (Hz) for display */
  f_Hz?: number;
  /** Stroke amplitude (pm) to compute modulation index δa/a */
  stroke_pm?: number;
  /** Optional modulation index δa/a (used to derive δa if stroke missing) */
  modIndexProp?: number;
  /** Animate diaphragm vertical oscillation using stroke_pm and f/omega */
  animateDiaphragm?: boolean;
  /** Optional: precomputed modulation period (ms) to display without recompute */
  tmod_ms?: number;
  /** Optional: precomputed GR ratios to display without recompute */
  R1?: number;
  R2?: number;
  /** Optional: hide drift hint & source selector (use local solution only) */
  suppressDriftHint?: boolean;
  /** Optional upstream values (for one-line deviation note) */
  upstreamR1?: number;
  upstreamR2?: number;
  /** Diaphragm (membrane) thickness in µm (visual only) */
  diaphragm_thick_um?: number;
  /** Show compact relationships legend inline */
  showRelationsLegend?: boolean;
  /** Curvature response time estimate (ms) for GR timing pill */
  tauCurv_ms?: number;
  /** Light-crossing time (ms) passed from backend; preferred over Q/ω */
  tauLC_ms?: number;
  /** Optional: current phase target modulation index (δa/a) for display */
  targetModIndex_phase?: number;
  /** Visual animation frequency (Hz) for diaphragm motion; overrides f/omega if provided */
  visualHz?: number;
};

export default function CavitySideView({
  variant = 'full',
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
  gapTargetPxFor1nm,
  mirrorCompression,
  animateSag = false,
  sagOscillationFraction = 0.25,
  modulationFreq_Hz,
  insetPosition = 'auto',
  showLegend = true,
  showScaleLegend = true,
  showInset = true,
  showRuler = true,
  showPocketArc = true,
  showLabels = true,
  debugLayout = false,
  autoHeight = false,
  autoHeightExtraClearance = 80,
  externalSagPhase,
  highlightStep,
  gammaGeo,
  surfaceResistance_nOhm,
  geometryFactor_Ohm,
  qCav,
  omega_rad_s,
  f_Hz,
  stroke_pm,
  modIndexProp,
  animateDiaphragm = true,
  tmod_ms,
  R1,
  R2,
  suppressDriftHint,
  upstreamR1,
  upstreamR2,
  diaphragm_thick_um,
  showRelationsLegend = false,
  tauCurv_ms,
  tauLC_ms,
  targetModIndex_phase,
  visualHz,
}: Props) {
  // Safe local defaults to keep visuals/math consistent when used standalone
  const sag_nm_eff = (Number.isFinite(sag_nm as number) && (sag_nm as number) > 0) ? (sag_nm as number) : 2.9;
  // Responsive width measurement (if parent resizes and no explicit pxPerUmX override)
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const [measuredW, setMeasuredW] = React.useState<number | undefined>(undefined);
  React.useEffect(() => {
    if (!svgRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        setMeasuredW(e.contentRect.width);
      }
    });
    ro.observe(svgRef.current);
    return () => ro.disconnect();
  }, []);

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

  // Friendly time formatting to ms/µs/ns
  const fmtTime = (ms?: number) => {
    if (ms == null || !isFinite(ms)) return "—";
    if (ms >= 1) return `${ms.toFixed(3)} ms`;
    const us = ms * 1e3;
    if (us >= 1) return `${us.toFixed(3)} µs`;
    const ns = ms * 1e6;
    return `${ns.toFixed(3)} ns`;
  };

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

  // Effective canvas width (measured if responsive, else prop)
  const W_eff = measuredW ?? width;

  // Fit X automatically if not provided (recalculate on resize)
  const pxPerUmX_eff = pxPerUmX ?? ((W_eff - 48) / Math.max(1, tileWidth_um)); // 24px margin each side

  // ───────────────── VERTICAL SCALING STRATEGY ─────────────────
  // We want: (a) nm-scale gap clearly visible (≈ 6–10 px for 1 nm)
  //          (b) mirror thicknesses visually legible but not thousands of px
  // Provide a strong gap scale and a moderated mirror scale derived from it.

  const margin = 24;
  // ╭──────────────────────────────────────────────────────────────╮
  // │ Variant presets → derive default visibility + overlay reserve │
  // ╰──────────────────────────────────────────────────────────────╯
  const legendRowH = 18;
  const legendItems = 4;
  const legendBlockHeight = legendItems * legendRowH + 12; // matches rect height logic
  const scaleBlockHeight = 58; // from rect height in scale legend
  const insetHeight = 120;     // fixed inset card

  // If explicit show* props were provided, they already have values; if not, apply variant defaults.
  const vIsEmbedded = variant === 'embedded';
  const effShowLegend = showLegend && !vIsEmbedded; // embedded hides unless explicitly forced true
  const effShowScale = showScaleLegend && !vIsEmbedded;
  const effShowInset  = showInset && !vIsEmbedded; // inset normally externalized in split view
  const effShowRuler  = showRuler && !vIsEmbedded;
  const effShowLabels = showLabels && !vIsEmbedded;
  const effShowPocketArc = showPocketArc; // keep arc even in embedded (nice cue)

  // Compute vertical overlay reserve (space we must keep free ABOVE geometry)
  let overlayReserve = 0;
  if (effShowLegend) overlayReserve += legendBlockHeight + 6; // +top padding inside card
  if (effShowScale) overlayReserve += scaleBlockHeight + 10;  // +gap below legend
  // If inset is top-right (auto default) include its height if it sits in the overlay zone.
  if (effShowInset && insetPosition !== 'bottom-right') {
    // Rather than summing (it overlaps visually below scale legend sometimes), ensure reserve at least inset height + header clearance
    overlayReserve = Math.max(overlayReserve, insetHeight + 24);
  }
  // Relationships legend is now rendered below the SVG as a pill; no extra reserve here
  // Provide minimal breathing room
  overlayReserve += 8;

  // Establish canvas dims early so debug logging can reference them
  const W = W_eff; // responsive (or prop) width
  let H = height;

  // ─────────── Two-pass scaling if autoHeight enabled ───────────
  let H_dynamic = H;
  const computeScaling = (canvasH:number) => computeCavityScaling({
    gap_nm,
    sag_nm: sag_nm_eff,
    topMirror_thick_um,
    botMirror_thick_um,
    verticalExaggeration,
    gapTargetPxFor1nm,
    mirrorCompression,
    canvasHeight: canvasH,
    margin,
    insetReserve: overlayReserve,
  });

  let scaling = computeScaling(H_dynamic);
  if (autoHeight) {
    // Recover raw unscaled stack by dividing by scaleAdjustment (which computeCavityScaling applied if it had to shrink)
    const rawStack = (scaling.topMirror_px + scaling.gap_px + scaling.botMirror_px) / Math.max(1e-9, scaling.scaleAdjustment);
    const neededCanvas = rawStack + 2 * margin + overlayReserve + autoHeightExtraClearance;
    if (neededCanvas > H_dynamic + 1) { // +1 px tolerance
      H_dynamic = Math.ceil(neededCanvas);
      scaling = computeScaling(H_dynamic);
      // After enlarging, we expect no further downscale; if still <1 keep a safety retry once.
      if (scaling.scaleAdjustment < 0.999) {
        const rawStack2 = (scaling.topMirror_px + scaling.gap_px + scaling.botMirror_px) / Math.max(1e-9, scaling.scaleAdjustment);
        const needed2 = rawStack2 + 2 * margin + overlayReserve + autoHeightExtraClearance;
        if (needed2 > H_dynamic) {
          H_dynamic = Math.ceil(needed2);
          scaling = computeScaling(H_dynamic);
        }
      }
    }
  }
  // Overwrite H with dynamic if changed
  H = H_dynamic;
  const { effectiveGapTarget, gapScale_pxPerUm, mirrorScale_pxPerUm, mirrorCompressionEff, gap_px, topMirror_px, botMirror_px, sag_px } = scaling;

  // ───────────────── Additional scientific overlay values ─────────────────
  const a_nm = gap_nm;
  const a_m = a_nm * 1e-9;
  const gamma = Number.isFinite(gammaGeo as number) ? Number(gammaGeo) : undefined;
  const a_eq_m = gamma && gamma > 0 ? a_m / gamma : undefined; // a_eq = a/γ_geo
  const lambda_cut_m = 2 * a_m; // crude parallel-plate intuition: exclude λ > 2a
  const lambda_cut_eq_m = a_eq_m ? 2 * a_eq_m : undefined;
  const deltaA_pm_fromStroke = Number.isFinite(stroke_pm as number) ? Math.max(0, Number(stroke_pm)) : undefined;
  const deltaA_pm_fromMod = (Number.isFinite(modIndexProp as number) && a_m > 0)
    ? Math.max(0, Number(modIndexProp) * a_m * 1e12)
    : undefined;
  const deltaA_pm = deltaA_pm_fromStroke ?? deltaA_pm_fromMod;
  const deltaA_m = deltaA_pm != null ? deltaA_pm * 1e-12 : undefined;
  const modIndex = (deltaA_m != null && a_m > 0) ? (deltaA_m / a_m) : undefined; // δa/a
  const Qcav = Number.isFinite(qCav as number) ? Number(qCav) : undefined;
  const dceScore = (Qcav != null && modIndex != null) ? (Qcav * modIndex) : undefined; // ~relative η_DCE cue
  const Rs_nOhm = Number.isFinite(surfaceResistance_nOhm as number) ? Number(surfaceResistance_nOhm) : undefined;
  type State = "ok"|"warn"|"fail"|"na";
  const lossState: State = (() => {
    if (Qcav == null) return "na";
    if (Qcav >= 1e9) return "ok";
    if (Qcav >= 1e8) return "warn";
    return "fail";
  })();
  const dceState: State = (() => {
    if (modIndex == null || !Number.isFinite(modIndex) || modIndex <= 0) return "na";
    if (modIndex > 0.3) return "fail"; // extreme
    if (modIndex > 0.1) return "warn"; // high
    return "ok"; // reasonable
  })();
  const tone = (s:State) => s === "ok" ? "#34d399" : s === "warn" ? "#f59e0b" : s === "fail" ? "#f87171" : "#94a3b8";

  if (debugLayout) {
    const geomHeight = topMirror_px + gap_px + botMirror_px;
    // eslint-disable-next-line no-console
    console.debug('[CavitySideView debug]', {
      variant,
      overlayReserve,
      canvasHeight: H,
      autoHeight,
      scaleAdjustment: scaling.scaleAdjustment,
      autoHeightExtraClearance,
      geomHeight,
      finalGap_px: gap_px,
      expectedGapTarget_px: scaling.effectiveGapTarget,
    });
  }

  // Derived geometry
  const pocketR_um = pocketDiameter_um / 2;
  const sag_um = sag_nm_eff * 1e-3;
  const gap_um = gap_nm * 1e-3;

  // Layout helpers
  // margin defined earlier
  // W already declared above
  // H declared earlier
  const X0 = margin;
  const X1 = W - margin;

  // Compute pixel heights using separate scales
  const botMirror_px_adj = botMirror_px;
  const topMirror_px_adj = topMirror_px;
  const gap_px_adj       = gap_px;
  const sag_px_adj       = sag_px;

  // Baseline (top of bottom mirror)
  const baselineY = H - margin - botMirror_px_adj;

  let yBotMirrorTop    = baselineY;
  let yBotMirrorBottom = yBotMirrorTop + botMirror_px_adj; // (not drawn, reference only)
  let yGapTop          = yBotMirrorTop - gap_px_adj;
  let yTopMirror       = yGapTop - topMirror_px_adj;

  // Shift geometry downward if it intrudes into reserved overlay space
  const minTop = margin + overlayReserve;
  if (yTopMirror < minTop) {
    const shift = minTop - yTopMirror;
    yTopMirror += shift;
    yGapTop += shift;
    yBotMirrorTop += shift;
    yBotMirrorBottom += shift;
  }

  // Pocket profile (spherical cap approximation)
  // draw as a circular arc inside the top mirror: center chosen to produce sag at midspan
  const pocketCenterX = (X0 + X1) / 2;
  const pocketSpanPx = pocketDiameter_um * pxPerUmX_eff;
  const dia_px = Math.max(1, (diaphragm_thick_um ?? 1.0) * mirrorScale_pxPerUm);
  const rim_px = alnRim_width_um * pxPerUmX_eff;
  const tileRightX = X0 + tileWidth_um * pxPerUmX_eff;
  const leftA = pocketCenterX - (pocketSpanPx / 2);
  const rightA = pocketCenterX + (pocketSpanPx / 2);
  const leftRimStart = leftA - rim_px;
  const rightRimEnd = rightA + rim_px;
  // ── Optional sag animation (visual only) ──
  const [animPhase, setAnimPhase] = React.useState(0);
  React.useEffect(() => {
    if (!animateSag || externalSagPhase !== undefined) return; // disable internal loop if external phase supplied
    let raf = 0; let t0: number | null = null;
    const loop = (t:number) => {
      if (t0==null) t0=t;
      const dt=(t-t0)/1000;
      const fVisual = (() => {
        if (!modulationFreq_Hz || modulationFreq_Hz <= 0) return 1; // default 1 Hz
        const fGHz = modulationFreq_Hz / 1e9; // convert to GHz
        return Math.min(5, Math.max(0.2, fGHz));
      })();
      setAnimPhase(dt * fVisual);
      raf=requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [animateSag, modulationFreq_Hz, externalSagPhase]);

  const phaseForSag = externalSagPhase !== undefined ? externalSagPhase : animPhase;
  const sagAnimFactor = (animateSag || externalSagPhase !== undefined)
    ? (1 + sagOscillationFraction * Math.sin(phaseForSag * 2 * Math.PI))
    : 1;
  const pocketSagPx  = sag_px_adj * sagAnimFactor; // animated sag for arc only

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

  // ───────────── Diaphragm vertical oscillation (sinusoidal) ─────────────
  // Convert stroke (pm) → px using the gap vertical scale. 1 µm = 1e6 pm.
  const pxPerPm = gapScale_pxPerUm / 1_000_000;
  const amp_px_raw = (deltaA_pm != null && isFinite(deltaA_pm)) ? Math.max(0, deltaA_pm) * pxPerPm : 0;
  // Clamp amplitude so membrane never visually crosses plates
  const amp_px = Math.min(Math.abs(amp_px_raw), gap_px_adj * 0.45);
  const [yOsc, setYOsc] = React.useState(0);
  React.useEffect(() => {
    // Respect prefers-reduced-motion
    const reduce = typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Choose frequency: prefer visualHz if provided, else physical f/omega
    const omegaVisual = (typeof visualHz === 'number' && isFinite(visualHz) && visualHz > 0)
      ? (2 * Math.PI * visualHz)
      : ((typeof omega_rad_s === 'number' && isFinite(omega_rad_s) && omega_rad_s > 0)
          ? omega_rad_s
          : ((typeof f_Hz === 'number' && isFinite(f_Hz) && f_Hz > 0) ? (2 * Math.PI * f_Hz) : 0));

    if (!animateDiaphragm || !isFinite(amp_px) || amp_px <= 0 || omegaVisual <= 0 || reduce) {
      setYOsc(0);
      return;
    }
    let raf = 0;
    let t0: number | null = null;
    const tick = (t: number) => {
      if (t0 == null) t0 = t;
      const dt = (t - t0) / 1000; // seconds
      const phase = (omegaVisual * dt) % (2 * Math.PI);
      setYOsc(amp_px * Math.sin(phase));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animateDiaphragm, amp_px, omega_rad_s, f_Hz, visualHz]);

  // Colors (UI)
  // Visual emphasis: Top (moving diaphragm) grey; Bottom (fixed pocket) warm orange
  const colTop = "#6b7280";   // moving mirror (diaphragm)
  const colBot = "#f59e0b";   // fixed concave pocket / bottom conductor
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

  // Highlight classes
  const highlightGap = highlightStep === 1 || highlightStep === 2;
  const highlightSag = highlightStep === 2;
  // Render
  return (
    <div className="relative w-full">
      {/* subtle header over the svg canvas */}
      <div className="absolute top-1 left-2 text-[11px] font-mono text-slate-300 flex items-center gap-1 pointer-events-none select-none z-10">
        <span>Cavity cross-section</span>
        <span className="pointer-events-auto"><InfoDot text="follow the heart (form) → the spectrum follows; protect the vulnerable (timings), choose the tide (R1/R2)" /></span>
      </div>
    <svg
      ref={svgRef}
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full rounded-xl ring-1 ring-slate-800 bg-[#0b1220]"
    >
      {/* ──────────────── DEFINITIONS ──────────────── */}
      <defs>
        <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.95"/>
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.05"/>
        </linearGradient>
        {/* Soft glow for moving membrane */}
        <filter id="memGlow" x="-20%" y="-50%" width="140%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#60a5fa" floodOpacity="0.35"/>
        </filter>
        {/* Arrowheads for label callouts and braces */}
        <marker id="arrowTip" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
        </marker>
        <marker id="arrowTipCyan" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#38bdf8" />
        </marker>
        {/* text halo for improved contrast over semi-transparent fills */}
        <filter id="labelHalo" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="dilated"/>
          <feGaussianBlur in="dilated" stdDeviation="1" result="blur"/>
          <feFlood floodColor="#0b1220" floodOpacity="0.85" result="bg"/>
          <feComposite in="bg" in2="blur" operator="in" result="halo"/>
          <feMerge>
            <feMergeNode in="halo" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ──────────────── LAYER: RULER (below geometry) ──────────────── */}
      {effShowRuler && (
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
          {/* info-dot near the gap label for mnemonic */}
          <foreignObject width="20" height="20" requiredExtensions="http://www.w3.org/1999/xhtml">
            <div>
              <InfoDot text="the quiet between plates; from quiet arises power when form and timing agree" />
            </div>
          </foreignObject>
        </g>
      )}

      {/* ──────────────── LAYER: GEOMETRY (base fills) ──────────────── */}
      <g id="layer-geometry" pointerEvents="none">
        {/* Bottom mirror */}
        <rect
          x={X0}
          y={yBotMirrorTop}
          width={(tileWidth_um) * pxPerUmX_eff}
          height={botMirror_px_adj}
          fill={colBot}
          opacity={0.95}
          stroke="none"
        />
        {/* Gap region */}
        <rect
          x={X0}
          y={yGapTop}
          width={(tileWidth_um) * pxPerUmX_eff}
          height={gap_px_adj}
          fill={colGap}
          stroke="none"
        />
        {/* Blue-shift region */}
        <rect
          x={pocketCenterX - (pocketDiameter_um * pxPerUmX_eff) / 2}
          y={yGapTop}
          width={pocketDiameter_um * pxPerUmX_eff}
          height={gap_px_adj}
          fill={colBlueShift}
          opacity={0.9}
          stroke="none"
        />
        {/* Top moving mirror + rim group translated by yOsc (sinusoidal) */}
        <g transform={`translate(0, ${animateDiaphragm ? (-yOsc) : 0})`}>
          {/* Left solid top conductor */}
          {leftRimStart > X0 && (
            <rect
              x={X0}
              y={yTopMirror}
              width={Math.max(0, leftRimStart - X0)}
              height={topMirror_px_adj}
              fill={colTop}
              opacity={0.96}
              stroke="none"
            />
          )}
          {/* Right solid top conductor */}
          {tileRightX > rightRimEnd && (
            <rect
              x={rightRimEnd}
              y={yTopMirror}
              width={Math.max(0, tileRightX - rightRimEnd)}
              height={topMirror_px_adj}
              fill={colTop}
              opacity={0.96}
              stroke="none"
            />
          )}
          {/* Left AlN rim band */}
          <rect
            x={Math.max(X0, leftRimStart)}
            y={yGapTop - dia_px}
            width={Math.max(0, Math.min(rim_px, leftA - Math.max(X0, leftRimStart)))}
            height={dia_px}
            fill="#334155"
            opacity={0.95}
          />
          {/* Diaphragm aperture band (membrane) */}
          <rect
            x={leftA}
            y={yGapTop - dia_px}
            width={Math.max(0, rightA - leftA)}
            height={dia_px}
            fill="#475569"
            opacity={0.95}
            filter={animateDiaphragm && amp_px > 0 ? "url(#memGlow)" : undefined}
          />
          {/* Right AlN rim band */}
          <rect
            x={rightA}
            y={yGapTop - dia_px}
            width={Math.max(0, Math.min(rim_px, Math.max(0, tileRightX - rightA)))}
            height={dia_px}
            fill="#334155"
            opacity={0.95}
          />

          {/* Label arrows for diaphragm and AlN rim support (move with diaphragm) */}
          {/* Diaphragm (membrane) arrow & label */}
          <g>
            <line
              x1={rightA + rim_px + 24}
              y1={yGapTop - dia_px - 6}
              x2={rightA + 6}
              y2={yGapTop - dia_px + 2}
              stroke="#94a3b8"
              strokeWidth={1.5}
              markerEnd="url(#arrowTip)"
            />
            <text x={rightA + rim_px + 28} y={yGapTop - dia_px - 8} fill="#e5e7eb" fontSize={11} className="font-mono">
              Top moving mirror (diaphragm)
            </text>
          </g>
          {/* AlN rim arrow & label */}
          <g>
            <line
              x1={leftRimStart - 24}
              y1={yGapTop - dia_px + dia_px/2}
              x2={leftRimStart + rim_px/2}
              y2={yGapTop - dia_px + dia_px/2}
              stroke="#94a3b8"
              strokeWidth={1.5}
              markerEnd="url(#arrowTip)"
            />
            <text x={leftRimStart - 28} y={yGapTop - dia_px + dia_px/2 - 4} textAnchor="end" fill="#cbd5e1" fontSize={11} className="font-mono">
              AlN rim support
            </text>
          </g>
        </g>
        {/* Bottom fixed concave pocket (bowl) label */}
        <g>
          <line
            x1={pocketCenterX - pocketSpanPx/2 - 28}
            y1={yBotMirrorTop + 14}
            x2={pocketCenterX - 6}
            y2={yBotMirrorTop + 6}
            stroke="#fbbf24"
            strokeWidth={1.5}
            markerEnd="url(#arrowTip)"
          />
          <text x={pocketCenterX - pocketSpanPx/2 - 32} y={yBotMirrorTop + 16} textAnchor="end" fill="#fbbf24" fontSize={11} className="font-mono">
            Fixed concave pocket (bowl)
          </text>
        </g>
      </g>

      {/* ──────────────── LAYER: EDGES & HIGHLIGHTS ──────────────── */}
      <g id="layer-edges" pointerEvents="none">
        {/* Mirror outlines over fills for crisp edges */}
        <rect
          x={X0}
          y={yBotMirrorTop}
          width={(tileWidth_um) * pxPerUmX_eff}
          height={botMirror_px_adj}
          fill="none"
          stroke="#0f172a"
          strokeWidth={2}
        />
        {/* Top conductor outlines (move with diaphragm) */}
        <g transform={`translate(0, ${animateDiaphragm ? (-yOsc) : 0})`}>
          {leftRimStart > X0 && (
            <rect
              x={X0}
              y={yTopMirror}
              width={Math.max(0, leftRimStart - X0)}
              height={topMirror_px_adj}
              fill="none"
              stroke="#0f172a"
              strokeWidth={2}
            />
          )}
          {tileRightX > rightRimEnd && (
            <rect
              x={rightRimEnd}
              y={yTopMirror}
              width={Math.max(0, tileRightX - rightRimEnd)}
              height={topMirror_px_adj}
              fill="none"
              stroke="#0f172a"
              strokeWidth={2}
            />
          )}
        </g>
        {/* Gap boundary lines */}
  <line x1={X0} x2={(tileWidth_um)*pxPerUmX_eff + X0} y1={yGapTop} y2={yGapTop} stroke={highlightGap?"#38bdf8":"#0891b2"} strokeWidth={highlightGap?2:1.2} />
  <line x1={X0} x2={(tileWidth_um)*pxPerUmX_eff + X0} y1={yGapTop + gap_px_adj} y2={yGapTop + gap_px_adj} stroke={highlightGap?"#38bdf8":"#0891b2"} strokeWidth={highlightGap?2:1.2} />
      </g>

      {/* ──────────────── LAYER: POCKET ARC ──────────────── */}
      {effShowPocketArc && drawPocketArc && (
        <g id="layer-pocket" pointerEvents="none">
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
            strokeDasharray={animateSag ? "2 4" : "6 6"}
            strokeWidth={animateSag ? 3 : 2}
            opacity={0.9}
          />
        </g>
      )}

      {/* ──────────────── LAYER: LABELS (top-most) ──────────────── */}
      {effShowLabels && (
        <g id="layer-labels" pointerEvents="none" filter="url(#labelHalo)">
          {/* Mirror label chips */}
          <LabelChip x={X0 + 10} y={yBotMirrorTop - 10} text={`Nb₃Sn (fixed) · ${botMirror_thick_um.toFixed(2)} µm`} />
          <LabelChip
            x={X0 + 10}
            y={yTopMirror - 12}
            text={`Graphene + Nb₃Sn (moving) · ${topMirror_thick_um.toFixed(2)} µm · ${onWindow ? "ON" : "OFF"}`}
            tone={onWindow ? "on" : "off"}
          />
          {/* Diaphragm thickness label (move with diaphragm) */}
          <g transform={`translate(0, ${animateDiaphragm ? (-yOsc) : 0})`} fontSize={11 * fontScale} fill="#cbd5e1">
            <text x={pocketCenterX} y={yGapTop - dia_px - 6} textAnchor="middle">diaphragm ≈ {(diaphragm_thick_um ?? 1.0).toFixed(2)} µm</text>
          </g>
          {/* ±δa bracket on diaphragm edge (moves with diaphragm) */}
          {(() => {
            const label = deltaA_pm != null ? `±${deltaA_pm.toFixed(0)} pm` : "±—";
            const y0 = yGapTop - dia_px - 6;
            const pxPerPm_local = gapScale_pxPerUm / 1_000_000; // 1 µm = 1e6 pm
            const ampRaw = (deltaA_pm ?? 8) * pxPerPm_local;
            const amp = Math.max(6, Math.min(12, ampRaw));
            const xB = rightA + rim_px + 30; // to the right of the aperture + rim
            return (
              <g transform={`translate(0, ${animateDiaphragm ? (-yOsc) : 0})`}>
                <line x1={xB} x2={xB} y1={y0 - amp} y2={y0 + amp} stroke="#93c5fd" strokeWidth={1} />
                <line x1={xB - 6} x2={xB} y1={y0 - amp} y2={y0 - amp} stroke="#93c5fd" strokeWidth={1} />
                <line x1={xB - 6} x2={xB} y1={y0 + amp} y2={y0 + amp} stroke="#93c5fd" strokeWidth={1} />
                <text x={xB + 6} y={y0 + 4} fill="#bfdbfe" fontSize={10} className="font-mono">{label}</text>
                <line x1={xB - 14} x2={rightA + 2} y1={y0} y2={y0} stroke="#93c5fd" strokeDasharray="3 2" />
              </g>
            );
          })()}
          {/* Gap dimension */}
          <DimArrow
            x={X1 - 30}
            y0={yGapTop}
            y1={yGapTop + gap_px_adj}
            label={`a = ${gap_nm.toFixed(2)} nm`}
          />
          {/* Precise centered gap tick (always readable) */}
          {(() => {
            const x = pocketCenterX;
            const yTopTick = yGapTop;
            const yBotTick = yGapTop + gap_px_adj;
            const tickW = 10;
            return (
              <g>
                <line x1={x - tickW} x2={x + tickW} y1={yTopTick} y2={yTopTick} stroke="#a5f3fc" strokeWidth={1} />
                <line x1={x - tickW} x2={x + tickW} y1={yBotTick} y2={yBotTick} stroke="#a5f3fc" strokeWidth={1} />
                <line x1={x} x2={x} y1={yTopTick} y2={yBotTick} stroke="#22d3ee" strokeWidth={1} />
                <text x={x + tickW + 4} y={yTopTick - 4} fill="#a5f3fc" fontSize={10} className="font-mono">{gap_nm.toFixed(2)} nm</text>
              </g>
            );
          })()}
          {/* a_eq brace from top plate down to dashed a_eq line */}
          {a_eq_m && (
            (() => {
              const pxPerNm = gapScale_pxPerUm / 1000;
              const aeq_nm = a_eq_m * 1e9;
              const yEq = yBotMirrorTop - aeq_nm * pxPerNm;
              const xMid = rightA + 14; // just to the right of the aperture
              return (
                <g>
                  <line x1={xMid} y1={yTopMirror} x2={xMid} y2={yEq} stroke="#38bdf8" strokeWidth={1.5} markerEnd="url(#arrowTipCyan)" markerStart="url(#arrowTipCyan)" />
                  <text x={xMid + 6} y={(yTopMirror + yEq)/2 - 4} fill="#38bdf8" fontSize={10} className="font-mono">a_eq = a/γ_geo</text>
                </g>
              );
            })()
          )}
          {/* Equivalent flat gap line and label (a_eq = a/γ_geo) */}
          {a_eq_m && (
            (() => {
              const pxPerNm = gapScale_pxPerUm / 1000;
              const aeq_nm = a_eq_m * 1e9;
              const yEq = yBotMirrorTop - aeq_nm * pxPerNm;
              return (
                <g>
                  <line x1={X0} x2={tileRightX} y1={yEq} y2={yEq} stroke="#38bdf8" strokeDasharray="4 2" />
                  <text x={X0 + 8} y={yEq - 6} fill="#38bdf8" fontSize={10}>a_eq = a/γ_geo</text>
                </g>
              );
            })()
          )}
          {/* Numeric right-side */}
          <g fontSize={11 * fontScale} fill="#93c5fd">
            <text x={X1 - 10} y={yTopMirror + 16} textAnchor="end" fill={highlightSag?"#67e8f9":"#93c5fd"}>sag t = {sag_nm_eff.toFixed(1)} nm</text>
            <text x={X1 - 10} y={yBotMirrorBottom + 14} textAnchor="end">pocket ⌀ = {pocketDiameter_um.toFixed(0)} μm</text>
          </g>
        </g>
      )}

      {/* ──────────────── LAYER: ON glow (between geometry & labels) ──────────────── */}
      {onWindow && (
        <g id="layer-on-glow" pointerEvents="none">
          <rect
            x={pocketCenterX - (pocketDiameter_um * pxPerUmX_eff) / 2}
            y={yGapTop}
            width={(pocketDiameter_um * pxPerUmX_eff) * (0.20 + 0.80 * pulse)}
            height={gap_px_adj}
            fill="url(#glow)"
            opacity={0.55}
          />
        </g>
      )}

      {/* ──────────────── LAYER: LEGEND & SCALE (UI chrome) ──────────────── */}
      {effShowLegend && (
        <g id="layer-legend" pointerEvents="none">
          <Legend x={X0 + 6} y={margin + 6} items={[
            { c:"#f59e0b", label:"Moving diaphragm" },
            { c:"#94a3b8", label:"Fixed mirror" },
            { c:"#22d3ee", label:"Vacuum gap a" },
            { c:"#38bdf8", label:"Blue-shift region" },
          ]}/>
        </g>
      )}

      {effShowScale && (
        <g id="layer-scale" transform={`translate(${X0 + 6}, ${margin + 6 + 84 + 10})`} pointerEvents="none">
          <rect x={-6} y={-6} width={190} height={58} rx={8} fill="#0b1220" stroke="#334155"/>
          <text x={4} y={10} fill="#e5e7eb" fontSize={11}>vertical exaggeration</text>
          <text x={4} y={26} fill="#93c5fd" fontSize={10}>1 nm ≈ {effectiveGapTarget.toFixed(1)} px</text>
          <text x={4} y={40} fill="#93c5fd" fontSize={10}>gap scale: {(gapScale_pxPerUm).toFixed(0)} px/µm</text>
          <text x={4} y={54} fill="#93c5fd" fontSize={10}>mirror scale: {(mirrorScale_pxPerUm).toFixed(0)} px/µm</text>
        </g>
      )}

      {/* Inline relationships legend removed from SVG; now shown below as a pill */}

      {/* Gap inset (top-right) */}
      {effShowInset && (() => {
        const insetMaxW = 380;
        const insetW = Math.min(insetMaxW, W * 0.44);
        const insetH = 120;
        let insetX = W - insetW - 12; // right aligned
        let insetY = margin + 8;      // top baseline

        if (insetPosition === 'bottom-right') {
          insetY = H - margin - insetH; // pin to bottom
        } else if (insetPosition === 'auto') {
          const tileRight = X0 + tileWidth_um * pxPerUmX_eff;
            // If inset would overlap the main tile geometry horizontally, push it downward
          if (tileRight + 16 > insetX) {
            insetY = margin + 8 + 160; // below legends block
          }
          // If pushed below exceeds canvas, dock to bottom
          if (insetY + insetH > H - margin) {
            insetY = H - margin - insetH;
          }
        }
        return (
          <LocalGapInset
            x={insetX}
            y={insetY}
            w={insetW}
            h={insetH}
            gap_um={gap_um}
            top_um={topMirror_thick_um}
            bot_um={botMirror_thick_um}
            pocketDiameter_um={pocketDiameter_um}
            onWindow={onWindow}
          />
        );
      })()}

      {debugLayout && (
        <g pointerEvents="none" aria-label="debug-overlay">
          {/* Reserve zone */}
          <rect x={0} y={margin} width={W} height={overlayReserve - 8} fill="rgba(99,102,241,0.05)" stroke="rgba(99,102,241,0.4)" strokeDasharray="4 4" />
          <line x1={0} y1={margin + overlayReserve} x2={W} y2={margin + overlayReserve} stroke="#f472b6" strokeDasharray="6 4" />
          <text x={8} y={margin + overlayReserve - 4} fill="#f472b6" fontSize={10} fontFamily="monospace">overlay boundary</text>
        </g>
      )}

      {/* (Note) Former overlay pills have been moved below to avoid occluding the drawing */}

      {/* defs moved to top */}
      </svg>
    {/* ─────────────────────  Color-coded legend (under SVG, above cards) ───────────────────── */}
    <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] font-mono">
      <div className="flex items-center gap-2">
        <span className="inline-block h-3 w-5 rounded-sm" style={{background:"#475569"}}/>
        <span className="text-slate-300">Top moving mirror (diaphragm)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block h-3 w-5 rounded-sm" style={{background:"#334155"}}/>
        <span className="text-slate-300">AlN rim support</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block h-[2px] w-8 rounded-sm" style={{background:"#06b6d4"}}/>
        <span className="text-slate-300">Vacuum gap a</span>
      </div>
      <div className="flex items-center gap-2">
        <svg width="36" height="8" className="inline-block">
          <line x1="2" y1="4" x2="34" y2="4" stroke="#38bdf8" strokeDasharray="4 2" strokeWidth="2"/>
        </svg>
        <span className="text-slate-300">Effective gap a/γ_geo</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block h-3 w-5 rounded-sm" style={{background:"#f59e0b"}}/>
        <span className="text-slate-300">Fixed concave pocket (bowl)</span>
      </div>
    </div>
    {/* ─────────────────────  Pills moved below the diagram  ───────────────────── */}
    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {/* Relationships */}
      {showRelationsLegend && (
        <div className="rounded-xl ring-1 ring-slate-800 bg-[#0b1220] p-3">
          <div className="text-[11px] font-mono text-slate-200 mb-1">Relationships</div>
          <div className="text-[11px] font-mono text-slate-400">diaphragm aperture ↔ bowl (sag) → γ_geo</div>
          <div className="text-[11px] font-mono text-slate-400">gap a (nm) ↔ λ_cut = 2a; a_eq = a/γ_geo</div>
          <div className="text-[11px] font-mono text-slate-400">rim (AlN) supports membrane; conductors carry fields</div>
        </div>
      )}
      {/* Spectrum cutoff */}
      <div className="rounded-xl ring-1 ring-slate-800 bg-[#0b1220] p-3">
        <div className="text-[11px] font-mono text-slate-200 mb-2">Spectrum cutoff (vacuum modes)</div>
        <svg width="100%" height="44" viewBox="0 0 280 44" className="block">
          <defs>
            <linearGradient id="gradSpecPill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee"/><stop offset="100%" stopColor="#9333ea"/>
            </linearGradient>
          </defs>
          <rect x="12" y="16" width="256" height="10" fill="url(#gradSpecPill)"/>
          {/* λ markers (clamped labels) */}
          {Number.isFinite(lambda_cut_m) && (() => {
            const log = (x:number)=>Math.log10(x);
            const barX = 12, barW = 256, pad = 6;
            const t = Math.max(0, Math.min(1, (log(lambda_cut_m) - log(1e-9)) / (log(1e-2) - log(1e-9))));
            const x = barX + barW*(1 - t);
            // Decide label side and clamp
            const preferRight = x < barX + barW - 44; // room on right side
            const labelX = preferRight ? Math.min(barX + barW - pad, x + 4) : Math.max(barX + pad, x - 4);
            const anchor: 'start'|'end' = preferRight ? 'start' : 'end';
            return (
              <g>
                <line x1={x} y1={12} x2={x} y2={32} stroke="#22d3ee" strokeWidth={2}/>
                <text x={labelX} y={12} textAnchor={anchor} fill="#22d3ee" fontSize={10}>λ_cut=2a</text>
              </g>
            );
          })()}
          {lambda_cut_eq_m && (() => {
            const log = (x:number)=>Math.log10(x);
            const barX = 12, barW = 256, pad = 6;
            const t = Math.max(0, Math.min(1, (log(lambda_cut_eq_m) - log(1e-9)) / (log(1e-2) - log(1e-9))));
            const x = barX + barW*(1 - t);
            const preferRight = x < barX + barW - 64; // slightly more space for the longer label
            const labelX = preferRight ? Math.min(barX + barW - pad, x + 4) : Math.max(barX + pad, x - 4);
            const anchor: 'start'|'end' = preferRight ? 'start' : 'end';
            return (
              <g>
                <line x1={x} y1={12} x2={x} y2={32} stroke="#38bdf8" strokeWidth={2} strokeDasharray="3 3"/>
                <text x={labelX} y={40} textAnchor={anchor} fill="#38bdf8" fontSize={10}>λ_cut(eq)=2a/γ</text>
              </g>
            );
          })()}
        </svg>
        <div className="text-[10px] font-mono text-slate-400">
          a_eq = {a_eq_m ? (a_eq_m*1e9).toFixed(2)+" nm" : "—"}, γ_geo = {gamma ?? "—"}
        </div>
      </div>
      {/* Dynamic Casimir */}
      <div className="rounded-xl ring-1 ring-slate-800 bg-[#0b1220] p-3">
        <div className="text-[11px] font-mono text-slate-200 mb-1">Dynamic Casimir (modulation)</div>
        <div className="text-[11px] font-mono text-slate-400">
          δa = {deltaA_pm != null ? deltaA_pm.toFixed(1)+" pm" : "—"} · δa/a = {modIndex != null ? modIndex.toExponential(2) : "—"}
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Q = {Qcav != null ? Qcav.toExponential(2) : "—"} · f = {f_Hz != null ? (f_Hz/1e9).toFixed(2)+" GHz" : "—"}
        </div>
        <div className="text-[11px] font-mono" style={{color: tone(dceState)}}>
          η_DCE ~ Q·(δa/a) → {dceScore != null ? dceScore.toExponential(2) : "—"} ({dceState})
        </div>
        {modIndex != null && modIndex > 0.3 && (
          <div className="mt-1 text-[10px] font-mono text-amber-300">note: δa/a &gt; 0.3 is extreme; verify stroke and gap inputs.</div>
        )}
        {targetModIndex_phase != null && (
          <div className="mt-1 text-[10px] font-mono text-slate-500">phase target (δa/a): {targetModIndex_phase.toFixed(3)}</div>
        )}
      </div>
      {/* Loss budget */}
      <div className="rounded-xl ring-1 ring-slate-800 bg-[#0b1220] p-3">
        <div className="text-[11px] font-mono text-slate-200 mb-1">Loss budget (cue)</div>
        <div className="text-[11px] font-mono text-slate-400">
          Rs = {Rs_nOhm != null ? `${Rs_nOhm.toFixed(0)} nΩ` : "—"} · Q = {Qcav != null ? Qcav.toExponential(2) : "—"}
        </div>
        {Rs_nOhm == null && Qcav != null && geometryFactor_Ohm != null && (
          <div className="text-[10px] font-mono text-slate-500">(derived via Rs ≈ G/Q, G={geometryFactor_Ohm} Ω)</div>
        )}
        <div className="text-[11px] font-mono" style={{color: tone(lossState)}}>
          conductor OK? → {lossState}
        </div>
      </div>
      {/* Timing (GR gates) */}
      <div className="rounded-xl ring-1 ring-slate-800 bg-[#0b1220] p-3">
        <div className="text-[11px] font-mono text-slate-200 mb-1">Timing (GR gates)</div>
        {(() => {
          const tauLC_ms_show = tauLC_ms ?? ((omega_rad_s && Qcav) ? (Qcav/omega_rad_s*1000) : undefined);
          const Tmod_ms = tmod_ms ?? (f_Hz ? (1000/f_Hz) : undefined);
          // Local R1/R2 from the exact times we render to ensure self-consistency
          const R1_local = (Tmod_ms != null && tauLC_ms_show != null && tauLC_ms_show > 0) ? (Tmod_ms / tauLC_ms_show) : undefined;
          const R2_local = (tauLC_ms_show != null && tauCurv_ms != null && tauCurv_ms > 0) ? (tauLC_ms_show / tauCurv_ms) : undefined;
          // Lightweight deviation vs upstream (if provided): just to inform ops
          const relDiff = (a?: number, b?: number) =>
            (a!=null && b!=null && isFinite(a) && isFinite(b) && Math.max(Math.abs(a),Math.abs(b))>0)
              ? Math.abs(a-b)/Math.max(Math.abs(a),Math.abs(b))
              : undefined;
          const R1_dev = relDiff(R1_local, upstreamR1);
          const R2_dev = relDiff(R2_local, upstreamR2);
          const showUpstreamNote = !suppressDriftHint && (
            (R1_dev!=null && R1_dev>0.05) || (R2_dev!=null && R2_dev>0.05)
          );
          return (
            <>
              <div className="text-[11px] font-mono text-slate-400">τ_LC = {fmtTime(tauLC_ms_show)}</div>
              <div className="text-[11px] font-mono text-slate-400">τ_curv = {fmtTime(tauCurv_ms)}</div>
              <div className="text-[11px] font-mono text-slate-400">T_mod = {fmtTime(Tmod_ms)}</div>
              <div className="text-[11px] font-mono text-slate-400">R1 = {R1_local==null?"—":R1_local.toFixed(6)} · R2 = {R2_local==null?"—":R2_local.toFixed(6)}</div>
              {showUpstreamNote && (
                <div className="text-[10px] font-mono text-amber-300">
                  upstream deviation: R1={upstreamR1!=null?upstreamR1.toExponential(2):"—"}, R2={upstreamR2!=null?upstreamR2.toExponential(2):"—"}
                </div>
              )}
              {(R1_local != null && R1_local < 1e-6) && (
                <div className="text-[10px] font-mono text-slate-500">note: R1 &lt; 1e-6 (well-separated scales)</div>
              )}
            </>
          );
        })()}
      </div>
      </div>
    </div>
  );
}
