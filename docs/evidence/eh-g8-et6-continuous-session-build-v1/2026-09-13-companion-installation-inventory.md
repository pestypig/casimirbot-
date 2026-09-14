# Installed companion inventory before deployment

Evidence class: read-only local profile/artifact inventory. CS4.4 supplement to
the [new companion build](2026-09-13-manual-observation-companion.md).

The [inventory](2026-09-13-companion-installation-inventory.json) observed two
Fabric 1.21.8 launcher profiles: `fabric-loader-1.21.8` uses the ordinary game
directory, and `helix-combat-c0-isolated` uses `.minecraft-helix-c0`. Both name
Fabric Loader 0.18.4. Only profile ID/name/version/game-directory fields were
projected; no launcher credential or process command line was inspected.

No `java.exe` or `javaw.exe` process was present at the observation. The ordinary
mods directory contains `HelixFabricPlayerAgent-0.4.0.jar`; the isolated directory
contains `HelixFabricPlayerAgent-0.4.12.jar`. Their hashes are recorded and both
differ from the newly built repair artifact. The matching 0.4.12 filename is
therefore insufficient proof that the repair is installed.

The supported MCP lifecycle tool requires exact room/environment identity and
either current Player Embodiment authority or the separately trusted-device
lifecycle bootstrap. It does not expose a generic companion deployment
operation or an explicit launcher-profile argument. No current authenticated
run/environment selection has been established, and the last presence call
returned `Session terminated`. Profile inventory cannot supply that authority
or decide which historical profile is the current rehearsal target.

No file was copied into either installation, no launcher configuration changed,
and no client or game server was launched. The next deployment must use the
verified rehearsal profile, preserve its existing JAR as rollback, check the
new hash and then confirm the loaded manifest after an authorized launch.
This avoids treating an arbitrary local mod copy as ordinary workflow proof.

This inventory establishes an actual source/build/install mismatch, not a live
failure or completed deployment. It does not close CS4.4 or any other exit in
the [full inventory](2026-09-13-owner-recovery-cs5-reconciliation.md). ET6 remains
unpassed and NAV1 unqualified; the
[work program](../../helix-environment-harness-work-program-v1.md) remains the
sole status authority.
