# Account-scope recovery package checkpoint

Evidence classes: development package content comparison, isolated launch smoke,
and ordinary signed-out native navigation. No authenticated pairing acceptance.

Package: `apps/desktop/release-account-scope-20260913/win-unpacked/CasimirBot.exe`

EXE SHA256: `66e9ed1c12c7ea66593e59f1f4c88deeb27b9929c74243c23c91eea239d4f276`

Service SHA256: `871fd1ceacda2381cca3f083c1658c79a2a3950e0b81fbf8aa332cf6ba2d2de7`

This package adds the [ordered account observation repair](2026-09-13-profile-account-observation-order.md)
and [write account precondition](2026-09-13-profile-write-account-precondition.md)
to the preceding [profile recovery package](2026-09-13-profile-recovery-package.md).
Focused source tests and two isolated browser cases passed before building.

`npm run build:client` passed in 1m53s (3334 modules), retaining the existing
browser externalization/eval/chunk warnings. From `apps/desktop`,
`npm run pack:dir -- --config.directories.output=release-account-scope-20260913`
passed. The service build retained four existing duplicate-key/case warnings.
No CI, physics, certificate or companion qualification claim is made.

The [content comparison](2026-09-13-account-scope-package.json) matched 645 runtime
files, 635 renderer files and all eight host artifacts inside app.asar, with no
mismatches or extras. The dirty checkout and source commit are recorded there.
EXE identity alone is not renderer identity.

## Launch and ordinary UI

The previous package was observed signed out at Account & Sessions, with blank
credential fields and no active categorization jobs. It was closed normally with
Alt+F4. Process inspection then confirmed no remaining process from its exact
package path. Its files remain available for rollback. No unknown process was
terminated and no profile data was deleted.

The [isolated startup smoke](2026-09-13-account-scope-smoke.json) passed with five
processes, four loopback listeners, full readiness, service listener, native key
vault and preserved protocol registration. It created 79 isolated user-data
files and cleaned its owned test process tree. Minimum free memory was 5.15 GiB;
maximum commit was 44.4%. The existing 4 GiB guard was unchanged. Friends
coordination was NOT_CONFIGURED.

The exact new EXE then launched normally using the existing ordinary profile.
The service reached full API readiness at `2026-09-13T09:19:48.828Z`.
The returned native window ID was `13568358`.

Verified ordinary navigation:

1. Activity & setup → External agent setup → Open Agent Access.
2. Codex App (setup preference) → Open account sign-in.
3. Account & Sessions loaded with blank email/password fields, Auth0 sign-in,
   and the existing Google-not-configured notice.
4. Workspace Memory displayed the current guest New chat and Agent connection
   preferences. This does not prove recovery of the previous origin's records.

One initial native input reported unavailable coordinate geometry. Fresh unique
window selection, activation and screenshot observation allowed the single
retry to succeed. Dependent actions used refreshed state after UI transitions.
No authentication action, consent, device trust, tunnel renewal or environment
mutation was activated. The new app remains open at Account & Sessions.

## Remaining scope

This includes both source repairs in a verified package; it does not prove
ordinary authenticated account switching, pairing restoration, exact prompt
pickup/ack, Ready up or real environment successors. The preceding same-task MCP
presence attempt returned `Session terminated`; this package test does not prove
that external transport recovered. No replacement task or stale claim was used.

The [work program](../../helix-environment-harness-work-program-v1.md) remains
the sole status authority. The [CS5 reconciliation](2026-09-12-runtime-recovery-cs5-reconciliation.md)
retains all missing requirements. CS1–CS4 and O1–O6 remain incomplete; ET6 remains
unpassed and NAV1 is not qualified by this checkpoint.
