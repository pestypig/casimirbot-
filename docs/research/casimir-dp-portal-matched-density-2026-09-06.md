# Higgs-matched light portal: density and finite-wall screen

Program gate: S1 — define and screen common scattering kernels.
Workstream: Exploratory matched scalar portal.
Capability or component: Matter restoration and single-wall background field.
Current maturity: Tree-level conditional density calculation.
Target maturity: Reproducible matching and finite-wall diagnostic.
Required frozen inputs: Authenticated Higgs screen and Stage-4.2R geometry.
Required evidence: Matching identity, density units and boundary first-integral continuity.
Stop/fail criteria: No independently chosen matter coupling; no perfect-wall assumption without a scale check.
Explicit non-goals: Full cavity solution, rate fit, experimental admission or baseline changes.
Downstream gate unlocked: Finite-geometry light-sector response; S1 remains open.

## Finding

The conditional Higgs-decay ceiling fixes a much weaker matter coupling than the earlier independently parameterized symmetron example. At b = 100 GeV and kappa = 99.3774 GeV, the matched nucleon-density scale is approximately 2290 GeV, not the earlier illustrative 30 GeV. Its screening lengths and restoration conditions must therefore be recomputed. This packet supersedes any attempted numerical transfer of that earlier example to this portal; the earlier example remains valid within its own assumptions.

At a benchmark density of 2900 kg/m3, bulk restoration requires mu < 0.00154385 eV. For mu = 0.001 eV, the restored-medium decay length is 167.765 micrometres. A semi-infinite wall's surface field is still 45.8% of its vacuum value. Thus bulk restoration does not imply a zero field at the material interface.

The canonical plate lateral size is 80 micrometres and gap is 10 micrometres. Comparing these with the decay length flags the need for a finite-geometry solution; lateral size is not wall thickness, and this comparison does not establish the actual apparatus field.

## Matching and source assumptions

Use the authenticated [Higgs screen](casimir-dp-portal-higgs-decay-screen-2026-09-06.md), including its physical 125 GeV eigenmass and conditional interpretation of the ATLAS invisible rate. The original published combination reports a 0.107 branching-fraction upper limit under its production assumptions; translating it to the mixed portal requires the assumptions recorded in that packet. It is not a global model exclusion. [ATLAS primary paper](https://arxiv.org/abs/2301.10731v2).

The matrix matching gives:

- aN = 1.7905526448e-7 GeV^-1;
- achi = 1.0323019542e-5 GeV^-1;
- Delta lambda = 0.00512937403;
- aN achi = 2 Delta lambda CchiN, with the same heavy coefficient used for xenon and the local contact calculation.

Here mN(phi) = mN + aN phi^2/2. Approximate a material as a nucleon number density nN = rho/mN, so its quadratic contribution is s = aN rho/mN in natural units. This approximation retains the matched Higgs nucleon factor fN = 0.3. It is not universal coupling to all rest energy: electron, nuclear binding, species and scalar exchange-current corrections remain to be matched. Densities 2700, 2900 and 3100 kg/m3 are benchmarks, not authenticated LZ thermodynamic measurements.

The effective potential is Veff = (s-mu^2) phi^2/2 + lambda_eff phi^4/4. Bulk restoration occurs at s > mu^2. The interior decay length about zero is hbar c / sqrt(s-mu^2). The frozen sphere has density-size parameter sC R^2 = 5.63996e-6, consistent with weak self-screening in this approximation. That does not imply that the external field around it equals the vacuum field.

## Exact single-wall interface diagnostic

For a semi-infinite restored medium at z < 0 adjoining empty space at z > 0, let r = s/mu^2 > 1 and w = phi(0)/phi_vac. Require continuity of phi and its first derivative and take the interior field to zero far inside. Equality of the two first integrals gives

    (r-1) w^2/2 + w^4/4 = (1-w^2)^2/4,
    w = 1/sqrt(2r).

The exterior solution is

    phi(z)/phi_vac = tanh[mu z/(sqrt(2) hbar c) + atanh(w)].

It approaches the ideal Dirichlet wall only as r becomes large. The script checks the first-integral identity independently at every restored benchmark. For r <= 1 the reported wall fields are null because this restored-interior solution does not apply, not because the field is zero.

| mu (eV) | r at 2900 kg/m3 | Bulk restored? | Interior decay length (micrometres) | phi/phi_vac at 10 micrometres outside |
|---:|---:|---|---:|---:|
| 0.0001 | 238.347 | Yes | 128.084 | 0.04938 |
| 0.001 | 2.38347 | Yes | 167.765 | 0.48586 |
| 0.003 | 0.264830 | No | — | — |
| 0.01 | 0.0238347 | No | — | — |

The 10 micrometre coordinate is a single-wall diagnostic. It is not an asserted branch location or a solved two-plate cavity. Actual plate material, thickness, lateral edges, mounting and external boundary conditions are still required.

## Coupling consequence and limitations

For illustration only, take lambda_eff = 1e-24. At mu = 0.001 eV the vacuum field is 1 GeV and alpha_chiN = achi aN phi_vac^2/(4 pi) = 1.47090e-13. At the diagnostic 10 micrometre point this vertex product is reduced to 3.47226e-14. This is a product of local vertices, not a scattering rate: the inhomogeneous propagator and target response still enter. Neither the vacuum nor local value is fitted to DP.

The tiny effective quartic requires cancellation against the 0.005129 tree threshold. This calculation does not certify radiative stability, full three-field vacuum mixing, light-particle escape from collider detectors, astrophysical constraints or finite-temperature corrections. Finite-density suppression of the linear light vertex also does not remove heavy exchange or two-light-scalar scattering.

This result changes the next action: solve finite geometry using these matched matter couplings before importing an ideal-wall local rate. Optical boundary switching alone is not a change in the scalar rest-mass source. Any predicted difference between boundary settings must specify what scalar source or response actually changes.

## Reproduction and status

Run `C:\Python313\python.exe docs/research/casimir-dp-portal-matched-density-2026-09-06.py`. The adjacent JSON contains 12 density/mu cases. Four checks pass: portal matching identity, interface first-integral continuity, weak sphere size parameter, and ordered exterior field. These are conditional model checks, not measured screening evidence. No frozen baseline was changed. The user goal and S1 remain active.
