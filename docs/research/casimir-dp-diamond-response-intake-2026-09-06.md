# Diamond electronic-response input: authenticated QCDark2 table

September 6, 2026. Research input acquisition and kinematic audit. No new scattering rate or experimental-admission claim. The preceding magnetic-component packet was progress: it tested a previously omitted channel with a common magnetic moment. This follow-up obtains an input for the remaining electronic channel.

## New lead

[Dreyer et al., arXiv:2603.12326v1](https://arxiv.org/html/2603.12326v1) presents all-electron RPA dielectric calculations, including diamond and microscopic local-field effects. Its discussion explicitly distinguishes density response from spin-density response: a dielectric function can describe only part of a general magnetic-dipole interaction. The paper's scalar/vector model rates must not be relabeled as full magnetic-dipole rates.

The [QCDark2 source repository](https://github.com/meganhott/QCDark2/tree/6d22f936bf49a15db73a24d1274dcc63c37780dd) supplies precomputed diamond data. We downloaded the composite table at that exact revision and verified its Git blob hash `640fbe133a393318e97b9b3856cc869cf309f142`. The upstream license, dielectric README and rate-source file are preserved alongside it. Upstream rate code has been inspected for units but not executed or installed. The local archive is 24,062,232 bytes for the HDF5 alone.

## Data contract

The HDF5 contains epsilon on a 1001 by 1501 grid. Its momentum axis is in alpha*m_e and its energy axis is in eV. Actual stored momentum centers run from 0.01 to 20.01 alpha*m_e, corresponding to 37.289 eV/c to 74.616 keV/c with the upstream constants. Energy runs from 0 to 150 eV in 0.1-eV increments. Preserve those actual centers rather than replacing them with endpoints stated in prose.

The upstream composite-data README specifies local-field effects through 12 alpha*m_e, with the no-local-field calculation above that point. This is not a uniform-accuracy table over the full grid. The upstream material calculation uses a scissor-corrected 5.5-eV gap. It represents bulk crystalline diamond, not the measured electronic state, defects, surface termination or boundaries of the frozen nanosphere.

The energy-loss function is Im[-1/epsilon]. All stored dielectric values are finite. There are 17,741 negative loss-function entries, with minimum about -1.39e-18, consistent with numerical roundoff at the tested tolerance; they have not been silently clipped in the archive. A future rate implementation must explicitly record its treatment of these entries, thresholds and interpolation. The mass and volume per cell are also stored; their units are eV and inverse-Bohr cubed respectively, not kilograms and cubic metres.

## Kinematic relevance

For nonrelativistic dark matter with mass m and speed v, an electronic energy transfer omega requires

\[
\omega\le qv-q^2/(2m),\qquad
q_-\le q\le q_+,\quad q_\pm=m\left[v\pm\sqrt{v^2-2\omega/m}\right].
\]

The replay evaluates the lower root as 2 omega/[v+sqrt(v²-2 omega/m)] to avoid cancellation error. At 100 GeV, 776 km/s and omega=5.5 eV, q_-=2.125 keV/c, corresponding to qR/hbar about 2975 for the frozen sphere. Thus an above-gap electronic excitation does not probe the qR<=80 soft sector examined in the earlier charge-screening packet. This explains why that packet could not bound the electronic channel. It does not imply that all electronic scattering is coherent across the sphere.

All twelve tested combinations of 100/1000 GeV, 776/809.1 km/s and 5.5/30/150 eV have kinematic overlap with the table. None has its entire kinematically allowed momentum interval covered. Kinematic support extending outside the grid is not proof that the omitted rate is large, but it prohibits declaring the table's finite-domain integral a complete rate without a tail analysis. Defect or phonon-assisted/sub-gap processes also cannot be inferred from this gap-only screen.

## Next calculation

Derive the density-channel magnetic-dipole kernel in conventions compatible with this dielectric table, with the same mu_chi used for xenon. Apply a finite-grid integration and report its coverage, screening prescription and cell normalization. Source or bound the spin-density contribution separately. Do not use the software's default vector/scalar reference cross section as though it were a matched magnetic moment. The density component can be calculated without inventing the missing spin response; it must remain labeled as a component.

Replay: `python docs/research/casimir-dp-diamond-response-intake-2026-09-06.py`. Adjacent JSON records six passing hash, array, passivity and kinematic checks, twelve support cases and SHA-256 values for the archived files. Atlas build/why/upstream trace and root-leaf validation passed. No frozen apparatus, runtime, adapter, constraint, certificate or hardware changes. The shared prediction goal remains active.
