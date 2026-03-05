# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: e2404319
- git_origin_main: e2404319
- git_ahead_behind: 0	0
- provenance_gate_pass: true
- provenance_warnings: none
- decision_grade_ready: true
- provenance_blocked: false
- provenance_hard_blocker_reason: none
- ship_recommendation_blocked_by_hard_blocker: false
- run_id: versatility-1772728037668
- base_url: http://127.0.0.1:5050
- prompts: 90
- seeds: 7,11,13
- temperatures: 0.2
- expected_runs: 270
- total_runs: 270
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 1870598
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1772728037668

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 90 | 100.0% | 100.0% | 100.0% | 0.0% | 6717 | 11710 |
| repo_technical | 90 | 100.0% | 0.0% | 100.0% | 0.0% | 7254 | 13962 |
| ambiguous_general | 90 | 100.0% | 0.0% | 100.0% | 0.0% | 5466 | 11941 |

## Core Metrics
- intent_id_correct_rate: 100.00%
- report_mode_correct_rate: 100.00%
- relation_packet_built_rate: 100.00%
- relation_dual_domain_ok_rate: 100.00%
- avg_attempts_per_run: 1.00
- p95_attempts_per_run: 1
- stub_text_detected_rate: 0.00%
- deterministic_fallback_relation_rate: 63.33%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 100.00%
- min_text_length_pass_rate: 100.00%
- latency_total_p50_ms: 6060
- latency_total_p95_ms: 13522
- latency_retrieval_p50_ms: 708 (samples=257)
- latency_retrieval_p95_ms: 3107 (samples=257)
- latency_synthesis_p50_ms: 1 (samples=270)
- latency_synthesis_p95_ms: 2 (samples=270)

## Top Failure Signatures

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: repo_tech_08_what-does-api-agi-adapter-run-return-for-pass-fail-and-certificate-data
- family: repo_technical
- question: What does /api/agi/adapter/run return for PASS/FAIL and certificate data?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=repo.repo_api_lookup intent_strategy=repo_rag report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Repo evidence did not include the endpoint path requested. [docs/knowledge/ui-backend-binding-tree.json] Please point to the relevant files or paste the route snippet. [docs/knowledge/ui-backend-binding-tree.json] Sources: docs/knowledge/ui-backend-binding-tree.json
```

### Worst #2: relation_10_define-warp-bubble-define-mission-ethos-then-connect-them
- family: relation
- question: Define warp bubble, define mission ethos, then connect them.
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
What is warp bubble: docs/architecture/helix-ask-mission-systems-integration-plan.md md modules/warp/warp-module.ts /** * TheoryRefs: * - vanden-broeck-1999: input normalization + clamps for gamma_VdB */ /** * Warp Bubble Casimir Module * In

What is mission ethos: docs/architecture/helix-ask-mission-systems-integration-plan.md md

How they connect: Mission ethos constrains warp development to measured, auditable checkpoints before deployment. Warp viability certificates enable ethos commitments by binding claims to reproducible evidence. [docs/knowledge/ethos/mission-ethos.md] Verification hooks translate design ambition into falsifiable tests across physics and policy layers. [docs/knowledge/ethos/mission-ethos.md] Constraints and falsifiability: Physics bounds: Ford-Roman QI, theta calibration, and GR constraint gates must pass before viability claims. [docs/knowledge/ethos/mission-ethos.md] Policy bounds: mission ethos requires stewardship, non-harm, and traceable evidence for operational decisions. [docs/knowledge/ethos/mission-ethos.md] Re-run /api/agi/adapter/run with updated action payload and require PASS with certificate integrity OK. [docs/knowledge/ethos/mission-ethos.md] Sources: docs/architecture/helix-ask-mission-systems-integration-plan.md, docs/architecture/mission-go-board-spec.md, docs/audits/research/helix-ask-mission-overwatch-v1-wave3a-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md, docs/BUSINESS_MODEL.md, docs/ethos/why.md, docs/knowledge/trees/ethos-knowledge-tree.md, docs/runbooks/mission-overwatch-slo-2026-02-23.md, docs/AGI-ROADMAP.md
```

### Worst #3: repo_tech_22_where-is-helix-ask-intent-directory-mapping-for-warp-ethos-relation
- family: repo_technical
- question: Where is helix ask intent directory mapping for warp+ethos relation?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
What is warp bubble: docs/knowledge/ethos/mission-ethos.md

