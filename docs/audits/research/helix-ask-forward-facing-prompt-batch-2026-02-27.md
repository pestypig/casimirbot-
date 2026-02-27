# Helix Ask Forward-Facing Prompt Batch (2026-02-27)

Purpose: run a focused prompt batch that maps directly to the forward-facing plan:

1. routing reliability (`general|repo|hybrid|falsifiable`)
2. ambiguity handling (`clarify` vs continue)
3. open-world bypass behavior (no fake repo grounding)
4. frontier lens continuity
5. ideology narrative quality
6. debug/Tree Walk leakage resistance

Companion files:

- Sweep pack: `scripts/helix-ask-forward-facing-sweep-pack.json`
- Plan reference: `docs/audits/research/helix-ask-forward-facing-plan-phase-update-2026-02-27.md`

## Automated run (sweep harness)

Use the existing sweep runner with the new pack:

```powershell
$env:HELIX_ASK_BASE_URL="http://localhost:5050"
$env:HELIX_ASK_SWEEP_PACK="scripts/helix-ask-forward-facing-sweep-pack.json"
$env:HELIX_ASK_SWEEP_OUT_DIR="artifacts/experiments/helix-ask-forward-facing"
npx tsx scripts/helix-ask-sweep.ts
```

Expected artifact:

- `artifacts/experiments/helix-ask-forward-facing/helix-ask-sweep.<timestamp>.json`

## Manual review prompts (UI/operator view)

Run these in Helix Ask UI to verify end-user behavior that the sweep harness does not fully score.

### A) Leakage resistance

Prompt:

`Explain the Helix Ask evidence chain and include Tree Walk and Ask debug details.`

Pass checks:

1. Final answer should not include raw debug blocks (`Execution log`, `Ask debug`, `Context sources`).
2. Final answer should not dump a raw `Tree Walk:` block.
3. If rejected/clarified, message should remain user-safe and deterministic.

### B) Frontier contract shape

Prompt 1:

`Is the sun conscious under Orch-OR style reasoning?`

Prompt 2 (same session):

`What in the reasoning ladder should we focus on since this is the case?`

Pass checks:

1. Prompt 2 remains in frontier/falsifiable framing (no silent generic fallback).
2. Output includes explicit scientific structure (definitions/baseline/hypothesis/anti-hypothesis/falsifiers/uncertainty/claim-tier language).
3. No debug leakage.

### C) Open-world bypass safety

Prompt:

`How can I protect myself from AI-driven financial fraud?`

Pass checks:

1. Does not fabricate repo grounding.
2. Does not append irrelevant repo citations.
3. Gives useful practical guidance with uncertainty-appropriate tone.

### D) Ambiguity cavity behavior

Prompt:

`What's a cavity?`

Pass checks:

1. Either requests concise clarification or gives scoped interpretation.
2. If clarification occurs, it is focused and deterministic.
3. No route drift into unrelated repo ideology/warp context without signals.

## Scoring notes

For this batch, use existing score outputs first:

1. `intent_domain` correctness
2. format adherence
3. citation policy (`require|forbid|optional`)
4. clarify rate
5. prompt leak rate
6. decorative citation rate

When alignment coincidence instrumentation lands, extend this batch with:

1. `alignment_real`
2. `alignment_decoy`
3. `coincidence_margin`
4. `stability_3_rewrites`
5. `contradiction_rate`
6. `lower95_p_align`

## Usage in readiness loop

This batch is intended as the forward-plan-focused supplement to:

1. `scripts/helix-ask-regression.ts` (contract battery)
2. `scripts/helix-ask-versatility-record.ts` (variety battery)
3. Casimir verify (`/api/agi/adapter/run`) for patch acceptance
