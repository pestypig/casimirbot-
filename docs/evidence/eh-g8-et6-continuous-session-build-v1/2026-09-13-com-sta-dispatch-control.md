# COM STA dispatch control

Following the post-restart Chrome failure, the current Chromium main-branch
platform_util_win.cc was inspected. It posts external dispatch to a COM STA task
runner and invokes ShellExecuteA with a quoted URL and the system directory as
working directory. This source is not an exact-version proof for the installed
Chrome 153.0.8010.37. Source:
https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/platform_util_win.cc

A one-shot local control used an explicitly STA thread, CoInitializeEx with
apartment-threaded flag, ShellExecuteA with a fabricated access_denied / invalid
state callback, quoted URL and Environment.SystemDirectory. No actual OAuth state
or code was used. COM initialization returned 1 (already initialized), ShellExecute
returned 42 and Win32Error was 0. The existing packaged application journal then
recorded at 19:58:56 UTC: process_entry, second_instance, received, rejected.

The installed Chrome main process had no observed --no-sandbox,
--disable-web-security, --user-data-dir or --app= command-line flags. No flags or
browser security settings were changed. No process environment credentials were
read or copied.

The COM thread/quoted-call convention succeeds outside Chrome and does not explain
the reproduced Chrome failure. This is a Windows negative-authorization control,
not live OAuth acceptance or a browser handoff repair. All CS1–CS4/O1–O6 exits remain
incomplete; CS5 remains required, ET6 unpassed and NAV1 unqualified.
