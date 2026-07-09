# Helix Ask Codex Workstation Live Debug Evidence - 2026-06-29

Purpose: capture live evidence for the next Codex Workstation Mode patch. This
is not an implementation patch.

Classification for the next patch:

- source admission
- tool admission
- evidence normalization
- evidence re-entry
- presentation

Authority boundary:

- Codex runtime stays the generic model/tool loop owner.
- Helix Ask owns workstation capability admission, observation identity,
  route/product authority, terminal authority, visible trace projection, and
  debug export mirrors.
- Tool receipts remain observations. A final answer may only claim a tool ran
  when the current turn has a matching observation packet.

## Environment

- URL tested: `http://localhost:1498/desktop?panels=docs-viewer%2Cscientific-calculator&focus=scientific-calculator&doc=docs%2Fresearch%2Fnhm2-current-status-whitepaper.md`
- Server commit reported by debug export: `0858307ad931f853bbbd57dfb48248099fc38d24`
- Runtime selected in UI: `Codex Workstation Mode`
- Browser console warnings/errors during evidence pass: none observed
- Debug export endpoint verified:
  `/api/agi/ask/turn/:turnId/debug-export`

## Working Evidence

### API calculator turn

Turn:
`ask:live:codex-calc-1782734756932`

Prompt:
`Use the scientific calculator to evaluate (18+6)*3, then answer normally with what ran and the result.`

Observed gateway calls:

- `scientific-calculator.open_panel`
- `scientific-calculator.focus_panel`
- `scientific-calculator.show_gateway_solve`
- `scientific-calculator.solve_expression`

Observation:

- schema: `helix.calculator_solve_observation.v1`
- expression: `(18+6)*3`
- result: `72`

Final answer:

`I used the Scientific Calculator gateway to evaluate `(18+6)*3`. Result: `72``

Status:

- final source: `agent_provider_terminal_candidate`
- final status: `final_answer`
- workstation gateway re-entry: `completed`
- terminal authority: `authorized_by_helix_provider_candidate_bridge`
- no terminal error

### API docs turn

Turn:
`ask:live:codex-doc-1782734756932`

Prompt:
`Summarize this current document in a grounded way. Include the main claim boundary and do not answer from the path alone.`

Observed gateway call:

- `docs.search`

Observation:

- schema: `helix.docs_search_observation.v1`
- bounded document excerpt materialized from
  `docs/research/nhm2-current-status-whitepaper.md`

Status:

- final source: `agent_provider_terminal_candidate`
- final status: `final_answer`
- workstation gateway re-entry: `completed`
- terminal authority: `authorized_by_helix_provider_candidate_bridge`
- no terminal error

### API compound turn

Turn:
`ask:live:codex-compound-1782734756932`

Prompt:
`Use the open document, calculate 8*9, search the repo for workstation_gateway, then synthesize the implication in a useful paragraph.`

Observed gateway calls:

- `scientific-calculator.open_panel`
- `scientific-calculator.focus_panel`
- `scientific-calculator.show_gateway_solve`
- `docs.search`
- `scientific-calculator.solve_expression`
- `repo.search`

Observation:

- calculator schema: `helix.calculator_solve_observation.v1`
- expression: `8*9`
- result: `72`
- docs schema: `helix.docs_search_observation.v1`
- repo schema: `helix.repo_search_observation.v1`

Status:

- final source: `agent_provider_terminal_candidate`
- final status: `final_answer`
- workstation gateway re-entry: `completed`
- terminal authority: `authorized_by_helix_provider_candidate_bridge`
- no terminal error

This proves the backend API path can execute compound docs + calculator + repo
tooling and re-enter the observations.

### API theory reflection turn

Turn:
`ask:live:codex-theory-1782734756932`

Prompt:
`Reflect QEI margin and source residual against the theory badge graph, then explain the claim boundary.`

Observed gateway call:

- `theory-badge-graph.reflect_discussion_context`

Observation:

- schema: `helix.theory_context_reflection_observation.v1`
- summary mentioned QEI / stress-energy, Warp / GR / NHM2, wall T00 source
  residual, QEI badge replay margin, and source residual.

Status:

- final source: `agent_provider_terminal_candidate`
- final status: `final_answer`
- workstation gateway re-entry: `completed`
- terminal authority: `authorized_by_helix_provider_candidate_bridge`
- no terminal error

## UI Evidence

### UI calculator turn works and updates the panel

