# Step-4 Heavy Rerun Final Decision (Auditable)

## 0) Verdict
**NO-GO**

Rationale: quality metrics improved on the heavy rerun, but provenance is a hard blocker (`decision_grade_ready=false`, provenance gate does not pass) and AB novelty gates fail at both t=0.2 and t=0.35.

## 1) Runs and metric sources
- baseline run id: `versatility-1771461446899`
  - source: `artifacts/experiments/helix-ask-versatility-research/20260219T023617Z/summary.json` (`latest_matrix_reference` + `rates` + `latency`)
- heavy rerun run id: `versatility-1771558290390`
  - source: `artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/summary.json`
  - recommendation source: `artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/recommendation.json`
- AB t=0.2 run id: `2026-02-20T03-36-49-299Z`
  - source: `artifacts/experiments/helix-step4-ab-rerun/t02/helix_step4_rerun_t02/summary.json`
- AB t=0.35 run id: `2026-02-20T03-38-46-614Z`
  - source: `artifacts/experiments/helix-step4-ab-rerun/t035/helix_step4_rerun_t035/summary.json`

## 2) Strict 5-gate table
| gate | source metric(s) | status | evidence |
|---|---|---|---|
| G1: Heavy run completeness | `run_complete`, `completion_rate`, `total_runs=expected_runs` | PASS | `true`, `1.0`, `270=270` |
| G2: Heavy core quality | `report_mode_correct_rate`, `relation_packet_built_rate`, `citation_presence_rate`, `min_text_length_pass_rate` | PASS | `1.000`, `0.967`, `1.000`, `1.000` |
| G3: Provenance gate | `provenance.gate_pass` (summary) and `decision_grade_ready` (recommendation) | FAIL (HARD BLOCKER) | `false`; `decision_grade_ready=false` |
| G4: AB quality gate t=0.2 and t=0.35 | `quality_pass` | PASS | `true` (t=0.2), `true` (t=0.35) |
| G5: AB novelty gate t=0.2 and t=0.35 | `novelty_pass`, `novel_response_rate` | FAIL | `false` + `0.750` (t=0.2), `false` + `0.750` (t=0.35) |

## 3) Before/after vs baseline `versatility-1771461446899`
| metric | baseline | heavy rerun | delta |
|---|---:|---:|---:|
| intent_id_correct_rate | 0.9333 | 0.9667 | +0.0334 |
| report_mode_correct_rate | 0.9222 | 1.0000 | +0.0778 |
| relation_packet_built_rate | 0.8667 | 0.9667 | +0.1000 |
| relation_dual_domain_ok_rate | 0.8667 | 0.9667 | +0.1000 |
| citation_presence_rate | 0.9667 | 1.0000 | +0.0333 |
| latency_total_p50_ms | 669 | 719 | +50 |
| latency_total_p95_ms | 1931 | 1996 | +65 |

## 4) Top failure signatures before/after
### Before (baseline)
- `MISSING` (hard counts are not present in an available `summary.json`/`recommendation.json` artifact for baseline run `versatility-1771461446899`).

### After (heavy rerun)
- intent_mismatch: 3
- relation_packet_built: 3
- relation_dual_domain: 3
- bridge_count_low: 3
- evidence_count_low: 3

## 5) 12 representative excerpts (4/4/4, unique prompt IDs)
Classification rule applied: any excerpt containing `Runtime fallback:` is classified as **failure**.

| family | prompt_id | excerpt (trimmed) | classification |
|---|---|---|---|
| relation | relation_01_how-does-a-warp-bubble-fit-in-with-the-mission-ethos | `What is warp bubble: docs/knowledge/ethos/mission-ethos.md ... Mission ethos constrains warp...` | pass |
| relation | relation_03_warp-bubble-ideology-relation-what-is-the-bridge | `In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field...` | pass |
| relation | relation_08_warp-buble-relation-to-ideology-mission-ethos | `...how_they_connect: Mission ethos constrains warp development to measured, auditable checkpoints...` | pass |
| relation | relation_18_warp-ethos-relation-prompt-test-explain-links-and-guardrails | `The warp vessel is a vow to return radiance to the Sun...` | pass |
| repo_technical | repo_tech_01_walk-through-api-agi-ask-routing-from-intent-detection-to-final-answer-c | `Runtime fallback: Cannot access 'intentStrategy' before initialization...` | **failure (runtime_fallback_error)** |
| repo_technical | repo_tech_02_how-does-helix-ask-choose-report-mode-vs-hybrid-explain-mode | `Notes: The gap between current reasoning guards and full scientific-method rigor...` | pass |
| repo_technical | repo_tech_05_how-does-deterministic-fallback-guard-relation-mode-contract-parse-failu | `Timing honesty: if burst < LC, the average claim is not earned...` | pass |
| repo_technical | repo_tech_11_show-pipeline-stages-captured-in-debug-live-events-for-helix-ask | `Runtime fallback: Cannot access 'intentStrategy' before initialization...` | **failure (runtime_fallback_error)** |
| ambiguous_general | ambiguous_01_define-lattice | `Runtime fallback: Cannot access 'intentStrategy' before initialization...` | **failure (runtime_fallback_error)** |
| ambiguous_general | ambiguous_02_what-s-a-cavity | `In this repo, a cavity is the Casimir/drive cavity mechanism where geometry, gap, and quality factor...` | pass |
| ambiguous_general | ambiguous_04_what-is-stability | `Runtime fallback: Cannot access 'intentStrategy' before initialization...` | **failure (runtime_fallback_error)** |
| ambiguous_general | ambiguous_05_how-should-i-think-about-uncertainty | `# Uncertainty Mechanics Tree ...` | pass |