What is mission ethos: docs/architecture/helix-ask-dottie-callout-templates.v1.md v1 v1.md server/routes/agi.plan.ts import from express ; import type from express ; import crypto from node:crypto ; import * as fs from node:fs ; import * as pa

How they connect: Mission ethos constrains warp development to measured, auditable checkpoints before deployment. Warp viability certificates enable ethos commitments by binding claims to reproducible evidence. [docs/knowledge/helix-ask-reasoning.md] Verification hooks translate design ambition into falsifiable tests across physics and policy layers. [docs/knowledge/helix-ask-reasoning.md] Constraints and falsifiability: Physics bounds: Ford-Roman QI, theta calibration, and GR constraint gates must pass before viability claims. [docs/knowledge/helix-ask-reasoning.md] Policy bounds: mission ethos requires stewardship, non-harm, and traceable evidence for operational decisions. [docs/knowledge/helix-ask-reasoning.md] Re-run /api/agi/adapter/run with updated action payload and require PASS with certificate integrity OK. [docs/knowledge/helix-ask-reasoning.md] Sources: docs/adr/adr-tts-stack-selection-2026-02-24.md, docs/AGI-ROADMAP.md, docs/architecture/helix-ask-dottie-callout-templates.v1.md, docs/architecture/helix-ask-math-router-contract.md, docs/architecture/helix-ask-mission-systems-integration-plan.md, docs/architecture/helix-ask-natural-philosophy-gap-closure-playbook.md, docs/architecture/helix-ask-proof-packet-rfc.md, docs/architecture/helix-ask-quake-balancing-primitives.md
```

### Worst #4: relation_23_compare-and-connect-warp-bubble-viability-gates-with-mission-ethos-gates
- family: relation
- question: Compare and connect warp bubble viability gates with mission ethos gates.
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Warp viability claims require the physics.warp.viability certificate path. Status: NOT_CERTIFIED (no certificate). First failing HARD constraint: FordRomanQI (not evaluated without certificate).

Sources: docs/knowledge/ethos/mission-ethos.md, docs/ethos/ideology.json, docs/ethos/why.md, docs/architecture/helix-ask-mission-systems-integration-plan.md, modules/warp/warp-module.ts, docs/warp-tree-dag-walk-rules.md, docs/warp-tree-dag-schema.md, docs/knowledge/warp/warp-bubble.md
```

### Worst #5: ambiguous_24_how-should-i-read-latency-percentiles
- family: ambiguous_general
- question: How should I read latency percentiles?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time. Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Sources: open-world best-effort (no repo citations required).
```

### Worst #6: ambiguous_05_how-should-i-think-about-uncertainty
- family: ambiguous_general
- question: How should I think about uncertainty?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Confirmed:
- Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [docs/knowledge/physics/uncertainty-mechanics-tree.json] - -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time. [docs/knowledge/physics/uncertainty-mechanics-tree.json] - Maturity (exploratory): th... [docs/knowledge/physics/uncertainty-mechanics-tree.json] Reasoned connections (bounded):
- Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [docs/knowledge/physics/uncertainty-mechanics-tree.json] (see docs/knowledge/physics/uncertainty-mechanics-tree.json). -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time. [docs/knowledge/physics/uncertainty-mechanics-tree.json] (see docs/knowledge/physics/uncertainty-mechanics-tree.json). Bounded linkage supported by cited evidence. [docs/knowledge/physics/uncertainty-mechanics-tree.json] Next evidence:
- Searched terms: How should I think about uncertainty?, mission overwatch intent context
- Checked files:, docs/helix-ask-flow.md, server/routes/agi.plan.ts,
- Check files under docs. - Search docs headings for "think". [docs/knowledge/physics/uncertainty-mechanics-tree.json] - Search docs headings for "uncertainty". [docs/knowledge/physics/uncertainty-mechanics-tree.json] - Search docs headings for "Uncertainty Mechanics Tree". [docs/knowledge/physics/uncertainty-mechanics-tree.json] Missing evidence: add directly relevant re
```

