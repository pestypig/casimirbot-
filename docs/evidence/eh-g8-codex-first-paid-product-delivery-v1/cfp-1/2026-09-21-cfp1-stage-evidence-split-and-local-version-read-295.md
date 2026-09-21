Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.SCOPE / CFP-1.CLAIMS stage dependency audit
Capability or component: CFP-1 evidence headers and first-customer version baseline
Lifecycle stage: specification freeze before installed qualification
Reaction timescale: once per selected client/environment/artifact cohort and after material version change
Authority owner: CFP-1 coordinator fixes stage classification; product owner selects supported versions; CFP-2/3/4 owners execute frozen fixtures
Current maturity: specified
Target maturity: specified with exact supported versions, qualified returns and independently accepted dependent fixtures
Required evidence: parent CFP-1 exit rule, 13 inspected packet headers, current local client/OS and connector-source version observations, independent stage review
Explicit non-goals: no claim of supported versions from one local machine, signed-artifact proof, runtime/configuration change, rights clearance or stage promotion
Downstream gate unlocked: none automatically; CFP-1 exit and canonical G8 work program remain controlling

# CFP-1 stage-evidence split and local version read — 2026-09-21

The [parent CFP-1 exit rule](../../../work-packets/eh-g8-cfp1-product-rights-and-offer-contract-v1.md#delegation-and-handoff) requires recorded decisions, qualified planned-scope rights/distribution review, frozen claim tests and independent review of dependent packets. It explicitly assigns final signed bytes and executed installed acceptance to CFP-2/3/4. A read-only search of `docs/work-packets/eh-g8-cfp1-*.md` found 13 `Required evidence` headers that mixed planned specification inputs with later installed traces, live provider observations, signed artifact identity, checkout mapping or executed directory results. Their headers now name **CFP-1** selected rules, rights/cost returns and frozen fixtures separately from **CFP-2/3/4** executed results. Their bodies' substantive acceptance and rights obligations are unchanged. This removes a circular interpretation in which CFP-1 would need a later-stage result before it could admit that stage.

The independent initial review identified one important boundary: the [parent delivery plan](../../../work-packets/eh-g8-codex-first-paid-product-delivery-v1.md) requires CFP-1 to choose the **exact supported Codex client/version, Windows baseline and environment/version**, even though the final EXE hash and installed result belong to later stages. Four affected headers were corrected to retain that CFP-1 version selection. The present source provides a **local evaluation lead**, not the supported customer selection:

| Read-only source at this checkpoint | Observation | Limit |
| --- | --- | --- |
| Running Windows AppX package `OpenAI.Codex` | `26.915.4065.0`, x64 | Current local installed Codex app only; no supported-version or MCP compatibility matrix was accepted. |
| `Win32_OperatingSystem` | Microsoft Windows 11 Home, version `10.0.26200`, x64 | One machine; not the selected minimum/customer Windows baseline. |
| `minecraft/helix-fabric-player-agent/build.gradle.kts` and `minecraft/helix-fabric-sensor/build.gradle.kts` | Minecraft `1.21.8`, Fabric Loader `0.18.4`, Fabric API `0.136.1+1.21.8`, Java toolchain `21` | Build declarations; not a verified installed game/profile, signed JAR/manifest tuple or supported customer environment. |

CFP-1 must still select a supported client/OS/game-and-connector version tuple and freeze its positive/denial thresholds before D12. A current AppX version, OS build or Gradle dependency alone cannot make a compatibility or public support claim. D07, D11, D03 and D12 remain open; CFP-1 stays active (`specified`), CFP-2/3 blocked and G8 active. No Codex configuration, game profile, release artifact or production setting was changed.
