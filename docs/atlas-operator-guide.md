# Atlas Operator Guide (Phase 1.1)

Phase 1.1 Atlas generates a deterministic repo-wide graph artifact by aggregating:
- repo search index
- repo graph
- code lattice snapshot
- optional tree/DAG walk report (`docs/warp-tree-dag-walk-report.json`)

The build also seeds a canonical G4 chain into the atlas:
- `value:rhoSource`
- `value:lhs_Jm3`
- `value:boundComputed_Jm3`
- `value:boundUsed_Jm3`
- `value:marginRatioRaw`
- `gate:G4_QI_margin`

## Build Atlas

```bash
npm run atlas:build
```

Writes:
- `artifacts/repo-atlas/repo-atlas.v1.json`

Snapshot metadata now includes:
- `repoGraphBuiltAt`
- `treeDagWalkLoaded`

## Query Atlas (deterministic)

Queries read only `artifacts/repo-atlas/repo-atlas.v1.json`.
Identifier resolution prefers exact id/label/path matches before fuzzy partial matches.

```bash
npm run atlas:why -- <identifier>
npm run atlas:trace -- <identifier> --upstream
npm run atlas:trace -- <identifier> --downstream
npm run atlas:first-divergence -- <canonical.json> <recovery.json> --selector same-rho-source
```

`atlas:first-divergence` supports the `qi_margin` route and reports the first stage
that diverges across:
- `S0_source`
- `S1_qi_sample`
- `S2_bound_computed`
- `S3_bound_policy`
- `S4_margin`
- `S5_gate`

## Failure modes

- **artifact missing**: run `npm run atlas:build` first.
- **identifier not found**: use exact/partial id, label, or path from atlas nodes.
- **stale data**: rebuild atlas after repo updates.
- **graph sparsity**: upstream systems may not expose all node/edge families yet in Phase 1.1.
- **first-divergence recovery case missing**: use `--recovery-case-id`, or provide a recovery payload with a `cases[]` array.
