# Arrival bound with a Yukawa tail

Date: 2026-09-07. Conditional static eikonal bound; no full field-theory exclusion.

Replace the previous hard-support assumption with a bounded tail. For Yukawa sources inside radius R, the line-integrated phase magnitude outside the sphere is at most C K_0((b-R)/lambda), where C=2 alpha Q_abs/v and lambda=hbar c/m_A. This follows from the line integral of exp(-r/lambda)/r and monotonicity of K_0. Use the sum of absolute charges, so no cancellation from atomic neutrality is required.

Split impact parameters into the union of two disks of radius B=R+lambda s and its complement. The interior contributes at most 4 pi B^2 to the decoherence cross section. Outside, (1-cos(a-b))<=(a-b)^2/2<=a^2+b^2 gives

sigma_dec <= 4 pi B^2 + 4 pi C^2 integral_B^infinity b db K_0((b-R)/lambda)^2.

This also supplies an interaction-picture norm envelope for unitary internal-state eikonal evolution when the line-integrated interaction norm obeys the same bound: use ||S_1-S_2||^2/2 and ||S-I||<=integral ||V|| dz/v. It does not establish the static potential or eikonal approximation for a full relativistic material theory.

Differentiating the bound with respect to B gives the optimal split C K_0(s)=sqrt(2). For the 300 MeV candidate's effective coupling, 12 absolute elementary charges per carbon, and frozen population/apparatus, C=4.36934918e8 and s=18.31403. At fixed C, illustrative range changes give:

| Mediator mass | Bound on D including tail |
| --- | ---: |
| 1 eV | 0.116285 |
| 10 eV | 0.00306508 |
| 100 eV | 0.000718358 |
| 300 MeV | 0.0005583443 |

Only the last row uses the candidate's mediator mass. Other rows are range diagnostics with unchanged coupling envelope, not newly normalized or laboratory-allowed models. A bound above the DP comparator establishes no achievable signal. A bound below it is informative only within the stated potential, support and incident-flux assumptions.

The numerical tail is integrated through s+100 and checked against s+60. A positive integral representation gives K_0(s+y)<=K_0(s) exp(-y), yielding an explicit bound on the omitted tail. The script checks the optimal-split equation and tail convergence and authenticates the apparatus.

Decision: an exponential tail does not rescue the short-range candidate within this broad eikonal envelope. A truly long-range force can evade this particular ceiling, but needs its own shared xenon normalization, ordinary-matter force constraints and transport calculation. Do not infer an allowed light mediator from the first row or apply this bound to arbitrarily delocalized source charges. This is a screening condition, not a complete coherence model.
