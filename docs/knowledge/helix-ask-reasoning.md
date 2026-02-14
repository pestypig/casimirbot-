---
id: helix-ask-reasoning
label: Helix Ask Reasoning Pipeline
aliases: ["helix ask reasoning pipeline", "helix ask pipeline", "helix ask flow", "helix ask ladder", "helix ask reasoning"]
scope: repo workflow for Helix Ask routing, retrieval, and gates
intentHints: ["explain", "how it works", "pipeline"]
topicTags: ["agi", "runtime"]
mustIncludeFiles: ["docs/helix-ask-flow.md", "docs/helix-ask-ladder.md", "server/routes/agi.plan.ts"]
---
- Definition: The Helix Ask reasoning pipeline routes a prompt through intent selection, retrieval, evidence gates, and synthesis, with steps documented in the Helix Ask flow and ladder.
- Evidence: docs/helix-ask-flow.md and docs/helix-ask-ladder.md define the ordered stages; server/routes/agi.plan.ts orchestrates the runtime.
- Note: The gap between current reasoning guards and full scientific-method rigor is tracked in `docs/helix-ask-scientific-method-gap.md`.
