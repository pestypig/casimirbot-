Program gate: G8
Workstream: CS1-CS4 prerequisite onboarding and deterministic testing
Capability or component: O4/O5 encrypted pairing read failures and recovery
Lifecycle stage: evidence normalization; presentation
Reaction timescale: bounded storage read and explicit reconciliation
Authority owner: authenticated owner/destination; Helix fails closed on unreadable or invalid stored grants
Current maturity: implemented
Target maturity: deterministically verified for the listed read-failure cases
Required evidence: real route failure, fixed sanitized codes, browser fault/recovery without writes, focused MCP and UI regressions
Explicit non-goals: no native key reset, production credential access, replacement consent, private runtime loop, ET6 substitution or stage closure
Downstream gate unlocked: none

# Encrypted pairing read failures

Previous increment: progress, real Chromium pairing handlers joined to encrypted
fixture persistence. This increment checks the O5 storage-failure boundary.

The route fixture reproduced an unreadable record returning only
`reasoning_binding_unavailable`: 15 passed, 1 failed. Source inspection also
showed that Zod errors from decrypted stored data reached the route's generic
400 invalid-request mapping. Backend data corruption must not blame caller input.

Added fixed `PairingStorageError` diagnostics. Repository reads distinguish
unreadable encrypted data, invalid decoded schema and stored identity mismatch.
Native broker configuration/envelope refusals also use typed safe errors.
The HTTP route and MCP supervisor wrapper preserve these codes with status 503;
raw broker errors and decrypted payloads are not included. An unreadable record
does not by itself distinguish a missing key from corrupt ciphertext.

The browser admits only enumerated storage error codes from the expected error
envelope and HTTP status. Arbitrary server messages remain excluded. The existing
10-second fetch/body deadline and unknown mutation-outcome behavior are retained;
there is no automatic mutation retry. Production pairing controls display fixed
recovery copy and clear the runtime-binding callback while a loaded pairing's
storage validation is unavailable. They retain the approval/record for recovery.
Restoring readable valid storage and checking acceptance recovers the same
binding without another approval or grant write.

## Verification

- Corrected real HTTP recovery fixture: unreadable and invalid decoded records
  return 503 with their exact safe code; private diagnostic/payload strings are
  absent; encrypted database rows remain byte-for-byte unchanged.
- Actual MCP recovery handler: injected vault-read failure returns an error with
  `pairing_storage_unreadable` and omits the private broker diagnostic.
- Browser transport: only fixed codes propagate; an arbitrary message falls
  back to `pairing_http_503`; mutation outcome remains unknown.
- Four real-handler Chromium cases now each inject unreadable and invalid data
  after accepted pairing. Visible safe blockers and unavailable runtime callback
  are asserted, then the same binding recovers after the fault is removed. No
  new issuance POST or database change occurs during this cycle.

Commands/results:

```powershell
npx vitest run server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts server/routes/__tests__/agent-connections.test.ts server/services/local-supervisor/__tests__/pairing-ledger-repository.test.ts client/src/lib/agent-access/__tests__/durablePairing.spec.ts client/src/components/agent-access/__tests__/DurableTaskPairing.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1
```

79 passed across five files (29/16/18/9/7), exit 0. Earlier scoped run had
42 passing tests before adding the final MCP/browser assertions; overlapping
runs are not distinct coverage.

```powershell
npx playwright test --config=playwright.onboarding.config.ts durable-real-handlers.spec.ts
```

Four passed, exit 0, 12.7 seconds including fixture startup.

Client and server builds passed. Client emitted existing browser-externalization,
tree-sitter eval and mixed-import warnings; server emitted four existing
duplicate-key/case warnings. Client build regenerated doc metadata normally.
Quick discipline passed but inferred no sensitive paths; this is a static result,
not a substitute for the focused handler tests. Docs audit and diff check passed.
No successful identity format or continuation protocol changed; no full discipline
rerun or Casimir adapter/certificate assertion is made for this error-reporting patch.

## Limits and remaining goal

The fault ports use ephemeral fixture encryption and a controlled codec failure
or invalid decoded value. Existing repository tests cover ciphertext/revision
tampering, but this increment does not delete or corrupt a native key, restart a
native process, or prove disk flush/restore. Database query/flush outages and
all destination-registration/native-broker failure modes are not collectively
qualified by this scoped read-path evidence.

No production pairing or gameplay authority was created. The running September 8
EXE remains unchanged; these source and client/server build results are not a
new packaged rehearsal. Whole-panel lifecycle, durable replacement, persisted
outbox/event recovery, supported host task attestation/delivery, remaining O5
matrix rows, O6 native rehearsal and every original CS1-CS4 exit remain required.
CS5 is incomplete, ET6 remains unpassed and no NAV lane is unlocked.
