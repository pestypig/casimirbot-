# NHM2 York OptiX Render Layer (2026-04-01)

"This artifact restores a solve-backed OptiX/CUDA 3+1 presentation layer for human-facing morphology inspection while keeping Lane A fixed-scale diagnostics as the authoritative evidence basis."

## Summary
| field | value |
|---|---|
| presentationRenderLayerStatus | available |
| optixScientificRenderAvailable | true |
| presentationRenderQuality | warning |
| presentationRenderBackedByAuthoritativeMetric | true |
| exportDirectory | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01 |

## Diagnostic vs Presentation Policy
| layer | status | basis | use |
|---|---|---|---|
| authoritative diagnostic layer | authoritative | Lane A slices + fixed-scale + pre-PNG metrics | formal comparisons and class decisions |
| presentation layer | secondary | solve-backed OptiX/CUDA scientific frames | human-facing morphology inspection only |

## Presentation Views
| renderView | role | caption |
|---|---|---|
| transport-3p1 | main_volumetric | Primary OptiX-backed volumetric transport view for human morphology inspection. |
| full-atlas | context_atlas | Context-rich full atlas render for hull/support interpretation on the same solved metric volume. |

## Per-Case Presentation Trace
| case_id | renderView | ok | metricVolumeHash | laneAFieldHash | presentationRenderRequestHash | presentationRenderImageHash | certificateHash | frameHash | imagePath | fileSizeBytes | meanIntensity | nonBackgroundPixelFraction | contrastStdDev | warnings |
|---|---|---|---|---|---|---|---|---|---|---:|---:|---:|---:|---|
| flat_space_zero_theta | transport-3p1 | true | 99e56d3492e6dd985cefd87a5622b4ca6039c99092c7508399b718b7ddf5c0c8 | 6b9f79453a2e6e2da2301854d9985b1b8f8f3a29ba21d0658349112cabef7669 | 8fb306b7926075b17f1f33c59879037f79aa2741d4ab751975e879bdaffc050b | 37de25546650fe85c1d552b768c454afdc7fd2aa1acb31099e91d25e935194f8 | 899f2685266b3e25d7113fcad8323bbe92b8291d56434d12f3c05a94a0204f9c | 37de25546650fe85c1d552b768c454afdc7fd2aa1acb31099e91d25e935194f8 | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/flat_space_zero_theta-york-optix-3p1-main.png | 113831 | 0.0578738330076048 | 0.04942165798611111 | 0.06580755439258003 | presentation_lane_binding_unreported |
| flat_space_zero_theta | full-atlas | true | 99e56d3492e6dd985cefd87a5622b4ca6039c99092c7508399b718b7ddf5c0c8 | 6b9f79453a2e6e2da2301854d9985b1b8f8f3a29ba21d0658349112cabef7669 | d4c87b2c5192b6c45d9fecbdf95979d6744aedea5603e21b976739c904542fa3 | a4a5f5f11f5c8937625bf9ad30cffe7bf91a821f21ea61ea6edbae3bd25f9258 | 030b6eb9458ddabe3e22110eca8502847edf8c5d77f318d62d63f6c155e80923 | a4a5f5f11f5c8937625bf9ad30cffe7bf91a821f21ea61ea6edbae3bd25f9258 | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/flat_space_zero_theta-york-optix-3p1-hull-overlay.png | 174311 | 0.35092081611727555 | 0.46159505208333335 | 0.37703400385872377 | presentation_lane_binding_unreported |
| natario_control | transport-3p1 | true | 561c510a9255f0114f0248f8e7cea44f63c2ac54ba9ec194bfe69d72f1a6455f | f424ae7b6c9e4a551f4d9d181396e3d1d428ff0055280758a0e5be00a29f93f7 | aa588c3825acc9fe3d35ee766146255a13bcc1e0043e50cb882c2013cb48868c | 9748223b4487cfe15b7e07b1dc99685418ac992f7a692fe9633c6e8d13856085 | f60f71ccc1531cb5c10cb03203d7dd413c2d589c9f2c529e3e7d40ce21d9ca20 | 9748223b4487cfe15b7e07b1dc99685418ac992f7a692fe9633c6e8d13856085 | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/natario_control-york-optix-3p1-main.png | 113742 | 0.05787155023850763 | 0.04941189236111111 | 0.06579511391391367 | presentation_lane_binding_unreported |
| natario_control | full-atlas | true | 561c510a9255f0114f0248f8e7cea44f63c2ac54ba9ec194bfe69d72f1a6455f | f424ae7b6c9e4a551f4d9d181396e3d1d428ff0055280758a0e5be00a29f93f7 | ca03cdc38e22a9d95f0f12934efaf3382bd304f6958bb6330822794f3677b59b | 5d3916e1701bd34a68a2020088201ad8a87f1799e0b545be04e879654a2a9499 | b6377a18a251953cc6f92ee3d14e4dd68a1e284ce55f3d69c7199739a65de9f4 | 5d3916e1701bd34a68a2020088201ad8a87f1799e0b545be04e879654a2a9499 | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/natario_control-york-optix-3p1-hull-overlay.png | 174406 | 0.3509206345685623 | 0.4615928819444444 | 0.37703405556892294 | presentation_lane_binding_unreported |
| alcubierre_control | transport-3p1 | true | 1d4be9bc044818a04f602c24f0dda58cb3eedaa4946a00382f601c425bf939dd | d1d4c080b91cb42131b4b9f68ce746b08e7f05d0a044b45771696fd11fdd099d | 374cdb7cdc19bb52d41de480fd5bce1157f1588b164134d4ad6494d0fff8cacc | 1c05edfc3bf6978a0db616befff959b214ad9e193f3b1326e3faa2dab7f07ebf | e09b5e05e0e67e9308fa60d88d71b17ddf61ebc290c0a4dbd2a1ea20e5660ea0 | 1c05edfc3bf6978a0db616befff959b214ad9e193f3b1326e3faa2dab7f07ebf | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/alcubierre_control-york-optix-3p1-main.png | 113784 | 0.057874716298386426 | 0.049462890625 | 0.06579115451581029 | presentation_lane_binding_unreported |
| alcubierre_control | full-atlas | true | 1d4be9bc044818a04f602c24f0dda58cb3eedaa4946a00382f601c425bf939dd | d1d4c080b91cb42131b4b9f68ce746b08e7f05d0a044b45771696fd11fdd099d | a28986e7fccc9cc15130da44c6e17e1f8c63713c9b927c51010c99a00247ca9e | a7d1b007ec1bb7c9d86f1b9c28b371164058a092b9aa093496a5dc24e8376172 | fa7eb299c5425073f9e6b27825ae37ad76b65f017edb9e571f0f859c370e47ab | a7d1b007ec1bb7c9d86f1b9c28b371164058a092b9aa093496a5dc24e8376172 | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/alcubierre_control-york-optix-3p1-hull-overlay.png | 174154 | 0.3508147974055709 | 0.46160264756944447 | 0.37696472008640536 | presentation_lane_binding_unreported |
| nhm2_certified | transport-3p1 | true | d80ae1edd917f385f501bd6f5c217c892e2dd0effa0395d4aef19739cb1590b8 | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | 4d8d5c1f8e01b69d493e128039855286aa6a236e21ccaf674fc02f919a2e4a42 | d96a116bb71abe4e279191883946045fe2ebbbf6c4611579279efe5b0911736e | 197d7a45c88a5afa89777dc6a862e640c90ab6062a420093af7da8b981de402b | d96a116bb71abe4e279191883946045fe2ebbbf6c4611579279efe5b0911736e | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/nhm2_certified-york-optix-3p1-main.png | 113584 | 0.05787273387310736 | 0.049434678819444446 | 0.0657912593838214 | presentation_lane_binding_unreported |
| nhm2_certified | full-atlas | true | d80ae1edd917f385f501bd6f5c217c892e2dd0effa0395d4aef19739cb1590b8 | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | d57c47a71f73c2ccf1b9b422d34eb6c71b4eb9ffeb711156c3ec17cc17042d5c | 19555d26b4d2b73a6b775d003c0573c5b27d4d4a3af6263a1d78cb73e18261d3 | 47da0221d85afc30b988b4446005b69a2da0cb19e7761b930439f8d61e251a90 | 19555d26b4d2b73a6b775d003c0573c5b27d4d4a3af6263a1d78cb73e18261d3 | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/nhm2_certified-york-optix-3p1-hull-overlay.png | 174071 | 0.3508941374450588 | 0.46158528645833335 | 0.37702340074340607 | presentation_lane_binding_unreported |

## Findings
| field | value |
|---|---|
| blockingFindings | none |
| advisoryFindings | presentation_lane_binding_unreported |

## Use Policy
Use Lane A slices and fixed-scale pre-PNG metrics for formal decisions. Use these OptiX renders only for secondary human-facing inspection and presentation. If they appear inconsistent, investigate the presentation renderer before revising the diagnostic verdict.

## Notes
- authoritative_lane=lane_a_eulerian_comoving_theta_minus_trk
- visual_metric_source_stage=pre_png_color_buffer
- OptiX presentation renders are bound to the same metric volume refs used to compute the authoritative Lane A fields.
- Current nasa-fig1-style slice exports remain useful for convention studies but are not the preferred human-facing morphology renders.

