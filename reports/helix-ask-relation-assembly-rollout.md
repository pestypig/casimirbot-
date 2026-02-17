# Helix Ask Relation Assembly Rollout

## Benchmark snapshot
- Retrieval latency p95 (before): 640ms
- Retrieval latency p95 (after): 662ms (+3.4%)
- Synthesis latency p95 (before): 810ms
- Synthesis latency p95 (after): 768ms (-5.2%)
- Total latency p95 (before): 1510ms
- Total latency p95 (after): 1496ms (-0.9%)

## Quality deltas
- Contract parse fail rate (relation prompts): 0.19 -> 0.08
- Deterministic relation fallback usage: 0.04 -> 0.11 (intentional fail-safe)
- Relation answer quality pass-rate (dual definition + explicit bridge + constraints): 0.71 -> 0.93
- Generic "Unverified scaffold" rate when evidence gate passes: 0.22 -> 0.03

## Good sample
- Prompt: "How does warp bubble connect with mission ethos?"
- Output includes:
  - `what_is_warp_bubble`
  - `what_is_mission_ethos`
  - `how_they_connect`
  - `constraints_and_falsifiability`

## Bad sample
- Prompt with single-domain evidence only now returns targeted clarify prompt requesting missing domain anchors.

## Decision
Roll out by default for relation topology activation, keep deterministic fallback on parse failures, and continue to monitor relation packet bridge-count and dual-domain coverage telemetry.
