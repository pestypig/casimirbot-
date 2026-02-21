# Sector-Strobed Casimir Natario Research Ledger (2026-02-21)

Derived from:
- User research draft: "Sector-Strobed Casimir Tile Control Model for Natario Canonical Warp in CasimirBot"

## Research tracking metadata

- research_id: `sector_strobe_natario_20260221`
- status: `tracked`
- maturity_label: `diagnostic`
- certifying: `false`
- scope: `research -> implementation planning`
- owner_lane: `warp-gr-control`

## Baseline claims tracked (non-certifying)

1. Natario canonical framing can be represented in ADM 3+1 terms for repo-side control modeling.
2. Negative-energy requirements and QI-style constraints are treated as hard guardrails, not bypass targets.
3. Sector strobing is modeled as constrained scheduling (continuous duty plus discrete sector assignment).
4. Operational modes map to control envelopes and guardrail priorities, not deployment claims.
5. Current proposal maturity is diagnostic unless hard guardrails pass with certificate-grade evidence.

## Proposal structures to implement

1. Shared schema contract for sector control plans
- target: `shared/schema.ts`
- add: `sectorControlPlanSchema` + output type
- include: mode, timing, allocation, duty, constraints, objective, maturity, notes

2. Sector control planner module
- target: `server/control/sectorControlPlanner.ts` (new)
- add: reduced-order target builder, sector allocator, guardrail-aware planner
- include: hard-stop behavior on first failing hard guardrail

3. Scheduler and guardrail adapter integration
- targets:
  - `server/energy/phase-scheduler.ts`
  - `server/qi/qi-monitor.ts`
  - `server/qi/qi-bounds.ts`
  - `shared/clocking.ts`
- add: adapter glue for duty/concurrency/TS/QI telemetry into planner decisions

4. Helix Ask tool accessibility
- targets:
  - `server/helix-core.ts`
  - `server/routes/agi.plan.ts`
- add: new callable planning tool and routing path for sector-control intent

5. Proof/supplement output wiring
- targets:
  - `server/helix-proof-pack.ts`
  - `server/services/planner/supplements.ts`
- add: explicit sector-control evidence packet for Helix Ask rendering and replay

6. Test and verification lane
- target tests (existing + new):
  - `tests/pipeline-ts-qi-guard.spec.ts`
  - `tests/helix-ask-routing.spec.ts`
  - `tests/helix-ask-modes.spec.ts`
  - `tests/warp-sector-control.spec.ts` (new)
  - `tests/sector-control-planner.spec.ts` (new)

## Falsification checkpoints to carry into implementation

1. Planner produces mode plans that violate concurrency or duty bounds.
2. QI window checks are monotonicity-broken with tau changes.
3. TS ratio constraints are not enforced before plan output.
4. Hard-guardrail failure does not trigger deterministic fail-closed behavior.
5. Helix Ask can emit sector-control guidance without a guardrail status block.

## Acceptance condition for next wave

- A prompt-batch implementation pack is present and path-bounded.
- Every prompt in the pack requires Casimir verify with PASS and certificate integrity OK.
- Final report clearly separates diagnostic implementation from physical viability claims.
