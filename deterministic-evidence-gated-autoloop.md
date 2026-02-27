# Deterministic Evidence-Gated Autoloop (DEGA)

## Purpose

DEGA is the default execution loop for agent work that must converge on real closure.
It prevents false "done" states by requiring deterministic evidence at every cycle.

Core rule:

- Findings decide the next action, not preference.
- If evidence says the issue remains, the loop continues or blocks with typed reasons.

Motivation rule:

- Use `docs/ethos/ideology.json` to explain why persistence matters.
- Ideology may motivate effort, but it must never override failing evidence gates.

## Required Inputs and Artifacts

Before cycle 1, provide:

- `objective_id`: stable identifier for the target outcome.
- `objective_statement`: concrete success condition.
- `scope_allowlist`: files/paths allowed for this slice.
- `baseline_ref`: branch and commit SHA.
- `required_gates`: commands that must pass (including Casimir verify).
- `required_tests`: explicit test files or command set.
- `failure_taxonomy`: typed rejection/fail codes.
- `policy_mode`: `report-only` or `enforce`.

Evidence artifacts produced each cycle:

- changed files list
- test outputs summary
- verifier outputs summary (verdict, firstFail, certificate hash/integrity)
- blocker list with typed reasons
- next action decision

## Solved and Stop Criteria

Solved only when all are true:

- Objective acceptance checks pass.
- All HARD gates pass.
- Required verifier passes (`PASS` with integrity requirements satisfied).
- No unresolved HIGH/HARD findings in scope.
- Residual risk is explicitly stated and accepted by policy.

Stop as `blocked` when any are true:

- Required dependency is missing and not patchable in-scope.
- A policy/safety gate requires external approval.
- Repeated deterministic failure exceeds loop budget without new corrective options.

Never stop as solved when:

- Any required gate is unrun, failed, or inconclusive.
- Evidence is missing for a claim marked complete.

## Guardrails (Must Never Change)

- Do not skip required verifier/gate commands.
- Do not weaken thresholds or remove checks to force green.
- Do not modify files outside the declared allowlist.
- Do not emit untyped failure outcomes for hard blocks.
- Do not claim `certified` or equivalent without required certificate integrity evidence.
- Do not use cross-tenant or unscoped evidence in gated decisions.
- Do not use destructive git recovery commands unless explicitly authorized.

## Cycle Algorithm

Each DEGA cycle executes this sequence:

1. Lock context
- Capture current SHA, objective, scope allowlist, and policy mode.
- Load prior cycle artifacts.

2. Evaluate current state
- Run required baseline checks.
- Classify findings by severity and in/out-of-scope status.

3. Decide next action
- If HARD finding is in-scope: prepare minimal corrective patch.
- If out-of-scope dependency blocks progress: emit typed blocker and stop as `blocked`.
- If no actionable finding remains: run closure gates.

4. Apply minimal patch
- Change only allowlisted paths needed to resolve current top finding.

5. Re-run evidence gates
- Run targeted tests.
- Run required regression tests.
- Run required verifier (Casimir gate where required).

6. Record cycle output
- Store command results, typed failures, artifact references, and residual risk.

7. Convergence decision
- If solved criteria are met: close as `solved`.
- Else if blocked criteria are met: close as `blocked`.
- Else increment cycle and continue.

## Output Contract

Every cycle must emit this contract (JSON or markdown with equivalent fields):

```json
{
  "dega_version": "1",
  "objective_id": "string",
  "cycle_id": 1,
  "baseline_ref": {
    "branch": "string",
    "commit": "sha"
  },
  "policy_mode": "report-only|enforce",
  "status": "in_progress|solved|blocked",
  "findings": [
    {
      "severity": "hard|high|medium|low",
      "code": "TYPED_REASON",
      "summary": "string",
      "in_scope": true
    }
  ],
  "changes": [
    "path/to/file"
  ],
  "checks": [
    {
      "cmd": "string",
      "result": "pass|fail",
      "evidence_ref": "optional"
    }
  ],
  "verifier": {
    "name": "casimir",
    "verdict": "PASS|FAIL",
    "firstFail": "string|null",
    "certificateHash": "string|null",
    "integrityOk": true
  },
  "decision": {
    "next_action": "continue|close_solved|close_blocked",
    "reason": "string"
  }
}
```

## Portability Checklist for Other Repos

When porting DEGA, define:

- Required verifier command(s) and pass criteria.
- Required hard/soft gate taxonomy and typed codes.
- Scope allowlist mechanism and deterministic path-bound checker.
- CI/local parity command matrix.
- Promotion maturity stages and certification policy.
- Tenant/auth isolation requirements for evidence reads.
- Artifact storage paths for cycle outputs and closure reports.
- Blocker escalation path and explicit authority for overrides.

Minimum adoption test:

- Run one full cycle that fails, patches, re-verifies, and closes with a complete output contract.
