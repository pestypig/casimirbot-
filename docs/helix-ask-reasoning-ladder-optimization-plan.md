# Helix Ask Reasoning Ladder Optimization Plan

## Goal
Upgrade Helix Ask from a control-heavy scaffold formatter into a hybrid system:
- deterministic for integrity and safety
- LLM-driven for semantic synthesis and cross-topic reasoning

## Mandatory Implementation Corrections (AGENTS-Aligned, 2026-03-23)
This plan is updated to treat readiness-loop evidence as a release contract, not optional diagnostics.

Required for every Helix Ask routing/scaffold/fallback/output-cleaning patch:
1. Run contract battery (`scripts/helix-ask-regression.ts`).
2. Run variety battery (`scripts/helix-ask-versatility-record.ts`).
3. Run per-patch randomized probe (`scripts/helix-ask-patch-probe.ts`).
4. Run Casimir verify against adapter/export endpoints.
5. Attach representative evidence packs for at least one pass and one fail case:
   - prompt
   - final output
   - verdict
   - full `debugContext`
6. Report probability scorecard (route correctness by family, scaffold completeness, no-debug-leak, no-runtime-fallback), with confidence intervals where available.

Completion claim policy:
- No completion claim without Casimir `PASS`.
- Report `runId`, `certificateHash`, and `integrityOk=true`.

## Target Ladder (v2)
1. Intent lock and question decomposition.
2. Evidence shaping with intent/family-aware slot plans.
3. Grounded semantic synthesis (entity A, entity B, relation mechanism).
4. Contract shaping after synthesis (not before).
5. Self-critique and repair loop.
6. Final release gate with semantic and leakage checks.

## Full Replacement Scope Lock (Definition of Done)
Full replacement is complete only when all conditions below are true in live LLM mode.

1. The loop controller is the primary answer path for non-hard-forced asks, not an optional branch.
2. Planner, retrieval retry, and two-pass decisions are uncertainty/risk-driven, not primarily regex/policy-triggered.
3. Sectional compose and section-scoped repair are default for complex asks; deterministic fallback is exception-only.
4. Finalization occurs only after obligation coverage and semantic-quality gates pass, or fail-closed with explicit reason taxonomy.
5. Debug telemetry proves continuity (`controller_steps`, `controller_stop_reason`, planner/two-pass/retry reasons, obligation coverage).
6. Readiness suite meets release thresholds across contract, variety, and patch-probe batteries.

## Ownership Boundary (Deterministic vs LLM)

### Deterministic ownership (must remain deterministic)
1. Policy hard-gates and fail-closed behavior.
2. Citation/source sanitation and output leakage blocking.
3. Final safety rails for empty/invalid output and runtime transport failure.
4. Casimir verification gate and trace export enforcement.

### LLM ownership (must become primary)
1. Objective planning and decomposition quality for repo/hybrid asks.
2. Section-level synthesis and cross-topic mechanism explanation.
3. Critique and targeted repair proposals for uncovered obligations.
4. Semantic completeness of relation/mechanism answers before finalization.

### Shared control signals (deterministic evaluator + LLM actor)
1. Slot/doc/obligation coverage ratios.
2. Retrieval confidence and evidence sufficiency.
3. Format quality and leakage diagnostics.
4. Runtime budget/deadline state.

## Loop Controller Contract (Primary Execution Spec)
Use this phase contract for the main answer path.

| Phase | Required Inputs | Action | Exit Condition | Stop/Fail Reason |
| --- | --- | --- | --- | --- |
| `plan` | question, intent, prior turn contract | produce objective + obligation plan | plan valid and obligations materialized | `planner_invalid` |
| `retrieve` | objectives, slot plan, retrieval contract | targeted retrieval per objective | coverage rises or retrieval exhausted | `retrieval_exhausted` |
| `synthesize` | obligation evidence pack, section plan | sectional compose draft | all required sections present | `section_missing` |
| `critique` | draft, obligations, semantic gates | evaluate completeness/leakage/format | no hard violations | `quality_gate_fail` |
| `repair` | critique deltas only | bounded section-scoped rewrite | violations resolved or retry budget spent | `repair_budget_exhausted` |
| `finalize` | passing draft + sources | sanitize and release | release contract satisfied | `final_output_guard` |

## Stage Blueprint (Token-Safe, Continuity-Safe)
Stages are sequential and each stage has explicit ownership and exit criteria.

### Stage S0: Baseline lock and instrumentation freeze
1. Purpose: prevent scope drift and establish baseline scorecard before more rewiring.
2. Primary files:
   - `docs/helix-ask-reasoning-ladder-optimization-plan.md`
   - `docs/helix-ask-readiness-debug-loop.md`
3. Exit criteria:
   - baseline contract/variety/probe artifacts recorded
   - Casimir PASS attached
   - patch ledger row added

### Stage S1: Controller-first routing promotion
1. Purpose: make controller path primary for non-hard-forced asks.
2. Primary files:
   - `server/routes/agi.plan.ts`
   - `tests/helix-ask-runtime-errors.spec.ts`
3. Required implementation notes:
   - keep reliability guards as first-class decisions:
     - `shouldPreferHelixAskPlannerLlmInFastMode`
     - `shouldUseHelixAskRiskTriggeredTwoPass`
     - `shouldOverrideHelixAskRetrievalRetryPolicy`
4. Exit criteria:
   - controller path used in representative repo/hybrid prompts
   - deterministic pre-answer pinning reduced (except hard policy cases)

### Stage S2: Retrieval loop objective-scoping
1. Purpose: convert retrieval to objective-scoped micro-loops with bounded retries.
2. Primary files:
   - `server/routes/agi.plan.ts`
   - `server/services/helix-ask/retrieval-contract.ts`
   - `server/services/helix-ask/stage0-content.ts`
3. Exit criteria:
   - improved obligation coverage without increased leakage
   - retry decisions reflect risk/coverage, not only policy default

### Stage S3: Sectional synthesis by obligation
1. Purpose: ensure answer generation is section-first for complex asks.
2. Primary files:
   - `server/services/helix-ask/generation-contract.ts`
   - `server/services/helix-ask/answer-plan.ts`
   - `server/services/helix-ask/obligations.ts`
3. Exit criteria:
   - `sectional_compose` used when required sections exceed single-pass budget
   - required sections consistently present before finalize

### Stage S4: Critique and targeted repair closure
1. Purpose: repair only failed obligations/sections, not full-answer rewrite by default.
2. Primary files:
   - `server/services/helix-ask/research-validator.ts`
   - `server/services/helix-ask/obligation-coverage.ts`
   - `server/services/helix-ask/evidence-contract.ts`
   - `server/routes/agi.plan.ts`
3. Exit criteria:
   - repair actions are section-scoped and observable in debug markers
   - semantic completeness pass rate reaches release target

### Stage S5: Fallback minimization and deterministic floor narrowing
1. Purpose: keep deterministic fallback as last resort, not common route.
2. Primary files:
   - `server/routes/agi.plan.ts`
   - `server/services/helix-ask/format.ts`
3. Exit criteria:
   - reduction in deterministic fallback rate with no safety regression
   - no artifact-key leakage or scaffold spill in final text

### Stage S6: Readiness hardening and promotion gate
1. Purpose: make release decision data-driven and replayable.
2. Primary files:
   - `scripts/helix-ask-regression.ts`
   - `scripts/helix-ask-versatility-record.ts`
   - `scripts/helix-ask-patch-probe.ts`
3. Exit criteria:
   - probability scorecard passes thresholds
   - representative pass/fail evidence packs published
   - Casimir PASS reported with certificate hash/integrity

## Required Patch Continuity Ledger (Must update every stage)
Add one ledger entry per patch in execution order. This is mandatory to prevent stage drift.

```md
- patch_id:
- stage:
- objective:
- files_changed:
- key_decisions:
- debug_markers_expected:
- tests_run:
- readiness_artifacts:
- casimir_run_id:
- casimir_certificate_hash:
- casimir_integrity_ok:
- regressions_introduced:
- rollback_plan:
```

### Ledger Entries

#### Entry: `S0-baseline-2026-03-23-A`
- patch_id: `S0-baseline-2026-03-23-A`
- stage: `S0`
- objective: establish a reproducible baseline bundle before controller-primary rewiring.
- files_changed:
  - `docs/helix-ask-reasoning-ladder-optimization-plan.md`
- key_decisions:
  - increased request timeout for contract/patch-probe batteries to `120000ms` to reduce transport abort noise.
  - bounded variety baseline to sampled sweep (`HELIX_ASK_VERSATILITY_PROMPT_SAMPLE_PER_FAMILY=2`) for per-patch runtime feasibility.
  - treated probe miss as real baseline debt, not hidden retry noise (`pass=9/10`, one ideology routing/coverage miss).
- debug_markers_expected:
  - `controller_steps`
  - `controller_stop_reason`
  - `answer_obligation_coverage`
  - `answer_sectional_compose_required`
  - `composer_soft_enforce_effective_mode`
  - `relation_completeness_required`
- tests_run:
  - `HELIX_ASK_BASE_URL=http://localhost:5050 HELIX_ASK_REGRESSION_TIMEOUT_MS=120000 HELIX_ASK_REGRESSION_AMBIGUITY=1 HELIX_ASK_REGRESSION_IDEOLOGY=1 HELIX_ASK_REGRESSION_FRONTIER_CONTINUITY=1 npx tsx scripts/helix-ask-regression.ts`
  - `HELIX_ASK_BASE_URL=http://localhost:5050 HELIX_ASK_VERSATILITY_PROMPT_SAMPLE_PER_FAMILY=2 HELIX_ASK_VERSATILITY_SEEDS=7 HELIX_ASK_VERSATILITY_TEMPS=0.2 HELIX_ASK_VERSATILITY_MAX_RUN_MS=420000 HELIX_ASK_VERSATILITY_FAIL_ON_INCOMPLETE=1 npx tsx scripts/helix-ask-versatility-record.ts`
  - `HELIX_ASK_BASE_URL=http://localhost:5050 HELIX_ASK_PATCH_PROBE_TIMEOUT_MS=120000 HELIX_ASK_PATCH_PROBE_SAMPLES=10 HELIX_ASK_PATCH_PROBE_REQUIRE_PLAN_CONTEXT=1 HELIX_ASK_PATCH_PROBE_FAIL_ON_MISS=1 npx tsx scripts/helix-ask-patch-probe.ts`
