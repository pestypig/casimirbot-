---
id: natario-zero-expansion
aliases: ["natario", "zero expansion warp", "zero expansion bubble"]
scope: Natario bubble definition used in the warp modules
intentHints: ["define", "what is", "explain"]
topicTags: ["warp", "physics"]
mustIncludeFiles: ["modules/warp/natario-warp.ts", "modules/warp/warp-module.ts"]
---
Definition: The Natario zero-expansion model defines a warp bubble with near-zero expansion scalar, implemented in natario-warp.ts.
Key questions: How is zero expansion computed and validated?
Notes: The implementation checks the divergence of the shift vector and reports validation flags. In this repo, Natario warp bubble parameters are driven by the Casimir tile energy pipeline (Casimir lattice) before guardrails and stress-energy checks.
