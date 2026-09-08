# Independent SMEFT beta-function audit

September 7, 2026. Exploratory boundary audit, not completed coupled evolution. The preceding leading-log packet was progress. This packet checks its source and homogeneous terms using an independent implementation and identifies omitted coupled directions.

The [wilson package](https://wilson-eft.github.io/) implements SMEFT/WET running and matching. Version 2.5.2 was installed in a temporary directory with its small missing dependencies, reusing existing numpy/scipy/pandas libraries. No repository dependency manifest was changed. The beta-function source SHA-256 is recorded in the sibling JSON. This software implements SMEFT, not our complete light-pseudoscalar EFT.

The initial bulk installation failed for lack of disk space. A read-only inspection then found no destination directory from that failed attempt. A minimal installation without bulk numerical dependencies succeeded. An attempted temporary-directory deletion was rejected by automatic approval review; no deletion was performed. This installation issue is not a physics result.

## Defined independent checks

Initialize all coefficients to zero except C_Hq^(1)=-C_Hq^(3)=yL² Pu/(4M²), with yL=0.2, M=2000 GeV. Set electroweak gauge couplings and smaller Yukawas to zero, retain gs²=4 pi times 0.108 and Gu=V0-dagger diag(0,0,yt), yt=sqrt(2)162.6/246.2. Use the full stored three-generation CKM matrix to build up and top projectors; do not zero selected down-basis elements by hand.

1. The beta function for Cqq^(1)+Cqq^(3), projected to sdsd and divided by 16 pi², agrees with yL² Pu_sd yt² Pt_sd/(32 pi² M²). This is the Lagrangian source; its Hamiltonian counterpart has the opposite sign, agreeing with the previously used -2K.
2. With Yukawas zero and a symmetric four-quark input tensor, the same projection returns the homogeneous factor 4 gs², confirming the retained VLL evolution.
3. Subtracting the zero-gs beta function verifies the QCD term -8 gs² Gu element by element.

The source value is -1.86525141e-15+i 8.47742745e-16 GeV^-2 per log(mu). Its ratio to the independent analytic expression is unity to floating-point precision. These are differential checks at the starting point, not integrations over scales.

## New coupled directions

The full gaugeless, top-only beta function also evolves C_Hq^(1,3) and generates C_qu^(1). Their maximum component derivatives are approximately 7.87e-11 and 2.62e-11 GeV^-2 per log(mu), respectively, for this diagnostic boundary. These maxima are not kaon Wilson coefficients or observable shifts. Their subsequent mixing must be integrated before assigning significance. Very small listed components near 1e-29 GeV^-2 are numerical projector-cancellation remnants, not claimed physical effects.

The current coefficients therefore need not remain constant once top-Yukawa self-running is included, even though holding them fixed was an explicit restriction of the preceding pure-QCD subset. The new C_qu^(1) direction is another reason not to describe that subset as a closed coupled system.

Next integrate the coupled equations with an explicit, versioned boundary containing both tree currents and hard four-quark matching, compare truncations, and retain the electroweak finite matching consistently. This cannot alone supply finite two-loop QCD matching, a flavor fit, or the missing light-A operators. No new eta or two-target prediction is admitted here.

## Replay

Run `C:\Python313\python.exe docs/research/casimir-dp-axion-wilson-beta-audit-2026-09-07.py`. It expects wilson 2.5.2 and dependencies under the recorded temporary installation path, authenticates the archived CKM/loop definitions, and records the actual beta source hash. All three analytic/implementation checks pass. Root-leaf documentation validation is separate; no certificate claim applies.
