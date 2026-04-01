# NHM2 Source/Coupling Redesign Decision Memo (2026-03-31)

## Comparison basis

- lane: `lane_a_eulerian_comoving_theta_minus_trk`
- observer: `eulerian_n`
- foliation: `comoving_cartesian_3p1`
- theta definition: `theta=-trK`
- fixed-scale policy: comparison_fixed_raw_global + comparison_fixed_topology_global with no per-case autoscaling
- visual metric source stage: `pre_png_color_buffer`

## Evidence chronology

1. Canonical controls validated the Lane A render contract.
2. NHM2 ablations localized sensitivity but did not identify a single sufficient fix path.
3. The bounded parameter sweep did not find an Alcubierre-like regime.
4. This redesign pass then tested explicit source/coupling architecture variants rather than more blind tuning.

## Redesign conclusion

- redesignVerdict: `source_coupling_redesign_still_natario_locked`
- authoritativeMorphologyChangeObserved: `yes`
- bestRedesignVariant: `nhm2_redesign_source_profile_simplified_signed`
- alcubierreLikeTransitionObserved: `no`
- strongestMorphologyShift: `nhm2_redesign_source_profile_simplified_signed / toward_flat_or_degenerate / 0.05310902175836274`
- recommendedNextAction: Modest source/coupling redesign remains Natario-locked; prioritize deeper NHM2 model reformulation over additional local tuning.

At least one redesign variant changed the authoritative Lane A output, so the redesign verdict is based on realized morphology differences rather than selector-only changes.

## Implemented redesign variants

- nhm2_redesign_signed_shell_bias: authoritativeChanged=true; realization=realized_in_lane_a; movement=toward_flat_or_degenerate; magnitude=0.05296024458116699; sourceRedesignMode=signed_shell_bias; implication=This redesign direction is structurally too destructive and is removing morphology amplitude faster than it creates signed-lobe structure.
- nhm2_redesign_coupling_localization: authoritativeChanged=true; realization=realized_in_lane_a; movement=toward_flat_or_degenerate; magnitude=0.05309923393118232; sourceRedesignMode=coupling_localization; implication=The localized-coupling redesign is over-constraining the shell and shedding too much morphology amplitude.
- nhm2_redesign_drive_vs_geometry_split: authoritativeChanged=true; realization=realized_in_lane_a; movement=toward_flat_or_degenerate; magnitude=0.05221740672187014; sourceRedesignMode=drive_vs_geometry_split; implication=This redesign direction is structurally too destructive and is removing morphology amplitude faster than it creates signed-lobe structure.
- nhm2_redesign_source_profile_simplified_signed: authoritativeChanged=true; realization=realized_in_lane_a; movement=toward_flat_or_degenerate; magnitude=0.05310902175836274; sourceRedesignMode=source_profile_simplified_signed; implication=This redesign direction is structurally too destructive and is removing morphology amplitude faster than it creates signed-lobe structure.

## Scope note

This is a repo-local diagnostic redesign pass under the canonical Lane A contract. It is not a physical-feasibility proof and it does not claim exact Alcubierre or Natario identity.

