# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: b1dadf33
- git_origin_main: b1dadf33
- git_ahead_behind: 0	0
- provenance_gate_pass: true
- provenance_warnings: none
- decision_grade_ready: true
- provenance_blocked: false
- run_id: versatility-1771532054104
- base_url: http://127.0.0.1:5173
- prompts: 24
- seeds: 7
- temperatures: 0.2
- expected_runs: 24
- total_runs: 24
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 25615
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility-codex-cloud\versatility-1771532054104

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 8 | 87.5% | 87.5% | 100.0% | 0.0% | 566 | 875 |
| repo_technical | 8 | 87.5% | 0.0% | 87.5% | 0.0% | 464 | 1274 |
| ambiguous_general | 8 | 100.0% | 0.0% | 100.0% | 0.0% | 540 | 1379 |

## Core Metrics
- intent_id_correct_rate: 87.50%
- report_mode_correct_rate: 95.83%
- relation_packet_built_rate: 87.50%
- relation_dual_domain_ok_rate: 87.50%
- avg_attempts_per_run: 1.00
- p95_attempts_per_run: 1
- stub_text_detected_rate: 0.00%
- deterministic_fallback_relation_rate: 75.00%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 100.00%
- min_text_length_pass_rate: 100.00%
- latency_total_p50_ms: 566
- latency_total_p95_ms: 1274
- latency_retrieval_p50_ms: 109 (samples=24)
- latency_retrieval_p95_ms: 179 (samples=24)
- latency_synthesis_p50_ms: 1 (samples=24)
- latency_synthesis_p95_ms: 20 (samples=24)

## Top Failure Signatures
- report_mode_mismatch: 1
- intent_mismatch: 1
- relation_packet_built: 1
- relation_dual_domain: 1
- bridge_count_low: 1
- evidence_count_low: 1

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

### Worst #2: repo_tech_15_how-does-the-system-prevent-report-scaffold-responses-for-relation-promp
- family: repo_technical
- question: How does the system prevent report-scaffold responses for relation prompts?
- failures: report_mode_mismatch:true
- likely_root_cause: routing_or_report_mode_policy
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=true relation_packet_built=false relation_dual_domain_ok=false deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
# Trace and Essence System Tree. [docs/knowledge/trees/trace-system-tree.md] # Trace and Essence System Tree. [docs/knowledge/trees/trace-system-tree.md] Mechanism: # Trace and Essence System Tree. [docs/knowledge/trees/trace-system-tree.md] -> constrained interaction dynamics -> # Trace and Essence System Tree., because linked constraints amplify or dampen outcomes over time. [docs/knowledge/trees/trace-system-tree.md] Mechanism: # Trace and Essence System Tree. [docs/knowledge/trees/trace-system-tree.md] -> coupled constraints and feedback operators -> observable outcomes tied to docs/knowledge/trace-system-tree.json, because feedback loops shape the resulting behavior. Maturity (exploratory): this answer is mechanism-grounded but remains non-certified until dedicated tests and certificate-linked evidence are attached. [docs/knowledge/trees/trace-system-tree.md] Missing evidence: provide higher-fidelity measurements and verification artifacts to move toward diagnostic/certified maturity. [docs/knowledge/trees/trace-system-tree.md] Sources: docs/knowledge/trees/trace-system-tree.md, docs/knowledge/trace-system-tree.json, client/src/lib/agi/api.ts, client/src/components/agi/essence.tsx, client/src/components/agi/JobsBudgetModal.tsx, server/db/agi.ts, client/src/components/agi/DebateView.tsx, client/src/components/agi\essence.tsx
```

### Worst #3: ambiguous_20_how-do-i-triage-failures-quickly
- family: ambiguous_general
- question: How do I triage failures quickly?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [server/routes/agi.plan.ts] 1. Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [server/routes/agi.plan.ts] In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity. [server/routes/agi.plan.ts] Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity. [server/routes/agi.plan.ts] Sources: server/routes/agi.plan.ts, docs/helix-ask-flow.md
```

