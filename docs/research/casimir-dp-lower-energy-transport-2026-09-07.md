# Lower-energy transport support pilot

Exploratory S1 follow-up, September 7, 2026. Same frozen microscopic/slab
benchmark; no coupling retuning or physical-model admission.

The archived transport driver terminated a history when no Xe isotope could
receive 200 keV in a subsequent free elastic recoil. This is appropriate for
its stated true-high-window integral, but cannot supply a lower spectrum or
an unrestricted reconstructed-energy convolution.

This pilot retains the hash-checked collision dynamics and changes only the
capability stopping threshold to 5.4 and 1 keV. It executes two independent
20,000-history runs per threshold and cross-section scale. Scale one is the
old strong uncollided root; 3.9 is the later weighted-spectrum diagnostic.
Neither is an admitted shared-model point. The source remains an infinite
silica slab with stationary point nuclei and the previous Born law.

| Cross-section scale | Stop capability, keV | Far exits, two runs out of 20,000 each |
| --- | --- | --- |
| 1 | 200 | 4931; 5041 |
| 1 | 5.4 | 13063; 13041 |
| 1 | 1 | 13079; 13129 |
| 3.9 | 200, 5.4 or 1 | 0 in each run |

At scale one, the extra exits below the original high-window speed cut
number approximately 8100–8200 per run. Thus the discarded outgoing
population is substantial. The similar 5.4 and 1 keV aggregate exit counts
do not prove reconstructed-spectrum convergence: each speed must still be
weighted by its target and detector response.

At scale 3.9, zero unbiased sampled exits do not supersede the earlier
importance-sampled rare-tail estimates. A lower-threshold weighted extension
is needed there. Do not infer capture, total opacity or zero accepted counts.
All histories terminated before the 1000-collision safety limit; the maximum
observed collision count was 121. None were silently classified as exits.

The Python/JSON and compressed NPZ preserve terminal status, outgoing/final
speed, direction cosine and collision count. Only status-one histories are
far exits. Speeds in the archive are in units of c. Reused seeds do not make
different-threshold runs paired trajectories: vectorized random consumption
changes after populations diverge. No detector response is applied, and even
the 1 keV stopping rule needs a response-tail justification before a complete
reconstruction claim. The next useful step is weighted lower-energy transport
with detector-response support and tail diagnostics.
