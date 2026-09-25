Program gate: G8 — release evaluation, CFP-1 active
Workstream: AR-2G — owner workflow developer package
Capability or component: Packaged AR-2F mission selection and attributed instruction review
Lifecycle stage: Installation and presentation
Reaction timescale: Explicit developer qualification
Authority owner: Local developer; existing account, room and task authority
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: Qualified source hashes, isolated package identity, runtime-tree and service checks, disposable-profile launch and walkthrough readiness
Explicit non-goals: Deployment, signing, paid provider calls, gameplay, user-profile migration or full room acceptance
Downstream gate unlocked: Authenticated keyed owner/guest installed walkthrough

# Goal

Build a separately identified unsigned developer EXE from qualified AR-2F
source. Preserve existing main, AR-2E and NAV packages and user profiles. Use
existing build, runtime-tree, service-boundary and disposable-profile smoke
scripts without modifying release verification. Record the first evidenced
access blocker before attempting signed-in room acceptance.

This admitted AR parallel slice does not depend on commercial closure. It
packages existing application changes; it adds no adapter, model execution or
physics authority. Codex retains its existing reasoning/runtime ownership.
The output is `apps/desktop/release-ar2g-20260925/win-unpacked`, not a public
installer. Reuse AR-2F's qualified client/server build only while its source
hashes match and verify the actual packaged server and renderer contents.

## Acceptance

- [x] Qualified source matches, with prior packages preserved.
- [x] Host build, staging and separately identified unsigned package succeed.
- [x] Packaged contents match staged artifacts and include the owner workflow.
- [x] Existing runtime-tree, service and disposable-profile checks pass.
- [x] Access limitations and exact next installed acceptance sequence recorded.

The [qualification record](../evidence/eh-g8-codex-first-paid-product-delivery-v1/ar-2g/developer-package-qualification.md)
binds actual packaged bytes to the qualified increment and records the passing
isolated checks. Both supported browser-control entry points failed during
kernel initialization. The owner/guest walkthrough is therefore pending; its
exact prerequisites and steps are recorded for the next slice.

Successful startup does not qualify account sign-in, voice interpretation,
speaker consent, task delivery or shared answers. Full AR-2, G8 and CFP-1 stay
open. Keyed live testing remains subject to the existing opaque-launch contract.
