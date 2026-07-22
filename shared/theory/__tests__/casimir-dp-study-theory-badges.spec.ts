import { describe, expect, it } from "vitest";
import { isTheoryBadgeGraphV1 } from "../../contracts/theory-badge-graph.v1";
import { buildCasimirDpStudyTheoryBadgesV1 } from "../casimir-dp-study-theory-badges";
import { buildHelixTheoryBadgeGraphV1 } from "../helix-theory-badge-graph";
import { locateTheoryBadges } from "../theory-badge-overlap-locator";
import type { TheoryBadgeLookupMatch } from "../theory-badge-overlap-locator";

describe("Casimir / DP quantum-foam study badges", () => {
  it("registers the separated study lane in the canonical graph", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const graph = buildHelixTheoryBadgeGraphV1();
    const ids = graph.badges.map((badge) => badge.id);

    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
    expect(ids).toEqual(
      expect.arrayContaining([
        "study.casimir_dp.protocol",
        "study.casimir_dp.manifold_response_hypothesis",
        "study.casimir_dp.decoherence_collapse_gate",
        "study.casimir_dp.quantum_foam_hypothesis",
        "study.casimir_dp.observable_separation_gate",
        "study.casimir_dp.frequency_bridge_gate",
        "study.casimir_dp.experiment_design_campaign",
        "study.casimir_dp.gated_computations_stage1",
        "study.casimir_dp.data_readiness_stage1",
        "study.casimir_dp.proposal_closure",
        "study.casimir_dp.claim_boundary",
      ]),
    );
    expect(branch.badges.every((badge) => badge.claimBoundary.diagnosticOnly)).toBe(true);
    expect(branch.badges.every((badge) => badge.claimBoundary.promotionAllowed === false)).toBe(true);
  });

  it("registers proposal completeness separately from commissioning and evidence", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const proposal = branch.badges.find(
      (badge) => badge.id === "study.casimir_dp.proposal_closure",
    );

    expect(proposal?.status).toBe("diagnostic");
    expect(proposal?.tags).toEqual(expect.arrayContaining([
      "proposal_complete",
      "commissioning_conditional",
      "hardware_not_validated",
    ]));
    expect(proposal?.equations.map((equation) => equation.id)).toContain(
      "casimir_dp_proposal_phase_force_bound",
    );
    expect(proposal?.claimBoundary.promotionAllowed).toBe(false);
    expect(branch.edges.some((edge) => edge.from === proposal?.id && edge.relation === "blocks")).toBe(true);
  });

  it("registers data-readiness numerics without promoting synthetic fixtures", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const readiness = branch.badges.find(
      (badge) => badge.id === "study.casimir_dp.data_readiness_stage1",
    );

    expect(readiness?.status).toBe("diagnostic");
    expect(readiness?.tags).toEqual(expect.arrayContaining(["synthetic_validation", "measured_evidence_open"]));
    expect(readiness?.equations.map((equation) => equation.id)).toEqual(expect.arrayContaining([
      "casimir_dp_data_readiness_kramers_kronig",
      "casimir_dp_data_readiness_correlation_power",
      "casimir_dp_data_readiness_measured_gate",
    ]));
    expect(readiness?.claimBoundary.promotionAllowed).toBe(false);
    expect(branch.edges.some((edge) => edge.from === readiness?.id && edge.relation === "blocks")).toBe(true);
  });

  it("exposes the role-separated campaign as diagnostic design evidence only", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const campaign = branch.badges.find(
      (badge) => badge.id === "study.casimir_dp.experiment_design_campaign",
    );

    expect(campaign?.status).toBe("diagnostic");
    expect(campaign?.tags).toEqual(expect.arrayContaining(["design_only", "no_physics_winner"]));
    expect(campaign?.equations[0]?.computableExpression).toBe("R_access = Gamma_DP/Gamma_env");
    expect(campaign?.claimBoundary.promotionAllowed).toBe(false);
    expect(branch.edges.some((edge) => edge.from === campaign?.id && edge.relation === "blocks")).toBe(true);
  });

  it("registers Stage-1 numerical progress without closing physical evidence gates", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const stage1 = branch.badges.find(
      (badge) => badge.id === "study.casimir_dp.gated_computations_stage1",
    );

    expect(stage1?.status).toBe("diagnostic");
    expect(stage1?.tags).toEqual(expect.arrayContaining(["stage_1", "promotion_blocked"]));
    expect(stage1?.equations.map((equation) => equation.id)).toContain(
      "casimir_dp_stage1_manifold_registration_gate",
    );
    expect(stage1?.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
    expect(branch.edges.some((edge) => edge.from === stage1?.id && edge.relation === "blocks")).toBe(true);
  });

  it("keeps manifold response at Stage 0 and decoherence distinct from objective collapse", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const hypothesis = branch.badges.find(
      (badge) => badge.id === "study.casimir_dp.manifold_response_hypothesis",
    );
    const gate = branch.badges.find((badge) => badge.id === "study.casimir_dp.decoherence_collapse_gate");

    expect(hypothesis?.status).toBe("blocked");
    expect(hypothesis?.tags).toContain("stage_0");
    expect(hypothesis?.calculatorPayloads).toEqual([]);
    expect(hypothesis?.equations.find((equation) => equation.id === "manifold_response_slot")?.operatorKind).toBe(
      "noncomputable_reference",
    );
    expect(gate?.status).toBe("blocked");
    expect(gate?.observables?.map((observable) => observable.canonicalObservableId)).toEqual([
      "observable.coherence.boundary_conditioned_decay_residual",
      "observable.collapse.objective_rate",
    ]);
    expect(branch.edges.some((edge) => edge.from === gate?.id && edge.relation === "blocks")).toBe(true);
  });

  it("fails closed instead of inventing a Casimir-to-DP observable bridge", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const gate = branch.badges.find((badge) => badge.id === "study.casimir_dp.observable_separation_gate");
    const hypothesis = branch.badges.find((badge) => badge.id === "study.casimir_dp.quantum_foam_hypothesis");
    const observableIds = gate?.observables?.map((observable) => observable.canonicalObservableId) ?? [];

    expect(gate?.status).toBe("blocked");
    expect(observableIds).toEqual([
      "observable.casimir.force_residual",
      "observable.dp.gravitational_self_energy_difference",
    ]);
    expect(branch.edges.some((edge) => edge.observableBridge != null)).toBe(false);
    expect(hypothesis?.calculatorPayloads).toEqual([]);
    expect(hypothesis?.equations[0]?.operatorKind).toBe("noncomputable_reference");
  });

  it("keeps Compton, DP, and cavity frequencies separate until a transfer kernel exists", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const gate = branch.badges.find((badge) => badge.id === "study.casimir_dp.frequency_bridge_gate");

    expect(gate?.status).toBe("blocked");
    expect(gate?.tags).toEqual(expect.arrayContaining(["missing_transfer_kernel", "no_resonance_claim"]));
    expect(gate?.equations.map((equation) => equation.id)).toEqual([
      "compton_dp_frequency_identities",
      "compton_dp_cavity_bridge_gate",
    ]);
    expect(gate?.calculatorPayloads).toEqual([]);
    expect(branch.edges.some((edge) => edge.from === gate?.id && edge.to === "study.casimir_dp.manifold_response_hypothesis" && edge.relation === "requires")).toBe(true);
    expect(branch.edges.some((edge) => edge.from === gate?.id && edge.relation === "blocks")).toBe(true);
  });

  it("is locatable for study, Casimir, DP, and quantum-foam prompts", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const matches = locateTheoryBadges({
      graph,
      input: {
        query: "Open the CDP-QF-1 Casimir Diósi-Penrose quantum foam manifold-response study and explain the decoherence and observable gates",
        simulationOwners: ["casimir_dp_study"],
        limit: 20,
      },
    });
    expect(matches.map((match: TheoryBadgeLookupMatch) => match.badgeId)).toEqual(
      expect.arrayContaining([
        "study.casimir_dp.protocol",
        "study.casimir_dp.manifold_response_hypothesis",
        "study.casimir_dp.observable_separation_gate",
      ]),
    );
  });
});
