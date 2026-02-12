# Time Dilation Lattice Canonical Convergence Audit

Scope
- Panel: TimeDilationLatticePanel (Natario canonical strict mode).
- Goal: verify geometry-derived rendering pipeline and identify any non-canonical conversions or policy drift.

Canonical data flow (Natario)
1. GR brick provides geometry fields (alpha, beta_i, gamma_ij, phi, K) and derived fields (g_tt, clockRate_static, theta, KijKij, invariants).
2. RenderPlan computes data sources and gating based on strict mode (no proxies, GR certified, math stage OK).
3. Panel samples brick fields into lattice vertices, then shader renders warp lattice.

Geometry-derived conversions that are correct
- g_tt computation: g_tt = -alpha^2 + g_ij beta^i beta^j, with g_ij = exp(4 phi) * gamma_ij (BSSN conformal metric).
- theta channel: theta = -K (trace of extrinsic curvature), consistent with ADM convention and Natario mapping with beta = -X.
- clock rate:
  - Eulerian mode uses alpha (proper time along normal).
  - Static mode uses sqrt(-g_tt) for stationary observers.

Convergence gaps (non-math or policy drift)
1. Policy mismatch
- TIME_DILATION_RENDER_POLICY.md says Natario geometry warp disabled by default, but panel enables Natario geometry warp when natarioGeometryWarp is true and strict mode passes.
- This is a documentation drift, not a math error.

2. Visual scalers are non-physical
- betaWarpWeight, thetaWarpWeight, geomWarpScale, and normalization targets are visualization scalers, not physical coefficients.
- This is acceptable but must be explicitly labeled as visual in canonical docs.

3. Natario zero-expansion expectation
- Natario implies theta ~ 0, but the lattice can apply theta-driven warp displacement when geometry warp is enabled.
- For strict Natario canonical display, theta warp should be disabled or explicitly marked as visual-only.

Status
- Theta-driven warp is disabled for Natario canonical rendering; theta remains a diagnostic channel.

4. Wall detection thresholds
- Wall detection uses curvature invariants (ricci4/kretschmann). If thresholds are too high, Natario wall can be classified as NO_HULL.
- This is a visualization threshold issue, not a geometry mismatch.

Required citations for canonical claims
- ADM line element and g_tt definition: g_tt = -alpha^2 + g_ij beta^i beta^j.
- Eulerian proper time: d tau = alpha dt.
- Expansion scalar: theta = -TrK; Natario definition theta = div X with beta = -X.
- BSSN conformal metric: g_ij = exp(4 phi) * gamma_ij.

Recommended actions
1. Update TIME_DILATION_RENDER_POLICY.md
- Declare whether Natario geometry warp is allowed in canonical strict mode.
- If allowed, label as visual-only.

2. Enforce Natario theta behavior in strict mode
- Option A: set thetaWarpWeight = 0 for Natario strict mode.
- Option B: keep theta warp but label it as a visual diagnostic only, not physical expansion.

3. Add a conversion contract section
- A short section in the panel docs stating the exact formulas used (g_tt, theta, clock rate) and their source.

4. Add a regression test
- Ensure theta channel equals -K from the brick.
- Ensure g_tt min/max match brick-derived g_tt when available.

Decision checkpoint
- If the goal is strict canonical Natario, prefer disabling theta warp and documenting geometry warp as visual-only.
- If the goal is interpretive visualization, keep geometry warp but add explicit labels and citations.

Files reviewed
- client/src/components/TimeDilationLatticePanel.tsx
- shared/time-dilation-render-policy.ts
- TIME_DILATION_RENDER_POLICY.md
- server/gr/evolution/brick.ts

Status summary
- Geometry-derived conversions are consistent with canonical definitions.
- Remaining issues are policy alignment and visual semantics, not math errors.

Research validation addendum (primary-source check)

1. g_tt conversion is equation-aligned
- ADM line element gives g_tt = -alpha^2 + gamma_ij beta^i beta^j. Alcubierre Eq. (1). [1]
- 3+1 time vector form gives the same result, g(partial_t, partial_t) = -N^2 + beta dot beta. Gourgoulhon Eq. (4.32). [2]

Correction to document in the conversion contract
- beta dot beta must use the physical spatial metric g_ij, not the conformal one. In BSSN, g_ij = exp(4 phi) * tilde_gamma_ij. [3]
- Explicitly state the notation mapping so there is no ambiguity about what the brick calls gamma_ij.

2. BSSN conformal reconstruction is correct with notation clarified
- Baumgarte and Shapiro define tilde_gamma_ij = exp(-4 phi) * gamma_ij, so gamma_ij = exp(4 phi) * tilde_gamma_ij. Eq. (10). [3]
- Action: in the conversion contract, write g_ij = exp(4 phi) * tilde_gamma_ij and define which brick fields correspond to tilde_gamma_ij.

3. Expansion scalar theta = -K is consistent with canonical conventions
- Alcubierre defines theta = -alpha TrK (Eq. 11). With alpha = 1, theta = -K. [1]
- Gourgoulhon shows K = -div n, so expansion of the Eulerian normal is theta = -K. Eq. (2.77). [2]
- Natario defines theta = div X (Cor. 1.5). With beta = -X, div X = -div beta, so the sign mapping must be documented. [4]

4. Clock rate observers must be explicitly labeled
- Eulerian proper time increment: d tau = alpha dt (Gourgoulhon Eq. 3.15). [2]
- Coordinate-stationary observer: d tau = sqrt(-g_tt) dt when partial_t is timelike. Gourgoulhon Eq. 4.33 gives the condition beta dot beta < N^2. [2]
- Action: in UI and docs, label clock mode by observer type and note the g_tt timelike condition.

Policy recommendation from the validation
- For Natario canonical strict mode, disable theta-driven displacement (thetaWarpWeight = 0) or mark it VISUAL ONLY. Natario zero-expansion constructions expect theta near 0; displacement from theta is a visualization choice, not a required geometric effect. [4]

References
[1] https://arxiv.org/pdf/gr-qc/0009013
[2] https://luth2.obspm.fr/~luthier/gourgoulhon/pdf/form3p1.pdf
[3] https://arxiv.org/pdf/gr-qc/9810065
[4] https://arxiv.org/pdf/gr-qc/0110086
