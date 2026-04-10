# Star-sim benchmark target operations

`star-sim-v1` supports explicit benchmark-target operations for a narrow solar-like set.

## Named benchmark targets

Targets are resolved only when identifiers or names match explicit registry entries in `server/modules/starsim/benchmark-targets.ts`.
When both match but disagree, the resolver never silently trusts the label alone.
Benchmark assignment is computed from trusted post-crossmatch identity, not from the full pre-crossmatch merge.

Match provenance is explicit:

- `benchmark_target_match_mode`: `matched_by_identifier`, `matched_by_name`, `conflicted_trusted_identifiers`, `conflicted_name_vs_identifier`, or `no_match`
- `benchmark_target_conflict_reason` (present on conflicts)
- `benchmark_target_identity_basis`: `trusted_identifier`, `name_label`, `conflicted_trusted_identifiers`, `conflicted_trusted_identifier_vs_name`, or `none`
- `benchmark_target_quality_ok`

Trusted identifiers must converge on one benchmark target before `benchmark_target_id` is assigned.
If trusted identifiers point at different benchmark targets, the resolver intentionally returns no benchmark assignment with `benchmark_target_match_mode: "conflicted_trusted_identifiers"`.
This stricter rule applies to benchmark identity only; ordinary field resolution can still remain usable while benchmark assignment is withheld.

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
When Gaia is absent, fetched secondary records can still populate observables, but they do not enter `identifiers_trusted` unless they are directly anchored by explicit request identifiers or an already-trusted identifier chain.
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

## Benchmark receipts

Resolve-first benchmark-backed runs now emit:

- `benchmark_receipt_ref`
- `benchmark_input_signature`
- `previous_benchmark_receipt_ref`
- `benchmark_repeatability`

The benchmark receipt is a compact reproducibility artifact under `artifacts/research/starsim/benchmarks/...`.
It records the trusted benchmark identity basis, observed/trusted identifiers, selected field origins, lane plan, blocked reasons, observable-envelope checks, and any completed lane diagnostic summaries.

`benchmark_input_signature` is deterministic over benchmark-relevant inputs:

- trusted identifiers
- benchmark target id and identity basis
- selected field origins
- selected benchmark observables from the frozen draft
- requested lanes and precondition policy
- source cache key and resolved draft hash

Equivalent benchmark-backed runs should emit the same signature.
If trusted identity or selected source origins change, the signature should change as well.

Blocked benchmark-backed runs can still emit a receipt when benchmark assignment succeeded.
Non-benchmark runs intentionally do not emit benchmark receipts.

`benchmark_repeatability` is a compact comparison against the most relevant previous benchmark receipt for the same benchmark target.
It reports:

- whether the run is repeatable
- whether the benchmark input signature stayed the same
- drift categories such as identity, selected-field-origin, lane-plan, blocked-reason, envelope-status, or diagnostic-summary changes

Completed benchmark-backed runs compare against previous completed receipts first.
Blocked or preview-stage benchmark-backed runs can fall back to the most recent receipt for the same target so readiness drift is still visible.
