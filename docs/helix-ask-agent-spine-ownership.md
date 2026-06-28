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
| Prompt interpretation | PARTIAL_SERVICE_OWNER | `server/services/helix-ask/prompt-interpretation.ts`, `server/services/helix-ask/language-contract.ts`, `server/services/helix-ask/capability-catalog-intent.ts`, `server/services/helix-ask/doc-args.ts`, `server/services/helix-ask/voice-output-intent.ts`, `server/services/helix-ask/evidence-handoff-intent.ts`, `server/services/helix-ask/note-arg-boundaries.ts`, `server/services/helix-ask/compare-intent.ts`, `server/services/helix-ask/workspace-context-predicates.ts`, `server/services/helix-ask/model-only-answer-prompt.ts`, `server/services/helix-ask/model-only-fallback-classifier.ts`, `server/services/helix-ask/obligations.ts`, `server/services/helix-ask/answer-plan.ts`, `contracts/turn-contract-seed-slots.ts`, `contracts/turn-contract-hash.ts`, `contracts/intent-contract-hash.ts`, `contracts/turn-contract-text.ts`, `contracts/turn-contract-normalizers.ts`, `contracts/turn-contract-slots.ts`, `contracts/turn-contract-objective-planning.ts`, `contracts/turn-contract-objectives.ts`, `contracts/turn-contract-query-hints.ts`, `contracts/turn-contract-answer-format.ts`, `contracts/turn-contract-planner-metadata.ts`, `contracts/turn-contract-constraints.ts`, `contracts/turn-contract-retrieval-plan.ts`, `contracts/turn-contract-prompt-research-summary.ts`, `contracts/turn-contract-risk-flags.ts`, `contracts/turn-contract-clarify-question.ts`, `contracts/turn-contract-planner-sections.ts`, `contracts/turn-contract-goal.ts`, `objectives/objective-llm-contracts.ts`, plus route-local classifiers | `server/routes/agi.plan.ts` | large classifier bands, canonical goal-frame policy, fallback profile selection/wrapper order, note target resolution policy, compare target policy, latest-doc selection policy, workspace context mutation policy | prompt, workspace context, source hints | prompt contract, compound contract, language contract/instructions, capability catalog/help intent, model-only answer prompt text, model-only fallback id, objective planner pass, fallback-section grounding adapter output, answer-plan fallback profile sections, turn-contract objective normalization/fallback, turn-contract query hints, turn-contract answer format, turn-contract planner metadata, turn-contract constraints, turn-contract goal text selection, prompt-research summary projection, risk-flag aggregation, clarify-question assembly, planner-section source selection/normalization, explicit doc-path args, latest-doc/open-doc/doc-summary/doc-identity/doc-location-citation/doc-evidence-synthesis/deictic-docs-identity/active-doc-summary/active-doc-identity/open-doc-goal/Dottie-voice-readout/docs-read-aloud/prior-evidence-handoff prompt reads, basic text/title/create-note title/append-note text/docs-retrieval query args, note/workspace argument boundaries, create-note intent/masking, requested note-title normalization, named note sink target readers, note transfer intent reads, compare cue/target/generic-doc-target/doc-notes-hybrid/action reads, repo/append-to-note cues, deictic note predicates, artifact destination predicates, workspace context predicates/intents, workspace-help intent, goal frame inputs | interpretation records, compound contract, language contract/instructions, capability catalog/help intent result, model-only answer prompt text, model-only fallback id, objective planner parse packet, adapted fallback sections, answer-plan fallback profile sections, turn-contract objectives, turn-contract query hints, turn-contract answer format, turn-contract planner metadata, turn-contract constraints, turn-contract goal text, prompt-research summary record, risk-flag list, clarify-question text, planner-section records, explicit doc-path args, latest-doc/open-doc/doc-summary/doc-identity/doc-location-citation/doc-evidence-synthesis/deictic-docs-identity/active-doc-summary/active-doc-identity/open-doc-goal/Dottie-voice-readout/docs-read-aloud/prior-evidence-handoff prompt reader results, note/workspace argument trims, basic text/title/create-note title/append-note text/docs-retrieval query arg reads, create-note intent/masking results, requested note-title normalization, named note sink target reader results, note transfer intent results, compare cue/target/generic-doc-target/doc-notes-hybrid/action reader results, repo/append-to-note cue predicate results, deictic note predicate results, artifact destination predicate results, workspace context predicate/intent results, workspace-help intent result | execution, terminal authority | route Ask path | source admission, contract builder, final-answer composer | prompt-solving benchmark, objective LLM contracts boundary, capability-catalog-intent boundary, model-only-answer-prompt boundary, model-only-fallback-classifier boundary, response-language instruction boundary, doc-args boundary, voice-output-intent boundary, evidence-handoff-intent boundary, note-arg-boundaries boundary, compare-intent boundary, workspace-context-predicates boundary, obligations boundary, answer-plan profile boundary, turn-contract-prompt-research-summary boundary, turn-contract-risk-flags boundary, turn-contract-clarify-question boundary, turn-contract-planner-sections boundary, turn-contract-goal boundary, turn-contract-objectives boundary, turn-contract-query-hints boundary, turn-contract-answer-format boundary, turn-contract-planner-metadata boundary, turn-contract-constraints boundary | classifiers, voice output classification policy, note target resolution policy, compare target policy, latest-doc selection policy, artifact carryover storage, evidence-handoff decision writing, model-only LLM invocation, fallback admission, and workspace context mutation still duplicate authority-like signals |
| Intent and source arbitration | PARTIAL_SERVICE_OWNER | `ask-source-target-arbitrator`, `evidence-target-arbitration`, `route-product-contract`, `server/services/helix-ask/hard-tool-route-metadata.ts`, `server/services/helix-ask/live-source/stage-play-mail-wake-route-metadata.ts` services | `server/routes/agi.plan.ts` | glue and hard-gate route selection; hard-route construction, live-source phase policy, source-target coercion, and canonical goal application remain route-local | prompt interpretation, route candidates, hard backend-entrypoint metadata, stage-play mail-wake metadata | source target, evidence target, product contract, parsed hard-tool metadata, parsed stage-play mail-wake metadata | route/source/product policy records, hard-tool route metadata reads, stage-play mail-wake metadata reads | tool execution, terminal text | Ask execution | capability plan, terminal gates | api parity matrix, prompt-solving benchmark, hard-tool route metadata boundary test, stage-play mail-wake route metadata boundary test | route still coordinates precedence |
| Capability planning and selection | PARTIAL_SERVICE_OWNER | `runtime/capability-selection-result.ts`, `runtime/decision-source-map.ts`, `tool-router/capability-key.ts`, capability-plan services | `server/routes/agi.plan.ts` | capability registry setup and selected-action compatibility wrappers | universal goal frame, selected action, payload | `capability_selection_result`, decision source map | capability selection result, decision-source debug, capability-key parsed parts | observations, terminal answer | route runtime setup | observation decision, debug export | policy-adjacent characterization, capability selection boundary, capability-key boundary | selected capability can still be mirrored by other ledgers |
| Model next-step decisions | ROUTE_OWNED_PENDING_EXTRACTION | `server/routes/agi.plan.ts` | model-turn packet/executor services | runtime-loop bands | current state, capabilities, observations | `agent_step_decision` | model decision audits, selected next step | direct execution, terminal authority | private runtime loop | tool execution, observation packet | live-spine smoke when keyed, deterministic model-turn tests | still route-owned and closure-heavy |
| Tool execution adapters | PARTIAL_SERVICE_OWNER | tool-family services, workstation adapter services, and `tool-router/capability-key.ts` for pure key parsing | `server/routes/agi.plan.ts` | dispatch glue and selected tool invocation order | admitted action, args, context | receipts/results | tool receipt/result artifacts and parsed fallback panel/action ids | final answer text unless contract permits receipt terminal | runtime loop | observation materializers | tool-chain matrix, capability lifecycle tests, capability-key boundary | generic execution ownership remains mixed |
| Observation materialization | PARTIAL_SERVICE_OWNER | `runtime/observation-decision.ts`, `runtime/runtime-goal-satisfaction-observation.ts`, tool-family materializers | `server/routes/agi.plan.ts` | artifact-store mutation and family-specific observation assembly | tool result, step result, artifact store, goal satisfaction evaluation | observation packet, missing-artifact decision, runtime goal-satisfaction observation | observation decision, artifact refs, runtime goal-satisfaction observations | terminal authority | runtime loop | evidence re-entry, goal satisfaction | observation-decision characterization/boundary, runtime goal-satisfaction observation boundary | observation creation still route/family split |
| Evidence re-entry | PARTIAL_SERVICE_OWNER | solver artifact reentry and payload-refresh services, `runtime/runtime-composer-support-refs.ts`, `runtime/runtime-composer-fallback-text.ts`, `runtime/runtime-voice-side-effect-composer.ts`, `runtime/runtime-repo-evidence-synthesis-text.ts`, `runtime/runtime-civilization-bounds-composer-guard.ts`, `runtime/runtime-composer-artifact-collectors.ts`, `runtime/runtime-composer-coverage.ts`, `runtime/runtime-calculator-receipt-answer.ts`, `obligation-coverage.ts`, `contracts/turn-contract-objective-support.ts`, `contracts/turn-contract-objective-slots.ts`, `contracts/turn-contract-objective-evidence.ts`, `contracts/turn-contract-objective-unknown.ts`, `contracts/turn-contract-objective-mini-answers.ts`, `contracts/turn-contract-objective-prompt-rewrite.ts`, `objectives/objective-assembly.ts`, `objectives/objective-loop-debug.ts`, `objectives/objective-llm-contracts.ts`, `retrieval/objective-scoped-recovery.ts`, `surface/evidence-path-classification.ts` | `server/routes/agi.plan.ts` | post-tool synthesis bridge, docs synthesis coordination, objective LLM mini-synth/critic/assembly loops, route-local objective transition log wrapper | observation ledger, support refs | reentry audit, draft candidates, objective mini-answer records, deterministic objective assembly text, objective loop diagnostics/readouts, objective LLM parse packets, scoped-recovery query/enforcement records, evidence path classification records, obligation support refs | reentry audit, support refs, deterministic objective support/assembly/diagnostic/readout records, objective parser outputs, scoped-recovery query/enforcement outputs, path classification/count helpers, obligation support-ref selector output, civilization-bounds contradiction guard output, runtime composer artifact collector outputs, runtime composer coverage predicate output, runtime calculator receipt answer synthesis/sanitization output | selected terminal authority | runtime loop, post-tool bridge | goal satisfaction, terminal materializer | solver artifact reentry tests, objective extraction-boundary tests, obligation-coverage boundary test, evidence path classification boundary test, runtime composer support-ref/fallback-text/voice-side-effect/repo-evidence-synthesis/civilization-bounds-guard/artifact-collector/coverage/calculator-receipt-answer boundary tests | post-tool bridge and objective LLM invocation/repair stages remain route-owned |
| Goal satisfaction | PARTIAL_SERVICE_OWNER | route-product/goal-satisfaction services plus `goals/goal-frame-readers.ts`; `runtime/runtime-goal-satisfaction-observation.ts` owns observation recording only | `server/routes/agi.plan.ts` | canonical goal frame and satisfaction coordination | goal contract, observations, support refs | `goal_satisfaction_evaluation`, runtime goal-satisfaction observation | satisfaction status, missing requirements, observation artifact/debug mirror | terminal projection | solver controller | terminal materialization | api parity matrix, runtime goal-satisfaction observation boundary, goal-frame-readers boundary | canonical goal-frame policy still route-owned high risk; S134 does not move evaluator policy |
| Continuation and solver handoff | PARTIAL_SERVICE_OWNER | `runtime/observation-decision.ts`, `runtime/runtime-intent-packet.ts`, `runtime/runtime-continuation-hints.ts`, solver-controller payload adapter | `server/routes/agi.plan.ts` | runtime-loop continuation/handoff order and preobserved iteration writes | observation decision, goal satisfaction, canonical goal frame, available capabilities, continuation hints, current-turn artifact ledger | continue/finalize/typed failure candidate, runtime intent packet, continuation hint migration status, matched observation refs for accepted hints | decision records, pending requirements, runtime intent packet, runtime continuation hints, runtime audit packet ref, observed refs for hints | final selected terminal unless authority passes | runtime loop, debug export wrapper, solver-controller adapter | finalizer, hard gates, runtime authority audit | observation characterization, solver-controller tests, runtime-intent-packet boundary, runtime-continuation-hints boundary | final continuation and preobserved loop iteration writes still route-orchestrated |
| Terminal candidate materialization | PARTIAL_SERVICE_OWNER | materializer services, final-answer composer, `receipt-framing-suppression.ts` post-observation draft cleanup, `capability-catalog-summary.ts` summary text builder, `workspace-help-answer.ts` workspace help text builder, `simple-conversation-answer.ts` simple conversation text builder, `simple-conversation-intent.ts` simple conversation intent predicate, `conversation-text.ts` text clipping/brief sanitization helpers, `model-only-answer-prompt.ts` model-only composer prompt builder, `model-only-answer-quality.ts` model-only answer quality predicates, `model-only-fallback-answer.ts` model-only fallback text renderer/eligible fallback builder, `workspace-change-labels.ts` workspace label collector, `workspace-action-receipt-text.ts` workspace receipt/failure text renderer, `artifact-text.ts` pure text and ledger/payload/source/snippet/presence helpers, `value-readers.ts` primitive/action/snapshot/collection/mandatory-tool readers | `server/routes/agi.plan.ts` | family-specific terminal candidates and repair glue | final draft, route/product contract, support refs | terminal candidate artifacts | final answer draft, materialized terminal candidate, cleaned draft text, deterministic capability help summary text, deterministic workspace help text, deterministic simple conversation text and intent predicate results, clipped conversation labels/brief text, model-only answer prompt text, model-only answer quality predicate results, model-only fallback answer text, deterministic workspace change labels, deterministic workspace action receipt/failure text, normalized artifact text, merged ledger artifacts, artifact payload records, artifact source paths, artifact snippets, artifact presence predicate results, trimmed primitive strings, object records, string lists, record arrays, mandatory tool-name strings, action argument strings, workspace snapshot active-doc strings | terminal authority single writer | finalizer, post-tool bridge | terminal authority | terminal materializer tests, post-observation draft text boundary test, capability-catalog-summary boundary test, workspace-help-answer boundary test, simple-conversation-answer boundary test, simple-conversation-intent boundary test, conversation-text boundary test, model-only-answer-prompt boundary test, model-only-answer-quality boundary test, model-only-fallback-answer boundary test, workspace-change-labels boundary test, workspace-action-receipt-text boundary test, artifact-text boundary test, value-readers boundary test | candidate creation and selection not fully separated |
| Terminal authority | PARTIAL_SERVICE_OWNER | terminal authority services and hard gate services | `server/routes/agi.plan.ts` | authority sequencing and fallback hard gates | terminal candidates, route contract, audits | `terminal_answer_authority`, `terminal_authority_single_writer` | authority records, typed failure when blocked | independent UI projection | finalizer | response projection | terminal authority contracts, API parity | post-tool bridge can still compete upstream |
| Visible/debug projection | PARTIAL_SERVICE_OWNER | transcript-events, live-debug-slim, live-debug-mode | `server/routes/agi.plan.ts` | terminal projection sync, live response payload wrapper, debug envelope; transcript scaffold/finalization ordering remains route-local | selected terminal, terminal presentation, debug payload | visible/API/debug mirrors and transcript runtime rows | projection mirrors after authority | terminal selection | response preparation | UI/API/browser debug | terminal equivalence harness, UI debug parity, transcript-events boundary | projection order needs owner proof |
| Recovery and compatibility rails | PARTIAL_SERVICE_OWNER | docs stream recovery and compatibility services | `server/routes/agi.plan.ts` | family-specific fallback and recovery writers | failures, partial payloads, stale artifacts | recovered terminal/failure candidates | recovery diagnostics | terminal authority bypass | runtime/finalizer | response wrapper | docs stream recovery tests | recovery can look like glue while writing terminal state |
| Runtime-loop orchestration | DEFERRED_RUNTIME_OWNERSHIP | none | `server/routes/agi.plan.ts` | `runHelixAgentTurnRuntimeLoop`, `executeHelixAsk`, `handleAskTurnRequest` | full turn state | completed Ask response | orchestration state only until subdivided | new canonical runtime facade | route entry points | every downstream stage | future baseline attribution | do not move as one block |

