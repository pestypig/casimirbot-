# AGIBOT X1 Helix Wave 2 Execution Ledger (2026-02-20)

This ledger provides deterministic prompt-to-commit traceability for Wave 2.

## Strict ledger schema

Each prompt execution row MUST include:

- `prompt_id`
- `commit_sha`
- `files_changed`
- `checks_run`
- `casimir_traceId`
- `casimir_runId`
- `casimir_verdict`
- `casimir_firstFail`
- `casimir_certificateHash`
- `casimir_integrityOk`
- `status` (`done|partial-blocked|blocked`)

## Rebase/squash handling notes

When direct one-prompt-per-commit SHAs are unavailable after history rewriting:

1. Resolve prompt commit via `git log --follow -- <file>` for each touched file.
2. Record `original_commit_sha` if available from local reflog/CI metadata.
3. Add deterministic artifact references (`training-trace`, test logs, validator output) so replay auditing remains possible.
4. Mark `status` as `partial-blocked` when SHA linkage is indirect.

## Execution rows

| prompt_id | commit_sha | files_changed | checks_run | casimir_traceId | casimir_runId | casimir_verdict | casimir_firstFail | casimir_certificateHash | casimir_integrityOk | status |
|---|---|---|---|---|---|---|---|---|---:|---|
| 0 | `N/A` | none | sequence planning | `N/A` | `N/A` | `N/A` | `N/A` | `N/A` | false | done |
| 1 | `e426af0` | `docs/audits/research/agibot-x1-wave2-execution-ledger-2026-02-20.md`, `reports/agibot-x1-helix-integration-readiness-2026-02-20.md` | docs update + casimir verify | `adapter:b2d14fc1-3d54-49ca-a5d1-6032e089fea1` | `1` | `PASS` | `null` | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true | done |
| 2 | `de21e11` | `server/routes/agi.plan.ts`, `tests/helix-ask-modes.spec.ts` | `npx vitest run tests/helix-ask-modes.spec.ts -t "rejects actuator-level command phrases in mission interface|blocks mission mode"` + casimir verify | `adapter:af8b32be-5e59-40bb-9152-62d727ab3836` | `2` | `PASS` | `null` | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true | done |
| 3 | `e666a85` | `server/routes/training-trace.ts`, `tests/trace-export.spec.ts` | `npx vitest run tests/trace-export.spec.ts` + casimir verify | `adapter:83ded9b2-123a-4f88-ae78-72ab722aab6c` | `3` | `PASS` | `null` | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true | done |
| 4 | `b833668` | `docs/audits/research/agibot-x1-asset-manifest-2026-02-20.md`, `scripts/validate-agibot-asset-manifest.ts`, `tests/validate-agibot-asset-manifest.spec.ts`, `package.json` | `npm run validate:agibot:assets`, `npx vitest run tests/validate-agibot-asset-manifest.spec.ts` + casimir verify | `adapter:a82399d7-82b4-44cd-a7ea-1115b5918684` | `4` | `PASS` | `null` | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true | done |
| 5 | `7b7df52` | `docs/audits/research/agibot-x1-wave2-execution-ledger-2026-02-20.md` | `npx tsc --noEmit --pretty false --skipLibCheck server/routes/agi.adapter.ts server/routes/agi.plan.ts shared/local-call-spec.ts shared/schema.ts tests/helix-ask-modes.spec.ts tests/trace-export.spec.ts`, `npm run check` (repo debt) + casimir verify | `adapter:42f41946-7a35-43b9-b856-02b6aee890a5` | `5` | `PASS` | `null` | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true | partial-blocked |
| 6 | `3198433` | `server/routes/agi.plan.ts`, `tests/helix-ask-modes.spec.ts`, `docs/architecture/agibot-x1-runtime-bridge-contract-v1.md` | `npx vitest run tests/helix-ask-modes.spec.ts -t "rejects mission bridge actuator-level argument fields|rejects actuator-level command phrases in mission interface|blocks mission mode"` + casimir verify | `adapter:68d97347-1092-4259-8398-77f6b3ea3946` | `6` | `PASS` | `null` | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true | done |
| 7 | `a9f6a72` | `docs/runbooks/agibot-x1-hil-evidence-capture-2026-02-20.md`, `shared/schema.ts`, `server/routes/training-trace.ts`, `server/services/observability/training-trace-store.ts`, `tests/trace-export.spec.ts` | `npx vitest run tests/trace-export.spec.ts` + casimir verify | `adapter:1142d7e0-db3f-4ea0-8ad2-88d776b3b44b` | `7` | `PASS` | `null` | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true | done |
| 8 | `HEAD@prompt8` | `reports/agibot-x1-helix-wave2-readiness-2026-02-20.md`, `docs/audits/research/agibot-x1-wave2-execution-ledger-2026-02-20.md`, `docs/audits/research/agibot-x1-risk-backlog-2026-02-20.md` | casimir verify | `adapter:71ca02ff-b814-45bc-a558-378b03709db4` | `8` | `PASS` | `null` | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true | done |

## Prompt 5 scoped typecheck baseline note

Scoped typecheck command used for touched AGIBOT paths:

```bash
npx tsc --noEmit --pretty false --skipLibCheck server/routes/agi.adapter.ts server/routes/agi.plan.ts shared/local-call-spec.ts shared/schema.ts tests/helix-ask-modes.spec.ts tests/trace-export.spec.ts
```

Result: partial-blocked due existing cross-file TypeScript debt in current repository and touched files.

Informational full check:

```bash
npm run check
```

The repo-wide debt remains tracked as no-go for broad type-clean claims.
