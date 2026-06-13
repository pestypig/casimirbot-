import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2SourceComponentAuthorityLedger,
  isNhm2SourceComponentAuthorityLedger,
  type Nhm2SourceComponentAuthorityLedgerArtifactV1,
} from "../../shared/contracts/nhm2-source-component-authority-ledger.v1";
import {
  buildNhm2TileEffectiveFullTensorCounterpart,
  isNhm2TileEffectiveFullTensorCounterpart,
  type Nhm2TileEffectiveFullTensorCounterpartArtifactV1,
} from "../../shared/contracts/nhm2-tile-effective-full-tensor-counterpart.v1";
import {
  isNhm2TileEffectiveCounterpartArtifact,
  type Nhm2TileEffectiveCounterpartArtifact,
} from "../../shared/contracts/nhm2-tile-effective-counterpart.v1";

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

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

export const publishSourceComponentAuthorityLedger = (args: {
  repoRoot: string;
  tileEffectiveCounterpartPath: string;
  outPath: string;
  fullTensorCounterpartOutPath?: string | null;
  atlasRef?: string | null;
  atlasHash?: string | null;
}): {
  ledger: Nhm2SourceComponentAuthorityLedgerArtifactV1;
  fullTensorCounterpart: Nhm2TileEffectiveFullTensorCounterpartArtifactV1 | null;
} => {
  const counterpart = readJson(
    resolvePath(args.repoRoot, args.tileEffectiveCounterpartPath),
  );
  if (!isNhm2TileEffectiveCounterpartArtifact(counterpart)) {
    throw new Error("tile-effective counterpart must be nhm2_tile_effective_counterpart/v1");
  }
  const typedCounterpart: Nhm2TileEffectiveCounterpartArtifact = counterpart;
  const ledger = buildNhm2SourceComponentAuthorityLedger({
    generatedAt: new Date().toISOString(),
    laneId: typedCounterpart.laneId,
    selectedProfileId: typedCounterpart.selectedProfileId,
    runId: typedCounterpart.runId,
    counterpartArtifactRef: args.tileEffectiveCounterpartPath,
    sourceTensorArtifactRef: typedCounterpart.sourceTensorArtifactRef ?? null,
    atlasRef: args.atlasRef ?? null,
    atlasHash: args.atlasHash ?? null,
    counterpartArtifact: typedCounterpart,
  });
  if (!isNhm2SourceComponentAuthorityLedger(ledger)) {
    throw new Error("internal error: produced invalid source component authority ledger");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");

  if (args.fullTensorCounterpartOutPath == null) {
    return { ledger, fullTensorCounterpart: null };
  }

  const fullTensorCounterpart = buildNhm2TileEffectiveFullTensorCounterpart({
    generatedAt: ledger.generatedAt,
    counterpartArtifactRef: args.tileEffectiveCounterpartPath,
    componentAuthorityLedgerRef: args.outPath,
    counterpartArtifact: typedCounterpart,
    componentAuthorityLedger: ledger,
  });
  if (!isNhm2TileEffectiveFullTensorCounterpart(fullTensorCounterpart)) {
    throw new Error("internal error: produced invalid full tensor counterpart receipt");
  }
  const counterpartOutPath = resolvePath(args.repoRoot, args.fullTensorCounterpartOutPath);
  mkdirSync(dirname(counterpartOutPath), { recursive: true });
  writeFileSync(
    counterpartOutPath,
    `${JSON.stringify(fullTensorCounterpart, null, 2)}\n`,
    "utf8",
  );
  return { ledger, fullTensorCounterpart };
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  const args = parseArgs(process.argv.slice(2));
  const tileEffectiveCounterpartPath = asString(args["tile-effective-counterpart"]);
  const outPath = asString(args.out);
  if (tileEffectiveCounterpartPath == null || outPath == null) {
    throw new Error("--tile-effective-counterpart and --out are required");
  }
  const result = publishSourceComponentAuthorityLedger({
    repoRoot: process.cwd(),
    tileEffectiveCounterpartPath,
    outPath,
    fullTensorCounterpartOutPath: asString(args["full-tensor-counterpart-out"]),
    atlasRef: asString(args["atlas-ref"]),
    atlasHash: asString(args["atlas-hash"]),
  });
  process.stdout.write(`${JSON.stringify(result.ledger, null, 2)}\n`);
}
