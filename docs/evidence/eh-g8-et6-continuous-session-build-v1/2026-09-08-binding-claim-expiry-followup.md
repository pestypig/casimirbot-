Program gate: G8
Workstream: CS1/CS4 binding recovery
Capability or component: expired claim diagnosis and stale native display
Lifecycle stage: presentation
Reaction timescale: finite claim deadline
Authority owner: server claim expiry and human consent
Current maturity: specified
Target maturity: deterministically verified prerequisite
Required evidence: actual claim rejection, visible deadline and current status
Explicit non-goals: no claim replay, consent automation or acceptance promotion
Downstream gate unlocked: none

The user reported reaching the show-once claim screen. Native accessibility
inspection located its value; one MCP claim attempt rejected it with
`reasoning_binding_claim_replayed`. No retry was issued. Source inspection
confirmed this error is also returned after `currentBinding` changes a pending
claim to expired, so it does not prove a previous successful pickup.

The native display showed “Valid until 4:36:02 PM”, “pending claim” and a stale
1:41 countdown. The clock tool reported 21:16:17 UTC (5:16 PM Eastern). Thus the
visible claim had expired. No active binding is inferred. The native input tool
could read accessibility but could not click Check binding because input geometry
was unavailable. No unsupported UI control method was substituted.

The same task refreshed authenticated presence and retained the exact original
run at 21:17:59.470Z. A replacement claim requires human consent; the old value
must not be retried. The claimed expiry must be distinguished from expired task
presence and from Minecraft action authority, whose earlier deadline is separate.

The deadline-read repair package passed content comparison for all 645 runtime
files and three bundles in `2026-09-08-cs4-binding-expiry-package.json`. The
packager's terminal handle was unavailable after the user interruption, so its
exit code is recorded null; direct content verification is the package evidence.
The open EXE was not replaced, and native verification of the repaired package
remains pending. Forty setup/expiry tests, build checks and documentation audit
passed before packaging. Full CS1–CS4 and CS5 remain incomplete; ET6/NAV1 unchanged.
