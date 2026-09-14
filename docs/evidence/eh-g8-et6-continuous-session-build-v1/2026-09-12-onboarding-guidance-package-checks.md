# Guidance and recovery validation package

Snapshot under [onboarding O1–O6](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
No maturity or gate promotion.

Built the native pending-guidance lexical-scope repair, integration-limitation
guide wording, and persisted steering revision validation into
`apps/desktop/release-onboarding-guidance-20260912/win-unpacked/CasimirBot.exe`.

Client build exited 0 in 43.62 seconds. Host build, six-root runtime staging and
electron-builder directory packaging exited 0. Existing client warnings and four
unrelated duplicate-key/case host warnings remain. Native typecheck passed in
the preceding scope-repair evidence.

[Full content comparison](2026-09-12-onboarding-guidance-package.json) found no
mismatches or extras across 645 runtime files, 635 renderer files and eight host
entries. EXE SHA256:
`b251831044509974e806262d41ac373a5406ec8c29bb0822cacdbdc7c3b86822`.
Host main SHA256:
`c0e5868f42170d8cfa9161732dd49098096930aa9f3897f76487999a9ea14884`.
Service SHA256:
`d7e3b6528a1849851b439e67747f8950496de895a7f5526b0748cbc3c04d573f`.

The isolated packaged-launch script exited 0:

```json
{"Verdict":"PASS","Processes":5,"LoopbackListeners":4,"FriendsCoordinationBroker":"NOT_CONFIGURED","IsolatedUserDataFiles":78,"FullReadinessReceipt":"PASS","ServiceListenerReceipt":"PASS","ProviderCredentialKeyVault":"PASS","ProtocolRegistrationPreserved":"PASS","MinFreePhysicalGiB":4.56,"MaxCommitPercent":66.9}
```

This is a development artifact and isolated launch result. The ordinary app has
not yet been switched from the recovery package. No production consent or
environment action was performed. Native guidance IPC delivery and the full
ordinary authenticated pairing workflow remain unverified on this artifact.
Remaining O1–O6/CS1–CS4 and CS5 are open; original ET6 is unpassed and NAV1 gated.