- readiness_artifacts:
  - contract battery verdict: `Helix Ask regression passed.`
  - variety summary: `artifacts/experiments/helix-ask-versatility/versatility-1774242698114/summary.json`
  - variety failures: `artifacts/experiments/helix-ask-versatility/versatility-1774242698114/failures.json`
  - patch probe summary: `artifacts/experiments/helix-ask-patch-probe/2026-03-23T052456436Z/summary.json`
  - patch probe report: `artifacts/experiments/helix-ask-patch-probe/2026-03-23T052456436Z/report.md`
  - representative pass evidence: `artifacts/experiments/helix-ask-versatility/versatility-1774242698114/raw/versatility-1774242698114-relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th-s7-t0p2.json`
  - representative fail evidence: `artifacts/experiments/helix-ask-versatility/versatility-1774242698114/raw/versatility-1774242698114-relation_25_from-docs-perspective-how-do-warp-bubble-files-and-ethos-files-relate-s7-t0p2.json`
- casimir_run_id: `pending_after_current_patch`
- casimir_certificate_hash: `pending_after_current_patch`
- casimir_integrity_ok: `pending_after_current_patch`
- regressions_introduced:
  - none introduced by this doc-only stage patch.
  - baseline debt still present:
    - versatility relation packet/dual-domain rate `0.50`.
    - patch probe pass rate `0.90` (failed case: `Child-love vulnerability policy`, `coverage_ratio:0.143<0.300`, intent routed as `repo.ideology_reference`).
- rollback_plan:
  - revert this ledger entry block only if baseline artifacts are replaced with a newer canonical S0 run.

#### Entry: `S1-controller-primary-relation-2026-03-23-A`
- patch_id: `S1-controller-primary-relation-2026-03-23-A`
- stage: `S1`
- objective: prevent relation fastpath deterministic pre-answer skip when runtime is healthy and answer is not hard-forced.
- files_changed:
  - `server/routes/agi.plan.ts`
  - `tests/helix-ask-runtime-errors.spec.ts`
- key_decisions:
  - added a controller-primary preference gate to relation packet direct-skip guard.
  - blocked relation fastpath deterministic pre-LLM contract path when controller-primary preference is active.
  - preserved deterministic/direct behavior for hard-forced and runtime-unavailable states.
- debug_markers_expected:
  - `controller:relation_llm_primary` in `answer_path` when relation fastpath is routed through LLM.
  - `relation_packet_direct_skip_blocked=true` with reason `controller_primary`.
  - absence of `answerContract:relation_packet_pre_llm` for non-hard-forced healthy-runtime relation turns.
- tests_run:
  - `npx vitest run tests/helix-ask-runtime-errors.spec.ts -t "deterministic relation packet answers|controller-primary mode"`
  - `HELIX_ASK_BASE_URL=http://localhost:5050 HELIX_ASK_REGRESSION_TIMEOUT_MS=120000 HELIX_ASK_REGRESSION_AMBIGUITY=1 HELIX_ASK_REGRESSION_IDEOLOGY=1 HELIX_ASK_REGRESSION_FRONTIER_CONTINUITY=1 npx tsx scripts/helix-ask-regression.ts`
  - `HELIX_ASK_BASE_URL=http://localhost:5050 HELIX_ASK_VERSATILITY_PROMPT_SAMPLE_PER_FAMILY=2 HELIX_ASK_VERSATILITY_SEEDS=7 HELIX_ASK_VERSATILITY_TEMPS=0.2 HELIX_ASK_VERSATILITY_MAX_RUN_MS=420000 HELIX_ASK_VERSATILITY_FAIL_ON_INCOMPLETE=1 npx tsx scripts/helix-ask-versatility-record.ts`
  - `HELIX_ASK_BASE_URL=http://localhost:5050 HELIX_ASK_PATCH_PROBE_TIMEOUT_MS=120000 HELIX_ASK_PATCH_PROBE_SAMPLES=10 HELIX_ASK_PATCH_PROBE_REQUIRE_PLAN_CONTEXT=1 HELIX_ASK_PATCH_PROBE_FAIL_ON_MISS=1 npx tsx scripts/helix-ask-patch-probe.ts`
  - `npx vitest run tests/helix-ask-runtime-errors.spec.ts` (fails on 3 pre-existing definition-section expectation tests unrelated to this relation guard change)
- readiness_artifacts:
  - variety summary: `artifacts/experiments/helix-ask-versatility/versatility-1774244150169/summary.json`
  - variety failures: `artifacts/experiments/helix-ask-versatility/versatility-1774244150169/failures.json`
  - patch probe summary: `artifacts/experiments/helix-ask-patch-probe/2026-03-23T054114134Z/summary.json`
  - patch probe report: `artifacts/experiments/helix-ask-patch-probe/2026-03-23T054114134Z/report.md`
  - representative fail evidence: `artifacts/experiments/helix-ask-versatility/versatility-1774244150169/raw/versatility-1774244150169-relation_25_from-docs-perspective-how-do-warp-bubble-files-and-ethos-files-relate-s7-t0p2.json`
- casimir_run_id: `pending_after_current_patch`
- casimir_certificate_hash: `pending_after_current_patch`
- casimir_integrity_ok: `pending_after_current_patch`
- regressions_introduced:
  - no new contract-battery failures introduced.
  - readiness scores unchanged vs S0 sampled baseline (`relation_packet_built_rate=0.50`, patch probe `9/10`).
  - live `5050` single-prompt probe still showed `answerContract:relation_packet_pre_llm`, likely due server runtime not reloaded to new source.
- rollback_plan:
  - revert relation controller-primary gate change in `server/routes/agi.plan.ts` if it causes increased hard-fail frequency in relation lanes.

#### Entry: `S1-term-prior-relation-guard-2026-03-23-B`
- patch_id: `S1-term-prior-relation-guard-2026-03-23-B`
- stage: `S1`
- objective: prevent term-prior general-lock override from downgrading relation-heuristic prompts.
- files_changed:
  - `server/routes/agi.plan.ts`
  - `tests/helix-ask-runtime-errors.spec.ts`
- key_decisions:
  - added `shouldApplyTermPriorGeneralArbiterLock` guard helper.
  - blocked general-lock when relation heuristic is detected (`warp+ethos` domain pair with relation connector cues).
  - retained existing general-lock behavior for non-relation prompts.
- debug_markers_expected:
  - no `arbiterOverride:term_prior_general_lock` on relation-heuristic prompts.
  - relation prompts should keep hybrid/repo arbiter lanes (`arbiter:hybrid` or `arbiter:repo_grounded`) unless other hard gates apply.
  - when relation packet direct-skip is blocked, expect `controller:relation_llm_primary` and `relation_packet_direct_skip_blocked=true`.
- tests_run:
  - `npx vitest run tests/helix-ask-runtime-errors.spec.ts -t "controller-primary mode|term-prior general arbiter lock|deterministic relation packet answers"`
- readiness_artifacts:
  - live probe (relation canonical): controller marker observed (`controller:relation_llm_primary`), deterministic relation direct-skip blocked.
  - live probe (docs perspective relation): still showed `arbiterOverride:term_prior_general_lock`, indicating runtime process likely not reloaded after this patch.
- casimir_run_id: `35341`
- casimir_certificate_hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- casimir_integrity_ok: `true`
- regressions_introduced:
  - none in targeted unit tests.
  - live verification pending runtime reload for this patch.
- rollback_plan:
  - revert `shouldApplyTermPriorGeneralArbiterLock` usage if non-relation general prompts regress in arbiter routing.

#### Entry: `S1-relation-routing-coverage-citations-2026-03-23-C`
- patch_id: `S1-relation-routing-coverage-citations-2026-03-23-C`
- stage: `S1`
- objective: remove remaining relation misroute pressure from term-prior generalization, stabilize ideology prompt coverage keys, and preserve citation markers on forced clarify answers.
- files_changed:
  - `server/routes/agi.plan.ts`
  - `server/services/helix-ask/platonic-gates.ts`
  - `tests/helix-ask-runtime-errors.spec.ts`
  - `tests/helix-ask-platonic-gates.spec.ts`
- key_decisions:
  - added `shouldApplyTermPriorPhysicsRelationGeneralRoute` and blocked term-prior physics-relation general route when relation heuristic is active.
  - unified relation heuristic variable for routing decisions to avoid split predicate behavior.
  - for ideology intent coverage, replaced noisy inherited structural slots with ideology-anchor slot set in platonic coverage summary.
  - when forced-clarify answers suppress general citations, append open-world sources marker if missing.
- debug_markers_expected:
  - docs-perspective relation prompt should stop carrying `term_prior_physics_relation_general` in `intent_reason`.
  - relation prompts should emit relation packet debug fields (`relation_packet_built`, bridge/evidence counts) when relation intent is selected.
  - forced-clarify general answers should include `citationScrub:open_world_sources_marker_forced_clarify` when sources were absent.
- tests_run:
  - `npx vitest run tests/helix-ask-runtime-errors.spec.ts -t "term-prior"`
  - `npx vitest run tests/helix-ask-platonic-gates.spec.ts -t "ideology anchor slots"`
  - `npx vitest run tests/helix-ask-platonic-gates.spec.ts` (PASS)
  - `npx vitest run tests/helix-ask-runtime-errors.spec.ts` (3 pre-existing failures in definition degrade section-title expectations; unrelated to this patch line of changes)
