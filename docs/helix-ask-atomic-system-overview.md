# Helix Ask Atomic System Overview

This document summarizes how the current atomic simulation path works end to end,
and where it sits on physics realism/congruence.

## 1) What the system is

The atomic path is a Helix Ask to viewer pipeline that:

- routes atom/orbital prompts through a dedicated DAG tree
- emits a normalized `viewer_launch` payload
- opens one canonical panel (`electron-orbital`)
- applies launch parameters (`model`, `Z`, `n`, `l`, `m`, `sampleCount`)
- renders either a quantum cloud or classical shell view

Primary intent is diagnostic visualization and conversational grounding, not
certified physics simulation.

## 2) Core files

- Tree definition: `docs/knowledge/physics/atomic-systems-tree.json`
- Tree registration: `configs/graph-resolvers.json`
- Topic routing boosts: `server/services/helix-ask/topic.ts`
- Launch synthesis in Ask route: `server/routes/agi.plan.ts`
- Ask response typing: `client/src/lib/agi/api.ts`
- Ask pill launch bridge: `client/src/components/helix/HelixAskPill.tsx`
- Panel launch application: `client/src/components/ElectronOrbitalPanel.tsx`
- Simulation state/hook: `client/src/hooks/useElectronOrbitSim.ts`
- Orbital cloud math adapter: `client/src/lib/atomic-orbitals.ts`
- Imported reference repo: `external/atoms-kavan010`

## 3) Runtime flow

1. User asks Helix about atoms/orbitals.
2. Topic inference and graph resolver match the `atomic-systems` tree.
3. Server builds `viewer_launch` from:
   - DAG node environment/inputs/outputs
   - plus question-level overrides (for `model`, `Z`, `n`, `l`, `m`, orbital notation like `2p`, and sample count)
4. Server normalizes and clamps params, then attaches `viewer_launch` to the Ask response.
5. Helix Ask Pill:
   - opens `electron-orbital`
   - stores payload in `sessionStorage`
   - dispatches `helix:atomic-launch`
6. Electron Orbital panel consumes pending/event payload, normalizes again, and applies:
   - simulation mode
   - sample count override
   - hydrogenic `Z`
   - selected electron orbital state
7. Orbit hook regenerates orbital cloud points and canvas renderer draws the chosen mode.

## 4) Parameter contract and normalization

Contract keys:

- `model`: `quantum | classical`
- `Z`: integer nuclear charge
- `n`, `l`, `m`: orbital quantum numbers
- `sampleCount`: optional cloud sample count

Current server/panel clamp envelope:

- `Z`: `1..118`
- `n`: `1..10`
- `l`: `0..n-1` (with `n` adjusted upward when needed)
- `m`: `-l..l`
- `sampleCount`: `96..4000`

Current orbital library internal normalization:

- `n`: `1..7`
- `l`: `0..n-1`
- `m`: `-l..l`

This means launch/UI may accept `n > 7`, but cloud generation is currently
bounded to `n <= 7`.

## 5) Simulation modes implemented now

Quantum mode:

- builds radial CDF and angular CDF
- samples points from hydrogenic-like distributions
- computes density weights for `|psi|^2` style rendering

Classical mode:

- generates a Bohr-like trajectory shell/ellipse cloud
- uses orbital parameters for eccentricity/tilt style behavior

Viewer behavior:

- panel can switch quantum/classical interactively
- renderer draws either point cloud (quantum emphasis) or shell/track (classical emphasis)
- source label in UI ties equations to the imported atoms adapter

## 6) Congruence and physics maturity

Current maturity (from tree metadata): reduced-order, diagnostic.

What is congruent:

- unified parameter contract across quantum and classical views
- bounded integer normalization for stable runtime behavior
- hydrogenic scaling with `Z` and quantum-number-based state labeling
- deterministic seeding per electron id/index for repeatable clouds

What is approximate / not yet represented:

- no multi-electron correlation (Hartree-Fock/DFT/CI class models absent)
- no spin-orbit, fine structure, QED corrections, or relativistic Dirac treatment
- no uncertainty quantification on rendered clouds
- no explicit solver residuals or numerical convergence certificates
- no experimental calibration path for atomic observables

Interpretation: this is a coherent viewer-oriented model contract, not a
physically complete atom simulator.

## 7) Tree rails you can add next

If you want stronger math-congruence governance, add rails in the atomic DAG:

1. Validity-domain rail
- allowed domains per mode (`single-electron hydrogenic`, `visual diagnostic`)
- explicit fail/soft-fail behavior when prompts exceed domain

2. Parameter-consistency rail
- enforce shared max bounds (`n` cap) across server, panel, and orbital adapter
- reject/annotate coercions in `viewer_launch` debug

3. Observable rail
- define which quantities are display-only vs physically asserted
- tag values like energy estimate as model-level approximation

4. Maturity rail
- exploratory/reduced-order/diagnostic/certified stage flag per node
- gate claims based on stage

5. Traceability rail
- include source tree id/path and normalization deltas in every launch trace

## 8) Practical summary

The system now gives one canonical, traceable atomic simulation route from Helix
conversation to viewer state, with a uniform parameter contract and dual
quantum/classical render modes. It is structurally congruent for product/runtime
use, and ready for stricter tree rails if you want to enforce deeper research
math congruence.

