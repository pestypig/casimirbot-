# REC2A authenticated MCP A1 evidence

This directory seals the authenticated MCP A1 control/treatment pair for the
frozen REC2A latent combat-recovery program. The program and installed Fabric
artifact are unchanged from the accepted direct A0 pair.

- Program SHA-256: `8D71CE6C1A0159CD3FD03E2FE14E58E268300642C52177A355112D2A750307F5`
- Player Agent JAR SHA-256: `AB2663106EB8C512D696A2A1787355D8BA7B9EC107D6231FC6509740D1CEF9D1`
- Authenticated room: `shared_realtime_room:43b93243-1f90-49fd-88c9-bd2f4cbdf3d3`
- Action authority: `environment_action_authority:d0f5e7f4-4a7d-4c0a-ae67-e8754b5f7680`
- Subject: `DatDamPig`

The no-perturbation control completed in 410 synchronized client ticks with
35 attack pulses, zero interrupts, zero consumption, zero inventory/world
mutations and all controls released.

The accepted treatment began ordinary combat before a separate localhost-only
arena RCON actor applied exactly five generic damage. Its independent receipt
recorded health `20 -> 15`. The watchdog observed the threshold crossing at
tick 68, canceled opening combat, reached 7.0045-block separation at tick 118
with zero disengagement attack pulses, crafted one stew at tick 120, consumed
it and re-equipped the iron sword at tick 154, resumed combat for 30 attack
pulses and settled at tick 540. Totals were one interrupt, five actions, one
consumed item, two inventory mutations, zero world mutations, no manual
override and full control release.

One preceding treatment attempt is retained only as a timing diagnostic: the
interactive console write was serialized behind the MCP action and therefore
arrived after terminal completion. It did not activate recovery and is not
counted as acceptance evidence. The accepted retry used a separately timed
RCON client so the perturbation occurred while the MCP workflow was running.

Independent afterward reads found health 20, food 19, saturation 0, one bowl,
one iron sword, no stew or ingredient mushrooms and no tagged zombie.
`rec2a-a1-after.png` is an afterward-only screenshot showing full health, the
restored sword, shield and bowl; SHA-256
`C4F9E2F14991E9AE3E7D33BB7ED5F73BD75FFA68213E073FD99845360FF16070`.

