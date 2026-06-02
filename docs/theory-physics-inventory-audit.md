# Theory Physics Inventory Audit

Generated: 2026-06-02T06:55:34.509Z

This audit compares repo-owned physics docs, configs, scripts, data, and shared modules against the current Physics Atlas and Theory Badge Graph. It does not execute simulations or runtime commands.

## Summary

- Graph: `nhm2-theory-badge-graph`
- Badges in graph: 121
- Atlas blocks: 9
- Repo-owned paths scanned: 6853
- Represented domains: 2
- Partially represented domains: 2
- Repo-present graph gaps: 4
- Not detected: 0

## Domain Coverage

| Domain | Status | Repo paths | Atlas blocks | Badges | Missing badge prefixes | Next patch |
| --- | --- | ---: | --- | ---: | --- | --- |
| Granular / Tidal Love-Number Response | `repo_present_graph_gap` | 12 | - | 0 | `tidal.`, `granular.`, `self_gravity.` | feat(theory): add granular tidal/Love-number badge seed under Galactic or Collapse |
| Solar Flare / Sunquake / Nanoflare Response | `partially_represented` | 16 | `solar_surface_spectrum` | 2 | `solar.sunquake.`, `solar.nanoflare.` | feat(theory): extend solar atlas with flare-to-sunquake and nanoflare observable badges |
| Solar Restoration / Red-Giant Prevention | `repo_present_graph_gap` | 6 | - | 0 | `stellar.restoration.`, `solar.restoration.`, `starsim.restoration.` | feat(theory): add solar-restoration/red-giant planning badges as non-actionable forecast rows |
| DP / Objective-Collapse Runtime | `represented` | 21 | `curvature_collapse` | 21 | - | chore(theory): keep DP/objective-collapse badges aligned with runtime artifacts |
| Orch-OR / Microtubule / Time-Crystal Hypothesis | `represented` | 38 | `curvature_collapse` | 10 | - | chore(theory): keep Orch-OR comparison rows fenced as exploratory |
| Halobank Solar / Tidal Diagnostics | `repo_present_graph_gap` | 35 | - | 0 | `halobank.`, `solar.tidal.`, `tidal.` | feat(theory): add halobank solar/tidal diagnostic badge seed |
| Stellar Structure / Nucleosynthesis | `partially_represented` | 64 | `galactic_dynamics`, `stellar_evolution` | 23 | `stellar.` | feat(theory): expand Stellar lane with hydrostatic/opacity/nucleosynthesis source rows |
| Solar Reference Pack / Helioseismic Closure | `repo_present_graph_gap` | 16 | - | 0 | `solar.reference.`, `solar.interior.`, `solar.cycle.` | feat(theory): add solar reference-pack badges for helioseismic/neutrino/cycle context |

## Gaps To Patch First

### Granular / Tidal Love-Number Response

- Status: `repo_present_graph_gap`
- Recommended patch: feat(theory): add granular tidal/Love-number badge seed under Galactic or Collapse
- Claim boundary: Tidal and Love-number rows should be material-response diagnostics, not universal collapse or solar-restoration claims.
- Sample repo paths: `docs/architecture/granular-tidal-sunquake-bridge-plan.md`, `docs/architecture/gravitational-response-self-gravity-shape-plan.md`, `docs/audits/research/granular-tidal-sunquake-source-check-2026-03-25.md`, `docs/audits/research/self-gravity-shape-source-check-2026-03-25.md`, `docs/knowledge/math-claims/self-gravity-shape.math-claims.json`, `docs/knowledge/physics/granular-collision-dissipation.md`, `docs/knowledge/physics/granular-tidal-response-diagnostic.md`, `docs/knowledge/physics/physics-self-gravity-shape-tree.json`, `docs/knowledge/physics/porous-rubble-pile-rheology.md`, `docs/knowledge/physics/self-gravity-shape.md`, `docs/knowledge/physics/tidal-bulge-response.md`, `docs/knowledge/physics/tidal-quality-factor.md`

### Solar Flare / Sunquake / Nanoflare Response

- Status: `partially_represented`
- Recommended patch: feat(theory): extend solar atlas with flare-to-sunquake and nanoflare observable badges
- Claim boundary: Solar flare, sunquake, and nanoflare rows are observational/MHD diagnostics, not wavefunction-collapse evidence.
- Sample repo paths: `docs/architecture/granular-tidal-sunquake-bridge-plan.md`, `docs/audits/research/granular-tidal-sunquake-source-check-2026-03-25.md`, `docs/knowledge/physics/flare-particle-precipitation.md`, `docs/knowledge/physics/flare-sunquake-timing-correlation.md`, `docs/knowledge/physics/nanoflare-heating.md`, `docs/knowledge/physics/physics-solar-surface-event-tree.json`, `docs/knowledge/physics/quasi-periodic-flare-envelope.md`, `docs/knowledge/physics/solar-flare-line-origin.md`, `docs/knowledge/physics/solar-flare-phase-definition.md`, `docs/knowledge/physics/solar-helioseismic-observable-contract.md`, `docs/knowledge/physics/solar-sunquake-impact-definition.md`, `docs/knowledge/physics/sunquake-timing-replay-diagnostic.md`

