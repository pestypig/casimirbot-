# AGIBOT Codex Cloud Runner Templates (2026-02-20)

Reusable templates for objective-bound, deterministic-lane execution in Codex Cloud.

## Global deterministic constraints (apply to all templates)

- No direct high-level LLM output to actuator execution.
- Timing/concurrency patches must preserve replay determinism.
- Patch scope must remain path-bounded.
- Every run must include a Casimir block with PASS requirement.

## Template A: Ask-mode investigation

```text
Mode: Ask
Objective: <single investigatory question>
Lane: <lane_id>
Allowed paths: <docs/reports only unless otherwise stated>
Deliverables:
1) lane design note
2) evidence summary with claim IDs
3) reproducible command list
4) Casimir block (verdict, firstFail, certificateHash, integrityOk, traceId, runId)
```

## Template B: Code-mode patch run

```text
Mode: Code
Objective: <single patch objective>
Lane: <lane_id>
Allowed paths: <explicit list>
Constraints:
- additive/minimal changes only
- deterministic replay contract preserved
Checks:
- prompt-specific checks
- npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
Deliverables:
1) lane design note
2) patch + test/check output
3) reproducible command list
4) Casimir block
```

## Template C: Parallel lane execution

```text
Mode: Mixed (Ask/Code per lane)
Objective: execute independent lanes in parallel with deterministic merge points
Lanes: lane_evidence | lane_knowledge_binding | lane_timing_replay | lane_codex_workflow | lane_risk_governance
Rules:
- one objective per lane wave
- no shared mutable artifact edits across lanes in same wave
- each lane produces independent Casimir block
Merge deliverables:
1) lane-by-lane patch summary
2) conflict report and deterministic merge order
3) combined reproducible command list
4) merged Casimir block post-reconciliation
```

## Template D: Final reconciliation/merge report

```text
Objective: produce decision-grade completion report
Inputs:
- all lane outputs
- execution ledger
- risk backlog
Required report sections:
1) prompt/lane completion matrix
2) artifact inventory (EXISTS/MISSING)
3) blocker list
4) final GO/NO-GO
5) final Casimir block
```

## Mandatory deliverables checklist per run

- lane design note
- patch/test output
- reproducible command list
- Casimir block
