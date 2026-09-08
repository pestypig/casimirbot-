Program gate: S1 — hadronic input validation.
Workstream: CT14lo native-scale moment extraction.
Capability or component: Grid parsing, x integration and physical sum checks.
Current maturity: Independent interpolation diagnostic; no LHAPDF numerical parity claim.
Target maturity: Compatible moments and coefficient evolution for shared matching.
Required frozen inputs: SHA-authenticated CT14lo metadata and central grid.
Required evidence: Correct grid layout, quadrature convergence, momentum/valence sums and interpolation comparison.
Stop/fail criteria: No missing x tail declared zero; no below-QMin extrapolation; no forced normalization.
Explicit non-goals: PDF error ensemble, official interpolation equivalence or full model admission.
Downstream gate unlocked: Consistent grid-scale operator contraction; S1 stays open.

# Native-scale PDF moments from the complete grid

The archived CT14lo grid contains 240 x knots, 37 Q knots and 11 parton flavors. The [official LHAPDF format documentation](https://www.lhapdf.org/design.html) specifies that values are x times the density, with x as the outer loop and Q as the inner loop. Q in the file is unsquared. Those conventions are implemented explicitly and the full data dimensions are checked. Both archived file hashes are enforced on replay.

This first extraction stays at the native Q knots, avoiding an additional Q interpolation across thresholds. PCHIP interpolation in log(x) supplies the x integration; a separate cubic interpolation is evaluated for comparison. This is not the official log-bicubic LHAPDF implementation and is not claimed equivalent to it.

For momentum fractions, integrate the tabulated xf over dx. For valence number, integrate the quark-minus-antiquark xf difference over dlog(x). Sixteen-point Gauss quadrature in each log(x) cell is compared with 32 points. The maximum absolute momentum change is 5.67e-15; the maximum PCHIP/cubic difference for an individual flavor moment over the native grid is 2.49e-6. The former is quadrature convergence within an interpolant, not total PDF accuracy. The latter is a numerical sensitivity comparison, not a statistical uncertainty.

## Selected results

| Native Q, GeV | Up+antiup momentum | Down+antidown momentum | Gluon momentum | Total momentum |
|---|---:|---:|---:|---:|
| 1.295 | 0.352388 | 0.186860 | 0.441109 | 0.999943 |
| 4.75 | 0.303109 | 0.168287 | 0.480420 | 0.999894 |
| 10.9657 | 0.284530 | 0.161497 | 0.486196 | 0.999874 |
| 75.0724 | 0.256474 | 0.151364 | 0.494021 | 0.999838 |
| 104.712 | 0.252859 | 0.150070 | 0.494949 | 0.999833 |

At Q=4.75 GeV the extracted raw bottom-plus-antibottom moment is -1.11e-7, near the expected zero boundary at this accuracy. The raw file contains tiny negative threshold values; they are preserved here. The metadata ForcePositive flag is not applied by this independent diagnostic. Therefore this result is not claimed to match an official positivity-enforced LHAPDF query. At Q=10.9657 GeV the bottom moment is 0.00792527.

Up and down valence sums at Q=4.75 GeV are 1.999929 and 0.999972. The tested sum-rule tolerances pass at all 37 Q knots. These checks support the parsing and integration but do not prove complete perturbative evolution or threshold matching. In particular, the comparison with the earlier rounded-input residual uses a different complete PDF set and conventions; it does not isolate a single cause of that residual.

## Tails and remaining matching

Only x>=1e-9 is tabulated. The extracted total momentum in the first tabulated decade is 2.11e-7 at Q=1.295 GeV and 4.43e-5 at Q=104.712 GeV. That is a diagnostic of the low-x region, not a rigorous bound on the omitted x<1e-9 integral. No normalization correction is applied to force the full momentum sum to one. No extrapolation below QMin=1.295 GeV is admitted.

The grid has one central member, so the interpolation comparison cannot substitute for a PDF uncertainty ensemble. Proton/neutron isospin conversion and QCD evolution must use consistent Wilson coefficients and the grid's own coupling/threshold conventions. These moments improve the input side but do not make the axion box boundary at a chosen scale an authenticated matching result.

The next calculation should contract genuinely common-scale coefficients with these moments and compare neighboring native scales, retaining generated gluon terms and explicit low-scale uncertainty. The 1 GeV mediator still requires a justified matching prescription. The central tree target forecasts remain conditional, and no new full model conclusion is claimed.

Replay `C:\Python313\python.exe docs/research/casimir-dp-axion-pdf-moments-2026-09-07.py`. Four checks pass: shape/order, quadrature refinement, momentum sum and valence sums. The adjacent JSON retains every native-scale flavor moment and residual. Physics root/leaf documentation validation passes. The research goal stays active.
