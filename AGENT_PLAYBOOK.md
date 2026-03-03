# Agent Playbook (Warp/G4 Investigation)

This playbook forces deterministic investigation before any new patch in warp/G4 debugging.

## 1) Load repo constraints first

1. Read `AGENTS.md` and `WARP_AGENTS.md`.
2. Keep the strict tree/DAG walk defaults from `docs/warp-tree-dag-walk-config.json`:
   - `allowedCL=CL4`
   - `allowConceptual=false`
   - `allowProxies=false`
   - `chart=comoving_cartesian`
   - `seedOrder=lex`
   - `walkMode=bfs`


## 2) Mandatory Atlas retrieval flow before edits (repo-wide indexed tasks)

For any task that maps to indexed repository content (server, client, scripts, docs,
warp/GR, Helix Ask, mission-control, voice), run this sequence before making edits:

```bash
npm run atlas:build
npm run atlas:why -- <identifier>
npm run atlas:trace -- <identifier> --upstream
```

If a canonical/recovery route exists for the task, also run first divergence:

```bash
npm run atlas:first-divergence -- <canonical.json> <recovery.json> --selector same-rho-source
```

Capture the Atlas evidence (identifier(s), traced paths, and divergence stage when present)
in your task notes before patching.

## 3) Run first-divergence before patching

Use the canonical wave and one recovery case, then patch only the first stage that diverges.

```bash
npm run warp:full-solve:g4-first-divergence -- --canonical-wave A
```

Output artifacts:

- `artifacts/research/full-solve/g4-first-divergence-YYYY-MM-DD.json`
- `docs/audits/research/warp-g4-first-divergence-YYYY-MM-DD.md`

Stage chain used by the report:

- `S0_source` -> `S1_qi_sample` -> `S2_bound_computed` -> `S3_bound_policy` -> `S4_margin` -> `S5_gate`

## 4) Measure cause surfaces (no guessing)

Run elasticity/influence and decomposition diagnostics before changing model semantics.

```bash
npm run warp:full-solve:g4-sensitivity
npm run warp:full-solve:g4-coupling-localization
npm run warp:full-solve:g4-metric-decomp-diff
```

Expected behavior:

1. Use influence/elasticity ranking to identify dominant families.
2. If source-family terms dominate (`rhoSource`, `warpFieldType`, `metricT00*`), patch source path first.
3. If policy terms dominate (`bound*`, floor flags), patch policy selector first.
4. If coupling terms dominate (`rhoMetric_Jm3`, `rhoProxy_Jm3`, `rhoCoupledShadow_Jm3`), patch bridge mapping first.

## 5) Patch discipline

1. Patch exactly one stage per cycle.
2. Re-run first-divergence + diagnostics.
3. Stop widening scope until the first divergent stage is cleared.

## 6) Completion gate (mandatory)

Any code/config patch must finish with:

1. Required test evidence for touched surfaces.
2. Casimir verification gate PASS (`POST /api/agi/adapter/run` via `npm run casimir:verify`).
3. Report verdict, first failing hard constraint (if any), certificate hash, and certificate integrity status.
