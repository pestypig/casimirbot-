Program gate: G8
Workstream: CS1-CS4 prerequisite onboarding and deterministic testing
Capability or component: O4/O5 browser pairing through actual public handlers
Lifecycle stage: presentation; source admission; evidence re-entry
Reaction timescale: human-paced pairing and bounded recovery
Authority owner: isolated fixture human approves; exact fixture provider accepts; production Helix validation enforces scope
Current maturity: implemented
Target maturity: deterministically verified for the listed browser integration cases
Required evidence: Chromium pointer/keyboard input, real HTTP handlers, encrypted fixture persistence, loss/reload/revoke assertions
Explicit non-goals: no production consent automation, host task attestation, native process restart, environment actions, ET6 substitution or stage closure
Downstream gate unlocked: none

# Real-browser pairing integration

The previous increment was progress (rejected replacement preservation).
This increment joins previously separate Chromium input tests and jsdom
real-handler tests. Added test-only entry points under
`client/e2e/onboarding-isolated/`:

- `durable-real-handlers.spec.ts`: fresh loopback listener in the Playwright
  worker, production `createAgentConnectionsRouter`, actual migrations and
  encrypted pg-mem repository, registration/transition services and durable
  reasoning binding access.
- `real-handler-exports.ts`: bundles repository server imports with esbuild for
  the test worker; no new production registration or test-bypass endpoint.
- `durable-real-entry.tsx`: renders production `DurableTaskPairing` and displays
  its runtime-binding callback in a fixture div. This is not the full workstation.

Four cases cross pointer/keyboard with normal/lost issuance reply. Pointer uses
375x640 and keyboard uses 1280x640. They exercise actual checkbox activation and
approval buttons in Chromium, then real HTTP issuance and encrypted database
queries. Browser requests to other origins are blocked. Each test owns an
ephemeral fixture key, database, session resolver and provider identity; no
production credentials or native account stores are read for authentication.

The provider acceptance step invokes the actual transition service through its
fixture credential resolver from the test process. It does not invoke an actual
external MCP client, host automatic delivery or an HTTP consent-bypass route.

## Verified assertions

| Boundary | Assertion |
| --- | --- |
| Native browser input | Pointer click / keyboard Space checks the consent checkbox; click / Enter submits approval |
| Issuance | Exactly one pairing row and one issuance POST |
| Lost response | Actual handler commits; Playwright discards only its reply; reload recovers pending state without another issuance POST |
| Exact acceptance | Wrong fixture provider is denied; repeated valid acceptance returns the same projection |
| Visible acceptance | Check acceptance updates the runtime-binding callback; the invitation field disappears |
| Recovery | Replacing service/store objects over the retained encrypted database changes transient binding identity without extending its deadline; renderer reload exposes that new identity without reapproval |
| Revocation | Rendered revoke control commits revision 3 through the real HTTP route, clears runtime-binding display, and subsequent recovery rejects `pairing_revoked` |
| Duplication and secrecy | One issuance plus one revoke POST; one pairing row; invitation secret absent from browser localStorage |

The fake durability callback does not establish disk flush or native key-vault
recovery. Service-store replacement stays in the same process and database;
it is not process/disk/new-port restart acceptance. The runtime callback display
is not prompt delivery, provider pickup or an assistant answer. These tests do
not exercise the optional environment-run selection or confer gameplay authority.
No elapsed-idle or expiry timing claim is made from these four cases.

## Execution

First attempt stopped during module loading: repository JSON imports lacked
the native ESM import attributes Playwright requires. No test ran. The fixture
now uses esbuild to bundle those server imports, preserving actual handlers.
Temporary bundles are created under `.tmp/onboarding-real-handlers-*` and removed
only after their resolved paths are checked against `.tmp`.

```powershell
npx playwright test --config=playwright.onboarding.config.ts durable-real-handlers.spec.ts
```

Four passed, exit 0, 11.7 seconds including setup. Then the whole isolated
onboarding suite ran to check cross-fixture cleanup and existing input regressions:

```powershell
npx playwright test --config=playwright.onboarding.config.ts
```

Sixteen passed, exit 0, 30.0 seconds: eight existing clipboard/input cases,
four existing API-intercepted viewport/overlay cases and four new real-handler
cases. The earlier API-intercepted cases remain that evidence category; their
passing titles do not upgrade them to real-handler persistence or idle evidence.
Repeated execution is not additional distinct coverage. Non-actionable
NO_COLOR/FORCE_COLOR warnings were emitted.

This increment changes tests only. The production build graph is not extended
with these entry points, and the running September 8 EXE remains untouched.
Package fixture-isolation verification remains required on the eventual new
artifact; source location alone is not a package audit. No Casimir adapter or
certificate assertion is made.

## Goal reconciliation

This closes the previously missing connection between browser pointer/keyboard
input and real pairing HTTP/persistence handlers for the listed cases only.
O5's complete timer, identity, consent, recovery, automatic-path, authority and
isolation matrix remains incomplete. Full workstation/native layout, coherent
legacy/durable guidance, durable supersession, persisted outbox/event recovery,
host-attested exact task list/send/accept and ordinary packaged consent remain.
CS1-CS4 and CS5 retain every original exit. There is no new CS3 movement or CS4
environment interruption evidence; ET6 remains unpassed and no NAV lane is unlocked.
