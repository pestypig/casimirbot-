Program gate: S1 — axion box hadronic matching.
Workstream: Proton/neutron scalar projection and twist-scale contract.
Capability or component: Up-quark matrix elements at zero transfer.
Current maturity: Conditional leading scalar projection; twist matching incomplete.
Target maturity: Common-scale hadronic Wilson coefficients.
Required frozen inputs: Authenticated Dirac box coefficients and primary matrix-element conventions.
Required evidence: Sigma-term normalization, isospin weights, explicit scale rejection.
Stop/fail criteria: No Z-scale PDF moments combined with coefficients at an unknown or different scale.
Explicit non-goals: Full QCD evolution, finite-Q nuclear prediction or complete-loop claim.
Downstream gate unlocked: Common-scale quark/gluon evolution and matching; S1 remains open.

# Box contribution to proton and neutron amplitudes

The previous packet's scalar coefficient multiplies m_u u-bar u. Consequently its zero-transfer nucleon projection is C_N^S=C_u sigma_u^N. It must not be multiplied by the full Higgs scalar factor, which includes other flavors and gluonic matching.

For a reproducible published sensitivity choice, [Bishara et al., equation 106](https://arxiv.org/html/1707.06998v2) gives sigma_u^p=17+/-5 MeV and sigma_u^n=15+/-5 MeV. These are that paper's estimates, not a claim to the latest lattice determination. The script scans their central and endpoint values independently as a sensitivity grid. Without a covariance prescription, the nine combinations are not a joint confidence region.

Using the authenticated leading box coefficient C_u=4.57721e-14 GeV^-3 gives central effective-Lagrangian coefficients

    C_p^S = 7.78125e-16 GeV^-2,
    C_n^S = 6.86581e-16 GeV^-2.

Their ratio is 0.88235, unlike an isoscalar Higgs contribution. The scalar up-box alone would give a zero-transfer free-proton cross section of 6.586e-59 cm^2 at mchi=400 GeV. This is a subset diagnostic and is not a target-event prediction or an exclusion result.

At zero transfer, a one-body nuclear scalar amplitude uses Z C_p+(A-Z) C_n. The central values give 9.48855e-14 GeV^-2 for Xe131 and 8.78824e-15 GeV^-2 for C12. Nuclear form factors, finite-Q matching and collective solid dynamics are not supplied by these zero-transfer numbers. Neither target may be assigned its own independently fitted box coefficient.

In the earlier potential convention these Lagrangian coefficients acquire a minus sign. At lambdaP=0.03 the Higgs tree coefficient was +2.16346e-10 GeV^-2, making the proton scalar-box correction approximately -3.60e-6 of that coefficient before other matching corrections. Its magnitude would equal the tree proton coefficient only near lambdaP=1.079e-7 with the other parameters fixed. That crossover is a sensitivity diagnostic, not a selected or constrained quartic.

## Why the traceless contribution is still explicit rather than silently added

[Abe et al., tables 4–5 and equation 3.29](https://arxiv.org/html/1810.01039v2) specifies that its quark momentum fractions are evaluated at the Z-boson scale. Its proton up-plus-antiup fraction is 0.254; the corresponding neutron value follows by exchanging up and down. Those matrix elements require Wilson coefficients in a compatible scale and scheme. Their availability does not authorize assigning the current box coefficients to that scale.

For a common-scale up coefficient T_u=mchi C1+mchi^2 C2, the projected term is (3/4)mN T_u [u_N(2)+anti-u_N(2)]. The current unrun numerical T_u would give a prefactor 1.64994e-16 GeV^-2 per unit momentum fraction. This is displayed as a coefficient, not an admitted numerical twist contribution. Quark/gluon mixing and running must be included consistently; the small cancellation in T_u does not justify ignoring them.

The executable scale contract rejects a missing coefficient scale and rejects 1 GeV coefficients paired with Z-scale moments. Providing equal scale labels alone would not establish correct running: the actual evolution and scheme definition still require evidence. The scalar m_u u-bar u projection is the leading scalar matching term; its product convention avoids a spurious extra quark-mass division. It does not provide complete QCD corrections, heavy-threshold effects or the missing gluonic contribution.

The 1 GeV pseudoscalar mass is especially relevant to the reliability of perturbative low-scale matching. This packet therefore does not promote the free-quark expansion or tree-level scale treatment into a controlled complete hadronic calculation. Next is common-scale operator evolution/matching, followed by finite-Q and nuclear response completion. Existing spectra remain conditional baselines.

Replay `C:\Python313\python.exe docs/research/casimir-dp-axion-box-hadronic-2026-09-07.py`. The parent JSON hash is enforced. Four checks cover scale rejection, scalar normalization, the equal-coupling nuclear limit and positive scalar projections. Physics root/leaf documentation validation passes. The full model and the user's goal remain open.
