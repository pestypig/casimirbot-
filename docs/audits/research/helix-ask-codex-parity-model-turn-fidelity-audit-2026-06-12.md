# Helix Ask Codex Parity Model-Turn Fidelity Audit

Date: 2026-06-12

Patch classification: follow-up reasoning, evidence re-entry, terminal authority,
debug trace policy.

Non-goal: this audit does not propose a private sampling loop, private tool
execution runtime, approval lifecycle, sandboxing, compaction, subagent
orchestration, or terminal completion machinery inside Helix Ask. Those remain
Codex-owned runtime behavior.

## Verdict

The current failure pattern should not be treated as a set of isolated tool
bugs. Deterministic rail tests are catching real policy problems, but they do
not prove Codex parity. Codex parity requires evidence that the model-facing
loop is actually driving tool choice, observing tool output, re-entering that
observation into the next model-visible turn, and reaching terminal answer only
after artifact-backed synthesis.

The next patch should therefore be a spine/audit patch, not another local
exception for one prompt family.

## Source Evidence

Helix's own loop discipline requires `agent_step_decision` to be produced from
model-visible state, and says classifiers, routes, planners, receipts, coverage
gates, and terminal artifacts may provide hints, constraints, observations, and
validation, but must not decide the next step by themselves:

- `docs/helix-ask-codex-loop-discipline.md`
- `docs/helix-ask-turn-solver-spine.md`
- `docs/helix-ask-api-parity-matrix.md`
- `docs/helix-ask-agentic-loop-current-overview.md`

The local Codex reference checkout supports the same boundary:

- `external/openai-codex-compare/codex-rs/core/src/client_common.rs` defines a
  model `Prompt` with `input: Vec<ResponseItem>` and model-visible
  `tools: Vec<ToolSpec>`.
- `external/openai-codex-compare/codex-rs/core/src/session/turn.rs` builds a
  per-turn router and sends `router.model_visible_specs()` into the sampling
  request.
- `external/openai-codex-compare/codex-rs/core/src/session/turn.rs` tracks
  `needs_follow_up` after tool calls or pending input, so tool output can drive
  another model step instead of ending as a private receipt.
- `external/openai-codex-compare/codex-rs/core/src/tools/context.rs` converts
  tool output into `ResponseInputItem::FunctionCallOutput`.
- `external/openai-codex-compare/codex-rs/core/src/agent/control.rs` treats
  `ResponseItem` variants such as `Reasoning`, `FunctionCall`,
  `FunctionCallOutput`, `CustomToolCallOutput`, and `ToolSearchOutput` as loop
  material.
- `external/openai-codex-compare/codex-rs/mcp-server/src/codex_tool_runner.rs`
  waits for `TurnComplete` before resolving a tool-runner request.

This comparison indicates that Codex parity is not just "a tool ran." The
stronger object is:

```txt
model-visible constraints and tools
-> model-authored decision or final assistant item
-> admitted tool execution when requested
-> model-visible tool output item
-> follow-up model decision or final assistant item
-> terminal lifecycle completion
```

## Assessment

The repeated Helix Ask failures are more likely Helix policy-wrapper and
state-shaping bugs than individual tool implementation bugs when debug evidence
shows no attempted tool calls or no tool-result re-entry.

Likely Helix-owned failure classes:

- stale `selectedCapability` or chosen action leaks into an unrelated turn
- a receipt or panel projection becomes visible answer authority
- route/classifier/planner state terminalizes before evidence re-entry
- deterministic fallback outranks fresh observation evidence
- model calls are present but decorative, post-hoc, or under-contextualized
- debug proves `llm_used` but not that the model saw the right tools,
  constraints, observations, and done condition
- current docs, repo, live-source, or internet evidence requirements are built
  procedurally but not exposed to the model at the decision point

Only assign responsibility to Codex/generic runtime if keyed trace evidence
shows one of these:

- the model emitted a valid tool call and the runtime dropped it
- tool output was produced but not converted into a model-visible response item
- a stream ended before required follow-up despite pending tool output
- registered tool specs were omitted from the model prompt
- function-call output was not appended into the next model sampling input

## Required Artifact

Introduce a first-class debug artifact:

```ts
type ModelTurnFidelityAuditV1 = {
  artifact_id: "model_turn_fidelity_audit";
  schema: "helix.model_turn_fidelity_audit.v1";

  llm_used: boolean;
  sampling_attempted: boolean;
  model_visible_tool_families: string[];
  model_visible_capabilities: string[];
  model_visible_constraints: string[];

  orientation: {
    goal_named: boolean;
    constraints_named: boolean;
    chosen_capability_named: boolean;
    expected_artifact_named: boolean;
    done_condition_named: boolean;
  };

  observation_reentry: {
    prior_observation_refs: string[];
    model_saw_observation: boolean;
    model_referenced_observation: boolean;
    missing_observation_refs: string[];
  };

  authority: {
    decision_source:
      | "llm"
      | "deterministic_policy_fallback"
      | "policy_override"
      | "typed_failure";
    policy_override_used: boolean;
    override_reason?: string;
  };

  terminal: {
    terminal_blocked_before_reentry: boolean;
    final_used_observed_artifact: boolean;
    stale_fallback_rejected: boolean;
  };
};
```

