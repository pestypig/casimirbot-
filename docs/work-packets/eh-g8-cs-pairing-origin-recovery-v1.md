Program gate: G8
Workstream: CS1-CS4 prerequisite onboarding recovery
Capability or component: exact-owner pairing review recovery after a local origin change
Lifecycle stage: presentation; evidence re-entry
Reaction timescale: human-paced review and bounded authenticated profile restore
Authority owner: authenticated profile owns review metadata; the server owns every pairing transition
Current maturity: specified
Target maturity: deterministically verified prerequisite with separate packaged evidence
Required evidence: failing profile-backup fixture, new-origin actual-handler pointer/keyboard recovery, owner and secret exclusion, no automatic consent mutation
Explicit non-goals: no gameplay grants, new approval, credential backup, provider wake, private runtime, ET6 or NAV1 promotion
Downstream gate unlocked: none until the parent exits are evidenced

# Recover a pairing review when the native port changes

This G8 prerequisite follows the [work program](../helix-environment-harness-work-program-v1.md),
[onboarding packet](eh-g8-cs-onboarding-pairing-plan-v1.md),
[continuous-session packet](eh-g8-et6-continuous-session-build-v1.md) and
[native issuer repair](eh-g8-cs-native-pairing-issuer-v1.md).
It can be tested independently while separate human gameplay consent is pending.
Classification: presentation and evidence re-entry; no continuation identity or
runtime protocol change is proposed.

The native host reuses an available previous port, but must fall back when that
port is occupied. Pairing review metadata currently exists only in that origin's
local storage and is absent from the authenticated encrypted profile backup.
Existing chat and connection preference recovery therefore does not recover the
same request on the fallback origin.

Freeze these requirements before repair:

1. Reproduce the missing reviewed request in the real profile payload before
   changing production code. Use an isolated fixture, never production consent.
2. Reuse authenticated encrypted profile storage. Include only strict, bounded,
   exact-owner/chat recovery metadata: reviewed request, draft, destination
   digest, pairing identifier and any validated previous-pairing review.
3. Never persist an invitation secret, checked consent state, runtime binding,
   presence, connector credential, action permission or derived readiness.
   Restored data is a lookup hint, never current authority.
4. Restore performs only authenticated reads. An absent or denied request stays
   unresolved until explicit reconciliation or cancellation; no background POST
   may mint consent. Existing server ownership, scope, expiry and revocation
   checks remain mandatory and deadlines do not change.
5. Preserve exact retry identity across a lost reply and new origin. Test actual
   account/profile handlers, pairing routes and encrypted repositories with
   pointer and keyboard controls. Assert no extra issuance on restore and one
   durable pairing. Test foreign-owner/chat and invalid/secret-bearing records.
6. Test draft, pending and accepted recovery separately. A restored draft remains
   unchecked. Keep component, browser integration and packaged evidence separate.

Do not interrupt the current native gameplay consent review to rehearse this
patch. Package and native fallback recovery require a later deliberate test;
passing isolated checks alone does not close O6 or CS1-CS4.
