# Helix Ask Agent Spine Ownership

Status: current-state ownership inventory for extraction-first route decomposition.

This document is not a behavior claim and does not certify live keyed parity.
It names current owners, temporary compatibility owners, route-local ownership,
field writers, and unresolved conflicts so future Helix Ask failures can point
to a service boundary instead of only to `server/routes/agi.plan.ts`.

Codex owns the generic runtime loop: model sampling, generic tool execution,
tool-result re-entry, retries, approvals, sandboxing, compaction, session
lifecycle, subagent orchestration, and terminal completion.

Helix Ask owns prompt interpretation policy, intent/source admission, evidence
identity, provenance, proof gates, route/product contracts, route authority,
terminal eligibility, projection discipline, and debug traces.

## Lifecycle Ownership

| Stage | Status | Canonical current owner | Temporary compatibility owner | Route-local implementation remaining | Principal input | Principal output | May write | Must not write | Callers | Consumers | Focused enforcement tests | Unresolved conflict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Request and turn context | PARTIAL_SERVICE_OWNER | `server/services/helix-ask/runtime/request-context.ts` | `server/routes/agi.plan.ts` | request/transport shell and late route context assembly | Express request, payload, thread/session ids | route context, history events | request metadata, history lifecycle events | terminal authority, final answer text | `/api/agi/ask` route | Ask execution, debug export | request-context import/boundary checks | route still owns transport order |
| Prompt interpretation | PARTIAL_SERVICE_OWNER | `server/services/helix-ask/prompt-interpretation.ts` plus route-local classifiers | `server/routes/agi.plan.ts` | large classifier bands and canonical goal-frame policy | prompt, workspace context, source hints | prompt contract, compound contract, goal frame inputs | interpretation records, compound contract | execution, terminal authority | route Ask path | source admission, contract builder | prompt-solving benchmark | classifiers still duplicate authority-like signals |
| Intent and source arbitration | PARTIAL_SERVICE_OWNER | `ask-source-target-arbitrator`, `evidence-target-arbitration`, `route-product-contract` services | `server/routes/agi.plan.ts` | glue and hard-gate route selection | prompt interpretation, route candidates | source target, evidence target, product contract | route/source/product policy records | tool execution, terminal text | Ask execution | capability plan, terminal gates | api parity matrix, prompt-solving benchmark | route still coordinates precedence |
| Capability planning and selection | PARTIAL_SERVICE_OWNER | `runtime/capability-selection-result.ts`, `runtime/decision-source-map.ts`, capability-plan services | `server/routes/agi.plan.ts` | capability registry setup and selected-action compatibility wrappers | universal goal frame, selected action, payload | `capability_selection_result`, decision source map | capability selection result, decision-source debug | observations, terminal answer | route runtime setup | observation decision, debug export | policy-adjacent characterization, capability selection boundary | selected capability can still be mirrored by other ledgers |
| Model next-step decisions | ROUTE_OWNED_PENDING_EXTRACTION | `server/routes/agi.plan.ts` | model-turn packet/executor services | runtime-loop bands | current state, capabilities, observations | `agent_step_decision` | model decision audits, selected next step | direct execution, terminal authority | private runtime loop | tool execution, observation packet | live-spine smoke when keyed, deterministic model-turn tests | still route-owned and closure-heavy |
| Tool execution adapters | PARTIAL_SERVICE_OWNER | tool-family services and workstation adapter services | `server/routes/agi.plan.ts` | dispatch glue and selected tool invocation order | admitted action, args, context | receipts/results | tool receipt/result artifacts | final answer text unless contract permits receipt terminal | runtime loop | observation materializers | tool-chain matrix, capability lifecycle tests | generic execution ownership remains mixed |
| Observation materialization | PARTIAL_SERVICE_OWNER | `runtime/observation-decision.ts`, tool-family materializers | `server/routes/agi.plan.ts` | artifact-store mutation and family-specific observation assembly | tool result, step result, artifact store | observation packet, missing-artifact decision | observation decision, artifact refs | terminal authority | runtime loop | evidence re-entry, goal satisfaction | observation-decision characterization/boundary | observation creation still route/family split |
| Evidence re-entry | PARTIAL_SERVICE_OWNER | solver artifact reentry and payload-refresh services | `server/routes/agi.plan.ts` | post-tool synthesis bridge and docs synthesis coordination | observation ledger, support refs | reentry audit, draft candidates | reentry audit, support refs | selected terminal authority | runtime loop, post-tool bridge | goal satisfaction, terminal materializer | solver artifact reentry tests | post-tool bridge remains contested behavior |
| Goal satisfaction | PARTIAL_SERVICE_OWNER | route-product/goal-satisfaction services plus route glue | `server/routes/agi.plan.ts` | canonical goal frame and satisfaction coordination | goal contract, observations, support refs | `goal_satisfaction_evaluation` | satisfaction status, missing requirements | terminal projection | solver controller | terminal materialization | api parity matrix | canonical goal frame still route-owned high risk |
| Continuation and solver handoff | PARTIAL_SERVICE_OWNER | `runtime/observation-decision.ts`, solver-controller payload adapter | `server/routes/agi.plan.ts` | runtime-loop continuation/handoff order | observation decision, goal satisfaction | continue/finalize/typed failure candidate | decision records, pending requirements | final selected terminal unless authority passes | runtime loop | finalizer, hard gates | observation characterization, solver-controller tests | final continuation still route-orchestrated |
| Terminal candidate materialization | PARTIAL_SERVICE_OWNER | materializer services, final-answer composer | `server/routes/agi.plan.ts` | family-specific terminal candidates and repair glue | final draft, route/product contract, support refs | terminal candidate artifacts | final answer draft, materialized terminal candidate | terminal authority single writer | finalizer, post-tool bridge | terminal authority | terminal materializer tests | candidate creation and selection not fully separated |
| Terminal authority | PARTIAL_SERVICE_OWNER | terminal authority services and hard gate services | `server/routes/agi.plan.ts` | authority sequencing and fallback hard gates | terminal candidates, route contract, audits | `terminal_answer_authority`, `terminal_authority_single_writer` | authority records, typed failure when blocked | independent UI projection | finalizer | response projection | terminal authority contracts, API parity | post-tool bridge can still compete upstream |
| Visible/debug projection | PARTIAL_SERVICE_OWNER | transcript-events, live-debug-slim, live-debug-mode | `server/routes/agi.plan.ts` | terminal projection sync, live response payload wrapper, debug envelope | selected terminal, terminal presentation, debug payload | visible/API/debug mirrors | projection mirrors after authority | terminal selection | response preparation | UI/API/browser debug | terminal equivalence harness, UI debug parity | projection order needs owner proof |
| Recovery and compatibility rails | PARTIAL_SERVICE_OWNER | docs stream recovery and compatibility services | `server/routes/agi.plan.ts` | family-specific fallback and recovery writers | failures, partial payloads, stale artifacts | recovered terminal/failure candidates | recovery diagnostics | terminal authority bypass | runtime/finalizer | response wrapper | docs stream recovery tests | recovery can look like glue while writing terminal state |
| Runtime-loop orchestration | DEFERRED_RUNTIME_OWNERSHIP | none | `server/routes/agi.plan.ts` | `runHelixAgentTurnRuntimeLoop`, `executeHelixAsk`, `handleAskTurnRequest` | full turn state | completed Ask response | orchestration state only until subdivided | new canonical runtime facade | route entry points | every downstream stage | future baseline attribution | do not move as one block |

