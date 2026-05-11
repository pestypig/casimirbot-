Benchmark verdict: fixture_only_profile_support
Profile count: 2
Closure summary: passed=2; failed=0; warnings=4
Uncertainty summary: coverage=1
Blockers: none
Claim IDs: mesa_profile_benchmark_requires_metadata.v1, stellar_profile_luminosity_closure_check.v1, stellar_profile_uncertainty_propagation_required.v1, fusion_channel_benchmark_from_integrated_eps.v1, fusion_zone_benchmark_from_cumulative_luminosity.v1, surface_teff_is_observable_closure_not_core_temperature.v1, starsim_fusion_benchmark_not_direct_er_epr_evidence.v1
Citations: https://arxiv.org/abs/1009.1622, https://arxiv.org/abs/2411.00972, https://arxiv.org/abs/1004.2318, https://www.astronomy.swin.edu.au/cosmos/E/Effective%2BTemperature, https://arxiv.org/abs/1306.0533
Source roles: mesa_profile_benchmark_requires_metadata.v1:supports_model, stellar_profile_luminosity_closure_check.v1:supports_model, stellar_profile_uncertainty_propagation_required.v1:supports_model, fusion_channel_benchmark_from_integrated_eps.v1:supports_model, fusion_zone_benchmark_from_cumulative_luminosity.v1:supports_model, surface_teff_is_observable_closure_not_core_temperature.v1:supports_model, starsim_fusion_benchmark_not_direct_er_epr_evidence.v1:supports_model
Uncertainty notes: Benchmark support depends on profile metadata quality and cannot certify the upstream MESA run by itself. | Luminosity closure is a diagnostic tolerance, not proof that the imported profile is complete. | Uncertainty propagation is fixture-level unless backed by full profile ensembles or reproduced solver runs. | Integrated epsilon channel fractions inherit the imported profile's nuclear network and resolution limits. | Fusion-zone radii inherit shell spacing and energy-generation profile resolution. | Surface effective temperature is an observable closure check and does not provide core temperature. | Benchmark support cannot directly establish ER=EPR, propulsion, stress-energy sourcing, or CL0-CL4 evidence.
QST boundary: proxy_only; mayPromoteToCL4=false
Allowed claim: benchmark support for a proxy-only astrophysical prior; not direct ER=EPR evidence; requires external reproduction for stronger status.
Caveats: Benchmark support remains an astrophysical prior and cannot promote QST, ER=EPR, Needle Hull, or warp claims.
