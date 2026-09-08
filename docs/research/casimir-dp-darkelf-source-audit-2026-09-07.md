# DarkELF diamond source audit

Exploratory source audit, not a rate prediction. Previous turn: progress through response-domain identification. This turn pins executable source and derives a conditional rate-to-visibility bridge. The measurable-in-both goal remains open.

## Pinned source

[DarkELF revision 352149fb53b614adbac6ee242045c56be25aad29](https://github.com/tongylin/DarkELF/tree/352149fb53b614adbac6ee242045c56be25aad29) was cloned to a temporary research directory and inspected without installing or modifying upstream code.

SHA256 receipts:

| Relative source | SHA256 |
|---|---|
| data/C/C.yaml | 1dd5e82888a7d2a87cdb623717d2add25470338d3cf5618e37069fbeea3ad2d8 |
| data/C/C_atomic_Zion.dat | 78a2ad9e519ef50ccb1e7dcda22fc62e93352fa3980def5afdf70051359868c1 |
| data/C/C_pDoS.dat | 65081e642138400cb144b55880151ff892c5edb93bba173d99896c2a62aeccff |
| data/C/C_Fn.dat | bb8459b3aac29d9a12b23c64cb10067cedd4650386cf12aaf8b61b40e077c365 |
| darkelf/multiphonon_spin_independent.py | a520c4163b2dd37a7e869814db30c00d2de59d1789b69f78984759f343aaee3d |
| darkelf/__init__.py | e3929e152615bf9d9f0d9f82974655a106815a1f00eaa482540db948adfa60f6 |

The carbon charge file has 62 rows, from zero charge at zero momentum to charge 6 at 177291 eV. The phonon density-of-states file has 100 rows, spanning 0.0210953 to 0.164250 eV. The convolution table has 750 rows and 11 columns. These file endpoints are not physical thresholds or completeness evidence. The YAML optical benchmark is 0.140 eV, unlike the separate 0.163 eV longitudinal benchmark used in the previous illustrative thermal table; do not silently interchange them.

## Integration contract

The SI differential routine sums multiplicity times effective-charge squared times C_ld, then weights by q, mediator form factor squared and mean inverse speed. Its default wrapper includes q below qBZ with n_min=2 and q above qBZ with n_min=1. Therefore the default call is not the explicitly restricted atomic-charge calculation needed here. An external wrapper must impose q>=max(qBZ,qmin), return zero if qmax is smaller, and make phonon-order selection explicit. Source inspection is not a numerical bug reproduction or an upstream defect report.

The mediator factor is (q0^2+mMed^2)/(q^2+mMed^2). The sigman normalization references the nucleon reduced mass; it must be matched to the same proton coupling used for xenon, not confused with the electron reference cross section. Retain density and velocity distribution as conditional inputs until terrestrial transport supplies them.

## Derived visibility bridge

For independent scattering, translationally equivalent branch internal states and isotropic momentum directions, the spatial decoherence exponent is D=t integral dGamma(q,omega)[1-sinc(q d/hbar)]. This is a conditional open-system approximation, not a detector-count identity for arbitrary dynamics.

With the pinned lattice spacing 3.57 angstrom, qBZ=2 pi hbar c/a=3472.9467 eV. At the frozen separation d=250 nm, every q>=qBZ obeys

`abs(sinc(q d/hbar)) <= hbar/(qBZ d) = 0.00022727326`.

For a nonnegative rate supported entirely there, D/(t Gamma) lies within 0.000227274 of one. Thus the supported high-q event rate can approximate its decoherence exponent to 0.023 percent under these assumptions. This bound avoids resolving thousands of oscillations in a first isotropic calculation. It does not establish Gamma, account for anisotropic flux, prove independent impacts, describe changing branch histories or bound omitted low-q channels. Finite mediator and material uncertainties are separate.

Reproduce the bound with `qBZ=2*pi*1973.269804/3.57` in eV and `error=1.973269804e-7/(qBZ*2.5e-7)`.

Next: execute the restricted response with explicit distribution, normalization and finite-q convergence checks; compare a unit-density local coefficient with the xenon coefficient before solving their common terrestrial population. No measurable overlap or experimental validation is claimed.
