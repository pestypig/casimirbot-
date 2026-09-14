# Isolated launch of the frontier-lease package

Evidence class: isolated packaged launch smoke. Supplements the
[build/content checkpoint](2026-09-13-frontier-lease-package.md); it supersedes
only that checkpoint's absence of an isolated launch result.

```text
& apps/desktop/scripts/smoke-packaged-launch.ps1 -ExecutablePath 'apps/desktop/release-frontier-lease-20260913/win-unpacked/CasimirBot.exe'
```

The command exited 0. Its [receipt](2026-09-13-frontier-lease-smoke.json) records
five processes, four loopback listeners, 81 isolated user-data files, full
readiness, service listener, native provider credential key vault and preserved
protocol registration. Friends coordination was NOT_CONFIGURED. Free physical
memory was 4.9 GiB before launch and a minimum 4.34 GiB during the smoke;
maximum commit was 47.2%. The existing 4 GiB guard was unchanged.

The smoke used its own disposable data and owned process tree. After completion,
fresh process inspection found only six CasimirBot processes from the ordinary
profile-settlement package, with no frontier-lease process remaining. The
ordinary service was not replaced and its account panel was left available.
This did not use the ordinary account, any pairing, or environment authority.

The new package has now launched under isolated smoke conditions. It has not
yet replaced the ordinary EXE and has no authenticated native setup, exact
prompt display/pickup/ack, companion deployment or live movement evidence.
The [CS5 inventory](2026-09-13-manual-repair-cs5-reconciliation.md) retains every
missing requirement. CS1–CS4/O1–O6 remain incomplete, ET6 unpassed and NAV1
unqualified; the [work program](../../helix-environment-harness-work-program-v1.md)
remains the sole status authority.
