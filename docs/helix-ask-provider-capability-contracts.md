# Helix Ask Provider Capability Contracts

Status: working-draft provider catalog contract.

This document defines how Helix Ask capabilities become available to provider
agents such as Helix Native, Codex Workstation Mode, and future runtimes. It is
not a prompt and it is not a runtime loop. The machine-checkable companion is:

```txt
server/services/helix-ask/provider-agent-capability-contract.ts
server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts
docs/helix-ask-codex-workstation-release-readiness.md
```

## Shared Lifecycle

Provider-facing capabilities must use the shared Helix contract:

```txt
prompt/tool intent
-> capability admission
-> capability-owned args
-> tool execution or observation builder
-> structured observation/receipt
-> model re-entry
-> provider final candidate
-> Helix terminal authority
-> visible/debug projection
```

Receipts and observations are not answers. UI/debug rows are not answer
authority. Provider final prose must not be parsed to infer tool execution.

## Runtime Goal Session Validation

Runtime goal sessions are provider-neutral: Helix Native, Codex Workstation
Mode, and future runtimes must use the same goal/session proof chain:

```txt
/goal start
-> durable job brief
-> /goal wake
-> admitted workstation observation
-> evidence re-entry
-> provider terminal candidate
-> Helix terminal authority
-> console/debug projection
```

The keyed live validation command is:

```txt
npm run helix:ask:runtime-goal-probe:providers:both
```

Run it only against the normal keyed server, started either by the user or by
an explicitly authorized Codex Desktop invocation of the configured opaque
`start-myapp-for-codex` launcher. It executes Codex and Helix runtime goal
probes through both JSON and stream Ask routes, then writes a run directory
under `artifacts/helix-ask-runtime-goal`.

Each run writes `artifact-manifest.json`, which indexes the saved response,
Debug Copy, stream event, and validation files. The validation must prove:

```txt
start job title
start runtime provider
start console/debug summary
start-to-wake goal continuity
runtime session continuity when reported
wake source identity and freshness
requested workstation observation/tool
observation refs
provider progress summary
evidence re-entry debug stage
terminal authority debug stage
server-authoritative terminal result
debug-export endpoint continuity
```

If the keyed server is unavailable or the first live request fails, the probe
still writes a run directory with `probe-error.json` and `artifact-manifest.json`.
Treat that as connectivity/keyed-runtime evidence, not as a product validation
failure. A successful completion proof requires real `start-response.json`,
`wake-response.json`, `debug-export.json`, and `validation.json` artifacts for
the JSON route, plus the matching `stream-*` artifacts when stream validation is
enabled.

This is a focused live proof for runtime-goal continuity. It is not a broad Ask
smoke suite and should not replace targeted tests for unrelated route,
capability-lane, or workstation-gateway changes.

## Availability Labels

