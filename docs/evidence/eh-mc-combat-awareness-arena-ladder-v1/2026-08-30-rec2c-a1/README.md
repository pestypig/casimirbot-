# REC2C authenticated MCP A1 exploratory pressure-commit run

Date: 2026-08-30

This directory records an exploratory authenticated MCP A1 slice for
pressure-committed consumption. It is not REC2C acceptance and does not establish
a horde breakpoint.

Accepted workflow:

- workflow: `environment_action_workflow:7e6cbf20-d74b-4687-9aa3-4e86f375418f`
- evidence: `environment_action_evidence:1b90f6aa98e3fba5f8f855078cf98383395736b52`
- verified setup health: `17.0`
- opponents: five adult unarmored zombies in the temporary inner ring
- recovery trigger: health below `18`, observed false at tick `0`
- consume: one golden apple completed at tick `33`
- re-equip: iron sword completed at tick `33`
- resumed combat: five zombies cleared by tick `179` with 13 attack pulses
- terminal state: health `20.0`, absorption `4.0`, two golden apples remaining,
  controls released, two inventory mutations, zero measured world mutations

The current summarized receipt does not include minimum health, health-loss
events or damage received during the 33 use ticks. The run therefore proves the
ordered `consume -> re-equip -> resume combat -> clear horde` path while live
hostiles were released, but it does **not** yet prove that a zombie strike landed
during consumption. Adding those measurements is the next evidence task.

Two discarded setup attempts healed to health 20 before dispatch and correctly
did not trigger recovery. One separate seven-baby-zombie trial timed out with
four survivors and the player was killed after the guardian released controls;
that exposes a hazard-unsafe terminal handoff and is not a REC2C pass.

`rec2c-a1-after.png` is an afterward-only Minecraft screenshot showing the sword
re-equipped, two golden apples remaining, the absorption HUD active and zombie
drops in the cleared temporary ring.

## Measurement-instrumented follow-up

Adapter artifact version `0.4.1` added bounded use-window measurements to the
authenticated consume receipt. Measured workflow
`environment_action_workflow:af6f96d0-597a-45f6-bba1-5bb0775b50c3`
reported a 31-tick golden-apple use window, minimum health 17, zero observed
health loss and zero health-loss events during use, followed by sword re-equip
and five-baby clear at tick 250 with 19 attacks. This closes the telemetry gap
but does not satisfy the damage-under-consumption criterion.

Single full-health reactive probes at 7, 11, 15 and 16 baby zombies all cleared
without a health-threshold interrupt. Their authenticated workflow/evidence
pairs and exact tick/attack measurements are recorded in
`rec2c-a1-summary.json`. A five-zombie sustained-pressure variant using bounded
Speed III, Strength II and Resistance II effects also cleared without damage.
These probes show that raw count alone does not create the required pressure in
this ring; they are not the required five trials per rung and do not establish
a human/controller breakpoint.
