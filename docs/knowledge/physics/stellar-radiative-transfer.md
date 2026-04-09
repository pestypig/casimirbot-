# Stellar Radiative Transfer (Diagnostic Tier)

## Purpose

This note anchors the stellar null-model (`M0_planck_atmosphere`) hardening path at **diagnostic claim tier**. It provides a minimal closure for continuum transport and LTE/NLTE source-function handling, without claiming certified NLTE population-solver fidelity.

## 1) Radiative transfer equation

Along a ray parameterized by path length `s` and frequency `nu`, the scalar transfer equation is:

- `dI_nu/ds = -alpha_nu I_nu + j_nu`
- equivalently, in optical-depth form: `dI_nu/dtau_nu = S_nu - I_nu`

where:
- `I_nu` is specific intensity,
- `alpha_nu` is extinction/opacity,
- `j_nu` is emissivity,
- `S_nu = j_nu / alpha_nu` is the source function,
- `dtau_nu = alpha_nu ds`.

For the current diagnostic null-model hardening, opacity is used as a bounded continuum attenuation control, not a full angle/frequency coupled RT solver.

## 2) LTE source function

Under LTE closure, the source function is approximated by the Planck function:

- `S_nu^(LTE) = B_nu(T)`

This is the baseline behavior in the lane and corresponds to the default Planck-like `M0` source closure.

## 3) NLTE source function (diagnostic proxy)

In NLTE, source closure is generally:

- `S_nu^(NLTE) = j_nu / alpha_nu`

In this repository's current diagnostic implementation, NLTE is represented by a bounded proxy departure from LTE (for deterministic null-model stress testing), **not** by solving full statistical equilibrium/rate equations.

## 4) Continuum opacity role

Continuum opacity aggregates bound-free, free-free, and scattering-like contributions into an effective extinction budget for the null model. In the diagnostic `M0` hardening path, this behaves as a monotonic attenuation factor that reshapes the predicted spectrum while preserving deterministic evaluation semantics.

## 5) Diagnostic-tier claim boundary

This document supports only **diagnostic-tier** claims:

- acceptable: deterministic lane hardening, bounded NLTE proxy departures, evidence-linked RT/LTE/NLTE bookkeeping,
- not claimed: full NLTE population/ionization solvers, complete angle-dependent transfer, line-by-line inversion-grade atmospheric retrieval.

Promotion beyond diagnostic tier requires explicit additional solver, validation, and falsifier evidence.
