# Helix Ask gap-closure scan report (20260218T210217Z)

## Executive summary
- Requests: 108 across 36 prompts x 3 seeds.
- Avg latency 780.3ms (p95 1555ms).
- Placeholder fallback rate: 38.89%; empty scaffold rate: 30.56%.
- Citation missing rate: 100.00%; short/generic rate: 80.56%.

## Metrics table
| Metric | Threshold | Measured | Pass/Fail |
|---|---:|---:|:---:|
| Non-200 rate | <=2% | 0.00% | PASS |
| Placeholder fallback rate | <=5% | 38.89% | FAIL |
| Empty scaffold rate | <=5% | 30.56% | FAIL |
| Evidence cards empty rate | <=25% | 0.00% | PASS |
| Citation missing rate | <=20% | 100.00% | FAIL |
| Short/generic rate | <=25% | 80.56% | FAIL |
| p95 latency | <=12000ms | 1555ms | PASS |

## Top failure signatures
- citation_missing: 108
- short_or_generic: 87
- placeholder_fallback_applied: 42
- synthesis_mode=empty_scaffold: 33

## Missing topic/tree/DAG bridge inventory
- docs/knowledge/security-hull-guard-tree.json: missing in 99/108 runs
- docs/knowledge/ethos/metric-integrity-guardrail.md: missing in 99/108 runs
- docs/stellar-consciousness-ii.md: missing in 96/108 runs
- docs/papers.md: missing in 96/108 runs
- docs/knowledge/trees/stellar-restoration-tree.md: missing in 96/108 runs
- docs/stellar-consciousness-orch-or-review.md: missing in 95/108 runs
- docs/knowledge/ethos/no-bypass-guardrail.md: missing in 90/108 runs

## Ranked patch plan (diagnostic only)
1. Intent-router tuning for broad open-world prompts to reduce clarify/empty scaffolds.
2. Raise retrieval priority for stellar consciousness docs when life/cosmology entities present.
3. Enforce security-hull/no-bypass guardrail retrieval for cyber-defense prompts.
4. Add evidence-card minimum-card fallback with citation injection guard.
5. Introduce anti-placeholder post-synthesis rewrite when answer length <120 words.
6. Stabilize latency via capped rerank depth and adaptive topK by intent family.
7. Add per-family quality regression suite (seeds 7/11/13) in CI.
8. Expose explicit fallback_reason taxonomy in debug for faster triage.

## 12 sample Q/A pairs with debug highlights
### life_cosmology_consciousness | seed 7 | How does the universe produce life
**Answer**
Math maturity stages describe how confident the repo is in a result (exploratory, diagnostic, or certified). Key questions: Which stage applies and what claims are allowed at that stage? Notes: WARP_AGENTS.md and related...

Math maturity stages describe how confident the repo is in a result (exploratory, diagnostic, or certified). Key questions: Which stage applies and what claims are allowed at that stage? Notes: WARP_AGENTS.md and related...

Math maturity stages describe how confident the repo is in a result (exploratory, diagnostic, or certified).

Mechanism: Math maturity stages describe how confident the repo is in a result (exploratory, diagnostic, or certified). Key questions: Which stage applies and what claims are allowed at that stage? Notes: WARP_AGENTS.md and related... This causes downstream outcomes because multiple linked conditions compound over time rather than acting.

Sources: docs/knowledge/physics/math-maturity-stages.md, client/src/components/ElectronOrbitalPanel.tsx, client/src/hooks/useElectronOrbitSim.ts, server/services/essence/template-synthesizer.ts, modules/dynamic/stress-energy-equations.ts, shared/essence-themes.ts, server/specialists/solvers/philo.synthesis.ts, modules/core/physics-constants.ts
**Debug highlights**
- intent_id: hybrid.concept_plus_system_mapping | intent_strategy: hybrid_explain | report_mode: False | synthesis_mode: deterministic_scaffold | fallback_reason: ambiguity_clarify
- preflight_files: 7 | context_files: 18 | doc_share: 0
- evidence_gate_ok: False | placeholder_fallback_applied: None | live_events: 8
### life_cosmology_consciousness | seed 7 | What are the strongest scientific theories linking consciousness to physical reality?
**Answer**
Unverified:
- No repo-evidenced claims were confirmed yet.

