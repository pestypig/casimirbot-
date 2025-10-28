import React from 'react';
import CavitySideView from './CavitySideView';
import { computeCavityScaling } from './cavityScaling';

export interface CavityCrossSectionSplitProps {
  pocketDiameter_um: number;
  sag_nm: number;
  gap_nm: number;
  topMirror_thick_um: number;
  botMirror_thick_um: number;
  alnRim_width_um: number;
  tileWidth_mm: number;
  onWindow: boolean;
  verticalExaggeration?: number;
  gapTargetPxFor1nm?: number;
  mirrorCompression?: number;
  animateSag?: boolean;
  sagOscillationFraction?: number;
  modulationFreq_Hz?: number;
  height?: number;
  // Physics overlays (optional)
  gammaGeo?: number;
  surfaceResistance_nOhm?: number;
  qCav?: number;
  omega_rad_s?: number;
  stroke_pm?: number;
  // New geometry details for diaphragm clarity
  diaphragm_thick_um?: number;
  showRelationsLegend?: boolean;
}

/**
 * Split layout: left = responsive scaled cavity SVG (legend & inset hidden inside)
 * right = info panel (geometry, scaling, legend, inset stack) for clarity.
 */
export function CavityCrossSectionSplit(props: CavityCrossSectionSplitProps) {
  const {
    pocketDiameter_um,
    sag_nm,
    gap_nm,
    topMirror_thick_um,
    botMirror_thick_um,
    tileWidth_mm,
    verticalExaggeration = 8000,
    gapTargetPxFor1nm,
    mirrorCompression,
    animateSag = true,
    sagOscillationFraction = 0.3,
    modulationFreq_Hz,
    height = 360,
    onWindow,
  } = props;

  // Safe fallback for standalone usage (align with Amplifier default): 2.9 nm
  const sag_nm_eff = (Number.isFinite(sag_nm as number) && (sag_nm as number) > 0) ? (sag_nm as number) : 2.9;

  // Derive scaling (duplicate of logic inside CavitySideView for external display)
  const scaling = computeCavityScaling({
    gap_nm,
    sag_nm: sag_nm_eff,
    topMirror_thick_um,
    botMirror_thick_um,
    verticalExaggeration,
    gapTargetPxFor1nm,
    mirrorCompression,
    canvasHeight: height,
    margin: 24,
  });

  const gap_um = gap_nm * 1e-3;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left: graphic */}
      <div className="flex-1 min-w-0">
        <CavitySideView
          pocketDiameter_um={pocketDiameter_um}
          sag_nm={sag_nm_eff}
            gap_nm={gap_nm}
          topMirror_thick_um={topMirror_thick_um}
          botMirror_thick_um={botMirror_thick_um}
          alnRim_width_um={props.alnRim_width_um}
          tileWidth_mm={tileWidth_mm}
          onWindow={onWindow}
          height={height}
          verticalExaggeration={verticalExaggeration}
          gapTargetPxFor1nm={gapTargetPxFor1nm}
          mirrorCompression={mirrorCompression}
          animateSag={animateSag}
          sagOscillationFraction={sagOscillationFraction}
          modulationFreq_Hz={modulationFreq_Hz}
          insetPosition="auto"
          gammaGeo={props.gammaGeo}
          surfaceResistance_nOhm={props.surfaceResistance_nOhm}
          qCav={props.qCav}
          omega_rad_s={props.omega_rad_s}
          f_Hz={modulationFreq_Hz}
          stroke_pm={props.stroke_pm}
          diaphragm_thick_um={props.diaphragm_thick_um}
          showRelationsLegend={props.showRelationsLegend}
        />
      </div>
      {/* Right: info panel */}
      <div className="w-full lg:w-80 flex-shrink-0 space-y-5">
        <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-xs font-mono">
          <h4 className="text-slate-200 font-semibold mb-2">Geometry</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>gap a: {gap_nm.toFixed(2)} nm</div>
            <div>sag t: {sag_nm_eff.toFixed(2)} nm</div>
            <div>pocket ⌀: {pocketDiameter_um.toFixed(0)} µm</div>
            <div>tile W: {tileWidth_mm.toFixed(1)} mm</div>
            <div>top: {topMirror_thick_um.toFixed(2)} µm</div>
            <div>bottom: {botMirror_thick_um.toFixed(2)} µm</div>
          </div>
        </section>
        <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-xs font-mono">
          <h4 className="text-slate-200 font-semibold mb-2">Scaling</h4>
          <div className="space-y-1">
            <div>1 nm ≈ {scaling.effectiveGapTarget.toFixed(1)} px</div>
            <div>gap scale: {scaling.gapScale_pxPerUm.toFixed(0)} px/µm</div>
            <div>mirror scale: {scaling.mirrorScale_pxPerUm.toFixed(0)} px/µm</div>
            <div>compression: {(scaling.mirrorCompressionEff*100).toFixed(1)}%</div>
            {scaling.scaleAdjustment < 1 && (
              <div className="text-amber-300">adjusted ×{scaling.scaleAdjustment.toFixed(2)}</div>
            )}
          </div>
        </section>
        <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-xs font-mono">
          <h4 className="text-slate-200 font-semibold mb-2">Legend</h4>
          <ul className="space-y-1">
            <li className="flex items-center gap-2"><span className="w-4 h-3 rounded-sm bg-[#f59e0b]"></span><span>Moving diaphragm</span></li>
            <li className="flex items-center gap-2"><span className="w-4 h-3 rounded-sm bg-[#94a3b8]"></span><span>Fixed mirror</span></li>
            <li className="flex items-center gap-2"><span className="w-4 h-3 rounded-sm bg-[#22d3ee]"></span><span>Vacuum gap a</span></li>
            <li className="flex items-center gap-2"><span className="w-4 h-3 rounded-sm bg-[#38bdf8]"></span><span>Blue-shift region</span></li>
          </ul>
        </section>
        <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-xs font-mono">
          <h4 className="text-slate-200 font-semibold mb-2">Gap Inset</h4>
          <div className="flex items-end gap-2">
            <div className="flex-1 flex flex-col gap-1">
              <div className="h-10 relative rounded overflow-hidden border border-slate-700">
                <div className="absolute inset-x-0 top-0" style={{height:`${(topMirror_thick_um)/(topMirror_thick_um+botMirror_thick_um+gap_um)*100}%`, background:'#f59e0b'}} />
                <div className="absolute inset-x-0" style={{top:`${(topMirror_thick_um)/(topMirror_thick_um+botMirror_thick_um+gap_um)*100}%`, height:`${(gap_um)/(topMirror_thick_um+botMirror_thick_um+gap_um)*100}%`, background:'rgba(14,165,233,0.4)', outline:'1px solid #0891b2'}} />
                <div className="absolute inset-x-0 bottom-0" style={{height:`${(botMirror_thick_um)/(topMirror_thick_um+botMirror_thick_um+gap_um)*100}%`, background:'#94a3b8'}} />
              </div>
            </div>
            <div className="text-[10px] space-y-1">
              <div>top {topMirror_thick_um.toFixed(1)} µm</div>
              <div>gap {gap_nm.toFixed(2)} nm</div>
              <div>bot {botMirror_thick_um.toFixed(1)} µm</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default CavityCrossSectionSplit;