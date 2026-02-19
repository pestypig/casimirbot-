# ToE Lane Orchestration (2026-02-18)

This runbook defines how agents choose between internal implementation work and research-gated work.

Canonical inputs:

- `docs/audits/toe-cloud-agent-ticket-backlog-2026-02-17.json`
- `docs/audits/toe-coverage-extension-backlog-2026-02-18.json`
- `configs/toe-research-gate-policy.v1.json`
- `docs/audits/ticket-results/README.md`

## Lane Classification

Use `ticket.research_gate.risk_class`:

- `contract_only` -> internal lane
- `runtime_contract` -> internal lane (audit required)
- `physics_unknown` -> research lane (audit + research required)
- `tier_promotion` -> research lane (audit + research required)

Required artifacts by risk class come from `configs/toe-research-gate-policy.v1.json`.

## Execution Loop

1. Pick ticket ID.
2. Run lane preflight:
   - `npm run audit:toe:preflight`
3. If lane is research:
   - create/update research artifacts under `docs/audits/research/`
   - keep artifacts mapped to ticket ID
4. Implement patch inside `allowed_paths`.
5. Run ticket `required_tests`.
6. Run validators:
   - `npx tsx scripts/validate-toe-ticket-backlog.ts`
   - `npx tsx scripts/validate-toe-ticket-results.ts`
   - `npm run validate:toe:research-gates`
7. Run Casimir gate:
   - `npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`
8. Write ticket receipt:
   - `docs/audits/ticket-results/<ticket-id>.<UTCSTAMP>.json`
9. Refresh progress snapshot:
   - `npx tsx scripts/compute-toe-progress.ts`

## Completion Criteria

Do not mark ticket complete unless all are true:

- Required tests pass.
- Validators pass.
- Casimir verdict is `PASS`.
- `certificate_hash` is present and `integrity_ok=true`.
- Receipt is written with the required schema.

## Notes on ToE %

- `toe_progress_pct` tracks maturity-weighted engineering progress.
- `forest_owner_coverage_pct` tracks tree-owner breadth coverage.
- Treat these as separate dimensions in reviews.

## Forest-Wide Lane Closure Track

Use this sequence when transitioning from owner-coverage parity to full
first-class lane closure:

- `docs/audits/toe-sequence-forest-lane-closure-2026-02-19.md`

This track defines the `TOE-082..TOE-089` execution order, lane objectives,
required tests, and research-gate metadata.

Owner-parity and stabilization follow-on prompts are in:

- `docs/audits/toe-sequence-owner-parity-stabilization-2026-02-19.md`
