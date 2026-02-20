# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: codex/tuner-pass-provenance-novelty-runtime
- git_head: afdff88
- git_origin_main: missing
- git_ahead_behind: missing
- provenance_gate_pass: false
- provenance_warnings: git_origin_remote_missing, git_origin_main_ref_missing
- decision_grade_ready: false
- provenance_blocked: true
- provenance_hard_blocker_reason: BLOCKER_PROVENANCE_ORIGIN_REMOTE_MISSING
- ship_recommendation_blocked_by_hard_blocker: true
- run_id: versatility-1771560745373
- base_url: http://127.0.0.1:5173
- prompts: 90
- seeds: 7,11,13
- temperatures: 0.2
- expected_runs: 270
- total_runs: 270
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 231076
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: /workspace/casimirbot-/artifacts/experiments/helix-tuner-heavy-rerun/versatility-1771560745373

## HARD BLOCKER
- status: BLOCKED
- reason: BLOCKER_PROVENANCE_ORIGIN_REMOTE_MISSING
- effect: ship recommendation is disallowed until provenance gate passes with origin/main + HEAD present.

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 90 | 96.7% | 96.7% | 100.0% | 0.0% | 477 | 1300 |
| repo_technical | 90 | 90.0% | 0.0% | 100.0% | 0.0% | 870 | 2041 |
| ambiguous_general | 90 | 93.3% | 0.0% | 100.0% | 0.0% | 818 | 1618 |

## Core Metrics
- intent_id_correct_rate: 96.67%
- report_mode_correct_rate: 100.00%
- relation_packet_built_rate: 96.67%
- relation_dual_domain_ok_rate: 96.67%
- avg_attempts_per_run: 1.00
- p95_attempts_per_run: 1
- stub_text_detected_rate: 0.00%
- deterministic_fallback_relation_rate: 90.00%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 100.00%
- min_text_length_pass_rate: 100.00%
- latency_total_p50_ms: 695
- latency_total_p95_ms: 1929
- latency_retrieval_p50_ms: 240 (samples=241)
- latency_retrieval_p95_ms: 392 (samples=241)
- latency_synthesis_p50_ms: 1 (samples=255)
- latency_synthesis_p95_ms: 7 (samples=255)

## Top Failure Signatures
- runtime_fallback_answer: 15
- intent_mismatch: 3
- relation_packet_built: 3
- relation_dual_domain: 3
- bridge_count_low: 3
- evidence_count_low: 3

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: relation_15_explain-warp-bubble-mission-ethos-for-a-skeptical-engineer
- family: relation
- question: Explain warp bubble + mission ethos for a skeptical engineer.
- failures: intent_mismatch:hybrid.concept_plus_system_mapping, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] Notes: Tags: stewardship, compassion; , beginners-mind, struggle-testament, devotion-course, worldview-integrity (+28 more). [docs/knowledge/ethos/mission-ethos.md] Mechanism: The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] -> coupled constraints and feedback operators -> observable outcomes tied to docs/ethos/ideology.json, because feedback loops shape the resulting behavior. Maturity (exploratory): this answer is mechanism-grounded but remains non-certified until dedicated tests and certificate-linked evidence are attached. [docs/knowledge/ethos/mission-ethos.md] Missing evidence: provide higher-fidelity measurements and verification artifacts to move toward diagnostic/certified maturity. [docs/knowledge/ethos/mission-ethos.md] Sources: docs/knowledge/ethos/mission-ethos.md, docs/ethos/ideology.json, docs/ethos/why.md, modules/warp/warp-module.ts, modules/warp/natario-warp.ts, docs/warp-console-architecture.md, server/routes/ethos.ts, docs/knowledge/ethos/ethos-knowledge-tree.json
```

### Worst #2: repo_tech_11_show-pipeline-stages-captured-in-debug-live-events-for-helix-ask
- family: repo_technical
- question: Show pipeline stages captured in debug live events for Helix Ask.
- failures: runtime_fallback_answer
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=undefined intent_strategy=undefined report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Runtime fallback: Cannot access 'intentProfile' before initialization Sources: server/routes/agi.plan.ts, docs/helix-ask-flow.md.

Runtime fallback: Cannot access 'intentProfile' before initialization. Mechanism: Runtime fallback: Cannot access 'intentProfile' before initialization Sources: server/routes/agi.plan.ts, docs/helix-ask-flow.md. -> constrained interaction dynamics -> Runtime fallback: Cannot access 'intentProfile' before initialization., because. Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Sources: server/routes/agi.plan.ts, docs/helix-ask-flow.md
```

### Worst #3: repo_tech_01_walk-through-api-agi-ask-routing-from-intent-detection-to-final-answer-c
- family: repo_technical
- question: Walk through /api/agi/ask routing from intent detection to final answer cleanup.
- failures: runtime_fallback_answer
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=undefined intent_strategy=undefined report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Runtime fallback: Cannot access 'intentProfile' before initialization Sources: server/routes/agi.plan.ts, docs/helix-ask-flow.md.

