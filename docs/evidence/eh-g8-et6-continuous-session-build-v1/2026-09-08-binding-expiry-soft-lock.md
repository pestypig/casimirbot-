Program gate: G8
Workstream: CS1/CS4 ordinary binding recovery
Capability or component: Agent Access presence-deadline observation
Lifecycle stage: presentation
Reaction timescale: finite presence expiry and UI status recovery
Authority owner: authenticated server readiness; human binding consent unchanged
Current maturity: specified
Target maturity: deterministically verified prerequisite plus packaged rehearsal
Required evidence: reported checkbox failure, live state inspection, deadline regression and artifact qualification
Explicit non-goals: no synthesized heartbeat, consent automation, lease extension or ET6 promotion
Downstream gate unlocked: none

The user reported that the running EXE would not let them select the verified
run checkbox. The previous native observation had shown expired task presence.
At 20:31:05.468Z the same task refreshed authenticated presence, preserving the
original room and verified retained run. A native accessibility read then showed
the exact run checkbox and Bind current Helix chat button without disabled state,
and 2:58 remaining presence. No consent control was activated. Screenshot capture
failed independently with a monitor-capture error; accessibility inspection
remained available. The user's successful physical checkbox click has not yet
been confirmed, so this does not prove all reported click failures are resolved.

Source inspection found a separate reproducible recovery defect: automatic
five-second reads stop when the verified run becomes ready, while the expiry
notice updates only its own local countdown. The panel therefore does not read
current server state at that deadline without focus/manual recheck. A regression
with a future two-second deadline and a subsequently refreshed server response
failed before the patch: one readiness read instead of two.

The repair schedules a read-only readiness check at the displayed heartbeat
deadline. It defers behind an in-flight read or binding operation, avoids hidden
window polling, cancels when context/deadline changes and uses the existing
focus/recovery checks. It keeps the loaded control mounted while reading and
preserves the exact human-selected run verification. It does not mint presence,
wake a task, issue a claim, extend permission or treat local time as authority.
An unchanged expired server response does not continuously reschedule itself.

The focused setup/expiry battery passes 40/40 tests. The new regression verifies
same-checkbox identity, preserved selection, one deadline read, no claim POST
and no extra reads before the renewed deadline. Existing wrong-run, stale
selection, unavailable-continuation and consent separation cases still pass.
Quick discipline passed; changed-checkout categories include unrelated files.
The patch classification is presentation. No Casimir verification applies to
this non-physics UI change.

The current running package was preserved during repair and build. It does not
contain this new automatic deadline check. The current enabled-state observation
comes from supported MCP presence recovery, not installation of the source fix.
Packaging is recorded separately. Native click confirmation, the full packaged
workflow and every unclosed CS1–CS4/CS5 criterion remain required. ET6 is unpassed
and NAV1 gated.