| Label                            | Meaning                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared_gateway_now`             | Exposed through `workstation-tool-gateway/registry.ts` for Helix, Codex, and future providers.                                               |
| `shared_capability_lane_now`     | Exposed through the capability-lane runner for Helix, Codex, and future providers without adding a workstation gateway manifest entry.       |
| `safe_to_graduate_next`          | Read/observe capability that can be promoted after bounded observation, debug, and negative-admission tests exist.                           |
| `requires_confirmation_contract` | Side-effecting output such as voice; needs explicit affirmative admission, confirmation/playback policy, and receipts.                       |
| `candidate_host_receipt_bridge`  | Narrow Codex Workstation host-dispatch bridge with structured action envelope and receipt; absent from the shared provider gateway manifest. |
| `helix_native_only`              | Helix-owned live-environment behavior that should not be provider-facing until a narrower contract exists.                                   |
| `legacy_dynamic_panel_only`      | Retired or panel-local dynamic action; do not count as provider gateway parity.                                                              |
| `blocked_pending_contract`       | Mutating/control capability or ambiguous lifecycle; fail closed until a permission and receipt contract exists.                              |
| `client_projection_only`         | Client UI behavior such as read-aloud playback, not an agent tool.                                                                           |

## Shared Now

The current provider-shared workstation gateway exposes these capabilities:

```txt
workspace_os.status
helix_ask.inspect_capability_catalog
workstation.active_context
theory-badge-graph.current_context
workstation-notes.list_notes
scientific-calculator.solve_expression
scientific-calculator.solve_scalar_expression
scientific-calculator.classify_expression
scientific-calculator.bind_variables
scientific-calculator.active_context
workstation.readable_surface.observe
docs-viewer.read_visible_surface
docs-viewer.read_active_translation
scientific-calculator.read_visible_result
scientific-calculator.read_visible_theory_run_result
scientific-calculator.open_panel
scientific-calculator.focus_panel
scientific-calculator.show_gateway_solve
scientific-calculator.prefill_expression
workstation.open_panel
workstation.focus_panel
account_session.set_interface_language
docs-viewer.open_doc
repo.search
docs.search
research-library.read_document
research-library.apply_evidence_enrichment
scholarly-research.lookup_papers
scholarly-research.fetch_full_text
scholarly-research.extract_numeric_parameters
civilization-bounds.reflect_system_bounds
helix_ask.reflect_theory_context
theory-badge-graph.propose_frontier_conjectures
theory-formal-verifier.inspect_artifact_family
theory-formal-verifier.prepare_request
theory-formal-verifier.plan
theory-formal-verifier.start
theory-formal-verifier.read_result
theory-runtime-canary.inspect
theory-runtime-canary.plan
theory-runtime-canary.start
theory-runtime-canary.read_result
theory-artifact-producer.prepare_lanyon_request
theory-artifact-producer.admit_lanyon_snapshot
theory-semantic-admitter.normalize
theory-independent-numerical-verifier.prepare_request
theory-independent-numerical-verifier.plan
theory-independent-numerical-verifier.start
theory-independent-numerical-verifier.read_result
theory-experiment-procedure.prepare
theory-experiment-procedure.readmit
theory-experiment-procedure.evaluate_closure
scientific-evidence-closure.inspect_enrollment
scientific-evidence-closure.prepare
scientific-evidence-closure.evaluate
moral-graph.reflect_context
moral-graph.reflect_living_substrate_context
text_to_speech.speak_text
live_env.request_interim_voice_callout
live_env.narrator_say
live_env.query_visual_summaries
live_env.query_audio_transcripts
live_env.query_translation_segments
live_env.query_microdeck_outputs
live_env.query_live_answer_state
live_env.query_source_health
live_env.query_trace_memory
live_env.query_narrator_events
live_env.query_packet_traces
live_env.query_route_evidence
live_env.query_automation_policies
live_env.query_live_source_loop_health
live_env.query_live_source_quality
live_env.query_workstation_goal_context
live_env.summarize_live_source_current_state
live_env.query_event_log
live_env.query_world_events
live_env.query_navigation_state
live_env.query_stage_sources
live_env.query_constructs
live_env.query_job_evidence
live_env.check_live_source_mail
live_env.read_live_source_mail
live_env.read_processed_live_source_mail
live_env.reflect_live_source_mail_loop
live_env.compare_mail_to_interpreter_profile
live_env.validate_live_source_prediction
live_env.predict_live_source_immediate
live_env.compare_live_source_prediction
live_env.describe_stage_builder
live_env.validate_stage_play_graph
live_env.plan_stage_play_job
live_env.query_micro_reasoner_presets
live_env.query_micro_reasoner_prompts
live_env.test_micro_reasoner_prompt
live_env.query_visual_observer_profiles
live_env.test_visual_observer_profile
live_env.compare_visual_observer_profiles
room.evidence.read_bound
situation-room.live-source.set_rate
com.casimirbot.minecraft.actor.status.read
com.casimirbot.minecraft.inventory.check
com.casimirbot.minecraft.nearby_entities.list
com.casimirbot.minecraft.hazards.scan
com.casimirbot.minecraft.local_map.inspect
com.casimirbot.minecraft.line_of_sight.check
com.casimirbot.minecraft.crop_state.read
com.casimirbot.minecraft.reachability.check
com.casimirbot.minecraft.command.catalog
com.casimirbot.minecraft.command
situation-room.describe_visual_capture
room.list
room.inspect
room.create
room.source.list
room.source.create
```

The Shared Live Room entries use the same provider-neutral gateway but are not
Agent API solver-continuation tools. `room.create` and `room.source.create`
remain affirmative, confirmed, idempotent control actions. The Agent API
`database_scope` admits only the separate read-only bound-room evidence
capability.

| Capability                 | Required args                | Observation or receipt                                      | Boundary                                                                                                                                                     |
| -------------------------- | ---------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `room.evidence.read_bound` | none                         | `helix.shared_live_room.bound_room_evidence_observation.v1` | Read-only Agent-continuation capability; exact run-room binding, current role/consent, source provenance, freshness, and current-turn re-entry are required. |
| `situation-room.live-source.set_rate` | `cadence_ms`, `capture_mode` | `helix.visual_producer_cadence_receipt.v1` | Confirmation-gated producer cadence mutation. The receipt is nonterminal evidence and does not grant source or answer authority. |
| `com.casimirbot.minecraft.actor.status.read` | `target` (`current_actor`), optional `freshness_requirement_ms` | `helix.environment_connector.probe_observation.v1` | Read-only health, hunger, game-mode, flags, world, and position observation for the bound actor. |
| `com.casimirbot.minecraft.inventory.check` | `target` (`current_actor`), optional `freshness_requirement_ms` | `helix.environment_connector.probe_observation.v1` | On-demand read-only probe through `room.environment.probe`; all room, source, world, device, credential, admission, catalog, schema, run, turn, and tool-call identity is server-derived. |
| `com.casimirbot.minecraft.nearby_entities.list` | `target` (`current_actor`), optional `freshness_requirement_ms` | `helix.environment_connector.probe_observation.v1` | Bounded nearby-entity classifications, distances, and hostile targeting observations. |
| `com.casimirbot.minecraft.hazards.scan` | `target` (`current_actor`), optional `freshness_requirement_ms` | `helix.environment_connector.probe_observation.v1` | Hostile-presence count and nearest-hostile distance; not a complete environmental danger proof. |
| `com.casimirbot.minecraft.local_map.inspect` | `target` (`current_actor`), optional `freshness_requirement_ms` | `helix.environment_connector.probe_observation.v1` | Coarse 9×9 floor occupancy sample; not a full map or route planner. |
| `com.casimirbot.minecraft.line_of_sight.check` | `target` (`position`), `position`, optional `freshness_requirement_ms` | `helix.environment_connector.probe_observation.v1` | Same-world read-only ray trace to exact coordinates. |
| `com.casimirbot.minecraft.crop_state.read` | `target` (`current_focus` or `position`), optional `position` and `freshness_requirement_ms` | `helix.environment_connector.probe_observation.v1` | Crop maturity only; it does not harvest or open anything. |
| `com.casimirbot.minecraft.reachability.check` | `target` (`position`), `position`, optional `freshness_requirement_ms` | `helix.environment_connector.probe_observation.v1` | Straight-line radius and interaction-range screening; not pathfinding or safe-route authority. |
| `com.casimirbot.minecraft.command.catalog` | optional `query`, `path_prefix`, `limit`, `environment_label` | `helix.environment_command.catalog_observation.v1` | Read-only, version-correct paths from the bound server's live Brigadier tree, with every vanilla/mod root prioritized in the bounded snapshot. It exposes no room/source/world IDs or credentials. |
| `com.casimirbot.minecraft.command` | `command`, `category`, `effect`, optional `environment_label` | `helix.environment_command.observation.v1` | Executes one exact command through the bound server's live dispatcher. Room authority, member ceiling, autonomy, live catalog, dispatcher parse, category/effect match, idempotency, one-shot leasing, and current-turn evidence re-entry are all required. Full mode includes mod/admin commands but never host shell, files, RCON, processes, or credentials. |
| `situation-room.describe_visual_capture` | `thread_id`, `prompt` | `helix.visual_situation_observation.v1` | Read-only bounded SituationRun evidence; execution failure remains an admitted observation, and successful evidence must re-enter the runtime before synthesis. |
| `room.list`                | none                         | `helix.shared_live_room.list_receipt.v1`                    | Server-authenticated account policy filters the list.                                                                                                        |
| `room.inspect`             | `room_id`                    | `helix.shared_live_room.inspect_receipt.v1`                 | Current membership is rechecked; the receipt is nonterminal.                                                                                                 |
| `room.create`              | `idempotency_key`            | `helix.shared_live_room.create_receipt.v1`                  | Confirmed mutation through the shared lifecycle service.                                                                                                     |
| `room.source.list`         | `room_id`                    | `helix.shared_live_room.source_list_receipt.v1`             | Policy-admitted owner read; no bearer or raw source payload.                                                                                                  |
| `room.source.create`       | `room_id`, `idempotency_key` | `helix.shared_live_room.source_create_receipt.v1`           | Confirmed observation-only binding; returns only a short-lived owner-bound delivery handle.                                                                  |

## Shared Capability Lanes

These capabilities are provider-shared through the capability-lane runner rather
than the workstation gateway manifest:

```txt
live_translation.translate_text
visual_analysis.inspect_image_region
visual_analysis.inspect_frame
```

`live_translation.translate_text` emits
`helix.live_translation.observation.v1`, a same-turn
`helix.agent_step_observation_packet.v1`, and optional projection receipts. It
is observation-only: translated text is evidence for the next model step, not a
terminal answer. Backend selection stays Helix-owned, external backends execute
when configured and selected by policy. A configured OpenAI-compatible
translation key selects that provider by default unless
`HELIX_LIVE_TRANSLATION_EXTERNAL_BACKENDS_ENABLED=0` explicitly keeps the lane
on deterministic local fallback. Final answer authority remains behind evidence
re-entry plus Helix terminal authority.

`visual_analysis.inspect_image_region` and `visual_analysis.inspect_frame` emit
Image Lens/visual observations and receipts for already-admitted visual sources.
They do not grant source admission by lexical mention: quoted, negated,
historical, future, or screen-visible "inspect" wording must not execute the
lane. Region/frame output is visual evidence for the next model step, not a
terminal answer, and must remain behind evidence re-entry plus Helix terminal
authority. The older `image_lens.inspect` capability is now an explicit
provider-shared alias to the bounded
`situation-room.describe_visual_capture` gateway. The alias grants no lexical
execution authority; hard visual source admission must already exist, and the
gateway observation must re-enter the runtime before terminal synthesis.

The shared gateway capabilities above are bounded gateway observations/receipts
with no assistant answer authority and no raw content inclusion:

```txt
assistant_answer=false
raw_content_included=false
post_tool_model_step_required=true
```

Most gateway receipts stay `terminal_eligible=false` so evidence can re-enter a
solver step. The graduated `account_session.set_interface_language` preference
action is terminal-eligible because its final product is the workstation action
receipt itself, not a model-written answer.

Shared gateway observations may also expose typed affordance handoff metadata:

```txt
produces_affordances
consumes_affordances
typed_handoff_role
produced_affordances
consumed_affordances
typed_handoff_contract
```

These fields are evidence-routing metadata, not answer authority. Producer
tools may offer affordances such as `source_ref`, `text_evidence`,
`citation_evidence`, `numeric_value_evidence`, `theory_context`,
`calculator_expression_template`, `claim_boundary`, `frontier_candidate`, and
`active_surface_ref`. Consumer tools declare required affordance kinds before
they can use an upstream observation. Missing required affordances must fail
closed as typed missing-input diagnostics.

The first graduated compound handoff is:

```txt
Theory Badge Graph calculator_expression_template
-> scholarly/docs numeric_value_evidence with units and source refs
-> typed binder emits bound_calculator_expression
-> scientific-calculator.solve_expression receives only the substituted numeric expression
```

The calculator must not receive algebraic badge templates directly. If any
required variable cannot be bound with a numeric value, unit, and source ref, the
compound rail remains blocked and the debug export must show the missing
variables, rejected template expression, selected affordances, and terminal
authority state.

`shared_gateway_now` does not mean every capability is read-only. The shared
classifier derives permission class from the gateway manifest:

```txt
mutating=true -> mutating_control
requires_confirmation=true -> user_confirmed_side_effect
mode=act -> ui_projection
otherwise -> read_observe
```

This keeps graduated voice available to provider agents while preserving its
side-effect and confirmation boundary. It also keeps panel open/focus actions
host-projected instead of pretending they are evidence reads.

## Shared Gateway Schemas

The shared gateway manifest is the machine-readable source for per-capability
required args and input schemas. The provider contract must name every shared
observation or receipt schema so catalog review can tell which lifecycle shape a
capability uses:

| Schema                                                                          | Used for                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `helix.workspace_os_status_observation.v1`                                      | Workspace/runtime status observations.                                                                                                                                                                                                                                                            |
| `helix.workstation_active_context_observation.v1`                               | Active workstation focus/context observations.                                                                                                                                                                                                                                                    |
| `helix.theory_badge_graph_current_context_observation.v1`                       | Bounded current Theory Badge Graph selection, trace, branch possibilities, boundary, and semantic lens observations.                                                                                                                                                                              |
| `helix.workstation_notes_list_observation.v1`                                   | Body-redacted Workstation Notes index observations.                                                                                                                                                                                                                                               |
| `helix.calculator_solve_observation.v1`                                         | Calculator solve observations.                                                                                                                                                                                                                                                                    |
| `helix.calculator_scalar_solve_observation.v1`                                  | Scalar calculator solve observations.                                                                                                                                                                                                                                                             |
| `helix.calculator_expression_classification_observation.v1`                     | Calculator expression classification observations.                                                                                                                                                                                                                                                |
| `helix.calculator_variable_binding_observation.v1`                              | Calculator variable-binding observations.                                                                                                                                                                                                                                                         |
| `helix.calculator_active_context_observation.v1`                                | Active calculator expression/result context observations.                                                                                                                                                                                                                                         |
| `helix.workstation_readable_surface_observation.v1`                             | Registered readable workstation surface observations for docs, translations, calculator results, and future safe surfaces.                                                                                                                                                                        |
| `helix.workstation_ui_action_receipt.v1`                                        | Host-side panel/open/focus/autofill projection receipts.                                                                                                                                                                                                                                          |
| `helix.repo_search_observation.v1`                                              | Repository search observations.                                                                                                                                                                                                                                                                   |
| `helix.docs_search_observation.v1`                                              | Documentation search observations.                                                                                                                                                                                                                                                                |
| `helix.internet_search_observation.v1`                                          | Internet search observations.                                                                                                                                                                                                                                                                     |
| `helix.scholarly_research_observation.v1`                                       | Scholarly paper lookup observations.                                                                                                                                                                                                                                                              |
| `helix.scholarly_full_text_observation.v1`                                      | Scholarly full-text observations with bounded chunks.                                                                                                                                                                                                                                             |
| `helix.research_library_observation.v1`                                         | Profile-scoped bounded page evidence read from an encrypted saved research extraction without network retrieval.                                                                                                                                                                                  |
| `helix.paper_evidence_enrichment_observation.v1`                                | Profile-scoped result of validating and revisioning an agent-authored paper-evidence proposal; observation-only and never exact-equation authority.                                                                                                                                               |
| `helix.scholarly_numeric_parameter_observation.v1`                              | Scholarly numeric parameter observations with cited values and units.                                                                                                                                                                                                                             |
| `helix.civilization_bounds_reflection_observation.v1`                           | Civilization-bounds reflection observations.                                                                                                                                                                                                                                                      |
| `helix.theory_context_reflection_observation.v1`                                | Theory badge graph reflection observations.                                                                                                                                                                                                                                                       |
| `helix.moral_graph_reflection_observation.v1`                                   | Moral Graph context reflection observations.                                                                                                                                                                                                                                                      |
| `helix.moral_living_substrate_reflection_observation.v1`                        | Moral Graph living-substrate reflection observations.                                                                                                                                                                                                                                             |
| `helix.theory_frontier_conjecture_observation.v1`                               | Theory badge graph frontier conjecture workbench observations.                                                                                                                                                                                                                                    |
| `casimir.theory_formal_verifier.artifact_family_audit_observation.v1`           | Developer-only inspection of the pinned source-family and generator-lineage audits. It exposes exact theorem scope and typed enrollment blockers as non-terminal evidence; it does not execute Lean or authorize enrollment.                                                                         |
| `casimir.theory_formal_verifier.preparation_observation.v1`                     | Developer-only, server-catalog-bound formal preparation receipt; no Lean execution and no caller-authored theorem/environment authority.                                                                                                                                                          |
| `casimir.theory_formal_verifier.plan_observation.v1`                            | Developer-only sealed-input preflight observations; no Lean execution.                                                                                                                                                                                                                            |
| `casimir.theory_formal_verifier.start_observation.v1`                           | Confirmation-gated formal replay job receipts.                                                                                                                                                                                                                                                    |
| `casimir.theory_formal_verifier.result_observation.v1`                          | Developer-scoped replay status and evidence-only formal certificates.                                                                                                                                                                                                                             |
| `casimir.formal_runtime_canary.inspection_observation.v1`                       | Developer-only readiness inspection for the exact no-import Lean runtime self-test; no execution or scientific authority.                                                                                                                                                                         |
| `casimir.formal_runtime_canary.plan_observation.v1`                             | Developer-only hash-bound preflight for the exact self-test; no execution and no approval issuance.                                                                                                                                                                                               |
| `casimir.formal_runtime_canary.start_observation.v1`                            | Confirmation-gated, developer-scoped receipt for starting only the pinned self-test.                                                                                                                                                                                                              |
| `casimir.formal_runtime_canary.result_observation.v1`                           | Developer-scoped running, failure, or completion evidence for the self-test; non-scientific, closure-ineligible, and nonterminal.                                                                                                                                                                 |
| `casimir.theory_independent_numerical_verifier.prepared_request_observation.v1` | Developer-only resolution of an opaque server-owned numerical execution catalog entry; no caller-authored policy or path authority and no execution.                                                                                                                                              |
| `casimir.theory_independent_numerical_verifier.plan_observation.v1`             | Developer-only sealed numerical preflight observations; no harness execution.                                                                                                                                                                                                                     |
| `casimir.theory_independent_numerical_verifier.start_observation.v1`            | Confirmation-gated independent numerical replay job receipts.                                                                                                                                                                                                                                     |
| `casimir.theory_independent_numerical_verifier.result_observation.v1`           | Developer-scoped replay status and bounded numerical certificates.                                                                                                                                                                                                                                |
| `casimir.theory_artifact_producer.lanyon_request_observation.v1`                | Developer-only preparation of a hash-bound generation request from exact current-turn procedure and semantic evidence; provider normalization emits one exact, non-automatic `admit_lanyon_snapshot` affordance bound to that normalized artifact. It reads no source bytes and executes nothing. |
| `casimir.theory_artifact_producer.lanyon_admission_observation.v1`              | Developer-only read-only admission of the exact pinned Lanyon source snapshot and its non-terminal generation receipt.                                                                                                                                                                            |
| `casimir.theory_semantic_admitter.observation.v1`                               | Developer-only deterministic source normalization plus canonical claim IR and snapshot-bound, non-terminal semantic-admission evidence.                                                                                                                                                           |
| `casimir.theory_experiment_procedure.observation.v1`                            | Developer-only seven-stage procedure preparation or exact owner/session-bound readmission with current-turn evidence bindings, dependency ordering, scale checkpoints, and bounded downstream affordances.                                                                                        |
| `casimir.theory_experiment_execution_closure.observation.v1`                    | Developer-only, read-only evidence-coverage evaluation and claim-bounded candidate ranking; not a scientific conclusion or terminal answer.                                                                                                                                                       |
| `casimir.scientific_evidence_enrollment.observation.v1`                         | Developer-only inspection of one registered document-independent scientific evidence manifest and its retained sidecar; read-only, nonterminal, and not execution authority.                                                                                                                       |
| `casimir.scientific_evidence_execution_plan.observation.v1`                     | Developer-only immutable binding of an exact registered source claim, Theory Badge orientation, permitted intervention, Lanyon snapshot, formal proposition, numerical lineages, comparison policy, and claim ceiling; preparation executes nothing and grants no confirmation.                      |
| `casimir.scientific_evidence_closure.observation.v1`                            | Developer-only evaluation of current-turn, hash-bound plan and runtime evidence against the enrolled closure axes; a satisfied packet is canonical only within the exact synthetic enrollment and remains nonterminal evidence for bounded synthesis.                                                |
| `helix.theory_run_context_observation.v1`                                       | Bounded selected runtime-result context for current-turn explanation; it remains evidence for synthesis rather than an answer.                                                                                                                                                                    |
| `helix.interim_voice_callout_tool_result.v1`                                    | Voice/narrator request receipts and host playback projections.                                                                                                                                                                                                                                    |
| `helix.live_environment_tool_observation.v1`                                    | Graduated live-environment read/dry-run observations.                                                                                                                                                                                                                                             |
| `helix.environment_command.observation.v1`                                      | One-shot Minecraft live-dispatcher outcomes with exact room/source/world, catalog, policy, command hash, provenance, and current-turn re-entry eligibility. The observation is never an assistant answer.                                                                                         |
| `helix.visual_producer_cadence_receipt.v1`                                      | Confirmation-gated Situation Room live-source cadence changes; the receipt is nonterminal and must re-enter before any model synthesis.                                                                                                                                                         |

## Shared Gateway Required Args

The shared gateway manifest owns exact JSON schemas. This table names the
required args that provider agents must supply for currently shared
capabilities with non-empty `input_schema.required`:

| Capability                                              | Required args                                                                                                                                                                                                                                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scientific-calculator.solve_expression`                | `expression`                                                                                                                                                                                                                                                              |
| `scientific-calculator.solve_scalar_expression`         | `expression`                                                                                                                                                                                                                                                              |
| `scientific-calculator.classify_expression`             | `expression`                                                                                                                                                                                                                                                              |
| `scientific-calculator.bind_variables`                  | `expression`, `numeric_evidence`                                                                                                                                                                                                                                          |
| `scientific-calculator.show_gateway_solve`              | `expression`, `result`                                                                                                                                                                                                                                                    |
| `scientific-calculator.prefill_expression`              | `expression`                                                                                                                                                                                                                                                              |
| `workstation.open_panel`                                | `panel_id`                                                                                                                                                                                                                                                                |
| `workstation.focus_panel`                               | `panel_id`                                                                                                                                                                                                                                                                |
| `account_session.set_interface_language`                | `language`                                                                                                                                                                                                                                                                |
| `docs-viewer.open_doc`                                  | `path`                                                                                                                                                                                                                                                                    |
| `theory-badge-graph.current_context`                    | `current_context`                                                                                                                                                                                                                                                         |
| `moral-graph.reflect_living_substrate_context`          | `prompt`                                                                                                                                                                                                                                                                  |
| `repo.search`                                           | `query`                                                                                                                                                                                                                                                                   |
| `docs.search`                                           | `query`                                                                                                                                                                                                                                                                   |
| `internet-search.search_web`                            | `query`                                                                                                                                                                                                                                                                   |
| `research-library.apply_evidence_enrichment`            | `document_id`, `proposal`                                                                                                                                                                                                                                                 |
| `scholarly-research.lookup_papers`                      | `query`                                                                                                                                                                                                                                                                   |
| `civilization-bounds.reflect_system_bounds`             | `prompt`                                                                                                                                                                                                                                                                  |
| `helix_ask.reflect_theory_context`                      | `prompt`                                                                                                                                                                                                                                                                  |
| `theory-experiment-procedure.prepare`                   | `prompt`, `operation`, `target`, `selected_badge_ids`                                                                                                                                                                                                                     |
| `theory-experiment-procedure.readmit`                   | `procedure_artifact_ref`, `procedure_id`, `procedure_sha256`                                                                                                                                                                                                              |
| `theory-experiment-procedure.evaluate_closure`          | `prompt`, `procedure_id`, `procedure_sha256`                                                                                                                                                                                                                              |
| `scientific-evidence-closure.inspect_enrollment`        | `manifest_id`                                                                                                                                                                                                                                                             |
| `scientific-evidence-closure.prepare`                   | `manifest_id`, `orientation_id`, `source_claim_id`, `intervention_parameter_id`, `intervention_value`                                                                                                                                                                    |
| `scientific-evidence-closure.evaluate`                  | `manifest_id`, `plan_id`, `execution_plan_artifact_ref`, `closure_input_artifact_ref`; both artifacts must resolve uniquely from authoritative current-turn evidence and bind the exact same plan digest                                                                 |
| `theory-badge-graph.propose_frontier_conjectures`       | `prompt`                                                                                                                                                                                                                                                                  |
| `theory-formal-verifier.prepare_request`                | `procedure_artifact_ref`, `procedure_id`, `procedure_sha256`; optional selectors remain non-authoritative, and the current production catalog permits blocked preparation only                                                                                            |
| `theory-formal-verifier.plan`                           | `prepared_request_id`                                                                                                                                                                                                                                                     |
| `theory-formal-verifier.start`                          | `prepared_request_id`, `plan_id`                                                                                                                                                                                                                                          |
| `theory-formal-verifier.read_result`                    | `job_id`                                                                                                                                                                                                                                                                  |
| `theory-runtime-canary.start`                           | `plan_id`; trusted single-use runtime approval is supplied through the gateway control envelope, not caller-authored tool args                                                                                                                                            |
| `theory-runtime-canary.read_result`                     | `job_id`; optional `poll_attempt` only drives bounded polling affordance identity                                                                                                                                                                                         |
| `theory-semantic-admitter.normalize`                    | `source_evidence_ref`, `source_packet`, `source_path`, `receipt_id`; the exact packet must be admitted from current-turn evidence, while catalog, registered-identity, and graph snapshots remain server-owned                                                            |
| `theory-artifact-producer.prepare_lanyon_request`       | `procedure_artifact_ref`, `procedure_id`, `procedure_sha256`, `semantic_admission_artifact_ref`, `case_id`; optional `claim_id` disambiguates multi-claim packets                                                                                                         |
| `theory-artifact-producer.admit_lanyon_snapshot`        | `request_artifact_ref`, `case_id`; the request must be the exact current-turn preparation artifact, and the source root remains exclusively server-owned                                                                                                                  |
| `theory-independent-numerical-verifier.prepare_request` | `catalog_entry_id`, `procedure_id`, `procedure_sha256`; the exact procedure must be admitted from current-turn evidence and match the trusted server enrollment, which owns request, policy, generation evidence, sandbox identity, and all source/build/executable paths |
| `theory-independent-numerical-verifier.plan`            | `prepared_request_id`; owner-bound opaque id returned by `prepare_request`                                                                                                                                                                                                |
| `theory-independent-numerical-verifier.start`           | `plan_id`; runtime confirmation required and the exact sealed packet is retrieved server-side                                                                                                                                                                             |
| `theory-independent-numerical-verifier.read_result`     | `job_id`                                                                                                                                                                                                                                                                  |
| `scientific-calculator.read_visible_theory_run_result`  | `request_id`, `receipt_id`                                                                                                                                                                                                                                                |
| `moral-graph.reflect_context`                           | `prompt`                                                                                                                                                                                                                                                                  |
| `text_to_speech.speak_text`                             | `text`                                                                                                                                                                                                                                                                    |
| `live_env.request_interim_voice_callout`                | `text`                                                                                                                                                                                                                                                                    |
| `live_env.narrator_say`                                 | `text`                                                                                                                                                                                                                                                                    |
| `situation-room.live-source.set_rate`                   | `cadence_ms`, `capture_mode`                                                                                                                                                                                                                                              |
| `com.casimirbot.minecraft.command.catalog`              | optional `query`, `path_prefix`, `limit`, `environment_label`                                                                                                                                                                                                             |
| `com.casimirbot.minecraft.command`                      | `command`, `category`, `effect`; optional `environment_label` only disambiguates multiple active command-enabled Minecraft environments                                                                                                                                  |

