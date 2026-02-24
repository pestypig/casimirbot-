# Warp Timeout Forensics R07 (2026-02-24)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Command-backed execution log
- strict: `npm run warp:full-solve:campaign -- --wave all --ci --wave-timeout-ms 4000 --campaign-timeout-ms 15000 --out artifacts/research/full-solve/profiles/r07-strict` (exit 0).
- relaxed: `npm run warp:full-solve:campaign -- --wave all --ci --wave-timeout-ms 20000 --campaign-timeout-ms 120000 --out artifacts/research/full-solve/profiles/r07-relaxed` (exit 0).
- extended: `npm run warp:full-solve:campaign -- --wave all --ci --wave-timeout-ms 60000 --campaign-timeout-ms 300000 --out artifacts/research/full-solve/profiles/r07-extended` (exit 0).

## Profile comparison (strict vs relaxed vs extended)
| Profile | Decision | PASS | FAIL | UNKNOWN | NOT_READY | NOT_APPLICABLE |
|---|---:|---:|---:|---:|---:|---:|
| strict | NOT_READY | 0 | 0 | 0 | 8 | 1 |
| relaxed | NOT_READY | 0 | 0 | 0 | 8 | 1 |
| extended | NOT_READY | 0 | 0 | 0 | 8 | 1 |

### Per-gate status deltas (vs strict)
| Gate | strict | relaxed | extended |
|---|---|---|---|
| G0 | NOT_READY | NOT_READY | NOT_READY |
| G1 | NOT_READY | NOT_READY | NOT_READY |
| G2 | NOT_READY | NOT_READY | NOT_READY |
| G3 | NOT_READY | NOT_READY | NOT_READY |
| G4 | NOT_READY | NOT_READY | NOT_READY |
| G5 | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE |
| G6 | NOT_READY | NOT_READY | NOT_READY |
| G7 | NOT_READY | NOT_READY | NOT_READY |
| G8 | NOT_READY | NOT_READY | NOT_READY |

## Mandatory forensic extraction by profile/wave
### strict
| Wave | gateStatus(G0..G8) | firstFail | missingSignals | runArtifacts(attemptCount/state) | runErrors | timeout.kind | timeout.timeoutMs | timeout.elapsedMs | run-1-raw-output.json |
|---|---|---|---|---|---|---|---:|---:|---|
| A | G0:NOT_READY, G1:NOT_READY, G2:NOT_READY, G3:NOT_READY, G4:NOT_READY, G5:NOT_APPLICABLE, G6:NOT_READY, G7:NOT_READY, G8:NOT_READY | G0 | certificate_hash, certificate_integrity, evaluation_gate_status, hard_constraint_ford_roman_qi, hard_constraint_theta_audit, initial_solver_status, provenance_chart, provenance_normalization, provenance_observer, provenance_unit_system | r1:0/error | wave_timeout:4000 | wave_timeout | 4000 | 4158 | error |
| B | G0:NOT_READY, G1:NOT_READY, G2:NOT_READY, G3:NOT_READY, G4:NOT_READY, G5:NOT_APPLICABLE, G6:NOT_READY, G7:NOT_READY, G8:NOT_READY | G0 | certificate_hash, certificate_integrity, evaluation_gate_status, hard_constraint_ford_roman_qi, hard_constraint_theta_audit, initial_solver_status, provenance_chart, provenance_normalization, provenance_observer, provenance_unit_system | r1:0/error | wave_timeout:4000 | wave_timeout | 4000 | 4125 | error |
| C | G0:NOT_READY, G1:NOT_READY, G2:NOT_READY, G3:NOT_READY, G4:NOT_READY, G5:NOT_APPLICABLE, G6:NOT_READY, G7:NOT_READY, G8:NOT_READY | G0 | certificate_hash, certificate_integrity, evaluation_gate_status, hard_constraint_ford_roman_qi, hard_constraint_theta_audit, initial_solver_status, provenance_chart, provenance_normalization, provenance_observer, provenance_unit_system | r1:0/error, r2:0/timeout | wave_timeout:4000, wave_timeout:4000 | wave_timeout | 4000 | 4124 | error |
| D | G0:NOT_READY, G1:NOT_READY, G2:NOT_READY, G3:NOT_READY, G4:NOT_READY, G5:NOT_APPLICABLE, G6:NOT_READY, G7:NOT_READY, G8:NOT_READY | G0 | certificate_hash, certificate_integrity, evaluation_gate_status, hard_constraint_ford_roman_qi, hard_constraint_theta_audit, initial_solver_status, provenance_chart, provenance_normalization, provenance_observer, provenance_unit_system | r1:0/error, r2:0/timeout | campaign_timeout:2530, campaign_timeout:2530 | campaign_timeout | 15000 | 15124 | error |

