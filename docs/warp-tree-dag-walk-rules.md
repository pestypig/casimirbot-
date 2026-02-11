# Warp Tree/DAG Deterministic Walk Rules

Status: draft  
Owner: dan  
Scope: deterministic traversal rules for congruence-aware tree walks

## Purpose
Provide deterministic traversal rules that respect the congruence policy and inline metadata. These rules ensure that tree walks do not traverse edges that violate the chosen CL level, chart, or region conditions.

## Inputs
- Base tree JSON files (with inline congruence metadata).
- Policy in `docs/warp-tree-dag-congruence-policy.md`.

## Walk Configuration (example)
```json
{
  "allowedCL": "CL4",
  "allowConceptual": false,
  "allowProxies": false,
  "chart": "comoving_cartesian",
  "region": {
    "B_equals_1": true,
    "qi_metric_derived_equals_true": true,
    "qi_strict_ok_equals_true": true,
    "theta_geom_equals_true": true,
    "vdb_two_wall_derivative_support_equals_true": false,
    "ts_metric_derived_equals_true": false,
    "cl3_metric_t00_available_equals_true": false,
    "cl3_rho_gate_equals_true": false
  },
  "seedOrder": "lex"
}
```

## Walk Usage (manual)
Until a dedicated runner exists, a walk can be performed by:
1. Load the tree JSON files.
2. Filter edges using the rules below.
3. Traverse deterministically (BFS or DFS) using the configured `seedOrder`.

Example command outline (pseudo):
```text
load trees -> apply filters -> sort edges -> traverse -> record path
```

## Scripted Walk (tsx)
Use the built-in script with the default config:
```text
npx tsx scripts/warp-tree-dag-walk.ts --config docs/warp-tree-dag-walk-config.json
```

Default tree set includes warp mechanics, physics foundations, brick-lattice dataflow, math,
GR solver, simulation systems, uncertainty mechanics, panel concepts, panel registry, and
resonance trees. Override with `--trees` to narrow the scope.

Optional flags:
```text
--trees docs/knowledge/warp/warp-mechanics-tree.json,docs/knowledge/physics/physics-foundations-tree.json
--start warp-mechanics-tree
--out tmp/warp-tree-walk.json
--config docs/warp-tree-dag-walk-config.json
```

## Helix Ask Default
Helix Ask graph resolver now loads `docs/warp-tree-dag-walk-config.json` by default
and applies congruence filtering to any tree that includes inline metadata.
Strict default expects geometry-backed theta gating (`theta_geom_equals_true=true`).
Override the path with `HELIX_ASK_CONGRUENCE_WALK_CONFIG` if needed.

## Deterministic Traversal Rules
1. Load base edges from tree JSON.
2. Use inline metadata (`childMeta`, `links[]` fields, `blockedLinks`) when building effective edges.
3. Filter edges:
   - If `edgeType` is `hierarchy` or `association`, include only if `allowConceptual=true`.
   - If `edgeType` is `proxy_only`, include only if `allowProxies=true`.
   - If `requiresCL` is set to a CL level, only include if `requiresCL <= allowedCL`.
   - If `chartDependency` is set, include only if it matches the active chart.
   - If `condition` is set, include only if the condition is satisfied by the walk region predicate.
   - For strict QI guardrail edges, use condition `qi_metric_derived=true` and set
     region key `qi_metric_derived_equals_true=true`.
   - Optionally mirror strict state with `qi_strict_ok_equals_true=true` for backward compatibility.
   - For strict ThetaAudit edges, use condition `theta_geom=true` and set
     region key `theta_geom_equals_true=true` only when geometry theta is available.
   - For strict VdB-band edges, use condition `vdb_two_wall_derivative_support=true` and set
     region key `vdb_two_wall_derivative_support_equals_true=true` only when derivative support is present.
    - For strict TS-ratio edges, use condition `ts_metric_derived=true` and set
      region key `ts_metric_derived_equals_true=true` only when TS is metric/proper-distance derived.
    - For strict CL3 source edges, use condition `cl3_metric_t00_available=true` and set
      region key `cl3_metric_t00_available_equals_true=true` only when metric-derived T00 is present.
    - For strict CL3 pass edges, use condition `cl3_rho_gate=true` and set
      region key `cl3_rho_gate_equals_true=true` only when CL3 metric delta gate passes.
4. Sort outgoing edges deterministically by `(edgeType, targetId)` when `seedOrder=lex`.
5. Traverse with fixed BFS or DFS order. For reproducibility, record:
   - start node
   - walk config
   - edge filter summary

## Output Guarantees
If the same tree JSON and walk config are provided, the traversal must produce identical results.
