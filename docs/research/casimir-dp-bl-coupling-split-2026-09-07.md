# B-L candidate: necessary coupling-split screen

Date: 2026-09-07. Exploratory. This updates candidate priority without promoting an experimental exclusion or changing frozen inputs.

## Finding

The conditional 16.90% coherence-loss forecast in `casimir-dp-bl-eikonal-2026-09-07.md` has a serious microscopic consistency problem. Its light-mediator product requires an ordinary-matter coupling at least 3.0244e-12 if the effective dark coupling satisfies the screening criterion g_dark^2/(4 pi) <= 1. Published B-L constraint summaries indicate far smaller ordinary-matter couplings in this mass region. The large local forecast must therefore remain on hold pending a defensible coupling completion; phase resummation alone did not make the model viable.

## Normalization and algebra

Define the ordinary B-L vertex coupling as g_SM and the effective dark vertex (including dark charge) as g_dark. With potential g_dark g_SM Q exp(-m r)/(4 pi r), the frozen light product is alpha = 8.531719830643956e-13. Thus g_dark g_SM = 4 pi alpha. A large dark charge is already included in g_dark and cannot evade this product constraint while preserving perturbative dark interactions.

| Trial g_SM ceiling | Required minimum g_dark | g_dark^2/(4 pi) |
|---|---:|---:|
| 1e-15 | 10721.3 | 9.1471e6 |
| sqrt(4 pi) times 1e-15 | 3024.42 | 7.2790e5 |
| 1e-14 | 1072.13 | 9.1471e4 |

These are deliberately labeled trial ceilings, not extracted mass-dependent confidence limits. Conversely, imposing the dark perturbativity screen gives g_SM >= sqrt(4 pi) alpha = 3.0244e-12. The same light product occurs in both the 0.01 eV and 1 eV rows. Their ranges are approximately 19.73 micrometers and 0.1973 micrometers; a laboratory limit at one range cannot simply be assigned to the other.

## Source intake and conventions

[Cheng, Sheng and Yanagida, arXiv:2402.14514v2](https://arxiv.org/html/2402.14514v2) discuss existing constraints around 1e-15 over the intermediate mass interval and distinguish them from their proposed Josephson-junction sensitivity. Their displayed potential uses g_B-L squared without an explicit 4 pi. The table above therefore includes the sqrt(4 pi) conversion as well as a deliberately weaker 1e-14 trial ceiling. No curve precision is inferred from their prose. Their mediator-as-dark-matter lifetime region is inapplicable to our 100 GeV scattering-particle hypothesis and is not used.

[Lee et al., arXiv:2002.11761](https://arxiv.org/pdf/2002.11761) provide a primary laboratory inverse-square-law test at separations 52 micrometers to 3 mm, with platinum test bodies. Its stated gravitational-strength range limit is 38.6 micrometers at 95% confidence. That single number is insufficient to extract the force limit at our 19.73 micrometer range. A mass-resolved curve and composition conversion remain required; the PDF screenshot attempt failed, so no visual curve value is claimed here.

For such a recast, the magnitude of the Yukawa/gravity strength for neutral bodies is g_SM^2 f_n1 f_n2/(4 pi G m_u^2), where f_n is neutron number per atomic mass in units of m_u. Like-sign vector charges repel, corresponding to negative alpha in a potential normalized to attractive Newtonian gravity. The heavy vector's opposite dark-SM product does not cancel the light ordinary-matter force: ordinary-matter exchange involves squared SM couplings, and the 1 GeV range is microscopic.

## Decision and next evidence

Do not treat this as a globally excluded interaction, or claim a rigorously proven perturbativity boundary. The calculation rules out a perturbative split conditional on any of the trial ceilings. A genuinely strongly coupled or composite dark sector would require a new calculation of self-interactions, mediator propagation and target scattering; the existing tree-level xenon normalization cannot authenticate it.

Next obtain a primary mass-resolved laboratory recast for the lightest candidate. If it confirms the indicated gap, demote this simple B-L candidate and compare another explicit operator or population with independent normalization. Do not increase density, invoke screening or add an opposite force as an uncalculated rescue. The primary coherence and boundary observables remain distinct.

Reproduction: run the matching Python script; it authenticates the source JSON and checks product reconstruction. Results are in the matching JSON. No physical verification or certificate claim follows from these algebra checks.
