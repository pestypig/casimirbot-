# ToE Coverage Extension Backlog (2026-02-18)

This backlog extends the current 10-ticket ToE lane with coverage-focused tickets so planning aligns to the full resolver forest.

Canonical machine-readable source:

- `docs/audits/toe-coverage-extension-backlog-2026-02-18.json`

Scope anchor:

- `docs/audits/repo-forest-coverage-audit-2026-02-18.md`

Parent backlog:

- `docs/audits/toe-cloud-agent-ticket-backlog-2026-02-17.json`

Goal context anchor:

- `docs/experiments/helix-ask-goal-zone.md`

## Global Execution Contract

- Read:
  - `docs/audits/repo-forest-coverage-audit-2026-02-18.md`
  - `docs/audits/ideology-physics-claim-gap-audit-2026-02-17.md`
  - `docs/audits/helix-agent-context-checklist-2026-02-17.json`
  - `WARP_AGENTS.md`
- Maintain tree/DAG defaults:
  - `allowedCL=CL4`
  - `allowConceptual=false`
  - `allowProxies=false`
  - `chart=comoving_cartesian`
- Run required gate for each ticket patch:
  - `npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`
- If Casimir is `FAIL`, fix the first `HARD` failure and rerun until `PASS`.
- Return strict JSON summary with:
  - `ticket_id`
  - `files_changed`
  - `tests_run`
  - `claim_tier`
  - `casimir.verdict`
  - `casimir.certificate_hash`
  - `casimir.integrity_ok`
  - `remaining_gaps`

## Persistent Context Loop (Required)

To keep long-horizon context alive for future agents, every extension ticket run must keep this file loop updated.

Read before each run:

- `docs/experiments/helix-ask-goal-zone.md`
- `docs/audits/repo-forest-coverage-audit-2026-02-18.md`
- `docs/audits/toe-cloud-agent-ticket-backlog-2026-02-17.json`
- `docs/audits/toe-coverage-extension-backlog-2026-02-18.json`
- `docs/audits/ticket-results/README.md`

Write/update after each successful run:

- `docs/audits/ticket-results/<ticket-id>.<timestamp>.json`
- `docs/audits/toe-progress-snapshot.json` (run `npx tsx scripts/compute-toe-progress.ts`)

Optional but recommended when planning context changes:

- `docs/audits/repo-forest-coverage-audit-2026-02-18.md`
- `docs/audits/toe-coverage-extension-backlog-2026-02-18.md`

Batch prompts:

- `docs/audits/toe-extension-prompt-batch-2026-02-18.md`

## Reusable Worker Prompt

```md
You are Codex Cloud working in CasimirBot.

Objective:
Implement exactly one coverage-extension ToE ticket with falsifiable, stage-bounded evidence.

Ticket source:
- docs/audits/toe-coverage-extension-backlog-2026-02-18.json
- ticket id: <TICKET_ID>

Execution rules:
1) Modify only ticket `allowed_paths`.
2) Keep maturity claims bounded to diagnostic/reduced-order/certified.
3) Implement schema/contract first, runtime second, tests third.
4) If touching physics-facing behavior, preserve existing guardrail contracts.
5) Run ticket `required_tests`.
6) Run Casimir verify:
   npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
7) If verdict FAIL, fix first HARD fail and rerun until PASS.

Return strict JSON only:
{
  "ticket_id": "",
  "files_changed": [],
  "tests_run": [],
  "claim_tier": "diagnostic|reduced-order|certified",
  "casimir": {
    "verdict": "PASS|FAIL",
    "trace_id": "",
    "run_id": "",
    "certificate_hash": "",
    "integrity_ok": false
  },
  "remaining_gaps": []
}
```

## Tickets

- `TOE-011-orbital-ephemeris-provenance-bridge`
- `TOE-012-halobank-horizons-consistency-gate`
- `TOE-013-atomic-systems-claim-tier-contract`
- `TOE-014-robotics-recollection-provenance-contract`
- `TOE-015-external-integration-evidence-manifest`
- `TOE-016-resolver-forest-owner-coverage-manifest`

For full ticket detail use:

- `docs/audits/toe-coverage-extension-backlog-2026-02-18.json`

## Batch Coordinator Prompt

```md
Create a worker batch from docs/audits/toe-coverage-extension-backlog-2026-02-18.json.

Rules:
1) One agent per ticket.
2) Do not combine tickets.
3) Enforce allowed_paths and required_tests.
4) Merge only when:
   - casimir.verdict=PASS
   - casimir.integrity_ok=true
5) Keep unresolved tickets in queue with explicit blocker notes.

Order:
1. TOE-011
2. TOE-012
3. TOE-013
4. TOE-014
5. TOE-015
6. TOE-016
```
