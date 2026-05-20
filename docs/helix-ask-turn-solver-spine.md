# Helix Ask Turn Solver Spine MVP

Helix Ask uses a procedural solver spine to explain how an Ask turn reached its terminal product. The spine is a Helix policy trace, not a private Codex runtime loop.

Codex still owns generic runtime mechanics: model sampling, tool execution, result re-entry, retries, approvals, sandboxing, compaction, session lifecycle, subagent orchestration, and terminal turn completion.

Helix Ask owns the policy wrapper around route execution:

1. Prompt interpretation.
2. Intent hypotheses.
3. Primary and secondary intent arbitration.
4. Source and tool admission candidates.
5. Evidence requests and evidence results.
6. Evidence re-entry.
7. Follow-up reasoning and final arbitration.
8. Route authority, poison audit, and terminal authority.

The trace schema is `helix.ask_turn_solver_trace.v1`. It is attached to debug Ask responses as `ask_turn_solver_trace`, included in `/api/agi/ask/turn/:turnId/debug-export`, and mirrored into the debug envelope when present.

## Authority Rules

Routes are proposed procedures, not conclusions. A selected route becomes answer authority only after the solver trace records final arbitration and the route-authority audit passes.

Receipts are observations, not answers. A receipt can be terminal only when the primary intent is an admitted control command and the route product contract allows that receipt kind.

Classifiers generate hypotheses, not authority. Intent hypotheses are evidence for arbitration; they do not directly choose the terminal product.

Only the completed solver path can answer. The trace reports `completed_solver_path` for compatibility and records `route_authority_ok`, `poison_audit_ok`, and `terminal_authority_ok` as first-class fields.

## Contextual Control Mentions

Contextual and negated control language is recorded under `prompt_interpretation.contextual_tool_mentions` and `prompt_interpretation.negative_constraints`. For example:

`Can you review what is happening in the screen capture? I haven't started the interval 10 seconds yet.`

The primary intent is `content_question`. The interval mention is context, `executable_operator_commands` is empty, and `live_pipeline_receipt` is not eligible as the terminal answer. If a mutating tool is still called, the trace emits `contextual_tool_mention_executed`.

## Debug Contract

Trace artifacts always carry:

- `assistant_answer: false`
- `raw_content_included: false`

Missing or suspicious solver pieces should not crash the turn. They should surface as `solver_risk_flags` so parity tests and debug exports can show where the route-first behavior still needs to be replaced by full solver arbitration.
