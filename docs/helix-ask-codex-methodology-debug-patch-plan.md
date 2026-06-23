# Helix Ask Codex Methodology Debug Patch Plan

Status: patch instructions.

Source run:

- Full batch: `artifacts/helix-ask-codex-methodology-debug/codex-methodology-1782162690376/summary.json`
- Focused confirmation batch: `artifacts/helix-ask-codex-methodology-debug/codex-methodology-1782164627650/summary.json`
- Prompt set: `scripts/helix-ask-codex-methodology-debug-set.json`
- Runner: `scripts/helix-ask-codex-methodology-debug-batch.ts`

Patch classification:

- `prompt interpretation`
- `intent arbitration`
- `source admission`
- `tool admission`
- `evidence normalization`
- `evidence re-entry`
- `follow-up reasoning`
- `terminal authority`
- `presentation`

Do not classify this patch as `Codex-owned runtime behavior`. Do not add a
private sampling loop, private tool execution runtime, sandbox/approval
lifecycle, session compaction, subagent orchestration, or terminal completion
machinery in Helix Ask.

## Codex Methodology Anchor

Use the ignored local Codex reference checkout only as a methodology contrast.
Do not mutate or commit `external/openai-codex-compare`.

Codex's turn loop makes the relevant boundary explicit:

- `external/openai-codex-compare/codex-rs/core/src/session/turn.rs:128`
  records the rule that when the model requests a function call, Codex executes
  it and sends the output back to the model in the next sampling request.
- `external/openai-codex-compare/codex-rs/core/src/session/turn.rs:130`
  records the complementary terminal condition: only an assistant message alone
  is recorded as a complete turn.
- `external/openai-codex-compare/codex-rs/core/src/session/turn.rs:1852`
  handles each model output item, then `:1860` queues tool futures and `:1866`
  accumulates `needs_follow_up`.
- `external/openai-codex-compare/codex-rs/core/src/session/turn.rs:2134`
  drains in-flight tool work before token/turn finalization; `:2137` notes
  tool calls such as `request_user_input` may intentionally pause a turn.

Codex's MCP bridge keeps the same ordering:

- `external/openai-codex-compare/codex-rs/mcp-server/src/codex_tool_runner.rs:55`
  describes running a complete Codex session and streaming events back.
- `external/openai-codex-compare/codex-rs/mcp-server/src/codex_tool_runner.rs:57`
  states completion or error sends the `tools/call` response so the LLM can
  continue.
- `external/openai-codex-compare/codex-rs/mcp-server/src/codex_tool_runner.rs:225`
  forwards exec approval requests through the runtime, not a route shortcut.
- `external/openai-codex-compare/codex-rs/mcp-server/src/codex_tool_runner.rs:283`
  forwards patch approval requests through the runtime.
- `external/openai-codex-compare/codex-rs/mcp-server/src/codex_tool_runner.rs:306`
  resolves the MCP response on `TurnComplete`.

Codex execution and mutation safety are generic runtime concerns:

- `external/openai-codex-compare/codex-rs/core/src/tools/handlers/unified_exec/exec_command.rs:165`
  checks execution permission features.
- `external/openai-codex-compare/codex-rs/core/src/tools/handlers/unified_exec/exec_command.rs:181`
  rejects sandbox override requests unless approval policy allows them.
- `external/openai-codex-compare/codex-rs/core/src/tools/handlers/unified_exec/exec_command.rs:251`
  sends normalized execution requests through `exec_command`.
- `external/openai-codex-compare/codex-rs/core/src/apply_patch.rs:38`
  assesses patch safety before runtime delegation, while `:57` delegates user
  approval to the tool runtime.

The correct Helix patch posture is therefore:

```txt
routes propose procedures
tool admission records allowed/blocked capability choices
runtime tools produce observations
observations re-enter reasoning
goal satisfaction determines whether follow-up is needed
terminal authority selects one visible answer, request_user_input, or typed_failure
```

## Failure 1: Docs Open Becomes Model-Only Debug Diagnosis

Observed:

- Scenario: `atomic_docs_open`
- Prompt: `Open the docs viewer, then explain whether opening the viewer is a receipt or a final answer.`
- Runtime actual: `model.direct_answer`
- Selected/admitted: `workstation.restore_view_state`, `diagnose_debug_or_runtime_evidence`
- Missing: `docs-viewer.open`
- Terminal: `model_synthesized_answer`
- Source target: `model_only`
- Solver incomplete: `completed_solver_path=false`

Patch objective:

An affirmative operator command to open the docs viewer must not be reclassified
as a debug diagnosis merely because the prompt also asks about receipt
semantics. It is a mixed control/status plus explanation turn. The docs open
capability should be admitted or the turn should fail closed with a typed docs
operation reason.

Instructions:

1. In prompt interpretation, separate the affirmative operator command
   `Open the docs viewer` from the explanatory clause.
2. In intent arbitration, set the primary intent to a docs/workstation
   operation when an affirmative docs-open command is present.
3. In tool admission, admit `docs-viewer.open` or a canonical equivalent
   docs-viewer operation. Do not route this scenario to
   `diagnose_debug_or_runtime_evidence`.
4. Convert the open result into an observation or receipt with
   `assistant_answer=false` and `terminal_eligible=false` unless the route
   product contract explicitly allows a control/status receipt.
5. Run follow-up reasoning after the docs open observation to answer whether
   the receipt was terminal authority.
6. Terminal authority must select either a docs operation receipt allowed by the
   route contract, a model-synthesized answer grounded in the receipt, or a
   typed failure. It must not present model-only text if no docs operation ran.

Regression expectations:

- `runtime_observed_capabilities` includes `docs-viewer.open`.
- `source_target` is not `model_only`.
- `ask_turn_solver_trace.completed_solver_path=true`, unless the terminal is a
  typed failure with a stable docs-operation reason.
- No `debug_diagnosis` primary intent for this prompt.

Suggested tests:

```bash
npx vitest run server/__tests__/helix.ask.prompt-solving-benchmark.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.api-parity-matrix.test.ts --pool=forks
HELIX_ASK_CODEX_DEBUG_SCENARIOS=atomic_docs_open npm run helix:ask:codex-methodology-debug
```

## Failure 2: Micro Reasoner Preset Query Aborts

Observed:

- Scenario: `atomic_micro_reasoner_presets`
- Prompt: `Use live_env.query_micro_reasoner_presets to inspect the micro reasoner preset catalog.`
- Failure: `This operation was aborted`
- No stable turn/debug summary was produced by the runner for this scenario.

Patch objective:

Read-only micro-reasoner catalog queries must either produce a bounded
observation and follow-up decision or fail closed with a stable typed reason.
They must not hang until client abort without a useful debug artifact.

Instructions:

1. Treat `live_env.query_micro_reasoner_presets` as read-only evidence.
2. Add or fix a bounded runtime path for this capability so it has a timeout,
   lifecycle trace, and stable error mapping.
3. Ensure the debug export records at least:
   `tool_lifecycle_trace`, `tool_followup_decision`,
   `agent_step_observation_packet` or typed failure,
   `terminal_answer_authority`, and `terminal_presentation`.
4. If the live environment is unavailable, return a typed failure with
   `external_change_required=true` and a stable code such as
   `micro_reasoner_presets_unavailable` or the existing closest canonical code.
5. Do not implement a private polling loop in Helix Ask. If polling is needed,
   express it as a tool follow-up decision (`poll`, `ask_user`, or
   `terminal_failure`) and let the shared runtime loop execute the next step.

Codex contrast:

Codex drains in-flight tools before finishing a turn
(`turn.rs:2134`) and reports cancellation explicitly (`turn.rs:2144`). Helix
should mirror that diagnostic shape in policy/debug fields, not by owning
generic cancellation mechanics.

Regression expectations:

- The scenario returns before the runner timeout.
- If successful, `runtime_observed_capabilities` includes
  `live_env.query_micro_reasoner_presets`.
- If unavailable, `terminal_artifact_kind=typed_failure` with a stable
  micro-reasoner/live-environment code.
- No raw abort string is the only failure evidence.

Suggested tests:

```bash
npx vitest run server/__tests__/helix.ask.live-environment-agent-loop.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.api-parity-matrix.test.ts --pool=forks
HELIX_ASK_CODEX_DEBUG_SCENARIOS=atomic_micro_reasoner_presets npm run helix:ask:codex-methodology-debug
```