## Field Writer Matrix

| Field | Intended owner | Current writers | Route-local writers | Compatibility writers | Multiple writers expected | Write order matters | Enforcement tests | Migration status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `route` | route/product contract owner | route, route-product services | yes | legacy route branches | yes, candidates then selected | yes | API parity matrix | PARTIAL_SERVICE_OWNER |
| `route_reason_code` | route authority/product contract | route and route authority audit | yes | compatibility fallbacks | yes | yes | route authority tests | PARTIAL_SERVICE_OWNER |
| `dispatch_policy` | turn planner/contract | route planner contract | yes | legacy fallback | no final duplicate expected | yes | prompt-solving benchmark | ROUTE_OWNED_PENDING_EXTRACTION |
| `source_target_intent` | source-target arbitrator | source-target services, route glue | yes | evidence target fallback | no | yes | prompt-solving benchmark, API parity | PARTIAL_SERVICE_OWNER |
| `evidence_target_arbitration` | evidence target arbitration service | service plus route attachment | yes | none expected | no | yes | API parity matrix | PARTIAL_SERVICE_OWNER |
| `capability_plan` | capability-plan contract owner | capability plan services, route glue | yes | compatibility wrappers | yes during migration | yes | capability-plan contract test | PARTIAL_SERVICE_OWNER |
| `capability_selection_result` | `runtime/capability-selection-result.ts` | service via route call | no inline implementation | route compatibility inputs | no | yes | policy-adjacent characterization, boundary test | SERVICE_OWNED |
| `agent_step_decision` | model next-step decision owner | route runtime loop, model-turn services | yes | deterministic fallback | yes while tracing | yes | live-spine smoke, model-turn tests | ROUTE_OWNED_PENDING_EXTRACTION |
| `agent_step_observation_packet` | observation/materialization owner | route/family materializers | yes | tool-family adapters | yes during migration | yes | capability lifecycle, tool-chain matrix | PARTIAL_SERVICE_OWNER |
| `goal_satisfaction_evaluation` | goal satisfaction service | route/service mix | yes | solver controller adapter | yes while reconciling | yes | API parity, goal satisfaction tests | PARTIAL_SERVICE_OWNER |
| `final_answer_draft` | evidence re-entry/final draft materializer | route, final-draft services, post-tool bridge | yes | compatibility synthesizers | yes, candidates only | yes | final-answer composer tests | PARTIAL_SERVICE_OWNER |
| `terminal_artifact_kind` | terminal authority/projection sync | terminal authority, route projection mirrors | yes | debug mirror sync | yes, but only after authority | yes | terminal equivalence, UI debug parity | NEEDS_FIELD_WRITER_PROOF |
| `terminal_error_code` | hard gate/terminal authority | route hard gates and finalizer services | yes | typed-failure sync | yes, failure path only | yes | API parity matrix | PARTIAL_SERVICE_OWNER |
| `final_answer_source` | terminal authority/finalizer | route, finalizer, projection sync | yes | legacy fallback | yes while reconciling | yes | terminal equivalence harness | NEEDS_FIELD_WRITER_PROOF |
| `selected_final_answer` | terminal authority | route and terminal projection sync | yes | finalizer compatibility | no final duplicate expected | yes | terminal authority contracts | NEEDS_FIELD_WRITER_PROOF |
| `terminal_answer_authority` | terminal authority services | service/route mix | yes | hard-gate repair | no | yes | terminal authority contracts | PARTIAL_SERVICE_OWNER |
| `terminal_authority_single_writer` | single-writer authority | route/service mix | yes | finalizer adapter | no | yes | terminal authority contracts | PARTIAL_SERVICE_OWNER |
| `terminal_presentation` | projection owner after authority | route projection sync | yes | UI/debug response wrapper | no final duplicate expected | yes | terminal equivalence, UI debug parity | ROUTE_OWNED_PENDING_EXTRACTION |
| `request_user_input` | pending input/solver handoff | route runtime loop and finalizer | yes | typed failure compatibility | yes, but mutually exclusive terminal | yes | observation decision characterization | PARTIAL_SERVICE_OWNER |
| `pending_server_request` | pending input/transport owner | route request handling | yes | live-source/mailbox adapters | yes | yes | API parity matrix | ROUTE_OWNED_PENDING_EXTRACTION |
| `response_type` | response wrapper/projection owner | route response preparation | yes | typed failure sync | yes but final one wins | yes | response-boundary tests | ROUTE_OWNED_PENDING_EXTRACTION |
| `final_status` | finalizer/projection owner | route/finalizer | yes | compatibility sync | yes but final one wins | yes | turn-finalizer boundary | PARTIAL_SERVICE_OWNER |
| `debug mirrors` | debug projection owner after authority | route projection sync, debug slim/envelope | yes | live debug compatibility | yes, staged mirrors | yes | UI/debug parity, debug-export tests | NEEDS_FIELD_WRITER_PROOF |

