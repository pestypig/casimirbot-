# Warp Tree/DAG Congruence Policy

Status: draft  
Owner: dan  
Scope: policy for mathematically allowed relations in warp/GR trees and DAGs

## Purpose
Establish a deterministic policy that restricts tree and DAG relations to those that are mathematically congruent under the Congruence Ladder (CL0-CL4). This prevents concept-similar nodes from being linked without math support.

## Congruence Ladder (CL0-CL4)
1. CL0: 4-metric equivalence (same g_mu_nu up to author-stated coordinate transforms).
2. CL1: ADM equivalence in fixed slicing (same alpha, beta^i, gamma_ij).
3. CL2: Derived geometry equivalence (theta_beta, K_ij, Tr(K), K_ij K^ij).
4. CL3: Stress-energy equivalence (rho_E or T_mu_nu).
5. CL4: Guardrail congruence (repo constraints judge geometry-derived quantities).

## Edge Types and Required CL
| edgeType | requiresCL | definition |
| --- | --- | --- |
| hierarchy | none | Tree structure or parent/child containment; not a congruence claim. |
| association | none | See-also or conceptual links; not a congruence claim. |
| equivalent_metric | CL0 | Same 4-metric, chart transform allowed. |
| equivalent_adm | CL1 | Same ADM fields in the chosen slicing. |
| equivalent_geometry | CL2 | Same theta_beta and K_ij invariants. |
| equivalent_stress_energy | CL3 | Same rho_E or T_mu_nu. |
| guardrail_congruent | CL4 | Guardrail uses geometry-derived inputs. |
| conditional_region | CL0-CL3 | Same as above but only in stated region (B=1, etc.). |
| chart_dependent | CL1-CL3 | Same as above but only in stated chart. |
| proxy_only | none | Explicitly not geometry-congruent. |

## Region and Chart Rules
- If an equivalence only holds in a region (example: Van Den Broeck where B=1), the edge must include `condition` text and use `conditional_region`.
- If an equivalence depends on chart choice (example: comoving vs lab), the edge must include `chartDependency`.
- If CL4 QI equivalence depends on strict metric-source gating, the edge must include `condition: "qi_strict_ok=true"` and the walk config must set `region.qi_strict_ok_equals_true=true`.
- If CL4 ThetaAudit equivalence depends on geometry theta, the edge should include `condition: "theta_geom=true"` and the walk config should set `region.theta_geom_equals_true=true` only when geometry theta is available.
- If CL4 VdB-band equivalence depends on derivative support, the edge should include `condition: "vdb_two_wall_derivative_support=true"` and the walk config should set `region.vdb_two_wall_derivative_support_equals_true=true` only when region-II/IV derivative support is present.
- If CL4 TS-ratio equivalence depends on metric/proper-distance derivation, the edge should include `condition: "ts_metric_derived=true"` and the walk config should set `region.ts_metric_derived_equals_true=true` only when that derivation is active.
- If an equivalence is based on a proxy (thetaProxy, curvature proxy), the edge must be `proxy_only` and never satisfy CL4.

Recommended chart labels:
- `lab_cartesian`
- `comoving_cartesian`
- `spherical_comoving`

## Node Class Guidance (initial)
Use these node classes for tagging and filtering during walks:
- metric_family
- adm_fields
- derived_geometry
- stress_energy
- guardrail_proxy
- guardrail_geometry
- pipeline_trace
- coordinate_chart
- bridge
- other

## Walk Defaults (deterministic)
- Default allowed CL: CL4 (strict congruence) unless a walk explicitly requests a lower CL.
- Include `hierarchy` and `association` edges only when `allowConceptual=true`.
- Exclude `proxy_only` edges unless a walk explicitly requests proxies.
- If `chartDependency` is present, only traverse when the active chart matches.
- If `condition` is present, only traverse when the walk provides the region predicate.

## Audit Expectations
Every edge in the tree/DAG must include:
- `requiresCL`
- `edgeType`
- Optional `condition` (for region constraints)
- Optional `chartDependency` (for slicing dependence)
- Optional `proxy` flag (true for proxy-only edges)
