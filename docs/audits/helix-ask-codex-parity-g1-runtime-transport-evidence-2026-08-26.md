# Helix Ask / Codex parity G1 runtime and transport evidence — 2026-08-26

Status: immutable progress evidence; not G1 closure evidence.

Canonical program: `docs/helix-ask-codex-parity-work-program-v1.md`

## Gate

G1 — truthful runtime identity and complete public trace remains active.

## Work classification

- presentation;
- evidence normalization;
- terminal/debug projection;
- Codex-owned runtime behavior observation; and
- idempotent transport replay at the Helix API boundary.

This packet does not add a private sampling loop, tool executor, approval or
sandbox lifecycle, compactor, subagent orchestrator, or terminal writer.

## Contract correction

`helix.ask.runtime_path_identity.v2` separates two facts that v1 conflated:

1. `execution_path` / backward-compatible `actual_path` identifies the engine
   boundary that executed (or truthfully records `pre_runtime_policy_boundary`
   when no engine started); and
2. `api_transport` plus `transport_history` identifies JSON, SSE, authenticated
   MCP, legacy-route bridging, and JSON replay without relabeling execution.

Supported execution labels are:

- `codex_native_app_server`;
- `codex_compatibility_exec`;
- `codex_authenticated_mcp`;
- `helix_legacy_private_loop`;
- `future_provider_adapter`; and
- `pre_runtime_policy_boundary`.

The execution identity hash is stable across a transport-only replay. A
separate projection hash changes when transport history changes. Runtime limits
and presentation limits remain separately typed.

## Surface evidence

- `/ask/turn` JSON and `/ask/turn/stream` SSE project distinct transport labels.
- Completed payload recording stamps the server-owned route before identity
  projection and binds replay to turn ID plus session-and-prompt fingerprint.
- Debug-export compact and minimal allowlists now retain runtime identity and
  lifecycle projection under size pressure.
- Slim debug mirrors the canonical objects.
- The legacy UI prefers the canonical `turn_transcript_events`, uses their
  stable IDs as row keys, reads the server-declared default-visible limit,
  states `Showing X of Y`, and exposes every overflow row.
- `GET /api/agi/ask/turn/:turnId/lifecycle` pages the canonical public events
  with total/offset/limit/next-offset metadata, a maximum page size of 100, and
  session mismatch rejection. JSON and SSE route fixtures reconstruct the full
  stable-ID sequence from this endpoint.
- The legacy `/ask` bridge reports `legacy_ask_json` followed by the internal
  `ask_turn_json` bridge without changing the underlying execution path.

## Deterministic verification

Passed:

```text
server/__tests__/helix.ask.g1-runtime-projection-route.test.ts
  5/5
  compatibility JSON; compatibility SSE; compacted debug export;
  Helix-native JSON/debug; future-provider JSON/debug; legacy bridge

runtime-path-identity.test.ts
  6/6
  native; compatibility downgrade; transport separation/replay;
  legacy; authenticated MCP; future; pre-runtime; poisoned projection;
  complete lifecycle metadata

ask-turn-transport-replay.test.ts
  4/4
  single execution; clone isolation; queued-response exclusion;
  session/prompt fingerprint isolation

helix.ask.g1-transport-replay.test.ts
  1/1
  SSE-origin payload replayed through JSON with zero duplicate executions

helix-ask-g1-runtime-transparency.spec.ts
  3/3
  complete canonical lifecycle, actual rendered overflow, and explicit
  transport/presentation projection

live-debug-slim.test.ts
  1/1

helix.ask.api-parity-matrix.test.ts -t "rejects"
  12/12 selected, 19 skipped by filter

helix.ask.terminal-equivalence-harness.test.ts
  route-backed equivalence case 1/1 with bounded fake-turn reservation;
  remaining pure harness cases 5/5 in the preceding unbounded run

npm run helix:ask:discipline:quick
  passed with declared classification

git diff --check
  passed; line-ending warnings only
```

The full API parity matrix again emitted no test result for several minutes and
was interrupted. This is no verdict. The focused G1 route and terminal subsets
above are the positive deterministic evidence.

The terminal-equivalence route case initially failed before the solver because
the host had less free memory than the production 1.5 GiB turn reservation.
With the fake fixture's actual 1 MiB reservation and the memory guard still
enabled, it passed. This was an environment-admission result, not a code
regression.

## Keyed blocker audit

The only user-configured server remains `http://127.0.0.1:1522`. No server was
started, restarted, or reconfigured.

The prior canary debug export still reports:

```text
turn_id: g1-native-822f0ddebbdb4b8e887ac481d5d9a655
server_build_commit: 4ba5f51a067a7938f72f68d4877db1bab2db434e
runtime_path_identity present: false
terminal_error_code: openai_api_credits_exhausted
```

A fresh deterministic deployment probe, which did not require a keyed model
call, independently confirmed that the running process has not hot-reloaded the
patch:

```text
turn_id: g1-deploy-probe-ae01c73ad7d6428fb60a52470cd3660a
request: legacy capability-catalog question (read-only)
server_build_commit: 4ba5f51a067a7938f72f68d4877db1bab2db434e
runtime_path_identity present: false
```

Therefore the configured server both predates this patch and lacks usable
credit state for the required terminal comparison. It cannot supply G1 closure
evidence. No second keyed canary was attempted.

## Remaining closure evidence

1. Run the user-configured server from a build containing this patch.
2. Restore usable keyed credit state.
3. Run one native app-server and one deliberately induced compatibility turn
   against the same non-mutating acceptance contract.
4. Verify distinct execution paths/downgrade histories and matching visible
   terminal hashes across JSON, SSE, debug export, and UI.
5. Close G1 only after the canonical seven-item closure audit passes.
