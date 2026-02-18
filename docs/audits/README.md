# Audits Index

This folder is the entrypoint for cloud-agent audit contracts, gap reports, and ticket execution artifacts.

## Core Contracts

- Ideology/physics gap audit: `docs/audits/ideology-physics-claim-gap-audit-2026-02-17.md`
- Repo forest coverage audit: `docs/audits/repo-forest-coverage-audit-2026-02-18.md`
- Agent execution checklist (machine-readable): `docs/audits/helix-agent-context-checklist-2026-02-17.json`
- ToE ticket backlog (human-readable): `docs/audits/toe-cloud-agent-ticket-backlog-2026-02-17.md`
- ToE ticket backlog (machine-readable): `docs/audits/toe-cloud-agent-ticket-backlog-2026-02-17.json`
- ToE coverage-extension backlog (human-readable): `docs/audits/toe-coverage-extension-backlog-2026-02-18.md`
- ToE coverage-extension backlog (machine-readable): `docs/audits/toe-coverage-extension-backlog-2026-02-18.json`
- Ticket result contract: `docs/audits/ticket-results/README.md`
- ToE scaling scorecard: `docs/audits/toe-scaling-scorecard.md`
- ToE scaling scorecard CSV: `docs/audits/toe-scaling-scorecard.csv`
- ToE progress snapshot: `docs/audits/toe-progress-snapshot.json`

## Validation Commands

- Checklist policy parity: `npm run audit:agent-context:check`
- Ticket backlog schema/parity: `npx tsx scripts/validate-toe-ticket-backlog.ts`
- Ticket result contract: `npx tsx scripts/validate-toe-ticket-results.ts`
- ToE weighted progress snapshot: `npx tsx scripts/compute-toe-progress.ts`

## CI Gates

- Casimir + checklist gate: `.github/workflows/casimir-verify.yml`
- ToE ticket contract gate: `.github/workflows/toe-ticket-contract.yml`

## Expected Workflow

1. Select one ticket from `docs/audits/toe-cloud-agent-ticket-backlog-2026-02-17.json`.
2. Run a single-agent patch scoped to that ticket's `allowed_paths`.
3. Emit a ticket result JSON in `docs/audits/ticket-results/` using the documented schema.
4. Run checklist + tests + Casimir verification.
5. Merge only when validator and CI gates pass.
