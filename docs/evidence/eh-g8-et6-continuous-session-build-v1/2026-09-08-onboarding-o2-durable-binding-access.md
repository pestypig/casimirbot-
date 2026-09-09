# Encrypted-ledger checks for runtime binding operations

2026-09-08. Parent: `docs/work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md`.
Classification: source admission. Component integration evidence.

`DurableReasoningBindingAccess` connects the encrypted repository to the internal
runtime guard. Every durable operation obtains the repository, passes its durable
barrier and rereads the owner-scoped grant before validating the full approved
destination and finite state. Cached binding metadata locates that row; it cannot
authorize use. The context lookup rejects foreign owners and its destination is
excluded from public binding projections.

The access layer supports restore, task verification, preparation target
resolution, status, dispatch, pickup, acknowledgement, event status and browser
display. Legacy bindings retain their synchronous internal checks. Public handlers
must still enforce authenticated actor, scopes, origin and device/room authority.
This internal layer does not authenticate a supplied principal or issue consent.

```text
npx vitest run server/services/local-supervisor/__tests__/durable-reasoning-binding-access.test.ts server/services/local-supervisor/__tests__/pairing-runtime-binding.test.ts server/services/local-supervisor/__tests__/reasoning-task-binding-store.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
17 tests passed
```

The two new cases use the real encrypted repository and migration against isolated
pg-mem with a fixture vault. They check a fresh read for each dispatch/replay,
pickup, acknowledgement and browser display, then mutate the durable revocation
state and reject all those operations plus status/event inspection. Direct cached
store access remains rejected. A failed durability barrier, foreign owner and
wrong task also reject without damaging the original binding.

These tests do not prove production handler wiring, native disk restart, genuine
consent or environment execution. Public recovery still reports runtime binding
inactive until that integration is complete. No EXE was rebuilt or launched.
Original CS1-CS4 and final CS5 remain open; ET6 is unpassed. The independent NAV-EQ
lane is preserved and not dispatched by this goal.