## Field Writer Matrix

| Field | Intended owner | Current writers | Route-local writers | Compatibility writers | Multiple writers expected | Write order matters | Enforcement tests | Migration status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `route` | route/product contract owner | route, route-product services | yes | legacy route branches | yes, candidates then selected | yes | API parity matrix | PARTIAL_SERVICE_OWNER |
| `route_reason_code` | route authority/product contract | route and route authority audit | yes | compatibility fallbacks | yes | yes | route authority tests | PARTIAL_SERVICE_OWNER |
| `dispatch_policy` | turn planner/contract | route planner contract | yes | legacy fallback | no final duplicate expected | yes | prompt-solving benchmark | ROUTE_OWNED_PENDING_EXTRACTION |
| `turn_contract` | `contracts/turn-contract-builder.ts` for deterministic assembly from supplied inputs | service via route import | route supplies classifiers, cue predicates, obligation wrapper, profile selections, max caps, version, planner pass, and research contract | no separate compatibility writer expected | no final duplicate expected | yes for input selection and wrapper sequencing | turn-contract builder extraction boundary and turn-contract boundary suite | PARTIAL_SERVICE_OWNER |
| `source_target_intent` | source-target arbitrator | source-target services, route glue | yes | evidence target fallback | no | yes | prompt-solving benchmark, API parity | PARTIAL_SERVICE_OWNER |
| `stage_play_mail_wake_route_metadata` | `live-source/stage-play-mail-wake-route-metadata.ts` for parse/merge only | service via route import | route applies canonical goal/source-target/phase policy | request/payload compatibility readers | yes, metadata can be merged from request, route metadata, source-target intent, and canonical goal fallback | yes for metadata merge order only | stage-play mail-wake route metadata boundary, live-source phase resolver, evidence-target arbitration | SERVICE_OWNED_METADATA_ONLY |
| `live_source_mail_read_defaults` | `live-source/mail-read-defaults.ts` | service factory via route import | no inline implementation | route-supplied interpretation-cue predicate plus env-backed limits | yes, read defaults feed route-owned live-source mailbox action args | yes for mailbox read limit/batch cap/reason selection only | live-source mail read defaults boundary test | SERVICE_OWNED |
| `live_source_mail_observation_readers` | `live-source/mail-observation-readers.ts` | service via route import | no inline implementation | already-materialized artifacts, payload records, processed-mail observation records, and artifact lists | yes, observation and packet reader outputs feed route-owned live-source phase, continuation, progress, and terminal-support logic | yes for live-environment observation unwrapping, mail-read artifact detection, processed packet extraction, packet-content sufficiency, recommendation decision predicates, satisfying packet artifact checks, latest processed-packet lookup, current-batch mail-id collection, packet-presence checks, missing raw mail-id collection, process-fallback predicate, latest live-environment tool observation lookup, artifact index lookup, live-source decision/profile artifact predicates, aggregate latest/has live-source observation readers, and latest watch-job policy record resolution only | live-source mail observation readers boundary test | SERVICE_OWNED |
| `live_source_mail_answer_drafts` | `live-source/mail-answer-drafts.ts` | service via route import | no inline implementation | already-materialized mail item summaries, watch-policy records, processed-mail packets, and live-source mail tool observations | yes, draft strings, salience candidates, interpretation payloads, deterministic fallback text, and narrative terminal support text feed route-owned live-source mail terminal, voice-callout, and observation paths | yes for deterministic mail summary compaction, text-answer drafting, watch-policy text-for-every-batch detection, provisional voice-callout salience candidates, mail interpretation payload assembly, live-source mail fallback text rendering, processed-mail terminal text rendering, text-draft/interpretation readers, wait-wording normalization, and model-answer conflict guards only | live-source mail answer drafts boundary test | SERVICE_OWNED |
| `live_source_mail_progress_refs` | `live-source/mail-progress-refs.ts` | service via route import | no inline implementation | already-materialized values and observation records plus route-supplied live predicates | yes, progress receipts feed route-owned mail-loop continuation and budget policy | yes for progress-ref prefix matching, recursive ref collection, progress-kind classification, and progress receipt construction only | live-source mail progress refs boundary test | SERVICE_OWNED |
| `hard_tool_route_metadata` | `hard-tool-route-metadata.ts` | service via route import | no inline implementation | route constructs hard-route metadata and source-target intent records | yes, parsed metadata feeds canonical goal, hard calculator detection, and request/stream routing guards | yes for parsing/synthesis/read-only metadata helpers only | hard-tool route metadata boundary test | SERVICE_OWNED |
| `evidence_target_arbitration` | evidence target arbitration service | service plus route attachment | yes | none expected | no | yes | API parity matrix | PARTIAL_SERVICE_OWNER |
| `capability_plan` | capability-plan contract owner | capability plan services, route glue | yes | compatibility wrappers | yes during migration | yes | capability-plan contract test | PARTIAL_SERVICE_OWNER |
| `capability_selection_result` | `runtime/capability-selection-result.ts` | service via route call | no inline implementation | route compatibility inputs | no | yes | policy-adjacent characterization, boundary test | SERVICE_OWNED |
| `runtime_intent_packet` | `runtime/runtime-intent-packet.ts` | service via route call | no inline implementation | route-supplied terminal-contract fallback and ledger merge | no | yes | runtime-intent-packet boundary test | SERVICE_OWNED |
| `runtime_continuation_hints` | `runtime/runtime-continuation-hints.ts` | service via route call | no inline implementation | route-supplied capability/action/ledger callbacks | yes, hints accumulate then migrate | yes | runtime-continuation-hints boundary test | SERVICE_OWNED |
| `runtime_goal_satisfaction_observations` | `runtime/runtime-goal-satisfaction-observation.ts` | service via route call | no inline implementation | route-supplied missing-requirement/debug-policy/ledger callbacks | yes, observations accumulate | yes | runtime-goal-satisfaction-observation boundary test | SERVICE_OWNED |
| `runtime_composer_support_refs` | `runtime/runtime-composer-support-refs.ts` | service via route import | no inline implementation | artifact payload shapes from scholarly and internet-search observations | yes, refs accumulate per artifact set | yes for draft support only | runtime-composer-support-refs boundary test | SERVICE_OWNED |
| `runtime_composer_fallback_text` | `runtime/runtime-composer-fallback-text.ts` | service via route import and doc-summary/live-environment fallback factories | no inline implementation | scholarly, internet-search, workspace OS status, doc summary, repo evidence, and live-environment read-card observation payloads plus support-ref collectors and route-supplied doc/environment helper callbacks | yes, candidate text can be used as draft input | yes for draft support only | runtime-composer-fallback-text boundary test, scholarly research tool test | SERVICE_OWNED |
| `runtime_voice_side_effect_composer` | `runtime/runtime-voice-side-effect-composer.ts` | service factory via route import | no inline implementation | prompt text, fallback text, current-turn direct-answer artifacts, route-owned unquoted voice callout extractor callback | yes, candidate side-effect explanation text can be used as draft input | yes for draft support only | runtime-voice-side-effect-composer boundary test; E52 voice suite has matching pre-existing failures before and after S137 | SERVICE_OWNED |
| `runtime_repo_evidence_synthesis_text` | `runtime/runtime-repo-evidence-synthesis-text.ts` | service via route import | no inline implementation | already-built repo docs synthesis packet | yes, candidate repo evidence support text can be used as draft input | yes for draft support only | runtime-repo-evidence-synthesis-text boundary test | SERVICE_OWNED |
| `response_language_instruction` | `language-contract.ts` | service via route import | no inline implementation | existing language contract | yes, instruction lines can be inserted into composer prompts | yes for prompt/composer support only | response-language-instruction boundary test | SERVICE_OWNED |
| `capability_catalog_intent` | `capability-catalog-intent.ts` | service via route import | no inline implementation | supplied transcript text | yes, capability catalog/help intent results can feed source admission, route/product contracts, and runtime catalog planning | yes for prompt intent classification only | capability-catalog-intent boundary test, capability-plan contract test | SERVICE_OWNED |
| `capability_catalog_summary` | `capability-catalog-summary.ts` | service factory via route import | no inline implementation | workspace snapshot plus route-owned doc normalization, note title, capability catalog observation, and capability-key dependencies | yes, summary text can be used as capability-help terminal/draft input | yes for capability help summary text only | capability-catalog-summary boundary test | SERVICE_OWNED |
| `workspace_help_answer` | `workspace-help-answer.ts` | service via route import | no inline implementation | none | yes, static workspace help text can be used as a draft/terminal text candidate after route-owned eligibility permits it | yes for workspace help text construction only | workspace-help-answer boundary test | SERVICE_OWNED |
| `simple_conversation_answer` | `simple-conversation-answer.ts` | service via route import | no inline implementation | supplied transcript text | yes, static greeting/status/no-tool text can be used as a draft/terminal text candidate after route-owned eligibility permits it | yes for simple conversation text selection only | simple-conversation-answer boundary test | SERVICE_OWNED |
| `simple_conversation_intent` | `simple-conversation-intent.ts` | service via route import | no inline implementation | supplied transcript text | yes, simple greeting/status/no-tool intent results can feed route-owned model-only conversation path eligibility | yes for prompt intent predicate only | simple-conversation-intent boundary test | SERVICE_OWNED |
| `voice_output_intent` | `voice-output-intent.ts` | service via route import and service factory | no inline implementation | supplied transcript text plus route-owned full voice classifier callback | yes, Dottie voice readout and docs read-aloud intent results can feed route-owned voice/doc-readout routing | yes for Dottie voice readout and docs read-aloud prompt predicates only | voice-output-intent boundary test | SERVICE_OWNED |
| `conversation_text` | `conversation-text.ts` | service via route import | no inline implementation | supplied transcript/snippet/brief strings | yes, clipped labels, brief text, and shared regex constants feed route-owned classifiers, plan titles, and presentation/debug support | yes for pure text hygiene and regex constants only | conversation-text boundary test | SERVICE_OWNED |
| `model_only_answer_prompt` | `model-only-answer-prompt.ts` | service via route import | no inline implementation | supplied transcript text and admitted model-visible context | yes, model-only prompt text can feed the route-owned LLM invocation after route-owned eligibility permits it | yes for prompt text construction only | model-only-answer-prompt boundary test | SERVICE_OWNED |
| `model_only_answer_quality` | `model-only-answer-quality.ts` | service via route import | no inline implementation | supplied answer/draft text | yes, workspace-leak and non-substantive answer predicate results can guide route-owned repair/fallback decisions | yes for quality predicate results only | model-only-answer-quality boundary test | SERVICE_OWNED |
| `model_only_fallback_classifier` | `model-only-fallback-classifier.ts` | service via route import | no inline implementation | supplied transcript text | yes, fallback ids can feed route-owned deterministic fallback admission and draft construction | yes for fallback id classification only | model-only-fallback-classifier boundary test | SERVICE_OWNED |
| `model_only_fallback_answer` | `model-only-fallback-answer.ts` | service via route import | no inline implementation | supplied fallback id, transcript text, and payload | yes, deterministic fallback answer text and terminal-eligible fallback text can feed route-owned draft construction | yes for fallback answer text rendering and eligible fallback text return only | model-only-fallback-answer boundary test | SERVICE_OWNED |
| `workspace_change_labels` | `workspace-change-labels.ts` | service via route import | no inline implementation | supplied execution trace and workspace snapshot | yes, labels can be used as final-answer/workspace-context support text | yes for summary support text only | workspace-change-labels boundary test | SERVICE_OWNED |
| `workspace_action_receipt_text` | `workspace-action-receipt-text.ts` | service via route import | no inline implementation | supplied selected workspace action id and optional failure reason | yes, deterministic receipt/failure text can feed route-owned final-answer and failure text construction | yes for deterministic workspace action receipt/failure text rendering only | workspace-action-receipt-text boundary test | SERVICE_OWNED |
| `artifact_text` | `artifact-text.ts` | service via route import | no inline implementation | supplied artifact-like values, artifact store, or current-turn artifact ledger | yes, normalized text, source paths, snippets, payload records, and presence predicates can feed draft/support text construction, validity checks, and ledger scans | yes for pure text, merge, lookup, payload-record, source-path, snippets/matches, and simple presence predicate extraction only | artifact-text boundary test | SERVICE_OWNED |
| `value_readers` | `value-readers.ts` | service via route import | no inline implementation | supplied primitive values, arrays, object-like values, action-like args records, mandatory-tool metadata records, and payload workspace snapshots | yes, trimmed strings, object records, string lists, record arrays, and mandatory tool-name strings can feed every downstream Helix Ask field reader without owning semantics | yes for primitive non-empty string trim/null reading, object-record reading, trimmed string-list reading, record-array reading, mandatory tool-name field reading, action-argument string reading, and workspace snapshot active-doc path reading only | value-readers boundary test | SERVICE_OWNED |
| `doc_args` | `doc-args.ts` | service and service factory via route import | no inline implementation | supplied transcript text, doc-path-like values, selected action args, plus route-owned structured-docs prompt guard and route-owned masking/scope/precedence/visual-screen/Dottie callbacks | yes, normalized doc paths, route-style doc paths, selected action doc paths, explicit doc-path args, latest-doc reader results, open-doc query reader results, and doc prompt-reader results can feed doc context/planning | yes for doc-path trim/null normalization, route-style doc path formatting, selected action doc-path reading, doc prompt argument, latest-doc prompt interpretation, docs-panel-open detection, open-doc query reading, doc-summary/doc-identity/doc-evidence-synthesis/deictic-docs-identity/active-doc-summary/active-doc-identity/open-doc-goal prompt reading only | doc-args boundary test | SERVICE_OWNED |
| `evidence_handoff_intent` | `evidence-handoff-intent.ts` | service via route import | no inline implementation | supplied transcript text | yes, prior-evidence handoff prompt detection can feed route-owned evidence handoff gating | yes for prior-evidence handoff prompt reading only | evidence-handoff-intent boundary test | SERVICE_OWNED |
| `note_arg_boundaries` | `note-arg-boundaries.ts` | service factories via route import | no inline implementation | supplied note/action argument text plus route-owned bounded-note-args flag getter, live trim callback, doc-topic callback, and note-sink callbacks | yes, trimmed strings, basic text/title/create-note title/append-note text/docs-retrieval query arg reads, create-note intent/masking results, note mutation precedence, note transfer intent results, requested note-title normalization, named note sink target reader results, repo/append-to-note cue predicate results, deictic note predicate results, and artifact destination predicate results can feed workspace note/clipboard action planning | yes for prompt argument trimming, basic text/title/create-note title/append-note text/docs-retrieval query readers, create-note intent/masking, note mutation precedence prompt detection, note transfer intent reading, requested title normalization, named note sink target readers, repo/append-to-note cue predicates, deictic/invalid-title predicates, and artifact destination predicates only | note-arg-boundaries boundary test | SERVICE_OWNED |
| `compare_intent` | `compare-intent.ts` | service and service factory via route import | no inline implementation | supplied transcript text plus route-owned protected-argument masking and live trim callbacks | yes, compare cue, conceptual-vs, explicit workspace operand, compare precedence, generic doc-target, doc-notes-hybrid, selected compare-action, and right-hand target reader results can feed doc/note compare planning | yes for compare prompt interpretation only | compare-intent boundary test | SERVICE_OWNED |
| `workspace_context_predicates` | `workspace-context-predicates.ts` | service factory via route import | no inline implementation | supplied transcript text, docs-viewer action-like records, and route-owned deictic-doc-fix flag getter | yes, predicate/intent results can feed workspace context attachment, workspace status, workspace help, and snapshot mutation policy | yes for predicate and workspace-context/help intent results only | workspace-context-predicates boundary test | SERVICE_OWNED |
| `live_answer_environment_intent` | `live-answer-environment-intent.ts` | service via route import | no inline implementation | supplied transcript text | yes, predicate result feeds route-owned live answer environment/card state routing | yes for live-answer environment/card state prompt predicate only | live-answer-environment-intent boundary test | SERVICE_OWNED |
| `live_source_micro_reasoner_intent` | `live-source/micro-reasoner-intent.ts` | service via route import | no inline implementation | supplied transcript text | yes, cue predicates and deterministic MicroReasoner capability selector feed route-owned live-source/mail capability planning | yes for MicroReasoner prompt-cue predicates and deterministic capability selection only | micro-reasoner-intent boundary test | SERVICE_OWNED |
| `live_source_interpreter_profile_intent` | `live-source/interpreter-profile-intent.ts` | service via route import | no inline implementation | supplied transcript text | yes, interpreter-profile config/management/comparison cue predicates feed route-owned live-source/mail capability planning and solver-controller adapter dependencies | yes for interpreter-profile prompt-cue predicates only | interpreter-profile-intent boundary test | SERVICE_OWNED |
| `live_source_visual_observer_intent` | `live-source/visual-observer-intent.ts` | service via route import | no inline implementation | supplied transcript text | yes, visual-observer profile cue predicate feeds route-owned live-source/mail capability planning | yes for visual-observer prompt-cue predicate only | visual-observer-intent boundary test | SERVICE_OWNED |
| `live_source_mail_wake_intent` | `live-source/mail-wake-intent.ts` | service via route import | no inline implementation | supplied transcript text | yes, compact UI mailbox wake prompt predicate feeds route-owned live-source/mail wake routing and phase policy | yes for compact stage-play mailbox wake prompt predicate only | live-source-mail-wake-intent boundary test | SERVICE_OWNED |
| `live_source_mail_tool_intent` | `live-source/mail-tool-intent.ts` | service via route import | no inline implementation | supplied transcript text | yes, explicit live-source mail and MicroReasoner tool cue predicate feeds route-owned live-source/mail loop admission | yes for explicit mail tool prompt-cue predicate only | live-source-mail-tool-intent boundary test | SERVICE_OWNED |
| `live_source_mail_read_intent` | `live-source/mail-read-intent.ts` | service via route import | no inline implementation | supplied transcript text | yes, one-time live-source mail read cue predicate feeds route-owned live-source/mail loop and watch-job setup policy | yes for one-time mail read prompt-cue predicate only | live-source-mail-read-intent boundary test | SERVICE_OWNED |
| `live_source_mail_watch_intent` | `live-source/mail-watch-intent.ts` | service via route import | no inline implementation | supplied transcript text | yes, standing watch cue predicate feeds route-owned live-source/mail loop and watch-job setup policy | yes for standing watch prompt-cue predicate only | live-source-mail-watch-intent boundary test | SERVICE_OWNED |
| `live_source_mail_output_intent` | `live-source/mail-output-intent.ts` | service factory via route import | no inline implementation | supplied transcript text plus route-owned contextual/negated callbacks | yes, output-intent flags and reason codes feed route-owned live-source mail answer/watch/callout routing | yes for output-intent classification only | live-source-mail-output-intent boundary test | SERVICE_OWNED |
| `stage_play_operation_intent` | `live-source/stage-play-operation-intent.ts` | service factory via route import | no inline implementation | supplied transcript text plus route-owned checkpoint/job-planning callbacks | yes, explicit Stage Play operation cue result feeds route-owned live-source mailbox-vs-operation arbitration | yes for Stage Play operation cue detection only | stage-play-operation-intent boundary test | SERVICE_OWNED |
| `live_source_mail_loop_intent` | `live-source/mail-loop-intent.ts` | service factories via route import | no inline implementation for loop/watch setup aggregation | supplied transcript text plus route-owned compact wake, explicit mail-tool, Stage Play operation, negated/contextual, explicit loop, interpretation, standing watch, one-time read, and job-planning callbacks | yes, loop and watch-job setup intent booleans feed route-owned live-source mailbox admission, phase policy, and watch-job planning | yes for mail-loop and watch-job setup intent aggregation only | live-source-mail-loop-intent boundary test | SERVICE_OWNED |
| `live_source_mail_continuation_budget` | `live-source/mail-continuation-budget.ts` | service factories via route import | no inline default/budget-goal implementation | supplied route env-budget reader, canonical goal frame, transcript text, and route-owned mail-loop intent callback | yes, continuation budget records and eligibility booleans feed route-owned runtime-loop budget application and extension policy | yes for budget defaults, env-backed budget reading, and budget-goal eligibility only | live-source-mail-continuation-budget boundary test | SERVICE_OWNED |
| `query_merge` | `query.ts` | service via route import | no inline implementation | supplied query groups and caller-supplied limit | yes, merged query lists feed turn-contract query hints and retrieval planning | yes for pure query trimming, dedupe, group filtering, and limiting only | query-merge boundary test | SERVICE_OWNED |
| `goal_frame_readers` | `goals/goal-frame-readers.ts` | service via route import | no inline implementation for extracted readers | supplied built goal frame or candidate scalar value | yes, mutation-target reads, goal-frame hashes, and trimmed goal-frame/workspace-action strings can feed canonical goal-frame, capability selection, and workspace mutation planning | yes for pure mutation-target lookup, goal-frame hash formatting, and string trim/null reading only | goal-frame-readers boundary test | SERVICE_OWNED |
| `capability_key_parser` | `tool-router/capability-key.ts` | service via route import | no inline implementation | supplied capability key string | yes, parsed panel/action fallback parts can feed runtime tool observation packets when the tool surface entry is missing | yes for pure first-dot splitting only | capability-key boundary test | SERVICE_OWNED |
| `runtime_civilization_bounds_composer_guard` | `runtime/runtime-civilization-bounds-composer-guard.ts` | service via route import | no inline implementation | supplied model text, fallback text, selected artifacts, receipt refs, goal satisfaction state, and goal frame | yes, guard boolean can determine whether to discard a contradictory model draft in favor of existing fallback text | yes for draft support only | runtime-civilization-bounds-composer-guard boundary test | SERVICE_OWNED |
| `post_observation_draft_text` | `receipt-framing-suppression.ts` | service via route import | no inline implementation | supplied draft text and prompt | yes, cleaned draft text can be stored in a final-answer draft candidate | yes for draft text hygiene only | post-observation-draft-text boundary test | SERVICE_OWNED |
| `runtime_composer_artifact_collectors` | `runtime/runtime-composer-artifact-collectors.ts` | service factory via route import | no inline implementation | supplied artifacts plus route-owned payload/string reader callbacks | yes, collector outputs can feed composer receipts, coverage artifacts, tool observations, and fallback text lines | yes for composer input support only | runtime-composer-artifact-collectors boundary test | SERVICE_OWNED |
| `runtime_composer_coverage` | `runtime/runtime-composer-coverage.ts` | service via route import | no inline implementation | already-supplied coverage object | yes, predicate result can influence composer draft cleanup only | yes for draft cleanup support only | runtime-composer-coverage boundary test | SERVICE_OWNED |
| `runtime_calculator_receipt_answer` | `runtime/runtime-calculator-receipt-answer.ts` | service factory via route import | no inline implementation | supplied calculator receipts, coverage, route-owned receipt readers, coverage normalizer, and expression evaluator callbacks | yes, synthesized/sanitized text can be used as draft fallback input | yes for draft support only | runtime-calculator-receipt-answer boundary test; targeted stale calculator sanitizer cases | SERVICE_OWNED |
| `obligation_coverage_support_refs` | `obligation-coverage.ts` | service via route import | no inline implementation | supplied obligation, allowed citations, precedence paths, and route-supplied citation prioritizer | yes, selected refs feed obligation coverage and downstream objective support | yes for obligation coverage/support refs only | obligation-coverage boundary test | SERVICE_OWNED |
| `fallback_section_grounding_adapter` | `obligations.ts` | service via route import | no inline implementation | supplied family, requires-repo-evidence flag, required slots, and route-selected fallback sections | yes, adapted fallback sections feed obligation and answer-plan section assembly | yes for fallback-section required-slot adaptation only | obligations extraction-boundary test | SERVICE_OWNED |
| `obligation_label_and_factory_helpers` | `obligations.ts` | service via route import | no inline implementation | supplied obligation labels, answer-plan family, section kind, required slots, and planner sections | yes, normalized labels and service-built obligation records feed turn-contract obligations and later fallback section text | yes for obligation label normalization, kind inference, obligation factory output, and planner-section objective coverage only | obligations extraction-boundary test | SERVICE_OWNED |
| `answer_format_evidence_helpers` | `obligations.ts` | service via route import | no inline implementation | supplied evidence-kind arrays, section kind, and required slots | yes, preferred evidence kinds feed obligations and answer-plan sections | yes for section-kind normalization, evidence-kind normalization, and section evidence-kind inference only | obligations extraction-boundary test | SERVICE_OWNED |
| `answer_plan_profile_sections` | `answer-plan.ts` | service via route import | no inline implementation | answer-plan family key plus service-owned profile table | yes, profile sections feed obligation and answer-plan section assembly | yes for fallback profile section data only | answer-plan profile extraction-boundary test | SERVICE_OWNED |
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

