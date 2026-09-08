Program gate: S1 — axion matching prerequisites.
Workstream: Scalar reference input prescription.
Capability or component: Complete renormalizable scalar-potential basis and independent inputs.
Current maturity: Verified tree reconstruction; declared loop prescription.
Target maturity: Shared scalar reference whose finite boundary assumptions are reproducible.
Required frozen inputs: Existing masses, vacuum values, mixing and messenger scale.
Required evidence: Monomial inventory, input-map rank, numerical reconstruction and explicit scheme scope.
Stop/fail criteria: Do not call a specified counterterm an evaluated counterterm or a boundary assumption a measured coupling.
Explicit non-goals: Full gauge/Yukawa matching, new total rates, vacuum certification or LZ fit.
Downstream gate unlocked: Scalar counterterms can be calculated against an explicit reference prescription.

# A declared scalar reference instead of implicit missing couplings

The [identifiability calculation](casimir-dp-axion-input-identifiability-2026-09-07.md) showed that masses and the light-scalar decay do not determine every interaction. This packet supplies an explicit reference choice for the remaining scalar inputs. It reproduces the archived tree benchmark and defines how to extend that reference; it does not retroactively make archived partial-loop totals fully matched.

## Complete potential within the stated field content

Take one Higgs doublet, X=HdagH, one CP-even real singlet S and one CP-odd real singlet A, canonical Cartesian fields, with vacuum S=f and A=0. Gauge invariance and CP permit the following nonderivative potential through dimension four:

```
V = -muH2 X + lambdaH X^2 + t S
  + mS2 S^2/2 + mA2 A^2/2
  + muS S^3/3 + muSA S A^2/2
  + lambdaS S^4/4 + lambdaSA S^2 A^2/2 + lambdaA A^4/4
  + muHS S X + lambdaHS S^2 X/2 + lambdaHA A^2 X/2.
```

This is thirteen coefficients, omitting a constant, in a fixed field-origin convention. It is not a count of thirteen independently measurable observables: singlet shifts and other parameter conventions must be fixed. No extra fields, CP violation, derivative operators or higher-dimensional terms are included. Additional spurion restrictions could reduce the allowed family, but are not silently imposed on the counterterm basis.

The independent enumeration uses monomials X^x S^s A^a with a even and 0 < 2x+s+a <= 4. It returns precisely these thirteen terms. Thus the four deformations in the prior packet were illustrative, rather than the full inventory.

## Six vacuum/mass conditions and seven independent choices

At fixed v and f, require two vanishing tadpoles, the three entries HH, SS, HS of the CP-even mass matrix, and the pseudoscalar mass ma. These six conditions have rank six. Choose seven independent coefficients

`muS, muSA, lambdaS, lambdaSA, lambdaA, lambdaHS, lambdaHA`.

The other six coefficients reconstruct as

```
lambdaH = HH/(2 v^2)
muHS = HS/v - lambdaHS f
muH2 = lambdaH v^2 + muHS f + lambdaHS f^2/2
mS2 = SS - 2 muS f - 3 lambdaS f^2 - lambdaHS v^2/2
t = -mS2 f - muS f^2 - lambdaS f^3 - muHS v^2/2 - lambdaHS f v^2/2
mA2 = ma^2 - muSA f - lambdaSA f^2 - lambdaHA v^2/2.
```

Here HH=mh^2 c^2+mr^2 sin^2(theta), SS=mh^2 sin^2(theta)+mr^2 c^2, HS=(mr^2-mh^2)sin(theta)c. The chosen theta=0.0022059591565 is a benchmark mixing input, not a measurement from the recoil.

## Reference boundary selected for future calculations

At mu0=MU=2000 GeV, in the full messenger theory and the stated Cartesian field convention, select the following renormalized MS-bar boundary values for the seven independent coefficients:

