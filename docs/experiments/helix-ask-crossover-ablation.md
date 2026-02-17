# Helix Ask Crossover Ablation (Cloud Codex)

This experiment measures quality-vs-latency tradeoffs between deterministic and LLM-assisted crossover answer assembly on `POST /api/agi/ask` with `debug=true`.

## Variants
- A_deterministic_core
- B_det_cards_llm_contract
- C_llm_cards_det_contract
- D_current_adaptive
- E_det_e2e_with_optional_narration

## Fixed Controls
- seeds: 7, 11, 13
- temperature: 0.2
- concurrency: 1

## Outputs
- artifacts/experiments/helix-ask-crossover/prompts.jsonl
- artifacts/experiments/helix-ask-crossover/<variant>/raw/*.json
- artifacts/experiments/helix-ask-crossover/summary.json
- artifacts/experiments/helix-ask-crossover/recommendation.json
- reports/helix-ask-crossover-ablation-report.md

## Cloud Codex Runnable Task

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
