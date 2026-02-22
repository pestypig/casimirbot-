# Mission Systems Contract Diff Decisions (2026-02-22)

## Decision summary

Accepted optional non-breaking contract fields:
- voice payload: `dedupe_key`, `mission_id`, `event_id`
- mission-board transport: optional SSE endpoint for event stream consumption

Rejected for this batch:
- Any mandatory request shape changes for existing voice and mission-board endpoints.
- Any change that couples voice delivery success to mission-board state progression.

## Rationale
- Preserves deterministic error envelopes and backward compatibility.
- Keeps v1 compatible with local-first deployment and replaceable TTS provider boundary.
- Defers transport mode hard lock (polling vs SSE default) to leadership decision backlog L3.
