# IDM abundance and conditional LZ scaling with an ultralight component

Date: September 24, 2026. This is a reproducible abundance-budget sensitivity screen, not a coupled cosmological solution or LZ likelihood fit.

## Question and inputs

The IDM LZ profile paper reports a best-fit point with `Omega_H h^2 = 0.12014`; it adopts `Omega_DM h^2 = 0.1198 +/- 0.0012`. The paper's xenon rate assumes H supplies the local dark-matter density, and it states that a complete LZ likelihood reconstruction needs additional detector-level information that is not public ([source](https://arxiv.org/html/2609.06571)).

For an assumed cosmological ultralight fraction `f_phi`, the simple two-component abundance budget requires

`Omega_H h^2 = (1 - f_phi) Omega_DM h^2`.

The following table gives the H abundance required relative to the paper's IDM profile point. If the local H fraction traces its cosmological fraction, the same numbers are the conditional LZ rate ratios at fixed electroweak interaction, velocity distribution, total local density, and detector response.

| Assumed `f_phi` | Required H / published IDM abundance, Planck central | Planck `-1 sigma` to `+1 sigma` range |
|---:|---:|---:|
| 0% | 0.997 | 0.987–1.007 |
| 1% | 0.987 | 0.977–0.997 |
| 5% | 0.947 | 0.938–0.957 |
| 10% | 0.897 | 0.888–0.906 |
| 25% | 0.748 | 0.740–0.755 |
| 50% | 0.499 | 0.494–0.504 |

Thus a 10% cosmological star-field fraction would require roughly a 10% reduction in the IDM abundance and, under co-tracing, roughly a 10% reduction in its xenon signal normalization. A 50% star-field component would halve that normalization. These are tradeoff factors, not statements that either modified point remains favored by the LZ data.

## What this does and does not establish

This check makes the abundance cost explicit, but does not resolve the local fraction. Boson stars, diffuse ultralight field, and unbound H can cluster differently; `f_H,local` must come from the structure-formation and Galactic-population calculation. The only direct conditional rate law is `R_LZ proportional to rho_H,local` with the electroweak Z coupling and all other inputs fixed.

The source paper's best-fit benchmark nearly saturates the adopted total abundance, so a substantial ultralight component cannot be added while keeping that same relic point. It must emerge from a coupled abundance history that lowers `Omega_H`, then predict the local unbound-H flux and velocity distribution. The LZ paper's published profile does not let this arithmetic be converted into a validated profile-likelihood contour; the detector-level response is a stated missing input.

The [Python script](casimir-dp-idm-ultralight-fraction-scaling-2026-09-24.py) emits the [JSON table](casimir-dp-idm-ultralight-fraction-scaling-2026-09-24.json). It uses the source benchmark and Planck uncertainty bracket directly, with no fitted parameters.

## Next falsifiable gate

Specify a symmetry-protected ultralight/H portal and cosmological history, calculate `Omega_H` and `Omega_phi` together, and predict the local decomposition after star formation. Reject points that overproduce total dark matter, erase the free-H high-velocity tail needed for Xe upscatter, or destabilize the chosen star solution. Only then test the rescaled xenon likelihood. Keep the gamma-ray and Casimir-DP likelihoods separate until the same surviving parameters predict each observable.

Status: conditional scaling verified; no coupled abundance solution, local fraction, revised LZ likelihood, stable new boson-star family, gamma spectrum, or common four-observable prediction has been established. The overall goal remains active.
