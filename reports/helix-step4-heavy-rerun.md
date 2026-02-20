# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: work
- git_head: f421e41
- git_origin_main: missing
- git_ahead_behind: missing
- provenance_gate_pass: false
- provenance_warnings: git_origin_remote_missing, git_origin_main_ref_missing
- decision_grade_ready: false
- provenance_blocked: true
- run_id: versatility-1771545587120
- base_url: http://127.0.0.1:5173
- prompts: 90
- seeds: 7,11,13
- temperatures: 0.2
- expected_runs: 270
- total_runs: 270
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 255766
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: /workspace/casimirbot-/artifacts/experiments/helix-step4-heavy-rerun/versatility-1771545587120

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 90 | 86.7% | 93.3% | 100.0% | 0.0% | 489 | 1336 |
| repo_technical | 90 | 83.3% | 0.0% | 83.3% | 0.0% | 873 | 2080 |
| ambiguous_general | 90 | 93.3% | 0.0% | 93.3% | 0.0% | 895 | 1941 |

## Core Metrics
- intent_id_correct_rate: 93.33%
- report_mode_correct_rate: 92.22%
- relation_packet_built_rate: 86.67%
- relation_dual_domain_ok_rate: 90.00%
- avg_attempts_per_run: 1.00
- p95_attempts_per_run: 1
- stub_text_detected_rate: 0.00%
- deterministic_fallback_relation_rate: 90.00%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 100.00%
- min_text_length_pass_rate: 100.00%
- latency_total_p50_ms: 790
- latency_total_p95_ms: 1992
- latency_retrieval_p50_ms: 211 (samples=263)
- latency_retrieval_p95_ms: 446 (samples=263)
- latency_synthesis_p50_ms: 1 (samples=270)
- latency_synthesis_p95_ms: 3 (samples=270)

## Top Failure Signatures
- report_mode_mismatch: 21
- relation_packet_built: 12
- relation_dual_domain: 9
- intent_mismatch: 6
- bridge_count_low: 6
- evidence_count_low: 6

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: relation_24_could-warp-bubble-progress-violate-mission-ethos-how-is-that-prevented
- family: relation
- question: Could warp bubble progress violate mission ethos? How is that prevented?
- failures: intent_mismatch:repo.ideology_reference, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=repo.ideology_reference intent_strategy=repo_rag report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In plain language, Mission Ethos means the warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] This is in the ideology scope. [docs/knowledge/ethos/mission-ethos.md] Sources: docs/knowledge/ethos/mission-ethos.md, docs/ethos/ideology.json, docs/ethos/why.md
```

### Worst #2: relation_15_explain-warp-bubble-mission-ethos-for-a-skeptical-engineer
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

### Worst #3: relation_04_how-do-we-connect-natario-warp-bubble-constraints-to-mission-ethics
- family: relation
- question: How do we connect Natario warp bubble constraints to mission ethics?
- failures: relation_packet_built:false, relation_dual_domain:false
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=false relation_dual_domain_ok=false deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
what_is_warp_bubble: modules/warp/warp-module.ts /** * TheoryRefs: * - vanden-broeck-1999: input normalization + clamps for gamma_VdB */ /** * Warp Bubble Casimir Module * Integrates Natário zero-expansion warp bubble calculations with the m. - What it is: what_is_mission_ethos: Mission ethos is the stewardship policy layer that constrains capability claims to verified, non-harmful operation. [docs/knowledge/warp/warp-bubble.md] - Why it matters: how_they_connect: Mission ethos constrains warp development to measured, auditable checkpoints before deployment. [docs/knowledge/warp/warp-bubble.md] Warp viability certificates enable ethos commitments by binding claims to reproducible evidence. [docs/knowledge/warp/warp-bubble.md] Verification hooks translate design ambition into. [docs/knowledge/warp/warp-bubble.md] - Constraint: constraints_and_falsifiability: Physics bounds: Ford-Roman QI, theta calibration, and GR constraint gates must pass before viability claims. [docs/knowledge/warp/warp-bubble.md] Policy bounds: mission ethos requires stewardship, non-harm, and traceable evidence for operational decisions. [docs/knowledge/warp/warp-bubble.md] Re-run /. In practice, what_is_mission_ethos: Mission ethos is the stewardship policy layer that constrains capability claims to verified, non-harmful operation. [docs/knowledge/warp/warp-bubble.md] Sources: client/src/hooks/use-energy-pipeline.ts, client/src/lib/warp-pipeline-adapter.test.ts, client/src/lib/warp-pipeline-adapter.ts
```

