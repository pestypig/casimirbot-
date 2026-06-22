import {
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const NHM2_FULL_SOLVE_WHITEPAPER =
  "docs/research/nhm2-current-status-whitepaper-2026-05-02.md";
const NHM2_OBSERVABLE_EQUATION_MAP =
  "docs/research/nhm2-observable-equation-map.v1.json";
const NHM2_OBSERVABLE_FIGURE_PLAN =
  "docs/research/nhm2-observable-equation-figure-plan.md";
const NHM2_PROOF_ANCHOR_INDEX =
  "docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.md";
const NHM2_FULL_SOLVE_REFERENCE_CAPSULE =
  "docs/audits/research/warp-full-solve-reference-capsule-latest.md";
const NHM2_QEI_RECEIPTED_SMOKE_ROOT =
  "artifacts/research/full-solve/validation-chain/qei-worldline-receipted-smoke-v1";
const NHM2_AXIS_ALIGNED_SHEAR_SUPPRESSED_SMOKE_ROOT =
  "artifacts/research/full-solve/validation-chain/axis-aligned-shear-suppressed-smoke-v1";
const NHM2_SOURCE_COMPONENT_AUTHORITY_LEDGER =
  `${NHM2_QEI_RECEIPTED_SMOKE_ROOT}/nhm2-source-component-authority-ledger.json`;
const NHM2_COUPLED_CLOSURE_PASS_CANDIDATE =
  `${NHM2_QEI_RECEIPTED_SMOKE_ROOT}/nhm2-coupled-closure-pass-candidate.json`;
const NHM2_REGIONAL_TENSOR_PASS_PATH_HARNESS =
  `${NHM2_QEI_RECEIPTED_SMOKE_ROOT}/nhm2-regional-tensor-pass-path-harness.json`;
const NHM2_TIME_DEPENDENT_SOURCE_CAMPAIGN =
  `${NHM2_QEI_RECEIPTED_SMOKE_ROOT}/nhm2-time-dependent-source-campaign.json`;
const NHM2_SOURCE_OFF_DIAGONAL_SHEAR_AUDIT =
  `${NHM2_QEI_RECEIPTED_SMOKE_ROOT}/nhm2-source-off-diagonal-shear-audit.json`;
const NHM2_AXIS_ALIGNED_SOURCE_OFF_DIAGONAL_SHEAR_AUDIT =
  `${NHM2_AXIS_ALIGNED_SHEAR_SUPPRESSED_SMOKE_ROOT}/nhm2-source-off-diagonal-shear-audit.json`;
const NHM2_AXIS_ALIGNED_SOURCE_MOMENTUM_DENSITY_AUDIT =
  `${NHM2_AXIS_ALIGNED_SHEAR_SUPPRESSED_SMOKE_ROOT}/nhm2-source-momentum-density-audit.json`;
const NHM2_AXIS_ALIGNED_MOMENTUM_FRAME_PROJECTION_RECEIPT =
  `${NHM2_AXIS_ALIGNED_SHEAR_SUPPRESSED_SMOKE_ROOT}/nhm2-momentum-frame-projection-receipt.json`;
const NHM2_AXIS_ALIGNED_MOMENTUM_FRAME_PROJECTION_EVIDENCE =
  "fixtures/nhm2/momentum-frame-projection-evidence.axis-aligned-reduced-order-v1.json";
const NHM2_AXIS_ALIGNED_METRIC_REQUIRED_MOMENTUM_DEMAND_AUDIT =
  `${NHM2_AXIS_ALIGNED_SHEAR_SUPPRESSED_SMOKE_ROOT}/nhm2-metric-required-momentum-demand-audit.json`;
const NHM2_AXIS_ALIGNED_METRIC_MOMENTUM_REMEDIATION_TARGETS =
  `${NHM2_AXIS_ALIGNED_SHEAR_SUPPRESSED_SMOKE_ROOT}/nhm2-metric-momentum-remediation-targets.json`;
const NHM2_AXIS_ALIGNED_CAMPAIGN_FRONTIER_DISPOSITION =
  `${NHM2_AXIS_ALIGNED_SHEAR_SUPPRESSED_SMOKE_ROOT}/nhm2-campaign-frontier-disposition.json`;
const NHM2_CAMPAIGN_PROFILE_SEARCH =
  "artifacts/research/full-solve/profile-search/nhm2-campaign-profile-search-latest.json";
const NHM2_CAMPAIGN_PROFILE_RUN_MANIFEST =
  "artifacts/research/full-solve/profile-search/nhm2-campaign-profile-run-manifest-latest.json";
const NHM2_0P9000_COMBINED_PROFILE_CAMPAIGN_RUN_ROOT =
  "artifacts/research/full-solve/profile-campaign-runs/stage1_centerline_alpha_0p9000_combined_metric_redesign_campaign_screen_v1";
const NHM2_0P9000_COMBINED_CANDIDATE_METRIC_PROFILE_SPEC =
  `${NHM2_0P9000_COMBINED_PROFILE_CAMPAIGN_RUN_ROOT}/nhm2-candidate-metric-profile-spec.json`;
const NHM2_0P9000_COMBINED_METRIC_REQUIRED_FULL_REGIONAL_TENSOR =
  `${NHM2_0P9000_COMBINED_PROFILE_CAMPAIGN_RUN_ROOT}/nhm2-metric-required-full-regional-tensor.json`;
const NHM2_0P9000_COMBINED_METRIC_REQUIRED_MOMENTUM_DEMAND_AUDIT =
  `${NHM2_0P9000_COMBINED_PROFILE_CAMPAIGN_RUN_ROOT}/nhm2-metric-required-momentum-demand-audit.json`;
const NHM2_0P9000_COMBINED_METRIC_MOMENTUM_REMEDIATION_TARGETS =
  `${NHM2_0P9000_COMBINED_PROFILE_CAMPAIGN_RUN_ROOT}/nhm2-metric-momentum-remediation-targets.json`;
const NHM2_AXIS_ALIGNED_TIME_DEPENDENT_SOURCE_CAMPAIGN =
  `${NHM2_AXIS_ALIGNED_SHEAR_SUPPRESSED_SMOKE_ROOT}/nhm2-time-dependent-source-campaign.json`;
const NHM2_AXIS_ALIGNED_REGIONAL_MATERIAL_SOURCE_TENSOR_MODEL =
  `${NHM2_AXIS_ALIGNED_SHEAR_SUPPRESSED_SMOKE_ROOT}/nhm2-regional-material-source-tensor-model.json`;
const NHM2_SWITCHING_COVARIANT_CONSERVATION_EVIDENCE =
  `${NHM2_QEI_RECEIPTED_SMOKE_ROOT}/nhm2-switching-covariant-conservation-evidence.json`;
const NHM2_FREQUENCY_CONVERGENCE_EVIDENCE =
  `${NHM2_QEI_RECEIPTED_SMOKE_ROOT}/nhm2-frequency-convergence-evidence.json`;
const NHM2_DYNAMIC_GEOMETRY_SAMPLES =
  `${NHM2_QEI_RECEIPTED_SMOKE_ROOT}/nhm2-dynamic-geometry-samples.json`;
const NHM2_GR_EVOLVE_DYNAMIC_GEOMETRY_SAMPLE =
  `${NHM2_QEI_RECEIPTED_SMOKE_ROOT}/nhm2-gr-evolve-dynamic-geometry-sample-000.json`;
const NHM2_EFFECTIVE_GEOMETRY_REFERENCE =
  `${NHM2_QEI_RECEIPTED_SMOKE_ROOT}/nhm2-effective-geometry-reference.json`;
const NHM2_GR_EVOLVE_EFFECTIVE_GEOMETRY_REFERENCE =
  `${NHM2_QEI_RECEIPTED_SMOKE_ROOT}/nhm2-gr-evolve-effective-geometry-reference-000.json`;
const NHM2_DYNAMIC_EFFECTIVE_GEOMETRY_EVIDENCE =
  `${NHM2_QEI_RECEIPTED_SMOKE_ROOT}/nhm2-dynamic-effective-geometry-evidence.json`;
const NHM2_AVERAGED_SOURCE_TENSOR_RECEIPT =
  `${NHM2_QEI_RECEIPTED_SMOKE_ROOT}/nhm2-averaged-source-tensor-receipt.json`;
const NHM2_BACKREACTION_RESIDUAL_RECEIPT =
  `${NHM2_QEI_RECEIPTED_SMOKE_ROOT}/nhm2-backreaction-residual-receipt.json`;
const NHM2_TRIP_CLOCKING_PROFILE_INDEX =
  "artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-trip-clocking-profile-index-latest.json";
const NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_PROFILE_ID =
  "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1";
const NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT =
  `artifacts/research/full-solve/profile-campaign-runs/${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_PROFILE_ID}`;
const NHM2_LEAN_CAMPAIGN_CERTIFICATE =
  `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-lean-campaign-certificate.json`;
const NHM2_LEAN_GENERATED_CAMPAIGN_CERTIFICATE =
  "formal/lean/NHM2Formal/Generated/CurrentCampaignCertificate.lean";
const NHM2_LEAN_CERTIFICATE_MODULE =
  "formal/lean/NHM2Formal/Certificate.lean";
const NHM2_LEAN_CLAIM_BOUNDARY_MODULE =
  "formal/lean/NHM2Formal/ClaimBoundary.lean";
const NHM2_LEAN_CERTIFICATE_EXPORTER =
  "tools/nhm2/emit-lean-campaign-certificate.ts";
const NHM2_LEAN_CERTIFICATE_CONTRACT =
  "shared/contracts/nhm2-lean-campaign-certificate.v1.ts";
const NHM2_LEAN_CERTIFICATE_TEST =
  "tests/nhm2/lean-campaign-certificate.spec.ts";
const NHM2_LEAN_CERTIFICATE_CHECK_COMMAND =
  "npm run formal:nhm2:certificate:check";
const NHM2_PHYSICAL_VIABILITY_CAMPAIGN =
  `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-physical-viability-campaign.json`;
const NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT =
  "shared/contracts/nhm2-physical-viability-campaign.v1.ts";
const NHM2_EXPERIMENT_FACING_THEORY_ROADMAP =
  `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-experiment-facing-theory-roadmap.json`;
const NHM2_EXPERIMENT_FACING_THEORY_ROADMAP_CONTRACT =
  "shared/contracts/nhm2-experiment-facing-theory-roadmap.v1.ts";
const NHM2_EXPERIMENT_PARAMETER_TARGETS =
  `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-experiment-parameter-targets.json`;
const NHM2_EXPERIMENT_PARAMETER_TARGETS_CONTRACT =
  "shared/contracts/nhm2-experiment-parameter-targets.v1.ts";
const NHM2_EXPERIMENT_RESEARCH_GAP_LEDGER =
  `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-experiment-research-gap-ledger.json`;
const NHM2_EXPERIMENT_RESEARCH_GAP_LEDGER_CONTRACT =
  "shared/contracts/nhm2-experiment-research-gap-ledger.v1.ts";
const NHM2_LAYER_STACK_MECHANICAL_RECEIPT =
  `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-layer-stack-mechanical-receipt.json`;
const NHM2_LAYER_STACK_MECHANICAL_RECEIPT_CONTRACT =
  "shared/contracts/nhm2-layer-stack-mechanical-receipt.v1.ts";
const NHM2_LAYER_STACK_SUPPORT_FRACTION_SWEEP =
  `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-layer-stack-support-fraction-sweep.json`;
const NHM2_LAYER_STACK_SUPPORT_FRACTION_SWEEP_CONTRACT =
  "shared/contracts/nhm2-layer-stack-support-fraction-sweep.v1.ts";
const NHM2_LAYER_STACK_ENGINEERING_ARCHITECTURE_LOOP =
  `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-layer-stack-engineering-architecture-loop.json`;
const NHM2_LAYER_STACK_ENGINEERING_ARCHITECTURE_LOOP_CONTRACT =
  "shared/contracts/nhm2-layer-stack-engineering-architecture-loop.v1.ts";
const NHM2_LAYER_STACK_FULL_APPARATUS_RECEIPT_LOOP =
  `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-layer-stack-full-apparatus-receipt-loop.json`;
const NHM2_LAYER_STACK_FULL_APPARATUS_RECEIPT_LOOP_CONTRACT =
  "shared/contracts/nhm2-layer-stack-full-apparatus-receipt-loop.v1.ts";
const NHM2_TILE_SOURCE_PHYSICAL_VALIDATION_PLAN =
  `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-tile-source-physical-validation-plan.json`;
const NHM2_TILE_SOURCE_PHYSICAL_VALIDATION_PLAN_CONTRACT =
  "shared/contracts/nhm2-tile-source-physical-validation-plan.v1.ts";
const NHM2_RESEARCH_DYNAMICAL_CASIMIR_NATURE_2011 =
  "https://www.nature.com/articles/nature10561";
const NHM2_RESEARCH_CASIMIR_GRAVITATIONAL_MASS = "https://arxiv.org/abs/0710.3841";
const NHM2_RESEARCH_REGULARIZED_CASIMIR_GRAVITY = "https://arxiv.org/abs/1401.0784";
const NHM2_RESEARCH_CONDUCTIVE_PLANE_STACK_CASIMIR = "https://arxiv.org/abs/1505.04169";
const NHM2_RESEARCH_SCHARNHORST_CAUTION =
  "https://www.sciencedirect.com/science/article/pii/037026939090997K";
const NHM2_RESEARCH_ARCHIMEDES_BALANCE_PROTOTYPE =
  "https://link.springer.com/article/10.1140/epjp/s13360-024-04920-x";
const NHM2_RESEARCH_ARCHIMEDES_2025_STATUS = "https://iris.uniss.it/handle/11388/372656";
const NHM2_RESEARCH_ARCHIMEDES_2025_EPJ =
  "https://www.epj-conferences.org/articles/epjconf/abs/2025/04/epjconf_ricap2024_09003/epjconf_ricap2024_09003.html";
const NHM2_RESEARCH_ADVANCED_LIGO_SENSITIVITY = "https://dcc.ligo.org/LIGO-P1500260/public";
const NHM2_RESEARCH_ADVANCED_LIGO_PHYSREVD_93_112004 =
  "https://journals.aps.org/prd/abstract/10.1103/PhysRevD.93.112004";
const NHM2_RESEARCH_SILICON_CASIMIR_CHIP = "https://www.nature.com/articles/ncomms2842";
const NHM2_RESEARCH_PATCH_POTENTIALS = "https://arxiv.org/abs/1409.5012";
const NHM2_RESEARCH_PATCH_POTENTIAL_MEASUREMENT =
  "https://link.aps.org/doi/10.1103/PhysRevResearch.2.023355";
const NHM2_RESEARCH_MILLIMETRE_GRAVITY =
  "https://www.nature.com/articles/s41586-021-03250-7";
const NHM2_RESEARCH_PFENNING_FORD_QI = "https://arxiv.org/abs/gr-qc/9702026";
const NHM2_RESEARCH_REAL_MATERIAL_CASIMIR = "https://arxiv.org/abs/0902.4022";
const NHM2_RESEARCH_ARBITRARY_MATERIAL_CASIMIR = "https://arxiv.org/abs/1010.5539";
const NHM2_RESEARCH_STATIONARY_WORLDLINE_QEI = "https://arxiv.org/abs/2301.01698";
const NHM2_RESEARCH_WARPAX_OBSERVER_ROBUST = "https://arxiv.org/abs/2602.18023";
const NHM2_RESEARCH_GENERIC_WARP_NEC = "https://arxiv.org/abs/2105.03079";
const NHM2_RESEARCH_HIGH_STRESS_NANOMECHANICAL_RESONATORS =
  "https://link.aps.org/doi/10.1103/PhysRevApplied.15.034063";
const NHM2_RESEARCH_ALN_CMOS_MEMS_REVIEW =
  "https://www.tandfonline.com/doi/full/10.1080/10408436.2024.2406247";
const NHM2_RESEARCH_ALN_PIEZO_MEMS_REVIEW =
  "https://pmc.ncbi.nlm.nih.gov/articles/PMC12479902/";
const NHM2_RESEARCH_ALN_ALSCN_MEMS_MIRROR_REVIEW =
  "https://www.nature.com/articles/s41378-025-01053-8";
const NHM2_RESEARCH_TIN_MEMBRANE_RESONATORS =
  "https://pubs.aip.org/aip/apl/article/127/22/222202/3373788/High-Q-membrane-resonators-using-ultra-high-stress";
const NHM2_RESEARCH_CASIMIR_MEMS_REVIEW = "https://pmc.ncbi.nlm.nih.gov/articles/PMC11278474/";
const NHM2_RESEARCH_ROUGHNESS_PULL_IN =
  "https://link.aps.org/doi/10.1103/PhysRevB.72.115426";
const NHM2_RESEARCH_ROUGHNESS_MEMS_ACTUATION =
  "https://link.aps.org/doi/10.1103/PhysRevB.87.125413";
const NHM2_RESEARCH_SURFACE_POTENTIAL_NANOMEMBRANE = "https://arxiv.org/abs/1207.4429";
const NHM2_RESEARCH_CASIMIR_PULL_IN_FRAMEWORK =
  "https://royalsocietypublishing.org/doi/10.1098/rspa.2020.0311";

const NHM2_FULL_SOLVE_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

const COMMON_ASSUMPTIONS = [
  "NHM2 full-solve rows are same-chart diagnostic context.",
  "Repository artifacts define row status and blocker state.",
  "External literature supplies formalism, context, and limitations only.",
  "No row establishes NHM2 validation, propulsion, physical feasibility, QEI completion, or a transport route.",
];

const docRef = (path: string, id?: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "doc",
  path,
  id: id ?? null,
  note: note ?? null,
});

const repoRef = (path: string, id?: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "repo_module",
  path,
  id: id ?? null,
  note: note ?? null,
});

const artifactRef = (path: string, id?: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "artifact",
  path,
  id: id ?? null,
  note: note ?? null,
});

const literatureRef = (path: string, id: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "literature_ref",
  path,
  id,
  note: note ?? null,
});

const equationMapRef = (id: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "equation_map_node",
  path: NHM2_OBSERVABLE_EQUATION_MAP,
  id,
  note: note ?? null,
});

const payload = (args: {
  id: string;
  expression: string;
  displayLatex: string;
  targetVariable: string;
}): TheoryBadgeV1["calculatorPayloads"][number] => ({
  id: args.id,
  expression: args.expression,
  displayLatex: args.displayLatex,
  preferredAction: "solve_with_steps",
  targetVariable: args.targetVariable,
  setupContext: null,
});

const nhm2FullSolveBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: NHM2_FULL_SOLVE_BOUNDARY,
});

