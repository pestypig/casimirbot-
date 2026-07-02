# Helix Ask Workstation Tool Contracts

Status: working-draft contract index.

These contracts describe the shared workstation gateway lifecycle that both
Helix Native and Codex Workstation Mode must preserve when a tool or panel
capability participates in an Ask turn.

They are intentionally not runtime prompts. They are development contracts for
future tool, reflection, and panel patches.

For provider-wide catalog availability, graduation order, and Helix-only versus
Codex/provider gateway classification, also read:

- [Helix Ask Provider Capability Contracts](../../helix-ask-provider-capability-contracts.md)

## Maturity Labels

| Label | Meaning |
| --- | --- |
| `draft` | Matches the current intended gateway lifecycle, but still needs broader UI/API validation. |
| `candidate` | Covered by deterministic API tests and at least one live UI smoke for the named capability. |
| `stable` | Covered by API matrix, UI projection validation, negative admission tests, debug export parity, and panel projection tests where applicable. |

Do not promote a contract because the final prose looked good. Promotion
requires structured evidence: request, admission, execution, observation packet,
model re-entry, terminal authority, and visible/debug projection for the same
turn id.

## Shared Lifecycle

Every workstation tool contract follows this loop:

```txt
prompt + workstation context
-> requested capability intent
-> Helix admission or block
-> gateway capability execution
-> observation packet or action receipt
-> evidence re-entry
-> runtime/provider final candidate
-> Helix terminal authority
-> visible trace and debug export projection
```

The gateway output is never answer authority by itself. Receipts and
observations must carry:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

## Typed Affordance Handoff

Workstation observations may participate in compound reasoning by declaring
typed affordances. The declaration is a routing and debug contract only; it does
not make a receipt terminal.

Required handoff fields:

```txt
produces_affordances
consumes_affordances
typed_handoff_role
produced_affordances
consumed_affordances
typed_handoff_contract
```

Common affordance kinds include:

```txt
source_ref
text_evidence
citation_evidence
numeric_value_evidence
theory_context
calculator_expression_template
claim_boundary
frontier_candidate
active_surface_ref
bound_calculator_expression
calculator_result
```

Consumer tools must declare required input affordance kinds. Runtime binding may
materialize dependent calls only when the upstream observations satisfy those
requirements. Missing required bindings fail closed with typed diagnostics and
remain visible in debug export and UI trace.

The calculator handoff contract is intentionally strict:

```txt
theory-badge-graph.reflect_discussion_context
  produces calculator_expression_template
research/docs observations
  produce numeric_value_evidence with units and source refs
typed binder
  produces bound_calculator_expression only after all variables are bound
scientific-calculator.solve_expression
  consumes the numeric substituted expression
```

The Scientific Calculator must not solve badge templates containing unresolved
symbols. If a variable is missing, the compound rail records
`missing_variables`, the rejected template, selected affordances, and a blocked
rail status instead of hallucinating a solve.

## Formula-Bound Scholarly Validation

For Codex Workstation Mode, the theory-to-scholar-to-calculator workflow is
validated as an evidence chain, not as a tool-authored answer. A live/debug turn
that asks for cited numerics for a prior Theory Badge Graph formula must expose
these structured fields before any final answer is trusted:

```txt
prior_theory_formula_context
variable_source_plan
source_requirement_plan
scholarly_variable_source_query_plan
lookup_relevance_gate, scholarly_full_text_recovery_affordance, or scholarly_numeric_recovery_affordance
provider_reasoning_reentry
provider_terminal_authority_candidate_review
```

The canonical regression fixture is the fusion-adjacent theory formula:

```txt
rate_proxy_m3_s = n1_m3 * n2_m3 * sigma_m2 * v_m_s
```

The follow-up prompt may say "these equations", but the planner must bind that
deictic reference to the prior formula context and then map variables to
physical source classes. The scholarly query must search for source classes
such as reactant density, fusion cross section, relative velocity, or
Maxwellian-averaged reactivity. It must not rely on literal placeholder names
such as `n1_m3` alone.

If lookup results are irrelevant, the lookup observation should block dependent
full-text fetch and emit `scholarly_lookup_recovery_affordance` with rejected
paper reasons and narrower recovery queries. If lookup results are plausible
but the selected paper identity has no fetchable DOI, arXiv id, PDF URL, or
full-text URL, the full-text observation should emit
`scholarly_full_text_recovery_affordance` and return to Codex for a narrower
fetchable-source query. If numeric extraction cannot bind every requested
variable with citation and unit evidence, the numeric observation should emit
`scholarly_numeric_recovery_affordance` and the compound rail should block the
calculator with `missing_numeric_value_evidence`.

