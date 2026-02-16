# Mathematical Citation Contract

This contract defines the minimum metadata required for mathematical claims used
by Helix Ask and simulation tooling.

## Purpose

1. Prevent uncited or weakly scoped mathematical claims from shipping.
2. Make claim provenance explicit for audits and replay.
3. Align claim strength with maturity stage.

## Claim Registry Location

- Registry files: `docs/knowledge/math-claims/*.json`
- Schema: `docs/qa/schemas/math-claim-registry.schema.json`
- Checker: `scripts/math-congruence-citation-check.ts`

## Required Top-Level Fields

Each registry file must include:

1. `schemaVersion`
2. `registryId`
3. `domain`
4. `updatedAt` (ISO date)
5. `claims` (non-empty array)

## Required Claim Fields

Each claim entry must include:

1. `claimId` (stable unique id)
2. `statement` (plain-language mathematical claim)
3. `maturity` (`exploratory | reduced-order | diagnostic | certified`)
4. `validityDomain` (what systems/conditions it applies to)
5. `sources` (non-empty list)

Recommended:

1. `repoBindings` (paths where claim influences behavior)
2. `notes`

## Source Entry Requirements

Each source must include:

1. `kind`
2. `citation`

Recommended:

1. `equation`
2. `url`
3. `note`

Allowed `kind` values:

- `paper`
- `textbook`
- `spec`
- `repo-code`
- `dataset`
- `other`

## Validity-Domain Requirements

Each claim should state:

1. `system` (for example `single-electron hydrogenic`)
2. `constraints` (assumptions and limits)
3. optional `applicableRange` with parameter bounds

## Maturity Policy

Use maturity as a hard communication boundary:

1. `exploratory`: idea-stage, not fit for operational assertions
2. `reduced-order`: simplified model, bounded interpretation only
3. `diagnostic`: useful for instrumentation and relative checks
4. `certified`: formal validation path complete

Do not present reduced-order claims as certified.

## CI Gate Semantics

Default checker behavior:

1. schema/parse/required-field issues: ERROR
2. duplicate `claimId`: ERROR
3. placeholder citations (`TODO`, `TBD`, `unknown`): WARNING
4. domain drift hints (for example range mismatch): WARNING

Strict mode:

- warnings are promoted to failures

## Commands

- Advisory mode: `npm run math:congruence:check`
- Strict mode: `npm run math:congruence:check:strict`

## Review Cadence

Run the checker:

1. on every PR touching simulation math, DAG contracts, or Ask normalization
2. before release branches
3. whenever claim registries are updated

