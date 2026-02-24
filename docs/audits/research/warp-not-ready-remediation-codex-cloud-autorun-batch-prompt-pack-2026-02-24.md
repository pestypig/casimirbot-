# Warp NOT_READY Remediation - Codex Cloud Autorun Batch Prompt Pack (2026-02-24)

As-of date: February 24, 2026 (America/New_York)  
Campaign state: `NOT_READY` with fail-closed behavior active.

## Purpose

Run a focused deep-research pass that uses campaign companion artifacts to produce a concrete, machine-readable remediation path from `NOT_READY` to `REDUCED_ORDER_ADMISSIBLE` (or explicit blocked reasons if not achievable in this wave).

## Mandatory boundary

Keep this exact statement in all generated outputs:

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Required inputs (must read first)

- `AGENTS.md`
- `WARP_AGENTS.md`
- `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md`
- `docs/audits/research/warp-gates-executive-translation-2026-02-24.md`
- `artifacts/research/full-solve/campaign-gate-scoreboard-2026-02-24.json`
- `artifacts/research/full-solve/campaign-first-fail-map-2026-02-24.json`
- `artifacts/research/full-solve/campaign-action-plan-30-60-90-2026-02-24.json`
- `artifacts/research/full-solve/A/evidence-pack.json`
- `artifacts/research/full-solve/B/evidence-pack.json`
- `artifacts/research/full-solve/C/evidence-pack.json`
- `artifacts/research/full-solve/D/evidence-pack.json`
- `scripts/warp-full-solve-campaign.ts`
- `scripts/warp-publication-bundle.ts`
- `tests/warp-full-solve-campaign.spec.ts`
- `tests/warp-publication-bundle.spec.ts`

## Campaign facts to treat as source-of-truth

- Global first-fail: `G0`
- Gate counts: `PASS=0, FAIL=0, UNKNOWN=0, NOT_READY=8, NOT_APPLICABLE=1`
- Missing required signals (all waves):
  - `initial_solver_status`
  - `evaluation_gate_status`
  - `hard_constraint_ford_roman_qi`
  - `hard_constraint_theta_audit`
  - `certificate_hash`
  - `certificate_integrity`
  - `provenance_chart`
  - `provenance_observer`
  - `provenance_normalization`
  - `provenance_unit_system`

## Mission

Produce a remediation dossier that is:
- technically explicit enough for engineering implementation,
- machine-readable enough for CI/campaign enforcement,
- stakeholder-safe enough for deck/report updates without overclaim.

## Required outputs

1. `docs/audits/research/warp-not-ready-remediation-dossier-R04-2026-02-24.md`
2. `artifacts/research/full-solve/not-ready-remediation-ledger-R04-2026-02-24.json`
3. `docs/audits/research/warp-not-ready-remediation-falsifier-matrix-R04-2026-02-24.md`

## Output requirements

### A) Dossier (markdown)

Include these sections in order:

1. Executive status
- Why `NOT_READY` is currently correct.
- What "ready" means inside this framework (and what it does not mean).

2. Gate-by-gate closure plan (`G0..G8`)
- Current status.
- Missing signal dependencies.
- Producer path(s): exact code files/functions expected to emit each missing signal.
- Consumer path(s): where signal is read and gate-evaluated.
- Required tests to lock behavior.
- Acceptance criteria to mark gate `PASS` (or `NOT_APPLICABLE` only where policy defines it).

3. Signal contract matrix
- One row per missing signal with:
  - schema type,
  - source file/function,
  - nullability policy,
  - fallback policy (must be fail-closed unless explicitly justified),
  - test file + assertion target.

4. Reproducibility uplift plan
- How to move `repeatedRunGateAgreement`, `constraintPayloadDrift`, and `residualTrend` from `NOT_READY` to actionable status.
- Deterministic run conditions (seed/timeout/runCount/profile contract).

5. Presentation-safe language update
- "Defensible now" and "not defensible" tables.
- Keep boundary statement verbatim.

6. 30/60/90 execution backlog
- Ranked by dependency and expected campaign impact.
- Each item includes owner type, patch target, acceptance test, and gate impact.

### B) Remediation ledger (JSON)

Must include:

```json
{
  "asOfDate": "2026-02-24",
  "campaignId": "FS-CAMPAIGN-2026-02-24",
  "decisionNow": "NOT_READY",
  "boundaryStatement": "This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.",
  "executiveTranslationRef": "docs/audits/research/warp-gates-executive-translation-2026-02-24.md",
  "gatePlan": {
    "G0": {
      "statusNow": "NOT_READY",
      "signalsNeeded": [],
      "codeProducers": [],
      "codeConsumers": [],
      "testsRequired": [],
      "acceptance": []
    }
  },
  "signalPlan": {
    "initial_solver_status": {
      "type": "string",
      "producer": "",
      "consumerGates": ["G1", "G6"],
      "tests": [],
      "failClosed": true
    }
  },
  "rankedBacklog": [
    {
      "id": "R04-P1",
      "title": "",
      "owner": "",
      "touches": [],
      "gatesUnblocked": [],
      "acceptanceTests": [],
      "risk": ""
    }
  ]
}
```

### C) Falsifier matrix (markdown)

For each gate `G0..G8`, list:
- falsifier condition,
- observable symptom,
- artifact proving failure,
- mitigation patch class,
- re-test command.

## Research constraints

- Do not claim physical feasibility.
- Do not convert governance `PASS` into physics claims.
- Keep strict distinction between:
  - measured/runtime evidence,
  - derived reduced-order evidence,
  - policy/label semantics.

## Required command set

Run and report results for:

1. `npm run warp:full-solve:campaign -- --wave A --ci --wave-timeout-ms 4000 --campaign-timeout-ms 10000`
2. `npm run warp:full-solve:campaign -- --wave all --ci --wave-timeout-ms 4000 --campaign-timeout-ms 15000`
3. `npx vitest run tests/warp-full-solve-campaign.spec.ts tests/warp-publication-bundle.spec.ts`
4. `npm run warp:ultimate:check`
5. `npm run warp:evidence:pack`
6. `npm run warp:publication:bundle`

## Mandatory Casimir verification gate

After any patch:

1. `npm run casimir:verify -- --ci --url http://127.0.0.1:5173/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl`
2. `curl -fsS http://127.0.0.1:5173/api/agi/training-trace/export -o artifacts/training-trace-export.jsonl`

If verifier returns `FAIL`, fix first failing `HARD` constraint and rerun until `PASS`.

## Final response contract

Return:

1. Files created/updated.
2. Gate counts and campaign decision after run.
3. Top 5 blockers by impact.
4. Exact code paths for each missing signal producer/consumer.
5. Tests added/updated and results.
6. Casimir verify fields:
   - `verdict`
   - `firstFail`
   - `certificateHash`
   - `integrityOk`
   - `traceId`
   - `runId`
7. Confirmation that boundary statement is present in all generated outputs.

