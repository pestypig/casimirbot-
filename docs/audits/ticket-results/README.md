# ToE Ticket Result Contract

Store one JSON result file per ticket execution in this folder.
Only `TOE-*` receipts that follow the schema below belong here. Keep non-ToE
bookkeeping artifacts (for example `SPINE-*` or `HELIX-*`) outside this
directory (`docs/audits/spine-results/`, `docs/audits/helix-results/`).

## Filename convention

- `docs/audits/ticket-results/<ticket-id>.<yyyymmdd-hhmmss>.json`

## Required schema

```json
{
  "schema_version": "toe_agent_ticket_result/1",
  "ticket_id": "TOE-001-curvature-stress-bridge",
  "files_changed": [
    "shared/essence-physics.ts",
    "tests/stress-energy-units.spec.ts"
  ],
  "tests_run": [
    "tests/stress-energy-units.spec.ts",
    "tests/physics-contract.gate0.spec.ts"
  ],
  "claim_tier": "reduced-order",
  "casimir": {
    "verdict": "PASS",
    "trace_id": "audit:2026-02-17:example",
    "run_id": "17901",
    "certificate_hash": "d2821c7d650d8d4c86f5270c2510b94ed7cd8c45b12d807e0420613f9fe7ce5d",
    "integrity_ok": true
  },
  "research_artifacts": [
    "runtime-contract-audit"
  ],
  "remaining_gaps": []
}
```

`research_artifacts` is optional for non-research-gated tickets. For tickets where `research_gate.required_artifacts` is non-empty in either ToE backlog, every listed required artifact must be present in `research_artifacts`.

## Enforcement

Validation is enforced by:

- `scripts/validate-toe-ticket-results.ts`
- `.github/workflows/toe-ticket-contract.yml`

PR rule:

- If a PR changes paths covered by ticket `allowed_paths`, it must include a result JSON in this folder and pass schema checks.
