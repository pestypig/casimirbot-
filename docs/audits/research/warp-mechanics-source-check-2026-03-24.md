# Warp Mechanics Source Check

Date: 2026-03-24

Scope:
- review the `warp-mechanics` knowledge tree against the Needle Hull Mark 2 source-of-record research pack
- confirm where primary warp-family definitions map cleanly to local nodes
- separate direct literature anchors from repo-only proxy/control constructs so paper binding stays fail-closed

## Source base used

Primary repo anchors:
- `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.md`
- `docs/audits/research/warp-primary-standards-citation-pack-2026-03-04.md`
- `docs/audits/research/warp-full-solve-reference-capsule-latest.md`

Primary source refs used from the Needle Hull Mark 2 citation pack:
- `SRC-071` Alcubierre (1994), Class. Quantum Grav. 11, L73-L77
- `SRC-072` Natario (2002), Class. Quantum Grav. 19, 1157-1165
- `SRC-073` Van Den Broeck (1999), Class. Quantum Grav. 16, 3973-3979
- `SRC-051` Ford and Roman (1995), Phys. Rev. D 51, 4277
- `SRC-052` Fewster and Eveson (1998), Phys. Rev. D 58, 084010

## Source-backed node checks

1. `alcubierre-metric`
- local anchor: `docs/knowledge/warp/alcubierre-metric.md`
- source check:
  - Alcubierre (1994)
  - https://doi.org/10.1088/0264-9381/11/5/001
- review result:
  - node placement in the geometry branch is correct
  - the local definition is congruent when treated as a family reference anchor, not as a claim that the repo directly implements the original metric unchanged

2. `natario-zero-expansion`
- local anchor: `docs/knowledge/warp/natario-zero-expansion.md`
- source check:
  - Natario (2002)
  - https://doi.org/10.1088/0264-9381/19/6/308
- review result:
  - node placement in the geometry branch is correct
  - the local definition is congruent when it distinguishes the idealized zero-expansion construction from the repo's numerical diagnostics and Needle Hull family overlays

3. `shift-vector-expansion-scalar`
- local anchor: `docs/knowledge/warp/shift-vector-expansion-scalar.md`
- source check:
  - Natario (2002)
  - https://doi.org/10.1088/0264-9381/19/6/308
- review result:
  - node placement in the geometry branch is correct
  - the local definition is congruent when tied to ADM/shift-vector kinematics and the divergence/expansion-control semantics of the Natario-family construction

4. `vdb-compression-factor`
- local anchor: `docs/knowledge/warp/vdb-compression-factor.md`
- source check:
  - Van Den Broeck (1999)
  - https://doi.org/10.1088/0264-9381/16/12/314
- review result:
  - node placement in the geometry branch is correct
  - the local definition is congruent when treated as a Van Den Broeck-family geometry-compression reference, while `gamma_VdB` itself remains a repo parameterization choice

5. `ford-roman-proxy`
- local anchor: `docs/knowledge/warp/ford-roman-proxy.md`
- source check:
  - Ford and Roman (1995)
  - https://doi.org/10.1103/PhysRevD.51.4277
  - Fewster and Eveson (1998)
  - https://doi.org/10.1103/PhysRevD.58.084010
- review result:
  - node placement near the proxy/guardrail lane is directionally correct
  - the node must remain labeled as a proxy rather than a direct theorem-definition node, because the repo computes an operational guardrail indicator rather than reproducing the exact theorem object

6. `warp-bubble`
- local anchor: `docs/knowledge/warp/warp-bubble.md`
- source check:
  - Alcubierre (1994)
  - Natario (2002)
- review result:
  - node placement as a top-level family concept is acceptable
  - the local definition is repo-composite, not paper-identical; it should therefore stay a local umbrella concept rather than being bound as if it were a single-source theorem definition

## DAG + tree effect

Positive effects:
- the representative warp-family anchors now have explicit source-backed local definitions
- geometry-family terms are cleaner to bind than before because Alcubierre, Natario, Van Den Broeck, and Ford-Roman/QI semantics are no longer left as uncited broad concepts
- the audit makes a sharper distinction between primary geometry sources and repo-side proxy/control surfaces

Current limits:
- the representative geometry-family anchors have been upgraded to definition-level nodes, but most of `docs/knowledge/warp/warp-mechanics-tree.json` is still concept-directory structure rather than definition/equation nodes
- overlap binding remains weakest where repo control terms (`active-fraction`, `sector-strobes-duty-cycle`, `power-mass-ladders`, `bubble-wall-thickness`) mix local operational semantics with literature-facing names
- `ford-roman-proxy` is operationally useful but should not be upgraded to theorem-equivalent binding without explicit equation/falsifier wiring

## Protocol note

For Tree + DAG protocol purposes:
- `alcubierre-metric`, `natario-zero-expansion`, `shift-vector-expansion-scalar`, and `vdb-compression-factor` should be treated as source-backed family definition anchors
- `ford-roman-proxy` should be treated as a derived/proxy guardrail node
- `warp-bubble` should remain a repo umbrella concept unless decomposed into source-backed subdefinitions
- claim-tier promotion should stay blocked until warp-family definitions are paired with explicit equation bindings, derivation order, and falsifier contracts
