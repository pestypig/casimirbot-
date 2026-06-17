# Civilization Bounds Roadmap

Civilization Bounds Roadmap is a situational bounds artifact. It represents bounded systems, capabilities, resources, dependencies, collaboration constraints, missing observations, and procedural gates.

It does not decide what should happen, certify predictions, authorize actions, or collapse physical possibility into moral proof.

## Authority Boundary

The roadmap is read-only, evidence-only, diagnostic, non-certifying, and non-terminal.

Receipts are observations, not final answers. The model-facing loop must re-enter evidence before terminal authority can synthesize an answer.

The artifact authority contract requires:

- `assistant_answer: false`
- `terminal_eligible: false`
- `agent_executable: false`
- `prediction_finality: false`
- `policy_finality: false`
- `moral_finality: false`
- `execution_permission: false`

## Relation To Theory Badge Graph

Theory badge evidence anchors physical bounds: energy budgets, material inventory, manufacturing resolution, entropy sinks, observation channels, conservation constraints, and falsification hooks.

Civilization Bounds Roadmap adds situational capacity context between those physical badges and any downstream procedural reflection.

## Relation To ZenGraph

ZenGraph remains the procedural justice lens. Civilization bounds can expose review interfaces, consent gaps, observability gaps, reversibility margins, and missing checks that ZenGraph can use as evidence.

The roadmap does not turn those procedural lenses into a verdict.

## Relation To The Theory-Zen Bridge

The intended bridge continuity is:

```text
Theory badge evidence
  -> physical bounds, materials, energy, entropy, observation

Civilization bounds evidence
  -> capacity, scarcity, dependency, reversibility, governance interface

ZenGraph evidence
  -> fairness, review, uncertainty, non-harm, due process
```

The bridge may use civilization bounds as a situational evidence layer. It should use language like `constrains`, `requires evidence`, `activates review`, `flags missing observation`, and `bounds claim strength`.

It must not claim that physics proves justice or that a collaboration score is moral value.

## Read-Only Actions

The intended read-only action surface is:

- `locate_context`
- `reflect_system_bounds`
- `compare_collaboration_bounds`
- `export_bridge_context`

These actions return evidence receipts. They do not mutate panels, execute operations, call the internet, or grant action authority.

## Minimal UI Principles

The visual panel should stay compact:

- map substrate
- bounded-system badges
- capability, resource, and constraint badges
- collaboration and dependency edges
- phase and layer controls
- glyph and status cues

Long explanations belong in backend receipts, debug export, and Helix Ask synthesis, not in panel chrome.

## Current Scenario Adapter

The first adapter converts the existing Needle role dataset into `civilization_bounds_roadmap/v1`.

This adapter marks the scenario as `declared_scenario` with `ideal_bounds`. It does not treat the role data as observed reality.

## Implementation Assembly

`civilization_bounds_roadmap/v1` now carries the roadmap as a typed procedural
receipt:

- `parameterScopes` for material base, governance capacity, conflict exposure,
  social cohesion, information legitimacy, and environmental pressure
- `actionChannels` for economic, coercive, persuasive, diplomatic, governance,
  infrastructure, and observation pathways
- `dependencyChains` for bottleneck and review-interface chains
- `comparisonCases` for stable peer, stressed peer, historical analogue, and
  null-case comparisons
- `hypothesisClaims` for bounded, blocked, non-final hypotheses
- `proceduralScaffold` for the Spore Civilization Stage design metaphor and
  blocked interpretations

The Helix Ask tool `helix_ask.reflect_civilization_bounds` exposes those fields
both inside `roadmap` and as top-level tool-output fields so downstream tool
calls can inspect the procedural scopes without treating the roadmap as a final
answer.

## Research Extensions

- `docs/audits/research/civilization-bounds-spore-procedural-systems-2026-06-17.md`
  uses Spore Civilization Stage as a bounded design metaphor for procedural
  nodes, resource anchors, action channels, dependency edges, comparison
  parameters, and prediction guardrails. It is evidence-normalization context,
  not a terminal prediction or policy authority.
- `docs/audits/research/civilization-bounds-nation-procedural-network-fit-2026-06-17.md`
  checks whether the same procedural scaffold can represent current nations on
  a world map. It recommends a diagnostic atlas with transient, time-stamped
  nation state vectors, event pulses, dependency edges, confidence, freshness,
  and missing-observation overlays instead of fixed nation classes or final
  civilization scores.
