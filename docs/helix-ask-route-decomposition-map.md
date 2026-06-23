# Helix Ask Route Decomposition Map

Status: current-head map for structural extraction and decomposition-enabler work.

Pinned source HEAD described: `3532834e902caaa9d5900a1bfbc99e1d1b5709ad`

Snapshot command: `npx tsx scripts/helix-ask-route-inventory.ts --write`

Route snapshot:

| Metric | Value |
| --- | ---: |
| File | `server/routes/agi.plan.ts` |
| Lines | 180,520 |
| Bytes | 8,093,835 |
| Top-level helper estimate | 342 helper blocks |
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
| `decision-source-map` | service-owned | `SOLVER_CONTROL` | `MEDIUM` | `EXTRACTED` | `server/services/helix-ask/runtime/decision-source-map.ts` plus sibling runtime decision modules | S95 moved the debug map builder. S96 moved the pure runtime/terminal source mappers. S99 moved capability selection. S100 moved observation-decision. |
| `turn-contract-builder` | 89686-89906 | `PROMPT_INTERPRETATION` | `MEDIUM_HIGH` | `PARTIAL_EXTRACTED` | `server/services/helix-ask/contracts/turn-contract-builder.ts` plus `server/services/helix-ask/contracts/turn-contract-seed-slots.ts`, `turn-contract-hash.ts`, `turn-contract-text.ts`, `turn-contract-normalizers.ts`, `turn-contract-slots.ts`, `turn-contract-objective-support.ts`, `turn-contract-objective-slots.ts`, `turn-contract-objective-evidence.ts`, `turn-contract-objective-unknown.ts`, `turn-contract-objective-mini-answers.ts`, `turn-contract-objective-prompt-rewrite.ts`, `turn-contract-retrieval-plan.ts`, and `server/services/helix-ask/objectives/objective-assembly.ts` | S97 moved the pure seed-slot mapper. S103 moved the pure turn-contract hash formatter. S105 moved text normalization. S106 moved family/grounding-mode normalizers. S107 moved required-slot aggregation. S108 moved objective-support mapping. S109 moved objective-slot inference from obligation coverage. S110 moved objective evidence slot-hit matching. S111 moved unknown-block construction/sanitization. S112 moved objective mini-answer assembly from supplied states/support/coverage. S113 moved objective mini-answer validation summary counts into the same service. S114 moved deterministic objective prompt rewrite mode/hash/token/rewrite text helpers. S115 moved retrieval-plan assembly from already-built contract/query/research inputs. S116-S117 moved objective mini-synth and mini-critic prompt rendering into the mini-answer service. S118-S119 moved deterministic mini-synth and mini-critic result application. S120 moved deterministic objective assembly prompt rendering only. S121 routed deterministic objective assembly fallback and weak-draft detection through the existing objective assembly service while delegating unknown blocks to the contract owner. The main contract builder is bounded, but consumes many policy helpers. Characterize outputs before moving pure field assembly. |
| `live-debug-slim-response-wrapper` | 108141-108165 | `DEBUG_EXPORT` / `UI_API_PROJECTION` | `MEDIUM_HIGH` | `PARTIAL_EXTRACTED` | `server/services/helix-ask/debug/live-response-payload.ts` plus `server/services/helix-ask/debug/live-debug-mode.ts` | S98 moved debug-mode parsing. `prepareHelixAskLiveResponsePayload` still calls typed-failure sync, mailbox projection, compound coverage sync, terminal projection sync, transcript scaffold, then slim debug. Requires ordered write proof before movement. |
| `terminal-projection-debug-sync` | 106033-106214 | `TERMINAL_AUTHORITY` / `DEBUG_EXPORT` | `MEDIUM_HIGH` | `NEEDS_OWNER_PROOF` | `server/services/helix-ask/terminal-projection-debug-sync.ts` | Mutates payload/debug terminal mirrors after authority is selected. Extraction allowed only as projection sync, never terminal selection. |
| `canonical-goal-frame` | 76899-77542 | `GOAL_SATISFACTION` / `INTENT_ARBITRATION` | `HIGH` | `NEEDS_OWNER_PROOF` | `server/services/helix-ask/goals/*` and `server/services/helix-ask/contracts/*` | Do not move full frame. S101-S102 moved pure goal-frame readers/formatters to `goals/goal-frame-readers.ts`; policy classification remains route-owned. |
| `legacy-private-runtime-loop` | starts 67603 | `LEGACY_PRIVATE_RUNTIME_LOOP` | `HIGH` | `DEFER_RUNTIME_OWNERSHIP` | deferred legacy quarantine map only | Explicitly excluded from extraction. Map internal lifecycle bands only. |
| `execute-helix-ask` | starts 110427 | `LEGACY_PRIVATE_RUNTIME_LOOP` / `SOLVER_CONTROL` | `HIGH` | `DEFER_RUNTIME_OWNERSHIP` | deferred | Deep engine body with many lifecycle stages and side effects. Map only. |
| `handle-ask-turn-request` | starts 139091 | `TRANSPORT_EXPRESS_SSE` | `HIGH` | `DEFER_RUNTIME_OWNERSHIP` | route shell only | Owns request/response sequencing, terminal payload finalization, and runtime interactions. Map only. |