### Worst #7: repo_tech_16_where-are-citation-allowlists-normalized-before-sanitizesourcesline
- family: repo_technical
- question: Where are citation allowlists normalized before sanitizeSourcesLine?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=repo.repo_api_lookup intent_strategy=repo_rag report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
type TopologySwitchEvent = Extract<OrbitEvent, >; export type OrbitWavefieldState = fieldId: string; normalization: number;. [client/src/lib/docs/docviewer.ts] type TopologySwitchEvent = Extract<OrbitEvent, >;. [client/src/lib/docs/docviewer.ts] export type OrbitWavefieldState =. [client/src/lib/docs/docviewer.ts] if (!input) return fallback;. [client/src/lib/docs/docviewer.ts] In practice, type TopologySwitchEvent = Extract<OrbitEvent, >;. [client/src/lib/docs/docviewer.ts] Mechanism: type TopologySwitchEvent = Extract<OrbitEvent, >; export type OrbitWavefieldState = fieldId: string; normalization: number;. [client/src/lib/docs/docviewer.ts] -> constrained interaction dynamics -> type TopologySwitchEvent = Extract<OrbitEvent, >;., because linked constraints amplif. [client/src/lib/docs/docviewer.ts] Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts. [client/src/lib/docs/docviewer.ts] Missing evidence: add directly relevant repo paths or artifact refs to raise confidence. [client/src/lib/docs/docviewer.ts] Sources: client/src/lib/docs/docviewer.ts, server/services/knowledge/citations.ts, shared/whispers.ts, tests/console-summary.spec.ts, .github/workflows/casimir-verify.yml, artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/summary.json, configs/repo-atlas-bench-corpus.v2.json, modules/warp/natario-warp.ts

Sources: client/src/lib/docs/docviewer.ts, server/services/knowledge/citations.ts, shared/whispers.ts, tests/console-summary.spec.ts, .github/workflows/casimir-verify.yml, artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/summary.json, configs/repo-atlas-bench-corpus.v2.json, modules/warp/natario-warp.ts
```

### Worst #8: repo_tech_15_how-does-the-system-prevent-report-scaffold-responses-for-relation-promp
- family: repo_technical
- question: How does the system prevent report-scaffold responses for relation prompts?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
What is warp bubble: tools/tokamak-added-value-report.ts Atlas graph candidate: tools/tokamak-added-value-report.ts client/src/lib/luma-whispers-core.ts SYSTEM_WHISPERS = diagnostics: System pulse taken. What is mission ethos: docs/BUSINESS_MODEL.md

How they connect: Mission ethos constrains warp development to measured, auditable checkpoints before deployment. Warp viability certificates enable ethos commitments by binding claims to reproducible evidence. [tools/tokamak-added-value-report.ts] Verification hooks translate design ambition into falsifiable tests across physics and policy layers. [tools/tokamak-added-value-report.ts] Constraints and falsifiability: Physics bounds: Ford-Roman QI, theta calibration, and GR constraint gates must pass before viability claims. [tools/tokamak-added-value-report.ts] Policy bounds: mission ethos requires stewardship, non-harm, and traceable evidence for operational decisions. [tools/tokamak-added-value-report.ts] Re-run /api/agi/adapter/run with updated action payload and require PASS with certificate integrity OK. [tools/tokamak-added-value-report.ts] Sources: docs/BUSINESS_MODEL.md, cli/README.md, client/src/hooks/use-energy-pipeline.ts, client/src/lib/luma-whispers-core.ts, docs/ethos/ideology.json, docs/knowledge/warp/warp-bubble.md, modules/core/physics-constants.ts
```

