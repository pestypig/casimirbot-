# `live_env.*` Context Feed Query Contracts

Maturity: `draft`

## Purpose

Expose bounded read-only context feed queries as same-turn workstation
observations for provider re-entry.

Capabilities:

```txt
live_env.query_visual_summaries
live_env.query_trace_memory
live_env.query_narrator_events
live_env.query_audio_transcripts
live_env.query_translation_segments
live_env.query_microdeck_outputs
live_env.query_live_answer_state
live_env.query_packet_traces
live_env.query_route_evidence
live_env.query_automation_policies
live_env.query_source_health
```

## Owner Surface

Helix live environment / Live Answer environment.

## Permission Profile

`read`

The shared provider gateway may expose these capabilities to Helix Native,
Codex Workstation Mode, and future provider runtimes as read-only observation
queries.

## Inputs

Supported bounded arguments include thread/environment/source scope, freshness
filters, limits, and `source_target_intent`. Empty scoped reads are valid
observations when the requested feed is available.

## Observation Contract

The gateway delegates execution to the existing live-environment adapter and
wraps the returned `helix.live_environment_tool_observation.v1` envelope in a
workstation gateway observation packet.

The nested observation may be feed-specific, including:

```txt
stage_play_workstation_context_feed_query_result/v1
stage_play_packet_trace_query_result/v1
live_source_causal_trace/v1
helix.workstation_reasoning_trace_query_result.v1
helix.workstation_source_health_query_result.v1
helix.situation_source_capability_read.v1
```

Every returned observation must remain evidence only:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

## Observation

Output observation schema: `helix.live_environment_tool_observation.v1`.

## Host Projection

The UI may render request/observation rows and support refs from structured
gateway/debug fields. It must not infer context-feed execution from final prose.

## Admission Rules

- Explicit direct gateway calls may request these capabilities by id.
- Prompt-derived admission must still obey the Helix tool-admission rules.
- Quoted, negated, historical, future, or explanatory mentions must not execute
  these capabilities unless the prompt is an affirmative operator request.
- Empty context-feed reads are valid observations when the feed scope is valid.
- Missing goal-session feed/actuator requirements must return a blocked
  observation packet, not a final answer.

## Visible Trace

Expected rows:

```txt
runtime selected
tool request
tool observation
model re-entry
final answer or typed failure
```

Tool observation rows must come from `workstation_gateway_call_results`,
`workstation_gateway_observation_packets`, or equivalent same-turn structured
debug fields. UI projection must not infer context-feed execution from final
prose.

## Tests

Candidate validation requires:

```bash
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts --pool=forks
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.prompt-solving-benchmark.test.ts --pool=forks
npm run helix:ask:discipline:quick
```

Live validation must use the user-started keyed server.
