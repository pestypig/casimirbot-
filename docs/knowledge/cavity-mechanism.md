---
id: cavity-mechanism
label: Cavity Mechanism
aliases: ["cavity", "cavity mechanism", "casimir cavity", "Q cavity", "q_cavity", "cavity q"]
scope: cavity geometry and quality-factor mechanisms used by Casimir and warp-energy computations.
topicTags: ["physics", "warp", "energy_pipeline", "telemetry", "ui"]
mustIncludeFiles: ["docs/casimir-tile-mechanism.md", "client/src/components/CavityMechanismPanel.tsx", "client/src/components/cavityScaling.ts", "server/helix-core.ts", "tests/warpfield-cross-validation.spec.ts"]
---

# Cavity Mechanism

Definition: In this repo, a cavity is the Casimir/drive cavity mechanism where geometry, gap, and quality factor (Q) control stored energy, loss, and pipeline-level drive constraints.

The cavity concept appears both as implementation-level mechanics (panel/model code) and as pipeline terms such as `qCavity`/`Q_cavity` used in diagnostics and safety constraints.

Primary references:
- docs/casimir-tile-mechanism.md
- client/src/components/CavityMechanismPanel.tsx
- client/src/components/cavityScaling.ts
- server/helix-core.ts
- tests/warpfield-cross-validation.spec.ts
