# Velocity-width sensitivity of the p-wave Yukawa rate

Date: September 25, 2026. This brackets the earlier Maxwell-proxy average; it is not a source-specific astrophysical fit.

## Scan definition

Hold the 420 GeV mass, 0.2 attractive strength and 400 MeV mediator fixed. For each population, use untruncated Maxwell relative-speed proxies and vary the mean speed by factors 0.5, 1 and 2 around the paper's representative values (`1e-3` Milky Way, `1e-4` dwarf). Average `v^2*S1(v)` at Gauss-Laguerre orders 24 and 48, then take all nine halo/dwarf combinations.

Across these combinations, the exact Yukawa dwarf/halo rate ratio ranges from `0.03729` to `0.5864`; the Cassel Hulthen proxy ranges from `0.006615` to `0.2291`. The exact ratio stays below one across this proxy grid, so the Milky Way remains the brighter annihilation environment under the tested finite-range potential, while the exact calculation gives a larger dwarf share than Cassel in every pair. Order-24 to order-48 changes are below 1% at every tested width (see JSON).

This tests only the velocity-width sensitivity under one assumed family. It does not resolve resonances between nodes, model the Milky Way center or individual dwarf phase spaces, or compare to gamma likelihoods. Do not interpret the envelope as a confidence interval or use it to accept/reject the paper's signal explanation.

## Consequence for the boson-star connection

The ultralight mediator substitution is still qualitatively different: its unsaturated Coulomb p-wave scaling raises the relative dwarf rate as velocity falls, whereas the finite 400 MeV Yukawa branch remains halo-enhanced in this proxy range. This makes a separate ultralight star-forming component with a finite-range heavy particle the less strained architecture at this stage. Neither architecture yet provides the required same-parameter xenon plus Casimir-DP prediction; the 316 keV inelastic carbon channel remains closed.

Next replace the proxy family with truncated halo distributions and dwarf-specific kinematic models, adaptively resolve exact Yukawa peaks, and refold a common annihilation spectrum through Galactic and dwarf likelihoods. The gamma-side test must pass before expanding the shared-field branch.

## Reproduction and sources

Run `python docs/research/casimir-dp-yamashita-yukawa-speed-width-sensitivity-2026-09-25.py`. It imports the adjacent pointwise solver and requires NumPy/SciPy. All proxy means, quadrature orders, pairwise ratios and convergence checks are saved in JSON.

Sources: [Yamashita, arXiv:2609.02868v2](https://arxiv.org/html/2609.02868v2); [Cassel, arXiv:0903.5307](https://arxiv.org/html/0903.5307).
