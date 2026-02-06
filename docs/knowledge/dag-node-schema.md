# Helix Ask DAG Node Schema (Evidence-First)

This file defines the recommended schema for DAG nodes used by Helix Ask.
Nodes should be reproducible: inputs, outputs, assumptions, evidence, and
environment are explicit and auditable.

## Required fields
- `id`: unique node id (kebab-case).
- `title`: human-readable label.
- `summary`: one-sentence description.
- `tags`: topic tags for retrieval.
- `evidence`: at least one evidence record.

## Optional but strongly recommended
- `inputs`, `outputs` (with units + sources).
- `assumptions`, `validity`.
- `deterministic`, `tolerance`.
- `environment`.
- `dependencies` (node ids) and/or `links` with `rel="depends-on"`.
- `predictability` (status + missing fields).

## Defaults (physics trees first)
Physics trees should include the predictability fields even if incomplete so
Helix Ask can surface missing inputs/assumptions directly:
- `inputs`, `outputs` (empty arrays if unknown)
- `assumptions` (empty array if unknown)
- `validity` (empty object if unknown)
- `deterministic` (null if unknown)
- `tolerance` (null if unknown)
- `environment` (null if unknown)
- `dependencies` (empty array if unknown)
- `predictability`: `{ status, missing[] }`

## Evidence types
- `doc`: docs with `path` and optional `heading` or `contains`.
- `code`: implementation with `path` and `symbol`.
- `test`: tests with `path` and `symbol` or test name.
- `telemetry`: runtime output with `field`.
- `scope` (optional): `"left" | "right" | "bridge"` when the node is a bridge.

## Bridge nodes (cross-concept links)
Use `nodeType: "bridge"` when a node exists to connect two concepts and supply
evidence on both sides. Bridge nodes must include:
- `bridge.left`: node id on the left side.
- `bridge.right`: node id on the right side.
- `bridge.relation`: short phrase describing the linkage.
- `links` entries with `rel="see-also"` to both `bridge.left` and `bridge.right`.

Bridge evidence should include at least one `evidence` entry with `scope: "left"`
and one with `scope: "right"`.

## Template
```json
{
  "id": "casimir_pressure_parallel_plate_ideal",
  "title": "Casimir Pressure (Ideal Parallel Plates)",
  "summary": "Compute vacuum pressure between ideal plates using the T=0 model.",
  "tags": ["casimir", "pressure", "physics"],
  "nodeType": "derived",

  "inputs": [
    { "name": "gap_m", "unit": "m", "type": "float", "source": "node:tile-gap.output.gap_m" },
    { "name": "hbar", "unit": "J*s", "type": "float", "source": "constants:physics.hbar" },
    { "name": "c", "unit": "m/s", "type": "float", "source": "constants:physics.c" }
  ],

  "outputs": [
    { "name": "casimirPressure_Pa", "unit": "Pa", "type": "float", "path": "mechanical.casimirPressure_Pa" }
  ],

  "assumptions": [
    "parallel plates",
    "perfect conductors",
    "zero temperature approximation"
  ],

  "validity": {
    "gap_m": { "min": 1e-9, "max": 1e-6 },
    "notes": "Outside range, correction models required."
  },

  "deterministic": true,
  "tolerance": { "rel": 1e-9, "abs": 1e-6 },

  "dependencies": ["casimir-static-engine", "casimir-tile-mechanism"],
  "links": [
    { "rel": "depends-on", "to": "casimir-static-engine" }
  ],

  "predictability": {
    "status": "complete",
    "missing": []
  },

  "evidence": [
    {
      "type": "code",
      "path": "server/energy-pipeline.ts",
      "symbol": "casimirPressure_Pa",
      "locator": "exported_symbol"
    },
    {
      "type": "telemetry",
      "field": "mechanical.casimirPressure_Pa"
    },
    {
      "type": "doc",
      "path": "docs/guarded-casimir-tile-code-mapped.md",
      "heading": "2.1 Ideal parallel-plate Casimir energy and pressure"
    }
  ],

  "environment": {
    "runtime": "node",
    "runtime_version": ">=20",
    "lockfile": "package-lock.json"
  }
}
```

## Bridge template
```json
{
  "id": "casimir-natario-bridge",
  "title": "Casimir Lattice <-> Natario Zero-Expansion Bridge",
  "summary": "Connects Casimir lattice proxy inputs to Natario zero-expansion geometry.",
  "tags": ["casimir", "natario", "warp", "bridge"],
  "nodeType": "bridge",

  "bridge": {
    "left": "casimir-lattice",
    "right": "natario-zero-expansion",
    "relation": "Casimir lattice strobing relies on Natario zero-expansion geometry."
  },

  "links": [
    { "rel": "parent", "to": "warp-implementation-stack" },
    { "rel": "see-also", "to": "casimir-lattice" },
    { "rel": "see-also", "to": "natario-zero-expansion" }
  ],

  "evidence": [
    { "type": "doc", "path": "docs/knowledge/warp/casimir-lattice.md", "scope": "left" },
    { "type": "doc", "path": "docs/knowledge/warp/natario-zero-expansion.md", "scope": "right" }
  ]
}
```

## Notes
- Use `dependencies` for computational lineage; use `links` for navigation.
- Evidence should be reproducible and point to stable artifacts.
- If you add `repo_rev` or `content_hash`, keep them in evidence entries.