### relaxed
| Wave | gateStatus(G0..G8) | firstFail | missingSignals | runArtifacts(attemptCount/state) | runErrors | timeout.kind | timeout.timeoutMs | timeout.elapsedMs | run-1-raw-output.json |
|---|---|---|---|---|---|---|---:|---:|---|
| A | G0:NOT_READY, G1:NOT_READY, G2:NOT_READY, G3:NOT_READY, G4:NOT_READY, G5:NOT_APPLICABLE, G6:NOT_READY, G7:NOT_READY, G8:NOT_READY | G0 | certificate_hash, certificate_integrity, evaluation_gate_status, hard_constraint_ford_roman_qi, hard_constraint_theta_audit, initial_solver_status, provenance_chart, provenance_normalization, provenance_observer, provenance_unit_system | r1:0/error | wave_timeout:20000 | wave_timeout | 20000 | 20134 | error |
| B | G0:NOT_READY, G1:NOT_READY, G2:NOT_READY, G3:NOT_READY, G4:NOT_READY, G5:NOT_APPLICABLE, G6:NOT_READY, G7:NOT_READY, G8:NOT_READY | G0 | certificate_hash, certificate_integrity, evaluation_gate_status, hard_constraint_ford_roman_qi, hard_constraint_theta_audit, initial_solver_status, provenance_chart, provenance_normalization, provenance_observer, provenance_unit_system | r1:0/error | wave_timeout:20000 | wave_timeout | 20000 | 20150 | error |
| C | G0:NOT_READY, G1:NOT_READY, G2:NOT_READY, G3:NOT_READY, G4:NOT_READY, G5:NOT_APPLICABLE, G6:NOT_READY, G7:NOT_READY, G8:NOT_READY | G0 | certificate_hash, certificate_integrity, evaluation_gate_status, hard_constraint_ford_roman_qi, hard_constraint_theta_audit, initial_solver_status, provenance_chart, provenance_normalization, provenance_observer, provenance_unit_system | r1:0/error, r2:0/timeout | wave_timeout:20000, wave_timeout:20000 | wave_timeout | 20000 | 20147 | error |
| D | G0:NOT_READY, G1:NOT_READY, G2:NOT_READY, G3:NOT_READY, G4:NOT_READY, G5:NOT_APPLICABLE, G6:NOT_READY, G7:NOT_READY, G8:NOT_READY | G0 | certificate_hash, certificate_integrity, evaluation_gate_status, hard_constraint_ford_roman_qi, hard_constraint_theta_audit, initial_solver_status, provenance_chart, provenance_normalization, provenance_observer, provenance_unit_system | r1:0/error, r2:0/timeout | wave_timeout:20000, wave_timeout:20000 | wave_timeout | 20000 | 20144 | error |

