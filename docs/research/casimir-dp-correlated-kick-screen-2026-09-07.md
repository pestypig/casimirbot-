# Clustered arrivals and coherence: conditional statistics

Program gate: S1. Toy stochastic diagnostic; no dark-matter rate or measurable signal claim.

[Vacchini, quant-ph/0510127](https://arxiv.org/abs/quant-ph/0510127) relates momentum-transfer decoherence to characteristic functions and compound Poisson processes. We use that framework for an explicitly idealized comparison; the following burst laws are our assumptions, not a result attributed to a dark-matter model.

Let r be the mean number of actual momentum-transfer hits per time, each of magnitude q, with isotropic marginal direction, and x=q d/hbar. Keep branch separation d constant during a burst, neglect intervening dynamics, and assume a translation-covariant random-kick channel. Unclustered Poisson hits give D=r t [1-sinc(x)]. Here D=-log|C| for the ensemble-averaged coherence.

For bursts of exactly N hits arriving as a Poisson process at rate r/N:

- Independent isotropic directions within each burst give D_ind=(r t/N)[1-sinc(x)^N]. For the tested positive sinc regime, this is no larger than the unclustered value, by 1-f^N <= N(1-f) for 0<=f<=1.
- Perfectly aligned equal kicks within each burst, with isotropic direction across bursts, give D_align=(r t/N)[1-sinc(Nx)]. At Nx much smaller than one, the exponent is N times the unclustered exponent.

This is statistical direction correlation, not an assumption of quantum coherence between dark particles. It is also not implied merely by common incoming directions: the scattering kernel, impact parameters and actual transferred momenta must produce the correlations.

The script's dimensionless example x=1e-4 and N=10,000 gives D_align/(r t)=1.58529e-5 versus unclustered 1.66667e-9, a factor 9511.74. Independent burst directions give 1.66665e-9. These numbers specify no actual r and therefore no prediction of visibility loss. N counts hits on the sphere within one effectively instantaneous burst, not constituents in an incident composite. Equating those counts would be unjustified without geometry and scattering probabilities.

The aligned burst carries total impulse N q, so its squared impulse is N^2 q^2 rather than the independent mean N q^2. At fixed r its momentum-diffusion scale is consequently enhanced by N as well. There is no free coherence enhancement at unchanged mechanical response. For finite target mass, the kinetic energy imparted by net impulse, subsequent dynamics and energy supplied by the incident particles must all be included. The random-kick toy does not enforce those microscopic constraints.

## Consequence for the active lead

Arrival clustering by itself cannot rescue the loose-composite mean-rate deficit under independent kicks. A remaining concrete lead is a transported distribution with correlated momentum transfer on the same sphere during the hold. It must jointly predict burst occupancy, angular covariance, duration, heating/impulse statistics and xenon timing/multiplicity. Without those, the large toy ratio is not an admissible enhancement factor to multiply into previous rates.

An unchanged homogeneous factor still cancels from the frozen boundary-ratio statistic; directional bursts do not automatically generate a boundary dependence. Conditional phase measurements may also distinguish random phase averaging from unrecoverable entanglement-induced loss. This packet concerns unconditioned contrast only.

Validation: numerical single-hit recovery and the independent-burst inequality passed over the declared grid. The aligned example and its mechanical companion are analytic characteristic-function calculations. No experimental or physical-maturity promotion.
