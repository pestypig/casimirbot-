# Durable steering error contract and discipline result

Scope: G8, O5/O6 and CS2/CS4, under
[durable steering recovery](../../work-packets/eh-g8-cs-durable-steering-recovery-v1.md).
Classification: evidence re-entry; public error projection only. No authority or
continuation change in this final error-mapping patch.

The original `npm run helix:ask:discipline:full -- --force` process (exec session
89509) finished with exit code 0 and `[helix:ask:discipline] passed` on September
12. Its terminal output includes 26 passing continuation-routing tests, nine
passing identity-audit tests and a successful server build. Four existing build
warnings remain in agi.demonstration, halobank-solar/derived, oscillation-gyre and
structure-mesa. This result precedes the narrow error mapping below.

A new durable-access regression then failed: a conflicting retry raised a plain
Error instead of the established typed 409. The access boundary now maps only
the known missing-event (404), conflicting-request (409), and expired-event
(409) errors. Unknown failures retain the existing fail-closed behavior.

Post-patch command:

`npx vitest run server/services/local-supervisor/__tests__/durable-reasoning-binding-access.test.ts server/routes/__tests__/pairing-rendered-workflow.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`

Result: two files, seven tests passed, exit 0. Coverage includes the public
browser handler returning a typed conflict, missing event inspect/ack errors,
acknowledgement rejected at the exact event deadline, and an expired exact retry
preserving original event identity and deadline. Existing rendered workflow
cases also retain restart identity and acknowledgement, and owner revocation.

These are deterministic component/real-handler results, not packaged or live
acceptance. The running visibility EXE predates these changes. Actual provider
catalog adoption, native process recovery, packaged onboarding, remaining O1–O6
and CS1–CS4 requirements and the complete CS5 handoff remain open. Original ET6
is unpassed and NAV1 remains gated. No maturity promotion is made.
