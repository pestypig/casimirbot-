# Late reconciliation after identity switch — September 12, 2026

Snapshot under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md)
and [work program](../../helix-environment-harness-work-program-v1.md).
Classification: presentation and client-side source admission. No server authority
contract or capability maturity changes.

O4/O5 identity/late-response case reproduced in the rendered component with a
controlled HTTP response: restore a reviewed invitation, explicitly reconcile,
switch account while the lookup is pending, then return pairing:null. The old
component continued from the lookup into issuance despite having unmounted.
The regression failed with one POST where zero was required. This is evidence
of a stale browser request, not proof of unauthorized server acceptance.

The issue path now checks component liveness immediately after reconciliation,
including the absent-invitation result, before any issuance or subsequent storage
write. Existing owner/chat remount behavior supplies the identity boundary.
The guard does not cancel an already-sent request, revoke an existing grant, or
replace server authentication/authorization. The original review remains available
for deliberate recovery when its owner returns.

Expanded regression covers both account and chat switches. Full command:

```powershell
npx vitest run client/src/components/agent-access/__tests__/DurableTaskPairing.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1
```

Result: 15 component tests passed. Both delayed absent-invitation cases sent zero
POST requests after the switch and left the new context's approval unchecked.
These are component HTTP fixtures, not real-handler acceptance, pointer/keyboard
consent, native broker recovery or live authorization evidence.

This source guard postdates the running visibility EXE. It is not yet packaged.
The calling tool catalog was independently rechecked this turn and still exposes
none of destination_register, pairing_accept or pairing_recover. No reconnect,
replacement task or production consent automation was attempted. Full O1–O6 and
CS1–CS4 remain incomplete, CS5 remains an incomplete handoff, original ET6 is
unpassed and NAV1 remains gated.
