# Helix Ask Terminal Authority Contract

Status: operational contract.

This contract defines how Helix Ask turns become visible answers. It is the
handoff point between route/tool evidence and what the user sees in the Ask
chat.

## Core Rule

Only one terminal product may become the visible answer for a turn.

```text
candidate tool or source
-> admitted tool or source
-> current-turn observation, receipt, or model terminal candidate
-> route-approved terminal product
-> terminal authority single writer
-> one visible answer
```

The expanded route-product chain is:

```text
route/product contract
-> admitted observations or receipts
-> evidence re-entry or allowed receipt terminal
-> terminal product materializer
-> terminal authority single writer
-> terminal presentation
-> visible answer/debug projection
```

Routes are proposed procedures. Receipts and observations are evidence. The
visible answer is the terminal product selected by terminal authority.

Do not weaken this rule to make a failing turn look successful. If a route has
no approved terminal product, the correct result is a scoped typed failure that
names the missing rail.

Do not over-apply this rule to plain chat. A model-only turn with no source or
tool request must allow `direct_answer_text` or an allowed provider terminal
candidate. It must not require retrieval, sidecars, or proof refs merely because
those artifacts exist elsewhere in the workstation.

## Ownership Boundary

Codex owns generic runtime mechanics:

```text
model sampling
generic tool execution
tool-result re-entry
retries
approvals and sandboxing
compaction
session lifecycle
subagent orchestration
terminal completion
```

Helix Ask owns the policy and evidence boundary:

```text
prompt interpretation
intent arbitration
source/tool admission
evidence identity and provenance
route/product contracts
proof and claim gates
terminal eligibility
debug traces
visible projection discipline
```

Do not recreate Codex runtime mechanics inside Helix Ask. Add thin adapters and
Helix policy contracts instead.

## Terminal Product Materializers

Terminal product materializers convert an already-authorized artifact into a
candidate visible answer shape. They do not decide that the artifact is allowed.

Current pattern:

```text
artifact exists
route product contract allows artifact kind
materializer converts artifact to terminal text
single writer selects or rejects it
presentation mirrors selected text
```

Materializers must be admitted by an explicit route-product allowance. The older
permissive helper may remain available for legacy paths, but new route products
should not rely on permissive fallback behavior.

Examples of explicit terminal products:

```text
image_lens_observation_report
image_lens_named_receipt_evaluation
theory_context_reflection_answer
postulate_runtime_review
calculator_workstation_tool_evaluation
agent_provider_terminal_candidate
direct_answer_text
```

If a route does not explicitly allow a product kind, that product may remain in
debug as context, but it must not become the visible answer.

This is the practical distinction future patches must preserve:

```text
candidate_tools != admitted_tools
admitted_tools != supporting_evidence_refs
supporting_evidence_refs != terminal_product
terminal_product != visible_answer until selected by terminal authority
```

The planner and runtime may consider broad affordances. The authority path is
narrow: only current-turn admitted evidence and route-approved terminal products
can support or become the visible answer.

## Tool Output Roles

Tool/source admission and tool/source output role assignment are separate
decisions.

Admission answers:

```text
May this route use this tool/source now?
```

Role assignment answers:

```text
What may this current-turn output do after it exists?
```

Every current-turn tool/source output should fit one of these roles:

```text
self_terminal
evidence_for_synthesis
ambient_context
candidate_next_step
```

`self_terminal` means the current-turn output may become the visible answer, but
only when the route product contract explicitly allows that terminal kind and
terminal authority selects it. It is appropriate for bounded operator requests
where the observation or receipt is itself the requested result.

`evidence_for_synthesis` means the output must re-enter runtime/model reasoning
before a final answer can be selected. It may support a later terminal product,
but it must not become the visible answer by itself.

`ambient_context` means the output is available in a panel, sidecar, session, or
debug surface, but it is not admitted evidence and is not a prerequisite unless
the current route binds it.

`candidate_next_step` means the output is a suggested capability, template,
repair action, or follow-up affordance. It is not admitted evidence and is not
terminal authority until a later route admits and executes it.

The role chain is:

```text
candidate tool/source
-> admitted tool/source
-> role-assigned output
-> route-approved terminal product or evidence re-entry
-> terminal authority
```

This role assignment is not a scientific-sidecar special case. Image Lens
sidecars, graph reflections, calculator outputs, notes, Moral Graph reflections,
Postulate reviews, docs hits, repo hits, and live-source packets all use the
same role model.

