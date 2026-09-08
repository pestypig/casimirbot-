# Fluctuation readout: applicability to the frozen sphere

Exploratory S1 lead assessment, September 7, 2026. No apparatus modification or sensitivity promotion.

[Murgui and Plestid, arXiv:2602.23427v1](https://arxiv.org/html/2602.23427v1), sections II-III, propose testing excess variance in atom-interferometer port populations. Their enhancement uses many atoms per run, initially prepared with independently addressable path degrees of freedom, and the one- and two-body density matrices. It concerns correlations in the measured counts. It is not an extra nuclear-coherence factor that can be multiplied into a rigid-sphere scattering rate. Their projected sensitivities assume a particular atom-cloud protocol and noise model; they are not measurements of our apparatus.

For a single rigid sphere with binary output X, X squared equals X identically. Thus Var(X)=p(1-p) for its marginal port probability p. This identity holds even if unobserved noise changes the conditional probability between trials. Measuring the one-trial variance cannot add an independent observable to that same marginal mean. Grouping repeated trials into bins can expose temporal correlations, but requires a specified correlation time and time-dependent scattering/noise model. It does not convert the sphere's roughly 1.55e10 carbon nuclei into separately read out interferometers.

A useful control calculation follows from total variance. For N outputs conditionally independent given a common run probability P, let E(P)=p and Var(P)=s_P^2. The normalized count Y obeys

Var(Y) = p(1-p)/N + (1-1/N)*s_P^2.

Therefore shared run-to-run classical fluctuations create excess variance even without dark matter. For an explicit distribution P=0.009 or 0.011 with equal probabilities and N=1e6, the variance is 1.009899e-6, versus the nominal binomial value 9.9e-9: a factor 102.01. At N=1, it is exactly p(1-p)=0.0099. These numbers were evaluated directly. This distinguishes correlated noise from the independent Bernoulli-parameter fluctuations addressed by the paper's null argument; it does not invalidate the proposal under its stated independence assumptions.

Decision: retain this as an optional future multi-object or atom-cloud readout lead, not an enhancement of the frozen single-sphere forecast. Admission would require actual separate readouts, the joint density matrix and scattering kernels from the same xenon interaction, measured common-noise covariance and a statistical power calculation. No baseline retuning or sensitivity claim follows. The shared-model goal remains open; this technique alone does not repair the small existing matched rates.