The extraction wave now continues through S270. Recent slices moved small,
mechanical readers and formatters behind service owners, while intentionally
leaving source admission, tool execution, runtime-loop orchestration, terminal
materialization, terminal authority, projection, live-source behavior, and
keyed-server behavior route-owned. Future work should keep characterizing or
reducing dependencies for policy-adjacent bands instead of treating these
helper moves as runtime ownership proof.

| Slice | Boundary | Owner | Status |
| --- | --- | --- | --- |
| S93 | live debug slim | `server/services/helix-ask/debug/live-debug-slim.ts` | SERVICE_OWNED for slim builder only |
| S94/S229 | transcript events | `server/services/helix-ask/runtime/transcript-events.ts` | SERVICE_OWNED for transcript formatting, supersession normalization, terminal/turn event completion, prompt/turn/trace inference, meaningful-row detection, and single-event transcript projection only |
| S95-S96 | decision source map | `server/services/helix-ask/runtime/decision-source-map.ts` | SERVICE_OWNED |
| S97 | turn contract seed slots | `server/services/helix-ask/contracts/turn-contract-seed-slots.ts` | SERVICE_OWNED |
| S98 | live debug mode reader | `server/services/helix-ask/debug/live-debug-mode.ts` | SERVICE_OWNED |
| S99 | capability selection result | `server/services/helix-ask/runtime/capability-selection-result.ts` | SERVICE_OWNED |
| S100 | observation decision | `server/services/helix-ask/runtime/observation-decision.ts` | SERVICE_OWNED |
| S101 | goal-frame mutation-target reader | `server/services/helix-ask/goals/goal-frame-readers.ts` | SERVICE_OWNED for the pure reader only |
| S102 | goal-frame hash formatter | `server/services/helix-ask/goals/goal-frame-readers.ts` | SERVICE_OWNED for the pure formatter only |
| S241 | goal-frame string reader | `server/services/helix-ask/goals/goal-frame-readers.ts` | SERVICE_OWNED for the pure string trim/null reader only |
| S242 | capability-key parser | `server/services/helix-ask/tool-router/capability-key.ts` | SERVICE_OWNED for pure first-dot panel/action key splitting only |
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
| S198/S212 | turn-contract prompt-research summary | `server/services/helix-ask/contracts/turn-contract-prompt-research-summary.ts` | SERVICE_OWNED for deterministic active prompt-research contract selection and prompt-research summary field projection only |
| S106/S213/S217/S218/S219 | turn-contract normalizers | `server/services/helix-ask/contracts/turn-contract-normalizers.ts` | SERVICE_OWNED for deterministic family/grounding literal normalization, planner family/requested-grounding selector normalization, final grounding-mode precedence selection, final family selector precedence, and definition/relation repo mismatch detection from already-computed cue booleans only |
| S199/S210 | turn-contract risk flags | `server/services/helix-ask/contracts/turn-contract-risk-flags.ts` | SERVICE_OWNED for deterministic risk-flag aggregation and final cap from already-selected inputs only |
| S200/S211 | turn-contract clarify question | `server/services/helix-ask/contracts/turn-contract-clarify-question.ts` | SERVICE_OWNED for deterministic clarify-question assembly and nullable contract-field packaging from already-selected inputs only |
| S201 | turn-contract planner sections | `server/services/helix-ask/contracts/turn-contract-planner-sections.ts` | SERVICE_OWNED for deterministic planner-section normalization only |
| S202 | turn-contract goal | `server/services/helix-ask/contracts/turn-contract-goal.ts` | SERVICE_OWNED for deterministic goal text selection only |
| S203 | turn-contract planner-section source | `server/services/helix-ask/contracts/turn-contract-planner-sections.ts` | SERVICE_OWNED for deterministic planner-section source selection only |
| S204/S214/S215/S216 | turn-contract objectives | `server/services/helix-ask/contracts/turn-contract-objectives.ts` | SERVICE_OWNED for deterministic research objective-input assembly, objective-input precedence selection, fallback objective-label assembly, objective normalization, and fallback construction only |
| S205 | query merge | `server/services/helix-ask/query.ts` | SERVICE_OWNED for pure query merging only |
| S206 | turn-contract query hints | `server/services/helix-ask/contracts/turn-contract-query-hints.ts` | SERVICE_OWNED for deterministic query-hint assembly from already-selected prompt-research, planner, and objective hint inputs only |
| S207 | turn-contract answer format | `server/services/helix-ask/contracts/turn-contract-answer-format.ts` | SERVICE_OWNED for deterministic answer-format packaging from already-normalized sections and planner verbosity only |
| S208 | turn-contract planner metadata | `server/services/helix-ask/contracts/turn-contract-planner-metadata.ts` | SERVICE_OWNED for deterministic planner metadata packaging from already-selected mode, validity, and source only |
| S209 | turn-contract constraints | `server/services/helix-ask/contracts/turn-contract-constraints.ts` | SERVICE_OWNED for deterministic constraints field assembly from already-selected repo-evidence, grounding, family, and specificity inputs only |
| S227 | turn-contract builder shell | `server/services/helix-ask/contracts/turn-contract-builder.ts` | PARTIAL_SERVICE_OWNER for final deterministic contract assembly from supplied route classifiers, cue predicates, obligation wrapper, max caps, planner pass, research contract, and version only |
| S228 | stage-play mail-wake route metadata | `server/services/helix-ask/live-source/stage-play-mail-wake-route-metadata.ts` | SERVICE_OWNED for stage-play mail-wake route metadata schema, synthesis, request/payload reading, and merge helpers only |
| S244 | live-source mail read defaults | `server/services/helix-ask/live-source/mail-read-defaults.ts` | SERVICE_OWNED for env-backed mailbox read limit, batch cap, and reason selection only |
| S245-S247/S250-S254 | live-source mail observation readers | `server/services/helix-ask/live-source/mail-observation-readers.ts` | SERVICE_OWNED for already-materialized live-source observation, processed mail packet reading, current-batch mail-id collection, packet-presence, missing raw mail-id, process-fallback predicates, latest tool observation lookup, artifact index lookup, live-source decision/profile artifact predicates, aggregate latest/has live-source observation readers, and latest watch-job policy record resolution only |
| S255-S256/S270 | live-source mail answer drafts | `server/services/helix-ask/live-source/mail-answer-drafts.ts` | SERVICE_OWNED for deterministic mail summary compaction, text-answer drafting, watch-policy text-for-every-batch detection, provisional voice-callout salience candidates, mail interpretation payload assembly, live-source mail fallback/processed-mail terminal support text rendering, text-draft/interpretation readers, wait-wording normalization, and model-answer conflict guards only |
| S257 | live-answer environment intent | `server/services/helix-ask/live-answer-environment-intent.ts` | SERVICE_OWNED for the live-answer environment/card state prompt predicate only |
| S258 | MicroReasoner intent | `server/services/helix-ask/live-source/micro-reasoner-intent.ts` | SERVICE_OWNED for MicroReasoner prompt-cue predicates and deterministic live_env MicroReasoner capability selection only |
| S259 | interpreter-profile intent | `server/services/helix-ask/live-source/interpreter-profile-intent.ts` | SERVICE_OWNED for interpreter-profile config, management, and comparison prompt-cue predicates only |
| S260 | visual-observer intent | `server/services/helix-ask/live-source/visual-observer-intent.ts` | SERVICE_OWNED for visual-observer profile prompt-cue predicate only |
| S261 | compact mailbox wake intent | `server/services/helix-ask/live-source/mail-wake-intent.ts` | SERVICE_OWNED for compact UI mailbox wake prompt predicate only |
| S262 | explicit mail tool intent | `server/services/helix-ask/live-source/mail-tool-intent.ts` | SERVICE_OWNED for explicit live-source mail and MicroReasoner prompt-cue predicate only |
| S263 | one-time mail read intent | `server/services/helix-ask/live-source/mail-read-intent.ts` | SERVICE_OWNED for one-time live-source mail read prompt-cue predicate only |
| S264 | standing watch intent | `server/services/helix-ask/live-source/mail-watch-intent.ts` | SERVICE_OWNED for standing live-source watch prompt-cue predicate only |
| S265 | mail output intent | `server/services/helix-ask/live-source/mail-output-intent.ts` | SERVICE_OWNED for live-source mail output-intent flags and reason codes only |
| S266 | Stage Play operation intent | `server/services/helix-ask/live-source/stage-play-operation-intent.ts` | SERVICE_OWNED for explicit Stage Play operation cue detection only |
| S267 | live-source mail-loop intent aggregation | `server/services/helix-ask/live-source/mail-loop-intent.ts` | SERVICE_OWNED for mailbox loop and watch-job setup intent aggregation only |
| S268 | live-source mail continuation budget | `server/services/helix-ask/live-source/mail-continuation-budget.ts` | SERVICE_OWNED for continuation budget defaults, env-backed budget reading, and budget-goal eligibility only |
| S248-S249/S269 | live-source mail progress refs | `server/services/helix-ask/live-source/mail-progress-refs.ts` | SERVICE_OWNED for mail-loop progress-ref prefix matching, recursive collection, progress-kind classification, route-callback-backed progress receipt construction, progress receipt append/mirror mutation, and stop-reason resolution only |
| S131 | runtime intent packet | `server/services/helix-ask/runtime/runtime-intent-packet.ts` | SERVICE_OWNED for runtime-intent packet readers, source/capability predicates, packet assembly, ledger/debug append, and runtime-audit refresh handoff only |
| S132 | runtime continuation hints | `server/services/helix-ask/runtime/runtime-continuation-hints.ts` | SERVICE_OWNED for continuation hint construction, append/ledger/debug writes, agent-step decision collection, hint-decision matching, and migration marking only |
| S133 | runtime continuation observation refs | `server/services/helix-ask/runtime/runtime-continuation-hints.ts` | SERVICE_OWNED for matching accepted continuation hints to observed artifact refs only |
| S134 | runtime goal-satisfaction observation | `server/services/helix-ask/runtime/runtime-goal-satisfaction-observation.ts` | SERVICE_OWNED for missing-requirement collection and runtime goal-satisfaction observation payload/ledger/debug writes only |
| S135 | runtime composer support refs | `server/services/helix-ask/runtime/runtime-composer-support-refs.ts` | SERVICE_OWNED for scholarly and internet-search observation/support-ref collection only |
| S136/S143/S144/S145/S148 | runtime composer fallback text | `server/services/helix-ask/runtime/runtime-composer-fallback-text.ts` | SERVICE_OWNED for deterministic scholarly, internet-search, workspace OS status, doc summary, repo evidence, and live-environment read-card fallback text construction only |
| S137 | runtime voice side-effect composer | `server/services/helix-ask/runtime/runtime-voice-side-effect-composer.ts` | SERVICE_OWNED for compound interim voice side-effect prompt/fallback/receipt-sufficiency/direct-answer helper logic only |
| S138 | runtime repo evidence synthesis text | `server/services/helix-ask/runtime/runtime-repo-evidence-synthesis-text.ts` | SERVICE_OWNED for deterministic repo evidence synthesis support text construction only |
| S139 | response language instruction | `server/services/helix-ask/language-contract.ts` | SERVICE_OWNED for final-answer language instruction construction from an existing language contract only |
| S158 | capability catalog/help intent | `server/services/helix-ask/capability-catalog-intent.ts` | SERVICE_OWNED for Ask-turn capability catalog availability and capability-help intent predicates only |
| S149 | capability catalog summary | `server/services/helix-ask/capability-catalog-summary.ts` | SERVICE_OWNED for deterministic capability help summary text construction only |
| S159 | workspace help answer | `server/services/helix-ask/workspace-help-answer.ts` | SERVICE_OWNED for deterministic workspace help answer text construction only |
| S160 | simple conversation answer | `server/services/helix-ask/simple-conversation-answer.ts` | SERVICE_OWNED for deterministic simple conversation answer text selection only |
| S166 | simple conversation intent | `server/services/helix-ask/simple-conversation-intent.ts` | SERVICE_OWNED for deterministic simple conversation status/no-tool intent predicates only |
| S167 | conversation text helpers | `server/services/helix-ask/conversation-text.ts` | SERVICE_OWNED for pure conversation clipping, brief sanitization, and shared conversation regex constants only |
| S161 | model-only answer prompt | `server/services/helix-ask/model-only-answer-prompt.ts` | SERVICE_OWNED for model-only answer prompt construction only |
| S162 | model-only answer quality | `server/services/helix-ask/model-only-answer-quality.ts` | SERVICE_OWNED for model-only workspace-leak and non-substantive direct-answer predicates only |
| S163 | model-only fallback answer | `server/services/helix-ask/model-only-fallback-answer.ts` | SERVICE_OWNED for deterministic model-only fallback answer text rendering only |
| S164 | model-only fallback classifier | `server/services/helix-ask/model-only-fallback-classifier.ts` | SERVICE_OWNED for deterministic model-only fallback-id classification only |
| S165 | model-only fallback answer builder | `server/services/helix-ask/model-only-fallback-answer.ts` | SERVICE_OWNED for terminal-eligible deterministic model-only fallback answer construction only |
| S150 | workspace change labels | `server/services/helix-ask/workspace-change-labels.ts` | SERVICE_OWNED for deterministic completed workspace action label filtering only |
| S237 | workspace action receipt text | `server/services/helix-ask/workspace-action-receipt-text.ts` | SERVICE_OWNED for deterministic workspace action receipt/failure text rendering only |
| S151/S231/S233/S235 | artifact text and ledger reader helpers | `server/services/helix-ask/artifact-text.ts` | SERVICE_OWNED for pure artifact text normalization, artifact-store text lookup, ledger artifact merge/lookup, payload-record reading, source-path reading, snippets/matches reading, and simple artifact presence predicates only |
| S234/S236/S239/S240 | primitive and payload value readers | `server/services/helix-ask/value-readers.ts` | SERVICE_OWNED for non-empty string trim/null reading, object-record reading, trimmed string-list reading, record-array reading, mandatory tool-name field reading, action-argument string reading, and workspace snapshot active-doc path reading only |
| S152/S177/S232/S238/S243 | doc path args and path normalization | `server/services/helix-ask/doc-args.ts` | SERVICE_OWNED for explicit doc-path argument extraction, singular doc-path resolution, workspace doc-path trim/null normalization, route-style doc path formatting, and selected workspace-action doc-path reading only |
| S179 | doc read-aloud request intent | `server/services/helix-ask/doc-args.ts` | SERVICE_OWNED for pure read-aloud request predicate only |
| S180 | doc acquisition intent readers | `server/services/helix-ask/doc-args.ts` | SERVICE_OWNED for pure explicit document acquisition and best/open matching-doc predicates only |
| S181 | doc location prompt intents | `server/services/helix-ask/doc-args.ts` | SERVICE_OWNED for pure explicit-doc-location and active-doc-location prompt predicates only |
| S182 | active doc summary intent readers | `server/services/helix-ask/doc-args.ts` | SERVICE_OWNED for pure active-doc usefulness, concept-explanation, numeric-extraction, and summary-detail predicates only |
| S183 | doc summary prompt readers | `server/services/helix-ask/doc-args.ts` | SERVICE_OWNED for compound doc-answer, doc-about-summary, docs-summary request, docs-viewer label, open-and-summarize, topic-summary, and pre-summary docs-search prompt predicates only, behind route-supplied open-doc search and no-workspace-background-scope callbacks |
| S184 | doc identity prompt readers | `server/services/helix-ask/doc-args.ts` | SERVICE_OWNED for current-doc identity transfer, current-doc identity-to-deictic-note, doc identity, and doc identity/explain hybrid prompt predicates only, behind route-supplied compare/note exclusion and explain-intent callbacks |
| S185 | doc location citation-required reader | `server/services/helix-ask/doc-args.ts` | SERVICE_OWNED for pure doc-location citation-required prompt predicate only |
| S186 | active doc synthesis prompt readers | `server/services/helix-ask/doc-args.ts` | SERVICE_OWNED for doc-evidence synthesis, deictic docs identity, and active-doc summary prompt predicates only, behind route-supplied masking, scope, and precedence callbacks where required |
| S190 | active doc identity reader | `server/services/helix-ask/doc-args.ts` | SERVICE_OWNED for active-doc identity prompt predicate only, behind a route-supplied visual-screen target callback |
| S191 | open doc goal intent reader | `server/services/helix-ask/doc-args.ts` | SERVICE_OWNED for open-doc goal prompt predicate only, behind route-supplied docs/open/read-aloud/Dottie callbacks |
| S192 | Dottie voice readout intent reader | `server/services/helix-ask/voice-output-intent.ts` | SERVICE_OWNED for Dottie voice readout prompt predicate only; route still owns voice-output classification, Dottie setup, live jobs, and voice side effects |
| S194 | docs read-aloud intent reader | `server/services/helix-ask/voice-output-intent.ts` | SERVICE_OWNED for docs read-aloud prompt predicate only, behind a route-supplied full voice classifier; route still owns voice-output classification, docs read-aloud routing, source admission, Dottie setup, live jobs, and voice side effects |
| S187 | prior evidence handoff intent reader | `server/services/helix-ask/evidence-handoff-intent.ts` | SERVICE_OWNED for prior-evidence handoff prompt predicate only; route still owns evidence handoff validation and payload writes |
| S188 | compare precedence intent reader | `server/services/helix-ask/compare-intent.ts` | SERVICE_OWNED for compare precedence prompt predicate only; route still owns compare policy, target resolution, planning, execution, and terminal behavior |
| S175 | doc latest topic readers | `server/services/helix-ask/doc-args.ts` | SERVICE_OWNED for latest-doc topic normalization/extraction, topic-qualified latest-doc detection, open-doc topic cleanup, create-note-then-open-doc topic reading, and latest/recent doc acquisition prompt readers only |
| S176 | doc open query readers | `server/services/helix-ask/doc-args.ts` | SERVICE_OWNED for doc-topic tokenization, docs-panel-open detection, topic-doc query reading, title-like open-doc query reading, result-doc query reading, aggregate open-doc search query reading, and topic/open-doc acquisition predicates only |
| S153 | note arg boundaries | `server/services/helix-ask/note-arg-boundaries.ts` | SERVICE_OWNED for note/workspace action argument boundary trimming only |
| S154 | note basic args | `server/services/helix-ask/note-arg-boundaries.ts` | SERVICE_OWNED for basic text/title argument readers only |
| S168 | note deictic target predicates | `server/services/helix-ask/note-arg-boundaries.ts` | SERVICE_OWNED for deictic note label/target and invalid resolved-title predicates only |
| S169 | note artifact reference intents | `server/services/helix-ask/note-arg-boundaries.ts` | SERVICE_OWNED for artifact reference destination predicates only |
| S170 | note create-title intent | `server/services/helix-ask/note-arg-boundaries.ts` | SERVICE_OWNED for create-note title reading, create-note intent detection, and protected argument masking only |
| S171 | note sink title readers | `server/services/helix-ask/note-arg-boundaries.ts` | SERVICE_OWNED for requested note-title normalization and named note sink target readers only |
| S172 | note append cue readers | `server/services/helix-ask/note-arg-boundaries.ts` | SERVICE_OWNED for append-note text reading plus repo and append-to-note cue predicates only |
| S173 | note docs retrieval query reader | `server/services/helix-ask/note-arg-boundaries.ts` | SERVICE_OWNED for docs-retrieval query text extraction for note retrieval prompts only |
| S189 | note mutation precedence intent reader | `server/services/helix-ask/note-arg-boundaries.ts` | SERVICE_OWNED for note mutation precedence prompt predicate only |
| S193 | note transfer intent readers | `server/services/helix-ask/note-arg-boundaries.ts` | SERVICE_OWNED for create-note-then-open-doc, artifact-carryover-to-note, safe-default-preserve-to-note, and docs-retrieval-to-note prompt predicates only, behind route-supplied note/doc callbacks |
| S174 | compare intent | `server/services/helix-ask/compare-intent.ts` | SERVICE_OWNED for compare cue regex, explicit workspace operand predicate, conceptual-vs predicate, compare-cue-outside-protected-args predicate, and compare right-hand target reader only |
| S195 | generic doc compare target predicate | `server/services/helix-ask/compare-intent.ts` | SERVICE_OWNED for generic document compare target predicate only; route still owns note target resolution, doc-vs-note/doc-vs-doc compare policy, planning, execution, and terminal behavior |
| S196 | doc-notes hybrid compare intent reader | `server/services/helix-ask/compare-intent.ts` | SERVICE_OWNED for doc-plus-notes hybrid compare prompt predicate only, behind route-supplied protected-argument masking; route still owns note target resolution, doc-vs-note/doc-vs-doc compare policy, planning, execution, and terminal behavior |
| S197 | compare action intent readers | `server/services/helix-ask/compare-intent.ts` | SERVICE_OWNED for extract-append-compare, create-copy-compare, and compare-copy-result-to-clipboard prompt predicates only, behind route-supplied protected-argument masking; route still owns flagged open-create-compare, summary-to-note detection, note target resolution, compare planning, execution, and terminal behavior |
| S155 | workspace context predicates | `server/services/helix-ask/workspace-context-predicates.ts` | SERVICE_OWNED for reasoning-context mode and workspace/doc-context predicate helpers only |
| S156 | workspace context intents | `server/services/helix-ask/workspace-context-predicates.ts` | SERVICE_OWNED for composite workspace status and workspace-change summary intent predicates only |
| S157 | workspace help intent | `server/services/helix-ask/workspace-context-predicates.ts` | SERVICE_OWNED for workspace-help intent predicate only |
| S178 | process graph overview intent | `server/services/helix-ask/workspace-context-predicates.ts` | SERVICE_OWNED for process-graph/open-panels overview intent predicate only |
| S140 | runtime civilization-bounds composer guard | `server/services/helix-ask/runtime/runtime-civilization-bounds-composer-guard.ts` | SERVICE_OWNED for detecting civilization-bounds draft contradictions against supplied receipt evidence only |
| S141 | post-observation draft text cleanup | `server/services/helix-ask/receipt-framing-suppression.ts` | SERVICE_OWNED for post-observation draft text cleanup and receipt-framing suppression only |
| S142 | runtime composer artifact collectors | `server/services/helix-ask/runtime/runtime-composer-artifact-collectors.ts` | SERVICE_OWNED for composer receipt/coverage/tool-observation/text-line collection only |
| S146 | runtime composer coverage predicate | `server/services/helix-ask/runtime/runtime-composer-coverage.ts` | SERVICE_OWNED for pure composer coverage completeness checks only |
| S147 | runtime calculator receipt answer | `server/services/helix-ask/runtime/runtime-calculator-receipt-answer.ts` | SERVICE_OWNED for calculator receipt fallback synthesis and stale-result draft sanitization only |

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
- Turn-contract family policy remains route-owned where selected; S106 moved
  literal normalizers, S213 moved planner selector normalization, S217 moved
  final grounding-mode precedence selection, S218 moved final family selector
  precedence, and S219 moved definition/relation repo mismatch detection from
  already-computed planner/fallback/relation/repo-anchor inputs.
