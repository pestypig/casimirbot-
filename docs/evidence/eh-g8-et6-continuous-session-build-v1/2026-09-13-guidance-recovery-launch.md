# Packaged verification of the repeated-attention sign-in repair

Classification: presentation. This immutable supplement advances only the
specific repair and package evidence in [the post-reboot recovery record](2026-09-13-post-reboot-recovery.md).
Its complete requirement-by-requirement CS5 table remains in force. The
[work program](../../helix-environment-harness-work-program-v1.md) remains the
sole dependency and maturity authority.

The renderer build passed in 1m29s. The package retention guard initially
rejected a fourth completed package. The superseded `release-trust-recovery-20260913`
was recycled only after checking the resolved direct-child path, rejecting
reparse points, checking no process used that path and rehashing the retained
running `release-trust-save-recovery-20260913` and verified rollback
`release-oauth-status-recovery-20260913` against their evidence. The Recycle Bin
was not emptied. Packaging then passed; the guard was not disabled.

Candidate `release-guidance-recovery-20260913` passed
[full content comparison](2026-09-13-guidance-recovery-package.json): 645 runtime
files, 635 renderer files and eight host artifacts, with zero mismatches or
extras. [Renderer and known-fixture marker inspection](2026-09-13-guidance-renderer.json)
also passed. These static checks do not prove every production isolation path.

- EXE SHA256: `98c4a97208a3d9fefa3f2c0f3b5101b90dfa9258aca8678de75b56bd860e636d`
- Service SHA256: `218b475d950a3fdb4f1e5ba1ef4d9147c9e07c72c5021a47db4cc72298571fd3`
- Renderer manifest SHA256: `2de23acb63ef561cdf49e4b2c9facd3ed93ab1afa415c4a099d64ed206bd425b`
- AgentConnectionSetup asset: `assets/AgentConnectionSetup-Q7lMgQct.js`, SHA256 `b63699900c98a60b238a9908aa4288ad4c03dd0e4d3af80d3728df64cb7b0c43`

The EXE and service hashes equal the preceding package because this repair
changes the renderer. They alone cannot distinguish these builds; use the
renderer identity and exact executable path as well.

Before switching packages, native inspection showed the unapproved trust
button, with no Saving state or authentication dialog. The prior app was
closed normally and its processes were confirmed absent. The new EXE was
launched through File Explorer. Main process 25968 and service child 21096
used the new package path. The fresh ready receipt at 23:35:02.649Z named
`http://127.0.0.1:58043`; old service-scoped requests were not reused.

Authenticated v2 presence succeeded at 23:35:23.910Z for exact continuation
`codex:thread:01a081e3-1973-76a3-b35b-0bd6d541933d`, new service
`service_instance:f375ae425580648438961e1fb056c0de` and client session
`supervisor_client:bed40871e206c0c5b026d3f9963dbe4c`. No account sign-in,
connector reconnect, gameplay selection or consent was automated.

A supported MCP request at 23:35:59.053Z prepared the 300-second transport
request `desktop_tunnel_request:be922a45-225b-42f9-ae17-a7e4a0270a9b` and opened
the native trust panel. Repeating that exact request reused its reference,
original receipt and creation time. Both observations remained
pending_user_delegation with no delegation or expiry and no environment
authority. Neither reconnect nor catalog refresh was required.

Independent native inspection after each request showed AI app connected,
the separate Full Harness scope-not-active explanation, and Trust this device
for Full Harness. The former false Sign in to CasimirBot heading and account
sign-in button did not reappear. This verifies the reproduced presentation
repair in the actual package using real MCP attention, separately from the
55 component tests and two isolated browser tests. The guide overlay was
dismissed without activating the trust control, leaving the human approval
visible.

Host memory briefly fell to approximately 197 MiB free physical / 3.38 GiB
free virtual during packaging and recovered to approximately 2.06 GiB /
12.35 GiB after it. No concurrent heavy test was started and no unrelated
process was terminated. This resource observation does not establish the
cause of the earlier unexpected Windows restart.

This closes the identified false sign-in reproduction at its packaged
presentation scope. It does not close integrated trust acceptance, destination
registration, exact task binding, supported continuation/checkpoint delivery,
Ready up, gameplay, or CS1-CS4/O1-O6. The human trust approval remains pending.
All CS5 rows and original ET6 measurements in the linked inventory remain
required. ET6 remains unpassed; NAV1 remains unqualified.
