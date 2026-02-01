---
id: curvature-ledger
aliases: ["curvature ledger", "curvature-ledger", "tensor ledger", "weyl bands", "riemann register"]
scope: curvature ledger UI and proxy ledger math
intentHints: ["define", "explain", "ledger", "curvature"]
topicTags: ["ledger"]
mustIncludeFiles: ["client/src/components/CurvatureLedgerPanel.tsx", "shared/curvature-proxy.ts", "server/helix-proof-pack.ts", "client/src/physics/curvature.ts"]
---
- Definition: The curvature ledger is the UI + math ledger that tracks kappa_drive vs kappa_body and related curvature ratios.
- Anchors: client/src/components/CurvatureLedgerPanel.tsx renders the ledger, while client/src/physics/curvature.ts mirrors the proxy calculations.
- Evidence: shared/curvature-proxy.ts and server/helix-proof-pack.ts define the canonical proxy and proof-pack outputs.