- Turn-contract required-slot policy remains route-owned where objectives and
  caps are selected; S107 moved only slot aggregation.
- Objective support remains dependent on route-owned covered-slot evidence; S108
  moved only the support mapper.
- Objective slot inference remains dependent on route-owned obligation coverage;
  S109 moved only the inference mapper.
- Obligation support-ref selection is service-owned after S220; route still
  supplies citation prioritization and precedence inputs through the coverage
  wrapper.
- Fallback-section grounding adaptation is service-owned after S221; route still
  performs profile lookup fallback and preserves wrapper call order for obligation
  and answer-plan section assembly.
- Answer-plan fallback profile sections are service-owned after S222; route still
  performs family lookup fallback and preserves wrapper call order.
- Obligation label normalization, obligation factory construction, and planner-section
  objective coverage helpers are service-owned after S223; route still preserves wrapper
  call order and final turn-contract assembly.
- Answer-format section-kind normalization, evidence-kind normalization, and section
  evidence-kind inference are service-owned after S224-S225.
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
- Turn-contract objective fragment splitting, slot/query-hint inference,
  prompt-research objective/section projection, active prompt-research contract selection, prompt-research summary field
  projection, risk-flag aggregation/capping, clarify-question assembly/field packaging, and
  planner family/requested-grounding/final-grounding/final-family selector normalization plus definition/relation mismatch detection, planner-section source selection/normalization, goal text selection,
  research objective-input assembly, objective-input precedence selection, objective normalization/fallback construction, query-hint assembly,
  answer-format packaging, planner metadata packaging, constraints field assembly, and final deterministic turn-contract assembly
  are service-owned after S130, S198-S219, and S227;
  route-owned family/specificity selection, planner-pass application,
  cue predicates, obligation wrapper sequencing, profile lookup fallback, and contract input selection remain unresolved.