### Worst #9: repo_tech_29_what-checks-enforce-presence-of-citations-in-repo-hybrid-responses
- family: repo_technical
- question: What checks enforce presence of citations in repo/hybrid responses?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Confirmed:
- Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [tests/theory-checks.spec.ts] - Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [tests/theory-checks.spec.ts] - -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time. [tests/theory-checks.spec.ts] Reasoned connections (bounded):
- Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [tests/theory-checks.spec.ts] (see tests/theory-checks.spec.tsMechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [tests/theory-checks.spec.ts] (see tests/theory-checks.spec.tsBounded linkage supported by cited evidence.)

Next evidence:
- Searched terms: mission overwatch intent context, ops, Checks
- Checked files:, docs/BUSINESS_MODEL.md,.github/workflows/casimir-verify.yml,
- Check files under tests or server. - Search docs headings for "enforce". [tests/theory-checks.spec.ts] - Search docs headings for "presence". [tests/theory-checks.spec.ts] - Search docs headings for "citation". [tests/theory-checks.spec.ts] I don't see repo evidence for enforce, presence, repo/hybrid, respons. [tests/theory-checks.spec.ts] Do you mean a repo-specific module/file, or the general concept? [tests/theory-checks.spec.ts] Point me to the file path or clarify the sense. [tests/theory-checks.spec.ts] Missing evidence: add directly relevant repo paths or artifact refs to raise confidence. [tests/theory-checks.spec.ts] Sources: tests/theory-checks.spe
```

### Worst #10: ambiguous_26_how-do-seeds-help-evaluation-reliability
- family: ambiguous_general
- question: How do seeds help evaluation reliability?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Confirmed:
- ## One sentence Helix is a constraint-first mission overwatch platform that converts live system events into actionable callouts,... [client/src/lib/whispers/seedwhispers.ts] - In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [client/src/lib/whispers/seedwhispers.ts] Reasoned connections (bounded):
- ## One sentence Helix is a constraint-first mission overwatch platform that converts live system events into actionable callouts,... [client/src/lib/whispers/seedwhispers.ts] (see client/src/lib/whispers/seedwhispers.1. (see client/src/lib/whispers/seedwhispers.Bounded linkage supported by cited evidence.)

Next evidence:
- Searched terms: How do seeds help evaluation reliability?, mission overwatch intent context, Mission Ethos Seeds
- Checked files:, shared/whispers.ts,,
- Check files under client or modules. - Search docs headings for "seed". [client/src/lib/whispers/seedwhispers.ts] - Search docs headings for "help". [client/src/lib/whispers/seedwhispers.ts] - Search docs headings for "evaluation". [client/src/lib/whispers/seedwhispers.ts] 1. I don't see repo evidence for seed, help, evaluation, reliability. [client/src/lib/whispers/seedwhispers.ts] Do you mean a repo-specific module/file, or the general concept? [client/src/lib/whispers/seedwhispers.ts] Point me to the file path or clarify the sense. [client/src/lib/whispers/seedwhispers.ts] Sources: client/src/lib/whispers/seedwhispers.ts, modules/dynamic/gates/index.ts, shared/whispers.ts, docs/business_model.md, server/db/migrations/migration.ts, scripts/helix-ask-versatility-record.ts, cli/readme.md, server/services/code-lattice/builders.ts
```

### Worst #11: relation_18_warp-ethos-relation-prompt-test-explain-links-and-guardrails
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

### Worst #12: relation_12_how-does-the-ideology-tree-constrain-warp-bubble-deployment-decisions
- family: relation
- question: How does the ideology tree constrain warp-bubble deployment decisions?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
What is warp bubble: docs/warp-tree-dag-walk-rules.md md modules/warp/warp-module.ts /** * TheoryRefs: * - vanden-broeck-1999: input normalization + clamps for gamma_VdB */ /** * Warp Bubble Casimir Module * Integrates Natário zero-expansion

What is mission ethos: docs/audits/ideology-physics-claim-gap-audit-2026-02-17.md 000 | symbol=git-tracked | file=docs/audits/ideology-physics-claim-gap-audit-2026-02-17.md

How they connect: Mission ethos constrains warp development to measured, auditable checkpoints before deployment. Warp viability certificates enable ethos commitments by binding claims to reproducible evidence. [docs/knowledge/warp/warp-bubble.md] Verification hooks translate design ambition into falsifiable tests across physics and policy layers. [docs/knowledge/warp/warp-bubble.md] Constraints and falsifiability: Physics bounds: Ford-Roman QI, theta calibration, and GR constraint gates must pass before viability claims. [docs/knowledge/warp/warp-bubble.md] Policy bounds: mission ethos requires stewardship, non-harm, and traceable evidence for operational decisions. [docs/knowledge/warp/warp-bubble.md] Re-run /api/agi/adapter/run with updated action payload and require PASS with certificate integrity OK. [docs/knowledge/warp/warp-bubble.md] Sources: docs/audits/ideology-physics-claim-gap-audit-2026-02-17.md, docs/audits/research/helix-ask-mission-overwatch-v1-wave3a-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md, docs/BUSINESS_MODEL.md, docs/ethos/ideology.json, docs/ethos/why.md, docs/runbooks/mission-overwatch-slo-2026-02-23.md, docs/AGI-ROADMAP.md, docs/architecture/agibot-knowledge-linking-contract-v1.md
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
Confirmed:
- ## One sentence Helix is a constraint-first mission overwatch platform that converts live system events into actionable callouts,... [client/src/lib/gl/capabilities.ts] - In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [client/src/lib/gl/capabilities.ts] Reasoned connections (bounded):
- ## One sentence Helix is a constraint-first mission overwatch platform that converts live system events into actionable callouts,... [client/src/lib/gl/capabilities.ts] (see client/src/lib/gl/capabilities.ts1. (see client/src/lib/gl/capabilities.tsBounded linkage supported by cited evidence.)

Next evidence:
- Searched terms: How does arbiter_mode get selected for repo vs hybrid asks?, mission overwatch intent context, Repo Forest Coverage Audit - 2026-02-18, repo forest coverage audit 2026 02 18
- Checked files:,,, modules/dynamic/dynamic-casimir.ts
- Check files under client or server. - Search docs headings for "arbiter_mode". [client/src/lib/gl/capabilities.ts] - Search docs headings for "get". [client/src/lib/gl/capabilities.ts] - Search docs headings for "hybrid". [client/src/lib/gl/capabilities.ts] 1. I don't see repo evidence for arbiter_mode, get, hybrid. [client/src/lib/gl/capabilities.ts] Do you mean a repo-specific module/file, or the general concept? [client/src/lib/gl/capabilities.ts] Point me to the file path or clarify the sense. [client/src/lib/gl/capabilities.ts] Sources: client/src/lib/gl/capabilities.ts, server/services/jobs/token-budget.ts, modules/dynamic/dynamic-casimir.ts, docs/business_model.md, shared/whispers.ts, artifacts/experiments/post-ae077-audit/raw/life_p01_s11.json, configs/repo-atlas-bench-corpus.v2.json, reports/helix-ask-versatility-codex-cloud.md
```

### Worst #14: repo_tech_28_how-is-platonic-gate-scoring-attached-to-final-response-debug
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
- Searched terms: mission overwatch intent context
- Checked files: docs/helix-ask-readiness-debug-loop.md,,,
- Check files under docs or client. - Search docs headings for "gate". [docs/helix-ask-readiness-debug-loop.md] - Search docs headings for "scor". [docs/helix-ask-readiness-debug-loop.md] - Search docs headings for "attach". [docs/helix-ask-readiness-debug-loop.md] 1. I don't see repo evidence for gate, scor, attach, final, response. [docs/helix-ask-readiness-debug-loop.md] Do you mean a repo-specific module/file, or the general concept? [docs/helix-ask-readiness-debug-loop.md] Point me to the file path or clarify the sense. [docs/helix-ask-readiness-debug-loop.md] Missing evidence: add directly relevant repo paths or artifact refs to raise confidence. [docs/helix-ask-readiness-debug-loop.md] Sources: docs/helix-ask-readiness-debug-loop.md, client/src/lib/noise/kb-autoselect.ts, server/services/debate/orchestrator.ts, shared/whispers.ts, modules/dynamic/gates/index.ts, tests/helix-ask-evidence-gate.spec.ts, scripts/helix-ask-utility-ab.ts, onl
```

### Worst #15: relation_13_bridge-warp-physics-evidence-to-ethos-stewardship-without-report-mode
- family: relation
- question: Bridge warp physics evidence to ethos stewardship without report mode.
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
What is warp bubble: modules/warp/warp-module.ts /** * TheoryRefs: * - vanden-broeck-1999: input normalization + clamps for gamma_VdB */ /** * Warp Bubble Casimir Module * Integrates Natário zero-expansion warp bubble calculations with the m

What is mission ethos: docs/BUSINESS_MODEL.md

How they connect: Mission ethos constrains warp development to measured, auditable checkpoints before deployment. Warp viability certificates enable ethos commitments by binding claims to reproducible evidence. [modules/warp/warp-module.ts] Verification hooks translate design ambition into falsifiable tests across physics and policy layers. [modules/warp/warp-module.ts] Constraints and falsifiability: Physics bounds: Ford-Roman QI, theta calibration, and GR constraint gates must pass before viability claims. [modules/warp/warp-module.ts] Policy bounds: mission ethos requires stewardship, non-harm, and traceable evidence for operational decisions. [modules/warp/warp-module.ts] Re-run /api/agi/adapter/run with updated action payload and require PASS with certificate integrity OK. [modules/warp/warp-module.ts] Sources: docs/BUSINESS_MODEL.md, docs/ethos/ideology.json, docs/ethos/why.md, docs/knowledge/ethos/ethos-knowledge-tree.json, docs/knowledge/ethos/stewardship-ledger.md, docs/knowledge/ethos/verification-checklist.md, cli/README.md
```

## Recommendation
- decision: ship
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
