# Warp Geometry Congruence Synthesis

Status: draft
Owner: dan
Sources: `docs/warp-geometry-comparison.md`, `docs/warp-geometry-congruence-report.md`, `docs/warp-geometry-congruence-state-of-the-art.md`

## Purpose
Provide a single, equation-anchored synthesis of the three warp geometry documents. This report consolidates the main findings, lists explicit assumptions tied to mathematical definitions, and enumerates open questions with their math anchors and congruence impacts.

## Scope
Alcubierre (1994), Natario (2002), Van Den Broeck (1999), and current repo guardrails and pipeline proxies. Needle Hull Mk1 citation trace is provided in `docs/needle-hull-citation-trace.md` (unverified; provenance only).

## Canonical Definitions (Math Anchors)
These anchors are referenced in the assumptions and open-questions tables.

**C1. 3+1 Line Element (ADM Form)**
```text
ds^2 = -(alpha^2 - beta_i beta^i) dt^2 + 2 beta_i dx^i dt + gamma_ij dx^i dx^j
```

**C2. Extrinsic Curvature (ADM Definition)**
```text
K_ij = (1 / (2 alpha)) (D_i beta_j + D_j beta_i - d_t gamma_ij)
```

**C3. Stationary Slice Reduction (if d_t gamma_ij = 0)**
```text
K_ij = (1 / (2 alpha)) (D_i beta_j + D_j beta_i)
```

**C4. Eulerian Observer**
```text
n^a = (1/alpha) (1, -beta^i)
rho_E = T_ab n^a n^b
```

**C5. Implementation Expansion Scalar**
```text
theta_beta = D_i beta^i
```
Note: authors define theta differently (for example, Alcubierre uses -Tr(K)).

## Consolidated Findings

### Metric-Level Alignment
Alcubierre and Natario Example 1.8 are identical 4-metrics in the same chart when X^x = v_s f(r_s) and X^y = X^z = 0, with the mapping beta = -X. This makes CL0-CL3 congruence affirmative in the shared ADM slicing.

Natario zero-expansion is intentionally not congruent to Alcubierre at CL1-CL3 because div X is forced to zero everywhere while Alcubierre has nonzero expansion on the wall.

Van Den Broeck is only congruent to Alcubierre where B(r) = 1. Where B varies, the spatial metric is conformally scaled and region II carries stress-energy tied to B' and B'', so CL1-CL3 diverge.

### Slicing and Chart Dependence
ADM fields and derived scalars are slicing-dependent. CL0 should be judged by author-stated diffeomorphisms or 4D scalar invariants, not by theta or K_ij. This motivates keeping CL0 separate from CL1-CL3 in every verdict table.

### Guardrails vs Geometry
The repo guardrails still rely on proxy inputs in many places, but ThetaAudit now prefers metric-adapter divergence (D_i beta^i) when available, with pipeline thetaCal retained as a labeled fallback. The Natario stress-energy mapping remains an inverse proxy (Casimir energy to T00_avg) rather than a forward Einstein-constraint derivation from a metric. The VdB scalar gammaVdB still does not capture B' or B'' terms in region II.

### Needle Hull Mk1 Trace
The congruence report contains two traces for Needle Hull Mk1.
The submitted baseline is preserved verbatim as a framework to compare against.
The repo-calculated trace is the authoritative default, and it introduces a gammaVdB clamp derived from wall thickness and minRadius. This clamp materially changes T00_avg and the curvature proxy K, so pipeline congruence must account for it explicitly.

## Congruence Ladder (CL0-CL4) Summary
CL0 is 4-metric equivalence and is not falsified by theta or K_ij.
CL1 is ADM equivalence in a fixed slicing.
CL2 is derived-geometry equivalence (theta_beta, K_ij, Tr(K), K_ij K^ij).
CL3 is stress-energy equivalence (Eulerian rho_E at minimum).
CL4 is guardrail congruence (repo constraints must use geometry-derived quantities, not proxies).

## Assumption Registry (Math-Anchored)
The table lists the assumptions that underpin the three documents and connects each to a math anchor.

| Id | Assumption | Math Anchor | Scope | Congruence Impact | Source |
| --- | --- | --- | --- | --- | --- |
| A1 | Use ADM 3+1 split to define alpha, beta, gamma for all metrics. | C1 | All metrics | Enables CL1-CL3 comparisons. | comparison, congruence report |
| A2 | Use theta_beta = D_i beta^i for implementation comparisons. | C5 | All metrics | Forces explicit sign tracking vs author theta. | comparison, congruence report |
| A3 | Treat Alcubierre and Natario spatial slices as flat (gamma_ij = delta_ij). | C1 | Alcubierre, Natario | Simplifies D_i to partial_i in theta_beta and K_ij. | comparison |
| A4 | Van Den Broeck uses gamma_ij = B^2(r) delta_ij in region II. | C1 | Van Den Broeck | Requires B' and B'' terms in theta_beta and rho_E. | comparison |
| A5 | Use comoving coordinates when needed so d_t gamma_ij = 0. | C2, C3 | Natario, VdB | Avoids inconsistent K_ij if r_s depends on t. | congruence report |
| A6 | Natario zero-expansion f(r) is defined only by boundary behavior. | C5 | Natario zero-expansion | No canonical sigma; mapping is a modeling choice. | comparison, congruence report |
| A7 | Van Den Broeck f(r) has only property constraints; no closed form. | C1 | Van Den Broeck | Substituting Alcubierre f is extra modeling. | comparison |
| A8 | Casimir pipeline is treated as solved; T00_avg is used as a proxy for rho_E. | C4 | Repo pipeline | Blocks CL3 unless constraints are solved. | congruence report |
| A9 | ThetaAudit prefers metric-adapter divergence (D_i beta^i) when available; proxy fallback remains. | C5 | Repo guardrails | Conditional CL4 (depends on metric adapter coverage). | congruence report, state-of-art |
| A10 | CL0 requires author-stated diffeo or invariant checks. | C1 | All comparisons | Prevents misuse of theta or K_ij at CL0. | state-of-art |

