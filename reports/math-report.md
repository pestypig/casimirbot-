# Math Report

Generated: 2026-01-09T00:07:23.752Z
Registry entries: 65

## Coverage by Stage
- exploratory: 13
- reduced-order: 24
- diagnostic: 21
- certified: 7

## Unstaged Modules
- server/gr/gr-os-payload.ts
- server/routes/agi.contributions.ts
- server/services/observability/gr-os-payload-store.ts
- server/services/observability/tool-event-adapters.ts

## Unstaged Stage Suggestions
- diagnostic: 1
- reduced-order: 1
- exploratory: 2
- default: exploratory

## Missing Evidence
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
  - commands: npm run casimir:verify
- regression (Regression tests)
  - auto tests: 0
  - commands: npm test

## Missing Evidence Profiles
none

## Auto-discovered Evidence
- modules with test coverage: 0
- tests considered: 0

## Auto-discovered Dependencies
- nodes: 465
- edges: 957

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
- entries with units: 65/65
- missing units: none

## Unit Violations
none

