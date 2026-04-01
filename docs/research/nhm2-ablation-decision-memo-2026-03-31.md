# NHM2 Ablation Decision Memo (2026-03-31)

## Comparison basis

- lane: `lane_a_eulerian_comoving_theta_minus_trk`
- observer: `eulerian_n`
- foliation: `comoving_cartesian_3p1`
- theta definition: `theta=-trK`
- fixed-scale policy: comparison_fixed_raw_global + comparison_fixed_topology_global with no per-case autoscaling
- visual metric source stage: `pre_png_color_buffer`

## Implemented ablations

- implementedAblations: nhm2_without_hull_coupling, nhm2_without_casimir_drive, nhm2_simplified_source
- stillUnavailableAblations: nhm2_support_mask_off (Support-mask toggles exist only as display overlays in the current pipeline; they are not a distinct NHM2 solve/source ablation surface.)

## Decision

- ablationDecision: `no_single_ablation_explains_morphology`
- dominantSensitivityCause: `casimir_drive`

## Strongest signals

- nhm2_without_hull_coupling: status=available; movementClass=toward_flat_or_degenerate; movementMagnitude=0.05242879476895257; dominantShift=Ablation collapses part of the current morphology toward flat/degenerate output.; implication=The ablated subsystem carries a substantial portion of the current morphology amplitude.
- nhm2_without_casimir_drive: status=available; movementClass=toward_flat_or_degenerate; movementMagnitude=0.052527516457954504; dominantShift=Ablation collapses part of the current morphology toward flat/degenerate output.; implication=Casimir drive materially supports the current morphology amplitude.
- nhm2_simplified_source: status=available; movementClass=toward_flat_or_degenerate; movementMagnitude=0.0523175188002839; dominantShift=Ablation collapses part of the current morphology toward flat/degenerate output.; implication=The ablated subsystem carries a substantial portion of the current morphology amplitude.
- nhm2_support_mask_off: status=unavailable; movementClass=unavailable; movementMagnitude=null; dominantShift=Unavailable in the current repo.; implication=Support-mask behavior remains display-only and should not be treated as a solve-side morphology driver.

## Recommended next debug target

No single ablation closes the question. Treat the current output as a real NHM2-local morphology result and use the sweep to test whether tuning can move it materially.

