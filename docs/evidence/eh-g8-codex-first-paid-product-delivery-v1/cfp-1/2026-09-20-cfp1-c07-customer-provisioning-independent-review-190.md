Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.DISTRIBUTION / CFP-1.RIGHTS independent read-only review
Capability or component: C07 customer connector acquisition and installed-profile trust boundary
Lifecycle stage: source-to-release handoff review
Reaction timescale: before qualified disposition, reserved build and first customer installation
Authority owner: Independent reviewer verifies source and planning alignment; product, rights and release owners retain selection/approval
Current maturity: specified
Target maturity: specified with reviewed CFP-2/3 handoff
Required evidence: [source audit 189](2026-09-20-cfp1-c07-customer-provisioning-source-gap-189.md), [delivery/profile contract](../../../work-packets/eh-g8-cfp1-c07-customer-connector-delivery-and-profile-contract-v1.md), linked C07/C15/onboarding/distribution work packets
Explicit non-goals: no current customer installer, approved channel, JAR signing, Minecraft commercial permission, installed-byte result or stage promotion
Downstream gate unlocked: none automatically; D01/C07/D08/D11/D12 and CFP-2/3 remain open

# Independent C07 customer provisioning review — 2026-09-20

**Verdict: PASS for the bounded source audit and proposed handoff.** The independent read-only reviewer verified source HEAD and all eight cited file hashes. The desktop handlers select existing folders; stored profiles and server re-resolution check owner/directory shape. The isolated-profile utility is called by its CLI and source test, checks copy equality rather than a release allowlist, and is not selected by the explicit desktop runtime-copy list. Both lifecycle scripts use existing profiles/JARs and provide launch/process checks without attesting mod bytes. The builder/stager explicitly select the two scripts, not JAR/profile assets; broad input and final extracted-artifact verification remain caveats.

The reviewed contract frames separate rights-cleared first-party assets, a trusted exact-hash release tuple, customer-owned prerequisites, dedicated profile checks and denial fixtures as **future** CFP-2/3 work. The reviewer found no implication that current profile selection proves installed identity or that a delivery channel or paid Minecraft right has been accepted. Local Markdown links in the audit, contract and C07/C15/rights/onboarding/distribution/G8 handoffs resolved.

The local `npm run helix:environment-harness:docs-audit` returned `ok: true`, with G8 active, 40 status rows and 14 acceptance claims checked. This review does not replace a qualified rights return, D07 cost case, D12 final component/claim freeze or signed/installed acceptance. CFP-1 remains active (`specified`); CFP-2/3 remain blocked.