A calculator call is valid only when the debug trace contains a
`bound_calculator_expression` whose variables were replaced by cited,
unit-bearing `numeric_value_evidence`. Otherwise the expected terminal product
is Codex's post-reentry explanation of the mismatch or next research step.

After a keyed-server live run, the debug export can be checked with:

```bash
npm run helix:ask:formula-debug-audit -- --turn-id <turn-id> --strict
```

Use `--base-url` when the keyed server is not on `http://127.0.0.1:1498`, or
`--file <debug-export.json>` to audit a saved debug payload.

## Authority Rules

- Tool names in prompt text are constraints or requests, not execution.
- Contextual, negated, historical, future, quoted, and screen-visible tool names
  must not execute the capability unless the prompt is an affirmative operator
  request admitted by Helix.
- A provider may mention that a tool ran only when a matching observation packet
  exists for the same turn.
- UI projection metadata must come from structured tool outputs, not final prose
  scraping.
- Panel actions are host affordances beside the answer. They do not shape the
  provider's final prose and do not become answer authority.
- Missing providers, missing args, blocked queries, and empty results are
  observations or typed failures, not proof.

## Contract Template

Each capability contract should define:

- capability id
- maturity
- owner surface or panel
- permission profile
- admitted inputs
- blocked inputs
- observation schema and required fields
- host projection metadata, if any
- expected visible trace rows
- debug export fields
- negative admission cases
- tests required for `candidate` and `stable`
- implementation anchors

## Current Draft Contracts