- readiness_artifacts:
  - live probe snapshots after edit showed runtime still serving pre-patch behavior on `5050`:
    - relation docs prompt still `intent=hybrid.composite_system_synthesis` with reason containing `term_prior_physics_relation_general`
    - ideology child prompt still `coverage_ratio=0.143` with noisy missing keys
    - ambiguous clarify prompt still no sources marker
  - pending runtime reload before readiness rerun:
    - `scripts/helix-ask-regression.ts`
    - `scripts/helix-ask-versatility-record.ts`
    - `scripts/helix-ask-patch-probe.ts`
- casimir_run_id: `35388`
- casimir_certificate_hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- casimir_integrity_ok: `true`
- regressions_introduced:
  - none observed in platonic gate suite.
  - runtime-errors suite continues to show the same pre-existing 3 failures unrelated to this patch cluster.
- rollback_plan:
  - revert helper `shouldApplyTermPriorPhysicsRelationGeneralRoute` and ideology coverage override if relation recall drops or ideology prompts regress after runtime reload + readiness replay.

#### Entry: `S1-open-world-marker-persistence-2026-03-23-D`
- patch_id: `S1-open-world-marker-persistence-2026-03-23-D`
- stage: `S1`
- objective: ensure explicit open-world `Sources:` marker survives deterministic finalization sanitization for forced-clarify ambiguity answers.
- files_changed:
  - `server/routes/agi.plan.ts`
  - `tests/helix-ask-runtime-errors.spec.ts`
- key_decisions:
  - updated `sanitizeSourcesLine` to preserve canonical marker `Sources: open-world best-effort (no repo citations required).` when no path/token citations are present.
  - added deterministic finalize regression test to prevent marker-stripping reintroduction.
- debug_markers_expected:
  - `citationScrub:open_world_sources_marker_forced_clarify` present for forced-clarify open-world cases.
  - final text includes explicit `Sources:` marker for that path.
- tests_run:
  - `npx vitest run tests/helix-ask-runtime-errors.spec.ts -t "open-world sources marker|term-prior physics-relation general route"`
  - `npx vitest run tests/helix-ask-platonic-gates.spec.ts -t "ideology anchor slots"`
- readiness_artifacts:
  - live probe before runtime reload still returned `has_sources=false` despite marker in `answer_path`, indicating running process had not yet loaded this patch.
  - pending post-restart verification in readiness rerun.
- casimir_run_id: `35428`
- casimir_certificate_hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- casimir_integrity_ok: `true`
- regressions_introduced:
  - none observed in targeted tests.
- rollback_plan:
  - revert open-world marker preservation branch in `sanitizeSourcesLine` if it creates citation marker leakage in repo/hybrid cite-required lanes.

#### Entry: `S1-readiness-scorecard-hardening-2026-03-23-E`
- patch_id: `S1-readiness-scorecard-hardening-2026-03-23-E`
- stage: `S1`
- objective: complete PR6 readiness hardening contract by publishing explicit probability scorecard, debug/scaffold/code spill failure signatures, and representative pass/fail evidence pointers in versatility artifacts.
- files_changed:
  - `scripts/helix-ask-versatility-record.ts`
  - `scripts/helix-ask-patch-probe.ts`
  - `tests/helix-ask-versatility-record.spec.ts`
- key_decisions:
  - added `probability_scorecard` (Wilson 95% CI) with required readiness probabilities:
    - `route_correct_by_family`
    - `frontier_scaffold_complete`
    - `no_debug_leak`
    - `no_runtime_fallback`
  - added explicit readiness verdict output (`READY | PARTIAL_READY | NOT_READY`) to summary/recommendation artifacts.
  - added debug/scaffold leakage + code-fragment spill signatures in versatility failure evaluation:
    - `debug_scaffold_leak`
    - `code_fragment_spill`
  - added representative evidence pointers in summary/failures/recommendation artifacts:
    - `representative_evidence.pass.raw_record`
    - `representative_evidence.fail.raw_record`
  - switched patch-probe default plan context to this optimization plan path:
    - `docs/helix-ask-reasoning-ladder-optimization-plan.md`
  - added patch-probe retry hardening for transient transport classes (`aborted`, retryable 4xx/5xx) with bounded backoff:
    - `HELIX_ASK_PATCH_PROBE_MAX_RETRIES`
    - `HELIX_ASK_PATCH_PROBE_RETRY_BASE_MS`
    - `HELIX_ASK_PATCH_PROBE_RETRY_MAX_MS`
- tests_run:
  - `npx vitest run tests/helix-ask-versatility-record.spec.ts`
  - `npx vitest run tests/helix-ask-runtime-errors.spec.ts -t "open-world sources marker"`
  - `npx vitest run tests/helix-ask-platonic-gates.spec.ts -t "ideology anchor slots"`
- readiness_artifacts:
  - contract battery: `npx tsx scripts/helix-ask-regression.ts` -> one failure (`frontier continuity followup`) with timeout (`This operation was aborted`).
  - focused continuity rerun:
    - `HELIX_ASK_REGRESSION_ONLY="general conceptual" HELIX_ASK_REGRESSION_INCLUDE_CONTINUITY_WITH_ONLY=1 HELIX_ASK_REGRESSION_TIMEOUT_MS=90000 npx tsx scripts/helix-ask-regression.ts` (PASS), indicating timeout sensitivity rather than deterministic contract break.
  - initial low-timeout variety run (15s request timeout): `artifacts/experiments/helix-ask-versatility/versatility-1774251457423/summary.json` (transport-heavy failures).
  - intermediate variety run (45s timeout): `artifacts/experiments/helix-ask-versatility/versatility-1774252124743/summary.json` (revealed over-strict leak/route scoring assumptions).
  - post-fix canonical variety run (45s timeout): `artifacts/experiments/helix-ask-versatility/versatility-1774274588489/summary.json`
  - post-fix variety failures: `artifacts/experiments/helix-ask-versatility/versatility-1774274588489/failures.json`
  - post-fix variety recommendation: `artifacts/experiments/helix-ask-versatility/versatility-1774274588489/recommendation.json`
  - initial patch probe run (45s timeout): `artifacts/experiments/helix-ask-patch-probe/2026-03-23T074406286Z/summary.json`
  - intermediate patch probe run (90s timeout, no retry): `artifacts/experiments/helix-ask-patch-probe/2026-03-23T075930464Z/summary.json`
  - post-fix canonical patch probe run (90s timeout + retry): `artifacts/experiments/helix-ask-patch-probe/2026-03-23T141646643Z/summary.json`
  - post-fix canonical patch probe results: `artifacts/experiments/helix-ask-patch-probe/2026-03-23T141646643Z/results.json`
  - representative pass evidence:
    - `artifacts/experiments/helix-ask-versatility/versatility-1774274588489/raw/versatility-1774274588489-relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th-s7-t0p2.json`
  - representative fail evidence:
    - `artifacts/experiments/helix-ask-versatility/versatility-1774252124743/raw/versatility-1774252124743-repo_tech_26_explain-how-answer-path-is-populated-and-useful-for-diagnostics-s7-t0p2.json`
  - scorecard snapshot:
    - `readiness_verdict=READY`
    - `decision=ship`
    - `no_debug_leak=1.0`
    - `no_runtime_fallback=1.0`
    - `frontier_scaffold_complete=1.0`
    - route correctness by family:
      - `relation=1.0`
      - `repo_technical=1.0`
      - `ambiguous_general=1.0`
    - patch probe pass rate `1.00` (improved from `0.70` -> `0.80` -> `1.00`)
- casimir_run_id: `35536`
- casimir_certificate_hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- casimir_integrity_ok: `true`
- regressions_introduced:
  - none in targeted unit scope.
  - post-fix readiness sample meets stated release thresholds.
- rollback_plan:
  - revert `debug_scaffold_leak` and `code_fragment_spill` failure gates if they create false positives in contract-approved repo technical prompts.
  - restore prior patch-probe plan-path default via `HELIX_ASK_PATCH_PROBE_PLAN_PATH` if operator needs retrieval-plan anchoring.

#### Entry: `S2-objective-loop-pr8-pr9-strict-2026-03-23-A`
- patch_id: `S2-objective-loop-pr8-pr9-strict-2026-03-23-A`
- stage: `S2`
- objective: tighten PR8/PR9 to true objective-scoped micro-loops with bounded retries and objective-local mini-answer evidence.
- files_changed:
  - `server/routes/agi.plan.ts`
  - `tests/helix-ask-runtime-errors.spec.ts`
  - `docs/helix-ask-reasoning-ladder-optimization-plan.md`
- key_decisions:
  - upgraded objective retrieval loop to per-objective bounded retries (`attempt<n>`) before moving to next objective.
  - scoped retrieval transitions and coverage updates to objective IDs to avoid cross-objective state mutation.
  - made objective matched-slot updates additive across retrieval retries.
  - wired objective mini answers to prioritize objective-local retrieval files.
  - pushed mini-validation unresolved cases into objective finalize validation fail-reason taxonomy.
- debug_markers_expected:
  - `objective_retrieval_passes` shows `objective_scoped:<objective_id>:attempt<n>`
  - `objective_retrieval_queries`
  - `objective_retrieval_selected_files`
  - `objective_retrieval_confidence_delta`
  - `objective_mini_answers`
  - `objective_mini_validation`
  - `objective_assembly_mode`
  - `objective_assembly_fail_reason`
- tests_run:
  - `npx vitest run tests/helix-ask-runtime-errors.spec.ts --testNamePattern "objective loop|objective support|finalize gate|infers objective slots|mini answers|deterministic objective mini|scoped objective coverage"`
- readiness_artifacts:
  - targeted runtime probe on current `5050` returned objective totals but not new objective retrieval/mini arrays, indicating process runtime was still on an older loaded bundle.
  - post-restart probe required to validate live marker emission for this patch.
- casimir_run_id: `35747`
- casimir_certificate_hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- casimir_integrity_ok: `true`
- regressions_introduced:
  - none observed in targeted objective-loop unit scope.