Reasoned connections (bounded):
- Need at least two grounded points before drawing a connection.

Next evidence:
- Searched terms: relationship mapping, repo mapping, system linkage, how does it relate
- Checked files: client/src/components/CavityCrossSectionSplit.tsx, server/helix-core.ts, modules/sim_core/static-casimir.ts, docs/knowledge/ops-deployment-tree.json
- Check files under client or modules.
- Check docs/knowledge/scientific-method.md for "scientific_method".
- Search docs headings for "Current Status: Scientific Foundation Complete ✓".
- Search docs headings for "1. Tile Definition and Physical Assumptions".
**Debug highlights**
- intent_id: hybrid.concept_plus_system_mapping | intent_strategy: hybrid_explain | report_mode: True | synthesis_mode: deterministic_scaffold | fallback_reason: ambiguity_clarify
- preflight_files: 12 | context_files: 18 | doc_share: 0.05555555555555555
- evidence_gate_ok: False | placeholder_fallback_applied: None | live_events: 9
### life_cosmology_consciousness | seed 7 | Is life an inevitable outcome of cosmic evolution or an accident?
**Answer**
Unverified:
- No repo-evidenced claims were confirmed yet.

Reasoned connections (bounded):
- Need at least two grounded points before drawing a connection.

Next evidence:
- Checked files: client/src/physics/polytrope.ts, client/src/pages/potato-threshold-lab.tsx, docs/knowledge/star-hydrostatic.md, client/src/pages/star-hydrostatic-panel.tsx
- Check files under client or docs.
- Search docs headings for "Final outcome".
- Search docs headings for "Action selection (gate outcome -> next action)".
- Search docs headings for "Stellar evolution and ISM fact-check".
**Debug highlights**
- intent_id: hybrid.concept_plus_system_mapping | intent_strategy: hybrid_explain | report_mode: False | synthesis_mode: deterministic_scaffold | fallback_reason: ambiguity_clarify
- preflight_files: 7 | context_files: 7 | doc_share: 0.2857142857142857
- evidence_gate_ok: False | placeholder_fallback_applied: None | live_events: 6
### life_cosmology_consciousness | seed 7 | How should we reason about fine-tuning without overreaching?
**Answer**
DOC_VIEWER_PANEL_ID = "docs-viewer" score=15.000 | symbol=DOC_VIEWER_PANEL_ID.

DOC_VIEWER_PANEL_ID = "docs-viewer" score=15.000 | symbol=DOC_VIEWER_PANEL_ID | file=client/src/lib/docs/docViewer.ts.

In practice, DOC_VIEWER_PANEL_ID = "docs-viewer" score=15.000 | symbol=DOC_VIEWER_PANEL_ID | file=client/src/lib/docs/docViewer.ts.

Sources: client/src/lib/utils/no-physics.ts, server/energy-pipeline.ts, modules/dynamic/dynamic-casimir.ts, shared/schema.ts, server/security/hull-guard.ts
**Debug highlights**
- intent_id: general.fallback | intent_strategy: general_explain | report_mode: False | synthesis_mode: deterministic_scaffold | fallback_reason: None
- preflight_files: 6 | context_files: 18 | doc_share: 0.05555555555555555
- evidence_gate_ok: True | placeholder_fallback_applied: True | live_events: 10
### ai_financial_defense_cybersecurity | seed 7 | How can a Human protect itself from an AI financial hack
**Answer**
", "bodyMD": "Concurrency guard middleware (server/middleware/concurrency-guard.ts).\n\nMinimal artifact:...

", "bodyMD": "Concurrency guard middleware (server/middleware/concurrency-guard.ts).\n\nMinimal artifact:...

