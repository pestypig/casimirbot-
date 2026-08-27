# Helix Ask / Codex parity G1 progress audit — 2026-08-26

Status: immutable progress evidence; not G1 closure evidence.

Canonical program: `docs/helix-ask-codex-parity-work-program-v1.md`

## Gate

G1 — truthful runtime identity and complete public trace remains active.

## Change classification

- presentation
- evidence normalization
- terminal/debug projection
- Codex-owned runtime behavior observation
- transport replay at the Helix API boundary

This patch does not implement model sampling, generic tool execution,
observation re-entry, retries inside Codex, compaction, approvals, sandboxing,
subagent orchestration, or terminal completion. It observes and projects the
runtime that executed, then prevents a completed transport retry from executing
the same admitted turn again.

## Implemented evidence

### Runtime identity

`server/services/helix-ask/runtime/runtime-path-identity.ts` derives one
`helix.ask.runtime_path_identity.v1` object from server-owned provider facts.
It records:

- requested and selected provider;
- actual path;
- attempted path history and statuses;
- typed native-to-compatibility downgrade reason;
- effective native model and reasoning-effort policy when available;
- runtime budgets and exhaustion reason;
- an identity hash;
- the invariant that presentation limits are not runtime limits.

The supported path labels are `codex_native_app_server`,
`codex_compatibility_exec`, `helix_legacy_private_loop`,
`future_provider_adapter`, and `unknown`.

The object is attached at the provider response boundary, the legacy live
response boundary, and the debug-export builder. Slim debug retains the same
object. The builder overwrites supplied `runtime_path_identity` values, so stale
or poisoned client/debug projections cannot relabel the server-observed path.

### Public lifecycle

The same service emits `helix.ask.public_lifecycle_projection.v1` with the
complete transcript count, stable IDs, full-event field, debug-export reference,
default visible limit, visible count, and explicit presentation truncation.

The legacy procedural projection no longer applies the former 12-iteration
cap. The timeline shows the first 18 rows by default, states `showing X of Y`,
and exposes every remaining row in an expandable section. The UI may not infer
runtime completion from presentation truncation.

### Stream-to-JSON replay

`server/services/helix-ask/runtime/ask-turn-transport-replay.ts` stores a clone
of each completed payload by turn ID plus a normalized session-and-prompt
fingerprint. After request ownership/shared-room access checks and before
provider selection or route execution, a JSON `/ask/turn` request replays a
completed payload only when the turn, session, and prompt fingerprint all match,
then adds
`helix.ask.turn_transport_replay.v1` with:

- `execution_reused: true`;
- `duplicate_execution_count: 0`;
- the preserved runtime identity hash;
- source and replay transport labels.

Queued admission payloads and incomplete identity inputs are not cached as
completed turns. Reads return clones, preventing a replay projection from
poisoning the stored SSE result. Mismatched session or prompt fingerprints are
rejected as cache misses.

## Deterministic verification

Passed:

```text
npx vitest run server/services/helix-ask/runtime/__tests__/runtime-path-identity.test.ts client/src/components/__tests__/helix-ask-g1-runtime-transparency.spec.ts server/services/helix-ask/debug/__tests__/live-debug-slim.test.ts --pool=forks
  3 files, 7 tests passed

npx vitest run server/services/helix-ask/runtime/__tests__/runtime-path-identity.test.ts server/services/helix-ask/runtime/__tests__/ask-turn-transport-replay.test.ts client/src/components/__tests__/helix-ask-g1-runtime-transparency.spec.ts --pool=forks
  3 files, 10 tests passed

npx vitest run server/__tests__/helix.ask.g1-transport-replay.test.ts --pool=forks
  1 file, 1 test passed

npm run helix:ask:discipline:quick
  static checks passed
```

The focused provider response projection plus slim-debug run had 12 passing
tests and one failure in the pre-existing exact goal-dispatch-admission object
shape expectation. The mismatch concerns additional capability-lane fields and
does not involve the G1 runtime identity or lifecycle fields.

## Broader verification limitations

- `server/__tests__/helix.ask.api-parity-matrix.test.ts` produced no test result
  after several minutes and was interrupted. This is neither pass nor failure.
- `npm run typecheck -- --pretty false` remains red across the repository's
  pre-existing broad TypeScript baseline (over one million output tokens,
  beginning in unrelated CLI and document-translation files). It is not usable
  as focused G1 evidence.
- Casimir verification was not run because this patch does not touch warp/GR,
  adapter constraints, certificate semantics, training trace, or proof maturity.

## Keyed evidence attempt

An existing user-configured server responded at `http://127.0.0.1:1522` and
reported the Codex provider enabled and launchable. No server was started or
reconfigured for this audit.

Canary turn:

```text
turn_id: g1-native-822f0ddebbdb4b8e887ac481d5d9a655
requested operation: read-only repo.search
server build: 4ba5f51a067a7938f72f68d4877db1bab2db434e
result: final_failure / typed_failure
terminal_error_code: openai_api_credits_exhausted
answer hash: sha256:d3b211c870de86d9f0da3339bdb664aa06c0e0bb5941e17b0f1097c6759a2f44
```

The running server predates the G1 projection, so its response and debug export
did not contain `runtime_path_identity`. The failed turn is not native-path
evidence. A deliberately induced compatibility canary was not attempted after
the shared keyed provider reported exhausted credits, because it could not
produce the required terminal-path comparison.

## Remaining closure work

1. Run a server containing this patch with a usable key/credit state.
2. Execute one native app-server turn and one deliberately induced compatibility
   turn with the same non-mutating acceptance contract.
3. Confirm distinct actual paths, attempted histories, downgrade state, budgets,
   JSON/SSE/debug/UI identity hashes, and matching visible terminal hashes.
4. Complete the targeted API parity and terminal-equivalence batteries.
5. Close G1 only after all seven canonical closure requirements pass.
