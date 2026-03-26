# HaloBank Definition-Level Congruence Plan

Status: draft  
Owner: dan  
Scope: align HaloBank solar proof lanes with the paper-ingestion Tree + DAG framework at the level of executable definitions, symbols, and derivation order

## Purpose

Make theory overlap deterministic for executable physics routes.

Today, the framework is strongest where proof lanes are hand-authored and claim-backed. HaloBank already exposes explicit runtime concepts such as `metric_context`, `observer_context`, and `signal_path`, but the paper-ingestion binding layer still resolves overlap mainly through keyword and token scoring. That is useful for cataloging, but it is not enough for deterministic executable compatibility.

This plan records the changes required so theory overlap means one or more of the following:

1. same definition,
2. same symbol under an explicit equivalence map,
3. same equation under stated assumptions, or
4. valid derivation order from one executable artifact to another.

## Current State

### Strengths already present

HaloBank solar already has a curated proof lane:

- `docs/knowledge/halobank-solar-proof-tree.json`
- `docs/knowledge/math-claims/halobank-solar.math-claims.json`
- `server/routes/halobank-solar.ts`
- `server/modules/halobank-solar/types.ts`
- `server/modules/halobank-solar/derived.ts`

The current solar lane already exposes executable runtime concepts:

- `metric_context`
- `observer_context`
- `signal_path`
- explicit time-scale semantics
- claim IDs, equation refs, falsifier IDs, and artifact refs

The paper-ingestion lane already has a resolver-visible runtime projection:

- `docs/knowledge/paper-ingestion-runtime-tree.json`
- `configs/graph-resolvers.json` lane `paper-ingestion-runtime`
- `scripts/paper-prompt-ingest.ts`
- `scripts/paper-gpt-pro-packet.ts`
- `scripts/paper-gpt-pro-validate.ts`

### Gap to close

The current paper binding layer does not yet bind paper concepts to HaloBank definition-level nodes. The main matching path in `scripts/paper-framework-binding.ts` is still based on curated canonical rules plus keyword and token overlap. That means two theories can appear related without the framework proving that they share:

- the same reference frame,
- the same time-scale semantics,
- the same observer model,
- the same signal-path assumptions,
- the same symbols and units, or
- the same derivation order.

### Repo-wide findings beyond HaloBank

This is not only a HaloBank issue. A broader review of the Tree + DAG physics content shows the same pattern across much of the repo.

Broad findings:

1. Most broad physics and warp trees are still concept-directory structures.
2. Stronger executable metadata exists in selected bridge, proxy, and derived lanes.
3. The paper-ingestion path already produces symbol and lineage artifacts, but the runtime binding and validation layers do not yet treat them as first-class congruence rails.
4. The graph runtime currently enforces `equation_ref` and `claim_ids`, but not definition-level identity, symbol equivalence, or derivation-order semantics.

Representative examples:

- `docs/knowledge/physics/physics-foundations-tree.json`
- `docs/knowledge/physics/uncertainty-mechanics-tree.json`
- `docs/knowledge/warp/warp-mechanics-tree.json`

These trees are useful as navigable maps, but many nodes are still:

- `nodeType: "concept"`
- `validity: {}`
- `predictability.status: "partial"`
- connected mainly through `hierarchy`, `association`, or guardrail edges rather than explicit definition-level executable edges

By contrast, some narrower lanes are already closer to the target state:

- `docs/knowledge/physics/atomic-systems-tree.json`
- `docs/knowledge/physics/physics-spacetime-gr-tree.json`
- `docs/knowledge/math-claims/atomic-system.math-claims.json`
- `configs/physics-equation-backbone.v1.json`
- `configs/physics-root-leaf-manifest.v1.json`
- `configs/math-congruence-matrix.v1.json`

Those files already show parts of the stronger pattern this plan is aiming for:

- explicit `equation_ref`
- explicit `claim_ids`
- deterministic `strict_fail_reason`
- residual/falsifier contracts
- root-to-leaf equation anchoring
- cross-lane maturity ceilings

The paper-ingestion side is also partially ahead of its runtime binding layer. The ingest pipeline already emits:

- definition/equation/variable/unit/assumption node types
- `symbol_equivalence_map`
- `derivation_lineage`

But those artifacts are not yet enforced as first-class graph/runtime congruence contracts in the same way that `equation_ref` and `claim_ids` are enforced today.

Operational implication:

- HaloBank should be treated as the first concrete implementation target for definition-level congruence.
- The resulting pattern should then be generalized to the broader physics trees, especially `physics-foundations`, `uncertainty-mechanics`, and `warp-mechanics`.
- The final goal is repo-wide compatibility between paper ingestion, tree navigation, executable routes, and math maturity gates.

