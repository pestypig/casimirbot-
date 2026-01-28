---
id: star-hydrostatic
aliases: ["star hydrostatic", "stellar hydrostatic", "star hydrostatic panel", "stellar ledger panel"]
scope: stellar structure panel and solver wiring
topicTags: ["star", "ledger"]
mustIncludeFiles: ["client/src/pages/star-hydrostatic-panel.tsx", "client/src/physics/polytrope.ts", "client/src/physics/gamow.ts"]
---
Definition: The star hydrostatic panel is the stellar-structure workspace that ties polytrope profiles, Gamow window intuition, and kappa ledger comparisons into a single, operator-facing panel.
Key questions: Which solver is used (polytrope vs presets), where the Gamow window comes from, and how kappa_drive vs kappa_body is computed and displayed?
Notes: The panel logic and UI live in client/src/pages/star-hydrostatic-panel.tsx, with the polytrope solver in client/src/physics/polytrope.ts, the Gamow window kernel in client/src/physics/gamow.ts, and cross-panel math alignment documented in docs/curvature-unit-solar-notes.md.

