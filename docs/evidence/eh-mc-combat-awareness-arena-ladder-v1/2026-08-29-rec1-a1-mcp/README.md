# REC1 authenticated MCP consume evidence — 2026-08-29

This directory records the final visual artifact for the authenticated REC1 A1
consume acceptance in the isolated C0 arena world.

- Room: `shared_realtime_room:43b93243-1f90-49fd-88c9-bd2f4cbdf3d3`
- World: `minecraft:connector:023aa276-59a`
- Subject: `DatDamPig`
- Successful workflow: `environment_action_workflow:10e69d62-6341-485e-8c35-ba3d65700bcc`
- Action execution: `environment_action_execution:295424ef-68f5-4bc5-a9ef-cf91ebbe242e`
- Evidence: `environment_action_evidence:2c7942ac1f657ea1b2e41640ba41c69ca88bc13c9`
- Screenshot: `minecraft-post-consume.png`
- Screenshot SHA-256: `720F27F7F64F301547BE05662FBB26ED41C067C8502769281269AD14B57EECD0`

The screenshot shows the isolated arena after the successful authenticated MCP
consume: full health and hunger, with the bowl remainder selected. The MCP
receipt and an independent dedicated-server read both measured health `20`,
food `20`, saturation `7.2000003`, mushroom stew `0`, and bowl `1`. The MCP
receipt additionally measured `controls_released=true`, zero world mutations,
and no manual override.

The preceding overconstrained attempt is retained in the work packet as failed
evidence: food began at `15`, so the requested six-point gain was impossible
under Minecraft's food cap even though the stew was physically consumed. The
successful replay used the canonical food `14`, saturation `0`, health `20`,
stew `1`, bowl `0` fixture.
