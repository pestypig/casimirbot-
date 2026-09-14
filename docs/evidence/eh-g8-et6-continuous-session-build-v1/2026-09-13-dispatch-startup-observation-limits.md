# Dispatch startup observation limits

Read-only follow-up to the post-restart dispatch reproduction. Inspection of
apps/desktop/src/main.ts confirms that process_entry is emitted after imports,
process-output guard installation, default-protocol registration, callback parsing
and optional user-data override validation. Consequently no journal entry is not
proof that Windows created no process. Early initialization failure and failure
to launch remain distinct, unresolved possibilities. No new startup instrumentation
has been packaged or tested in this follow-up.

A bounded two-hour query of Windows CodeIntegrity/Operational returned twelve
matching CasimirBot events. The newest matching events were at 14:52:06 local,
before the 15:43:26 Chrome restart and later callback reproduction. They concerned
nvspcap64.dll not meeting Microsoft signing-level requirements, not a correlated
post-restart CasimirBot launch denial. These entries do not establish the cause
of the callback failure. No security settings or overlay settings were changed.

The existing direct Windows control and post-restart Chrome failure remain the
discriminating observations. A process surviving a later inventory is not required
for a transient launch, and browser console text is not an OS launch receipt.
No acceptance status advances: CS1–CS4/O1–O6 remain incomplete, CS5 required,
ET6 unpassed and NAV1 unqualified.
