# Replace the historical gap diagnostic with the required invariant

Under [durable steering recovery](../../work-packets/eh-g8-cs-durable-steering-recovery-v1.md),
removed the diagnostic that expected a new event after raw in-memory store
replacement. Its historical evidence remains unchanged. Current assertions use
the actual DurableReasoningBindingAccess path over encrypted event storage and
require identical event identity, creation/expiry/acknowledgement timestamps,
one event row, fresh transient binding projection and stale-handle rejection.
Independent-process expiry/revocation evidence remains separately scoped.

`npx vitest run server/services/local-supervisor/__tests__/pairing-runtime-binding.test.ts server/services/local-supervisor/__tests__/durable-steering-repository.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`

Result: ten tests across two files passed, exit 0. The raw legacy in-memory store
is not claimed durable; public durable routing is the tested recovery boundary.
No production code or running package changed. No maturity promotion; O1–O6,
CS1–CS4 and CS5 remain incomplete, original ET6 unpassed and NAV1 gated.
