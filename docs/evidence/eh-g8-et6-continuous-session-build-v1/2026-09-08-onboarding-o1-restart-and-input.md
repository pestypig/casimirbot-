Program gate: G8
Workstream: O1 under CS1-CS4 onboarding repair
Capability or component: restart baseline and isolated browser input test
Lifecycle stage: source admission; presentation
Reaction timescale: injected store clock and bounded browser interaction
Authority owner: isolated fixture principals only; live human consent unchanged
Current maturity: specified
Target maturity: deterministically verified prerequisite
Required evidence: restart divergence, real pointer/keyboard selection and exact request
Explicit non-goals: no production grants, native click acceptance or durable implementation claim
Downstream gate unlocked: none

Expanded `pairing-onboarding-contract.test.ts` to seven cases: four expected
failures and three ordinary passing isolation checks. The new expected failure
mirrors current `server/index.ts` reconstruction: a new service constructs an
empty binding store and cannot inspect the previously accepted pairing. It
intentionally exposes missing persistence wiring. O2 must replace that setup
with the actual durable loader rather than copy private Maps in the test.
The new ordinary negative rejects a prior-service handle; possession of it is
not proof of durable destination identity.

Added `playwright.onboarding.config.ts` and the isolated component fixture under
`client/e2e/onboarding-isolated/`. The default Playwright configuration starts an
application server; this dedicated configuration does not use it. The fixture
serves only its bundled real AgentConnectionSetup component on an ephemeral
loopback port, uses a fresh browser context, intercepts all API requests and
blocks other origins. It contains no actual account or connector credentials.
No running keyed service was replaced or used for consent simulation.

Two Chromium cases pass: native browser pointer click and keyboard Space select
the exact run; a readiness refresh retains selection; pointer click or Enter
submits one claim request containing the exact fixture client/chat/run/verification;
the returned fixture claim is visible. This is stronger than fireEvent or an
enabled accessibility assertion, but uses fixture API responses and omits the
application shell and production stylesheet. It proves isolated control/input
behavior, not complete layout, native-window interaction, server acceptance,
production isolation or resolution of the reported live checkbox failure.

The first browser attempt failed because the fixture used incorrect association
field names. Those were corrected to the actual schema and explicit schema
validation added. This was a test-fixture defect, not a newly found product defect.

Commands completed with exit 0:

```text
npx playwright test --config playwright.onboarding.config.ts
npx vitest run server/services/local-supervisor/__tests__/pairing-onboarding-contract.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

Persistence inspection: native profile encryption can inform envelope handling,
but browser-writable profile snapshots must not become authority storage. The
durable pairing ledger must be server-owned, encrypted, transactionally updated
and authenticated on reload. Reuse the native credential broker without copying
credentials; separate stable destination identity from service epochs. Current
binding methods and their callers are synchronous, so async persistence needs an
explicit integration migration rather than unawaited writes and optimistic UI.

Next: implement that ledger/contract and convert expected failures into ordinary
passing assertions, preserving exact identity, finite consent and revocation.
O5 still requires full real-handler integration, production fixture rejection and
full-layout tests. O6 still requires packaged evidence. CS1-CS4 remain incomplete,
ET6 unpassed and NAV1 gated.