| Capability | Contract | Maturity |
| --- | --- | --- |
| `workspace_os.status` | [workspace_os.status.md](workspace_os.status.md) | `draft` |
| `workstation.active_context` | [workstation.active_context.md](workstation.active_context.md) | `draft` |
| `scientific-calculator.solve_expression` | [scientific-calculator.solve_expression.md](scientific-calculator.solve_expression.md) | `candidate` |
| `scientific-calculator.active_context` | [scientific-calculator.active_context.md](scientific-calculator.active_context.md) | `draft` |
| `workstation.readable_surface.observe` | [workstation.readable_surface.observe.md](workstation.readable_surface.observe.md) | `draft` |
| `docs-viewer.read_visible_surface` | [workstation.readable_surface.observe.md](workstation.readable_surface.observe.md) | `draft` |
| `docs-viewer.read_active_translation` | [workstation.readable_surface.observe.md](workstation.readable_surface.observe.md) | `draft` |
| `scientific-calculator.read_visible_result` | [workstation.readable_surface.observe.md](workstation.readable_surface.observe.md) | `draft` |
| `scientific-calculator.open_panel` | [workstation.panel_actions.md](workstation.panel_actions.md) | `draft` |
| `scientific-calculator.focus_panel` | [workstation.panel_actions.md](workstation.panel_actions.md) | `draft` |
| `scientific-calculator.show_gateway_solve` | [workstation.panel_actions.md](workstation.panel_actions.md) | `draft` |
| `workstation.open_panel` | [workstation.panel_actions.md](workstation.panel_actions.md) | `draft` |
| `workstation.focus_panel` | [workstation.panel_actions.md](workstation.panel_actions.md) | `draft` |
| `docs-viewer.open_doc` | [docs-viewer.open_doc.md](docs-viewer.open_doc.md) | `draft` |
| `docs.search` | [docs.search.md](docs.search.md) | `draft` |
| `repo.search` | [repo.search.md](repo.search.md) | `draft` |
| `theory-badge-graph.reflect_discussion_context` | [theory-badge-graph.reflect_discussion_context.md](theory-badge-graph.reflect_discussion_context.md) | `candidate` |
| `theory-badge-graph.propose_frontier_conjectures` | [theory-badge-graph.propose_frontier_conjectures.md](theory-badge-graph.propose_frontier_conjectures.md) | `draft` |
| `civilization-bounds.reflect_system_bounds` | [civilization-bounds.reflect_system_bounds.md](civilization-bounds.reflect_system_bounds.md) | `candidate` |
| `scholarly-research.lookup_papers` | [scholarly-research.lookup_papers.md](scholarly-research.lookup_papers.md) | `draft` |
| `scholarly-research.fetch_full_text` | [scholarly-research.fetch_full_text.md](scholarly-research.fetch_full_text.md) | `draft` |
| `scholarly-research.extract_numeric_parameters` | [scholarly-research.extract_numeric_parameters.md](scholarly-research.extract_numeric_parameters.md) | `draft` |
| `internet-search.search_web` | [internet-search.search_web.md](internet-search.search_web.md) | `draft` |
| `live_env.request_interim_voice_callout` | [live_env.request_interim_voice_callout.md](live_env.request_interim_voice_callout.md) | `draft` |
| `live_env.narrator_say` | [live_env.narrator_say.md](live_env.narrator_say.md) | `draft` |
| `live_env.query_trace_memory` | [live_env.context_feed_queries.md](live_env.context_feed_queries.md) | `draft` |
| `live_env.query_narrator_events` | [live_env.context_feed_queries.md](live_env.context_feed_queries.md) | `draft` |
| `live_env.query_audio_transcripts` | [live_env.context_feed_queries.md](live_env.context_feed_queries.md) | `draft` |
| `live_env.query_visual_summaries` | [live_env.context_feed_queries.md](live_env.context_feed_queries.md) | `draft` |
| `live_env.query_translation_segments` | [live_env.context_feed_queries.md](live_env.context_feed_queries.md) | `draft` |
| `live_env.query_microdeck_outputs` | [live_env.context_feed_queries.md](live_env.context_feed_queries.md) | `draft` |
| `live_env.query_live_answer_state` | [live_env.context_feed_queries.md](live_env.context_feed_queries.md) | `draft` |
| `live_env.query_packet_traces` | [live_env.context_feed_queries.md](live_env.context_feed_queries.md) | `draft` |
| `live_env.query_route_evidence` | [live_env.context_feed_queries.md](live_env.context_feed_queries.md) | `draft` |
| `live_env.query_automation_policies` | [live_env.context_feed_queries.md](live_env.context_feed_queries.md) | `draft` |
| `live_env.query_source_health` | [live_env.context_feed_queries.md](live_env.context_feed_queries.md) | `draft` |
| `live_env.query_live_source_loop_health` | [live_env.query_live_source_loop_health.md](live_env.query_live_source_loop_health.md) | `draft` |
| `live_env.query_live_source_quality` | [live_env.live_source_state_reads.md](live_env.live_source_state_reads.md) | `draft` |
| `live_env.query_workstation_goal_context` | [live_env.live_source_state_reads.md](live_env.live_source_state_reads.md) | `draft` |
| `live_env.summarize_live_source_current_state` | [live_env.live_source_state_reads.md](live_env.live_source_state_reads.md) | `draft` |
| `live_env.query_event_log` | [live_env.situation_stage_state_reads.md](live_env.situation_stage_state_reads.md) | `draft` |
| `live_env.query_world_events` | [live_env.situation_stage_state_reads.md](live_env.situation_stage_state_reads.md) | `draft` |
| `live_env.query_navigation_state` | [live_env.situation_stage_state_reads.md](live_env.situation_stage_state_reads.md) | `draft` |
| `live_env.query_stage_sources` | [live_env.situation_stage_state_reads.md](live_env.situation_stage_state_reads.md) | `draft` |
| `live_env.query_constructs` | [live_env.situation_stage_state_reads.md](live_env.situation_stage_state_reads.md) | `draft` |
| `live_env.query_job_evidence` | [live_env.situation_stage_state_reads.md](live_env.situation_stage_state_reads.md) | `draft` |
| `live_env.check_live_source_mail` | [live_env.live_source_mailbox_reads.md](live_env.live_source_mailbox_reads.md) | `draft` |
| `live_env.read_live_source_mail` | [live_env.live_source_mailbox_reads.md](live_env.live_source_mailbox_reads.md) | `draft` |
| `live_env.read_processed_live_source_mail` | [live_env.live_source_mailbox_reads.md](live_env.live_source_mailbox_reads.md) | `draft` |
| `live_env.reflect_live_source_mail_loop` | [live_env.live_source_mailbox_reads.md](live_env.live_source_mailbox_reads.md) | `draft` |
| `live_env.compare_mail_to_interpreter_profile` | [live_env.interpreter_prediction_reads.md](live_env.interpreter_prediction_reads.md) | `draft` |
| `live_env.validate_live_source_prediction` | [live_env.interpreter_prediction_reads.md](live_env.interpreter_prediction_reads.md) | `draft` |
| `live_env.predict_live_source_immediate` | [live_env.interpreter_prediction_reads.md](live_env.interpreter_prediction_reads.md) | `draft` |
| `live_env.compare_live_source_prediction` | [live_env.interpreter_prediction_reads.md](live_env.interpreter_prediction_reads.md) | `draft` |
| `live_env.describe_stage_builder` | [live_env.stage_play_builder_reads.md](live_env.stage_play_builder_reads.md) | `draft` |
| `live_env.validate_stage_play_graph` | [live_env.stage_play_builder_reads.md](live_env.stage_play_builder_reads.md) | `draft` |
| `live_env.plan_stage_play_job` | [live_env.stage_play_builder_reads.md](live_env.stage_play_builder_reads.md) | `draft` |
| `live_env.query_micro_reasoner_presets` | [live_env.micro_reasoner_read_tools.md](live_env.micro_reasoner_read_tools.md) | `draft` |
| `live_env.query_micro_reasoner_prompts` | [live_env.micro_reasoner_read_tools.md](live_env.micro_reasoner_read_tools.md) | `draft` |
| `live_env.test_micro_reasoner_prompt` | [live_env.micro_reasoner_read_tools.md](live_env.micro_reasoner_read_tools.md) | `draft` |
| `live_env.query_visual_observer_profiles` | [live_env.visual_observer_read_tools.md](live_env.visual_observer_read_tools.md) | `draft` |
| `live_env.test_visual_observer_profile` | [live_env.visual_observer_read_tools.md](live_env.visual_observer_read_tools.md) | `draft` |
| `live_env.compare_visual_observer_profiles` | [live_env.visual_observer_read_tools.md](live_env.visual_observer_read_tools.md) | `draft` |

