# Explicit Route Alias Boundaries

Maturity: `draft`

Owner surface: Helix Ask explicit route contracts

Provider status: mixed. Some aliases are shared through canonical gateway
targets recorded as `provider_gateway_alias_target`; held-back aliases remain
safe to graduate next and are not shared provider gateway tools yet.

## Purpose

Define the boundary for explicit Helix Ask route contract ids that already have
Helix-owned semantics, but are not exact shared workstation gateway manifest
ids. These ids can be good candidates for provider access, but only after a
bounded gateway alias or observation contract is added for the exact capability.

## Owner

Helix Ask owns route authority, source admission, evidence identity, and
terminal eligibility for these explicit contracts. Codex Workstation Mode and
future provider runtimes must not call the explicit route id directly unless the
provider gateway has a matching manifest entry or a documented alias mapping.

## Inputs

Inputs must be explicit requests for the capability or its documented alias.
Lexical mentions in quoted text, UI labels, documentation, historical context,
future plans, or negated instructions must not execute the route.

Provider graduation requires:

- exact capability id or documented alias admission
- bounded capability-owned argument extraction
- source-target admission where applicable
- observation packet schema for the provider-visible result
- no substitution from nearby route labels or debug artifacts

## Observation

If graduated, each route alias must produce a structured observation packet with:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

The packet must name both the requested explicit route contract id and the
selected runtime/gateway capability id so debug export can prove the handoff.

## Host Projection

Host projection must be optional metadata beside the final answer. Projection
metadata must come from structured observations or receipts, not final prose.

## Visible Trace

If graduated later, the latest-turn stream must show:

```txt
runtime selected
explicit route or alias request
selected gateway/runtime capability
tool observation
model re-entry
final answer
```

Debug export and visible UI must agree for the same turn id.

## Tests

Shared explicit aliases:

| Alias | Canonical gateway target |
| --- | --- |
| `repo-code.search_concept` | `repo.search` |
| `internet_search.web_research` | `internet-search.search_web` |
| `helix_ask.reflect_theory_context` | `theory-badge-graph.reflect_discussion_context` |
| `helix_ask.reflect_civilization_bounds` | `civilization-bounds.reflect_system_bounds` |
| `scientific-calculator.solve_with_steps` | `scientific-calculator.solve_expression` |
| `scientific-calculator.solve` | `scientific-calculator.solve_expression` |
| `docs-viewer.open` | `docs-viewer.open_doc` |
| `docs-viewer.search_docs` | `docs.search` |
| `docs-viewer.open_doc_by_path` | `docs-viewer.open_doc` |
| `docs-viewer.locate_in_doc` | `docs.search` |
| `docs-viewer.summarize_doc` | `docs.search` |
| `docs-viewer.doc_equation_context` | `docs.search` |

Held-back behavior:

```txt
availability=safe_to_graduate_next
gateway_manifest=absent
codex_workstation=false
future_provider=false
```

Explicit read/observe candidates:

```txt
helix_ask.inspect_capability_catalog
helix_ask.reflect_workstation_tool_alignment
repo-code.search_concept
workspace-directory.resolve
internet_search.web_research
scholarly-research.fetch_full_text
helix_ask.reflect_theory_context
helix.theory.frontierVectorFieldTrace
helix_ask.reflect_live_synthetic_data
helix_ask.reflect_context_attachments
helix_ask.reflect_ideology_context
helix_ask.bridge_theory_ideology_context
helix_ask.build_civilization_scenario_frame
helix_ask.reflect_civilization_bounds
image_lens.inspect
situation-room.describe_visual_capture
```

Explicit UI/projection candidates:

```txt
scientific-calculator.solve_with_steps
scientific-calculator.solve
docs-viewer.open
docs-viewer.identify_current_doc
docs-viewer.search_docs
docs-viewer.validate_doc_candidates
docs-viewer.open_doc_by_path
docs-viewer.locate_in_doc
docs-viewer.summarize_doc
docs-viewer.doc_equation_context
```

Required before provider graduation:

- positive admission for the exact route or alias
- quoted/negated/historical/future/screen-visible negative tests
- selected gateway/runtime capability trace
- observation packet test
- terminal authority test proving route/debug artifacts are not final answers
- UI latest-turn/debug-export parity when visible

Implementation anchors:

- Classification:
  `server/services/helix-ask/provider-agent-capability-contract.ts`
- Explicit contracts:
  `server/services/helix-ask/explicit-capability-contract.ts`
- Gateway registry:
  `server/services/helix-ask/workstation-tool-gateway/registry.ts`
- Provider capability tests:
  `server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts`

```bash
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts --pool=forks
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts --pool=forks
npx vitest run server/services/helix-ask/agent-providers/__tests__/explicit-workstation-gateway.test.ts --pool=forks
npm run helix:ask:discipline:quick
git diff --check
```
