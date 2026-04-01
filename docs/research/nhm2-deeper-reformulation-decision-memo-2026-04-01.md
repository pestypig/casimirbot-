# NHM2 Deeper Reformulation Decision Memo (2026-04-01)

## Comparison basis

- lane: `lane_a_eulerian_comoving_theta_minus_trk`
- observer: `eulerian_n`
- foliation: `comoving_cartesian_3p1`
- theta definition: `theta=-trK`
- fixed-scale policy: comparison_fixed_raw_global + comparison_fixed_topology_global with no per-case autoscaling
- visual metric source stage: `pre_png_color_buffer`

## Evidence chronology

1. Canonical controls validated the Lane A render contract.
2. Bounded tuning did not find an Alcubierre-like regime.
3. Realized local source/coupling redesigns remained Natario-like.
4. This deeper reformulation pass then tested model-form changes beyond those local redesigns.

## Reformulation conclusion

- reformulationVerdict: `deeper_reformulation_still_natario_locked`
- authoritativeMorphologyChangeObserved: `yes`
- bestReformulationVariant: `nhm2_reform_fore_aft_antisymmetric_driver`
- alcubierreLikeTransitionObserved: `no`
- strongestMorphologyShift: `nhm2_reform_fore_aft_antisymmetric_driver / toward_flat_or_degenerate / 0.05361541554114735`
- recommendedNextAction: The current NHM2 family still appears Natario-locked even under deeper realized reformulations; the next step is a broader model reformulation rather than more local selector work.

## Realized variants

- nhm2_reform_volume_driven_signed_source: movement=toward_flat_or_degenerate; magnitude=0.0504662004210793; sourceReformulationMode=volume_driven_signed_source; implication=This model-form change is too destructive in its current form and removes morphology amplitude faster than it creates signed-lobe structure.
- nhm2_reform_fore_aft_antisymmetric_driver: movement=toward_flat_or_degenerate; magnitude=0.05361541554114735; sourceReformulationMode=fore_aft_antisymmetric_driver; implication=This model-form change is too destructive in its current form and removes morphology amplitude faster than it creates signed-lobe structure.
- nhm2_reform_geometry_source_decoupling: movement=toward_flat_or_degenerate; magnitude=0.05282878757854659; sourceReformulationMode=geometry_source_decoupling; implication=This model-form change is too destructive in its current form and removes morphology amplitude faster than it creates signed-lobe structure.
- nhm2_reform_shell_to_dual_layer_family: movement=toward_flat_or_degenerate; magnitude=0.05278574207744535; sourceReformulationMode=shell_to_dual_layer_family; implication=This model-form change is too destructive in its current form and removes morphology amplitude faster than it creates signed-lobe structure.

## Scope note

- This is a repo-local diagnostic reformulation pass under the canonical Lane A contract.
- It is not a physical-feasibility proof.
- It is not an exact theory-identity claim.
- Literature figures remain secondary comparators, not the primary benchmark.

