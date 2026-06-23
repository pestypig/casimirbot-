# Helix Ask Route Decomposition Map

Status: current-head map for structural extraction and decomposition-enabler work.

Pinned source HEAD described: `f314679b13bdd03ed91c7c4b263e1651f902398f`

Snapshot command: `npx tsx scripts/helix-ask-route-inventory.ts --write`

Route snapshot:

| Metric | Value |
| --- | ---: |
| File | `server/routes/agi.plan.ts` |
| Lines | 181,963 |
| Bytes | 8,149,727 |
| Top-level helper estimate | 372 helper blocks |
| Route inventory | `artifacts/helix-ask-route-inventory.json` |
| Machine-readable map | `artifacts/helix-ask-route-decomposition-map.json` |

## Extraction Rules

Treat `agi.plan.ts` as an ordered mutable program. A candidate is not ready just because it looks like a helper. Before moving a seam, preserve route-local closure timing, payload mutation order, await order, callback order, early-return order, exception propagation, and terminal/debug field writes.

Do not extract `runHelixAgentTurnRuntimeLoop` in this wave. Do not patch terminal authority, tool admission, live failures, retries, or keyed-server behavior in an extraction slice.

## Candidate Summary

| Candidate | Lines | Boundary | Risk | Readiness | Likely Owner | Notes |
| --- | ---: | --- | --- | --- | --- | --- |
| `live-debug-slim` | service-owned | `DEBUG_EXPORT` | `MEDIUM_LOW` | `EXTRACTED` | `server/services/helix-ask/debug/live-debug-slim.ts` | Extracted by S93. Route still owns debug-mode parsing and response wrapper ordering. |
| `transcript-events` | service-owned | `UI_API_PROJECTION` | `MEDIUM_LOW` | `EXTRACTED` | `server/services/helix-ask/runtime/transcript-events.ts` | Extracted by S94. Route retains transcript scaffold/finalization ordering. |
| `decision-source-map` | 76810-77897 | `SOLVER_CONTROL` | `MEDIUM` | `PARTIAL_EXTRACTED` | `server/services/helix-ask/runtime/decision-source-map.ts` plus possible sibling modules | S95 moved the debug map builder. Source mappers, capability selection, and observation-decision helpers remain route-owned and need characterization before movement. |
| `turn-contract-builder` | 90077-90297 | `PROMPT_INTERPRETATION` | `MEDIUM_HIGH` | `READY_AFTER_CHARACTERIZATION` | `server/services/helix-ask/contracts/turn-contract-builder.ts` | The main contract builder is bounded, but consumes many policy helpers. Characterize outputs before moving pure field assembly. |
| `live-debug-slim-response-wrapper` | 108183-108237 | `DEBUG_EXPORT` / `UI_API_PROJECTION` | `MEDIUM_HIGH` | `NEEDS_OWNER_PROOF` | `server/services/helix-ask/debug/live-response-payload.ts` | `prepareHelixAskLiveResponsePayload` calls typed-failure sync, mailbox projection, compound coverage sync, terminal projection sync, transcript scaffold, then slim debug. Requires ordered write proof. |
| `terminal-projection-debug-sync` | 106080-106261 | `TERMINAL_AUTHORITY` / `DEBUG_EXPORT` | `MEDIUM_HIGH` | `NEEDS_OWNER_PROOF` | `server/services/helix-ask/terminal-projection-debug-sync.ts` | Mutates payload/debug terminal mirrors after authority is selected. Extraction allowed only as projection sync, never terminal selection. |
| `canonical-goal-frame` | 76911-77554 | `GOAL_SATISFACTION` / `INTENT_ARBITRATION` | `HIGH` | `NEEDS_OWNER_PROOF` | `server/services/helix-ask/goals/*` and `server/services/helix-ask/contracts/*` | Do not move full frame. Only pure readers/formatters/debug helpers may move after subdivision. |
| `legacy-private-runtime-loop` | starts 67592 | `LEGACY_PRIVATE_RUNTIME_LOOP` | `HIGH` | `DEFER_RUNTIME_OWNERSHIP` | deferred legacy quarantine map only | Explicitly excluded from extraction. Map internal lifecycle bands only. |
| `execute-helix-ask` | starts 110497 | `LEGACY_PRIVATE_RUNTIME_LOOP` / `SOLVER_CONTROL` | `HIGH` | `DEFER_RUNTIME_OWNERSHIP` | deferred | Deep engine body with many lifecycle stages and side effects. Map only. |
| `handle-ask-turn-request` | starts 139161 | `TRANSPORT_EXPRESS_SSE` | `HIGH` | `DEFER_RUNTIME_OWNERSHIP` | route shell only | Owns request/response sequencing, terminal payload finalization, and runtime interactions. Map only. |

