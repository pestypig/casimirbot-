# Repo Forest Coverage Audit - 2026-02-18

## 1) Objective

Build a higher-fidelity inventory of what is already defined in the repo "forest" (tree/DAG packs, routes, tools, tests), then compare it to the currently scoped ToE ticket map.

This pass is for planning efficiency, not new physics claims.

## 2) Method

Inputs compared:

- Resolver forest definition: `configs/graph-resolvers.json`
- Current ToE ticket map: `docs/audits/toe-cloud-agent-ticket-backlog-2026-02-17.json`
- Current ToE weighted progress snapshot: `docs/audits/toe-progress-snapshot.json`
- Concept/routing audit refresh: `reports/helix-ask-concept-audit.md`
- Domain wiring evidence in routes/tools/tests:
  - `server/routes.ts`
  - `server/routes/agi.plan.ts`
  - `server/services/halobank/time-model.ts`
  - `tests/helix-ask-modes.spec.ts`
  - `tests/halobank-time-model.spec.ts`
  - `docs/knowledge/robotics-recollection-tree.json`
  - `server/routes/agi.adapter.ts`

## 3) Coverage Census

- Resolver trees configured: `41` (from `configs/graph-resolvers.json`)
- Distinct current ToE tree owners: `9` (`docs/audits/toe-cloud-agent-ticket-backlog-2026-02-17.json:11`, `docs/audits/toe-cloud-agent-ticket-backlog-2026-02-17.json:210`)
- Forest-owner coverage by active ToE map: `9 / 41 = 21.95%`
- Current weighted ToE score is still `21%` on the 10-ticket map (`docs/audits/toe-progress-snapshot.json:22`)

Interpretation:

- The current ToE score is meaningful for the existing 10-ticket lane.
- It is not yet a full-forest coverage metric.

## 4) Key Findings

### F-COV-1 High: ToE backlog currently covers a narrow subset of defined tree owners

Evidence:

- Current ticket owners are limited to `physics-foundations`, `gr-solver`, `uncertainty-mechanics`, `trace-system`, `agi-runtime`, `ideology`, `security-hull-guard`, `ops-deployment`, `math` (`docs/audits/toe-cloud-agent-ticket-backlog-2026-02-17.json:11`, `docs/audits/toe-cloud-agent-ticket-backlog-2026-02-17.json:210`).
- Resolver forest contains many additional owners such as `warp-mechanics`, `pipeline-ledger`, `helix-ask`, `simulation-systems`, `atomic-systems`, `ui-backend-binding`, `hardware-telemetry`, `external-integrations`, and `robotics-recollection` (`configs/graph-resolvers.json:135`, `configs/graph-resolvers.json:249`, `configs/graph-resolvers.json:446`, `configs/graph-resolvers.json:646`, `configs/graph-resolvers.json:679`, `configs/graph-resolvers.json:715`, `configs/graph-resolvers.json:837`, `configs/graph-resolvers.json:1173`, `configs/graph-resolvers.json:1201`).

Impact:

- Ticket progress can overstate total framework completeness if interpreted as full-repo coverage.

### F-COV-2 High: Halobank/orbital/horizons surfaces are defined and wired but not represented in current ToE tickets

Evidence:

- Halobank concept anchor exists (`docs/knowledge/concepts-tree.json:363`, `docs/knowledge/halobank.md:2`).
- Resolver matching includes Halobank and orbital terms (`configs/graph-resolvers.json:345`, `configs/graph-resolvers.json:692`).
- Runtime exposes orbital ephemeris route (`server/routes.ts:765`) using Horizons utility (`server/routes.ts:16`, `server/routes.ts:772`).
- AGI plan registers `halobank.time.compute` (`server/routes/agi.plan.ts:14905`).
- Verify-mode ask test already exercises proof packet with Halobank tool (`tests/helix-ask-modes.spec.ts:79`, `tests/helix-ask-modes.spec.ts:104`).
- Halobank model explicitly declares diagnostic maturity (`server/services/halobank/time-model.ts:251`, `server/services/halobank/time-model.ts:255`).

Impact:

- Important orbital/time-domain primitives can influence planning but are outside the current ToE gap map, so integration quality is under-tracked.

