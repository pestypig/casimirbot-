# AGIBOT Knowledge-Linked Agents -> Codex Cloud Autorun Batch Prompt Pack (2026-02-20)

Derived from:
- `docs/audits/research/agibot-open-source-knowledge-linked-agents-deep-research-2026-02-20.md`

Use this document to run proposal execution in Codex Cloud with deterministic lane discipline and mandatory Casimir verification.

## Shared guardrails (include in every run)

```text
Hard constraints:
1) Do not over-claim physics maturity. Keep claims at documented stage unless stronger evidence is produced.
2) No unsafe direct control path from high-level LLM output to actuator-level execution.
3) Preserve deterministic replay requirements on timing/concurrency-related changes.
4) Keep patch scope minimal and path-bounded per prompt.

Mandatory verification gate after each patch:
npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

If verdict is FAIL:
- fix first failing HARD constraint
- rerun until PASS

Always report:
- files changed
- behavior delta
- tests/checks run
- verdict
- firstFail
- certificateHash
- integrityOk
- traceId
- runId
```

## Single autorun launcher prompt (paste into Codex Cloud)

```text
Execution mode:
AUTORUN. Execute end-to-end without pausing for confirmations unless a hard blocker prevents continuation.

Primary objective:
Implement the proposal batch from `docs/audits/research/agibot-open-source-knowledge-linked-agents-codex-cloud-autorun-batch-prompt-pack-2026-02-20.md` in strict order (Prompt 0 -> Prompt 8), one prompt per commit.

Global rules:
1) Respect each prompt's allowed paths.
2) Keep changes additive/minimal.
3) Run prompt-specific checks plus Casimir verify after each prompt.
4) If blocked, ship maximum safe subset and leave deterministic TODOs.
5) Do not claim completion unless final Casimir verify is PASS with certificate integrity OK.

Deliverables at end:
- list of commits by prompt
- final artifact table with EXISTS/MISSING
- final Casimir block (verdict, firstFail, certificateHash, integrityOk, traceId, runId)
- GO/NO-GO with top blockers (if NO-GO)
```

## Prompt 0: Coordinator and lane setup

```text
Objective:
Prepare execution scaffolding for deterministic, replay-safe implementation lanes.

Allowed paths:
- docs/audits/research/agibot-open-source-knowledge-linked-agents-codex-cloud-autorun-batch-prompt-pack-2026-02-20.md
- reports/agibot-kla-execution-ledger-2026-02-20.md (new)

Requirements:
1) Create an execution ledger with prompt IDs, status, commit hash, and artifact links.
2) Define lane IDs:
   - lane_evidence
   - lane_knowledge_binding
   - lane_timing_replay
   - lane_codex_workflow
   - lane_risk_governance
3) Add a deterministic completion checklist for each prompt.

Checks:
- casimir verify command

Done criteria:
- Ledger exists and is ready to track full batch execution.
```

## Prompt 1: Research evidence ledger normalization

```text
Objective:
Convert deep-research claims into a machine-auditable evidence ledger.

Allowed paths:
- docs/audits/research/agibot-kla-evidence-ledger-2026-02-20.md (new)
- docs/audits/research/agibot-open-source-knowledge-linked-agents-deep-research-2026-02-20.md

Requirements:
1) Assign stable claim IDs for major assertions.
2) Split each claim into status: confirmed | inferred | unknown.
3) Add deterministic follow-up action for every unknown or conflicted claim.
4) Keep a one-line relevance tag per claim:
   - simulation
   - runtime
   - knowledge-linking
   - codex-cloud
   - deterministic-timing

Checks:
- markdown/doc checks if available
- casimir verify command

Done criteria:
- Evidence ledger is complete enough to drive implementation prompts without ambiguous claims.
```

## Prompt 2: Knowledge-linking architecture contract

```text
Objective:
Define the source-of-truth to retrieval-runtime contract for "SoulSync"-style knowledge binding.

Allowed paths:
- docs/architecture/agibot-knowledge-linking-contract-v1.md (new)
- docs/runbooks/agibot-knowledge-indexing-runbook-2026-02-20.md (new)
- docs/audits/research/agibot-kla-evidence-ledger-2026-02-20.md

Requirements:
1) Specify canonical source classes: docs, runbooks, incident reports, selected code snapshots.
2) Define metadata schema: repo/module/date/environment/customer/confidence.
3) Define retrieval behavior contract (vector store + file_search usage expectations).
4) Define fail-closed behavior when required evidence retrieval fails.

Checks:
- casimir verify command

Done criteria:
- Contract is explicit enough for direct implementation by backend/runtime tickets.
```

## Prompt 3: Deterministic timing and replay schema

