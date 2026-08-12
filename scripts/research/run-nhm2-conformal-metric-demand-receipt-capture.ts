import path from "node:path";

import { produceNhm2ConformallyFlatNeedleMetricDemandIntervals } from "../../server/services/theory/nhm2-conformally-flat-needle-metric-demand-interval-producer";

const repositoryRoot = process.cwd();
const result = await produceNhm2ConformallyFlatNeedleMetricDemandIntervals({
  outputParentDirectory: path.join(repositoryRoot, "artifacts"),
  repositoryRoot,
  priorTerminalObservationDirectory: path.join(
    repositoryRoot,
    "artifacts",
    "nhm2-conformal-demand-308c6e2e3e9eaa94a59cc77b",
  ),
  externalWallTimeCeilingMs: 600000,
});

process.stdout.write(
  JSON.stringify({
    receiptAbsolutePath: result.receiptAbsolutePath,
    receiptSha256: result.receiptSha256,
    outputDirectoryRealPath: result.outputDirectoryRealPath,
    configurationSha256: result.receipt.configurationSha256,
    implementationSourceSha256:
      result.receipt.executionObservation.implementationSourceSha256,
    maximumRelativeFrobeniusEnclosure:
      result.receipt.priorTerminalObservation.maximumRelativeFrobeniusEnclosure,
    frozenEnclosureGate: result.receipt.frozenEnclosureGate,
    candidateInputAdmissible: result.receipt.candidateInputAdmissible,
    bitwiseReproduction: result.receipt.bitwiseReproduction,
    resourceObservation: result.receipt.resourceObservation,
  }),
);
