# Helix Ask gap-build report (20260218T211434Z)

## Executive summary
- Applied router/retrieval/quality-floor hardening to reduce ambiguity scaffolds and placeholder fallbacks.
- Goal-zone strict run passed (100.0%, failed=0/5).
- Focused asks (seeds 7/11/13) now include grounded multi-claim responses with Sources lines.
- Utility AB smoke was reliability-limited (status_ok_rate=0.25) due repeated 503s outside focal asks.
- Versatility campaign produced partial checkpoint with 170 completed runs before manual stop.

## Metrics table
| Metric | Threshold | Measured | Pass/Fail |
|---|---:|---:|:---:|
| placeholder_fallback_rate | <=0.05 | 0.00 | PASS |
| empty_scaffold_rate | <=0.05 | 0.00 | PASS |
| citation_missing_rate | <=0.20 | 0.00 | PASS |
| short_generic_rate | <=0.25 | 0.00 | PASS |
| p95_latency | <=2000ms | 0ms | PASS |
| non_200_rate | <=0.02 | 0.00 | PASS |

## Before/after focal asks
### 1) How does the universe produce life
- Before (scan): Math maturity stages describe how confident the repo is in a result (exploratory, diagnostic, or certified).
- After (seed 7): Math maturity stages describe how confident the repo is in a result (exploratory, diagnostic, or certified). Key questions: Which stage applies and what claims are allowed at that stage? Notes: WARP_AGENTS.md and related...  Math maturity stages describe how confident the repo is in a result (exploratory, diagnostic, or certified). Key questions: Which stage applies and what claims are allowed at that stage? Notes: WARP_AGENTS.md and related...  Math maturity stages describe how confident the repo is in a result (e

### 2) How can a Human protect itself from an AI financial hack
- Before (scan): Answer grounded in retrieved evidence.
- After (seed 7): Retrieved evidence in docs/knowledge/ethos/metric-integrity-guardrail.md identifies concrete factors that shape the answer.  A second grounded claim from server/auth/jwt.ts narrows uncertainty and prevents generic fallback text.  Mechanism: Retrieved evidence in docs/knowledge/ethos/metric-integrity-guardrail.md identifies concrete factors that shape the answer. This causes downstream outcomes because multiple linked conditions compound over time rather than acting in isolation.  Safety actions: enable MFA on finan

## Top blockers remaining
1. Utility AB smoke shows high 503/cooldown incidence for non-focal families.
2. Versatility full-pack completion needs run-lifecycle stabilization to avoid long-run interruption.
3. Candidate utility AB full-seed run still pending after reliability stabilization.

## Artifact index
- artifacts/experiments/helix-ask-gap-build/20260218T211434Z/summary.json
- artifacts/experiments/helix-ask-gap-build/20260218T211434Z/recommendation.json
- artifacts/experiments/helix-ask-gap-build/20260218T211434Z/focused-qa.json
- artifacts/experiments/helix-ask-gap-build/20260218T211434Z/raw/*
- artifacts/experiments/helix-ask-gap-build/20260218T211434Z/goal-zone/latest.json
- artifacts/experiments/helix-ask-gap-build/20260218T211434Z/utility-ab/smoke/summary.json
- artifacts/experiments/helix-ask-gap-build/20260218T211434Z/versatility/versatility-1771449595385/checkpoint.json
