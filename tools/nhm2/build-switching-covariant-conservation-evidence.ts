import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2SwitchingConservationEvidence,
  isNhm2SwitchingConservationEvidence,
  type Nhm2SwitchingConservationEvidenceV1,
  type Nhm2SwitchingConservationTermId,
} from "../../shared/contracts/nhm2-time-dependent-source-campaign.v1";

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
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const asBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
};

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

export const runNhm2SwitchingCovariantConservationEvidence = (args: {
  repoRoot: string;
  outPath: string;
  staticCovariantConservationRef?: string | null;
  scheduleRef?: string | null;
  sectorBoundaryRef?: string | null;
  switchingFunctionRef?: string | null;
  toleranceLInf?: number | null;
  terms?: Partial<Record<Nhm2SwitchingConservationTermId, number | null>>;
  includedTerms?: Partial<Record<Nhm2SwitchingConservationTermId, boolean | null>>;
}): Nhm2SwitchingConservationEvidenceV1 => {
  const artifact = buildNhm2SwitchingConservationEvidence({
    staticCovariantConservationRef: args.staticCovariantConservationRef ?? null,
    scheduleRef: args.scheduleRef ?? null,
    sectorBoundaryRef: args.sectorBoundaryRef ?? null,
    switchingFunctionRef: args.switchingFunctionRef ?? null,
    toleranceLInf: args.toleranceLInf ?? null,
    terms: args.terms ?? null,
    includedTerms: args.includedTerms ?? null,
  });
  if (!isNhm2SwitchingConservationEvidence(artifact)) {
    throw new Error(
      "built artifact failed nhm2_switching_covariant_conservation_evidence/v1 validation",
    );
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  const args = parseArgs(process.argv.slice(2));
  const outPath = asString(args.out);
  if (outPath == null) {
    throw new Error("missing required --out");
  }
  const artifact = runNhm2SwitchingCovariantConservationEvidence({
    repoRoot: process.cwd(),
    outPath,
    staticCovariantConservationRef: asString(args["static-covariant-conservation-ref"]),
    scheduleRef: asString(args["schedule-ref"]),
    sectorBoundaryRef: asString(args["sector-boundary-ref"]),
    switchingFunctionRef: asString(args["switching-function-ref"]),
    toleranceLInf: asNumber(args["tolerance-linf"]),
    terms: {
      regional_support_derivative: asNumber(args["regional-support-derivative-linf"]),
      sector_boundary: asNumber(args["sector-boundary-linf"]),
      time_derivative: asNumber(args["time-derivative-linf"]),
      transition_kernel: asNumber(args["transition-kernel-linf"]),
    },
    includedTerms: {
      regional_support_derivative: asBoolean(args["include-regional-support-derivative"]),
      sector_boundary: asBoolean(args["include-sector-boundary"]),
      time_derivative: asBoolean(args["include-time-derivative"]),
      transition_kernel: asBoolean(args["include-transition-kernel"]),
    },
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
}
