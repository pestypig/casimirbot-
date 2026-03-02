# Helix Ask Math Router Checkpoint (2026-03-02)

## Purpose

Record the current Helix Ask math-routing setup as a method checkpoint before broader single-pipeline unification work.

## Checkpoint Scope

- Deterministic-first math routing is active in `server/services/helix-ask/math.ts`.
- Warp viability phrasing is guarded to certificate-path messaging (`warp_delegation_required`) for viability/certificate-style prompts.
- Symbolic lane supports both matrix literal and `matrix(...)` forms.
- Numeric lane no longer reports synthetic determinant success for shape-only requests.

## Stability Fixes Applied

1. `python`/`python3` fallback in symbolic lane to avoid Windows `python3` alias failures.
2. `matrix(...)` prompt parsing support in symbolic lane.
3. Numeric determinant route now returns deterministic failure (`matrix_entries_required`) when entries are omitted.
4. Warp delegation classifier narrowed to viability/certificate semantics instead of generic warp-topic discussion.
5. Live route now hard-surfaces warp-delegation guard answer for viability-style prompts.

## Evidence Snapshot

Focused tests run and passing:

- `tests/math-router-classify.spec.ts`
- `tests/math-router-symbolic.spec.ts`
- `tests/math-router-numeric.spec.ts`
- `tests/helix-ask-math-router.integration.spec.ts`
- `tests/helix-ask-warp-delegation-guard.spec.ts`
- `tests/helix-ask-math.spec.ts`
- `tests/helix-ask-llm-debug-skip.spec.ts`

Manual probe outcomes:

- `det(matrix([a,b],[c,d]))` -> deterministic symbolic result `a*d - b*c`
- `determinant of 50x50 numeric matrix` -> deterministic failure (`matrix_entries_required`)
- `explain natario shift vector` -> not forced into warp delegation (`null` from math solver path)
- `is this warp configuration physically viable?` -> guard response requiring certificate path

## Local Tuning Plan (Next Step)

Use this checkpoint as baseline while collecting prompt-level evidence with full LLM calls on local server:

1. Keep a fixed prompt battery (math + mixed + warp viability).
2. For each prompt, record:
   - prompt text
   - routed lane/engine
   - deterministic result or failure reason
   - final user-facing answer
   - Casimir verification trace/certificate context where relevant
3. Track false positives/false negatives in routing decisions before single-pipeline migration.

## Exit Criteria Before Single-Pipeline Migration

- Routing precision and fallback behavior are stable across evidence battery.
- No silent bypass from deterministic-required prompts into free-form math outputs.
- Warp viability questions consistently map to certificate-path semantics.