### Worst #4: relation_18_warp-ethos-relation-prompt-test-explain-links-and-guardrails
- family: relation
- question: warp/ethos relation prompt test: explain links and guardrails
- failures: relation_packet_built:false
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=false relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [docs/knowledge/ethos/mission-ethos.md] Sources: docs/knowledge/ethos/mission-ethos.md, shared/schema.ts, server/routes/agi.plan.ts, modules/dynamic/dynamic-casimir.ts, temp_prev.ts, reports/helix-ask-versatility-post-tool-20260219t064058z.md, scripts/helix-ask-versatility-record.ts, tools/tokamak-added-value-report.ts
```

### Worst #5: repo_tech_15_how-does-the-system-prevent-report-scaffold-responses-for-relation-promp
- family: repo_technical
- question: How does the system prevent report-scaffold responses for relation prompts?
- failures: report_mode_mismatch:true
- likely_root_cause: routing_or_report_mode_policy
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=true relation_packet_built=false relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
# Trace and Essence System Tree. [docs/knowledge/trees/trace-system-tree.md] # Trace and Essence System Tree. [docs/knowledge/trees/trace-system-tree.md] Mechanism: # Trace and Essence System Tree. [docs/knowledge/trees/trace-system-tree.md] -> constrained interaction dynamics -> # Trace and Essence System Tree., because linked constraints amplify or dampen outcomes over time. [docs/knowledge/trees/trace-system-tree.md] Mechanism: # Trace and Essence System Tree. [docs/knowledge/trees/trace-system-tree.md] -> coupled constraints and feedback operators -> observable outcomes tied to docs/knowledge/trace-system-tree.json, because feedback loops shape the resulting behavior. Maturity (exploratory): this answer is mechanism-grounded but remains non-certified until dedicated tests and certificate-linked evidence are attached. [docs/knowledge/trees/trace-system-tree.md] Missing evidence: provide higher-fidelity measurements and verification artifacts to move toward diagnostic/certified maturity. [docs/knowledge/trees/trace-system-tree.md] Sources: docs/knowledge/trees/trace-system-tree.md, docs/knowledge/trace-system-tree.json, client/src/lib/agi/api.ts, client/src/components/agi/essence.tsx, client/src/components/agi/JobsBudgetModal.tsx, server/db/agi.ts, client/src/components/agi/DebateView.tsx, server/services/essence/solar-surface-coherence.ts
```

