# Helix Ask Retrieval Attribution Go/No-Go (2026-03-03)

Source scorecard:
- `reports/helix-ask-retrieval-ablation-scorecard-2026-03-03.json`
- `reports/helix-ask-retrieval-ablation-scorecard-2026-03-03.md`

## Retrieval vs Post-Retrieval Contribution Split
- **Retrieval contribution:** weak / unproven in this sweep slice.
- **Post-retrieval contribution:** dominant candidate for prior observed quality lift.
- Driver signal: retrieval recall/retention/MRR remain near zero across variants in this run.

## Top 3 Bottlenecks by Measured Impact
1. **Expected-file miss rate is maximal** (`unmatched_expected_file_rate ~= 1.0` in current slice).
2. **Recall collapse across all lanes** (`gold_file_recall_at_10 == 0` point estimate for all variants in this run).
3. **No retention lift despite lane toggles** (`consequential_file_retention_rate == 0` throughout).

## Decision
- **Go/No-Go verdict:** **NO-GO** for claiming retrieval-driven improvement.
- **Attribution verdict:** **post-retrieval-driven** until retrieval-lane metrics show material, bounded lift.

## Prioritized Patch Queue (strict)
1. **Eval-fidelity hardening v2 (priority 0)**
   - Expand alias maps beyond current normalization families.
   - Acceptance metric: `unmatched_expected_file_rate <= 0.35` on the same corpus slice.
2. **Adaptive retrieval loop (priority 1)**
   - Continue retrieval while slot/evidence gain remains positive.
   - Acceptance metric: `gold_file_recall_at_10 >= 0.10` and positive delta vs lane-off control.
3. **Rerank objective upgrade (priority 2)**
   - Add atlas-edge + symbol overlap + slot-coverage gain weighting.
   - Acceptance metric: `rerank_mrr10 >= 0.08` with CI95 lower bound above baseline.
4. **Git-tracked lane revalidation (priority 3)**
   - Keep as fallback channel until measurable positive ablation delta appears.
   - Acceptance metric: git-on beats git-off in recall@10 with non-overlapping CI95.

## Immediate Next Actions
1. Re-run the sweep on larger task count (>=40) once lane stability is confirmed.
2. Capture representative pass/fail trace bundle for readiness loop evidence pack.
3. Gate any retrieval-lift product claim on canonicalized scorecard CI95 evidence.
