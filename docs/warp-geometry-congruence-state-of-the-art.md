# Warp Geometry Congruence - State of the Art

Status: draft
Owner: dan
Scope: Alcubierre (1994), Natario (2002), Van Den Broeck (1999), repo pipeline and guardrails

## Purpose
Close the congruence evaluation into a state-of-the-art snapshot: what is mathematically aligned, what is only conditionally aligned, and what is still proxy-only. This report is equation-first and builds on the details in `docs/warp-geometry-comparison.md` and `docs/warp-geometry-congruence-report.md`.

**Congruence Audit:** see `docs/warp-congruence-audit.md` for the current CL0–CL4 status across traversal, backend pipelines, and UI surfaces.

## Inputs
- Primary papers: Alcubierre (1994), Natario (2002), Van Den Broeck (1999).
- Repo congruence report and Needle Hull Mk1 pipeline trace in `docs/warp-geometry-congruence-report.md`.
- Needle Hull Mk1 citation trace provided in `docs/needle-hull-citation-trace.md` (status: provided_unverified; provenance only).
- Primary-source addendum for 3+1 slicing dependence, constraint equations, and sigma to wall-thickness mapping (see below).

## Needle Hull runtime solve status (repo)
Current runtime status for Needle Hull solve evaluation:
- Canonical runtime family is `natario` (comoving_cartesian, Eulerian observer, SI stress
  normalization). `Alcubierre` remains supported as a secondary contract for audit runs.
- Strict hard decisioning uses canonical metric stress sources (`warp.metricT00`) on active
  warp-family paths, with explicit source refs and chart/family provenance.
- Hard guardrails now enforce contract authority metadata for metric stress sources
  (observer, normalization, unit system, contract status/reason).
- Theta hard checks consume metric divergence diagnostics (`theta_geom`) when adapter evidence
  is present; proxy theta remains explicitly non-authoritative fallback.
- VdB strict paths require derivative evidence (`B'`, `B''`, two-wall support) when
  `gammaVdB > 1`.
- Remaining gap for full closure: universal derivative-rich and constraint-closed coverage
  across every active chart/surface path is not complete yet.

See:
- `docs/warp-geometry-congruence-report.md` (Needle Hull runtime section)
- `docs/warp-geometry-cl4-guardrail-map.md`
- `docs/warp-congruence-audit.md`
- `docs/needle-hull-mismatch-audit.md`
- `docs/warp-congruence-figure-review.md`
- `docs/warp-literature-runtime-gap-analysis.md`
- `docs/warp-canonical-runtime-overview.md`

## Primary-Source Addendum (for CL0-CL4 justification)
Use these sources to cite claims about slicing dependence, constraint equations, and sigma-to-wall mapping. Where a paper does not provide an equation (notably Van Den Broeck ADM-level K_ij or theta), this report flags it explicitly rather than inferring beyond standard 3+1 identities.

- Gourgoulhon (2007) 3+1 formalism lecture notes: lapse and shift encode coordinate freedom; constraints are slicing-dependent. [1]
- Baumgarte and Shapiro (1998) ADM/BSSN formulation: constraint equations with matter projections and constraint monitoring. [2]
- ADM original (Arnowitt, Deser, Misner; reprint): canonical 3+1 reference. [3]
- Pfenning and Ford (1997): explicit sigma-to-wall-thickness mapping and large-sigma limit. [4]
- Ford and Roman (1994/1995): quantum inequality sampling and duration-magnitude constraints (optional for CL4 language). [5]
- Fewster (2004): caveat on the usual QI assumption (optional for CL4 language). [6]

## Congruence Ladder (CL0-CL4)
Use a layered verdict instead of a single yes/no. ADM fields are slicing-dependent, so full congruence is evaluated in stages.

1. CL0: 4-metric equivalence. Same g_mu_nu up to an author-stated coordinate transform.
2. CL1: ADM equivalence in a fixed slicing. Same (alpha, beta^i, gamma_ij) in the chosen t=const foliation.
3. CL2: Derived geometry equivalence. Same theta_beta, K_ij, Tr(K), K_ij K^ij.
4. CL3: Stress-energy equivalence. Same T_mu_nu (or at least Eulerian rho_E).
5. CL4: Guardrail congruence. Repo constraints judge geometry-derived quantities, not proxies with similar names.

CL0 note (required): CL0 cannot be falsified using theta, K, or div(beta) because these are foliation-dependent objects in the 3+1 split; lapse and shift represent coordinate freedom and can be altered without changing the underlying 4-geometry. Therefore CL0 should be marked YES only when an author-stated diffeomorphism is given, or when 4D scalar invariants are shown to match or mismatch numerically. [1]

