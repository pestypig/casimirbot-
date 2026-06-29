import {
  extractContextCapsuleIdsFromText,
  renderContextCapsuleStampLines,
  type ContextCapsuleSummary,
} from "@shared/helix-context-capsule";
import type { ConvergenceStripState } from "@/lib/helix/reasoning-theater-convergence";

export function stripContextCapsuleTokensFromText(value: string): string {
  const ids = extractContextCapsuleIdsFromText(value);
  if (ids.length === 0) return value.trim();
  let next = value;
  for (const id of ids) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    next = next.replace(new RegExp(`\\b${escaped}\\b`, "gi"), " ");
  }
  return next.replace(/\s{2,}/g, " ").trim();
}

export function resolveContextCapsulePalette(state: ConvergenceStripState): {
  r: number;
  g: number;
  b: number;
} {
  if (state.proof === "fail_closed") return { r: 239, g: 68, b: 68 };
  if (state.source === "open_world") return { r: 244, g: 114, b: 182 };
  if (state.source === "atlas_exact") return { r: 34, g: 211, b: 238 };
  if (state.source === "repo_exact") return { r: 56, g: 189, b: 248 };
  return { r: 148, g: 163, b: 184 };
}

export function buildContextCapsuleCopyText(summary: ContextCapsuleSummary): string {
  const proofTag = summary.commit.proof_verdict ?? "UNKNOWN";
  const sourceTag = summary.convergence.source;
  const stampLines = renderContextCapsuleStampLines({
    bits: summary.stamp.finalBits,
    width: summary.stamp.gridW,
    height: summary.stamp.gridH,
    targetWidth: 10,
    targetHeight: 3,
  });
  return [
    ...stampLines,
    `proof:${proofTag}  src:${sourceTag}`,
  ].join("\n");
}
