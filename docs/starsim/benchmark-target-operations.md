# Star-sim benchmark target operations

`star-sim-v1` supports explicit benchmark-target operations for a narrow solar-like set.

## Named benchmark targets

Targets are resolved only when identifiers or names match explicit registry entries in `server/modules/starsim/benchmark-targets.ts`.

## Crossmatch quality rules

Crossmatch outcomes are centralized in `server/modules/starsim/sources/crossmatch.ts` and return machine-readable statuses:

- `accepted`
- `rejected_quality`
- `rejected_identifier_conflict`
- `rejected_name_mismatch`
- `rejected_missing_link`
- `fallback_used`

## Fallback and rejection provenance

Resolver responses now include:

- `benchmark_target_id`
- `crossmatch_summary`
- `quality_rejections`
- `diagnostic_summary`

Selection manifests preserve quality rejection records so operators can see what was dropped and why.

## Benchmark-backed vs domain-backed

- `benchmark_backed`: named benchmark target matched.
- domain-backed only: within supported domain without benchmark target match.

Both paths preserve existing maturity policy; diagnostics do not inflate maturity by themselves.
