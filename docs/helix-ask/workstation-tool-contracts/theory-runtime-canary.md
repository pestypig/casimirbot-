# Theory Runtime Canary

Maturity: `draft`

## Purpose

The theory runtime canary checks only whether the server can run its exact,
server-owned, no-import Lean self-test through the trusted runtime approval and
replay path. It is a plumbing canary, not a theorem or scientific verifier.
Even a passing result has no semantic-claim, theorem-type, theory-graph,
physical, numerical, generated-code, formal-closure, promotion, answer, or
terminal authority.

The lifecycle is:

```txt
inspect -> plan -> confirmed start -> read_result
  -> current-turn observation re-entry -> model synthesis
```

The default production singleton is fail-closed until the server installs a
trusted approval host, repository root, pinned Lean executable, trusted receipt
verifier, and atomic replay ledger. Helix never signs or approves its own start
request.

## Owner

- Account policy: `developer`
- Panel: `theory-badge-graph`
- Runtime and sealed self-test input: server-owned
- Approval: trusted Codex/runtime approval lifecycle
- Reasoning, retry, result re-entry, and completion: Codex-owned
- Terminal eligibility and evidence provenance: Helix-owned

## Inputs

| Capability                          | Mode   | Required input                                |
| ----------------------------------- | ------ | --------------------------------------------- |
| `theory-runtime-canary.inspect`     | `read` | none                                          |
| `theory-runtime-canary.plan`        | `read` | none                                          |
| `theory-runtime-canary.start`       | `act`  | `plan_id`                                     |
| `theory-runtime-canary.read_result` | `read` | `job_id`; optional nonnegative `poll_attempt` |

`source_target_intent` is optional routing context on all four capabilities.
The trusted single-use approval receipt belongs to the gateway control envelope
and must not be accepted as caller-authored tool JSON.

`inspect`, `plan`, and `read_result` are read-only. `start` requires explicit
confirmation and may launch only the pinned direct-executable Lean self-test;
it remains `mutating=false`, `shell_access=false`, and `code_mutation=false`.

## Observation

The four nonterminal observation schemas are:

- `casimir.formal_runtime_canary.inspection_observation.v1`
- `casimir.formal_runtime_canary.plan_observation.v1`
- `casimir.formal_runtime_canary.start_observation.v1`
- `casimir.formal_runtime_canary.result_observation.v1`
- completed results contain only
  `casimir.formal_runtime_canary.replay_report.v1`, never a reusable
  scientific formal-verification certificate

All observations preserve the following authority boundary:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

A completed replay reports bounded evidence about the exact canary only. It is
never a Casimir certificate or evidence that a user theory is correct.

## Host Projection

A client may display readiness, plan, confirmation-needed, running, blocked,
failed, or completed status from the structured observation. That projection
is not answer authority and must not strengthen the observation's scientific
or terminal meaning.

## Visible Trace

The trace must preserve the exact capability id, admission decision, approval
state, sealed plan/job identity, bounded result state, typed failure reason,
observation schema, and the required post-tool model step. Raw process output,
approval secrets, local paths, and unbounded Lean output are not projected.

## Negative Admission

Fail closed for:

- non-developer accounts;
- absent or mismatched `plan_id` or `job_id`;
- missing, invalid, stale, cross-turn, or replayed runtime approval receipts;
- unconfigured approval host, receipt verifier, Lean executable, repository
  root, or atomic replay ledger;
- caller-authored executable, source, import, command, path, or theorem input;
- attempts to treat inspection, plans, receipts, or results as an answer,
  scientific validation, formal closure, or terminal product.

## Tests

Before promotion beyond `draft`, add dedicated gateway tests for developer
admission, current-turn confirmation, trusted-receipt replay rejection, sealed
plan binding, bounded polling, evidence re-entry, and terminal-authority
rejection. Runtime-backed self-test cases remain conditional on the pinned Lean
runtime being available and do not by themselves promote this contract.

Implementation anchors:

- `server/services/helix-ask/workstation-tool-gateway/theory-runtime-canary.ts`
- `server/services/theory/casimir-formal-runtime-canary-service.ts`
