# Warp Geometry CL0 Methods (M0)

Status: draft  
Owner: dan  
Scope: CL0 equivalence methods for warp metric pairs

## Purpose
Document the CL0 method choice per metric pair, with explicit falsifiers and a policy note that CL0 is never judged by slicing-dependent quantities (theta, K_ij).

## CL0 Policy Note
CL0 is 4-metric equivalence. It must not be judged by theta, K_ij, or any slicing-dependent quantity. CL0 is satisfied only by author-stated diffeomorphisms or by invariant-equivalence methods.

## Metric Pair CL0 Methods

| Pair | CL0 Method | Evidence Anchor | CL0 Falsifier |
| --- | --- | --- | --- |
| Alcubierre (1994) vs Natario Example 1.8 | Author-stated substitution of Natario Def. 1.1 with X^x = v_s f(r_s), X^y = X^z = 0 | `docs/warp-geometry-congruence-report.md` §6.1, `docs/warp-geometry-comparison.md` A5/N1 | If the substitution does not reproduce the same g_mu_nu components, CL0 fails. |
| Alcubierre (1994) vs Natario zero-expansion | Invariant comparison only; CL0 not established by direct diffeo | `docs/warp-geometry-congruence-state-of-the-art.md` CL0 notes | If scalar invariants (R, R_ab R^ab, Kretschmann) differ at matched points, CL0 fails. |
| Alcubierre (1994) vs Van Den Broeck (global) | Piecewise: explicit equivalence only where B = 1, invariant comparison elsewhere | `docs/warp-geometry-congruence-state-of-the-art.md` VdB notes | If B != 1, gamma_ij differs and invariants must be checked; invariant mismatch fails CL0. |
| Alcubierre (1994) vs Van Den Broeck (B=1 region) | Explicit reduction with B = 1 | `docs/warp-geometry-comparison.md` V4-V7 | If B != 1 or f does not match, CL0 fails. |
| Natario class vs Van Den Broeck region II | Invariant comparison only; CL0 not established | `docs/warp-geometry-congruence-state-of-the-art.md` VdB vs Natario | If scalar invariants differ at matched points, CL0 fails. |

## CL0 Falsifier Checklist (Coordinate-Invariant)
Use this checklist when no author-stated diffeo is available.

- Compare scalar invariants R, R_ab R^ab, and R_abcd R^abcd at matched spacetime points.
- Evaluate invariants at representative wall points (front, back, equator) and interior/exterior points.
- If any invariant differs beyond numerical tolerance, CL0 is NO.
- If invariants match, CL0 remains not disproven but still requires an explicit diffeo to claim YES.

## Artifacts
- CL0 policy note and method choices are referenced by Phase M0 in `docs/warp-tree-dag-task.md`.