## Theory Procedure Readmission Boundary

`theory-experiment-procedure.readmit` is a developer-only, read-only
continuation capability. It accepts only the exact
`procedure_artifact_ref`/`procedure_id`/`procedure_sha256` triple from a
previously prepared procedure. The reference must be byte-for-byte equal to
the exact observation reference issued and retained by the preparation
gateway. A merely shape-valid or same-origin sibling reference, an alias, or a
reference from another origin turn fails closed.

The retained procedure is keyed to the exact account type, developer profile,
and session that prepared it. Retention is process-local for 24 hours, is
bounded to 256 entries, and does not survive a server restart or transfer to
another process. An expired, evicted, cross-owner, or unavailable entry returns
`retained_procedure_not_found`; it is never reconstructed from caller-authored
arguments.

Preparation without both a nonempty profile and session may still support
current-turn closure evaluation, but it is not retained or advertised for
cross-turn readmission. A readmission call without that owner context fails as
`procedure_owner_context_required`.

Successful readmission emits a fresh
`casimir.theory_experiment_procedure.observation.v1` for the current turn while
preserving the original procedure id and SHA. The capability is non-mutating,
requires no confirmation, and keeps `assistant_answer=false`,
`terminal_eligible=false`, and `post_tool_model_step_required=true`.