### Worst #6: ambiguous_01_define-lattice
- family: ambiguous_general
- question: Define lattice.
- failures: report_mode_mismatch:true
- likely_root_cause: routing_or_report_mode_policy
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=true relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Key questions: How many sectors are active and how is the lattice scheduled? [docs/knowledge/warp/casimir-lattice.md] Notes: The lattice logic is refl... [docs/knowledge/warp/casimir-lattice.md] - What it is: The Casimir lattice is the tiled sector model used to aggregate energy density and constraints across the warp bubble. [docs/knowledge/warp/casimir-lattice.md] Key questions: How many sectors are active and h... [docs/knowledge/warp/casimir-lattice.md] In practice, The Casimir lattice is the tiled sector model used to aggregate energy density and constraints across the warp bubble. [docs/knowledge/warp/casimir-lattice.md] Key questions: How many sectors are active and h... [docs/knowledge/warp/casimir-lattice.md] Sources: docs/knowledge/warp/warp-bubble.md, docs/knowledge/warp/natario-zero-expansion.md, docs/knowledge/warp/shift-vector-expansion-scalar.md, docs/knowledge/resonance-tree.json, docs/knowledge/physics/brick-lattice-dataflow-tree.json, docs/knowledge/warp/warp-mechanics-tree.json, docs/knowledge/warp/casimir-lattice.md, docs/knowledge/trees/panel-concepts-tree.md
```

### Worst #7: repo_tech_01_walk-through-api-agi-ask-routing-from-intent-detection-to-final-answer-c
- family: repo_technical
- question: Walk through /api/agi/ask routing from intent detection to final answer cleanup.
- failures: report_mode_mismatch:true
- likely_root_cause: routing_or_report_mode_policy
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=true relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Notes: The gap between current reasoning guards and full scientific-method rigor is tracked in `docs/helix-ask-scientific-method-gap.md`. The Helix Ask reasoning pipeline routes a prompt through intent selection, retrieval, evidence gates, and synthesis, with steps documented in the Helix Ask flow and ladder. [docs/knowledge/helix-ask-reasoning.md] Mechanism: Notes: The gap between current reasoning guards and full scientific-method rigor is tracked in `docs/helix-ask-scientific-method-gap.md`. -> constrained interaction dynamics -> The Helix Ask reasoning pipeline routes a prompt through intent selectio. [docs/knowledge/helix-ask-reasoning.md] Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts. [docs/knowledge/helix-ask-reasoning.md] In practice, The Helix Ask reasoning pipeline routes a prompt through intent selection, retrieval, evidence gates, and synthesis, with steps documented in the Helix Ask flow and ladder. [docs/knowledge/helix-ask-reasoning.md] Sources: docs/helix-ask-flow.md, docs/helix-ask-scientific-method-gap.md, docs/knowledge/helix-ask-reasoning.md, docs/helix-ask-ladder.md, docs/knowledge/ui-backend-binding-tree.json
```

### Worst #8: ambiguous_04_what-is-stability
- family: ambiguous_general
- question: What is stability?
- failures: report_mode_mismatch:true
- likely_root_cause: routing_or_report_mode_policy
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=true relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Key questions: How is the timestep chosen and which limits are enforced? [docs/knowledge/physics/stability-timestep.md] Key questions: How is the timestep chosen and which limits are enforced? [docs/knowledge/physics/stability-timestep.md] Interpretation: "stability" is treated as stability-timestep. [docs/knowledge/physics/stability-timestep.md] Mechanism: Key questions: How is the timestep chosen and which limits are enforced? [docs/knowledge/physics/stability-timestep.md] -> coupled constraints and feedback operators -> observable outcomes tied to server/gr/evolution/solver.ts, because feedback loops shape the resulting behavior. Maturity (exploratory): this answer is mechanism-grounded but remains non-certified until dedicated tests and certificate-linked evidence are attached. [docs/knowledge/physics/stability-timestep.md] Missing evidence: provide higher-fidelity measurements and verification artifacts to move toward diagnostic/certified maturity. [docs/knowledge/physics/stability-timestep.md] Sources: docs/knowledge/physics/stability-timestep.md, server/gr/evolution/solver.ts, docs/stellar-consciousness-orch-or-review.md, docs/knowledge/trees/stellar-restoration-tree.md, docs/stellar-consciousness-ii.md, docs/stellar-fact-check.md, docs/papers.md, docs/knowledge/stellar-restoration-tree.json
```

### Worst #9: repo_tech_02_how-does-helix-ask-choose-report-mode-vs-hybrid-explain-mode
- family: repo_technical
- question: How does Helix Ask choose report mode vs hybrid explain mode?
- failures: report_mode_mismatch:true
- likely_root_cause: routing_or_report_mode_policy
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=true relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Notes: The gap between current reasoning guards and full scientific-method rigor is tracked in `docs/helix-ask-scientific-method-gap.md`. 1. Notes: The gap between current reasoning guards and full scientific-method rigor is tracked in `docs/helix-ask-scientific-method-gap.md`. 2. The Helix Ask reasoning pipeline routes a prompt through intent selection, retrieval, evidence gates, and synthesis, with steps documented in the Helix Ask flow and ladder. [docs/knowledge/helix-ask-reasoning.md] In practice, The Helix Ask reasoning pipeline routes a prompt through intent selection, retrieval, evidence gates, and synthesis, with steps documented in the Helix Ask flow and ladder. [docs/knowledge/helix-ask-reasoning.md] Sources: docs/knowledge/helix-ask-reasoning.md, docs/helix-ask-flow.md, docs/helix-ask-ladder.md, server/routes/agi.plan.ts, docs/helix-ask-scientific-method-gap.md, docs/knowledge/helix-ask-tree.json, docs/knowledge/platonic-reasoning.md
```

