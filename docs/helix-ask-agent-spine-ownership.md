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
| Prompt interpretation | PARTIAL_SERVICE_OWNER | `server/services/helix-ask/prompt-interpretation.ts`, `contracts/turn-contract-seed-slots.ts`, `contracts/turn-contract-hash.ts`, `contracts/intent-contract-hash.ts`, `contracts/turn-contract-text.ts`, `contracts/turn-contract-normalizers.ts`, `contracts/turn-contract-slots.ts`, `contracts/turn-contract-objective-planning.ts`, `contracts/turn-contract-retrieval-plan.ts`, `objectives/objective-llm-contracts.ts`, plus route-local classifiers | `server/routes/agi.plan.ts` | large classifier bands and canonical goal-frame policy | prompt, workspace context, source hints | prompt contract, compound contract, objective planner pass, goal frame inputs | interpretation records, compound contract, objective planner parse packet | execution, terminal authority | route Ask path | source admission, contract builder | prompt-solving benchmark, objective LLM contracts boundary | classifiers still duplicate authority-like signals |
| Intent and source arbitration | PARTIAL_SERVICE_OWNER | `ask-source-target-arbitrator`, `evidence-target-arbitration`, `route-product-contract` services | `server/routes/agi.plan.ts` | glue and hard-gate route selection | prompt interpretation, route candidates | source target, evidence target, product contract | route/source/product policy records | tool execution, terminal text | Ask execution | capability plan, terminal gates | api parity matrix, prompt-solving benchmark | route still coordinates precedence |
| Capability planning and selection | PARTIAL_SERVICE_OWNER | `runtime/capability-selection-result.ts`, `runtime/decision-source-map.ts`, capability-plan services | `server/routes/agi.plan.ts` | capability registry setup and selected-action compatibility wrappers | universal goal frame, selected action, payload | `capability_selection_result`, decision source map | capability selection result, decision-source debug | observations, terminal answer | route runtime setup | observation decision, debug export | policy-adjacent characterization, capability selection boundary | selected capability can still be mirrored by other ledgers |
| Model next-step decisions | ROUTE_OWNED_PENDING_EXTRACTION | `server/routes/agi.plan.ts` | model-turn packet/executor services | runtime-loop bands | current state, capabilities, observations | `agent_step_decision` | model decision audits, selected next step | direct execution, terminal authority | private runtime loop | tool execution, observation packet | live-spine smoke when keyed, deterministic model-turn tests | still route-owned and closure-heavy |
| Tool execution adapters | PARTIAL_SERVICE_OWNER | tool-family services and workstation adapter services | `server/routes/agi.plan.ts` | dispatch glue and selected tool invocation order | admitted action, args, context | receipts/results | tool receipt/result artifacts | final answer text unless contract permits receipt terminal | runtime loop | observation materializers | tool-chain matrix, capability lifecycle tests | generic execution ownership remains mixed |
| Observation materialization | PARTIAL_SERVICE_OWNER | `runtime/observation-decision.ts`, tool-family materializers | `server/routes/agi.plan.ts` | artifact-store mutation and family-specific observation assembly | tool result, step result, artifact store | observation packet, missing-artifact decision | observation decision, artifact refs | terminal authority | runtime loop | evidence re-entry, goal satisfaction | observation-decision characterization/boundary | observation creation still route/family split |
| Evidence re-entry | PARTIAL_SERVICE_OWNER | solver artifact reentry and payload-refresh services, `contracts/turn-contract-objective-support.ts`, `contracts/turn-contract-objective-slots.ts`, `contracts/turn-contract-objective-evidence.ts`, `contracts/turn-contract-objective-unknown.ts`, `contracts/turn-contract-objective-mini-answers.ts`, `contracts/turn-contract-objective-prompt-rewrite.ts`, `objectives/objective-assembly.ts`, `objectives/objective-loop-debug.ts`, `objectives/objective-llm-contracts.ts`, `retrieval/objective-scoped-recovery.ts`, `surface/evidence-path-classification.ts` | `server/routes/agi.plan.ts` | post-tool synthesis bridge, docs synthesis coordination, objective LLM mini-synth/critic/assembly loops, route-local objective transition log wrapper | observation ledger, support refs | reentry audit, draft candidates, objective mini-answer records, deterministic objective assembly text, objective loop diagnostics/readouts, objective LLM parse packets, scoped-recovery query/enforcement records, evidence path classification records | reentry audit, support refs, deterministic objective support/assembly/diagnostic/readout records, objective parser outputs, scoped-recovery query/enforcement outputs, path classification/count helpers | selected terminal authority | runtime loop, post-tool bridge | goal satisfaction, terminal materializer | solver artifact reentry tests, objective extraction-boundary tests, evidence path classification boundary test | post-tool bridge and objective LLM invocation/repair stages remain route-owned |
| Goal satisfaction | PARTIAL_SERVICE_OWNER | route-product/goal-satisfaction services plus `goals/goal-frame-readers.ts` | `server/routes/agi.plan.ts` | canonical goal frame and satisfaction coordination | goal contract, observations, support refs | `goal_satisfaction_evaluation` | satisfaction status, missing requirements | terminal projection | solver controller | terminal materialization | api parity matrix | canonical goal-frame policy still route-owned high risk |
| Continuation and solver handoff | PARTIAL_SERVICE_OWNER | `runtime/observation-decision.ts`, `runtime/runtime-intent-packet.ts`, `runtime/runtime-continuation-hints.ts`, solver-controller payload adapter | `server/routes/agi.plan.ts` | runtime-loop continuation/handoff order | observation decision, goal satisfaction, canonical goal frame, available capabilities, continuation hints | continue/finalize/typed failure candidate, runtime intent packet, continuation hint migration status | decision records, pending requirements, runtime intent packet, runtime continuation hints, runtime audit packet ref | final selected terminal unless authority passes | runtime loop, debug export wrapper, solver-controller adapter | finalizer, hard gates, runtime authority audit | observation characterization, solver-controller tests, runtime-intent-packet boundary, runtime-continuation-hints boundary | final continuation still route-orchestrated |
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
| `runtime_intent_packet` | `runtime/runtime-intent-packet.ts` | service via route call | no inline implementation | route-supplied terminal-contract fallback and ledger merge | no | yes | runtime-intent-packet boundary test | SERVICE_OWNED |
| `runtime_continuation_hints` | `runtime/runtime-continuation-hints.ts` | service via route call | no inline implementation | route-supplied capability/action/ledger callbacks | yes, hints accumulate then migrate | yes | runtime-continuation-hints boundary test | SERVICE_OWNED |
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
| S101 | goal-frame mutation-target reader | `server/services/helix-ask/goals/goal-frame-readers.ts` | SERVICE_OWNED for the pure reader only |
| S102 | goal-frame hash formatter | `server/services/helix-ask/goals/goal-frame-readers.ts` | SERVICE_OWNED for the pure formatter only |
| S103 | turn-contract hash formatter | `server/services/helix-ask/contracts/turn-contract-hash.ts` | SERVICE_OWNED for the pure formatter only |
| S104 | intent-contract hash formatter | `server/services/helix-ask/contracts/intent-contract-hash.ts` | SERVICE_OWNED for the pure formatter only |
| S105 | turn-contract text normalizer | `server/services/helix-ask/contracts/turn-contract-text.ts` | SERVICE_OWNED for the pure normalizer only |
| S106 | turn-contract family/grounding normalizers | `server/services/helix-ask/contracts/turn-contract-normalizers.ts` | SERVICE_OWNED for pure literal normalizers only |
| S107 | turn-contract required-slot aggregation | `server/services/helix-ask/contracts/turn-contract-slots.ts` | SERVICE_OWNED for pure slot aggregation only |
| S108 | turn-contract objective-support mapper | `server/services/helix-ask/contracts/turn-contract-objective-support.ts` | SERVICE_OWNED for pure support mapping only |
| S109 | turn-contract objective-slot inference | `server/services/helix-ask/contracts/turn-contract-objective-slots.ts` | SERVICE_OWNED for pure slot inference only |
| S110 | turn-contract objective evidence slot-hit inference | `server/services/helix-ask/contracts/turn-contract-objective-evidence.ts` | SERVICE_OWNED for pure evidence matching only |
| S111 | turn-contract objective unknown blocks | `server/services/helix-ask/contracts/turn-contract-objective-unknown.ts` | SERVICE_OWNED for pure unknown-block construction/sanitization only |
| S112 | objective mini-answer assembly | `server/services/helix-ask/contracts/turn-contract-objective-mini-answers.ts` | SERVICE_OWNED for deterministic mini-answer assembly only |
| S113 | objective mini-answer validation summary | `server/services/helix-ask/contracts/turn-contract-objective-mini-answers.ts` | SERVICE_OWNED for deterministic mini-answer status counts only |
| S114 | objective prompt rewrite helpers | `server/services/helix-ask/contracts/turn-contract-objective-prompt-rewrite.ts` | SERVICE_OWNED for deterministic rewrite mode/hash/token/rewrite prompt text only |
| S115 | turn-contract retrieval-plan assembly | `server/services/helix-ask/contracts/turn-contract-retrieval-plan.ts` | SERVICE_OWNED for deterministic retrieval budget/path/precedence assembly only |
| S116 | objective mini-synth prompt renderer | `server/services/helix-ask/contracts/turn-contract-objective-mini-answers.ts` | SERVICE_OWNED for deterministic mini-synth prompt text only |
| S117 | objective mini-critic prompt renderer | `server/services/helix-ask/contracts/turn-contract-objective-mini-answers.ts` | SERVICE_OWNED for deterministic mini-critic prompt text only |
| S118 | objective mini-synth application | `server/services/helix-ask/contracts/turn-contract-objective-mini-answers.ts` | SERVICE_OWNED for deterministic parsed mini-synth merge only |
| S119 | objective mini-critic application | `server/services/helix-ask/contracts/turn-contract-objective-mini-answers.ts` | SERVICE_OWNED for deterministic parsed mini-critic merge only |
| S120 | objective assembly prompt renderer | `server/services/helix-ask/contracts/turn-contract-objective-mini-answers.ts` | SERVICE_OWNED for deterministic assembly prompt text only |
| S121 | deterministic objective assembly fallback and weak-draft detector | `server/services/helix-ask/objectives/objective-assembly.ts` | SERVICE_OWNED for deterministic fallback assembly and weak-draft detection only |
| S122 | objective loop diagnostics and OES enforcement | `server/services/helix-ask/objectives/objective-loop-debug.ts` | SERVICE_OWNED for pure terminal/coverage, unknown-block enforcement, and evidence-sufficiency diagnostics only |
| S123 | objective scoped-recovery helper subset | `server/services/helix-ask/retrieval/objective-scoped-recovery.ts` | SERVICE_OWNED for behavior-identical scoped-recovery gate, target selection, max-attempt, escalation hint, target expansion, and variant scoring helpers only |
| S124 | objective loop state/readout helpers | `server/services/helix-ask/objectives/objective-loop-debug.ts` | SERVICE_OWNED for objective-loop state construction, transition, coverage snapshot, summary, plain reasoning trace, and finalization helpers using explicit route callback injection only |
| S125 | objective retrieve-proposal contracts | `server/services/helix-ask/objectives/objective-llm-contracts.ts` | SERVICE_OWNED for deterministic retrieve-proposal prompt rendering and JSON proposal parsing only |
| S126 | evidence path classification | `server/services/helix-ask/surface/evidence-path-classification.ts` | SERVICE_OWNED for evidence path key normalization, doc/code/tree path classification, code-floor counts, and tree-citation stats only |
| S127 | objective mini-synth/mini-critic parsers | `server/services/helix-ask/objectives/objective-llm-contracts.ts` | SERVICE_OWNED for deterministic parsing of already-produced mini-synth and mini-critic outputs only |
| S128 | objective scoped-recovery route-compatible enforcement | `server/services/helix-ask/retrieval/objective-scoped-recovery.ts` | SERVICE_OWNED for query variant construction and route-compatible missing scoped-retrieval enforcement only |
| S129 | objective planner prompt/parser contract | `server/services/helix-ask/objectives/objective-llm-contracts.ts` | SERVICE_OWNED for deterministic objective planner prompt rendering and parser normalization only |
| S130 | turn-contract objective planning | `server/services/helix-ask/contracts/turn-contract-objective-planning.ts` | SERVICE_OWNED for deterministic objective fragment splitting, slot/query-hint inference, and prompt-research objective/section projection only |
| S131 | runtime intent packet | `server/services/helix-ask/runtime/runtime-intent-packet.ts` | SERVICE_OWNED for runtime-intent packet readers, source/capability predicates, packet assembly, ledger/debug append, and runtime-audit refresh handoff only |
| S132 | runtime continuation hints | `server/services/helix-ask/runtime/runtime-continuation-hints.ts` | SERVICE_OWNED for continuation hint construction, append/ledger/debug writes, agent-step decision collection, hint-decision matching, and migration marking only |

