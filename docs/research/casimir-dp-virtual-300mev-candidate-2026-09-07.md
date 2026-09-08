# Conditional 300 MeV candidate after broader laboratory intake

Date: 2026-09-07. Partial constraint screen; not an allowed model or joint prediction.

The preceding mass scan supplies new raw xenon normalizations. Additional pinned DarkCast contours narrow the remaining mixing intervals. [BaBar's prompt electron/muon search](https://arxiv.org/abs/1406.2980) gives epsilon ceilings approximately 1.00500e-3 at 100 MeV and 8.44005e-4 at 300 MeV. At 300 MeV, the available NA62 displaced dimuon interval ends at 2.55219e-6, below the candidate mixing floor. NuCAL and CHARM contours also do not close the relevant gap. The companion JSON records the selected contours and file hashes; it is not an exhaustive contemporary constraint union.

The [FASER collaboration's 2026 result](https://faser.web.cern.ch/briefing-20260319) reports sensitivity extending to roughly 150 MeV. It requires an updated contour check for the 100 MeV branch, but does not establish an exclusion at 300 MeV. The old preliminary FASER contour in the pinned package must not be labeled the latest result. A blocked CDS document fetch is not evidence of absent limits; the collaboration briefing remains accessible. Its summary ranges must not be treated as a rectangular exclusion.

## Concrete test case

Retain m_1=100 GeV, delta=10 MeV, m_A=300 MeV, the mass-scan effective alpha approximately 3.03645e-6, and choose alpha_D=0.1. This gives epsilon approximately 1.12405e-4, below the above BaBar contour and above the selected displaced-search intervals. Set m_h=300 MeV in the explicit charge-two scalar completion. Then v_D approximately 0.133809 GeV, y approximately 0.0528444 and lambda_D=2.51327. The script reconstructs the coupling product and checks the previously stated loose quartic/Yukawa criteria. These values are diagnostic choices, not fitted evidence.

The on-shell mediator cannot decay to the heavy dark fermions, and m_h=m_A closes an on-shell scalar-plus-visible decay. Ordinary dark-photon electron and muon widths must be included. A Standard Model scalar portal has not been fixed; no scalar-mediated signal is added to compensate for missing coherence. A renormalized portal specification and its induced effects are still required for a full completion.

The raw xenon low/high ratio remains approximately 180, and no detector acceptance is included. The point is therefore not an adequate explanation of the LZ event. Its local material response also remains uncalculated. The next substantive checks are self-interactions/annihilation and the achievable coherence scale at this same normalization, before committing to detailed electron matching. Reject the candidate if these establish an incompatible rate or negligible local reach under its declared assumptions; do not preserve it merely because this subset of laboratory searches leaves room.

No frozen apparatus or earlier dated benchmark is changed. The shared-scattering goal remains open.
