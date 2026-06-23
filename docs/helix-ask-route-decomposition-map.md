# Helix Ask Route Decomposition Map

Status: current-head map for structural extraction.

Pinned HEAD: `c82e8c03e2e421e238860d66c2c1bc4b1a44d3cc`

Route snapshot:

| Metric | Value |
| --- | ---: |
| File | `server/routes/agi.plan.ts` |
| Lines | 182,618 |
| Bytes | 8,178,449 |
| Top-level helper estimate | 2,129 |
| Route inventory | `artifacts/helix-ask-route-inventory.json` |
| Machine-readable map | `artifacts/helix-ask-route-decomposition-map.json` |

## Extraction Rules

Treat `agi.plan.ts` as an ordered mutable program. A candidate is not ready just because it looks like a helper. Before moving a seam, preserve route-local closure timing, payload mutation order, await order, callback order, early-return order, exception propagation, and terminal/debug field writes.

Do not extract `runHelixAgentTurnRuntimeLoop` in this wave. Do not patch terminal authority, tool admission, live failures, retries, or keyed-server behavior in an extraction slice.

## Candidate Summary

| Candidate | Lines | Boundary | Risk | Readiness | Likely Owner | Notes |
| --- | ---: | --- | --- | --- | --- | --- |
| `live-debug-slim` | 108690-108864 | `DEBUG_EXPORT` | `MEDIUM_LOW` | `MOVE_WITH_EXCLUSIVE_HELPERS` | `server/services/helix-ask/debug/live-debug-slim.ts` | Builds slim debug payload from existing payload/debug records. Mutates nothing. Needs exclusive helper `summarizeHelixAskDebugValue`; depends on existing debug-export builders and constants. |
| `transcript-events` | 80945-81206 | `UI_API_PROJECTION` | `MEDIUM_LOW` | `MOVE_WITH_EXCLUSIVE_HELPERS` | `server/services/helix-ask/runtime/transcript-events.ts` | Converts turn events into transcript events. Local mutation is bounded to a new array and sequence counter. Needs `formatAskTurnTranscriptArtifacts` and nearby supersession normalizer if selected as a family. |
| `decision-source-map` | 77530-78085 | `SOLVER_CONTROL` | `MEDIUM_LOW` | `MOVE_WITH_EXCLUSIVE_HELPERS` | `server/services/helix-ask/runtime/decision-source-map.ts` | Builds capability selection, observation decision, and decision source map from runtime payload artifacts. Read-heavy, no transport ownership; touches solver decision semantics, so focused tests needed. |
| `turn-contract-builder` | 90520-90775 | `PROMPT_INTERPRETATION` | `MEDIUM_HIGH` | `NEEDS_DEPENDENCY_REDUCTION` | `server/services/helix-ask/contracts/turn-contract-builder.ts` | Builds turn contract and uses many objective/planner helpers. Larger prompt-policy surface; defer until helper ownership and tests are tighter. |
| `live-debug-slim-response-wrapper` | 108690-108900 | `DEBUG_EXPORT` / `UI_API_PROJECTION` | `MEDIUM_HIGH` | `NEEDS_OWNER_PROOF` | `server/services/helix-ask/debug/live-response-payload.ts` | `prepareHelixAskLiveResponsePayload` calls projection mirror sync functions before slim debug. Do not move with slim builder unless mirror-order equivalence is proven. |
| `terminal-projection-debug-sync` | 106541-106721 | `TERMINAL_AUTHORITY` / `DEBUG_EXPORT` | `MEDIUM_HIGH` | `NEEDS_OWNER_PROOF` | `server/services/helix-ask/terminal-projection-debug-sync.ts` | Mutates terminal/debug mirrors. Behavior-sensitive after recent live failures; defer from structural-only wave unless already covered by focused mirror tests. |
| `canonical-goal-frame` | 45240-47262 | `GOAL_SATISFACTION` / `INTENT_ARBITRATION` | `HIGH` | `DEFER_HIGH_RISK` | `server/services/helix-ask/canonical-goal-frame.ts` | Large classifier/arbitration surface; changes here can alter admission and required terminal products. |
| `legacy-private-runtime-loop` | 67586-76156 | `LEGACY_PRIVATE_RUNTIME_LOOP` | `HIGH` | `NEEDS_OWNER_PROOF` | deferred legacy quarantine module | Explicitly excluded from this wave. Requires baseline attribution before quarantine. |
| `execute-helix-ask` | 111152-138861 | `LEGACY_PRIVATE_RUNTIME_LOOP` / `SOLVER_CONTROL` | `HIGH` | `DEFER_HIGH_RISK` | deferred | Deep engine body with many lifecycle stages and side effects. |
| `handle-ask-turn-request` | 139816-172050 | `TRANSPORT_EXPRESS_SSE` | `HIGH` | `DEFER_HIGH_RISK` | route shell only | Owns request/response sequencing, terminal payload finalization, and runtime interactions. |

## Ready Batch

The current low-risk batch is intentionally small and ordered by structural risk:

1. `live-debug-slim`
2. `transcript-events`
3. `decision-source-map`

No fourth seam is selected yet. The remaining candidates inspected either touch terminal/debug mirror sequencing, prompt/goal policy, or runtime-loop ownership and need dependency reduction or owner proof first.

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