## Second-Level Decomposition

| Sub-seam | Enclosing candidate | Current span | Responsibility | Dependency shape | Readiness |
| --- | --- | ---: | --- | --- | --- |
| `decision-source-mappers` | `decision-source-map` | 76810-76838 | Runtime/terminal decision source normalization. | Pure mapping over source/reason/final-answer-source; no payload mutation. | `READY_MECHANICAL` |
| `goal-frame-mutation-target-reader` | `decision-source-map` / `canonical-goal-frame` | 77555-77559 | Read resolved mutation target from a built goal frame. | Pure frame reader; used outside decision-source selection. | `READY_AFTER_DEPENDENCY_REDUCTION` |
| `capability-selection-result` | `decision-source-map` | 77561-77753 | Select expected capability from universal goal frame and optional selected action. | Policy-adjacent; depends on docs/panel classifiers and workstation planner. | `READY_AFTER_CHARACTERIZATION` |
| `observation-decision` | `decision-source-map` | 77762-77888 | Convert runtime observations, missing artifacts, pending requests, and next planned step into continue/finalize/input/failure decision. | Policy-adjacent; depends on runtime artifact collectors and fallback missing-artifact filter. | `READY_AFTER_CHARACTERIZATION` |
| `decision-source-map-builder` | `decision-source-map` | service-owned | Build debug/source map from payload. | Extracted with two route mapper callbacks. | `EXTRACTED` |
| `turn-contract-field-assembly` | `turn-contract-builder` | 90077-90297 | Assemble contract goal/objectives/obligations/grounding/output family/format. | Pure-looking, but consumes planner pass, research contract, and classification helpers. | `READY_AFTER_CHARACTERIZATION` |
| `turn-contract-seed-slots` | `turn-contract-builder` | 90301-90334 | Convert a turn contract into slot plan entries. | Pure contract mapper. | `READY_MECHANICAL` |
| `turn-contract-retrieval-plan` | `turn-contract-builder` | starts 90336 | Build retrieval plan from contract and query constraints. | Touches retrieval/path ranking and prompt-research requirements. | `READY_AFTER_CHARACTERIZATION` |
| `terminal-projection-sync` | `terminal-projection-debug-sync` | 106080-106261 | Copy already-selected terminal state into payload/debug mirrors. | Mutates terminal/debug fields; requires ordered write ledger and projection tests. | `NEEDS_OWNER_PROOF` |
| `debug-export-envelope` | `terminal-projection-debug-sync` | starts 106262 | Build debug export envelope after terminal/projection sync. | Mutates/refreshes multiple debug records. | `NEEDS_OWNER_PROOF` |
| `live-debug-mode-reader` | `live-debug-slim-response-wrapper` | 108183-108209 | Read env/request debug mode. | Pure env/request reader; route-owned for now because response wrapper is adjacent. | `READY_MECHANICAL` |
| `live-response-payload-wrapper` | `live-debug-slim-response-wrapper` | 108211-108237 | Ordered response projection: typed failure sync, mailbox sync, compound sync, terminal sync, transcript scaffold, slim debug. | Behavior-sensitive mutation order. | `NEEDS_OWNER_PROOF` |
| `canonical-goal-record-readers` | `canonical-goal-frame` | 76911-77554 subset | Read payload/workspace/source details for goal frame inputs. | Needs AST subdivision; do not move classifiers/admission. | `READY_AFTER_DEPENDENCY_REDUCTION` |
| `canonical-goal-policy-classifier` | `canonical-goal-frame` | 76911-77554 subset | Goal-kind/source-target/required-product policy. | Policy-sensitive. | `NEEDS_OWNER_PROOF` |
| `legacy-runtime-intake-to-plan` | `legacy-private-runtime-loop` | starts 67592 | Runtime-loop intake/context/capability plan setup. | Closure-heavy; map only. | `DEFER_RUNTIME_OWNERSHIP` |
| `legacy-runtime-tool-to-observation` | `legacy-private-runtime-loop` | starts 67592 | Tool dispatch, observation materialization, evidence re-entry. | Runtime ownership; map only. | `DEFER_RUNTIME_OWNERSHIP` |
| `execute-helix-ask-engine-bands` | `execute-helix-ask` | starts 110497 | Deep engine: route prep, tool/observation/evidence/goal/terminal flow. | Too many lifecycle bands; map only. | `DEFER_RUNTIME_OWNERSHIP` |
| `handle-ask-turn-transport-bands` | `handle-ask-turn-request` | starts 139161 | Express/SSE/API response and capture transport. | Transport shell plus terminal projection calls; map only. | `DEFER_RUNTIME_OWNERSHIP` |