### Worst #10: repo_tech_11_show-pipeline-stages-captured-in-debug-live-events-for-helix-ask
- family: repo_technical
- question: Show pipeline stages captured in debug live events for Helix Ask.
- failures: report_mode_mismatch:true
- likely_root_cause: routing_or_report_mode_policy
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=true relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
A pipeline is an ordered sequence of stages where the output of one stage becomes the input to the next, often with checkpoints or gates between stages. [docs/knowledge/pipeline.md] 1. A pipeline is an ordered sequence of stages where the output of one stage becomes the input to the next, often with checkpoints or gates between stages. [docs/knowledge/pipeline.md] 2. Key questions: What are the stages, what data passes between them, and where are the verification or quality gates? [docs/knowledge/pipeline.md] 3. Notes: Pipelines emphasize repeatability and explicit handoffs between steps. [docs/knowledge/pipeline.md] 4. md", "repo_rev": "a993f4618e92989c20b05232addbc333ded95a29", "content_hash": "sha256:34a623b3d8868d83b81e9d898c060b3a362d3bcdaaa8112... [docs/knowledge/pipeline.md] In practice, md", "repo_rev": "a993f4618e92989c20b05232addbc333ded95a29", "content_hash": "sha256:34a623b3d8868d83b81e9d898c060b3a362d3bcdaaa8112... [docs/knowledge/pipeline.md] Sources: docs/helix-ask-flow.md, client/src/lib/agi/api.ts, client/src/pages/desktop.ts, server/routes/agi.plan.ts, docs/knowledge/helix-ask-tree.json, docs/helix-ask-ladder.md
```

### Worst #11: repo_tech_19_what-are-top-fallback-reasons-emitted-in-debug-for-helix-ask-failures
- family: repo_technical
- question: What are top fallback reasons emitted in debug for helix ask failures?
- failures: report_mode_mismatch:true
- likely_root_cause: routing_or_report_mode_policy
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=true relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Notes: The gap between current reasoning guards and full scientific-method rigor is tracked in `docs/helix-ask-scientific-method-gap.md`. 1. Notes: The gap between current reasoning guards and full scientific-method rigor is tracked in `docs/helix-ask-scientific-method-gap.md`. 2. The Helix Ask reasoning pipeline routes a prompt through intent selection, retrieval, evidence gates, and synthesis, with steps documented in the Helix Ask flow and ladder. [docs/knowledge/helix-ask-reasoning.md] In practice, The Helix Ask reasoning pipeline routes a prompt through intent selection, retrieval, evidence gates, and synthesis, with steps documented in the Helix Ask flow and ladder. [docs/knowledge/helix-ask-reasoning.md] Sources: docs/knowledge/helix-ask-reasoning.md, docs/helix-ask-flow.md, docs/helix-ask-ladder.md, server/routes/agi.plan.ts, docs/helix-ask-scientific-method-gap.md, docs/knowledge/helix-ask-tree.json
```

