# B−L vs. LZ (O_1^s) confidence-interval cross-check

Date: September 25, 2026. This is a digitized comparison at the exact mass represented in LZ Figure 6, not a B−L-specific likelihood fit.

## Result

At (m_S=1\,\mathrm{TeV}), with the B−L paper's (g_{B-L}=0.5) and resonant-branch assumption (m_{Z'}=2m_S), Eq. 15 gives σSI,n = (2.66\times10^{-44}\,\mathrm{cm}^2). I digitized the solid 90% interval in the top panel of LZ Fig. 6 for isoscalar inelastic (O_1^s), converted its dimensionless coupling (C=(c_1^s m_\nu^2)^2) to σSI,n using LZ Eq. 6, and compared at their shared 1 TeV mass.

| Splitting | Digitized LZ 90% interval, σSI,n | B−L point in interval? |
|---:|---:|:---:|
| 150 keV | (6.74\times10^{-46}) to (1.04\times10^{-44}\,\mathrm{cm}^2) | No, above |
| 200 keV | (6.24\times10^{-45}) to (8.43\times10^{-44}\,\mathrm{cm}^2) | Yes |
| 250 keV | (3.99\times10^{-44}) to (5.35\times10^{-43}\,\mathrm{cm}^2) | No, below |
| 300 keV | (1.77\times10^{-43}) to (3.58\times10^{-42}\,\mathrm{cm}^2) | No, below |

The 200 keV point therefore supports the limited statement that the B−L 1 TeV benchmark has a coupling magnitude compatible with the broad 1 TeV (O_1^s) interval at that splitting. The reported local significance for this LZ comparator at 200 keV is 2.7σ, with a 2.6σ global significance after the look-elsewhere correction across the scan. Neither number is discovery evidence or a B−L model fit.

## What this does and does not connect

This closes one bookkeeping gap: the B−L paper's stated cross-section scale is not obviously inconsistent with the particular LZ 1 TeV interval at δ = 200 keV. But 200 keV is far above the ∼37 keV maximum physical C-12 endothermic gap under the selected halo support, so this does not rescue the proposed same-particle independent-carbon Casimir-DP bridge. The 150/250/300 keV comparisons are approximate visual digitizations, and the contour's rapid variation means they should not be used to tune a best-fit point.

The result cannot be transferred to 2.3 TeV, where the B−L formula reaches (\sim10^{-45}\,\mathrm{cm}^2): Fig. 6's inelastic (O_1^s) top panel is fixed at 1 TeV. A mass-specific LZ profile or released numeric likelihood is needed before claiming interval compatibility at the 2.3 TeV benchmark. The B−L notation for the splitting also needs clarification: the paper writes (\sqrt{m_P^2-m_S^2}=O(100\,\mathrm{keV})), whereas recoil kinematics depend on (m_P-m_S).

## Reproduction and provenance

Run `python docs/research/casimir-dp-bminusl-lz-o1si-interval-crosscheck-2026-09-25.py`. The script checks the pinned vector SVG SHA-256 and recomputes the tabulated conversions in the adjacent [JSON](casimir-dp-bminusl-lz-o1si-interval-crosscheck-2026-09-25.json). The source figure is saved as [casimir-dp-lz-fig6-o1si-source-2026-09-25.svg](casimir-dp-lz-fig6-o1si-source-2026-09-25.svg).

Sources: [LZ extended-window analysis, Eqs. 6 and Fig. 6](https://arxiv.org/html/2609.02823v1); [B−L inelastic scalar model, Eqs. 13–15](https://arxiv.org/html/2609.06909v1).
