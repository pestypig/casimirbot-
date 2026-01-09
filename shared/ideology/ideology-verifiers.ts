import fs from "node:fs";
import path from "node:path";
import {
  IdeologyVerifierPackSchema,
  type IdeologyVerifierPack,
} from "./ideology-verifiers.schema";

export type IdeologyVerifierValidationError = {
  kind: "DUPLICATE_NODE" | "UNKNOWN_NODE";
  message: string;
  nodeId: string;
};

export function loadIdeologyVerifierPack(
  filePath: string = path.join(
    process.cwd(),
    "configs",
    "ideology-verifiers.json",
  ),
): IdeologyVerifierPack {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return IdeologyVerifierPackSchema.parse(raw);
}

/**
 * Cross-check mappings against a set of known node IDs.
 * Keep this function pure so it can run in CI, server startup, or tests.
 */
export function validateIdeologyVerifierPackAgainstNodeIds(
  pack: IdeologyVerifierPack,
  nodeIds: Set<string>,
): { ok: true } | { ok: false; errors: IdeologyVerifierValidationError[] } {
  const errors: IdeologyVerifierValidationError[] = [];

  const seen = new Set<string>();
  for (const mapping of pack.mappings) {
    if (seen.has(mapping.nodeId)) {
      errors.push({
        kind: "DUPLICATE_NODE",
        nodeId: mapping.nodeId,
        message: `Duplicate mapping for nodeId="${mapping.nodeId}".`,
      });
    }
    seen.add(mapping.nodeId);

    if (!nodeIds.has(mapping.nodeId)) {
      errors.push({
        kind: "UNKNOWN_NODE",
        nodeId: mapping.nodeId,
        message: `Mapping refers to unknown ideology nodeId="${mapping.nodeId}".`,
      });
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}
