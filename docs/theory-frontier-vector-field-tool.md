# Theory Frontier Vector Field Tool

This note records the current behavior of the Theory Frontier Vector Field tool as
observed in direct executor probes on 2026-06-20. It is a technical contract and
debug reference, not a claim that any theory candidate has been validated.

## Purpose

The tool treats the Helix Theory Badge Graph as a deterministic, multi-axis
frontier-placement space. It maps a query or target concept onto nearby badge
coordinates, emits candidate relation tensors, and reports evidence gaps that
would need exact verification before any graph edge could be trusted.

The tool is useful for:

- locating where a new or external concept appears to sit relative to existing
  badges,
- identifying missing intermediate badges or weak semantic regions,
- comparing candidate connections by reproducible placement scores,
- exposing dimensional, equation-family, source, and claim-boundary gaps, and
- preserving replay data for later Ask, paper lookup, or verification work.

The tool is not useful for:

- validating a theory,
- proving a physical mechanism,
- authorizing badge or edge promotion,
- converting literature into graph truth automatically, or
- treating placement probability as truth probability.

## Code Surface

The main direct executor is:

- `shared/theory/theory-frontier-vector-field-tool.ts`

The core vector/tensor trace builder is:

- `shared/theory/theory-frontier-vector-field.ts`

The Ask-level wrapper is:

- `server/services/helix-ask/theory-frontier-vector-field-tool.ts`

The output contract is:

- `shared/contracts/helix-theory-frontier-vector-field-tool-receipt.v1.ts`
- `shared/contracts/theory-frontier-vector-field.v1.ts`

The live Ask capability name is:

- `helix.theory.frontierVectorFieldTrace`

At the time of this note, the direct executor works. Natural-language dispatch
through Helix Ask is still gated by tool-policy wiring.

## Coordinate Model

Each badge is converted into a coordinate vector with these axes:

- `scale_log10_m`
- `unit_dimension_signature`
- `equation_family`
- `domain`
- `fidelity`
- `claim_pressure`
- `evidence_density`
- `first_principles_depth`

The vector trace then compares badge pairs and emits relation tensors. These
tensors are relation transforms only. They express placement deltas, covariance
diagonals, evidence gaps, and exact verification requirements. They do not
validate the relation.

Entropy is interpreted as placement and boundary uncertainty only. It is not a
probability that a theory is true.

## Diagnostic Signal Layer

Each candidate now carries a `placementDiagnostic` object so the next agent turn
does not have to infer meaning from raw distances alone. The diagnostic exposes:

- `fitClass`: one of `strong_local_fit`, `moderate_local_fit`,
  `weak_cross_domain_fit`, `off_manifold`, or `missing_region_suspected`.
- `fitScore`: an aggregate bounded score for placement fit.
- `localCongruenceScore`: how well unit, equation-family, domain, fidelity, and
  scale axes line up.
- `evidenceReadinessScore`: how much verification work appears to remain.
- `uncertaintyPressureScore`: how much uncertainty could be reduced by closing
  the candidate.
- `positiveSignals`: reasons the placement has local support.
- `blockingSignals`: dimensional, equation, scale, domain, or evidence gaps.
- `missingStructureHints`: suggested graph structures that would improve future
  placement.

The trace also carries `traceDiagnostics`, which aggregates candidate fit
classes, identifies the strongest and weakest candidate ids, and summarizes
missing structure across the whole probe.

These diagnostics are intended as transparent interpretation aids. They do not
change the claim boundary: a strong local fit still cannot validate or promote a
theory edge.

## Seed Atlas Visualization Layer

The Theory Badge Graph now includes a deterministic Seed Atlas overlay for the
existing biome map. It reuses the `TheoryAchievementMap` terrain, badge, edge,
and probability layers instead of replacing them.

The main visualization adapter is:

- `client/src/lib/theory/theoryFrontierMapOverlay.ts`

The map integration is:

- `client/src/components/panels/TheoryAchievementMap.tsx`
- `client/src/components/panels/TheoryBadgeGraphPanel.tsx`

`TheoryBadgeGraphPanel` builds a stable client-side frontier trace from the
current graph and selection using `traceTheoryFrontierVectorField`. The trace is
seeded from the graph id, selected badges, and search text, and uses the graph
artifact timestamp as `generatedAt` so replay metadata remains deterministic
for the displayed state.

The overlay visual semantics are:

