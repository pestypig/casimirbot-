# Trust recovery package launched; device registration remains required

This immutable supplement follows the [source repair and focused tests](2026-09-13-trust-registration-recovery.md)
and [package content comparison](2026-09-13-trust-recovery-package.json).
The [work program](../../helix-environment-harness-work-program-v1.md) remains
the sole dependency and maturity authority. Classification: evidence
normalization and presentation; no authority boundary was changed.

Renderer build and desktop directory packaging passed. The comparison checked
645 runtime files, 635 renderer files and eight host artifacts, with no
mismatches or extra runtime/renderer files. The new development package is
`apps/desktop/release-trust-recovery-20260913/win-unpacked/CasimirBot.exe`.
Its SHA256 is `caf50f0598e5a8dd7bf7d69034b1e466af7c9569670748dc547a14281ff8f56b`.
The service bundle SHA256 is
`32fa4a0c5e7418d9205d11126286ff0636df757b89676e84f129a6b78632a572`.

The previous EXE was closed normally and absence of CasimirBot processes was
checked before replacement. An ordinary Explorer launch started the new package
at approximately 21:16:41 UTC. The ready receipt records 21:16:46.059 UTC,
service PID 23696, and loopback origin `http://127.0.0.1:50064`. These are
point-in-time observations, not future port or process assumptions.

Authenticated MCP presence succeeded on the new service at 21:17:13.056 UTC
and again at 21:23:14.497 UTC, without a user reconnect. The exact continuation
is `codex:thread:01a081e3-1973-76a3-b35b-0bd6d541933d`, with service instance
`service_instance:0587413ae43d2581ada608382a764081`. Profile and MCP client
identities are server verified; the continuation remains client declared.
No room, run, environment binding or execution lease was selected.

The supported transport request at 21:17:25.627 UTC returned
`desktop_tunnel_request:32e2bc6f-1a32-4535-a981-1b6b35bfc110`, pending user
delegation, requested lease 300 seconds, native presentation accepted, stable
scope routing, and no reconnect/catalog refresh required. No delegation or
environment action permission was granted by this receipt. Earlier-service
request and claim identities are not reused.

Native Agent Access showed the AI app connected. Native navigation then opened
Connections, Billing & Security / Device & Security. The current device is
visibly **unregistered**, the current installed profile session is **active**,
MFA is **available**, and **Register this device with MFA** is visible and
enabled. The agent left that control untouched for the operator. The package
did not restore the previous panel layout automatically; navigation was performed
after launch. The earlier genuine account-link acceptance is documented in
[its separate snapshot](2026-09-13-native-oauth-link-accepted.md); this launch
does not independently requalify the OAuth callback or active-link card.

The source regressions passed 51 component/route/store tests and two isolated
pointer/keyboard browser cases. Their fixture registration and consent are
deterministic test operations, not proof of genuine MFA or live trust. This
launch verifies the new package and actual missing prerequisite; the operator's
next real registration, separate trust approval and subsequent recovery remain
untested. No production registration, authentication or trust control was
automated.

CS5 retains every requirement through [the preceding inventory](2026-09-13-browser-dispatch-recovered.md).
This adds bounded packaged evidence under CS1.5, CS4.5 and O4/O5/O6. Shared
idempotent Ready up, exact finite binding and durable goal recovery, scoped
prompt delivery/pickup/acknowledgement, three useful linked live successors,
fresh observation re-entry, interruption/revocation/stale rejection, zero
duplicate effects, and the complete ordinary packaged recovery workflow remain
required. No CS1-CS4 or O1-O6 exit is closed. ET6 remains unpassed and NAV1
unqualified. The persistent goal remains incomplete.
