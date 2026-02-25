# Helix Ask Dot Behavior Gap Closure - Codex Cloud Autorun Batch Prompt Pack (2026-02-25)

## Objective

Run a research-plus-implementation batch that:

1. Reads all relevant Auntie Dot and Helix Ask artifacts.
2. Produces a clear "what is left" gap map against behavior goals.
3. Fixes remaining NO-GO short-circuit behavior in Helix Ask reasoning where prompts are over-short-circuited instead of being properly categorized and routed.
4. Proves lane behavior with deterministic debug evidence (A short-circuit control, B HTTP invoke, C jobs HTTP invoke).

This pack is designed to be pasted into Codex Cloud with repo access.

## Primary behavior goals

- Objective-first situational awareness in Helix Ask UI.
- Dot-style low-noise callouts (event-driven, not long narration).
- Deterministic suppression/skip reasons for operator trust.
- Voice certainty <= text certainty.
- No accidental NO-GO short-circuiting for normal prompts.
- Prompt categorization robustness: every prompt should map to an explicit category and routing decision (including a safe unknown category) rather than implicit fallthrough.

## Required repo inputs

Read these first before any patch:

- `AGENTS.md`
- `WARP_AGENTS.md`
- `docs/helix-ask-flow.md`
- `docs/helix-ask-agent-policy.md`
- `docs/architecture/helix-ask-dottie-prompt-style-contract.v1.md`
- `docs/architecture/helix-ask-dottie-callout-templates.v1.md`
- `docs/runbooks/helix-ask-dot-gpt-routing-smoke.md`
- `docs/runbooks/helix-ask-debugging.md`
- `docs/audits/research/helix-objective-first-situational-awareness-deep-research-2026-02-24.md`
- `docs/audits/research/helix-objective-first-ui-concept-2026-02-24.md`
- `docs/audits/research/helix-ask-dottie-uniform-utility-deep-research-package-2026-02-24.md`
- `docs/audits/research/auntie-dot-halo-reach-capability-dossier-2026-02-25.md`

Code surfaces to audit and patch if needed:

- `server/routes/agi.plan.ts`
- `server/skills/llm.local.ts`
- `server/skills/llm.http.ts`
- `tests/helix-ask-llm-debug-skip.spec.ts`
- `tests/helix-ask-jobs-regression.spec.ts`
- `server/__tests__/llm.local.bridge.test.ts`
- `server/__tests__/llm.http.safeguards.test.ts`

## Environment assumptions for run

Set (or confirm) in Codex Cloud environment:

- `ENABLE_AGI=1`
- `LLM_RUNTIME=http`
- `LLM_POLICY=http`
- `HULL_MODE=1`
- `HULL_ALLOW_HOSTS=api.openai.com`
- `LLM_HTTP_BASE=https://api.openai.com`
- `LLM_HTTP_MODEL=<your selected model>`
- Secret: `OPENAI_API_KEY` or `LLM_HTTP_API_KEY`

## Required deliverables

- `docs/audits/research/helix-ask-dot-behavior-gap-closure-2026-02-25.md`
- `reports/helix-ask-dot-behavior-gap-backlog-2026-02-25.md`
- `reports/helix-ask-dot-routing-readiness-2026-02-25.md`
- `reports/helix-ask-dot-lane-debug-matrix-2026-02-25.json`

## Prompt 0 - baseline + inventory

```text
Read AGENTS.md and WARP_AGENTS.md first and follow them exactly.

Task:
1) Capture baseline branch/HEAD status and runtime env presence (no secret values).
2) Inventory all Dot/Helix behavior-goal docs and map each to code/test surfaces.
3) Produce a gap table: goal -> current evidence -> blocker -> file to patch.

Required output:
- docs/audits/research/helix-ask-dot-behavior-gap-closure-2026-02-25.md (initial sections)
- reports/helix-ask-dot-lane-debug-matrix-2026-02-25.json (seeded skeleton)

Do not patch code in Prompt 0.
```

## Prompt 1 - strict lane diagnosis (A/B/C)