- hue: existing biome/domain/scale terrain,
- fog or fill brightness: placement certainty from `fitScore`,
- rough dashed contours: entropy and unresolved placement pressure,
- amber outline strength: claim pressure,
- contour count: local scale/depth congruence,
- hatch: missing-region or missing-structure hints,
- curved paths: relation tensors between candidate badge coordinates.

The Seed Atlas layer is still a research-navigation view only. It visualizes
placement uncertainty, frontier fit, and missing structure. It does not validate
a theory, solve a mechanism, or authorize badge/edge promotion.

## Replay Contract

A reproducible trace is keyed by:

- graph hash,
- query,
- search seed,
- coordinate basis version,
- scoring version,
- taxonomy version, and
- evidence reference ids.

Direct probes confirmed byte-for-byte deterministic replay when those inputs
were held constant.

## Probe 1: Weyl Curvature Target

Target concept:

> Weyl curvature as an external target concept near conformal Riemann curvature,
> Ricci/Riemann curvature invariants, Natario geometry, source closure, and
> NHM2 claim boundaries.

The query did not add a Weyl badge. It only asked the locator to find surrounding
badge coordinates.

Observed result:

- deterministic replay: `true`
- status: `partial`
- trace id: `vector_field:a04017fd`
- graph hash: `tfh_8ca758d1`
- selected badge count: `12`
- candidate count: `8`
- relation tensor count: `8`
- validation issues: none

Important selected surrounding badges included:

- `nhm2.natario.curvature_invariants`
- `nhm2.natario.invariant_audit`
- `curvature.proxy.body_density`
- `curvature.proxy.drive_body_ratio`
- `curvature.proxy.drive_power_flux`
- `curvature.uncertainty.margin`
- `curvature.uncertainty.z_score`
- `nhm2.tensor.same_chart_full_tensor`
- `nhm2.closure.same_basis_regional_residual`
- `nhm2.closure.source_residual`
- `nhm2.closure.wall_t00_source_residual`

The best forced-pair Weyl-adjacent placements were:

| Candidate pair | Score | Interpretation |
| --- | ---: | --- |
| `nhm2.natario.curvature_invariants` -> `nhm2.tensor.same_chart_full_tensor` | `0.220833` | Strongest forced surrounding placement; still needs dimensional and equation evidence. |
| `nhm2.natario.curvature_invariants` -> `physics.gr.einstein_field_equation` | `0.183333` | Correctly points toward GR source/curvature context while requiring exact verification. |
| `nhm2.natario.curvature_invariants` -> `physics.gr.3p1_decomposition` | `0.134375` | Relevant but weak; requires dimensional and equation-family closure. |

The tool correctly emitted:

- `claim_boundary_blocked`
- `dimensional_mapping_incomplete`
- `evidence_gap_unclosed`
- `exact_verification_required`
- `live_scholarly_lookup_not_available` when the query explicitly referenced
  literature-style lookup.

This is the expected behavior. Weyl curvature has nearby GR/Natario/curvature
structure in the badge graph, but no automatic claim promotion is allowed.

## Probe 2: Holographic Entanglement Target

Target concept:

> Holographic entanglement entropy, Ryu-Takayanagi minimal surfaces, AdS/CFT,
> geometry from quantum information, tensor-network error correction, black-hole
> information, and entropy as boundary area.

This was intentionally harder than Weyl curvature because the graph does not
appear to have a mature holography region.

Observed result:

- deterministic replay: `true`
- status: `partial`
- trace id: `vector_field:1c0482ee`
- graph hash: `tfh_8ca758d1`
- selected badge count: `12`
- candidate count: `8`
- relation tensor count: `8`
- validation issues: none

Selected surrounding badges were weaker and more diffuse:

- `biophysics.membrane.open_system_entropy_flow`
- `matter.phase.entropy_production_context`
- `matter.phase.quantized_mode_frequency_context`
- `matter.phase.quantum_classical_time_crystal_bridge_context`
- `physics.quantum.uncertainty_position_momentum`
- `casimir.cavity.geometry_gain`
- `nhm2.closure.same_basis_regional_residual`
- `nhm2.tensor.metric_required_stress_energy`
- `nhm2.tensor.full_authority_gate`
- `physics.gr.einstein_field_equation`

The strongest candidates drifted toward existing tensor/source-authority
machinery rather than a real holography neighborhood:

