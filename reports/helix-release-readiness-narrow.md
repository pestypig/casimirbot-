# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: 2621e93d
- git_origin_main: 2621e93d
- git_ahead_behind: 0	0
- provenance_gate_pass: true
- provenance_warnings: none
- decision_grade_ready: true
- provenance_blocked: false
- provenance_hard_blocker_reason: none
- ship_recommendation_blocked_by_hard_blocker: false
- run_id: versatility-1771696975238
- base_url: http://127.0.0.1:5173
- prompts: 45
- seeds: 7,11,13
- temperatures: 0.2
- expected_runs: 135
- total_runs: 135
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 91757
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-release-readiness\narrow\versatility-1771696975238

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 45 | 100.0% | 100.0% | 100.0% | 0.0% | 376 | 846 |
| repo_technical | 45 | 100.0% | 0.0% | 100.0% | 0.0% | 495 | 1238 |
| ambiguous_general | 45 | 100.0% | 0.0% | 100.0% | 0.0% | 616 | 1144 |

## Core Metrics
- intent_id_correct_rate: 100.00%
- report_mode_correct_rate: 100.00%
- relation_packet_built_rate: 100.00%
- relation_dual_domain_ok_rate: 100.00%
- avg_attempts_per_run: 1.00
- p95_attempts_per_run: 1
- stub_text_detected_rate: 0.00%
- deterministic_fallback_relation_rate: 80.00%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 100.00%
- min_text_length_pass_rate: 100.00%
- latency_total_p50_ms: 548
- latency_total_p95_ms: 1195
- latency_retrieval_p50_ms: 112 (samples=132)
- latency_retrieval_p95_ms: 224 (samples=132)
- latency_synthesis_p50_ms: 1 (samples=135)
- latency_synthesis_p95_ms: 17 (samples=135)

## Top Failure Signatures

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: ambiguous_20_how-do-i-triage-failures-quickly
- family: ambiguous_general
- question: How do I triage failures quickly?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [shared/schema.ts] 1. Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [shared/schema.ts] In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [shared/schema.ts] Sources: shared/schema.ts, server/routes/agi.plan.ts, modules/dynamic/dynamic-casimir.ts, temp_prev.ts, scripts/helix-ask-utility-ab.ts, reports/helix-novelty-patch-localcheck-narrow.md, external/whisplay-ai-chatbot/src/cloud-api/server.ts, tools/tokamak-added-value-report.ts

Missing evidence: add directly relevant repo paths or artifact refs to raise confidence.
```

### Worst #2: repo_tech_21_explain-relation-assembly-fallback-rendering-shape-and-intended-usage
- family: repo_technical
- question: Explain relation-assembly fallback rendering shape and intended usage.
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Constraint: The current implementation is a no-op skeleton with a soft software-mix fallback. [client/src/physics/alcubierre.ts] Constraint: The current implementation is a no-op skeleton with a soft software-mix fallback. [client/src/physics/alcubierre.ts] In practice, score=11.500 symbol=validateQuantumInequality file=modules/warp/natario-warp.ts server/services/planner/chat-b.ts export type ResonantPlanCandidate =; score=11.000 symbol=ResonantPlanCandidate file=server/se... Mechanism: Constraint: The current implementation is a no-op skeleton with a soft software-mix fallback. [client/src/physics/alcubierre.ts] -> coupled constraints and feedback operators -> observable outcomes tied to modules/warp/natario-warp.ts, because feedback loops shape the resulting behavior. Maturity (exploratory): this answer is mechanism-grounded but remains non-certified until dedicated tests and certificate-linked evidence are attached. [client/src/physics/alcubierre.ts] Missing evidence: provide higher-fidelity measurements and verification artifacts to move toward diagnostic/certified maturity. [client/src/physics/alcubierre.ts] Sources: client/src/physics/alcubierre.ts, modules/warp/natario-warp.ts, server/services/planner/chat-b.ts, client/src/constants/vis.ts, server/skills/llm.http.ts, shared/skills.ts, modules/dynamic/dynamic-casimir.ts, server/instruments/pump-multitone.ts
```

