import React from 'react';
import CavitySideView from './CavitySideView';
import { useGlobalPhase } from '../hooks/useGlobalPhase';

export interface CavityFrameViewProps {
  pocketDiameter_um: number;
  sag_nm: number;
  gap_nm: number;
  topMirror_thick_um: number;
  botMirror_thick_um: number;
  alnRim_width_um: number;
  tileWidth_mm: number;
  onWindow: boolean;
  modulationFreq_Hz?: number;
  verticalExaggeration?: number;
  gapTargetPxFor1nm?: number;
  mirrorCompression?: number;
  animateSag?: boolean;
  autoHeight?: boolean;
  /** Optional fixed canvas height passed to CavitySideView when autoHeight is false (or as baseline). */
  height?: number;
  /** Toggle external chrome (legend/geometry panels) below the canvas. */
  showChrome?: boolean;
  /** Choose how sag phase is driven: 'global' (scroll/time) or 'modulation' (from modulationFreq_Hz) */
  sagPhaseSource?: 'global' | 'modulation';
  className?: string;
  // Physics overlay pass-through
  gammaGeo?: number;
  surfaceResistance_nOhm?: number;
  qCav?: number;
  omega_rad_s?: number;
  f_Hz?: number;
  stroke_pm?: number;
  diaphragm_thick_um?: number;
  showRelationsLegend?: boolean;
  tauCurv_ms?: number;
  geometryFactor_Ohm?: number;
  modIndex?: number;
  // Timing pass-throughs for display (avoid silent recompute)
  tauLC_ms?: number;
  tmod_ms?: number;
  R1?: number;
  R2?: number;
  // Upstream values for deviation note in inner view
  upstreamR1?: number;
  upstreamR2?: number;
  // Optional phase target index for display (δa/a)
  targetModIndex_phase?: number;
  // Hide drift hints and source selection in the inner view
  suppressDriftHint?: boolean;
}

/**
 * CavityFrameView
 * A wrapper that:
 *  - Provides external global phase (scroll-or-time) to CavitySideView (no internal rAF)
 *  - Switches variant to 'embedded' under a width breakpoint to hide internal chrome
 *  - Renders overlay cards (legend, scaling, inset, geometry) OUTSIDE of the SVG to avoid overlap
 */
