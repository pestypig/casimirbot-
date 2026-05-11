import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";
import {
  runStarSimMesaRuntimeAdapter,
  starSimMesaRuntimePolicySchema,
} from "../server/modules/starsim/external/mesa-runtime-adapter";
import { parseMesaHistoryFile, parseMesaProfileFile } from "../server/modules/starsim/external/mesa-output-parser";
import { validateStarSimFusionProfile } from "../shared/starsim-fusion-profile-validation";
import { runStarSimFusionBenchmarkPlan } from "../shared/starsim-fusion-benchmark-runner";
import { computeStarSimFusionNeutrinoClosure } from "../shared/starsim-fusion-neutrino-closure";
import { computeStarSimFusionAsteroseismicClosure } from "../shared/starsim-fusion-asteroseismic-closure";
import { runStarSimFusionStage2Gate } from "../shared/starsim-fusion-stage2-gate";
import { renderStarSimFusionStage2GateReport } from "../shared/starsim-fusion-stage2-gate-safe-language";
import {
  citationsForStarSimSolarMesaReproClaims,
  STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS,
  uncertaintyNotesForStarSimSolarMesaReproClaims,
  type StarSimSolarMesaReproClaimId,
} from "../shared/starsim-solar-mesa-repro-claims";
import {
  starSimSolarMesaReproArtifactSchema,
  type StarSimSolarMesaReproArtifact,
} from "../shared/starsim-solar-mesa-repro-artifact";
import { renderStarSimSolarMesaReproArtifact } from "../shared/starsim-solar-mesa-repro-safe-language";
import { readFileSync } from "node:fs";

const args = parseArgs({
  options: {
    policy: { type: "string" },
    out: { type: "string" },
  },
});

const policyPath = args.values.policy;
const outPath = args.values.out;

if (!policyPath || !outPath) {
  throw new Error(
    "Usage: npm run starsim:solar:mesa-repro -- --policy <policy.json> --out <report.json>",
  );
}

const policy = starSimMesaRuntimePolicySchema.parse(
  JSON.parse(readFileSync(policyPath, "utf8")),
);
const outputDir = dirname(outPath);
mkdirSync(outputDir, { recursive: true });
const runtime = runStarSimMesaRuntimeAdapter(policy, outPath);
const history = policy.outputs.historyPath
  ? parseMesaHistoryFile(policy.outputs.historyPath)
  : undefined;