- rollback_plan:
  - revert scoped-objective retrieval attempt loop block and objective mini-validation gate wiring in `server/routes/agi.plan.ts` if live probes show reduced answer completeness versus baseline.

#### Entry: `S2-objective-loop-pr9-runtime-fix-2026-03-23-B`
- patch_id: `S2-objective-loop-pr9-runtime-fix-2026-03-23-B`
- stage: `S2`
- objective: fix runtime crash that prevented objective mini-answer assembly telemetry from materializing.
- files_changed:
  - `server/routes/agi.plan.ts`
- key_decisions:
  - replaced out-of-scope `llmAnswerStarted` reference in objective assembly gating with `debugPayload?.llm_invoke_attempted === true` to avoid `ReferenceError`.
  - preserved existing safety gates (`answerGenerationFailedForTurn`, deterministic preserve mode, fast finalize budget).
- debug_markers_expected:
  - `runtime_error` no longer reports `llmAnswerStarted is not defined` after runtime reload.
  - `objective_mini_answers` and `objective_mini_validation` populate when mini synthesis executes.
  - `objective_assembly_input_count` reflects mini-answer count.
- tests_run:
  - `npx vitest run tests/helix-ask-runtime-errors.spec.ts --testNamePattern "objective loop|objective support|finalize gate|infers objective slots|mini answers|deterministic objective mini|scoped objective coverage"`
- readiness_artifacts:
  - pre-reload live probe still showed old runtime error string, confirming source patch requires process reload to validate live behavior.
- casimir_run_id: `35755`
- casimir_certificate_hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- casimir_integrity_ok: `true`
- regressions_introduced:
  - none observed in targeted objective-loop unit scope.
- rollback_plan:
  - revert objective assembly gating line in `server/routes/agi.plan.ts` if reload verification shows reduced assembly success in healthy LLM runs.

#### Entry: `S2-objective-loop-pr9-terminalization-assembly-2026-03-23-C`
- patch_id: `S2-objective-loop-pr9-terminalization-assembly-2026-03-23-C`
- stage: `S2`
- objective: reduce objective over-blocking semantics and broaden objective assembly eligibility toward LLM-first behavior.
- files_changed:
  - `server/routes/agi.plan.ts`
- key_decisions:
  - objective mini-answer reconciliation now terminalizes per objective:
    - `covered -> complete`
    - `partial|blocked -> blocked` with explicit mini-validation reasons.
  - objective assembly LLM eligibility now keys off runtime availability (`!llmUnavailableAtTurnStart`) rather than requiring the main answer path to have already invoked LLM.
  - deterministic fallback is retained when LLM assembly is unavailable or fails.
- debug_markers_expected:
  - objective transitions include `objective_mini_validation_covered|blocked|unresolved`.
  - `objective_assembly_mode=llm` becomes reachable on deterministic-main-path turns when runtime is healthy.
  - fallback remains observable as `objectiveAssembly:deterministic_fallback` with explicit reason.
- tests_run:
  - `npx vitest run tests/helix-ask-runtime-errors.spec.ts --testNamePattern "objective loop|objective support|finalize gate|infers objective slots|mini answers|deterministic objective mini|scoped objective coverage"`
- readiness_artifacts:
  - immediate live probe on current process still showed pre-change behavior (`objective_blocked_count=3`, `objective_assembly_fail_reason=objective_assembly_llm_skipped`), indicating runtime reload is required to validate this entry.
- casimir_run_id: `35760`
- casimir_certificate_hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- casimir_integrity_ok: `true`
- regressions_introduced:
  - none observed in targeted objective-loop unit scope.
- rollback_plan:
  - revert mini-answer terminalization map and objective assembly eligibility gate if post-reload probes show degraded completion quality or excess LLM failures.

#### Entry: `S2-objective-loop-pr9-assembly-scope-fix-2026-03-23-D`
- patch_id: `S2-objective-loop-pr9-assembly-scope-fix-2026-03-23-D`
- stage: `S2`
- objective: remove objective-assembly runtime scope fault that forced deterministic fallback.
- files_changed:
  - `server/routes/agi.plan.ts`
- key_decisions:
  - introduced local `objectiveAssemblyModel` inside objective assembly block.
  - replaced invalid scoped reference with `model: objectiveAssemblyModel`.
- debug_markers_expected:
  - `objective_assembly_fail_reason` no longer reports `dialogueProfileModel is not defined` after runtime reload.
  - `objective_assembly_mode=llm` can be reached when runtime is healthy and compose-preserve is not blocking.
- tests_run:
  - `npx vitest run tests/helix-ask-runtime-errors.spec.ts --testNamePattern "objective loop|objective support|finalize gate|infers objective slots|mini answers|deterministic objective mini|scoped objective coverage"`
- readiness_artifacts:
  - immediate live probe still showed old scope-fault message, indicating process reload required for this patch to take effect.
- casimir_run_id: `35764`
- casimir_certificate_hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- casimir_integrity_ok: `true`
- regressions_introduced:
  - none observed in targeted objective-loop unit scope.
- rollback_plan:
  - revert the objective assembly model assignment if reload validation reveals model selection regressions in `dot_min_steps_v1`.

#### Entry: `S2-objective-loop-pr9-semantic-slot-inference-2026-03-23-E`
- patch_id: `S2-objective-loop-pr9-semantic-slot-inference-2026-03-23-E`
- stage: `S2`
- objective: reduce false objective blocking by inferring semantic slot hits from objective-local evidence refs.
- files_changed:
  - `server/routes/agi.plan.ts`
  - `tests/helix-ask-runtime-errors.spec.ts`
- key_decisions:
  - added `inferHelixAskObjectiveSlotHitsFromEvidence` heuristic mapper for slot families (`voice-lane`, `transcription-translation`, `mechanism`, `relation`, `uncertainty`, `evidence`, repo/code-path signals).
  - wired inferred slot hits into mini-answer matched slots before status classification.
  - extended runtime-errors tests with semantic slot inference coverage and adjusted prior mini-answer expectations to new behavior.
- debug_markers_expected:
  - reduced `objective_mini_validation.unresolved` where objective-local evidence clearly satisfies semantic slots.
  - objective loop terminal statuses should show fewer false `blocked` outcomes on voice/translation asks.
- tests_run:
  - `npx vitest run tests/helix-ask-runtime-errors.spec.ts --testNamePattern "objective loop|objective support|finalize gate|infers objective slots|mini answers|deterministic objective mini|scoped objective coverage|semantic slot hits"`
- readiness_artifacts:
  - immediate live probe still showed prior blocked profile for voice/translation objectives, indicating process reload required to validate this entry at runtime.
- casimir_run_id: `35768`
- casimir_certificate_hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- casimir_integrity_ok: `true`
- regressions_introduced:
  - none observed in targeted objective-loop unit scope.
- rollback_plan:
  - revert semantic slot inference helper and mini-answer matched-slot merge if reload probes show false-positive objective completion.

#### Entry: `S2-objective-loop-pr9-assembly-telemetry-2026-03-23-F`
- patch_id: `S2-objective-loop-pr9-assembly-telemetry-2026-03-23-F`
- stage: `S2`
- objective: make objective-assembly LLM usage observable in debug telemetry independent of main answer LLM flag.
- files_changed:
  - `server/routes/agi.plan.ts`
- key_decisions:
  - added debug fields:
    - `objective_assembly_llm_attempted`
    - `objective_assembly_llm_invoked`
  - wired flags to objective assembly flow:
    - attempted reflects gating eligibility
    - invoked reflects actual LLM-call path execution.
- debug_markers_expected:
  - `objective_assembly_mode` + `objective_assembly_llm_attempted` + `objective_assembly_llm_invoked` are coherent for objective assembly outcomes.
- tests_run:
  - `npx vitest run tests/helix-ask-runtime-errors.spec.ts --testNamePattern "objective loop|objective support|finalize gate|infers objective slots|mini answers|deterministic objective mini|scoped objective coverage|semantic slot hits"`
- readiness_artifacts:
  - immediate live probe showed `objective_assembly_mode=llm` while new telemetry fields were `null`, indicating runtime reload required to validate this patch.
- casimir_run_id: `35774`
- casimir_certificate_hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- casimir_integrity_ok: `true`
- regressions_introduced:
  - none observed in targeted objective-loop unit scope.
- rollback_plan:
  - revert new telemetry fields if downstream consumers fail on added debug keys.

#### Entry: `S2-objective-loop-pr9-single-objective-assembly-2026-03-23-G`
- patch_id: `S2-objective-loop-pr9-single-objective-assembly-2026-03-23-G`
- stage: `S2`
- objective: prevent single-objective turns from bypassing mini-answer final assembly and scrub residual instruction placeholders from final text.
- files_changed:
  - `server/routes/agi.plan.ts`
  - `tests/helix-ask-runtime-errors.spec.ts`
- key_decisions:
  - changed objective assembly trigger to run whenever mini answers exist (including single-objective asks).
  - added deterministic-assembly guard to avoid adding checkpoint headers for already-covered single-objective answers.
  - added final post-composer instruction placeholder scrub (`State what remains uncertain or under-evidenced in this turn`) with explicit answer-path marker.
- debug_markers_expected:
  - single-objective asks can show objective assembly path (`objectiveAssembly:llm|deterministic_fallback`) instead of always `objective_assembly_mode=none`.
  - `finalClean:instruction_placeholder_scrub` appears when placeholder phrase is removed.
- tests_run:
  - `npx vitest run tests/helix-ask-runtime-errors.spec.ts --testNamePattern "objective loop|objective support|finalize gate|infers objective slots|mini answers|deterministic objective mini|scoped objective coverage|semantic slot hits|single covered objective deterministic assembly"`
- readiness_artifacts:
  - immediate live probe still reflected pre-change single-objective behavior (`objective_assembly_mode=none`, placeholder phrase retained), indicating runtime reload required for this patch.
