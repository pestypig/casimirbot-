Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.SCOPE / CFP-1.CLAIMS independent stage review
Capability or component: Thirteen CFP-1 evidence headers and local client/environment version observations
Lifecycle stage: specification freeze and downstream acceptance handoff
Reaction timescale: at CFP-1 decision and subsequent selected-version change
Authority owner: Independent technical reviewer checks dependency classification; product owner selects supported tuple; CFP-2/3/4 owners execute acceptance
Current maturity: specified
Target maturity: specified with selected versions, qualified returns and independently accepted final CFP-1 packets
Required evidence: parent exit rule, stage-evidence read 295, corrected headers, local AppX/OS/Gradle sources and documentation audit
Explicit non-goals: no supported-version selection, legal clearance, signed artifact, installed result or CFP-stage promotion
Downstream gate unlocked: none automatically; CFP-1 remains active and CFP-2/3 blocked

# CFP-1 stage-evidence split independent review — 2026-09-21

An independent read-only technical reviewer compared the 13 changed `Required evidence` headers against the [parent exit rule](../../../work-packets/eh-g8-cfp1-product-rights-and-offer-contract-v1.md#delegation-and-handoff) and their packet bodies. The reviewer found no installed `tools/list`, two-account native effect, checkout, live provider trace or signed artifact still being required **as an executed result** for CFP-1. Qualified planned-scope rights returns, owner choices, numeric thresholds and frozen acceptance fixtures remain CFP-1 inputs.

The first pass found four headers needed to say more clearly that the exact supported Codex client/version, Windows baseline and environment/version are selected before CFP-1 exit. Those headers were corrected while keeping final signed-byte identity and installed results in CFP-2/3/4. The reviewer then checked the final wording and the [local version/source record 295](2026-09-21-cfp1-stage-evidence-split-and-local-version-read-295.md), including the AppX package, Windows OS, two Fabric build declarations and local links, and returned **PASS** with no remaining correction. The observed local versions are still not customer-supported selections.

`npm run helix:environment-harness:docs-audit` returned `ok: true`, G8 active and no failures; targeted changed-header link validation found no missing local target; `git diff --check` found no whitespace errors in the changed tracked packets. This review does not close D07, D11, D12, selected version support or CFP-1. CFP-1 remains active (`specified`), with CFP-2/3 blocked.