export const NHM2_FULL_SOLVE_THEORY_BADGES: TheoryBadgeV1[] = [
  nhm2FullSolveBadge({
    id: "nhm2.observer.eulerian_normal",
    title: "Eulerian Normal Observer",
    plainMeaning: "Defines the Eulerian normal observer from the same-chart lapse and shift fields.",
    whyItMatters:
      "It makes the observer basis explicit before any energy, momentum, stress, or energy-condition diagnostic is interpreted.",
    subjects: ["nhm2", "observer", "eulerian", "adm", "same_chart"],
    level: "derived_relation",
    status: "review",
    simulationOwners: ["NHM2", "general_relativity"],
    equationFamilies: ["observer_projection", "adm_decomposition"],
    tags: ["eulerian_observer", "same_chart", "tensor_component"],
    equations: [
      {
        id: "eulerian_normal_components",
        role: "definition",
        displayLatex: "n_\\mu=(-\\alpha,0,0,0),\\quad n^\\mu=(1/\\alpha,-\\beta^i/\\alpha)",
        computableExpression: null,
        operatorKind: "tensor_component",
        inputSymbols: ["alpha", "beta_i"],
        outputSymbols: ["n_mu", "n^mu"],
      },
    ],
    units: [
      { symbol: "alpha", unit: null, quantity: "lapse", dimensionSignature: "1" },
      { symbol: "beta_i", quantity: "shift", dimensionSignature: "L T^-1" },
      { symbol: "n_mu", quantity: "covariant_observer_normal", dimensionSignature: "1" },
      { symbol: "n^mu", quantity: "contravariant_observer_normal", dimensionSignature: "1" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Observer normalization depends on the declared lapse-shift chart.",
      "Observer bookkeeping is not ordinary transport-speed authority.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "eulerian-observers", "Whitepaper observer-normal section."),
      equationMapRef("eulerian_observer_normal", "Observable equation map node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "observer", "eulerian", "adm", "same_chart"],
      symbols: ["alpha", "beta_i", "n_mu", "n^mu"],
      unitSignatures: ["1", "L T^-1"],
      repoPaths: [NHM2_FULL_SOLVE_WHITEPAPER, NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["observer_projection", "adm_decomposition"],
      simulationOwners: ["NHM2", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.observer.energy_density_projection",
    title: "Observer Energy-Density Projection",
    plainMeaning: "Projects the same-chart stress-energy tensor into Eulerian energy density.",
    whyItMatters:
      "It separates observer-projected energy density from a raw coordinate component or scalar source proxy.",
    subjects: ["nhm2", "observer", "stress_energy", "energy_density", "projection"],
    level: "derived_relation",
    status: "review",
    simulationOwners: ["NHM2", "general_relativity"],
    equationFamilies: ["observer_projection", "stress_energy_projection"],
    tags: ["energy_density", "tensor_component", "same_chart"],
    equations: [
      {
        id: "observer_energy_density_projection",
        role: "definition",
        displayLatex: "E=T_{\\mu\\nu}n^\\mu n^\\nu",
        computableExpression: null,
        operatorKind: "tensor_component",
        inputSymbols: ["T_mu_nu", "n^mu"],
        outputSymbols: ["E"],
      },
    ],
    units: [{ symbol: "E", unit: "J/m^3", quantity: "observer_energy_density", dimensionSignature: "M L^-1 T^-2" }],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Projected E is observer-family evidence, not a full energy-condition result.",
      "The tensor and observer normal must share one chart and basis.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "stress-energy-projections", "Whitepaper projection grammar."),
      equationMapRef("observer_energy_density", "Observable equation map node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "observer", "stress_energy", "energy_density", "projection"],
      symbols: ["T_mu_nu", "n^mu", "E"],
      unitSignatures: ["M L^-1 T^-2"],
      repoPaths: [NHM2_FULL_SOLVE_WHITEPAPER, NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["observer_projection", "stress_energy_projection"],
      simulationOwners: ["NHM2", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.observer.momentum_density_projection",
    title: "Observer Momentum-Density Projection",
    plainMeaning: "Projects the same-chart stress-energy tensor into Eulerian momentum density.",
    whyItMatters:
      "It makes the missing or review-gated momentum channels visible so diagonal-only source proxies cannot stand in for full observer authority.",
    subjects: ["nhm2", "observer", "stress_energy", "momentum_density", "projection"],
    level: "derived_relation",
    status: "review",
    simulationOwners: ["NHM2", "general_relativity"],
    equationFamilies: ["observer_projection", "stress_energy_projection"],
    tags: ["momentum_density", "tensor_component", "same_chart", "diagonal_proxy_boundary"],
    equations: [
      {
        id: "observer_momentum_density_projection",
        role: "definition",
        displayLatex: "J_i=-T_{\\mu\\nu}n^\\mu\\gamma^\\nu{}_i",
        computableExpression: null,
        operatorKind: "tensor_component",
        inputSymbols: ["T_mu_nu", "n^mu", "gamma^nu_i"],
        outputSymbols: ["J_i"],
      },
    ],
    units: [{ symbol: "J_i", unit: "J/m^3", quantity: "momentum_density_projection", dimensionSignature: "M L^-1 T^-2" }],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "A diagonal-only stress proxy cannot substitute for observer momentum-density channels.",
      "Momentum projection remains review-gated unless component authority is attached.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "stress-energy-projections", "Whitepaper projection grammar."),
      equationMapRef("momentum_density", "Observable equation map node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "observer", "stress_energy", "momentum_density", "projection"],
      symbols: ["T_mu_nu", "n^mu", "gamma^nu_i", "J_i"],
      unitSignatures: ["M L^-1 T^-2"],
      repoPaths: [NHM2_FULL_SOLVE_WHITEPAPER, NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["observer_projection", "stress_energy_projection"],
      simulationOwners: ["NHM2", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.observer.spatial_stress_projection",
    title: "Observer Spatial-Stress Projection",
    plainMeaning: "Projects the same-chart stress-energy tensor into spatial stress components.",
    whyItMatters:
      "It records the off-diagonal spatial-stress authority required before observer-family diagnostics can be interpreted strongly.",
    subjects: ["nhm2", "observer", "stress_energy", "spatial_stress", "projection"],
    level: "derived_relation",
    status: "review",
    simulationOwners: ["NHM2", "general_relativity"],
    equationFamilies: ["observer_projection", "stress_energy_projection"],
    tags: ["spatial_stress", "tensor_component", "same_chart", "off_diagonal_authority"],
    equations: [
      {
        id: "observer_spatial_stress_projection",
        role: "definition",
        displayLatex: "S_{ij}=T_{\\mu\\nu}\\gamma^\\mu{}_i\\gamma^\\nu{}_j",
        computableExpression: null,
        operatorKind: "tensor_component",
        inputSymbols: ["T_mu_nu", "gamma^mu_i", "gamma^nu_j"],
        outputSymbols: ["S_ij"],
      },
    ],
    units: [{ symbol: "S_ij", unit: "J/m^3", quantity: "spatial_stress_projection", dimensionSignature: "M L^-1 T^-2" }],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Off-diagonal stress authority is required for full observer-family interpretation.",
      "Review-gated tensor cells block promotion-sensitive wording.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "stress-energy-projections", "Whitepaper projection grammar."),
      equationMapRef("spatial_stress", "Observable equation map node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "observer", "stress_energy", "spatial_stress", "projection"],
      symbols: ["T_mu_nu", "gamma^mu_i", "gamma^nu_j", "S_ij"],
      unitSignatures: ["M L^-1 T^-2"],
      repoPaths: [NHM2_FULL_SOLVE_WHITEPAPER, NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["observer_projection", "stress_energy_projection"],
      simulationOwners: ["NHM2", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.tensor.full_authority_gate",
    title: "Full Tensor Authority Gate",
    plainMeaning:
      "Tracks whether T00, momentum density J_i, diagonal spatial stress, and off-diagonal S_ij are all emitted in the same chart.",
    whyItMatters:
      "It makes the diagonal-only blocker explicit before observer-family WEC/NEC/SEC/DEC diagnostics can be interpreted.",
    subjects: ["nhm2", "tensor", "full_authority", "observer", "same_chart"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity"],
    equationFamilies: ["tensor_authority", "observer_projection"],
    tags: ["full_tensor", "diagonal_proxy_boundary", "momentum_density", "off_diagonal_authority"],
    equations: [
      {
        id: "full_tensor_authority_gate",
        role: "gate",
        displayLatex: "\\mathrm{authority}=T_{00}\\land J_i\\land S_{ii}\\land S_{ij,i\\ne j}",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["T00", "J_i", "S_ii", "S_ij_offdiag"],
        outputSymbols: ["tensor_authority_status"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Diagonal-only tensor output blocks full observer authority.",
      "Momentum-density and off-diagonal spatial-stress channels must be emitted in the same chart.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "why-diagonal-only-was-insufficient", "Diagonal-only limitation."),
      equationMapRef("momentum_density", "Momentum projection node."),
      equationMapRef("spatial_stress", "Spatial-stress projection node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "tensor", "full_authority", "observer", "same_chart"],
      symbols: ["T00", "J_i", "S_ii", "S_ij_offdiag", "tensor_authority_status"],
      unitSignatures: ["M L^-1 T^-2"],
      repoPaths: [NHM2_FULL_SOLVE_WHITEPAPER, NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["tensor_authority", "observer_projection"],
      simulationOwners: ["NHM2", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.tensor.same_chart_full_tensor",
    title: "Same-Chart Full Tensor Artifact",
    plainMeaning:
      "Tracks explicit T00, T0i momentum-density, diagonal stress, and off-diagonal stress component status in one chart.",
    whyItMatters:
      "It prevents missing T0i or off-diagonal Tij components from being silently interpreted as zero or complete.",
    subjects: ["nhm2", "tensor", "same_chart", "full_tensor", "adm"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity"],
    equationFamilies: ["same_chart_full_tensor", "adm_decomposition"],
    tags: ["full_tensor", "same_chart", "component_status", "adm", "blocks_promotion"],
    equations: [
      {
        id: "same_chart_full_tensor_gate",
        role: "gate",
        displayLatex:
          "\\mathrm{Tensor}_{full}=T_{00}\\land T_{0i}\\land T_{ii}\\land T_{ij,i\\ne j}",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["T00", "T0i", "Tii", "Tij_offdiag", "alpha", "beta_i", "gamma_ij", "K_ij"],
        outputSymbols: ["same_chart_full_tensor_status"],
      },
    ],
    units: [
      { symbol: "T00", unit: "J/m^3", quantity: "energy_density_component", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "Tij", unit: "Pa", quantity: "spatial_stress_component", dimensionSignature: "M L^-1 T^-2" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "The artifact is a component-status contract, not a tensor optimizer.",
      "Missing components remain missing or blocked and are not zero-filled.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef("shared/contracts/nhm2-same-chart-full-tensor.v1.ts", "nhm2-same-chart-full-tensor-contract", "Typed component status and provenance contract."),
      equationMapRef("momentum_density", "Momentum projection node."),
      equationMapRef("spatial_stress", "Spatial-stress projection node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "tensor", "same_chart", "full_tensor", "adm"],
      symbols: ["T00", "T0i", "Tii", "Tij_offdiag", "alpha", "beta_i", "gamma_ij", "K_ij"],
      unitSignatures: ["M L^-1 T^-2"],
      repoPaths: ["shared/contracts/nhm2-same-chart-full-tensor.v1.ts", NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["same_chart_full_tensor", "adm_decomposition"],
      simulationOwners: ["NHM2", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.tensor.metric_required_stress_energy",
    title: "Metric-Required Stress-Energy Tensor",
    plainMeaning: "Names the geometry-first stress-energy tensor required by the selected same-chart metric.",
    whyItMatters:
      "It separates what the metric demands from any proposed source-side mechanism or tile-effective counterpart.",
    subjects: ["nhm2", "tensor", "einstein_tensor", "metric_required_source", "same_chart"],
    level: "simulation_specific",
    status: "diagnostic",
    simulationOwners: ["NHM2", "general_relativity"],
    equationFamilies: ["metric_required_source", "einstein_tensor_route"],
    tags: ["metric_required", "tensor_component", "geometry_first"],
    equations: [
      {
        id: "metric_required_stress_energy_tensor",
        role: "definition",
        displayLatex: "T^{geom}_{ab}=G_{ab}/(8\\pi)",
        computableExpression: null,
        operatorKind: "tensor_component",
        inputSymbols: ["G_ab"],
        outputSymbols: ["T_geom_ab"],
      },
    ],
    units: [
      { symbol: "G_ab", quantity: "einstein_tensor", dimensionSignature: "L^-2" },
      { symbol: "T_geom_ab", unit: "geometric_units", quantity: "metric_required_stress_energy", dimensionSignature: "L^-2" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Metric-required tensor authority is not source-side mechanism authority.",
      "The Einstein-tensor route is repository-internal metric evaluation context.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "einstein-tensor-route", "Geometry-first tensor route."),
      equationMapRef("einstein_tensor_source", "Observable equation map node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "tensor", "einstein_tensor", "metric_required_source", "same_chart"],
      symbols: ["G_ab", "T_geom_ab"],
      unitSignatures: ["L^-2"],
      repoPaths: [NHM2_FULL_SOLVE_WHITEPAPER, NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["metric_required_source", "einstein_tensor_route"],
      simulationOwners: ["NHM2", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.tensor.tile_effective_counterpart",
    title: "Tile-Effective Tensor Counterpart",
    plainMeaning:
      "Represents the source-side tile-effective tensor requirement in the same chart, basis, region mask, and normalization convention.",
    whyItMatters:
      "It prevents a mechanism-side Casimir narrative from being mistaken for the tensor counterpart required by the metric route.",
    subjects: ["nhm2", "tensor", "tile_effective_counterpart", "source_side", "same_basis"],
    level: "diagnostic_gate",
    status: "review",
    simulationOwners: ["NHM2", "casimir"],
    equationFamilies: ["tile_effective_counterpart", "source_side_tensor_requirement"],
    tags: ["tile_effective", "source_side", "review_gated", "same_basis"],
    equations: [
      {
        id: "tile_effective_tensor_requirement",
        role: "gate",
        displayLatex:
          "T^{tile\\_eff}_{ab}\\;\\mathrm{requires}\\;sourceSide\\land sameBasis\\land regionMask\\land componentAuthority",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["sourceSide", "sameBasis", "regionMask", "componentAuthority"],
        outputSymbols: ["T_tile_eff_ab"],
      },
    ],
    units: [
      { symbol: "T_tile_eff_ab", unit: "geometric_units", quantity: "tile_effective_stress_energy", dimensionSignature: "L^-2" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Tile-effective counterpart evidence must be source-side and same-basis.",
      "A mechanism-side source model is not the tensor counterpart by itself.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "source-side-full-tensor-counterpart", "Source-side tensor counterpart section."),
      equationMapRef("tile_effective_tensor", "Observable equation map node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "tensor", "tile_effective_counterpart", "source_side", "same_basis"],
      symbols: ["T_tile_eff_ab", "sourceSide", "sameBasis", "regionMask", "componentAuthority"],
      unitSignatures: ["L^-2"],
      repoPaths: [NHM2_FULL_SOLVE_WHITEPAPER, NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["tile_effective_counterpart", "source_side_tensor_requirement"],
      simulationOwners: ["NHM2", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.source.same_basis_tensor_authority",
    title: "Source-Side Same-Basis Tensor Authority",
    plainMeaning:
      "Records whether the tile/material side supplies an independent same-chart tensor counterpart instead of a proxy scalar or metric echo.",
    whyItMatters:
      "It prevents wall T00 closure from comparing metric-required geometry against a scalar or observation path that is not source-side tensor authority.",
    subjects: ["nhm2", "source_side", "same_basis", "tensor_authority", "wall_region"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "casimir", "general_relativity"],
    equationFamilies: ["source_side_same_basis_tensor_authority", "tile_effective_counterpart"],
    tags: ["source_side", "same_basis", "tensor_authority", "metric_echo_forbidden", "blocks_promotion"],
    equations: [
      {
        id: "source_side_same_basis_tensor_authority_gate",
        role: "gate",
        displayLatex:
          "\\mathrm{Authority}_{source}=sourceSide\\land sameChart\\land fullTensor\\land \\neg metricEcho",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["sourceSide", "sameChart", "fullTensor", "metricEcho"],
        outputSymbols: ["source_side_same_basis_authority_status"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Source authority must be independently produced on the source side.",
      "Metric-required tensors, scalar Casimir budgets, and GR matter observations are not source-side tensor receipts by themselves.",
      "Wall T00 residuals remain diagnostic until wall source-side tensor authority exists.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef("shared/contracts/nhm2-source-side-same-basis-tensor-authority.v1.ts", "nhm2-source-side-same-basis-tensor-authority-contract", "Typed source-side same-basis tensor authority receipt."),
      artifactRef("shared/contracts/nhm2-tile-effective-counterpart.v1.ts", "nhm2-tile-effective-counterpart-contract", "Existing tile-effective counterpart contract consumed by the authority receipt."),
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "source-side-full-tensor-counterpart", "Source-side tensor authority discussion."),
    ],
    hintKeys: {
      subjects: ["nhm2", "source_side", "same_basis", "tensor_authority", "wall_region"],
      symbols: ["source_side_same_basis_authority_status", "sourceSide", "sameChart", "fullTensor", "metricEcho"],
      unitSignatures: [],
      repoPaths: [
        "shared/contracts/nhm2-source-side-same-basis-tensor-authority.v1.ts",
        "shared/contracts/nhm2-tile-effective-counterpart.v1.ts",
        NHM2_FULL_SOLVE_WHITEPAPER,
      ],
      equationFamilies: ["source_side_same_basis_tensor_authority", "tile_effective_counterpart"],
      simulationOwners: ["NHM2", "casimir", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.source.component_authority_ledger",
    title: "Source Component Authority Ledger",
    plainMeaning:
      "Records whether each regional source-side tensor component is present, admissible, non-proxy, and non-metric-echo.",
    whyItMatters:
      "It lets the theory graph distinguish evidence admission from physical material proof and prevents stale source-authority blockers from hiding the next gate.",
    subjects: ["nhm2", "source_side", "component_authority", "full_tensor", "anti_proxy"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["NHM2", "casimir", "general_relativity"],
    equationFamilies: ["source_component_authority_ledger", "tile_effective_counterpart"],
    tags: ["component_authority", "anti_proxy", "full_tensor", "metric_echo_forbidden", "runtime_artifact"],
    equations: [
      {
        id: "source_component_authority_ledger_gate",
        role: "gate",
        displayLatex:
          "\\mathrm{Ledger}_{source}=\\bigwedge_R(T_{00}\\land T_{0i}\\land T_{ii}\\land T_{ij,i\\ne j})_{source}",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["T00_R", "T0i_R", "Tii_R", "Tij_offdiag_R", "authority_R"],
        outputSymbols: ["source_component_authority_status"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "The ledger is an evidence-admission surface, not a material-source proof.",
      "A complete component ledger cannot override residual, conservation, QEI, observer, material, reproducibility, or claim gates.",
      "The current smoke-chain ledger is local pinned evidence and still requires frozen reference-chain promotion review.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(
        "shared/contracts/nhm2-source-component-authority-ledger.v1.ts",
        "nhm2-source-component-authority-ledger-contract",
        "Typed component-level source authority contract.",
      ),
      artifactRef(
        NHM2_SOURCE_COMPONENT_AUTHORITY_LEDGER,
        "sha256:be165467299ebb898ced93106e9bf3d979b60c6624537294c5e74ea3b668ebfa",
        "Pinned local smoke-chain ledger: complete source component authority is evidence admission only.",
      ),
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "may-baseline-and-june-pass-path-delta", "June pass-path delta."),
    ],
    hintKeys: {
      subjects: ["nhm2", "source_side", "component_authority", "full_tensor", "anti_proxy"],
      symbols: ["T00_R", "T0i_R", "Tii_R", "Tij_offdiag_R", "authority_R"],
      unitSignatures: [],
      repoPaths: [
        "shared/contracts/nhm2-source-component-authority-ledger.v1.ts",
        NHM2_SOURCE_COMPONENT_AUTHORITY_LEDGER,
        NHM2_FULL_SOLVE_WHITEPAPER,
      ],
      equationFamilies: ["source_component_authority_ledger", "tile_effective_counterpart"],
      simulationOwners: ["NHM2", "casimir", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.source.wall_t00_trace",
    title: "Wall T00 Trace Blocker",
    plainMeaning:
      "Promotes the wall-region metric-required T00 versus tile-effective T00 residual to an explicit blocker surface.",
    whyItMatters:
      "The wall residual is the high-risk source-closure anomaly and should not be hidden behind flattering global aggregates.",
    subjects: ["nhm2", "source_closure", "wall_region", "T00", "residual"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["regional_source_closure", "wall_t00_trace"],
    tags: ["wall_region", "T00", "relLInf", "t00_mismatch_present", "blocks_promotion"],
    equations: [
      {
        id: "wall_t00_residual_norm",
        role: "residual",
        displayLatex: "\\Delta T_{00}^{wall}=T_{00,geom}^{wall}-T_{00,tile}^{wall}",
        computableExpression: null,
        operatorKind: "residual",
        inputSymbols: ["T00_geom_wall", "T00_tile_wall"],
        outputSymbols: ["Delta_T00_wall"],
      },
      {
        id: "wall_t00_rel_linf",
        role: "residual",
        displayLatex: "\\mathrm{relLInf}_{wall}=\\|\\Delta T_{00}^{wall}\\|_\\infty/\\|T_{00,geom}^{wall}\\|_\\infty",
        computableExpression: null,
        operatorKind: "region_aggregate",
        inputSymbols: ["Delta_T00_wall", "T00_geom_wall"],
        outputSymbols: ["wall_t00_relLInf"],
      },
    ],
    units: [
      { symbol: "Delta_T00_wall", unit: "geometric_units", quantity: "wall_t00_residual", dimensionSignature: "L^-2" },
      { symbol: "wall_t00_relLInf", unit: null, quantity: "relative_linf_residual", dimensionSignature: "1" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Wall T00 mismatch is a blocker trace, not a solved source-closure route.",
      "The next technical action is direct_t00_source_model_mapping before formula retuning.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(
        "artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-wall-latest.json",
        "metric-required-wall-t00",
        "Wall-region metric-required diagonal tensor artifact.",
      ),
      artifactRef(
        "artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-wall-latest.json",
        "tile-effective-wall-t00",
        "Wall-region tile-effective diagonal tensor artifact.",
      ),
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "same-basis-closure", "Regional closure discussion."),
    ],
    hintKeys: {
      subjects: ["nhm2", "source_closure", "wall_region", "T00", "residual"],
      symbols: ["T00_geom_wall", "T00_tile_wall", "Delta_T00_wall", "wall_t00_relLInf"],
      unitSignatures: ["L^-2", "1"],
      repoPaths: [
        "artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-wall-latest.json",
        "artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-wall-latest.json",
        NHM2_FULL_SOLVE_WHITEPAPER,
      ],
      equationFamilies: ["regional_source_closure", "wall_t00_trace"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.closure.same_basis_regional_residual",
    title: "Same-Basis Regional Tensor Residual",
    plainMeaning: "Compares metric-required and tile-effective tensors only after same-basis regional alignment.",
    whyItMatters:
      "It names the central full-solve divergence surface without implying the source-to-geometry bridge is complete.",
    subjects: ["nhm2", "closure_residual", "same_basis", "regional_closure", "tensor"],
    level: "diagnostic_gate",
    status: "review",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["same_basis_regional_closure", "tensor_residual"],
    tags: ["regional_residual", "same_basis", "review_gated", "tensor_comparison"],
    equations: [
      {
        id: "same_basis_tensor_residual",
        role: "residual",
        displayLatex: "\\Delta T_{ab}=T^{geom}_{ab}-T^{tile\\_eff}_{ab}",
        computableExpression: null,
        operatorKind: "residual",
        inputSymbols: ["T_geom_ab", "T_tile_eff_ab"],
        outputSymbols: ["Delta_T_ab"],
      },
      {
        id: "regional_tensor_residual_aggregate",
        role: "residual",
        displayLatex: "\\|\\Delta T\\|_R=\\mathrm{aggregate}_R(\\Delta T_{ab})",
        computableExpression: null,
        operatorKind: "region_aggregate",
        inputSymbols: ["Delta_T_ab", "R"],
        outputSymbols: ["Delta_T_norm_R"],
      },
    ],
    units: [
      { symbol: "Delta_T_ab", unit: "geometric_units", quantity: "tensor_residual", dimensionSignature: "L^-2" },
      { symbol: "Delta_T_norm_R", unit: "geometric_units", quantity: "regional_tensor_residual", dimensionSignature: "L^-2" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Residual comparison requires same chart, basis, region mask, aggregation mode, and normalization.",
      "Small or incomplete residuals are diagnostic comparisons, not source closure completion.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "same-basis-closure", "Regional closure discussion."),
      equationMapRef("same_basis_closure", "Same-basis closure node."),
      equationMapRef("regional_source_closure", "Regional closure node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "closure_residual", "same_basis", "regional_closure", "tensor"],
      symbols: ["Delta_T_ab", "Delta_T_norm_R", "T_geom_ab", "T_tile_eff_ab", "R"],
      unitSignatures: ["L^-2"],
      repoPaths: [NHM2_FULL_SOLVE_WHITEPAPER, NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["same_basis_regional_closure", "tensor_residual"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.closure.coupled_pass_candidate",
    title: "Coupled Closure Pass Candidate",
    plainMeaning:
      "Synchronizes source authority, regional residuals, conservation, QEI dossier, observer robustness, and material receipt gates into one diagnostic candidate.",
    whyItMatters:
      "It is the runtime row that prevents a green-looking individual gate from being mistaken for full-solve closure.",
    subjects: ["nhm2", "coupled_closure", "pass_candidate", "proof_stack", "artifact_governance"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["coupled_closure_pass_candidate", "closure_stack"],
    tags: ["coupled_closure", "passCandidate_false", "runtime_artifact", "blocks_promotion"],
    equations: [
      {
        id: "coupled_closure_pass_candidate_gate",
        role: "gate",
        displayLatex:
          "passCandidate=source\\land residuals\\land conservation\\land QEI\\land observer\\land material",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["source", "residuals", "conservation", "QEI", "observer", "material"],
        outputSymbols: ["passCandidate"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "The current pinned smoke-chain coupled candidate is false.",
      "A coupled candidate is a diagnostic synchronization gate and still cannot grant physical or transport claims.",
      "Individual pass rows cannot override a failed coupled closure candidate.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(
        "shared/contracts/nhm2-coupled-closure-pass-candidate.v1.ts",
        "nhm2-coupled-closure-pass-candidate-contract",
        "Typed coupled closure pass-candidate contract.",
      ),
      artifactRef(
        NHM2_COUPLED_CLOSURE_PASS_CANDIDATE,
        "sha256:739ec5b9b887c42575ff8184bfe8e3d99e06c70e397abe233357d2e9aef040bc",
        "Pinned local smoke-chain artifact: passCandidate=false.",
      ),
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "may-baseline-and-june-pass-path-delta", "June pass-path delta."),
    ],
    hintKeys: {
      subjects: ["nhm2", "coupled_closure", "pass_candidate", "proof_stack", "artifact_governance"],
      symbols: ["source", "residuals", "conservation", "QEI", "observer", "material", "passCandidate"],
      unitSignatures: [],
      repoPaths: [
        "shared/contracts/nhm2-coupled-closure-pass-candidate.v1.ts",
        NHM2_COUPLED_CLOSURE_PASS_CANDIDATE,
        NHM2_FULL_SOLVE_WHITEPAPER,
      ],
      equationFamilies: ["coupled_closure_pass_candidate", "closure_stack"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.closure.regional_tensor_pass_path_harness",
    title: "Regional Tensor Pass-Path Harness",
    plainMeaning:
      "Reports whether the regional tensor closure path is numerically ready after source authority, wall T00, residual, conservation, QEI, observer, material, and coupled-candidate gates.",
    whyItMatters:
      "It is the graph row that answers what still has to pass numerically without converting smoke-chain progress into physical viability.",
    subjects: ["nhm2", "regional_tensor", "pass_path", "numerical_readiness", "closure_stack"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["regional_tensor_pass_path_harness", "closure_stack"],
    tags: ["pass_path_harness", "numericalPassPathReady_false", "runtime_artifact", "blocks_promotion"],
    equations: [
      {
        id: "regional_tensor_pass_path_harness_gate",
        role: "gate",
        displayLatex:
          "ready=regionalTensors\\land R_{wall,T00}\\land residuals\\land conservation\\land QEI\\land observer\\land material\\land coupled",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: [
          "regionalTensors",
          "R_wall_T00",
          "residuals",
          "conservation",
          "QEI",
          "observer",
          "material",
          "coupled",
        ],
        outputSymbols: ["numericalPassPathReady"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "The current pinned smoke-chain harness has wall T00 under tolerance but numericalPassPathReady=false.",
      "The harness is an artifact-backed scoreboard, not a calculator formula.",
      "Physical and transport claims remain forbidden even if diagnostic readiness improves.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(
        "shared/contracts/nhm2-regional-tensor-pass-path-harness.v1.ts",
        "nhm2-regional-tensor-pass-path-harness-contract",
        "Typed numerical pass-path harness contract.",
      ),
      artifactRef(
        NHM2_REGIONAL_TENSOR_PASS_PATH_HARNESS,
        "sha256:b16bf1f9e0f288c7ba1dea2b800333292b4a6c16b119c4a8443d0805f0527b71",
        "Pinned local smoke-chain artifact: numericalPassPathReady=false; wall.relLInf=0.08853034907135743.",
      ),
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "may-baseline-and-june-pass-path-delta", "June pass-path delta."),
    ],
    hintKeys: {
      subjects: ["nhm2", "regional_tensor", "pass_path", "numerical_readiness", "closure_stack"],
      symbols: [
        "regionalTensors",
        "R_wall_T00",
        "residuals",
        "conservation",
        "QEI",
        "observer",
        "material",
        "coupled",
        "numericalPassPathReady",
      ],
      unitSignatures: [],
      repoPaths: [
        "shared/contracts/nhm2-regional-tensor-pass-path-harness.v1.ts",
        NHM2_REGIONAL_TENSOR_PASS_PATH_HARNESS,
        NHM2_FULL_SOLVE_WHITEPAPER,
      ],
      equationFamilies: ["regional_tensor_pass_path_harness", "closure_stack"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.dynamic.switching_covariant_conservation",
    title: "Switching Covariant Conservation",
    plainMeaning:
      "Records whether the dynamic source campaign includes regional-support, sector-boundary, time-derivative, and transition-kernel conservation terms.",
    whyItMatters:
      "It prevents static covariant conservation from being mistaken for conservation of a sector-switched time-dependent source.",
    subjects: ["nhm2", "dynamic_campaign", "switching", "covariant_conservation"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["switching_covariant_conservation", "time_dependent_source_campaign"],
    tags: ["switching_conservation", "runtime_artifact", "noncomputable_reference"],
    equations: [
      {
        id: "switching_covariant_conservation_gate",
        role: "noncomputable_reference",
        displayLatex:
          "\\nabla_\\mu T^{\\mu\\nu}(t)=terms(W_R)+terms(sector)+terms(\\partial_t)+terms(kernel)",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["W_R", "sector", "partial_t", "kernel", "T_mu_nu(t)"],
        outputSymbols: ["switchingConservationPass"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Static covariant conservation cannot substitute for switching-sector conservation.",
      "This row is runtime evidence and has no calculator payload.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(
        "shared/contracts/nhm2-time-dependent-source-campaign.v1.ts",
        "nhm2-switching-covariant-conservation-evidence-contract",
        "Typed switching conservation evidence contract.",
      ),
      artifactRef(
        "tools/nhm2/build-switching-covariant-conservation-evidence.ts",
        "nhm2-switching-covariant-conservation-evidence-builder",
        "Builder for declared/frozen switching conservation terms.",
      ),
      artifactRef(
        NHM2_SWITCHING_COVARIANT_CONSERVATION_EVIDENCE,
        "sha256:3fad6ae8f58fd4c6648ac78a1756c02b7902f69b25ffee0eeafaeca99dee2b34",
        "Pinned smoke-chain switching evidence: conservationStatus=pass; overallResidualLInf=0.045.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "dynamic_campaign", "switching", "covariant_conservation"],
      symbols: ["W_R", "sector", "partial_t", "kernel", "T_mu_nu(t)", "switchingConservationPass"],
      unitSignatures: [],
      repoPaths: [
        "shared/contracts/nhm2-time-dependent-source-campaign.v1.ts",
        "tools/nhm2/build-switching-covariant-conservation-evidence.ts",
        NHM2_SWITCHING_COVARIANT_CONSERVATION_EVIDENCE,
      ],
      equationFamilies: ["switching_covariant_conservation", "time_dependent_source_campaign"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.dynamic.frequency_convergence",
    title: "Frequency Convergence",
    plainMeaning:
      "Records whether a frozen frequency ladder converges at fixed cycle-average source over f, 2f, 4f, and 8f.",
    whyItMatters:
      "It distinguishes a single-frequency artifact from an effective-source limit that remains stable as switching frequency increases.",
    subjects: ["nhm2", "dynamic_campaign", "frequency_ladder", "cycle_average"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["frequency_convergence", "time_dependent_source_campaign"],
    tags: ["frequency_convergence", "runtime_artifact", "noncomputable_reference"],
    equations: [
      {
        id: "frequency_convergence_gate",
        role: "noncomputable_reference",
        displayLatex: "f,2f,4f,8f\\quad\\mathrm{at\\ fixed\\ cycle\\ average}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["f", "cycleAverageSource", "residualLInf"],
        outputSymbols: ["frequencyConvergencePass"],
      },
    ],
    units: [{ symbol: "f", unit: "Hz", quantity: "switching_frequency", dimensionSignature: "T^-1" }],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "A single-frequency result fails closed.",
      "Cycle-average source must remain fixed across the ladder.",
      "This row is runtime evidence and has no calculator payload.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(
        "shared/contracts/nhm2-time-dependent-source-campaign.v1.ts",
        "nhm2-frequency-convergence-evidence-contract",
        "Typed frequency convergence evidence contract.",
      ),
      artifactRef(
        "tools/nhm2/build-frequency-convergence-evidence.ts",
        "nhm2-frequency-convergence-evidence-builder",
        "Builder for declared/frozen frequency ladder residuals.",
      ),
      artifactRef(
        NHM2_FREQUENCY_CONVERGENCE_EVIDENCE,
        "sha256:653026c32333e63143c5f0da967f527720185776cefbaeb907a3d83a7043a743",
        "Pinned smoke-chain frequency evidence: f,2f,4f,8f pass at fixed cycle-average source.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "dynamic_campaign", "frequency_ladder", "cycle_average"],
      symbols: ["f", "cycleAverageSource", "residualLInf", "frequencyConvergencePass"],
      unitSignatures: ["T^-1"],
      repoPaths: [
        "shared/contracts/nhm2-time-dependent-source-campaign.v1.ts",
        "tools/nhm2/build-frequency-convergence-evidence.ts",
        NHM2_FREQUENCY_CONVERGENCE_EVIDENCE,
      ],
      equationFamilies: ["frequency_convergence", "time_dependent_source_campaign"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.dynamic.effective_geometry_agreement",
    title: "Dynamic/Effective Geometry Agreement",
    plainMeaning:
      "Checks whether a time-averaged dynamic source geometry agrees with the reduced-order effective-source geometry and has bounded backreaction residuals.",
    whyItMatters:
      "It verifies the current smoke-chain dynamic and effective geometry channels have a bounded diagnostic residual, then hands the campaign to the full regional tensor closure gate.",
    subjects: ["nhm2", "dynamic_campaign", "effective_geometry", "backreaction", "time_averaging"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["dynamic_effective_geometry", "time_dependent_source_campaign"],
    tags: ["dynamic_geometry", "effective_geometry", "backreaction", "runtime_artifact", "noncomputable_reference"],
    equations: [
      {
        id: "dynamic_effective_geometry_gate",
        role: "noncomputable_reference",
        displayLatex:
          "\\langle g_{\\mu\\nu}(t)\\rangle_{cycle}\\stackrel{?}{\\sim}g^{eff}_{\\mu\\nu},\\quad \\|C^{backreaction}_{\\mu\\nu}\\|<\\epsilon",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["dynamicGeometryRef", "effectiveGeometryRef", "averagedSourceTensorRef"],
        outputSymbols: ["dynamicGeometryAgreementPass"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "A static effective geometry summary cannot substitute for dynamic geometry samples.",
      "Missing dynamic geometry, missing effective geometry, missing averaged source tensor, missing backreaction receipt, or unbounded backreaction must block this gate.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(
        "tools/nhm2/build-dynamic-geometry-samples.ts",
        "nhm2-dynamic-geometry-samples-builder",
        "Builder that emits the dynamic geometry sample receipt consumed by the dynamic/effective geometry gate.",
      ),
      artifactRef(
        "tools/nhm2/capture-gr-evolve-dynamic-geometry-samples.ts",
        "nhm2-gr-evolve-dynamic-geometry-capture",
        "Capture tool that writes a gr-evolve-brick sample and validates the required dynamic geometry channels.",
      ),
      artifactRef(
        NHM2_GR_EVOLVE_DYNAMIC_GEOMETRY_SAMPLE,
        "sha256:fa86257dcbe43705998e8eb0de90dcc8d4070beaf371bd295762c788a3a9f51d",
        "Pinned gr-evolve-brick dynamic geometry sample used by the smoke-chain receipt.",
      ),
      artifactRef(
        NHM2_DYNAMIC_GEOMETRY_SAMPLES,
        "sha256:9e4c0632075e682361a396140fc8a289adced8674cebf5951c6ba8dd2897bdec",
        "Pinned smoke-chain dynamic geometry sample receipt: one computed gr-evolve-brick sample with ADM/BSSN geometry channels.",
      ),
      artifactRef(
        "tools/nhm2/capture-gr-evolve-effective-geometry-reference.ts",
        "nhm2-gr-evolve-effective-geometry-capture",
        "Capture tool that writes a static gr-evolve-brick effective geometry reference and validates the required geometry channels.",
      ),
      artifactRef(
        NHM2_GR_EVOLVE_EFFECTIVE_GEOMETRY_REFERENCE,
        "sha256:d174fcd2fda6a4f1d58e2fded84b45fb8d480c15be8a00202ab31dbf6ce9ecb8",
        "Pinned gr-evolve-brick effective geometry reference used by the smoke-chain receipt.",
      ),
      artifactRef(
        NHM2_EFFECTIVE_GEOMETRY_REFERENCE,
        "sha256:b5682e31389d31ebb2e091b805370d834912ead53c7716221001b0d666f6cee8",
        "Pinned smoke-chain effective geometry reference: computed static gr-evolve-brick reference with required ADM/BSSN channels.",
      ),
      artifactRef(
        "tools/nhm2/build-dynamic-effective-geometry-evidence.ts",
        "nhm2-dynamic-effective-geometry-evidence-builder",
        "Builder that emits a fail-closed dynamic/effective geometry receipt.",
      ),
      artifactRef(
        "shared/contracts/nhm2-averaged-source-tensor-receipt.v1.ts",
        "nhm2-averaged-source-tensor-receipt-contract",
        "Typed receipt that admits a source-side full tensor as cycle-averaged source evidence without proving backreaction.",
      ),
      artifactRef(
        "tools/nhm2/build-averaged-source-tensor-receipt.ts",
        "nhm2-averaged-source-tensor-receipt-builder",
        "Builder that verifies source-side full-tensor provenance, fixed cycle-average source, frequency convergence, and switching conservation.",
      ),
      artifactRef(
        NHM2_AVERAGED_SOURCE_TENSOR_RECEIPT,
        "sha256:3952a494ab657998aa69593f899a964ee67c54f124e38b140bcf74a57be39a79",
        "Pinned averaged source tensor receipt: pass; source-side full tensor admitted for dynamic/effective evidence.",
      ),
      artifactRef(
        "shared/contracts/nhm2-backreaction-residual-receipt.v1.ts",
        "nhm2-backreaction-residual-receipt-contract",
        "Typed receipt that compares cycle-averaged dynamic gr-evolve channels against the effective geometry reference.",
      ),
      artifactRef(
        "tools/nhm2/build-backreaction-residual-receipt.ts",
        "nhm2-backreaction-residual-receipt-builder",
        "Builder that decodes r32f gr-evolve channel fields and computes relative L-infinity/L2 residuals.",
      ),
      artifactRef(
        NHM2_BACKREACTION_RESIDUAL_RECEIPT,
        "sha256:f3f70b36065f1138a195bd74600a34598ff5abd84df070f8386a0be577ad181b",
        "Pinned backreaction residual receipt: bounded=true; residualLInf=0 over the compared smoke-chain channels.",
      ),
      artifactRef(
        NHM2_DYNAMIC_EFFECTIVE_GEOMETRY_EVIDENCE,
        "sha256:f43d392b011af51c11945662d315326c7b75ceefd34f7d851ce7a5a05371491d",
        "Pinned smoke-chain dynamic/effective geometry receipt: pass; bounded diagnostic backreaction residual.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "dynamic_campaign", "effective_geometry", "backreaction"],
      symbols: [
        "dynamicGeometryRef",
        "effectiveGeometryRef",
        "averagedSourceTensorRef",
        "backreaction",
        "dynamicGeometryAgreementPass",
      ],
      unitSignatures: [],
      repoPaths: [
        "shared/contracts/nhm2-time-dependent-source-campaign.v1.ts",
        "shared/contracts/nhm2-dynamic-geometry-samples.v1.ts",
        "tools/nhm2/build-dynamic-geometry-samples.ts",
        "tools/nhm2/capture-gr-evolve-dynamic-geometry-samples.ts",
        NHM2_GR_EVOLVE_DYNAMIC_GEOMETRY_SAMPLE,
        "tools/nhm2/capture-gr-evolve-effective-geometry-reference.ts",
        NHM2_GR_EVOLVE_EFFECTIVE_GEOMETRY_REFERENCE,
        NHM2_EFFECTIVE_GEOMETRY_REFERENCE,
        "tools/nhm2/build-dynamic-effective-geometry-evidence.ts",
        "shared/contracts/nhm2-averaged-source-tensor-receipt.v1.ts",
        "tools/nhm2/build-averaged-source-tensor-receipt.ts",
        "shared/contracts/nhm2-backreaction-residual-receipt.v1.ts",
        "tools/nhm2/build-backreaction-residual-receipt.ts",
        NHM2_DYNAMIC_GEOMETRY_SAMPLES,
        NHM2_AVERAGED_SOURCE_TENSOR_RECEIPT,
        NHM2_BACKREACTION_RESIDUAL_RECEIPT,
        NHM2_DYNAMIC_EFFECTIVE_GEOMETRY_EVIDENCE,
      ],
      equationFamilies: ["dynamic_effective_geometry", "time_dependent_source_campaign"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.source.off_diagonal_shear_audit",
    title: "Off-Diagonal Shear Audit",
    plainMeaning:
      "Checks whether source-side off-diagonal spatial-stress components have documented shear or anisotropic mechanism evidence.",
    whyItMatters:
      "It separates a declared full tensor from a physically interpretable source model for T12, T13, and T23.",
    subjects: ["nhm2", "source_tensor", "off_diagonal_stress", "shear", "dynamic_campaign"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["full_tensor_residual", "time_dependent_source_campaign"],
    tags: ["runtime_artifact", "off_diagonal_tij", "shear_mechanism", "falsifier_candidate"],
    equations: [
      {
        id: "off_diagonal_shear_audit_gate",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{shearAudit}=\\{T_{12},T_{13},T_{23}\\}_{source}\\land mechanism_{shear}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["T12", "T13", "T23", "mechanism_shear"],
        outputSymbols: ["source_off_diagonal_shear_status"],
      },
    ],
    units: [
      { symbol: "Tij", unit: "Pa", quantity: "off_diagonal_spatial_stress", dimensionSignature: "M L^-1 T^-2" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "A generic declared source tensor is not enough to document a shear or anisotropic mechanism.",
      "A shear-audit sidecar sharpens the blocker but does not validate a physical source.",
      "Pass-window values are derived from metric-required residual checks and cannot be used as source-model inputs.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(
        "shared/contracts/nhm2-source-off-diagonal-shear-audit.v1.ts",
        "nhm2-source-off-diagonal-shear-audit-contract",
        "Typed audit for source-side off-diagonal spatial-stress mechanism evidence.",
      ),
      artifactRef(
        "tools/nhm2/build-source-off-diagonal-shear-audit.ts",
        "nhm2-source-off-diagonal-shear-audit-builder",
        "Builder that compares source component authority against regional full-tensor residuals.",
      ),
      artifactRef(
        NHM2_SOURCE_OFF_DIAGONAL_SHEAR_AUDIT,
        "sha256:42b544f4e6d209f4107724ea853075d5e6aaebe4a3e962a361d61519b10ca52f",
        "Pinned local smoke-chain shear audit: currentDeclaredSourceModelFalsified=true; falsifierScope=current_declared_source_model; worst=hull:T13; current-to-allowed magnitude ratio about 1.49e15; uniform fractional shear ansatz detected; worst required suppression about 5.83e15.",
      ),
      artifactRef(
        NHM2_AXIS_ALIGNED_SOURCE_OFF_DIAGONAL_SHEAR_AUDIT,
        "sha256:a6cdf1bca25d7526086284adfb45da412e73b1b72df2b6186319bc18fb5a7ed1",
        "Axis-aligned shear-suppressed candidate audit: off-diagonal mechanism evidence is documented and currentDeclaredSourceModelFalsified=false, but nonzero metric-required off-diagonal residuals still fail with source fractions equal to zero.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "source_tensor", "off_diagonal_stress", "shear", "dynamic_campaign"],
      symbols: ["T12", "T13", "T23", "mechanism_shear", "source_off_diagonal_shear_status"],
      unitSignatures: ["M L^-1 T^-2"],
      repoPaths: [
        "shared/contracts/nhm2-source-off-diagonal-shear-audit.v1.ts",
        "tools/nhm2/build-source-off-diagonal-shear-audit.ts",
        NHM2_SOURCE_OFF_DIAGONAL_SHEAR_AUDIT,
        NHM2_AXIS_ALIGNED_SOURCE_OFF_DIAGONAL_SHEAR_AUDIT,
      ],
      equationFamilies: ["full_tensor_residual", "time_dependent_source_campaign"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.source.momentum_density_audit",
    title: "Momentum-Density Audit",
    plainMeaning:
      "Checks whether source-side T0i momentum-density components have documented flux, current, or constitutive momentum evidence.",
    whyItMatters:
      "It separates a present T0i tensor row from a source model that can actually explain momentum density on the same chart.",
    subjects: ["nhm2", "source_tensor", "momentum_density", "t0i", "dynamic_campaign"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["full_tensor_residual", "time_dependent_source_campaign"],
    tags: ["runtime_artifact", "momentum_t0i", "source_mechanism", "falsifier_candidate"],
    equations: [
      {
        id: "momentum_density_audit_gate",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{momentumAudit}=\\{T_{01},T_{02},T_{03}\\}_{source}\\land mechanism_{J_i}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["T01", "T02", "T03", "mechanism_J_i"],
        outputSymbols: ["source_momentum_density_status"],
      },
    ],
    units: [
      { symbol: "T0i", unit: "J/m^3", quantity: "momentum_density_channel", dimensionSignature: "M L^-1 T^-2" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "A declared full tensor row does not by itself document a momentum-density mechanism.",
      "Momentum-density pass windows are residual diagnostics and cannot be used as source-model inputs.",
      "A current-model falsifier is scoped to the declared source model and is not a universal impossibility proof.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(
        "shared/contracts/nhm2-source-momentum-density-audit.v1.ts",
        "nhm2-source-momentum-density-audit-contract",
        "Typed audit for source-side T0i momentum-density mechanism evidence.",
      ),
      artifactRef(
        "tools/nhm2/build-source-momentum-density-audit.ts",
        "nhm2-source-momentum-density-audit-builder",
        "Builder that compares source component authority against regional full-tensor momentum-density residuals.",
      ),
      artifactRef(
        NHM2_AXIS_ALIGNED_SOURCE_MOMENTUM_DENSITY_AUDIT,
        "sha256:7ee6ec82afd39cea39881b531a778a926f8f68d42b70b93790a570fa19452820",
        "Axis-aligned candidate momentum audit: currentDeclaredSourceModelFalsified=true; causalMaterialMomentumBoundFalsifier=false because the atlas tensor basis is chart, not local_orthonormal_to_chart; uniform T0i fractions detected; worst required amplification is about 2.02e22 and worst metric-required momentum-to-energy ratio is about 2.24e15 on T02.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "source_tensor", "momentum_density", "t0i", "dynamic_campaign"],
      symbols: ["T01", "T02", "T03", "mechanism_J_i", "source_momentum_density_status"],
      unitSignatures: ["M L^-1 T^-2"],
      repoPaths: [
        "shared/contracts/nhm2-source-momentum-density-audit.v1.ts",
        "tools/nhm2/build-source-momentum-density-audit.ts",
        NHM2_AXIS_ALIGNED_SOURCE_MOMENTUM_DENSITY_AUDIT,
      ],
      equationFamilies: ["full_tensor_residual", "time_dependent_source_campaign"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.source.momentum_frame_projection_receipt",
    title: "Momentum Frame Projection Receipt",
    plainMeaning:
      "Checks whether same-chart T0i/T00 momentum ratios have a local orthonormal projection receipt before causal-material bound language is allowed.",
    whyItMatters:
      "It prevents chart-basis component ratios from being promoted into physical causal-material falsifiers without an observer-frame or tetrad receipt.",
    subjects: ["nhm2", "source_tensor", "momentum_density", "local_frame", "dynamic_campaign"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["full_tensor_residual", "time_dependent_source_campaign"],
    tags: ["runtime_artifact", "momentum_t0i", "local_frame", "projection_receipt", "blocks_promotion"],
    equations: [
      {
        id: "momentum_frame_projection_gate",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{causalBound}_{J_i}\\Rightarrow T_{\\hat{0}\\hat{i}}/T_{\\hat{0}\\hat{0}}\\ \\mathrm{receipt}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["T0i", "T00", "tetrad", "local_orthonormal_frame"],
        outputSymbols: ["momentum_frame_projection_status"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "A same-chart component ratio is diagnostic until a local orthonormal or observer-frame projection receipt exists.",
      "A blocked projection receipt sharpens the campaign blocker but does not validate or falsify all possible material sources.",
      "No calculator payload is provided because the receipt is a runtime evidence gate, not a scalar replay row.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(
        "shared/contracts/nhm2-momentum-frame-projection-receipt.v1.ts",
        "nhm2-momentum-frame-projection-receipt-contract",
        "Typed local-frame projection receipt for momentum-density causal-bound applicability.",
      ),
      artifactRef(
        "tools/nhm2/build-momentum-frame-projection-receipt.ts",
        "nhm2-momentum-frame-projection-receipt-builder",
        "Builder that consumes the momentum audit and regional atlas to emit projection pass/blocked/missing evidence.",
      ),
      artifactRef(
        NHM2_AXIS_ALIGNED_MOMENTUM_FRAME_PROJECTION_RECEIPT,
        "sha256:0ce246a39e55a2be0689f72e5780d0e763c77bc03c21d82496fe826b113c8138",
        "Axis-aligned branch projection receipt: projectionAvailable=true under declared reduced-order local-frame evidence; worst projected metric-required momentum-to-energy ratio is about 2.24e15; source-side projected ratio remains about 1e-6.",
      ),
      artifactRef(
        NHM2_AXIS_ALIGNED_MOMENTUM_FRAME_PROJECTION_EVIDENCE,
        "sha256:7c5f51640bf7a0c326fa20d19f91fe830ec2a1e2836d498095eabec53b913dc4",
        "Declared reduced-order local-frame evidence for the axis-aligned branch; diagnostic-only and not a full ADM tetrad receipt.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "source_tensor", "momentum_density", "local_frame", "dynamic_campaign"],
      symbols: ["T0i", "T00", "tetrad", "local_orthonormal_frame", "momentum_frame_projection_status"],
      unitSignatures: [],
      repoPaths: [
        "shared/contracts/nhm2-momentum-frame-projection-receipt.v1.ts",
        "tools/nhm2/build-momentum-frame-projection-receipt.ts",
        NHM2_AXIS_ALIGNED_MOMENTUM_FRAME_PROJECTION_RECEIPT,
        NHM2_AXIS_ALIGNED_MOMENTUM_FRAME_PROJECTION_EVIDENCE,
      ],
      equationFamilies: ["full_tensor_residual", "time_dependent_source_campaign"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.metric_required.momentum_demand_audit",
    title: "Metric-Required Momentum Demand Audit",
    plainMeaning:
      "Reports whether the metric-required projected momentum density exceeds the causal momentum-to-energy bound for the current profile.",
    whyItMatters:
      "It separates a source-model failure from a current metric-profile demand that is already too large under the declared reduced-order local-frame projection.",
    subjects: ["nhm2", "metric_required_tensor", "momentum_density", "local_frame", "dynamic_campaign"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["full_tensor_residual", "time_dependent_source_campaign"],
    tags: ["runtime_artifact", "momentum_t0i", "current_profile_falsifier", "claim_boundary"],
    equations: [
      {
        id: "metric_required_momentum_demand_gate",
        role: "noncomputable_reference",
        displayLatex: "\\left|T_{\\hat{0}\\hat{i}}\\right|/\\left|T_{\\hat{0}\\hat{0}}\\right| \\le 1",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["T0i", "T00", "local_orthonormal_frame"],
        outputSymbols: ["current_metric_profile_falsified"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "The audit consumes a projection receipt; it does not infer local-frame ratios from chart components by itself.",
      "The current-profile falsifier is scoped to the declared reduced-order projection evidence and does not prove universal metric impossibility.",
      "No calculator payload is provided because the audit is a runtime evidence gate, not a scalar replay row.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(
        "shared/contracts/nhm2-metric-required-momentum-demand-audit.v1.ts",
        "nhm2-metric-required-momentum-demand-audit-contract",
        "Typed audit for projected metric-required momentum-density demand.",
      ),
      artifactRef(
        "tools/nhm2/build-metric-required-momentum-demand-audit.ts",
        "nhm2-metric-required-momentum-demand-audit-builder",
        "Builder that consumes the momentum frame projection receipt and emits current-profile falsifier evidence.",
      ),
      artifactRef(
        NHM2_AXIS_ALIGNED_METRIC_REQUIRED_MOMENTUM_DEMAND_AUDIT,
        "sha256:15a0ea6b9e0b0d67d65f5743f479faf8b4c7986ff12ef7f635fc2d8634da3364",
        "Axis-aligned branch metric-required momentum demand audit: currentMetricProfileFalsified=true; worstProjectedMetricRequiredMomentumToEnergyRatio is about 2.24e15 at hull:T02.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "metric_required_tensor", "momentum_density", "local_frame", "dynamic_campaign"],
      symbols: ["T0i", "T00", "local_orthonormal_frame", "current_metric_profile_falsified"],
      unitSignatures: [],
      repoPaths: [
        "shared/contracts/nhm2-metric-required-momentum-demand-audit.v1.ts",
        "tools/nhm2/build-metric-required-momentum-demand-audit.ts",
        NHM2_AXIS_ALIGNED_METRIC_REQUIRED_MOMENTUM_DEMAND_AUDIT,
      ],
      equationFamilies: ["full_tensor_residual", "time_dependent_source_campaign"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.metric_required.momentum_remediation_targets",
    title: "Metric Momentum Remediation Targets",
    plainMeaning:
      "Reports how much the current metric-required projected T0i demand would have to be suppressed before this profile could re-enter the reduced-order campaign.",
    whyItMatters:
      "It turns the metric-required momentum falsifier into a concrete redesign target instead of leaving the campaign blocked by an opaque T0i failure.",
    subjects: ["nhm2", "metric_required_tensor", "momentum_density", "remediation", "dynamic_campaign"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["full_tensor_residual", "time_dependent_source_campaign"],
    tags: ["runtime_artifact", "momentum_t0i", "profile_remediation", "current_profile_falsifier"],
    equations: [
      {
        id: "metric_momentum_required_suppression_gate",
        role: "noncomputable_reference",
        displayLatex:
          "S_{required}=\\max_R\\left(\\left|T_{\\hat{0}\\hat{i}}\\right|/\\left|T_{\\hat{0}\\hat{0}}\\right|\\right)/S_{allowed}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["T0i", "T00", "local_orthonormal_frame", "S_allowed"],
        outputSymbols: ["requiredSuppressionFactor"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "The remediation target is scoped to the current profile and declared reduced-order projection evidence.",
      "A remediation target does not validate a new metric profile or source mechanism.",
      "Allowed levers are metric-profile redesign, a stronger full ADM tetrad projection receipt, or rejecting the current profile for this campaign.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(
        "shared/contracts/nhm2-metric-momentum-remediation-targets.v1.ts",
        "nhm2-metric-momentum-remediation-targets-contract",
        "Typed remediation target contract for metric-required projected momentum demand.",
      ),
      artifactRef(
        "tools/nhm2/build-metric-momentum-remediation-targets.ts",
        "nhm2-metric-momentum-remediation-targets-builder",
        "Builder that consumes the metric-required momentum demand audit and emits suppression targets.",
      ),
      artifactRef(
        NHM2_AXIS_ALIGNED_METRIC_MOMENTUM_REMEDIATION_TARGETS,
        "sha256:67df41cb136244bfd83fd6f2a3e071345cd261d215382f1b62cd629cdd9f22da",
        "Axis-aligned branch remediation target: currentMetricProfileFalsified=true; worst=hull:T02; required suppression factor is about 2.244e15 with fractional reduction about 0.9999999999999996.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "metric_required_tensor", "momentum_density", "remediation", "dynamic_campaign"],
      symbols: ["T0i", "T00", "local_orthonormal_frame", "requiredSuppressionFactor"],
      unitSignatures: [],
      repoPaths: [
        "shared/contracts/nhm2-metric-momentum-remediation-targets.v1.ts",
        "tools/nhm2/build-metric-momentum-remediation-targets.ts",
        NHM2_AXIS_ALIGNED_METRIC_MOMENTUM_REMEDIATION_TARGETS,
      ],
      equationFamilies: ["full_tensor_residual", "time_dependent_source_campaign"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.campaign.frontier_disposition",
    title: "Campaign Frontier Disposition",
    plainMeaning:
      "Turns the campaign's current frontier blocker into a typed disposition: the current profile is rejected under the declared reduced-order projected T0i demand evidence.",
    whyItMatters:
      "It keeps the solve loop focused on profile redesign, full ADM/tetrad projection evidence, or current-profile rejection instead of hiding a non-resolvable momentum-density demand behind generic campaign failure.",
    subjects: ["nhm2", "dynamic_campaign", "frontier_disposition", "momentum_density", "profile_rejection"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["full_tensor_residual", "time_dependent_source_campaign"],
    tags: ["runtime_artifact", "frontier_disposition", "current_profile_rejected", "blocks_promotion"],
    equations: [
      {
        id: "campaign_frontier_disposition_gate",
        role: "noncomputable_reference",
        displayLatex:
          "D_{frontier}=\\mathrm{dispose}(campaign,\\;S_{required},\\;profile)",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["campaignFirstBlocker", "requiredSuppressionFactor", "profileId"],
        outputSymbols: ["frontierDisposition"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "The disposition is scoped to the current profile, current run identity, and declared reduced-order projection evidence.",
      "Current-profile rejection does not prove a universal impossibility theorem for NHM2 or for all possible profiles.",
      "The allowed next actions are metric-profile redesign, stronger full ADM/tetrad projection evidence, or rejecting this profile for the campaign.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(
        "shared/contracts/nhm2-campaign-frontier-disposition.v1.ts",
        "nhm2-campaign-frontier-disposition-contract",
        "Typed campaign frontier disposition contract.",
      ),
      artifactRef(
        "tools/nhm2/build-campaign-frontier-disposition.ts",
        "nhm2-campaign-frontier-disposition-builder",
        "Builder that consumes metric momentum remediation targets and emits a fail-closed campaign frontier state.",
      ),
      artifactRef(
        NHM2_AXIS_ALIGNED_CAMPAIGN_FRONTIER_DISPOSITION,
        "sha256:81e94004f0f6619e20606ff46d1b740818d63c497f5b7df401913737e666203b",
        "Axis-aligned branch disposition: status=current_profile_rejected; worst=hull:T02; required suppression factor is about 2.244e15; physical and transport claims remain false.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "dynamic_campaign", "frontier_disposition", "momentum_density", "profile_rejection"],
      symbols: ["frontierDisposition", "requiredSuppressionFactor", "T0i", "current_profile_rejected"],
      unitSignatures: [],
      repoPaths: [
        "shared/contracts/nhm2-campaign-frontier-disposition.v1.ts",
        "tools/nhm2/build-campaign-frontier-disposition.ts",
        NHM2_AXIS_ALIGNED_CAMPAIGN_FRONTIER_DISPOSITION,
      ],
      equationFamilies: ["full_tensor_residual", "time_dependent_source_campaign"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.profile.campaign_search",
    title: "Campaign Profile Search",
    plainMeaning:
      "Screens candidate NHM2 profiles against the current metric-required momentum frontier before spending a full frozen campaign run.",
    whyItMatters:
      "It separates faster clocking ambitions from profiles that actually reduce the projected T0i blocker exposed by the current campaign.",
    subjects: ["nhm2", "profile_search", "dynamic_campaign", "momentum_density", "metric_redesign"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["campaign_profile_search", "time_dependent_source_campaign"],
    tags: ["profile_search", "runtime_artifact", "noncomputable_reference", "blocks_promotion"],
    equations: [
      {
        id: "campaign_profile_search_gate",
        role: "noncomputable_reference",
        displayLatex:
          "candidate=\\min_\\alpha\\{profile:\\;T0i_{screen}\\leq bound\\}\\;\\land\\;campaignRunRequired",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["alpha", "T0i_screen", "requiredSuppressionFactor"],
        outputSymbols: ["recommendedNextProfileId"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Fastest means lowest alpha only after the current projected T0i campaign screen is cleared.",
      "Alpha-only candidates are rejected because changing clocking depth alone does not retire metric-required momentum density.",
      "A profile-search screen pass requires a full frozen campaign run and does not pass the campaign by itself.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(
        "shared/contracts/nhm2-campaign-profile-search.v1.ts",
        "nhm2-campaign-profile-search-contract",
        "Typed campaign profile-search contract.",
      ),
      artifactRef(
        "tools/nhm2/build-campaign-profile-search.ts",
        "nhm2-campaign-profile-search-builder",
        "Builder that consumes metric momentum remediation targets and campaign frontier disposition to rank candidate profiles.",
      ),
      artifactRef(
        NHM2_CAMPAIGN_PROFILE_SEARCH,
        "sha256:2e2eeb03ce2c8f927d1a213c6a9a7894f2a29200c80a8569e247388e20dfc862",
        "Initial profile-search artifact: alpha-only 0p7000 is rejected; fastest screened candidate is stage1_centerline_alpha_0p9000_combined_metric_redesign_campaign_screen_v1; full frozen campaign run remains required.",
      ),
      docRef(
        NHM2_FULL_SOLVE_WHITEPAPER,
        "time-dependent-source-campaign-target",
        "Whitepaper dynamic campaign target note.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "profile_search", "dynamic_campaign", "momentum_density"],
      symbols: ["alpha", "T0i", "requiredSuppressionFactor", "recommendedNextProfileId"],
      unitSignatures: [],
      repoPaths: [
        "shared/contracts/nhm2-campaign-profile-search.v1.ts",
        "tools/nhm2/build-campaign-profile-search.ts",
        NHM2_CAMPAIGN_PROFILE_SEARCH,
        NHM2_AXIS_ALIGNED_CAMPAIGN_FRONTIER_DISPOSITION,
        NHM2_AXIS_ALIGNED_METRIC_MOMENTUM_REMEDIATION_TARGETS,
        NHM2_FULL_SOLVE_WHITEPAPER,
      ],
      equationFamilies: ["campaign_profile_search", "time_dependent_source_campaign"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.profile.candidate_metric_profile_spec",
    title: "Candidate Metric Profile Spec",
    plainMeaning:
      "Records the screened profile definition, diagnostic trip-clocking value, and whether executable candidate geometry exists for the full ADM tensor route.",
    whyItMatters:
      "It keeps fast-profile exploration honest: lower alpha and projected T0i suppression cannot enter the real metric tensor route until a candidate shift-field evaluator, regional atlas, and grid are declared.",
    subjects: ["nhm2", "candidate_profile", "metric_geometry", "trip_clocking", "adm_route"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["campaign_profile_search", "centerline_clocking", "time_dependent_source_campaign"],
    tags: ["candidate_profile", "runtime_artifact", "noncomputable_reference", "blocks_promotion"],
    equations: [
      {
        id: "candidate_profile_clocking_spec",
        role: "calculator_demo",
        displayLatex:
          "\\tau_{candidate}=\\alpha_{centerline}T_{coordinate}\\;\\land\\;ADMRouteReady=false",
        computableExpression: "tau_candidate = alpha_centerline * T_coordinate",
        operatorKind: "scalar_expression",
        inputSymbols: ["alpha_centerline", "T_coordinate"],
        outputSymbols: ["tau_candidate"],
      },
    ],
    units: [{ symbol: "tau_candidate", si: "s", dimension: "time" }],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "The candidate spec is an admission precondition for a fresh ADM/Einstein metric-required tensor route.",
      "The 0p9000 combined metric-redesign row currently lacks an executable shift-field evaluator, regional support atlas ref, and grid ref.",
      "Trip-clocking values remain diagnostic and do not certify route ETA, speed, transport, or physical viability.",
    ],
    calculatorPayloads: [
      payload({
        id: "candidate_profile_clocking_replay",
        expression: "tau_candidate = alpha_centerline * T_coordinate",
        displayLatex: "\\tau_{candidate}=\\alpha_{centerline}T_{coordinate}",
        targetVariable: "tau_candidate",
      }),
    ],
    sourceRefs: [
      artifactRef(
        "shared/contracts/nhm2-candidate-metric-profile-spec.v1.ts",
        "nhm2-candidate-metric-profile-spec-contract",
        "Typed candidate profile spec contract for profile levers, clocking, executable geometry refs, and ADM-route readiness.",
      ),
      artifactRef(
        "tools/nhm2/build-candidate-metric-profile-spec.ts",
        "nhm2-candidate-metric-profile-spec-builder",
        "Builder that publishes a screened candidate profile spec from the profile-search artifact.",
      ),
      artifactRef(
        NHM2_0P9000_COMBINED_CANDIDATE_METRIC_PROFILE_SPEC,
        "runtime-artifact",
        "0p9000 combined metric-redesign candidate spec: tau=0.9*T_coordinate, but ADM route readiness is blocked by missing executable shift-field evaluator, regional support atlas, and grid refs.",
      ),
      docRef(
        NHM2_FULL_SOLVE_WHITEPAPER,
        "time-dependent-source-campaign-target",
        "Whitepaper dynamic campaign target note.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "candidate_profile", "metric_geometry", "trip_clocking"],
      symbols: ["alpha_centerline", "T_coordinate", "tau_candidate", "ADMRouteReady"],
      unitSignatures: ["s"],
      repoPaths: [
        "shared/contracts/nhm2-candidate-metric-profile-spec.v1.ts",
        "tools/nhm2/build-candidate-metric-profile-spec.ts",
        NHM2_0P9000_COMBINED_CANDIDATE_METRIC_PROFILE_SPEC,
        NHM2_CAMPAIGN_PROFILE_SEARCH,
        NHM2_CAMPAIGN_PROFILE_RUN_MANIFEST,
        NHM2_FULL_SOLVE_WHITEPAPER,
      ],
      equationFamilies: ["campaign_profile_search", "centerline_clocking"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.profile.campaign_run_manifest",
    title: "Campaign Profile Run Manifest",
    plainMeaning:
      "Lists the frozen campaign evidence that each screened profile must produce before the profile can be ranked as campaign-admissible.",
    whyItMatters:
      "It turns a promising profile screen into an explicit missing-evidence checklist for full tensor, conservation, QEI, observer, dynamic, and stability gates.",
    subjects: ["nhm2", "profile_run_manifest", "dynamic_campaign", "artifact_governance"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["campaign_profile_run_manifest", "time_dependent_source_campaign"],
    tags: ["profile_run_manifest", "runtime_artifact", "noncomputable_reference", "blocks_promotion"],
    equations: [
      {
        id: "campaign_profile_run_manifest_gate",
        role: "noncomputable_reference",
        displayLatex:
          "runReady=\\bigwedge evidence_i(profile)\\;\\land\\;campaignRun(profile)",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["profile", "evidence_i", "campaignRun"],
        outputSymbols: ["nextCandidateProfileId", "manifestComplete"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Only candidates that pass the profile screen are queued for frozen campaign evidence generation.",
      "Queued candidates remain blocked until every required campaign evidence row is produced for that profile.",
      "The run manifest is scheduling and evidence governance, not a campaign evaluation result.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(
        "shared/contracts/nhm2-campaign-profile-run-manifest.v1.ts",
        "nhm2-campaign-profile-run-manifest-contract",
        "Typed campaign profile run-manifest contract.",
      ),
      artifactRef(
        "tools/nhm2/build-campaign-profile-run-manifest.ts",
        "nhm2-campaign-profile-run-manifest-builder",
        "Builder that consumes profile search results and emits required frozen-campaign evidence rows per candidate.",
      ),
      artifactRef(
        NHM2_CAMPAIGN_PROFILE_RUN_MANIFEST,
        "runtime-artifact",
        "Run manifest: queues the 0p9000 combined metric-redesign candidate first; its candidate metric profile spec is provided_blocked because executable shift-field geometry, regional atlas, and grid refs are missing before the full ADM route can run.",
      ),
      artifactRef(
        NHM2_0P9000_COMBINED_CANDIDATE_METRIC_PROFILE_SPEC,
        "runtime-artifact",
        "0p9000 combined metric-redesign candidate spec: diagnostic tau=0.9*T_coordinate; firstBlocker=candidate_executable_shift_field_evaluator_missing.",
      ),
      artifactRef(
        NHM2_0P9000_COMBINED_METRIC_REQUIRED_FULL_REGIONAL_TENSOR,
        "sha256:76cc316fd921e842aae90ceb9f393660faf709152475d5c705356df155722abf",
        "0p9000 combined metric-redesign candidate metric-required full-regional-tensor screen: T0i is projected from the reduced-order momentum screen, while T00 and Tij are inherited parent-profile placeholders; firstBlocker=candidate_metric_required_full_tensor_screen_not_full_adm_route.",
      ),
      artifactRef(
        NHM2_0P9000_COMBINED_METRIC_REQUIRED_MOMENTUM_DEMAND_AUDIT,
        "sha256:472dd4bd93d59911ad2326c68dff88bdcb363360071b2058efcba894a1d7daa1",
        "0p9000 combined metric-redesign candidate reduced-order projected momentum-demand screen: all T0i rows are within the causal ratio bound; worst row is hull:T02 with projected ratio about 0.044888; this is not a full ADM tetrad or campaign pass.",
      ),
      artifactRef(
        NHM2_0P9000_COMBINED_METRIC_MOMENTUM_REMEDIATION_TARGETS,
        "sha256:7acdad10a07dcc495707d16b3f4f861cf74ab2c7d1a4c084ab581f1b2c72595a",
        "0p9000 combined metric-redesign candidate remediation target screen: remediationRequired=false under the reduced-order scaled projected-momentum audit.",
      ),
      docRef(
        NHM2_FULL_SOLVE_WHITEPAPER,
        "time-dependent-source-campaign-target",
        "Whitepaper dynamic campaign target note.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "profile_run_manifest", "dynamic_campaign", "artifact_governance"],
      symbols: ["nextCandidateProfileId", "manifestComplete", "evidence_i", "campaignRun"],
      unitSignatures: [],
      repoPaths: [
        "shared/contracts/nhm2-campaign-profile-run-manifest.v1.ts",
        "tools/nhm2/build-campaign-profile-run-manifest.ts",
        NHM2_CAMPAIGN_PROFILE_RUN_MANIFEST,
        NHM2_0P9000_COMBINED_CANDIDATE_METRIC_PROFILE_SPEC,
        NHM2_0P9000_COMBINED_METRIC_REQUIRED_FULL_REGIONAL_TENSOR,
        NHM2_0P9000_COMBINED_METRIC_REQUIRED_MOMENTUM_DEMAND_AUDIT,
        NHM2_0P9000_COMBINED_METRIC_MOMENTUM_REMEDIATION_TARGETS,
        NHM2_CAMPAIGN_PROFILE_SEARCH,
        NHM2_FULL_SOLVE_WHITEPAPER,
      ],
      equationFamilies: ["campaign_profile_run_manifest", "time_dependent_source_campaign"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.dynamic.time_dependent_source_campaign",
    title: "Time-Dependent Source Campaign",
    plainMeaning:
      "Freezes the next dynamic proof campaign: independent source tensor, switching conservation, frequency convergence, dynamic/effective geometry agreement, full tensor closure, observer families, QEI receipts, and stability checks.",
    whyItMatters:
      "It prevents static or scalar pass-path progress from being read as a time-dependent physical-source result.",
    subjects: ["nhm2", "time_dependent_source", "dynamic_campaign", "proof_stack", "artifact_governance"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["time_dependent_source_campaign", "closure_stack"],
    tags: ["time_dependent_campaign", "runtime_artifact", "noncomputable_reference", "blocks_promotion"],
    equations: [
      {
        id: "time_dependent_source_campaign_gate",
        role: "noncomputable_reference",
        displayLatex:
          "campaign=source_{ind}\\land \\nabla_\\mu T^{\\mu\\nu}(t)\\land f\\!:\\!2f\\!:\\!4f\\land \\langle g(t)\\rangle\\land T_{full}\\land observer\\land QEI\\land stability",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: [
          "source_ind",
          "T_mu_nu(t)",
          "frequency_ladder",
          "dynamic_geometry",
          "T_full",
          "observer",
          "QEI",
          "stability",
        ],
        outputSymbols: ["campaignPass"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Static pass-path artifacts cannot substitute for frequency, switching, time-averaging, backreaction, or stability evidence.",
      "The current campaign artifact is expected to report missing/review blockers until dynamic evidence exists.",
      "Even a campaign pass would be diagnostic/reduced-order evidence, not transport, route ETA, propulsion, or physical viability validation.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(
        "shared/contracts/nhm2-time-dependent-source-campaign.v1.ts",
        "nhm2-time-dependent-source-campaign-contract",
        "Typed frozen time-dependent source campaign contract.",
      ),
      artifactRef(
        "tools/nhm2/build-time-dependent-source-campaign.ts",
        "nhm2-time-dependent-source-campaign-builder",
        "Builder that fails closed when dynamic evidence is missing.",
      ),
      artifactRef(
        NHM2_TIME_DEPENDENT_SOURCE_CAMPAIGN,
        "sha256:64ec03bacd7b16b9895d78b2f8d53a54023d564ba98d7143576d10231bcb4f33",
        "Pinned local smoke-chain campaign artifact: campaignPass=false; firstBlocker=source_off_diagonal_current_declared_model_falsified; full tensor gate reports off_diagonal_tij worst=hull:T13 with current-to-allowed magnitude ratio about 1.49e15; shear audit blocks closure because the current declared source model is falsified by missing mechanism evidence and uniform fractional shear ansatz.",
      ),
      artifactRef(
        NHM2_AXIS_ALIGNED_TIME_DEPENDENT_SOURCE_CAMPAIGN,
        "sha256:060313d31e72a062701f87dc3683e88857799748aab469463f28827f68c4f63b",
        "Axis-aligned shear-suppressed candidate campaign: campaignPass=false; firstBlocker=metric_momentum_current_profile_rejected_for_campaign; full tensor gate reports campaignFrontierDisposition=current_profile_rejected and metricMomentumWorstSuppression about 2.244e15.",
      ),
      artifactRef(
        NHM2_AXIS_ALIGNED_CAMPAIGN_FRONTIER_DISPOSITION,
        "sha256:81e94004f0f6619e20606ff46d1b740818d63c497f5b7df401913737e666203b",
        "Campaign frontier disposition for the axis-aligned branch: current_profile_rejected under declared reduced-order projected momentum-demand evidence.",
      ),
      artifactRef(
        NHM2_CAMPAIGN_PROFILE_SEARCH,
        "sha256:2e2eeb03ce2c8f927d1a213c6a9a7894f2a29200c80a8569e247388e20dfc862",
        "Profile-search screen: fastest screened candidate is 0p9000 combined metric redesign, but screenPassDoesNotPassCampaign=true.",
      ),
      artifactRef(
        NHM2_CAMPAIGN_PROFILE_RUN_MANIFEST,
        "sha256:3f957a642ee7c2323928539ac38e1c3aa83d44917ded4aface0bc8a57e44824f",
        "Profile run manifest: 0p9000 combined metric-redesign is queued first; projected momentum-demand audit and remediation target rows are provided, metric-required full-regional-tensor screen is provided_blocked, and source/tile compatibility, residual, conservation, frequency, dynamic/effective geometry, QEI, observer, stability, and campaign rows remain required/missing.",
      ),
      artifactRef(
        NHM2_0P9000_COMBINED_METRIC_REQUIRED_FULL_REGIONAL_TENSOR,
        "sha256:76cc316fd921e842aae90ceb9f393660faf709152475d5c705356df155722abf",
        "0p9000 combined metric-redesign metric-required full-regional-tensor screen: all regions remain blocked because the screen projects T0i and inherits T00/Tij from the parent profile instead of emitting a fresh candidate ADM/Einstein tensor.",
      ),
      artifactRef(
        NHM2_0P9000_COMBINED_METRIC_REQUIRED_MOMENTUM_DEMAND_AUDIT,
        "sha256:472dd4bd93d59911ad2326c68dff88bdcb363360071b2058efcba894a1d7daa1",
        "0p9000 combined metric-redesign candidate reduced-order projected momentum-demand screen: worst projected metric-required momentum-to-energy ratio is hull:T02 at about 0.044888, below the causal ratio bound.",
      ),
      artifactRef(
        NHM2_0P9000_COMBINED_METRIC_MOMENTUM_REMEDIATION_TARGETS,
        "sha256:7acdad10a07dcc495707d16b3f4f861cf74ab2c7d1a4c084ab581f1b2c72595a",
        "0p9000 combined metric-redesign candidate remediation target screen: remediationRequired=false under the reduced-order projected-momentum screen.",
      ),
      artifactRef(
        NHM2_AXIS_ALIGNED_METRIC_REQUIRED_MOMENTUM_DEMAND_AUDIT,
        "sha256:15a0ea6b9e0b0d67d65f5743f479faf8b4c7986ff12ef7f635fc2d8634da3364",
        "Metric-required momentum demand audit for the axis-aligned branch: currentMetricProfileFalsified=true.",
      ),
      artifactRef(
        NHM2_AXIS_ALIGNED_METRIC_MOMENTUM_REMEDIATION_TARGETS,
        "sha256:67df41cb136244bfd83fd6f2a3e071345cd261d215382f1b62cd629cdd9f22da",
        "Metric momentum remediation targets for the axis-aligned branch: worst required suppression factor is about 2.244e15 and nonResolvableForCurrentProfile=true.",
      ),
      artifactRef(
        NHM2_AXIS_ALIGNED_SOURCE_MOMENTUM_DENSITY_AUDIT,
        "sha256:7ee6ec82afd39cea39881b531a778a926f8f68d42b70b93790a570fa19452820",
        "Momentum-density audit for the axis-aligned branch: worst required amplification is about 2.02e22; worst metric-required momentum-to-energy ratio is about 2.24e15; the reduced-order causal material momentum-bound check is blocked pending local orthonormal/projection evidence.",
      ),
      artifactRef(
        NHM2_AXIS_ALIGNED_MOMENTUM_FRAME_PROJECTION_RECEIPT,
        "sha256:0ce246a39e55a2be0689f72e5780d0e763c77bc03c21d82496fe826b113c8138",
        "Momentum frame projection receipt for the axis-aligned branch: projectionAvailable=true; causalBoundApplicabilityStatus=applicable; projected metric-required momentum ratio exceeds the reduced-order causal material bound.",
      ),
      artifactRef(
        NHM2_AXIS_ALIGNED_REGIONAL_MATERIAL_SOURCE_TENSOR_MODEL,
        "sha256:09435701740169acb8dbdb61962441990c38de753c1a32bf809220b500a52c13",
        "Source-side declared tensor candidate with axis-aligned off-diagonal shear suppression; diagnostic QC only and not physical material validation.",
      ),
      docRef(
        NHM2_FULL_SOLVE_WHITEPAPER,
        "time-dependent-source-campaign-target",
        "Whitepaper dynamic campaign target note.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "time_dependent_source", "dynamic_campaign", "proof_stack", "artifact_governance"],
      symbols: [
        "source_ind",
        "T_mu_nu(t)",
        "frequency_ladder",
        "dynamic_geometry",
        "campaignPass",
      ],
      unitSignatures: [],
      repoPaths: [
        "shared/contracts/nhm2-time-dependent-source-campaign.v1.ts",
        "tools/nhm2/build-time-dependent-source-campaign.ts",
        NHM2_SOURCE_OFF_DIAGONAL_SHEAR_AUDIT,
        NHM2_TIME_DEPENDENT_SOURCE_CAMPAIGN,
        NHM2_AXIS_ALIGNED_SOURCE_OFF_DIAGONAL_SHEAR_AUDIT,
        NHM2_AXIS_ALIGNED_SOURCE_MOMENTUM_DENSITY_AUDIT,
        NHM2_AXIS_ALIGNED_METRIC_MOMENTUM_REMEDIATION_TARGETS,
        NHM2_AXIS_ALIGNED_CAMPAIGN_FRONTIER_DISPOSITION,
        NHM2_CAMPAIGN_PROFILE_SEARCH,
        NHM2_CAMPAIGN_PROFILE_RUN_MANIFEST,
        NHM2_AXIS_ALIGNED_TIME_DEPENDENT_SOURCE_CAMPAIGN,
        NHM2_AXIS_ALIGNED_REGIONAL_MATERIAL_SOURCE_TENSOR_MODEL,
        NHM2_FULL_SOLVE_WHITEPAPER,
      ],
      equationFamilies: ["time_dependent_source_campaign", "closure_stack"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.formal.lean_certificate",
    title: "Lean Campaign Certificate",
    plainMeaning:
      "Runtime artifacts are exported into a Lean-facing certificate for the current 0p7000 diagnostic campaign profile.",
    whyItMatters:
      "It makes the campaign pass reusable as pinned rational and Boolean proof facts instead of UI-only wording.",
    subjects: ["nhm2", "lean", "formal_certificate", "artifact_governance", "diagnostic_campaign"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["NHM2", "formal_methods"],
    equationFamilies: ["lean_campaign_certificate", "claim_boundary"],
    tags: ["lean", "certificate", "runtime_reference", "noncomputable_reference", "claim_boundary"],
    equations: [
      {
        id: "lean_campaign_certificate_runtime_reference",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{Certificate}_{Lean}=\\mathrm{emit}(artifacts,hashes,bounds,locks)",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["artifacts", "hashes", "bounds", "claimLocks"],
        outputSymbols: ["LeanCertificate"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Lean checks the emitted certificate facts and does not rerun the floating-point GR solver.",
      "The certificate is runtime/reference evidence and has no scalar calculator payload.",
      `The formal check command is ${NHM2_LEAN_CERTIFICATE_CHECK_COMMAND}.`,
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(
        NHM2_LEAN_CAMPAIGN_CERTIFICATE,
        "nhm2-lean-campaign-certificate-json",
        "Generated JSON certificate with artifact hashes, rational bounds, observer/QEI/stability receipts, and closed claim locks.",
      ),
      artifactRef(
        NHM2_LEAN_GENERATED_CAMPAIGN_CERTIFICATE,
        "current0p7000Certificate",
        "Generated Lean module for the current 0p7000 diagnostic campaign certificate.",
      ),
      repoRef(
        NHM2_LEAN_CERTIFICATE_EXPORTER,
        "emit-lean-campaign-certificate",
        "Runtime exporter that converts JSON artifacts into exact Lean-facing facts.",
      ),
      repoRef(
        NHM2_LEAN_CERTIFICATE_CONTRACT,
        "nhm2_lean_campaign_certificate/v1",
        "Typed certificate contract.",
      ),
      repoRef(
        "package.json",
        NHM2_LEAN_CERTIFICATE_CHECK_COMMAND,
        "Formal certificate emit plus Lean build command.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "lean", "formal_certificate", "artifact_governance", "diagnostic_campaign"],
      symbols: ["LeanCertificate", "artifacts", "hashes", "bounds", "claimLocks"],
      unitSignatures: [],
      repoPaths: [
        NHM2_LEAN_CAMPAIGN_CERTIFICATE,
        NHM2_LEAN_GENERATED_CAMPAIGN_CERTIFICATE,
        NHM2_LEAN_CERTIFICATE_EXPORTER,
        NHM2_LEAN_CERTIFICATE_CONTRACT,
        "package.json",
      ],
      equationFamilies: ["lean_campaign_certificate", "claim_boundary"],
      simulationOwners: ["NHM2", "formal_methods"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.formal.diagnostic_campaign_admissible",
    title: "Lean Diagnostic Campaign Admissibility",
    plainMeaning:
      "Lean verifies diagnostic campaign admissibility from the emitted certificate for the current 0p7000 profile.",
    whyItMatters:
      "It gives the campaign pass a machine-checked policy meaning while keeping stronger claims locked.",
    subjects: ["nhm2", "lean", "diagnostic_campaign", "admissibility", "proof_policy"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["NHM2", "formal_methods"],
    equationFamilies: ["lean_campaign_certificate", "diagnostic_admissibility"],
    tags: ["lean", "diagnostic_admissible", "noncomputable_reference", "claim_safe"],
    equations: [
      {
        id: "lean_diagnostic_campaign_admissible_theorem",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{Gates}_{cert}\\land\\mathrm{Bounds}_{cert}\\land\\mathrm{Locks}_{closed}\\Rightarrow\\mathrm{DiagnosticCampaignAdmissible}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["Gates_cert", "Bounds_cert", "Locks_closed"],
        outputSymbols: ["DiagnosticCampaignAdmissible"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Diagnostic campaign admissibility is a policy theorem over certificate facts.",
      "The theorem does not establish material-source credibility, transport, route result, propulsion, or speed authority.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(
        NHM2_LEAN_GENERATED_CAMPAIGN_CERTIFICATE,
        "current0p7000_diagnosticCampaignAdmissible",
        "Generated theorem proving DiagnosticCampaignAdmissible for the emitted certificate.",
      ),
      repoRef(
        NHM2_LEAN_CERTIFICATE_MODULE,
        "diagnosticCampaignAdmissible_of_certificate",
        "Lean theorem from bounds, gates, and closed claim locks.",
      ),
      artifactRef(
        NHM2_LEAN_CAMPAIGN_CERTIFICATE,
        "diagnosticCampaignAdmissible=true",
        "Certificate JSON records the runtime-facing admissibility bit and failed-field list.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "lean", "diagnostic_campaign", "admissibility", "proof_policy"],
      symbols: ["Gates_cert", "Bounds_cert", "Locks_closed", "DiagnosticCampaignAdmissible"],
      unitSignatures: [],
      repoPaths: [
        NHM2_LEAN_GENERATED_CAMPAIGN_CERTIFICATE,
        NHM2_LEAN_CERTIFICATE_MODULE,
        NHM2_LEAN_CAMPAIGN_CERTIFICATE,
      ],
      equationFamilies: ["lean_campaign_certificate", "diagnostic_admissibility"],
      simulationOwners: ["NHM2", "formal_methods"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.formal.claim_locks_closed",
    title: "Lean Claim Locks Closed",
    plainMeaning:
      "Lean carries the claim locks as part of the certificate proof, so diagnostic admissibility keeps physical, route, propulsion, transport, and speed locks closed.",
    whyItMatters:
      "It prevents a formal diagnostic pass from being represented as a stronger NHM2 claim.",
    subjects: ["nhm2", "lean", "claim_boundary", "claim_locks", "diagnostic_campaign"],
    level: "claim_boundary",
    status: "blocked",
    simulationOwners: ["NHM2", "formal_methods"],
    equationFamilies: ["claim_boundary", "lean_campaign_certificate"],
    tags: ["lean", "claim_locks", "diagnostic_only", "noncomputable_reference"],
    equations: [
      {
        id: "lean_claim_locks_closed_theorem",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{DiagnosticCampaignAdmissible}\\Rightarrow\\mathrm{ClaimLocksClosed}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["DiagnosticCampaignAdmissible"],
        outputSymbols: ["ClaimLocksClosed"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Claim locks are part of the Lean certificate conclusion, not UI copy convention.",
      "Closed locks forbid physical viability, transport, route result, propulsion, and speed promotion from this certificate.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(
        NHM2_LEAN_CERTIFICATE_MODULE,
        "diagnosticCampaignAdmissible_preserves_claim_locks",
        "Lean theorem preserving closed claim locks from diagnostic certificate admissibility.",
      ),
      repoRef(
        NHM2_LEAN_CLAIM_BOUNDARY_MODULE,
        "AllClaimLocksClosed",
        "Base claim-boundary module defining closed locks.",
      ),
      artifactRef(
        NHM2_LEAN_CAMPAIGN_CERTIFICATE,
        "claimLocks",
        "JSON certificate field with all claim locks false.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "lean", "claim_boundary", "claim_locks", "diagnostic_campaign"],
      symbols: ["DiagnosticCampaignAdmissible", "ClaimLocksClosed"],
      unitSignatures: [],
      repoPaths: [
        NHM2_LEAN_CERTIFICATE_MODULE,
        NHM2_LEAN_CLAIM_BOUNDARY_MODULE,
        NHM2_LEAN_CAMPAIGN_CERTIFICATE,
      ],
      equationFamilies: ["claim_boundary", "lean_campaign_certificate"],
      simulationOwners: ["NHM2", "formal_methods"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.formal.negative_fixtures_fail_closed",
    title: "Lean Negative Fixtures Fail Closed",
    plainMeaning:
      "Static Lean examples and runtime fixture tests reject missing tensor components, stale hashes, Eulerian-only observers, scalar-only QEI, target echo, and open claim locks.",
    whyItMatters:
      "It makes the formal lane falsifiable instead of only proving the current happy-path certificate.",
    subjects: ["nhm2", "lean", "negative_fixtures", "fail_closed", "falsifiability"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["NHM2", "formal_methods"],
    equationFamilies: ["fail_closed_certificate", "claim_boundary"],
    tags: ["lean", "negative_fixture", "fail_closed", "noncomputable_reference"],
    equations: [
      {
        id: "lean_negative_fixture_rejection",
        role: "noncomputable_reference",
        displayLatex:
          "\\neg fields_{required}\\lor staleHash\\lor scalarQEI\\lor openLocks\\Rightarrow\\neg admissible",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["fields_required", "staleHash", "scalarQEI", "openLocks"],
        outputSymbols: ["notAdmissible"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Negative fixtures are proof-policy coverage, not numerical physics evidence.",
      "Fail-closed behavior keeps stale, scalar-only, or narrow-frame evidence from entering stronger language.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(
        NHM2_LEAN_CERTIFICATE_MODULE,
        "negative-fixture-examples",
        "Lean examples for missing T0i, stale atlas hash, Eulerian-only observer, scalar-only QEI, and open claim locks.",
      ),
      repoRef(
        NHM2_LEAN_CERTIFICATE_TEST,
        "lean-campaign-certificate-negative-fixtures",
        "Vitest fixtures for missing T0i, off-diagonal stress, source echo, frequency/dynamic bounds, stale hash, Eulerian-only observer, scalar-only QEI, and open locks.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "lean", "negative_fixtures", "fail_closed", "falsifiability"],
      symbols: ["fields_required", "staleHash", "scalarQEI", "openLocks", "notAdmissible"],
      unitSignatures: [],
      repoPaths: [NHM2_LEAN_CERTIFICATE_MODULE, NHM2_LEAN_CERTIFICATE_TEST],
      equationFamilies: ["fail_closed_certificate", "claim_boundary"],
      simulationOwners: ["NHM2", "formal_methods"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.formal.certificate_hashes_pinned",
    title: "Lean Certificate Hashes Pinned",
    plainMeaning:
      "The Lean certificate JSON records the campaign artifact paths and SHA-256 hashes used to produce the generated Lean module.",
    whyItMatters:
      "It prevents the formal result from floating across mismatched profiles, charts, atlases, or runtime evidence bundles.",
    subjects: ["nhm2", "lean", "artifact_hashes", "provenance", "diagnostic_campaign"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["NHM2", "formal_methods"],
    equationFamilies: ["certificate_provenance", "artifact_hashes"],
    tags: ["lean", "sha256", "profile_scoped", "same_run", "noncomputable_reference"],
    equations: [
      {
        id: "lean_certificate_hash_pin",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{hashesPresent}\\land\\mathrm{profileMatch}\\land\\mathrm{atlasMatch}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["artifactHashes", "profileId", "atlasHash"],
        outputSymbols: ["certificateIdentity"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Hash pinning is provenance discipline and does not make the runtime artifacts physically complete.",
      "The certificate is scoped to the current 0p7000 diagnostic campaign profile.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(
        NHM2_LEAN_CAMPAIGN_CERTIFICATE,
        "artifactHashes",
        "Certificate JSON artifact-hash table.",
      ),
      artifactRef(
        `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-time-dependent-source-campaign.json`,
        "time-dependent-source-campaign",
        "Runtime campaign artifact included in the Lean certificate hash ledger.",
      ),
      artifactRef(
        `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-regional-full-tensor-residual.json`,
        "regional-full-tensor-residual",
        "Full regional tensor residual artifact included in the Lean certificate hash ledger.",
      ),
      artifactRef(
        `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-observer-robust-energy-conditions.json`,
        "observer-robust-energy-conditions",
        "Observer-family evidence included in the Lean certificate hash ledger.",
      ),
      artifactRef(
        `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-qei-worldline-dossier.json`,
        "qei-worldline-dossier",
        "QEI dossier included in the Lean certificate hash ledger.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "lean", "artifact_hashes", "provenance", "diagnostic_campaign"],
      symbols: ["artifactHashes", "profileId", "atlasHash", "certificateIdentity"],
      unitSignatures: [],
      repoPaths: [
        NHM2_LEAN_CAMPAIGN_CERTIFICATE,
        `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-time-dependent-source-campaign.json`,
        `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-regional-full-tensor-residual.json`,
        `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-observer-robust-energy-conditions.json`,
        `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-qei-worldline-dossier.json`,
      ],
      equationFamilies: ["certificate_provenance", "artifact_hashes"],
      simulationOwners: ["NHM2", "formal_methods"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.experimental.physical_viability_campaign",
    title: "Physical Evidence Campaign",
    plainMeaning:
      "Tracks the experimental evidence ladder required after diagnostic campaign admission: prediction freeze, tile metrology, array scaling, vacuum weight, metric response, bounded prototype, and transport precursor.",
    whyItMatters:
      "It prevents the diagnostic campaign pass from being mistaken for fabricated-source or transport evidence.",
    subjects: ["nhm2", "experiment", "physical_viability", "claim_boundary"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "casimir", "general_relativity"],
    equationFamilies: ["physical_viability_campaign", "experimental_receipts"],
    tags: ["experimental_ladder", "claim_boundary", "runtime_reference", "noncomputable_reference"],
    equations: [
      {
        id: "physical_viability_campaign_ladder",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{DiagnosticCampaign}\\rightarrow\\mathrm{PredictionFreeze}\\rightarrow\\mathrm{TileMetrology}\\rightarrow\\mathrm{VacuumWeight}\\rightarrow\\mathrm{MetricResponse}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["DiagnosticCampaign", "ExperimentalReceipts"],
        outputSymbols: ["PhysicalEvidenceCampaignStatus"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "The current diagnostic campaign can feed this ladder but cannot substitute for experimental receipts.",
      "Current state is blocked until prediction, metrology, scaling, vacuum-weight, metric-response, and replication receipts exist.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(
        NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT,
        "nhm2_physical_viability_campaign/v1",
        "Typed physical evidence campaign contract.",
      ),
      repoRef(
        NHM2_EXPERIMENT_FACING_THEORY_ROADMAP_CONTRACT,
        "nhm2_experiment_facing_theory_roadmap/v1",
        "Pre-hardware theory solve roadmap consumed by this campaign.",
      ),
      artifactRef(
        NHM2_PHYSICAL_VIABILITY_CAMPAIGN,
        "physical-viability-campaign-target",
        "Expected runtime artifact target for the physical evidence ladder.",
      ),
      artifactRef(
        NHM2_EXPERIMENT_FACING_THEORY_ROADMAP,
        "experiment-facing-theory-roadmap-target",
        "Expected roadmap artifact target for planning observables and falsifiers.",
      ),
      artifactRef(
        `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-time-dependent-source-campaign.json`,
        "diagnostic-campaign-input",
        "Diagnostic campaign input; not a physical evidence substitute.",
      ),
      artifactRef(
        NHM2_LEAN_CAMPAIGN_CERTIFICATE,
        "lean-diagnostic-certificate-input",
        "Formal diagnostic admissibility certificate; claim locks remain closed.",
      ),
      docRef(
        NHM2_FULL_SOLVE_WHITEPAPER,
        "physical-evidence-campaign-ladder",
        "Whitepaper physical/experimental evidence ladder.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "experiment", "physical_viability", "claim_boundary"],
      symbols: ["PhysicalEvidenceCampaignStatus", "ExperimentalReceipts"],
      unitSignatures: [],
      repoPaths: [
        NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT,
        NHM2_EXPERIMENT_FACING_THEORY_ROADMAP_CONTRACT,
        NHM2_PHYSICAL_VIABILITY_CAMPAIGN,
        NHM2_EXPERIMENT_FACING_THEORY_ROADMAP,
        `${NHM2_0P7000_OBSERVER_COMPATIBLE_SOURCE_RUN_ROOT}/nhm2-time-dependent-source-campaign.json`,
        NHM2_LEAN_CAMPAIGN_CERTIFICATE,
        NHM2_FULL_SOLVE_WHITEPAPER,
      ],
      equationFamilies: ["physical_viability_campaign", "experimental_receipts"],
      simulationOwners: ["NHM2", "casimir", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.experimental.theory_solve_roadmap",
    title: "Experiment-Facing Theory Solve Roadmap",
    plainMeaning:
      "Defines the pre-hardware theory solves, observables, falsifiers, receipts, and scalar sanity checks needed before NHM2 physical evidence can be reviewed.",
    whyItMatters:
      "It turns the physical campaign into falsifiable experimental planning instead of allowing diagnostic, Lean, or scalar rows to stand in for material evidence.",
    subjects: ["nhm2", "experiment", "roadmap", "falsifier", "claim_boundary"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "casimir", "general_relativity"],
    equationFamilies: ["experiment_facing_theory_roadmap", "physical_viability_campaign"],
    tags: ["experimental_ladder", "roadmap", "runtime_reference", "noncomputable_reference"],
    equations: [
      {
        id: "experiment_facing_solve_chain",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{PredictionFreeze}\\rightarrow\\mathrm{TileMetrology}\\rightarrow\\mathrm{EnergyLedger}\\rightarrow\\mathrm{ArrayScaling}\\rightarrow T_{\\mu\\nu}^{apparatus}\\rightarrow\\mathrm{MetricResponse}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["ExperimentalPlan", "Receipts", "Falsifiers"],
        outputSymbols: ["TheoryRoadmapStatus"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "The roadmap is an experiment-planning artifact; it does not certify that any source has been fabricated or measured.",
      "Only scalar sanity checks are calculator-loadable; tile, tensor, QEI, observer, metric-response, and replication rows require runtime receipts.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(
        NHM2_EXPERIMENT_FACING_THEORY_ROADMAP_CONTRACT,
        "nhm2_experiment_facing_theory_roadmap/v1",
        "Typed roadmap for experiment-facing theoretical solves.",
      ),
      artifactRef(
        NHM2_EXPERIMENT_FACING_THEORY_ROADMAP,
        "experiment-facing-theory-roadmap-target",
        "Expected roadmap artifact target; missing receipts remain blockers.",
      ),
      repoRef(
        NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT,
        "nhm2_physical_viability_campaign/v1",
        "Physical evidence campaign consumed by the roadmap.",
      ),
      docRef(
        NHM2_FULL_SOLVE_WHITEPAPER,
        "physical-evidence-campaign-ladder",
        "Whitepaper section that exposes the experimental ladder.",
      ),
      literatureRef(
        NHM2_RESEARCH_DYNAMICAL_CASIMIR_NATURE_2011,
        "nature_2011_dynamical_casimir_effect",
        "Dynamical Casimir energy comes from driven boundary conditions.",
      ),
      literatureRef(
        NHM2_RESEARCH_CASIMIR_GRAVITATIONAL_MASS,
        "arxiv_0710_3841_casimir_gravitational_inertial_mass",
        "Whole regulated apparatus energy is the gravitational source.",
      ),
      literatureRef(
        NHM2_RESEARCH_REAL_MATERIAL_CASIMIR,
        "arxiv_0902_4022_real_material_casimir_review",
        "Real-material Lifshitz/Casimir metrology constraints.",
      ),
      literatureRef(
        NHM2_RESEARCH_ARBITRARY_MATERIAL_CASIMIR,
        "arxiv_1010_5539_arbitrary_material_casimir",
        "Arbitrary material and geometry Casimir computation.",
      ),
      literatureRef(
        NHM2_RESEARCH_PATCH_POTENTIALS,
        "arxiv_1409_5012_patch_potentials",
        "Patch potentials as a Casimir metrology systematic.",
      ),
      literatureRef(
        NHM2_RESEARCH_ARCHIMEDES_BALANCE_PROTOTYPE,
        "epjp_2024_archimedes_balance_prototype",
        "Vacuum-weight balance sensitivity planning.",
      ),
      literatureRef(
        NHM2_RESEARCH_ARCHIMEDES_2025_STATUS,
        "archimedes_2025_status",
        "Current Archimedes development status.",
      ),
      literatureRef(
        NHM2_RESEARCH_ADVANCED_LIGO_SENSITIVITY,
        "ligo_p1500260_advanced_ligo_sensitivity",
        "Detector sensitivity comparison for metric-response bounds.",
      ),
      literatureRef(
        NHM2_RESEARCH_SILICON_CASIMIR_CHIP,
        "nature_communications_2013_silicon_casimir_chip",
        "Lithographic Casimir force sensor precedent.",
      ),
      literatureRef(
        NHM2_RESEARCH_MILLIMETRE_GRAVITY,
        "nature_2021_millimetre_scale_gravitational_coupling",
        "Small-source gravitational coupling metrology precedent.",
      ),
      literatureRef(
        NHM2_RESEARCH_PFENNING_FORD_QI,
        "gr-qc_9702026_pfenning_ford_warp_qi",
        "QEI constraints on warp-drive negative energy.",
      ),
      literatureRef(
        NHM2_RESEARCH_STATIONARY_WORLDLINE_QEI,
        "arxiv_2301_01698_stationary_worldline_qei",
        "Worldline QEI bound planning reference.",
      ),
      literatureRef(
        NHM2_RESEARCH_GENERIC_WARP_NEC,
        "arxiv_2105_03079_generic_warp_nec",
        "Observer-family energy-condition caution.",
      ),
      literatureRef(
        NHM2_RESEARCH_SCHARNHORST_CAUTION,
        "scharnhorst_light_between_plates_caution",
        "Boundary-QED light propagation is not itself NHM2 gravity evidence.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "experiment", "roadmap", "falsifier", "claim_boundary"],
      symbols: ["DeltaTmunu", "delta_phi", "delta_tau", "DeltaF", "h00_proxy", "QEI"],
      unitSignatures: ["J", "N", "Pa", "s"],
      repoPaths: [
        NHM2_EXPERIMENT_FACING_THEORY_ROADMAP_CONTRACT,
        NHM2_EXPERIMENT_FACING_THEORY_ROADMAP,
        NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT,
        NHM2_FULL_SOLVE_WHITEPAPER,
      ],
      equationFamilies: ["experiment_facing_theory_roadmap", "physical_viability_campaign"],
      simulationOwners: ["NHM2", "casimir", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.experimental.parameter_targets",
    title: "Experiment Parameter Targets",
    plainMeaning:
      "Lists the NHM2 numerical and qualitative targets, independent research comparators, required receipts, and blockers for each experiment-facing roadmap stage.",
    whyItMatters:
      "It turns the roadmap into a measurable planning ledger without treating modeled scalars, literature ranges, or feasibility notes as experimental success.",
    subjects: ["nhm2", "experiment", "parameter_targets", "roadmap", "claim_boundary"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "casimir", "general_relativity"],
    equationFamilies: ["experiment_parameter_targets", "experiment_facing_theory_roadmap"],
    tags: [
      "experimental_ladder",
      "parameter_targets",
      "runtime_reference",
      "noncomputable_reference",
      "claim_boundary",
    ],
    equations: [
      {
        id: "experiment_parameter_target_row",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{Target}_{stage,parameter}=\\{\\mathrm{NHM2Target},\\mathrm{LiteratureRange},\\mathrm{Receipt},\\mathrm{Blocker}\\}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["stageId", "parameterId", "NHM2Target", "LiteratureRange", "Receipt"],
        outputSymbols: ["ParameterTargetStatus"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Parameter targets are planning and falsification rows, not measurements.",
      "Modeled scalar rows such as ideal tile energy, pressure, layer count, weight equivalent, and weak-field h00 remain sanity targets only.",
      "Parameter targets, scalar rows, and literature comparators cannot substitute for experimental receipts.",
      "Independent literature ranges are comparators for feasibility and systematics; they do not validate NHM2 artifacts.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(
        NHM2_EXPERIMENT_PARAMETER_TARGETS_CONTRACT,
        "nhm2_experiment_parameter_targets/v1",
        "Typed parameter-target layer for the experiment-facing roadmap.",
      ),
      artifactRef(
        NHM2_EXPERIMENT_PARAMETER_TARGETS,
        "experiment-parameter-targets-target",
        "Expected runtime artifact target for parameter/comparator/receipt/blocker rows.",
      ),
      repoRef(
        NHM2_EXPERIMENT_FACING_THEORY_ROADMAP_CONTRACT,
        "nhm2_experiment_facing_theory_roadmap/v1",
        "Roadmap stage IDs consumed by the parameter-target rows.",
      ),
      docRef(
        NHM2_FULL_SOLVE_WHITEPAPER,
        "parameter-targets-and-feasibility-ranges",
        "Whitepaper parameter-target section.",
      ),
      literatureRef(
        NHM2_RESEARCH_REAL_MATERIAL_CASIMIR,
        "arxiv_0902_4022_real_material_casimir_review",
        "Real-material Lifshitz/Casimir systematics and comparison methodology.",
      ),
      literatureRef(
        NHM2_RESEARCH_ARBITRARY_MATERIAL_CASIMIR,
        "arxiv_1010_5539_arbitrary_material_casimir",
        "Arbitrary geometry and material Casimir computation comparator.",
      ),
      literatureRef(
        NHM2_RESEARCH_SILICON_CASIMIR_CHIP,
        "nature_communications_2013_silicon_casimir_chip",
        "Chip-level Casimir force sensing and lithographic parallelism precedent.",
      ),
      literatureRef(
        NHM2_RESEARCH_PATCH_POTENTIALS,
        "arxiv_1409_5012_patch_potentials",
        "Patch-potential metrology systematic.",
      ),
      literatureRef(
        NHM2_RESEARCH_HIGH_STRESS_NANOMECHANICAL_RESONATORS,
        "physrevapplied_2021_high_stress_nanomechanical_resonators",
        "High-stress film resonator comparator for mechanical plausibility.",
      ),
      literatureRef(
        NHM2_RESEARCH_ALN_CMOS_MEMS_REVIEW,
        "critical_reviews_2024_aln_cmos_mems",
        "AlN MEMS material comparator.",
      ),
      literatureRef(
        NHM2_RESEARCH_ARCHIMEDES_BALANCE_PROTOTYPE,
        "epjp_2024_archimedes_balance_prototype",
        "Vacuum-weight balance comparator.",
      ),
      literatureRef(
        NHM2_RESEARCH_ADVANCED_LIGO_SENSITIVITY,
        "ligo_p1500260_advanced_ligo_sensitivity",
        "Metric-response detector sensitivity comparator.",
      ),
      literatureRef(
        NHM2_RESEARCH_MILLIMETRE_GRAVITY,
        "nature_2021_millimetre_scale_gravitational_coupling",
        "Small-source gravity metrology comparator.",
      ),
      literatureRef(
        NHM2_RESEARCH_PFENNING_FORD_QI,
        "gr-qc_9702026_pfenning_ford_warp_qi",
        "Quantum inequality caution for negative-energy targets.",
      ),
      literatureRef(
        NHM2_RESEARCH_STATIONARY_WORLDLINE_QEI,
        "arxiv_2301_01698_stationary_worldline_qei",
        "Stationary-worldline QEI bound planning reference.",
      ),
      literatureRef(
        NHM2_RESEARCH_GENERIC_WARP_NEC,
        "arxiv_2105_03079_generic_warp_nec",
        "Generic warp NEC and observer-family caution.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "experiment", "parameter_targets", "roadmap", "claim_boundary"],
      symbols: [
        "gap",
        "E_tile",
        "pressure",
        "N_layer",
        "DeltaF",
        "h00_proxy",
        "QEI",
      ],
      unitSignatures: ["m", "m^2", "J", "Pa", "N", "strain"],
      repoPaths: [
        NHM2_EXPERIMENT_PARAMETER_TARGETS_CONTRACT,
        NHM2_EXPERIMENT_PARAMETER_TARGETS,
        NHM2_EXPERIMENT_FACING_THEORY_ROADMAP_CONTRACT,
        NHM2_FULL_SOLVE_WHITEPAPER,
      ],
      equationFamilies: ["experiment_parameter_targets", "experiment_facing_theory_roadmap"],
      simulationOwners: ["NHM2", "casimir", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.experimental.research_gap_ledger",
    title: "Experiment Research Gap Ledger",
    plainMeaning:
      "Maps each NHM2 parameter target to the remaining research gap, nearest independent precedents, uncovered regime, earliest falsifier, null-result meaning, and claim impact.",
    whyItMatters:
      "It keeps the experiment campaign pointed at high-value measurements and falsifiers without treating literature comparators or target feasibility as NHM2 validation.",
    subjects: ["nhm2", "experiment", "research_gap", "value_of_information", "claim_boundary"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "casimir", "general_relativity"],
    equationFamilies: ["experiment_research_gap_ledger", "experiment_parameter_targets"],
    tags: [
      "experimental_ladder",
      "research_gap_ledger",
      "value_of_information",
      "runtime_reference",
      "noncomputable_reference",
      "claim_boundary",
    ],
    equations: [
      {
        id: "experiment_research_gap_row",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{Gap}_{target}=\\{\\mathrm{Precedent},\\mathrm{UncoveredRegime},\\mathrm{Receipt},\\mathrm{NullMeaning},\\mathrm{ClaimImpact}\\}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["targetId", "stageId", "precedent", "null_result", "claimImpact"],
        outputSymbols: ["ResearchGapStatus"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Research-gap rows are planning and falsification surfaces, not experiment results.",
      "No direct precedent found is not a novelty claim and requires a search receipt before stronger language.",
      "External references identify nearby methods, parameter regimes, and systematics; they do not validate NHM2.",
      "High-information null results are campaign evidence and may close a route rather than support it.",
      "This badge is a runtime reference row and has no calculator payload.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(
        NHM2_EXPERIMENT_RESEARCH_GAP_LEDGER_CONTRACT,
        "nhm2_experiment_research_gap_ledger/v1",
        "Typed research-gap/value-of-information ledger keyed to experiment parameter targets.",
      ),
      artifactRef(
        NHM2_EXPERIMENT_RESEARCH_GAP_LEDGER,
        "experiment-research-gap-ledger-target",
        "Expected runtime artifact target for research gaps, search receipts, falsifiers, and claim impacts.",
      ),
      repoRef(
        NHM2_EXPERIMENT_PARAMETER_TARGETS_CONTRACT,
        "nhm2_experiment_parameter_targets/v1",
        "Parameter target rows consumed by the research-gap ledger.",
      ),
      docRef(
        NHM2_FULL_SOLVE_WHITEPAPER,
        "research-gaps-and-value-of-information",
        "Whitepaper research-gap/value-of-information section.",
      ),
      literatureRef(
        NHM2_RESEARCH_REGULARIZED_CASIMIR_GRAVITY,
        "arxiv_1401_0784_regularized_casimir_gravity",
        "Regularized Casimir/vacuum-energy gravity context for full apparatus accounting.",
      ),
      literatureRef(
        NHM2_RESEARCH_CONDUCTIVE_PLANE_STACK_CASIMIR,
        "arxiv_1505_04169_conductive_plane_stack_casimir",
        "Conductive-plane stack Casimir scaling comparator.",
      ),
      literatureRef(
        NHM2_RESEARCH_ARCHIMEDES_2025_EPJ,
        "epjconf_2025_archimedes_vacuum_gravity",
        "Vacuum-gravity pathfinder context for detector-facing gaps.",
      ),
      literatureRef(
        NHM2_RESEARCH_ADVANCED_LIGO_PHYSREVD_93_112004,
        "physrevd_93_112004_advanced_ligo_sensitivity",
        "Detector sensitivity comparator for metric-response planning.",
      ),
      literatureRef(
        NHM2_RESEARCH_STATIONARY_WORLDLINE_QEI,
        "arxiv_2301_01698_stationary_worldline_qei",
        "Stationary-worldline QEI applicability context.",
      ),
      literatureRef(
        NHM2_RESEARCH_WARPAX_OBSERVER_ROBUST,
        "arxiv_2602_18023_warpax_observer_robust",
        "Observer-robust warp energy-condition integration context.",
      ),
      literatureRef(
        NHM2_RESEARCH_GENERIC_WARP_NEC,
        "arxiv_2105_03079_generic_warp_nec",
        "Generic warp NEC caution and observer-family falsification context.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "experiment", "research_gap", "value_of_information", "claim_boundary"],
      symbols: ["Gap_target", "NullResult", "ClaimImpact", "SearchReceipt"],
      unitSignatures: [],
      repoPaths: [
        NHM2_EXPERIMENT_RESEARCH_GAP_LEDGER_CONTRACT,
        NHM2_EXPERIMENT_RESEARCH_GAP_LEDGER,
        NHM2_EXPERIMENT_PARAMETER_TARGETS_CONTRACT,
        NHM2_FULL_SOLVE_WHITEPAPER,
      ],
      equationFamilies: ["experiment_research_gap_ledger", "experiment_parameter_targets"],
      simulationOwners: ["NHM2", "casimir", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.experimental.layer_stack_mechanical_receipt",
    title: "Layer Stack Mechanical Receipt",
    plainMeaning:
      "Computes the ideal internal load for the 447-layer wall-source candidate and records the missing mechanical receipts needed before the stack can count as material/source evidence.",
    whyItMatters:
      "The scalar 447-layer lead implies roughly 14.2 kN internal normal attraction and about 142 MPa projected stress; survivability, pull-in, support, thermal, fatigue, and active-control receipts are therefore front-door engineering blockers.",
    subjects: ["nhm2", "casimir", "layer_stack", "mechanical_receipt", "pull_in"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "casimir"],
    equationFamilies: ["layer_stack_mechanical_receipt", "experiment_parameter_targets"],
    tags: [
      "experimental_ladder",
      "mechanical_receipt",
      "layer_stack",
      "runtime_reference",
      "noncomputable_reference",
      "claim_boundary",
    ],
    equations: [
      {
        id: "ideal_casimir_pressure_load",
        role: "noncomputable_reference",
        displayLatex:
          "P_{ideal}=\\pi^2\\hbar c/(240a^4),\\quad F_{stack}=N_{layer}P_{ideal}A",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["a", "A", "N_layer"],
        outputSymbols: ["P_ideal", "F_stack"],
      },
    ],
    units: [
      { symbol: "P_ideal", unit: "Pa", quantity: "ideal Casimir pressure", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "F_stack", unit: "N", quantity: "internal stack load", dimensionSignature: "M L T^-2" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "The 14.2 kN scalar load is internal plate attraction, not thrust.",
      "The ideal pressure and force are perfect-conductor scalar diagnostics until real-material force-gap and mechanical receipts exist.",
      "Linear multiplication by 447 layers remains blocked until nonadditivity, support fraction, cross-coupling, thermal load, and active-control energy are receipted.",
      "Mechanical survivability cannot substitute for same-basis full tensor source authority.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(
        NHM2_LAYER_STACK_MECHANICAL_RECEIPT_CONTRACT,
        "nhm2_layer_stack_mechanical_receipt/v1",
        "Typed diagnostic mechanical receipt for the 447-layer scalar candidate.",
      ),
      artifactRef(
        NHM2_LAYER_STACK_MECHANICAL_RECEIPT,
        "layer-stack-mechanical-receipt-target",
        "Expected runtime artifact target for stack load, stress, and mechanical receipt blockers.",
      ),
      repoRef(
        NHM2_EXPERIMENT_PARAMETER_TARGETS_CONTRACT,
        "array_scaling.layer_count",
        "Parameter target source for 447 layers and stack thickness.",
      ),
      docRef(
        NHM2_FULL_SOLVE_WHITEPAPER,
        "wall-source-layering-sweep",
        "Whitepaper layering sweep and 447-layer scalar lead.",
      ),
      literatureRef(
        NHM2_RESEARCH_REAL_MATERIAL_CASIMIR,
        "revmodphys_81_1827_real_material_casimir",
        "Real-material Casimir review and systematics context.",
      ),
      literatureRef(
        NHM2_RESEARCH_CASIMIR_MEMS_REVIEW,
        "pmc_2024_casimir_mems_review",
        "Casimir/MEMS materials, geometry, metrology, and stiction review.",
      ),
      literatureRef(
        NHM2_RESEARCH_ROUGHNESS_MEMS_ACTUATION,
        "physrevb_87_125413_roughness_mems_actuation",
        "Roughness and Casimir/electrostatic effects in MEMS actuation.",
      ),
      literatureRef(
        NHM2_RESEARCH_SURFACE_POTENTIAL_NANOMEMBRANE,
        "arxiv_1207_4429_surface_potential_nanomebrane",
        "Nanomembrane Casimir force and surface potential measurement comparator.",
      ),
      literatureRef(
        NHM2_RESEARCH_HIGH_STRESS_NANOMECHANICAL_RESONATORS,
        "physrevapplied_15_034063_high_stress_sin",
        "High-stress film comparator for mechanical stress plausibility.",
      ),
      literatureRef(
        NHM2_RESEARCH_TIN_MEMBRANE_RESONATORS,
        "apl_127_222202_high_stress_tin",
        "Ultra-high-stress TiN membrane comparator.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "casimir", "layer_stack", "mechanical_receipt", "pull_in"],
      symbols: ["P_ideal", "F_tile", "F_stack", "N_layer", "sigma_effective"],
      unitSignatures: ["Pa", "N", "m"],
      repoPaths: [
        NHM2_LAYER_STACK_MECHANICAL_RECEIPT_CONTRACT,
        NHM2_LAYER_STACK_MECHANICAL_RECEIPT,
        NHM2_EXPERIMENT_PARAMETER_TARGETS_CONTRACT,
        NHM2_FULL_SOLVE_WHITEPAPER,
      ],
      equationFamilies: ["layer_stack_mechanical_receipt", "experiment_parameter_targets"],
      simulationOwners: ["NHM2", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.experimental.layer_stack_support_fraction_sweep",
    title: "Layer Stack Support Fraction Sweep",
    plainMeaning:
      "Sweeps support area against active Casimir area for the 447-layer stack to find whether mechanical stress limits and wall-source retention can overlap.",
    whyItMatters:
      "Increasing support fraction lowers local support stress but removes active Casimir area; this badge exposes that engineering tradeoff before the stack can be treated as a source candidate.",
    subjects: ["nhm2", "casimir", "layer_stack", "support_fraction", "go_no_go"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "casimir"],
    equationFamilies: ["layer_stack_support_fraction_sweep", "layer_stack_mechanical_receipt"],
    tags: [
      "experimental_ladder",
      "support_fraction",
      "mechanical_receipt",
      "go_no_go",
      "runtime_reference",
      "noncomputable_reference",
      "claim_boundary",
    ],
    equations: [
      {
        id: "support_fraction_tradeoff",
        role: "noncomputable_reference",
        displayLatex:
          "\\sigma_{support}=F_{stack}/(A f_s),\\quad R_{source}=(1-f_s)C_{mat}\\eta_{layer}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["F_stack", "A", "f_s", "C_mat", "eta_layer"],
        outputSymbols: ["sigma_support", "R_source"],
      },
    ],
    units: [
      { symbol: "sigma_support", unit: "Pa", quantity: "support stress", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "R_source", unit: null, quantity: "retained source fraction", dimensionSignature: "1" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Support stress decreases as support fraction increases.",
      "Active area and retained wall-source fraction decrease as support fraction increases.",
      "The default sweep reports no pass when stress and source-retention constraints do not overlap.",
      "Support and active-control tensor terms must be supplied before any candidate window can count beyond reduced-order review.",
      "The sweep is a go/no-go planning map, not material evidence or physical viability.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(
        NHM2_LAYER_STACK_SUPPORT_FRACTION_SWEEP_CONTRACT,
        "nhm2_layer_stack_support_fraction_sweep/v1",
        "Typed support-fraction go/no-go sweep for the 447-layer scalar candidate.",
      ),
      artifactRef(
        NHM2_LAYER_STACK_SUPPORT_FRACTION_SWEEP,
        "layer-stack-support-fraction-sweep-target",
        "Expected runtime artifact target for support stress, active-area retention, and go/no-go rows.",
      ),
      repoRef(
        NHM2_LAYER_STACK_MECHANICAL_RECEIPT_CONTRACT,
        "nhm2_layer_stack_mechanical_receipt/v1",
        "Mechanical receipt supplying the ideal 447-layer stack force.",
      ),
      docRef(
        NHM2_FULL_SOLVE_WHITEPAPER,
        "support-fraction-go-no-go-map",
        "Whitepaper support-fraction go/no-go map.",
      ),
      literatureRef(
        NHM2_RESEARCH_CASIMIR_MEMS_REVIEW,
        "pmc_2024_casimir_mems_review",
        "Casimir/MEMS pull-in, stiction, and metrology context.",
      ),
      literatureRef(
        NHM2_RESEARCH_ROUGHNESS_MEMS_ACTUATION,
        "physrevb_87_125413_roughness_mems_actuation",
        "Roughness and Casimir/electrostatic effects in MEMS actuation.",
      ),
      literatureRef(
        NHM2_RESEARCH_SURFACE_POTENTIAL_NANOMEMBRANE,
        "arxiv_1207_4429_surface_potential_nanomebrane",
        "Surface-potential and nanomembrane Casimir measurement comparator.",
      ),
      literatureRef(
        NHM2_RESEARCH_REAL_MATERIAL_CASIMIR,
        "revmodphys_81_1827_real_material_casimir",
        "Real-material Lifshitz/Casimir correction context.",
      ),
      literatureRef(
        NHM2_RESEARCH_HIGH_STRESS_NANOMECHANICAL_RESONATORS,
        "physrevapplied_15_034063_high_stress_sin",
        "High-stress SiN comparator for allowable stress.",
      ),
      literatureRef(
        NHM2_RESEARCH_TIN_MEMBRANE_RESONATORS,
        "apl_127_222202_high_stress_tin",
        "Ultra-high-stress TiN comparator.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "casimir", "layer_stack", "support_fraction", "go_no_go"],
      symbols: ["f_s", "sigma_support", "R_source", "C_mat", "eta_layer"],
      unitSignatures: ["Pa", "N", "1"],
      repoPaths: [
        NHM2_LAYER_STACK_SUPPORT_FRACTION_SWEEP_CONTRACT,
        NHM2_LAYER_STACK_SUPPORT_FRACTION_SWEEP,
        NHM2_LAYER_STACK_MECHANICAL_RECEIPT_CONTRACT,
        NHM2_FULL_SOLVE_WHITEPAPER,
      ],
      equationFamilies: ["layer_stack_support_fraction_sweep", "layer_stack_mechanical_receipt"],
      simulationOwners: ["NHM2", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.experimental.layer_stack_architecture_loop",
    title: "Layer Stack Architecture Loop",
    plainMeaning:
      "Tests whether frames, ribs, spacer posts, membranes, lattices, segmented cells, load-sharing stacks, or active gap control can decouple load support from active Casimir area.",
    whyItMatters:
      "The support-fraction sweep fails when support area and active source area compete directly; this loop asks whether an engineering architecture can create a review window while recording pull-in, roughness, patch, material, active-control, and tensor blockers.",
    subjects: ["nhm2", "casimir", "layer_stack", "architecture", "engineering_gate"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "casimir"],
    equationFamilies: ["layer_stack_architecture_loop", "layer_stack_support_fraction_sweep"],
    tags: [
      "experimental_ladder",
      "architecture_loop",
      "pull_in",
      "support_fraction",
      "active_area_retention",
      "runtime_reference",
      "noncomputable_reference",
      "claim_boundary",
    ],
    equations: [
      {
        id: "decoupled_load_path_retention",
        role: "noncomputable_reference",
        displayLatex:
          "\\sigma_{support}=F_{stack}/(A f_{load}),\\quad R_{source}=(1-f_{lost})C_{mat}\\eta_{layer}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["F_stack", "A", "f_load", "f_lost", "C_mat", "eta_layer"],
        outputSymbols: ["sigma_support", "R_source"],
      },
      {
        id: "pull_in_margin_proxy",
        role: "noncomputable_reference",
        displayLatex: "M_{pull-in}=k_{eff}/(SF\\,\\partial F_{Casimir}/\\partial g)",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["k_eff", "SF", "partial_F_Casimir_partial_g"],
        outputSymbols: ["M_pull-in"],
      },
    ],
    units: [
      { symbol: "sigma_support", unit: "Pa", quantity: "support stress", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "R_source", unit: null, quantity: "retained source fraction", dimensionSignature: "1" },
      { symbol: "M_pull-in", unit: null, quantity: "pull-in margin", dimensionSignature: "1" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Architecture rows separate load-bearing fraction from active-area loss.",
      "A review window is not material-source evidence; it only prioritizes which device geometry deserves receipts.",
      "Pull-in, roughness, patch-potential, active-control, fatigue, and full-apparatus tensor terms remain explicit blockers.",
      "Support and drive terms must enter the source-side apparatus tensor before wall-source authority can use the architecture.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(
        NHM2_LAYER_STACK_ENGINEERING_ARCHITECTURE_LOOP_CONTRACT,
        "nhm2_layer_stack_engineering_architecture_loop/v1",
        "Typed engineering architecture loop for load-path and active-area decoupling candidates.",
      ),
      artifactRef(
        NHM2_LAYER_STACK_ENGINEERING_ARCHITECTURE_LOOP,
        "layer-stack-engineering-architecture-loop-target",
        "Expected runtime artifact target for architecture rows, pull-in margins, research gaps, and tensor blockers.",
      ),
      repoRef(
        NHM2_LAYER_STACK_SUPPORT_FRACTION_SWEEP_CONTRACT,
        "nhm2_layer_stack_support_fraction_sweep/v1",
        "Support-fraction blocker that motivates decoupled architecture search.",
      ),
      docRef(
        NHM2_FULL_SOLVE_WHITEPAPER,
        "architecture-loop-for-decoupled-load-paths",
        "Whitepaper architecture loop for decoupled support and active area.",
      ),
      literatureRef(
        NHM2_RESEARCH_CASIMIR_MEMS_REVIEW,
        "pmc_2024_casimir_mems_review",
        "Casimir/MEMS pull-in, stiction, materials, geometries, and metrology context.",
      ),
      literatureRef(
        NHM2_RESEARCH_ROUGHNESS_PULL_IN,
        "physrevb_72_115426_roughness_pull_in",
        "Self-affine roughness and pull-in comparator.",
      ),
      literatureRef(
        NHM2_RESEARCH_ROUGHNESS_MEMS_ACTUATION,
        "physrevb_87_125413_roughness_mems_actuation",
        "Roughness and Casimir/electrostatic effects in MEMS actuation.",
      ),
      literatureRef(
        NHM2_RESEARCH_SURFACE_POTENTIAL_NANOMEMBRANE,
        "arxiv_1207_4429_surface_potential_nanomebrane",
        "Nanomembrane Casimir force and in-situ surface-potential measurement comparator.",
      ),
      literatureRef(
        NHM2_RESEARCH_CASIMIR_PULL_IN_FRAMEWORK,
        "rspa_2020_0311_casimir_pull_in_framework",
        "Casimir pull-in framework comparator.",
      ),
      literatureRef(
        NHM2_RESEARCH_HIGH_STRESS_NANOMECHANICAL_RESONATORS,
        "physrevapplied_15_034063_high_stress_sin",
        "High-stress SiN comparator.",
      ),
      literatureRef(
        NHM2_RESEARCH_TIN_MEMBRANE_RESONATORS,
        "apl_127_222202_high_stress_tin",
        "Ultra-high-stress TiN comparator.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "casimir", "layer_stack", "architecture", "engineering_gate"],
      symbols: ["f_load", "f_lost", "sigma_support", "R_source", "M_pull-in"],
      unitSignatures: ["Pa", "N/m", "1"],
      repoPaths: [
        NHM2_LAYER_STACK_ENGINEERING_ARCHITECTURE_LOOP_CONTRACT,
        NHM2_LAYER_STACK_ENGINEERING_ARCHITECTURE_LOOP,
        NHM2_LAYER_STACK_SUPPORT_FRACTION_SWEEP_CONTRACT,
        NHM2_FULL_SOLVE_WHITEPAPER,
      ],
      equationFamilies: ["layer_stack_architecture_loop", "layer_stack_support_fraction_sweep"],
      simulationOwners: ["NHM2", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.experimental.full_apparatus_receipt_loop",
    title: "Full Apparatus Receipt Loop",
    plainMeaning:
      "Checks whether a 447-layer architecture has material, force-gap, pull-in, roughness, patch-potential, active-control, fatigue, layer-scaling, and full-apparatus tensor receipts.",
    whyItMatters:
      "The architecture loop can expose review windows, but a row cannot become a receipted engineering candidate until every receipt surface and every support/spacer/control tensor term is accounted for.",
    subjects: ["nhm2", "casimir", "layer_stack", "receipt_loop", "full_apparatus_tensor"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "casimir"],
    equationFamilies: ["layer_stack_receipt_loop", "full_apparatus_tensor"],
    tags: [
      "experimental_ladder",
      "receipt_loop",
      "material_coupon",
      "pull_in",
      "roughness_patch",
      "active_control",
      "fatigue",
      "layer_scaling",
      "full_apparatus_tensor",
      "runtime_reference",
      "noncomputable_reference",
      "claim_boundary",
    ],
    equations: [
      {
        id: "receipt_surface_conjunction",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{Candidate}_{eng}=M_{coupon}\\land F(g)\\land R_{rough/patch}\\land C_{active}\\land L_{fatigue}\\land S_{layers}\\land T^{apparatus}_{\\mu\\nu}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: [
          "M_coupon",
          "F(g)",
          "R_rough_patch",
          "C_active",
          "L_fatigue",
          "S_layers",
          "T_apparatus_mu_nu",
        ],
        outputSymbols: ["Candidate_eng"],
      },
    ],
    units: [
      { symbol: "F(g)", unit: "N", quantity: "force-gap receipt", dimensionSignature: "M L T^-2" },
      { symbol: "T_apparatus_mu_nu", unit: "J/m^3", quantity: "apparatus stress-energy tensor", dimensionSignature: "M L^-1 T^-2" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "All receipt surfaces are required before an architecture row can be a receipted engineering candidate.",
      "Declared models and ideal scalar Casimir formulas are review context, not material receipts.",
      "Support, spacer, active-control, thermal, electrostatic, fatigue, and layer-scaling tensor terms are required before source tensor authority can evaluate the apparatus.",
      "A receipted engineering candidate still does not unlock physical, transport, propulsion, route, or speed claims.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(
        NHM2_LAYER_STACK_FULL_APPARATUS_RECEIPT_LOOP_CONTRACT,
        "nhm2_layer_stack_full_apparatus_receipt_loop/v1",
        "Typed receipt loop for material, pull-in, metrology, control, fatigue, layer scaling, and full apparatus tensor evidence.",
      ),
      artifactRef(
        NHM2_LAYER_STACK_FULL_APPARATUS_RECEIPT_LOOP,
        "layer-stack-full-apparatus-receipt-loop-target",
        "Expected runtime artifact target for receipted engineering candidate rows and blockers.",
      ),
      repoRef(
        NHM2_LAYER_STACK_ENGINEERING_ARCHITECTURE_LOOP_CONTRACT,
        "nhm2_layer_stack_engineering_architecture_loop/v1",
        "Architecture review loop consumed by the receipt loop.",
      ),
      docRef(
        NHM2_FULL_SOLVE_WHITEPAPER,
        "full-apparatus-receipt-loop",
        "Whitepaper receipt ladder for 447-layer architecture candidates.",
      ),
      literatureRef(
        NHM2_RESEARCH_CASIMIR_MEMS_REVIEW,
        "pmc_2024_casimir_mems_review",
        "Casimir/MEMS pull-in, stiction, materials, geometries, and metrology context.",
      ),
      literatureRef(
        NHM2_RESEARCH_ROUGHNESS_PULL_IN,
        "physrevb_72_115426_roughness_pull_in",
        "Roughness and pull-in comparator.",
      ),
      literatureRef(
        NHM2_RESEARCH_ROUGHNESS_MEMS_ACTUATION,
        "physrevb_87_125413_roughness_mems_actuation",
        "Roughness and Casimir/electrostatic effects in MEMS actuation.",
      ),
      literatureRef(
        NHM2_RESEARCH_PATCH_POTENTIAL_MEASUREMENT,
        "physrevresearch_2_023355_patch_potential_measurement",
        "Patch-potential measurement comparator.",
      ),
      literatureRef(
        NHM2_RESEARCH_SURFACE_POTENTIAL_NANOMEMBRANE,
        "arxiv_1207_4429_surface_potential_nanomebrane",
        "Nanomembrane Casimir force and in-situ surface-potential measurement comparator.",
      ),
      literatureRef(
        NHM2_RESEARCH_CASIMIR_PULL_IN_FRAMEWORK,
        "rspa_2020_0311_casimir_pull_in_framework",
        "Casimir pull-in framework comparator.",
      ),
      literatureRef(
        NHM2_RESEARCH_HIGH_STRESS_NANOMECHANICAL_RESONATORS,
        "physrevapplied_15_034063_high_stress_sin",
        "High-stress SiN comparator.",
      ),
      literatureRef(
        NHM2_RESEARCH_ALN_PIEZO_MEMS_REVIEW,
        "pmc_2025_aln_piezo_mems_review",
        "Recent AlN MEMS review comparator.",
      ),
      literatureRef(
        NHM2_RESEARCH_TIN_MEMBRANE_RESONATORS,
        "apl_127_222202_high_stress_tin",
        "Ultra-high-stress TiN comparator.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "casimir", "layer_stack", "receipt_loop", "full_apparatus_tensor"],
      symbols: ["M_coupon", "F(g)", "R_rough_patch", "C_active", "T_apparatus_mu_nu"],
      unitSignatures: ["N", "Pa", "J/m^3", "1"],
      repoPaths: [
        NHM2_LAYER_STACK_FULL_APPARATUS_RECEIPT_LOOP_CONTRACT,
        NHM2_LAYER_STACK_FULL_APPARATUS_RECEIPT_LOOP,
        NHM2_LAYER_STACK_ENGINEERING_ARCHITECTURE_LOOP_CONTRACT,
        NHM2_FULL_SOLVE_WHITEPAPER,
      ],
      equationFamilies: ["layer_stack_receipt_loop", "full_apparatus_tensor"],
      simulationOwners: ["NHM2", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.experimental.tile_source_physical_validation_plan",
    title: "Tile Source Physical Validation Plan",
    plainMeaning:
      "Freezes the most promising 447-layer tile-source architecture candidate and lists the receipts needed before it can become a physically credible source-side stress-energy candidate.",
    whyItMatters:
      "The full solve can only become physically meaningful if the tile/material apparatus supplies an independently receipted full T_mu_nu, with material, pull-in, roughness, control, fatigue, layer-scaling, conservation, QEI, observer, and coupled-closure evidence all passing together.",
    subjects: ["nhm2", "casimir", "tile_source", "physical_validation_plan", "full_apparatus_tensor"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "casimir", "general_relativity"],
    equationFamilies: ["tile_source_physical_validation_plan", "full_apparatus_tensor", "physical_viability_campaign"],
    tags: [
      "experimental_ladder",
      "tile_source",
      "physical_validation_plan",
      "full_apparatus_tensor",
      "source_authority",
      "runtime_reference",
      "noncomputable_reference",
      "claim_boundary",
    ],
    equations: [
      {
        id: "tile_source_candidate_conjunction",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{Candidate}_{source}=R_{receipts}\\land T^{apparatus}_{\\mu\\nu}\\land R_{closure}\\land \\nabla_{\\mu}T^{\\mu\\nu}\\land QEI\\land EC_{obs}\\land M_{cred}\\land C_{coupled}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: [
          "R_receipts",
          "T_apparatus_mu_nu",
          "R_closure",
          "nabla_mu_T_mu_nu",
          "QEI",
          "EC_obs",
          "M_cred",
          "C_coupled",
        ],
        outputSymbols: ["Candidate_source"],
      },
    ],
    units: [
      { symbol: "T_apparatus_mu_nu", unit: "J/m^3", quantity: "full apparatus source tensor", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "R_closure", unit: "1", quantity: "regional closure residual", dimensionSignature: "1" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "The selected topology-optimized TiN lattice candidate is a validation-plan target, not a physical source result.",
      "Material coupon, force-gap and pull-in, roughness and patch-potential, active-control, fatigue, layer-scaling, and full-apparatus tensor receipts are all required.",
      "A source-side apparatus tensor must include T00, momentum density T0i, diagonal Tij, off-diagonal Tij, support/spacer/control terms, and no metric-target echo.",
      "A physically credible source candidate still requires downstream regional residual, conservation, QEI, observer-family, material-credibility, and coupled-closure gates to pass together.",
      "Ideal scalar Casimir formulas and diagnostic architecture rows cannot substitute for material evidence or transport claims.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(
        NHM2_TILE_SOURCE_PHYSICAL_VALIDATION_PLAN_CONTRACT,
        "nhm2_tile_source_physical_validation_plan/v1",
        "Typed validation plan freezing the 447-layer candidate and enumerating receipts, tensor authority, downstream gates, and falsification blockers.",
      ),
      artifactRef(
        NHM2_TILE_SOURCE_PHYSICAL_VALIDATION_PLAN,
        "tile-source-physical-validation-plan-target",
        "Expected runtime artifact target for the physical tile-source validation plan.",
      ),
      repoRef(
        NHM2_LAYER_STACK_FULL_APPARATUS_RECEIPT_LOOP_CONTRACT,
        "nhm2_layer_stack_full_apparatus_receipt_loop/v1",
        "Upstream receipt loop consumed by the physical source validation plan.",
      ),
      artifactRef(
        NHM2_LAYER_STACK_FULL_APPARATUS_RECEIPT_LOOP,
        "layer-stack-full-apparatus-receipt-loop-target",
        "Upstream 447-layer full-apparatus receipt loop artifact target.",
      ),
      docRef(
        NHM2_FULL_SOLVE_WHITEPAPER,
        "tile-source-physical-validation-plan",
        "Whitepaper section defining the tile-source validation plan and current blockers.",
      ),
      literatureRef(
        NHM2_RESEARCH_CASIMIR_MEMS_REVIEW,
        "pmc_2024_casimir_mems_review",
        "Casimir/MEMS metrology, pull-in, and stiction context.",
      ),
      literatureRef(
        NHM2_RESEARCH_ROUGHNESS_MEMS_ACTUATION,
        "physrevb_87_125413_roughness_mems_actuation",
        "Roughness and electrostatic/Casimir MEMS actuation context.",
      ),
      literatureRef(
        NHM2_RESEARCH_PATCH_POTENTIAL_MEASUREMENT,
        "physrevresearch_2_023355_patch_potential_measurement",
        "Patch-potential measurement comparator for residual electrostatic corrections.",
      ),
      literatureRef(
        NHM2_RESEARCH_ALN_ALSCN_MEMS_MIRROR_REVIEW,
        "nature_2025_aln_alscn_mems_mirror_review",
        "AlN/AlScN MEMS mirror engineering comparator.",
      ),
      literatureRef(
        NHM2_RESEARCH_TIN_MEMBRANE_RESONATORS,
        "apl_127_222202_high_stress_tin",
        "Ultra-high-stress TiN membrane comparator for the frozen candidate.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "casimir", "tile_source", "physical_validation_plan", "full_apparatus_tensor"],
      symbols: ["Candidate_source", "T_apparatus_mu_nu", "R_closure", "QEI", "EC_obs"],
      unitSignatures: ["J/m^3", "Pa", "N", "1"],
      repoPaths: [
        NHM2_TILE_SOURCE_PHYSICAL_VALIDATION_PLAN_CONTRACT,
        NHM2_TILE_SOURCE_PHYSICAL_VALIDATION_PLAN,
        NHM2_LAYER_STACK_FULL_APPARATUS_RECEIPT_LOOP_CONTRACT,
        NHM2_FULL_SOLVE_WHITEPAPER,
      ],
      equationFamilies: ["tile_source_physical_validation_plan", "full_apparatus_tensor"],
      simulationOwners: ["NHM2", "casimir", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.experimental.prediction_freeze",
    title: "Experimental Prediction Freeze",
    plainMeaning:
      "Requires pre-registered source, metric-response, force, phase, clock, and falsifier predictions before experimental data are used.",
    whyItMatters:
      "It prevents fitting material or source parameters after the fact to imitate NHM2 closure.",
    subjects: ["nhm2", "experiment", "prediction_freeze", "falsifier"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "casimir", "general_relativity"],
    equationFamilies: ["physical_viability_campaign", "prediction_freeze"],
    tags: ["experimental_ladder", "falsifier", "noncomputable_reference"],
    equations: [
      {
        id: "prediction_freeze_receipt",
        role: "noncomputable_reference",
        displayLatex:
          "\\Delta T_{\\mu\\nu}(x,t),\\delta\\phi,\\delta\\tau,R_{\\hat0\\hat i\\hat0\\hat j}\\ \\mathrm{frozen\\ before\\ data}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["DeltaTmunu", "observables", "falsifiers"],
        outputSymbols: ["PredictionFreezeReceipt"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Predictions must be frozen before data collection; post-hoc fitting is a blocker.",
    ],
    calculatorPayloads: [],
    sourceRefs: [repoRef(NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT, "stage0_prediction_freeze")],
    hintKeys: {
      subjects: ["nhm2", "experiment", "prediction_freeze", "falsifier"],
      symbols: ["DeltaTmunu", "delta_phi", "delta_tau", "R_0i0j"],
      unitSignatures: [],
      repoPaths: [NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT],
      equationFamilies: ["physical_viability_campaign", "prediction_freeze"],
      simulationOwners: ["NHM2", "casimir", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.experimental.tile_force_receipt",
    title: "Tile Force Receipt",
    plainMeaning:
      "Requires measured force-versus-gap/material/temperature behavior for the fabricated tile before it can support source credibility.",
    whyItMatters:
      "A Casimir tile is an intensely stressed nanogap apparatus; ideal scalar plate math is not enough.",
    subjects: ["nhm2", "casimir", "tile_metrology", "experiment"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "casimir"],
    equationFamilies: ["tile_metrology", "physical_viability_campaign"],
    tags: ["experimental_ladder", "tile_metrology", "runtime_reference"],
    equations: [
      {
        id: "tile_force_receipt_curve",
        role: "noncomputable_reference",
        displayLatex: "F(a,T,\\epsilon,roughness,patches)\\ \\mathrm{measured}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["gap", "temperature", "dielectricResponse", "roughness", "patchPotential"],
        outputSymbols: ["TileForceReceipt"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Measured force, dielectric response, roughness, patch potentials, and energy-cycle closure are required before material-source credibility can be reviewed.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT, "stage1_tile_metrology"),
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "tile-metrology"),
    ],
    hintKeys: {
      subjects: ["nhm2", "casimir", "tile_metrology", "experiment"],
      symbols: ["F_gap", "dielectricResponse", "roughness", "patchPotential"],
      unitSignatures: ["N", "m", "K"],
      repoPaths: [NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT, NHM2_FULL_SOLVE_WHITEPAPER],
      equationFamilies: ["tile_metrology", "physical_viability_campaign"],
      simulationOwners: ["NHM2", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.experimental.tile_cycle_energy_balance",
    title: "Tile Cycle Energy Balance",
    plainMeaning:
      "Tracks the full cyclic energy ledger for a modulated tile, including input work, heat, radiation, elastic energy, and losses.",
    whyItMatters:
      "The Casimir source should be framed as controlled energy conversion, not free energy creation.",
    subjects: ["nhm2", "casimir", "energy_balance", "experiment"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "casimir"],
    equationFamilies: ["energy_balance", "physical_viability_campaign"],
    tags: ["experimental_ladder", "calculator_scalar", "energy_ledger"],
    equations: [
      {
        id: "mass_equivalent_energy_delta",
        role: "calculator_demo",
        displayLatex: "\\Delta m=\\Delta E/c^2",
        computableExpression: "delta_m = DeltaE/c^2",
        operatorKind: "scalar_expression",
        inputSymbols: ["DeltaE", "c"],
        outputSymbols: ["delta_m"],
      },
      {
        id: "weight_equivalent_energy_delta",
        role: "calculator_demo",
        displayLatex: "\\Delta F=g\\Delta E/c^2",
        computableExpression: "delta_F = g*DeltaE/c^2",
        operatorKind: "scalar_expression",
        inputSymbols: ["g", "DeltaE", "c"],
        outputSymbols: ["delta_F"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Scalar energy conversion rows are sanity checks and cannot substitute for full apparatus stress-energy receipts.",
    ],
    calculatorPayloads: [
      payload({
        id: "delta_m_energy_equivalent_payload",
        expression: "delta_m = DeltaE/c^2",
        displayLatex: "\\Delta m=\\Delta E/c^2",
        targetVariable: "delta_m",
      }),
      payload({
        id: "delta_F_weight_equivalent_payload",
        expression: "delta_F = g*DeltaE/c^2",
        displayLatex: "\\Delta F=g\\Delta E/c^2",
        targetVariable: "delta_F",
      }),
    ],
    sourceRefs: [
      repoRef(NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT, "tile_cycle_energy_balance"),
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "energy-conversion-not-creation"),
    ],
    hintKeys: {
      subjects: ["nhm2", "casimir", "energy_balance", "experiment"],
      symbols: ["DeltaE", "delta_m", "delta_F"],
      unitSignatures: ["J", "kg", "N"],
      repoPaths: [NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT, NHM2_FULL_SOLVE_WHITEPAPER],
      equationFamilies: ["energy_balance", "physical_viability_campaign"],
      simulationOwners: ["NHM2", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.experimental.array_scaling",
    title: "Array Scaling Receipt",
    plainMeaning:
      "Requires measured scaling from one cavity to arrays while bounding cross-coupling, heat, elastic stress, and geometry effects.",
    whyItMatters:
      "A full hull source cannot assume that many ideal cavities scale linearly without measurement.",
    subjects: ["nhm2", "casimir", "array_scaling", "experiment"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "casimir"],
    equationFamilies: ["array_scaling", "physical_viability_campaign"],
    tags: ["experimental_ladder", "calculator_scalar", "array_scaling"],
    equations: [
      {
        id: "array_scaling_ratio",
        role: "calculator_demo",
        displayLatex: "S_N=\\Delta E_N/(N\\Delta E_1)",
        computableExpression: "array_scaling = DeltaE_N/(N*DeltaE_1)",
        operatorKind: "scalar_expression",
        inputSymbols: ["DeltaE_N", "N", "DeltaE_1"],
        outputSymbols: ["array_scaling"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Array scaling must be measured; cross-cavity corrections and support stresses are not optional.",
    ],
    calculatorPayloads: [
      payload({
        id: "array_scaling_ratio_payload",
        expression: "array_scaling = DeltaE_N/(N*DeltaE_1)",
        displayLatex: "S_N=\\Delta E_N/(N\\Delta E_1)",
        targetVariable: "array_scaling",
      }),
    ],
    sourceRefs: [repoRef(NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT, "stage2_array_scaling")],
    hintKeys: {
      subjects: ["nhm2", "casimir", "array_scaling", "experiment"],
      symbols: ["DeltaE_N", "DeltaE_1", "N", "array_scaling"],
      unitSignatures: ["J"],
      repoPaths: [NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT],
      equationFamilies: ["array_scaling", "physical_viability_campaign"],
      simulationOwners: ["NHM2", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.experimental.full_apparatus_tensor",
    title: "Full Apparatus Tensor",
    plainMeaning:
      "Requires a material/source tensor for the whole apparatus, including plates, supports, fields, stresses, heat, and interaction energy.",
    whyItMatters:
      "GR sources the full apparatus stress-energy, not only the negative ideal interaction-energy row.",
    subjects: ["nhm2", "stress_energy", "apparatus_tensor", "experiment"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "casimir", "general_relativity"],
    equationFamilies: ["full_apparatus_tensor", "physical_viability_campaign"],
    tags: ["experimental_ladder", "full_tensor", "runtime_reference"],
    equations: [
      {
        id: "full_apparatus_tensor_receipt",
        role: "noncomputable_reference",
        displayLatex: "T^{apparatus}_{\\hat a\\hat b}=E,J_{\\hat i},S_{\\hat i\\hat j}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["E", "J_i", "S_ij"],
        outputSymbols: ["T_ab_apparatus"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Full apparatus tensor authority is required before physical source credibility can be reviewed.",
    ],
    calculatorPayloads: [],
    sourceRefs: [repoRef(NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT, "full_apparatus_tensor")],
    hintKeys: {
      subjects: ["nhm2", "stress_energy", "apparatus_tensor", "experiment"],
      symbols: ["T_ab_apparatus", "E", "J_i", "S_ij"],
      unitSignatures: ["J/m^3", "Pa"],
      repoPaths: [NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT],
      equationFamilies: ["full_apparatus_tensor", "physical_viability_campaign"],
      simulationOwners: ["NHM2", "casimir", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.experimental.vacuum_weight",
    title: "Vacuum Weight Receipt",
    plainMeaning:
      "Requires a modulated vacuum-related energy change with measured weight response, correct phase/sign/scaling, dummy rejection, and independent replication.",
    whyItMatters:
      "This is the first genuinely gravitational bridge from controlled source energy to measured gravitational coupling.",
    subjects: ["nhm2", "casimir", "vacuum_weight", "experiment"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "casimir", "general_relativity"],
    equationFamilies: ["vacuum_weight", "physical_viability_campaign"],
    tags: ["experimental_ladder", "runtime_reference", "gravity_coupling"],
    equations: [
      {
        id: "vacuum_weight_receipt",
        role: "noncomputable_reference",
        displayLatex: "\\Delta F_{measured}\\stackrel{?}{=}g\\Delta E/c^2",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["DeltaE", "g", "DeltaF_measured"],
        outputSymbols: ["VacuumWeightReceipt"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "A vacuum-weight receipt must reject thermal, electromagnetic, mechanical, and ordinary-mass dummy paths.",
    ],
    calculatorPayloads: [],
    sourceRefs: [repoRef(NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT, "stage3_vacuum_weight")],
    hintKeys: {
      subjects: ["nhm2", "casimir", "vacuum_weight", "experiment"],
      symbols: ["DeltaF_measured", "DeltaE", "g"],
      unitSignatures: ["N", "J"],
      repoPaths: [NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT],
      equationFamilies: ["vacuum_weight", "physical_viability_campaign"],
      simulationOwners: ["NHM2", "casimir", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.experimental.metric_upper_bound",
    title: "Metric Upper Bound Sanity Check",
    plainMeaning:
      "Provides a weak-field scale check for source energy near a sensor; it is a sanity bound, not a detector-response model.",
    whyItMatters:
      "It keeps LIGO-like or optical-path proposals numerically grounded before they become experimental badges.",
    subjects: ["nhm2", "metric_response", "weak_field", "experiment"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["NHM2", "general_relativity"],
    equationFamilies: ["metric_upper_bound", "physical_viability_campaign"],
    tags: ["experimental_ladder", "calculator_scalar", "weak_field"],
    equations: [
      {
        id: "weak_field_h00_proxy",
        role: "calculator_demo",
        displayLatex: "h_{00}\\simeq2G\\Delta E/(rc^4)",
        computableExpression: "h00_proxy = 2*G*DeltaE/(r*c^4)",
        operatorKind: "scalar_expression",
        inputSymbols: ["G", "DeltaE", "r", "c"],
        outputSymbols: ["h00_proxy"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Weak-field scalar bounds are proposal triage only and cannot substitute for invariant metric-response measurements.",
    ],
    calculatorPayloads: [
      payload({
        id: "h00_proxy_weak_field_payload",
        expression: "h00_proxy = 2*G*DeltaE/(r*c^4)",
        displayLatex: "h_{00}\\simeq2G\\Delta E/(rc^4)",
        targetVariable: "h00_proxy",
      }),
    ],
    sourceRefs: [repoRef(NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT, "metric_upper_bound")],
    hintKeys: {
      subjects: ["nhm2", "metric_response", "weak_field", "experiment"],
      symbols: ["h00_proxy", "G", "DeltaE", "r", "c"],
      unitSignatures: [],
      repoPaths: [NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT],
      equationFamilies: ["metric_upper_bound", "physical_viability_campaign"],
      simulationOwners: ["NHM2", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.experimental.invariant_metric_response",
    title: "Invariant Metric Response",
    plainMeaning:
      "Requires multiple probe families to agree with one predicted local metric response rather than a wavelength- or material-specific artifact.",
    whyItMatters:
      "A phase line alone is not evidence of NHM2 geometry unless clock, atom, mechanical, or tidal probes agree with the same metric model.",
    subjects: ["nhm2", "metric_response", "experiment", "invariant_observable"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity"],
    equationFamilies: ["metric_response", "physical_viability_campaign"],
    tags: ["experimental_ladder", "runtime_reference", "invariant_metric"],
    equations: [
      {
        id: "invariant_metric_response_receipt",
        role: "noncomputable_reference",
        displayLatex: "\\delta\\phi,\\delta\\tau,\\delta a^{\\hat i}\\rightarrow g_{\\mu\\nu}^{measured}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["delta_phi", "delta_tau", "delta_a"],
        outputSymbols: ["MetricResponseReceipt"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Thermal, electromagnetic, mechanical, optical-dispersion, and Newtonian paths must be bounded below the reported signal.",
    ],
    calculatorPayloads: [],
    sourceRefs: [repoRef(NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT, "stage4_metric_response")],
    hintKeys: {
      subjects: ["nhm2", "metric_response", "experiment", "invariant_observable"],
      symbols: ["delta_phi", "delta_tau", "delta_a", "g_mu_nu_measured"],
      unitSignatures: [],
      repoPaths: [NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT],
      equationFamilies: ["metric_response", "physical_viability_campaign"],
      simulationOwners: ["NHM2", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.experimental.geodesic_response",
    title: "Neutral Geodesic Response",
    plainMeaning:
      "Requires a neutral test body or clock worldline response in the predicted direction and magnitude without a conventional force path.",
    whyItMatters:
      "This is the first transport-precursor evidence class and must remain separate from route, propulsion, or speed claims.",
    subjects: ["nhm2", "transport_precursor", "geodesic_response", "experiment"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity"],
    equationFamilies: ["transport_precursor", "physical_viability_campaign"],
    tags: ["experimental_ladder", "runtime_reference", "transport_locked"],
    equations: [
      {
        id: "neutral_geodesic_response_receipt",
        role: "noncomputable_reference",
        displayLatex: "\\delta x^{\\mu}_{test}\\stackrel{?}{=}\\delta x^{\\mu}_{metric}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["testWorldline", "metricPrediction"],
        outputSymbols: ["TransportPrecursorReceipt"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "A transport precursor requires composition independence, recoil accounting, and reversible control before transport review can even begin.",
    ],
    calculatorPayloads: [],
    sourceRefs: [repoRef(NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT, "stage6_transport_precursor")],
    hintKeys: {
      subjects: ["nhm2", "transport_precursor", "geodesic_response", "experiment"],
      symbols: ["testWorldline", "metricPrediction", "delta_x_mu"],
      unitSignatures: [],
      repoPaths: [NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT],
      equationFamilies: ["transport_precursor", "physical_viability_campaign"],
      simulationOwners: ["NHM2", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.experimental.independent_replication",
    title: "Independent Replication",
    plainMeaning:
      "Requires a separate apparatus and analysis team to reproduce the physical evidence before stronger claim review.",
    whyItMatters:
      "A local generated or positive-unreplicated result cannot unlock physical or transport claims.",
    subjects: ["nhm2", "replication", "experiment", "claim_boundary"],
    level: "claim_boundary",
    status: "blocked",
    simulationOwners: ["NHM2", "casimir", "general_relativity"],
    equationFamilies: ["independent_replication", "physical_viability_campaign"],
    tags: ["experimental_ladder", "replication", "noncomputable_reference"],
    equations: [
      {
        id: "independent_replication_receipt",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{replicated}_{independent}=true",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["independentApparatus", "independentAnalysis"],
        outputSymbols: ["ReplicationReceipt"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Replication is an experimental receipt, not a calculator row.",
    ],
    calculatorPayloads: [],
    sourceRefs: [repoRef(NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT, "independent_replication")],
    hintKeys: {
      subjects: ["nhm2", "replication", "experiment", "claim_boundary"],
      symbols: ["replicated_independent"],
      unitSignatures: [],
      repoPaths: [NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT],
      equationFamilies: ["independent_replication", "physical_viability_campaign"],
      simulationOwners: ["NHM2", "casimir", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.claim_boundary.physical_viability_locked",
    title: "Physical Viability Locked",
    plainMeaning:
      "Keeps physical viability locked until the physical evidence campaign has replicated experimental source, metric, and stability receipts.",
    whyItMatters:
      "It separates diagnostic campaign admissibility from fabricated-source credibility.",
    subjects: ["nhm2", "claim_boundary", "physical_viability", "experiment"],
    level: "claim_boundary",
    status: "blocked",
    simulationOwners: ["NHM2", "casimir", "general_relativity"],
    equationFamilies: ["claim_boundary", "physical_viability_campaign"],
    tags: ["claim_boundary", "physical_viability_locked", "noncomputable_reference"],
    equations: [
      {
        id: "physical_viability_lock",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{physicalViabilityClaimAllowed}=false",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["PhysicalEvidenceCampaignStatus"],
        outputSymbols: ["physicalViabilityClaimAllowed"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Diagnostic campaign admission and Lean certificate admission cannot unlock this claim boundary.",
    ],
    calculatorPayloads: [],
    sourceRefs: [repoRef(NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT, "physicalViabilityClaimAllowed=false")],
    hintKeys: {
      subjects: ["nhm2", "claim_boundary", "physical_viability", "experiment"],
      symbols: ["physicalViabilityClaimAllowed"],
      unitSignatures: [],
      repoPaths: [NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT],
      equationFamilies: ["claim_boundary", "physical_viability_campaign"],
      simulationOwners: ["NHM2", "casimir", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.claim_boundary.transport_locked",
    title: "Transport Locked",
    plainMeaning:
      "Keeps transport, route, propulsion, and speed-authority claims locked until a neutral geodesic/clock response is measured and replicated.",
    whyItMatters:
      "A measured source or local metric response would still not be a route or transport claim by itself.",
    subjects: ["nhm2", "claim_boundary", "transport", "experiment"],
    level: "claim_boundary",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity"],
    equationFamilies: ["claim_boundary", "transport_precursor"],
    tags: ["claim_boundary", "transport_locked", "noncomputable_reference"],
    equations: [
      {
        id: "transport_lock",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{transportClaimAllowed}=false",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["TransportPrecursorReceipt"],
        outputSymbols: ["transportClaimAllowed"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Transport remains separate from physical source and metric-response evidence.",
    ],
    calculatorPayloads: [],
    sourceRefs: [repoRef(NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT, "transportClaimAllowed=false")],
    hintKeys: {
      subjects: ["nhm2", "claim_boundary", "transport", "experiment"],
      symbols: ["transportClaimAllowed"],
      unitSignatures: [],
      repoPaths: [NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT],
      equationFamilies: ["claim_boundary", "transport_precursor"],
      simulationOwners: ["NHM2", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.regional_atlas.available",
    title: "Regional Support-Function Atlas",
    plainMeaning:
      "Names the canonical regional support-function atlas used by source residual, conservation, QEI, observer, and claim-admission artifacts.",
    whyItMatters:
      "It prevents downstream gates from evaluating different implied hull, wall, exterior, or transition geometries.",
    subjects: ["nhm2", "regional_atlas", "support_functions", "artifact_governance"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["regional_support_function_atlas", "reference_run_provenance"],
    tags: ["regional_atlas", "support_function", "same_run", "artifact_receipt"],
    equations: [
      {
        id: "regional_support_function_atlas_receipt",
        role: "noncomputable_reference",
        displayLatex: "\\mathcal{A}_{R}=\\{W_R,\\mathrm{regions},\\mathrm{aggregation},\\mathrm{hashes}\\}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["runId", "chartId", "gridRef", "W_R", "aggregationPolicy"],
        outputSymbols: ["atlasHash"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "The atlas defines shared regional geometry; it does not tune physics residuals.",
      "Atlas availability is a runtime artifact receipt, not a material or transport claim.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef("shared/contracts/nhm2-regional-support-function-atlas.v1.ts", "nhm2-regional-support-function-atlas-contract", "Typed regional support-function atlas contract."),
      artifactRef("tools/nhm2/build-regional-support-function-atlas.ts", "nhm2-regional-support-function-atlas-generator", "Reference-run atlas generator."),
    ],
    hintKeys: {
      subjects: ["nhm2", "regional_atlas", "support_functions", "artifact_governance"],
      symbols: ["A_R", "W_R", "atlasHash", "aggregationPolicy"],
      unitSignatures: [],
      repoPaths: [
        "shared/contracts/nhm2-regional-support-function-atlas.v1.ts",
        "tools/nhm2/build-regional-support-function-atlas.ts",
      ],
      equationFamilies: ["regional_support_function_atlas", "reference_run_provenance"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.regional_atlas.partition_of_unity",
    title: "Atlas Partition Of Unity",
    plainMeaning:
      "Tracks whether the closure-region support weights form the declared partition policy within tolerance.",
    whyItMatters:
      "It makes hidden regional overlap or gaps visible before source and conservation gates aggregate tensor samples.",
    subjects: ["nhm2", "regional_atlas", "partition_of_unity", "support_functions"],
    level: "diagnostic_gate",
    status: "review",
    simulationOwners: ["NHM2", "general_relativity"],
    equationFamilies: ["regional_support_function_atlas", "partition_of_unity"],
    tags: ["regional_atlas", "partition_of_unity", "support_weight", "review_gated"],
    equations: [
      {
        id: "support_partition_of_unity",
        role: "gate",
        displayLatex: "\\sum_R W_R(x)\\approx 1",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["W_R", "x", "partitionTolerance"],
        outputSymbols: ["partitionStatus"],
      },
    ],
    units: [{ symbol: "W_R", unit: null, quantity: "support_weight", dimensionSignature: "1" }],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Partition status is read from the atlas artifact.",
      "A partition pass only says the support grammar is internally congruent.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef("shared/contracts/nhm2-regional-support-function-atlas.v1.ts", "partitionOfUnity", "Atlas partition-of-unity status field."),
      artifactRef("tests/nhm2-regional-support-function-atlas.spec.ts", "atlas-partition-test", "Focused atlas partition fixture."),
    ],
    hintKeys: {
      subjects: ["nhm2", "regional_atlas", "partition_of_unity", "support_functions"],
      symbols: ["W_R", "sumW", "partitionStatus"],
      unitSignatures: ["1"],
      repoPaths: [
        "shared/contracts/nhm2-regional-support-function-atlas.v1.ts",
        "tests/nhm2-regional-support-function-atlas.spec.ts",
      ],
      equationFamilies: ["regional_support_function_atlas", "partition_of_unity"],
      simulationOwners: ["NHM2", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.regional_atlas.transition_supports",
    title: "Atlas Transition Supports",
    plainMeaning:
      "Records the canonical hull-wall and wall-exterior transition support regions and smoothing kernels.",
    whyItMatters:
      "It forces transition regularization and conservation diagnostics to use the same support grammar as source residuals.",
    subjects: ["nhm2", "regional_atlas", "transition_region", "smoothing"],
    level: "diagnostic_gate",
    status: "review",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["regional_support_function_atlas", "transition_kernel_regularization"],
    tags: ["regional_atlas", "transition_support", "smoothing_kernel", "same_run"],
    equations: [
      {
        id: "transition_support_kernel_receipt",
        role: "noncomputable_reference",
        displayLatex: "K_{R\\to S}=\\mathrm{smooth}(W_R,W_S,\\Delta_{RS})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["W_R", "W_S", "transitionWidth", "kernelId"],
        outputSymbols: ["transitionKernelRef"],
      },
    ],
    units: [
      { symbol: "\\Delta_{RS}", unit: "m", quantity: "transition_width", dimensionSignature: "L" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Transition support rows are runtime references, not scalar fit knobs.",
      "Hard or private masks remain inadmissible for same-atlas closure congruence.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef("shared/contracts/nhm2-regional-support-function-atlas.v1.ts", "transitionKernels", "Canonical transition-kernel references."),
      artifactRef("shared/contracts/nhm2-regional-source-transition-kernel.v1.ts", "nhm2-regional-source-transition-kernel-contract", "Transition regularization consumer contract."),
    ],
    hintKeys: {
      subjects: ["nhm2", "regional_atlas", "transition_region", "smoothing"],
      symbols: ["K_RS", "W_R", "W_S", "transitionKernelRef"],
      unitSignatures: ["L"],
      repoPaths: [
        "shared/contracts/nhm2-regional-support-function-atlas.v1.ts",
        "shared/contracts/nhm2-regional-source-transition-kernel.v1.ts",
      ],
      equationFamilies: ["regional_support_function_atlas", "transition_kernel_regularization"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.regional_atlas.derivative_support",
    title: "Atlas Derivative Support",
    plainMeaning:
      "Tracks whether support-function derivative terms are available for covariant conservation diagnostics.",
    whyItMatters:
      "Region-shaped tensors introduce derivative terms; without this receipt, conservation can only remain review-gated or missing.",
    subjects: ["nhm2", "regional_atlas", "conservation", "derivative_support"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity"],
    equationFamilies: ["regional_support_function_atlas", "covariant_conservation"],
    tags: ["regional_atlas", "derivative_support", "covariant_conservation", "blocks_promotion"],
    equations: [
      {
        id: "support_derivative_terms_required",
        role: "constraint",
        displayLatex: "\\nabla_\\mu(W_R T_R^{\\mu\\nu})=(\\partial_\\mu W_R)T_R^{\\mu\\nu}+W_R\\nabla_\\mu T_R^{\\mu\\nu}",
        computableExpression: null,
        operatorKind: "tensor_component",
        inputSymbols: ["partial_mu_W_R", "T_R_mu_nu", "nabla_mu_T_R_mu_nu"],
        outputSymbols: ["div_T_region_shaped"],
      },
    ],
    units: [
      { symbol: "\\partial_\\mu W_R", quantity: "support_weight_derivative", dimensionSignature: "L^-1" },
      { symbol: "T_R^{\\mu\\nu}", unit: "Pa", quantity: "stress_energy", dimensionSignature: "M L^-1 T^-2" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Support derivative support is required for local conservation interpretation.",
      "Reduced-order transition smoothing does not by itself prove covariant conservation.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef("shared/contracts/nhm2-regional-support-function-atlas.v1.ts", "derivativeSupport", "Atlas derivative-support receipt."),
      artifactRef("shared/contracts/nhm2-regional-support-derivative-receipt.v1.ts", "nhm2-regional-support-derivative-receipt-contract", "Support-function partial derivative receipt consumed by the atlas generator."),
      artifactRef("shared/contracts/nhm2-tile-counterpart-conservation.v1.ts", "nhm2-tile-counterpart-conservation-contract", "Conservation consumer contract."),
    ],
    hintKeys: {
      subjects: ["nhm2", "regional_atlas", "conservation", "derivative_support"],
      symbols: ["partial_mu_W_R", "T_R_mu_nu", "div_T_region_shaped"],
      unitSignatures: ["L^-1", "M L^-1 T^-2"],
      repoPaths: [
        "shared/contracts/nhm2-regional-support-function-atlas.v1.ts",
        "shared/contracts/nhm2-regional-support-derivative-receipt.v1.ts",
        "shared/contracts/nhm2-tile-counterpart-conservation.v1.ts",
      ],
      equationFamilies: ["regional_support_function_atlas", "covariant_conservation"],
      simulationOwners: ["NHM2", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.regional_atlas.consumer_congruence",
    title: "Same-Atlas Consumer Congruence",
    plainMeaning:
      "Checks that source residual, conservation, QEI, observer, coupled closure, and claim admission artifacts reference the same atlas hash.",
    whyItMatters:
      "It makes later pass lights mean the gates evaluated the same regional geometry rather than almost-compatible sidecars.",
    subjects: ["nhm2", "regional_atlas", "consumer_congruence", "artifact_governance"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity", "casimir"],
    equationFamilies: ["regional_support_function_atlas", "same_atlas_congruence"],
    tags: ["regional_atlas", "hash_congruence", "same_run", "blocks_promotion"],
    equations: [
      {
        id: "same_atlas_hash_gate",
        role: "gate",
        displayLatex: "hash(\\mathcal{A})_{source}=hash(\\mathcal{A})_{conservation}=hash(\\mathcal{A})_{QEI}=hash(\\mathcal{A})_{observer}",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["atlasHash_source", "atlasHash_conservation", "atlasHash_qei", "atlasHash_observer"],
        outputSymbols: ["atlas_consumer_congruence_status"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Same-atlas congruence is a provenance gate and does not change residual values.",
      "Missing or stale atlas hashes block coupled closure and claim admission.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef("shared/contracts/nhm2-coupled-closure-pass-candidate.v1.ts", "atlasConsumerCongruencePass", "Coupled closure same-atlas gate."),
      artifactRef("shared/contracts/nhm2-regional-tensor-pass-path-harness.v1.ts", "atlasConsumerCongruencePass", "Regional tensor pass-path same-atlas gate."),
      artifactRef("tools/nhm2/run-reference-validation-chain.ts", "regional-support-atlas-wiring", "Reference-chain atlas consumer wiring."),
    ],
    hintKeys: {
      subjects: ["nhm2", "regional_atlas", "consumer_congruence", "artifact_governance"],
      symbols: ["atlasHash", "atlas_consumer_congruence_status"],
      unitSignatures: [],
      repoPaths: [
        "shared/contracts/nhm2-coupled-closure-pass-candidate.v1.ts",
        "shared/contracts/nhm2-regional-tensor-pass-path-harness.v1.ts",
        "tools/nhm2/run-reference-validation-chain.ts",
      ],
      equationFamilies: ["regional_support_function_atlas", "same_atlas_congruence"],
      simulationOwners: ["NHM2", "general_relativity", "casimir"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.regional_atlas.claim_boundary",
    title: "Atlas Is Not Physics Closure Boundary",
    plainMeaning:
      "Blocks treating shared regional geometry as material credibility, conservation, QEI, observer robustness, or transport viability.",
    whyItMatters:
      "It keeps atlas congruence in the correct role: a prerequisite map for proof gates, not a proof that those gates pass.",
    subjects: ["nhm2", "regional_atlas", "claim_boundary", "artifact_governance"],
    level: "claim_boundary",
    status: "blocked",
    simulationOwners: ["NHM2"],
    equationFamilies: ["regional_support_function_atlas", "nhm2_claim_boundary"],
    tags: ["regional_atlas", "claim_boundary", "diagnostic_only", "blocks_promotion"],
    equations: [
      {
        id: "atlas_not_closure_boundary",
        role: "noncomputable_reference",
        displayLatex: "\\mathcal{A}_{R}\\not\\Rightarrow\\mathrm{sourceClosure}\\land\\mathrm{physicalViability}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["atlasHash"],
        outputSymbols: ["atlas_claim_boundary"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "The atlas is the shared map consumed by downstream gates.",
      "A valid atlas cannot substitute for material receipt, conservation, QEI, observer, or residual passes.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef("shared/contracts/nhm2-regional-support-function-atlas.v1.ts", "claimBoundary", "Atlas diagnostic-only claim boundary."),
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "closure-stack-summary", "Whitepaper closure-stack claim boundary."),
    ],
    hintKeys: {
      subjects: ["nhm2", "regional_atlas", "claim_boundary", "artifact_governance"],
      symbols: ["A_R", "atlasHash", "atlas_claim_boundary"],
      unitSignatures: [],
      repoPaths: ["shared/contracts/nhm2-regional-support-function-atlas.v1.ts", NHM2_FULL_SOLVE_WHITEPAPER],
      equationFamilies: ["regional_support_function_atlas", "nhm2_claim_boundary"],
      simulationOwners: ["NHM2"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.energy_condition.wec_nec_sec_dec_family",
    title: "Observer-Family Energy-Condition Surface",
    plainMeaning: "Collects WEC, NEC, SEC, and DEC as observer-family diagnostics over the projected tensor.",
    whyItMatters:
      "It prevents a single scalar or favorable slice from being treated as clearance for the whole observer-family surface.",
    subjects: ["nhm2", "energy_conditions", "observer_family", "wec", "nec", "sec", "dec"],
    level: "diagnostic_gate",
    status: "review",
    simulationOwners: ["NHM2", "general_relativity"],
    equationFamilies: ["energy_condition_family", "observer_projection"],
    tags: ["wec", "nec", "sec", "dec", "observer_family", "review_gated"],
    equations: [
      {
        id: "energy_condition_family_gate",
        role: "gate",
        displayLatex: "\\mathrm{EC}_{family}=\\{WEC,NEC,SEC,DEC\\}_{observer\\ family}",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["E", "J_i", "S_ij", "observer_family"],
        outputSymbols: ["EC_family_status"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Energy-condition status is observer-family evidence, not a binary pass.",
      "A projected scalar does not clear all observer-family conditions.",
      "Missing momentum or spatial-stress authority blocks promotion-sensitive language.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "observer-energy-condition-gates", "Whitepaper observer gate section."),
      equationMapRef("energy_condition_family", "Observable equation map node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "energy_conditions", "observer_family", "wec", "nec", "sec", "dec"],
      symbols: ["E", "J_i", "S_ij", "observer_family", "EC_family_status"],
      unitSignatures: ["M L^-1 T^-2"],
      repoPaths: [NHM2_FULL_SOLVE_WHITEPAPER, NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["energy_condition_family", "observer_projection"],
      simulationOwners: ["NHM2", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.energy_condition.observer_robust_gate",
    title: "Observer-Robust Energy-Condition Gate",
    plainMeaning:
      "Records whether WEC, NEC, DEC, and SEC were checked beyond a single Eulerian observer frame.",
    whyItMatters:
      "It prevents favorable Eulerian-frame language from being promoted into observer-robust energy-condition claims.",
    subjects: ["nhm2", "energy_conditions", "observer_robust", "wec", "nec"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity"],
    equationFamilies: ["observer_robust_energy_conditions", "energy_condition_family"],
    tags: ["observer_robust", "eulerian_only_boundary", "wec", "nec", "blocks_promotion"],
    equations: [
      {
        id: "observer_robust_energy_condition_gate",
        role: "gate",
        displayLatex:
          "\\mathrm{EC}_{robust}=\\{WEC,NEC,DEC,SEC\\}_{observer\\ families}",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["T_mu_nu", "observer_family", "WEC", "NEC", "DEC", "SEC"],
        outputSymbols: ["observer_robust_ec_status"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Eulerian-only checks must be labeled as restricted observer-frame evidence.",
      "Continuous optimization is not represented unless a runtime adapter exists.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef("shared/contracts/nhm2-observer-robust-energy-conditions.v1.ts", "nhm2-observer-robust-energy-conditions-contract", "Typed observer-family EC contract."),
      equationMapRef("energy_condition_family", "Observable equation map node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "energy_conditions", "observer_robust", "wec", "nec"],
      symbols: ["T_mu_nu", "observer_family", "WEC", "NEC", "DEC", "SEC", "observer_robust_ec_status"],
      unitSignatures: ["M L^-1 T^-2"],
      repoPaths: ["shared/contracts/nhm2-observer-robust-energy-conditions.v1.ts", NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["observer_robust_energy_conditions", "energy_condition_family"],
      simulationOwners: ["NHM2", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.qei.worldline_sampling_requirement",
    title: "QEI Worldline Sampling Requirement",
    plainMeaning: "Records the weighted worldline stress-energy sampling requirement for a QEI dossier.",
    whyItMatters:
      "It keeps QEI discussion tied to an explicit sampling requirement instead of treating literature context as repository completion.",
    subjects: ["nhm2", "qei", "worldline_sampling", "stress_energy", "blocked"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity"],
    equationFamilies: ["qei_worldline_sampling", "stress_energy_sampling"],
    tags: ["qei", "worldline_integral", "blocked", "dossier_requirement"],
    equations: [
      {
        id: "qei_worldline_stress_energy_sampling",
        role: "constraint",
        displayLatex: "\\int f(\\tau)T_{\\mu\\nu}u^\\mu u^\\nu d\\tau",
        computableExpression: null,
        operatorKind: "worldline_integral",
        inputSymbols: ["f_tau", "T_mu_nu", "u^mu", "tau"],
        outputSymbols: ["qei_worldline_sample"],
      },
    ],
    units: [
      { symbol: "qei_worldline_sample", quantity: "weighted_stress_energy_integral", dimensionSignature: "M L^-1 T^-1" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "This is a dossier requirement, not a completed QEI comparison.",
      "QEI literature constrains the route but does not complete repository evidence.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "qei-reproducibility-limits", "QEI blocker context."),
      equationMapRef("qei_sampling_requirement", "Observable equation map node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "qei", "worldline_sampling", "stress_energy", "blocked"],
      symbols: ["f_tau", "T_mu_nu", "u^mu", "tau", "qei_worldline_sample"],
      unitSignatures: ["M L^-1 T^-1"],
      repoPaths: [NHM2_FULL_SOLVE_WHITEPAPER, NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["qei_worldline_sampling", "stress_energy_sampling"],
      simulationOwners: ["NHM2", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.qei.worldline_dossier",
    title: "QEI Worldline Dossier",
    plainMeaning:
      "Requires worldlines, sampling functions, sampled rho source, bound provenance, duty consistency, and regional margins.",
    whyItMatters:
      "It keeps QEI status as an evidence dossier instead of a scalar badge or literature citation shortcut.",
    subjects: ["nhm2", "qei", "worldline_dossier", "sampling", "provenance"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity"],
    equationFamilies: ["qei_worldline_dossier", "stress_energy_sampling"],
    tags: ["qei", "worldline", "dossier_requirement", "provenance", "blocks_promotion"],
    equations: [
      {
        id: "qei_dossier_gate",
        role: "gate",
        displayLatex:
          "\\mathrm{QEI}_{dossier}=worldline\\land f(\\tau)\\land \\rho_{source}\\land bound\\land margin_R",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["worldline", "f_tau", "rho_source", "qei_bound", "regional_margin"],
        outputSymbols: ["qei_dossier_status"],
      },
    ],
    units: [
      { symbol: "rho_source", unit: "J/m^3", quantity: "sampled_density_source", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "regional_margin", unit: "J/m^3", quantity: "qei_regional_margin", dimensionSignature: "M L^-1 T^-2" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "QEI dossier status remains blocked until every provenance and sampling field is attached.",
      "A scalar margin cannot stand in for worldline and operator-mapping evidence.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "qei-reproducibility-limits", "QEI blocker context."),
      artifactRef("shared/contracts/nhm2-qei-worldline-dossier.v1.ts", "nhm2-qei-worldline-dossier-contract", "Typed QEI worldline dossier contract."),
      equationMapRef("qei_sampling_requirement", "Observable equation map node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "qei", "worldline_dossier", "sampling", "provenance"],
      symbols: ["worldline", "f_tau", "rho_source", "qei_bound", "regional_margin", "qei_dossier_status"],
      unitSignatures: ["M L^-1 T^-2"],
      repoPaths: [NHM2_FULL_SOLVE_WHITEPAPER, "shared/contracts/nhm2-qei-worldline-dossier.v1.ts", NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["qei_worldline_dossier", "stress_energy_sampling"],
      simulationOwners: ["NHM2", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.natario.curvature_invariants",
    title: "Natario Curvature Invariants",
    plainMeaning:
      "Names Weyl, Ricci, Petrov-class, scalar-invariant, and momentum-density diagnostics as explicit runtime targets.",
    whyItMatters:
      "It prevents expansion-free Natario-adjacent language from outrunning curvature and momentum-density evidence.",
    subjects: ["nhm2", "natario", "curvature_invariants", "petrov", "momentum_density"],
    level: "diagnostic_gate",
    status: "review",
    simulationOwners: ["NHM2", "general_relativity"],
    equationFamilies: ["natario_curvature_invariants", "observer_projection"],
    tags: ["natario", "weyl", "ricci", "petrov", "momentum_density", "runtime_target"],
    equations: [
      {
        id: "natario_invariant_dossier",
        role: "gate",
        displayLatex: "\\mathrm{Natario}_{audit}=C_{abcd}C^{abcd}\\land R_{ab}R^{ab}\\land Petrov\\land J_i",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["Weyl2", "Ricci2", "PetrovClass", "J_i"],
        outputSymbols: ["natario_invariant_status"],
      },
    ],
    units: [
      { symbol: "Weyl2", quantity: "weyl_scalar_invariant", dimensionSignature: "L^-4" },
      { symbol: "Ricci2", quantity: "ricci_scalar_invariant", dimensionSignature: "L^-4" },
      { symbol: "J_i", unit: "J/m^3", quantity: "momentum_density_projection", dimensionSignature: "M L^-1 T^-2" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Natario-family context does not imply viability or promotion.",
      "Curvature invariants and momentum-density channels are runtime targets, not completed certification evidence.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "literature-context", "Natario-adjacent literature context."),
      equationMapRef("momentum_density", "Momentum projection node."),
      equationMapRef("curvature_invariants", "Curvature invariant target node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "natario", "curvature_invariants", "petrov", "momentum_density"],
      symbols: ["Weyl2", "Ricci2", "PetrovClass", "J_i", "natario_invariant_status"],
      unitSignatures: ["L^-4", "M L^-1 T^-2"],
      repoPaths: [NHM2_FULL_SOLVE_WHITEPAPER, NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["natario_curvature_invariants", "observer_projection"],
      simulationOwners: ["NHM2", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.natario.invariant_audit",
    title: "Natario Invariant Audit",
    plainMeaning:
      "Tracks zero-expansion status separately from curvature invariants, Petrov class, momentum density, tidal, blueshift, and convergence diagnostics.",
    whyItMatters:
      "It prevents theta-flat or zero-expansion rows from being treated as curvature, stability, or safety certificates.",
    subjects: ["nhm2", "natario", "invariant_audit", "curvature_invariants", "stability"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["NHM2", "general_relativity"],
    equationFamilies: ["natario_invariant_audit", "observer_projection"],
    tags: ["natario", "zero_expansion_boundary", "petrov", "momentum_density", "stability"],
    equations: [
      {
        id: "natario_invariant_audit_gate",
        role: "gate",
        displayLatex:
          "\\mathrm{Natario}_{invariant}=\\theta\\land R\\land K\\land C^2\\land Petrov\\land J_i\\land stability",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["theta", "R", "Kretschmann", "WeylProxy", "PetrovClass", "J_i", "tidalMax", "blueshiftMax"],
        outputSymbols: ["natario_invariant_audit_status"],
      },
    ],
    units: [
      { symbol: "theta", quantity: "expansion", dimensionSignature: "T^-1" },
      { symbol: "Kretschmann", quantity: "curvature_invariant", dimensionSignature: "L^-4" },
      { symbol: "J_i", unit: "J/m^3", quantity: "momentum_density_projection", dimensionSignature: "M L^-1 T^-2" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Zero expansion is displayed separately and is not a safety certificate.",
      "Missing invariants, momentum density, or stability diagnostics keep the audit blocked or review-gated.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef("shared/contracts/nhm2-natario-invariant-audit.v1.ts", "nhm2-natario-invariant-audit-contract", "Typed Natario invariant audit contract."),
      equationMapRef("curvature_invariants", "Curvature invariant target node."),
      equationMapRef("momentum_density", "Momentum projection node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "natario", "invariant_audit", "curvature_invariants", "stability"],
      symbols: ["theta", "R", "Kretschmann", "WeylProxy", "PetrovClass", "J_i", "tidalMax", "blueshiftMax"],
      unitSignatures: ["T^-1", "L^-4", "M L^-1 T^-2"],
      repoPaths: ["shared/contracts/nhm2-natario-invariant-audit.v1.ts", NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["natario_invariant_audit", "observer_projection"],
      simulationOwners: ["NHM2", "general_relativity"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.clock.centerline_tau_alpha_T",
    title: "Centerline Clocking Target",
    plainMeaning: "Computes the selected-profile centerline proper-time target from lapse and coordinate duration.",
    whyItMatters:
      "It makes the whitepaper clocking relation calculator-loadable while blocking route, speed, and ETA interpretations.",
    subjects: ["nhm2", "clocking", "centerline", "lapse", "proper_time"],
    level: "derived_relation",
    status: "diagnostic",
    simulationOwners: ["NHM2"],
    equationFamilies: ["centerline_clocking_target", "lapse_shift_profile"],
    tags: ["clocking_target", "calculator_loadable", "claim_boundary"],
    equations: [
      {
        id: "centerline_clocking_target",
        role: "calculator_demo",
        displayLatex: "\\tau=\\alpha_{centerline}T",
        computableExpression: "tau = alpha_centerline*T_coordinate",
        operatorKind: "scalar_expression",
        inputSymbols: ["alpha_centerline", "T_coordinate"],
        outputSymbols: ["tau"],
      },
    ],
    units: [
      { symbol: "alpha_centerline", unit: null, quantity: "centerline_lapse", dimensionSignature: "1" },
      { symbol: "T_coordinate", unit: "s", quantity: "coordinate_duration", dimensionSignature: "T" },
      { symbol: "tau", unit: "s", quantity: "proper_time_target", dimensionSignature: "T" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "This is a selected-profile clocking-law target under frozen coordinate schedule assumptions.",
      "It is not a speed, route ETA, or full-loop certified pass.",
      "Lower-alpha profiles require their own repository-measured full-loop artifacts.",
    ],
    calculatorPayloads: [
      payload({
        id: "centerline_clocking_target_payload",
        expression: "tau = alpha_centerline*T_coordinate",
        displayLatex: "\\tau=\\alpha_{centerline}T",
        targetVariable: "tau",
      }),
    ],
    sourceRefs: [
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "centerline-lapse-clocking", "Selected centerline clocking relation."),
      equationMapRef("alpha_lapse", "Lapse observable node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "clocking", "centerline", "lapse", "proper_time"],
      symbols: ["alpha_centerline", "T_coordinate", "tau"],
      unitSignatures: ["1", "T"],
      repoPaths: [NHM2_FULL_SOLVE_WHITEPAPER, NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["centerline_clocking_target", "lapse_shift_profile"],
      simulationOwners: ["NHM2"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.clock.twin_paradox_trip_clocking",
    title: "Twin Paradox Trip Clocking Diagnostic",
    plainMeaning:
      "Computes one-way and mirrored round-trip ship-clock accumulation from the bounded NHM2 lapse schedule.",
    whyItMatters:
      "It gives readers a Twin Paradox clock comparison while keeping speed, route ETA, and physical viability claims blocked.",
    subjects: ["nhm2", "clocking", "twin_paradox", "proper_time", "lapse"],
    level: "derived_relation",
    status: "diagnostic",
    simulationOwners: ["NHM2"],
    equationFamilies: ["trip_clocking_diagnostic", "centerline_clocking_target"],
    tags: ["trip_clocking", "twin_paradox", "analogy_only", "claim_boundary"],
    equations: [
      {
        id: "trip_clocking_one_way_tau",
        role: "calculator_demo",
        displayLatex: "\\tau=\\alpha_{centerline}T_{coordinate}",
        computableExpression: "tau = alpha_centerline*T_coordinate",
        operatorKind: "scalar_expression",
        inputSymbols: ["alpha_centerline", "T_coordinate"],
        outputSymbols: ["tau"],
      },
      {
        id: "trip_clocking_saved_days",
        role: "calculator_demo",
        displayLatex:
          "\\mathrm{savedDays}=(1-\\alpha_{centerline})T_{coordinate}/86400",
        computableExpression:
          "saved_days = (1-alpha_centerline)*T_coordinate/86400",
        operatorKind: "scalar_expression",
        inputSymbols: ["alpha_centerline", "T_coordinate"],
        outputSymbols: ["saved_days"],
      },
      {
        id: "trip_clocking_round_trip_saved_days",
        role: "calculator_demo",
        displayLatex:
          "\\mathrm{roundTripSavedDays}=2\\,\\mathrm{savedDays}",
        computableExpression: "round_trip_saved_days = 2*saved_days",
        operatorKind: "scalar_expression",
        inputSymbols: ["saved_days"],
        outputSymbols: ["round_trip_saved_days"],
      },
      {
        id: "trip_clocking_sr_beta_analogy",
        role: "calculator_demo",
        displayLatex:
          "\\beta_{SR,analogy}=\\sqrt{1-\\alpha_{centerline}^{2}}",
        computableExpression:
          "beta_sr_analogy = sqrt(1-alpha_centerline^2)",
        operatorKind: "scalar_expression",
        inputSymbols: ["alpha_centerline"],
        outputSymbols: ["beta_sr_analogy"],
      },
    ],
    units: [
      { symbol: "alpha_centerline", unit: null, quantity: "centerline_lapse", dimensionSignature: "1" },
      { symbol: "T_coordinate", unit: "s", quantity: "coordinate_duration", dimensionSignature: "T" },
      { symbol: "tau", unit: "s", quantity: "ship_proper_time", dimensionSignature: "T" },
      { symbol: "saved_days", unit: "d", quantity: "ship_younger_by_days", dimensionSignature: "T" },
      {
        symbol: "beta_sr_analogy",
        unit: null,
        quantity: "sr_equivalent_beta_analogy_only",
        dimensionSignature: "1",
      },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "This extends the centerline clocking target without replacing it.",
      "The ordinary Twin Paradox comparison is used only as a clocking analogy.",
      "The SR-equivalent beta is an analogy for the same clock ratio, not a ship speed.",
      "Route ETA, max speed, propulsion, physical viability, and lower-alpha promotion remain blocked.",
    ],
    calculatorPayloads: [
      payload({
        id: "trip_clocking_tau_payload",
        expression: "tau = alpha_centerline*T_coordinate",
        displayLatex: "\\tau=\\alpha_{centerline}T_{coordinate}",
        targetVariable: "tau",
      }),
      payload({
        id: "trip_clocking_saved_days_payload",
        expression: "saved_days = (1-alpha_centerline)*T_coordinate/86400",
        displayLatex:
          "\\mathrm{savedDays}=(1-\\alpha_{centerline})T_{coordinate}/86400",
        targetVariable: "saved_days",
      }),
      payload({
        id: "trip_clocking_round_trip_saved_days_payload",
        expression: "round_trip_saved_days = 2*saved_days",
        displayLatex: "\\mathrm{roundTripSavedDays}=2\\,\\mathrm{savedDays}",
        targetVariable: "round_trip_saved_days",
      }),
      payload({
        id: "trip_clocking_sr_beta_analogy_payload",
        expression: "beta_sr_analogy = sqrt(1-alpha_centerline^2)",
        displayLatex:
          "\\beta_{SR,analogy}=\\sqrt{1-\\alpha_{centerline}^{2}}",
        targetVariable: "beta_sr_analogy",
      }),
    ],
    sourceRefs: [
      docRef(
        NHM2_FULL_SOLVE_WHITEPAPER,
        "twin-paradox-trip-clocking-interpretation",
        "Twin Paradox clocking interpretation section.",
      ),
      artifactRef(
        "shared/contracts/nhm2-trip-clocking-diagnostic.v1.ts",
        "nhm2-trip-clocking-diagnostic-contract",
        "Trip clocking diagnostic contract.",
      ),
      artifactRef(
        NHM2_TRIP_CLOCKING_PROFILE_INDEX,
        "nhm2-trip-clocking-profile-index-latest",
        "Profile-scoped 0p995 / 0p7000 trip clocking index.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "clocking", "twin_paradox", "proper_time", "lapse"],
      symbols: [
        "alpha_centerline",
        "T_coordinate",
        "tau",
        "saved_days",
        "round_trip_saved_days",
        "beta_sr_analogy",
      ],
      unitSignatures: ["1", "T"],
      repoPaths: [
        NHM2_FULL_SOLVE_WHITEPAPER,
        "shared/contracts/nhm2-trip-clocking-diagnostic.v1.ts",
        NHM2_TRIP_CLOCKING_PROFILE_INDEX,
      ],
      equationFamilies: ["trip_clocking_diagnostic", "centerline_clocking_target"],
      simulationOwners: ["NHM2"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.clock.trip_clocking_profile_index",
    title: "Trip Clocking Profile Index",
    plainMeaning:
      "Indexes coherent profile-scoped trip clocking diagnostics for the 0p995 anchor and 0p7000 frontier target.",
    whyItMatters:
      "It lets the theory graph display both profiles without treating latest aliases as cross-profile evidence.",
    subjects: ["nhm2", "clocking", "profile_index", "proper_time", "artifact_governance"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["NHM2"],
    equationFamilies: ["trip_clocking_profile_index", "artifact_governance"],
    tags: ["trip_clocking", "profile_scoped", "latest_alias_boundary", "noncomputable_runtime_reference"],
    equations: [
      {
        id: "trip_clocking_profile_index_gate",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{index}=\\{\\mathrm{profileScopedDiagnostics}\\}\\;\\not\\Rightarrow\\;\\mathrm{routeCertification}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["profileScopedDiagnostics", "profileId", "artifactRefs"],
        outputSymbols: ["tripClockingProfileIndex"],
      },
    ],
    units: [
      { symbol: "alpha_centerline", unit: null, quantity: "centerline_lapse", dimensionSignature: "1" },
      { symbol: "shipProperYears", unit: "yr", quantity: "ship_proper_time", dimensionSignature: "T" },
      { symbol: "shipYoungerByDays", unit: "d", quantity: "ship_clock_difference", dimensionSignature: "T" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "0p995 remains the canonical white-paper clocking anchor.",
      "0p7000 can be displayed as a frontier clocking target without profile promotion.",
      "Each row must come from its own coherent route-time, mission-estimator, and mission-comparison artifacts.",
      "The profile index is artifact navigation and comparison context, not a calculator formula.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(
        NHM2_FULL_SOLVE_WHITEPAPER,
        "twin-paradox-trip-clocking-interpretation",
        "Whitepaper section that keeps trip clocking diagnostic-only.",
      ),
      artifactRef(
        "shared/contracts/nhm2-trip-clocking-profile-index.v1.ts",
        "nhm2-trip-clocking-profile-index-contract",
        "Typed profile-scoped trip clocking index contract.",
      ),
      artifactRef(
        NHM2_TRIP_CLOCKING_PROFILE_INDEX,
        "nhm2-trip-clocking-profile-index-latest",
        "Generated 0p995 / 0p7000 profile index artifact.",
      ),
    ],
    hintKeys: {
      subjects: ["nhm2", "clocking", "profile_index", "proper_time", "artifact_governance"],
      symbols: ["profileScopedDiagnostics", "profileId", "alpha_centerline", "shipProperYears", "shipYoungerByDays"],
      unitSignatures: ["1", "T"],
      repoPaths: [
        NHM2_FULL_SOLVE_WHITEPAPER,
        "shared/contracts/nhm2-trip-clocking-profile-index.v1.ts",
        NHM2_TRIP_CLOCKING_PROFILE_INDEX,
      ],
      equationFamilies: ["trip_clocking_profile_index", "artifact_governance"],
      simulationOwners: ["NHM2"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.artifact.frozen_reference_run_provenance",
    title: "Frozen Reference-Run Provenance",
    plainMeaning: "Names the run, hash, grid, seed, ledger, and convergence evidence needed to interpret full-solve artifacts.",
    whyItMatters:
      "It keeps figure and solver outputs attached to reproducible artifact governance instead of answer-like summaries.",
    subjects: ["nhm2", "artifact_governance", "reference_run", "convergence", "reproducibility"],
    level: "diagnostic_gate",
    status: "review",
    simulationOwners: ["NHM2"],
    equationFamilies: ["reference_run_provenance", "convergence_reproducibility"],
    tags: ["reference_run", "provenance", "hash", "convergence", "review_gated"],
    equations: [
      {
        id: "frozen_reference_run_provenance",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{referenceRun}=\\mathrm{hashes}+\\mathrm{grid}+\\mathrm{seed}+\\mathrm{artifactLedger}+\\mathrm{convergence}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["hashes", "grid", "seed", "artifactLedger", "convergence"],
        outputSymbols: ["referenceRun"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Figures are not acceptance evidence unless source run, hashes, and convergence status are auditable.",
      "Artifact governance reports status and blockers; it cannot promote physical mechanism claims.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(NHM2_OBSERVABLE_FIGURE_PLAN, "convergence-reproducibility", "Figure-plan reproducibility surface."),
      artifactRef(NHM2_FULL_SOLVE_REFERENCE_CAPSULE, "full-solve-reference-capsule", "Reference capsule status."),
      docRef(NHM2_PROOF_ANCHOR_INDEX, "proof-anchor-index", "Proof anchor and regeneration command index."),
      equationMapRef("convergence_reproducibility", "Observable equation map node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "artifact_governance", "reference_run", "convergence", "reproducibility"],
      symbols: ["referenceRun", "hashes", "grid", "seed", "artifactLedger", "convergence"],
      unitSignatures: [],
      repoPaths: [
        NHM2_OBSERVABLE_FIGURE_PLAN,
        NHM2_FULL_SOLVE_REFERENCE_CAPSULE,
        NHM2_PROOF_ANCHOR_INDEX,
        NHM2_OBSERVABLE_EQUATION_MAP,
      ],
      equationFamilies: ["reference_run_provenance", "convergence_reproducibility"],
      simulationOwners: ["NHM2"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.claim_boundary.shift_not_ship_speed",
    title: "Shift Is Not Ship Speed Boundary",
    plainMeaning: "Blocks treating the chart-dependent shift field as ordinary vehicle velocity.",
    whyItMatters: "It protects NHM2 prompts from turning geometry bookkeeping into route or transport claims.",
    subjects: ["nhm2", "claim_boundary", "shift", "speed_boundary", "geometry"],
    level: "claim_boundary",
    status: "blocked",
    simulationOwners: ["NHM2"],
    equationFamilies: ["nhm2_claim_boundary"],
    tags: ["claim_boundary", "shift_boundary", "blocks_promotion"],
    equations: [
      {
        id: "shift_not_speed_boundary",
        role: "noncomputable_reference",
        displayLatex: "\\beta^i\\neq v_{ordinary}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["beta_i"],
        outputSymbols: ["shift_speed_boundary"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Shift is a chart-dependent transport descriptor, not ordinary ship speed.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "local-transport-descriptor-not-speed", "Shift boundary discussion."),
      equationMapRef("beta_shift", "Shift observable node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "claim_boundary", "shift", "speed_boundary", "geometry"],
      symbols: ["beta_i", "shift_speed_boundary"],
      unitSignatures: ["L T^-1"],
      repoPaths: [NHM2_FULL_SOLVE_WHITEPAPER, NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["nhm2_claim_boundary"],
      simulationOwners: ["NHM2"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.claim_boundary.diagonal_proxy_not_full_tensor",
    title: "Diagonal Proxy Is Not Full Tensor Boundary",
    plainMeaning: "Blocks treating diagonal stress-energy bookkeeping as full observer tensor authority.",
    whyItMatters:
      "It forces momentum-density and spatial-stress channels back into the trace before any observer-family interpretation.",
    subjects: ["nhm2", "claim_boundary", "diagonal_proxy", "full_tensor", "observer"],
    level: "claim_boundary",
    status: "blocked",
    simulationOwners: ["NHM2"],
    equationFamilies: ["nhm2_claim_boundary", "observer_projection"],
    tags: ["claim_boundary", "diagonal_proxy_boundary", "blocks_promotion"],
    equations: [
      {
        id: "diagonal_proxy_not_full_tensor",
        role: "noncomputable_reference",
        displayLatex: "T_{00}^{proxy}\\not\\Rightarrow\\{E,J_i,S_{ij}\\}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["T00_proxy"],
        outputSymbols: ["full_tensor_boundary"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Diagonal T00 or diagonal tensor proxy is not full observer tensor authority.",
      "Full observer interpretation requires same-chart E, J_i, and S_ij projection authority.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "why-diagonal-only-was-insufficient", "Diagonal-only limitation."),
      equationMapRef("momentum_density", "Momentum projection boundary."),
      equationMapRef("spatial_stress", "Spatial-stress projection boundary."),
    ],
    hintKeys: {
      subjects: ["nhm2", "claim_boundary", "diagonal_proxy", "full_tensor", "observer"],
      symbols: ["T00_proxy", "E", "J_i", "S_ij", "full_tensor_boundary"],
      unitSignatures: ["M L^-1 T^-2"],
      repoPaths: [NHM2_FULL_SOLVE_WHITEPAPER, NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["nhm2_claim_boundary", "observer_projection"],
      simulationOwners: ["NHM2"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.claim_boundary.expected_clocking_not_route_result",
    title: "Clocking Target Is Not Route Result Boundary",
    plainMeaning: "Blocks treating the centerline lapse clocking target as a route result, ETA, or transport certification.",
    whyItMatters:
      "It keeps tau = alpha T in its proper role as a selected-profile timing calculation under frozen schedule assumptions.",
    subjects: ["nhm2", "claim_boundary", "clocking", "route_boundary", "proper_time"],
    level: "claim_boundary",
    status: "blocked",
    simulationOwners: ["NHM2"],
    equationFamilies: ["nhm2_claim_boundary", "centerline_clocking_target"],
    tags: ["claim_boundary", "clocking_boundary", "blocks_promotion"],
    equations: [
      {
        id: "clocking_target_not_route_result",
        role: "noncomputable_reference",
        displayLatex: "\\tau=\\alpha T\\not\\Rightarrow\\mathrm{routeResult}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["tau", "alpha", "T"],
        outputSymbols: ["clocking_route_boundary"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "tau = alpha T is a clocking target, not a route result or ETA.",
      "Lower-alpha rows remain targets until their own repository-measured artifacts pass.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "centerline-lapse-clocking", "Clocking target boundary."),
      equationMapRef("alpha_lapse", "Lapse observable node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "claim_boundary", "clocking", "route_boundary", "proper_time"],
      symbols: ["tau", "alpha", "T", "clocking_route_boundary"],
      unitSignatures: ["1", "T"],
      repoPaths: [NHM2_FULL_SOLVE_WHITEPAPER, NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["nhm2_claim_boundary", "centerline_clocking_target"],
      simulationOwners: ["NHM2"],
    },
  }),
  nhm2FullSolveBadge({
    id: "nhm2.claim_boundary.literature_not_validation",
    title: "Literature Is Context Boundary",
    plainMeaning: "Blocks external papers from being treated as NHM2 artifact validation.",
    whyItMatters:
      "It preserves the whitepaper rule that papers provide formalism, constraints, and caution while repository artifacts define NHM2 row status.",
    subjects: ["nhm2", "claim_boundary", "literature", "validation_boundary", "provenance"],
    level: "claim_boundary",
    status: "blocked",
    simulationOwners: ["NHM2"],
    equationFamilies: ["nhm2_claim_boundary", "literature_context"],
    tags: ["claim_boundary", "literature_boundary", "blocks_promotion"],
    equations: [
      {
        id: "literature_context_not_validation",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{literature}=\\mathrm{formalism/context/limits}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["literature_context"],
        outputSymbols: ["literature_boundary"],
      },
    ],
    units: [],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "External literature supplies formalism, context, and limitations, not NHM2 validation.",
      "Repository artifacts define pass, review, blocked, and unsupported status.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(NHM2_FULL_SOLVE_WHITEPAPER, "why-literature-context-is-not-validation", "Literature role boundary."),
      docRef(NHM2_OBSERVABLE_FIGURE_PLAN, "claim-boundary", "Observable figure claim boundary."),
      equationMapRef("claim_locks", "Claim-lock node."),
    ],
    hintKeys: {
      subjects: ["nhm2", "claim_boundary", "literature", "validation_boundary", "provenance"],
      symbols: ["literature_context", "literature_boundary"],
      unitSignatures: [],
      repoPaths: [NHM2_FULL_SOLVE_WHITEPAPER, NHM2_OBSERVABLE_FIGURE_PLAN, NHM2_OBSERVABLE_EQUATION_MAP],
      equationFamilies: ["nhm2_claim_boundary", "literature_context"],
      simulationOwners: ["NHM2"],
    },
  }),
];

export const NHM2_FULL_SOLVE_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "adm_specializes_eulerian_normal",
    from: "physics.gr.3p1_decomposition",
    to: "nhm2.observer.eulerian_normal",
    relation: "specializes",
    label: "The 3+1 lapse-shift grammar defines the Eulerian normal observer field.",
    claimBoundaryNote: "Observer bookkeeping is same-chart geometry, not transport validation.",
  },
  {
    id: "adm_requires_same_chart_full_tensor",
    from: "physics.gr.3p1_decomposition",
    to: "nhm2.tensor.same_chart_full_tensor",
    relation: "requires",
    label: "The 3+1 decomposition supplies the ADM variables required by the same-chart full tensor artifact.",
    claimBoundaryNote: "ADM bookkeeping is component provenance, not source validation.",
  },
  {
    id: "efe_specializes_metric_required_tensor",
    from: "physics.gr.einstein_field_equation",
    to: "nhm2.tensor.metric_required_stress_energy",
    relation: "specializes",
    label: "The Einstein equation supplies the metric-required stress-energy route in geometric units.",
    claimBoundaryNote: "Metric-required tensor authority is not a source-side mechanism claim.",
  },
  {
    id: "eulerian_normal_requires_energy_projection",
    from: "nhm2.observer.eulerian_normal",
    to: "nhm2.observer.energy_density_projection",
    relation: "requires",
    label: "Observer energy density requires the declared Eulerian normal.",
    claimBoundaryNote: "Projection evidence remains observer-family diagnostic context.",
  },
  {
    id: "metric_tensor_requires_observer_energy",
    from: "nhm2.tensor.metric_required_stress_energy",
    to: "nhm2.observer.energy_density_projection",
    relation: "requires",
    label: "Metric-required tensor components feed observer energy-density projection.",
    claimBoundaryNote: "Projected E is not energy-condition clearance.",
  },
  {
    id: "metric_tensor_requires_momentum_projection",
    from: "nhm2.tensor.metric_required_stress_energy",
    to: "nhm2.observer.momentum_density_projection",
    relation: "requires",
    label: "Full observer authority requires momentum-density channels.",
    claimBoundaryNote: "Diagonal-only evidence blocks promotion-sensitive language.",
  },
  {
    id: "metric_tensor_requires_spatial_stress_projection",
    from: "nhm2.tensor.metric_required_stress_energy",
    to: "nhm2.observer.spatial_stress_projection",
    relation: "requires",
    label: "Full observer authority requires spatial-stress channels.",
    claimBoundaryNote: "Off-diagonal authority remains review-gated unless evidenced.",
  },
  {
    id: "observer_energy_feeds_full_tensor_authority",
    from: "nhm2.observer.energy_density_projection",
    to: "nhm2.tensor.full_authority_gate",
    relation: "requires",
    label: "Full tensor authority includes the observer energy-density channel.",
    claimBoundaryNote: "Energy-density projection alone is not full tensor authority.",
  },
  {
    id: "observer_momentum_feeds_full_tensor_authority",
    from: "nhm2.observer.momentum_density_projection",
    to: "nhm2.tensor.full_authority_gate",
    relation: "requires",
    label: "Full tensor authority requires momentum-density channels.",
    claimBoundaryNote: "Missing J_i channels keep observer promotion blocked.",
  },
  {
    id: "observer_spatial_stress_feeds_full_tensor_authority",
    from: "nhm2.observer.spatial_stress_projection",
    to: "nhm2.tensor.full_authority_gate",
    relation: "requires",
    label: "Full tensor authority requires diagonal and off-diagonal spatial stress.",
    claimBoundaryNote: "Missing off-diagonal S_ij channels keep observer promotion blocked.",
  },
  {
    id: "same_chart_full_tensor_feeds_wall_t00_source_residual",
    from: "nhm2.tensor.same_chart_full_tensor",
    to: "nhm2.closure.wall_t00_source_residual",
    relation: "requires",
    label: "Wall T00 closure reads the metric-required component status from the same-chart full tensor artifact.",
    claimBoundaryNote: "Missing tensor components cannot be treated as zero in wall closure.",
  },
  {
    id: "same_chart_full_tensor_feeds_observer_robust_gate",
    from: "nhm2.tensor.same_chart_full_tensor",
    to: "nhm2.energy_condition.observer_robust_gate",
    relation: "requires",
    label: "Observer-robust energy-condition checks require the same-chart tensor component surface.",
    claimBoundaryNote: "Eulerian-only or component-incomplete checks cannot become observer-robust passes.",
  },
  {
    id: "same_chart_full_tensor_context_feeds_source_side_authority",
    from: "nhm2.tensor.same_chart_full_tensor",
    to: "nhm2.source.same_basis_tensor_authority",
    relation: "requires",
    label: "Source-side tensor authority must align with the same-chart tensor component surface.",
    claimBoundaryNote: "Same-chart geometry evidence does not itself create source-side authority.",
  },
  {
    id: "same_chart_full_tensor_feeds_regional_atlas",
    from: "nhm2.tensor.same_chart_full_tensor",
    to: "nhm2.regional_atlas.available",
    relation: "requires",
    label: "The regional atlas is meaningful only for the same run, chart, profile, and tensor basis used by full tensor artifacts.",
    claimBoundaryNote: "Atlas identity is provenance alignment, not source validation.",
  },
  {
    id: "regional_atlas_requires_partition_of_unity",
    from: "nhm2.regional_atlas.available",
    to: "nhm2.regional_atlas.partition_of_unity",
    relation: "requires",
    label: "Atlas availability includes a declared partition policy for closure-region support weights.",
    claimBoundaryNote: "Partition consistency does not prove physical closure.",
  },
  {
    id: "regional_atlas_partition_feeds_transition_supports",
    from: "nhm2.regional_atlas.partition_of_unity",
    to: "nhm2.regional_atlas.transition_supports",
    relation: "requires",
    label: "Transition supports sit between the declared regional support functions.",
    claimBoundaryNote: "Transition support rows are smoothing provenance, not residual tuning.",
  },
  {
    id: "regional_atlas_transition_requires_derivative_support",
    from: "nhm2.regional_atlas.transition_supports",
    to: "nhm2.regional_atlas.derivative_support",
    relation: "requires",
    label: "Transition smoothing introduces support-function derivative terms for conservation diagnostics.",
    claimBoundaryNote: "Derivative availability is required before conservation can be interpreted strongly.",
  },
  {
    id: "regional_atlas_available_feeds_consumer_congruence",
    from: "nhm2.regional_atlas.available",
    to: "nhm2.regional_atlas.consumer_congruence",
    relation: "requires",
    label: "All downstream artifacts must reference the same atlas hash before coupled closure is admissible.",
    claimBoundaryNote: "Hash congruence is a provenance gate, not a physics pass.",
  },
  {
    id: "tile_counterpart_feeds_source_side_authority",
    from: "nhm2.tensor.tile_effective_counterpart",
    to: "nhm2.source.same_basis_tensor_authority",
    relation: "requires",
    label: "The tile-effective counterpart is an input to source-side same-basis tensor authority.",
    claimBoundaryNote: "Counterpart evidence must still prove source-side independence and full component authority.",
  },
  {
    id: "tile_counterpart_feeds_component_authority_ledger",
    from: "nhm2.tensor.tile_effective_counterpart",
    to: "nhm2.source.component_authority_ledger",
    relation: "requires",
    label: "The tile-effective counterpart supplies component rows for the source component authority ledger.",
    claimBoundaryNote: "Component authority is evidence admission, not material-source proof.",
  },
  {
    id: "component_authority_ledger_feeds_source_side_authority",
    from: "nhm2.source.component_authority_ledger",
    to: "nhm2.source.same_basis_tensor_authority",
    relation: "requires",
    label: "Component-level source authority can retire stale source-authority blockers only when the ledger is complete and non-proxy.",
    claimBoundaryNote: "The ledger cannot override residual, conservation, QEI, observer, material, or claim gates.",
  },
  {
    id: "lifshitz_receipt_feeds_source_side_authority",
    from: "casimir.material.lifshitz_receipt",
    to: "nhm2.source.same_basis_tensor_authority",
    relation: "requires",
    label: "Material receipt evidence is required before Casimir source rows can support source-side tensor authority.",
    claimBoundaryNote: "Material receipts are diagnostics and do not validate a physical source by themselves.",
  },
  {
    id: "component_authority_ledger_feeds_wall_t00_source_residual",
    from: "nhm2.source.component_authority_ledger",
    to: "nhm2.closure.wall_t00_source_residual",
    relation: "requires",
    label: "Wall T00 residual interpretation can use the component ledger to distinguish source evidence from stale authority summaries.",
    claimBoundaryNote: "Wall T00 under tolerance is still narrower than wall closure.",
  },
  {
    id: "source_side_authority_feeds_wall_t00_source_residual",
    from: "nhm2.source.same_basis_tensor_authority",
    to: "nhm2.closure.wall_t00_source_residual",
    relation: "requires",
    label: "Wall T00 residual interpretation requires an independent source-side same-basis tensor authority receipt.",
    claimBoundaryNote: "Wall residuals cannot be promoted when the source side is proxy, diagonal-only, or metric-echo-derived.",
  },
  {
    id: "tile_counterpart_checks_same_basis_closure",
    from: "nhm2.tensor.tile_effective_counterpart",
    to: "nhm2.closure.same_basis_regional_residual",
    relation: "diagnostic_checks",
    label: "The source-side counterpart is compared against the metric-required tensor only in the same basis.",
    claimBoundaryNote: "Unavailable or review-gated counterpart data blocks mechanism language.",
  },
  {
    id: "wall_t00_trace_checks_same_basis_closure",
    from: "nhm2.source.wall_t00_trace",
    to: "nhm2.closure.same_basis_regional_residual",
    relation: "diagnostic_checks",
    label: "The wall T00 trace is the priority regional view of same-basis source closure.",
    claimBoundaryNote: "Wall mismatch remains a blocker, not a formula-retuning success signal.",
  },
  {
    id: "metric_tensor_checks_same_basis_closure",
    from: "nhm2.tensor.metric_required_stress_energy",
    to: "nhm2.closure.same_basis_regional_residual",
    relation: "diagnostic_checks",
    label: "The metric-required tensor is one side of the same-basis residual.",
    claimBoundaryNote: "Restating the metric-required route is not source-side closure.",
  },
  {
    id: "regional_atlas_feeds_same_basis_closure",
    from: "nhm2.regional_atlas.consumer_congruence",
    to: "nhm2.closure.same_basis_regional_residual",
    relation: "requires",
    label: "Same-basis regional residuals require the shared atlas hash used by source and metric tensor artifacts.",
    claimBoundaryNote: "Shared regional geometry does not make the residual pass.",
  },
  {
    id: "component_authority_ledger_feeds_same_basis_closure",
    from: "nhm2.source.component_authority_ledger",
    to: "nhm2.closure.same_basis_regional_residual",
    relation: "requires",
    label: "Same-basis regional residuals need component-authorized source tensors before residuals can be interpreted.",
    claimBoundaryNote: "Residual math remains diagnostic and does not prove the source mechanism.",
  },
  {
    id: "regional_atlas_derivative_support_feeds_conservation",
    from: "nhm2.regional_atlas.derivative_support",
    to: "physics.gr.stress_energy_conservation",
    relation: "requires",
    label: "Region-shaped source tensors need support-derivative terms before conservation diagnostics can be interpreted.",
    claimBoundaryNote: "Derivative support is a prerequisite, not a conservation pass.",
  },
  {
    id: "observer_energy_requires_energy_condition_family",
    from: "nhm2.observer.energy_density_projection",
    to: "nhm2.energy_condition.wec_nec_sec_dec_family",
    relation: "requires",
    label: "Observer energy-density projection contributes to WEC/NEC/SEC/DEC diagnostics.",
    claimBoundaryNote: "A scalar projection does not clear the energy-condition family.",
  },
  {
    id: "observer_momentum_requires_energy_condition_family",
    from: "nhm2.observer.momentum_density_projection",
    to: "nhm2.energy_condition.wec_nec_sec_dec_family",
    relation: "requires",
    label: "Observer momentum-density projection contributes to WEC/NEC/SEC/DEC diagnostics.",
    claimBoundaryNote: "Momentum authority remains part of the observer-family surface.",
  },
  {
    id: "observer_spatial_stress_requires_energy_condition_family",
    from: "nhm2.observer.spatial_stress_projection",
    to: "nhm2.energy_condition.wec_nec_sec_dec_family",
    relation: "requires",
    label: "Observer spatial-stress projection contributes to WEC/NEC/SEC/DEC diagnostics.",
    claimBoundaryNote: "Spatial-stress authority remains part of the observer-family surface.",
  },
  {
    id: "energy_condition_family_bounds_qei_worldline",
    from: "nhm2.energy_condition.wec_nec_sec_dec_family",
    to: "nhm2.qei.worldline_sampling_requirement",
    relation: "bounds",
    label: "Observer-family energy-condition diagnostics are constrained by QEI-style worldline sampling requirements.",
    claimBoundaryNote: "Observer diagnostics and QEI sampling remain separate review surfaces.",
  },
  {
    id: "wall_t00_source_residual_feeds_qei_worldline_dossier",
    from: "nhm2.closure.wall_t00_source_residual",
    to: "nhm2.qei.worldline_dossier",
    relation: "requires",
    label: "The QEI dossier must include wall-region source-closure context before scalar margin language is trusted.",
    claimBoundaryNote: "Wall closure failure remains a front-door blocker for QEI dossier completeness.",
  },
  {
    id: "regional_atlas_consumer_congruence_feeds_qei_dossier",
    from: "nhm2.regional_atlas.consumer_congruence",
    to: "nhm2.qei.worldline_dossier",
    relation: "requires",
    label: "QEI worldlines must be planned against the same regional atlas used by source residuals.",
    claimBoundaryNote: "A same-atlas dossier is still not a QEI pass unless sampling, bounds, and margins pass.",
  },
  {
    id: "regional_atlas_consumer_congruence_feeds_observer_gate",
    from: "nhm2.regional_atlas.consumer_congruence",
    to: "nhm2.energy_condition.observer_robust_gate",
    relation: "requires",
    label: "Observer sampling must reference the same regional atlas as the coupled closure candidate.",
    claimBoundaryNote: "Atlas congruence cannot substitute for observer-family energy-condition checks.",
  },
  {
    id: "qei_worldline_requires_dossier",
    from: "nhm2.qei.worldline_sampling_requirement",
    to: "nhm2.qei.worldline_dossier",
    relation: "requires",
    label: "The worldline sampling requirement must be collected into a reproducible QEI dossier.",
    claimBoundaryNote: "A scalar QEI row cannot replace dossier provenance.",
  },
  {
    id: "source_component_authority_feeds_coupled_candidate",
    from: "nhm2.source.component_authority_ledger",
    to: "nhm2.closure.coupled_pass_candidate",
    relation: "requires",
    label: "The coupled closure candidate reads source component authority as one evidence-admission gate.",
    claimBoundaryNote: "A complete component ledger cannot make the coupled candidate pass by itself.",
  },
  {
    id: "source_side_authority_feeds_coupled_candidate",
    from: "nhm2.source.same_basis_tensor_authority",
    to: "nhm2.closure.coupled_pass_candidate",
    relation: "requires",
    label: "The coupled closure candidate requires source-side same-basis tensor authority.",
    claimBoundaryNote: "Source authority is necessary but not sufficient for diagnostic closure.",
  },
  {
    id: "same_basis_residual_feeds_coupled_candidate",
    from: "nhm2.closure.same_basis_regional_residual",
    to: "nhm2.closure.coupled_pass_candidate",
    relation: "requires",
    label: "Regional residuals feed the synchronized coupled closure candidate.",
    claimBoundaryNote: "Residuals remain review-gated until basis and readiness metadata are synchronized.",
  },
  {
    id: "conservation_feeds_coupled_candidate",
    from: "physics.gr.stress_energy_conservation",
    to: "nhm2.closure.coupled_pass_candidate",
    relation: "requires",
    label: "The coupled closure candidate requires conservation diagnostics for the source tensor path.",
    claimBoundaryNote: "Reduced transition-kernel checks do not substitute for stricter covariant derivative support.",
  },
  {
    id: "qei_dossier_feeds_coupled_candidate",
    from: "nhm2.qei.worldline_dossier",
    to: "nhm2.closure.coupled_pass_candidate",
    relation: "requires",
    label: "The coupled closure candidate requires a same-run QEI worldline dossier.",
    claimBoundaryNote: "A smoke-chain QEI pass must remain tied to the same frozen tensor/profile/run.",
  },
  {
    id: "observer_robust_gate_feeds_coupled_candidate",
    from: "nhm2.energy_condition.observer_robust_gate",
    to: "nhm2.closure.coupled_pass_candidate",
    relation: "requires",
    label: "The coupled closure candidate requires observer-robust energy-condition status.",
    claimBoundaryNote: "Observer robustness is currently fail/incomplete in the pinned smoke chain.",
  },
  {
    id: "material_receipt_feeds_coupled_candidate",
    from: "casimir.material.lifshitz_receipt",
    to: "nhm2.closure.coupled_pass_candidate",
    relation: "requires",
    label: "The coupled closure candidate requires material receipt evidence before source rows can be interpreted.",
    claimBoundaryNote: "Declared material receipts do not establish physical material credibility.",
  },
  {
    id: "coupled_candidate_feeds_regional_pass_path_harness",
    from: "nhm2.closure.coupled_pass_candidate",
    to: "nhm2.closure.regional_tensor_pass_path_harness",
    relation: "requires",
    label: "The regional pass-path harness consumes the coupled closure candidate as one readiness gate.",
    claimBoundaryNote: "The current coupled candidate is false, so the pass-path harness remains blocked.",
  },
  {
    id: "regional_pass_path_harness_blocks_diagnostic_boundary",
    from: "nhm2.closure.regional_tensor_pass_path_harness",
    to: "nhm2.claim_boundary.diagnostic_only",
    relation: "blocks",
    label: "The regional pass-path harness keeps NHM2 in diagnostic/reduced-order wording until all gates pass together.",
    claimBoundaryNote: "Numerical pass-path readiness cannot grant physical or transport claims.",
  },
  {
    id: "regional_pass_path_harness_feeds_time_dependent_campaign",
    from: "nhm2.closure.regional_tensor_pass_path_harness",
    to: "nhm2.dynamic.time_dependent_source_campaign",
    relation: "requires",
    label: "The frozen time-dependent campaign is stricter than the static regional pass-path harness and consumes it as one diagnostic prerequisite.",
    claimBoundaryNote: "Static readiness cannot substitute for dynamic frequency, switching, backreaction, and stability receipts.",
  },
  {
    id: "regional_pass_path_harness_feeds_switching_conservation",
    from: "nhm2.closure.regional_tensor_pass_path_harness",
    to: "nhm2.dynamic.switching_covariant_conservation",
    relation: "documents",
    label: "The static regional harness supplies upstream context, but switching conservation must carry its own dynamic terms.",
    claimBoundaryNote: "Static conservation context cannot substitute for sector-switching conservation evidence.",
  },
  {
    id: "switching_conservation_feeds_time_dependent_campaign",
    from: "nhm2.dynamic.switching_covariant_conservation",
    to: "nhm2.dynamic.time_dependent_source_campaign",
    relation: "requires",
    label: "The time-dependent campaign requires switching conservation evidence across support, sector, time-derivative, and transition-kernel terms.",
    claimBoundaryNote: "A switching pass is still diagnostic and does not clear dynamic geometry, observer, tensor, or stability gates.",
  },
  {
    id: "frequency_convergence_feeds_time_dependent_campaign",
    from: "nhm2.dynamic.frequency_convergence",
    to: "nhm2.dynamic.time_dependent_source_campaign",
    relation: "requires",
    label: "The time-dependent campaign requires fixed-cycle-average convergence over the frequency ladder.",
    claimBoundaryNote: "A frequency pass is still diagnostic and cannot imply physical viability.",
  },
  {
    id: "dynamic_effective_geometry_feeds_time_dependent_campaign",
    from: "nhm2.dynamic.effective_geometry_agreement",
    to: "nhm2.dynamic.time_dependent_source_campaign",
    relation: "requires",
    label: "The time-dependent campaign requires dynamic/effective geometry agreement and bounded backreaction evidence.",
    claimBoundaryNote: "A dynamic/effective geometry receipt is diagnostic and cannot grant route, propulsion, or physical viability claims.",
  },
  {
    id: "source_off_diagonal_shear_audit_feeds_time_dependent_campaign",
    from: "nhm2.source.off_diagonal_shear_audit",
    to: "nhm2.dynamic.time_dependent_source_campaign",
    relation: "documents",
    label: "The source-side shear audit sharpens off-diagonal Tij failures inside the frozen time-dependent campaign.",
    claimBoundaryNote: "Missing shear-mechanism evidence is a diagnostic falsifier candidate, not a physical-source validation result.",
  },
  {
    id: "source_momentum_density_audit_feeds_frame_projection_receipt",
    from: "nhm2.source.momentum_density_audit",
    to: "nhm2.source.momentum_frame_projection_receipt",
    relation: "requires",
    label: "The momentum audit supplies same-chart T0i/T00 ratios that require a local-frame projection receipt before causal-bound interpretation.",
    claimBoundaryNote: "A momentum audit alone cannot turn chart components into causal-material bound evidence.",
  },
  {
    id: "momentum_frame_projection_receipt_feeds_metric_required_momentum_demand_audit",
    from: "nhm2.source.momentum_frame_projection_receipt",
    to: "nhm2.metric_required.momentum_demand_audit",
    relation: "requires",
    label: "The projection receipt supplies local-frame momentum ratios for the metric-required momentum demand audit.",
    claimBoundaryNote: "Projection evidence remains diagnostic and does not validate a physical source or transport claim.",
  },
  {
    id: "metric_required_momentum_demand_audit_feeds_remediation_targets",
    from: "nhm2.metric_required.momentum_demand_audit",
    to: "nhm2.metric_required.momentum_remediation_targets",
    relation: "requires",
    label: "The metric-required momentum demand audit supplies the projected T0i ratios used to compute current-profile remediation targets.",
    claimBoundaryNote: "A remediation target is scoped to this profile and does not validate a redesigned metric.",
  },
  {
    id: "metric_momentum_remediation_targets_feed_campaign_frontier_disposition",
    from: "nhm2.metric_required.momentum_remediation_targets",
    to: "nhm2.campaign.frontier_disposition",
    relation: "documents",
    label: "The metric momentum remediation targets sharpen the campaign blocker into a typed current-profile frontier disposition.",
    claimBoundaryNote: "A current-profile falsifier is scoped to the declared projection evidence and is not a universal no-go theorem.",
  },
  {
    id: "campaign_frontier_disposition_feeds_time_dependent_campaign",
    from: "nhm2.campaign.frontier_disposition",
    to: "nhm2.dynamic.time_dependent_source_campaign",
    relation: "documents",
    label: "The campaign frontier disposition records whether the current profile is rejected before the campaign continues to downstream proof gates.",
    claimBoundaryNote: "A disposition artifact does not validate a redesigned metric profile or physical transport claim.",
  },
  {
    id: "campaign_frontier_disposition_feeds_profile_search",
    from: "nhm2.campaign.frontier_disposition",
    to: "nhm2.profile.campaign_search",
    relation: "documents",
    label: "The campaign frontier disposition supplies the current-profile rejection and suppression target used to screen redesigned profiles.",
    claimBoundaryNote: "A profile-search screen pass is not a campaign pass or physical transport claim.",
  },
  {
    id: "campaign_profile_search_feeds_time_dependent_campaign",
    from: "nhm2.profile.campaign_search",
    to: "nhm2.dynamic.time_dependent_source_campaign",
    relation: "documents",
    label: "The profile search identifies candidate profiles that still require a full frozen time-dependent campaign run.",
    claimBoundaryNote: "Candidate ranking is diagnostic steering only and cannot validate a profile.",
  },
  {
    id: "campaign_profile_search_feeds_candidate_metric_profile_spec",
    from: "nhm2.profile.campaign_search",
    to: "nhm2.profile.candidate_metric_profile_spec",
    relation: "requires",
    label: "A screened candidate must be written as an executable profile spec before the full ADM tensor route can evaluate it.",
    claimBoundaryNote: "A candidate profile spec is an ADM-entry precondition, not a profile validation or route claim.",
  },
  {
    id: "candidate_metric_profile_spec_feeds_profile_run_manifest",
    from: "nhm2.profile.candidate_metric_profile_spec",
    to: "nhm2.profile.campaign_run_manifest",
    relation: "requires",
    label: "The run manifest consumes the candidate profile spec as the first frozen-campaign evidence row.",
    claimBoundaryNote: "Missing executable geometry blocks campaign execution without implying a no-go theorem.",
  },
  {
    id: "candidate_metric_profile_spec_feeds_metric_tensor_screen",
    from: "nhm2.profile.candidate_metric_profile_spec",
    to: "nhm2.tensor.same_chart_full_tensor",
    relation: "requires",
    label: "Candidate same-chart full tensor evidence requires executable candidate geometry from the metric profile spec.",
    claimBoundaryNote: "Projected tensors remain blocked until a real ADM/Einstein route is run for the candidate profile.",
  },
  {
    id: "campaign_profile_search_feeds_profile_run_manifest",
    from: "nhm2.profile.campaign_search",
    to: "nhm2.profile.campaign_run_manifest",
    relation: "requires",
    label: "The profile-search output supplies the screened candidates that the run manifest turns into frozen campaign evidence requirements.",
    claimBoundaryNote: "Queued profile runs are not campaign passes.",
  },
  {
    id: "campaign_profile_run_manifest_feeds_time_dependent_campaign",
    from: "nhm2.profile.campaign_run_manifest",
    to: "nhm2.dynamic.time_dependent_source_campaign",
    relation: "requires",
    label: "The time-dependent campaign can only rank a candidate after the manifest evidence rows are produced for that profile.",
    claimBoundaryNote: "A completed manifest would still be diagnostic evidence governance, not physical viability.",
  },
  {
    id: "time_dependent_campaign_blocks_diagnostic_boundary",
    from: "nhm2.dynamic.time_dependent_source_campaign",
    to: "nhm2.claim_boundary.diagnostic_only",
    relation: "blocks",
    label: "The time-dependent source campaign keeps NHM2 behind diagnostic-only language until dynamic gates pass together.",
    claimBoundaryNote: "A campaign artifact cannot grant transport, route ETA, propulsion, or physical viability claims.",
  },
  {
    id: "time_dependent_campaign_feeds_lean_certificate",
    from: "nhm2.dynamic.time_dependent_source_campaign",
    to: "nhm2.formal.lean_certificate",
    relation: "requires",
    label: "The Lean certificate exporter consumes the pinned time-dependent campaign artifacts as certificate inputs.",
    claimBoundaryNote: "The Lean certificate is a formal diagnostic bridge and does not rerun the numerical solver.",
  },
  {
    id: "lean_certificate_requires_hash_pins",
    from: "nhm2.formal.certificate_hashes_pinned",
    to: "nhm2.formal.lean_certificate",
    relation: "requires",
    label: "The Lean certificate is scoped by profile, atlas, and artifact hash provenance.",
    claimBoundaryNote: "Hash pinning prevents stale evidence from being promoted into certificate language.",
  },
  {
    id: "lean_certificate_feeds_diagnostic_admissibility",
    from: "nhm2.formal.lean_certificate",
    to: "nhm2.formal.diagnostic_campaign_admissible",
    relation: "requires",
    label: "Lean checks the emitted certificate facts before the diagnostic campaign admissibility theorem is available.",
    claimBoundaryNote: "Diagnostic admissibility is policy-scoped and cannot grant physical, transport, route, propulsion, or speed claims.",
  },
  {
    id: "negative_fixtures_document_lean_certificate",
    from: "nhm2.formal.negative_fixtures_fail_closed",
    to: "nhm2.formal.lean_certificate",
    relation: "documents",
    label: "Negative fixtures document that missing, stale, scalar-only, narrow-frame, or open-lock evidence fails closed.",
    claimBoundaryNote: "Fail-closed tests are proof-policy coverage, not physical-source evidence.",
  },
  {
    id: "diagnostic_admissibility_requires_claim_locks",
    from: "nhm2.formal.claim_locks_closed",
    to: "nhm2.formal.diagnostic_campaign_admissible",
    relation: "requires",
    label: "The Lean diagnostic-admissibility theorem requires closed claim locks.",
    claimBoundaryNote: "Open physical, route, propulsion, transport, or speed locks block the certificate.",
  },
  {
    id: "lean_claim_locks_block_diagnostic_boundary",
    from: "nhm2.formal.claim_locks_closed",
    to: "nhm2.claim_boundary.diagnostic_only",
    relation: "blocks",
    label: "Lean claim locks keep formal campaign admissibility behind the diagnostic-only boundary.",
    claimBoundaryNote: "Formal certificate admissibility cannot widen NHM2 claims.",
  },
  {
    id: "lean_diagnostic_admissibility_documents_boundary",
    from: "nhm2.formal.diagnostic_campaign_admissible",
    to: "nhm2.claim_boundary.diagnostic_only",
    relation: "documents",
    label: "Lean diagnostic admissibility documents the policy-scoped campaign result.",
    claimBoundaryNote: "The result remains diagnostic/reduced-order evidence only.",
  },
  {
    id: "diagnostic_campaign_feeds_physical_evidence_campaign",
    from: "nhm2.dynamic.time_dependent_source_campaign",
    to: "nhm2.experimental.physical_viability_campaign",
    relation: "documents",
    label: "The diagnostic campaign provides the computational input to the physical evidence ladder.",
    claimBoundaryNote: "Diagnostic campaign admission cannot substitute for experimental receipts.",
  },
  {
    id: "lean_certificate_documents_physical_claim_lock",
    from: "nhm2.formal.claim_locks_closed",
    to: "nhm2.experimental.physical_viability_campaign",
    relation: "documents",
    label: "Lean claim locks document that the physical evidence ladder starts with physical and transport claims closed.",
    claimBoundaryNote: "Formal diagnostic admissibility does not unlock physical evidence stages.",
  },
  {
    id: "physical_campaign_documents_theory_solve_roadmap",
    from: "nhm2.experimental.physical_viability_campaign",
    to: "nhm2.experimental.theory_solve_roadmap",
    relation: "documents",
    label: "The physical evidence campaign points to the experiment-facing theory roadmap for pre-hardware observables, receipts, and falsifiers.",
    claimBoundaryNote: "A roadmap is planning evidence only and cannot substitute for experimental receipts.",
  },
  {
    id: "theory_solve_roadmap_documents_parameter_targets",
    from: "nhm2.experimental.theory_solve_roadmap",
    to: "nhm2.experimental.parameter_targets",
    relation: "documents",
    label: "The experiment-facing roadmap is refined into stage-level parameter targets, literature comparators, receipts, and blockers.",
    claimBoundaryNote: "Parameter targets are planning rows and cannot substitute for experimental receipts.",
  },
  {
    id: "parameter_targets_feed_research_gap_ledger",
    from: "nhm2.experimental.parameter_targets",
    to: "nhm2.experimental.research_gap_ledger",
    relation: "documents",
    label: "Parameter targets are refined into research gaps, precedent receipts, falsifiers, null-result meanings, and claim-impact rows.",
    claimBoundaryNote: "Research-gap rows guide value-of-information planning and cannot substitute for measurements.",
  },
  {
    id: "research_gap_ledger_prioritizes_full_apparatus_tensor",
    from: "nhm2.experimental.research_gap_ledger",
    to: "nhm2.experimental.full_apparatus_tensor",
    relation: "documents",
    label: "The research-gap ledger marks full apparatus T_mu_nu authority as a P0 source-side gap.",
    claimBoundaryNote: "A priority gap is not a material tensor receipt.",
  },
  {
    id: "research_gap_ledger_prioritizes_array_scaling",
    from: "nhm2.experimental.research_gap_ledger",
    to: "nhm2.experimental.array_scaling",
    relation: "documents",
    label: "The research-gap ledger marks 447-layer stack scaling as a P0 parameter-regime gap.",
    claimBoundaryNote: "Layer-count planning cannot replace stack scaling evidence.",
  },
  {
    id: "research_gap_ledger_prioritizes_layer_stack_mechanics",
    from: "nhm2.experimental.research_gap_ledger",
    to: "nhm2.experimental.layer_stack_mechanical_receipt",
    relation: "documents",
    label: "The research-gap ledger identifies mechanical survivability of the 447-layer stack as a value-of-information target.",
    claimBoundaryNote: "A mechanical receipt target is not a material source tensor or physical pass.",
  },
  {
    id: "research_gap_ledger_prioritizes_support_fraction_sweep",
    from: "nhm2.experimental.research_gap_ledger",
    to: "nhm2.experimental.layer_stack_support_fraction_sweep",
    relation: "documents",
    label: "The research-gap ledger motivates a support-fraction sweep to test whether stress limits and active-source retention overlap.",
    claimBoundaryNote: "A support-fraction sweep is a go/no-go planning map, not material evidence.",
  },
  {
    id: "research_gap_ledger_prioritizes_metric_upper_bound",
    from: "nhm2.experimental.research_gap_ledger",
    to: "nhm2.experimental.metric_upper_bound",
    relation: "documents",
    label: "The research-gap ledger connects detector-scale h00_proxy bounds to metric-response planning.",
    claimBoundaryNote: "A detector bound plan is not a measured metric response.",
  },
  {
    id: "research_gap_ledger_prioritizes_qei_dossier",
    from: "nhm2.experimental.research_gap_ledger",
    to: "nhm2.qei.worldline_dossier",
    relation: "documents",
    label: "The research-gap ledger records QEI worldline applicability and null-result meaning as a P0 theory-to-measurement gap.",
    claimBoundaryNote: "QEI applicability planning is not a universal QEI pass.",
  },
  {
    id: "research_gap_ledger_prioritizes_observer_robust_gate",
    from: "nhm2.experimental.research_gap_ledger",
    to: "nhm2.energy_condition.observer_robust_gate",
    relation: "documents",
    label: "The research-gap ledger records observer-robust integration as a P0 blocker for energy-condition language.",
    claimBoundaryNote: "Observer-robust planning cannot promote Eulerian-only or incomplete observer checks.",
  },
  {
    id: "research_gap_ledger_blocks_physical_viability_lock",
    from: "nhm2.experimental.research_gap_ledger",
    to: "nhm2.claim_boundary.physical_viability_locked",
    relation: "blocks",
    label: "Open research gaps keep physical viability locked until receipts and null-result dispositions are produced.",
    claimBoundaryNote: "Research-gap closure is necessary planning evidence, not automatic physical viability.",
  },
  {
    id: "parameter_targets_feed_prediction_freeze",
    from: "nhm2.experimental.parameter_targets",
    to: "nhm2.experimental.prediction_freeze",
    relation: "documents",
    label: "Parameter targets identify which predictions and uncertainty bounds must be frozen before data collection.",
    claimBoundaryNote: "Freezing a target is not a measured result.",
  },
  {
    id: "parameter_targets_feed_tile_metrology",
    from: "nhm2.experimental.parameter_targets",
    to: "nhm2.experimental.tile_force_receipt",
    relation: "documents",
    label: "Parameter targets expose the gap, area, pressure, material, and systematic receipts required by tile metrology.",
    claimBoundaryNote: "Ideal scalar tile rows remain non-receipted targets.",
  },
  {
    id: "parameter_targets_feed_layer_stack_mechanical_receipt",
    from: "nhm2.experimental.parameter_targets",
    to: "nhm2.experimental.layer_stack_mechanical_receipt",
    relation: "documents",
    label: "Parameter targets expose the 8 nm, 10 mm x 10 mm, and 447-layer scalar load inputs consumed by the mechanical receipt.",
    claimBoundaryNote: "Scalar load computation cannot substitute for pull-in, support, fatigue, thermal, or material receipts.",
  },
  {
    id: "parameter_targets_feed_layer_stack_support_fraction_sweep",
    from: "nhm2.experimental.parameter_targets",
    to: "nhm2.experimental.layer_stack_support_fraction_sweep",
    relation: "documents",
    label: "Parameter targets provide the area, force, and layer count used to sweep support fraction versus source retention.",
    claimBoundaryNote: "Support-fraction arithmetic cannot substitute for tensor or material receipts.",
  },
  {
    id: "parameter_targets_feed_metric_response",
    from: "nhm2.experimental.parameter_targets",
    to: "nhm2.experimental.invariant_metric_response",
    relation: "documents",
    label: "Parameter targets connect the weak-field h00 proxy to detector and multi-probe metric-response planning.",
    claimBoundaryNote: "A target scale is not detector evidence.",
  },
  {
    id: "theory_solve_roadmap_feeds_prediction_freeze",
    from: "nhm2.experimental.theory_solve_roadmap",
    to: "nhm2.experimental.prediction_freeze",
    relation: "documents",
    label: "The roadmap enumerates the theoretical solves that must be frozen before experimental data are used.",
    claimBoundaryNote: "A frozen prediction can start an experiment campaign but is not an experimental success result.",
  },
  {
    id: "physical_campaign_requires_prediction_freeze",
    from: "nhm2.experimental.prediction_freeze",
    to: "nhm2.experimental.physical_viability_campaign",
    relation: "requires",
    label: "The physical evidence campaign requires pre-registered predictions and falsifiers before data collection.",
    claimBoundaryNote: "Prediction freeze is not experimental success.",
  },
  {
    id: "prediction_freeze_precedes_tile_force_receipt",
    from: "nhm2.experimental.prediction_freeze",
    to: "nhm2.experimental.tile_force_receipt",
    relation: "requires",
    label: "Tile metrology must be evaluated against frozen predictions rather than post-hoc target fitting.",
    claimBoundaryNote: "Tile metrology remains mechanism evidence, not spacetime response evidence.",
  },
  {
    id: "tile_force_receipt_requires_cycle_energy_balance",
    from: "nhm2.experimental.tile_cycle_energy_balance",
    to: "nhm2.experimental.tile_force_receipt",
    relation: "requires",
    label: "The measured tile force receipt requires closed cyclic energy accounting.",
    claimBoundaryNote: "Energy conversion bookkeeping is not free-energy evidence.",
  },
  {
    id: "tile_metrology_feeds_array_scaling",
    from: "nhm2.experimental.tile_force_receipt",
    to: "nhm2.experimental.array_scaling",
    relation: "requires",
    label: "Array scaling can only be reviewed after individual tile metrology is receipted.",
    claimBoundaryNote: "Array scaling does not by itself measure gravity.",
  },
  {
    id: "layer_stack_mechanical_receipt_feeds_array_scaling",
    from: "nhm2.experimental.layer_stack_mechanical_receipt",
    to: "nhm2.experimental.array_scaling",
    relation: "requires",
    label: "Array scaling review requires the 447-layer stack to survive pull-in, support, thermal, fatigue, and active-control constraints.",
    claimBoundaryNote: "Mechanical survivability does not establish source tensor authority.",
  },
  {
    id: "layer_stack_mechanical_receipt_feeds_support_fraction_sweep",
    from: "nhm2.experimental.layer_stack_mechanical_receipt",
    to: "nhm2.experimental.layer_stack_support_fraction_sweep",
    relation: "requires",
    label: "The support-fraction sweep consumes the mechanical receipt's ideal stack load and stress scale.",
    claimBoundaryNote: "The consumed load remains ideal scalar context until material receipts exist.",
  },
  {
    id: "support_fraction_sweep_feeds_array_scaling",
    from: "nhm2.experimental.layer_stack_support_fraction_sweep",
    to: "nhm2.experimental.array_scaling",
    relation: "requires",
    label: "Array scaling requires a support fraction that can carry load while preserving active Casimir area.",
    claimBoundaryNote: "A candidate window still requires support/drive tensor terms and material receipts.",
  },
  {
    id: "support_fraction_sweep_motivates_architecture_loop",
    from: "nhm2.experimental.layer_stack_support_fraction_sweep",
    to: "nhm2.experimental.layer_stack_architecture_loop",
    relation: "documents",
    label: "The no-overlap support-fraction blocker motivates architectures that decouple load bearing from active area loss.",
    claimBoundaryNote: "Architecture search prioritizes engineering receipts; it is not material-source evidence.",
  },
  {
    id: "architecture_loop_feeds_array_scaling",
    from: "nhm2.experimental.layer_stack_architecture_loop",
    to: "nhm2.experimental.array_scaling",
    relation: "requires",
    label: "Array scaling must consume a load-path architecture that preserves active source area and pull-in margin.",
    claimBoundaryNote: "Architecture review windows still require measured or simulated receipts before promotion.",
  },
  {
    id: "architecture_loop_feeds_full_apparatus_receipt_loop",
    from: "nhm2.experimental.layer_stack_architecture_loop",
    to: "nhm2.experimental.full_apparatus_receipt_loop",
    relation: "requires",
    label: "Architecture review rows must be converted into material, pull-in, metrology, control, fatigue, layer-scaling, and tensor receipt rows.",
    claimBoundaryNote: "Receipt rows remain diagnostic and cannot become material-source authority by themselves.",
  },
  {
    id: "full_apparatus_receipt_loop_feeds_array_scaling",
    from: "nhm2.experimental.full_apparatus_receipt_loop",
    to: "nhm2.experimental.array_scaling",
    relation: "requires",
    label: "Array scaling review requires receipts for the selected architecture before treating the 447-layer route as an engineering candidate.",
    claimBoundaryNote: "Engineering receipt readiness is not physical validation.",
  },
  {
    id: "full_apparatus_receipt_loop_feeds_full_tensor",
    from: "nhm2.experimental.full_apparatus_receipt_loop",
    to: "nhm2.experimental.full_apparatus_tensor",
    relation: "requires",
    label: "The receipt loop enumerates support, spacer, active-control, thermal, electrostatic, fatigue, and layer-scaling terms that must enter the apparatus tensor.",
    claimBoundaryNote: "Tensor term coverage is required before source-side tensor authority can judge the apparatus.",
  },
  {
    id: "full_apparatus_receipt_loop_feeds_tile_source_validation_plan",
    from: "nhm2.experimental.full_apparatus_receipt_loop",
    to: "nhm2.experimental.tile_source_physical_validation_plan",
    relation: "requires",
    label: "The tile-source validation plan freezes the strongest 447-layer candidate only after enumerating material, pull-in, metrology, control, fatigue, layer-scaling, and full-apparatus tensor receipt targets.",
    claimBoundaryNote: "A validation plan is evidence planning and blocker localization, not physical validation.",
  },
  {
    id: "tile_source_validation_plan_requires_full_apparatus_tensor",
    from: "nhm2.experimental.tile_source_physical_validation_plan",
    to: "nhm2.experimental.full_apparatus_tensor",
    relation: "requires",
    label: "The plan requires a full apparatus tensor before source-side tensor authority can treat the tile stack as a source candidate.",
    claimBoundaryNote: "A frozen candidate without T00, T0i, diagonal Tij, and off-diagonal Tij remains review-level.",
  },
  {
    id: "tile_source_validation_plan_feeds_same_basis_authority",
    from: "nhm2.experimental.tile_source_physical_validation_plan",
    to: "nhm2.source.same_basis_tensor_authority",
    relation: "requires",
    label: "A physically credible source candidate must feed the same-chart, same-basis, no-target-echo source authority gate.",
    claimBoundaryNote: "Source authority is a prerequisite for closure review and cannot become a physical mechanism claim by itself.",
  },
  {
    id: "tile_source_validation_plan_feeds_coupled_closure",
    from: "nhm2.experimental.tile_source_physical_validation_plan",
    to: "nhm2.closure.coupled_pass_candidate",
    relation: "requires",
    label: "The plan only becomes useful to the full solve when regional residual, conservation, QEI, observer, material, and coupled-closure gates pass together.",
    claimBoundaryNote: "Coupled diagnostic closure remains separate from physical viability or transport claims.",
  },
  {
    id: "tile_source_validation_plan_blocks_physical_lock",
    from: "nhm2.experimental.tile_source_physical_validation_plan",
    to: "nhm2.claim_boundary.physical_viability_locked",
    relation: "blocks",
    label: "Missing tile-source physical validation receipts keep physical viability locked even when a diagnostic campaign profile passes.",
    claimBoundaryNote: "Physical, route, speed, transport, and propulsion claims remain forbidden until external physical validation exists.",
  },
  {
    id: "architecture_loop_feeds_full_apparatus_tensor",
    from: "nhm2.experimental.layer_stack_architecture_loop",
    to: "nhm2.experimental.full_apparatus_tensor",
    relation: "requires",
    label: "Support, spacer, drive, thermal, and electrostatic terms identified by the architecture loop must enter the full apparatus tensor.",
    claimBoundaryNote: "A support architecture cannot be treated as source tensor authority by itself.",
  },
  {
    id: "architecture_loop_blocks_physical_lock",
    from: "nhm2.experimental.layer_stack_architecture_loop",
    to: "nhm2.claim_boundary.physical_viability_locked",
    relation: "blocks",
    label: "Missing material, pull-in, roughness, patch, active-control, or tensor receipts keep the 447-layer architecture at diagnostic review.",
    claimBoundaryNote: "Engineering review cannot unlock physical, route, speed, transport, or propulsion claims.",
  },
  {
    id: "full_apparatus_receipt_loop_blocks_physical_lock",
    from: "nhm2.experimental.full_apparatus_receipt_loop",
    to: "nhm2.claim_boundary.physical_viability_locked",
    relation: "blocks",
    label: "Missing full-apparatus receipts keep the 447-layer architecture from becoming physical evidence.",
    claimBoundaryNote: "Receipt-loop candidate rows cannot unlock physical, route, speed, transport, or propulsion claims.",
  },
  {
    id: "support_fraction_sweep_blocks_physical_lock",
    from: "nhm2.experimental.layer_stack_support_fraction_sweep",
    to: "nhm2.claim_boundary.physical_viability_locked",
    relation: "blocks",
    label: "If stress and source-retention windows do not overlap, the 447-layer route remains blocked before physical review.",
    claimBoundaryNote: "Go/no-go planning cannot unlock physical viability or transport claims.",
  },
  {
    id: "layer_stack_mechanical_receipt_blocks_physical_lock",
    from: "nhm2.experimental.layer_stack_mechanical_receipt",
    to: "nhm2.claim_boundary.physical_viability_locked",
    relation: "blocks",
    label: "Open mechanical receipt blockers keep physical viability locked even when scalar wall T00 arithmetic improves.",
    claimBoundaryNote: "Internal Casimir load is not thrust, propulsion, or transport evidence.",
  },
  {
    id: "array_scaling_requires_full_apparatus_tensor",
    from: "nhm2.experimental.full_apparatus_tensor",
    to: "nhm2.experimental.array_scaling",
    relation: "requires",
    label: "Array scaling must include full apparatus stress-energy, not only ideal interaction energy.",
    claimBoundaryNote: "Full apparatus tensor evidence remains source credibility, not transport evidence.",
  },
  {
    id: "array_scaling_feeds_vacuum_weight",
    from: "nhm2.experimental.array_scaling",
    to: "nhm2.experimental.vacuum_weight",
    relation: "requires",
    label: "Vacuum-weight review requires a characterized source array and energy ledger.",
    claimBoundaryNote: "A vacuum-weight result would test gravity coupling, not NHM2 transport.",
  },
  {
    id: "metric_upper_bound_informs_metric_response",
    from: "nhm2.experimental.metric_upper_bound",
    to: "nhm2.experimental.invariant_metric_response",
    relation: "documents",
    label: "Weak-field scalar estimates inform detector scale before invariant metric-response receipts are available.",
    claimBoundaryNote: "A weak-field scalar estimate is not a detector response or measured metric.",
  },
  {
    id: "vacuum_weight_feeds_invariant_metric_response",
    from: "nhm2.experimental.vacuum_weight",
    to: "nhm2.experimental.invariant_metric_response",
    relation: "requires",
    label: "A metric-response experiment should follow a characterized source and vacuum-weight receipt.",
    claimBoundaryNote: "Metric response requires multiple probes agreeing with one metric prediction.",
  },
  {
    id: "invariant_metric_response_feeds_physical_lock",
    from: "nhm2.experimental.invariant_metric_response",
    to: "nhm2.claim_boundary.physical_viability_locked",
    relation: "blocks",
    label: "Physical viability remains locked until replicated source and invariant metric-response receipts exist.",
    claimBoundaryNote: "Measured metric response would still require full policy and replication review.",
  },
  {
    id: "independent_replication_blocks_physical_lock",
    from: "nhm2.experimental.independent_replication",
    to: "nhm2.claim_boundary.physical_viability_locked",
    relation: "blocks",
    label: "Independent replication is required before physical viability review can proceed.",
    claimBoundaryNote: "Local or unreplicated positive results cannot unlock physical viability.",
  },
  {
    id: "physical_viability_lock_blocks_transport_lock",
    from: "nhm2.claim_boundary.physical_viability_locked",
    to: "nhm2.claim_boundary.transport_locked",
    relation: "blocks",
    label: "Transport review remains downstream of physical-source and metric-response evidence.",
    claimBoundaryNote: "A physical-source review cannot automatically become a transport claim.",
  },
  {
    id: "geodesic_response_blocks_transport_lock",
    from: "nhm2.experimental.geodesic_response",
    to: "nhm2.claim_boundary.transport_locked",
    relation: "blocks",
    label: "Transport remains locked until neutral test-worldline response is measured and replicated.",
    claimBoundaryNote: "Geodesic response is a transport precursor, not route ETA or speed authority.",
  },
  {
    id: "natario_invariants_document_observer_authority",
    from: "nhm2.natario.curvature_invariants",
    to: "nhm2.tensor.full_authority_gate",
    relation: "documents",
    label: "Natario-adjacent curvature diagnostics document why tensor and momentum authority remain visible.",
    claimBoundaryNote: "Curvature badges are runtime targets, not promotion evidence.",
  },
  {
    id: "natario_invariant_audit_feeds_observer_robust_gate",
    from: "nhm2.natario.invariant_audit",
    to: "nhm2.energy_condition.observer_robust_gate",
    relation: "requires",
    label: "Natario invariant and stability diagnostics inform observer-robust energy-condition review.",
    claimBoundaryNote: "Zero expansion alone does not clear observer-family energy-condition language.",
  },
  {
    id: "observer_robust_gate_blocks_nhm2_diagnostic_boundary",
    from: "nhm2.energy_condition.observer_robust_gate",
    to: "nhm2.claim_boundary.diagnostic_only",
    relation: "blocks",
    label: "Observer-robust energy-condition incompleteness keeps NHM2 in diagnostic-only claim language.",
    claimBoundaryNote: "Friendly observer checks cannot prove WEC/NEC/DEC/SEC robustness.",
  },
  {
    id: "same_basis_closure_blocks_diagonal_proxy_boundary",
    from: "nhm2.closure.same_basis_regional_residual",
    to: "nhm2.claim_boundary.diagonal_proxy_not_full_tensor",
    relation: "blocks",
    label: "Closure remains blocked when tensor authority is partial, diagonal-only, or review-gated.",
    claimBoundaryNote: "No source-closure completion language is allowed.",
  },
  {
    id: "full_tensor_authority_blocks_diagonal_proxy_boundary",
    from: "nhm2.tensor.full_authority_gate",
    to: "nhm2.claim_boundary.diagonal_proxy_not_full_tensor",
    relation: "blocks",
    label: "Full tensor authority remains blocked while output is diagonal-only or missing J_i/S_ij channels.",
    claimBoundaryNote: "No observer-family promotion language is allowed.",
  },
  {
    id: "wall_t00_trace_blocks_nhm2_diagnostic_boundary",
    from: "nhm2.source.wall_t00_trace",
    to: "nhm2.claim_boundary.diagnostic_only",
    relation: "blocks",
    label: "The wall T00 residual keeps NHM2 in diagnostic/reduced-order wording.",
    claimBoundaryNote: "Wall-region source mismatch blocks stronger source-closure language.",
  },
  {
    id: "regional_atlas_claim_boundary_blocks_promotion",
    from: "nhm2.regional_atlas.claim_boundary",
    to: "nhm2.claim_boundary.diagnostic_only",
    relation: "blocks",
    label: "Atlas congruence cannot promote NHM2 into material, conservation, QEI, observer, or transport claims.",
    claimBoundaryNote: "The atlas is a shared proof map, not proof closure.",
  },
  {
    id: "regional_atlas_consumer_congruence_documents_claim_boundary",
    from: "nhm2.regional_atlas.consumer_congruence",
    to: "nhm2.regional_atlas.claim_boundary",
    relation: "documents",
    label: "Same-atlas consumer congruence points at the atlas-specific claim boundary.",
    claimBoundaryNote: "Even a green congruence gate stays diagnostic-only.",
  },
  {
    id: "shift_profile_blocks_speed_boundary",
    from: "nhm2.geometry.lapse_shift_profile",
    to: "nhm2.claim_boundary.shift_not_ship_speed",
    relation: "blocks",
    label: "Lapse-shift profile rows must not be interpreted as ordinary vehicle velocity.",
    claimBoundaryNote: "Shift is chart-dependent geometry context.",
  },
  {
    id: "clock_target_blocks_route_language",
    from: "nhm2.clock.centerline_tau_alpha_T",
    to: "nhm2.claim_boundary.expected_clocking_not_route_result",
    relation: "blocks",
    label: "Centerline clocking targets must not be promoted into route results.",
    claimBoundaryNote: "No speed, ETA, or full-loop pass claim is allowed.",
  },
  {
    id: "centerline_clocking_feeds_twin_paradox_trip_clocking",
    from: "nhm2.clock.centerline_tau_alpha_T",
    to: "nhm2.clock.twin_paradox_trip_clocking",
    relation: "specializes",
    label:
      "Twin Paradox trip clocking is a bounded reader-facing extension of the centerline tau=alpha T clocking target.",
    claimBoundaryNote:
      "The extension reports clock accumulation only; it does not certify speed or route ETA.",
  },
  {
    id: "twin_paradox_trip_clocking_blocks_route_result_language",
    from: "nhm2.clock.twin_paradox_trip_clocking",
    to: "nhm2.claim_boundary.expected_clocking_not_route_result",
    relation: "blocks",
    label:
      "Trip clocking must stay behind the expected-clocking-not-route-result claim boundary.",
    claimBoundaryNote:
      "SR beta analogy and coordinate schedule ratio cannot become speed claims.",
  },
  {
    id: "twin_paradox_trip_clocking_documents_profile_index",
    from: "nhm2.clock.twin_paradox_trip_clocking",
    to: "nhm2.clock.trip_clocking_profile_index",
    relation: "documents",
    label:
      "The profile index records profile-scoped trip clocking diagnostics behind the Twin Paradox clocking surface.",
    claimBoundaryNote:
      "Profile comparison cannot override per-profile coherence or route-result claim locks.",
  },
  {
    id: "trip_clocking_profile_index_blocks_route_result_language",
    from: "nhm2.clock.trip_clocking_profile_index",
    to: "nhm2.claim_boundary.expected_clocking_not_route_result",
    relation: "blocks",
    label:
      "The profile index keeps 0p995 and 0p7000 as diagnostic clocking rows rather than route-result rows.",
    claimBoundaryNote:
      "Multiple profile rows do not certify speed, route ETA, physical viability, or full-solve closure.",
  },
  {
    id: "qei_worldline_blocks_literature_boundary",
    from: "nhm2.qei.worldline_sampling_requirement",
    to: "nhm2.claim_boundary.literature_not_validation",
    relation: "blocks",
    label: "QEI literature constrains the route but does not complete the repository dossier.",
    claimBoundaryNote: "No QEI completion or external-validation claim is allowed.",
  },
  {
    id: "qei_dossier_blocks_literature_boundary",
    from: "nhm2.qei.worldline_dossier",
    to: "nhm2.claim_boundary.literature_not_validation",
    relation: "blocks",
    label: "The QEI dossier must be repository evidence and cannot be substituted by literature context.",
    claimBoundaryNote: "No QEI completion or external-validation claim is allowed.",
  },
  {
    id: "full_solve_boundary_documents_nhm2_diagnostic_boundary",
    from: "nhm2.artifact.frozen_reference_run_provenance",
    to: "nhm2.claim_boundary.diagnostic_only",
    relation: "documents",
    label: "Frozen-run provenance documents which rows are diagnostic, review, blocked, or unsupported.",
    claimBoundaryNote: "Artifact governance cannot promote a physical mechanism claim by itself.",
  },
  {
    id: "literature_boundary_documents_claim_locks",
    from: "nhm2.claim_boundary.literature_not_validation",
    to: "nhm2.claim_boundary.diagnostic_only",
    relation: "documents",
    label: "The literature boundary documents the broader NHM2 diagnostic-only claim lock.",
    claimBoundaryNote: "Formalism context never substitutes for repository artifact status.",
  },
];

export function buildNhm2FullSolveTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: NHM2_FULL_SOLVE_THEORY_BADGES.map((badge: TheoryBadgeV1) => ({ ...badge })),
    edges: NHM2_FULL_SOLVE_THEORY_EDGES.map((edge: TheoryBadgeEdgeV1) => ({ ...edge })),
  };
}