CL0 falsifiable check (coordinate-invariant): compare scalar invariants such as R, R_ab R^ab, and R_abcd R^abcd (Kretschmann) at matched spacetime points (for example, wall midpoints). If any scalar differs beyond numerical error, CL0 is NO. If they match, CL0 is not disproven but still requires an explicit diffeo to claim YES.

## Cited Judgement Pack (closing the main congruence gaps)

### Gap A: CL0 must not be disproved using theta or K
ADM fields and derived scalars are slicing-dependent; they are not coordinate invariants. Use 4D scalar invariants or an author-stated diffeo for CL0. [1]

### Gap B: T00 assignment does not imply a Natario or Alcubierre metric solves Einstein's equation
In 3+1 GR, initial data (gamma_ij, K_ij) and matter sources are linked by the Hamiltonian and momentum constraints. Natario gives a closed-form identity for rho_E in his flat-slice class, making rho_E a derived quantity from X (or beta) rather than an independent input. [1][7]

Patch language (drop-in):
Assigning a pipeline T00 does not by itself establish a Natario or Alcubierre geometry unless the Hamiltonian and momentum constraints are satisfied by the same (gamma_ij, K_ij) that the metric implies. For Natario's flat-slice class, rho_E is determined by theta and K_ij; it is not freely specifiable if geometry congruence is claimed. [1][7]

### Gap C: Van Den Broeck is explicitly a two-region support geometry
Van Den Broeck labels region II (where B varies) and region IV (where f varies) and states spacetime is flat outside the shaded regions. He gives region II Eulerian energy density in terms of B' and B''. Any implementation that reduces B(r) to a single scalar cannot be CL2 or CL3 congruent to region II stress-energy. [8]

### Gap D: Shift can vanish in comoving coordinates
Van Den Broeck introduces a comoving coordinate x' = x - v_s t so that in region II the metric is diagonal diag(-1, B^2, B^2, B^2), showing ADM fields (especially beta) are chart-dependent even when the 4-metric is the same. [8]

## Theory-to-Theory Congruence

### Alcubierre (1994) vs Natario (2002) Example 1.8
Verdict:
- CL0: YES
- CL1: YES (with beta = -X)
- CL2: YES
- CL3: YES (Eulerian rho_E matches)
- CL4: N/A

Why it matches:
- Natario Def. 1.1 becomes Alcubierre when X^x = v_s f(r_s) and X^y = X^z = 0. [7][9]
- The energy density expressions coincide algebraically (wall-localized negative rho_E). [7][9]
- Sign conventions differ, but the metric and derived invariants are the same after mapping beta = -X. [7][9]

### Natario zero-expansion vs Alcubierre (1994)
Verdict:
- CL0: NOT ESTABLISHED (no invariant comparison provided)
- CL1: NO (in the shared flat-slice chart)
- CL2: NO (theta signature differs)
- CL3: NO
- CL4: N/A

Why it breaks (in the shared flat-slice chart):
Natario zero-expansion enforces div X = 0 everywhere; Alcubierre has nonzero expansion on the wall. This is a one-line falsifier at CL1 or CL2: compute theta or D_i beta^i and compare. [7][9]

### Van Den Broeck (1999) vs Alcubierre (1994)
Verdict (global):
- CL0: NOT ESTABLISHED (except where B = 1, where the metrics coincide explicitly)
- CL1: PARTIAL
- CL2: PARTIAL
- CL3: PARTIAL
- CL4: N/A

Precise statement:
- Congruent wherever B(r_s) = 1, regardless of region labeling. This includes the region where f varies as well as the outer region. [8]
- Not congruent where B != 1 in the ADM sense because gamma_ij is conformally scaled and region II carries stress-energy tied to B' and B''. [8]

