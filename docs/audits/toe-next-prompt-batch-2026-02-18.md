# ToE Next Prompt Batch (TOE-047..051)

This batch is split by lane:

- Internal lane: `TOE-047`, `TOE-051`
- Research lane: `TOE-048`, `TOE-049`, `TOE-050`

Read before each ticket:

- `docs/audits/toe-lane-orchestration-2026-02-18.md`
- `docs/audits/toe-coverage-extension-backlog-2026-02-18.json`
- `docs/audits/ticket-results/README.md`
- `WARP_AGENTS.md`

Required verification command for every ticket:

- `npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`

## Prompt: TOE-047 (Internal)

```md
Implement exactly ticket `TOE-047-helix-ask-strict-e2e-contract` from:
`docs/audits/toe-coverage-extension-backlog-2026-02-18.json`.

Rules:
1) Modify only ticket `allowed_paths`.
2) Keep claims bounded to diagnostic/reduced-order/certified.
3) Run required tests and validators.
4) Run Casimir verify; if FAIL, fix first HARD fail and rerun.
5) Write receipt: `docs/audits/ticket-results/TOE-047-helix-ask-strict-e2e-contract.<UTCSTAMP>.json`.

Return strict JSON:
{
  "ticket_id": "TOE-047-helix-ask-strict-e2e-contract",
  "files_changed": [],
  "tests_run": [],
  "claim_tier": "diagnostic|reduced-order|certified",
  "casimir": { "verdict": "PASS|FAIL", "trace_id": "", "run_id": "", "certificate_hash": "", "integrity_ok": false },
  "remaining_gaps": []
}
```

## Prompt: TOE-048 (Research)

```md
Implement exactly ticket `TOE-048-halobank-horizons-physics-research-bridge` from:
`docs/audits/toe-coverage-extension-backlog-2026-02-18.json`.

This ticket is research-gated (`physics_unknown`):
1) Produce required artifacts in `docs/audits/research/`:
   - `TOE-048-physics-research-brief.md`
   - `TOE-048-safety-envelope-analysis.md`
2) Then implement allowed-path patch and tests.
3) Run validators, Casimir verify, and write receipt.

Return strict JSON with Casimir block and remaining_gaps.
```

## Prompt: TOE-049 (Research)

```md
Implement exactly ticket `TOE-049-warp-viability-tier-promotion-pack` from:
`docs/audits/toe-coverage-extension-backlog-2026-02-18.json`.

This ticket is research-gated (`tier_promotion`):
1) Produce required artifacts in `docs/audits/research/`:
   - `TOE-049-tier-promotion-rationale.md`
   - `TOE-049-comparative-evidence-pack.md`
2) Implement allowed-path patch, run required tests, run Casimir verify.
3) Write receipt JSON under `docs/audits/ticket-results/`.

Return strict JSON with ticket_id/files_changed/tests_run/claim_tier/casimir/remaining_gaps.
```

## Prompt: TOE-050 (Research)

```md
Implement exactly ticket `TOE-050-ideology-physics-bridge-tier-promotion-pack` from:
`docs/audits/toe-coverage-extension-backlog-2026-02-18.json`.

This ticket is research-gated (`tier_promotion`):
1) Produce required artifacts in `docs/audits/research/`:
   - `TOE-050-tier-promotion-rationale.md`
   - `TOE-050-comparative-evidence-pack.md`
2) Implement allowed-path patch and tests.
3) Run validators and Casimir verify.
4) Write ticket receipt JSON.

Return strict JSON with Casimir evidence and remaining_gaps.
```

## Prompt: TOE-051 (Internal)

```md
Implement exactly ticket `TOE-051-research-artifact-progress-ledger` from:
`docs/audits/toe-coverage-extension-backlog-2026-02-18.json`.

Rules:
1) Modify only ticket `allowed_paths`.
2) Keep progress semantics deterministic and backward compatible.
3) Run required tests and validators.
4) Run Casimir verify, then write receipt JSON.

Return strict JSON with ticket_id/files_changed/tests_run/claim_tier/casimir/remaining_gaps.
```
