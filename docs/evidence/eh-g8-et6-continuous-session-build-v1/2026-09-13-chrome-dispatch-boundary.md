# Chrome external dispatch boundary

Classification: diagnostic evidence normalization; no authority changes.

Foreground native inspection resolved the earlier browser URL-inspection limit
without disabling checks. The diagnostic tab had been backgrounded. Selecting
it exposed Chrome's Open URL:casimirbot prompt. A foreground link click and an
explicit Open action dismissed the prompt. Chrome DevTools on this fixture page
reported Launched external handler, but the app journal did not gain a callback.
The operator also reported completing a click during this sequence; the probe
alone does not establish which action occurred in the earlier Auth0 attempt.

The journal now adds fixed process_entry, second_instance and
callback_unrecognized events. No argv, URL, state, code or credentials are logged.
Callback parser/journal regressions passed 7/7. Packaged
release-oauth-dispatch-20260913 passed the complete runtime/client/host content
comparison in 2026-09-13-oauth-dispatch-package.json and was launched ordinarily
after verifying the prior package process absence. EXE SHA256:
df52a60ab93d841a0656040ca91812b75f6cc2e249963227b5449f30bf5238d5.

The launch produced process_entry at 18:29:09.063 UTC. Another foreground Chrome
negative callback, confirmed through the actual Open button, produced no new
process_entry or second_instance marker in this journal.

Positive controls with fabricated rejection states:

- Windows protocol dispatch at 18:30:18: process_entry → second_instance →
  received → rejected.
- Windows protocol dispatch with C:\Windows\System32 working directory at
  18:30:56: the same complete rejection chain.
- ShellExecuteA using a quoted fabricated URL and system-directory working
  folder at 18:31:30: result 42, Win32 error 0, the same complete rejection chain.

These controls establish functioning registration, startup and rejection for
those callers only. They do not establish that Chrome started a process or that
an earlier real Auth0 callback arrived. HKEY_CLASSES_ROOT resolved to the current
EXE; there was no UserChoice override or DelegateExecute value. The EXE path was
207 characters. No registration, browser permission or consent setting changed.

Chromium source emits its Launched external handler message before invoking
platform_util::OpenExternal; therefore the console message is not an OS process
receipt. Its Windows implementation uses the quoted ShellExecuteA convention
tested above. Sources:
https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/external_protocol/external_protocol_handler.cc
https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/platform_util_win.cc

A filtered Windows process-start subscription was denied by the OS. The attempted
watch session was stopped; no elevation or bypass was attempted. The temporary
probe listener was stopped and its browser tab closed. The real account page was
preserved. The older journal package was recycled with exact target/process and
evidence checks; current request-recovery rollback remains. No Recycle Bin emptying.

The first remaining divergence is Chrome-confirmed dispatch to application entry.
Its underlying cause is not yet proved; do not infer parser failure, token exchange
failure, successful consent or a required credential reset. Current diagnostics
are not a fix for that divergence. All original CS1–CS4/O1–O6/CS5 exits remain
required; ET6 is unpassed and NAV1 unqualified.
