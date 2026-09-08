# Finite-momentum CP-even triangle check

Exploratory calculation, September 7, 2026. Companion to the [assembled prediction](casimir-dp-axion-assembled-subsets-2026-09-07.md); no full-model admission or change to the frozen apparatus.

The dominant calculated scalar-loop correction is insensitive to recoil momentum in the examined range. At four portal values (0.01, 0.03, 0.07, 0.1) and six momenta from zero to 0.262 GeV, its amplitude changes by at most **4.503e-6 relative to its own zero-transfer value**. This is a numerical maximum on the specified grid, not a confidence interval or a rigorous bound on the full amplitude. The upper endpoint covers the momentum of the heaviest included xenon isotope at 269.9 keV.

## On-shell extension of the archived integral

Take incoming/outgoing dark-matter momenta p and p', p²=p'²=m_chi² and (p'-p)²=-Q². Assign simplex weights x to the fermion line and y,z to the two scalar lines, with x+y+z=1. Combining denominators gives

`Delta = x² m_chi² + y m_i² + z m_j² + yz Q²`.

The shifted fermion numerator between external on-shell spinors reduces to `m_chi(2-x)` times the scalar bilinear: each external slash momentum reduces to m_chi on its adjacent spinor, and the odd shifted loop momentum integrates to zero. With y=(1-x)u and z=(1-x)(1-u), the triangle integral is

`J_ij(Q) = integral dx du (1-x)(2-x) / Delta`.

The existing cubic couplings and Yukawa rotations are unchanged. The exchanged external scalar propagator is now `1/(m_k²+Q²)`. These two changes define the finite-Q CP-even trilinear triangle subset. They do not include nucleon scalar form-factor variation, other vertex diagrams, self energies or counterterms.

For each positive kernel, Delta(0) >= (1-x)m_min² and yz <= (1-x)²/4 imply

`0 <= [J(0)-J(Q)]/J(0) <= Q²/(4 m_min²)`.

For m_min=125 GeV and Q=0.262 GeV this bound is 1.098304e-6. It applies separately to each integral, not directly to the signed sum of mixed scalar amplitudes. The full subset sum, including its external propagators, is evaluated explicitly to avoid assuming that cancellations preserve this bound.

## Evidence and implication

The [script](casimir-dp-axion-finite-scalar-triangle-2026-09-07.py) authenticates the previous zero-transfer JSON and produces [24 rows](casimir-dp-axion-finite-scalar-triangle-2026-09-07.json). Checks pass for zero-transfer recovery, the positive-kernel bound, internal-mass exchange symmetry and reversed numerical integration order (maximum relative disagreement 3.45e-15). These establish numerical and limiting consistency of this subset; they do not independently validate the full field theory.

Because this loop contribution is itself about 3% of the tree amplitude at the benchmark, its observed momentum variation is too small to change the earlier negligible-local-signal conclusion. No detector-folded forecast has been substituted for the archived contact assembly in this packet. The 1 GeV pseudoscalar boxes and hadronic matching do not inherit the heavy CP-even mass bound.

The next priority remains a justified matching prescription and the omitted gluon/counterterm contributions, followed by detector and material response. [Abe, Fujiwara and Hisano](https://arxiv.org/html/1810.01039v2) demonstrate why gluon and additional interaction terms matter in a related pseudoscalar model. Their Majorana/two-Higgs-doublet numerical coefficients are not imported into this Dirac/radial model. The finite-Q derivation and numbers above are our calculation.
