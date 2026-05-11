Stage: ER_EPR_STAGE1_SOLVER_ADAPTER_V1
Claim tier: solver_simulated_model_internal_adapter
Adapter run ID: er-epr-solver-adapter:de4790da-e118-46f2-ab94-8129b3f9fedd
Backend: two_sided_syk_tiny_exact_diag
Raw provenance: solver_simulated
Hamiltonian hash: sha256:toy-syk-hamiltonian
Seed: 1337
Evaluation verdict: dual_model_support_strong
Signal composite: 0.913333
Control leakage: 0.18
QST boundary: proxy_only; mayPromoteToCL4=false
Allowed claim: model-internal solver-adapter telemetry for a declared toy-dual backend; not real-universe wormhole evidence; not NHM2 propulsion validation.
Claim IDs: er_epr_raw_telemetry_before_interpretation.v1, er_epr_declared_toy_dual_backend_only.v1, er_epr_double_trace_traversability_protocol_context.v1, er_epr_syk_teleportation_protocol_context.v1, er_epr_solver_control_battery_required.v1, er_epr_entropy_washout_demotes_solver_signal.v1, er_epr_solver_telemetry_not_real_universe_wormholes.v1, er_epr_solver_telemetry_not_nhm2_propulsion.v1
Citations: https://www.nature.com/articles/s41586-022-05424-3, https://www.nature.com/articles/s41586-025-08939-7, https://arxiv.org/abs/1306.0533, https://arxiv.org/abs/hep-th/0603001, https://link.springer.com/article/10.1007/JHEP12(2017)151, https://link.springer.com/article/10.1007/JHEP07(2021)097, https://www.nature.com/articles/s41586-025-08995-z, https://arxiv.org/abs/2411.00972
Source roles: er_epr_raw_telemetry_before_interpretation.v1:supports_guardrail, er_epr_declared_toy_dual_backend_only.v1:supports_boundary, er_epr_double_trace_traversability_protocol_context.v1:supports_model, er_epr_syk_teleportation_protocol_context.v1:supports_model, er_epr_solver_control_battery_required.v1:supports_guardrail, er_epr_entropy_washout_demotes_solver_signal.v1:supports_guardrail, er_epr_solver_telemetry_not_real_universe_wormholes.v1:supports_boundary, er_epr_solver_telemetry_not_nhm2_propulsion.v1:supports_boundary
Uncertainty notes: Raw solver telemetry must be preserved before normalized scores are interpreted. | Backend declarations bound the claim to a toy-dual or control model family. | Double-trace traversability applies to specific holographic setups and is not a propulsion mechanism. | SYK teleportation protocols are model-internal analogues and need controls before interpretation. | Wrong-sign, no-coupling, disentangled, shuffled, random-matrix, and spin-chain controls constrain false positives. | Entropy stretch is a visibility/demotion diagnostic and does not physically change hbar. | Solver telemetry cannot prove real-universe Einstein-Rosen bridges or wormhole inventories. | Solver telemetry is a QST sidecar result and cannot validate NHM2 propulsion or stress-energy sourcing.
Caveats: Solver adapter output is model-internal only. | Raw telemetry is not real-universe ER=EPR evidence. | No NHM2 propulsion, stress-energy, wormhole-inventory, or CL0-CL4 claim is allowed.