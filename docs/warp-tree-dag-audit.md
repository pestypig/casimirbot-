# Warp Tree/DAG Congruence Audit

This audit summarizes inline metadata coverage.

## Inline Coverage
- total nodes: 255
- nodes with congruence metadata: 255
- childMeta entries: 247
- link entries with metadata: 395
- blockedLinks entries: 4

## EdgeType Summary (inline)
- edgeType `association`: 79
- edgeType `conditional_region`: 8
- edgeType `equivalent_adm`: 1
- edgeType `equivalent_geometry`: 4
- edgeType `equivalent_metric`: 1
- edgeType `equivalent_stress_energy`: 2
- edgeType `guardrail_congruent`: 41
- edgeType `hierarchy`: 486
- edgeType `proxy_only`: 20

## RequiresCL Summary (inline)
- requiresCL `CL0`: 3
- requiresCL `CL1`: 3
- requiresCL `CL2`: 6
- requiresCL `CL3`: 4
- requiresCL `CL4`: 41
- requiresCL `none`: 585

## Chart Dependency Summary (inline)
- chartDependency `None`: 632
- chartDependency `lab_cartesian`: 10

## Guardrail Coverage (CL4)
- guardrail_geometry nodes: 28
- guardrail_proxy nodes: 16
- edgeType `guardrail_congruent`: 41
- edgeType `proxy_only`: 20

## Default Root CL4 Links
| Root | CL4 Link Present | Target |
| --- | --- | --- |
| warp-mechanics-tree | yes | cl3-rho-delta-guardrail, pipeline-constraint-gate |
| physics-foundations-tree | yes | pipeline-constraint-gate |
| brick-lattice-dataflow-tree | yes | pipeline-constraint-gate |
| math-maturity-tree | yes | pipeline-constraint-gate |
| gr-solver-tree | yes | gr-constraint-gate |
| simulation-systems-tree | yes | pipeline-constraint-gate |
| uncertainty-mechanics-tree | yes | pipeline-constraint-gate |
| panel-concepts-tree | no | - |
| panel-registry-tree | no | - |
| resonance-tree | yes | pipeline-constraint-gate |

## Notes
- `hierarchy` and `association` edges are conceptual and require `allowConceptual=true` in walks.
- `conditional_region` edges require a region predicate (example: B(r)=1).
- `blockedLinks` encode disallowed relations even if conceptually similar.
- `guardrail_congruent` edges require CL4 inputs to be geometry-derived.
- Default walk config now enforces `allowedCL=CL4` (strict congruence) unless overridden.
- Strict QI CL4 pathing is keyed to `qi_metric_derived=true` (region flag `qi_metric_derived_equals_true`).
- Latest strict walk report: `docs/warp-tree-dag-walk-report.json` (visitedCount=16) now includes `diagnostics.globalFilter` and `diagnostics.traversalFilter` for deterministic edge-inclusion reasons.
- Helix Ask debug payload now includes `graph_congruence_diagnostics` and per-tree `graph_framework.trees[].congruence` to inspect blocked reasons live.
