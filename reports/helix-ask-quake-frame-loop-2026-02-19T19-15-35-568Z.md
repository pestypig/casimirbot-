# Helix Ask PS2 Runtime Contract (2026-02-19T19-15-35-568Z)

Run config: seeds=7,11,13; temperature=0.2; debug=true.
Reliability preflight: ready_ok=true; smoke_200_rate=1.000; status=ready.

| Gate | Threshold | Measured | Pass |
|---|---:|---:|:--:|
| preflight_ask_200_rate | >= 0.90 | 1.000 | PASS |
| claim_citation_link_rate | >= 0.90 | 1.000 | PASS |
| unsupported_claim_rate | <= 0.10 | 0.000 | PASS |
| contradiction_flag_rate | <= 0.10 | 0.000 | PASS |
| repetition_penalty_fail_rate | <= 0.10 | 0.000 | PASS |
| placeholder_fallback_rate | == 0 | 0.000 | PASS |
| empty_scaffold_rate | == 0 | 0.000 | PASS |
| non_200_rate | <= 0.02 | 0.000 | PASS |
| p95_latency | <= 2500ms | 1297.000 | PASS |

## Before/after snippets
- Q: How does the universe produce life (seed 7)
  - Before: before unavailable
  - After: 1. // Publish a single authoritative phase (warp:phase) for the renderer + overlays. [modules/core/physics-constants.ts] 1. // Publish a single authoritative phase (warp:phase) for the renderer + overlays. [modules/core/physics-constants.ts] // Publish a single authoritative phase (warp:phase) for the renderer + overlays. [modules/core/physics-constants.ts] Mechanism: 1. // Publish a single authoritative phase (warp:
  - Citations: modules/core/physics-constants.ts, client/src/physics/alcubierre.ts, server/services/essence/template-synthesizer.ts, shared/essence-themes.ts, server/specialists/solvers/philo.synthesis.ts, server/helix-core.ts, modules
- Q: How does the universe produce life (seed 11)
  - Before: before unavailable
  - After: 1. // Publish a single authoritative phase (warp:phase) for the renderer + overlays. [modules/core/physics-constants.ts] 1. // Publish a single authoritative phase (warp:phase) for the renderer + overlays. [modules/core/physics-constants.ts] // Publish a single authoritative phase (warp:phase) for the renderer + overlays. [modules/core/physics-constants.ts] Mechanism: 1. // Publish a single authoritative phase (warp:
  - Citations: modules/core/physics-constants.ts, client/src/physics/alcubierre.ts, server/services/essence/template-synthesizer.ts, shared/essence-themes.ts, server/specialists/solvers/philo.synthesis.ts, server/helix-core.ts, modules
- Q: How does the universe produce life (seed 13)
  - Before: before unavailable
  - After: 1. // Publish a single authoritative phase (warp:phase) for the renderer + overlays. [modules/core/physics-constants.ts] 1. // Publish a single authoritative phase (warp:phase) for the renderer + overlays. [modules/core/physics-constants.ts] // Publish a single authoritative phase (warp:phase) for the renderer + overlays. [modules/core/physics-constants.ts] Mechanism: 1. // Publish a single authoritative phase (warp:
  - Citations: modules/core/physics-constants.ts, client/src/physics/alcubierre.ts, server/services/essence/template-synthesizer.ts, shared/essence-themes.ts, server/specialists/solvers/philo.synthesis.ts, server/helix-core.ts, modules
- Q: How can a Human protect itself from an AI financial hack (seed 7)
  - Before: before unavailable
  - After: Mechanism: Answer grounded in retrieved evidence. [docs/knowledge/ethos/metric-integrity-guardrail.md] -> constrained interaction dynamics -> Answer grounded in retrieved evidence., because linked constraints amplify or dampen outcomes over time. [docs/knowledge/ethos/metric-integrity-guardrail.md] Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts. [docs/kno
  - Citations: docs/knowledge/ethos/metric-integrity-guardrail.md, server/auth/jwt.ts, server/security/hull-guard.ts, server/routes/hull.capsules.ts, server/auth/policy.ts, server/auth/types.ts, server/routes/hull.status.ts, docs/knowl
- Q: How can a Human protect itself from an AI financial hack (seed 11)
  - Before: before unavailable
  - After: Mechanism: Answer grounded in retrieved evidence. [docs/knowledge/ethos/metric-integrity-guardrail.md] -> constrained interaction dynamics -> Answer grounded in retrieved evidence., because linked constraints amplify or dampen outcomes over time. [docs/knowledge/ethos/metric-integrity-guardrail.md] Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts. [docs/kno
  - Citations: docs/knowledge/ethos/metric-integrity-guardrail.md, server/auth/jwt.ts, server/security/hull-guard.ts, server/routes/hull.capsules.ts, server/auth/policy.ts, server/auth/types.ts, server/routes/hull.status.ts, docs/knowl
- Q: How can a Human protect itself from an AI financial hack (seed 13)
  - Before: before unavailable
  - After: Mechanism: Answer grounded in retrieved evidence. [docs/knowledge/ethos/metric-integrity-guardrail.md] -> constrained interaction dynamics -> Answer grounded in retrieved evidence., because linked constraints amplify or dampen outcomes over time. [docs/knowledge/ethos/metric-integrity-guardrail.md] Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts. [docs/kno
  - Citations: docs/knowledge/ethos/metric-integrity-guardrail.md, server/auth/jwt.ts, server/security/hull-guard.ts, server/routes/hull.capsules.ts, server/auth/policy.ts, server/auth/types.ts, server/routes/hull.status.ts, docs/knowl
- Q: Why are dreams weird and sometimes coherent (seed 7)
  - Before: before unavailable
  - After: Answer grounded in retrieved evidence. [server/routes/agi.plan.ts] - Definition: Answer grounded in retrieved evidence. [server/routes/agi.plan.ts] In practice, Evidence is limited; add the relevant repo file paths for stronger grounding. [server/routes/agi.plan.ts] Missing evidence: Evidence is limited; add the relevant repo file paths for stronger grounding. [server/routes/agi.plan.ts]
  - Citations: not-present
- Q: Why are dreams weird and sometimes coherent (seed 11)
  - Before: before unavailable
  - After: Answer grounded in retrieved evidence. [server/routes/agi.plan.ts] - Definition: Answer grounded in retrieved evidence. [server/routes/agi.plan.ts] In practice, Evidence is limited; add the relevant repo file paths for stronger grounding. [server/routes/agi.plan.ts] Missing evidence: Evidence is limited; add the relevant repo file paths for stronger grounding. [server/routes/agi.plan.ts]
  - Citations: not-present

Baseline compare: artifacts/experiments/helix-ask-quake-frame-loop/2026-02-19T19-15-35-568Z/baseline-compare.json
Artifacts: artifacts/experiments/helix-ask-quake-frame-loop/2026-02-19T19-15-35-568Z