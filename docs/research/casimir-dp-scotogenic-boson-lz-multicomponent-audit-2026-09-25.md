# Scotogenic inert-scalar LZ benchmark in the bosonic multicomponent screen

Date: September 25, 2026. This intake tests a new heavy-boson lead against the existing ultralight-star, xenon, gamma-ray, and Casimir-DP compatibility requirements.

## What the paper adds

The [Scotogenic LZ paper](https://arxiv.org/html/2609.13038v1) has an explicit scalar benchmark A0866 with \(m_{\eta_R}=1080\) GeV, \(\delta=m_{\eta_I}-m_{\eta_R}=369\) keV, a 13.96 GeV charged-scalar gap, one near-degenerate right-handed-neutrino coannihilator, \(\Omega_{\eta_R}h^2=0.11919\), and an LZ working-search yield of 2.323 at the paper's reference halo. It is unusually useful for comparison because its bosonic recoil state exactly shares the leading IDM benchmark's mass and neutral splitting. It also ties the scalar sector to radiative neutrino masses and uses fermion coannihilation to alter freeze-out, with a proposed hidden \(U(1)_X\) extension to address the minimal model's solar-capture/IceCube tension.

This is a stronger heavy-component candidate than the bare IDM profile point for a *retunable abundance test*, but not yet for the full goal. Its scalar mass remains TeV scale, the right-handed neutrinos are coannihilating fermions rather than star-forming bosons, and it supplies no ultralight boson-star population or Casimir-DP coupling.

## Shared-abundance arithmetic

For a 10% ultralight component, the target is \(\Omega_\phi h^2=0.01198\) and \(\Omega_{\eta_R}h^2=0.10782\). Keeping A0866 unchanged instead gives total \(\Omega h^2=0.13117\), about 9.5 standard deviations above the adopted central \(0.1198\pm0.0012\). The exact published A0866 point therefore leaves only about 1.5% of the total abundance for \(\phi\) at the 1σ upper edge (about 2.5% at 2σ); it cannot itself be the desired 10% mixture.

The paper's approximate coannihilator degeneracy formula gives A0866 an enhancement factor 2.296 over the corresponding pure-IDM relic. Holding its scalar masses and other inputs fixed, the 10% target would need \(\Omega_{\eta_R}\) lower by 9.5%, or a preliminary effective freeze-out rate increase of 10.5%. A one-state Maxwell-Boltzmann population-weight toy maps this to an effective coannihilator weight about 0.88 of the degenerate value. Inverting the paper's full \((1+\Delta)^{3/2}e^{-x\Delta}\) weight gives illustrative \(M_N-m_{\eta_R}=4.74\)–7.31 GeV for \(x_f=30\)–20 (5.75 GeV at \(x_f=25\)). This only shows plausible *thermal leverage*: the paper does not publish A0866's singlet mass gap, flavor Yukawa matrix, or full input card, and the toy is not a micrOMEGAs relic computation.

At fixed local co-tracing, the published A0866 LZ yield would scale from 2.323 to 2.09 for \(f_{\eta_R,local}=0.90\). That is only a rate normalization, not a new likelihood fit. The paper reports that shifting its assumed lab speed from 254 to 239 km/s suppresses yields by factors of 55–585, so the halo tail remains a dominant systematic even if the abundance can be retuned.

## The other observables

- **Boson-star structure/population:** the free complex-scalar Kaup cap for a 1.08 TeV constituent is about \(1.6\times10^8\) kg, far below Sgr A*. This scalar is the xenon component; the ultralight \(10^{-17}\) eV field remains a separate star-forming component. No shared star solution is given.
- **Xenon:** A0866 is a published working-search-yield benchmark, with the same electroweak inelastic \(Z\) transition as the IDM screen. At a 369 keV gap the independent C-12 endothermic threshold is about 2,450 km/s, so the leading one-nucleus carbon channel is closed for an 798 km/s speed cap.
- **Casimir-DP:** the paper's small elastic-loop estimate is not a target-material response. The tree inelastic carbon channel is closed, and the existing IDM independent-carbon and Higgs-elastic screens remain the relevant comparators. This paper does not produce a measurable coherence prediction.
- **Astrophysical photons:** the paper acknowledges dwarf/indirect-detection pressure and says its scan applies indirect criteria, but its A0866 table does not report the present-day annihilation spectrum or a profile-specific gamma likelihood. If the Galactic-Center heavy fraction also co-traces at 0.90, fixed-shape annihilation intensity scales as 0.81; this is bookkeeping, not a gamma prediction. The benchmark cannot be identified with the separate 0.5–0.8 TeV \(b\bar b\) continuum interpretation or 43 GeV line claim without a new annihilation and likelihood calculation.

## Gate and disposition

I fetched and inspected the arXiv v1 source archive: it contains only `main.tex`, `ref.bib`, and two figures, with no benchmark card, scan samples, or numerical output. The source itself gives the coannihilation formula and says conversion is fast enough at its points, but exact A0866 reproduction cannot be reconstructed from the public files alone. The [reproducible script](casimir-dp-scotogenic-boson-lz-multicomponent-audit-2026-09-25.py) and [JSON](casimir-dp-scotogenic-boson-lz-multicomponent-audit-2026-09-25.json) keep the reported benchmark separate from derived 10%-mixture targets. The useful next calculation is now a clearly labeled proxy scan over the unknown singlet gap, followed by a full model implementation only if the authors' complete point or all required inputs can be obtained. A valid full scan must predict \(\Omega_{\eta_R}h^2=0.10782\) while preserving neutrino/flavor, elastic, collider, IceCube, BBN, and Fermi/H.E.S.S. constraints; if it survives, refold the LZ response at the predicted local fraction. Do not advance it as a boson-star/Casimir bridge unless a separate symmetry-consistent \(\phi\)-connector and material kernel also pass.

## Numerical toolchain preflight

The paper names micrOMEGAs 7.1.4. Its [official download](https://micromegasdm.github.io/downloadarea/v7.1/micromegas_7.1.4.tgz) is accessible; the 22,605,847-byte archive was fetched to a temporary directory and inspected, not run. Its bundled model list includes IDM but no Scotogenic model. The official installation page says the release was tested on Linux and Darwin. A separate [public SARAH Scotogenic model definition](https://github.com/restrepo/Scotogenic) could support generating the needed CalcHEP files, but it is not the paper's A0866 parameter card or a ready-to-run micrOMEGAs implementation.

This Windows workspace currently has Python 3.13 and CMake, but no GCC, GFortran, MSVC, or `make`. WSL lists only the stopped `docker-desktop` system distribution, and the Docker client timed out waiting for its server. So the package acquisition path is solved, while a compatible Linux/macOS build runtime and complete benchmark inputs remain open. The archive SHA-256 observed at download was `c8cf207b17541a5b7d7e7ff157f1c1eb36e1dd3f7547e7745559b195c2a34264`; this is a local integrity snapshot, not a publisher-provided signature/checksum.

The script is an audit, not a reproduction of the paper's numerical scan. Sources: [Scotogenic model and benchmark table](https://arxiv.org/html/2609.13038v1), [LZ's extended-window result](https://arxiv.org/abs/2609.02823).
