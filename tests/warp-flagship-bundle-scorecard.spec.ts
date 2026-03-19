import { describe, expect, it } from 'vitest';

import {
  buildFlagshipBundleScorecard,
  validateFlagshipBundleScorecard,
  validateFlagshipBundleScorecardCanaries,
} from '../scripts/warp-flagship-bundle-scorecard';

describe('warp flagship bundle scorecard', () => {
  it('classifies the measured chain as empirical match and the solar lane as quarantined divergence', () => {
    const scorecard = buildFlagshipBundleScorecard({
      canonicalDecisionOk: true,
      geometryPassCount: 5,
      geometryRequiredCount: 5,
      compatibleObservableCount: 4,
      totalObservableCount: 4,
      reportableReadyLaneCount: 2,
      blockedLaneCount: 1,
      readinessGatePass: false,
      blockerCount: 1,
    });

    expect(scorecard.bundle_id).toBe('nhm2.curvature-collapse');
    expect(scorecard.match_count).toBe(3);
    expect(scorecard.converge_count).toBe(1);
    expect(scorecard.diverge_count).toBe(1);
    expect(scorecard.paths).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path_id: 'path_casimir_force_to_stress_energy',
          status: 'match',
          reason_codes: expect.arrayContaining(['measured_lane_reportable_ready']),
          residuals: expect.objectContaining({ reportable_ready_lane_count: 2 }),
        }),
        expect.objectContaining({
          path_id: 'path_curvature_proxy_to_collapse_benchmark',
          status: 'converge',
          reason_codes: expect.arrayContaining(['collapse_benchmark_reference_only']),
        }),
        expect.objectContaining({
          path_id: 'path_solar_coherence_to_collapse_hypothesis',
          status: 'diverge',
          hypothesis_only: true,
          reason_codes: expect.arrayContaining(['hypothesis_only_quarantine']),
        }),
      ]),
    );
  });

  it('fails validation when the solar lane is not hypothesis-only divergence', () => {
    const scorecard = buildFlagshipBundleScorecard({
      canonicalDecisionOk: true,
      geometryPassCount: 5,
      geometryRequiredCount: 5,
      compatibleObservableCount: 4,
      totalObservableCount: 4,
      reportableReadyLaneCount: 2,
      blockedLaneCount: 1,
      readinessGatePass: false,
      blockerCount: 1,
    });

    const solar = scorecard.paths.find((entry) => entry.path_id === 'path_solar_coherence_to_collapse_hypothesis');
    if (!solar) throw new Error('missing solar scorecard entry');
    solar.status = 'match';
    solar.hypothesis_only = false;
    solar.reason_codes = ['incorrectly_promoted'];

    const result = validateFlagshipBundleScorecard(scorecard);
    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toContain('solar lane must remain divergence-scored while hypothesis-only');
    expect(result.errors.join('\n')).toContain('solar lane must remain hypothesis_only=true');
  });

  it('validates the measured-pass and quarantined-solar canary pack', () => {
    const result = validateFlagshipBundleScorecardCanaries();
    expect(result.ok).toBe(true);
    expect(result.cases).toEqual([
      { id: 'measured_chain_expected_pass', ok: true, expected_verdict: 'pass' },
      { id: 'solar_quarantine_expected_fail', ok: true, expected_verdict: 'fail' },
    ]);
  });
});
