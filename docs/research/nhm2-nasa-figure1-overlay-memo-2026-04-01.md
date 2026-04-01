# NHM2 NASA Figure 1 Overlay Memo (2026-04-01)

## Comparison basis

- lane used: `lane_a_eulerian_comoving_theta_minus_trk`
- observer: `eulerian_n`
- foliation: `comoving_cartesian_3p1`
- theta definition: `theta=-trK`
- sign convention: `ADM`
- mechanism chain ready: `true`

Lane A is the only authoritative basis used here. Lane B remains reference-only and does not alter the figure-class conclusion.

## NASA Figure 1 extraction

- reference: `nasa_wfm101_fig1`
- source link: https://ntrs.nasa.gov/api/citations/20110015936/downloads/20110015936.pdf
- citation link: https://ntrs.nasa.gov/citations/20110015936
- implied observer: White's figure is presented as York Time for the Alcubierre metric in a 3+1 warp-bubble frame aligned to the direction of motion.
- implied slice geometry: Qualitative signed surface around the spacecraft with an x=xs symmetry surface; the paper text does not fully specify a machine-readable plotting plane, so the repo uses the Lane A x-z midplane as the closest explicit reprojection.
- implied sign presentation: Fore contraction and aft expansion in the displayed York-time surface plots, as described in the text around Figure 1.
- expected lobe pattern: Alcubierre-style strong signed fore/aft York lobes with a sign reversal at the x=xs symmetry surface.

Comparison limitations:
- Figure 1 is qualitative and parameter-specific rather than a machine-readable numeric reference field.
- The NTRS paper varies warp-bubble wall thickness sigma across panels, so the figure class is not a single calibrated metric snapshot.
- The plotting plane is not fully specified in the paper text, so the repo uses a documented Lane A reprojection rather than claiming exact camera equivalence.

## Fixed-scale result

Under a single shared raw scale, NHM2 remains closer to the Natario control than to the Alcubierre control in the authoritative `york-surface-3p1` view. The corrected fixed-scale export therefore preserves the same class decision already seen numerically in the proof-pack, while making the amplitude gap harder to hide by per-case autoscaling.

Export-integrity correction for this run:
- visual metric source stage: `pre_png_color_buffer`
- PNG quantization mode: ordered-dithered 8-bit PNG derived from a higher-precision pre-PNG color buffer
- export integrity valid: `true`
- previous invalid collapse point: `post_colormap_8bit_quantization`

Primary visual-distance evidence for `york-surface-3p1`:
- NHM2 vs Natario pixel RMS: `0.0003245026921436903`
- NHM2 vs Alcubierre pixel RMS: `0.0007036011734714586`
- NHM2 vs Natario mean absolute pixel difference: `0.00000899390416203951`
- NHM2 vs Alcubierre mean absolute pixel difference: `0.000018693803000375824`

## NASA-style reprojection

The NASA-style overlay is a display reprojection of Lane A, not a new field definition. For this run the display sign multiplier is `-1`, chosen so the Alcubierre control follows the fore-contraction/aft-expansion presentation described in White's Figure 1 text. The repo then compares NHM2 against that figure class through the Alcubierre control rather than claiming the NASA figure is itself a calibrated numeric reference.

- NHM2 to Figure 1 class pixel RMS: `0.0008191196517368534`
- NHM2 to Figure 1 class mean absolute pixel difference: `0.00002116668291469924`
- NHM2 to Figure 1 class changed pixel fraction: `0.010642361111111111`
- NASA metric source stage: `pre_png_color_buffer`
- primary control baseline case: `natario_control`
- Figure 1 proxy to primary baseline pixel RMS ratio: `2.5242306814950735`
- Figure 1 proxy to Alcubierre pixel RMS ratio: `1.1641817589579115`

Closeness policy:
- Closeness is relative, not absolute: Figure 1 is only 'yes' when the NHM2-to-Figure-1 proxy pixel RMS stays within 10% of both the best control baseline and the Alcubierre control distance. It is 'partially' within 50% of the best baseline and 25% of the Alcubierre distance; otherwise 'no'.

## Final conclusion

- fixed_scale_render_verdict: `shared_scale_preserves_natario_like_class`
- figure1_overlay_verdict: `real_nhm2_vs_alcubierre_morphology_difference`
- nhm2_vs_natario_visual_distance: `0.0003245026921436903`
- nhm2_vs_alcubierre_visual_distance: `0.0007036011734714586`
- dominant_visual_difference_cause: `real_nhm2_vs_alcubierre_morphology_difference`
- is_nhm2_close_to_nasa_fig1 = no
- scope_note: The fixed-scale export answers a presentation-fidelity question for authoritative Lane A geometry. It does not assert exact metric identity with White Figure 1 and does not reopen the closed mechanism chain.

The fixed-scale comparison shows that the default proof-pack policy was visually compressing part of the amplitude difference, but not changing the underlying class result. The previous invalid export could also collapse distinct transformed buffers at the final PNG quantization stage; that issue is corrected here by computing comparison metrics from the pre-PNG color buffer and by guarding against PNG collisions. NHM2 still stays visibly and numerically closer to the Natario-like control than to the Alcubierre/NASA Figure 1 class under the corrected shared-scale export. The NASA overlay remains useful as a figure-class presentation check, but not as a quantitative reference field.

