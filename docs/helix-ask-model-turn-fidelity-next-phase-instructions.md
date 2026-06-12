# Helix Ask Model-Turn Fidelity Next Phase Instructions

Date: 2026-06-12

Use after:

- `docs/audits/research/helix-ask-codex-parity-model-turn-fidelity-audit-2026-06-12.md`
- `docs/helix-ask-codex-loop-discipline.md`
- `docs/helix-ask-turn-solver-spine.md`
- `docs/helix-ask-api-parity-matrix.md`

## Objective

Pivot Helix Ask patching from one-off tool repairs to Codex-parity
model-turn fidelity. The goal is to prove that source-backed and tool-backed
Ask turns are model-oriented, model-decided, observation-reentered, and
artifact-terminal, not merely procedurally routed.

The patch loop must practice the keyed runtime path:

```txt
Codex patches
-> Codex stops
-> operator restarts keyed server
-> keyed in-app browser prompt test
-> debug export assessment
-> next patch or pass verdict
```

Codex must not start or restart the keyed Helix server. The operator owns the
server process and keys.

## Patch Classification

Classify each implementation checkpoint before editing as one or more of:

- prompt interpretation
- intent arbitration
- source admission
- tool admission
- evidence normalization
- evidence re-entry
- follow-up reasoning
- terminal authority
- presentation
- Codex-owned runtime behavior

Stop if the patch would implement a private sampling loop, private generic tool
execution runtime, sandbox/approval lifecycle, compaction, subagent
orchestration, or terminal completion machinery. Those are Codex-owned runtime
behavior. Helix may expose policy context and audit proof around those mechanics.

## Checkpoint Discipline

Each checkpoint should be small enough to test with the same keyed flight prompt
pack.

1. Patch one spine layer.
2. Run deterministic local checks that do not require keys.
3. Run `npm run helix:ask:discipline:quick`.
4. If code changed, attempt Casimir verify only against the operator-provided
   running server URL. Do not start a replacement server.
5. Stop and tell the operator exactly what changed and whether a server restart
   is required.
6. Operator restarts the keyed server on port `1498`.
7. Run the in-app browser flight prompts.
8. Export debug evidence.
9. Classify the result as `model_driven_pass`, `safe_policy_repair`,
   `deterministic_only_fail`, `missing_reentry_fail`, `terminal_authority_fail`,
   or `runtime_drop_suspected`.

If the server cannot be reached, report `verification_blocked_server_unreachable`
and do not substitute an unkeyed local server.

## Checkpoint 1: Fidelity Audit Artifact

Implement `helix.model_turn_fidelity_audit.v1`.

Inputs:

- `agent_step_decision`
- model-turn packet and result
- `tool_use_restatement`
- `source_target_intent`
- tool-family contract
- runtime loop iterations
- current-turn artifact ledger
- observation packets
- evidence re-entry status
- goal satisfaction
- terminal authority

Required output fields:

```txt
llm_used
sampling_attempted
model_visible_tool_families
model_visible_capabilities
model_visible_constraints
orientation.goal_named
orientation.constraints_named
orientation.chosen_capability_named
orientation.expected_artifact_named
orientation.done_condition_named
observation_reentry.prior_observation_refs
observation_reentry.model_saw_observation
observation_reentry.model_referenced_observation
observation_reentry.missing_observation_refs
authority.decision_source
authority.policy_override_used
authority.override_reason
terminal.terminal_blocked_before_reentry
terminal.final_used_observed_artifact
terminal.stale_fallback_rejected
```

Pass condition:

- Debug export includes the audit object for every source-backed or tool-backed
  turn.
- `llm_used=true` alone does not pass the audit.
- Deterministic fallback and policy override are visible and distinguishable.

## Checkpoint 2: Model-Visible Context Builder

Make the decision context inspectable before model choice.

The model-visible packet must include:

- user goal
- source-target admission result
- relevant negative/contextual constraints
- available tool families and capabilities
- tool-family contract summaries
- required observation kinds
- forbidden terminal products
- prior observation refs
- done condition

Pass condition:

- Simulator tests prove a fake model receives tool contracts and source-target
  constraints before choosing a capability.
- Keyed debug shows the real model commentary names the goal, constraint,
  capability surface, expected artifact, and done condition.

## Checkpoint 3: Observation Re-Entry Proof

Make tool output re-entry explicit and testable.

Required proof:

- runtime tool call produced an observation artifact
- observation artifact was selected or rejected by evidence re-entry
- next model-turn packet includes selected observation refs
- next model commentary references or consumes the observation
- terminal is blocked until this chain exists for source-backed answers

Pass condition:

- Search/open/summarize docs prompts cannot answer from a search receipt or open
  receipt alone.
- A post-observation model turn is visible before terminal answer.

## Checkpoint 4: Policy Override Semantics

Keep deterministic guardrails, but stop counting repairs as model-driven parity.

Required labels:

```txt
decision_source: llm | deterministic_policy_fallback | policy_override | typed_failure
parity_status: model_driven_pass | repaired_not_model_driven | deterministic_only_fail
```

Pass condition:

- Forced mandatory-tool decisions are safe but labeled as policy repairs unless
  the model selected them under model-visible constraints.
