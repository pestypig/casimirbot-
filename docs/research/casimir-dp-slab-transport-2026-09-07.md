# Repeated-collision high-recoil transport

Exploratory transport in the previously chosen infinite silica slab. This replaces the uncollided-only treatment for the strong algebraic branch, within the same point-nucleus Born model. No actual-site or detector-response claim is made.

## Algorithm and scope

Incident particles have speed 776 km/s and direction normal to the slab. The column is 4e5 g/cm^2 of Si-28/O-16, and the cross-section multiplier is the previous strong root, 126927.1891. At each step, sample the distance to collision from the current total rate; determine whether the particle exits first; otherwise sample species, recoil energy and uniform azimuth. Update speed, direction and species rates after every collision.

The recoil inverse CDF is E=b*u*Emax/[b+Emax*(1-u)], with b=mmed^2/(2mA). The lab-angle update uses exact nonrelativistic two-body kinematics. Both changes in path length and velocity-dependent cross section are retained.

Tracking stops on either slab exit or when speed falls below 601.12135 km/s, the minimum needed for a 200 keV recoil among the recorded xenon isotopes. With stationary targets and elastic collisions, subsequent collisions cannot restore that capability. This termination is sufficient for the high-window question, but does not establish capture, evaporation, thermalization or low-energy flux. No collision-count truncation remains: all histories terminate before the defensive iteration cap.

## Results and checks

Two independent runs of 30000 particles give far-side high-capability transmission fractions 0.24707 and 0.24817, each with binomial standard error about 0.00249. Transmitted median speeds are approximately 657 and 656 km/s; median collision counts are 21 and 22. Speed histograms and angular quantiles are recorded in JSON. The few zero-back-exit observations do not establish a zero probability for that outcome.

This is radically different from the uncollided fraction 7.009e-10: many repeatedly scattered particles still retain high-recoil capability. A thin-slab control of 100000 particles yields 99983 uncollided histories, consistent with exp(-tau). Recoil endpoints, positive outgoing kinetic energy, angle bounds and complete termination are checked. Independent-seed agreement assesses sampling variation, not material uncertainty. Rare uncollided events are retained analytically rather than inferred absent from the strong-branch samples.

## Raw-response consequence

The subset exiting above 650 km/s is 0.13773 or 0.13727 of incident particles. All recorded xenon isotopes at these speeds can reach 220 keV. At fixed recoil energy the matched differential cross section is proportional to 1/v^2, so its integral over 200-220 keV is at least the initial-speed value. That initial-window integral is 0.67449 of the initial 200-269.9 keV integral.

Under the same laterally uniform, optically thin detector-rate convention, retaining only this subset and setting the path-angle enhancement to its lower value of one gives an estimated raw contribution of 1.325e8 or 1.321e8 events. These are subset-based Monte Carlo estimates within the diagnostic model, not rigorous confidence limits or accepted-count bounds. The source density, exposure and coupling are the earlier ones. Detector multiple scattering, real geometry, efficiency and reconstruction remain absent.

## Decision

The strong uncollided root fails to normalize even this restricted raw transport prediction to one high-window event. Do not use it as a shared candidate without recomputing the full normalization. This finding does not exclude all stronger couplings or the full dark-photon model. It does establish that the earlier algebraic shielding construction cannot stand in for energy-angle transport.

Next compare coupling changes with this transport calculation and approximation limits before spending effort on an arbitrary captured density. A joint viable model still needs low-energy accumulation, local material response, source history, experimental constraints and accepted xenon spectrum. The full measurable-in-both objective remains active.

Reproduce with `C:\Python313\python.exe docs/research/casimir-dp-slab-transport-2026-09-07.py`. The script records upstream hashes and deterministic seeds.
