# Thresholded low-energy VLL evolution

Exploratory snapshot, September 7, 2026. Previous turn established that only VLL survives in the declared top-only approximation. This packet evolves that coefficient below the weak scale and checks leading-order scale-independent normalization.

## Result

Starting with Im C(162.6 GeV)=2.77454420929e-15 GeV^-2 and alpha_s=0.108, leading-order evolution through the diagnostic bottom and charm thresholds gives

`Im C_hat_LO = 1.63805155578e-15 GeV^-2`,

or **0.5903858192 times** the weak-scale coefficient. No borrowed eta factor is applied.

| Three-flavor EFT evaluation scale | alpha_s | Im C(mu), GeV^-2 |
|---|---:|---:|
| 2 GeV | 0.259054830 | 2.211489940e-15 |
| 3 GeV | 0.225175897 | 2.281453327e-15 |
| 4 GeV | 0.206056118 | 2.326886661e-15 |

All three give the same C_hat_LO. The last segment evolves the three-flavor EFT upward from the charm decoupling scale when necessary; it does not reactivate charm at the hadronic evaluation scale. Higher-order matching is required to control the associated decoupling logs.

## Equations and convention

For fixed nf, beta0=11-2nf/3 and gamma0=4 for the VLL operator, as in [Buras, Misiak and Urban, Eq. 2.21](https://arxiv.org/pdf/hep-ph/0005183). Then

`alpha_l = alpha_h/[1+beta0 alpha_h ln(mu_l/mu_h)/(2 pi)]`,

`C_l/C_h = (alpha_h/alpha_l)^(2/beta0)`.

Use nf=5 from 162.6 to 4.18 GeV, nf=4 down to 1.3 GeV, and nf=3 thereafter, with continuous alpha and C at these leading-order thresholds. In the three-flavor EFT,

`C_hat_LO = C(mu) alpha_s(mu)^(2/9)`;

`B_hat_LO = B(mu) alpha_s(mu)^(-2/9)`.

Their product equals C(mu)B(mu). For the PL-current convention used here, the matrix-element convention is <Q_VLL>=(2/3) fK^2 mK^2 B(mu), so M12=C(mu) fK^2 mK B(mu)/3. A full (1-gamma5)-current operator has a different factor of four. This ledger prevents mixing the two normalizations.

The existing numerical Bhat input has a higher-order definition. It must not be combined with C_hat_LO and described as a completed precision calculation. No new epsilon_K estimate is issued here.

## Checks and residual scope

The [script](casimir-dp-axion-low-qcd-evolution-2026-09-07.py) authenticates the chirality-audit JSON. An independent ODE integration checks both alpha_s and C in each segment. Analytic/ODE agreement and three-scale LO RGI invariance pass; [JSON](casimir-dp-axion-low-qcd-evolution-2026-09-07.json) records all segments.

Separate threshold diagnostics vary the bottom scale to 3.5/5 GeV or charm to 1.1/1.6 GeV, giving RGI/weak factors from 0.5896436 to 0.5912419. This narrow variation is not a total uncertainty band: higher-order anomalous dimensions, finite threshold terms and electroweak/UV scheme consistency are not included. The root-leaf documentation check passes separately.

Next align NDR finite conventions and higher-order RGI normalization with the hadronic input, then assess the resulting observable subject to the still-incomplete UV boundary. Do not multiply this evolution by the earlier approximate heavy-box eta factor. Xenon/coherence predictions and model admission are unchanged; the goal remains active.
