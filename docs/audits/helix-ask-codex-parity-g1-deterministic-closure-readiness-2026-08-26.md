# Helix Ask / Codex parity G1 deterministic closure readiness — 2026-08-26

Program gate: G1 — truthful runtime identity and complete public trace
Workstream: runtime identity, public lifecycle, transport replay, and presentation
Capability or component: Helix Ask JSON, SSE, debug export, lifecycle paging, and operator timeline
Change classification: presentation; evidence normalization; terminal authority; Codex-owned runtime behavior
Runtime owner: Codex owns model/runtime events; Helix owns policy, projection, terminal eligibility, and debug evidence
Current closure state: lifecycle-observable with focused deterministic parity evidence; not keyed parity-proven
Target closure state: keyed parity-proven
Required frozen inputs: turn ID; session ID; prompt fingerprint; provider selection; transport; server build; model policy
Required evidence: seven G1 closure requirements below, including keyed native and induced compatibility turns
Stop/fail criteria: mislabeled runtime; hidden downgrade; incomplete public lifecycle; presentation cap presented as execution; duplicate fallback effects
Explicit non-goals: private chain of thought; private Helix sampling/runtime loop; legacy deletion; local Codex fork decision; G2/G3 provider repairs
Downstream gate unlocked: G2 — differential parity baseline

Status: immutable deterministic readiness audit; G1 remains open.

Canonical program: `docs/helix-ask-codex-parity-work-program-v1.md`

## Corrections completed in this packet

- One JSON response boundary and one SSE final boundary now attach runtime
  identity, transport history, public lifecycle metadata, and debug projection
  even for early policy/admission failures.
- Pre-runtime rejection is labeled `pre_runtime_policy_boundary` with
  `not_started`; selection metadata alone can no longer claim an executed
  provider path.
- Runtime-budget status is explicit for native app-server, compatibility exec,
  authenticated MCP, native Helix, future adapter, and pre-runtime boundaries.
  Presentation limits remain a separate presentation-scoped object.
- Downgrades with an omitted runtime reason use the typed value
  `native_fallback_reason_unreported` and declare that the reason was missing
  from the runtime projection.
- An in-flight turn claim is acquired after admission and before provider/tool
  execution. Same-identity fallback cannot start a second execution, while
  cross-session or cross-prompt reuse fails closed.
- Native Codex public protocol events are captured for the final canonical
  transcript as well as emitted live. The merge preserves every stable-ID event,
  deduplicates repeated delivery, and keeps terminal presentation last.
- Future-provider terminal failure now reports a failed attempted path and its
  typed reason rather than claiming successful completion.
- Lifecycle projection advertises a pageable endpoint only when an actual
  stable event sequence exists and can be retained by the lifecycle store.

The native event projection contains public protocol events and summarized
tool/runtime state. It does not expose, infer, or fabricate private model chain
of thought.

## Seven-item closure audit

| # | Requirement | Deterministic status | Evidence or remaining gap |
| --- | --- | --- | --- |
| 1 | Every terminal response exposes the actual path, attempted history, and typed downgrade. | pass | Universal JSON/SSE terminal boundaries plus early rejection fixtures; truthful future and pre-runtime attempt status. |
| 2 | Native, compatibility, native-Helix, future, legacy-route, and transport-fallback identities survive JSON, SSE, debug, and UI. | deterministic pass; keyed native pending | Seven route fixtures pass; native public event retention is proven without a display-size cap; live keyed app-server evidence is still unavailable. |
| 3 | Runtime budgets and presentation limits are separately typed. | pass | Runtime identity unit fixtures and rendered UI fixture expose both scopes and state that presentation rows are not runtime steps. |
| 4 | Complete public lifecycle is retrievable with stable IDs and explicit truncation/pagination. | pass for process-lifetime route fixture | JSON/SSE page reconstruction and 37-native-event retention pass. The store is process-local and does not claim restart durability. |
| 5 | Stream-to-JSON retry preserves identity with zero duplicate effects. | pass | Completed replay and in-flight race fixtures pass for same identity; mismatch fails closed. This is same-process idempotence, not durable cross-restart idempotence. |
| 6 | Focused runtime, debug, stream, terminal, and client tests pass. | partial current verdict | All G1-specific runtime/route/replay/debug/client tests pass. The current terminal route case was rejected three times before solver execution by `host_memory_limit`, including once with a 1 MiB fake-workload estimate; five pure cases pass and an earlier bounded-reservation run passed the route case. |
| 7 | One keyed native and one induced compatibility turn have distinct paths and matching visible terminal hashes. | blocked | Port 1522 is a stale build without this schema and its keyed canary reports exhausted OpenAI API credits. |

G1 cannot close while items 6 and 7 lack current acceptance evidence.

## Deterministic verification

Passed in this packet:

```text
runtime-path-identity.test.ts                              8/8
helix.ask.codex-native-lifecycle-projection.test.ts       2/2
helix.ask.g1-runtime-projection-route.test.ts              7/7
ask-turn-transport-replay.test.ts                          6/6
helix.ask.g1-transport-replay.test.ts                      2/2
helix-ask-g1-runtime-transparency.spec.ts                  3/3
live-debug-slim.test.ts                                    1/1
npm run helix:ask:discipline:quick                         pass
git diff --check                                           pass (line-ending warnings only)
```

Terminal-equivalence current reruns:

```text
helix.ask.terminal-equivalence-harness.test.ts
  pure cases: 5/5 pass
  route-backed case: no verdict in three attempts
  pre-solver rejection: memory_hard_pressure / host_memory_limit
  observed host free memory: approximately 739 MiB, 1002 MiB, then 1252 MiB
  estimated turn burst: 1536 MiB twice; 1 MiB fake-workload estimate once
```

This failure is classified at admission, before execution; it is not evidence
of terminal divergence and is not counted as a pass.

## Keyed deployment audit

No server was started, restarted, or reconfigured. The only existing
user-configured server remains `http://127.0.0.1:1522`.

Fresh non-keyed deployment probe:

```text
turn_id: g1-deploy-probe-73b0f55291164455b93991a8f448b6fb
server_build_commit: 4ba5f51a067a7938f72f68d4877db1bab2db434e
runtime_path_identity present: false
```

Prior keyed canary:

```text
turn_id: g1-native-822f0ddebbdb4b8e887ac481d5d9a655
terminal_error_code: openai_api_credits_exhausted
runtime_path_identity present: false
```

The server therefore cannot prove either patched native identity or a matching
induced compatibility result.

## Exact unblock sequence

1. Free enough host memory for the enabled Ask memory governor and rerun the
   six-case terminal-equivalence harness without disabling the guard.
2. Run the user-configured server from a build containing this G1 patch.
3. Restore usable keyed OpenAI API credit state.
4. Freeze one non-mutating prompt, account/session, model policy, and acceptance
   contract.
5. Capture one native app-server turn and one deliberately induced compatibility
   turn through JSON or SSE, then retrieve debug export and every lifecycle page.
6. Verify distinct execution paths and downgrade histories, zero duplicate
   effects, complete stable-ID event sequences, and identical visible terminal
   hashes across API, debug, and UI.
7. Reissue the seven-item audit; close G1 only if every row passes.
