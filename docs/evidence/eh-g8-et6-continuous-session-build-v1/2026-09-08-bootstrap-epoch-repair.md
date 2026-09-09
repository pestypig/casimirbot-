Program gate: G8 — CS1 active, original ET6 unpassed
Workstream: Continuous-session first-goal recovery
Capability or component: Same-subject epoch repair before durable goal bootstrap
Lifecycle stage: evidence normalization
Reaction timescale: session preparation
Authority owner: authenticated exact task and existing selected subject; goal authority policy remains authoritative
Current maturity: specified integrated prerequisite
Target maturity: unchanged CS1 exits
Required evidence: same-subject recovery, revoked/changed identity rejection, authority preservation, packaged proof
Explicit non-goals: no player selection, permission renewal, model loop, gameplay or ET6 claim
Downstream gate unlocked: none

# First-goal stale-epoch boundary

Live subject listing at 17:35:42.675791500Z showed the exact existing DatDamPig
subject in a fresh directory, with its retained binding marked stale solely at
the old producer epoch. After refreshing this continuation's expired presence,
the supported Ready up request with an explicit caller-authored bootstrap
objective returned environment_session_subject_changed. No repairs or goal
creation occurred. The supplied action authority was the previously observed
expired authority; no new permission was implied or exercised.

Source inspection showed bootstrap rejecting any non-active subject before it
could reach the existing later epoch repair. Bootstrap now admits only the same
retained subject ID and participant, rejects revoked selection, invokes the
existing fresh-directory epoch repair, then revalidates exact run association
and returned room/environment/subject identities before goal creation. Goal
creation still enforces its own finite action authority. No permission is
renewed and no new subject is selected.

The focused prepare-browser-session (31) and ready-up-session (12) suites pass
43 tests. New cases cover successful same-identity repair, foreign refreshed
subject, revoked selection, association loss during repair and expired goal
permission. Prior repair evidence is retained if a subsequent boundary fails.
The full discipline command is running at this snapshot because epoch recovery
changed; no PASS is claimed yet. Renderer build and runtime staging had passed
for the navigation/display changes. The bootstrap repair still needs host build
and package verification. No second binding approval has been requested.

Current finite run deadline remains 2026-09-08T17:43:50.629Z. Expiry must be
observed and handled through supported preparation rather than silently
extending it or substituting another run. CS1–CS4 and CS5 remain incomplete,
ET6 unpassed and NAV1 gated.
