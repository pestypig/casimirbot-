Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.SCOPE / CFP-1.CLAIMS version selection
Capability or component: First Codex/Windows/Minecraft compatibility qualification cohort
Lifecycle stage: specification checkpoint before CFP-2/3 installed qualification
Reaction timescale: version selection and after a material update
Authority owner: Product owner selects the first target; CFP-2/3 owners execute; D12 owner approves later customer wording
Current maturity: specified
Target maturity: specified with selected version tuple and drift-denial fixtures
Required evidence: local AppX/Windows read, Gradle and adapter source, official client/OS documentation, independent source/stage/link review
Explicit non-goals: no released support claim, signed-byte result, game launch, rights clearance, hardware floor or G8 promotion
Downstream gate unlocked: none automatically; canonical CFP-1 exit remains controlling

# CFP-1 first-cohort compatibility selection and review — 2026-09-21

The [first-cohort target](../../../work-packets/eh-g8-cfp1-first-cohort-compatibility-target-v1.md) selects the exact **first qualification cohort**: local Codex desktop AppX `26.915.4065.0` x64 on Windows 11 25H2 x64/build family 26200, with local Home `26200.9457` as the currently observed test instance. The optional Minecraft proof target is Java Edition `1.21.8`, Fabric Loader `0.18.4`, Fabric API `0.136.1+1.21.8` and Java `21`. The candidate player mod `0.4.12`, sensor mod `0.3.0`, embedded core `0.2.0` and action adapter `0.4.11` have **different source identities**; the generic directory `0.4.0` is not the selected local bootstrap. These identities and their qualification/denial rules are now linked from D01/D02, P1, FC-02/04 and the canonical work program.

Read-only source basis: `Get-AppxPackage -Name OpenAI.Codex` reported package `OpenAI.Codex_26.915.4065.0_x64__2p2nqsd0c76g0`. Windows registry reported `DisplayVersion=25H2`, `CurrentBuild=26200`, `UBR=9457`; [Microsoft's current release table](https://learn.microsoft.com/en-us/windows/release-health/windows11-release-information) maps 25H2 to build 26200 and lists 26200.9457. [OpenAI's MCP documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) supports local desktop stdio MCP generally, without certifying this exact CasimirBot pair. Minecraft, Loader, Fabric API, Java and mod versions come from `minecraft/helix-fabric-player-agent/build.gradle.kts` and `minecraft/helix-fabric-sensor/build.gradle.kts`; the embedded core `0.2.0` is referenced by those builds and declared in `minecraft/helix-minecraft-connector-core/build.gradle.kts`; action adapter `0.4.11` is a `PlayerActionRuntime.ADAPTER_VERSION` source constant. This is not an installed release manifest.

An independent read-only source, stage and link review returned **PASS after one wording correction**: the first draft incorrectly described the adapter constant as a Gradle declaration. The packet now distinguishes the build declarations from that source constant. The reviewer verified the local AppX/Windows values, official sources, link targets and the boundary between a selected test target and actual customer support. The environment-harness docs audit returned `ok: true`, with G8 active; link and diff checks found no new broken local target or whitespace error. No Codex configuration, game profile, runtime, account, charge, tax registration or production setting changed.

**Stage decision:** D01/D02 now have a selected version cohort to qualify first. D12's final hardware/artifact/operation/customer-claim freeze and D02 account path remain open, as do D03 rights-cleared action, D07 economics and D11 qualified returns. CFP-1 stays active (`specified`), CFP-2/3 blocked and G8 active. If Codex or another axis changes before installed evaluation, amend and independently review the selected target rather than silently claiming that the replacement version passed.