- Query merging is service-owned after S205; turn-contract query-hint assembly
  is service-owned after S206; route-owned retrieval policy, query source
  selection, and retrieval execution remain unresolved.
- Runtime-intent packet assembly and its audit-refresh handoff are
  service-owned after S131; route-owned runtime-loop sequencing, terminal
  contract policy fallback, tool execution, goal satisfaction, and terminal
  authority remain unresolved.
- Runtime-continuation hint construction, append, agent-step matching, and
  migration marking are service-owned after S132; route-owned runtime-loop
  sequencing, admission, retry policy, tool execution, and terminal authority
  remain unresolved.
- Continuation-hint observation-ref matching is service-owned after S133;
  route-owned preobserved runtime-loop iteration writes remain unresolved.
- Runtime goal-satisfaction observation recording is service-owned after S134;
  route-owned satisfaction evaluation, terminal contract policy, pending-input
  sequencing, and runtime-loop progression remain unresolved.
- Runtime composer support-ref collection is service-owned after S135;
  route-owned final-answer draft construction, LLM invocation, support-ref
  selection semantics, terminal materialization, terminal authority, and
  projection remain unresolved.
- Runtime composer fallback text construction is service-owned after S136;
  S143 extends that owner to workspace OS status diagnostic fallback text;
  S144 extends it to doc summary fallback text through a six-callback
  route dependency interface for doc path and summary formatting helpers;
  S145 extends it to repo evidence fallback text;
  S148 extends it to live-environment read-card fallback text through a
  three-callback route dependency interface for payload reads, string reads,
  and live environment lookup;
  route-owned final-answer draft selection, LLM invocation, terminal
  materialization, terminal authority, and projection remain unresolved.
