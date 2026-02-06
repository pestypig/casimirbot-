---
id: deep-mixing
label: Deep Mixing
aliases: ["deep mixing", "deep-mixing", "deep mixing plan", "solar deep mixing", "tachocline mixing"]
scope: controlled solar mixing plan linked to restoration and stewardship.
topicTags: ["star", "physics", "energy_pipeline", "ideology"]
mustIncludeFiles: ["docs/knowledge/solar-restoration.md", "docs/knowledge/stewardship-ledger.md", "client/src/lib/deepMixingPhysics.ts", "client/src/lib/deepMixingPreset.ts", "client/src/pages/helix-core.tsx", "warp-web/deep-mixing-plan.html"]
---

# Deep Mixing (Sun)

Definition: Deep mixing is the slow, controlled circulation plan used to extend the Sun's main-sequence lifetime by moving envelope hydrogen toward the core through the tachocline.

In this repo, the plan is captured in the Deep Mixing autopilot preset and the tachocline setpoint helpers.

Key parameters:
- epsilon: fractional mixing strength relative to the solar burn rate.
- areaFraction: fraction of the tachocline belt engaged.
- targetDeltaT_Myr: target main-sequence lifetime gain.

Key outputs:
- vrSetpoint_mps: radial downflow setpoint at the tachocline.
- duty, cadenceDays: control trim outputs from the autopilot guardrails.

Primary references:
- warp-web/deep-mixing-plan.html (mission plan narrative)
- client/src/lib/deepMixingPhysics.ts (vr setpoint helpers)
- client/src/lib/deepMixingPreset.ts (autopilot preset, guardrails, telemetry shape)
- client/src/pages/helix-core.tsx (UI wiring and control flow)
