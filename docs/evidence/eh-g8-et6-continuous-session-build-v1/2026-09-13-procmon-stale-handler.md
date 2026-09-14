# Process Monitor identifies the stale handler

The operator captured and saved the filtered trace. The CSV contains 2,928 rows
for chrome.exe and casimirbot.exe. The adjacent JSON preserves only six decisive
registry-query/file-lookup rows and the source hash, not raw process environments.

At 16:26:45 local, Chrome PID 21396 successfully read the casimirbot protocol's
open command pointing to release-guide-slice6b/win-unpacked/CasimirBot.exe. Its
subsequent CreateFile calls for that executable returned PATH NOT FOUND. The old
executable is absent. This establishes a concrete failure before application entry
for the captured attempt, superseding uncertainty about a possible early app crash
for that attempt only.

Contemporaneous shell reads of HKCU/HKCR in Registry32 and Registry64 showed the
current release-oauth-status-recovery-20260913 command. Direct SID/Classes reads
agreed with the shell. Chrome and CasimirBot shared the current user SID, and
GetPackageFullName reported no package identity for Chrome, CasimirBot and the
diagnostic shell. The cause of the divergent registry observations is unresolved;
do not claim MSIX virtualization, bitness or differing principals as established.

The verified current EXE (SHA256
df52a60ab93d841a0656040ca91812b75f6cc2e249963227b5449f30bf5238d5) was launched
by ordinary Explorer double-click. Startup already registers the protocol before
the single-instance check. At 20:35:07 UTC the app logged process_entry,
second_instance and callback_unrecognized. The running service was not stopped.
This is a repair attempt, not proof Chrome now reads the replacement command.

One harmless browser callback was then triggered. Native inspection stopped at
the computer tool's URL-verification guard; the operator was asked to complete
the existing Open prompt if visible. No post-repair received/rejected chain was
present at the following check. No real OAuth approval, grant or binding was
automated. All CS1–CS4/O1–O6 exits remain incomplete, CS5 remains required,
ET6 unpassed and NAV1 unqualified.
