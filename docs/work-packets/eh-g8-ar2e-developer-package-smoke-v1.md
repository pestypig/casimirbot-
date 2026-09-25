Program gate: G8 — release evaluation, CFP-1 active
Workstream: AR-2E — isolated developer package and launch qualification
Capability or component: Packaged AR-2C/AR-2D runtime and renderer
Lifecycle stage: Installation and presentation
Reaction timescale: Explicit developer qualification
Authority owner: Local developer; existing package/runtime boundaries
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: Tested source hashes, fresh isolated package identity, runtime-tree check and disposable-profile launch receipt
Explicit non-goals: Production deployment, signed-release qualification, paid model calls, gameplay, user-profile migration or complete onboarding acceptance
Downstream gate unlocked: Keyed owner-room installed acceptance and missing mission-selection/dispatch UI work

# Goal

Continue with GPT-6 Astra at high reasoning. Build a separately named developer
package from the tested AR-2C/AR-2D tree, preserve the existing main package and
NAV rollback, and use existing verification scripts to check its artifact
identity and launch under a disposable profile. Record failures honestly and
resolve in-scope runtime defects when possible. Never treat successful startup
as account, provider, room, mission or live reasoning acceptance.

This independent AR lane follows AR-2D deterministic qualification and does not
depend on commercial closure. The output is
`apps/desktop/release-ar2e-20260925/win-unpacked`, an unsigned developer build,
not a public installer. Packaging must use the current retention and memory
rules. Do not replace a running EXE, delete a rollback or publish to GitHub.

Allowed work: existing host build, staging, package-dir runtime verification,
and isolated packaged-launch scripts; read-only artifact/version inspection;
this packet, evidence and canonical links. No changes to release verification
or physics adapter contracts are planned. If an implementation fix is needed,
identify the first divergent boundary and add its source-backed scope here.

The disposable-profile smoke is an unkeyed launch/broker-readiness check and
must not be used for live Helix/provider testing. A user's keyed runtime remains
subject to the opaque-launch contract for later live acceptance.

## Acceptance

- [x] AR-2D implementation hashes still match the qualified snapshot.
- [x] Isolated developer package includes the current server and owner UI.
- [x] Built/staged/packed runtime identity passes existing verification.
- [x] Disposable-profile launch result and cleanup are recorded.
- [x] Browser/keyed-room limitations and the next actionable boundary are recorded.

## Qualification

The [qualification and artifact identity](../evidence/eh-g8-codex-first-paid-product-delivery-v1/ar-2e/developer-package-qualification.md)
record a passing runtime-tree check, passing isolated service boundary, and
passing packaged launch with four verified loopback listeners. Existing main
and NAV rollback packages are preserved. The new unsigned developer EXE is ready
for the separately admitted keyed account/room walkthrough; startup does not
qualify that journey. Browser initialization remains unavailable and the
mission-selection/dispatch UI is still an implementation gap.
