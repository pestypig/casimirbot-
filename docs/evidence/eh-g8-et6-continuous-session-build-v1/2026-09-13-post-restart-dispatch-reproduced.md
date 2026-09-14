# Post-restart browser dispatch failure reproduced

After the operator reported clicking Open, native inspection successfully selected
the harmless diagnostic tab and opened its read-only DevTools console. The console
showed one Launched external handler entry for the fabricated access_denied callback
with diagnostic invalid state. The native external-app prompt was no longer shown.
This is post-restart evidence: Chrome's verified restart was at 19:43:26 UTC.

The application journal still ended at 19:35:51 UTC with the earlier direct Windows
positive control. No newer process_entry, second_instance or received event was
present. A process inventory also showed no surviving new callback-bearing
CasimirBot process; this does not exclude a process that exited before inspection.
The registered command still matched the running status-recovery package.

The browser restart did not repair the reproduced symptom. A missed operator click
cannot explain this observed post-restart dispatch attempt. Chrome's console text
is dispatch initiation, not Windows process-launch success; the remaining boundary
is Chrome/Windows dispatch through application entry. No second consent click or
further restart is justified merely by this result.

A separate Auth0 authorization page was visible during inspection and was not
submitted. No real OAuth callback, credential, grant or binding was handled by
the diagnostic. No product code or protocol registration was changed in this
correlation. CS1–CS4/O1–O6 remain incomplete; CS5 remains required, ET6 unpassed,
and NAV1 unqualified.
