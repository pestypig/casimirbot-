# Helix Ask Dottie Grounding Build Execution Report (2026-03-03)

## Prompt-by-prompt status table

| prompt_id | status | files_changed | behavior_delta | tests_or_checks_run | casimir_verdict | casimir_firstFail | casimir_certificateHash | casimir_integrityOk | casimir_traceId | casimir_runId | commit_sha |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Prompt 0 - baseline/instrumentation lock | done | `reports/helix-ask-dottie-grounding-baseline-scorecard-2026-03-03.json` | Baseline scorecard artifact added; no synthesis semantic change. | `npx tsx scripts/helix-ask-regression.ts` | PASS | null | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true | `adapter:b06e0d25-a941-465f-a1e9-5111e2276a5e` | `48` | b7bfd11 |
| Prompt 1 - arbiter + Dottie soft signal | done | `server/services/helix-ask/arbiter.ts`, `server/routes/agi.plan.ts` | Added soft Dottie arbiter signal and deterministic `mode_rationale` + `dottie_signal_applied` debug fields. | `npx vitest run tests/helix-ask-arbiter.spec.ts` | PASS | null | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true | `adapter:b06e0d25-a941-465f-a1e9-5111e2276a5e` | `48` | b7bfd11 |
| Prompt 2 - Atlas runtime retrieval lane | done | `server/routes/agi.plan.ts` | Added Atlas retrieval channel and per-channel contribution telemetry (`channel_contributions`, `atlas_channel_used`). | `npm run typecheck` (initial failure fixed), `npx tsx scripts/helix-ask-regression.ts` | PASS | null | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true | `adapter:b06e0d25-a941-465f-a1e9-5111e2276a5e` | `48` | b7bfd11 |
| Prompt 3 - scientific synthesis contract hardening | partial-blocked | `server/routes/agi.plan.ts` | Added mission-overwatch/Dottie search seed expansion and open-world guardrail-compatible telemetry; full synthesis schema enforcement remains pending due existing broader contract failures. | `npx tsx scripts/helix-ask-regression.ts` | PASS | null | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true | `adapter:b06e0d25-a941-465f-a1e9-5111e2276a5e` | `48` | b7bfd11 |
| Prompt 4 - readiness battery + bookkeeping | partial-blocked | `reports/helix-ask-dottie-grounding-final-scorecard-2026-03-03.json`, `reports/helix-ask-dottie-grounding-go-no-go-2026-03-03.md`, `artifacts/training-trace.dottie-grounding-2026-03-03.jsonl` | Final scorecard + GO/NO-GO published, trace exported through Casimir verify command. Variety battery execution was started but not completed within this autorun pass. | `npm run casimir:verify -- --pack repo-convergence ...` | PASS | null | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true | `adapter:b06e0d25-a941-465f-a1e9-5111e2276a5e` | `48` | b7bfd11 |

## Baseline vs final scorecard deltas

- `cases_failed`: 15 -> 15 (delta 0)
- `mode_precision`: 0 -> 0 (delta 0)
- `coverage_ratio`: unavailable in this run
- `unsupported_claim_rate`: unavailable in this run
- `contradiction_rate`: unavailable in this run
- `latency p50/p95`: unavailable in this run
- `llm_call_count distribution`: unavailable in this run

## Final Casimir verification summary

- Verdict: `PASS`
- Run ID: `48`
- Trace ID: `adapter:b06e0d25-a941-465f-a1e9-5111e2276a5e`
- Certificate hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- Integrity OK: `true`

## Blocker ledger

1. Existing Helix Ask regression contract failures remain in open-world wording, ambiguity routing, and ideology section scaffolding.
2. Full variety battery was initiated but not completed during this pass window.
3. Repo-wide typecheck runtime exceeded practical autorun budget after local syntax fix; targeted test coverage passed.

## Produced artifacts and reports

- `docs/audits/research/helix-ask-dottie-grounding-build-execution-report-2026-03-03.md`
- `reports/helix-ask-dottie-grounding-baseline-scorecard-2026-03-03.json`
- `reports/helix-ask-dottie-grounding-final-scorecard-2026-03-03.json`
- `reports/helix-ask-dottie-grounding-go-no-go-2026-03-03.md`
- `artifacts/training-trace.dottie-grounding-2026-03-03.jsonl`
- `artifacts/helix-ask-dottie-grounding-regression-final.log`
