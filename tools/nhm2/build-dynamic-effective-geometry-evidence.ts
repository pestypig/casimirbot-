import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2DynamicEffectiveGeometryEvidence,
  isNhm2DynamicEffectiveGeometryEvidence,
  type Nhm2DynamicEffectiveGeometryEvidenceV1,
} from "../../shared/contracts/nhm2-time-dependent-source-campaign.v1";
import {
  isNhm2DynamicGeometrySamplesArtifact,
  type Nhm2DynamicGeometrySamplesArtifactV1,
} from "../../shared/contracts/nhm2-dynamic-geometry-samples.v1";
import {
  isNhm2EffectiveGeometryReference,
  type Nhm2EffectiveGeometryReferenceArtifactV1,
} from "../../shared/contracts/nhm2-effective-geometry-reference.v1";
import {
  isNhm2AveragedSourceTensorReceipt,
  type Nhm2AveragedSourceTensorReceiptV1,
} from "../../shared/contracts/nhm2-averaged-source-tensor-receipt.v1";
import {
  isNhm2BackreactionResidualReceipt,
  type Nhm2BackreactionResidualReceiptV1,
} from "../../shared/contracts/nhm2-backreaction-residual-receipt.v1";

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

const readDynamicGeometrySamples = (
  repoRoot: string,
  path: string | null,
): Nhm2DynamicGeometrySamplesArtifactV1 | null => {
  if (path == null) return null;
  const resolved = resolvePath(repoRoot, path);
  if (!existsSync(resolved)) {
    throw new Error(`dynamic geometry samples missing: ${path}`);
  }
  const artifact = JSON.parse(readFileSync(resolved, "utf8")) as unknown;
  if (!isNhm2DynamicGeometrySamplesArtifact(artifact)) {
    throw new Error("dynamic geometry samples has invalid contract");
  }
  return artifact;
};

const readEffectiveGeometryReference = (
  repoRoot: string,
  path: string | null,
): Nhm2EffectiveGeometryReferenceArtifactV1 | null => {
  if (path == null) return null;
  const resolved = resolvePath(repoRoot, path);
  if (!existsSync(resolved)) {
    throw new Error(`effective geometry reference missing: ${path}`);
  }
  const artifact = JSON.parse(readFileSync(resolved, "utf8")) as unknown;
  if (!isNhm2EffectiveGeometryReference(artifact)) {
    throw new Error("effective geometry reference has invalid contract");
  }
  return artifact;
};

const readAveragedSourceTensorReceipt = (
  repoRoot: string,
  path: string | null,
): Nhm2AveragedSourceTensorReceiptV1 | null => {
  if (path == null) return null;
  const resolved = resolvePath(repoRoot, path);
  if (!existsSync(resolved)) {
    throw new Error(`averaged source tensor receipt missing: ${path}`);
  }
  const artifact = JSON.parse(readFileSync(resolved, "utf8")) as unknown;
  if (!isNhm2AveragedSourceTensorReceipt(artifact)) {
    throw new Error("averaged source tensor receipt has invalid contract");
  }
  return artifact;
};

const readBackreactionResidualReceipt = (
  repoRoot: string,
  path: string | null,
): Nhm2BackreactionResidualReceiptV1 | null => {
  if (path == null) return null;
  const resolved = resolvePath(repoRoot, path);
  if (!existsSync(resolved)) {
    throw new Error(`backreaction residual receipt missing: ${path}`);
  }
  const artifact = JSON.parse(readFileSync(resolved, "utf8")) as unknown;
  if (!isNhm2BackreactionResidualReceipt(artifact)) {
    throw new Error("backreaction residual receipt has invalid contract");
  }
  return artifact;
};