## Goal State

The framework should only treat paper theory overlap as executable overlap when it can traverse a deterministic chain like this:

1. `definition node`
2. `symbol-equivalence artifact`
3. `equation binding`
4. `derivation-order edge`
5. `claim node`
6. `proof node`
7. `falsifier or maturity gate`

For HaloBank, the minimum definition-level vocabulary should include:

- `metric_context`
- `observer_context`
- `signal_path`
- `reference_frame`
- `time_scale`

## Required Changes

## Workstream A: Add definition-level runtime nodes

The runtime trees need first-class nodes for executable definitions, not only concepts and claims.

Required changes:

1. Extend `docs/knowledge/halobank-solar-proof-tree.json` with explicit child nodes for:
   - `metric_context`
   - `observer_context`
   - `signal_path`
   - `reference_frame`
   - `time_scale`
2. Ensure those nodes carry:
   - `nodeType`
   - definition text
   - evidence pointers to code/config/tests
   - links to proof nodes that consume them
3. Extend `docs/knowledge/paper-ingestion-runtime-tree.json` promotion rules so ingested papers can emit matching definition nodes when a paper explicitly defines one of these objects.
4. Update `scripts/paper-prompt-ingest.ts` so definition-level nodes survive promotion into the runtime tree instead of collapsing into generic concept nodes.

## Workstream B: Add symbol-equivalence as a first-class artifact

Shared theory should not be inferred only from overlapping words. It should be represented as explicit symbol equivalence.

Required changes:

1. Add symbol-equivalence artifacts to the paper report and runtime promotion path.
2. Extend `schemas/paper-gpt-pro-report.schema.json` and `scripts/paper-gpt-pro-validate.ts` so symbol equivalence can be validated, not merely stored.
3. Require each symbol-equivalence entry to support at least:
   - local symbol id
   - canonical symbol id
   - unit
   - role
   - evidence span
   - assumption notes
4. Bind HaloBank runtime symbols to these entries for the solar route where applicable.

Minimum HaloBank symbol targets:

- frame identifiers for BCRS and GCRS
- time-scale identifiers for UTC, TAI, TT, TDB, TCB, TCG
- observer-state symbols
- line-of-sight or signal-path symbols
- metric or weak-field source-potential identifiers

## Workstream C: Add derivation-order edges

For executable compatibility, the graph must know not only what matches, but what has to be computed first.

Required changes:

1. Add derivation-order edges as first-class runtime artifacts in the paper-ingestion lane.
2. Update `docs/knowledge/paper-ingestion-runtime-tree.json` so promoted paper nodes can declare ordered dependencies.
3. Update `configs/graph-resolvers.json` so the paper-ingestion walk can prioritize derivation-order edges when present.
4. Define at least these edge semantics:
   - `defines`
   - `depends_on_definition`
   - `uses_symbol`
   - `equation_of`
   - `derives_after`
   - `feeds_claim`
   - `feeds_falsifier`

For HaloBank, the default inner-solar order should be explicit:

1. `reference_frame`
2. `time_scale`
3. `metric_context`
4. `observer_context`
5. `signal_path`
6. `state vector`
7. `derived observable`
8. `claim`
9. `gate`

## Workstream D: Expand canonical binding coverage for HaloBank

HaloBank is already in the framework structurally, but it is not yet a first-class paper-binding target.

Required changes:

1. Extend `scripts/paper-framework-binding.ts` so HaloBank trees and math-claim registries are part of canonical binding coverage.
2. Add HaloBank-specific canonical IDs for executable solar definitions instead of relying only on broad canonical IDs.
3. Extend `scripts/paper-gpt-pro-packet.ts` so HaloBank files are included in the executable hotspot packet.
4. Extend `scripts/paper-gpt-pro-validate.ts` so HaloBank canonical IDs are accepted and checked.

Minimum new canonical target family for HaloBank should cover:

- solar metric context
- observer model
- signal path
- frame semantics
- time-scale semantics
- local-rest outer reference semantics

## Workstream E: Bind definitions to claims and proofs

Definition nodes need to be consumed by actual executable claims, not left as isolated glossary entries.

Required changes:

1. Extend `docs/knowledge/math-claims/halobank-solar.math-claims.json` so claims can reference definition-node IDs and symbol-equivalence artifacts.
2. Ensure `server/routes/halobank-solar.ts` emits artifact refs that can point to definition-level runtime objects, not only high-level proof results.
3. Make proof nodes in `docs/knowledge/halobank-solar-proof-tree.json` link back to the definition nodes they require.
4. Keep outer-frame motion, such as local-rest or galactic context, separate from the inner solar metric layer.