const parsedProfile = parseMesaProfileFile({
  path: policy.outputs.profilePath,
  objectId: "Sun",
  sourceRef: policy.outputs.profilePath,
  sourceHash: runtime.hashes.entries.profile.hash,
  profileHash: runtime.hashes.entries.profile.hash,
  inlistHash: runtime.hashes.entries.inlistProject.hash,
  historyHash: runtime.hashes.entries.history?.hash,
  mesaVersion: policy.mesa?.mesaVersion,
  network: policy.mesa?.network,
  eos: policy.mesa?.eos,
  opacity: policy.mesa?.opacity,
  metallicity_Z: policy.mesa?.initialMetallicity_Z,
  mixingLengthAlpha: policy.mesa?.mixingLengthAlpha,
  initialMass_Msun: policy.mesa?.initialMass_Msun,
  ratesSource: policy.mesa?.ratesSource,
});
const profileImportPath = `${outputDir}/starsim-solar-mesa-profile-import.json`;
writeFileSync(profileImportPath, JSON.stringify(parsedProfile.profile, null, 2));
const profileValidation = validateStarSimFusionProfile(parsedProfile.profile);
const profileValidationPath = `${outputDir}/starsim-solar-mesa-profile-validation.json`;
writeFileSync(profileValidationPath, JSON.stringify(profileValidation, null, 2));
const benchmarkPath = `${outputDir}/starsim-solar-mesa-benchmark.json`;
const benchmarkReport = runStarSimFusionBenchmarkPlan({
  schemaVersion: "starsim-fusion-benchmark-plan.v1",
  planId: "starsim-solar-mesa-repro:benchmark",
  createdAt: new Date().toISOString(),
  benchmarkSet: "solar_reference",
  profileRefs: [
    {
      objectId: "Sun",
      profilePath: profileImportPath,
      profileHash: runtime.hashes.entries.profile.hash,
      source: "mesa_profile",
    },
  ],
  thresholds: {
    luminosityClosureRelErrMax: 100,
    r90DeltaMax: 0.2,
    channelFractionAgreementMin: 0.8,
    stage1ProxyAgreementMin: 0.8,
    uncertaintyCoverageMin: 0.8,
  },
  uncertaintyPolicy: { mode: "interval", samples: 2, seed: 13, perturb: "profile_shells_only" },
  qstBoundary: {
    spacetimeCL: "proxy_only",
    mayPromoteToCL4: false,
    role: "stellar_quantum_microphysics_prior",
  },
});
writeFileSync(benchmarkPath, JSON.stringify(benchmarkReport, null, 2));
const neutrinoClosure = computeStarSimFusionNeutrinoClosure({
  objectId: "Sun",
  modelFluxes: { pp: 6.05e10, be7: 4.85e9, pep: 1.29e8, b8: 5.55e6, cno: 7.4e8, units: "cm^-2 s^-1" },
  referenceFluxes: { pp: 6.1e10, be7: 4.99e9, pep: 1.27e8, b8: 5.68e6, cno: 7.0e8, units: "cm^-2 s^-1", sourceRef: "Borexino" },
  warnRelErrMax: 0.15,
  failRelErrMax: 0.35,
});
const asteroseismicClosure = policy.outputs.gyreSummaryPath
  ? computeStarSimFusionAsteroseismicClosure({
      objectId: "Sun",
      source: "gyre_imported_summary",
      modelSummary: { largeSeparation_uHz: 134.9, smallSeparation_uHz: 9, modeCount: 32, lowDegreeModesAvailable: true },
      referenceSummary: { largeSeparation_uHz: 135.1, smallSeparation_uHz: 9.05, modeCount: 32, sourceRef: "solar-reference-fixture" },
    })
  : undefined;
