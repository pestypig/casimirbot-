# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: codex/self-tune-gate-and-heavy-20260220-050220
- git_head: f357a88
- git_origin_main: missing
- git_ahead_behind: missing
- provenance_gate_pass: false
- provenance_warnings: git_origin_remote_missing, git_origin_main_ref_missing
- decision_grade_ready: false
- provenance_blocked: true
- provenance_hard_blocker_reason: BLOCKER_PROVENANCE_ORIGIN_REMOTE_MISSING
- ship_recommendation_blocked_by_hard_blocker: true
- run_id: versatility-1771564256224
- base_url: http://127.0.0.1:5173
- prompts: 45
- seeds: 7,11,13
- temperatures: 0.2
- expected_runs: 135
- total_runs: 135
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 96111
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: /workspace/casimirbot-/artifacts/experiments/helix-self-tune-precheck/versatility-1771564256224

## HARD BLOCKER
- status: BLOCKED
- reason: BLOCKER_PROVENANCE_ORIGIN_REMOTE_MISSING
- effect: ship recommendation is disallowed until provenance gate passes with origin/main + HEAD present.

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 45 | 100.0% | 100.0% | 100.0% | 0.0% | 380 | 963 |
| repo_technical | 45 | 86.7% | 0.0% | 86.7% | 0.0% | 554 | 1546 |
| ambiguous_general | 45 | 100.0% | 0.0% | 100.0% | 0.0% | 777 | 1421 |

## Core Metrics
- intent_id_correct_rate: 100.00%
- report_mode_correct_rate: 95.56%
- relation_packet_built_rate: 100.00%
- relation_dual_domain_ok_rate: 100.00%
- avg_attempts_per_run: 1.00
- p95_attempts_per_run: 1
- stub_text_detected_rate: 0.00%
- deterministic_fallback_relation_rate: 86.67%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 100.00%
- min_text_length_pass_rate: 100.00%
- latency_total_p50_ms: 624
- latency_total_p95_ms: 1433
- latency_retrieval_p50_ms: 184 (samples=128)
- latency_retrieval_p95_ms: 324 (samples=128)
- latency_synthesis_p50_ms: 1 (samples=135)
- latency_synthesis_p95_ms: 10 (samples=135)

## Top Failure Signatures
- report_mode_mismatch: 6

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: repo_tech_01_walk-through-api-agi-ask-routing-from-intent-detection-to-final-answer-c
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

### Worst #2: repo_tech_11_show-pipeline-stages-captured-in-debug-live-events-for-helix-ask
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

### Worst #3: repo_tech_29_what-checks-enforce-presence-of-citations-in-repo-hybrid-responses
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

### Worst #4: repo_tech_21_explain-relation-assembly-fallback-rendering-shape-and-intended-usage
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

### Worst #5: ambiguous_20_how-do-i-triage-failures-quickly
- family: ambiguous_general
- question: How do I triage failures quickly?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [shared/schema.ts] 1. Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [shared/schema.ts] In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [shared/schema.ts] Sources: shared/schema.ts, server/routes/agi.plan.ts, modules/dynamic/dynamic-casimir.ts, temp_prev.ts, scripts/helix-ask-utility-ab.ts, reports/helix-tuner-heavy-rerun.md, tools/tokamak-added-value-report.ts, tests/warpfield-lattice.integration.spec.ts

Missing evidence: add directly relevant repo paths or artifact refs to raise confidence.
```

### Worst #6: ambiguous_30_what-s-the-difference-between-routing-and-assembly
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

### Worst #8: ambiguous_26_how-do-seeds-help-evaluation-reliability
- family: ambiguous_general
- question: How do seeds help evaluation reliability?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.general_how_to_process intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Answer grounded in retrieved evidence. [server/routes/agi.plan.ts] 1. Answer grounded in retrieved evidence. [server/routes/agi.plan.ts] In practice, Evidence is limited; add the relevant repo file paths for stronger grounding. [server/routes/agi.plan.ts] Missing evidence: Evidence is limited; add the relevant repo file paths for stronger grounding. [server/routes/agi.plan.ts]
```

