# Solar Spectral-Origin Hypothesis

In this lane, line origin is represented as a graph-style hypothesis with separate fields for:

- transition identity (`transition_id`)
- formation region (`formation_region`)
- candidate driver lineage (`driver_origin`)
- measurement region (`measurement_region`)

This avoids collapsing multi-layer physics into a single deterministic label. For example, a coronal Fe XIII line can carry a lower-atmosphere driver hypothesis when evidence supports a cross-scale lineage.

## Why this split exists

The Cryo-NIRSP Fe XIII study and the Parker Solar Probe 5-minute wave-train study indicate cross-scale continuity can be plausible, but they do not establish one-to-one event identity. CasimirBot therefore encodes remote-to-in-situ relation as hypothesis evidence, not hard identity.

## Sources

- DKIST Cryo-NIRSP Fe XIII wave/disturbance analysis: https://arxiv.org/html/2511.10880v1
- Parker Solar Probe in situ 5-minute oscillation evidence: https://arxiv.org/html/2511.10906v1