## Failure 3: Negated Calculator Cue Enters Admission Rail

Observed:

- Scenario: `guard_negated_calculator`
- Prompt: `Do not call scientific-calculator.solve_expression. Explain why calculator receipts are observations rather than final answers.`
- Actual executed calls: none.
- Selected/admitted candidates still include `scientific-calculator.solve_expression`.
- Terminal: `typed_failure`
- Error: `missing_followup_reasoning`
- Route violation: `missing_followup_reasoning`
- Rail class: `explicit_capability_demoted`
- Repair target: `intent_arbitration`

Patch objective:

A negated calculator cue should be recorded as a contextual or forbidden tool
mention, not as requested/admitted capability. The turn should answer the
conceptual policy question through model/direct explanation or repo-backed
policy evidence, without executing or admitting calculator.

Instructions:

1. In prompt interpretation, classify `Do not call
   scientific-calculator.solve_expression` as a negative constraint and
   contextual tool mention.
2. In intent arbitration, set primary intent to policy explanation or debug
   diagnosis, not calculator operation.
3. In tool admission, put `scientific-calculator.solve_expression` in rejected
   or forbidden capability fields, not requested/admitted fields.
4. Keep debug explicit:
   `contextual_tool_mentions` includes calculator cue,
   `negative_constraints` includes the no-call constraint,
   `executable_operator_commands=[]`.
5. Produce a normal answer explaining receipt semantics, or route to repo/docs
   evidence if the implementation-specific policy must be cited.
6. Do not fail with `missing_followup_reasoning` when the expected next step is
   direct explanatory answer.

Codex contrast:

Codex does not execute a tool because a word appears in the prompt. A tool call
is an explicit model output item handled as a tool future (`turn.rs:1852` to
`:1866`). Helix should preserve the same boundary: lexical cue is evidence for
interpretation, not execution or admission.

Regression expectations:

- `actual_observed_capabilities=[]` for calculator.
- `selected_or_admitted_capabilities` does not include
  `scientific-calculator.solve_expression`.
- `forbidden_selected_or_admitted_capabilities=[]`.
- `terminal_artifact_kind` is `model_synthesized_answer`,
  `direct_answer_text`, or allowed repo/docs evidence answer.
- `route_authority_ok=true`.

Suggested tests:

```bash
npx vitest run server/__tests__/helix.ask.prompt-solving-benchmark.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.debug-lexical-cue.test.ts --pool=forks
HELIX_ASK_CODEX_DEBUG_SCENARIOS=guard_negated_calculator npm run helix:ask:codex-methodology-debug
```

## Failure 4: Internet Compound Stops After First Capability

Observed:

- Scenario: `compound_internet_reflection_calculator`
- Prompt asks for internet search, theory reflection, and calculator.
- Actual executed capability: `internet-search.search_web`.
- Missing: `helix_ask.reflect_theory_context`,
  `scientific-calculator.solve_expression`.
- Terminal: `request_user_input`
- Route authority: `terminal_product_authority_mismatch`
- Rail class: `observation_missing`
- Rail failure: `required_observation_missing`
- Repair target: `observation_materializer`

Patch objective:

Compound turns must not stop after the first admitted capability unless the
first capability has a typed blocker that legitimately prevents remaining
subgoals. Search output must become an observation, then re-enter follow-up
reasoning to decide whether to run reflection and calculator or fail closed with
the first blocked subgoal.

Instructions:

1. Ensure compound subgoal extraction records all requested capabilities:
   internet search, theory reflection, and calculator.
2. After internet search admission/execution, normalize its result into
   `agent_step_observation_packet` with `assistant_answer=false` and
   `terminal_eligible=false`.
3. Run goal satisfaction per subgoal and globally:
   the first subgoal may be satisfied, but the compound goal is not satisfied
   until reflection and calculator subgoals are complete or explicitly blocked.
4. Add a follow-up decision:
   `continue_reasoning` when search evidence exists,
   `alternate_probe` when search shape is wrong,
   `ask_user` only when the next required input is genuinely missing,
   `terminal_failure` when provider/config blocks continuation.
