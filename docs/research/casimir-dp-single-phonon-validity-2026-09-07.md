# Single-phonon charge-response validity audit

Exploratory source audit, 2026-09-07. No new numerical phonon rate is admitted.

The [primary phonon paper, section IV.3](https://arxiv.org/html/2205.02250) restricts its atomic effective-charge treatment to momenta approximately at or above qBZ. Below this scale it requires a many-body treatment of the charge coupling; near qBZ a momentum-dependent DFT response remains necessary. It identifies diamond as nonpolar, with vanishing Born effective charge in the long-wavelength limit. These statements support keeping a polar single-phonon enhancement out of the current diamond prediction. They do not establish zero finite-q response or zero multiphonon response.

The inspected DarkELF checkout is pinned at `352149fb53b614adbac6ee242045c56be25aad29`. Its constructor defaults the phonon effective-charge file to `C_atomic_Zion.dat`. That table starts at zero effective charge at q=0, then 0.01 at q=247.96 eV. The separate `C_Zion.dat` instead starts at 4; filenames and quantities must not be interchanged. The `load_fd_darkphoton` function performs linear interpolation with endpoint fills. Availability of such an interpolator below qBZ does not establish its physical validity there.

The `_R_single_acoustic` and `_R_single_optical` helpers accept the dark-photon flag and use this effective-charge interpolation at low q. A callable helper is not independent evidence that this particular approximation represents diamond's finite-q charge response. Therefore do not obtain a claimed physical one-phonon prediction merely by enabling these helpers, or by replacing n_min=2 with n_min=1 in the earlier incoherent integral and extending its q domain downward.

The earlier q>=qBZ, energy 0.18–0.6 eV, n>=2 results retain their explicitly partial approximation status. The new finding does not retroactively validate them near the matching boundary; it explains why the omitted low-q channel requires different inputs. The earlier neutral-cell elastic envelopes are separate hypothetical elastic bounds and are not substitutes for phonon transition matrix elements.

Next required inputs are a momentum- and mode-dependent charge-transition response for diamond, phonon eigenvectors/frequencies, and their normalization into the common scattering kernel. Finite geometry and the branch-separation filter must then be applied, with thermal occupation treated consistently at the frozen 4 K apparatus temperature. A vanishing q=0 Born charge is a boundary condition, not a full finite-q response. A low-energy measured ELF could constrain inclusive charge response if its momentum coverage and conventions are suitable.

This redirects the next source intake toward actual diamond dielectric/phonon response data rather than a numerical extension of atomic charge tables. Capture supply remains another unresolved route, but no captured density is assumed here. Research documentation only; no physical viability or Casimir certification claim.
