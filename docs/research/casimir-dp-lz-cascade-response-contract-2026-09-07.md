# LZ response requirement for cascade models

Program gate: S1. Source and statistical-model audit; no reconstructed likelihood.

## Rechecked evidence

The [LZ paper](https://arxiv.org/html/2609.02823v1), Data Analysis and supplemental sections .2 and .5, selects single scatters and fits science, prompt-veto and delayed-veto samples jointly in S1c and log10(S2c). The candidate's S2 shape is consistent with a point-like interaction. Its NR response uses calibration-tuned NEST v2.4.5, with best-fit parameters assigned to the data release. The reported 96% average NR efficiency over 14–250 keV concerns its signal selection, not arbitrary cascades. Figure S2's 50% crossings are not hard true-energy boundaries.

Retrieval audit: the arXiv record still links the data release. Opening HEPData record 182472 as JSON through the web tool failed; an independent urllib request returned HTTP 403. This establishes an access failure in this environment, not absence of the public data. No table, likelihood workspace or NEST parameter release was downloaded or authenticated in this packet.

## Required forward map

For a parent composite with parameters theta, propagate its full history H: intact and released constituents, trajectories, deposit energies, positions, times, and deposits in veto regions. Define K_i(x | H, eta) as the detector's expected accepted-event density for sample i at reconstructed coordinate x, including detector nuisance parameters eta. Then the expected signal density is

s_i(x | theta, eta) = T integral dH [d Gamma_parent(theta)/dH] K_i(x | H, eta).

This is an expectation formula; it does not by itself prove a Poisson likelihood. A kernel that can yield several accepted events must retain their joint distribution for inference. Simulating just a sum of deposited energies drops precisely the information needed to classify a cascade.

For a Poisson parent stream where each parent yields at most one accepted event with category probabilities p_i, independent marking gives Poisson category counts with means Gamma_parent T p_i. This is a possible valid reduction, but p_i must come from transport and detector reconstruction. If parents can yield multiple separated accepted events, the process is generally a Poisson cluster process; an ordinary independent-event likelihood requires justification or a controlled rare-child approximation. Overlapping parents and detector deadtime add further complications.

## Simple diagnostic, not detector efficiency

Suppose a parent produces a Poisson number of perfectly resolved eligible scatters with mean nu, and the ideal selection accepts exactly one. Then p_1=nu exp(-nu), whereas the raw expected scatter count is nu. Their ratio is exp(-nu): at nu=1 it is 0.3679, and at nu=10 it is 4.540e-5. This toy has no pulse merging or veto response. It illustrates why a large recoil multiplicity can reduce single-scatter acceptance; it is not an efficiency to apply to LZ.

The same transported parent distribution must feed the local model's burst occupancy and joint momentum characteristic function. Xenon acceptance and sphere hit probabilities cannot be fitted independently while calling the parameters shared. All source populations must respect one mass-density budget.

## Next action and limits

Before promoting a composite cascade, supply a versioned detector-response release or an explicitly validated surrogate, parent-to-event multiplicity, sample-specific signal templates and uncertainty treatment. First reproduce a published ordinary single-scatter benchmark to check the implementation, then evaluate the new topology. A mean-count match or the existing raw recoil calculations cannot establish model agreement.

The data-access failure does not prevent independent microscopic screening, so the goal is not marked blocked. It does prevent an official-response or accepted-event claim from the currently retrieved material. No guessed response table or scalar average-efficiency substitution is authorized by the evidence.
