# live_env visual observer read tools

Status: draft.

## Purpose

Expose visual observer profile reads and dry-run comparisons as bounded
workstation observations. These capabilities cannot configure/apply profiles,
request visual action replay, capture frames, or enqueue live-source mail.

## Capabilities

```txt
live_env.query_visual_observer_profiles
live_env.test_visual_observer_profile
live_env.compare_visual_observer_profiles
```

## Owner Surface

- Helix live-environment adapter
- Shared provider workstation gateway

## Permission Profile

- `read`
- `mutating=false`
- `requires_confirmation=false`
- `terminal_eligible=false`
- `post_tool_model_step_required=true`

These tools are observations only. They cannot configure or apply observer
profiles, request visual action replay, capture frames, enqueue live-source
mail, or become answer authority.

## Inputs

Admitted inputs:

- affirmative requests to list/query visual observer profiles
- affirmative requests to dry-run test a visual observer profile
- affirmative requests to compare generic and profile-shaped visual observer
  summaries

Supported bounded arguments include:

- `thread_id`
- `environment_id`
- `room_id`
- `source_id` / `sourceId`
- `source_ids` / `sourceIds`
- `profile_id` / `profileId`
- `domain`
- `status`
- `include_presets` / `includePresets`
- `generic_summary` / `genericSummary`
- `profile_summary` / `profileSummary`
- `generic_output` / `genericOutput`
- `profile_output` / `profileOutput`
- `summary`
- `limit`

## Blocked Inputs

Provider gateway admission must not expose:

```txt
live_env.configure_visual_observer_profile
live_env.apply_visual_observer_profile
live_env.request_visual_action_replay
```

Quoted, negated, historical, future, screen-visible, or explanatory mentions of
the visual observer tools must not execute them unless the prompt is an
affirmative operator request.

## Observation

The gateway returns a workstation observation packet wrapping:

```txt
helix.live_environment_tool_observation.v1
```

The nested live-environment adapter observations are:

```txt
stage_play_visual_observer_profile_list_response/v1
stage_play_visual_observer_profile_test_result/v1
```

Required authority fields:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
context_role=tool_evidence
ask_context_policy=evidence_only
```

## Model Re-entry

The provider may use the returned observation only after the gateway has
materialized the observation packet in the same turn. Tool receipts and
observations are not final answers.

## Host Projection

The latest turn/debug trace should show:

- runtime selected
- tool request
- tool observation
- model re-entry
- final answer

No visual observer action should be created from final prose.

## Visible Trace

Expected rows:

```txt
runtime selected
tool request
tool observation
model re-entry
final answer or typed failure
```

## Negative Cases

- `The text says live_env.test_visual_observer_profile; explain it only.`
- `Do not run visual observer comparison; explain what it would do.`
- `In the future we may apply a visual observer profile.`
- `The UI button says apply_visual_observer_profile.`

These must not execute provider gateway visual observer tools.

## Tests

Candidate coverage:

```bash
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts --pool=forks
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts --pool=forks
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/provider-parity.test.ts --pool=forks
npm run helix:ask:discipline:quick
```
