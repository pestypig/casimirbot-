---
id: natario-zero-expansion
aliases: ["natario", "zero expansion warp", "zero expansion bubble", "needle hull", "needle hull mk1", "needle hull mark 1"]
scope: Natario bubble definition used in the warp modules
intentHints: ["define", "what is", "explain"]
topicTags: ["warp", "physics"]
mustIncludeFiles: ["modules/warp/natario-warp.ts", "modules/warp/warp-module.ts", "client/src/components/needle-hull-preset.tsx", "docs/needle-hull-mainframe.md"]
provenance_class: inferred
claim_tier: diagnostic
certifying: false
---
Definition: The Natario zero-expansion model defines a warp family whose idealized continuum construction enforces zero expansion for the chosen Eulerian observers; the repo implementation diagnoses numerical near-zero divergence and expansion behavior for Natario-family profiles.
Key questions: How is zero expansion computed and validated?
Notes: The implementation checks the divergence of the shift vector and reports validation flags. In this repo, Natario warp bubble parameters are driven by the Casimir tile energy pipeline (Casimir lattice) before guardrails and stress-energy checks. The Needle Hull Mk1 preset configures warpFieldType="natario", so Needle Hull is treated as a Natario-family warp bubble profile rather than a separate metric family.

Validated against:
- Natario, J. (2002), "Warp drive with zero expansion," Class. Quantum Grav. 19, 1157-1165. https://doi.org/10.1088/0264-9381/19/6/308