### Worst #12: ambiguous_28_how-can-i-identify-high-impact-failure-categories
- family: ambiguous_general
- question: How can I identify high-impact failure categories?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=false deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
score=1.000 | symbol=buildSnapshot | file=client/src/lib/code-index/snapshot.ts Minimal, strict-scientific REAL renderer. score=4.000 | symbol=WarpBubbleCompare. [client/src/lib/gl/capabilities.ts] score=1.000 | symbol=WarpBubbleResult | file=modules/warp/... score=1.000 | symbol=buildSnapshot | file=client/src/lib/code-index/snapshot.ts Minimal, strict-scientific REAL renderer. score=4.000 | symbol=WarpBubbleCompare. [client/src/lib/gl/capabilities.ts] score=1.000 | symbol=WarpBubbleResult | file=modules/warp/... score=11.000 | symbol=sizeCanvasSafe | file=client/src/lib/gl/capabilities.ts modules/warp/warp-module.ts export interface WarpBubbleResult extends NatarioWarpResult // Module-specific additions moduleVersion: string; ca... Mechanism: score=1.000 | symbol=buildSnapshot | file=client/src/lib/code-index/snapshot.ts Minimal, strict-scientific REAL renderer. score=4.000 | symbol=WarpBubbleCompare. [client/src/lib/gl/capabilities.ts] score=1.000 | symbol=WarpBubbleResult | file=modules/warp/... -> coupled constraints and feedback operators -> observable outcomes tied to modules/warp/warp-module.ts,. Maturity (exploratory): this answer is mechanism-grounded but remains non-certified until dedicated tests and certificate-linked evidence are attached. [client/src/lib/gl/capabilities.ts] Missing evidence: provide higher-fidelity measurements and verification artifacts to move toward diagnostic/certified maturity. [client/src/lib/gl/capabilities.ts] Sources: client/src/lib/gl/capabilities.ts, modules/warp/warp-module.ts, client/src/lib/code-index/snapshot.ts, server/services/planner/chat-b.ts, server/db/essence.ts, server/routes/agi.debate.ts, server/helix-core.ts, client/src/workers/fractional-scan.ts
```

### Worst #13: repo_tech_16_where-are-citation-allowlists-normalized-before-sanitizesourcesline
- family: repo_technical
- question: Where are citation allowlists normalized before sanitizeSourcesLine?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=false deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
const DOCS_PREFIX = "/docs"; const DOC_VIEWER_INTENT_KEY = "helix:doc-viewer:intent";. [server/services/knowledge/citations.ts] const DOC_VIEWER_INTENT_KEY = "helix:doc-viewer:intent";. [server/services/knowledge/citations.ts] const fallback = `$ /papers.md`;. [server/services/knowledge/citations.ts] if (!input) return fallback;. [server/services/knowledge/citations.ts] In practice, const DOC_VIEWER_INTENT_KEY = "helix:doc-viewer:intent";. [server/services/knowledge/citations.ts] Sources: client/src/components/driveguardspanel.ts, server/services/knowledge/citations.ts, shared/agi-specialists.ts, modules/warp/natario-warp.ts, server/security/hull-guard.ts, server/specialists/solvers/index.ts, client/src/lib/docs/docviewer.ts, server/modules/qi/qi-controller.ts
```

### Worst #14: repo_tech_07_how-are-ambiguity-gates-triggered-and-what-clarify-output-is-produced
- family: repo_technical
- question: How are ambiguity gates triggered and what clarify output is produced?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=false deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [docs/knowledge/ui-components-tree.json] In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [docs/knowledge/ui-components-tree.json] Sources: docs/knowledge/ui-components-tree.json, client/src/hooks/use-energy-pipeline.ts, shared/schema.ts, server/helix-core.ts, modules/dynamic/gates/index.ts, tests/hull-tools.spec.ts, modules/core/module-registry.ts, server/specialists/solvers/philo.synthesis.ts

Missing evidence: add directly relevant repo paths or artifact refs to raise confidence.
```

### Worst #15: repo_tech_29_what-checks-enforce-presence-of-citations-in-repo-hybrid-responses
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

## Recommendation
- decision: needs_patch
- [0] Validation provenance gate: Require origin/main + HEAD provenance in reports before accepting decision-grade outcomes.
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
