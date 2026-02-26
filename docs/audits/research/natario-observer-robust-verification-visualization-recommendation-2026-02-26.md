HEAD=d1c6a0db8132300f12672f749098e49896d92cc2
Date=2026-02-26 (America/New_York)

# Natario Observer-Robust Verification and Visualization Recommendation (2026-02-26)

## Scope

This memo answers three execution questions for the Natario observer-robust pipeline:
1. Should we lock a report in markdown now?
2. Should we import the external warp repo cited by the research?
3. Should we build a visualizer from the cited methods?

## Executive decisions

1. **Markdown report now: YES (required).**
- Treat this file as the canonical decision and evidence artifact.
- Keep claims at reduced-order/diagnostic maturity unless certified policy gates pass.

2. **Import cited warp repo wholesale: NO (not yet).**
- Use it as an algorithm reference first.
- If needed, vendor only narrow components behind adapters, pinned to commit + license check + parity tests.

3. **Build visualizer from cited methods: YES (phased).**
- Start with current server outputs and add robust overlays now.
- Defer expensive/full autodiff curvature rendering to later phase after parity and performance gates.

## Why this is the right path

- We already have a stress-energy brick path and Natario diagnostics in production routes.
- We now have observer-robust condition diagnostics in brick stats, which is enough to drive high-value viewer overlays immediately.
- Pulling an external repo before interface pinning and parity tests increases integration and provenance risk.

## Current implementation status in this repo

Implemented in this lane:
- `server/stress-energy-brick.ts`
  - Added `stats.observerRobust` for `NEC/WEC/SEC/DEC` with:
    - Eulerian and robust margins
    - missed violation and severity deltas
    - worst-case direction and rapidity metadata
    - Type-I algebraic slack path + capped-search fallback
- `server/helix-core.ts`
  - Added query threading for:
    - `observerRapidityCap`
    - `observerTypeITolerance`
- `client/src/lib/stress-energy-brick.ts`
  - Added types and normalizers for `observerRobust` diagnostics.
- `tests/stress-energy-brick.spec.ts`
  - Added invariants for robust margin ordering and consistency.

## External repo policy (recommended)

Do this before any import:
- Record repository URL, license, and exact commit hash in this doc.
- Define adapter boundary:
  - Input contract: metric/stress-energy fields expected
  - Output contract: robust margin fields and metadata
- Add parity tests against current implementation for at least:
  - margin sign consistency
  - worst-case direction stability
  - Type-I fallback behavior
- Vendor only minimal module subset after parity passes.

Do not do yet:
- Do not wire external runtime as first-class production dependency.
- Do not replace existing verification endpoints until parity is proven.

## Visualizer plan (recommended)

### Phase 1 (now, low risk)
- Add UI panels for:
  - Eulerian vs robust margin maps
  - missed-violation mask
  - severity delta map
  - worst-case direction overlay
- Surface metadata:
  - rapidity cap
  - Type-I fraction
  - source type (`algebraic_type_i` vs `capped_search`)

### Phase 2 (next)
- Add slice/volume controls for condition selection (`NEC/WEC/SEC/DEC`).
- Add trend comparison across parameter sweeps and wall regularization settings.

### Phase 3 (later)
- Evaluate differentiable metric/autodiff path as separate compute lane.
- Gate promotion on reproducibility, performance budget, and parity tests.

## Maturity and claim discipline

- Keep this lane at reduced-order/diagnostic claims unless certified gate outputs explicitly support stronger claims.
- Treat rapidity-capped minima as diagnostics, not invariant infima.
- Distinguish cap-independent algebraic Type-I slack from capped search outputs in all UI labels.

## Verification evidence for this patch

### Required checks
- `npm run math:report` -> PASS
- `npm run math:validate` -> PASS
- WARP_AGENTS required tests (18 files, 134 tests) -> PASS

### Casimir verification gate (required)
- Command:
  - `npm run casimir:verify -- --ci --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl`
- Result:
  - `verdict=PASS`
  - `firstFail=null`
  - `deltas=[]`
  - `certificateHash=6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
  - `integrityOk=true`
  - `certificateId=constraint-pack:repo-convergence:6e84f965957f`
  - `traceId=adapter:e290258f-8d13-431a-9f55-c20fab0b9e7c`
  - `runId=21204`

## Immediate next actions

1. Wire `stats.observerRobust` into the main visualization panel as a selectable volume/overlay source.
2. Add a compact viewer legend showing cap metadata and source semantics.
3. Create a parity checklist template for any future external repo import.
