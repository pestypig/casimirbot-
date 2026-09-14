# Packaged onboarding account and storage recovery checkpoint

Evidence classes: build/content comparison, isolated packaged launch smoke,
ordinary signed-out native navigation. Not authenticated pairing acceptance.

Current package:
`apps/desktop/release-owner-recovery-20260913/win-unpacked/CasimirBot.exe`.
EXE SHA256: `66e9ed1c12c7ea66593e59f1f4c88deeb27b9929c74243c23c91eea239d4f276`.
Service SHA256: `871fd1ceacda2381cca3f083c1658c79a2a3950e0b81fbf8aa332cf6ba2d2de7`.

This adds the [setup account-event listener](2026-09-13-setup-account-event-recovery.md),
[artifact ownership filter](2026-09-13-profile-artifact-owner-admission.md), and
[queued ownership recheck](2026-09-13-profile-queued-owner-recheck.md) to the
previous account-scope package. The EXE and service hashes are unchanged because
the changes are in separately packaged renderer assets; EXE identity alone does
not establish renderer identity.

`npm run build:client` passed in 2m9s with 3334 modules. From `apps/desktop`,
`npm run pack:dir -- --config.directories.output=release-owner-recovery-20260913`
passed. Existing browser externalization/eval/chunk and four service duplicate
key/case warnings remain. No CI/certificate or companion qualification is claimed.

The [content comparison](2026-09-13-owner-recovery-package.json) matched 645
runtime files, 635 renderer files and eight host artifacts with no mismatches
or extras. It records the source commit and dirty checkout. Earlier focused
source/browser tests retain their exact scopes in the linked evidence.

The old account-scope EXE was observed signed out with no active categorization
jobs, closed normally with Alt+F4, and its exact process-path absence verified.
Its files and ordinary profile were preserved. The
[isolated launch smoke](2026-09-13-owner-recovery-smoke.json) passed: five
processes, four loopback listeners, full readiness, service receipt, native key
vault and preserved protocol registration. Minimum free physical memory was
5.01 GiB; maximum commit 44.8%; the 4 GiB guard remained unchanged. Friends
coordination was NOT_CONFIGURED. The smoke cleaned its owned process tree.

The new EXE then launched with the ordinary profile. Service readiness was
observed at `2026-09-13T10:05:11.243Z`; native window ID was `5376642`.
All six observed CasimirBot processes belonged to the new package path.

Ordinary pointer navigation passed: Activity & setup → External agent setup →
Open Agent Access → Codex App preference → Open account sign-in. The account
panel loaded with empty email/password controls, Auth0 sign-in, no linked
accounts and no active categorization jobs. It remains open beside Agent Access.
The first input reported unavailable coordinate geometry; one fresh selection,
activation and screenshot observation allowed the single retry to succeed.
No credentials, sign-in, trust, transport renewal or consent controls were used.

This establishes that the fixes are packaged and basic native navigation works.
It does not prove account-event behavior after genuine login, authenticated
pairing, exact delivery/pickup/ack, Ready up, idle/restart binding recovery or
live successors. The [CS5 inventory](2026-09-13-account-recovery-cs5-reconciliation.md)
retains every missing exit; its older running-package statement is superseded
by this checkpoint only. The
[work program](../../helix-environment-harness-work-program-v1.md) remains the
sole status authority. CS1–CS4/O1–O6 remain incomplete, ET6 is unpassed, and NAV1
is not qualified by this evidence.
