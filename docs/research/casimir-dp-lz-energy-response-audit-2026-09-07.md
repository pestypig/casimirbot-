# LZ energy-response inputs and transport support

Exploratory source audit. This corrects an overly broad limitation in earlier packets: the public paper itself contains the tuned NR parameters, even while the data-release endpoint is inaccessible here.

## Retrieved evidence

[LZ supplemental section .4, Table S5 and equation 5](https://arxiv.org/html/2609.02823v1#A1.SS4) gives the analysis NR parameters for NEST 2.4.5. It describes the high-energy charge-yield modification needed to reconcile DD and AmBe calibration regions. The exponent is 0.5 up to 74.7 keV and 0.5+0.0230*ln[1+0.0289*(E-74.7)] above that energy. The candidate is described in S1c and S2c, and its quoted statistical/systematic energy uncertainties do not specify a universal forward response function.

The companion JSON transcribes all Table S5 analysis values; the Python file checks continuity and monotonicity of the stated exponent. These are not standalone yield predictions. Other detector parameters, fluctuations, selection and nuisance treatment are required to map deposited energy to observables.

The arXiv record still links the data release. A new direct JSON request to HEPData record 182472 returned HTTP 403; web opening and DOI traversal also failed. No release tables were downloaded. This is an access limitation, not evidence that the release is absent. The table transcription is independent progress despite that limitation.

## Consequence for the current model

The previously reported approximately 0.001 raw event in the 240-260 keV true-recoil bin cannot be read as the expected number of events reconstructed near the candidate. A response kernel can move events between energy regions. Combining the two quoted 23-keV errors in quadrature and applying that width to every recoil would introduce an unauthenticated detector model. Systematic response variations must retain their nuisance interpretation and correlations.

There is also a transport-support issue: our current histories stop when no true recoil above 200 keV is possible. That stopping rule is valid for the raw high-window integral only. It is not valid for an accepted/reconstructed high-energy prediction if lower-energy recoils can migrate into it. A complete forward calculation must extend the transported energy range until omitted migration is controlled, and account for contributions outside both current true-energy endpoints. A guessed hard cutoff cannot establish that control.

## Next executable work

Map the transcribed Table S5 values to the actual NEST 2.4.5 parameter interface, pin that implementation, and recover the remaining detector settings and calibration checks. Separately extend the raw transport below its 200-keV-capability termination to quantify the lower-energy population. Only then construct a supported observable-space kernel and reproduce a published benchmark before applying it to our spectrum. No Gaussian substitute, likelihood, accepted-count estimate or model exclusion is asserted in this packet.

The latest weighted high-window calculation remains a useful microscopic/transport diagnostic. It does not yet establish spectral compatibility or incompatibility with the measured event, and it supplies no captured population for the local experiment. The measurable-in-both goal remains open.
