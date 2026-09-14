# Native open wait recovery supplement

Classification: presentation. Scope: O4 UI recovery prerequisite; not O6 acceptance.

At 17:22 UTC the running journal package still displayed NOT LINKED and Waiting
for Auth0 after the operator reported Accept. The current browser inventory no
longer contained the authorization tab. The independent OAuth diagnostic journal
contained only the earlier 17:15:51 negative probe received/rejected markers.
Windows protocol registration pointed to the running journal package. These
observations do not establish whether the browser dispatched the real callback,
nor prove that consent failed. The browser handoff remains unresolved.

Independent deterministic inspection found a recovery gap: awaitingCallback was
set only after the native open promise resolved. A hung open therefore prevented
both Stop waiting and the receipt deadline from taking effect. A new fixture with
a pending native open and an elapsed receipt failed before the repair: 1 failed,
9 passed, with no deadline alert and the Waiting for Auth0 control still present.

Source now establishes the recoverable wait before awaiting the native bridge.
A local generation invalidates pending asynchronous UI updates after a deadline,
Stop waiting, completion or unmount. Late open rejection cannot overwrite the
deadline; late open success cannot restore waiting. This generation is UI
bookkeeping, not an authenticated OAuth transaction identity. Consent, server
expiry, token validation and account authority are unchanged.

Validation command:

```text
npx vitest run client/src/components/agent-access/__tests__/AgentAccountBindingReadiness.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1
```

Result: 11/11 passed at 13:24:50 America/New_York. Added cases separately settle
the hung promise successfully and unsuccessfully after the deadline, retaining
the deadline explanation, enabled retry, one POST, one native open and no
inferred account link. These are jsdom component fixtures, not pointer/keyboard,
real-handler OAuth, packaged or live acceptance evidence. The initial start
request/body hanging and correlation of distinct native callback transactions
remain outside this test's coverage.

This change is source-only; release-oauth-journal-20260913 remains running and
has not been rebuilt or restarted for this repair. No existing evidence snapshot
was rewritten. The full CS5 inventory and all original CS1–CS4/O1–O6 exits remain
required. ET6 remains unpassed; NAV1 remains unqualified. The canonical work
program remains the sole status authority.