## Workstream F: Make maturity and falsifiers definition-aware

If a definition match is incomplete, the framework should not promote the overlap to a stronger executable claim.

Required changes:

1. Add maturity-gate checks that fail or downgrade when:
   - symbol equivalence is missing,
   - units are missing,
   - derivation order is incomplete, or
   - the claimed definition is only conceptually similar.
2. Record deterministic fail IDs for definition-level mismatch classes.
3. Keep these failures separate from numerical residual failures.

## Proposed File Surfaces

Existing files likely to change in later implementation phases:

- `scripts/paper-framework-binding.ts`
- `scripts/paper-gpt-pro-packet.ts`
- `scripts/paper-gpt-pro-validate.ts`
- `scripts/paper-prompt-ingest.ts`
- `schemas/paper-gpt-pro-report.schema.json`
- `docs/knowledge/paper-ingestion-runtime-tree.json`
- `configs/graph-resolvers.json`
- `docs/knowledge/halobank-solar-proof-tree.json`
- `docs/knowledge/math-claims/halobank-solar.math-claims.json`
- `server/routes/halobank-solar.ts`
- `server/modules/halobank-solar/types.ts`

Repo-wide files likely to need follow-on work after the HaloBank-first phase:

- `docs/knowledge/physics/physics-foundations-tree.json`
- `docs/knowledge/physics/uncertainty-mechanics-tree.json`
- `docs/knowledge/warp/warp-mechanics-tree.json`
- `configs/physics-equation-backbone.v1.json`
- `configs/physics-root-leaf-manifest.v1.json`
- `configs/math-congruence-matrix.v1.json`
- `server/services/helix-ask/graph-resolver.ts`
- `server/services/helix-ask/relation-assembly.ts`

Potential new artifacts if the current files become too overloaded:

- a definition-node manifest for executable physics terms
- a symbol-equivalence registry for paper-to-runtime mappings
- a derivation-order manifest for runtime proof lanes

## Execution Order

Phase 1: Definition surfaces

1. Add definition-level nodes to HaloBank proof trees.
2. Add corresponding canonical IDs and validator support.
3. Keep the scope narrow to the five minimum definitions.
4. Use the HaloBank-first patch as the template for later rollout into broader physics trees.

Phase 2: Symbol compatibility

1. Add symbol-equivalence entries to the GPT paper report contract.
2. Validate units, roles, and evidence spans.
3. Bind those entries to HaloBank runtime concepts.

Phase 3: Derivation ordering

1. Add derivation-order edges to runtime promotion.
2. Make graph resolvers prefer ordered executable edges over conceptual overlap.
3. Expose ordered dependencies in proof-node artifacts.

Phase 4: Gate enforcement

1. Add maturity and fail-ID rules for missing definition congruence.
2. Ensure proof nodes cannot promote above diagnostic when definition congruence is incomplete.
3. Add tests for symbol mismatch, unit mismatch, and missing derivation-order edges.

Phase 5: Repo-wide rollout

1. Extend the same definition-level pattern to `physics-foundations`, `uncertainty-mechanics`, and `warp-mechanics`.
2. Promote symbol and derivation artifacts from paper-ingestion pack outputs into runtime-tree and graph-resolver semantics.
3. Keep directory trees and executable proof lanes aligned so concept navigation and executable congruence do not drift apart.

## Acceptance Criteria

This plan is complete only when all of the following are true:

1. Paper claims can bind directly to HaloBank definition-level nodes.
2. Shared symbols are represented explicitly with unit-aware equivalence entries.
3. The graph can traverse derivation order, not only conceptual relations.
4. HaloBank proof nodes declare which definitions they depend on.
5. Missing definition congruence causes deterministic downgrade or fail behavior.
6. Theory overlap is explainable as executable overlap with file-backed evidence.
7. The same congruence pattern is reusable outside HaloBank for the broader physics and warp trees.

## Non-Goals

The immediate goal is not to certify the solar lane or build a full theorem prover.

This plan does not require:

- replacing the existing paper-ingestion fast-scan path,
- promoting HaloBank above diagnostic maturity,
- merging outer galactic reference semantics into the inner solar metric layer, or
- treating keyword overlap as invalid when no executable route is being claimed.

## Immediate Next Step

Use this document as the checklist for the next implementation phase.

The first patch should be small and concrete:

1. add the five definition-level nodes to the HaloBank proof tree,
2. extend canonical binding coverage so papers can target them, and
3. leave symbol-equivalence and derivation-order enforcement for the next patch after that.
