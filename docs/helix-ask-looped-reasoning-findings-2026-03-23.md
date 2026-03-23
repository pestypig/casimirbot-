# Helix Ask Looped-Reasoning Findings (2026-03-23)

## Objective
Capture current evidence on Helix Ask reasoning behavior, identify where deterministic control is over-weighted vs LLM synthesis freedom, and define a loop-first planning context for next patches.

## Executive Summary
- The current system still defaults to large-pass assembly paths, with two-pass and retries often gated by coarse policy.
- The codebase already contains strong loop primitives (objective planner, sectional compose, repair validators, telemetry), but these are not the dominant execution mode yet.
- OpenAI guidance and API design favor iterative, stateful, tool-aware loops over monolithic prompt passes for complex tasks.
- Recommendation: move to a short-cycle controller (`plan -> retrieve -> synthesize -> critique -> repair`) with stop conditions tied to measurable quality and grounding gates.

## Codebase Findings

### 1) Monolithic flow still dominates
- Grounded flow is primarily linear (`context -> prompt -> ask -> clean -> render`): [docs/helix-ask-flow.md:6](c:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/docs/helix-ask-flow.md:6)
- Two-pass is marked optional: [docs/helix-ask-flow.md:60](c:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/docs/helix-ask-flow.md:60)
- Core synthesis prompt still uses large bundled sections (`General reasoning`, `Repo evidence`, `Constraint evidence`): [server/routes/agi.plan.ts:17273](c:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/server/routes/agi.plan.ts:17273)

### 2) Deterministic policy gates can suppress loop behavior
- `budget_profile=fast` disables both two-pass and retrieval retry: [server/routes/agi.plan.ts:26111](c:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/server/routes/agi.plan.ts:26111)
- Two-pass execution depends on regex-trigger + policy gate: [server/routes/agi.plan.ts:47883](c:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/server/routes/agi.plan.ts:47883)
- Objective planner is frequently forced deterministic in several conditions (`fast quality`, `single LLM`, `planner unavailable`, etc.): [server/routes/agi.plan.ts:42387](c:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/server/routes/agi.plan.ts:42387)

### 3) Loop primitives are already built and useful
- LLM objective planner prompt/parser exists: [server/routes/agi.plan.ts:25892](c:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/server/routes/agi.plan.ts:25892), [server/routes/agi.plan.ts:25930](c:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/server/routes/agi.plan.ts:25930)
- Research generation budgeting already supports `sectional_compose`: [server/services/helix-ask/budget.ts:41](c:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/server/services/helix-ask/budget.ts:41)
- Repair pipeline can append missing sections/tables (`append_sectional_compose_sections`): [server/services/helix-ask/research-validator.ts:230](c:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/server/services/helix-ask/research-validator.ts:230)
- Strong telemetry exists for loop control and diagnostics (`stage_timing_ms`, `live_events`, `answer_path`, two-pass flags): [server/routes/agi.plan.ts:19541](c:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/server/routes/agi.plan.ts:19541), [server/routes/agi.plan.ts:48360](c:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/server/routes/agi.plan.ts:48360), [server/routes/agi.plan.ts:12426](c:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/server/routes/agi.plan.ts:12426)

## Readiness Evidence
- Readiness loop explicitly expects probability-style scorecards and debug evidence, not anecdotes: [docs/helix-ask-readiness-debug-loop.md:4](c:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/docs/helix-ask-readiness-debug-loop.md:4)
- Contract battery + variety battery + Casimir gate are already standardized: [docs/helix-ask-readiness-debug-loop.md:94](c:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/docs/helix-ask-readiness-debug-loop.md:94), [docs/helix-ask-readiness-debug-loop.md:112](c:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/docs/helix-ask-readiness-debug-loop.md:112), [docs/helix-ask-readiness-debug-loop.md:243](c:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/docs/helix-ask-readiness-debug-loop.md:243)
- Existing optimization plan already states a loop-first ladder target and notes PR6 pending: [docs/helix-ask-reasoning-ladder-optimization-plan.md:8](c:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/docs/helix-ask-reasoning-ladder-optimization-plan.md:8), [docs/helix-ask-reasoning-ladder-optimization-plan.md:161](c:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/docs/helix-ask-reasoning-ladder-optimization-plan.md:161)

## OpenAI Alignment (External)

### Key points
- Reasoning models reason internally; explicit "think step by step" prompting is generally unnecessary.
- For multi-step tool workflows, Responses API with persisted reasoning state improves efficiency/quality versus stateless chat workflows.
- Maintaining turn continuity (`previous_response_id`, reasoning items, assistant phase) is recommended for robust long trajectories.
- Tool-aware reasoning in Responses API is explicitly designed for this pattern.

### Sources
- Reasoning best practices (persist reasoning items, `store=true`, Responses API, stateless chat note): https://developers.openai.com/api/docs/guides/reasoning-best-practices
- GPT-5.4 guide (Responses API continuity, `phase`, multi-step/tool guidance): https://developers.openai.com/api/docs/guides/latest-model
- Responses API tools/features (reasoning-token preservation across tool calls, background mode, reasoning summaries): https://openai.com/index/new-tools-and-features-in-the-responses-api/
- GPT-5.4 release (improved multi-step tool use and workflow reliability): https://openai.com/index/introducing-gpt-5-4/

## Planning Context for New Patch Wave

### Target execution model
1. Build or refresh objective plan for this turn.
2. Run focused retrieval per objective (small query windows).
3. Synthesize only objective-scoped sections.
4. Run critique checks (grounding, relation completeness, leakage, format quality).
5. If fail, run bounded repair pass on failed sections only.
6. Stop when gates pass or max loop count reached; then finalize.

### Replace
- Prompt-triggered two-pass as primary loop selector.
- Coarse budget-only gating for retries/second-pass.
- Deterministic planner bypass in healthy LLM/runtime states.

### Improve
- Evidence- and uncertainty-driven loop scheduling.
- Section-level compose/repair as first-class path, not overflow fallback.
- Objective-level stop conditions using existing telemetry fields.
- Preserve continuity artifacts (`answer_path`, `live_events`, timing) for replay and audits.

## Proposed Success Gates (Balance Score)
- Retrieval quality:
  - `relation_packet_built_rate >= 0.95`
  - `relation_dual_domain_ok_rate >= 0.95`
  - `citation_presence_rate >= 0.99`
- LLM synthesis quality:
  - `min_text_length_pass_rate >= 0.95`
  - semantic quality pass rate >= 0.95
  - no scaffold/debug leakage in final output
- Loop efficiency:
  - lower `deterministic_fallback_relation_rate` without regressing grounding gates
  - bounded retries and stable latency p95

## Immediate High-Leverage Patch Order
1. Make objective-planner/sectional-compose path default when LLM and retrieval health are good.
2. Change loop entry criteria from regex-trigger to uncertainty/fail-reason trigger.
3. Allow retrieval retry and micro-repair in `fast` profile when quality risk is detected.
4. Bind finalization to critique pass on section-level obligations, not global single-shot success.
5. Expand readiness battery to assert loop markers (`planner_mode=llm`, sectional compose used, repair path used only when needed).

## Decision
Proceed with loop-first architecture. The system already has most required pieces; the next wave should primarily rewire control policy and stop conditions rather than invent new subsystems.