## Second-Level Decomposition

| Sub-seam | Enclosing candidate | Current span | Responsibility | Dependency shape | Readiness |
| --- | --- | ---: | --- | --- | --- |
| `decision-source-mappers` | `decision-source-map` | service-owned | Runtime/terminal decision source normalization. | Pure mapping over source/reason/final-answer-source; no payload mutation. | `EXTRACTED` |
| `goal-frame-mutation-target-reader` | `decision-source-map` / `canonical-goal-frame` | service-owned | Read resolved mutation target from a built goal frame. | Extracted by S101 as a pure goal-frame reader. | `EXTRACTED` |
| `goal-frame-hash-formatter` | `canonical-goal-frame` | service-owned | Format the stable current-turn goal hash from goal kind and normalized prompt text. | Extracted by S102 as a pure goal-frame formatter; no policy classification moved. | `EXTRACTED` |
| `capability-selection-result` | `decision-source-map` | service-owned | Select expected capability from universal goal frame and optional selected action. | Extracted by S99 behind a 5-callback dependency interface for route-local goal/panel readers and workstation planner. | `EXTRACTED` |
| `observation-decision` | `decision-source-map` | service-owned | Convert runtime observations, missing artifacts, pending requests, and next planned step into continue/finalize/input/failure decision. | Extracted by S100 behind invocation-time wrappers for shared route artifact collectors. | `EXTRACTED` |
| `decision-source-map-builder` | `decision-source-map` | service-owned | Build debug/source map from payload. | Extracted; S96 moved the mapper callbacks into the same service owner. | `EXTRACTED` |
| `turn-contract-field-assembly` | `turn-contract-builder` | 89686-89906 | Assemble contract goal/objectives/obligations/grounding/output family/format. | Pure-looking, but consumes planner pass, research contract, and classification helpers. | `READY_AFTER_CHARACTERIZATION` |
| `intent-contract-hash-formatter` | `turn-contract-builder` / equation intent contract | service-owned | Format stable equation intent-contract hash after intent construction. | Extracted by S104 as a pure formatter using shared stable JSON/SHA utilities. | `EXTRACTED` |
| `turn-contract-text-normalizer` | `turn-contract-builder` | service-owned | Normalize contract text by removing path/source scaffolds, markdown markers, extra whitespace, and clipping. | Extracted by S105 with behavior coverage for path/source cleanup and clipping. | `EXTRACTED` |
| `turn-contract-family-normalizers` | `turn-contract-builder` | service-owned | Normalize answer-plan family and grounding-mode literals. | Extracted by S106 with literal acceptance coverage. | `EXTRACTED` |
| `turn-contract-required-slots` | `turn-contract-builder` | service-owned | Aggregate default, objective, and explicit required slots with normalization and max cap. | Extracted by S107 with order/dedupe/cap behavior coverage. | `EXTRACTED` |
| `turn-contract-objective-support` | `turn-contract-builder` / evidence pack | service-owned | Map turn-contract objectives to support status from covered slots. | Extracted by S108 with normalized support matching coverage. | `EXTRACTED` |
| `turn-contract-objective-slots` | `turn-contract-builder` / evidence pack | service-owned | Infer objective slot labels from obligation coverage refs and kinds. | Extracted by S109 with doc/code/roadmap slot inference coverage. | `EXTRACTED` |
| `turn-contract-objective-evidence` | `turn-contract-builder` / evidence pack | service-owned | Normalize objective labels and infer required-slot hits from evidence refs. | Extracted by S110 with label-key and evidence slot-hit coverage. | `EXTRACTED` |
| `turn-contract-objective-unknown` | `turn-contract-builder` / evidence pack | service-owned | Build and sanitize objective unknown blocks for unresolved slots. | Extracted by S111 with fallback and scaffold-sanitization coverage. | `EXTRACTED` |
| `turn-contract-objective-mini-answers` | objective loop / evidence re-entry | service-owned | Assemble objective mini-answer records from loop states, support, coverage, retrieval files, fallback evidence refs, summarize status counts, render objective mini-synth/mini-critic/objective-assembly prompts, and apply parsed mini-synth/mini-critic results. | Extracted by S112-S113 and S116-S120 with covered/blocked/fallback, summary-count, prompt-rendering, mini-synth application, mini-critic application, and assembly-prompt behavior coverage. LLM invocation, mini-synth/critic parsing, repair, and objective assembly policy remain route-owned or delegated to the objective assembly service. | `EXTRACTED` |
| `objective-assembly` | objective loop / evidence re-entry | service-owned | Deterministically assemble objective mini-answer outputs, detect weak assembly drafts, and reuse the canonical objective unknown-block contract. | S121 made the route delegate deterministic assembly fallback and weak-draft detection to `server/services/helix-ask/objectives/objective-assembly.ts` and removed duplicate unknown-block ownership from that service. LLM assembly invocation, assessment, repair, and retry policy remain route-owned. | `PARTIAL_EXTRACTED` |
| `turn-contract-objective-prompt-rewrite` | objective loop / evidence re-entry | service-owned | Resolve rewrite mode, hash/token-estimate prompt text, and build deterministic stage rewrite prompts. | Extracted by S114 with mode/hash/rewrite behavior coverage. LLM invocation, model choice, and budget policy remain route-owned. | `EXTRACTED` |
| `turn-contract-seed-slots` | `turn-contract-builder` | service-owned | Convert a turn contract into slot plan entries. | Pure contract mapper. | `EXTRACTED` |
| `turn-contract-hash-formatter` | `turn-contract-builder` | service-owned | Format stable turn-contract hash after contract construction. | Extracted by S103 as a pure formatter using shared stable JSON/SHA utilities. | `EXTRACTED` |
| `turn-contract-retrieval-plan` | `turn-contract-builder` | service-owned | Build retrieval plan from already-built contract, query constraints, prompt-research retrieval/generation contracts, and a route-owned max query cap. | Extracted by S115 with budget/path/precedence/cap behavior coverage. Retrieval policy inputs and max-query config remain route-owned. | `EXTRACTED` |
| `terminal-projection-sync` | `terminal-projection-debug-sync` | 106033-106214 | Copy already-selected terminal state into payload/debug mirrors. | Mutates terminal/debug fields; requires ordered write ledger and projection tests. | `NEEDS_OWNER_PROOF` |
| `debug-export-envelope` | `terminal-projection-debug-sync` | starts 106215 | Build debug export envelope after terminal/projection sync. | Mutates/refreshes multiple debug records. | `NEEDS_OWNER_PROOF` |
| `live-debug-mode-reader` | `live-debug-slim-response-wrapper` | service-owned | Read env/request debug mode. | Pure env/request reader. | `EXTRACTED` |
| `live-response-payload-wrapper` | `live-debug-slim-response-wrapper` | 108141-108165 | Ordered response projection: typed failure sync, mailbox sync, compound sync, terminal sync, transcript scaffold, slim debug. | Behavior-sensitive mutation order. | `NEEDS_OWNER_PROOF` |
| `canonical-goal-record-readers` | `canonical-goal-frame` | 76899-77542 subset | Read payload/workspace/source details for goal frame inputs. | Needs AST subdivision; do not move classifiers/admission. | `READY_AFTER_DEPENDENCY_REDUCTION` |
| `canonical-goal-policy-classifier` | `canonical-goal-frame` | 76899-77542 subset | Goal-kind/source-target/required-product policy. | Policy-sensitive. | `NEEDS_OWNER_PROOF` |
| `legacy-runtime-intake-to-plan` | `legacy-private-runtime-loop` | starts 67603 | Runtime-loop intake/context/capability plan setup. | Closure-heavy; map only. | `DEFER_RUNTIME_OWNERSHIP` |
| `legacy-runtime-tool-to-observation` | `legacy-private-runtime-loop` | starts 67603 | Tool dispatch, observation materialization, evidence re-entry. | Runtime ownership; map only. | `DEFER_RUNTIME_OWNERSHIP` |
| `execute-helix-ask-engine-bands` | `execute-helix-ask` | starts 110427 | Deep engine: route prep, tool/observation/evidence/goal/terminal flow. | Too many lifecycle bands; map only. | `DEFER_RUNTIME_OWNERSHIP` |
| `handle-ask-turn-transport-bands` | `handle-ask-turn-request` | starts 139091 | Express/SSE/API response and capture transport. | Transport shell plus terminal projection calls; map only. | `DEFER_RUNTIME_OWNERSHIP` |

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
3. `decision-source-map` - `PARTIAL_EXTRACTED_S95_S96`

This wave's next safe work should be characterization or dependency reduction, not direct movement of the high-risk bands.

Candidate order:

1. `turn-contract-field-assembly` - `READY_AFTER_CHARACTERIZATION`
2. `terminal-projection-sync` - `NEEDS_OWNER_PROOF`
3. `live-response-payload-wrapper` - `NEEDS_OWNER_PROOF`
4. `canonical-goal-record-readers` - `READY_AFTER_DEPENDENCY_REDUCTION`

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
