# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: 0b65cb4b
- git_origin_main: ccfb00e9
- git_ahead_behind: 0	1
- provenance_gate_pass: true
- provenance_warnings: none
- decision_grade_ready: true
- provenance_blocked: false
- provenance_hard_blocker_reason: none
- ship_recommendation_blocked_by_hard_blocker: false
- run_id: versatility-1772760410007
- base_url: http://127.0.0.1:5173
- prompts: 90
- seeds: 7,11,13
- temperatures: 0.2
- expected_runs: 270
- total_runs: 270
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 1833921
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1772760410007

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 90 | 100.0% | 100.0% | 100.0% | 0.0% | 6251 | 10570 |
| repo_technical | 90 | 96.7% | 0.0% | 96.7% | 0.0% | 6681 | 13419 |
| ambiguous_general | 90 | 100.0% | 0.0% | 100.0% | 0.0% | 5306 | 11046 |

## Core Metrics
- intent_id_correct_rate: 100.00%
- report_mode_correct_rate: 98.89%
- relation_packet_built_rate: 100.00%
- relation_dual_domain_ok_rate: 100.00%
- avg_attempts_per_run: 1.02
- p95_attempts_per_run: 1
- stub_text_detected_rate: 0.00%
- deterministic_fallback_relation_rate: 63.33%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 98.89%
- min_text_length_pass_rate: 98.89%
- latency_total_p50_ms: 5802
- latency_total_p95_ms: 13002
- latency_retrieval_p50_ms: 608 (samples=254)
- latency_retrieval_p95_ms: 3388 (samples=254)
- latency_synthesis_p50_ms: 1 (samples=267)
- latency_synthesis_p95_ms: 2 (samples=267)

## Top Failure Signatures
- request_failed: 3
- report_mode_mismatch: 3
- text_too_short: 3
- citation_missing: 3

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

### Worst #2: ambiguous_27_what-s-a-robust-pass-criterion-for-prompts
- family: ambiguous_general
- question: What's a robust pass criterion for prompts?
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

### Worst #3: ambiguous_08_what-s-a-good-way-to-summarize-evidence
- family: ambiguous_general
- question: What's a good way to summarize evidence?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete.

In practice, coupled constraints and feedback loops determine how outcomes evolve over time.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add directly relevant repo paths or artifact refs to raise confidence.

Sources: open-world best-effort (no repo citations required).
```

### Worst #4: repo_tech_16_where-are-citation-allowlists-normalized-before-sanitizesourcesline
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

### Worst #5: ambiguous_26_how-do-seeds-help-evaluation-reliability
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

### Worst #6: repo_tech_15_how-does-the-system-prevent-report-scaffold-responses-for-relation-promp
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

### Worst #7: relation_18_warp-ethos-relation-prompt-test-explain-links-and-guardrails
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

### Worst #8: repo_tech_29_what-checks-enforce-presence-of-citations-in-repo-hybrid-responses
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

### Worst #9: relation_12_how-does-the-ideology-tree-constrain-warp-bubble-deployment-decisions
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

### Worst #10: repo_tech_23_how-does-arbiter-mode-get-selected-for-repo-vs-hybrid-asks
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

### Worst #11: repo_tech_24_what-files-are-considered-high-signal-for-mission-ethos-reference-intent
- family: repo_technical
- question: What files are considered high-signal for mission ethos reference intents?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=repo.ideology_reference intent_strategy=repo_rag report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In plain language, Mission Ethos means the warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] This is in the ideology scope. [docs/knowledge/ethos/mission-ethos.md] Sources: docs/knowledge/ethos/mission-ethos.md, docs/ethos/ideology.json, docs/ethos/why.md
```

