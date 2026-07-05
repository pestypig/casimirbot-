# moral-graph.reflect_context

Maturity: `draft`

## Purpose

Reflect a prompt through Moral Graph badges, locator matches, procedural
classification, and fruition as bounded diagnostic context. The observation may
support follow-up reasoning, but it does not authorize an action, decide moral
status, or become the final answer.

## Owner

- Capability id: `moral-graph.reflect_context`
- Panel: `moral-graph`
- Gateway schema: `helix.workstation_tool_gateway.capability.v1`
- Observation schema: `helix.moral_graph_reflection_observation.v1`

## Inputs

Required:

- `prompt`

Optional aliases and controls:

- `text`
- `query`
- `conversation_context`
- `refs`
- `include_locator`
- `include_fruition`
- `include_procedural_classification`
- `include_recommended_actions`
- `include_admissions`

## Observation

The gateway returns `helix.moral_graph_reflection_observation.v1` with:

```txt
capability_key=moral-graph.reflect_context
panel_id=moral-graph
action_id=reflect_context
status
blocked_reason?
terminal_eligible=false
assistant_answer=false
raw_content_included=false
post_tool_model_step_required=true
```

The observation may include badge ids, claim-boundary notes, procedural
classification, locator summaries, and recommended-action diagnostics. These
fields are evidence and routing context only.

## Host Projection

No host mutation is required. Any visible Moral Graph projection must come from
structured observation fields, not provider final prose.

## Visible Trace

Expected trace rows:

```txt
runtime selected
moral graph reflection request
gateway admission
bounded observation packet
model re-entry
terminal authority review
final answer
```

## Blocked Cases

Missing `prompt`, `text`, or `query` blocks with
`moral_graph_reflection_prompt_missing`.

## Negative Admission Cases

The reflection must not be treated as:

- proof of moral standing
- authorization to act
- a viability certificate
- a substitute for user confirmation
- final answer authority

## Tests

```bash
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts --pool=forks
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts --pool=forks
npm run helix:ask:discipline:quick
git diff --check
```