## Deferred Ownership Debt

- `runHelixAgentTurnRuntimeLoop`, `executeHelixAsk`, and `handleAskTurnRequest`
  remain route-owned runtime bands and must be mapped before any ownership move.
- Terminal projection sync still needs ordered-write proof before extraction.
- Post-tool authority bridge behavior remains out of scope for structural slices.
- Canonical goal-frame policy remains high risk; S101-S102 moved pure helpers, but
  classifiers and required-terminal policy still need owner proof before moving.
- Turn-contract construction remains route-owned; S103 moved only the post-build
  hash formatter.
- Equation intent-contract construction and stability checking remain route-owned;
  S104 moved only the post-build hash formatter.
- Turn-contract field assembly remains route-owned; S105 moved only the shared
  text normalizer.
- Turn-contract family and grounding policy remain route-owned where selected;
  S106 moved only literal normalizers.
- Turn-contract required-slot policy remains route-owned where objectives and
  caps are selected; S107 moved only slot aggregation.
- Objective support remains dependent on route-owned covered-slot evidence; S108
  moved only the support mapper.
- Objective slot inference remains dependent on route-owned obligation coverage;
  S109 moved only the inference mapper.
- Objective evidence slot-hit inference remains dependent on route-owned evidence
  refs and required slots; S110 moved only matching helpers.