### Worst #3: repo_tech_29_what-checks-enforce-presence-of-citations-in-repo-hybrid-responses
- family: repo_technical
- question: What checks enforce presence of citations in repo/hybrid responses?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [docs/knowledge/ops-deployment-tree.json] Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [docs/knowledge/ops-deployment-tree.json] -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time. [docs/knowledge/ops-deployment-tree.json] Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts. [docs/knowledge/ops-deployment-tree.json] In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [docs/knowledge/ops-deployment-tree.json] Sources: docs/knowledge/ops-deployment-tree.json, tests/theory-checks.spec.ts, client/src/lib/hud-adapter.ts, server/services/knowledge/citations.ts, shared/agi-specialists.ts, modules/dynamic/dynamic-casimir.ts, .github/workflows/casimir-verify.yml, server/skills/stt.whisper.ts

Missing evidence: add directly relevant repo paths or artifact refs to raise confidence.
```

### Worst #4: ambiguous_30_what-s-the-difference-between-routing-and-assembly
- family: ambiguous_general
- question: What's the difference between routing and assembly?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
(see docs/knowledge/trees/helix-ask-tree.md... In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [docs/knowledge/trees/helix-ask-tree.md] Sources: docs/knowledge/trees/helix-ask-tree.md, docs/knowledge/trees/panel-concepts-tree.md, docs/knowledge/trees/skills-tooling-tree.md, shared/schema.ts, server/routes/agi.plan.ts, modules/dynamic/dynamic-casimir.ts, temp_prev.ts, reports/helix-signal-reliability-heavy.md
```

