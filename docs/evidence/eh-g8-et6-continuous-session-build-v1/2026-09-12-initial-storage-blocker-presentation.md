Program gate: G8
Workstream: CS1-CS4 prerequisite onboarding repair
Capability or component: O4/O5 initial persisted pairing recovery diagnostics
Lifecycle stage: evidence normalization; presentation
Reaction timescale: initial bounded status requests
Authority owner: authenticated server reports storage failure; browser displays fixed diagnostics
Current maturity: implemented
Target maturity: deterministically verified scoped initial-load diagnostic
Required evidence: failing initial-load regression with concurrent registration failure, repaired regression
Explicit non-goals: no native storage repair, consent replacement, secret exposure, ET6 substitution or stage closure
Downstream gate unlocked: none

# Preserve the initial storage blocker

DurableTaskPairing loads registrations and retained pairing status concurrently.
Its Promise.allSettled aggregation replaced every rejected reason with a generic
recovery error. Consequently a typed unreadable-storage response during initial
load lost the fixed diagnostic that worked during later manual status checks.

The new rendered fixture returns both an unavailable registration lookup and
`pairing_storage_unreadable` from retained pairing status. Before repair: eight
passed, one failed; the alert showed the generic unconfirmed-request text.
The aggregation now prioritizes only an enumerated, already-sanitized storage
error. Unknown errors retain the existing generic fallback. Backend message text
is never displayed, and the reviewed request is retained without a new approval.

After repair, the rendered component and browser transport suites passed all
18 tests with one Vitest fork, exit 0, 2.30 seconds. Quick discipline passed
(static classifier, no sensitive paths inferred). The regression verifies the
fixed storage message, excludes a fixture private diagnostic and verifies that
initial recovery does not offer a fresh approval mutation.

The earlier accidental `npx vittest --version` command failed to resolve an
executable and ran no tests. The evidence above comes from the subsequent exact
`npx vitest run` commands, not that failed invocation.

Native smoke was not retried because the fresh memory observation was
3,549,120 KiB, below the existing 4 GiB guard. No user process was terminated.
The production service remained running. This source-only presentation repair
is not present in the built September 12 EXE. Complete native storage recovery,
current-task catalog adoption, O6 and all original CS exits remain outstanding.
