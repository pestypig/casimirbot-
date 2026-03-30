# York Diagnostic Lane B Design

## Status

- state: diagnostic-ready alternate observer lane
- runtime support: implemented for `lane_b_shift_drift_theta_plus_div_beta_over_alpha`
- semantic-closure: true (diagnostic-local observer proxy semantics)
- cross-lane-claim-readiness: true
- claim scope: diagnostic-local only

Lane B now has runtime tensor recomputation with explicit observer construction,
tensor input requirements, and strict certificate evidence checks. Lane B remains
diagnostic-local only; it does not authorize feasibility claims or theory
identity claims beyond this contract.

## Objective

Define a second York diagnostic lane whose outputs are derived from a genuinely
distinct geometric path, so future cross-lane comparison can test
observer/foliation dependence under a declared contract.

## Proposed Lane Envelope

- lane id: `lane_b_shift_drift_theta_plus_div_beta_over_alpha`
- lane contract status: supported for strict York lane execution and diagnostic-local cross-lane claims
- observer: `shift_drift_u(beta_over_alpha)`
- observer definition id: `obs.shift_drift_beta_over_alpha_covariant_divergence_v1`
- foliation: `comoving_cartesian_3p1` (same slicing, alternate observer)
- theta definition: `theta=-trK+div_gamma(beta/alpha)` recomputed from tensors/state
- sign convention: `K_ij=-1/2*L_n(gamma_ij)` carried in certificate metadata
- approximation note: observer is a non-normalized drift proxy on fixed foliation; approximation is explicit and constrained to diagnostic-local interpretation

## Source Tensors Required

Lane B must be computed from underlying geometry, not from rendered Lane A
fields.

Required sources:

- lapse `alpha`
- shift `beta_i` (or `beta^i` with explicit index convention)
- spatial metric `gamma_ij`
- extrinsic curvature `K_ij` (if Lane B still uses a 3+1 curvature path)
- Lane B observer 4-velocity `u^a` (or equivalent covector definition)
- chart/jacobian data needed for Lane B coordinate projection/remap
- support channels used by York shell diagnostics (`hull_sdf`, `tile_support_mask`, `region_class`) when shell views are enabled

Current runtime requirement (implemented):

- `alpha`, `beta_x`, `beta_y`, `beta_z`
- `gamma_xx`, `gamma_xy`, `gamma_xz`, `gamma_yy`, `gamma_yz`, `gamma_zz`
- `K_trace`

## Recomposition Algorithm Outline

1. Resolve Lane B observer-proxy definition from source tensors.
2. Build covariant divergence term using spatial metric determinant:
   `div_gamma(v)=1/sqrt(det(gamma))*partial_i(sqrt(det(gamma))*v^i)`.
3. Recompute Lane B theta diagnostic as `theta_B=-trK+div_gamma(beta/alpha)`.
4. Generate Lane B view slices/remaps from Lane B theta, not Lane A theta.
5. Produce Lane B diagnostics/hashes from Lane B arrays.
6. Emit Lane B certificate metadata and enforce strict lane-aware validation.

Hard rule: no scalar transform or relabel of Lane A output can satisfy steps
2-4.

## Observer Definition

Lane B implementation must provide:

- analytic/algorithmic observer definition in terms of local tensor quantities
- normalization/sign choices for observer construction
- deterministic fail-closed behavior when observer construction inputs are missing
- explicit link from observer definition to Lane B theta semantics

No placeholder observer names are allowed in runtime mode.

## Foliation Definition

Lane B implementation must provide:

- foliation definition or proof of same foliation with different observer
- coordinate chart assumptions
- slicing-specific constraints and admissibility criteria
- deterministic handling for unsupported foliation regions

## Theta Definition

Lane B must define theta in Lane B terms, including:

- formula
- dependent quantities
- sign convention
- dimensional/units contract
- expected relationship to Lane A `theta=-trK` (same/different and why)

