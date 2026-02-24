# Warp Readiness Closure Blueprint R07 (2026-02-24)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Gate classifications (G0..G8)

| Gate | Classification | Rationale |
|---|---|---|
| G0 | timeout_dominated | Campaign viability depends on GR loop return; every profile timed out with no result payload. |
| G1 | signal_wiring_dominated | Initial solver status is missing because attempt payload is never persisted before timeout. |
| G2 | signal_wiring_dominated | Evaluation gate status is absent from attempts; this is a payload completeness contract issue. |
| G3 | signal_wiring_dominated | Certificate hash/integrity fields are absent when no evaluation payload lands. |
| G4 | signal_wiring_dominated | Hard-constraint map (`FordRomanQI`, `ThetaAudit`) cannot be extracted without complete evaluation output. |
| G5 | policy_not_applicable | Reduced-order campaign explicitly keeps physical-feasibility promotion gate non-applicable. |
| G6 | signal_wiring_dominated | Provenance contract (`observer/chart/normalization/unit_system`) remains missing in all waves. |
| G7 | timeout_dominated | Stability checks depend on >=2 completed runs; both runs timeout in C/D. |
| G8 | timeout_dominated | Replication parity in D requires completed replicated outputs; all replicated attempts timeout. |

## Top 5 blockers (producer -> consumer)
1. `scripts/warp-full-solve-campaign.ts::runGrAgentLoopIsolated` timeout watchdog preempts long GR loop completion -> `scripts/warp-full-solve-campaign.ts::runWave` records `attemptCount=0` and `state=error/timeout`.
2. `server/gr/gr-agent-loop.ts::runGrAgentLoop` does not return minimal attempt payload before timeout -> `scripts/warp-full-solve-single-runner.ts` writes `{ error: "*_timeout:*" }` only.
3. `server/gr/gr-evaluation.ts::runGrEvaluation` gate/certificate/constraint fields not guaranteed in early/partial path -> `scripts/warp-full-solve-campaign.ts::buildGateMap` marks G2/G3/G4 `NOT_READY`.
4. `scripts/warp-full-solve-campaign.ts::collectRequiredSignals` strict provenance requirements not fully sourced from current attempt contract -> G6 remains `NOT_READY` even when other fields might later pass.
5. `scripts/warp-full-solve-campaign.ts::buildGateMap` wave policy handling for G7/G8 depends on completed artifacts; timeout fallback path degrades both gates to `NOT_READY` with no differentiator for applicability vs execution failure.

## Minimal closure plan
1. Add fast-return attempt skeleton from `runGrAgentLoop` (initial status + placeholders + provenance baseline) within per-attempt budget.
2. Ensure `runGrEvaluation` always emits gate status + certificate hash/integrity + hard-constraint map (possibly UNKNOWN/FAIL-closed, but present).
3. In campaign runner, preserve partial attempt artifacts on timeout and use them to compute G1..G6 deterministically.
4. Explicitly encode G7/G8 non-applicable semantics for waves that do not meet policy preconditions independent of timeout path.
5. Tighten `collectRequiredSignals` to consume standardized provenance keys emitted by GR attempt payload.

## Acceptance target
- Under relaxed profile (`--wave-timeout-ms 20000`), at least one run per wave emits `result` with `attemptCount>=1`.
- G1/G2/G3/G4/G6 transition from blanket `NOT_READY` to signal-driven PASS/FAIL/UNKNOWN.
- G7/G8 distinguish policy non-applicability from runtime timeout unambiguously.
