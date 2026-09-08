# Nuclear coherence reach of the 300 MeV candidate

Date: 2026-09-07. Conditional nuclear-component calculation, not an inclusive material bound.

Return to the actual shared-signal requirement before refining dark-dark scattering further. The new 300 MeV candidate uses effective alpha=3.03645203e-6 and gap=10 MeV from its own raw xenon normalization. Reusing the finite uniform-nucleus virtual kernel gives carbon W(0)=-2.93085729e-8 GeV^-2. No coupling or apparatus parameter is retuned.

For independent stationary carbon nuclei, integrating q |W(q)|^2/(2 pi v^2) over the free-carbon kinematic interval gives sigma=1.02388106e-41 cm^2. The frozen sphere, incident density/speed and hold time then give a generic decoherence-filter upper bound D<=1.84962034e-26 within this model. Momentum quadratures with 96 and 192 nodes agree to numerical precision, and the forward-amplitude cross-section envelope is satisfied. The config and candidate input hashes are checked by the script.

Separately, the uniform smooth-sphere nuclear contact model gives the loose bound D<=1.50533511e-30. This uses the preceding proven dimensionless integral envelope 26.5 with the new W(0), not a transfer of the old coupling. These two approximations must not be added as independent contributions over the same momentum domain.

Both results are vastly below the frozen theoretical DP comparator near 0.0295; that comparator is not an observed residual or measured sensitivity. Electron terms, correlated material response and finite-gap corrections remain outside these estimates. Therefore these numbers do not exclude every response of the physical material.

Decision: the 300 MeV variant's improved raw xenon shape has not produced a useful nuclear coherence channel. Further halo-only refinement is lower priority than establishing whether a correctly matched electronic or other material response can overcome this shortfall. The same parameter set must be retained when doing that test. A hypothetical enhancement without a calculated operator and response is not a shared prediction. If no such channel survives, demote this variant rather than spending further work refining negligible nuclear rates.