Chart nuance:
In comoving coordinates (x' = x - v_s t), the shift can vanish in region II. ADM fields change with slicing even if the 4-metric is the same. This is why CL0 can pass while CL1 and CL2 are chart-dependent. [8]

### Van Den Broeck (1999) vs Natario (2002) class
Verdict:
- CL0: NOT ESTABLISHED (no invariant comparison provided)
- CL1: NO
- CL2: NO
- CL3: NO
- CL4: N/A

Why it breaks (in the Natario flat-slice chart):
Natario's class uses flat spatial slices (gamma_ij = delta_ij). Van Den Broeck's defining change is gamma_ij = B^2(r_s) delta_ij in region II. [7][8]

## Theory-to-Repo Congruence (current state)

### CL4 Source -> Guardrail Trace Map (primary sources)
CL4 geometry-derived guardrails must be traceable through a full equation chain back to (alpha, beta, gamma_ij) in a declared chart. The minimum chain is:

1. ADM kinematics: express the metric in ADM form and relate d_t gamma_ij to K_ij (with the chart-declared meaning of d/dt). [1][2]
2. Constraints: use Hamiltonian and momentum constraints to link (gamma_ij, K_ij) to matter projections (rho, S_i, S_ij). [1][2]
3. Warp-paper specializations: use paper-defined theta, K_ij, or rho_E (Alcubierre, Natario, VdB) to close the chain. [7][8][9]

Guardrails that do not follow one of these complete chains are proxy-only at CL4. The full source-to-guardrail trace map is maintained in `docs/warp-geometry-cl4-guardrail-map.md`.

Observer and normalization contract:
Guardrail inputs that depend on T_ab must specify the observer (u^a) and normalization conventions (8 pi placement). Eulerian n^a is the default for constraint-derived rho, while VdB uses an orthonormal frame in region II. Treat any mismatch in observer or normalization as a CL4 failure until reconciled. [1][7][8]

Machine-readable snapshot:
The current trace map is mirrored in `docs/warp-geometry-cl4-guardrail-map.json` for tooling.

### ThetaAudit vs paper expansion scalars
Verdict:
- CL4: PARTIAL (geometry-derived when metric adapter is present)

Reason:
- ThetaAudit now prefers metric-adapter divergence (D_i beta^i) when available, which aligns with the paper expansion scalars for flat-slice metrics.
- The pipeline thetaCal product (gammaGeo^3 * qSpoil * gammaVdB * d_eff) remains as a labeled proxy fallback and still does not depend on wall thickness or spatial derivatives.

Cited basis:
- In 3+1 GR, K_ij and theta depend on spatial derivatives of beta (and possibly partial_t gamma_ij), not just a scalar budget. [1][2]
- Natario defines expansion as div X. [7]
- Alcubierre defines expansion via Tr(K). [9]

Action:
Ensure metric adapter diagnostics cover all warp families/charts (VdB B(r) pending), and keep thetaProxy explicitly labeled for any proxy fallback.

### Natario stress-energy mapping vs Natario GR identity
Verdict:
- CL3: NOT ESTABLISHED
- CL4: NO

Reason:
- Natario's identity is a forward GR relation: choose X, compute K_ij and theta, then derive rho_E. [7]
- The pipeline currently applies Casimir energy to define T00_avg and then derives a curvature proxy, which does not guarantee the Hamiltonian constraint is satisfied by any Natario metric. [1][2]

Action:
Construct X or beta fields, compute K_ij and theta from ADM, then compute rho_E from the constraint equations. Only then compare to pipeline-imposed T00_avg.

### Van Den Broeck gammaVdB scalar vs region II geometry
Verdict:
- CL1: PARTIAL (region I scale only)
- CL2: PARTIAL (derivative diagnostics available)
- CL3: NO
- CL4: PARTIAL (guardrail uses two-wall support when available)

Reason:
Van Den Broeck region II energy density depends on B', B'', and (1/r) B'. A single scalar gammaVdB cannot reproduce that structure, so derivative diagnostics are now required to claim partial CL2/CL4 alignment. [8]

Action:
Ensure B(r) derivatives are computed and used in guardrails; full CL3 still requires metric-adapter fields tied to the same B(r) profile.

## Sigma to Wall Thickness Mapping (cited)
Pfenning and Ford interpret Alcubierre's sigma as a wall-thickness control parameter and define a piecewise-continuous profile with wall thickness Delta. Matching slopes at r_s = R yields:

```text
Delta = ((1 + tanh^2(sigma R))^2) / (2 sigma tanh(sigma R))
```

In the large sigma R limit, Delta is approximately 2 / sigma. [4]

Use this mapping when you need a paper-citable sigma-to-thickness conversion rather than an operational definition.

## Missing Equation Flags (retain)

Van Den Broeck (1999):
- Missing in-source: explicit ADM K_ij for the full gamma_ij = B^2 delta_ij case, and any explicit theta expression in ADM variables.
- Present in-source: metric, region structure, B piecewise definition, shift and lapse statement, and region II Eulerian energy density T^{hat0 hat0}. [8]

Natario zero-expansion family:
- Missing in-source: any canonical sigma parameterization for the divergence-free f(r). Only boundary behavior is imposed. [7]

## Full Congruence Verdict Table (revised CL0 language)
Legend: YES, PARTIAL, NO, N/A, UNKNOWN, NOT ESTABLISHED

| Pair / Component | CL0 4-metric | CL1 ADM fields | CL2 derived geometry | CL3 rho_E | CL4 guardrails |
| --- | --- | --- | --- | --- | --- |
| Alcubierre vs Natario Example 1.8 | YES | YES | YES | YES | N/A |
| Alcubierre vs Natario zero-expansion | NOT ESTABLISHED | NO | NO | NO | N/A |
| Alcubierre vs Van Den Broeck (global) | NOT ESTABLISHED | PARTIAL | PARTIAL | PARTIAL | N/A |
| Alcubierre vs Van Den Broeck (B=1 region) | YES | YES | YES | YES | N/A |
| Natario class vs Van Den Broeck region II | NOT ESTABLISHED | NO | NO | NO | N/A |
| Repo ThetaAudit vs paper expansion | NOT ESTABLISHED | PARTIAL | PARTIAL | N/A | PARTIAL |
| Repo Natario mapping vs Natario GR identity | UNKNOWN | UNKNOWN | UNKNOWN | NO | NO |
| Repo gammaVdB scalar vs VdB region II | UNKNOWN | PARTIAL | PARTIAL | NO | PARTIAL |

## Actionable Checklist to Close Remaining Gaps
1. Define a canonical metric adapter for each paper that outputs alpha(x), beta^i(x), gamma_ij(x) and a declared chart name.
2. Compute K_ij and theta_beta from ADM (C2), then compute rho_E from the constraint equations. Do not substitute pipeline gains.
3. Separate proxy guardrails from geometry guardrails. Use names that signal proxy status.
4. Implement B(r) for Van Den Broeck as a function with derivatives, not a single scalar.
5. Use the GR constraint gate to validate that rho_E and K_ij satisfy the Hamiltonian constraint for the chosen metric fields. [1][2]

## Harmony Summary (current state)
- Alcubierre 1994 and Natario 2002 Example 1.8 are fully congruent at CL0-CL3.
- Natario zero-expansion is intentionally not congruent to Alcubierre at CL1-CL3 (different invariant signature in the shared flat-slice chart).
- Van Den Broeck is congruent to Alcubierre only where B(r) = 1. Elsewhere it is a different spatial geometry by construction.
- Repo guardrails are mixed: strict hard-decision paths now enforce metric/contract authority on active runtime families, while some runtime/brick paths remain proxy-backed and universal chart/surface closure is still open.

## Evaluation Readiness
The congruence stack is ready to evaluate. Runtime Needle Hull solve status is now explicit and auditable from repo evidence. The remaining missing input for a complete external source-mapped audit is verification of the provided Needle Hull Mk1 citation trace; once verified, each guardrail and pipeline parameter can be linked to a specific paper equation or marked proxy-only with citation-level traceability.

## Needle Hull Citation Binding Checklist
When the Needle Hull citation trace is verified and promoted, bind it in this order:
1. Bind `warp.metricT00` refs (`warp.metric.T00.*`) to source equations for rho_E or equivalent stress projections in a declared chart.
2. Bind observer + normalization contracts (`metricT00Observer`, `metricT00Normalization`, `metricT00UnitSystem`) to cited conventions.
3. Bind `theta_geom` to source expansion definition (`D_i beta^i`, `-Tr(K)`, or equivalent).
4. Mark any remaining runtime signal as either:
   - geometry-derived with equation chain, or
   - proxy-only with explicit non-congruent label.
5. Re-evaluate CL3/CL4 rows after citation binding and update `docs/warp-geometry-cl4-guardrail-map.md` and `.json`.

Provided mapping:
- `docs/needle-hull-citation-trace.md` (normalized table + JSON; unverified)

## Copyable URLs (primary sources)
```text
Gourgoulhon (3+1 formalism): https://arxiv.org/pdf/gr-qc/0703035
Baumgarte & Shapiro (ADM/BSSN): https://arxiv.org/pdf/gr-qc/9810065
ADM (Dynamics of GR): https://arxiv.org/abs/gr-qc/0405109
Pfenning & Ford (warp wall thickness): https://arxiv.org/pdf/gr-qc/9702026
Ford & Roman (QI sampling): https://arxiv.org/pdf/gr-qc/9410043
Fewster (usual assumption): https://arxiv.org/pdf/gr-qc/0411114
Natario (zero expansion): https://arxiv.org/pdf/gr-qc/0110086
Van Den Broeck (energy density): https://arxiv.org/pdf/gr-qc/9905084
Alcubierre (warp metric): https://arxiv.org/pdf/gr-qc/0009013
```

[1]: https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf
[2]: https://arxiv.org/pdf/gr-qc/9810065
[3]: https://arxiv.org/abs/gr-qc/0405109
[4]: https://arxiv.org/pdf/gr-qc/9702026
[5]: https://arxiv.org/pdf/gr-qc/9410043
[6]: https://arxiv.org/pdf/gr-qc/0411114
[7]: https://arxiv.org/pdf/gr-qc/0110086
[8]: https://arxiv.org/pdf/gr-qc/9905084
[9]: https://arxiv.org/pdf/gr-qc/0009013
