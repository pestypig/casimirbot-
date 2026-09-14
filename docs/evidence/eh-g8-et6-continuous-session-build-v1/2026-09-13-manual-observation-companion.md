# Companion build containing the manual-observation repair

Evidence class: development artifact build and archive inspection. Supplements
the [manual-input regression](2026-09-13-continuous-manual-observation.md) and
[CS5 inventory](2026-09-13-owner-recovery-cs5-reconciliation.md), CS4.4.

With the existing JDK 21 and Gradle 8.14.3, `--no-daemon --max-workers=1 remapJar`
passed in 31 seconds from `minecraft/helix-fabric-player-agent`. The existing
version remains 0.4.12; version text alone cannot distinguish this development
artifact. Its exact [identity record](2026-09-13-manual-observation-companion.json)
records:

- Path: `minecraft/helix-fabric-player-agent/build/libs/HelixFabricPlayerAgent-0.4.12.jar`
- SHA256: `9e9b6a83cee0f995fc9f0a44b4b35196d32f5d54bffcf4e12de47b38c7ea3b29`
- Size: 543209 bytes; 149 archive entries.
- Mod ID: `helix_fabric_player_agent`; Minecraft dependency: `~1.21.8`.

JDK `javap -c -private` against this exact remapped JAR confirms
`PlayerActionController.handleManualOverride` constructs a LinkedHashMap from
existing `lastMeasurements`, adds the manual reason/action ticks and stores an
immutable copy before releasing controls. The archive contains the production
controller and none of the inspected `PlayerActionControllerTest`,
`PlayerActionRuntimeTransportTest`, `org/junit` or `onboarding-isolated` entry
markers. This is bounded artifact inspection, not a complete dependency audit.

The earlier 40 controller tests and cross-language manual-input case retain
their exact scope in the linked evidence. They ran against compiled test
classes before remapping; no in-game class loading of this JAR has been proven.
The old `-sources.jar` in build/libs was not rebuilt by `remapJar` and is not
part of this checkpoint. Existing historical output files were retained.

One heavy build tree ran at a time; observed free physical memory was 4.64 GiB.
The ordinary EXE remained running. No Minecraft installation was modified,
no running client was restarted, and no pairing or action authority was used.
Deployment, exact running companion identity and live verification remain open.
The [EXE checkpoint](2026-09-13-profile-settlement-package.md) remains unchanged.

This adds built-artifact evidence without closing CS4.4 or any CS1–CS4/O1–O6
exit. ET6 is unpassed and NAV1 unqualified. The
[work program](../../helix-environment-harness-work-program-v1.md) remains the
sole dependency/status authority; no adapter-contract or certificate integrity
claim is made by this build.