### Worst #4: repo_tech_16_where-are-citation-allowlists-normalized-before-sanitizesourcesline
- family: repo_technical
- question: Where are citation allowlists normalized before sanitizeSourcesLine?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
const DOCS_PREFIX = "/docs"; const DOC_VIEWER_INTENT_KEY = "helix:doc-viewer:intent";. [client/src/lib/docs/docviewer.ts] const DOC_VIEWER_INTENT_KEY = "helix:doc-viewer:intent";. [client/src/lib/docs/docviewer.ts] const fallback = `$ /papers.md`;. [client/src/lib/docs/docviewer.ts] if (!input) return fallback;. [client/src/lib/docs/docviewer.ts] In practice, const DOC_VIEWER_INTENT_KEY = "helix:doc-viewer:intent";. [client/src/lib/docs/docviewer.ts] Sources: client/src/lib/docs/docviewer.ts, client/src/components/driveguardspanel.ts, server/services/knowledge/citations.ts, shared/agi-specialists.ts, modules/warp/natario-warp.ts, server/security/hull-guard.ts, server/specialists/solvers/index.ts, server/modules/qi/qi-controller.ts
```

### Worst #5: repo_tech_29_what-checks-enforce-presence-of-citations-in-repo-hybrid-responses
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

### Worst #6: relation_30_if-warp-bubble-is-capability-how-does-ethos-govern-its-use
- family: relation
- question: If warp bubble is capability, how does ethos govern its use?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. [docs/knowledge/warp/warp-bubble.md] - What it is: Hold real paradoxes without collapsing into slogans; accountable tradeoffs are explicit. [docs/knowledge/warp/warp-bubble.md] Notes: Tags: paradox, tradeoffs, governance, accountability, discernme... [docs/knowledge/warp/warp-bubble.md] In practice, Hold real paradoxes without collapsing into slogans; accountable tradeoffs are explicit. [docs/knowledge/warp/warp-bubble.md] Notes: Tags: paradox, tradeoffs, governance, accountability, discernme... [docs/knowledge/warp/warp-bubble.md] Sources: docs/knowledge/ethos/ethos-knowledge-tree.json, modules/warp/warp-module.ts, modules/warp/natario-warp.ts, client/src/lib/warp-uniforms-gate.ts, server/routes/ethos.ts, server/energy-pipeline.ts, client/src/components/missionethossourcepanel.ts, client/src/hooks/use-energy-pipeline.ts
```

### Worst #7: ambiguous_08_what-s-a-good-way-to-summarize-evidence
- family: ambiguous_general
- question: What's a good way to summarize evidence?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Minimal artifact: whyBelongs schema. [docs/knowledge/trees/certainty-framework-tree.md] In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [docs/knowledge/trees/certainty-framework-tree.md] Sources: docs/knowledge/trees/certainty-framework-tree.md, client/src/components/warprenderinspector.ts, server/instruments/pump-multitone.ts, modules/dynamic/natario-metric.ts, shared/essence-themes.ts, server/services/console-telemetry/summarize.ts, server/qi/qi-monitor.ts, server/routes/orchestrator.ts
```

### Worst #8: relation_25_from-docs-perspective-how-do-warp-bubble-files-and-ethos-files-relate
- family: relation
- question: From docs perspective, how do warp bubble files and ethos files relate?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. [docs/knowledge/warp/warp-bubble.md] - What it is: ; const resolveAlcubierreWallThickness = (params: NatarioWarpParams, R: number, sigma?: number) => const wall = (params.warpGeometry as any)?.wallThickness_m ?? [docs/knowledge/warp/warp-bubble.md] In practice, ; const resolveAlcubierreWallThickness = (params: NatarioWarpParams, R: number, sigma?: number) => const wall = (params.warpGeometry as any)?.wallThickness_m ?? [docs/knowledge/warp/warp-bubble.md] Sources: docs/knowledge/warp/warp-mechanics-tree.json, modules/warp/natario-warp.ts, modules/warp/warp-module.ts, client/src/lib/warp-uniforms-gate.ts, server/energy-pipeline.ts, server/routes/ethos.ts, client/src/components/missionethossourcepanel.ts, client/src/hooks/use-energy-pipeline.ts
```

### Worst #9: ambiguous_12_what-s-a-clean-way-to-structure-a-short-answer
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

### Worst #10: relation_03_warp-bubble-ideology-relation-what-is-the-bridge
- family: relation
- question: Warp bubble ↔ ideology relation: what is the bridge?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. [docs/knowledge/warp/warp-bubble.md] In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [docs/knowledge/warp/warp-bubble.md] Sources: docs/knowledge/warp/warp-bubble.md, modules/warp/warp-module.ts, modules/warp/natario-warp.ts, client/src/lib/warp-uniforms-gate.ts, server/energy-pipeline.ts, client/src/components/ideologypanel.ts, server/routes/ethos.ts, client/src/hooks/use-ideology.ts
```

### Worst #11: relation_19_how-do-certificate-integrity-and-mission-ethos-cohere-for-warp-bubble-wo
- family: relation
- question: How do certificate integrity and mission ethos cohere for warp bubble work?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] - Constraint: The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] Notes: Tags: stewardship, compassion; , begin... [docs/knowledge/ethos/mission-ethos.md] In practice, The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] Notes: Tags: stewardship, compassion; , begin... [docs/knowledge/ethos/mission-ethos.md] Sources: docs/knowledge/ethos/ethos-knowledge-tree.json, modules/warp/warp-module.ts, client/src/lib/warp-uniforms-gate.ts, server/energy-pipeline.ts, server/routes/ethos.ts, client/src/components/missionethossourcepanel.ts, client/src/hooks/use-energy-pipeline.ts, modules/warp/natario-warp.ts
```

