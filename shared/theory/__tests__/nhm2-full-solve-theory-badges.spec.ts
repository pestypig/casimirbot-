import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isTheoryBadgeGraphV1, validateTheoryBadgeGraphV1, type TheoryBadgeV1 } from "../../contracts/theory-badge-graph.v1";
import { buildHelixTheoryBadgeGraphV1 } from "../helix-theory-badge-graph";
import {
  buildNhm2FullSolveTheoryBadgesV1,
  evaluateNhm2SteeringBondiFluxGate,
} from "../nhm2-full-solve-theory-badges";

const forbiddenPhrase = (...parts: string[]): RegExp => new RegExp(parts.join(""), "i");

describe("NHM2 full-solve theory badges", () => {
  const newClosureStackBadgeIds = [
    "nhm2.tensor.same_chart_full_tensor",
    "nhm2.source.component_authority_ledger",
    "nhm2.source.same_basis_tensor_authority",
    "nhm2.closure.wall_t00_source_residual",
    "nhm2.closure.coupled_pass_candidate",
    "nhm2.closure.regional_tensor_pass_path_harness",
    "nhm2.dynamic.switching_covariant_conservation",
    "nhm2.dynamic.frequency_convergence",
    "nhm2.dynamic.effective_geometry_agreement",
    "nhm2.dynamic.time_dependent_source_campaign",
    "nhm2.metric_required.momentum_remediation_targets",
    "nhm2.campaign.frontier_disposition",
    "nhm2.profile.campaign_search",
    "nhm2.profile.candidate_metric_profile_spec",
    "nhm2.profile.campaign_run_manifest",
    "nhm2.energy_condition.observer_robust_gate",
    "nhm2.qei.worldline_dossier",
    "casimir.material.lifshitz_receipt",
    "casimir.geometry.beyond_pfa_validity",
    "casimir.geometry.finite_temperature_maxwell_stress",
    "nhm2.mechanical.support_retention_overlap",
    "nhm2.transport.steering_bondi_flux_budget",
    "nhm2.natario.invariant_audit",
  ];
  const leanFormalBadgeIds = [
    "nhm2.formal.lean_certificate",
    "nhm2.formal.diagnostic_campaign_admissible",
    "nhm2.formal.claim_locks_closed",
    "nhm2.formal.negative_fixtures_fail_closed",
    "nhm2.formal.certificate_hashes_pinned",
  ];
  const physicalEvidenceBadgeIds = [
    "nhm2.experimental.physical_viability_campaign",
    "nhm2.experimental.theory_solve_roadmap",
    "nhm2.experimental.parameter_targets",
    "nhm2.experimental.research_gap_ledger",
    "nhm2.experimental.layer_stack_mechanical_receipt",
    "nhm2.experimental.layer_stack_support_fraction_sweep",
    "nhm2.experimental.layer_stack_architecture_loop",
    "nhm2.experimental.full_apparatus_receipt_loop",
    "nhm2.experimental.tile_source_physical_validation_plan",
    "nhm2.experimental.prediction_freeze",
    "nhm2.experimental.tile_force_receipt",
    "nhm2.experimental.tile_cycle_energy_balance",
    "nhm2.experimental.array_scaling",
    "nhm2.experimental.full_apparatus_tensor",
    "nhm2.experimental.vacuum_weight",
    "nhm2.experimental.metric_upper_bound",
    "nhm2.experimental.invariant_metric_response",
    "nhm2.experimental.geodesic_response",
    "nhm2.experimental.independent_replication",
    "nhm2.claim_boundary.physical_viability_locked",
    "nhm2.claim_boundary.transport_locked",
  ];

  it("builds NHM2 full-solve badges with no validation or promotion boundary", () => {
    const { badges, edges } = buildNhm2FullSolveTheoryBadgesV1();

    expect(badges.length).toBeGreaterThanOrEqual(15);
    expect(edges.length).toBeGreaterThanOrEqual(14);

    for (const badge of badges) {
      expect(badge.claimBoundary.diagnosticOnly).toBe(true);
      expect(badge.claimBoundary.doesValidateNHM2).toBe(false);
      expect(badge.claimBoundary.validationClaimAllowed).toBe(false);
      expect(badge.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
      expect(badge.claimBoundary.promotionAllowed).toBe(false);
    }
  });

  it("includes the whitepaper projection grammar as first-class badges", () => {
    const ids = buildNhm2FullSolveTheoryBadgesV1().badges.map((badge: TheoryBadgeV1) => badge.id);

    expect(ids).toContain("nhm2.observer.eulerian_normal");
    expect(ids).toContain("nhm2.observer.energy_density_projection");
    expect(ids).toContain("nhm2.observer.momentum_density_projection");
    expect(ids).toContain("nhm2.observer.spatial_stress_projection");
    expect(ids).toContain("nhm2.tensor.metric_required_stress_energy");
    expect(ids).toContain("nhm2.tensor.tile_effective_counterpart");
    expect(ids).toContain("nhm2.source.component_authority_ledger");
    expect(ids).toContain("nhm2.source.same_basis_tensor_authority");
    expect(ids).toContain("nhm2.source.wall_t00_trace");
    expect(ids).toContain("nhm2.tensor.full_authority_gate");
    expect(ids).toContain("nhm2.tensor.same_chart_full_tensor");
    expect(ids).toContain("nhm2.closure.same_basis_regional_residual");
    expect(ids).toContain("nhm2.closure.coupled_pass_candidate");
    expect(ids).toContain("nhm2.closure.regional_tensor_pass_path_harness");
    expect(ids).toContain("nhm2.dynamic.switching_covariant_conservation");
    expect(ids).toContain("nhm2.dynamic.frequency_convergence");
    expect(ids).toContain("nhm2.dynamic.effective_geometry_agreement");
    expect(ids).toContain("nhm2.dynamic.time_dependent_source_campaign");
    expect(ids).toContain("nhm2.metric_required.momentum_remediation_targets");
    expect(ids).toContain("nhm2.campaign.frontier_disposition");
    expect(ids).toContain("nhm2.profile.campaign_search");
    expect(ids).toContain("nhm2.profile.candidate_metric_profile_spec");
    expect(ids).toContain("nhm2.profile.campaign_run_manifest");
    expect(ids).toContain("nhm2.energy_condition.wec_nec_sec_dec_family");
    expect(ids).toContain("nhm2.energy_condition.observer_robust_gate");
    expect(ids).toContain("nhm2.qei.worldline_sampling_requirement");
    expect(ids).toContain("nhm2.qei.worldline_dossier");
    expect(ids).toContain("nhm2.natario.curvature_invariants");
    expect(ids).toContain("nhm2.natario.invariant_audit");
    expect(ids).toContain("nhm2.clock.centerline_tau_alpha_T");
    expect(ids).toContain("nhm2.clock.twin_paradox_trip_clocking");
    expect(ids).toContain("nhm2.clock.trip_clocking_profile_index");
    expect(ids).toContain("nhm2.artifact.frozen_reference_run_provenance");
    expect(ids).toEqual(expect.arrayContaining(leanFormalBadgeIds));
    expect(ids).toEqual(expect.arrayContaining(physicalEvidenceBadgeIds));
  });

  it("keeps promotion-sensitive routes blocked by claim boundaries", () => {
    const { edges } = buildNhm2FullSolveTheoryBadgesV1();

    expect(edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "nhm2.closure.same_basis_regional_residual",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.source.wall_t00_trace",
          to: "nhm2.claim_boundary.diagnostic_only",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.tensor.full_authority_gate",
          to: "nhm2.claim_boundary.diagonal_proxy_not_full_tensor",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.tensor.same_chart_full_tensor",
          to: "nhm2.closure.wall_t00_source_residual",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.source.same_basis_tensor_authority",
          to: "nhm2.closure.wall_t00_source_residual",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.tensor.same_chart_full_tensor",
          to: "nhm2.energy_condition.observer_robust_gate",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.clock.centerline_tau_alpha_T",
          to: "nhm2.claim_boundary.expected_clocking_not_route_result",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.clock.centerline_tau_alpha_T",
          to: "nhm2.clock.twin_paradox_trip_clocking",
          relation: "specializes",
        }),
        expect.objectContaining({
          from: "nhm2.clock.twin_paradox_trip_clocking",
          to: "nhm2.claim_boundary.expected_clocking_not_route_result",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.qei.worldline_sampling_requirement",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.qei.worldline_dossier",
          to: "nhm2.claim_boundary.literature_not_validation",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.natario.invariant_audit",
          to: "nhm2.energy_condition.observer_robust_gate",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.energy_condition.observer_robust_gate",
          to: "nhm2.claim_boundary.diagnostic_only",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.closure.regional_tensor_pass_path_harness",
          to: "nhm2.dynamic.time_dependent_source_campaign",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.dynamic.switching_covariant_conservation",
          to: "nhm2.dynamic.time_dependent_source_campaign",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.dynamic.frequency_convergence",
          to: "nhm2.dynamic.time_dependent_source_campaign",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.dynamic.effective_geometry_agreement",
          to: "nhm2.dynamic.time_dependent_source_campaign",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.metric_required.momentum_demand_audit",
          to: "nhm2.metric_required.momentum_remediation_targets",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.metric_required.momentum_remediation_targets",
          to: "nhm2.campaign.frontier_disposition",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.campaign.frontier_disposition",
          to: "nhm2.dynamic.time_dependent_source_campaign",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.campaign.frontier_disposition",
          to: "nhm2.profile.campaign_search",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.profile.campaign_search",
          to: "nhm2.dynamic.time_dependent_source_campaign",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.profile.campaign_search",
          to: "nhm2.profile.campaign_run_manifest",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.profile.campaign_search",
          to: "nhm2.profile.candidate_metric_profile_spec",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.profile.candidate_metric_profile_spec",
          to: "nhm2.profile.campaign_run_manifest",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.profile.candidate_metric_profile_spec",
          to: "nhm2.tensor.same_chart_full_tensor",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.profile.campaign_run_manifest",
          to: "nhm2.dynamic.time_dependent_source_campaign",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.dynamic.time_dependent_source_campaign",
          to: "nhm2.claim_boundary.diagnostic_only",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.dynamic.time_dependent_source_campaign",
          to: "nhm2.formal.lean_certificate",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.formal.certificate_hashes_pinned",
          to: "nhm2.formal.lean_certificate",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.formal.lean_certificate",
          to: "nhm2.formal.diagnostic_campaign_admissible",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.formal.negative_fixtures_fail_closed",
          to: "nhm2.formal.lean_certificate",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.formal.claim_locks_closed",
          to: "nhm2.formal.diagnostic_campaign_admissible",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.formal.claim_locks_closed",
          to: "nhm2.claim_boundary.diagnostic_only",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.formal.diagnostic_campaign_admissible",
          to: "nhm2.claim_boundary.diagnostic_only",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.dynamic.time_dependent_source_campaign",
          to: "nhm2.experimental.physical_viability_campaign",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.formal.claim_locks_closed",
          to: "nhm2.experimental.physical_viability_campaign",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.prediction_freeze",
          to: "nhm2.experimental.physical_viability_campaign",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.array_scaling",
          to: "nhm2.experimental.vacuum_weight",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.invariant_metric_response",
          to: "nhm2.claim_boundary.physical_viability_locked",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.geodesic_response",
          to: "nhm2.claim_boundary.transport_locked",
          relation: "blocks",
        }),
      ]),
    );
  });

  it("keeps non-scalar full-solve artifacts out of calculator payloads", () => {
    const badges = buildNhm2FullSolveTheoryBadgesV1().badges;
    const nonScalarIds = [
      "nhm2.tensor.same_chart_full_tensor",
      "nhm2.source.component_authority_ledger",
      "nhm2.source.same_basis_tensor_authority",
      "nhm2.closure.coupled_pass_candidate",
      "nhm2.closure.regional_tensor_pass_path_harness",
      "nhm2.dynamic.switching_covariant_conservation",
      "nhm2.dynamic.frequency_convergence",
      "nhm2.dynamic.effective_geometry_agreement",
      "nhm2.dynamic.time_dependent_source_campaign",
      "nhm2.metric_required.momentum_remediation_targets",
      "nhm2.campaign.frontier_disposition",
      "nhm2.profile.campaign_search",
      "nhm2.profile.campaign_run_manifest",
      "nhm2.energy_condition.observer_robust_gate",
      "nhm2.qei.worldline_dossier",
      "nhm2.natario.invariant_audit",
      "nhm2.clock.trip_clocking_profile_index",
      ...leanFormalBadgeIds,
      "nhm2.experimental.physical_viability_campaign",
      "nhm2.experimental.parameter_targets",
      "nhm2.experimental.research_gap_ledger",
      "nhm2.experimental.layer_stack_mechanical_receipt",
      "nhm2.experimental.layer_stack_support_fraction_sweep",
      "nhm2.transport.steering_bondi_flux_budget",
      "nhm2.experimental.layer_stack_architecture_loop",
      "nhm2.experimental.full_apparatus_receipt_loop",
      "nhm2.experimental.tile_source_physical_validation_plan",
      "nhm2.experimental.prediction_freeze",
      "nhm2.experimental.tile_force_receipt",
      "nhm2.experimental.full_apparatus_tensor",
      "nhm2.experimental.vacuum_weight",
      "nhm2.experimental.invariant_metric_response",
      "nhm2.experimental.geodesic_response",
      "nhm2.experimental.independent_replication",
      "nhm2.claim_boundary.physical_viability_locked",
      "nhm2.claim_boundary.transport_locked",
    ];

    for (const badgeId of nonScalarIds) {
      const badge = badges.find((candidate: TheoryBadgeV1) => candidate.id === badgeId);
      expect(badge?.calculatorPayloads).toEqual([]);
    }
  });

  it("wires Lean certificate badges to runtime refs without calculator payloads", () => {
    const badges = buildNhm2FullSolveTheoryBadgesV1().badges;
    const byId = new Map(badges.map((badge: TheoryBadgeV1) => [badge.id, badge]));

    for (const badgeId of leanFormalBadgeIds) {
      const badge = byId.get(badgeId);
      expect(badge, badgeId).toBeDefined();
      expect(badge?.calculatorPayloads).toEqual([]);
      expect(badge?.equations.every((equation) => equation.computableExpression == null)).toBe(true);
      expect(
        badge?.equations.every((equation) => equation.operatorKind === "noncomputable_reference"),
      ).toBe(true);
      expect(badge?.claimBoundary).toMatchObject({
        diagnosticOnly: true,
        doesValidateNHM2: false,
        validationClaimAllowed: false,
        physicalMechanismClaimAllowed: false,
        promotionAllowed: false,
      });
    }

    const leanCertificate = byId.get("nhm2.formal.lean_certificate");
    const refsText = JSON.stringify(leanCertificate?.sourceRefs);
    expect(refsText).toMatch(/nhm2-lean-campaign-certificate\.json/);
    expect(refsText).toMatch(
      /theory-runtime-output-manifest-alpha-0p7000-historical-import\.v1\.json/,
    );
    expect(refsText).toMatch(/CurrentCampaignCertificate\.lean/);
    expect(refsText).toMatch(/npm run formal:nhm2:certificate:check/);

    const manifestPath = leanCertificate?.sourceRefs.find(
      (ref) =>
        ref.kind === "artifact" &&
        ref.path?.endsWith(
          "theory-runtime-output-manifest-alpha-0p7000-historical-import.v1.json",
        ),
    )?.path;
    expect(manifestPath).toBeTruthy();
    const manifest = JSON.parse(readFileSync(manifestPath ?? "", "utf8")) as {
      schemaVersion: string;
      boundToExecution: boolean;
      entries: Array<{ freshness: string }>;
    };
    expect(manifest).toMatchObject({
      schemaVersion: "theory_runtime_output_manifest/v1",
      boundToExecution: false,
    });
    expect(manifest.entries).toHaveLength(39);
    expect(manifest.entries.every((entry) => entry.freshness === "preexisting")).toBe(true);

    for (const badgeId of [
      "nhm2.formal.lean_certificate",
      "nhm2.formal.diagnostic_campaign_admissible",
      "nhm2.formal.claim_locks_closed",
      "nhm2.formal.certificate_hashes_pinned",
    ]) {
      expect(JSON.stringify(byId.get(badgeId)?.sourceRefs), badgeId).toMatch(
        /theory-runtime-output-manifest-alpha-0p7000-historical-import\.v1\.json/,
      );
    }

    const certificatePath = leanCertificate?.sourceRefs.find(
      (ref) => ref.kind === "artifact" && ref.path?.endsWith("nhm2-lean-campaign-certificate.json"),
    )?.path;
    expect(certificatePath).toBeTruthy();
    const certificate = JSON.parse(readFileSync(certificatePath ?? "", "utf8")) as {
      claimLocks: Record<string, boolean>;
    };
    expect(certificate.claimLocks).toEqual({
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
      certifiedWarpSpeedClaimAllowed: false,
    });
  });

  it("keeps Lean formal certificate copy claim-safe", () => {
    const badges = buildNhm2FullSolveTheoryBadgesV1().badges.filter((badge: TheoryBadgeV1) =>
      leanFormalBadgeIds.includes(badge.id),
    );
    const text = JSON.stringify(badges);

    expect(text).toMatch(/Lean verifies diagnostic campaign admissibility from the emitted certificate/);
    expect(text).not.toMatch(forbiddenPhrase("Lean", " proves NHM2 is physically viable"));
    expect(text).not.toMatch(forbiddenPhrase("certified", " warp speed"));
    expect(text).not.toMatch(forbiddenPhrase("transport", " certified"));
    expect(text).not.toMatch(forbiddenPhrase("route ETA", " certified"));
    expect(text).not.toMatch(forbiddenPhrase("\\bcertified", " speed\\b"));
    expect(text).not.toMatch(forbiddenPhrase("material", " realization"));
  });

  it("wires the physical evidence campaign without promoting diagnostic campaign pass", () => {
    const badges = buildNhm2FullSolveTheoryBadgesV1().badges;
    const byId = new Map(badges.map((badge: TheoryBadgeV1) => [badge.id, badge]));

    for (const badgeId of physicalEvidenceBadgeIds) {
      const badge = byId.get(badgeId);
      expect(badge, badgeId).toBeDefined();
      expect(badge?.claimBoundary).toMatchObject({
        diagnosticOnly: true,
        doesValidateNHM2: false,
        validationClaimAllowed: false,
        physicalMechanismClaimAllowed: false,
        promotionAllowed: false,
      });
    }

    const campaign = byId.get("nhm2.experimental.physical_viability_campaign");
    expect(JSON.stringify(campaign)).toMatch(/diagnostic campaign can feed this ladder/i);
    expect(JSON.stringify(campaign)).toMatch(/cannot substitute for experimental receipts/i);
    expect(JSON.stringify(campaign?.sourceRefs)).toMatch(/nhm2-lean-campaign-certificate\.json/);

    const roadmap = byId.get("nhm2.experimental.theory_solve_roadmap");
    expect(roadmap?.calculatorPayloads).toEqual([]);
    expect(JSON.stringify(roadmap?.sourceRefs)).toMatch(
      /nhm2-experiment-facing-theory-roadmap\.v1\.ts/,
    );
    expect(JSON.stringify(roadmap?.sourceRefs)).toMatch(/nature10561/);
    expect(JSON.stringify(roadmap?.sourceRefs)).toMatch(/0902\.4022/);
    expect(JSON.stringify(roadmap?.sourceRefs)).toMatch(/gr-qc\/9702026/);
    expect(JSON.stringify(roadmap)).toMatch(/roadmap is an experiment-planning artifact/i);

    const parameterTargets = byId.get("nhm2.experimental.parameter_targets");
    expect(parameterTargets?.calculatorPayloads).toEqual([]);
    expect(JSON.stringify(parameterTargets?.sourceRefs)).toMatch(
      /nhm2-experiment-parameter-targets\.v1\.ts/,
    );
    expect(JSON.stringify(parameterTargets?.sourceRefs)).toMatch(/PhysRevApplied\.15\.034063/);
    expect(JSON.stringify(parameterTargets)).toMatch(/modeled scalar rows/i);
    expect(JSON.stringify(parameterTargets)).toMatch(/cannot substitute/i);

    const researchGapLedger = byId.get("nhm2.experimental.research_gap_ledger");
    expect(researchGapLedger?.calculatorPayloads).toEqual([]);
    expect(JSON.stringify(researchGapLedger?.sourceRefs)).toMatch(
      /nhm2-experiment-research-gap-ledger\.v1\.ts/,
    );
    expect(JSON.stringify(researchGapLedger?.sourceRefs)).toMatch(/1401\.0784/);
    expect(JSON.stringify(researchGapLedger?.sourceRefs)).toMatch(/1505\.04169/);
    expect(JSON.stringify(researchGapLedger?.sourceRefs)).toMatch(/2602\.18023/);
    expect(JSON.stringify(researchGapLedger)).toMatch(/No direct precedent found is not a novelty claim/i);
    expect(JSON.stringify(researchGapLedger)).not.toMatch(
      new RegExp(["never", "done"].join("\\s+"), "i"),
    );

    const layerStackMechanicalReceipt = byId.get("nhm2.experimental.layer_stack_mechanical_receipt");
    expect(layerStackMechanicalReceipt?.calculatorPayloads).toEqual([]);
    expect(JSON.stringify(layerStackMechanicalReceipt?.sourceRefs)).toMatch(
      /nhm2-layer-stack-mechanical-receipt\.v1\.ts/,
    );
    expect(JSON.stringify(layerStackMechanicalReceipt?.sourceRefs)).not.toMatch(
      /nhm2-layer-stack-mechanical-receipt\.json/,
    );
    expect(JSON.stringify(layerStackMechanicalReceipt)).toMatch(
      /does not publish a layer-stack mechanical receipt artifact/i,
    );
    expect(JSON.stringify(layerStackMechanicalReceipt)).toMatch(/14\.2 kN internal normal attraction/i);
    expect(JSON.stringify(layerStackMechanicalReceipt)).toMatch(/not thrust/i);

    const supportFractionSweep = byId.get("nhm2.experimental.layer_stack_support_fraction_sweep");
    expect(supportFractionSweep?.calculatorPayloads).toEqual([]);
    expect(JSON.stringify(supportFractionSweep?.sourceRefs)).toMatch(
      /nhm2-layer-stack-support-fraction-sweep\.v1\.ts/,
    );
    expect(JSON.stringify(supportFractionSweep)).toMatch(/stress limits and wall-source retention/i);
    expect(JSON.stringify(supportFractionSweep)).toMatch(/not material evidence/i);

    const architectureLoop = byId.get("nhm2.experimental.layer_stack_architecture_loop");
    expect(architectureLoop?.calculatorPayloads).toEqual([]);
    expect(JSON.stringify(architectureLoop?.sourceRefs)).toMatch(
      /nhm2-layer-stack-engineering-architecture-loop\.v1\.ts/,
    );
    expect(JSON.stringify(architectureLoop)).toMatch(/decouple load support from active Casimir area/i);
    expect(JSON.stringify(architectureLoop)).toMatch(/pull-in, roughness, patch, material, active-control, and tensor blockers/i);
    expect(JSON.stringify(architectureLoop)).toMatch(/not material-source evidence/i);

    const receiptLoop = byId.get("nhm2.experimental.full_apparatus_receipt_loop");
    expect(receiptLoop?.calculatorPayloads).toEqual([]);
    expect(JSON.stringify(receiptLoop?.sourceRefs)).toMatch(
      /nhm2-layer-stack-full-apparatus-receipt-loop\.v1\.ts/,
    );
    expect(JSON.stringify(receiptLoop)).toMatch(/material, force-gap, pull-in, roughness, patch-potential, active-control, fatigue, layer-scaling/i);
    expect(JSON.stringify(receiptLoop)).toMatch(/not material receipts/i);
    expect(JSON.stringify(receiptLoop)).toMatch(/does not unlock physical, transport, propulsion, route, or speed claims/i);

    const validationPlan = byId.get("nhm2.experimental.tile_source_physical_validation_plan");
    expect(validationPlan?.calculatorPayloads).toEqual([]);
    expect(JSON.stringify(validationPlan?.sourceRefs)).toMatch(
      /nhm2-tile-source-physical-validation-plan\.v1\.ts/,
    );
    expect(JSON.stringify(validationPlan)).toMatch(/physically credible source candidate still requires downstream/i);
    expect(JSON.stringify(validationPlan)).toMatch(/Ideal scalar Casimir formulas/i);
    expect(JSON.stringify(validationPlan)).toMatch(/cannot substitute for material evidence or transport claims/i);

    expect(byId.get("nhm2.experimental.tile_cycle_energy_balance")?.calculatorPayloads.map(
      (payload) => payload.expression,
    )).toEqual(["delta_m = DeltaE/c^2", "delta_F = g*DeltaE/c^2"]);
    expect(byId.get("nhm2.experimental.array_scaling")?.calculatorPayloads.map(
      (payload) => payload.expression,
    )).toEqual(["array_scaling = DeltaE_N/(N*DeltaE_1)"]);
    expect(byId.get("nhm2.experimental.metric_upper_bound")?.calculatorPayloads.map(
      (payload) => payload.expression,
    )).toEqual(["h00_proxy = 2*G*DeltaE/(r*c^4)"]);
  });

  it("exposes the frozen support-retention overlap as a blocked scalar gate", () => {
    const { badges, edges } = buildNhm2FullSolveTheoryBadgesV1();
    const badge = badges.find(
      (candidate: TheoryBadgeV1) =>
        candidate.id === "nhm2.mechanical.support_retention_overlap",
    );
    const setupVariables = new Map(
      badge?.calculatorPayloads[0]?.setupContext?.variables?.map((variable) => [
        variable.symbol,
        Number(variable.value),
      ]) ?? [],
    );
    const overlap =
      (setupVariables.get("f_support_max") ?? Number.NaN) /
      (setupVariables.get("f_support_min") ?? Number.NaN);

    expect(badge).toMatchObject({
      status: "blocked",
      level: "diagnostic_gate",
      calculatorPayloads: [
        expect.objectContaining({
          id: "support_retention_overlap_payload",
          expression: "M_overlap = f_support_max/f_support_min",
          targetVariable: "M_overlap",
        }),
      ],
      claimBoundary: {
        diagnosticOnly: true,
        doesValidateNHM2: false,
        validationClaimAllowed: false,
        physicalMechanismClaimAllowed: false,
        promotionAllowed: false,
      },
    });
    expect(overlap).toBeCloseTo(0.459119311228, 12);
    expect(JSON.stringify(badge)).toMatch(/support_retention_overlap_window_missing/);
    expect(JSON.stringify(badge?.sourceRefs)).toMatch(/2606\.28195/);
    expect(edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "nhm2.experimental.layer_stack_mechanical_receipt",
          to: "nhm2.mechanical.support_retention_overlap",
          relation: "derives",
        }),
        expect.objectContaining({
          from: "nhm2.mechanical.support_retention_overlap",
          to: "nhm2.claim_boundary.physical_viability_locked",
          relation: "blocks",
        }),
      ]),
    );
  });

  it("keeps the steering Bondi-flux gate premise-aware, nonuniversal, and transport-locked", () => {
    const { badges, edges } = buildNhm2FullSolveTheoryBadgesV1();
    const badge = badges.find(
      (candidate: TheoryBadgeV1) =>
        candidate.id === "nhm2.transport.steering_bondi_flux_budget",
    );
    const text = JSON.stringify(badge);

    expect(badge).toMatchObject({
      status: "blocked",
      level: "diagnostic_gate",
      calculatorPayloads: [],
      claimBoundary: {
        diagnosticOnly: true,
        doesValidateNHM2: false,
        validationClaimAllowed: false,
        physicalMechanismClaimAllowed: false,
        promotionAllowed: false,
      },
    });
    expect(text).toMatch(/asymptotic flatness/i);
    expect(text).toMatch(/confined matter/i);
    expect(text).toMatch(/dominant energy condition/i);
    expect(text).toMatch(/not_applicable/);
    expect(text).toMatch(/not_ready/);
    expect(text).toMatch(/not an NHM2 field/i);
    expect(JSON.stringify(badge?.sourceRefs)).toMatch(/2606\.22531v3/);
    expect(edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "nhm2.transport.steering_bondi_flux_budget",
          to: "nhm2.claim_boundary.transport_locked",
          relation: "blocks",
        }),
      ]),
    );
  });

  it("evaluates Bondi-flux applicability without ever granting claim authority", () => {
    const applicable = {
      asymptoticFlatness: true,
      confinedMatter: true,
      dominantEnergyCondition: true,
      bondiSachsAsymptotics: true,
      radiativeFluxBudgetReceipt: true,
    } as const;
    const premiseKeys = [
      "asymptoticFlatness",
      "confinedMatter",
      "dominantEnergyCondition",
      "bondiSachsAsymptotics",
    ] as const;

    for (const premise of premiseKeys) {
      const result = evaluateNhm2SteeringBondiFluxGate({
        ...applicable,
        [premise]: false,
      });
      expect(result.status, premise).toBe("not_applicable");
      expect(result.applicable, premise).toBe(false);
      expect(result.radiativeBudgetRequired, premise).toBe(false);
      expect(Object.values(result.claimLocks).every((allowed) => allowed === false)).toBe(true);
    }

    const unknown = evaluateNhm2SteeringBondiFluxGate({
      ...applicable,
      asymptoticFlatness: "unknown",
    });
    expect(unknown.status).toBe("not_ready");
    expect(unknown.applicable).toBeNull();

    const missingBudget = evaluateNhm2SteeringBondiFluxGate({
      ...applicable,
      radiativeFluxBudgetReceipt: undefined,
    });
    expect(missingBudget.status).toBe("not_ready");

    const failedBudget = evaluateNhm2SteeringBondiFluxGate({
      ...applicable,
      radiativeFluxBudgetReceipt: false,
    });
    expect(failedBudget.status).toBe("blocked");

    const diagnosticPass = evaluateNhm2SteeringBondiFluxGate(applicable);
    expect(diagnosticPass.status).toBe("diagnostic_pass");
    expect(diagnosticPass.applicable).toBe(true);
    expect(diagnosticPass.claimLocks).toEqual({
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
      certifiedWarpSpeedClaimAllowed: false,
    });
  });

  it("keeps every local repo and artifact source reference resolvable", () => {
    const localRefs = buildNhm2FullSolveTheoryBadgesV1().badges.flatMap((badge) =>
      badge.sourceRefs
        .filter((ref) => ref.kind === "repo_module" || ref.kind === "artifact")
        .map((ref) => ({ badgeId: badge.id, ref })),
    );

    for (const { badgeId, ref } of localRefs) {
      expect(ref.path, `${badgeId} sourceRef path`).toBeTruthy();
      expect(existsSync(ref.path ?? ""), `${badgeId}: ${ref.path}`).toBe(true);
    }
  });

  it("keeps the centerline clocking target calculator-loadable but bounded", () => {
    const badge = buildNhm2FullSolveTheoryBadgesV1().badges.find(
      (candidate: TheoryBadgeV1) => candidate.id === "nhm2.clock.centerline_tau_alpha_T",
    );

    expect(badge?.calculatorPayloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          expression: "tau = alpha_centerline*T_coordinate",
          targetVariable: "tau",
        }),
      ]),
    );
    expect(badge?.claimBoundary.promotionAllowed).toBe(false);
  });

  it("keeps candidate profile clocking calculator-loadable without admitting the profile", () => {
    const badge = buildNhm2FullSolveTheoryBadgesV1().badges.find(
      (candidate: TheoryBadgeV1) =>
        candidate.id === "nhm2.profile.candidate_metric_profile_spec",
    );

    expect(badge?.status).toBe("blocked");
    expect(badge?.calculatorPayloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          expression: "tau_candidate = alpha_centerline * T_coordinate",
        }),
      ]),
    );
    expect(badge?.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
    expect(badge?.claimBoundary.promotionAllowed).toBe(false);
  });

  it("keeps the trip clocking profile index noncomputable and profile-scoped", () => {
    const badge = buildNhm2FullSolveTheoryBadgesV1().badges.find(
      (candidate: TheoryBadgeV1) =>
        candidate.id === "nhm2.clock.trip_clocking_profile_index",
    );

    expect(badge?.calculatorPayloads).toEqual([]);
    expect(JSON.stringify(badge)).toMatch(/0p995/);
    expect(JSON.stringify(badge)).toMatch(/0p7000/);
    expect(JSON.stringify(badge)).toMatch(/profile-scoped|profile_scoped/i);
    expect(badge?.claimBoundary.promotionAllowed).toBe(false);
  });

  it("keeps the Twin Paradox trip clocking badge calculator-loadable but analogy-only", () => {
    const badge = buildNhm2FullSolveTheoryBadgesV1().badges.find(
      (candidate: TheoryBadgeV1) =>
        candidate.id === "nhm2.clock.twin_paradox_trip_clocking",
    );

    expect(badge?.calculatorPayloads.map((entry) => entry.expression)).toEqual(
      expect.arrayContaining([
        "tau = alpha_centerline*T_coordinate",
        "saved_days = (1-alpha_centerline)*T_coordinate/86400",
        "round_trip_saved_days = 2*saved_days",
        "beta_sr_analogy = sqrt(1-alpha_centerline^2)",
      ]),
    );
    expect(JSON.stringify(badge)).toMatch(/analogy/i);
    expect(JSON.stringify(badge)).not.toMatch(forbiddenPhrase("\\bcertified", " speed\\b"));
    expect(JSON.stringify(badge)).not.toMatch(/\btrue ETA\b/i);
    expect(JSON.stringify(badge)).not.toMatch(/\bphysical warp trip\b/i);
    expect(badge?.claimBoundary.promotionAllowed).toBe(false);
  });

  it("is included in the global Helix graph and validates", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const ids = graph.badges.map((badge: TheoryBadgeV1) => badge.id);

    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
    expect(validateTheoryBadgeGraphV1(graph)).toEqual([]);
    expect(ids).toEqual(
      expect.arrayContaining([
        "nhm2.observer.eulerian_normal",
        "nhm2.tensor.metric_required_stress_energy",
        "nhm2.closure.wall_t00_source_residual",
        "nhm2.source.wall_t00_trace",
        "nhm2.tensor.full_authority_gate",
        "nhm2.tensor.same_chart_full_tensor",
        "nhm2.source.component_authority_ledger",
        "nhm2.source.same_basis_tensor_authority",
        "nhm2.closure.same_basis_regional_residual",
        "nhm2.closure.coupled_pass_candidate",
        "nhm2.closure.regional_tensor_pass_path_harness",
        "nhm2.dynamic.switching_covariant_conservation",
        "nhm2.dynamic.frequency_convergence",
        "nhm2.dynamic.effective_geometry_agreement",
        "nhm2.dynamic.time_dependent_source_campaign",
        "nhm2.metric_required.momentum_remediation_targets",
        "nhm2.campaign.frontier_disposition",
        "nhm2.profile.campaign_search",
        "nhm2.profile.campaign_run_manifest",
        "nhm2.qei.worldline_dossier",
        "nhm2.natario.curvature_invariants",
        "nhm2.natario.invariant_audit",
        "nhm2.energy_condition.observer_robust_gate",
        "nhm2.clock.twin_paradox_trip_clocking",
        "nhm2.clock.trip_clocking_profile_index",
        "nhm2.formal.lean_certificate",
        "nhm2.formal.diagnostic_campaign_admissible",
        "nhm2.formal.claim_locks_closed",
        "nhm2.formal.negative_fixtures_fail_closed",
        "nhm2.formal.certificate_hashes_pinned",
        "nhm2.experimental.physical_viability_campaign",
        "nhm2.experimental.parameter_targets",
        "nhm2.experimental.research_gap_ledger",
        "nhm2.experimental.layer_stack_mechanical_receipt",
        "nhm2.mechanical.support_retention_overlap",
      "nhm2.experimental.layer_stack_support_fraction_sweep",
      "nhm2.experimental.layer_stack_architecture_loop",
      "nhm2.experimental.full_apparatus_receipt_loop",
      "nhm2.experimental.tile_source_physical_validation_plan",
      "nhm2.experimental.prediction_freeze",
        "nhm2.experimental.tile_force_receipt",
        "nhm2.experimental.tile_cycle_energy_balance",
        "nhm2.experimental.array_scaling",
        "nhm2.experimental.full_apparatus_tensor",
        "nhm2.experimental.vacuum_weight",
        "nhm2.experimental.metric_upper_bound",
        "nhm2.experimental.invariant_metric_response",
        "nhm2.experimental.geodesic_response",
        "nhm2.experimental.independent_replication",
        "nhm2.claim_boundary.physical_viability_locked",
        "nhm2.claim_boundary.transport_locked",
        "nhm2.transport.steering_bondi_flux_budget",
        "nhm2.claim_boundary.diagonal_proxy_not_full_tensor",
      ]),
    );
    const wallClosure = graph.badges.find(
      (badge: TheoryBadgeV1) => badge.id === "nhm2.closure.wall_t00_source_residual",
    );
    expect(wallClosure?.calculatorPayloads.map((payload) => payload.expression)).toContain(
      "R_wall_T00 = T00_wall_required - T00_wall_available",
    );
  });

  it("keeps new closure-stack badges diagnostic and noncomputable except scalar replay rows", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const byId = new Map(graph.badges.map((badge: TheoryBadgeV1) => [badge.id, badge]));

    for (const badgeId of newClosureStackBadgeIds) {
      const badge = byId.get(badgeId);
      expect(badge, badgeId).toBeDefined();
      expect(badge?.claimBoundary).toMatchObject({
        diagnosticOnly: true,
        doesValidateNHM2: false,
        validationClaimAllowed: false,
        physicalMechanismClaimAllowed: false,
        promotionAllowed: false,
      });
    }

    for (const badgeId of [
      "nhm2.tensor.same_chart_full_tensor",
      "nhm2.source.component_authority_ledger",
      "nhm2.source.same_basis_tensor_authority",
      "nhm2.closure.coupled_pass_candidate",
      "nhm2.closure.regional_tensor_pass_path_harness",
      "nhm2.metric_required.momentum_remediation_targets",
      "nhm2.campaign.frontier_disposition",
      "nhm2.profile.campaign_search",
      "nhm2.profile.campaign_run_manifest",
      "nhm2.energy_condition.observer_robust_gate",
      "nhm2.qei.worldline_dossier",
      "nhm2.natario.invariant_audit",
      "casimir.material.lifshitz_receipt",
      "casimir.geometry.beyond_pfa_validity",
      "casimir.geometry.finite_temperature_maxwell_stress",
      "nhm2.transport.steering_bondi_flux_budget",
    ]) {
      const badge = byId.get(badgeId);
      expect(badge?.calculatorPayloads).toEqual([]);
      expect(badge?.equations.every((equation) => equation.computableExpression == null)).toBe(true);
      expect(
        badge?.equations.every((equation) =>
          ["gate_status", "noncomputable_reference"].includes(equation.operatorKind),
        ),
      ).toBe(true);
    }

    expect(
      byId.get("nhm2.closure.wall_t00_source_residual")?.calculatorPayloads.map(
        (payload) => payload.expression,
      ),
    ).toEqual(["R_wall_T00 = T00_wall_required - T00_wall_available"]);
    expect(
      byId.get("nhm2.qei.sampling_window")?.calculatorPayloads.map(
        (payload) => payload.expression,
      ),
    ).toContain("qei_margin = qei_bound - qei_sample");
    expect(
      byId.get("casimir.cavity.mass_equivalent_proxy")?.calculatorPayloads.map(
        (payload) => payload.expression,
      ),
    ).toEqual(["M_proxy = E_out/c^2"]);
    expect(
      byId.get("nhm2.tile.duty_cycle_average")?.calculatorPayloads.map(
        (payload) => payload.expression,
      ),
    ).toEqual(["P_avg = E_cycle / T_cycle"]);
  });

  it("wires the requested full-solve closure graph edges", () => {
    const graph = buildHelixTheoryBadgeGraphV1();

    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "physics.gr.3p1_decomposition",
          to: "nhm2.tensor.same_chart_full_tensor",
        }),
        expect.objectContaining({
          from: "nhm2.tensor.same_chart_full_tensor",
          to: "nhm2.closure.wall_t00_source_residual",
        }),
        expect.objectContaining({
          from: "nhm2.tensor.same_chart_full_tensor",
          to: "nhm2.source.same_basis_tensor_authority",
        }),
        expect.objectContaining({
          from: "nhm2.tensor.tile_effective_counterpart",
          to: "nhm2.source.component_authority_ledger",
        }),
        expect.objectContaining({
          from: "nhm2.source.component_authority_ledger",
          to: "nhm2.source.same_basis_tensor_authority",
        }),
        expect.objectContaining({
          from: "nhm2.source.component_authority_ledger",
          to: "nhm2.closure.wall_t00_source_residual",
        }),
        expect.objectContaining({
          from: "nhm2.source.same_basis_tensor_authority",
          to: "nhm2.closure.wall_t00_source_residual",
        }),
        expect.objectContaining({
          from: "nhm2.tensor.same_chart_full_tensor",
          to: "nhm2.energy_condition.observer_robust_gate",
        }),
        expect.objectContaining({
          from: "nhm2.closure.wall_t00_source_residual",
          to: "nhm2.qei.worldline_dossier",
        }),
        expect.objectContaining({
          from: "nhm2.source.component_authority_ledger",
          to: "nhm2.closure.coupled_pass_candidate",
        }),
        expect.objectContaining({
          from: "nhm2.closure.coupled_pass_candidate",
          to: "nhm2.closure.regional_tensor_pass_path_harness",
        }),
        expect.objectContaining({
          from: "nhm2.closure.regional_tensor_pass_path_harness",
          to: "nhm2.claim_boundary.diagnostic_only",
        }),
        expect.objectContaining({
          from: "nhm2.metric_required.momentum_remediation_targets",
          to: "nhm2.campaign.frontier_disposition",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.campaign.frontier_disposition",
          to: "nhm2.dynamic.time_dependent_source_campaign",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.campaign.frontier_disposition",
          to: "nhm2.profile.campaign_search",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.profile.campaign_search",
          to: "nhm2.dynamic.time_dependent_source_campaign",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.profile.campaign_search",
          to: "nhm2.profile.campaign_run_manifest",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.profile.campaign_run_manifest",
          to: "nhm2.dynamic.time_dependent_source_campaign",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "casimir.material.lifshitz_receipt",
          to: "nhm2.closure.wall_t00_source_residual",
        }),
        expect.objectContaining({
          from: "casimir.geometry.beyond_pfa_validity",
          to: "casimir.material.lifshitz_receipt",
        }),
        expect.objectContaining({
          from: "nhm2.natario.invariant_audit",
          to: "nhm2.energy_condition.observer_robust_gate",
        }),
        expect.objectContaining({
          from: "nhm2.energy_condition.observer_robust_gate",
          to: "nhm2.claim_boundary.diagnostic_only",
        }),
        expect.objectContaining({
          from: "nhm2.clock.centerline_tau_alpha_T",
          to: "nhm2.clock.twin_paradox_trip_clocking",
          relation: "specializes",
        }),
        expect.objectContaining({
          from: "nhm2.clock.twin_paradox_trip_clocking",
          to: "nhm2.claim_boundary.expected_clocking_not_route_result",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.clock.twin_paradox_trip_clocking",
          to: "nhm2.clock.trip_clocking_profile_index",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.clock.trip_clocking_profile_index",
          to: "nhm2.claim_boundary.expected_clocking_not_route_result",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.dynamic.time_dependent_source_campaign",
          to: "nhm2.formal.lean_certificate",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.formal.lean_certificate",
          to: "nhm2.formal.diagnostic_campaign_admissible",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.formal.claim_locks_closed",
          to: "nhm2.formal.diagnostic_campaign_admissible",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.formal.claim_locks_closed",
          to: "nhm2.claim_boundary.diagnostic_only",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.dynamic.time_dependent_source_campaign",
          to: "nhm2.experimental.physical_viability_campaign",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.theory_solve_roadmap",
          to: "nhm2.experimental.parameter_targets",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.parameter_targets",
          to: "nhm2.experimental.research_gap_ledger",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.research_gap_ledger",
          to: "nhm2.qei.worldline_dossier",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.research_gap_ledger",
          to: "nhm2.experimental.layer_stack_mechanical_receipt",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.research_gap_ledger",
          to: "nhm2.experimental.layer_stack_support_fraction_sweep",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.research_gap_ledger",
          to: "nhm2.claim_boundary.physical_viability_locked",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.layer_stack_mechanical_receipt",
          to: "nhm2.experimental.array_scaling",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.layer_stack_mechanical_receipt",
          to: "nhm2.experimental.layer_stack_support_fraction_sweep",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.layer_stack_support_fraction_sweep",
          to: "nhm2.experimental.array_scaling",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.layer_stack_support_fraction_sweep",
          to: "nhm2.experimental.layer_stack_architecture_loop",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.layer_stack_architecture_loop",
          to: "nhm2.experimental.array_scaling",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.layer_stack_architecture_loop",
          to: "nhm2.experimental.full_apparatus_receipt_loop",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.full_apparatus_receipt_loop",
          to: "nhm2.experimental.array_scaling",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.full_apparatus_receipt_loop",
          to: "nhm2.experimental.full_apparatus_tensor",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.full_apparatus_receipt_loop",
          to: "nhm2.experimental.tile_source_physical_validation_plan",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.tile_source_physical_validation_plan",
          to: "nhm2.source.same_basis_tensor_authority",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.tile_source_physical_validation_plan",
          to: "nhm2.closure.coupled_pass_candidate",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.tile_source_physical_validation_plan",
          to: "nhm2.claim_boundary.physical_viability_locked",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.layer_stack_architecture_loop",
          to: "nhm2.experimental.full_apparatus_tensor",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.parameter_targets",
          to: "nhm2.experimental.tile_force_receipt",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.prediction_freeze",
          to: "nhm2.experimental.physical_viability_campaign",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.vacuum_weight",
          to: "nhm2.experimental.invariant_metric_response",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.experimental.independent_replication",
          to: "nhm2.claim_boundary.physical_viability_locked",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.claim_boundary.physical_viability_locked",
          to: "nhm2.claim_boundary.transport_locked",
          relation: "blocks",
        }),
      ]),
    );
  });

  it("does not contain forbidden promotion language", () => {
    const text = JSON.stringify(buildNhm2FullSolveTheoryBadgesV1());

    expect(text).not.toMatch(/\bvalidated propulsion\b/i);
    expect(text).not.toMatch(/\bworking warp drive\b/i);
    expect(text).not.toMatch(/\bphysical mechanism confirmed\b/i);
    expect(text).not.toMatch(forbiddenPhrase("\\bQEI", " passed\\b"));
    expect(text).not.toMatch(/\benergy conditions cleared\b/i);
    expect(text).not.toMatch(forbiddenPhrase("\\bsource closure", " solved\\b"));
    expect(text).not.toMatch(forbiddenPhrase("\\bexternal paper validates", " NHM2\\b"));
    expect(text).not.toMatch(forbiddenPhrase("\\bcertified", " speed\\b"));
    expect(text).not.toMatch(/\btrue ETA\b/i);
    expect(text).not.toMatch(/\bphysical warp trip\b/i);
    expect(text).not.toMatch(forbiddenPhrase("Lean", " proves NHM2 is physically viable"));
    expect(text).not.toMatch(forbiddenPhrase("certified", " warp speed"));
    expect(text).not.toMatch(forbiddenPhrase("transport", " certified"));
    expect(text).not.toMatch(forbiddenPhrase("route ETA", " certified"));
    expect(text).not.toMatch(forbiddenPhrase("material", " realization"));
    expect(text).not.toMatch(forbiddenPhrase("physical viability", " unlocked"));
    expect(text).not.toMatch(forbiddenPhrase("transport", " unlocked"));
  });
});
