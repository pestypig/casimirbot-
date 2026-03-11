# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: 5f1f68a0
- git_origin_main: 5f1f68a0
- git_ahead_behind: 0	0
- provenance_gate_pass: true
- provenance_warnings: none
- decision_grade_ready: true
- provenance_blocked: false
- provenance_hard_blocker_reason: none
- ship_recommendation_blocked_by_hard_blocker: false
- run_id: versatility-1773222979467
- base_url: http://127.0.0.1:5050
- prompts: 90
- seeds: 7,11,13
- temperatures: 0.2
- expected_runs: 270
- total_runs: 270
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 2048960
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1773222979467

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 90 | 100.0% | 100.0% | 100.0% | 0.0% | 7016 | 11542 |
| repo_technical | 90 | 90.0% | 0.0% | 90.0% | 0.0% | 5027 | 15005 |
| ambiguous_general | 90 | 100.0% | 0.0% | 100.0% | 0.0% | 5465 | 11049 |

## Core Metrics
- intent_id_correct_rate: 100.00%
- report_mode_correct_rate: 96.67%
- relation_packet_built_rate: 100.00%
- relation_dual_domain_ok_rate: 100.00%
- avg_attempts_per_run: 1.05
- p95_attempts_per_run: 2
- stub_text_detected_rate: 0.00%
- deterministic_fallback_relation_rate: 63.33%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 96.67%
- min_text_length_pass_rate: 96.67%
- latency_total_p50_ms: 6047
- latency_total_p95_ms: 12651
- latency_retrieval_p50_ms: 757 (samples=248)
- latency_retrieval_p95_ms: 3451 (samples=248)
- latency_synthesis_p50_ms: 1 (samples=261)
- latency_synthesis_p95_ms: 4 (samples=261)

## Top Failure Signatures
- request_failed: 9
- report_mode_mismatch: 9
- text_too_short: 9
- citation_missing: 9

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: repo_tech_08_what-does-api-agi-adapter-run-return-for-pass-fail-and-certificate-data
- family: repo_technical
- question: What does /api/agi/adapter/run return for PASS/FAIL and certificate data?
- failures: request_failed:network, report_mode_mismatch:undefined, text_too_short:26, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
This operation was aborted
```

### Worst #2: repo_tech_16_where-are-citation-allowlists-normalized-before-sanitizesourcesline
- family: repo_technical
- question: Where are citation allowlists normalized before sanitizeSourcesLine?
- failures: request_failed:network, report_mode_mismatch:undefined, text_too_short:26, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
This operation was aborted
```

### Worst #3: repo_tech_29_what-checks-enforce-presence-of-citations-in-repo-hybrid-responses
- family: repo_technical
- question: What checks enforce presence of citations in repo/hybrid responses?
- failures: request_failed:network, report_mode_mismatch:undefined, text_too_short:26, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
This operation was aborted
```

### Worst #4: repo_tech_23_how-does-arbiter-mode-get-selected-for-repo-vs-hybrid-asks
- family: repo_technical
- question: How does arbiter_mode get selected for repo vs hybrid asks?
- failures: request_failed:network, report_mode_mismatch:undefined, text_too_short:26, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
This operation was aborted
```