- Objective unknown blocks remain dependent on route-owned mini-answer and
  retrieval state; S111 moved only construction and sanitization helpers.
- Objective mini-answer assembly remains dependent on route-owned objective loop
  states, retrieval logs, and LLM mini-synth/critic stages; S112 moved only
  deterministic assembly from supplied inputs.
- Objective mini-answer validation remains dependent on route-owned finalization
  policy; S113 moved only status counting.
- Objective mini-synth remains dependent on route-owned LLM invocation, parser
  repair, and critique policy; S116 moved only the deterministic prompt renderer.
- Objective mini-critic remains dependent on route-owned LLM invocation, parser
  repair, and critique application policy; S117 moved only deterministic prompt
  rendering.
- Objective mini-synth and mini-critic parsing are service-owned after S127;
  route-owned LLM invocation, parser repair loops, and objective stage
  sequencing remain unresolved.
- Objective assembly LLM invocation, assessment, repair, and deterministic
  schema repair remain route-owned; S120 moved only deterministic assembly prompt
  rendering, and S121 moved deterministic fallback rendering plus weak-draft
  detection into the existing objective assembly service.
- Objective loop transition sequencing, retrieval recovery, and LLM objective
  stages remain route-owned or recovery-shell-owned; S122 moved only pure
  terminal/coverage, unknown-block, and OES diagnostic/enforcement helpers.
