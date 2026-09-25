# Pointwise p-wave Yukawa cross-check for the LZ-plus-gamma benchmark

Date: September 25, 2026. This packet checks the pointwise Sommerfeld factors only; it is not a velocity-averaged prediction.

## What was calculated

For the paper parameters `mX=420 GeV`, `alpha_eff=0.2`, and `m_phi=0.4 GeV`, this script evaluates both Cassel's Hulthen analytic approximation and the exact attractive Yukawa radial Schrödinger equation at the paper's listed relative speeds. The Cassel approximation reproduces the paper table: `S1=6.11` at freeze-out, `1.288e7` in the halo, and `3.066e7` for dwarfs (source rounded values: `6.1`, `1.3e7`, `3.1e7`).

The exact pointwise Yukawa integration instead gives `S1=6.106` at freeze-out, `4.121e7` in the halo, and `4.659e8` at the listed dwarf speed. With `sigma*v proportional to v^2*S1`, the exact pointwise dwarf-to-halo rate ratio is `0.1131`, compared with the source table's `0.0241`; anchoring the exact pointwise ratio to the quoted halo rate would imply a dwarf rate near `3.053e-25 cm^3/s`. These are diagnostic values at single speeds, not a corrected astrophysical prediction.

## Why the methods differ

The direct solver integrates the unapproximated Yukawa potential and extracts the p-wave Sommerfeld factor from the asymptotic scattering amplitude. The solver is converged against a threefold change in maximum integration step. At these strong attractive couplings, the pointwise answer can be sensitive to narrow p-wave resonances. Cassel's paper notes that its Hulthen approximation has limited accuracy for p-wave Yukawa resonances; Yamashita explicitly states that narrow resonances are not included and that velocity averaging may smear them. Thus the source numbers are internally reproduced by its stated approximation, while this independent pointwise solve exposes the need to average before using a rate.

The direct next calculation is to integrate `v^2*S1(v)` over explicitly stated halo and dwarf relative-speed distributions, including convergence under velocity-grid refinement and comparison against Cassel's approximation. A source-faithful calculation also needs the distributions/averaging convention used in the benchmark; until then, neither pointwise curve selects the physical branch.

## Reproduction and sources

Run `python docs/research/casimir-dp-yamashita-yukawa-pointwise-crosscheck-2026-09-25.py`. The adjacent JSON stores the equation, parameters, results, solver counts, checks and validity limits. Requires NumPy and SciPy.

Sources: [Yamashita, arXiv:2609.02868v2](https://arxiv.org/html/2609.02868v2) (Table 1 and the stated treatment of resonance/velocity averaging); [Cassel, arXiv:0903.5307](https://arxiv.org/html/0903.5307) (Sommerfeld definition, Hulthen approximation, numerical Yukawa results and limitations).
