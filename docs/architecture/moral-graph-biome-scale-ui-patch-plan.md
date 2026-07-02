# Moral Graph Biome Scale UI Patch Plan

Date: 2026-07-02

## Goal

Replace the current hard-to-read Moral Badge Graph map with a biome-organized
view that makes scale, action cadence, claim maturity, and action manifestation
visible. The UI should help a user trace how substrate primitives such as
boundary, sensing, perturbation response, and maintenance become larger-scale
coordination and mandates without flattening every badge into one visual layer.

This is a surgical UI patch. Do not add a second competing graph renderer or
parallel node system. Replace the current layout source used by
`MoralGraphPanel` with a focused biome view model, then keep the panel as the
rendering surface.

## Current Problem

The current Moral Graph panel builds graph data, node layout, terrain chunks,
selection behavior, and side-rail presentation in
`client/src/components/panels/MoralGraphPanel.tsx`, which is already over 1,200
lines. The existing map has useful pieces, but the layout is hard to interpret
because root principles, activated lenses, safeguards, action gates, character
nodes, answer blocks, and probability terrain all occupy the same broad visual
plane.

The new living-substrate Moral Graph layer makes that problem more visible. If
we simply append substrate nodes to the current plane, the panel will become
larger and the user still will not know which scale or action layer they are
looking at.

## Organizing Model

Use scale, but do not make scale the only hierarchy. The better UI unit is a
biome with scale bands inside it.

Primary dimensions:

- Biome: the domain where the badge belongs.
- Scale band: molecular, cellular, organism, group, institution, civilization.
- Time/action cadence: fast local, regulated, coordinated, delayed,
  institutional, long-horizon.
- Claim maturity: substrate, procedural, derived, frontier, boundary.
- Action manifestation: sensing, maintaining, responding, coordinating,
  mandating, judging, blocking.

Why this matters:

- Conservation-like principles can apply across scales, but their expression
  changes by distance, latency, and available action.
- Smaller scales can host fast local action. Larger scales tend to accumulate
  coordination, delay, authority, and mandate structure.
- Moral Graph should show the emergence path without suggesting that the same
  badge has identical meaning at every scale.

## Biome Draft

Start with these biomes:

- `substrate_boundary`: organism/environment boundary, entropy exposure, inside
  versus outside.
- `substrate_sensing`: sensing, state discrimination, perturbation detection.
- `maintenance_response`: homeostasis, repair, viable range, perturbation
  response.
- `coordination_scale`: single-cell to multicellular coordination, group
  coordination, social dependencies.
- `mandate_authority`: obligations, priorities, rules, review gates, two-key
  authority, institutional mandates.
- `frontier_mechanism`: Orch-OR, microtubule, anesthetic perturbation, objective
  reduction, Fourier/frequency mapping. This biome is always frontier or
  theory-bridge context, never a moral proof biome.
- `claim_boundary`: overclaim blockers, final-verdict blockers, evidence
  requirements, source maturity limits.

Scale bands:

- `molecular`
- `cellular`
- `organism`
- `group`
- `institution`
- `civilization`

Action cadence:

- `fast_local`
- `regulated`
- `adaptive`
- `coordinated`
- `delayed`
- `long_horizon`

## Surgical Implementation Shape

Do not grow `MoralGraphPanel.tsx` with a second layout. Extract first, then
replace.

Preferred new modules:

- `client/src/lib/moral-graph/biomeScaleViewModel.ts`
  - Converts existing reflection, locator, substrate principles, wisdom
    principles, and current answer block inputs into one UI view model.
  - Owns biome ids, scale bands, action cadence, layout rows/columns, and node
    grouping.
  - Exposes stable node and edge types for the panel.

- `client/src/components/panels/MoralGraphBiomeMap.tsx`
  - Renders the biome grid/bands and node map.
  - Receives a view model, selected ids, and callbacks.
  - Does not compute graph semantics.

- Optional only if needed:
  `client/src/components/panels/MoralGraphBiomeLegend.tsx`
  - Renders compact biome, maturity, and cadence controls.
  - Keep this separate if legend/filter logic starts bloating the panel.

Replace inside `MoralGraphPanel.tsx`:

- Current hard-coded x/y construction for root, wisdom principles, matches,
  traits, gates, boundaries, character nodes, and answer nodes should be moved
  into the view-model builder or replaced by biome placement.