- Objective loop state construction, transition, coverage snapshot, summary,
  plain reasoning trace, and finalization helpers are service-owned after S124;
  route-owned wrappers still control transition-log clipping, runtime ordering,
  retrieval recovery, and LLM objective stages.
- Objective retrieve-proposal prompt rendering and proposal parsing are
  service-owned after S125; mini-synth and mini-critic parsers are
  service-owned after S127.
- Objective planner prompt rendering and planner-pass parsing are service-owned
  after S129; route-owned LLM invocation, parsed-pass application, and planner
  repair policy remain unresolved.
- Turn-contract objective fragment splitting, slot/query-hint inference, and
  prompt-research objective/section projection are service-owned after S130;
  route-owned family/specificity selection, planner-pass application,
  obligations assembly, and final turn-contract construction remain unresolved.
- Runtime-intent packet assembly and its audit-refresh handoff are
  service-owned after S131; route-owned runtime-loop sequencing, terminal
  contract policy fallback, tool execution, goal satisfaction, and terminal
  authority remain unresolved.
- Runtime-continuation hint construction, append, agent-step matching, and
  migration marking are service-owned after S132; route-owned runtime-loop
  sequencing, admission, retry policy, tool execution, and terminal authority
  remain unresolved.
- Objective scoped-recovery query variants and missing scoped-retrieval
  enforcement are service-owned after S128; the service intentionally keeps
  route-compatible enforcement exports separate from the newer optional-slot
  filtered enforcement behavior.
- Objective prompt rewriting remains dependent on route-owned LLM invocation,
  model selection, telemetry, and budget policy; S114 moved only deterministic
  rewrite mode, hash/token estimates, and rewrite prompt text construction.
- Turn-contract retrieval-plan assembly remains dependent on route-owned query
  constraints, prompt-research contracts, and max-query configuration; S115
  moved only deterministic plan assembly from those supplied inputs.
- Recovery helpers can write terminal state and must not be treated as harmless
  glue without field-writer proof.
