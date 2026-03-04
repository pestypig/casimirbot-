# Helix Ask Retrieval Attribution Fidelity v2 (2026-03-04)

## Intake and correction lock (Prompt 0)

Repository merge-state verification (latest retrieval-attribution wave):
- latest merged PR anchor: `465f1900` (`Merge pull request #434`)
- latest retrieval-attribution patch commit: `ade486cc`
- latest scorecard run id: `retrieval-ablation-1772598123282` (bounded smoke)
- prior verdict fields:
  - `retrieval_lift_proven=no`
  - `dominant_channel=none`
  - `contributions.atlas=0`
  - `contributions.git_tracked=0`
  - `unmatched_expected_file_rate=1.0`

Strict decision fork evaluation:
1. `unmatched_expected_file_rate > 0.6` [x]
2. Required lane: **Eval-Fidelity v2 only**.
3. Coverage-Adaptive Retrieval and Rerank+Packing Convergence are deferred until fidelity gates improve.

Execution lock for this wave:
- objective is attribution-first eval fidelity hardening
- retrieval-lift claims remain blocked unless lane-ablation deltas are positive with bounded confidence and stage-fault ownership points to retrieval

## Prompt execution ledger

### Prompt 1 (Eval-Fidelity v2)
- status: completed
- change surface: `scripts/helix-ask-retrieval-ablation.ts`
- implemented:
  - expanded path canonicalization (slash/case/relative/evidence-id normalization)
  - alias-family handling for known migrations (`server/utils`, docs audits/reports swaps)
  - mismatch taxonomy emit (`path_form_mismatch`, `alias_unmapped`, `retrieval_miss`, `context_shape_mismatch`)
  - per-task diagnostics in variant JSON (`mismatchTaxonomy`, normalized expected/retrieved paths)
- bounded smoke: `HELIX_ASK_RETRIEVAL_MAX_TASKS=2`

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
- report outputs generated:
  - `reports/helix-ask-retrieval-stage-fault-matrix-2026-03-04.md`
  - `reports/helix-ask-retrieval-attribution-go-no-go-2026-03-03.md`

### Prompt 4 (Final run and handoff)
- status: blocked (deterministic)
- required command executed with target settings:
  - `HELIX_ASK_RETRIEVAL_MAX_TASKS=40 HELIX_ASK_RETRIEVAL_SEEDS=7,11,13 HELIX_ASK_RETRIEVAL_TEMPERATURES=0.2 npm run helix:ask:retrieval:ablation`
- blocked artifact run id: `retrieval-ablation-1772596117022`
- blocked reason:
  - `variant_failed:baseline_atlas_git_on:watchdog_timeout:variant:baseline_atlas_git_on:seed:7:temp:0.2:120000ms`
- completion state:
  - `run_complete=false`
  - `completedScenarioCount=0/12`