- Runtime voice side-effect composition helpers are service-owned after S137;
  route-owned unquoted voice callout extraction, voice tool execution,
  live-source phase policy, terminal materialization, terminal authority, and
  projection remain unresolved. The E52 voice-focused suite still has matching
  pre-existing failures around voice observation/handoff materialization before
  and after this extraction.
- Runtime repo evidence synthesis support text is service-owned after S138;
  route-owned repo retrieval, evidence selection, final-answer draft selection,
  terminal materialization, terminal authority, and projection remain unresolved.
- Response-language instruction construction is service-owned after S139;
  route-owned composer prompt assembly, LLM invocation, terminal materialization,
  terminal authority, and projection remain unresolved.
- Capability catalog/help intent classification is service-owned after S158,
  and capability help summary text construction is service-owned after S149;
  route-owned catalog observation construction, runtime capability
  materialization, terminal materialization, terminal authority, and projection
  remain unresolved.
- Workspace help answer text construction is service-owned after S159;
  route-owned workspace-help intent, route/product selection, terminal
  materialization, terminal authority, and projection remain unresolved.
- Simple conversation answer text selection is service-owned after S160, and
  simple-conversation status/no-tool intent predicates are service-owned after
  S166; route-owned route/product selection, terminal materialization,
  terminal authority, and projection remain unresolved.
