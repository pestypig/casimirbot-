Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.SCOPE / CFP-1.CLAIMS D12 read-only route check
Capability or component: Fabric sensor/player local bootstrap versus five built-in generic directory packages
Lifecycle stage: provisional public package-scope decision input
Reaction timescale: pairing and release-policy cutover
Authority owner: Product owner chooses first-cohort scope; connector owner supplies route evidence; qualified reviewer disposes retained public packages
Current maturity: specified
Target maturity: specified with an independently reviewed per-package decision matrix
Required evidence: [source audit 178](2026-09-20-cfp1-public-directory-package-scope-audit-178.md), Java pairing calls, [matrix](../../../work-packets/eh-g8-cfp1-public-directory-first-cohort-scope-v1.md), later rights/persisted-row and installed traces
Explicit non-goals: no current policy implementation, customer listing acceptance, JAR-byte identity, rights clearance or stage promotion
Downstream gate unlocked: none automatically; D12 and CFP-3.DIRECTORY-ADMISSION remain open

# Fabric sensor bootstrap and first-cohort directory scope — 2026-09-20

At source HEAD `cc5a7a4c1ac956606aea756f59e6fcb0324a9f93`, `server/services/environment-connectors/catalog/index.ts` (SHA-256 `eac21073722d3dbec0174fb38b3588a5e0cde71707b8ab6bdf3286d0cef2dfad`) defines five code-owned built-in IDs: Paper `1.1.0`, Fabric sensor `0.3.0`, Fabric player directory `0.4.0`, synthetic fixture `1.0.0` and system clock `1.0.0`. The [prior source audit 178](2026-09-20-cfp1-public-directory-package-scope-audit-178.md) establishes that current public GET lists built-in rows and generic pairing can resolve an ID without consulting GET; already claimed device credentials also need a cutover fence.

The selected local **sensor** Java code in `minecraft/helix-fabric-sensor/src/main/java/com/casimirbot/helixsensor/fabric/HelixFabricSensorMod.java` calls `ConnectorPairingClient.redeem(pairingEndpoint, code, nonce, "minecraft.fabric_mod.v1", FabricConnectorRuntime.ADAPTER_VERSION)`. `FabricServerPairingInbox.java` validates the local `/pairing/redeem` endpoint. The selected local **player** code in `minecraft/helix-fabric-player-agent/src/main/java/com/casimirbot/helixplayer/fabric/HelixFabricPlayerAgentClient.java` also calls `ConnectorPairingClient.redeem(...)`; [route audit 176](2026-09-20-cfp1-fabric-player-pairing-route-split-176.md) traces its current P03 path. The shared `ConnectorPairingClient` names `/api/environment-connectors/v1/pairing/redeem`. Neither inspected Java call supplies a generic directory `package_version_id`; this is a route observation, not a claim about installed bytes or runtime compatibility.

Inspected source SHA-256 values at that HEAD: sensor mod `0735d5dca292e9a3257b6283c8c353a4e7a7482743af06435c7c8be3224559d9`; sensor inbox `627ebbe89de8d2779e6e79a939cc072510a160edbc7a81417365079ecfa68e12`; player client `3692a0e38447566fdc83a3847b13b4d4efccfafe9ee6ecb2c85d93c28bf53ebd`; shared pairing client `7b5a94f08dc0180f4a1c142f7c2f1d1ec95adbd18a7c29b0c29e44f3b9eaed7f`.

The [provisional first-cohort matrix](../../../work-packets/eh-g8-cfp1-public-directory-first-cohort-scope-v1.md) therefore recommends public generic-directory exclusion for Paper, Fabric sensor, Fabric player and synthetic fixture, with system clock admitted only after C10 rights, metadata and clean external probe acceptance. These directory choices preserve the separately reviewed local sensor/player bootstrap proposal; they do not make that personal path customer-ready. For each excluded package, GET, direct/pending pairing and active-device admission must be fenced together. This source-to-policy selection does not clear Minecraft terms, provide a qualified D11 return or freeze final D12 copy.
