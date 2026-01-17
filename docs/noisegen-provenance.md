# Noisegen Time + Sky Provenance

Time + Sky metadata is a public provenance anchor. It is not a secret key and
should never be treated as encryption, access control, or security material.

## Three-layer model

1) Deterministic layer
- Track identity (trackId)
- Ideology context (tree id/version)
- Timeline (publishedAt, composedStart, composedEnd, timezone)
- Place (coarse location + privacy)
- Sky signature (public identifier)

2) Indeterminacy layer
- Public randomness pulse (drand, NIST beacon, CURBy)
- Studio-only ritual pulses (local sky photons, optional)

3) Accountability layer
- Store the context + pulse inputs so a RenderPlan can be replayed.

## Context (timeSky.context)

- publishedAt: epoch ms
- composedStart / composedEnd: epoch ms
- timezone: IANA label
- place: string (city or coarse region)
- placePrecision: exact | approximate | hidden
- halobankSpanId: optional linkage to Halobank timelines
- skySignature: public sky identifier (HALO-XXXX...)

## Pulse (timeSky.pulse)

- source: drand | nist-beacon | curby | local-sky-photons
- round: beacon round id (string or number)
- pulseTime: epoch ms if round is not available
- valueHash: hash of the beacon output (public)
- seedSalt: derived salt used for replay

## Seed derivation

Use the public pulse as a salt. The seed is derived from public inputs only:

seed = hash(trackId + publishedAt + location + pulseRoundOrTime + pulseValueHash)

Store the pulse round/time and valueHash with the render so the seed can be
re-derived later. The seedSalt is just a replay helper and is not secret.

## V1 pulse choice

V1 defaults to drand as the public pulse source and supports NIST beacon inputs
and CURBy when available. Local sky photons are available in Studio mode when
creators supply a derived hash (no raw sensor data required).

## Local sky photons (studio ritual)

- Derive a pulse from photon arrival timing and store the derived value hash.  
- Record the pulseTime so the same ritual can be referenced later.
- Tradeoffs: requires hardware/sensors; reproducibility depends on storing the
  derived hash, not re-reading the sky.

## Safety note

This provenance pulse is public, reproducible, and intentionally non-secret.
It does not provide security, secrecy, or cryptographic access control.