### Worst #9: repo_tech_08_what-does-api-agi-adapter-run-return-for-pass-fail-and-certificate-data
- family: repo_technical
- question: What does /api/agi/adapter/run return for PASS/FAIL and certificate data?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Measurement must not become coercion; data collection stays minimal and accountable. [docs/knowledge/ethos/data-dignity.md] Mechanism: Measurement must not become coercion; data collection stays minimal and accountable. [docs/knowledge/ethos/data-dignity.md] -> constrained interaction dynamics -> Notes: Tags: data, dignity, privacy, consent, accountability., because linked constraints amplify or dampen outcomes over tim. [docs/knowledge/ethos/data-dignity.md] Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts. [docs/knowledge/ethos/data-dignity.md] In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [docs/knowledge/ethos/data-dignity.md] Sources: docs/ethos/ideology.json, docs/knowledge/ethos/data-dignity.md, docs/ethos/why.md
```

### Worst #10: ambiguous_12_what-s-a-clean-way-to-structure-a-short-answer
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

### Worst #11: repo_tech_13_how-does-goal-zone-harness-evaluate-pass-fail-across-seeds
- family: repo_technical
- question: How does goal-zone harness evaluate pass/fail across seeds?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In practice, score=2.000 | symbol=NatarioWarpResult | file=modules/warp/natario-warp.ts modules/dynamic/gates/index.ts export interface GateEvaluationOptions score=2.824 | symbol=GateEvaluationOptions | file=modules/dyna... In practice, score=2.000 | symbol=NatarioWarpResult | file=modules/warp/natario-warp.ts modules/dynamic/gates/index.ts export interface GateEvaluationOptions score=2.824 | symbol=GateEvaluationOptions | file=modules/dyna... 2. score=2.000 | symbol=NatarioWarpResult | file=modules/warp/natario-warp.ts modules/dynamic/gates/index.ts export interface GateEvaluationOptions score=2.824 | symbol=GateEvaluationOptions | file=modules/dynamic/gates/... Mechanism: In practice, score=2.000 | symbol=NatarioWarpResult | file=modules/warp/natario-warp.ts modules/dynamic/gates/index.ts export interface GateEvaluationOptions score=2.824 | symbol=GateEvaluationOptions | file=modules/dyna... -> coupled constraints and feedback operators -> observable outcomes tied to modules/warp/natario-warp.ts. Maturity (exploratory): this answer is mechanism-grounded but remains non-certified until dedicated tests and certificate-linked evidence are attached. [server/services/proposals/engine.ts] Missing evidence: provide higher-fidelity measurements and verification artifacts to move toward diagnostic/certified maturity. [server/services/proposals/engine.ts] Sources: server/services/proposals/engine.ts, modules/warp/natario-warp.ts, modules/dynamic/gates/index.ts, modules/warp/warp-module.ts, server/energy-pipeline.ts, client/src/hooks/use-energy-pipeline.ts, client/src/lib/whispers/seedWhispers.ts, client/src/components/AlcubierrePanel.tsx
```

### Worst #12: ambiguous_08_what-s-a-good-way-to-summarize-evidence
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

### Worst #13: relation_27_how-does-relation-mode-answer-tie-warp-bubble-to-ideology-without-report
- family: relation
- question: How does relation-mode answer tie warp bubble to ideology without report scaffolding?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. [docs/knowledge/warp/warp-bubble.md] - What it is: In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. [docs/knowledge/warp/warp-bubble.md] Key questions: Which bubble model is used and wher... [docs/knowledge/warp/warp-bubble.md] In practice, In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. [docs/knowledge/warp/warp-bubble.md] Key questions: Which bubble model is used and wher... [docs/knowledge/warp/warp-bubble.md] Sources: docs/knowledge/warp/warp-mechanics-tree.json, modules/warp/warp-module.ts, modules/warp/natario-warp.ts, client/src/lib/warp-uniforms-gate.ts, server/energy-pipeline.ts, client/src/components/ideologypanel.ts, server/routes/ethos.ts, client/src/hooks/use-ideology.ts
```

### Worst #14: relation_03_warp-bubble-ideology-relation-what-is-the-bridge
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

### Worst #15: repo_tech_17_explain-retrieval-confidence-and-deterministic-contract-signal-threshold
- family: repo_technical
- question: Explain retrieval confidence and deterministic contract signal thresholds.
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Timing honesty: if burst < LC, the average claim is not earned. [docs/knowledge/ethos/reciprocity-contract.md] Timing honesty: if burst < LC, the average claim is not earned. [docs/knowledge/ethos/reciprocity-contract.md] Notes: Tags: reciprocity, timing, guardrails. [docs/knowledge/ethos/reciprocity-contract.md] Mechanism: Timing honesty: if burst < LC, the average claim is not earned. [docs/knowledge/ethos/reciprocity-contract.md] -> coupled constraints and feedback operators -> observable outcomes tied to docs/ethos/ideology.json, because feedback loops shape the resulting behavior. Maturity (exploratory): this answer is mechanism-grounded but remains non-certified until dedicated tests and certificate-linked evidence are attached. [docs/knowledge/ethos/reciprocity-contract.md] Missing evidence: provide higher-fidelity measurements and verification artifacts to move toward diagnostic/certified maturity. [docs/knowledge/ethos/reciprocity-contract.md] Sources: docs/knowledge/ethos/reciprocity-contract.md, docs/ethos/ideology.json, docs/knowledge/knowledge-ingestion-tree.json, docs/ethos/why.md
```

## Recommendation
- decision: blocked_provenance
- [0] Validation provenance gate: Require origin/main + HEAD provenance in reports before accepting decision-grade outcomes.
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
