# ToE Next Prompt Batch (TOE-052..056)

Lane order:

1. Internal lane first: `TOE-053`, `TOE-056`
2. Research lane second: `TOE-052`, `TOE-054`, `TOE-055`

Read before each ticket:

- `docs/audits/toe-lane-orchestration-2026-02-18.md`
- `docs/audits/toe-coverage-extension-backlog-2026-02-18.json`
- `docs/audits/ticket-results/README.md`
- `WARP_AGENTS.md`

Required gate for every ticket:

- `npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`

## Coordinator Prompt

```md
Create a worker batch from docs/audits/toe-coverage-extension-backlog-2026-02-18.json.

Ticket order:
1) TOE-053-helix-ask-strict-ready-contract-pack
2) TOE-056-strict-ready-scorecard-automation
3) TOE-052-halobank-residual-tier-promotion-pack
4) TOE-054-warp-viability-cross-check-tier-pack
5) TOE-055-ideology-physics-counterexample-research-bridge

Rules:
- One agent per ticket.
- Enforce ticket allowed_paths and required_tests.
- For research-gated tickets, require research artifacts listed in research_gate.required_artifacts.
- Merge only on Casimir PASS with integrity_ok=true.
- Return strict JSON receipt payload for each ticket.
```

## Worker Prompt: TOE-053 (Internal)

```md
Implement exactly ticket `TOE-053-helix-ask-strict-ready-contract-pack` from:
`docs/audits/toe-coverage-extension-backlog-2026-02-18.json`.

Lane: internal (`runtime_contract`)

Run:
- npx vitest run tests/helix-ask-evidence-gate.spec.ts tests/helix-ask-answer-artifacts.spec.ts tests/helix-ask-modes.spec.ts
- npx tsx scripts/validate-toe-ticket-backlog.ts
- npx tsx scripts/validate-toe-ticket-results.ts
- npm run validate:toe:research-gates
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

Write receipt:
- docs/audits/ticket-results/TOE-053-helix-ask-strict-ready-contract-pack.<UTCSTAMP>.json

Return strict JSON only.
```

## Worker Prompt: TOE-056 (Internal)

```md
Implement exactly ticket `TOE-056-strict-ready-scorecard-automation` from:
`docs/audits/toe-coverage-extension-backlog-2026-02-18.json`.

Lane: internal (`runtime_contract`)

Run:
- npx vitest run tests/toe-progress.spec.ts tests/toe-agent-preflight.spec.ts
- npx tsx scripts/validate-toe-ticket-backlog.ts
- npx tsx scripts/validate-toe-ticket-results.ts
- npm run validate:toe:research-gates
- npx tsx scripts/compute-toe-progress.ts
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

Write receipt:
- docs/audits/ticket-results/TOE-056-strict-ready-scorecard-automation.<UTCSTAMP>.json

Return strict JSON only.
```

## Worker Prompt: TOE-052 (Research)

```md
Implement exactly ticket `TOE-052-halobank-residual-tier-promotion-pack` from:
`docs/audits/toe-coverage-extension-backlog-2026-02-18.json`.

Lane: research (`tier_promotion`)
Required research artifacts:
- docs/audits/research/TOE-052-tier-promotion-rationale.md
- docs/audits/research/TOE-052-comparative-evidence-pack.md

Run:
- npx vitest run tests/halobank-time-model.spec.ts tests/halobank-horizons-consistency.spec.ts
- npx tsx scripts/validate-toe-ticket-backlog.ts
- npx tsx scripts/validate-toe-ticket-results.ts
- npm run validate:toe:research-gates
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

Write receipt:
- docs/audits/ticket-results/TOE-052-halobank-residual-tier-promotion-pack.<UTCSTAMP>.json

Return strict JSON only.
```

## Worker Prompt: TOE-054 (Research)

```md
Implement exactly ticket `TOE-054-warp-viability-cross-check-tier-pack` from:
`docs/audits/toe-coverage-extension-backlog-2026-02-18.json`.

Lane: research (`tier_promotion`)
Required research artifacts:
- docs/audits/research/TOE-054-tier-promotion-rationale.md
- docs/audits/research/TOE-054-comparative-evidence-pack.md

Run:
- npx vitest run tests/warp-viability.spec.ts tests/warp-metric-adapter.spec.ts tests/proof-pack-strict-parity.spec.ts
- npx tsx scripts/validate-toe-ticket-backlog.ts
- npx tsx scripts/validate-toe-ticket-results.ts
- npm run validate:toe:research-gates
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

Write receipt:
- docs/audits/ticket-results/TOE-054-warp-viability-cross-check-tier-pack.<UTCSTAMP>.json

Return strict JSON only.
```

## Worker Prompt: TOE-055 (Research)

```md
Implement exactly ticket `TOE-055-ideology-physics-counterexample-research-bridge` from:
`docs/audits/toe-coverage-extension-backlog-2026-02-18.json`.

Lane: research (`physics_unknown`)
Required research artifacts:
- docs/audits/research/TOE-055-physics-research-brief.md
- docs/audits/research/TOE-055-safety-envelope-analysis.md

Run:
- npx vitest run tests/helix-ask-bridge.spec.ts tests/helix-ask-graph-resolver.spec.ts tests/ideology-dag.spec.ts
- npx tsx scripts/validate-toe-ticket-backlog.ts
- npx tsx scripts/validate-toe-ticket-results.ts
- npm run validate:toe:research-gates
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

Write receipt:
- docs/audits/ticket-results/TOE-055-ideology-physics-counterexample-research-bridge.<UTCSTAMP>.json

Return strict JSON only.
```
