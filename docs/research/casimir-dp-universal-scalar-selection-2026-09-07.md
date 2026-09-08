# Universal scalar mass rescaling and dark-state selection

Program gate: S1. Exploratory alternative, distinct from the radial Higgs pilot.

## Concrete interaction

Consider a quadratic two-Weyl sector with mass term -psi^T M(phi) psi/2+h.c., where M(phi)=A(phi) M0, A(0)=1, A'(0)=1/Lambda. This explicitly defines universal rescaling of all entries, including the Dirac mass. It is stronger than the old radial-scalar assumption that only Majorana entries depend on the scalar. The following conclusion applies to this tree quadratic sector, not arbitrary composite transition form factors.

Choose the positive-mass Takagi basis V^T M0 V=diag(m1,m2). Then

Y_mass=V^T (dM/dphi) V=diag(m1,m2)/Lambda.

Therefore Y12=0 exactly, for any mixing or splitting in M0. Numerical floating-point residues are not nonzero transition predictions. This scalar alone cannot mediate the tree exothermic chi2-to-chi1 process previously used for xenon.

For the illustrative Lambda=500 GeV, diagonal ground-state Yukawas are 0.08 and 0.20 for 40 and 100 GeV dark masses. These are entirely different from the splitting-derived Yukawas around 1e-6 in the radial pilot. Neither the old local rates nor its scalar potential may be reused by changing a label. Lambda is a diagnostic normalization, not a coupling selected by LZ.

## How a transition can return

An explicit nonuniversal derivative term dM/dphi=(M0+epsilon sigma3)/Lambda gives a transition magnitude |epsilon mD/(D Lambda)| for the real two-state matrix used in the pilot, with D=sqrt(mD²+a²). The script checks this expression independently against the Takagi transform over six mass/asymmetry choices. This illustrates what extra structure is needed; it is not a proposed allowed parameter point. A light scalar with a transition also requires renewed real-emission decay and excited-population analysis.

Universality only in visible matter is a different possibility. It could be combined with a nonuniversal dark Yukawa matrix or the existing vector transition. The selection result does not exclude it. However, then the dark coupling and its transition/elastic relation must be specified and tested; stellar cancellation cannot determine them by itself. Such a model must predict all channels with the same parameter set and cannot independently fit one coefficient per experiment.

## Binding and remaining physics

A scalar charge proportional to total composite mass is an assumption about how all constituent and binding scales respond to the scalar. It does not follow merely from naming a coupling a dilaton or coupling to nucleon masses. [Damour and Donoghue](https://arxiv.org/abs/1007.2792) explicitly examine composition dependence from scalar couplings and nuclear binding. Their work motivates careful matching; no bound or universal cancellation is imported here.

Even an established leading dipole cancellation does not eliminate higher-multipole radiation, plasma production, ordinary forces or scalar transport. Likewise a universal scalar is not evidence that gravity caused the LZ event. The 40/100 GeV elastic alternative requires a fresh spectrum calculation rather than retaining exothermic kinematics after its transition has vanished.

## Decision

Do not pursue fully mass-aligned scalar exchange as the sole tree interaction for the existing exothermic benchmark. Preserve the visible-universal/nonuniversal-dark possibility as a distinct incomplete lead. Before a scan, specify its gauge-consistent visible matching, dark mass dependence, finite-q target charges, scalar potential and state survival. The existing vector-plus-scalar model remains conditional and does not become a successful common explanation through this replacement.

Run the companion Python file to reproduce the mass-alignment and explicit-breaking checks. It verifies diagonal Yukawas and transition magnitudes to absolute tolerance 1e-14. No frozen apparatus, runtime, GR or certificate was changed.

- `py` SHA256: `8c2f76a7166aa9c29110156f8dd6a4cd402684bdead75236cfed4a97652fce77`
- `json` SHA256: `014ec7e90426be18c4616692c60a014a57a762c2798b60f1081f853eb088e714`
