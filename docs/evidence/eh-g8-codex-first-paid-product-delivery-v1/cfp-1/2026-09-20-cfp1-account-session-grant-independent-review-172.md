# CFP-1 D02 session and client-grant independent review — 2026-09-20

Independent read-only reviewer: `/root/cfp1_closure_review`.

Verdict: **PASS** after correction. The [source gap](2026-09-20-cfp1-account-session-grant-source-gap-171.md) matches source HEAD `cc5a7a4c1ac956606aea756f59e6fcb0324a9f93`. The [D02 lifecycle proposal](../../../work-packets/eh-g8-cfp1-public-session-and-client-grant-lifecycle-decision-v1.md) distinguishes proposed seven-day absolute server sessions and 30-day installation grants from current behavior, and preserves separate program-effect authority, free personal access, account/security review and blocked CFP-2/3 status. Local links resolve.

The reviewer found a material draft defect: a valid web session alone appeared sufficient to renew an installation grant. The packet now requires the current installation grant proof through authenticated IPC, matching device generation, protected-custody delivery of the rotated proof, or fresh explicit approval plus new installation-bound possession proof. It adds denial of web-session-only renewal. A duplicated stale CFP-2.ONBOARD paragraph was removed; the remaining paragraph carries the corrected D02 handoff.

This is a specification-quality review, not an account/security acceptance, installed proof, public identity-mode approval or customer claim. The proposed same-user process/IPC boundary, Google-compatible fresh proof, remote-revoke step-up policy, exact observation latency and final numeric lifetimes still require account/security disposition before D02/CFP-1 freeze.
