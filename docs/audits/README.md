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
- ToE extension prompt batch (TOE-013..016): `docs/audits/toe-extension-prompt-batch-2026-02-18.md`
- ToE next prompt batch (TOE-047..051): `docs/audits/toe-next-prompt-batch-2026-02-18.md`
- ToE next prompt batch (TOE-052..056): `docs/audits/toe-next-prompt-batch-2026-02-18-v2.md`
- ToE lane orchestration runbook: `docs/audits/toe-lane-orchestration-2026-02-18.md`
- ToE research artifacts index: `docs/audits/research/README.md`
- ToE research context pack (standalone prompt anchor): `docs/audits/research/toe-research-context-pack-2026-02-18.md`
- Ticket result contract: `docs/audits/ticket-results/README.md`
- SPINE bookkeeping receipts (non-ToE): `docs/audits/spine-results/`
- HELIX bookkeeping receipts (non-ToE): `docs/audits/helix-results/`
- ToE scaling scorecard: `docs/audits/toe-scaling-scorecard.md`
- ToE scaling scorecard CSV: `docs/audits/toe-scaling-scorecard.csv`
- ToE progress snapshot: `docs/audits/toe-progress-snapshot.json`

## Validation Commands

- Checklist policy parity: `npm run audit:agent-context:check`
- Ticket backlog schema/parity: `npx tsx scripts/validate-toe-ticket-backlog.ts`
- Ticket result contract: `npx tsx scripts/validate-toe-ticket-results.ts`
- ToE research-gate policy: `npm run validate:toe:research-gates`
- ToE preflight orchestrator: `npm run audit:toe:preflight`
- ToE weighted progress snapshot: `npx tsx scripts/compute-toe-progress.ts`
- External integration evidence manifest: `npx tsx scripts/validate-external-integration-manifest.ts`

## CI Gates

- Casimir + checklist gate: `.github/workflows/casimir-verify.yml`
- ToE ticket contract gate: `.github/workflows/toe-ticket-contract.yml`

## Expected Workflow

1. Select one ticket from core or extension backlog JSON.
2. Classify lane from `research_gate`:
   - internal lane: `contract_only|runtime_contract`
   - research lane: `physics_unknown|tier_promotion`
3. Run a single-agent patch scoped to ticket `allowed_paths`.
4. Emit a ticket result JSON in `docs/audits/ticket-results/` using the documented schema.
5. Run `npm run audit:toe:preflight`, ticket tests, and Casimir verification.
6. Merge only when validator and CI gates pass.