The artifact must distinguish:

- model-driven turn
- model present but insufficiently oriented
- deterministic controller-driven turn
- model violation repaired by policy override
- typed failure because parity evidence is incomplete

## Model Commentary Contract

For source-backed or tool-backed turns, a model-authored decision is fidelity
adequate only when it covers these orientation fields:

- user goal
- relevant constraints
- relevant tool family or capability surface
- chosen next step, or why no tool is admissible
- expected evidence artifact
- done condition
- what would trigger another step

After an observation, the next model turn must cover:

- observed artifact refs or result identity
- what the observation proves
- what remains missing, if anything
- whether terminal answer is now allowed
- next tool step or final-answer plan

Do not grade commentary by raw token count. Grade it by orientation coverage.

## Required Test Layers

Layer A: deterministic contract tests

- no receipt terminal by default
- no contextual, negated, historical, future, quoted, or screen-visible tool
  words becoming execution
- no stale fallback over fresh evidence
- no terminal before required artifact

Layer B: model-turn simulator tests

- fake model receives model-visible tool family contracts
- fake model receives source-target constraints
- fake model receives prior observation refs
- fake model chooses an admitted capability
- observation re-enters the next packet
- fake model chooses final only after the required artifact is present

Layer C: keyed model-loop trace tests

- server is started by the operator with keys
- `agent_step_decision.sampling.llm_used === true` where model parity is
  expected
- model commentary names goal, constraints, capability, expected artifact, and
  done condition
- tool request count and evaluation count are nonzero for tool prompts
- observation re-enters before terminal
- terminal authority selects an artifact-backed answer
- policy repairs are marked as repairs and do not count as model-driven parity

Layer D: Codex parity replay tests

- replay the keyed trace as a response-item sequence
- assert no hidden terminal answer before a model assistant item
- assert no tool output is missing from the next model-visible context
- assert no private router-only capability choice becomes authority
- assert every policy override carries an explicit non-parity status

## Flight Prompt Pack

Use these prompts against the user-started keyed server, not an unkeyed local
server:

```txt
Search docs for Helix Ask console debug and tell me which document path you found.
```

Expected: docs search capability selected, search observation produced, model
re-enters with the observation, final answer names the selected path.

```txt
Search docs for Helix Ask console debug, open the best matching doc, and summarize what it says about debug exports.
```

Expected: docs search, doc open/read, summary artifact, terminal summary. A doc
open receipt alone is insufficient.

```txt
Summarize /docs/research/nhm2-current-status-whitepaper-2026-05-02.md from docs in 5 bullets. Include the path.
```

Expected: exact-source docs summary contract, summary artifact, terminal answer
with the path. Document identity alone is insufficient.

```txt
I am not asking you to search docs; explain what "search docs" means as a UI phrase.
```

Expected: no docs search execution from quoted/negated tool words.

```txt
Summarize docs about NHM2 current status in 4 bullets. Include the path.
```

Expected: local docs source target, no internet-search substitution merely
because the phrase "current status" appears.

## Patch Direction

The next implementation patch should be:

```txt
Helix Ask Codex Parity Model-Turn Fidelity Audit v1
```

Required work:

1. Build a `model_turn_fidelity_audit` from existing debug surfaces:
   `agent_step_decision`, model-turn packet, model-turn result,
   `tool_use_restatement`, source-target intent, tool-family contract,
   runtime loop, observation ledger, evidence re-entry gate, goal satisfaction,
   and terminal authority.
2. Add the audit to Ask debug payloads and debug export.
3. Mark deterministic forced decisions as `policy_override` when they repair a
   model violation or replace a missing model decision.
4. Add simulator tests proving model-visible constraints and observations reach
   the next decision packet.
5. Add keyed trace acceptance criteria that cannot pass on `llm_used` alone.

## Completion Criteria

A turn may be called Codex-parity model-driven only when all of these are true:

- model-visible context includes the relevant tools, constraints, prior
  observations, and done condition
- the model-authored decision chooses or declines the next step under those
  constraints
- admitted tool output re-enters as model-visible observation before terminal
- the post-observation model turn references or consumes the observation
- terminal authority selects an artifact-backed answer
- no deterministic repair was needed

If a deterministic repair is needed, the turn may still be safe, but the debug
status must be `repaired_not_model_driven`.

## Responsibility Call

The contracts and deterministic rails are necessary. The current weakness is
that model-turn fidelity is not yet a first-class tested artifact. The likely
owner is the Helix Ask policy spine: source admission, capability surface
shaping, observation identity, evidence re-entry, goal satisfaction, terminal
eligibility, and debug proof.

The north-star checks are:

```txt
No model-visible context, no parity.
No observation re-entry, no parity.
No model-authored next step after observation, no parity.
No terminal answer before artifact-backed synthesis, no authority.
```
