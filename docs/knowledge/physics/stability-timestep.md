---
id: stability-timestep
aliases: ["timestep", "stability", "integration step"]
scope: stability constraints in time stepping
intentHints: ["define", "what is", "explain"]
topicTags: ["physics"]
mustIncludeFiles: ["server/gr/evolution/solver.ts"]
---
Definition: Stability constraints determine how small time steps must be to avoid numerical blow-up.
Key questions: How is the timestep chosen and which limits are enforced?
Notes: Solver modules typically document timestep choices and stability guards.
