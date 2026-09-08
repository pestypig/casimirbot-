# Veto flight-time screen — 2026-09-07

Exploratory S1 kinematic prerequisite for sample transfer. Same frozen particle
model; no new efficiency or accepted-event claim.

The [LZ paper's Data Analysis section](https://arxiv.org/html/2609.02823v1)
defines prompt coincidences within +/-0.25 microseconds for Skin signals and
+/-0.30 microseconds for OD signals, with amplitude requirements. Delayed
classification has a separate time window and higher signal thresholds.
Physical correlation alone does not establish either classification.

The companion script uses the authenticated 601.121–776-km/s incident speed
interval from the single-scatter bound. For constant-speed segments, time=L/v:

| Quantity | 601.121 km/s | 776 km/s |
| --- | --- | --- |
| One-metre flight time (microseconds) | 1.664 | 1.289 |
| Path during Skin prompt half-window (m) | 0.1503 | 0.1940 |
| Path during OD prompt half-window (m) | 0.1803 | 0.2328 |

These are path-length timing scales, not distances to actual detector surfaces.
For an unaccelerated history whose speed never exceeds 776 km/s, the segment
flight time is at least L/(776 km/s). Slowing and deflection increase it for
fixed endpoint separation. Actual pulse time also includes scintillation,
photon transport, and electronics effects, so the table is not a sharp measured
veto boundary. Retain timestamps and evaluate integral ds/v(s) along each
transport history before applying calibrated timing response.

A metre-separated pair of deposits can be physically correlated without being
promptly coincident. Being outside the prompt window does not automatically
put it in the delayed sample: signal thresholds, timing conventions and
reconstruction still apply. Likewise, a deposit that is not a veto tag can
still affect event building or other selection. Do not assign every correlated
veto-volume scatter to a fitted veto sample.

This refines the preceding selection-transfer audit: the joint-sample fit
constrains events actually assigned to its samples, not every physical
interaction in a veto volume. A whole-apparatus history model must retain
positions, energies and times, then explicitly produce science, prompt,
delayed or failed-selection outcomes. No timing acceptance fraction is supplied
by this screen, and the large low-energy accompaniment remains unresolved.

Validation: upstream receipt hash and unit conversion check passed. No detector
simulation, experimental fit, proof certification or shared-model completion
is claimed.
