Program gate: G8
Workstream: CS1-CS4 prerequisite onboarding repair
Capability or component: native MCP pairing account authority
Lifecycle stage: tool admission; evidence re-entry; presentation
Reaction timescale: human-paced approval and bounded reconciliation
Authority owner: authenticated browser owner approves; native delegation authenticates the exact task destination
Current maturity: specified
Target maturity: deterministically verified prerequisite and separately evidenced packaged rehearsal
Required evidence: native issuer reproduction, exact delegated-client checks, external issuer negatives, actual run lookup, same-request native reconciliation
Explicit non-goals: no OAuth impersonation, credential exchange, account-link bypass, new consent, gameplay grants, ET6 or NAV1 promotion
Downstream gate unlocked: none until all parent exits are evidenced

# Match pairing authority to the actual authentication path

This independent G8 prerequisite repair follows the
[work program](../helix-environment-harness-work-program-v1.md),
[onboarding packet](eh-g8-cs-onboarding-pairing-plan-v1.md) and
[continuous-session packet](eh-g8-et6-continuous-session-build-v1.md).
Classification: tool admission, evidence re-entry and presentation.

Native inspection after real human approval reproduced HTTP 403
`pairing_account_link_required`. The native MCP principal has issuer
`urn:casimirbot:desktop-session`; browser invitation issuance incorrectly
requires that issuer's hash to equal an external HTTPS OAuth account issuer.
Native destination registration had already required saved device trust,
an active delegated account session and an active profile account link.
Even removing that mismatch alone would send the external OAuth issuer into
the native run lookup and reject the exact prepared run.

Freeze these requirements before editing:

1. Preserve the native principal's distinct issuer. Do not relabel native
   authentication as an external OAuth token or borrow credentials.
2. Browser native pairing must validate the exact installed-device/profile
   destination, current saved trust, active delegated account session on the
   same profile, exact derived native MCP client identity, and an active
   owner-scoped account link. A native-looking client string alone is not proof.
3. External OAuth destinations continue to require their exact linked issuer;
   unrelated, revoked or absent account links cannot authorize them.
4. Validate run ownership against the authenticated destination's actual issuer.
   Native and OAuth runs do not become interchangeable. Keep all existing
   room, participant, owner, freshness and budget checks.
5. Apply the same browser authority resolver to invitation issuance and accepted
   pairing access. Reconcile the already-approved exact request after repair;
   never create new consent, alter the selected destination or reset deadlines.
6. Show fixed, non-sensitive account/device denial guidance instead of an
   uninformative unknown result, while retaining the original request for
   reconciliation or authenticated cancellation.

Use isolated actual handlers/storage and deterministic wrong-client, wrong
profile, revoked link, inactive delegation and foreign-run cases. Verify native
packaged reconciliation separately after focused tests, builds and docs audit.
The prior human approval is retained; do not ask for another approval solely
because implementation is repaired.

## Native address continuity prerequisite

Before replacing the running package, source inspection found that each launch
chooses a new loopback port, isolating the browser's already submitted review.
Preserve the last healthy native loopback port as a local address preference.
Bootstrap older installations from their existing non-secret readiness receipt;
neither file establishes readiness or authentication. Bind-probe that port on
127.0.0.1, fall back to an OS-selected port when occupied or unavailable, and
never contact or stop its occupant. Keep fresh native session secrets and all
service readiness, identity and grant checks. Persist only after healthy startup.

Verify malformed/foreign address rejection, actual port reuse and occupied-port
fallback deterministically, then observe the original review after native
replacement. This repairs the normal available-port restart path. Pending review
recovery when the old port is occupied still requires separate evidence and must
not be inferred from this change or from profile chat recovery tests.
