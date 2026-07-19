import {
  buildTheoryRuntimeEntrypointV1,
  type TheoryRuntimeEntrypointV1,
  type TheoryRuntimeSourceRefV1,
} from "../contracts/theory-runtime-entrypoint.v1";

const GENERATED_AT = "2026-07-18T00:00:00.000Z";

const sourceRef = (
  kind: TheoryRuntimeSourceRefV1["kind"],
  path: string,
  note?: string,
  id?: string,
): TheoryRuntimeSourceRefV1 => ({
  kind,
  path,
  id: id ?? null,
  note: note ?? null,
});

const diagnosticBoundary = (promotionRequires: string[] = []) => ({
  currentTier: "diagnostic" as const,
  maximumTier: "diagnostic" as const,
  promotionAllowed: false,
  promotionRequires,
});

const reducedOrderBoundary = (promotionRequires: string[]) => ({
  currentTier: "diagnostic" as const,
  maximumTier: "reduced_order" as const,
  promotionAllowed: false,
  promotionRequires,
});

export const THEORY_RUNTIME_ENTRYPOINTS: TheoryRuntimeEntrypointV1[] = [
  buildTheoryRuntimeEntrypointV1({
    generatedAt: GENERATED_AT,
    runtimeId: "gr.loop",
    family: "gr_tensor",
    label: "GR Agent Loop",
    description:
      "General-relativity loop entrypoint for tensor/runtime diagnostics. The registry records ownership only; it does not execute the loop.",
    command: "npm run gr:loop",
    argsSchema: null,
    outputArtifactGlobs: ["artifacts/gr-loop/**/*.json", "artifacts/training-trace*.jsonl"],
    expectedReceiptKind: "theory_runtime_receipt/v1",
    ownedBadgeIds: [
      "physics.gr.einstein_field_equation",
      "physics.gr.stress_energy_conservation",
      "physics.gr.3p1_decomposition",
      "physics.fields.stress_energy_tensor",
    ],
    sourceRefs: [
      sourceRef("script", "cli/gr-agent-loop.ts", "Package script target for npm run gr:loop."),
      sourceRef("repo_module", "server/gr/evolution/stress-energy.ts", "Stress-energy runtime context."),
      sourceRef("config", "configs/physics-equation-backbone.v1.json", "GR/stress-energy equation backbone."),
    ],
    timeoutPolicy: {
      smallMs: 30_000,
      fullMs: 180_000,
    },
    claimBoundary: diagnosticBoundary([
      "validated tensor receipt",
      "gate audit receipt",
      "claim-boundary review",
    ]),
  }),
  buildTheoryRuntimeEntrypointV1({
    generatedAt: GENERATED_AT,
    runtimeId: "physics.validate",
    family: "generic_runtime",
    label: "Physics Validation Checks",
    description:
      "Repository physics validation entrypoint for diagnostic gates and consistency checks. It is listed as metadata and is not invoked by this registry.",
    command: "npm run physics:validate",
    argsSchema: null,
    outputArtifactGlobs: ["artifacts/physics-validate/**/*.json", "artifacts/physics-validation*.json"],
    expectedReceiptKind: "theory_runtime_receipt/v1",
    ownedBadgeIds: [
      "physics.units.dimension_consistency",
      "physics.fields.stress_energy_tensor",
      "nhm2.closure.wall_t00_source_residual",
      "nhm2.closure.source_residual",
      "nhm2.tensor.same_chart_full_tensor",
      "nhm2.source.same_basis_tensor_authority",
      "nhm2.energy_condition.observer_robust_gate",
      "nhm2.energy_condition.diagnostic_gate",
      "nhm2.claim_boundary.diagnostic_only",
    ],
    sourceRefs: [
      sourceRef("script", "cli/physics-validate.ts", "Package script target for npm run physics:validate."),
      sourceRef("config", "configs/physics-equation-backbone.v1.json", "Physics equation backbone."),
    ],
    timeoutPolicy: {
      smallMs: 30_000,
      fullMs: 180_000,
    },
    claimBoundary: diagnosticBoundary([
      "complete validation receipt",
      "gate statuses not unknown",
      "claim-boundary review",
    ]),
  }),
  buildTheoryRuntimeEntrypointV1({
    generatedAt: GENERATED_AT,
    runtimeId: "casimir.verify",
    family: "casimir_field",
    label: "Casimir Verification",
    description:
      "Casimir verification entrypoint for cavity diagnostic artifacts and source-context checks. It does not establish propulsion evidence.",
    command: "npm run casimir:verify",
    argsSchema: null,
    outputArtifactGlobs: ["artifacts/casimir/**/*.json", "artifacts/training-trace.jsonl"],
    expectedReceiptKind: "theory_runtime_receipt/v1",
    ownedBadgeIds: [
      "casimir.cavity.parallel_plate_energy_density",
      "casimir.cavity.parallel_plate_pressure",
      "casimir.cavity.static_tile_budget",
      "casimir.tile.duty_budget",
      "casimir.cavity.output_energy_proxy",
      "casimir.cavity.mass_equivalent_proxy",
      "casimir.runtime.static_casimir_module",
      "casimir.material_receipts",
      "casimir.material.lifshitz_receipt",
      "casimir.geometry.beyond_pfa_validity",
      "casimir.geometry.finite_temperature_maxwell_stress",
      "casimir.claim_boundary.diagnostic_source_context",
    ],
    sourceRefs: [
      sourceRef("script", "cli/casimir-verify.ts", "Package script target for npm run casimir:verify."),
      sourceRef("repo_module", "modules/sim_core/static-casimir.ts", "Static Casimir module."),
      sourceRef("repo_module", "modules/dynamic/dynamic-casimir.ts", "Dynamic Casimir module."),
      sourceRef("doc", "docs/casimir-tile-mechanism.md", "Mechanism note and caveats."),
    ],
    timeoutPolicy: {
      smallMs: 30_000,
      fullMs: 240_000,
    },
    claimBoundary: diagnosticBoundary([
      "material model receipt",
      "finite-temperature context",
      "finite-temperature Maxwell-stress receipt when finite shaped geometry is invoked",
      "measurement/audit receipt",
    ]),
  }),
  buildTheoryRuntimeEntrypointV1({
    generatedAt: GENERATED_AT,
    runtimeId: "solar.pipeline",
    family: "solar_spectrum",
    label: "Solar Spectrum Pipeline",
    description:
      "Solar spectrum pipeline entrypoint for observation/model proxy artifacts. Interpretation requires observation receipts and calibration context.",
    command: "npm run solar:pipeline",
    argsSchema: null,
    outputArtifactGlobs: ["artifacts/solar/**/*.json", "artifacts/solar-spectrum/**/*.json"],
    expectedReceiptKind: "theory_runtime_receipt/v1",
    ownedBadgeIds: [
      "solar.spectrum.photon_energy",
      "solar.spectrum.halpha_line_reference",
      "solar.spectrum.doppler_shift",
      "solar.spectrum.radial_velocity_proxy",
      "solar.spectrum.blackbody_curve_reference",
      "solar.runtime.spectrum_analysis",
      "solar.claim_boundary.observational_proxy",
    ],
    sourceRefs: [
      sourceRef("script", "scripts/solar-pipeline.ts", "Package script target for npm run solar:pipeline."),
      sourceRef("repo_module", "shared/solar-spectrum-analysis.ts", "Solar spectrum analysis helpers."),
      sourceRef("repo_module", "server/services/essence/solar-spectrum-ingest.ts", "Solar spectrum ingest path."),
      sourceRef("doc", "docs/knowledge/physics/solar-radiative-observables-tree.json", "Solar observable tree."),
    ],
    timeoutPolicy: {
      smallMs: 30_000,
      fullMs: 240_000,
    },
    claimBoundary: diagnosticBoundary([
      "specific observation receipt",
      "instrument calibration context",
      "bandpass/model caveats",
    ]),
  }),
  buildTheoryRuntimeEntrypointV1({
    generatedAt: GENERATED_AT,
    runtimeId: "solar.manifest",
    family: "solar_spectrum",
    label: "Solar Spectra Manifest",
    description:
      "Solar spectra manifest entrypoint for observation availability and artifact inventory. It is an artifact resolver lane, not a physical confirmation.",
    command: "npm run solar:manifest",
    argsSchema: null,
    outputArtifactGlobs: ["artifacts/solar/**/*manifest*.json", "docs/knowledge/physics/solar-*.json"],
    expectedReceiptKind: "theory_runtime_receipt/v1",
    ownedBadgeIds: [
      "solar.spectrum.halpha_line_reference",
      "solar.spectrum.blackbody_curve_reference",
      "solar.runtime.spectrum_analysis",
      "solar.claim_boundary.observational_proxy",
    ],
    sourceRefs: [
      sourceRef("script", "scripts/solar-spectra-manifest.ts", "Package script target for npm run solar:manifest."),
      sourceRef("repo_module", "shared/solar-spectrum-analysis.ts", "Solar spectrum analysis helpers."),
      sourceRef("artifact", "docs/knowledge/physics/solar-radiative-observables-tree.json", "Known solar observables."),
    ],
    timeoutPolicy: {
      smallMs: 20_000,
      fullMs: 120_000,
    },
    claimBoundary: diagnosticBoundary([
      "manifest freshness check",
      "source artifact availability",
      "observation provenance",
    ]),
  }),
  buildTheoryRuntimeEntrypointV1({
    generatedAt: GENERATED_AT,
    runtimeId: "warp.full_solve.campaign",
    family: "warp_full_solve",
    label: "Warp Full-Solve Campaign",
    description:
      "NHM2/warp full-solve campaign entrypoint. This registry only describes the route and expected evidence; it does not execute the campaign.",
    command: "npm run warp:full-solve:campaign",
    argsSchema: null,
    outputArtifactGlobs: [
      "artifacts/research/full-solve/**/*.json",
      "artifacts/research/full-solve/**/*.md",
      "artifacts/research/full-solve/profile-campaign-runs/stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1/**/*.json",
      "formal/lean/NHM2Formal/Generated/**/*.lean",
      "docs/audits/**/*.json",
    ],
    expectedReceiptKind: "theory_runtime_receipt/v1",
    ownedBadgeIds: [
      "physics.gr.einstein_field_equation",
      "physics.gr.3p1_decomposition",
      "nhm2.geometry.lapse_shift_profile",
      "nhm2.source.energy_density_proxy",
      "nhm2.tile.duty_cycle_average",
      "nhm2.closure.wall_t00_source_residual",
      "nhm2.closure.source_residual",
      "nhm2.source.wall_t00_trace",
      "nhm2.tensor.full_authority_gate",
      "nhm2.tensor.same_chart_full_tensor",
      "nhm2.source.component_authority_ledger",
      "nhm2.source.same_basis_tensor_authority",
      "nhm2.closure.coupled_pass_candidate",
      "nhm2.closure.regional_tensor_pass_path_harness",
      "nhm2.formal.lean_certificate",
      "nhm2.formal.certificate_hashes_pinned",
      "nhm2.formal.diagnostic_campaign_admissible",
      "nhm2.formal.claim_locks_closed",
      "nhm2.formal.negative_fixtures_fail_closed",
      "nhm2.mechanical.support_retention_overlap",
      "casimir.geometry.finite_temperature_maxwell_stress",
      "nhm2.transport.steering_bondi_flux_budget",
      "nhm2.qei.sampling_window",
      "nhm2.qei.worldline_dossier",
      "nhm2.natario.curvature_invariants",
      "nhm2.natario.invariant_audit",
      "nhm2.energy_condition.observer_robust_gate",
      "nhm2.energy_condition.diagnostic_gate",
      "nhm2.claim_boundary.diagnostic_only",
    ],
    sourceRefs: [
      sourceRef(
        "script",
        "scripts/warp-full-solve-campaign-cli.ts",
        "Package script target for npm run warp:full-solve:campaign.",
      ),
      sourceRef("runtime", "scripts/warp-full-solve-calculator.ts", "Full-solve calculator path."),
      sourceRef("config", "configs/warp-needle-hull-mark2-theory-directory.v1.json", "NHM2 theory directory."),
      sourceRef("artifact", "artifacts/research/full-solve", "Expected campaign artifact root."),
      sourceRef(
        "artifact",
        "artifacts/research/full-solve/profile-campaign-runs/stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1",
        "Canonical 0p7000 profile-campaign package root.",
      ),
      sourceRef(
        "repo_module",
        "formal/lean/NHM2Formal/Generated/CurrentCampaignCertificate.lean",
        "Generated Lean-facing certificate for the governed 0p7000 diagnostic package.",
      ),
    ],
    timeoutPolicy: {
      smallMs: 120_000,
      fullMs: 1_800_000,
    },
    claimBoundary: reducedOrderBoundary([
      "source closure artifact",
      "dual tensor observer audit",
      "QEI/worldline dossier",
      "certificate integrity receipt",
      "mechanical support-retention overlap receipt",
      "finite-temperature Maxwell-stress receipt when finite Casimir geometry is invoked",
      "premise-aware Bondi-flux receipt when steering premises apply",
      "human claim-boundary review",
    ]),
  }),
  buildTheoryRuntimeEntrypointV1({
    generatedAt: GENERATED_AT,
    runtimeId: "nhm2.shift_lapse.alpha_sweep",
    family: "warp_full_solve",
    label: "NHM2 Shift-Lapse Alpha Sweep",
    description:
      "NHM2 shift/lapse alpha sweep entrypoint for selected-family diagnostics. The registry records sweep metadata only and does not launch the run.",
    command: "npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep",
    argsSchema: null,
    outputArtifactGlobs: [
      "artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/**/*.json",
      "artifacts/research/full-solve/profile-campaign-runs/stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1/**/*.json",
      "formal/lean/NHM2Formal/Generated/**/*.lean",
      "docs/audits/nhm2-shift-lapse/alpha-sweep/**/*.json",
      "docs/audits/nhm2-shift-lapse/alpha-sweep/**/*.md",
    ],
    expectedReceiptKind: "theory_runtime_receipt/v1",
    ownedBadgeIds: [
      "nhm2.geometry.lapse_shift_profile",
      "nhm2.source.energy_density_proxy",
      "nhm2.closure.wall_t00_source_residual",
      "nhm2.closure.source_residual",
      "nhm2.source.wall_t00_trace",
      "nhm2.tensor.full_authority_gate",
      "nhm2.tensor.same_chart_full_tensor",
      "nhm2.source.component_authority_ledger",
      "nhm2.source.same_basis_tensor_authority",
      "nhm2.closure.coupled_pass_candidate",
      "nhm2.closure.regional_tensor_pass_path_harness",
      "nhm2.formal.lean_certificate",
      "nhm2.formal.certificate_hashes_pinned",
      "nhm2.formal.diagnostic_campaign_admissible",
      "nhm2.formal.claim_locks_closed",
      "nhm2.formal.negative_fixtures_fail_closed",
      "nhm2.mechanical.support_retention_overlap",
      "nhm2.qei.sampling_window",
      "nhm2.qei.worldline_dossier",
      "nhm2.energy_condition.observer_robust_gate",
      "nhm2.energy_condition.diagnostic_gate",
      "nhm2.claim_boundary.diagnostic_only",
    ],
    sourceRefs: [
      sourceRef(
        "script",
        "scripts/research/run-nhm2-lapse-alpha-sweep.ts",
        "Package script target for npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep.",
      ),
      sourceRef("artifact", "artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep"),
      sourceRef(
        "artifact",
        "artifacts/research/full-solve/profile-campaign-runs/stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1",
        "Canonical 0p7000 profile-campaign package root.",
      ),
      sourceRef(
        "repo_module",
        "formal/lean/NHM2Formal/Generated/CurrentCampaignCertificate.lean",
        "Generated certificate bound to the 0p7000 diagnostic package.",
      ),
      sourceRef("doc", "docs/audits/nhm2-shift-lapse/alpha-sweep", "Expected audit output root."),
    ],
    timeoutPolicy: {
      smallMs: 120_000,
      fullMs: 1_800_000,
    },
    claimBoundary: reducedOrderBoundary([
      "completed sweep receipt",
      "source closure residual surface",
      "gate status audit",
      "certificate integrity receipt",
      "mechanical support-retention overlap receipt",
    ]),
  }),
];

export function getTheoryRuntimeEntrypoint(runtimeId: string): TheoryRuntimeEntrypointV1 | null {
  return THEORY_RUNTIME_ENTRYPOINTS.find((entrypoint) => entrypoint.runtimeId === runtimeId) ?? null;
}

export function findTheoryRuntimeEntrypointsForBadge(badgeId: string): TheoryRuntimeEntrypointV1[] {
  return THEORY_RUNTIME_ENTRYPOINTS.filter((entrypoint) => entrypoint.ownedBadgeIds.includes(badgeId));
}
