# Civilization Traversability Atlas Contract

## Goal

Add a Planetary Traversability Atlas as the missing middle layer between first-principles bounds and Civilization Bounds interpretation.

The atlas should let the agent ask, in order:

1. What first-principles constraints bound the scenario?
2. What planetary fields shape traversal before nations or policies are considered?
3. What natural affordances and hazards matter?
4. What built infrastructure exists as a second-order traversal layer?
5. Which route candidates are possible, blocked, observed, or missing evidence?
6. Which flows have been observed?
7. Which civilization bounds become relevant from that evidence?
8. Which MoralGraph procedural lenses should be invoked for morality, review, consent, and legitimacy?
9. What terminal synthesis is allowed after evidence re-entry?

This keeps the Earth/map UI subordinate to the evidence order. The panel can zoom, project, and place badges, but the contract defines what the agent is allowed to reason over first.

## Path Scope

`shared/contracts/civilization-traversability-atlas.v1.ts`

- Owns the durable schema for planetary fields, infrastructure nodes, route candidates, observed flows, and traversability context.
- Keeps authority flags evidence-only and non-terminal.
- Must not import UI code or server tool code.

`shared/contracts/civilization-source-measurement.v1.ts`

- Owns the durable schema for source-backed measurements before they become atlas layers.
- Represents live or historical observations such as seismic events, tides, water levels, currents, wind vectors, weather alerts, and marine model samples.
- Keeps measurement receipts evidence-only and non-terminal.

`shared/civilization-traversability-atlas.ts`

- Public shared barrel for the contract.

`shared/civilization/civilization-traversability-fixtures.ts`

- Owns deterministic fixture evidence used by tests, panels, and the current Helix Ask tool.
- Fixtures are diagnostic placeholders until replaced by source-backed adapters.

`shared/civilization/civilization-route-objectives.ts`

- Owns route objective ordering such as fastest, lowest energy, highest capacity, lowest hazard exposure, lowest permission risk, and best observed.
- This prevents the UI from deciding procedural priority.

`shared/civilization/build-civilization-atlas-view-model.ts`

- Composes roadmap evidence and atlas evidence into a focused context for the agent.
- This is where selected routes, selected field layers, missing evidence, Theory bindings, and MoralGraph hints are gathered.

`server/skills/helix-ask.civilization-bounds-roadmap.ts`

- Current integration point for Helix Ask.
- Emits `traversabilityAtlas` and `traversabilityContext` beside the existing roadmap receipt.
- Remains deterministic, read-only, non-networked, and non-terminal.

`server/services/civilization-live-sources/`

- Owns source registry entries and source-specific normalizers.
- Request planners may construct URLs or authenticated toolbox request descriptors.
- Normalizers convert provider payloads into `civilization_source_measurement/v1` collections.
- Tests use deterministic payloads; live network calls must stay outside terminal-answer authority and enter the solver only as evidence receipts.

`client/src/data/civilizationTraversabilityAtlasFixture.ts`

- Thin client import surface for panels.
- The panel should consume shared fixture/build outputs rather than invent atlas ordering locally.

`client/src/components/CivilizationBoundsRoadmap.tsx`

- Remains the compatibility wrapper for the current panel.
- Future decomposition can move projection pieces under `client/src/components/civilization/`.

## Rule Of Thumb

Use contracts for ordering, shared builders for composition, server skills for evidence production, and panels only for projection.

Do not let a panel click, a map layer, a receipt summary, or a tool name become answer authority. The Helix Ask loop still has to re-enter the evidence and synthesize terminally only after the solver path is complete.

## Agent Procedure

```text
Theory bounds
  -> planetary fields
  -> source-backed measurements
  -> natural affordances and hazards
  -> built infrastructure
  -> route candidates
  -> observed flows
  -> civilization bounds
  -> optional MoralGraph procedural reflection
  -> terminal synthesis after evidence re-entry
```

The MoralGraph panel owns the procedural characterization of morality, consent, fairness, and cultural practice. The traversability atlas may attach `moralNodeIds` as hints, but it must not claim moral finality.

## Live And Historical Source Lifecycle

Live sources enter the architecture through four steps:

```text
source registry
  -> request plan
  -> provider payload
  -> normalized measurement collection
  -> traversability atlas field layer
```

The current registry covers:

- USGS earthquake catalog and real-time GeoJSON feeds for `seismic_activity`
- NOAA CO-OPS data API for `tide_height`, `water_level`, and `current_velocity`
- National Weather Service API for `wind_vector`, `weather_alert`, and `atmospheric_observation`
- Copernicus Marine Toolbox/API for `ocean_current`, `current_velocity`, and marine model samples

The request plan is not evidence by itself. The measurement collection becomes evidence only after the provider payload is normalized with:

- `sourceKind`
- `sourceUrl`
- `fetchedAt`
- `observedAt`
- `geometry`
- `quantity`
- `confidence`
- `uncertainty`
- `evidenceRefs`
- `rawRecordRefs`
- `missingEvidence`

Historical windows use the same contract as live readings. A USGS event from 2011, a NOAA tide window from last week, and a current NWS observation all enter as measurement receipts with different temporal frames.

## Workstation Tool Fit

The current slice extends `helix_ask.reflect_civilization_bounds` instead of adding a new mutating tool.

That is intentional:

- The atlas is evidence context, not an action surface.
- The existing receipt already has the right read-only diagnostic authority boundary.
- A later `civilization-bounds.reflect_traversability` workstation contract can be added only if routing needs a separate typed affordance.

Any later workstation contract must keep:

- `assistant_answer=false`
- `raw_content_included=false`
- `terminal_eligible=false`
- `post_tool_model_step_required=true`
- no private tool execution loop
- no policy, prediction, moral, or execution finality
