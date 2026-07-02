# Helix Ask Codex Boundary Audit

Status: active audit notes for workstation tool planning and compound capability planning.

## Boundary Rule

Codex owns step sequencing after observations re-enter the model. Helix Ask owns capability admission, provenance, observation normalization, typed affordances, proof gates, and terminal authority.

The practical rule for planner code is:

```txt
admit one requested capability or source observation
-> return observation plus next_affordances
-> Codex chooses the next call
```

Helix may block invalid calls, but it should not walk a reasoning chain on Codex's behalf.

## Current Findings

| Area | Risk | Current Status |
| --- | --- | --- |
| Formula-bound research chain | `lookup -> fetch_full_text -> extract_numeric_parameters -> calculator` could be auto-executed as a hidden dependent chain. | Patched: research-chain dependent requests are exposed as `next_affordances` and are not auto-executed by the gateway runner. |
| Calculator admission | Formula text plus `calculator binding` could become an immediate solve. | Patched: source-bound numeric evidence prompts suppress calculator solve and route to scholarly evidence. |
| Compound planner request construction | `buildResearchQuantifyReflectRequests` could emit multiple first-turn requests when one prompt blended research, reflection, internet, and civilization cues. | Patched for formula-bound research: the planner now emits one primary request and moves alternate reasoning-stage tools into `next_affordances`. |
| Workstation tool planner | Several branches build multi-step `tool_plan.steps` with open panel, ingest, solve, reflection, and evaluation. | Partially patched: planner-derived theory-reflection plus calculator chains now emit the reflection request first and expose calculator as `next_affordances`. Direct affirmative tool commands are acceptable; remaining inferred itineraries need branch-by-branch audit. |
| Document plus calculator coupling | `buildSummarizeAndCalculateRequests` emits docs and calculator requests for prompts that explicitly ask to use a document and calculate a concrete expression. | Reviewed: left as direct multi-command behavior, not a hidden dependent reasoning chain. Continue to reject negated/contextual prompts. |
| Dependent voice/read-aloud path | A surface observation could auto-drive narrator output as a hidden actuator follow-up. | Patched: read-aloud surface dependent narrator requests are exposed as `next_affordances` after the surface observation and are not auto-executed. Direct explicit narrator commands remain governed separately. |
| Arbitrary workstation panel plans | A planner-created `tool_plan.steps` list could be mistaken for provider gateway authority and materialized as hidden tool calls. | Audited: the provider gateway maps only the explicitly supported planner-derived evidence capabilities. Unrelated panel-action plans remain outside gateway execution; a regression test covers narrator debug panel actions. |
| Terminal failure override | Gateway failures can suppress Codex explanations when the failure is actually a typed recoverable observation. | Patched for scholarly recovery and calculator expression blocks: recoverable observations can re-enter Codex reasoning and authorize provider explanations, while ordinary failed gateway calls still block. |

## Patch Policy

Allowed Helix behavior:

- Parse prompt intent into source/tool admission candidates.
- Reject contextual, negated, future, historical, quoted, or screen-visible tool mentions.
- Execute a directly admitted capability.
- Normalize result into an observation packet with provenance.
- Attach `next_affordances` for likely follow-up tools.
- Block calculator execution until a numeric substituted expression exists.
- Fail closed for unsafe, mutating, missing-input, or contract-invalid calls.

Disallowed Helix behavior:

- Automatically execute a follow-up reasoning chain because prior evidence made it possible.
- Treat a successful receipt as goal satisfaction.
- Treat formula templates as solved calculator expressions.
- Override Codex's post-tool explanation for recoverable evidence mismatch.
- Encode domain-specific retrieval retries as mandatory hidden calls.

## Remaining Audit Checklist

1. Keep live UI validation on the user-started keyed server only.

## Live Validation Plan

Use a user-started keyed server only. Do not start, restart, or stop the server from the audit agent.

Validation prompts should prove the staged boundary, not a single domain outcome:

1. Ask for a theory badge graph formula for a concept.
2. Ask for cited numeric values that could bind the formula variables.
3. Ask to solve only after the returned evidence has source refs, units, and a fully substituted calculator expression.

Expected trace shape:

```txt
tool request -> observation packet -> model re-entry -> Codex explanation or next selected call
```

The trace should not show Helix auto-walking `lookup -> fetch -> extract -> calculator` inside one hidden gateway loop. Debug export should show the newest visible turn identity, workstation gateway call results, observation packets, and any `next_affordances` offered to Codex.

## Live Validation Notes

2026-07-02 keyed API check on `127.0.0.1:1498`:

- Prompt asked for a fusion-adjacent formula, cited research-paper numerics for binding, and no calculator solve unless the expression was fully substituted.
- Observed gateway call: `scholarly-research.lookup_papers`.
- Observed no `scientific-calculator.solve_expression` call.
- Terminal answer explained the retrieved papers were too weak/mismatched and proposed a narrower follow-up instead of fabricating values or solving.
- Debug showed Codex provider process evidence: `agent_runtime=codex`, `codex_exit_code=0`, provider terminal candidate present, provider reasoning re-entry completed.
- Debug also exposed an audit defect: `model_turn_fidelity_audit` reported `llm_used=false`, `sampling_attempted=false`, and `deterministic_only_fail` because it did not count successful Codex provider subprocess execution as model/runtime sampling evidence.

Patch follow-up: `buildHelixModelTurnFidelityAudit` now records `provider_runtime_sampling` and counts a successful Codex provider subprocess with completed provider reasoning re-entry as model runtime sampling evidence for the fidelity audit. This does not change tool execution or add a private planner; it fixes the audit classification for the existing Codex provider boundary.

2026-07-02 keyed retry after provider-aware proof patch:

- Turn id: `ask:45f6e7ee-087b-4b21-9c2e-298b44d8ae28`.
- Observed gateway call: `scholarly-research.lookup_papers`.
- Observed no `scientific-calculator.solve_expression` call.
- `provider_runtime_sampling.provider_runtime_used=true`.
- `model_turn_fidelity_audit.llm_used=true`.
- `model_turn_fidelity_audit.sampling_attempted=true`.
- `model_turn_fidelity_audit.authority.decision_source=llm`.
- `model_turn_fidelity_audit.parity_status=model_driven_parity`.
- `model_turn_fidelity_audit.terminal.final_used_observed_artifact=true`.
- `evidence_reentry_proof.passed=true`.

## Completion Evidence Matrix

| Requirement | Local Evidence | Status |
| --- | --- | --- |
| Helix admits a primary capability instead of executing a hidden reasoning itinerary. | `explicit-workstation-gateway.test.ts` covers formula-bound research prompts returning a single primary scholarly lookup with alternate theory, internet, and civilization paths as `next_affordances`. | Locally verified. |
| Formula-bound research chains do not auto-run `lookup -> fetch -> extract -> calculator`. | `shouldAutoExecuteDependentCompoundRequest` rejects research-chain dependent requests; gateway tests assert dependent research requests are carried as `next_affordances`. | Locally verified. |
| Source-bound numeric evidence prompts do not trigger premature calculator execution. | Gateway tests cover plasma beta numeric evidence prompts admitting scholarly research and suppressing calculator solve until a bound expression exists. | Locally verified. |
| Planner-derived theory reflection plus calculator flows preserve Codex step choice. | Gateway tests assert the first request is `theory-badge-graph.reflect_discussion_context` and calculator solve is exposed only as a `next_affordance`. | Locally verified. |
| Surface observations do not auto-drive follow-up actuator behavior. | Read-aloud surface tests assert narrator action is exposed as a `next_affordance` and not auto-executed after the surface observation. | Locally verified. |
| Arbitrary workstation panel plans are not mistaken for gateway authority. | Regression coverage verifies unrelated narrator debug panel plans are not materialized as provider gateway calls. | Locally verified. |
| Recoverable evidence mismatch preserves Codex terminal explanation. | `codex-provider-terminal-pass-through.test.ts` and `provider-terminal-authority.test.ts` cover scholarly missing-variable observations and calculator expression blocks re-entering Codex reasoning without generic failure override. | Locally verified. |
| Debug/API trace shows staged observations without hidden calculator execution. | Keyed API check on 2026-07-02 showed only `scholarly-research.lookup_papers`, no calculator solve, provider terminal candidate authorized from the observation, and a fail-closed answer. | Live API partially verified. |
| Debug fidelity audit recognizes Codex provider runtime sampling. | Keyed retry `ask:45f6e7ee-087b-4b21-9c2e-298b44d8ae28` shows provider runtime sampling counted, `llm_used=true`, `decision_source=llm`, and `parity_status=model_driven_parity`. | Live API verified. |
| Debug/UI trace shows the same turn identity and staged observations in the browser. | Needs a fresh Ask flow on the user-started keyed server with copied debug export from the newest visible answer. | Pending keyed live UI validation. |

## Adversarial Coverage Evidence

Existing focused tests already cover contextual, future, quoted, negated, UI-label, and mixed non-command prompts across gateway admission and workstation planning:

- `server/services/helix-ask/agent-providers/__tests__/explicit-workstation-gateway.test.ts` covers docs, repo, internet, calculator, theory reflection, frontier conjecture, voice, context-feed, live-source, visual observer, and unsafe live-env controls.
- `server/__tests__/helix.ask.workstation-tool-planner.test.ts` covers narrator controls, workstation controls, goal-context controls, watch-job controls, and contextual Dottie debugging.
- `server/__tests__/helix.ask.prompt-solving-benchmark.test.ts` covers route-level negated commands, future/hypothetical cues, screen-visible tool words, and quoted tool text.
