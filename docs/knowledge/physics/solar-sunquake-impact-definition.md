# Solar Sunquake Impact Definition

Sunquake impact sources are recorded as explicit source records with method-aware location semantics:

- `location_kind`: `initial_impact` or `reconstructed_source`
- `detection_method`: `doppler_impulse`, `time_distance`, or `acoustic_holography`

This separation is required because reconstructed acoustic-holography source positions can differ from initial impact locations.

## Source basis

- Kosovichev et al. (onset and source localization context): https://arxiv.org/abs/1804.06565
- HMI/Sunquake observational synthesis and source/wavefront comparisons: https://link.springer.com/article/10.1007/s11207-025-02480-6
