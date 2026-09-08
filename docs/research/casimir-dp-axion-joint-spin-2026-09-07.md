Program gate: S1 — common axion spin kernel.
Workstream: Shared xenon/local forward calculation.
Capability or component: Absolute leading O6 target rates with one shifted halo.
Current maturity: Conditional nuclear diagnostic.
Target maturity: Complete shared model including companion channels and detector response.
Required frozen inputs: Authenticated canonical sphere configuration and pinned response tables.
Required evidence: Free-proton normalization, isotope contraction, independent integration order.
Stop/fail criteria: No tree-channel bound promoted to a full-material bound or detector fit.
Explicit non-goals: Discovery, measured local residual, exact C13 structure or scalar/loop clearance.
Downstream gate unlocked: Companion-channel integration and matching uncertainty; S1 stays open.

# Shared axion spin-channel calculation

The preceding matching packet supplies one momentum-dependent proton/neutron coefficient pair and an approximate longitudinal C13 response. This packet folds both targets with the same shifted Maxwellian speed distribution and density 0.3 GeV/cm3. No target-specific coupling is fitted.

## Normalization and inputs

The longitudinal O6 response is identified by the nuclear EFT response decomposition in [Anand, Fitzpatrick and Haxton](https://arxiv.org/html/1308.6288), particularly equations 38 and 52–53. The archived WIMpy_NREFT WS2 hydrogen and xenon functions are pinned to commit 50581c637069305a3def3865462ef1b4ed9a616d. Only those arithmetic functions are loaded. Their SHA-256 and the frozen configuration hash are enforced on replay. These older xenon tables are diagnostic inputs, not authenticated replacements for LZ's own response matrices.

Define d0=(dp+dn)/2, d1=(dp-dn)/2 and Wd=sum(d_i d_j W_ij). Use the free-proton entry WH to normalize the spin sum:

    v^2 d sigma_A/dQ^2 = Q^4/[64 pi mchi^2 mN^2]
                         * [Wd/WH] * 2/(2JA+1).

The hydrogen contraction recovers dp^2 independently of dn. This handles the table's isospin normalization explicitly rather than silently equating its entries with another convention. For C13, replace the bracket by dn^2 kL(Q)^2, with kL from the prior p1/2 oscillator derivation. Its nuclear mass enters vmin=Q/(2 reduced_mass), whereas mN in the denominator remains the nucleon mass. Multiplication by the GeV^-2-to-cm^2 conversion occurs once.

The speed integral eta(vmin) is evaluated using speeds in km/s. The rate prefactor accordingly contains c_km^2 times 1e5 to convert eta times the velocity-independent cross section into cm/s. A second, speed-first integration independently checks the local result.

The central halo has (v0, vesc, vE)=(238,544,250.2) km/s. Five one-at-a-time variants are inherited from the prior halo audit; they are sensitivity scenarios, not probability samples. Exposure is 2.84 tonne-years for natural xenon. Local duration and C13 number follow the authenticated sphere configuration and the stated natural C13 fraction 0.0107. Independent free C13 nuclear recoils approximate the local material channel. Solid excitations, correlated spins and survival-conditioned readout are not modeled.

All rows use ma=1 GeV, gchi=1.36 and gu=5.6e-5. B0=2.7 or 3.0 GeV is an explicit matching sensitivity choice. The 1 TeV rows keep these couplings fixed and must not be described as a relic-density-matched point. C13 oscillator lengths span 1.4, 1.7 and 2.0 fm. The complete 72-row output is retained in the adjacent JSON.

## Results

Central halo, B0=2.7 GeV and bC13=1.7 fm:

| mchi | Raw Xe 5.4–269.9 keV | Raw Xe 200–269.9 keV | Local C13 count in 0.25 s | D upper bound |
|---|---:|---:|---:|---:|
| 400 GeV | 0.60181 | 0.036654 | 8.4782e-32 | 1.6956e-31 |
| 1 TeV | 0.044676 | 0.0034765 | 6.0160e-33 | 1.2032e-32 |

Xenon numbers assume unit efficiency and refer to true recoil energy. The high interval is not an LZ reconstructed event bin. These numbers neither fit the candidate nor establish its statistical incompatibility. In particular, an expectation below one does not by itself reject a model. They do show why the source's indicative event normalization cannot substitute for an independently reconstructed likelihood.

For the anisotropic halo, the local statement is only D<=2N, using 0<=1-cos(Q dot d/hbar)<=2. No isotropic sinc approximation is imported. It is an upper bound on this unconditioned independent-nuclear scattering channel; it is not a forecast of accepted-shot coherence, the complete diamond response, or the boundary-ratio observable. The theoretical DP exponent approximately 0.02951 remains a comparator, not data to be fitted.

At 400 GeV the bound per raw full-window Xe event is 2.8176e-31. A common overall coupling rescaling raises both target rates quadratically and leaves this ratio unchanged. Thus increasing this channel's normalization cannot selectively raise local coherence loss. B0 rescaling also cancels from the ratio within this LO pole model; non-pole terms need not do so.

## What this establishes and what remains

The tree O6 branch now has a reproducible conditional pair of target predictions. Its local spin contribution is far below the DP comparator at the illustrative normalization. This result does not exclude all axion-portal local signals. The radial/Higgs quartic introduces an additional scalar channel, and loops can generate further operators. Their coefficients must be used consistently in both targets. Proton/neutron matching uncertainty, improved nuclear structure, detector acceptance/likelihood and actual apparatus trajectories also remain open.

Next substantive work is to include the scalar companion using the independently derived coefficient, then determine whether loop matching imposes a nonzero contribution when the mixed quartic is reduced. Do not repeat the tree spin calculation as if its tiny result established a complete model null.

Replay: `C:\Python313\python.exe docs/research/casimir-dp-axion-joint-spin-2026-09-07.py`. Four checks pass: proton isospin recovery, two local integration orders, coupling-squared scaling, and positive nested recoil windows. Atlas build/why/upstream trace completed before additions. Physics root/leaf documentation validation passed. No runtime, certificate or physical-maturity authority is changed. The user's broader goal remains active.
