---
id: external-integrations-tree
label: External Integrations Tree
aliases: ["External Integrations Tree", "external-integrations-tree", "external integrations tree"]
topicTags: ["external", "vendors", "dependencies"]
mustIncludeFiles: ["docs/knowledge/external-integrations-tree.json"]
---

# External Integrations Tree

Source tree: docs/knowledge/external-integrations-tree.json

## Definition: External Integrations Tree
This tree maps external vendor code and reference integrations used by the system. Minimal artifact: external dependency map with usage notes.

## Nodes

### Node: External Integrations Tree
- id: external-integrations-tree
- type: concept
- summary: This tree maps external vendor code and reference integrations used by the system. Minimal artifact: external dependency map with usage notes.

### Node: LLM Vendors
- id: external-llm-stack
- type: concept
- summary: LLM vendor integrations (external/llama.cpp, external/whisplay-ai-chatbot). Minimal artifact: LLM vendor inventory.

### Node: Audio and Speech Vendors
- id: external-audio-stack
- type: concept
- summary: Audio/speech vendors (external/whisper, external/piper1-gpl, external/audiocraft). Minimal artifact: speech/audio vendor list.

### Node: Physics References
- id: external-physics-stack
- type: concept
- summary: Physics reference repositories (external/geodesic_raytracing, external/black-hole-skymap, external/WarpFactory, external/warp-engine-archive). Minimal artifact: physics reference index.

### Node: Solar Tooling
- id: external-solar-stack
- type: concept
- summary: Solar tooling dependency (external/sunpy). Minimal artifact: solar tooling reference.

### Node: WebGPU References
- id: external-webgpu-stack
- type: concept
- summary: WebGPU volume rendering references (external/webgpu-volume-pathtracer). Minimal artifact: WebGPU reference note.

### Node: Hardware References
- id: external-hardware-stack
- type: concept
- summary: Hardware utility dependencies (external/piSugar-power-manager). Minimal artifact: hardware dependency note.

### Node: Architecture References
- id: external-architecture-stack
- type: concept
- summary: Architecture references (external/agentic-architectures). Minimal artifact: architecture reference note.

### Node: LLM Vendors <-> Audio and Speech Vendors Bridge
- id: bridge-external-llm-stack-external-audio-stack
- type: bridge
- summary: Cross-reference between LLM Vendors and Audio and Speech Vendors within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: LLM Vendors <-> Audio and Speech Vendors
- relation: Cross-reference between LLM Vendors and Audio and Speech Vendors.
- summary: Cross-reference between LLM Vendors and Audio and Speech Vendors within this tree. Minimal artifact: left/right evidence anchors.
