# Warp Gates Executive Translation (2026-02-24)

## Why this file exists
The campaign artifacts are intentionally machine-readable. This file translates them into plain English for operator, stakeholder, and deck usage.

Boundary statement:
"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Current campaign state (plain English)
- Decision: `NOT_READY`
- Counts: `PASS=0`, `FAIL=0`, `UNKNOWN=0`, `NOT_READY=8`, `NOT_APPLICABLE=1`
- First blocking gate: `G0` (all waves `A/B/C/D`)

Meaning:
- The system is fail-closing correctly.
- We do not currently have enough evaluator-ready evidence in-wave to promote beyond reduced-order readiness.
- This is a data/completeness block, not a hidden pass/fail contradiction.

## Gate dictionary (G0..G8)
- `G0` Run Artifact Presence:
  Confirms a usable GR loop run artifact exists for the wave.
- `G1` Initial Solver Status:
  Checks that the initial-data solve status is present and acceptable.
- `G2` Evaluation Gate Status:
  Checks that the evaluator emitted a recognized pass/fail gate status.
- `G3` Certificate + Integrity:
  Checks certificate presence and integrity metadata.
- `G4` Hard Constraint Pair:
  Checks required hard constraints (`FordRomanQI`, `ThetaAudit`) are present and evaluated.
- `G5` Physical Feasibility Promotion:
  Marked `NOT_APPLICABLE` in this reduced-order campaign by policy.
- `G6` Evidence Persistence:
  Confirms persisted raw artifacts and evaluator-signal completeness relation.
- `G7` Stability Across Repeats:
  Compares repeated-run gate outcomes for consistency where applicable.
- `G8` Replication Parity:
  Compares repeated-run constraint payloads for drift where applicable.

## Status terms
- `PASS`: Gate evaluated and satisfied.
- `FAIL`: Gate evaluated and violated.
- `NOT_READY`: Required evidence/signals missing; fail-closed.
- `NOT_APPLICABLE`: Out of scope by campaign policy.
- `UNKNOWN`: Evidence present but could not be classified deterministically.

## How to read the three core JSON files
- `campaign-gate-scoreboard-2026-02-24.json`:
  Current campaign decision and gate totals.
- `campaign-first-fail-map-2026-02-24.json`:
  Earliest blocking gate globally and per-wave.
- `campaign-action-plan-30-60-90-2026-02-24.json`:
  Ranked blocker list and remediation sequence.

## What this implies right now
- We are in a credible reporting posture for reduced-order governance.
- We are not in a physical-feasibility posture.
- The immediate engineering target is closing `NOT_READY` evidence paths (starting with `G0/G1/G2/G3/G4`).

## Build-more priorities (ordered)
1. Increase in-wave evaluator signal availability so `G0-G4` can evaluate with real payloads.
2. Keep strict fail-closed provenance requirements (`chart/observer/normalization/unit system`).
3. Preserve bounded execution while capturing more usable attempts per wave.
4. Re-run publication bundle and ensure checksum manifest remains deterministic.

## Deck-safe summary line
"The campaign pipeline is functioning as designed: it is reproducible, bounded, and fail-closed. Current output is `NOT_READY` because required evaluator evidence is incomplete, not because the system is hiding failed hard-gate results."
