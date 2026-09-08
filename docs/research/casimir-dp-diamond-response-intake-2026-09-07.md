# Diamond response coverage and phonon tool intake

Exploratory authenticated source inventory, 2026-09-07. No new rate or physical validation.

The existing DarkELF checkout at `352149fb53b614adbac6ee242045c56be25aad29` supplies two diamond electronic dielectric grids. Both have 1,937,034 finite numeric rows, 891 energy nodes over 5.5–50 eV and 2174 momentum nodes over 0–30614.415828 eV/c. Columns are energy, momentum, real epsilon and imaginary epsilon, as in the previously inspected loader. Their headers cite Liang, Mo, Zheng and Zhang, Phys. Rev. D 104, 056009 (2021).

| File | SHA256 |
|---|---|
| Diamond_LMZZ_yambo_withLFE.dat | 467ad77324dec54c4000c10405d8b1de958e6e935ed8368d6906a390c048d229 |
| Diamond_LMZZ_yambo_noLFE.dat | cce62a651d8d624c428555e08dd2796a25dac2f73a1979db1e9bc562416f8630 |

These grids start above the configured 5.47 eV electronic gap. They cannot supply sub-eV phonon losses by extrapolation or the loader's out-of-grid defaults. The two treatments allow a local-field-effects comparison of the covered electronic channel, not an uncertainty interval enclosing all many-body physics. Use the full finite-q data rather than the optical limit, preserve the common products and fold the actual branch-separation filter. Do not double count a separately modeled electronic channel in an inclusive charge response.

The [PhonoDark repository](https://github.com/tanner-trickle/PhonoDark), inspected at commit `8ba6f9de4f6f6a1ae91806023c5fa3564bb1f0ca`, supplies a LiF material example in this checkout. It does not provide a diamond input set there. Its `light_dark_photon_born.py` selects a Born-effective-charge treatment and screening; `phonopy_funcs.py` consumes phonon structure and optional Born data. These are useful interfaces, not the missing finite-q diamond charge-transition matrix elements. The [associated EFT paper](https://arxiv.org/abs/2009.13534) explains the general framework. Substituting LiF for the canonical diamond would change the experiment and is outside this comparison.

Next evaluate the covered diamond electronic exponent for the fixed incoming population, with and without local-field effects as a sensitivity check. Keep the missing sub-eV many-body charge response explicit. A future phonon calculation requires the actual diamond force constants/eigenvectors and the appropriate charge operator, rather than only a code installation. This intake is concrete source progress, not a claim that the full material response is available.

Research documentation only; no Casimir server verification applies.