export const runNhm2DynamicEffectiveGeometryEvidence = (args: {
  repoRoot: string;
  outPath: string;
  dynamicGeometryRef?: string | null;
  effectiveGeometryRef?: string | null;
  effectiveGeometryReferencePath?: string | null;
  averagingWindowSeconds?: number | null;
  cycleAverageSourceFixed?: boolean | null;
  averagedSourceTensorRef?: string | null;
  averagedSourceTensorReceiptPath?: string | null;
  backreactionResidualReceiptPath?: string | null;
  residualLInf?: number | null;
  residualL2?: number | null;
  toleranceLInf?: number | null;
  bounded?: boolean | null;
  dynamicGeometrySamplesPath?: string | null;
}): Nhm2DynamicEffectiveGeometryEvidenceV1 => {
  const dynamicGeometrySamples = readDynamicGeometrySamples(
    args.repoRoot,
    args.dynamicGeometrySamplesPath ?? null,
  );
  const effectiveGeometryReference = readEffectiveGeometryReference(
    args.repoRoot,
    args.effectiveGeometryReferencePath ?? null,
  );
  const averagedSourceTensorReceipt = readAveragedSourceTensorReceipt(
    args.repoRoot,
    args.averagedSourceTensorReceiptPath ?? null,
  );
  const backreactionResidualReceipt = readBackreactionResidualReceipt(
    args.repoRoot,
    args.backreactionResidualReceiptPath ?? null,
  );
  const artifact = buildNhm2DynamicEffectiveGeometryEvidence({
    dynamicGeometryRef:
      args.dynamicGeometryRef ?? args.dynamicGeometrySamplesPath ?? null,
    dynamicGeometryStatus:
      dynamicGeometrySamples == null
        ? null
        : dynamicGeometrySamples.summary.dynamicGeometrySamplesAvailable
          ? "pass"
          : "missing",
    dynamicGeometryBlockers:
      dynamicGeometrySamples?.summary.firstBlocker == null
        ? []
        : [dynamicGeometrySamples.summary.firstBlocker],
    effectiveGeometryRef:
      args.effectiveGeometryRef ?? args.effectiveGeometryReferencePath ?? null,
    effectiveGeometryStatus:
      effectiveGeometryReference == null
        ? null
        : effectiveGeometryReference.summary.effectiveGeometryAvailable
          ? "pass"
          : "missing",
    effectiveGeometryBlockers:
      effectiveGeometryReference?.summary.firstBlocker == null
        ? []
        : [effectiveGeometryReference.summary.firstBlocker],
    averagingWindowSeconds: args.averagingWindowSeconds ?? null,
    cycleAverageSourceFixed: args.cycleAverageSourceFixed ?? null,
    averagedSourceTensorRef:
      args.averagedSourceTensorRef ?? args.averagedSourceTensorReceiptPath ?? null,
    backreactionResidualRef: args.backreactionResidualReceiptPath ?? null,
    blockers:
      [
        ...(averagedSourceTensorReceipt == null ||
        averagedSourceTensorReceipt.summary.averagedSourceTensorAvailable
          ? []
          : [
              averagedSourceTensorReceipt.summary.firstBlocker ??
                "averaged_source_tensor_not_pass",
            ]),
        ...(backreactionResidualReceipt == null ||
        backreactionResidualReceipt.summary.bounded
          ? []
          : [
              backreactionResidualReceipt.summary.firstBlocker ??
                "backreaction_residual_not_bounded",
            ]),
      ],
    residualLInf:
      backreactionResidualReceipt?.summary.residualLInf ?? args.residualLInf ?? null,
    residualL2:
      backreactionResidualReceipt?.summary.residualL2 ?? args.residualL2 ?? null,
    toleranceLInf: args.toleranceLInf ?? null,
    bounded: backreactionResidualReceipt?.summary.bounded ?? args.bounded ?? null,
  });
  if (!isNhm2DynamicEffectiveGeometryEvidence(artifact)) {
    throw new Error(
      "built artifact failed nhm2_dynamic_effective_geometry_evidence/v1 validation",
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
  const artifact = runNhm2DynamicEffectiveGeometryEvidence({
    repoRoot: process.cwd(),
    outPath,
    dynamicGeometryRef: asString(args["dynamic-geometry-ref"]),
    dynamicGeometrySamplesPath: asString(args["dynamic-geometry-samples"]),
    effectiveGeometryRef: asString(args["effective-geometry-ref"]),
    effectiveGeometryReferencePath: asString(args["effective-geometry-reference"]),
    averagingWindowSeconds: asNumber(args["averaging-window-seconds"]),
    cycleAverageSourceFixed: asBoolean(args["cycle-average-source-fixed"]),
    averagedSourceTensorRef: asString(args["averaged-source-tensor-ref"]),
    averagedSourceTensorReceiptPath: asString(args["averaged-source-tensor-receipt"]),
    backreactionResidualReceiptPath: asString(args["backreaction-residual-receipt"]),
    residualLInf: asNumber(args["residual-linf"]),
    residualL2: asNumber(args["residual-l2"]),
    toleranceLInf: asNumber(args["tolerance-linf"]),
    bounded: asBoolean(args.bounded),
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
}