Runtime fallback: Cannot access 'intentProfile' before initialization. Mechanism: Runtime fallback: Cannot access 'intentProfile' before initialization Sources: server/routes/agi.plan.ts, docs/helix-ask-flow.md. -> constrained interaction dynamics -> Runtime fallback: Cannot access 'intentProfile' before initialization., because. Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Sources: server/routes/agi.plan.ts, docs/helix-ask-flow.md
```

### Worst #4: ambiguous_01_define-lattice
- family: ambiguous_general
- question: Define lattice.
- failures: runtime_fallback_answer
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=undefined intent_strategy=undefined report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Runtime fallback: Cannot access 'intentProfile' before initialization Sources: server/routes/agi.plan.ts, docs/helix-ask-flow.md.

Runtime fallback: Cannot access 'intentProfile' before initialization. Mechanism: Runtime fallback: Cannot access 'intentProfile' before initialization Sources: server/routes/agi.plan.ts, docs/helix-ask-flow.md. -> constrained interaction dynamics -> Runtime fallback: Cannot access 'intentProfile' before initialization., because. Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Sources: server/routes/agi.plan.ts, docs/helix-ask-flow.md
```

### Worst #5: repo_tech_19_what-are-top-fallback-reasons-emitted-in-debug-for-helix-ask-failures
- family: repo_technical
- question: What are top fallback reasons emitted in debug for helix ask failures?
- failures: runtime_fallback_answer
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=undefined intent_strategy=undefined report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Runtime fallback: Cannot access 'intentProfile' before initialization Sources: server/routes/agi.plan.ts, docs/helix-ask-flow.md.

Runtime fallback: Cannot access 'intentProfile' before initialization. Mechanism: Runtime fallback: Cannot access 'intentProfile' before initialization Sources: server/routes/agi.plan.ts, docs/helix-ask-flow.md. -> constrained interaction dynamics -> Runtime fallback: Cannot access 'intentProfile' before initialization., because. Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Sources: server/routes/agi.plan.ts, docs/helix-ask-flow.md
```

### Worst #6: ambiguous_04_what-is-stability
- family: ambiguous_general
- question: What is stability?
- failures: runtime_fallback_answer
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=undefined intent_strategy=undefined report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Runtime fallback: Cannot access 'intentProfile' before initialization Sources: server/routes/agi.plan.ts, docs/helix-ask-flow.md.

Runtime fallback: Cannot access 'intentProfile' before initialization. Mechanism: Runtime fallback: Cannot access 'intentProfile' before initialization Sources: server/routes/agi.plan.ts, docs/helix-ask-flow.md. -> constrained interaction dynamics -> Runtime fallback: Cannot access 'intentProfile' before initialization., because. Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Sources: server/routes/agi.plan.ts, docs/helix-ask-flow.md
```

### Worst #7: ambiguous_28_how-can-i-identify-high-impact-failure-categories
- family: ambiguous_general
- question: How can I identify high-impact failure categories?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
score=1.000 | symbol=buildSnapshot | file=client/src/lib/code-index/snapshot.ts Minimal, strict-scientific REAL renderer. score=4.000 | symbol=WarpBubbleCompare. [client/src/lib/gl/capabilities.ts] score=1.000 | symbol=WarpBubbleResult | file=modules/warp/... score=1.000 | symbol=buildSnapshot | file=client/src/lib/code-index/snapshot.ts Minimal, strict-scientific REAL renderer. score=4.000 | symbol=WarpBubbleCompare. [client/src/lib/gl/capabilities.ts] score=1.000 | symbol=WarpBubbleResult | file=modules/warp/... score=11.000 | symbol=sizeCanvasSafe | file=client/src/lib/gl/capabilities.ts modules/warp/warp-module.ts export interface WarpBubbleResult extends NatarioWarpResult // Module-specific additions moduleVersion: string; ca... Mechanism: score=1.000 | symbol=buildSnapshot | file=client/src/lib/code-index/snapshot.ts Minimal, strict-scientific REAL renderer. score=4.000 | symbol=WarpBubbleCompare. [client/src/lib/gl/capabilities.ts] score=1.000 | symbol=WarpBubbleResult | file=modules/warp/... -> coupled constraints and feedback operators -> observable outcomes tied to modules/warp/warp-module.ts,. Maturity (exploratory): this answer is mechanism-grounded but remains non-certified until dedicated tests and certificate-linked evidence are attached. [client/src/lib/gl/capabilities.ts] Missing evidence: provide higher-fidelity measurements and verification artifacts to move toward diagnostic/certified maturity. [client/src/lib/gl/capabilities.ts] Sources: client/src/lib/gl/capabilities.ts, modules/warp/warp-module.ts, client/src/lib/code-index/snapshot.ts, server/services/planner/chat-b.ts, server/db/essence.ts, server/routes/agi.debate.ts, server/helix-core.ts, client/src/workers/fractional-scan.ts
```

### Worst #8: repo_tech_16_where-are-citation-allowlists-normalized-before-sanitizesourcesline
- family: repo_technical
- question: Where are citation allowlists normalized before sanitizeSourcesLine?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
const DOCS_PREFIX = "/docs"; const DOC_VIEWER_INTENT_KEY = "helix:doc-viewer:intent";. [server/services/knowledge/citations.ts] const DOC_VIEWER_INTENT_KEY = "helix:doc-viewer:intent";. [server/services/knowledge/citations.ts] const fallback = `$ /papers.md`;. [server/services/knowledge/citations.ts] if (!input) return fallback;. [server/services/knowledge/citations.ts] In practice, const DOC_VIEWER_INTENT_KEY = "helix:doc-viewer:intent";. [server/services/knowledge/citations.ts] Sources: client/src/components/driveguardspanel.ts, server/services/knowledge/citations.ts, shared/agi-specialists.ts, modules/warp/natario-warp.ts, server/security/hull-guard.ts, server/specialists/solvers/index.ts, client/src/lib/docs/docviewer.ts, server/modules/qi/qi-controller.ts
```

