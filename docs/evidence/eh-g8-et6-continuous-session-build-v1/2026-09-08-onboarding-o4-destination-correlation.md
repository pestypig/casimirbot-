# O4 exact destination correlation — partial deterministic evidence

Classification: evidence normalization and presentation. Prior browser status
recovery checked pairing/chat/run IDs but could not compare the approved task.
Added a shared server destination digest over issuer, profile, installation,
client and task, preserving the registration store's existing hash algorithm.
Registration and owner-scoped pairing status expose this correlation value.
It is not an authenticator and grants no authority. Status continues to omit
raw destination identity and secrets. Existing encrypted records need no rewrite.

The browser records the selected registration's digest and rejects recovered
status with a different digest, including when chat/run IDs match. It persists
the reviewed digest before any invitation write. A missing reviewed digest fails
closed rather than accepting a grant based only on local pairing metadata.

Verification on 2026-09-08, approximately 21:27–21:29 local:

- `npx vitest run client/src/components/agent-access/__tests__/DurableTaskPairing.spec.tsx client/src/lib/agent-access/__tests__/durablePairing.spec.ts server/services/local-supervisor/__tests__/pairing-ledger-contract.test.ts server/services/local-supervisor/__tests__/pairing-destination-registration.test.ts server/routes/__tests__/agent-connections.test.ts server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`: 80 passed.
- After final persistence and real-route assertions,
  `npx vitest run server/routes/__tests__/agent-connections.test.ts client/src/components/agent-access/__tests__/DurableTaskPairing.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1`: 23 passed.
- `npx playwright test --config playwright.onboarding.config.ts durable-pairing.spec.ts`: 2 passed, isolated Chromium pointer/keyboard with intercepted APIs.

The real route assertion compares registration, owner task listing, issuance and
status correlation through the encrypted fixture repository. The policy test
varies each of five identity fields; the rendered test rejects a different
destination digest with the same chat/run. This is not a single joined rendered
real-handler test, native encryption acceptance, host task attestation, automatic
delivery or packaged rehearsal. No production consent was exercised.

Full discipline verification remains due after the completed identity/continuation
integration. Runtime-binding linkage, legacy guidance consolidation, replacement
policy, durable event recovery, the O5 matrix, O6 and original CS1–CS4 exits remain
open. CS5 final handoff and original ET6 are not complete; no NAV promotion.
