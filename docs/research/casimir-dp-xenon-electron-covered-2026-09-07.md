# Covered xenon electron spectrum with fixed common products

Exploratory calculation, 2026-09-07. Same two-mediator products and unattenuated mono-speed source as the nuclear-recoil normalization. No detector-accepted count or exclusion is claimed.

| Mediator masses | Covered 5 eV–10 keV raw events | 100 eV–1 keV | 1–10 keV |
|---|---:|---:|---:|
| 1 keV, 1 GeV | 1.77061e6 | 818.613 | 0.0148109 |
| 100 keV, 1 GeV | 398.454 | 71.7772 | 0.0137241 |
| 10 MeV, 1 GeV | 7.81492e-6 | 3.29225e-6 | 1.81337e-7 |

Exposure is 2840 kg year; speed 776 km/s; incident number density 0.003/cm³; mean Xe atomic mass 131.293 u. These are covered atomic-model integrals, with momentum restricted to the source's approximately 100 eV–5 MeV range. The lightest pair's large total lies mainly below 100 eV. Do not equate it with detectable S1/S2 events. A liquid response and a low-energy charge-analysis acceptance are needed. The small covered 1–10 keV result is also not a bound on the omitted response.

## Normalization

The [pinned AtomicIonisation source](https://github.com/benroberts999/AtomicIonisation/tree/b448a86a7660808bc5123d8a54e943e5a61994f7) defines K = EH times the sum of energy-normalized squared atomic transition matrix elements. Thus the atomic spectral density in the delta-energy convention is S=K/EH. With potential V(q)=4 pi A(q), A=sum alpha_i/(q²+m_i²), angular integration of the Born transition rate gives

    d sigma/dE = 8 pi hbarc²/(v² EH) integral q dq A(q)² K(E,q).

This also follows from the source's heavy-projectile reference-cross-section convention: sigma_e F²=16 pi me² A², and me a0²=1/EH. The direct spectral-density derivation avoids applying a second reduced-mass factor to that convention. Electronic matrix elements already sum occupied states; no extra Z or Z² multiplies K. The amplitudes of both mediators are summed before squaring.

The sibling script asserts both the common-parameter hash and normalized source-table hash. It interpolates K linearly on log energy/momentum coordinates, preserving nonnegativity and zero nodes, and rejects out-of-grid evaluation. This interpolation can smear a shell onset between nodes; near-threshold predictions require a separate threshold/interpolation audit. It is not equivalent to a new atomic calculation. Momentum integration uses the exact endpoints of the nonrelativistic projectile energy-transfer condition, clipped to table coverage. No nuclear-recoil efficiency is applied to electron events.

Numerical refinement from 512 to 1024 subdivisions changes these integrals by at most 0.013%. That checks integration over the fixed interpolant, not interpolation accuracy, multipole convergence, atomic-to-liquid corrections, or the omitted momentum tail. Source L=6 convergence remains unaudited.

    python docs/research/casimir-dp-xenon-electron-covered-2026-09-07.py PATH_TO_PINNED_ATOMICIONISATION

## Next discriminating test

Audit shell-threshold treatment and the low-energy liquid response, then compare to a published charge-sensitive xenon search with its actual exposure, source assumptions and efficiency. Keep the common parameters fixed through that comparison. The current high-window nuclear normalization is a raw diagnostic, not an LZ likelihood fit. Capture supply and the canonical boundary-dependent coherence prediction remain unresolved. Research-only changes; no Casimir server verification applies.
