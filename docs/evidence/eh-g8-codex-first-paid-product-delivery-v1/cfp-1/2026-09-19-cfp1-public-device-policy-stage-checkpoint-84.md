# CFP-1 public account/device/offline policy checkpoint — 2026-09-19

The [decision brief](../../../work-packets/eh-g8-cfp1-public-account-device-and-offline-policy-decision-v1.md)
consolidates verified public account ownership, free personal device allowance,
per-node grants, replacement, hosted trial aggregation and outage wording.
It recommends multiple separately enrolled personal Windows computers without
a purchase cap and no general offline-use claim at launch. Both customer
terms remain **pending owner selection**; account/security owners still must
freeze session expiry, reauthentication and revocation bounds.

Current source supports profile-scoped installed-device rows, revoke and
recovery, but current management is developer-facing and imposes no device
count. Independent review found that `registerDevice` can reactivate a revoked
same-ID row without incrementing `recovery_generation`, unlike `recoverDevice`.
The brief and CFP-2.PUBLIC now require rejection or atomic generation/fencing
for **every** reactivation path and a negative test against the old MCP,
source, hosted reference and effect authorities. A second read-only reviewer
spot check passed. `npm run helix:environment-harness:docs-audit` returned
`ok: true` and changed-file `git diff --check` passed. No runtime, account,
database, payment, Codex configuration or release setting changed.

**Stage decision:** CFP-1 remains active (`specified`), CFP-2/3 blocked.
Owner device/offline choices, account/security bounds and the other recorded
rights, cost, scope and acceptance decisions still precede CFP-1 closure.