## Workstation Notes Read Boundary

`workstation-notes.list_notes` is a graduated read-only dynamic panel action.
It may list bounded note references from the Ask turn context snapshot or an
explicit redacted gateway argument. It must not expose note bodies or raw rich
text fields. The observation schema omits `body`, `content`, `html`, `text`,
and `markdown`, and keeps:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

Missing notes context blocks with `workstation_notes_context_missing`.
`workstation-notes.create_note` has a narrow Codex provider host-dispatch receipt
bridge for explicit affirmative create-note commands. It is still absent from
the shared gateway manifest and does not grant direct note mutation authority to
provider agents. The remaining mutating Workstation Notes actions stay held
back:

```txt
workstation-notes.append_to_note
workstation-notes.create
workstation-notes.open
```

## Explicit Route Contracts Not Yet Gateway Manifest IDs

`com.casimirbot.minecraft.container_contents.read` remains
`blocked_pending_contract`: its schema is available, but provider execution
requires a distinct owner-selected privileged container-read scope and exact
block/subject binding. Full Minecraft command authority does not silently grant
this typed sensor capability.

These Helix Ask route contract ids are classified so provider runtimes do not
silently miss them. They are not automatically provider-executable gateway
manifest ids. Some have shared gateway equivalents, but the explicit route name
itself must graduate through a bounded gateway alias/observation contract before
provider agents can call it directly. Shared aliases must carry the
machine-readable `provider_gateway_alias_target` field so tests can prove the
alias is not a separate manifest tool and the canonical target is a real gateway
capability.

