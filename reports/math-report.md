# Math Report

Generated: 2026-06-12T16:18:38.042Z
Registry entries: 129

## Coverage by Stage
- exploratory: 19
- reduced-order: 38
- diagnostic: 65
- certified: 7

## Unstaged Modules
- modules/gr/gr-diagnostics.ts
- modules/warp/warp-metric-adapter.ts
- server/gr/gr-assistant-adapter.ts
- server/gr/gr-os-payload.ts
- server/routes/agi.chat.ts
- server/routes/agi.contributions.ts
- server/routes/agi.demonstration.ts
- server/routes/agi.plan.ancillary.ts
- server/routes/agi.refinery.ts
- server/routes/agi.zen-graph.ts
- server/services/observability/error-reporter.ts
- server/services/observability/event-spine-ring-buffer.ts
- server/services/observability/event-spine.ts
- server/services/observability/gr-os-payload-store.ts
- server/services/observability/tool-event-adapters.ts

## Unstaged Stage Suggestions
- diagnostic: 3
- reduced-order: 7
- exploratory: 5
- default: exploratory

## Missing Evidence
none

## Missing Narrative
none

## Evidence Profiles
- sanity_checks (Sanity checks)
  - auto tests: 0
  - commands: npm run lint, npm test -- --run '*sanity*'
- residual_check (Residual checks)
  - auto tests: 0
  - commands: npm run math:validate, npm test -- --run '*constraint*'
- certificate (Certificate / policy checks)
  - auto tests: 0
  - commands: npm run casimir:verify -- --ci --trace-out artifacts/training-trace.jsonl
- regression (Regression tests)
  - auto tests: 0
  - commands: npm test

## Missing Evidence Profiles
none

## Auto-discovered Evidence
- modules with test coverage: 0
- tests considered: 0

## Auto-discovered Dependencies
- nodes: 1966
- edges: 4571

## Stage Violations (Edges)
none

## Stage Violations (Pipelines)
none

## Waivers
- edge waivers: 0
- module waivers: 0

## Waived Issues
none

## Unit Coverage
- entries with units: 129/129
- missing units: none

## Unit Violations
none