| Candidate pair | Score | Interpretation |
| --- | ---: | --- |
| `nhm2.observer.energy_density_projection` -> `nhm2.tensor.full_authority_gate` | `0.477778` | Existing tensor authority path, not holography-specific. |
| `nhm2.observer.spatial_stress_projection` -> `nhm2.tensor.full_authority_gate` | `0.477778` | Existing observer/tensor path, not holography-specific. |
| `nhm2.closure.same_basis_regional_residual` -> `nhm2.tensor.tile_effective_counterpart` | `0.442857` | Existing tensor residual structure. |
| `nhm2.tensor.metric_required_stress_energy` -> `physics.gr.einstein_field_equation` | `0.2125` | GR source/curvature path; weakly relevant to gravity side only. |

This is also expected behavior. The tool did not hallucinate a holography badge.
It found entropy, quantum, geometry, and tensor-adjacent regions, then exposed
that the graph lacks explicit holographic constructs.

Likely missing badge axes or future badge candidates include:

- boundary/bulk mapping,
- entropy-area relation,
- minimal or extremal surface geometry,
- AdS/CFT domain boundary,
- tensor-network or quantum-error-correction encoding,
- black-hole information boundary, and
- GR curvature/source relation boundary.

## Method Anchors

These sources are used as method anchors or external concept anchors. They guide
the shape of the tool; they do not prove any candidate relation true.

- Shannon entropy: information uncertainty, not theory truth probability.
  `https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf`
- NIST uncertainty guidance: separate uncertainty components by model role.
  `https://emtoolbox.nist.gov/publications/nisttechnicalnote1297s.pdf`
- Tensor calculus for GR: coordinate-basis and tensor transform precedent.
  `https://web.mit.edu/edbert/GR/gr1.pdf`
- 3+1 formalism: coordinate split, constraint, and evolution-style separation.
  `https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf`
- Gaussian processes: covariance as an uncertainty structure over fields.
  `https://gaussianprocess.org/gpml/chapters/RW.pdf`
- Perlin procedural noise: seeded procedural fields.
  `https://dl.acm.org/doi/10.1145/325165.325247`
- Cubiomes: deterministic staged seed search and replay.
  `https://github.com/Cubitect/cubiomes`
- Minecraft Caves & Cliffs II: multi-resolution terrain/biome distribution.
  `https://www.minecraft.net/en-us/article/caves---cliffs-part-ii-the-features`
- Red Blob terrain noise: independent fields defining map regions.
  `https://www.redblobgames.com/maps/terrain-from-noise/`
- Natario warp drive: zero-expansion warp-drive geometry context.
  `https://arxiv.org/abs/gr-qc/0110086`
- Alcubierre warp drive: canonical warp-drive metric context.
  `https://arxiv.org/abs/gr-qc/0009013`
- Ryu-Takayanagi holographic entanglement entropy.
  `https://arxiv.org/abs/hep-th/0603001`
- Maldacena AdS/CFT.
  `https://arxiv.org/abs/hep-th/9711200`
- Holographic quantum error-correcting codes.
  `https://arxiv.org/abs/1503.06237`

## Current Operational Gap

The direct executor can produce reproducible frontier traces. The live Ask
catalog exposes `helix.theory.frontierVectorFieldTrace`, but a direct Ask probe
previously selected the capability and then rejected dispatch with:

- `capability_family_not_admitted_by_tool_policy`

That means the remaining integration work is Ask tool-policy admission and live
parity coverage, not the vector-field math kernel.

## Recommended Next Tests

1. Add a dedicated API parity scenario for `helix.theory.frontierVectorFieldTrace`.
2. Assert that live Ask natural language can dispatch the capability.
3. Assert that the emitted receipt remains evidence-only and non-terminal.
4. Preserve deterministic replay keys in the debug export.
5. Add at least one hard negative prompt where the capability name is quoted,
   historical, negated, or screen-visible.
6. Add one weak-frontier fixture, such as holographic entanglement, to verify
   that the tool exposes missing graph structure instead of overfitting.
7. Add regression checks that hard targets produce `missingStructureHints`
   instead of silently drifting into dense but unrelated graph regions.

## Claim Boundary

Every current probe must be read as frontier-placement evidence only.

The tool can say:

- "this target concept appears near these badge regions,"
- "these candidate transforms are lower-cost than others,"
- "these evidence gaps block verification," and
- "these replay keys reproduce the result."

The tool cannot say:

- "this theory is true,"
- "this edge should be promoted,"
- "this paper validates the graph,"
- "this solves the physical mechanism," or
- "this entropy score is a probability of truth."
