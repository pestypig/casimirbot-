# Root-to-Leaf Theory Congruence Audit

## Purpose
This audit defines how Helix Ask/ToE claims must flow from broad physics roots to
falsifiable leaves so the tree + DAG structure is used as a scientific contract,
not only as retrieval metadata.

## Required audit checks
1. Root coverage:
- Every required root lane exists in the manifest:
  - `physics_spacetime_gr`
  - `physics_quantum_semiclassical`
  - `physics_thermodynamics_entropy`
  - `physics_information_dynamics`
  - `physics_prebiotic_chemistry`
  - `physics_biology_life`
  - `physics_runtime_safety_control`

2. Leaf anchoring:
- Every claim leaf used for runtime prompts is covered by at least one path.
- Each path must be explicit `root -> ... -> leaf`.

3. DAG bridge integrity:
- Paths must include at least one named bridge edge.
- Bridges must preserve strict fail determinism and provenance metadata.
- Cross-domain flagship bundles must name each sub-bridge independently so a
  bundle banner never substitutes for sub-bridge falsifiers.

4. Falsifier coverage:
- Every path must define:
  - observable
  - reject rule
  - uncertainty model
  - concrete test references

5. Narrative-to-theory chain:
- Claims must map through:
  - observation
  - model/equation references
  - prediction
  - falsifier
  - verdict
  - claim tier

6. Tier governance:
- Path maturity gates cannot exceed manifest ceiling.
- Missing falsifier/evidence fields must fail validation.
- The flagship `nhm2.curvature-collapse` bundle must stay capped at
  `diagnostic`; it may not be used to justify FTL or objective-collapse claims.

7. Flagship physics bridge family:
- The manifest must explicitly carry the measured-physics lane:
  - `path_casimir_force_to_stress_energy`
  - `path_stress_energy_to_gr_diagnostics`
  - `path_gr_diagnostics_to_curvature_proxy`
  - `path_curvature_proxy_to_collapse_benchmark`
  - `path_solar_coherence_to_collapse_hypothesis`
- The first four paths are the evidence-bearing chain. The solar coherence lane
  is hypothesis-only and must remain quarantined beneath the measured chain.

## Implementation artifacts
- Manifest: `configs/physics-root-leaf-manifest.v1.json`
- Validator: `scripts/validate-physics-root-leaf-manifest.ts`
- Test: `tests/physics-root-leaf-manifest.spec.ts`
- Research handoff brief: `docs/audits/first-class-root-lane-gap-research-brief.md`

## Agent workflow
1. Update root/leaf paths in the manifest for new theory lanes.
2. If touching the curvature-collapse family, update the
   `nhm2.curvature-collapse` bundle and keep each sub-bridge falsifier explicit.
3. Run `npm run validate:physics:root-leaf`.
4. Run `npm run audit:toe:preflight`.
5. Attach receipt evidence under `docs/audits/ticket-results/` when ticket-scoped.

## Notes
- This audit does not certify physical truth by itself.
- It enforces structure so falsifiability and congruence checks can be
  consistently applied across future ToE tickets.
