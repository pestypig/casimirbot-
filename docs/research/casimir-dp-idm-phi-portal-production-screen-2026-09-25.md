# IDM-to-ultralight portal production screen

Date: September 25, 2026. This tests one explicit, renormalizable connector for the leading two-component architecture. It is a kinematic compatibility screen, not a full thermal-history calculation.

## Question and model

The current leading architecture assigns boson-star structure to a complex ultralight field `phi` with `m_phi = 1e-17 eV`, and xenon recoils to the IDM-like inert doublet `X` with `m_X = 1080 GeV`. The simplest gauge-invariant quartic connector is

`L_int = -lambda_phiX |phi|^2 X†X`.

This permits `X X† -> phi phi*`. It does not mix the fields linearly or equate their cosmological abundances. If it is meant to make the heavy relic smaller while populating the light component, the products' momenta must be checked before counting them as cold dark matter.

## Result

For nonrelativistic heavy-particle annihilation at chemical freeze-out, each outgoing ultralight quantum has momentum about `m_X`. Bracketing the freeze-out parameter by `x_f = m_X/T_f = 20–30` gives `T_f = 36–54 GeV`. Entropy-conserving redshift with `g*S(T_f) = 86.25–106.75`, `g*S(today) = 3.91`, the measured CMB temperature, and Planck's `z_eq = 3402` yields:

| Quantity | Freeze-out portal products |
|---|---:|
| Present momentum | `1.56e-3–2.51e-3 eV` |
| Present momentum / `m_phi` | `1.56e14–2.51e14` |
| Momentum at matter-radiation equality | `5.31–8.55 eV` |
| Equality momentum / `m_phi` | `5.31e17–8.55e17` |

The quanta remain ultrarelativistic today and at equality. Making a freeze-out product with initial momentum about `m_X` nonrelativistic by equality would require a production temperature of about `3.0e19 GeV`, above the Planck mass. Standard IDM freeze-out therefore cannot produce the cold `phi` condensate or boson-star population in this architecture through this channel. It instead produces a relativistic component; any amount large enough to matter requires a separate dark-radiation and coupled-Boltzmann analysis.

The upstream abundance overlay requires a `10.25%` reduction of the published IDM relic to make room for a `10%` ultralight component. This portal might change the IDM abundance, but its annihilation products cannot be booked as that cold component. The cold `phi` abundance remains an independent initial-condition/production input unless a different, explicitly modeled history converts energy into low-momentum coherent `phi`.

## Decision and next gate

Demote the minimal quartic portal as a mechanism that simultaneously creates the cold boson-star field and adjusts the heavy thermal relic. It can remain a free connector in a larger model, but then it does not remove the independent `phi` abundance and adds dark-radiation constraints. The tested history does not link the boson-star population, gamma signal, xenon recoil and Casimir-DP response with a closed common parameter set.

Next construct the heavy-sector relic and photon prediction with `phi` initially separate and cold, and require the portal to satisfy the relic, structure and radiation bounds in a coupled calculation. A late-time or coherent conversion mechanism should be considered only if it specifies a source, transfer epoch, final momentum distribution, and the same xenon and interferometer couplings. Do not treat late production as automatically cold or as an explanation until those quantities are calculated.

## Reproduction and limits

Run `python docs/research/casimir-dp-idm-phi-portal-production-screen-2026-09-25.py`; it regenerates the adjacent [JSON](casimir-dp-idm-phi-portal-production-screen-2026-09-25.json), hashes and validates the upstream four-observable packet, and checks the momentum ratios and Planck-scale threshold. The freeze-out and entropy-degree brackets are illustrative, not a dedicated IDM Boltzmann solution. The calculation does not find `lambda_phiX`, solve the abundance, apply dark-radiation likelihoods, or compute star formation, gamma spectra, the xenon likelihood or Casimir-DP response.

Sources: [Planck 2018 cosmological parameters, including matter-radiation equality](https://arxiv.org/abs/1807.06209); upstream [IDM plus ultralight four-observable gate](casimir-dp-idm-phi-four-observable-gate-2026-09-25.md) and [branch verdict](casimir-dp-four-observable-branch-verdict-2026-09-25.md).
