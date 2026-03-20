# Warp Feasibility Bridge Plan (2026-03-20)

`This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.`

## Purpose

This plan defines the highest-leverage path from the current NHM2 state of record to a stronger, measurement-led readiness posture without changing canonical solver thresholds or weakening fail-closed policy.

This is not a feasibility declaration plan.

It is a closure plan for:

1. measurement blockers,
2. reproducibility blockers,
3. promotion-readiness blockers,
4. eventual criteria for a bounded physical-feasibility hypothesis.

## Current grounded state

1. Canonical reduced-order status is stable enough to support methods/governance claims.
2. Integrity parity is passing.
3. Promotion readiness is still partial.
4. The dominant immediate blocker is `sem_ellipsometry`.
5. The dominant reproducibility blocker is cross-artifact commit-pin inconsistency and incomplete machine-anchor publication.

## Immediate goals

1. Remove the `sem_ellipsometry` reportable blocker.
2. Regenerate one coherent commit-pinned state-of-record chain.
3. Eliminate bundle-level missing required machine anchors.
4. Freeze one promotion-readiness packet suitable for manuscript-safe status claims.

## Workstream 1: SEM+Ellipsometry Closure

### Objective

Remove:

- `missing_covariance_uncertainty_anchor`
- `missing_paired_dual_instrument_run`

### Required inputs

1. Real paired SEM and ellipsometry instrument exports.
2. Pairing manifest with run identifiers and provenance.
3. Covariance-aware uncertainty budget.
4. Calibration references already tracked in the repo.

### Execution commands

```bash
npm run warp:shadow:se-paired-evidence:prepare-manifest
npm run warp:shadow:se-paired-evidence:ingest
npm run warp:shadow:se-paired-evidence:validate
npm run warp:shadow:se-reportable:attempt
npm run warp:promotion:readiness:check
```

### Success criteria

1. `sem_ellipsometry.reportable_ready=true`
2. blocked reasons removed from readiness output
3. reportable run/check artifacts emitted
4. repeated run yields stable summary class and blocker-free result

### Falsifier

If a refreshed readiness suite still reports either blocked reason, SEM+ellipsometry remains non-reportable and no stronger measurement-backed claim may be made from that lane.

## Workstream 2: Commit-Pin Reconciliation

### Objective

Produce one coherent reference chain in which capsule/parity/readiness/external outputs agree on source state.

### Execution commands

```bash
npm run warp:full-solve:reference:refresh
npm run warp:external:refresh
npm run warp:integrity:check
npm run warp:promotion:readiness:check
```

### Success criteria

1. no `commit_pin_mismatch_*` blockers in reference capsule
2. refreshed latest artifacts point to the same run window
3. integrity and readiness artifacts remain policy-consistent

### Falsifier

If regenerated artifacts continue to disagree on source commit lineage, they cannot be treated as a single promotable state-of-record packet.

## Workstream 3: Machine-Anchor Publication Closure

### Objective

Make the proof-index machine anchors actually available and bundle-complete.

### Execution commands

```bash
npm run warp:deliverable:build
npm run warp:deliverable:bundle -- --strict-missing
```

### Success criteria

1. bundle `missing_count=0`
2. required machine anchors exist at proof-index paths
3. strict bundle mode exits successfully

### Falsifier

If strict bundle mode still reports missing anchors, promotion-tier claims that depend on those anchors remain fail-closed.

## Workstream 4: Promotion-Readiness Packet Freeze

### Objective

Create one manuscript-safe packet for "what is reportable now" and "what is still blocked."

### Packet contents

1. proof-anchor index
2. reference capsule
3. integrity parity suite
4. promotion readiness suite
5. deliverable dossier
6. deliverable bundle manifest

### Success criteria

1. every packet artifact is commit-pinned
2. packet references resolve cleanly
3. checksum-bearing artifacts are internally consistent

## Progression Ladder Toward a Physical-Feasibility Claim

This is a gated ladder. Each tier must be satisfied before the next tier is discussed in manuscript language.

### Tier A: Current position

Reduced-order admissibility plus governance and parity integrity.

Allowed statement:

"The framework is methodologically consistent under its declared assumptions."

### Tier B: Full reportable lane closure

Requirement:

All critical evidence lanes are reportable-ready with measured uncertainty, covariance where required, and deterministic replay.

### Tier C: Source-physics plausibility closure

Requirement:

Measured source magnitudes, durations, control windows, and spatial envelopes remain within preregistered bounds that do not force policy placeholders or hidden uplift assumptions.

### Tier D: Predictive holdout success

Requirement:

Preregistered predictions on unseen or withheld observational/measurement inputs pass declared tolerances.

### Tier E: Bounded feasibility hypothesis

Requirement:

1. all HARD constraints pass,
2. no unresolved critical blocker taxonomy remains,
3. independent replication-grade evidence exists,
4. wording remains assumption-bounded and provisional.

### Hard stop

If measured source terms remain orders of magnitude below required envelopes, the correct scientific action is rejection or narrowing of the feasibility hypothesis, not narrative stretching.

## Near-term execution order

1. Run SEM paired-run closure on real exports.
2. Rebuild reference/parity/readiness at one commit lineage.
3. Run strict deliverable bundle and require zero missing anchors.
4. Freeze promotion-readiness packet.
5. Re-run certification gate.

## Final verification gate

```bash
npm run casimir:verify -- --ci --url http://127.0.0.1:5050/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl
curl.exe -fsS http://127.0.0.1:5050/api/agi/training-trace/export -o artifacts/training-trace-export.jsonl
```

## Exit condition for this plan

This plan is complete when all of the following are true:

1. `sem_ellipsometry` is reportable-ready
2. commit-pin mismatch blockers are gone
3. strict deliverable bundle passes with zero missing anchors
4. promotion-readiness packet is frozen and manuscript-safe
5. Casimir verify remains `PASS` with integrity OK
