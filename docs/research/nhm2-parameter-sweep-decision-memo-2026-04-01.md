# NHM2 Parameter Sweep Decision Memo (2026-04-01)

## Sweep basis

- lane: `lane_a_eulerian_comoving_theta_minus_trk`
- observer: `eulerian_n`
- foliation: `comoving_cartesian_3p1`
- theta definition: `theta=-trK`
- fixed-scale policy: comparison_fixed_raw_global + comparison_fixed_topology_global with no per-case autoscaling
- visual metric source stage: `pre_png_color_buffer`

## What the sweep tested

The sweep varied only active NHM2 selector values in the live `gr-evolve-brick` request path:
`dutyFR, q, gammaGeo, gammaVdB, zeta`.
It did not retune the Lane A contract, the renderer, or the closed authority chain.

## Sweep conclusion

- sweepVerdict: `alcubierre_like_not_found`
- bestRunClass: `natario_like_low_expansion`
- alcubierreLikeReachable: `no`
- dominantMorphologyDrivers: q
- recommendedNextAction: A bounded selector sweep did not reach the Alcubierre-like class; prioritize NHM2 source/coupling redesign over more blind tuning.

## Representative runs

- baseline: `nhm2_sweep_baseline`
- best Natario-like run: `nhm2_sweep_baseline`
- best Alcubierre-like run: `none`
- boundary-like run: `nhm2_sweep_q_1`
- degenerate example: `none`

## Engineering decision

If a future NHM2 parameter sweep still cannot produce an Alcubierre-like signed fore/aft class under this contract, the next move is redesign or deeper source/coupling refactor, not more screenshot debugging.

