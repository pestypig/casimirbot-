Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.RIGHTS C07 upstream dependency source review
Capability or component: Declared Fabric Loader and Fabric API runtime dependencies of the player and sensor mods
Lifecycle stage: planned-component rights evidence, before qualified disposition
Reaction timescale: selected source/dependency version and final release review
Authority owner: Connector owner supplies declared versions and artifact route; qualified rights reviewer determines license, notice and commercial-context obligations
Current maturity: specified
Target maturity: specified with version-pinned upstream source references for the C07 reviewer
Required evidence: [local build/JAR inventory 185](2026-09-20-cfp1-c07-fabric-nested-core-byte-inventory-185.md), upstream tag and license source, selected release-byte/dependency graph, qualified return
Explicit non-goals: no legal clearance, transitive dependency inventory, proof of downloaded Maven/JAR identity, Minecraft-rights approval or stage promotion
Downstream gate unlocked: none automatically; C07/R-MC-01, D11/D12 and CFP-2/3 remain open

# C07 version-pinned Fabric license source check — 2026-09-20

The [current local source inventory](2026-09-20-cfp1-c07-fabric-nested-core-byte-inventory-185.md) identifies the declared `net.fabricmc:fabric-loader:0.18.4` and `net.fabricmc.fabric-api:fabric-api:0.136.1+1.21.8` runtime dependencies in **both** mod build scripts. The mod metadata also requires Fabric Loader, Fabric API, Minecraft `~1.21.8` and Java `>=21`. Those declared dependencies are distinct from the first-party connector core nested in both inspected **development** JARs. The final launcher/profile/download route and exact external dependency bytes remain unselected.

| Declared component | Version-pinned primary source inspected | Bounded observation |
| --- | --- | --- |
| Fabric Loader `0.18.4` | [FabricMC/fabric-loader `0.18.4` LICENSE](https://github.com/FabricMC/fabric-loader/blob/0.18.4/LICENSE) | The upstream tagged root license file is Apache License, Version 2.0. This is a source term for review, not proof of the Maven artifact, its included libraries or the eventual customer delivery route. |
| Fabric API `0.136.1+1.21.8` | [FabricMC/fabric-api tagged release](https://github.com/FabricMC/fabric-api/releases/tag/0.136.1%2B1.21.8) and [that tag's LICENSE](https://github.com/FabricMC/fabric-api/blob/0.136.1%2B1.21.8/LICENSE) | The official release page identifies that version; its tagged root license file is Apache License, Version 2.0. The release tag and license do not inventory every module, bundled dependency or exact file in the selected installation. |

The upstream Apache-2.0 text contains redistribution and notice conditions and separately addresses trademarks. A qualified reviewer must apply the **actual** versioned package contents and delivery route to those terms, including any transitive dependencies and required license/notice access. The current local mod archives have no `LICENSE`/`NOTICE` named ZIP entries; that observation does not establish that notices are absent from, or unnecessary for, any later installer/profile or separately downloaded dependency. Fabric Loom `1.11.8` is declared as a build plugin, not shown as a runtime-nested JAR by the local inventory; review any generated or staged bytes rather than assuming the build tool itself ships.

These Fabric license sources address neither Mojang's [Minecraft EULA](https://www.minecraft.net/en-us/eula) nor its [Usage Guidelines](https://www.minecraft.net/en-us/usage-guidelines). R-MC-01 must still classify the proposed subscription/trial → guest grant → Fabric in-game effect path and promotional use on the final design. A permissive upstream software license cannot stand in for that separate game-commercial disposition. No paid/trial Minecraft action or C07 release component is cleared by this source check. CFP-1 remains active (`specified`); CFP-2/3 remain blocked.