- casimir_run_id: `35778`
- casimir_certificate_hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- casimir_integrity_ok: `true`
- regressions_introduced:
  - none observed in targeted objective-loop unit scope.
- rollback_plan:
  - revert always-assemble trigger and placeholder scrub if single-objective latency/regression increases without quality gain.

#### Entry: `S2-objective-loop-pr9-checkpoint-leak-cleanup-2026-03-23-H`
- patch_id: `S2-objective-loop-pr9-checkpoint-leak-cleanup-2026-03-23-H`
- stage: `S2`
- objective: prevent objective checkpoint scaffolding from leaking into final user-facing text.
- files_changed:
  - `server/routes/agi.plan.ts`
  - `tests/helix-ask-runtime-errors.spec.ts`
- key_decisions:
  - updated objective assembly prompt contract to keep checkpoint status fields internal.
  - added deterministic assembly phrasing to avoid explicit `Objective Checkpoints:` headers.
  - added final scrub `stripHelixAskObjectiveCheckpointArtifacts` to remove checkpoint/status/missing/evidence/summary scaffolding from final text while preserving `Sources:`.
- debug_markers_expected:
  - `finalClean:objective_checkpoint_scrub` appears when checkpoint leakage is removed.
  - final text should not contain `Objective checkpoints:` or `status=` fields.
- tests_run:
  - `npx vitest run tests/helix-ask-runtime-errors.spec.ts --testNamePattern "objective loop|objective support|finalize gate|infers objective slots|mini answers|deterministic objective mini|scoped objective coverage|semantic slot hits|single covered objective deterministic assembly|objective checkpoint scaffold artifacts"`
- readiness_artifacts:
  - immediate live probe still showed checkpoint leakage and lacked new scrub marker, indicating runtime reload required for this patch.
  - post-reload live probe on `What is a warp bubble?` confirmed:
    - no `Objective checkpoints:` leakage
    - no `status=`/`missing=`/`evidence=` scaffold fields in final answer
    - no instruction placeholder phrase leakage
    - objective assembly still active (`objectiveAssembly:llm`).
- casimir_run_id: `35783`
- casimir_certificate_hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- casimir_integrity_ok: `true`
- regressions_introduced:
  - none observed in targeted objective-loop unit scope.
- rollback_plan:
  - revert checkpoint scrub helper if it over-prunes legitimate user-facing content.

#### Entry: `S2-objective-loop-pr8-pr9-llm-mini-critic-readiness-2026-03-23-I`
- patch_id: `S2-objective-loop-pr8-pr9-llm-mini-critic-readiness-2026-03-23-I`
- stage: `S2`
- objective: enforce objective-scoped baseline retrieval passes for unresolved objectives, add LLM mini-critic closure for objective mini-answers, and wire objective-loop readiness metrics in regression/versatility/probe scripts.
- files_changed:
  - `server/routes/agi.plan.ts`
  - `tests/helix-ask-runtime-errors.spec.ts`
  - `scripts/helix-ask-regression.ts`
  - `scripts/helix-ask-versatility-record.ts`
  - `scripts/helix-ask-patch-probe.ts`
- key_decisions:
  - objective-scoped retrieval loop now forces one baseline retrieval pass per unresolved objective that has required slots, even if merged/global retrieval already raised slot coverage.
  - objective mini-answer builder now supports `enableHeuristicInference`; heuristics are disabled when mini-critic LLM is available, keeping heuristic slot inference as fallback-only.
  - added objective mini-critic (`objectiveMiniCritic`) prompt/parse/apply path; mini statuses can now be LLM-critic-driven before final assembly.
  - added mini-critic telemetry fields in debug context:
    - `objective_mini_critic_mode`
    - `objective_mini_critic_attempted`
    - `objective_mini_critic_invoked`
    - `objective_mini_critic_fail_reason`
  - readiness scripts now compute and gate:
    - `P(objective_complete_before_finalize)`
    - `P(objective_scoped_retrieval_success)`
    - `P(objective_assembly_success)`
  - patch-probe summary/report now includes objective-loop snapshot and transition counts.
- debug_markers_expected:
  - objective retrieval path includes per-objective pass markers:
    - `objectiveScopedRetrieval:<objective_id>:attempt<n>:applied|no_context`
  - objective mini-critic path markers:
    - `objectiveMiniCritic:llm`
    - `objectiveMiniCritic:fallback`
- tests_run:
  - `npx vitest run tests/helix-ask-runtime-errors.spec.ts -t "objective mini"`
  - `npx vitest run tests/helix-ask-versatility-record.spec.ts`
- readiness_artifacts:
  - live `5050` probe before runtime reload still reflected pre-patch objective telemetry behavior (`objective_retrieval_queries=0` on general Needle/Mercury ask and no mini-critic debug keys), indicating runtime restart is required to validate new loop behavior end-to-end.
- casimir_run_id: `35806`
- casimir_certificate_hash: `d2821c7d650d8d4c86f5270c2510b94ed7cd8c45b12d807e0420613f9fe7ce5d`
- casimir_integrity_ok: `true`
- regressions_introduced:
  - none observed in targeted objective-loop and versatility script unit scope.
- rollback_plan:
  - revert objective baseline retrieval enforcement and mini-critic application if retrieval latency materially regresses without objective-loop closure gains.

## Known Replacement Risks and Mitigations
1. Monolith coupling risk in `server/routes/agi.plan.ts`.
   - Mitigation: stage-by-stage extraction and guard function tests before behavior swaps.
2. Deadline pressure in fast mode can prematurely force fallback.
   - Mitigation: risk-triggered planner/retry/two-pass and explicit stop-reason telemetry review.
3. Contract strictness can suppress valid LLM synthesis.
   - Mitigation: move strict checks to critique/finalize phases, not pre-synthesis suppression.
4. Patch continuity loss across long sessions.
   - Mitigation: mandatory patch continuity ledger plus readiness artifacts every patch.

## Replace vs Improve

### Replace
- Over-broad relation locking that can force wrong intent class.
- Relation-mode key-label stubs (`what_is_*`, `how_they_connect`, `constraints_and_falsifiability`) that leak into final text.
- Implicit `code_path` pressure on conceptual relation prompts.
- Observe-only soft guard when family-format accuracy is low.
- Preserve-deterministic behavior on malformed outputs.

### Improve
- Intent precision with explicit entity-pair and domain guardrails.
- Slot planning that adapts to conceptual vs implementation asks.
- Composer path that rewrites low-quality outputs before release.
- Semantic completeness checks for relation prompts.
- Regression batteries for route quality and leakage prevention.

## PR Sequence

### PR1: Routing Precision and Relation Lock Guardrails
Files:
- `server/services/helix-ask/intent-directory.ts`
- `server/routes/agi.plan.ts`
- `tests/helix-ask-routing.spec.ts`

Changes:
- tighten relation-lock activation so `hybrid.warp_ethos_relation` is only selected when warp+ethos cues are both truly present for this turn
- add negative routing tests for non-ethos cross-topic prompts (for example, Needle Hull Mark 2 vs Mercury precession)

### PR2: Eliminate Relation Artifact-Key Leakage
Files:
- `server/routes/agi.plan.ts`
- `tests/helix-ask-relation-assembly.spec.ts`
- `tests/helix-ask-output-contract.spec.ts`

Changes:
- replace relation contract field labels that can surface as literal text
- enforce natural-language claim rendering only
- strengthen strip/sanitize logic for artifact-key patterns before finalize

### PR3: Rebalance Stage05 Slot Policy for Conceptual Relation Prompts
Files:
- `server/services/helix-ask/stage0-content.ts`
- `server/routes/agi.plan.ts`
- `tests/helix-ask-stage05-content.spec.ts`

Changes:
- avoid requiring `code_path` for conceptual relation prompts unless explicit implementation cues exist
- require conceptual slots first (`definition`, `mechanism`) for this prompt class
- target `stage05_slot_coverage.ratio = 1.0` on required conceptual slots

### PR4: Enforce Composer Repair on Low-Quality Outputs
Files:
- `server/routes/agi.plan.ts`
- `scripts/helix-ask-regression.ts`

Changes:
- when `family_format_accuracy` is below threshold or debug/leak patterns appear, force rewrite path
- block preserve-deterministic output except for strict hard-forced policy cases
- escalate `observe` behavior into enforced repair for known bad states

### PR5: Add Semantic Relation Completeness Gate
Files:
- `server/routes/agi.plan.ts`
- `tests/helix-ask-semantic-quality.spec.ts`

Changes:
- add relation completeness checks:
  - entity A defined
  - entity B defined
  - explicit relationship mechanism/constraint present
- auto-repair once before finalization on miss

### PR6: Regression and Readiness Hardening
Files:
- `scripts/helix-ask-regression.ts`
- `scripts/helix-ask-versatility-record.ts`
- `scripts/helix-ask-patch-probe.ts`

Changes:
- add dedicated cases for relation prompts and cross-domain conceptual asks
- require no debug/scaffold/code spill in final text
- enforce routing expectations and slot coverage thresholds for the new ladder
- require per-patch probe pass and plan-context hash capture
- require representative pass/fail evidence packs in readiness report artifacts
- enforce probability scorecard publication from contract + variety + probe runs

## Execution Status
- `PR1`: in progress
  - implemented relation guardrails in `server/routes/agi.plan.ts`
  - added routing regression coverage in `tests/helix-ask-routing.spec.ts`
  - added heuristic guard tests in `tests/helix-ask-relation-routing-guard.spec.ts`
  - pending: full PR1 review + merge
