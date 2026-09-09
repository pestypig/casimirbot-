# Durable runtime preflight core

2026-09-08. Parent: `docs/work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md`.
Classification: source admission and continuation identity. Component evidence.

The existing binding store now has an internal `withAcceptedPairing` bridge. Each
invocation calls a mandatory fresh grant reader, validates exact destination and
accepted finite state, and permits only a synchronous operation on that binding.
Outside that admission scope, ordinary binding operations reject a durable entry
with `reasoning_binding_durable_preflight_required`. This prevents a restored
in-memory projection from bypassing subsequent durable revocation checks.

The bridge is not registered in production handlers yet. Its reader contract must
be fulfilled by authenticated durable repository access; a cached status projection
is not an acceptable reader. Runtime room/run eligibility and each caller still
need integration. Existing legacy claims retain their separate behavior.

Transient IDs include service, pairing and client-session identity. Repeated
admitted calls in one service retain the binding and event dedupe; replacement
services reject old IDs. Grant deadlines are preserved. Presence determines only
the currently available continuation transport; absent presence is not invented.
The binding keeps mission null because the approved room is not a mission ID.

```text
npx vitest run server/services/local-supervisor/__tests__/pairing-runtime-binding.test.ts server/services/local-supervisor/__tests__/reasoning-task-binding-store.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
15 tests passed
npm run build:server
PASS (same four unrelated warnings as preceding evidence)
```

Three new cases cover mandatory preflight, unchanged same-service dedupe, rejected
revocation/expiry/every destination dimension/unavailable evidence and stale IDs
after service replacement. The other 12 cases check existing binding behavior.
The full discipline guard is being run separately; this snapshot does not claim
its result. No production recovery handler, EXE or integrated workflow uses this
bridge yet. CS1-CS4 remain incomplete; ET6 is unpassed and NAV1 stays gated.