## 6) Provenance status
- decision_grade_ready: `false`
- provenance_gate_pass: `false`
- provenance blocker statement: **Hard blocker** — decision package is not promotion-ready until provenance gate passes (origin/main provenance unavailable in this environment).

## 7) Artifact path table (`EXISTS`/`MISSING`)
| artifact | path | status |
|---|---|---|
| heavy_summary | `artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/summary.json` | EXISTS |
| heavy_recommendation | `artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/recommendation.json` | EXISTS |
| heavy_failures | `artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/failures.json` | EXISTS |
| heavy_checkpoint | `artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/checkpoint.json` | MISSING |
| heavy_prompts | `artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/prompts.jsonl` | MISSING |
| heavy_raw | `artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/raw` | MISSING |
| ab_t02_summary | `artifacts/experiments/helix-step4-ab-rerun/t02/helix_step4_rerun_t02/summary.json` | EXISTS |
| ab_t02_recommendation | `artifacts/experiments/helix-step4-ab-rerun/t02/helix_step4_rerun_t02/recommendation.json` | EXISTS |
| ab_t035_summary | `artifacts/experiments/helix-step4-ab-rerun/t035/helix_step4_rerun_t035/summary.json` | EXISTS |
| ab_t035_recommendation | `artifacts/experiments/helix-step4-ab-rerun/t035/helix_step4_rerun_t035/recommendation.json` | EXISTS |
| training_trace_export | `artifacts/experiments/helix-step4-heavy-rerun/training-trace-export.jsonl` | EXISTS |

## 8) Casimir verification gate
- traceId: `adapter:01cde50b-d354-4887-9a85-27339e5d5cbe`
- runId: `347`
- verdict: `PASS`
- certificateHash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- integrityOk: `true`

## 9) Command log
- ⚠️ `git remote show origin && git fetch --prune` (origin missing in environment)
- ✅ `HELIX_ASK_VERSATILITY_OUT=artifacts/experiments/helix-step4-heavy-rerun HELIX_ASK_VERSATILITY_REPORT=reports/helix-step4-heavy-rerun.md HELIX_ASK_VERSATILITY_START_SERVER=1 HELIX_ASK_VERSATILITY_SEEDS=7,11,13 HELIX_ASK_VERSATILITY_TEMPS=0.2 HELIX_ASK_VERSATILITY_MAX_RETRIES=3 HELIX_ASK_VERSATILITY_TIMEOUT_MS=15000 HELIX_ASK_VERSATILITY_MAX_CASE_WALL_MS=25000 HELIX_ASK_VERSATILITY_CHECKPOINT_EVERY=10 npm run helix:ask:versatility`
- ✅ `npm run dev:agi:5173`
- ✅ `curl -sf http://127.0.0.1:5173/api/ready`
- ✅ `HELIX_ASK_BASE_URL=http://127.0.0.1:5173 HELIX_ASK_AB_OUT=artifacts/experiments/helix-step4-ab-rerun/t02 HELIX_ASK_AB_VARIANT=helix_step4_rerun_t02 HELIX_ASK_AB_TEMP=0.2 HELIX_ASK_AB_SEEDS=7,11,13 npx tsx scripts/helix-ask-utility-ab.ts`
- ✅ `HELIX_ASK_BASE_URL=http://127.0.0.1:5173 HELIX_ASK_AB_OUT=artifacts/experiments/helix-step4-ab-rerun/t035 HELIX_ASK_AB_VARIANT=helix_step4_rerun_t035 HELIX_ASK_AB_TEMP=0.35 HELIX_ASK_AB_SEEDS=7,11,13 npx tsx scripts/helix-ask-utility-ab.ts`
- ✅ `npm run casimir:verify -- --pack repo-convergence --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/experiments/helix-step4-heavy-rerun/training-trace-export.jsonl --trace-limit 200 --ci`
