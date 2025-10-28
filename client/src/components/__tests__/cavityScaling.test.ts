import { describe, it, expect } from 'vitest';
import { computeCavityScaling } from '../cavityScaling';

describe('computeCavityScaling', () => {
  it('basic defaults produce sane ranges', () => {
    const r = computeCavityScaling({
      gap_nm: 1,
      sag_nm: 10,
      topMirror_thick_um: 1.5,
      botMirror_thick_um: 1.5,
      canvasHeight: 360,
      margin: 24,
    });
    expect(r.effectiveGapTarget).toBeGreaterThanOrEqual(4);
    expect(r.effectiveGapTarget).toBeLessThanOrEqual(24);
    expect(r.gapScale_pxPerUm).toBeCloseTo(r.effectiveGapTarget / 0.001, 6);
    expect(r.mirrorScale_pxPerUm).toBeLessThan(r.gapScale_pxPerUm);
    expect(r.scaleAdjustment).toBeLessThanOrEqual(1);
  });

  it('custom targets respected', () => {
    const r = computeCavityScaling({
      gap_nm: 2,
      sag_nm: 5,
      topMirror_thick_um: 2,
      botMirror_thick_um: 2,
      gapTargetPxFor1nm: 15,
      mirrorCompression: 0.05,
      canvasHeight: 400,
      margin: 24,
    });
    expect(r.effectiveGapTarget).toBeCloseTo(15, 6);
    expect(r.mirrorCompressionEff).toBeCloseTo(0.05, 6);
  });

  it('applies scaleAdjustment when overflowing', () => {
    const r = computeCavityScaling({
      gap_nm: 1,
      sag_nm: 10,
      topMirror_thick_um: 50,
      botMirror_thick_um: 50,
      canvasHeight: 300,
      margin: 24,
    });
    expect(r.scaleAdjustment).toBeLessThan(1);
  });
});
