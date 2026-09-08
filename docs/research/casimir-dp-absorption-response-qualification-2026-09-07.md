Program gate: S1 — common-interaction screening.
Workstream: Neutron transport response qualification.
Capability or component: Conditional acceptance test and simulation precision.
Current maturity: Exploratory response requirements, not a transport result.
Target maturity: Explicit evidence needed to evaluate the 0.04% acceptance screen.
Required frozen inputs: Archived shifted spectrum and primary normalization; original selected sample definition.
Required evidence: Complete final-state response, source provenance, cuts and simulation uncertainty.
Stop/fail criteria: No capture-efficiency substitution, invented response matrix or unqualified exclusion.
Explicit non-goals: No claim that transport has been executed or public response data do not exist.
Downstream gate unlocked: A response acquisition or simulation can be evaluated against a concrete criterion.

# Neutron-response qualification

The previous turn established a conditional raw-count acceptance ceiling. This turn searches for a reusable response and defines precisely what could test it. No directly reusable KamLAND response matrix was located in the paper, linked resources and targeted searches inspected here. That is a scoped search result, not a universal availability claim.

## Evidence located

[Meighen-Berger et al.](https://arxiv.org/html/2311.01667), section III, uses GENIE3 interactions and GEANT4 propagation, with final-state cuts and neutron captures. Its atmospheric-neutrino agreement validates that combined calculation for its input distribution. It does not by itself yield a lower acceptance bound for our different absorption final-state population. A one-dimensional neutron energy spectrum loses information needed for a direct transfer.

[Seisho Abe's KamLAND doctoral dissertation](https://www.awa.tohoku.ac.jp/Thesis/ThesisFile/abe_seisho_d.pdf), chapter 8, describes KLG4 transport and detector-specific scintillation modeling. Sections 8.1–8.2 separate low-energy neutron transport from higher-energy nuclear interactions and compare secondary-interaction cross sections with data. Its later analysis treats neutron multiplicity explicitly. These details support including secondary interactions and multiplicity in our response requirements; they do not supply the acceptance of the original 18-candidate sample for absorption.

The dissertation was downloaded and text-extracted locally for this audit. PDF SHA-256: `dd8adc7335d46e1945becfca38b0dced5ce3566a8f8e5c3b71cdd25c85beb152`. Japanese-font extraction warnings occurred; conclusions above use readable English sections, not missing text or figure digitization. The PDF remains a temporary research download rather than a committed 21 MB dependency.

[The GLG4sim project page](https://www.phys.ksu.edu/personal/gahs/GLG4sim/) describes a generic simulation derived from KamLAND software and explicitly dates its old releases. It is a possible implementation reference, not an authenticated response for the analysis at issue. No unrelated scintillator or fusion-detector matrix was substituted.

## Response needed

Use a conditional response R(selected | z), where z records the emitted nucleons and photons, their four-momenta, residual nuclear state or its sampled de-excitation products, production position and detector period. The effective acceptance is the integral of R against the normalized signal final-state distribution. Reducing z to primary neutron kinetic energy requires demonstrating that the omitted variables have been averaged with the same conditional distribution as our signal.

A usable artifact must identify:

- Generator and transport versions, interaction data, material composition, geometry and detector periods.
- Primary event distribution and weights, including residual excitation, correlated partners and de-excitation products.
- Neutron thermalization, secondary production and capture multiplicity; prompt light from all charged recoils and photons, with quenching applied to individual energy deposits.
- The original prompt and delayed energy windows, time and spatial coincidence cuts, fiducial requirements, veto/deadtime and multiplicity selection.
- Whether exposure already includes each livetime/fiducial factor, so no efficiency is applied twice.
- Numerical response probabilities with Monte Carlo counts or weighted covariance, rejected-event accounting, and validation against relevant calibration data.

High capture probability is only one conditional factor. It does not prove prompt-window acceptance or survival of the single-capture and spatial cuts. Similarly, mapping all neutron energy to one proton recoil is not a validated light-yield model for a scattering cascade.

## Statistical target for a valid simulation

At the illustrative 2.76 MeV shift, the conditional acceptance ceiling is 0.000400929. Suppose an actual simulation generates independent, unweighted events from the complete signal distribution and applies the complete selection. An exact one-sided 95% binomial lower confidence bound exceeds that ceiling for:

| Generated events | Minimum accepted events |
|---:|---:|
| 10,000 | 9 |
| 100,000 | 52 |
| 1,000,000 | 435 |

Conversely, zero accepted events in at least 7,471 such trials would put the one-sided 95% binomial upper bound below the ceiling. These are prospective precision calculations, not simulated observations. Weighted samples require another uncertainty treatment. Simulation statistical bounds do not cover nuclear/transport systematics or establish a combined confidence level with the separate 90% data screen.

The [script](casimir-dp-absorption-response-qualification-2026-09-07.py) and [JSON](casimir-dp-absorption-response-qualification-2026-09-07.json) verify threshold bracketing, exact binomial-tail inversion and the minimal zero-pass sample size. `npm run validate:physics:root-leaf` passes. No physical acceptance, exclusion or certificate is claimed.

Decision: the 0.04% requirement remains a useful conditional target, but current sources cannot establish that it is crossed. Further absorption work should acquire or construct the full response rather than infer acceptance from a mean primary energy. Other shared-interaction leads remain open in the work program; this response gap does not complete or block the overall research goal.