## Preview Is Not Answer

`terminal_answer_authority.terminal_text_preview` is a preview/debug field. It
is not the full answer contract.

The full visible text should come from:

```text
terminal_presentation.concise_text
```

Fallback order may use preview fields only when no full terminal presentation
text exists. UI and debug-export projection must not replace the full terminal
presentation with a preview. If a preview is selected, the likely symptom is a
visible answer cut off mid-sentence or mid-token.

## Sidecar Admission Boundary

Ambient artifacts are not route prerequisites.

```text
ambient artifact
-> possible candidate
-> admitted evidence only if requested or bound by the route
-> support ref only if used
-> prerequisite only if required by the route contract
```

Presence is not permission. Existing Image Lens, PDF, calculator, graph,
workspace, process, or chat sidecars may be shown in debug as available context.
They enter `support_refs`, `required_observation_kinds`, graph reflection,
calculator handoff, or Postulate Board review only when the current route admits
them.

Admission requires at least one of:

```text
explicit user request
active route source-target binding
active panel/source id binding
current-turn admitted continuation
route product contract requirement
```

No stale inheritance: a new turn must not inherit old sidecars as proof merely
because they still exist in workstation state.

Quoted, negated, contextual, historical, future, or screen-visible tool names
are also ambient context. A prompt that asks to explain the literal phrase
`internet-search.search_web`, or that says not to browse, must not route into an
internet-search failure. Lexical cues may create candidates, but they do not
admit execution and they do not create a required evidence lane.

## Product Examples

### Image Lens

An Image Lens crop request may terminate as `image_lens_observation_report` only
when the route product contract allows that report. Otherwise, the crop receipt
is an observation that must re-enter reasoning or fail closed.

Role examples:

```text
explicit crop/OCR/equation-row report -> self_terminal when route-approved
Image Lens equation evidence used by Theory Badge Graph -> evidence_for_synthesis
prior Image Lens sidecar in workstation state -> ambient_context
suggested higher-resolution re-crop -> candidate_next_step
```

Named receipt evaluation is different from re-cropping. When a prompt says
"use the latest observation receipt named crop_1", the route should evaluate the
existing receipt if it is available. It should re-crop only when the prompt asks
to create a new crop or when the route explicitly requires a fresh observation.

### Theory Badge Graph

Graph reflection is diagnostic by default. A graph reflection can become a
visible answer only through an allowed `theory_context_reflection_answer`
terminal product. Graph proximity is not proof, physical validation, badge
promotion, graph mutation, or calculator authority unless a separate route and
evidence contract grants that authority.

Role examples:

```text
standalone diagnostic graph reflection answer -> self_terminal when route-approved
graph reflection feeding Postulate review -> evidence_for_synthesis
nearby graph matches from prior turns -> ambient_context
suggested badge/calculator follow-up -> candidate_next_step
```

### Postulate Board

`/postulate` must produce a `postulate_runtime_review` or a typed failure. The
review is the terminal product; a prompt draft, graph reflection, or sidecar
summary is not enough. Submission to the board requires the postulate route to
bind real evidence refs and meet its readiness threshold.

Role examples:

```text
postulate runtime review -> self_terminal when route-approved
sidecar, crop, graph, or calculator refs in review context -> evidence_for_synthesis
unbound prior postulate draft in chat/panel state -> ambient_context
recommended next evidence task -> candidate_next_step
```

### Scientific Calculator

Calculator results and templates are observations until the route admits the
calculator terminal product. Template admissibility is not the same as
calculation-ready solve authority. The Scientific Calculator panel should show
calculation receipts/results when used, but the Ask visible answer still comes
from the terminal product selected by terminal authority.

Role examples:

```text
direct solved expression receipt/result -> self_terminal when route-approved
calculator output used inside a scientific explanation -> evidence_for_synthesis
existing calculator panel result from another route -> ambient_context
unbound calculator template, variables, or unit checklist -> candidate_next_step
```

### Workstation Notes

Note creation is a mutating workstation action. When the current route admits
`workstation-notes.create_note`, the terminal product may be a
`note_update_receipt` or allowed workstation action receipt. A successful note
receipt is enough to finish the note command when the route product contract
allows that receipt kind.

The note receipt must still be current-turn evidence. If the action exists only
as stale client state, pending UI context, or debug projection, it may help
diagnosis but it is not terminal authority. If persistence confirmation is
missing, the visible answer should say that narrowly instead of falling back to
`post_tool_model_step_missing`.

