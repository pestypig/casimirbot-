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
- Canonical worldline primer: docs/audits/research/warp-qei-worldline-primer-2026-03-04.md
- Fail-closed sampler checks required for FE-style claims:
  - `normalize_ok` (sampler normalization)
  - `smoothness_ok` (compact sampler smoothness)
  - `scaling_ok` (`t0^-4` behavior in 4D sweeps)
