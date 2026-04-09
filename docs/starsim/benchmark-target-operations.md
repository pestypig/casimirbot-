# Star-sim benchmark target operations

`star-sim-v1` supports explicit benchmark-target operations for a narrow solar-like set.

## Named benchmark targets

Targets are resolved only when identifiers or names match explicit registry entries in `server/modules/starsim/benchmark-targets.ts`.
When both match but disagree, the resolver never silently trusts the label alone.
Benchmark assignment is computed from trusted post-crossmatch identity, not from the full pre-crossmatch merge.

Match provenance is explicit:

- `benchmark_target_match_mode`: `matched_by_identifier`, `matched_by_name`, `conflicted_name_vs_identifier`, or `no_match`
- `benchmark_target_conflict_reason` (present on conflicts)
- `benchmark_target_identity_basis`: `trusted_identifier`, `name_label`, `conflicted_trusted_identifier_vs_name`, or `none`
- `benchmark_target_quality_ok`

## Crossmatch quality rules

Crossmatch outcomes are centralized in `server/modules/starsim/sources/crossmatch.ts` and return machine-readable statuses:

- `accepted`
- `accepted_with_warning`
- `rejected_quality`
- `rejected_identifier_conflict`
- `rejected_name_mismatch`
- `rejected_missing_link`

Crossmatch now evaluates two identifier sets:

- `identifiers_observed`: raw merged request + all fetched records (including rejected candidates), retained for provenance.
- `identifiers_trusted`: request identifiers plus identifiers from records that survived crossmatch policy.

Only trusted identifiers can back strong-link acceptance and benchmark-target identifier matching.
Identifier-backed name mismatches can still produce `accepted_with_warning`, but only when the backing identifier evidence is trusted (`explicit_request_identifier`, `trusted_identifier`, or `trusted_gaia_link`).
Identifier conflicts stay strict and continue to be rejected.
If Gaia is the trusted anchor and a candidate that should carry that link does not, the result remains `rejected_missing_link` even when other fields look plausible.

## Fallback and rejection provenance

Resolver responses now include:

- `benchmark_target_id`
- `crossmatch_summary`
- `quality_rejections`
- `quality_warnings`
- `diagnostic_summary`
- `crossmatch_identity_basis`
- `identifiers_observed`
- `identifiers_trusted`

`fallback_used` is true only when one or more selected fields are sourced from a lower-priority eligible catalog for that field.
This includes cases where the true preferred catalog for that field is absent, rejected, or available but not selected.
`crossmatch_summary.fallback_fields` lists those field-level fallback decisions with `preferred_catalog` and `preferred_status`.
User overrides (`selected_from: "user_override"`) are intentionally excluded from fallback accounting.
Selection manifests preserve both rejection and warning records.
Rejected-source identifiers stay visible in `identifiers_observed` for operator debugging, but they do not contribute to trusted identity decisions.

## Benchmark-backed vs domain-backed

- `benchmark_backed`: named benchmark target matched.
- domain-backed only: within supported domain without benchmark target match.

Both paths preserve existing maturity policy; diagnostics do not inflate maturity by themselves.
