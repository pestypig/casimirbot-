Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.RIGHTS / CFP-1.DISTRIBUTION C07 read-only source and local-output audit
Capability or component: Fabric player, sensor and embedded connector-core development JARs
Lifecycle stage: planned release-input and reviewer-evidence inventory
Reaction timescale: before C07 disposition and one reserved customer build
Authority owner: Product owner selects the package; qualified rights reviewer disposes dependencies and notices; CFP-3 release owner verifies selected bytes
Current maturity: specified
Target maturity: specified with a reviewed planned dependency and nested-byte rule
Required evidence: source build/metadata hashes, local development JAR hashes and ZIP-entry comparison, later reserved-build bill of materials and rights return
Explicit non-goals: no license conclusion, signed/installed artifact proof, customer-binary identity, runtime change or stage promotion
Downstream gate unlocked: none automatically; D01/C07, D11/D12 and CFP-2/3 remain open

# C07 Fabric embedded-core byte inventory — 2026-09-20

This read-only inspection used source HEAD `cc5a7a4c1ac956606aea756f59e6fcb0324a9f93` in a dirty shared worktree. The `build/libs` files below are **mutable local development outputs**, not an attested build from that HEAD, a selected customer cohort or a signed release. Their dates and hashes are useful for explaining the current package topology only.

| Source input | SHA-256 | Relevant declaration |
| --- | --- | --- |
| `minecraft/helix-fabric-player-agent/build.gradle.kts` | `db31f0322a705e2385889819e299974ed1398f8924ba45042f95dd26a545be8e` | Player version `0.4.12`; Loom `1.11.8`; Minecraft `1.21.8`; loader `0.18.4`; Fabric API `0.136.1+1.21.8`; Java `21`; `include(connectorCore!!)` for `com.casimirbot:helix-minecraft-connector-core:0.2.0`. |
| `minecraft/helix-fabric-player-agent/src/main/resources/fabric.mod.json` | `3a8258991cd8b21fd137939cb7f5cfc9a626e86939d291c6f5bb2617acaf872a` | Mod ID `helix_fabric_player_agent`, client environment; loader, Minecraft, Java and Fabric API runtime dependencies. |
| `minecraft/helix-fabric-sensor/build.gradle.kts` | `c3d6ca9123088fdfd8ef901d8937e4e2f2ff31d9c337a6547646d9ead1f5b512` | Sensor version `0.3.0`; same declared platform versions and embedded connector-core coordinate. |
| `minecraft/helix-fabric-sensor/src/main/resources/fabric.mod.json` | `baa1a4cb50a9fad752fefaef920ba8ca161c0549097b0a42a29b2fe52a26ee19` | Mod ID `helix_fabric_sensor`, client/server environment; same runtime dependencies. |
| `minecraft/helix-minecraft-connector-core/build.gradle.kts` | `e501e09352b5cebef01487c1a734cc103a69a3c9c5987133438c63d3abe4acbe` | Core version `0.2.0`, Java `21`; JUnit is test-only. |

| Local development output | Size | SHA-256 | ZIP inspection |
| --- | ---: | --- | --- |
| `minecraft/helix-fabric-player-agent/build/libs/HelixFabricPlayerAgent-0.4.12.jar` | 543,209 bytes | `9e9b6a83cee0f995fc9f0a44b4b35196d32f5d54bffcf4e12de47b38c7ea3b29` | 149 entries; embeds `META-INF/jars/HelixMinecraftConnectorCore-0.2.0.jar`. |
| `minecraft/helix-fabric-sensor/build/libs/HelixFabricSensor-0.3.0.jar` | 302,051 bytes | `cee33c4bc25e4ac61870e84535e7f43d77a8d0da83eefebde90eb40204624298` | 74 entries; embeds the same named core JAR. |
| Embedded core in **each** mod JAR | 101,795 bytes | `0728139b162b273e2a2a120179e2af99ac448b0d05d29a9ffb6d8a559f875f44` | 64 entries, including generated `fabric.mod.json` with ID `com_casimirbot_helix-minecraft-connector-core` and version `0.2.0`. |
| `minecraft/helix-minecraft-connector-core/build/libs/HelixMinecraftConnectorCore-0.2.0.jar` | 100,537 bytes | `dcb379d054da5ee7fc370a3a4b382f93050bc78367043b6507c876ab31b15d40` | 63 entries. |

The player and sensor embed **identical core archive bytes** in these local outputs. Compared with the standalone core, each embedded archive has one additional ZIP entry, `fabric.mod.json`; all 63 shared entries have identical uncompressed contents. Therefore, requiring the embedded core archive SHA-256 to equal the standalone core JAR SHA-256 would be a false compatibility test. The release tuple must instead identify and hash the **actual embedded archive in each selected mod JAR**, inspect its metadata and provenance, and verify the intended core contents/compatibility against the reserved build. ZIP-entry equivalence in these development outputs does not establish the origin of a later build.

None of these three local JARs contains a ZIP entry whose name includes `LICENSE` or `NOTICE` (case-insensitive). The inspected mod ZIPs expose the nested connector-core JAR; they do not show Fabric Loader, Fabric API or Minecraft binary JARs nested in these **particular** outputs. This is a packaging observation, not a determination that notices are required or unnecessary, nor proof of the selected installer/profile/download contents. The C07 reviewer still needs an exact release bill of materials and the applicable rights/notice treatment for the first-party mod/core bytes, the externally required Fabric/Minecraft/Java stack, and the way the customer obtains each dependency. R-MC-01 separately decides whether the proposed paid/trial hosted-to-game action relationship is permitted.

CFP-3 must capture the selected source revision/build inputs, both final mod JAR hashes, each extracted nested core hash and metadata, required dependency/version inventory, actual delivery/profile contents and user-visible notices. CFP-2/3 must link those exact installed bytes to the received action/observation manifests and admitted action catalog, then reject substitution. This inventory changes no customer package or entitlement and leaves CFP-1 active (`specified`), with CFP-2/3 blocked.
