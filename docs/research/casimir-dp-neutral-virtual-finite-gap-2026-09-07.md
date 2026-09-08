# Neutral virtual forward amplitude with finite gap

Date: 2026-09-07. Exploratory rigid-atom diagnostic; no joint prediction.

This extends the preceding Gaussian neutral-atom calculation by retaining the intermediate kinetic energy. For forward scattering write the intermediate momentum as k+p. The denominator is minus [delta+p squared/(2 mu)+v p cos(theta)]. Its angular average relative to the constant-gap approximation is delta atanh(B/A)/B, with A=delta+p squared/(2 mu), B=v p. The B=0 limit is delta/A. The chosen gaps exceed mu v squared/2, so the denominator has no pole.

Use the same illustrative rms electron radius 0.1 nm, point nucleus and massless mediator, with mu=100 GeV (static-source limit) and speed 776 km/s. Integrate the Gaussian charge kernel times this angular factor over intermediate momentum. Ratios of the forward amplitude to the previous constant-gap result are 0.9999866660 at delta=1 MeV and 0.9999949166 at 10 MeV. These correspond to reductions of approximately 0.00133% and 0.000508%.

The first unsegmented adaptive-integral comparison failed the requested refinement threshold. Segmenting log momentum into unit and half-unit intervals, with independently enlarged integration limits, resolves that issue; relative differences are below 3e-16 in the reported runs. This is numerical agreement, not a physical error budget. The script checks that each angular denominator remains pole-free and uses a stable small-argument expression.

Interpretation: the nonzero virtual forward amplitude is not an artifact of neglecting intermediate kinetic energy in this particular toy. It remains unnormalized and does not establish a decoherence rate. The finite external momentum dependence, realistic mediator mass, finite nuclear size, target excitations, atom correlations and actual diamond response are still absent. The static-source mass approximation is unsuitable for a free carbon atom and is explicitly part of the rigid-source model. The nonrelativistic point-source high-momentum tail has not been given a relativistic error budget.

Next compute finite external momentum for a specified mediator and target model, and compare xenon and carbon using the same second-order kernel. Do not apply the small correction here to nuclear recoils or assume an atom-count enhancement. The required common normalization and external constraints remain open.

Matching Python and JSON reproduce this check. No frozen apparatus values, GR code or physical certificate semantics changed.