- Conversation clipping, brief sanitization, and shared conversation regex
  constants are service-owned after S167; route-owned classifiers, model
  invocation, terminal materialization, terminal authority, and projection
  remain unresolved.
- Model-only answer prompt construction is service-owned after S161;
  route-owned model-only classification, LLM invocation, fallback selection,
  terminal materialization, terminal authority, and projection remain unresolved.
- Model-only answer quality predicates are service-owned after S162;
  route-owned repair/fallback decisions, terminal materialization, terminal
  authority, and projection remain unresolved.
- Model-only fallback answer text rendering is service-owned after S163;
  and terminal-eligible fallback answer construction is service-owned after
  S165; route-owned demoted observation construction, terminal materialization,
  terminal authority, and projection remain unresolved.
- Model-only fallback-id classification is service-owned after S164;
  route-owned deterministic fallback admission, demoted observation
  construction, terminal materialization, terminal authority, and projection
  remain unresolved.
- Workspace change label filtering is service-owned after S150; route-owned
  workspace action execution, workspace snapshot construction, terminal
  materialization, terminal authority, and projection remain unresolved.
- Artifact text normalization and artifact-store text lookup are service-owned
  after S151; route-owned artifact payload reading, terminal candidate lookup,
  terminal materialization, terminal authority, and projection remain unresolved.