The calculator route aliases `scientific-calculator.solve` and
`scientific-calculator.solve_with_steps` are admitted as bounded aliases onto
the canonical `scientific-calculator.solve_expression` gateway capability.
Their selected alias is preserved in `source_target_intent.alias_capability`;
execution, observation packets, model re-entry, and panel projection stay on
the canonical calculator solve path.

The docs-viewer route aliases `docs-viewer.search_docs`,
`docs-viewer.locate_in_doc`, `docs-viewer.summarize_doc`, and
`docs-viewer.doc_equation_context` are admitted as bounded aliases onto the
canonical `docs.search` gateway capability. The docs-viewer route aliases
`docs-viewer.open` and `docs-viewer.open_doc_by_path` are admitted as bounded
aliases onto the canonical `docs-viewer.open_doc` gateway receipt. Their
selected aliases are preserved in `source_target_intent.alias_capability`;
document content claims still require a materialized docs observation packet,
not a path or open-doc receipt alone.

The repo route alias `repo-code.search_concept` is admitted as a bounded alias
onto the canonical `repo.search` gateway capability. The internet route alias
`internet_search.web_research` is admitted as a bounded alias onto the canonical
`internet-search.search_web` gateway capability. The selected alias is preserved
in `source_target_intent.alias_capability`; provider-missing internet evidence
remains missing evidence, not proof.

The reflection route aliases `helix_ask.reflect_theory_context` and
`helix_ask.reflect_civilization_bounds` are admitted as bounded aliases onto
the canonical `theory-badge-graph.reflect_discussion_context` and
`civilization-bounds.reflect_system_bounds` gateway capabilities. The selected
alias is preserved in `source_target_intent.alias_capability`; reflections
remain diagnostic observations and are not proof or terminal authority.

`helix_ask.inspect_capability_catalog` is an exact shared gateway manifest
capability. It returns the current governed runtime capability records and
family prefixes as a nonterminal `helix.capability_catalog_observation.v1`
observation. The catalog is source-agnostic: conformed documents, scientific
evidence packets, theory graphs, and runtime receipts bind into capabilities
without creating paper-specific workbenches. A current-turn observation must
re-enter model reasoning before a `capability_help_summary` can become terminal.

```txt
runtime_evidence
debug.inspect_current_turn
helix_ask.reflect_workstation_tool_alignment
workspace-directory.resolve
helix.theory.frontierVectorFieldTrace
helix_ask.reflect_live_synthetic_data
helix_ask.reflect_context_attachments
helix_ask.reflect_ideology_context
helix_ask.bridge_theory_ideology_context
helix_ask.build_civilization_scenario_frame
docs-viewer.identify_current_doc
docs-viewer.validate_doc_candidates
```

These explicit side-effecting route contracts remain blocked pending permission,
confirmation, receipt, and projection contracts:

```txt
scientific-calculator.open
scientific-calculator.start_equation_live_source
workstation-notes.append_to_note
workstation-notes.create
workstation-notes.open
```

`workstation-notes.create_note` is the current exception: Codex Workstation Mode
may receive a structured `helix.workstation_ui_action_receipt.v1` plus
`helix.ask.action_envelope.v1` from the provider adapter when Helix admission
classifies the prompt as an explicit affirmative note-create command. It remains
outside the shared gateway manifest until broader confirmation, negative
admission, and projection tests promote it.

## Safe Next Read/Observe Candidates

Read-only live-environment queries remain the next graduation lane. The first
context-feed, live-source state, and situation/stage state subsets have been
graduated through the shared gateway. No read-only item remains in this lane at
the current catalog boundary:

```txt
none
```

## Context Feed Gateway Boundary

Graduated context feed queries are exposed through the shared provider gateway as
read-only observations by delegating to the existing live-environment tool
adapter:

```txt
live_env.query_trace_memory
live_env.query_narrator_events
live_env.query_audio_transcripts
live_env.query_visual_summaries
live_env.query_translation_segments
live_env.query_microdeck_outputs
live_env.query_live_answer_state
live_env.query_packet_traces
live_env.query_route_evidence
live_env.query_automation_policies
```

The gateway wraps the returned `helix.live_environment_tool_observation.v1`
envelope into a workstation observation packet. These observations remain
non-terminal and require model re-entry before any final answer.

## Live-Source State Gateway Boundary

Live-source state reads are exposed through the shared provider gateway as
read-only observations by delegating to the existing live-environment tool
adapter:

```txt
live_env.query_live_source_quality
live_env.query_workstation_goal_context
live_env.summarize_live_source_current_state
```

