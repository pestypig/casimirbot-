Program gate: G2H-E-S5-A4/P8P remains the sole active program gate; ET0-A is an explicitly authorized nonperturbing parallel apparatus lane
Workstream: NHM2 source-to-experiment closure / ET0 provenance and architecture decoupling
Capability or component: deterministic 447 authority inventory and versioned layer-scaling architecture v2 contract/fixture boundary
Current maturity: ET0 eligible; v1 diagnostic evidence is preserved, but ambient 447 authority and cross-profile/state/geometry reuse remain representable
Target maturity: ET0-A contract maturity with a reproducible authority inventory, fail-closed v2 architecture binding, immutable-v1 regression evidence and no selected production architecture
Required frozen inputs: canonical work program; active P8P packet; source-to-experiment closure packet; WARP_AGENTS.md; the five v1 source/test identities listed below; exact failure precedence and fixture matrix in this packet
Required evidence: deterministic repository inventory with file hashes and classified occurrences; strict v2 runtime guard; candidate-neutral manufactured fixtures for every failure class; unchanged v1 semantic fixtures; math/root-to-leaf/WARP/Casimir verification
Stop/fail criteria: any P8P or selected-candidate change; any v1 rewrite; a fallback, target-calibrated value, mutable alias, metric echo, stale profile/state/geometry lineage, degenerate metric demand or incompatible interval producing a selected architecture ID; sample count coupled to layer count; authority promotion
Explicit non-goals: choosing a replacement for 447; migrating or deleting v1 evidence; running a source, metric, star or experiment; changing QEI/GR equations; closing prediction_freeze; BMR-I/G3/physical/propulsion/transport authority
Downstream gate unlocked: ET0-B versioned-consumer migration work only; prediction_freeze remains blocked until the complete ET0 exit matrix closes

# ET0-A v2 architecture contract and authority-inventory work packet

Status date: September 1, 2026.

Status: **ET0-A VERIFIED; NO PRODUCTION ARCHITECTURE SELECTED; ET0-B
VERSIONED-CONSUMER MIGRATION REMAINS OPEN**.

Change classification: this packet authorizes a new diagnostic inventory,
versioned receipt/claim semantics and manufactured fixtures. It changes no GR
equation, selected boson-star input, P8P runtime authority, v1 artifact or
experimental authority.

## Authority and isolation

The canonical
[`NHM2 spherical-boson-star v2 work program`](./nhm2-spherical-boson-star-v2-work-program.md)
and active
[`P8P observer calibration packet`](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-observer-progress-turnaround-calibration.md)
remain authoritative for the only active program gate. This packet implements
only the first eligible row in the
[`source-to-experiment closure packet`](./nhm2-source-to-experiment-closure-parallel-work-packet-v1.md).

No file below `tools/nhm2-spherical-boson-star-v2-branch-proof/`, no P8P packet,
no candidate root, no cloud resource and no scientific execution surface is in
scope. ET0-A work earns no P8P, S5, BMR or G3 gate credit.

## Immutable v1 boundary

The following current source/test identities are frozen for this packet:

| Surface                                                      | SHA-256                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------ |
| `shared/contracts/nhm2-wall-source-layering-sweep.v1.ts`     | `485f1c745de36c564a21dcbb970cb2a752c51682ae52359bb6e5854fef7f1068` |
| `tools/nhm2/build-wall-source-layering-sweep.ts`             | `f82547f3a07f65558f0a524d235bbb5c759f022367a2038596db869dc486330e` |
| `shared/contracts/nhm2-layer-stack-mechanical-receipt.v1.ts` | `4359fd979cca46a0fa7ba3cf7c7f5727c72886034adeddb3b0587f620b47b57a` |
| `tests/nhm2-wall-source-layering-sweep.spec.ts`              | `b50f4c0aca61513b4012f81ea89bd39261d2378191b8854cd7d9b0a3508eaf03` |
| `tests/nhm2-layer-stack-mechanical-receipt.spec.ts`          | `421a6e802e89f70c4736c8b70aa740a66653e7b81a59d620aa4143e19ba83d6e` |

ET0-A adds v2 surfaces. It may not edit these files, replace their 447 literal,
reinterpret their fixed-control-volume result or represent v1 as a v2 result.
The existing v1 tests must still pass.

## Deterministic authority inventory

The inventory producer must scan promotion-relevant source, tests, research
documentation and UI/theory projections for exact 447 tokens and candidate/
receipt identifiers. It must:

1. use declared roots, extensions and exclusions;
2. exclude its own generated output and unrelated generated/vendor data;
3. record repository-relative path, one-based line and column, source-file
   SHA-256, bounded context, authority category and migration disposition;
4. distinguish scalar equivalence, architecture identity, geometry/thickness,
   mechanics/load, material/fatigue, source retention/scaling, regional sample
   sufficiency, test fixture, UI projection and historical/planning prose;
5. preserve v1 references while identifying where a future v2 consumer must
   require `architectureRef`; and
6. emit a deterministic digest over its scan policy and ordered occurrences.