- The panel should keep high-level state: selected node ids, hover id, objective
  rail open state, and load-to-calculator action.
- The panel should call the view-model builder once through `useMemo`.
- The panel should render `MoralGraphBiomeMap` instead of manually rendering all
  graph nodes/edges inline.

Do not change yet:

- Moral Graph reflection contracts.
- Helix Ask gateway semantics.
- Evidence-only/non-terminal authority.
- Fruition calculator contracts.
- Theory Graph/calculator ownership of equations and Fourier/frequency payloads.

## Replacement Rules

Replace, do not duplicate:

- There should be one map view model feeding the visible Moral Graph map.
- The substrate biome should be part of that view model, not a separate overlay
  that can drift from the existing graph.
- Existing objective binding rail can remain, but it should consume selected
  node metadata from the same biome view model.
- Probability terrain should either map onto biome chunks or be hidden behind a
  clear compatibility layer. Do not keep an unrelated terrain plane if it
  contradicts the biome layout.

Keep compatibility:

- Preserve existing tests for current-answer block, Fruition loading, locator
  highlighting, and Moral Graph reflection.
- Preserve existing node ids so debug exports and locator refs still resolve.
- If a node cannot be assigned to a biome, assign it to `claim_boundary` or
  `mandate_authority` only through an explicit fallback reason.

## UI Behavior

The first viewport should show:

- A left-to-right or top-to-bottom biome structure that reveals the living
  substrate before human/social mandates.
- Scale bands visible as labeled lanes.
- Badges placed where their action manifests.
- Frontier theory badges visually distinct from substrate/procedural badges.
- Claim boundaries visually distinct from action-capable badges.

Node detail should show:

- Badge title and short meaning.
- Biome.
- Scale band.
- Action cadence.
- Maturity.
- Action manifestation.
- Source theory badge ids when present.
- Claim boundary notes when present.

Controls should stay compact:

- Biome filter.
- Scale band filter.
- Maturity filter.
- Toggle for frontier/theory bridge nodes.
- Toggle for claim boundaries.

Avoid in-app explanatory paragraphs. Use concise labels, legends, tooltips, and
structured metadata in the details panel.

## Test Plan

Add focused tests for the extracted view model before touching broad UI behavior:

- `client/src/lib/moral-graph/__tests__/biomeScaleViewModel.spec.ts`
  - substrate badges map to substrate biomes and scale bands.
  - wisdom principles map to mandate/procedural biomes.
  - frontier mechanism badges map to `frontier_mechanism` and never to
    final-verdict or mandate authority.
  - every visible node has biome, scale band, cadence, maturity, and action
    manifestation.
  - current answer / locator node ids still resolve.

Add focused component tests:

- `client/src/components/__tests__/moral-graph-biome-map.spec.tsx`
  - renders biome lanes.
  - renders substrate badges before mandate/authority badges.
  - selection still updates details.
  - claim-boundary and frontier badges are visually distinguishable by labels or
    stable test ids.

Run targeted checks:

```txt
npx vitest run client/src/lib/moral-graph/__tests__/biomeScaleViewModel.spec.ts client/src/components/__tests__/moral-graph-biome-map.spec.tsx client/src/components/__tests__/moral-graph-panel.spec.tsx --pool=forks
```

If the patch touches Helix Ask admission, gateway, solver, or tool contracts,
also run the relevant Helix Ask checks. A pure UI/view-model patch should not
require Casimir verification.

## Non-Goals

- Do not make a new backend reflection lane.
- Do not make the Moral Graph solve equations.
- Do not add calculator payloads to Moral Graph badges.
- Do not claim Orch-OR, microtubule evidence, or any frontier mechanism proves
  consciousness or moral status.
- Do not redesign the entire workstation shell.
- Do not remove the current answer rail unless the replacement preserves the
  same terminal-authority evidence projection.

## Completion Criteria

The patch is complete when:

- The Moral Graph panel visibly organizes badges by biome and scale band.
- Living-substrate badges appear as the earliest substrate layer.
- Existing wisdom/action/authority badges are still visible but no longer share
  the same undifferentiated plane.
- Frontier mechanism and claim-boundary nodes are visually separated from
  procedural moral nodes.
- The implementation reduces or stabilizes `MoralGraphPanel.tsx` responsibility
  by extracting the biome view model and map rendering.
- Tests prove the view model and component behavior without relying on a live
  server.