### F-COV-3 Medium: Atomic/orbital simulation path is routed but not in ToE primitive backlog

Evidence:

- Atomic systems resolver is present (`configs/graph-resolvers.json:679`).
- AGI plan has explicit atomic viewer/panel constants (`server/routes/agi.plan.ts:10155`, `server/routes/agi.plan.ts:10156`).
- Topic routing includes orbital/atomic intent terms (`server/services/helix-ask/topic.ts:58`).

Impact:

- A sizable quantum/atomic surface exists with no explicit ToE ticket coverage for claim-tier discipline and replay parity.

### F-COV-4 Medium: Robotics recollection lane exists with gate hooks but no explicit ToE lane

Evidence:

- Robotics recollection tree is defined (`docs/knowledge/robotics-recollection-tree.json:3`, `docs/knowledge/robotics-recollection-tree.json:34`).
- Adapter has robotics safety veto path (`server/routes/agi.adapter.ts:174`, `server/routes/agi.adapter.ts:241`).
- Regression coverage exists for robotics safety veto (`server/__tests__/agi.adapter.test.ts:180`).

Impact:

- Movement/replay framework has real scaffolding but no dedicated ToE ticket sequence for hardware-grade provenance and closed-loop policy criteria.

### F-COV-5 Medium: Concept coverage gaps remain large even after current work

Evidence:

- Refreshed concept audit reports:
  - `panel ids = 75`
  - `knowledge concepts = 162`
  - missing panel concept ids still high (`reports/helix-ask-concept-audit.md:3`, `reports/helix-ask-concept-audit.md:6`, `reports/helix-ask-concept-audit.md:9`).

Impact:

- Helix Ask retrieval/routing can still miss defined surfaces, causing under-utilization of existing modules and less complete answer-time graph walks.

### F-COV-6 Medium: Potential divergence risk from duplicate Horizons proxy implementations

Evidence:

- Active route imports utility proxy (`server/routes.ts:16`).
- Separate top-level Horizons proxy file also exists (`server/horizons-proxy.ts:1`).

Impact:

- Multiple implementations can drift in parsing/assumptions, increasing maintenance and trust risk.

## 5) Missing Tree Owners from Current ToE Map

`analysis-loops`, `atomic-systems`, `brick-lattice-dataflow`, `casimir-tiles`, `certainty-framework`, `concepts`, `debate-specialists`, `dp-collapse`, `essence-luma-noise`, `ethos-knowledge`, `external-integrations`, `hardware-telemetry`, `helix-ask`, `ideology-physics-bridge`, `knowledge-ingestion`, `llm-runtime`, `packages`, `pipeline-ledger`, `queue-orchestration`, `resonance`, `robotics-recollection`, `sdk-integration`, `simulation-systems`, `skills-tooling`, `star-materials-environment`, `stellar-restoration`, `telemetry-console`, `ui-backend-binding`, `ui-components`, `warp-mechanics`, `zen-ladder-pack`, `zen-society`

## 6) Planning Recommendation

For the next planning cycle, treat this as a coverage freeze step before additional deepening work:

1. Keep current ToE work as "core lane complete-to-010", but do not interpret `toe_progress_pct` as total framework completion.
2. Add a coverage expansion lane before or in parallel with `TOE-008`:
   - orbital/ephemeris policy lane (Halobank + Horizons + provenance class)
   - atomic/orbital claim-tier lane
   - robotics recollection provenance lane
   - external-integration evidence lane
   - forest-owner manifest lane (resolver-tree owner coverage parity)
3. Require each new lane to map:
   - tree owner -> runtime surface -> tests -> verification artifact.

## 7) Candidate Extension Tickets (Post-010)

Proposed next tickets to convert this audit into executable work:

- `TOE-011-orbital-ephemeris-provenance-bridge`
- `TOE-012-halobank-horizons-consistency-gate`
- `TOE-013-atomic-systems-claim-tier-contract`
- `TOE-014-robotics-recollection-provenance-contract`
- `TOE-015-external-integration-evidence-manifest`
- `TOE-016-resolver-forest-owner-coverage-manifest`

These are planning candidates only; no claim-tier change should be made until each candidate has tests + Casimir verification evidence.