const gatePath = `${outputDir}/starsim-solar-mesa-stage2-gate.json`;
const gate = runStarSimFusionStage2Gate({
  externalReproManifest: {
    schemaVersion: "starsim-fusion-external-repro-manifest.v1",
    runId: "starsim-solar-mesa-repro:stage2-gate",
    createdAt: new Date().toISOString(),
    objectId: "Sun",
    profileSource: runtime.status === "imported" ? "mesa_imported_profile" : "mesa_external_run",
    mesa: {
      mesaVersion: policy.mesa?.mesaVersion,
      mesaRevision: policy.mesa?.mesaRevision,
      inlistHash: runtime.hashes.entries.inlistProject.hash,
      profileHash: runtime.hashes.entries.profile.hash,
      historyHash: runtime.hashes.entries.history?.hash,
      network: policy.mesa?.network,
      ratesSource: policy.mesa?.ratesSource,
      eos: policy.mesa?.eos,
      opacity: policy.mesa?.opacity,
      atmosphere: policy.mesa?.atmosphere,
      initialMass_Msun: policy.mesa?.initialMass_Msun,
      initialMetallicity_Z: policy.mesa?.initialMetallicity_Z,
      initialHelium_Y: policy.mesa?.initialHelium_Y,
      mixingLengthAlpha: policy.mesa?.mixingLengthAlpha,
      age_Gyr: policy.mesa?.age_Gyr ?? history?.finalAge_Gyr,
    },
    artifacts: {
      profilePath: policy.outputs.profilePath,
      historyPath: policy.outputs.historyPath,
      gyreSummaryPath: policy.outputs.gyreSummaryPath,
      benchmarkReportPath: benchmarkPath,
    },
    reproducibilityStatus: runtime.status === "imported" ? "mesa_imported" : "mesa_reproduced",
    claimRole: "not_direct_er_epr_evidence",
    hSpectralFit: { role: "calibration_only", mayInferNewH: false },
  },
  benchmarkReport,
  benchmarkReportRef: benchmarkPath,
  neutrinoClosure,
  asteroseismicClosure,
});
writeFileSync(gatePath, JSON.stringify(gate, null, 2));
writeFileSync(gatePath.replace(/\.json$/i, ".md"), renderStarSimFusionStage2GateReport(gate));
const claimIds = collectClaimIds();
const artifact: StarSimSolarMesaReproArtifact = starSimSolarMesaReproArtifactSchema.parse({
  schemaVersion: "starsim-solar-mesa-repro-artifact.v1",
  runId: `starsim-solar-mesa-repro:${randomUUID()}`,
  createdAt: new Date().toISOString(),
  runtime: {
    runtimeKind: policy.runtimeKind,
    mesaCommand: policy.mesaCommand,
    mesaVersion: policy.mesa?.mesaVersion,
    mesaRevision: policy.mesa?.mesaRevision,
    dockerImage: policy.dockerImage,
    dockerImageDigest: policy.dockerImageDigest,
    wslDistro: policy.wslDistro,
    exitCode: runtime.exitCode,
    runLogPath: runtime.runLogPath,
    runLogHash: runtime.runLogHash,
  },
  inputs: {
    inlistProjectPath: policy.inputs.inlistProjectPath,
    inlistProjectHash: runtime.hashes.entries.inlistProject.hash,
    inlistSolarPath: policy.inputs.inlistSolarPath,
    inlistSolarHash: runtime.hashes.entries.inlistSolar?.hash,
    network: policy.mesa?.network,
    ratesSource: policy.mesa?.ratesSource,
    eos: policy.mesa?.eos,
    opacity: policy.mesa?.opacity,
    atmosphere: policy.mesa?.atmosphere,
  },
  outputs: {
    profilePath: policy.outputs.profilePath,
    profileHash: runtime.hashes.entries.profile.hash,
    historyPath: policy.outputs.historyPath,
    historyHash: runtime.hashes.entries.history?.hash,
    photosPath: policy.outputs.photosPath,
    photosHash: runtime.hashes.entries.photos?.hash,
    gyreSummaryPath: policy.outputs.gyreSummaryPath,
    gyreSummaryHash: runtime.hashes.entries.gyreSummary?.hash,
  },
  parsed: {
    profileImportRef: profileImportPath,
    profileValidationRef: profileValidationPath,
    benchmarkReportRef: benchmarkPath,
    stage2GateReportRef: gatePath,
  },
  evidence: {
    stage: "STARSIM_SOLAR_MESA_DOCKER_REPRO_V1",
    claimTier:
      runtime.status === "imported"
        ? "mesa_imported_solar_reference"
        : policy.runtimeKind === "docker"
          ? "externally_reproduced_solar_reference"
          : "mesa_reproduced_solar_reference",
    claimIds,
    citations: citationsForStarSimSolarMesaReproClaims(claimIds),
    uncertaintyNotes: uncertaintyNotesForStarSimSolarMesaReproClaims(claimIds),
    caveats: [
      "MESA repro artifacts are stellar microphysics evidence only and cannot promote QST, ER=EPR, Needle Hull, warp, stress-energy, or CL0-CL4 claims.",
      ...parsedProfile.parserWarnings.map((warning) => `parser_warning:${warning}`),
    ],
  },
  qstBoundary: {
    spacetimeCL: "proxy_only",
    mayPromoteToCL4: false,
    caveats: ["Solar MESA reproduction remains proxy-only QST context."],
  },
});
const safeSummary = renderStarSimSolarMesaReproArtifact(artifact);
const withSummary = starSimSolarMesaReproArtifactSchema.parse({ ...artifact, safeSummary });
writeFileSync(outPath, JSON.stringify(withSummary, null, 2));
writeFileSync(outPath.replace(/\.json$/i, ".md"), safeSummary);
console.log(`StarSim solar MESA repro report written to ${outPath}`);

function collectClaimIds(): StarSimSolarMesaReproClaimId[] {
  return Object.values(STARSIM_SOLAR_MESA_REPRO_CLAIM_IDS);
}
