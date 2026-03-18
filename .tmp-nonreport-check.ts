import { __testOnlyNonReportGuard } from "./server/routes/agi.plan.ts";
const text = `Confirmed:
- Retrieved grounded repository anchors: modules/warp/natario-warp.ts, docs/warp-console-architecture.md, docs/knowledge/warp/warp-bubble.md, docs/warp-tree-dag-walk-rules.md. Reasoned connections (bounded):
- Bounded linkage supported by cited repo evidence (modules/warp/natario-warp.ts and docs/warp-console-architecture.md). Next evidence:
- Searched terms: What is a warp bubble? [docs/knowledge/warp/warp-bubble.md] How is it solved in the codebase?, warp bubble, calculateNatarioWarpBubble, warp pipeline
- Checked files: modules/warp/natario-warp.ts, docs/warp-console-architecture.md, docs/knowledge/warp/warp-bubble.md, modules/warp/warp-module.ts
- Check files under modules or docs. - Search docs headings for "Node: Warp Bubble". [docs/knowledge/warp/warp-bubble.md] - Search docs headings for "Observer-Robust Warp Bubble Visualizer Build Plan". [docs/knowledge/warp/warp-bubble.md] - Search docs headings for "Natrio-Casimir Warp Bubble Operations Runbook". [docs/knowledge/warp/warp-bubble.md] Sources: docs/knowledge/warp/warp-bubble.md, modules/warp/warp-module.ts, modules/warp/natario-warp.ts, docs/warp-console-architecture.md, docs/warp-tree-dag-walk-rules.md, docs/warp-tree-dag-schema.md, docs/warp-geometry-comparison.md, docs/knowledge/warp/warp-mechanics-tree.json`;
const out = __testOnlyNonReportGuard.enforceNonReportModeGuard(text, false, "repo_rag");
console.log(JSON.stringify(out, null, 2));