These observations remain non-terminal and require model re-entry before any
final answer. They cannot configure watches, process mail, repair sources, or
mutate loop state.

## Situation/Stage State Gateway Boundary

Situation/stage state reads are exposed through the shared provider gateway as
read-only observations by delegating to the existing live-environment tool
adapter:

```txt
live_env.query_event_log
live_env.query_world_events
live_env.query_navigation_state
live_env.query_stage_sources
live_env.query_constructs
live_env.query_job_evidence
```

These observations remain non-terminal and require model re-entry before any
final answer. They cannot configure route watches, plan stage jobs, enqueue
workers, process mail, or mutate live workstation state.

## Live-Source Mailbox Read Gateway Boundary

Live-source mailbox reads are exposed through the shared provider gateway as
read-only observations by delegating to the existing live-environment adapter:

```txt
live_env.check_live_source_mail
live_env.read_live_source_mail
live_env.read_processed_live_source_mail
live_env.reflect_live_source_mail_loop
```

These observations remain non-terminal and require model re-entry before any
final answer. They can report missing raw mail, missing processed packets,
mailbox thread resolution, or loop reflection state. They cannot process new
mail, record mailbox decisions, configure watch jobs, or substitute
`live_env.process_live_source_mail` as a provider gateway fallback.

## Interpreter/Prediction Read Gateway Boundary

Interpreter and prediction evidence reads are exposed through the shared
provider gateway as read-only observations by delegating to the existing
live-environment adapter:

```txt
live_env.compare_mail_to_interpreter_profile
live_env.validate_live_source_prediction
live_env.predict_live_source_immediate
live_env.compare_live_source_prediction
```

These observations remain non-terminal and require model re-entry before any
final answer. They can report missing profile/mail state, prediction support or
contradiction, immediate prediction evidence, and prior-prediction comparison.
They cannot configure route watches or interpreter profiles, record mailbox
decisions, update immersion state, or project/persist live-source narrative
state.

## Stage Play Builder Read Gateway Boundary

Stage Play builder read/evaluation tools are exposed through the shared provider
gateway as read-only observations by delegating to the existing live-environment
adapter:

```txt
live_env.describe_stage_builder
live_env.validate_stage_play_graph
live_env.plan_stage_play_job
```

These observations remain non-terminal and require model re-entry before any
final answer. They can describe grammar, validate a supplied draft, or produce a
bounded job plan. They cannot queue checkpoint requests, update Live Answer
projection lines, process mail, or substitute `live_env.reflect_stage_play_context`
or `live_env.read_card` as provider gateway calls.

## Source Health Gateway Boundary

Source and loop health reads are exposed through the shared provider gateway as
read-only observations by delegating to the existing live-environment adapter:

```txt
live_env.query_source_health
live_env.query_live_source_loop_health
```

These tools may report missing policy/profile/source state and may suggest next
useful tools in their observation payloads. Those suggestions are evidence only:
they must not execute repair/configuration controls and must not become final
answer authority without a subsequent model/solver step.

## Micro-Reasoner Gateway Boundary

The following MicroDeck/micro-reasoner capabilities are exposed through the
shared provider gateway as read-only or dry-run observations:

```txt
live_env.query_micro_reasoner_presets
live_env.query_micro_reasoner_prompts
live_env.test_micro_reasoner_prompt
```

They delegate to the existing live-environment adapter and return
`helix.live_environment_tool_observation.v1` envelopes. `test_micro_reasoner_prompt`
is a dry-run/evaluation observation and must not activate or update a prompt.

Held-back micro-reasoner capabilities:

```txt
live_env.draft_micro_reasoner_preset
live_env.route_micro_reasoner_prompt
live_env.apply_micro_reasoner_preset
live_env.create_micro_reasoner_preset
live_env.update_micro_reasoner_prompt
```

These remain unavailable to provider agents until separate permission and
mutation/receipt contracts exist.

## Visual Observer Gateway Boundary

The following visual observer capabilities are exposed through the shared
provider gateway as read-only or dry-run observations:

```txt
live_env.query_visual_observer_profiles
live_env.test_visual_observer_profile
live_env.compare_visual_observer_profiles
```

They delegate to the existing live-environment adapter and return
`helix.live_environment_tool_observation.v1` envelopes. `test_*` and
`compare_*` are dry-run/evaluation observations: they must not configure/apply
profiles, request replay, capture frames, enqueue mail, or become final answer
authority without model re-entry.

Held-back visual observer capabilities:

```txt
live_env.configure_visual_observer_profile
live_env.apply_visual_observer_profile
live_env.request_visual_action_replay
```

These remain unavailable to provider agents until separate permission,
client-mediated replay, mutation, and receipt contracts exist.

## Voice Gateway Boundary

Voice is a side-effecting output channel. It is now exposed through the shared
provider gateway only as a structured request/receipt observation for host-side
projection. It must not be treated as equivalent to the client `Read aloud`
button and must not be inferred from final prose.

Shared voice capabilities:

```txt
text_to_speech.speak_text
live_env.request_interim_voice_callout
live_env.narrator_say
```

`text_to_speech.speak_text` is the canonical provider-facing TTS lane. It
wraps the same voice delivery receipt machinery as the existing live-env voice
tools while preserving `assistant_answer=false`, `terminal_eligible=false`, and
client-playback confirmation requirements.

Voice-adjacent Helix-native capabilities that are not provider gateway tools:

```txt
live_env.record_voice_steering
narrator.say
narrator_say
```

The shared voice gateway contract requires:

```txt
explicit affirmative command admission
confirmation or playback permission policy
structured request/receipt observation
negative quoted/negated/contextual admission tests
host-side projection without final-prose scraping
```

Current gateway behavior:

- A valid voice request returns `helix.interim_voice_callout_tool_result.v1`.
- The observation contains `request`, `receipt`, and `host_projection`.
- The receipt is non-terminal and model re-entry is still required.
- Browser playback outcomes post back to
  `/api/helix/live-environment/voice-playback/outcome` and become evidence-only
  server receipts such as delivered/client-confirmed or failed.
- `requires_confirmation=true` returns a blocked policy receipt rather than
  speaking.
- Missing text returns a blocked missing-text receipt.

Blocked voice-related stream capabilities:

```txt
live_env.narrator_bind_stream
narrator.bind_stream
narrator_bind_stream
```

These require a stronger stream lifecycle and permission contract than one-shot
voice callout.

## Side-Effecting Evidence/Projection Tools

These live-environment capabilities are not provider gateway tools yet. They may
look like evidence reads, but their current adapters can write receipts,
goal-context updates, interpreted events, checkpoints, or Live Answer projection
state. Provider graduation requires an explicit side-effect receipt contract,
negative quoted/negated admission tests, and terminal-authority tests:

```txt
live_env.read_card
live_env.reflect_stage_play_context
live_env.request_probe
live_env.record_commentary
live_env.evaluate_goal_satisfaction
```

Important current adapter behavior:

- `live_env.read_card` can record a goal-context update and panel dispatch
  suggestions while reading Live Answer projection lines.
- `live_env.reflect_stage_play_context` can ensure a Live Answer environment
  and project Live Interpretation lane updates.
- `live_env.request_probe` appends an interpreted event.
- `live_env.record_commentary` records live-environment commentary.
- `live_env.evaluate_goal_satisfaction` records a goal-context update and can
  checkpoint an agent goal session.

These receipts remain observations, not final answers. Until a provider contract
defines permission, receipt, and re-entry behavior, provider agents must not
execute them.

## Helix Native Only

These live-environment capabilities remain Helix-owned until provider gateway
contracts define bounded observations, route authority, and projection behavior:

```txt
live_env.process_live_source_mail
live_env.draft_stage_play_graph
live_env.request_stage_play_checkpoint
live_env.draft_micro_reasoner_preset
live_env.route_micro_reasoner_prompt
live_env.apply_micro_reasoner_preset
live_env.create_micro_reasoner_preset
live_env.update_micro_reasoner_prompt
live_env.configure_visual_observer_profile
live_env.apply_visual_observer_profile
live_env.request_visual_action_replay
live_env.project_live_source_narrative
live_env.update_live_source_immersion_state
live_env.record_live_source_mail_decision
```

