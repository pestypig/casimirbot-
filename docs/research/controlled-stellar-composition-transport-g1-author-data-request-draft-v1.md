Program gate: G1 — real calibrated solar baseline
Workstream: structural-observation source recovery
Capability or component: unsent author inquiry for BiSON-13 inversion inputs
Current maturity: reduced_order_diagnostic
Target maturity: reduced_order_diagnostic; request ready for human review only
Required frozen inputs: G1 structural comparison method v1, frequency-source audit v1, Basu et al. 2009 Table 3
Required evidence: author/archive response with source identity, numerical operator or source-identical mode inputs, and reuse terms
Stop/fail criteria: no reply, ambiguous dataset identity, incomplete kernels, or unverified reference-model mapping
Explicit non-goals: sending a message, substituting data, running an inversion or stellar model, G1 admission
Downstream gate unlocked: none

# G1 BiSON-13 data request — unsent draft v1

Status: **draft prepared September 19, 2026; edited version sent the same day**.

Recipient: `sarbani.basu@yale.edu` — [current Yale Astronomy profile](https://astronomy.yale.edu/people/sarbani-basu).

Subject: Numerical inversion inputs for Basu et al. (2009) BiSON-13 Table 3

> Dear Professor Basu,
>
> I am preparing a reproducible comparison of solar-model sound-speed and
> density profiles with the BiSON-13 helioseismic inferences in your 2009
> *Astrophysical Journal* paper, “Fresh Insights on the Structure of the Solar
> Core.” We have the numerical values and quoted errors in Table 3, but want
> to account for the inversions' finite radial resolution and reference-model
> dependence rather than treat the tabulated radii as exact point samples.
>
> Would you be willing to share, or point us to an archive containing, the
> numerical averaging and cross-term kernels (or SOLA coefficients) for the
> BiSON-13 Table 3 sound-speed and density rows, together with the exact BP04
> reference-model profile and radial convention used? If those products are
> unavailable, the source-identical corrected 4752-day BiSON-13 low-degree
> frequency list and matching MDI-1 360-day higher-degree selection, with
> uncertainties and inversion settings, would help us reproduce the operator.
>
> Any guidance on the reliable radial domain, systematic errors, and
> correlations beyond the tabulated statistical errors would also be welcome.
> We will cite the paper and any data source you recommend. Please let us know
> your preferred attribution or reuse conditions.
>
> Thank you for considering this request.
>
> [Your name and affiliation]

The first request is the narrowest path to a fixed-reference comparison. The
frequency alternative is a fallback, not a request to regenerate analysis on
our behalf. The draft above is retained as prepared and is not a verbatim copy
of the message sent. A reply would still require provenance and numerical
validation before changing `BLOCK_SOURCE_BINDING` or the frozen G1 policy.

## Send receipt

On September 19, 2026, an edited version was sent from Danny Bruce's connected
Gmail account to `sarbani.basu@yale.edu`, with the subject above. The sent
version used first-person singular wording, added the paper DOI
(`10.1088/0004-637X/699/2/1403`), and was signed `Danny Bruce` without an
affiliation. Gmail returned message/thread ID `1a0baab29db8a967` with label
`SENT`. No reply or numerical source is recorded by this receipt; G1 remains
`BLOCK_SOURCE_BINDING`.
