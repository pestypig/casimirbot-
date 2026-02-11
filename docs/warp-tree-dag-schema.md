# Warp Tree/DAG Metadata Schema

Status: draft  
Owner: dan  
Scope: inline schema for congruence metadata embedded in tree JSON files

## Purpose
Define a metadata schema for congruence-aware tree walks using inline metadata in the tree JSON files.

## Inline Metadata (Primary)

### Node fields
Each node gains a `congruence` block and optional edge metadata:
```json
{
  "congruence": {
    "class": "metric_family",
    "chart": null,
    "congruenceLevel": null
  },
  "childMeta": {
    "child-node-id": {
      "edgeType": "hierarchy",
      "requiresCL": "none",
      "condition": null,
      "chartDependency": null,
      "proxy": null
    }
  },
  "blockedLinks": [
    {
      "source": "node-id",
      "target": "node-id",
      "edgeType": "incompatible",
      "requiresCL": "none",
      "reason": "CL2 mismatch: theta signature differs"
    }
  ]
}
```

### Link fields
Each `links[]` entry can include congruence metadata:
```json
{
  "rel": "congruence",
  "to": "target-node-id",
  "edgeType": "equivalent_metric",
  "requiresCL": "CL0",
  "condition": "B(r)=1",
  "chartDependency": "lab_cartesian",
  "note": "optional rationale"
}
```

## Field Semantics
- `congruence.class`: one of the node classes defined in the congruence policy.
- `congruence.chart`: optional chart label (lab_cartesian, comoving_cartesian, spherical_comoving).
- `congruence.congruenceLevel`: optional claimed CL level for the node itself (rare).
- `childMeta.edgeType`: from the policy table (hierarchy, association, equivalent_metric, etc.).
- `childMeta.requiresCL`: CL0..CL4 or `none` for non-congruence edges.
- `childMeta.condition`: region constraint if the edge is region-conditional.
  Example: `B(r)=1`, `qi_metric_derived=true`, `theta_geom=true`, `vdb_two_wall_derivative_support=true`, or `ts_metric_derived=true`.
- `childMeta.chartDependency`: chart required for ADM/geometry equivalence.
- `blockedLinks`: explicitly disallowed relations even if conceptually similar.

## Walk Integration
Consumers should build an effective adjacency list by:
1. Loading tree JSON with inline metadata.
2. Applying the walk policy (allowedCL, allowConceptual, chart, region conditions).