### Worst #9: repo_tech_21_explain-relation-assembly-fallback-rendering-shape-and-intended-usage
- family: repo_technical
- question: Explain relation-assembly fallback rendering shape and intended usage.
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Constraint: score=11.500 | symbol=validateQuantumInequality | file=modules/warp/natario-warp.ts. Constraint: score=11.500 | symbol=validateQuantumInequality | file=modules/warp/natario-warp.ts. In practice, score=11.500 | symbol=validateQuantumInequality | file=modules/warp/natario-warp.ts server/services/planner/chat-b.ts export type ResonantPlanCandidate =; score=11.000 | symbol=ResonantPlanCandidate | file=s... Mechanism: Constraint: score=11.500 | symbol=validateQuantumInequality | file=modules/warp/natario-warp.ts. -> coupled constraints and feedback operators -> observable outcomes tied to modules/warp/natario-warp.ts, because feedback loops shape the resulting behavior. Maturity (exploratory): this answer is mechanism-grounded but remains non-certified until dedicated tests and certificate-linked evidence are attached. [client/src/physics/alcubierre.ts] Missing evidence: provide higher-fidelity measurements and verification artifacts to move toward diagnostic/certified maturity. [client/src/physics/alcubierre.ts] Sources: client/src/physics/alcubierre.ts, modules/warp/natario-warp.ts, server/services/planner/chat-b.ts, server/skills/llm.http.ts, shared/skills.ts, modules/dynamic/dynamic-casimir.ts, server/instruments/pump-multitone.ts, server/db/agi.ts
```

### Worst #10: repo_tech_29_what-checks-enforce-presence-of-citations-in-repo-hybrid-responses
- family: repo_technical
- question: What checks enforce presence of citations in repo/hybrid responses?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Answer grounded in retrieved evidence. [docs/knowledge/ops-deployment-tree.json] Mechanism: Answer grounded in retrieved evidence. [docs/knowledge/ops-deployment-tree.json] -> constrained interaction dynamics -> Answer grounded in retrieved evidence., because linked constraints amplify or dampen outcomes over time. [docs/knowledge/ops-deployment-tree.json] Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts. [docs/knowledge/ops-deployment-tree.json] In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [docs/knowledge/ops-deployment-tree.json] Sources: tests/theory-checks.spec.ts, client/src/lib/hud-adapter.ts, server/services/knowledge/citations.ts, shared/agi-specialists.ts, modules/dynamic/dynamic-casimir.ts, .github/workflows/casimir-verify.yml, server/skills/stt.whisper.ts, docs/knowledge/ops-deployment-tree.json
```

### Worst #11: ambiguous_20_how-do-i-triage-failures-quickly
- family: ambiguous_general
- question: How do I triage failures quickly?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [shared/schema.ts] 1. Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [shared/schema.ts] In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [shared/schema.ts] Sources: shared/schema.ts, server/routes/agi.plan.ts, modules/dynamic/dynamic-casimir.ts, temp_prev.ts, scripts/helix-ask-utility-ab.ts, reports/helix-step4-heavy-rerun.md, tools/tokamak-added-value-report.ts, tests/warpfield-lattice.integration.spec.ts

