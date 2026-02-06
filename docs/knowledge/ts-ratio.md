---
id: ts_ratio
label: TS_ratio
aliases: ["TS_ratio", "TS ratio", "time-scale separation", "time scale separation ratio", "TS long", "time-scale ratio"]
scope: time-scale separation guard for pipeline modulation vs light-crossing time
intentHints: ["define", "timescale", "ratio"]
topicTags: ["warp", "physics"]
mustIncludeFiles: ["server/energy-pipeline.ts", "docs/casimir-tile-mechanism.md", "docs/warp-console-architecture.md"]
---
- Definition: TS_ratio is the conservative time-scale separation ratio used by the pipeline, computed as T_long / T_m (light-crossing time over modulation period) and reported via TS_ratio/TS_long.
- Evidence: server/energy-pipeline.ts computes TS_long and assigns TS_ratio; docs/casimir-tile-mechanism.md explains why TS >> 1 is required for cycle-averaged GR responses.
- Usage: TS_ratio is surfaced in pipeline snapshots and guardrails (TS_ratio_min).