### Worst #12: ambiguous_09_can-you-explain-system-integrity-for-non-experts
- family: ambiguous_general
- question: Can you explain system integrity for non-experts?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Protect aspirations from insecurity or oppression; the vow is not indulgence. [docs/knowledge/ethos/dream-integrity.md] tsx` so the build step can harvest the same language for offline banks and remote s... [docs/knowledge/ethos/dream-integrity.md] Mechanism: Protect aspirations from insecurity or oppression; the vow is not indulgence. [docs/knowledge/ethos/dream-integrity.md] -> constrained interaction dynamics -> Notes: Tags: dreams, integrity, vow, resilience, aspiration., because linked constraints amplify or dampen outcomes over time. [docs/knowledge/ethos/dream-integrity.md] Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts. [docs/knowledge/ethos/dream-integrity.md] In practice, tsx` so the build step can harvest the same language for offline banks and remote s... [docs/knowledge/ethos/dream-integrity.md] Sources: docs/ethos/ideology.json, docs/knowledge/ethos/dream-integrity.md, docs/ethos/why.md
```

### Worst #13: repo_tech_23_how-does-arbiter-mode-get-selected-for-repo-vs-hybrid-asks
- family: repo_technical
- question: How does arbiter_mode get selected for repo vs hybrid asks?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Key questions: What boundary assumptions are used, and which geometry is being modeled? [docs/knowledge/physics/boundary-conditions-modes.md] Key questions: What boundary assumptions are used, and which geometry is being modeled? [docs/knowledge/physics/boundary-conditions-modes.md] Interpretation: "mode quantization" is treated as boundary-conditions-modes. [docs/knowledge/physics/boundary-conditions-modes.md] Mechanism: Key questions: What boundary assumptions are used, and which geometry is being modeled? [docs/knowledge/physics/boundary-conditions-modes.md] -> coupled constraints and feedback operators -> observable outcomes tied to modules/sim_core/static-casimir.ts, because feedback loops shape the resulting behavior. Maturity (exploratory): this answer is mechanism-grounded but remains non-certified until dedicated tests and certificate-linked evidence are attached. [docs/knowledge/physics/boundary-conditions-modes.md] Missing evidence: provide higher-fidelity measurements and verification artifacts to move toward diagnostic/certified maturity. [docs/knowledge/physics/boundary-conditions-modes.md] Sources: docs/knowledge/physics/boundary-conditions-modes.md, modules/sim_core/static-casimir.ts, client/src/components/ElectronOrbitalPanel.tsx, client/src/hooks/useElectronOrbitSim.ts, docs/stellar-consciousness-orch-or-review.md, docs/knowledge/trees/stellar-restoration-tree.md, docs/stellar-consciousness-ii.md, docs/papers.md
```

### Worst #14: relation_08_warp-buble-relation-to-ideology-mission-ethos
- family: relation
- question: warp buble relation to ideology mission ethos
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [docs/knowledge/ethos/mission-ethos.md] Sources: modules/warp/warp-module.ts, client/src/lib/warp-uniforms-gate.ts, server/routes/ethos.ts, server/energy-pipeline.ts, client/src/hooks/use-ideology.ts, modules/warp/natario-warp.ts, client/src/components/ideologypanel.ts, shared/helix-plan.ts
```

### Worst #15: ambiguous_15_difference-between-hypothesis-and-verified-claim
- family: ambiguous_general
- question: Difference between hypothesis and verified claim?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Repo outputs describe simulated constraints and diagnostics, not real-world feasibility or engineering readiness. [docs/knowledge/physics/no-feasibility-claims.md] - Constraint: Interpretation: "no real-world claim" is treated as no-feasibility-claims. [docs/knowledge/physics/no-feasibility-claims.md] In practice, Interpretation: "no real-world claim" is treated as no-feasibility-claims. [docs/knowledge/physics/no-feasibility-claims.md] Sources: docs/knowledge/physics/math-maturity-stages.md, client/src/components/electronorbitalpanel.ts, client/src/hooks/useelectronorbitsim.ts, docs/stellar-consciousness-orch-or-review.md, docs/knowledge/trees/stellar-restoration-tree.md, docs/stellar-consciousness-ii.md, docs/papers.md, docs/knowledge/physics/no-feasibility-claims.md
```

## Recommendation
- decision: needs_patch
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
