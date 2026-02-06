---
id: hardware-telemetry-tree
label: Hardware Telemetry Tree
aliases: ["Hardware Telemetry Tree", "hardware-telemetry-tree", "hardware telemetry tree"]
topicTags: ["hardware", "telemetry", "control"]
mustIncludeFiles: ["docs/knowledge/hardware-telemetry-tree.json"]
---

# Hardware Telemetry Tree

Source tree: docs/knowledge/hardware-telemetry-tree.json

## Definition: Hardware Telemetry Tree
This tree maps hardware telemetry ingest, scheduling, and the UI controls used to drive hardware-linked workflows. Minimal artifact: hardware telemetry flow map.

## Nodes

### Node: Hardware Telemetry Tree
- id: hardware-telemetry-tree
- type: concept
- summary: This tree maps hardware telemetry ingest, scheduling, and the UI controls used to drive hardware-linked workflows. Minimal artifact: hardware telemetry flow map.

### Node: Hardware Ingest
- id: hardware-ingest
- type: concept
- summary: Hardware ingest routes in server/helix-core.ts accept sector state, spectrum, and sweep data for processing. Minimal artifact: ingest endpoint list.

### Node: Hardware Bus
- id: hardware-bus
- type: concept
- summary: Hardware bus helpers (client/src/lib/hardware-sector-bus.ts) and server-side broadcasts in server/helix-core.ts drive realtime UI updates. Minimal artifact: hardware bus message map.

### Node: Hardware Hooks
- id: hardware-hooks
- type: concept
- summary: Hardware hooks (client/src/hooks/useHardwareFeeds.ts, client/src/hooks/useSectorStateBusRelay.ts) stream telemetry into panels. Minimal artifact: hardware hook flow.

### Node: Hardware Panels
- id: hardware-panels
- type: concept
- summary: Hardware control panels (client/src/components/HardwareConnectModal.tsx, client/src/components/HardwareConnectButton.tsx, client/src/components/SpectrumTunerPanel.tsx, client/src/components/VacuumGapSweepHUD.tsx, client/src/components/Light…

### Node: Hardware Scheduler
- id: hardware-scheduler
- type: concept
- summary: Hardware scheduling and pump shims (server/services/hardware/gpu-scheduler.ts, server/instruments/pump.ts, server/instruments/pump-multitone.ts). Minimal artifact: scheduler/pump flow.

### Node: Hardware Provenance
- id: hardware-provenance
- type: concept
- summary: Hardware truth feeds into energy pipeline provenance fields (server/energy-pipeline.ts). Minimal artifact: hardware provenance summary.

### Node: Hardware Ingest <-> Hardware Bus Bridge
- id: bridge-hardware-ingest-hardware-bus
- type: bridge
- summary: Cross-reference between Hardware Ingest and Hardware Bus within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: Hardware Ingest <-> Hardware Bus
- relation: Cross-reference between Hardware Ingest and Hardware Bus.
- summary: Cross-reference between Hardware Ingest and Hardware Bus within this tree. Minimal artifact: left/right evidence anchors.
