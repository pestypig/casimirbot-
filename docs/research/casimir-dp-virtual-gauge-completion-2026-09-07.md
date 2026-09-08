# Minimal gauge completion of the virtual benchmark

Date: 2026-09-07. Exploratory conditional model definition; no allowed-region or signal claim.

The previous electron-resolvent diagnostic was progress: it quantified the failure of a shortcut, but did not complete relativistic matching. Before that matching can represent a prediction, the origin of the vector mass and excited-state splitting must be specified. [Fitzpatrick et al., PRD 106, 083507](https://journals.aps.org/prd/abstract/10.1103/PhysRevD.106.083507) provides primary context for symmetry-breaking completions of vector-portal inelastic dark matter. Its thermal benchmark is not imported here.

## Explicit conditional completion

Take Weyl fermions eta and xi with dark charges +1 and -1, a scalar Phi with charge +2, and Phi=(v_D+h_D)/sqrt(2) in unitary gauge. Define the mass terms as minus M eta xi minus (y/2)(Phi-dagger eta eta + Phi xi xi) plus Hermitian conjugate, with real equal Yukawa couplings. Define V=lambda(|Phi|^2-v_D^2/2)^2. Then

- m_A=2 g_D v_D;
- m_M=y v_D/sqrt(2), m_1=M-m_M, m_2=M+m_M;
- delta=sqrt(2) y v_D;
- m_h^2=2 lambda v_D^2.

The equality of the Majorana masses is an explicit assumption giving the purely off-diagonal vector coupling in this fermion sector. For the frozen m_1=100 GeV and delta=0.01 GeV, M=100.005 GeV. This specifies a candidate completion; it does not assert that the earlier potential already included all its interactions.

With alpha_D=g_D^2/(4 pi), alpha_EM=1/137.035999084 and kinetic mixing epsilon, the frozen effective product is alpha_eff=epsilon sqrt(alpha_D alpha_EM)=2.797331193591714e-7. Thus y=sqrt(2) g_D delta/m_A. Adopting the loose diagnostic criteria alpha_D<=1 and y^2/(4 pi)<=1 gives alpha_D<=min(1,m_A^2/(2 delta^2))=0.5, hence epsilon>=4.63101536e-6. These are chosen perturbativity screens, not measured exclusion limits or precision loop-control guarantees.

| alpha_D | epsilon | v_D (MeV) | y | m_h ceiling (MeV), lambda<=4 pi |
| ---: | ---: | ---: | ---: | ---: |
| 0.001 | 1.0355265e-4 | 44.6031 | 0.158533 | 223.607 |
| 0.01 | 3.2746224e-5 | 14.1047 | 0.501326 | 70.7107 |
| 0.1 | 1.0355265e-5 | 4.46031 | 1.58533 | 22.3607 |
| 0.5 | 4.6310154e-6 | 1.99471 | 3.54491 | 10 |

The scalar ceiling follows directly from m_h=sqrt(2 lambda) v_D and the chosen quartic ceiling. It is conditional on this minimal potential. A decoupled arbitrarily heavy radial scalar cannot be assumed at fixed coupling while retaining that criterion. A Standard Model Higgs portal is a further permitted parameter: it must be stated with a renormalization prescription, not silently treated as a free enhancement of the coherence signal.

## Consequence for the next calculation

The dark transition current has a divergence proportional to the fermion mass difference. Matching must respect the corresponding gauge identities, including the longitudinal/Goldstone sector where required. This is not a claim that every longitudinal term survives contraction with the conserved electron current. The complete electron amplitude must establish cancellations, rather than infer them from a static potential.

The common coupling product alone does not fix scalar-sector contributions, self-interactions, or cosmology. Next use this explicit completion, choose and disclose a perturbative scalar/portal benchmark, and calculate the gauge-consistent amplitude before folding the diamond response. The table leaves a parameter family; it is not a completed joint prediction. No existing xenon normalization or frozen apparatus has been retuned, and no connection to ordinary gravity or the Standard Model Higgs has been established.

The companion JSON records the algebraic scan. Reconstruction checks recover both the frozen coupling product and the mass gap to relative tolerance 1e-14. These checks do not validate the full scattering model.
