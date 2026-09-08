Program gate: S1 — common axion model completion.
Workstream: Radial scalar companion and loop applicability.
Capability or component: Two tree channels in both targets.
Current maturity: Conditional nuclear diagnostic.
Target maturity: Complete matched model with detector and material response.
Required frozen inputs: Prior authenticated spin packet and canonical sphere unchanged.
Required evidence: Common quartic, scalar normalization, interference and loop-model audit.
Stop/fail criteria: No generic loop floor substituted for this UV model; no local channel envelope promoted to complete material response.
Explicit non-goals: Experimental fit, relic-density scan, exact scalar-loop matching or viability admission.
Downstream gate unlocked: Model-specific loop matching; S1 remains open.

# Axion radial-scalar companion in both targets

The new calculation adds the tree radial/Higgs scalar interaction to the preceding O6 channel, using the same dark-matter mass, halo, exposures and local isotope inventory. The mixed quartic is varied in both targets together. It is an additional model parameter, not a coupling fitted separately to local coherence.

The scalar coefficient is C=lambda_PhiH mchi fN mN/(mh^2 mrho^2), at small mixing, with mh=125 GeV, mrho=1 TeV and fN=0.3. Xenon uses a Helm response and retains the finite two-mediator propagator ratio mh^2 mrho^2/[(mh^2+Q^2)(mrho^2+Q^2)]. Local scalar scattering uses independent C12 and C13 nuclei with nuclear form factor bounded by one and the contact propagator as an upper bound for this elastic scalar channel. It is not a bound on all solid excitations or collective density modes.

The leading scalar identity and O6 spin amplitude do not interfere after an unpolarized dark-matter spin trace. Their tree rates can therefore be added under these assumptions. Scalar loops, however, can interfere with the tree scalar amplitude and must eventually be added at amplitude level. Adding a positive generic loop cross section would be incorrect.

## Numerical comparison

Central halo, 400 GeV dark matter, ma=1 GeV, gchi=1.36, gu=5.6e-5, B0=2.7 GeV and approximate C13 oscillator length 1.7 fm:

| Mixed quartic | Scalar raw Xe count, full window | Total tree raw Xe count | Total local tree D upper envelope |
|---|---:|---:|---:|
| 0 | 0 | 0.60181 | 1.696e-31 |
| 0.01 | 0.08091 | 0.68272 | 2.436e-30 |
| 0.03 | 0.72819 | 1.33000 | 2.056e-29 |
| 0.07 | 3.96458 | 4.56639 | 1.112e-28 |
| 0.10 | 8.09097 | 8.69278 | 2.268e-28 |

The full Xe interval is true 5.4–269.9 keV, before efficiency or resolution. Values 0.07 and 0.10 are sensitivity choices, not external-constraint clearance. The underlying spin contribution remains fixed. At quartic 0.03 the scalar high-window contribution (true 200–269.9 keV) is only 0.0005685 events, while the spin contribution is 0.036654. Thus the companion modifies the lower-energy spectrum much more than the high-energy interval. These are rate predictions under assumptions, not likelihood or discovery statements.

Scalar and spin full-window Xe counts become equal near quartic 0.02727. Their local channel upper envelopes become equal near 0.002735. The latter compares upper envelopes, not actual visibility losses, and cannot prove where a measured signal changes dominance. The difference shows why a channel subdominant for one target cannot automatically be omitted from the other. Both remain far below the theoretical DP comparator of about 0.02951 in this independent-nuclear model.

The 60-row JSON covers two masses, six halo scenarios and five quartics. The TeV rows keep gchi fixed; they are not an independently thermal-relic-matched family. Actual apparatus trajectories, survival selection, collective material responses and boundary-dependent readout remain required for a complete local prediction.

## Loop source audit

[Abe, Fujiwara and Hisano, 1810.01039v2](https://arxiv.org/html/1810.01039v2) calculates loop-induced spin-independent scattering for Majorana dark matter with a pseudoscalar and a two-Higgs-doublet sector. It includes triangle, box, scalar, twist-2 and gluonic contributions, with corrections to earlier incomplete treatments. Its numeric benchmark and claimed dominance of particular diagrams belong to that model. They are not a ready-made prediction for the Dirac, up-quark portal with a radial singlet and vector-like quark considered here.

The useful connection is methodological: loop matching needs the complete interaction set and operator decomposition. In the present model this includes the nonlinear a^2 chi-bar chi vertex, radial/pseudoscalar interactions, and the heavy messenger matching. A calculation containing only two pseudoscalar Yukawa insertions need not respect the nonlinear theory's cancellations. The finite scalar quartic is an allowed renormalized parameter; without a stated renormalization condition, a diagram alone does not establish an unavoidable numerical scalar floor.

Concrete remaining matching work:

1. State the renormalized radial/Higgs potential, explicit breaking and messenger parameters at one scale, including which mixed scalar operators are retained.
2. Derive Dirac box and crossed-box coefficients with the up-quark portal, retaining scalar and twist-2 structures rather than importing a Majorana normalization.
3. Include nonlinear contact, triangle and required counterterm contributions; check field-redefinition consistency between linear and polar scalar variables.
4. Match quark/gluon operators and run them consistently to the hadronic scale, preserving proton/neutron differences and interference with the tree scalar term.
5. Propagate that common coefficient set through both targets before assigning a local null, lower bound or admitted model.

This audit changes the next action: no generic pseudoscalar loop curve will be treated as a bound on this axion completion. There is still useful work available, so no blocked or complete goal status is warranted.

## Verification

Replay `C:\Python313\python.exe docs/research/casimir-dp-axion-tree-companions-2026-09-07.py`. Four checks pass: spin-trace interference, zero-quartic tree-scalar limit, nested positive Xe intervals and quartic-squared scaling. Parent script/output hashes are enforced and older packets are loaded without replaying their output sections. Physics root/leaf documentation validation passes. No runtime, certificate or physical-authority changes are made.
