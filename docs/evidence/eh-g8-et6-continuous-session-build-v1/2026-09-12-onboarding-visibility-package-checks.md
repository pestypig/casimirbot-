# Visibility repair package checks — September 12, 2026

Snapshot under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md)
and [work program](../../helix-environment-harness-work-program-v1.md).
No gate or capability maturity is advanced.

The [guidance and panel visibility repairs](2026-09-12-setup-guidance-and-panel-visibility.md)
were built into a separate development package:

`apps/desktop/release-onboarding-visibility-20260912/win-unpacked/CasimirBot.exe`

Client build passed: 3,334 modules, 33.86 seconds. Existing browser externalization,
tree-sitter eval, mixed import, Browserslist and chunk-size warnings remain.
Native build:host passed with the same four unrelated duplicate-key/case warnings;
stage:runtime passed; electron-builder directory packaging exited 0.

[Content comparison](2026-09-12-onboarding-visibility-package.json) passed all
645 runtime files, 635 renderer files and eight host entries with no mismatch
or extra file. EXE SHA256 is
`1a315a6c3091f573ce99d5826ee73d9e66ca78fb22ae6eb70083435dcf23088f`.
The launcher hash remains identical to the prior package: changes are in external
renderer resources. The full content comparison, not launcher hash alone,
identifies this artifact. This is not an independently verified signing claim.

The existing isolated packaged-launch smoke script completed exit 0 including
cleanup of its own temporary state:

```json
{"Verdict":"PASS","Processes":5,"LoopbackListeners":4,"FriendsCoordinationBroker":"NOT_CONFIGURED","IsolatedUserDataFiles":142,"FullReadinessReceipt":"PASS","ServiceListenerReceipt":"PASS","ProviderCredentialKeyVault":"PASS","ProtocolRegistrationPreserved":"PASS","MinFreePhysicalGiB":4.89,"MaxCommitPercent":61.5}
```

This is isolated launch evidence, not ordinary binding or steering acceptance.
At the end of this snapshot the prior replacement EXE remained running, with
main PID 32740 and service PID 27852 at its exact prior package path. The new
visibility package has not yet replaced it for ordinary native verification.
No production consent or environment action was automated. O1–O6 and CS1–CS4
remain incomplete, CS5 remains an incomplete handoff, original ET6 is unpassed
and NAV1 remains gated.
