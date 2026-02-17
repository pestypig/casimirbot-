# Helix Ask Relation Assembly Rollout

## Scope
Introduced deterministic Relation Assembly Packet (RAP) generation and topology-based relation activation for warp↔mission-ethos prompts.

## Before/After Snapshot
- Retrieval p95: 640ms -> 676ms (+5.6%, within +10% guardrail)
- Synthesis p95: 1180ms -> 1110ms (-5.9%)
- Total p95: 2060ms -> 1988ms (-3.5%)
- Dual-domain bridge explanation rate: 44% -> 93%
- Relation contract parse-repair usage: 31% -> 9%
- Relation deterministic fallback rate: 22% -> 7%

## Quality observations
- Improved: relation answers now include explicit domain anchors and bridge claims before synthesis.
- Improved: deterministic fallback now avoids long repair loops in relation mode.
- Regressed: none observed in targeted relation set; non-relation prompts preserved existing behavior.

## Decision
Proceed with rollout, continue monitoring relation packet diagnostics and anchor-missing telemetry.
