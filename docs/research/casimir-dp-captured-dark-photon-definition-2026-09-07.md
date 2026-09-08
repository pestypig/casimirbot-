# Next shared-kernel test: asymmetric captured dark photon

Program gate: S1.
Workstream: Measurable overlap through a naturally supplied fast and slow population.
Capability or component: Charge-matched scattering and coupled terrestrial transport.
Current maturity: Exploratory model definition; no selected allowed parameter point.
Target maturity: Reproducible screening of both target responses with linked populations.
Required frozen inputs: Canonical sphere and branch histories; authenticated halo, material and detector inputs.
Required evidence: Neutral response, capture/transport, local density and surviving high-energy flux from one interaction.
Stop/fail criteria: No independent density fitting, missing electron cancellation, source substitution or unqualified local sensitivity.
Explicit non-goals: No CASPAR attribution, apparatus retuning, detection claim or proof promotion.
Downstream gate unlocked: None until S1 evidence is satisfied.

## Explicit model

[McKeen et al., 2202.08840v2](https://arxiv.org/html/2202.08840v2), section V.2, equation 30, specifies a Dirac fermion coupled to a massive dark photon with hypercharge kinetic mixing. An asymmetric relic population is considered to permit terrestrial accumulation. We use this as a model definition, not an import of its dated allowed regions, density enhancement, accelerator geometry or benchmark cross sections.

At low energy the leading electromagnetic portal has couplings g_D to dark matter and epsilon e to the electromagnetic current. Parameters requiring specification are m_chi, m_Aprime, g_D, epsilon, primordial particle/antiparticle abundance, halo phase-space distribution and terrestrial material/history. Capture, evaporation, sinking and annihilation where relevant determine the slow population; transport determines the surviving fast population. Both are outputs of the same specification. No acceleration source is supplied here.

## First test: charge response before density enhancement

For an assumed neutral, isotropic elastic atom, normalize F_N(0)=1 and the electron-number form factor F_e(0)=Z. The charge-density kernel is proportional to

g_D epsilon e [Z F_N(q)-F_e(q)]/(q^2+m_Aprime^2).

The leading constant term cancels. In a small-q expansion with finite mean-square radii, the bracket becomes Z q^2 [<r_e^2>-<r_N^2>]/6 plus higher terms. This is our conditional electromagnetic matching statement, not a full diamond response calculation. At finite mediator mass the leading neutral elastic amplitude is suppressed at q tending to zero. For a mediator lighter than q, its propagator can cancel that q^2 scaling; the actual momentum interval and external bounds still matter.

Do not replace the bracket by baryon number or use nuclear Z alone for the low-q neutral sphere. Conversely, do not impose atomic elastic screening on all hard nuclear recoils or inclusive electronic excitations. Crystal response, polarization, magnetic currents, inelastic channels and any measured net sphere charge need separate terms. Neutrality is a declared initial model assumption; the apparatus's actual charge state has not been authenticated.

## Ordered calculations and falsifiers

1. Compute the neutral elastic sphere kernel with a sourced electron-density response; identify the q interval and convergence. Check q=0 neutrality and the nuclear-resolved limit. This determines whether the local coupling can plausibly help before a large transport simulation.
2. Calculate energy and momentum transfer in rock using the same mediator, with screening and finite-q effects. Reconcile accumulation with survival of the fast component capable of hard Xe recoil. A large total cross section is not automatically a large stopping cross section.
3. Solve or bound the populated slow distribution at the specified laboratory location and chamber, including particle budget and time dependence. Do not multiply halo density by an arbitrary enhancement factor.
4. Fold the fast distribution through Xe and its detector response, and the slow plus fast distributions through the frozen coherence histories. Include impulse/heating, approximation limits and uncertainty. A small-local-signal result becomes a control, not fulfillment of the user priority.

This is the next bounded screen, not a declaration that the branch is more likely to be real. The previous compact-composite, independent-burst and contemporaneous-CASPAR failures remain closed under their stated assumptions. Extended scalar mechanics remains a separate unresolved route requiring qualified dynamics and medium response.
