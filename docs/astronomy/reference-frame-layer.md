# Astronomy Reference-Frame Layer

The observable-universe accordion renderer is now treated as a derived view, not the canonical astronomy storage frame.

## Canonical State

Astronomical objects should be carried in an epoch-aware inertial frame with explicit metadata:

- `frame_id`
- `frame_realization`
- `reference_epoch_tcb_jy`
- `time_scale`
- `provenance_class`
- `position_m` and/or astrometric state
- optional proper motion, parallax, radial velocity, and covariance

The current canonical frame backbone is:

- `ICRS`
- realized by `ICRF3_radio`
- realized by `Gaia_CRF3_optical`
- with epoch bookkeeping via `BCRS_TCB_epoch`

## Hidden Anchors

Quasar-like extragalactic anchors participate in frame realization and long-term stability, but they are hidden from the normal accordion UI.

They are:

- part of the frame layer
- not route targets
- counted and exposed in metadata only

## Epoch Propagation

Nearby stars are dynamic objects, not fixed points.

When astrometry is available, the pipeline propagates from the stored reference epoch to the requested render epoch using:

- proper motion
- parallax-derived distance when available
- radial-velocity perspective effects when available

When radial velocity is missing, the response surfaces that as a propagation limitation instead of pretending the state is exact.

## Derived Accordion Render

The Sol-centered accordion map remains the user-facing surface, but it is computed from canonical astronomy state.

The transform rule is:

- keep angular direction from Sol
- remap only radius by the travel-time law

This means the accordion radius law does not redefine the stored sky direction. It only changes the display radius in the derived render frame.

## Tree + DAG Separation

The frame layer distinguishes:

- frame-realization claims
- epoch-propagation claims
- render-transform claims

These are represented separately through edges such as:

- `realizes_frame`
- `anchored_by`
- `epoch_propagates_to`
- `transforms_to_render`

The goal is to keep the astronomy backbone stable before widening the visible catalog or adding corridor optimization.
