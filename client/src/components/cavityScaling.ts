export interface CavityScalingInput {
  gap_nm: number;
  sag_nm: number;
  topMirror_thick_um: number;
  botMirror_thick_um: number;
  verticalExaggeration?: number;
  gapTargetPxFor1nm?: number;
  mirrorCompression?: number;
  canvasHeight: number;
  margin: number;
  insetReserve?: number;
}

export interface CavityScalingResult {
  effectiveGapTarget: number;
  gapScale_pxPerUm: number;
  mirrorScale_pxPerUm: number;
  mirrorCompressionEff: number;
  scaleAdjustment: number;
  gap_px: number;
  topMirror_px: number;
  botMirror_px: number;
  sag_px: number;
}

export function computeCavityScaling(input: CavityScalingInput): CavityScalingResult {
  const {
    gap_nm,
    sag_nm,
    topMirror_thick_um,
    botMirror_thick_um,
    verticalExaggeration,
    gapTargetPxFor1nm,
    mirrorCompression,
    canvasHeight,
    margin,
    insetReserve = 140,
  } = input;

  const effectiveGapTarget = Math.min(24, Math.max(4, gapTargetPxFor1nm ?? Math.min(12, Math.max(6, (verticalExaggeration ?? 8000) / 1200))));
  const gapScale_pxPerUm = effectiveGapTarget / 0.001; // 1 nm = 0.001 µm
  const mirrorCompressionEff = Math.min(0.2, Math.max(0.005, mirrorCompression ?? 0.025));
  const mirrorScale_pxPerUm = gapScale_pxPerUm * mirrorCompressionEff;

  const gap_um = gap_nm * 1e-3;
  const sag_um = sag_nm * 1e-3;
  const rawGap = gap_um * gapScale_pxPerUm;
  const rawTop = topMirror_thick_um * mirrorScale_pxPerUm;
  const rawBot = botMirror_thick_um * mirrorScale_pxPerUm;
  const rawSag = sag_um * gapScale_pxPerUm;

  const stackNeeded = rawGap + rawTop + rawBot + 2 * margin + insetReserve;
  let scaleAdjustment = 1;
  if (stackNeeded > canvasHeight) {
    scaleAdjustment = (canvasHeight - 2 * margin - insetReserve) / Math.max(1, rawGap + rawTop + rawBot);
  }

  return {
    effectiveGapTarget,
    gapScale_pxPerUm,
    mirrorScale_pxPerUm,
    mirrorCompressionEff,
    scaleAdjustment,
    gap_px: rawGap * scaleAdjustment,
    topMirror_px: rawTop * scaleAdjustment,
    botMirror_px: rawBot * scaleAdjustment,
    sag_px: rawSag * scaleAdjustment,
  };
}
