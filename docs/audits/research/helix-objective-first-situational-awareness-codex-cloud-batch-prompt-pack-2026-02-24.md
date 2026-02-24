# Helix Objective-First Situational Awareness Codex Cloud Batch Prompt Pack

Date: 2026-02-24  
Use: run prompts in order; one commit per prompt; preserve existing contracts.

## Prompt 0: Sync and baseline checks

```text
Sync to latest main. Then print:
- HEAD short SHA
- git status --short --branch
- list of files matching objective-first docs/reports paths

Do not edit files yet.
```

## Prompt 1: Contract foundation (objective and gap schema)

```text
Implement additive objective-first mission schema and helpers.

Scope:
- Add typed objective/gap structures (no breaking API changes).
- Add deterministic objective/gap state transition helpers.
- Keep compatibility with current mission-board event model.

Files to touch:
- shared mission-overwatch contract files
- server mission-overwatch helpers
- focused tests for transitions and determinism

Validation:
- run targeted vitest files for mission contracts
- run docs/schema validator if affected
- run casimir verify and report PASS hash/integrity
```

## Prompt 2: Shared eligibility policy (single source of truth)

```text
Unify speak eligibility and suppression policy evaluation.

Scope:
- Create one shared evaluator for emit_text/emit_voice/suppression_reason/cooldown_ms.
- Reuse it in server voice route and mission salience path.
- Keep existing deterministic reason labels unchanged unless additive.
- Preserve voice certainty parity behavior.

Validation:
- parity matrix tests
- voice route tests
- mission salience tests
- casimir verify PASS hash/integrity
```

## Prompt 3: Helix Ask UI objective-plus-gap projection

```text
Wire objective-first state into Helix Ask UI.

Scope:
- Add objective card section to Helix Ask pill.
- Add top unresolved gaps list (severity then age sorting).
- Add suppression inspector row for callout decisions.
- Keep read-aloud behavior deterministic and one-at-a-time.

Validation:
- component tests for state transitions
- API client tests if payload changes are additive
- casimir verify PASS hash/integrity
```

## Prompt 4: Runtime linkage and scenario reports

```text
Extend situational report pipeline for objective-first debugging.

Scope:
- Include objectiveId/gapId/eventId/traceId links in transcript and debug output.
- Ensure machine-readable report includes suppression reason and policyClock.
- Keep output deterministic for same fixture input.

Validation:
- generated situational spec
- replay integration spec
- helix:dottie situational report command
- casimir verify PASS hash/integrity
```

## Prompt 5: Final convergence and handoff

```text
Run full targeted suite for objective-first surface and produce handoff report.

Required outputs:
- summary of changed files
- tests executed with PASS/FAIL
- casimir verify block with:
  - verdict
  - firstFail
  - certificateHash
  - integrityOk
- remaining risks and next patch recommendations

Push to main.
```

## Required command set per prompt

```bash
npx vitest run <targeted specs>
npm run validate:helix-dottie-docs-schema
npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
```

## Guardrails

- No contract-breaking changes to `/api/voice/speak` or mission-board endpoints.
- Keep deterministic suppression/fail reasons stable.
- Keep voice certainty no stronger than text certainty.
- Prefer additive fields and backward-compatible defaults.
