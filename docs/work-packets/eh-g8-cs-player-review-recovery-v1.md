Program gate: G8
Workstream: CS1-CS4 prerequisite consent review recovery
Capability or component: unsaved Player Embodiment review across connector freshness changes
Lifecycle stage: presentation
Reaction timescale: human-paced review; existing ten-second observation refresh
Authority owner: the human owns action consent; the server owns current subject and action authority
Current maturity: specified
Target maturity: deterministically verified prerequisite with separate packaged evidence
Required evidence: stale/remount red fixture, same-player draft retention, changed-identity exclusion, unchecked consent after recovery, zero automatic mutations
Explicit non-goals: no consent persistence, credential changes, automatic approval or renewal, gameplay execution, private runtime, ET6 or NAV1 promotion
Downstream gate unlocked: none until the parent exits are evidenced

# Keep the user's unsaved capability choices through sensing recovery

This independent G8 prerequisite follows the [work program](../helix-environment-harness-work-program-v1.md),
[continuous-session packet](eh-g8-et6-continuous-session-build-v1.md) and
[onboarding packet](eh-g8-cs-onboarding-pairing-plan-v1.md).
Classification: presentation. It changes no live-source identity, continuation,
action admission or adapter contract.

[Live evidence](../evidence/eh-g8-et6-continuous-session-build-v1/2026-09-14-pairing-origin-cs5-handoff.md)
shows an unsaved four-capability/eight-hour review disappearing when observation
expiry makes the selected subject stale. The parent unmounts the child; after
same-player reverification the child starts with all capabilities and two hours.
The acknowledgement was unchecked and no action authority was created.

Freeze the repair before editing production code:

1. Reproduce active -> stale -> active with the actual parent and child. A narrowed
   review must survive same-player re-entry while its acknowledgement resets.
2. Keep draft fields only: selected capabilities, approval mode, manual-input
   policy and proposed duration. Never retain checked consent, permissions,
   connector secrets, expiry timestamps, pairing codes or readiness in this cache.
3. Scope an in-memory review to the exact room, participant, environment, source,
   world and selected player. Do not key it by a transient subject-binding ID or
   producer epoch. A different participant, player or environment cannot inherit it.
4. Preserve the existing stale-subject gating. Do not keep action controls active
   while the subject is stale. Restoring a draft issues no mutation and extends
   no grant. Successful explicit save clears the unsaved review.
5. Bound retained entries to 32 within the mounted room panel. This fixes
   observation-driven child remounts only; app restart, room-panel closure and
   account-profile backup are not qualified by this transient review cache.
6. Test component transitions and isolated pointer/keyboard controls. Retain
   actual action-route consent checks and separate native evidence. Do not
   disturb the current pending human approval just to test this patch.
