# Replacement package and cumulative validation — September 12, 2026

Snapshot under [the onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md)
and [canonical work program](../../helix-environment-harness-work-program-v1.md).
No gate or capability maturity is advanced.

## Cumulative discipline

`npm run helix:ask:discipline:full -- --force` completed exit 0 on the original
process without restart. Source remained unchanged throughout this run.

| Executed group | Passed |
| --- | ---: |
| Prompt-solving prelude | 4 |
| Adversarial shards | 8 + 8 + 8 + 7 |
| Fixed API contracts | 15 |
| API scenario shards | 4 + 4 + 4 + 4 |
| Continuation routing | 26 |
| Identity audit | 9 |
| Total executed | 101 |

Shard exclusions are not additional executed tests. The final server build
passed with the same four unrelated duplicate-key/case warnings. Continuation
routing took 209.12 seconds overall; no observation timeout was treated as a
process failure. This run postdates the replacement service, route and UI work.

## Built artifact and content comparison

Client build previously passed in the rendered-replacement snapshot. After the
cumulative suite, build:host and stage:runtime passed, followed by electron-builder
directory packaging with exit 0. The new output preserves earlier artifacts:

`apps/desktop/release-onboarding-replacement-20260912/win-unpacked/CasimirBot.exe`

EXE SHA256: `1a315a6c3091f573ce99d5826ee73d9e66ca78fb22ae6eb70083435dcf23088f`

Bundled service SHA256: `4fac980e4e3ca6913b7daef30793bd58cfc5eeb8372b8b29b953051cc73324ae`

[The package comparison](2026-09-12-onboarding-replacement-package.json) reports
645 runtime files, 635 renderer files and all 8 host-dist entries matching their
packaged copies, with no mismatch or extra runtime/renderer file. This is a dirty
checkout artifact, not a signed release/certification claim. The builder's signing
log is not independent signature verification.

## Isolated native launch

The existing smoke-packaged-launch.ps1 was invoked against the exact new EXE.
It completed exit 0, including cleanup of its own contained temporary data and
process tree. Report:

```json
{"Verdict":"PASS","Processes":5,"LoopbackListeners":4,"FriendsCoordinationBroker":"NOT_CONFIGURED","IsolatedUserDataFiles":148,"FullReadinessReceipt":"PASS","ServiceListenerReceipt":"PASS","ProviderCredentialKeyVault":"PASS","ProtocolRegistrationPreserved":"PASS","MinFreePhysicalGiB":4.56,"MaxCommitPercent":67.1}
```

This proves isolated native startup and the listed smoke checks, not pairing
consent, automatic invitation delivery, exact prompt pickup or a gameplay loop.
It did not use the user's credential vault or replace protocol registration.

## Ordinary launch and authenticated service reachability

The old September 8 ordinary EXE window received a graceful close request. Its
processes were confirmed gone before the verified new EXE was launched normally,
without an isolated user-data override or ad hoc service configuration. No forced
production process kill or connector reconnect was used.

The ordinary readiness receipt was matched to a live process at the new exact
EXE path:

```json
{"schema":"casimir_desktop_service_ready_receipt/1","ready":true,"readyAt":"2026-09-12T16:46:14.468Z","origin":"http://127.0.0.1:64833","serviceProcessId":27852}
```

An authenticated MCP supervisor presence update then succeeded at
2026-09-12T16:46:29.748Z against new service instance
`service_instance:bb1b68cf8744d833c9e31a1ce3643ef5`, using this task's continuation
`codex:thread:01a081e3-1973-76a3-b35b-0bd6d541933d`. Owner/client identity was server
verified; continuation identity remained client declared. Resource claims were
empty, room/run/environment null, and no authority or consent was renewed.
The 180-second heartbeat is a dated presence observation, not durable permission.

The calling task's catalog still lacks destination_register, pairing_accept and
pairing_recover, despite prior evidence of publication. The successful old-tool
call proves service reachability without resolving that catalog boundary. No
human binding approval was requested and no production pairing was issued.

## Outstanding

The ordinary integrated UI and binding/steering workflow remains unverified.
O3 actual host delivery/attestation, PostgreSQL concurrency, full native pairing
recovery and the remaining O/CS matrix still require evidence. The exact EXE is
now current and running, but ordinary launch is not O6 or CS acceptance. All
CS1-CS4 exits remain incomplete; CS5 is an incomplete handoff, ET6 is unpassed
and no NAV gate is unlocked.
