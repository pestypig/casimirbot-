# NHM2 Render Calibration Decision Memo (2026-04-01)

## Primary comparator policy

- primary comparator: canonical controls rendered through the repo's own Lane A contract
- secondary comparator: literature figures after convention alignment
- NASA Figure 1 role: figure-class presentation check only, not the primary numerical benchmark

## Operational comparison contract

- lane: `lane_a_eulerian_comoving_theta_minus_trk`
- observer: `eulerian_n`
- foliation: `comoving_cartesian_3p1`
- theta definition: `theta=-trK`
- sign convention: `ADM`
- fixed-scale policy: comparison_fixed_raw_global + comparison_fixed_topology_global with no per-case autoscaling
- visual metric source stage: `pre_png_color_buffer`

## What should we compare a strange NHM2 graph against?

Compare it against this ladder, in order:
1. `flat_space_zero_theta`
2. `alcubierre_control`
3. `natario_control`
4. `nhm2_certified`

If the flat baseline or canonical controls fail under this contract, the graph is not ready to blame on NHM2. If those controls pass and NHM2 still differs, the next debug target is NHM2 solve/coupling or source design.

## When do we blame the renderer?

Blame the renderer or contract mapping first when:
- `flat_space_zero_theta` fails the zero-expectation check
- `alcubierre_control` fails the signed-lobe validation
- `natario_control` fails the low-expansion validation
- or the metric source stage stops being `pre_png_color_buffer`

Current control-validation state:
- flat baseline: `validated`
- Alcubierre control: `validated`
- Natario control: `validated`
- overall: `validated`

## When do we blame convention mapping?

Convention mapping is the next suspect only if the canonical controls stop expressing their expected classes under the shared Lane A contract. That means the contract itself, not NHM2, needs attention first.

Current scope note:
- Primary comparator = canonical controls rendered through the repo's own Lane A contract. Literature figures remain secondary comparators after convention alignment and do not override this calibration ladder.

## When do we blame NHM2 itself?

Blame NHM2 solve/coupling or source structure when:
- the canonical controls validate
- NHM2 still does not land in the expected control family
- and the failure survives fixed-scale comparison under the same contract

Current calibrated result:
- calibration_verdict: `canonical_controls_validated_nhm2_natario_like`
- nhm2_current_class: `natario_like_low_expansion`
- recommended_next_debug_target: `nhm2_solve_or_coupling`
- ablationDecision: `no_single_ablation_explains_morphology`

## Secondary paper comparator

The literature comparison remains secondary. Under the corrected fixed-scale export, NHM2 still stays closer to Natario than Alcubierre:
- NHM2 vs Natario pixel RMS: `0.0003245026921436903`
- NHM2 vs Alcubierre pixel RMS: `0.0007036011734714586`
- NASA Figure 1 closeness: `no`

## Final section

- calibration_verdict: `canonical_controls_validated_nhm2_natario_like`
- control_validation_status: `validated`
- nhm2_current_class: `natario_like_low_expansion`
- recommended_next_debug_target: `nhm2_solve_or_coupling`
- scope_note: Primary comparator = canonical controls rendered through the repo's own Lane A contract. Literature figures remain secondary comparators after convention alignment and do not override this calibration ladder.

Operationally, this means future York-frame debugging should stop from the controls inward, not from screenshots outward. If the controls validate, a weird NHM2 graph is most likely an NHM2-local solve/coupling or source-design issue rather than a renderer problem.