- A repaired turn can pass safety, but cannot pass Codex parity.

## Checkpoint 5: Keyed Trace Acceptance

A keyed model-loop trace passes only when:

- `agent_step_decision.sampling.llm_used === true`
- model-visible context includes tools, constraints, prior observations, and done
  condition
- model commentary names the goal, constraints, capability, expected artifact,
  and done condition
- tool request count and evaluation count are nonzero for tool prompts
- tool output re-enters before terminal
- post-observation model turn consumes the observation
- terminal authority selects an artifact-backed answer
- no deterministic repair was needed for the pass verdict

If any deterministic repair occurs, classify the turn as `safe_policy_repair`.

## Flight Prompt Pack

Run these same prompts after each checkpoint restart.

### Prompt A: Docs Search Path

```txt
Search docs for Helix Ask console debug and tell me which document path you found.
```

Expected path:

```txt
model sees docs capability
-> model chooses docs search
-> docs search observation
-> model re-enters with search result
-> terminal answer names path
```

Primary failure signatures:

- `line_tool_request_count: 0`
- `line_tool_evaluation_count: 0`
- stale non-docs capability selected
- terminal answer without docs observation

### Prompt B: Docs Search Open Summary

```txt
Search docs for Helix Ask console debug, open the best matching doc, and summarize what it says about debug exports.
```

Expected path:

```txt
search docs
-> open/read best doc
-> summary artifact
-> post-observation model synthesis
-> terminal summary
```

Primary failure signatures:

- open receipt treated as summary
- search results terminalize without open/read
- summary artifact missing
- terminal authority selects stale fallback

### Prompt C: Exact Path Summary

```txt
Summarize /docs/research/nhm2-current-status-whitepaper-2026-05-02.md from docs in 5 bullets. Include the path.
```

Expected path:

```txt
exact docs path contract
-> read/summarize exact source
-> summary artifact
-> terminal answer includes path
```

Primary failure signatures:

- document identity satisfies summary
- internet search selected from "current status"
- neighboring source substituted
- no exact-source evidence hash or stable artifact id

### Prompt D: Negated Tool Mention

```txt
I am not asking you to search docs; explain what "search docs" means as a UI phrase.
```

Expected path:

```txt
quoted/negated docs phrase recorded as context
-> no docs search execution
-> answer explains phrase only if route allows no-tool direct
```

Primary failure signatures:

- docs search executes from quoted or negated cue
- mutation/control admission from contextual text

### Prompt E: Local Docs Current Status

```txt
Summarize docs about NHM2 current status in 4 bullets. Include the path.
```

Expected path:

```txt
local docs topic summary
-> docs search/read
-> summary artifact
-> terminal answer includes path
```

Primary failure signatures:

- internet search selected merely because of "current status"
- broad docs topic satisfied by non-summary artifact
- stale workspace capability overrides docs capability

## Debug Export Review Template

For each prompt, record:

```txt
prompt:
server_url:
turn_id:
final_text:
classification:

agent_step_decision.sampling.llm_used:
agent_step_decision.chosen_capability:
model_turn_fidelity_audit.authority.decision_source:
model_turn_fidelity_audit.parity_status:
model_turn_fidelity_audit.orientation:
model_turn_fidelity_audit.observation_reentry:
model_turn_fidelity_audit.terminal:

line_tool_request_count:
line_tool_evaluation_count:
runtime_loop.iteration_count:
runtime_loop.llm_decision_count:
runtime_loop.policy_override_count:

selected_observation_refs:
terminal_artifact_kind:
terminal_answer_authority.ok:
route_authority_audit.route_authority_ok:
poison_audit.ok:

verdict:
next_patch_responsibility:
```

## Verdict Labels

Use exactly these labels during the patch loop:

- `model_driven_pass`: model saw constraints/tools/observations and selected the
  valid next step and terminal answer without repair.
- `safe_policy_repair`: deterministic policy prevented an unsafe or incomplete
  model path, but the turn does not count as Codex parity.
- `deterministic_only_fail`: the route completed without meaningful model
  orientation where model parity was expected.
- `missing_reentry_fail`: a tool result existed but the next model turn did not
  receive or use it.
- `terminal_authority_fail`: terminal answer used a receipt, stale fallback,
  route summary, panel projection, or unsupported artifact.
- `runtime_drop_suspected`: model emitted a valid tool call but runtime did not
  execute it or did not return output to the model-visible context.

## Stop Points

Stop and ask the operator to restart the keyed server after:

- any server-side TypeScript change
- any route/product contract change
- any debug export schema change
- any model-turn packet or executor change
- any evidence re-entry or terminal authority change

Do not continue into keyed browser testing until the operator confirms the
server has been restarted with keys on port `1498`.

## Handoff Format

After each patch checkpoint, report:

```txt
changed files:
classification:
local checks:
Casimir verify:
server restart required:
flight prompts to run:
expected debug acceptance:
known limitations:
```

If Casimir verify cannot reach the operator server, report:

```txt
Casimir verify: BLOCKED, server endpoint unreachable at http://localhost:1498
certificateHash: unavailable
integrityOk: unavailable
```