### extended
| Wave | gateStatus(G0..G8) | firstFail | missingSignals | runArtifacts(attemptCount/state) | runErrors | timeout.kind | timeout.timeoutMs | timeout.elapsedMs | run-1-raw-output.json |
|---|---|---|---|---|---|---|---:|---:|---|
| A | G0:NOT_READY, G1:NOT_READY, G2:NOT_READY, G3:NOT_READY, G4:NOT_READY, G5:NOT_APPLICABLE, G6:NOT_READY, G7:NOT_READY, G8:NOT_READY | G0 | certificate_hash, certificate_integrity, evaluation_gate_status, hard_constraint_ford_roman_qi, hard_constraint_theta_audit, initial_solver_status, provenance_chart, provenance_normalization, provenance_observer, provenance_unit_system | r1:0/error | wave_timeout:60000 | wave_timeout | 60000 | 60167 | error |
| B | G0:NOT_READY, G1:NOT_READY, G2:NOT_READY, G3:NOT_READY, G4:NOT_READY, G5:NOT_APPLICABLE, G6:NOT_READY, G7:NOT_READY, G8:NOT_READY | G0 | certificate_hash, certificate_integrity, evaluation_gate_status, hard_constraint_ford_roman_qi, hard_constraint_theta_audit, initial_solver_status, provenance_chart, provenance_normalization, provenance_observer, provenance_unit_system | r1:0/error | wave_timeout:60000 | wave_timeout | 60000 | 60188 | error |
| C | G0:NOT_READY, G1:NOT_READY, G2:NOT_READY, G3:NOT_READY, G4:NOT_READY, G5:NOT_APPLICABLE, G6:NOT_READY, G7:NOT_READY, G8:NOT_READY | G0 | certificate_hash, certificate_integrity, evaluation_gate_status, hard_constraint_ford_roman_qi, hard_constraint_theta_audit, initial_solver_status, provenance_chart, provenance_normalization, provenance_observer, provenance_unit_system | r1:0/error, r2:0/timeout | wave_timeout:60000, wave_timeout:60000 | wave_timeout | 60000 | 60199 | error |
| D | G0:NOT_READY, G1:NOT_READY, G2:NOT_READY, G3:NOT_READY, G4:NOT_READY, G5:NOT_APPLICABLE, G6:NOT_READY, G7:NOT_READY, G8:NOT_READY | G0 | certificate_hash, certificate_integrity, evaluation_gate_status, hard_constraint_ford_roman_qi, hard_constraint_theta_audit, initial_solver_status, provenance_chart, provenance_normalization, provenance_observer, provenance_unit_system | r1:0/error, r2:0/timeout | wave_timeout:60000, wave_timeout:60000 | wave_timeout | 60000 | 60185 | error |

## Root-cause finding (non-placeholder)
1. `run-1-raw-output.json` contains only timeout errors and no `result` in all 12 profile/wave runs, so `runGrAgentLoop` never returns an attempt payload before the watchdog deadline.
2. `runArtifacts[*].attemptCount` is always `0`, which drives gates G0..G4 and G6 into missing-signal `NOT_READY` through `buildGateMap` and `collectRequiredSignals`.
3. Increasing wave timeout from 4s -> 20s -> 60s does not change any gate status; the bottleneck is upstream completion latency + payload closure, not scoreboard logic.
4. Wave D under strict profile shows campaign timeout (`campaign_timeout:2530`) because remaining campaign budget is lower than per-wave budget after prior wave overruns.

## Command failures and retries
- Failed command: `for p in strict relaxed extended; do for w in A B C D; do echo "## $p/$w"; jq '{ok,error:(.error.message // .error),hasResult:has("result")}' artifacts/research/full-solve/profiles/r07-$p/$w/run-1-raw-output.json; done; done`
  - exit code: `5`
  - stderr excerpt: `jq: error ... Cannot index string with string "message"`
  - retry: replaced query with `jq '{ok,hasResult:has("result"),hasError:has("error"),error:.error}' ...` and succeeded (exit 0).


## Required checks executed
- `npx vitest run tests/warp-full-solve-campaign.spec.ts tests/warp-publication-bundle.spec.ts tests/gr-agent-loop.spec.ts tests/gr-constraint-contract.spec.ts` -> exit 1 (publication-bundle fixtures missing in `artifacts/research/full-solve/B|C|D`); retry produced same failure.
- `npm run warp:ultimate:check` -> exit 0.
- `npm run warp:evidence:pack` -> exit 0.
- `npm run warp:publication:bundle` -> exit 1 (same missing full-solve fixture set); retry produced same failure.

## Casimir verification
- Command: `npm run casimir:verify -- --ci --url http://127.0.0.1:5173/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl`.
- Verdict: `PASS`
- firstFail: `null`
- certificateHash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- integrityOk: `true`
- traceId: `adapter:b84ffbf3-53ea-4c68-90f0-e866c8bdaa86`
- runId: `1`
- Trace export command: `curl -fsS http://127.0.0.1:5173/api/agi/training-trace/export -o artifacts/training-trace-export.jsonl` (exit 0).