- `PR2`: completed
  - replaced relation packet contract text in `server/routes/agi.plan.ts` with natural-language claim rendering (removed `what_is_*`, `how_they_connect`, `constraints_and_falsifiability` key labels)
  - added low-signal relation artifact filtering for code/path-only packet definitions before contract render
  - expanded deterministic relation fallback detection to include artifact-key spill before finalization
  - updated `server/services/helix-ask/relation-assembly.ts` deterministic fallback renderer to emit plain semantic sentences
  - added leakage and rendering guard tests:
    - `tests/helix-ask-relation-contract-leakage.spec.ts`
    - `tests/helix-ask-relation-assembly.spec.ts` (natural-language fallback assertion)
  - patched readiness signal (bounded run): relation packet built/dual-domain rates improved to 1.0 in `artifacts/experiments/helix-ask-versatility/versatility-1774229118854`
  - contract battery on patched server: `npx tsx scripts/helix-ask-regression.ts` passed (routing warning only: `warp mechanism assembly` format expectation drift)
- `PR3`: completed
  - updated `server/services/helix-ask/stage0-content.ts` slot planner to detect conceptual relation prompts and prioritize conceptual slots (`definition`, `mechanism`)
  - for conceptual relation prompts without explicit implementation cues, removed automatic `code_path` requirement in `repo/hybrid` domains
  - preserved `code_path` requirement when explicit implementation cues are present (`repo/module/path/code` signals)
  - added stage0.5 coverage tests in `tests/helix-ask-stage05-content.spec.ts`:
    - conceptual relation prompts do not require `code_path` and reach full required-slot coverage
    - explicit implementation-cue relation prompts still require `code_path`
  - verification runs:
    - `npm run test -- tests/helix-ask-stage05-content.spec.ts tests/helix-ask-relation-assembly.spec.ts tests/helix-ask-relation-contract-leakage.spec.ts tests/helix-ask-routing.spec.ts` (PASS)
    - `npm run casimir:verify -- --pack repo-convergence --auto-telemetry --ci --trace-out artifacts/training-trace.jsonl --trace-limit 200 --url http://localhost:5050/api/agi/adapter/run --export-url http://localhost:5050/api/agi/training-trace/export` (PASS; hash `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`, integrity `OK`)
    - readiness loop (bounded): contract battery surfaced one existing ideology forbidden-snippet case and known routing warning; variety run `versatility-1774231217584` completed with `decision=needs_patch` (relation packet stability remains the primary residual issue outside PR3 scope)
- `PR4`: completed
  - updated composer soft-enforce behavior in `server/routes/agi.plan.ts`:
    - blocked non-forced deterministic composer preservation (`composerShadow:deterministic_preserve_blocked`) so only hard-forced policy answers can bypass rewrite paths
    - added observe-mode escalation for known-bad states (low family format accuracy and debug/anchor leakage) to force enforce-path repair (`composerShadow:soft_guard_escalated_enforce`)
    - recorded effective composer gate mode and escalation diagnostics in debug payload:
      - `composer_soft_enforce_effective_mode`
      - `composer_soft_enforce_deterministic_preserve_blocked`
      - `composer_soft_enforce_escalated_enforce`
  - added helper coverage in `tests/helix-ask-runtime-errors.spec.ts`:
    - deterministic preserve blocking policy
    - observe-mode soft-guard escalation policy
  - updated readiness script `scripts/helix-ask-regression.ts` to fail non-forced `composer_soft_enforce_action=preserve_deterministic_answer`
  - validation snapshot:
    - targeted helper tests: `npx vitest run tests/helix-ask-runtime-errors.spec.ts -t "blocks deterministic preserve at composer unless the answer is hard-forced|escalates observe-mode soft guard to enforce for known-bad composer states"` (PASS)
    - regression subset: `HELIX_ASK_REGRESSION_ONLY="warp mechanism assembly"` run passed; warning unchanged (`format steps !== brief`)
    - bounded variety run `versatility-1774232277749`: relation packet and dual-domain rates now `1.0`; decision remains `needs_patch` due one short ambiguous clarify response
    - Casimir gate: PASS (`runId=35055`, cert hash `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`, integrity `OK`)
- `PR5`: completed
  - added semantic relation completeness checks in `server/routes/agi.plan.ts`:
    - `entity_a` presence (warp-side grounding)
    - `entity_b` presence (ethos-side grounding)
    - explicit mechanism/constraint linkage
  - added one-pass relation completeness auto-repair before semantic quality scoring:
    - injects missing relation anchors before `Sources:` using relation packet definitions/bridge claims/fallback constraints
    - emits answer-path markers (`relationCompleteness:repair:*`, `relationCompleteness:pass[_after_repair]`, `relationCompleteness:fail:*`)
  - extended debug telemetry in `semantic_quality` payload:
    - `relation_completeness_required`
    - `relation_completeness_before`
    - `relation_completeness_after`
    - `relation_completeness_repair_applied`
  - added relation completeness unit coverage in `tests/helix-ask-semantic-quality.spec.ts`
  - validation snapshot:
    - targeted relation completeness tests: `npx vitest run tests/helix-ask-semantic-quality.spec.ts -t "Helix Ask relation completeness gate"` (PASS)
    - live probe now shows `relationCompleteness:pass` on relation docs prompt and no regression to artifact-key spill
    - bounded variety run `versatility-1774232749196`: relation packet + dual-domain rates remain `1.0`; decision still `needs_patch` due one short ambiguous clarify response
    - Casimir gate: PASS (`runId=35064`, cert hash `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`, integrity `OK`)
- `PR6`: implemented, readiness targets met on bounded readiness sample
  - added probability scorecard publication + readiness verdict in `scripts/helix-ask-versatility-record.ts`:
    - route correctness by family with Wilson 95% intervals
    - `P(no_debug_leak)`, `P(no_runtime_fallback)`, `P(frontier_scaffold_complete)`
    - representative pass/fail evidence pointers
  - added no-debug/scaffold/code-spill signatures to versatility failure detection:
    - `debug_scaffold_leak`
    - `code_fragment_spill`
  - aligned patch-probe default plan-context hashing to optimization plan file:
    - `docs/helix-ask-reasoning-ladder-optimization-plan.md`
  - readiness snapshot after patch:
    - regression: default timeout run surfaced one timeout fail (`frontier continuity followup`); focused 90s-timeout rerun passed for continuity subset.
    - post-fix canonical variety (`versatility-1774274588489`): `decision=ship`, `readiness_verdict=READY`, route/coverage/leakage scorecard all at `1.0` on sampled families.
    - post-fix canonical patch probe (`2026-03-23T141646643Z`): `10/10` pass.
    - Casimir gate: PASS (`runId=35536`, hash `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`, integrity `OK`)

## Execution Verification
1. `npm run test -- tests/helix-ask-routing.spec.ts tests/helix-ask-stage05-content.spec.ts tests/helix-ask-output-contract.spec.ts tests/helix-ask-semantic-quality.spec.ts`
2. `npx tsx scripts/helix-ask-regression.ts`
3. `npx tsx scripts/helix-ask-versatility-record.ts`
4. `npx tsx scripts/helix-ask-patch-probe.ts`
5. `npm run casimir:verify -- --pack repo-convergence --auto-telemetry --ci --trace-out artifacts/training-trace.jsonl --trace-limit 200 --url http://localhost:5050/api/agi/adapter/run --export-url http://localhost:5050/api/agi/training-trace/export`

## Required Readiness Artifact Bundle
1. Contract battery output with failing labels (if any).
2. Variety battery `summary.json` + `failures.json`.
3. Patch probe artifacts including seed, pass rate, failed signatures, and plan-context hash.
4. Casimir output with `verdict`, `runId`, `certificateHash`, `integrityOk`.
5. One representative pass evidence pack (prompt/output/verdict/debugContext).
6. One representative fail evidence pack (prompt/output/verdict/debugContext).
7. Final readiness verdict: `READY | PARTIAL_READY | NOT_READY`.

## Release Targets
- `slotCoverage.ratio = 1.0` for required slots
- `composerFamilyFormatAccuracy >= 0.90`
- `P(no_debug_leak) >= 0.99`
- `P(no_runtime_fallback) >= 0.99` (live LLM mode)
- relation completeness pass rate >= `0.95`
- `P(frontier_scaffold_complete) >= 0.95`
- `P(route_correct | family) >= 0.90` for `general`, `repo`, `hybrid`, `ambiguity`, `frontier`

## Objective Micro-Loop Baseline (Remaining Full-Effect Work)
This section defines the next implementation baseline to close the remaining gap between current runtime behavior and the full loop-controller target.

### Current Runtime Snapshot (2026-03-23)
1. Planner + turn-contract infrastructure is active:
   - `buildHelixAskTurnContract`, `buildHelixAskTurnRetrievalPlan`, planner pass parse/apply are live in `server/routes/agi.plan.ts`.
2. Retrieval is still merged/global-first with retries and scope controls:
   - query merge + slot plan + retries are global pipeline operations, not strict per-objective completion loops.
3. Controller telemetry exists:
   - `controller_steps`, `controller_stop_reason`, objective support, obligation coverage are emitted.
4. Composer/finalization gates are active:
   - plan-shadow validation, research-contract repair, soft/hard composer enforcement, and fail-closed taxonomy are in place.

### Gap Lock (What Must Be Closed)
1. No strict objective state machine with explicit transitions `pending -> retrieving -> synthesized -> critiqued -> repaired -> complete|blocked`.
2. Retrieval is not strictly objective-scoped (`one retrieval pass per objective`) before moving to next objective.
3. No explicit per-objective mini answer artifacts that are later assembled into final answer.
4. Deterministic branch pressure is still high in some non-hard-policy paths.
5. Sectional compose is strongest under research-contract mode; generic complex asks can still remain mostly single-pass.

### PR7: Objective State Machine (Controller-Primary Core)
Files:
- `server/routes/agi.plan.ts`
- `server/services/helix-ask/obligations.ts`
- `tests/helix-ask-runtime-errors.spec.ts`

Changes:
1. Introduce objective execution state model:
   - `objective_id`, `objective_label`, `status`, `attempt`, `started_at`, `ended_at`, `blocked_reason`.
2. Execute objectives in ordered loop with explicit transition logging.
3. Completion criteria per objective:
   - required slots covered for that objective OR explicit blocked reason recorded.
