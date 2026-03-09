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

## 7) Full-solve reference capsule workflow

For manuscript/governance runs, regenerate and validate the commit-pinned full-solve capsule:

```bash
npm run warp:full-solve:reference:refresh
```

Outputs:
- `artifacts/research/full-solve/full-solve-reference-capsule-YYYY-MM-DD.json`
- `docs/audits/research/warp-full-solve-reference-capsule-YYYY-MM-DD.md`
- Stable aliases:
  - `artifacts/research/full-solve/full-solve-reference-capsule-latest.json`
  - `docs/audits/research/warp-full-solve-reference-capsule-latest.md`

Validation-only run:

```bash
npm run warp:full-solve:reference:validate -- --capsule artifacts/research/full-solve/full-solve-reference-capsule-latest.json
```

Use the `latest` capsule paths as default citation anchors in paper-generation prompts.

## 8) Integrity parity suite workflow (default pre-paper/pre-claim)

Run the integrity parity suite before drafting or updating claim language:

```bash
npm run warp:integrity:check
```

This executes, in order:
1. canonical bundle + reconciliation,
2. geometry conformance,
3. external-work refresh/matrix,
4. Mercury observable replay/compare (`EXT-GR-MERC-001`),
5. reference capsule generation + validation,
6. Casimir verify + trace export.

Outputs:
- `artifacts/research/full-solve/integrity-parity-suite-YYYY-MM-DD.json`
- `docs/audits/research/warp-integrity-parity-suite-YYYY-MM-DD.md`
- Stable aliases:
  - `artifacts/research/full-solve/integrity-parity-suite-latest.json`
  - `docs/audits/research/warp-integrity-parity-suite-latest.md`

Policy:
- parity suite is `reference_only` and non-blocking for canonical policy changes,
- external non-comparable works remain `inconclusive` with explicit reason codes.

## 9) External-work comparison workflow

For external paper/model comparison against local full-solve reference, run:

```bash
npm run warp:external:refresh
```

This executes, in order:
1. external profile contract validation,
2. per-work dual-track runs (mirror + method where available),
3. per-work local-reference comparisons,
4. master external comparison matrix generation,
5. capsule regeneration + capsule validation.

Operator add/update flow:
1. Add or edit one profile in `configs/warp-external-work-profiles.v1.json` with:
   - `work_id`, `source_refs`, `chain_ids`, `comparison_keys`,
   - mirror/method track contract fields,
   - `posture.reference_only=true`, `posture.canonical_blocking=false`.
2. Ensure snapshot-first inputs exist for that profile:
   - scenario packs and checker scripts for mirror track,
   - replay script + input snapshots for method track.
3. Validate profile contract:

```bash
npm run warp:external:profiles:validate
```

4. Run profile-only refresh (optional during iteration):

```bash
npm run warp:external:run -- --work-id <WORK_ID>
npm run warp:external:compare -- --work-id <WORK_ID>
npm run warp:external:matrix
```

5. Run full refresh + capsule inclusion check:

```bash
npm run warp:external:refresh
```

6. Confirm `external_work_comparison` block is present and valid in:
   - `artifacts/research/full-solve/full-solve-reference-capsule-latest.json`
   - `docs/audits/research/warp-full-solve-reference-capsule-latest.md`

Target artifacts:
- `artifacts/research/full-solve/external-work/external-work-run-<work_id>-latest.json`
- `artifacts/research/full-solve/external-work/external-work-compare-<work_id>-latest.json`
- `artifacts/research/full-solve/external-work/external-work-comparison-matrix-latest.json`

Policy:
- external-work outputs remain `reference_only` overlays,
- canonical decisions are not overridden.

## 10) Promotion-readiness bridge workflow

Before upgrading manuscript language from integrity parity to stronger readiness framing, run:

```bash
npm run warp:promotion:readiness:check
```

Outputs:
- `artifacts/research/full-solve/promotion-readiness-suite-YYYY-MM-DD.json`
- `docs/audits/research/warp-promotion-readiness-suite-YYYY-MM-DD.md`
- Stable aliases:
  - `artifacts/research/full-solve/promotion-readiness-suite-latest.json`
  - `docs/audits/research/warp-promotion-readiness-suite-latest.md`

Policy:
- readiness suite is `reference_only` and non-blocking for canonical decisions,
- measured uncertainty anchors are required for reportable lane readiness,
- blocked lanes remain explicit with deterministic blocker codes.
