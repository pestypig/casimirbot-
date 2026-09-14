# Filtered discovery pagination and stale candidate rejection

O3/O5 evidence under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
Test-only change; no runtime feature enabled.

Added a migrated encrypted-repository test with a full first page of 50 copy-only
rows, another copy-only row and a later automatic-delivery row. First-page results
contain no candidates but retain the last scanned cursor. The next page returns
the automatic candidate and terminates. Foreign-owner discovery returns no rows.

After discovery, the real transition service revokes that candidate. Delivery
then rejects it before provider connection; repeat discovery excludes it. Thus
the discovery list is not a reusable authorization grant. The focused repository/
service suite passes 16/16 tests. No source repair was required for this case.

This is pg-mem fixture evidence, not real Postgres concurrency, native restart,
public-route integration or actual host delivery. The complete original goal
and all remaining acceptance requirements are unchanged.
