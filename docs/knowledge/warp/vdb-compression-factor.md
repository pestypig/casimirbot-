---
id: vdb-compression-factor
aliases: ["van den broeck", "gamma_VdB", "compression factor"]
scope: compression factor used to reduce energy requirements
intentHints: ["define", "what is", "explain"]
topicTags: ["warp", "physics"]
mustIncludeFiles: ["server/helix-core.ts", "shared/curvature-proxy.ts"]
---
Definition: The Van Den Broeck compression factor is the repo's geometry-compression control for Van Den Broeck-style pocket geometries, used as a family-level energetic-scaling reference rather than as a direct physical-feasibility claim.
Key questions: What gamma_VdB is assumed and where is it applied?
Notes: Look for gamma_VdB usage in helix-core and curvature proxy math.

Validated against:
- Van Den Broeck, C. (1999), "A warp drive with more reasonable total energy requirements," Class. Quantum Grav. 16, 3973-3979. https://doi.org/10.1088/0264-9381/16/12/314
