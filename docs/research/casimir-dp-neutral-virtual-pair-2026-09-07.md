# Virtual neutral-atom pair overlap

Date: 2026-09-07. Exploratory toy assembly check.

Squaring U_total=sum_i U_i gives both self terms and ordered pair terms. At zero external momentum define C(d)=integral d3r U(r) U(r-d). For identical rigid Gaussian neutral atoms with a massless mediator, C(d)/C(0) is the normalized momentum integral of [1-exp(-a p squared)] squared/p squared times sinc(pd). This is an overlap correlation, not the finite-external-momentum shape of a single squared potential calculated in the preceding packet.

The matching script evaluates that oscillatory integral and independently computes the real-space radial convolution using U(r) proportional to erfc[r/(2 sqrt(a))]/r. The inner radial primitive is z erfc(z/2)-2 exp(-z squared/4)/sqrt(pi). Both methods agree to better than 3e-15 absolute for the tested overlaps.

For illustrative rms cloud radius 0.1 nm and ideal diamond lattice constant 0.357 nm, the first four shells have multiplicities 4, 12, 12 and 6, at distances 0.154586, 0.252437, 0.296009 and 0.357 nm. Their overlaps divided by the single-atom self term are respectively 0.0115212, 0.000140057, 0.0000137005 and 0.000000359293.

The per-atom forward-amplitude multiplier through these shells is 1+sum_shell multiplicity times overlap = 1.04793197. There is no extra factor of two: each neighbor enumeration already counts the ordered cross terms in the total squared potential. This is approximately a 4.8% amplitude correction, not a 4.8% coherence-loss prediction.

Because this particular real-space potential is positive, omitted shell overlaps are positive. The four-shell sum is therefore a partial sum, not an upper bound or a demonstrated converged full crystal sum. Finite surfaces reduce the neighbor counts. The result is tied to a fixed classical charge cloud and cannot substitute for the quantum two-density response, electron exchange, bonding or dielectric correlations. The lattice constant and cloud radius here are model inputs, not an as-built sample characterization.

Implication: first-neighbor overlap does not produce a large enhancement in this toy. The dominant assembled forward term is compatible with an atom-number scaling, conditional on completing the shell sum and validating the material model. No N-squared amplitude claim follows. Finite external momentum, finite mediator range and nonlocal finite-gap propagation may change the assembly.

Next complete the shell-tail convergence and use the toy only as a benchmark for a realistic common xenon/carbon kernel. A detector-normalized rate is still absent. Matching Python and JSON preserve the calculation and independent checks. No frozen apparatus, GR or certificate authority changed.
