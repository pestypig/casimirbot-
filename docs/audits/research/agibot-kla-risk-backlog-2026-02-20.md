# AGIBOT KLA Risk Backlog (2026-02-20)

Execution-ready backlog derived from evidence and stack-mapping proposals.

## Risk backlog table

| priority | risk | lane_owner | patch_target | acceptance_check | disconfirmation_trigger | evidence_claim_ids |
|---|---|---|---|---|---|---|
| P0 | Missing hard proof of safe separation between high-level LLM output and actuator-level control | lane_risk_governance | architecture/control-path audits + route guards | deterministic actuator-gate audit shows no unguarded path and Casimir PASS | any direct unmediated actuator invocation path discovered | AGIBOT-KLA-014 |
| P0 | Replay ordering instability for timing/concurrency incidents | lane_timing_replay | event-segmented timing schema + replay runbook | stable replay ordering on fixed fixtures with no `logical_seq` drift | same fixture replays produce differing ordered event traces | AGIBOT-KLA-008, AGIBOT-KLA-012 |
| P1 | Knowledge retrieval may return insufficient or low-confidence evidence | lane_knowledge_binding | knowledge-linking contract + indexing runbook | fail-closed reason codes emitted for missing evidence; canonical-source coverage reported | runtime returns implementation claim without canonical citation tuple | AGIBOT-KLA-005, AGIBOT-KLA-006, AGIBOT-KLA-013 |
| P1 | AGIBOT source claims remain inferred without source-line provenance hardening | lane_evidence | evidence ledger follow-up packet | all inferred claims promoted or explicitly retained with deterministic TODOs | unresolved inferred claims used as certified-stage basis | AGIBOT-KLA-003, AGIBOT-KLA-004, AGIBOT-KLA-010, AGIBOT-KLA-011 |
| P2 | X1 artifact provenance gaps can leak uncertain assumptions into planning | lane_knowledge_binding | X1 asset manifest and confidence tagging | manifest completeness check + provenance hash coverage | critical X1 assumption lacks artifact pointer/hash | AGIBOT-KLA-004 |
| P2 | Parallel lane merges can drift from deterministic execution order | lane_codex_workflow | Codex Cloud merge template + execution ledger discipline | lane merge report includes deterministic merge order and reproducible commands | conflicting lane artifacts merged without deterministic ordering proof | AGIBOT-KLA-007, AGIBOT-KLA-010 |

## GO/NO-GO threshold block (deployment-readiness claims)

Deployment-readiness claim is **GO** only if all conditions hold:

1. All P0 rows pass acceptance checks.
2. No unresolved HARD Casimir failures.
3. Certificate integrity remains `integrityOk=true` on latest run.
4. Unknown/inferred evidence used for critical safety claims is resolved or explicitly blocked.

Otherwise status is **NO-GO** with blocker list by risk row.
