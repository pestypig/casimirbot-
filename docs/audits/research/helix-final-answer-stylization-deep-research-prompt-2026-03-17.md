# Helix Ask Final-Answer Stylization Deep Research Prompt

## Objective
Determine the best **generalized final-answer stylization architecture** for Helix Ask so outputs are high-quality across all prompt types (not only equation asks), while preserving selector authority, evidence grounding, and runtime constraints.

## Context
- Repo: CasimirBot Helix Ask pipeline.
- Retrieval quality is now materially improved.
- Remaining gap is final-answer composition quality and consistency across prompt families.
- Existing adjudication baseline:
  - `docs/audits/research/helix-ask-equation-ask-reasoning-methodology-adjudication-2026-03-17.md`

## Research Question
Given current Helix Ask architecture, what is the best way to design a **universal answer composer** that:
1. Adapts format by intent family (definition, mechanism, equation, comparison, troubleshooting, etc.).
2. Preserves deterministic evidence lock (no post-lock content mutation).
3. Prevents internal scaffold/debug leakage in user-visible output.
4. Supports broad prompts without degrading into low-utility fallback text.
5. Meets practical runtime constraints (target p95 <= 30s).

## Required Inputs to Analyze
Review and cite concrete findings from:
1. `docs/helix-ask-ladder.md`
2. `docs/helix-ask-flow.md`
3. `docs/helix-ask-agent-policy.md`
4. `docs/helix-ask-readiness-debug-loop.md`
5. `docs/audits/research/helix-ask-equation-ask-reasoning-methodology-adjudication-2026-03-17.md`
6. Current client render/composer surfaces:
   - `client/src/components/helix/HelixAskPill.tsx`
   - `client/src/components/HelixSettingsDialogContent.tsx`
7. Current route/orchestration path:
   - `server/routes/agi.plan.ts` (or nearest accessible references to it)

## Deliverables
Produce a decision document with:
1. **Executive recommendation** (single clear architecture choice).
2. **Prompt-family stylization matrix**:
   - rows: prompt families
   - columns: required sections, evidence policy, degrade behavior, quality gates.
3. **Deterministic contracts**:
   - selector -> renderer handoff schema
   - invariant checks (anchor lock, source integrity, no debug leakage).
4. **Renderer policy**:
   - what is deterministic vs LLM-generated
   - what post-processing is allowed (style-only).
5. **Fallback/degrade policy**:
   - one unified path per prompt family
   - examples of acceptable degraded outputs.
6. **Falsifiability plan**:
   - metrics, thresholds, and explicit falsifiers
   - broad/mid/specific prompt ladders per family.
7. **Implementation blueprint**:
   - patch order
   - modules/files to change
   - rollout strategy (shadow -> soft enforce -> full enforce).

## Constraints
1. Do not propose hardcoding behavior for specific user questions.
2. Keep retrieval broad; improve selection/composition discipline.
3. No post-lock primary-anchor substitution.
4. No multi-branch cascading repair loops after lock.
5. Keep recommendations backward-compatible where possible.

## Output Format
Respond with the following section order:
1. Executive Conclusion
2. Current Failure Modes
3. Stylization Architecture Options
4. Recommended Universal Composer Design
5. Prompt-Family Stylization Matrix
6. Contracts and Gates
7. Falsification and Benchmark Plan
8. Patch Blueprint
9. Risks and Mitigations
10. Go/No-Go Scorecard

## Additional Requirement
For every recommendation, include:
- Why it is expected to improve final answer quality.
- How it preserves grounding/selector integrity.
- How it impacts latency and operability.

