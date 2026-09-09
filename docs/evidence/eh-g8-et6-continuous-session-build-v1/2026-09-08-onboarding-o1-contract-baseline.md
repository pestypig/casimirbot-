Program gate: G8
Workstream: O1 under CS1-CS4 onboarding repair
Capability or component: invitation lifetime and exact acceptance baseline
Lifecycle stage: source admission
Reaction timescale: deterministic injected clock
Authority owner: fixture human owner and exact fixture client; no live authority
Current maturity: specified
Target maturity: deterministically verified prerequisite
Required evidence: first-divergence contract fixtures and preserved isolation negatives
Explicit non-goals: no production behavior change, human consent automation, integrated acceptance or ET6 promotion
Downstream gate unlocked: none

The user requested pursuing the onboarding plan as a persistent goal. The goal
preserves O1-O6, all original CS1-CS4 exits, CS5 reconciliation and ET6/NAV1 gates.

Added `server/services/local-supervisor/__tests__/pairing-onboarding-contract.test.ts`.
The fixture uses the actual existing binding store with an injected clock and
isolated in-memory principals. It never contacts the running service.

The test runner reports five passing cases, but this means **three expected
failures and two ordinary passing isolation checks**, not five implemented new
requirements. The three `it.fails` cases pin the desired contract against legacy
behavior: 15-minute invitation lifetime, acceptance after 301 seconds of idle,
and idempotent repeated acceptance. Inspection confirms the legacy 300-second
cap and deletion of the consumed handle. O2 must replace these expected-failure
markers with ordinary assertions against the durable implementation; unexpected
success must fail the baseline so it cannot silently remain an expected failure.

The two ordinary tests verify that stale heartbeat alone cannot issue a new
invitation and that a foreign client cannot consume an approved invitation.
The rightful fixture client can still consume after the rejected foreign attempt.

Command completed with exit 0:

```text
npx vitest run server/services/local-supervisor/__tests__/pairing-onboarding-contract.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

This is the first O1 increment. Durable restart and real pointer/keyboard
fixtures remain required; O1 is not claimed complete. No running package,
production consent contract, presence lifetime or environment lease changed.
CS1-CS4 remain incomplete, ET6 unpassed and NAV1 gated.
