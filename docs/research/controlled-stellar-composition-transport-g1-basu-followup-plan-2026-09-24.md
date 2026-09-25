Program gate: G1 — real calibrated solar baseline
Workstream: structural-observation source recovery
Capability or component: author follow-up for density inversion and inversion coefficients
Current maturity: reduced_order_diagnostic
Target maturity: reduced_order_diagnostic; source-recovery plan only
Required frozen inputs: September 24 author sound-speed files and validated intake, structural comparison method v1, September 24 author reply
Required evidence: authenticated density solution and averaging kernels; any inversion coefficients and their variable/reference conventions; independent numerical checks
Stop/fail criteria: no density data, incompatible source lineage, unbounded cross-term effect, absent BP04 mapping, or unresolved error/support policy
Explicit non-goals: assuming files exist, inferring cross terms from averaging kernels alone, science launch, G1 admission, G2 admission
Downstream gate unlocked: none

# G1 Basu density follow-up plan — September 24, 2026

Professor Basu replied in the existing email thread at 21:08 EDT on
September 24 (Gmail message `1a0d61b51874040e`, thread
`1a0baab29db8a967`). She said she probably has the density result and its
averaging kernels, is fairly sure she does not have the cross-term file, and
may have inversion coefficients. She asked for a reminder on Monday because
Friday would be difficult. A one-time thread reminder is scheduled for
Monday, September 28, at 09:00 America/New_York; it reminds the owner to
email her and does not send a message automatically.

## Intake branches

1. If density solution and averaging kernels arrive, retain the original
   bytes locally with hashes and provenance. Check row counts, radial grids,
   quartiles, normalization, units and Table 3 density alignment. Keep raw
   author files out of Git until reuse terms are clear.
2. If inversion coefficients arrive, identify the exact observed mode set,
   reference model, surface-term convention and structural variable pair.
   Determine whether the coefficients plus matching mode kernels permit
   reconstruction of the cross term and error propagation. Do not infer that
   coefficients alone contain those products.
3. If no cross-term product can be reconstructed, quantify its possible
   contribution through a separately justified source or model ensemble.
   If it cannot be bounded to a preregistered tolerance, retain
   `BLOCK_SOURCE_BINDING`; a primary-kernel-only residual remains diagnostic.
4. Independently recover or establish the exact BP04 sound-speed/density
   reference profiles and radius convention, then freeze reliable radial
   support, systematic-error treatment and the comparison rule before any
   candidate model is evaluated.

The [current sound-speed operator](./controlled-stellar-composition-transport-g1-sound-speed-operator-v1.md)
can be exercised on synthetic profiles while this recovery proceeds. It
cannot substitute for density, the cross term or the BP04 reference. The
structural-source manifest remains `BLOCK_SOURCE_BINDING`, with
`comparisonOperator: null`, `launchAllowed: false` and
`admissionAllowed: false`.