```text
Run strict lane diagnosis for Helix Ask with debug=true and classify:
- A: short-circuit control lane (expected deterministic skip)
- B: normal ask lane (must invoke HTTP if configured)
- C: jobs lane (must invoke HTTP in final result debug)

Use at least these probes:
- A question: "What is 2 + 2?"
- B question: repo-grounded implementation question unlikely to match forced-answer fastpath
- C question: same as B via /api/agi/ask/jobs

For each lane capture:
- llm_route_expected_backend
- llm_invoke_attempted
- llm_skip_reason
- llm_skip_reason_detail
- llm_backend_used
- llm_provider_called
- llm_http_status
- llm_model
- llm_calls

Also capture /api/hull/status and key-source presence check (presence only).

Write results into:
- reports/helix-ask-dot-lane-debug-matrix-2026-02-25.json
- reports/helix-ask-dot-routing-readiness-2026-02-25.md
```

## Prompt 2 - patch plan for NO-GO short-circuiting

```text
Using Prompt 1 evidence, propose the smallest safe patch set that:
- Preserves deterministic short-circuit only for intended hard-gates.
- Ensures normal prompts are categorized and routed (not over-short-circuited).
- Keeps debug contract machine-parseable (stable enum + detail field).

Must include:
- File-by-file plan with exact touched symbols/blocks.
- New/updated tests proving A deterministic skip and B/C HTTP invocation.
- Rollback notes by commit.

Write:
- reports/helix-ask-dot-behavior-gap-backlog-2026-02-25.md
- update docs/audits/research/helix-ask-dot-behavior-gap-closure-2026-02-25.md
```

## Prompt 3 - implement routing/categorization hardening

```text
Implement the approved minimal patch.

Requirements:
1) In agi.plan routing logic, avoid broad forced-answer short-circuit on normal prompts.
2) Add/verify explicit prompt category decision path (including unknown category) with deterministic reason labels.
3) Preserve existing deterministic debug fields and keep skip reason enum stable.
4) Ensure successful HTTP invocation clears skip fields.
5) Do not weaken safety/constraints and do not break jobs contract.

Run focused tests:
- tests/helix-ask-llm-debug-skip.spec.ts
- tests/helix-ask-jobs-regression.spec.ts
- server/__tests__/llm.local.bridge.test.ts
- server/__tests__/llm.http.safeguards.test.ts

If any fail, fix and rerun.
```

## Prompt 4 - transcript + reasoning correlation proof

```text
Generate a compact proof report that pairs:
- user prompt / situation narration
- Helix Ask output
- lane debug trace (why it routed/suppressed/invoked)

Use at least 12 prompts spanning:
- arithmetic shortcut
- repo-grounded technical ask
- ambiguous/general ask
- mission-style situational ask
- generated-input style prompt

For each case, include:
- category
- route decision
- llm invoke/no-invoke reason
- suppression/skip reason if any
- result quality note

Write:
- reports/helix-ask-dot-routing-readiness-2026-02-25.md (append matrix section)
```

## Prompt 5 - final convergence gate

```text
Run final convergence checks and provide GO/NO-GO.

Required commands:
- focused tests from Prompt 3
- npm run casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.dot-gap-closure.jsonl --trace-limit 200 --ci
- curl -sS http://127.0.0.1:5050/api/agi/training-trace/export > artifacts/training-trace.dot-gap-closure.export.jsonl

Required final report content:
- casimir verdict, firstFail, certificateHash, integrityOk
- lane A/B/C final classification
- explicit remaining blockers (if any)
- top 3 next patches by impact
- strict GO/NO-GO for "Dot behavior goals operational in Helix Ask"
```

## Acceptance criteria

- Lane A: deterministic short-circuit for intended control case with explicit reason.
- Lane B: HTTP invoke proven (`invoke_attempted=true`, `backend_used=http`, `provider_called=true`, status 200, calls present).
- Lane C: same proof in final jobs payload.
- Prompt category coverage includes explicit `unknown` fallback category.
- No regression in jobs contract behavior.
- Casimir verify PASS with certificate integrity OK.

## Notes

- Keep changes additive/minimal; do not redesign unrelated subsystems.
- Keep deterministic replay/failure semantics explicit.
- If environment lacks key/base, classify as config NO-GO and stop short of false-positive claims.
