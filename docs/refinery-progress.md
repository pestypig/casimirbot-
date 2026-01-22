# Refinery Progress Log

## Scope
Track the status of the data-and-policy refinery build so progress stays aligned
with the original math framework and the Phase B9 acceptance gates.

## Current State (latest run)
- Reliability: execution unknowns are 0; safety handled passes 22; safety fails 0; DPO density 1.0; export unblocked.
- Mixture (alpha): alphaRun 0.7911, alphaExport 0.2593 (alphaTarget 0.26), alphaShortfall 0.
- Retrieval quality: holdout candidateRecall 1.0 (avg 1.0), citationRecall
  0.8704, citationPrecision 1.0; coverage candidateRecall 1.0 (avg 1.0),
  citationRecall 0.9014, citationPrecision 1.0; coverage acceptance 0.5432.
- Citation completion: citations stay inside retrieval-selected evidence; completion
  remains enabled when claim heuristics fire.
- Variant reservoir: export used 349 reservoir entries to meet alphaTarget.
- Oracle: indexCoverageRate 0.6765; plannedHitRate 1.0; naiveHitRate 1.0.

Artifacts:
- Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-22T020901366Z.json
- Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-22T020918317Z.json
- Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-22T020943125Z.json
- Seed-mine summary: artifacts/agi-seed-mine.summary.json
- Policy: artifacts/agi-refinery-policy.json
- Execution report: artifacts/agi-refinery-execution-report.json
- Safety report: artifacts/agi-refinery-safety-report.json
- Export: artifacts/agi-refinery-sft.2026-01-22T021025260Z.jsonl
- Export: artifacts/agi-refinery-dpo.2026-01-22T021025260Z.jsonl

## Alignment to the Math Framework
1) p(E|q,K) improved but still gates recall.
   - Candidate recall is high and index coverage is 0.8 (meets 0.80); the     
     remaining recall gap sits in selection/rerank and citation recall.
2) The acceptance gate A(x,tau) is dominated by grounding.
   - Safety and execution are no longer the limiting factors.
3) Mixture constraint is active.
   - alphaRun is above target; export uses alphaTarget 0.26 to avoid the
     0.25 minAlpha edge.

## Phase B9 Status vs Targets
- alphaRun >= 0.25: MET (0.8022).
- Coverage recall >= 0.62 with precision >= 0.75: MET (0.8487 / 1.0).
- candidateRecall >= 0.45: MET (1.0).
- hintRecall >= 0.08: MET (1.0); hintUsedInCitations stable.

## Root Cause Summary
- Phase B9 targets are now met; export gates are unblocked.

## Immediate Next Actions
1) Monitor safety flags after the pii_phone regex tightening (stay at 0 fails).
2) Keep seed-miner batches small and targeted to maintain surface balance.
3) Monitor alphaRun drift; re-run export if alphaExport dips below 0.25.

## Decision Gates
- Only scale training once coverage recall and precision meet targets.
- Only increase variant volume once alphaRun reaches >= 0.25 in mixed runs.

## Phase R (Retrieval Rehabilitation + Mixture Governance)
- R1: Decompose recall into candidate@K, selected@M, citation recall, plus
  hintCandidate/hintSelected/hintUsedInCitations with counts.
- R2: Oracle checks: index coverage (path/symbol queries) and query-plan quality
  (compare naive lexical vs planned queries).
- R3: Hybrid retrieval: lexical + vector fusion (RRF) plus diversity selection
  before rerank to lift candidate recall.
- R4: Hint-driven retrieval: convert hint paths/symbols into targeted retrieval
  constraints and measure candidateRecall uplift.
- R5: Citation integrity: enforce citations only from selected evidence or apply
  citation completion to repair.
- M1: Runtime alpha governor: stop accepting variants when V > ((1-a)/a) * L.
- M2: Anchor mining quotas by surface (client/modules/docs) with deterministic
  prompts.
- M3: Variant reservoir: bank overflow variants and draw only within alpha.

Targets:
- candidateRecall >= 0.45 on balanced coverage holdout.
- coverage recall >= 0.40 with precision >= 0.75.
- alphaRun >= 0.20 (ratchet to 0.25 once anchors rise).
- citations outside selected evidence = 0 or auto-repaired.
