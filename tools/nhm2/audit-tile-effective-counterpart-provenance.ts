import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { isNhm2TileEffectiveCounterpartArtifact } from "../../shared/contracts/nhm2-tile-effective-counterpart.v1";

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

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

export const auditTileEffectiveCounterpartProvenance = (args: {
  repoRoot: string;
  counterpartPath: string;
  outPath?: string | null;
}): string => {
  const artifact = JSON.parse(
    readFileSync(resolvePath(args.repoRoot, args.counterpartPath), "utf8"),
  ) as unknown;
  if (!isNhm2TileEffectiveCounterpartArtifact(artifact)) {
    throw new Error("counterpart must be a valid nhm2_tile_effective_counterpart/v1 artifact");
  }

  const lines = [
    "# NHM2 Tile-Effective Counterpart Provenance Audit",
    "",
    `Run ID: \`${artifact.runId}\``,
    `Overall state: \`${artifact.overallState}\``,
    `Source authority mode: \`${artifact.sourceAuthorityMode}\``,
    "",
    "| Region | Role | Tensor authority | Derivation | Not metric-derived | Producer | Blockers |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const region of artifact.regions) {
    lines.push(
      `| ${region.regionId} | ${region.comparisonRole} | ${region.tensorAuthorityMode} | ${region.provenance.derivationMode} | ${region.provenance.notDerivedFromMetricRequiredTensor} | ${region.provenance.producerModule ?? "unknown"}::${region.provenance.producerFunction ?? "unknown"} | ${region.blockers.join(", ") || "none"} |`,
    );
  }
  lines.push("", "No validation or physical-mechanism claim is made by this audit.", "");
  const report = lines.join("\n");
  if (args.outPath != null) {
    const outPath = resolvePath(args.repoRoot, args.outPath);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${report}\n`, "utf8");
  }
  return `${report}\n`;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const counterpartPath = asString(args.counterpart);
  if (counterpartPath == null) throw new Error("--counterpart is required");
  const report = auditTileEffectiveCounterpartProvenance({
    repoRoot: process.cwd(),
    counterpartPath,
    outPath: asString(args.out),
  });
  process.stdout.write(report);
};

const invokedPath = process.argv[1] ? normalize(process.argv[1]) : "";
if (existsSync(invokedPath) && invokedPath === normalize(fileURLToPath(import.meta.url))) {
  main();
}
