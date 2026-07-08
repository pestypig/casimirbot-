# Helix Ask Turn Solver Spine

Helix Ask uses a procedural solver spine to explain how an Ask turn reached its terminal product. The spine is a Helix policy trace, not a private Codex runtime loop.

Codex owns model sampling, generic tool execution, tool-result re-entry, retries, approvals, sandboxing, compaction, session lifecycle, subagent orchestration, and terminal completion.

Helix Ask owns the policy wrapper around route execution:

1. Prompt interpretation.
2. Intent hypotheses.
3. Primary and secondary intent arbitration.
4. Source and tool admission candidates.
5. Evidence requests and evidence results.
6. Evidence re-entry.
7. Follow-up reasoning and final arbitration.
8. Route authority, poison audit, and terminal authority.

Helix Ask owns prompt interpretation policy, intent arbitration, source-target admission, evidence identity, provenance, proof gates, route/product contracts, route authority, terminal eligibility, and debug traces.

The trace schema is `helix.ask_turn_solver_trace.v1`. It is attached to debug Ask responses as `ask_turn_solver_trace`, included in `/api/agi/ask/turn/:turnId/debug-export`, and mirrored into the debug envelope when present.

For the visible-answer handoff, also follow
`docs/helix-ask-terminal-authority-contract.md`. That contract defines how
explicit route-product allowances, terminal product materializers, terminal
authority single-writer selection, terminal presentation, and debug/UI
projection fit together.

## Authority Rules

Routes are proposed procedures, not conclusions. A selected route becomes answer authority only after the solver trace records final arbitration and the route-authority audit passes.

Receipts are observations, not answers. A receipt can be terminal only when the primary intent is an admitted control/status/procedure command and the route product contract allows that receipt kind.

Classifiers generate hypotheses, not authority. Intent hypotheses are evidence for arbitration; they do not directly choose the terminal product.

Only the completed solver path can answer. The trace reports `completed_solver_path` for compatibility and records `route_authority_ok`, `poison_audit_ok`, and `terminal_authority_ok` as first-class fields.

Terminal product materializers are conversion helpers, not admission helpers.
They may turn an admitted artifact into terminal text only when the current
route/product contract explicitly allows that product kind. Legacy permissive
helpers may remain for compatibility, but new route products should use the
explicit allowance path.

`terminal_answer_authority.terminal_text_preview` is diagnostic preview text.
The full visible answer should come from `terminal_presentation.concise_text`
when terminal authority is verified. UI and debug projection must not replace
that full presentation with a preview.

## Hard Gates

Hard source-targeted and complex prompts must fail closed when solver authority is incomplete. The hard-gate schema is `helix.ask_turn_solver_hard_gate.v1`.

Stable failure codes:

```txt
solver_trace_missing
intent_arbitration_missing
classifier_became_decision
route_selected_before_intent_arbitration
contextual_tool_mention_executed
receipt_terminal_without_reentry
missing_followup_reasoning
terminal_authority_before_solver_completion
poison_clean_but_authority_failed
route_contract_missing
hard_source_target_allowed_no_tool_direct
```

The gate must not block pure control/status receipt turns when the solver trace explicitly marks the receipt as allowed. It must block receipt terminal products for content, debug, repo, visual, or procedure prompts unless the completed solver path and route/product contract authorize that product.

In debug and test mode, include full hard-gate details. In production/non-debug, fail closed with `typed_failure` rather than presenting a forbidden terminal product.

## Patch-Time Checklist

Before editing Helix Ask, classify the change as one of:

```txt
prompt interpretation
intent arbitration
source admission
tool admission
evidence normalization
evidence re-entry
follow-up reasoning
terminal authority
presentation
Codex-owned runtime behavior
```

Reject or flag changes that implement:

```txt
private sampling loop
private tool execution runtime
sandbox/approval lifecycle
session compaction
subagent orchestration
terminal completion machinery
```

Every shortcut-like rule must include adversarial tests for:

```txt
contextual cue
negated cue
future/conditional cue
historical cue
quoted/screen-visible cue
mixed intent prompt
```

## Contextual Control Mentions

Contextual and negated control language is recorded under `prompt_interpretation.contextual_tool_mentions` and `prompt_interpretation.negative_constraints`. For example:

```txt
all right cool can you review what is happening right now in the screen capture I haven't started the interval 10 seconds yet
```

The primary intent is `content_question`. The interval mention is context, `executable_operator_commands` is empty, and `live_pipeline_receipt` is not eligible as the terminal answer. If a mutating tool is still called, the trace emits `contextual_tool_mention_executed`.

## Debug Contract

Trace artifacts always carry:

- `assistant_answer: false`
- `raw_content_included: false`

Missing or suspicious solver pieces should not crash the turn. They should surface as `solver_risk_flags` so parity tests and debug exports can show where the route-first behavior still needs to be replaced by full solver arbitration.

Required regression tests:

```bash
npx vitest run server/__tests__/helix.ask.prompt-solving-benchmark.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.api-parity-matrix.test.ts --pool=forks
```
