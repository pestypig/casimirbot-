# Phase 6 Focused Deep Research Prompt (Helix Ask Live A/B Validity)

Use this prompt in Codex Cloud:

```text
Use `docs/audits/research/helical-manifold-control-build-plan-2026-02-19.md` as source of truth.
Goal: run a focused deep-research pass that makes Phase 6 live A/B VALID and decision-ready.

Scope (strict):
1. Diagnose why live Phase 6 runs are invalid (status=0, timeout class, unusable_response_rate, semantic metric degeneracy).
2. Define the minimum `/api/agi/ask` output contract required for reliable Phase 6 scoring:
   - required fields,
   - fail-reason/fail-class semantics,
   - replay/hash expectations,
   - claim linkage + unsupported-claim metric semantics.
3. Define runtime envelope for stable evaluation:
   - timeout, hard-timeout, concurrency, retry/backoff, cooldown behavior.
4. Define validity gates and statistical acceptance rules for A/B:
   - usable_response_rate,
   - http_status_ok_rate,
   - non-degenerate metric checks,
   - minimum episode count and seed coverage.
5. Produce an implementation-ready remediation plan (smallest changes first) for harness + runtime.

Out of scope:
- broad theory expansion,
- certified claims,
- changing maturity above diagnostic.

Required deliverables:
A) Root-cause matrix (symptom -> likely cause -> evidence source -> confidence).
B) Contract spec for `/api/agi/ask` scoring compatibility.
C) Runtime envelope spec with default values and safe ranges.
D) Validity gate spec with hard pass/fail thresholds.
E) Patch plan (ordered, low-risk first) with exact files to change.
F) Re-run protocol for full fixed-seed Phase 6 live A/B and decision gate.

Method requirements:
- Use repo evidence only (scripts/tests/routes/docs).
- Include file references for each key claim.
- End each section with “What would disconfirm this?”.

Execution note:
- This is a research + planning pass only unless an explicit “implement now” instruction follows.

Verification/reporting requirements for any patch that occurs:
`npm run casimir:verify -- --pack repo-convergence --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`
- If FAIL: fix first failing HARD constraint and rerun until PASS.
- Report: verdict, firstFail, certificateHash, integrityOk, traceId, runId.
```