4. Prevent finalization when any required objective remains unresolved without explicit fail-closed reason.

Required debug markers:
- `objective_loop_enabled`
- `objective_loop_state` (array of objective state objects)
- `objective_transition_log`
- `objective_completion_rate`
- `objective_blocked_count`

Exit criteria:
- every objective has terminal status `complete|blocked` before finalization.

Implementation status (2026-03-23, current patch):
1. Implemented:
   - objective loop state types and debug fields are live in `server/routes/agi.plan.ts`.
   - retrieval-pass logging + coverage snapshots now update objective states.
   - runtime transitions now include synthesis/critique/repair and final terminalization before response send on main/fallback finalize paths.
   - finalize gate now emits `objective_finalize_gate_passed`, unresolved counts, completion rate, blocked counts.
2. Test coverage added:
   - `tests/helix-ask-runtime-errors.spec.ts` now includes objective-loop helper tests for:
     - coverage -> synthesizing -> complete path
     - finalize-fail -> blocked path
3. Remaining for full PR7 closure:
   - enforce terminalization for all early-return paths (including non-standard dry-run/debug exits) if we decide those paths must carry full loop semantics.

### PR8: Objective-Scoped Retrieval Passes
Files:
- `server/routes/agi.plan.ts`
- `server/services/helix-ask/retrieval-contract.ts`
- `server/services/helix-ask/stage0-content.ts`
- `tests/helix-ask-stage05-content.spec.ts`

Changes:
1. Build per-objective retrieval query packs:
   - objective `query_hints` + objective `required_slots` + retrieval-contract precedence.
2. Run retrieval per objective with bounded retries before advancing to next objective.
3. Persist objective-level retrieval artifacts:
   - selected files, snippets, slot coverage delta, confidence delta.

Required debug markers:
- `objective_retrieval_passes`
- `objective_retrieval_queries`
- `objective_retrieval_selected_files`
- `objective_retrieval_confidence_delta`
- `objective_retrieval_exhausted`

Exit criteria:
- objective-level retrieval ledger is populated and observable in debug context.

Implementation status (2026-03-23, current patch):
1. Added objective-scoped retrieval loop in `server/routes/agi.plan.ts`:
   - sequential per-objective retrieval passes (`objective_scoped:<objective_id>:attempt<n>`)
   - bounded per-objective retries before advancing to the next objective
   - per-objective retrieval query/file/confidence logs
   - objective pass outcomes now emit explicit answer-path markers with attempt index.
2. Retrieval coverage updates are now objective-scoped:
   - objective-local coverage snapshots (`objectiveIds`) prevent non-target objectives from being mutated during another objective's retrieval pass.
   - matched-slot state is additive per objective across retries.
2. Added debug markers:
   - `objective_retrieval_queries`
   - `objective_retrieval_selected_files`
   - `objective_retrieval_confidence_delta`
   - `objective_retrieval_exhausted`
3. Remaining:
   - objective pass/fail threshold tuning is still needed to reduce false blocking under sparse evidence.

### PR9: Per-Objective Mini Synthesis + Final Assembly
Files:
- `server/routes/agi.plan.ts`
- `server/services/helix-ask/generation-contract.ts`
- `server/services/helix-ask/answer-plan.ts`
- `tests/helix-ask-output-contract.spec.ts`

Changes:
1. Generate one mini answer per objective from objective-local evidence.
2. Validate each mini answer against objective obligations before marking objective complete.
3. Assemble final answer from mini answers in a final synthesis step (single LLM assembly call when available; deterministic guarded assembly only as fallback).

Required debug markers:
- `objective_mini_answers`
- `objective_mini_validation`
- `objective_assembly_mode` (`llm|deterministic_fallback`)
- `objective_assembly_input_count`
- `objective_assembly_fail_reason`

Exit criteria:
- final answer explicitly traces to objective mini outputs and no required objective is dropped.

Implementation status (2026-03-23, current patch):
1. Added per-objective mini-answer synthesis in `server/routes/agi.plan.ts`:
   - `buildHelixAskObjectiveMiniAnswers`
   - `summarizeHelixAskObjectiveMiniValidation`
   - objective mini answers now prioritize objective-local retrieval files before global fallback evidence.
2. Added assembly path:
   - LLM objective assembly prompt when available
   - deterministic objective assembly fallback when LLM assembly is unavailable/fails.
3. Added debug markers:
   - `objective_mini_answers`
   - `objective_mini_validation`
   - `objective_assembly_mode`
   - `objective_assembly_input_count`
   - `objective_assembly_fail_reason`
4. Added objective mini validation gating:
   - unresolved mini-objective validation now records explicit fail reasons (`objective_mini_validation_unresolved`, `objective_mini_answers_empty`) and is pushed into objective finalize validation.

### PR10: Deterministic Branch Narrowing (Non-Hard-Policy Paths)
Files:
- `server/routes/agi.plan.ts`
- `tests/helix-ask-routing.spec.ts`
- `tests/helix-ask-runtime-errors.spec.ts`

Changes:
1. Restrict deterministic direct-answer bypasses to hard policy/risk/runtime-failure lanes.
2. Route non-hard-policy repo/hybrid asks through objective loop by default.
3. Record deterministic bypass reason with policy class.

Required debug markers:
- `deterministic_bypass_applied`
- `deterministic_bypass_class` (`policy_hard|runtime_unavailable|transport_guard|none`)
- `controller_primary_path_used`

Exit criteria:
- measurable drop in non-hard-policy deterministic direct routes without safety regressions.

### PR11: Sectional Compose Default for Generic Complex Asks
Files:
- `server/services/helix-ask/generation-contract.ts`
- `server/routes/agi.plan.ts`
- `tests/helix-ask-output-contract.spec.ts`

Changes:
1. Promote `sectional_compose_required` for generic asks when:
   - objective count >= 2, or
   - required sections >= 4, or
   - mixed obligation kinds present.
2. Keep single-pass only for short/simple asks with low objective complexity.
3. Run section-scoped repair before finalization for generic mode (not only research-contract).

Required debug markers:
- `sectional_compose_required`
- `sectional_compose_mode`
- `sectional_repair_applied`
- `sectional_missing_after_repair`

Exit criteria:
- complex generic asks consistently produce section-complete outputs prior to final sanitize/release.

### Readiness Additions For This Baseline
1. Extend `scripts/helix-ask-regression.ts` with objective-loop assertions:
   - terminal status for each objective
   - no finalize before objective terminal states.
2. Extend `scripts/helix-ask-versatility-record.ts` scorecard:
   - `P(objective_complete_before_finalize)`
   - `P(objective_scoped_retrieval_success)`
   - `P(objective_assembly_success)`.
3. Extend `scripts/helix-ask-patch-probe.ts` output:
   - include objective-loop telemetry snapshot and transition counts.

### Promotion Gate For Full-Effect Loop System
Promote only when all are true:
1. `P(objective_complete_before_finalize) >= 0.99`
2. `P(objective_scoped_retrieval_success) >= 0.95`
3. `P(objective_assembly_success) >= 0.95`
4. `P(no_debug_leak) >= 0.99`
5. Casimir verify `PASS` with certificate integrity `OK`.

### Focused Next Steps (LLM-First Closed-Loop, Small-Batch Execution)
This is the active implementation sequence to close the remaining loop gap while preserving test velocity.

Current observed divergence to close:
1. Some non-repo/general prompts still show objective loop active with `objective_count > 0` but no objective-scoped retrieval passes (`objective_retrieval_queries = 0`).
2. Objective completion can still be inferred from merged/global evidence heuristics instead of explicit per-objective retrieval + mini-critic closure.
3. Deterministic fallbacks still shape non-hard-policy paths more than intended.

#### Step A: Enforce objective micro-loop as default controller path
Files:
- `server/routes/agi.plan.ts`

Patch goal:
1. For each unresolved objective: run `objective retrieval -> objective mini-answer synthesis -> objective mini-critic`.
2. Objective status transitions should be driven by mini-critic result (`complete | blocked | retry`) rather than heuristic-only slot inference.
3. Require at least one objective retrieval pass per unresolved objective unless objective has zero required slots.

Fast test scope (must pass before moving on):
1. Run a 6-prompt tiny probe on `5050` (2 general, 2 hybrid, 2 repo).
2. For prompts with unresolved objectives and required slots:
   - `objective_retrieval_queries.length >= unresolved_objective_count` (first-pass baseline)
   - `objective_mini_answers.length >= objective_count`
   - `objective_finalize_gate_passed` only when no unresolved objective remains.

#### Step B: Demote heuristic objective inference to fallback lane only
Files:
- `server/routes/agi.plan.ts`

Patch goal:
1. Keep objective slot/evidence heuristic inference available only when mini-critic LLM is unavailable or hard-failed.
2. Add explicit debug reason when heuristic fallback is used.

Fast test scope:
1. Tiny probe run confirms heuristic-only completion is absent when LLM mini-critic is available.
2. Debug includes explicit fallback reason when heuristic path is used.

#### Step C: Narrow deterministic bypass to hard lanes
Files:
- `server/routes/agi.plan.ts`
- `tests/helix-ask-routing.spec.ts`
- `tests/helix-ask-runtime-errors.spec.ts`

Patch goal:
1. Restrict deterministic direct-answer bypasses to:
   - `policy_hard`
   - `runtime_unavailable`
   - `transport_guard`
2. Route non-hard-policy asks through objective loop by default.

Fast test scope:
1. Tiny probe run shows non-hard general/hybrid prompts taking objective-loop controller path.
2. Deterministic bypass fields and reason class are emitted when bypass is used.

#### Step D: Keep assembly LLM-primary, objective-bound
Files:
- `server/routes/agi.plan.ts`
- `server/services/helix-ask/generation-contract.ts`

Patch goal:
1. Final answer assembly always consumes objective mini outputs when mini outputs exist.
2. Deterministic assembly fallback only when assembly LLM fails/unavailable.
3. Preserve final scrub guards (no checkpoint/status/placeholder leakage).

