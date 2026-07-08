# Helix Ask Terminal Authority Contract

Status: operational contract.

This contract defines how Helix Ask turns become visible answers. It is the
handoff point between route/tool evidence and what the user sees in the Ask
chat.

## Core Rule

Only one terminal product may become the visible answer for a turn.

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

## Product Examples

### Image Lens

An Image Lens crop request may terminate as `image_lens_observation_report` only
when the route product contract allows that report. Otherwise, the crop receipt
is an observation that must re-enter reasoning or fail closed.

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

### Postulate Board

`/postulate` must produce a `postulate_runtime_review` or a typed failure. The
review is the terminal product; a prompt draft, graph reflection, or sidecar
summary is not enough. Submission to the board requires the postulate route to
bind real evidence refs and meet its readiness threshold.

### Scientific Calculator

Calculator results and templates are observations until the route admits the
calculator terminal product. Template admissibility is not the same as
calculation-ready solve authority. The Scientific Calculator panel should show
calculation receipts/results when used, but the Ask visible answer still comes
from the terminal product selected by terminal authority.

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