## Blocked Pending Contract

These are mutating/control capabilities. They must fail closed for provider
agents until explicit permission, confirmation, receipt, and negative-admission
tests exist:

```txt
live_pipeline
live_env.start_agent_goal_session
live_env.change_workstation_preset
live_env.set_visual_preset
live_env.set_audio_preset
live_env.bind_workstation_source
live_env.unbind_workstation_source
live_env.pause_workstation_loop
live_env.resume_workstation_loop
live_env.set_workstation_loop_state
live_env.repair_loop
live_env.repair_workstation_source
live_env.update_live_answer_projection
live_env.focus_process_graph
live_env.configure_route_watch
live_env.configure_live_source_watch_job
live_env.configure_interpreter_profile
live_env.spawn_field_worker
```

Provider admission tests assert that affirmative prompt mentions of these
capabilities do not create Codex/provider workstation gateway requests. Catalog
tests also assert that they remain absent from the shared provider gateway
manifest while retaining explicit `blocked_pending_contract` classifications.

## Dynamic Panel Actions

The workstation dynamic action catalog is panel-owned, not provider-gateway
owned. Dynamic actions can become provider capabilities only after they receive
explicit contracts matching the shared lifecycle.

Rules:

- Retired `situation-room-*` actions are `legacy_dynamic_panel_only`.
- Confirmed or medium/high-risk actions are `requires_confirmation_contract`.
- Other active dynamic actions are `blocked_pending_contract` until promoted.
- A dynamic action being visible in a panel manifest does not mean Codex or any
  provider agent can execute it.
- Graduated exceptions are explicit and narrow: `workstation-notes.list_notes`
  provides body-redacted note metadata, and
  `account_session.set_interface_language` dispatches only the existing
  Account & Sessions interface-language preference action for supported codes.

The classification test covers active and retired dynamic action lists from:

```txt
shared/workstation-dynamic-tools.ts
```

Current dynamic action surfaces:

```txt
account-session.open
account-session.set_interface_language
agi-essence-console.open
agi-task-history.open
docs-viewer.explain_paper
docs-viewer.identify_current_doc
docs-viewer.locate_in_doc
docs-viewer.open
docs-viewer.open_directory
docs-viewer.open_doc
docs-viewer.open_doc_and_read
docs-viewer.open_doc_by_path
docs-viewer.open_latest_doc_by_topic
docs-viewer.search_docs
docs-viewer.summarize_doc
docs-viewer.summarize_section
docs-viewer.validate_doc_candidates
docs-viewer.verify_active_doc
document-image-lens.image_lens.focus_regions
document-image-lens.open
image-lens.image_lens.focus_regions
image-lens.open
live-answer-environment.image_lens.focus_regions
scientific-calculator.emit_live_tick
scientific-calculator.ingest_latex
scientific-calculator.open
scientific-calculator.restart_live_source
scientific-calculator.solve_expression
scientific-calculator.solve_with_steps
scientific-calculator.start_equation_live_source
scientific-calculator.start_prime_stream
scientific-calculator.stop_live_source
situation-room-pipelines.add_node
situation-room-pipelines.archive_categorization_session
situation-room-pipelines.attach_graph_to_helix_ask
situation-room-pipelines.attach_job_to_helix_ask
situation-room-pipelines.attach_live_source
situation-room-pipelines.attach_pipeline_to_live_answer_environment
situation-room-pipelines.attach_standby_to_helix_thread
situation-room-pipelines.callout_policy.set_mode
situation-room-pipelines.connect_nodes
situation-room-pipelines.construct.activate
situation-room-pipelines.construct.attach_source
situation-room-pipelines.construct.bind_output
situation-room-pipelines.construct.create_from_recipe
situation-room-pipelines.construct.detach
situation-room-pipelines.construct.explain
situation-room-pipelines.construct.list_recipes
situation-room-pipelines.construct.query
situation-room-pipelines.construct.set_operating_prompt
situation-room-pipelines.create_graph
situation-room-pipelines.create_graph_from_recipe
situation-room-pipelines.create_job
situation-room-pipelines.create_live_answer_environment
situation-room-pipelines.create_live_workstation_pipeline
situation-room-pipelines.create_translation_pair
situation-room-pipelines.dottie.manifest
situation-room-pipelines.episode_timeline.summarize_window
situation-room-pipelines.goal.evaluate
situation-room-pipelines.goal_ledger.mark_blocked
situation-room-pipelines.goal_ledger.mark_complete
situation-room-pipelines.goal_ledger.set_objective
situation-room-pipelines.interjection_investigator.review_latest
situation-room-pipelines.live-source.set_rate
situation-room-pipelines.live_continuation.pause
situation-room-pipelines.live_continuation.query
situation-room-pipelines.live_continuation.resume
situation-room-pipelines.live_continuation.start
situation-room-pipelines.live_continuation.stop
situation-room-pipelines.live_continuation.tick
situation-room-pipelines.mission_memory.refresh
situation-room-pipelines.observer.attach
situation-room-pipelines.observer.detach
situation-room-pipelines.observer.query
situation-room-pipelines.open
situation-room-pipelines.pause_categorization_job
situation-room-pipelines.pause_live_answer_environment
situation-room-pipelines.pause_live_source
situation-room-pipelines.pause_live_workstation_pipeline
situation-room-pipelines.query_categorization_job
situation-room-pipelines.query_event_window
situation-room-pipelines.query_synthetic_evidence
situation-room-pipelines.request_agentic_review
situation-room-pipelines.resume_categorization_job
situation-room-pipelines.resume_live_answer_environment
situation-room-pipelines.resume_live_source
situation-room-pipelines.resume_live_workstation_pipeline
situation-room-pipelines.run_job
situation-room-pipelines.save_job_as_note
situation-room-pipelines.set_companion_policy
situation-room-pipelines.set_live_answer_line_schema
situation-room-pipelines.set_live_commentary_policy
situation-room-pipelines.set_live_line_schema
situation-room-pipelines.set_live_source_tick_rate
situation-room-pipelines.set_pipeline_sink
situation-room-pipelines.set_pipeline_transform
situation-room-pipelines.setup_from_prompt
situation-room-pipelines.situation_context.attach_to_ask
situation-room-pipelines.source_health.query
situation-room-pipelines.start_categorization_job
situation-room-pipelines.start_situation_goal_session
situation-room-pipelines.stop_categorization_job
situation-room-pipelines.stop_job
situation-room-pipelines.stop_live_answer_environment
situation-room-pipelines.stop_live_source
situation-room-pipelines.stop_live_workstation_pipeline
situation-room-pipelines.visual-source.align_latest_with_event_window
situation-room-pipelines.visual-source.analyze_latest_frame
situation-room-pipelines.visual-source.capture_frame_now
situation-room-pipelines.visual-source.pause
situation-room-pipelines.visual-source.resume
situation-room-pipelines.visual-source.set_cadence
situation-room-pipelines.visual-source.start_capture
situation-room-pipelines.visual-source.stop
situation-room-pipelines.voice_delivery.confirm_speak
situation-room-pipelines.voice_delivery.propose_from_trace
situation-room-pipelines.worker_lane.run
situation-room-sources.attach_display_audio_source
situation-room-sources.attach_mic_audio_source
situation-room-sources.attach_room_to_helix_ask
situation-room-sources.open
situation-room-sources.save_room_as_note
situation-room-sources.stop_room
workstation-clipboard-history.clear_history
workstation-clipboard-history.copy_receipt_to_clipboard
workstation-clipboard-history.copy_receipt_to_note
workstation-clipboard-history.copy_selection_to_note
workstation-clipboard-history.open
workstation-clipboard-history.read_clipboard
workstation-clipboard-history.write_clipboard
workstation-notes.append_live_note_chunk
workstation-notes.append_to_note
workstation-notes.create_live_note_sink
workstation-notes.create_note
workstation-notes.delete_note
workstation-notes.list_notes
workstation-notes.open
workstation-notes.rename_note
workstation-notes.set_active_note
workstation-process-graph.clear_historical
workstation-process-graph.export_svg
workstation-process-graph.filter_view
workstation-process-graph.focus_node
workstation-process-graph.get_context_pack
workstation-process-graph.get_snapshot
workstation-process-graph.open
workstation-process-graph.query_snapshot
workstation-storage-map.open
workstation-task-manager.open
workstation-workflow-timeline.open
```

