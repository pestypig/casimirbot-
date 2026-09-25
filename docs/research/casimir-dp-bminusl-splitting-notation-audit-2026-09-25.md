# B-L split-scalar mass-splitting notation audit

Date: September 25, 2026. This is a source-interpretation and two-body kinematics audit. It is not an LZ likelihood reconstruction, a dark-matter detection claim, or an independent validation of the B-L model.

## The ambiguity

The 2026 Okada–Seto preprint defines real scalar eigenstates through mass-squared terms with (m_P^2-m_S^2=2\sqrt{2}A v_2), and describes the inelastic interaction through an off-diagonal (Z') current. It then says the relevant “mass splitting” is `sqrt(m_P^2-m_S^2)=O(100 keV)` and connects that scale to a shifted xenon recoil peak ([2026 preprint, arXiv:2609.06909](https://arxiv.org/html/2609.06909)). The square root of a mass-squared difference is not the physical energy gap (m_P-m_S). The earlier model paper explicitly parameterizes the splitting as (m_P-m_S) ([2019/2020 model paper, arXiv:1908.09277v2](https://arxiv.org/html/1908.09277v2)). These statements do not establish whether the 2026 notation is shorthand/typo or a different intended parameter.

## Consequence for the xenon and carbon screens

The reproducible [Python calculation](casimir-dp-bminusl-splitting-notation-audit-2026-09-25.py) and [JSON output](casimir-dp-bminusl-splitting-notation-audit-2026-09-25.json) compare both readings on the existing 1–5 TeV mass grid, at the paper's 248 keV xenon recoil and a generous 798 km/s speed cap.

If (q=\sqrt{m_P^2-m_S^2}=100\)–300 keV literally, then 
\[
\delta=m_P-m_S=\sqrt{m_S^2+q^2}-m_S\simeq \frac{q^2}{2m_S}.
\]
This gives physical gaps of only 0.001–0.045 eV across the grid. Xenon (v_{\min}) is effectively elastic, 309.6–339.1 km/s, and the quoted scale does not create the intended high-recoil inelastic shift. Endothermic carbon scattering is open kinematically, so the earlier screen's “carbon upscatter closed” result does not apply under this reading. The adjacent JSON now adds an independent-carbon collision ceiling for this open channel: assuming all local dark matter is in S, transferring the paper's 1e-45 cm² nucleon normalization, setting the carbon form factor to one and allowing maximal `D<=2` per collision still gives a largest `D` of about 3.7e-27 per frozen hold, over 24 orders below registered precision. This is a conservative event-count bound, not the material decoherence response; the q-dependent momentum transfer can only reduce which-path distinguishability in the modeled independent-nucleus picture.

If instead the quoted 100–300 keV is the physical gap (m_P-m_S), the 248 keV xenon recoil needs (v_{\min}=431)–705 km/s, consistent with the prior kinematic screen. The gap that minimizes (v_{\min}) at that recoil is about 254–278 keV over 1–5 TeV. Endothermic carbon remains closed because its maximum gap at 798 km/s is only about 39.2–39.5 keV. The previously reported excited-state exothermic carbon upper bound remains conditional on this physical-gap benchmark and the paper's nucleon-cross-section normalization.

## Disposition and next decision

Keep the existing xenon/carbon screen explicitly conditional on interpreting “O(100 keV)” as the physical mass-energy gap (m_P-m_S). Before promoting this branch to a prediction model, obtain an unambiguous benchmark (m_S,m_P) (or an author/source clarification), then regenerate both xenon and carbon observables from that same benchmark. If the literal square-root quantity is intended, discard the earlier inelastic-shift and closed-carbon claims for that parameterization and rerun the carbon fold. Neither reading makes the LZ event a confirmed detection; the preprint's interpretation remains a model fit to an event candidate, not proof of the interaction.

The calculation uses the standard inelastic-scattering (v_{\min}) and carbon threshold relations and isotope masses as listed in its JSON inputs. It does not infer the intended notation, model a detector response, or calculate rates. The unresolved source convention is now a gating uncertainty for the B-L branch, not evidence for or against a bosonic dark-matter interpretation.
