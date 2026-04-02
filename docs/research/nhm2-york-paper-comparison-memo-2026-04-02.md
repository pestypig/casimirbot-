# NHM2 York Render Debug and Paper-Comparison Memo (2026-04-02)

## Authoritative basis

- Lane used for authoritative comparison: `lane_a_eulerian_comoving_theta_minus_trk`
- Authoritative observer: `eulerian_n`
- Foliation: `comoving_cartesian_3p1`
- Theta definition: `theta=-trK`
- Sign convention: `ADM`
- Lane B posture: reference-only/advisory; it does not override Lane A conclusions.
- Mechanism chain ready: `true`
- Images used as primary evidence: `false`

Lane A is the only admissible basis for the external comparison in this memo. The closed source, timing, brick, snapshot, and diagnostic authority chain means the remaining question is interpretation of the rendered Lane A geometry, not provenance repair.

## Render-debug result

The render path is classified as `render_matches_authoritative_geometry`. In the current run, the authoritative Lane A render is interpreted only after parity closure against the underlying theta field and the signed-`-trK` contract. The display still applies a symmetric percentile range and the topology view adds a unit-max normalization, so amplitude and saturation are display-shaped. Those display rules affect appearance, but they do not change the underlying hash-closed Lane A geometry.

Relevant display policies:
- raw York surfaces use symmetric-about-zero signed rendering with display gain fixed at 1
- display range uses `computeSliceRange:diverging:p98-abs-symmetric`
- topology view is amplitude-normalized for topology only
- shell map adds hull/support overlay context but does not redefine theta
- near-zero suppression only fires below `1e-20` and only when signed structure is absent above the relative floor

## Control-family bridge

| reference_case_id | nhm2_distance | nhm2_match_status | rendered_frame_reflects_numeric_classification |
|---|---:|---|---|
| alcubierre_control | 0.12547084479018483 | morphology_different | true |
| natario_control | 0.0020422635435102315 | compatible_after_observer_scope_note | true |

The control bridge matters because it keeps the paper comparison numeric. NHM2 is currently much closer to the low-expansion Natario control than to the Alcubierre signed-lobe control, and that difference is already encoded in the proof-pack distance metric rather than inferred from image appearance.

## Primary-source comparison matrix

| reference_id | source_link | comparison_scope | morphology_match_status | difference_causes |
|---|---|---|---|---|
| alcubierre_primary | https://arxiv.org/abs/gr-qc/0009013 | Lane A only; compare the authoritative Eulerian 3+1 York morphology against Alcubierre's signed fore/aft expansion pattern. | morphology_different | real_nhm2_morphology_difference |
| natario_primary | https://arxiv.org/abs/gr-qc/0110086 | Lane A only; compare the authoritative Eulerian low-expansion morphology against Natario's zero-expansion/volume-preserving family after sign alignment. | compatible_after_observer_scope_note | none |
| gourgoulhon_3p1_reference | https://arxiv.org/abs/gr-qc/0703035 | Formalism-only bridge for the Lane A Eulerian theta=-trK interpretation; not a warp-bubble morphology comparator. | not_comparable_without_reprojection | not_comparable_without_convention_remap |

### Source-specific assessment

1. Alcubierre primary: direct support
The paper defines the Eulerian 3+1 expansion picture used by Lane A and explicitly describes the standard bubble as expanding behind and contracting in front. Under those matched conventions, NHM2 does not reproduce the Alcubierre signed fore/aft lobe morphology in the current authoritative run.

2. Natario primary: direct support plus convention bridge
Natario states that the Alcubierre expansion/contraction picture is not necessary and constructs a zero-expansion warp drive using a divergenceless generator field. After aligning the sign convention between Natario's `theta = div(X)` expression and the repo's Lane A `theta=-trK` contract, NHM2 lands in the same low-expansion comparison class as the calibrated Natario control. That is a lane-local morphology statement, not a claim of exact metric identity.

3. Gourgoulhon 3+1 reference: direct formalism support
Gourgoulhon provides the 3+1 bridge `K = -div(n)`, which is the formal reason Lane A can interpret the Eulerian congruence expansion as `theta=-trK`. This source validates the observer/foliation/sign mapping, but it is not itself a warp-lobe morphology benchmark.

## Deterministic diagnosis of visible mismatch

If the current NHM2 frames look unlike the Alcubierre paper figures, the dominant explanation is not a provenance break. The dominant cause is `real_nhm2_morphology_difference`: NHM2 is numerically classified near the Natario-like low-expansion control, while the renderer remains parity-closed to the authoritative Lane A field. Display normalization still affects how strong the lobes look on screen, but it does not flip the classification.

## Final conclusion

- render_debug_verdict: `render_matches_authoritative_geometry`
- paper_comparison_verdict: `paper_match_after_convention_alignment`
- dominant_difference_cause: `real_nhm2_morphology_difference`
- lane_used_for_authoritative_comparison: `lane_a_eulerian_comoving_theta_minus_trk`
- images_used_as_primary_evidence = no

The current York-frame renders faithfully represent the authoritative NHM2 Lane A geometry. After aligning observer, foliation, and sign conventions, NHM2 is consistent with the Natario-style low-expansion comparison class and not with Alcubierre's strong signed fore/aft lobe morphology. Any apparent mismatch with Alcubierre-like paper figures is therefore classified as a genuine morphology difference, with display normalization affecting presentation but not the underlying geometry verdict.

## Notes
- Lane A remains the authoritative comparison lane for this artifact; Lane B is retained only for advisory/reference context.
- Render parity for NHM2 Lane A is closed, so image appearance is interpreted only after hash/parity checks.
- NHM2 classification distances: to Natario control=0.0020422635435102315; to Alcubierre control=0.12547084479018483.
- Primary-paper comparison is scope-limited to observer/foliation/sign-aligned Lane A semantics and does not assert invariant theory identity from image similarity.

