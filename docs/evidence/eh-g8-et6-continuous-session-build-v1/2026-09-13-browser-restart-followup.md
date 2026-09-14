# Browser restart diagnostic follow-up

Supplement to the manual browser dispatch correlation; this is diagnostic
evidence, not a new roadmap or acceptance result.

The first browser-tool restart attempt left an about:blank tab and did not
restart Chrome. Native address-bar navigation subsequently restarted Chrome:
the oldest observed process changed from 03:21:08 to 15:43:26 America/New_York
on 2026-09-13 (19:43:26 UTC). Existing tabs were restored. The harmless local
probe initially displayed connection refused because its bounded listener had
expired; the same probe was restarted on the same loopback port.

The post-restart reload was stopped by Computer Use's browser URL verification.
On the following goal turn the existing browser connection, ID 2, still reported
unavailable. No alternate browser identity or security bypass was used. The app
diagnostic journal still ended with the 19:35:51 UTC direct Windows control:
process_entry, second_instance, received, rejected.

Consequently the stale-browser-process hypothesis remains untested: there is no
post-restart browser dispatch observation to compare. Restart success must not
be reported as callback repair. The next discriminating check is a harmless
browser dispatch with contemporaneous application journal observation after
supported browser control is available. Another restart or OAuth approval is
not justified by this evidence.

No code, protocol registration, permissions, grants or account bindings changed
in this follow-up. CS1–CS4 and O1–O6 remain incomplete; the full CS5 reconciliation
remains required. ET6 remains unpassed and NAV1 unqualified.
