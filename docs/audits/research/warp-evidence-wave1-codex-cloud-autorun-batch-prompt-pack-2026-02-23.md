# Warp Evidence Wave 1 - Codex Cloud Autorun Batch Prompt Pack (2026-02-23)

Use these prompts in sequence. Each prompt must keep claim posture governance-first and avoid propulsion overclaims.

## Prompt 1 - P-001 Deterministic Evidence Bundle

```md
Implement P-001 deterministic evidence bundle hardening.

Read first:
- AGENTS.md
- WARP_AGENTS.md
- docs/public-claims-boundary-sheet.md
- docs/audits/research/warp-evidence-wave1-execution-pack-2026-02-23.md

Do:
1. Ensure evidence bundle script exports deterministic bytes for fixed inputs.
2. Include commit hash, first-fail, claim tier, proof pack reference, checksum.
3. Add/extend tests for determinism and required disclaimer presence.

Run tests:
- npx vitest run tests/warp-evidence-pack.spec.ts
- add any new tests you create

Run verify:
- npm run casimir:verify -- --ci --url http://127.0.0.1:5173/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl

Output:
- files changed
- test results
- verify fields: verdict, firstFail, certificateHash, integrityOk, traceId, runId
- residual risks
```

## Prompt 2 - P-002 QI Applicability Enforcement

```md
Implement P-002 QI applicability enforcement.

Read first:
- AGENTS.md
- WARP_AGENTS.md
- docs/warp-literature-runtime-gap-analysis.md
- docs/audits/research/warp-evidence-wave1-execution-pack-2026-02-23.md

Do:
1. Ensure runtime/proof outputs include explicit QI applicability status.
2. Block tier promotion above reduced-order when applicability is UNKNOWN/NOT_APPLICABLE.
3. Add tests for PASS, NOT_APPLICABLE, UNKNOWN branches and promotion gating.

Run tests:
- npx vitest run tests/qi-guardrail.spec.ts tests/pipeline-ts-qi-guard.spec.ts tests/warp-viability.spec.ts
- run any additional touched tests from WARP_AGENTS.md list

Run verify:
- npm run casimir:verify -- --ci --url http://127.0.0.1:5173/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl

Output:
- files changed
- test results
- verify fields: verdict, firstFail, certificateHash, integrityOk, traceId, runId
- residual risks
```

## Prompt 3 - P-003/P-004 TS Semantics + Proxy-Masquerade Lock

```md
Implement P-003 and P-004 hardening.

Read first:
- AGENTS.md
- WARP_AGENTS.md
- docs/public-claims-boundary-sheet.md
- docs/warp-geometry-cl4-guardrail-map.md
- docs/audits/research/warp-evidence-wave1-execution-pack-2026-02-23.md

Do:
1. Split TS gate semantics from proxy regime semantics with explicit naming/labels.
2. Keep WARP_AGENTS and runtime threshold canon aligned.
3. Ensure public audience mode cannot display proxy values as geometry-derived.
4. Add/extend UI tests for audience-mode label behavior and threshold canon tests.

Run tests:
- npx vitest run tests/threshold-canon.spec.ts client/src/lib/__tests__/audience-mode.spec.ts client/src/components/__tests__/energy-pipeline-claim-tier.spec.tsx
- run any additional touched tests from WARP_AGENTS.md list

Run verify:
- npm run casimir:verify -- --ci --url http://127.0.0.1:5173/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl

Output:
- files changed
- test results
- verify fields: verdict, firstFail, certificateHash, integrityOk, traceId, runId
- residual risks
```

## Final Batch Merge Prompt

```md
After Prompts 1-3 are complete, perform a merge-hardening pass:
- reconcile naming and docs
- rerun touched tests
- rerun Casimir verify
- produce one final summary with exact verify fields and commit hashes
```