```text
Objective:
Create a concrete event-segmented timing schema with physical and logical time separation.

Allowed paths:
- docs/architecture/event-segmented-timing-and-replay-v1.md (new)
- docs/architecture/agibot-knowledge-linking-contract-v1.md
- shared/schema.ts (only if minimal schema extension is needed)
- server/services/observability/training-trace-store.ts (only if minimal trace field hooks are needed)
- tests/*timing* tests related to touched schema/trace contracts

Requirements:
1) Define required fields:
   - monotonic_ts
   - logical_seq
   - scenario_id
   - seed_id
   - lane_id
2) Define replay ordering rules and nondeterminism policy boundaries.
3) Preserve backward compatibility in existing trace consumers.
4) Add or update minimal regression tests if schema/runtime changes are made.

Checks:
- npm run check (if code touched)
- scoped tests for touched timing/trace contracts
- casimir verify command

Done criteria:
- Deterministic replay contract is explicit and test-backed for timing/concurrency lanes.
```

## Prompt 4: Rare bug replay runbook and incident contract

```text
Objective:
Operationalize replay of rare concurrency/timing bugs from capture to verification.

Allowed paths:
- docs/runbooks/rare-bug-replay-and-lane-debugging-2026-02-20.md (new)
- docs/architecture/event-segmented-timing-and-replay-v1.md
- docs/audits/research/agibot-kla-evidence-ledger-2026-02-20.md

Requirements:
1) Define capture protocol for significant events and incident metadata.
2) Define replay protocol (ordering enforcement + deterministic substitutes).
3) Define pass/fail criteria for replay equivalence.
4) Include commands and artifact path conventions.

Checks:
- casimir verify command

Done criteria:
- Runbook supports reproducible incident-to-patch workflows.
```

## Prompt 5: Codex Cloud workflow templates and objective lanes

```text
Objective:
Create reusable Codex Cloud templates for objective-bound, deterministic-lane execution.

Allowed paths:
- docs/research/agibot-codex-cloud-runner-templates-2026-02-20.md (new)
- docs/audits/research/agibot-open-source-knowledge-linked-agents-codex-cloud-autorun-batch-prompt-pack-2026-02-20.md

Requirements:
1) Provide templates for:
   - Ask-mode investigation
   - Code-mode patch run
   - parallel lane execution
   - final reconciliation/merge report
2) Include mandatory deliverables per run:
   - lane design note
   - patch/test output
   - reproducible command list
   - Casimir block
3) Include deterministic constraints for timing/concurrency patches.

Checks:
- casimir verify command

Done criteria:
- Templates are directly reusable for future repo waves.
```

## Prompt 6: AGIBOT stack mapping proposal pack

```text
Objective:
Map AGIBOT stack surfaces (Link-U-OS, AimRT, X1 artifacts) into concrete integration proposals for this repo.

Allowed paths:
- docs/audits/research/agibot-stack-mapping-proposals-2026-02-20.md (new)
- docs/architecture/agibot-knowledge-linking-contract-v1.md
- docs/architecture/event-segmented-timing-and-replay-v1.md

Requirements:
1) Create proposal table with columns:
   - agibot_surface
   - casimirbot_target
   - integration_pattern
   - deterministic_gate
   - risk_level
2) Separate short-term (P0/P1) and medium-term (P2/P3) proposals.
3) Include one disconfirmation trigger per proposal.

Checks:
- casimir verify command

Done criteria:
- Proposal pack is actionable for implementation sequencing.
```

## Prompt 7: Risk backlog and acceptance gate matrix

```text
Objective:
Translate research and proposals into an execution-ready risk backlog with measurable acceptance gates.

Allowed paths:
- docs/audits/research/agibot-kla-risk-backlog-2026-02-20.md (new)
- reports/agibot-kla-execution-ledger-2026-02-20.md

Requirements:
1) Build P0/P1/P2 backlog rows with:
   - risk
   - lane_owner
   - patch_target
   - acceptance_check
   - disconfirmation_trigger
2) Add explicit go/no-go threshold block for deployment readiness claims.
3) Link each risk row to relevant evidence-claim IDs.

Checks:
- casimir verify command

Done criteria:
- Backlog is ticket-ready and can be run lane-by-lane.
```

## Prompt 8: Final readiness report

```text
Objective:
Publish final readiness report for this proposal wave with deterministic evidence and gate status.

Allowed paths:
- reports/agibot-kla-readiness-report-2026-02-20.md (new)
- reports/agibot-kla-execution-ledger-2026-02-20.md
- docs/audits/research/agibot-kla-risk-backlog-2026-02-20.md
- docs/audits/research/agibot-kla-evidence-ledger-2026-02-20.md

Requirements:
1) Summarize prompt completion status and artifact inventory.
2) Report remaining blockers and missing evidence.
3) Include final Casimir block with required fields.
4) State GO/NO-GO and why.

Checks:
- casimir verify command

Done criteria:
- Report is decision-grade and replay-auditable.
```

## Suggested run order

1. `Prompt 0`
2. `Prompt 1`
3. `Prompt 2`
4. `Prompt 3`
5. `Prompt 4`
6. `Prompt 5`
7. `Prompt 6`
8. `Prompt 7`
9. `Prompt 8`

## Optional single-shot runner variant

If you want a one-message Codex run without per-prompt manual restarts, paste the launcher prompt and append:

```text
Treat Prompt 0..8 as required phases from this file. Execute sequentially, one commit per phase, and continue automatically after each successful Casimir PASS.
```
