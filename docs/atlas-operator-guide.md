# Atlas Operator Guide (Phase 1)

Phase 1 Atlas generates a deterministic repo-wide graph artifact by aggregating:
- repo search index
- repo graph
- code lattice snapshot

## Build Atlas

```bash
npm run atlas:build
```

Writes:
- `artifacts/repo-atlas/repo-atlas.v1.json`

## Query Atlas (deterministic)

Queries read only `artifacts/repo-atlas/repo-atlas.v1.json`.

```bash
npm run atlas:why -- <identifier>
npm run atlas:trace -- <identifier> --upstream
npm run atlas:trace -- <identifier> --downstream
```

## Failure modes

- **artifact missing**: run `npm run atlas:build` first.
- **identifier not found**: use exact/partial id, label, or path from atlas nodes.
- **stale data**: rebuild atlas after repo updates.
- **graph sparsity**: upstream systems may not expose all node/edge families yet in Phase 1.