## Current Extraction Status

| Slice | Boundary | Owner | Status |
| --- | --- | --- | --- |
| S93 | live debug slim | `server/services/helix-ask/debug/live-debug-slim.ts` | SERVICE_OWNED for slim builder only |
| S94 | transcript events | `server/services/helix-ask/runtime/transcript-events.ts` | SERVICE_OWNED for transcript formatting |
| S95-S96 | decision source map | `server/services/helix-ask/runtime/decision-source-map.ts` | SERVICE_OWNED |
| S97 | turn contract seed slots | `server/services/helix-ask/contracts/turn-contract-seed-slots.ts` | SERVICE_OWNED |
| S98 | live debug mode reader | `server/services/helix-ask/debug/live-debug-mode.ts` | SERVICE_OWNED |
| S99 | capability selection result | `server/services/helix-ask/runtime/capability-selection-result.ts` | SERVICE_OWNED |
| S100 | observation decision | `server/services/helix-ask/runtime/observation-decision.ts` | SERVICE_OWNED |

## Deferred Ownership Debt

- `runHelixAgentTurnRuntimeLoop`, `executeHelixAsk`, and `handleAskTurnRequest`
  remain route-owned runtime bands and must be mapped before any ownership move.
- Terminal projection sync still needs ordered-write proof before extraction.
- Post-tool authority bridge behavior remains out of scope for structural slices.
- Canonical goal-frame policy remains high risk; only pure readers/formatters
  should move before owner proof.
- Recovery helpers can write terminal state and must not be treated as harmless
  glue without field-writer proof.
