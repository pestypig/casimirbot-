# Helix Ask x Dottie Uniform Utility Execution Ledger (2026-02-24)

Status: active

Baseline:
- branch: `main`
- start_head: `646bb8d9`

## Hard constraints

1. Voice certainty must never exceed text certainty.
2. Repo-attributed claims require evidence anchors.
3. Voice output remains event-driven and low-noise.
4. Failure/suppression reasons remain deterministic and replay-safe.
5. Tier 1 sensing remains explicit opt-in only (no covert capture).
6. `/api/agi/ask` and `/api/voice/speak` stay backward-compatible.
7. Local-first ownership posture remains explicit for mission-critical voice.
8. Every patch must pass Casimir verification with integrity OK.

## Blocker policy

- If blocked, ship the maximum safe additive subset and mark `partial-blocked`.
- Never bypass the first failing HARD constraint from Casimir verification.
- Use stable typed reason labels for all suppression/failure outcomes.

## Prompt tracker

| Prompt | Scope | Status | Commit | Casimir verdict | Certificate hash | Integrity | Notes |
|---|---|---|---|---|---|---|---|
| 0 | Ledger + scope lock | completed | `pending_commit` | `PASS` | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | `true` | This file |
| 1 | Prompt-style contract spec | completed | `pending_commit` | `PASS` | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | `true` | `docs/architecture/helix-ask-dottie-prompt-style-contract.v1.md` |
| 2 | Pipeline bottleneck audit artifact | completed | `pending_commit` | `PASS` | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | `true` | `reports/helix-ask-dottie-pipeline-bottleneck-audit-2026-02-24.md` |
| 3 | Deterministic callout templates + taxonomy | pending | - | - | - | - |  |
| 4 | Certainty parity enforcement tests | pending | - | - | - | - |  |
| 5 | Admission control + deterministic overload envelopes | pending | - | - | - | - |  |
| 6 | Timer/time-to-event contract wiring | pending | - | - | - | - |  |
| 7 | Micro-debrief closure loop | pending | - | - | - | - |  |
| 8 | Gap backlog + rollout plan | pending | - | - | - | - |  |
| 9 | Final closure/handoff package | pending | - | - | - | - |  |

## Verification protocol

Required command after each patch:

```bash
npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
```

Required report fields:
- `prompt_id`
- `files_changed`
- `behavior_delta`
- `tests_or_checks_run`
- `casimir_verdict`
- `casimir_firstFail`
- `casimir_certificateHash`
- `casimir_integrityOk`
- `commit_sha`
- `status`
