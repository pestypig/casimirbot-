# Helix Ask Home-Stretch Deep Research Prompt (Constructive Loop, Token-Quantized)

## Objective
Design a practical, near-term plan to make Helix Ask produce consistently constructive final answers in the current framework, prioritizing working behavior today over perfect accuracy.

The target is a dynamic reasoning system where sentence-level objectives cascade into stepwise retrieval + LLM mini-synthesis until objective completion, then final assembly.

## Current Runtime Facts (Treat As Ground Truth)
1. Objective loop runtime patch is active at `objective_loop_patch_revision = 2026-03-23-objective-loop-recovery-enforce-v2`.
2. Recovery crash (`applyContextAttempt is not defined`) is fixed.
3. Recovery no longer crashes, but objective completion is still weak in real prompts.
4. Unresolved objectives can still reach LLM assembly in some paths, which yields generic/scaffold-like outputs.
5. Existing plan reference: `docs/helix-ask-reasoning-ladder-optimization-plan.md`.

## Primary Research Question
How do we close the gap between:
1. A mechanically functioning objective loop, and
2. A constructively reliable final answer loop

while preserving throughput and enabling stronger LLM orchestration of retrieval jobs?

## Scope
Analyze and propose changes for:
1. What each stage is succeeding at vs failing at (job-level accountability).
2. How stage parsing size/granularity affects convergence quality.
3. How to maximize LLM freedom for orchestration without losing deterministic safety rails.
4. How to operationalize sentence-to-step cascading under explicit token budgets.

## Required Inputs To Analyze (Cite Concrete Evidence)
1. `docs/helix-ask-reasoning-ladder-optimization-plan.md`
2. `docs/helix-ask-looped-reasoning-findings-2026-03-23.md`
3. `docs/helix-ask-readiness-debug-loop.md`
4. `docs/helix-ask-flow.md`
5. `server/routes/agi.plan.ts`
6. `tests/helix-ask-runtime-errors.spec.ts`
7. `scripts/helix-ask-patch-probe.ts`
8. Any additional files required to prove stage behavior and divergence.

## Non-Negotiable Constraints
1. Prefer a general working model now over 100% answer accuracy.
2. Preserve deterministic safety for hard gates and explicit fail reasons.
3. Do not allow silent objective failure masked by polished final prose.
4. Keep patch sequencing incremental and testable in short cycles.
5. Every recommendation must include measurable debug signals.

## What To Diagnose Explicitly
### A. Stage Job Audit
For each stage (planner, objective splitter, retrieval query builder, scoped retrieval, recovery retrieval, mini-answer generation, mini-critic, assembly):
1. Intended job.
2. Current success behavior.
3. Current failure behavior.
4. Observable evidence (debug fields, answer_path, tests).
5. Whether failure is logic, thresholding, data sparsity, or orchestration policy.

### B. Plan Convergence Audit
Compare runtime behavior to `docs/helix-ask-reasoning-ladder-optimization-plan.md`:
1. Fully implemented and working.
2. Implemented but misbehaving.
3. Not implemented.
4. Regressed/diverged.

### C. LLM Leverage Audit
Show where LLM is:
1. Under-leveraged (deterministic logic over-constraining useful exploration).
2. Properly leveraged (high utility, bounded risk).
3. Over-leveraged (hallucination risk, weak grounding control).

## Required Design Output
Produce a home-stretch architecture that includes:
1. Hard assembly gating when objectives are unresolved (or unresolved handling contract).
2. Per-objective evidence sufficiency contract before objective is considered usable.
3. Explicit unresolved objective output behavior (`UNKNOWN + why + next retrieval intent`).
4. Objective-local micro-loop policy (complete objective A -> objective B, with explicit completion state transitions).
5. LLM-first orchestration where LLM defines each next task prompt, retrieval target, and mini-answer shape.

## Token-Quantized Cascade Model (Mandatory)
Define a quantized model for sentence-to-reasoning cascade:
1. Unit definitions:
   - Sentence Objective Unit (SOU)
   - Retrieval Action Unit (RAU)
   - Mini-Answer Unit (MAU)
2. Budget model:
   - tokens per SOU planning
   - tokens per RAU query generation
   - tokens per MAU synthesis
   - stop condition budget
3. Adaptive loop rules:
   - when to continue loop
   - when to emit `UNKNOWN`
   - when to escalate to final assembly

## Deliverables
1. Executive Conclusion (single recommended strategy).
2. Stage Job Audit Matrix (succeed/fail per stage, with evidence).
3. Divergence Matrix vs Optimization Plan (implemented/misused/missing).
4. Home-Stretch Patch Plan (P0 same-day, P1 next, P2 stabilization).
5. Token-Quantized Cascade Specification (formulas + thresholds).
6. LLM Template Pack:
   - planner template
   - objective retrieval-task template
   - objective mini-answer template
   - unresolved objective template
   - final assembly template
7. Debug/Telemetry Contract Additions (new fields + semantics).
8. Short Test Battery (fast tests only) with pass/fail expectations.
9. Go/No-Go scorecard for promoting to play-test readiness.

## Acceptance Criteria For Recommendations
Each recommendation must state:
1. Why it improves constructive answer quality.
2. What measurable signal confirms improvement.
3. Latency and token cost impact.
4. Failure mode if wrong.
5. Rollback strategy.

## Output Format
Return sections in this exact order:
1. Executive Conclusion
2. Current Runtime Truth Table
3. Stage Job Audit Matrix
4. Divergence vs Plan Matrix
5. Home-Stretch Architecture (Recommended)
6. Token-Quantized Cascade Spec
7. LLM Template Pack
8. Patch Sequencing (P0/P1/P2)
9. Fast Test and Debug Protocol
10. Risks, Tradeoffs, and Rollback
11. Go/No-Go Decision

## Additional Instruction
Use evidence-grounded reasoning from the codebase and plan docs. When evidence is insufficient, say `UNKNOWN` and specify the minimum retrieval needed to resolve it.
