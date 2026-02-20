# Codex Cloud Autorun Prompt: Helix Ask Signal Reliability + Self-Tuning Readiness (2026-02-20)

Use this as a single prompt in Codex Cloud to run a full reliability-first closure cycle without manual pauses.

## Prompt (paste into Codex Cloud as-is)

```text
Execution mode:
AUTORUN. Do not stop for confirmation between steps. Execute end-to-end unless a hard technical blocker prevents continuation.

Primary objective:
Make Helix Ask signals trustworthy for self-tuning, then run a full fresh campaign and output a decision-grade package.

Policy constraints:
1) Do not relax thresholds, validators, or provenance requirements.
2) Do not fake or backfill artifacts.
3) Keep strict gates green while improving novelty.
4) All decision outputs must be generated from fresh artifacts from this run.

Hard thresholds (must hold):
- relation_packet_built_rate >= 0.95
- relation_dual_domain_ok_rate >= 0.95
- report_mode_correct_rate >= 0.98
- citation_presence_rate >= 0.99
- stub_text_detected_rate == 0
- runtime_fallback_answer == 0
- runtime_tdz_intentStrategy == 0
- runtime_tdz_intentProfile == 0
- Casimir verify verdict PASS and integrityOk=true

Novelty thresholds (must be attempted and reported at both temps):
- overall >= 0.82
- relation >= 0.80
- repo_technical >= 0.85
- ambiguous_general >= 0.75

Required patch order:

Phase 1 - Signal integrity hardening (first, before tuning):
1) Fix/verify decision artifact coherence:
   - package + validate must reference existing paths from the same fresh run family
   - heavy summary/recommendation must be same run directory
   - AB t02/t035 inputs must match their temperature and variant labels
2) Fix/verify provenance handling:
   - ensure origin/main availability and ahead/behind capture are correctly enforced
   - decision-grade must fail fast on provenance mismatch (no stale package fallback)
3) Add/adjust regression tests for:
   - missing package path
   - source role mismatch
   - source pair mismatch (heavy/recommendation)
   - provenance mismatch fail-fast
4) Run tests for all modified scripts before moving to Phase 2.

Phase 2 - Controlled novelty uplift (without gate regressions):
1) Target only relation and repo_technical novelty bottlenecks:
   - deterministic variant diversification for non-report answer phrasing
   - preserve grounding, citation behavior, and non-report policy guards
2) Keep report-mode hard guard behavior intact.
3) Add focused tests to prevent regressions in runtime fallback and report-mode routing.

Phase 3 - Fresh campaign + decision packaging:
1) Start server and run fresh narrow campaign (15/family).
2) If strict gates fail, patch and rerun narrow (max 2 loops).
3) Run fresh heavy campaign (270 runs).
4) Run AB utility at t=0.2 and t=0.35.
5) Run Casimir verify with trace export.
6) Generate decision package using explicit fresh source paths from this run only.
7) Run decision validator on generated package.

Canonical commands:
- npm ci
- npm run dev:agi:5173
- HELIX_ASK_BASE_URL=http://127.0.0.1:5173 HELIX_ASK_VERSATILITY_RESUME_FROM_LATEST=0 HELIX_ASK_VERSATILITY_PROMPT_ORDER_MODE=stratified_seeded HELIX_ASK_VERSATILITY_PROMPT_SAMPLE_PER_FAMILY=15 HELIX_ASK_VERSATILITY_SEEDS=7,11,13 HELIX_ASK_VERSATILITY_TEMPS=0.2 HELIX_ASK_VERSATILITY_OUT=artifacts/experiments/helix-signal-reliability/narrow HELIX_ASK_VERSATILITY_REPORT=reports/helix-signal-reliability-narrow.md npm run helix:ask:versatility
- HELIX_ASK_BASE_URL=http://127.0.0.1:5173 HELIX_ASK_VERSATILITY_RESUME_FROM_LATEST=0 HELIX_ASK_VERSATILITY_PROMPT_ORDER_MODE=stratified_seeded HELIX_ASK_VERSATILITY_PROMPT_SAMPLE_PER_FAMILY=0 HELIX_ASK_VERSATILITY_SEEDS=7,11,13 HELIX_ASK_VERSATILITY_TEMPS=0.2 HELIX_ASK_VERSATILITY_OUT=artifacts/experiments/helix-signal-reliability/heavy HELIX_ASK_VERSATILITY_REPORT=reports/helix-signal-reliability-heavy.md npm run helix:ask:versatility
- HELIX_ASK_BASE_URL=http://127.0.0.1:5173 HELIX_ASK_AB_VARIANT=helix_signal_reliability_t02 HELIX_ASK_AB_COMMIT=$(git rev-parse --short HEAD) HELIX_ASK_AB_SEEDS=7,11,13 HELIX_ASK_AB_TEMP=0.2 HELIX_ASK_AB_OUT=artifacts/experiments/helix-signal-reliability/ab/t02 npx tsx scripts/helix-ask-utility-ab.ts
- HELIX_ASK_BASE_URL=http://127.0.0.1:5173 HELIX_ASK_AB_VARIANT=helix_signal_reliability_t035 HELIX_ASK_AB_COMMIT=$(git rev-parse --short HEAD) HELIX_ASK_AB_SEEDS=7,11,13 HELIX_ASK_AB_TEMP=0.35 HELIX_ASK_AB_OUT=artifacts/experiments/helix-signal-reliability/ab/t035 npx tsx scripts/helix-ask-utility-ab.ts
- npm run casimir:verify -- --pack repo-convergence --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/experiments/helix-signal-reliability/training-trace-export.jsonl --trace-limit 400 --ci
- npm run helix:decision:package -- --narrow <fresh-narrow-gate-summary> --heavy <fresh-heavy-summary> --heavy-recommendation <fresh-heavy-recommendation> --ab-t02 <fresh-ab-t02-summary> --ab-t035 <fresh-ab-t035-summary> --casimir <fresh-casimir-json>
- npm run helix:decision:validate -- --package reports/helix-decision-package.json

Commit discipline:
- Commit at end of each phase with clear message.
- If blocked, commit partial hardening + blocker notes and continue where possible.

Required final output:
1) Final GO/NO-GO.
2) Strict gate table (value, threshold, pass/fail).
3) Novelty table for t=0.2 and t=0.35 with by-family metrics.
4) Provenance block (branch, head, origin_main, ahead_behind, provenance_gate_pass, decision_grade_ready).
5) Casimir block (verdict, firstFail, traceId, runId, certificateHash, integrityOk).
6) Before/after top failure signatures.
7) Exact artifact path table with EXISTS/MISSING.
8) Commit hash, branch, push status, PR title.
9) If NO-GO, top 3 fastest next patches by expected impact.
```

