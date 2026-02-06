---
id: stellar-restoration-tree
label: Stellar Restoration Tree
aliases: ["Stellar Restoration Tree", "stellar-restoration-tree", "stellar restoration tree"]
topicTags: ["star", "stellar", "restoration", "ledger"]
mustIncludeFiles: ["docs/knowledge/stellar-restoration-tree.json"]
---

# Stellar Restoration Tree

Source tree: docs/knowledge/stellar-restoration-tree.json

## Definition: Stellar Restoration Tree
This tree connects star physics, ledgers, and restoration obligations. Minimal artifact: star and ledger knowledge docs.

## Nodes

### Node: Stellar Restoration Tree
- id: stellar-restoration-tree
- type: concept
- summary: This tree connects star physics, ledgers, and restoration obligations. Minimal artifact: star and ledger knowledge docs.

### Node: Stellar Structure
- id: stellar-structure-stack
- type: concept
- summary: Stellar structure sets the baseline for evolution and restoration. Minimal artifact: hydrostatic model notes.

### Node: Star Hydrostatic Balance
- id: star-hydrostatic
- type: concept
- summary: Hydrostatic balance anchors star models (docs/knowledge/star-hydrostatic.md). Minimal artifact: hydrostatic equation summary.

### Node: Stellar Evolution
- id: stellar-evolution-stack
- type: concept
- summary: Evolutionary phases define the urgency and timing of restoration work. Minimal artifact: evolution phase notes.

### Node: Red Giant Phase
- id: red-giant-phase
- type: concept
- summary: Red giant dynamics shape restoration planning (docs/knowledge/red-giant-phase.md). Minimal artifact: red giant phase summary.

### Node: Stellar Ledger Stack
- id: stellar-ledger-stack
- type: concept
- summary: Ledgers make restoration commitments auditable. Minimal artifact: ledger definitions and accounting cadence.

### Node: Stellar Ledger
- id: stellar-ledger
- type: concept
- summary: Stellar ledger definitions tie physics to obligation (docs/knowledge/stellar-ledger.md). Minimal artifact: ledger glossary.

### Node: Sun Ledger
- id: sun-ledger
- type: concept
- summary: Sun ledger entries encode restoration commitments (docs/knowledge/sun-ledger.md). Minimal artifact: sun ledger schema.

### Node: Observation and Monitoring
- id: stellar-observation-stack
- type: concept
- summary: Observation cadence links telemetry to restoration actions. Minimal artifact: monitoring cadence plan.

### Node: Sun 5-Minute Bins
- id: sun-5-minute-bins
- type: concept
- summary: Short cadence bins provide steady telemetry (docs/sun-5-minute-bins.md). Minimal artifact: binning specification.

### Node: Curvature Unit Solar Notes
- id: curvature-unit-solar-notes
- type: concept
- summary: Curvature unit notes tie physics units to solar metrics (docs/curvature-unit-solar-notes.md). Minimal artifact: unit mapping table.

### Node: Solar Pipeline
- id: solar-pipeline
- type: concept
- summary: Solar pipeline connects telemetry to action (docs/solar-pipeline.md). Minimal artifact: pipeline flow summary.

### Node: Solar Restoration Plan
- id: solar-restoration-plan
- type: concept
- summary: Solar restoration connects physics to commitment (docs/knowledge/solar-restoration.md). Minimal artifact: restoration objectives list.

### Node: Deep Mixing Plan
- id: deep-mixing-plan
- type: concept
- summary: Deep mixing plan describes slow tachocline circulation and guardrails used to extend the Sun's main-sequence lifetime (warp-web/deep-mixing-plan.html, docs/knowledge/deep-mixing.md). Minimal artifact: deep mixing plan overview.

### Node: Deep Mixing Physics
- id: deep-mixing-physics
- type: concept
- summary: Deep mixing physics helpers translate epsilon to tachocline flow setpoints (client/src/lib/deepMixingPhysics.ts). Minimal artifact: vr setpoint helpers.

### Node: Deep Mixing Autopilot
- id: deep-mixing-autopilot
- type: concept
- summary: Autopilot preset and control trim logic for deep mixing (client/src/lib/deepMixingPreset.ts, client/src/pages/helix-core.tsx). Minimal artifact: preset and control step summary.

### Node: Deep Mixing Telemetry
- id: deep-mixing-telemetry
- type: concept
- summary: Telemetry schema for deep mixing (DeepMixingTelemetry in client/src/lib/deepMixingPreset.ts). Minimal artifact: telemetry field list.

### Node: Deep Mixing UI
- id: deep-mixing-ui
- type: concept
- summary: Deep mixing UI surfaces (client/src/components/DeepMixingSolarView.tsx, client/src/pages/helix-core.tsx, client/src/pages/helix-core.panels.ts). Minimal artifact: UI wiring and deep mixing panel layout.

### Node: Solar Restoration Plan <-> Stellar Ledger Stack Bridge
- id: bridge-solar-restoration-plan-stellar-ledger-stack
- type: bridge
- summary: Cross-reference between Solar Restoration Plan and Stellar Ledger Stack within this tree. Minimal artifact: left/right evidence anchors.

### Node: Solar Restoration Plan <-> Deep Mixing Plan Bridge
- id: bridge-solar-restoration-plan-deep-mixing-plan
- type: bridge
- summary: Cross-reference between Solar Restoration Plan and Deep Mixing Plan within this tree. Minimal artifact: left/right evidence anchors.

### Node: Deep Mixing Plan <-> Mission Ethos
- id: bridge-deep-mixing-plan-mission-ethos
- type: bridge
- summary: Bridge between mission-ethos and deep-mixing-plan (mission-constraint).

### Node: Deep Mixing Plan <-> Stewardship Ledger
- id: bridge-deep-mixing-plan-stewardship-ledger
- type: bridge
- summary: Bridge between stewardship-ledger and deep-mixing-plan (stewardship-guardrail).

## Bridges

### Bridge: Solar Restoration Plan <-> Stellar Ledger Stack
- relation: Cross-reference between Solar Restoration Plan and Stellar Ledger Stack.
- summary: Cross-reference between Solar Restoration Plan and Stellar Ledger Stack within this tree. Minimal artifact: left/right evidence anchors.

### Bridge: Solar Restoration Plan <-> Deep Mixing Plan
- relation: Cross-reference between Solar Restoration Plan and Deep Mixing Plan.
- summary: Cross-reference between Solar Restoration Plan and Deep Mixing Plan within this tree. Minimal artifact: left/right evidence anchors.

### Bridge: mission-ethos <-> Deep Mixing Plan
- relation: mission-constraint
- summary: Bridge between mission-ethos and deep-mixing-plan (mission-constraint).

### Bridge: stewardship-ledger <-> Deep Mixing Plan
- relation: stewardship-guardrail
- summary: Bridge between stewardship-ledger and deep-mixing-plan (stewardship-guardrail).
