# Helix Ask Keyless-First Development Policy (2026-03-03)

## Purpose

Keep Helix Ask development keyless for as long as possible while preserving decision-grade quality gates before promotion.

## Policy

1. Default to keyless development.
2. Run keyed/live LLM validation only at explicit promotion checkpoints.
3. Do not treat keyless quality runs as release-grade readiness evidence.

## Development Modes

### DEV_KEYLESS (default)

Use this mode for most daily engineering.

Allowed:
- Routing, retrieval, reranking, and contract code changes
- Unit/integration tests
- Retrieval-only and attribution ablations
- Dry-run harnesses

Required behavior:
- Keep LLM keys unset
- Mark outputs as non-release-grade for final quality judgments

Suggested env:
- `OPENAI_API_KEY` unset
- `LLM_HTTP_API_KEY` unset
- `HELIX_ASK_REGRESSION_DRY_RUN=1`
- `HELIX_ASK_MATH_ROUTER_DRY_RUN=1`

### PRE_RELEASE_KEYED_SMOKE

Use this mode when a patch set is stable and ready for live-signal check.

Required:
- Small live battery against real generation path
- Verify no critical regressions in routing, retrieval, and grounding

### RELEASE_KEYED_FULL

Use this mode only for promotion decisions.

Required:
- Full readiness loop runs with live LLM path
- Full contract + variety batteries
- Casimir verification gate pass

## What Is Not Decision-Grade in Keyless Mode

- Final versatility quality verdicts
- Final citation persistence verdicts
- READY promotion decisions

Keyless runs are valid for:
- Logic correctness
- Deterministic behavior
- Attribution directionality
- Regression detection before paid runtime

## Promotion Ladder

1. `DEV_KEYLESS`
2. `PRE_RELEASE_KEYED_SMOKE`
3. `RELEASE_KEYED_FULL`

A patch set must pass each stage before moving to the next.

## Minimal Keyed Checkpoint Triggers

Run keyed checks when any of these change:
- Intent routing or composite override logic
- Retrieval lane composition or reranking
- Citation/grounding contract behavior
- Final output cleaning that can alter evidence links

## Reporting Contract

Every runbook/report should label execution mode as one of:
- `DEV_KEYLESS`
- `PRE_RELEASE_KEYED_SMOKE`
- `RELEASE_KEYED_FULL`

And include:
- Exact test scripts run
- Artifact paths
- Decision scope (diagnostic vs promotion)

## Rationale

This policy reduces cost and iteration latency while preventing false confidence. Most bugs can be found keyless; only live LLM checks can close promotion risk.
