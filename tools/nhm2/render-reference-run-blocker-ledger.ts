import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isNhm2BlockerLedgerArtifact,
  type Nhm2BlockerLedgerArtifact,
} from "../../shared/contracts/nhm2-blocker-ledger.v1";

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const parseArgs = (argv: string[]): Record<string, string | boolean> => {
  const parsed: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next == null || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
};

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const safe = (value: unknown): string =>
  value == null ? "null" : String(value).replace(/\|/g, "\\|");

export const renderReferenceRunBlockerLedger = (
  ledger: Nhm2BlockerLedgerArtifact,
): string => {
  const sourcesChecked = ledger.literatureClaimBoundary.sourcesChecked
    .map((source) => `\`${source}\``)
    .join(", ");
  const regionalEvidenceLines = ledger.regionalBlockers.map(
    (region) => `- \`${region.regionId}\`: ${region.nextRequiredEvidence}`,
  );
  const lines = [
    "# NHM2 Frozen Reference-Run Blocker Ledger",
    "",
    "## Claim Boundary",
    "",
    "NHM2 has a frozen reference-run validation-hardening ledger that identifies source-to-geometry, observer, QEI, provenance, tensor-authority, and reproducibility blockers without promoting validation claims.",
    "",
    "This report forbids validation, solved full-warp, physical GR-plus-quantum transport, and ambient FTL claims.",
    "",
    `Run ID: \`${ledger.runId}\``,
    `Profile: \`${ledger.selectedProfileId}\``,
    `Overall state: \`${ledger.overallState}\``,
    `Primary blocker class: \`${ledger.primaryBlockerClass ?? "none"}\``,
    `Validation claim allowed: \`${ledger.claimLock.validationClaimAllowed}\``,
    `Physical mechanism claim allowed: \`${ledger.claimLock.physicalMechanismClaimAllowed}\``,
    "",
    "## Artifact Refs",
    "",
    "| Artifact | Ref |",
    "|---|---|",
  ];

  for (const [key, value] of Object.entries(ledger.artifactRefs)) {
    lines.push(`| ${key} | \`${safe(value)}\` |`);
  }

  lines.push(
    "",
    "## Gate Summary",
    "",
    "| Gate | State | Blocker class | Reasons |",
    "|---|---|---|---|",
  );
  for (const gate of ledger.gateSummary) {
    lines.push(
      `| ${gate.gateId} | ${gate.state} | ${gate.blockerClass} | ${gate.reasonCodes.map((reason) => `\`${reason}\``).join(", ") || "none"} |`,
    );
  }

  lines.push(
    "",
    "## Regional Source-To-Geometry Divergence",
    "",
    "| Region | First divergence boundary | Metric authority | Tile authority | Role | relLInf | Status | Next required evidence |",
    "|---|---|---|---|---|---:|---|---|",
  );
  for (const region of ledger.regionalBlockers) {
    lines.push(
      `| ${region.regionId} | ${region.firstDivergenceBoundary} | ${safe(region.metricTensorAuthorityMode)} | ${safe(region.tileTensorAuthorityMode)} | ${safe(region.comparisonRole)} | ${safe(region.relLInf)} | ${region.status} | ${region.nextRequiredEvidence} |`,
    );
  }

  lines.push(
    "",
    "## Tile Counterpart Provenance",
    "",
    `Tile counterpart ref: \`${safe(ledger.artifactRefs.tileEffectiveCounterpart)}\``,
    `Source tensor ref: \`${safe(ledger.tileCounterpartSource.sourceTensorArtifactRef)}\``,
    `Source tensor authority: \`${safe(ledger.tileCounterpartSource.sourceTensorAuthorityMode)}\``,
    `Tile-local source elements ref: \`${safe(ledger.tileCounterpartSource.tileLocalSourceElementsRef)}\``,
    `Tile-local source element count: \`${safe(ledger.tileCounterpartSource.tileLocalSourceElementCount)}\``,
    `Tile-local wall coverage: \`${safe(ledger.tileCounterpartSource.tileLocalSourceWallCoverage)}\``,
    `Tile-local material receipt status: \`${safe(ledger.tileCounterpartSource.tileLocalSourceMaterialReceiptStatus)}\``,
    `Tile-local first blocker: \`${safe(ledger.tileCounterpartSource.tileLocalSourceFirstBlocker)}\``,
    `Conservation status: \`${safe(ledger.tileCounterpartSource.conservationStatus)}\``,
    `QEI linkage status: \`${safe(ledger.tileCounterpartSource.qeiLinkageStatus)}\``,
    `Tile provenance audit ref: \`${safe(ledger.artifactRefs.tileCounterpartProvenanceAudit)}\``,
    "",
    "## Source-Side Same-Basis Authority",
    "",
    `Authority ref: \`${safe(ledger.tileCounterpartSource.sourceSideAuthorityRef)}\``,
    `Authority status: \`${safe(ledger.tileCounterpartSource.sourceSideAuthorityStatus)}\``,
    `Wall authority: \`${safe(ledger.tileCounterpartSource.hasWallAuthority)}\``,
    `All required regions authoritative: \`${safe(ledger.tileCounterpartSource.allRequiredRegionsAuthoritative)}\``,
    `Authority missing regions: ${ledger.tileCounterpartSource.authorityMissingRegionIds.map((regionId) => `\`${regionId}\``).join(", ") || "none"}`,
    `Source-closure pass-readiness ref: \`${safe(ledger.artifactRefs.sourceClosurePassReadiness)}\``,
    `Source-closure pass signal allowed: \`${safe(ledger.tileCounterpartSource.sourceClosurePassSignalAllowed)}\``,
    `First retirable blocker: \`${safe(ledger.tileCounterpartSource.firstRetirableBlocker)}\``,
    `Preflight blockers: ${ledger.tileCounterpartSource.preflightBlockers.map((blocker) => `\`${blocker}\``).join(", ") || "none"}`,
    "",
    "## Observer Audit Consistency",
    "",
    `Status: \`${ledger.observerBlockers.summaryVsDetailedStatus}\``,
    `Reasons: ${ledger.observerBlockers.reasonCodes.map((reason) => `\`${reason}\``).join(", ") || "none"}`,
    "",
    "## QEI/QFT Dossier",
    "",
    `Status: \`${ledger.qeiBlockers.status}\``,
    `Applicability: \`${safe(ledger.qeiBlockers.qeiApplicabilityStatus)}\``,
    `Missing fields: ${ledger.qeiBlockers.missingFields.map((field) => `\`${field}\``).join(", ") || "none"}`,
    "",
    "## Reproducibility",
    "",
    `Status: \`${ledger.reproducibilityBlockers.status}\``,
    `Missing fields: ${ledger.reproducibilityBlockers.missingFields.map((field) => `\`${field}\``).join(", ") || "none"}`,
    "",
    "## Certificate Policy",
    "",
    `Certificate status: \`${safe(ledger.certificatePolicy.certificateStatus)}\``,
    `Certificate integrity: \`${safe(ledger.certificatePolicy.certificateIntegrity)}\``,
    `Green but non-promotional: \`${ledger.certificatePolicy.greenButNonPromotional}\``,
    `Reason: \`${safe(ledger.certificatePolicy.reason)}\``,
    "",
    "## Literature Boundary",
    "",
    "External theory does not validate NHM2. Experimental or AI-assisted mathematics cannot be used as predictive physics unless converted into derivation, controls, literature, and emitted artifacts.",
    "",
    `Sources checked: ${sourcesChecked}`,
    "",
    "## Next Required Evidence",
    "",
    `Primary recommendation: ${ledger.nextPatchRecommendation}`,
    "",
    ...regionalEvidenceLines,
    "",
  );
  return `${lines.join("\n")}\n`;
};

export const renderReferenceRunBlockerLedgerFile = (args: {
  repoRoot: string;
  ledgerPath: string;
  outPath: string;
}): string => {
  const ledger = JSON.parse(readFileSync(resolvePath(args.repoRoot, args.ledgerPath), "utf8")) as unknown;
  if (!isNhm2BlockerLedgerArtifact(ledger)) {
    throw new Error("ledger must be nhm2_blocker_ledger/v1");
  }
  const markdown = renderReferenceRunBlockerLedger(ledger);
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, markdown, "utf8");
  return markdown;
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  const args = parseArgs(process.argv.slice(2));
  const ledgerPath = asString(args.ledger);
  const outPath = asString(args.out);
  if (ledgerPath == null) throw new Error("missing required --ledger");
  if (outPath == null) throw new Error("missing required --out");
  const markdown = renderReferenceRunBlockerLedgerFile({
    repoRoot: process.cwd(),
    ledgerPath,
    outPath,
  });
  process.stdout.write(markdown);
}
