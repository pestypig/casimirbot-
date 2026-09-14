Program gate: G8.
Workstream: O4 and CS4 ordinary pairing recovery.
Capability or component: review recovery when the previous finite pairing ends.
Lifecycle stage: presentation.
Reaction timescale: human review and bounded status reads.
Authority owner: the human approves a new invitation; authenticated server status governs the previous grant.
Current maturity: specified.
Target maturity: deterministically verified.
Required evidence: terminal previous-pairing state during an unsubmitted replacement; explicit direct recovery with no server mutation, cleared approval, preserved exact selection; rejection of changed or unavailable status; submitted requests retained for reconciliation; pointer and keyboard tests.
Explicit non-goals: no automatic consent, grant extension, altered replacement validation, discarded uncertain submissions, new task, gameplay, or ET6/NAV1 qualification.
Downstream gate unlocked: none; a fresh human review remains necessary.

# Recover a review whose previous pairing ended

Follow the [work program](../helix-environment-harness-work-program-v1.md),
[continuous-session packet](eh-g8-et6-continuous-session-build-v1.md), and
[onboarding packet](eh-g8-cs-onboarding-pairing-plan-v1.md).

Inspection found that an unsubmitted replacement disables its approval button
when the previous grant expires or is revoked/superseded. The panel offers only
"Return to previous pairing"; recovery requires returning to that unusable
grant and then discovering "Review a new invitation". No direct explanation or
recovery is shown in the replacement review. This is distinct from the still
unexplained user report of clicking without an invitation appearing.

Offer an explicit new-review action in this state. Reinspect the exact previous
pairing through the existing authenticated read before releasing the obsolete
replacement metadata. Preserve the exact task/chat/run selection and durations,
generate a fresh request identity, and clear approval. This is a local review
change only; invitation issuance remains a later human action with all existing
server checks. Failed reads, scope mismatch, still-accepted grants and submitted
requests must not take this recovery path.
