# Same-coupling heavy-contact response of the frozen sphere

Program gate: S1 — define and screen common scattering kernels.
Workstream: Exploratory scalar-portal comparison.
Capability or component: Local nuclear-density response screens matched to xenon.
Current maturity: Exploratory conditional bounds and limiting responses.
Target maturity: Reproducible shared-coupling comparison with explicit response gaps.
Required frozen inputs: Stage-4.2R sphere and DP comparator; authenticated matched-contact xenon results.
Required evidence: Normalization, coherence versus loss distinction, response-domain limits and common coupling scaling.
Stop/fail criteria: No independent local coupling; no addition of overlapping response approximations; no full material bound from a momentum-limited calculation.
Explicit non-goals: Full portal exclusion, measured residual, finite-temperature response completion, certification or baseline retuning.
Downstream gate unlocked: Light-sector and material-response completion; S1 remains open.

## Outcome

Using precisely the coefficient in the [matched xenon spectrum](casimir-dp-portal-contact-spectrum-2026-09-06.md), the heavy scalar nuclear interaction predicts negligible local collisional effects in both the independent-carbon and smooth rigid-sphere limits. These are different response approximations, not additive components of a solid calculation. The analysis also constructs an intentionally generous positive-density envelope to check whether merely allowing stronger nuclear coherence could reverse that result.

At 1 TeV in the central halo, even increasing the coupling to the inherited conditional xenon count ceiling gives an independent-carbon coherence-exponent bound of 1.06e-25. The frozen theoretical DP comparator is 0.0295115. This disfavors the heavy-contact component as a source of DP-sized contraction in that approximation. It does not identify a measured excess or exclude the full light-mediated portal.

## Definitions and assumptions

The frozen sphere has mass 3.0925052683774525e-16 kg, radius 276.302362 nm, separation 250 nm and hold 0.25 s. Approximate the material inventory as C12: NC = mass/(12 u), B = 12 NC effective nucleons. The approximation is explicit; no as-built isotope inventory has been supplied. Use C = 1.8017705314359717e-10 GeV^-2 and the same six halo distributions, density and three masses as the xenon packet.

For unconditioned dilute collisional evolution, each momentum kick contributes `1 − cos(q·d/ħ)` to the decoherence exponent. Since that factor is between zero and two, `D <= 2 Nscatter` without isotropizing the shifted halo or knowing the branch orientation. The bound is valid for arbitrary separation histories with this exposure; it is not an evaluation of their exact interference integral. Scattering-based interferometric searches and their sensitivity to soft momentum transfer are discussed in [Riedel and Yavin](https://arxiv.org/abs/1609.04145v2).

The four responses calculated here are:

1. **Independent stationary C12 elastic channel.** Set its nuclear form factor to one as an upper estimate within this channel: `σC <= 144 C² μχC²/π`. Multiply by NC, halo flux and hold. Free nuclei omit phonons, collective correlations and bound-target energy sharing; this is not a whole-solid upper bound.
2. **Rigid uniform continuum sphere.** Its scalar form factor is `Fs(q) = 3 j1(qR)/(qR)`. Using `dσ/dq² = C² B² Fs²/(4πv²)` and extending the positive integral beyond its kinematic endpoint bounds its rate. The exact integral is `∫dq² Fs² = 9/(2R²)`. This is a smooth elastic response, not a crystalline structure factor or an independent-nucleus contribution to add to row 1.
3. **Momentum-limited positive nuclear-density envelope.** In a one-body model `ρq = Σa ba exp(iq·ra)`, with positive charges totaling B, closure and the operator triangle inequality give `Σf |<f|ρq|i>|² <= B²`. For nonnegative energy transfer, q cannot exceed 2mχv if target recoil is relaxed. Consequently the integrated cross-section over q <= Q is bounded by `C² B² min(Q²,4mχ²v²)/(4πv²)`. Set Q = 10 MeV. This overestimates coherence without choosing lattice geometry, but covers only this specified momentum and energy-transfer sector.
4. **Formal all-q density envelope.** Replace Q by the full incident kinematic range, obtaining `σ <= C² B² mχ²/π` within that same idealized positive-density model. Momentum transfers then reach GeV scales. The extension is a diagnostic, not a demonstrated QCD response bound. It is deliberately reported separately from the 10 MeV result.

All formulas assume the Born interaction and the stated one-body scalar charge normalization. Nuclear scalar exchange currents, electron couplings and light-scalar diagrams are not included. Nonnegative energy transfer is not automatic at the actual 4 K temperature: thermal de-excitation can violate it. Rows 3–4 therefore do not bound all finite-temperature transitions. Dropping these limitations would turn a conditional screen into an unsupported whole-portal exclusion.

## Central-halo 1 TeV comparison

| Local model or envelope | D upper at matched C | D upper at conditional Xe ceiling |
|---|---:|---:|
| Independent stationary C12 elastic channel | 5.8294e-30 | 1.0565e-25 |
| Rigid uniform sphere | 3.7523e-34 | 6.8007e-30 |
| Positive density, q <= 10 MeV, nonnegative transfer | 1.6348e-20 | 2.9630e-16 |
| Formal all-q positive-density extension | 7.4075e-16 | 1.3425e-11 |

The final column multiplies each result by 18124.2, the same C-squared scale allowed by the previous *conditional* all-sample count screen. That screen assumes a 50% acceptance floor and is not an LZ likelihood. A 40% floor would increase the final-column bounds by 25%. Scaling C is a sensitivity exercise, not a demonstration that the corresponding full portal survives other constraints.

Even the formal extension lies about 2.20 billion times below the DP comparator at that ceiling. This is useful evidence about the scale of the proposed heavy nuclear mechanism, while the finite-temperature, QCD and other-channel qualifications remain essential. The [JSON results](casimir-dp-portal-local-contact-2026-09-06.json) retain all 18 mass/halo cases.

## Survival and boundary readout

These are unconditioned collisional exponents. If a kick removes the sphere from the accepted ensemble, it can reduce successful shot counts instead of the normalized visibility of surviving shots. In the Poisson channel models the probability of at least one scattering is `1 − exp(−N) <= N`; actual loss is no greater than that scattering probability. An accepted-ensemble prediction still needs the trap, trajectory and readout acceptance function. It cannot be obtained by labeling every scattering event a measured contrast loss.

The heavy contact coefficient is independent of the boundary state in this calculation. If the two boundary settings preserve matched target responses and incident flux, its multiplicative contribution cancels from the canonical four-cell cross-ratio, even when absolute contraction is nonzero. That is the conditional null already derived in the [readout map](casimir-dp-scattering-readout-map-2026-09-06.md). Boundary-induced strain or thermal changes would require explicit response changes rather than an assumed gravitational residual.

## Checks and next decision

Run `C:\Python313\python.exe docs/research/casimir-dp-portal-local-contact-2026-09-06.py`. Four checks pass: numerical verification of the sphere integral, positive and ordered momentum envelopes, ordering of limiting responses below the formal envelope, and common C-squared scaling. Inputs are hash authenticated. These checks validate the implemented mathematics, not the missing material assumptions.

The heavy component now has a same-parameter xenon/local comparison with an extremely small local signal in its limiting responses. An appreciable local effect would need a separately justified contribution from the completion's light sector or another interaction. The next discriminant is whether the matched light sector can retain an observable local response after collider, matter-coupling, finite-temperature and boundary-screening requirements are imposed, without fitting independent couplings to the two experiments. The overall prediction-model goal remains open.
