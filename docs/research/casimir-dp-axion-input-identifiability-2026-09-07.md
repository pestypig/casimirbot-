Program gate: S1 — axion matching prerequisites.
Workstream: Physical-input identifiability.
Capability or component: Independent scalar interactions and a conditional scattering-loop family.
Current maturity: Tree-input degeneracy with one finite loop subset.
Target maturity: Explicit additional inputs needed to close a shared prediction.
Required frozen inputs: Archived masses, mixing, messenger benchmark and apparatus.
Required evidence: Operator expansion, coupling-map rank and exchange-amplitude check.
Stop/fail criteria: Do not treat assumed dark-sector inputs as measured or a subset variation as a full prediction uncertainty.
Explicit non-goals: New fit, benchmark retuning, complete counterterm basis or experimental validation.
Downstream gate unlocked: A precise extra-input prescription for subsequent full matching.

# Which inputs determine the scalar scattering correction?

The previous packet established that field redefinitions must be applied consistently. This calculation addresses a different issue: physically different interactions can have the same tree masses and mixing. It extends the earlier A-only Higgs-portal example to the radial interaction. The [axion paper](https://arxiv.org/html/2609.04186v1) supplies the starting model and representative parameters; the deformation family below is our diagnostic extension, not a claim that the paper selected these coefficients.

## Input status

| Input | Status in this calculation |
|---|---|
| v=246.2 GeV, mh=125 GeV | Fixed Standard Model reference values, rounded for this benchmark |
| mchi=400 GeV, ma=1 GeV, mr=1000 GeV, f=294 GeV | Assumed dark-sector benchmark; not measured by LZ |
| lambdaP=0.03 and resulting scalar mixing | Chosen model input; not inferred from the recoil |
| MU, yL, yR | Chosen messenger parameters; low-energy product alone does not determine all three |
| Additional scalar couplings below | Independent renormalized inputs unless further symmetry/boundary assumptions fix them |

Writing an input as a physical mass specifies its intended renormalization role; it does not make its value experimentally established. At loop order the mass, tadpole, mixing and coupling prescriptions still need explicit definitions.

## A mass-preserving family

Let S=sqrt(2) Re(Phi)=f+s, A=sqrt(2) Im(Phi), X=HdagH, and add

`delta V = A^2/2 [kappaH (X-v^2/2) + kappaS (S^2-f^2)/2 + eta (S-f)] + lambdaA A^4/4`.

The four coefficients have dimensions (0,0,1,0). These are gauge- and CP-allowed deformations. We do not claim all arise at the same loop or spurion order in the original messenger model. A stronger symmetry/spurion restriction could relate or exclude entries, but must be stated and demonstrated. This is not an exhaustive general scalar potential.

All terms in the expansion around the selected vacuum start at cubic order. Therefore the tree tadpoles, masses and mixing remain fixed. Define xi=kappaS f+eta. The interaction-basis trilinear shifts are

`delta g_hAA = kappaH v`, `delta g_sAA = xi`.

For h1=c h-s_theta s and h2=s_theta h+c s,

`delta g_1AA = c v kappaH - s_theta xi`

`delta g_2AA = s_theta v kappaH + c xi`.

The map from (kappaH,kappaS,eta/f,lambdaA) to the two signed trilinears has rank two. Even specifying both trilinears fixes only kappaH and xi. It leaves the kappaS/eta separation and lambdaA unspecified; these enter quartic interactions and can matter in other amplitudes or at higher order. A decay width alone determines a magnitude, with less information than a signed trilinear.

## A fixed light-Higgs decay does not fix the spacelike loop

The Cartesian two-axion triangle contains the scalar exchange factor

`T(Q) = {v lambdaP (ma^2+Q^2) + v kappaH (Mss^2+Q^2) - Mhs^2 xi} / [(mh^2+Q^2)(mr^2+Q^2)]`,

where Mss^2 is the radial diagonal mass-matrix entry and Mhs^2=lambdaP f v. Here the superscript 2 labels entries with mass-squared units, not a second squaring of the script's variables Mss and off. This follows directly from the inverse two-scalar propagator; no on-shell decay vertex is inserted into an internal loop.

Consider the diagnostic family kappaH=tan(theta) xi/v, kappaS=xi/f, eta=0. It keeps the SIGNED light-Higgs trilinear unchanged, a stronger condition than keeping its tree partial width. The heavy trilinear shifts by xi/c. Using Mss^2-Mhs^2 c/s_theta=mh^2 gives

`delta T(Q) = tan(theta) xi / (mr^2+Q^2)`.

This is a physically distinct interaction, unlike a field redefinition. At xi=1 GeV, kappaH=8.96004e-6 and kappaS=0.00340136. The isolated triangle grows by a factor 5.66669 at Q=0 and 5.40041 at Q=0.246 GeV despite identical tree masses, mixing and light-Higgs AA coupling. The effect is small relative to the tree scalar amplitude: triangle/tree goes from 3.66119e-7 to 2.07468e-6 at Q=0. A large relative change in this suppressed component is not a large total scattering effect.

These values illustrate identifiability, not a fitted range or naturalness prior. No new xenon/coherence total is reported: the deformation also requires consistent treatment of other loop terms and physical-input counterterms. Tree equality is not a claim that loop-corrected observables automatically remain equal without that matching.

## Closing the input gap

For the trilinear-dependent subset, either specify two signed renormalized trilinears in a declared scheme, or specify kappaH and xi at a matching scale with their boundary assumptions. For other amplitudes, additionally specify the independent quartic information, including kappaS and lambdaA, and audit any further symmetry-allowed operators. Neither the scalar masses nor the light-Higgs AA width supplies all this information.

A minimal-boundary benchmark can remain useful, but its vanishing extra coefficients must be labeled assumptions at a specified scale and in a specified field convention. Alternatively these coefficients can remain shared model parameters in both target calculations. They cannot be chosen independently to make xenon and local coherence agree. This packet narrows the next task to a declared renormalized input prescription before further total-rate refinements.

The [script](casimir-dp-axion-input-identifiability-2026-09-07.py) authenticates and loads only the archived triangle definitions. The [JSON](casimir-dp-axion-input-identifiability-2026-09-07.json) records nine conditional points. Five checks pass: no tree tadpole/Hessian shift, rank two, the two parameter null directions, fixed signed light vertex, and agreement of matrix/eigenstate/compact exchange expressions. These checks establish the stated algebraic degeneracy, not a complete UV model. The research goal remains active.
