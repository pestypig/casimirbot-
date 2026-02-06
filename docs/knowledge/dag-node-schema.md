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

## Evidence types
- `doc`: docs with `path` and optional `heading` or `contains`.
- `code`: implementation with `path` and `symbol`.
- `test`: tests with `path` and `symbol` or test name.
- `telemetry`: runtime output with `field`.

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

## Notes
- Use `dependencies` for computational lineage; use `links` for navigation.
- Evidence should be reproducible and point to stable artifacts.
- If you add `repo_rev` or `content_hash`, keep them in evidence entries.