### Worst #5: relation_04_how-do-we-connect-natario-warp-bubble-constraints-to-mission-ethics
- family: relation
- question: How do we connect Natario warp bubble constraints to mission ethics?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
what_is_warp_bubble: modules/warp/warp-module.ts /** * TheoryRefs: * - vanden-broeck-1999: input normalization + clamps for gamma_VdB */ /** * Warp Bubble Casimir Module * Integrates Natário zero-expansion warp bubble calculations with the m. - What it is: what_is_mission_ethos: Mission ethos is the stewardship policy layer that constrains capability claims to verified, non-harmful operation. [docs/knowledge/warp/warp-bubble.md] - Why it matters: how_they_connect: Mission ethos constrains warp development to measured, auditable checkpoints before deployment. [docs/knowledge/warp/warp-bubble.md] Warp viability certificates enable ethos commitments by binding claims to reproducible evidence. [docs/knowledge/warp/warp-bubble.md] Verification hooks translate design ambition into. [docs/knowledge/warp/warp-bubble.md] - Constraint: constraints_and_falsifiability: Physics bounds: Ford-Roman QI, theta calibration, and GR constraint gates must pass before viability claims. [docs/knowledge/warp/warp-bubble.md] Policy bounds: mission ethos requires stewardship, non-harm, and traceable evidence for operational decisions. [docs/knowledge/warp/warp-bubble.md] Re-run /. In practice, what_is_mission_ethos: Mission ethos is the stewardship policy layer that constrains capability claims to verified, non-harmful operation. [docs/knowledge/warp/warp-bubble.md] Sources: client/src/hooks/use-energy-pipeline.ts, client/src/hooks/useelectronorbitsim.ts, client/src/lib/warp-pipeline-adapter.test.ts, client/src/lib/warp-pipeline-adapter.ts
```

### Worst #6: ambiguous_28_how-can-i-identify-high-impact-failure-categories
- family: ambiguous_general
- question: How can I identify high-impact failure categories?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
score=1.000 symbol=buildSnapshot file=client/src/lib/code-index/snapshot.ts Minimal, strict-scientific REAL renderer. score=4.000 symbol=WarpBubbleCompare. [client/src/lib/gl/capabilities.ts] score=1.000 symbol=WarpBubbleResult file=modules/warp/warp-modul... score=1.000 symbol=buildSnapshot file=client/src/lib/code-index/snapshot.ts Minimal, strict-scientific REAL renderer. score=4.000 symbol=WarpBubbleCompare. [client/src/lib/gl/capabilities.ts] score=1.000 symbol=WarpBubbleResult file=modules/warp/warp-modul... score=11.000 symbol=sizeCanvasSafe file=client/src/lib/gl/capabilities.ts modules/warp/warp-module.ts export interface WarpBubbleResult extends NatarioWarpResult // Module-specific additions moduleVersion: string; calcul... Mechanism: score=1.000 symbol=buildSnapshot file=client/src/lib/code-index/snapshot.ts Minimal, strict-scientific REAL renderer. score=4.000 symbol=WarpBubbleCompare. [client/src/lib/gl/capabilities.ts] score=1.000 symbol=WarpBubbleResult file=modules/warp/warp-modul... -> coupled constraints and feedback operators -> observable outcomes tied to modules/warp/warp-module.ts,. Maturity (exploratory): this answer is mechanism-grounded but remains non-certified until dedicated tests and certificate-linked evidence are attached. [client/src/lib/gl/capabilities.ts] Missing evidence: provide higher-fidelity measurements and verification artifacts to move toward diagnostic/certified maturity. [client/src/lib/gl/capabilities.ts] Sources: client/src/lib/gl/capabilities.ts, modules/warp/warp-module.ts, client/src/lib/code-index/snapshot.ts, server/services/planner/chat-b.ts, server/db/essence.ts, server/routes/agi.debate.ts, server/helix-core.ts, client/src/workers/fractional-scan.ts
```

### Worst #7: repo_tech_13_how-does-goal-zone-harness-evaluate-pass-fail-across-seeds
- family: repo_technical
- question: How does goal-zone harness evaluate pass/fail across seeds?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In practice, score=2.000 symbol=NatarioWarpResult file=modules/warp/natario-warp.ts modules/dynamic/gates/index.ts export interface GateEvaluationOptions score=2.824 symbol=GateEvaluationOptions file=modules/dynamic/gate... In practice, score=2.000 symbol=NatarioWarpResult file=modules/warp/natario-warp.ts modules/dynamic/gates/index.ts export interface GateEvaluationOptions score=2.824 symbol=GateEvaluationOptions file=modules/dynamic/gate... 1. score=11.000 symbol=handleProposalJobEvaluated file=server/services/proposals/engine.ts modules/warp/natario-warp.ts export interface NatarioWarpResult // Geometric amplification geometricBlueshiftFactor: number; // γ... Mechanism: In practice, score=2.000 symbol=NatarioWarpResult file=modules/warp/natario-warp.ts modules/dynamic/gates/index.ts export interface GateEvaluationOptions score=2.824 symbol=GateEvaluationOptions file=modules/dynamic/gate... -> coupled constraints and feedback operators -> observable outcomes tied to modules/warp/natario-warp.ts. Maturity (exploratory): this answer is mechanism-grounded but remains non-certified until dedicated tests and certificate-linked evidence are attached. [server/services/proposals/engine.ts] Missing evidence: provide higher-fidelity measurements and verification artifacts to move toward diagnostic/certified maturity. [server/services/proposals/engine.ts] Sources: server/services/proposals/engine.ts, modules/warp/natario-warp.ts, modules/dynamic/gates/index.ts, modules/warp/warp-module.ts, client/src/lib/whispers/seedwhispers.ts, server/energy-pipeline.ts, client/src/hooks/use-energy-pipeline.ts, client/src/lib/whispers/seedWhispers.ts
```

### Worst #8: ambiguous_12_what-s-a-clean-way-to-structure-a-short-answer
- family: ambiguous_general
- question: What's a clean way to structure a short answer?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [docs/knowledge/trees/panel-concepts-tree.md] In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [docs/knowledge/trees/panel-concepts-tree.md] Sources: docs/knowledge/trees/panel-concepts-tree.md, docs/knowledge/trees/panel-registry-tree.md, docs/knowledge/trees/stellar-restoration-tree.md

Missing evidence: add directly relevant repo paths or artifact refs to raise confidence.
```

### Worst #9: relation_27_how-does-relation-mode-answer-tie-warp-bubble-to-ideology-without-report
- family: relation
- question: How does relation-mode answer tie warp bubble to ideology without report scaffolding?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. [docs/knowledge/warp/warp-bubble.md] - Evidence: Which bubble model is used and where are its constraints checked? [docs/knowledge/warp/warp-bubble.md] - Constraint: repo-specific definition of a warp bubble model. [docs/knowledge/warp/warp-bubble.md] In practice, Which bubble model is used and where are its constraints checked? [docs/knowledge/warp/warp-bubble.md] Sources: docs/knowledge/warp/warp-mechanics-tree.json, modules/warp/warp-module.ts, modules/warp/natario-warp.ts, client/src/lib/warp-uniforms-gate.ts, server/energy-pipeline.ts, client/src/components/ideologypanel.ts, server/routes/ethos.ts, client/src/hooks/use-ideology.ts
```

### Worst #10: repo_tech_08_what-does-api-agi-adapter-run-return-for-pass-fail-and-certificate-data
- family: repo_technical
- question: What does /api/agi/adapter/run return for PASS/FAIL and certificate data?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Measurement must not become coercion; data collection stays minimal and accountable. [docs/knowledge/ethos/data-dignity.md] tsx` so the build step can harvest the same language for offline banks and remote s... [docs/knowledge/ethos/data-dignity.md] Mechanism: Measurement must not become coercion; data collection stays minimal and accountable. [docs/knowledge/ethos/data-dignity.md] -> constrained interaction dynamics -> tsx` so the build step can harvest the same language for offline banks and remote s..., because linked constraints amplify or. [docs/knowledge/ethos/data-dignity.md] Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts. [docs/knowledge/ethos/data-dignity.md] In practice, tsx` so the build step can harvest the same language for offline banks and remote s... [docs/knowledge/ethos/data-dignity.md] Sources: docs/ethos/ideology.json, docs/knowledge/ethos/data-dignity.md, docs/ethos/why.md, shared/schema.ts, server/routes/agi.plan.ts, modules/dynamic/dynamic-casimir.ts, temp_prev.ts, reports/helix-tuner-narrow-rerun.md
```

### Worst #11: relation_30_if-warp-bubble-is-capability-how-does-ethos-govern-its-use
- family: relation
- question: If warp bubble is capability, how does ethos govern its use?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. [docs/knowledge/warp/warp-bubble.md] - Evidence: Which bubble model is used and where are its constraints checked? [docs/knowledge/warp/warp-bubble.md] - Constraint: repo-specific definition of a warp bubble model. [docs/knowledge/warp/warp-bubble.md] In practice, Which bubble model is used and where are its constraints checked? [docs/knowledge/warp/warp-bubble.md] Sources: docs/knowledge/ethos/ethos-knowledge-tree.json, modules/warp/warp-module.ts, modules/warp/natario-warp.ts, client/src/lib/warp-uniforms-gate.ts, server/routes/ethos.ts, server/energy-pipeline.ts, client/src/components/missionethossourcepanel.ts, client/src/hooks/use-energy-pipeline.ts
```

### Worst #12: relation_03_warp-bubble-ideology-relation-what-is-the-bridge
- family: relation
- question: Warp bubble ↔ ideology relation: what is the bridge?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. [docs/knowledge/warp/warp-bubble.md] - Evidence: Which bubble model is used and where are its constraints checked? [docs/knowledge/warp/warp-bubble.md] See modules/warp/warp-m... - Constraint: Which bubble model is used and where are its constraints checked? [docs/knowledge/warp/warp-bubble.md] In practice, Which bubble model is used and where are its constraints checked? [docs/knowledge/warp/warp-bubble.md] See modules/warp/warp-m... Sources: docs/knowledge/warp/warp-bubble.md, modules/warp/warp-module.ts, modules/warp/natario-warp.ts, client/src/lib/warp-uniforms-gate.ts, server/energy-pipeline.ts, client/src/components/ideologypanel.ts, server/routes/ethos.ts, client/src/hooks/use-ideology.ts
```

### Worst #13: relation_19_how-do-certificate-integrity-and-mission-ethos-cohere-for-warp-bubble-wo
- family: relation
- question: How do certificate integrity and mission ethos cohere for warp bubble work?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] - Evidence: The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] Tags: stewardship, compassion; , begin... [docs/knowledge/ethos/mission-ethos.md] In practice, The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] Tags: stewardship, compassion; , begin... [docs/knowledge/ethos/mission-ethos.md] Sources: docs/knowledge/ethos/ethos-knowledge-tree.json, modules/warp/warp-module.ts, client/src/lib/warp-uniforms-gate.ts, server/energy-pipeline.ts, server/routes/ethos.ts, client/src/components/missionethossourcepanel.ts, client/src/hooks/use-energy-pipeline.ts, modules/warp/natario-warp.ts
```

### Worst #14: ambiguous_08_what-s-a-good-way-to-summarize-evidence
- family: ambiguous_general
- question: What's a good way to summarize evidence?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [docs/knowledge/trees/certainty-framework-tree.md] In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [docs/knowledge/trees/certainty-framework-tree.md] Sources: docs/knowledge/trees/certainty-framework-tree.md, client/src/components/warprenderinspector.ts, server/instruments/pump-multitone.ts, modules/dynamic/natario-metric.ts, shared/essence-themes.ts, server/services/console-telemetry/summarize.ts, server/qi/qi-monitor.ts, server/routes/orchestrator.ts

Missing evidence: add directly relevant repo paths or artifact refs to raise confidence.
```

### Worst #15: repo_tech_17_explain-retrieval-confidence-and-deterministic-contract-signal-threshold
- family: repo_technical
- question: Explain retrieval confidence and deterministic contract signal thresholds.
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Timing honesty: if burst < LC, the average claim is not earned. [docs/knowledge/ethos/reciprocity-contract.md] Timing honesty: if burst < LC, the average claim is not earned. [docs/knowledge/ethos/reciprocity-contract.md] Mechanism: Timing honesty: if burst < LC, the average claim is not earned. [docs/knowledge/ethos/reciprocity-contract.md] -> constrained interaction dynamics -> Timing honesty: if burst < LC, the average claim is not earned., because linked constraints amplify or dampen outcomes over time. [docs/knowledge/ethos/reciprocity-contract.md] Mechanism: Timing honesty: if burst < LC, the average claim is not earned. [docs/knowledge/ethos/reciprocity-contract.md] -> coupled constraints and feedback operators -> observable outcomes tied to docs/ethos/ideology.json, because feedback loops shape the resulting behavior. Maturity (exploratory): this answer is mechanism-grounded but remains non-certified until dedicated tests and certificate-linked evidence are attached. [docs/knowledge/ethos/reciprocity-contract.md] Missing evidence: provide higher-fidelity measurements and verification artifacts to move toward diagnostic/certified maturity. [docs/knowledge/ethos/reciprocity-contract.md] Sources: docs/knowledge/ethos/reciprocity-contract.md, docs/ethos/ideology.json, docs/knowledge/knowledge-ingestion-tree.json, docs/ethos/why.md
```

## Recommendation
- decision: ship
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
