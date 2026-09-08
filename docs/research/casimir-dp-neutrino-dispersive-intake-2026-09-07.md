# Numerical dispersive input: acquired, with unresolved normalization

Exploratory snapshot, September 7, 2026. No updated physical lifetime or detector prediction is admitted by this packet.

The [2024 study by Blackstone, Tarrus Castella, Passemar and Zupan](https://arxiv.org/html/2407.13587v1) links a public implementation in Appendix A. It treats general scalar couplings and separates the Omnes functions from low-energy subtraction inputs. The paper describes 100 phase-parameter samples, while noting that asymptotic-continuation uncertainty is not included. This is a substantially better starting point than constructing an empirical uncertainty band from the older plotted curves.

Acquisition: [author repository](https://github.com/blackstonep/hipsofcobra/tree/6a6dcfccf903317ea2104e27bb1dbbc7ad1d9fc7), pinned commit `6a6dcfccf903317ea2104e27bb1dbbc7ad1d9fc7`. The sibling directory archives the README, GPL license, unmodified source and all four numerical input files. `manifest.json` records source paths, byte counts, Git blob identities and SHA-256 hashes. No installer or upstream package runtime was run. The numerical tables are decoded with a restricted literal parser.

The four tables each contain 100 complex samples on the same 601-point grid, s = 0 to 6 GeV^2 in steps of 0.01 GeV^2. This grid extends beyond the narrow dipion slice. Its extent does not establish physical validity over the entire tabulated range.

Two checks needed for directly adopting the package are **unresolved**:

1. At s=0 the largest absolute deviations from diagonal-one/off-diagonal-zero, across samples, are c1: 0.00724345, c2: 0.0809411, d1: 0.0105989, d2: 0.119124. These are observed numerical residuals, not inferred uncertainty bars. A 1e-8 identity test fails; the actual residuals, rather than that chosen tolerance, show why an exact-normalization assumption would be inaccurate. No table is silently replaced or normalized.
2. Using the archived code's own central constants, its `GammaK0(MeanQ=True)` gives Gamma_K(0)/(m_pi^2/2) = 2.885756. Independent evaluation of the printed equations 76 and 79 gives 1.527632. The code replaces a difference of mass-weighted chiral logarithms with log(m_eta^2/m_pi^2)/(32 pi^2 F0^2), which omits the mass-squared factors. This discrepancy must be resolved before importing its subtraction coefficients. [Paper equations 76 and 79](https://arxiv.org/html/2407.13587v1#A2).

These results come from our archived-source audit, not a claim that the paper's complete phenomenology is invalid. In particular, our interpretation of the table basis and the intended public-code normalization still needs checking.

Other conventions also remain explicit: the archived code sets m_pi=0.134 GeV whereas the prior slice used 0.13957039 GeV; its relative channel factors need reconciliation with the paper's isospin projection. Our exclusive charged/neutral final-state symmetry factors must remain independently derived rather than inheriting a total-width multiplier. For the up/down-only source we need the Gamma component, not a Higgs-mixed total current or an extra gluon-source coefficient.

Next calculation: determine whether the four sampled functions are a common unnormalized fundamental basis. If they are, investigate right-multiplication by the inverse zero-momentum matrix, with a condition-number check and an explicit comparison against the raw prescription. This fixes a basis normalization algebraically, but cannot repair inaccurate phase input or numerical solutions. Use the printed NLO subtraction expressions with stated correlations and quantify the mass-convention change before integrating the pion slice. Preserve samples across s; pointwise mean-plus/minus-standard-deviation curves are not correlated samples for a width integral.

Four intake checks pass: byte identities, aligned finite monotone tables, reproduction of the audited source function, and rejection of executable table syntax. The two physics-input adoption checks remain false in the JSON. The research goal remains active; no frozen apparatus input, certified status or detector acceptance has changed.

Reproduce with `C:\Python313\python.exe docs/research/casimir-dp-neutrino-dispersive-intake-2026-09-07.py`. The sibling JSON records results. Ordinary research-document validation applies.