## Held-Back Contract Boundaries

These capabilities have reusable contract notes, but they are not provider
gateway tools yet. They stay absent from the Codex/provider gateway until a
permission, receipt, re-entry, and projection contract is implemented and
tested.

| Capability | Contract | Status |
| --- | --- | --- |
| `live_env.read_card` | [live_env.side_effect_evidence_projection.md](live_env.side_effect_evidence_projection.md) | `requires_confirmation_contract` |
| `live_env.reflect_stage_play_context` | [live_env.side_effect_evidence_projection.md](live_env.side_effect_evidence_projection.md) | `requires_confirmation_contract` |
| `live_env.request_probe` | [live_env.side_effect_evidence_projection.md](live_env.side_effect_evidence_projection.md) | `requires_confirmation_contract` |
| `live_env.record_commentary` | [live_env.side_effect_evidence_projection.md](live_env.side_effect_evidence_projection.md) | `requires_confirmation_contract` |
| `live_env.evaluate_goal_satisfaction` | [live_env.side_effect_evidence_projection.md](live_env.side_effect_evidence_projection.md) | `requires_confirmation_contract` |
| `live_env.start_agent_goal_session` | [live_env.mutating_control_boundaries.md](live_env.mutating_control_boundaries.md) | `blocked_pending_contract` |
| `live_env.change_workstation_preset` | [live_env.mutating_control_boundaries.md](live_env.mutating_control_boundaries.md) | `blocked_pending_contract` |
| `live_env.set_visual_preset` | [live_env.mutating_control_boundaries.md](live_env.mutating_control_boundaries.md) | `blocked_pending_contract` |
| `live_env.set_audio_preset` | [live_env.mutating_control_boundaries.md](live_env.mutating_control_boundaries.md) | `blocked_pending_contract` |
| `live_env.bind_workstation_source` | [live_env.mutating_control_boundaries.md](live_env.mutating_control_boundaries.md) | `blocked_pending_contract` |
| `live_env.unbind_workstation_source` | [live_env.mutating_control_boundaries.md](live_env.mutating_control_boundaries.md) | `blocked_pending_contract` |
| `live_env.pause_workstation_loop` | [live_env.mutating_control_boundaries.md](live_env.mutating_control_boundaries.md) | `blocked_pending_contract` |
| `live_env.resume_workstation_loop` | [live_env.mutating_control_boundaries.md](live_env.mutating_control_boundaries.md) | `blocked_pending_contract` |
| `live_env.set_workstation_loop_state` | [live_env.mutating_control_boundaries.md](live_env.mutating_control_boundaries.md) | `blocked_pending_contract` |
| `live_env.repair_loop` | [live_env.mutating_control_boundaries.md](live_env.mutating_control_boundaries.md) | `blocked_pending_contract` |
| `live_env.repair_workstation_source` | [live_env.mutating_control_boundaries.md](live_env.mutating_control_boundaries.md) | `blocked_pending_contract` |
| `live_env.update_live_answer_projection` | [live_env.mutating_control_boundaries.md](live_env.mutating_control_boundaries.md) | `blocked_pending_contract` |
| `live_env.focus_process_graph` | [live_env.mutating_control_boundaries.md](live_env.mutating_control_boundaries.md) | `blocked_pending_contract` |
| `live_env.configure_route_watch` | [live_env.mutating_control_boundaries.md](live_env.mutating_control_boundaries.md) | `blocked_pending_contract` |
| `live_env.configure_live_source_watch_job` | [live_env.mutating_control_boundaries.md](live_env.mutating_control_boundaries.md) | `blocked_pending_contract` |
| `live_env.configure_interpreter_profile` | [live_env.mutating_control_boundaries.md](live_env.mutating_control_boundaries.md) | `blocked_pending_contract` |
| `live_env.spawn_field_worker` | [live_env.mutating_control_boundaries.md](live_env.mutating_control_boundaries.md) | `blocked_pending_contract` |
| `scientific-calculator.open` | [workstation.explicit_side_effect_boundaries.md](workstation.explicit_side_effect_boundaries.md) | `blocked_pending_contract` |
| `scientific-calculator.start_equation_live_source` | [workstation.explicit_side_effect_boundaries.md](workstation.explicit_side_effect_boundaries.md) | `blocked_pending_contract` |
| `workstation-notes.append_to_note` | [workstation.explicit_side_effect_boundaries.md](workstation.explicit_side_effect_boundaries.md) | `blocked_pending_contract` |
| `workstation-notes.create_note` | [workstation.explicit_side_effect_boundaries.md](workstation.explicit_side_effect_boundaries.md) | `blocked_pending_contract` |
| `workstation-notes.create` | [workstation.explicit_side_effect_boundaries.md](workstation.explicit_side_effect_boundaries.md) | `blocked_pending_contract` |
| `workstation-notes.open` | [workstation.explicit_side_effect_boundaries.md](workstation.explicit_side_effect_boundaries.md) | `blocked_pending_contract` |
| `client.read_aloud` | [client.read_aloud.md](client.read_aloud.md) | `client_projection_only` |
| `workstation.dynamic_panel_actions` | [workstation.dynamic_panel_action_boundaries.md](workstation.dynamic_panel_action_boundaries.md) | `panel_owned_boundary` |
| `workstation.explicit_route_aliases` | [workstation.explicit_route_alias_boundaries.md](workstation.explicit_route_alias_boundaries.md) | mixed: `shared_gateway_now` with `provider_gateway_alias_target`, or `safe_to_graduate_next` |
| `live_env.helix_native_procedures` | [live_env.helix_native_procedure_boundaries.md](live_env.helix_native_procedure_boundaries.md) | `helix_owned_boundary` |

## Implementation Anchors

- Gateway registry:
  `server/services/helix-ask/workstation-tool-gateway/registry.ts`
- Explicit capability contracts:
  `server/services/helix-ask/explicit-capability-contract.ts`
- Codex adapter gateway path:
  `server/services/helix-ask/agent-providers/explicit-workstation-gateway.ts`
- Gateway tests:
  `server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts`
- Provider selection tests:
  `server/services/helix-ask/__tests__/agent-provider-selection.test.ts`
- API parity matrix:
  `server/__tests__/helix.ask.api-parity-matrix.test.ts`
- UI trace/projection surfaces:
  `client/src/components/helix/HelixAskPill.tsx`
  `client/src/lib/helix/ask-terminal-projection.ts`
  `client/src/lib/helix/ask-debug-event-display.ts`

## Required Validation Families

Use the narrowest meaningful tests for a patch, but contract promotion should
eventually include:

```bash
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts --pool=forks
npx vitest run server/services/helix-ask/__tests__/agent-provider-selection.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.api-parity-matrix.test.ts --pool=forks
npm run helix:ask:discipline:quick
git diff --check
```

Live UI/API validation must use the user-started keyed server. Do not start or
restart that server from an agent shell.
