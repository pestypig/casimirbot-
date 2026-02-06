---
id: skills-tooling-tree
label: Skills and Tooling Tree
aliases: ["Skills and Tooling Tree", "skills-tooling-tree", "skills tooling tree"]
topicTags: ["skills", "tools", "registry"]
mustIncludeFiles: ["docs/knowledge/skills-tooling-tree.json"]
---

# Skills and Tooling Tree

Source tree: docs/knowledge/skills-tooling-tree.json

## Definition: Skills and Tooling Tree
This tree maps the skills system, tool registry, and CLI tooling used by Helix Ask and related runtimes. Minimal artifact: skills catalog with wiring map.

## Nodes

### Node: Skills and Tooling Tree
- id: skills-tooling-tree
- type: concept
- summary: This tree maps the skills system, tool registry, and CLI tooling used by Helix Ask and related runtimes. Minimal artifact: skills catalog with wiring map.

### Node: Tool Registry
- id: skills-registry
- type: concept
- summary: Tool specs and registry wiring (shared/skills.ts, server/skills/index.ts). Minimal artifact: tool registry summary.

### Node: Tool Routing
- id: skills-routing
- type: concept
- summary: Tool registration and routing (server/routes/agi.plan.ts). Minimal artifact: tool registration map.

### Node: Physics Skills
- id: skills-physics
- type: concept
- summary: Physics tools (server/skills/physics.warp.ask.ts, server/skills/physics.warp.viability.ts, server/skills/physics.gr.assistant.ts, server/skills/physics.gr.grounding.ts, server/skills/physics.curvature.ts). Minimal artifact: physics tool cat…

### Node: Docs and Repo Skills
- id: skills-docs-repo
- type: concept
- summary: Docs and repo tools (server/skills/docs.readme.ts, server/skills/docs.heading.section.md.ts, server/skills/docs.table.extract.ts, server/skills/docs.contradiction.scan.ts, server/skills/docs.evidence.search.md.ts, server/skills/docs.evidenc…

### Node: Media Skills
- id: skills-media
- type: concept
- summary: Media tools (server/skills/luma.generate.ts, server/skills/luma.http.ts, server/skills/noise.gen.cover.ts, server/skills/noise.gen.fingerprint.ts, server/skills/stt.whisper.ts, server/skills/stt.whisper.http.ts, server/skills/vision.http.ts…

### Node: Telemetry Skills
- id: skills-telemetry
- type: concept
- summary: Telemetry tools (server/skills/telemetry.badges.ts, server/skills/telemetry.panels.ts, server/skills/telemetry.crosscheck.docs.ts). Minimal artifact: telemetry tool catalog.

### Node: CLI and Tooling
- id: skills-cli-tools
- type: concept
- summary: CLI utilities and tooling (cli/casimir-verify.ts, cli/physics-ask.ts, cli/physics-validate.ts, cli/gr-agent-loop.ts, tools/tokenizer-verify.ts, tools/generate-tokenizer-canary.ts, scripts/llm-local-smoke.ts). Minimal artifact: CLI toolbox m…

### Node: Tool Registry <-> Tool Routing Bridge
- id: bridge-skills-registry-skills-routing
- type: bridge
- summary: Cross-reference between Tool Registry and Tool Routing within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: Tool Registry <-> Tool Routing
- relation: Cross-reference between Tool Registry and Tool Routing.
- summary: Cross-reference between Tool Registry and Tool Routing within this tree. Minimal artifact: left/right evidence anchors.
