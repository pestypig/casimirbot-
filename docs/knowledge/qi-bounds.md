---
id: qi-bounds
aliases: ["QI bounds", "qi bounds", "quantum inequality bounds", "ford-roman bounds", "QI widget", "QI auto-tuner", "rho_min"]
scope: quantum inequality guardrails and tuning
intentHints: ["define", "QI", "quantum inequality", "bounds", "ford-roman"]
topicTags: ["ledger", "physics"]
mustIncludeFiles: ["client/src/components/QiWidget.tsx", "client/src/components/QiAutoTunerPanel.tsx", "server/energy-pipeline.ts"]
---
- Definition: QI bounds are the Ford-Roman/quantum-inequality guardrails that constrain negative-energy windows.
- Anchors: client/src/components/QiWidget.tsx and client/src/components/QiAutoTunerPanel.tsx expose the bounds and tuning controls.
- Evidence: server/energy-pipeline.ts applies QI limits when computing pipeline-derived metrics.
