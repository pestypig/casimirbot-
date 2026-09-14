# Pairing clipboard failure through real handlers

Classification: presentation; test-only extension. O4/O5 UI matrix contribution.

Extended the existing durable-real-handlers browser journey with clipboard
denied and unavailable cases before successful copy. Only the browser clipboard
method was injected. The invitation still came from the production route,
transition validation and encrypted repository with fixture identity and pg-mem.
Neither a production session nor human-only production consent was used.

```text
npx playwright test --config=playwright.onboarding.config.ts durable-real-handlers.spec.ts --grep 'lost reply=false'
```

Result: two selected journeys passed, one worker, 57.4 seconds overall; pointer
journey 8.1 seconds and keyboard journey 3.5 seconds. Other parameterized fault
variants were filtered out. The bundle emitted its existing import.meta/iife
warning. No assertion failed. Host free memory was about 1.04 GiB during the run;
no second worker/build tree was started.

Each journey now asserts denied and unavailable copy expose manual fallback,
focus the invitation field, select its full contents, preserve the exact
invitation, preserve the complete database row including deadlines/acceptance,
and keep the mutation count at one. Restoring the fixture clipboard then permits
successful copy. The remaining existing acceptance, recovery, replacement and
revocation assertions in the same selected journey also completed.

These are real-handler browser fixtures using an in-memory database and injected
identity/encryption boundary, not a native PostgreSQL contention, disk restart,
production clipboard permission or actual-host delivery acceptance claim.
Complete O4/O5 matrix coverage is still unproved. This test-only change needs no
new EXE to exercise product behavior. The current production consent page was
still awaiting Accept when inspected before this run and was preserved.

This supplements the requirement-level CS5 reconciliation without promoting any
exit. All original CS1–CS4 and O1–O6 requirements remain required. ET6 is unpassed;
NAV1 is unqualified.
