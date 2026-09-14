# Replacement retry across a commit — September 12, 2026

Follow-up to [transition service evidence](2026-09-12-replacement-transition-service.md).
Same source-admission/evidence-re-entry scope and incomplete acceptance status.

A deterministic scheduling test returned a pending invitation snapshot, completed
another acceptance of that same invitation, then allowed the outer request to
read the predecessor. Before repair, the outer request failed with
pairing_replacement_conflict (34 passed, 1 failed repository tests).

The transition service now recognizes a predecessor supersession naming this
same invitation, re-reads the invitation, and re-enters normal authenticated
accepted replay only if that row has actually advanced and been accepted. The
predecessor record alone supplies no acceptance authority. Normal replay still
checks secret, destination, expiry/revocation and durability. A competing
replacement keeps its conflict result.

After repair, the three focused suites in the preceding snapshot passed 45
tests (35 repository/transition, 4 durable admission, 6 policy). Server build
passed with the same four unrelated warnings. The quick discipline classifier
previously reported no sensitive files and skipped its battery; that is only a
static classifier result. The earlier forced full battery predates this repair.

This test uses the real encrypted embedded repository with an injected read
schedule. It is not a PostgreSQL concurrency test, native restart, public UI/MCP
test, packaged rehearsal or live acceptance. No human consent or production
invitation was automated. Full public replacement wiring and all original O/CS
requirements remain outstanding; no ET6 or NAV promotion is made.
