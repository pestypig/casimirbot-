# Ordinary restart: renderer origin recovery boundary

Evidence class: source inspection and isolated Chromium diagnostic, not a repair
or packaged/live acceptance. Scope: O1/O4/O5/O6 recovery and CS4; no gate advancement.

The current desktop `createDesktopRuntime` reserves a new loopback port using
`listen(0)` and loads the renderer from that runtime origin. Chat persistence in
`useAgiChatStore` uses browser localStorage. Agent setup preferences also use
localStorage. `clearDesktopEphemeralWebCaches` clears only service workers and
CacheStorage; it deliberately excludes localStorage. Preserving that store does
not make it accessible from another origin.

Added diagnostic:
`client/e2e/onboarding-isolated/origin-recovery-boundary.spec.ts`.
It bundles the actual chat store and setup serialization/reducer functions into
two isolated HTTP servers on independently allocated loopback ports. A fresh
Chromium context saves a fixture chat and Codex preference at the first origin.
Same-origin reload retains both. The second origin cannot recover either and
defaults setup to Choose. Returning to the first origin restores the exact saved
state. No production account, credentials, consent or environment executor is used;
requests outside the two fixture origins are blocked.

Command: `npx playwright test --config playwright.onboarding.config.ts origin-recovery-boundary.spec.ts`

Result: 1 passed, 4.1 seconds. The assertions characterize the existing defect;
a passing diagnostic is **not** a recovery acceptance result.

The existing `profileStorageSync` restoration path waits for an authenticated
profile ID. That is a separate possible recovery path, not proof of signed-out
local recovery. This test does not establish why account authentication is absent;
cookies and account grants must be investigated separately.

Next implementation must preserve ordinary renderer state across service-port
changes while retaining exact trusted-renderer checks and account isolation.
Do not adopt a fixed port, copy arbitrary browser stores, export credentials,
or treat a recovered binding projection as current authority. Recovery must
revalidate the durable pairing and finite grant against the current service.
Tests must cover account separation, corruption, restart/new port and no duplicate
effects before packaged qualification. The running account-entry package was
left untouched, with human sign-in still pending.

All complete O1–O6 and CS1–CS4 exits remain unproven; CS5 remains an incomplete
requirement inventory. Original ET6 remains unpassed and NAV1 is not unlocked.