### Worst #5: ambiguous_20_how-do-i-triage-failures-quickly
- family: ambiguous_general
- question: How do I triage failures quickly?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Confirmed:
- Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [scripts/helix-ask-utility-ab.ts] - In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [scripts/helix-ask-utility-ab.ts] Reasoned connections (bounded):
- Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [scripts/helix-ask-utility-ab.ts] (see scripts/helix-ask-utility-ab.ts1. [scripts/helix-ask-utility-ab.ts] (see scripts/helix-ask-utility-ab.tsBounded linkage supported by cited evidence.)

Next evidence:
- Searched terms: How do I triage failures quickly?, helix desktop panels, Current Failures (from definitive run)
- Checked files:, docs/knowledge/ui-components-tree.json,,
- Check files under scripts or docs. - Search docs headings for "triage". [scripts/helix-ask-utility-ab.ts] - Search docs headings for "failur". [scripts/helix-ask-utility-ab.ts] - Search docs headings for "quickly". [scripts/helix-ask-utility-ab.ts] 1. I don't see repo evidence for triage, failur, quickly. [scripts/helix-ask-utility-ab.ts] Do you mean a repo-specific module/file, or the general concept? [scripts/helix-ask-utility-ab.ts] Point me to the file path or clarify the sense. [scripts/helix-ask-utility-ab.ts] Missing evidence: add directly relevant repo paths or artifact refs to raise confidence. [scripts/helix-ask-utility-ab.ts] Sources: scripts/helix-ask-utility-ab.ts, docs/knowledge/ui-components-tree.json, server/services/planner/chat-b.ts, shared/jobs.ts, artifacts/experiments/helix-relation-recovery-stabilized/ab/t02/prompt-pack.json,.env.example, modules/sim_core/static-casimir.ts, tests/essence-theme-panels.spec.ts
```

### Worst #6: ambiguous_03_explain-resonance-in-simple-terms
- family: ambiguous_general
- question: Explain resonance in simple terms.
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete.

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Sources: open-world best-effort (no repo citations required).
```

### Worst #7: ambiguous_07_how-do-constraints-help-decision-making
- family: ambiguous_general
- question: How do constraints help decision making?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.general_how_to_process intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete.

1. Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete.

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Sources: open-world best-effort (no repo citations required).
```

### Worst #8: relation_18_warp-ethos-relation-prompt-test-explain-links-and-guardrails
- family: relation
- question: warp/ethos relation prompt test: explain links and guardrails
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
What is warp bubble: docs/knowledge/warp/warp-bubble.md

What is mission ethos: docs/BUSINESS_MODEL.md

How they connect: Mission ethos constrains warp development to measured, auditable checkpoints before deployment. Warp viability certificates enable ethos commitments by binding claims to reproducible evidence. [docs/ethos/why.md] Verification hooks translate design ambition into falsifiable tests across physics and policy layers. [docs/ethos/why.md] Constraints and falsifiability: Physics bounds: Ford-Roman QI, theta calibration, and GR constraint gates must pass before viability claims. [docs/ethos/why.md] Policy bounds: mission ethos requires stewardship, non-harm, and traceable evidence for operational decisions. [docs/ethos/why.md] Re-run /api/agi/adapter/run with updated action payload and require PASS with certificate integrity OK. [docs/ethos/why.md] Sources: docs/BUSINESS_MODEL.md, docs/ethos/ideology.json, docs/ethos/why.md, docs/knowledge/ethos/citizens-arc-convergence-compact.md, docs/knowledge/ethos/citizens-arc-stress-test.md, docs/knowledge/ethos/ethos-knowledge-tree.json, docs/knowledge/ethos/struggle-testament.md, docs/knowledge/warp/warp-bubble.md
```

### Worst #9: repo_tech_28_how-is-platonic-gate-scoring-attached-to-final-response-debug
- family: repo_technical
- question: How is platonic gate scoring attached to final response debug?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Confirmed:
- Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [docs/helix-ask-readiness-debug-loop.md] - In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [docs/helix-ask-readiness-debug-loop.md] Reasoned connections (bounded):
- Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [docs/helix-ask-readiness-debug-loop.md] (see docs/helix-ask-readiness-debug-loop.md). 1. (see docs/helix-ask-readiness-debug-loop.md). Bounded linkage supported by cited evidence. [docs/helix-ask-readiness-debug-loop.md] Next evidence:
- Searched terms: Training and Certification Gate
- Checked files: docs/helix-ask-readiness-debug-loop.md,,, shared/schema.ts
- Check files under docs or agents.md. - Search docs headings for "gate". [docs/helix-ask-readiness-debug-loop.md] - Search docs headings for "scor". [docs/helix-ask-readiness-debug-loop.md] - Search docs headings for "attach". [docs/helix-ask-readiness-debug-loop.md] 1. I don't see repo evidence for gate, scor, attach, final, response. [docs/helix-ask-readiness-debug-loop.md] Do you mean a repo-specific module/file, or the general concept? [docs/helix-ask-readiness-debug-loop.md] Point me to the file path or clarify the sense. [docs/helix-ask-readiness-debug-loop.md] Missing evidence: add directly relevant repo paths or artifact refs to raise confidence. [docs/helix-ask-readiness-debug-loop.md] Sources: docs/helix-ask-readiness-debug-loop.md, agents.md, reports/helix-ask-versatility-report.md, client/src/lib/agi/api.ts, tests/helix-ask-evidence-gate.spec.ts, server/services/planner/chat-b.ts, shared/proposals.ts, modules/dynamic/gates/index.ts
```

### Worst #10: repo_tech_07_how-are-ambiguity-gates-triggered-and-what-clarify-output-is-produced
- family: repo_technical
- question: How are ambiguity gates triggered and what clarify output is produced?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Confirmed:
- Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [server/helix-core.ts] - In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [server/helix-core.ts] - Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [server/helix-core.ts] Reasoned connections (bounded):
- Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [server/helix-core.ts] (see server/helix-core.tsIn practice, coupled constraints and feedback loops determine how outcomes evolve over time. (see server/helix-core.tsBounded linkage supported by cited evidence.)

Next evidence:
- Searched terms: helix desktop panels, Output
- Checked files:, server/helix-core.ts, shared/agi-specialists.ts, docs/runbooks/voice-eval-gates-2026-02-23.md
- Check files under server or docs. - Search docs headings for "ambiguity". [server/helix-core.ts] - Search docs headings for "trigger". [server/helix-core.ts] - Search docs headings for "clarify". [server/helix-core.ts] I don't see repo evidence for ambiguity, trigger, clarify, output, produc. [server/helix-core.ts] Do you mean a repo-specific module/file, or the general concept? [server/helix-core.ts] Point me to the file path or clarify the sense. [server/helix-core.ts] Missing evidence: add directly relevant repo paths or artifact refs to raise confidence. [server/helix-core.ts] Sources: server/helix-core.ts, docs/runbooks/voice-eval-gates-2026-02-23.md, shared/agi-specialists.ts, modules/core/module-registry.ts, tests/hce-core.spec.ts, artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/summary.json, warp_agents.md, scripts/helix-a
```

### Worst #11: relation_13_bridge-warp-physics-evidence-to-ethos-stewardship-without-report-mode
- family: relation
- question: Bridge warp physics evidence to ethos stewardship without report mode.
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
What is warp bubble: modules/warp/warp-module.ts /** * TheoryRefs: * - vanden-broeck-1999: input normalization + clamps for gamma_VdB */ /** * Warp Bubble Casimir Module * Integrates Natário zero-expansion warp bubble calculations with the m

What is mission ethos: docs/ethos/ideology.json .. How they connect: Mission ethos constrains warp development to measured, auditable checkpoints before deployment. [modules/warp/warp-module.ts] Warp viability certificates enable ethos commitments by binding claims to reproducible evidence. [modules/warp/warp-module.ts] Verification hooks translate design ambition into falsifiable tests across physics and policy layers. [modules/warp/warp-module.ts] Constraints and falsifiability: Physics bounds: Ford-Roman QI, theta calibration, and GR constraint gates must pass before viability claims. [modules/warp/warp-module.ts] Policy bounds: mission ethos requires stewardship, non-harm, and traceable evidence for operational decisions. [modules/warp/warp-module.ts] Re-run /api/agi/adapter/run with updated action payload and require PASS with certificate integrity OK. [modules/warp/warp-module.ts] Sources: docs/ethos/ideology.json, docs/ethos/why.md, docs/knowledge/ethos/ethos-knowledge-tree.json, docs/knowledge/ethos/stewardship-ledger.md, docs/knowledge/ethos/verification-checklist.md
```

### Worst #12: relation_12_how-does-the-ideology-tree-constrain-warp-bubble-deployment-decisions
- family: relation
- question: How does the ideology tree constrain warp-bubble deployment decisions?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
What is warp bubble: docs/ADAPTER-CONTRACT.md .. score=32.000 | symbol=git-tracked | file=docs/ADAPTER-CONTRACT.md

What is mission ethos: docs/audits/ideology-physics-claim-gap-audit-2026-02-17.md 000 | symbol=git-tracked | file=docs/audits/ideology-physics-claim-gap-audit-2026-02-17.md

How they connect: Mission ethos constrains warp development to measured, auditable checkpoints before deployment. Warp viability certificates enable ethos commitments by binding claims to reproducible evidence. [docs/knowledge/warp/warp-bubble.md] Verification hooks translate design ambition into falsifiable tests across physics and policy layers. [docs/knowledge/warp/warp-bubble.md] Constraints and falsifiability: Physics bounds: Ford-Roman QI, theta calibration, and GR constraint gates must pass before viability claims. [docs/knowledge/warp/warp-bubble.md] Policy bounds: mission ethos requires stewardship, non-harm, and traceable evidence for operational decisions. [docs/knowledge/warp/warp-bubble.md] Re-run /api/agi/adapter/run with updated action payload and require PASS with certificate integrity OK. [docs/knowledge/warp/warp-bubble.md] Sources: docs/audits/ideology-physics-claim-gap-audit-2026-02-17.md, docs/BUSINESS_MODEL.md, docs/ethos/ideology.json, docs/ethos/why.md, docs/ADAPTER-CONTRACT.md, docs/AGI-ROADMAP.md, docs/alcubierre-alignment.md, docs/architecture/agibot-knowledge-linking-contract-v1.md
```

### Worst #13: repo_tech_01_walk-through-api-agi-ask-routing-from-intent-detection-to-final-answer-c
- family: repo_technical
- question: Walk through /api/agi/ask routing from intent detection to final answer cleanup.
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=repo.repo_api_lookup intent_strategy=repo_rag report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Repo evidence did not include the endpoint path requested. [docs/knowledge/ui-backend-binding-tree.json] Please point to the relevant files or paste the route snippet. [docs/knowledge/ui-backend-binding-tree.json] Sources: docs/knowledge/ui-backend-binding-tree.json
```

### Worst #14: ambiguous_26_how-do-seeds-help-evaluation-reliability
- family: ambiguous_general
- question: How do seeds help evaluation reliability?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Repo evidence did not cover key terms from the question (seed, help, evaluation, reliability). [shared/schema.ts] Please point to the relevant files or narrow the request. [shared/schema.ts] Sources: server/routes/agi.plan.ts,
```

### Worst #15: relation_19_how-do-certificate-integrity-and-mission-ethos-cohere-for-warp-bubble-wo
- family: relation
- question: How do certificate integrity and mission ethos cohere for warp bubble work?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
What is warp bubble: docs/architecture/helix-ask-mission-systems-integration-plan.md md modules/warp/warp-module.ts /** * TheoryRefs: * - vanden-broeck-1999: input normalization + clamps for gamma_VdB */ /** * Warp Bubble Casimir Module * In

What is mission ethos: docs/architecture/mission-go-board-spec.md md

How they connect: Mission ethos constrains warp development to measured, auditable checkpoints before deployment. Warp viability certificates enable ethos commitments by binding claims to reproducible evidence. [docs/knowledge/ethos/mission-ethos.md] Verification hooks translate design ambition into falsifiable tests across physics and policy layers. [docs/knowledge/ethos/mission-ethos.md] Constraints and falsifiability: Physics bounds: Ford-Roman QI, theta calibration, and GR constraint gates must pass before viability claims. [docs/knowledge/ethos/mission-ethos.md] Policy bounds: mission ethos requires stewardship, non-harm, and traceable evidence for operational decisions. [docs/knowledge/ethos/mission-ethos.md] Re-run /api/agi/adapter/run with updated action payload and require PASS with certificate integrity OK. [docs/knowledge/ethos/mission-ethos.md] Sources: docs/architecture/mission-go-board-spec.md, docs/audits/research/helix-ask-mission-overwatch-v1-wave3a-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md, docs/ethos/ideology.json, docs/ethos/why.md, docs/knowledge/ethos/ethos-knowledge-tree.json, docs/knowledge/ethos/stewardship-ledger.md, docs/knowledge/ethos/verification-checklist.md, docs/runbooks/mission-overwatch-slo-2026-02-23.md
```

## Recommendation
- decision: needs_patch
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