5. Do not terminalize as `request_user_input` merely because internet search
   produced an incomplete observation. The request must name the missing
   operator input, if any.
6. Record `compound_subgoal_rails` for each subgoal, including missing
   subgoal id, first broken rail, failure code, and repair target.

Codex contrast:

Codex sends function-call output back into the next sampling request before
terminal completion (`turn.rs:128` to `:131`) and resolves MCP `tools/call` only
after `TurnComplete` (`codex_tool_runner.rs:306`). The Helix fix should preserve
that shape with policy traces: observation -> re-entry -> next-step decision ->
terminal authority.

Regression expectations:

- `compound_subgoal_count>=3`.
- `compound_subgoal_rails` include internet search, theory reflection, and
  calculator.
- If all tools are available, all three subgoals reach `rail_status=complete`.
- If a provider/search blocker occurs, terminal is `typed_failure` with the
  first blocked subgoal named; not generic `request_user_input`.
- `route_authority_ok=true` for complete or valid fail-closed outcomes.

Suggested tests:

```bash
npx vitest run server/__tests__/helix.ask.compound-capability-synthesis.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.compound-capability-family-matrix.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.api-parity-matrix.test.ts --pool=forks
HELIX_ASK_CODEX_DEBUG_SCENARIOS=compound_internet_reflection_calculator npm run helix:ask:codex-methodology-debug
```

## Shared Implementation Instructions

For every patch above:

1. Preserve the `Codex-owned runtime` boundary. Do not add generic sampling,
   execution, approval, compaction, or terminal-completion machinery.
2. Update Helix-owned policy only: prompt interpretation, source/tool admission,
   evidence normalization, evidence re-entry, follow-up reasoning, route
   authority, terminal eligibility, and debug traces.
3. Add adversarial tests for contextual, negated, future/conditional,
   historical, quoted/screen-visible, and mixed-intent prompts when touching
   shortcut-like admission rules.
4. Keep receipts and observations non-terminal unless the route product
   contract explicitly allows a control/status receipt terminal.
5. Make debug export sufficient for postmortem:
   `source_target_intent`, `tool_call_admission_decision`,
   `agent_step_decision`, `runtime_tool_call`,
   `agent_step_observation_packet`, `goal_satisfaction_evaluation`,
   `tool_lifecycle_trace`, `tool_followup_decision`,
   `compound_subgoal_rail_statuses`, `route_product_contract`,
   `route_authority_audit`, `terminal_answer_authority`,
   and `terminal_presentation`.
6. The visible answer must match terminal authority. Do not write
   `payload.text`, `payload.answer`, `selected_final_answer`, or
   presentation text from a receipt, classifier, route label, debug diagnosis,
   or client projection before terminal authority.

## Verification Plan

Static and deterministic checks:

```bash
npm run helix:ask:discipline:quick
npx vitest run server/__tests__/helix.ask.prompt-solving-benchmark.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.api-parity-matrix.test.ts --pool=forks
```

Targeted checks by touched surface:

```bash
npx vitest run server/__tests__/helix.ask.debug-lexical-cue.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.compound-capability-synthesis.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.compound-capability-family-matrix.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.live-environment-agent-loop.test.ts --pool=forks
```

Live keyed-server confirmation:

```bash
$env:HELIX_ASK_BASE_URL="http://localhost:1498"
$env:HELIX_ASK_CODEX_DEBUG_SCENARIOS="atomic_docs_open,atomic_micro_reasoner_presets,guard_negated_calculator,compound_internet_reflection_calculator"
npm run helix:ask:codex-methodology-debug
```

Acceptance bar:

- All four targeted scenarios pass, or any remaining failure is a typed,
  route-authority-valid fail-closed result with a stable blocker code.
- No scenario reports `poison_clean_but_authority_failed`.
- No scenario reports `terminal_product_authority_mismatch`.
- No negated/contextual prompt admits or executes the named forbidden tool.
- Compound prompts expose subgoal rails for every requested capability.

Casimir verification:

Do not run Casimir verification for a pure Helix Ask routing/debug patch unless
the implementation touches warp/GR physics, adapter contracts, constraint
packs, training-trace export/capture, certificate semantics, CI/release
verification, or proof-maturity surfaces.
