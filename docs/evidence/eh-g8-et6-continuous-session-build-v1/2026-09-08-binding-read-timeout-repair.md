Program gate: G8
Workstream: CS1/CS4 binding soft-lock repair
Capability or component: bounded readiness reads and recoverable UI state
Lifecycle stage: presentation
Reaction timescale: ten-second failed read and five-second recovery observation
Authority owner: authenticated readiness server and human binding consent
Current maturity: specified
Target maturity: deterministically verified prerequisite plus packaged rehearsal
Required evidence: hung-read reproduction, preserved selection, stale-response rejection and native package check
Explicit non-goals: no heartbeat synthesis, consent automation, authority widening or ET6 promotion
Downstream gate unlocked: none

The user again reported the binding UI was unusable and requested a product
repair instead of another binding retry. Native accessibility confirmed a
disabled run checkbox, expired binding and unavailable continuation. Capture
and pointer input remained separately unavailable because the native tool could
not obtain monitor/input geometry. This limits live click diagnosis; it does not
justify treating an expired claim or a stale screen as a valid binding.

Inspection identified a reproducible additional soft-lock path. A readiness
fetch or response body can remain pending indefinitely. The loaded state then
retains `refreshing`, disables Recheck connection and makes the recovery observer
skip every later read. The new regression holds the second readiness response
open: before the patch, the recovery button remains disabled after ten seconds.

The repair bounds the complete readiness read, including JSON parsing, to ten
seconds. It aborts superseded requests and rejects obsolete generations, aborts
on unmount, and ignores late completion. A failed refresh retains the mounted
run selection while marking readiness unverified and disabling binding. The
existing five-second observer can then retry only the read, and successful
current verification restores the binding control. No claim is automatically
issued and no failed mutation is retried. A first-read failure retains the normal
manual retry surface; it does not claim restored readiness.

The regression now verifies recovery without losing the checked run or accepting
a late response, plus zero claim POSTs. The setup/expiry battery passes 41/41,
including the earlier deadline-refresh regression and wrong-run/consent cases.
This modifies presentation/read lifecycle only. It does not establish that every
possible blocked request in the application is now bounded, or that the reported
physical click path has passed in a repaired EXE. Build and native qualification
are separate observations. No new binding has been requested from the user while
this repair is being prepared. All full CS1–CS4 exits and CS5 remain incomplete;
ET6 is unpassed and NAV1 gated.
