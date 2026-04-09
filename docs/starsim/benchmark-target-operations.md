# Star-sim benchmark target operations

`star-sim-v1` supports explicit benchmark-target operations for a narrow solar-like set.

## Named benchmark targets

Targets are resolved only when identifiers or names match explicit registry entries in `server/modules/starsim/benchmark-targets.ts`.
When both match but disagree, the resolver never silently trusts the label alone.

Match provenance is explicit:

- `benchmark_target_match_mode`: `matched_by_identifier`, `matched_by_name`, `conflicted_name_vs_identifier`, or `no_match`
- `benchmark_target_conflict_reason` (present on conflicts)
- `benchmark_target_quality_ok`

## Crossmatch quality rules

Crossmatch outcomes are centralized in `server/modules/starsim/sources/crossmatch.ts` and return machine-readable statuses:

- `accepted`
- `accepted_with_warning`
- `rejected_quality`
- `rejected_identifier_conflict`
- `rejected_name_mismatch`
- `rejected_missing_link`

Identifier-backed candidates are accepted even when display names differ, and the mismatch is captured in `quality_warnings`.
Identifier conflicts stay strict and continue to be rejected.

## Fallback and rejection provenance

Resolver responses now include:

- `benchmark_target_id`
- `crossmatch_summary`
- `quality_rejections`
- `quality_warnings`
- `diagnostic_summary`

`fallback_used` is true only when one or more selected fields are sourced from a lower-priority eligible catalog for that field.
This includes cases where the true preferred catalog for that field is absent, rejected, or available but not selected.
`crossmatch_summary.fallback_fields` lists those field-level fallback decisions with `preferred_catalog` and `preferred_status`.
User overrides (`selected_from: "user_override"`) are intentionally excluded from fallback accounting.
Selection manifests preserve both rejection and warning records.

## Benchmark-backed vs domain-backed

- `benchmark_backed`: named benchmark target matched.
- domain-backed only: within supported domain without benchmark target match.

Both paths preserve existing maturity policy; diagnostics do not inflate maturity by themselves.