### Solar Restoration / Red-Giant Prevention

- Status: `repo_present_graph_gap`
- Recommended patch: feat(theory): add solar-restoration/red-giant planning badges as non-actionable forecast rows
- Claim boundary: Solar restoration rows must be planning/forecast context only and cannot imply feasible stellar intervention.
- Sample repo paths: `docs/knowledge/red-giant-phase.md`, `docs/knowledge/solar-restoration.md`, `docs/knowledge/stellar-ledger.md`, `docs/knowledge/stellar-restoration-tree.json`, `docs/audits/ticket-results/toe-036-stellar-restoration-runtime-provenance-contract.20260218t035555z.json`, `docs/knowledge/trees/stellar-restoration-tree.md`

### Halobank Solar / Tidal Diagnostics

- Status: `repo_present_graph_gap`
- Recommended patch: feat(theory): add halobank solar/tidal diagnostic badge seed
- Claim boundary: Halobank solar/tidal rows should remain falsifier/diagnostic context unless runtime receipts support a narrower claim.
- Sample repo paths: `configs/halobank-solar-diagnostic-datasets.v1.json`, `configs/halobank-solar-kernel-bundle.v1.json`, `configs/halobank-solar-local-rest-reference.v1.json`, `configs/halobank-solar-metric-context.v1.json`, `configs/halobank-solar-thresholds.v1.json`, `docs/architecture/granular-tidal-sunquake-bridge-plan.md`, `docs/architecture/halobank-paper-definition-congruence-plan.md`, `docs/knowledge/halobank-solar-proof-tree.json`, `docs/knowledge/halobank.md`, `docs/audits/ticket-results/toe-012-halobank-horizons-consistency-gate.20260218-012531.json`, `docs/audits/ticket-results/toe-012-halobank-horizons-consistency-gate.20260218t010053z.json`, `docs/audits/ticket-results/toe-012-halobank-horizons-consistency-gate.20260219-172109.json`

### Stellar Structure / Nucleosynthesis

- Status: `partially_represented`
- Recommended patch: feat(theory): expand Stellar lane with hydrostatic/opacity/nucleosynthesis source rows
- Claim boundary: Stellar structure rows are reduced-order/model-context unless external stellar-evolution receipts are present.
- Sample repo paths: `docs/knowledge/star-hydrostatic.md`, `docs/research/starsim-fusion-benchmark-stage2-candidate.md`, `docs/research/starsim-fusion-external-repro-stage2-gate.md`, `docs/research/starsim-fusion-microphysics-stage1.md`, `docs/research/starsim-fusion-profile-import-stage2-prep.md`, `docs/research/starsim-solar-mesa-docker-repro-v1.md`, `docs/starsim/mesa-gyre-worker.md`, `docs/audits/research/quantum-to-classical-multiscale-closure-architecture-for-fusion-experiments-2026-03-28.md`, `docs/audits/research/quantum-to-classical-multiscale-closure-architecture-for-fusion-experiments-source-packet-2026-03-28.md`, `docs/audits/research/stellar-structure-nucleosynthesis-source-check-2026-03-25.md`, `docs/knowledge/math-claims/starsim-fusion-benchmark.claims.json`, `docs/knowledge/math-claims/starsim-fusion-microphysics.claims.json`

### Solar Reference Pack / Helioseismic Closure

- Status: `repo_present_graph_gap`
- Recommended patch: feat(theory): add solar reference-pack badges for helioseismic/neutrino/cycle context
- Claim boundary: Solar reference-pack rows are observational closure context and must require calibration/provenance.
- Sample repo paths: `data/starsim/solar-product-registry.v1.json`, `data/starsim/solar-reference-pack.v1.json`, `docs/research/starsim-solar-reference-repro-run-v1.md`, `docs/starsim/solar-product-provenance.md`, `docs/starsim/solar-reference-anchors.md`, `docs/knowledge/math-claims/starsim-solar-reference-run.claims.json`, `docs/knowledge/physics/solar-helioseismic-observable-contract.md`, `server/modules/starsim/solar-product-registry.ts`, `server/modules/starsim/solar-reference-anchors.ts`, `server/modules/starsim/solar-reference-pack.ts`, `server/modules/starsim/external/mesa-solar-reference-inlists.ts`, `shared/starsim-fusion-neutrino-closure.ts`

## Guardrails

- A repo path match means prior work exists; it does not mean the graph already represents the equations.
- A badge match means the graph has some coverage; it does not imply runtime receipt coverage.
- Solar restoration, nanoflare/sunquake, tidal-response, and Orch-OR rows must keep explicit claim boundaries.
- This audit is intended to prevent repeated rediscovery and guide small badge-seed patches.
