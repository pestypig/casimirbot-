# Deep Research Prompt: Objective-Loop Verb Composition (Generative + Procedural)

You are a research/architecture reviewer for Helix Ask.  
Your job is to produce an implementation-ready blueprint that upgrades our current objective-loop into a **typed-verb composition system**: LLM-driven step orchestration + deterministic contract enforcement.

## Core Thesis To Evaluate
Treat templates as procedural **verbs** (plan, retrieve, mini-synthesize, critique, repair, assemble) that can be composed dynamically per objective.  
Optimize for **long-run objective completion**, not short-path fallback.  
Fallback must be explicit terminal output (`UNKNOWN + why + next retrieval`), never silent generic prose.

## Required Repo Context (must cite)
- `docs/helix-ask-reasoning-ladder-optimization-plan.md`
- `docs/helix-ask-final-resolution-implementation-evidence.md`
- `docs/helix-ask-home-stretch-plan.md`
- `docs/helix-ask-objective-loop-fallback-elimination-plan.md`
- `docs/helix-ask-audited-reasoning-example.md`
- `docs/helix-ask-audited-reasoning-first-principles.md`
- `docs/helix-ask-audited-reasoning-sidebar-live.md`
- `server/routes/agi.plan.ts`
- `scripts/helix-ask-patch-probe.ts`
- `tests/helix-ask-runtime-errors.spec.ts`
- `client/src/components/helix/HelixAskPill.tsx`

## External Comparison Requirement
Compare our framework to publicly documented GPT/Codex reasoning guidance (official OpenAI docs/blog/cookbook only).  
Do not claim hidden internals. Clearly label inference vs confirmed documentation.

## Deliverables (strict)
1. **Current-State Gap Map**
   - What is already aligned with typed-verb objective loops
   - Where fallback still overrides objective completion
   - Where assembly proceeds without strong objective closure

2. **Verb Contract Spec (v2)**
   - Define each verb with:
     - input schema
     - output schema
     - preconditions
     - postconditions
     - failure modes
     - stop reasons
   - Minimum verbs: `PLAN`, `RETRIEVE`, `MINI_SYNTH`, `MINI_CRITIC`, `REPAIR`, `ASSEMBLE`, `UNKNOWN_TERMINAL`

3. **Controller State Machine**
   - Explicit transition table for objective states (`pending`, `retrieving`, `synthesizing`, `covered`, `blocked`, `unknown_terminal`)
   - Hard assembly gate rules
   - Allowed vs forbidden transitions

4. **Objective-Scoped Micro-Loop Algorithm**
   - Pseudocode for per-objective loop
   - Bounded retries and token budget policy
   - Evidence sufficiency scoring (OES-like contract)
   - How LLM chooses next retrieval action while deterministic policy validates

5. **Observability Spec**
   - Unified event-clock timeline schema (single reasoning session log)
   - Required debug fields for every transition
   - "Debug Copy" export format matching audited-reasoning readability

6. **Evaluation Plan**
   - Fast tests first (unit/probe), then broader battery
   - Metrics: objective completion rate, unresolved-without-UNKNOWN rate, fallback rate, assembly quality, latency/token overhead
   - Go/No-Go thresholds and rollback triggers

7. **Patch Plan (P0/P1/P2)**
   - Highest-leverage first
   - File-level touch list
   - Risk level per patch
   - Exact evidence expected after each patch

## Output Format
Return a single markdown report with:
- Executive summary
- Evidence table (claim -> repo/source citation)
- Proposed architecture
- Implementation sequence
- Test matrix
- Risks/tradeoffs
- "What changes outcomes" section

## Non-Negotiables
- No generic advice without file-grounded evidence.
- No silent fallback acceptance.
- No completion claim without explicit objective-state closure logic.
- Make uncertainty explicit.
