# Virtual Gaussian crystal: shell convergence

Date: 2026-09-07. Exploratory ideal bulk lattice; no material prediction.

Current-state inspection confirmed that the prior four-shell overlap calculation remained the latest assembly result. This packet completes its numerical near-neighbor sum and bounds the infinite remainder.

Enumerate the eight diamond basis sites in conventional cells, lattice constant 0.357 nm. Cells from -4 through 4 in each direction contain all sites within 1 nm of the origin. There are 728 noncentral sites in that sphere. The first four shell multiplicities reproduce 4,12,12,6. Positive real-space convolution evaluates their overlaps with the same rigid Gaussian atom of rms radius 0.1 nm. The forward multiplier is 1.04793253605, compared with 1.04793197019 from four shells. Thus the omitted near shells add only 5.66e-7 to the multiplier.

For the outer bound set s=rms/sqrt(6), and J=(2-sqrt(2))/sqrt(pi). The toy potential is proportional to erfc[r/(2s)]/r. Using erfc(x)<=exp(-x squared), r squared+|r-d| squared>=d squared/2, followed by Cauchy-Schwarz on the remaining Gaussian factors, gives C(d)/C(0)<=sqrt(pi)/(2J) exp[-d squared/(16s squared)].

The minimum site separation is d_min=sqrt(3) times lattice/4. Nonoverlapping balls of radius d_min/2 bound the number of sites in each radial bin [r,r+h] by [1+2(r+h)/d_min] cubed. This loose cumulative-count bound is valid as a shell-count upper bound. Set h=0.05 nm and r>=1 nm. Multiplying by the decreasing overlap envelope bounds each bin. The log of this product is concave in r, so successive bin ratios decrease; a geometric series using the first ratio bounds the entire tail by 4.414e-13 in the amplitude multiplier.

This analytic outer bound is separate from numerical quadrature error inside the cutoff. Positive nested integrals avoid cancellation from subtracting nearly equal primitives at large distances. No confidence interval or physical uncertainty of 1e-13 is claimed. Real diamond charge density, finite mediator mass, finite-gap nonlocality, target fluctuations, surfaces and finite external momentum remain uncomputed.

Decision: the ideal bulk forward assembly benchmark is numerically stable at about a 4.7933% overlap correction. Stop treating distant shells as an unresolved enhancement. Next move to a common nuclear/atomic normalization or realistic two-density target response; no detector-normalized amplitude or coherence-loss rate follows yet.

Matching Python and JSON reproduce enumeration, overlaps and the outer bound. No frozen apparatus, GR code or certificate authority changed.