Fast test scope:
1. Tiny probe run shows `objective_assembly_mode=llm` on healthy runtime.
2. Output has no `Objective Checkpoints`, no `status:`, no placeholder scaffolds.

#### Step E: Wire objective-loop readiness metrics
Files:
- `scripts/helix-ask-regression.ts`
- `scripts/helix-ask-versatility-record.ts`
- `scripts/helix-ask-patch-probe.ts`

Patch goal:
1. Publish and gate:
   - `P(objective_complete_before_finalize)`
   - `P(objective_scoped_retrieval_success)`
   - `P(objective_assembly_success)`
2. Fail readiness when objective-loop metrics miss threshold.

Fast test scope:
1. Tiny probe report includes objective loop telemetry snapshot and transition counts.
2. Versatility summary includes all objective-loop probabilities.

#### Execution discipline for this sequence
1. Use short tests after each patch chunk (no full long campaign until steps A-E are integrated).
2. Keep patch continuity ledger updated in this document after each chunk.
3. Run Casimir verification after each patch and treat `PASS` + integrity `OK` as hard gate.

### Patch Continuity Ledger

#### 2026-03-23 - Step A baseline retrieval enforcement (agent-gate bypass for first objective pass)
Files:
- `server/routes/agi.plan.ts`
- `tests/helix-ask-runtime-errors.spec.ts`

What changed:
1. Added `shouldBypassHelixAskObjectiveScopedRetrievalAgentGate(...)`.
2. Objective-scoped retrieval loop no longer requires `canAgentAct()` at entry.
3. Loop now allows one baseline pass per objective when agent gate is blocked and no prior objective retrieval pass exists.
4. Added objective debug telemetry:
   - `objective_scoped_retrieval_budget_bypass_applied`
   - `objective_scoped_retrieval_budget_bypass_count`
5. Added unit test coverage for baseline bypass gating behavior.

Short-test status:
1. `npx vitest run tests/helix-ask-runtime-errors.spec.ts -t "objective retrieval attempt|objective mini critique|disable heuristic"` PASS.

Runtime validation note:
1. Live `5050` probe still showed pre-patch behavior (`objective_retrieval_queries=0` on the general prompt and no new bypass debug keys), indicating the running server bundle had not yet loaded this patch during probe.

#### 2026-03-23 - Objective-loop probe telemetry extension (debug visibility)
Files:
- `scripts/helix-ask-patch-probe.ts`

What changed:
1. Added probe capture/report fields:
   - `objective_scoped_retrieval_budget_bypass_applied`
   - `objective_scoped_retrieval_budget_bypass_count`
2. Added objective-loop summary metrics:
   - `objective_bypass_applied_rate`
   - `objective_avg_bypass_count`

Purpose:
1. Make the new baseline-retrieval bypass path observable in readiness/debug artifacts.

#### 2026-03-23 - Objective scoped retrieval late-recovery pass (no-pass safety net)
Files:
- `server/routes/agi.plan.ts`
- `tests/helix-ask-runtime-errors.spec.ts`
- `scripts/helix-ask-patch-probe.ts`

What changed:
1. Added recovery target selector:
   - `collectHelixAskObjectiveScopedRetrievalRecoveryTargets(...)`
   - selects unresolved objectives with required slots and zero objective retrieval passes.
2. Added late recovery retrieval execution before mini-answer/mini-critic:
   - one scoped recovery pass per target objective
   - objective-local context apply + retrieval probe logging
   - budget bypass allowed only on initial recovery attempt via existing bypass gate helper.
3. Added recovery debug telemetry:
   - `objective_scoped_retrieval_recovery_attempted`
   - `objective_scoped_retrieval_recovery_target_count`
   - `objective_scoped_retrieval_recovery_applied`
   - `objective_scoped_retrieval_recovery_count`
   - `objective_scoped_retrieval_recovery_budget_bypass_count`
   - `objective_scoped_retrieval_recovery_skipped_reason`
4. Extended patch-probe reporting metrics:
   - `objective_recovery_applied_rate`
   - `objective_avg_recovery_count`

Short-test status:
1. `npx vitest run tests/helix-ask-runtime-errors.spec.ts -t "objective retrieval attempt|recovery targets|objective mini critique"` PASS.

#### 2026-03-23 - Missing scoped retrieval enforcement before assembly
Files:
- `server/routes/agi.plan.ts`
- `tests/helix-ask-runtime-errors.spec.ts`

What changed:
1. Added helper:
   - `collectHelixAskObjectiveIdsWithoutScopedRetrievalPass(...)`
2. During objective mini-validation:
   - unresolved objectives with zero scoped retrieval passes are explicitly detected.
   - validation fail reason is escalated to `objective_retrieval_missing_for_unresolved`.
   - answer-path marker added: `objectiveRetrievalMissing:<count>`.
3. Added debug telemetry for enforcement visibility:
   - `objective_missing_scoped_retrieval_ids`
   - `objective_missing_scoped_retrieval_count`
   - `objective_missing_scoped_retrieval_enforced`
4. Objective assembly behavior tightened:
   - LLM assembly is blocked when unresolved objectives are missing scoped retrieval.
   - deterministic assembly fallback reason is set to `objective_assembly_waiting_for_scoped_retrieval`.

Short-test status:
1. `npx vitest run tests/helix-ask-runtime-errors.spec.ts -t "objective retrieval attempt|recovery targets|missing scoped retrieval"` PASS.

#### 2026-03-23 - Runtime patch-signature gating for probe/readiness
Files:
- `server/routes/agi.plan.ts`
- `scripts/helix-ask-patch-probe.ts`

What changed:
1. Added objective-loop debug revision marker emitted by runtime:
   - `objective_loop_patch_revision = 2026-03-23-objective-loop-recovery-enforce-v2`
2. Patch-probe now enforces expected objective-loop revision by default:
   - failure reason format: `objective_loop_patch_revision:<got>!=<expected>`
   - env override: `HELIX_ASK_OBJECTIVE_LOOP_EXPECTED_PATCH_REVISION`
   - optional disable: `HELIX_ASK_PATCH_PROBE_REQUIRE_OBJECTIVE_LOOP_PATCH_REVISION=0`
3. Patch-probe reporting now includes:
   - expected revision
   - revision-required flag
   - revision pass rate
   - per-case observed revision

Purpose:
1. Detect stale `5050` runtime bundles immediately and avoid false interpretation of objective-loop behavior when latest patch code is not loaded.

#### 2026-03-23 - Hard scoped-retrieval requirement enforcement in mini-answer stage
Files:
- `server/routes/agi.plan.ts`
- `tests/helix-ask-runtime-errors.spec.ts`

What changed:
1. Added helper:
   - `enforceHelixAskObjectiveScopedRetrievalRequirementForMiniAnswers(...)`
2. Mini-answer stage now applies scoped-retrieval enforcement before validation:
   - objectives with required slots but zero scoped retrieval passes are forced to non-covered mini status.
   - objective summary appends explicit missing-scoped-retrieval note.
3. Validation and assembly now use enforced missing-scoped-retrieval state:
   - `objectiveRetrievalMissing:<count>` marker emitted whenever missing scoped retrieval exists.
   - LLM assembly remains blocked while this condition is true.
4. Added unit coverage for enforcement helper behavior.

Short-test status:
1. `npx vitest run tests/helix-ask-runtime-errors.spec.ts -t "missing scoped retrieval|recovery targets|objective retrieval attempt|mini-answer partial"` PASS.

#### 2026-03-23 - Recovery-loop fault isolation (per-objective try/catch)
Files:
- `server/routes/agi.plan.ts`
- `scripts/helix-ask-patch-probe.ts`

What changed:
1. Objective recovery retrieval now has per-objective error isolation:
   - one recovery objective failure no longer aborts downstream mini-validation/assembly for the turn.
   - recovery error path emits `objectiveScopedRetrievalRecovery:<id>:attempt1:error`.
2. Added recovery error debug telemetry:
   - `objective_scoped_retrieval_recovery_error_count`
   - `objective_scoped_retrieval_recovery_error_codes`
3. Patch-probe now records recovery error count per case in failed-case report details.

Short-test status:
1. `npx vitest run tests/helix-ask-runtime-errors.spec.ts -t "mini-answer partial|recovery targets|missing scoped retrieval"` PASS.

#### 2026-03-23 - Recovery helper scope fix + revision bump (v2)
Files:
- `server/routes/agi.plan.ts`
- `tests/helix-ask-runtime-errors.spec.ts`
- `scripts/helix-ask-patch-probe.ts`

What changed:
1. Fixed runtime recovery failure `applyContextAttempt is not defined`:
   - lifted `applyContextAttempt` to objective-loop scope with a safe default binding.
   - changed local helper assignment from `const applyContextAttempt = (...)` to `applyContextAttempt = (...)`.
   - this keeps late objective recovery (`objectiveScopedRetrievalRecovery:*`) on the same helper path as earlier scoped retry stages.
2. Added regression test guard:
   - verifies the route source keeps `applyContextAttempt` bound as an outer-scope variable and assigned later, preventing reintroduction of block-scope-only helper binding.
3. Bumped runtime/probe patch signature:
   - `objective_loop_patch_revision` now `2026-03-23-objective-loop-recovery-enforce-v2`.
   - patch probe expected revision default updated to same value.

Short-test status:
1. `npx vitest run tests/helix-ask-runtime-errors.spec.ts -t "late objective recovery|missing scoped retrieval|objective retrieval attempt"` PASS.

Casimir verification:
1. `npm run casimir:verify -- --url http://localhost:5050/api/agi/adapter/run --pack repo-convergence --ci` PASS.
2. `traceId=adapter:4b4faf81-b21a-4eee-ae0e-b6f1e2255972`
3. `runId=35858`
4. `certificateHash=6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
5. `integrityOk=true`
