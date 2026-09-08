# Relativistic atomic response intake and kinematic audit

Exploratory source intake, 2026-09-07; no stopping, capture or detector-rate result is established by this packet.

The large-q nonrelativistic f-sum envelope allocates strength where a stationary free electron cannot absorb the momentum with the available energy. For m_chi=100 GeV and v=776 km/s, compare the relativistic stationary-electron recoil sqrt(me²+q²)-me with the nonrelativistic projectile ceiling qv-q²/(2m_chi):

| q | Stationary electron energy | Projectile ceiling |
|---|---:|---:|
| 37.2895 keV | 1358.77 eV | 96.5153 eV |
| 200 keV | 37745.0 eV | 517.491 eV |
| 1 MeV | 611997 eV | 2583.46 eV |

The nonzero intersection is q=2645.40 eV. This is a free stationary-electron diagnostic only. It is **not** an atomic ionization cutoff: a bound-state transition and recoiling residual system have different kinematics. Relativistic bound and continuum wavefunctions can matter strongly for slow-heavy-projectile ionization; see the [primary calculation](https://arxiv.org/abs/1509.09044). Thus neither free-electron kinematic closure nor an arbitrary high-q continuation resolves the missing silica response.

## A usable independent lead

The [AtomicIonisation repository](https://github.com/benroberts999/AtomicIonisation) contains relativistic xenon vector-coupling ionization tables. The inspected checkout is pinned at `b448a86a7660808bc5123d8a54e943e5a61994f7`. The file `tables/K_Xe_hf_v_6_hp_orth_mat.txt` contains a 256 by 1024 matrix spanning deposited energies approximately 5 eV–10 keV and momentum 100 eV–5 MeV. Its no-CR normalized SHA256 is `bcdc6de584619d833cb5e1645f7a8f81d8aa8128098935a97b0dd7f902d1c031`; the sibling receipt also records the local raw hash. There are 30720 zero entries, all values finite and nonnegative, and both axes strictly increasing.

The vector Gamma=1 operator is appropriate to the electron-density vertex of the current charge-coupled lead. K is dimensionless and includes a Hartree factor multiplying energy-normalized matrix elements; momentum is tabulated in inverse Bohr radii. Treating these as an ELF grid would give an incorrect normalization. Tables for other operators cannot be interchanged. The listed source includes xenon, argon, krypton, sodium and iodine tables; these cannot substitute for silica. An atomic calculation also does not automatically establish a solid's valence response.

The useful new test is the **xenon electron-recoil spectrum from the already fixed mediator products**. This can impose a second experimental consistency requirement alongside nuclear recoils and local coherence. Before doing that integral, derive the K-to-cross-section normalization, preserve tabulated zeros, forbid unsupported extrapolation, and characterize the L=6 multipole truncation. The example log interpolator exponentiates an outside fill of zero to one; do not inherit that behavior for rates. Coverage ends at 5 MeV, well short of the full projectile momentum range, so a covered result is not a total prediction.

Reproduce the authenticated intake and kinematics with:

    python docs/research/casimir-dp-relativistic-core-intake-2026-09-07.py PATH_TO_PINNED_ATOMICIONISATION

Research-only changes. Numerical and source assertions do not certify physical viability; no Casimir server verification applies.