Prompt:
`Use the scientific calculator to evaluate 144/12 + 5, then explain in one sentence what tool ran.`

Turn:
`ask:904daaef-cfd7-42b8-b3b7-7bd1c2ede2a0`

Visible trace included:

- `Runtime selected: Codex Workstation Mode.`
- `Action request: scientific-calculator.open_panel.`
- `Action observation: scientific-calculator.open_panel admitted open_panel for scientific-calculator.`
- `Action request: scientific-calculator.focus_panel.`
- `Action observation: scientific-calculator.focus_panel admitted focus_panel for scientific-calculator.`
- `Action request: scientific-calculator.show_gateway_solve.`
- `Action observation: scientific-calculator.show_gateway_solve admitted run_panel_action for scientific-calculator.`
- `Tool request: scientific-calculator.solve_expression.`
- `Tool observation: scientific-calculator.solve_expression observed 144/12+5 = 17.`
- `Model re-entry: Codex received the workstation observation packet(s) before final answer.`

Final answer:

`144/12 + 5 = 17; the Helix Scientific Calculator solve_expression gateway capability ran to evaluate it.`

Debug export status:

- final source: `agent_provider_terminal_candidate`
- final status: `final_answer`
- gateway re-entry: `completed`
- terminal authority: `authorized_by_helix_provider_candidate_bridge`

Panel projection evidence:

- calculator panel displayed expression `144/12+5`
- calculator panel displayed result `17`
- panel showed `helix_workstation_gateway_observation`
- panel showed trace id
  `ask:904daaef-cfd7-42b8-b3b7-7bd1c2ede2a0:scientific-calculator.solve_expression`

### UI docs-viewer focused turn works

Prompt:
`Summarize this document from the current docs viewer context. Include the main claim boundary.`

Visible trace included:

- `Runtime selected: Codex Workstation Mode.`
- `Context state: focused panel docs-viewer; retained doc docs/research/nhm2-current-status-whitepaper.md.`
- `Tool request: docs.search.`
- `Tool observation: docs.search materialized a bounded document excerpt from docs/research/nhm2-current-status-whitepaper.md.`
- `Model re-entry: Codex received the workstation observation packet(s) before final answer.`

Final answer quality:

- summarized NHM2 as a same-chart 3+1 lapse-shift metric-evaluation framework
- included alpha `0.995` anchor and newer alpha `0.7` campaign profile
- included `campaignPass = true` and `profileCampaignFrontierComplete = true`
- preserved the claim boundary: diagnostic/artifact-limited, not physical
  viability, transport, propulsion, ETA, speed authority, or experimental
  validation.

## Failing Or Incomplete Evidence

### Retained doc while calculator focused can still zero-hit

Prompt:
`From this current document, summarize the main claim boundary and the current NHM2 status in a useful paragraph.`

Visible trace:

- context state showed focused panel `scientific-calculator`
- retained doc path was present:
  `docs/research/nhm2-current-status-whitepaper.md`
- `docs.search` ran
- tool observation reported `Docs search returned 0 evidence hit(s)`
- model re-entry happened with that observation

Final answer:

`I cannot answer the current document's content from this turn because no docs observation packet was materialized. Ask with a valid retained active document path, focus the docs-viewer, or provide an explicit document path so Helix can create a bounded docs observation first.`

Diagnosis:

The authority behavior is correct because it did not answer from a path alone.
The routing/materialization behavior is incomplete because a valid retained doc
path was present but did not become a bounded active-document observation while
the calculator was focused.

Expected next patch:

- If the prompt is document-targeted and retained active document identity is
  available, admit a bounded docs observation packet even when another panel is
  focused.
- Do not answer from the path alone.
- Keep the visible trace as docs observation, model re-entry, then final answer.

### Natural compound UI prompt misses calculator admission

Prompt:
`Use the current document, calculate 8*9, and explain what this proves about the Codex workstation loop. Keep the claim boundary clear.`

Visible trace:

- runtime selected Codex
- context state showed focused panel `scientific-calculator` and retained doc
- `docs.search` ran and materialized the bounded doc excerpt
- no calculator request or observation appeared
- model re-entry happened with docs observation only

Final answer:

`8 * 9 = 72.`

Then the answer correctly stated:

`It does not prove that a calculator UI action ran for 8*9, because no 8*9 calculator receipt was provided in this turn.`

Diagnosis:

The final answer was authority-safe, but the tool admission was incomplete. A
natural compound prompt that requests both the current document and a
calculation should admit both the docs observation and the calculator
observation, subject to existing non-mutating read/observe permissions.

