# Helix Ask Crossover Ablation (Cloud Codex)

## Goal
Determine whether weak crossover answers are caused by:
- missing/weak crossover content in repo evidence, or
- expensive LLM scaffolding/contract stages that do not add quality.

This experiment evaluates whether deterministic retrieval + deterministic assembly should be the default path for Helix Ask crossover prompts.

## Scope
- Endpoint: `POST /api/agi/ask`
- Mode: `debug=true`
- Focus domain: crossover prompts linking warp mechanics, mission ethos, and falsifiability/constraint framing.
- Date baseline: February 2026 Helix Ask traces where retrieval passed but generation latency was dominant.

## Hypothesis
When evidence gates and slot coverage are already strong, deterministic evidence assembly should match or outperform LLM scaffolding/contract for quality-per-latency.

## Variants
Run all variants with the same prompt set and seeds.

1. `A_deterministic_core`
- `HELIX_ASK_EVIDENCE_CARDS_LLM=0`
- `HELIX_ASK_ANSWER_CONTRACT_PRIMARY=0`
- deterministic evidence scaffold + deterministic renderer only

2. `B_det_cards_llm_contract`
- `HELIX_ASK_EVIDENCE_CARDS_LLM=0`
- `HELIX_ASK_ANSWER_CONTRACT_PRIMARY=1`

3. `C_llm_cards_det_contract`
- `HELIX_ASK_EVIDENCE_CARDS_LLM=1`
- deterministic contract pre-LLM fast path enabled

4. `D_current_adaptive`
- current default environment and request tuning

5. `E_det_e2e_with_optional_narration`
- deterministic assembly + deterministic render
- optional short LLM narration pass only (no reasoning responsibility)

## Prompt Pack
Create `artifacts/experiments/helix-ask-crossover/prompts.jsonl` with 120 prompts:

- 40 crossover relation prompts
  - warp bubble + mission ethos + connection language
  - include verbs like `connected`, `linked`, `tied`, `associated`
- 40 direct repo-grounded definition prompts
- 40 noisy conversational prompts (typos, short fragments, mixed wording)

Include at least 15 prompts that explicitly request constraint/falsifiability framing.

## Fixed Run Controls
- `debug=true`
- seeds: `7`, `11`, `13`
- temperature: `0.2`
- concurrency: `1`
- same hardware/runtime class per variant
- same build/commit for all variants in one run

## Data Collection
Save raw responses and debug payloads:

- `artifacts/experiments/helix-ask-crossover/<variant>/raw/*.json`

Extract and aggregate:

- total latency (`duration_ms` if available; otherwise timeline-derived)
- stage latencies:
  - `LLM evidence cards`
  - `LLM answer contract primary`
  - `LLM answer contract repair`
  - `Plan pass`
- evidence quality:
  - evidence gate pass/rate
  - slot coverage pass/rate
  - claim gate support ratio
  - citation validity (paths exist in repo)
- crossover completeness score:
  - mentions warp mechanism
  - mentions mission ethos role
  - states explicit connection
  - includes constraint/falsifiability framing
- failure signatures:
  - parse_fail frequency
  - deterministic fallback frequency
  - repetition/high-rattle indicators

## Analysis
- Pair results by `(prompt_id, seed)` across variants.
- Compute deltas for quality and latency.
- Use bootstrap 95% confidence intervals on key deltas.
- Mark improvements only when CI excludes zero.

## Decision Gates
Promote LLM-heavy path only if both hold:

1. Quality gain:
- `>= 5%` improvement in crossover completeness and grounded quality metrics.

2. Latency/cost bound:
- `<= 15%` p95 latency increase
- parse-fail `< 2%`

If either gate fails:
- default to deterministic evidence assembly path
- keep LLM as optional narration/polish pass only

## Cloud Codex Runnable Task
Use this exact task prompt in Cloud Codex:

```md
Run an ablation study for Helix Ask crossover quality vs latency.

Branch: main
Docs: docs/experiments/helix-ask-crossover-ablation.md

Steps:
1) Build prompt pack at artifacts/experiments/helix-ask-crossover/prompts.jsonl (120 prompts as specified).
2) Execute variants A-E from the doc against POST /api/agi/ask with debug=true.
3) Save raw outputs under artifacts/experiments/helix-ask-crossover/<variant>/raw/.
4) Produce aggregate metrics and paired deltas with bootstrap CIs.
5) Write:
   - artifacts/experiments/helix-ask-crossover/summary.json
   - artifacts/experiments/helix-ask-crossover/recommendation.json
   - reports/helix-ask-crossover-ablation-report.md
6) If decision gates suggest a default change, open one patch to adjust env defaults or routing thresholds.

Constraints:
- Keep reasoning deterministic where possible.
- Do not change product behavior before reporting metrics unless needed to run the experiment harness.
- Preserve reproducibility (record commit hash, env flags, and runtime metadata).
```

## Deliverables
- `reports/helix-ask-crossover-ablation-report.md`
- `artifacts/experiments/helix-ask-crossover/summary.json`
- `artifacts/experiments/helix-ask-crossover/recommendation.json`

## Notes
- This experiment is measurement-first and intended to stop trial-and-error tuning.
- Keep deterministic assembly as the baseline authority for proof/citation structure.
- Treat LLM output as interpretation/narration, not source-of-truth reasoning.