", "bodyMD": "Concurrency guard middleware (server/middlewa...

Mechanism: ", "bodyMD": "Concurrency guard middleware (server/middleware/concurrency-guard.ts).\n\nMinimal artifact:... This causes downstream outcomes because multiple linked conditions compound over time rather than acting in isolation.

Safety actions: enable MFA on financial accounts, lock/freeze credit files, verify payment requests through a second channel, and set real-time bank alerts.

Sources: server/middleware/concurrency-guard.ts, docs/knowledge/security-hull-guard-tree.json, server/auth/jwt.ts, server/security/hull-guard.ts, server/routes/hull.capsules.ts, client/src/components/CurvaturePhysicsPanel.tsx, server/auth/types.ts, server/auth/policy.ts
**Debug highlights**
- intent_id: hybrid.concept_plus_system_mapping | intent_strategy: hybrid_explain | report_mode: False | synthesis_mode: deterministic_scaffold | fallback_reason: None
- preflight_files: 7 | context_files: 18 | doc_share: 0
- evidence_gate_ok: True | placeholder_fallback_applied: True | live_events: 10
### ai_financial_defense_cybersecurity | seed 7 | Design a household cyber-defense plan against AI-driven phishing and fraud.
**Answer**
Unverified:
- No repo-evidenced claims were confirmed yet.

Reasoned connections (bounded):
- Need at least two grounded points before drawing a connection.

Next evidence:
- Searched terms: mission ethos
- Checked files: server/routes/ethos.ts, docs/ethos/ideology.json, docs/ethos/why.md, client/src/pages/why.tsx
- Check files under docs.
- Check docs/knowledge/deep-mixing.md for "deep_mixing".
- Search docs headings for "Dignified Exit Design".
- Search docs headings for "Impermanence by Design".
**Debug highlights**
- intent_id: hybrid.concept_plus_system_mapping | intent_strategy: hybrid_explain | report_mode: True | synthesis_mode: deterministic_scaffold | fallback_reason: ambiguity_clarify
- preflight_files: 4 | context_files: 5 | doc_share: 0.8333333333333334
- evidence_gate_ok: False | placeholder_fallback_applied: None | live_events: 9
### ai_financial_defense_cybersecurity | seed 7 | What controls should small businesses deploy first against AI-enabled account takeover?
**Answer**
Answer grounded in retrieved evidence.

Sources: server/auth/jwt.ts, server/security/hull-guard.ts, server/routes/hull.capsules.ts, shared/hull-basis.ts, modules/sim_core/static-casimir.ts, server/auth/policy.ts, server/auth/types.ts
**Debug highlights**
- intent_id: general.fallback | intent_strategy: general_explain | report_mode: False | synthesis_mode: empty_scaffold | fallback_reason: None
- preflight_files: 6 | context_files: 18 | doc_share: 0
- evidence_gate_ok: True | placeholder_fallback_applied: True | live_events: 10
### ai_financial_defense_cybersecurity | seed 7 | How do I set up transaction limits and alerts to reduce financial blast radius?
**Answer**
Answer grounded in retrieved evidence.

1. Answer grounded in retrieved evidence.

Sources: server/qi/qi-saturation.ts, shared/skills.ts, modules/core/physics-constants.ts, server/services/essence/store.ts, server/utils/phase-calibration.ts, server/db/essence-activity.ts, server/instruments/pump-multitone.ts
**Debug highlights**
- intent_id: general.general_how_to_process | intent_strategy: general_explain | report_mode: False | synthesis_mode: empty_scaffold | fallback_reason: None
- preflight_files: 12 | context_files: 18 | doc_share: 0
- evidence_gate_ok: True | placeholder_fallback_applied: True | live_events: 10
### helix_relation_repo_controls | seed 7 | How does Helix Ask decide between report mode and chat mode?
**Answer**
Notes: The gap between current reasoning guards and full scientific-method rigor is tracked in `docs/helix-ask-scientific-method-gap.md`.

Notes: The gap between current reasoning guards and full scientific-method rigor is tracked in `docs/helix-ask-scientific-method-gap.md`.

The Helix Ask reasoning pipeline routes a prompt through intent selection, retrieval, evidence gates, and synthesis, with steps documented in the Helix Ask flow and ladder.

Mechanism: Notes: The gap between current reasoning guards and full scientific-method rigor is tracked in `docs/helix-ask-scientific-method-gap.md`. This causes downstream outcomes because multiple linked conditions compound over time rather than acting in isolation.

Sources: docs/knowledge/helix-ask-reasoning.md, docs/helix-ask-flow.md, docs/helix-ask-ladder.md, server/routes/agi.plan.ts, docs/helix-ask-scientific-method-gap.md, docs/knowledge/helix-ask-tree.json, docs/BUSINESS_MODEL.md, docs/knowledge/platonic-reasoning.md
**Debug highlights**
- intent_id: hybrid.concept_plus_system_mapping | intent_strategy: hybrid_explain | report_mode: True | synthesis_mode: deterministic_scaffold | fallback_reason: ambiguity_clarify
- preflight_files: 0 | context_files: 3 | doc_share: 1
- evidence_gate_ok: False | placeholder_fallback_applied: None | live_events: 11
### helix_relation_repo_controls | seed 7 | Which debug fields reveal routing and synthesis decisions in Helix Ask?
**Answer**
Unverified:
- No repo-evidenced claims were confirmed yet.

Reasoned connections (bounded):
- Need at least two grounded points before drawing a connection.

Next evidence:
- Searched terms: helix ask, helix ask flow, helix ask pipeline, buildGroundedAskPrompt
- Checked files: docs/helix-ask-flow.md, docs/knowledge/helix-ask-reasoning.md, docs/helix-ask-ladder.md, docs/knowledge/helix-ask-tree.json
- Check files under docs.
- Check docs/knowledge/trees/helix-ask-tree.md for "helix_ask_tree".
- Search docs headings for "Helix Desktop Panels & Helix Start Launch Config".
- Search docs headings for "Helix Ask DAG Node Schema (Evidence-First)".
**Debug highlights**
- intent_id: hybrid.concept_plus_system_mapping | intent_strategy: hybrid_explain | report_mode: True | synthesis_mode: deterministic_scaffold | fallback_reason: ambiguity_clarify
- preflight_files: 0 | context_files: 3 | doc_share: 1
- evidence_gate_ok: False | placeholder_fallback_applied: None | live_events: 11
### helix_relation_repo_controls | seed 7 | How are preflight files chosen and what does doc_share indicate?
**Answer**
Answer grounded in retrieved evidence.

- Definition: Answer grounded in retrieved evidence.

Sources: server/services/hce-share-store.ts, shared/knowledge.ts, modules/dynamic/dynamic-casimir.ts, server/specialists/solvers/philo.synthesis.ts, server/db/essence-activity.ts, server/skills/llm.http.ts, modules/warp/natario-warp.ts
**Debug highlights**
- intent_id: general.fallback | intent_strategy: general_explain | report_mode: False | synthesis_mode: empty_scaffold | fallback_reason: None
- preflight_files: 9 | context_files: 18 | doc_share: 0
- evidence_gate_ok: True | placeholder_fallback_applied: True | live_events: 10
### helix_relation_repo_controls | seed 7 | When does Helix Ask trigger placeholder fallback and how is it exposed?
**Answer**
Unverified:
- No repo-evidenced claims were confirmed yet.

Reasoned connections (bounded):
- Need at least two grounded points before drawing a connection.

Next evidence:
- Searched terms: helix ask, helix ask flow, helix ask pipeline, buildGroundedAskPrompt
- Checked files: client/src/pages/desktop.tsx, client/src/lib/agi/api.ts, docs/helix-ask-flow.md, docs/knowledge/helix-ask-tree.json
- Check files under docs.
- Check docs/knowledge/trees/helix-ask-tree.md for "helix_ask_tree".
- Search docs headings for "Option C Fallback Design: Tagged Section Fallback".
- Search docs headings for "Helix Desktop Panels & Helix Start Launch Config".
**Debug highlights**
- intent_id: hybrid.concept_plus_system_mapping | intent_strategy: hybrid_explain | report_mode: False | synthesis_mode: deterministic_scaffold | fallback_reason: ambiguity_clarify
- preflight_files: 5 | context_files: 3 | doc_share: 1
- evidence_gate_ok: False | placeholder_fallback_applied: None | live_events: 9