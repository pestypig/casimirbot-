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

8. Casimir–DP/OR boundary-coherence bridge:
- The study-specific bridge is a separate
  `casimir-dp.or-boundary-coherence` bundle rooted at
  `physics_quantum_semiclassical`; it is not a promotion of the NHM2
  curvature-collapse bundle.
- `path_quantum_semiclassical_to_casimir_dp_or_test` must terminate at
  `leaf_casimir_dp_boundary_coherence_or_test` and remain capped at
  `diagnostic`.
- Its strict failure reason is
  `ROOT_LEAF_CASIMIR_DP_OR_BRIDGE_FAIL`.
- The path fails closed when any of these receipts or model components is
  absent:
  - immutable upstream-authority integrity and quantitative preregistration
  - authentic measured evidence
  - fixed-branch-density equivalence across boundary states
  - identifiable complex-coherence, path-swap, conditioning, and echo diagnostics
  - ordinary-decoherence closure
  - deterministic phase-residual replay
  - a dynamics-level collapse discriminator
  - held-out, powered joint model comparison
  - a verified custodian receipt and explicit authorization for measured
    comparison and unblinding
  - a sourced boundary-to-coherence transfer kernel
  - polarization-resolved QED control with fixed Jones/Stokes, propagation,
    handedness, mirror, material-response, and matched-branch conventions
  - Planck/FDT thermal closure with explicit near/far-field routing,
    zero-point separation, heating/noise covariance, and no double counting
  - tensor, dimensional, and semantic congruence across every registered
    representation and causal chain
  - an unchanged named DP parameter manifest
  - a frozen registered numerical bridge kernel before any bridge comparison
- Passing algebraic, synthetic, or fixed-branch replay checks does not close
  any missing measured-evidence or bridge-dynamics gate.
- Stage 3 extends this same bundle; it does not create a second
  curvature-collapse authority. Its six runtimes and evidence-map integration
  test must remain in the path falsifier receipts.
- Stage 4 remains downstream of immutable Stage 3. Its three scientific
  controls and campaign integration test must remain in the path falsifier
  receipts. Equal dimensions among Compton, DP, cavity, thermal, or modulation
  frequencies must resolve to `same_dimension_not_connected` without a
  sourced transfer kernel.
- Stage 4.1 remains an immutable source-backed QED identity calibration.
  Stage 4.2A must hash-link that complete authority tuple before replaying the
  Penning electron-mass anchor, the conditional Higgs-Yukawa tree relation, or
  the Planck/solar radiometric sibling.
- Stage 4.2A is a cross-scale dependency and calibration ladder, not an
  evidence ladder for DP. The electron kg/J/MeV/Compton/Rydberg forms share a
  mass ancestor; Planck integration and Stefan-Boltzmann share one analytic
  identity family; and the TSIS color temperature is operationally distinct
  from the IAU luminosity-radius bolometric effective temperature.
- The Stage-4.2A promotion/readiness path fails closed if
  electron-mass/Higgs-tree calibration, Planck/solar calibration, or the
  explicit cross-scale DP nonbridge is absent. Passing all three only makes
  later DP parameterization interpretable. Their absence does not empirically
  falsify DP; the scientific reject rule activates only for authorized,
  replicated held-out measurements after ordinary-decoherence closure. These
  calibrations cannot satisfy measured coherence, collapse, manifold,
  cosmological-lift, or physical-viability gates.
- Stage 4.2B extends this same diagnostic bundle with six independently
  inspectable apparatus responsibilities: object and complete-joint-system
  branch-density transport; response-corrected spectral thermometry; a
  sensor-forward model that separates physical disturbance from sensor
  self-noise and propagates full cross-spectral covariance; a frozen named
  regularized mass-density DP \(E_G/\hbar\) signature; a pilot-frozen
  complex-coherence residual likelihood; and nuisance-profiled
  identifiability, power, and acquisition forecasting.
- The registered Stage-4.2B boundary null is conditional, not universal. It
  applies only to the named nonrelativistic Markovian mass-density DP generator
  when the complete joint-system branch densities are experimentally
  equivalent at measured-preparation class. A boundary-correlated residual
  under that identity is an anomaly unless a separately registered causal
  modifier is frozen and tested; it is not evidence for a generic Casimir-DP
  mechanism.
- A synthetic Stage-4.2B campaign may establish software recovery, provenance,
  numerical convergence, signature rank, and an apparatus-specific power
  forecast. It must retain `measured_evidence: not_ready`,
  `collapse_identification: blocked`, `manifold_dynamics: blocked`, and
  `physical_viability: not_evaluated`. An underpowered forecast is an
  apparatus no-go, not a rejection of DP.
- The authoritative coupled Stage-4.2B run is
  `casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z`.
  Its campaign/content integrity gates pass; Runtimes A–E pass; Runtime F
  fails closed as `signature_not_identifiable`. The physical signature matrix
  has rank 7, maximum absolute whitened cosine `0.9999771044199663` for
  `signature-intercept` versus `signature-thermal`, and normalized Gram
  condition number `179103.91134865975`.
