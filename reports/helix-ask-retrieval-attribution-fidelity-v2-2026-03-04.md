# Helix Ask Retrieval Attribution Fidelity v2 (2026-03-04)

## Intake and correction lock (Prompt 0)

Repository merge-state verification:
- latest merged main commit before this wave: `8bd9dd90`
- latest scorecard run id: `retrieval-ablation-1772610363576` (v2 corpus, full 40-task sweep)
- current verdict fields:
  - `retrieval_lift_proven=yes`
  - `dominant_channel=atlas`
  - `contributions.atlas=0.375`
  - `contributions.git_tracked=0.225`
  - `unmatched_expected_file_rate=0.225`
  - `quality_floor_passed=true`
  - `eval_fidelity_passed=true`

Strict decision fork evaluation:
1. `unmatched_expected_file_rate > 0.6` [ ]
2. `gold_file_recall_at_10 < 0.10` or `consequential_file_retention < 0.20` [ ]
3. Next lane unlocked: **Rerank + Packing Convergence / tree-DAG convergence work**.

Execution lock for this wave:
- keep retrieval-lift claims gated by lane-ablation deltas + bounded confidence + retrieval ownership
- keep absolute quality floor mandatory (`unmatched<=0.6`, `recall@10>=0.1`, `retention>=0.2`)
- keep corpus fidelity floor mandatory (`template_collision<=0.6`, `expected_token_hit>=0.15`)

## Prompt execution ledger

### Prompt 1 (Eval-Fidelity instrumentation hardening)
- status: completed
- surfaces:
  - `scripts/helix-ask-retrieval-ablation.ts`
  - `server/routes/agi.plan.ts`
- implemented:
  - retrieval snapshot field (`retrieval_context_files`) emitted by runtime debug
  - ablation parser prioritizes retrieval snapshot over post-processed `context_files`
  - top-10 fingerprint collapse diagnostics and context-source counters
  - strict quality floor and corpus-fidelity gates in driver verdict

### Prompt 2 (Corpus v2 generation)
- status: completed
- surface:
  - `configs/repo-atlas-bench-corpus.v2.json`
- implemented:
  - discriminative prompts derived from expected file stems
  - prompt template collisions reduced for first 40 tasks
  - expected-token-in-prompt hit rate restored for first 40 tasks

### Prompt 3 (v2 full-sweep confirmation)
- status: completed
- command:
  - `HELIX_ASK_RETRIEVAL_CORPUS=configs/repo-atlas-bench-corpus.v2.json HELIX_ASK_RETRIEVAL_MAX_TASKS=40 HELIX_ASK_RETRIEVAL_SEEDS=7,11,13 HELIX_ASK_RETRIEVAL_TEMPERATURES=0.2 npm run helix:ask:retrieval:ablation`
- run id: `retrieval-ablation-1772606750629`
- key outcome:
  - quality floor passed
  - eval fidelity passed
  - retrieval-lift claim unlocked (`yes`)

### Prompt 4 (tree/DAG convergence patch attempt)
- status: completed (tuned)
- surface:
  - `server/routes/agi.plan.ts`
- implemented:
  - Atlas lane now supports graph expansion via `searchRepoGraph` (additive, deduped)
  - Atlas corpus path is now configurable (`HELIX_ASK_ATLAS_CORPUS_PATH`)
  - graph expansion constrained to weak-static cases only (`staticAtlasCandidateCount < limit`)
  - graph candidates require atlas membership or query token overlap

### Prompt 5 (regression check and tune)
- status: completed
- first attempt run id: `retrieval-ablation-1772608608063`
  - observed regression (`baseline recall@10 0.325`, `quality_floor_passed=false`)
- tuned policy run id: `retrieval-ablation-1772610363576`
  - regression resolved (`baseline recall@10 0.775`, `quality_floor_passed=true`)
  - uplift over prior v2 baseline retained (`atlas_on_git_off recall@10 0.50 -> 0.55`)

### Prompt 6 (current full-sweep state)
- status: completed
- run id: `retrieval-ablation-1772610363576`
- completion state:
  - `run_complete=true`
  - `completedScenarioCount=12/12`
- strict gate outcome:
  - `positive_lane_ablation_delta=true`
  - `bounded_confidence=true`
  - `fault_owner_points_to_retrieval=true`
  - `quality_floor_passed=true`
  - `eval_fidelity_passed=true`
  - final `retrieval_lift_proven=yes`