- Explicit doc-path argument extraction is service-owned after S152,
  latest-doc topic/open-doc prompt readers are service-owned after S175, and
  open-doc query reader helpers are service-owned after S176, doc-location and
  active-doc summary readers are service-owned after S181-S182, and doc-summary
  prompt-reader predicates are service-owned after S183, and doc-identity prompt
  readers are service-owned after S184, and doc-location citation-required
  detection is service-owned after S185, and doc-evidence synthesis, deictic
  docs identity, and active-doc summary prompt readers are service-owned after
  S186, active-doc identity detection is service-owned after S190,
  open-doc goal detection is service-owned after S191, Dottie voice
  readout detection is service-owned after S192, and docs read-aloud prompt
  detection is service-owned after S194;
  route-owned workspace doc-path normalization, context mutation, source
  admission, latest-doc candidate selection/scoring, docs planning, evidence
  selection, terminal materialization, and authority remain unresolved.
- Prior-evidence handoff prompt detection is service-owned after S187;
  route-owned prior-result validity checks, evidence handoff decision payload
  writes, note mutation gating, terminal materialization, and authority remain
  unresolved.
- Compare cue and target prompt reading is service-owned after S174, compare
  precedence prompt detection is service-owned after S188, and generic doc
  compare target detection is service-owned after S195, and doc-notes hybrid
  compare detection is service-owned after S196; selected compare action prompt
  readers are service-owned after S197; route-owned compare
  policy, doc/note target resolution, workspace note matching, action planning,
  execution, terminal materialization, and authority remain unresolved.
- Note/workspace action argument boundary trimming is service-owned after S153
  behind a route-owned feature-flag getter, and basic text/title argument
  readers are service-owned after S154, and deictic note/invalid-title
  predicates are service-owned after S168, and artifact reference destination
  predicates are service-owned after S169, and create-note title/intent/masking
  helpers are service-owned after S170, and requested note-title normalization
  plus named note sink target readers are service-owned after S171, and
  append-note text reading plus repo/append-to-note cue predicates are
  service-owned after S172, and docs-retrieval query text extraction is
  service-owned after S173, and note mutation precedence prompt detection is
  service-owned after S189; route-owned note-target resolution,
  artifact carryover storage, workspace note matching, action planning,
  execution, terminal materialization, and authority remain unresolved.
- Workspace context predicates are service-owned after S155 behind a route-owned
  deictic-doc-fix flag getter, and composite workspace status/change-summary
  intent predicates are service-owned after S156, and workspace-help intent
  classification is service-owned after S157; route-owned workspace snapshot
  mutation, source admission, docs planning, evidence selection, terminal
  materialization, and authority remain unresolved.
- Runtime civilization-bounds composer guard logic is service-owned after S140;
  route-owned civilization tool execution, evidence selection, draft selection,
  terminal materialization, terminal authority, and projection remain unresolved.
- Post-observation draft text cleanup is service-owned after S141;
  route-owned draft selection, LLM invocation, terminal materialization,
  terminal authority, and projection remain unresolved.
- Runtime composer artifact collectors are service-owned after S142 via a
  two-callback route dependency interface; route-owned artifact creation,
  evidence selection, draft construction, terminal materialization, terminal
  authority, and projection remain unresolved.
- Runtime composer coverage completeness checks are service-owned after S146;
  route-owned coverage creation, answer cleanup, draft construction, terminal
  materialization, terminal authority, and projection remain unresolved.
- Runtime calculator receipt fallback synthesis and stale-result draft
  sanitization are service-owned after S147 through invocation-time route
  callback wrappers; route-owned calculator tool execution, receipt creation,
  coverage creation, draft selection, terminal materialization, terminal
  authority, and projection remain unresolved.
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
