export const STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS = {
  mesaExternalRuntimeRequiresHashes: "mesa_external_runtime_requires_hashes.v1",
  mesaSolarReproFixtureNotExternal: "mesa_solar_repro_fixture_not_external.v1",
  mesaProfileParserRequiresIntegrationBasis:
    "mesa_profile_parser_requires_integration_basis.v1",
  mesaProfileHashSupportsReproducibility:
    "mesa_profile_hash_supports_reproducibility.v1",
  mesaHistoryHashSupportsReproducibility:
    "mesa_history_hash_supports_reproducibility.v1",
  mesaRunLogHashSupportsReproducibility:
    "mesa_run_log_hash_supports_reproducibility.v1",
  mesaSolarReproStage2GateHandoff: "mesa_solar_repro_stage2_gate_handoff.v1",
  solarMesaReproNotErEprEvidence: "solar_mesa_repro_not_er_epr_evidence.v1",
  solarMesaReproProxyOnlyQstBoundary: "solar_mesa_repro_proxy_only_qst_boundary.v1",
} as const;

export type StarSimSolarMesaReproClaimId =
  (typeof STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS)[keyof typeof STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS];

export const STARSIM_SOLAR_MESA_REPRO_CLAIM_SOURCES: Record<
  StarSimSolarMesaReproClaimId,
  string[]
> = {
  [STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS.mesaExternalRuntimeRequiresHashes]:
    ["https://arxiv.org/abs/1009.1622"],
  [STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS.mesaSolarReproFixtureNotExternal]:
    ["https://arxiv.org/abs/1009.1622"],
  [STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS.mesaProfileParserRequiresIntegrationBasis]:
    ["https://arxiv.org/abs/1009.1622"],
  [STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS.mesaProfileHashSupportsReproducibility]:
    ["https://arxiv.org/abs/1009.1622"],
  [STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS.mesaHistoryHashSupportsReproducibility]:
    ["https://arxiv.org/abs/1009.1622"],
  [STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS.mesaRunLogHashSupportsReproducibility]:
    ["https://arxiv.org/abs/1009.1622"],
  [STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS.mesaSolarReproStage2GateHandoff]:
    [
      "https://arxiv.org/abs/1004.2318",
      "https://www.nature.com/articles/s41586-018-0624-y",
    ],
  [STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS.solarMesaReproNotErEprEvidence]:
    ["https://arxiv.org/abs/1306.0533"],
  [STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS.solarMesaReproProxyOnlyQstBoundary]:
    ["https://arxiv.org/abs/2411.00972"],
};

export const STARSIM_SOLAR_MESA_REPRO_UNCERTAINTY_NOTES: Record<
  StarSimSolarMesaReproClaimId,
  string
> = {
  [STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS.mesaExternalRuntimeRequiresHashes]:
    "External MESA runtime evidence depends on retained input and output hashes.",
  [STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS.mesaSolarReproFixtureNotExternal]:
    "Fixture data must remain fixture or import evidence and cannot be labeled reproduced.",
  [STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS.mesaProfileParserRequiresIntegrationBasis]:
    "Profile parsing requires mass/radius integration basis and numeric shell fields.",
  [STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS.mesaProfileHashSupportsReproducibility]:
    "Profile hashes support reproducibility checks but do not certify physical completeness.",
  [STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS.mesaHistoryHashSupportsReproducibility]:
    "History hashes support provenance checks for temporal solar calibration outputs.",
  [STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS.mesaRunLogHashSupportsReproducibility]:
    "Run-log hashes support auditability of solver execution or import actions.",
  [STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS.mesaSolarReproStage2GateHandoff]:
    "Stage 2 gate handoff is a review gate and not automatic certification.",
  [STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS.solarMesaReproNotErEprEvidence]:
    "MESA solar reproduction cannot directly establish ER=EPR or local spacetime bridge evidence.",
  [STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS.solarMesaReproProxyOnlyQstBoundary]:
    "QST use remains proxy-only and cannot promote CL0-CL4 claims.",
};

export function citationsForStarSimSolarMesaReproClaims(
  claimIds: StarSimSolarMesaReproClaimId[],
): string[] {
  return [
    ...new Set(
      claimIds.flatMap((claimId) => STARSIM_SOLAR_MESA_REPRO_CLAIM_SOURCES[claimId]),
    ),
  ];
}

export function uncertaintyNotesForStarSimSolarMesaReproClaims(
  claimIds: StarSimSolarMesaReproClaimId[],
): string[] {
  return claimIds.map((claimId) => STARSIM_SOLAR_MESA_REPRO_UNCERTAINTY_NOTES[claimId]);
}
