Program gate: S1 — common-interaction screening.
Workstream: Carbon spectral-function intake.
Capability or component: Momentum/removal-energy response and normalization.
Current maturity: Exploratory source audit.
Target maturity: Versioned nuclear-response input with explicit measure.
Required frozen inputs: Canonical experiment unchanged; archived GENIE table and loader.
Required evidence: Source identity, units, radial measure, normalization and support.
Stop/fail criteria: No unqualified neutron-response adoption or accepted-event rate from table weights alone.
Explicit non-goals: No latest-table claim, detector response, off-shell current prescription or exclusion.
Downstream gate unlocked: A legacy carbon comparison input is available for a subsequent conditional convolution.

# Carbon spectral-function intake

The previous turn produced a normalized on-shell nucleon kernel. This turn adds a public nuclear input and identifies a normalization hazard that must be resolved before convolution.

The archived [GENIE carbon table](https://github.com/GENIE-MC/Generator/blob/6a91779ea7443dc7b6ea31ad89985f23be127e4d/data/evgen/nucl/spectral_functions/benhar-sf-12c.data) identifies Benhar's carbon spectral function, lists literature references and explicitly labels this version outdated. The matching [GENIE loader](https://github.com/GENIE-MC/Generator/blob/6a91779ea7443dc7b6ea31ad89985f23be127e4d/src/Physics/NuclearState/SpectralFunc.cxx) converts momentum and removal energy from MeV to GeV and multiplies the tabulated value by momentum squared before sampling the two-dimensional distribution. It samples directions separately. Neither the table nor loader supplies an absorption detector-response matrix.

Both files are preserved byte-for-byte in the adjacent intake directory, together with repository commit, Git blob identifiers and SHA-256 hashes. The source is read for conventions; no generator code is executed.

## Independent normalization result

The table has 40 momentum centers from 10 to 790 MeV in 20 MeV steps and 80 removal-energy centers from 2.5 to 397.5 MeV in 5 MeV steps. All entries are nonnegative. Treating these as midpoint cells gives

`4 pi sum[p^2 S(p,E) dp dE] = 5.99998826`.

This is consistent with a six-nucleon spectral normalization, not unit probability. For a per-nucleon convolution, divide by the integrated normalization and multiply by the appropriate target nucleon count once. Applying both an already normalized six-nucleon spectral function and an additional factor of six without normalization would overcount by six. The agreement above is an independent check, not a rescaling imposed to obtain six.

Using the normalized distribution restricted to the table gives mean momentum 188.858 MeV and mean removal energy 40.9452 MeV. The bare radial integral is 0.477463895 in the table's units; trapezoidal integration only between centers gives 0.477074797. That difference reflects numerical support and integration prescription, not a nuclear-model uncertainty estimate. No unmeasured tails are filled or renormalized as an assertion about nature. GENIE's triangulated interpolation is not reproduced by midpoint quadrature.

## Conditional kinematic screen

For the explicitly chosen bookkeeping p_N^0=M-Erem, a massless final neutrino plus on-shell nucleon requires (m+M-Erem)^2-p^2 > M^2 and positive total energy. With m=247 MeV and M=939 MeV, 95.5391% of the normalized tabulated midpoint weight is open; 1.42654% has removal energy above 247 MeV. These are support fractions, not rates, efficiencies or percent-level predictions for a real nucleus. They omit residual recoil in the removal-energy convention, Pauli blocking, current modifications and final-state interactions. They cannot simply multiply the prior on-shell Fermi-gas rate.

Carbon-12 neutron use requires an explicit isospin prescription and proton/neutron separation-energy treatment. The table cannot automatically stand in for carbon-13 or xenon. A nuclear spectral convolution also requires specifying the off-shell current and flux conventions; substituting M-Erem into an on-shell spin trace alone does not settle that question.

Decision: retain this legacy table as a reproducible comparison lane. Seek the newer carbon spectral response, and establish removal-energy and current conventions before predicting neutron emission. The six-nucleon normalization check is immediately useful for avoiding a shared-rate error; it does not clear the model's external constraints.

## Checks

The [script](casimir-dp-absorption-spectral-intake-2026-09-07.py) reproduces the [JSON](casimir-dp-absorption-spectral-intake-2026-09-07.json). Five checks pass: SHA-256 and Git-blob integrity, regular complete grid, positivity, normalized probability and independently recovered six-nucleon integral. `npm run validate:physics:root-leaf` passes. No physical-validation or certificate claim is made.
