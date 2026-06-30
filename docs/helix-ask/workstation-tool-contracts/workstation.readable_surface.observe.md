# workstation.readable_surface.observe

Maturity: draft

Provider status: shared gateway read capability

## Owner

Helix Ask owns surface admission, readable-surface adapter registration,
observation packet normalization, and terminal authority. Client panels own the
registered surface refs they choose to expose. Provider runtimes only request
the shared gateway capability.

## Purpose

`workstation.readable_surface.observe` is the generic provider-visible contract
for reading a registered user-facing workstation surface as bounded evidence.
It is read-only and non-terminal.

Surface-specific aliases use the same observation schema:

- `docs-viewer.read_visible_surface`
- `docs-viewer.read_active_translation`
- `scientific-calculator.read_visible_result`

## Authority

`live_env.narrator_say` is delivery only. It may speak surface text only after a
same-turn `helix.workstation_readable_surface_observation.v1` packet exists.

The observation packet is evidence, not a final answer. It must carry:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

## Inputs

Admitted inputs:

- registered panel/surface ids from Ask turn context
- bounded visible, selected, hovered, translated, or result text supplied by a
  registered adapter
- docs paths under `docs/` for bounded document excerpts
- translation blocks with unit ids, locale, status, source text, and translated
  text
- calculator active context or visible result payloads

Blocked inputs:

- arbitrary DOM queries
- final assistant prose
- hidden UI state or secrets
- missing translation text for `docs-viewer.read_active_translation`
- missing visible result for `scientific-calculator.read_visible_result`
- quoted, negated, future, historical, or screen-visible mentions that are not
  affirmative operator requests

## Observation Schema

`helix.workstation_readable_surface_observation.v1`

Required fields:

- `capability_key`
- `canonical_capability_key`
- `panel_id`
- `action_id`
- `surface_id`
- `status`
- `text`
- `source_refs`
- `line_refs`
- `unit_refs`
- `source_doc_path`
- `translation`
- `calculator`
- `observation_role=evidence_not_assistant_answer`

If a required registered surface is absent, return `status=blocked` with a
typed `blocked_reason`. Do not fabricate surface text.

## Compound Outcomes

`read_aloud_surface`:

```txt
surface observation
-> live_env.narrator_say receipt
-> evidence re-entry
-> final answer or typed failure through terminal authority
```

`translate_visible_surface`:

```txt
surface observation
-> translation observation or missing-translation observation
-> optional narrator only if explicitly requested
-> final answer or typed failure
```

`summarize_visible_surface`:

```txt
surface observation
-> model re-entry
-> final answer
```

## Host Projection

Readable-surface observations do not directly project UI actions. When a prompt
also asks for speech, `live_env.narrator_say` may create a separate host
playback receipt only after the surface observation exists in the same turn.

## Visible Trace

Visible and debug traces should show:

- selected runtime
- surface resolver request
- `helix.workstation_readable_surface_observation.v1`
- optional `live_env.narrator_say` receipt
- evidence re-entry / provider final candidate
- terminal authority result

## Tests

```bash
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts --pool=forks
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts --pool=forks
npx vitest run server/services/helix-ask/__tests__/agent-provider-selection.test.ts --pool=forks
```
