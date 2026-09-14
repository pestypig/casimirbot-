Program gate: G8
Workstream: CS1-CS4 prerequisite onboarding repair
Capability or component: O4/O5 persisted chat binding projection invalidation
Lifecycle stage: presentation; evidence normalization
Reaction timescale: fresh runtime unavailability response
Authority owner: server owns durable consent and runtime admission; browser stores projections
Current maturity: implemented
Target maturity: deterministically verified scoped cache invalidation
Required evidence: exact-chat/pairing removal, replacement preservation and setup regressions
Explicit non-goals: no server revocation, durable replacement policy, full browser-cache lifecycle or ET6 substitution
Downstream gate unlocked: none

# Persisted chat projection follows runtime invalidation

Following the reproduced runtime-display defect, source inspection showed that
AgentConnectionSetup's null callback cleared only local React state. Its accepted
binding had also been saved in useAgiChatStore.reasoningTaskBindings, which is
persisted and read by the minimal runtime shell. There was no corresponding
store removal action.

Added a projection-only removal action taking the exact chat and pairing ID.
The setup callback invokes it when the durable component reports that pairing's
runtime unavailable. Removal is idempotent and does nothing if the current chat
entry belongs to a different pairing or has no durable pairing ID. It does not
revoke consent, change server authority, delete chat messages or clear other chats.

Three new store assertions cover persisted removal, repeat removal, unrelated
chat preservation, newer pairing preservation and legacy-binding preservation.
Combined with AgentConnectionSetup and DurableTaskPairing regressions:

```powershell
npx vitest run client/src/store/useAgiChatStore.pairedBinding.spec.ts client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx client/src/components/agent-access/__tests__/DurableTaskPairing.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1
```

50 passed (39 setup, 8 pairing component, 3 store), exit 0, 13.60 seconds.
This repair was identified by tracing the previously reproduced failure; these
new store tests were first executed after implementation, not a new pre-patch
red run. The full parent callback path is not asserted by a new dedicated
Chromium test here. Existing setup tests remain their original coverage.

The separate reasoningTaskBinding localStorage/BroadcastChannel projection
system remains a distinct lifecycle surface; this change does not claim to
invalidate every legacy cache or qualify full account/chat switching. No source
identity or continuation protocol changed. Quick discipline, documentation audit
and scoped diff checks passed. Native packaging and full workflow validation
are outstanding; the existing September 12 package predates this repair.

CS1-CS4, completed CS5 handoff and original ET6 acceptance remain incomplete.