- Its config, authority manifest, and fixture SHA-256 values are
  `2abf8808fe73f6099d3e9e93e1bed2c8ca33d1094b6a93e9ad926f5fd900fa3e`,
  `dd3e423c02fdb16481c91c7ff3ee8583aa740efc71e5a04902ce32cf10754d35`,
  and
  `ca89c5385bd55290b1cda8084b3d067cbd76420c810164fc958f310de11d1b8c`.
  Immutable JSON, Markdown, 42-record/NUL-free trace, and receipt hashes are
  `2ebd9971bacc393842dc71bfd80063d7b244231947074bc70b3be25bd7ad5b67`,
  `e29564c6cedcace388233f6006b98683fab54f9326b96ab9bbaf3334f33adcbe`,
  `727d78249462f0b4171532af37db97be5500a3a7a870cc56b2e533cae0ae0df7`,
  and
  `50632b32c4133fe3f0f5eee3cbbb157a983d0a9da69de6239d58563ca88f569c`.
  Fresh Casimir adapter run `2325` returns `PASS`, first failure null, deltas
  empty, and certificate integrity `OK`. The fail-closed one-record trace is
  `3894af959e1f3de8d28ede457727a97688c2fd64031c3512f941f5b89a889ffd`;
  the downstream verification receipt is
  `194a58bcfa4cc855c8a50a8a862fac391a01ee55c4dc9feeb1d6e98526b8bf3d`.
  Its scientific scope is `none`, and no earlier trace or certificate
  artifact is reused.
- The frozen 30 control rows name axes and levels but contain no source-backed
  numerical response vectors or block-bound control covariance. Required
  windows and achieved power are therefore
  `not_estimable_until_identifiable`; the powered and null-excludable region
  sets are empty. This baseline is an apparatus redesign/calibration no-go and
  excludes no DP region.
- The isolated `underpowered_null` fixture is a classification test, not the
  baseline apparatus verdict. Neither it nor the baseline identifiability
  failure can activate the scientific DP reject rule.
- Cross-runtime authority is hash-asserted in one cell/covariance space:
  A object/branch outputs feed D, B thermometry feeds C, C and D feed E, and
  the quadrature/C/D/E values and hashes feed F. The shared 216-cell registry
  SHA-256 is
  `297fb6486a4959e79eae65e00e8c3273a3f4067d6aa3773227315dadfd241d53`;
  all 19 fixtures and 84 focused tests pass.
- The scientific reject rule therefore requires an authorized, replicated,
  held-out measured comparison in a preregistered powered region. Neither an
  underpowered null nor an externally disfavored but apparatus-sensitive
  parameter region can be represented as a DP falsifier.
- The seven `bridge-stage4-2b-*` path labels record root-to-leaf dependencies
  and fail-closed nonclaims. They are not Theory Badge observable bridges; the
  Stage-4.2B v1 badge must retain exactly zero observable-bridge edges.
- Stage-4.2B document synchronization requires seven new equation actions,
  41/41/41 paper/source/generated parity, 27 study badges with 79 graph edges,
  and 213 math-registry entries. Those counts establish navigation and
  provenance integrity only.
- The current Stage-4 blinding lane is `synthetic_contract_only`. Its passing
  gate means the fail-closed contract correctly records that no custodian
  receipt, mapping, measured comparison, or unblinding exists or is
  authorized; it does not mean that a physical blind has been executed.
- The Stage-4 ordinary-physics null is
  `M0_prime = M0 + M_polarization_QED + M_thermal_FDT`. A polarization or
  thermal residual first establishes an unexplained anomaly after measured
  closure; it does not establish collapse or manifold dynamics.
- The same bundle includes the separate ordinary-gravity control path
  `path_complete_casimir_apparatus_to_ordinary_gravity_control`, ending at
  `leaf_casimir_dp_complete_apparatus_gravity_control`. This path starts from a
  signed complete-apparatus state-energy or conserved tensor difference,
  explicitly rejects plate pressure as weight, and retains strict failure
  reason `ROOT_LEAF_CASIMIR_DP_ORDINARY_GRAVITY_FAIL`.
- A schema-complete manifold kernel is merely registered. It cannot validate a
  mechanism or remove the graph-wide diagnostic claim ceiling.

## Implementation artifacts
- Manifest: `configs/physics-root-leaf-manifest.v1.json`
- Validator: `scripts/validate-physics-root-leaf-manifest.ts`
- Test: `tests/physics-root-leaf-manifest.spec.ts`
- Research handoff brief: `docs/audits/first-class-root-lane-gap-research-brief.md`
- Stage-4.2B config:
  `configs/research/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.json`
- Stage-4.2B runner:
  `scripts/research/run-casimir-dp-apparatus-coherence-residual-stage4-2b.ts`
- Stage-4.2B maintained report:
  `docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-report.md`
- Stage-4.2B downstream verification receipt:
  `docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-verification-receipt.json`
- Stage-4.2B authoritative artifact directory:
  `artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/`

## Agent workflow
1. Update root/leaf paths in the manifest for new theory lanes.
2. If touching the curvature-collapse family, update the
   `nhm2.curvature-collapse` bundle and keep each sub-bridge falsifier explicit.
3. If touching the Casimir–DP/OR study, update its separate
   `casimir-dp.or-boundary-coherence` bundle and preserve every fail-closed
   Stage-2/Stage-3/Stage-4 authority, evidence, identifiability, polarization,
   thermal, congruence, model, and bridge
   condition.
4. Run `npm run validate:physics:root-leaf`.
5. Run `npm run audit:toe:preflight`.
6. Attach receipt evidence under `docs/audits/ticket-results/` when ticket-scoped.

## Notes
- This audit does not certify physical truth by itself.
- It enforces structure so falsifiability and congruence checks can be
  consistently applied across future ToE tickets.