## Large Runtime Region Lifecycle Bands

These regions are mapped for future ownership proof only. They must not be extracted in this wave.

| Region | Lifecycle bands to preserve | Future owner sketch |
| --- | --- | --- |
| `runHelixAgentTurnRuntimeLoop` | intake/context, route/source preparation, capability plan refresh, model-step decision, tool execution dispatch, observation materialization, evidence re-entry, goal evaluation, continuation, final-answer composition, hard gate, terminal materialization, terminal authority, projection, recovery, return/transport | deferred legacy quarantine module only after baseline attribution |
| `executeHelixAsk` | request normalization, context assembly, route candidates, source/product contract, tool/retrieval execution, observation ledger, post-tool synthesis, solver-controller reconciliation, hard gates, terminal materialization, terminal authority, response payload | future engine band modules; no canonical runtime module |
| `handleAskTurnRequest` | HTTP/body/auth/context intake, short-circuit branches, Ask execution call, response capture, debug/export projection, UI/live payload preparation, transport return | route shell plus small response helpers only |

## Ready Batch

The current low-risk batch is intentionally small and ordered by structural risk:

1. `live-debug-slim` - `EXTRACTED_S93`
2. `transcript-events` - `EXTRACTED_S94`
3. `decision-source-map` - `PARTIAL_EXTRACTED_S95`

This wave's next safe work should be characterization or dependency reduction, not direct movement of the high-risk bands.

Candidate order:

1. `decision-source-mappers` - `READY_MECHANICAL`
2. `turn-contract-seed-slots` - `READY_MECHANICAL`
3. `capability-selection-result` - `READY_AFTER_CHARACTERIZATION`
4. `observation-decision` - `READY_AFTER_CHARACTERIZATION`
5. `terminal-projection-sync` - `NEEDS_OWNER_PROOF`

## Deferred Sets

### DEFERRED_HIGH_RISK

- `legacy-private-runtime-loop`
- `execute-helix-ask`
- `handle-ask-turn-request`
- `canonical-goal-frame`

### DEFERRED_OWNER_PROOF

- `terminal-projection-debug-sync`
- `live-debug-slim-response-wrapper`

### DEFERRED_BEHAVIOR_PATCH

- Post-tool authority bridge behavior repair remains out of scope for structural extraction.
- Live docs/materialization failures remain out of scope for structural extraction.

### DEFERRED_TEST_GAP

- `turn-contract-builder` needs tighter deterministic prompt-contract coverage before extraction.
- `decision-source-map` should gain or reuse focused runtime-decision tests before movement.
