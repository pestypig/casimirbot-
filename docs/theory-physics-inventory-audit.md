# Theory Physics Inventory Audit

Generated: 2026-06-04T02:18:43.253Z

This audit compares repo-owned physics docs, configs, scripts, data, and shared modules against the current Physics Atlas and Theory Badge Graph. It does not execute simulations or runtime commands.

## Summary

- Graph: `nhm2-theory-badge-graph`
- Badges in graph: 143
- Atlas blocks: 9
- Repo-owned paths scanned: 6911
- Represented domains: 7
- Partially represented domains: 1
- Repo-present graph gaps: 0
- Not detected: 0

## Domain Coverage

| Domain | Status | Repo paths | Atlas blocks | Badges | Missing badge prefixes | Next patch |
| --- | --- | ---: | --- | ---: | --- | --- |
| Granular / Tidal Love-Number Response | `represented` | 14 | `galactic_dynamics` | 6 | - | feat(theory): add granular tidal/Love-number badge seed under Galactic or Collapse |
| Solar Flare / Sunquake / Nanoflare Response | `represented` | 16 | `solar_surface_spectrum` | 8 | - | feat(theory): extend solar atlas with flare-to-sunquake and nanoflare observable badges |
| Solar Restoration / Red-Giant Prevention | `represented` | 6 | `stellar_evolution` | 7 | - | chore(theory): keep solar-restoration/red-giant planning rows non-actionable and forecast-only |
| DP / Objective-Collapse Runtime | `represented` | 21 | `curvature_collapse` | 21 | - | chore(theory): keep DP/objective-collapse badges aligned with runtime artifacts |
| Orch-OR / Microtubule / Time-Crystal Hypothesis | `represented` | 38 | `curvature_collapse` | 10 | - | chore(theory): keep Orch-OR comparison rows fenced as exploratory |
| Halobank Solar / Tidal Diagnostics | `partially_represented` | 37 | `galactic_dynamics` | 6 | `halobank.`, `solar.tidal.` | feat(theory): add halobank solar/tidal diagnostic badge seed |
| Stellar Structure / Nucleosynthesis | `represented` | 64 | `galactic_dynamics`, `stellar_evolution` | 27 | - | feat(theory): expand Stellar lane with hydrostatic/opacity/nucleosynthesis source rows |
| Solar Reference Pack / Helioseismic Closure | `represented` | 16 | `solar_surface_spectrum`, `stellar_evolution` | 6 | - | feat(theory): add solar reference-pack badges for helioseismic/neutrino/cycle context |

## Gaps To Patch First

### Halobank Solar / Tidal Diagnostics

- Status: `partially_represented`
- Recommended patch: feat(theory): add halobank solar/tidal diagnostic badge seed
- Claim boundary: Halobank solar/tidal rows should remain falsifier/diagnostic context unless runtime receipts support a narrower claim.
- Sample repo paths: `configs/halobank-solar-diagnostic-datasets.v1.json`, `configs/halobank-solar-kernel-bundle.v1.json`, `configs/halobank-solar-local-rest-reference.v1.json`, `configs/halobank-solar-metric-context.v1.json`, `configs/halobank-solar-thresholds.v1.json`, `docs/architecture/granular-tidal-sunquake-bridge-plan.md`, `docs/architecture/halobank-paper-definition-congruence-plan.md`, `docs/knowledge/halobank-solar-proof-tree.json`, `docs/knowledge/halobank.md`, `docs/audits/ticket-results/toe-012-halobank-horizons-consistency-gate.20260218-012531.json`, `docs/audits/ticket-results/toe-012-halobank-horizons-consistency-gate.20260218t010053z.json`, `docs/audits/ticket-results/toe-012-halobank-horizons-consistency-gate.20260219-172109.json`

## Guardrails

- A repo path match means prior work exists; it does not mean the graph already represents the equations.
- A badge match means the graph has some coverage; it does not imply runtime receipt coverage.
- Solar restoration, nanoflare/sunquake, tidal-response, and Orch-OR rows must keep explicit claim boundaries.
- This audit is intended to prevent repeated rediscovery and guide small badge-seed patches.
