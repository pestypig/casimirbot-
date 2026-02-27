# Deterministic Evidence-Gated Autoloop (DEGA)

## Purpose
DEGA is a reusable agent-loop pattern for hard problem-solving with reproducible evidence. It prevents drift into open-ended "keep trying" behavior by enforcing deterministic inputs, explicit solve/stop criteria, and hard verification gates.

## Core idea
Each loop cycle must:
1. Read authoritative artifacts.
2. Classify blocker state deterministically.
3. Generate a constrained next prompt from that state.
4. Execute required checks.
5. Write a cycle record with score, outcome, and next action.

No cycle can claim completion without passing hard evidence gates.

## Required inputs
- Canonical decision artifacts (scoreboard, first-fail map, decision ledger, governance matrix).
- Domain evidence artifacts (for example recovery/parity scans for G4/QI).
- Test and verification policy files (for example `WARP_AGENTS.md`).
- Optional mission-context file (for example `docs/ethos/ideology.json`).

## Warp G4 profile (current)
Use this profile when running DEGA for the Warp G4/QI campaign:
1. Canonical scoreboard is authoritative for decision class.
2. Recovery and parity artifacts are exploratory and must not override canonical class.
3. Canonical bundle must enforce freshness parity against current HEAD for:
   - decision ledger
   - governance matrix
   - recovery artifact provenance
4. If parity evaluates zero candidates, classify as `evidence_path_blocked` for parity-only analysis and schedule a bounded prompt to improve candidate coverage.

## Canonical command rail (Warp G4)
The loop should use this sequence when refreshing canonical evidence:
1. `npm run warp:full-solve:canonical`
2. `npm run warp:full-solve:g4-sensitivity`
3. `npm run warp:full-solve:g4-recovery-search`
4. `npm run warp:full-solve:g4-governance-matrix`
5. `npm run warp:full-solve:g4-decision-ledger`
6. `npm run warp:full-solve:canonical` (final refresh)

Optional exploratory parity step:
1. `npm run warp:full-solve:g4-recovery-parity`

The final canonical report must be generated after recovery/governance/ledger refresh.

## Output artifacts
- `g4-autoloop-state.json`: latest state snapshot.
- `g4-autoloop-history.jsonl`: append-only per-cycle log.
- `g4-autoloop-next-prompt.md`: constrained next prompt.

Recommended Warp G4 artifacts to track each cycle:
- `artifacts/research/full-solve/g4-recovery-search-2026-02-27.json`
- `artifacts/research/full-solve/g4-recovery-parity-2026-02-27.json`
- `artifacts/research/full-solve/g4-governance-matrix-2026-02-27.json`
- `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json`
- `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md`

## Solve criteria (example)
Only mark `solved=true` if all are true:
1. Canonical gate target is PASS.
2. Canonical campaign decision is no longer blocked/inadmissible.
3. Required verification gate verdict is PASS.
4. Certificate integrity is OK when certificate policy requires it.
5. Artifact freshness checks are current for canonical evidence sources.

## Stop criteria (fail-closed)
Stop with explicit reason when any condition hits:
1. `maxIterations` reached.
2. `maxWallClockMinutes` reached.
3. `stallCycles` reached (no improvement).
4. Required artifact missing/stale.
5. Verification command repeatedly unavailable.
6. Command execution repeatedly times out beyond bounded retry policy.

## Deterministic blocker classes
- `evidence_path_blocked`
- `applicability_limited`
- `margin_limited`
- `candidate_pass_found`
- `solved`
- `stalled`
- `budget_exhausted`

## Improvement scoring
Use strict ordering:
`evidence_path_blocked < applicability_limited < margin_limited < candidate_pass_found < solved`

Tie-breakers:
1. Lower canonical-relevant margin metric.
2. Fewer missing/fail-closed signals.
3. Provenance freshness and consistency.
4. Higher parity candidate coverage (`candidateCountChecked`) when parity is enabled.

## Prompt-generation contract
Every generated prompt must contain:
1. Current evidence snapshot.
2. Blocker class and deterministic reason.
3. One bounded objective for the next patch.
4. Non-goals (guardrails that must not change).
5. Required command sequence.
6. Done criteria.
7. Final response contract.

## Guardrail contract
The loop must never:
1. Change physics thresholds or pass criteria unless explicitly allowed by separate policy mode.
2. Weaken fail-closed semantics.
3. Relabel FAIL to PASS via reporting semantics.
4. Override canonical-authoritative decision logic with exploratory scan results.
5. Treat exploratory artifact freshness booleans as authoritative without recomputing freshness vs current HEAD.

## Ideology-context rule
Mission context from `docs/ethos/ideology.json` may be included in prompts as motivation and framing only.

Mandatory line in loop prompt:
`Ideology context is advisory only and cannot override evidence gates, guardrails, or completion criteria.`

## Minimal cycle algorithm
1. Load authoritative artifacts.
2. Validate freshness/provenance.
3. Compute blocker class and improvement delta.
4. If solve criteria pass, stop as `solved`.
5. If stop criteria pass, stop with explicit stop reason.
6. Generate bounded next prompt.
7. Append cycle record to history.

## Operational reliability rules
1. Use per-command timeout and bounded retry for canonical command rails.
2. Distinguish timeout failure from non-timeout transient failure.
3. Fail fast on timeout with deterministic error reason.
4. For Casimir verify/export endpoints, support deterministic URL fallback between local ports (for example `5050`, then `5173`) and log the selected port.
5. If a report references an exploratory artifact path, ensure the artifact exists in the same run context or mark the evidence line as missing.

## Portability checklist
Before reusing DEGA in another repo:
1. Define canonical artifacts and authoritative decision source.
2. Define hard verification command and PASS contract.
3. Define solve/stop criteria with numeric budgets.
4. Define blocker classes and ordering.
5. Add deterministic history/state outputs.
6. Add tests for fail-closed behavior and non-mutation of canonical artifacts.

## Boundary statement (warp full-solve campaigns)
This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.