Canonical provider classification ids for the same dynamic actions:

```txt
account_session.open
account_session.set_interface_language
agi_essence_console.open
agi_task_history.open
docs_viewer.explain_paper
docs_viewer.identify_current_doc
docs_viewer.locate_in_doc
docs_viewer.open
docs_viewer.open_directory
docs_viewer.open_doc
docs_viewer.open_doc_and_read
docs_viewer.open_doc_by_path
docs_viewer.open_latest_doc_by_topic
docs_viewer.search_docs
docs_viewer.summarize_doc
docs_viewer.summarize_section
docs_viewer.validate_doc_candidates
docs_viewer.verify_active_doc
document_image_lens.image_lens_focus_regions
document_image_lens.open
image_lens.image_lens_focus_regions
image_lens.open
live_answer_environment.image_lens_focus_regions
scientific_calculator.emit_live_tick
scientific_calculator.ingest_latex
scientific_calculator.open
scientific_calculator.restart_live_source
scientific_calculator.solve_expression
scientific_calculator.solve_with_steps
scientific_calculator.start_equation_live_source
scientific_calculator.start_prime_stream
scientific_calculator.stop_live_source
situation_room_pipelines.add_node
situation_room_pipelines.archive_categorization_session
situation_room_pipelines.attach_graph_to_helix_ask
situation_room_pipelines.attach_job_to_helix_ask
situation_room_pipelines.attach_live_source
situation_room_pipelines.attach_pipeline_to_live_answer_environment
situation_room_pipelines.attach_standby_to_helix_thread
situation_room_pipelines.callout_policy_set_mode
situation_room_pipelines.connect_nodes
situation_room_pipelines.construct_activate
situation_room_pipelines.construct_attach_source
situation_room_pipelines.construct_bind_output
situation_room_pipelines.construct_create_from_recipe
situation_room_pipelines.construct_detach
situation_room_pipelines.construct_explain
situation_room_pipelines.construct_list_recipes
situation_room_pipelines.construct_query
situation_room_pipelines.construct_set_operating_prompt
situation_room_pipelines.create_graph
situation_room_pipelines.create_graph_from_recipe
situation_room_pipelines.create_job
situation_room_pipelines.create_live_answer_environment
situation_room_pipelines.create_live_workstation_pipeline
situation_room_pipelines.create_translation_pair
situation_room_pipelines.dottie_manifest
situation_room_pipelines.episode_timeline_summarize_window
situation_room_pipelines.goal_evaluate
situation_room_pipelines.goal_ledger_mark_blocked
situation_room_pipelines.goal_ledger_mark_complete
situation_room_pipelines.goal_ledger_set_objective
situation_room_pipelines.interjection_investigator_review_latest
situation_room_pipelines.live_continuation_pause
situation_room_pipelines.live_continuation_query
situation_room_pipelines.live_continuation_resume
situation_room_pipelines.live_continuation_start
situation_room_pipelines.live_continuation_stop
situation_room_pipelines.live_continuation_tick
situation_room_pipelines.live_source_set_rate
situation_room_pipelines.mission_memory_refresh
situation_room_pipelines.observer_attach
situation_room_pipelines.observer_detach
situation_room_pipelines.observer_query
situation_room_pipelines.open
situation_room_pipelines.pause_categorization_job
situation_room_pipelines.pause_live_answer_environment
situation_room_pipelines.pause_live_source
situation_room_pipelines.pause_live_workstation_pipeline
situation_room_pipelines.query_categorization_job
situation_room_pipelines.query_event_window
situation_room_pipelines.query_synthetic_evidence
situation_room_pipelines.request_agentic_review
situation_room_pipelines.resume_categorization_job
situation_room_pipelines.resume_live_answer_environment
situation_room_pipelines.resume_live_source
situation_room_pipelines.resume_live_workstation_pipeline
situation_room_pipelines.run_job
situation_room_pipelines.save_job_as_note
situation_room_pipelines.set_companion_policy
situation_room_pipelines.set_live_answer_line_schema
situation_room_pipelines.set_live_commentary_policy
situation_room_pipelines.set_live_line_schema
situation_room_pipelines.set_live_source_tick_rate
situation_room_pipelines.set_pipeline_sink
situation_room_pipelines.set_pipeline_transform
situation_room_pipelines.setup_from_prompt
situation_room_pipelines.situation_context_attach_to_ask
situation_room_pipelines.source_health_query
situation_room_pipelines.start_categorization_job
situation_room_pipelines.start_situation_goal_session
situation_room_pipelines.stop_categorization_job
situation_room_pipelines.stop_job
situation_room_pipelines.stop_live_answer_environment
situation_room_pipelines.stop_live_source
situation_room_pipelines.stop_live_workstation_pipeline
situation_room_pipelines.visual_source_align_latest_with_event_window
situation_room_pipelines.visual_source_analyze_latest_frame
situation_room_pipelines.visual_source_capture_frame_now
situation_room_pipelines.visual_source_pause
situation_room_pipelines.visual_source_resume
situation_room_pipelines.visual_source_set_cadence
situation_room_pipelines.visual_source_start_capture
situation_room_pipelines.visual_source_stop
situation_room_pipelines.voice_delivery_confirm_speak
situation_room_pipelines.voice_delivery_propose_from_trace
situation_room_pipelines.worker_lane_run
situation_room_sources.attach_display_audio_source
situation_room_sources.attach_mic_audio_source
situation_room_sources.attach_room_to_helix_ask
situation_room_sources.open
situation_room_sources.save_room_as_note
situation_room_sources.stop_room
workstation_clipboard_history.clear_history
workstation_clipboard_history.copy_receipt_to_clipboard
workstation_clipboard_history.copy_receipt_to_note
workstation_clipboard_history.copy_selection_to_note
workstation_clipboard_history.open
workstation_clipboard_history.read_clipboard
workstation_clipboard_history.write_clipboard
workstation_notes.append_live_note_chunk
workstation_notes.append_to_note
workstation_notes.create_live_note_sink
workstation_notes.create_note
workstation_notes.delete_note
workstation_notes.list_notes
workstation_notes.open
workstation_notes.rename_note
workstation_notes.set_active_note
workstation_process_graph.clear_historical
workstation_process_graph.export_svg
workstation_process_graph.filter_view
workstation_process_graph.focus_node
workstation_process_graph.get_context_pack
workstation_process_graph.get_snapshot
workstation_process_graph.open
workstation_process_graph.query_snapshot
workstation_storage_map.open
workstation_task_manager.open
workstation_workflow_timeline.open
```

## Client Projection Only

Client playback such as `Read aloud` is a UI affordance:

```txt
client.read_aloud
```

It is not an agent capability. It must not be used as evidence that a provider
voice tool exists or ran.

## Required Tests Before Graduation

Every provider-capability graduation must add or update:

```txt
provider capability catalog diff/classification test
admission positive test
quoted/negated/contextual negative tests
observation or receipt schema test
model re-entry/debug trace test
UI projection test when user-visible
```

Recommended commands:

```bash
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts --pool=forks
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts --pool=forks
npm run helix:ask:discipline:quick
git diff --check
```

Live validation must use the normal keyed server. Codex Desktop may start or
restart it only through an explicitly authorized configured opaque
`start-myapp-for-codex` launcher; an ad hoc agent-shell server is prohibited.
