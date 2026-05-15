# Workstation Process Graph Tool Instructions

## Purpose

Build a shared, observable process graph for the workstation. The graph represents panels, tools, operations, jobs, artifacts, sources, memory writes, and evidence routes. It is both an ambient SurfaceKit background layer and a readable workstation overview tool.

The graph is not an agent loop. It must not choose tools, execute actions, or replace the Helix Ask planner. It observes typed workstation events and exposes deterministic snapshots.

## Codex Alignment

Preserve Codex-style loop boundaries:

1. One turn runtime owns tool execution, observations, follow-up, cancellation, and terminal closure.
2. One tool registry/capability source owns executable actions.
3. Tool requests and tool results are recorded as observations.
4. The process graph consumes these observations and renders/query-summarizes them.
5. The process graph never dispatches workstation actions except its own read-only view actions.

## Helix Ask Boundary

Helix Ask may use the process graph as context:

- to understand active panels
- to inspect running jobs
- to identify recent artifacts
- to answer "what is happening right now?"
- to decide which existing artifact/source/job should be referenced

Helix Ask must not use the process graph as a private tool registry or as evidence that an action completed unless the graph node is backed by a typed action receipt, job receipt, or artifact.

## Privacy Boundary

The graph may show:

- observable tool calls
- action receipts
- selected sources
- job phases
- artifact summaries
- evidence gates
- visible plan/handoff events

The graph must not show hidden chain-of-thought or private scratchpad text.

## Event Sources

Consume these existing sources first:

- Helix Ask live event bus
- workstation action receipts
- procedural playback events
- workstation workflow timeline entries
- panel open/focus/close state
- job executor receipts
- artifact-returning panel actions

## Tool Actions

Add a `workstation-process-graph` capability with:

- `open`
- `get_snapshot`
- `query_snapshot`
- `focus_node`
- `filter_view`
- `export_svg`
- `clear_historical`

Only `open`, `focus_node`, and `filter_view` may change UI state. Only `get_snapshot`, `query_snapshot`, and `export_svg` return graph artifacts. No action may execute another workstation action.

## Rendering

Render two modes:

1. `ambient`: low opacity, center-safe masked, limited nodes and edges, wandering SurfaceKit layer.
2. `panel`: readable labels, clickable nodes, timeline rail, filters, export controls.

Use deterministic layout. Do not use random positions on every render. Use stable hashes and recency weighting so nodes drift only when the graph changes.

## Non-Goals

- No second backend planner.
- No second dynamic tool registry.
- No hidden reasoning visualization.
- No free-form LLM-generated graph state.
- No wallpaper-only implementation.
- No graph edge unless backed by an observable event or deterministic reducer rule.

## Acceptance Criteria

- Opening a panel creates or updates a panel node.
- Running a workstation action creates a tool/action node, an edge from Helix Ask or the active panel, and an artifact node when available.
- Job receipts create job nodes and phase updates.
- Recent active routes are visible in the ambient background layer.
- The Process Graph panel can show the same state with labels and timeline.
- `get_snapshot` returns a deterministic artifact suitable for Helix Ask or agent review.
- The graph never executes another panel action.
- The graph does not expose hidden reasoning text.
