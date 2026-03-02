# Warp Strong-Claim External-Closure Operation Plan (2026-03-02)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## 1) Current State (Commit-Pinned)

- Commit pin: `d36b7fa1de2ef0188e77ac16a79232228502c814`
- Evidence snapshot: `artifacts/research/full-solve/warp-evidence-snapshot-2026-03-02.json`
- Snapshot status: `blocked=false`, `strongClaimClosure.passAll=true`, `blockedSpecs=[]`
- Canonical campaign: `REDUCED_ORDER_ADMISSIBLE`, counts `PASS=8 FAIL=0 UNKNOWN=0 NOT_READY=0 NOT_APPLICABLE=1`
- Promotion readiness: `candidatePromotionReady=true`, `candidatePromotionStable=true`, `promotionLaneExecuted=true`
- Casimir verify gate (latest): `PASS`, `integrityOk=true`, certificate hash `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`

## 2) Objective

Move from strong internal computational closure to external-closure evidence quality for physics interpretation, without changing thresholds or weakening fail-closed policy.

## 3) Non-Negotiable Constraints

1. No threshold weakening (`FordRomanQI` semantics unchanged).
2. No relabeling of FAIL/UNKNOWN as PASS.
3. Claim tiers must remain explicit:
- `canonical-authoritative`
- `promoted-candidate`
- `exploratory`
4. Casimir verification is required for completion claims on each implementation wave.
5. Boundary statement must remain verbatim in artifacts/reports.

## 4) Workstreams and Acceptance Criteria

## WS-A: Operator Mapping External Closure

Goal: tighten mapping from repo evaluated quantity to the intended renormalized observable semantics.

Deliverables:
- `artifacts/research/full-solve/g4-operator-mapping-audit-2026-03-02.json`
- `docs/audits/research/warp-g4-operator-mapping-audit-2026-03-02.md`

Acceptance:
- deterministic mapping fields present and reproducible
- explicit assumptions and failure conditions emitted
- fail-closed when mapping prerequisites are missing or inconsistent

## WS-B: Kernel/K Provenance External Closure

Goal: demonstrate deterministic, replayable derivation/provenance for sampler and K usage in bound construction.

Deliverables:
- `artifacts/research/full-solve/g4-kernel-provenance-audit-2026-03-02.json`
- `docs/audits/research/warp-g4-kernel-provenance-audit-2026-03-02.md`

Acceptance:
- selected kernel identity + normalization explicitly emitted
- K provenance commit + derivation chain emitted
- deterministic recomputation checks pass
- fail-closed on mismatch or stale provenance

## WS-C: Curvature Applicability External Closure

Goal: ensure applicability regime is evidenced and fail-closed.

Deliverables:
- `artifacts/research/full-solve/g4-curvature-applicability-audit-2026-03-02.json`
- `docs/audits/research/warp-g4-curvature-applicability-audit-2026-03-02.md`

Acceptance:
- applicability inputs emitted per wave/candidate
- non-degenerate curvature/applicability diagnostics
- fail-closed when applicability evidence is missing/not-pass

## WS-D: Uncertainty Robustness External Closure

Goal: deterministic uncertainty budget and robust-pass adjudication semantics in artifacts.

Deliverables:
- `artifacts/research/full-solve/g4-uncertainty-audit-2026-03-02.json`
- `docs/audits/research/warp-g4-uncertainty-audit-2026-03-02.md`

Acceptance:
- uncertainty components explicitly emitted
- robust-pass criteria deterministic
- fail-closed when could-flip/insufficient evidence conditions are met

## WS-E: Cross-Literature Replay/Parity Harness

Goal: add benchmark-style parity checks that replay core bound semantics against declared assumptions.

Deliverables:
- parity test artifacts under `artifacts/research/full-solve/`
- parity report in `docs/audits/research/`

Acceptance:
- reproducible parity runs with fixed seeds/config
- explicit mismatch reasons when parity fails
- no policy gate changes required for parity reporting

## 5) Codex Execution Protocol (Wave-by-Wave)

For each wave:

1. Implement only the scoped workstream changes.
2. Run targeted tests for changed files.
3. Run required warp suite from `WARP_AGENTS.md`.
4. Run canonical bundle as needed for artifact refresh:
- `npm run warp:full-solve:canonical:bundle`
5. Run Casimir verification gate:
- `npm run casimir:verify -- --ci --url http://127.0.0.1:5050/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl`
6. Export training trace:
- `curl.exe -fsS http://127.0.0.1:5050/api/agi/training-trace/export -o artifacts/training-trace-export.jsonl`
7. Report strict output contract:
- exact files changed
- acceptance checklist pass/fail by workstream
- canonical decision/counts
- Casimir fields: verdict, firstFail, certificateHash, integrityOk, traceId, runId
- commit hash + push status

## 6) Definition of Done (External-Closure Phase)

This phase is complete when:

1. WS-A through WS-D all pass with deterministic artifacts and fail-closed behavior.
2. WS-E parity harness exists and reports deterministic pass/mismatch with explicit reasons.
3. Evidence snapshot remains `blocked=false` and `strongClaimClosure.passAll=true` after refresh.
4. Casimir verification remains PASS after each closure wave.

Note:
- Completion of this phase improves scientific defensibility of the reduced-order framework.
- It does not, by itself, override the campaign boundary statement or authorize physical-feasibility claims.