export const CavityFrameView: React.FC<CavityFrameViewProps> = (props) => {
  const {
    pocketDiameter_um,
    sag_nm,
    gap_nm,
    topMirror_thick_um,
    botMirror_thick_um,
    alnRim_width_um,
    tileWidth_mm,
    onWindow,
    modulationFreq_Hz,
    verticalExaggeration = 8000,
    gapTargetPxFor1nm,
    mirrorCompression,
    animateSag = true,
    autoHeight = true,
    height = 260,
    showChrome = true,
    sagPhaseSource = 'global',
    className = ''
  } = props;

  // Global phase (smooth scroll/time hybrid)
  const phase = useGlobalPhase({ mode: 'auto', periodMs: 10000, damp: 0.12, publishBus: false });
  // Map phase → gentle visual frequency (Hz): 0.75..2.25 Hz for some organic variation
  const visualHz = 0.75 + 1.5 * (0.5 - Math.abs(((phase % 1) + 1) % 1 - 0.5));

  // Responsive breakpoint
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [w, setW] = React.useState<number>(0);
  React.useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(e => {
      for (const r of e) setW(r.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const isNarrow = w < 900; // breakpoint
  const variant: 'full' | 'embedded' = isNarrow ? 'embedded' : 'embedded'; // force embedded always (chrome external)

  // Default sag fallback used consistently (aligns with Amplifier and Side/Split views)
  const sag_nm_eff = (Number.isFinite(sag_nm as number) && (sag_nm as number) > 0) ? (sag_nm as number) : 2.9;

  return (
    <div ref={containerRef} className={`flex flex-col gap-4 ${className}`}>
      <div className="relative w-full">
        <CavitySideView
          variant={variant}
          pocketDiameter_um={pocketDiameter_um}
          sag_nm={sag_nm_eff}
          gap_nm={gap_nm}
            topMirror_thick_um={topMirror_thick_um}
          botMirror_thick_um={botMirror_thick_um}
          alnRim_width_um={alnRim_width_um}
          tileWidth_mm={tileWidth_mm}
          onWindow={onWindow}
          verticalExaggeration={verticalExaggeration}
          gapTargetPxFor1nm={gapTargetPxFor1nm}
          mirrorCompression={mirrorCompression}
          animateSag={animateSag}
          externalSagPhase={sagPhaseSource === 'global' ? phase : undefined}
          modulationFreq_Hz={modulationFreq_Hz}
          visualHz={visualHz}
          showLegend={false}
          showScaleLegend={false}
          showInset={false}
          showRuler={true}
          showLabels={true}
          fontScale={1.1}
          showPocketArc={true}
          autoHeight={autoHeight}
          height={height}
          gammaGeo={props.gammaGeo}
          surfaceResistance_nOhm={props.surfaceResistance_nOhm}
          qCav={props.qCav}
          omega_rad_s={props.omega_rad_s}
          f_Hz={props.f_Hz ?? modulationFreq_Hz}
          stroke_pm={props.stroke_pm}
          diaphragm_thick_um={props.diaphragm_thick_um}
          showRelationsLegend={props.showRelationsLegend}
          tauCurv_ms={props.tauCurv_ms}
          geometryFactor_Ohm={props.geometryFactor_Ohm}
          modIndexProp={props.modIndex}
          // Timing values (prefer passed values)
          tauLC_ms={props.tauLC_ms}
          tmod_ms={props.tmod_ms}
          R1={props.R1}
          R2={props.R2}
          upstreamR1={props.upstreamR1}
          upstreamR2={props.upstreamR2}
            targetModIndex_phase={props.targetModIndex_phase}
            suppressDriftHint={props.suppressDriftHint}
        />
      </div>
      {/* External chrome area */}
      {showChrome && (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
          <h4 className="text-slate-200 font-semibold mb-1">Legend</h4>
          <ul className="space-y-1">
            <li className="flex items-center gap-2"><span className="w-4 h-3 rounded-sm bg-[#f59e0b]"></span><span>Moving diaphragm</span></li>
            <li className="flex items-center gap-2"><span className="w-4 h-3 rounded-sm bg-[#94a3b8]"></span><span>Fixed mirror</span></li>
            <li className="flex items-center gap-2"><span className="w-4 h-3 rounded-sm bg-[#22d3ee]"></span><span>Vacuum gap a</span></li>
            <li className="flex items-center gap-2"><span className="w-4 h-3 rounded-sm bg-[#38bdf8]"></span><span>Blue-shift region</span></li>
          </ul>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
          <h4 className="text-slate-200 font-semibold mb-1">Animation</h4>
          <div>phase (global): {phase.toFixed(3)}</div>
          <div>mode: scroll/time hybrid</div>
          <div className="text-slate-400 mt-1">Scroll page to scrub; idle → time loop.</div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 col-span-2 lg:col-span-1">
          <h4 className="text-slate-200 font-semibold mb-1">Geometry</h4>
          <div className="grid grid-cols-2 gap-1">
            <div>a (gap)</div><div>{gap_nm.toFixed(2)} nm</div>
            <div>sag t</div><div>{sag_nm_eff.toFixed(1)} nm</div>
            <div>pocket ⌀</div><div>{pocketDiameter_um.toFixed(0)} µm</div>
            <div>tile W</div><div>{tileWidth_mm.toFixed(1)} mm</div>
            <div>top</div><div>{topMirror_thick_um.toFixed(2)} µm</div>
            <div>bottom</div><div>{botMirror_thick_um.toFixed(2)} µm</div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 col-span-2 lg:col-span-1">
          <h4 className="text-slate-200 font-semibold mb-1">Viewport</h4>
          <div>width: {w}px</div>
          <div>variant: {variant}</div>
          <div className="text-slate-400">chrome externalized</div>
        </div>
      </div>
      )}
    </div>
  );
};

export default CavityFrameView;