Expected next patch:

- Improve compound capability planning for docs + calculator in UI Ask turns.
- Preserve the no-fabrication behavior: if calculator observation is missing,
  the final answer must not claim it ran.

### Explicit calculator capability name still misses calculator admission in UI compound turn

Prompt:
`Use scientific-calculator.solve_expression for 8*9 and also use the current document observation. Then explain both observations and the claim boundary.`

Visible trace:

- runtime selected Codex
- context state showed focused panel `scientific-calculator` and retained doc
- `docs.search` ran and materialized the bounded doc excerpt
- no `scientific-calculator.solve_expression` request or observation appeared
- model re-entry happened with docs observation only

Final answer:

`I don't have a scientific-calculator.solve_expression observation packet for 8*9 in this turn, so I can't claim that workstation calculator tool ran or cite its result as a receipt.`

Diagnosis:

Authority behavior is correct. Tool admission is still incomplete because an
explicit capability request did not execute in the mixed docs + calculator UI
path.

Expected next patch:

- Explicit read-only capability names in affirmative operator requests should
  become tool-admission candidates.
- Mixed source-target prompts must not collapse to a single docs-only route when
  another safe requested capability is present.

### Natural theory reflection UI prompt does not route to reflection gateway

Prompt:
`Reflect QEI margin and source residual against the theory badge graph, then explain the claim boundary.`

Visible trace:

- runtime selected Codex
- context state showed focused panel `scientific-calculator` and retained doc
- model re-entry said no workstation observation packet was available
- no tool request
- no tool observation

Final answer:

`I need retrieval before finalizing this claim. I do not yet have grounded evidence references for it.`

Diagnosis:

The answer was safe, but the UI natural prompt did not admit
`theory-badge-graph.reflect_discussion_context`. The direct API path for the
same wording did route to that gateway and produced a good answer.

Expected next patch:

- Align UI Ask route/admission with the API path for reflection capabilities.
- Add UI/latest-turn trace tests for reflection request, observation, model
  re-entry, and final answer.

## Next Patch Acceptance Criteria

1. Current-document prompts with retained active document identity materialize a
   bounded docs observation even when another panel is focused.
2. Natural compound prompts can admit multiple safe read/observe capabilities in
   one turn, such as docs + calculator and docs + repo + calculator.
3. Explicit read-only capability requests in UI Ask are not dropped when a docs
   source target is also present.
4. Reflection prompts route consistently in UI and API paths.
5. Final answers remain free-form model outputs except for adapter-level
   projection cleanup. Do not add answer-shape discipline that forces terse or
   template-like responses.
6. Visible latest-turn trace shows provider/runtime, each tool/action request,
   each observation, model re-entry, and final answer.
7. Codex never claims a tool ran unless the matching current-turn observation
   packet exists.
8. Permission profile remains read/observe only: no shell, file mutation, or
   write capability.

## Suggested Tests

- Codex UI selected + retained docs path + calculator focused + document prompt
  gets a bounded docs observation, not zero-hit path-only behavior.
- Codex UI selected + compound docs + calculator prompt executes both
  `docs.search` and `scientific-calculator.solve_expression`.
- Codex UI selected + explicit `scientific-calculator.solve_expression` in a
  mixed docs prompt executes the calculator capability.
- Codex UI selected + theory reflection prompt executes
  `theory-badge-graph.reflect_discussion_context`.
- UI latest turn includes provider label, tool/action observation rows, model
  re-entry row, and final answer row.
- Negative case: Codex does not answer document content when no docs observation
  exists.
- Negative case: Codex does not claim calculator/reflection tools ran when no
  observation packet exists.

Run after patch:

```bash
npm run helix:ask:discipline:quick
npx vitest run client/src/components/__tests__/helix-ask-pill-ui.spec.tsx --pool=forks
npx vitest run client/src/lib/workstation/__tests__/panelActionAdapters.spec.ts --pool=forks
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts --pool=forks
npx vitest run server/services/helix-ask/agent-providers/__tests__/runtime-adapter-contract.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.api-parity-matrix.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.prompt-solving-benchmark.test.ts --pool=forks
```

For live validation against the operator-started keyed server:

```bash
$env:HELIX_ASK_BASE_URL="http://localhost:1498"
npm run helix:ask:live-spine-smoke
npm run helix:ask:tool-chain-matrix
```
