# Helix Ask Provider Capability Contracts

Status: working-draft provider catalog contract.

This document defines how Helix Ask capabilities become available to provider
agents such as Helix Native, Codex Workstation Mode, and future runtimes. It is
not a prompt and it is not a runtime loop. The machine-checkable companion is:

```txt
server/services/helix-ask/provider-agent-capability-contract.ts
server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts
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

## Availability Labels

| Label | Meaning |
| --- | --- |
| `shared_gateway_now` | Exposed through `workstation-tool-gateway/registry.ts` for Helix, Codex, and future providers. |
| `safe_to_graduate_next` | Read/observe capability that can be promoted after bounded observation, debug, and negative-admission tests exist. |
| `requires_confirmation_contract` | Side-effecting output such as voice; needs explicit affirmative admission, confirmation/playback policy, and receipts. |
| `helix_native_only` | Helix-owned live-environment behavior that should not be provider-facing until a narrower contract exists. |
| `legacy_dynamic_panel_only` | Retired or panel-local dynamic action; do not count as provider gateway parity. |
| `blocked_pending_contract` | Mutating/control capability or ambiguous lifecycle; fail closed until a permission and receipt contract exists. |
| `client_projection_only` | Client UI behavior such as read-aloud playback, not an agent tool. |

## Shared Now

The current provider-shared workstation gateway exposes these capabilities:

```txt
workspace_os.status
workstation.active_context
scientific-calculator.solve_expression
scientific-calculator.active_context
scientific-calculator.open_panel
scientific-calculator.focus_panel
scientific-calculator.show_gateway_solve
workstation.open_panel
workstation.focus_panel
docs-viewer.open_doc
repo.search
docs.search
internet-search.search_web
scholarly-research.lookup_papers
civilization-bounds.reflect_system_bounds
theory-badge-graph.reflect_discussion_context
```

These are non-terminal gateway observations/receipts with:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

## Safe Next Read/Observe Candidates

Read-only live-environment queries are the first graduation lane. They still need
bounded observation builders, same-turn debug rows, and negative admission tests
before they enter the provider gateway:

```txt
live_env.query_trace_memory
live_env.query_narrator_events
live_env.query_audio_transcripts
live_env.query_live_answer_state
live_env.query_route_evidence
live_env.query_visual_summaries
live_env.query_translation_segments
live_env.query_microdeck_outputs
live_env.query_packet_traces
live_env.query_automation_policies
live_env.query_source_health
live_env.query_live_source_loop_health
live_env.query_live_source_quality
live_env.summarize_live_source_current_state
live_env.query_constructs
live_env.query_job_evidence
live_env.query_event_log
live_env.query_world_events
live_env.query_navigation_state
live_env.query_stage_sources
live_env.query_workstation_goal_context
```

## Voice Graduation Boundary

Voice is a side-effecting output channel. It must not be treated as equivalent to
the client `Read aloud` button and must not be inferred from final prose.

Voice candidates:

```txt
live_env.request_interim_voice_callout
live_env.narrator_say
live_env.record_voice_steering
narrator.say
narrator_say
```

Before provider gateway exposure, each voice capability needs:

```txt
explicit affirmative command admission
confirmation or playback permission policy
structured request/receipt observation
negative quoted/negated/contextual admission tests
host-side projection without final-prose scraping
```

Blocked voice-related stream capabilities:

```txt
live_env.narrator_bind_stream
narrator.bind_stream
narrator_bind_stream
```

These require a stronger stream lifecycle and permission contract than one-shot
voice callout.

## Helix Native Only

These live-environment capabilities remain Helix-owned until provider gateway
contracts define bounded observations, route authority, and projection behavior:

```txt
live_env.read_card
live_env.describe_stage_builder
live_env.reflect_stage_play_context
live_env.check_live_source_mail
live_env.read_live_source_mail
live_env.read_processed_live_source_mail
live_env.reflect_live_source_mail_loop
live_env.query_micro_reasoner_prompts
live_env.query_micro_reasoner_presets
live_env.query_visual_observer_profiles
live_env.test_micro_reasoner_prompt
live_env.test_visual_observer_profile
live_env.compare_visual_observer_profiles
live_env.compare_mail_to_interpreter_profile
live_env.compare_live_source_prediction
live_env.validate_live_source_prediction
live_env.process_live_source_mail
live_env.draft_stage_play_graph
live_env.validate_stage_play_graph
live_env.plan_stage_play_job
live_env.request_stage_play_checkpoint
live_env.draft_micro_reasoner_preset
live_env.route_micro_reasoner_prompt
live_env.apply_micro_reasoner_preset
live_env.create_micro_reasoner_preset
live_env.update_micro_reasoner_prompt
live_env.configure_visual_observer_profile
live_env.apply_visual_observer_profile
live_env.request_visual_action_replay
live_env.predict_live_source_immediate
live_env.project_live_source_narrative
live_env.update_live_source_immersion_state
live_env.record_live_source_mail_decision
live_env.request_probe
live_env.record_commentary
live_env.evaluate_goal_satisfaction
```

## Blocked Pending Contract

These are mutating/control capabilities. They must fail closed for provider
agents until explicit permission, confirmation, receipt, and negative-admission
tests exist:

```txt
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

The classification test covers active and retired dynamic action lists from:

```txt
shared/workstation-dynamic-tools.ts
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

Live validation must use the user-started keyed server. Do not start or restart
that server from an agent shell.