### Worst #12: relation_20_how-does-casimir-verification-connect-to-ideology-accountability-in-warp
- family: relation
- question: How does Casimir verification connect to ideology accountability in warp work?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In this system, ideology is anchored in docs/ethos/ideology.json and links mission vows to ledger gates and verification artifacts. In practice, Ideology in this system is the structured ethos tree that binds decisions to mission vows, non-harm, and verification. [docs/knowledge/ideology.md] Mechanism: In this system, ideology is anchored in docs/ethos/ideology.json and links mission vows to ledger gates and verification artifacts. -> constrained interaction dynamics -> Ideology in this system is the structured ethos tree that binds decisions to m. [docs/knowledge/ideology.md] Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts. [docs/knowledge/ideology.md] Missing evidence: add directly relevant repo paths or artifact refs to raise confidence. [docs/knowledge/ideology.md] Sources: docs/knowledge/warp/warp-mechanics-tree.json, docs/knowledge/warp/warp-bubble.md, docs/knowledge/warp/natario-zero-expansion.md, docs/knowledge/ethos/verification-checklist.md, docs/warp-pulsed-power.md, docs/ethos/why.md, docs/casimir-tile-mechanism.md, docs/knowledge/casimir-tiles.md

Sources: docs/knowledge/ideology.md, docs/knowledge/warp/warp-mechanics-tree.json, docs/knowledge/warp/warp-bubble.md, docs/knowledge/warp/natario-zero-expansion.md, docs/knowledge/ethos/verification-checklist.md, docs/warp-pulsed-power.md, docs/ethos/why.md, docs/casimir-tile-mechanism.md
```

### Worst #13: repo_tech_12_where-is-relation-topology-dual-domain-detection-implemented
- family: repo_technical
- question: Where is relation topology dual-domain detection implemented?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
What is warp bubble: client/src/lib/luma-whispers-core.ts MODE_WHISPERS = Hover: Form first. What is mission ethos: docs/BUSINESS_MODEL.md

How they connect: Mission ethos constrains warp development to measured, auditable checkpoints before deployment. Warp viability certificates enable ethos commitments by binding claims to reproducible evidence. [client/src/lib/luma-whispers-core.ts] Verification hooks translate design ambition into falsifiable tests across physics and policy layers. [client/src/lib/luma-whispers-core.ts] Constraints and falsifiability: Physics bounds: Ford-Roman QI, theta calibration, and GR constraint gates must pass before viability claims. [client/src/lib/luma-whispers-core.ts] Policy bounds: mission ethos requires stewardship, non-harm, and traceable evidence for operational decisions. [client/src/lib/luma-whispers-core.ts] Re-run /api/agi/adapter/run with updated action payload and require PASS with certificate integrity OK. [client/src/lib/luma-whispers-core.ts] Sources: docs/BUSINESS_MODEL.md, cli/README.md, client/src/hooks/use-energy-pipeline.ts, client/src/lib/luma-whispers-core.ts, docs/ethos/ideology.json, docs/knowledge/warp/warp-bubble.md, modules/core/module-registry.ts
```

### Worst #14: ambiguous_02_what-s-a-cavity
- family: ambiguous_general
- question: What's a cavity?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In this repo, a cavity is the Casimir/drive cavity mechanism where geometry, gap, and quality factor (Q) control stored energy, loss, and pipeline-level drive constraints.

- Evidence: cavity geometry and quality-factor mechanisms used by Casimir and warp-energy computations.
- Constraint: Interpretation: "cavity" is treated as Cavity Mechanism.

In practice, cavity geometry and quality-factor mechanisms used by Casimir and warp-energy computations.

Mechanism: In this repo, a cavity is the Casimir/drive cavity mechanism where geometry, gap, and quality factor (Q) control stored energy, loss, and pipeline-level drive constraints. -> constrained interaction dynamics -> cavity geometry and quality-factor mec.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add directly relevant repo paths or artifact refs to raise confidence.

Sources: open-world best-effort (no repo citations required).
```

### Worst #15: repo_tech_26_explain-how-answer-path-is-populated-and-useful-for-diagnostics
- family: repo_technical
- question: Explain how answer_path is populated and useful for diagnostics.
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

## Recommendation
- decision: ship
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
