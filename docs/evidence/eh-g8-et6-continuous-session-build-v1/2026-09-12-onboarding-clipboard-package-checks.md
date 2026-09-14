# Clipboard and guidance development package

Under [onboarding O1–O6](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
No maturity promotion or ET6 acceptance.

Built `apps/desktop/release-onboarding-clipboard-20260912/win-unpacked/CasimirBot.exe`
with exact-origin sanitized clipboard permission, readable diagnostic fallback,
nested guidance context, limited-scope guidance, and immutable steering
acknowledgement write checks. Client build passed in 47.81 seconds; native host,
six-root runtime staging and directory packaging all exited 0. Existing build
warnings remain.

[Content comparison](2026-09-12-onboarding-clipboard-package.json) verified 645
runtime files, 635 renderer files and eight host entries without mismatches or
extras. EXE SHA256:
`5c8e9aaaf0bf457e1d4171213c286571aa4add19374ec4fcd21ee3a44f93cc87`.

Isolated packaged launch exited 0:

```json
{"Verdict":"PASS","Processes":5,"LoopbackListeners":4,"FriendsCoordinationBroker":"NOT_CONFIGURED","IsolatedUserDataFiles":78,"FullReadinessReceipt":"PASS","ServiceListenerReceipt":"PASS","ProviderCredentialKeyVault":"PASS","ProtocolRegistrationPreserved":"PASS","MinFreePhysicalGiB":4.39,"MaxCommitPercent":66.6}
```

This is isolated launch evidence, not ordinary authenticated workflow evidence.
The ordinary running app has not yet been switched from the guidance package.
Native Copy diagnostics and binding remain unverified on this new artifact.
Full O1–O6, CS1–CS4 and CS5 remain open; original ET6 unpassed and NAV1 gated.
