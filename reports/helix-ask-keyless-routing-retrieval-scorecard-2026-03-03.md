# Helix Ask Keyless Routing/Retrieval Scorecard (2026-03-03)

- Execution mode: `DEV_KEYLESS`
- Attribution verdict: `routing-driven + retrieval-driven bottlenecks still active` (post-retrieval improvements not sufficient for readiness)

## Prompt chain summary

| Prompt | Scope | Status |
| --- | --- | --- |
| Prompt 0 | Intake baseline lock | ✅ complete |
| Prompt 1 | Routing correctness hardening | ✅ complete |
| Prompt 2 | Retrieval scoring/retention hardening | ✅ partial (term extraction patch + ablation artifact regeneration from latest known runbook baseline) |
| Prompt 3 | Evaluation strictness | ⚠️ validation exposed false-green risks; patch still required |
| Prompt 4 | Synthesis | ✅ complete |

## Baseline vs current (keyless)

| Metric | Baseline | Current |
| --- | ---: | ---: |
| intent_id_correct_rate | 0 | 0 (no measured lift yet) |
| intent_mismatch | 90 | 90 (no measured lift yet) |
| relation pass_rate | 0 | 0 (still blocked) |
| retrieval recall@10 | 0.011364 | 0.011364 (atlas-on lanes) |
| retrieval retention | 0.011364 | 0.011364 (atlas-on lanes) |
| retrieval MRR@10 | 0.001894 | 0.002273 (best atlas-on/git-off variant) |

## Prompt 2 retrieval delta section

Ablation artifact set:
- `artifacts/experiments/helix-ask-keyless-chain/<run-id>/retrieval-ablation/`

Observed lane signal (from latest deterministic comparison artifacts):
1. Atlas lane remains dominant positive contributor.
2. Git-tracked lane does not yet show positive recall delta in this slice.
3. Absolute retrieval metrics remain bottleneck-grade low.

## Promotion posture

- Classification: `KEYLESS_NEEDS_PATCH`
- Required next checkpoint: `PRE_RELEASE_KEYED_SMOKE` only after Prompt 3 blockers are fixed in keyless regression.
