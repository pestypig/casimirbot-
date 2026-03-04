# Helix Ask Retrieval Attribution Fidelity v2 (2026-03-04)

## Intake and correction lock (Prompt 0)

Repository merge-state verification (latest retrieval-attribution wave):
- latest merged PR anchor: `465f1900` (`Merge pull request #434`)
- latest local patch baseline: `207eafbf`
- latest scorecard run id: `retrieval-ablation-1772604677480` (full 40-task sweep)
- current verdict fields:
  - `retrieval_lift_proven=no`
  - `dominant_channel=atlas`
  - `contributions.atlas=0.025`
  - `contributions.git_tracked=0`
  - `unmatched_expected_file_rate=0.975`
  - `quality_floor_passed=false`
  - `eval_fidelity_passed=false`

Strict decision fork evaluation:
1. `unmatched_expected_file_rate > 0.6` [x]
2. Required lane: **Eval-Fidelity v2 only**.
3. Coverage-Adaptive Retrieval and Rerank+Packing Convergence remain deferred until fidelity gates improve.

Execution lock for this wave:
- objective is attribution-first eval fidelity hardening
- retrieval-lift claims remain blocked unless lane-ablation deltas are positive with bounded confidence and stage-fault ownership points to retrieval
- absolute quality floor is mandatory (`unmatched<=0.6`, `recall@10>=0.1`, `retention>=0.2`)
- corpus fidelity floor is mandatory (`template_collision<=0.6`, `expected_token_hit>=0.15`)

## Prompt execution ledger

### Prompt 1 (Eval-Fidelity v2 path canonicalization)
- status: completed
- change surface: `scripts/helix-ask-retrieval-ablation.ts`
- implemented:
  - expanded path canonicalization (slash/case/relative/evidence-id normalization)
  - alias-family handling for known migrations (`server/utils`, docs audits/reports swaps)
  - mismatch taxonomy emit (`path_form_mismatch`, `alias_unmapped`, `retrieval_miss`, `context_shape_mismatch`)
  - per-task diagnostics in variant JSON (`mismatchTaxonomy`, normalized expected/retrieved paths)

### Prompt 2 (Stability/completeness hardening)
- status: completed
- implemented:
  - per-variant watchdog timeout with deterministic failure reason
  - partial-run safety artifact: `summary.partial.json`
  - completion contract: `run_complete=true` only when all variant/seed/temp scenarios finish

### Prompt 3 (Stage-fault matrix + attribution guard)
- status: completed
- implemented:
  - stage-fault matrix fields in `driver_verdict.stage_fault_matrix`
  - fault owner classifier (`routing | retrieval | post_processing`)
  - strict retrieval-lift gate requiring positive lane delta + bounded confidence + retrieval fault ownership

### Prompt 4 (Absolute quality floor guard)
- status: completed
- implemented:
  - hard quality-floor gate added to retrieval-lift decision:
    - `unmatched_expected_file_rate <= 0.6`
    - `gold_file_recall_at_10 >= 0.1`
    - `consequential_file_retention_rate >= 0.2`
  - scorecard/go-no-go emit thresholds, observed values, and gate pass/fail status

### Prompt 5 (Retrieval snapshot source + collapse diagnostics)
- status: completed
- change surfaces:
  - `server/routes/agi.plan.ts`
  - `scripts/helix-ask-retrieval-ablation.ts`
- implemented:
  - debug payload now exports `retrieval_context_files` snapshot
  - ablation parser now prefers `retrieval_context_files` over post-processed `context_files`
  - top-10 fingerprint diagnostics added (unique rate, dominant share, collapse flag)
  - context source counters added (`retrieval_context_files | context_files | none`)

### Prompt 6 (Corpus fidelity gate)
- status: completed
- implemented:
  - strict eval-fidelity gate on corpus prompt quality:
    - `prompt_template_collision_rate <= 0.6`
    - `expected_token_hit_rate >= 0.15`
  - retrieval-lift claims now require `eval_fidelity_passed=true`
- full-run outcome (`retrieval-ablation-1772604677480`):
  - `prompt_template_collision_rate=0.900000`
  - `expected_token_hit_rate=0.000000`
  - `eval_fidelity_passed=false`

### Prompt 7 (Full-sweep confirmation)
- status: completed
- required command executed with target settings:
  - `HELIX_ASK_RETRIEVAL_MAX_TASKS=40 HELIX_ASK_RETRIEVAL_SEEDS=7,11,13 HELIX_ASK_RETRIEVAL_TEMPERATURES=0.2 npm run helix:ask:retrieval:ablation`
- full-sweep artifact run id: `retrieval-ablation-1772604677480`
- completion state:
  - `run_complete=true`
  - `completedScenarioCount=12/12`
- strict gate outcome:
  - `positive_lane_ablation_delta=true`
  - `bounded_confidence=true`
  - `fault_owner_points_to_retrieval=true`
  - `quality_floor_passed=false`
  - `eval_fidelity_passed=false`
  - final `retrieval_lift_proven=no`
