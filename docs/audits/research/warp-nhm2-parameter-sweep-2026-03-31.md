# NHM2 Parameter Sweep (2026-03-31)

"This bounded parameter sweep varies only active NHM2 brick selectors under the same authoritative Lane A contract used for canonical calibration and fixed-scale comparison."

## Comparison Contract
| field | value |
|---|---|
| laneUsed | lane_a_eulerian_comoving_theta_minus_trk |
| observer | eulerian_n |
| foliation | comoving_cartesian_3p1 |
| thetaDefinition | theta=-trK |
| fixedScalePolicy | comparison_fixed_raw_global + comparison_fixed_topology_global with no per-case autoscaling |
| visualMetricSourceStage | pre_png_color_buffer |
| exportDirectory | artifacts/research/full-solve/rendered-york-parameter-sweep-2026-03-31 |

## Sweep Dimensions
| parameter_name | baseline_value | sweep_values | sampling_strategy | rationale |
|---|---:|---|---|---|
| dutyFR | 0.0015 | 0.00075, 0.003 | deterministic_oat | Duty cycle is an active brick selector and can change the effective source amplitude envelope without redefining the Lane A contract. |
| q | 3 | 1, 6 | deterministic_oat | q is the direct drive-side morphology lever in the live gr-evolve-brick request path. |
| gammaGeo | 26 | 13, 52 | deterministic_oat | gammaGeo is an active geometry-compression selector in the live request path. |
| gammaVdB | 500 | 250, 1000 | deterministic_oat | gammaVdB is an active Van den Broeck-style morphology/compression selector in the live request path. |
| zeta | 0.84 | 0.42, 0.9659999999999999 | deterministic_oat | zeta is an active bounded selector in the live request path and can change drive weighting without redesigning the source family. |

## Runs
| run_id | varied_parameter | varied_value | morphologyClass | distance_to_natario | distance_to_alcubierre | distance_to_flat | signed_lobe_summary | metricVolumeRefUrl |
|---|---|---:|---|---:|---:|---:|---|---|
| nhm2_sweep_baseline | baseline | baseline | natario_like_low_expansion | 0.05550532183652614 | 0.19279842598839617 | 0.5869846480083858 | mixed_or_flat | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1 |
| nhm2_sweep_dutyFR_0_00075 | dutyFR | 0.00075 | natario_like_low_expansion | 0.05550532183652614 | 0.19279842598839617 | 0.5869846480083858 | mixed_or_flat | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&format=raw&dutyFR=0.00075&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift |
| nhm2_sweep_dutyFR_0_003 | dutyFR | 0.003 | natario_like_low_expansion | 0.05550532183652614 | 0.19279842598839617 | 0.5869846480083858 | mixed_or_flat | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&format=raw&dutyFR=0.003&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift |
| nhm2_sweep_q_1 | q | 1 | natario_like_low_expansion | 0.06560634899837553 | 0.18269739937430415 | 0.5869846472737018 | mixed_or_flat | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&format=raw&dutyFR=0.0015&q=1&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift |
| nhm2_sweep_q_6 | q | 6 | natario_like_low_expansion | 0.05550532183652614 | 0.19279842598839617 | 0.5869846480083858 | mixed_or_flat | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&format=raw&dutyFR=0.0015&q=6&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift |
| nhm2_sweep_gammaGeo_13 | gammaGeo | 13 | natario_like_low_expansion | 0.05550532183652614 | 0.19279842598839617 | 0.5869846480083858 | mixed_or_flat | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&format=raw&dutyFR=0.0015&q=3&gammaGeo=13&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift |
| nhm2_sweep_gammaGeo_52 | gammaGeo | 52 | natario_like_low_expansion | 0.05550532183652614 | 0.19279842598839617 | 0.5869846480083858 | mixed_or_flat | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&format=raw&dutyFR=0.0015&q=3&gammaGeo=52&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift |
| nhm2_sweep_gammaVdB_250 | gammaVdB | 250 | natario_like_low_expansion | 0.05550532183652614 | 0.19279842598839617 | 0.5869846480083858 | mixed_or_flat | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&format=raw&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=250&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift |
| nhm2_sweep_gammaVdB_1000 | gammaVdB | 1000 | natario_like_low_expansion | 0.05550532183652614 | 0.19279842598839617 | 0.5869846480083858 | mixed_or_flat | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&format=raw&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=1000&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift |
| nhm2_sweep_zeta_0_42 | zeta | 0.42 | natario_like_low_expansion | 0.05550532183652614 | 0.19279842598839617 | 0.5869846480083858 | mixed_or_flat | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&format=raw&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.42&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift |
| nhm2_sweep_zeta_0_9659999999999999 | zeta | 0.9659999999999999 | natario_like_low_expansion | 0.05550532183652614 | 0.19279842598839617 | 0.5869846480083858 | mixed_or_flat | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&format=raw&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.9659999999999999&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift |

## Verdict
| field | value |
|---|---|
| sweepVerdict | alcubierre_like_not_found |
| bestRunClass | natario_like_low_expansion |
| alcubierreLikeReachable | no |
| dominantMorphologyDrivers | q |
| recommendedNextAction | A bounded selector sweep did not reach the Alcubierre-like class; prioritize NHM2 source/coupling redesign over more blind tuning. |

## Notes
- baseline_distance_to_natario=0.05550532183652614
- baseline_distance_to_alcubierre=0.19279842598839617
- visual_metric_source_stage=pre_png_color_buffer
- Parameter sweep runs are OAT perturbations around the current NHM2 selector bundle, not a model redesign.

