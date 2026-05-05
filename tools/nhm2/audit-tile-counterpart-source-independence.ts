import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { isNhm2TileEffectiveFullTensorSourceArtifact } from "../../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";

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

export const renderTileCounterpartSourceIndependenceAudit = (artifactPath: string, artifact: unknown): string => {
  if (!isNhm2TileEffectiveFullTensorSourceArtifact(artifact)) {
    throw new Error("tile full tensor source must be nhm2_tile_effective_full_tensor_source/v1");
  }
  const lines = [
    "# NHM2 Tile Counterpart Source Independence Audit",
    "",
    "This audit checks source-side independence only. It does not validate NHM2, certify transport, or allow physical-mechanism language.",
    "",
    `Artifact: \`${artifactPath}\``,
    `Run ID: \`${artifact.runId}\``,
    `Overall state: \`${artifact.overallState}\``,
    `Source-side only: \`${artifact.sourceModel.sourceSideOnly}\``,
    `Not derived from metric-required tensor: \`${artifact.sourceModel.notDerivedFromMetricRequiredTensor}\``,
    `Metric-required input refs: ${artifact.sourceModel.metricRequiredInputRefs.map((ref) => `\`${ref}\``).join(", ") || "none"}`,
    "",
    "| Region | Authority | Derivation | Input refs | Blockers |",
    "|---|---|---|---|---|",
  ];
  for (const region of artifact.regions) {
    lines.push(
      `| ${region.regionId} | ${region.tensorAuthorityMode} | ${region.provenance.derivationMode} | ${region.provenance.inputRefs.map((ref) => `\`${ref}\``).join(", ") || "none"} | ${region.blockers.map((blocker) => `\`${blocker}\``).join(", ") || "none"} |`,
    );
  }
  return `${lines.join("\n")}\n`;
};

export const auditTileCounterpartSourceIndependence = (args: {
  repoRoot: string;
  tileFullTensorSourcePath: string;
  outPath: string;
}): string => {
  const path = resolvePath(args.repoRoot, args.tileFullTensorSourcePath);
  const artifact = JSON.parse(readFileSync(path, "utf8")) as unknown;
  const markdown = renderTileCounterpartSourceIndependenceAudit(args.tileFullTensorSourcePath, artifact);
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, markdown, "utf8");
  return markdown;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const sourcePath = asString(args["tile-full-tensor-source"]);
  const outPath = asString(args.out);
  if (sourcePath == null || outPath == null) {
    throw new Error("--tile-full-tensor-source and --out are required");
  }
  process.stdout.write(
    auditTileCounterpartSourceIndependence({
      repoRoot: process.cwd(),
      tileFullTensorSourcePath: sourcePath,
      outPath,
    }),
  );
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