## Open Questions (Math-Anchored)
These are the unresolved items needed for full CL4 alignment.

| Id | Open Question | Math Anchor | Impacted CL | Resolution Path |
| --- | --- | --- | --- | --- |
| Q1 | Verify Needle Hull Mk1 citation trace and decide which bindings (if any) become runtime-authoritative. | C1-C5 | CL4 | Map each guardrail input to a paper equation or mark proxy-only. |
| Q2 | Confirm the sigma-to-wall-thickness mapping equation and equation number. | C5 | CL2-CL3 | Verify against Pfenning and Ford, or downgrade to operational definition. |
| Q3 | Provide explicit chart choices for each metric when comparing K_ij. | C2, C3 | CL1-CL2 | Publish the chosen slicing and show d_t gamma_ij handling. |
| Q4 | Define the explicit X field used when Natario mapping is claimed. | C5 | CL2-CL3 | Compute K_ij and rho_E from X rather than pipeline proxies. |
| Q5 | Define a concrete B(r) profile if VdB region II is claimed. | C1 | CL2-CL3 | Compute B' and B'' and compare to region II rho_E. |

## Missing Equation Flags (Source Gaps)
Van Den Broeck does not provide explicit ADM K_ij or theta in the paper for the full gamma_ij = B^2 delta_ij case.
Natario zero-expansion does not define a canonical sigma parameter for f(r).

## Proxy vs Geometry Map (Summary)
ThetaAudit is a pipeline proxy scalar, not a geometric expansion scalar.
Natario stress-energy mapping is an inverse proxy (Casimir energy to T00_avg) and does not enforce the Hamiltonian constraint.
gammaVdB is a scalar stand-in for a full B(r) profile and misses region II derivative structure.

## CL4 Trace Map Anchor
The source-to-guardrail CL4 trace map (including equation-chain requirements back to (alpha, beta, gamma_ij) and primary-source citations) is maintained in `docs/warp-geometry-cl4-guardrail-map.md`. The machine-readable mirror lives at `docs/warp-geometry-cl4-guardrail-map.json` for tooling and deterministic walks.


## Evaluation Readiness
The comparison and congruence documents are internally aligned and provide a falsifiable framework for CL1-CL3 checks.
CL4 remains incomplete until citation-trace bindings are verified and proxy guardrails are mapped to explicit geometric definitions.

## Proposal Requirements (for GPT-Pro)
These requirements should be satisfied by any proposal that claims to bridge the CL gaps.

1. Provide a metric-adapter spec per paper, including inputs, declared chart, and outputs alpha, beta^i, gamma_ij.
2. Provide a constraint-solve path that evaluates Hamiltonian and momentum residuals with explicit pass thresholds.
3. Provide a Van Den Broeck region II implementation plan that models B(r) and its derivatives (B', B'') explicitly.
4. Provide a Natario mapping plan that starts from X, derives K_ij and theta, then computes rho_E (not inverse mapping from T00).
5. Map each proposed change to the CL level it closes, and explain which open question it resolves.

## Acceptance Criteria (for proposal validation)
1. CL1-CL3 consistency for Alcubierre and Natario Example 1.8 in a declared chart.
2. CL2 visibility of VdB region II effects via B' and B'' (not a scalar proxy).
3. CL4 pass for guardrails once proxy scalars are either renamed or replaced with geometry-derived quantities.

## Action Path (Short)
1. Verify Needle Hull Mk1 citation trace and map guardrails to equations.
2. Fix or qualify sigma-to-thickness mapping with a cited equation number.
3. Publish explicit chart/slicing for each metric adapter.
4. Replace proxy guardrails with geometry-derived quantities or rename them as proxies.

## Task Plan Link
The methods-layer phases M0–M5 are defined in `docs/warp-tree-dag-task.md`. Use that plan as the build sequence for closing CL0–CL4 gaps and tracking acceptance criteria.

## Methods Artifacts (M0–M5)
- M0 CL0 methods: `docs/warp-geometry-cl0-methods.md`
- M1 chart contract: `docs/warp-geometry-cl1-cl2-chart-contract.md`
- M2 constraint-first path: `docs/warp-geometry-cl3-constraint-first-path.md`
- M3 guardrail map: `docs/warp-geometry-cl4-guardrail-map.md`
- M4 VdB region II method: `docs/warp-geometry-vdb-region-ii-method.md`
- M5 sigma-to-Delta policy: `docs/warp-geometry-sigma-delta-policy.md`

## Methods Bundle
Use `docs/warp-geometry-methods-bundle.md` as the canonical index for M0–M5 artifacts, task plan, and synthesis cross-links.

