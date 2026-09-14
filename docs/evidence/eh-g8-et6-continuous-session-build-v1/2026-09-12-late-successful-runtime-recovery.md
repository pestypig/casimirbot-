# Late successful runtime recovery after identity selection changes

Scope: O4/O5 presentation lifecycle under the
[onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
Test-only change; no maturity promotion or production consent mutation.

Inspected `DurableTaskPairing.tsx`: owner/chat changes remount keyed controls,
and both success and failure callbacks check the retired component's alive flag.
Existing tests covered a delayed HTTP 409 after selection changed but did not
exercise a valid successful runtime-binding response.

Extended `DurableTaskPairing.spec.tsx` to cover account and chat changes for
both delayed success and delayed failure. Successful responses use the same
valid binding fixture as the positive publication test. After the old read
finishes, the parent binding callback remains untouched, no recovered-session
or accepted-status display appears, the new approval is unchecked, and all
requests remain GETs. This tests a stale response that ignores cancellation.

`npx vitest run client/src/components/agent-access/__tests__/DurableTaskPairing.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1`
passed 19/19 tests. Production code and the running package were unchanged.
These are rendered jsdom component tests with mocked HTTP, not real-handler
browser, native input, current authenticated pairing or environment acceptance.
Full O1–O6 and CS1–CS4 requirements remain open; original ET6 is unpassed.