## Sign Convention

Lane B must declare:

- `kij_sign_convention`
- theta sign interpretation in fore/aft language
- consistency checks against control references

No implicit sign inheritance from Lane A.

## Certificate Metadata Additions

Runtime enablement requires lane-aware metadata to be present in York
certificates and response diagnostics:

- `render.lane_id`
- `diagnostics.lane_id`
- lane observer id/definition reference
- lane foliation id/definition reference
- lane theta-definition id/text
- lane sign-convention id/text
- lane-specific slice/remap hash provenance
- `diagnostics.observer_inputs_required`
- `diagnostics.observer_inputs_present`
- `diagnostics.lane_b_semantic_mode`
- `diagnostics.lane_b_tensor_inputs_hash`
- `diagnostics.lane_b_geometry_ready`
- `diagnostics.lane_b_semantics_closed`

Missing or mismatched lane metadata must fail closed.

## Control Expectations

Lane B requires calibrated expectations for each control family before Lane B
family verdicts are enabled.

### Alcubierre-like control

- expected strong signed lobe structure under Lane B semantics
- explicit acceptance criteria for fore/aft sign structure
- explicit failure criteria for collapse to flat/noise pattern

### Natario-like control

- expected low-expansion behavior under Lane B semantics
- explicit acceptance criteria for muted York morphology
- explicit failure criteria for false Alcubierre-like response

### NHM2

- evaluated relative to Lane B calibrated controls
- classification remains diagnostic-local
- disagreement with Lane A is interpreted as lane dependence, not theory proof

## Fake-Lane Falsifiers

Lane B implementation is invalid if any condition below is true:

- Lane B reuses Lane A theta arrays/hashes while claiming distinct lane semantics
- lane metadata is missing or identical to Lane A despite different lane id
- control behavior is unchanged where Lane B should induce diagnostic change
- only visualization-scale parameters changed without tensor recomputation
- cross-lane verdict emitted when Lane B controls are uncalibrated
- cross-lane verdict emitted while Lane B readiness gate reports semantic closure false

## Tests Required Before Runtime Enablement

Required test classes:

- unit tests for Lane B observer/foliation/theta recomputation path
- lane metadata strict-validation tests in render route
- per-view provenance-hash tests proving Lane B arrays are distinct when expected
- control calibration tests (Alcubierre-like vs Natario-like) in Lane B
- cross-lane policy tests for stable/disagreement/inconclusive outcomes

## Implementation Readiness Checklist

- [x] source geometry channels required for Lane B are available and validated
- [x] alternate observer definition is formally specified
- [ ] alternate foliation definition is formally specified (or explicitly ruled out with observer-only variant justification)
- [x] Lane B theta recomputation algorithm is fully specified
- [x] Lane B sign convention and interpretation rules are fully specified
- [x] certificate/diagnostics metadata fields for Lane B are finalized
- [x] Lane B control set (Alcubierre-like, Natario-like, NHM2) is fixed
- [x] fake-lane falsifier tests are implemented
- [x] cross-lane comparison policy is defined with explicit failure semantics
- [x] route/service strict mode behavior for unsupported Lane B remains fail-closed
- [x] runtime emits lane semantic evidence (`observer_inputs_present`, `lane_b_tensor_inputs_hash`, `lane_b_geometry_ready`)
- [x] proof-pack readiness gate is decomposed (`laneBObserverDefined`, `laneBTensorInputsPresent`, `laneBGeometryReady`, `laneBSemanticsClosed`, `laneBParityClosed`, `laneBControlsCalibrated`, `laneBCrossLaneClaimReady`)
- [x] Lane B readiness gate is fully closed (`semantics_closed && cross_lane_claim_ready`) for cross-lane claim enablement

## Policy Boundary

Even after implementation, Lane B upgrades the repository from single-lane
diagnostic-local classification to multi-lane comparison. It does not, by
itself, license theory identity or physical feasibility claims.