The generated inventory is diagnostic evidence. Its digest does not prove the
scientific correctness of any occurrence and cannot authorize architecture
selection.

## Frozen v2 contract

The new contract version is `nhm2_layer_scaling_architecture/v2`. It must bind:

- separate content-addressed metric-required and source-realized tensors with
  distinct producers and no shared tensor artifact identity;
- an exact comparison frame: profile ID/hash, chart, basis, normalization,
  atlas and volume convention;
- one explicit source-state registry entry, including the state class and the
  references required by that class;
- one geometry identity and explicit fixed/expanded volume convention;
- scalar-equivalent, measured-effective, tensor-closure, mechanically
  admissible and source-retention layer intervals;
- a separately supplied geometric layer count;
- regional tensor sample sufficiency derived from convergence and uncertainty,
  explicitly uncoupled from geometric layer count;
- material, packing/orientation, coupling, active-area retention,
  support/control-energy, uncertainty and signed metric-demand-integral
  receipts; and
- the evidence authority mode for every receipt.

Permitted state classes are:

```text
static_unmodulated
instantaneous_driven
cycle_averaged_driven
differential_A_minus_B
```

`instantaneous_driven` requires a drive-model reference.
`cycle_averaged_driven` requires drive-model and averaging-window references.
`differential_A_minus_B` requires separately authenticated A and B state
references. A quality-factor multiplier cannot stand in for any of those
references.

## Frozen failure precedence

The evaluator must accumulate deterministic blockers and choose the first
status in this exact order:

1. `blocked_missing_receipt`;
2. `blocked_mutable_alias`;
3. `blocked_fallback_authority`;
4. `blocked_target_calibrated_authority`;
5. `blocked_metric_echo`;
6. `blocked_profile_stale`;
7. `blocked_state_stale`;
8. `blocked_geometry_stale`;
9. `blocked_degenerate_metric_demand`;
10. `blocked_sample_count_unbound`;
11. `no_compatible_interval`;
12. `architecture_reference_bound`.

`selectedArchitectureId` is `null` for every status except
`architecture_reference_bound`. Even in that terminal contract status,
physical, proposal, experiment, BMR-I, G3, propulsion and transport authority
remain false. The caller must supply the proposed architecture identity; the
evaluator may validate it but may not search for or invent a favorable count.

## Frozen fixture matrix

The manufactured tests must establish:

1. missing evidence fails closed with a null selected ID;
2. mutable `latest` aliases fail;
3. whitepaper/fallback authority fails;
4. `TARGET_CALIBRATED` authority fails;
5. shared metric/source tensor identity or producer fails as metric echo;
6. each comparison-frame mismatch fails as profile staleness;
7. wrong or under-specified source state fails as state staleness;
8. geometry/volume lineage mismatch fails as geometry staleness;
9. missing/nondegenerate metric-demand evidence fails;
10. sample sufficiency not derived independently from convergence fails;
11. disjoint admissible intervals return `no_compatible_interval`;
12. a complete manufactured input can bind its predeclared architecture ID
    while every higher authority remains false;
13. the complete fixture uses a regional sample minimum different from its
    geometric layer count; and
14. the frozen v1 source identities and existing v1 fixtures remain unchanged.

## ET0-A completion and remaining ET0 work

ET0-A closes only when the inventory, contract, tests and verification evidence
exist. It does not close the parent ET0 row. ET0-B must subsequently introduce
versioned v2 consumers that require `architectureRef` instead of ambient
candidate IDs/counts, while continuing to preserve every v1 surface. Only after
that consumer migration and the full ET0 regression matrix pass may the parent
packet mark `prediction_freeze` eligible.

## ET0-A verification result

The bounded implementation is complete:

- the deterministic authority inventory is published at
  [`nhm2-et0-447-authority-inventory.v1.json`](./nhm2-et0-447-authority-inventory.v1.json)
  with its scan policy, source-file hashes, occurrence classifications,
  dispositions and self-digest;
- the v2 architecture contract audits every supplied evidence reference,
  enforces the frozen failure precedence and binds only a caller-declared
  manufactured architecture reference after all checks pass;
- the adversarial contract, inventory freshness and frozen-v1 regression
  fixtures pass;
- the scoped TypeScript compilation passes;
- math-stage validation passes with 323 entries;
- all 18 WARP-required files pass with 179 tests;
- physics root-to-leaf validation exits cleanly; and
- Casimir adapter verification returns `PASS`, certificate status `GREEN`,
  integrity `OK`, and certificate SHA-256
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.

The first ordinary repository-wide typecheck attempt exhausted Node's default
heap. A larger-heap retry produced no diagnostics but was stopped after an
impractically long run in the concurrently dirty worktree. This is not reported
as a full-project typecheck pass; the four ET0 implementation/test files were
instead compiled together successfully under the repository's strict compiler
settings.

This evidence closes ET0-A only. It grants no P8P progress, selected-candidate
credit, production architecture, experiment authority, physical viability,
proposal readiness, BMR-I eligibility or G3 eligibility.
