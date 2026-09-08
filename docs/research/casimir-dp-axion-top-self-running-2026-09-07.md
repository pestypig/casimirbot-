# Top self-interaction running sensitivity

Exploratory snapshot, September 7, 2026. Previous turn: progress through the heavy-current boundary calculation. This packet improves the running used in the same selected flavor calculation; it does not change the apparatus, dark-sector reference point, or model-admission status.

## Result

Adding the one-loop top self-Yukawa term raises the selected imaginary kaon coefficient by **1.222887%**, from 2.70464824199e-15 to **2.73772303756e-15 GeV^-2**. Both calculations include the preceding quartic-current boundary terms. The mixed heavy-box boundary is recomputed with the corresponding high-scale Yukawa, so its high-scale input and the intervening evolution agree.

At 2 TeV the top coupling changes from 0.8032732541 in QCD-only running to 0.8500391329 with the self-interaction. The low-scale value remains 0.9340013210 at 162.6 GeV. These are declared running inputs, not newly extracted measured couplings.

## Equations and independent checks

For t=ln(mu/162.6 GeV), the restricted SM subsystem is

`d gs/dt = -7 gs^3/(16 pi^2)`;

`d yt/dt = yt [(9/2) yt^2 - 8 gs^2]/(16 pi^2)`.

These follow by setting other couplings and dimension-six feedback to zero in the installed, previously authenticated `wilson==2.5.2` SMEFT beta function. Its matrix top equation has a 3/2 self term plus the Higgs trace 3 yt^2. The [wilson project](https://wilson-eft.github.io/) documents the package; the executable local source is the authority for the implementation comparison here.

Writing U=1+c t, c=7 alpha_s(low)/(2 pi), the analytic solution used is

`1/yt(t)^2 = U^(8/7) [1/yt(0)^2 - 63/(16 pi^2 c) (1-U^(-1/7))]`.

The [script](casimir-dp-axion-top-self-running-2026-09-07.py) SHA-authenticates preceding definitions and changes the running function and affected hard boundary only in memory. The [JSON](casimir-dp-axion-top-self-running-2026-09-07.json) records four passing checks: analytic versus independently integrated scalar ODE, matrix beta agreement, coefficient integration tolerance, and unchanged low boundary. The analytic/ODE difference is below 3.7e-11 fractionally; beta agreement is below 5.1e-16. The root-leaf documentation check passes separately.

## Scope and decision

This is a self-consistent gs/yt subsystem, **not a closed full Standard Model flow**. Other couplings, including the Higgs quartic, are still imposed zero in this diagnostic even though their beta functions need not vanish. Electroweak running, electroweak input conversion, complete UV matching, independent general-flavor matching and below-weak-scale QCD remain outstanding. Numerical precision is not physical accuracy.

The 1.22% change is larger than the recent isolated finite corrections and invalidates interpreting their small size as a total uncertainty estimate. It does not resolve the earlier flavor concern or establish a revised allowed region. No xenon or local-coherence rate is updated from this kaon-only result.

Next, extend the SM trajectory with explicitly specified electroweak and Higgs inputs and audit how that interacts with the matching approximation, rather than continuing to present restricted running as complete. Preserve a side-by-side hierarchy of approximation levels when the flavor coefficient is eventually converted to the joint parameter screen. The shared-scattering goal remains active.
