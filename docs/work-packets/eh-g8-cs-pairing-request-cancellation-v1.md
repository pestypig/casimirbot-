Program gate: G8
Workstream: CS1-CS4 prerequisite onboarding recovery
Capability or component: expired or uncertain invitation request cancellation
Lifecycle stage: tool admission; evidence re-entry; presentation
Reaction timescale: human-paced review with bounded storage contention
Authority owner: authenticated browser owner cancels; authenticated destination acceptance remains separate
Current maturity: specified
Target maturity: deterministically verified prerequisite and separately evidenced packaged rehearsal
Required evidence: expired-run recovery, cancellation/issuance races, lost reply/reload, owner isolation, unchanged deadlines and zero late authority
Explicit non-goals: no production consent automation, request reset from absence alone, gameplay grants, private runtime, automatic delivery qualification, ET6 or NAV1 promotion
Downstream gate unlocked: none; all parent CS1-CS4 and CS5 requirements remain

# Cancel an invitation request before reviewing again

This repair continues [the onboarding packet](eh-g8-cs-onboarding-pairing-plan-v1.md)
under [the environment work program](../helix-environment-harness-work-program-v1.md).
Classification: tool admission, evidence re-entry and presentation. It is an
independent G8 prerequisite repair and does not assume qualified movement.

The isolated real-handler browser test returns `pairing_environment_unavailable`
for an expired run and creates no pairing. The current UI freezes the submitted
selection and repeatedly issues the same rejected request. A GET reporting no
row cannot safely release that request: an older write may still commit later.

Freeze the repair contract before editing:

1. Cancellation requires the authenticated browser owner and exact request ID.
   It reduces authority and never creates or renews an approved pairing.
2. Atomically reserve cancellation in the existing encrypted ledger's unique
   owner/request slot. An absent request receives a distinct cancellation record
   with no destination, secret, consent assertion or action authority. A late
   issuance cannot replace it. Existing pairing records retain their identity.
3. If issuance already won, cancel that exact pairing through existing owner
   revocation. Do not report cancellation complete until the durable revocation
   or cancellation reservation is confirmed. Acceptance races must not leave
   usable authority after a successful cancellation response.
4. The UI keeps the original request through timeout, malformed reply, storage
   failure and reload. Only a validated cancellation response permits another
   request ID and a new human review with consent unchecked. Owner/chat changes
   must discard late responses. Canceling a replacement does not resurrect a
   superseded predecessor.
5. Expired-run errors explain the recovery action. Existing pending/accepted
   state, automatic delivery and request retries remain truthful and scoped.
6. Exercise actual encrypted storage and public HTTP routes plus rendered
   pointer/keyboard input with production CSS in an isolated fixture. Include
   both orderings of delayed issuance/cancellation, duplicate cancellation,
   lost durability responses, foreign owner/model-origin denial and restart.

Run focused storage/route/UI/browser regressions, applicable discipline checks,
docs audit and package verification. Retain the existing keyed EXE until a
verified replacement is ready. No new user trust approval is needed solely for
this code change. Integrated acceptance and the CS5 handoff remain required.
