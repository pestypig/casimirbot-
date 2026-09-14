# Recovery after unexpected Windows restart

Classification: presentation. This immutable snapshot follows
[the trust-save repair](2026-09-13-trust-save-recovery.md) and
[genuine device registration](2026-09-13-device-registration-accepted.md).
The [work program](../../helix-environment-harness-work-program-v1.md)
remains the sole dependency and maturity authority.

## Reproduced live boundary and recovery

After the operator reported a possible crash, no CasimirBot process was found
and the existing MCP request returned HTTP 504. The old ready file remained on
disk and was correctly treated as stale. Windows reports boot at
2026-09-13T23:08:17.500Z, Kernel-Power event 41 at 23:08:20.469Z and EventLog
6008 at 23:08:27.993Z. These establish an unexpected system restart; they do not
establish its cause or attribute it to CasimirBot, a build, or memory pressure.

The already-verified `release-trust-save-recovery-20260913/win-unpacked/CasimirBot.exe`
was launched through ordinary File Explorer. Its freshly recomputed EXE SHA256
was `98c4a97208a3d9fefa3f2c0f3b5101b90dfa9258aca8678de75b56bd860e636d`.
The main process was 3896 and its service child 11080. All five observed
CasimirBot processes used this exact package. A new ready receipt at
23:17:13.282Z identified `http://127.0.0.1:61464`; no old port or service claim
was reused. The ordinary panel picker and workspace navigation opened Account
& Sessions, Agent Access, and Connections, Billing & Security.

Native Device & Security independently showed this Windows device active,
the current installed profile session active, the retained installed-device
registration event at 17:27:30 local time, and Revoke this device with MFA.
No MFA, sign-in, registration or revocation was repeated or automated.
Agent Access still showed the separate Trust this device for Full Harness
button. The operator was asked for this genuine approval once after recovery;
it had not been observed as accepted at this snapshot.

## Authenticated MCP boundary

Ready up, prompt submit, binding claim, steering read and acknowledgement were
confirmed callable in this task's v2 catalog. Presence succeeded at
23:19:10.571Z and again at 23:24:33.769Z for
`codex:thread:01a081e3-1973-76a3-b35b-0bd6d541933d` on service
`service_instance:7266c85094e86b194bc09fb54a32cb96`, client session
`supervisor_client:70beb9ba01e3a86fa1477d81cf22273a`. The profile and MCP client
were server verified; the continuation remains client declared. No room, run,
environment, gameplay lease or active reasoning binding was selected.

Destination registration rejected with `pairing_registration_device_trust_required`.
Ready up `read_preparation` rejected with `insufficient_scope`. A new supported
300-second transport request,
`desktop_tunnel_request:d5403133-c3ef-479e-91c0-6aa1eec4ff9e`, was created at
23:19:29.926Z and remained pending_user_delegation, without a delegation or
expiry. Stable scope routing was reported; reconnect and catalog refresh were
not required. The requested duration is not evidence of a granted lease.

Presence currently declares tool_activity_only. Steering read/ack tools exist,
but no public-thread checkpoint publication tool was found in the available
catalog. A complete supported continuation/public-checkpoint bridge must be
established before declaring that higher capability. No capability was
invented merely to enable a binding checkbox.

## First reproduced application divergence

The native trust attention request made Agent Access display Sign in to
CasimirBot despite the active account and successful authenticated presence.
Reopening Agent Access restored AI app connected without authentication.
The setup reducer unconditionally reset the account step whenever native
guidance reselected the already-selected Codex profile. Limited or failed
transport inspection then returned without correcting that unrelated step.

Two component regressions reproduced this exact ready-to-attention sequence:
limited transport and rejected transport both incorrectly rendered sign-in.
The red run had two failures and 49 filtered cases. Reselecting the same
profile is now idempotent. A real new readiness 401 still resets the account
step and requires sign-in. Transport, trust, binding and environment checks
are unchanged. No approval or retry is inferred from navigation.

All 55 focused setup/component tests passed in 23.83 seconds. Two isolated
Chromium tests passed in 16.7 seconds: actual pointer/keyboard selection,
limited native-attention fixture, selection retention, one fixture claim and
copy. These use fixture HTTP/native responses, not real consent or real host
delivery. The earlier real-handler trust tests retain their separate scope.
Static discipline quick passed; its broader dirty-file classifications do
not qualify unrelated edits. No live-source identity, adapter, physics or
verification policy changed, so full discipline and Casimir verify do not
apply to this presentation patch.

Logs: `.tmp/guidance-account-red-20260913.log`,
`.tmp/guidance-account-green-20260913.log`,
`.tmp/guidance-account-browser-20260913.log`,
`.tmp/guidance-account-discipline-20260913.log`.
At this snapshot the new presentation fix is source-tested and a renderer
build is underway. It is not yet in the running package named above.

## Requirement-by-requirement CS5 disposition

Every exit remains incomplete. Preserve the full prior inventory and original
ET6 measurements through [the CS5 reconciliation](2026-09-13-oauth-recovery-cs5-reconciliation.md).

| ID | Evidence added here | Remaining exit proof |
| --- | --- | --- |
| CS1.1 | Current Ready up callable; preparation scope rejection recorded | Shared MCP/EXE readiness across every layer |
| CS1.2 | Fresh exact task/profile/client/service identity | Complete chat/run/source/player/lease/goal chain |
| CS1.3 | Same task recovered without reconnect | Three integrated Ready up calls with stable identities and zero unnecessary rotations |
| CS1.4 | New finite request pending; no permission inferred | Independent lifecycle and recovery matrix for every grant |
| CS1.5 | Device registration and installed session survived unexpected Windows restart | Full expiry/revoke/wrong-profile/stale-subject and durable-goal recovery |
| CS2.1 | Submit/read/ack remain callable | Natural prompt displayed once with truthful origin, pickup and acknowledgement |
| CS2.2 | No new live ingress evidence | All wrong-target/epoch, duplicate, expiry/revoke and scope negatives |
| CS2.3 | Tool-activity-only limitation retained truthfully | Actual supported exact-task delivery and completed answer path |
| CS3.1 | No new motion evidence | Useful course with three linked successors through real compiler, broker and resident executor |
| CS3.2 | No live motion measurement added | Correlated observation/admission/delivery/activation/runway/stall/release timings |
| CS3.3 | Prior fault fixtures retained | Complete four-plan fault matrix and live reconnect/backpressure recovery |
| CS4.1 | No gameplay intervention added | Genuine override/stop, queued invalidation, release and latency |
| CS4.2 | No live authority revocation added | Broker/connector/executor rejection and fresh no-motion state |
| CS4.3 | No bound environment re-entry added | Fresh exact observation changing reasoning and authoritative response |
| CS4.4 | Exact verified recovery EXE launched; service reidentified | Latest presentation fix packaged and launched; companion identity qualification |
| CS4.5 | Ordinary reboot recovery and preserved MFA observed; sign-in regression repaired in source | Full consent/prompt/result/recovery workflow without manual repair loops |
| CS5.1 | Every requirement retained in this handoff | Complete acceptance artifact; no original ET6 criterion removed |

O4 gains the presentation regression and O6 gains this bounded packaged
recovery observation. O1-O6 as a whole remain incomplete, including actual
host delivery, full real-handler/production-isolation matrix, contention,
key-loss and crash qualification. ET6 remains unpassed; NAV1 remains
unqualified and the separate NAV-EQ dependency rule is unchanged.