Role examples:

```text
admitted note creation/update receipt -> self_terminal when route-approved
note contents used to answer a later question -> evidence_for_synthesis
notes panel state visible but not requested -> ambient_context
suggested note title/body repair -> candidate_next_step
```

## Debug Expectations

Every successful terminal answer should make these fields agree:

```text
terminal_answer_authority.final_answer_source
terminal_answer_authority.terminal_artifact_kind
terminal_presentation.final_answer_source
terminal_presentation.terminal_artifact_kind
selected_final_answer
visible_final_answer
```

`terminal_presentation.concise_text` should be the full selected text.
`terminal_text_preview` may be shorter and should be treated as diagnostic.

If these disagree, classify the issue before patching:

```text
route authority mismatch
terminal product mismatch
preview selected instead of full presentation
client projection bypass
debug export mirror stale
sidecar admitted without route permission
tool receipt treated as answer
```

For a healthy tool-backed turn, the debug rail should be explainable in one
line:

```text
requested capability -> selected/admitted/executed capability
-> observation or receipt
-> route-approved terminal kind
-> terminal authority selected kind
-> visible projection matched kind
```

For a healthy plain-chat turn, the equivalent rail is:

```text
model-only route
-> direct answer/provider terminal allowed
-> terminal authority selected that product
-> visible projection matched it
```

If a plain-chat turn reports missing retrieval, or a Moral Graph turn surfaces a
scholarly missing-packet failure, terminal authority is not the first suspect.
First inspect intent/route admission and route-approved terminal kinds.

## Release Smoke Prompts

Use this compact smoke set before a public release or after touching route
authority, terminal materializers, provider projection, or client visible-answer
projection:

```text
Answer normally with no tools: what is 2+2?
```

Expected: normal model answer. No retrieval requirement.

```text
Explain the literal phrase `internet-search.search_web` as a software tool name. Do not browse, search, retrieve web evidence, or call tools.
```

Expected: normal explanation. No internet-search route or missing web-evidence
failure.

```text
Use the scientific calculator to solve 8*9. Report the result only.
```

Expected: calculator-backed terminal product with result `72` and no
prompt-contaminated expression.

```text
make a note for release smoke test
```

Expected: admitted note action and `note_update_receipt` or allowed workstation
receipt terminal. No generic post-tool missing-answer failure.

```text
Use the Moral Graph to help me reflect on a roommate situation where I need to be honest but not escalate conflict. Do not use calculator, image, PDF, page, scholarly, or web evidence.
```

Expected: Moral Graph or model reflection terminal for that route. No scholarly,
Image Lens, calculator, or sidecar failure leaks into the visible answer.

Passing this smoke set does not certify every tool. It proves the release
basics: plain chat works, explicit tools complete or fail in their own lane,
negated/quoted tool names do not execute, and the visible answer is one
route-approved terminal product.

## Patch Checklist

Before editing terminal authority or visible answer projection:

1. Identify the route product kind being added or repaired.
2. Confirm the route product contract explicitly allows that kind.
3. Confirm receipts/observations are not being treated as answers unless the
   route is a control/status/procedure command that allows receipt terminal.
4. Confirm the materializer only converts an admitted artifact; it does not
   admit the artifact.
5. Confirm terminal authority single writer selects one product.
6. Confirm `terminal_presentation.concise_text` carries the full visible answer.
7. Confirm preview/debug fields cannot replace the full answer.
8. Add a regression test for the route/product family changed.

Relevant checks:

```bash
npm run helix:ask:discipline:quick
npx vitest run server/__tests__/helix.ask.api-parity-matrix.test.ts --pool=forks
npx vitest run client/src/lib/helix/__tests__/ask-terminal-projection.spec.ts --pool=forks
```

Use the narrowest check that matches the changed contract. Live agent parity
must use the operator-started keyed localhost server.

## Key Files

```text
server/services/helix-ask/terminal-product-materializers.ts
server/services/helix-ask/terminal-authority-single-writer.ts
server/services/helix-ask/turn-terminal-authority.ts
server/services/helix-ask/terminal-answer-envelope.ts
server/services/helix-ask/terminal-presentation-coverage-audit.ts
client/src/components/helix/ask-console/HelixAskVisibleFinalAnswerSelection.ts
client/src/lib/helix/resolveHelixVisibleTerminal.ts
client/src/lib/agi/debugExport.ts
```
