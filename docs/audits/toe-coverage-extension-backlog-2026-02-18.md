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

## ToE Percent Semantics (Reviewer Policy)

Use these definitions when reporting progress:

- `toe_progress_pct` is an engineering maturity score from `scripts/compute-toe-progress.ts`.
- Current default scoring uses the core backlog at:
  - `docs/audits/toe-cloud-agent-ticket-backlog-2026-02-17.json`
- Ticket score weights:
  - `diagnostic = 0.25`
  - `reduced-order = 0.6`
  - `certified = 1.0`
- A ticket scores only when receipt evidence has:
  - `casimir.verdict=PASS`
  - `casimir.integrity_ok=true`
- `forest_owner_coverage_pct` is separate and comes from:
  - `configs/resolver-owner-coverage-manifest.v1.json`

Interpretation rule:

- Do not present `toe_progress_pct` as full-forest completion unless progress tooling is explicitly configured to include extension backlog coverage.
- Use both metrics together in reviews:
  - `toe_progress_pct` = maturity depth on scored tickets.
  - `forest_owner_coverage_pct` = breadth across tree-owner lanes.

## Research Escalation Policy (ChatGPT Pro / External Research)

Use research-first prompts before implementation when work crosses from contract wiring into truth-bearing claims.

Escalate to research prompts when any of the following is true:

- A patch introduces or changes physics derivations, constants, or model assumptions not already bounded by in-repo tests.
- A lane is being promoted from `diagnostic` to `reduced-order` or `certified`.
- Multiple candidate methods exist and source-backed method selection is required.
- Existing outputs conflict with guardrails or known physical constraints and adjudication is needed.
- External claims are needed for operator-facing justification, release notes, or policy assertions.

Research output minimum contract:

- Primary-source citations list.
- Falsifiable hypotheses and counter-hypotheses.
- Explicit uncertainty bounds and claim-tier recommendation.
- Clear mapping from source claim -> repo artifact/test/guardrail.

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

Ticket list is maintained in:

- `docs/audits/toe-coverage-extension-backlog-2026-02-18.json`

Current extension range:

- `TOE-011` through `TOE-051`

For full ticket detail use:

- `docs/audits/toe-coverage-extension-backlog-2026-02-18.json`
- `docs/audits/toe-lane-orchestration-2026-02-18.md`

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
1. internal lane first (`contract_only|runtime_contract`)
2. research lane second (`physics_unknown|tier_promotion`)
3. keep one agent per ticket, parallel within each lane
4. use prompt packs:
   - docs/audits/toe-extension-prompt-batch-2026-02-18.md
   - docs/audits/toe-next-prompt-batch-2026-02-18.md
```