| Coefficients | Reference boundary |
|---|---:|
| muS, muSA | 0 GeV |
| lambdaS, lambdaSA, lambdaA | 5.784593281660516 |
| lambdaHS, lambdaHA | 0.03 |

The common singlet quartic is the archived tree value. These equalities and zeros are boundary assumptions at mu0. They are not symmetry protection, measured values, relations to enforce again at every scale, or statements that their counterterms vanish. For example, the loop value of the dependent muHS need not vanish even though its tree reconstruction does.

The tree reconstruction gives lambdaH=0.12892794368, muH2=9111.43510639 GeV^2, mS2=mA2=-500905.32149361 GeV^2, muHS=0 and t=-294 GeV^3. This recovers the prior minimal soft-breaking benchmark without moving any mass, mixing or apparatus input.

## Prescription for extending this reference to one loop

The following specifies the scalar sector's intended hybrid input scheme; its finite counterterms have NOT yet been evaluated:

1. Keep the three quoted scalar masses as pole-mass inputs. Require renormalized one-point functions to vanish at the selected vacuum. Use f as an MS-bar vacuum parameter at mu0; the chosen numerical v is the tree reference for a GF-based electroweak input, whose finite conversion must be included when electroweak loops are calculated.
2. Define the CP-even mixing input by a symmetric momentum subtraction: in the tree mass basis set the real renormalized off-diagonal inverse propagator to zero at pstar^2=(mh^2+mr^2)/2. This is a declared mixing convention, not an extra measured decay. For calculations including electroweak gauge loops, fix R-xi gauge with xi=1 and consistently translate this convention before comparing scheme-dependent inputs. Do not claim this mixing definition alone is a gauge-independent observable.
3. Use MS-bar field and seven independent coupling counterterms. Determine the remaining six potential counterterms from the two tadpole, three pole-mass and one mixing conditions. Include field, vacuum and independent-parameter counterterms in these equations. External-state residues enter amplitudes; MS-bar fields do not automatically have unit pole residues.
4. For inverse propagator p^2-m^2+Pi, the diagonal conditions require the full renormalized real Pi_ii(mi^2) to vanish. In the same convention the off-diagonal condition is Re Pi_12(pstar^2)=0. This specifies equations, not permission to substitute only the zero-momentum potential Hessian for pole matching.
5. Match the messenger theory to the low-energy theory in this same convention. Add each heavy threshold once, including the necessary field/vertex and light-theory subtraction terms. Full-theory boundary values above are not low-energy coefficients to which arbitrary archived threshold subsets can simply be appended.

The need to coordinate tadpoles, scalar mixing, pole inputs and field matching is discussed in [Braathen, Goodsell and Slavich](https://link.springer.com/article/10.1140/epjc/s10052-019-7093-9). The specific boundary and input map here are our reference choice. This scalar prescription does not supply the outstanding fermion/Yukawa, complete hard-gluon, or hadronic matching calculations.

Both the xenon and local coherence predictions must consume the same resulting Wilson coefficients and this same boundary choice. A future nuisance-parameter family must vary these inputs jointly. It must not refit one set to each apparatus.

## Verification and status

The [script](casimir-dp-axion-scalar-input-scheme-2026-09-07.py) authenticates the archived input JSON. Four checks pass: the complete monomial inventory, rank-six vacuum/mass map, reconstruction for the central point and twenty algebraic perturbations, and recovery of the archived minimal tree potential. The maximum scaled reconstruction residual is 2.81e-11. Perturbations test the map, not vacuum stability or a physical prior. The [JSON](casimir-dp-axion-scalar-input-scheme-2026-09-07.json) explicitly marks loop counterterms unevaluated and the full model unadmitted.

This removes an unspecified scalar boundary choice from the reference calculation. The next calculation is to evaluate the scalar input counterterms in this prescription, starting with the already available messenger sector and keeping potential, field and pole terms distinct. Existing total-rate forecasts are unchanged; the goal remains active.