Missing evidence: add directly relevant repo paths or artifact refs to raise confidence.
```

### Worst #12: repo_tech_07_how-are-ambiguity-gates-triggered-and-what-clarify-output-is-produced
- family: repo_technical
- question: How are ambiguity gates triggered and what clarify output is produced?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [docs/knowledge/ui-components-tree.json] In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [docs/knowledge/ui-components-tree.json] Sources: docs/knowledge/ui-components-tree.json, client/src/hooks/use-energy-pipeline.ts, shared/schema.ts, server/helix-core.ts, modules/dynamic/gates/index.ts, tests/hull-tools.spec.ts, modules/core/module-registry.ts, server/specialists/solvers/philo.synthesis.ts

Missing evidence: add directly relevant repo paths or artifact refs to raise confidence.
```

### Worst #13: repo_tech_12_where-is-relation-topology-dual-domain-detection-implemented
- family: repo_technical
- question: Where is relation topology dual-domain detection implemented?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
what_is_warp_bubble: docs/knowledge/warp/warp-bubble.md. 1. what_is_mission_ethos: docs/ethos/ideology.json. 2. how_they_connect: Mission ethos constrains warp development to measured, auditable checkpoints before deployment. [shared/schema.ts] Warp viability certificates enable ethos commitments by binding claims to reproducible evidence. [shared/schema.ts] Verification hooks translate design ambition into. [shared/schema.ts] 3. constraints_and_falsifiability: Physics bounds: Ford-Roman QI, theta calibration, and GR constraint gates must pass before viability claims. [shared/schema.ts] Policy bounds: mission ethos requires stewardship, non-harm, and traceable evidence for operational decisions. [shared/schema.ts] Re-run /. 4. Mechanism: what_is_mission_ethos: docs/ethos/ideology.json. -> constrained interaction dynamics -> how_they_connect: Mission ethos constrains warp development to measured, auditable checkpoints before deployment. [shared/schema.ts] Warp viability certificates enable ethos commit. [shared/schema.ts] 5. Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts. [shared/schema.ts] In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity. [shared/schema.ts] Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity. [shared/schema.ts] Sources: docs/ethos/ideology.json, docs/knowledge/warp/warp-bubble.md
```

### Worst #14: repo_tech_03_where-are-relation-packet-fields-built-and-surfaced-in-debug-payload
- family: repo_technical
- question: Where are relation packet fields built and surfaced in debug payload?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
what_is_warp_bubble: client/src/hooks/use-energy-pipeline.ts export interface GreensPayload kind: GreensKind; m: number; // mass parameter for Helmholtz (0 ⇒ Poisson limit) normalize: boolean; phi: Float32Array; // normalized or raw potentia. 1. what_is_mission_ethos: Mission ethos is the stewardship policy layer that constrains capability claims to verified, non-harmful operation. [modules/dynamic/dynamic-casimir.ts] 2. how_they_connect: Mission ethos constrains warp development to measured, auditable checkpoints before deployment. [modules/dynamic/dynamic-casimir.ts] Warp viability certificates enable ethos commitments by binding claims to reproducible evidence. [modules/dynamic/dynamic-casimir.ts] Verification hooks translate design ambition into. [modules/dynamic/dynamic-casimir.ts] 3. constraints_and_falsifiability: Physics bounds: Ford-Roman QI, theta calibration, and GR constraint gates must pass before viability claims. [modules/dynamic/dynamic-casimir.ts] Policy bounds: mission ethos requires stewardship, non-harm, and traceable evidence for operational decisions. [modules/dynamic/dynamic-casimir.ts] Re-run /. 4. Mechanism: what_is_mission_ethos: Mission ethos is the stewardship policy layer that constrains capability claims to verified, non-harmful operation. [modules/dynamic/dynamic-casimir.ts] -> constrained interaction dynamics -> how_they_connect: Mission ethos constrains warp development to measured. [modules/dynamic/dynamic-casimir.ts] 5. Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts. [modules/dynamic/dynamic-casimir.ts] In practice, what_is_mission_ethos: Mission ethos is the stewardship policy layer that constrains capability claims to verified, non-harmful operation. [modules/dynamic/dyna
```

### Worst #15: ambiguous_30_what-s-the-difference-between-routing-and-assembly
- family: ambiguous_general
- question: What's the difference between routing and assembly?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Minimal artifact: helix ask docs. [docs/knowledge/trees/helix-ask-tree.md] - Evidence: Minimal artifact: helix ask docs. [docs/knowledge/trees/helix-ask-tree.md] (see docs/knowledge/trees/helix-ask-tree.md... In practice, Minimal artifact: helix ask docs. [docs/knowledge/trees/helix-ask-tree.md] (see docs/knowledge/trees/helix-ask-tree.md... Sources: docs/knowledge/trees/helix-ask-tree.md
```

## Recommendation
- decision: blocked_provenance
- [0] Validation provenance gate: Require origin/main + HEAD provenance in reports before accepting decision-grade outcomes.
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
