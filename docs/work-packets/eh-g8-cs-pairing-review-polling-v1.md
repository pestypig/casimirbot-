Program gate: G8.
Workstream: CS1/CS4 and O4 pairing review usability.
Capability or component: native pairing review during status polling and finite run replacement.
Lifecycle stage: presentation.
Reaction timescale: explicit human review; bounded background status reads.
Authority owner: the signed-in human approves the exact task/chat/run; existing server checks admit every request.
Current maturity: implemented.
Target maturity: deterministically verified.
Required evidence: delayed real-component status polling with editable controls; exactly-once explicit foreground operation after a pending read; owner/chat switch cancellation; old versus new run review and unchecked consent; focused regression, docs audit, package identity and native pointer/keyboard rehearsal.
Explicit non-goals: no automatic consent, background mutation, changed identity or expiry rules, game action, private model loop, completed CS stage, ET6 acceptance or NAV1 qualification.
Downstream gate unlocked: review of the prepared new-run invitation only.

# Keep pairing review usable while status is checked

Follow the [work program](../helix-environment-harness-work-program-v1.md),
[continuous-session exits](eh-g8-et6-continuous-session-build-v1.md), and
[onboarding packet](eh-g8-cs-onboarding-pairing-plan-v1.md).

The packaged EXE repeatedly disables all pairing controls during its five-second
status poll. A pointer attempt to open the task selector was followed by a
disabled selector with no dropdown. The same mutex silently drops foreground
operations while the poll is active. Status polling must remain read-only and
must not disable review controls. Explicit foreground requests must serialize
after an outstanding bounded read, execute once, and disappear on owner/chat
unmount. No mutation retry or consent inference is permitted.

The replacement draft also retains the expired run in `review.environment`,
which takes precedence over the new verified run. Offer an explicit review
action that clears the old selection and approval, allowing the human to
include the newly verified run. Preserve submitted requests unchanged for
reconciliation, and preserve the previous accepted pairing until the server
accepts its replacement. Registration refresh did eventually display a current
choice; no registration-store defect is established by the earlier empty UI.
