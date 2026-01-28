---
id: kappa-proxy
aliases: ["kappa drive", "kappa body", "kappa_drive", "kappa_body", "curvature proxy", "kappa ledger"]
scope: reduced-order curvature proxy math
topicTags: ["ledger", "star", "warp"]
mustIncludeFiles: ["shared/curvature-proxy.ts", "server/helix-proof-pack.ts", "client/src/physics/curvature.ts"]
---
Definition: The kappa proxy is the reduced-order curvature bookkeeping that compares drive-induced curvature density (kappa_drive) to material or mass-density curvature (kappa_body).
Key questions: How is kappa_drive computed from power flux and duty, how is kappa_body computed from density, and where are the comparisons surfaced?
Notes: The canonical definitions live in shared/curvature-proxy.ts, are mirrored client-side in client/src/physics/curvature.ts, and are packaged into proof artifacts in server/helix-proof-pack.ts with guardrail tests in tests/physics-contract.gate0.spec.ts and tests/proof-pack.spec.ts.

