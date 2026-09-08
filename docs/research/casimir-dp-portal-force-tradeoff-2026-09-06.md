# Portal force/scattering tradeoff at fixed xenon and screening coefficients

Program gate: S1 — same-parameter consistency screening.
Workstream: Restricted matched-portal parameter family.
Capability or component: Classical force reduction at unchanged leading scattering potential.
Current maturity: Tree-level algebraic tradeoff, conditional on perturbative diagnostics.
Target maturity: Identify real parameter freedom without independent target fits.
Required frozen inputs: Heavy xenon coefficient, matched matter coefficient and canonical apparatus/comparator unchanged.
Required evidence: Matching identities, preserved light potential, recomputed Higgs screen and explicit coupling domain.
Stop/fail criteria: No claim of free-hold feasibility from a reduced force; no globally optimal bound from a restricted family.
Explicit non-goals: Hardware retuning, full loop/UV fit, global exclusion or certified viability.
Downstream gate unlocked: Force-compatible broader parameter scan or authenticated trap contract; S1 remains open.

## Result

The original illustrative point's force can be reduced without independently adjusting xenon and sphere couplings. Within the restricted positive-b family considered here, holding CchiN, aN and the leading light vertex product fixed reduces the large-cavity confinement threshold from 9.62 MHz to 276.5 kHz at the chosen Yukawa-coupling boundary. The original 9.62 MHz requirement is therefore not a universal lower bound on this portal class.

The improvement does not rescue an uncompensated 0.25 s hold. At 276.5 kHz, the corresponding 10% unconfined displacement-growth time is approximately 0.255 microseconds. The actual trap potential is unauthenticated, and stable confinement alone would not prove correct branch preparation, hold or recombination. The percent-level far-trajectory value remains an unadmitted fixed-branch calculation.

## Preserved quantities and allowed change

Retain mS = 1000 GeV, physical mh = 125 GeV and v = 246.2 GeV. For each b, adjust the h diagonal entry so the physical light heavy-sector eigenmass remains 125 GeV. Let K be the inverse two-heavy-field mass matrix and yn = 0.3 mN/v. Matching gives

    aN = -kappa yn KSh,
    CchiN = ychi yn KSh,
    achi = -kappa ychi KSS.

Fix aN = 1.7905526448e-7 GeV^-1 and CchiN = 1.8017705314e-10 GeV^-2. Therefore kappa and ychi at any chosen b are determined, not separately fitted:

    kappa = -aN/(yn KSh),
    ychi = CchiN/(yn KSh).

The ratio ychi/kappa = -CchiN/aN is fixed. Keeping aN preserves the normalized source-dependent chamber solution u and its scalar fluctuation operator at fixed mu. To preserve achi aN phi_vac^2, choose the explicitly linked scalar parameter

    lambda_eff(b) = lambda_eff(original) achi(b)/achi(original).

Then achi phi_vac^2 remains fixed, but aN phi_vac^2 decreases. This preserves the leading tree-level dark-matter/target light potential while reducing the classical force on ordinary matter. It is a change in underlying model parameters, not a modification of the frozen sphere or a separately chosen local coupling.

The statement does not assert identical full theories. Loop corrections, self-interactions, multi-scalar channels, relic abundance, vacuum properties and collider processes beyond the inherited screen can change along the family.

## Restricted parameter domain

Explore decreasing b from 100 GeV with positive kappa and negative ychi. Declare the diagnostic restrictions |ychi|^2 <= 4 pi and Delta lambda = kappa^2 KSS/2 <= 4 pi. These are heuristic perturbative boundaries, not rigorous unitarity limits, experimental confidence bounds or proof that loops are negligible. Near their boundaries the tree result particularly needs loop review. Do not use this limited scan as a bound on all choices of mediator masses, matter coefficients or geometry.

The endpoint has b = 2.81921 GeV, kappa = 3522.84 GeV, ychi = -sqrt(4 pi), Delta lambda = 6.20538 and lambda_eff = 1.20977e-21. All table rows still involve a very small effective quartic compared with its threshold correction. Its cancellation is explicit rather than claimed natural.

| b (GeV) | kappa (GeV) | ychi | lambda_eff for same leading light potential | Required confinement threshold, large cavity |
|---:|---:|---:|---:|---:|
| 100 | 99.38 | -0.1000 | 1.0000e-24 | 9.618 MHz |
| 30 | 331.07 | -0.3331 | 1.0722e-23 | 2.937 MHz |
| 10 | 993.17 | -0.9994 | 9.6188e-23 | 0.981 MHz |
| 3 | 3310.54 | -3.3313 | 1.0684e-21 | 0.294 MHz |
| 2.81921 | 3522.84 | -3.5449 | 1.2098e-21 | 0.277 MHz |

The endpoint reduces the classical curvature by a factor 0.000826601 and the frequency threshold by its square root. This is a calculable tradeoff; no trap capability has been assumed.

## Recomputed collider screen and other qualifications

The physical scalar mixing and invisible partial width are recomputed for every row. The same conditional SM-normalized invisible-yield screen gives 0.107 at the starting point and approximately 0.106949 at the endpoint. All displayed rows pass this particular screen. Its assumptions are inherited from the [Higgs packet](casimir-dp-portal-higgs-decay-screen-2026-09-06.md): small additional light-heavy background mixing, light scalars escaping detection, specified SM width and no independent cancellation amplitude. It is not a full collider fit or the strongest possible combined limit.

Neither a pass there nor the preservation of the heavy xenon coefficient proves the anomalous LZ event is explained. The inherited raw high-window heavy expectation remains approximately 0.000228 at 1 TeV; it was not raised to fit the event. The full light-channel xenon response and other experimental constraints are still required.

For fixed aN and background u, the force result scales as Omega_phi^2 proportional to 1/lambda_eff, while the fixed achi/lambda_eff keeps the leading local potential unchanged. Changing aN to reduce forces further would also change screening, u, the propagator and xenon matching; those cannot be held fixed by assertion. A broader search must recompute them together.

## Verification and next decision

Run `C:\Python313\python.exe docs/research/casimir-dp-portal-force-tradeoff-2026-09-06.py`. Four checks pass: fixed matter coefficient, fixed heavy xenon coefficient, preserved light-product ratio and the solved Yukawa boundary. The adjacent JSON records coupling diagnostics and the recomputed Higgs yield for each point. The [classical-force audit](casimir-dp-portal-classical-force-2026-09-06.md) remains applicable after the explicit curvature rescaling.

This establishes a real but insufficient reduction for an uncompensated hold. Next either impose an authenticated confinement/trajectory contract or expand the coupled parameter search while enforcing force and scattering constraints together. Do not resume presenting the percent-level point as a viable forecast merely because this restricted family weakens its force. S1 and the overall goal remain open.
