# Nominal LZ efficiency envelope for the virtual mediator scan

Exploratory research diagnostic; September 7, 2026. Frozen apparatus and microscopic scan parameters are unchanged. No physical admission or fitted shared mechanism is claimed.

LZ identifies 5.4 and 269.9 keV as the nominal 50% efficiency crossings after selections (Figure 1 and Figure S2 captions). Use the nominal interval 0.5 <= efficiency <= 1 between those crossings. This is not a lower confidence bound over calibration nuisance parameters. [Primary paper](https://arxiv.org/pdf/2609.02823v1).

For nonnegative recoil spectra, let L and H be raw integrals over true energy [5.4,200] and [200,269.9] keV. Integrating the efficiency inequalities gives 0.5 L <= L_accepted <= L and 0.5 H <= H_accepted <= H. Consequently the accepted ratio lies between 0.5 L/H and 2 L/H. The accompanying script applies this algebra to the authenticated scan JSON and records its hash.

For the 300 MeV mediator, the raw ratio 180.42055 implies at least 90.21028 accepted low-origin events per expected accepted high-origin event under this nominal envelope. Selection efficiency alone therefore cannot reduce this model to an isolated high-origin recoil expectation. Normalizing to one expected accepted event is a comparison convention, not inference from observing one candidate.

These categories concern true recoil origins. They do not assign observed events to reconstructed-energy bins or identify them as signal. Detector smearing, signal/background densities in S1/S2, nuisance profiling and the original kernel approximations remain necessary before exclusion. The bound neither supplies a measurable coherence signal nor rehabilitates this candidate.

Decision: retain the virtual scan as a constrained comparison. Prioritize mechanisms with demonstrably larger local response and acceptable full xenon spectra; do not spend further work tuning the overall normalization of this scan to hide its low-energy population. The shared-model goal remains open.
