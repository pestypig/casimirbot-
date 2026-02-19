# HELIX-PS3 Quake-Style Weighted Move Policy (Implementation)

## Summary
Implemented deterministic quake-style move weighting for Helix Ask reasoning turns with fixed move set, weighted profile presets, relation-intent scoring overrides, deterministic tie-breaks, and debug score emissions.

## Commands Run
- `npx vitest run tests/helix-ask-semantic-quality.spec.ts tests/helix-ask-quake-move-policy.spec.ts`
- `npx vitest run tests/helix-ask-availability-precheck.spec.ts tests/helix-ask-semantic-quality.spec.ts tests/helix-ask-focused-utility-hardening.spec.ts tests/helix-ask-ps2-runtime-report.spec.ts tests/helix-ask-modes.spec.ts tests/helix-ask-quake-move-policy.spec.ts`
- `npm run dev:agi:5173`
- `npm run casimir:verify -- --pack repo-convergence --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace-quake-weight-impl.jsonl --trace-limit 200 --ci`

## Casimir PASS
- Verdict: `PASS`
- firstFail: `null`
- certificateHash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- certificateId: `constraint-pack:repo-convergence:6e84f965957f`
- integrityOk: `true`
- status: `GREEN`

## Notes
- API compatibility preserved by keeping existing `fuzzy_move_selector.selected` while adding the new debug fields.
- Fail-closed path remains active and now maps explicitly to `fail_closed` move.
