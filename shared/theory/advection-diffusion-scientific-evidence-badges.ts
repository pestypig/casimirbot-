import type {
  TheoryBadgeClaimBoundaryV1,
  TheoryBadgeEdgeV1,
  TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

export const ADVECTION_DIFFUSION_MODEL_BADGE_ID =
  "science.transport.advection_diffusion_full_1d" as const;
export const ADVECTION_DIFFUSION_FORMAL_CONTRACT_BADGE_ID =
  "science.transport.zero_gradient_diffusive_flux_contract" as const;
export const ADVECTION_DIFFUSION_CLOSURE_BADGE_ID =
  "science.evidence.advection_diffusion_diffusivity_intervention" as const;

const EVIDENCE_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

const source = (
  kind: TheoryBadgeV1["sourceRefs"][number]["kind"],
  path: string,
  id: string,
  note: string,
): TheoryBadgeV1["sourceRefs"][number] => ({ kind, path, id, note });

export function buildAdvectionDiffusionScientificEvidenceBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  const upstreamSpecPath =
    "specifications/advection_diffusion_full_1d.rkt";
  const upstreamProofPath = "proofs/advection_diffusion_full_1d.lean";
  const conformancePath =
    "shared/contracts/scientific-evidence-conformance-manifest.v1.ts";
  const primaryPath =
    "tools/casimir-numerical/advection-diffusion-lanyon-closure-primary.c";
  const independentPath =
    "tools/casimir-numerical/advection-diffusion-independent-rk2.c";

  const badges: TheoryBadgeV1[] = [
    {
      id: ADVECTION_DIFFUSION_MODEL_BADGE_ID,
      title: "One-dimensional advection–diffusion model",
      plainMeaning:
        "A concentration field is transported at fixed velocity and diffuses with a nonnegative scalar diffusivity on a periodic one-dimensional domain.",
      whyItMatters:
        "This is the registered numerical source claim whose baseline and permitted diffusivity intervention can be compared without treating the computation as empirical evidence.",
      subjects: ["advection_diffusion", "scientific_evidence_closure", "transport"],
      level: "model",
      status: "project_derived",
      simulationOwners: ["scientific_evidence_closure"],
      equationFamilies: ["advection_diffusion_full_1d"],
      tags: [
        "lanyon_pinned_source",
        "open_world",
        "synthetic_computation",
      ],
      equations: [
        {
          id: "equation:advection-diffusion-full-1d",
          role: "law",
          displayLatex:
            "\\partial_t u + a\\,\\partial_x u = D_{xx}\\,\\partial_{xx}u",
          computableExpression: null,
          operatorKind: "field_sample",
          inputSymbols: ["a", "Dxx", "u", "x", "t"],
          outputSymbols: ["u"],
        },
      ],
      units: [
        {
          symbol: "a",
          unit: "m s^-1",
          quantity: "advection velocity",
          dimensionSignature: "L T^-1",
        },
        {
          symbol: "Dxx",
          unit: "m^2 s^-1",
          quantity: "diffusivity",
          dimensionSignature: "L^2 T^-1",
        },
        {
          symbol: "u",
          unit: "1",
          quantity: "normalized concentration",
          dimensionSignature: "1",
        },
      ],
      assumptions: [
        "The domain is periodic on x in [0, 1].",
        "The enrolled case fixes a = 0.5 m s^-1 and final time = 0.05 s.",
        "The baseline Dxx value is 0.01 m^2 s^-1.",
        "This model badge is not a measurement receipt or a claim of physical realization.",
      ],
      calculatorPayloads: [],
      sourceRefs: [
        source(
          "artifact",
          upstreamSpecPath,
          "lanyon:advection_diffusion_full_1d:spec",
          "Exact source path inside the pinned Lanyon repository snapshot.",
        ),
        source(
          "artifact",
          "shared/contracts/__tests__/fixtures/casimir-spec/advection-diffusion.open-world.valid.v1.json",
          "casimir-spec:advection-diffusion-open-world",
          "Open-world semantic claim fixture; it does not itself establish execution.",
        ),
      ],
      observables: [
        {
          id: "observable:advection-diffusion-solution",
          canonicalObservableId:
            "observable.canonical.advection_diffusion.normalized_solution",
          symbol: "u",
          quantity: "normalized periodic solution field",
          mathematicalType: "vector",
          unit: "1",
          dimensionSignature: "1",
          coordinateFrame: "periodic_domain_frame",
          operationalDefinitionRef:
            "casimir-spec:advection-diffusion-open-world",
          responseModelRef: "lanyon:advection_diffusion_full_1d:spec",
        },
      ],
      hintKeys: {
        subjects: [
          "advection diffusion",
          "diffusivity intervention",
          "scientific evidence closure",
        ],
        symbols: ["Dxx", "a", "u"],
        unitSignatures: ["1", "L T^-1", "L^2 T^-1"],
        repoPaths: [
          upstreamSpecPath,
          "shared/contracts/__tests__/fixtures/casimir-spec/advection-diffusion.open-world.valid.v1.json",
        ],
        equationFamilies: ["advection_diffusion_full_1d"],
        simulationOwners: ["scientific_evidence_closure"],
      },
      claimBoundary: EVIDENCE_BOUNDARY,
    },
    {
      id: ADVECTION_DIFFUSION_FORMAL_CONTRACT_BADGE_ID,
      title: "Zero-gradient diffusive-flux contract",
      plainMeaning:
        "For the enrolled constitutive definition, a zero spatial gradient produces zero diffusive flux for every diffusivity value.",
      whyItMatters:
        "This exact subclaim can be semantically bound to the named Lean theorem without pretending that Lean proves the full PDE, a numerical implementation, or the underlying physics.",
      subjects: ["advection_diffusion", "formal_contract", "scientific_evidence_closure"],
      level: "derived_relation",
      status: "project_derived",
      simulationOwners: ["scientific_evidence_closure"],
      equationFamilies: ["diffusive_flux_contract"],
      tags: [
        "contract_subclaim",
        "lean_replay_required",
        "non_promotion",
      ],
      equations: [
        {
          id: "equation:zero-gradient-zero-diffusive-flux",
          role: "constraint",
          displayLatex:
            "\\partial_x u = 0 \\Longrightarrow F_{\\mathrm{diff}} = D_{xx}\\partial_xu = 0",
          computableExpression: null,
          operatorKind: "noncomputable_reference",
          inputSymbols: ["Dxx", "partial_x_u"],
          outputSymbols: ["F_diff"],
        },
      ],
      units: [
        {
          symbol: "Dxx",
          unit: "m^2 s^-1",
          quantity: "diffusivity",
          dimensionSignature: "L^2 T^-1",
        },
        {
          symbol: "partial_x_u",
          unit: "m^-1",
          quantity: "normalized concentration gradient",
          dimensionSignature: "L^-1",
        },
      ],
      assumptions: [
        "The theorem is interpreted only through a reviewed semantic-to-Lean binding.",
        "Successful kernel replay establishes elaboration of the exact proposition in the pinned environment.",
        "It does not establish numerical convergence, implementation correctness, empirical validity, or physical truth.",
      ],
      calculatorPayloads: [],
      sourceRefs: [
        source(
          "artifact",
          upstreamProofPath,
          "lanyon:advection_diffusion_full_1d:xDiffusiveFluxConsistency",
          "Pinned Lean declaration advection_diffusion_full_1d.xDiffusiveFluxConsistency.",
        ),
        source(
          "repo_module",
          conformancePath,
          "scientific-evidence-conformance-manifest/v1",
          "Hash-bound orientation, parameter, executor, and claim-ceiling policy.",
        ),
      ],
      hintKeys: {
        subjects: [
          "contract-level Lean proposition",
          "zero gradient diffusive flux",
        ],
        symbols: ["Dxx", "F_diff", "partial_x_u"],
        unitSignatures: ["L^-1", "L^2 T^-1"],
        repoPaths: [upstreamProofPath, conformancePath],
        equationFamilies: ["diffusive_flux_contract"],
        simulationOwners: ["scientific_evidence_closure"],
      },
      claimBoundary: EVIDENCE_BOUNDARY,
    },
    {
      id: ADVECTION_DIFFUSION_CLOSURE_BADGE_ID,
      title: "Diffusivity-intervention evidence closure",
      plainMeaning:
        "Compare the enrolled Dxx = 0.01 baseline with the permitted Dxx = 0.02 intervention through a pinned formal contract and two distinct numerical solvers.",
      whyItMatters:
        "It is the first generic traversable orientation that can yield a hash-bound synthetic closure packet for current-turn reasoning while keeping formal, numerical, empirical, and physical claims separate.",
      subjects: ["evidence_congruence", "parameter_intervention", "scientific_evidence_closure"],
      level: "diagnostic_gate",
      status: "diagnostic",
      simulationOwners: ["scientific_evidence_closure"],
      equationFamilies: [
        "advection_diffusion_full_1d",
        "scientific_evidence_congruence",
      ],
      tags: [
        "baseline_vs_intervention",
        "dual_numerical_solver",
        "immutable_receipt",
        "same_turn_reentry_required",
      ],
      equations: [
        {
          id: "gate:scientific-evidence-congruence",
          role: "gate",
          displayLatex:
            "G_{closure}=G_{source}\\land G_{semantic}\\land G_{graph}\\land G_{formal}\\land G_{num}\\land G_{comparison}",
          computableExpression: null,
          operatorKind: "gate_status",
          inputSymbols: [
            "formal_certificate",
            "independent_numerical_certificate",
            "manifest",
          ],
          outputSymbols: ["closure_status"],
        },
      ],
      units: [
        {
          symbol: "Dxx",
          unit: "m^2 s^-1",
          quantity: "permitted intervention parameter",
          dimensionSignature: "L^2 T^-1",
        },
      ],
      assumptions: [
        "Only Dxx may change, from the enrolled baseline 0.01 to the enrolled intervention 0.02 m^2 s^-1.",
        "The velocity, domain, initial condition, boundary condition, final time, grids, observables, and tolerances remain frozen.",
        "Both numerical lanes must replay twice and have distinct source and build lineages.",
        "A passed packet supports bounded synthetic comparison only; it is not measured evidence.",
      ],
      calculatorPayloads: [],
      sourceRefs: [
        source(
          "repo_module",
          conformancePath,
          "scientific-evidence-conformance-manifest/v1",
          "Generic enrollment and closure policy.",
        ),
        source(
          "repo_module",
          primaryPath,
          "numerical:advection-diffusion:lanyon-primary",
          "Primary finite-volume lane using pinned Lanyon flux functions.",
        ),
        source(
          "repo_module",
          independentPath,
          "numerical:advection-diffusion:independent-rk2",
          "Independent centered method-of-lines/RK2 numerical solver.",
        ),
      ],
      observables: [
        {
          id: "observable:solution-l2-congruence",
          canonicalObservableId:
            "observable.canonical.advection_diffusion.solution_l2_congruence",
          symbol: "epsilon_L2",
          quantity: "L2 discrepancy between the two numerical lanes",
          mathematicalType: "scalar",
          unit: "1",
          dimensionSignature: "1",
          coordinateFrame: "periodic_domain_frame",
          operationalDefinitionRef:
            "scientific-evidence-conformance-manifest/v1",
          responseModelRef: "numerical:advection-diffusion:independent-rk2",
        },
      ],
      hintKeys: {
        subjects: [
          "baseline versus modified experiment",
          "congruence",
          "scientific evidence closure",
        ],
        symbols: ["Dxx", "epsilon_L2"],
        unitSignatures: ["1", "L^2 T^-1"],
        repoPaths: [conformancePath, independentPath, primaryPath],
        equationFamilies: [
          "advection_diffusion_full_1d",
          "scientific_evidence_congruence",
        ],
        simulationOwners: ["scientific_evidence_closure"],
      },
      claimBoundary: EVIDENCE_BOUNDARY,
    },
  ];

  const edges: TheoryBadgeEdgeV1[] = [
    {
      id: "advection_diffusion_model_requires_zero_gradient_contract",
      from: ADVECTION_DIFFUSION_MODEL_BADGE_ID,
      to: ADVECTION_DIFFUSION_FORMAL_CONTRACT_BADGE_ID,
      relation: "specializes",
      label:
        "The zero-gradient proposition is a deliberately narrow constitutive subclaim of the enrolled transport model.",
      claimBoundaryNote:
        "Formal closure of the subclaim cannot be promoted to proof of the complete PDE or physics.",
    },
    {
      id: "advection_diffusion_model_feeds_diffusivity_intervention",
      from: ADVECTION_DIFFUSION_MODEL_BADGE_ID,
      to: ADVECTION_DIFFUSION_CLOSURE_BADGE_ID,
      relation: "numerically_solves",
      label:
        "The dual numerical lanes evaluate the same frozen model under the enrolled baseline and diffusivity intervention.",
      claimBoundaryNote:
        "Numerical agreement is bounded synthetic evidence, not implementation correctness or empirical validation.",
    },
    {
      id: "zero_gradient_contract_checks_diffusivity_intervention",
      from: ADVECTION_DIFFUSION_FORMAL_CONTRACT_BADGE_ID,
      to: ADVECTION_DIFFUSION_CLOSURE_BADGE_ID,
      relation: "diagnostic_checks",
      label:
        "Pinned Lean replay checks that the zero-gradient diffusive-flux contract remains invariant under the permitted Dxx intervention.",
      claimBoundaryNote:
        "The formal check is independent of and does not certify the numerical solver outputs.",
    },
  ];
  return { badges, edges };
}
